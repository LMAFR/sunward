import Phaser from "phaser";
import { WorldScene } from "./scenes/WorldScene";

// GBA-native resolution, integer-scaled up by the browser.
const GBA_WIDTH = 240;
const GBA_HEIGHT = 160;

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: GBA_WIDTH,
  height: GBA_HEIGHT,
  zoom: 3,
  pixelArt: true,
  backgroundColor: "#000000",
  scene: [WorldScene],
});
