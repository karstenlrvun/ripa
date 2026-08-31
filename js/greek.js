/* ======================================================================
   Cotidie — Greek-specific grading.

   Latin's grading (normalize/checkAnswer in js/engine.js) drops macrons
   and nothing else. Greek needs two DIFFERENT rules, both confirmed
   directly against the real OCR A Level Classical Greek (H444)
   specification, not assumed (see data/greek-paradigms.js's header):
     - breathing marks are ALWAYS required (never stripped) -- the spec
       says learners are expected to write them.
     - accent marks (acute/grave/circumflex) are graded only if the user
       has turned that setting ON -- the spec says learners are NOT
       expected to write accents, only to recognize/distinguish by them,
       so the default here is OFF.
   Iota subscript is treated like breathing -- always required -- since
   the spec's "accentuation" language is about pitch accent specifically,
   not the iota subscript (which is closer to a spelling element).

   Also handles movable nu: several stored forms are written "ἐστί(ν)"
   meaning EITHER ἐστί or ἐστίν is correct (movable nu is genuinely
   optional before a consonant/pause in Attic prose) -- expanded into
   both real variants before grading, same "any accepted form passes"
   principle as Latin's alternate-form arrays.
   ====================================================================== */

// Unicode combining marks for the three Greek pitch accents: U+0301
// COMBINING ACUTE ACCENT, U+0300 COMBINING GRAVE ACCENT, U+0342 COMBINING
// GREEK PERISPOMENI (circumflex). Written as explicit \u escapes rather
// than pasting the combining characters literally -- those render
// attached to whatever precedes them and are impossible to visually
// verify in source, exactly the kind of thing "verify don't guess" warns
// against. Decompose (NFD), strip these three, recompose (NFC) -- relies
// on the platform's own correct Unicode normalization rather than a
// hand-rolled table of every precomposed character, which would be far
// more error-prone to get right for polytonic Greek.
const GREEK_ACCENT_MARKS = /[\u0301\u0300\u0342]/g;

function stripGreekAccents(s){
  return String(s).normalize('NFD').replace(GREEK_ACCENT_MARKS, '').normalize('NFC');
}

// "ἐστί(ν)" -> ["ἐστί", "ἐστίν"]. Forms without "(ν)" pass through
// unchanged as a single-element array.
function expandMovableNu(s){
  if (s.indexOf('(ν)') !== -1) return [s.replace('(ν)', ''), s.replace('(ν)', 'ν')];
  return [s];
}

// opts: { accents: bool } -- whether accent marks must match. Breathing
// marks and iota subscript are never stripped, per the spec.
function normalizeGreek(s, opts){
  opts = opts || {};
  if (s == null) return '';
  let out = String(s).normalize('NFC').toLowerCase().trim().replace(/\s+/g, ' ');
  if (!opts.accents) out = stripGreekAccents(out);
  return out;
}

function checkAnswerGreek(userInput, accepted, opts){
  const got = normalizeGreek(userInput, opts);
  if (!got) return false;
  const variants = accepted.reduce((acc, a) => acc.concat(expandMovableNu(a)), []);
  return variants.some(a => normalizeGreek(a, opts) === got);
}

/* ======================================================================
   Typo-tolerant grading on top of checkAnswerGreek -- built 2026-08-30,
   the sibling-guard being the load-bearing rule: 88.8% of this deck's
   cells have some OTHER real cell of the same word exactly one edit away
   (λύεις/λύει is the two-character example), so a plain "one letter off ->
   forgiven" rule would just as often erase the very distinction a
   paradigm drill exists to teach. Two checks, always in this order:
     1. Does the (normalised) answer exactly match some OTHER cell of this
        same word? If so it is a genuine confusion, not a slip, and it
        stays wrong -- no forgiveness, automatic or manual.
     2. Otherwise, is it exactly one slipped key away from the right
        answer? If so it is marked right, with the correct spelling still
        shown so the slip itself is not hidden.
   `table` is an explicit argument rather than a GREEK_PARADIGMS global,
   same discipline buildFormIndex() already uses in engine.js -- keeps this
   testable and, if it is ever wanted, portable to another language later.
   ====================================================================== */
function judgeTypedAnswer(table, entry, category, cell, forms, userInput, opts){
  const got = normalizeGreek(userInput, opts);
  if (!got) return { correct:false, typoForgiven:false, isSibling:false };
  const variantsOf = accepted => accepted.reduce((acc, a) => acc.concat(expandMovableNu(a)), [])
    .map(v => normalizeGreek(v, opts));
  const own = variantsOf(forms.accepted);
  if (own.indexOf(got) !== -1) return { correct:true, typoForgiven:false, isSibling:false };
  const isSibling = orderedCellsFor(table, entry).some(c => {
    if (c.category === category && c.cell === cell) return false;
    const sib = formsFor(table, entry, c.category, c.cell);
    return sib && variantsOf(sib.accepted).indexOf(got) !== -1;
  });
  if (isSibling) return { correct:false, typoForgiven:false, isSibling:true };
  const typo = own.some(v => isOneEditAway(v, got));
  return { correct:typo, typoForgiven:typo, isSibling:false };
}
