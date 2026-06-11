import { chromium } from "playwright-core";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const ctx = await browser.newContext({
  viewport: { width: 844, height: 390 }, // phone landscape
  hasTouch: true,
  isMobile: true,
});
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:4174");
await page.waitForFunction(() => window.__sunward !== undefined, null, { timeout: 30000 });
await page.waitForTimeout(800);

// tap anywhere to advance the opening narration (2 pages)
for (let i = 0; i < 6; i++) {
  if (!(await page.evaluate(() => window.__sunward.isDialogueActive()))) break;
  await page.touchscreen.tap(420, 150);
  await page.waitForTimeout(400);
}
if (await page.evaluate(() => window.__sunward.isDialogueActive()))
  { console.error("FAIL: tap did not clear narration"); process.exit(1); }

// hold the D-pad "up" region to walk: logical (32,102) -> screen scale 844/240*x... compute via canvas box
const box = await page.locator("canvas").boundingBox();
const sx = box.width / 240, sy = box.height / 160;
const upX = box.x + 32 * sx, upY = box.y + 102 * sy;
await page.touchscreen.tap(upX, upY); // single tap = one step attempt
await page.waitForTimeout(400);
const t1 = await page.evaluate(() => window.__sunward.playerTile());
// hold: dispatch touchstart without end via CDP isn't simple; tap repeatedly
for (let i = 0; i < 3; i++) { await page.touchscreen.tap(upX, upY); await page.waitForTimeout(300); }
const t2 = await page.evaluate(() => window.__sunward.playerTile());
console.log("tiles:", JSON.stringify(t1), JSON.stringify(t2));
if (t2.y >= 12) { console.error("FAIL: D-pad did not move player"); process.exit(1); }
await page.screenshot({ path: "scripts/smoke-touch.png" });
if (errors.length) { console.error("page errors:\n" + errors.join("\n")); process.exit(1); }
console.log("Touch test passed");
await browser.close();
