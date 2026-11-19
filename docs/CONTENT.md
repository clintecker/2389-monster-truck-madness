# Content workshop

## Survey a course

Start in `src/course.js`. Give the event a unique `layoutKey`, select a supported environment family with `id`, then define its named event, nodes in metres, route closure, width, laps and checkpoint fractions. An environment ID selects the scenery family; a layout key distinguishes the physical road and its saved settings. Put gates far enough beyond a crest for a jumping truck to cross their planes and leave room beyond the finish for the turnaround.

Use `forDistance` and `recordKey` to keep different physical routes and distances distinct. The special long-course selection for the classic Mesa and Loop is a single long lap. Check the start grid, a full course in both transmissions, the return road on circuits, and the fork at a crossing. A new event also needs a card image, the relevant cup membership in `app.js`, and a tile entry in `tools/build.py`.

## Send a truck to the motor pool

`src/trucks.js` owns the roster, vehicle dimensions, body and chassis batches, decals, hubs, tire geometry and suspension. The truck's local +Z axis points forward and +Y points up. Append a new roster entry to preserve saved truck IDs. Give it a recognizable rear silhouette: that is the view a driver spends most of the race watching.

Use the same model construction for the race and showroom. Add an actual front/rear fitment sheet and wheel portraits to `fitment-sprites.js` for the Canvas path. Wire its home image through `style.css` and the builder, set sensible garage defaults and review its contact weight. Verify all tire/stance combinations, restart a race after refitting, and sideswipe another truck. Test a tournament with the new vehicle so the standings include its ID.

## Sell a project to the wrong audience

A short two-line pitch survives a drive-by. Reserve the long joke for the tour. The audience is part of the gag: Dot Viewer advertises **MAP THE MUSTARD** to hot dog vendors and **TILT THE GRAPH** to pinball players.

Use `scenery.js` for physical sign mounts, copy and audience campaign metadata. Put painted billboard artwork in `sponsor-art.js`. Interactive project machines live in `project-fair.js` and the three regional midway files. Moving artwork supplies a 3D builder and a Canvas drawing so a fallback driver sees the same idea. The midway planner checks its footprint, approach and nearby attractions. Give a responsive act a horn reply, and give project advertising the project's real URL.

The finish show belongs in `finish.js`; the corresponding synthesis is in `audio.js`. Design a shell around its silhouette and timing first. Add the lift and delayed report, then watch it from both the pit and Trackside. Keep static reduced-motion artwork legible when several effects overlap.
