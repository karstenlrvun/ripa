/* ======================================================================
   Cotidie — what changed, in the app rather than only in the repo.
   Added 2026-08-30. Ported from vocabula, with one instruction attached:
   keep it SHORT. Vocabula's own changelog grew into paragraphs nobody
   reads, which is the failure mode to avoid here, so the rule is one line
   per change, plain words, no version-speak and no file names. If a change
   cannot be said in a sentence it probably wants saying on its own screen.

   Newest first. Shared by both decks: the app changes, not the language.
   ====================================================================== */
const CHANGES = [
  ['2026.08.31.2', [
    'Sync can be set up inside each deck now — the code box and "Get a code for this device" are on the Settings screen, not only in the launcher.',
    'Settings remembers when it last synced instead of forgetting every time you reopen it, and says in plain words what the code does and where your reviews go.',
    'New: <b>Restore the copy this replaced</b>. This device keeps one step back of its own, so a bad merge can be undone even when the copy on the server is bad too.',
    'Home warns when a lot of reviews have piled up since the last copy reached the server.'
  ]],
  ['2026.08.31.1', [
    'Home was cramped. The paradigm groups are a list now, with the due counts lined up on the right, so it is obvious at a glance which one is the big one.',
    'Look up moved to the top bar beside Settings. Review takes the whole width instead and leads with the number.',
    'Spacing and type redone throughout: cards were set tighter than everything around them by accident, and there were nine text sizes doing the work of three.',
    'On a laptop, Home is one wide column with a narrower one beside it, instead of two half-empty ones.'
  ]],
  ['2026.08.30.3', [
    'The four buttons are two. Review takes most of the row, Look up is the magnifier beside it, and Stats and Settings are the icons in the top corners.',
    'New: <b>Where you keep slipping</b> — the cells you get wrong most, with a button that drills only those. Press a row to flag it; the full ranked list is behind it, and can be grouped by tense, voice, mood or case.',
    'Review now says how many cells and roughly how long, from your own answer times. If you have no daily limit set it offers to set one.',
    'The study-days strip is shaded by how much you did, so a light day and a heavy one no longer look the same.',
    'A wrong answer now says when the cell comes back and how often it has beaten you, and can be flagged on the spot.',
    'On a laptop, Home uses the width instead of a narrow column down the middle.',
    'Keyboard shortcuts, shown on the buttons and listed under the ⌨ icon while drilling.',
    'This screen.'
  ]],
  ['2026.08.30.2', [
    'Fixed: twenty-one futures were stored in the older uncontracted spelling — ἀγγελέω where Attic writes ἀγγελῶ. Two of them were spelled exactly like their own present, so those cards could not be answered at all.',
    'Fixed: two principal parts were wrong against LSJ — ἐπιτρέπω’s perfect, and ὄμνυμι’s future.',
    'Fixed: Stats counted 5,564 cells and drew 4,204. The whole Principal parts group was missing from the grid.',
    'Fixed: ἁθροίζω was shown with a smooth breathing and graded with a rough one.'
  ]],
  ['2026.08.30.1', [
    'New: principal parts as a deck — 301 verbs, each part its own cell.'
  ]],
  ['2026.08.23', [
    'Home is a short list of groups instead of every system at once. Greek’s was fifteen phone screens long.'
  ]],
  ['2026.08.21', [
    'Sync: two devices merge rather than overwrite. Reviews from both are kept.',
    'New: a daily limit on how many unseen cells are introduced. Cells already in progress are never held back.'
  ]]
];

// The running version, read off the newest entry rather than written down a
// second time. A changelog whose top line disagrees with the build number is
// worse than no changelog, and this makes the two the same fact. tests/run.sh
// checks it against the BUILD file, which is what the ?v= asset queries and
// the launcher's About box are stamped from.
const BUILD = CHANGES[0][0];
