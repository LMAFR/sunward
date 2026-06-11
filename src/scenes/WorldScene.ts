import Phaser from "phaser";
import type { DialogueFile, MapData, NpcData } from "../engine/types";
import {
  TILE_SIZE,
  generateActorTexture,
  generateTextures,
} from "../engine/textures";
import { DialogueBox } from "../ui/DialogueBox";

const MOVE_MS = 160; // GS walk speed feel

type Dir = "up" | "down" | "left" | "right";
const DIR_DELTA: Record<Dir, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

export class WorldScene extends Phaser.Scene {
  private map!: MapData;
  private dialogue!: DialogueFile;
  private player!: Phaser.GameObjects.Sprite;
  private playerTile = { x: 0, y: 0 };
  private facing: Dir = "down";
  private moving = false;
  private npcs = new Map<string, NpcData>(); // keyed by "x,y"
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private dialogueBox!: DialogueBox;

  constructor() {
    super("world");
  }

  preload() {
    const mapId = "vale-outskirts";
    this.load.json("map", `data/maps/${mapId}.json`);
    this.load.json("dialogue", `data/dialogue/${mapId}.json`);
  }

  create() {
    this.map = this.cache.json.get("map") as MapData;
    this.dialogue = this.cache.json.get("dialogue") as DialogueFile;
    generateTextures(this);

    // tiles
    for (let y = 0; y < this.map.height; y++) {
      for (let x = 0; x < this.map.width; x++) {
        this.add
          .image(x * TILE_SIZE, y * TILE_SIZE, `tile_${this.map.tiles[y][x]}`)
          .setOrigin(0, 0);
      }
    }

    // npcs
    for (const npc of this.map.npcs) {
      generateActorTexture(this, `actor_${npc.id}`, npc.color);
      this.add
        .sprite(npc.x * TILE_SIZE, npc.y * TILE_SIZE, `actor_${npc.id}`)
        .setOrigin(0, 0);
      this.npcs.set(`${npc.x},${npc.y}`, npc);
    }

    // player
    generateActorTexture(this, "actor_player", 0x3a5fcd);
    this.playerTile = { ...this.map.playerStart };
    this.player = this.add
      .sprite(
        this.playerTile.x * TILE_SIZE,
        this.playerTile.y * TILE_SIZE,
        "actor_player"
      )
      .setOrigin(0, 0);
    this.player.setDepth(10);

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
      .text(4, 4, "Arrows: move   Z: talk", {
        fontFamily: "monospace",
        fontSize: "8px",
        color: "#ffffff",
        backgroundColor: "#00000080",
      })
      .setScrollFactor(0)
      .setDepth(50);
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      if (this.dialogueBox.active) {
        this.dialogueBox.advance();
      } else {
        this.tryInteract();
      }
    }
    if (this.dialogueBox.active || this.moving) return;

    let dir: Dir | null = null;
    if (this.cursors.up.isDown) dir = "up";
    else if (this.cursors.down.isDown) dir = "down";
    else if (this.cursors.left.isDown) dir = "left";
    else if (this.cursors.right.isDown) dir = "right";
    if (dir) this.tryMove(dir);
  }

  private tryMove(dir: Dir) {
    this.facing = dir;
    const { dx, dy } = DIR_DELTA[dir];
    const nx = this.playerTile.x + dx;
    const ny = this.playerTile.y + dy;
    if (nx < 0 || ny < 0 || nx >= this.map.width || ny >= this.map.height)
      return;
    if (this.map.solidTiles.includes(this.map.tiles[ny][nx])) return;
    if (this.npcs.has(`${nx},${ny}`)) return;

    this.moving = true;
    this.playerTile = { x: nx, y: ny };
    this.tweens.add({
      targets: this.player,
      x: nx * TILE_SIZE,
      y: ny * TILE_SIZE,
      duration: MOVE_MS,
      onComplete: () => {
        this.moving = false;
      },
    });
  }

  private tryInteract() {
    const { dx, dy } = DIR_DELTA[this.facing];
    const tx = this.playerTile.x + dx;
    const ty = this.playerTile.y + dy;
    const npc = this.npcs.get(`${tx},${ty}`);
    if (!npc) return;
    const lines = this.dialogue[npc.dialogueId];
    if (!lines) {
      console.warn(`NPC ${npc.id} references missing dialogue ${npc.dialogueId}`);
      return;
    }
    this.dialogueBox.start(lines);
  }
}
