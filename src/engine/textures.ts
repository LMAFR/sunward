import Phaser from "phaser";

export const TILE_SIZE = 16;

/**
 * Placeholder tile palette. Each entry is [base color, accent color].
 * These get replaced by a real tileset later; the map JSON tile ids
 * stay stable so content survives the asset upgrade.
 */
export const TILE_DEFS: { name: string; base: number; accent: number }[] = [
  { name: "grass", base: 0x4a8f3c, accent: 0x5ca34a },
  { name: "path", base: 0xc2a36b, accent: 0xb5945a },
  { name: "water", base: 0x3a6ea5, accent: 0x4a82bd },
  { name: "tree", base: 0x2d5c24, accent: 0x1f4519 },
  { name: "wall", base: 0x8a8a8a, accent: 0x767676 },
  { name: "roof", base: 0xa0522d, accent: 0x8b4513 },
  { name: "door", base: 0x5c3a1e, accent: 0x4a2f18 },
];

/** Generate flat-color placeholder textures so the slice needs zero asset files. */
export function generateTextures(scene: Phaser.Scene): void {
  for (let i = 0; i < TILE_DEFS.length; i++) {
    const def = TILE_DEFS[i];
    const g = scene.add.graphics();
    g.fillStyle(def.base);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.fillStyle(def.accent);
    // simple texture noise pattern, deterministic per tile type
    for (let n = 0; n < 6; n++) {
      const px = ((n * 7 + i * 3) % 14) + 1;
      const py = ((n * 11 + i * 5) % 14) + 1;
      g.fillRect(px, py, 2, 2);
    }
    g.generateTexture(`tile_${i}`, TILE_SIZE, TILE_SIZE);
    g.destroy();
  }
}

/** A 16x16 actor placeholder: body color block with a darker head band. */
export function generateActorTexture(
  scene: Phaser.Scene,
  key: string,
  color: number
): void {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  g.fillStyle(color);
  g.fillRect(2, 4, 12, 11);
  g.fillStyle(0xf0d5b0); // face
  g.fillRect(4, 1, 8, 6);
  g.fillStyle(0x000000, 0.8);
  g.fillRect(5, 3, 2, 2);
  g.fillRect(9, 3, 2, 2);
  g.generateTexture(key, TILE_SIZE, TILE_SIZE);
  g.destroy();
}
