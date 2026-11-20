/* The motor pool joke that belongs to Caddy #83 alone.

   The pool reserves Harlequin paint for four-door VWs and the Caddy pickup has
   two, so Dylan — who loves VWs — counts the hood and the tailgate as the
   missing pair. It runs as three beats in three existing surfaces: the rule in
   the garage, his count as the truck rolls onto the starting grid, and his
   sign-off on the results sheet. Selecting another rig must clear all three. */
const fs = require('fs'), vm = require('vm'), assert = require('assert/strict'), { JSDOM } = require('jsdom');
const root = require('node:path').join(__dirname, '../src');
const dom = new JSDOM(fs.readFileSync(root + '/interface.html', 'utf8'), { url: 'https://offline.invalid/', runScripts: 'outside-only', pretendToBeVisual: true });
const win = dom.window, doc = win.document, context = dom.getInternalVMContext(), by = id => doc.getElementById(id), click = id => by(id).click();

// The exact shipped beats. Changing this copy is meant to fail here.
const beats = {
  garage: 'Motor pool rule · Harlequin paint is only for four-door VWs.',
  grid: 'Dylan counts #83’s hood and tailgate as doors.',
  signoff: 'Dylan signed the paint order himself · four doors, strictly speaking.',
};

let queued = [], now = 0, game = null, pad = { connected: true, axes: [0], buttons: Array.from({ length: 16 }, () => ({ value: 0 })) };
win.requestAnimationFrame = fn => (queued.push(fn), queued.length);
Object.defineProperty(win.performance, 'now', { value: () => now });
win.navigator.getGamepads = () => [pad];
win.matchMedia = () => ({ matches: false });
win.HTMLCanvasElement.prototype.getContext = function () { return new Proxy({}, { get: () => () => {}, set: () => true }); };
win.MTMAudio = new Proxy({}, { get: () => () => {} });
win.MTMView = { raceStart: g => { game = g; }, render() {}, snap() {}, impact() {}, reduce() {}, resize() {}, exitGarage() {}, garageFrame() {}, showroom() {}, inspectWheel() {}, testSuspension() {}, cycle() { return 'Cockpit'; }, webgl: true, scale: 1, mode: 0 };
vm.runInContext(fs.readFileSync(root + '/three.min.js', 'utf8'), context, { filename: 'three.min' });
vm.runInContext(require('./support/bundle.cjs').source(['kit', 'course', 'finish', 'caddy-model', 'trucks', 'world', 'contact', 'physics', 'motion', 'fitment-sprites', 'app'], ['view', 'audio', 'midway', 'carnival', 'crowd']).replace('/*__WASM__*/', fs.readFileSync(root + '/raster.wasm').toString('base64')), context, { filename: 'game-bundle.js' });

function tick() { now += 1000 / 60; const q = queued; queued = []; q.forEach(fn => fn(now)); }
function next(n = 1) { for (let i = 0; i < n; i++) tick(); }
// The same autopilot test-flow.cjs drives: point the pad at the racing line.
function guide() { const { p, c } = game;
  pad.buttons[4].value = p.near.s > c.gates[p.gate].s + 18 && (!c.loop || p.gate > 0 || p.near.s < c.length * .85) ? 1 : 0;
  let along = p.near.s; if (c.loop && p.gate === 0 && along > c.length * .85) along -= c.length;
  const q = c.at(along + Math.min(13, 5 + p.speed * .36), c.id === 'indiana' ? 5 : -.7), wrap = v => Math.atan2(Math.sin(v), Math.cos(v)), err = wrap(Math.atan2(q.x - p.x, q.z - p.z) - p.yaw), a = c.at(along + 6), b = c.at(along + 26), k = Math.abs(wrap(Math.atan2(a.dx, a.dz) - Math.atan2(b.dx, b.dz))) / 20, vm_ = Math.min(c.loop ? 25 : 34, Math.sqrt(11 / Math.max(.001, k))), st = Math.max(-1, Math.min(1, err * 2.6));
  pad.axes[0] = st ? -(.12 + .88 * Math.abs(st)) * Math.sign(st) : 0;
  pad.buttons[7].value = p.speed < vm_ ? 1 : 0; pad.buttons[6].value = p.speed > vm_ + 1 ? 1 : 0; }
function raceToFinish(label) {
  let i = 0; for (; i < 60 * 900 && !game.complete; i++) { guide(); tick(); }
  assert(game.complete, label + ' should finish');
  next(80); assert(!by('finishResults').hidden, label + ' offers the results sheet');
  click('finishResults');
}
const poolNotes = () => [...doc.querySelectorAll('#dialogBody .pool-note')];

(async () => {
  // Only one rig in the fleet carries the copy, and it is the appended Caddy.
  const roster = vm.runInContext('MTMTrucks.roster.map(r => ({name: r.name, number: r.number, pool: r.motorPool || null}))', context);
  const caddy = roster.at(-1);
  assert.equal(caddy.name, 'VW Caddy Mk1 Parts Runner');
  assert.equal(caddy.number, '83');
  assert.equal(caddy.pool.garage, beats.garage, 'garage rule is the shipped sentence');
  assert.equal(caddy.pool.grid, beats.grid, 'grid count is the shipped sentence');
  assert.equal(caddy.pool.signoff, beats.signoff, 'results sign-off is the shipped sentence');
  assert.deepEqual(Object.keys(caddy.pool).sort(), Object.keys(beats).sort(), 'no fourth beat hides in the entry');
  assert.equal(roster.filter(r => r.pool).length, 1, 'no other rig carries a motor pool note');
  roster.slice(0, -1).forEach(r => assert.equal(r.pool, null, r.name + ' stays out of the joke'));

  // A rig without the note races and finishes exactly as before: no grid call,
  // no note under its score table.
  click('raceButton'); next(3);
  assert.equal(by('raceMessage').textContent, '', 'BIGFOOT gets no grid call');
  raceToFinish('BIGFOOT race');
  assert.equal(poolNotes().length, 0, 'a non-Caddy results sheet carries no note');
  assert.equal(doc.querySelectorAll('.scoretable tbody tr').length, 4, 'the results table is unchanged');
  click('toEvents'); next(2);
  assert.equal(by('home').hidden, false, 'back at the events list');

  // The garage rule follows the selection: Caddy shows it, the next rig clears it.
  click('garageButton');
  assert.equal(by('rigName').textContent, 'BIGFOOT');
  assert.equal(by('poolNote').hidden, true, 'no note for BIGFOOT');
  doc.querySelector('[data-rig="7"]').click();
  assert.equal(by('rigName').textContent, 'VW Caddy Mk1 Parts Runner');
  assert.equal(by('poolNote').hidden, false, 'the Caddy shows the motor pool rule');
  assert.equal(by('poolNote').textContent, beats.garage);
  doc.querySelector('[data-rig="0"]').click();
  assert.equal(by('poolNote').hidden, true, 'the rule clears when another rig is selected');
  assert.equal(by('poolNote').textContent, '', 'the cleared line holds no stale copy');
  doc.querySelector('[data-rig="7"]').click();
  assert.equal(by('poolNote').textContent, beats.garage, 'the rule returns with the Caddy');
  click('garageDone');
  assert.equal(by('modal').hidden, true, 'the garage closes again');

  // The count is called once as the Caddy rolls onto the grid.
  click('raceButton'); next(3);
  assert.equal(by('raceMessage').textContent, beats.grid, 'the grid call names #83');
  assert(by('raceMessage').classList.contains('on'), 'the grid call is visible');
  // One call per race: once the lights are green the line is gone and it never
  // comes back, so a full race is not a stream of the same joke.
  next(320);
  assert(!(by('raceMessage').classList.contains('on') && by('raceMessage').textContent === beats.grid), 'the grid call is no longer visible under way');
  raceToFinish('Caddy race');
  assert.notEqual(by('raceMessage').textContent, beats.grid, 'the grid call never returns');
  assert.match(by('dialogTitle').textContent, /First place!|Race complete/);
  const notes = poolNotes();
  assert.equal(notes.length, 1, 'the Caddy results sheet carries one sign-off');
  assert.equal(notes[0].textContent, beats.signoff);
  assert.equal(doc.querySelectorAll('.scoretable tbody tr').length, 4, 'the Caddy results table is unchanged');

  console.log('caddy joke: garage rule, grid count and results sign-off are Caddy #83 only; other rigs stay clean');
  dom.window.close();
})().catch(error => { console.error(error); process.exitCode = 1; });
