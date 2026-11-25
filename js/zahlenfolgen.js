/* Zahlenfolgen: Regel erkennen, die zwei fehlenden Zahlen am Ende finden. */
(function () {
  "use strict";
  const MT = (window.MT = window.MT || {});
  const U = MT.quiz.util;
  const { randInt, pick } = U;

  const SHOWN = 7;
  const TOTAL = SHOWN + 2;

  const sgn = (n) => (n >= 0 ? "+" + n : "−" + Math.abs(n));
  const signed = () => (Math.random() < 0.75 ? 1 : -1);

  /* Jede Regel liefert { seq, ops (Rechenschritte zwischen den Gliedern), text } */
  const RULES = [
    function arithmetic() {
      const d = randInt(3, 19) * signed();
      const seq = [randInt(d < 0 ? 60 : 1, d < 0 ? 140 : 60)];
      while (seq.length < TOTAL) seq.push(seq[seq.length - 1] + d);
      return { seq, ops: Array(TOTAL - 1).fill(sgn(d)), text: "Es wird immer " + sgn(d) + " gerechnet." };
    },
    function alternatingAdd() {
      let a = randInt(2, 20) * signed(), b = randInt(2, 20) * signed();
      if (a === b) b += 3;
      const seq = [randInt(10, 80)];
      const ops = [];
      for (let i = 0; seq.length < TOTAL; i++) {
        const d = i % 2 ? b : a;
        seq.push(seq[seq.length - 1] + d);
        ops.push(sgn(d));
      }
      return { seq, ops, text: "Abwechselnd " + sgn(a) + " und " + sgn(b) + "." };
    },
    function growingDiff() {
      const d0 = randInt(1, 6), k = randInt(1, 4) * (Math.random() < 0.8 ? 1 : -1);
      const seq = [randInt(2, 40)];
      const ops = [];
      for (let i = 0; seq.length < TOTAL; i++) {
        const d = d0 + i * k;
        seq.push(seq[seq.length - 1] + d);
        ops.push(sgn(d));
      }
      return { seq, ops, text: "Der Abstand ändert sich jedes Mal um " + sgn(k) + " (" + ops.slice(0, 3).join(", ") + ", …)." };
    },
    function doublingDiff() {
      const d0 = randInt(1, 3), f = 2;
      const seq = [randInt(1, 30)];
      const ops = [];
      let d = d0;
      while (seq.length < TOTAL) {
        seq.push(seq[seq.length - 1] + d);
        ops.push(sgn(d));
        d *= f;
      }
      return { seq, ops, text: "Der Abstand verdoppelt sich jedes Mal (" + ops.slice(0, 3).join(", ") + ", …)." };
    },
    function mulAdd() {
      const m = 2, a = randInt(1, 9) * (Math.random() < 0.5 ? 1 : -1);
      const seq = [randInt(2, 9)];
      const ops = [];
      for (let i = 0; seq.length < TOTAL; i++) {
        const last = seq[seq.length - 1];
        if (i % 2 === 0) { seq.push(last * m); ops.push("×" + m); }
        else { seq.push(last + a); ops.push(sgn(a)); }
      }
      return { seq, ops, text: "Abwechselnd ×" + m + " und " + sgn(a) + "." };
    },
    function interleaved() {
      const d1 = randInt(2, 12) * signed(), d2 = randInt(2, 12) * signed();
      let a = randInt(10, 60), b = randInt(10, 60);
      const seq = [];
      for (let i = 0; i < TOTAL; i++) {
        if (i % 2 === 0) { seq.push(a); a += d1; } else { seq.push(b); b += d2; }
      }
      const ops = seq.slice(1).map((v, i) => sgn(v - seq[i]));
      return {
        seq, ops, interleaved: true,
        text: "Zwei Folgen sind ineinander verschachtelt: an den Stellen 1, 3, 5, … wird " + sgn(d1) +
          " gerechnet, an den Stellen 2, 4, 6, … " + sgn(d2) + ".",
      };
    },
    function fibonacci() {
      const seq = [randInt(1, 6), randInt(1, 8)];
      while (seq.length < TOTAL) seq.push(seq[seq.length - 1] + seq[seq.length - 2]);
      const ops = seq.slice(1).map((v, i) => sgn(v - seq[i]));
      return { seq, ops, text: "Jede Zahl ist die Summe der beiden Zahlen davor." };
    },
    function repeatingTriple() {
      const a = randInt(2, 15), b = randInt(2, 15) * signed(), c = -randInt(2, 15);
      const pattern = [a, b, c];
      const seq = [randInt(20, 70)];
      const ops = [];
      for (let i = 0; seq.length < TOTAL; i++) {
        const d = pattern[i % 3];
        seq.push(seq[seq.length - 1] + d);
        ops.push(sgn(d));
      }
      return { seq, ops, text: "Das Muster " + pattern.map(sgn).join(", ") + " wiederholt sich." };
    },
    function mulSub() {
      const k = pick([2, 3]), a = randInt(1, 6);
      const seq = [randInt(2, 6)];
      const ops = [];
      for (let i = 0; seq.length < TOTAL; i++) {
        const last = seq[seq.length - 1];
        if (i % 2 === 0) { seq.push(last * k); ops.push("×" + k); }
        else { seq.push(last - a); ops.push("−" + a); }
      }
      return { seq, ops, text: "Abwechselnd ×" + k + " und −" + a + "." };
    },
    function diffOfDiff() {
      // Abstände wachsen abwechselnd um zwei verschiedene Werte
      const seq = [randInt(1, 30)];
      const ops = [];
      let d = randInt(1, 4);
      const k = randInt(1, 3);
      while (seq.length < TOTAL) {
        seq.push(seq[seq.length - 1] + d);
        ops.push(sgn(d));
        d = d + k;
      }
      // als Quadrat-ähnliche Folge erklären, wenn k = 2 und Start 1
      return { seq, ops, text: "Die Abstände wachsen gleichmäßig um " + k + " (" + ops.slice(0, 4).join(", ") + ", …)." };
    },
  ];

  function plausible(seq) {
    return seq.every((v) => Number.isInteger(v) && Math.abs(v) <= 1500) &&
      new Set(seq).size > 3;
  }

  function pairHtml(p) {
    return '<span class="num-pair">' + p[0] + '<span class="sep">/</span>' + p[1] + "</span>";
  }

  function distractorPairs(seq) {
    const x7 = seq[SHOWN - 1], x6 = seq[SHOWN - 2];
    const [a, b] = [seq[SHOWN], seq[SHOWN + 1]];
    const lastD = x7 - x6;
    const cands = [
      [a, b + randInt(1, 4)],
      [a, b - randInt(1, 4)],
      [a + randInt(1, 3), b],
      [a - randInt(1, 3), b],
      [b, a],
      [x7 + lastD, x7 + 2 * lastD],
      [a, a + (a - x7)],
      [a + (b - a), b + (b - a)],
      [a + 2, b + 2],
      [a - 2, b - 2],
      [a + 10, b + 10],
    ];
    const seen = new Set([a + "/" + b]);
    const out = [];
    for (const c of U.shuffle(cands.slice(0, 5)).concat(U.shuffle(cands.slice(5)))) {
      const key = c[0] + "/" + c[1];
      if (!seen.has(key)) { seen.add(key); out.push(c); }
    }
    return out;
  }

  function make() {
    let r;
    for (let t = 0; t < 50; t++) {
      r = pick(RULES)();
      if (plausible(r.seq)) break;
    }
    const seq = r.seq;
    const answer = [seq[SHOWN], seq[SHOWN + 1]];
    const distractors = distractorPairs(seq).map(pairHtml);
    const { options, correct } = U.withNone(pairHtml(answer), distractors, 0.18, "Keine der Antworten ist richtig.");

    const prompt =
      '<p class="prompt-q">Welche zwei Zahlen setzen die Folge fort?</p>' +
      '<div class="seq" aria-label="Zahlenfolge">' +
      seq.slice(0, SHOWN).map((v) => '<span class="seq-n">' + v + "</span>").join("") +
      '<span class="seq-n is-gap">?</span><span class="seq-n is-gap">?</span></div>';

    const explain =
      "<p>" + r.text + "</p>" +
      '<div class="seq-explain" aria-hidden="true">' +
      seq.map((v, i) =>
        '<span class="seq-n' + (i >= SHOWN ? " is-answer" : "") + '">' + v + "</span>" +
        (i < seq.length - 1 ? '<span class="seq-op">' + r.ops[i] + "</span>" : "")
      ).join("") +
      "</div>";

    return { prompt, options, correct, explain };
  }

  MT.zahlenfolgen = {
    id: "zahlenfolgen",
    title: "Zahlenfolgen",
    simCount: 10,
    simSeconds: 15 * 60,
    layout: "grid",
    make,
    RULES,
  };
})();
