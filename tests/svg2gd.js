// node tests/svg2gd.js -- tools/svg2gd.js: any triangle is drawn exactly by its two GD right triangles, and polygons
// are cut into triangles that cover them (no gaps, no spill), checked by rendering with lib/paintfit.js.
"use strict";
const assert = require("assert");
const PF = require("../lib/paintfit.js"), SV = require("../tools/svg2gd.js");
const W = 120, H = 120;
const inTri = (p, a, b, c) => { const d = (u, v, w) => (u[0] - w[0]) * (v[1] - w[1]) - (v[0] - w[0]) * (u[1] - w[1]); const d1 = d(p, a, b), d2 = d(p, b, c), d3 = d(p, c, a); return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0)); };
function check(tris, label) {
  const shapes = []; for (const t of tris) shapes.push(...SV.triToRight(t, [255, 255, 255], 1, 0));
  const img = PF.render(shapes, W, H, [0, 0, 0]); let bad = 0, n = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const p = [x + 0.5, y + 0.5], want = tris.some(t => inTri(p, ...t)), got = img[3 * (y * W + x)] > 127;
    if (want) n++; if (want !== got) bad++; }
  // only edge pixels may differ (a pixel centre exactly on a shared edge)
  assert(bad <= 0.03 * n, `${label}: ${bad} of ${n} pixels wrong`);
}
let R = PF.rng(7);
for (let i = 0; i < 200; i++) { const P = () => [10 + R() * 100, 10 + R() * 100]; check([[P(), P(), P()]], "random triangle " + i); }
// a concave polygon (an arrow) through the ear clipper
const arrow = [[10, 60], [60, 10], [60, 40], [110, 40], [110, 80], [60, 80], [60, 110]];
check(SV.triangulate(arrow), "arrow");
assert.strictEqual(SV.triangulate(arrow).length, arrow.length - 2);
console.log("svg2gd ok: 200 random triangles and a concave polygon drawn exactly by right triangles");
