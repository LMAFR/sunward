# Sunward (working title)

A web-based, GBA-style JRPG inspired by Golden Sun — built as an original,
non-profit fan-inspired game. **No Nintendo/Camelot assets, names, or text
are used**: mechanics and feel are reimplemented, all content is original.
This keeps the project legally shareable (itch.io / GitHub Pages).

## Core design principle

**The engine is code; the game is data.** Maps, NPCs, and dialogue live as
JSON under `public/data/`. Adding story content — a new town, a character,
a scene — means adding/editing data files, not engine code. That is what
makes "extend the story by prompting Claude" work.

## Run it

```bash
npm install
npm run dev      # then open the printed localhost URL
```

Arrows to move, Z to talk / advance dialogue. Renders at GBA-native
240×160, scaled 3×.

## Layout

- `src/engine/` — types and placeholder texture generation
- `src/scenes/WorldScene.ts` — tile rendering, grid movement, interaction
- `src/ui/DialogueBox.ts` — GS-style typewriter dialogue box
- `public/data/maps/*.json` — one file per map (tiles, NPCs, player start)
- `public/data/dialogue/*.json` — one file per map, keyed dialogue scripts
- `scripts/smoke.mjs` — headless Playwright smoke test (see STATE.md for
  the library workaround it needs on this VPS)

## Verify

```bash
npm run build    # type-check + bundle
# headless smoke test (boots game, walks to an NPC, opens dialogue, screenshots):
(npx vite preview --port 4173 &) && sleep 2 && \
  LD_LIBRARY_PATH=$HOME/.local/chromium-libs/usr/lib/x86_64-linux-gnu \
  CHROMIUM_PATH=$HOME/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell \
  node scripts/smoke.mjs; pkill -f "vite preview"
```

## Story

`docs/story/story-bible.md` is the naming and structure authority: cast,
glossary, act beats, writing rules. The story follows Golden Sun 1's beat
*structure* as scaffolding with entirely original names, prose, and
characters, and will progressively diverge from it.

## Roadmap (vertical slice → game)

1. ✅ Walkable map, NPCs, data-driven dialogue
2. ✅ Map transitions + story flags + conditional dialogue + on-enter events
3. ✅ Act 1 opening playable (village → outskirts → shrine, breach scene)
4. Real tileset + character sprites (free/original assets), facing animations
5. Turn-based battle system (elements, Kindred — the spirit layer)
6. Party members follow + richer cutscene scripting (movement, music)
7. Save/load (localStorage)
8. Story content at scale
