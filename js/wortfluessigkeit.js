/* Wortflüssigkeit: Buchstaben eines Hauptworts sind vertauscht.
   Gesucht ist der Anfangsbuchstabe des richtigen Wortes. */
(function () {
  "use strict";
  const MT = (window.MT = window.MT || {});
  const U = MT.quiz.util;

  // Hauptwörter ohne Umlaute und ß, 6 bis 9 Buchstaben.
  const WORDS = (
    "ABENTEUER AHORN ANKER APFEL APOTHEKE ARBEIT ARZNEI AUSFLUG AUSWEIS BAHNHOF BALKON BANANE BAUCH BECHER " +
    "BERUF BESEN BETRIEB BIBLIOTHEK BILDUNG BLUME BOHNE BRIEFKASTEN BRILLE BRUNNEN BUTTER DACHBODEN DECKE " +
    "DIAGNOSE DONNER DRACHE EIMER EINLADUNG ELEFANT ENERGIE ERDBEERE ERFOLG ERKENNTNIS FABRIK FAHRRAD FALKE " +
    "FAMILIE FASCHING FEDER FENSTER FERNSEHER FESTUNG FIEBER FINGER FLASCHE FLUGHAFEN FORELLE FREUNDIN FRIEDEN " +
    "FRISEUR GABEL GARTEN GEBIRGE GEDICHT GEHIRN GESCHENK GEWITTER GITARRE GLOCKE " +
    "GURKE HAFEN HANDTUCH HAUSARZT HERBST HIMMEL HOCHZEIT HONIG HUMMEL HUSTEN INSEL JACKE JAGUAR KAFFEE KALENDER " +
    "KAMEL KAMIN KANINCHEN KAPITEL KARTOFFEL KASTANIE KERZE KIRSCHE KISSEN KLAVIER KLINIK KNOCHEN KOFFER KOMPASS " +
    "KONZERT KRANKHEIT KRAWATTE KUGEL KUPFER LABOR LAMPE LANDKARTE LATERNE LEBER LEHRER LEITER LEUCHTTURM LIBELLE " +
    "LUNGE MANTEL MARMELADE MASCHINE MATRATZE MEDIZIN MELONE MESSER MIKROSKOP MINUTE MONTAG MUSCHEL " +
    "MUSEUM NACHBAR NADEL NASHORN NUDEL OPERATION ORANGE ORCHESTER PALAST PAPAGEI PFANNE PFEFFER PFLASTER " +
    "PINSEL PLANET PRAXIS PRINZ PUPPE RAKETE RATHAUS REGENBOGEN REISE RINGEN RITTER ROSINE " +
    "RUCKSACK SALAMI SANDALE SCHATTEN SCHAUKEL SCHERE SCHLOSS SCHNECKE SCHRANK SCHULE SCHWAMM SEIFE " +
    "SKELETT SOMMER SPIEGEL SPRITZE STAUBSAUGER STERN STIEFEL STRASSE STUDIUM TABLETTE TALENT TANNE TASCHE " +
    "TELEFON TEPPICH THEATER TINTE TOMATE TROMPETE TULPE TUNNEL UHRMACHER UNIVERSUM URLAUB VERBAND VOGEL " +
    "VORHANG WAGEN WALDWEG WECKER WINTER WOLKE WOHNUNG ZAHNARZT ZEITUNG ZIRKUS ZITRONE ZUCKER ZWIEBEL " +
    "ALLERGIE ANATOMIE BAKTERIE KNORPEL MUSKEL NIERE PATIENT PFLEGER SCHULTER STETHOSKOP THERAPIE VERDAUUNG " +
    "BLITZ DOKTOR EULE FORSCHUNG GEHEIMNIS HAMMER KAKTUS KRONE LIMONADE MAGNET NEBEL OZEAN PIRAT QUELLE"
  )
    .split(/\s+/)
    .filter((w) => w.length >= 5 && w.length <= 10);

  // Wörter entfernen, die Anagramme voneinander sind (dann wäre die Lösung nicht eindeutig)
  const bySig = {};
  for (const w of WORDS) {
    const sig = w.split("").sort().join("");
    (bySig[sig] = bySig[sig] || []).push(w);
  }
  const LIST = WORDS.filter((w) => bySig[w.split("").sort().join("")].length === 1);

  const ALPHABET = "ABCDEFGHIJKLMNOPRSTUVWZ";

  function scramble(word) {
    for (let t = 0; t < 60; t++) {
      const s = U.shuffle(word.split("")).join("");
      if (s === word || s[0] === word[0]) continue;
      // keine langen Stücke des Originals übrig lassen
      let ok = true;
      for (let i = 0; i + 3 <= word.length; i++) {
        if (s.indexOf(word.slice(i, i + 3)) >= 0) { ok = false; break; }
      }
      if (ok) return s;
    }
    return word.split("").reverse().join("");
  }

  const SHUFFLE_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h3.5c4 0 5 10 9 10H20"/><path d="M4 17h3.5c1.6 0 2.7-1.6 3.6-3.6"/>' +
    '<path d="M13 10.2c.9-1.8 2-3.2 3.5-3.2H20"/><path d="M17.5 4.5L20 7l-2.5 2.5"/><path d="M17.5 14.5L20 17l-2.5 2.5"/></svg>';

  /* Buchstaben neu anordnen, mit kurzer Animation (FLIP) */
  function reorder(box, order) {
    const tiles = Array.from(box.children);
    const before = new Map(tiles.map((t) => [t, t.getBoundingClientRect()]));
    order.forEach((t) => box.append(t));
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    for (const t of tiles) {
      const a = before.get(t), b = t.getBoundingClientRect();
      const dx = a.left - b.left, dy = a.top - b.top;
      if (!dx && !dy) continue;
      t.animate([{ transform: "translate(" + dx + "px," + dy + "px)" }, { transform: "none" }], { duration: 280, easing: "cubic-bezier(.2,.7,.2,1)" });
    }
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest('[data-act="tiles-shuffle"], [data-act="tiles-reset"]');
    if (!btn) return;
    const card = btn.closest(".prompt-card") || document;
    const box = card.querySelector(".anagram");
    if (!box) return;
    const tiles = Array.from(box.children);
    const reset = card.querySelector('[data-act="tiles-reset"]');
    if (btn.getAttribute("data-act") === "tiles-reset") {
      reorder(box, tiles.slice().sort((a, b) => a.dataset.pos - b.dataset.pos));
      if (reset) reset.hidden = true;
      return;
    }
    const cur = tiles.map((t) => t.dataset.pos).join(",");
    let next = tiles;
    for (let t = 0; t < 20; t++) {
      next = U.shuffle(tiles);
      if (next.map((x) => x.dataset.pos).join(",") !== cur) break;
    }
    reorder(box, next);
    if (reset) reset.hidden = false;
  });

  function letterHtml(l) {
    return '<span class="big-letter">' + l + "</span>";
  }

  function cap(w) {
    return w.charAt(0) + w.slice(1).toLowerCase();
  }

  // In der Erklärung nicht nennen (abwertend, Eigennamen, Fachbegriffe). Gesperrt bleiben die Buchstaben trotzdem.
  const HIDE_IN_NOTE = new Set(["MEIER", "TANGER", "PILSEN", "ESCHER", "TUPEL", "ADELN", "ORDNEN", "TRAGEN", "TIEBREAK"]);

  function altNote(alt, first) {
    const other = alt.nouns.filter((w) => w[0] !== first && !HIDE_IN_NOTE.has(w));
    if (!other.length) return "";
    const list = other.map((w) => "<strong>" + cap(w) + "</strong>");
    const letters = Array.from(new Set(other.map((w) => w[0])));
    return '<p class="muted small">Aus denselben Buchstaben lässt sich auch ' +
      (list.length > 1 ? list.slice(0, -1).join(", ") + " oder " + list[list.length - 1] : list[0]) +
      " bilden. Deshalb steht " + letters.join(" und ") + " nicht zur Auswahl.</p>";
  }

  function make() {
    const word = U.pick(LIST);
    const scrambled = scramble(word);
    const first = word[0];
    // Ablenker: bevorzugt Buchstaben aus dem Wort selbst
    // Andere Wörter aus denselben Buchstaben (z. B. HAFEN/FAHNE): deren Anfangsbuchstaben nie anbieten,
    // damit immer genau eine Antwort richtig ist.
    const alt = (MT.wortAlternativen || {})[word] || { nouns: [], all: [] };
    const blocked = new Set(alt.all.map((w) => w[0]).concat([first]));
    const inWord = U.shuffle(Array.from(new Set(word.split("")))).filter((l) => !blocked.has(l));
    const others = U.shuffle(ALPHABET.split("")).filter((l) => !blocked.has(l) && inWord.indexOf(l) < 0);
    const distractors = inWord.slice(0, 3).concat(others).slice(0, 6).map(letterHtml);
    const { options, correct } = U.withNone(letterHtml(first), distractors, 0.2, "Keine der Antworten ist richtig.");

    const display = word.charAt(0) + word.slice(1).toLowerCase();
    return {
      prompt:
        '<p class="prompt-q">Mit welchem Buchstaben beginnt das Wort?</p>' +
        '<div class="anagram" aria-label="Buchstaben: ' + scrambled.split("").join(" ") + '">' +
        scrambled.split("").map((l, i) => '<span class="tile" data-pos="' + i + '">' + l + "</span>").join("") +
        "</div>" +
        '<div class="tile-tools">' +
        '<button type="button" class="chip-btn" data-act="tiles-shuffle">' + SHUFFLE_ICON + "Mischen</button>" +
        '<button type="button" class="chip-btn" data-act="tiles-reset" hidden>Original</button>' +
        "</div>",
      options,
      correct,
      explain: "<p>Das gesuchte Wort ist <strong>" + display + "</strong>. Es beginnt mit " + first + ".</p>" + altNote(alt, first),
    };
  }

  MT.wortfluessigkeit = {
    id: "wortfluessigkeit",
    title: "Wortflüssigkeit",
    simCount: 15,
    simSeconds: 20 * 60,
    layout: "grid",
    make,
    LIST,
  };
})();
