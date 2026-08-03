#!/bin/bash
# Usage: ./run.sh ../latin.html   (or ../greek.html, ../italian.html)
#
# Extracts everything above `function tapZone` from the given deck -- the
# pure logic (data model, scheduler, sync decision, part picker) with no DOM
# or event wiring -- appends tests.js, and runs the result with node if
# available, falling back to macOS's built-in JavaScriptCore otherwise.
# Mirrors vocabula's own tests/run.sh convention.
set -euo pipefail

DECK="${1:-}"
if [ -z "$DECK" ]; then
  echo "usage: $0 <path-to-deck.html>" >&2
  exit 1
fi
if [ ! -f "$DECK" ]; then
  echo "not found: $DECK" >&2
  exit 1
fi

DIR="$(cd "$(dirname "$0")" && pwd)"
EXTRACTED="$(mktemp)"
COMBINED="$(mktemp)"
trap 'rm -f "$EXTRACTED" "$COMBINED"' EXIT

python3 - "$DECK" "$EXTRACTED" <<'PYEOF'
import re, sys
deck_path, out_path = sys.argv[1], sys.argv[2]
html = open(deck_path, encoding='utf-8').read()
scripts = re.findall(r'<script>(.*?)</script>', html, re.S)
if not scripts:
    sys.exit('no <script> block found in ' + deck_path)
script = scripts[0]
cut = script.split('function tapZone', 1)
if len(cut) != 2:
    sys.exit('function tapZone not found -- extraction boundary has moved')
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(cut[0])
PYEOF

cat "$EXTRACTED" "$DIR/tests.js" > "$COMBINED"

echo "=== $(basename "$DECK") ==="
if command -v node >/dev/null 2>&1; then
  node "$COMBINED"
else
  /System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc "$COMBINED"
fi
