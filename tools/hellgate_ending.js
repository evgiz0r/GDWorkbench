// node tools/hellgate_ending.js [--out levels/gdlm_44_hellgate_ending.gdlvl] [--from 213.8] [--quiet]
//   -> Hellgate's ending animation (HELLGATE.md: song 215.4 - 231 s, no gameplay): "THE GATE CLOSES", Evgeni's pick
//      (2026-11-28) of four ideas. A standalone auto level on the Hellgate song (custom 343707) that starts at song second
//      --from (kA13), so it can be looked at alone now and stitched after the auto part later (build() works in SONG seconds).
//   The story, on the song's measured notes (knowledge/song_notes/custom_343707.json; beat k = song beat 518 + k):
//     lead-in  213.8 - 215.4  the sky goes dark, the player runs into nothing
//     A  k 0-7   215.4 - 218.7  four pillars rise out of the dark, a pair on each 2nd beat; their fire caps light, one a beat
//     B  k 8-15  218.7 - 222.0  eleven arch stones fly in from off the screen and LAND on the beats, ends first, keystone last
//     C  k 16-27 222.0 - 227.0  (the loudest bars) a ring of 8 runes inside the arch turns 1.5 times, the runes light one
//                                after another on every beat, caps flare on the strongest notes, the sky warms to red
//     D  k 28-30 227.0 - 228.2  the music thins: the ring slows, the runes dim, the sky cools
//     E  228.25 (the song's last big hit, "change" impact 0.55 / break 0.96): two doors slam shut over the player (hides it),
//                a hot seam glows where they meet, the sky flashes once and the whole stage thuds down and settles
//     F  228.6 - 231  the gate dims into the dark, the sky goes black, the quiet Claude sign (tools/signature.js overlay)
//   Everything is deco + trusted triggers (move, rotate, alpha, colour; no pulse, no scale) locked to the player's x (move
//   58), so the stage stays put on the screen while the cube runs along the ground. Run with and without the show must be
//   the same and clear with no press. Groups 2001+ / channels 800+ (tools/effects.js ranges).
//   Library: build({from, songTo}) -> {level, measures, log}; parts(ctx, songT) -> objects (the show alone, for stitching).
if (require.main === module) require("./heavy.js").claim();   // one heavy job at a time (tools/heavy.js)
"use strict";
const fs = require("fs"), path = require("path");
const { GD, writeGdlvl } = require("./io.js");
const FX = require("./effects.js"), K = require("./scenekit.js");
const ROOT = path.join(__dirname, "..");
const TPS = 240, SONG = "343707";
const NOTES = require("../knowledge/song_notes/custom_343707.json");
const B0 = 518;                                   // song beat of the phrase at 215.43 s
const beatS = k => NOTES.t0 + (B0 + k) * NOTES.period;   // song second of beat k
const SLAM = 228.25;                              // the last big hit

const objStr = o => {
  let s = `1,${o.id},2,${(+o.x).toFixed(2)},3,${(+o.y).toFixed(2)}`;
  if (o.flipX) s += ",4,1"; if (o.flipY) s += ",5,1"; if (o.rot) s += ",6," + o.rot;
  for (const [k, v] of Object.entries(o.props || {})) if (!["1", "2", "3", "4", "5", "6"].includes(k)) s += `,${k},${v}`;
  return s;
};
const levelStr = (header, objs) => header + ";" + objs.map(objStr).join(";") + ";";
const runOf = (header, objs) => { const lv = GD.parseLevel(levelStr(header, objs)); return GD.run(GD.makeWorld(lv.objects, lv.header), []); };

// the hellgate colours (tools/designthemes.js hellgate: purple sky, molten rims)
const COL = {
  stone: [46, 20, 40], stoneLit: [92, 38, 52], rim: [255, 110, 40], ember: [255, 170, 70], rune: [255, 200, 120],
  door: [22, 8, 16], seam: [255, 140, 50],
  sky0: [84, 36, 96], dark: [22, 8, 26], groundDark: [10, 3, 12], heat: [92, 18, 22], heat2: [120, 30, 16],
  flash: [210, 90, 30], black: [5, 1, 6],
};

// The show: songT(s) = level seconds of song second s; ctx from FX.context on the level's run.
function parts(ctx, songT, o = {}) {
  const out = [], log = [], D = (id, x, y, op = {}) => K.obj(id, x, y, op);
  const xs = s => ctx.xAt(songT(s));               // trigger x for song second s
  const tLock = songT(o.lockAt || 214.8), x0 = ctx.xAt(tLock), lockSecs = songT(o.songTo || 232.5) - tLock;
  const C = { x: x0 + 10, y: 95 };                 // the arch's centre, just ahead of the player: the player stands in the gate
  const ALL = ctx.group();                         // everything on the stage: locked to the player's x
  const g = () => ctx.group();
  const hid = gr => ctx.hideAtStart(gr);
  const ch = (rgb, op = {}) => ctx.channel(rgb, op);
  const chStone = ch(COL.stone), chLit = ch(COL.stoneLit), chRim = ch(COL.rim, { blend: true }), chEmber = ch(COL.ember, { blend: true });
  const chRune = ch(COL.rune, { blend: true }), chDoor = ch(COL.door), chSeam = ch(COL.seam, { blend: true });
  const fades = [];                                 // groups to dim at the end
  out.push(FX.T.lockPlayer(x0, ALL, lockSecs));
  // the sky: dark for the lead-in
  out.push(FX.T.colour(xs(214.0), 1000, COL.dark, 1.2), FX.T.colour(xs(214.0) + 1, 1001, COL.groundDark, 1.2));

  // A. the pillars: two tall towers outside, two that hold the arch, rising 150 units out of the dark
  const RISE = 150;
  const pillars = [
    { dx: -170, h: 150, w: 26, k: 0 }, { dx: 190, h: 150, w: 26, k: 0 },
    { dx: -95, h: 86, w: 30, k: 2 }, { dx: 115, h: 86, w: 30, k: 2 },
  ];
  const caps = [];
  for (const p of pillars) {
    const gp = hid(g()), x = x0 + p.dx;
    for (let y = 0; y < p.h; y += 30) {              // stacked stones with a lit edge: reads as masonry
      const hh = Math.min(30, p.h - y);
      out.push(D(211, x, y + hh / 2 - RISE, { ch: chStone, z: "B2", sx: p.w / 30, sy: (hh - 2) / 30, groups: [gp, ALL] }));
      out.push(D(211, x - p.w / 2 + 2, y + hh / 2 - RISE, { ch: chLit, z: "B2", zo: 1, sx: 3 / 30, sy: (hh - 2) / 30, groups: [gp, ALL] }));
    }
    const gc = hid(g());                             // the fire cap: a glow on top, lit later
    out.push(D(1293, x, p.h + 6 - RISE, { ch: chRim, z: "B1", sx: p.w / 30 * 1.3, sy: 0.5, groups: [gp, gc, ALL] }));
    out.push(D(1764, x, p.h + 4 - RISE, { ch: chEmber, z: "B1", zo: 2, s: 0.9, groups: [gp, gc, ALL] }));
    caps.push(gc);
    const t = beatS(p.k);
    out.push(FX.T.alpha(xs(t - 0.05), gp, 1, 0.15), FX.T.move(xs(t - 0.05), gp, 0, RISE, 0.4, FX.E.hit));
    fades.push(gp);
  }
  caps.forEach((gc, i) => out.push(FX.T.alpha(xs(beatS(4 + i)), gc, 0.9, 0.08)));
  log.push(`A pillars rise on ${beatS(0).toFixed(2)} / ${beatS(2).toFixed(2)} s, caps light ${beatS(4).toFixed(2)}-${beatS(7).toFixed(2)} s`);

  // embers rising through A-C: one on every beat, somewhere in the gate
  let seed = 7; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 28; k++) {
    const ge = hid(g()), x = x0 - 150 + R() * 320, y = 10 + R() * 60, t = beatS(k);
    out.push(D(1764, x, y, { ch: chEmber, z: "B3", s: 0.35 + R() * 0.4, groups: [ge, ALL] }));
    out.push(FX.T.alpha(xs(t), ge, 0.8, 0.05), FX.T.move(xs(t), ge, (R() - 0.5) * 30, 110 + R() * 60, 2.2, FX.E.sineOut),
      FX.T.alpha(xs(t + 0.9), ge, 0, 1.2));
  }

  // B. the arch: 9 stones on a half circle, each flying in from out of the screen and landing on its beat
  const RA = 105, N = 11, stones = [];
  for (let i = 0; i < N; i++) {
    const a = Math.PI * i / (N - 1), gs = hid(g()), key = i === (N - 1) / 2;
    const x = C.x - RA * Math.cos(a), y = C.y + RA * Math.sin(a), rot = -(a * 180 / Math.PI - 90);
    out.push(D(211, x, y, { ch: chStone, z: "B2", zo: 3, sx: key ? 1.3 : 1.05, sy: key ? 0.95 : 0.8, rot, groups: [gs, ALL] }));
    out.push(D(211, x, y + (key ? 11 : 8.5), { ch: chLit, z: "B2", zo: 4, sx: key ? 1.15 : 0.9, sy: 0.08, rot, groups: [gs, ALL] }));
    if (key) out.push(D(1293, x, y, { ch: chRim, z: "B1", sx: 1.3, sy: 1.0, groups: [gs, ALL] }));
    // ends first, keystone last: pairs on beats 8-12 and the keystone on 13
    const k = 8 + Math.min(i, N - 1 - i), t = beatS(k), fly = 0.35;
    const ox = -Math.cos(a) * 330, oy = Math.sin(a) * 160 + 90;       // starts out of the screen, up and outwards
    stones.push({ gs, ox, oy });
    out.push(FX.T.move((ctx.path[0].x || 0) + 4, gs, ox, oy, 0));                      // parked out of the screen before anything shows
    out.push(FX.T.alpha(xs(t - fly), gs, 1, 0), FX.T.move(xs(t - fly), gs, -ox, -oy, fly, 11));   // exponential in: lands ON the beat
    fades.push(gs);
  }
  // the arch settles: a small drop and back on the bar after the keystone
  const settle = beatS(14);
  for (const s of stones) out.push(FX.T.move(xs(settle), s.gs, 0, -3, 0.08, FX.E.hit), FX.T.move(xs(settle + 0.1), s.gs, 0, 3, 0.35, FX.E.settle));
  log.push(`B arch stones land on ${beatS(8).toFixed(2)}-${beatS(12).toFixed(2)} s, keystone ${beatS(13).toFixed(2)} s`);

  // C. the rune ring inside the arch: 8 runes, turning 1.5 times through the loud bars, lit one after another on every beat
  const RING = hid(g()), CEN = g(), RR = 62, runes = [];
  out.push(D(1764, C.x, C.y + 20, { ch: chRune, z: "B4", s: 0.1, groups: [CEN, ALL] }));   // the centre the ring turns about
  out.push(D(236, C.x, C.y + 20, { ch: chRim, z: "B3", s: 2.2, groups: [RING, ALL] }));     // a faint disc behind the runes
  for (let i = 0; i < 8; i++) {
    const a = 2 * Math.PI * i / 8, gr = hid(g()), x = C.x + RR * Math.cos(a), y = C.y + 20 + RR * Math.sin(a);
    out.push(D(211, x, y, { ch: chRune, z: "B2", zo: 6, s: 0.38, rot: 45, groups: [gr, RING, ALL] }));
    out.push(D(1764, x, y, { ch: chRim, z: "B2", zo: 5, s: 1.1, groups: [gr, RING, ALL] }));
    runes.push(gr);
  }
  const c0 = beatS(16), c1 = beatS(28);
  out.push(FX.T.alpha(xs(c0 - 0.2), RING, 0.25, 0.4));
  for (const gr of runes) out.push(FX.T.alpha(xs(c0 - 0.2), gr, 0.3, 0.4));
  out.push(FX.T.rotate(xs(c0), RING, 540, c1 - c0, { centre: CEN }));
  for (let k = 16; k < 28; k++) {
    const gr = runes[(k - 16) % 8], t = beatS(k);
    out.push(FX.T.alpha(xs(t), gr, 1, 0), FX.T.alpha(xs(t + 0.05), gr, 0.35, 0.5));
  }
  // caps flare on the loudest notes of C (strength 1, never closer than a beat)
  let last = -9, flares = 0;
  for (const [s, st] of NOTES.notes) if (s >= c0 && s < c1 && st >= 0.9 && s - last > NOTES.period * 0.9) {
    last = s; flares++;
    for (const gc of caps) out.push(FX.T.alpha(xs(s), gc, 1, 0), FX.T.alpha(xs(s + 0.05), gc, 0.75, 0.4));
  }
  // the sky warms through C (calm, on bar starts)
  out.push(FX.T.colour(xs(c0), 1000, COL.heat, 1.6), FX.T.colour(xs(beatS(24)), 1000, COL.heat2, 1.6));
  log.push(`C rune ring turns ${c0.toFixed(2)}-${c1.toFixed(2)} s, runes on every beat, ${flares} cap flares`);

  // D. the music thins: the ring slows to a stop, the runes dim, the sky cools
  out.push(FX.T.rotate(xs(c1), RING, 25, SLAM - c1, { centre: CEN, ease: FX.E.sineOut }));
  for (const gr of runes) out.push(FX.T.alpha(xs(c1), gr, 0.2, 0.8));
  out.push(FX.T.colour(xs(c1), 1000, [48, 12, 22], 1.0));
  for (const gc of caps) out.push(FX.T.alpha(xs(c1), gc, 0.5, 1.0));

  // E. the slam: two doors (strips that fill the arch's inner shape) slide in and meet at the last hit, over the player
  const DL = hid(g()), DR = hid(g()), SEAM = hid(g()), RIN = RA - 10, OPEN = 150;
  for (let sx = -1; sx <= 1; sx += 2) {
    const gd = sx < 0 ? DL : DR;
    for (let i = 0; i < 12; i++) {
      const dx = (i + 0.5) * (RIN / 12), h = C.y + Math.sqrt(Math.max(0, RIN * RIN - dx * dx));
      const x = C.x + sx * dx;
      out.push(D(211, x + sx * OPEN, h / 2, { ch: chDoor, z: "T1", zo: 2, sx: (RIN / 12 + 0.6) / 30, sy: h / 30, groups: [gd, ALL] }));
    }
    // a lit edge down the door's middle
    out.push(D(211, C.x + sx * RIN * 0.5 + sx * OPEN, (C.y + 40) / 2, { ch: chLit, z: "T1", zo: 3, sx: 2 / 30, sy: (C.y + 40) / 30, groups: [gd, ALL] }));
  }
  out.push(D(1293, C.x, (C.y + RIN) / 2, { ch: chSeam, z: "T1", zo: 4, sx: 0.5, sy: (C.y + RIN) / 30, groups: [SEAM, ALL] }));
  const shut = 0.6;
  out.push(FX.T.alpha(xs(SLAM - shut), DL, 1, 0.2), FX.T.alpha(xs(SLAM - shut), DR, 1, 0.2),
    FX.T.move(xs(SLAM - shut), DL, OPEN, 0, shut, 11), FX.T.move(xs(SLAM - shut), DR, -OPEN, 0, shut, 11),
    FX.T.alpha(xs(SLAM), SEAM, 1, 0), FX.T.alpha(xs(SLAM + 0.1), SEAM, 0, 1.6));
  // the sky flashes once and the stage thuds down and settles
  out.push(FX.T.colour(xs(SLAM), 1000, COL.flash, 0), FX.T.colour(xs(SLAM + 0.02), 1000, [30, 6, 10], 0.7));
  out.push(FX.T.move(xs(SLAM), ALL, 0, -6, 0.05, FX.E.hit), FX.T.move(xs(SLAM + 0.06), ALL, 0, 6, 0.45, FX.E.pop));
  for (const gc of caps) out.push(FX.T.alpha(xs(SLAM), gc, 1, 0), FX.T.alpha(xs(SLAM + 0.05), gc, 0.3, 1.2));
  log.push(`E doors slam at ${SLAM} s (the last big hit)`);

  // F. the closed gate dims into the dark
  const f0 = 229.5;
  for (const gr of fades.concat([DL, DR])) out.push(FX.T.alpha(xs(f0), gr, 0.3, 1.5));
  out.push(FX.T.alpha(xs(f0), RING, 0, 1.2));
  for (const gr of runes.concat(caps)) out.push(FX.T.alpha(xs(f0), gr, 0, 1.2));
  out.push(FX.T.colour(xs(f0), 1000, COL.black, 1.8), FX.T.colour(xs(f0) + 1, 1001, COL.black, 1.8));
  out.push(FX.T.colour(xs(f0) + 2, 1013, COL.black, 1.8), FX.T.colour(xs(f0) + 3, 1014, COL.black, 1.8));
  for (const gr of fades.concat([DL, DR])) out.push(FX.T.alpha(xs(231.0), gr, 0, 1.0));
  log.push(`F gate dims from ${f0} s, dark by 232 s`);
  return { objects: out, log };
}

function build(o = {}) {
  const from = o.from ?? 213.8, songTo = o.songTo ?? 232.5;
  const songT = s => s - from;
  let header = GD.DEFAULT_HEADER.replace(/(^|,)kA13,[-0-9.]+/, "$1kA13," + from).replace(/(^|,)kA15,\d/, "$1kA15,0");
  header = K.channels(header, { 1000: { rgb: COL.sky0 }, 1001: { rgb: [29, 12, 33] }, 1009: { rgb: [40, 16, 44] },
    1013: { rgb: [44, 16, 44] }, 1014: { rgb: [30, 10, 30] } });   // the middleground hills: hellgate dark, not GD's default lavender
  const endX = (songTo - from) * 311.58;          // flat ground at 1x; the level ends after the song is silent
  const end = [{ id: 1764, x: endX, y: 1500, rot: 0, props: {} }];
  const base = runOf(header, end);
  if (base.dead) throw new Error("the empty run dies: " + base.why);
  const ctx = FX.context({ path: base.path, grid: { t0: NOTES.t0 - from, period: NOTES.period } });
  const show = parts(ctx, songT, o);
  // the quiet sign over the last 5 s of the song (it is silent from ~231 s: the sign fades in at 226.5 s)
  const sg = require("./signature.js"), p = base.path;
  const xAt = t => ctx.xAt(t), tOfX = x => { let i = p.findIndex(s => s.x >= x); if (i < 0) i = p.length - 1; return i / TPS; };
  const sign = sg.overlay({ endX: ctx.xAt(songT(231.5)), xOfT: xAt, tOfX, secs: 5, cam: 0, dx: 290 });   // right of the right tower (x0 + 203)
  header = sg.header(ctx.header(header), {});
  const objs = end.concat(show.objects, ctx.prelude(), sign);
  const withFx = runOf(header, objs);
  const same = withFx.path.length === base.path.length && withFx.path.every((s, i) => Math.abs(s.x - p[i].x) < 1e-6 && Math.abs(s.y - p[i].y) < 1e-6);
  const measures = { secs: +(p.length / TPS).toFixed(2), songFrom: from, objects: objs.length,
    triggers: objs.filter(q => (GD.objInfo(q.id) || {}).kind === "trigger").length, groups: ctx.group() - 2001,
    clears: !!withFx.done || !withFx.dead, showChangesRun: !same };
  return { header, objects: objs, measures, log: show.log };
}

module.exports = { build, parts, beatS, SLAM };

if (require.main === module) {
  const a = process.argv.slice(2), opt = k => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : null; };
  const r = build({ from: opt("--from") != null ? +opt("--from") : undefined });
  const out = path.resolve(opt("--out") || path.join(ROOT, "levels", "gdlm_44_hellgate_ending.gdlvl"));
  const sg = require("./signature.js");
  const rec = GD.newRecord("GDLM 44 hellgate ending", sg.describe("Hellgate's ending: the gate closes (no gameplay, song 213.8-232 s; tools/hellgate_ending.js, HELLGATE.md)"));
  GD.setField(rec, "k45", "i", SONG);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  writeGdlvl(out, rec, { header: r.header, objects: r.objects });
  if (r.measures.clears) require("./planned.js").writeAuto(out, "tools/hellgate_ending.js: no gameplay, clears with no press");
  if (!a.includes("--quiet")) console.log(r.log.join("\n"));
  console.log(JSON.stringify(r.measures));
  console.log(`${r.measures.clears && !r.measures.showChangesRun ? "CLEARS, the show leaves the run unchanged" : "PROBLEM"} -> ${path.relative(ROOT, out)}`);
}
