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
      ready: true,
    },
    {
      id: "gedaechtnis",
      title: "Gedächtnis und Merkfähigkeit",
      format: "8 Allergieausweise",
      text: "Ausweise einprägen und nach einer Pause Fragen zu Namen, Blutgruppe, Allergien und mehr beantworten.",
      ready: false,
    },
    {
      id: "zahlenfolgen",
      title: "Zahlenfolgen",
      format: "Regel finden, Folge ergänzen",
      text: "Die Regel hinter einer Zahlenfolge erkennen und die zwei fehlenden Zahlen bestimmen.",
      ready: false,
    },
    {
      id: "wortfluessigkeit",
      title: "Wortflüssigkeit",
      format: "Buchstabensalat",
      text: "Aus vertauschten Buchstaben das Wort erkennen und seinen Anfangsbuchstaben wählen.",
      ready: false,
    },
    {
      id: "implikationen",
      title: "Implikationen erkennen",
      format: "Logische Schlüsse",
      text: "Aus zwei Aussagen ableiten, welche Schlussfolgerung zwingend stimmt.",
      ready: false,
    },
  ];

  const ROUTES = {
    home: homeView,
    "figuren-uebung": (root, app) => MT.figurenViews.practice(root, app),
    "figuren-sim": (root, app) => MT.figurenViews.simulation(root, app),
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

  function pct(s) {
    return s.total ? Math.round((s.correct / s.total) * 100) + " %" : "–";
  }

  function homeView(root) {
    const s = MT.stats.load("figuren");
    const preview = MT.figurenViews.shapeSvg("sechseck");
    root.innerHTML =
      '<header class="home-head">' +
      '<div class="brand"><span class="brand-mark" aria-hidden="true">' + brandMark() + "</span>" +
      "<div><h1>KFF Trainer</h1><p>Übungen für den kognitiven Teil des MedAT</p></div></div>" +
      "</header>" +
      '<main class="screen">' +
      '<section class="stat-row" aria-label="Deine Statistik">' +
      '<div class="stat"><span class="stat-val">' + s.dayCount + '</span><span class="stat-label">Heute gelöst</span></div>' +
      '<div class="stat"><span class="stat-val">' + pct(s) + '</span><span class="stat-label">Trefferquote</span></div>' +
      '<div class="stat"><span class="stat-val">' + (s.bestSim == null ? "–" : s.bestSim + "/15") + '</span><span class="stat-label">Beste Simulation</span></div>' +
      "</section>" +
      '<h2 class="section-title">Untertests</h2>' +
      '<div class="modules">' +
      MODULES.map((m) =>
        '<article class="module' + (m.ready ? " is-ready" : "") + '">' +
        (m.ready ? '<div class="module-art" aria-hidden="true">' + preview + "</div>" : "") +
        '<div class="module-body">' +
        '<div class="module-top"><h3>' + m.title + "</h3>" + (m.ready ? "" : '<span class="soon">Kommt bald</span>') + "</div>" +
        '<p class="module-format">' + m.format + "</p>" +
        '<p class="module-text">' + m.text + "</p>" +
        (m.ready
          ? '<div class="module-actions"><a class="btn primary" href="#figuren-uebung" data-go="figuren-uebung">Üben</a>' +
            '<a class="btn" href="#figuren-sim" data-go="figuren-sim">Simulation</a></div>'
          : "") +
        "</div></article>"
      ).join("") +
      "</div>" +
      '<p class="footnote">Unabhängiges Übungsprojekt. Nicht offiziell und nicht mit den Medizinischen Universitäten oder dem MedAT verbunden. Deine Ergebnisse werden nur auf diesem Gerät gespeichert.</p>' +
      "</main>";
    root.addEventListener("click", (e) => {
      const a = e.target.closest("[data-go]");
      if (!a) return;
      e.preventDefault();
      go(a.getAttribute("data-go"));
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
