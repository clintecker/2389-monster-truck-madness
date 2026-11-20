/* The appended eighth truck: the Harlequin Caddy Mk1 Parts Runner.

   docs/CONTENT.md asks a new truck to keep every published ID, build the same
   model for the race and the showroom, ship Canvas fitment sheets, carry a home
   cover, review its contact weight and appear in a tournament. This test covers
   those points for the one truck whose body is imported rather than authored:
   the shell is the approved CAD export reduced by tools/bake-caddy-model.cjs. */
const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const cn = require('@napi-rs/canvas');
const root = path.join(__dirname, '../src');

global.window = global;
require(root + '/three.min.js');
global.THREE = globalThis.THREE;
global.document = {createElement: () => cn.createCanvas(8, 8)};

const published = [
  ['BIGFOOT', '01'], ['Grave Digger', '07'], ['Snake Bite', '08'], ['Carolina Crusher', '12'],
  ['Mux Switchblade', '23'], ['Orrery Orbital', '89'], ['Soloclaw', '38'],
];

const triangles = rig => {
  let total = 0;
  rig.root.traverse(o => { if (o.isMesh) total += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
  return Math.round(total);
};

/* Hue in degrees. Shading moves a baked livery colour around the brightness axis
   but not around the hue circle, so hue is how a panel is recognised on screen. */
const hueOf = (r, g, b) => {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), span = max - min;
  if (!span) return 0;
  const hue = max === r ? (g - b) / span : max === g ? 2 + (b - r) / span : 4 + (r - g) / span;
  return (hue * 60 + 360) % 360;
};
const hueFamily = (r, g, b) => {
  if (Math.max(r, g, b) - Math.min(r, g, b) < 18) return 'grey';
  const hue = hueOf(r, g, b);
  return hue < 20 || hue > 330 ? 'red' : hue < 70 ? 'yellow' : hue < 160 ? 'green' : hue < 280 ? 'blue' : 'red';
};

(async () => {
  const {MTMTrucks} = await import(root + '/trucks.js');
  const {MTMFitmentArt} = await import(root + '/fitment-sprites.js');
  const {MTMContact} = await import(root + '/contact.js');
  const {MTMPhysics} = await import(root + '/physics.js');
  const {MTMCourses} = await import(root + '/course.js');
  const {MTMCaddyModel} = await import(root + '/caddy-model.js');

  // Appended, never reordered: saved trucks, records and placements are IDs.
  assert.equal(MTMTrucks.roster.length, published.length + 1, 'the Caddy is appended');
  published.forEach(([name, number], id) => {
    assert.equal(MTMTrucks.roster[id].name, name, `id ${id} keeps its name`);
    assert.equal(MTMTrucks.roster[id].number, number, `id ${id} keeps its number`);
  });
  const caddy = MTMTrucks.roster.at(-1);
  assert.equal(caddy.name, 'VW Caddy Mk1 Parts Runner');
  assert.equal(caddy.number, '83');

  // The body is the approved geometry, grouped into one mesh per fleet material
  // so the software rasteriser can draw it, and it is not the raw export.
  const materials = new Set(MTMCaddyModel.parts.map(part => part.material));
  assert.deepEqual([...materials].sort(), ['glass', 'lit', 'metal', 'paint'], 'parts map onto shared fleet materials');
  assert(MTMCaddyModel.parts.some(part => /HELLA driving lamps cover/.test(part.name)), 'the lamp covers are part of the body');
  assert(MTMCaddyModel.parts.some(part => /brush guard/.test(part.name)), 'the brush guard is part of the body');
  assert(!MTMCaddyModel.parts.some(part => /wheel|axle|coilover|frame/i.test(part.name)), 'running gear comes from the rig, not the export');
  assert(MTMCaddyModel.triangles < 40000, `the baked body stays a low-detail model (${MTMCaddyModel.triangles} triangles)`);
  assert(!fs.existsSync(path.join(root, 'model')), 'no CAD buffer directory ships');

  // Every part carries the livery the approved export paints on it. A corner
  // colour read with the wrong stride used to hand two thirds of the body
  // another face's colour and the rest nothing at all, which reached the screen
  // as black panels and shards; the palette is the cheapest place to pin that.
  const baked = part => {
    const raw = text => Uint8Array.from(Buffer.from(text, 'base64'));
    return {colours: raw(part.colors), indices: raw(part.indices), position: raw(part.positions)};
  };
  for (const part of MTMCaddyModel.parts.filter(part => part.name.startsWith('shell '))) {
    const buffer = baked(part).colours;
    let darkest = 255;
    for (let i = 0; i < buffer.length; i += 3) darkest = Math.min(darkest, (buffer[i] + buffer[i + 1] + buffer[i + 2]) / 3);
    assert(darkest > 24, `${part.name} keeps a readable palette (darkest vertex colour ${darkest.toFixed(0)}/255)`);
  }
  const paintHues = new Set();
  const paintColours = baked(MTMCaddyModel.parts.find(part => part.name === 'shell paint')).colours;
  for (let i = 0; i < paintColours.length; i += 3) paintHues.add(hueOf(paintColours[i], paintColours[i + 1], paintColours[i + 2]));
  const hueFamilies = new Set([...paintHues].map(hue => hue < 20 || hue > 330 ? 'red' : hue < 70 ? 'yellow' : hue < 160 ? 'green' : 'blue'));
  assert.deepEqual([...hueFamilies].sort(), ['blue', 'green', 'red', 'yellow'],
    `the harlequin livery survives the bake (hue families: ${[...hueFamilies].sort().join(', ')})`);

  // The chase camera looks straight at the tailgate. Rendered through the game's
  // own software rasteriser it must come back as one closed blue panel: the
  // corners that were read with the wrong stride left black shards on it, and the
  // reduction tore the letter band open far enough to show the far interior —
  // the green fender and the red door — through the slit.
  {
    const staged = path.join(root, '.baked-software.mjs');
    fs.writeFileSync(staged, fs.readFileSync(path.join(root, 'software.js'), 'utf8')
      .replace('/*__WASM__*/', fs.readFileSync(path.join(root, 'raster.wasm')).toString('base64')));
    try {
      const {MTMSoftwareRenderer} = await import(staged);
      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#111a2b');
      scene.userData.softwareTint = [.88, .94, 1];
      const shown = MTMTrucks.make(7, true, {tires: 1, suspension: 1});
      scene.add(shown.root);
      const camera = new THREE.PerspectiveCamera(30, 320 / 200, .1, 90);
      camera.position.set(0, 2.6, -5.2);
      camera.lookAt(0, 2.15, -2.4);
      const renderer = MTMSoftwareRenderer();
      renderer.setPixelRatio(1);
      renderer.setSize(320, 200);
      renderer.render(scene, camera);
      const frame = renderer.domElement.getContext('2d').getImageData(0, 0, 320, 200).data;
      // The flat middle of the panel, 3 cm inside its outer skin.
      const corners = [[-0.6, 2.12], [0.6, 2.12], [0.6, 2.52], [-0.6, 2.52]].map(([x, y]) => {
        const point = new THREE.Vector3(x, y, -2.56).project(camera);
        return [(point.x + 1) * 160, (1 - point.y) * 100];
      });
      const seen = {blue: 0, yellow: 0, red: 0, green: 0, grey: 0, other: 0};
      let total = 0;
      for (let y = Math.round(Math.min(...corners.map(c => c[1]))); y <= Math.round(Math.max(...corners.map(c => c[1]))); y++)
        for (let x = Math.round(Math.min(...corners.map(c => c[0]))); x <= Math.round(Math.max(...corners.map(c => c[0]))); x++) {
          const at = (y * 320 + x) * 4;
          seen[hueFamily(frame[at], frame[at + 1], frame[at + 2])]++;
          total++;
        }
      assert(total > 200, `the tailgate covers real pixels (${total})`);
      assert(seen.blue / total > .8, `the tailgate reads as one blue panel (${(seen.blue / total * 100).toFixed(0)}% blue of ${total} pixels)`);
      assert((seen.green + seen.red) / total < .02,
        `nothing behind the tailgate shows through it (${seen.green} green, ${seen.red} red of ${total} pixels)`);
    } finally {
      fs.rmSync(staged, {force: true});
    }
  }

  // Same construction for the race and the showroom, and the rig reuses the
  // fleet's running gear so pose() articulates it like every other truck.
  const garage = MTMTrucks.make(7, true, {tires: 1, suspension: 1});
  const rival = MTMTrucks.make(7, false, {tires: 2, suspension: 0});
  assert.equal(garage.root.name, caddy.name);
  assert.equal(garage.setup.tires, 1);
  assert.equal(rival.setup.tires, 2);
  assert.equal(garage.wheels.length, 4, 'four steering wheels');
  assert.equal(garage.struts.length, 4, 'four coilovers');
  assert.equal(garage.axles.length, 2, 'two live axles');
  assert.equal(garage.body.children[0].children.length, MTMCaddyModel.parts.length, 'the showroom body carries every baked part');
  // One detail level by decision, not by accident: the reduction has no coarser
  // step that holds together, so a rival Caddy is as heavy as the player's.
  assert.equal(rival.body.children[0].children.length, MTMCaddyModel.parts.length, 'a rival Caddy carries the same baked body');
  const gear = triangles(garage) - MTMCaddyModel.triangles;
  assert(gear > 15000, 'the fleet running gear is really there');
  assert(triangles(garage) < 50000, `whole rig stays a sane weight (${triangles(garage)} triangles)`);

  // Every tire and stance combination, then a posed frame with suspension travel.
  for (let suspension = 0; suspension < 3; suspension++) {
    for (let tires = 0; tires < 3; tires++) {
      const rig = MTMTrucks.make(7, true, {tires, suspension});
      MTMTrucks.pose(rig, .31, 1.9, .12, [.02, -.02, .03, -.03]);
      assert(Math.abs(rig.body.position.y - (rig.bodyRestY - .12)) < 1e-9, 'the body follows suspension travel');
      assert(Math.abs(rig.wheels[1].rotation.y - .31) < 1e-9, 'the front wheels steer');
      assert(Math.abs(rig.wheels[2].rotation.y + .31 * .19) < 1e-9, 'the rear wheels counter-steer slightly');
      assert(Math.abs(rig.spins[1].rotation.x - 1.9) < 1e-9, 'the wheels spin');
    }
  }
  const soft = MTMTrucks.make(7, true, {suspension: 0});
  const firm = MTMTrucks.make(7, true, {suspension: 2});
  assert(soft.bodyRestY > firm.bodyRestY, 'the stance presets move the body, not the wheels');

  // The Canvas path needs its own sheets: nine fitment cells and three wheels.
  const sheet = MTMFitmentArt.front[7];
  assert(typeof sheet === 'string' && sheet.length > 1000, 'front fitment sheet exists');
  assert(typeof MTMFitmentArt.rear[7] === 'string' && MTMFitmentArt.rear[7].length > 1000, 'rear fitment sheet exists');
  assert.equal(MTMFitmentArt.wheels[7].length, 3, 'three wheel portraits');
  assert.equal(new Set(MTMFitmentArt.wheels[7]).size, 3, 'each portrait differs');
  assert(MTMFitmentArt.wheels[7].every(src => src.startsWith('data:image/webp')), 'portraits are self-contained');

  // Contact weight has an entry of its own instead of falling back to one.
  assert.equal(MTMContact.weights.length, MTMTrucks.roster.length, 'every truck has a contact weight of its own');
  assert(MTMContact.weights.every(w => w > 0 && w <= 1.1), 'weights stay in the fleet range');

  // A sideswipe runs through the solver the race itself calls: the Caddy is
  // pushed off the rival by its own weight entry and nothing goes non-finite.
  const fits = MTMTrucks.roster.map(() => ({tires: 0, suspension: 1, gearing: 1}));
  const game = MTMPhysics.create(MTMCourses[0], 7, {fits, transmission: 0, difficulty: 0});
  assert.equal(game.p.truck, 7, 'the Caddy can be the player');
  assert.equal(game.ai.map(a => a.truck).join(','), '0,1,2', 'the field wraps past the appended id');
  const rivalCar = game.ai[0];
  const right = [Math.cos(game.p.yaw), -Math.sin(game.p.yaw)];
  rivalCar.x = game.p.x + right[0] * 2.9;
  rivalCar.z = game.p.z + right[1] * 2.9;
  rivalCar.y = game.p.y;
  rivalCar.yaw = game.p.yaw;
  rivalCar.vx = rivalCar.vz = rivalCar.speed = 0;
  const gap = Math.hypot(game.p.x - rivalCar.x, game.p.z - rivalCar.z);
  MTMContact.vehicles(game, 1 / 60);
  assert(Math.hypot(game.p.x - rivalCar.x, game.p.z - rivalCar.z) > gap,
    'a sideswipe separates the Caddy and the rival');
  assert(Number.isFinite(game.p.x) && Number.isFinite(game.p.z) && Number.isFinite(game.p.vx), 'contact stays finite');

  // The lobby cover is wired to the appended index.
  const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
  assert.match(css, /#home\[data-truck="7"\] \.hero:before \{background-image:url\('cover-caddy\.webp'\);\}/, 'home cover rule');
  const cover = path.join(root, 'cover-caddy.webp');
  assert(fs.existsSync(cover), 'home cover asset ships');
  // A bad output must fail before the importer even tries to load its source.
  for (const flag of ['--cover', '--report']) {
    for (const output of [cover, path.join(root, '../dist/cover-caddy.webp')]) {
      const run = require('node:child_process').spawnSync(process.execPath,
        [path.join(root, '../tools/bake-caddy-model.cjs'), '--source', path.join(root, 'no-cad-here'), flag, output], {encoding: 'utf8'});
      assert.equal(run.status, 2, `${flag} cannot target ${output}`);
      assert.match(run.stderr, /shipped Caddy cover/);
    }
  }
  const image = await cn.loadImage(fs.readFileSync(cover));
  assert.equal(image.width, 1716, 'cover matches the other home images');

  console.log(`caddy: appended at id 7, ${MTMCaddyModel.triangles}-triangle baked body, ${triangles(garage)}-triangle rig, nine fitments, sideswipe, own cover and contact weight`);
})().catch(error => { console.error(error); process.exitCode = 1; });
