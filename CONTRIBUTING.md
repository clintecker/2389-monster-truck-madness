# Working on Night Shift

Use Python 3.10+ for the page builder and Node 24 for the test suite. Work on the files in `src/`, then regenerate `dist/`. The built directory is committed so a fresh clone is already playable.

```sh
npm ci
npm run build
npm test
npm run test:render
```

| Command | Coverage |
| --- | --- |
| `npm test` | Grid spacing and launch timing, manual shifting, contact, deformation, complete races, both tournament menus and standings |
| `npm run test:render` | Boots the actual HTML at a file URL, renders all eight garage rigs and checks wheel changes, camera reset, input and race HUD |
| `npm run test:canvas` | Forces the last-resort sprite renderer by disabling WASM in the offline harness |
| `npm run test:caddy-drive` | Takes the imported Caddy out of the real garage: two tire/stance fits, a race with throttle, steering and braking, and a tournament start |
| `npm run test:scenery` | Mounts the original course environments and checks approach visibility, acts, signage, horns and tour stops |
| `npm run test:endurance` | Runs twelve-lap desert and figure-eight races against the fixed-step driver |
| `npm run build:raster` | Compiles the software triangle renderer after a change to `src/raster.ts`; follow with `npm run build` |

The simulation tests exercise real physics with repeatable steering inputs. The tournament test drives the menu and race state machine with a gamepad stub. The render test executes the assembled page through JSDOM with native Canvas backing. Listen to loudness, stereo placement and echoes in a real browser, and check actual WebGL and touch input there as well. The native Canvas test can take a minute or more on slower hardware.

For a race regression, include the truck, tires, suspension, transmission, course, distance, input device and camera. If a gate fails, include the gate number and direction of travel. For art changes, capture both the showroom and chase view, or approach a roadside prop at racing speed. For timing and records changes, run both cups and check existing browser saves.

## Release

1. Build from a clean checkout and run the simulation and offline render suites.
2. Serve `dist/` over http, drive through green, then inspect a new truck and the finish show.
3. Check the release bytes with `git add -A dist && git diff --cached --exit-code -- dist` after the generated output has been committed. The build copies modules and assets verbatim, so the check catches drift between `src/` and `dist/`.
4. Publish the tested directory as the static root or attach it to a release. The live game's hosting account and credentials are managed separately.

For Cloudflare releases, follow [the deployment handoff](docs/CLOUDFLARE.md). PRs validate automatically; production deployment remains disabled until the operator configures it.
