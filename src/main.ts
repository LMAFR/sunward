import Phaser from "phaser";
import { WorldScene } from "./scenes/WorldScene";

// GBA-native resolution, integer-scaled up by the browser.
const GBA_WIDTH = 240;
const GBA_HEIGHT = 160;

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  pixelArt: true,
  backgroundColor: "#000000",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GBA_WIDTH,
    height: GBA_HEIGHT,
  },
  input: {
    activePointers: 3, // D-pad + action button simultaneously
  },
  scene: [WorldScene],
});
