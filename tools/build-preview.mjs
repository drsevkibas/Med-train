// Baut eine einzelne HTML-Datei (CSS und JS eingebettet) für eine schnelle Vorschau.
// Aufruf: node tools/build-preview.mjs [ausgabe.html]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(process.argv[2] || join(root, "dist", "preview.html"));

let html = readFileSync(join(root, "index.html"), "utf8");

// PWA-Teile (Manifest, Icons, Service Worker) entfernen
html = html.replace(/<!--pwa-->[\s\S]*?<!--\/pwa-->/g, "");

// Stylesheet einbetten
html = html.replace(/<link rel="stylesheet" href="(css\/[^"]+)">/g, (_, href) =>
  "<style>\n" + readFileSync(join(root, href), "utf8") + "\n</style>"
);

// Skripte einbetten
html = html.replace(/<script src="(js\/[^"]+)"><\/script>/g, (_, src) =>
  "<script>\n" + readFileSync(join(root, src), "utf8").replace(/<\/script/gi, "<\\/script") + "\n</script>"
);

// Gerüst (doctype, html, head, body, charset, viewport) entfernen
const head = (html.match(/<head>([\s\S]*?)<\/head>/) || [, ""])[1]
  .replace(/<meta charset[^>]*>/, "")
  .replace(/<meta name="viewport"[^>]*>/, "");
const body = (html.match(/<body>([\s\S]*?)<\/body>/) || [, ""])[1];

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, head.trim() + "\n" + body.trim() + "\n");
console.log("Vorschau geschrieben:", out);
