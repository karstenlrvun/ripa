/*
 * riverbank sync worker — a minimal key/value relay so a learner never has to
 * create a GitHub token or gist to sync progress between devices, plus a
 * small feedback inbox.
 *
 * ===== Sync =====
 * The client derives two independent SHA-256 hashes from its sync code:
 *   - one used only as the KV lookup key (sent to this Worker)
 *   - one used only as an AES-GCM encryption key (never sent anywhere)
 * so this Worker, and anyone who can read its KV namespace, only ever sees
 * an opaque key and ciphertext. The sync code itself never reaches here.
 *
 *   PUT /sync/:kvKey   body: {"iv":"<base64>","data":"<base64 ciphertext>"}
 *   GET /sync/:kvKey   -> the same {"iv":...,"data":...} object, or 404
 *
 * ===== Feedback =====
 * A one-way inbox: the app can send a short message, this Worker stores it,
 * nothing reads it back out over HTTP (read via `wrangler kv key list` /
 * `wrangler kv key get`, or the dashboard, not through this API). Guards:
 *   - message length clamped to FEEDBACK_MIN_CHARS..FEEDBACK_MAX_CHARS
 *   - a hidden honeypot field ("hp") — a real user never fills it in; if it's
 *     non-empty the request is silently discarded (but still answered 200,
 *     so a scripted sender doesn't learn anything from the response)
 *   - control characters stripped before storage
 *   - per-IP rate limit: one submission per FEEDBACK_MIN_INTERVAL_MS, and a
 *     hard daily cap of FEEDBACK_DAILY_CAP -- IPs are hashed before being
 *     used as a KV key, so raw IP addresses are never written to disk
 *   - stored as a JSON string value, never evaluated or rendered as HTML by
 *     anything in this Worker -- if a future admin view ever displays these
 *     messages, it MUST escape them before inserting into a page; this
 *     Worker only guarantees safe storage, not safe display
 *
 *   POST /feedback   body: {"message":"...", "deck":"latin"|"greek"|"italian"|"sat", "hp":""}
 *
 * Deploy:
 *   0. node test.mjs   (mocks env/KV in-process -- run this after any edit here)
 *   1. npm install -g wrangler   (if you don't have it already)
 *   2. wrangler login
 *   3. wrangler kv namespace create RIVERBANK_SYNC
 *      wrangler kv namespace create RIVERBANK_FEEDBACK
 *      -> paste both returned ids into wrangler.toml
 *   4. wrangler deploy
 *   5. copy the resulting workers.dev URL into SYNC_ENDPOINT in each deck's
 *      <script> (already done once this Worker's URL was known)
 *
 * riverbank-sync.karsten-vun.workers.dev is already deployed and live for
 * /sync/*. /feedback was added after that deploy -- RIVERBANK_FEEDBACK must
 * be created and bound in wrangler.toml (step 3 above) and `wrangler deploy`
 * run again before feedback actually gets collected. Until then POST
 * /feedback 500s; the client already treats any non-2xx as "could not send"
 * and shows a toast rather than breaking, so this is safe to leave until
 * it's convenient to redeploy.
 *
 * There is deliberately no auth, no accounts, and no per-user quota on sync --
 * the "account" is the sync code itself, exactly like the gist id/token pair
 * it replaces. Anyone holding a given code can read and overwrite that one
 * blob, same as anyone holding a gist's id+token could before.
 */

const MAX_BODY_BYTES = 2 * 1024 * 1024; // a full study history is a few hundred KB at most
const KV_KEY_RE = /^[0-9a-f]{64}$/;      // exactly a hex-encoded SHA-256 digest

const FEEDBACK_MAX_CHARS = 500;
const FEEDBACK_MIN_CHARS = 3;
const FEEDBACK_MAX_BODY_BYTES = 4000;         // generous ceiling before we even try to parse JSON
const FEEDBACK_MIN_INTERVAL_MS = 60 * 1000;   // one submission per minute per IP
const FEEDBACK_DAILY_CAP = 20;                // per IP per UTC day
const ALLOWED_DECKS = new Set(['latin', 'greek', 'italian', 'sat']);

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(null, origin) });

    const url = new URL(request.url);

    const syncMatch = url.pathname.match(/^\/sync\/([^/]+)$/);
    if (syncMatch) return handleSync(request, env, syncMatch[1], origin);

    if (url.pathname === '/feedback') return handleFeedback(request, env, origin);

    return new Response('Not found', { status: 404, headers: corsHeaders(null, origin) });
  }
};

async function handleSync(request, env, kvKey, origin) {
  if (!KV_KEY_RE.test(kvKey)) return new Response('Bad key', { status: 400, headers: corsHeaders(null, origin) });

  if (request.method === 'GET') {
    const stored = await env.RIVERBANK_SYNC.get(kvKey);
    if (stored == null) return new Response('Not found', { status: 404, headers: corsHeaders(null, origin) });
    return new Response(stored, { headers: corsHeaders('application/json', origin) });
  }

  if (request.method === 'PUT') {
    const body = await request.text();
    if (body.length > MAX_BODY_BYTES) return new Response('Too large', { status: 413, headers: corsHeaders(null, origin) });
    let parsed;
    try { parsed = JSON.parse(body); } catch { return new Response('Bad JSON', { status: 400, headers: corsHeaders(null, origin) }); }
    if (typeof parsed.iv !== 'string' || typeof parsed.data !== 'string') {
      return new Response('Expected {iv, data}', { status: 400, headers: corsHeaders(null, origin) });
    }
    await env.RIVERBANK_SYNC.put(kvKey, JSON.stringify({ iv: parsed.iv, data: parsed.data }));
    return new Response('OK', { headers: corsHeaders('text/plain', origin) });
  }

  return new Response('Method not allowed', { status: 405, headers: corsHeaders(null, origin) });
}

async function handleFeedback(request, env, origin) {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders(null, origin) });

  const raw = await request.text();
  if (raw.length > FEEDBACK_MAX_BODY_BYTES) return new Response('Too large', { status: 413, headers: corsHeaders(null, origin) });

  let body;
  try { body = JSON.parse(raw); } catch { return new Response('Bad JSON', { status: 400, headers: corsHeaders(null, origin) }); }

  // Honeypot: a hidden field real users never see or fill in. A non-empty
  // value means a bot filled every field it could find -- answer as if it
  // worked (so nothing distinguishes success from silent rejection) but
  // never touch KV.
  if (typeof body.hp === 'string' && body.hp.trim() !== '') {
    return new Response('OK', { headers: corsHeaders('text/plain', origin) });
  }

  if (typeof body.message !== 'string') {
    return new Response('Expected {message}', { status: 400, headers: corsHeaders(null, origin) });
  }
  const message = sanitizeText(body.message);
  if (message.length < FEEDBACK_MIN_CHARS) return new Response('Message too short', { status: 400, headers: corsHeaders(null, origin) });
  if (message.length > FEEDBACK_MAX_CHARS) return new Response('Message too long', { status: 400, headers: corsHeaders(null, origin) });

  const deck = ALLOWED_DECKS.has(body.deck) ? body.deck : 'unknown';

  // Rate limit by IP, hashed before it ever becomes a KV key so no raw IP
  // address is written to disk. Cloudflare sets CF-Connecting-IP at the
  // edge -- a client cannot forge it.
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const ipHash = await sha256Hex(ip);
  const now = Date.now();

  const throttleKey = 'throttle:' + ipHash;
  const lastStr = await env.RIVERBANK_FEEDBACK.get(throttleKey);
  if (lastStr && (now - parseInt(lastStr, 10)) < FEEDBACK_MIN_INTERVAL_MS) {
    return new Response('Please wait a bit before sending more feedback', { status: 429, headers: corsHeaders('text/plain', origin) });
  }

  const countKey = 'count:' + ipHash + ':' + dayStamp(now);
  const countStr = await env.RIVERBANK_FEEDBACK.get(countKey);
  const count = countStr ? parseInt(countStr, 10) : 0;
  if (count >= FEEDBACK_DAILY_CAP) {
    return new Response('Daily feedback limit reached', { status: 429, headers: corsHeaders('text/plain', origin) });
  }

  const id = now + '-' + crypto.randomUUID();
  await env.RIVERBANK_FEEDBACK.put('fb:' + id, JSON.stringify({ message, deck, ts: now }));
  await env.RIVERBANK_FEEDBACK.put(throttleKey, String(now), { expirationTtl: 3600 });
  await env.RIVERBANK_FEEDBACK.put(countKey, String(count + 1), { expirationTtl: 86400 });

  return new Response('OK', { headers: corsHeaders('text/plain', origin) });
}

// Strips control characters (keeping newlines and tabs) and trims. This is
// storage hygiene, not an HTML-escaping step -- the message is stored as a
// plain JSON string and never interpreted as markup by this Worker. Anything
// that later displays it in a web page must escape it there, at render time.
function sanitizeText(s) {
  return s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
}

function dayStamp(ms) {
  return new Date(ms).toISOString().slice(0, 10); // YYYY-MM-DD, UTC
}

async function sha256Hex(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Locked to the deployed app's own origin(s) -- add another entry here if a
// custom domain ever gets attached to the site. Anything else calling this
// Worker (from a browser) gets no Access-Control-Allow-Origin header at all,
// which browsers treat as a cross-origin block regardless of the response
// body/status underneath it.
const ALLOWED_ORIGINS = new Set([
  'https://ripa.karsten-vun.workers.dev'
]);
function corsHeaders(contentType, origin) {
  const h = {
    'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) h['Access-Control-Allow-Origin'] = origin;
  if (contentType) h['Content-Type'] = contentType;
  return h;
}
