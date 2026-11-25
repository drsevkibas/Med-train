/* Gedächtnis und Merkfähigkeit: 8 Allergieausweise einprägen, später Fragen beantworten. */
(function () {
  "use strict";
  const MT = (window.MT = window.MT || {});
  const U = MT.quiz.util;
  const { pick, shuffle, randInt, esc } = U;

  const FIRST_F = ["Anna", "Lena", "Sophie", "Marie", "Laura", "Julia", "Hannah", "Clara", "Emma", "Nina", "Paula", "Theresa", "Valerie", "Miriam", "Selina", "Johanna", "Katrin", "Elif", "Mila", "Ida"];
  const FIRST_M = ["Lukas", "Jonas", "David", "Felix", "Paul", "Elias", "Simon", "Tobias", "Florian", "Matthias", "Moritz", "Jakob", "Leon", "Noah", "Stefan", "Emil", "Fabian", "Daniel", "Oskar", "Valentin"];
  const LAST = ["Huber", "Gruber", "Wagner", "Bauer", "Pichler", "Steiner", "Moser", "Mayer", "Hofer", "Leitner", "Berger", "Fuchs", "Eder", "Fischer", "Schmid", "Winkler", "Weber", "Schwarz", "Maier", "Reiter", "Brunner", "Lang", "Baumgartner", "Auer", "Wolf", "Aigner", "Lechner", "Haas", "Koller", "Wimmer"];
  const COUNTRIES = ["Österreich", "Deutschland", "Schweiz", "Italien", "Ungarn", "Slowenien", "Kroatien", "Tschechien", "Polen", "Frankreich", "Spanien", "Schweden", "Norwegen", "Niederlande", "Belgien", "Portugal", "Griechenland", "Irland", "Dänemark", "Finnland", "Slowakei", "Rumänien"];
  const ALLERGENS = ["Hausstaub", "Birkenpollen", "Gräserpollen", "Erdnüsse", "Haselnüsse", "Laktose", "Gluten", "Penicillin", "Bienengift", "Wespengift", "Katzenhaare", "Hundehaare", "Nickel", "Latex", "Schimmelpilze", "Soja", "Fisch", "Krebstiere", "Hühnerei", "Sellerie", "Senf", "Sesam", "Kiwi", "Erdbeeren", "Aspirin", "Jod"];
  const BLOOD = ["A", "B", "AB", "0"];
  const MONTHS = ["Jänner", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

  /* ---------- gezeichnete Fotos ---------- */
  const SKIN = ["#f5d3b8", "#e9b894", "#d29b72", "#a8714a", "#7a4e31", "#f0c9a6"];
  const HAIR = ["#2b1d14", "#5a3a22", "#a0662f", "#d9b45f", "#8a8a8a", "#b2382a", "#111111"];
  const BG = ["#cfe0f5", "#f4d8d0", "#d6eed8", "#efe6c4", "#e2d6f2", "#d3ecec", "#f1d9e8", "#dcdcdc"];
  const SHIRT = ["#2f45d1", "#c2382d", "#17824f", "#5a6084", "#e08a24", "#6b3fa0", "#1f6f8b", "#333a56"];
  const STYLES = ["kurz", "lang", "dutt", "glatze", "locken", "seitenscheitel", "bob"];

  function makeLook(i, used) {
    for (let t = 0; t < 100; t++) {
      const look = {
        skin: pick(SKIN), hair: pick(HAIR), style: pick(STYLES), bg: BG[i % BG.length], shirt: pick(SHIRT),
        glasses: Math.random() < 0.3, beard: Math.random() < 0.2, earring: Math.random() < 0.2,
      };
      const key = look.style + look.hair + look.glasses + look.beard;
      if (!used.has(key)) { used.add(key); return look; }
    }
    return { skin: SKIN[0], hair: HAIR[0], style: STYLES[i % STYLES.length], bg: BG[i % BG.length], shirt: SHIRT[0] };
  }

  function avatarSvg(l, label) {
    const hairBack = {
      lang: '<path d="M22 50 Q20 20 50 18 Q80 20 78 50 L80 92 L20 92 Z" fill="' + l.hair + '"/>',
      bob: '<path d="M24 52 Q22 20 50 19 Q78 20 76 52 L76 70 L24 70 Z" fill="' + l.hair + '"/>',
      dutt: '<circle cx="50" cy="16" r="10" fill="' + l.hair + '"/>',
    }[l.style] || "";
    const hairFront = {
      kurz: '<path d="M28 44 Q28 22 50 22 Q72 22 72 44 Q66 32 50 32 Q34 32 28 44 Z" fill="' + l.hair + '"/>',
      lang: '<path d="M28 46 Q28 22 50 22 Q72 22 72 46 Q60 30 42 34 Q34 38 28 46 Z" fill="' + l.hair + '"/>',
      dutt: '<path d="M28 44 Q28 23 50 23 Q72 23 72 44 Q66 30 50 30 Q34 30 28 44 Z" fill="' + l.hair + '"/>',
      glatze: '<path d="M27 46 Q26 40 29 38 L30 46 Z M73 46 Q74 40 71 38 L70 46 Z" fill="' + l.hair + '"/>',
      locken: '<g fill="' + l.hair + '"><circle cx="32" cy="34" r="8"/><circle cx="42" cy="26" r="9"/><circle cx="55" cy="25" r="9"/><circle cx="67" cy="31" r="8"/><circle cx="72" cy="41" r="6"/><circle cx="28" cy="43" r="6"/></g>',
      seitenscheitel: '<path d="M28 46 Q27 22 52 22 Q73 23 72 44 Q70 34 58 30 Q44 36 28 46 Z" fill="' + l.hair + '"/>',
      bob: '<path d="M28 46 Q28 22 50 22 Q72 22 72 46 Q64 30 50 30 Q36 30 28 46 Z" fill="' + l.hair + '"/>',
    }[l.style];
    return (
      '<svg class="avatar" viewBox="0 0 100 100" role="img" aria-label="' + esc(label || "Foto") + '">' +
      '<rect width="100" height="100" fill="' + l.bg + '"/>' +
      hairBack +
      '<path d="M16 100 Q18 74 50 72 Q82 74 84 100 Z" fill="' + l.shirt + '"/>' +
      '<rect x="43" y="58" width="14" height="16" rx="5" fill="' + l.skin + '"/>' +
      '<ellipse cx="50" cy="46" rx="21" ry="24" fill="' + l.skin + '"/>' +
      (l.beard ? '<path d="M31 50 Q33 72 50 72 Q67 72 69 50 Q62 62 50 62 Q38 62 31 50 Z" fill="' + l.hair + '"/>' : "") +
      '<circle cx="42" cy="46" r="2.4" fill="#1d1d1d"/><circle cx="58" cy="46" r="2.4" fill="#1d1d1d"/>' +
      '<path d="M44 58 Q50 62 56 58" stroke="#5b2b22" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      (l.glasses ? '<g fill="none" stroke="#1d1d1d" stroke-width="1.8"><circle cx="42" cy="46" r="6.5"/><circle cx="58" cy="46" r="6.5"/><path d="M48.5 46 H51.5"/></g>' : "") +
      (l.earring ? '<circle cx="29" cy="54" r="2" fill="#e0b400"/>' : "") +
      hairFront +
      "</svg>"
    );
  }

  /* ---------- Ausweise ---------- */
  function uniquePick(list, n) {
    return shuffle(list).slice(0, n);
  }

  function makeCards(n) {
    n = n || 8;
    const used = new Set();
    const lastNames = uniquePick(LAST, n);
    const countries = uniquePick(COUNTRIES, n);
    const numbers = new Set();
    while (numbers.size < n) numbers.add(String(randInt(1000000, 9999999)));
    const nums = Array.from(numbers);
    const bdays = new Set();
    const bd = [];
    while (bd.length < n) {
      const d = randInt(1, 28), m = randInt(0, 11);
      const key = d + "." + m;
      if (!bdays.has(key)) { bdays.add(key); bd.push(d + ". " + MONTHS[m] + " " + randInt(1955, 2008)); }
    }
    const firstF = shuffle(FIRST_F), firstM = shuffle(FIRST_M);
    const cards = [];
    for (let i = 0; i < n; i++) {
      const female = Math.random() < 0.5;
      const first = female ? firstF.pop() : firstM.pop();
      const look = makeLook(i, used);
      if (female && look.beard) look.beard = false;
      const nAll = Math.random() < 0.12 ? 0 : randInt(1, 2);
      cards.push({
        name: first + " " + lastNames[i],
        birthday: bd[i],
        meds: Math.random() < 0.45 ? "Ja" : "Nein",
        blood: pick(BLOOD),
        allergies: uniquePick(ALLERGENS, nAll),
        number: nums[i],
        country: countries[i],
        look,
      });
    }
    return cards;
  }

  function cardHtml(c, opts) {
    opts = opts || {};
    return (
      '<article class="idcard' + (opts.highlight ? " is-highlight" : "") + '">' +
      '<div class="idcard-head"><span>Allergieausweis</span></div>' +
      '<div class="idcard-body">' + avatarSvg(c.look, "Foto von " + c.name) +
      '<dl class="idcard-fields">' +
      "<dt>Name</dt><dd>" + esc(c.name) + "</dd>" +
      "<dt>Geburtsdatum</dt><dd>" + c.birthday + "</dd>" +
      "<dt>Medikamente</dt><dd>" + c.meds + "</dd>" +
      "<dt>Blutgruppe</dt><dd>" + c.blood + "</dd>" +
      "<dt>Allergien</dt><dd>" + (c.allergies.length ? c.allergies.join(", ") : "keine") + "</dd>" +
      "<dt>Ausweisnummer</dt><dd class=\"idcard-num\">" + c.number + "</dd>" +
      "<dt>Ausgestellt in</dt><dd>" + c.country + "</dd>" +
      "</dl></div></article>"
    );
  }

  /* ---------- Fragen ---------- */
  // Wie eine Person in der Frage bezeichnet wird
  const REF = {
    photo: (c) => ({ html: '<span class="ref-photo">' + avatarSvg(c.look, "abgebildete Person") + "</span>", text: "die abgebildete Person" }),
    name: (c) => ({ text: esc(c.name) }),
    birthday: (c) => ({ text: "die Person, die am " + c.birthday + " geboren wurde" }),
    number: (c) => ({ text: "die Person mit der Ausweisnummer " + c.number }),
    country: (c) => ({ text: "die Person, deren Ausweis " + inCountry(c.country) + " ausgestellt wurde" }),
  };

  // Was gefragt wird: Fragetext (mit Bezug), Antwort, mögliche Ablenker
  const ASK = {
    name: { q: (r) => "Wie heißt " + r + "?", val: (c) => esc(c.name), from: (cs) => cs.map((c) => esc(c.name)) },
    birthday: {
      q: (r) => "Wann wurde " + r + " geboren?",
      val: (c) => c.birthday,
      // andere Ausweise plus derselbe Tag mit anderem Jahr, damit man sich das Jahr merken muss
      from: (cs, c) => cs.map((x) => x.birthday).concat(shuffle([-3, -2, -1, 1, 2, 3]).slice(0, 2).map((d) => c.birthday.replace(/\d{4}$/, (y) => String(Number(y) + d)))),
    },
    meds: { q: (r) => "Nimmt " + r + " Medikamente ein?", val: (c) => c.meds, fixed: ["Ja", "Nein"] },
    blood: { q: (r) => "Welche Blutgruppe hat " + r + "?", val: (c) => c.blood, fixed: BLOOD },
    number: { q: (r) => "Welche Ausweisnummer hat " + r + "?", val: (c) => c.number, from: (cs) => cs.map((c) => c.number) },
    country: { q: (r) => "In welchem Land wurde der Ausweis von " + r + " ausgestellt?", val: (c) => c.country, from: (cs) => cs.map((c) => c.country) },
    allergy: { q: (r) => "Welche Allergie hat " + r + "?", special: true },
    photo: { q: (r) => "Welches Foto gehört zu " + dative(r) + "?", val: (c) => avatarSvg(c.look), from: (cs) => cs.map((c) => avatarSvg(c.look)), grid: true },
  };

  const IN_COUNTRY = { Schweiz: "in der Schweiz", Niederlande: "in den Niederlanden", Slowakei: "in der Slowakei" };
  const inCountry = (c) => IN_COUNTRY[c] || "in " + c;

  function dative(text) {
    return text.replace(/^die abgebildete Person/, "der abgebildeten Person").replace(/^die Person/, "der Person");
  }

  function capital(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function makeQuestion(cards) {
    for (let t = 0; t < 50; t++) {
      const c = pick(cards);
      const askKey = pick(["name", "birthday", "meds", "blood", "blood", "number", "country", "allergy", "allergy", "photo"]);
      const refKinds = ["photo", "name", "birthday", "number", "country"].filter((k) => k !== askKey);
      const refKind = pick(refKinds);
      const ask = ASK[askKey];

      // Spezialfall: Zählfrage
      if (Math.random() < 0.08) return countQuestion(cards);

      const ref = REF[refKind](c);
      let q = ask.q(ref.text);
      if (askKey === "country" && refKind !== "name") {
        // „der Person, die … geboren wurde“ -> Nebensatz ans Ende stellen
        const g = dative(ref.text);
        const cut = g.indexOf(", ");
        q = cut > 0
          ? "In welchem Land wurde der Ausweis " + g.slice(0, cut) + " ausgestellt" + g.slice(cut) + "?"
          : "In welchem Land wurde der Ausweis " + g + " ausgestellt?";
      }
      q = capital(q);

      let options, correct;
      if (askKey === "allergy") {
        if (!c.allergies.length) continue;
        const right = pick(c.allergies);
        const inCards = cards.flatMap((x) => x.allergies).filter((a) => c.allergies.indexOf(a) < 0);
        const pool = Array.from(new Set(shuffle(inCards).concat(shuffle(ALLERGENS)))).filter((a) => c.allergies.indexOf(a) < 0);
        ({ options, correct } = U.withNone(right, pool.slice(0, 6), 0.15));
      } else if (ask.fixed) {
        options = ask.fixed.slice();
        correct = options.indexOf(ask.val(c));
        if (askKey === "blood") options.push("Keine der Antworten ist richtig.");
      } else {
        const right = ask.val(c);
        const pool = Array.from(new Set(ask.from(cards, c))).filter((v) => v !== right);
        ({ options, correct } = U.withNone(right, pool, 0.15));
      }

      const prompt =
        '<p class="prompt-q">' + q + "</p>" + (ref.html ? '<div class="ref">' + ref.html + "</div>" : "");
      const explain = "<p>Der passende Ausweis:</p>" + cardHtml(c, { highlight: true });
      return { prompt, options, correct, explain, layout: ask.grid ? "grid" : "list" };
    }
    return countQuestion(cards);
  }

  function countQuestion(cards) {
    const variants = [
      { q: "Wie viele Personen nehmen Medikamente ein?", n: cards.filter((c) => c.meds === "Ja").length },
      (() => { const b = pick(BLOOD); return { q: "Wie viele Personen haben Blutgruppe " + b + "?", n: cards.filter((c) => c.blood === b).length }; })(),
      { q: "Wie viele Personen haben keine Allergie?", n: cards.filter((c) => !c.allergies.length).length },
      { q: "Wie viele Personen haben mehr als eine Allergie?", n: cards.filter((c) => c.allergies.length > 1).length },
    ];
    const v = pick(variants);
    const pool = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((x) => x !== v.n).sort((a, b) => Math.abs(a - v.n) - Math.abs(b - v.n)).slice(0, 5);
    const { options, correct } = U.withNone(String(v.n), pool.map(String), 0.15);
    return {
      prompt: '<p class="prompt-q">' + v.q + "</p>",
      options,
      correct,
      explain: "<p>Richtig ist " + v.n + ". Alle Ausweise:</p>" + '<div class="idcard-list is-compact">' + cards.map((c) => cardHtml(c)).join("") + "</div>",
    };
  }

  function makeQuestions(cards, n) {
    const out = [];
    const seen = new Set();
    for (let t = 0; out.length < n && t < n * 20; t++) {
      const q = makeQuestion(cards);
      if (seen.has(q.prompt)) continue;
      seen.add(q.prompt);
      out.push(q);
    }
    return out;
  }

  /* ---------- Bildschirme ---------- */
  const PENDING_KEY = "gedaechtnis.pending";
  const BACK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';

  function topbar(eyebrow, title, meta) {
    return '<header class="topbar"><button class="icon-btn" type="button" data-act="home" aria-label="Zurück">' + BACK + "</button>" +
      '<div class="topbar-title"><span class="eyebrow">' + eyebrow + "</span><h1>" + title + "</h1></div>" +
      '<div class="topbar-meta">' + (meta || "") + "</div></header>";
  }

  // Modul-Definition für den Fragen-Teil (Layout wird pro Frage gesetzt)
  const QUIZ_MOD = { id: "gedaechtnis", title: "Allergieausweise", layout: "list" };

  function setup(root, app) {
    let learnMin = MT.store.get("gm.learn", 8);
    let qCount = MT.store.get("gm.count", 25);
    const pending = MT.store.get(PENDING_KEY, null);

    function render() {
      root.innerHTML =
        topbar("Gedächtnis und Merkfähigkeit", "Allergieausweise") +
        '<main class="screen">' +
        (pending
          ? '<section class="notice"><strong>Offene Abfrage.</strong> Du hast Ausweise um ' + pending.time +
            ' Uhr gelernt und noch nicht abgefragt.<div class="notice-actions"><button class="btn primary" type="button" data-act="quiz-pending">Jetzt abfragen</button>' +
            '<button class="btn" type="button" data-act="drop-pending">Verwerfen</button></div></section>'
          : "") +
        '<section class="prompt-card"><p>Du siehst 8 Allergieausweise. Präge dir alle Angaben ein: Foto, Name, Geburtstag, Medikamente, Blutgruppe, Allergien, Ausweisnummer und Land. ' +
        "Danach beantwortest du Fragen dazu, ohne die Ausweise zu sehen.</p>" +
        '<p class="muted small">Im echten Test liegen zwischen Lernen und Abfrage andere Untertests. Wähle dafür „Später abfragen“ und übe in der Zwischenzeit etwas anderes.</p></section>' +
        '<h2 class="section-title">Lernzeit</h2>' +
        '<div class="seg" role="radiogroup" aria-label="Lernzeit">' +
        [2, 4, 8].map((m) => '<button type="button" role="radio" data-learn="' + m + '" aria-checked="' + (m === learnMin) + '">' + m + " Min</button>").join("") +
        '<button type="button" role="radio" data-learn="0" aria-checked="' + (learnMin === 0) + '">ohne</button></div>' +
        '<h2 class="section-title">Anzahl Fragen</h2>' +
        '<div class="seg" role="radiogroup" aria-label="Anzahl Fragen">' +
        [10, 15, 25].map((n) => '<button type="button" role="radio" data-count="' + n + '" aria-checked="' + (n === qCount) + '">' + n + "</button>").join("") +
        "</div>" +
        '<button class="btn primary wide" type="button" data-act="start">Lernphase starten</button>' +
        "</main>";
    }

    root.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn || !root.contains(btn)) return;
      const act = btn.getAttribute("data-act");
      if (btn.hasAttribute("data-learn")) { learnMin = Number(btn.getAttribute("data-learn")); MT.store.set("gm.learn", learnMin); render(); }
      else if (btn.hasAttribute("data-count")) { qCount = Number(btn.getAttribute("data-count")); MT.store.set("gm.count", qCount); render(); }
      else if (act === "home") app.go("home");
      else if (act === "start") {
        const cards = makeCards(8);
        current = learn(root, app, cards, learnMin, qCount);
      } else if (act === "quiz-pending") {
        MT.store.set(PENDING_KEY, null);
        current = quiz(root, app, pending.cards, pending.count);
      } else if (act === "drop-pending") {
        MT.store.set(PENDING_KEY, null);
        app.go("gedaechtnis");
      }
    });

    let current = null;
    render();
    return { destroy() { if (current && current.destroy) current.destroy(); } };
  }

  function learn(root, app, cards, minutes, count) {
    const endAt = Date.now() + minutes * 60 * 1000;
    let timer = null;
    const fresh = document.createElement("div");
    root.replaceWith(fresh);
    fresh.className = "view";
    root = fresh;

    root.innerHTML =
      topbar("Lernphase", "Allergieausweise einprägen", minutes ? '<span class="timer" id="timer">' + MT.quiz.fmtTime(minutes * 60) + "</span>" : "") +
      '<main class="screen">' +
      '<div class="idcard-list">' + cards.map((c) => cardHtml(c)).join("") + "</div>" +
      '<button class="btn primary wide" type="button" data-act="done">Fertig gelernt</button>' +
      "</main>";

    function done() {
      clearInterval(timer);
      afterLearn(root, app, cards, count);
    }
    if (minutes) {
      timer = setInterval(() => {
        const left = (endAt - Date.now()) / 1000;
        const t = root.querySelector("#timer");
        if (t) { t.textContent = MT.quiz.fmtTime(left); t.classList.toggle("is-low", left < 60); }
        if (left <= 0) done();
      }, 500);
    }
    root.onclick = (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const act = btn.getAttribute("data-act");
      if (act === "done") done();
      else if (act === "home") {
        app.confirm("Lernphase abbrechen?", "Die Ausweise werden verworfen.", "Abbrechen", "Weiterlernen").then((ok) => {
          if (ok) { clearInterval(timer); app.go("home"); }
        });
      }
    };
    window.scrollTo(0, 0);
    return { destroy() { clearInterval(timer); } };
  }

  function afterLearn(root, app, cards, count) {
    root.innerHTML =
      topbar("Lernphase beendet", "Allergieausweise") +
      '<main class="screen">' +
      '<section class="prompt-card"><p class="prompt-q">Die Ausweise sind jetzt verdeckt.</p>' +
      '<p class="muted">Willst du sofort abgefragt werden, oder erst später, wie im echten Test?</p></section>' +
      '<button class="btn primary wide" type="button" data-act="now">Jetzt abfragen</button>' +
      '<button class="btn wide" type="button" data-act="later">Später abfragen</button>' +
      '<p class="muted small">Bei „Später“ wird die Abfrage gespeichert. Du findest sie dann auf der Übersicht.</p>' +
      "</main>";
    root.onclick = (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const act = btn.getAttribute("data-act");
      if (act === "now") quiz(root, app, cards, count);
      else if (act === "later" || act === "home") {
        const d = new Date();
        MT.store.set(PENDING_KEY, { cards, count, time: String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0") });
        app.go("home");
      }
    };
    window.scrollTo(0, 0);
  }

  function quiz(root, app, cards, count) {
    const fresh = document.createElement("div");
    fresh.className = "view";
    root.replaceWith(fresh);
    const tasks = makeQuestions(cards, count);
    const seconds = Math.round((count / 25) * 15 * 60);
    return MT.quiz.simulation(fresh, app, QUIZ_MOD, {
      tasks,
      seconds,
      eyebrow: "Abfrage",
      againRoute: "gedaechtnis",
      resultExtra:
        '<details class="cards-details"><summary>Alle Ausweise ansehen</summary><div class="idcard-list is-compact">' +
        cards.map((c) => cardHtml(c)).join("") + "</div></details>",
    });
  }

  MT.gedaechtnis = {
    setup,
    makeCards,
    makeQuestions,
    cardHtml,
    avatarSvg,
    hasPending: () => !!MT.store.get(PENDING_KEY, null),
    pendingTime: () => (MT.store.get(PENDING_KEY, null) || {}).time,
    PENDING_KEY,
  };
})();
