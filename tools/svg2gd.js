// node tools/svg2gd.js <art.svg> [--tol 1.2] [--upp 1] [--preview out.png] [--json out.json]
//   An SVG drawing -> GD deco objects, shape for shape (ART.md "Creatures and animation"; tools/artlab.js uses it).
//   Headless Chromium reads the drawing as the browser draws it (transforms, arcs, curves, computed colours): every filled
//   shape's outline is sampled, simplified (Douglas-Peucker, --tol px), cut into triangles (ear clipping), and every
//   triangle becomes TWO of GD's right triangles (693) split along its altitude -- any triangle, exactly. Circles and
//   unturned ellipses become one disk (497); a radial gradient that fades out becomes 3 see-through disks (a glow).
//   Strokes become bars (211) per segment. Each shape keeps its own colour (gradient fills: their mean colour), the
//   SVG's paint order becomes GD's z order, and colours go through lib/paintfit.js toGD (a few base channels + HSV).
//   Library: await svgShapes(file, {tol}) -> {w, h, shapes, parts}; shapes as lib/paintfit.js ({k, x, y, w, h, rot, fx, c, a}),
//   each with `part` = the id of its nearest <g id=...> (so parts can be grouped and moved by triggers).
//   Cost: a polygon of n corners is 2(n-2) objects. Source art must be ours or free-licensed (never copyrighted pictures).
"use strict";
const fs = require("fs"), path = require("path");
const PF = require("../lib/paintfit.js");

// ---- geometry
function rdp(pts, tol) {
  if (pts.length < 3) return pts;
  let dmax = 0, idx = 0; const [a, b] = [pts[0], pts[pts.length - 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-9;
  for (let i = 1; i < pts.length - 1; i++) { const d = Math.abs((b[0] - a[0]) * (a[1] - pts[i][1]) - (a[0] - pts[i][0]) * (b[1] - a[1])) / L; if (d > dmax) { dmax = d; idx = i; } }
  if (dmax <= tol) return [a, b];
  return rdp(pts.slice(0, idx + 1), tol).slice(0, -1).concat(rdp(pts.slice(idx), tol));
}
function simplifyRing(pts, tol) {
  // close the ring at its two farthest points so RDP keeps the shape's extent
  let far = 0, fd = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]); if (d > fd) { fd = d; far = i; } }
  const A = rdp(pts.slice(0, far + 1), tol), B = rdp(pts.slice(far).concat([pts[0]]), tol);
  const out = A.slice(0, -1).concat(B.slice(0, -1));
  return out.filter((p, i) => { const q = out[(i + 1) % out.length]; return Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.05; });
}
const area = P => { let s = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; s += p[0] * q[1] - q[0] * p[1]; } return s / 2; };
function inTri(p, a, b, c) {
  const d = (u, v, w) => (u[0] - w[0]) * (v[1] - w[1]) - (v[0] - w[0]) * (u[1] - w[1]);
  const d1 = d(p, a, b), d2 = d(p, b, c), d3 = d(p, c, a);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}
// ear clipping; returns triangles [[a,b,c]...]; a self-crossing ring falls back to a fan
function triangulate(P) {
  let V = P.slice(); if (area(V) < 0) V.reverse();
  const tris = []; let guard = 0;
  while (V.length > 3 && guard++ < 5000) {
    let cut = false;
    for (let i = 0; i < V.length; i++) {
      const a = V[(i + V.length - 1) % V.length], b = V[i], c = V[(i + 1) % V.length];
      const cr = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      if (cr <= 1e-9) continue;
      if (V.some(p => p !== a && p !== b && p !== c && inTri(p, a, b, c))) continue;
      tris.push([a, b, c]); V.splice(i, 1); cut = true; break;
    }
    if (!cut) { for (let i = 1; i < V.length - 1; i++) tris.push([V[0], V[i], V[i + 1]]); return tris; }
  }
  if (V.length === 3) tris.push(V);
  return tris;
}
// one triangle -> two right triangles (paintfit "tri" shapes), split at the foot of the altitude onto the longest side
function triToRight(t, c, a, extra) {
  const L = (p, q) => Math.hypot(q[0] - p[0], q[1] - p[1]);
  let [A, B, C] = t; const ab = L(A, B), bc = L(B, C), ca = L(C, A);
  if (bc >= ab && bc >= ca) [A, B, C] = [B, C, A]; else if (ca >= ab && ca >= bc) [A, B, C] = [C, A, B];
  const ux = B[0] - A[0], uy = B[1] - A[1], uu = ux * ux + uy * uy; if (uu < 1e-6) return [];
  const s = ((C[0] - A[0]) * ux + (C[1] - A[1]) * uy) / uu, H = [A[0] + s * ux, A[1] + s * uy];
  const out = [];
  for (const E of [A, B]) {
    const a1 = L(H, E), a2 = L(H, C); if (a1 < 0.05 || a2 < 0.05) continue;
    const u = [(E[0] - H[0]) / a1, (E[1] - H[1]) / a1], v = [(C[0] - H[0]) / a2, (C[1] - H[1]) / a2];
    // paintfit tri, local y-down: right angle at (.5,.5), legs towards -x and -y; screen = R*local, R e1 = (cos, sin), R e2 = (-sin, cos)
    let th = Math.atan2(-u[1], -u[0]), fx = false;
    const e2 = [-Math.sin(th), Math.cos(th)];
    if (Math.abs(e2[0] + v[0]) + Math.abs(e2[1] + v[1]) > 1e-3) { th = Math.atan2(u[1], u[0]); fx = true; }   // mirrored: right angle at (-.5,.5)
    const g = extra || 0;   // grow a little so neighbours overlap (no hairline seams)
    out.push({ k: "tri", x: H[0] + (u[0] * a1 + v[0] * a2) / 2, y: H[1] + (u[1] * a1 + v[1] * a2) / 2, w: a1 + g, h: a2 + g, rot: th * 180 / Math.PI, fx, c, a });
  }
  return out;
}

// ---- read the SVG in the browser
async function readSvg(file) {
  const { chromium } = require("playwright"), svg = fs.readFileSync(file, "utf8");
  const b = await chromium.launch({ args: ["--no-sandbox"] }), p = await b.newPage();
  await p.setContent(`<html><body style="margin:0">${svg}</body></html>`);
  const data = await p.evaluate(() => {
    const root = document.querySelector("svg"), vb = root.viewBox.baseVal, out = [];
    const W = vb && vb.width ? vb.width : root.width.baseVal.value, H = vb && vb.height ? vb.height : root.height.baseVal.value;
    const rgb = s => { const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/.exec(s || ""); return m ? { c: [+m[1], +m[2], +m[3]], a: m[4] == null ? 1 : +m[4] } : null; };
    // a gradient with its geometry on the screen: linear p1 -> p2, radial centre c and radii rx, ry (objectBoundingBox or user space)
    const grad = (id, el, T) => { const g = document.getElementById(id); if (!g) return null;
      const stops = [...g.querySelectorAll("stop")].map(s => { const cs = getComputedStyle(s), c = rgb(cs.stopColor); const off = s.getAttribute("offset") || "0"; return { o: off.endsWith("%") ? parseFloat(off) / 100 : +off, c: c.c, a: c.a * +(cs.stopOpacity || 1) }; });
      const radial = g.tagName.toLowerCase() === "radialgradient", user = g.getAttribute("gradientUnits") === "userSpaceOnUse", bb = el.getBBox();
      const num = (k, d) => { const v = g.getAttribute(k); if (v == null) return d; return v.endsWith("%") ? parseFloat(v) / 100 : +v; };
      const P = (u, v) => user ? T(u, v) : T(bb.x + u * bb.width, bb.y + v * bb.height);
      if (radial) { const cx = num("cx", 0.5), cy = num("cy", 0.5), r = num("r", 0.5), c = P(cx, cy), ex = P(cx + r, cy), ey = P(cx, cy + r);
        return { radial, stops, c, rx: Math.hypot(ex[0] - c[0], ex[1] - c[1]), ry: Math.hypot(ey[0] - c[0], ey[1] - c[1]) }; }
      return { radial, stops, p1: P(num("x1", 0), num("y1", 0)), p2: P(num("x2", 1), num("y2", 0)) }; };
    const els = root.querySelectorAll("path, polygon, polyline, rect, circle, ellipse, line");
    for (const el of els) {
      if (el.closest("defs")) continue;
      const cs = getComputedStyle(el), m = el.getCTM(), op = +cs.opacity * (el.closest("g") ? +getComputedStyle(el.closest("g")).opacity : 1);
      const part = (el.closest("g[id]") || {}).id || "";
      const T = (x, y) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
      const fillUrl = /url\("?#([^")]+)"?\)/.exec(cs.fill), strokeUrl = /url\("?#([^")]+)"?\)/.exec(cs.stroke);
      const fill = fillUrl ? { grad: grad(fillUrl[1], el, T) } : rgb(cs.fill), stroke = strokeUrl ? { grad: grad(strokeUrl[1], el, T) } : rgb(cs.stroke);
      const fo = +cs.fillOpacity * op, so = +cs.strokeOpacity * op, sw = parseFloat(cs.strokeWidth) || 0;
      const tag = el.tagName.toLowerCase(), item = { tag, part, fill, stroke, fo, so, sw: sw * Math.hypot(m.a, m.b) };
      if ((tag === "circle" || tag === "ellipse") && Math.abs(m.b) < 1e-6 && Math.abs(m.c) < 1e-6) {
        const cx = el.cx.baseVal.value, cy = el.cy.baseVal.value, rx = tag === "circle" ? el.r.baseVal.value : el.rx.baseVal.value, ry = tag === "circle" ? rx : el.ry.baseVal.value;
        item.ellipse = { c: T(cx, cy), rx: rx * Math.abs(m.a), ry: ry * Math.abs(m.d) };
      }
      // the outline, sampled; a jump far longer than the step starts a new ring (subpaths)
      const len = el.getTotalLength ? el.getTotalLength() : 0, rings = []; let ring = [], last = null;
      const step = Math.max(0.5, Math.min(2, len / 400));
      for (let d = 0; d <= len + 1e-6; d += step) {
        const q = el.getPointAtLength(Math.min(d, len)), pt = T(q.x, q.y);
        if (last && Math.hypot(pt[0] - last[0], pt[1] - last[1]) > step * 4) { if (ring.length > 1) rings.push(ring); ring = []; }
        ring.push(pt); last = pt;
      }
      if (ring.length > 1) rings.push(ring);
      item.rings = rings;
      out.push(item);
    }
    return { W, H, items: out };
  });
  await b.close();
  return data;
}

// the gradient's colour at t (0..1)
function gradAt(S, t) { if (t <= S[0].o) return S[0]; for (let i = 1; i < S.length; i++) if (t <= S[i].o) { const f = (t - S[i - 1].o) / Math.max(1e-6, S[i].o - S[i - 1].o);
  return { c: S[i].c.map((v, k) => S[i - 1].c[k] + (v - S[i - 1].c[k]) * f), a: S[i - 1].a + (S[i].a - S[i - 1].a) * f }; } return S[S.length - 1]; }
// keep the part of a polygon where f(p) >= 0 (f linear: one side of a line)
function clipHalf(P, f) { const out = []; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], fa = f(a), fb = f(b);
  if (fa >= 0) out.push(a); if ((fa >= 0) !== (fb >= 0)) { const t = fa / (fa - fb); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); } } return out; }
const ellipseRing = (E, n = 28) => Array.from({ length: n }, (_, i) => [E.c[0] + E.rx * Math.cos(2 * Math.PI * i / n), E.c[1] + E.ry * Math.sin(2 * Math.PI * i / n)]);
// a polygon cut to a convex one (Sutherland-Hodgman, the clipper counter-clockwise in y-down = area < 0 ... either way: pick by sign)
function clipConvex(P, C) { const s = Math.sign(area(C)) || 1; let out = P;
  for (let i = 0; i < C.length && out.length; i++) { const a = C[i], b = C[(i + 1) % C.length]; out = clipHalf(out, p => s * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]))); } return out; }
const mean = g => { let c = [0, 0, 0], a = 0, w = 0; const S = g.stops; for (let i = 0; i < S.length; i++) { const wt = i === 0 || i === S.length - 1 ? 0.5 : 1; for (let k = 0; k < 3; k++) c[k] += S[i].c[k] * wt * S[i].a; a += S[i].a * wt; w += wt; } return { c: c.map(v => v / Math.max(a, 1e-6)), a: a / w }; };

async function svgShapes(file, o = {}) {
  const tol = o.tol ?? 1.2, grow = o.grow ?? 0.6, bands = o.bands ?? 3, d = await readSvg(file), shapes = [];
  for (const it of d.items) {
    const add = (s, part) => { s.part = it.part; shapes.push(s); };
    // fill
    if (it.fill && it.fo > 0.01) {
      const g = it.fill.grad;
      if (g && g.radial && it.ellipse && g.stops[g.stops.length - 1].a < 0.3) {
        // a glow: see-through disks, one per inner stop, from the outside in
        const E = it.ellipse, S = g.stops;
        for (let i = S.length - 2; i >= 0; i--) { const r = (S[i].o + S[i + 1].o) / 2 || 0.25, f = Math.max(0.25, r);
          add({ k: "disk", x: E.c[0], y: E.c[1], w: 2 * E.rx * f * (i === 0 ? 0.6 : 1), h: 2 * E.ry * f * (i === 0 ? 0.6 : 1), rot: 0, c: S[i].c, a: Math.min(1, 0.45 * S[i].a * it.fo + (i === 0 ? 0.35 : 0)) }); }
      } else {
        const col = g ? mean(g) : it.fill, c = col.c, a = Math.min(1, col.a * it.fo);
        const poly = (P, c, a) => { if (P.length < 3 || Math.abs(area(P)) < 1) return; for (const t of triangulate(P)) for (const s of triToRight(t, c, a, a >= 0.99 ? grow : 0)) add(s); };
        if (it.ellipse && !g) add({ k: "disk", x: it.ellipse.c[0], y: it.ellipse.c[1], w: 2 * it.ellipse.rx, h: 2 * it.ellipse.ry, rot: 0, c, a });
        else for (const r of it.rings) {
          const P = it.ellipse ? ellipseRing(it.ellipse) : simplifyRing(r, tol);
          if (!g || bands < 2) { poly(P, c, a); continue; }
          // shading: the gradient as bands, each the shape clipped (a slab across a linear one, an inner ellipse of a radial one)
          if (g.radial) {
            const at = gradAt(g.stops, 1 - 0.5 / bands); poly(P, at.c, Math.min(1, at.a * it.fo));
            for (let i = bands - 1; i >= 1; i--) { const f = i / bands, at2 = gradAt(g.stops, f - 0.5 / bands);
              poly(clipConvex(P, ellipseRing({ c: g.c, rx: g.rx * f, ry: g.ry * f }, 20)), at2.c, Math.min(1, at2.a * it.fo)); }
          } else {
            const dx = g.p2[0] - g.p1[0], dy = g.p2[1] - g.p1[1], LL = dx * dx + dy * dy || 1;
            for (let i = 0; i < bands; i++) { const t0 = i / bands, t1 = (i + 1) / bands, at = gradAt(g.stops, (t0 + t1) / 2);
              let Q = P; const proj = q => ((q[0] - g.p1[0]) * dx + (q[1] - g.p1[1]) * dy) / LL;
              if (i > 0) Q = clipHalf(Q, q => proj(q) - t0); if (i < bands - 1) Q = clipHalf(Q, q => t1 - proj(q));
              poly(Q, at.c, Math.min(1, at.a * it.fo)); }
          }
        }
      }
    }
    // stroke: a bar per segment of the simplified line
    if (it.stroke && it.so > 0.01 && it.sw > 0.3) {
      const col = it.stroke.grad ? mean(it.stroke.grad) : it.stroke;
      for (const r of it.rings) { const P = rdp(r, tol);
        for (let i = 0; i + 1 < P.length; i++) { const [x1, y1] = P[i], [x2, y2] = P[i + 1], L = Math.hypot(x2 - x1, y2 - y1); if (L < 0.3) continue;
          add({ k: "rect", x: (x1 + x2) / 2, y: (y1 + y2) / 2, w: L + it.sw * 0.9, h: it.sw, rot: Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI, c: col.c, a: Math.min(1, col.a * it.so) }); } }
    }
  }
  return { w: d.W, h: d.H, shapes, parts: [...new Set(shapes.map(s => s.part))] };
}

if (require.main === module) {
  const a = process.argv.slice(2), opt = (n, dflt) => { const i = a.indexOf(n); return i >= 0 ? a[i + 1] : dflt; };
  if (!a[0] || a[0].startsWith("--")) { console.log(fs.readFileSync(__filename, "utf8").split("\n").filter(l => l.startsWith("//")).join("\n")); process.exit(1); }
  (async () => {
    const r = await svgShapes(a[0], { tol: +opt("--tol", 1.2) }), upp = +opt("--upp", 1);
    const gd = PF.toGD(r.shapes, { upp, k: 8, layer: 1 });
    const kinds = {}; for (const s of r.shapes) kinds[s.k] = (kinds[s.k] || 0) + 1;
    console.log(`${path.basename(a[0])}: ${gd.objects.length} objects (${Object.entries(kinds).map(([k, n]) => `${n} ${k}`).join(", ")}), ${Object.keys(gd.channels).length} channels, parts: ${r.parts.join(", ") || "-"}`);
    if (opt("--preview")) { const k = 2, W = r.w * k, H = r.h * k, img = PF.render(PF.fromGD(gd.objects, gd.channels, { upp }).map(s => Object.assign({}, s, { x: s.x * k, y: s.y * k, w: s.w * k, h: s.h * k })), W, H, [40, 8, 8]);
      const px = new Uint8Array(W * H * 4); for (let i = 0; i < W * H; i++) { px[4 * i] = img[3 * i]; px[4 * i + 1] = img[3 * i + 1]; px[4 * i + 2] = img[3 * i + 2]; px[4 * i + 3] = 255; }
      require("./png.js").writePng(opt("--preview"), W, H, px); console.log("preview:", opt("--preview")); }
    if (opt("--json")) fs.writeFileSync(opt("--json"), JSON.stringify(gd));
  })();
}
module.exports = { svgShapes, triangulate, triToRight, simplifyRing };
