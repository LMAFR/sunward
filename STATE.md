# STATE — resume notes

Updated: 2026-06-11

## Current state

Vertical slice v0: boots in browser at 240×160×3, one map
(`vale-outskirts`), grid movement with collision, two NPCs with
JSON-driven dialogue, GS-style typewriter box. Build green
(`npm run build`), headless smoke test green with screenshot proof
(`scripts/smoke.png`).

## Environment notes

- Headless Chromium on this VPS needs `libnss3`/`libnspr4`, which are NOT
  installed system-wide (no passwordless sudo). They are extracted to
  `~/.local/chromium-libs/usr/lib/x86_64-linux-gnu` — pass via
  `LD_LIBRARY_PATH` (see README "Verify" section for the full command).
- Browser binary: Playwright cache
  `~/.cache/ms-playwright/chromium_headless_shell-1208/`.

## Next up (in order)

1. Map transitions: a `triggers` array in map JSON (`door`, `edge` types)
   that loads another map. Requires a second map to test against.
2. NPC facing + simple walk animation once real sprites land.
3. Pick a free GBA-style tileset (Time Fantasy-like or generated) and map
   tile ids onto it — tile ids in map JSON are stable by design.

## Decisions made

- Web (Vite + TS + Phaser 3) over Godot — shareability (2026-06-11).
- Original content only, no Nintendo/Camelot assets — legal shareability.
- Model economy: user runs Sonnet for implementation sessions, Fable/Opus
  for architecture/narrative-heavy sessions.
