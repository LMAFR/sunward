// Headless smoke test: boot the game, clear the opening narration, walk to
// Elder Thane, open his dialogue, then exit south and verify the map
// transition. Run: node scripts/smoke.mjs <url>
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

const state = {
  mapId: () => page.evaluate(() => window.__sunward.mapId),
  dialogueActive: () =>
    page.evaluate(() => window.__sunward.isDialogueActive()),
  playerTile: () => page.evaluate(() => window.__sunward.playerTile()),
};

async function fail(msg) {
  const debug = await page
    .evaluate(() => ({
      mapId: window.__sunward.mapId,
      tile: window.__sunward.playerTile(),
      facing: window.__sunward.facing?.(),
      dialogue: window.__sunward.isDialogueActive(),
      debug: window.__sunward.debug?.(),
    }))
    .catch(() => "no state");
  await page.screenshot({ path: "scripts/smoke-fail.png" });
  console.error("FAIL: " + msg);
  console.error("state: " + JSON.stringify(debug));
  if (errors.length) console.error("page errors:\n" + errors.join("\n"));
  process.exit(1);
}


// instantaneous down+up can be missed by the headless render loop; hold keys
async function pressZ() {
  await page.keyboard.down("z");
  await page.waitForTimeout(100);
  await page.keyboard.up("z");
}

async function clearDialogue(max = 20) {
  for (let i = 0; i < max; i++) {
    if (!(await state.dialogueActive())) return;
    await pressZ();
    await page.waitForTimeout(300);
  }
  await fail("dialogue did not close after " + max + " advances");
}

// hold a direction long enough for the grid mover to register one step
async function step(key, times = 1) {
  for (let i = 0; i < times; i++) {
    await page.keyboard.down(key);
    await page.waitForTimeout(120);
    await page.keyboard.up(key);
    await page.waitForTimeout(240);
  }
}

await page.goto(url);
await page.waitForFunction(() => window.__sunward !== undefined, null, {
  timeout: 30000,
});

// opening narration should be running; clear it
await page.waitForTimeout(500);
await clearDialogue();

// walk up the plaza toward the elder, face him, talk
await step("ArrowUp", 4);
const tile = await state.playerTile();
if (tile.x !== 11 || tile.y !== 8)
  await fail(`expected player at 11,8 — got ${tile.x},${tile.y}`);
await step("ArrowLeft", 1); // blocked by the elder; sets facing
await pressZ();
await page.waitForTimeout(1200);
if (!(await state.dialogueActive())) await fail("elder dialogue did not open");
await page.screenshot({ path: "scripts/smoke.png" });
await clearDialogue();

// walk south through the gate; expect transition to the outskirts
await step("ArrowDown", 6);
await page.waitForTimeout(800);
const mapId = await state.mapId();
if (mapId !== "aldera-outskirts")
  await fail(`expected map aldera-outskirts — got ${mapId}`);
await page.screenshot({ path: "scripts/smoke-outskirts.png" });

// east along the road, up the stairs onto the terrace, into the shrine
await step("ArrowDown", 6); // (9,1) -> (9,7) on the crossroads
await step("ArrowRight", 7); // -> stairs (13,7) -> terrace (16,7)
await step("ArrowUp", 4); // -> shrine door (16,3), triggers transition
await page.waitForTimeout(800);
const approachId = await state.mapId();
if (approachId !== "aurin-approach")
  await fail(`expected map aurin-approach — got ${approachId}`);
await clearDialogue(); // approach narration
await page.screenshot({ path: "scripts/smoke-approach.png" });
await step("ArrowUp", 6); // (7,8) -> shrine doors (7,2)
await page.waitForTimeout(800);
const shrineId = await state.mapId();
if (shrineId !== "aurin-shrine")
  await fail(`expected map aurin-shrine — got ${shrineId}`);
await clearDialogue(); // breach narration

// the puzzle: push the block at (5,13) left onto the plate at (3,13)
await step("ArrowUp", 7); // (7,20) -> (7,13)
await step("ArrowLeft", 1); // -> (6,13)
await step("ArrowLeft", 1); // push: block -> (4,13), player stays
await step("ArrowLeft", 1); // -> (5,13)
await step("ArrowLeft", 1); // push: block -> plate (3,13), gate opens
await page.waitForTimeout(600);
const gateTile = await page.evaluate(() => window.__sunward.tileAt(7, 10));
if (gateTile !== 1) await fail(`gate did not open — tile is ${gateTile}`);
await page.screenshot({ path: "scripts/smoke-shrine.png" });

await browser.close();

if (errors.length) {
  console.error("Page errors:\n" + errors.join("\n"));
  process.exit(1);
}
console.log("Smoke test passed: elder dialogue + map transition verified");
