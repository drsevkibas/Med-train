// Erzeugt die PNG-Icons aus icons/icon.svg (benötigt Playwright mit Chromium).
// Aufruf: node tools/make-icons.mjs
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(join(root, "icons", "icon.svg"), "utf8");

const browser = await chromium.launch();
for (const [name, size, rounded] of [
  ["apple-touch-icon.png", 180, false],
  ["icon-192.png", 192, true],
  ["icon-512.png", 512, false],
]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  // iOS rundet die Ecken selbst ab, daher dort ohne Rundung
  const body = rounded ? svg : svg.replace('rx="112"', 'rx="0"');
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${body}`
  );
  await page.screenshot({ path: join(root, "icons", name), omitBackground: true });
  await page.close();
}
await browser.close();
console.log("Icons erzeugt.");
