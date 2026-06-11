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
  8: f(25, 1), // barred gate (solid until opened)
  9: f(13, 15), // stairs ascending east-west: cobble base + generated steps
  10: f(5, 13), // cliff face
  11: f(13, 15), // pressure plate: cobble base, generated plate on top
  12: f(13, 15), // stairs ascending north-south: cobble base + generated steps
};

export const TREE_TILE = 3;
export const SEAL_TILE = 7;
export const STAIRS_H_TILE = 9;
export const PLATE_TILE = 11;
export const STAIRS_V_TILE = 12;
/** Tile id that opened gates turn into. */
export const FLOOR_TILE = 1;

/** Hero walk-cycle frame ranges per direction (16x32 frames, 17 cols). */
export const HERO_WALK: Record<string, [number, number]> = {
  down: [0, 3],
  right: [17, 20],
  up: [34, 37],
  left: [51, 54],
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

  // stone steps (original). Risers run perpendicular to the climb:
  // stairs_h climbs east-west (vertical risers), stairs_v north-south.
  if (!scene.textures.exists("stairs_h")) {
    const g = scene.add.graphics();
    for (let i = 0; i < 4; i++) {
      // each step slightly lighter toward the top of the climb (east)
      g.fillStyle([0x8a8278, 0x9a9288, 0xaaa298, 0xbab2a8][i]);
      g.fillRect(i * 4, 0, 4, TILE_SIZE);
      g.fillStyle(0x5a544c);
      g.fillRect(i * 4, 0, 1, TILE_SIZE);
    }
    g.fillStyle(0x4a443c);
    g.fillRect(0, 0, TILE_SIZE, 1);
    g.fillRect(0, 15, TILE_SIZE, 1);
    g.generateTexture("stairs_h", TILE_SIZE, TILE_SIZE);
    g.destroy();
  }
  if (!scene.textures.exists("stairs_v")) {
    const g = scene.add.graphics();
    for (let i = 0; i < 4; i++) {
      g.fillStyle([0xbab2a8, 0xaaa298, 0x9a9288, 0x8a8278][i]);
      g.fillRect(0, i * 4, TILE_SIZE, 4);
      g.fillStyle(0x5a544c);
      g.fillRect(0, i * 4, TILE_SIZE, 1);
    }
    g.fillStyle(0x4a443c);
    g.fillRect(0, 0, 1, TILE_SIZE);
    g.fillRect(15, 0, 1, TILE_SIZE);
    g.generateTexture("stairs_v", TILE_SIZE, TILE_SIZE);
    g.destroy();
  }

  // pressure plate (original): inset stone slab
  if (!scene.textures.exists("plate")) {
    const g = scene.add.graphics();
    g.fillStyle(0x55504a);
    g.fillRect(2, 2, 12, 12);
    g.fillStyle(0x7a746c);
    g.fillRect(3, 3, 10, 10);
    g.fillStyle(0x55504a);
    g.fillRect(5, 5, 6, 6);
    g.generateTexture("plate", TILE_SIZE, TILE_SIZE);
    g.destroy();
  }

  // pushable stone block (original): beveled cube
  if (!scene.textures.exists("push_block")) {
    const g = scene.add.graphics();
    g.fillStyle(0x4a443c);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.fillStyle(0x9c8e7a);
    g.fillRect(1, 1, 14, 14);
    g.fillStyle(0xbcae9a);
    g.fillRect(1, 1, 14, 3);
    g.fillRect(1, 1, 3, 14);
    g.fillStyle(0x7a6e5c);
    g.fillRect(12, 4, 3, 11);
    g.fillRect(4, 12, 11, 3);
    g.generateTexture("push_block", TILE_SIZE, TILE_SIZE);
    g.destroy();
  }
}
