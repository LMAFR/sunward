import Phaser from "phaser";

type Dir = "up" | "down" | "left" | "right";

/**
 * Touch overlay: D-pad bottom-left, action button bottom-right.
 * Created only on touch devices. Hold a D-pad button to keep walking;
 * the action button calls onAction (talk / advance dialogue).
 */
export class VirtualControls {
  public dir: Dir | null = null;
  private stepQueued: Dir | null = null;

  /** A quick tap can begin and end between frames; it still yields one step. */
  consumeStep(): Dir | null {
    const s = this.stepQueued;
    this.stepQueued = null;
    return s;
  }

  constructor(scene: Phaser.Scene, onAction: () => void) {
    const mkDir = (x: number, y: number, d: Dir, angle: number) => {
      const pad = scene.add
        .rectangle(x, y, 20, 20, 0xffffff, 0.22)
        .setScrollFactor(0)
        .setDepth(20000)
        .setInteractive();
      scene.add
        .triangle(x, y, 0, 12, 16, 12, 8, 0, 0xffffff, 0.55)
        .setScrollFactor(0)
        .setDepth(20001)
        .setAngle(angle);
      pad.on("pointerdown", () => {
        this.dir = d;
        this.stepQueued = d;
      });
      const release = () => {
        if (this.dir === d) this.dir = null;
      };
      pad.on("pointerup", release);
      pad.on("pointerout", release);
    };
    mkDir(32, 102, "up", 0);
    mkDir(32, 148, "down", 180);
    mkDir(9, 125, "left", -90);
    mkDir(55, 125, "right", 90);

    const action = scene.add
      .circle(216, 125, 14, 0xffffff, 0.22)
      .setScrollFactor(0)
      .setDepth(20000)
      .setInteractive();
    scene.add
      .text(216, 125, "A", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(20001)
      .setAlpha(0.7);
    action.on("pointerdown", onAction);
  }
}
