// The deck registry -- the one list of decks that exist, matching vocabula's
// decks/registry.js exactly in shape and purpose. Read by deck.html's head
// boot script (?deck= allowlist) and, as of 2026-08-20 (adding a third deck
// made it worth doing), index.html's own launcher too -- it now renders one
// card per REGISTRY row instead of two hand-written ones, so a fourth deck
// is a registry entry, not an index.html edit. No mergeRegistry/userDecks
// here the way vocabula has -- riverbank has no on-device deck creation, so
// the registry is simply the static list, nothing to merge in. Loaded as an
// ordinary <script src>, same as vocabula's -- unlike decks/<id>.js, its
// filename never depends on the URL, so it needs no special loading.
//
// Italian and SAT are deliberately NOT here (2026-08-18, Karsten's call --
// "doesn't really need the english and italian files"); this registry only
// ever governed what deck.html?deck=X can open, never their own standalone
// pages. Those pages themselves went further on 2026-08-20 ("it is firmly
// decided that these two decks should be put in archive"): italian.html/
// sat.html are no longer live at their own URLs at all -- moved to
// archive/, excluded via .assetsignore, and 'italian'/'sat' removed from
// tools/build.mjs's MANGLED_DECKS so nothing regenerates them at the root.
// The frozen sources (src/italian.html, src/sat.html) are untouched and
// still exercised by tests/run.sh; only the live-serving path changed.
const REGISTRY=[
  {id:'latin', key:'riverbank.latin.v1', title:'Latin',
   blurb:'848 words, OCR AS Level, both directions'},
  {id:'greek', key:'riverbank.greek.v1', title:'Greek',
   blurb:'765 words, OCR AS Level, both directions'},
  {id:'italian', key:'riverbank.italian.v1', title:'Italian',
   blurb:'360 words, GCSE topics, both directions'}
];
