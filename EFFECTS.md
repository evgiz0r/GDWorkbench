# Effects: music-synced visual effects written into a level

Evgeni (2026-11-26): "i want to gain the controls, my imagination is not strong enough yet. from dancing blocks on the
screen, to small glows along the path with clouds around us to a dancing circle around us pulsing to the song".
So this is a toolkit of effects that any builder can call, and a gallery level that shows each one, labelled, so he
can see in the game what is possible and pick from it. Mainly for AUTO levels (AUTO.md): with no click, the player's
path is known in advance, so an effect can be timed to the player's exact position on a note, and the gameplay can be
hidden so only the effects show.

Owner: the effects thread (2026-11-26, "Build a visual effects toolkit for auto levels"). Works with the auto thread
(AUTO.md, the auto levels) and the deco-art thread (DECOART.md, tools/decofx.js: glow, front layer, set pieces).

## The pieces

- `tools/effects.js` -- the effects. `node tools/effects.js` lists them with their parameters.
- `tools/fxgallery.js` -- the gallery level `levels/lab/fx_gallery.gdlvl` ("GDLM fx gallery"), ~4 s to build.
- `tests/effects.js` -- the gallery clears with no press, the effects leave the run unchanged, every effect object is
  deco or a trigger, pads launch on their beat (~5 s).

## How to use it

```js
const FX = require("./effects.js");
const ctx = FX.context({ path, grid, notes });   // path: GD.run(world, []).path (zero-press run), grid {t0, period}, notes [{t, strength}]
objects.push(...FX.ring(ctx, { t0: 57, t1: 64.5 }));          // any effect: (ctx, {t0, t1, ...params}) -> objects
objects.push(...FX.clouds(ctx, { t0: 50, t1: 57, n: 4 }));
objects.push(...ctx.prelude());     // once: the groups the effects hide / toggle off from the first tick
header = ctx.header(header);        // once: the effects' colour channels (kS38)
```
`notes` from `require("./autobeat.js").musicOf(song).notes` (tools/impacts.js's committed song notes), `grid` from
`autobeat.loadGrid(song)`. `t0` / `t1` are level seconds. "At time t" always means at the x the player has at t in the
run (`ctx.xAt`), so pads, falls and speed portals are taken into account. `ctx.beats(t0, t1, every)`,
`ctx.notes(t0, t1, minStrength)`, `ctx.contacts(t0, t1)` (take-offs and landings) are there for new effects.

## The effects

| effect | triggers | what it does | params |
|---|---|---|---|
| `label` | lock to camera, alpha | text that stays on the screen for a section | text, sub, y |
| `fadeBlocks` | alpha | a checkerboard of squares, the halves trading places on every beat | cols, rows, every, lo, fade, rgb |
| `chase` | toggle | a row of lights, one of n groups on at a time, on every half beat | n, count, every, rgb |
| `dancers` | move (+ lock to camera) | n blocks hopping on every beat, one after the other (a wave); bigger on the bar | n, dy, stagger, up, down, rgb |
| `screenFrame` | lock to camera (mod 1 and 0.5) | a structure riding the screen + a far layer at half speed (depth) | rgb |
| `contactFlash` | alpha, scale | a ring and a glow at every take-off and landing, growing and fading | rgb, size, secs |
| `hitLines` | alpha, move | a line flashes in on every strong note, slides, fades | minS, rgb, len |
| `pathGlow` | alpha | glow dots along the player's own path, lit as it passes, fading behind | every, rgb, linger |
| `clouds` | lock to player (x and y), move | clouds around the player, following it, bobbing on the beats | n, rgb, opacity |
| `ring` | lock to player, rotate, scale | a circle with orbiting dots around the player, turning, swelling on every beat, bigger on strong notes | r, dots, swell, spin, rgb |
| `fall` | move (exp in), rotate, alpha | shapes drop from the top on the beats (or notes), land ON the beat with a small bounce, fade (Evgeni: "something falling") | every, minS, rgb, size, spin |
| `beatFlash` | colour 899 | the background flashes on the beats and settles back | every, rgb, back, ch |
| `pulseFlash` | **pulse 1006 (untested)** | the same flash with pulse triggers | every, rgb, ch |
| `zoomPunch` | zoom 1913 | the camera punches in on the strongest notes | to, minS |

Hidden gameplay: alpha never changes collision, so a pad (or block) at alpha 0 still works. The gallery's demo 5b hides
its pads that way (group 3990, set to alpha 0 from the first tick); only the contact flashes show where they are.

## The gallery level (`node tools/fxgallery.js`)

Electrodynamix, 76 s, no click. Flat ground; 15 yellow pads on beats (each moved by replays until the launch is on the
beat tick: all within 2 ms) where a demo wants movement. 16 beats a demo, each labelled on the screen:
intro, 1 ALPHA (fadeBlocks), 2 TOGGLE (chase), 3 MOVE (dancers), 4 LOCK TO CAMERA (screenFrame), 5 CONTACT FLASH,
5b HIDDEN PADS, 6 HIT LINES + ZOOM, 7 PATH GLOW + CLOUDS, 8 DANCING CIRCLE (ring), 9a COLOUR FLASH (899),
9b PULSE FLASH (1006, untested), then the beat ending (tools/beatend.js) and the Claude signature.
v1: 823 effect triggers, 108 groups, the zero-press run identical with and without the effects. v2 (the quality pass
below): 816 triggers, a hue per demo.

**The viewer is not the test.** lib/vfx.js draws alpha, move, lock to player, rotate, toggle and colour, but not the
scale trigger, lock to camera, or text in the cloud render; most of the gallery only shows in GD. GD is the real test:
`node tools/install.js levels/lab/fx_gallery.gdlvl` with the game closed, play it from My Levels.

## Rules

- Deco only: effect objects are decoration (no hitbox) or triggers, and groups are only on effect objects (the one
  exception: hidden pads, alpha only). A move or toggle never touches gameplay; tests/effects.js checks.
- Trusted triggers first: alpha, move, rotate, scale, toggle, colour. Pulse only where labelled.
- Ranges: groups 2001-3999, colour channels 800-849 (signature 960+ / 976-996, decofx 1201+ / 950-957, blockart
  900-911, decoart 700-799 and groups 1101-1111).
- The screen: at 1x on the ground about 7.5 blocks show above the ground, 6.5 behind and 12 ahead of the player; keep
  screen-locked pieces inside x0 - 150 .. x0 + 350, y 0 .. 215 (x0 = the player's x when the lock starts).

## How rated levels move (the numbers the defaults follow)

Evgeni on v1 (2026-11-26): "the quality is still lacking but i see its infinite control pretty much over the view". So v2
measured the same 8 rated 2.2 levels (scratch study over local/community, median and p10-p90 per trigger) and retuned:
- **Easing** (move, 16k): none 25%, exponential out (12) 16%, back out (18) 11%, ease in-out (1) 9%, sine in-out (13) 9%,
  sine out (15) 5%. Scale and rotate the same top three. v1 used plain ease in / out (2, 3): rare there. Now hits are
  exponential out, settling is sine in-out, accents back out (`FX.E`).
- **Move**: 0.35 s (p10 0 .. p90 1.4), about a block (31 units; the p90 of 600 is screen-wide slides). v1 hopped 24-38
  units; now 15 (24 on a bar's first beat, with a 12 degree back-out wobble).
- **Rotate**: 15 degrees in 0.33 s typical; big spins are the p90 (240 degrees).
- **Scale**: by 1.25 in 0.25 s (p90 1 s). v1's ring swelled 1.3-1.6; now 1.15 (1.32 on the strongest notes).
- **Alpha**: in almost at once (median 0.04 s), out over up to 0.5 s; mostly to 0 or 1. Now every flash comes in at once
  and fades out over 0.3-0.4 s.
- **Pulse**: fade in 0, hold 0, fade out 0.2 (p90 0.7). The colour flash now does the same.
- **Density**: 35 motion triggers per screen (p10 15, p90 57). The gallery's sections run 8-50, the dancers ~80.
- **Colour**: v1 used pure white and full colours. Now each effect takes its colours from one hue (`FX.palette(hue)`:
  accent, warm, cool, a near-white tinted by the hue, soft, deep, bg), blending channels for glows, 0.35-0.85 opacity,
  and smaller shapes (dots 0.6-1.3, glow strips 1293 instead of dots on the dancers). The gallery gives each demo a hue.

## Trigger keys

Checked on 8 rated 2.2 levels from the PC's local/community (2026-11-26), counted per key over 17k move, 5k rotate,
5k scale, 6k alpha, 12k toggle, 10k pulse, 1.6k spawn triggers:
- all: 51 target group, 10 duration, 30 easing, 85 easing rate (2), 36 "is trigger", 57 the trigger's own groups,
  62 spawn-triggered, 87 multi-trigger.
- move 901: 28 / 29 offset (units), 58 / 59 lock to player x / y, 141 / 142 lock to camera x / y, 143 / 144 the x / y
  mod (0.1 = a far layer), 100 move to target with 71 the target group.
- rotate 1346: 68 degrees, 69 whole turns, 71 centre group, 70 lock own rotation.
- scale 2067: 150 / 151 scale x / y, 71 centre group, 153 / 154 divide by the value (undo an earlier scale), 133 only
  move (not used).
- alpha 1007: 35 opacity. toggle 1049: 56 on. spawn 1268: 63 delay.
- pulse 1006: 7-9 rgb, 45 / 46 / 47 fade in / hold / fade out, 52 group (1) or channel (0), 48 HSV mode, 210 (on 87% of
  them, meaning unknown).

## Used in

- `tools/hellgate_ending.js` (HELLGATE.md): a whole animation from these triggers -- a stage locked to the player's x,
  pieces that fly in and land ON a beat (move, exponential in 11, started `secs` before the beat), a ring turned about a
  centre object that rides with the stage, alpha chases, colour 899 on the sky. Pattern for any no-gameplay scene.

## Open

- Evgeni on v1: "the control is nice", "the quality is still lacking". v2 = the numbers above; his look at v2 in the game.
- Quality beyond the numbers: composition (where effects sit against the path, framing, restraint per section), shapes
  that look good in GD art (needs GD-art pictures from the PC: tools/shoot.js), with the deco-art thread's taste rules.
- Not checked in GD yet: lock to camera (141 / 142), scale with a centre group while the group is locked to the player,
  rotate about a centre that is itself moving, text locked to the screen, the 236 circle's look (a ring or a disk?).
- More effects: spawn-loops (one spawn trigger repeating a pattern without a trigger per beat), particles (2065),
  camera shake (1520), area triggers (2.2's "move near the player"), shaders. Effects that follow a whole auto level's
  path (autobeat.js) instead of a gallery.
- The viewer: draw scale and camera lock (lib/vfx.js) so the gallery can be judged before the game.
