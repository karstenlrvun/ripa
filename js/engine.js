/* ======================================================================
   Cotidie — taxonomy + form-generation engine (System -> Category -> Cell)

   Pure logic, no DOM. Shared by Latin and Greek: every function below takes
   a `table` (a PARADIGMS object, e.g. LATIN_PARADIGMS or GREEK_PARADIGMS)
   as its first argument, rather than hardcoding one language's global --
   this file used to hardcode LATIN_PARADIGMS, which worked when there was
   only Latin, but obviously breaks the moment a second language exists.
   Grading normalization stays language-specific (see the Latin section
   below and js/greek.js for Greek's), since what "counts as correct" is a
   genuinely different rule per language (macron-insensitive vs
   breathing-required/accent-toggleable).

   Depends on the relevant data/*-paradigms.js being loaded first (for
   FROM_LEMMA). Plain top-level declarations, no module wrapping -- see the
   note at the bottom of latin-paradigms.js for why (matches vocabula's own
   test-concatenation convention).
   ====================================================================== */

// ---- form generation (language-agnostic) ----
// entry: a row from a *_VOCAB array. categoryKey/cellKey: keys into the
// class's `endings` table. Returns {primary, accepted} -- accepted always
// includes primary, additional entries are alternate accepted spellings
// (e.g. Latin's -ris/-re passive 2nd-singular doublet).
//
// Two ending-value conventions, both supported:
//   - normal classes: `base` (entry.stem for nouns, entry.root for verbs)
//     is concatenated with the ending, except the FROM_LEMMA sentinel
//     which uses entry.lemma verbatim instead (for cells that aren't
//     predictable from the oblique stem, e.g. 3rd-declension nom. sg.).
//   - `table[classKey].literal === true` classes: every ending value IS
//     the complete form already; no concatenation happens at all. This is
//     for irregular verbs (Latin sum, Greek eiμí, etc.) and, for now,
//     Greek's 3rd-declension nouns (consonant-cluster sandhi in the
//     dative plural isn't modeled as a rule yet -- see HANDOFF.md), where
//     hand-writing every form is more honest than a formula that's wrong
//     for some inputs.
function formsFor(table, entry, categoryKey, cellKey){
  const cls = table[entry.class];
  if (!cls) throw new Error('Unknown class: ' + entry.class);
  const spec = cls.endings[categoryKey] && cls.endings[categoryKey][cellKey];
  if (spec === undefined) throw new Error('No ending for ' + entry.class + ' ' + categoryKey + '/' + cellKey);
  const base = cls.literal ? null : ((cls.kind === 'verb') ? entry.root : entry.stem);

  function build(one){
    if (cls.literal) return one;
    return (one === FROM_LEMMA) ? entry.lemma : (base + one);
  }

  const variants = Array.isArray(spec) ? spec.map(build) : [build(spec)];
  return { primary: variants[0], accepted: variants };
}

// Every cell key this class actually uses, in canonical order: the declared
// cellKeys first, then any key that appears in some category's endings but
// not in cellKeys, in first-seen order.
//
// The second half is what makes a RAGGED paradigm possible, and nothing can
// be added to the verb until it is. A class declares one cellKeys list and
// the old orderedCells() walked the full categories x cellKeys grid, so the
// first category with a different shape broke everything: the imperative has
// four cells where every other category has six, and the infinitive has one.
// formsFor() throws on a missing cell, and Table, Recite and dueCards() all
// reach it through fullParadigm(), so adding a single mood killed the deck.
// Now the grid is walked per category and only where an ending really exists.
function cellKeysOf(cls){
  const keys = cls.cellKeys.slice();
  cls.categories.forEach(category => {
    const block = cls.endings[category];
    if (!block) return;
    Object.keys(block).forEach(k => { if (keys.indexOf(k) === -1) keys.push(k); });
  });
  return keys;
}

function hasCell(cls, category, cell){
  const block = cls.endings[category];
  return !!block && block[cell] !== undefined;
}

// The canonical recitation order for a class -- this matches how a paper
// paradigm table is actually read aloud, and the three kinds are recited in
// three DIFFERENT shapes, not one shared nesting:
//   nouns: number-major, case-minor -- the whole singular column case by
//     case, THEN the whole plural column.
//   verbs: category-major, person-minor -- all six persons of one
//     tense/voice (e.g. all of present active), THEN the next tense/voice.
//   adjectivals (adjectives, the article, pronouns, participles): gender-
//     major, then number, then case -- all of the masculine, then all of the
//     feminine, then the neuter. That is how the tables are printed and how
//     they are recited aloud, and it is why the gender sits in the cell key
//     (`m.sg`) rather than on the word: one lemma varies across all three.
// See HANDOFF.md.
function orderedCells(table, classKey){
  const cls = table[classKey];
  if (!cls) throw new Error('Unknown class: ' + classKey);
  const out = [];
  const keys = cellKeysOf(cls);
  if (cls.kind === 'adj'){
    (cls.genders || ['m','f','n']).forEach(g => {
      cls.cellKeys.forEach(num => {
        const cell = g + '.' + num;
        cls.categories.forEach(category => {
          if (hasCell(cls, category, cell)) out.push({ category, cell });
        });
      });
    });
  } else if (cls.kind === 'noun'){
    keys.forEach(cell => {
      cls.categories.forEach(category => {
        if (hasCell(cls, category, cell)) out.push({ category, cell });
      });
    });
  } else {
    cls.categories.forEach(category => {
      keys.forEach(cell => {
        if (hasCell(cls, category, cell)) out.push({ category, cell });
      });
    });
  }
  return out;
}

/* ---- when one WORD has fewer cells than its class ----
   A class describes a pattern; a word can be a legitimate member of that
   pattern and still lack part of it. Latin is full of this and it is not an
   edge case:

     sedeō, veniō, dormiō  intransitive, so the passive is IMPERSONAL -- only
                           the third singular exists. `sedeor` is not a word.
     respondeō, studeō     third person only in the passive.
     faciō                 has no passive at all; its passive is suppletive,
                           supplied by fīō.
     caelum                no neuter plural -- the plural is masculine.
     aurum                 singulare tantum.

   Before this, a class defined the cells and every word in it got all of them,
   so each of these words was generating non-words and drilling them daily --
   96 cells of them, found by the 2026-08-21 verification pass (tools/verify).
   The alternative was deleting the words, which for "sit", "come", "sleep" and
   "do" is not really an alternative.

   `restrict` on a vocab entry maps a category to the ONLY cells that word has
   in it. A category not mentioned is unrestricted; an empty list means the
   word has none of that category at all. Nothing is restricted by default, so
   every existing word is unaffected. */
function entryHasCell(entry, category, cell){
  const r = entry && entry.restrict;
  if (!r || !Object.prototype.hasOwnProperty.call(r, category)) return true;
  return r[category].indexOf(cell) !== -1;
}

// orderedCells for one particular WORD rather than for its class. The class
// version still describes the pattern, which is what the Table view renders
// from via the class's own `example`; this is what anything touching a real
// word's cards must use.
function orderedCellsFor(table, entry){
  return orderedCells(table, entry.class)
    .filter(({ category, cell }) => entryHasCell(entry, category, cell));
}

// The fully realized paradigm for one vocab entry, in canonical order --
// what Table and Recite modes both render from.
function fullParadigm(table, entry){
  return orderedCellsFor(table, entry).map(({ category, cell }) => {
    const f = formsFor(table, entry, category, cell);
    return { category, cell, primary: f.primary, accepted: f.accepted };
  });
}

function classesOfKind(table, kind){
  return Object.keys(table).filter(k => table[k].kind === kind);
}

/* ======================================================================
   Latin grading: macrons dropped, case-insensitive, whitespace-collapsed.
   (Ground rule, confirmed in the Cotidianum plan: "Latin macrons dropped
   from grading.") This is a GRADING-time normalization only -- the stored
   canonical forms keep their macrons for table/recite display.
   ====================================================================== */
const MACRON_MAP = { 'ā':'a','ē':'e','ī':'i','ō':'o','ū':'u','ȳ':'y',
                      'Ā':'A','Ē':'E','Ī':'I','Ō':'O','Ū':'U','Ȳ':'Y' };

function stripMacrons(s){
  return String(s).replace(/[āēīōūȳĀĒĪŌŪȲ]/g, c => MACRON_MAP[c] || c);
}

function normalize(s){
  if (s == null) return '';
  return stripMacrons(String(s))
    .normalize('NFC')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

// True if userInput matches any accepted form for this cell (grading-time
// normalization applied to both sides). Latin-specific (see checkAnswerGreek
// in js/greek.js for Greek's breathing-required/accent-toggleable rule).
function checkAnswer(userInput, accepted){
  const got = normalize(userInput);
  if (!got) return false;
  return accepted.some(a => normalize(a) === got);
}

// True if a and b differ by exactly one inserted, deleted or substituted
// character -- NOT full edit distance, which allows any number of edits.
// Language-agnostic (pure string comparison, no normalization of its own --
// callers normalize first), so it lives here rather than in js/greek.js,
// next to the other shared, testable primitives. Two-pointer scan, not a
// Levenshtein table: cheap, and "exactly one slipped key" is the only shape
// a typo-forgiveness check needs.
function isOneEditAway(a, b){
  const la = a.length, lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0, j = 0, found = false;
  while (i < la && j < lb){
    if (a[i] !== b[j]){
      if (found) return false;
      found = true;
      if (la === lb) { i++; j++; }        // substitution
      else if (la > lb) { i++; }          // a has one extra character
      else { j++; }                       // b has one extra character
    } else { i++; j++; }
  }
  if (i < la || j < lb) found = true;     // one trailing character left over
  return found;
}

/* ======================================================================
   HTML escaping -- shared by both decks' render functions (security pass,
   ported from vocabula 2026-08-08). Escapes quotes as well as angle
   brackets, and coerces a non-string rather than throwing. Today's own
   vocab/paradigm data has no & < > in it to prove this matters, and the
   store has no external-input path yet either -- but that stays true only
   until gist sync (HANDOFF.md §10e, planned) lands, at which point a value inside
   `store.log`/`store.cards` can arrive from another device's push rather
   than from this device's own typing. Escape at the boundary function now,
   not after there's a real incident to point at, same lesson vocabula's own
   HANDOFF documents about its `row()` fix. */
function escHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ======================================================================
   Reverse lookup: given a form, what is it?

   Type λυθεῖσι and get back "aorist passive participle, dative plural of
   λύω". This falls out of the paradigm data with no new schema at all --
   every cell already knows its word, its category and its cell -- which is
   why the buildout audit called it the single most useful thing a reader can
   have and the cheapest thing on its list.

   Language-agnostic: the caller supplies its own normaliser (Latin drops
   macrons, Greek optionally drops accents but never breathings) and its own
   variant expander (Greek's movable nu, "ἐστί(ν)" -> two forms). The index is
   keyed on the NORMALISED form, so a lookup matches whatever the grader would
   have accepted -- typing without accents finds the accented form, exactly as
   answering without them is marked right.
   ====================================================================== */
function buildFormIndex(table, vocabList, normalise, expand){
  expand = expand || (s => [s]);
  const idx = Object.create(null);
  vocabList.forEach(entry => {
    orderedCellsFor(table, entry).forEach(({ category, cell }) => {
      formsFor(table, entry, category, cell).accepted.forEach(form => {
        expand(form).forEach(variant => {
          const key = normalise(variant);
          if (!key) return;
          (idx[key] || (idx[key] = [])).push({ entry, category, cell, form });
        });
      });
    });
  });
  return idx;
}

// Every cell whose form matches `query`. One form very often has several
// answers -- λύω's present and subjunctive first singular are both λύω, and
// τρεῖς is nominative and accusative at once -- so this returns a list and the
// caller is expected to show all of it. Collapsing to one would be a lie.
function lookupForm(index, normalise, query){
  const key = normalise(query || '');
  if (!key) return [];
  const hits = index[key] || [];
  const seen = Object.create(null);
  return hits.filter(h => {
    const k = h.entry.id + '|' + h.category + '|' + h.cell;
    if (seen[k]) return false;
    seen[k] = true;
    return true;
  });
}
