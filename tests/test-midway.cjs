/* Exercise the mounted race scene. Each track must contain its complete crew,
   public ad buy and joke boards, with visible approaches and replayable horns. */
const fs=require('node:fs'),vm=require('vm'),assert=require('node:assert/strict'),cn=require('@napi-rs/canvas');
global.window=global;global.THREE=require('../src/three.min.js');global.matchMedia=()=>({matches:false});global.innerWidth=960;global.innerHeight=630;global.devicePixelRatio=1;
let frame;const host={clientWidth:960,clientHeight:630,appendChild(c){frame=c;}};
global.document={createElement(){const c=cn.createCanvas(8,8),context=c.getContext.bind(c);c.getContext=(name,...args)=>name==='2d'?context(name,...args):null;return c;},getElementById(){return host;}};
for(const name of ['kit','course','celestial','finish','track','scenery','trucks','world','contact','physics','props','soilart','oddities','midway-mesa','midway-loop','midway-strip','sponsor-art','neon-art','lcd-art','holo-art','project-fair','midway','salvage-art','parade-art','carnival','electric','crowd','software','view']){
 const code=fs.readFileSync(__dirname+'/../src/'+name+'.js','utf8').replace('/*__WASM__*/',fs.readFileSync(__dirname+'/../src/raster.wasm').toString('base64'));
 vm.runInThisContext(code,{filename:name});
}
// Compare the complete lookout frame with the isolated star and lunar mesh.
// This catches gantries and moving floats eclipsing the disk after scenery edits.
function checkMoon(g){
 const e=g.c.lookouts[0];g.tourStop=e;MTMView.tour(g,e,0);
 const w=frame.width,h=frame.height,cam=new THREE.PerspectiveCamera(e.fov,w/h,.18,1350);
 cam.position.set(e.x,e.y,e.z);const d=e.direction;
 cam.lookAt(e.x+d.x*100,e.y+d.y*100-e.drop,e.z+d.z*100);cam.updateMatrixWorld();
 const scene=new THREE.Scene(),sky=MTMCelestial.build(g.c.id);
 sky.position.copy(cam.position);MTMCelestial.focus(sky,cam);scene.add(sky);
 const ref=MTMSoftwareRenderer();ref.setPixelRatio(1);ref.setSize(w,h);ref.render(scene,cam);
 const source=ref.domElement.getContext('2d').getImageData(0,0,w,h).data;
 const at=new THREE.Vector3(d.x,d.y,d.z).multiplyScalar(1000).add(cam.position).project(cam);
 const x=(at.x+1)*w/2,y=(1-at.y)*h/2,rad=h/2*Math.tan(d.diameter*Math.PI/360)/Math.tan(e.fov*Math.PI/360);
 for(const t of [0,13.5,27]){
   MTMView.tour(g,e,t);
   const shot=frame.getContext('2d').getImageData(0,0,w,h).data;
   let bright=0,clear=0;
   for(let j=Math.floor(y-rad);j<=Math.ceil(y+rad);j++)for(let i=Math.floor(x-rad);i<=Math.ceil(x+rad);i++){
     if((i-x)**2+(j-y)**2>rad**2)continue;
     const k=(j*w+i)*4;if(source[k]<100)continue;
     bright++;if(Math.abs(source[k]-shot[k])+Math.abs(source[k+1]-shot[k+1])+Math.abs(source[k+2]-shot[k+2])<30)clear++;
   }
   assert(bright>60,'mapped lunar terrain should be resolved');
   assert(clear/bright>.97,g.c.layoutKey+' lunar visibility at '+t+'s: '+(clear/bright));
 }
}
const names=new Set(),jokes=new Set(),ids=new Set(),projects=new Set();
let row=0;
const gallery=cn.createCanvas(1200,4100),sheet=gallery.getContext('2d');
for(const [layout,rides,ads,signs] of [[MTMCourses[0],9,9,62],[MTMCourses.forDistance(0,4),14,14,94],[MTMCourses[1],12,10,58],[MTMCourses[2],12,8,58]]){
 const g=MTMPhysics.create(layout,0,{difficulty:0,tires:1,suspension:1,gearing:1});MTMView.raceStart(g);
 const entries=g.c.midway,stops=MTMMidway.catalog(g.c,entries,g.c.jokeSigns);
 assert.equal(entries.filter(e=>e.kind==='attraction').length,rides);assert.equal(entries.filter(e=>e.kind==='sponsor').length,ads);assert.equal(entries.filter(e=>e.kind==='classic').length,1);assert.equal(g.c.jokeSigns.length,signs);
 const fair=g.c.carnival;
 console.log(layout.layoutKey,'salvage',fair.pieces.length,'models',new Set(fair.pieces.map(p=>p.kit.id)).size,'pennants',fair.strands.length*8,'flyovers',fair.air.length,'markets',fair.venues.length,'breakables',g.props.length);
 assert(fair.pieces.length>100);assert(fair.strands.length>0);assert.equal(fair.air.length,layout.layoutKey==='arizona-circuit'?6:3);assert.equal(fair.venues.length,layout.layoutKey==='arizona-circuit'?6:4);
 const electronic=entries.filter(e=>['project','neon','lcd','holo'].includes(e.kind));
 const planned=[...MTMNeonArt,...MTMLcdArt,...MTMHoloArt,...MTMProjectFair].filter(e=>e.region===layout.id&&(!e.route||layout.layoutKey==='arizona-circuit'));
 assert.deepEqual(electronic.map(e=>e.id).sort(),planned.map(e=>e.id).sort(),layout.layoutKey+' must host all its commissioned acts');
 assert.equal(stops.length,rides+ads+signs+2+fair.air.length+fair.venues.length+electronic.length+g.c.crowd.sections.length+2);
 assert.equal(stops.filter(e=>e.kind==='sky').length,2);
 for(const e of electronic)assert(g.c.nearest(e.x,e.z).distance>g.c.width*.5+e.footprintRadius);
 checkMoon(g);
 const strings=g.c.jokeSigns.filter(b=>b.electric);
 assert(strings.length>=8);assert(strings.every(b=>b.electric.bulbs.length>=10));
 const section=g.c.crowd.sections[0];assert(section&&g.c.crowd.sections.every(s=>s.fans.length>8));
 MTMCrowd.react(g,30,section,1.15);
 assert.equal(MTMCrowd.energy(g,section,29.9),0);assert(MTMCrowd.energy(g,section,30.4)>.6);
 const tosses=t=>{const a=[];MTMCrowd.projectiles(g.c.crowd,g,t,section,(...args)=>a.push(args));return a;};
 const show=tosses(30.9);assert(show.length>6);assert.deepEqual(show,tosses(30.9));
 assert.deepEqual(tosses(20),tosses(20));
 console.log(layout.layoutKey,electronic.length,'electronic stops,',strings.length,'chase signs,',g.c.crowd.sections.length,'fan clubs,',g.c.crowd.sections.reduce((n,s)=>n+s.fans.length,0),'fans');
 for(const p of fair.pieces)assert(layout.nearest(p.x,p.z).distance>layout.width*.5+p.r);
 const arts=entries.filter(e=>e.kind==='attraction'||e.kind==='sponsor');
 for(const e of arts){
   if(e.kind==='attraction'){ids.add(e.id);names.add(e.crew);}
   else {projects.add(e.name);assert.match(e.url,/^https:\/\/2389\.ai\/research\/products\/[a-z-]+\/$/);}
   assert(g.c.nearest(e.x,e.z).distance>g.c.width*.5);
 }
 for(const b of g.c.jokeSigns)jokes.add(b.lines.join(' / '));
 let i=0;const unique=stops.filter(e=>['project','neon','lcd','holo','crowd','sky'].includes(e.kind));
 for(const e of unique){
   g.tourStop=e;
   if(e.kind==='attraction'){
     g.p.x=e.x;g.p.z=e.z;assert.equal(MTMMidway.near(g).id,e.id);
     assert(MTMMidway.signal(g,e,4));assert(!MTMMidway.signal(g,e,4.2));
     assert.equal(MTMMidway.response(g,e,3.99),0);assert.equal(MTMMidway.response(g,e,4),1);
     assert(MTMMidway.response(g,e,4.5)>.2);assert.equal(MTMMidway.response(g,e,6),0);
   }
   MTMView.tour(g,e,4.35);
   const x=(i%5)*240,y=(row+Math.floor(i/5))*165;
   sheet.drawImage(frame,x,y,240,145);sheet.fillStyle='#182638';sheet.fillRect(x,y+145,240,20);sheet.fillStyle='#fff';sheet.font='bold 13px sans-serif';sheet.fillText(layout.id+' / '+e.name,x+4,y+159);
   i++;
 }
 const wave=g.c.midway.filter(e=>e.reply).map(e=>({e,near:fair.air.concat(g.c.midway).filter(v=>v!==e&&v.reply&&Math.hypot(v.x-e.x,v.z-e.z)<88).length})).sort((a,b)=>b.near-a.near)[0].e;
 assert(MTMMidway.hornWave(g,wave,25));assert(g.carnivalBursts.length>=2);
 assert(g.carnivalBursts.some(b=>b.t>25.05&&b.t<26.2));
 const tickets=t=>{const out=[];MTMCarnival.particles(g,t,{x:wave.x,z:wave.z},(...a)=>out.push(a));return out;};
 assert.equal(tickets(24).length,0);assert(tickets(25.4).length>=42);assert.deepEqual(tickets(25.4),tickets(25.4));assert.equal(tickets(30).length,0);
 row+=Math.ceil(i/5);console.log(layout.layoutKey,rides,'attractions + one classic,',ads,'project boards,',signs,'notices');
}
assert.equal(ids.size,38);assert.equal(projects.size,14);assert.equal(jokes.size,210);assert.equal(MTMParadeArt.length,9);assert.equal(MTMSalvageArt.kits.length,30);for(const name of ['Ivan','Dylan','Soon','Sugi','Harper','Eryan','Clint','Mint','Sophie','Eden'])assert(names.has(name));
if(process.env.MTM_CONTACT_SHEET)fs.writeFileSync(process.env.MTM_CONTACT_SHEET,gallery.toBuffer('image/jpeg',84));
