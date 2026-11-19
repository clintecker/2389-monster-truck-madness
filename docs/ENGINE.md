# Engine guide

## A frame in the driver's seat

`app.js` owns the menu, grid, driving, pause, victory rollout, replay and results states. Its animation callback accumulates elapsed time. Each simulation tick samples input, advances the grid or calls `MTMPhysics.drive`, and records the pose needed for interpolation. `motion.js` interpolates between adjacent ticks for rendering. The chase camera carries forward the truck's position delta and damps its aim and boom. Right-drag adds yaw and pitch only after the ordinary camera pose has been calculated; releasing capture clears both offsets.

`course.js` measures a Catmull–Rom route by arc length. Its samples drive the course map, gates, elevation profile and AI racing line. Its nearest-segment lookup uses spatial cells and an expected distance to disambiguate crossings. The player can leave the racing line. A gate is credited when the swept motion crosses its plane in the forward direction and within its width.

## What touches what

`physics.js` integrates forward and lateral velocity, tire grip, gearing, yaw, airborne motion and suspension. `contact.js` resolves a truck's horizontal contact envelope against vehicles and trackside obstacles. Separating the normal impulse from tangential friction lets trucks rub against each other while carrying momentum down the track. Each truck needs a valid contact weight.

`world.js` wraps the surveyed terrain for each race. Wheel deformation and breakable props belong to that race instance. `props.js` and `soilart.js` turn state into visible changes. Replay samples truck poses and world state; playback reconstructs damaged props and ruts rather than running physics again.

## Rendering and sound

`view.js` selects WebGL, the WebAssembly software renderer, or the Canvas sprite path. The first two share the Three.js scene. `software.js` uploads mesh data and texture mipmaps to `raster.wasm`; the AssemblyScript source is `raster.ts`. Scene data and scratch memory can be reclaimed when switching courses. The Canvas path projects the road and roadside artwork and draws the fitted sprites.

`finish.js` locates the turnaround relative to the last gate. The course and its tour camera share the same bleachers and show clock. Firework shells have separate lift, flight and break times, with different particle paths, colors, descent and decay. Sound cues carry the shell type, distance and simulated propagation delay into `audio.js`. A distant burst can therefore be visible before its report arrives. Reduced-motion mode presents a static sample of the display.

The HTML builder copies the ES modules, fonts, artwork and the compiled rasterizer into `dist/` and writes an index page that loads Three.js as a classic script and `app.js` as a module. Serve the directory over http; a browser will not resolve modules from a `file://` URL. The page does not serialize a live race or the player's local save.
