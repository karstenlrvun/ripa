/* ======================================================================
   Cotidie — IndexedDB storage layer

   Loaded by both deck pages AND the launcher (which needs to read and write
   whole stores for backup/restore but has no use for the scheduler), so this
   deliberately depends on nothing else. fsrs.js builds bootStore() on top.

   ---- why move off localStorage ----
   NOT because of eviction. WebKit's seven-day cap on script-writable storage
   names IndexedDB, LocalStorage, SessionStorage, service workers and cache
   together, so moving between them buys exactly nothing against it. What
   protects the data is that the app is used (any interaction resets the
   timer), that it is installed to the home screen (those get their own
   counter and are not expected to be cleared at all), that sync keeps a
   server copy, and that the launcher can write a backup file.

   The reason is capacity. localStorage is about 5 MB per origin, and the two
   decks share one origin. Measured on real rows: a card is ~125 bytes and is
   written once then updated in place, while a log row is ~174 bytes and is
   appended forever. At the sizes this app is heading for -- the appendix is
   ~3,500 Greek cells against 342 today, and Latin is already 3,390 -- the
   cards come to roughly 2 MB, and the log adds about 1.8 MB per year at
   thirty reviews a day. The log, not the card set, is what runs out of room.

   ---- why the log is a separate store, keyed by index ----
   Because it is append-only and unbounded. Serialising the whole store on
   every rating means rewriting every log row ever written each time a single
   one is added: fine at a hundred rows, absurd at fifty thousand. Rows live
   in their own object store at [deckKey, index], so a rating writes exactly
   the rows that are new. Ported from vocabula, which arrived at the same
   shape for the same reason.
   ====================================================================== */

const IDB_NAME = 'cotidie', IDB_VERSION = 1;
let idb = null;
let idbBroken = false;   // set once IndexedDB has actually failed on us

// How many log rows the `log` store is believed to already hold, per deck key,
// and whether the next write must rewrite rather than append.
//
// These are two facts, not one, and collapsing them corrupts data. "I don't
// know what is stored" (logPersisted 0) is not the same as "what is stored is
// wrong and must be replaced" (logRewrite). A restore of a SHORTER log over a
// longer one needs the tail past the new end deleted -- but it also resets the
// count to 0, so a delete gated on `n < known` never fires, and the restored
// store keeps the previous one's tail spliced onto it. That is a real bug this
// had, caught by restoring a 2-row backup over a 5-row store and getting 5
// rows back, two of them from the deck that was supposedly replaced.
const logPersisted = Object.create(null);
const logRewrite = Object.create(null);
function storeReplaced(key){ logPersisted[key] = 0; logRewrite[key] = true; }

// Which rows a write must put, and whether it must delete a tail. Pulled out
// as a pure function because it is where the interesting mistake lives and
// because IndexedDB itself cannot be exercised by the test runner (neither
// Node nor JavaScriptCore has one), so this is the part that can be pinned.
//   known    rows believed already stored
//   rewrite  the stored rows cannot be trusted to correspond to these
//   n        rows the store now has
// Returns { from, deleteFrom } -- deleteFrom null means leave the tail alone.
function logWritePlan(known, rewrite, n){
  return {
    from: rewrite ? 0 : Math.min(known|0, n),
    deleteFrom: (rewrite || n < (known|0)) ? n : null
  };
}

function openIDB(){
  return new Promise(res => {
    if (idb) return res(idb);
    if (idbBroken || typeof indexedDB === 'undefined') return res(null);
    try {
      const r = indexedDB.open(IDB_NAME, IDB_VERSION);
      r.onupgradeneeded = () => {
        const db = r.result;
        if (!db.objectStoreNames.contains('state')) db.createObjectStore('state');
        if (!db.objectStoreNames.contains('log'))   db.createObjectStore('log');
      };
      r.onsuccess = () => { idb = r.result; res(idb); };
      r.onerror   = () => { idbBroken = true; res(null); };
      r.onblocked = () => { /* another tab holds an older version; onsuccess still fires once it closes */ };
    } catch(e){ idbBroken = true; res(null); }
  });
}

// The store as one object, or null when this deck has nothing stored yet.
// getAll over the [key,*] range returns rows in key order, which is index
// order, which is exactly what store.log is.
function idbReadStore(key){
  return new Promise(res => {
    if (!idb) return res(null);
    try {
      const tx = idb.transaction(['state','log'], 'readonly');
      const rq = tx.objectStore('state').get(key);
      rq.onsuccess = () => {
        const core = rq.result;
        if (!core) return res(null);
        const lr = tx.objectStore('log').getAll(IDBKeyRange.bound([key,0],[key,Infinity]));
        lr.onsuccess = () => { core.log = lr.result || []; res(core); };
        lr.onerror   = () => res(null);
      };
      rq.onerror = () => res(null);
    } catch(e){ res(null); }
  });
}

// Returns whether the writes were successfully ISSUED. IndexedDB commits
// asynchronously, so a synchronous true is not proof the bytes landed -- a
// quota failure surfaces later on the transaction's own error/abort event,
// which is where logPersisted gets reset so the next save rewrites in full.
function idbWriteStore(key, store){
  if (!idb) return false;
  try {
    const tx = idb.transaction(['state','log'], 'readwrite');
    const core = Object.assign({}, store); delete core.log;
    tx.objectStore('state').put(core, key);

    const lg = tx.objectStore('log'), n = store.log.length;
    const plan = logWritePlan(logPersisted[key]|0, !!logRewrite[key], n);
    for (let i = plan.from; i < n; i++) lg.put(store.log[i], [key, i]);
    // Anything at or past the new end has to go: either the log genuinely got
    // shorter, or this is a wholesale replacement and we cannot assume the
    // stored rows have anything to do with these ones.
    if (plan.deleteFrom !== null) lg.delete(IDBKeyRange.bound([key, plan.deleteFrom], [key, Infinity]));

    tx.oncomplete = () => { logPersisted[key] = Math.max(logPersisted[key]|0, n); };
    tx.onerror    = () => { storeReplaced(key); idbBroken = true; };
    tx.onabort    = () => { storeReplaced(key); idbBroken = true; };
    // Optimistic, so the next save does not re-put rows this transaction is
    // already carrying. The handlers above undo it if the transaction fails.
    logPersisted[key] = n; logRewrite[key] = false;
    return true;
  } catch(e){ return false; }
}

function idbDeleteStore(key){
  return new Promise(res => {
    if (!idb) return res(false);
    try {
      const tx = idb.transaction(['state','log'], 'readwrite');
      tx.objectStore('state').delete(key);
      tx.objectStore('log').delete(IDBKeyRange.bound([key,0],[key,Infinity]));
      tx.oncomplete = () => { logPersisted[key] = 0; res(true); };
      tx.onerror = () => res(false);
    } catch(e){ res(false); }
  });
}

/* ---- the local spare (2026-08-31) -------------------------------------
   One step back, per deck, kept in the `state` store beside the deck's own
   record. Written whenever something REPLACES this device's copy -- a merge,
   a pull, or a restore.

   It exists because the Worker's spare cannot cover every case. That one
   holds what the OTHER install last pushed; if the bad copy is the one that
   came from over there, the good copy up on the server has already been
   overwritten and there is nothing left to fetch. This one is whatever THIS
   device had immediately before the arrival landed.

   The whole store goes in as one record, log included -- a big write, but it
   happens on a merge, never on a rating, so it is nowhere near the hot path
   the split log store exists to protect. put() clones synchronously, so
   ratings made after this returns can never reach the stored copy.

   No IDB_VERSION bump: this is another key in a store that already exists.
   ---------------------------------------------------------------------- */
const SPARE_SUFFIX = '::spare';
let localSpareMeta = Object.create(null);   // deckKey -> {at,reason,n,label}, for a synchronous render

function saveLocalSpare(deckKey, store, reason, label){
  if (!idb || !store) return false;
  try {
    const meta = { at: Date.now(), reason: reason || 'replaced', n: store.log.length, label: label || '' };
    idb.transaction('state','readwrite').objectStore('state')
      .put(Object.assign({}, meta, { state: store }), deckKey + SPARE_SUFFIX);
    localSpareMeta[deckKey] = meta;
    return true;
  } catch(e){ return false; }
}

function readLocalSpare(deckKey){
  return new Promise(res => {
    if (!idb) return res(null);
    try {
      const r = idb.transaction('state','readonly').objectStore('state').get(deckKey + SPARE_SUFFIX);
      r.onsuccess = () => {
        const v = r.result || null;
        localSpareMeta[deckKey] = v ? { at:v.at, reason:v.reason, n:v.n, label:v.label||'' } : null;
        res(v);
      };
      r.onerror = () => res(null);
    } catch(e){ res(null); }
  });
}

// What renderSettings() can show without waiting on IndexedDB. Null until
// readLocalSpare() has run once, which the Settings screen kicks off.
function localSpareInfo(deckKey){ return localSpareMeta[deckKey] || null; }

// ---- the localStorage copy, which is now only ever a source ----
// Reads for the one-time migration below. The old copy is deliberately NOT
// deleted afterwards: it is a snapshot that cannot grow, and leaving it costs
// nothing while removing the only fallback would cost everything if the
// migration were ever wrong.
function lsReadStore(key){
  if (typeof localStorage === 'undefined') return null;
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
  catch(e){ return null; }
}

// Whole-store read for the launcher's export: IndexedDB first, falling back to
// whatever localStorage still holds for a device that has not opened the deck
// since the move.
async function readStoreAnywhere(key){
  await openIDB();
  const fromIdb = await idbReadStore(key);
  return fromIdb || lsReadStore(key);
}

// Whole-store write for the launcher's restore. Replaces rather than appends,
// so the log tail from any previous contents has to go.
async function writeStoreAnywhere(key, store){
  await openIDB();
  storeReplaced(key);
  if (idbWriteStore(key, store)) return true;
  try { localStorage.setItem(key, JSON.stringify(store)); return true; } catch(e){ return false; }
}
