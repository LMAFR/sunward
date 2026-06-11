import Phaser from "phaser";

export const TILE_SIZE = 16;

// The overworld sheet is a 40-column grid of 16x16 frames.
const SHEET_COLS = 40;
const f = (col: number, row: number) => row * SHEET_COLS + col;

/**
 * Map-JSON tile id → frame in the overworld sheet. The ids in map files
 * are stable; swapping art means changing only this table.
 */
export const TILE_FRAMES: Record<number, number> = {
  0: f(0, 0), // grass
  1: f(13, 15), // cobble path
  2: f(4, 3), // water
  3: f(0, 0), // tree: grass base, canopy drawn on top
  4: f(24, 1), // stone wall
  5: f(25, 14), // shingle roof
  6: f(25, 3), // arched doorway
  7: f(13, 15), // seal: cobble base, crystal drawn on top
};

export const TREE_TILE = 3;
export const SEAL_TILE = 7;

/** Hero walk-cycle frame ranges per direction (16x32 frames, 17 cols). */
export const HERO_WALK: Record<string, [number, number]> = {
  down: [0, 3],
  left: [17, 20],
  up: [34, 37],
  right: [51, 54],
};

export function preloadAssets(scene: Phaser.Scene): void {
  scene.load.spritesheet("overworld", "assets/Overworld.png", {
    frameWidth: 16,
    frameHeight: 16,
  });
  scene.load.spritesheet("hero", "assets/character.png", {
    frameWidth: 16,
    frameHeight: 32,
  });
  scene.load.spritesheet("npc", "assets/NPC_test.png", {
    frameWidth: 16,
    frameHeight: 32,
  });
}

/** Custom frames / generated textures that depend on loaded assets. */
export function setupDerivedTextures(scene: Phaser.Scene): void {
  const over = scene.textures.get("overworld");
  // 2x2-tile tree canopy at sheet tiles (5,16)
  if (!over.has("tree")) over.add("tree", 0, 80, 256, 32, 32);

  // the seal crystal is an original generated object
  if (!scene.textures.exists("seal_crystal")) {
    const g = scene.add.graphics();
    g.fillStyle(0x4a2a6a);
    g.fillRect(5, 8, 6, 7);
    g.fillStyle(0x7a4aaa);
    g.fillRect(6, 3, 4, 8);
    g.fillStyle(0xb08ade);
    g.fillRect(7, 4, 2, 4);
    g.generateTexture("seal_crystal", TILE_SIZE, TILE_SIZE);
    g.destroy();
  }
}
