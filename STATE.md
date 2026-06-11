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

## Visuals (added third iteration, 2026-06-11)

Real pixel art from the CC0 "Zelda-like tilesets and sprites" pack
(ArMM1998, OpenGameArt — see `public/assets/CREDITS.md`). Tiles map via
`TILE_FRAMES` in `src/engine/textures.ts` (overworld sheet = 40 cols of
16x16; frame = row*40+col). Tree canopies are 32x32 depth-sorted
overlays; hero has 4-dir walk anims (16x32 frames, rows down/left/up/
right); NPCs are the tinted `NPC_test.png` template — distinct colors,
but bald placeholder figures. Seal crystal remains original generated
art. Public server on :4173 serves `dist/` — rebuild to publish.

## Puzzle/terrain layer (added fourth iteration, 2026-06-11)

Tile ids 8 (barred gate), 9 (stairs, generated art), 10 (cliff face),
11 (pressure plate, generated). Maps may declare `blocks` (pushable) and
`puzzle: {plates, gates, solvedFlag}` — covering all plates flips gate
tiles to floor and sets the flag (gates start open if flag already set).
Map data is structuredClone'd per scene create because puzzles mutate
tiles. Outskirts has a cliff terrace + stairs; the shrine is a two-room
dungeon (block trial gates the inner sanctum). Smoke test covers the
whole walk including the puzzle.

User feedback fixed this iteration: hero left/right walk rows were
swapped (moonwalk); dialogue box now depth 10000 + paginates long text
(3 wrapped lines per page).

## Fifth iteration (2026-06-11, same day)

User feedback: stairs looked rotated (fixed — stairs_h/stairs_v split,
risers perpendicular to climb), terrace cliff didn't enclose the upper
level (fixed — closed polygon, stairs are the only way up), shrine
facade looked like a house (fixed — new `props` map feature placing
multi-tile sheet structures; stone arched entrance on the terrace,
guardian statues flanking the trial gate inside). Props: `props:
[{sheet: [px,py,w,h], x, y, dx?, dy?}]` — depth = base row.

User direction: aesthetics should keep moving from "Pokemon-like"
toward Golden Sun's denser, warmer look — more elevation play,
stonework, ornament. Bear this in mind for every new map.

## Next up (in order)

1. Battle system design doc, then implementation (elements, Kindred) —
   user explicitly wants monsters in the shrine.
2. Per-character NPC look (palette-swapped character sheets) + NPCs
   face the player when addressed.
3. Act 1 closing beat: departure scene after the breach.
4. Interiors via `Inner.png` (house/shrine inner rooms); richer cliff
   edges (grass-top cap tiles) for the terraces.

## Decisions made

- Web (Vite + TS + Phaser 3) over Godot — shareability (2026-06-11).
- Original content only — names/prose/assets never Nintendo/Camelot's;
  GS1 *beat structure* as temporary scaffolding, drift is the goal.
- Inherited the six character theses from the ROM-hack vault as canon
  (sick genius, weathered brother, the Test, etc.) — see story bible.
- Model economy: Sonnet for implementation, Fable/Opus for
  architecture/narrative sessions.
