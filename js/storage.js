/* Lokaler Speicher für Einstellungen und Statistik (nur auf diesem Gerät). */
(function () {
  "use strict";
  const MT = (window.MT = window.MT || {});
  const PREFIX = "kfftrainer.";

  const store = {
    get(key, fallback) {
      try {
        const raw = window.localStorage.getItem(PREFIX + key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
      } catch (e) {
        /* Speicher nicht verfügbar: ignorieren */
      }
    },
  };

  function today() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  const stats = {
    load(module) {
      const s = store.get("stats." + module, null) || {};
      return {
        total: s.total || 0,
        correct: s.correct || 0,
        day: s.day || today(),
        dayCount: s.day === today() ? s.dayCount || 0 : 0,
        bestSim: s.bestSim == null ? null : s.bestSim,
        sims: s.sims || 0,
      };
    },
    record(module, correct) {
      const s = stats.load(module);
      s.total += 1;
      if (correct) s.correct += 1;
      s.day = today();
      s.dayCount += 1;
      store.set("stats." + module, s);
      return s;
    },
    recordSim(module, score) {
      const s = stats.load(module);
      s.sims += 1;
      s.bestSim = s.bestSim == null ? score : Math.max(s.bestSim, score);
      store.set("stats." + module, s);
      return s;
    },
  };

  MT.store = store;
  MT.stats = stats;
})();
