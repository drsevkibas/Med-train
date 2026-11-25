/* App-Rahmen: Übersicht, Detailseiten der Untertests, Navigation, Dialog. */
(function () {
  "use strict";
  const MT = (window.MT = window.MT || {});

  const ICONS = {
    figuren: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9z"/><path d="M12 3v9l7.8 4.5M12 12l-7.8 4.5"/></svg>',
    gedaechtnis: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="8.5" cy="10.5" r="2"/><path d="M5.5 16c.6-1.8 1.7-2.6 3-2.6s2.4.8 3 2.6M14.5 10h4M14.5 14h3"/></svg>',
    zahlenfolgen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17l5-5 3.5 3.5L20 8"/><path d="M15 8h5v5"/></svg>',
    wortfluessigkeit: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="8" height="12" rx="2"/><rect x="13" y="6" width="8" height="12" rx="2"/><path d="M5.5 15l1.5-6 1.5 6M6 13.2h2M15.5 9h1.8a1.5 1.5 0 0 1 0 3h-1.8zm0 3h2.1a1.5 1.5 0 0 1 0 3h-2.1z"/></svg>',
    implikationen: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="12" r="5.5"/><circle cx="15" cy="12" r="5.5"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10-6.5z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    bulb: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  };

  const MODULES = [
    {
      id: "figuren",
      simTotal: 15,
      title: "Figuren zusammensetzen",
      short: "Figuren",
      format: "15 Aufgaben · 20 Min.",
      text: "Aus mehreren Einzelteilen die richtige Gesamtfigur erkennen. Im Übungsmodus kannst du die Teile verschieben und drehen, um die Lösung nachzuvollziehen.",
      practice: { route: "figuren-uebung", note: "Teile bewegen, Winkel anzeigen, mit Lösung" },
      tips: { title: "Winkel und Ecken erkennen", note: "So unterscheidest du 5-, 6-, 7- und 8-Ecke", html: () => MT.figurenViews.tipsHtml() },
      sim: { route: "figuren-sim", note: "15 Aufgaben in 20 Minuten, Teile fix" },
    },
    {
      id: "gedaechtnis",
      title: "Gedächtnis und Merkfähigkeit",
      short: "Allergieausweise",
      format: "8 Ausweise · Abfrage später",
      text: "Acht Allergieausweise einprägen und danach Fragen zu Foto, Name, Geburtstag, Medikamenten, Blutgruppe, Allergien, Nummer und Land beantworten.",
      direct: "gedaechtnis",
    },
    {
      id: "zahlenfolgen",
      simTotal: 10,
      title: "Zahlenfolgen",
      short: "Zahlenfolgen",
      format: "10 Aufgaben · 15 Min.",
      text: "Die Regel hinter einer Zahlenfolge erkennen und die beiden fehlenden Zahlen am Ende bestimmen.",
      practice: { route: "zahlen-uebung", note: "Unbegrenzt, mit Rechenweg" },
      sim: { route: "zahlen-sim", note: "10 Aufgaben in 15 Minuten" },
    },
    {
      id: "wortfluessigkeit",
      simTotal: 15,
      title: "Wortflüssigkeit",
      short: "Wortflüssigkeit",
      format: "15 Aufgaben · 20 Min.",
      text: "Aus vertauschten Buchstaben das gesuchte Hauptwort erkennen und seinen Anfangsbuchstaben wählen.",
      practice: { route: "wort-uebung", note: "Unbegrenzt, mit Lösungswort" },
      sim: { route: "wort-sim", note: "15 Aufgaben in 20 Minuten" },
    },
    {
      id: "implikationen",
      simTotal: 10,
      title: "Implikationen erkennen",
      short: "Implikationen",
      format: "10 Aufgaben · 10 Min.",
      text: "Aus zwei Aussagen ableiten, welche Schlussfolgerung zwingend richtig ist.",
      practice: { route: "impl-uebung", note: "Unbegrenzt, mit Begründung" },
      sim: { route: "impl-sim", note: "10 Aufgaben in 10 Minuten" },
    },
  ];
  const byId = Object.fromEntries(MODULES.map((m) => [m.id, m]));

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
  // Detailseiten
  const PARENT = {};
  for (const m of MODULES) {
    if (m.direct) continue;
    ROUTES["modul-" + m.id] = (root) => moduleView(root, m);
    PARENT[m.practice.route] = "modul-" + m.id;
    PARENT[m.sim.route] = "modul-" + m.id;
  }

  const appEl = document.getElementById("app");
  let current = null;
  let currentName = null;

  function go(name, opts) {
    // „Zurück“ aus Übung/Simulation führt zur Detailseite des Untertests
    if (name === "home" && !(opts && opts.fromHash) && PARENT[currentName]) name = PARENT[currentName];
    if (!ROUTES[name]) name = "home";
    if (current && current.destroy) current.destroy();
    const view = document.createElement("div");
    view.className = "view";
    appEl.replaceChildren(view);
    currentName = name;
    document.body.classList.toggle("is-home", name === "home");
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

  /** Blatt von unten mit Inhalt (z. B. Tipps). */
  function sheet(title, html) {
    const wrap = document.createElement("div");
    wrap.className = "sheet-backdrop";
    wrap.innerHTML =
      '<section class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">' +
      '<header class="sheet-head"><h2 id="sheet-title"></h2>' +
      '<button type="button" class="sheet-close" data-close aria-label="Schließen">Fertig</button></header>' +
      '<div class="sheet-body">' + html + "</div></section>";
    wrap.querySelector("#sheet-title").textContent = title;
    function close() {
      wrap.remove();
      document.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("no-scroll");
    }
    function onKey(e) { if (e.key === "Escape") close(); }
    wrap.addEventListener("click", (e) => {
      if (e.target === wrap || e.target.closest("[data-close]")) close();
    });
    document.addEventListener("keydown", onKey);
    document.documentElement.classList.add("no-scroll");
    document.body.append(wrap);
    wrap.querySelector(".sheet-close").focus();
  }

  const app = { go, confirm: confirmDialog, sheet };

  /* ---------- Helfer ---------- */
  const rate = (s) => (s.total ? s.correct / s.total : null);
  const pctText = (v) => (v == null ? "–" : Math.round(v * 100) + " %");

  function daysUntil(iso) {
    if (!iso) return null;
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) return null;
    const now = new Date();
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((Date.UTC(y, m - 1, d) - today) / 86400000);
  }

  function fmtDate(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    const months = ["Jänner", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
    return d + ". " + months[m - 1] + " " + y;
  }

  function examRow() {
    const iso = MT.store.get("exam.date", "");
    const days = daysUntil(iso);
    let main, sub;
    if (days == null) { main = "Testtermin festlegen"; sub = "Dann siehst du, wie viele Tage bleiben."; }
    else if (days > 1) { main = days + " Tage bis zum Test"; sub = fmtDate(iso); }
    else if (days === 1) { main = "Morgen ist Testtag"; sub = fmtDate(iso); }
    else if (days === 0) { main = "Heute ist Testtag"; sub = "Viel Erfolg!"; }
    else { main = "Testtermin vorbei"; sub = fmtDate(iso); }
    return (
      '<label class="exam-row" id="exam-row">' +
      '<span class="exam-icon">' + ICONS.calendar + "</span>" +
      '<span class="exam-text"><span class="exam-main">' + main + '</span><span class="exam-sub">' + sub + "</span></span>" +
      '<span class="exam-action">' + (iso ? "Ändern" : "Festlegen") + "</span>" +
      '<input type="date" id="exam-date" aria-label="Testtermin" value="' + (iso || "") + '">' +
      "</label>"
    );
  }

  function brandMark() {
    return (
      '<svg viewBox="0 0 48 48" aria-hidden="true"><polygon class="bm-a" points="24,4 41.3,14 41.3,24 24,24 6.7,24 6.7,14"/>' +
      '<polygon class="bm-b" points="6.7,24 24,24 24,44 6.7,34"/>' +
      '<polygon class="bm-c" points="27,27 44.3,27 44.3,37 27,47"/></svg>'
    );
  }

  function bindGo(root) {
    root.addEventListener("click", (e) => {
      const a = e.target.closest("[data-go]");
      if (!a) return;
      e.preventDefault();
      go(a.getAttribute("data-go"));
    });
  }

  /* ---------- Übersicht ---------- */
  function homeView(root) {
    const all = MODULES.map((m) => MT.stats.load(m.id));
    const sum = (k) => all.reduce((n, s) => n + s[k], 0);
    const overall = sum("total") ? sum("correct") / sum("total") : null;
    const pending = MT.gedaechtnis.hasPending();

    root.innerHTML =
      '<header class="app-header">' +
      '<div class="app-header-inner">' +
      '<div class="brand"><span class="brand-mark">' + brandMark() + '</span><span class="brand-name">KFF Trainer</span></div>' +
      '<h1 class="app-title">Dein Training</h1>' +
      '<p class="app-sub">MedAT · Kognitive Fähigkeiten und Fertigkeiten</p>' +
      '<section class="summary" aria-label="Deine Statistik">' +
      '<div class="summary-stats">' +
      '<div class="kpi"><span class="kpi-val">' + sum("dayCount") + '</span><span class="kpi-label">Heute gelöst</span></div>' +
      '<div class="kpi"><span class="kpi-val">' + pctText(overall) + '</span><span class="kpi-label">Trefferquote</span></div>' +
      '<div class="kpi"><span class="kpi-val">' + sum("total") + '</span><span class="kpi-label">Gesamt</span></div>' +
      "</div>" +
      examRow() +
      "</section>" +
      "</div></header>" +
      '<main class="screen">' +
      (pending
        ? '<a class="notice" href="#gedaechtnis" data-go="gedaechtnis">' +
          '<span class="notice-dot" aria-hidden="true"></span>' +
          '<span class="notice-text"><strong>Abfrage bereit</strong><span>Allergieausweise, gelernt um ' + MT.gedaechtnis.pendingTime() + " Uhr</span></span>" +
          '<span class="cell-chevron">' + ICONS.chevron + "</span></a>"
        : "") +
      '<h2 class="section-title">Untertests</h2>' +
      '<nav class="list" aria-label="Untertests">' +
      MODULES.map((m, i) => {
        const s = all[i];
        const r = rate(s);
        const target = m.direct || "modul-" + m.id;
        return '<a class="cell" href="#' + target + '" data-go="' + target + '">' +
          '<span class="cell-icon">' + ICONS[m.id] + "</span>" +
          '<span class="cell-body"><span class="cell-title">' + m.title + "</span>" +
          '<span class="cell-meta">' + m.format + "</span>" +
          '<span class="progress" aria-hidden="true"><span style="width:' + (r == null ? 0 : Math.round(r * 100)) + '%"></span></span>' +
          "</span>" +
          '<span class="cell-side"><span class="cell-rate">' + pctText(r) + "</span>" +
          '<span class="cell-count">' + (s.total ? s.total + " gelöst" : "neu") + "</span></span>" +
          '<span class="cell-chevron">' + ICONS.chevron + "</span></a>";
      }).join("") +
      "</nav>" +
      '<p class="footnote">Aufgabenanzahl und Zeiten orientieren sich am bisherigen MedAT-Format. Prüfe das aktuelle Format auf der offiziellen MedAT-Seite. ' +
      "Unabhängiges Übungsprojekt, nicht mit den Medizinischen Universitäten verbunden. Deine Ergebnisse bleiben auf diesem Gerät.</p>" +
      "</main>";

    bindGo(root);
    root.addEventListener("change", (e) => {
      if (e.target.id !== "exam-date") return;
      MT.store.set("exam.date", e.target.value || "");
      const row = root.querySelector("#exam-row");
      if (row) row.outerHTML = examRow();
    });
    return null;
  }

  /* ---------- Detailseite eines Untertests ---------- */
  function moduleView(root, m) {
    const s = MT.stats.load(m.id);
    root.innerHTML =
      '<header class="topbar">' +
      '<button class="icon-btn" type="button" data-go="home" aria-label="Zur Übersicht">' + ICONS.back + "</button>" +
      '<div class="topbar-title"><span class="eyebrow">Untertest</span><h1>' + m.short + "</h1></div><div></div></header>" +
      '<main class="screen">' +
      '<section class="detail-head">' +
      '<span class="detail-icon">' + ICONS[m.id] + "</span>" +
      '<h2 class="detail-title">' + m.title + "</h2>" +
      '<p class="detail-text">' + m.text + "</p>" +
      "</section>" +
      '<section class="kpi-row" aria-label="Statistik">' +
      '<div class="kpi-card"><span class="kpi-val">' + s.total + '</span><span class="kpi-label">gelöst</span></div>' +
      '<div class="kpi-card"><span class="kpi-val">' + pctText(rate(s)) + '</span><span class="kpi-label">Trefferquote</span></div>' +
      '<div class="kpi-card"><span class="kpi-val">' + (s.bestSim == null ? "–" : s.bestSim + "/" + m.simTotal) + '</span><span class="kpi-label">beste Simulation</span></div>' +
      "</section>" +
      '<div class="mode-list">' +
      '<a class="mode is-primary" href="#' + m.practice.route + '" data-go="' + m.practice.route + '">' +
      '<span class="mode-icon">' + ICONS.play + "</span>" +
      '<span class="mode-body"><span class="mode-title">Übungsmodus</span><span class="mode-note">' + m.practice.note + "</span></span>" +
      '<span class="cell-chevron">' + ICONS.chevron + "</span></a>" +
      '<a class="mode" href="#' + m.sim.route + '" data-go="' + m.sim.route + '">' +
      '<span class="mode-icon">' + ICONS.clock + "</span>" +
      '<span class="mode-body"><span class="mode-title">Prüfungssimulation</span><span class="mode-note">' + m.sim.note + "</span></span>" +
      '<span class="cell-chevron">' + ICONS.chevron + "</span></a>" +
      (m.tips
        ? '<button type="button" class="mode" data-act="tips">' +
          '<span class="mode-icon">' + ICONS.bulb + "</span>" +
          '<span class="mode-body"><span class="mode-title">Tipps und Strategie</span><span class="mode-note">' + m.tips.note + "</span></span>" +
          '<span class="cell-chevron">' + ICONS.chevron + "</span></button>"
        : "") +
      "</div>" +
      "</main>";
    bindGo(root);
    root.addEventListener("click", (e) => {
      if (e.target.closest('[data-act="tips"]') && m.tips) sheet(m.tips.title, m.tips.html());
    });
    return null;
  }

  MT.ICONS = ICONS;

  window.addEventListener("hashchange", () => {
    const name = location.hash.replace(/^#/, "") || "home";
    go(name, { fromHash: true });
  });

  go(location.hash.replace(/^#/, "") || "home", { fromHash: true });
})();
