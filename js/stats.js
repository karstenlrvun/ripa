/* ======================================================================
   Cotidie — Stats/calendar pure logic (ported from vocabula's own Stats
   screen and Study-days calendar, 2026-08-09). No DOM here, same convention
   as engine.js/fsrs.js -- every function takes the relevant store/table as
   a parameter. Shared by both decks; each deck's own <script> block builds
   the actual screen markup around these.

   One deliberate departure from vocabula's design, not an oversight: there
   is no persisted day-aggregate here (vocabula's `S.days`). Cotidie's
   `store.log` entries already carry every field a day index needs (`ts`,
   `cardId`), so computeDayIndex() below derives one on demand instead --
   vocabula's own STATS_TIME_PLAN.md notes its `S.days` had to be retrofitted
   after the fact (studyMs/stageMs) precisely because its raw log didn't
   carry enough; deriving from the log sidesteps that class of problem
   entirely, at the cost of a full log scan per render (fine at this app's
   personal-use scale).

   The other departure: vocabula's statusOf() is five-way (includes `susp`,
   a leech/set-aside flag). Cotidie has no such flag -- not in scope for
   this port -- so this is a four-way split.
   ====================================================================== */

const STATUS_ORDER = ['unseen', 'learning', 'young', 'mature'];
const STATUS_LABEL = {
  unseen: 'Still to meet',
  learning: 'In short-term steps',
  young: 'Settling (under 3 weeks)',
  mature: 'Holding (3 weeks or more)'
};

// card: a store.cards[id] entry, or undefined/null for a cell never rated.
function statusOf(card){
  if (!card || !card.reps) return 'unseen';
  if (card.st !== 'R') return 'learning';
  return card.s < 21 ? 'young' : 'mature';
}

// Whole-deck cell-status breakdown: totals across every (word, category,
// cell) triple in vocabList (not just what's due), plus a per-System detail
// list in vocabList's own iteration order. `table` is the language's
// PARADIGMS object; both already passed identically to dueCards() elsewhere.
function wholeDeckStats(store, vocabList, table){
  const totals = { unseen:0, learning:0, young:0, mature:0 };
  const bySystem = {};
  vocabList.forEach((entry) => {
    const sys = bySystem[entry.class] || (bySystem[entry.class] = { cells: [] });
    orderedCellsFor(table, entry).forEach(({ category, cell }) => {
      const id = cardId(entry.id, category, cell);
      const st = statusOf(store.cards[id]);
      totals[st]++;
      sys.cells.push(st);
    });
  });
  return { totals, bySystem };
}

// Aggregate status across every real (FSRS-tracked) vocab entry in
// `classKey`, for one specific (category, cell) -- backs the Table view's
// per-cell status dot (HANDOFF.md §10d). Table mode displays the class's
// own `example` specimen, which is a display-only specimen never drilled or
// logged (see engine.js's header comment) -- so a dot next to it can't
// point at a single card the way the Stats/Browse screens can. Instead it
// summarizes across the class's actual vocab words. Returns the
// LEAST-advanced status present (unseen > learning > young > mature) --
// a "how much is left to do on this cell" reading, not an average, so one
// still-unmet word in a class of ten keeps the dot honest rather than
// getting averaged away.
function cellStatusSummary(store, vocabList, classKey, category, cell){
  // only words that actually have this cell -- a word restricted out of it has
  // no card there, and counting its absence as "unseen" would keep the dot
  // permanently red for a form most of the class does not have
  const entries = vocabList.filter(e => e.class === classKey && entryHasCell(e, category, cell));
  if (!entries.length) return 'unseen';
  const rank = { unseen:0, learning:1, young:2, mature:3 };
  let worst = 3;
  entries.forEach(entry => {
    const st = statusOf(store.cards[cardId(entry.id, category, cell)]);
    worst = Math.min(worst, rank[st]);
  });
  return STATUS_ORDER[worst];
}

// {dayKey: {n, intro, cellIds:Set}} built by a single forward scan of
// store.log. n = every log entry that day (raw rating count, same-day
// repeats included); intro = entries that were the FIRST-EVER log entry for
// their cardId (relies on log being append-order, which recordReview()
// guarantees via push()); cellIds = every distinct cardId touched that day.
function computeDayIndex(log, rollover){
  const seen = new Set();
  const idx = {};
  log.forEach(e => {
    const dk = dayKey(e.ts, rollover);
    if (!idx[dk]) idx[dk] = { n:0, intro:0, cellIds:new Set() };
    const rec = idx[dk];
    rec.n++;
    rec.cellIds.add(e.cardId);
    if (!seen.has(e.cardId)){ seen.add(e.cardId); rec.intro++; }
  });
  return idx;
}

// {studied, intro, words, ratings} for one study day -- words is the number
// of distinct cells touched (Cotidie's analogue of vocabula's `words`,
// which counted distinct vocab words; here a "word" being touched at all
// means at least one of its cells was touched, so `words` here is at the
// cell granularity, matching what the calendar and stats screen both
// actually track).
function dayStatsFor(dayIndex, dk){
  const rec = dayIndex[dk];
  if (!rec || !rec.n) return { studied:false, intro:0, words:0, ratings:0 };
  return { studied:true, intro:rec.intro, words:rec.cellIds.size, ratings:rec.n };
}

function currentStreak(dayIndex, todayKey){
  let streak = 0;
  for (let k = todayKey; ; k--){
    if (dayIndex[k] && dayIndex[k].n) streak++;
    else { if (k !== todayKey) break; }
    if (todayKey - k > 3650) break;
  }
  return streak;
}

// the study-day key for a plain Gregorian calendar date -- local noon is
// safely inside the day regardless of rollover hour, same technique as
// vocabula's own dayKeyForDate.
function dayKeyForDate(y, m, day, rollover){
  return dayKey(new Date(y, m, day, 12, 0, 0).getTime(), rollover);
}

// a Gregorian month as weeks of 7 cells (Sun-Sat), padded with inMonth:false
// cells so every week is a full row; pure date math, no store/DOM access.
// Ported verbatim from vocabula -- this needed no adaptation at all.
function monthMatrix(y, m){
  const first = new Date(y, m, 1), start = first.getDay(),
        days = new Date(y, m+1, 0).getDate(), prevDays = new Date(y, m, 0).getDate();
  const cells = [];
  for (let i=0; i<start; i++) cells.push({ y, m:m-1, d:prevDays-start+1+i, inMonth:false });
  for (let d=1; d<=days; d++) cells.push({ y, m, d, inMonth:true });
  while (cells.length % 7 !== 0) cells.push({ y, m:m+1, d:cells.length-start-days+1, inMonth:false });
  const weeks = [];
  for (let i=0; i<cells.length; i+=7) weeks.push(cells.slice(i, i+7));
  return weeks;
}

/* ======================================================================
   Trouble — which cells actually beat him, and which parts of the paradigm
   they cluster in. Added 2026-08-30 on his own request: the app has graded
   every answer since day one and has never once named a cell back to him.

   Everything here derives from store.log on demand, same as computeDayIndex
   above and for the same reason -- there is no aggregate to keep in step,
   to migrate, or to merge across devices.
   ====================================================================== */

// Below this many attempts a cell is not ranked at all. One miss out of one
// attempt is a 100% failure rate, and without a floor the top of a list
// meant to name real trouble is nothing but cells asked once. His call
// 2026-08-30: rate over raw count, floored, with both numbers shown on the
// row so the ranking can always be checked against the tally behind it.
const TROUBLE_FLOOR = 4;
// The grouped view sums many cells, so it reaches a usable sample far
// sooner and does not need the same guard.
const TROUBLE_GROUP_FLOOR = 8;

// A category key carries its own axes. Verbs are tense.voice[.mood] --
// `pres.act`, `aor.pass.opt` -- where an absent third part means the
// indicative. Nouns and adjectivals use a bare case (`gen`), which is why
// the presence of a dot is enough to tell the two shapes apart: no verb
// category in either deck is a single word, and no case is more than one.
function categoryAxes(category){
  const parts = String(category == null ? '' : category).split('.');
  if (parts.length < 2) return { shape:'case', 'case': parts[0], full: category };
  return { shape:'verb', tense: parts[0], voice: parts[1], mood: parts[2] || 'ind', full: category };
}

// The inverse of cardId(): wordId, category, cell. Split on the FIRST and
// LAST colon rather than by splitting the whole string, because a verb
// category legitimately contains dots and could one day contain worse --
// whereas a word slug and a cell key never contain a colon at all. Needed
// because a trouble row is reconstructed from the log, which stores the id,
// and drilling it back requires the three parts separately.
function splitCardId(id){
  const s = String(id == null ? '' : id);
  const i = s.indexOf(':'), j = s.lastIndexOf(':');
  if (i < 0 || j <= i) return null;
  return { wordId: s.slice(0, i), category: s.slice(i + 1, j), cell: s.slice(j + 1) };
}

const TENSE_LABEL = { pres:'Present', impf:'Imperfect', fut:'Future', aor:'Aorist',
                      perf:'Perfect', plup:'Pluperfect', futperf:'Future perfect' };
const VOICE_LABEL = { act:'Active', mid:'Middle', pass:'Passive', mp:'Middle/passive' };
const MOOD_LABEL  = { ind:'Indicative', subj:'Subjunctive', opt:'Optative',
                      imper:'Imperative', inf:'Infinitive' };
const CASE_LABEL  = { nom:'Nominative', voc:'Vocative', acc:'Accusative', gen:'Genitive',
                      dat:'Dative', comp:'Comparative', sup:'Superlative' };
const AXIS_LABEL  = { tense:TENSE_LABEL, voice:VOICE_LABEL, mood:MOOD_LABEL, 'case':CASE_LABEL };

// Falls back to the raw key rather than hiding a value it has no name for:
// an unlabelled row is a prompt to add the label, an invisible one is a bug
// nobody finds.
function axisLabel(axis, key){
  const t = AXIS_LABEL[axis];
  return (t && t[key]) || String(key);
}

// Every cell he has answered at least `floor` times, worst first.
// `includeClean` keeps the ones he has never got wrong -- off for the five
// rows on the Home screen, on for the full ranked list, which he asked to
// run "from worst to best" and so has to contain the best as well.
function troubleCells(store, opts){
  const o = opts || {};
  const floor = (o.floor == null) ? TROUBLE_FLOOR : o.floor;
  const by = Object.create(null);
  const log = (store && store.log) || [];
  for (let i = 0; i < log.length; i++){
    const r = log[i];
    if (!r || !r.cardId) continue;
    let t = by[r.cardId];
    if (!t) t = by[r.cardId] = { cardId:r.cardId, attempts:0, misses:0, lastMiss:0, lastSeen:0 };
    t.attempts++;
    // the newest row wins for the display fields: a lemma can be corrected
    // in the deck data (ἁθροίζω was), and the list should show what the
    // word is called now, not what it was called the first time it was asked
    if (r.ts >= t.lastSeen){ t.lastSeen = r.ts; t.lemma = r.lemma; t.category = r.category; t.cell = r.cell; }
    if (!r.correct){ t.misses++; if (r.ts > t.lastMiss) t.lastMiss = r.ts; }
  }
  const out = [];
  for (const k in by){
    const t = by[k];
    if (t.attempts < floor) continue;
    if (!o.includeClean && !t.misses) continue;
    t.rate = t.misses / t.attempts;
    out.push(t);
  }
  return sortTrouble(out);
}

// Rate first, then the raw tally, then recency, then the id -- the last two
// only so the order is total. Without a deterministic tail the same data
// can list in two orders on two devices, which looks like a sync bug.
function sortTrouble(list){
  return list.sort((a, b) =>
    (b.rate - a.rate) || (b.misses - a.misses) || (b.lastMiss - a.lastMiss) ||
    (a.cardId < b.cardId ? -1 : a.cardId > b.cardId ? 1 : 0));
}

// The same record, grouped along one axis of the category -- his own ask:
// "but also by tense (will have to sum the cumulative score of cells?)".
// Yes, summed: attempts and misses add across every cell of the group and
// the rate is recomputed from those sums. NOT the mean of the per-cell
// rates, which would let one cell asked four times count as much as one
// asked four hundred, and is how a group nobody struggles with ends up on
// top because a single rare form inside it is hard.
function troubleByAxis(store, axis, opts){
  const o = opts || {};
  const floor = (o.floor == null) ? TROUBLE_GROUP_FLOOR : o.floor;
  const by = Object.create(null);
  const log = (store && store.log) || [];
  for (let i = 0; i < log.length; i++){
    const r = log[i];
    if (!r || r.category == null) continue;
    const key = categoryAxes(r.category)[axis];
    if (key == null) continue;
    let g = by[key];
    if (!g) g = by[key] = { key, axis, attempts:0, misses:0, cells:Object.create(null), cellCount:0 };
    g.attempts++;
    if (!r.correct) g.misses++;
    if (r.cardId && !g.cells[r.cardId]){ g.cells[r.cardId] = 1; g.cellCount++; }
  }
  const out = [];
  for (const k in by){
    const g = by[k];
    if (g.attempts < floor) continue;
    g.rate = g.misses / g.attempts;
    delete g.cells;
    out.push(g);
  }
  return out.sort((a, b) => (b.rate - a.rate) || (b.misses - a.misses) ||
                            (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
}

// Which axes are worth offering for a given set of rows: a deck of nouns has
// no tense to group by, and a screen that offers one is offering an empty
// list. Derived from what the log actually contains rather than from the
// deck, so it stays right for a deck that gains a kind later.
function troubleAxes(store){
  const log = (store && store.log) || [];
  let verb = false, cas = false;
  for (let i = 0; i < log.length; i++){
    const r = log[i];
    if (!r || r.category == null) continue;
    if (categoryAxes(r.category).shape === 'verb') verb = true; else cas = true;
    if (verb && cas) break;
  }
  const out = [];
  if (verb) out.push('tense', 'voice', 'mood');
  if (cas) out.push('case');
  return out;
}

/* ---- one flag, on or off ------------------------------------------------
   His call 2026-08-30, over vocabula's seven colours: this app is smaller,
   and an unlabelled colour is something to remember rather than something to
   read. The flag sits on a CELL, not a word -- the thing that beats you here
   is "δίδωμι, aorist active, 3 pl.", and flagging the whole verb would say
   almost nothing.

   Clearing a flag writes {on:false} rather than deleting the key, and that
   tombstone is the entire reason unflagging survives sync: two stores merge
   by taking the newer stamp per cell, and a union of the keys that are
   PRESENT cannot represent a key that was removed. Without it, clearing a
   flag on the phone would be silently undone by the next merge from the Mac.
   ------------------------------------------------------------------------ */
function setFlag(store, id, on, now){
  if (!store.flags || typeof store.flags !== 'object') store.flags = {};
  if (id === '__proto__') return store.flags;
  store.flags[id] = { on: !!on, at: (now == null ? Date.now() : now) };
  return store.flags;
}
function isFlagged(store, id){
  const f = store && store.flags && store.flags[id];
  return !!(f && f.on);
}
function flagSetAt(store, id){
  const f = store && store.flags && store.flags[id];
  return (f && f.on) ? (f.at | 0) : null;
}
function flaggedCount(store){
  const f = (store && store.flags) || {};
  let n = 0;
  for (const k in f) if (f[k] && f[k].on) n++;
  return n;
}

/* ---- how long a sitting will take --------------------------------------
   The MEDIAN answer time, not the mean: a card left on screen while the
   phone went in a pocket is a 40-minute latency, and two of those move a
   mean by more than a hundred real answers do. Returns null rather than a
   confident figure when there is not enough history to have one -- the
   caller shows the count alone in that case.
   ------------------------------------------------------------------------ */
const ESTIMATE_MIN_SAMPLE = 15;
function medianLatency(store, sample){
  const log = (store && store.log) || [];
  const want = sample || 400;
  const lat = [];
  for (let i = log.length - 1; i >= 0 && lat.length < want; i--){
    const r = log[i];
    // 2 minutes is not an answer, it is an interruption; 0 is a row from
    // before latency was recorded at all
    if (r && r.latencyMs > 0 && r.latencyMs < 120000) lat.push(r.latencyMs);
  }
  if (lat.length < ESTIMATE_MIN_SAMPLE) return null;
  lat.sort((a, b) => a - b);
  return lat[Math.floor(lat.length / 2)];
}
function estimateMs(store, n, sample){
  const med = medianLatency(store, sample);
  return med == null ? null : med * Math.max(0, n | 0);
}
// Deliberately coarse. "about 12 minutes" is a useful thing to be told;
// "11.6 minutes" is a false precision built on a median of latencies.
function fmtDuration(ms){
  if (ms == null) return null;
  const min = ms / 60000;
  if (min < 1.5) return 'about a minute';
  if (min < 60)  return 'about ' + Math.round(min) + ' minutes';
  const hrs = min / 60;
  if (hrs < 1.75) return 'about an hour';
  if (hrs < 10)   return 'about ' + Math.round(hrs) + ' hours';
  return 'over ' + Math.floor(hrs) + ' hours';
}
