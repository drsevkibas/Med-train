/* Implikationen erkennen: zwei Aussagen mit Fantasiewörtern, welche Schlussfolgerung stimmt zwingend?
   Gültigkeit wird exakt geprüft: Alle 128 Venn-Modelle für drei Begriffe werden durchgerechnet. */
(function () {
  "use strict";
  const MT = (window.MT = window.MT || {});
  const U = MT.quiz.util;

  // Aussageformen: a = Alle X sind Y, e = Keine X sind Y, i = Einige X sind Y, o = Einige X sind keine Y
  const FORMS = ["a", "e", "i", "o"];

  function sentence(f, x, y) {
    switch (f) {
      case "a": return "Alle " + x + " sind " + y + ".";
      case "e": return "Keine " + x + " sind " + y + ".";
      case "i": return "Einige " + x + " sind " + y + ".";
      default: return "Einige " + x + " sind keine " + y + ".";
    }
  }

  // Begriffe als Bits: A = 1, B = 2, C = 4. Ein Modell = Menge nicht-leerer Regionen (1..7).
  function holds(model, f, X, Y) {
    let some = false, someNot = false;
    for (let r = 1; r < 8; r++) {
      if (!(model & (1 << r))) continue;
      if (r & X) {
        if (r & Y) some = true;
        else someNot = true;
      }
    }
    switch (f) {
      case "a": return !someNot;
      case "e": return !some;
      case "i": return some;
      default: return someNot;
    }
  }

  function nonEmpty(model, X) {
    for (let r = 1; r < 8; r++) if (model & (1 << r) && r & X) return true;
    return false;
  }

  const MODELS = Array.from({ length: 128 }, (_, i) => i << 1); // Bits 1..7

  /** Gilt die Schlussfolgerung in allen Modellen, in denen die Prämissen gelten? */
  function valid(premises, concl, existential) {
    for (const m of MODELS) {
      if (existential && !(nonEmpty(m, 1) && nonEmpty(m, 2) && nonEmpty(m, 4))) continue;
      if (premises.every((p) => holds(m, p.f, p.x, p.y)) && !holds(m, concl.f, concl.x, concl.y)) return false;
    }
    return true;
  }

  function consistent(premises) {
    // Prämissen müssen gemeinsam erfüllbar sein, auch mit nicht-leeren Begriffen
    return MODELS.some((m) => nonEmpty(m, 1) && nonEmpty(m, 2) && nonEmpty(m, 4) &&
      premises.every((p) => holds(m, p.f, p.x, p.y)));
  }

  // Fantasiewörter (Mehrzahl), aus Silben gebaut
  const ON = ["Bl", "Dr", "Fl", "Gr", "Kr", "Pl", "Tr", "Schn", "Sp", "Z", "M", "L", "N", "W", "K", "T", "R", "F", "H", "P"];
  const NU = ["a", "e", "i", "o", "u", "au", "ei", "ö", "ü"];
  const CO = ["mp", "nk", "rt", "lb", "nd", "x", "st", "rk", "ff", "ll", "tz", "rn"];
  const END = ["e", "en", "er", "inge", "el", "ose", "ane", "ide"];
  function word() {
    let w = U.pick(ON) + U.pick(NU) + U.pick(CO);
    w += Math.random() < 0.6 ? U.pick(END) : U.pick(NU.slice(0, 5)) + "s";
    return w.charAt(0).toUpperCase() + w.slice(1);
  }
  function threeWords() {
    const s = new Set();
    while (s.size < 3) s.add(word());
    return Array.from(s);
  }

  function make() {
    for (let attempt = 0; attempt < 200; attempt++) {
      const names = threeWords();
      const N = { 1: names[0], 2: names[1], 4: names[2] };
      // Prämisse 1 verbindet A und B, Prämisse 2 verbindet B und C (Reihenfolge zufällig)
      const p1 = Math.random() < 0.5 ? { x: 1, y: 2 } : { x: 2, y: 1 };
      const p2 = Math.random() < 0.5 ? { x: 2, y: 4 } : { x: 4, y: 2 };
      p1.f = U.pick(FORMS);
      p2.f = U.pick(FORMS);
      const premises = [p1, p2];
      if (!consistent(premises)) continue;

      // Kandidaten: alle Formen zwischen A und C, in beide Richtungen
      const cands = [];
      for (const f of FORMS) for (const [x, y] of [[1, 4], [4, 1]]) cands.push({ f, x, y });
      const strict = cands.filter((c) => valid(premises, c, false));
      const wrong = cands.filter((c) => !valid(premises, c, true));
      if (wrong.length < 4) continue;

      const noneCorrect = strict.length === 0 || Math.random() < 0.15;
      if (strict.length === 0 && Math.random() < 0.9) continue; // solche Aufgaben seltener

      const text = (c) => sentence(c.f, N[c.x], N[c.y]);
      let options, correct;
      if (noneCorrect) {
        options = U.shuffle(wrong).slice(0, 4).map(text);
        correct = 4;
      } else {
        const right = U.pick(strict);
        const four = U.shuffle(U.shuffle(wrong).slice(0, 3).concat([right]));
        options = four.map(text);
        correct = four.indexOf(right);
      }
      options.push("Keine der Schlussfolgerungen ist richtig.");

      const prompt =
        '<p class="prompt-q">Welche Schlussfolgerung ergibt sich zwingend aus den beiden Aussagen?</p>' +
        '<ol class="premises">' + premises.map((p) => "<li>" + sentence(p.f, N[p.x], N[p.y]) + "</li>").join("") + "</ol>";

      let explain;
      if (correct === 4) {
        explain = strict.length
          ? "<p>Keine der angebotenen Antworten folgt zwingend. Zwingend wäre zum Beispiel: <em>" + text(strict[0]) + "</em></p>"
          : "<p>Aus diesen beiden Aussagen folgt über " + N[1] + " und " + N[4] + " nichts zwingend. Jede Antwort lässt sich mit einem Gegenbeispiel widerlegen.</p>";
      } else {
        explain = "<p><em>" + options[correct] + "</em> muss in jedem Fall stimmen, egal wie die Begriffe sonst verteilt sind. " +
          "Die anderen Antworten können stimmen, müssen aber nicht.</p>";
      }
      explain += '<p class="muted small">Tipp: Zeichne die Begriffe als Kreise. Prüfe jede Antwort, indem du ein Gegenbeispiel suchst.</p>';
      return { prompt, options, correct, explain };
    }
    throw new Error("Implikation konnte nicht erzeugt werden");
  }

  MT.implikationen = {
    id: "implikationen",
    title: "Implikationen erkennen",
    simCount: 10,
    simSeconds: 10 * 60,
    layout: "list",
    make,
    _valid: valid,
  };
})();
