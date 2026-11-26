// Prüft jedes Wort der Wortflüssigkeit gegen ein deutsches Wörterbuch (Hunspell de_DE):
// Gibt es aus denselben Buchstaben ein anderes gültiges Wort, wird es notiert.
// Ergebnis: js/wort-alternativen.js. Die App bietet dann deren Anfangsbuchstaben nicht als Antwort an.
// Aufruf: cd tools && npm install && npm run anagramme
import dictionary from "dictionary-de";
import nspell from "nspell";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "js", "wortfluessigkeit.js"), "utf8");
const block = src.match(/const WORDS = \(\s*([\s\S]*?)\)\s*\.split/)[1];
const words = block.match(/"([^"]*)"/g).map((s) => s.slice(1, -1)).join("").split(/\s+/).filter((w) => w.length >= 5 && w.length <= 10);
const spell = nspell(dictionary);

function* perms(chars) {
  const arr = chars.slice().sort();
  const used = new Array(arr.length).fill(false), cur = [];
  function* rec() {
    if (cur.length === arr.length) { yield cur.join(""); return; }
    for (let i = 0; i < arr.length; i++) {
      if (used[i] || (i > 0 && arr[i] === arr[i - 1] && !used[i - 1])) continue;
      used[i] = true; cur.push(arr[i]); yield* rec(); cur.pop(); used[i] = false;
    }
  }
  yield* rec();
}

const out = {};
for (const w of words) {
  const lower = w.toLowerCase();
  const nouns = new Set(), all = new Set();
  for (const p of perms(lower.split(""))) {
    if (p === lower) continue;
    const cap = p[0].toUpperCase() + p.slice(1);
    const capOk = spell.correct(cap), lowOk = spell.correct(p);
    if (capOk || lowOk) all.add(p.toUpperCase());
    if (capOk && !lowOk) nouns.add(p.toUpperCase()); // nur großgeschrieben gültig: Hauptwort
  }
  if (all.size) out[w] = { nouns: [...nouns].sort(), all: [...all].sort() };
}

const js =
  "/* Automatisch erzeugt von tools/check-anagrams.mjs – nicht von Hand ändern.\n" +
  "   Andere gültige Wörter aus denselben Buchstaben (Wörterbuch de_DE). */\n" +
  "(function () {\n  \"use strict\";\n  const MT = (window.MT = window.MT || {});\n  MT.wortAlternativen = " +
  JSON.stringify(out, null, 2).replace(/\n/g, "\n  ") + ";\n})();\n";
writeFileSync(join(root, "js", "wort-alternativen.js"), js);
console.log(Object.keys(out).length + " von " + words.length + " Wörtern haben Alternativen.");
