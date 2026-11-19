# Working on Night Shift

Use Python 3.10+ for the page builder and Node 24 for the test suite. Work on the files in `src/`, then regenerate `dist/index.html`. The latter is committed so a fresh clone is already playable.

```sh
npm ci
npm run build
npm test
npm run test:render
```

| Command | Coverage |
| --- | --- |
| `npm test` | Grid spacing and launch timing, manual shifting, contact, deformation, complete races, both tournament menus and standings |
| `npm run test:render` | Boots the actual HTML at a file URL, renders all seven garage rigs and checks wheel changes, camera reset, input and race HUD |
| `npm run test:canvas` | Forces the last-resort sprite renderer by disabling WASM in the offline harness |
| `npm run test:scenery` | Mounts the original course environments and checks approach visibility, acts, signage, horns and tour stops |
| `npm run test:endurance` | Runs twelve-lap desert and figure-eight races against the fixed-step driver |
| `npm run build:raster` | Compiles the software triangle renderer after a change to `src/raster.ts`; follow with `npm run build` |

The simulation tests exercise real physics with repeatable steering inputs. The tournament test drives the menu and race state machine with a gamepad stub. The render test executes the assembled page through JSDOM with native Canvas backing. Listen to loudness, stereo placement and echoes in a real browser, and check actual WebGL and touch input there as well. The native Canvas test can take a minute or more on slower hardware.

For a race regression, include the truck, tires, suspension, transmission, course, distance, input device and camera. If a gate fails, include the gate number and direction of travel. For art changes, capture both the showroom and chase view, or approach a roadside prop at racing speed. For timing and records changes, run both cups and check existing browser saves.

## Release

1. Build from a clean checkout and run the simulation and offline render suites.
2. Open the built HTML directly, drive through green, then inspect a new truck and the finish show. Test the browser's **Save offline** control.
3. Check the release bytes with `git diff --exit-code -- dist/index.html` after the generated output has been committed. The builder embeds its own shell so an in-game download can reproduce the distribution.
4. Publish the tested file as the static root or attach it to a release. The live game's hosting account and credentials are managed separately.
