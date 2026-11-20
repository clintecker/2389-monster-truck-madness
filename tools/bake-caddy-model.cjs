/* Bake the approved VW Caddy Mk1 body into src/caddy-model.js.

   The approved asset is the v6 orbit-viewer export: a 235 346-vertex shell in four
   material groups plus the finish hardware (brush guard, six HELLA lamps, roof
   bar, chassis brackets). That is a CAD tessellation -- 251 678 shell triangles as
   exported, 247 979 of them left after welding and dropping degenerate faces, and
   3 564 more in the hardware -- which is neither shippable nor renderable on the
   game's WebAssembly/Canvas fallback. This tool reduces it to game-native geometry:

   - quadric-error edge collapse, with the CAD's creases, open borders and livery
     colour seams carried as extra quadric weight so shut lines, window seals,
     wheel-arch rims and the four harlequin panels keep their place;
   - one mesh per material group, because the software rasteriser skips any mesh
     whose material is an array;
   - positions as float32, colours as 8-bit sRGB (the loader linearises them, so
     dark seals keep their precision), indices as uint16, and no stored normals:
     the loader derives them per smoothing group, which is also what keeps the
     creases hard;
   - a one-sided distance from every source vertex to the reduced surface, printed
     per material group as the import's own fidelity evidence.

   Usage: node tools/bake-caddy-model.cjs --source <v6 site directory>
            [--report <json>] [--cover <webp>]
   The source directory is the reviewed viewer bundle; it is deliberately not kept
   in the repository, so this tool is a one-way importer rather than a build step.
   Re-running it on the same source reproduces src/caddy-model.js byte for byte. */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../src');
const OUTPUT = path.join(root, 'caddy-model.js');

/* Triangle budget per material group. A rig's whole cost is what matters -- the
   fleet's heaviest is 24 280 triangles with a 4 000-triangle body -- so the
   painted shell here is capped just above where the reduction runs out of legal
   collapses, and the thin dark groups are allowed to fold because their strips
   are a millimetre wide and read as shadow at any play distance. The split
   follows what a viewer resolves: the painted skin carries the shape, the seals
   and lining carry the depth cues, the lamps carry the joke.

   The glazing is the exception: it is a set of curved panes and quarterlights,
   and reduced ten to one it tears into loose sheets with an 86 mm p99 deviation
   from the approved surface -- holes in the windscreen and the vent windows at
   any chase distance. Kept closer to whole (2599 triangles, p99 under a
   millimetre) it costs 2 239 triangles and 16 KB gzipped, and no frame time
   worth measuring. */
const BUDGET = {paint: 15000, glass: 2600, trim: 6000, lining: 1600, hardware: 1800};

/* Faces thinner than this are below the resolution of any game camera. */
const MIN_AREA = 4e-8;

/* A crease is two faces more than 51 degrees apart; a livery seam is a colour
   step between neighbouring faces. Both get extra quadric weight so the
   reduction spends its budget on smooth sheet metal instead. */
const SHARP_DOT = 0.63;
const COLOUR_STEP = 6 / 255;
const BORDER_WEIGHT = 40;
const CREASE_WEIGHT = 12;
/* Shading splits where face normals differ by more than 40 degrees. */
const SMOOTH_DOT = 0.766;

/* The painted skin keeps its surface guards: the link condition and the fold
   test. The dark detail groups are thin slivers that cannot be reduced while
   those hold, and folding a 1 mm seal is invisible, so they run without them. */
const GUARDED = {paint: true, glass: true, lining: true, hardware: true, trim: false};

/* Where each source group renders in the fleet. These are the shared materials
   that already exist in src/trucks.js, and the lamp covers join the unlit lens
   batch so the smiley faces stay crisp through the software renderer. */
const FINISH_HARDWARE = ['slim brush guard', 'HELLA driving lamps', 'roof lamp bar', 'chassis brackets'];

const MATERIAL_OF = {
  paint: 'paint', glass: 'glass', trim: 'metal', shell: 'paint',
  'slim brush guard': 'metal', roof_lamp_bar: 'metal', chassis_brackets: 'metal',
  housing: 'metal', bezel: 'metal', mount: 'metal', cover: 'lit', face: 'lit',
};

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const toSrgb = x => x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
const toLinear = c => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

function readFloats(file) {
  const bytes = fs.readFileSync(file);
  const out = new Float32Array(bytes.length >>> 2);
  new Uint8Array(out.buffer).set(bytes);
  return out;
}
function readUints(file) {
  const bytes = fs.readFileSync(file);
  const out = new Uint32Array(bytes.length >>> 2);
  new Uint8Array(out.buffer).set(bytes);
  return out;
}

/* -------------------------------------------------------------------- input */

/* Every material group of the scene as its own import unit. A group without a
   colour buffer takes its flat material colour instead. */
function sceneParts(source) {
  const scene = JSON.parse(fs.readFileSync(path.join(source, 'model/scene.json'), 'utf8'));
  const parts = [];
  for (const mesh of scene.meshes) {
    const positions = readFloats(path.join(source, 'model', mesh.position));
    const colours = mesh.color ? readFloats(path.join(source, 'model', mesh.color)) : null;
    const index = readUints(path.join(source, 'model', typeof mesh.index === 'string' ? mesh.index : mesh.index.src));
    const groups = mesh.groups || [{name: mesh.name.replace(/[^a-z0-9]+/gi, '_'), start: 0, count: index.length, material: mesh.material}];
    for (const group of groups) {
      parts.push({
        mesh: mesh.name,
        name: group.name,
        positions,
        colours,
        indices: index,
        start: group.start,
        count: group.count,
        material: group.material,
      });
    }
  }
  return parts;
}

function flatColours(part) {
  if (part.colours) return part;
  const hex = (part.material?.color || '#ffffff').replace('#', '');
  const value = parseInt(hex, 16);
  const rgb = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map(v => toLinear(v / 255));
  const colours = new Float32Array(part.positions.length);
  for (let i = 0; i < colours.length; i++) colours[i] = rgb[i % 3];
  return {...part, colours};
}

/* One triangle soup becomes an indexed mesh. Vertices weld by position at
   0.1 mm -- the resolution the CAD export keeps its own seams at -- while every
   corner keeps its own colour, so a livery boundary survives as a boundary. */
function buildMesh(part) {
  const {positions, colours, indices, start, count} = part;
  const lookup = new Map();
  const px = [], py = [], pz = [];
  const tri = [], corner = [];
  let dropped = 0;
  const vertex = i => {
    const x = positions[i * 3], y = positions[i * 3 + 1], z = positions[i * 3 + 2];
    const key = ((Math.round(x * 1e4) + 30000) * 60001 + (Math.round(y * 1e4) + 30000)) * 60001 + (Math.round(z * 1e4) + 30000);
    let v = lookup.get(key);
    if (v === undefined) {
      v = px.length;
      lookup.set(key, v);
      px.push(x); py.push(y); pz.push(z);
    }
    return v;
  };
  for (let k = start; k < start + count; k += 3) {
    const a = vertex(indices[k]), b = vertex(indices[k + 1]), c = vertex(indices[k + 2]);
    if (a === b || b === c || a === c) { dropped++; continue; }
    if (!(faceArea(px, py, pz, a, b, c) > MIN_AREA)) { dropped++; continue; }
    tri.push(a, b, c);
    for (let j = 0; j < 3; j++) {
      const i = indices[k + j];
      corner.push(colours[i * 3], colours[i * 3 + 1], colours[i * 3 + 2]);
    }
  }
  /* The export keeps some of its surfaces twice. Welded, those become duplicate
     faces, and a duplicate face makes every collapse around it illegal, so they
     are dropped here rather than left to freeze the reduction. */
  const triples = new Set(), keep = [];
  let coincident = 0;
  for (let t = 0; t < tri.length; t += 3) {
    const sorted = [tri[t], tri[t + 1], tri[t + 2]].sort((a, b) => a - b);
    const key = (sorted[0] * 262144 + sorted[1]) * 262144 + sorted[2];
    if (triples.has(key)) { coincident++; continue; }
    triples.add(key);
    keep.push(t);
  }
  const triangles = [], corners = [];
  for (const t of keep) {
    triangles.push(tri[t], tri[t + 1], tri[t + 2]);
    /* `t` counts indices, so the triangle it belongs to owns corners
       t * 3 .. t * 3 + 8. Reading from t * 9 instead walks into the following
       triangles and off the end of the array, which hands most corners another
       face's livery colour and the last third of the mesh nothing at all. */
    for (let j = 0; j < 9; j++) corners.push(corner[t * 3 + j]);
  }
  const split = splitBowties(px, py, pz, triangles, corners);
  return {
    px: split.px, py: split.py, pz: split.pz,
    tri: Int32Array.from(split.tri),
    corner: Float64Array.from(split.corner),
    dropped,
    coincident,
    bowties: split.split,
  };
}


/* A patch that merely touches another one shares a vertex with it, and that
   pinched vertex (a bowtie) makes every collapse around it illegal or, worse,
   lets a collapse pull one sheet through the other. Each fan around such a
   vertex becomes its own vertex at the same position, so the surface is a
   manifold before the reduction starts and stays one. */
function splitBowties(px, py, pz, triangles, corners) {
  const ox = px.slice(), oy = py.slice(), oz = pz.slice();
  const nextPx = px.slice(), nextPy = py.slice(), nextPz = pz.slice();
  const tri = triangles.slice(), corner = corners.slice();
  const count = tri.length / 3;
  const incident = new Map();
  for (let t = 0; t < count; t++) {
    for (let j = 0; j < 3; j++) {
      const v = tri[t * 3 + j];
      let list = incident.get(v);
      if (!list) { list = []; incident.set(v, list); }
      list.push(t);
    }
  }
  let split = 0;
  for (const [v, faces] of incident) {
    if (faces.length < 3) continue;
    const parent = new Map();
    for (const t of faces) parent.set(t, t);
    const find = a => { while (parent.get(a) !== a) { parent.set(a, parent.get(parent.get(a))); a = parent.get(a); } return a; };
    for (let i = 0; i < faces.length; i++) {
      for (let k = i + 1; k < faces.length; k++) {
        // Two faces belong to the same fan when they share an edge at v.
        const a = faces[i], b = faces[k];
        let shared = 0;
        for (let p = 0; p < 3; p++) {
          const va = tri[a * 3 + p];
          if (va === v) continue;
          if (tri[b * 3] === va || tri[b * 3 + 1] === va || tri[b * 3 + 2] === va) shared++;
        }
        // They share exactly one vertex besides v: the far end of their edge.
        if (shared === 1) {
          const ra = find(a), rb = find(b);
          if (ra !== rb) parent.set(ra, rb);
        }
      }
    }
    const fans = new Map();
    for (const t of faces) {
      const root = find(t);
      if (!fans.has(root)) fans.set(root, []);
      fans.get(root).push(t);
    }
    if (fans.size < 2) continue;
    let first = true;
    for (const fan of fans.values()) {
      if (first) { first = false; continue; }
      const copy = nextPx.length;
      nextPx.push(ox[v]); nextPy.push(oy[v]); nextPz.push(oz[v]);
      split++;
      for (const t of fan) {
        for (let j = 0; j < 3; j++) if (tri[t * 3 + j] === v) tri[t * 3 + j] = copy;
      }
    }
  }
  return {px: nextPx, py: nextPy, pz: nextPz, tri, corner, split};
}

function faceArea(px, py, pz, a, b, c) {
  const ux = px[b] - px[a], uy = py[b] - py[a], uz = pz[b] - pz[a];
  const vx = px[c] - px[a], vy = py[c] - py[a], vz = pz[c] - pz[a];
  return 0.5 * Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx);
}

/* ----------------------------------------------------------------- quadrics */

/* A plane quadric is the ten independent coefficients of the symmetric 4x4
   matrix (n n^T, n d, d d), so a vertex error is one dot product. */
function addPlane(q, at, nx, ny, nz, d, w) {
  q[at] += w * nx * nx; q[at + 1] += w * nx * ny; q[at + 2] += w * nx * nz; q[at + 3] += w * nx * d;
  q[at + 4] += w * ny * ny; q[at + 5] += w * ny * nz; q[at + 6] += w * ny * d;
  q[at + 7] += w * nz * nz; q[at + 8] += w * nz * d;
  q[at + 9] += w * d * d;
}
function quadricError(q, at, x, y, z) {
  return q[at] * x * x + 2 * q[at + 1] * x * y + 2 * q[at + 2] * x * z + 2 * q[at + 3] * x +
    q[at + 4] * y * y + 2 * q[at + 5] * y * z + 2 * q[at + 6] * y +
    q[at + 7] * z * z + 2 * q[at + 8] * z + q[at + 9];
}
/* The minimising position of a quadric; null when the system is degenerate,
   which is the common case for a flat or ruled patch. */
function quadricOptimum(q, at) {
  const a = q[at], b = q[at + 1], c = q[at + 2], d = q[at + 4], e = q[at + 5], f = q[at + 7];
  const g = q[at + 3], h = q[at + 6], i = q[at + 8];
  const det = a * (d * f - e * e) - b * (b * f - e * c) + c * (b * e - d * c);
  if (!(Math.abs(det) > 1e-12)) return null;
  const inv = 1 / det;
  return [
    -(inv * ((d * f - e * e) * g + (e * c - b * f) * h + (b * e - d * c) * i)),
    -(inv * ((e * c - b * f) * g + (a * f - c * c) * h + (c * b - a * e) * i)),
    -(inv * ((b * e - d * c) * g + (c * b - a * e) * h + (a * d - b * b) * i)),
  ];
}

/* ---------------------------------------------------------------- reduction */

/* Reduce a welded mesh to `target` triangles. Standard quadric-error collapse
   with three guards that matter for a sewn CAD body: the link condition (a
   collapse may not pinch the surface), a fold test (no triangle may reverse) and
   a displacement bound so a collapse can never jump a panel. */
function simplify(mesh, target, guarded) {
  const n = mesh.px.length, m = mesh.tri.length / 3;
  const P = new Float64Array(n * 3);
  for (let i = 0; i < n; i++) { P[i * 3] = mesh.px[i]; P[i * 3 + 1] = mesh.py[i]; P[i * 3 + 2] = mesh.pz[i]; }
  const T = Int32Array.from(mesh.tri);
  const alive = new Uint8Array(m).fill(1);
  const live = new Uint8Array(n).fill(1);
  const Q = new Float64Array(n * 10);
  const vTri = Array.from({length: n}, () => []);
  let tris = m;

  const normal = new Float64Array(m * 3), area = new Float64Array(m);
  function measure(t) {
    const a = T[t * 3], b = T[t * 3 + 1], c = T[t * 3 + 2];
    const ux = P[b * 3] - P[a * 3], uy = P[b * 3 + 1] - P[a * 3 + 1], uz = P[b * 3 + 2] - P[a * 3 + 2];
    const vx = P[c * 3] - P[a * 3], vy = P[c * 3 + 1] - P[a * 3 + 1], vz = P[c * 3 + 2] - P[a * 3 + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz);
    area[t] = 0.5 * len;
    if (len > 1e-30) { normal[t * 3] = nx / len; normal[t * 3 + 1] = ny / len; normal[t * 3 + 2] = nz / len; }
  }

  const edgeKey = (a, b) => a < b ? a * n + b : b * n + a;
  const edgeCount = new Map(), edgeFirst = new Map();
  const faceColour = new Float64Array(m * 3);

  for (let t = 0; t < m; t++) {
    measure(t);
    for (let j = 0; j < 3; j++) {
      vTri[T[t * 3 + j]].push(t);
      faceColour[t * 3 + j] = (mesh.corner[t * 9 + j] + mesh.corner[t * 9 + 3 + j] + mesh.corner[t * 9 + 6 + j]) / 3;
    }
    const w = area[t];
    if (w > 0) {
      const nx = normal[t * 3], ny = normal[t * 3 + 1], nz = normal[t * 3 + 2], a = T[t * 3];
      const d = -(nx * P[a * 3] + ny * P[a * 3 + 1] + nz * P[a * 3 + 2]);
      for (let j = 0; j < 3; j++) addPlane(Q, T[t * 3 + j] * 10, nx, ny, nz, d, w);
    }
    for (let j = 0; j < 3; j++) {
      const key = edgeKey(T[t * 3 + j], T[t * 3 + (j + 1) % 3]);
      edgeCount.set(key, (edgeCount.get(key) || 0) + 1);
      if (!edgeFirst.has(key)) edgeFirst.set(key, t);
    }
  }

  /* Creases, livery seams and open borders keep their geometry. A crease adds
     both of its planes to each endpoint; a border adds the plane that contains
     the border edge and stands on its face, so a border vertex may slide along
     the border but not away from it. */
  const borderWeight = BORDER_WEIGHT, creaseWeight = CREASE_WEIGHT;
  for (const [key, count] of edgeCount) {
    const u = Math.floor(key / n), v = key - u * n;
    const ex = P[v * 3] - P[u * 3], ey = P[v * 3 + 1] - P[u * 3 + 1], ez = P[v * 3 + 2] - P[u * 3 + 2];
    const span2 = ex * ex + ey * ey + ez * ez;
    const first = edgeFirst.get(key);
    if (count === 1) {
      const nx = normal[first * 3], ny = normal[first * 3 + 1], nz = normal[first * 3 + 2];
      let bx = ey * nz - ez * ny, by = ez * nx - ex * nz, bz = ex * ny - ey * nx;
      const len = Math.hypot(bx, by, bz);
      if (!(len > 1e-12)) continue;
      bx /= len; by /= len; bz /= len;
      const d = -(bx * P[u * 3] + by * P[u * 3 + 1] + bz * P[u * 3 + 2]);
      addPlane(Q, u * 10, bx, by, bz, d, borderWeight * span2);
      addPlane(Q, v * 10, bx, by, bz, d, borderWeight * span2);
      continue;
    }
    if (count !== 2) continue;
    let other = -1;
    for (const t of vTri[u]) {
      if (t === first) continue;
      if (T[t * 3] === v || T[t * 3 + 1] === v || T[t * 3 + 2] === v) { other = t; break; }
    }
    if (other < 0) continue;
    const dot = normal[first * 3] * normal[other * 3] + normal[first * 3 + 1] * normal[other * 3 + 1] + normal[first * 3 + 2] * normal[other * 3 + 2];
    const step = toSrgb(Math.max(
      Math.abs(faceColour[first * 3] - faceColour[other * 3]),
      Math.abs(faceColour[first * 3 + 1] - faceColour[other * 3 + 1]),
      Math.abs(faceColour[first * 3 + 2] - faceColour[other * 3 + 2])));
    if (dot >= SHARP_DOT && step <= COLOUR_STEP) continue;
    const w = creaseWeight * span2;
    for (const t of [first, other]) {
      const nx = normal[t * 3], ny = normal[t * 3 + 1], nz = normal[t * 3 + 2];
      const d = -(nx * P[u * 3] + ny * P[u * 3 + 1] + nz * P[u * 3 + 2]);
      addPlane(Q, u * 10, nx, ny, nz, d, w);
      addPlane(Q, v * 10, nx, ny, nz, d, w);
    }
  }

  const heap = [];
  const heapPush = entry => {
    heap.push(entry);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p].error <= heap[i].error) break;
      const swap = heap[p]; heap[p] = heap[i]; heap[i] = swap;
      i = p;
    }
  };
  const heapPop = () => {
    const top = heap[0], last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1, r = l + 1;
        let s = i;
        if (l < heap.length && heap[l].error < heap[s].error) s = l;
        if (r < heap.length && heap[r].error < heap[s].error) s = r;
        if (s === i) break;
        const swap = heap[s]; heap[s] = heap[i]; heap[i] = swap;
        i = s;
      }
    }
    return top;
  };

  const ring = [];
  const neighbours = u => {
    ring.length = 0;
    for (const t of vTri[u]) {
      if (!alive[t]) continue;
      for (let j = 0; j < 3; j++) {
        const w = T[t * 3 + j];
        if (w !== u && !ring.includes(w)) ring.push(w);
      }
    }
    return ring;
  };

  const pooled = new Float64Array(10);
  function score(u, v) {
    for (let k = 0; k < 10; k++) pooled[k] = Q[u * 10 + k] + Q[v * 10 + k];
    const mx = (P[u * 3] + P[v * 3]) / 2, my = (P[u * 3 + 1] + P[v * 3 + 1]) / 2, mz = (P[u * 3 + 2] + P[v * 3 + 2]) / 2;
    const span = Math.hypot(P[v * 3] - P[u * 3], P[v * 3 + 1] - P[u * 3 + 1], P[v * 3 + 2] - P[u * 3 + 2]);
    const reach = Math.max(span * 1.5, 0.002);
    const candidates = [
      quadricOptimum(pooled, 0),
      [mx, my, mz],
      [P[u * 3], P[u * 3 + 1], P[u * 3 + 2]],
      [P[v * 3], P[v * 3 + 1], P[v * 3 + 2]],
    ];
    let best = null, bestError = Infinity;
    for (const p of candidates) {
      if (!p) continue;
      // A collapse may not travel further than the edge it removes, so a
      // mis-solved quadric can never fold a panel through itself.
      if (Math.hypot(p[0] - mx, p[1] - my, p[2] - mz) > reach) continue;
      const e = quadricError(pooled, 0, p[0], p[1], p[2]);
      if (e < bestError) { bestError = e; best = p; }
    }
    if (!best) return null;
    return {u, v, error: bestError, position: best};
  }

  const seen = [];
  for (let v = 0; v < n; v++) {
    if (!vTri[v].length) continue;
    for (const w of neighbours(v)) {
      if (w <= v) continue;
      const s = score(v, w);
      if (s) heapPush(s);
    }
  }

  const affected = [];
  const hasVertex = (t, x) => T[t * 3] === x || T[t * 3 + 1] === x || T[t * 3 + 2] === x;
  const isNeighbour = (a, b, skip) => {
    for (const t of vTri[a]) {
      if (!alive[t] || t === skip) continue;
      if (hasVertex(t, b)) return true;
    }
    return false;
  };

  /* A collapse is legal when it cannot pinch or fold the surface. The two faces
     that own the edge are removed; one owner means an open border, which the
     reduction shortens along itself rather than crossing. The link condition
     stops a collapse from welding two parts of the surface that only met at that
     edge, and the fold test stops any face from reversing. */
  function legal(u, v, position) {
    let first = -1, second = -1, owners = 0;
    for (const t of vTri[u]) {
      if (!alive[t] || !hasVertex(t, v)) continue;
      if (owners === 0) first = t;
      else if (owners === 1) second = t;
      owners++;
    }
    if (owners === 0 || owners > 2) return false;
    let o0 = -1, o1 = -1;
    for (const t of owners === 2 ? [first, second] : [first]) {
      for (let j = 0; j < 3; j++) {
        const x = T[t * 3 + j];
        if (x === u || x === v) continue;
        if (o0 < 0) o0 = x;
        else if (x !== o0) { if (o1 < 0) o1 = x; else return false; }
      }
    }
    if (owners === 2 && (o0 < 0 || o1 < 0)) return false;
    for (const t of vTri[u]) {
      if (!alive[t]) continue;
      for (let j = 0; j < 3; j++) {
        const w = T[t * 3 + j];
        if (w === u || w === v || w === o0 || w === o1) continue;
        if (guarded && isNeighbour(v, w, -1)) return false;
      }
    }
    affected.length = 0;
    for (const t of vTri[u]) if (alive[t] && !hasVertex(t, v)) affected.push(t);
    for (const t of vTri[v]) if (alive[t] && !hasVertex(t, u)) affected.push(t);
    for (const t of affected) {
      const ax = T[t * 3] === u || T[t * 3] === v ? position[0] : P[T[t * 3] * 3];
      const ay = T[t * 3] === u || T[t * 3] === v ? position[1] : P[T[t * 3] * 3 + 1];
      const az = T[t * 3] === u || T[t * 3] === v ? position[2] : P[T[t * 3] * 3 + 2];
      const bx = T[t * 3 + 1] === u || T[t * 3 + 1] === v ? position[0] : P[T[t * 3 + 1] * 3];
      const by = T[t * 3 + 1] === u || T[t * 3 + 1] === v ? position[1] : P[T[t * 3 + 1] * 3 + 1];
      const bz = T[t * 3 + 1] === u || T[t * 3 + 1] === v ? position[2] : P[T[t * 3 + 1] * 3 + 2];
      const cx = T[t * 3 + 2] === u || T[t * 3 + 2] === v ? position[0] : P[T[t * 3 + 2] * 3];
      const cy = T[t * 3 + 2] === u || T[t * 3 + 2] === v ? position[1] : P[T[t * 3 + 2] * 3 + 1];
      const cz = T[t * 3 + 2] === u || T[t * 3 + 2] === v ? position[2] : P[T[t * 3 + 2] * 3 + 2];
      const ux = bx - ax, uy = by - ay, uz = bz - az, vx = cx - ax, vy = cy - ay, vz = cz - az;
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const len = Math.hypot(nx, ny, nz);
      if (!(len * 0.5 > MIN_AREA)) return false;
      if (guarded && (nx * normal[t * 3] + ny * normal[t * 3 + 1] + nz * normal[t * 3 + 2]) / len < 0.05) return false;
    }
    return true;
  }

  function collapse(u, v, position) {
    P[v * 3] = position[0]; P[v * 3 + 1] = position[1]; P[v * 3 + 2] = position[2];
    for (let k = 0; k < 10; k++) Q[v * 10 + k] += Q[u * 10 + k];
    const merged = [];
    for (const t of vTri[u]) {
      if (!alive[t]) continue;
      let a = T[t * 3], b = T[t * 3 + 1], c = T[t * 3 + 2];
      if (a === u) a = v; else if (b === u) b = v; else if (c === u) c = v;
      if (a === b || b === c || a === c) { alive[t] = 0; tris--; continue; }
      T[t * 3] = a; T[t * 3 + 1] = b; T[t * 3 + 2] = c;
      merged.push(t);
    }
    for (const t of vTri[v]) if (alive[t]) merged.push(t);
    vTri[v] = merged;
    vTri[u] = [];
    live[u] = 0;
    for (const t of merged) measure(t);
  }

  /* A collapse changes the error of every edge in its two-ring, so those are
     re-scored while the heap still has budget to spend; when it runs dry a full
     sweep of the surviving edges restarts the queue rather than stopping early. */
  const rescore = v => {
    for (const w of neighbours(v).slice()) {
      const s = score(v, w);
      if (s) heapPush(s);
    }
  };
  let guard = 0, sweeps = 0;
  while (tris > target && guard++ < m * 20) {
    if (!heap.length) {
      if (++sweeps > 12) break;
      for (let v = 0; v < n; v++) {
        if (!live[v]) continue;
        for (const w of neighbours(v).slice()) {
          if (w <= v) continue;
          const s = score(v, w);
          if (s) heapPush(s);
        }
      }
      if (!heap.length) break;
      continue;
    }
    const entry = heapPop();
    const {u, v, position} = entry;
    if (!live[u] || !live[v]) continue;
    if (!legal(u, v, position)) continue;
    collapse(u, v, position);
    rescore(v);
  }

  const outTri = [], outCorner = [];
  for (let t = 0; t < m; t++) {
    if (!alive[t]) continue;
    outTri.push(T[t * 3], T[t * 3 + 1], T[t * 3 + 2]);
    for (let j = 0; j < 9; j++) outCorner.push(mesh.corner[t * 9 + j]);
  }
  return {position: P, tri: Int32Array.from(outTri), corner: Float64Array.from(outCorner)};
}

/* ------------------------------------------------------------------ emission */

/* Split corners into shaded vertices. A vertex is shared by every face of its
   position and colour that meets it within 40 degrees, so smooth curvature reads
   smooth while a crease or a livery edge stays hard. Normals are not stored; the
   loader recomputes them from exactly these groups. */
function emit(reduced) {
  const tri = reduced.tri, position = reduced.position;
  const clusters = new Map();
  const px = [], py = [], pz = [], nx = [], ny = [], nz = [], palette = [];
  const paletteIds = new Map();
  const colourOf = [] , colourSeen = new Map();
  const paletteIndex = (triangle, cornerIndex) => {
    const base = (triangle / 3) * 9 + cornerIndex * 3;
    const bytes = [
      clamp(Math.round(toSrgb(clamp(reduced.corner[base], 0, 1)) * 255), 0, 255),
      clamp(Math.round(toSrgb(clamp(reduced.corner[base + 1], 0, 1)) * 255), 0, 255),
      clamp(Math.round(toSrgb(clamp(reduced.corner[base + 2], 0, 1)) * 255), 0, 255),
    ];
    const key = (bytes[0] << 16) | (bytes[1] << 8) | bytes[2];
    let id = colourSeen.get(key);
    if (id === undefined) { id = colourOf.length; colourSeen.set(key, id); colourOf.push(bytes); }
    return id;
  };
  const index = new Int32Array(tri.length);
  for (let t = 0; t < tri.length; t += 3) {
    const a = tri[t], b = tri[t + 1], c = tri[t + 2];
    const ax = position[a * 3], ay = position[a * 3 + 1], az = position[a * 3 + 2];
    const bx = position[b * 3], by = position[b * 3 + 1], bz = position[b * 3 + 2];
    const cx = position[c * 3], cy = position[c * 3 + 1], cz = position[c * 3 + 2];
    const ux = bx - ax, uy = by - ay, uz = bz - az, vx = cx - ax, vy = cy - ay, vz = cz - az;
    let fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx;
    const len = Math.hypot(fx, fy, fz);
    if (!(len > 1e-30)) continue;   // measured away by MIN_AREA; never emitted
    fx /= len; fy /= len; fz /= len;
    for (let j = 0; j < 3; j++) {
      const weld = tri[t + j];
      const colour = paletteIndex(t, j);
      const key = weld * 4096 + colour;
      let list = clusters.get(key);
      if (!list) { list = []; clusters.set(key, list); }
      let slot = -1;
      for (const id of list) {
        if (nx[id] * fx + ny[id] * fy + nz[id] * fz > SMOOTH_DOT) { slot = id; break; }
      }
      if (slot < 0) {
        slot = px.length;
        px.push(position[weld * 3]); py.push(position[weld * 3 + 1]); pz.push(position[weld * 3 + 2]);
        nx.push(0); ny.push(0); nz.push(0);
        paletteIds.set(slot, colour);
        list.push(slot);
      }
      nx[slot] += fx; ny[slot] += fy; nz[slot] += fz;
      index[t + j] = slot;
    }
  }
  if (px.length > 65535) throw new Error(`mesh needs ${px.length} vertices; uint16 indices cap at 65535`);
  for (let i = 0; i < index.length; i++) if (index[i] === 0 && !paletteIds.has(0)) throw new Error('unfilled index');
  const positions = new Float32Array(px.length * 3);
  const colours = new Uint8Array(px.length * 3);
  for (let i = 0; i < px.length; i++) {
    positions[i * 3] = px[i]; positions[i * 3 + 1] = py[i]; positions[i * 3 + 2] = pz[i];
    const rgb = colourOf[paletteIds.get(i)];
    colours[i * 3] = rgb[0]; colours[i * 3 + 1] = rgb[1]; colours[i * 3 + 2] = rgb[2];
  }
  return {positions, colours, indices: Uint16Array.from(index), vertices: px.length, triangles: tri.length / 3};
}

/* ----------------------------------------------------------------- deviation */

/* How far the reduced surface is from the approved one, measured as the distance
   from every source vertex to the nearest reduced triangle. A collapse only ever
   moves the surface inside the region it spanned, so this one-sided figure also
   bounds any silhouette excursion: if no source point is further than X mm from
   the reduced surface, no outline can have moved further than X mm either. */
function maxDeviation(sourceMesh, reduced) {
  const p = reduced.position, tri = reduced.tri;
  const count = tri.length / 3;
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (let t = 0; t < count; t++) for (let j = 0; j < 3; j++) {
    const v = tri[t * 3 + j];
    for (let k = 0; k < 3; k++) {
      const value = p[v * 3 + k];
      if (value < lo[k]) lo[k] = value;
      if (value > hi[k]) hi[k] = value;
    }
  }
  const cell = 0.03;                       // wider than any reduced triangle
  const nx = Math.max(1, Math.ceil((hi[0] - lo[0]) / cell) + 1);
  const ny = Math.max(1, Math.ceil((hi[1] - lo[1]) / cell) + 1);
  const nz = Math.max(1, Math.ceil((hi[2] - lo[2]) / cell) + 1);
  const buckets = new Map();
  const bucketOf = (x, y, z) => Math.floor((x - lo[0]) / cell) * ny * nz + Math.floor((y - lo[1]) / cell) * nz + Math.floor((z - lo[2]) / cell);
  for (let t = 0; t < count; t++) {
    const a = tri[t * 3], b = tri[t * 3 + 1], c = tri[t * 3 + 2];
    const x0 = Math.floor((Math.min(p[a * 3], p[b * 3], p[c * 3]) - lo[0]) / cell);
    const x1 = Math.floor((Math.max(p[a * 3], p[b * 3], p[c * 3]) - lo[0]) / cell);
    const y0 = Math.floor((Math.min(p[a * 3 + 1], p[b * 3 + 1], p[c * 3 + 1]) - lo[1]) / cell);
    const y1 = Math.floor((Math.max(p[a * 3 + 1], p[b * 3 + 1], p[c * 3 + 1]) - lo[1]) / cell);
    const z0 = Math.floor((Math.min(p[a * 3 + 2], p[b * 3 + 2], p[c * 3 + 2]) - lo[2]) / cell);
    const z1 = Math.floor((Math.max(p[a * 3 + 2], p[b * 3 + 2], p[c * 3 + 2]) - lo[2]) / cell);
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) {
      const key = (x * ny + y) * nz + z;
      let list = buckets.get(key);
      if (!list) { list = []; buckets.set(key, list); }
      list.push(t);
    }
  }
  const distanceTo = (t, x, y, z) => {
    const ia = tri[t * 3] * 3, ib = tri[t * 3 + 1] * 3, ic = tri[t * 3 + 2] * 3;
    const ax = p[ia], ay = p[ia + 1], az = p[ia + 2];
    const bx = p[ib], by = p[ib + 1], bz = p[ib + 2];
    const cx = p[ic], cy = p[ic + 1], cz = p[ic + 2];
    const abx = bx - ax, aby = by - ay, abz = bz - az;
    const acx = cx - ax, acy = cy - ay, acz = cz - az;
    const apx = x - ax, apy = y - ay, apz = z - az;
    const d1 = abx * apx + aby * apy + abz * apz, d2 = acx * apx + acy * apy + acz * apz;
    if (d1 <= 0 && d2 <= 0) return Math.hypot(apx, apy, apz);
    const bpx = x - bx, bpy = y - by, bpz = z - bz;
    const d3 = abx * bpx + aby * bpy + abz * bpz, d4 = acx * bpx + acy * bpy + acz * bpz;
    if (d3 >= 0 && d4 <= d3) return Math.hypot(bpx, bpy, bpz);
    const vc = d1 * d4 - d3 * d2;
    if (vc <= 0 && d1 >= 0 && d3 <= 0) {
      const t1 = d1 / (d1 - d3);
      return Math.hypot(x - (ax + abx * t1), y - (ay + aby * t1), z - (az + abz * t1));
    }
    const cpx = x - cx, cpy = y - cy, cpz = z - cz;
    const d5 = abx * cpx + aby * cpy + abz * cpz, d6 = acx * cpx + acy * cpy + acz * cpz;
    if (d6 >= 0 && d5 <= d6) return Math.hypot(cpx, cpy, cpz);
    const vb = d5 * d2 - d1 * d6;
    if (vb <= 0 && d2 >= 0 && d6 <= 0) {
      const t2 = d2 / (d2 - d6);
      return Math.hypot(x - (ax + acx * t2), y - (ay + acy * t2), z - (az + acz * t2));
    }
    const va = d3 * d6 - d5 * d4;
    if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
      const t3 = (d4 - d3) / ((d4 - d3) + (d5 - d6));
      return Math.hypot(x - (bx + (cx - bx) * t3), y - (by + (cy - by) * t3), z - (bz + (cz - bz) * t3));
    }
    const denom = 1 / (va + vb + vc), v = vb * denom, w = vc * denom;
    return Math.hypot(x - (ax + abx * v + acx * w), y - (ay + aby * v + acy * w), z - (az + abz * v + acz * w));
  };
  const px = sourceMesh.px;
  const values = [];
  let orphans = 0;
  const orphanBox = [null, null];
  for (let i = 0; i < px.length; i++) {
    const x = px[i], y = sourceMesh.py[i], z = sourceMesh.pz[i];
    let best = Infinity;
    const cx = Math.floor((x - lo[0]) / cell), cy = Math.floor((y - lo[1]) / cell), cz = Math.floor((z - lo[2]) / cell);
    // Widen the search until something is found: a source vertex can sit where
    // the reduced mesh has no triangle at all, and that distance is the answer.
    for (let ring = 1; ring <= 8 && !Number.isFinite(best); ring++) {
      for (let ox = -ring; ox <= ring; ox++) for (let oy = -ring; oy <= ring; oy++) for (let oz = -ring; oz <= ring; oz++) {
        if (Math.max(Math.abs(ox), Math.abs(oy), Math.abs(oz)) !== ring) continue;
        const list = buckets.get(((cx + ox) * ny + (cy + oy)) * nz + (cz + oz));
        if (!list) continue;
        for (const t of list) {
          const d = distanceTo(t, x, y, z);
          if (d < best) best = d;
        }
      }
    }
    if (Number.isFinite(best)) values.push(best);
    else {
      // Nothing of the reduced surface is within 24 mm: the reduction removed a
      // sliver patch there. Counted rather than averaged, so it cannot hide.
      orphans++;
      if (orphanBox[0] === null) orphanBox[0] = [x, y, z];
      orphanBox[1] = [x, y, z];
    }
  }
  values.sort((a, b) => a - b);
  const at = q => values.length ? values[Math.min(values.length - 1, Math.floor(q * (values.length - 1)))] : 0;
  return {
    samples: values.length,
    max: at(1), p999: at(0.999), p99: at(0.99),
    mean: values.reduce((a, b) => a + b, 0) / Math.max(1, values.length),
    orphans,
    orphanAt: orphanBox[0] ? orphanBox[0].map(v => +v.toFixed(2)) : null,
  };
}

/* --------------------------------------------------------------------- bake */

function main() {
  const args = process.argv.slice(2);
  /* An option is present whenever its flag appears -- including at index 0, and
     including a flag whose value is a path that happens to start with a dash. */
  const option = flag => {
    const at = args.indexOf(flag);
    if (at < 0) return null;
    const value = args[at + 1];
    if (value === undefined || value.startsWith('--')) {
      console.error(`${flag} needs a path`);
      process.exit(2);
    }
    return path.resolve(value);
  };
  const source = option('--source'), reportAt = option('--report'), coverAt = option('--cover');
  if (!source) {
    console.error('usage: node tools/bake-caddy-model.cjs --source <v6 site directory> [--report <json>] [--cover <webp>]');
    process.exit(2);
  }
  // Reject shipped art before importing or writing the model. Check file identity
  // too: a symlink, hard link or case-insensitive spelling may name the same file.
  for (const file of [coverAt, reportAt].filter(Boolean)) {
    const output = fs.statSync(file, {throwIfNoEntry: false});
    for (const dir of [root, path.resolve(root, '../dist')]) {
      const shipped = path.join(dir, 'cover-caddy.webp');
      const art = fs.statSync(shipped, {throwIfNoEntry: false});
      if (file === shipped || (output && art && output.dev === art.dev && output.ino === art.ino)) {
        console.error('The shipped Caddy cover is separate artwork. Choose a scratch output path.');
        process.exit(2);
      }
    }
  }
  const parts = sceneParts(source);
  const buckets = {
    paint: parts.filter(p => p.mesh === 'shell' && p.name === 'paint'),
    glass: parts.filter(p => p.mesh === 'shell' && p.name === 'glass'),
    trim: parts.filter(p => p.mesh === 'shell' && p.name === 'trim'),
    lining: parts.filter(p => p.mesh === 'shell' && p.name === 'shell'),
    hardware: parts.filter(p => FINISH_HARDWARE.includes(p.mesh)),
  };

  const out = [], report = {sourceTriangles: 0, triangles: 0, groups: {}, deviation: []};
  const deviated = [];
  for (const [bucket, list] of Object.entries(buckets)) {
    const total = list.reduce((sum, p) => sum + p.count, 0);
    let sourced = 0, triangles = 0, vertices = 0;
    for (const part of list) {
      const mesh = buildMesh(flatColours(part));
      const target = Math.max(8, Math.round(BUDGET[bucket] * part.count / total));
      const reduced = simplify(mesh, target, GUARDED[bucket]);
      sourced += mesh.tri.length / 3;
      if (bucket !== 'hardware') deviated.push({bucket, ...maxDeviation(mesh, reduced)});
      const emitted = emit(reduced);
      triangles += emitted.triangles; vertices += emitted.vertices;
      out.push({
        name: `${part.mesh} ${part.name}`.replace(/\s+/g, ' ').trim(),
        material: MATERIAL_OF[part.name] || MATERIAL_OF[part.mesh] || 'metal',
        ...emitted,
      });

    }
    report.groups[bucket] = {sourceTriangles: sourced, triangles, vertices};
    report.sourceTriangles += sourced;
    report.triangles += triangles;
    console.log(`${bucket.padEnd(9)} ${String(sourced).padStart(7)} -> ${String(triangles).padStart(6)} triangles  ${String(vertices).padStart(6)} vertices`);
  }
  report.deviation = deviated;
  for (const row of deviated) {
    console.log(`deviation ${row.bucket.padEnd(9)} max ${(row.max * 1000).toFixed(2)} mm  p99.9 ${(row.p999 * 1000).toFixed(2)} mm  p99 ${(row.p99 * 1000).toFixed(2)} mm  mean ${(row.mean * 1000).toFixed(2)} mm  over ${row.samples} vertices` +
      (row.orphans ? `  (${row.orphans} vertices left uncovered, first at ${row.orphanAt.join(', ')})` : ''));
  }
  write(out, report);
  if (coverAt) cover(coverAt).catch(error => { console.error(error); process.exitCode = 1; });
  if (reportAt) fs.writeFileSync(reportAt, JSON.stringify(report, null, 1) + '\n');
  return report;
}


/* Optional scratch preview of the game rig, not the illustrated lobby cover. */
async function cover(file) {
  const {createCanvas, loadImage} = require('@napi-rs/canvas');
  const project = path.resolve(__dirname, '..');
  global.window = global;
  require(path.join(project, 'src/three.min.js'));
  global.THREE = globalThis.THREE;
  global.document = {createElement: () => createCanvas(8, 8)};
  // Staged inside src/ so the game modules keep resolving each other.
  const staged = name => path.join(project, 'src', `.caddy-${name}.mjs`);
  for (const name of ['software', 'trucks']) {
    fs.writeFileSync(staged(name), fs.readFileSync(path.join(project, `src/${name}.js`), 'utf8')
      .replace('/*__WASM__*/', fs.readFileSync(path.join(project, 'src/raster.wasm')).toString('base64')));
  }
  let MTMSoftwareRenderer, MTMTrucks;
  try {
    ({MTMSoftwareRenderer} = await import(staged('software')));
    ({MTMTrucks} = await import(staged('trucks')));
  } finally {
    // The staged copies exist only for the duration of those imports.
    for (const name of ['software', 'trucks']) fs.rmSync(staged(name), {force: true});
  }
  const T = global.THREE;
  const scene = new T.Scene();
  scene.background = new T.Color('#111a2b');
  scene.fog = new T.FogExp2('#111a2b', 0.02);
  // The rasteriser lights every rig from one fixed direction, so the cover lens
  // sits on that side and the tint lifts the night exposure.
  scene.userData.softwareTint = [1.75, 1.72, 1.78];
  const rig = MTMTrucks.make(7, true, {tires: 1, suspension: 1});
  rig.root.rotation.y = 2.42;
  scene.add(rig.root);
  const wide = 1716, high = 780, internalW = 980, internalH = 446;
  const renderer = MTMSoftwareRenderer();
  renderer.setPixelRatio(1);
  renderer.setSize(internalW / 0.58, internalH / 0.58);
  const camera = new T.PerspectiveCamera(30, internalW / internalH, 0.1, 90);
  camera.position.set(-12.6, 5.4, -9.4);
  camera.lookAt(0, 1.9, 0);
  renderer.render(scene, camera);
  const frame = createCanvas(internalW, internalH);
  frame.getContext('2d').drawImage(renderer.domElement, 0, 0, internalW, internalH);
  const page = createCanvas(wide, high), ctx = page.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, high);
  sky.addColorStop(0, '#0d1526');
  sky.addColorStop(0.55, '#16223a');
  sky.addColorStop(1, '#0a1120');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, wide, high);
  // Truck on the right, framed to the height, fading into the dark left half.
  const image = await loadImage(frame.toBuffer('image/png'));
  const scale = high / internalH * 1.28;
  const drawnW = internalW * scale, drawnH = internalH * scale;
  ctx.drawImage(image, wide - drawnW * 0.70, high - drawnH * 0.86, drawnW, drawnH);
  const fade = ctx.createLinearGradient(0, 0, wide * 0.78, 0);
  fade.addColorStop(0, '#0a1120');
  fade.addColorStop(0.4, 'rgba(9,16,28,.92)');
  fade.addColorStop(1, 'rgba(9,16,28,0)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, wide * 0.78, high);
  const floor = ctx.createLinearGradient(0, high * 0.74, 0, high);
  floor.addColorStop(0, 'rgba(6,10,18,0)');
  floor.addColorStop(1, 'rgba(6,10,18,.82)');
  ctx.fillStyle = floor;
  ctx.fillRect(0, high * 0.74, wide, high * 0.26);
  fs.writeFileSync(file, page.toBuffer('image/webp', 0.9));
  console.log(`wrote ${path.relative(process.cwd(), file)} (${(fs.statSync(file).size / 1024).toFixed(0)} KB)`);
}

function write(meshes, report) {
  const lines = meshes.map(mesh => {
    const b64 = view => Buffer.from(view.buffer, view.byteOffset, view.byteLength).toString('base64');
    return `  {name:'${mesh.name}',material:'${mesh.material}',triangles:${mesh.triangles},positions:'${b64(mesh.positions)}',colors:'${b64(mesh.colours)}',indices:'${b64(mesh.indices)}'}`;
  });
  const text = `/* The VW Caddy Mk1 Parts Runner body, reduced from the approved v6 CAD export by
   tools/bake-caddy-model.cjs -- do not hand edit.

   Each part is one material group of the approved shell or one piece of finish
   hardware: positions as float32 xyz, colours as sRGB bytes, uint16 indices.
   \`material\` names the shared fleet material the part renders with, so the
   software rasteriser sees one material per mesh. The loader linearises the
   colours and derives normals per smoothing group. */
export const MTMCaddyModel={
  triangles:${report.triangles},
  parts:[
${lines.join(',\n')}
  ]
};
`;
  fs.writeFileSync(OUTPUT, text);
  console.log(`wrote ${path.relative(process.cwd(), OUTPUT)} (${(Buffer.byteLength(text) / 1024).toFixed(0)} KB, ${report.triangles} triangles)`);
}

main();
