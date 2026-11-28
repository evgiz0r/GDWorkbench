// node tools/artlab.js raster [--out local/artlab]                                          -> art/src/*.svg to PNGs (headless Chromium)
// node tools/artlab.js convert <sprite.png> [--shapes 150,300,600] [--px 4,8] [--out dir]   -> each method's objects, rmse, previews
// node tools/artlab.js demon [--out dir]                                                     -> the hand-built demon head, preview
// node tools/artlab.js level [--out levels/lab/gdlm_art_lab.gdlvl]                            -> the animated test level (auto, 16 s)
//
// ART LAB (ART.md "Creatures and animation"): how well can we turn art into GD objects, and move it? (Evgeni 2026-11-28, for
// Hellgate's gate ending: "a dragon flying or a demon looking from within the door ... a demon approaches and we shut the
// gate on him".) Three ways, measured on the same original art (art/src/*.svg, ours -- never copyrighted pictures):
//   1. HAND   a creature written as GD's flat shapes in code (square 211, right triangle 693, disk 497, scaled and turned),
//             parts in their own groups (eyes, jaw, wing) so triggers can move them.
//   2. FIT    any PNG with alpha -> masked shape fitting (lib/paintfit.js with target.mask: shapes stay inside the sprite,
//             the empty inside starts as the level's sky, so shapes must cover it) -> objects with base channels + HSV.
//   3. PIXEL  any PNG -> merged pixel rectangles (lib/pixelart.js via tools/pixelart.js), the old way, for comparison.
// Previews are the objects drawn back (PF.fromGD -> render): what the objects are, not the source picture.
// The level puts them in three stations with move / rotate / alpha / colour / camera-offset triggers (tools/effects.js):
// a dragon flying across the sky flapping, a demon's eyes then face appearing in a dark doorway, and a demon climbing
// into a gate that slams shut on him with a red flash, a shake and sparks. Rendered by tools/shoot.js (cloud: no GD art,
// so it is the art-free look; on the PC with GD art).
"use strict";
const fs = require("fs"), path = require("path");
const PF = require("../lib/paintfit.js"), PX = require("./pixelart.js"), { readPng, writePng } = require("./png.js");
const ROOT = path.join(__dirname, "..");
const args = process.argv.slice(2), opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };

// ------------------------------------------------------------------ pictures
// a PNG with alpha -> {w, h, rgb (Float32, colour over black where empty), mask}, box-shrunk to about `W` px wide
function sprite(file, W) {
  const { w, h, rgba } = readPng(file), f = Math.max(1, w / W), ow = Math.round(w / f), oh = Math.round(h / f);
  const rgb = new Float32Array(ow * oh * 3), mask = new Uint8Array(ow * oh);
  for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) {
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let yy = Math.floor(y * f); yy < Math.min(h, Math.floor((y + 1) * f)); yy++) for (let xx = Math.floor(x * f); xx < Math.min(w, Math.floor((x + 1) * f)); xx++) {
      const i = (yy * w + xx) * 4, al = rgba[i + 3] / 255; r += rgba[i] * al; g += rgba[i + 1] * al; b += rgba[i + 2] * al; a += al; n++; }
    const j = y * ow + x; mask[j] = a / n >= 0.5 ? 1 : 0;
    if (a > 0) { rgb[3 * j] = r / a; rgb[3 * j + 1] = g / a; rgb[3 * j + 2] = b / a; }
  }
  return { w: ow, h: oh, rgb, mask, scale: f };
}
// the objects drawn back over a background, `ppx` output pixels per sprite pixel -> PNG; returns the rmse on the mask
function drawBack(objects, channels, o) {
  const shapes = PF.fromGD(objects, channels, { upp: o.upp, x0: o.x0 || 0, y0: o.y0 || 0 });
  const k = o.ppx || 3, W = o.w * k, H = o.h * k;
  const big = PF.render(shapes.map(s => Object.assign({}, s, { x: s.x * k, y: s.y * k, w: s.w * k, h: s.h * k })), W, H, o.bg);
  if (o.file) { const img = new Uint8Array(W * H * 4); for (let i = 0; i < W * H; i++) { img[4 * i] = big[3 * i]; img[4 * i + 1] = big[3 * i + 1]; img[4 * i + 2] = big[3 * i + 2]; img[4 * i + 3] = 255; } writePng(o.file, W, H, img); }
  let err = null, spill = 0;
  if (o.target) {
    const small = PF.render(shapes, o.w, o.h, o.bg), T = o.target; let e = 0, n = 0, out = 0, cov = 0;
    for (let i = 0; i < o.w * o.h; i++) {
      const d = [0, 1, 2].map(q => small[3 * i + q] - (T.mask[i] ? T.rgb[3 * i + q] : o.bg[q]));
      if (T.mask[i]) { e += d[0] * d[0] + d[1] * d[1] + d[2] * d[2]; n += 3; }
      else { out++; if (Math.abs(d[0]) + Math.abs(d[1]) + Math.abs(d[2]) > 30) cov++; }
    }
    err = Math.sqrt(e / n); spill = cov / Math.max(1, out);
  }
  return { err, spill };
}
// a PNG shrunk to W px wide (box filter, alpha kept) as {w, h, rgba} for lib/pixelart.js
function shrinkRgba(file, W) {
  const T = sprite(file, W), rgba = new Uint8Array(T.w * T.h * 4);
  for (let i = 0; i < T.w * T.h; i++) { rgba[4 * i] = T.rgb[3 * i]; rgba[4 * i + 1] = T.rgb[3 * i + 1]; rgba[4 * i + 2] = T.rgb[3 * i + 2]; rgba[4 * i + 3] = T.mask[i] ? 255 : 0; }
  return { w: T.w, h: T.h, rgba };
}
const countCh = objs => new Set(objs.map(o => o.props[21])).size;

// FIT: masked shape fitting -> GD objects. o: shapes, upp (units per sprite px), bg, layer, ch0, groups, seed, zo0
function fitSprite(T, o) {
  const fit = PF.fit({ w: T.w, h: T.h, rgb: T.rgb, mask: T.mask }, { shapes: o.shapes, seed: o.seed || 1, bg: o.bg, tries: o.tries ?? 100, climb: o.climb ?? 50,
    alphas: o.alphas || [1, 1, 0.8], leak: o.leak ?? 0.05, maxSize: Math.max(T.w, T.h) * 0.6 });
  const gd = PF.toGD(fit.shapes, { upp: o.upp, x0: o.x0 || 0, y0: o.y0 || 0, ch0: o.ch0 || 850, k: o.k || 6, layer: o.layer ?? 1, groups: o.groups, zo0: o.zo0 });
  return Object.assign(gd, { fit });
}

// ------------------------------------------------------------------ 1. HAND: the demon head as shapes, in the 300 x 300 frame of art/src/demon_face.svg
// each part: [kind, x, y, w, h, rot, rgb, alpha, part] (pixel space, y down; rot clockwise; tri = right angle bottom right, fx flips)
const SKIN = [150, 30, 18], SKIN_D = [96, 18, 12], SKIN_L = [205, 62, 34], DARK = [42, 6, 5], BONE = [230, 210, 166], BONE_D = [178, 154, 110],
  EYE = [255, 242, 160], GLOW = [255, 170, 30], TOOTH = [242, 230, 200], MOUTH = [26, 2, 2];
function demonShapes() {
  const S = [], P = (k, x, y, w, h, rot, c, a = 1, part = "head", fx = false) => S.push({ k, x, y, w, h, rot, c, a, part, fx });
  // a bar from (x1,y1) to (x2,y2), `w` thick (a rect turned along it; GD's turn is clockwise on screen = atan2 on y-down)
  const seg = (x1, y1, x2, y2, w, c, part, over = 2) => { const L = Math.hypot(x2 - x1, y2 - y1) + over; P("rect", (x1 + x2) / 2, (y1 + y2) / 2, L, w, Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI, c, 1, part); };
  // a V pointing down: two right triangles meeting at x = cx, from y0 (top) to the tip at y0 + h, half-width hw
  const vee = (cx, y0, hw, h, c, part) => { P("tri", cx + hw / 2, y0 + h / 2, hw, h, 180, c, 1, part, false); P("tri", cx - hw / 2, y0 + h / 2, hw, h, 180, c, 1, part, true); };
  // horns: a curve of bars, thinning, dark underside then light top (left horn; the right one mirrored)
  const H = [[104, 100], [86, 84], [72, 64], [62, 42], [57, 22], [56, 8]], Wd = [30, 25, 20, 15, 10, 6];
  for (const m of [1, -1]) {
    const X = x => 150 + m * (x - 150);
    for (let i = 0; i < H.length - 1; i++) seg(X(H[i][0]) + 3 * m, H[i][1] + 3, X(H[i + 1][0]) + 3 * m, H[i + 1][1] + 3, Wd[i], BONE_D, "horn");
    for (let i = 0; i < H.length - 1; i++) seg(X(H[i][0]), H[i][1], X(H[i + 1][0]), H[i + 1][1], Wd[i] * 0.72, BONE, "horn");
  }
  // head: a dark rim, then the skin (round skull, jaw, pointed chin), a lit forehead and cheeks
  P("disk", 150, 150, 188, 172, 0, DARK); P("disk", 150, 204, 148, 124, 0, DARK); vee(150, 200, 70, 84, DARK);
  P("disk", 150, 150, 178, 162, 0, SKIN_D); P("disk", 150, 204, 138, 114, 0, SKIN_D); vee(150, 200, 64, 76, SKIN_D);
  P("disk", 150, 142, 148, 126, 0, SKIN); P("disk", 150, 196, 108, 92, 0, SKIN);
  P("disk", 150, 116, 92, 54, 0, SKIN_L, 0.75); P("disk", 108, 196, 26, 18, 0, SKIN_L, 0.5); P("disk", 192, 196, 26, 18, 0, SKIN_L, 0.5);
  // brow: two slabs meeting in a V over the nose
  seg(78, 128, 150, 150, 16, DARK, "head"); seg(222, 128, 150, 150, 16, DARK, "head");
  // eye sockets, the glow (see-through disks), slit eyes
  seg(90, 160, 134, 170, 20, DARK, "eyes"); seg(210, 160, 166, 170, 20, DARK, "eyes");
  for (const x of [112, 188]) P("disk", x, 166, 52, 30, 0, GLOW, 0.3, "glow");
  P("tri", 115, 167, 38, 11, 8, EYE, 1, "eyes", true); P("tri", 185, 167, 38, 11, -8, EYE, 1, "eyes", false);
  // nose
  vee(150, 190, 9, 13, DARK, "head");
  // mouth: a wide dark grin with the corners up, then the teeth
  P("disk", 150, 232, 116, 46, 0, MOUTH, 1, "jaw"); seg(96, 214, 112, 230, 10, MOUTH, "jaw"); seg(204, 214, 188, 230, 10, MOUTH, "jaw");
  for (let i = 0; i < 6; i++) { const x = 109 + i * 16.4; vee(x, 216, 7, 15, TOOTH, "jaw"); }
  for (let i = 0; i < 4; i++) { const x = 124 + i * 17.5; P("tri", x + 3.2, 246, 6.4, 10, 0, TOOTH, 1, "jaw", true); P("tri", x - 3.2, 246, 6.4, 10, 0, TOOTH, 1, "jaw", false); }
  return S;
}
// hand shapes -> GD objects, one group per part; o: upp, x0, y0 (where the frame's top-left goes), layer, ch0, groups {part: g}, all
function demonObjects(o) {
  const S = demonShapes(), out = { objects: [], channels: {} };
  const parts = [...new Set(S.map(s => s.part))];
  let ch = o.ch0 || 870;
  // one toGD per part keeps each part's objects in their own group; channels: the parts share the base colours by value
  const shared = {};
  S.forEach((s, i) => s.i = i);
  for (const part of parts) {
    const mine = S.filter(s => s.part === part);
    const gd = PF.toGD(mine, { upp: o.upp, x0: o.x0, y0: o.y0, ch0: ch, k: 8, layer: o.layer ?? 1, zo0: (o.zo0 ?? -40), groups: [o.all, o.groups && o.groups[part]].filter(Boolean) });
    // keep the drawing order across parts: z order = the shape's index in the full list
    gd.objects.forEach((ob, j) => { ob.props[25] = String((o.zo0 ?? -40) + mine[j].i); });
    // merge equal channels
    const remap = {};
    for (const [c, d] of Object.entries(gd.channels)) { const key = d.rgb.join(",") + "|" + d.opacity; if (!shared[key]) { shared[key] = ch++; out.channels[shared[key]] = d; } remap[c] = shared[key]; }
    for (const ob of gd.objects) { ob.props[21] = String(remap[ob.props[21]]); out.objects.push(ob); }
    ch = Math.max(ch, ...Object.values(shared)) + 1;
  }
  return out;
}

// ------------------------------------------------------------------ commands
function cmdConvert(file, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const base = path.basename(file, ".png"), bg = [40, 8, 8], rows = [];
  const T = sprite(file, 160);
  const upp = 2;   // units per work pixel (the lab level's size is set there; here only relative)
  for (const n of String(opt("--shapes", "100,200,400")).split(",").map(Number)) {
    const t0 = Date.now(), r = fitSprite(T, { shapes: n, upp, bg });
    const d = drawBack(r.objects, r.channels, { upp, w: T.w, h: T.h, bg, target: T, file: path.join(outDir, `${base}_fit${n}.png`) });
    rows.push({ method: `fit ${n}`, objects: r.objects.length, channels: countCh(r.objects), rmse: +d.err.toFixed(1), spill: +(100 * d.spill).toFixed(1), secs: +((Date.now() - t0) / 1000).toFixed(1), png: `${base}_fit${n}.png` });
  }
  for (const pw of String(opt("--px", "40,80")).split(",").map(Number)) {
    const t0 = Date.now(), res = PX.convert(shrinkRgba(file, pw), { width: pw / 8, colours: 8, anchor: "topleft" });
    // pixelart objects are 211 squares; draw them back in the same frame: its pixel = (300 / pw) source px
    const ch = {}; for (const [c, rgb] of Object.entries(res.colours)) ch[c] = { rgb, opacity: 1 };
    // pixelart crops to the picture's content: line its box up with the mask's box in the work frame
    let bx0 = T.w, bx1 = 0, by0 = T.h; for (let i = 0; i < T.w * T.h; i++) if (T.mask[i]) { const x = i % T.w, y = (i / T.w) | 0; bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x + 1); by0 = Math.min(by0, y); }
    const uppP = res.px * pw / T.w;   // units per grid px x grid px per work px
    const xs = res.objects.map(o => o.x - +(o.props[128] || 1) * 15), ys = res.objects.map(o => o.y + +(o.props[129] || 1) * 15);
    const d = drawBack(res.objects, ch, { upp: uppP, x0: Math.min(...xs) - bx0 * uppP, y0: Math.max(...ys) + by0 * uppP, w: T.w, h: T.h, bg, target: T, file: path.join(outDir, `${base}_px${pw}.png`) });
    rows.push({ method: `pixel ${pw} px wide`, objects: res.count, channels: Object.keys(res.colours).length, rmse: +d.err.toFixed(1), spill: +(100 * d.spill).toFixed(1), secs: +((Date.now() - t0) / 1000).toFixed(1), png: `${base}_px${pw}.png` });
  }
  return rows;
}
function cmdDemon(outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const r = demonObjects({ upp: 1, x0: 0, y0: 0 }), bg = [40, 8, 8];
  const T = sprite(path.join(outDir, "demon_face.png"), 300);
  const d = drawBack(r.objects, r.channels, { upp: 1, w: 300, h: 300, ppx: 2, bg, target: T, file: path.join(outDir, "demon_hand.png") });
  return { method: "hand", objects: r.objects.length, channels: Object.keys(r.channels).length, rmse: +d.err.toFixed(1), spill: +(100 * d.spill).toFixed(1), png: "demon_hand.png" };
}

// ------------------------------------------------------------------ the animated lab level
async function cmdLevel(out, srcDir) {
  const SV = require("./svg2gd.js");
  const { GD, writeGdlvl } = require("./io.js"), FX = require("./effects.js"), K = require("./scenekit.js"), T = FX.T, E = FX.E;
  const objStr = o => { let s = `1,${o.id},2,${(+o.x).toFixed(2)},3,${(+o.y).toFixed(2)}`; if (o.flipX) s += ",4,1"; if (o.flipY) s += ",5,1"; if (o.rot) s += ",6," + o.rot;
    for (const [k, v] of Object.entries(o.props || {})) if (!["1", "2", "3", "4", "5", "6"].includes(k)) s += `,${k},${v}`; return s; };
  const LEN = 17, endX = LEN * 311.58 + 300;
  const levelStr = (h, objs) => h + ";" + objs.map(objStr).join(";") + ";";
  let header = K.channels(GD.DEFAULT_HEADER, { 1000: { rgb: [46, 8, 8] }, 1001: { rgb: [30, 6, 6] }, 1002: { rgb: [120, 30, 14] }, 1009: { rgb: [36, 7, 7] }, 1013: { rgb: [40, 8, 8] }, 1014: { rgb: [40, 8, 8] } });
  const far = [{ id: 1764, x: endX, y: 1500, props: {} }];
  const lv0 = GD.parseLevel(levelStr(header, far)), run = GD.run(GD.makeWorld(lv0.objects, lv0.header), []);
  const ctx = FX.context({ path: run.path, group0: 3601, ch0: 840 });
  const objs = [], add = a => { for (const o of a) objs.push(o); };
  const D = (id, x, y, o) => K.obj(id, x, y, o);
  const sky = [46, 8, 8];
  const merge = (a, b) => Object.assign(a, b);
  let channels = {};

  // ---- station A (1.0 - 5.0 s): the dragon flies right to left across the sky, flapping
  {
    const t0 = 1.0, dur = 3.6, x0 = ctx.xAt(t0), gAll = ctx.group(), gWing = ctx.group(), gHinge = ctx.group();
    // the dragon from its SVG (tools/svg2gd.js: exact shapes, gradients as 3 bands), 0.7 units an art px: 280 units = 9 blocks
    const upp = 0.7, left = x0 + 380, top = 262;
    const vb = await SV.svgShapes(path.join(ROOT, "art", "src", "dragon_body.svg")), vw = await SV.svgShapes(path.join(ROOT, "art", "src", "dragon_wing.svg"));
    const body = PF.toGD(vb.shapes, { upp, x0: left, y0: top, layer: -1, ch0: 850, k: 6, groups: [gAll], zo0: -40 });
    const wing = PF.toGD(vw.shapes, { upp, x0: left, y0: top, layer: -1, ch0: 858, k: 3, groups: [gAll, gWing], zo0: 40 });
    add(body.objects); add(wing.objects); merge(channels, body.channels); merge(channels, wing.channels);
    // the wing's hinge: an invisible object at the wing root (art 160,112) in the dragon's group
    add([D(211, left + 160 * upp, top - 112 * upp, { s: 0.01, groups: [gAll, gHinge] })]);
    add([T.lockCamera(x0 - 30, gAll, dur + 0.6, { y: false }), T.move(x0, gAll, -1150, 0, dur, 0)]);
    add([T.move(x0, gAll, 0, -50, dur / 2, E.settle), T.move(ctx.xAt(t0 + dur / 2), gAll, 0, 60, dur / 2, E.settle)]);
    for (let t = t0, k = 0; t < t0 + dur; t += 0.3, k++) add([T.rotate(ctx.xAt(t), gWing, k % 2 ? -34 : 34, 0.3, { centre: gHinge, ease: E.settle })]);
    ctx.stationA = { method: "svg vector", objects: body.objects.length + wing.objects.length };
  }

  // ---- station B (5.6 - 10.4 s): a dark doorway; two eyes light up, then the face comes out of the dark and looks around
  {
    const t0 = 5.6, dur = 4.8, x0 = ctx.xAt(t0), gAll = ctx.group(), gFace = ctx.hideAtStart(ctx.group()), gEyes = ctx.hideAtStart(ctx.group()), gGlow = ctx.hideAtStart(ctx.group()), gJaw = ctx.group(), gHead = ctx.group();
    const cx = x0 + 100, chS = ctx.channel([70, 66, 74]), chS2 = ctx.channel([40, 38, 44]), chV = ctx.channel([4, 2, 2]), chL = ctx.channel([255, 90, 20], { blend: true, opacity: 0.5 });
    // the doorway: black opening on B3, stone frame and arch on B1 (in front of the demon's horns)
    add([D(211, cx, 150, { ch: chV, z: "B3", zo: -60, sx: 6, sy: 8.6, groups: [gAll] })]);
    for (let i = 0; i < 9; i++) for (const sx of [-1, 1]) add([D(211, cx + sx * 105, 15 + i * 30, { ch: i % 2 ? chS : chS2, z: "B1", sx: 1.1, sy: 1, groups: [gAll] })]);
    for (let a = 0; a <= 8; a++) { const ang = Math.PI * a / 8; add([D(211, cx - Math.cos(ang) * 105, 270 + Math.sin(ang) * 50, { ch: a % 2 ? chS : chS2, z: "B1", sx: 1.1, sy: 1, rot: +(90 - a * 22.5).toFixed(1), groups: [gAll] })]); }
    add([D(1293, cx, 8, { ch: chL, z: "B2", zo: 50, sx: 12, sy: 1.2, groups: [gAll] })]);   // the hellish light on the threshold
    // the hand-built demon, 0.7 units a px (210 units = 7 blocks), inside the doorway, sunk a little
    const dm = demonObjects({ upp: 0.5, x0: cx - 75, y0: 212, layer: 1, ch0: 870, all: gAll, groups: { head: gFace, horn: gFace, jaw: gJaw, eyes: gEyes, glow: gGlow } });
    for (const ob of dm.objects) { const g = String(ob.props[57]).split("."); if (g.includes(String(gJaw))) ob.props[57] += "." + gFace; ob.props[57] += "." + gHead; }
    add(dm.objects); merge(channels, dm.channels);
    add([D(211, cx, 150, { s: 0.01, groups: [gAll, gHead] })]);   // the head's turning centre (in gHead so it moves with it)
    const gPivot = ctx.group(); add([D(211, cx, 140, { s: 0.01, groups: [gAll, gPivot] })]);
    add([T.lockCamera(x0 - 30, gAll, dur + 0.4, { y: false })]);
    const at = t => ctx.xAt(t0 + t);
    add([T.alpha(at(0.4), gGlow, 1, 0.6), T.alpha(at(0.5), gEyes, 1, 0.3)]);           // the eyes first
    add([T.alpha(at(1.4), gFace, 1, 1.4), T.move(at(1.4), gHead, 0, 24, 1.4, E.settle)]); // the face out of the dark, rising
    add([T.rotate(at(2.9), gHead, -9, 0.5, { centre: gPivot, ease: E.settle }), T.rotate(at(3.5), gHead, 18, 0.6, { centre: gPivot, ease: E.settle }), T.rotate(at(4.15), gHead, -9, 0.3, { centre: gPivot, ease: E.settle })]);
    add([T.move(at(3.2), gJaw, 0, -8, 0.25, E.pop), T.move(at(3.9), gJaw, 0, 8, 0.3, E.settle)]); // the grin opens a little
    add([T.alpha(at(4.4), gGlow, 0, 0.3), T.alpha(at(4.4), gEyes, 0, 0.3), T.alpha(at(4.4), gFace, 0, 0.35)]);
    ctx.stationB = { method: "hand", objects: dm.objects.length };
  }

  // ---- station C (11.0 - 16.0 s): a demon climbs up into the gate; the doors slam shut on him: flash, shake, sparks
  {
    const t0 = 11.0, x0 = ctx.xAt(t0), cx = x0 + 90, gAll = ctx.hideAtStart(ctx.group()), gL = ctx.group(), gR = ctx.group(), gDem = ctx.hideAtStart(ctx.group()), gSpark = ctx.hideAtStart(ctx.group()), gSeam = ctx.hideAtStart(ctx.group());
    const at = t => ctx.xAt(t0 + t), slam = 3.0;
    const chDoor = ctx.channel([34, 10, 8]), chRib = ctx.channel([80, 22, 12]), chStud = ctx.channel([150, 120, 80]), chGlow = ctx.channel([255, 80, 10], { blend: true, opacity: 0.7 }), chV = ctx.channel([6, 2, 2]);
    add([D(211, cx, 150, { ch: chV, z: "B4", zo: -60, sx: 9, sy: 10, groups: [gAll] })]);   // the dark beyond the gate
    // the demon (converted from the PNG: the FIT method), small, low in the opening
    const Tm = sprite(path.join(srcDir, "demon_face.png"), 150);
    const dm = fitSprite(Tm, { shapes: 220, upp: 1.1, bg: [6, 2, 2], x0: cx - 82, y0: 90, layer: -1, ch0: 880, k: 6, groups: [gAll, gDem], zo0: -40 });
    add(dm.objects); merge(channels, dm.channels);
    // two door leaves (B1, in front): 4.5 blocks wide each, open at the screen's sides
    const leaf = (side, g) => { const xc = cx + side * (135 + 200); const out = [];
      out.push(D(211, xc, 150, { ch: chDoor, z: "B1", zo: 0, sx: 9, sy: 10.4, groups: [gAll, g] }));
      for (let i = 0; i < 4; i++) out.push(D(211, xc, 30 + i * 80, { ch: chRib, z: "B1", zo: 1, sx: 9, sy: 0.35, groups: [gAll, g] }));
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) out.push(D(497, xc - 90 + j * 90, 30 + i * 80, { ch: chStud, z: "B1", zo: 2, s: 0.22, groups: [gAll, g] }));
      out.push(D(211, xc - side * 132, 150, { ch: chRib, z: "B1", zo: 1, sx: 0.4, sy: 10.4, groups: [gAll, g] }));
      return out; };
    add(leaf(-1, gL)); add(leaf(1, gR));
    add([D(1293, cx, 150, { ch: chGlow, z: "B1", zo: 5, sx: 1.5, sy: 20, groups: [gAll, gSeam] })]);
    // sparks: small disks at the seam, each with its own group, thrown outwards
    const sparks = [];
    for (let i = 0; i < 10; i++) { const g = ctx.group(); sparks.push(g); add([D(497, cx, 40 + i * 26, { ch: chGlow, z: "T1", s: 0.12 + (i % 3) * 0.05, groups: [gAll, gSpark, g] })]); }
    add([T.lockCamera(x0 - 30, gAll, 5.6, { y: false }), T.alpha(ctx.xAt(t0 - 0.5), gAll, 1, 0.5)]);
    add([T.alpha(at(0.3), gDem, 1, 0.8), T.move(at(0.3), gDem, 0, 110, 2.6, E.settle)]);           // he climbs up into the opening
    add([T.move(at(slam - 0.45), gL, 200, 0, 0.45, 2), T.move(at(slam - 0.45), gR, -200, 0, 0.45, 2)]); // the doors close, speeding up
    add([T.alpha(at(slam), gDem, 0, 0), T.alpha(at(slam), gSeam, 1, 0), T.alpha(at(slam + 0.25), gSeam, 0.35, 0.9)]);
    add([K.colour(at(slam), 1000, [190, 30, 10], 0), K.colour(at(slam + 0.05), 1000, sky, 0.8)]);
    add([K.colour(at(slam), chRib, [255, 120, 30], 0), K.colour(at(slam + 0.1), chRib, [80, 22, 12], 1.2)]);   // the iron glows red-hot, then cools    // the red flash of the sky
    const shake = [[0, 14, 0.04], [0, -24, 0.05], [0, 18, 0.05], [0, -12, 0.06], [0, 4, 0.08]];
    let ts = slam; for (const [dx, dy, s] of shake) { add([K.trig(1916, at(ts), { 28: String(dx), 29: String(dy), 10: String(s), 30: "0" })]); ts += s; }
    add([T.alpha(at(slam), gSpark, 1, 0), T.alpha(at(slam + 0.25), gSpark, 0, 0.6)]);
    sparks.forEach((g, i) => { const a = (i % 2 ? 1 : -1) * (30 + (i * 37) % 60); add([T.move(at(slam), g, a * 1.2, ((i * 53) % 50) - 10, 0.7, E.hit)]); });
    ctx.stationC = { method: "png fit", demonObjects: dm.objects.length, rmseDemon: +dm.fit.error.toFixed(1) };
  }

  add(ctx.prelude());
  header = K.channels(ctx.header(header), channels);
  const str = levelStr(header, objs.concat(far));
  const lvl = GD.parseLevel(str);
  const rec = GD.newRecord("GDLM art lab", "Art lab: a dragon, a demon in a doorway, a gate slammed on a demon (auto, no click). Made by Claude (and some humans)");
  GD.setField(rec, "k8", "i", "5");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  writeGdlvl(out, rec, lvl);
  const byStation = { A: ctx.stationA, B: ctx.stationB, C: ctx.stationC };
  return { out, objects: objs.length, triggers: objs.filter(o => [901, 1007, 1346, 899, 1916, 1049].includes(o.id)).length, byStation };
}

async function cmdRaster(outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const { chromium } = require("playwright"), b = await chromium.launch({ args: ["--no-sandbox"] }), p = await b.newPage(), src = path.join(ROOT, "art", "src");
  for (const f of fs.readdirSync(src).filter(f => f.endsWith(".svg"))) {
    const svg = fs.readFileSync(path.join(src, f), "utf8"), m = /width="(\d+)" height="(\d+)"/.exec(svg);
    await p.setViewportSize({ width: +m[1], height: +m[2] });
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
    await p.screenshot({ path: path.join(outDir, f.replace(/\.svg$/, ".png")), omitBackground: true });
  }
  await b.close();
}

if (require.main === module) {
  const cmd = args[0];
  if (cmd === "raster") cmdRaster(opt("--out", path.join(ROOT, "local", "artlab"))).then(() => console.log("ok"));
  else if (cmd === "convert") console.table(cmdConvert(args[1], opt("--out", path.join(ROOT, "local", "artlab"))));
  else if (cmd === "demon") console.log(cmdDemon(opt("--out", path.join(ROOT, "local", "artlab"))));
  else if (cmd === "level") cmdLevel(path.resolve(opt("--out", path.join(ROOT, "levels", "lab", "gdlm_art_lab.gdlvl"))), opt("--src", path.join(ROOT, "local", "artlab"))).then(r => console.log(JSON.stringify(r, null, 1)));
  else { console.log(fs.readFileSync(__filename, "utf8").split("\n").filter(l => l.startsWith("//")).join("\n")); process.exit(1); }
}
module.exports = { sprite, fitSprite, drawBack, demonShapes, demonObjects };
