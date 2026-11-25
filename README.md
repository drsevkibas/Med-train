# KFF Trainer

Web-App (PWA) zum Üben des kognitiven Teils (KFF) des MedAT, optimiert fürs iPhone.

## Stand

Alle fünf KFF-Untertests, jeweils mit Übungsmodus (sofortige Rückmeldung und Erklärung) und Simulation (Zeitlimit, Auswertung, Nachbesprechung). Alle Aufgaben werden automatisch erzeugt.

| Untertest | Simulation | Besonderheiten |
|---|---|---|
| Figuren zusammensetzen | 15 Aufgaben · 20 Min | Teile ziehen und drehen, Einrasten, animierte Lösung, 3–6 Teile |
| Gedächtnis und Merkfähigkeit | 8 Ausweise, 10/15/25 Fragen | gezeichnete Fotos, Lernzeit 2/4/8 Min, Abfrage „später“ möglich |
| Zahlenfolgen | 10 Aufgaben · 15 Min | 10 Regeltypen, Erklärung mit Rechenschritten |
| Wortflüssigkeit | 15 Aufgaben · 20 Min | eigene Wortliste ohne Anagramm-Doppeldeutigkeiten |
| Implikationen erkennen | 10 Aufgaben · 10 Min | Gültigkeit wird über alle Venn-Modelle exakt geprüft |

Aufgabenanzahl und Zeiten orientieren sich am bisherigen MedAT-Format und sollten mit der aktuellen offiziellen Information abgeglichen werden.

Bekannte Grenzen:
- Figuren: nur konvexe Grundformen (keine Sterne oder L-Formen).
- Wortflüssigkeit: Die Wortliste ist intern frei von Anagrammen. Dass es im gesamten Deutschen kein zweites passendes Wort gibt, ist nicht garantiert.
- Implikationen: Als richtig gilt nur, was auch ohne Annahme nicht-leerer Begriffe folgt. Falsche Antworten sind auch mit dieser Annahme falsch.

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
| `js/quiz.js` | gemeinsamer Ablauf für Übung, Simulation, Auswertung |
| `js/gedaechtnis.js` | Allergieausweise: Ausweise, Fotos, Fragen, Lernphase |
| `js/zahlenfolgen.js` | Generator Zahlenfolgen |
| `js/wortfluessigkeit.js` | Wortliste und Generator Wortflüssigkeit |
| `js/implikationen.js` | Generator und Logikprüfung Implikationen |
| `js/app.js` | Übersicht und Navigation |
| `sw.js`, `manifest.webmanifest` | Offline-Fähigkeit, Installation |
| `tools/build-preview.mjs` | baut eine einzelne HTML-Datei zur Vorschau |
| `tools/make-icons.mjs` | erzeugt PNG-Icons aus `icons/icon.svg` |

Unabhängiges Übungsprojekt, nicht offiziell mit dem MedAT oder den Medizinischen Universitäten verbunden.
