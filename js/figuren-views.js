/* Bildschirme für "Figuren zusammensetzen": Übung, Simulation, Auswertung. */
(function () {
  "use strict";
  const MT = (window.MT = window.MT || {});
  const T = () => MT.figurenTasks;
  const G = MT.geo;

  const SIM_COUNT = 15;
  const SIM_SECONDS = 20 * 60;
  const SIM_MIX = [3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6, 6];

  const ICON = {
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    rotL: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5v5h5"/><path d="M5.2 14.5A7.5 7.5 0 1 0 6.6 7L4 10"/></svg>',
    rotR: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 5v5h-5"/><path d="M18.8 14.5A7.5 7.5 0 1 1 17.4 7L20 10"/></svg>',
    shuffle: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h3.5c4 0 5 10 9 10H20"/><path d="M4 17h3.5c1.6 0 2.7-1.6 3.6-3.6"/><path d="M13 10.2c.9-1.8 2-3.2 3.5-3.2H20"/><path d="M17.5 4.5L20 7l-2.5 2.5"/><path d="M17.5 14.5L20 17l-2.5 2.5"/></svg>',
    eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/></svg>',
    magnet: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4v7a6 6 0 0 0 12 0V4"/><path d="M6 8h4M14 8h4"/><path d="M10 4v7a2 2 0 0 0 4 0V4"/></svg>',
    angle: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19h16M4 19L15 6"/><path d="M10 19a6 6 0 0 0-1.9-4.4"/></svg>',
    bulb: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/></svg>',
  };

  /* ---------- Tipps: Winkel und Ecken ---------- */
  function cornerDemo(key) {
    // Grundform mit markierter oberer Ecke und Winkelbogen
    const pts = T().NORMALIZED[key];
    let top = 0;
    pts.forEach((p, i) => { if (p[1] < pts[top][1] - 1e-9) top = i; });
    const n = pts.length, v = pts[top], a = pts[(top - 1 + n) % n], b = pts[(top + 1) % n];
    const r = 0.38;
    const ua = [a[0] - v[0], a[1] - v[1]], ub = [b[0] - v[0], b[1] - v[1]];
    const la = Math.hypot(ua[0], ua[1]), lb = Math.hypot(ub[0], ub[1]);
    const pa = [v[0] + (ua[0] / la) * r, v[1] + (ua[1] / la) * r], pb = [v[0] + (ub[0] / lb) * r, v[1] + (ub[1] / lb) * r];
    return '<svg viewBox="-1.25 -1.25 2.5 2.5" aria-hidden="true"><polygon class="demo-shape" points="' + G.pointsAttr(pts) + '"/>' +
      '<path class="demo-arc" d="M' + pa[0].toFixed(3) + " " + pa[1].toFixed(3) + " A" + r + " " + r + " 0 0 " + (ua[0] * ub[1] - ua[1] * ub[0] > 0 ? 1 : 0) + " " + pb[0].toFixed(3) + " " + pb[1].toFixed(3) + '"/>' +
      '<circle class="demo-dot" cx="' + v[0].toFixed(3) + '" cy="' + v[1].toFixed(3) + '" r="0.09"/></svg>';
  }

  function tipsHtml() {
    const rows = [["fuenfeck", "108°", "90° + 18°"], ["sechseck", "120°", "90° + 30°"], ["siebeneck", "≈ 129°", "zwischen 6- und 8-Eck"], ["achteck", "135°", "genau zwischen 90° und 180°"]];
    return (
      '<div class="tips">' +
      '<p class="tips-lead">In der Prüfung musst du oft entscheiden, ob die Teile ein Fünf-, Sechs-, Sieben- oder Achteck ergeben. Der schnellste Weg führt über die Winkel.</p>' +
      '<div class="angle-table">' +
      rows.map((r) => '<div class="angle-card">' + cornerDemo(r[0]) + '<span class="angle-name">' + T().SHAPES[r[0]].name + '</span><span class="angle-val">' + r[1] + '</span><span class="angle-help">' + r[2] + "</span></div>").join("") +
      "</div>" +
      '<ol class="tips-steps">' +
      "<li><strong>Echte Ecken suchen.</strong> Jede Ecke der Gesamtfigur liegt unverändert an einem Teil. Ecken, die durch Schnitte entstehen, passen beim Zusammensetzen zu 180° (an einer Außenkante) oder 360° (im Inneren) zusammen.</li>" +
      "<li><strong>Winkel schätzen.</strong> Vergleiche mit einem rechten Winkel (Blattecke). Je stumpfer die Ecken der Figur, desto mehr Ecken hat sie. Formel: (n − 2) · 180° ÷ n.</li>" +
      "<li><strong>Merkhilfen.</strong> 120° kennst du von Bienenwaben, 135° vom Stoppschild. 108° ist nur wenig stumpfer als ein rechter Winkel.</li>" +
      "<li><strong>Außenkanten zählen.</strong> Bei regelmäßigen Vielecken sind alle Außenkanten gleich lang. Zähle sie über alle Teile. Eine Kante kann durch einen Schnitt auf zwei Teile verteilt sein.</li>" +
      "<li><strong>Rundungen beachten.</strong> Gebogene Kanten bedeuten Kreis, Halbkreis, Viertelkreis oder Ellipse. Ein rechter Winkel neben einem Bogen spricht für Halb- oder Viertelkreis.</li>" +
      "<li><strong>Im Übungsmodus prüfen.</strong> Schalte „Winkel“ ein. Orange markierte Zahlen sind echte Ecken der Gesamtfigur.</li>" +
      "</ol></div>"
    );
  }

  function angleHint(task) {
    const s = T().SHAPES[task.key];
    const dat = s.acc.replace(/^einen /, "einem ").replace(/^ein /, "einem ").replace(/^eine /, "einer ");
    if (s.angle) return "Jede Ecke der Figur hat " + s.angle + ", das passt zu " + dat + " mit " + s.corners + " Ecken.";
    return "Erkennungsmerkmal von " + s.acc.replace(/^(ein|eine|einen) /, "") + ": " + s.note + ".";
  }

  function shapeSvg(key) {
    const pts = T().NORMALIZED[key];
    return '<svg viewBox="-1.18 -1.18 2.36 2.36" aria-hidden="true"><polygon points="' + G.pointsAttr(pts) + '"/></svg>';
  }

  function optionsHtml(task) {
    let html = "";
    task.options.forEach((key, i) => {
      html +=
        '<button class="opt" type="button" data-opt="' + i + '" aria-label="Antwort ' + T().letter(i) + ": " + T().SHAPES[key].name + '">' +
        '<span class="opt-letter">' + T().letter(i) + "</span>" + shapeSvg(key) + "</button>";
    });
    html +=
      '<button class="opt opt-none" type="button" data-opt="4" aria-label="Antwort E: keine der Figuren">' +
      '<span class="opt-letter">E</span><span class="opt-none-text">keine</span></button>';
    return html;
  }

  function correctText(task) {
    const s = T().SHAPES[task.key];
    if (task.correct === 4) return "E – die Teile ergeben " + s.acc + ", und das ist nicht unter A–D";
    return T().letter(task.correct) + " – die Teile ergeben " + s.acc;
  }

  function markOptions(root, task, chosen) {
    root.querySelectorAll(".opt").forEach((b) => {
      const i = Number(b.getAttribute("data-opt"));
      b.disabled = true;
      b.classList.toggle("is-correct", i === task.correct);
      b.classList.toggle("is-wrong", i === chosen && chosen !== task.correct);
      b.classList.toggle("is-chosen", i === chosen);
    });
  }

  function chipsHtml(o) {
    return (
      '<div class="chip-row">' +
      '<button type="button" class="chip-btn is-toggle" data-act="angles" aria-pressed="' + (o.angles ? "true" : "false") + '">' + ICON.angle + "Winkel</button>" +
      (o.withSnap ? '<button type="button" class="chip-btn is-toggle" data-act="snap" aria-pressed="' + (o.snap ? "true" : "false") + '">' + ICON.magnet + "Einrasten</button>" : "") +
      '<button type="button" class="chip-btn" data-act="tips">' + ICON.bulb + "Tipps</button>" +
      "</div>"
    );
  }

  function toolsHtml() {
    return (
      '<div class="tools" role="toolbar" aria-label="Werkzeuge">' +
      '<button class="tool" type="button" data-act="rotl" aria-label="Ausgewähltes Teil 15 Grad nach links drehen">' + ICON.rotL + "<span>15°</span></button>" +
      '<button class="tool" type="button" data-act="rotr" aria-label="Ausgewähltes Teil 15 Grad nach rechts drehen">' + ICON.rotR + "<span>15°</span></button>" +
      '<button class="tool" type="button" data-act="shuffle">' + ICON.shuffle + "<span>Mischen</span></button>" +
      '<button class="tool" type="button" data-act="solve">' + ICON.eye + "<span>Lösung</span></button>" +
      "</div>"
    );
  }

  function topbar(eyebrow, title, metaHtml) {
    return (
      '<header class="topbar">' +
      '<button class="icon-btn" type="button" data-act="home" aria-label="Zurück zur Übersicht">' + ICON.back + "</button>" +
      '<div class="topbar-title"><span class="eyebrow">' + eyebrow + "</span><h1>" + title + "</h1></div>" +
      '<div class="topbar-meta" id="meta">' + (metaHtml || "") + "</div>" +
      "</header>"
    );
  }

  const HINT_DEFAULT = "Teil antippen und ziehen. Am runden Griff drehen, oder mit zwei Fingern.";

  /* ===================== Übungsmodus ===================== */
  function practice(root, app) {
    let count = MT.store.get("fig.count", 4);
    let snapOn = MT.store.get("fig.snap", true);
    let anglesOn = MT.store.get("fig.angles", false);
    let focus = MT.store.get("fig.focus", false);
    let task, board, answered;
    const session = { done: 0, correct: 0 };

    root.innerHTML =
      topbar("Übungsmodus", "Figuren zusammensetzen", "") +
      '<main class="screen">' +
      '<div class="seg" role="radiogroup" aria-label="Anzahl der Teile">' +
      [3, 4, 5, 6].map((n) => '<button type="button" role="radio" data-count="' + n + '">' + n + " Teile</button>").join("") +
      "</div>" +
      '<div class="seg" role="radiogroup" aria-label="Formen">' +
      '<button type="button" role="radio" data-focus="0">Alle Formen</button>' +
      '<button type="button" role="radio" data-focus="1">5- bis 8-Ecke</button>' +
      "</div>" +
      chipsHtml({ angles: anglesOn, snap: snapOn, withSnap: true }) +
      '<section class="board-card"><div class="board-wrap" id="board"></div>' +
      '<p class="board-hint" id="hint">' + HINT_DEFAULT + "</p></section>" +
      toolsHtml() +
      '<section class="question"><h2>Welche Figur ergeben die Teile?</h2><div class="options" id="options"></div></section>' +
      '<div class="feedback" id="feedback" role="status" aria-live="polite" hidden></div>' +
      '<button class="btn primary wide" type="button" data-act="next">Nächste Aufgabe</button>' +
      "</main>";

    const $ = (s) => root.querySelector(s);
    const hint = $("#hint");

    function setHint(text, tone) {
      hint.textContent = text;
      hint.className = "board-hint" + (tone ? " is-" + tone : "");
    }

    function updateMeta() {
      $("#meta").innerHTML = session.done
        ? '<span class="pill">' + session.correct + "/" + session.done + " richtig</span>"
        : "";
    }

    function updateSeg() {
      root.querySelectorAll("[data-count]").forEach((b) => {
        b.setAttribute("aria-checked", Number(b.getAttribute("data-count")) === count ? "true" : "false");
      });
      root.querySelectorAll("[data-focus]").forEach((b) => {
        b.setAttribute("aria-checked", (b.getAttribute("data-focus") === "1") === focus ? "true" : "false");
      });
    }

    function newTask() {
      task = T().makeTask(count, { focus });
      answered = false;
      if (board) board.destroy();
      board = MT.createFigurenBoard($("#board"), task, {
        interactive: true,
        snap: snapOn,
        showAngles: anglesOn,
        onComplete: () => setHint("Zusammengesetzt. Vergleiche jetzt mit den Antworten.", "ok"),
        onSelect: (i) => {
          if (i >= 0 && !board.isComplete()) setHint(HINT_DEFAULT);
        },
      });
      $("#options").innerHTML = optionsHtml(task);
      const fb = $("#feedback");
      fb.hidden = true;
      fb.className = "feedback";
      setHint(HINT_DEFAULT);
      updateSeg();
      updateMeta();
    }

    function answer(i) {
      if (answered) return;
      answered = true;
      const ok = i === task.correct;
      session.done++;
      if (ok) session.correct++;
      MT.stats.record("figuren", ok);
      markOptions(root, task, i);
      const fb = $("#feedback");
      fb.hidden = false;
      fb.className = "feedback " + (ok ? "is-ok" : "is-bad");
      fb.innerHTML =
        "<strong>" + (ok ? "Richtig." : "Leider falsch.") + "</strong> " +
        "Lösung: " + correctText(task) + "." +
        '<p class="angle-hint">' + angleHint(task) + "</p>" +
        (board.isComplete() ? "" : '<button type="button" class="link-btn" data-act="solve">Zusammensetzen ansehen</button>');
      updateMeta();
    }

    root.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn || !root.contains(btn)) return;
      const act = btn.getAttribute("data-act");
      if (btn.hasAttribute("data-count")) {
        count = Number(btn.getAttribute("data-count"));
        MT.store.set("fig.count", count);
        newTask();
      } else if (btn.hasAttribute("data-focus")) {
        focus = btn.getAttribute("data-focus") === "1";
        MT.store.set("fig.focus", focus);
        newTask();
      } else if (act === "angles") {
        anglesOn = !anglesOn;
        MT.store.set("fig.angles", anglesOn);
        btn.setAttribute("aria-pressed", anglesOn ? "true" : "false");
        board.setShowAngles(anglesOn);
        setHint(anglesOn ? "Orange Zahlen sind echte Ecken der Gesamtfigur." : HINT_DEFAULT);
      } else if (act === "tips") {
        app.sheet("Winkel und Ecken erkennen", tipsHtml());
      } else if (btn.hasAttribute("data-opt")) {
        answer(Number(btn.getAttribute("data-opt")));
      } else if (act === "home") {
        app.go("home");
      } else if (act === "next") {
        newTask();
        root.querySelector(".board-card").scrollIntoView({ block: "nearest", behavior: "smooth" });
      } else if (act === "rotl" || act === "rotr") {
        if (!board.rotateSelected(act === "rotl" ? -15 : 15)) setHint("Tippe zuerst ein Teil an, um es zu drehen.", "warn");
      } else if (act === "shuffle") {
        board.reshuffle();
        setHint(HINT_DEFAULT);
      } else if (act === "snap") {
        snapOn = !snapOn;
        MT.store.set("fig.snap", snapOn);
        btn.setAttribute("aria-pressed", snapOn ? "true" : "false");
        board.setSnap(snapOn);
        setHint(snapOn ? "Einrasten an: passende Kanten ziehen sich an." : "Einrasten aus: Teile genau selbst anlegen.");
      } else if (act === "solve") {
        board.showSolution(() =>
          setHint("So passen die Teile zusammen: " + T().SHAPES[task.key].acc + ". " + angleHint(task), "ok")
        );
        const link = root.querySelector("#feedback .link-btn");
        if (link) link.remove();
      }
    });

    newTask();
    return { destroy() { if (board) board.destroy(); } };
  }

  /* ===================== Simulation ===================== */
  function fmtTime(sec) {
    sec = Math.max(0, Math.round(sec));
    return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
  }

  function simulation(root, app) {
    const tasks = SIM_MIX.slice(0, SIM_COUNT).sort(() => Math.random() - 0.5).map((n) => T().makeTask(n));
    const answers = new Array(SIM_COUNT).fill(null);
    const startedAt = Date.now();
    const endAt = startedAt + SIM_SECONDS * 1000;
    let idx = 0;
    let board = null;
    let timer = null;
    let finished = false;
    let reviewAngles = false;

    function remaining() {
      return (endAt - Date.now()) / 1000;
    }

    function renderTask() {
      const task = tasks[idx];
      root.innerHTML =
        topbar("Simulation · wie im Test", "Aufgabe " + (idx + 1) + " von " + SIM_COUNT,
          '<span class="timer" id="timer">' + fmtTime(remaining()) + "</span>") +
        '<main class="screen">' +
        '<nav class="dots" aria-label="Aufgaben">' +
        tasks.map((_, i) =>
          '<button type="button" class="dot' + (i === idx ? " is-current" : "") + (answers[i] != null ? " is-answered" : "") +
          '" data-goto="' + i + '" aria-label="Aufgabe ' + (i + 1) + (answers[i] != null ? ", beantwortet" : "") + '">' + (i + 1) + "</button>"
        ).join("") +
        "</nav>" +
        '<section class="board-card is-static"><div class="board-wrap" id="board"></div>' +
        '<p class="board-hint">Wie in der Prüfung: Die Teile lassen sich hier nicht bewegen.</p></section>' +
        '<section class="question"><h2>Welche Figur ergeben die Teile?</h2><div class="options" id="options"></div></section>' +
        '<div class="sim-nav">' +
        '<button class="btn" type="button" data-act="prev"' + (idx === 0 ? " disabled" : "") + ">Zurück</button>" +
        (idx < SIM_COUNT - 1
          ? '<button class="btn primary" type="button" data-act="next">Weiter</button>'
          : '<button class="btn primary" type="button" data-act="submit">Abgeben</button>') +
        "</div>" +
        '<button class="btn ghost wide" type="button" data-act="submit">Test abgeben</button>' +
        "</main>";
      if (board) board.destroy();
      board = MT.createFigurenBoard(root.querySelector("#board"), task, { interactive: false });
      root.querySelector("#options").innerHTML = optionsHtml(task);
      markChosen();
    }

    function markChosen() {
      root.querySelectorAll(".opt").forEach((b) => {
        b.classList.toggle("is-chosen", Number(b.getAttribute("data-opt")) === answers[idx]);
        b.setAttribute("aria-pressed", Number(b.getAttribute("data-opt")) === answers[idx] ? "true" : "false");
      });
      const dot = root.querySelector('[data-goto="' + idx + '"]');
      if (dot) dot.classList.toggle("is-answered", answers[idx] != null);
    }

    function tick() {
      const left = remaining();
      const t = root.querySelector("#timer");
      if (t) {
        t.textContent = fmtTime(left);
        t.classList.toggle("is-low", left < 120);
      }
      if (left <= 0) finish(true);
    }

    async function submit() {
      const open = answers.filter((a) => a == null).length;
      if (open > 0) {
        const ok = await app.confirm(
          open === 1 ? "Eine Aufgabe ist noch offen." : open + " Aufgaben sind noch offen.",
          "Offene Aufgaben zählen als falsch. Trotzdem abgeben?",
          "Abgeben"
        );
        if (!ok) return;
      }
      finish(false);
    }

    function finish(timeUp) {
      if (finished) return;
      finished = true;
      clearInterval(timer);
      let score = 0;
      tasks.forEach((t, i) => {
        const ok = answers[i] === t.correct;
        if (ok) score++;
        MT.stats.record("figuren", ok);
      });
      MT.stats.recordSim("figuren", score);
      const used = Math.min(SIM_SECONDS, (Date.now() - startedAt) / 1000);
      results({ tasks, answers, score, used, timeUp });
    }

    function onClick(e) {
      const btn = e.target.closest("button");
      if (!btn || !root.contains(btn) || finished) return;
      const act = btn.getAttribute("data-act");
      if (btn.hasAttribute("data-opt")) {
        const i = Number(btn.getAttribute("data-opt"));
        answers[idx] = answers[idx] === i ? null : i;
        markChosen();
      } else if (btn.hasAttribute("data-goto")) {
        idx = Number(btn.getAttribute("data-goto"));
        renderTask();
      } else if (act === "prev" && idx > 0) {
        idx--;
        renderTask();
      } else if (act === "next" && idx < SIM_COUNT - 1) {
        idx++;
        renderTask();
      } else if (act === "submit") {
        submit();
      } else if (act === "home") {
        app.confirm("Simulation abbrechen?", "Dein Fortschritt in dieser Simulation geht verloren.", "Abbrechen", "Weitermachen")
          .then((ok) => { if (ok) app.go("home"); });
      }
    }

    // ---------- Auswertung ----------
    function results(r) {
      root.removeEventListener("click", onClick);
      if (board) { board.destroy(); board = null; }
      const pct = Math.round((r.score / SIM_COUNT) * 100);
      root.innerHTML =
        topbar("Simulation · Auswertung", "Figuren zusammensetzen", "") +
        '<main class="screen">' +
        '<section class="result-head">' +
        '<div class="result-score"><span class="big">' + r.score + "</span><span>von " + SIM_COUNT + "</span></div>" +
        "<div><p class=\"result-line\">" + pct + " % richtig</p>" +
        '<p class="muted">' + (r.timeUp ? "Zeit abgelaufen. " : "") + "Benötigte Zeit: " + fmtTime(r.used) + " von 20:00</p></div>" +
        "</section>" +
        '<h2 class="section-title">Aufgaben ansehen</h2>' +
        '<p class="muted small">Tippe eine Aufgabe an. In der Ansicht kannst du die Teile bewegen und die Lösung ansehen.</p>' +
        '<div class="result-grid">' +
        r.tasks.map((t, i) => {
          const a = r.answers[i];
          const state = a == null ? "open" : a === t.correct ? "ok" : "bad";
          const label = state === "ok" ? "richtig" : state === "bad" ? "falsch" : "offen";
          return '<button type="button" class="result-tile is-' + state + '" data-review="' + i + '">' +
            '<span class="num">' + (i + 1) + "</span>" + shapeSvg(t.key) +
            '<span class="state">' + label + "</span></button>";
        }).join("") +
        "</div>" +
        '<div class="sim-nav"><button class="btn" type="button" data-act="home">Zur Übersicht</button>' +
        '<button class="btn primary" type="button" data-act="again">Neue Simulation</button></div>' +
        "</main>";

      root.onclick = (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        if (btn.hasAttribute("data-review")) review(r, Number(btn.getAttribute("data-review")));
        else if (btn.getAttribute("data-act") === "home") app.go("home");
        else if (btn.getAttribute("data-act") === "again") app.go("figuren-sim");
      };
    }

    function review(r, i) {
      const task = r.tasks[i];
      const chosen = r.answers[i];
      root.innerHTML =
        topbar("Auswertung", "Aufgabe " + (i + 1) + " von " + SIM_COUNT, "") +
        '<main class="screen">' +
        '<section class="board-card"><div class="board-wrap" id="board"></div>' +
        '<p class="board-hint" id="hint">' + HINT_DEFAULT + "</p></section>" +
        chipsHtml({ angles: reviewAngles }) +
        toolsHtml() +
        '<section class="question"><h2>Deine Antwort</h2><div class="options" id="options"></div></section>' +
        '<div class="feedback ' + (chosen === task.correct ? "is-ok" : "is-bad") + '" role="status">' +
        "<strong>" + (chosen == null ? "Nicht beantwortet." : chosen === task.correct ? "Richtig." : "Falsch.") + "</strong> " +
        "Lösung: " + correctText(task) + '.<p class="angle-hint">' + angleHint(task) + "</p></div>" +
        '<div class="sim-nav"><button class="btn" type="button" data-act="results">Zur Auswertung</button>' +
        (i < SIM_COUNT - 1 ? '<button class="btn primary" type="button" data-act="next-review">Nächste Aufgabe</button>' : "") +
        "</div></main>";
      if (board) board.destroy();
      board = MT.createFigurenBoard(root.querySelector("#board"), task, {
        interactive: true,
        snap: true,
        showAngles: reviewAngles,
        onComplete: () => {
          const h = root.querySelector("#hint");
          if (h) { h.textContent = "Zusammengesetzt."; h.className = "board-hint is-ok"; }
        },
      });
      root.querySelector("#options").innerHTML = optionsHtml(task);
      markOptions(root, task, chosen);
      root.onclick = (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        const act = btn.getAttribute("data-act");
        if (act === "results" || act === "home") {
          if (board) { board.destroy(); board = null; }
          results(r);
        } else if (act === "next-review") review(r, i + 1);
        else if (act === "rotl" || act === "rotr") board.rotateSelected(act === "rotl" ? -15 : 15);
        else if (act === "shuffle") board.reshuffle();
        else if (act === "solve") board.showSolution();
        else if (act === "angles") {
          reviewAngles = !reviewAngles;
          btn.setAttribute("aria-pressed", reviewAngles ? "true" : "false");
          board.setShowAngles(reviewAngles);
        } else if (act === "tips") app.sheet("Winkel und Ecken erkennen", tipsHtml());
      };
      window.scrollTo(0, 0);
    }

    root.addEventListener("click", onClick);
    renderTask();
    timer = setInterval(tick, 500);

    return {
      destroy() {
        clearInterval(timer);
        root.removeEventListener("click", onClick);
        root.onclick = null;
        if (board) board.destroy();
      },
    };
  }

  MT.figurenViews = { practice, simulation, shapeSvg, tipsHtml };
})();
