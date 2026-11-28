# ART -- drawing things in GD: pictures -> objects, and the prop library

Why: the rated community levels the user played on 2026-11-23 (Spooky Dash by Fabruuuu, ID 150941693, and
others; recording `GD claude-rec 2026-11-23_20-41-39.mkv`, never delete it) are illustrated scenes --
pumpkins, graveyard trees, creature faces, pixel forests, factory chains -- built from many small pieces in
one palette per scene. Our levels could not draw anything. This is the start of that. Owner: the art session
(2026-11-23); the showcase session builds scene levels on top of it (SHOWCASE.md, tools/scenes.js).

## Files

- `lib/pixelart.js` -- the core (node + browser): a pixel canvas (`grid`: rect, ellipse, ring, line, poly,
  stamp rows, outline, flipX), `toObjects(grid, {x, y, px, ch, z, zo, anchor, groups})` -> GD objects,
  `quantise(rgba, w, h, k)` (k-means to k colours), `downscale`.
- `tools/pixelart.js <image.png> [--at x,y] [--scale s | --width W] [--colours k] [--max-objects N]
  [--outline r,g,b] [--glow r,g,b] [--into lvl --out lvl] [--json f] [--preview f.png]` -- a picture -> objects,
  with a report of counts per colour channel. `tools/png.js`: PNG read / write in plain node.
- `lib/props.js` -- the prop library: `list()`, `put(name, x, y, opts)`, `place(name, x0, x1, opts)`,
  `header(header, colours)`, `allocator(ch0)`. API and options at the top of the file.
- `tools/props.js list | show <name> | sheet [--theme spooky] | level` -- table, text pixels, contact sheet
  (`local/props/props_<theme>.png`, art-free), the test level `levels/archive/gdlm_prop_test.gdlvl`.
- `tools/props_sheet.py` -- draws the contact sheet (PIL).
- In a spec (tools/make.js): `"props": [{"prop": "pumpkin", "col": 30}, {"prop": "tree", "from": 40, "to": 80,
  "density": 2}]`, `"propTheme": "spooky"`, `"propsCh0": 600`. make.js puts the channels in the header and
  warns when a ground prop stands within 2 blocks of gameplay (it may read as an obstacle).
- Test: `node tests/pixelart.js` (objects redraw the picture exactly; props deco-only, under budget, < 7 blocks).

## How a picture becomes objects

1. Colours: at most k (default 6) -- each colour is one colour channel, so a scene keeps few channels.
   Transparent pixels (alpha < 128) stay empty.
2. Pieces: every pixel is drawn by **deco square 211** (`lightsquare_01_05_color`: a plain white 1x1 square,
   decoration, no hitbox; checked in GD's sprite sheet: solid to the edge, no border) -- recoloured by its
   channel and stretched with 2.2's separate **scale X / Y (keys 128 / 129)** into a rectangle.
3. Merging, painter's order: colours are drawn bottom-up, each with its own **z order (key 25)**, on one
   **layer (key 24, default B2: behind the player)**. A colour's rectangles may run under the pixels of every
   colour drawn above it, so a pumpkin body is a few big rectangles under its face, not dozens around it. The
   paint order is searched (by area, by spread, then single moves while the count drops): an outline goes at
   the bottom as a silhouette. tests/pixelart.js redraws random pictures from the objects, pixel-exact.
4. Budget: `--max-objects N` drops colours (to 3), then halves the grid, until it fits.

Numbers: 16-53 objects per prop of 150-750 pixels; a 40x32 flat illustration with outline 57; a 48x48
smooth gradient at 8 colours 12 (k-means regions are blobby, so it merges well -- photos look posterised).
Whole prop library: 31 props, ~700 objects. Rated 2.2 levels carry 17-22 deco objects per block
(knowledge/objects/README.md), so a 4-block tree at 38 is cheap. Phones: keep a scene under a few hundred
prop objects per screen.

## The props (2026-11-23)

Contact sheet: `node tools/props.js sheet` (day colours) / `--theme spooky`. GD art: the test level through
`node tools/levelmap.js levels/archive/gdlm_prop_test.gdlvl --scale 2 --rows 1` (local/maps/, not committed).

| prop | attach | blocks w x h | objects | colours |
|---|---|---|---|---|
| tree | ground | 3.7 x 4.7 | 38 | bark bark2 leaf leaf2 leaf3 outline |
| dead tree | ground | 4.0 x 5.0 | 53 | bark bark2 outline |
| pumpkin | ground | 2.0 x 1.7 | 31 | orange orange2 stem glow outline |
| house | ground | 4.3 x 4.7 | 46 | wall wall2 roof roof2 dark glow wood outline |
| lamp post | ground | 1.5 x 4.0 | 16 | metal metal2 light glow outline |
| fence | ground | 2.3 x 1.4 | 26 | wood bark outline |
| tombstone | ground | 1.4 x 1.7 | 16 | stone stone2 stone3 leaf3 outline |
| hanging block | hang | 1.8 x 4.9 | 15 | GD chain 110 + stone block |
| gear | bg | 2.3 x 2.3 | 6 | GD cogwheel 85 + pixel hub |
| cloud | bg | 4.7 x 2.0 | 10 | cloud cloud2 |
| moon | bg | 3.7 x 3.7 | 24 | moon moon2 |
| bush | ground | 2.4 x 1.5 | 18 | leaf leaf2 leaf3 outline |
| rock | ground | 2.1 x 1.5 | 20 | stone stone2 stone3 outline |
| robot | ground | 1.8 x 2.8 | 34 | metal metal2 light dark glow eye outline |
| human | ground | 1.6 x 2.8 | 24 | skin hair dark roof shirt trousers outline |
| ghost | bg | 1.8 x 2.2 | 33 | ghost ghost2 dark outline |
| glowing eyes | bg | 1.5 x 0.5 | 8 | eye dark |
| bat | bg | 1.6 x 0.7 | 11 | wing eye |
| crow | ground (perch) | 1.2 x 0.8 | 12 | wing dark eye orange2 |
| candle | ground | 0.7 x 1.3 | 9 | glow light moon moon2 outline |
| flower | ground | 0.9 x 1.2 | 15 | leaf leaf2 petal (seed) glow outline |
| sun | bg | 3.3 x 3.3 | 9 | glow light |
| mountains | bg (foot at y), B5 | 12 x 4.5 | 56 | mountain mountain2 snow |
| hills | bg (foot at y), B4 | 12 x 3 | 17 | leaf3 leaf |
| tower | ground | 2.7 x 6.7 | 18 | stone stone2 dark outline |
| ruin | ground | 5 x 4.3 | 29 | stone stone2 stone3 leaf3 outline |
| cloud band | bg (foot at y), B4 | 8 x 2.4 | 12 | cloud cloud2 -- tile with place(); `flipY` = a top frame hanging from y |
| rays | bg (fan top at y), B4 | 11 x 6.5 | 6 | ray -- 6 rotated stretched squares; give "ray" opacity ~0.3 in the header |
| leaf / petal | bg, T1 | 0.5 / 0.4 | 5 / 3 | orange bark / petal light -- motif particles, place() with density |
| factory wall (chimney) | ground, B3 | 5.3 x 7 | 63 (17 as a silhouette) | brick brick2 dark glow metal2 outline -- a saw-tooth roof, a chimney stack, lit windows (showcase, 2026-11-24) |
| pipes | ground, B3 | 5.1 x 3.6 | 34 | metal metal2 roof outline -- two runs with elbows, flanges and a valve |
| broken arches | ground, B3 | 5.7 x 6.7 | 80 | stone stone2 stone3 leaf3 outline -- a pointed church arch, the right shoulder broken off, a rose ring |
| stained window | bg, B3 | 1.9 x 3.2 | 22 | glass glass2 glass3 stone dark glow -- a pointed window with lead lines; light it with a blending channel |
| witch silhouette | bg, B4 | 2.2 x 1.8 | 13 | witch -- one colour, on a broom, for the sky / against the moon |
| windmill | ground | 4.7 x 5.3 | 92 | wall wall2 roof wood cloud dark outline (diagonal sails are costly: rotate GD squares instead, open) |

Colour names are shared (`NAMES` in lib/props.js), so props placed with one `allocator` share channels: a
forest of trees and bushes uses one leaf channel. Scene colour: `theme` (day, spooky, night, factory) or a
scene `palette` {bg, ground, fill, edge, accent} (the showcase planner's): outlines from edge, lights from
accent, the rest tinted half-way to fill at its own brightness -- one palette per scene, as rated levels do.
Aliases take the planner's plural names (tombstones, jack-o-lanterns, chains, ...).

`place(..., {avoid: objects, clear: 2})` keeps ground and hanging props 2 blocks off every gameplay column (background ones ignore it).

Rules the props keep: calm (no triggers inside a prop; animate a prop's `groups` from outside, on bars only,
TASTE.md); no rings or round orb-coloured shapes near the path; at most ~5 blocks high; no hitboxes. Ground
props stand behind the player on B2 -- fine in GD -- but one right next to a jump can read as an obstacle
(make.js warns).

Frames and see-through fronts (asked by the style session for a landscape level, 2026-11-24): any prop takes
`layer` ("T1".."T3" in front of the play), `scale`, `flipY`, and `channels: {name: ch}` to draw on the caller's
own channels; see-through = that channel's opacity below 1 in the header (P.header writes 1) or an alpha
trigger on the prop's `groups`. The props never use hazard colours; keep fronts off the player's path anyway.

## Colour -- answered in the game (2026-11-24)

**2026-11-24, the cause: key 155.** Our writer put `155,1` on every object. 155 is GD 2.2's colour-batch index: objects
that share a value share ONE colour in the game. Evidence:
- In Brave Blue, 617 of 638 key-155 values go with exactly one colour pair.
- Dreamy carries no 155 at all and is coloured right, so GD works it out on load.
- The user's colour test run (`GD claude-rec 2026-11-24_19-16-56.mkv`, 10 fps from 24 s): every row (squares, circles,
  text, letters) flips at once to the colour of the LEFTMOST row on screen. It is red while A-C lead, white while D (no
  key) leads, red again for E/F, green for G, dark green for H, red for I. One colour at a time.
- So the signature's white, GDLM 67's white rulers and every "deco not as in the viewer" are one bug.

Fixed: tools/io.js `writeGdlvl` never writes 155. tools/strip155.js rewrote all 112 level files (levels/ and
local/wip/) and moved 973 saved-route / cache files to the new keys (tools/solutions.js keyOf ignores 155), so nothing
re-solves. tools/channels.js FAILs a level where 155 is shared across colours.

**The colour test answered, without 155** (`GD claude-rec 2026-11-24_19-30-12.mkv`, ~72-81 s, every letter seen). Each
row keeps its own colour now:
- A (211, 21 = ch 5): red. B (211, 21 = ch 988): red. So 21 works, on low and high channels alike.
- C (211, only 22 = 988): WHITE. A detail key alone is not honoured on an object with no detail part; its main colour
  falls to the default channel 1. tools/io.js now copies 22 to 21 on such objects when writing.
- D (211, no key): white (the control).
- E / F (text, 21 = ch 5 / 988): red. Text takes key 21.
- G (497 circle, 21 = 989): green. H (497, 989 + HSV darken 41/43): dark green, so the HSV keys work.
- I (211, 21 = 987, set only by a colour trigger at the start): red. Trigger-set channels work.
- J (1764 dot, 21 = 988): red.
- The letter labels (text, no key) are white, as designed.
So the colour question is closed: key 21 on any defined or trigger-set channel works, as do HSV and text colour. Never
write 155, and never use 22 without 21.

Correction to the note before: the pink trees and blue hills in the GDLM 67 and colour test recordings are GD's own
background and ground art (header kA6 / kA7), not our deco. They proved nothing about our colours.

Still deco on undefined channels (white whatever 155 says):
- GDLM 67's rulers had no key (channel 1). They are now thin poles on channel 1001 (tools/lab67.js), 0 white.
`node tools/channels.js --all` (score.js gate "channels", FAIL) finds every such object.
- `python tools/whiteframes.py <video>` finds tall pure-white shapes inside the game in a recording: 56 of 99 frames of
  18-58-15, all of them the old rulers. Found:
- GDLM 64 v6, 65 collab test, 66 collab long: the Claude badge (973-975), 96 objects each. tools/collab.js took
  the first part's header only, and the badge's channels live in the last part's. Fixed: the join now merges every
  part's channels (`mergeChannels`). These three levels need a rebuild to pick it up.
- GDLM 67 (252) and 63 (1): the lab rulers on channel 1.
- GDLM 44 (36) and 50 (15): a few gradients and squares on a scene channel whose colour trigger comes after them.
- GDLM 46 arrow catalogue (3): default channel 1.
- gdlm_prop_test (31): rows that test colour keys on purpose.
Clean: 41, 43, 46 sketch, 51, 52, 60, 61, 64, 64 v5.


The signature came out pure white in the real game (GDLM 60): its 211 squares on channels 988-999, channels
in the header. Not understood yet; the visuals session's `tools/colourtest.js` (rows A-J) asks the user. Until
the answer: props set BOTH colour keys (21 main and 22 detail -- either way 211 gets its channel), use channels
600+ (opts.ch0), and the prop test level opens with four pumpkins: **A** keys 21+22 on ch 6xx (what every prop
does), **B** key 21 only, **C** key 22 only, **D** keys 21+22 on channels 40+. Which are orange in the game
decides the default (`chKeys`, `ch0`). Write the answer here.

2026-11-24, recording `GD claude-rec 2026-11-24_02-45-05.mkv` (~238 s): the user played the ONLINE GDLM 44 hellgate
(My Online Levels, "version 3") and its signature figures were pure white again -- but that upload carries the
v2 signature (figures standing on the ground, key 21 only), not v3. The colour test (rows A-J) and the prop test
(pumpkins A-D) were not played in that recording, so the question is still open.

## Creatures and animation: art -> GD objects, measured (2026-11-28)

Why (Evgeni, for Hellgate's gate ending): "a dragon flying or a demon looking from within the door ... a demon approaches and
we shut the gate on him ... i cant tell how good we are at taking other art or creating art and translating it to the game".
Capability test on ORIGINAL art (`art/src/*.svg`, drawn by Claude: a demon face, a dragon body + its near wing as a separate
file). Private page with every picture and the video: https://claude.ai/artifact/7uLH1fUKwpVsyLqfpXmua8 (notes box per method).

| method | tool | demon objects | look | moves by part? |
|---|---|---|---|---|
| hand-built shapes | `tools/artlab.js demon` (`demonShapes`) | 66, 11 channels | bold sticker; few rounds by eye | yes: each part its own group |
| **SVG -> shapes** | **`tools/svg2gd.js`** | 270 (dragon 173 + wing 31) | exact outlines; gradients as 3 cel bands | yes: `<g id>` = part |
| PNG -> masked shape fit | `lib/paintfit.js` `target.mask` via `tools/artlab.js convert` | 100 mush, 200 ok, 400 painterly (rmse 9.8) | soft, ragged edge | no (one piece) |
| PNG -> pixel squares (old) | `tools/pixelart.js` | 56 at 30 px, 150 at 60 px | low-res, stair edges | no |

- **svg2gd**: headless Chromium reads the drawing as drawn (transforms, arcs, computed colours); each filled outline is
  sampled, simplified (`--tol` px), ear-clipped into triangles, and every triangle becomes TWO right triangles 693 split at
  the altitude onto its longest side -- any triangle exactly (`node tests/svg2gd.js`). Cost: 2(n-2) objects per n-corner
  polygon. Circles -> one disk 497; a radial gradient fading to clear -> see-through disks (a glow); linear / radial
  gradients -> 3 bands (the shape clipped to slabs / inner ellipses); strokes -> bars. Opaque pieces grow 0.6 px to hide
  seams. Source: ours, the user's drawings, or CC0 / CC-BY SVGs (credit) -- never copyrighted art.
- **paintfit mask**: `fit({w,h,rgb,mask}, {bg})` keeps shapes inside the sprite (at most `leak` 6% of a shape outside),
  the empty inside starts as `bg` (the level's sky there), error counted only inside.
- **Cost**: a whole creature is 66-400 objects; rated 2.2 levels carry 17-22 deco objects a block, so one creature is
  about one screen of normal deco.
- **Animation** (`node tools/artlab.js level` -> `levels/lab/gdlm_art_lab.gdlvl`, "GDLM art lab", 16 s auto, 637 objects,
  63 triggers, tools/effects.js triggers): the dragon locked to the camera and moved across, its wing turning about a hinge
  object (a 211 at scale 0.01 in the dragon's group); eyes (alpha) before the face (alpha + move), head turns about a pivot,
  the jaw moves; the gate leaves move shut (ease in), sky + iron colour flash, camera-offset shake (1916), sparks moved out.
  Render: `node tools/solutions.js <lvl>` first (a saved route, else a ghost camera), then `tools/shoot.js --at ...`.
- **Not checked in GD yet**: hairline seams between 693 pieces, the glow disks, rotate about a hinge inside a camera-locked
  group, the 1916 shake. Install the lab only on Evgeni's word.
- Viewer fix found here: visual triggers (lib/vfx.js: camera / player locks, rotate centres) were applied only in the GD-art
  look, so art-free and cloud renders drew locked groups scrolling away; now both looks use them.
- Lesson for art for GD: flat SVG, 2-3 tones per part, moving parts (wing, jaw, eyes) as named groups, strong value
  contrast against the scene's sky (the test dragon is dark-on-dark: a drawing fault, not the converter's).

## Open

- GD-art render of the first 18 props (local/props/props_gdart.png, from local/maps/gdlm_prop_test.jpg, 2026-11-23):
  all draw in the viewer's GD art as on the art-free sheet, but in spooky colours the bat and the glowing eyes
  are too small and dark to read (a few pixels on the dark sky), the hanging block's chain is faint, and the
  bush / rock / tombstone sink into the ground hills. Next: bat and eyes 2x, ground props on B1 or a lighter
  edge. The 5 newer props (crow, candle, flower, sun, windmill) and the A-D pumpkins are not rendered yet (the
  PC was full: re-run `node tools/solutions.js levels/archive/gdlm_prop_test.gdlvl`, then levelmap).
- The colour answer (above); then the in-game look of the test level (sizes, z order, seams between stretched
  squares at non-integer scales).
- More props for the showcase planner's places (crow, candle, windmill, flower, sun are in): kelp / coral (or wrap
  scenekit's), witch silhouette, broken arch, stained window.
- Diagonal edges: half-cell triangles (693 lighttriangle) on staircase edges would smooth curves cheaply.
- Glow: GD's own glow / gradient pieces (1293) behind lamps and eyes, once the colour answer is in.
- Pictures from Blender (tools/blender_model.sh in the GamePlatform kit: render a model small, flat-shaded,
  then tools/pixelart.js) -- not tried yet; PIL drawings and hand-drawn rows work.
- The signature v3 is built from this library (robot + human, both colour keys, channels 976-989 via props.header, the stage 3 blocks over the path; tools/signature.js, merged 426b12b, checked by visuals on GDLM 45). Unchecked: GD art and the game.

## Claude icons (the solver's own icon set, 2026-11-24)

The user: "lets make an icon set for claude" -- in the viewer the solver plays with its own icons next to the
user's GD icons. `lib/claude_icons.js`: one original pixel icon per mode (cube 16x16 px, ship, ball, ufo, wave,
robot, spider, swing), the signature robot's face (a dark visor with two amber eyes, a cream brow plate, an
antenna light) on a terracotta body, cream plates, dark-brown outline, glow (255,150,80). Our own art: no logos,
nothing of RobTop's. `node tools/claude_icons.js sheet` -> local/props/claude_icons.png (icon size + 4x, dark and
GD-blue backgrounds); `png` -> one PNG per mode for the viewer (viewer/icons/claude/, after the user's OK);
`text <mode> [kit]`. Then the user's reference pictures (a player's icon kits; a sheet of GD-style faces): it
must read as ONE kit -- one motif on every mode, one palette, thick dark outlines, simple shapes. So
lib/claude_icons.js is now bodies with a face slot + a kit's motif: kits A visor bot, B a cream "C" mark with a
spark dot, C a happy face; `node tools/claude_icons.js kits` -> local/props/claude_kits.png (one row per kit).
Then the user's "main traits": Claude's spark -- a radial starburst of thin rays, terracotta and cream. Kits
D (cream rays on terracotta), E (terracotta rays on a cream disc), F (D with two eyes at the hub); drawn as our own
pixel rays (8, long / short; 12 smear below a 16-px slot), each body's bigger "spark slot".
`node tools/claude_icons.js kits --only spark,spark2,sparkface` -> local/props/claude_spark_kits.png. The spark
evokes Anthropic's Claude mark: fine in our viewer and levels; think before it goes on anything public as "official".
The user: "your icons are ok" -> kit D ("spark": cream rays on terracotta) chosen by the art session. Viewer files:
`node tools/claude_icons.js png --kit spark` -> viewer/icons/claude/<mode>.png (8 px a pixel, glow included, for
gd-visuals' "solver" icon). The end sign (tools/signature.js) carries the spark as a round badge above the title
(`CI.badge(24)`: 12 rays, 2 blocks, channels 973-975, ~30 objects; `badge: false` turns it off). Private levels only
for now (the spark evokes Anthropic's mark). Unchecked in the game.
STATUS (older): viewer files (for gd-visuals) and an in-level prop
version (GD objects, like the signature) come after it.

## Colour readability (the user, 2026-11-24: "sometimes its not clear and its all mooshy")

A soft rule, scored by `node tools/contrast.js <level ...> [--all] [--official] [--worst N]` (also score.js gate
"contrast", WARN under 70). Every 10 blocks, with the colours the header and colour triggers give there (time ~ x at
1x: approximate on levels with speed portals), it measures LUMINANCE contrast (WCAG ratio): hazard/bg, block/bg,
ground/bg (or the ground line), a hazard against a differently-coloured block next to it, and deco in front of hazards.
Thresholds = the official levels' 10th percentile: hazard/bg 1.6, block/bg 1.15 (was 1.5: see "Retuned" below), ground/bg 1.1 (or line/bg 3),
hazard/block 1.3 (only when their colours differ: one colour for both is normal GD, told apart by shape), 40+ deco
pieces on hazards in a section. Official medians: hazard/bg 2.1-21 (most 3.5-7), ground/bg 1.0-3.9.
Official section scores: 4-100, median ~88 (Fingerdash 4 and Dash 26: heavy colour-trigger / copy-colour effects the
approximation reads badly -- a known limit; Stereo Madness .. Hexagon Force 67-100).

GDLM sweep (2026-11-24): 47 sunny side 38 (blocks / spikes at the sky's brightness, block/bg ~1.3; a spike and its
block in two hues at one value, ~27-28 s and ~97 s), 45 first flight 74 (block/bg 1.08 at ~31 s), 44 hellgate 75
(ground at the background's brightness, ~1-3 s and ~10 s; its bright line saves part of it), 51 adrift 97 (deco over
hazards ~7.7 s); the rest 100. Pictures: local/shots/ (shoot.js at those times).

**Retuned 2026-11-24 (gd-taste's section comparison, `tools/compare_sections.js`, local/compare_sections/report.md):**
our sections scored 100 against 50 for 7 real levels -- we were overshooting. Taken apart per rule on the 5 rated 2.2
levels there:
- their background sits at luminance ~0.2-0.26 (Dreamy, Spooky Dash) or near black (SLAM, Subwoofer Lullaby, boogie);
  ours ran from 0.015 (52) to 0.47 (64 v5, a bright sky);
- their blocks sit CLOSE to the background (block/bg medians 1.35-3.4, SLAM 6.2) and read by their outlines; ours
  5.6-15 (black blocks on a bright sky). Most of their "fails" were block/bg 1.08-1.5, so the floor is now 1.15;
- their hazards stay clear (median hazard/bg 3.8-4.2 on mid-tone levels); SLAM / Subwoofer / boogie read under 1.6 by
  fill but their spikes carry glow outlines the measure cannot see (a known limit). **The hazard floor stays at 1.6:**
  the user's "mushy" note was about hazards, and that rule does not move;
- new soft note **STARK**: median block/bg over 6.5 (above every rated level) = WARN in score.js. 8 GDLM levels were
  stark that day (43 climb, 44 hellgate, 46 sketch, 46 arrow catalogue, 50 eclipse, 51 adrift, 52 necromancy, prop test;
  `node tools/contrast.js --all | grep STARK`).
In short: **mid-tone scene, clear hazards.** `require("./tools/decokit.js").midTone(hue)` gives a palette that does it
(bg at luminance 0.17, blocks 3x darker -- the checklist's "three values" -- with a light outline ~8-9x off the block,
hazards ~4.4x, three deco depths between bg and block, ground darkest).

**The palette rule** (for compose / scenes / anyone picking colours):
1. Pick the background first, mid-tone (luminance ~0.2) or dark; then put HAZARDS and block EDGES at the other end of
   brightness (ratio >= 3 is safe, 1.6 is the floor). Block fills may stay near the bg (1.3-3x): the edge carries them.
   A bright sky with black blocks everywhere is the stark fault (block/bg > 6.5).
2. Hue is for mood, value is for reading: two colours one step apart in hue but equal in brightness are mush.
3. Ground: a step darker or lighter than the bg (ratio >= 1.1), or a bright ground line.
4. Colour triggers keep the rule at every moment: check the colour a trigger fades TO against what is behind then.
5. Glow and deco go behind the play (B layers) near hazards, and are dimmer than the hazards' edges.
Tool: `require("./tools/contrast.js").ratio(rgbA, rgbB)` for a quick pair check; `measure({header, objects})` for a level.

## Colour by role (the user, 2026-11-24)

The user, twice the same day: "your color choices sometimes are bad according to background/path/spikes, sometimes its
not clear and its all mooshy", then: **"Usually the contrast in our games is pretty bad. Can we do clear contrasts
between the different things (ground, spikes, deco). Sometimes the path is very unclear with similar shades of black,
grey, brown (at least in previous levels)."**

This does NOT conflict with "go mid-tone" (gd-taste's comparison, above): the BACKGROUND and the DECO may be busy and
mid-tone; the PLAYABLE things separate from them by role:
- path (blocks, ground): one clear value band, read as a MASS, with edges that read against the sky and the deco;
- hazards: their own hue and value, never the deco's or the blocks' (one colour shared with their block, as in GD's own
  levels, is noted "shape only", not failed);
- orbs, pads, portals: GD's own bright art (not measured yet: open);
- deco: never in the path's or a hazard's value AND hue family where it touches them; it melts into the sky instead.

**The check: `node tools/roles.js <level ...> [--all] [--shots N]`** (score.js gate "roles", FAIL at 10% of sections).
Every 10 blocks, with the colours of that moment, pairs: path/bg, path/deco, hazard/path, hazard/deco, hazard/bg.
"Similar" = a luminance ratio under the pair's limit (1.3-1.6) AND one hue family (both grey/black/dark, or within 35
degrees of hue: black, grey and dark brown are one family). What it learned on the way, from the user's own recording
of GDLM 52 (2026-11-24_19-34-49.mkv, frames every 25 s):
- GD draws a block skin as a see-through DARK BODY (~62% black over the sky) with edge lines in its colour, and a spike
  as a black body with a coloured rim. So the colour we give a block (key 21) is its RIM, not its fill. Measuring the
  rim alone, every GDLM level passed -- while the recording shows dark grey bodies, a grey-purple sky and grey gears /
  houses all at one value, with only thin rims apart. That is the mush. Now a block's body counts;
- a bright rim (3x+ off the sky) still carries a body lost in an EMPTY sky (Can't Let Go's black on black with white
  edges reads fine); deco in the body's value touching it is what turns it to mush;
- deco with no colour key draws GD's own black-and-white art: not judged.
Calibration: officials 1-18 pass (0-5% of sections); Geometrical Dominator, Deadlocked, Fingerdash and Dash
fail on copy-colour / 2.0+ block art the measure reads badly (the same limit as contrast.js). Featured community levels
(SLAM, Subwoofer Lullaby, Spooky Dash) fail too: busy deco next to the path, carried by glow the measure cannot see.
The user asked for clear, so the officials are the bar here, not the featured levels.

**Sweep 2026-11-24** (share of sections that mix a playable role): 64 golden hour v5 83% (brown deco on brown path
pieces), 52 necromancy 94% (grey deco in the bodies' value), 62 low end lullaby 38%, 66 collab long 72%, 69 time hop
57%, 47 sunny side 63%, 50 eclipse 83%, 44 hellgate 78%, 65 collab test 78%, 70 candy night 31%, 45 first flight 47%,
51 adrift 39%, lab round 1 v1-v6 27-100% (light yellow blocks on a yellow sky, ratio 1.13). Clean: 41, 42, 43, 46,
60, 61, 63, 67, 68 camera lab. Pictures of the worst spots: local/roles/<level>/sheet.jpg (`--shots 3`).

**What counts as the block itself, not deco beside it** (2026-11-25, after GDLM 71's first join and Hellgate v7 were
flagged for their own block dress): a fill laid over a block; any piece whose box lies inside the path's mass (bricks,
merged fills, panels; scenery block skins under a floor count as mass); a light-square part laid on a block; rim lines
and top glows along a block; crumbs under 0.1 block^2 (trims, specks, stars). A B5 piece of 9+ blocks^2 (a moon, a
planet) or a B5 glow is sky. What still fails is real: GDLM 44's dark-red skyline / column silhouettes (B3-B4) at the
blocks' value, 52's grey-purple backdrop, and GDLM 71's compose modern-pass deco (channels 20/22, run AFTER the theme
scene in make.js) next to the kit's bodies -- with a theme, the brief should say "modern": false.

**The palette: `require("./tools/decokit.js").rolePalette(hue)`** -- bg mid-tone (0.17) in the scene hue; pathEdge a
light off-white (rim, key 21 of blocks; the line too); blockFill near-black; ground darker than bg; hazardEdge in its
OWN hue (scene + 150 degrees), 2.6x off the sky; deco far / mid / near just under the sky (0.88 / 0.72 / 0.56 of its
luminance: ~2x off the blocks' bodies); accent for motes and rays. `P.check` runs roles.js's pairs on the palette
itself (all 24 hues pass, tests/decokit.js). midTone (above) is superseded for play colours.

## Taste: the deco side (owned here since 2026-11-24)

gd-taste handed the deco side of the taste work to this session (TASTE_DATA.md "Handoff (2026-11-24)"): the taste model
reads only decostudy v2's per-screen rows (dsDress, dsChannels, dsMotion, dsPerScreen; glow dropped, its effect unclear).
**When tools/decostudy.js changes, refit: `node tools/taste.js learn`.** Open: trigger-built 2.2 levels (Subwoofer
Lullaby) render black and measure empty -- they need measuring at the positions their move triggers put objects.

## Theme kits (2026-11-24)

The user: **"Do we have some things besides colors to represent higher concepts like icy, hellish, forest, space,
artistic, just colorful... we will make sure some versions of spikes, ground and deco are available for those moods. And
a matching song with those. Together with more unique scenery, if needed. Let's take the motif of space. Somewhat black
background. [...] Bit more flying with space. Sections may give different vibes of space, a bit lighter, a bit darker.
Bit more planets or deco. Different structures and objects. But in all, trying to create a cohesive experience."**

**The format** (one module per mood, `tools/themes/<name>.js`; `node tools/theme.js` loads, checks and demos them):
- `VARIANTS`: the moods of the theme as palettes of ONE family (space: `dark` | `light` | `nebula`), each with its mood
  words, default motion energy and set piece. Every variant is a role palette (bg, ground, line, pathEdge = the blocks'
  rim, blockFill = their body, hazardEdge, deco depths) and must pass `node tools/theme.js check <name>` (tools/roles.js's
  pairs on the palette: the path, hazards and deco never mix);
- `CH`, `G`, `BLEND`, `channelMap(v)`, `palette(v)`: its channels and groups (space: channels 80-97, groups 420-433),
  and the palette in the shape decokit.rolePalette returns (the section lab and compose read the same keys);
- `SONG`: the song brief -- bpm range, length, mood, energy shape, pad stretches, loud/quiet range, title words.
  `node tools/theme.js song <name>` ranks the local songs against it (local/songmap/ + local/songs/ titles);
- `MODES`: the mode mix (space: more flying, `flyShare` 0.5, ship / wave / UFO first);
- `dress(ctx, section)`: one section's look -- the play's colours (key 21 rims, key 22 bodies), the dress on the blocks,
  sky layers, the set piece, mid-ground pieces, terraces; `MOTION`: its groups for decokit.motion;
- `pieces`: the parts by name, for hand-made scene scripts.
**Applied** by `tools/scenes/theme.js`: spec `"scene": "tools/scenes/theme.js"` with `"theme": "space"`, or
`{"name": "space", "variant": "dark"}`, `{"name": "space", "variants": ["dark", "nebula", "light"]}` (cycled over the
sections), or `{"name": "space", "sections": [{"from": <block>, "variant", "piece", "energy"}, ...]}`. It removes the
builder's own sky / ground / line colour triggers, defines the kit's channels, fades each section's palette in just
before it, dresses each section and adds the motion. compose (brief "scene" + "theme"), collab parts and the lab use it
the same way. `node tools/theme.js demo <name> <level>` dresses a copy of any level's gameplay (local/themes/).

**Space** (`tools/themes/space.js`), from the user's references (local/refs/space/, local only: "The Moon" and a set of
space-themed demons): near-black / navy sky with stars; one huge set piece per section (an eclipse ring in `dark`, a
ringed planet in `light`, a glowing moon in `nebula`, a station now and then), carried with the player so it stays in
view; blocks as lifted-navy bodies with bright cyan rims, inner glow panels on stacks and a glow under open tops;
spikes with a pale lavender rim of their own; asteroid fields (rough rocks, two bobbing / turning groups) and stepped
black terraces only under open sky; nebula clouds in magenta and teal (other hue families than the path, so their glow
never reads as path); shooting-star streaks; stars twinkling on two groups. Nothing warm: orbs and portals stay the only
warm colours. Measured on demos over GDLM 45, 62 and lab r1 v1 / v4: roles 0% of sections mix (each variant's
palette: rim/sky 10.7-12.5, hazard/sky 12.8-15.2, body/sky 1.5-2.4).
Lessons on the way (now in roles.js): a fill laid over a block IS its body (measure that, not the skin's); a huge B5
piece (nebula, planet) is sky, judged like the sky; near black every colour looks alike by luminance (the +0.05 in the
ratio), so deco next to dark bodies must differ by hue family or be clearly lit -- space bodies are a lifted navy so
black deco (terraces, the planet's night side) stands off them.
Round 2 after the first renders (local/themes/space_demo_sheet.jpg): the nebula was flat hard-edged disks and blew out
to white over the moon's corona -> clouds as three nested faint blending disks (opacity 0.2), none under a moon; the rocks'
lit triangle read as an ARROW (misleading) -> a square facet; GD's own middleground hills drew icy waves along the floor
-> the kit sets the header art (`HEADER`: kA6 1, kA7 1, kA25 0); a fourth variant `moon` (pale slate sky, the moon the
brightest thing, pink hazard rims) for GDLM 71's climax. With no variant given, each section takes the variant whose sky
is nearest the builder's own bg (log luminance + hue), so a brief's parts keep their mood (GDLM 71: dark arrival ->
dark, launch -> light, nebula -> nebula, deep -> dark, moon -> moon).
Round 2 renders next to the user's references: local/themes/space_vs_refs.jpg. Verdict: clean and readable, one
family, the moon and eclipse ring work; but far plainer than the refs -- the refs are dense (spike rows with glowing
outlines everywhere, saturated blue, jagged foreground silhouettes, a huge crescent), and our nested nebula disks read
as pink targets -> nebula now only in the nebula variant, sparse and fainter. Next: a soft glow sprite for the nebula
(no hard disk edges), the GD bg art's grey grid shows through (pick a plainer kA6), foreground silhouettes in front
(T2-T3, black, away from hazards), denser glowing spike rows from the dense structures.
**Open:** in-game check of the blend channels (nebula, corona, panels); the "artistic", icy, hellish, forest and colourful
kits; chevron direction cues as a kit part; a space structure set (floating platforms, satellites as play pieces).

**Ice** (`tools/themes/ice.js`, 2026-11-25, for GDLM 72 FROSTBITE from the user's brief: "Ice blue, cyan, white, dark
navy, and occasional purple accents [...] Backgrounds should remain darker and less detailed than the gameplay"). Six
variants, one per background style the user listed: `peaks` (distant snowy mountains), `caves` (dark blue, icicles,
cyan crystal clusters), `shards` (abstract geometry mirrored about the middle of the view, purple + cyan: the reversal),
`crystal` (glowing crystal formations, brighter), `descent` (dark navy, frozen pillars, icicles, dimmer), `blizzard` (a
big mountain over a range, the most snow). Shapes are our own: a mountain, a crystal or an icicle is a PAIR of light
triangles (693 and its flipX side by side, scaled; one face lit), snow caps the same, smaller, on a pale channel. The
play: dark navy body, light cyan rim, a white frost line on every open top, a crack through some inner blocks, a few tiny
glowing crystals (designBlocks windows at 0.12); hazards on a near-white rim. Snow: dots in two groups carried down-left
over each section by one move trigger each (B2, a few in front only away from the play). Palettes: the dark variants
first failed roles (deco in the bodies' value); the deco depths were lifted until `node tools/theme.js check ice` passed
(far / mid / near 1.35x+ off the navy body). Open: not yet seen in the game; whether GD draws 693 scaled non-uniformly
as the viewer does.
**Gotcha for every kit (found on GDLM 72, round 2):** a lock-to-player move (`K.lockX`) on a group shared by all
sections moves EVERY earlier section's objects of that group again: the first section's mountains rode along the whole
level. The ice kit gives each section its own parallax groups (470 + 3 * section). The space kit still shares G.piece /
G.far across sections (GDLM 71): for gd-art to check in its renders.

**Sunny** (`tools/themes/sunny.js`, 2026-11-26, for GDLM 73 sunny streets from the user's prompt: "Sunny mood, buildings
clouds birds. happy colors, good contrasts. rather pacy"). The first LIGHT-sky kit: the contrast comes from the play being
the darkest, most saturated thing on screen (a deep cobalt / berry body, bodyBg 5.6-6.9) with a sunny-yellow (golden:
cream) rim and a pale roof line on every open top, windows lit on stacks (blocks read as little buildings); hazards on a
hot pink-red rim (hazardEdge vs pathEdge 2.2-5.7). Behind: a far skyline of pale buildings near the sky's value (never
reads as solid), a nearer row of pastel houses in three channels (pink / mint / lilac, pitched or flat roofs, soft
windows that twinkle on the beat), puffy clouds (5 disks + a shaded underside) on two depths drifting left, a sun with
two blending halo rings and slowly turning rays carried with the player, and flocks of small birds (a "v" of two lines
per bird, each wing in its own group swaying on the beat = flapping) flying left across the sky. Five variants:
`morning` (pale blue, low sun), `noon` (bluest, busiest), `breeze` (near-white sky, big clouds and a low cloud bank, no
buildings: for flights), `park` (mint sky, trees and low houses, most birds: the break), `golden` (warm afternoon, berry
blocks, cream rims). Header bg art 13 (the flat texture that shows a bright colour as set). Channels 140-156, groups
540-550, per-section parallax 570 + 4 * section. `node tools/theme.js check sunny`: all five pass (park's mint houses
first matched the yellow rim: edge~mid). Open: not yet seen in the game; whether the wing sway reads as flapping.
**Gotcha for every kit (GDLM 73 v1):** a kit that sets key 21 only on `solid` and `hazard` objects leaves SLOPES (kind
`slope`, 1338 etc.: every fly-path corridor wall) on the default white; on a light sky they matched the white clouds (roles
FAIL pathDeco, 15 sections). The sunny kit colours slopes with the rim; ice and fire still skip them (dark skies hide it).

## Deco library (2026-11-24; the user: our levels look like "3 squares and poopy" next to real ones)

Targets: knowledge/levels/modern_look.md "Recipe" (20-50 objects per block, layers B4-B5 ~20% / B1-B3 ~25% / T1 /
T2-T4 15-25%, a third of channels blending, HSV on ~40%, motion per minute) and the per-screen study below.
- `tools/decokit.js` (own compositions, deco only, the caller's channels):
  `blockPattern(objects, x0, x1, {ch, top})`: running-bond bricks inside closed cells, a lit top trim (band + grass
  triangles) on open tops, ~2-4 per cell. `backdrop(x0, x1, {far, mid, near, trees})`: three depths of one-colour
  silhouettes (mountains B5, hills B4, a tree line in two sizes B3), using props' new `silhouette` option (a tree 38 -> 14 objects).
  `tufts(objects, x0, x1, {ch})`: grass in front at the ground line, 2 blocks clear of hazards / orbs / portals.
  `depthColours(sky, tint)`: far / mid / near from the sky (aerial perspective).
- `tools/decowin.js <level> --at b1,b2 [--w 24]`: a quick art-free picture of level windows (flat shapes, start
  colours, objects per block in view); no solve, not heavy. For GD art: tools/shoot.js (heavy).
- First pass on a copy of GDLM 64 golden hour (local/deco/gh_before_after.png): 13.7 -> 26.7 objects per block (pattern
  2.7, backdrop 7.8, tufts 2.5). Lessons: (1) a dark silhouette right behind the path swallows black spikes -- back
  layers paler toward the sky with distance (depthColours); (2) what reads as "squares" most is BIG FLAT RECTANGLES
  (sky / frame clouds as one stretched square each): edges need shape -- scalloped "cloud band" props, stepped
  silhouettes, gradients.

## Deco study: real levels per screen (2026-11-24, `tools/decostudy.js`, 822 levels, measured again 2026-11-24 with glow v2, 39 min)

One screen is 20 blocks (600 units). Each level gets its median screen, and the table shows each group's median.
gd-taste's corpus is local/taste/corpus.json. The results stay in local/decostudy/ and are not committed.

| group | levels | objects/screen (per block) | layers | dress per play object | glow | channels | motion triggers/screen | contrast |
|---|---|---|---|---|---|---|---|---|
| taste featured | 192 | 372 (18.6) | 3 | 3.8 | 25% | 8 | 15 | 45 |
| legendary 2.2 | 18 | 416 (20.8) | 4 | 6.0 | 12% | 15 | 63 | 44 |
| featured 2.0-2.1 | 26 | 347 (17.4) | 3 | 3.7 | 47% | 6 | 11 | 56 |
| taste other (not featured) | 105 | 266 (13.3) | 3 | 2.2 | 5% | 4 | 6 | 63 |
| official 1-22 | 22 | 112 (5.6) | 3 | 0.5 | 1% | 0 | 2 | 93 |
| **GDLM (ours)** | 16 | **31 (1.5)** | 2 | **0.2** | **0%** | 0 | **0** | 100 |

Glow is measured as v2: blending channels plus the glow / gradient / fade / blur families. v1 also counted plain 211 / 693
pieces, because their family is "lightsquare", and gave about twice these numbers.

Quartiles (p25-p75):
- taste featured: n 242-632, dress 2.0-6.2, motion p75 35;
- legendary 2.2: n 341-623, dress 3.8-16.9, motion p75 82;
- GDLM: n 7-123, dress 0.0-0.6.

What it says:
- **Density.** Featured levels carry ~12x our objects per screen, and even RobTop's own levels carry 3.6x.
  What separates featured from not featured: dress (3.8 vs 2.2), glow (25% vs 5%), channels (8 vs 4) and motion (15 vs 6).
  The overall count matters less (372 vs 266).
- **Dress is the biggest gap.** A featured level puts ~4 deco pieces within 1.5 blocks of every block or spike, a
  legendary one ~6; we put 0.2. So the play objects themselves get decorated: trims, fills, outlines, glow around them.
  A backdrop alone does not close it.
- **Glow:** a quarter of the objects in a featured level sit on a blending channel or come from a glow / gradient family.
  In legendary 2.2 it is 12%, and in 2.0-2.1 featured levels 47%: glow-heavy is the older style. Ours: none.
- **Motion:** 15 motion triggers per screen (move, alpha, pulse, particles...), 63 in legendary 2.2. Ours: 0.
  Section by section against real levels (compare_sections, 2026-11-24): rated 2.2 median 48 per screen (Dreamy 45,
  SLAM 50, Subwoofer 73) and ~1700 pulse / move / rotate triggers a minute; ours 10 and 406.
- **Layers:** a median of 3 layers holding 5% or more each. The back and front shares are small (most deco sits at
  B1-T1 around the play), so depth comes from colour more than from layer count.
- **Contrast is not what featured levels win on:** their median is 45 on tools/contrast.js, while the officials score 93
  and we score 100. The score reads only start and trigger colours (no glow, no art), so a busy level loses points.
  Keep it as a floor for OUR levels (WARN under 70), not as a taste target.

**Targets for a GDLM level (per screen, play sections; retuned 2026-11-24 to gd-taste's section comparison, which
measured the same sections of 7 real levels: their medians in brackets):**
- n 500-900 per screen, 25-45 objects per block (rated 2.2 median 37 per block; ours 9);
- dress at least 3 per play object (rated 2.2 median 7.8);
- glow 10-25%;
- at least 8 channels, with HSV variants (rated 2.2 median 14; ours 2 in the plain levels);
- motion by the song's energy: drops ~45 triggers per screen and 1000-1700 a minute, grooves ~25, calm parts ~12
  (rated 2.2: 48 and ~1700; ours 10 and 406). `decokit.motion(x0, x1, {beat, spb, energy, pulse, bob, sway})` puts
  them: 4 pulse + 3 bob + 1 sway groups = 46 a screen at energy 1, 23 at 0.3. Pulses mostly OFF the beat (real ~30%
  on a beat; ours 57% reads as a metronome): motion() puts only the first pulse group on it;
  first user: tools/scenes/golden_hour.js (GDLM 64 v8, style, 2026-11-24): pulse stars / rays / sun halo, bob motes /
  clouds / backdrop, sway grass; energy per scene 0.3-1; ~44 triggers a screen on v5's gameplay (was 11). It keeps its
  bright golden sky (luminance ~0.47, block/bg 5.6: under the stark line) as the level's idea;
- at least 3 layers;
- contrast: hazards clear (contrast.js 70+, the hazard floor unchanged) but NOT stark (median block/bg under 6.5): a
  mid-tone scene, `decokit.midTone`.

Check any level with `node tools/decostudy.js <file.gdlvl>`.

**Order of work** (gd-taste's model with these measures in, TASTE_DATA.md "Per-screen deco measures", 2026-11-24):
- Motion first: put move, rotate or pulse triggers on deco on every screen. It is the strongest signal for featured
  levels, with effort taken out (+0.32), and holds for epic+ too (+0.36).
- Channels next: +0.18.
- Dress counts mostly as effort (+0.12).
- Glow helps featured over the rest (+0.14), but the best levels use LESS of it (epic+ against featured -0.26). Keep it
  moderate: 10-25%, not something to maximise. gd-taste's refit on v2 glow (370c634): glow is unclear within a band. Featured against the rest is +0.05 with effort out
  (-0.10..0.20); epic+ against featured is -0.17 (-0.32..0.02). So the pooled 25% vs 5% gap comes from era and effort,
  and glow is out of the taste model. Use it as a look choice, not a score.
- Layer count says nothing.
score.js's "taste" gate now includes these measures.

**Reference levels**: readable (contrast 70 or more), dressed and layered, with n 300-3000 per screen. Ids are
community levels in local/community/ (local only).

| id | name | n/screen | dress | glow | channels | motion | style |
|---|---|---|---|---|---|---|---|
| 138346597 | Hyperluminal | 1945 | 52 | 16% | 18 | 22 | very dense, detailed |
| 92555035 | Dreamy | 372 | 28 | 30% | 15 | 43 | soft glow, lots of motion |
| 149743086 | how is it october | 792 | 56 | 1% | 9 | 0 | flat-colour scenery, no glow |
| 141525782 | Brave Blue (legendary 2.2) | 383 | 17 | 8% | 20 | 34 | modern 2.2, our density range |
| 31912642 | Project Muse | 729 | 14 | 21% | 9 | 112 | motion-heavy |
| 27483789 | First Race | 478 | 5 | 74% | 9 | 5 | glow-based (2.0-2.1 style) |

Dreamy sits at our target density: compare against it first (tools/decowin.js, or tools/shoot.js for GD art).
Brave Blue only by numbers (decostudy / decowin), not by rendered frames (below).

Open:
- deco on a moving group counts at its start x;
- glow is counted by family and blending only, not by how it looks;
- the dress radius (1.5 blocks) was not tuned.

### Side by side: GDLM 64 vs Dreamy (2026-11-24, tools/compare_frames.js, local/compare/GDLM_64_golden_hour_vs_Dreamy/)

At 70%, Dreamy shows 10.4 objects per block and GDLM 64 shows 36.3, yet Dreamy reads as designed and ours as noise.
**Density is not the gap: the shapes are.** The lessons are soft rules for decokit / props / scenes:
1. **No visible pixel steps.** Our trees, hills and clouds are pixel art on a 6-7.5-unit grid, so every edge is a
   staircase, and at screen size that reads as low-res. Dreamy's edges are smooth: round puffs (circles), straight
   facets (rotated triangles), long clean curves. Big organic shapes should be circles and rotated pieces, not grids.
   Pixel art stays for small props (house, robot), where the pixel look is the point.
2. **Fewer, bigger shapes.** One cloud is about 6 overlapping circles, and one tree is a trunk plus 3 facets. Many small
   squares of one colour become texture, not a shape.
3. **Hue separation.** Dreamy puts saturated play blocks on a pastel field, and its scenery comes in 4-6 distinct hues
   (white clouds, blue sky, a rainbow). Ours puts pink scenery on a pink sky, with the play the same hue as both. Keep the
   backdrop in one hue family and give play and focal props a contrasting hue. tools/contrast.js checks value only;
   hue is not checked yet.
4. **A frame, not a wall.** Dreamy's white cloud bank runs along the bottom edge and leaves the middle of the screen
   open around the path. Ours fills the whole height behind the path with trees.
5. **Play blocks get a drop shadow and a light outline** (Dreamy's offset darker copy), so they sit in front of busy art.
(The how is it october frames came out empty: the camera ghost on a level without a route; visuals is redoing them.)
Brave Blue and Project Muse were also compared (local/compare/...):
- Brave Blue's frames show a bare sky and ground while the label counts 8-48 objects per block in view. Its 2.2 groups,
  moved or toggled by triggers, are not drawn by the camera ghost, so the pair is not usable yet. Visuals (2026-11-24)
  fixed the ghost camera for routeless levels and re-rendered: still empty. Its playfield sits far above the ground,
  likely brought down by move triggers or a start position the sim does not place, so it is movers / physics work,
  not a camera fix. Dropped as a rendered reference.
- Project Muse is a text / gimmick level that ranked high on motion alone. It is not a look reference.
For now, Dreamy is the working side-by-side reference.

## Deco as a picture (2026-11-26): DECOART.md

The backdrop painted as one picture first, then built from flat GD shapes (fitted or as clean vector); round 1 on
GDLM 44's opening. The art-free view now draws 211 / 693 / 497 / 1764 as their shapes.

## Deco options and composition (2026-11-25)

The user: "lets think more about the deco, just evenly putting things is not good enough", then "show me some deco options
we can do, for bricks, for deco. the best features so far. idk for ice/fire."
- **`tools/decodemo.js [base] [--shots]`**: one stretch of gameplay (GDLM 50 eclipse, blocks 0-150: cube town + ship
  corridor) dressed in 7 rungs, each adding one feature (bare, lit edges, texture, inlays, depth, atmosphere, composed),
  in ice (the kit) and fire (the ice kit's shapes in lava colours plus Hellgate's chains, skulls, ruins, embers). `--shots`
  renders them with shoot.js and writes the sheet `local/decodemo/index.html` (GD art: PC only). All 14 pass roles.js and
  channels.js. Fire's kit is `tools/themes/fire.js` since 2026-11-25 (below).
- **`tools/decogallery.js [--shots]`** (the user: "like firy blocks or spikes, some options of how it might look. background"):
  one small strip, one element changed at a time -- 5 block dressings, 5 hazard treatments (incl. the ice spike 177-179 and
  thorn pit 9 skins), 6 backgrounds -- each in ice and fire; page local/decogallery/index.html (GD art, PC only).
- **The picks became kits (2026-11-25, the user: "continue with your picks")**: `tools/themes/fire.js` (new: obsidian + lava rim,
  molten seams, plain spikes with a few sparks, two rock ranges, lava haze, rising embers; chains and rays as quiet extras;
  variants molten / inferno / ash); ice's icicles under open bottom edges were tried and removed (below). Use with brief/spec
  `"theme": "fire"`. Fire demo on Eclipse's play: roles 0/35, white 0, decocomp quiet 0.15, focal 0.36 (officials' p50
  0.08 / 0.33).
- **First kit renders (2026-11-26)** and what changed: the ice kit's icicles under block edges hung inside the lanes beside real
  ceiling spikes and read as hazards: removed. The fire ranges filled the lower screen: now `ridges()` -- peaks 60-140 /
  25-60 high, 40-50% of them dropped for gaps, a value step darker (roles 0/35 still). The middleground channels 1013/1014 are
  set (undefined, the viewer drew lilac hills). The dashed vertical line in every frame was the viewer's ghost camera (no
  route for the demo level): `theme.js demo --shots` now shares the source level's route. Gallery verdicts: the lone big peak
  (ice) and volcano (fire) backgrounds read as a wall -- not used; the lit strip under spikes barely shows.
- **`tools/decocomp.js`**: how deco is ARRANGED (rhythm cv, quiet stretches, peaks, focal share, clumping, set pieces,
  deco at transitions, following the play); `--ref` the officials' and the corpus' numbers -> knowledge/decocomp_ref.json.
  Our levels: quiet ~0 (no breathing space), focal 0.25-0.29 (near even, 0.2). Reference (2026-11-25, p25/p50/p75):
  officials quiet 0.02/0.08/0.20, focal 0.30/0.33/0.36, cv 0.56/0.77/1.22, big 0/0/0; 2.2 featured (n=77) quiet
  0.03/0.12/0.22, focal 0.30/0.35/0.39, cv 0.63/0.94/1.30, big (set pieces per screen) 3/11/28, clump median 4.5 (officials
  0.5), ~21% on back layers and ~22% in front (officials ~0). So: targets quiet >= 0.1, focal >= 0.33, cv >= 0.8, and set
  pieces are what separates modern featured levels.
- **`tools/lane.js`**: the play lane from the route (where the player can be), clutter in it, art at its edges, corridor
  framing; make.js runs its pass only with spec `"lane": true` (off until the composition model is agreed).
- **Visible play first** (the user, 2026-11-25: "if you dont see a spike the timing is obviously harder"): every rung keeps
  the lane clear (lane.js clutter 0) and hazards in their own value; composition puts its weight at the lane's EDGES and
  thins behind hazards. A taste "readability" part (lane clutter + hazard contrast) is the next step in tools/taste.js.
- **The background never reads as solid** (Two Moons mark: "solid background is confusing"): no lit-rim squares behind
  the play, back shapes darker/softer than the path's bodies; gallery picks favour silhouettes and haze over block-like backs.
- Composition rung 7 (first cut): focal spots at portals and mid-screen, back layers thinned to a quarter between them,
  one set piece + a light gather per spot. Bricks on the play dominate the counts, so decocomp moves little; judge by picture.
