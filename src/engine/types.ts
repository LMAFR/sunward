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
  /** Tiles the player cannot walk onto (tile ids), per map. */
  solidTiles: number[];
  playerStart: { x: number; y: number };
  npcs: NpcData[];
  /** Stepping onto (x,y) transitions to another map. */
  triggers?: TriggerData[];
  /** Scripted dialogue on entering the map; first matching event runs. */
  onEnter?: OnEnterEvent[];
  /** Pushable blocks (walk into one to shove it a tile). */
  blocks?: Point[];
  /** Block-on-plate puzzle: cover all plates to open all gates. */
  puzzle?: PuzzleData;
}

export interface Point {
  x: number;
  y: number;
}

export interface PuzzleData {
  plates: Point[];
  gates: Point[];
  /** Story flag set when solved; gates start open if it is already set. */
  solvedFlag?: string;
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

export interface TriggerData {
  x: number;
  y: number;
  /** Map id to load. */
  target: string;
  /** Player spawn tile in the target map. Must not be a trigger tile. */
  targetX: number;
  targetY: number;
}

/** Condition over story flags: all of `if` set, none of `unless` set. */
export interface FlagCondition {
  if?: string[];
  unless?: string[];
}

export interface OnEnterEvent extends FlagCondition {
  dialogueId: string;
  /** Flags set when the dialogue completes. */
  set?: string[];
}

export interface DialogueLine {
  speaker: string;
  text: string;
}

export interface DialogueVariant extends FlagCondition {
  lines: DialogueLine[];
  /** Flags set when the dialogue completes. */
  set?: string[];
}

/**
 * A dialogue entry is either a plain line array (unconditional) or a
 * variant list — the first variant whose condition matches is used.
 */
export type DialogueEntry = DialogueLine[] | { variants: DialogueVariant[] };

export interface DialogueFile {
  [dialogueId: string]: DialogueEntry;
}
