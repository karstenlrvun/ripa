/* ======================================================================
   Cotidie — Cloudflare Worker cloud sync (ported from riverbank's
   sync-worker pattern, 2026-08-11, replacing cotidie's original GitHub
   Gist sync). One human-shareable "sync code" replaces the old gist
   id/token pair -- no GitHub account or token needed on any device.

   The code itself never reaches the Worker. Two independent SHA-256
   hashes are derived from it client-side:
     - one used only as the KV lookup key (sent to the Worker)
     - one used only as an AES-GCM encryption key (never sent anywhere)
   so the Worker, and anyone who can read its KV namespace, only ever sees
   an opaque key and ciphertext. Each deck also folds its own deckId
   ('latin'/'greek') into both hashes (see syncKeyMaterial() below), so
   one code typed into both decks syncs each to its own KV slot instead
   of one deck's copy overwriting the other's -- see sync-worker/worker.js
   for the server side of this.

   Kept as a standalone file, same as before -- index.html loads this
   alone for the code field (needs nothing from js/fsrs.js); each deck
   loads it after js/fsrs.js (adoptStore() below still uses deProto()/
   defaultStore() from there).

   ---- what changed on 2026-08-23 ----
   The wire format and the reconciliation both caught up with vocabula's,
   which had moved on considerably since this file was taken from it.

   The payload is now gzip'd (CompressionStream, Safari 16.4+) before
   encryption. A store is mostly repeated numbers and shrinks four- to
   five-fold, which matters on a phone pushing after every sitting. A device
   without CompressionStream sends it uncompressed and says so in the packet
   (z:0); the reader honours either, so the two can sync with each other.

   Every push carries `from`, this install's own random id, in the clear --
   it is a label, not a secret. The Worker uses it for one thing: when the
   install pushing differs from the one that pushed last, it keeps the old
   blob as a spare at /sync/:kvKey/prev before overwriting. That spare is
   the answer to "the merge went wrong and the other phone has since been
   overwritten" -- see fetchPrevStore().

   Every read and write is answered with the server's own clock, and the
   client records it (`at`/`now`). Two things depend on that: an automatic
   push can tell whether anyone else has written since this device last
   merged (pushRaceDecision), and a device whose own clock is badly wrong
   can be told so -- `ts` is what orders a merged log, and a hand-set clock
   would silently reorder ratings.

   And the big one: mergeStores(). Two devices that both studied since the
   last sync used to produce a conflict prompt, and whichever copy lost, its
   reviews were gone. They are now folded together. See that function.
   ====================================================================== */

const SYNC_ENDPOINT = 'https://cotidie-sync.karsten-vun.workers.dev';

const SYNC_SHARED_KEY = 'cotidie.sync.v1';

/* ---- where each deck's review store lives, and the backup file format ----
   One definition, read by both deck pages and by the launcher's export and
   import. These used to be a bare string literal repeated in latin.html and
   greek.html, which is fine until the day one of them is edited. */
const STORE_KEYS = { latin: 'cotidie.latin.v1', greek: 'cotidie.greek.v1' };
const BACKUP_APP = 'cotidie';
const BACKUP_FORMAT = 1;

// One file holds BOTH decks, each under its own name. Naming the deck inside
// the file is the point: vocabula shipped a restore that inferred the deck
// from whichever page you happened to open the file on, and an unstamped file
// therefore restored into the wrong deck and remapped every card id. Here a
// file that does not say what it is gets rejected outright rather than
// guessed at.
function buildBackup(stores, now){
  return {
    app: BACKUP_APP,
    format: BACKUP_FORMAT,
    exportedAt: (now==null ? Date.now() : now),
    decks: Object.keys(STORE_KEYS).reduce((o,k)=>{ if (stores[k]) o[k]=stores[k]; return o; }, {})
  };
}

// Pure validation of a parsed backup: returns {ok:true, decks} or
// {ok:false, error}. Every rejection names what was wrong, because the one
// thing worse than refusing a good backup is silently accepting a bad one.
function readBackup(parsed){
  if (!parsed || typeof parsed!=='object' || Array.isArray(parsed))
    return { ok:false, error:"That file isn't a Cotidie backup." };
  if (parsed.app !== BACKUP_APP)
    return { ok:false, error: parsed.app
      ? "That backup is from " + String(parsed.app).slice(0,32) + ", not Cotidie."
      : "That file doesn't say which app it came from, so it won't be restored." };
  if (!(parsed.format <= BACKUP_FORMAT))
    return { ok:false, error:"That backup was written by a newer version of Cotidie than this one." };
  const src = parsed.decks;
  if (!src || typeof src!=='object' || Array.isArray(src))
    return { ok:false, error:"That backup has no decks in it." };
  const decks = {};
  Object.keys(STORE_KEYS).forEach(k => {
    const d = src[k];
    if (d && typeof d==='object' && d.cards && typeof d.cards==='object' && Array.isArray(d.log)) decks[k]=d;
  });
  if (!Object.keys(decks).length)
    return { ok:false, error:"That backup has no Latin or Greek review data in it." };
  return { ok:true, decks };
}

// The code lives ONLY here -- see this file's header comment. So does the
// install id, which shares the blob for the same reason the code does: both
// are things every deck page and the launcher must agree on, and neither
// belongs inside a deck's store where it would ride along into a payload.
function loadSyncShared(){
  if (typeof localStorage === 'undefined') return { syncCode:'', installId: mintedInstallId||(mintedInstallId=randomInstallId()) };
  let cur = {};
  try { cur = JSON.parse(localStorage.getItem(SYNC_SHARED_KEY)) || {}; } catch(e){}
  if (cur && typeof cur === 'object' && Object.prototype.hasOwnProperty.call(cur,'__proto__')) delete cur['__proto__'];
  const out = {
    syncCode: (typeof cur.syncCode === 'string') ? cur.syncCode : '',
    installId: (typeof cur.installId === 'string' && INSTALL_ID_RE.test(cur.installId)) ? cur.installId : ''
  };
  // One permanent random id per COPY of the app -- per storage origin, which
  // is exactly the unit that forks: Safari and a home-screen icon on the same
  // phone are two installs. Minted here, the first time anything reads this
  // blob; never changed; never sent anywhere except as a plaintext label on a
  // push, which the Worker compares to decide whether to keep a spare copy.
  // Not a secret, and NOT identity for merging -- rows merge on (cardId, ts),
  // so a device that never had an id still merges correctly.
  if (!out.installId){ out.installId = mintedInstallId || (mintedInstallId = randomInstallId()); saveSyncShared(out); }
  mintedInstallId = out.installId;   // stable for this session even if localStorage refuses the write (quota, private mode)
  return out;
}
let mintedInstallId = null;
const INSTALL_ID_RE = /^[a-z0-9]{8}$/;
function randomInstallId(){
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let s = ''; for (let i=0; i<8; i++) s += chars[bytes[i]%chars.length];
  return s;
}
function installId(){ return loadSyncShared().installId || ''; }

// Every writer of the shared blob must carry the keys it does not own.
// Vocabula's launcher wrote back only the fields it knew about and silently
// dropped the others each time; this spreads what is already there first, so
// a field added later cannot be erased by an older code path.
function saveSyncShared(g){
  if (typeof localStorage === 'undefined') return;
  try {
    let cur = {}; try { cur = JSON.parse(localStorage.getItem(SYNC_SHARED_KEY)) || {}; } catch(e){}
    if (cur && typeof cur === 'object' && Object.prototype.hasOwnProperty.call(cur,'__proto__')) delete cur['__proto__'];
    const next = Object.assign({}, cur, { syncCode: g.syncCode||'' });
    if (g.installId) next.installId = g.installId;
    localStorage.setItem(SYNC_SHARED_KEY, JSON.stringify(next));
  } catch(e){}
}

/* ---- what this device knows about its own last sync (2026-08-31) ------
   Per deck, and in the shared blob rather than in the deck's store, for the
   same reason the code and the install id are: the store is the thing that
   gets pushed, so a per-device fact kept in it would ride along in the
   payload and arrive on the other device claiming to be its own.

   Before this, the Settings screen held its note in a module-level variable
   and so said "Not synced yet this session" after every reload -- which reads
   exactly like "never synced", the one thing it most needs not to say.
   ---------------------------------------------------------------------- */
function loadSyncStatus(deckId){
  if (typeof localStorage === 'undefined') return {};
  try {
    const cur = JSON.parse(localStorage.getItem(SYNC_SHARED_KEY)) || {};
    const st = cur.status && cur.status[deckId];
    return (st && typeof st === 'object') ? st : {};
  } catch(e){ return {}; }
}
// Read-modify-write, like saveSyncShared() and for the same reason: two decks
// and the launcher all write this one blob, and a writer that replaced it
// wholesale would drop whatever the other deck had just recorded.
function saveSyncStatus(deckId, patch){
  if (typeof localStorage === 'undefined') return;
  try {
    let cur = {}; try { cur = JSON.parse(localStorage.getItem(SYNC_SHARED_KEY)) || {}; } catch(e){}
    if (cur && typeof cur === 'object' && Object.prototype.hasOwnProperty.call(cur,'__proto__')) delete cur['__proto__'];
    const status = Object.assign({}, cur.status);
    status[deckId] = Object.assign({}, status[deckId], patch);
    localStorage.setItem(SYNC_SHARED_KEY, JSON.stringify(Object.assign({}, cur, { status: status })));
  } catch(e){}
}

// How far this deck has drifted from the last copy that reached the server.
// Pure so the threshold can be pinned by a test without a browser.
const BACKUP_WARN_RATINGS = 150;
function ratingsSinceBackup(logLen, pushedLogLen){
  const since = (logLen|0) - (pushedLogLen|0);
  return since > 0 ? since : 0;
}

function loadSyncCode(){ return { syncCode: loadSyncShared().syncCode }; }
function saveSyncCode(syncCode){ saveSyncShared({ syncCode: syncCode||'', installId: installId() }); }

// A readable, hard-to-transcribe-wrong code: no 0/O/1/I. Ported verbatim
// from riverbank/settings.html's randomSyncCode().
function randomSyncCode(){
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  let s = ''; for (let i=0; i<10; i++){ s += chars[bytes[i]%chars.length]; if (i===4) s += '-'; }
  return s;
}

// Pure -- just the two strings that get hashed, split out from syncKeys()
// so the deckId namespacing can be verified without touching Web Crypto.
function syncKeyMaterial(code, deckId){
  return { kvInput:'kv:'+code+':'+deckId, encInput:'enc:'+code+':'+deckId };
}
async function syncKeys(code, deckId){
  const enc = new TextEncoder();
  const mat = syncKeyMaterial(code, deckId);
  const kv = await crypto.subtle.digest('SHA-256', enc.encode(mat.kvInput));
  const ek = await crypto.subtle.digest('SHA-256', enc.encode(mat.encInput));
  const kvKey = Array.from(new Uint8Array(kv)).map(b=>b.toString(16).padStart(2,'0')).join('');
  const cryptoKey = await crypto.subtle.importKey('raw', ek, 'AES-GCM', false, ['encrypt','decrypt']);
  return { kvKey, cryptoKey };
}
// Chunked. String.fromCharCode.apply on a whole multi-hundred-KB buffer blows
// the argument limit on Safari, and a payload here is that big even gzip'd.
function b64(buf){
  const u = new Uint8Array(buf); let s = '';
  for (let i=0; i<u.length; i+=0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i+0x8000));
  return btoa(s);
}
function unb64(s){ return Uint8Array.from(atob(s), c=>c.charCodeAt(0)); }

async function gzipBytes(bytes){
  if (typeof CompressionStream === 'undefined') return null;
  const cs = new CompressionStream('gzip');
  const w = cs.writable.getWriter(); w.write(bytes); w.close();
  return new Uint8Array(await new Response(cs.readable).arrayBuffer());
}
async function gunzipBytes(bytes){
  const ds = new DecompressionStream('gzip');
  const w = ds.writable.getWriter(); w.write(bytes); w.close();
  return new Uint8Array(await new Response(ds.readable).arrayBuffer());
}

// {v:1, iv, data, z} -- z:1 means the plaintext was gzip'd before encryption.
// Compress first, encrypt second: the other order compresses ciphertext,
// which is incompressible by construction. `z` is a flag rather than a
// requirement so a browser without CompressionStream still syncs, and so a
// packet written by one can be read by the other.
async function encryptPayload(obj, cryptoKey){
  let plain = new TextEncoder().encode(JSON.stringify(obj)), z = 0;
  const gz = await gzipBytes(plain);
  if (gz && gz.length < plain.length){ plain = gz; z = 1; }
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({name:'AES-GCM', iv:iv}, cryptoKey, plain);
  return { v:1, iv: b64(iv), data: b64(data), z: z };
}
async function decryptPayload(pkt, cryptoKey){
  if (!pkt || typeof pkt.iv!=='string' || typeof pkt.data!=='string') throw new Error('bad packet');
  let buf = new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM', iv:unb64(pkt.iv)}, cryptoKey, unb64(pkt.data)));
  if (pkt.z) buf = await gunzipBytes(buf);
  return JSON.parse(new TextDecoder().decode(buf));
}

// Never let the code itself leave the device inside the payload -- it isn't
// part of store.settings today (same as the old gist token never was), but
// this is the one place to enforce that invariant if that ever changes.
function sanitisedStore(store){ return store; }

// Matches the Worker's own cap. A push this size cannot land, so it is worth
// saying so with a real number rather than letting it come back as HTTP 413.
const SYNC_MAX_BYTES = 8*1024*1024;
// keepalive lets a PUT survive the tab being closed or backgrounded a beat
// after it fires. The Fetch spec turns a keepalive request over ~64 KiB into
// an outright network error rather than just dropping the flag, so it must
// never be set on a push that size. Pure, so the boundary can be pinned by a
// test without a real fetch.
const SYNC_KEEPALIVE_MAX = 64*1024;
function shouldKeepalive(bytes){ return bytes <= SYNC_KEEPALIVE_MAX; }

// How far this device's clock is from the sync server's, in ms, positive when
// this device is ahead. Null until a request has actually been answered.
// Worth surfacing because `ts` orders a merged log: a phone an hour fast
// writes rows that sort after everything the other device does for the next
// hour, silently. Warn, never refuse -- refusing would only stop the backup.
let clockSkewMs = null;
function syncClockSkew(){ return clockSkewMs; }
function noteServerTime(serverNow, localNow){
  if (!Number.isFinite(serverNow)) return;
  clockSkewMs = ((localNow!=null) ? localNow : Date.now()) - serverNow;
}
const CLOCK_SKEW_WARN = 5*60*1000;
// Pure: the sentence to show, or '' when the clock is close enough to ignore.
function clockSkewMessage(skew){
  if (!Number.isFinite(skew) || Math.abs(skew) <= CLOCK_SKEW_WARN) return '';
  const m = Math.round(Math.abs(skew)/60000);
  return 'This device\u2019s clock is ' + m + ' minute' + (m===1?'':'s') +
         (skew>0 ? ' ahead of' : ' behind') + ' the sync server \u2014 sync orders ratings by the clock, so check the time setting.';
}

async function pushStore(store, code, deckId){
  if (!code) return { ok:false, error:'missing sync code' };
  try {
    const { kvKey, cryptoKey } = await syncKeys(code, deckId);
    const pkt = await encryptPayload(sanitisedStore(store), cryptoKey);
    // `from`: this install's id, in the clear. The Worker keeps the previous
    // blob as a spare only when the install pushing differs from the one that
    // pushed last -- see sync-worker/worker.js, "Insurance".
    pkt.from = installId();
    const body = JSON.stringify(pkt);
    const bytes = body.length;
    if (bytes > SYNC_MAX_BYTES) return { ok:false, error:'too large ('+Math.round(bytes/1024)+' KB)', bytes:bytes };
    const opts = { method:'PUT', headers:{'Content-Type':'application/json'}, body: body };
    if (shouldKeepalive(bytes)) opts.keepalive = true;
    const r = await fetch(SYNC_ENDPOINT+'/sync/'+kvKey, opts);
    if (!r.ok) return { ok:false, error:'HTTP '+r.status, bytes:bytes };
    // The PUT answer's `now` IS the `at` the Worker just stored on the blob --
    // it writes one Date.now() into both. Recording it means this device's own
    // write is never later read as "someone else pushed", which would order a
    // pointless merge before every automatic push after the first.
    let now = null, kept = 0;
    try {
      const j = await r.json();
      if (j && Number.isFinite(j.now)){ noteServerTime(j.now); now = j.now; kept = j.kept|0; }
    } catch(e){}   // a pre-2026-08-23 Worker answers plain text; harmless
    return { ok:true, bytes:bytes, now:now, kept:kept };
  } catch(e){ return { ok:false, error:e.message||String(e) }; }
}

// `which` is 'prev' to read the spare copy the Worker kept when the OTHER
// install last pushed -- the recovery path for "this device merged badly and
// then pushed over the good copy".
async function fetchStore(code, deckId, which){
  if (!code) return { ok:false, error:'missing sync code' };
  try {
    const { kvKey, cryptoKey } = await syncKeys(code, deckId);
    const r = await fetch(SYNC_ENDPOINT+'/sync/'+kvKey+(which==='prev' ? '/prev' : ''));
    if (r.status===404) return { ok:false, missing:true, error: which==='prev'
      ? 'no spare copy has been kept under this code yet'
      : 'nothing synced under this code yet' };
    if (!r.ok) return { ok:false, error:'HTTP '+r.status };
    const pkt = await r.json();
    if (Number.isFinite(pkt.now)) noteServerTime(pkt.now);
    const store = await decryptPayload(pkt, cryptoKey);
    // `at` and `from` come from outside the ciphertext on purpose: the Worker
    // stamps them, so neither can be forged by a client with a stale clock.
    return { ok:true, store:store, at: Number.isFinite(pkt.at)?pkt.at:null,
             from: (typeof pkt.from==='string')?pkt.from:'', now: Number.isFinite(pkt.now)?pkt.now:null };
  } catch(e){ return { ok:false, error:e.message||String(e) }; }
}
function fetchPrevStore(code, deckId){ return fetchStore(code, deckId, 'prev'); }

// syncDecision() lived here until 2026-08-23 and is deliberately gone rather
// than left unused. It compared each side's log length against a "base" --
// the length both sides last agreed on -- and returned in-sync / push-local /
// take-remote / conflict. Every branch of it was correct. What was not
// correct was the only value its callers could supply for `base` on a freshly
// loaded page: `store.log.length`, this device's own length, under which
// local can never read as having moved and a genuine fork therefore came out
// as 'take-remote' -- silently replacing this device's reviews. mergeStores()
// needs no base and takes no branch, so the whole shape of that mistake is
// gone rather than guarded against.

// ===========================================================================
// The merge. Two devices that both studied since the last sync no longer
// have to be a choice.
//
// This is where cotidie deliberately diverges from vocabula rather than
// copying it. Vocabula's mergeStates() is several hundred lines because
// vocabula STORES its derived data -- per-day counters, study time, sitting
// records, tombstones -- and every one of those has to be reconciled by its
// own rule. Cotidie stores none of that: stats.js computes every day figure
// from the log on demand, and introducedOn() rescans the log rather than
// keeping a counter, both explicitly so they could not drift. That decision,
// made for a different reason, is what makes this function short.
//
// So there are only four things here, and the whole design follows from one
// rule: THE MERGE MUST NOT KNOW WHICH SIDE IS LOCAL. Both devices run it on
// the same pair and must reach byte-identical results, or they push
// different "merged" stores back at each other forever. Every tie below is
// broken on content, never on role.
//
//   1. log      union on (cardId, ts) -- a rep is "which card, and when".
//                Sorted by ts. A row present on both sides is taken from
//                whichever copy recorded MORE of it, because a row written
//                by a newer build carries the timing split (tfk/typ/keys/fl)
//                and an older one does not; then by content.
//
//   2. cards    last writer wins, per card, by card.last.
//
//                The honest limitation, stated rather than buried: if BOTH
//                devices drilled the SAME card since the last sync, the
//                losing side's rep still survives in the log -- so stats,
//                day counts and any future replay are complete -- but its
//                effect on that card's schedule is dropped. It is counted
//                as stats.both and named in the summary, so it is visible
//                when it happens rather than silent. Cotidie could do
//                better than any of this one day, because its card states
//                are fully derivable from its log by replaying schedule();
//                that is written down in evergreen/NEXT_SESSION.md rather
//                than done here, because replaying uses TODAY'S settings and
//                would quietly rewrite intervals that were shown under
//                yesterday's.
//
//   3. settings whole object, from whichever copy was studied more recently.
//                Not field-by-field: mixing produces a settings object
//                neither device ever had, and "the one you were last
//                studying on wins" is a rule that can be explained in a
//                sentence. Ties break on content, so it still converges.
//
//   4. anything else  carried symmetrically. A top-level field added by a
//                newer build survives a merge with an older copy that has
//                never heard of it, instead of being dropped by whichever
//                side happened to be local.
// ===========================================================================

// Stable stringify: keys sorted, so two objects with the same content always
// compare equal. Used only for tie-breaking and comparison, never stored.
function canonJSON(v){
  if (v===null || typeof v!=='object') { const j = JSON.stringify(v); return j===undefined ? 'null' : j; }
  if (Array.isArray(v)) return '[' + v.map(canonJSON).join(',') + ']';
  return '{' + Object.keys(v).sort().map(k => JSON.stringify(k)+':'+canonJSON(v[k])).join(',') + '}';
}

// A rep's identity. NUL as the separator because a cardId is built from a
// word slug, a category and a cell joined by colons, any of which could in
// principle contain one; none can contain a NUL.
function logRowKey(r){ return String(r && r.cardId) + '\u0000' + String(r && r.ts); }

// Symmetric: the wider row wins, then the greater content. Never "local's".
function pickLogRow(a, b){
  if (!b) return a;
  if (!a) return b;
  const ka = Object.keys(a).length, kb = Object.keys(b).length;
  if (ka !== kb) return ka > kb ? a : b;
  return canonJSON(a) >= canonJSON(b) ? a : b;
}

// A card with no review yet sorts below one that has been reviewed.
function cardStamp(c){ return (c && Number.isFinite(c.last)) ? c.last : -1; }
function pickCard(a, b){
  const oa = !!(a && typeof a === 'object'), ob = !!(b && typeof b === 'object');
  if (!ob) return oa ? a : null;
  if (!oa) return b;
  const sa = cardStamp(a), sb = cardStamp(b);
  if (sa !== sb) return sa > sb ? a : b;
  // Same last-reviewed instant on both sides but not the same card: the one
  // that has been through more reps is the later state (a card cannot lose
  // reps). Then content, so this is still total and still symmetric.
  const ra = a.reps|0, rb = b.reps|0;
  if (ra !== rb) return ra > rb ? a : b;
  return canonJSON(a) >= canonJSON(b) ? a : b;
}

// When this copy was last actually used. The log is the only honest source --
// `created` is a fallback for a store that has never been reviewed in.
function lastActivity(st){
  const log = (st && Array.isArray(st.log)) ? st.log : [];
  let m = -1;
  for (let i=0; i<log.length; i++){ const t = log[i] && log[i].ts; if (Number.isFinite(t) && t > m) m = t; }
  if (m >= 0) return m;
  return Number.isFinite(st && st.created) ? st.created : -1;
}

const MERGE_KNOWN_FIELDS = ['version','created','settings','cards','log','flags'];

// Returns { store, stats }. Pure: no clock, no storage, no network -- which
// is what lets the whole thing be tested, and why the tests can assert the
// property that matters (merge(A,B) === merge(B,A)) rather than just spot
// cases.
function mergeStores(local, remote){
  const L = (local && typeof local === 'object') ? local : {};
  const R = (remote && typeof remote === 'object') ? remote : {};
  const stats = { fromRemote:0, fromLocal:0, both:[], cardsFromRemote:0, cardsFromLocal:0,
                  prefsFrom:'same', total:0 };
  const out = {};

  // --- 4. unknown fields first, so the known ones below always win ---
  const extra = new Set([...Object.keys(L), ...Object.keys(R)].filter(k => MERGE_KNOWN_FIELDS.indexOf(k) < 0));
  extra.forEach(k => {
    const a = L[k], b = R[k];
    if (a === undefined){ out[k] = b; return; }
    if (b === undefined){ out[k] = a; return; }
    out[k] = canonJSON(a) >= canonJSON(b) ? a : b;
  });

  out.version = Math.max(L.version|0, R.version|0) || 1;
  const created = [L.created, R.created].filter(Number.isFinite);
  if (created.length) out.created = Math.min.apply(null, created);

  // --- 1. the log ---
  const lRows = new Map(), rRows = new Map();
  (Array.isArray(L.log) ? L.log : []).forEach(r => { if (r && typeof r === 'object') lRows.set(logRowKey(r), r); });
  (Array.isArray(R.log) ? R.log : []).forEach(r => { if (r && typeof r === 'object') rRows.set(logRowKey(r), r); });
  const merged = [], localOnly = [], remoteOnly = [];
  lRows.forEach((r, k) => {
    const rr = rRows.get(k);
    merged.push(pickLogRow(r, rr));
    if (!rr) localOnly.push(r);
  });
  rRows.forEach((r, k) => { if (!lRows.has(k)){ merged.push(r); remoteOnly.push(r); } });
  // Sorted by time, then by content, so two devices holding the same set of
  // rows always produce the same ARRAY and not merely the same contents.
  merged.sort((a, b) => (a.ts - b.ts) || (canonJSON(a) < canonJSON(b) ? -1 : canonJSON(a) > canonJSON(b) ? 1 : 0));
  out.log = merged;
  stats.fromLocal = localOnly.length;
  stats.fromRemote = remoteOnly.length;
  stats.total = merged.length;
  // Cards each side reviewed while the other was not looking: exactly the
  // ones where rule 2 has to discard a schedule update. Nothing else needs
  // this, but he should be able to see it happen.
  { const lo = new Set(localOnly.map(r => r.cardId)), both = new Set();
    remoteOnly.forEach(r => { if (lo.has(r.cardId)) both.add(r.cardId); });
    stats.both = [...both].sort(); }

  // --- 2. the cards ---
  { const lc = (L.cards && typeof L.cards === 'object') ? L.cards : {};
    const rc = (R.cards && typeof R.cards === 'object') ? R.cards : {};
    const cards = {};
    new Set([...Object.keys(lc), ...Object.keys(rc)]).forEach(id => {
      if (id === '__proto__') return;              // never reparent the object being built
      const a = lc[id], b = rc[id];
      const w = pickCard(a, b);
      if (!w) return;
      if (!a) stats.cardsFromRemote++;
      else if (!b) stats.cardsFromLocal++;
      else if (canonJSON(a) !== canonJSON(b)) { if (w === a) stats.cardsFromLocal++; else stats.cardsFromRemote++; }
      cards[id] = Object.assign({}, w);
    });
    out.cards = cards; }

  // --- 3. the settings ---
  { const ls = (L.settings && typeof L.settings === 'object') ? L.settings : null;
    const rs = (R.settings && typeof R.settings === 'object') ? R.settings : null;
    if (!ls && !rs) out.settings = {};
    else if (!rs){ out.settings = Object.assign({}, ls); }
    else if (!ls){ out.settings = Object.assign({}, rs); stats.prefsFrom = 'remote'; }
    else if (canonJSON(ls) === canonJSON(rs)) out.settings = Object.assign({}, ls);
    else {
      const la = lastActivity(L), ra = lastActivity(R);
      let takeRemote;
      if (la !== ra) takeRemote = ra > la;
      else takeRemote = canonJSON(rs) > canonJSON(ls);
      out.settings = Object.assign({}, takeRemote ? rs : ls);
      stats.prefsFrom = takeRemote ? 'remote' : 'local';
    } }

  // --- 5. the flags ---
  // Newest stamp per cell wins, which is why setFlag() writes an {on:false}
  // tombstone rather than deleting the key: taking the union of the keys
  // PRESENT on either side cannot represent a flag that was cleared, so an
  // unflag on the phone would be silently undone by the next merge from the
  // Mac. Ties break on content rather than on side, so merge(A,B) ===
  // merge(B,A) -- the property the suite already asserts for the whole store.
  { const lf = (L.flags && typeof L.flags === 'object') ? L.flags : {};
    const rf = (R.flags && typeof R.flags === 'object') ? R.flags : {};
    const flags = {};
    // Sorted, not merely deduplicated. The set's iteration order follows
    // whichever side was passed as `local`, so an unsorted build produced
    // the same VALUES in a different key order on the two devices -- equal
    // under canonJSON, but not byte-identical as JSON, which is what gets
    // uploaded. The log is sorted for exactly this reason; so is this.
    [...new Set([...Object.keys(lf), ...Object.keys(rf)])].sort().forEach(id => {
      if (id === '__proto__') return;              // never reparent the object being built
      const a = (lf[id] && typeof lf[id] === 'object') ? lf[id] : null;
      const b = (rf[id] && typeof rf[id] === 'object') ? rf[id] : null;
      if (!a && !b) return;
      if (!a){ flags[id] = Object.assign({}, b); return; }
      if (!b){ flags[id] = Object.assign({}, a); return; }
      const at = a.at | 0, bt = b.at | 0;
      const w = (at !== bt) ? (at > bt ? a : b) : (canonJSON(a) >= canonJSON(b) ? a : b);
      flags[id] = Object.assign({}, w);
    });
    out.flags = flags; }

  return { store: out, stats: stats };
}

// One sentence, for a toast. Pure so it can be tested without a browser.
function mergeSummary(stats){
  if (!stats) return 'Merged.';
  const bits = [];
  if (stats.fromRemote) bits.push(stats.fromRemote + ' review' + (stats.fromRemote===1?'':'s') + ' from the other device');
  if (stats.fromLocal)  bits.push(stats.fromLocal  + ' from this one');
  let msg = bits.length ? ('Merged: ' + bits.join(', ') + '.') : 'Already up to date.';
  if (stats.both && stats.both.length){
    const n = stats.both.length;
    msg += ' ' + n + ' card' + (n===1?' was':'s were') + ' drilled on both \u2014 every rep is in the history, but ' +
           (n===1?'its':'their') + ' schedule follows the later device.';
  }
  return msg;
}

// Pure: whether an automatic, unattended push must merge before it writes.
// pushStore() serialises whatever is in memory and PUTs it unconditionally --
// there is no compare-and-swap on the Worker -- so without this, two devices
// pushing inside each other's debounce window silently clobber one another.
// `at` is the server-stamped time of the blob currently on the server;
// lastRemoteAt is the newest server write this device has already taken in
// (stamped by its own successful push, and by every merge it applies).
//
// 'push' on a failed fetch or an empty slot is deliberate: both are exactly
// the old behaviour, and being offline must never block a push. 'push' on a
// blob with no stamp at all (one written by the pre-2026-08-23 client) is the
// same call -- with no date there is nothing to compare, and merging blind on
// every push would cost a full walk of the log per write.
function pushRaceDecision(inc, lastRemoteAt){
  if (inc && inc.ok && Number.isFinite(inc.at) && inc.at > (lastRemoteAt||0)) return 'merge-first';
  return 'push';
}

// Swaps in a fetched store wholesale -- unchanged from the gist version.
// Runs the incoming payload through the same deProto()+defaultStore()
// hardening loadStore() applies to localStorage content: a synced payload
// is exactly the "arrived from outside this device" case that motivated
// deProto() in the first place.
function adoptStore(incoming){
  const clean = deProto(Object.assign({}, incoming));
  if (clean.settings) deProto(clean.settings);
  if (clean.cards) Object.keys(clean.cards).forEach(k => deProto(clean.cards[k]));
  return Object.assign(defaultStore(), clean);
}

// Confirm-before-overwrite safeguard when this device already has a
// different code saved -- never names the code's own value (it's the
// secret itself, same trust level the old gist token had). Cancel is a
// genuine no-op.
function syncCodeReplaceMessage(){
  return 'This device already has a sync code set up.\n\n' +
    'OK = replace it with the new one. This device will stop syncing with anything still on the old code.\n' +
    'Cancel = keep the code this device already has.';
}
