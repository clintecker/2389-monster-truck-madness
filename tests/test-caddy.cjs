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
  const image = await cn.loadImage(fs.readFileSync(cover));
  assert.equal(image.width, 1716, 'cover matches the other home images');

  console.log(`caddy: appended at id 7, ${MTMCaddyModel.triangles}-triangle baked body, ${triangles(garage)}-triangle rig, nine fitments, sideswipe, own cover and contact weight`);
})().catch(error => { console.error(error); process.exitCode = 1; });
