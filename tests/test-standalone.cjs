/* Load the final HTML at a file URL with no HTTP loader. The real garage, input,
   race and WASM renderer run against a 2D canvas, without a GPU or network. */
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('crypto');
const {JSDOM}=require('jsdom'),cn=require('@napi-rs/canvas');
const file=__dirname+'/../dist/index.html',dom=new JSDOM(fs.readFileSync(file,'utf8'),{url:'file:///Monster-Truck-Madness.html',runScripts:'outside-only',pretendToBeVisual:true});
const win=dom.window,doc=win.document,ctx=dom.getInternalVMContext(),by=id=>doc.getElementById(id),click=id=>by(id).click(),state=new Map(),canvases=new WeakMap(),contexts=new WeakMap();
const emergency=process.argv.includes('--canvas'),portrait=process.argv.includes('--portrait');
if(emergency)win.WebAssembly=undefined;
state.set('mtm96-offroad-racing-1',JSON.stringify({records:{eight:{time:98.63,lap:29.1,truck:2}}}));
Object.defineProperty(win,'localStorage',{value:{getItem:k=>state.get(k)||null,setItem:(k,v)=>state.set(k,v)}});
let now=0,queued=[];win.requestAnimationFrame=f=>(queued.push(f),queued.length);win.matchMedia=()=>({matches:false});win.navigator.getGamepads=()=>[];
Object.defineProperty(win.performance,'now',{value:()=>now});Object.defineProperty(win,'innerWidth',{value:portrait?390:850});
Object.defineProperty(win.HTMLElement.prototype,'clientWidth',{get(){return this.id==='garageView'?(portrait?354:580):(portrait?390:780);}});Object.defineProperty(win.HTMLElement.prototype,'clientHeight',{get(){return this.id==='garageView'?212:(portrait?740:450);}});
function backing(el){let c=canvases.get(el);if(!c){c=cn.createCanvas(el.width,el.height);canvases.set(el,c);}if(c.width!==el.width)c.width=el.width;if(c.height!==el.height)c.height=el.height;return c;}
win.HTMLCanvasElement.prototype.getContext=function(type){
 if(type!=='2d')return null;const el=this;
 if(!contexts.has(this))contexts.set(this,new Proxy({},{
   get(_,key){const n=backing(el).getContext('2d'),v=n[key];if(typeof v!=='function')return v;return (...args)=>v.apply(n,args.map(a=>a?.tagName==='CANVAS'?backing(a):a?.native||a));},
   set(_,key,value){backing(el).getContext('2d')[key]=value;return true;}
 }));return contexts.get(this);
};
vm.runInContext(fs.readFileSync(__dirname+'/../src/three.min.js','utf8'),ctx,{filename:'three.min.js'});
vm.runInContext(require('./support/bundle.cjs').source(['kit','trucks','scenery','audio','fitment-sprites','course','celestial','finish','track','world','contact','physics','motion','props','soilart','oddities','midway-mesa','midway-loop','midway-strip','sponsor-art','neon-art','lcd-art','holo-art','project-fair','midway','salvage-art','parade-art','carnival','electric','crowd','software','view','app']).replace('/*__WASM__*/',fs.readFileSync(__dirname+'/../src/raster.wasm').toString('base64'))+"\nglobalThis.MTMTrucks=MTMTrucks;globalThis.MTMFitmentArt=MTMFitmentArt;",ctx,{filename:'game-bundle.js'});
const tick=(n,dt=.016)=>{for(let i=0;i<n;i++){now+=dt*1000;const q=queued;queued=[];q.forEach(f=>f(now));}};
const press=(type,code,repeat=false)=>win.dispatchEvent(new win.KeyboardEvent(type,{code,repeat}));
const snap=(selector,path)=>{const canvas=doc.querySelector(selector),buf=backing(canvas).toBuffer('image/png');if(path)fs.writeFileSync(path,buf);return crypto.createHash('sha256').update(buf).digest('hex');};
const choose=(id,value)=>{const el=by(id);el.value=String(value);el.dispatchEvent(new win.Event('change',{bubbles:true}));};
const event=i=>doc.querySelectorAll('#cards .card')[i].click(),truck=i=>doc.querySelector('[data-rig="'+i+'"]').click();
const setRow=id=>[0,1,2].map(n=>{choose(id,n);return snap('#garageView canvas');});
const distinct=(views,label)=>assert.equal(new Set(views).size,views.length,label);
async function verify(){
 if(emergency){
   // Browser images decode asynchronously. Install the decoded native images as
   // a transparent test adapter so canvas drawImage sees precisely the asset bytes.
   const art=win.MTMFitmentArt,imgs=new Map();
   await Promise.all([...art.front,...art.rear,...art.wheels.flat()].map(async src=>imgs.set(src,await cn.loadImage(src))));
   win.Image=class {set src(value){this.native=imgs.get(value);}get naturalWidth(){return this.native?.width||0;}get naturalHeight(){return this.native?.height||0;}};
 }
 // Go through the actual menus, honk, inspect a verified sponsor, then stage
 // a perfect launch with the same keyboard messages a browser receives.
 event(2);click('tourButton');tick(4);assert(!by('tourHud').hidden);
 const stops=[...by('tourSelect').options],pick=name=>choose('tourSelect',stops.find(o=>o.textContent===name).value);
 const stripCrowds=stops.filter(o=>o.parentElement.label==='Grandstands').length;
 assert(stripCrowds>=14);assert.equal(stops.length,65+16+6+2+3+2+1+2+stripCrowds);pick('Exact Change Cat');assert.match(by('tourCredit').textContent,/Mint/);
 click('tourHorn');await new Promise(resolve=>setTimeout(resolve,210));assert.match(by('tourLine').textContent,/Nine lives/);
 pick('Pulse');assert.match(by('tourLink').href,/https:\/\/2389\.ai\/research\/products\/pulse\/$/);assert(!by('tourLink').hidden&&by('tourHorn').hidden);
 pick('GO FASTER / THE CORN KNOWS');assert(by('tourLink').hidden&&by('tourHorn').hidden);
 tick(5,.35);choose('tourGroup','float');assert.equal(by('tourSelect').options.length,3);click('tourNext');
 assert.match(by('tourCredit').textContent,/Flyover/);const floatName=by('tourName').textContent;click('tourHorn');await new Promise(resolve=>setTimeout(resolve,410));
 assert(!by('tourHorn').hidden);assert(!by('tourLine').textContent.includes('wake up'));click('tourPrev');assert.notEqual(by('tourName').textContent,floatName);
 choose('tourGroup','yard');assert.equal(by('tourSelect').options.length,4);assert(by('tourHorn').hidden);assert(by('tourLine').textContent.length>12);
 for(const [key,count] of [['project',2],['neon',3],['lcd',2],['holo',1],['crowd',stripCrowds],['sky',2]]){
   choose('tourGroup',key);assert.equal(by('tourSelect').options.length,count);
   assert.equal(by('tourHorn').hidden,key==='sky');
   const still=snap('#stage canvas');tick(5,.17);
   if(key!=='sky')assert.notEqual(snap('#stage canvas'),still,'live '+key+' should animate from its tour');
   if(key==='project'){assert(!by('tourLink').hidden);assert.match(by('tourLink').href,/https:\/\/2389\.ai\/research\/products\//);}
   if(key==='sky'){
     const label=by('tourName').textContent;assert(by('tourTrace').hidden);
     click('tourNext');assert.notEqual(by('tourName').textContent,label);
     assert(!by('tourTrace').hidden);click('tourTrace');assert(!by('tourStarMap').hidden);
     const plate=backing(by('tourStarMap')),px=plate.getContext('2d').getImageData(0,0,plate.width,plate.height).data;
     assert(px.some((n,i)=>i%4===3&&n>120),'constellation lines and labels are actually painted');
     click('tourTrace');assert(by('tourStarMap').hidden);
   }
   if(key==='crowd'||key==='lcd'){
     const subtitle=by('tourLine').textContent;
     click('tourHorn');await new Promise(resolve=>setTimeout(resolve,220));assert.notEqual(by('tourLine').textContent,subtitle,key+' should answer the horn');
   }
 }
 click('tourExit');assert(!by('home').hidden);click('raceButton');tick(4);
 tick(6,.20);assert.equal(by('countdown').textContent,'2');press('keydown','KeyW');tick(4,.20);
 assert.equal(by('mphHud').textContent,'0');assert(parseFloat(by('rpmBar').style.width)>77);
 assert.match(by('startCue').textContent,/through green/);tick(8,.20);
 assert.equal(by('raceMessage').textContent,'Perfect launch');assert(by('startCoach').hidden&&Number(by('mphHud').textContent)>0);
 press('keyup','KeyW');click('pauseButton');click('leaveRace');event(0);
 const stored=()=>JSON.parse(state.get('mtm96-offroad-racing-1'));
 click('recordsButton');
 const records=[...doc.querySelectorAll('.record-item')].map(el=>el.textContent);
 assert(records.some(t=>t.includes('3 laps')&&t.includes('1:38.63')&&t.includes('Snake Bite')));
 assert(records.some(t=>t.includes('5 laps')&&t.includes('No finish recorded')));
 click('recordsDone');
 event(1);assert.equal(by('raceLength').value,'5');choose('raceLength',12);assert.equal(stored().raceLaps.eight,12);
 event(0);assert.equal(by('raceLength').value,'1');
 const sprint=doc.querySelector('#cards .card').textContent;assert(sprint.includes('RALLY'));
 choose('raceLength',12);assert(doc.querySelector('#cards .card').textContent.includes('12 laps'));
 assert(doc.querySelector('#cards .card').textContent.includes('RALLYCROSS'));
 event(1);assert.equal(by('raceLength').value,'12');event(0);assert.equal(by('raceLength').value,'12');
 click('garageButton');const hash=[],names=win.MTMTrucks.roster.map(t=>t.name);
 for(let i=0;i<names.length;i++){
   truck(i);assert.equal(by('rigName').textContent,names[i]);assert.equal(doc.querySelectorAll('#garageView canvas').length,1);
   hash.push(snap('#garageView canvas'));
 }
 distinct(hash,'seven distinct trucks');click('nextTruck');assert.equal(snap('#garageView canvas'),hash[0]);click('prevTruck');assert.equal(snap('#garageView canvas'),hash.at(-1));truck(0);
 // Compare the same truck, same camera and simulation instant. Then restore the
 // exact earlier frame to rule out animated camera or lighting causing differences.
 const tires=setRow('set-tires');distinct(tires,'full truck changes with each tire');
 choose('set-tires',0);assert.equal(snap('#garageView canvas'),tires[0]);
 click('wheelView');const detail=setRow('set-tires');distinct(detail,'wheel inspector changes with each tire');
 choose('set-tires',0);assert.equal(snap('#garageView canvas'),detail[0]);assert.notEqual(detail[0],tires[0]);
 choose('set-tires',1);assert.match(by('wheelPortrait').alt,/deep/i);assert.equal(by('wheelPortrait').src,win.MTMFitmentArt.wheels[0][1]);
 click('rigView');const stance=setRow('set-suspension');distinct(stance,'three suspension stances');choose('set-suspension',1);assert.equal(snap('#garageView canvas'),stance[1]);
 choose('set-suspension',0);assert.match(by('rideSpec').textContent,/34 cm/);click('testSpring');tick(3);assert.notEqual(snap('#garageView canvas'),stance[0]);
 truck(1);choose('set-tires',2);choose('set-suspension',2);truck(0);assert.equal(by('set-tires').value,'1');assert.equal(by('set-suspension').value,'0');
 assert.equal(doc.querySelector('[data-rig="0"] .fleet-tile').style.backgroundPosition,'50% 0%');
 assert.equal(by('homeWheel').getAttribute('src'),win.MTMFitmentArt.wheels[0][1]);assert.equal(by('homeFitLabel').textContent,'Deep tread · Soft');
 assert.deepEqual(stored().fits.slice(0,2).map(s=>[s.tires,s.suspension]),[[1,0],[2,2]]);
 click('garageDone');click('raceButton');tick(4);assert(by('modal').hidden);
 assert.equal(by('lapHud').textContent,'1 / 12');assert.match(by('hudMode').textContent,/RALLYCROSS.*BIGFOOT/);
 press('keydown','KeyB');click('hornButton');click('pauseButton');click('leaveRace');
 event(2);assert(by('lengthPicker').hidden);
 const raceView=(t,s)=>{
   click('garageButton');truck(0);choose('set-tires',t);choose('set-suspension',s);click('garageDone');
   click('raceButton');tick(4);assert(by('modal').hidden);
   const frame=snap('#stage canvas');click('pauseButton');click('leaveRace');return frame;
 };
 const raceTires=[0,1,2].map(t=>raceView(t,1));distinct(raceTires,'all tires render in the actual race');
 assert.equal(raceView(0,1),raceTires[0],'identical chase camera after refit');
 const raceStances=[0,1,2].map(s=>raceView(0,s));distinct(raceStances,'all suspensions render in the actual race');
 click('garageButton');truck(3);choose('set-transmission',1);click('garageDone');
 assert.equal(by('home').dataset.truck,'3');assert.equal(by('featuredName').textContent,'CAROLINA CRUSHER');assert.equal(by('transmissionStatus').textContent,'Manual transmission');
 assert.equal(stored().truck,3);click('raceButton');tick(4);
 // A stationary truck and a frozen clock isolate camera motion from physics.
 const pointer=(target,type,x,y,buttons)=>{const e=new win.MouseEvent(type,{bubbles:true,button:2,buttons,clientX:x,clientY:y});Object.defineProperty(e,'pointerId',{value:17});target.dispatchEvent(e);};
 tick(1,0);const ahead=snap('#stage canvas');
 pointer(by('stage'),'pointerdown',200,170,2);pointer(win,'pointermove',439,180,2);tick(1,0);
 assert.notEqual(snap('#stage canvas'),ahead,'right-drag changes the view');
 pointer(win,'pointerup',439,180,0);tick(1,0);assert.equal(snap('#stage canvas'),ahead,'release restores the forward view exactly');
 assert.match(by('hudMode').textContent,/CAROLINA CRUSHER/);assert.equal(by('gearHud').textContent,'1');
 tick(18,.20);press('keydown','KeyW');tick(10,.12);press('keydown','KeyE');assert.equal(by('gearHud').textContent,'2');
 tick(4,.12);press('keydown','KeyE',true);assert.equal(by('gearHud').textContent,'2');press('keyup','KeyW');
 click('camButton');assert(doc.body.classList.contains('cockpit'));click('pauseButton');click('leaveRace');
 console.log((emergency?'Canvas sprites':'WASM meshes')+': exact offline framebuffer checks passed for 7 trucks, all 3 tires in full / close-up / race views, all 3 stances, bounce test, per-truck saved settings, 12-lap HUD, migrated records, horn, cockpit and manual shifts.');
 dom.window.close();
}
verify().catch(e=>{console.error(e);dom.window.close();process.exitCode=1;});
