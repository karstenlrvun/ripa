/* ======================================================================
   Cotidie — FSRS-6 scheduler (forked from vocabula's own implementation)
   plus the auto-grading translation layer the Cotidianum plan called for.

   The weight array P[] below is copied verbatim from vocabula's latin.html,
   which was itself checked directly against FSRS-6's published defaults
   (byte-for-byte match, confirmed in the Cotidianum addendum session 3 --
   not re-verified independently here, inherited as already-confirmed).

   Deliberately NOT forked from vocabula for v1: the "drill layer" (same-day
   repetition / consecutive-day requirement) and the "weekly review day"
   nudge. Both are real refinements vocabula earned through actual use;
   porting them before Cotidie has any real review history of its own would
   be tuning against nothing. Core FSRS-6 math is forked faithfully; the
   wrapper around it is intentionally simpler. Revisit once there's real
   daily-use data (see HANDOFF.md open items).

   Plain top-level declarations, no module wrapping -- loads after
   engine.js (uses its orderedCells()); see latin-paradigms.js's tail note.
   ====================================================================== */

const P=[0.212,1.2931,2.3065,8.2956,6.4133,0.8334,3.0194,0.001,1.8722,0.1666,0.796,
         1.4835,0.0614,0.2629,1.6483,0.6014,1.8729,0.5425,0.0912,0.0658,0.1542];
const DECAY=-P[20], FACTOR=Math.pow(0.9,1/DECAY)-1;
const FSRS_MIN=60000, FSRS_HOUR=3600000, FSRS_DAY=86400000;
const S_MIN=0.001;
const AGAIN=1, HARD=2, GOOD=3, EASY=4;
const LEARN_STEPS=[1*FSRS_MIN,10*FSRS_MIN], RELEARN_STEPS=[10*FSRS_MIN];

// Guards a review card's day-boundary snap (schedule(), below) against
// landing only minutes after `now` when a card is rated close to the
// rollover boundary -- ported from vocabula's own fix (2026.08.07.3,
// retuned once after an earlier flat-half-interval version over-corrected).
// A flat 3h floor, not half the interval: half-interval was tried first and
// bumped ordinary evening/night sessions (this app's rollover options are
// all small-hours) a full extra day out, since most sessions land in the
// back half of the study day. SNAP_GUARD only needs to be big enough that a
// snapped review can never be mistaken for a genuinely short learning/
// relearning step (at most 10 minutes here); it doesn't need to preserve
// anything close to a full day.
const SNAP_GUARD=3*FSRS_HOUR;

// ---- day-boundary math, same rollover convention as vocabula ----
function dayKey(ts, rolloverHour){
  const h = (rolloverHour==null) ? 4 : rolloverHour;
  return Math.floor((ts - new Date(ts).getTimezoneOffset()*60000 - h*FSRS_HOUR) / FSRS_DAY);
}
function dayStart(k, rolloverHour){
  const h = (rolloverHour==null) ? 4 : rolloverHour;
  const off = h*FSRS_HOUR;
  let t = k*FSRS_DAY + off;
  for(let i=0;i<3;i++) t = k*FSRS_DAY + off + new Date(t).getTimezoneOffset()*60000;
  return t;
}

// ---- rollover changes take effect at the next study-day boundary ----
// Moving the boundary is retroactive by nature: reviews already logged would
// re-bucket into different days the instant the hour changed, so a study-day
// calendar would rewrite its own history. Instead a change is *pending*
// until the start of the next study day measured under the OLD hour, which
// is the first moment at which no already-logged review can change day.
// Ported from vocabula's own handling of this.
function effRollover(settings, now){
  const cur = (settings && settings.rollover!=null) ? settings.rollover : 4;
  if (!settings || settings.rolloverPending==null || settings.rolloverPendingFrom==null) return cur;
  return now >= settings.rolloverPendingFrom ? settings.rolloverPending : cur;
}
// Folds a matured pending change into `rollover` itself. Mutates. Safe to
// call on every load and every render -- it is a no-op until the boundary.
function commitRollover(settings, now){
  if (!settings || settings.rolloverPending==null || settings.rolloverPendingFrom==null) return settings;
  if (now >= settings.rolloverPendingFrom){
    settings.rollover = settings.rolloverPending;
    settings.rolloverPending = null;
    settings.rolloverPendingFrom = null;
  }
  return settings;
}
// Schedules a change for the next study-day boundary under the current hour.
// Choosing the hour it already has clears any pending change instead.
function setRollover(settings, hour, now){
  const cur = (settings.rollover!=null) ? settings.rollover : 4;
  if (hour===cur){ settings.rolloverPending=null; settings.rolloverPendingFrom=null; }
  else { settings.rolloverPending=hour; settings.rolloverPendingFrom=dayStart(dayKey(now,cur)+1,cur); }
  return settings;
}

const clampD = d => Math.min(Math.max(d,1),10);
const clampS = s => Math.max(s,S_MIN);
const initS = r => clampS(P[r-1]);
const initD = (r,clamp) => { const d=P[4]-Math.exp(P[5]*(r-1))+1; return clamp?clampD(d):d; };

function retrievability(card, now){
  if (card.s==null || card.last==null) return 0;
  const el = Math.max((now-card.last)/FSRS_DAY, 0);
  return Math.pow(1+FACTOR*el/card.s, DECAY);
}
function nextInterval(s, retention, maxIvl){
  let d = (s/FACTOR)*(Math.pow(retention,1/DECAY)-1);
  d = Math.round(d);
  return Math.min(Math.max(d,1), maxIvl);
}
function shortTermS(s,r){
  let inc = Math.exp(P[17]*(r-3+P[18]))*Math.pow(s,-P[19]);
  // Floor covers Hard as well as Good/Easy -- Again is the only grade that
  // may reduce same-day stability. Was GOOD||EASY, which let a *correct*
  // answer graded Hard drive stability down rep after rep (see the Hard arm
  // in schedule() below; the two faults compounded). Matches vocabula's
  // `if(r>=HARD)`, ported 2026-08-21.
  if (r>=HARD) inc = Math.max(inc,1);
  return clampS(s*inc);
}
function nextD(d,r){
  const a1 = initD(EASY,false);
  const delta = -(P[6]*(r-3));
  const a2 = d+(10-d)*delta/9;
  return clampD(P[7]*a1+(1-P[7])*a2);
}
function forgetS(d,s,R){
  const long = P[11]*Math.pow(d,-P[12])*(Math.pow(s+1,P[13])-1)*Math.exp((1-R)*P[14]);
  const short = s/Math.exp(P[17]*P[18]);
  return Math.min(long,short);
}
function recallS(d,s,R,r){
  const hard=(r===HARD)?P[15]:1, easy=(r===EASY)?P[16]:1;
  return s*(1+Math.exp(P[8])*(11-d)*Math.pow(s,-P[9])*(Math.exp((1-R)*P[10])-1)*hard*easy);
}
function nextS(d,s,R,r){
  return clampS(r===AGAIN ? forgetS(d,s,R) : recallS(d,s,R,r));
}

function freshCard(){
  return { st:'L', step:0, s:null, d:null, due:null, last:null, reps:0, lapses:0 };
}

// card.st: 'L' learning, 'R' review, 'X' relearning
// settings: {retention, maxIvl, rollover}
function schedule(card, rating, now, settings){
  const c = Object.assign({}, card);
  const roll = effRollover(settings, now);
  const daysSince = (c.last!=null) ? (dayKey(now,roll)-dayKey(c.last,roll)) : null;
  let ivl = 0;
  const toReview = () => { c.st='R'; c.step=null; ivl=nextInterval(c.s, settings.retention, settings.maxIvl)*FSRS_DAY; };
  const steps = (c.st==='L') ? LEARN_STEPS : RELEARN_STEPS;

  if (c.st==='L' || c.st==='X'){
    if (c.s==null || c.d==null){ c.s=initS(rating); c.d=initD(rating,true); }
    else if (daysSince!=null && daysSince<1){ c.s=shortTermS(c.s,rating); c.d=nextD(c.d,rating); }
    else { c.s=nextS(c.d,c.s,retrievability(c,now),rating); c.d=nextD(c.d,rating); }

    if (steps.length===0 || (c.step>=steps.length && rating!==AGAIN)) toReview();
    else if (rating===AGAIN){ c.step=0; ivl=steps[0]; }
    else if (rating===GOOD||rating===HARD){
      // Hard advances exactly as Good does, and graduates from the final
      // step. Until 2026-08-21 this arm repeated the current step for Hard
      // (Anki's behaviour), which meant a card could never leave learning
      // while it kept being graded Hard -- and gradeToRating() handed out
      // Hard for any correct answer slower than 15s, so a consistently slow
      // but correct answer looped at one minute forever. Every non-Again
      // press advances now, so no same-day loop can form. "Shorter than
      // Good" is not tuned here: initS/nextS/shortTermS have already applied
      // Hard's own weights and toReview() reads the stability they produced.
      // Ported from vocabula 2026.08.19.3. Unreachable in normal play since
      // grading collapsed to Again/Good (see gradeToRating), and kept
      // correct anyway so a restored four-grade mode isn't a landmine.
      if (c.step+1===steps.length) toReview();
      else { c.step+=1; ivl=steps[c.step]; }
    }
    else toReview(); // Easy
  } else { // Review
    if (daysSince!=null && daysSince<1) c.s=shortTermS(c.s,rating);
    else c.s=nextS(c.d,c.s,retrievability(c,now),rating);
    c.d=nextD(c.d,rating);
    if (rating===AGAIN){
      c.lapses=(c.lapses||0)+1;
      if (RELEARN_STEPS.length===0) ivl=nextInterval(c.s, settings.retention, settings.maxIvl)*FSRS_DAY;
      else { c.st='X'; c.step=0; ivl=RELEARN_STEPS[0]; }
    } else ivl = nextInterval(c.s, settings.retention, settings.maxIvl)*FSRS_DAY;
  }

  c.last=now; c.due=now+ivl; c.reps=(c.reps||0)+1;

  // Review cards are due by study day, not by clock -- a batch studied at
  // 14:00 shouldn't be held back until 14:00 the next day.
  //
  // The snap always rounds *down* onto a boundary, which quietly eats
  // however much of the current study day has already gone. Harmless for a
  // long interval (a ten-day card loses at most a day out of ten) and
  // ruinous for a one-day one: rated at 03:45 against a 4am rollover, "one
  // day" became the boundary fifteen minutes away. Fixed by rounding up to
  // the next boundary instead whenever rounding down would land within
  // SNAP_GUARD of now (ported from vocabula, see SNAP_GUARD's own comment).
  // Can only ever fire for a one-day interval -- an N-day one lands at
  // least (N-1) days out, already clear of SNAP_GUARD for every N>=2.
  if (c.st==='R' && c.due-now>=FSRS_DAY){
    const ivlDays = Math.max(Math.round((c.due-now)/FSRS_DAY),1);
    let snapped = dayStart(dayKey(now,roll)+ivlDays, roll);
    if (snapped-now < SNAP_GUARD) snapped = dayStart(dayKey(now,roll)+ivlDays+1, roll);
    c.due = snapped;
  }
  return { card:c, ivl:c.due-now };
}

// ---- auto-grading translation layer ----
// Two grades: Again when the typed form is wrong, Good when it is right.
// Nothing about *how long* it took feeds the grade any more (2026-08-21).
//
// Why, in one paragraph. The old mapping cut Again/Hard/Good/Easy out of the
// answer's total latency, which fuses recall time with typing time. Greek
// forms here run 4 to 13 keystrokes and the Hoplite diacritics are 19% of
// all keypresses, so long forms were penalised for being long: measured
// across the deck, at 2 keystrokes/second 35% of cells could not reach Easy
// however well they were known, while the 15s Hard gate was never reached by
// typing alone at any rate. So Hard was a real recall signal and Easy was
// largely a typing-speed signal -- an asymmetry no choice of threshold
// fixes. Meanwhile correctness here is a string match: machine-measured and
// essentially noise-free. Collapsing to Again/Good deletes the noisy axis and
// keeps the clean one; Anki's own FSRS documentation calls using only Again
// and Good a supported configuration, sometimes a more accurate one.
//
// Latency is still measured and still logged, in more detail than before
// (see recordReview) -- it just no longer decides anything. If graded speed
// ever comes back it should use absolute cut-points chosen once from the
// real histogram and frozen, never rolling quantiles, and it must never
// produce Hard while a card is still in learning.
function gradeToRating(correct){
  return correct ? GOOD : AGAIN;
}

// ---- storage: log every rep from day one, independent of which analysis
// features exist yet (explicit ground rule from the Cotidianum plan) ----
// Each language gets its own localStorage key (passed in, not hardcoded --
// this used to be a single hardcoded 'cotidie.latin.v1' constant, which
// worked when there was only Latin but would have silently merged Greek's
// review history into Latin's the moment a second language existed).
function defaultStore(){
  return {
    version: 1,
    created: Date.now(),
    // newPerDay: how many never-seen cells a day may introduce. 0 means no
    // limit, which is the shipped default -- Karsten's call 2026-08-21, on
    // the grounds that he does not yet know his own pace through material he
    // partly knows. The machinery is here so it is one number away when he
    // does; buildQueue() is the only thing that reads it.
    settings: { retention: 0.90, maxIvl: 36500, rollover: 4,
                rolloverPending: null, rolloverPendingFrom: null, newPerDay: 0 },
    cards: {},   // cardId -> card state
    // cardId -> {on, at}. One flag, on or off, per CELL -- his call
    // 2026-08-30 over vocabula's seven colours. Cleared flags are kept as
    // {on:false} tombstones rather than deleted, because mergeStores() takes
    // the newer stamp per cell and a union of present keys cannot express a
    // deletion; see setFlag() in js/stats.js.
    flags: {},
    // {ts, cardId, lemma, category, cell, correct, latencyMs, rating, ivl,
    //  tfk, typ, keys, fl} -- the last four are the timing split, see
    // recordReview(). Short keys deliberately: the log, not the card set, is
    // what grows without bound (measured: ~174 bytes a row before these,
    // against ~125 bytes for a card that is written once and then updated in
    // place), and localStorage is ~5 MB for both decks together.
    log: []
  };
}

// Drops a hostile own `__proto__` key before anything touches the object --
// a crafted backup, or (once gist sync, HANDOFF.md §10e, exists) a crafted
// sync payload from another device, could otherwise silently reparent
// whatever loadStore() builds, and every later `store.something` lookup
// would start finding values it chose instead. Nothing in this app has ever
// stored a field by that name, so there's nothing real to lose by dropping
// it. Ported from vocabula's own security pass (2026-08-08).
function deProto(o){
  if (o && typeof o==='object' && Object.prototype.hasOwnProperty.call(o,'__proto__')) delete o['__proto__'];
  return o;
}

function loadStore(key){
  if (typeof localStorage === 'undefined') return defaultStore();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultStore();
    const parsed = deProto(JSON.parse(raw));
    if (parsed && typeof parsed==='object'){
      if (parsed.settings) deProto(parsed.settings);
      if (parsed.cards) Object.keys(parsed.cards).forEach(k => deProto(parsed.cards[k]));
      if (parsed.flags) Object.keys(parsed.flags).forEach(k => deProto(parsed.flags[k]));
    }
    // Object.assign is shallow, so a stored `settings` object would replace
    // the default one entirely and any setting added after that store was
    // last written would read back as undefined -- silently, and differently
    // depending on how old the install is. Merge settings key by key so a
    // new default is always present. (Same family of trap as vocabula's
    // "write card-field defaults unconditionally".)
    // Take the defaults BEFORE the assign: Object.assign mutates `base`, so
    // reading base.settings afterwards would read the stored object that
    // just replaced it and merge a thing into itself.
    const defaults = defaultStore().settings;
    const out = Object.assign(defaultStore(), parsed);
    out.settings = Object.assign({}, defaults, (parsed && parsed.settings) || {});
    return out;
  } catch(e){ return defaultStore(); }
}
// The pre-2026-08-21 write path. Kept because loadStore() above is still the
// migration source and both are still worth testing; nothing in the running
// app calls this any more -- see persistStore().
function saveStore(key, store){
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(key, JSON.stringify(store)); } catch(e){}
}

// ---- storage of record: IndexedDB, with localStorage as the migration source
// and the last-resort fallback. js/store.js carries the layer and the reasons.
//
// Boot is asynchronous now, which is the whole cost of this change: a deck
// cannot render until its store has been read. Everything downstream stays
// synchronous, because the in-memory store is authoritative for the session
// and writes are fire-and-forget.
async function bootStore(key){
  await openIDB();
  const fromIdb = await idbReadStore(key);
  if (fromIdb){
    // trust what the log store actually returned, not a counter from a
    // previous session, so an interrupted write can never leave a gap
    logPersisted[key] = (fromIdb.log || []).length;
    return normaliseStore(fromIdb);
  }
  const legacy = lsReadStore(key);
  if (legacy){
    const store = normaliseStore(legacy);
    storeReplaced(key);          // nothing of it is in the log store yet
    idbWriteStore(key, store);
    return store;
  }
  return defaultStore();
}

// Same defaults-and-guards pass loadStore() applies, factored out so a store
// arriving from IndexedDB, from localStorage or from a restore all get it.
function normaliseStore(parsed){
  deProto(parsed);
  if (parsed.settings) deProto(parsed.settings);
  if (parsed.cards) Object.keys(parsed.cards).forEach(k => deProto(parsed.cards[k]));
  if (parsed.flags) Object.keys(parsed.flags).forEach(k => deProto(parsed.flags[k]));
  const defaults = defaultStore().settings;
  const out = Object.assign(defaultStore(), parsed);
  out.settings = Object.assign({}, defaults, parsed.settings || {});
  if (!Array.isArray(out.log)) out.log = [];
  if (!out.cards || typeof out.cards !== 'object') out.cards = {};
  if (!out.flags || typeof out.flags !== 'object') out.flags = {};
  return out;
}

// The running app's only write path. Fire-and-forget by design: the in-memory
// store is what the session reads, and blocking a rating on a disk commit
// would buy nothing. If IndexedDB is unavailable at all (private browsing,
// say) this falls back to localStorage so the app still works.
function persistStore(key, store){
  if (idbWriteStore(key, store)) return true;
  try { localStorage.setItem(key, JSON.stringify(store)); return true; } catch(e){ return false; }
}

// A card's identity: the word's own written-once slug, its category, its
// cell. That first component used to be the word's INDEX in the *_VOCAB
// array, which made review history positional -- inserting a word at the top
// of the array silently re-pointed every card after it at a different word's
// history, with no error, and nothing would look wrong until the intervals
// stopped making sense weeks later. Slugs live in the vocab data (`id:`) and
// are never renumbered or reused. See data/latin-vocab.js's header.
function cardId(wordId, category, cell){
  return wordId + ':' + category + ':' + cell;
}

// Flags packed into each log row's `fl`. A byte rather than four booleans
// because this is the field that repeats on every row for years.
const FL_ACCENTS = 1;   // accents were being graded (Greek only)
const FL_SCHEME  = 2;   // the Hoplite input scheme was active
const FL_TOUCH   = 4;   // coarse pointer, i.e. phone or tablet rather than Mac

// Records one rep against the store (mutates and returns it), applying the
// grading translation layer and FSRS schedule together. `now` is injectable
// for tests; defaults to Date.now().
//
// `timing` is optional and recorded but NOT graded on (see gradeToRating):
//   toFirstKey  prompt shown -> first keydown. This is the recall latency,
//               and unlike total latency it does not scale with how long the
//               answer is -- which is the whole reason for splitting here
//               rather than normalising a fused number afterwards.
//   typing      first keydown -> submit.
//   keys        keydown count, so cost per keystroke can be separated from
//               cost per form.
//   flags       FL_* bits above: what the answer was graded under, and on
//               what kind of device. A threshold fitted across a mixture of
//               Mac and phone sessions would be fitted to nothing.
// None of this can be backfilled, which is why it is being logged now rather
// than when something finally reads it. Rows written before 2026-08-21 simply
// lack these fields; any reader must treat them as absent, not zero.
function recordReview(store, meta, correct, latencyMs, now, timing){
  now = now==null ? Date.now() : now;
  const id = cardId(meta.wordId, meta.category, meta.cell);
  const prior = store.cards[id] || freshCard();
  const rating = gradeToRating(correct);
  const { card, ivl } = schedule(prior, rating, now, store.settings);
  store.cards[id] = card;
  const row = {
    ts: now, cardId: id, lemma: meta.lemma, category: meta.category, cell: meta.cell,
    correct: !!correct, latencyMs: latencyMs|0, rating, ivl
  };
  if (timing){
    if (timing.toFirstKey!=null) row.tfk = timing.toFirstKey|0;
    if (timing.typing!=null)     row.typ = timing.typing|0;
    if (timing.keys!=null)       row.keys = timing.keys|0;
    if (timing.flags)            row.fl = timing.flags|0;
  }
  store.log.push(row);
  return { rating, ivl, card };
}

// How many never-before-seen cells were introduced on study day `dayK`.
// A cell counts as introduced by its FIRST-EVER log entry, which is the same
// rule stats.js's computeDayIndex() uses for its `intro` figure -- so the
// number the cap enforces and the number the Stats screen shows can never
// disagree. Deliberately derived from the log rather than kept as a counter:
// a counter would have to survive sync, import and a rollover change, and
// this is a cheap scan of a few thousand rows.
function introducedOn(store, dayK, rollover){
  const seen = new Set();
  let n = 0;
  for (const e of store.log){
    if (seen.has(e.cardId)) continue;
    seen.add(e.cardId);
    if (dayKey(e.ts, rollover) === dayK) n++;
  }
  return n;
}

// Turns everything-that-is-due into the list a sitting actually works
// through. Two jobs the raw dueCards() list does not do:
//
//   1. Shuffle. dueCards() returns pool order x orderedCells() order, so an
//      un-shuffled queue walks nom.sg, nom.pl, voc.sg ... of word one, then
//      word two -- the same sequence every session, and not what HANDOFF's
//      "random (word x cell)" describes. The shuffle used to exist only on
//      the "drill anyway" path, so the real scheduled drill never got it.
//   2. Hold back new cells beyond the day's allowance. Cards already in
//      progress are NEVER capped: FSRS asks for those today for a reason,
//      and deferring them is how a backlog compounds. Only never-seen cells
//      are rationed, which is the same shape vocabula settled on.
//
// `rng` is injectable so tests can pin the order; defaults to Math.random.
function buildQueue(store, due, now, rng){
  const out = capNew(store, due, now);
  const r = rng || Math.random;
  for (let i=out.length-1; i>0; i--){ const j=Math.floor(r()*(i+1)); [out[i],out[j]]=[out[j],out[i]]; }
  return out;
}

// The capping half on its own, so the count shown on the home screen can be
// the number the drill will actually ask -- an "N due" that a cap then
// quietly shrinks is exactly the kind of dishonest label worth avoiding.
function capNew(store, due, now){
  now = now==null ? Date.now() : now;
  const limit = (store.settings && store.settings.newPerDay|0) || 0;
  if (limit <= 0) return due.slice();
  const roll = effRollover(store.settings, now);
  const remaining = Math.max(limit - introducedOn(store, dayKey(now, roll), roll), 0);
  let taken = 0;
  return due.filter(item => (item.card ? true : (taken < remaining ? (taken++, true) : false)));
}

// pool: the (possibly filtered, e.g. "drill this system") slice being
// searched. table: the language's PARADIGMS object, passed through to
// orderedCells() from engine.js, which must be loaded first.
//
// This used to take the complete *_VOCAB array as a third argument, purely so
// a card id could be keyed on a word's GLOBAL index rather than its position
// within whatever slice was handed in -- get that wrong and a system-filtered
// drill checks due-ness under one id and writes the review under another,
// which is a bug that actually happened here. With ids keyed on the word's
// own slug the question cannot arise: an entry carries its identity with it,
// so a filtered pool and the full list produce identical ids, and the
// parameter has nothing left to do.
function dueCards(store, pool, table, now){
  now = now==null ? Date.now() : now;
  const due = [];
  pool.forEach((entry) => {
    // orderedCellsFor, not orderedCells: a word may lack cells its class
    // defines (see engine.js), and scheduling a card for a form that does not
    // exist is how a deck ends up drilling non-words.
    orderedCellsFor(table, entry).forEach(({category,cell}) => {
      const id = cardId(entry.id, category, cell);
      const c = store.cards[id];
      if (!c || c.due==null || c.due<=now) due.push({ wordId:entry.id, entry, category, cell, card:c||null });
    });
  });
  return due;
}
