// Headless smoke test: load the built game, simulate movement and an NPC
// interaction, screenshot the result. Run: node scripts/smoke.mjs <url>
import { chromium } from "playwright-core";

const url = process.argv[2] ?? "http://localhost:4173";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
});
const page = await browser.newPage({ viewport: { width: 760, height: 520 } });

const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});

await page.goto(url);
await page.waitForTimeout(1500); // let Phaser boot and load JSON

// hold a direction long enough for the grid mover to register the step
async function step(key, times = 1) {
  for (let i = 0; i < times; i++) {
    await page.keyboard.down(key);
    await page.waitForTimeout(120);
    await page.keyboard.up(key);
    await page.waitForTimeout(220);
  }
}

// walk up the path toward the elder, face him, talk
await step("ArrowUp", 4);
await step("ArrowLeft", 1);
await page.keyboard.press("z");
await page.waitForTimeout(1500);

await page.screenshot({ path: "scripts/smoke.png" });
await browser.close();

if (errors.length) {
  console.error("Page errors:\n" + errors.join("\n"));
  process.exit(1);
}
console.log("Smoke test passed, screenshot at scripts/smoke.png");
