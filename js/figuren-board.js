/* Spielfeld: Teile ziehen, drehen (Griff, zwei Finger, Mausrad), einrasten. */
(function () {
  "use strict";
  const MT = (window.MT = window.MT || {});
  const G = MT.geo;
  const NS = "http://www.w3.org/2000/svg";

  const SNAP_DIST = 18; // Einheiten im Spielfeld
  const SNAP_ANGLE = 14; // Grad
  const DONE_DIST = 1.5;
  const DONE_ANGLE = 1.5;
  const HANDLE_GAP = 24;

  const reduceMotion = () =>
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(name, attrs) {
    const node = document.createElementNS(NS, name);
    for (const k in attrs || {}) node.setAttribute(k, attrs[k]);
    return node;
  }

  /**
   * @param {HTMLElement} container
   * @param {object} task
   * @param {{interactive?: boolean, snap?: boolean, onComplete?: Function, onSelect?: Function}} opts
   */
  function createBoard(container, task, opts) {
    opts = opts || {};
    const { W, H } = MT.figurenTasks.BOARD;
    let interactive = opts.interactive !== false;
    let snapOn = opts.snap !== false;
    let selected = -1;
    let complete = false;
    let animating = 0;

    const svg = el("svg", {
      viewBox: "0 0 " + W + " " + H,
      class: "board" + (interactive ? " is-interactive" : ""),
      role: "img",
      "aria-label": task.pieces.length + " Teile einer Figur",
    });
    const layer = el("g", { class: "pieces" });
    const handle = el("g", { class: "handle", visibility: "hidden" });
    const handleLine = el("line", { class: "handle-line" });
    const handleHit = el("circle", { class: "handle-hit", r: 26 });
    const handleDot = el("circle", { class: "handle-dot", r: 14 });
    const handleIcon = el("path", {
      class: "handle-icon",
      d: "M-5.5 -2.2 A6 6 0 1 1 -4.6 3.9 M-5.5 -2.2 L-6.4 -6.6 M-5.5 -2.2 L-1.3 -3.4",
    });
    handle.append(handleLine, handleHit, handleDot, handleIcon);
    svg.append(layer, handle);
    container.replaceChildren(svg);

    const nodes = task.pieces.map((p, i) => {
      const g = el("g", { class: "piece", "data-i": i });
      g.append(el("polygon", { points: G.pointsAttr(p.local) }));
      layer.append(g);
      return g;
    });

    function render(i) {
      const list = i == null ? task.pieces.map((_, k) => k) : [i];
      for (const k of list) {
        const p = task.pieces[k].pose;
        nodes[k].setAttribute("transform", "translate(" + p.x.toFixed(2) + " " + p.y.toFixed(2) + ") rotate(" + p.a.toFixed(2) + ")");
      }
      renderHandle();
    }

    let handleAt = null; // feste Weltposition während des Drehens
    function renderHandle() {
      if (selected < 0 || !interactive || complete) {
        handle.setAttribute("visibility", "hidden");
        return;
      }
      const piece = task.pieces[selected];
      const p = piece.pose;
      let hx, hy;
      if (handleAt) {
        [hx, hy] = handleAt;
      } else {
        const dist = piece.r + HANDLE_GAP;
        const dirs = [[0, -1], [1, 0], [-1, 0], [0, 1]];
        let found = null;
        for (const d of dirs) {
          const x = p.x + d[0] * dist, y = p.y + d[1] * dist;
          if (x > 16 && x < W - 16 && y > 16 && y < H - 16) { found = [x, y]; break; }
        }
        if (!found) {
          // Spielfeld zu klein: Griff an den Rand klemmen
          found = [Math.min(W - 16, Math.max(16, p.x)), Math.max(16, p.y - dist)];
        }
        [hx, hy] = found;
      }
      handleLine.setAttribute("x1", p.x); handleLine.setAttribute("y1", p.y);
      handleLine.setAttribute("x2", hx); handleLine.setAttribute("y2", hy);
      for (const c of [handleHit, handleDot]) { c.setAttribute("cx", hx); c.setAttribute("cy", hy); }
      handleIcon.setAttribute("transform", "translate(" + hx + " " + hy + ")");
      handle.setAttribute("visibility", "visible");
    }

    function select(i) {
      if (selected === i) return;
      if (selected >= 0) nodes[selected].classList.remove("is-selected");
      selected = i;
      if (i >= 0) {
        nodes[i].classList.add("is-selected");
        layer.append(nodes[i]); // nach vorne holen
      }
      renderHandle();
      if (opts.onSelect) opts.onSelect(i);
    }

    // ---------- Einrasten & Fertig-Erkennung ----------
    function idealFrom(i, j) {
      const pi = task.pieces[i], pj = task.pieces[j];
      const [rx, ry] = G.rotate([pi.tx - pj.tx, pi.ty - pj.ty], pj.pose.a);
      return { x: pj.pose.x + rx, y: pj.pose.y + ry, a: pj.pose.a };
    }

    function trySnap(i) {
      if (!snapOn) return false;
      const pose = task.pieces[i].pose;
      let best = null;
      for (let j = 0; j < task.pieces.length; j++) {
        if (j === i) continue;
        const ideal = idealFrom(i, j);
        const d = Math.hypot(ideal.x - pose.x, ideal.y - pose.y);
        if (d < SNAP_DIST && G.angleDiff(ideal.a, pose.a) < SNAP_ANGLE && (!best || d < best.d)) {
          best = Object.assign({ d }, ideal);
        }
      }
      if (!best) return false;
      animate([{ i, to: best }], 140, () => {
        nodes[i].classList.remove("snap-flash");
        void nodes[i].getBBox();
        nodes[i].classList.add("snap-flash");
        checkComplete();
      });
      return true;
    }

    function checkComplete() {
      if (complete) return;
      for (let i = 1; i < task.pieces.length; i++) {
        const ideal = idealFrom(i, 0);
        const pose = task.pieces[i].pose;
        if (Math.hypot(ideal.x - pose.x, ideal.y - pose.y) > DONE_DIST) return;
        if (G.angleDiff(ideal.a, pose.a) > DONE_ANGLE) return;
      }
      setComplete(true);
      if (opts.onComplete) opts.onComplete();
    }

    function setComplete(v) {
      complete = v;
      svg.classList.toggle("is-complete", v);
      if (v) select(-1);
      renderHandle();
    }

    // ---------- Animation ----------
    function animate(list, ms, done) {
      animating++;
      const from = list.map((o) => Object.assign({}, task.pieces[o.i].pose));
      const t0 = performance.now();
      const dur = reduceMotion() ? 0 : ms;
      function step(now) {
        const t = dur ? Math.min(1, (now - t0) / dur) : 1;
        const e = 1 - Math.pow(1 - t, 3);
        list.forEach((o, k) => {
          const f = from[k];
          const p = task.pieces[o.i].pose;
          p.x = f.x + (o.to.x - f.x) * e;
          p.y = f.y + (o.to.y - f.y) * e;
          p.a = f.a + G.angleDelta(f.a, o.to.a) * e;
        });
        render();
        if (t < 1) requestAnimationFrame(step);
        else {
          list.forEach((o) => {
            const p = task.pieces[o.i].pose;
            p.a = G.norm360(p.a);
          });
          animating--;
          if (done) done();
        }
      }
      requestAnimationFrame(step);
    }

    // ---------- Zeiger-Steuerung ----------
    const pointers = new Map();
    let gesture = null;

    function toBoard(e) {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const m = svg.getScreenCTM();
      if (!m) return { x: 0, y: 0 };
      const r = pt.matrixTransform(m.inverse());
      return { x: r.x, y: r.y };
    }

    function clampPose(p) {
      p.x = Math.min(W - 4, Math.max(4, p.x));
      p.y = Math.min(H - 4, Math.max(4, p.y));
    }

    function startDrag(i, at) {
      const p = task.pieces[i].pose;
      gesture = { type: "drag", i, start: at, from: { x: p.x, y: p.y }, moved: false };
    }

    function startPinch() {
      const [a, b] = Array.from(pointers.values());
      const p = task.pieces[selected].pose;
      gesture = {
        type: "pinch",
        i: selected,
        angle: Math.atan2(b.y - a.y, b.x - a.x),
        mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        from: { x: p.x, y: p.y, a: p.a },
        moved: true,
      };
    }

    function onDown(e) {
      if (!interactive || animating) return;
      const at = toBoard(e);
      pointers.set(e.pointerId, at);
      try { svg.setPointerCapture(e.pointerId); } catch (_) { /* ignorieren */ }
      e.preventDefault();

      if (pointers.size === 2 && selected >= 0) {
        startPinch();
        return;
      }
      if (pointers.size > 1) return;

      const target = e.target;
      if (target.closest && target.closest(".handle") && selected >= 0) {
        const p = task.pieces[selected].pose;
        gesture = {
          type: "rotate",
          i: selected,
          start: Math.atan2(at.y - p.y, at.x - p.x),
          from: p.a,
          dist: Math.hypot(at.x - p.x, at.y - p.y),
          moved: false,
        };
        return;
      }
      const pieceNode = target.closest ? target.closest(".piece") : null;
      if (pieceNode) {
        if (complete) setComplete(false);
        const i = Number(pieceNode.getAttribute("data-i"));
        select(i);
        startDrag(i, at);
      } else {
        gesture = { type: "tap-empty" };
      }
    }

    function onMove(e) {
      if (!pointers.has(e.pointerId) || !gesture) return;
      const at = toBoard(e);
      pointers.set(e.pointerId, at);
      const g = gesture;
      if (g.type === "drag") {
        const p = task.pieces[g.i].pose;
        p.x = g.from.x + (at.x - g.start.x);
        p.y = g.from.y + (at.y - g.start.y);
        clampPose(p);
        if (Math.hypot(at.x - g.start.x, at.y - g.start.y) > 2) g.moved = true;
        render(g.i);
      } else if (g.type === "rotate") {
        const p = task.pieces[g.i].pose;
        const ang = Math.atan2(at.y - p.y, at.x - p.x);
        p.a = g.from + ((ang - g.start) * 180) / Math.PI;
        g.moved = true;
        handleAt = [p.x + Math.cos(ang) * g.dist, p.y + Math.sin(ang) * g.dist];
        render(g.i);
      } else if (g.type === "pinch" && pointers.size >= 2) {
        const [a, b] = Array.from(pointers.values());
        const p = task.pieces[g.i].pose;
        const ang = Math.atan2(b.y - a.y, b.x - a.x);
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        p.a = g.from.a + ((ang - g.angle) * 180) / Math.PI;
        p.x = g.from.x + (mid.x - g.mid.x);
        p.y = g.from.y + (mid.y - g.mid.y);
        clampPose(p);
        render(g.i);
      }
    }

    function onUp(e) {
      if (!pointers.has(e.pointerId)) return;
      pointers.delete(e.pointerId);
      const g = gesture;
      if (!g) return;

      if (g.type === "pinch" && pointers.size === 1) {
        // ein Finger bleibt liegen: als Ziehen weitermachen
        const rest = Array.from(pointers.values())[0];
        startDrag(g.i, rest);
        gesture.moved = true;
        return;
      }
      if (pointers.size > 0) return;

      gesture = null;
      handleAt = null;
      if (g.type === "tap-empty") {
        select(-1);
        return;
      }
      const i = g.i;
      task.pieces[i].pose.a = G.norm360(task.pieces[i].pose.a);
      renderHandle();
      if (g.moved) {
        if (!trySnap(i)) checkComplete();
      }
    }

    function onWheel(e) {
      if (!interactive || selected < 0 || animating) return;
      e.preventDefault();
      rotateSelected(e.deltaY > 0 ? 5 : -5, false);
    }

    svg.addEventListener("pointerdown", onDown);
    svg.addEventListener("pointermove", onMove);
    svg.addEventListener("pointerup", onUp);
    svg.addEventListener("pointercancel", onUp);
    svg.addEventListener("wheel", onWheel, { passive: false });

    // ---------- öffentliche Funktionen ----------
    function rotateSelected(deg, snap) {
      if (!interactive || selected < 0 || animating) return false;
      const i = selected;
      const p = task.pieces[i].pose;
      if (snap === false) {
        p.a = G.norm360(p.a + deg);
        render(i);
        return true;
      }
      animate([{ i, to: { x: p.x, y: p.y, a: p.a + deg } }], 160, () => {
        if (!trySnap(i)) checkComplete();
      });
      return true;
    }

    function showSolution(done) {
      select(-1);
      const list = task.pieces.map((p, i) => ({ i, to: { x: p.tx, y: p.ty, a: 0 } }));
      animate(list, 750, () => {
        setComplete(true);
        if (done) done();
      });
    }

    function reshuffle() {
      select(-1);
      setComplete(false);
      const before = task.pieces.map((p) => Object.assign({}, p.pose));
      MT.figurenTasks.scatterPieces(task);
      const list = task.pieces.map((p, i) => ({ i, to: p.pose }));
      task.pieces.forEach((p, i) => { p.pose = before[i]; });
      animate(list.map((o) => ({ i: o.i, to: Object.assign({}, o.to) })), 500);
    }

    render();

    return {
      rotateSelected,
      showSolution,
      reshuffle,
      hasSelection: () => selected >= 0,
      isComplete: () => complete,
      setSnap(v) { snapOn = !!v; },
      setInteractive(v) {
        interactive = !!v;
        svg.classList.toggle("is-interactive", interactive);
        if (!interactive) select(-1);
      },
      destroy() {
        pointers.clear();
        svg.remove();
      },
    };
  }

  MT.createFigurenBoard = createBoard;
})();
