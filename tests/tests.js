/* Appended after the extracted pure-logic portion of a deck (everything above
 * `function tapZone`, per run.sh) and executed with node or jsc. Mirrors
 * vocabula's own testing convention (see vocabula/HANDOFF.md §6) so anyone
 * used to that harness recognises this one immediately.
 *
 * jsc's global is print(), not console.log -- shimmed below so the same file
 * runs unmodified under either engine. */
if (typeof console === 'undefined') {
  globalThis.console = { log: function () { print(Array.prototype.join.call(arguments, ' ')); } };
}

let pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('PASS', name); }
  else { fail++; console.log('FAIL', name, detail !== undefined ? JSON.stringify(detail) : ''); }
}
function eq(name, actual, expected) {
  ok(name, JSON.stringify(actual) === JSON.stringify(expected), { actual: actual, expected: expected });
}

/* ================= data integrity ================= */
ok('DATA is a non-empty array', Array.isArray(DATA) && DATA.length > 0, DATA && DATA.length);

(function () {
  let shapeOK = true, allSeedNeg1 = true, emptyTerm = 0, emptyMeaning = 0, emptyPart = 0;
  for (let i = 0; i < DATA.length; i++) {
    const row = DATA[i];
    if (!Array.isArray(row) || row.length !== 4) { shapeOK = false; continue; }
    if (typeof row[0] !== 'string' || typeof row[1] !== 'string' ||
        typeof row[2] !== 'string' || typeof row[3] !== 'number') shapeOK = false;
    if (row[3] !== -1) allSeedNeg1 = false;
    if (!row[0] || !row[0].trim()) emptyTerm++;
    if (!row[1] || !row[1].trim()) emptyMeaning++;
    if (!row[2] || !row[2].trim()) emptyPart++;
  }
  ok('every DATA row is [term:string, meaning:string, part:string, seed:number]', shapeOK);
  ok('every DATA row seeds -1 -- no deck here has a pre-known-word audit', allSeedNeg1);
  eq('no rows with an empty term', emptyTerm, 0);
  eq('no rows with an empty meaning', emptyMeaning, 0);
  eq('no rows with an empty part', emptyPart, 0);
})();

ok('SECTIONS is derived from DATA and non-empty', Array.isArray(SECTIONS) && SECTIONS.length >= 1, SECTIONS);
ok('CARDS is built (forward + reverse, so at least as many as DATA rows)', CARDS.length >= DATA.length, CARDS.length);

(function () {
  const ids = {};
  let dup = 0;
  for (const c of CARDS) { if (ids[c.id]) dup++; ids[c.id] = true; }
  eq('every card id is unique', dup, 0);
})();

ok('DECK has fwd/rev labels and at least one motto', DECK && typeof DECK.fwd === 'string' && typeof DECK.rev === 'string' &&
  Array.isArray(DECK.mottos) && DECK.mottos.length > 0, DECK);
ok('KEY follows riverbank.<deck>.v<n>', /^riverbank\.[a-z]+\.v\d+$/.test(KEY), KEY);
ok('DECK_ID is one of latin/greek/italian', ['latin', 'greek', 'italian'].indexOf(DECK_ID) !== -1, DECK_ID);
ok('KEY and DECK_ID agree with each other', KEY.indexOf('.' + DECK_ID + '.') !== -1, { KEY: KEY, DECK_ID: DECK_ID });

/* ================= settings that were hardcoded on purpose =================
 * These three used to be user-editable in vocabula; riverbank fixed them and
 * removed the controls. If one of these ever flips, the removed UI silently
 * stopped matching the actual behaviour -- that's a real regression, not a
 * style nit, so it's asserted here rather than left to be noticed by eye. */
ok('requireEasy is hardcoded true (no UI control for it)', defaults.settings.requireEasy === true);
ok('useTiming is hardcoded true (no UI control for it)', defaults.settings.useTiming === true);
eq('drillDays is hardcoded to 3 (no UI control for it)', defaults.settings.drillDays, 3);
ok('gistId is gone from settings', !('gistId' in defaults.settings));
ok('gistTok is gone from settings', !('gistTok' in defaults.settings));
ok('term (Michaelmas) is gone from settings', !('term' in defaults.settings));
ok('syncCode exists in settings (the gist replacement)', 'syncCode' in defaults.settings);
ok('knownDays key still exists for freshCard(), even with no UI to change it', 'knownDays' in defaults.settings);

/* ================= day math (pure; ROLL_H() falls back to 4 with S=null) ================= */
(function () {
  const noon = new Date('2026-08-03T12:00:00').getTime();
  ok('dayStart(dayKey(t)) never lands after t', dayStart(dayKey(noon)) <= noon);
  ok('dayKey is stable within the same day', dayKey(noon) === dayKey(noon + 1000));
  ok('dayKey advances by exactly 1 after a full day', dayKey(noon + DAY) === dayKey(noon) + 1);
})();

/* ================= FSRS scheduling invariants =================
 * Not re-deriving vocabula's FSRS math (already the most tested code in that
 * codebase) -- just the properties that would be embarrassing to get wrong:
 * a fresh Easy schedules further out than a fresh Again, and requireEasy
 * actually holds a Good press to a short same-day step. */
(function () {
  const settings = Object.assign({}, defaults.settings);
  const now = Date.now();
  const blank = { id: 'test', st: 'L', step: 0, s: null, d: null, due: 0, last: null, reps: 0, lapses: 0, buried: 0, streak: 0, lastDay: null };

  const again = schedule(blank, AGAIN, now, settings);
  const easy = schedule(blank, EASY, now, settings);
  ok('a fresh Easy schedules a longer interval than a fresh Again', easy.ivl > again.ivl, { again: again.ivl, easy: easy.ivl });

  // requireEasy: a mid-drill Good must be forced back into a short same-day step
  const midDrill = Object.assign({}, blank, { st: 'L', step: 0, streak: 1, lastDay: dayKey(now) });
  const good = schedule(midDrill, GOOD, now, settings);
  ok('Good on a learning-step card returns a same-day interval (minutes, not days)', good.ivl < HOUR, good.ivl);
})();

/* ================= sync ================= */
(function () {
  eq('syncDecision: neither side moved', syncDecision(5, 5, 5), 'in-sync');
  eq('syncDecision: only remote moved', syncDecision(5, 7, 5), 'take-remote');
  eq('syncDecision: only local moved', syncDecision(7, 5, 5), 'push-local');
  eq('syncDecision: both moved -> conflict, not a silent pick', syncDecision(7, 9, 5), 'conflict');
})();

// jsc (the macOS-native fallback engine) has no Web Crypto global at all --
// randomSyncCode() needs crypto.getRandomValues, which only real browsers and
// node provide. Skip rather than crash the rest of the suite when it's absent.
if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
  const code = randomSyncCode();
  ok('sync code matches XXXXX-XXXXX shape', /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}$/.test(code), code);
  ok('sync code excludes ambiguous characters (0/O/1/I)', !/[01OI]/.test(code), code);
  const code2 = randomSyncCode();
  ok('two generated codes are not identical (statistically -- would need a broken RNG to fail)', code !== code2, { code: code, code2: code2 });
} else {
  console.log('SKIP sync code tests -- no Web Crypto global in this engine (expected under jsc)');
}

/* ================= part picker (multi-select on the home screen) ================= */
(function () {
  const counts = partCounts('L');
  const total = Object.keys(counts).reduce(function (sum, k) { return sum + counts[k]; }, 0);
  const forwardCards = CARDS.filter(function (c) { return c.dir === 'L'; }).length;
  eq('partCounts sums to the number of forward cards', total, forwardCards);

  S = Object.assign({}, defaults, { parts: null });
  eq('activeParts() with S.parts unset falls back to every section', activeParts(), SECTIONS);
  S.parts = [SECTIONS[0]];
  eq('activeParts() honours a restricted S.parts', activeParts(), [SECTIONS[0]]);
})();

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (typeof process !== 'undefined') process.exit(fail ? 1 : 0);
