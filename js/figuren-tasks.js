/* Aufgabengenerator für "Figuren zusammensetzen".
   Eine Grundform wird mit geraden Schnitten in Teile zerlegt, die Teile werden
   gedreht und verstreut. Dazu kommen vier Antwortfiguren (A–D) und E = keine. */
(function () {
  "use strict";
  const MT = (window.MT = window.MT || {});
  const G = MT.geo;

  const BOARD = { W: 400, H: 400, R: 104, CX: 200, CY: 200 };

  function ngon(n, rotDeg) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = ((rotDeg + (360 * i) / n) * Math.PI) / 180;
      out.push([Math.cos(a), Math.sin(a)]);
    }
    return out;
  }

  function arc(fromDeg, toDeg, steps, rx, ry) {
    const out = [];
    for (let i = 0; i <= steps; i++) {
      const a = ((fromDeg + ((toDeg - fromDeg) * i) / steps) * Math.PI) / 180;
      out.push([Math.cos(a) * (rx || 1), Math.sin(a) * (ry || 1)]);
    }
    return out;
  }

  // Alle Grundformen sind konvex, damit die Schnitte sauber bleiben.
  const SHAPES = {
    dreieck: { name: "Dreieck", acc: "ein Dreieck", corners: 3, angle: "60°", make: () => ngon(3, -90) },
    quadrat: { name: "Quadrat", acc: "ein Quadrat", corners: 4, angle: "90°", make: () => ngon(4, -45) },
    rechteck: { name: "Rechteck", acc: "ein Rechteck", corners: 4, angle: "90°", make: () => [[-1, -0.58], [1, -0.58], [1, 0.58], [-1, 0.58]] },
    trapez: { name: "Trapez", acc: "ein Trapez", corners: 4, note: "zwei spitze und zwei stumpfe Ecken, eine Seite deutlich länger", make: () => [[-1, 0.55], [1, 0.55], [0.48, -0.55], [-0.48, -0.55]] },
    parallelogramm: { name: "Parallelogramm", acc: "ein Parallelogramm", corners: 4, note: "je zwei gegenüberliegende Ecken gleich: zwei spitze, zwei stumpfe", make: () => [[-1, 0.5], [0.42, 0.5], [1, -0.5], [-0.42, -0.5]] },
    fuenfeck: { name: "Fünfeck", acc: "ein Fünfeck", corners: 5, angle: "108°", make: () => ngon(5, -90) },
    sechseck: { name: "Sechseck", acc: "ein Sechseck", corners: 6, angle: "120°", make: () => ngon(6, 0) },
    siebeneck: { name: "Siebeneck", acc: "ein Siebeneck", corners: 7, angle: "≈ 128,6°", make: () => ngon(7, -90) },
    achteck: { name: "Achteck", acc: "ein Achteck", corners: 8, angle: "135°", make: () => ngon(8, 22.5) },
    kreis: { name: "Kreis", acc: "einen Kreis", corners: 0, note: "nur gebogene Außenkanten, keine Ecken", make: () => ngon(72, 0) },
    halbkreis: { name: "Halbkreis", acc: "einen Halbkreis", corners: 2, note: "eine gerade und eine gebogene Kante, zwei rechte Winkel", make: () => arc(180, 360, 36) },
    viertelkreis: { name: "Viertelkreis", acc: "einen Viertelkreis", corners: 3, note: "zwei gerade Kanten im rechten Winkel und ein Bogen", make: () => [[0, 0]].concat(arc(180, 270, 24)) },
    ellipse: { name: "Ellipse", acc: "eine Ellipse", corners: 0, note: "nur gebogene Kanten, aber unterschiedlich stark gekrümmt", make: () => ngon(72, 0).map((p) => [p[0], p[1] * 0.62]) },
  };

  // Ähnliche Formen dienen als Ablenker, damit die Auswahl nicht zu leicht ist.
  const SIMILAR = {
    dreieck: ["viertelkreis", "trapez", "fuenfeck", "parallelogramm", "quadrat"],
    quadrat: ["rechteck", "fuenfeck", "trapez", "parallelogramm", "achteck"],
    rechteck: ["quadrat", "parallelogramm", "trapez", "ellipse"],
    trapez: ["parallelogramm", "rechteck", "dreieck", "fuenfeck"],
    parallelogramm: ["trapez", "rechteck", "quadrat", "sechseck"],
    fuenfeck: ["sechseck", "quadrat", "siebeneck", "dreieck"],
    sechseck: ["fuenfeck", "siebeneck", "achteck", "kreis"],
    siebeneck: ["sechseck", "achteck", "fuenfeck", "kreis"],
    achteck: ["siebeneck", "sechseck", "kreis", "fuenfeck"],
    kreis: ["ellipse", "achteck", "siebeneck", "halbkreis"],
    halbkreis: ["viertelkreis", "kreis", "ellipse", "trapez"],
    viertelkreis: ["halbkreis", "dreieck", "kreis", "trapez"],
    ellipse: ["kreis", "halbkreis", "rechteck", "achteck"],
  };

  const NORMALIZED = {};
  for (const key of Object.keys(SHAPES)) NORMALIZED[key] = G.normalize(SHAPES[key].make());

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Kompaktheit: kleine Werte bedeuten schmale Splitter. */
  function chunky(poly) {
    const c = G.centroid(poly);
    const r = G.radius(poly, c);
    return r > 0 && G.areaAbs(poly) / (r * r) > 0.42;
  }

  function cutShape(poly, count) {
    const total = G.areaAbs(poly);
    const minArea = total * (count <= 3 ? 0.17 : count === 4 ? 0.12 : count === 5 ? 0.095 : 0.075);
    for (let attempt = 0; attempt < 60; attempt++) {
      let pieces = [poly];
      let ok = true;
      while (pieces.length < count) {
        pieces.sort((a, b) => G.areaAbs(b) - G.areaAbs(a));
        // meist das größte Teil schneiden, manchmal das zweitgrößte
        const idx = pieces.length > 1 && Math.random() < 0.3 ? 1 : 0;
        const target = pieces[idx];
        let done = false;
        for (let t = 0; t < 80; t++) {
          const c = G.centroid(target);
          const r = G.radius(target, c);
          const p = [c[0] + rand(-0.35, 0.35) * r, c[1] + rand(-0.35, 0.35) * r];
          const [a, b] = G.split(target, p, rand(0, Math.PI));
          if (a.length < 3 || b.length < 3) continue;
          if (G.areaAbs(a) < minArea || G.areaAbs(b) < minArea) continue;
          if (!chunky(a) || !chunky(b)) continue;
          pieces.splice(idx, 1, a, b);
          done = true;
          break;
        }
        if (!done) {
          ok = false;
          break;
        }
      }
      if (ok) return pieces;
    }
    return null;
  }

  const POLYGONS = ["fuenfeck", "sechseck", "siebeneck", "achteck"];

  /** Innenwinkel jeder Ecke eines konvexen Polygons (Grad) */
  function vertexAngles(poly) {
    const n = poly.length;
    return poly.map((v, i) => {
      const a = poly[(i - 1 + n) % n], b = poly[(i + 1) % n];
      const u = [a[0] - v[0], a[1] - v[1]], w = [b[0] - v[0], b[1] - v[1]];
      const cos = (u[0] * w[0] + u[1] * w[1]) / (Math.hypot(u[0], u[1]) * Math.hypot(w[0], w[1]));
      return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
    });
  }

  function scatter(pieces) {
    const { W, H } = BOARD;
    const placed = [];
    for (const p of shuffle(pieces)) {
      let best = null;
      let bestScore = -Infinity;
      const m = Math.min(p.r + 6, W / 2 - 1);
      for (let t = 0; t < 220; t++) {
        const x = rand(m, W - m);
        const y = rand(m, H - m);
        let score = Infinity;
        for (const q of placed) {
          score = Math.min(score, Math.hypot(x - q.pose.x, y - q.pose.y) - (p.r + q.r) * 0.82);
        }
        if (score > bestScore) {
          bestScore = score;
          best = { x, y };
        }
      }
      p.pose = { x: best.x, y: best.y, a: rand(25, 335) };
      placed.push(p);
    }
  }

  function scatterPieces(task) {
    scatter(task.pieces);
  }

  function makeOptions(key, focus) {
    if (focus) {
      // wie in der Prüfung: Fünf-, Sechs-, Sieben- oder Achteck
      if (Math.random() < 0.15) {
        const opts = shuffle(POLYGONS.filter((k) => k !== key).concat(["quadrat"]));
        return { options: opts, correct: 4 };
      }
      const opts = shuffle(POLYGONS);
      return { options: opts, correct: opts.indexOf(key) };
    }
    const noneCorrect = Math.random() < 0.2;
    const others = Object.keys(SHAPES).filter((k) => k !== key);
    const similar = shuffle(SIMILAR[key] || []);
    const need = noneCorrect ? 4 : 3;
    const chosen = [];
    for (const k of similar.concat(shuffle(others))) {
      if (chosen.length >= need) break;
      if (k !== key && chosen.indexOf(k) < 0) chosen.push(k);
    }
    const options = shuffle(noneCorrect ? chosen : chosen.concat([key]));
    return { options, correct: noneCorrect ? 4 : options.indexOf(key) };
  }

  /** Erzeugt eine Aufgabe mit `count` Teilen (3–6). */
  function makeTask(count, opts) {
    const focus = !!(opts && opts.focus);
    const { R, CX, CY } = BOARD;
    const keys = focus ? POLYGONS : Object.keys(SHAPES);
    for (let attempt = 0; attempt < 30; attempt++) {
      const key = pick(keys);
      const polys = cutShape(NORMALIZED[key], count);
      if (!polys) continue;
      const orig = NORMALIZED[key];
      const pieces = polys.map((poly) => {
        const c = G.centroid(poly);
        const local = poly.map((q) => [(q[0] - c[0]) * R, (q[1] - c[1]) * R]);
        const angles = vertexAngles(poly);
        // Ecke der Gesamtfigur = Punkt liegt auf einer Ecke der Grundform
        const vtx = poly.map((q, i) => ({
          a: angles[i],
          corner: orig.some((o) => Math.hypot(o[0] - q[0], o[1] - q[1]) < 1e-6),
        }));
        return { local, vtx, tx: CX + c[0] * R, ty: CY + c[1] * R, r: G.radius(local), pose: null };
      });
      const task = { key, count, pieces, focus };
      scatter(pieces);
      Object.assign(task, makeOptions(key, focus));
      return task;
    }
    throw new Error("Aufgabe konnte nicht erzeugt werden");
  }

  MT.figurenTasks = {
    BOARD,
    SHAPES,
    NORMALIZED,
    makeTask,
    scatterPieces,
    POLYGONS,
    letter: (i) => "ABCDE"[i],
  };
})();
