# KFF Trainer

Web-App (PWA) zum Üben des kognitiven Teils (KFF) des MedAT, optimiert fürs iPhone.

## Stand

- **Figuren zusammensetzen**
  - Übungsmodus mit 3–6 Teilen: Teile ziehen, am Griff oder mit zwei Fingern drehen, Einrasten, Lösung animiert ansehen
  - Simulation: 15 Aufgaben, 20 Minuten, Teile wie in der Prüfung fix, danach Auswertung mit Nachbesprechung
  - Aufgaben werden automatisch erzeugt (unbegrenzt), 13 Grundformen, ähnliche Formen als Ablenker, ca. 20 % „E – keine“
- Geplant: Allergieausweise (Gedächtnis), Zahlenfolgen, Wortflüssigkeit, Implikationen

## Starten

Keine Abhängigkeiten, kein Build nötig. Einen beliebigen statischen Webserver im Ordner starten:

```sh
python3 -m http.server 8000
```

Dann `http://localhost:8000` öffnen. Am iPhone: in Safari öffnen → Teilen → „Zum Home-Bildschirm“.

## Struktur

| Datei | Inhalt |
|---|---|
| `index.html` | Einstieg |
| `css/app.css` | Gestaltung (hell/dunkel) |
| `js/geometry.js` | Polygone, Schwerpunkt, Schneiden |
| `js/figuren-tasks.js` | Aufgabengenerator Figuren |
| `js/figuren-board.js` | Spielfeld: Ziehen, Drehen, Einrasten |
| `js/figuren-views.js` | Übung, Simulation, Auswertung |
| `js/app.js` | Übersicht und Navigation |
| `sw.js`, `manifest.webmanifest` | Offline-Fähigkeit, Installation |
| `tools/build-preview.mjs` | baut eine einzelne HTML-Datei zur Vorschau |
| `tools/make-icons.mjs` | erzeugt PNG-Icons aus `icons/icon.svg` |

Unabhängiges Übungsprojekt, nicht offiziell mit dem MedAT oder den Medizinischen Universitäten verbunden.
