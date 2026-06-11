import Phaser from "phaser";

const BOX_HEIGHT = 48;
const PADDING = 8;
const CHARS_PER_TICK = 1;
const TICK_MS = 25;

/**
 * GS-style bottom dialogue box with typewriter text.
 * Advance with the interact key; onComplete fires after the last line.
 */
export class DialogueBox {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private nameText: Phaser.GameObjects.Text;
  private bodyText: Phaser.GameObjects.Text;
  private lines: { speaker: string; text: string }[] = [];
  private lineIndex = 0;
  private charIndex = 0;
  private typing = false;
  private timer?: Phaser.Time.TimerEvent;
  private onComplete?: () => void;

  public get active(): boolean {
    return this.container.visible;
  }

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const cam = scene.cameras.main;
    const w = cam.width - PADDING * 2;
    const y = cam.height - BOX_HEIGHT - PADDING;

    const bg = scene.add.rectangle(0, 0, w, BOX_HEIGHT, 0x1a2a4a, 0.95);
    bg.setOrigin(0, 0);
    bg.setStrokeStyle(2, 0xd4c97a);

    this.nameText = scene.add.text(6, 4, "", {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#f0d56a",
    });
    this.bodyText = scene.add.text(6, 17, "", {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#ffffff",
      wordWrap: { width: w - 12 },
    });

    this.container = scene.add.container(PADDING, y, [
      bg,
      this.nameText,
      this.bodyText,
    ]);
    this.container.setScrollFactor(0);
    this.container.setDepth(100);
    this.container.setVisible(false);
  }

  start(lines: { speaker: string; text: string }[], onComplete?: () => void) {
    if (lines.length === 0) return;
    this.lines = lines;
    this.lineIndex = 0;
    this.onComplete = onComplete;
    this.container.setVisible(true);
    this.showLine();
  }

  /** Interact pressed while box is open: finish typing, or advance line. */
  advance() {
    if (this.typing) {
      this.timer?.remove();
      this.typing = false;
      this.bodyText.setText(this.lines[this.lineIndex].text);
      return;
    }
    this.lineIndex++;
    if (this.lineIndex >= this.lines.length) {
      this.container.setVisible(false);
      this.onComplete?.();
    } else {
      this.showLine();
    }
  }

  private showLine() {
    const line = this.lines[this.lineIndex];
    this.nameText.setText(line.speaker);
    this.bodyText.setText("");
    this.charIndex = 0;
    this.typing = true;
    this.timer = this.scene.time.addEvent({
      delay: TICK_MS,
      repeat: line.text.length - 1,
      callback: () => {
        this.charIndex += CHARS_PER_TICK;
        this.bodyText.setText(line.text.slice(0, this.charIndex));
        if (this.charIndex >= line.text.length) this.typing = false;
      },
    });
  }
}
