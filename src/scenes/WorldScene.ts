import Phaser from "phaser";
import type {
  DialogueEntry,
  DialogueFile,
  DialogueLine,
  MapData,
  NpcData,
} from "../engine/types";
import { GameState } from "../engine/GameState";
import {
  FLOOR_TILE,
  HERO_WALK,
  PLATE_TILE,
  SEAL_TILE,
  STAIRS_TILE,
  TILE_FRAMES,
  TILE_SIZE,
  TREE_TILE,
  preloadAssets,
  setupDerivedTextures,
} from "../engine/textures";
import { DialogueBox } from "../ui/DialogueBox";

const START_MAP = "aldera-village";
const MOVE_MS = 160; // GS-like walk speed feel

type Dir = "up" | "down" | "left" | "right";
const DIR_DELTA: Record<Dir, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

interface SceneData {
  mapId?: string;
  startX?: number;
  startY?: number;
}

export class WorldScene extends Phaser.Scene {
  private mapId = START_MAP;
  private startOverride?: { x: number; y: number };
  private map!: MapData;
  private dialogue!: DialogueFile;
  private player!: Phaser.GameObjects.Sprite;
  private playerTile = { x: 0, y: 0 };
  private facing: Dir = "down";
  private moving = false;
  private npcs = new Map<string, NpcData>(); // keyed by "x,y"
  private blocks = new Map<string, Phaser.GameObjects.Image>(); // keyed by "x,y"
  private tileImages: Phaser.GameObjects.Image[][] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private dialogueBox!: DialogueBox;
  private debugInfo: Record<string, unknown> = {};

  constructor() {
    super("world");
  }

  init(data: SceneData) {
    this.mapId = data.mapId ?? START_MAP;
    this.startOverride =
      data.startX !== undefined && data.startY !== undefined
        ? { x: data.startX, y: data.startY }
        : undefined;
    // scene restarts reuse this instance; reset per-map state
    this.npcs.clear();
    this.blocks.clear();
    this.tileImages = [];
    this.moving = false;
    this.facing = "down";
  }

  preload() {
    preloadAssets(this);
    if (!this.cache.json.exists(`map_${this.mapId}`)) {
      this.load.json(`map_${this.mapId}`, `data/maps/${this.mapId}.json`);
      this.load.json(`dlg_${this.mapId}`, `data/dialogue/${this.mapId}.json`);
    }
  }

  create() {
    // clone: puzzles mutate tiles, and the JSON cache object is shared
    this.map = structuredClone(
      this.cache.json.get(`map_${this.mapId}`)
    ) as MapData;
    this.dialogue = this.cache.json.get(`dlg_${this.mapId}`) as DialogueFile;
    setupDerivedTextures(this);
    this.createAnims();

    // an already-solved puzzle starts with its gates open
    const puzzle = this.map.puzzle;
    if (puzzle?.solvedFlag && GameState.has(puzzle.solvedFlag)) {
      for (const g of puzzle.gates) this.map.tiles[g.y][g.x] = FLOOR_TILE;
    }

    // tiles (canopies, crystals, steps and plates are overlays on a base)
    for (let y = 0; y < this.map.height; y++) {
      this.tileImages[y] = [];
      for (let x = 0; x < this.map.width; x++) {
        const id = this.map.tiles[y][x];
        this.tileImages[y][x] = this.add
          .image(x * TILE_SIZE, y * TILE_SIZE, "overworld", TILE_FRAMES[id])
          .setOrigin(0, 0);
        if (id === TREE_TILE) {
          this.add
            .image(x * TILE_SIZE - 8, y * TILE_SIZE - 16, "overworld", "tree")
            .setOrigin(0, 0)
            .setDepth(y * TILE_SIZE + 8);
        } else if (id === SEAL_TILE) {
          this.add
            .image(x * TILE_SIZE, y * TILE_SIZE, "seal_crystal")
            .setOrigin(0, 0)
            .setDepth(y * TILE_SIZE);
        } else if (id === STAIRS_TILE) {
          this.add.image(x * TILE_SIZE, y * TILE_SIZE, "stairs").setOrigin(0, 0);
        } else if (id === PLATE_TILE) {
          this.add.image(x * TILE_SIZE, y * TILE_SIZE, "plate").setOrigin(0, 0);
        }
      }
    }

    // pushable blocks
    for (const b of this.map.blocks ?? []) {
      const img = this.add
        .image(b.x * TILE_SIZE, b.y * TILE_SIZE, "push_block")
        .setOrigin(0, 0)
        .setDepth(b.y * TILE_SIZE);
      this.blocks.set(`${b.x},${b.y}`, img);
    }

    // npcs (tinted template until real per-character sprites exist)
    for (const npc of this.map.npcs) {
      this.add
        .sprite(npc.x * TILE_SIZE, npc.y * TILE_SIZE - 16, "npc", 0)
        .setOrigin(0, 0)
        .setTint(npc.color)
        .setDepth(npc.y * TILE_SIZE);
      this.npcs.set(`${npc.x},${npc.y}`, npc);
    }

    // player
    this.playerTile = this.startOverride ?? { ...this.map.playerStart };
    this.player = this.add
      .sprite(
        this.playerTile.x * TILE_SIZE,
        this.playerTile.y * TILE_SIZE - 16,
        "hero",
        HERO_WALK.down[0]
      )
      .setOrigin(0, 0);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.map.width * TILE_SIZE, this.map.height * TILE_SIZE);
    cam.startFollow(this.player, true);
    cam.roundPixels = true;

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.interactKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.Z
    );
    this.dialogueBox = new DialogueBox(this);

    this.add
      .text(4, 4, this.map.name, {
        fontFamily: "monospace",
        fontSize: "8px",
        color: "#ffffff",
        backgroundColor: "#00000080",
      })
      .setScrollFactor(0)
      .setDepth(50);

    this.runOnEnter();

    // test hook: lets the headless smoke test observe game state
    (window as unknown as { __sunward?: object }).__sunward = {
      mapId: this.mapId,
      isDialogueActive: () => this.dialogueBox.active,
      playerTile: () => ({ ...this.playerTile }),
      facing: () => this.facing,
      tileAt: (x: number, y: number) => this.map.tiles[y]?.[x],
      blocks: () => [...this.blocks.keys()],
      debug: () => ({ ...this.debugInfo, zIsDown: this.interactKey.isDown }),
    };
  }

  private createAnims() {
    for (const dir of ["down", "left", "up", "right"] as const) {
      const key = `walk-${dir}`;
      if (this.anims.exists(key)) continue;
      const [start, end] = HERO_WALK[dir];
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers("hero", { start, end }),
        frameRate: 10,
        repeat: -1,
      });
    }
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this.debugInfo.zPresses = ((this.debugInfo.zPresses as number) ?? 0) + 1;
      if (this.dialogueBox.active) {
        this.dialogueBox.advance();
      } else {
        this.tryInteract();
      }
    }

    let dir: Dir | null = null;
    if (!this.dialogueBox.active && !this.moving) {
      if (this.cursors.up.isDown) dir = "up";
      else if (this.cursors.down.isDown) dir = "down";
      else if (this.cursors.left.isDown) dir = "left";
      else if (this.cursors.right.isDown) dir = "right";
    }
    if (dir) {
      this.tryMove(dir);
    } else if (!this.moving && this.player.anims.isPlaying) {
      this.player.anims.stop();
      this.player.setFrame(HERO_WALK[this.facing][0]);
    }

    // actors sort by feet position so canopies overlap correctly
    this.player.setDepth(this.player.y + 16);
  }

  private tryMove(dir: Dir) {
    this.facing = dir;
    this.player.anims.play(`walk-${dir}`, true);
    const { dx, dy } = DIR_DELTA[dir];
    const nx = this.playerTile.x + dx;
    const ny = this.playerTile.y + dy;
    if (nx < 0 || ny < 0 || nx >= this.map.width || ny >= this.map.height)
      return;
    if (this.map.solidTiles.includes(this.map.tiles[ny][nx])) return;
    if (this.npcs.has(`${nx},${ny}`)) return;
    if (this.blocks.has(`${nx},${ny}`)) {
      this.tryPush(nx, ny, dx, dy);
      return;
    }

    this.moving = true;
    this.playerTile = { x: nx, y: ny };
    this.tweens.add({
      targets: this.player,
      x: nx * TILE_SIZE,
      y: ny * TILE_SIZE - 16,
      duration: MOVE_MS,
      onComplete: () => {
        this.moving = false;
        this.checkTriggers();
      },
    });
  }

  private tryPush(bx: number, by: number, dx: number, dy: number) {
    const tx = bx + dx;
    const ty = by + dy;
    if (tx < 0 || ty < 0 || tx >= this.map.width || ty >= this.map.height)
      return;
    if (this.map.solidTiles.includes(this.map.tiles[ty][tx])) return;
    if (this.npcs.has(`${tx},${ty}`)) return;
    if (this.blocks.has(`${tx},${ty}`)) return;

    const img = this.blocks.get(`${bx},${by}`)!;
    this.blocks.delete(`${bx},${by}`);
    this.blocks.set(`${tx},${ty}`, img);
    this.moving = true;
    this.tweens.add({
      targets: img,
      x: tx * TILE_SIZE,
      y: ty * TILE_SIZE,
      duration: MOVE_MS,
      onComplete: () => {
        img.setDepth(ty * TILE_SIZE);
        this.moving = false;
        this.checkPlates();
      },
    });
  }

  private checkPlates() {
    const puzzle = this.map.puzzle;
    if (!puzzle) return;
    if (puzzle.solvedFlag && GameState.has(puzzle.solvedFlag)) return;
    const solved = puzzle.plates.every((p) => this.blocks.has(`${p.x},${p.y}`));
    if (!solved) return;
    for (const g of puzzle.gates) {
      this.map.tiles[g.y][g.x] = FLOOR_TILE;
      this.tileImages[g.y][g.x].setFrame(TILE_FRAMES[FLOOR_TILE]);
    }
    if (puzzle.solvedFlag) GameState.set(puzzle.solvedFlag);
  }

  private checkTriggers() {
    const t = this.map.triggers?.find(
      (t) => t.x === this.playerTile.x && t.y === this.playerTile.y
    );
    if (!t) return;
    this.scene.restart({
      mapId: t.target,
      startX: t.targetX,
      startY: t.targetY,
    } satisfies SceneData);
  }

  private runOnEnter() {
    const event = this.map.onEnter?.find((e) => GameState.check(e));
    if (!event) return;
    const lines = this.resolveLines(this.dialogue[event.dialogueId]);
    if (!lines) return;
    this.dialogueBox.start(lines, () => GameState.setAll(event.set));
  }

  private tryInteract() {
    const { dx, dy } = DIR_DELTA[this.facing];
    const tx = this.playerTile.x + dx;
    const ty = this.playerTile.y + dy;
    const npc = this.npcs.get(`${tx},${ty}`);
    Object.assign(this.debugInfo, {
      interactAt: `${tx},${ty}`,
      npcFound: npc?.id ?? null,
    });
    if (!npc) return;
    const entry = this.dialogue[npc.dialogueId];
    if (!entry) {
      console.warn(`NPC ${npc.id} references missing dialogue ${npc.dialogueId}`);
      return;
    }
    if (Array.isArray(entry)) {
      this.dialogueBox.start(entry);
      return;
    }
    const variant = entry.variants.find((v) => GameState.check(v));
    if (!variant) return;
    this.dialogueBox.start(variant.lines, () => GameState.setAll(variant.set));
  }

  private resolveLines(entry: DialogueEntry | undefined): DialogueLine[] | null {
    if (!entry) return null;
    if (Array.isArray(entry)) return entry;
    return entry.variants.find((v) => GameState.check(v))?.lines ?? null;
  }
}
