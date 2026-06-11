// Focused key-event trace: dump game state after every scripted action.
import { chromium } from "playwright-core";

const url = process.argv[2] ?? "http://localhost:4173";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
});
const page = await browser.newPage({ viewport: { width: 760, height: 520 } });
page.on("pageerror", (e) => console.log("pageerror:", e.message));

const dump = async (label) => {
  const s = await page.evaluate(() => ({
    dialogue: window.__sunward.isDialogueActive(),
    tile: window.__sunward.playerTile(),
    facing: window.__sunward.facing(),
    debug: window.__sunward.debug(),
  }));
  console.log(label.padEnd(16), JSON.stringify(s));
};

await page.goto(url);
await page.waitForFunction(() => window.__sunward !== undefined, null, {
  timeout: 30000,
});
await page.waitForTimeout(800);
await dump("boot");

for (let i = 0; i < 6; i++) {
  await page.keyboard.down("z");
  await page.waitForTimeout(100);
  await page.keyboard.up("z");
  await page.waitForTimeout(300);
  await dump(`z#${i + 1}`);
}

for (let i = 0; i < 4; i++) {
  await page.keyboard.down("ArrowUp");
  await page.waitForTimeout(120);
  await page.keyboard.up("ArrowUp");
  await page.waitForTimeout(240);
}
await dump("after 4 up");

await page.keyboard.down("ArrowLeft");
await page.waitForTimeout(120);
await page.keyboard.up("ArrowLeft");
await page.waitForTimeout(240);
await dump("after left");

await page.keyboard.press("z");
await page.waitForTimeout(600);
await dump("after talk z");
await page.waitForTimeout(1000);
await dump("late");

await browser.close();
