# GDWorkbench (was GDLevelMaker) -- instructions for the AI

**New computer, or not the owner's PC? Read SETUP.md first** (`node tools/setup.js`: finds GD, loads the main
levels with their routes, checks the viewer). Most of this file describes the owner's own setup and workflow.

Claude writes Geometry Dash levels from a description, checks they can be beaten, shows them
replaying with their clicks, and hands back a file the user imports into their real game.
The user plays it and tells us what was off. Read this fully first.

**What the project is for:** USE_CASES.md lists every use case the user wants (prompt -> level, fix a
level, issue report, difficulty, design in chat, combine/cut, track + level...) with its status and
what is missing. Update its row when your work moves one.

## Every session builds the project, not just its own task

The user's standing rule: **no work is done only for its local goal.** Each session's job is its
task AND leaving the project's knowledge, tools and structure better for every later session --
which starts knowing nothing but what is written in this repo. Concretely, as part of the task,
not after it:

- **Findings go where the next session looks.** A measured number, a game rule, a gotcha, a
  method that worked: into the right doc (`CLAUDE.md` for how to work here; `DIFFICULTY.md`,
  `SYNC.md`, `STYLE.md` for those areas; `knowledge/` for GD knowledge and the user's critiques;
  Calibration below for physics facts). Not only in a chat reply or a commit message.
- **Scripts become tools.** Anything you ran twice, or that found a bug, goes into `tools/` (or
  `tests/` if it checks something) with a usage line at the top -- never left in a scratchpad.
- **Docs stay true.** When you find a note wrong or stale, fix it in the same change. A stale
  note is worse than none.
- **Structure is part of the work.** If something has no obvious home, make one and link it from
  here (the "Files" list) so it can be found. Keep this file the map of the project.
- **A new topic gets set up by the AI, unasked.** When work opens a topic that is more than a
  small local fix (a new game mode, a new kind of measurement, a new data source, a new workflow
  with the user), setting up its knowledge is the AI's job, not the user's: its own doc (or
  section) with what is known, the sources, how to test it and what is open; a line here pointing
  to it; and, if a session owns it, who that is. Don't wait to be asked.
- **Use what others learned, every round.** (The user, 2026-11-23: "if we gain knowledge on the fly,
  I do want sessions to use it.") A long session reads the docs once and then misses what the
  others learn. So before each new level or round: `git pull`, then re-read
  `knowledge/checklist.md`, `TASTE.md`, `STRUCTURES.md` and your own area's doc (what changed since
  your last round). A new lesson goes in as one line of the checklist in the same commit, and as a
  `make.js`/`score.js` check where possible -- code beats docs. `tools/wip.js` stamps each note
  with the checklist commit it was built against.
- **Every note he gives also asks: why didn't the AI catch it?** (Evgeni, 2026-11-28: "anything i mention needs to also be
  thought in whether the judge/solver/whoever could have caught the same (bad view, wrong gameplay, skipped stuff, skipped
  gameplay ...)"; and "i want to be able and catch those stuff somehow by the AI, not just by me".) For each note, name
  the check that should have flagged it (judge.js, score.js gates, the solver's secret-way hunt, `tools/gencheck.js` for the
  section generators, outside.js, the picture checks) and add it or fix its threshold in the same change, then run it on
  what exists. Reply with which check now catches it and what else it found. A note no tool can catch yet goes in
  `knowledge/checklist.md` as "not caught by a tool yet: <what>", so the gap is visible.
- **Every note from the user is a soft rule, not a spot fix.** (The user, 2026-11-23: "i obviously
  want each fix to be somewhat a soft rule. and reapplied across the level and anything in the
  future.") When the user marks one jump, orb or patch, name the family it belongs to (e.g. "a
  spike with a step right after it", "an orb off its structure's centre"), write it as one line in
  `knowledge/checklist.md`, turn it into a scored check (a warning with a threshold, or a ranking
  penalty -- soft: a level may break it with a stated reason, not silently), sweep every existing
  level and the structure library for other instances, and make `compose`/`make.js` avoid it in new
  levels. Reply with the rule and how many other spots it found, not only "fixed".
- **When stuck, study bigger, and own the level.** (The user, 2026-11-23: "if we are stuck we
  need to make bigger studies and experiments. and own our level.") When the same kind of note keeps
  coming back, or our levels stay below the official ones on a measured axis (QUALITY.md), stop
  patching: run a study (take real levels apart, measure, write the rules down -- CRAFT.md is one) or
  an experiment (several variants, measured and shown side by side), then change the generator.
  Owning a level means caring for all of it -- play, look, sync, fairness -- not only your one area.
- **Git is the source of truth: everything goes in the repo, and it gets pushed.** (The user,
  2026-11-23.) Commit and push to `main` as each piece of work lands (merge `origin/main`, run the
  quick checks, push) -- never sit on local-only commits or uncommitted work between turns. Tools,
  docs, specs, our levels, tests, measured numbers: in git. The only things that stay out are what
  must not be published: other people's levels and RobTop's data/art, songs, the user's recordings
  and save, and private details (`local/`). If something can't be pushed (a blocked permission, a
  failing check), say so in your report instead of leaving it local.
- **Every level you name comes with its link.** The user (2026-11-24): "Can you just paste link and it will open on the
  level we are talking about." A report, message or note that names a level gives `node tools/link.js <level> [--t <s>]
  [--run <id>] --md` (the phone page's link: opens that level, version and moment on the phone from anywhere); the PC and
  home-wifi links when the user is at the PC. LINKS.md: the two forms, what works where. **Showing a layout or a level for him to look at: the link opens the view he can mark in, a bit zoomed out** (Evgeni,
  2026-11-25: "i want to mark points, whenever you show me. open in that view i can mark, and its bit zoomed out"):
  `node tools/link.js <level> --zoom 0.5 --beats --md` (the viewer's `&z=` and `&beats=1`); a picture (levelmap) only beside it. But when he is already working in the viewer, do not send links (2026-11-25: "stop giving me the link im working
  here"): name the level and the entry to pick in its list.
- **Viewer first, always.** The user (2026-11-24): "i want to see in the viewer first always". Every new
  level or version goes to the viewer (in-progress list, and the phone page) first. Never install into GD,
  queue an install or upload until the user has seen it there and says "install" (or "upload") for it. When
  you report a build, name what to look at in the viewer.
- **Every build shows its steps.** The user (2026-11-24): "i want even partial steps like song/layout/path/deco
  to be available in the process, not just the end result". Every build puts its stages (song, layout, path,
  deco, final) to local/wip/<session>/<base>.stages/ via tools/stages.js; compose and make.js do it themselves.
  A new builder calls stages.put too. The viewer's in-progress list shows each build at its latest stage.
- **Estimates come from measurements, not guesses.** The user (2026-11-24): estimates have been wrong for a long time,
  mostly far too long ("ready in 45 minutes" -> ready after 5; "10 minutes" -> it was copying 2 files). Say a time only when
  it comes from a measurement: local/timings.jsonl (the heavy lock records every run by tool, level and flags), or a
  similar run you timed. Give the basis in a few words ("last 3 runs: 4-6 min"). With no measurement, say "not measured",
  or "seconds" for edits and file work. Never pad. When a job finishes, compare it with what you said, and fix the
  table or the estimate code when it was off by 2x or more.
- **A layout is playable the moment it exists.** The user (2026-11-24): "i would assume i could start playing [...]
  from the layout [...] thats the point". A layout is built from its planned presses, so it ships with them: the
  viewer replays the plan at once (no solve) and the user can play it themselves. Solving comes after, as a check
  for secret ways and fairness; it never gates seeing or playing a level. A layout whose plan dies is a bug in the
  plan, shown at the death spot.
- **One way to build a level: BUILDING.md.** Sections with seam contracts (like a collab), presses before
  blocks (beat-first for synced levels), a playable layout at once, stages shown as they happen, alternatives
  shown, reuse, measured times, and a retro in BUILDS.md. Read it before any build; change it when a build
  teaches something.
- **Every level ends with the Claude signature, quiet: the last 5 s, out of the gameplay.** Evgeni (2026-11-26): "from now-on
  everywhere, we add the latest end screen claude sign on every level we make"; (2026-11-27): "cut our signature for now from actual gameplay and make it appear in like the last 5 seconds of the level not bothering the game play with whatever effects". Default in make.js
  and autobeat: `signature.js overlay` -- no stage, no run-on, no beat effects; it fades in at T - 5 s in the view's top right,
  behind the player, and rides with the camera to the end. The auto outro (`"outro": <seed>`) and the stage sign
  (`"signature": {"style": "stage"}`, autobeat `--ending beat|outro`) are options now (BUILDING.md section 5).
- **Process rules go in the repo, never only in a message.** The user (2026-11-24): "never just for one session
  if its a big repeatable process". A rule, a process step or a lesson that one session was told applies to
  every session and every future build: write it in CLAUDE.md, BUILDING.md or the topic's doc in the same round.
- **Experiments are silent.** The user (2026-11-24): "when some claude is experimenting, can it mute?" A session
  that opens the viewer or plays anything to test it (browser pane, headless, shots, play mode) runs it muted:
  the viewer's `mute=1` URL flag (music, click sound, every sound), and tests use it by default. Test actions are
  marked test (id "test-..." or test: true) so they stay out of the user's feed. Only the user's own viewer
  plays sound.
- **Never slow the user's game.** 2026-11-24: the first input logger did work inside its keyboard/mouse hook,
  delayed and dropped the user's clicks, and likely cost them a death in Clutterfunk at 92.6%. Anything that runs
  while the user plays (loggers, recorders, jobs) stays off the input path: a hook callback only queues (no I/O,
  no lookups), recorders only read, heavy jobs run at idle priority with GD open. A new tool of this kind is
  checked for added input delay before it runs during play.
- **Hand off.** Before a long pause or when your area changes hands, write where you stopped,
  what is open and the good numbers into your area's doc.
- **Share, don't duplicate.** Results go into the shared `local/` (see below) so no session redoes
  another's work; tell the session that owns an area when you learn something about it.

**Section types: `knowledge/section_types.md`** (the theme board's layouts as types: motif, what to vary, any length by the beats, gravity portals; Evgeni 2026-11-27), built from their concept at any length and tier by **`tools/sectiongen.js`** (`GEN[key]({cols, seed, tier, bpm | beats})` -> a board map with its planned presses; `check` solves them; **`tools/secretways.js [key ...] [--rows R]`**: the solver let loose on each generated section against its plan -- SKIP where its route leaves the planned path or the map, LOOSE where far fewer presses fly it; test `node tests/sectiongen.js`; a song's real hits as `beats`: **`tools/sectionbeats.js <song key> --from <s>`** from knowledge/song_notes). **Structures in one page: `knowledge/structures_guide.md`** (Evgeni, 2026-11-27: "all of our knowledge of structures and how
to combine [...] known externally, not just for this session"): what a structure is, how they combine, how they connect
(holders, fillets, ledges), how one looks, and how a drawing becomes one. Read it before building or dressing structures;
add a line there whenever a note teaches something about structures.

## Before making or judging a level: read knowledge/

`knowledge/` is a general GD knowledge base (not the user's personal taste): `design.md` (what
makes a level good or unfair) and `critiques.md` (playtest feedback on GDLM levels) are required
reading before writing a spec; `levels/`, `glossary.md`, `demonlist.md` for the rest.
**Before a level goes to the user, go through `knowledge/checklist.md`**: every target in one page
(fairness, orbs, arrows, structure, variety, the 2.2 look, length), each with the tool that checks it.

## The loop

**One command for steps 2-3 and the wip:** `node tools/loop.js <spec | brief | level.gdlvl> [--look]
[--render] [--map] [--session <name> --note "..."]` -- stops if another session is changing that level,
prints an ETA, waits for the heavy-job slot (tools/heavy.js), runs make (or compose) -> score (every gate) -> pictures -> `wip.js put`, stops at the first
failure with the reason, and ends with READY / NOT READY, presses, tightest window, picture paths and the
wip version. It never installs or uploads. Each step's time goes to `local/timings.jsonl` (see "How long
things take" below). The tools below still work one by one.

1. Write a spec in `specs/NN_name.json` (grid squares, see the top of `tools/make.js`).
2. `node tools/make.js specs/NN_name.json` -> `levels/<name>.gdlvl`, solved, added to the viewer.
3. Look at it: `node tools/serve.js` (on the main checkout it fast-forwards itself to origin/main every minute when clean -- push, and the user's reload shows it; the page footer names the commit) and open http://localhost:8765/viewer/ (or open
   `viewer/index.html` straight from disk in a normal browser). It replays the solver's clicks
   with a click sound, the timing window of each click, and hitboxes on request.
   For the phone: the same viewer as the user's private Artifact (PHONE.md): pushed levels,
   every session's work in progress live, marks from the phone. Republish it when the viewer or
   the pushed levels change (`node tools/web.js --out <scratchpad>/web`, link in local/phone/url.txt).
4. `node tools/install.js levels/<name>.gdlvl` puts it at the top of My Levels (backs the save up first). With the game
   closed it writes the save; **with GD running it goes through the probe mod's install inbox** (mod v0.6.1+, on a menu
   only, keeps the online ID, GD saves it; GEODE.md "Install into a running GD", `node tools/hotinstall.js status|results`);
   mod not loaded -> it queues it (`tools/install_queue.js`, installed when GD closes). The user plays it
   and reports. The user's game is GD **2.2091** on Steam (Windows; Steam updated it 2026-10-21 -- older notes say 2.2081) with Geode 6.0.0 (2026-11-25); our probe mod `mods/gdlm-probe` is built with `tools\geode_build.cmd` and installed, and runs (GEODE.md "Building on this PC": Smart App Control blocks the Geode CLI, so `tools/geode_pack.js` packs).
   **Or Claude plays it in the real game (2026-11-25):** `node tools/probe.js play save:<GDLM name> --launch` (GD closed; the
   level must be in the save): the probe mod (GEODE.md "Playback") opens it, presses the saved route on exact ticks, logs every
   tick and quits without saving; `node tools/probe.js result` says cleared / died where, and game vs sim. GDLM 62 cleared first try. Main levels: `play official:N` / `--mains` (practice mode only, mod v0.5.1); `probe.js table` = one row per run (GEODE.md "Overnight batch 2026-11-26": all 21 die in the game, mostly from GD 2.2's jump snap the sim lacks).
   Smart App Control is OFF on the PC since 2026-11-25 16:08 UTC (the user turned it off: it had blocked unsigned mod builds by reputation), so every build loads.
   The old keyboard bot: `node tools/bot.js levels/<name>.gdlvl` presses Space at the solver's
   click times in the real game (no mod; it syncs to each attempt's start on screen and measures
   its own lag from ground jumps). A clear confirms the sim; a death is where they disagree --
   unless the window there is under ~30 ms (the bot is good to about a frame). Ask the user
   before running it: it takes over their keyboard while GD is in front.
   STATUS (2026-11-22): NOT TRUSTED YET. First real run (GDLM 42) printed CLEARED, but the user
   saw it jump off the beat and die -- its death detection missed it and its jumps came ~36 ms
   early (default offset since moved +20 ms). Next try: run tools/record.sh during it, compare
   the video's jump times with the plan, then fix detection before believing a "CLEARED".
5. What they report that the sim got wrong is a calibration fact: write it below.

Every level the tool makes is named `GDLM NN ...` so it is easy to find (and delete) in the
user's created-levels list.

## Heavy jobs: two at most, in code (tools/heavy.js)

The PC has 16 GB; a solve takes ~0.8-1.5 GB. On 2026-11-23 five heavy jobs from different sessions ran
at once and the PC hung (0.2 GB free), so the rule is now a lock every heavy tool takes ITSELF on start
(`make`, `compose`, `score`, `solutions`, `wip put`, `shoot`, `levelmap`, the `difficulty*` / `fairness*` /
`tas*` solvers, `windows`, `press_window`, `stop`, `polish`, `structures`, `check`, `sightread`, ...):
- **"Go more in parallel"** (the user, 2026-11-24): two slots while the game is closed and a second job would still leave
  1.5 GB free (free >= 1.5 GB + one job's peak memory: ~3 GB; each finished job's peak memory is logged as `mb` in
  local/timings.jsonl and the threshold follows their 90th percentile), else one; none starts under 1.5 GB free;
- **fast lane**: a waiter whose measured runs take under 2 min may take a free slot ahead of the long ones -- one lane job
  at a time, and never ahead of a long job that has waited 10 min (no starving); `node tools/heavy.js` and
  `/heavy/status` show the slots, the lane job and the fast waiters;
- **light lane** (the user, 2026-11-24, on the section lab: "Iterating on them like this feels too slow"): a job whose
  measured runs take under 2 min AND peak under 500 MB (lab builds: 0.2-0.3 GB, 4-77 s) runs as a third slot beside two
  held ones, one light job at a time, when 2 GB are free (2.5 GB while the game runs);
- while the user plays (GeometryDash.exe runs): one job whatever is free, and none starts under 2 GB free;
- every heavy job lowers itself to idle CPU priority at start, so the game and the desktop always win;
- the others wait and say so: `heavy: waiting for tools/make.js ... (<session>, pid, N min in, ~M min left)`;
- **priority**: `GDLM_HEAVY_PRIORITY=high|normal|low` (or `--priority high`); the next free slot goes to the highest
  priority waiting, first come within one. Running jobs are never stopped, so a long low job delays a high one by
  itself at most. High = what the user asked for now; low = batch re-solves and measuring runs (put them at low);
  `node tools/heavy.js` lists the waiters in order;
- **freshness**: with its slot, a job checks its worktree against origin/main (fetch at most once a minute): clean
  and behind -> fast-forward and run again on the new code; dirty or diverged -> a loud `!!! heavy: ... behind main`
  warning listing the tools/lib commits it lacks. `GDLM_HEAVY_NOSYNC=1` skips it;
- the slot is a file in the shared `local/locks/heavy/` (real path, all worktrees); a dead pid's slot is
  cleared, a child of a holder runs in its parent's slot. `node tools/heavy.js` shows who holds it.
- **Overdue holders get reported** (the user, 2026-11-25, after a presslib rollout held a slot 17 h: "lets check whats
  happening in my pc once in awhile if such thing occurs its really a bottleneck"): a holder over 3x its measured estimate,
  or over 3 h with none, shows `!! overdue` in `node tools/heavy.js` and the waiting lines. A session that sees one checks
  whether it still makes progress (its output file, CPU time) and tells the user (pid, command, how long, stuck or just
  big); it stops another session's job only on the user's own yes. A long batch job writes each result as it finishes.
- **Runaways: over 10x the estimate** (2026-11-26: a `wip put` estimated "a few s" took 26 min and nobody saw it): a running
  job shows `!!! runaway (Nx its estimate)` in `node tools/heavy.js`, `/heavy/status` and the viewer's Work panel; a finished
  one gets `runaway: true` in local/timings.jsonl and a loud line as it ends; `node tools/jobtime.js runaways [hours]` lists
  them. A session that sees one tells the user the same day and fixes the tool or its estimate's key (the first sweep found
  22 in 24 h, most of them `difficulty_solve` runs whose key has no level, so one level's time is used for another's).
- **A new heavy tool adds the line** `if (require.main === module) require("./heavy.js").claim();` after
  its header (tests/heavy.js checks the main ones). Never run heavy work outside a tool that claims it
  (`node -e` solves, scratch scripts); `GDLM_HEAVY=off` only when the user says so.
- Measuring or testing runs work on copies (`local/tmp/`), never on a level another session is changing:
  `tools/loop.js` stops when another worktree has uncommitted changes to the spec or level, or another
  session put it in work in progress in the last 3 hours.

## How long things take (this PC: 16 GB, other sessions' jobs running)

The user wants to know how long a wait will be. **Before a job over ~30 s, tell the user roughly how long
it takes** (from this table, or the ETA `tools/loop.js` prints). When a run is far off (over 2x, or under
half), correct the row here in the same change. Real numbers pile up in `local/timings.jsonl` (every
`loop.js` step; **every heavy job, by itself**: tools/heavy.js logs each finished one keyed by tool + level + flags, with the
estimate it had); `node tools/loop.js --times` prints them by level length. **Estimates in code:** `tools/jobtime.js`
(`est <command>` -> "~28 min (last run make jN, this level: 28 min)" or "not measured"; `recent` -> estimate vs actual,
"!! off 3x" where it drifted); the heavy lock's waiting lines, `/heavy/status` and the viewer's Work panel / task chip use it,
always with that basis. Runs of another level size or other flags never count (score: 11 s on a short cube level, minutes
on a long one with modes). Wait for the heavy-job slot comes on top of all of these.

| job | how long | source |
|---|---|---|
| make, short cube level (15-20 s) | 15-30 s (the solve itself ~2 s since the state-copy fix) | loop.js, GDLM 02 / 41, 2026-11-23 |
| make `--look` (decoration only, gameplay unchanged) | ~1 s on a short level; 7-8 min on GDLM 44 (43 s, 11.7k objects: it replays the saved plan to the end); if the gameplay DID change it solves again: design themes gallery 7 min (105 s level, 5 modes, 2026-11-27) | showcase notes, GDLM 50; cloud, GDLM 44, 2026-11-25 |
| make, an existing level after a one-spot edit (incremental) | 1-5 s in cube or ball; an edit inside or just before a ship stretch 25-65 s (the stretch is re-planned) | PHYSICS.md "Incremental solving", cloud 2026-11-23 |
| cut or join of solved levels (section cache) | 0.5-10 s (full: 1-70 s) | PHYSICS.md "Incremental solving" |
| make (= the solve), 40-100 s level with ship / wave / ball | ~2 min since the state-copy fix (was 5-7 min); 13 min for GDLM 44 v2 with no saved route (cloud, 2026-11-25) | GDLM 45 106 s, GDLM 61 124 s (cloud, 2026-11-23); before: PHONE.md, SHOWCASE.md |
| make, a level built from verified bricks with `seedPresses` (tools/seedsolve.js) | the solve ~6 min (GDLM 44 v6, 58 s, 5 modes: 28 local searches); the whole make 55 min -- the rest after the solve (natural plan for indicators, sightread, saving the route) | cloud, 2026-11-26 |
| score.js, every gate, short cube level | 10-20 s | loop.js, GDLM 02 / 41 |
| score.js, level with modes, saved route current (checks the route, no solve) | ~1.5 min (GDLM 45, 40 s level: 89 s) | difficulty session, 2026-11-24 |
| score.js, level with modes, no saved route (`opts.saved:false` or nothing to build on) | ~2 solves + ~1 min fairness: 10-15 min | score.js header |
| compose.js (brief, repair rounds) | one make + score per round | not timed yet |
| solve an official level (`difficulty_solve.js`) | minutes to an hour+ (checkpoints every 30 s) | not timed yet: use `--time solve-official` |
| thumbnail (`thumb.js`, 8 candidates, + gif) | ~6-10 s in the cloud (game look); PC with GD art not measured | THUMBS.md, 2026-11-25 |
| compare two levels (`compare.js`) | ~10 s for two short cube levels; 149 s for GDLM 70 vs 72 (70-86 s, many modes) | COMPARE.md, 2026-11-25 |
| render frames (`shoot.js`, 8 frames) | ~10 s; ~1 min with before/after | SHOWCASE.md, POLISH.md |
| level map (`levelmap.js`), with a saved solution | ~5 s (without one the page solves: minutes) | loop.js, GDLM 41 |
| polish report (`polish.js --dry`) | 1-3 min | POLISH.md |
| readability check | ~8 min for a 12 s level | POLISH.md |
| wip put (never solves: writes at once) | 0.2-1 s | tests/wip.js, 2026-11-27 |
| wip solve (put's background solve, only when no saved route is current) | as "make" for that level (an auto level: one zero-press run, seconds); key `wip :solve` | not measured on a real level yet |
| install into the game (`install.js`, game closed) | not timed yet (publisher: `--time install`) | |
| a server upload | not timed yet (publisher: `--time upload`) | |
| video of a whole official level (`video.js official:N --route`, 1280x720 60 fps) | ~2.2-4.7x the level's length, the more other jobs run (Jumper 90 s with its 4.5 s end screen: 202 s and 346 s, ~27 MB; first run 408 s) | timings.jsonl, 2026-11-25 |
| build a Geode mod (`tools/geode_build.cmd`, cold) | ~60-95 s | GDLM Probe, 2026-11-25 |
| git pull + push | ~10 s | 2026-11-23 |
| edit.js, one edit, the old route still clears (re-plan + checks) | see EDITING.md "Results" | 2026-11-23 |
| edit.js, an edit that needs a full solve | as "make" above for that level | |
| edit.js before/after picture (two shoot.js frames) | ~20-40 s | shoot.js row |
| markedit.js: edit + the family's sweep over every GDLM level | edit + see EDITING.md "Results" | |
| review.js, a level with a saved route (no --gates / --render) | see EDITING.md "Results" | |
| fix.js (review, fixes, review again) | see EDITING.md "Results" | |
| retarget.js, one tier | see EDITING.md "Results" | |

## Shared folder, work in progress, the user's marks

Every session works in its own git worktree, but `local/` (never committed) is ONE shared folder:
- **Once per worktree, between jobs: `node tools/link_local.js`.** It merges your `local/` into the
  main checkout's (newest file wins), keeps yours as `local.before-share/`, and links `local/` to
  the shared one. From then on solved levels, beat grids, recordings notes and marks are shared --
  don't re-solve what another session already solved (check the file; one heavy job at a time).
  Stopping a long official solve to free the PC costs nothing: `tools/difficulty_solve.js` checkpoints
  every 30 s to `local/difficulty/NN.part.json` and the next run on the same physics carries on from it.
  **Gotcha:** a script kept under `local/` that does `require("../../tools/x.js")` loads the MAIN
  checkout's code, not your worktree's (node follows the link). Debug scripts go in your scratchpad
  and require the worktree by absolute path (the difficulty session lost four debug runs to this).
- **The level you are working on: `node tools/wip.js put <level.gdlvl> --session <your name>
  --note "what changed"` after every change.** It goes to `local/wip/<session>/`, and the viewer
  (`node tools/serve.js`, http://localhost:8765/viewer/) lists it under "in progress" with its
  version; the user presses ⟳ refresh to see the newest, before anything is pushed. **Then run
  the ArtifactData call it prints**, so the phone page shows it too (PHONE.md). **`put` never waits on a solve** (2026-11-26:
  a put solved an autobeat level inline for 26 min): it writes at once with the route at hand -- `--plan`, the saved route,
  the build's planned presses (`<level>.planned.json`, `{auto: true}` for an auto level: tools/planned.js `writeAuto`), or
  none (a ghost) -- and runs the solve after as its own background heavy job (`wip.js solve`, log in
  local/logs/wip_solve/), which fills the entry in; `--wait` solves first, `--no-solve` never. A builder that knows its
  presses writes them beside the level (hitbuild, autobeat, autobricks, autoclose do). Test: `node tests/wip.js`. Once a copy is overtaken (pushed, or
  a newer copy elsewhere), take it out of the list: `node tools/wip.js archive <session>/<base>` (or `--superseded [--dry]`
  for all) MOVES its files to `local/wip_archive/<session>/`, never deletes; the viewer's "in progress" tab already hides
  wip copies older than the pushed level of the same name. An open viewer tab reloads itself when the PC's checkout moves
  on (it polls /version), and warns when serve.js can't self-update (dirty checkout, not on main).
- **Real-game stats go to every owner, at once** (the user: "anytime we have stats about a new level
  from real game, lets send it to physics/difficulty/style and so on for analyzing"). After analysing a
  recording (the physics session owns recordings), add each attempt to `local/real_stats.jsonl` with
  `node tools/real_stats.js add '<json>'` (level, version, video, attempt, death %/x, mode, cause, whether
  the sim agrees, inputs forced right after a mode change, the window there; `node tools/real_stats.js
  [level]` lists them). Then send each level's stats straight to every session it concerns, not through
  the main one: difficulty (predicted vs real deaths), style (GDLM layout), polish (the user's own
  levels), knowledge (critiques, community levels) and the main session. x from GD's % (x = level end x
  * % / 100) is approximate; a frame-measured x says so in its cause or sim note.
- **The user's marks** (✎ in the viewer, pinned to a moment and a spot) go to `local/marks.jsonl`
  with the level's file and `session`. `node tools/marks.js` lists open ones: handle the ones with
  your session, then `node tools/marks.js done <id> "what changed"`. Marks from the phone: fetch
  them first with one ArtifactData `list` (PHONE.md); marks.js then shows them with the rest.
- **Links:** the viewer's address keeps `#lv=<file>&t=<seconds>` (🔗 copies it), so a link the
  user sends opens that level at that moment.

## Files

- **WORKBOOKS.md** -- the claude.ai workbook pages: every bug found in the app, the limits, how to test.
- **Setup on any computer** (SETUP.md: the steps an AI agent follows): `tools/setup.js` (find GD, load the main levels,
  check), `tools/gdpaths.js` (where GD's game, levels and save are; every tool reads GD's files through it -- never hardcode
  the Steam path), `tools/mains_routes.js` (the main levels' routes in git, `knowledge/mains/routes.json`, written by
  `mains.js export`: `import` replays them on a new computer's own game). Test: `node tests/setup.js`.
- `lib/gd.js` -- the format: base64url + gzip layers, the record (plist) and the level string.
- `lib/objects.js` -- object ids: name, kind, hitbox. `sure:false` = from memory, unconfirmed.
- `lib/physics.js` -- physics of every mode, triggers + solver (fewest clicks, each in the middle of its window;
  every window is replay-checked tick by tick: `solve` merges near-twin states, which once claimed ticks that die).
  PHYSICS.md: per mode and trigger, its constants, sources, checks and what is open.
- **Rotated gameplay (2900) and GD's trigger channels** are in lib/physics.js (2026-11-25): a state steps in its frame's coordinates against the level turned into that frame (`frameWorld`); `GD.worldXY(s)` gives the world position and `GD.progressX(s)` how far a run has come (use it, not s.x, for progress in tools); trap portals (`TRAPS`). PHYSICS.md "Rotated gameplay"; `node tests/rotated.js`; `tools/tas_trace.js` (a real-game plan tick by tick, with timing nudges). The level header's start mode / mini / dual / gravity (kA2, kA3, kA8, kA11): PHYSICS.md "Start settings", `node tests/start_settings.js`. Gameplay modifiers (2866 flip on head hit, 1813 no auto jump, the D 1755 / H 1859 letter blocks: wave and head-hit safe, unchecked) and the time warp (1935): PHYSICS.md "Gameplay modifiers", `node tests/modifiers.js`; `tools/dyn_near.js` (moving objects and their triggers near an x).
- `lib/dual.js` -- dual mode (two players, one button; GD 2.2's rules read from the 2.2081 decompile), stepped from
  physics.js's step() only in levels with dual portals. Moving objects (move, move to target, follow, rotate, toggle,
  spawn, multi-trigger, stop/pause/resume) live in physics.js's trigger code. `tools/movers.js`: which levels' triggers
  move hitboxes. Lab: GDLM 63 (`tools/lab63.js`). PHYSICS.md "Dual" and "Moving objects".
- `lib/runcache.js` -- GD.run without replaying what an earlier run on the same world already played (exact: starts at the
  first differing input, joins the cached run once the state is identical); tools/io.js installs it, so every tool that
  loads GD through io.js gets it (the planner's thousands of runs: 17x faster in `tests/runcache.js`). `GDLM_RUNCACHE=0` = off.
- `lib/difficulty.js` -- difficulty score from a solution: the human route (one tap per jump), per-input
  timing windows, a timing-error + lapse model fitted on the user's real runs; see DIFFICULTY.md
  (also the tier ladder for making levels, and what is open). Its tools: `difficulty` (score a level,
  or all official levels vs ratings and the user's attempts), `difficulty_solve` (cache an official
  solution, one at a time; `--resume` after a physics change solves only from a bit before where it matters), `difficulty_fit` (refit on the user's runs), `difficulty_community`
  (score downloaded community levels), `runs` (the user's deaths from a recording, via the progress
  bar), `save_stats` (the user's lifetime attempts per official level, read-only from the save; also the catalogue of every level in his save -- main + every online level played, tier, done, attempts, best % -- with demon count, local/difficulty/user_stats_online.json, `--demons` / `--done` / `--diff Insane`; `node tests/save_stats.js`),
  `difficulty_parts` (how much windows and CPS alone explain the stars), `skips` (does a saved route skip a portal: then no number from it), `quality` (the scorecard: official 1-10 vs every GDLM level, QUALITY.md), `stop` (where a level's saved solution dies in the sim and what killed it), `difficulty_route` (a level with and without route choice: a player avoids a hard timing when the
  level has an easier way), **`fairness`** (deaths that are not the player's fault: forced input after
  a portal, misleading marks, sloped portal exits, orb chains with nothing to correct; fitted on the
  user's labelled deaths, `fairness fit`; tools/score.js gates on it; DIFFICULTY.md "Fairness").
- **Music control** (MUSIC.md: the song's start point `kA13` and GD 2.2 Song / Edit Song triggers -- switch, seek, fade, stop
  mid-level; their keys read from rated levels): `lib/music.js` (the spans over time), spec / brief key `"music"` in make.js,
  beats through a switch (`GD.SYNC.beatToTimeSegs`), heard in the viewer / phone (`lib/song.js` musicPlayer) and video.js.
  Test: `node tests/music.js`.
- `viewer/song_grids.js` -- every measured song's beat grid as committed numbers (no audio), so beats show on the phone and public site without the mp3 or local/; `node tools/song_grids.js` (tools/beats.js runs it).
- `lib/sync.js` -- music sync: level time <-> x through speed portals, beat grid <-> level beats,
  press timing windows from a solution, sync scores. See SYNC.md (also where songs come from).
- **`tools/channels.js` -- deco the GAME draws white**: a colour channel (key 21/22 or the object's default, 1 for 211/693) that neither the header nor an earlier colour trigger defines. score.js gate "channels" (FAIL); ART.md "Colour".
- **`tools/roles.js` -- colour by role** (the user: "clear contrasts between the different things (ground, spikes, deco)"): block bodies vs the sky, deco in the path's or a hazard's value and hue family, hazards vs sky and path, every 10 blocks; `--shots N` pictures the worst spots. score.js gate "roles" (FAIL); palettes from `tools/decokit.js` rolePalette(hue); ART.md "Colour by role".
- **Theme kits** (ART.md "Theme kits": icy, hellish, forest, space, ... as more than colours -- spikes, ground, deco, set pieces, palettes per variant, a song brief, the mode mix): `tools/themes/<name>.js` (space, ice, fire, sunny), `node tools/theme.js list | check <name> | song <name> | demo <name> <level> [--shots]`; applied by the scene `tools/scenes/theme.js` (spec "theme": "space" or {name, variant(s) | sections}).
- **Free songs** (`knowledge/free_songs.md` + `.json`: the Newgrounds songs with a Creative Commons license, 36 of the 86 we use, credit lines; the only songs that may go in git and on the public site, `songs/free/`). Pick a public level's song from it.
- **The public viewer** (https://evgiz0r.github.io/GDWorkbench/, PAGES.md: GitHub Pages, rebuilt on every push; a level goes on it ONLY when the user says so for that level: `knowledge/public_levels.json`, empty for now, our levels only, songs / GD art / official levels only from the user's own serve.js): `tools/pages.js`, `tests/pages_build.js`, `.github/workflows/pages.yml`. Candidates ranked (free song, score.js, what is missing): `knowledge/public_shortlist.md`.
- **The viewer is where the user steers the work** (VIEWER.md): the Work panel, ✓ ok / redo on build stages with gates (`tools/stages.js waitApproval`), decision cards (`tools/ask.js put/wait`), and the actions feed every user action goes to (`tools/actions.js tail --since <id>`). Ask the user there, not only in chat. **🎮 you play** (key P): the user plays any level or build stage in the viewer, the same sim live (`lib/liveplay.js`), practice checkpoints per section; each attempt is a `play` line in the feed (where they die). A stage with a plan but no route replays the plan at once and shows where it breaks.
- **Build stages in the viewer** (`tools/stages.js`: a builder puts song / layout / path / deco / final as each is done -> `local/wip/<session>/<base>.stages/`; the viewer shows a stage bar on the level and the stage on the picker's in-progress cards, even before the first wip put). `require("./stages.js").put({session, base, name, stage, levelStr?, data?, note?})`; test: `node tests/stages.js`.
- **Click sounds** (`lib/clicks.js`: self-made mouse / keyboard press and release samples; the viewer's click sound choice, `video.js --clicks`; VIEWER.md "Click sound").
- **Level compare** (COMPARE.md): `tools/compare.js <A> <B> [--thumbs] [--html out.html]` -- two or more levels side by side: size,
  modes, difficulty with its parts, curve and costliest presses, taste with repetition, brick mix and verified-brick cover, the
  one ahead per row; page `viewer/compare.html` -> local/compare/. Test: `node tests/compare.js`.
- **Thumbnails** (THUMBS.md): `tools/thumb.js <level> [--gif]` -- the level's best-looking moment (level data every 0.5 s ->
  8 candidates rendered headless -> picture score) -> local/thumbs/<level>/ (local only with GD's art). Test: `node tests/thumb.js`.
  `tools/headless.js` also runs in a Linux cloud container (Playwright's Chromium, --no-sandbox as root).
- **Videos and links**: `tools/video.js <level> [--run <id> | --route] [--from s --to s] [--vs-rec] [--clicks mouse|keyboard]` -- an mp4 of the level
  playing in the game look with its song (local only: GD's art and the song are in it; VISUALS.md "Video"); `tools/link.js`
  -- links that open a level at a version / moment / run on the PC, the phone page and the home wifi (LINKS.md).
- **Offline snapshot** (PHONE.md "Offline snapshot"): `node tools/snapshot.js [--no-songs]` -> one HTML file with the PC
  viewer, every level, the user's runs, GD's art and the songs, which opens from disk with no network (local only, sent to
  the user by file card); `node tests/snapshot_offline.js` checks it from disk with no network at phone size.
- **The phone page** (PHONE.md: what is on it, what a session does after `wip.js put`, phone
  marks, how it was tested, what is open): `tools/web.js` builds it from the viewer. Its "deco" page: `tools/deco_page.js` (the deco options' frames, GD art: this private page only).
- **The missing-physics lab** (PHYSICS.md "The mismatch queue"): `tools/lab77.js` -> GDLM 77, 19 stations, one open physics question each, built for the probe mod (`--route` = its probe route with no presses in the hands-off stations, `levels/gdlm_77_missing_physics_lab.probe.json`; `--check` = the sim's numbers per station). Play it when we get to those rows.
- `tools/probe_frames.js` -- a probe log frame by frame against the sim (`steps`), and every cube jump fresh / held vs the game (`jumps`); PHYSICS.md "Landing jump and slopes from the probe logs".
- `tools/` -- node CLIs: `make`, `check`, `roundtrip`, `index_levels`, `serve`, `beats` (beat grid
  of every song on this PC, ffmpeg + JS), `sync` (how well levels follow their song's beat), `frames` (timing windows with 60 fps presses, as the user's game has them), `press_window` (which press ticks get the player through one spot, from a given position: the human window there), `windows` (every input's timing window in any mode, by moving it and replaying; the work is `lib/windows.js`, a player's window with later inputs re-planned, the one definition the viewer's button strip, score.js and difficulty share; `--strict` the old fixed-inputs rule), `real_stats` (the user's real-game attempts on our levels, local/real_stats.jsonl), `web` (the viewer as a phone page, PHONE.md), `songs` (custom songs by id into local/songs/, as GD gets them; SYNC.md section 6), `songmap` (songs' beat clarity, sections, drops, and how levels follow them; SYNC.md section 7), `hits` (a song's real hits per half-beat -- kick, snare, accent -- and `--level`: the share of a level's presses on one; SYNC.md section 8), `impacts` (a song's impact points -- drum entries, loudness jumps, big accents, section changes, breaks -- with a strength, heaviness per bar, section / speed-up suggestions in level beats; `--level`: what the level does at each impact and its dead stretches; every note onset, small ones too, the music's speed per bar and speed portals that follow it; `--commit` -> `knowledge/song_notes/<key>.json`, numbers only, for cloud sessions; SYNC.md section 9), `hitlevel` + `hitbuild` (an ultra-synced level built beat-first: the taps fixed on the song's hits, obstacles placed around them by sim replays, the ship's corridor around a hit-timed path; done when the planned inputs alone clear it -- GDLM 62, SYNC.md section 8), `hitroute` (replay a hit plan's taps, windows per tap), `fetch_level` (online levels by ID into local/community/, for measuring only, never committed), `demonlist` (Bloodbath, Pointercrate's top 150 and every former Top 1 -- `knowledge/levels/demonlist_top1.json` -- into local/community/, manifest `local/community/demonlist.json`; look only, no solve), `community` (study rated community levels: list, fetch, measure, modes, comments; see knowledge/README.md), `save_icons` (the user's icons and colours from their GD save, read-only, for the viewer), `community_index` (the community levels on this PC for the viewer's community and demon-list tabs, GET /community/list), `tiercheck` (does each section look like rated Easy/Normal or Hard/Harder sections of its mode; `--tier Easy`), `variety` (kinds of thing, portals, modes, speeds, repeated chunks vs rated levels; knowledge/levels/variety.md), `obstacles` (block structure per mode, obstacle shapes, when new kinds come in; knowledge/levels/obstacles.md), `modern_look` (how 2.2 rated levels are decorated: objects per block, layers, colour, triggers per section; knowledge/levels/modern_look.md), `difficulty` (score vs the official ratings), `rot_video.py` (the player's drawn rotation per frame in a recording, VISUALS.md "Render vs game"), `compare_frames` (our level and a reference side by side at matching spots, 1600x450, labelled with objects per block; `--layers`, `--deco-only`; for judging deco by picture, local/compare/), `portals` (every portal kind with its count and the modes in order, no solve), `tempo` (presses against the song's beat: inputs per beat of the human route, per phrase and in the busy parts, vs the official levels, and clicks per second vs the median Easy brick; score.js gate "tempo"; POLISH.md "Soft rules"), `brickstats` (every lego brick's clicks per second and tightest window by its level's tier; `--write` -> knowledge/brick_tiers.json), `perf` (the viewer's playback speed with real frames, headless: fps, frame and draw times per setup; VISUALS.md "Viewer speed"), `framecheck` (one recorded attempt frame by frame against the sim: the clock K from take-offs, the level start from white ruler bars, path and end gaps; PHYSICS.md "Frames"), `landbuf` (every landing in a recording with the press before it and whether the game jumped, no sim).
- **Structures: a ranked library of 1-3 s layouts** (STRUCTURES.md: format, how each is checked, the
  ranking rules, results, what is open; owner: the style session): `tools/structures.js` (`list`,
  `check`, `build <id>`, `rank`, `page`), results in `knowledge/structures.json`, a picture page for the
  phone (link in local/phone/structures_url.txt). Every cube-in/cube-out one is the pattern `"s:<id>"`,
  and compose.js puts one in every plain cube section by default (`"structures": false` = off).
- **Visual effects synced to the music** (EFFECTS.md: Evgeni "i want to gain the controls"; alpha / toggle / move / lock to
  player or camera / rotate / scale / colour, pulse labelled untested; trigger keys checked on rated 2.2 levels): `tools/effects.js`
  (each effect a function `(ctx, {t0, t1, ...})`; `node tools/effects.js` lists them), the fx level `tools/fxlevel.js` (an auto level with its gameplay invisible and one effect theme per song section, AUTO.md), the labelled gallery `tools/fxgallery.js`
  -> `levels/lab/fx_gallery.gdlvl` (auto, Electrodynamix; most of it shows only in GD). Test: `node tests/effects.js`.
- **Our own bricks, generated presses-first** (BRICKGEN.md; Evgeni 2026-11-26: RobTop's structures are decent, our hand-made library pieces are not, so the official bricks are the JUDGE): `tools/brickgen.js gen | list | show | build | lab` -- a rhythm of 2-6 presses -> the sim's path in the open band -> walls / platforms / ledges built around it, spikes kept only while the plan clears -> verified (plan clears, no press dies, player windows, no secret way: skip / stray tap / the solver's fewest presses) -> judged by tools/lego.js measure() against the official family numbers (knowledge/lego.json) and the tier stats -> knowledge/brickgen.json, registered as structures `g-<mode>-<tier>-<n>` (brickpick / compose / `structures.js check` see them). First batch RETIRED (Evgeni: "all to the garbage": one idea per mode, flat, no mechanics). **`tools/movestudy.js`**: patterns of movement per brick path (11 axes: legs per second, leg sizes and irregularity, dwell, rests, flips, mechanics ...) and a set's variety vs the official set (knowledge/move_study.json); the next generator must reach the official variety. **Round 2: `tools/brickgen2.js gen | list | show | nearest | lab`** -- a brick is a chain of moves placed by the sim (flip, drop, pad, blue pad, orb, blue orb; ball first), verified as above, gated on movement (inside the official p10-p90 on all but 2 axes) and picked as a set for distance -> knowledge/brickgen2.json, lab levels/gdlm_lab_brickgen2_<mode>.gdlvl; test `node tests/brickgen2.js`. **Round 3: `tools/clickfirst.js gen | pattern | lab`** -- clicks first (Evgeni 2026-11-27): a plan of clicks with kind + wanted window -> the sim's patch -> spikes where missed / early / late / stray presses land -> the section's gameplay extracted as a recipe (F flip, O / B orb, d drop, p pad, a / g auto flips) with a variance score inside and between sections, also on official sections; knowledge/clickfirst.json, lab levels/gdlm_lab_clickfirst_ball.gdlvl; test `node tests/clickfirst.js`.
- **Auto bricks: stretches with no click** (AUTO.md: the main levels' auto parts measured -- ~10% of a level, pad launches,
  blue-pad ping-pong, portal rides --, 50 own bricks built by sim placement with an entry / exit contract, the lab level):
  `tools/autostudy.js` (-> knowledge/auto_study.json, numbers only), `tools/autobricks.js list | build | show` (->
  knowledge/autobricks.json, local/structures/lego-auto-*.gdlvl for `lego.js mine library`, levels/lab/auto_lab.gdlvl).
  Test: `node tests/autobricks.js`. **Beat-first auto levels** (AUTO.md "Beat-first", round 8: rapid runs, own speed bursts, no secret way via stray presses + saws, outro + signature): `tools/autobeat.js --song <Official> --seed N`
  (a trigger on each chosen beat where the player is, gaps filled, motifs AAAA / BBBB / a mix; `--rate R` = R triggers a second, more in loud bars; lab levels/lab/auto_beat*.gdlvl); **`tools/autodeco.js`** (a short autobeat level with its structures dressed by section and held by chains / ropes, AUTO.md "GDLM 75 held together"); **`tools/autocheck.js <level>`** (a finished auto level re-checked on today's physics: clears with no press, stray-press leaks; AUTO.md); **`tools/autoclose.js <level> [--viewer] [--route r.json]`** (an auto clone of a solved level: every press of its saved route -> a hidden pad / gravity portal; `--viewer` -> levels/gdlm_auto_*.gdlvl, the lab levels that press for him; AUTO.md "Auto clone"; `node tests/autoclose.js`);
  test `node tests/autobeat.js`. **Sections by character** (`tools/sections.js <song>`: drop / break / build / entry / groove from the measured song; autobeat's batches follow it) and **the short beat ending** (`tools/beatend.js`: pad bounces hit and landed on the beats, then the sign; AUTO.md).
- **Lego: structure research** (LEGO.md: every level cut into 1-3 s pieces -- official, ours, the user's sketches --,
  classified by family (fly: ship/wave/swing paths and corridors; jump; flip) with parameters, the official mix vs ours,
  the variety rule; one path built as ship / wave / swing with wrappers and click- or portal-turns): `tools/lego.js`
  (`mine`, `families`, `variety <level>`, `page [--public]`, `votes`: Evgeni's 👍/👎/comments from the PC /lego/ page and the phone page, a weight not a ban), `tools/lego_match.js` (the reverse lego: which bricks a level is built from, their clicks as press hints; `hintsFor` -> presslib `solveWithLib({hints})`), `tools/lego_solve.js` (does it speed the solver: plain vs hints vs full, LEGO.md "Lego hints in the solver"), `tools/lego_join.js` (joins checked in physics), every route `difficulty_solve.js` saves is cut into bricks by itself (`lego.mineLevel`, ~0.4 s a level; community levels too, local only), `tools/lego_pick.js` (a section list + song -> bricks on the beats, joins checked, whole chain solved; Evgeni's noted bricks left out; LEGO.md "The picker"), `tools/brickpick.js` (our own verified structures on the song's hits; `pickSection` = a beam search over the whole section -- presses on hits, pieces close in CPS, 2-4 block joins, no brick twice, filled to its end; GDLM 44 v6's picker), **`tools/seedsolve.js`** (solve a level from its pieces' known presses, searching only where they die; spec key `seedPresses`, make.js/check.js use it before a full solve), `tools/onbeat.js` (which presses' windows hold a hit; `--write` = the level's planned.json, so the human route presses on the hits), `tools/lego_seams.js` (how levels combine pieces: portals, rhythm, breathers, variety, height; official vs ours, LEGO.md "Combining"), the `fly-path` pattern, `lego-*` structures.
- **How a difficulty score is built** (DIFFICULTY.md "Balance"): `tools/balance.js <level | official:N> ... --html out.html` -- every press's cost (slips + timing + after-portal), the costliest presses, cost per mode stretch, the main levels' ladder; page template `viewer/balance.html`. `tools/difficulty_fit_v2.js`: fits the v2 weights (timing spread, flight room, gravity, duals) on the mains vs the user's ranking, stars and attempts (`knowledge/balance_mains_v2.json`, `knowledge/difficulty_rank_user.json`).
- **Quality vs the official levels** (QUALITY.md: one scorecard, official 1-10 next to every GDLM level --
  gameplay, flow, look, fairness, soft rules -- with a verdict per metric and the biggest gaps; owner: the
  difficulty session): `node tools/quality.js` (a new level gets a row by itself; `--cached` prints only).
- **Level style and the idea -> level loop** (STYLE.md: findings, style vocabulary, the loop, every
  playtest lesson, what is open): `tools/style.js` (measure style: deco share, triggers, sections,
  rests, motifs, recurring chunks) + `tools/corpus.js` (official levels and the user's save, in
  memory), `tools/patterns.js` (named gameplay chunks incl. ship tunnel / wave zigzag with their
  portals), `tools/decorate.js` (block skins, ground deco, colour / alpha / zoom triggers, jump
  indicators), `tools/compose.js` (brief with sections -> spec -> build -> score -> repair rounds; sections in beats that follow the song, each with its mode -- cube, ship, wave, ball, upside-down -- and its look, STYLE.md 2b; `--dry`, `--section n`;
  briefs in `briefs/`, a log per level), `tools/score.js` (every gate a level must pass before the
  user sees it), `tools/sightread.js` (prejumps), `tools/inputs.js` (a solution's inputs with
  modes), `lib/natural.js` (a natural replay plan: taps, no empty jumps). Test:
  `node tests/style_gates.js`.
- **Craft: how RobTop builds and dresses a level** (CRAFT.md: Jumper and xStep studied object by object;
  many small pieces over a hazard floor, deco attached to structures, black-and-white playfield on one
  hue; the numbers vs ours; owners since 2026-11-24: the gd-art and gd-style sessions, handoff in CRAFT.md): `tools/craft.js` (`roles`, `map` -- a text picture
  with the deco --, `check` -- the craft targets).
- **Scene levels, decorated by hand** (SHOWCASE.md: GDLM 50 eclipse, what made it look good, numbers,
  what is unchecked in the game): `tools/scenekit.js` (recipes: own colour channels, palettes per section,
  skylines, the eclipse set piece, stars, designed blocks, motes, light rays, a top frame, lock-to-player
  parallax, beat pulses, text), a level's scene script `tools/scenes/<name>.js` (spec key `"scene"`).
  `node tools/make.js <spec> --look` rebuilds a decoration-only change in a second (keeps the solve when
  the gameplay is the same; the jump arrows are placed again from the saved route). Owner: the showcase session.
- **Taste, learned one level at a time** (TASTE.md: the taste loop's rounds -- one new approach per level,
  compared with rated levels in GD art -- and every rule of taste with the note it came from; read it
  before making or judging a level). Round 1: GDLM 51 adrift (`tools/scenes/adrift.js`: depth as the
  story, looping motion -- scenekit `bob`, `sway`, jellyfish, fish, kelp, water surface, rocks).
  **The user's notes as soft rules, swept over every level**: `node tools/softrules.js [level ...]`
  (jump arrows a block in front of hazards, corridor mouths flush, flash rate; score.js gate `arrows`).
  Owner: the showcase session.
- **The section planner: a song -> a journey of little places** (SCENES.md: the rules, theme packs,
  what a rated illustrated level does): `node tools/scenes.js <song> [--theme ...] [--brief ...]` -- per
  section its role (intro/groove/build/drop/ride/breather/outro), place, palette, mode, transition,
  camera, props; `--brief` writes a compose brief. Owner: the showcase session; props from the gd-art
  session's `tools/props.js`.
- **Editing, reviewing and fixing levels -- the everyday loop as tools** (EDITING.md: words and ops, spots, what
  each prints, the families, auto fixes, what is open): `tools/edit.js <level> --at <b45 | t=12.3 | x= | #lv= link>
  "<change>"` (one change on a COPY, re-solved, checks before/after, before/after picture), `tools/markedit.js`
  (a viewer mark or a screenshot note -> its soft-rule family -> the edit -> the family swept over every level),
  `tools/review.js <level>` (every check -> one ranked issue list + a phone page), `tools/fix.js <level>` (review ->
  the safe fixes on a copy -> review again), `tools/retarget.js <level> --to easier|harder|<tier>|<stars>` (the
  hardest spots first, small edits scored by the difficulty model), `tools/families.js` (every soft-rule family: note words, effect,
  effort, fix, auto-fix). Test: `node tests/editing.js`.
- **The measurements store: every number we measure about a level, with the version it was measured on**
  (the user, 2026-11-24: "for every level we go through, save some data somewhere about measurements. With the
  version as it may change"): `knowledge/measurements.jsonl` (committed, merge=union; numbers only, never level
  data), `tools/measures.js` (`node tools/measures.js [level]`: newest value per measure with STALE marks;
  `stale`: why and the command to redo it; `history <level>`). Each line has the level's version (hash of its
  level string) and a commit per code group it depends on (physics, route, difficulty, taste); STALE = a file of
  that group changed since, or the level did. `difficulty_solve.js`, `difficulty.js` and `taste.js score` record
  by themselves; a new measuring tool calls `require("./measures.js").record({...})`. Test: `node tests/measures.js`.
- **`tools/heavy.js` -- the one-heavy-job lock** every heavy tool takes on start (see "One heavy job at
  a time"); it logs every finished job's real time to local/timings.jsonl (`tools/jobtime.js`: measured estimates with
  their basis, estimate vs actual). Tests: `node tests/heavy.js`, `node tests/jobtime.js`.
- **`tools/loop.js` -- the whole make/iterate loop in one command** (owner check, ETA, make/compose, score,
  shoot, levelmap, wip; logs under `local/loop/`), `--times` prints the measured time table, `--time <step>
  <cmd>` times any other job into it. Test: `node tests/loop.js`.
- **The GD Work Board** (board/README.md: Evgeni's control page, local only -- http://localhost:8765/board/, data in local/board/, never an artifact again -- workstreams, main levels, physics vs the game, the task queue he picks; data schema): `tools/board_mains.js` (the main-levels table for it); `tools/board_local.js` (the same board as a local page, http://localhost:8770/ or serve.js /board/, data in local/board/).
- **The new work board** (board2/README.md, 2026-11-28: private artifact https://claude.ai/artifact/VLKSoUZ7dGc9mfLyzD7a15 -- main-level routes, section types and their generation stats, joins, our levels with judge parts, work in progress in db `work`, his 📍 marks in db `marks`): `board2/page.html`, `tools/board2_data.js`. Sessions write what they start / finish to `work`.
- **The Claude workboard** (workboard/README.md: a private claude.ai artifact, link in local/workboard/url.txt -- features, structure stats, the GD video catalog, collapsed topics, a saved comment on every row; separate from the local GD Work Board): `workboard/board.html`, `tools/workboard_data.js` (-> local/workboard/data.json, then republish). Read the user's comments with ArtifactData `list` on collection `comments`.
- **`tools/mains.js` -- RobTop's 22 main levels kept solved** (`status`: which route fails and the cheapest fix; `run`: replans then resumes at heavy priority `urgent`; serve.js starts it after a pull that changes physics or route code; DIFFICULTY.md "Main levels kept current").
- **`tools/flystyle.js` -- how a route flies its ship / wave stretches** (presses a second, legs, near-wall ticks, wave inputs vs the corridor's turns: OFF PATTERN; `--replan` = today's plan beside the saved one). The wave planner in lib/natural.js flies one input per corridor leg (the user: "few holds and releases"); PHYSICS.md "The wave like a person".
- **`tools/presslib.js` -- the press library: where good players press, learned from clears** (gdsolver's real-game plans,
  our routes, the user's attempts): a picture of what is ahead -> the share who pressed there; the solver plays a level by it
  and searches only where that dies; `test` = learn from every other level, predict this one; `hints` = the creator's start
  positions and jump marks against a route. PHYSICS.md "The press library". Test: `node tests/presslib.js`.
- `tools/solutions.js` -- solve each level ONCE on the PC (`--all` for every repo level missing one);
  the viewer and the phone replay the saved solution (natural replay, stamped with the physics
  commit; stale ones are re-solved). make.js and wip.js save one whenever they solve.
- **Incremental solving** (PHYSICS.md "Incremental solving"; owner: the incremental-solving session):
  `lib/incsolve.js` -- an edit re-solves only from a calm point before it until the run is back in the old
  route's exact state (`fromBase`), a physics change re-solves only from the first broken stretch (`refresh`),
  a section cache makes cut and joined levels solve only their seams (`solveWithCache`), old timing windows are
  kept where nothing changed. Saved routes carry `checkpoints`; `tools/inc_store.js` keeps the old levels and
  sections in `local/`. make.js uses it on an existing level (`--full`: the old way). Study:
  `node tools/incsolve.js study|cutjoin|profile <level>`; test: `node tests/incsolve.js [--quick]`.
  **Copy a sim state with `{ ...s }`, never `Object.assign({}, s)`** (V8 makes the latter a slow dictionary object:
  every solver ran 2-5x slower); `node tests/fast_states.js` checks.
- `viewer/index.html` -- the replay viewer; `viewer/levels.js` is generated, do not edit.
- `lib/camera.js` -- the viewer's vertical camera (cube follow, flying bands), measured on the user's recordings;
  `tools/camfit.js <attempt> <track.csv> --fit-shift` checks it against a recording frame by frame (VISUALS.md "Camera").
- `lib/look.js` -- how a level LOOKS (viewer's "game look", on by default): header colours, colour
  899 / alpha 1007 / zoom 1913 triggers over time, block skins 1-7 outlined by their own edges,
  spikes, ground, bg, hills; the player per mode with glow, trail and particles (smoothed between
  steps, PHONE.md). Drawn to match frames of the user's play, no game art. Toggle off for
  the schematic view; "hitboxes" still overlays.
- **GD's own art in the viewer** (VISUALS.md: what is known, how it was checked against recordings,
  what is open, the rule that RobTop's art never leaves the PC): `lib/art.js` draws objects, background,
  ground and icons with the sprite sheets of the user's install, served by `tools/serve.js` at `/gdres/`
  ("GD art" button). Tables: `lib/objects_art.js` (`tools/import_art.js`, OpenGD) and
  `lib/objects_frames.js` (`tools/import_frames.js`, GD 2.2's own id -> frame table from the exe).
  Test: `node tests/art_tables.js`. **See your level as the game draws it:** `node tools/shoot.js
  <level.gdlvl | save:<name> | official:N> [--at 2,5] [--rec <video> --t0 <s>]` -> PNGs in `local/shots/`.
  **The whole level as one picture with its path:** `node tools/levelmap.js <level> [--brief briefs/NN.json]`
  -> `local/maps/<name>.jpg` (viewer: "level map").
  **Every level ends with the signature** (robot + human, "Made by Claude (and some humans)"):
  `tools/signature.js` (signature() objects, describe() for the description).
- **Deco catalogue** (knowledge/objects/README.md): `tools/catalogue.js index | sheets | usage` --
  every id with its picture on contact sheets (`local/catalogue/`, or browse `viewer/catalogue.html`),
  the searchable `knowledge/objects/catalogue.tsv`, and which deco families rated levels use together.
- Iterating on a level's look or play: the viewer's **✎ mark** (key M) saves the user's notes at a
  spot to `marks/marks.jsonl` (via `tools/serve.js`); read them with `node tools/marks.js`, close
  them with `node tools/marks.js done <id> "what changed"`. **compare** puts a frame of one of the
  user's recordings (Videos/Captures, read by ffmpeg, never copied) beside the replay;
  "save comparison" writes both as one PNG to `local/shots/`.
- **Polishing existing levels** (POLISH.md: what polish means to the user -- prettier, more synced,
  visual fixes, more gameplay, extended, fair as the floor -- the passes, results, tests, what is open;
  owner: the polish session, wip `local/wip/polish/`): `tools/polish.js <level.gdlvl>` (fair windows and
  no input forced after a mode change, loose sync, chevrons on needed jumps, the modern look with
  parallax and beat pulses); output in `local/polish/` only. Before/after in GD art: `viewer/polish.html`
  (via tools/serve.js) and shoot.js renders. Helpers: `tools/textmap.js` (a level as text with the
  path), `tools/orbchain_try.js` (forgiving orb chains). Test: `node tests/polish.js`.
- **Our levels against real ones, section by section** (TASTE_DATA.md "Sections vs real levels"): `tools/compare_sections.js`
  (cuts each level at its song's section changes, types them intro / build / drop / calm / groove / flight / ending,
  measures sync, density, variety, look, feel per section, pairs ours with a real section of the same type -- same song
  first -- renders each pair with compare_frames, ranks "where we're off"; sheets via `tools/compare_sheets.py`; output
  local/compare_sections/). **The energy curve, one definition**: `tools/energy.js` (obstacle starts per bar, as a
  percentile in the level; `vsSong` against the song's loudness, `vsSheet` against a vibe sheet's beat energies; test
  `node tests/energy.js`).
- **Deco as a picture** (DECOART.md: paint a section's backdrop as one picture first -- focal light, values, layers -- then build it from GD's flat shapes; A fit the painting with shapes, B the same scene as clean vector, C fit any picture): `lib/paintfit.js` (the fitter, toGD with base channels + HSV), `tools/paintscene.js` (the painter, scenes), `tools/decoart.js <level> --from --to` (one stretch three ways, for the viewer), `tools/blockart.js` (play blocks as a painted material: lit tops, depth, facets, glowing veins), `tools/blockdesigns.js` (22 single-block designs incl. small drawings, gallery level: DECOART.md "Block designs"), **`tools/layoutsections.js` -- the theme layout's sections** (entrance, staircase, cube corridors, hanging, fly, wave, flappy, ball; edited on the Themes tab board, DECOART.md "The theme layout board"), **`tools/designthemes.js` -- design themes** (**`tools/themeprops.js`**: GD's own deco -- fire, skulls, smoke, lava, chains -- tinted, lit and grouped per theme, DECOART.md "Theme props"; **`tools/themedemo.js <theme>`**: one theme with each of its backgrounds, a short lab level) (palette + structure design + 3D + spike / saw designs + holders + indicator + skies + backdrop options, `tools/backdrops.js`; presets changed or extended on the fly per section; gallery `node tools/designthemes.js spec`; DECOART.md "Design themes"), **`tools/structdeco.js` -- the structure deco pass make.js runs in the deco stage** (spec `"structures"`, on by default in compose / planbuild: structure designs per section, 3D, the inside of big structures, holders; DECOART.md "The structure deco pass"; test `node tests/structdeco.js`), `tools/connect.js` (island structures held by ropes / chains / rods, rope bridges, kept off the route; `tools/islands.js` measures islands; DECOART.md "Connected structures"; test `node tests/connect.js`), `tools/indstyles.js` (jump indicator styles apart from block designs: caret, drop, spark, ... spec `"indicators": {"style"}`; DECOART.md "Indicator styles"; test `node tests/indstyles.js`), `tools/structdesign.js` (a design on a whole structure (slopes too): layers follow the shape, notch at inner corners, 3D effects, `extend()` a structure to any size, the connector sheet; DECOART.md "Structure designs"; test `node tests/structdesign.js`), `tools/designs.js` (the block / spike / saw designs as cards in the lego catalogue's Designs tab with Evgeni's votes, `votes` -> knowledge/design_votes.json, `weight()` for generators), `tools/icypart.js` (a short icy part from one repeated structure, little gameplay: DECOART.md round 6), `tools/decofx.js` (what is not a flat shape: 1293 glow, a front layer, set pieces, motes, fades, zoom, a palette turn; DECOART.md round 5). Tests: `node tests/paintfit.js`, `node tests/decofx.js`.
- **`tools/bgconcepts.js`** -- concept pictures of fiery backgrounds behind the fire blocks, to pick before building (DECOART.md "Fire backgrounds, concepts first").
- **Deco options and composition** (ART.md "Deco options and composition"): `tools/decogallery.js` (one element at a time -- blocks, spikes, backgrounds -- in ice and fire, `--shots` gallery page), `tools/decodemo.js` (one stretch dressed rung by rung, ice / fire, `--shots` sheet), `tools/decocomp.js` (how deco is arranged vs the officials), `tools/lane.js` (the play lane, clutter, edge art, framing; spec `"lane": true`).
- **`tools/modeshare.js` -- share of play time per game mode, upside down and mirrored** (route ticks, layout portals past a stale route; main means in knowledge/levels/variety.md "Mode share").
- **`tools/repeat.js` -- gameplay repetition** (repeated play windows, the most used mini-structure, back-to-back loops, same-height corridors -> R 0..1; `--top N` pictures; `--ref` the officials' reference -> knowledge/repeat_ref.json); taste.js applies it as the user's rule on top of the model (TASTE_DATA.md "Repetition").
- **Taste learned from real levels** (TASTE_DATA.md: the corpus of ~330 rated / unrated / official levels with
  likes and downloads, the static measures, which ones separate featured levels from the rest within a tier
  band, the verdict on each of the user's soft rules, what is open; owner: the taste session):
  `tools/taste.js` (`corpus`, `fetch`, `measure`, `learn`, `score <level>`), aggregates in
  `knowledge/taste_model.json`, score.js gate "taste". Test: `node tests/taste.js`.
- **Art: pictures and props as GD objects** (ART.md: how a picture becomes merged deco squares, the prop
  library with counts and sizes, the colour question still open in the game, what is open; owner: the art
  session): `lib/pixelart.js` (canvas + converter), `tools/pixelart.js <image.png>` (picture -> objects,
  `--max-objects`), `lib/props.js` (`put` / `place` / `list` by name: tree, pumpkin, house, robot, ...;
  spec key `"props"` in make.js), `tools/props.js sheet | level`. Test: `node tests/pixelart.js`.
- **The user's drawings -> levels** (SKETCH.md: reading a drawing into a spec, then making it fair;
  the GDLM 46 lessons).
- **The whiteboard: draw a level freehand** (DRAW.md: no grid, pens for ground / blocks / hazards / deco / "I jump here" /
  notes, areas, stamps for orbs, pads, portals and props, deco shown or hidden, the song's beats and drop on the board, ✓ check
  and play; the cell-builder design): `viewer/draw.html`, **inside the viewer as ✏ draw** (key D: the board a see-through layer
  over the viewer's canvas, the viewer draws the level and replays / plays it; DRAW.md "In the viewer", `tests/viewer_draw.js`;
  on the phone in the phone viewer, built by tools/web.js; the standalone page `tools/draw_web.js` is local only since 2026-11-25, its Artifact retired), `lib/sketch.js`, `tools/sketch.js` (a saved sketch from local/sketches/ -> .gdlvl + report).
  **The layout fitter** (sketch -> a layout that plays with the user's own jump marks; the board's 🧩 layout, redone after each
  edit; DRAW.md "The layout fitter"): `lib/sketchfit.js`, `tools/sketch.js <id> --fit`, `tools/sketchshot.js <sketch> [--fit]`
  (a picture of a sketch / its fitted level). Tests: `node tests/sketch.js`, `node tests/sketchfit.js`, `node tests/draw_page.js`.
  **The ✨ one pen** (DRAW.md "One pen: path or shape"): `lib/intent.js` reads a stroke as a path (bricks + corridors with
  their presses) or a shape (nearest brick, else as drawn); `tools/brickset.js` builds `viewer/bricks.js` (our verified lego
  pieces with routes; rerun after `lego.js mine`); test `node tests/intent.js`.
- **Levels onto the phone** (PUBLISH.md: unlisted upload from the PC game with computer use, where
  the buttons are, GD must be windowed, the user's yes before each upload; ONE phone slot,
  ID 152848491, filled with `install.js <lvl> --slot phone`; and the test slot "Claude Lab", `--slot lab --desc "..."`, not uploaded yet; both in `local/phone_ids.json`). **Install queue** `tools/install_queue.js` (add / watch: installs the moment GD closes, reads the save back; PUBLISH.md). `tools/install.js` keeps a shared level's online ID on re-install, so
  Share again updates the same upload (`tests/install_keeps_id.js`).
- **Geode mods** (GEODE.md: which index mods help -- GDShare import, Eclipse / GDH bots, Pathfinder -- which must NOT be installed because they change gameplay, and our own probe mod `mods/gdlm-probe/` that logs the player's state every tick, read by `tools/probe.js`, built by `tools/geode_build.cmd` + packed by `tools/geode_pack.js` (no Geode CLI: Smart App Control blocks it); playback of routes next; the install inbox, v0.6.0: `tools/hotinstall.js` + install.js with GD running, test `node tests/install_hot.js`, GEODE.md "Install into a running GD").
- **Practice -> full run** (GEODE.md "Practice -> full run"): `tools/stitch.js` joins the user's real-game practice attempts
  (probe mod v0.4.0 logs checkpoints) into one start-to-end input route, checks it in our sim, `--save` -> viewer ghost and
  `video.js --run`; `probe.js play ... --events <stitched>` plays it unbroken in the game. Test: `node tests/stitch.js`.
- `levels/archive/` -- every GDLM level but 44, archived 2026-11-25 (Evgeni: "start over, keep only 44"); out of the viewer's list, nothing deleted (its README).
- **`tools/judge.js` -- the judge: Evgeni-style notes pinned to spots** (few clicks in a section, gaps, a corridor too long or
  shaped like an earlier one, no variety, an orb with no reason, too easy), from a level's saved route; `--vs <marks.json>` compares
  them with his marks (tests/judge.js: 11 of his 13 v4 Hellgate marks, `knowledge/judge/`). Run it on every build before he sees it.
- **`tools/report.js <level>` -- the judge report** (Evgeni, 2026-11-26: "not too big, with scores"): one short card --
  Layout 0-10 (balance of sections and pieces, modes -- cube share and upside down --, transitions, rests, flow, variety, pacing, clarity, ending; made stricter 2026-11-26 after Evgeni: "the judge seems to be too nice"), difficulty, unfair spots, taste, deco (later), the top 5
  notes; `--geo <map>.geo.json` (levelmap.js writes it beside each map) pins the notes on the level map. Run it on every build.
- **Hazards: spikes, saws and pits against the player's path** (HAZARDS.md: the study of 21 mains + 127 community levels -- roles threat / guard / fill, jumps over something, lane frames, dressing -- the rules, the generator, what is open): `lib/hazards.js` (`hazardStats`, `hazardsAlongPath(path, objects, opts)`: hazards that follow a planned path and block leaks), `tools/hazards.js level | study [--write]` (-> knowledge/hazards_ref.json; score.js gate "hazards", WARN), `tools/hazards_try.js <level> [--map a b]` (strip a level's hazards and place new ones). Test: `node tests/hazards.js`.
- **Spike and saw designs: one hazard dressed** (HAZARDS.md "Dressing one hazard"; Evgeni: "a spike inside a smaller spike ... glow, layers"): `tools/spikestudy.js` (what rated levels put inside one spike or saw -> knowledge/spike_designs.json), `tools/spikedesign.js list | gallery | check <level>` (14 designs as functions of the hazard, turning with it, hitbox untouched, readability rules; block-design palettes; gallery `levels/gdlm_spike_designs.gdlvl`). Test: `node tests/spikedesign.js`.
- **`tools/density.js <level>` -- is a level sparse inside** (Evgeni 2026-11-26: "i want levels not to be so sparse"): its route cut into bricks against the tier's rated bricks (knowledge/brick_tiers.json), the calmest 4 s windows, the longest stretch with no press; score.js gate "density" (WARN). Test: `node tests/density.js`.
- **`tools/genheight.js [key ...] [--cols 80] [--scale 2]`** -- every generated section type's height spread at its default rows vs rows x scale (rows visited, playable share, evenness, solves), ~24 min for all types at 2 seeds.
- **`tools/heightspread.js <level>`** -- how gameplay spreads over the height, whole level and per mode, from the saved route (Evgeni: a good spread over y in all modes makes a better level); per section in layoutcheck.
- **`tools/gdmarks.js <save:<name> | level.gdlvl>`** -- Evgeni's marker blocks placed in the GD editor: a text object whose text starts with "@" ("@ too tight here"); lists each with column, row and %; `--strip out.gdlvl` removes them once fixed. Read his markers before fixing a level he played.
- **`tools/genroute.js <dir>`** -- the 〰 path of a 🎲 generated piece: the catalogue queues each piece in db collection `genroute` (state asked); fetch, solve (layoutcheck), write the route back, the page draws it (WORKBOOKS.md "genroute").
- **`tools/swingbuild.js [--seed N] [--bpm B] [--write]`** -- the board's swing section built presses first: a click style per generation (flip spacing, drift, quick doubles), the flips played in the sim over a 36-row swell with R band movers, saws drawn around the path, saws the plan touches taken out; `--bpm` puts the flips on half-beats.
- **`tools/orbfit.js <section> [--gap 3] [--write]`** -- re-places a board section's orbs (his kinds, in his order) on the sim's own path so the route takes every one, spaced from each other and the blocks (Evgeni 2026-11-27, "orb gameplay").
- **`tools/startramp.js` -- the level's opening up on blocks** (Evgeni 2026-11-26: not on the default ground): a slope ramp to the first floor, 3 rows by default; every builder uses it, judge.js notes a "ground start".
- **`tools/pieces.js <spec>` -- the pieces a spec is built from**, with their spans and the gaps between them; `--out` +
  `levelmap.js <level> --pieces <out>` draws a bracket per piece on the level map (where pieces join).
- **Feel per section (FEEL.md): `tools/feel.js <song> [--tier T] [--plan out.plan.json --theme kit]`** -- speed portal, clicks a second, beat-matching (brickpick `hitWeight`), shape and look per section from the song (drops faster / denser / on the hits, breaks calmer, speed-ups of the music played faster), held in a difficulty budget, neighbours never twins; planbuild reads `section.feel`. The mains measured: `tools/feelstudy.js` -> knowledge/feel_ref.json. Test `node tests/feel.js`.
- **`tools/songplan.js <song> [--to s]` -- a level's section plan from its song**: cut at the song's transitions (tools/sections.js), a mode per section by its type (break / drop / entry / groove), rests, one upside-down section, cube under ~50% (GDLM 44 v9).
- **`tools/outside.js <level.gdlvl>` -- a secret way around the structures** (Evgeni 2026-11-28: "be careful for secret ways and skipping the structures (in wave for example)"): the saved route above or below every corridor around it for 0.4 s+; `outsideMap(map, route)` the same on a section map, which typebuild scores seeds down by; test `node tests/outside.js`.
- **`tools/gencheck.js [type ...] [--seeds 8] [--write]`** -- the AI's own critic of the section generators (Evgeni 2026-11-28: "catch those stuff somehow by the AI, not just by me"): each type over many seeds, its planned presses replayed in real physics -> dies, lazy (clears with no press / held all the way), unforced clicks or flip pairs, tight windows, sliding, route outside the structures, drawn path vs real, an ending by a hazard; -> knowledge/gencheck.json. Run after every generator change.
- **`tools/genrating.js` -- Evgeni's 0-10 rating of each section generator** (2026-11-28: "if something is very low it should be used very rarely"): sliders under the catalogue's 🎲 generator (db `genrating`); before a build copy them in (ArtifactData `list` genrating -> a file -> `node tools/genrating.js set <file>` -> knowledge/gen_ratings.json); typebuild picks types by (score/10)^2, unrated = 5, never a hard ban.
- **`tools/typebuild.js <briefs/NN.types.json> --run` -- a level from SECTION TYPES in one command** (no lego): song sections + feel -> a type per section generated fresh (tools/sectiongen.js) and checked alone -> joined with portal walls -> make.js (deco pass with a look per section kind, own sky / backdrop per section, one calm effect each via tools/scenes/typefx.js) -> judge report; BUILDING.md section 0 (GDLM 76).
- **HELLGATE.md -- GDLM 44, the benchmark level** (our first uploaded one; Evgeni 2026-11-28): the target -- the whole song, gameplay to 176 s, ~40 s of auto (visible, then weird), ~16 s of animation to the ending -- the order of work and where it stands. Its ending animation: **`tools/hellgate_ending.js`** ("the gate closes", 215.4-231 s, standalone from song 213.8 s; `parts()` for stitching; test `node tests/hellgate_ending.js`).
- `tools/mapbeats.py` (beat and bar lines over a levelmap.js picture). `tools/hellgate_build.js` -- GDLM 44 v3's builder: song part + local grid -> sections -> brickpick / fly-path -> specs/44_hellgate.json (+ .plan.json). **`tools/planbuild.js <briefs/NN.plan.json>`** -- the same builder with the section plan as data, for any level (GDLM 73 sunny streets; LEGO.md "The same builder for any level").
- **Outside sources** (knowledge/external_sources.md): level databases and dumps, creation tools, record and tier lists (Pointercrate, AREDL, GDDL), other AI level makers, with APIs, terms and how each helps.
- `examples/` -- levels the user made in the game, for reference and as format ground truth.

All the library code runs in both node and the browser (no build step, no dependencies).
Keep it that way: one copy of the physics, used by the checker and the viewer alike.

## The format (confirmed on a real GD 2.2 export)

- A `.gdlvl` is `base64url(gzip(record))`. The record is a plist `<dict>`: `k2` name, `k3`
  description (base64url), `k4` level string (base64url(gzip)), `k45` custom song id,
  `k48` object count, `k21` 2 = local level, `kCEK` 4 = level.
- Level string: `header;obj;obj;...;`. Object = `key,value,...`: 1 id, 2 x, 3 y,
  4 flipX, 5 flipY, 6 rotation (deg), 21 colour channel. 155 = GD 2.2's colour-batch
  index: objects sharing a value get ONE colour in the game -- never write it (tools/io.js strips it; ART.md "Colour"). Header `kA4` = start speed (0 = 1x).
- One grid square = 30 units; x,y are object centres; ground top is y=0.
- `node tools/roundtrip.js examples/*.gdlvl` must print `ok` -- re-serialising a real level
  gives back the same record and the same objects.

## Physics sources

- camila314/gdp (branch 2.2): hand decompilations of GD 2.2 physics functions -- speeds, gravity,
  jump, landing snap (15), fall clamp (15), orbs, pads.
- iArtie/GD-2.2081-Decompiled: full 2.2081 decompile (some decompiler errors).
- Open-GD/OpenGD: a 2.1 reimplementation -- hitbox sizes, the 0.9 slow factor on vertical motion.
- gdsolver/gdsolver: an existing 2.2 "is it beatable" solver with measured constants; worth
  reading before reinventing anything.
Values live in `lib/physics.js` (SPEEDS) and `lib/objects.js`. Every other object's kind and hitbox
comes from OpenGD's object data via `tools/import_opengd.js` -> `lib/objects_extra.js` (facts only;
OpenGD is GPL, so its file is not copied in). Rule there: hitbox + not solid + not trigger = hazard,
so anything with a hitbox that is NOT a hazard (portals, coins, toggle orbs) must have its own entry
in `lib/objects.js`. Missing that once let the sim pass through Stereo Madness's pit spikes (id 9).
The rule also misfires the other way: OpenGD gives 37 block-outline / plank pieces type 0 (solid) but
leaves them out of its solids list, so the import called them hazards; `SOLID0` in lib/objects.js
fixes them (Deadlocked's 1202 ball lanes); the lettered helper blocks (type 40) were made killers the same way. Check OpenGD's type column (lib/objects_art.js) after an import.

## Calibration -- checked against the user's game

How: the user says "record", "reshoot" (close the current file, start a new one) or "stop".
**A recorded run counts as checked only when its agreement is computed** (the user, 2026-11-24: "how didnt we catch my
runs"): `tools/replay_run.js` writes each attempt with what really happened (top level) and the sim's replay of the same
presses (`sim`) apart, and `agree` from one rule (tools/attempts.js agreeOf); `node tests/attempts_consistency.js` fails
on a line whose fields contradict, lack the sim side, or no longer replay the same on today's physics. A user clear the
sim does not finish is a ⚠ mismatch with the sim's death point, never drawn as the user's death.
**After every user recording, look for colours the game drew differently** (the user, 2026-11-24: "why we never saw it",
after GDLM 67's deco came out pure white): `python tools/whiteframes.py <video>` flags frames with tall pure-white shapes
inside the game (contact sheet + seconds in local/whiteframes/), and `node tools/channels.js <level>` (score.js gate
"channels") finds deco on a colour channel nothing defines. Compare flagged seconds with the viewer at the same level time.
Run `tools/record.sh start` in the background (it also logs the user's GD inputs, only GD's jump keys/click while GD is in front, to local/inputs/, and the PC's own sound by WASAPI loopback, tools/audiolog.ps1, next to the video; both for tools/replay_run.js; PHYSICS.md "Fidelity"; GD's music must be ON in GD's settings for the sound to align attempts -- with it off, the replay falls back to the progress bar) (whole screen, 60 fps, Desktop Duplication, to
Videos/Captures/GD claude-rec <time>.mkv) and `tools/record.sh stop`. Whole screen rather than
the GD window by title: a window capture looked "frozen" once, but the user had only tabbed out
on a paused screen -- and the file was deleted on that wrong guess, losing their run. Never
delete a recording; to check one, look at frames all through it, not just the first and last.
Game Bar (Win+Alt+R) also works, at ~30 fps, but records whatever window is active -- the user
got clips of the Claude app. Best runs: practice mode with "Show Hitboxes" on. Track the lime cube by colour per frame with
real frame times (`python tools/track.py VIDEO --from S --to S`: pts from ffprobe, never an
assumed rate; `--rows` gives ground/ceiling lines, `--sheet` a contact sheet).
At 1080p one unit is exactly 3.375 px (a block is 101 px). GD's camera moves up and down, so
measure heights against something in the level (ground line, a ceiling), never the screen.

Confirmed:
- Cube jump: matches the recording to 1.8 px rms (0.5 unit) over a whole arc
  (`node tests/jump_video.js`). So 1x speed timing, yStart, gravity and the 240 Hz / 0.9
  stepping hold.
- Spike hitbox 6x12 centred, orb box 36x36: seen in a hitbox-on frame.
- Object 1338 is a 45-degree slope (its hitbox outline is the staircase in the recording).
- Red orb 1.38 x yStart: the user's upside-down dive in the recording bottoms out 122 units below
  the ceiling; the sim gives 124. Measured against the ceiling row's top edge per frame (the
  camera drops during the dive).
- The cube has no head bump: its outer box grazing a block's corner from the head side does
  nothing, only the 9x9 inner box kills (the same dive clips a ledge corner and carries on).
- The wave slides along a block's top, but dies as it slides off the block's end (its centre
  passing the corner, x within ~5 units): two of two deaths in the user's GDLM 44 runs
  (2026-11-23_02-51-50.mkv, 17.6 s and 24.38 s). The sim slid off and lived until then.
- The wave dies flying head-on into a slope (down into a rising 45-degree floor): GDLM 44's zigzag,
  2026-11-23_03-11-47.mkv ~25 s. The sim had let it ride up the slope.
- The teleport portal (747) fires on a 25 x 90 box centred 12 units right of the object: the user's hitbox-on Deadlocked
  practice run (2026-11-24_00-33-07.mkv, 196.33 s) shows the ship leave the exit ~10 units further right than a centred
  box gives; with it Deadlocked is beaten in the sim (2026-11-25).
- Saws by the level's "Fix Radius Collision" (header kA39, on in every level we write, off in the mains but Dash): on = centre
  distance < half the player + radius, off = the player's rect against the circle. Evgeni's room-mover lab clear
  (2026-11-27) passes a saw the rect test kills; with it all 3 attempts end on the game's step. The same runs confirm a
  portal of your own mode re-sets the flying band. PHYSICS.md "Fix Radius Collision"; `node tests/fix_radius.js`.
- GD 2.2's jump snap, a 10-unit foot margin on block tops (not 15), x as a 32-bit float, and turned hazards against the
  spinning player's turned box (2026-11-26, probe mod logs of 21 main levels, each attempt's own presses): with them the sim
  dies on the game's death step on 14 of the 21 mains and on GDLM 44 / 64; before, on none. The cube remembers the block
  GD's collision loop meets last (lowest 100-unit section, earliest object), breakable 143 never snaps. PHYSICS.md "Jump
  snap, foot margin, 32-bit x".
- On top of that (2026-11-26, PHYSICS.md "Landing jump and slopes from the probe logs"): a jump on a button held through a
  landing goes the next tick at full speed (no gravity on its first tick); the cube (and wave) sits on a slope at
  x + 15 tan(angle/2), is held at the top a tick, then launched (7.405 on 45 degrees). With them GDLM 62's 62 s run and
  Clubstep's first attempt match the game at every frame. Yellow pad: vy 16.000 in cube and ship ("auto play area" run).
- From the user's ToE / ToE2 / Hexagon Force / Deadlocked runs (2026-11-26, probe logs; the log's p[8], p[9] are the
  per-tick position, p[7] the speed factor): speed portals 2x / 3x are 51 / 65 wide (not 34), the orb flag outlives a
  release by a tick, turned portals touch by their turned box, a -53 degree teleport moves the full key 54, a ship slides a
  ceiling slope and is launched off its low end, ship -> UFO keeps a quarter of vy. PHYSICS.md "The user's ToE / ToE2 /
  Hexagon Force / Deadlocked runs".
- Flipping gravity halves vertical speed (blue orb and ceiling blue pad in the recording move at
  half the decompile's velocity). The decompile's ringJump alone does not show this.

- Mode accelerations in the user's Clutterfunk recording (60 fps): cube +-0.78, ship hold +0.40 /
  release -0.25, ball +-0.47 units/frame^2 -- the sim gives 0.778 / 0.389 / -0.248 / 0.464
  (`node tests/modes_video.js`). So the ship's per-tick physics is right; the Stereo Madness
  ship-height mismatch lies elsewhere (a ship seated on a block keeping its fall speed would fix
  Back On Track's case, but gdsolver's model zeroes it, so that is not in). No clean UFO stretch yet.
- Vertical speed lives on a 0.001 grid (every velocity step is rounded). Took the jump-vs-video
  fit from 1.8 to 1.3 px rms.

Second ground truth: real-game input plans. gdsolver publishes, per official level, inputs that
clear it in GD 2.2 (240 Hz ticks). `node tools/tas.js [n]` plays them through our sim: where we
die and the game did not, we are wrong right there. Plans go in `local/gdsolver/` (copy from
gdsolver's `data/`, never committed). `node tests/tas_progress.js` is a ratchet of how far each
level gets -- raise its numbers when a fix gets further, never lower them. Facts found this way:
slab (40) hitbox is centred; ids 5/73/80 are scenery; every slope skin is a slope; GD 2.2's own
decoration list (`lib/objects_gd22.js`) beats OpenGD's 2.1 table; an upside-down cube that walks
off a ledge can still jump until it falls faster than 2g (GD bug). Polargeist gets to 909/925.
More facts from the plans (2026-11-22): a plan's tick t is our step t-1 (orbs at the edge of their
reach decide it); an orb touched at the end of either of the last two ticks takes a press (GD's
touched-orb list carries over a tick); hitboxes and saw radii grow with the object's scale (keys
32, 128/129); id 143 is a one-way platform (land on it, never dies); 661-664 and 1903-1905 are
slabs, not hazards; a blue pad flipped with key 5 faces down; move triggers move by 30 units a
block. Plans now reach (blocks): 9: 343, 11: 288 (mini), 13: 116, 19: 100, 22: 81 (it jumps off
blocks a move trigger raises).

Open mismatches the plans show (not understood yet, do not paper over them):
- ~~Stereo Madness's ship hovers ~0.5 unit lower~~: its plan clears since 2026-11-26 (stair snap + float x + held
  landing jump, from the probe logs: PHYSICS.md "Landing jump and slopes from the probe logs"). Hexagon Force's ship (lv16, 141) still
  grazes a saw after riding a ceiling slope: likely the slope rule (PHYSICS.md queue 4b).
- Theory of Everything (lv12, 34) and its sequel (lv18, 106): after a pink orb the cube is ~30 units
  too low to land on a block with a blue pad; every orb and pad value matches gdsolver's.
- ~~Back On Track's ship ends ~1 block high after a slide (493)~~: its plan clears since 2026-11-26.
- The landing (2026-11-24, corrected the same evening): GD keeps NO released press for landing -- the cube jumps on
  landing only while the button is down (one tick of grace), the user's GDLM 67 frames and GD's disassembly (via
  gdsolver) agree; the morning's long buffer was built on a death-%-fitted clock 0.4 s off. gdsolver's plans that it
  "fixed" (Polargeist, Dry Out, Can't Let Go, Jumper, Time Machine, Clutterfunk) show our cube landing 4-21 ticks late
  there: open. And a cube that landed on the ground jumps no sooner than the tick after (a held bounce every 104
  ticks, as GD and the user's video). PHYSICS.md "Landing buffer", "Frames: the video as the reference".
- In the sim since 2026-11-26 (a cut at vy -4, a guess; the auto lab v11 log gave an exact -13.6 death): an upside-down cube hitting the ground hard dies in the game (GDLM 67's green orb, 3 of 4), a soft touch does
  not; the sim never kills it. Needs the green orb's throw calibrated first. PHYSICS.md "Upside-down cube and the ground".

Modes beyond cube/ship come from gdsolver's measured model and the gdp decompile, checked only
by the plans so far (xStep's ball, Blast Processing's wave): ball, UFO, wave, robot, spider,
swing. Each still wants a recording of the user's own play.

- No flying off into the sky (the user, 2026-11-23: "you cant just fly to the sky"). The sim
  counts 300 units above the highest object as a death; the exact height is not measured.

Assumed (not yet checked):
- Object keys 121 = No Touch and 134 = Passable (both make an object not collide).
- Dash orbs: horizontal at the orb's angle while held; the props 586/588 on them are unknown.
- "Click Between Steps" is OFF in the user's settings: presses land on a frame boundary, not any
  240 Hz step. The solver still allows any step.

## Status of the solver on "cube timings" (examples/)

Beaten: 11 presses plus a dash release, tightest window 17 ms (windows replay-checked since 2026-11-23). Every part of
the level is in the sim: triple spikes, blue orb + ceiling blue pad, slope, dash orb, red orb,
spider orb + pad, the upside-down red-orb dive under a hanging column.

## Not simulated yet

Mirror and dual portals, teleport portal variants 2902/2064 and the teleport trigger 3022; follow and "move to target" triggers, and a player carried sideways by a moving
block; speed-dependent ring scaling for ball/UFO; spike slopes (any slope skin that kills is
treated as a plain slope -- unchecked).
Simulated but checked only by the plans: mini size (gdsolver's measured values), move/toggle/spawn
triggers (x-crossing, touch and spawn firing, GD's easings), ceiling slopes, turned hazard boxes.
The viewer draws moving objects where they start.

## Rules

- **In the viewer, everything that exists can be seen at once; nothing waits on a solve to be visible.** A level or
  build stage with no route runs as a ghost (the camera at the level's speed, portals honoured), and its level map is
  drawn in the page from the layout; solving for the route is an option, never the price of seeing it.
- **Every top-level section of a page we make folds** (Evgeni, 2026-11-26: "need to UI of a top level section to be always
  collapsible, lets put that somewhere as a rule when we make those"; the catalogue was "heavy with stuff. long long info"):
  catalogues, the viewer's panels, boards, report pages. A header that folds its section, remembered per viewer, long
  explanations folded by default, short text on cards. The lego catalogue does it with `data-fold` (tools/lego_page.html).
- **More than ~4 buttons in a row fold too** (Evgeni, 2026-11-27: "any UI as well over some kind of view. everything under collapsible
  sections above like 4 buttons"): a control row longer than ~4 sits behind one ▸ label (folded by default, remembered); the
  one or two main actions (play, build, save, send) stay outside. Cards in a long list (themes) start folded to one line.
  Example: tools/designs_tab.js `FR()`.
- **Notes and marks on our pages: autosave, send to Claude, fold what is seen** (Evgeni, 2026-11-27: "dont want \"save mark\",
  send to claude when we have list of comments/marks ... they should apply for future sessions, and other agents"). On every
  page we make (catalogues, viewer, boards, artifacts): a note or comment saves as it is typed (debounced, Enter too) with a
  small "saved" / "not saved: why" -- never a save button, and typed text is never lost to a re-render; a page with a list of
  marks or comments has one **📨 send to Claude** (artifact `comments` capability, `sendToClaude`) so he never has to come to
  the chat, and it sends only what was never sent (or changed since), so Claude never gets a mark twice; claude.ai refuses a send within ~6 s of a key typed in the page, so the button counts that down; each mark has states open -> seen (Claude read it: `seen` + `reply`, folded away) -> fixed (deleted from the page,
  kept in a log in git), so lists never just grow. Example: tools/designs_tab.js (the catalogue's theme 📍 marks).
- **Pages keep the view across reloads** (Evgeni, 2026-11-27: "when u update my workbook ... my page resets sometimes and i
  lose what i look at (happens in all workbooks)"). Every republish reloads each open artifact view, so every page we make
  keeps, per viewer in localStorage (try/catch), the tab, the scroll spot and the folds, and puts them back on load (waiting
  until lazy content is tall enough). Republish in batches, not after every small change. Example: tools/lego_page.html
  ("KEEP THE VIEW").
- **The workbook is where he works, always** (Evgeni, 2026-11-27: "i want to work on the workbook not externally, always.
  external browsers are annoying"): every page for him is a claude.ai artifact (the workbook) and must work there -- never
  point him to localhost or another browser as the way to use something, and don't open the browser pane on his PC to
  test. A page that works in a plain browser but not in the app is a bug in our page.
- **Jobs he starts are buttons on the page** (Evgeni, 2026-11-27: "whenever is some operations i should do, like say build,
  lets move that as a button for example on the theme"): when a step waits on his go (build, rebuild, apply, install
  request), put a button on the thing it is about that sends Claude the request (`comments` capability `sendToClaude`,
  anchored on that card), with a small "asked Claude HH:MM" status. The page never runs the job itself. Example: 🔨 build on
  each theme card (tools/designs_tab.js `ask`).
- **The Themes tab shows what is being worked on** (Evgeni, 2026-11-27: "add here below themes, things that shows what being
  worked on, and some rough estimates in minutes. things relevant to the marks in this themes section"): every session working
  on a theme mark, a board section or a generator note writes it to the lego catalogue's db collection `themework` with
  ArtifactData (doc per item: {title, about, owner, state: working | queued | waiting | done, est_min, basis, started, done_at,
  at}) when it starts, and sets state done + done_at when it lands. est_min only from a measured run (basis names it); else
  leave it out ("not measured"). Rendered by tools/designs_tab.js `workSection`.
- **Controls never sit on the gameplay view** (Evgeni, 2026-11-27, of the theme card's buttons drawn over the scene: "UI should be
  outside the gameplay windows" -- "for all viewers sessions"): in every viewer, card and page we make, buttons, selects, chips
  and status text go in a row above or below the level / scene picture, never absolutely positioned over it. Only marks the
  user placed (pins, his drawing) and the player may draw on it. Example: tools/designs_tab.js `.zb`.
- **Every button has a hover effect** (Evgeni, 2026-11-27: "all UI buttons should have some hover effect, in all workbooks
  forever"): buttons, selects, chips, summaries brighten with a soft ring on hover and dip on press. Paste
  `tools/snippets/hover.css` once into every page we make; `node tests/hover_rule.js` fails on a page template without it.
- **Every workbook page has ⟳ refresh + "last refreshed"** (Evgeni, 2026-11-27: "add refresh on every workbook have and last
  refreshed, and some effect when i click refresh"): catalogues, boards, the viewer pages, every artifact we make. Paste
  `tools/snippets/refresh.html` once (lego_page.js does it): a button top-right, "last refreshed HH:MM" beside it, a spin on
  click, then the page reloads with fresh data keeping its view and flashes "refreshed ✓". Fetch data with `cache: "no-store"`.
- **WORKBOOKS.md: every bug and quirk of pages in the claude.ai app** (Evgeni, 2026-11-27: "whatever knowledge of bugs we
  gain working with workbooks we want to know always on all sessions everywhere"). Read it before building or changing any
  workbook page; a new bug goes in as a row there in the same commit as its fix (e.g. db data comes back frozen: copy it).
- **No native dialogs in the viewer pages** (alert / confirm / prompt): the app's built-in browser and the phone page's
  frame suppress them, so the button just did nothing. Use the viewer's notice(), askNote(), showMap();
  `node tests/no_dialogs.js` checks.
- **Never pop a window on the user's screen.** Every child process (spawn, spawnSync, exec*, execFile*, fork) passes
  `windowsHide: true`: on Windows a console child without it flashes a console window (serve.js's self-update did,
  every minute, 2026-11-23). `node tests/no_console_windows.js` fails on any call without it (`--fix` adds it).

- Levels must be sight-readable unless the user asks otherwise: no "prejumps" (a jump you must
  start while what it is for is still far ahead). `make.js` prints it; `tools/sightread.js`.
  Invisible parts: ghost (faint) by default, fully hidden only for a chunk already seen; whole
  blind phrases are "unfair" in the user's words. See STYLE.md.

- Never commit songs (Newgrounds songs belong to their artists) -- except the Creative Commons ones in
  `knowledge/free_songs.md` (credited, `songs/free/`, only when a public level uses one) -- or other people's levels
  without their OK. The user's own levels in `examples/` are fine.
- Not affiliated with RobTop; do not use GD's art or name the repo/tool as if it were official.
- Unknown object ids: never guess silently. Mark `sure:false`, and ask the user what the object
  is in the editor.

## Later (said, not built)

- Music sync is a must (the user: levels "try to sync", some more, some less). Built: beat grids
  (`tools/beats.js`), sync scores (`tools/sync.js`), specs in beats (`"b12"`, `"j12"` in
  `tools/make.js`), beat lines in the viewer. Method, findings and limits: SYNC.md. In short:
  the official levels put portals (by their centre) on bar starts and phrases, orbs loosely on
  beats, spikes and clicks not on the beat. The user's rule: sync loosely, not forced -- sync
  portals, drops and some orbs, leave most clicks free; beatless parts (ship, wave) follow the
  song's loudness, not a grid (SYNC.md "How much to sync"; make.js notes over-sync). Not yet:
  songs with tempo changes, checking in the user's game that "on the beat" feels on the beat. Recordings have no sound: the PC has no
  loopback device (only the headset mic).
- Playing on the phone too: how to get an updated level onto the phone while away from the PC.
  Watching is built: the phone page (PHONE.md: live work in progress, marks, songs added from
  the phone). Playing it in the phone's game: unlisted uploads from the PC game, found
  on the phone by ID (PUBLISH.md; IDs in `local/phone_ids.json`); `tools/export_gmd.js` (.gmd for
  GDShare) where file import works.
- An in-game GD list of all the Claude levels (the user, 2026-11-23: "making a new gd list ingame,
  with all claude levels. Maybe later"). GD 2.2 lists hold online level IDs, so every level in it
  must be uploaded first -- which clashes with the user's rule of not putting many AI levels on the
  server yet (today only the phone slot, ID 152848491, is used). Names are final once uploaded
  (PUBLISH.md), so settle names first. Not started; no owner yet.
