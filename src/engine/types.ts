/**
 * All story content is data, not code. Maps, NPCs and dialogue live in
 * public/data/ as JSON conforming to these types, so new story content
 * can be added without touching the engine.
 */

export interface MapData {
  id: string;
  name: string;
  width: number; // in tiles
  height: number; // in tiles
  /** Tile grid, row-major. Values index into TILE_DEFS. */
  tiles: number[][];
  /** Tiles the player cannot walk onto (tile ids). */
  solidTiles: number[];
  playerStart: { x: number; y: number };
  npcs: NpcData[];
}

export interface NpcData {
  id: string;
  name: string;
  x: number; // tile coords
  y: number;
  /** Key into the map's dialogue file. */
  dialogueId: string;
  /** Placeholder palette color until real sprites exist. */
  color: number;
}

export interface DialogueFile {
  [dialogueId: string]: DialogueLine[];
}

export interface DialogueLine {
  speaker: string;
  text: string;
}
