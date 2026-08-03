import worker from './worker.js';

function makeKV() {
  const store = new Map();
  return {
    async get(key) { return store.has(key) ? store.get(key) : null; },
    async put(key, value) { store.set(key, value); },
    _store: store,
  };
}

let passed = 0, failed = 0;
function ok(name, cond, detail) {
  if (cond) { passed++; console.log('PASS', name); }
  else { failed++; console.log('FAIL', name, detail !== undefined ? JSON.stringify(detail) : ''); }
}

async function req(url, opts) {
  return worker.fetch(new Request(url, opts), env);
}

const env = { RIVERBANK_SYNC: makeKV(), RIVERBANK_FEEDBACK: makeKV() };

// --- OPTIONS preflight on any path ---
{
  const r = await req('https://x/feedback', { method: 'OPTIONS' });
  ok('OPTIONS /feedback -> 200', r.status === 200);
}

// --- CORS is locked to the deployed app's own origin, not wide open ---
{
  const allowed = await req('https://x/feedback', {
    method: 'OPTIONS', headers: { Origin: 'https://ripa.karsten-vun.workers.dev' }
  });
  ok('allowed origin gets Access-Control-Allow-Origin echoed back',
    allowed.headers.get('Access-Control-Allow-Origin') === 'https://ripa.karsten-vun.workers.dev');

  const stranger = await req('https://x/feedback', {
    method: 'OPTIONS', headers: { Origin: 'https://evil.example.com' }
  });
  ok('an unrelated origin gets no Access-Control-Allow-Origin header at all',
    stranger.headers.get('Access-Control-Allow-Origin') === null);

  const none = await req('https://x/feedback', { method: 'OPTIONS' });
  ok('no Origin header sent -> no Access-Control-Allow-Origin header either',
    none.headers.get('Access-Control-Allow-Origin') === null);
}

// --- unknown path ---
{
  const r = await req('https://x/nope');
  ok('unknown path -> 404', r.status === 404);
}

// --- sync: bad key format ---
{
  const r = await req('https://x/sync/not-hex');
  ok('sync bad key -> 400', r.status === 400);
}

// --- sync: GET missing -> 404 ---
{
  const key = 'a'.repeat(64);
  const r = await req('https://x/sync/' + key);
  ok('sync GET missing -> 404', r.status === 404);
}

// --- sync: PUT then GET round-trip ---
{
  const key = 'b'.repeat(64);
  const put = await req('https://x/sync/' + key, {
    method: 'PUT', body: JSON.stringify({ iv: 'AA==', data: 'BB==' })
  });
  ok('sync PUT -> 200', put.status === 200);
  const get = await req('https://x/sync/' + key);
  const body = await get.json();
  ok('sync GET round-trips', body.iv === 'AA==' && body.data === 'BB==', body);
}

// --- sync: PUT bad shape ---
{
  const key = 'c'.repeat(64);
  const r = await req('https://x/sync/' + key, { method: 'PUT', body: JSON.stringify({ foo: 'bar' }) });
  ok('sync PUT bad shape -> 400', r.status === 400);
}

// --- sync: too-large body ---
{
  const key = 'd'.repeat(64);
  const huge = 'x'.repeat(3 * 1024 * 1024);
  const r = await req('https://x/sync/' + key, { method: 'PUT', body: huge });
  ok('sync PUT too large -> 413', r.status === 413);
}

// --- feedback: happy path ---
{
  const r = await req('https://x/feedback', {
    method: 'POST',
    headers: { 'CF-Connecting-IP': '1.1.1.1' },
    body: JSON.stringify({ message: 'Please add example sentences', deck: 'latin', hp: '' })
  });
  ok('feedback happy path -> 200', r.status === 200, await r.clone().text());
  const stored = [...env.RIVERBANK_FEEDBACK._store.entries()].filter(([k]) => k.startsWith('fb:'));
  ok('feedback actually stored', stored.length === 1, stored);
  ok('feedback stored as plain JSON string, not HTML', stored.length && !stored[0][1].includes('<'), stored[0]?.[1]);
}

// --- feedback: honeypot triggers silent discard ---
{
  const before = [...env.RIVERBANK_FEEDBACK._store.entries()].filter(([k]) => k.startsWith('fb:')).length;
  const r = await req('https://x/feedback', {
    method: 'POST',
    headers: { 'CF-Connecting-IP': '2.2.2.2' },
    body: JSON.stringify({ message: 'buy cheap watches now', deck: 'latin', hp: 'i am a bot' })
  });
  const after = [...env.RIVERBANK_FEEDBACK._store.entries()].filter(([k]) => k.startsWith('fb:')).length;
  ok('honeypot -> still 200 (bot cannot tell)', r.status === 200);
  ok('honeypot -> nothing stored', after === before, { before, after });
}

// --- feedback: too short ---
{
  const r = await req('https://x/feedback', {
    method: 'POST', headers: { 'CF-Connecting-IP': '3.3.3.3' },
    body: JSON.stringify({ message: 'hi', deck: 'latin', hp: '' })
  });
  ok('feedback too short -> 400', r.status === 400);
}

// --- feedback: too long ---
{
  const r = await req('https://x/feedback', {
    method: 'POST', headers: { 'CF-Connecting-IP': '4.4.4.4' },
    body: JSON.stringify({ message: 'x'.repeat(501), deck: 'latin', hp: '' })
  });
  ok('feedback too long -> 400', r.status === 400);
}

// --- feedback: bad deck falls back to 'unknown', still accepted ---
{
  const r = await req('https://x/feedback', {
    method: 'POST', headers: { 'CF-Connecting-IP': '5.5.5.5' },
    body: JSON.stringify({ message: 'a message with a bogus deck field', deck: '<script>evil</script>', hp: '' })
  });
  ok('feedback bad deck -> still 200', r.status === 200);
  const entries = [...env.RIVERBANK_FEEDBACK._store.entries()].filter(([k]) => k.startsWith('fb:'));
  const last = JSON.parse(entries[entries.length - 1][1]);
  ok('bad deck value not stored verbatim', last.deck === 'unknown', last);
}

// --- feedback: control characters stripped ---
{
  const r = await req('https://x/feedback', {
    method: 'POST', headers: { 'CF-Connecting-IP': '6.6.6.6' },
    body: JSON.stringify({ message: 'line one\x00\x01\x07 line two with junk bytes', deck: 'latin', hp: '' })
  });
  ok('feedback with control chars -> 200', r.status === 200);
  const entries = [...env.RIVERBANK_FEEDBACK._store.entries()].filter(([k]) => k.startsWith('fb:'));
  const last = JSON.parse(entries[entries.length - 1][1]);
  ok('control chars stripped from stored message', !/[\x00-\x08]/.test(last.message), last.message);
}

// --- feedback: rate limit, same IP too soon ---
{
  const r1 = await req('https://x/feedback', {
    method: 'POST', headers: { 'CF-Connecting-IP': '7.7.7.7' },
    body: JSON.stringify({ message: 'first message from this ip', deck: 'latin', hp: '' })
  });
  const r2 = await req('https://x/feedback', {
    method: 'POST', headers: { 'CF-Connecting-IP': '7.7.7.7' },
    body: JSON.stringify({ message: 'second message immediately after', deck: 'latin', hp: '' })
  });
  ok('rate limit: first -> 200', r1.status === 200);
  ok('rate limit: immediate second -> 429', r2.status === 429);
}

// --- feedback: different IP not affected by another IP's throttle ---
{
  const r = await req('https://x/feedback', {
    method: 'POST', headers: { 'CF-Connecting-IP': '8.8.8.8' },
    body: JSON.stringify({ message: 'a fresh ip should not be throttled', deck: 'latin', hp: '' })
  });
  ok('different IP unaffected by another IP throttle', r.status === 200);
}

// --- feedback: daily cap ---
{
  const ip = '9.9.9.9';
  let lastStatus;
  for (let i = 0; i < 21; i++) {
    // bypass the 60s throttle by clearing it each loop (simulating a day of spread-out submissions)
    const ipHash = await (async () => {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    })();
    await env.RIVERBANK_FEEDBACK.put('throttle:' + ipHash, '0'); // pretend the last send was at time 0
    const r = await req('https://x/feedback', {
      method: 'POST', headers: { 'CF-Connecting-IP': ip },
      body: JSON.stringify({ message: 'daily cap test message number ' + i, deck: 'latin', hp: '' })
    });
    lastStatus = r.status;
    if (i < 20) ok('daily cap: submission ' + (i + 1) + '/20 -> 200', r.status === 200);
  }
  ok('daily cap: 21st submission -> 429', lastStatus === 429);
}

// --- feedback: malformed JSON ---
{
  const r = await req('https://x/feedback', {
    method: 'POST', headers: { 'CF-Connecting-IP': '10.10.10.10' },
    body: 'not json{{{'
  });
  ok('feedback malformed JSON -> 400', r.status === 400);
}

// --- feedback: wrong method ---
{
  const r = await req('https://x/feedback', { method: 'GET' });
  ok('feedback GET -> 405 (no public read)', r.status === 405);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
