# riverbank — handoff

A spaced-repetition vocabulary app for a general audience, forked from `~/Downloads/vocabula`'s
FSRS study engine. Four decks — `latin.html`, `greek.html`, `italian.html`, `sat.html` — each a
**single self-contained HTML file**, same no-build-step, no-dependency philosophy as vocabula.
`vocabula/` itself was never modified; this is a separate, sibling project.

Repo location: `~/Downloads/riverbank`, pushed to `github.com/karstenlrvun/ripa` (private) and
live at `https://ripa.karsten-vun.workers.dev` — see §6 for what that deploy actually involved.

```
riverbank/
  latin.html, greek.html, italian.html, sat.html   the four decks
  index.html                             launcher linking the three
  manual.html                            simplified in-app guide (usage only, no internals)
  Riverbank-Getting-Started.pdf          standalone install guide
  Riverbank-vs-Vocabula.pdf              feature comparison, see §7's footer note
  HANDOFF.md                             this file
  tests/run.sh, tests/tests.js           automated tests for the decks (§4)
  sync-worker/worker.js                  the Cloudflare Worker (sync + feedback)
  sync-worker/wrangler.toml              its deploy config
  sync-worker/test.mjs                   automated tests for the Worker (§4)
```

---

## 1. What's different from vocabula

Vocabula is built for one person (Karsten, an Oxford classics student) with every knob exposed.
Riverbank is for a general audience who should be able to use it without ever seeing how it
works. Concretely, relative to the vocabula template:

**Settings removed entirely** (not just hidden — the underlying mechanism was hardcoded or deleted):
- Longest interval — gone, `maxIvl` stays at its default, no UI.
- Let hesitation adjust the grade — hardcoded on (`useTiming:true`).
- Clearing a word for the day (easy-only vs good-enough) — hardcoded to easy-only (`requireEasy:true`).
- Consecutive good days before release — hardcoded to `drillDays:3`.
- Head start for known words — removed; no card in any of these four decks has a seed of `1`
  or `2` (all use `-1`, "no audit"), so this setting would have done nothing anyway.
- Michaelmas begins / term countdown — removed along with the whole term-relative projection
  in `renderPace()`/`renderSyllabus()`, not just the date field. Doesn't make sense without a
  fixed cohort start date.
- **The entire struggling-words / leech-flag mechanic** — gone from UI and scheduling: no more
  flag button on the study card, no "Struggling words" section on the front screen, no
  `FLAG_MANUAL`/`FLAG_AUTO`/`againDayCounts`/`againDaysFor`/`strugglingWords`/`renderStruggling`/
  `flagRow`, no auto-set-aside in `rate()`, no retroactive migration in `normalise()`. Requested
  because it was buggy in vocabula's history (see vocabula's HANDOFF.md §4a) and added complexity
  without a version of the feature that felt trustworthy for people who don't want to think about
  the scheduler. `cs.susp` no longer exists anywhere in card state.
- **The whole "What happens on its own" background-process panel** — gone (live stats +
  collapsible list of every automatic behaviour, plus its `renderBg()` function). Too much
  exposure of internals for a general audience. The home screen's existing warning banner
  (`renderWarn()`) still nudges about a stale backup/sync on its own.
- GitHub gist sync (`gistId`/`gistTok`) — replaced, see §3.

**Settings kept, text rewritten**: every remaining `.fh` help line was cut to one short sentence,
no commas or semicolons, e.g. "Caps how many unseen words enter the rotation each day, counted
separately for each direction — so working through forward words no longer leaves the reverse
direction with nothing." became "Limits how many new words appear each day." The Settings screen
is now grouped under four headers: **Pace**, **Appearance**, **Backup & sync**, **Danger zone**,
plus a standalone **Guide** link.

**Theme picker**: reduced from 7 palettes to 5 (Vellum, Catppuccin, Rose Pine, Gruvbox, Legacy —
Kanagawa and Everforest dropped for being too visually close to the others at a glance) and
changed from a `<select>` dropdown to a row of tappable swatches (`renderPalSwatches()`,
`.palSwatch` — note the selected-state class is `.cur`, not `.sel`, because `.sel` collides with
an existing `.field .sel` CSS rule for `<select>` width; this bit us once already, see §5).

**Part picker redesigned** (`openPartSheet()`/`renderPartSheet()`/`closePartSheet()` in every
deck): the old inline chip-cloud (`#chips` on the home screen, `#browseParts` on the Browse
screen) is fine at Latin's 6 categories but unusable at Italian's 39 sections. Both are now a
single button ("All parts" / "N parts" / a specific name) that opens a shared bottom-sheet list —
checkboxes for the home screen's multi-select (`S.parts`), radio bullets for Browse's
single-select (`browsePart`), each row showing a live word count. `partSheetMode` (`'home'` or
`'browse'`) tracks which one is open. The bucket chips (`#bchips`, known/shaky/unseen) are
untouched — they stay as plain chips since there are only ever three, and in practice they're
already invisible for all three riverbank decks (`HAS_BUCKETS` is false — every card seeds at
`-1`, never `1`/`2`, so every card's bucket is `'unseen'`).

**A simplified `manual.html`**, linked from Settings ("Guide") and from `index.html`. Deliberately
shallow: how to add to the Home Screen, what Again/Good/Easy mean, plain-language settings
summaries, how sync-by-code works, backup/restore/erase. No mention of FSRS, retention math,
the drill mechanic, gating logic, or anything else meant to stay invisible.

**`Riverbank-Getting-Started.pdf`**: a standalone one-page install guide (Add to Home Screen on
iPhone/iPad, Add to Dock on Mac, sync-code walkthrough), built by rendering
`getting-started-print.html`-style markup through headless Chrome
(`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome --headless --print-to-pdf=...`) —
there's no wkhtmltopdf/weasyprint on this machine, but Chrome's own headless print is on the disk
and gives full CSS fidelity. The source HTML for it isn't kept in this repo (it was scratch-only);
regenerate by writing similar HTML and running the same command if it ever needs updating.

**A Feedback box** in Settings (`#fFeedback`, its own "Feedback" group, right after Backup & sync):
a plain textarea, 500-character hard cap, sent to the Worker's `/feedback` endpoint one-way —
nothing sent here is ever displayed back inside the app. See §3 for the server-side guards
(honeypot, rate limiting, sanitization) and their test coverage.

---

## 2. Data sources

| Deck | Source | Words | Notes |
|---|---|---|---|
| Latin | `~/Downloads/latin.pdf` — OCR AS Level Latin Defined Vocabulary List | 848 | Clean table extraction (`pdfplumber`, column-position based). 9 rows had a blank Classification cell in the source; each was assigned the Classification of the row immediately before it — flagged as an inference, not fact, in case a different default is wanted. |
| Greek | `~/Downloads/greek-1.pdf` — OCR AS Level Classical Greek DVL | 765 | Pages 3–4 of the source PDF garble badly under naive text extraction (words split across false line breaks). Re-verified those pages by rendering to images and reading glyph-by-glyph instead (had to `brew install poppler` for `pdftoppm` — now on this machine). All entries use Part `"All"`, matching vocabula's own `greek.html` convention for a deck with no thematic categories. |
| Italian | `~/Downloads/L.docx` — a 40-section Italian study guide, not a plain word list | 635 | Restructured, not just extracted: plain vocab/phrase pairs became ordinary cards; verb conjugation tables became one card per infinitive **plus** one card per grammatical person (114 of the 635 are person-conjugated forms); pure grammar-rule prose (pronunciation rules, tense-formation rules, pronoun-usage rules) was excluded — only its concrete example phrases became cards. Judgment calls worth knowing about: days of the week, months, and colours had no inline English gloss in the source and were given standard translations; the imperative section (§30) had almost no inline glosses either and was mostly skipped rather than guessed. |
| SAT English | A general SAT-prep word list, Karsten's own source, pasted directly (no OCR) | 500 | Monolingual — English word ↔ English definition, not a translation pair. See §8. |

All four use `seed:-1` for every row (no pre-known/audit words) and `KEY`s `riverbank.latin.v1`
/ `riverbank.greek.v1` / `riverbank.italian.v1` / `riverbank.sat.v1` — distinct from vocabula's own
`vocabula.latin.v2` / `vocabula.greek.v1`, so installing both on one device never collides.

---

## 3. Sync — what's built, what's left

Gist sync (GitHub id + personal access token) is gone. Replaced with a short human-shareable
**sync code**, backed by a small Cloudflare Worker + KV store (`sync-worker/worker.js`,
`sync-worker/wrangler.toml`). Two independent SHA-256 hashes are derived from the code
client-side: one is the KV lookup key sent to the Worker, the other is an AES-GCM key that never
leaves the device — the Worker and its KV namespace only ever see ciphertext. Verified in-browser
(round-trip encrypt/decrypt matches, wrong code fails to decrypt, `kvKey` is a proper 64-char hex
SHA-256 digest).

**Status: `/sync/*` is live.** The Worker is deployed at `https://riverbank-sync.karsten-vun.workers.dev`
and `SYNC_ENDPOINT` in all four decks points at it. Confirmed with real HTTP requests (not just
unit tests): `GET /sync/<64 zeros>` → 404 as expected, `OPTIONS` → 200 with CORS headers. Still
untested against two real devices actually syncing a study history back and forth — only the
crypto round-trip and deliberately-failing-fetch paths were exercised directly.

**Feedback needs one more deploy step.** A `/feedback` endpoint was added to `worker.js` after
the Worker's first deploy, so the *currently live* Worker doesn't have it yet — confirmed with
`curl -X POST .../feedback`, which 404s against production right now. To make it live:
```
wrangler kv namespace create RIVERBANK_FEEDBACK
# paste the id into wrangler.toml's second [[kv_namespaces]] block
wrangler deploy
```
Until that's done, the Settings → Feedback → Send button fails closed with a "Could not send —
try again later" toast — confirmed live, no crash, nothing lost (the typed text stays in the box).
See `sync-worker/test.mjs` for a local test suite covering both endpoints (`node test.mjs`, no
deploy or network needed — it imports `worker.js` directly and mocks KV with an in-memory Map).
It specifically covers the things asked for when this feature was requested: a message length
floor and ceiling (3–500 chars, enforced both client-side via `maxlength` and server-side), a
per-IP rate limit (60 seconds between submissions, 20/day hard cap, verified with 21 simulated
submissions), a honeypot field that silently discards bot-filled submissions while still returning
200 (so a bot can't distinguish success from rejection), control-character stripping, allowlist
validation on the `deck` field, and (added when CORS was locked down, §6) that only the deployed
app's own origin gets an `Access-Control-Allow-Origin` header back. All 48 cases pass. Submitted
text is stored as a plain JSON string in KV and never rendered as HTML anywhere in this codebase —
if anyone ever builds an admin viewer for these messages, it must escape them at render time; this
Worker only guarantees safe *storage*, not safe *display*.

---

## 4. Testing method, if you need to re-verify

Node showed up on this machine partway through (`v26.5.1` — absent in an earlier session, present
now; don't assume either way, just check). Everything below works with either Node or macOS's
built-in JavaScriptCore (`jsc`), and the tooling here prefers Node when it's present.

**An automated test suite now exists for the decks themselves** (it didn't in earlier sessions):
```bash
cd tests && ./run.sh ../latin.html      # or ../greek.html, ../italian.html, ../sat.html
```
Mirrors vocabula's own `tests/run.sh` convention exactly: extracts everything above `function
tapZone` (the pure logic — data model, scheduler, sync decision, part picker — no DOM or event
wiring) from the deck's `<script>`, appends `tests.js`, runs it with `node` if available, else
`jsc`. 36 checks, currently passing on all four decks: DATA shape/seed/emptiness, unique card
ids, the settings that were hardcoded on purpose this session (`requireEasy`, `useTiming`,
`drillDays`, and that `gistId`/`gistTok`/`term` are gone), day-key math, an FSRS sanity check
(Easy schedules further out than Again; a drilled Good stays same-day), `syncDecision`'s four
branches, `randomSyncCode()`'s shape and character set, and `activeParts()`/`partCounts()`. The
sync-code checks skip themselves under `jsc` with a visible `SKIP` line rather than crashing —
`jsc` has no Web Crypto global at all, which is a limitation of that fallback engine, not of the
app (real browsers always have it).

**`sync-worker/test.mjs`** (45 checks) tests the Worker directly in Node by importing `worker.js`
and mocking `env.RIVERBANK_SYNC`/`env.RIVERBANK_FEEDBACK` as in-memory Maps — no deploy, network,
or wrangler needed. Run it after any edit to `worker.js`, before deploying.

**Syntax-check without running anything**: extract the inline `<script>` and check it —
```bash
python3 -c "
import re
html = open('latin.html', encoding='utf-8').read()
open('/tmp/chk.js','w',encoding='utf-8').write(re.findall(r'<script>(.*?)</script>', html, re.S)[0])
"
node --check /tmp/chk.js   # or: jsc /tmp/chk.js, if node isn't there
```
Under `jsc` specifically, a clean run reaches `ReferenceError: Can't find variable: document` (the
first DOM access) with no `SyntaxError` before it — that's success, not failure. `node --check`
gives a cleaner yes/no without needing to interpret that.

**Live browser testing**: `preview_start` only reads `.claude/launch.json` from the **primary**
working directory (`vocabula/`, not `riverbank/`, per this environment's setup) — adding a config
there to serve riverbank would edit a file in a project explicitly meant to stay untouched. Don't
do that (this session did once, by mistake, and reverted it). Instead: start a plain server with
Bash (`python3 -m http.server <port>` from inside `riverbank/`) and open it with
`preview_start({url: "http://localhost:<port>/..."})`, which doesn't touch any launch.json at all.

Coordinate-based clicks (`computer` tool) were unreliable in this environment for reasons that
were never fully diagnosed — several genuine clicks silently no-op'd. `document.getElementById(id).click()`
via `javascript_tool` was reliable throughout and is the safer default for driving this app in
tests. One gotcha specific to this app: `reveal()` has a 260ms guard against a fast double-tap
landing on the next card's reveal control — a synchronous test click right after `startBtn.click()`
will silently no-op, and that's correct behaviour, not a bug (confirmed by re-testing with a
`setTimeout` delay).

---

## 5. Bugs found and fixed this session (in case the pattern recurs)

- **`renderSyllabus()` referenced a variable `R`** that was deleted along with the Michaelmas
  term-projection code but was still used for an unrelated "Your target" retention stat two lines
  later. This silently broke *every* "back to home" button and the Study button across all three
  decks (the click handler calls `renderHome()` → `renderSyllabus()` → throws → the subsequent
  `show('scHome')` never runs) until caught by testing every navigation path, not just the ones
  that were directly edited. Fixed by reading `S.settings.retention` directly instead. **Lesson**:
  after deleting a "dead" local variable, grep the whole enclosing function body, not just the
  block that looked related.
- **Theme swatch selected-state class named `.sel`** collided with a pre-existing `.field .sel`
  CSS rule (`width:100%`) meant for `<select>` elements, since the swatch buttons live inside a
  `.field` div too. Every swatch rendered at 64px except the selected one, which stretched to the
  full row. Renamed the class to `.cur`.
- **A regex meant to strip control characters got written with the literal raw bytes instead of
  `\u00XX` escapes** (`/[\x00-\x08...]/` where those really were unprintable bytes sitting in the
  `.js` source file, not text describing them). It happened to still be valid, working JavaScript
  — a character class can contain literal bytes — but a source file with an embedded NUL byte is
  fragile for no reason (editors, diffs, and some tooling handle that badly). Caught by inspecting
  the file's raw bytes rather than trusting a text view, and rewritten with proper `\u0000`-style
  escapes. **Lesson**: if a tool call reports writing a control-character regex, verify the actual
  bytes on disk rather than assuming the escape sequence you intended is what landed.
- **`.git/` and `.wrangler/tmp/` were briefly served as public static assets on the live site** —
  see §6's incident writeup below. Real exposure, confirmed and fixed within the same session, no
  secrets were ever actually at risk (the repo's history was clean), but treat this as a template
  for the mistake, not a one-off: **any time `assets.directory` points at a raw git checkout,
  explicitly exclude `.git/` and `.wrangler/` in `.assetsignore` — they are not hidden by default,**
  and a CI checkout recreates both fresh on every build regardless of what's actually tracked by git.

---

## 6. Deployment — what's actually live right now

This diverged from the plan below in one real way: Cloudflare's dashboard no longer offers the
classic "Pages: connect a repo, set a build output directory" wizard by default. What's there now
is a unified **Workers** creation flow that runs `npx wrangler deploy` against whatever's in the
repo — which needs a `wrangler.jsonc` *in the repo* to know what to serve, rather than a build
output directory picked in the dashboard UI. Adjusted for that; end state is equivalent (a static
Worker, auto-deployed from GitHub on every push to `main`).

**Current state, confirmed live by direct `curl` checks, not assumption:**

- Repo: **`github.com/karstenlrvun/ripa`** (private). Note the name — it's `ripa`, not
  `riverbank`; that's just what he named the GitHub repo, everything else is unaffected.
- Site: **`https://ripa.karsten-vun.workers.dev`** — this is a Cloudflare *Worker* (with static
  assets), not a classic Pages project, though it behaves identically from a visitor's side.
  Auto-redeploys on every push to `main`, same as Pages would have.
- Config added to the repo root to make this work: **`wrangler.jsonc`** (`assets.directory: "."`,
  `not_found_handling: "none"`) and **`.assetsignore`** (excludes `HANDOFF.md`, `tests/`,
  `sync-worker/`, `.git/`, `.wrangler/`, and its own supporting files).
- `.html` extensions redirect to extensionless paths (`/latin.html` → `/latin`, both resolve) —
  that's Workers Static Assets' default `html_handling`, not a bug; nothing internal to the app
  depends on the `.html` suffix surviving.
- No login gate has been set up (Cloudflare Access). The site is fully public right now — Karsten
  proceeded with what was called "Alternative A" during planning. If he still wants the login gate
  ("Alternative B"), that's a separate, not-yet-started step: Zero Trust → Access → Applications →
  Self-hosted, application domain = the `.workers.dev` URL above, no Tunnel needed since the Worker
  is already Cloudflare-proxied.
- No `LICENSE` file was added (deliberate — default copyright, as decided).

**Incident, during this same deployment (fixed, but read this before touching `.assetsignore`
again):** the first successful deploy's build log showed files like `/.git/objects/...`,
`/.git/hooks/pre-commit.sample`, and `/.wrangler/tmp/deploy-.../no-op-worker.js` being uploaded as
site assets. Confirmed with a direct request — `curl https://ripa.karsten-vun.workers.dev/.git/config`
returned **200**, meaning anyone could have reconstructed the entire repo's history from the live
site, completely bypassing the private-repo protection, regardless of GitHub permissions. Cause:
`.assetsignore` excluded the *source* directories (`sync-worker/`, `tests/`) but nobody had
accounted for `.git/` and `.wrangler/`, both of which get created fresh inside Cloudflare's own
build checkout — they're not something you'd ever see by browsing the repo on GitHub, so it's an
easy thing to miss by inspection alone. Fixed by adding both to `.assetsignore`, pushed, redeployed,
**re-verified with `curl` that `.git/config` and `.git/HEAD` now 404**. No tokens or credentials
were actually exposed — this repo's entire history is the one clean commit made this session — but
had this happened later, after any secret ever touched a commit (even one later "removed"), the
exposure would have made that secret permanently recoverable regardless of the repo's privacy
setting. **Whenever `assets.directory` is set to a directory that a CI system checks out via git,
explicitly list `.git/` and `.wrangler/` in `.assetsignore` from the start — don't wait to notice
them in a build log.**

**CORS on `sync-worker/worker.js` is now locked to this origin** — `ALLOWED_ORIGINS` is a `Set`
containing exactly `https://ripa.karsten-vun.workers.dev`; anything else gets no
`Access-Control-Allow-Origin` header at all (browsers then block the response from being read
cross-origin). `sync-worker/test.mjs` covers this directly (allowed origin echoed back, unrelated
origin gets nothing, no-Origin-header case gets nothing) — 48 checks now, up from 45.

**This CORS fix is only live in the local file as of this writing — it has not been deployed.**
Important distinction to keep straight: **`ripa` and the sync Worker (`riverbank-sync`) are two
separate Cloudflare projects.** `ripa` auto-deploys from GitHub on push, as described above.
`riverbank-sync` does **not** — it was deployed by running `wrangler deploy` by hand from inside
`sync-worker/`, and pushing changes to `sync-worker/worker.js` on GitHub does nothing to the live
`riverbank-sync` Worker until that command is run again locally. **Next step: `cd sync-worker &&
wrangler deploy`**, then re-verify with `curl -H "Origin: https://ripa.karsten-vun.workers.dev" ...`
that the allowed origin still works and an arbitrary origin doesn't.

None of the login-gate discussion below changes the fact that no client-side web app can prevent
someone from viewing its own HTML/CSS/JS once loaded — the browser has to have the full source to
run it. The private repo + no license controls the *source*; a login gate (if added later) controls
who can *reach* the app at all. Neither one hides code from someone already looking at it.

---

## 7. Open items for next time

- **Deploy the CORS fix**: `cd sync-worker && wrangler deploy`, then confirm with `curl` (see §6).
  Until this runs, the live sync Worker still accepts requests from any origin.
- **Create the `RIVERBANK_FEEDBACK` KV namespace** (`wrangler kv namespace create
  RIVERBANK_FEEDBACK`, paste the id into `sync-worker/wrangler.toml`) and redeploy — feedback
  collection is otherwise inert. Confirmed still 404 as of this writing. Same `wrangler deploy` run
  as above can cover both this and the CORS fix at once.
- Decide on the Access login gate ("Alternative B") — not started. The site is public right now.
- No end-to-end test yet of the sync conflict flow (`syncOnLaunch`/`offerConflict`) against two
  real devices — only the pure `syncDecision()` branching logic has automated coverage (§4).
- Dark mode and the daily-rotation theme feature were exercised (Catppuccin/Gruvbox toggle tested
  live) but not screenshotted across all 5×2 palette/mode combinations.
- The 9 Latin rows with an inferred (not sourced) Classification are listed in §2 above — worth a
  second look against the actual OCR spec if precision here matters.
- `Riverbank-vs-Vocabula.pdf` (repo root) is a feature-comparison table between the two apps, with
  a short list of things worth backporting into vocabula regardless of audience (payload
  encryption for the gist, mainly) — written for Karsten, not required reading for a future coding
  session, but useful context for why some things here differ from vocabula on purpose.
- **`ALLOWED_DECKS` in `sync-worker/worker.js` was widened to include `'sat'`** (§8) but not yet
  deployed — bundle it into the same `wrangler deploy` run already needed for the CORS fix and the
  feedback KV namespace above. Until then, a feedback submission from `sat.html` is still accepted
  by the live Worker but recorded with `deck:"unknown"` rather than `"sat"` (the Worker fails soft
  on an unrecognised deck, it doesn't reject the submission — see `worker.js` around
  `ALLOWED_DECKS.has(body.deck)`).

---

## 8. Fourth deck: `sat.html`, moved in from vocabula (2026.08.03)

A general SAT-prep word list (500 words, Karsten's own source, not sourced from any of the
OCR'd PDFs in §2) was first built in `~/Downloads/vocabula` by mistake — that project is Karsten's
personal Oxford Classics app and was never meant to gain a fourth, unrelated deck. Caught before
anything was pushed anywhere; all trace of it was reverted out of `vocabula/` (its `HANDOFF.md`,
`index.html`, and `manual.html` back to exactly their prior wording) and the deck rebuilt here
instead, against riverbank's own template rather than vocabula's — the two have diverged enough
(§1) that a straight copy would have carried over gist settings, the term countdown, and the
struggling-words mechanic, all of which riverbank deliberately doesn't have.

Built as an exact copy of `greek.html` (chosen as the base since, like Greek, this deck has no
thematic Parts — every row is Part `"All"`), differing only in the same handful of fields the
other three decks already differ by: `apple-mobile-web-app-title`/`<title>`, `DECK.fwd`/`DECK.rev`/
`DECK.mottos`, `KEY` (`riverbank.sat.v1`), `DECK_ID` (`'sat'`), and the export filename prefix —
verified with the same collapsed-DATA-line diff this file's own §1 discipline implies, zero
unexpected hunks. Because this deck is monolingual (English word ↔ English definition, not a
translation pair), `DECK.fwd`/`DECK.rev` read `"Word → Definition"`/`"Definition → Word"` rather
than a language pair, and `DECK.mottos` holds English aphorisms about language (Twain, Johnson,
Wittgenstein, Swift, Dickinson, Bacon, Confucius, Holmes, Emerson, Kipling) instead of the
target-language epigrams the other three decks use — same `[m[0], m[1]]` →
`#mottoLa`/`#mottoEn` rendering, just an attribution string in the second field instead of a
translation. `DECK.name` stays `"Riverbank"`, matching every other deck — riverbank uses one
consistent brand wordmark, unlike vocabula's per-deck native-script name.

`tests/tests.js` hardcoded an allowlist of the three deck ids that existed at the time
(`ok('DECK_ID is one of latin/greek/italian', ...)`); updated to include `'sat'` (§4). All four
decks pass the full 36-check suite. `sync-worker/worker.js`'s own `ALLOWED_DECKS` allowlist for
the `/feedback` endpoint had the same gap — updated locally (see the open item above), not yet
deployed. `index.html` gained a fourth card; its footer note was already deck-count-agnostic
("Add each language...") and needed no change. `manual.html` was already written generically
enough (no enumerated deck list, no hardcoded count) that it didn't need touching either.

Not yet done: nothing pushed to `ripa` on GitHub, so this deck isn't live at
`ripa.karsten-vun.workers.dev` yet; the `ALLOWED_DECKS` worker deploy above; no live-device
verification beyond the local `python3 -m http.server` + browser-preview check described in §4.
