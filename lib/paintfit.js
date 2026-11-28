// Paint-fit: approximate a picture with a few hundred GD deco shapes (DECOART.md).
// The deco is fitted to a TARGET picture (painted by tools/paintscene.js, or any PNG -- the user's drawing,
// a generated image) the way "primitive" pictures are made: shapes are added one at a time, each one the
// best of many random tries refined by hill climbing, its colour solved exactly for the pixels it covers.
// Shapes are the three flat GD pieces whose outline we know: the square 211 (30 units), the right
// triangle 693 (30 units, rising to the right: right angle at the bottom right) and the disk 497 (50
// units across), each scaled on x and y (keys 128 / 129) and turned (key 6). Smooth shapes, no pixel grid
// (ART.md "Side by side: GDLM 64 vs Dreamy": staircase edges read as low-res).
// Node and browser, no dependencies.
//
//   const PF = require("./paintfit.js");
//   const fit = PF.fit({ w, h, rgb: Float32Array(w*h*3) }, { shapes: 300, seed: 1, kinds: ["rect", "tri", "disk"] });
//   const { objects, channels } = PF.toGD(fit.shapes, { x0, y0, upp: 2.5, ch0: 700, layer: -5, groups: [900] });
//   const img = PF.render(fit.shapes, w, h, fit.bg);   // the fitted picture (Float32 rgb)
(function (root) {
  "use strict";

  function rng(seed) { let s = (seed >>> 0) || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  // ---- shapes, in pixel space (y down). {k: "rect"|"tri"|"disk", x, y (centre), w, h (full size, px),
  // rot (degrees, clockwise on screen as GD's key 6), fx (flip x, tri only), c: [r,g,b], a (alpha 0..1)} ----
  function inside(k, u, v, fx) {          // u, v: local coordinates in [-0.5, 0.5], v down
    if (k === "rect") return u >= -0.5 && u <= 0.5 && v >= -0.5 && v <= 0.5;
    if (k === "disk") return u * u + v * v <= 0.25;
    if (fx) u = -u;                        // tri: corners (-.5,.5) (.5,.5) (.5,-.5): right angle bottom right
    return v <= 0.5 && u <= 0.5 && u + v >= 0;
  }
  // the pixels a shape covers: calls fn(index) for each pixel centre inside it
  function scan(s, W, H, fn) {
    const r = s.rot * Math.PI / 180, cs = Math.cos(r), sn = Math.sin(r);
    const hw = Math.abs(cs) * s.w / 2 + Math.abs(sn) * s.h / 2, hh = Math.abs(sn) * s.w / 2 + Math.abs(cs) * s.h / 2;
    const x0 = Math.max(0, Math.floor(s.x - hw)), x1 = Math.min(W - 1, Math.ceil(s.x + hw));
    const y0 = Math.max(0, Math.floor(s.y - hh)), y1 = Math.min(H - 1, Math.ceil(s.y + hh));
    const iw = 1 / Math.max(s.w, 1e-6), ih = 1 / Math.max(s.h, 1e-6);
    for (let y = y0; y <= y1; y++) {
      const dy = y + 0.5 - s.y;
      for (let x = x0; x <= x1; x++) {
        const dx = x + 0.5 - s.x;
        // screen = R * local (R turns clockwise on a y-down screen) -> local = R^T * screen
        const u = (cs * dx + sn * dy) * iw, v = (-sn * dx + cs * dy) * ih;
        if (inside(s.k, u, v, s.fx)) fn(y * W + x);
      }
    }
  }
  function paint(img, W, H, s) {
    const a = s.a, b = 1 - a, c = s.c;
    scan(s, W, H, i => { const j = 3 * i; img[j] = img[j] * b + c[0] * a; img[j + 1] = img[j + 1] * b + c[1] * a; img[j + 2] = img[j + 2] * b + c[2] * a; });
  }
  function render(shapes, W, H, bg) {
    const img = new Float32Array(W * H * 3);
    for (let i = 0; i < W * H; i++) { img[3 * i] = bg[0]; img[3 * i + 1] = bg[1]; img[3 * i + 2] = bg[2]; }
    for (const s of shapes) paint(img, W, H, s);
    return img;
  }

  // ---- the fit ----
  // target {w, h, rgb: Float32Array (0..255)}, optional weight Float32Array(w*h) (more weight = more detail there).
  // o: shapes (default 300), tries (random starts per shape, 120), climb (mutations without gain before stopping, 60),
  // kinds, alphas ([0.5, 0.8, 1]), seed, minSize (px), bg ([r,g,b] or null = the mean), onShape(i, n, err)
  function fit(target, o = {}) {
    const W = target.w, H = target.h, T = target.rgb, N = W * H, R = rng(o.seed || 1);
    // target.mask (Uint8Array, 1 = part of the picture): a sprite on nothing. Pixels outside it are never scored, and a
    // shape may spill over at most o.leak (default 0.06) of its pixels there -- so a creature's edge stays its own, and
    // o.bg is what is behind it in the level (the empty inside starts as that colour, so shapes must cover it).
    const Wt = target.weight || null, M = target.mask || null, leak = o.leak ?? 0.06, kinds = o.kinds || ["rect", "tri", "disk"], alphas = o.alphas || [0.5, 0.8, 1];
    const n = o.shapes ?? 300, tries = o.tries ?? 120, climb = o.climb ?? 60, minS = o.minSize ?? 2;
    let bg = o.bg;
    if (!bg) { bg = [0, 0, 0]; if (M) throw new Error("paintfit: a masked fit needs o.bg (the colour behind the sprite)"); for (let i = 0; i < N; i++) for (let k = 0; k < 3; k++) bg[k] += T[3 * i + k] / N; }
    const cur = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) for (let k = 0; k < 3; k++) cur[3 * i + k] = bg[k];
    const idx = new Int32Array(N);
    // try a shape: its best colour for its alpha, and the change in error if it were painted
    function score(s) {
      let m = 0, sr = 0, sg = 0, sb = 0, sw = 0;
      const a = s.a, b = 1 - a;
      let out = 0;
      scan(s, W, H, i => { if (M && !M[i]) out++; else idx[m++] = i; });
      if (m < 2 || (M && out > leak * (m + out))) return Infinity;
      for (let q = 0; q < m; q++) { const i = idx[q], j = 3 * i, w = Wt ? Wt[i] : 1;
        sr += w * (T[j] - b * cur[j]); sg += w * (T[j + 1] - b * cur[j + 1]); sb += w * (T[j + 2] - b * cur[j + 2]); sw += w; }
      const c = [clamp(sr / sw / a, 0, 255), clamp(sg / sw / a, 0, 255), clamp(sb / sw / a, 0, 255)];
      let d = 0;
      for (let q = 0; q < m; q++) { const i = idx[q], j = 3 * i, w = Wt ? Wt[i] : 1;
        for (let k = 0; k < 3; k++) { const old = cur[j + k] - T[j + k], nw = b * cur[j + k] + a * c[k] - T[j + k]; d += w * (nw * nw - old * old); } }
      s.c = c; return d;
    }
    const maxS = o.maxSize ?? Math.max(W, H) * 0.7;
    function randomShape() {
      const k = kinds[Math.floor(R() * kinds.length)], sz = minS + Math.pow(R(), 2) * (maxS - minS);
      return { k, x: R() * W, y: R() * H, w: sz * (0.4 + R() * 1.2), h: sz * (0.4 + R() * 1.2), rot: k === "disk" && R() < 0.5 ? 0 : (R() - 0.5) * 180,
        fx: R() < 0.5, a: alphas[Math.floor(R() * alphas.length)] };
    }
    function mutate(s) {
      const t = Object.assign({}, s), j = Math.floor(R() * 5), sc = Math.max(4, (s.w + s.h) / 6);
      if (j === 0) { t.x += (R() - 0.5) * sc * 2; t.y += (R() - 0.5) * sc * 2; }
      else if (j === 1) t.w = Math.max(minS, t.w * (0.7 + R() * 0.6));
      else if (j === 2) t.h = Math.max(minS, t.h * (0.7 + R() * 0.6));
      else if (j === 3) t.rot += (R() - 0.5) * 40;
      else { t.w = Math.max(minS, t.w * (0.8 + R() * 0.4)); t.h = Math.max(minS, t.h * (0.8 + R() * 0.4)); }
      return t;
    }
    const shapes = [];
    for (let si = 0; si < n; si++) {
      let best = null, bd = Infinity;
      for (let t = 0; t < tries; t++) { const s = randomShape(), d = score(s); if (d < bd) { bd = d; best = s; } }
      for (let fails = 0; fails < climb;) { const s = mutate(best), d = score(s); if (d < bd) { bd = d; best = s; fails = 0; } else fails++; }
      if (!(bd < 0)) continue;
      score(best); paint(cur, W, H, best); shapes.push(best);
      if (o.onShape) o.onShape(si, n, best);
    }
    return { shapes, bg, w: W, h: H, error: M ? rmseMask(cur, T, M) : rmse(cur, T) };
  }
  function rmseMask(a, b, M) { let e = 0, n = 0; for (let i = 0; i < M.length; i++) if (M[i]) { for (let k = 0; k < 3; k++) { const d = a[3 * i + k] - b[3 * i + k]; e += d * d; } n += 3; } return Math.sqrt(e / Math.max(1, n)); }
  function rmse(a, b) { let e = 0; for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; e += d * d; } return Math.sqrt(e / a.length); }

  // ---- colour helpers (GD's HSV: hue added in degrees, saturation and value multiplied) ----
  function rgb2hsv(c) {
    const r = c[0] / 255, g = c[1] / 255, b = c[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0;
    if (d > 1e-6) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [(h * 60 + 360) % 360, mx > 1e-6 ? d / mx : 0, mx];
  }
  function hsv2rgb(h, s, v) {
    const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c, k = Math.floor(((h % 360) + 360) % 360 / 60);
    const [r, g, b] = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][k];
    return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
  }
  // k-means on colours (deterministic start: spread picks)
  function kmeans(cols, k, iters = 12) {
    if (cols.length <= k) return { cent: cols.map(c => c.slice()), lab: cols.map((_, i) => i) };
    let cent = []; for (let i = 0; i < k; i++) cent.push(cols[Math.floor((i + 0.5) * cols.length / k)].slice());
    let lab = new Array(cols.length).fill(0);
    for (let it = 0; it < iters; it++) {
      lab = cols.map(c => { let bi = 0, bd = Infinity; cent.forEach((m, i) => { const d = (c[0] - m[0]) ** 2 + (c[1] - m[1]) ** 2 + (c[2] - m[2]) ** 2; if (d < bd) { bd = d; bi = i; } }); return bi; });
      cent = cent.map((m, i) => { const mem = cols.filter((_, j) => lab[j] === i); if (!mem.length) return m;
        return [0, 1, 2].map(q => mem.reduce((s, c) => s + c[q], 0) / mem.length); });
    }
    return { cent, lab };
  }

  // ---- to GD objects ----
  // shapes (pixel space) -> deco objects. o: x0, y0 = GD units of the picture's top-left corner; upp = units per pixel;
  // ch0 = first colour channel (k per alpha level), k (base colours per alpha, default 6), layer (key 24 number,
  // default -5 = B5), zo0 (first z order), groups, bgCh (put the background as one big square on this channel: null =
  // leave the bg to the level), blend (true = the channels blend). Each shape's exact colour is its base channel's
  // colour turned by an HSV shift (keys 41 / 43): hue added, saturation and value multiplied (0..2).
  const SPR = { rect: { id: 211, u: 30 }, tri: { id: 693, u: 30 }, disk: { id: 497, u: 50 } };
  function toGD(shapes, o = {}) {
    const upp = o.upp || 2.5, x0 = o.x0 || 0, y0 = o.y0 || 0, k = o.k || 6, ch0 = o.ch0 || 700, layer = o.layer ?? -5;
    const levels = [...new Set(shapes.map(s => s.a))].sort((a, b) => a - b), channels = {}, objects = [];
    const base = new Map();
    levels.forEach((a, li) => {
      const mine = shapes.filter(s => s.a === a), km = kmeans(mine.map(s => s.c), k);
      km.cent.forEach((c, i) => {
        // the base colour: the members' mean hue, their highest saturation and value (so the HSV multipliers stay <= 1 mostly)
        const hs = mine.filter((_, j) => km.lab[j] === i).map(s => rgb2hsv(s.c));
        if (!hs.length) return;
        const v = Math.max(...hs.map(h => h[2])), sat = Math.max(...hs.map(h => h[1]));
        const hue = rgb2hsv(c)[0], ch = ch0 + li * k + i;
        channels[ch] = { rgb: hsv2rgb(hue, Math.min(1, sat), Math.min(1, v)).map(Math.round), opacity: a, blend: !!o.blend };
      });
      mine.forEach((s, j) => base.set(s, ch0 + li * k + km.lab[j]));
    });
    const zo0 = o.zo0 ?? -40, band = Math.max(1, Math.ceil(shapes.length / 80));
    shapes.forEach((s, i) => {
      const ch = base.get(s), b = channels[ch], hb = rgb2hsv(b.rgb), hs = rgb2hsv(s.c), spr = SPR[s.k];
      let dh = hs[0] - hb[0]; if (dh > 180) dh -= 360; if (dh < -180) dh += 360;
      const ds = hb[1] > 0.02 ? clamp(hs[1] / hb[1], 0, 2) : 1, dv = hb[2] > 0.02 ? clamp(hs[2] / hb[2], 0, 2) : 1;
      const p = { 21: String(ch), 24: String(layer), 25: String(zo0 + Math.floor(i / band)), 128: (s.w * upp / spr.u).toFixed(3), 129: (s.h * upp / spr.u).toFixed(3) };
      if (Math.abs(dh) > 0.5 || Math.abs(ds - 1) > 0.01 || Math.abs(dv - 1) > 0.01) { p[41] = "1"; p[43] = `${Math.round(dh)}a${ds.toFixed(2)}a${dv.toFixed(2)}a0a0`; }
      if (o.groups && o.groups.length) p[57] = o.groups.join(".");
      objects.push({ id: spr.id, x: +(x0 + s.x * upp).toFixed(2), y: +(y0 - s.y * upp).toFixed(2), rot: +(((s.rot % 360) + 360) % 360).toFixed(2), flipX: !!(s.k === "tri" && s.fx), flipY: false, props: p });
    });
    return { objects, channels };
  }
  // the colour a GD object shows (base channel + its HSV): to check toGD against the fit
  function gdColour(o, channels) {
    const b = channels[+o.props[21]]; if (!b) return null;
    if (o.props[41] !== "1") return b.rgb.slice();
    const [dh, ds, dv] = String(o.props[43]).split("a").map(Number), h = rgb2hsv(b.rgb);
    return hsv2rgb(h[0] + dh, clamp(h[1] * ds, 0, 1), clamp(h[2] * dv, 0, 1));
  }
  // GD objects back to pixel shapes (for previews of a level window): o: x0, y0, upp as for toGD
  function fromGD(objects, channels, o = {}) {
    const upp = o.upp || 2.5, x0 = o.x0 || 0, y0 = o.y0 || 0, out = [];
    const K = { 211: "rect", 693: "tri", 497: "disk" };
    for (const ob of objects) { const k = K[ob.id]; if (!k) continue; const p = ob.props || {}, u = k === "disk" ? 50 : 30, s = +(p[32] || 1);
      const c = gdColour(ob, channels); if (!c) continue;
      out.push({ k, x: (ob.x - x0) / upp, y: (y0 - ob.y) / upp, w: +(p[128] || 1) * s * u / upp, h: +(p[129] || 1) * s * u / upp, rot: ob.rot || 0, fx: !!ob.flipX, c, a: channels[+p[21]].opacity ?? 1 }); }
    return out;
  }

  const API = { rng, scan, paint, render, fit, rmse, toGD, fromGD, gdColour, rgb2hsv, hsv2rgb, kmeans, SPR };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else (root.GD = root.GD || {}).PAINTFIT = API;
})(typeof self !== "undefined" ? self : this);
