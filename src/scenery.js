/* 2389 Research Night Shift. Static, locally generated environments for the
   desert telemetry range, forest substation and fairgrounds drag strip. */
window.MTMScenery = (() => {
  'use strict';

  const {TAU, clamp, mix} = MTMKit;
  // Outbound Mesa and the longer route share the same painted sign sheets.
  const noticeTextures = new Map();

  function build(world, terrain, course) {
    const T = THREE;
    const samples = course.samples;
    if (!samples || samples.length < 2) return;
    const random = MTMKit.rng({arizona: 0x41425a31, eight: 0x46494738, indiana: 0x494e4439}[course.id] || 1996);
    const range = (lo, hi) => mix(lo, hi, random());
    const pick = list => list[Math.min(list.length - 1, Math.floor(random() * list.length))];
    const cachedColors = new Map();
    const ground = (x, z) => {
      const elevation = terrain(x, z);
      return Number.isFinite(elevation) ? elevation : 0;
    };
    const width = course.width || 16;
    const half = width / 2;
    // Coarse geographic batches let the frustum reject the opposite side of the course.
    const solids = new Map();
    const lamps = {positions: [], colors: []};
    const glow = {positions: [], colors: []};
    let emitting = false;
    const mint = '#70ffdf', ice = '#86ddff', pink = '#ff468d', violet = '#ae94ff';
    const chunkSize = course.id === 'arizona' ? 155 : 103;
    const print = {positions: [], uvs: []};
    const bulletinPages=[];
    const signObstructions=[],readingWindows=[],canopies=[],structures=[],unbuiltFlags=[];
    // Attractions, project posters and the visitor camera share the surveyed
    // sign faces, roofs and gantries that the road-sign placement checks.
    world.userData.survey={blocked:(from,to)=>signObstructions.some(rect=>blocksRay(rect,from,to))||
      structures.some(rect=>blocksRay(rect,from,to))||canopies.some(tree=>behindTree(tree,from,to)),readingWindows};
    const jokeSigns=world.userData.jokeSigns||(world.userData.jokeSigns=[]);
    const shade = {positions: [], colors: []};
    const reservations = [];
    const obstacles = world.userData.obstacles || (world.userData.obstacles = []);
    // The left-hand dirt bypass is a drivable lane in its own right.
    const bypassStart=.688, bypassEnd=.791;
    const bypassOffset=t=>-14*Math.sin(Math.PI*clamp(t,0,1))**1.4;
    const bypass=course.id==='eight'
      ? Array.from({length:57},(_,i)=>courseFrame(mix(bypassStart,bypassEnd,i/56),bypassOffset(i/56)))
      : [];
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const s of samples) {
      minX = Math.min(minX, s.x); maxX = Math.max(maxX, s.x);
      minZ = Math.min(minZ, s.z); maxZ = Math.max(maxZ, s.z);
    }

    function color(value, multiplier = 1) {
      if (Array.isArray(value)) return multiplier === 1 ? value : value.map(number => number * multiplier);
      let raw = cachedColors.get(value);
      if (!raw) {
        const c = new T.Color(value);
        raw = [c.r, c.g, c.b];
        cachedColors.set(value, raw);
      }
      return multiplier === 1 ? raw : [raw[0] * multiplier, raw[1] * multiplier, raw[2] * multiplier];
    }

    // The static meshes are combined so hundreds of cacti, seats and rocks share draw calls.
    function tri(a, b, c, ink) {
      const rgb = color(ink);
      if (emitting) {
        lamps.positions.push(...a, ...b, ...c);
        lamps.colors.push(...rgb, ...rgb, ...rgb);
        return;
      }
      const column = Math.floor((a[0]+b[0]+c[0]) / (3*chunkSize));
      const row = Math.floor((a[2]+b[2]+c[2]) / (3*chunkSize));
      const key = column + 4096*row;
      let solid = solids.get(key);
      if (!solid) { solid = {positions: [], colors: []}; solids.set(key, solid); }
      solid.positions.push(...a, ...b, ...c);
      solid.colors.push(...rgb, ...rgb, ...rgb);
    }

    // These elements use an unlit material in both renderers, including the WASM path.
    function emit(draw) {
      const previous = emitting;
      emitting = true;
      draw();
      emitting = previous;
    }

    function quad(a, b, c, d, ink) {
      tri(a, b, c, ink); tri(a, c, d, ink);
    }

    function frame(x, y, z, yaw = 0) {
      return {x, y, z, cs: Math.cos(yaw), sn: Math.sin(yaw), yaw};
    }

    function vertex(p, x, y, z) {
      return [p.x + p.cs * x + p.sn * z, p.y + y, p.z - p.sn * x + p.cs * z];
    }

    function relative(p, x, y, z, turn = 0) {
      const v = vertex(p, x, y, z);
      return frame(v[0], v[1], v[2], p.yaw + turn);
    }

    function box(p, x, y, z, w, h, d, ink) {
      const a = w / 2, b = h / 2, e = d / 2;
      const corner = (i, j, k) => vertex(p, x + a * i, y + b * j, z + e * k);
      const A = corner(-1,-1,-1), B = corner(1,-1,-1), C = corner(1,1,-1), D = corner(-1,1,-1);
      const E = corner(-1,-1,1), F = corner(1,-1,1), G = corner(1,1,1), H = corner(-1,1,1);
      quad(A,D,C,B,ink); quad(E,F,G,H,ink);
      quad(A,E,H,D,ink); quad(B,C,G,F,ink);
      quad(D,H,G,C,color(ink,1.04)); quad(A,B,F,E,color(ink,.72));
    }

    function normalize(v) {
      const length = Math.hypot(...v) || 1;
      return [v[0] / length, v[1] / length, v[2] / length];
    }

    function cross(a, b) {
      return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
    }

    // Frusta between arbitrary endpoints form chassis rails, branches, cables and poles.
    function rod(a, b, r0, r1, ink, sides = 6, caps = false) {
      const axis = normalize([b[0]-a[0], b[1]-a[1], b[2]-a[2]]);
      const u = normalize(cross(axis, Math.abs(axis[1]) > .86 ? [1,0,0] : [0,1,0]));
      const v = cross(axis, u);
      let previousA, previousB;
      for (let i = 0; i <= sides; i++) {
        const angle = TAU * i / sides;
        const co = Math.cos(angle), si = Math.sin(angle);
        const n = [co*u[0]+si*v[0], co*u[1]+si*v[1], co*u[2]+si*v[2]];
        const pa = [a[0]+n[0]*r0, a[1]+n[1]*r0, a[2]+n[2]*r0];
        const pb = [b[0]+n[0]*r1, b[1]+n[1]*r1, b[2]+n[2]*r1];
        if (i) {
          quad(previousA, pa, pb, previousB, ink);
          if (caps) { tri(a, pa, previousA, ink); tri(b, previousB, pb, ink); }
        }
        previousA = pa; previousB = pb;
      }
    }

    function line(p, from, to, r0, r1, ink, sides = 6, caps = false) {
      rod(vertex(p,...from), vertex(p,...to), r0, r1, ink, sides, caps);
    }

    function nearestDistance(x, z) {
      const n = course.nearest(x, z);
      return n ? Math.abs(n.distance) : Infinity;
    }

    function clear(x, z, radius) {
      if (typeof MTMFinish!=='undefined' && MTMFinish.reserved(course,x,z,radius)) return false;
      if (nearestDistance(x, z) < half + radius) return false;
      if (bypass.length && bypass.some(q=>(q.x-x)**2+(q.z-z)**2 < (5.6+radius)**2)) return false;
      return !reservations.some(entry => (x-entry.x)**2 + (z-entry.z)**2 < (radius+entry.r)**2);
    }

    function reserve(p, r) { reservations.push({x:p.x,z:p.z,r}); }

    function solidCircle(p, r, x=0, z=0, material='metal') {
      const [cx,,cz]=vertex(p,x,0,z);
      obstacles.push({x:cx,z:cz,r,material});
    }

    // Straight grandstands retain their actual rectangular faces. Small rotated
    // buildings use overlapping circles contained inside the modeled footprint.
    function solidFootprint(p, x, z, hx, hz, material='metal') {
      if(Math.min(Math.abs(p.cs),Math.abs(p.sn)) < .012) {
        const [cx,,cz]=vertex(p,x,0,z);
        const alignedX=Math.abs(p.cs)>.7;
        obstacles.push({x:cx,z:cz,hx:alignedX?hx:hz,hz:alignedX?hz:hx,material});
        return;
      }
      const r=.60*Math.min(hx,hz);
      const spanX=2*(hx-r),spanZ=2*(hz-r);
      const nx=Math.max(1,Math.ceil(spanX/(1.32*r))),nz=Math.max(1,Math.ceil(spanZ/(1.32*r)));
      for(let i=0;i<=nx;i++) for(let j=0;j<=nz;j++)
        solidCircle(p,r,x+spanX*(i/nx-.5),z+spanZ*(j/nz-.5),material);
    }

    // All side-of-road directions use the actual sampled tangent, including the drag strip.
    function courseFrame(fraction, offset = 0) {
      const s = clamp(fraction, 0, 1) * course.length;
      let lo = 0, hi = samples.length - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >>> 1;
        if (samples[mid].s < s) lo = mid; else hi = mid;
      }
      const a = samples[lo], b = samples[hi];
      const t = clamp((s-a.s) / (b.s-a.s || 1), 0, 1);
      let dx = mix(a.dx, b.dx, t), dz = mix(a.dz, b.dz, t);
      if (!Number.isFinite(dx + dz) || Math.hypot(dx, dz) < .01) {
        dx = b.x-a.x; dz = b.z-a.z;
      }
      const yaw = Math.atan2(dx,dz);
      const x = mix(a.x,b.x,t) + Math.cos(yaw)*offset;
      const z = mix(a.z,b.z,t) - Math.sin(yaw)*offset;
      return frame(x,ground(x,z),z,yaw);
    }

    // A soft, terrain-conforming contact shadow also reads when shadow maps are disabled.
    function contact(p, rx, rz, alpha = .20, sides = 9) {
      const origin = [p.x,ground(p.x,p.z)+.065,p.z];
      let last;
      const rgb = [.035,.022,.013];
      for (let i = 0; i <= sides; i++) {
        const a = i*TAU/sides;
        const edge = vertex(p, Math.cos(a)*rx, 0, Math.sin(a)*rz);
        edge[1] = ground(edge[0],edge[2]) + .065;
        if (last) {
          shade.positions.push(...origin,...edge,...last);
          shade.colors.push(...rgb,alpha,...rgb,0,...rgb,0);
        }
        last = edge;
      }
    }

    // A translucent fan paints a soft pool or beacon halo. Its alpha fades to
    // zero along the perimeter, without textures, real lights or postprocessing.
    function glowFan(center, ring, ink, alpha) {
      const rgb=color(ink);
      for(let j=0;j<ring.length;j++) {
        glow.positions.push(...center,...ring[j],...ring[(j+1)%ring.length]);
        glow.colors.push(...rgb,alpha,...rgb,0,...rgb,0);
      }
    }

    function spill(p,rx,rz,ink,alpha=.27) {
      const center=[p.x,ground(p.x,p.z)+.092,p.z],ring=[];
      for(let j=0;j<12;j++){
        const a=j*TAU/12, edge=vertex(p,rx*Math.cos(a),0,rz*Math.sin(a));
        edge[1]=ground(edge[0],edge[2])+.092;ring.push(edge);
      }
      glowFan(center,ring,ink,alpha);
    }

    function beacon(p,x,y,z,ink,r=.20) {
      const center=vertex(p,x,y,z);
      emit(()=>box(p,x,y,z,1.65*r,1.45*r,1.65*r,ink));
      for(let plane=0;plane<2;plane++) {
        const ring=[];
        for(let j=0;j<10;j++) {
          const a=j*TAU/10,h=4.3*r*Math.cos(a);
          ring.push(vertex(p,x+(plane?0:h),y+4.3*r*Math.sin(a),z+(plane?h:0)));
        }
        glowFan(center,ring,ink,.38);
      }
    }

    // One texture atlas keeps the printed lettering legible at race speed.
    const cells = {event:0, torque:1, radio:2, tires:3, mtm:4, arrow:5, flag:6, club:7};
    const cw = 512, ch = 144, aw = cw*2, ah = ch*4;
    function makeSignTexture() {
      const canvas = document.createElement('canvas'); canvas.width=aw; canvas.height=ah;
      const cx=canvas.getContext('2d');
      const words = {
        arizona:['BLACKOUT MESA','ARIZONA TELEMETRY RANGE',mint],
        eight:['FEEDBACK LOOP','HIGH VOLTAGE TEST SITE',violet],
        indiana:['OVERCLOCK STRIP','INDIANA NIGHT FINALS',pink]
      }[course.id];
      function letters(text,size,x,y,limit,ink,italic=false,mono=false) {
        cx.fillStyle=ink;
        cx.font=(italic?'italic ':'')+(mono?'bold ':'900 ')+size+'px '+(mono?'monospace':'Arial, Helvetica, sans-serif');
        cx.fillText(text,x,y,limit);
      }
      function rule(x,y,w,h,ink) {cx.fillStyle=ink;cx.fillRect(x,y,w,h);}
      function checks(x,y,w,h,size,a,b) {
        rule(x,y,w,h,a);
        for(let j=0;j<Math.ceil(h/size);j++) for(let i=0;i<Math.ceil(w/size);i++) {
          if ((i+j)%2===0) rule(x+i*size,y+j*size,Math.min(size,w-i*size),Math.min(size,h-j*size),b);
        }
      }
      for(let i=0;i<8;i++) {
        cx.save();cx.translate(i%2*cw,Math.floor(i/2)*ch);
        cx.beginPath();cx.rect(0,0,cw,ch);cx.clip();
        rule(0,0,cw,ch,'#121928');
        if(i===cells.event) {
          rule(0,0,9,ch,words[2]);rule(24,102,453,2,'#546777');
          letters(words[0],63,22,88,470,'#f0fff7',true);
          letters(words[1],22,24,132,429,words[2],false,true);
        } else if(i===cells.torque) {
          rule(0,0,cw,ch,mint);letters('2389',105,12,112,233,'#0d1923',true);
          letters('RESEARCH',41,253,82,245,'#0d1923');rule(254,96,235,5,'#0d1923');
        } else if(i===cells.radio && course.id==='arizona') {
          rule(0,0,cw,8,pink);letters('WE OPTIMIZED',53,15,68,482,'#fff6fc',true);
          letters('THE WRONG THING.',52,15,127,485,pink,true);
        } else if(i===cells.radio) {
          rule(0,0,12,ch,pink);letters('NIGHT SHIFT',63,28,80,448,'#f5f3ff',true);
          letters('2389  /  CIRCUIT RADIO',24,32,119,443,pink,false,true);
        } else if(i===cells.tires) {
          rule(0,0,cw,ch,'#273247');letters('PINE SIGNAL',62,24,80,448,ice,true);
          letters('TRACK TELEMETRY',25,27,122,394,'#eaf5ff',false,true);
        } else if(i===cells.mtm) {
          checks(0,0,40,ch,10,'#abe2dc','#1f2a39');letters('MONSTER TRUCK',42,56,61,435,'#edfdfa',true);
          letters('MADNESS',68,57,127,415,mint,true);
        } else if(i===cells.arrow) {
          for(let k=0;k<3;k++) {const x=k*158+16;cx.beginPath();cx.moveTo(x,13);cx.lineTo(x+65,13);cx.lineTo(x+133,72);cx.lineTo(x+65,131);cx.lineTo(x,131);cx.lineTo(x+67,72);cx.fillStyle=mint;cx.fill();}
        } else if(i===cells.flag) {
          checks(0,0,cw,ch,36,'#c8f5ea','#1a2334');
        } else {
          rule(0,0,cw,ch,'#39223d');rule(0,0,cw,6,pink);
          letters('NIGHT SHIFT',64,20,83,469,'#f9ecfa',true);
          letters('2389 RESEARCH  /  MOTOR POOL',20,23,120,464,pink,false,true);
        }
        cx.restore();
      }
      const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
      return texture;
    }

    // Each bounded page holds eight 512 × 192 cells. The game and the WASM
    // renderer only allocate pages used by the selected layout.
    const bulletinCellH=192;
    const favorites={
      arizona:[
        [.077, 1,'hazard','cactus','CACTUS CAR WASH','ONE BRUSH LEFT'],
        [.206,-1,'terminal','chip',"IT'S A DRY HEAT",'SO IS THE CPU'],
        [.294, 1,'hazard','rock','CAUTION','LOAD-BEARING SAND'],
        [.462,-1,'motel','mirage','MIRAGES','CASH ONLY'],
        [.676, 1,'guide','cloud','DUST IS A','CLOUD SERVICE'],
        [.798,-1,'terminal','fuel','NEXT GAS','PREVIOUS EXIT'],
        [.953,-1,'motel','burger','SANDWICHES','99% SAND']
      ],
      eight:[
        [.104,-1,'hazard','forklift','HONK IF',"YOU'RE A FORKLIFT"],
        [.255,-1,'motel','dino','DINO DIET','COMPACT CARS'],
        [.381, 1,'guide','loop','DETOUR','TO THIS SIGN'],
        [.527, 1,'terminal','bolt','HIGH VOLTAGE','LOW MORALE'],
        [.709, 1,'hazard','crane','DO NOT FEED','THE CRANE'],
        [.877,-1,'guide','trees','LOGGING','DISABLED'],
        [.959,-1,'terminal','bell','HONK TWICE','TO UNSUBSCRIBE']
      ],
      indiana:[
        [.101,-1,'terminal','mute','PIT CREW','ON MUTE'],
        [.178, 1,'motel','hotdog','KETCHUP','UNDER REVIEW'],
        [.318,-1,'terminal','air','HANG TIME','BILLED HOURLY'],
        [.459, 1,'hazard','tire','TIRE PRESSURE','IS A FEELING'],
        [.618, 1,'guide','coin','FAST LANE','SURGE PRICING'],
        [.754,-1,'motel','pizza','DEEP DISH','SHALLOW TREAD'],
        [.898, 1,'pit','trophy','FIRST PRIZE','TINY TROPHY']
      ]
    }[course.id]||[];
    // Supplemental notices are mounted between the original billboard vistas.
    // Crew names belong to fictional roadside establishments and pit booths.
    const extraMessages={
      arizona:[
        [.027, 1,'ticket','drop','GRAVITY TRIAL','FIRST DROP FREE'],
        [.139,-1,'shop','axle',"IVAN'S ALIGNMENT",'WE BEND THE ROAD'],
        [.254, 1,'shield','coin','SPEED LIMIT','BEST OFFER'],
        [.337,-1,'shop','griddle',"DYLAN'S DINER",'TWO-PLY PANCAKES'],
        [.391,-1,'blade','ghost','GHOST TOWN','CENSUS DISPUTED'],
        [.434, 1,'wall','depth','THIS PUDDLE','HAS A BASEMENT'],
        [.604,-1,'shop','rail',"SOON'S RAIL YARD",'RUNNING LATE'],
        [.731, 1,'slats','wind','SPEED ENFORCED','BY TUMBLEWEED'],
        [.909, 1,'shield','moon','MOON CROSSING',"IT WON'T SIGNAL"]
      ],
      eight:[
        [.032, 1,'wall','siren','RACE CONTROL','LOST CONTROL'],
        [.181,-1,'shop','bolt',"HARPER'S BREAKERS",'WE TRIP FOR LESS'],
        [.297, 1,'shield','cone','STUDENT CONES','PLEASE BE PATIENT'],
        [.350,-1,'shop','logs',"SUGI'S LOG CABIN",'STACK OVERFLOW'],
        [.445, 1,'blade','moose','MOOSE CROSSING','TIME UNDISCLOSED'],
        [.565,-1,'shop','dial',"ERYAN'S SPEED LAB",'SLOW RESULTS'],
        [.658,-1,'slats','trees','WIFI PASSWORD','ASK A TREE'],
        [.768, 1,'wall','barricade','ROAD CLOSED','TO SUGGESTIONS'],
        [.920,-1,'ticket','raccoon','QUIET ZONE','RACCOON ON CALL']
      ],
      indiana:[
        [.110, 1,'wall','corn','GO FASTER','THE CORN KNOWS'],
        [.148,-1,'shop','wrench',"MINT'S PIT STOP",'FRESHLY DENTED'],
        [.244, 1,'shop','tire',"CLINT'S TIRES",'HOLES INCLUDED'],
        [.374,-1,'blade','wave','NO WAKE ZONE','EXCEPT THE CROWD'],
        [.414, 1,'shield','dial','APPLAUSE METER','TAKES BRIBES'],
        [.547,-1,'shop','camera',"SOPHIE'S PHOTO PIT",'EVERY BLUR WINS'],
        [.677, 1,'shop','hotdog',"EDEN'S CORN DOGS",'LEASH OPTIONAL'],
        [.818, 1,'slats','siren','PIT STRATEGY','PANIC IN PAIRS'],
        [.964,-1,'ticket','drop','PLEASE RETURN','BORROWED GRAVITY']
      ]
    }[course.id]||[];
    const returnNotices=[
      [.554, 1,'ticket','receipt','RETURN ROAD','NO REFUNDS'],
      [.615,-1,'blade','mirage','NEXT OASIS','BRING WATER'],
      [.658, 1,'shield','ghost','GHOST TOLL','EXACT CHANGE'],
      [.705,-1,'slats','tire','COUNT YOUR TIRES','ONE TWO THREE...'],
      [.733,-1,'slats','air','FOUND THE FOURTH?','CHECK THE SKY'],
      [.757,-1,'slats','moon',"THAT'S THE MOON",'PUT IT BACK'],
      [.824, 1,'shop','mirage','LOST & FOUND','ONE HORIZON'],
      [.967,-1,'ticket','loop','IF LOST','ORBIT TWICE']
    ];
    // Route-specific night markets. The county election and the lost-echolocation
    // desk tell little stories in physical driving order.
    const marketNotices={
      arizona:[
        [.018,-1,'plate','bread','FREE AIR','BY THE SLICE'],
        [.055, 1,'dialbox','cone','SPEED TRAP','BAITED WITH RAMPS'],
        [.108,-1,'marquee','sun','SUNSCREEN','SPF 2389'],
        [.161, 1,'stone','rock',"IVAN'S GEOLOGY",'KICK IT TWICE'],
        [.193,-1,'pennant','ghost','DO NOT PET','THE MILEPOSTS'],
        [.229, 1,'tank','drop','WATER TOWER','JUST ADD WATER'],
        [.272,-1,'marquee','dino','FRESH FOSSILS','BAKED TODAY'],
        [.312,-1,'plate','ghost','MOTEL VACANCY','ONE HAUNT LEFT'],
        [.360, 1,'marquee','bread',"HARPER'S TOAST",'REENTRY HOT'],
        [.379,-1,'stone','rock','LOCAL ROCK','ON TOUR'],
        [.411, 1,'dialbox','rail','GHOST TRAIN','RUNS ON BOO'],
        [.479, 1,'pennant','cactus','U-PICK CACTUS','NO GIVEBACKS'],
        [.511,-1,'plate','sun','RENT A SHADOW','NOON HALF PRICE'],
        [.551, 1,'tank','coin','SAND CREDIT','PAY PER GRAIN'],
        [.573,-1,'marquee','clock','SPARE TIME','SOLD BY THE LAP'],
        [.626, 1,'dialbox','wind','WIND FARM','CROP ESCAPED'],
        [.651,-1,'plate','clock',"SOON'S DELAYS",'READY YESTERDAY'],
        [.698,-1,'stone','cloud','DUNE STORAGE','HEAP ONLY'],
        [.756, 1,'marquee','sun','MISSING SUN','LAST SEEN AT NOON'],
        [.794,-1,'tank','sun','FOUND SUN','STILL VERY HOT'],
        [.840, 1,'pennant','sun','SUN REUNITED','WITH ITS GLASSES'],
        [.862,-1,'dialbox','lizard',"SHERIFF'S OFFICE",'TWO LIZARDS'],
        [.933, 1,'stone','rock','TAKE ONLY PHOTOS','THE ROCKS COUNT'],
        [.984, 1,'plate','wind','END OF SAND','BEGIN FANCY DUST']
      ],
      eight:[
        [.016,-1,'plate','drop','WET FLOOR','FOREST-WIDE'],
        [.071, 1,'pennant','trees','TREEHOUSE HOA','NO GROUND FLOORS'],
        [.126,-1,'dialbox','spore','MUSHROOM WIFI','SPORE TO PAIR'],
        [.153, 1,'marquee','keys',"DYLAN'S KEY SHOP",'ESCAPES CUT HERE'],
        [.201, 1,'tank','bowl','SUGI SERVES BROTH','MIND THE TIDE'],
        [.237,-1,'plate','pond','POND REPAIRS','THANKS FOR WADING'],
        [.276, 1,'stone','logs','LOG OUT','LEAVE A STUMP'],
        [.323,-1,'marquee','coin','VENDING MACHINE','ACORNS ACCEPTED'],
        [.407, 1,'dialbox','bolt','DANGER','WIRELESS FENCE'],
        [.423,-1,'pennant','ferret','DO NOT WAKE','THE EXTENSION CORD'],
        [.486,-1,'tank','cloud',"ERYAN'S WEATHER",'80% CHANCE OF UP'],
        [.554, 1,'stone','spore','RESEARCH PLOT','THE MOSS DID IT'],
        [.594,-1,'marquee','frog','FROG AUDITIONS','MUST HAVE LEGS'],
        [.623, 1,'dialbox','frog','CAST LIST','ALL FROGS'],
        [.682, 1,'pennant','frog','ENCORE','SAME FROGS'],
        [.733,-1,'plate','logs','KNOCK ON WOOD','WAIT FOR REPLY'],
        [.806, 1,'tank','chip','SERVER FARM','PLEASE MILK DAILY'],
        [.847,-1,'stone','ghost','GHOST NETWORK','DEAD ZONE AHEAD'],
        [.898, 1,'dialbox','siren','EMERGENCY EXIT','PULL THE VINE'],
        [.980, 1,'plate','loop','YOU ARE HERE','AGAIN, APPARENTLY']
      ],
      indiana:[
        [.022,-1,'marquee','trophy','GATES OPEN','FENCES NERVOUS'],
        [.052, 1,'pennant','corn','COUNTY ELECTION','VOTE FOR CORN'],
        [.131,-1,'dialbox','bread','EXIT POLL','MOSTLY BUTTER'],
        [.210, 1,'marquee','corn','CORN ELECTED','EARS TO FOLLOW'],
        [.224,-1,'tank','wave','SOUVENIR AIR','HEAVY DUTY BAG'],
        [.269, 1,'plate','ferret',"CLINT'S DYNO",'RAT ON BREAK'],
        [.295,-1,'stone','coin',"MINT'S ARCADE",'MEOW FOR CHANGE'],
        [.335, 1,'pennant','bread','FUNNEL CAKE','USE WIDE END'],
        [.357,-1,'marquee','trophy','RIBBON CUTTING','RIBBON WON'],
        [.397,-1,'plate','magnet','WIN A FRIDGE','BRING A MAGNET'],
        [.439, 1,'dialbox','dial','DAREDEVIL SCHOOL','LANDING EXTRA'],
        [.486,-1,'tank','bowl','KETTLE CORN','NOW WHISTLING'],
        [.527, 1,'stone','camera',"SOPHIE'S STUDIO",'POSE AT 90 MPH'],
        [.577,-1,'pennant','claw',"EDEN'S ARCADE",'CLAWS ON PROBATION'],
        [.638, 1,'marquee','lizard','PETTING ZOO','TIRES ARE SHY'],
        [.700,-1,'dialbox','clock','PLEASE CLAP','BY APPOINTMENT'],
        [.741, 1,'plate','receipt','ADMISSION FREE','EXIT HAS A TAB'],
        [.794,-1,'tank','coin','PENNY ARCADE','TWO CENT MINIMUM'],
        [.866, 1,'stone','tire','FERRIS WHEEL','OUT FOR A SPIN'],
        [.939,-1,'marquee','trophy','SECOND PRIZE','FIRST PRIZE AGAIN']
      ]
    }[course.id]||[];
    const westMarket=[
      [.539,-1,'stone','depth','ABANDONED MINE','STILL HAS PLANS'],
      [.564, 1,'plate','moon','ALTITUDE LOST','REWARD OFFERED'],
      [.587,-1,'tank','bread','SANDWICH MINE','LUNCH VEIN AHEAD'],
      [.620, 1,'marquee','bell','MISSING ECHO','HOLLER IF FOUND'],
      [.645,-1,'dialbox','bell','ECHO FOUND','FOUND FOUND FOUND'],
      [.672, 1,'pennant','bell','ECHO ADOPTION','CALL TWICE'],
      [.691,-1,'plate','keys','SPACE BAR','ASTRONAUTS DRINK FREE'],
      [.716, 1,'stone','depth','TUNNEL OF LOVE','ONCOMING FEELINGS'],
      [.746, 1,'dialbox','dial','GENTLE BEND','RUDE STRAIGHT'],
      [.777,-1,'tank','drop','DEHYDRATED LAKE','SERVES FOUR'],
      [.801, 1,'marquee','chip','MOON EXCHANGE','CRATERS FOR CREDIT'],
      [.850,-1,'pennant','pond','SLOW FERRY','SAND PERMIT ONLY'],
      [.878, 1,'stone','rock','PET ROCK CEMETERY','STILL FETCHING'],
      [.904,-1,'plate','wind','AIR MUSEUM','HOLD YOUR BREATH'],
      [.933, 1,'dialbox','clock','NEXT REST STOP','LAST TUESDAY'],
      [.978,-1,'marquee','receipt','RETURN DEPOSIT','ONE WHOLE SKY']
    ];
    // The grade commission prints its warnings onto objects salvaged from the
    // climb. A single physical sign has the same cut profile in every renderer.
    const gradeNotices={
      arizona:[
        [.043,1,'ridgeline','peak','HILL RECEIPTS','KEEP FOR DESCENT'],
        [.082,-1,'survey','level',"IVAN'S LEVEL",'BUBBLE AT LARGE'],
        [.169,1,'flight','parachute','ROAD ENDS BRIEFLY','PLEASE STAY SEATED'],
        [.218,-1,'spring','spring','SHOCK THERAPY','WALK-INS BOUNCE'],
        [.286,1,'stamp','boot','BOOT HILL','LACES OPTIONAL'],
        [.327,-1,'survey','level','MESA SURVEY','TOP STILL FLAT'],
        [.382,1,'ridgeline','peak','SAND SUMMIT','MOVES ON TUESDAYS'],
        [.453,-1,'stamp','ghost','GHOST GRADE','SPIRITS RISE HERE'],
        [.519,1,'flight','parachute','AIR RIGHTS','ASK THE VULTURE'],
        [.561,-1,'spring','spring',"SOON'S SPRINGS",'BACK IN A BOUNCE'],
        [.635,1,'survey','plumb','PLUMB BOB','BOB QUIT'],
        [.689,-1,'ridgeline','rock','SHALE BRAKE','GEAR DOWN GENTLY'],
        [.741,1,'flight','boot','LOW FLYING BOOTS','DUCK AT THE HEEL'],
        [.808,-1,'stamp','receipt','TOLL PER SUMMIT','VALLEYS INCLUDED'],
        [.887,1,'spring','cactus','CACTUS MASSAGE','ONE POINT SPECIAL'],
        [.950,-1,'survey','dial','ALTITUDE 2389','UNITS MISPLACED']
      ],
      eight:[
        [.044,-1,'spring','spring','COIL CROSSING','WATCH YOUR STEP'],
        [.097,1,'ridgeline','logs','LOG FLUME','BRING YOUR OWN LOG'],
        [.167,-1,'survey','level',"DYLAN'S LEVEL",'NEEDS A PATCH'],
        [.223,1,'stamp','boot','MUD BATH','TOWELS COST EXTRA'],
        [.291,-1,'flight','parachute','GLIDING LESSONS','ASK A SQUIRREL'],
        [.366,1,'spring','spore','SPRING MUSHROOMS','STAND WELL BACK'],
        [.394,-1,'survey','plumb','VERTICAL LOGGING','PLEASE ROTATE TREE'],
        [.469,1,'ridgeline','peak',"SUGI'S RIDGE",'BROTH FLOWS DOWN'],
        [.517,-1,'stamp','frog','FROG PASSPORTS','STAMP BOTH FEET'],
        [.604,1,'spring','spring','PRESS ANY SPRING','TO CONTINUE'],
        [.644,-1,'flight','pond','FLY FISHING','FISH NOW BOARDING'],
        [.700,1,'survey','dial',"ERYAN'S CLINOMETER",'MOSTLY CLINES'],
        [.774,-1,'ridgeline','bridge','BRIDGE LIMIT','ONE HEAVY THOUGHT'],
        [.829,1,'stamp','trees','SCENIC LOOKOUT','THE PINES LOOK BACK'],
        [.877,-1,'flight','parachute','CANOPY LANDING','CATCH THE LEAVES'],
        [.946,1,'ridgeline','peak','FINAL ASCENT','TERMS MAY INCLINE']
      ],
      indiana:[
        [.036,1,'flight','boot','AIR SHOW','SOLES IN THE SKY'],
        [.084,-1,'stamp','bell','SECOND BELL','FIRST BELL APPEALED'],
        [.159,1,'ridgeline','peak','BRING A HILL','TAKE A HILL'],
        [.189,-1,'survey','level',"CLINT'S CAMBER",'HATS LEAN FREE'],
        [.251,1,'spring','spring','BOUNCE HOUSE','ZONED FOR TRUCKS'],
        [.302,-1,'stamp','coin',"MINT'S BANK",'CORN AS COLLATERAL'],
        [.758,1,'flight','parachute','PIT LANE PILOTS','WINGS SOLD SINGLY'],
        [.557,-1,'ridgeline','peak','HILL CLIMB FINAL','HILL WON AGAIN'],
        [.472,1,'survey','dial','ALTITUDE POOL','WIN ONE BALLOON'],
        [.505,-1,'stamp','camera',"SOPHIE'S REPLAY",'BLINK IN ADVANCE'],
        [.590,1,'spring','corn','CORN SUSPENSION','ALL EARS UP'],
        [.652,-1,'survey','plumb','PLUMB LINE','PLEASE QUEUE BELOW'],
        [.713,1,'flight','trophy','HANG TIME AWARD','STILL UP THERE'],
        [.773,-1,'ridgeline','boot','BOOTLEG SLOPE','GENUINE IMITATION'],
        [.853,1,'spring','spring',"EDEN'S TURNSTILE",'EXACTLY ONE REV'],
        [.919,-1,'stamp','receipt','GRAVITY LOTTERY','EVERYONE COMES DOWN']
      ]
    }[course.id];
    const westGrades=[
      [.545,-1,'ridgeline','peak','WESTERN DIVIDE','HALVES SOLD APART'],
      [.593,1,'flight','parachute','AIR MAIL','NO STAMP ON LANDING'],
      [.631,-1,'survey','level','LEVEL BEST','STILL ON A SLANT'],
      [.679,1,'stamp','boot',"HARPER'S BOOT CO",'ONE GIANT STEP'],
      [.720,-1,'spring','spring','COIL RESERVE','FEDERAL REBOUND'],
      [.814,1,'survey','plumb','LOOSE DATUM','RETURN TO SEA LEVEL'],
      [.856,-1,'flight','ghost','GHOST GLIDER','NO BODY ON BOARD'],
      [.951,1,'ridgeline','rock','SHORTCUT DOWN','GRAVEL HAS VOTED']
    ];
    const returnLayout=course.layoutKey==='arizona-circuit';
    const marketStart=favorites.length+extraMessages.length;
    const returnStart=marketStart+marketNotices.length,westStart=returnStart+returnNotices.length;
    const gradeStart=returnLayout?westStart+westMarket.length:returnStart,westGradeStart=gradeStart+gradeNotices.length;
    // Each local sponsor buys three independently mounted placements. Keeping the
    // audience with the artwork also gives tour visitors the right project link.
    const campaigns={
      arizona:[
        [.091,-1,'survey','wrench','REVIEW-SQUAD','WHO TORQUED THIS?', 'review-squad','Pit mechanics','Four reviewers sign off on one lug nut. The fifth nut is asking for representation.'],
        [.348,1,'marquee','bell','REVIEW-SQUAD','BOO THE VERDICT','review-squad','Bleacher crowd','Tonight only. Four judges disagree live. Your ticket includes one procedural objection.'],
        [.803,-1,'stamp','receipt','REVIEW-SQUAD','INITIAL EACH DENT','review-squad','Claims adjusters','Please submit the pre-crash diff. The post-crash diff is embedded in the wall.'],
        [.213,1,'terminal','ghost','CCVAULT','FIND MY LAST THOUGHT','ccvault','Sleepy developers','Search yesterday’s Claude Code session for the idea you had just before coffee.'],
        [.579,-1,'shop','wrench','CCVAULT','WHO HAD THE 10 MM?','ccvault','Tool crib','The transcript says you lent the socket to Ivan. Ivan has requested the transcript.'],
        [.935,1,'slats','moon','CCVAULT','PLAY THE OLD BEEF','ccvault','Race historians','Search the archive for the first recorded argument about the load-bearing sand.']
      ],
      eight:[
        [.085,1,'terminal','rail','MUX','PATCH IN THE BOT','mux','Lab operators','One switchboard for agent models and tools. The red cable goes to the model that likes Mondays.'],
        [.389,-1,'shop','griddle','MUX','ROUTE MY NOODLES','mux','Concession cooks','Orders to the wok. Receipts to the printer. Please unplug the linguine before closing.'],
        [.817,1,'blade','siren','MUX','SEND BOOS TO PA','mux','Stadium announcers','The away section has been patched directly into the tuba.'],
        [.156,-1,'shield','crane','SOLOCLAW','ONE CLAW ON CALL','soloclaw','Night operators','One operator and a terminal agent. The pager is clipped to the larger pincer.'],
        [.537,1,'ticket','coin','SOLOCLAW','WIN A TERMINAL','soloclaw','Arcade regulars','The lobster accepts exact change. Permission to pinch expires after one grab.'],
        [.913,-1,'stamp','receipt','SOLOCLAW','STAMP THE PINCER','soloclaw','Permit office','Please authorize this particular pinch. A season pass is excessive.']
      ],
      indiana:[
        [.068,1,'guide','loop','DOT VIEWER','DRAW MY DETOUR','dot-viewer','Road engineers','Type the Graphviz edge. Watch the bypass appear. Permit processing still takes six winters.'],
        [.416,-1,'marquee','coin','DOT VIEWER','TILT THE GRAPH','dot-viewer','Pinball players','Connect the bumpers in DOT. The ball would like a path to the jackpot.'],
        [.784,1,'slats','hotdog','DOT VIEWER','MAP THE MUSTARD','dot-viewer','Hot dog vendors','Bun points to dog. Dog points to mustard. Ketchup is an isolated node.'],
        [.191,-1,'flight','air','SPEED-RUN','SHIP AT GREEN','speed-run','Sprint developers','Start with a plan. Generate the code. Run the tests before the flag drops.'],
        [.584,1,'ticket','trophy','SPEED-RUN','TIME THE HOUND','speed-run','Track bookmakers','Odds posted after the tests pass. The mechanical dog has eaten the stopwatch.'],
        [.946,-1,'stamp','boot','SPEED-RUN','TEST THE FINISH','speed-run','Race scrutineers','The finish line passes inspection only when something can actually finish.']
      ]
    }[course.id]||[];
    const campaignStart=westGradeStart+(returnLayout?westGrades.length:0);
    const messages=favorites.concat(extraMessages,marketNotices,returnLayout?returnNotices:[],returnLayout?westMarket:[],gradeNotices,returnLayout?westGrades:[],campaigns);
    for(let i=0;i<messages.length;i+=8){
      const key=messages.slice(i,i+8).map(m=>m.slice(2).join('|')).join('~');
      bulletinPages.push({positions:[],uvs:[],page:i/8,key});
    }
    // The original sprint and the outbound leg of the circuit share their shops.
    // Western-only booths and survey markers follow the eight original return signs.
    const sprintLength=returnLayout&&typeof MTMCourses!=='undefined'?MTMCourses[0].length:course.length;

    const signStyles={
      ridgeline:{face:'#294d51',ink:'#fff5c9',secondary:'#fbd884',trim:'#ffca75'},
      survey:{face:'#e2ddbd',ink:'#194651',secondary:'#234151',trim:'#9cfadd'},
      flight:{face:'#313b63',ink:'#fff1e0',secondary:'#96e9ff',trim:'#a4ecff'},
      spring:{face:'#5d294a',ink:'#ffe5a2',secondary:'#ffe5ee',trim:'#ff8ebc'},
      stamp:{face:'#d2d9ee',ink:'#2e335b',secondary:'#533668',trim:'#bfc2ff'},
      hazard:{face:'#ffc76c',ink:'#171d2a',secondary:'#171d2a',trim:'#ffbf64'},
      terminal:{face:'#172138',ink:'#eff9fa',secondary:'#81ffe0',trim:'#82ffe3'},
      motel:{face:'#512044',ink:'#fff1d4',secondary:'#ffc9e0',trim:'#ff79a6'},
      guide:{face:'#1d565f',ink:'#f1fff0',secondary:'#ddf6c8',trim:'#b3ead2'},
      pit:{face:'#e8c7d7',ink:'#251a33',secondary:'#382040',trim:'#ff82b1'},
      ticket:{face:'#ffe29c',ink:'#3b2535',secondary:'#872950',trim:'#ffc382'},
      shop:{face:'#173f50',ink:'#fff3d5',secondary:'#9dffe0',trim:'#78f0ca'},
      blade:{face:'#51315a',ink:'#fff5cd',secondary:'#ffd5ab',trim:'#ffd393'},
      shield:{face:'#b3e1bc',ink:'#183747',secondary:'#26374d',trim:'#a0efcc'},
      wall:{face:'#483548',ink:'#fff2bd',secondary:'#79ffe0',trim:'#fa82a4'},
      slats:{face:'#733f42',ink:'#fff3c0',secondary:'#fbe8cb',trim:'#ffd095'},
      plate:{face:'#cfe6f5',ink:'#162f57',secondary:'#234a66',trim:'#93ceff'},
      tank:{face:'#23575c',ink:'#fff0c5',secondary:'#c6fff3',trim:'#65f4dc'},
      stone:{face:'#77758b',ink:'#101b31',secondary:'#f5f2ff',trim:'#b6d9e9'},
      pennant:{face:'#45598a',ink:'#ffefaa',secondary:'#d7fffc',trim:'#eccb70'},
      marquee:{face:'#76364b',ink:'#fff0b1',secondary:'#fff2e2',trim:'#ffb86f'},
      dialbox:{face:'#122f35',ink:'#ddffc6',secondary:'#8bffbf',trim:'#77f2c6'}
    };

    // Each invented crew business has its own enamel and illuminated edge.
    // Shared tooling keeps their blade silhouettes and pictograms recognizable.
    const shopInks={
      axle:['#403650','#fff0bd','#a4ffe1','#84ebd5'],
      griddle:['#6a334f','#fff2bd','#ffcedc','#ff9daf'],
      rail:['#3d4145','#fff1b1','#ffcc8b','#ffbb71'],
      bolt:['#56492c','#ffedaa','#fff3cf','#ffce62'],
      logs:['#3b5149','#ffefc8','#d4f2c2','#b8dfad'],
      dial:['#293f64','#e3efff','#9bf8ec','#9ad8ff'],
      wrench:['#194d45','#eeffde','#a7ffcf','#82f6c8'],
      tire:['#303b50','#faeee3','#ffc487','#ffae73'],
      camera:['#5d3358','#ffebfc','#e6c7ff','#fc9cd4'],
      hotdog:['#623c3d','#ffe3a2','#fff1bb','#ffbd69']
    };
    function signPaint(style,icon){
      const ink=style==='shop'&&shopInks[icon];
      return ink?{face:ink[0],ink:ink[1],secondary:ink[2],trim:ink[3]}:signStyles[style];
    }

    // Normalized outlines are used by the printed border, the cut metal edge
    // and the textured front. They are real silhouettes in both renderers.
    // Local Y points up, so atlas V and scene coordinates agree.
    const silhouettes={
      ridgeline:[[[.018,.77],[.092,.88],[.14,.84],[.245,.98],[.30,.89],[.36,.95],[.41,.87],[.83,.87],[.89,.97],[.98,.80],[.98,.09],[.91,.045],[.08,.045],[.018,.13]]],
      survey:[[[.015,.50],[.045,.76],[.11,.93],[.21,.96],[.26,.88],[.92,.88],[.984,.78],[.984,.18],[.94,.09],[.24,.09],[.17,.035],[.08,.10],[.035,.28]]],
      flight:[[[.008,.84],[.18,.97],[.25,.89],[.80,.89],[.985,.998],[.94,.78],[.972,.78],[.925,.61],[.95,.61],[.875,.39],[.875,.13],[.23,.13],[.15,.04],[.075,.18],[.037,.38]]],
      spring:[[[.016,.78],[.062,.94],[.17,.94],[.20,.87],[.30,.95],[.40,.87],[.50,.95],[.60,.87],[.70,.95],[.80,.87],[.89,.95],[.98,.83],[.98,.19],[.91,.07],[.80,.13],[.70,.05],[.60,.13],[.50,.05],[.40,.13],[.30,.05],[.20,.13],[.11,.06],[.018,.17]]],
      stamp:[Array.from({length:39},(_,i)=>[.018+.964*i/38,i%2?.90:.98]).concat([[.982,.76],[.947,.67],[.982,.56],[.947,.45],[.982,.34],[.947,.23]],Array.from({length:39},(_,i)=>[.982-.964*i/38,i%2?.10:.02]),[[.018,.23],[.053,.34],[.018,.45],[.053,.56],[.018,.67],[.053,.76]])],
      ticket:[[[.055,.96],[.945,.96],[.98,.90],[.98,.66],[.94,.59],[.94,.42],[.98,.35],[.98,.11],[.94,.045],[.06,.045],[.02,.11],[.02,.35],[.06,.42],[.06,.59],[.02,.66],[.02,.90]]],
      shop:[[[.016,.64],[.051,.82],[.10,.96],[.165,.96],[.208,.88],[.90,.88],[.97,.76],[.98,.29],[.93,.17],[.20,.17],[.145,.055],[.087,.095],[.04,.25],[.016,.39]]],
      blade:[[[.025,.90],[.77,.90],[.77,.98],[.995,.50],[.77,.015],[.77,.105],[.025,.105],[.082,.51]]],
      shield:[[[.055,.92],[.19,.98],[.32,.93],[.51,.98],[.70,.93],[.83,.98],[.95,.92],[.982,.80],[.962,.26],[.90,.16],[.63,.13],[.5,.028],[.37,.13],[.10,.16],[.038,.26],[.018,.80]]],
      wall:[[[.014,.90],[.14,.92],[.17,.98],[.40,.95],[.47,.99],[.62,.95],[.82,.97],[.87,.92],[.983,.91],[.983,.10],[.94,.055],[.18,.055],[.12,.10],[.014,.10]]],
      slats:[[[.018,.96],[.94,.96],[.977,.89],[.962,.55],[.04,.53],[.018,.61]],
             [[.047,.467],[.982,.485],[.969,.078],[.929,.045],[.025,.062],[.025,.39]]],
      plate:[[[.045,.95],[.955,.95],[.986,.86],[.986,.14],[.955,.052],[.045,.052],[.014,.14],[.014,.86]]],
      tank:[[[.015,.80],[.065,.91],[.23,.97],[.77,.97],[.935,.91],[.985,.80],[.985,.19],[.935,.085],[.79,.04],[.21,.04],[.065,.085],[.015,.19]]],
      stone:[[[.021,.04],[.021,.70],[.044,.72],[.080,.86],[.23,.90],[.29,.97],[.70,.97],[.77,.90],[.92,.86],[.966,.73],[.981,.70],[.981,.04]]],
      pennant:[[[.012,.963],[.815,.928],[.988,.99],[.908,.50],[.985,.014],[.81,.086],[.012,.038]]],
      marquee:[[[.02,.74],[.046,.83],[.12,.83],[.14,.943],[.39,.943],[.43,.995],[.57,.995],[.61,.943],[.86,.943],[.88,.83],[.952,.83],[.982,.74],[.982,.24],[.91,.17],[.85,.17],[.82,.069],[.57,.069],[.505,.014],[.43,.069],[.18,.069],[.15,.17],[.08,.17],[.02,.24]]],
      dialbox:[[[.016,.82],[.055,.92],[.28,.92],[.31,.97],[.91,.97],[.98,.83],[.98,.17],[.937,.065],[.20,.065],[.17,.035],[.04,.035],[.015,.12]]]
    };

    // Monochrome pictograms have an especially bold silhouette so a forklift,
    // hot dog or cactus still reads when its whole badge is only fifteen pixels wide.
    function signIcon(ctx,name,x,y,ink) {
      ctx.save();ctx.translate(x,y);ctx.scale(.89,.89);
      ctx.fillStyle=ctx.strokeStyle=ink;ctx.lineWidth=6;ctx.lineCap='round';ctx.lineJoin='round';
      const path=(points,closed=false)=>{
        ctx.beginPath();points.forEach(([u,v],i)=>i?ctx.lineTo(u,v):ctx.moveTo(u,v));
        if(closed){ctx.closePath();ctx.fill();}else ctx.stroke();
      };
      const disk=(u,v,r,outline=false)=>{ctx.beginPath();ctx.arc(u,v,r,0,TAU);if(outline)ctx.stroke();else ctx.fill();};
      const rect=(u,v,w,h)=>ctx.fillRect(u,v,w,h);
      switch(name) {
        case 'peak':
          path([[-31,23],[-8,-23],[2,-9],[12,-25],[31,23],[-31,23]]);path([[-15,-8],[-8,-4],[-3,-10]]);break;
        case 'level':
          ctx.strokeRect(-29,-14,58,28);path([[-8,-12],[-8,12]]);path([[8,-12],[8,12]]);disk(0,0,4);break;
        case 'parachute':
          path([[-29,-5],[-23,-18],[-12,-25],[0,-28],[13,-25],[24,-18],[29,-5],[-29,-5]]);
          path([[-27,-4],[0,23],[27,-4]]);path([[0,-3],[0,22]]);rect(-6,21,12,8);break;
        case 'spring':
          path([[-19,-27],[17,-27],[22,-20],[-22,-11],[22,-3],[-22,6],[22,14],[16,23],[-20,23]]);break;
        case 'boot':
          path([[-21,-27],[2,-27],[0,3],[9,10],[24,12],[28,18],[25,24],[-22,24],[-24,13],[-18,7]],true);break;
        case 'plumb':
          path([[0,-31],[0,-8]]);path([[0,-9],[15,1],[14,12],[0,29],[-14,12],[-15,1]],true);break;
        case 'bridge':
          path([[-29,12],[29,12]]);for(const x of [-17,17]){path([[x,-22],[x,23]]);path([[x,-18],[x-11,8]]);path([[x,-18],[x+11,8]]);}break;
        case 'cactus':
          ctx.lineWidth=9;path([[0,29],[0,-29]]);path([[0,7],[-18,7],[-24,1],[-24,-12]]);
          path([[1,-3],[15,-3],[22,-11],[22,-23]]);break;
        case 'chip':
          ctx.strokeRect(-16,-16,32,32);rect(-8,-8,16,16);
          for(const u of [-10,1,12])for(const side of [-1,1]){path([[u,side*20],[u,side*29]]);path([[side*20,u],[side*29,u]]);}break;
        case 'rock':
          path([[-28,17],[-17,-8],[1,-25],[22,-12],[31,15],[14,24],[-14,24]],true);break;
        case 'mirage':
          disk(11,-13,10);path([[-28,3],[-12,-9],[-2,-2],[6,-7],[26,3]]);
          path([[-27,12],[-8,15],[10,11],[28,13]]);path([[-18,22],[4,24],[20,21]]);break;
        case 'cloud':
          ctx.lineWidth=8;path([[-24,17],[-31,9],[-28,-1],[-20,-7],[-13,-6],[-8,-17],[3,-21],[15,-16],[18,-7],[26,-5],[31,3],[29,13],[22,17],[-24,17]]);break;
        case 'fuel':
          ctx.strokeRect(-25,-22,29,48);rect(-18,-16,15,14);path([[5,-11],[14,-11],[18,-4],[18,14],[24,19],[29,15],[29,-12],[21,-22]]);break;
        case 'burger':
          path([[-31,-4],[-27,-16],[-16,-24],[-2,-28],[14,-25],[25,-17],[31,-4]],true);
          path([[-29,3],[-19,8],[-9,3],[0,8],[12,3],[23,8],[30,4]]);rect(-28,15,56,9);break;
        case 'forklift':
          path([[-31,9],[-31,-5],[-17,-5],[-16,-22],[-1,-22],[7,-7],[7,12],[-30,12]],true);
          path([[12,-25],[12,16],[31,16]]);disk(-22,18,7);disk(3,18,7);break;
        case 'dino':
          path([[-30,5],[-15,7],[-4,0],[2,-17],[10,-24],[28,-23],[30,-12],[16,-12],[19,-5],[11,-4],[7,9],[-2,15],[-3,25],[-11,25],[-10,16],[-17,14],[-27,9]],true);break;
        case 'loop':
          ctx.beginPath();ctx.arc(-2,1,22,-.22,TAU-.99);ctx.stroke();
          path([[17,-28],[26,-12],[6,-14]],true);break;
        case 'bolt':
          path([[2,-30],[-22,5],[-5,3],[-11,30],[25,-10],[5,-7],[14,-30]],true);break;
        case 'crane':
          path([[-27,19],[-17,-21],[22,-21]]);path([[-27,-13],[-4,-28],[22,-21]]);path([[20,-18],[20,2],[25,5],[22,13],[14,13]]);rect(-32,20,22,6);break;
        case 'trees':
          for(const [u,v,r] of [[-13,4,18],[10,-5,23]]){path([[u,-r+v],[u-r*.7,v+1],[u-r*.38,v+1],[u-r,v+r*.66],[u+r,v+r*.66],[u+r*.38,v+1],[u+r*.7,v+1]],true);rect(u-3,v+r*.52,6,15);}break;
        case 'bell':
          path([[-24,12],[-15,2],[-13,-13],[-7,-21],[8,-21],[14,-13],[16,2],[24,12],[-24,12]],true);
          disk(0,21,5);path([[-28,-10],[-23,-21]]);path([[28,-10],[23,-21]]);break;
        case 'mute':
          path([[-28,-7],[-15,-7],[0,-23],[0,23],[-15,7],[-28,7]],true);
          path([[10,-10],[29,11]]);path([[29,-10],[10,11]]);break;
        case 'hotdog':
          ctx.rotate(-.42);ctx.lineWidth=11;path([[-25,-5],[25,-5]]);ctx.lineWidth=6;path([[-30,3],[-22,14],[20,14],[31,3]]);break;
        case 'air':
          path([[-30,8],[-18,2],[-10,-11],[3,-17],[14,-16]]);path([[-4,-27],[15,-17],[1,-6]],true);
          path([[4,24],[28,9],[31,24]],true);break;
        case 'tire':
          ctx.lineWidth=10;disk(0,0,23,true);ctx.lineWidth=5;disk(0,0,9,true);
          for(let j=0;j<5;j++){const a=j*TAU/5;path([[17*Math.cos(a),17*Math.sin(a)],[23*Math.cos(a+.16),23*Math.sin(a+.16)]]);}break;
        case 'coin':
          disk(0,0,26,true);ctx.font='bold 41px Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('$',0,2);break;
        case 'pizza':
          path([[-26,-14],[0,-24],[28,-16],[1,28],[-26,-14]]);path([[-20,-9],[0,-16],[22,-10]]);disk(-5,-2,4);disk(8,2,3.5);disk(0,11,3.5);break;
        case 'drop':
          path([[-23,-25],[-5,-25],[-5,0],[5,0],[5,-25],[20,-25],[20,0],[28,0],[0,26],[-28,0],[-23,0]],true);break;
        case 'axle':
          rect(-30,-20,8,38);rect(22,-20,8,38);path([[-22,-4],[-9,-4],[-3,-14],[5,11],[12,-2],[21,-2]]);break;
        case 'griddle':
          for(const y of [13,3,-8]){ctx.beginPath();ctx.ellipse(0,y,26,7,0,0,TAU);ctx.stroke();}
          rect(-6,-22,13,8);break;
        case 'ghost':
          path([[-22,24],[-22,-6],[-18,-17],[-9,-24],[2,-26],[15,-22],[22,-11],[23,25],[14,19],[5,26],[-4,18],[-12,26],[-22,20]]);
          disk(-7,-5,3.3);disk(8,-5,3.3);break;
        case 'depth':
          path([[-29,-12],[-17,-16],[-4,-12],[10,-16],[28,-13]]);path([[-20,0],[-10,0],[-10,8],[0,8],[0,16],[12,16],[12,25],[26,25]]);break;
        case 'rail':
          ctx.strokeRect(-19,-24,38,35);rect(-13,-18,25,11);disk(-11,2,3);disk(11,2,3);
          path([[-10,13],[-22,27]]);path([[10,13],[22,27]]);path([[-16,21],[16,21]]);break;
        case 'wind':
          disk(3,0,19,true);path([[-13,7],[4,-16],[9,14],[-9,-7],[20,-1],[-9,10]]);path([[-31,-15],[-18,-15]]);path([[-29,14],[-21,14]]);break;
        case 'moon':
          path([[10,-25],[-4,-20],[-14,-9],[-15,7],[-5,21],[10,24],[21,17],[12,16],[4,11],[-1,1],[0,-9],[5,-19]],true);
          path([[23,-18],[23,-9]]);path([[19,-13],[27,-13]]);break;
        case 'siren':
          path([[-23,16],[-18,-7],[-11,-16],[0,-19],[12,-15],[18,-7],[23,16],[-23,16]],true);
          rect(-29,20,58,5);path([[-26,-12],[-30,-19]]);path([[25,-12],[30,-19]]);break;
        case 'cone':
          path([[-20,18],[-5,-26],[5,-26],[20,18]]);path([[-15,4],[14,4]]);rect(-27,18,54,7);break;
        case 'logs':
          for(const [u,v] of [[-11,11],[12,11],[1,-8]]){disk(u,v,10,true);disk(u,v,2);}
          break;
        case 'moose':
          path([[-8,24],[-12,4],[-21,-2],[-24,-15],[-30,-21]]);path([[-21,-2],[-13,-7],[-13,-17]]);
          path([[8,24],[12,4],[21,-2],[24,-15],[30,-21]]);path([[21,-2],[13,-7],[13,-17]]);
          path([[-12,1],[0,-2],[12,1],[9,19],[0,26],[-9,19]],true);break;
        case 'dial':
          ctx.beginPath();ctx.arc(0,4,25,Math.PI*.83,Math.PI*2.17);ctx.stroke();path([[0,6],[16,-12]]);disk(0,6,5);break;
        case 'barricade':
          ctx.strokeRect(-27,-14,54,25);for(const u of [-20,-3,13])path([[u,-12],[u+7,8]]);
          path([[-18,12],[-18,23]]);path([[18,12],[18,23]]);break;
        case 'raccoon':
          path([[-25,-13],[-25,-27],[-11,-19],[0,-22],[11,-19],[25,-27],[24,-11],[30,-2],[17,16],[0,24],[-17,16],[-30,-2],[-25,-13]]);
          path([[-19,-2],[-10,-5],[-3,1]]);path([[3,1],[10,-5],[19,-2]]);disk(0,11,4);break;
        case 'corn':
          ctx.beginPath();ctx.ellipse(0,-5,11,22,0,0,TAU);ctx.stroke();
          path([[-23,-1],[-13,7],[0,25],[12,12],[24,-3]]);path([[-7,-9],[7,-9]]);path([[-8,0],[8,0]]);break;
        case 'wrench':
          path([[-26,19],[0,-6],[-1,-17],[6,-25],[16,-26],[11,-15],[18,-9],[27,-14],[26,-3],[18,5],[6,6],[-19,27]],true);break;
        case 'wave':
          path([[-30,13],[-23,10],[-17,2],[-11,-12],[-2,-21],[11,-21],[18,-15],[7,-16],[2,-7],[8,4],[19,10],[30,8]]);break;
        case 'camera':
          ctx.strokeRect(-27,-14,54,35);path([[-14,-15],[-10,-23],[8,-23],[14,-15]]);disk(0,3,10,true);rect(16,-8,6,4);break;
        case 'receipt':
          path([[-19,-26],[19,-26],[19,25],[12,20],[6,25],[0,20],[-7,25],[-13,20],[-19,25],[-19,-26]]);
          path([[-11,-12],[11,-12]]);path([[-11,-2],[8,-2]]);break;
        case 'trophy':
          path([[-17,-21],[17,-21],[14,0],[7,8],[-7,8],[-14,0]],true);path([[-18,-16],[-29,-16],[-25,-2],[-13,2]]);
          path([[18,-16],[29,-16],[25,-2],[13,2]]);rect(-3,5,6,15);rect(-13,20,26,6);break;
        case 'bread':
          path([[-21,23],[-21,-3],[-29,-7],[-29,-17],[-22,-23],[-7,-26],[11,-26],[24,-23],[29,-17],[28,-6],[21,-3],[21,23],[-21,23]]);
          for(const [u,v] of [[-9,-11],[9,-6],[0,6]])disk(u,v,2.5);break;
        case 'sun':
          disk(0,0,14,true);
          for(let j=0;j<8;j++){const a=j*TAU/8;path([[21*Math.cos(a),21*Math.sin(a)],[29*Math.cos(a),29*Math.sin(a)]]);}
          break;
        case 'clock':
          disk(0,0,25,true);path([[0,-15],[0,1],[13,8]]);break;
        case 'lizard':
          path([[-30,16],[-18,18],[-9,7],[-1,-7],[10,-11],[21,-12],[27,-6],[19,-1],[9,-2],[4,6],[-12,18],[-23,22]],true);
          path([[-7,6],[-11,-1],[-20,-2]]);path([[3,6],[10,14],[18,14]]);disk(15,-11,3);break;
        case 'spore':
          path([[-29,0],[-24,-13],[-10,-24],[2,-26],[16,-21],[27,-9],[30,0],[-29,0]]);
          path([[-7,1],[-10,22],[-4,26],[6,26],[10,22],[6,2]]);disk(-10,-11,3.4);disk(8,-13,3);break;
        case 'keys':
          disk(-13,-9,12,true);path([[-5,-1],[16,21],[25,12]]);path([[6,11],[14,3]]);break;
        case 'bowl':
          path([[-29,-2],[29,-2],[24,9],[16,17],[6,21],[-5,21],[-19,15],[-26,7],[-29,-2]]);
          path([[-13,25],[14,25]]);for(const u of [-12,0,12])path([[u,-10],[u+3,-17],[u-1,-23]]);break;
        case 'pond':
          path([[-30,10],[-20,5],[-6,8],[7,4],[16,6],[30,2]]);path([[-24,22],[-12,17],[2,19],[14,15],[25,17]]);
          path([[-12,-3],[-12,-22]]);path([[-12,-7],[-24,-18]]);path([[7,-5],[17,-21]]);break;
        case 'ferret':
          path([[-30,0],[-15,2],[-7,-12],[2,-15],[8,-24],[15,-19],[17,-15],[30,-9],[26,-3],[15,-2],[8,7],[3,10],[-1,23],[-9,23],[-7,12],[-18,12]],true);
          path([[-26,0],[-30,-9]]);break;
        case 'frog':
          disk(-13,-12,8,true);disk(13,-12,8,true);
          path([[-21,-7],[-27,1],[-23,13],[-12,21],[1,24],[16,18],[25,9],[26,0],[21,-6]]);
          path([[-14,6],[-3,11],[8,10],[15,5]]);break;
        case 'magnet':
          path([[-23,-22],[-23,6],[-18,16],[-10,22],[0,25],[12,21],[20,13],[23,4],[23,-22],[11,-22],[11,5],[6,12],[-3,13],[-10,7],[-11,-22],[-23,-22]],true);break;
        case 'claw':
          path([[0,-27],[0,-12],[-12,-8],[-23,9],[-15,22],[-6,15]]);
          path([[0,-12],[13,-8],[23,8],[16,22],[6,14]]);disk(0,-12,5);break;
      }
      ctx.restore();
    }

    function makeBulletinTexture(page){
      const key=bulletinPages[page].key;
      if(noticeTextures.has(key))return noticeTextures.get(key);
      // A 384px market sign covers six times its normal projected cockpit
      // width. Smaller source pages keep the CPU renderer's texture heap lean.
      const resolution=page<2?1:.75;
      const canvas=document.createElement('canvas');canvas.width=aw*resolution;canvas.height=bulletinCellH*4*resolution;
      const g=canvas.getContext('2d'),h=bulletinCellH;
      g.scale(resolution,resolution);
      // The type fills the sign face. Fit each line by measured ink bounds so
      // different installed system fonts still produce two large, centered lines.
      function headline(text,x,cy,available,ink,style){
        const size=82;
        g.font=style==='motel'?'italic 900 '+size+'px Display, Impact, sans-serif':
          style==='terminal'?'700 '+size+'px Body, Arial, sans-serif':'700 '+size+'px Cond, "Arial Narrow", Arial, sans-serif';
        g.textAlign='center';g.textBaseline='alphabetic';
        const m=g.measureText(text),ascent=m.actualBoundingBoxAscent||size*.73,descent=m.actualBoundingBoxDescent||0;
        const squeeze=Math.min(1,available/Math.max(1,m.width));
        g.save();g.translate(x,cy+(ascent-descent)*.5);g.scale(squeeze,Math.min(1,64/(ascent+descent)));
        g.fillStyle=ink;g.fillText(text,0,0);g.restore();
      }
      messages.slice(page*8,page*8+8).forEach((entry,i)=>{
        const [, ,style,icon,upper,lower]=entry,colors=signPaint(style,icon);
        g.save();g.translate(i%2*cw,Math.floor(i/2)*h);
        g.beginPath();g.rect(0,0,cw,h);g.clip();
        const cut=silhouettes[style];
        if(cut){
          // The canvas-only renderer uses this very sheet, including the
          // scallops and the open gap between two destination blades.
          g.beginPath();
          for(const contour of cut){
            contour.forEach(([u,v],j)=>j?g.lineTo(u*cw,(1-v)*h):g.moveTo(u*cw,(1-v)*h));
            g.closePath();
          }
          g.clip();
        }
        g.fillStyle=colors.face;g.fillRect(0,0,cw,h);
        g.strokeStyle=style==='terminal'?'#627489':colors.ink;g.lineWidth=style==='motel'?4:3;
        if(cut){
          const border=style==='shop'||style==='wall'?colors.secondary:colors.ink;
          for(const points of cut){
            g.beginPath();
            points.forEach(([u,v],k)=>{
              const x=(.5+(u-.5)*.964)*cw,y=(.5+(.5-v)*.92)*h;
              if(k)g.lineTo(x,y);else g.moveTo(x,y);
            });
            g.closePath();g.strokeStyle=border;g.lineWidth=3;g.stroke();
          }
          if(style==='survey'){
            g.strokeStyle='#36686b';g.lineWidth=2;
            g.beginPath();g.arc(49,h/2,39,Math.PI*.82,Math.PI*2.17);g.stroke();
            for(let i=0;i<15;i++){const a=Math.PI*(.81+i*.10);g.beginPath();g.moveTo(49+36*Math.cos(a),h/2+36*Math.sin(a));g.lineTo(49+41*Math.cos(a),h/2+41*Math.sin(a));g.stroke();}
          }else if(style==='flight'||style==='ridgeline'){
            g.fillStyle=colors.trim;
            for(let i=0;i<3;i++){g.beginPath();g.moveTo(18+i*8,43);g.lineTo(33+i*8,37);g.lineTo(26+i*8,45);g.lineTo(15+i*8,49);g.fill();}
            g.fillRect(99,h*.50,cw*.64,2);
          }else if(style==='stamp'){
            g.fillStyle=colors.secondary;for(let i=0;i<8;i++)g.fillRect(88,32+i*16,2,6);
          }else if(style==='spring'){
            g.strokeStyle='#ee85af';g.lineWidth=2;g.beginPath();g.moveTo(98,h*.51);
            for(let i=0;i<14;i++)g.lineTo(100+i*10,h*.51+(i%2?2:-2));g.stroke();
          }
          if(style==='wall'){
            g.strokeStyle='#876175';g.lineWidth=2;
            for(let y=41;y<h-12;y+=44){g.beginPath();g.moveTo(12,y);g.lineTo(cw-9,y);g.stroke();}
            for(let j=0;j<4;j++)for(let k=0;k<4;k++){const x=33+116*k+(j%2)*49;g.beginPath();g.moveTo(x,41+j*44);g.lineTo(x,82+j*44);g.stroke();}
          }
          if(style==='ticket'){
            g.fillStyle=colors.ink;for(let y=33;y<165;y+=19)g.fillRect(93,y,3,9);
          }
          if(style==='slats'){
            for(const x of [18,481])for(const y of [34,69,121,155]){g.fillStyle='#d8a57c';g.fillRect(x,y,7,4);}
          }
          if(style==='plate'){
            g.strokeStyle='#f1f8f6';g.lineWidth=3;g.strokeRect(16,19,cw-32,h-38);
            g.fillStyle='#405575';for(const x of [46,cw-60])for(const y of [18,h-25])g.fillRect(x,y,14,7);
          }else if(style==='stone'){
            g.fillStyle='#85839a';g.fillRect(14,h*.827,cw-28,7);g.fillStyle='#59566e';g.fillRect(14,h*.865,cw-28,8);
            for(const x of [22,481]){g.fillRect(x,62,4,73);g.fillStyle='#a3a0af';g.fillRect(x+5,62,3,73);}
          }else if(style==='dialbox'){
            g.fillStyle='#102328';g.fillRect(89,h*.485,cw-104,6);
            g.strokeStyle='#55796e';g.lineWidth=1;
            for(let x=105;x<cw-11;x+=27){g.beginPath();g.moveTo(x,26);g.lineTo(x,h-26);g.stroke();}
            g.fillStyle='#a3ff99';for(let i=0;i<3;i++)g.fillRect(29+14*i,28,8,4);
          }else if(style==='tank'){
            for(const y of [28,h-30]){g.fillStyle='#6c9e94';g.fillRect(16,y,cw-32,2);
              for(let x=32;x<cw-15;x+=30)g.fillRect(x,y-4,3,3);}
          }else if(style==='pennant'){
            g.fillStyle='#b4e6dc';for(let y=25;y<h-22;y+=14)g.fillRect(20,y,3,8);
          }else if(style==='marquee'){
            g.fillStyle='#ffe9a6';
            for(let x=92;x<cw-70;x+=24){g.fillRect(x,25,5,4);g.fillRect(x,h-29,5,4);}
          }
        }else g.strokeRect(6,6,cw-12,h-12);
        if(style==='hazard'){
          g.fillStyle=colors.ink;
          for(let x=14;x<cw-12;x+=32){g.beginPath();g.moveTo(x,8);g.lineTo(x+16,8);g.lineTo(x+9,16);g.lineTo(x-7,16);g.fill();}
        }else if(style==='motel'){
          for(let k=0;k<13;k++){g.fillStyle=k%2?'#ffbfbd':'#ffe7aa';g.fillRect(19+k*39,h-15,8,5);}
        }else if(style==='terminal'){
          g.fillStyle=colors.trim;g.fillRect(12,10,54,6);g.fillRect(cw-66,h-17,54,6);
        }else if(style==='pit'){
          for(let j=0;j<2;j++)for(let k=0;k<11;k++)if((j+k)%2===0){g.fillStyle=colors.ink;g.fillRect(8+k*6,12+j*6,6,6);}
        }
        g.strokeStyle=style==='terminal'?'#60788c':colors.ink;g.lineWidth=2;
        if(!cut||style==='shop'){g.beginPath();g.moveTo(90,38);g.lineTo(90,h-39);g.stroke();}
        const iconX=style==='blade'||style==='ticket'?56:48;
        if(style==='slats'){
          g.save();g.translate(49,53);g.scale(.72,.72);signIcon(g,icon,0,0,colors.ink);g.restore();
          g.fillStyle=colors.trim;g.fillRect(38,126,19,5);g.fillRect(32,137,31,5);
        }else signIcon(g,icon,iconX,h/2,style==='terminal'||style==='shop'||style==='wall'?colors.secondary:colors.ink);
        const inset=style==='blade'?74:style==='pennant'||style==='flight'?62:style==='marquee'?43:cut?28:12,left=cut?99:95;
        const textX=(left+cw-inset)/2,usable=cw-inset-left-10;
        const upperY=cut?(style==='slats'?52:63):57,lowerY=cut?(style==='slats'?138:127):135;
        headline(upper,textX,upperY,usable,colors.ink,style);headline(lower,textX,lowerY,usable,colors.secondary,style);
        g.restore();
      });
      const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=8;
      noticeTextures.set(key,texture);
      return texture;
    }

    // Track billboards, cloth, gate blades and stand roofs are rectangles in
    // world space. Checking their planes during placement catches readable-
    // looking signs that would actually sit behind another sign from the cab.
    function plate(a,b,d){
      const u=b.map((v,i)=>v-a[i]),v=d.map((k,i)=>k-a[i]),n=cross(u,v);
      const cornerX=b[0]+d[0]-a[0],cornerZ=b[2]+d[2]-a[2];
      return {a,u,v,n,du:u[0]*u[0]+u[1]*u[1]+u[2]*u[2],dv:v[0]*v[0]+v[1]*v[1]+v[2]*v[2],
        minX:Math.min(a[0],b[0],d[0],cornerX)-.01,maxX:Math.max(a[0],b[0],d[0],cornerX)+.01,
        minZ:Math.min(a[2],b[2],d[2],cornerZ)-.01,maxZ:Math.max(a[2],b[2],d[2],cornerZ)+.01};
    }

    function blocksRay(rect,from,to){
      if(Math.max(from[0],to[0])<rect.minX||Math.min(from[0],to[0])>rect.maxX||
         Math.max(from[2],to[2])<rect.minZ||Math.min(from[2],to[2])>rect.maxZ)return false;
      const ox=rect.a[0]-from[0],oy=rect.a[1]-from[1],oz=rect.a[2]-from[2];
      const dx=to[0]-from[0],dy=to[1]-from[1],dz=to[2]-from[2],n=rect.n;
      const denom=n[0]*dx+n[1]*dy+n[2]*dz;
      if(Math.abs(denom)<.001)return false;
      const t=(n[0]*ox+n[1]*oy+n[2]*oz)/denom;
      if(t<.025||t>.98)return false;
      const x=dx*t-ox,y=dy*t-oy,z=dz*t-oz,u=rect.u,v=rect.v;
      const a=x*u[0]+y*u[1]+z*u[2],b=x*v[0]+y*v[1]+z*v[2];
      return a>=0&&a<=rect.du&&b>=0&&b<=rect.dv;
    }

    function facePlate(p,w,h,bottom,z=0){
      return plate(vertex(p,-w/2,bottom,z),vertex(p,w/2,bottom,z),vertex(p,-w/2,bottom+h,z));
    }

    function gateObstructions(){
      const drag=course.id==='indiana',start=drag?6.3:0;
      const gates=[{s:start,large:true},...course.gates.filter(g=>!g.finish||!course.loop).map(g=>({s:g.s,large:g.finish}))];
      for(const {s,large} of gates){
        const q=course.at(s),yaw=Math.atan2(q.dx,q.dz),y=ground(q.x,q.z),h=large?(drag?7.1:7.8):4.95;
        if(large)signObstructions.push(facePlate(frame(q.x,y,q.z,yaw),course.width*1.16+.58,1.60,h-1.05));
        for(const side of [-1,1]){
          const p=course.at(s,side*course.width*.58),f=frame(p.x,y,p.z,yaw);
          signObstructions.push(facePlate(f,large?.45:.29,h,0));
          if(!large)signObstructions.push(facePlate(relative(f,side*.91,0,0),1.82,3.18,h-3.18));
        }
      }
      if(drag){
        const q=course.at(12,course.width*.57),p=frame(q.x,ground(q.x,q.z),q.z,Math.atan2(q.dx,q.dz));
        signObstructions.push(facePlate(p,1.26,2.22,2.58));
      }
    }

    function panel(a,b,c,d,cell,batch=print) {
      signObstructions.push(plate(a,b,d));
      batch.positions.push(...a,...b,...c,...a,...c,...d);
      const hh=batch===print?ch:bulletinCellH,height=hh*4,x=(cell%2)*cw,y=Math.floor(cell/2)*hh;
      const l=(x+1)/aw,r=(x+cw-1)/aw,top=1-(y+1)/height,bottom=1-(y+hh-1)/height;
      batch.uvs.push(l,bottom,r,bottom,r,top,l,bottom,r,top,l,top);
    }

    function board(p,w,h,cell,bottom=2.3) {
      const z=.15;
      for(const x of [-w*.32,w*.32]) {
        box(p,x,bottom*.5+.18,0,.18,bottom+.36,.21,'#515264');
        line(p,[x,bottom-.05,-.04],[x,.3,-1],.065,.065,'#454757',4);
      }
      box(p,0,bottom+h/2,0,w+.25,h+.27,.24,'#2b3848');
      emit(()=>box(p,0,bottom+h+.13,.03,w*.99,.07,.17,cell===cells.radio?pink:mint));
      panel(vertex(p,-w/2,bottom,z),vertex(p,w/2,bottom,z),
            vertex(p,w/2,bottom+h,z),vertex(p,-w/2,bottom+h,z),cell);
    }

    function roadBoard(f,side,cell,w=8.4,h=2.55) {
      const p=courseFrame(f,side*(half+5.2));
      if(nearestDistance(p.x,p.z)<half+2) return;
      p.yaw+=side>0?-Math.PI*.70:Math.PI*.70;
      const placed=frame(p.x,p.y,p.z,p.yaw);
      board(placed,w,h,cell);reserve(placed,w*.49);
    }

    const cutTriangles=new Map();

    // Market signs are salvaged objects with their own load paths. The tower
    // stands on four legs, the pennant hangs from a yardarm, and the old
    // picture-house sign projects a shallow, lamp-lined canopy.
    const marketStyles=new Set(['tank','plate','stone','pennant','marquee','dialbox','ridgeline','survey','flight','spring','stamp']);
    function marketMount(p,w,h,bottom,style,trim,integrated){
      const steel='#758398',dark='#424c63',top=bottom+h;
      const low=integrated?Math.max(.15,bottom-3.4):.15;
      function upright(x,z,upper,r=.13,lower=low){
        line(p,[x,lower-.09,z],[x,upper,z],r,r*.91,steel,5,true);
        if(lower<.3){box(p,x,.18,z,.61,.36,.64,'#8590a0');solidCircle(p,r+.1,x,z);}
      }
      if(style==='ridgeline'||style==='flight'){
        // The cut peaks sit atop a triangulation tripod. Airfield wings hang
        // from a single raked mast and expose their ribs from the rear.
        if(style==='ridgeline'){
          for(const [x,z] of [[-.34,-.62],[.34,-.62],[0,.02]]){
            line(p,[w*x,low,z],[0,bottom+h*.62,-.23],.15,.09,steel,5);
            if(!integrated){box(p,w*x,.16,z,.56,.32,.63,dark);solidCircle(p,.21,w*x,z);}
          }
        }else{
          upright(-w*.30,-.31,top-.42,.17);
          for(const k of [.02,.22,.40])line(p,[-w*.30,bottom+.18,-.47],[w*k,top-.48,-.42],.089,.055,steel,5);
        }
        emit(()=>box(p,w*.09,bottom+h*.16,.13,w*.54,.07,.12,trim));
      }else if(style==='spring'){
        for(const x of [-w*.29,w*.29]){
          upright(x,-.23,bottom+.41,.15);
          const coil=Math.min(1.45,bottom-low-.08);
          for(let i=0;i<10;i++){
            const yz=bottom-.08-coil+i*coil/10;
            line(p,[x+.29*Math.cos(i*1.91),yz,-.23+.29*Math.sin(i*1.91)],
              [x+.29*Math.cos((i+1)*1.91),yz+coil/10,-.23+.29*Math.sin((i+1)*1.91)],.079,.079,trim,4);
          }
        }
      }else if(style==='stamp'||style==='survey'){
        upright(-w*.31,-.26,top-.19,.13);upright(w*.32,-.26,top-.19,.13);
        if(style==='survey'){
          const x=w*.458;
          line(p,[x,top-.24,-.26],[x,bottom-.62,-.26],.036,.036,steel,4);
          line(p,[x,bottom-.61,-.26],[x,bottom-.84,-.26],.10,.25,trim,6);
          line(p,[x,bottom-.84,-.26],[x,bottom-1.22,-.26],.25,.013,trim,6);
        }
      }else if(style==='tank'){
        const zc=-1.05,rz=1.15,legsBottom=integrated?low:.16;
        for(const x of [-w*.32,w*.32])for(const z of [zc-.64,zc+.62])upright(x,z,bottom+h*.13,.15,legsBottom);
        for(const z of [zc-.64,zc+.62]){
          line(p,[-w*.32,legsBottom+.22,z],[w*.32,bottom+.25,z],.075,.075,steel,5);
          line(p,[w*.32,legsBottom+.22,z],[-w*.32,bottom+.25,z],.075,.075,steel,5);
        }
        const levels=[[bottom-.15,.80],[bottom+h*.13,1],[bottom+h*.88,1],[top+.04,.88],[top+.62,.12]];
        const colors=['#466b70','#497c7e','#7f9e94','#69888d'];
        for(let j=1;j<levels.length;j++){
          const [yb,rb]=levels[j-1],[yt,rt]=levels[j];
          for(let k=0;k<10;k++){
            const point=(step,level,scale)=>{const a=step*TAU/10;return vertex(p,w*.49*scale*Math.cos(a),level,zc+rz*scale*Math.sin(a));};
            quad(point(k,yb,rb),point(k+1,yb,rb),point(k+1,yt,rt),point(k,yt,rt),color(colors[j-1],.87+.12*(k%3)));
          }
        }
        line(p,[0,top+.5,zc],[0,top+1.03,zc],.20,.15,'#819098',7,true);
        for(const x of [w*.464,w*.496])line(p,[x,legsBottom,-.91],[x,top-.1,-.91],.048,.048,steel,5);
        for(let y=legsBottom+.41;y<top-.17;y+=.63)line(p,[w*.464,y,-.91],[w*.496,y,-.91],.041,.041,steel,4);
        emit(()=>{box(p,0,bottom+.23,.07,w*.77,.065,.13,trim);box(p,0,top+1.04,zc,.26,.17,.25,'#ff7891');});
      }else if(style==='stone'){
        const foot=integrated?low:.18,hx=w*.47;
        box(p,0,foot+.17,-.20,w*.99,.34,1.04,'#747586');
        box(p,0,(foot+bottom+.38)*.5,-.24,w*.91,Math.max(.23,bottom+.38-foot),.72,'#6b697e');
        box(p,0,bottom+.09,-.16,hx*2,.16,.85,'#a6a5af');
        if(!integrated)for(let k=-4;k<=4;k++)solidCircle(p,.37,k*w*.103,-.18,'stone');
      }else if(style==='pennant'){
        const mast=-w*.486;
        upright(mast,-.12,top+.58,.17);
        line(p,[mast,top+.27,-.17],[w*.45,top+.17,-.17],.10,.055,steel,5);
        line(p,[mast,top+.24,-.21],[w*.08,top-.11,-.21],.053,.045,steel,5);
        // A string of tin racing pennants droops behind the swallowtail sign.
        const knots=[];
        for(let i=0;i<6;i++)knots.push([-w*.44+w*.168*i,top+.25-.72*Math.sin(Math.PI*i/5),-.35]);
        for(let i=0;i<5;i++){
          const a=knots[i],b=knots[i+1],m=a.map((v,k)=>(v+b[k])*.5);
          line(p,a,b,.034,.034,'#d4d6c7',4);
          tri(vertex(p,...a),vertex(p,...b),vertex(p,m[0],m[1]-.52,m[2]-.10),i%2?trim:'#b1e9df');
        }
      }else if(style==='marquee'){
        for(const x of [-w*.31,w*.31])upright(x,-.53,top-.43,.16);
        for(const z of [-.94,.10]){
          box(p,0,bottom+.19,z,w*.75,.13,.16,'#945761');
          box(p,0,top-.25,z,w*.79,.15,.18,'#c66d6e');
        }
        for(const side of [-1,1]){
          const x=side*w*.44;
          line(p,[x,top-.31,-.96],[x,top-.31,.12],.085,.085,'#e6bd8e',5);
          line(p,[x,bottom+.36,-.94],[x,bottom+.36,.14],.073,.073,'#d78a78',5);
        }
        emit(()=>{for(let i=-4;i<=4;i++)for(const y of [bottom+.18,top-.25])
          box(p,i*w*.088,y,.125,.10,.12,.09,i%2?'#ffecc5':trim);});
      }else if(style==='plate'){
        upright(-w*.30,-.14,bottom+h*.74,.105);upright(w*.30,-.14,bottom+h*.74,.105);
        for(const x of [-w*.39,w*.39])for(const y of [bottom+h*.14,top-h*.14])
          box(p,x,y,.23,.14,.065,.08,'#4e5869');
      }else{
        upright(-w*.23,-.40,top-.27,.19);upright(w*.31,-.40,top-.30,.13);
        box(p,0,top-.09,-.52,w*.84,.16,.92,'#52666c');box(p,0,bottom+.10,-.44,w*.88,.17,.83,dark);
        for(let i=0;i<4;i++)box(p,-w*.30+i*w*.20,bottom+h*.5,-.47,.16,h*.80,.16,'#879891');
        emit(()=>{for(let i=0;i<4;i++)box(p,-w*.29+i*.32,bottom+.17,.11,.23,.075,.11,i===3?'#ffb565':trim);});
      }
    }

    function cutSign(p,w,h,bottom,style,cell,integrated){
      const forms=silhouettes[style],steel='#727d93',trim=signPaint(style,messages[cell][3]).trim;
      const page=bulletinPages[cell>>3],slot=cell%8,localV=(x,y,z)=>vertex(p,(x-.5)*w,bottom+y*h,z);
      let triangles=cutTriangles.get(style);
      if(!triangles){
        triangles=forms.map(poly=>T.ShapeUtils.triangulateShape(poly.map(([x,y])=>new T.Vector2(x,y)),[]));
        cutTriangles.set(style,triangles);
      }
      const uv=(u,v)=>[(slot%2*cw+1+u*(cw-2))/aw,
        1-(Math.floor(slot/2)*bulletinCellH+1+(1-v)*(bulletinCellH-2))/(bulletinCellH*4)];
      signObstructions.push(facePlate(p,w,h,bottom,.22));
      const casing=style==='wall'?'#7c6879':style==='slats'?'#9d735e':style==='shop'?'#517480':'#697788';
      const depth=style==='marquee'?.93:style==='wall'||style==='stone'?.61:style==='dialbox'?.53:.19;
      forms.forEach((poly,k)=>{
        const front=poly.map(([u,v])=>localV(u,v,.22)),back=poly.map(([u,v])=>localV(u,v,-depth));
        const uvs=poly.map(([u,v])=>uv(u,v));
        for(const indices of triangles[k]){
          for(const ix of indices){page.positions.push(...front[ix]);page.uvs.push(...uvs[ix]);}
          tri(back[indices[2]],back[indices[1]],back[indices[0]],casing);
        }
        for(let j=0;j<poly.length;j++){
          const next=(j+1)%poly.length;
          quad(back[j],front[j],front[next],back[next],casing);
          // The die-cut edges have short real neon tubes that survive the
          // night lighting; the painted messages themselves remain unlit.
          if(style==='shop'&&j<6||style==='blade'&&j>=1&&j<4||style==='shield'&&j%3===1)
            emit(()=>rod(front[j],front[next],.055,.055,trim,4));
        }
      });
      if(marketStyles.has(style)){marketMount(p,w,h,bottom,style,trim,integrated);return;}
      const low=integrated?bottom-2.55:.14;
      if(style==='wall'&&!integrated){
        // Chipped concrete caps and horizontal joints ground the painted wall.
        box(p,0,.37,-.29,w*.99,.74,1.02,'#67677a');
        box(p,0,1.07,-.28,w*.962,.67,.83,'#817889');
        box(p,0,1.47,-.30,w*.986,.17,.91,'#a09aa6');
        for(const u of [-.34,-.10,.18,.38])
          box(p,w*u,1.05,.145,.045,.61,.035,'#5b5b70');
        for(let k=0;k<13;k++)
          solidCircle(p,.38,(k-6)*w*.074,-.27,'stone');
      }
      if(style==='shop'||style==='blade'){
        const x=style==='shop'?-w*.30:-w*.35;
        box(p,x,(bottom+h*.27+low)/2,-.14,.32,bottom+h*.27-low,.37,steel);
        line(p,[x,low+.18,-.16],[w*.24,bottom+h*.17,-.16],.101,.085,steel,5);
        // A bent pipe and a projecting lamp pick out the shop's circular blade.
        if(style==='shop'){
          line(p,[x,bottom+h*.81,-.24],[x-.24,bottom+h*1.07,-.33],.09,.085,steel,5);
          line(p,[x-.24,bottom+h*1.07,-.33],[x-.24,bottom+h*1.07,.38],.09,.08,steel,5);
          emit(()=>box(p,x-.24,bottom+h*1.064,.39,.51,.115,.39,trim));
        }
        if(!integrated){
          box(p,x,.18,-.15,.73,.36,.70,'#6c778a');solidCircle(p,.31,x,-.15);
        }
      }else{
        for(const x of [-w*.33,w*.33]){
          if(style==='wall'){
            box(p,x,(bottom+.18+low)/2,-.23,.49,bottom+.18-low,.56,'#687080');
            box(p,x,low+.22,-.23,.78,.40,.72,'#777c8a');
          }else{
            box(p,x,(low+bottom+h*.93)/2,-.16,style==='slats'?.185:.235,bottom+h*.93-low,.22,style==='slats'?'#9c785f':steel);
          }
          if(!integrated&&style!=='wall')solidCircle(p,.17,x,-.16,style==='slats'?'wood':'metal');
        }
      }
    }

    // Pole dimensions and foundations reflect the model the truck touches.
    // The faces sit above the shoulder and point at a real approach position
    // on the racing line, which matters more on bends than the local tangent.
    function bulletinBoard(p,w,h,bottom,style,cell,integrated,s){
      const top=bottom+h,trim=signPaint(style,messages[cell][3]).trim,steel='#717e95';
      if(silhouettes[style]){
        cutSign(p,w,h,bottom,style,cell,integrated);
      }else{
        if(style==='motel'){
          const x=-w*.26;
          box(p,x,.21,0,.98,.42,1.08,'#666c80');
          box(p,x,bottom*.54,0,.38,bottom*1.08,.39,steel);
          line(p,[x,bottom*.46,0],[w*.30,bottom+.22,0],.16,.13,steel,5);
          solidCircle(p,.45,x,0);
        }else{
          const span=style==='hazard'?.28:.35;
          for(const x of [-w*span,w*span]){
            box(p,x,.18,0,.69,.36,.76,'#687187');
            line(p,[x,.10,0],[x,bottom+.23,0],.17,.135,steel,6,true);
            if(style==='terminal')line(p,[x,.31,-.84],[x,bottom*.85,0],.075,.075,'#667183',4);
            solidCircle(p,.31,x,0);
          }
        }
        box(p,0,bottom+h*.5,0,w+.24,h+.25,.36,style==='motel'?'#62384e':'#384357');
        if(style==='terminal'){
          for(let j=0;j<4;j++)box(p,-w*.41+j*w*.27,bottom+h*.5,-.21,.18,h*.88,.21,steel);
          emit(()=>box(p,0,top+.09,.15,w,.10,.16,trim));
        }else if(style==='motel'){
          const x=-w*.45,center=top+.31;
          emit(()=>{
            for(let j=0;j<4;j++){
              const a=Math.PI*j/4,len=j%2?.63:.98;
              line(p,[x-len*Math.cos(a),center-len*Math.sin(a),.23],
                     [x+len*Math.cos(a),center+len*Math.sin(a),.23],.068,.068,'#ffc9be',4);
            }
            box(p,0,bottom-.08,.13,w,.14,.13,trim);
          });
        }else if(style==='hazard'){
          for(const x of [-w*.43,w*.43]){
            box(p,x,top+.19,0,.37,.35,.34,'#515a6a');
            beacon(p,x,top+.39,0,trim,.15);
          }
        }else{
          emit(()=>box(p,0,top+.085,.13,w*.96,.095,.14,trim));
        }
        const z=.197;
        panel(vertex(p,-w/2,bottom,z),vertex(p,w/2,bottom,z),vertex(p,w/2,top,z),vertex(p,-w/2,top,z),cell%8,bulletinPages[cell>>3]);
      }
      // The basic canvas view uses the same successful placement and exact copy.
      const center=vertex(p,0,bottom+h*.5,silhouettes[style] ? .22 : .197);
      const series=cell>=campaignStart?'project-campaign':cell<favorites.length?'original':cell<marketStart?'extra':cell<returnStart?'night-market':cell<gradeStart?(cell<westStart?'mesa-return':'western-market'):cell<westGradeStart?'grade-commission':'western-grades';
      const sheet=makeBulletinTexture(cell>>3).image,sw=sheet.width/2,sh=sheet.height/4,slot=cell%8;
      jokeSigns.push({x:center[0],y:center[1],z:center[2],yaw:p.yaw,width:w,height:h,
        lines:messages[cell].slice(4,6),campaign:cell>=campaignStart?{audience:messages[cell][7],caption:messages[cell][8],url:"https://2389.ai/research/products/"+messages[cell][6]+"/"}:null,accent:trim,style,icon:messages[cell][3],series,courseFraction:s/course.length,
        outline:silhouettes[style]?.[0],
        sprite:{image:sheet,x:(slot%2)*sw,y:Math.floor(slot/2)*sh,w:sw,h:sh}});
      if(messages[cell][3]==='trophy'){
        const y=top+.12,brass='#edc775';
        box(p,0,y+.08,0,.63,.15,.47,'#48536a');
        line(p,[0,y+.17,0],[0,y+.42,0],.10,.095,brass,8);
        line(p,[0,y+.40,0],[0,y+.90,0],.13,.41,brass,10,true);
        for(const side of [-1,1]){
          line(p,[side*.32,y+.80,0],[side*.60,y+.80,0],.065,.065,brass,6);
          line(p,[side*.60,y+.80,0],[side*.48,y+.53,0],.065,.055,brass,6);
          line(p,[side*.48,y+.53,0],[side*.19,y+.44,0],.055,.05,brass,6);
        }
      }
      if(!integrated)contact(p,w*.35,1.4,.16);
    }

    // Test the physical front corners against the view of a driver on the road
    // before placing a supplemental sign around an outside bend.
    function approachCoverage(p,w,s,d){
      const e=course.at(s-d),a=course.at(s-d+8),len=Math.hypot(a.x-e.x,a.z-e.z)||1;
      const dx=(a.x-e.x)/len,dz=(a.z-e.z)/len;
      const edges=[-.5,.5].map(k=>{
        const q=vertex(p,w*k,0,0),x=q[0]-e.x,z=q[2]-e.z;
        return (x*dz-z*dx)/Math.max(1,x*dx+z*dz);
      });
      const lo=Math.min(...edges),hi=Math.max(...edges);
      return Math.max(0,Math.min(.86,hi)-Math.max(-.86,lo))/Math.max(.001,hi-lo);
    }

    function readingEyes(s,distances){
      return distances.map(d=>{const q=course.at(s-d);return [q.x,ground(q.x,q.z)+3.15,q.z];});
    }

    function readingRays(p,w,h,bottom,s,market=false){
      const eyes=readingEyes(s,market?[33,39,45]:[33,43]);
      const targets=[];
      for(const x of [-.25,.10,.39])for(const y of [.32,.70])
        targets.push(vertex(p,w*x,bottom+h*y,.26));
      return {eyes,targets,x:p.x,z:p.z};
    }

    function readableFraction(rays,newFace,fullSurvey=false){
      let visible=0,total=rays.eyes.length*rays.targets.length;
      for(const e of rays.eyes)for(const t of rays.targets){
        if(signObstructions.some(rect=>blocksRay(rect,e,t)))continue;
        if(fullSurvey&&(structures.some(rect=>blocksRay(rect,e,t))||unbuiltFlags.some(rect=>blocksRay(rect,e,t))))continue;
        let clearLine=true;
        // Ridges and jump lips can cover the lower line on a panel farther downhill.
        for(const k of [.25,.45,.65,.83]){
          const x=mix(e[0],t[0],k),y=mix(e[1],t[1],k),z=mix(e[2],t[2],k);
          if(ground(x,z)+.32>y){clearLine=false;break;}
        }
        if(clearLine)visible++;
      }
      const own=visible/total;
      if(own<.96&&!fullSurvey)return own;
      let protectedView=1;
      // Preserve the approach to older signs when a new plate is placed in front.
      for(const other of readingWindows){
        if(Math.hypot(other.x-rays.x,other.z-rays.z)>55)continue;
        let masked=0;
        const eyes=fullSurvey?other.marketEyes:other.eyes;
        for(const e of eyes)for(const t of other.targets)if(blocksRay(newFace,e,t))masked++;
        if(masked>(fullSurvey?0:1))protectedView=Math.min(protectedView,1-masked/(eyes.length*other.targets.length));
      }
      return Math.min(own,protectedView);
    }

    function roadsideBulletins(){
      gateObstructions();
      const stadium=course.id==='indiana';
      const widths={hazard:12.2,terminal:13.2,motel:12.5,guide:12.3,pit:11.9,
        ticket:10.5,shop:10.55,shield:10.5,blade:10.7,wall:10.9,slats:10.4,
        ridgeline:10.2,survey:9.15,flight:10.3,spring:9.3,stamp:9.55,plate:9.65,tank:10.1,stone:9.95,pennant:10.25,marquee:10.65,dialbox:10.0};
      // Survey the old boards first. The new market rents the remaining
      // shoulders and, at the packed fairgrounds, the upper grandstand fascia.
      const installOrder=messages.map((_,i)=>i).sort((a,b)=>priority(a)-priority(b)||a-b);
      function priority(i){return i>=gradeStart?2:i<marketStart||i>=returnStart&&i<westStart?0:1;}
      installOrder.forEach(i=>{
        const [f,side,style]=messages[i],extra=i>=favorites.length,extended=i>=returnStart&&i<gradeStart||i>=westGradeStart&&i<campaignStart,grade=i>=gradeStart,market=priority(i)>0;
        const startNotice=i===favorites.length;
        const w=widths[style],h=w*(style==='shield'||style==='stone'||style==='tank'?.42:style==='slats'||style==='marquee'?.415:extra?.393:.365);
        const raised=stadium&&!extra&&i===0;
        // Added pit signs either sit at the grid or hang from the spectator
        // stands. The brackets attach above the existing bleacher structure.
        const integrated=stadium&&extra;
        const offset=half+(raised?16.4:integrated?7.0:extra?(stadium?6.45:6.1):stadium?7.4:8.1);
        const switchSide=returnLayout&&!extra&&(i===0||i===favorites.length-1);
        const preferred=switchSide?-side:side;
        const distance=f*(returnLayout&&extra&&!extended?sprintLength:course.length);
        const shifts=stadium?(market?[0,-3,3,-6,6,-10,10,-14,14,-18,18,-24,24,-30,30]:[0,-3,3,-6,6,-9,9]):[0,-7,7,-14,14,-21,21,-30,30,-40,40];
        if(grade&&stadium)shifts.push(-37,37,-47,47,-59,59,-72,72);
        const offsets=grade?[offset,offset+3.7,offset+7.7,offset+11.8,offset+16.2]:market?[offset,offset+3.7,offset+7.7]:[offset];
        let site=null,approach=null,chosenS=0,chosenBottom=0,best=-1;
        outer:for(const direction of [preferred,-preferred]){
          for(const shift of shifts){
            const s=clamp(distance+shift,course.length*.014,course.length*.986),fraction=s/course.length;
            if(course.gates.some(g=>Math.abs(s-g.s)<(extra?(stadium?9:13):stadium?13:18)))continue;
            for(const lateral of offsets){
              const q=courseFrame(fraction,direction*lateral);
              if(!raised&&!integrated&&!clear(q.x,q.z,w*.44+.2))continue;
              if(extra&&jokeSigns.some(m=>(m.x-q.x)**2+(m.z-q.z)**2<((w+m.width)*.48+(market?1:stadium?1.2:3))**2))continue;
              const eye=course.at(s-(stadium?34:41));
              const placed=frame(q.x,q.y,q.z,Math.atan2(eye.x-q.x,eye.z-q.z));
              let fits=true;
              for(const x of [-w*.50,0,w*.50]){
                const [px,,pz]=vertex(placed,x,0,0);
                if(nearestDistance(px,pz)<half+1.05||
                   bypass.some(b=>(px-b.x)**2+(pz-b.z)**2<(5.6+1.25)**2))fits=false;
              }
              if(!fits)continue;
              const covered=direction>0&&[.39,.54,.69].some(v=>Math.abs(fraction-v)<.055);
              const normalBottom=raised?7.2:integrated?(covered?13.8:startNotice?5.7:6.3):stadium?4.75:
                style==='motel'?2.65:style==='wall'?1.98:extra?2.75:2.8;
              const naturalBottom=market&&!integrated?(style==='stone'?1.38:style==='tank'?4.3:style==='marquee'?3.45:normalBottom):normalBottom;
              const levels=market?[naturalBottom,naturalBottom+3.6]:[naturalBottom];
              if(market&&stadium&&naturalBottom<10)levels.push(naturalBottom+7.2);
              if(grade&&stadium)levels.push(naturalBottom+10.2);
              for(const bottom of levels){
                const score=extra?Math.min(approachCoverage(placed,w,s,34),approachCoverage(placed,w,s,45),
                  readableFraction(readingRays(placed,w,h,bottom,s,market),facePlate(placed,w,h,bottom,.22),market)):1;
                if(score>best){site=placed;approach=eye;chosenS=s;chosenBottom=bottom;best=score;}
                if(score>.98)break outer;
              }
            }
          }
        }
        if(!site)return;
        bulletinBoard(site,w,h,chosenBottom,style,i,integrated,chosenS);
        const window=readingRays(site,w,h,chosenBottom,chosenS);
        window.marketEyes=readingEyes(chosenS,[33,39,45]);
        readingWindows.push(window);
        reserve(site,w*.49+.68);
        for(const t of [.22,.48,.70]){
          const u=mix(site.x,approach.x,t),v=mix(site.z,approach.z,t);
          if(nearestDistance(u,v)>half)reserve({x:u,z:v},(1-t)*w*.40+.66);
        }
      });
      // Give the independent carnival and project-board planners the same
      // three approach distances used to verify the new printed collection.
      for(const window of readingWindows)window.eyes=window.marketEyes;
    }

    // Irregular strata and offset capstones give each desert landform its own profile.
    function mesa(x,z,rx,rz,height,mode,distant=false) {
      const sides=mode==='needle'?8:Math.floor(range(11,18));
      const p=frame(x,ground(x,z)-1.6,z,range(0,TAU));
      const angles=[],radii=[];
      for(let i=0;i<sides;i++){
        angles.push((i+range(-.16,.16))*TAU/sides);
        radii.push(range(.78,1.17));
      }
      const levels = mode==='needle' ?
        [[0,1.26],[.17,.79],[.25,.72],[.50,.57],[.54,.66],[.69,.48],[.76,.48],[.86,.32],[1,.24]] :
        [[0,1.25],[.14,1.09],[.23,.95],[.31,.89],[.335,.91],[.48,.79],[.60,.76],[.625,.80],[.74,.71],[.86,.69],[.885,.73],[1,.68]];
      const palette = distant ?
        ['#4d4b70','#5c5274','#5e567a','#584c70','#68547a','#62577e','#624f78','#715d82','#685780','#736282','#806686','#84698b'] :
        ['#775871','#845b72','#8e647d','#764f69','#a97886','#8a5d75','#795269','#aa7989','#976b83','#886077','#b0848d','#a17588'];
      const swayX = range(-.1,.1)*rx, swayZ=range(-.13,.13)*rz;
      let previous;
      const shadeByFace = angles.map(()=>range(.89,1.09));
      for(let j=0;j<levels.length;j++) {
        const [level,radius]=levels[j];
        const ring=[];
        for(let i=0;i<sides;i++) {
          const a=angles[i],r=radii[i]*radius*(1+.026*Math.sin(i*3.8+j*.73));
          const relief = Math.sin(a*2+1.2)*height*.022 + Math.cos(a*3)*height*.012;
          ring.push(vertex(p,Math.cos(a)*rx*r+swayX*level, height*level+relief, Math.sin(a)*rz*r+swayZ*level));
        }
        if(j===0 && !distant) {
          // The inner disk and ring of smaller disks approximate the weathered
          // base without turning a needle or diagonal mesa into a square barrier.
          const inner=.76*Math.min(...ring.map(q=>Math.hypot(q[0]-x,q[2]-z)));
          obstacles.push({x,z,r:inner,material:'stone'});
          for(const q of ring) {
            const dx=q[0]-x,dz=q[2]-z,rad=Math.hypot(dx,dz);
            const r=Math.min(inner*.63,rad*.50),offset=1-r/rad;
            obstacles.push({x:x+dx*offset,z:z+dz*offset,r,material:'stone'});
          }
        }
        if(previous) {
          for(let i=0;i<sides;i++) {
            const k=(i+1)%sides;
            const ink=color(palette[j-1],shadeByFace[i]);
            quad(previous[i],ring[i],ring[k],previous[k],ink);
            // Occasional tall joints are interrupted by the individual geological bands.
            if(!distant && j>1 && j<levels.length-1 && (i*13+j*3)%11===0) {
              const lower=previous[i],upper=ring[i],side=ring[k];
              const f=.025;
              const cut=[upper[0]+(side[0]-upper[0])*f,upper[1]+(side[1]-upper[1])*f,upper[2]+(side[2]-upper[2])*f];
              tri(lower,upper,cut,color(ink,.72));
            }
          }
        }
        previous=ring;
      }
      const y=p.y+height;
      const cap=[p.x+swayX,y,p.z+swayZ];
      for(let i=0;i<sides;i++) tri(cap,previous[(i+1)%sides],previous[i],distant?'#8a7091':'#b98d9a');
    }

    function boulder(p,rx,ry,rz,ink) {
      if(ry>=.95 && Math.max(rx,rz)>=1.15) solidCircle(p,.80*Math.min(rx,rz),0,0,'stone');
      const sides=Math.floor(range(5,8)),bottom=[],belt=[],top=[];
      for(let i=0;i<sides;i++) {
        const a=(i+range(-.15,.15))*TAU/sides,co=Math.cos(a),si=Math.sin(a),noise=range(.86,1.15);
        bottom.push(vertex(p,co*rx*.78,-ry*.25,si*rz*.78));
        belt.push(vertex(p,co*rx*noise,ry*range(.22,.50),si*rz*noise));
        top.push(vertex(p,co*rx*range(.39,.68),ry*range(.72,.99),si*rz*range(.42,.72)));
      }
      const crown=vertex(p,rx*.14,ry,rz*-.09);
      for(let i=0;i<sides;i++){
        const n=(i+1)%sides;
        quad(bottom[i],belt[i],belt[n],bottom[n],color(ink,range(.77,.91)));
        quad(belt[i],top[i],top[n],belt[n],color(ink,range(.91,1.09)));
        tri(crown,top[n],top[i],color(ink,range(1.04,1.12)));
      }
    }

    function cactus(p,h,near) {
      const r=h*range(.059,.080), sides=near?16:8;
      if(h>=2.9) solidCircle(p,r*.96,0,0,'wood');
      const bodyInk=pick(['#4b7474','#527b75','#467275','#5b7f77']);
      function segment(x,y,z,x2,y2,z2,rad0,rad1) {
        line(p,[x,y,z],[x2,y2,z2],rad0,rad1,bodyInk,near?8:6);
      }
      // Flutes are built into the surface rings rather than added as separate rods.
      function limb(x,y,z,len,radius) {
        const lower=[],shoulder=[],crown=[];
        const peak=vertex(p,x,y+len+radius*.58,z);
        for(let j=0;j<sides;j++){
          const a=j*TAU/sides,co=Math.cos(a),si=Math.sin(a),rad=radius*(j%2?1:.935);
          lower.push(vertex(p,x+co*rad,y,z+si*rad));
          shoulder.push(vertex(p,x+co*rad*.92,y+len,z+si*rad*.92));
          crown.push(vertex(p,x+co*rad*.68,y+len+radius*.34,z+si*rad*.68));
        }
        for(let j=0;j<sides;j++){
          const k=(j+1)%sides,ink=color(bodyInk,j%2?.90:1.10);
          quad(lower[j],shoulder[j],shoulder[k],lower[k],ink);
          quad(shoulder[j],crown[j],crown[k],shoulder[k],ink);
          tri(peak,crown[k],crown[j],ink);
        }
      }
      limb(0,-.05,0,h,r);
      const arms = h<2.3 ? (random()<.70?0:1) : (random()<.75?2:3);
      const flip=random()<.5?-1:1;
      for(let i=0;i<arms;i++){
        const sign=(i%2?-1:1)*flip, ay=h*(i===0?range(.40,.58):range(.24,.54));
        const out=sign*h*range(.15,.26),za=i===2?h*.14:range(-.10,.10)*h;
        const ar=r*range(.55,.78),bend=h*.056;
        segment(sign*r*.44,ay,0,out*.73,ay,za*.72,ar,ar);
        segment(out*.73,ay,za*.72,out,ay+bend,za,ar,ar);
        limb(out,ay+bend,za,Math.min(h-ay-bend*.5,h*range(.20,.46)),ar);
      }
      contact(p,r*2.8,r*2.2,.28);
    }

    function agave(p,size,desert) {
      const n=desert?Math.floor(range(7,12)):Math.floor(range(6,10));
      const inks=desert?['#5b7976','#6b8278','#6e7c7b','#807777']:['#427574','#506b74','#4b8179'];
      for(let i=0;i<n;i++) {
        const a=i*TAU/n+range(-.18,.18),l=size*range(.52,1.14),w=size*range(.055,.11);
        const co=Math.cos(a),si=Math.sin(a),h=size*range(.32,.80);
        const a0=vertex(p,-si*w,.015,co*w),a1=vertex(p,si*w,.015,-co*w);
        const mid=vertex(p,co*l*.36,h*.70,si*l*.36),tip=vertex(p,co*l,h,si*l);
        tri(a0,tip,mid,pick(inks));tri(mid,tip,a1,pick(inks));
      }
    }

    function pine(p,h,deep=false) {
      // A tree may sit outside the shoulder while its crown hangs across both
      // lines of type. Prune only those crowns in the surveyed reading cone.
      const ratio=range(.17,.25),spin=range(0,TAU);
      const nearby=readingWindows.filter(w=>Math.abs(w.x-p.x)<56&&Math.abs(w.z-p.z)<56);
      const crown={x:p.x,y:p.y,z:p.z,r:h*ratio,h};
      for(let n=0;n<4&&nearby.some(w=>w.marketEyes.some(e=>w.targets.some(t=>behindTree(crown,e,t))));n++){
        h*=.68;crown.h=h;crown.r=h*ratio;
      }
      if(h>=5.4) solidCircle(p,h*.034,0,0,'wood');
      const girth=crown.r;
      canopies.push(crown);
      const inks=deep?['#344c62','#354861','#365667']:['#34565c','#3a635f','#486b66','#3f626a'];
      const base=pick(inks);
      line(p,[0,0,0],[0,h*.69,0],h*.035,h*.015,'#695643',6);
      for(let tier=0;tier<4;tier++) {
        const y=h*[.15,.33,.50,.67][tier],rad=girth*(1-tier*.22);
        const top=vertex(p,.04*rad,y+h*(.39-tier*.018),-.05*rad);
        const inner=vertex(p,0,y+h*.048,0);
        const n=8,ring=[];
        for(let j=0;j<n;j++) {
          const a=spin+j*TAU/n+tier*.43,r=rad*(.89+random()*.20);
          ring.push(vertex(p,Math.cos(a)*r,y+range(-.035,.032)*h,Math.sin(a)*r));
        }
        for(let j=0;j<n;j++){
          const k=(j+1)%n;
          tri(ring[j],top,ring[k],color(base,range(.89,1.12)+tier*.046));
          tri(inner,ring[j],ring[k],color(base,.65));
        }
      }
      if(!deep) contact(p,girth*.94,girth*.94,.21);
    }

    // A branch can screen the camera well beyond the narrow, collidable trunk.
    function behindTree(p,from,to){
      if(p.x+p.r<Math.min(from[0],to[0])||p.x-p.r>Math.max(from[0],to[0])||
         p.z+p.r<Math.min(from[2],to[2])||p.z-p.r>Math.max(from[2],to[2]))return false;
      const dx=to[0]-from[0],dz=to[2]-from[2];
      const t=clamp(((p.x-from[0])*dx+(p.z-from[2])*dz)/(dx*dx+dz*dz||1),0,.99);
      const y=(from[1]+t*(to[1]-from[1])-p.y)/p.h;
      if(y<.08||y>1.02)return false;
      const radius=p.r*Math.min(1,(1.04-y)*1.23);
      return (from[0]+dx*t-p.x)**2+(from[2]+dz*t-p.z)**2<radius*radius;
    }

    function trailer(p,accent) {
      for(const side of [-1,1])structures.push(plate(vertex(p,side*1.26,.61,-2.84),vertex(p,side*1.26,.61,2.84),vertex(p,side*1.26,2.86,-2.84)));
      // Ribbed aluminum siding, smoked windows, roof vents and a tow hitch.
      box(p,0,1.70,0,2.45,2.21,5.65,'#a4abc1');
      box(p,0,1.08,0,2.49,.32,5.68,accent);
      emit(()=>box(p,0,1.37,0,2.5,.082,5.69,mint));
      box(p,0,2.76,0,2.54,.22,5.74,'#8590a8');
      box(p,0,2.97,.25,1.06,.25,.86,'#687489');
      box(p,0,1.97,2.84,1.70,.71,.07,'#394d68');
      for(const sx of [-1,1]) {
        for(const zz of [-1.55,.42]) {
          emit(()=>box(p,sx*1.244,1.98,zz,.05,.70,1.18,zz<0?'#758bac':'#9c9bc1'));
          box(p,sx*1.281,1.99,zz,.035,.72,.055,'#45516b');
        }
        line(p,[sx*1.04,.52,-.4],[sx*1.32,.52,-.4],.45,.45,'#333a35',10,true);
        line(p,[sx*1.325,.52,-.4],[sx*1.344,.52,-.4],.20,.20,'#9c9c88',8,true);
      }
      line(p,[-.92,.64,2.7],[0,.53,3.76],.07,.07,'#7d7c68',6);
      line(p,[.92,.64,2.7],[0,.53,3.76],.07,.07,'#7d7c68',6);
      contact(p,1.77,3.8,.27);reserve(p,3.35);
      solidFootprint(p,0,0,1.19,2.71);
    }

    function flag(p,poleHeight,ink,checkered=false) {
      const w=poleHeight*.37,h=w*.59;
      line(p,[0,-.1,0],[0,poleHeight+.1,0],.105,.07,'#9e9c8b',6,true);
      let low=vertex(p,0,poleHeight-h,0),high=vertex(p,0,poleHeight,0);
      for(let i=1;i<=4;i++){
        const t=i/4;
        const nextLow=vertex(p,w*t,poleHeight-h-.14*t,Math.sin(t*7+.7)*h*.17);
        const nextHigh=vertex(p,w*t,poleHeight-.12*t,Math.sin(t*7)*h*.23);
        if(!checkered) quad(low,nextLow,nextHigh,high,color(ink, .94 + .09*Math.sin(i)));
        low=nextLow;high=nextHigh;
      }
      if(!checkered)signObstructions.push(plate(vertex(p,0,poleHeight-h,0),vertex(p,w,poleHeight-h-.1,0),vertex(p,0,poleHeight,0)));
      if(checkered) panel(vertex(p,0,poleHeight-h,0),vertex(p,w,poleHeight-h-.14,.03),
          vertex(p,w,poleHeight-.12,.06),vertex(p,0,poleHeight,0),cells.flag);
    }

    function windmill(p) {
      const steel='#788094',cream='#a6a4b5';
      for(const x of [-1,1]) for(const z of [-1,1]) {
        line(p,[x*1.6,-.3,z*1.6],[x*.34,10.3,z*.34],.095,.06,steel,5);
        line(p,[x*1.16,3,z*1.15],[-x*.76,6.6,z*.73],.055,.045,steel,4);
        line(p,[x*.75,6.5,z*.76],[x*.35,9.9,-z*.35],.055,.045,steel,4);
      }
      box(p,0,9.9,0,1.5,.16,1.5,steel);
      const center=vertex(p,0,10.8,.42);
      for(let j=0;j<14;j++) {
        const a=j*TAU/14,b=a+.235;
        const q=(r,t,depth)=>vertex(p,Math.cos(t)*r,10.8+Math.sin(t)*r,.42+depth);
        line(p,[0,10.8,.42],[Math.cos(a)*2,10.8+Math.sin(a)*2,.42],.035,.027,steel,4);
        quad(q(1.02,a,0),q(2.35,a,-.03),q(2.35,b,.04),q(1.12,b,.12),j%3?cream:'#bbb395');
      }
      rod(center,vertex(p,0,10.8,.70),.27,.21,'#9a8c71',8,true);
      line(p,[0,10.7,0],[0,11.2,-3.9],.10,.065,steel,6);
      quad(vertex(p,0,10.9,-2.9),vertex(p,0,10.5,-4.35),vertex(p,0,12,-4.2),vertex(p,0,11.55,-3),'#a15d4b');
      beacon(p,0,10.8,.78,pink,.18);
      reserve(p,2.4);
      for(const x of [-1.6,1.6]) for(const z of [-1.6,1.6]) solidCircle(p,.16,x,z);
    }

    function ghostStore(p,w,d,h,index) {
      const wall=pick(['#8a7581','#897380','#927d83','#8e7482']);
      const trim=pick(['#b6a4af','#a49cad','#b3a2b4']);
      box(p,0,h*.51,0,w,h,d,wall);
      box(p,0,h*.61,d*.50+.06,w*1.04,h*1.19,.22,trim);
      box(p,0,h*1.13,d*.50+.07,w*1.055,.23,.31,'#785e4d');
      box(p,0,h*1.00,d*.50+.20,w*.88,.60,.08,'#856b52');
      const facade=index%2?pink:mint;
      emit(()=>box(p,0,h*1.12,d*.50+.246,w*1.04,.085,.075,facade));
      if(index===1) {
        line(p,[w*.34,h*1.12,-d*.27],[w*.34,h*1.12+2.65,-d*.27],.079,.042,'#9393a3',5);
        beacon(p,w*.34,h*1.12+2.70,-d*.27,pink,.14);
      }
      // The original ghost-town storefronts now house the telemetry crews.
      for(const side of [-1,1]) {
        emit(()=>box(p,side*w*.306,h*.49,d*.50+.19,w*.22,h*.40,.08,index%2?'#ba8ba3':'#78a7b5'));
        box(p,side*w*.306,h*.49,d*.50+.25,.09,h*.41,.075,trim);
        box(p,side*w*.306,h*.45,d*.50+.27,w*.23,.10,.08,trim);
        if(index%2) line(p,[side*w*.31-w*.095,h*.40,d*.50+.30],[side*w*.31+w*.095,h*.61,d*.50+.30],.06,.06,'#ab8c65',4);
      }
      box(p,0,h*.32,d*.50+.21,w*.145,h*.60,.09,'#51483d');
      box(p,0,h*.38,d*.50+.27,w*.100,h*.32,.08,'#676b5c');
      const back=vertex(p,-w*.54,h*.82,d*.50),fl=vertex(p,-w*.54,h*.73,d*.50+1.64),fr=vertex(p,w*.54,h*.73,d*.50+1.64),br=vertex(p,w*.54,h*.82,d*.5);
      quad(back,fl,fr,br,index%2?'#9b7258':'#a69374');
      for(const x of [-w*.47,w*.47]) box(p,x,h*.37,d*.5+1.45,.16,h*.74,.18,trim);
      box(p,0,.16,d*.5+.65,w*1.07,.30,2.25,'#947555');
      quad(vertex(p,-w*.54,h*.97,-d*.56),vertex(p,-w*.54,h*.97,d*.52),vertex(p,0,h*1.22,d*.52),vertex(p,0,h*1.22,-d*.56),'#886c58');
      quad(vertex(p,0,h*1.22,-d*.56),vertex(p,0,h*1.22,d*.52),vertex(p,w*.54,h*.97,d*.52),vertex(p,w*.54,h*.97,-d*.56),'#9b7660');
      contact(p,w*.7,d*.78,.23);
      reserve(p,Math.max(w,d)*.47);
      solidFootprint(p,0,0,w*.50,d*.50+.08,'wood');
    }

    function crane(p) {
      const gold='#c99d69',dark='#555b70',glass='#648499';
      for(const side of [-1,1]) {
        box(p,side*1.28,.55,0,.76,.83,4.6,'#4f5246');
        for(let i=0;i<6;i++) line(p,[side*1.66,.54,-1.82+i*.72],[side*1.71,.54,-1.82+i*.72],.28,.28,dark,7,true);
      }
      box(p,0,1.24,0,3.07,.70,3.72,gold);
      box(p,-.69,2.32,-.30,1.31,1.56,1.80,gold);
      box(p,-.69,2.58,.63,1.08,.71,.04,glass);
      box(p,-1.37,2.58,-.27,.035,.71,1.31,glass);
      box(p,.43,1.99,-1.12,1.45,.95,1.36,'#ac8136');
      // Open lattice makes the working boom readable in silhouette.
      const a=[.5,1.70,1.24],b=[.5,9.55,8.20],span=.51;
      function pt(t,x,y){return [mix(a[0],b[0],t)+x*mix(span,.19,t),mix(a[1],b[1],t)+y*.29,mix(a[2],b[2],t)];}
      for(const side of [-1,1]) for(const high of [-1,1]) line(p,pt(0,side,high),pt(1,side,high),.080,.055,gold,4);
      for(let i=0;i<9;i++) for(const side of [-1,1]) {
        const t=i/9,n=(i+1)/9;
        line(p,pt(t,side,-1),pt(n,side,1),.055,.045,gold,4);
        line(p,pt(t,side,1),pt(n,-side,1),.047,.039,gold,4);
      }
      line(p,[-.1,3.65,-1.1],[b[0],b[1],b[2]],.035,.035,'#454b43',4);
      line(p,[b[0],b[1],b[2]],[b[0],4.75,b[2]],.040,.040,'#424840',4);
      line(p,[b[0],4.76,b[2]],[b[0],4.40,b[2]+.17],.12,.09,'#5b5745',5);
      emit(()=>{
        line(p,pt(0,-1,1),pt(1,-1,1),.087,.073,'#efab66',4);
        box(p,-.69,2.91,.676,1.05,.10,.09,mint);
      });
      beacon(p,b[0],b[1]+.13,b[2],pink,.23);spill(p,3.7,4.3,ice,.22);
      contact(p,2.1,3.0,.25); reserve(p,3.1);
      solidFootprint(p,0,0,1.59,2.25,'rubber');
    }

    function dinosaur(p) {
      // The mechanical car-eater is a landmark from the first figure-eight circuit.
      const dark='#435565',jade='#52868a',light='#79a3ae',ivory='#bbf6ef';
      for(const side of [-1,1]) {
        box(p,side*1.33,.65,0,.77,1.11,4.75,'#3d463c');
        for(let i=0;i<6;i++) line(p,[side*1.69,.65,-1.8+i*.71],[side*1.77,.65,-1.8+i*.71],.36,.36,'#727665',8,true);
      }
      box(p,0,1.34,0,3.01,.76,4.32,dark);
      line(p,[0,1.85,-1.15],[0,3.01,1.10],1.29,1.07,jade,8);
      line(p,[0,2.02,-1.23],[0,2.36,-4.36],.85,.35,jade,7);
      line(p,[0,2.36,-4.36],[.35,2.96,-6.32],.35,.045,light,6);
      line(p,[0,2.59,.75],[0,5.56,1.46],.96,.78,jade,8);
      line(p,[0,5.50,1.42],[0,7.08,3.0],.78,.58,light,8);
      for(let i=0;i<5;i++) {
        const y=3.12+i*.65,z=1.05+i*.22;
        emit(()=>tri(vertex(p,0,y-.2,z-.53),vertex(p,0,y+.45,z-1.22),vertex(p,0,y+.61,z-.48),pink));
      }
      // Exposed, illuminated servo collars make the car-eater read as a
      // mechanical animal as the truck approaches from either direction.
      emit(()=>{
        for(const [y,z,r] of [[3.64,1.00,.99],[4.58,1.23,.91],[6.18,2.09,.75]])
          line(p,[0,y,z],[0,y+.145,z+.06],r,r,ice,8);
        for(const sx of [-1,1])
          line(p,[sx*.66,2.39,-3.76],[sx*.76,2.52,-1.59],.10,.11,pink,5);
      });
      box(p,0,7.14,3.70,1.49,.84,2.32,jade);
      box(p,0,7.1,4.84,1.36,.62,.48,light);
      for(const side of [-1,1]) {
        emit(()=>{
          box(p,side*.77,7.27,3.47,.085,.37,.50,mint);
          line(p,[side*.74,6.91,3.44],[side*.67,6.91,4.95],.088,.075,pink,5);
          box(p,side*1.74,.98,-.10,.082,.12,3.87,mint);
        });
        box(p,side*.812,7.29,3.51,.035,.18,.105,'#33392d');
        line(p,[side*.52,6.79,2.98],[side*.41,5.90,4.90],.22,.11,jade,5);
        for(let i=0;i<5;i++) {
          emit(()=>line(p,[side*.54,6.85,3.53+i*.27],[side*.47,6.52,3.58+i*.27],.10,0,ivory,4));
        }
      }
      // A wrinkled red sedan hangs across the open jaws.
      const car=relative(p,0,6.13,4.5,Math.PI*.36);
      box(car,0,0,0,1.62,.44,2.85,'#b3493c');
      box(car,.03,.37,-.12,1.24,.42,1.27,'#718284');
      box(car,.02,.57,-.13,1.20,.14,1.28,'#9a4938');
      for(const x of [-.78,.78]) for(const z of [-.91,.91]) line(car,[x*.91,-.11,z],[x*1.13,-.11,z],.27,.27,'#323931',7,true);
      spill(relative(p,0,0,1.5),3.8,5.2,pink,.22);contact(p,2.02,3.35,.26);reserve(p,4.3);
      solidFootprint(p,0,0,1.68,2.31,'rubber');
    }

    function roadWorks() {
      const project=courseFrame(.739,half+13.3);
      if(nearestDistance(project.x,project.z)>half+4) crane(frame(project.x,project.y,project.z,project.yaw+.72));
      for(let i=0;i<6;i++) {
        const f=.699+i*.011,detourSide=bypassOffset((f-bypassStart)/(bypassEnd-bypassStart));
        const p=courseFrame(f,Math.min(-half,detourSide-5)-1.65);
        if(nearestDistance(p.x,p.z)<half) continue;
        box(p,0,.68,0,.14,1.05,1.78,'#c39754');
        emit(()=>box(p,0,.79,0,.18,.28,1.89,i%2?'#ffb162':'#e7cfa1'));
        for(const z of [-.69,.69]) line(p,[-.29,0,z],[0,1.01,z],.069,.052,'#936e45',4);
      }
    }

    // Each dish is a shallow, tilted paraboloid with a segmented shell, a
    // separate illuminated rim and an actual receiver on three feed legs.
    function surveyDish(p,r) {
      const height=r*1.15+2.1;
      box(p,0,.94,0,r*1.11,1.88,r*.87,'#59617b');
      box(p,0,1.92,0,r*1.19,.20,r*.95,'#8485a2');
      for(const side of [-1,1]) {
        line(p,[side*r*.37,1.9,0],[side*r*.20,height,0],.35,.29,'#c3adc9',6,true);
        emit(()=>box(p,side*r*.556,1.21,-r*.05,.04,.14,r*.58,mint));
      }
      line(p,[-r*.29,height,0],[r*.29,height,0],.56,.56,'#67768a',8,true);
      const elevation=.54, forward=Math.sqrt(1-elevation*elevation);
      const focus=[0,height+.72*r*elevation,.72*r*forward];
      const point=(fraction,a)=>{
        const radial=r*fraction,v=radial*Math.sin(a),sag=r*.24*fraction*fraction;
        return [radial*Math.cos(a),height+v*forward+sag*elevation,-v*elevation+sag*forward];
      };
      const sectors=16;
      for(let j=0;j<sectors;j++){
        const a=j*TAU/sectors,b=(j+1)*TAU/sectors;
        const strip=['#b7bece','#9caec2','#a5a7c2','#c4bcca'][j%4];
        tri(vertex(p,0,height,0),vertex(p,...point(.45,a)),vertex(p,...point(.45,b)),strip);
        quad(vertex(p,...point(.45,a)),vertex(p,...point(1,a)),vertex(p,...point(1,b)),vertex(p,...point(.45,b)),strip);
        line(p,point(.05,a),point(1,a),.047,.055,'#515d77',4);
        emit(()=>line(p,point(1,a),point(1,b),.090,.090,j%4===3?violet:mint,4));
      }
      for(const j of [1,6,12]) line(p,point(.99,j*TAU/sectors),focus,.10,.065,'#747f9d',5);
      line(p,focus,[0,focus[1]+elevation*.7,focus[2]+forward*.7],.25,.20,'#495568',7,true);
      beacon(p,0,focus[1]+elevation*.76,focus[2]+forward*.76,pink,.31);
      const panelWidth=Math.min(5.8,.88*r),front=r*.438;
      panel(vertex(p,-panelWidth*.5,.38,front),vertex(p,panelWidth*.5,.38,front),
            vertex(p,panelWidth*.5,1.52,front),vertex(p,-panelWidth*.5,1.52,front),cells.torque);
      const site=relative(p,0,0,.9*r);
      spill(site,r,r*.64,mint,.17);reserve(p,r+2.3);
      solidFootprint(p,0,0,.5*r,.40*r);
    }

    // Triangulated utility towers use four tapered corner rails and three
    // wide crossbars. Transmission wires hang above the forest canopy.
    function pylon(p,h,utility) {
      const foot=h*.135,neck=h*.029;
      const at=(f,sx,sz)=>[sx*mix(foot,neck,f),f*h,sz*mix(foot,neck,f)];
      for(const sx of [-1,1]) for(const sz of [-1,1]) {
        line(p,at(0,sx,sz),at(.98,sx,sz),.17,.092,'#8492a6',5);
        box(p,sx*foot,.27,sz*foot,.64,.54,.64,'#777c92');
        solidCircle(p,.35,sx*foot,sz*foot);
        for(let k=0;k<4;k++) {
          const lo=k*.235,hi=(k+1)*.235;
          line(p,at(lo,sx,sz),at(hi,-sx,sz),.084,.074,'#82889e',4);
          if(sx<0) line(p,at(lo,sx,sz),at(hi,sx,-sz),.084,.074,'#8189a0',4);
        }
      }
      for(const f of [.48,.73,.93]) {
        const w=utility?h*(f===.73?.32:.24):mix(foot,neck,f);
        line(p,[-w,f*h,0],[w,f*h,0],.16,.14,'#838da3',5);
        for(const sx of [-1,1]) {
          line(p,[sx*neck,(f-.10)*h,0],[sx*w,f*h,0],.104,.080,'#8994b0',4);
          if(utility) {
            line(p,[sx*w,f*h,0],[sx*w,f*h-1,0],.12,.12,'#7973b1',6);
            emit(()=>line(p,[sx*w,f*h-.55,0],[sx*w,f*h-.36,0],.21,.21,ice,6,true));
          }
        }
      }
      line(p,[0,.9*h,0],[0,h+2,0],.18,.075,'#a9a2bb',6);
      beacon(p,0,h+2.12,0,pink,.29);
      reserve(p,foot*1.5+.45);
    }

    function transmission(p,q,h1,h2) {
      for(const side of [-1,0,1]) {
        const a=vertex(p,side*h1*.32,.73*h1-1,0), b=vertex(q,side*h2*.32,.73*h2-1,0);
        let last=a;
        for(let j=1;j<=5;j++){
          const t=j/5,pt=[mix(a[0],b[0],t),mix(a[1],b[1],t)-3.8*4*t*(1-t),mix(a[2],b[2],t)];
          rod(last,pt,.070,.070,'#677289',4);last=pt;
        }
      }
    }

    // Two finned transformers, busbar gantry and a relay hut form a compact
    // forest substation, with the build envelope kept outside both drive lines.
    function substation(p) {
      box(p,0,.18,0,15,.36,8.2,'#65677c');
      box(p,-5.1,1.75,0,3.9,3.18,5.18,'#66718a');
      box(p,-5.1,3.40,0,4.12,.23,5.37,'#9094ac');
      panel(vertex(p,-6.76,.58,2.61),vertex(p,-3.45,.58,2.61),vertex(p,-3.45,1.46,2.61),vertex(p,-6.76,1.46,2.61),cells.torque);
      emit(()=>box(p,-5.1,2.41,2.607,2.95,.81,.10,'#71adce'));
      for(const x of [-.95,4.4]) {
        box(p,x,1.73,.14,3.1,2.70,3.38,'#727589');
        for(let j=0;j<6;j++) box(p,x,1.73,-1.43+j*.6,3.66,2.37,.19,'#8f91a6');
        for(const offset of [-.81,.81]){
          const a=x+offset;
          line(p,[a,2.87,.15],[a,5.43,.15],.19,.15,'#585673',7);
          for(let j=0;j<5;j++){
            const y=3.13+j*.40;
            line(p,[a,y,.15],[a,y+.13,.15],.31,.23,j%2?'#b3a5c4':'#9b96b6',7,true);
          }
          emit(()=>line(p,[a,4.70,.15],[a,4.85,.15],.29,.29,violet,7,true));
        }
        line(p,[x-.81,5.40,.15],[x+.81,5.40,.15],.10,.10,'#a6a4af',5);
      }
      for(const x of [-6.65,6.75]){
        line(p,[x,.3,-2.9],[x,7.1,-2.9],.17,.15,'#8693a4',5);
        line(p,[x,6.6,-3.1],[x,6.6,1.2],.12,.12,'#a0a6b3',5);
      }
      line(p,[-6.65,7,-2.9],[6.75,7,-2.9],.16,.16,'#939db5',5);
      emit(()=>{
        box(p,-5.1,3.52,2.6,4,.13,.17,mint);
        box(p,0,6.83,-2.9,12.6,.16,.28,mint);
        box(p,0,.48,4.04,14.8,.11,.17,'#b3a8fe');
      });
      beacon(p,6.75,7.28,-2.9,pink,.31);spill(relative(p,0,0,3.4),7.8,4.4,ice,.32);
      reserve(p,9);solidFootprint(p,0,0,7.4,4.0);
    }

    // Bent-arm floodlights mark the service yards. Their real luminous head
    // and local spill stay visible on hardware without dynamic lights.
    function serviceLight(p,accent) {
      signObstructions.push(facePlate(p,.52,8.1,0),facePlate(relative(p,0,0,0,Math.PI/2),.52,8.1,0),
          facePlate(relative(p,0,0,3.22),1.39,.49,8.73));
      const steel='#8991ac';
      line(p,[0,-.12,0],[0,8.1,0],.20,.13,steel,7,true);
      line(p,[0,7.43,0],[0,9.10,2.23],.13,.13,steel,5);
      line(p,[0,9.10,2.23],[0,9.10,3.33],.13,.13,steel,5);
      box(p,0,8.98,3.21,1.30,.35,1.36,'#555d78');
      emit(()=>{
        box(p,0,8.81,3.22,1.31,.14,1.36,accent);
        box(p,0,3.35,0,.41,.26,.41,accent);
      });
      beacon(p,0,8.79,3.24,accent,.31);
      spill(relative(p,0,0,4.4),5.0,6.3,accent,.27);
      solidCircle(p,.20);reserve(p,.4);
    }

    // The cloth is installed after the landscaping, at its original seeded
    // height. Reserve its full height range while siting the market signs.
    const desertFlags=[[.012,-1],[.014,1],[.923,1],[.928,1]];
    const forestFlags=Array.from({length:6},(_,i)=>[.063+i*.012,1]);
    function reserveFlagViews(flags,offset,low,high){
      for(const [f,side] of flags){
        const p=courseFrame(f,side*(half+offset)),bottom=low*(1-.37*.59)-.16;
        unbuiltFlags.push(plate(vertex(p,-.08,bottom,0),vertex(p,high*.38,bottom,0),vertex(p,-.08,high+.06,0)));
      }
    }

    function desert() {
      for(const [f,off,r,turn] of [[.044,-32,6.8,.76],[.093,-43,7.6,1.08],[.133,-67,8.3,.91],
                                   [.453,31,6.15,-.80],[.648,-37,7.2,.96],[.895,38,7.0,-.96]]){
        const p=courseFrame(f,off);
        if(clear(p.x,p.z,r+2.5)) surveyDish(frame(p.x,p.y,p.z,p.yaw+Math.PI-turn),r);
      }
      for(const [f,off,h] of [[.071,55,25],[.392,-39,23],[.815,56,28]]){
        const p=courseFrame(f,off);
        if(clear(p.x,p.z,h*.20)) pylon(p,h,false);
      }
      // The return road sweeps close to the broadest bases; their weathered
      // outer rings reach as far as 1.51 times the nominal rock radius.
      const mesaApron=course.layoutKey==='arizona-circuit'?1.58:1.33;
      for(let i=0;i<22;i++) {
        const f=clamp((i+.22+range(-.12,.12))/22,.012,.985);
        const side=i%2?1:-1;
        const slim=i%5===1||i%7===0;
        const rx=slim?range(7,14):range(19,38),rz=slim?range(9,15):range(13,32);
        const h=slim?range(24,58):range(25,66);
        let lateral = half+range(44,102)+Math.max(rx,rz);
        let p=courseFrame(f,side*lateral);
        for(let t=0;t<5 && !clear(p.x,p.z,Math.max(rx,rz)*mesaApron);t++){
          lateral+=24; p=courseFrame(f,side*lateral);
        }
        if(!clear(p.x,p.z,Math.max(rx,rz)*(mesaApron-.03))) continue;
        mesa(p.x,p.z,rx,rz,h,slim?'needle':'plateau');
        reserve(p,Math.max(rx,rz)*1.10);
        if(!slim && i%2===0){
          const token=relative(p,side*rx*1.62,0,rz*.37);
          if(clear(token.x,token.z,13)){mesa(token.x,token.z,8,10,h*.78,'needle');reserve(token,12);}
        }
      }
      const cx=(minX+maxX)/2,cz=(minZ+maxZ)/2;
      for(let i=0;i<24;i++) {
        const a=(i+range(-.25,.25))*TAU/24;
        const x=cx+Math.cos(a)*(maxX-minX+range(370,540))*.52;
        const z=cz+Math.sin(a)*(maxZ-minZ+range(380,570))*.52;
        const rx=range(37,81),rz=range(30,61);
        if(nearestDistance(x,z)>half+Math.max(rx,rz)*1.42) mesa(x,z,rx,rz,range(34,87),'plateau',true);
      }
      // Timber facades and the wind pump identify the ghost town from the cockpit.
      for(let i=0;i<5;i++) {
        const f=.347+i*.011;
        const p=courseFrame(f,half+11.5+(i%2)*2);
        if(clear(p.x,p.z,3.1)) {
          const yaw=p.yaw-Math.PI*.5+range(-.09,.09);
          ghostStore(frame(p.x,p.y,p.z,yaw),range(4.7,6.8),range(4.6,6.4),range(3.4,4.3),i);
        }
      }
      const wind=courseFrame(.388,-half-12);
      if(clear(wind.x,wind.z,2.6)) windmill(wind);
      [ [.054,-1,cells.event], [.163,1,cells.torque], [.424,-1,cells.tires],
        [.558,1,cells.radio], [.705,-1,cells.mtm], [.871,1,cells.club] ].forEach(args=>roadBoard(...args));
      reserveFlagViews(desertFlags,1.9,4.7,6.3);
      roadsideBulletins();
      // Isolated specimen cacti and small agave colonies follow sandy washes.
      for(let i=0;i<202;i++) {
        const near=i<72;
        const p=courseFrame(range(.003,.997),pick([-1,1])*(half+(near?range(4.4,22):range(15,89))));
        if(!clear(p.x,p.z,1.8)) continue;
        const h=near?range(1.8,5.65):range(2.1,6.1);
        cactus(frame(p.x,p.y,p.z,range(0,TAU)),h,near);
      }
      for(let i=0;i<275;i++) {
        const p=courseFrame(random(),pick([-1,1])*(half+range(1.2,69)));
        const r=range(.29,2.25)*(i%7===0?1.50:1);
        if(!clear(p.x,p.z,r)) continue;
        boulder(p,r,r*range(.55,1.19),r*range(.72,1.46),pick(['#845f73','#916f80','#967186','#806480','#ab8690']));
        if(r>1.12) contact(p,r*1.45,r*1.35,.20);
      }
      for(let i=0;i<770;i++) {
        const p=courseFrame(random(),pick([-1,1])*(half+range(.65,68)));
        if(clear(p.x,p.z,.58)) agave(p,range(.42,1.38),true);
      }
      for(const [f,side] of desertFlags) {
        const q=courseFrame(f,side*(half+1.9));
        flag(q,range(4.7,6.3),pick([pink,mint]),false);
      }
    }

    function forest() {
      roadWorks();
      for(const [f,off] of [[.078,-32],[.493,31],[.858,40]]){
        const p=courseFrame(f,off);
        if(clear(p.x,p.z,10)) substation(frame(p.x,p.y,p.z,p.yaw-Math.sign(off)*Math.PI*.55));
      }
      for(const [f1,f2,off] of [[.061,.138,-53],[.441,.542,56],[.812,.91,60]]){
        const a=courseFrame(f1,off),b=courseFrame(f2,off),ah=23.8,bh=26.4;
        if(clear(a.x,a.z,5.7)&&clear(b.x,b.z,5.7)){
          pylon(a,ah,true);pylon(b,bh,true);transmission(a,b,ah,bh);
        }
      }
      const dino=courseFrame(.285,-half-11);
      if(clear(dino.x,dino.z,4.4)) dinosaur(frame(dino.x,dino.y,dino.z,dino.yaw+Math.PI*.65));
      for(const [f,side,accent] of [[.054,-1,ice],[.087,-1,mint],[.293,1,violet],[.472,1,ice],[.505,1,mint],
                                    [.725,1,violet],[.834,1,ice],[.87,1,mint]]){
        const p=courseFrame(f,side*(half+6));
        if(clear(p.x,p.z,.6)) serviceLight(frame(p.x,p.y,p.z,p.yaw-side*Math.PI*.52),accent);
      }
      // An open infield with trailers, then the rows of dark evergreens beyond it.
      for(let i=0;i<11;i++) {
        const p=courseFrame(.075+i*.007,half+9+(i%3)*3.7);
        if(clear(p.x,p.z,3.25)) trailer(frame(p.x,p.y,p.z,p.yaw+range(-.5,.5)),pick(['#427e8b','#9b607c','#696d98']));
      }
      [ [.039,-1,cells.event],[.202,1,cells.tires],[.408,-1,cells.torque],
        [.592,1,cells.radio],[.838,-1,cells.mtm],[.927,1,cells.club] ].forEach(args=>roadBoard(...args));
      reserveFlagViews(forestFlags,3.25,4.5,6.4);
      roadsideBulletins();
      for(let i=0;i<520;i++) {
        const side=pick([-1,1]),f=random();
        const p=courseFrame(f,side*(half+range(5,109)));
        const r=range(1.4,3.8);
        if(!clear(p.x,p.z,r)|| (f>.065&&f<.17&&side===1&&random()<.8)) continue;
        pine(p,range(4.5,15.9),i%3===0);
      }
      for(let i=0;i<170;i++) {
        const x=range(minX-156,maxX+156),z=range(minZ-150,maxZ+150);
        const p=frame(x,ground(x,z),z);
        if(clear(x,z,22)) pine(p,range(9.2,20.7),true);
      }
      for(let i=0;i<370;i++) {
        const p=courseFrame(random(),pick([-1,1])*(half+range(1.2,45)));
        if(!clear(p.x,p.z,.6)) continue;
        if(i%5===0) {
          const r=range(.44,1.74);
          boulder(p,r,r*range(.45,.81),r*range(.71,1.23),pick(['#6f7582','#7f8190','#64707b']));
        } else agave(p,range(.41,1.05),false);
      }
      for(const [f,side] of forestFlags) {
        const p=courseFrame(f,side*(half+3.25));
        if(nearestDistance(p.x,p.z)>half+1) flag(p,range(4.5,6.4),pick([mint,'#c298f3',pink]));
      }
    }

    const shirts=['#e984af','#8cc3cd','#e5c99d','#a298cd','#ba876b','#475c6c','#b87991','#d2c8c1','#856f98','#72a4af','#726d83'];
    const skin=['#bb8c6d','#d3ac86','#e0b998','#a57a5d','#966c52','#c99c77'];
    // Keep the original seat survey and its random draw sequence. The crowd
    // renderer dresses and poses these occupied seats at the race clock.
    const crowdStands=world.userData.crowdStands=[];
    function spectator(stand,x,y,z,row){
      const size=range(.83,1.11),shift=range(-.07,.07),shirt=pick(shirts),face=pick(skin);
      const hat=random()<.50?pick(['#413e36','#8c5143','#45605e','#cab699']):null;
      stand.seats.push({x,y,z,row,size,shift,shirt,face,hat});
    }

    function grandstand(p,w,rows,roof,variant) {
      const riser=.68,tread=1.24,seat='#9aa3ba',steel='#77859b',back=-rows*tread;
      const stand={x:p.x,y:p.y,z:p.z,yaw:p.yaw,width:w,rows,roof,variant,seats:[]};crowdStands.push(stand);
      // Include the people on the benches when finding a clear camera position.
      structures.push(plate(vertex(p,-w*.5,2.05,.7),vertex(p,w*.5,2.05,.7),vertex(p,-w*.5,2.05+rows*riser,back)));
      structures.push(facePlate(p,w,2.1,0,.7));
      const supports=Math.ceil(w/5);
      for(let k=0;k<=supports;k++) {
        const x=-w*.49+k*(w*.98)/supports;
        line(p,[x,-.35,.28],[x,rows*riser+.36,back],.12,.12,steel,5);
        line(p,[x,-.25,back],[x,rows*riser+.36,back],.11,.11,steel,5);
        if(k<supports && k%2===0) line(p,[x,.18,back],[x+w/supports,rows*riser+.09,back],.065,.065,'#89918b',4);
      }
      const aisle=.8;
      for(let r=0;r<rows;r++) {
        const height=.74+r*riser,z=-r*tread;
        box(p,0,height-.15,z,w,.25,tread+.04,'#788098');
        box(p,0,height+.20,z-.12,w,.12,.42,seat);
        box(p,0,height+.28,z-.39,w,.29,.12,variant%2?'#9094b3':'#8496a9');
        // Alternate reserved gaps for the stairways.
        const count=Math.floor(w/.79);
        for(let j=0;j<count;j++) {
          const x=(j+.56)*w/count-w/2;
          if(Math.abs(x)<aisle || (Math.abs(x)>w*.329 && Math.abs(x)<w*.360) || random()<.20) continue;
          spectator(stand,x+range(-.09,.09),height+.27,z+.04,r);
        }
      }
      const top=.85+(rows-.4)*riser;
      line(p,[-w*.5,top+1.13,back+.42],[w*.5,top+1.13,back+.42],.065,.065,steel,5);
      for(let x=-w*.49;x<=w*.5;x+=3.4) line(p,[x,top-.22,back+.42],[x,top+1.13,back+.42],.045,.045,steel,5);
      // The sponsor ribbon doubles as the retaining wall above the track fence.
      const accent=variant%2?mint:pink;
      const band=frame(p.x,p.y,p.z,p.yaw);
      box(band,0,.53,.98,w,.91,.21,variant%2?'#465469':'#54455d');
      emit(()=>{
        box(p,0,1.04,1.09,w,.07,.14,accent);
        for(const x of [-w*.36,0,w*.36]) {
          for(let k=1;k<rows;k+=2) box(p,x,.60+k*.68,-k*tread+.54,.56,.085,.10,'#a6c3d5');
        }
      });
      for(let x=-w/2+3.45,idx=0;x<w/2-2.7;x+=6.93,idx++) {
        panel(vertex(p,x-2.95,.10,1.12),vertex(p,x+2.95,.10,1.12),
              vertex(p,x+2.95,.95,1.12),vertex(p,x-2.95,.95,1.12),
              [cells.torque,cells.event,cells.torque,cells.mtm,cells.radio][(idx+variant)%5]);
      }
      if(roof) {
        const rearH=top+3.04,frontH=top+4.05,rearZ=back-.7,frontZ=.13;
        for(let j=0;j<=supports;j++) {
          const x=-w*.49+j*w*.98/supports;
          box(p,x,rearH/2,rearZ,.19,rearH,.20,'#667086');
          line(p,[x,rearH,rearZ],[x,frontH,frontZ],.10,.105,'#8a8aa4',5);
          line(p,[x,rearH-2.0,rearZ],[x,frontH-.16,frontZ-1.5],.075,.060,'#8c8eac',4);
        }
        signObstructions.push(plate(vertex(p,-w*.52,frontH+.07,frontZ+.71),vertex(p,w*.52,frontH+.07,frontZ+.71),vertex(p,-w*.52,rearH+.02,rearZ-1.4)));
        quad(vertex(p,-w*.52,rearH+.02,rearZ-1.4),vertex(p,-w*.52,frontH+.07,frontZ+.71),
             vertex(p,w*.52,frontH+.07,frontZ+.71),vertex(p,w*.52,rearH+.02,rearZ-1.4),'#7d829a');
        box(p,0,frontH+.04,frontZ+.71,w*1.04,.48,.13,'#594862');
        emit(()=>box(p,0,frontH+.17,frontZ+.80,w*1.035,.21,.105,accent));
        const bannerH=1.30;
        for(const x of [-w*.32,w*.32]){
          box(p,x,frontH-.90,frontZ+.70,6.42,bannerH+.16,.12,'#263247');
          panel(vertex(p,x-3.12,frontH-.90-bannerH/2,frontZ+.79),vertex(p,x+3.12,frontH-.90-bannerH/2,frontZ+.79),
                vertex(p,x+3.12,frontH-.90+bannerH/2,frontZ+.79),vertex(p,x-3.12,frontH-.90+bannerH/2,frontZ+.79),cells.torque);
        }
      }
      reserve(p,w*.27);
      solidFootprint(p,0,(back+1.07)/2,w*.50,(1.07-back)/2);
    }

    function lightMast(p,height,side) {
      const steel='#8390aa';
      solidCircle(p,.24);
      line(p,[0,-.25,0],[0,height,0],.24,.115,steel,8,true);
      for(let i=0;i<3;i++) line(p,[0,height-.89-i*.4,0],[side*(1.1+i*.32),height+.05,-.10],.065,.065,steel,5);
      box(p,0,height,.02,4.1,.22,.25,steel);
      for(let j=0;j<5;j++) {
        const x=(j-2)*.79;
        box(p,x,height+.09,.20,.67,.58,.41,'#59615b');
        emit(()=>box(p,x,height+.055,.422,.52,.39,.05,side>0?'#ffecfb':'#d6fffa'));
        if(j===0||j===4) beacon(p,x,height+.10,.48,side>0?'#ffd8ed':'#cdf9ff',.30);
      }
      const pool=relative(p,0,0,12);spill(pool,12,7.8,side>0?'#a884ab':'#79aac3',.17);
    }

    function controlTower(p) {
      // Press/race-control booth and equipment wired to the timing gantry.
      const brown='#60677b',glass='#839fb6',ivory='#a6a9c0';
      box(p,0,1.72,0,4.47,3.44,5.26,brown);
      box(p,0,4.35,0,5.27,1.82,6.16,ivory);
      emit(()=>box(p,0,4.68,3.10,4.78,1.01,.08,glass));
      for(const x of [-1.55,0,1.55]) box(p,x,4.66,3.16,.105,1.15,.055,'#c3c4b0');
      for(const x of [-1,1]){
        emit(()=>box(p,x*2.661,4.68,0,.052,1.01,5.12,glass));
        for(const z of [-1.67,0,1.67]) box(p,x*2.703,4.68,z,.049,1.1,.095,'#c2c2ac');
      }
      box(p,0,5.40,0,5.55,.31,6.46,'#715c76');
      emit(()=>box(p,0,5.52,0,5.57,.12,6.48,mint));
      line(p,[1.65,5.43,-1.70],[1.65,8.72,-1.70],.063,.042,'#888a7c',4);
      beacon(p,1.65,8.80,-1.70,pink,.18);
      reserve(p,3.25);
      solidFootprint(p,0,0,2.20,2.60);
    }

    // Depth, setbacks and selective rows of lit offices distinguish the city
    // from the stadium. The stepped twin-aerial tower anchors the finish view.
    function taperedTower(p,w,d,h) {
      // Sloping sides, crossed structural tubes and paired antennae echo the
      // Chicago engineering skyline beyond the straight.
      const front=(x,v)=>[x*w*(.5-.21*v),v*h,-d*(.5-.17*v)-.03];
      for(let j=0;j<4;j++) {
        const spin=relative(p,0,0,0,Math.PI*.5*j),sideW=j%2?d:w,sideD=j%2?w:d;
        const bx=sideW*.5,tx=sideW*(j%2?.33:.29),bz=sideD*.5,tz=sideD*(j%2?.29:.33);
        quad(vertex(spin,-bx,0,-bz),vertex(spin,bx,0,-bz),vertex(spin,tx,h,-tz),vertex(spin,-tx,h,-tz),
             ['#47506b','#444a63','#41485e','#465169'][j]);
      }
      const trim='#94a6bf';
      for(const x of [-1,1])line(p,front(x,0),front(x,1),.31,.20,trim,5);
      for(let j=0;j<5;j++){
        const a=j/5,b=(j+1)/5;
        for(const x of [-1,1])line(p,front(x,a),front(-x,b),.26,.19,trim,5);
        const lo=front(-1,b),hi=front(1,b);
        emit(()=>line(p,lo,hi,.17,.17,j===4?pink:'#a6a4c3',5));
      }
      emit(()=>{
        for(let j=1;j<=20;j++)for(let k=0;k<6;k++){
          if((3*k+7*j)%11>6) continue;
          const x=-.84+k*.33,v=j/21,dy=.32/h;
          quad(vertex(p,...front(x-.075,v-dy)),vertex(p,...front(x+.075,v-dy)),
               vertex(p,...front(x+.075,v+dy)),vertex(p,...front(x-.075,v+dy)),j%4?'#afabc7':'#9abfd3');
        }
      });
      box(p,0,h+.8,0,w*.48,1.6,d*.50,'#595c75');
      for(const side of [-1,1]) {
        const x=side*w*.185;
        line(p,[x,h+.5,0],[x,h+12.2,0],.22,.095,'#a499ae',6);
        emit(()=>line(p,[x,h+7.9,0],[x,h+10.2,0],.19,.15,pink,5));
        beacon(p,x,h+12.23,0,pink,.35);
      }
    }

    function cityTower(p,w,d,h,type,seed) {
      if(type===3){taperedTower(p,w,d,h);return;}
      const mass=['#374456','#46465e','#3d4557','#41465b'][seed%4];
      const accent=type===2?mint:type===1?pink:'#b69bd3';
      const low=type===2?h*.66:type===1?h*.80:h;
      box(p,0,low/2,0,w,low,d,mass);
      if(type) {
        const setW=w*(type===2?.70:.77),setD=d*.81;
        box(p,0,(h+low)*.5,.02,setW,h-low,setD,'#49516a');
        emit(()=>box(p,0,low+.10,0,w*1.005,.23,d*1.005,accent));
        if(type===2) {
          // The offset tubes have independent roof heights, giving this tower
          // a readable stepped silhouette even at the starting gate.
          box(p,-w*.44,low*.57,w*.12,w*.31,low*1.14,d*.62,'#444d66');
          box(p,w*.43,low*.42,-d*.13,w*.34,low*.84,d*.71,'#505369');
          box(p,-setW*.12,h+.95,0,setW*.63,1.9,setD*.72,'#61647b');
          emit(()=>box(p,-w*.44,low*1.14,w*.12,w*.312,.23,d*.622,'#a7b6c8'));
          for(const x of [-setW*.25,setW*.20]){
            line(p,[x,h+.45,0],[x,h+10.2,0],.23,.10,'#9a91ad',6);
            emit(()=>line(p,[x,h+6.2,0],[x,h+9.25,0],.17,.11,'#e2c9e0',5));
            beacon(p,x,h+10.18,0,pink,.42);
          }
        } else {
          line(p,[0,h-.2,0],[0,h+5.3,0],.24,.095,'#b3a7be',6);
          beacon(p,0,h+5.45,0,pink,.27);
        }
      }
      const nx=Math.max(3,Math.floor(w/2.7)), nz=Math.max(2,Math.floor(d/3.2)), ny=Math.floor(low/3.4);
      const lights=['#ad8fbc','#8aafd0','#7b9fb5','#bc9fba','#9d9dc6'];
      emit(()=>{
        for(let j=1;j<=ny;j++){
          const y=j*low/(ny+1),z=-d*.5-.035;
          for(let k=0;k<nx;k++){
            const code=(k*37+j*43+seed*47+(j%3)*k*13)%17;
            if(code>7) continue;
            const x=(k+.5)*w/nx-w/2,l=code%3===0?.34:.20;
            quad(vertex(p,x-l*w/nx,y-.34,z),vertex(p,x+l*w/nx,y-.34,z),
                 vertex(p,x+l*w/nx,y+.34,z),vertex(p,x-l*w/nx,y+.34,z),lights[code%5]);
          }
          const x=(p.x<0?1:-1)*(w*.5+.04);
          for(let k=0;k<nz;k++){
            if((seed+3*j+5*k)%8>3) continue;
            const zz=(k+.5)*d/nz-d/2,l=.22*d/nz;
            quad(vertex(p,x,y-.31,zz-l),vertex(p,x,y-.31,zz+l),vertex(p,x,y+.31,zz+l),
                 vertex(p,x,y+.31,zz-l),lights[(seed+j+k)%5]);
          }
        }
        if(type===2) {
          const edge=-w*.35-.025;
          for(const side of [-1,1]) {
            const x=side*edge;
            box(p,x,low+(h-low)*.52,-d*.403,.18,(h-low)*.91,.19,mint);
          }
        }
      });
    }

    function citySkyline() {
      const end=courseFrame(1);
      const sites=[
        [-188,115,22,15,36,0],[-162,101,18,14,43,1],[-136,150,22,17,54,0],[-110,111,25,17,38,0],
        [-84,144,20,19,58,1],[-63,104,20,15,74,2],[-43,159,21,16,43,0],[-19,139,20,17,39,1],
        [7,166,22,16,36,0],[30,129,17,15,48,0],[54,147,25,19,71,3],[79,114,22,15,39,0],
        [108,149,23,16,55,0],[136,110,20,16,46,1],[160,157,18,16,57,0],[186,122,24,16,39,0]
      ];
      sites.forEach(([x,z,w,d,h,type],i)=>{
        const point=relative(end,x,0,z);point.y=ground(point.x,point.z);
        cityTower(point,w,d,h,type,i);
      });
      for(const [f,side] of [[.33,1],[.66,-1],[.80,1]]) {
        const q=courseFrame(f,side*(half+25));
        board(frame(q.x,q.y,q.z,q.yaw+Math.PI-side*.55),13.7,3.7,cells.torque,5.6);
      }
    }

    function speedway() {
      citySkyline();
      const fractions=[.11,.25,.39,.54,.69,.84,.95];
      for(const side of [-1,1]){
        for(let i=0;i<fractions.length;i++){
          const p=courseFrame(fractions[i],side*(half+4.7));
          const f=frame(p.x,p.y,p.z,p.yaw-side*Math.PI/2);
          const roof=side===1 && (i===2||i===3||i===4);
          grandstand(f,Math.min(39,course.length*.092)*(i===6?.76:1),roof?7:(i%3===0?5:6),roof,i+(side>0?1:0));
        }
        for(let i=0;i<6;i++) {
          const p=courseFrame(.032+i*.182,side*(half+13.1));
          lightMast(frame(p.x,p.y,p.z,p.yaw-side*Math.PI/2),range(15.7,21.8),side);
        }
        // Stagger the flags beyond the noticeboards so cloth never masks
        // their punchlines in the driver's approach view.
        for(const f of [.052,.198,.345,.416,.539,.665,.787,.923]) {
          const p=courseFrame(f,side*(half+2.7));
          flag(p,range(4.1,5.4),pick([pink,mint,'#c2b1dc','#86a0ac']));
        }
      }
      const boxSite=courseFrame(.045,-half-9.5);
      controlTower(frame(boxSite.x,boxSite.y,boxSite.z,boxSite.yaw+Math.PI*.5));
      const endBooth=courseFrame(.99,half+13);controlTower(frame(endBooth.x,endBooth.y,endBooth.z,endBooth.yaw-Math.PI*.50));
      for(const [f,side,cell] of [[.069,1,cells.event],[.918,-1,cells.torque]]) {
        const p=courseFrame(f,side*(half+15.8));board(frame(p.x,p.y,p.z,p.yaw+Math.PI*.82),10,2.91,cell,5.75);
      }
      roadsideBulletins();
      for(let i=0;i<8;i++) {
        const p=courseFrame(.115+i*.109,pick([-1,1])*(half+28+range(0,9)));
        if(clear(p.x,p.z,3.45)) trailer(p,pick(['#926780','#517888','#886987']));
      }
      // Grouped tree lines leave the open fairground architecture as the first silhouette.
      for(let i=0;i<98;i++) {
        const p=courseFrame(random(),pick([-1,1])*(half+range(43,100)));
        if(clear(p.x,p.z,3)) pine(p,range(5.7,12.8),true);
      }
    }

    if(course.id==='arizona') desert();
    else if(course.id==='eight') forest();
    else speedway();

    const group=new T.Group();group.name='Trackside scenery';
    function geometry(batch) {
      const geo=new T.BufferGeometry();
      geo.setAttribute('position',new T.Float32BufferAttribute(batch.positions,3));
      return geo;
    }
    const matte=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide});
    for(const batch of solids.values()) {
      if(!batch.positions.length) continue;
      const geo=geometry(batch);
      geo.setAttribute('color',new T.Float32BufferAttribute(batch.colors,3));
      geo.computeVertexNormals();geo.computeBoundingSphere();
      const mesh=new T.Mesh(geo,matte);
      mesh.receiveShadow=true;group.add(mesh);
    }
    if(lamps.positions.length) {
      const geo=geometry(lamps);
      geo.setAttribute('color',new T.Float32BufferAttribute(lamps.colors,3));geo.computeBoundingSphere();
      const mesh=new T.Mesh(geo,new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide,toneMapped:false}));
      mesh.name='Emissive fixtures and signage';group.add(mesh);
    }
    if(glow.positions.length) {
      const geo=geometry(glow);
      geo.setAttribute('color',new T.Float32BufferAttribute(glow.colors,4));geo.computeBoundingSphere();
      const material=new T.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,side:T.DoubleSide,
        toneMapped:false,polygonOffset:true,polygonOffsetFactor:-2});
      const mesh=new T.Mesh(geo,material);mesh.name='Beacon halos and pools of light';mesh.renderOrder=2;group.add(mesh);
    }
    for(const batch of [print,...bulletinPages]) {
      if(!batch.positions.length)continue;
      const geo=geometry(batch);geo.setAttribute('uv',new T.Float32BufferAttribute(batch.uvs,2));
      geo.computeBoundingSphere();
      const map=batch===print?makeSignTexture():makeBulletinTexture(batch.page);
      const ink=new T.MeshBasicMaterial({map,side:T.DoubleSide,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-1});
      const mesh=new T.Mesh(geo,ink);mesh.name=batch===print?'Trackside sponsors':batch.page?'Night shift road signs '+(batch.page+1):'Night shift road signs';group.add(mesh);
    }
    if(shade.positions.length) {
      const geo=geometry(shade);geo.setAttribute('color',new T.Float32BufferAttribute(shade.colors,4));geo.computeBoundingSphere();
      const shadow=new T.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,side:T.DoubleSide,
        polygonOffset:true,polygonOffsetFactor:-1});
      const mesh=new T.Mesh(geo,shadow);mesh.renderOrder=1;group.add(mesh);
    }
    world.add(group);
    return group;
  }

  return {build};
})();
