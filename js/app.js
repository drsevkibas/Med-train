/* App-Rahmen: Übersicht, Navigation, Dialog. */
(function () {
  "use strict";
  const MT = (window.MT = window.MT || {});

  const MODULES = [
    {
      id: "figuren",
      title: "Figuren zusammensetzen",
      format: "15 Aufgaben · 20 Minuten",
      text: "Aus Einzelteilen die richtige Figur erkennen. Im Übungsmodus kannst du die Teile verschieben und drehen.",
      art: () => MT.figurenViews.shapeSvg("sechseck"),
      actions: [["Üben", "figuren-uebung"], ["Simulation", "figuren-sim"]],
    },
    {
      id: "gedaechtnis",
      title: "Gedächtnis und Merkfähigkeit",
      format: "8 Allergieausweise",
      text: "Ausweise einprägen und danach Fragen zu Foto, Name, Blutgruppe, Allergien und mehr beantworten.",
      art: () => '<svg viewBox="0 0 40 40"><rect class="art-line" x="5" y="9" width="30" height="22" rx="3"/><circle class="art-fill" cx="14" cy="18" r="3.5"/><path class="art-fill" d="M8.5 27c.8-3.2 3-4.6 5.5-4.6s4.7 1.4 5.5 4.6z"/><path class="art-line" d="M23 16h8M23 21h8M23 26h5"/></svg>',
      actions: [["Starten", "gedaechtnis"]],
    },
    {
      id: "zahlenfolgen",
      title: "Zahlenfolgen",
      format: "10 Aufgaben · 15 Minuten",
      text: "Die Regel hinter einer Zahlenfolge erkennen und die zwei fehlenden Zahlen bestimmen.",
      art: () => '<span class="art-text">2·4·8</span>',
      actions: [["Üben", "zahlen-uebung"], ["Simulation", "zahlen-sim"]],
    },
    {
      id: "wortfluessigkeit",
      title: "Wortflüssigkeit",
      format: "15 Aufgaben · 20 Minuten",
      text: "Aus vertauschten Buchstaben das Wort erkennen und seinen Anfangsbuchstaben wählen.",
      art: () => '<span class="art-text">ZTSRE</span>',
      actions: [["Üben", "wort-uebung"], ["Simulation", "wort-sim"]],
    },
    {
      id: "implikationen",
      title: "Implikationen erkennen",
      format: "10 Aufgaben · 10 Minuten",
      text: "Aus zwei Aussagen ableiten, welche Schlussfolgerung zwingend stimmt.",
      art: () => '<span class="art-text is-big">⇒</span>',
      actions: [["Üben", "impl-uebung"], ["Simulation", "impl-sim"]],
    },
  ];

  const ROUTES = {
    home: homeView,
    "figuren-uebung": (root, app) => MT.figurenViews.practice(root, app),
    "figuren-sim": (root, app) => MT.figurenViews.simulation(root, app),
    gedaechtnis: (root, app) => MT.gedaechtnis.setup(root, app),
    "zahlen-uebung": (root, app) => MT.quiz.practice(root, app, MT.zahlenfolgen),
    "zahlen-sim": (root, app) => MT.quiz.simulation(root, app, MT.zahlenfolgen, { againRoute: "zahlen-sim" }),
    "wort-uebung": (root, app) => MT.quiz.practice(root, app, MT.wortfluessigkeit),
    "wort-sim": (root, app) => MT.quiz.simulation(root, app, MT.wortfluessigkeit, { againRoute: "wort-sim" }),
    "impl-uebung": (root, app) => MT.quiz.practice(root, app, MT.implikationen),
    "impl-sim": (root, app) => MT.quiz.simulation(root, app, MT.implikationen, { againRoute: "impl-sim" }),
  };

  const appEl = document.getElementById("app");
  let current = null;

  function go(name, opts) {
    if (!ROUTES[name]) name = "home";
    if (current && current.destroy) current.destroy();
    const view = document.createElement("div");
    view.className = "view";
    appEl.replaceChildren(view);
    current = ROUTES[name](view, app) || null;
    window.scrollTo(0, 0);
    const hash = name === "home" ? "" : "#" + name;
    if (!(opts && opts.fromHash) && location.hash !== hash) {
      try {
        history.replaceState(null, "", hash || location.pathname + location.search);
      } catch (e) {
        /* nicht erlaubt: ignorieren */
      }
    }
  }

  /** Eigener Bestätigungsdialog (kein window.confirm). */
  function confirmDialog(title, text, okLabel, cancelLabel) {
    return new Promise((resolve) => {
      const wrap = document.createElement("div");
      wrap.className = "dialog-backdrop";
      wrap.innerHTML =
        '<div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dlg-title">' +
        '<h2 id="dlg-title"></h2><p></p>' +
        '<div class="dialog-actions"><button class="btn" type="button" data-r="0"></button>' +
        '<button class="btn primary" type="button" data-r="1"></button></div></div>';
      wrap.querySelector("h2").textContent = title;
      wrap.querySelector("p").textContent = text;
      wrap.querySelector('[data-r="0"]').textContent = cancelLabel || "Zurück";
      wrap.querySelector('[data-r="1"]').textContent = okLabel || "OK";
      function close(v) {
        wrap.remove();
        document.removeEventListener("keydown", onKey);
        resolve(v);
      }
      function onKey(e) {
        if (e.key === "Escape") close(false);
      }
      wrap.addEventListener("click", (e) => {
        const b = e.target.closest("[data-r]");
        if (b) close(b.getAttribute("data-r") === "1");
        else if (e.target === wrap) close(false);
      });
      document.addEventListener("keydown", onKey);
      document.body.append(wrap);
      wrap.querySelector('[data-r="1"]').focus();
    });
  }

  const app = { go, confirm: confirmDialog };

  function pct(correct, total) {
    return total ? Math.round((correct / total) * 100) + " %" : "–";
  }

  function ring(value) {
    // Fortschrittsring für die Trefferquote (0..1, oder null = noch nichts geübt)
    const r = 15, c = 2 * Math.PI * r;
    const v = value == null ? 0 : Math.max(0, Math.min(1, value));
    return '<svg class="ring" viewBox="0 0 40 40" aria-hidden="true">' +
      '<circle class="ring-track" cx="20" cy="20" r="' + r + '"/>' +
      '<circle class="ring-val" cx="20" cy="20" r="' + r + '" stroke-dasharray="' + (v * c).toFixed(1) + " " + c.toFixed(1) + '"/>' +
      "</svg>";
  }

  function daysUntil(iso) {
    if (!iso) return null;
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) return null;
    const now = new Date();
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((Date.UTC(y, m - 1, d) - today) / 86400000);
  }

  function countdownHtml() {
    const iso = MT.store.get("exam.date", "");
    const days = daysUntil(iso);
    let text;
    if (days == null) text = "Trag dein Testdatum ein, dann zählen wir mit.";
    else if (days > 1) text = "Noch <strong>" + days + "</strong> Tage bis zum Test.";
    else if (days === 1) text = "<strong>Morgen</strong> ist Testtag. Viel Erfolg!";
    else if (days === 0) text = "<strong>Heute</strong> ist Testtag. Viel Erfolg!";
    else text = "Dein Testdatum liegt in der Vergangenheit.";
    return (
      '<div class="countdown">' +
      '<span class="countdown-text">' + text + "</span>" +
      '<label class="countdown-edit"><span class="sr-only">Testdatum</span>' +
      '<input type="date" id="exam-date" value="' + (iso || "") + '">' +
      "<span aria-hidden=\"true\">" + (iso ? "Ändern" : "Datum") + "</span></label>" +
      "</div>"
    );
  }

  function greeting() {
    const h = new Date().getHours();
    return h < 11 ? "Guten Morgen." : h < 18 ? "Schön, dass du da bist." : "Guten Abend.";
  }

  function homeView(root) {
    const all = MODULES.map((m) => MT.stats.load(m.id));
    const sum = (k) => all.reduce((n, s) => n + s[k], 0);
    const pending = MT.gedaechtnis.hasPending();
    root.innerHTML =
      '<header class="home-head">' +
      '<div class="brand"><span class="brand-mark" aria-hidden="true">' + brandMark() + "</span>" +
      '<span class="brand-name">KFF Trainer</span></div>' +
      "</header>" +
      '<section class="hero">' +
      '<p class="hero-eyebrow">' + greeting() + "</p>" +
      '<h1 class="hero-title">Trainiere den <mark>kognitiven Teil</mark> des MedAT.</h1>' +
      countdownHtml() +
      "</section>" +
      '<main class="screen">' +
      (pending
        ? '<section class="notice"><div><strong>Abfrage wartet.</strong> Du hast um ' + MT.gedaechtnis.pendingTime() +
          " Uhr Allergieausweise gelernt.</div>" +
          '<a class="btn primary" href="#gedaechtnis" data-go="gedaechtnis">Zur Abfrage</a></section>'
        : "") +
      '<section class="stat-row" aria-label="Deine Statistik">' +
      '<div class="stat"><span class="stat-val">' + sum("dayCount") + '</span><span class="stat-label">heute gelöst</span></div>' +
      '<div class="stat"><span class="stat-val">' + pct(sum("correct"), sum("total")) + '</span><span class="stat-label">Trefferquote</span></div>' +
      '<div class="stat"><span class="stat-val">' + sum("total") + '</span><span class="stat-label">insgesamt</span></div>' +
      "</section>" +
      '<h2 class="section-title">Untertests</h2>' +
      '<div class="modules">' +
      MODULES.map((m, i) => {
        const s = all[i];
        const rate = s.total ? s.correct / s.total : null;
        return '<article class="module">' +
          '<div class="module-head">' +
          '<div class="module-art" aria-hidden="true">' + m.art() + "</div>" +
          '<div class="module-title"><h3>' + m.title + "</h3>" +
          '<p class="module-format">' + m.format + "</p></div>" +
          '<div class="module-ring" title="Trefferquote">' + ring(rate) +
          '<span class="module-ring-val">' + (s.total ? Math.round(rate * 100) : "–") + "</span></div>" +
          "</div>" +
          '<p class="module-text">' + m.text + "</p>" +
          '<div class="module-actions">' +
          m.actions.map((a, k) => '<a class="btn' + (k === 0 ? " primary" : "") + '" href="#' + a[1] + '" data-go="' + a[1] + '">' + a[0] + "</a>").join("") +
          "</div></article>";
      }).join("") +
      "</div>" +
      '<p class="footnote">Aufgabenanzahl und Zeiten orientieren sich am bisherigen MedAT-Format. Prüfe das aktuelle Format auf der offiziellen MedAT-Seite. ' +
      "Unabhängiges Übungsprojekt, nicht offiziell und nicht mit den Medizinischen Universitäten verbunden. Deine Ergebnisse werden nur auf diesem Gerät gespeichert.</p>" +
      "</main>";
    root.addEventListener("click", (e) => {
      const a = e.target.closest("[data-go]");
      if (!a) return;
      e.preventDefault();
      go(a.getAttribute("data-go"));
    });
    root.addEventListener("change", (e) => {
      if (e.target.id !== "exam-date") return;
      MT.store.set("exam.date", e.target.value || "");
      const cd = root.querySelector(".countdown");
      if (cd) cd.outerHTML = countdownHtml();
    });
    return null;
  }

  function brandMark() {
    // Ein Sechseck, in drei Teile geschnitten, ein Teil leicht versetzt
    return (
      '<svg viewBox="0 0 48 48"><polygon class="bm-a" points="24,4 41.3,14 41.3,24 24,24 6.7,24 6.7,14"/>' +
      '<polygon class="bm-b" points="6.7,24 24,24 24,44 6.7,34"/>' +
      '<polygon class="bm-c" points="27,27 44.3,27 44.3,37 27,47"/></svg>'
    );
  }

  window.addEventListener("hashchange", () => {
    const name = location.hash.replace(/^#/, "") || "home";
    go(name, { fromHash: true });
  });

  go(location.hash.replace(/^#/, "") || "home", { fromHash: true });
})();
