/* Gemeinsamer Ablauf für Multiple-Choice-Untertests:
   Übungsmodus (sofortige Rückmeldung) und Simulation (Zeitlimit, Auswertung).

   Ein Modul liefert:
   { id, title, simCount, simSeconds, layout: "list" | "grid",
     make(): { prompt, options: [html...], correct, explain } }
   prompt, options und explain sind HTML-Strings (damit Aufgaben speicherbar sind). */
(function () {
  "use strict";
  const MT = (window.MT = window.MT || {});
  const LETTERS = "ABCDEFGH";

  const BACK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';

  function topbar(eyebrow, title, metaHtml) {
    return (
      '<header class="topbar">' +
      '<button class="icon-btn" type="button" data-act="home" aria-label="Zurück">' + BACK + "</button>" +
      '<div class="topbar-title"><span class="eyebrow">' + eyebrow + "</span><h1>" + title + "</h1></div>" +
      '<div class="topbar-meta" id="meta">' + (metaHtml || "") + "</div></header>"
    );
  }

  function fmtTime(sec) {
    sec = Math.max(0, Math.round(sec));
    return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
  }

  function optionsHtml(task, layout) {
    return (
      '<div class="choices ' + ((task.layout || layout) === "grid" ? "is-grid" : "is-list") + '">' +
      task.options.map((html, i) =>
        '<button type="button" class="choice" data-opt="' + i + '">' +
        '<span class="choice-letter">' + LETTERS[i] + "</span>" +
        '<span class="choice-body">' + html + "</span></button>"
      ).join("") +
      "</div>"
    );
  }

  function markOptions(root, task, chosen) {
    root.querySelectorAll(".choice").forEach((b) => {
      const i = Number(b.getAttribute("data-opt"));
      b.disabled = true;
      b.classList.toggle("is-correct", i === task.correct);
      b.classList.toggle("is-wrong", i === chosen && chosen !== task.correct);
      b.classList.toggle("is-chosen", i === chosen);
    });
  }

  function verdict(task, chosen) {
    if (chosen == null) return "Nicht beantwortet.";
    return chosen === task.correct ? "Richtig." : "Leider falsch.";
  }

  function feedbackHtml(task, chosen) {
    const ok = chosen === task.correct;
    return (
      '<div class="feedback ' + (ok ? "is-ok" : "is-bad") + '" role="status" aria-live="polite">' +
      "<strong>" + verdict(task, chosen) + "</strong> Richtig ist " + LETTERS[task.correct] + "." +
      (task.explain ? '<div class="explain">' + task.explain + "</div>" : "") +
      "</div>"
    );
  }

  /* ===================== Übungsmodus ===================== */
  function practice(root, app, mod) {
    let task, answered;
    const session = { done: 0, correct: 0 };

    root.innerHTML =
      topbar("Übungsmodus", mod.title, "") +
      '<main class="screen">' +
      '<section class="prompt-card" id="prompt"></section>' +
      '<section id="options"></section>' +
      '<div id="feedback"></div>' +
      '<button class="btn primary wide" type="button" data-act="next">Nächste Aufgabe</button>' +
      "</main>";
    const $ = (s) => root.querySelector(s);

    function next() {
      task = mod.make();
      answered = false;
      $("#prompt").innerHTML = task.prompt;
      $("#options").innerHTML = optionsHtml(task, mod.layout);
      $("#feedback").innerHTML = "";
      $("#meta").innerHTML = session.done ? '<span class="pill">' + session.correct + "/" + session.done + " richtig</span>" : "";
    }

    root.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn || !root.contains(btn)) return;
      const act = btn.getAttribute("data-act");
      if (btn.hasAttribute("data-opt")) {
        if (answered) return;
        answered = true;
        const i = Number(btn.getAttribute("data-opt"));
        const ok = i === task.correct;
        session.done++;
        if (ok) session.correct++;
        MT.stats.record(mod.id, ok);
        markOptions(root, task, i);
        $("#feedback").innerHTML = feedbackHtml(task, i);
        $("#meta").innerHTML = '<span class="pill">' + session.correct + "/" + session.done + " richtig</span>";
      } else if (act === "next") {
        next();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (act === "home") {
        app.go("home");
      }
    });

    next();
    return null;
  }

  /* ===================== Simulation ===================== */
  /**
   * opts: { tasks?, seconds?, eyebrow?, onFinish?(result), resultExtra?, againRoute? }
   */
  function simulation(root, app, mod, opts) {
    opts = opts || {};
    const tasks = opts.tasks || Array.from({ length: mod.simCount }, () => mod.make());
    const N = tasks.length;
    const seconds = opts.seconds || mod.simSeconds;
    const answers = new Array(N).fill(null);
    const startedAt = Date.now();
    const endAt = startedAt + seconds * 1000;
    let idx = 0;
    let finished = false;
    let timer = null;

    const remaining = () => (endAt - Date.now()) / 1000;

    function renderTask() {
      const task = tasks[idx];
      root.innerHTML =
        topbar(opts.eyebrow || "Simulation", "Aufgabe " + (idx + 1) + " von " + N,
          '<span class="timer" id="timer">' + fmtTime(remaining()) + "</span>") +
        '<main class="screen">' +
        '<nav class="dots" aria-label="Aufgaben">' +
        tasks.map((_, i) =>
          '<button type="button" class="dot' + (i === idx ? " is-current" : "") + (answers[i] != null ? " is-answered" : "") +
          '" data-goto="' + i + '" aria-label="Aufgabe ' + (i + 1) + '">' + (i + 1) + "</button>"
        ).join("") +
        "</nav>" +
        '<section class="prompt-card">' + task.prompt + "</section>" +
        optionsHtml(task, mod.layout) +
        '<div class="sim-nav">' +
        '<button class="btn" type="button" data-act="prev"' + (idx === 0 ? " disabled" : "") + ">Zurück</button>" +
        (idx < N - 1
          ? '<button class="btn primary" type="button" data-act="next">Weiter</button>'
          : '<button class="btn primary" type="button" data-act="submit">Abgeben</button>') +
        "</div>" +
        '<button class="btn ghost wide" type="button" data-act="submit">Test abgeben</button>' +
        "</main>";
      markChosen();
    }

    function markChosen() {
      root.querySelectorAll(".choice").forEach((b) => {
        const on = Number(b.getAttribute("data-opt")) === answers[idx];
        b.classList.toggle("is-chosen", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      const dot = root.querySelector('[data-goto="' + idx + '"]');
      if (dot) dot.classList.toggle("is-answered", answers[idx] != null);
    }

    function tick() {
      const left = remaining();
      const t = root.querySelector("#timer");
      if (t) {
        t.textContent = fmtTime(left);
        t.classList.toggle("is-low", left < 60);
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
        MT.stats.record(mod.id, ok);
      });
      MT.stats.recordSim(mod.id, score);
      const result = { tasks, answers, score, used: Math.min(seconds, (Date.now() - startedAt) / 1000), timeUp };
      if (opts.onFinish) opts.onFinish(result);
      results(result);
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
      } else if (act === "next" && idx < N - 1) {
        idx++;
        renderTask();
      } else if (act === "submit") {
        submit();
      } else if (act === "home") {
        app.confirm("Test abbrechen?", "Deine Antworten in diesem Durchgang gehen verloren.", "Abbrechen", "Weitermachen")
          .then((ok) => { if (ok) app.go("home"); });
      }
    }

    function results(r) {
      root.removeEventListener("click", onClick);
      const pct = Math.round((r.score / N) * 100);
      root.innerHTML =
        topbar((opts.eyebrow || "Simulation") + " · Auswertung", mod.title, "") +
        '<main class="screen">' +
        '<section class="result-head">' +
        '<div class="result-score"><span class="big">' + r.score + "</span><span>von " + N + "</span></div>" +
        '<div><p class="result-line">' + pct + " % richtig</p>" +
        '<p class="muted">' + (r.timeUp ? "Zeit abgelaufen. " : "") + "Benötigte Zeit: " + fmtTime(r.used) + " von " + fmtTime(seconds) + "</p></div>" +
        "</section>" +
        (opts.resultExtra || "") +
        '<h2 class="section-title">Aufgaben ansehen</h2>' +
        '<div class="result-grid is-numbers">' +
        r.tasks.map((t, i) => {
          const a = r.answers[i];
          const state = a == null ? "open" : a === t.correct ? "ok" : "bad";
          const label = state === "ok" ? "richtig" : state === "bad" ? "falsch" : "offen";
          return '<button type="button" class="result-tile is-' + state + '" data-review="' + i + '">' +
            '<span class="num">' + (i + 1) + '</span><span class="state">' + label + "</span></button>";
        }).join("") +
        "</div>" +
        '<div class="sim-nav"><button class="btn" type="button" data-act="home">Zur Übersicht</button>' +
        '<button class="btn primary" type="button" data-act="again">Nochmal</button></div>' +
        "</main>";
      root.onclick = (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        if (btn.hasAttribute("data-review")) review(r, Number(btn.getAttribute("data-review")));
        else if (btn.getAttribute("data-act") === "home") app.go("home");
        else if (btn.getAttribute("data-act") === "again") app.go(opts.againRoute || "home");
      };
      window.scrollTo(0, 0);
    }

    function review(r, i) {
      const task = r.tasks[i];
      root.innerHTML =
        topbar("Auswertung", "Aufgabe " + (i + 1) + " von " + N, "") +
        '<main class="screen">' +
        '<section class="prompt-card">' + task.prompt + "</section>" +
        optionsHtml(task, mod.layout) +
        feedbackHtml(task, r.answers[i]) +
        '<div class="sim-nav"><button class="btn" type="button" data-act="results">Zur Auswertung</button>' +
        (i < N - 1 ? '<button class="btn primary" type="button" data-act="next-review">Nächste Aufgabe</button>' : "") +
        "</div></main>";
      markOptions(root, task, r.answers[i]);
      root.onclick = (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        const act = btn.getAttribute("data-act");
        if (act === "results" || act === "home") results(r);
        else if (act === "next-review") review(r, i + 1);
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
      },
    };
  }

  // kleine Helfer für die Module
  const util = {
    rand: (a, b) => a + Math.random() * (b - a),
    randInt: (a, b) => a + Math.floor(Math.random() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    esc: (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])),
    /**
     * Baut Antworten A–D + E ("keine"). distractors: mind. 4 eindeutige Werte (ohne correct).
     * Mit Wahrscheinlichkeit pNone ist E richtig.
     */
    withNone(correctHtml, distractors, pNone, noneLabel) {
      const none = Math.random() < (pNone == null ? 0.2 : pNone);
      const pool = util.shuffle(distractors);
      const four = none ? pool.slice(0, 4) : util.shuffle(pool.slice(0, 3).concat([correctHtml]));
      const options = four.concat([noneLabel || "Keine der Antworten ist richtig."]);
      return { options, correct: none ? 4 : four.indexOf(correctHtml) };
    },
  };

  MT.quiz = { practice, simulation, fmtTime, util, LETTERS };
})();
