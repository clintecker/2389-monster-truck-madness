/* Shared toolkit for the game's small building blocks. Loaded first so every
   other file can rely on it. Nothing here touches THREE or the DOM beyond
   creating canvas elements, and nothing here keeps mutable state. */
const MTMKit = (() => {
  'use strict';
  const TAU = Math.PI * 2;

  /* Scalar helpers. clamp forces a value into a range, mix walks between two
     values, cycle wraps into [0, n) and stays positive for negative inputs. */
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const mix = (a, b, t) => a + (b - a) * t;
  const cycle = (x, n) => ((x % n) + n) % n;

  /* Deterministic 32-bit linear congruential generator. Same seed, same world:
     courses, props and scenery use this instead of Math.random so a replay
     rebuilds the identical scene. */
  function rng(seed) {
    let state = seed >>> 0;
    return () => {
      state = (Math.imul(1664525, state) + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  /* Canvas helpers. Most game artwork is a 2D canvas painted at startup and
     uploaded as a texture, so creation and upload deserve one home. */
  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  /* Upload a 2D canvas as a texture. wrap tiles the artwork (ground, road),
     otherwise clamp it (signs, panels, HUD). anisotropy keeps grazing-angle
     text legible. */
  function map(c, wrap = true) {
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    if (wrap) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    return tex;
  }

  /* 2D paint primitives shared by the artwork painters. All of them begin
     their own path so callers can chain several shapes on one context. */
  function poly(c, pts, ink) {
    c.fillStyle = ink; c.beginPath(); c.moveTo(...pts[0]);
    for (let i = 1; i < pts.length; i++) c.lineTo(...pts[i]);
    c.closePath(); c.fill();
  }
  function rect(c, x, y, w, h, ink) { c.fillStyle = ink; c.fillRect(x, y, w, h); }
  function oval(c, x, y, rx, ry, ink, angle = 0) {
    c.fillStyle = ink; c.beginPath(); c.ellipse(x, y, rx, ry, angle, 0, TAU); c.fill();
  }
  /* Open polyline with round caps and joins, the common hand-inked line. */
  function stroke(c, pts, ink, width) {
    c.strokeStyle = ink; c.lineWidth = width; c.lineCap = c.lineJoin = 'round';
    c.beginPath(); c.moveTo(...pts[0]);
    for (let i = 1; i < pts.length; i++) c.lineTo(...pts[i]);
    c.stroke();
  }

  return { TAU, clamp, mix, cycle, rng, canvas, map, paint: { poly, rect, oval, stroke } };
})();

export {MTMKit};
