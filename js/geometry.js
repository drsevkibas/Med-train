/* Geometrie-Helfer: Polygone, Schwerpunkt, Schneiden konvexer Formen. */
(function () {
  "use strict";
  const MT = (window.MT = window.MT || {});

  const geo = {};

  geo.area = function (pts) {
    let a = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const q = pts[(i + 1) % pts.length];
      a += p[0] * q[1] - q[0] * p[1];
    }
    return a / 2;
  };

  geo.areaAbs = function (pts) {
    return Math.abs(geo.area(pts));
  };

  geo.centroid = function (pts) {
    let a = 0, cx = 0, cy = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const q = pts[(i + 1) % pts.length];
      const c = p[0] * q[1] - q[0] * p[1];
      a += c;
      cx += (p[0] + q[0]) * c;
      cy += (p[1] + q[1]) * c;
    }
    a /= 2;
    if (Math.abs(a) < 1e-12) {
      // Fallback: Mittelwert der Punkte
      const n = pts.length;
      return [pts.reduce((s, p) => s + p[0], 0) / n, pts.reduce((s, p) => s + p[1], 0) / n];
    }
    return [cx / (6 * a), cy / (6 * a)];
  };

  /** Größter Abstand eines Punktes vom Zentrum c. */
  geo.radius = function (pts, c) {
    c = c || [0, 0];
    let r = 0;
    for (const p of pts) r = Math.max(r, Math.hypot(p[0] - c[0], p[1] - c[1]));
    return r;
  };

  function dedupe(pts) {
    const out = [];
    for (const p of pts) {
      const last = out[out.length - 1];
      if (!last || Math.hypot(p[0] - last[0], p[1] - last[1]) > 1e-7) out.push(p);
    }
    if (out.length > 1) {
      const f = out[0], l = out[out.length - 1];
      if (Math.hypot(f[0] - l[0], f[1] - l[1]) <= 1e-7) out.pop();
    }
    return out;
  }

  /** Sutherland-Hodgman: behält den Teil, für den dot(x - p, n) >= 0. */
  geo.clipHalfPlane = function (poly, p, n) {
    const out = [];
    const len = poly.length;
    for (let i = 0; i < len; i++) {
      const cur = poly[i];
      const prev = poly[(i - 1 + len) % len];
      const dc = (cur[0] - p[0]) * n[0] + (cur[1] - p[1]) * n[1];
      const dp = (prev[0] - p[0]) * n[0] + (prev[1] - p[1]) * n[1];
      if (dc >= 0) {
        if (dp < 0) out.push(intersect(prev, cur, dp, dc));
        out.push(cur);
      } else if (dp >= 0) {
        out.push(intersect(prev, cur, dp, dc));
      }
    }
    return dedupe(out);
  };

  function intersect(a, b, da, db) {
    const t = da / (da - db);
    return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
  }

  /** Teilt ein konvexes Polygon entlang der Geraden durch p mit Winkel ang (rad). */
  geo.split = function (poly, p, ang) {
    const n = [-Math.sin(ang), Math.cos(ang)];
    return [geo.clipHalfPlane(poly, p, n), geo.clipHalfPlane(poly, p, [-n[0], -n[1]])];
  };

  geo.rotate = function (pt, deg) {
    const r = (deg * Math.PI) / 180;
    const c = Math.cos(r), s = Math.sin(r);
    return [pt[0] * c - pt[1] * s, pt[0] * s + pt[1] * c];
  };

  /** Schwerpunkt in den Ursprung, größter Radius = 1. */
  geo.normalize = function (pts) {
    const c = geo.centroid(pts);
    const moved = pts.map((p) => [p[0] - c[0], p[1] - c[1]]);
    const r = geo.radius(moved) || 1;
    return moved.map((p) => [p[0] / r, p[1] / r]);
  };

  /** Kleinster Winkelabstand in Grad (0..180). */
  geo.angleDiff = function (a, b) {
    let d = (((a - b) % 360) + 360) % 360;
    return d > 180 ? 360 - d : d;
  };

  /** Vorzeichenbehafteter kürzester Weg von a nach b in Grad. */
  geo.angleDelta = function (a, b) {
    let d = (((b - a) % 360) + 360) % 360;
    return d > 180 ? d - 360 : d;
  };

  geo.norm360 = function (a) {
    return ((a % 360) + 360) % 360;
  };

  geo.pointsAttr = function (pts) {
    return pts.map((p) => p[0].toFixed(2) + "," + p[1].toFixed(2)).join(" ");
  };

  MT.geo = geo;
})();
