# STATE — resume notes

Updated: 2026-06-11 (second iteration)

## Current state

Act 1 opening is playable: boot into Aldera Village (opening narration),
quest from Elder Thane, south gate → Aldera Outskirts, east path → Aurin
Shrine (breach scene fires on entry, sets `shrine_breached`), the Warden
talks, and all four village NPCs have post-breach dialogue variants.
Build green; smoke test verifies elder dialogue + a map transition with
screenshots (`scripts/smoke.png`, `scripts/smoke-outskirts.png`).

Engine features: map transitions (`triggers`), story flags (`GameState`),
conditional dialogue (`variants` with `if`/`unless`, `set` on complete),
scripted on-enter events (`onEnter`). Story authority:
`docs/story/story-bible.md` (cast/glossary/beats/writing rules).

## Environment notes

- Headless Chromium libs (`libnss3`/`libnspr4`) extracted to
  `~/.local/chromium-libs/...` — pass via `LD_LIBRARY_PATH` (full command
  in README "Verify").
- **Playwright gotcha:** instantaneous `keyboard.press()` is dropped by
  Phaser in the headless render loop — always hold keys (down → ~100ms →
  up). `scripts/debug-keys.mjs` is the diagnostic harness for input
  issues.
- The scene exposes `window.__sunward` (mapId, isDialogueActive,
  playerTile, facing, debug) as a test hook — drive tests off state, not
  timing.

## Next up (in order)

1. Act 1 closing beat: departure scene (talk to all three companions
   after the breach → flag `act1_complete` → narration at the south
   gate). Cheap, pure data + maybe one engine touch.
2. Real tileset + character sprites; tile ids in map JSON are stable by
   design, so this is a texture-layer swap.
3. Battle system design doc before any battle code (elements, Kindred).

## Decisions made

- Web (Vite + TS + Phaser 3) over Godot — shareability (2026-06-11).
- Original content only — names/prose/assets never Nintendo/Camelot's;
  GS1 *beat structure* as temporary scaffolding, drift is the goal.
- Inherited the six character theses from the ROM-hack vault as canon
  (sick genius, weathered brother, the Test, etc.) — see story bible.
- Model economy: Sonnet for implementation, Fable/Opus for
  architecture/narrative sessions.
