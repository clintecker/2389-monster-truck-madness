/* Drive the appended Caddy out of the real garage.

   docs/CONTENT.md asks for a new truck to be verified through the actual menus:
   all tire and stance combinations, a refit before restarting, and a tournament
   whose standings include its ID. This walks the shipped dist/index.html at a
   file URL with the WebAssembly rasteriser (no GPU, no network), picks the
   Caddy in the garage, fits two different setups, races each one, and writes a
   frame of the garage and of the race for each to CADDY_SHOTS (default
   /tmp/caddy-shots). */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('node:assert/strict');
const {JSDOM} = require('jsdom');
const cn = require('@napi-rs/canvas');

const shotsAt = process.env.CADDY_SHOTS || '/tmp/caddy-shots';
fs.mkdirSync(shotsAt, {recursive: true});
const dom = new JSDOM(fs.readFileSync(__dirname + '/../dist/index.html', 'utf8'),
  {url: 'file:///Monster-Truck-Madness.html', runScripts: 'outside-only', pretendToBeVisual: true});
const win = dom.window, doc = win.document, context = dom.getInternalVMContext();
const by = id => doc.getElementById(id), click = id => by(id).click();
const state = new Map(), canvases = new WeakMap(), contexts = new WeakMap();
const errors = [];
win.addEventListener('error', event => errors.push(String(event.error || event.message)));
state.set('mtm96-offroad-racing-1', JSON.stringify({truck: 6, fits: {6: {tires: 2, suspension: 2}}}));
Object.defineProperty(win, 'localStorage', {value: {getItem: k => state.get(k) || null, setItem: (k, v) => state.set(k, v)}});
let now = 0, queued = [];
win.requestAnimationFrame = f => (queued.push(f), queued.length);
win.matchMedia = () => ({matches: false});
win.navigator.getGamepads = () => [];
Object.defineProperty(win.performance, 'now', {value: () => now});
Object.defineProperty(win, 'innerWidth', {value: 1200});
Object.defineProperty(win.HTMLElement.prototype, 'clientWidth', {get() { return this.id === 'garageView' ? 700 : 1100; }});
Object.defineProperty(win.HTMLElement.prototype, 'clientHeight', {get() { return this.id === 'garageView' ? 280 : 620; }});
function backing(el) {
  let canvas = canvases.get(el);
  if (!canvas) { canvas = cn.createCanvas(el.width, el.height); canvases.set(el, canvas); }
  if (canvas.width !== el.width) canvas.width = el.width;
  if (canvas.height !== el.height) canvas.height = el.height;
  return canvas;
}
win.HTMLCanvasElement.prototype.getContext = function (type) {
  if (type !== '2d') return null;
  const el = this;
  if (!contexts.has(this)) contexts.set(this, new Proxy({}, {
    get(_, key) {
      const native = backing(el).getContext('2d'), value = native[key];
      if (typeof value !== 'function') return value;
      return (...args) => value.apply(native, args.map(a => a?.tagName === 'CANVAS' ? backing(a) : a?.native || a));
    },
    set(_, key, value) { backing(el).getContext('2d')[key] = value; return true; },
  }));
  return contexts.get(this);
};
vm.runInContext(fs.readFileSync(__dirname + '/../src/three.min.js', 'utf8'), context, {filename: 'three.min.js'});
vm.runInContext(require('./support/bundle.cjs').source(['kit', 'caddy-model', 'trucks', 'scenery', 'audio', 'fitment-sprites', 'course', 'celestial', 'finish', 'track', 'world', 'contact', 'physics', 'motion', 'props', 'soilart', 'oddities', 'midway-mesa', 'midway-loop', 'midway-strip', 'sponsor-art', 'neon-art', 'lcd-art', 'holo-art', 'project-fair', 'midway', 'salvage-art', 'parade-art', 'carnival', 'electric', 'crowd', 'software', 'view', 'app'])
  .replace('/*__WASM__*/', fs.readFileSync(__dirname + '/../src/raster.wasm').toString('base64')) +
  "\nglobalThis.MTMTrucks=MTMTrucks;globalThis.MTMPhysics=MTMPhysics;globalThis.MTMCourses=MTMCourses;",
  context, {filename: 'game-bundle.js'});

const tick = (n, dt = .016) => {
  for (let i = 0; i < n; i++) {
    now += dt * 1000;
    const run = queued;
    queued = [];
    run.forEach(f => f(now));
  }
};
const press = (type, code) => win.dispatchEvent(new win.KeyboardEvent(type, {code}));
const shoot = (selector, name) => {
  const canvas = doc.querySelector(selector), source = backing(canvas);
  const copy = cn.createCanvas(source.width, source.height);
  copy.getContext('2d').drawImage(source, 0, 0);
  const file = path.join(shotsAt, name + '.png');
  fs.writeFileSync(file, copy.toBuffer('image/png'));
  return file;
};
const choose = (id, value) => { const el = by(id); el.value = String(value); el.dispatchEvent(new win.Event('change', {bubbles: true})); };

function refit(tires, suspension) {
  click('garageButton');
  doc.querySelector('[data-rig="7"]').click();
  assert.equal(by('rigName').textContent, 'VW Caddy Mk1 Parts Runner');
  choose('set-tires', tires);
  choose('set-suspension', suspension);
  const frame = shoot('#garageView canvas', `garage-tires${tires}-suspension${suspension}`);
  click('garageDone');
  return frame;
}

async function verify() {
  // A saved truck 6 from before the append still resolves to Soloclaw.
  assert.equal(by('featuredName').textContent, 'SOLOCLAW');
  assert.equal(by('home').dataset.truck, '6');

  const shots = [];
  for (const [tires, suspension] of [[1, 0], [2, 2]]) {
    const garage = refit(tires, suspension);
    assert.equal(by('home').dataset.truck, '7');
    assert.match(by('homeWheel').getAttribute('src'), /^data:image\/webp/);
    assert.match(by('homeFitLabel').textContent, new RegExp(['All-terrain', 'Deep tread', 'Hardpack'][tires]));
    assert.equal(doc.querySelectorAll('#garageView canvas').length, 1);
    click('raceButton');
    tick(4);
    assert(by('modal').hidden, 'the race started');
    assert.match(by('hudMode').textContent, /VW CADDY MK1 PARTS RUNNER/);
    tick(6, .20);
    press('keydown', 'KeyW');
    tick(8, .20);
    tick(16, .05);
    const speed = Number(by('mphHud').textContent);
    assert(speed > 8, `the Caddy drives (${speed} km/h)`);
    press('keydown', 'KeyD');
    tick(12, .05);
    press('keyup', 'KeyD');
    const racing = shoot('#stage canvas', `race-tires${tires}-suspension${suspension}`);
    press('keyup', 'KeyW');
    tick(14, .1);
    const behind = shoot('#stage canvas', `rear-tires${tires}-suspension${suspension}`);
    press('keydown', 'KeyW');
    press('keydown', 'KeyS');
    tick(18, .05);
    const braking = Number(by('mphHud').textContent);
    press('keyup', 'KeyS');
    press('keyup', 'KeyW');
    assert(braking < speed, `the brakes slow it down (${speed} -> ${braking} km/h)`);
    click('pauseButton');
    click('leaveRace');
    shots.push(garage, racing, behind);
  }

  // A tournament started with the Caddy puts its ID in the field and standings.
  click('garageButton');
  doc.querySelector('[data-rig="7"]').click();
  click('garageDone');
  click('cupAfter');
  click('seriesButton');
  click('startSeries');
  tick(6, .1);
  assert.match(by('hudMode').textContent, /TOURNAMENT/);
  assert.equal(JSON.parse(state.get('mtm96-offroad-racing-1')).truck, 7);
  // The field wraps onto the appended ID: a series led by the Caddy seats three
  // rivals and comes back round to BIGFOOT, so every placement stays in range.
  const fits = win.MTMTrucks.roster.map(() => ({tires: 0, suspension: 1, gearing: 1}));
  const series = win.MTMPhysics.create(win.MTMCourses[0], 7, {fits, transmission: 0, difficulty: 0});
  assert.equal(series.p.truck, 7, 'the Caddy is the player');
  assert.equal(series.ai.map(a => a.truck).join(','), '0,1,2', 'the field wraps past the last truck');
  shots.push(shoot('#stage canvas', 'tournament-start'));
  click('pauseButton');
  click('leaveRace');

  assert.deepEqual(errors, [], 'no page errors while driving');
  console.log('caddy drive: garage → refit → race → brake → tournament start, screenshots in ' + shotsAt);
  console.log(shots.join('\n'));
  dom.window.close();
}
verify().catch(error => { console.error(error); console.error(errors); dom.window.close(); process.exitCode = 1; });
