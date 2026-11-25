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
    "PINSEL PLANET PRAXIS PRINZ PUPPE RAKETE RATHAUS REGEN REGENBOGEN REISE RINGEN RITTER ROSINE " +
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

  function letterHtml(l) {
    return '<span class="big-letter">' + l + "</span>";
  }

  function make() {
    const word = U.pick(LIST);
    const scrambled = scramble(word);
    const first = word[0];
    // Ablenker: bevorzugt Buchstaben aus dem Wort selbst
    const inWord = U.shuffle(Array.from(new Set(word.split("")))).filter((l) => l !== first);
    const others = U.shuffle(ALPHABET.split("")).filter((l) => l !== first && inWord.indexOf(l) < 0);
    const distractors = inWord.slice(0, 3).concat(others).slice(0, 6).map(letterHtml);
    const { options, correct } = U.withNone(letterHtml(first), distractors, 0.2, "Keine der Antworten ist richtig.");

    const display = word.charAt(0) + word.slice(1).toLowerCase();
    return {
      prompt:
        '<p class="prompt-q">Mit welchem Buchstaben beginnt das Wort?</p>' +
        '<div class="anagram" aria-label="Buchstaben: ' + scrambled.split("").join(" ") + '">' +
        scrambled.split("").map((l) => '<span class="tile">' + l + "</span>").join("") +
        "</div>",
      options,
      correct,
      explain: "<p>Das gesuchte Wort ist <strong>" + display + "</strong>. Es beginnt mit " + first + ".</p>",
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
