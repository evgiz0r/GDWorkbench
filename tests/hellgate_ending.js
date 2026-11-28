// node tests/hellgate_ending.js  -- Hellgate's ending animation (tools/hellgate_ending.js, HELLGATE.md): the level clears with
// no press, the show leaves the run unchanged, nothing but deco and trusted triggers (no pulse, no scale), the doors meet on the
// song's last hit and the arch stones land on their beats. ~2 s.
"use strict";
const assert = require("assert");
const { GD } = require("../tools/io.js");
const HE = require("../tools/hellgate_ending.js");
const r = HE.build({});
assert.ok(r.measures.clears, "the ending dies");
assert.ok(!r.measures.showChangesRun, "the show changes the zero-press run");
const OK = new Set([901, 1007, 1346, 899]);
for (const o of r.objects) {
  const k = (GD.objInfo(o.id) || {}).kind;
  assert.ok(k === "decoration" || o.id === 914 || (k === "trigger" && OK.has(o.id)), `object ${o.id} (${k}) is not deco or a trusted trigger`);
}
// the doors' slide (exponential in, 150 units) ends on the last hit, from the path: trigger x -> time + duration
const lv = GD.parseLevel(r.header + ";" + r.objects.map(GD.objToString).join(";") + ";");
const run = GD.run(GD.makeWorld(lv.objects, lv.header), []), p = run.path, tAt = x => p.findIndex(s => s.x >= x) / 240;
const from = r.measures.songFrom;
const doors = r.objects.filter(o => o.id === 901 && Math.abs(+o.props[28]) === 150 && o.props[30] === "11");
assert.strictEqual(doors.length, 2, "two door moves");
for (const d of doors) assert.ok(Math.abs(tAt(d.x) + +d.props[10] + from - HE.SLAM) < 0.02, "a door does not shut on the last hit");
const lands = r.objects.filter(o => o.id === 901 && o.props[30] === "11" && Math.abs(+o.props[28]) !== 150);
assert.strictEqual(lands.length, 11, "eleven arch stones fly in");
for (const m of lands) { const s = tAt(m.x) + +m.props[10] + from, k = (s - HE.beatS(0)) / (HE.beatS(1) - HE.beatS(0)); assert.ok(Math.abs(k - Math.round(k)) < 0.05, `a stone lands off the beat (${s.toFixed(3)} s)`); }
console.log(`ok: ${r.measures.objects} objects, ${r.measures.triggers} triggers, doors shut on ${HE.SLAM} s, 11 stones on beats`);
