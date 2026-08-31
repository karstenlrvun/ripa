/* ======================================================================
   Cotidie — Greek input, matching Karsten's actual daily tool.

   Karsten's own words: he uses "Hoplite KB" (jeremymarch/hopliteKB-
   LibreOffice, github.com/jeremymarch/hopliteKB-LibreOffice) rather than
   the Mac's built-in Greek Polytonic keyboard, specifically because
   toggling a whole OS keyboard layout on/off just for Greek work is more
   friction than this scheme, which runs entirely on the ordinary US
   layout. This file reimplements that same scheme in-browser (a plain
   <input>, no OS-level keyboard involved) rather than assuming the OS
   Polytonic layout, which the Cotidianum plan's original design had
   assumed and which turned out to not match how Karsten actually types.

   ---- The scheme (confirmed from Hoplite KB's own source & docs) ----
   Letter keys a-z/A-Z transliterate directly to a Greek base letter,
   inserted immediately. Digit keys 1-9 TOGGLE a diacritic onto the most
   recently typed Greek letter (not standalone characters) -- press once
   to add it, again to remove it, in any order, before or after other
   diacritics on the same letter. The letter table below is transcribed
   from hopliteKB's own src/py/hoplitekb.py (fetched directly, 2026-08-06)
   -- an AI-summarized fetch of source rather than a byte-exact read, so
   treat it as high-confidence-but-Karsten-should-spot-check, not gospel;
   any wrong key is instantly obvious to him since it's the tool he
   already uses daily. The digit->diacritic order (rough, smooth, acute,
   grave, circumflex, macron, breve, iota subscript, diaeresis for 1-9)
   is corroborated by two independent pages (the extension's own README
   and philolog.us's Hoplite Keyboard page), not just one.

   Deliberately NOT reimplemented: Hoplite's key-rebinding options (this
   is the default 1-9 scheme only) and the underdot (key 0, a papyrology
   mark for uncertain readings -- not relevant at this level). Both are
   open items in HANDOFF.md if they turn out to matter.

   No AI/network calls anywhere in this file, per ground rule 3 (see
   HANDOFF.md) -- everything here is a plain lookup table plus Unicode
   NFC composition, which is deterministic and offline.
   ====================================================================== */

const HOPLITE_LETTERS = {
  a:'α', b:'β', g:'γ', d:'δ', e:'ε', z:'ζ',
  h:'η', u:'θ', i:'ι', k:'κ', l:'λ', m:'μ',
  n:'ν', j:'ξ', o:'ο', p:'π', r:'ρ', s:'σ',
  w:'ς', t:'τ', y:'υ', f:'φ', x:'χ', c:'ψ', v:'ω',
  A:'Α', B:'Β', G:'Γ', D:'Δ', E:'Ε', Z:'Ζ',
  H:'Η', U:'Θ', I:'Ι', K:'Κ', L:'Λ', M:'Μ',
  N:'Ν', J:'Ξ', O:'Ο', P:'Π', R:'Ρ', S:'Σ',
  W:'Σ', T:'Τ', Y:'Υ', F:'Φ', X:'Χ', C:'Ψ', V:'Ω',
  '?':';', ';':'·' // Greek question mark; Greek ano teleia (·)
};

// Digit -> diacritic name. Combining-mark codepoints as explicit \u
// escapes throughout (see js/greek.js's comment on why -- pasted
// combining characters render attached to whatever precedes them and
// can't be visually verified in source).
const HOPLITE_DIACRITIC_KEYS = {
  '1':'rough', '2':'smooth', '3':'acute', '4':'grave', '5':'circumflex',
  '6':'macron', '7':'breve', '8':'iotaSub', '9':'diaeresis'
};
const HOPLITE_MARK_CODEPOINT = {
  rough:'̔', smooth:'̓', acute:'́', grave:'̀',
  circumflex:'͂', macron:'̄', breve:'̆',
  iotaSub:'ͅ', diaeresis:'̈'
};
// Diacritics that are mutually exclusive with each other (a letter can
// only carry one breathing, one pitch accent, one vowel-quantity mark) --
// turning one of a group on clears the others in that same group.
const HOPLITE_EXCLUSIVE_GROUPS = {
  rough:['rough','smooth'], smooth:['rough','smooth'],
  acute:['acute','grave','circumflex'], grave:['acute','grave','circumflex'], circumflex:['acute','grave','circumflex'],
  macron:['macron','breve'], breve:['macron','breve']
};
// Fixed composition order (doesn't affect the final NFC-composed
// character, since Unicode canonical ordering reorders combining marks
// by combining class regardless of input order -- fixed here only so
// output is deterministic/debuggable).
const HOPLITE_MARK_ORDER = ['rough','smooth','iotaSub','macron','breve','diaeresis','acute','grave','circumflex'];

// Toggle `markName` in a Set of currently-active mark names, clearing any
// mutually-exclusive sibling marks when turning one on. Pure function,
// easy to unit-test without a DOM.
function hopliteToggleMark(activeMarks, markName){
  const next = new Set(activeMarks);
  if (next.has(markName)){
    next.delete(markName);
  } else {
    (HOPLITE_EXCLUSIVE_GROUPS[markName] || []).forEach(sibling => next.delete(sibling));
    next.add(markName);
  }
  return next;
}

// base: a single Greek base letter. activeMarks: a Set of mark names.
// Returns the fully composed, NFC-normalized character -- relies on the
// platform's own correct Unicode composition rather than a hand-rolled
// table of every precomposed Greek Extended character (same reasoning as
// js/greek.js's stripGreekAccents).
function hopliteCompose(base, activeMarks){
  const marks = HOPLITE_MARK_ORDER.filter(m => activeMarks.has(m)).map(m => HOPLITE_MARK_CODEPOINT[m]).join('');
  return (base + marks).normalize('NFC');
}

// Wires the scheme onto a real <input> element via keydown interception.
// Returns a controller {enable(), disable(), isEnabled()} so callers can
// offer an escape hatch (paste, OS input, etc.) rather than trapping the
// user in this scheme -- consistent with the no-gamification/never-locked
// design principle used elsewhere in this app (see HANDOFF.md).
function attachHopliteInput(inputEl){
  let enabled = true;
  // Tracks the most recently inserted Greek letter: its BASE character
  // (undecorated -- diacritics are recomposed from this every toggle,
  // never accumulated onto an already-composed character), its position
  // in inputEl.value, and its currently-active diacritics. Reset to null
  // whenever the user does anything that invalidates "immediately after
  // that letter" (moves the cursor, types something else, etc.), since a
  // digit key at that point has no defined current letter to modify.
  let lastBase = null;
  let lastPos = null;
  let lastMarks = null;
  let lastLen = 0; // length (in UTF-16 code units) of the currently-composed character at lastPos

  function resetTracking(){ lastBase = null; lastPos = null; lastMarks = null; lastLen = 0; }

  function handleKeydown(e){
    if (!enabled) return;
    if (e.ctrlKey || e.metaKey || e.altKey) { resetTracking(); return; } // don't hijack shortcuts (copy/paste/etc.)

    const el = inputEl;
    const selStart = el.selectionStart, selEnd = el.selectionEnd;
    const cursorRightAfterLastLetter = (lastPos != null) && selStart === selEnd && selStart === lastPos + lastLen;

    if (Object.prototype.hasOwnProperty.call(HOPLITE_LETTERS, e.key)){
      e.preventDefault();
      const greek = HOPLITE_LETTERS[e.key];
      const before = el.value.slice(0, selStart), after = el.value.slice(selEnd);
      el.value = before + greek + after;
      const newPos = before.length;
      el.selectionStart = el.selectionEnd = newPos + greek.length;
      lastBase = greek;
      lastPos = newPos;
      lastMarks = new Set();
      lastLen = greek.length;
      el.dispatchEvent(new Event('input', { bubbles:true }));
      return;
    }

    if (Object.prototype.hasOwnProperty.call(HOPLITE_DIACRITIC_KEYS, e.key)){
      if (!cursorRightAfterLastLetter) return; // no current letter to modify -- let the digit type normally
      e.preventDefault();
      const markName = HOPLITE_DIACRITIC_KEYS[e.key];
      lastMarks = hopliteToggleMark(lastMarks, markName);
      const composed = hopliteCompose(lastBase, lastMarks);
      const before = el.value.slice(0, lastPos), after = el.value.slice(lastPos + lastLen);
      el.value = before + composed + after;
      el.selectionStart = el.selectionEnd = lastPos + composed.length;
      lastLen = composed.length;
      el.dispatchEvent(new Event('input', { bubbles:true }));
      return;
    }

    // Any other key (backspace, arrows, space, paste, etc.): let it act
    // natively, but the "current letter" context no longer applies.
    resetTracking();
  }

  inputEl.addEventListener('keydown', handleKeydown);

  return {
    enable(){ enabled = true; },
    disable(){ enabled = false; resetTracking(); },
    isEnabled(){ return enabled; }
  };
}
