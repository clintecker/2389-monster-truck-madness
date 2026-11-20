/* Screen state, input and fixed-step clock. All persistent data is optional so
   opening the game in a private window or sandbox still works. */
import { MTMAudio } from './audio.js';
import { MTMCarnival } from './carnival.js';
import { MTMCourses } from './course.js';
import { MTMCrowd } from './crowd.js';
import { MTMFinish } from './finish.js';
import { MTMMidway } from './midway.js';
import { MTMMotion } from './motion.js';
import { MTMPhysics } from './physics.js';
import { MTMTrucks } from './trucks.js';
import { MTMView } from './view.js';
import { MTMWorld } from './world.js';
import { MTMFitmentArt } from './fitment-sprites.js';

(() => {
  'use strict';
  const $=id=>document.getElementById(id),P=MTMPhysics,V=MTMView,A=MTMAudio,roster=MTMTrucks.roster,cs=MTMCourses;
  const icon=n=>`<svg aria-hidden="true"><use href="#i-${n}"/></svg>`,cap=(v,a,b)=>Math.max(a,Math.min(b,v)),ord=n=>n+(['st','nd','rd'][n-1]||'th');
  const time=t=>{const c=Math.max(0,Math.floor(t*100+1e-6));return Math.floor(c/6000)+':'+String(Math.floor(c/100)%60).padStart(2,'0')+'.'+String(c%100).padStart(2,'0');};
  const localKey='mtm96-offroad-racing-1';let saved={};try{saved=JSON.parse(localStorage.getItem(localKey)||'{}')||{};}catch(e){}
  const valid=(v,max,def)=>Number.isInteger(v)&&v>=0&&v<=max?v:def;
  const cfg={truck:valid(saved.truck,roster.length-1,0),event:valid(saved.event,cs.length-1,0),tires:valid(saved.tires,2,0),suspension:valid(saved.suspension,2,1),gearing:valid(saved.gearing,2,1),transmission:valid(saved.transmission,1,0),difficulty:valid(saved.difficulty,2,0),muted:saved.muted===true,announcer:saved.announcer!==false};
  // Tires, springs and differential belong to the truck. Transmission mode
  // belongs to the driver. Carry a legacy global setup onto its active truck.
  const fitKeys=['tires','suspension','gearing'];
  const fits=roster.map((_,i)=>{
    const old=saved.fits?.[i]||(i===cfg.truck?saved:{});
    return {tires:valid(old.tires,2,[0,1,1,2,2,0,1][i]??0),suspension:valid(old.suspension,2,[1,0,1,2,1,2,0][i]??1),gearing:valid(old.gearing,2,1)};
  });
  Object.assign(cfg,fits[cfg.truck]);
  // Timing is keyed by physical route and distance. A sprint and a twelve-lap
  // enduro have separate records even though they share a truck and scenery.
  const storedLaps=saved.raceLaps||{};
  const maxDistance=i=>i===2?1:i<2?cs.maxLaps:12;
  const raceLaps=cs.map((c,i)=>Number.isInteger(storedLaps[c.layoutKey])&&storedLaps[c.layoutKey]>=1&&storedLaps[c.layoutKey]<=maxDistance(i)&&c.id!=='indiana'?storedLaps[c.layoutKey]:c.laps);
  const eventFor=i=>cs.forDistance(i,raceLaps[i]);
  const records={};
  cs.forEach((c,i)=>{for(let n=1;n<=maxDistance(i);n++){
    const k=cs.recordKey(i,n),v=saved.records?.[k];if(!v||!Number.isFinite(v.time)||v.time<=0)continue;
    records[k]={time:v.time,truck:valid(v.truck,roster.length-1,0),lap:Number.isFinite(v.lap)&&v.lap>0?v.lap:null};
  }});
  function save(){try{localStorage.setItem(localKey,JSON.stringify({...cfg,fits,records,raceLaps:Object.fromEntries(cs.map((c,i)=>[c.layoutKey,raceLaps[i]]))}));}catch(e){}}
  let state='home',g=null,motion=null,dialog='',returnFocus=null,pauseFrom='',series=null,result=null,count=0,fin=0,toastTimer=0,messageUntil=0,countDigit='',raf=0,last=0,acc=0,slowFrames=0,prevPad={},retrying=false;
  let frames=[],nextFrame=0,replayT=0,replayIndex=0,replayDisplay=null,replayCars=null,captureClock=0;
  const keys=new Set(),touch=new Set(),empty={throttle:0,brake:0,steer:0,handbrake:false};
  const hud=$('hud'),home=$('home'),modal=$('modal'),panel=modal.querySelector('.panel'),mapCtx=$('miniMap').getContext('2d');
  function soundSync(){A.setMuted(cfg.muted);document.querySelectorAll('[data-sound]').forEach(b=>{b.innerHTML=icon(cfg.muted?'muted':'sound');b.title=cfg.muted?'Enable sound (M)':'Mute sound (M)';b.setAttribute('aria-label',b.title);b.setAttribute('aria-pressed',String(!cfg.muted));});}
  function unlock(){A.unlock();A.setMuted(cfg.muted);}
  function say(s){if(cfg.announcer&&!cfg.muted)A.call(s);}
  function notify(s){$('toast').textContent=s;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{$('toast').hidden=true;},2100);}
  function message(s,dur=1.3){$('raceMessage').textContent=s;$('raceMessage').classList.add('on');messageUntil=performance.now()+1000*dur;}
  function countText(s){if(countDigit!==s){countDigit=s;$('countdown').textContent=s;if(s==='Go!')V.startSignal?.(0);else if(/^[1-3]$/.test(s))V.startSignal?.(+s);}}
  function viewHidden(yes){hud.hidden=yes;}
  function setAudioMuted(){unlock();cfg.muted=!cfg.muted;soundSync();save();}
  soundSync();document.querySelectorAll('[data-sound]').forEach(b=>b.onclick=setAudioMuted);
  async function full(){try{if(document.fullscreenElement||document.webkitFullscreenElement){const exit=document.exitFullscreen||document.webkitExitFullscreen;await exit.call(document);}else{const fn=document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen;if(!fn)throw Error();await fn.call(document.documentElement);}}catch(e){notify('Fullscreen is unavailable in this view.');}}
  document.querySelectorAll('[data-full]').forEach(b=>b.onclick=full);
  // Project the real course into a fixed card/minimap viewport, preserving shape.
  function mapper(c,w,h,pad,card=false){const b=c.bounds,ang=card?(c.id==='arizona'?-.37:c.id==='eight'?-1.02:1.04):0,co=Math.cos(ang),si=Math.sin(ang),cx=(b.minX+b.maxX)/2,cz=(b.minZ+b.maxZ)/2;
    function transform(x,z){const a=x-cx,b=z-cz;return [a*co-b*si,-(a*si+b*co)];}
    let loX=Infinity,hiX=-Infinity,loY=Infinity,hiY=-Infinity;for(const s of c.samples){const [x,y]=transform(s.x,s.z);loX=Math.min(loX,x);hiX=Math.max(hiX,x);loY=Math.min(loY,y);hiY=Math.max(hiY,y);}
    const scale=Math.min((w-pad*2)/Math.max(1,hiX-loX),(h-pad*2)/Math.max(1,hiY-loY));return (x,z)=>{const a=transform(x,z);return [w/2+(a[0]-(hiX+loX)/2)*scale,h/2+(a[1]-(hiY+loY)/2)*scale];};}
  function cardMap(c,i){const m=mapper(c,124,89,10,true),p=c.samples.filter((q,j)=>j%4===0||j===c.samples.length-1).map(q=>m(q.x,q.z)),d=p.map((q,j)=>(j?'L':'M')+q[0].toFixed(1)+' '+q[1].toFixed(1)).join(' '),first=p[0],end=p[p.length-1];return `<svg viewBox="0 0 124 89" class="card-map" aria-hidden="true"><defs><pattern id="grid${i}" width="11" height="11" patternUnits="userSpaceOnUse"><path d="M11 0H0V11" stroke="currentColor" stroke-width=".5" opacity=".17"/></pattern></defs><rect x="0" y="0" width="124" height="89" fill="url(#grid${i})" stroke="none"/><path d="${d}" stroke="#081121" stroke-width="6"/><path d="${d}" stroke="currentColor" stroke-width="2.4"/><circle cx="${first[0]}" cy="${first[1]}" r="3.6" fill="#101828" stroke="currentColor" stroke-width="1.7"/>${c.loop?'':`<rect x="${end[0]-3}" y="${end[1]-3}" width="6" height="6" fill="currentColor" stroke="none"/>`}</svg>`;}
  const lapLabel=n=>n+(n===1?' lap':' laps');
  const desc=c=>c.id==='indiana'?'¼ mile · Head-to-head':c.loop?lapLabel(c.laps)+' · '+(c.length/1609.344).toFixed(2)+' mi / lap':(c.length/1609.344).toFixed(2)+' mi · '+c.gates.length+' gates';
  function paintEvent(i){
    const c=eventFor(i),b=$('cards').children[i];
    b.setAttribute('aria-label','Select '+c.name+', '+c.classic+', '+c.type);
    b.innerHTML=`<span class="card-type">${c.type.toUpperCase()}<i class="slash"></i><span class="original-course">${c.classic}</span></span><strong class="card-title">${c.name}</strong><span class="card-desc">${desc(c)}</span>${cardMap(c,i)}`;
  }
  cs.forEach((c,i)=>{
    const b=document.createElement('button');b.type='button';b.className='card';b.dataset.event=c.id;b.dataset.layout=c.layoutKey;
    b.onclick=()=>{unlock();select(i);A.effect('select');};$('cards').appendChild(b);paintEvent(i);
  });
  function select(i){
    const after=i>=3;
    $('cupClassic').setAttribute('aria-pressed',String(!after));$('cupAfter').setAttribute('aria-pressed',String(after));
    [...$('cards').children].forEach((b,j)=>b.hidden=(j>=3)!==after);
    cfg.event=i;
    [...$('cards').children].forEach((b,j)=>{b.classList.toggle('active',i===j);b.setAttribute('aria-pressed',String(i===j));});
    $('lengthPicker').hidden=i===2;
    if(i!==2){
      const opts=Array.from({length:maxDistance(i)},(_,j)=>new Option(j===12?'Long course · 1 lap':i===0&&j===0?'Sprint':lapLabel(j+1),String(j+1)));
      $('raceLength').replaceChildren(...opts);$('raceLength').value=String(raceLaps[i]);
    }
    save();
  }
  $('cupClassic').onclick=()=>select(0);
  $('cupAfter').onclick=()=>select(3);
  $('raceLength').onchange=e=>{
    const i=cfg.event,n=Number(e.target.value);
    if(i===2||!Number.isInteger(n)||n<1||n>maxDistance(i))return;
    raceLaps[i]=n;paintEvent(i);save();A.effect('select');
  };
  function garageLabel(){
    const rig=roster[cfg.truck],name=rig.name.toUpperCase(),tire=MTMTrucks.tireSets[cfg.tires].name;
    home.dataset.truck=String(cfg.truck);$('driveStatus').textContent=name;$('featuredName').textContent=name;
    $('transmissionStatus').textContent=(cfg.transmission?'Manual':'Automatic')+' transmission';
    $('garageButton').title='Open garage. Current truck: '+rig.name;
    const source=MTMFitmentArt?.wheels[cfg.truck][cfg.tires];
    if(source&&$('homeWheel').getAttribute('src')!==source)$('homeWheel').src=source;
    $('homeFitLabel').textContent=tire+' · '+MTMTrucks.suspensionSets[cfg.suspension].name;
    $('homeFit').setAttribute('aria-label','Inspect '+rig.name+' with '+tire+' tires');
  }
  select(cfg.event);garageLabel();
  function openDialog(type,kicker,html,wide=false){if(modal.hidden)returnFocus=document.activeElement;dialog=type;modal.hidden=false;panel.classList.toggle('wide',wide);$('dialogEyebrow').textContent=kicker;$('dialogBody').innerHTML=html;home.inert=true;hud.inert=true;$('closeModal').hidden=type==='result'&&!!series;panel.scrollTop=0;const focus=$('dialogBody').querySelector('[autofocus]')||$('closeModal');if(!focus.hidden)focus.focus({preventScroll:true});}
  function hideDialog(restore=true){if(dialog==='garage')V.exitGarage();dialog='';modal.hidden=true;home.inert=false;hud.inert=false;if(restore&&returnFocus?.isConnected&&!returnFocus.closest('[hidden]'))returnFocus.focus({preventScroll:true});returnFocus=null;}
  function close(){if(dialog==='pause')resume();else if(dialog==='result'){goHome();}else if(dialog==='guide'&&state==='paused'){pauseDialog();}else hideDialog();}
  $('closeModal').onclick=close;modal.addEventListener('pointerdown',e=>{if(e.target===modal&&!['pause','result'].includes(dialog))close();});
  const btn=(id,text,kind='secondary',glyph='')=>`<button id="${id}" class="${kind}">${glyph?icon(glyph):''}${text}</button>`;
  function showGuide(){openDialog('guide','2389 RESEARCH / DRIVER HANDBOOK',`<h2 id="dialogTitle">Driving controls</h2><table class="control-tbl"><thead><tr><th>Action</th><th>Keyboard</th><th>Gamepad</th></tr></thead><tbody>${[['Accelerate','W / ↑','RT · A'],['Brake / reverse','S / ↓','LT · X'],['Steer','A D / ← →','Left stick'],['Handbrake','Space','B'],['Sound the horn','B','Left stick click'],['Manual shift down / up','Q / E','D-pad ↓ / ↑'],['Change camera','C','Y'],['Look around','Hold right mouse + drag','Release to center'],['Recover truck','R / H','LB'],['Pause','Esc / P','Menu']].map(r=>`<tr><td>${r[0]}</td><td><kbd>${r[1]}</kbd></td><td>${r[2]}</td></tr>`).join('')}</tbody></table><p class="guide-tip">On the grid, press and hold the throttle as 2 lights up for a faster launch. In manual, select first gear. Honk at the trackside attractions to wake them up.</p><p class="guide-tip">Pass each checkpoint with mint lights on your left and pink on your right. The arrow points to your next gate. In automatic, hold brake at a standstill to reverse. In manual, use Q and E to select R, N or gears 1–5. Gas powers the selected gear.</p><div class="actions">${btn('guideDone',state==='paused'?'Back to pause':'Got it','primary')}${btn('voiceToggle','Announcer '+(cfg.announcer?'on':'off'))}</div>`);$('guideDone').onclick=close;$('voiceToggle').onclick=()=>{cfg.announcer=!cfg.announcer;save();$('voiceToggle').textContent='Announcer '+(cfg.announcer?'on':'off');};}
  $('guideButton').onclick=showGuide;
  const options={transmission:['Automatic','Manual · 5-speed'],gearing:['Acceleration','Balanced','Top speed'],tires:['All-terrain','Deep tread','Hardpack'],suspension:['Soft','Balanced','Firm'],difficulty:['Rookie','Intermediate','Professional']};
  const treads=['Chevron lugs · mixed ground','Open paddles · mud and sand','Close-set blocks · packed dirt'];
  function setupField(key,label){
    const opts=options[key].map((v,i)=>`<option value="${i}">${v}</option>`).join('');
    return `<label for="set-${key}" class="small-label">${label}</label><select id="set-${key}">${opts}</select>`;
  }
  function showGarage(){
    unlock();
    openDialog('garage','2389 RESEARCH / MOTOR POOL',`<h2 id="dialogTitle">Garage</h2>
      <div class="garage-view" id="garageView">
        <div class="garage-cameras" role="group" aria-label="Garage camera"><button id="rigView" aria-pressed="true">Truck</button><button id="wheelView" aria-pressed="false">Wheel detail</button></div>
        <button class="icon prev" id="prevTruck" aria-label="Previous truck">${icon('left')}</button><button class="icon next" id="nextTruck" aria-label="Next truck">${icon('right')}</button>
      </div>
      <div class="garage-name"><i id="swatch"></i><h3 id="rigName" aria-live="polite"></h3><small class="small-label" id="rigIndex"></small></div>
      <p class="pool-note" id="poolNote" hidden></p>
      <div class="fleet-list" role="group" aria-label="Choose truck">${roster.map((r,i)=>`<button type="button" data-rig="${i}" aria-label="Choose ${r.name}"><span class="fleet-tile" aria-hidden="true"></span><span>${r.name}</span></button>`).join('')}</div>
      <div class="fitment-row">
        <div class="fitment-part"><button class="wheel-photo" id="inspectFitment" aria-label="Inspect fitted front wheel"><img id="wheelPortrait" alt=""></button><div class="setting">${setupField('tires','Tires')}<small id="treadSpec"></small></div></div>
        <div class="fitment-part spring-part"><div class="setting">${setupField('suspension','Suspension')}<small id="rideSpec"></small></div><button class="spring-test" id="testSpring">Bounce test</button></div>
      </div>
      <div class="settings driveline">${[['transmission','Transmission'],['gearing','Final drive'],['difficulty','Opponent skill']].map(([k,label])=>`<div class="setting">${setupField(k,label)}</div>`).join('')}</div>
      <div class="actions">${btn('garageDone','Return to events','primary')}</div>`,true);
    for(const k of Object.keys(options))$('set-'+k).onchange=e=>{
      cfg[k]=Number(e.target.value);
      if(fitKeys.includes(k))fits[cfg.truck][k]=cfg[k];
      if(k==='tires'||k==='suspension')paintTruck();
      garageLabel();A.effect('select');save();
    };
    panel.querySelectorAll('[data-rig]').forEach(b=>{
      const i=+b.dataset.rig,tile=b.querySelector('.fleet-tile'),src=MTMFitmentArt?.front[i];
      if(src)tile.style.backgroundImage='url("'+src+'")';
      b.onclick=()=>chooseTruck(i);
    });
    const toggleCamera=wheel=>{
      $('rigView').setAttribute('aria-pressed',String(!wheel));$('wheelView').setAttribute('aria-pressed',String(wheel));
      V.inspectWheel(wheel);
    };
    $('rigView').onclick=()=>toggleCamera(false);$('wheelView').onclick=()=>toggleCamera(true);
    $('inspectFitment').onclick=()=>toggleCamera(true);$('testSpring').onclick=()=>V.testSuspension();
    $('prevTruck').onclick=()=>changeTruck(-1);$('nextTruck').onclick=()=>changeTruck(1);$('garageDone').onclick=close;paintTruck();
    let dragX=null;const gv=$('garageView');
    gv.addEventListener('pointerdown',e=>{if(e.target.tagName==='CANVAS'){dragX=e.clientX;gv.setPointerCapture(e.pointerId);}});
    gv.addEventListener('pointermove',e=>{if(dragX!==null){V.turnGarage((e.clientX-dragX)*.012);dragX=e.clientX;}});
    gv.addEventListener('pointerup',()=>{dragX=null;});gv.addEventListener('pointercancel',()=>{dragX=null;});
  }
  function paintTruck(){
    const r=roster[cfg.truck];
    panel.querySelectorAll('[data-rig]').forEach(b=>{
      const i=+b.dataset.rig;
      b.setAttribute('aria-pressed',String(i===cfg.truck));
      b.querySelector('.fleet-tile').style.backgroundPosition=(50*fits[i].tires)+'% '+(50*fits[i].suspension)+'%';
    });
    for(const k of Object.keys(options))$('set-'+k).value=String(cfg[k]);
    $('rigName').textContent=r.name;$('swatch').style.background=r.color;$('rigIndex').textContent=String(cfg.truck+1).padStart(2,'0')+' / '+String(roster.length).padStart(2,'0');
    // Caddy #83 is the only rig with a motor pool note. Every other rig clears
    // the line, so the inspection rule never follows the player to another truck.
    const pool=r.motorPool;$('poolNote').textContent=pool?.garage||'';$('poolNote').hidden=!pool;
    const source=MTMFitmentArt?.wheels[cfg.truck][cfg.tires];if(source)$('wheelPortrait').src=source;
    $('wheelPortrait').alt=r.name+' '+options.tires[cfg.tires]+' wheel';$('treadSpec').textContent=treads[cfg.tires];
    const cm=Math.round(MTMTrucks.suspensionSets[cfg.suspension].lift*100);$('rideSpec').textContent=cm===0?'Stock ride height':(cm>0?'+':'−')+Math.abs(cm)+' cm ride height';
    V.showroom($('garageView'),cfg.truck,cfg);garageLabel();
  }
  function chooseTruck(i){
    if(cfg.truck===i)return;cfg.truck=i;Object.assign(cfg,fits[i]);paintTruck();save();A.effect('select');
  }
  function changeTruck(d){chooseTruck((cfg.truck+d+roster.length)%roster.length);}
  $('garageButton').onclick=showGarage;
  $('homeFit').onclick=()=>{showGarage();$('wheelView').click();};
  function showRecords(){
    const rows=[];
    cs.forEach((base,i)=>{
      for(let n=1;n<=maxDistance(i);n++){
        const r=records[cs.recordKey(i,n)];if(!r&&n!==raceLaps[i])continue;
        const c=cs.forDistance(i,n),label=n===13?'Long course · 1 lap':c.loop?c.type+' · '+lapLabel(n):c.id==='arizona'?'Rally sprint':'¼-mile drag';
        rows.push(`<div class="record-item"><div><span class="small-label">${label}</span><strong>${base.name}</strong><span class="small-label">${r?roster[r.truck].name:'No finish recorded'}</span></div><b>${r?time(r.time):'—'}</b></div>`);
      }
    });
    openDialog('records','NIGHT SHIFT / LOCAL TIMING',`<h2 id="dialogTitle">Race records</h2><div class="record-list">${rows.join('')}</div><div class="actions">${btn('recordsDone','Back to events','primary')}</div>`);
    $('recordsDone').onclick=close;
  }
  $('recordsButton').onclick=showRecords;
  function showSeries(){
    const after=cfg.event>=3,events=after?[3,4,5]:[0,1,2];
    openDialog('series','2389 / '+(after?'AFTER HOURS':'CLASSIC CUP'),`<h2 id="dialogTitle">Tournament</h2><p>Race all three events in the same truck. Places earn 10, 6, 4 and 2 points.</p><div class="record-list">${events.map((idx,i)=>{const c=eventFor(idx);return `<div class="record-item"><div><span class="small-label">ROUND 0${i+1} / ${c.loop?lapLabel(c.laps):c.type}</span><strong>${c.name}</strong></div></div>`;}).join('')}</div><div class="actions">${btn('startSeries','Start tournament','primary','flag')}</div>`);
    $('startSeries').onclick=()=>{series={round:0,events,field:Array.from({length:4},(_,i)=>(cfg.truck+i)%roster.length),points:roster.map(()=>0),total:roster.map(()=>0)};start(events[0]);};
  }
  $('seriesButton').removeAttribute('aria-pressed');$('seriesButton').onclick=showSeries;
  let tourRequest=0;
  function goHome(){centerHead();tourRequest++;A.stop();hideDialog(false);state='home';g=null;motion=null;series=null;$('tourHud').hidden=true;$('startCoach').hidden=true;keys.clear();touch.clear();home.hidden=false;viewHidden(true);$('raceButton').disabled=false;$('raceButton').focus({preventScroll:true});document.body.classList.remove('cockpit');}
  const tourCredit={finish:'Finish arena',project:'Project sideshow',attraction:'Attraction',classic:'Attraction',float:'Flyover',yard:'Salvage market',
    neon:'Neon workshop',lcd:'Roadside television',holo:'Holographic revue',crowd:'Fan section',sky:'Night sky'};
  function selectTourStop(index){
    const stops=g.c.tourStops,i=(index+stops.length)%stops.length,e=stops[i];
    g.tourIndex=i;g.tourStop=e;$('tourSelect').value=String(i);
    $('tourHud').style.setProperty('--booth',e.ink);$('tourName').textContent=e.name;
    $('tourCredit').textContent=e.campaign?'2389 Research / '+e.audience:e.kind==='project'?e.projectName+' / '+e.crew:e.kind==='sponsor'?'2389 Research / Project billboard':e.kind==='notice'?'2389 Highway Department':e.crew+' / '+tourCredit[e.kind];
    $('tourMiles').textContent=(e.s/1609.344).toFixed(2)+' mi';
    $('tourLine').textContent=e.slogan||e.caption||(e.reply?'Honk to wake up the neighborhood.':'');
    $('tourHorn').hidden=!e.reply;$('tourLink').hidden=!e.url;
    $('tourCount').textContent=(g.tourRoute.indexOf(i)+1)+' / '+g.tourRoute.length;
    if(e.url)$('tourLink').href=e.url;else $('tourLink').removeAttribute('href');
    V.tour(g,e,g.tourTime);showStarGuide();
  }
  function showStarGuide(){
    const field=g.tourStop.direction,button=$('tourTrace'),map=$('tourStarMap');
    button.hidden=!field?.stars;button.setAttribute('aria-pressed',String(!!g.traceStars));
    map.hidden=button.hidden||!g.traceStars;
    if(!map.hidden)V.traceStars(map,field);
  }
  $('tourTrace').onclick=()=>{if(state==='tour'){g.traceStars=!g.traceStars;showStarGuide();}};
  const tourGroups=[['finish','Finish arena'],['rides','Attractions'],['neon','Neon signs'],['lcd','Giant screens'],['holo','Hologram revue'],['crowd','Grandstands'],['sky','Night sky'],['float','Air parade'],['yard','Salvage markets'],['project','Project sideshows'],['campaign','Sponsor campaigns'],['sponsor','Project billboards'],['notice','Road signs']];
  function filterTour(category,initial=false){
    const menu=$('tourSelect'),stops=g.c.tourStops;
    const kind=e=>e.campaign?'campaign':e.kind==='attraction'||e.kind==='classic'?'rides':e.kind;
    menu.replaceChildren();g.tourRoute=[];
    stops.forEach((e,i)=>{if(category==='all'||category===kind(e))g.tourRoute.push(i);});
    for(const [key,label] of tourGroups){
      if(category!=='all'&&category!==key)continue;
      const group=document.createElement('optgroup');group.label=label;
      for(const i of g.tourRoute)if(kind(stops[i])===key)group.appendChild(new Option(stops[i].name,String(i)));
      if(group.children.length)menu.appendChild(group);
    }
    const favorite=initial?stops.findIndex(e=>e.kind==='neon'):g.tourIndex;
    selectTourStop(g.tourRoute.includes(favorite)?favorite:g.tourRoute[0]);
  }
  function stepTour(direction){
    const a=g.tourRoute,n=a.length,index=a.indexOf(g.tourIndex);
    selectTourStop(a[(index+direction+n)%n]);
  }
  function openTour(){
    if(state!=='home')return;unlock();home.hidden=true;$('tourStarMap').hidden=$('tourTrace').hidden=true;$('tourHud').hidden=false;
    $('tourCourse').textContent=cs[cfg.event].name;$('tourName').textContent='Loading course';
    const visit=++tourRequest,controls=['tourGroup','tourPrev','tourNext','tourSelect'].map($);
    for(const control of controls)control.disabled=true;
    $('tourCredit').textContent='2389 Research';$('tourCount').textContent=$('tourLine').textContent=$('tourMiles').textContent='';
    $('tourHorn').hidden=$('tourLink').hidden=true;$('tourSelect').replaceChildren();
    state='loading';requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if(visit!==tourRequest||state!=='loading')return;
      try{
        g=P.create(eventFor(cfg.event),cfg.truck,{...cfg,fits:fits.map(f=>({...f}))});V.raceStart(g);
        const stops=MTMMidway.catalog(g.c,g.c.midway,g.c.jokeSigns);g.c.tourStops=stops;
        g.tourTime=0;state='tour';$('tourGroup').value='all';filterTour('all',true);
        for(const control of controls)control.disabled=false;
        $('tourExit').focus({preventScroll:true});last=performance.now();
      }catch(error){console.error(error);goHome();notify('Trackside tour could not load.');}
    }));
  }
  $('tourButton').onclick=openTour;
  $('tourExit').onclick=()=>{goHome();$('tourButton').focus({preventScroll:true});};
  $('tourNext').onclick=()=>{if(state==='tour')stepTour(1);};
  $('tourPrev').onclick=()=>{if(state==='tour')stepTour(-1);};
  $('tourGroup').onchange=e=>{if(state==='tour')filterTour(e.target.value);};
  $('tourSelect').onchange=e=>{if(state==='tour')selectTourStop(+e.target.value);};
  $('tourHorn').onclick=()=>horn();
  function start(idx){if(state==='loading')return;unlock();hideDialog(false);state='loading';keys.clear();touch.clear();$('raceButton').disabled=true;home.hidden=true;viewHidden(false);$('hudMode').textContent='LOADING COURSE';$('hudName').textContent=cs[idx].name;countText('Loading');$('raceMessage').classList.remove('on');$('raceMessage').textContent='';
    requestAnimationFrame(()=>requestAnimationFrame(()=>{try{g=P.create(eventFor(idx),cfg.truck,{...cfg,fits:fits.map(v=>({...v}))});g.eventIndex=idx;motion=MTMMotion.track(g);g.viewTime=0;V.raceStart(g);frames=[];captureClock=0;nextFrame=0;result=null;replayDisplay=null;count=g.grid.remaining;fin=0;last=performance.now();acc=0;state='countdown';showGridCoach();A.effect('tick');renderHUD();V.render(g,0);countText('3');$('raceButton').disabled=false;
    // The only rig carrying a motor pool note also gets called out once, as the
    // Caddy rolls onto the grid. The launch message replaces it at the lights.
    if(roster[g.p.truck].motorPool)message(roster[g.p.truck].motorPool.grid,3.4);}catch(e){console.error(e);goHome();openDialog('error','RACE CONTROL','<h2 id="dialogTitle">Course could not load</h2><p>Close this panel to try another event or reopen the page.</p>');}}));}
  $('raceButton').onclick=()=>{series=null;start(cfg.event);};
  function pause(){centerHead();if(state==='finishing'){showResult();return;}if(!['playing','countdown'].includes(state))return;pauseFrom=state;state='paused';A.stop();keys.clear();touch.clear();pauseDialog();}
  function pauseDialog(){openDialog('pause',g.c.type.toUpperCase()+' / '+g.c.name.toUpperCase(),`<h2 id="dialogTitle">Race paused</h2><div class="result-meta"><div><small class="small-label">Elapsed</small><b>${time(g.time)}</b></div><div><small class="small-label">Position</small><b>${ord(g.rank)} of ${g.c.entrants}</b></div></div><div class="actions">${btn('resume','Resume race','primary','play')}${btn('restart','Restart')}${btn('pauseGuide','Controls')}${btn('leaveRace','Leave event')}</div>`);$('resume').onclick=resume;$('restart').onclick=()=>start(g.eventIndex);$('pauseGuide').onclick=showGuide;$('leaveRace').onclick=goHome;}
  function resume(){hideDialog(false);unlock();state=pauseFrom;last=performance.now();}
  $('pauseButton').onclick=()=>{if(state==='replay')showResult();else pause();};
  function camera(){if(g&&['playing','countdown','replay','finishing'].includes(state)){const m=V.cycle();document.body.classList.toggle('cockpit',V.mode===1);message(m+' camera',.95);}}
  // Shift on an input edge. Holding a key, a paddle or a touch button selects one gear.
  function shift(d){
    if(!g||!['countdown','playing','finishing'].includes(state)||g.settings.transmission!==1)return;
    const result=P.shiftGear(g,d);
    if(result.ok){A.effect('shift');renderHUD();}
    else if(result.message)message(result.message,1.05);
  }
  $('shiftDown').onclick=()=>shift(-1);$('shiftUp').onclick=()=>shift(1);
  function horn(){
    if(!g||!['playing','countdown','tour','finishing'].includes(state))return;
    const now=performance.now();if(now-(g.lastHonk??-Infinity)<360)return;
    g.lastHonk=now;A.effect('horn',g.p.truck);
    const clock=state==='tour'?g.tourTime:g.grid.released?3.1+g.time:g.grid.elapsed;
    const item=state==='tour'?g.tourStop:MTMMidway.near(g,clock);
    if(g.c.crowd){
      const source=state==='tour'?(item.kind==='float'?MTMCarnival.flight(item,clock):item):g.p;
      MTMCrowd.react(g,clock,source,1);
    }
    if(item?.reply&&MTMMidway.hornWave(g,item,clock)){
      const heat=g,when=state;
      setTimeout(()=>{
        if(g!==heat||!['playing','countdown','tour','finishing'].includes(state)||when==='tour'&&g.tourStop!==item)return;
        A.effect(item.sound);
        if(state==='tour')$('tourLine').textContent=item.reply;
        else message(item.name+' · '+item.reply,2.20);
      },item.sound==='quack'?365:170);
    }
    if(state==='tour')return;
    for(const sign of g.c.jokeSigns||[]){
      if(Math.hypot(sign.x-g.p.x,sign.z-g.p.z)>46)continue;
      if(sign.lines[1].includes('FORKLIFT'))message('Forklift verified',1.1);
      if(sign.lines[1].includes('UNSUBSCRIBE')){
        if(now-(g.lastSignHonk??-Infinity)<1900){message('Successfully unsubscribed',1.3);g.lastSignHonk=-Infinity;}
        else g.lastSignHonk=now;
      }
    }
  }
  $('hornButton').onclick=horn;
  function rescue(){if(state==='playing'){P.recover(g);motion.beforeStep();V.snap();}}
  $('finishResults').onclick=showResult;
  $('camButton').onclick=camera;$('recoverButton').onclick=rescue;
  // Capture on the race surface so mouse-up outside the canvas still recenters.
  // Chorded mouse buttons report pointermove, with the released bit cleared.
  const stage=$('stage');let looking=null,headX=0,headY=0,lastMouseX=0,lastMouseY=0;
  const lookAllowed=()=>!dialog&&['playing','countdown','finishing','replay'].includes(state);
  function centerHead(){
    if(looking===null)return;
    const pointer=looking;looking=null;headX=headY=0;V.headLook(0,0);
    document.body.classList.remove('head-look');
    if(stage.hasPointerCapture?.(pointer))stage.releasePointerCapture(pointer);
  }
  stage.addEventListener('contextmenu',e=>{if(lookAllowed())e.preventDefault();});
  stage.addEventListener('pointerdown',e=>{
    if(e.button!==2||!lookAllowed())return;
    e.preventDefault();looking=e.pointerId;lastMouseX=e.clientX;lastMouseY=e.clientY;
    stage.setPointerCapture?.(looking);document.body.classList.add('head-look');
  });
  window.addEventListener('pointermove',e=>{
    if(e.pointerId!==looking)return;
    if(!(e.buttons&2)||!lookAllowed()){centerHead();return;}
    headX=cap(headX-(e.clientX-lastMouseX)*.007,-Math.PI,Math.PI);
    headY=cap(headY-(e.clientY-lastMouseY)*.006,-1.12,1.26);lastMouseX=e.clientX;lastMouseY=e.clientY;
    V.headLook(headX,headY);
  });
  for(const type of ['pointerup','pointercancel','lostpointercapture'])window.addEventListener(type,e=>{if(e.pointerId===looking)centerHead();});
  window.addEventListener('mouseup',e=>{if(e.button===2)centerHead();});
  window.addEventListener('blur',centerHead);document.addEventListener('visibilitychange',centerHead);
  function keyDown(e){const code=e.code;
    if(state==='tour'){
      if(e.repeat)return;
      if(code==='Escape'){e.preventDefault();$('tourExit').click();}
      else if(code==='KeyB'){e.preventDefault();horn();}
      else if(e.target.tagName!=='SELECT'&&(code==='ArrowLeft'||code==='ArrowRight')){e.preventDefault();stepTour(code==='ArrowLeft'?-1:1);}
      return;
    }
    if(state==='finishing'&&code==='Enter'){showResult();return;}if(code==='Tab'&&dialog){const b=[...panel.querySelectorAll('button:not([hidden]),select')].filter(o=>!o.disabled);if(b.length&&e.shiftKey&&document.activeElement===b[0]){e.preventDefault();b[b.length-1].focus();}else if(b.length&&!e.shiftKey&&document.activeElement===b[b.length-1]){e.preventDefault();b[0].focus();}return;}
    if(code==='Escape'){e.preventDefault();if(e.repeat)return;if(dialog)close();else if(state==='replay')showResult();else pause();return;}
    if(dialog){if(dialog==='garage'&&!e.repeat&&e.target.tagName!=='SELECT'&&['ArrowLeft','ArrowRight'].includes(code)){e.preventDefault();changeTruck(code==='ArrowLeft'?-1:1);}return;}
    if(code==='KeyM'&&!e.repeat){setAudioMuted();return;}
    if(state==='home'){if(e.repeat)return;if(code==='Enter'&&(document.activeElement===document.body||document.activeElement.classList.contains('card')||document.activeElement===$('raceButton'))){e.preventDefault();series=null;start(cfg.event);}
      if(e.target.tagName!=='SELECT'&&(code==='ArrowLeft'||code==='ArrowRight')){e.preventDefault();select((cfg.event+(code==='ArrowLeft'?cs.length-1:1))%cs.length);}return;}
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyW','KeyA','KeyS','KeyD'].includes(code)){e.preventDefault();keys.add(code);}
    if(e.repeat)return;if(code==='KeyQ'||code==='KeyE'){e.preventDefault();shift(code==='KeyQ'?-1:1);}else if(code==='KeyB')horn();else if(code==='KeyC')camera();else if(code==='KeyR'||code==='KeyH')rescue();else if(code==='KeyP')pause();}
  window.addEventListener('keydown',keyDown);window.addEventListener('keyup',e=>keys.delete(e.code));
  document.querySelectorAll('[data-drive]').forEach(b=>{const id=b.dataset.drive;function release(){touch.delete(id);b.classList.remove('down');}b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);touch.add(id);b.classList.add('down');});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,release);});
  let audioBackground=false;
  function hidden(){audioBackground=true;keys.clear();touch.clear();document.querySelectorAll('.touch-controls .down').forEach(b=>b.classList.remove('down'));if(state==='tour'||state==='replay')A.stop();pause();}
  function foreground(){
    if(document.hidden)return;
    if(audioBackground&&(state==='tour'||state==='replay'))unlock();
    audioBackground=false;
  }
  window.addEventListener('focus',foreground);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)hidden();else{foreground();last=performance.now();acc=0;}});window.addEventListener('blur',hidden);window.addEventListener('mtm-context-lost',()=>{hidden();notify('Graphics context interrupted. Reopen the page to restore graphics.');});
  function getPad(){try{return Array.from(navigator.getGamepads?.()||[]).find(v=>v&&v.connected)||null;}catch(e){return null;}}
  function input(pad){const down=(...k)=>k.some(v=>keys.has(v)),b=(i)=>pad?.buttons[i]?.value||0,ax=pad?.axes[0]||0;
    return {throttle:Math.max(down('KeyW','ArrowUp')||touch.has('throttle')?1:0,b(7),b(0)),brake:Math.max(down('KeyS','ArrowDown')||touch.has('brake')?1:0,b(6),b(2)),steer:cap((down('KeyA','ArrowLeft')||touch.has('left')?1:0)-(down('KeyD','ArrowRight')||touch.has('right')?1:0)-(Math.abs(ax)>.12?(Math.abs(ax)-.12)/.88*Math.sign(ax):0)+b(14)-b(15),-1,1),handbrake:down('Space')||touch.has('handbrake')||b(1)>.4};}
  function padActions(pad){const btn=i=>(pad?.buttons[i]?.value||0)>.5,edge=i=>btn(i)&&!prevPad[i];if(pad){if(edge(9)){if(state==='paused'&&dialog==='pause')resume();else if(state==='home'&&!dialog){series=null;start(cfg.event);}else pause();}if(!dialog){if(edge(3))camera();if(edge(4))rescue();if(edge(10))horn();if(edge(12))shift(1);if(edge(13))shift(-1);}if(state==='home'&&!dialog&&(edge(14)||edge(15)))select((cfg.event+(edge(14)?cs.length-1:1))%cs.length);}prevPad={};for(const i of [3,4,9,10,12,13,14,15])prevPad[i]=btn(i);}
  for(const ev of ['gamepadconnected','gamepaddisconnected'])window.addEventListener(ev,()=>{$('padStatus').textContent=getPad()?'Gamepad connected':'Gamepad supported';});
  // The drone salute is audible whenever the fleet is airborne and close
  // enough; the mixer turns it down with distance and pans across the bowl.
  function droneSound(t,listener){
    if(cfg.muted||!g?.c)return;
    const v=MTMFinish.venue(g.c);
    const mix=MTMFinish.droneMix(v,t,listener);
    A.drones(mix.level,mix.pan);
  }
  function listenToFans(clock){
    if(!g?.c.crowd||audioBackground||cfg.muted)return;
    const mix=V.crowdMix(g,clock);A.crowd(mix.level,mix.pan,clock,mix.energy);
  }
  // Record passing reactions on the simulation clock. Rewinding the replay
  // can reproduce a thrown bottle even when the spectator is off-camera.
  function crowdPass(){
    if(!g.c.crowd||g.p.speed<8||g.time-(g.crowdCheck??-1)<.16)return;
    g.crowdCheck=g.time;const last=g.crowdPass;
    if(last&&(g.time-last.t<1.7||(g.p.x-last.x)**2+(g.p.z-last.z)**2<42**2))return;
    if(!g.c.crowd.sections.some(e=>(e.x-g.p.x)**2+(e.z-g.p.z)**2<56**2))return;
    MTMCrowd.react(g,3.1+g.time,g.p,Math.min(.86,.31+g.p.speed*.013));
    g.crowdPass={t:g.time,x:g.p.x,z:g.p.z};
  }
  function eventSounds(){for(const e of g.events.splice(0)){A.effect(e.type,e.material);if(e.type==='prop'&&e.impact>5){V.impact(Math.min(.50,e.impact*.022));}if(e.type==='checkpoint'){message('Checkpoint '+String(e.gate).padStart(2,'0')+' / '+String(g.c.gates.length).padStart(2,'0'));if(e.gate===g.c.gates.length-1)say('Bring it home!');}
    if(g.c.crowd&&(e.type==='finish'||e.type==='lap'||e.type==='crush'||e.type==='land'&&e.air>.5)){
      MTMCrowd.react(g,3.1+g.time,g.p,e.type==='land'?Math.min(1,.38+e.air*.45):1);
    }
    if((e.type==='lap'||e.type==='finish')&&g.c.carnival){
      for(const sign of [-1,1]){const q=g.c.at(g.c.length,sign*g.c.width*.55);MTMCarnival.salute(g,q.x,g.c.ground(q.x,q.z)+4.1,q.z,3.1+g.time,48);}
    }
    if(e.type==='lap'){message('Lap '+e.lap+' / '+g.c.laps);say(e.lap===g.c.laps?'Final lap!':'Another lap!');}if(e.type==='land'){V.impact(Math.min(1,e.air));if(e.air>.64)message('Air time  '+e.air.toFixed(1)+' s',1.1);}if(e.type==='hit')V.impact(.55);if(e.type==='crush'){V.impact(.65);message('Car crush',.75);}if(e.type==='recover'){message('Helicopter recovery',1);V.snap();}
  }}
  const poseKeys=['x','y','z','yaw','pitch','roll','wheel','steer','bPitch','bRoll','bounce','speed','truck','tires','suspension','grounded','rpm','gear','wheelspin','poseEpoch','surface','gate','lap','progress','rub','rubMaterial','rubX','rubZ'];
  function capture(){const snap={t:g.time,rank:g.rank,cars:g.cars.map(c=>c.crushed),world:MTMWorld.snapshot(g),vs:[g.p,...g.ai].map(v=>Object.fromEntries(poseKeys.map(k=>[k,v[k]])))};frames.push(snap);if(frames.length>451)frames.shift();}
  function finish(){state='finishing';fin=24;g.parade=true;g.paradeTime=0;A.effect('cheer');$('finishResults').hidden=false;countText('Finish!');const rows=P.standings(g),recordKey=g.c.recordKey,prev=records[recordKey],pb=!prev||g.p.finishTime<prev.time,lap=Math.min(...g.lapTimes);
    if(pb)records[recordKey]={time:g.p.finishTime,truck:cfg.truck,lap:Math.min(prev?.lap||Infinity,lap)};else if(!prev.lap||lap<prev.lap)prev.lap=lap;save();
    if(series&&g.c.id==='indiana'){const missing=series.field.filter(x=>!rows.some(r=>r.truck===x));rows.push(...P.otherHeat(g.c,missing,g.settings));rows.sort((a,b)=>a.time-b.time);}
    if(series)rows.forEach((r,i)=>{series.points[r.truck]+=[10,6,4,2][i];series.total[r.truck]+=r.time;});result={rows,pb,lap,position:rows.findIndex(r=>r.me)+1};say(result.position===1?'First place!':'That is the finish!');capture();}
  function scoreTable(rows){return `<table class="scoretable"><thead><tr><th>Pos</th><th>Truck</th><th>Time</th></tr></thead><tbody>${rows.map((r,i)=>`<tr class="${r.me?'me':''}"><td>${String(i+1).padStart(2,'0')}</td><td>${roster[r.truck].name}${r.me?' · You':''}${r.heat?' · Heat 2':''}</td><td>${time(r.time)}</td></tr>`).join('')}</tbody></table>`;}
  function showResult(){centerHead();if(!result)return;g.parade=false;$('finishResults').hidden=true;state='results';A.stop();countText('');if(replayCars){g.cars.forEach((c,i)=>c.crushed=replayCars[i]);replayCars=null;replayDisplay=null;V.render(g,0);}const finalRound=series?.round===2,order=series?[...series.field].sort((a,b)=>series.points[b]-series.points[a]||series.total[a]-series.total[b]):[],pool=roster[g.p.truck].motorPool;
    const title=finalRound?'Tournament complete':result.position===1?'First place!':'Race complete';openDialog('result',g.c.name.toUpperCase()+' / FINISH',`<h2 id="dialogTitle">${title}</h2><div class="result-meta"><div><small class="small-label">${finalRound?'Overall':'Position'}</small><b>${ord(finalRound?order.indexOf(cfg.truck)+1:result.position)}</b></div><div><small class="small-label">Your time</small><b>${time(g.p.finishTime)}</b></div>${g.c.loop?`<div><small class="small-label">Best lap</small><b>${time(result.lap)}</b></div>`:''}${result.pb?'<span class="record-flag">Personal best</span>':''}</div>${scoreTable(result.rows)}${pool?`<p class="pool-note">${pool.signoff}</p>`:''}${series?`<div class="series-standings"><h3>Series standings</h3><p>${order.map(n=>roster[n].name+' '+series.points[n]+' pts').join(' · ')}</p></div>`:''}<div class="actions">${btn('again',series?(finalRound?'Back to events':'Next event'):'Race again','primary','flag')}${btn('watch','Watch replay','secondary','play')}${!series?btn('toEvents','Events'):''}</div>`);
    $('again').onclick=()=>{if(series){if(finalRound)goHome();else start(series.events[++series.round]);}else start(g.eventIndex);};$('watch').onclick=watchReplay;if($('toEvents'))$('toEvents').onclick=goHome;}
  function watchReplay(){hideDialog(false);if(frames.length<2){showResult();return;}unlock();state='replay';replayT=frames[0].t;replayIndex=0;replayDisplay=g.props.map(p=>({...p}));replayCars=g.cars.map(c=>c.crushed);V.snap();message('Instant replay',1.25);last=performance.now();}
  function replay(dt){replayT+=dt;while(replayIndex+1<frames.length&&frames[replayIndex+1].t<=replayT)replayIndex++;if(replayT>frames[frames.length-1].t+.4){showResult();return;}const a=frames[replayIndex],b=frames[Math.min(replayIndex+1,frames.length-1)],f=cap((replayT-a.t)/Math.max(.001,b.t-a.t),0,1),vs=a.vs.map((p,i)=>{return MTMMotion.mix(p,b.vs[i],f,{...p});});g.cars.forEach((c,i)=>c.crushed=a.cars[i]);MTMWorld.replay(g,a.world.objects,b.world.objects,f,replayDisplay);V.render(g,dt,vs,true,replayDisplay,a.world.soil,replayT);listenToFans(3.1+replayT);renderHUD(vs[0],a.rank,replayT,vs);}
  let mapCourse=null,mapImage=null,mapProject=null;
  function trackMap(c,vs,gate){const ctx=mapCtx,W=320,H=215;if(mapCourse!==c){mapCourse=c;mapProject=mapper(c,W,H-16,19);mapImage=document.createElement('canvas');mapImage.width=W;mapImage.height=H;const ct=mapImage.getContext('2d');ct.translate(0,16);ct.strokeStyle='#76d5ed28';ct.lineWidth=1;for(let x=0;x<W;x+=24){ct.beginPath();ct.moveTo(x,0);ct.lineTo(x,H);ct.stroke();}for(let y=0;y<H;y+=24){ct.beginPath();ct.moveTo(0,y);ct.lineTo(W,y);ct.stroke();}ct.lineCap='round';ct.lineJoin='round';ct.beginPath();c.samples.forEach((q,i)=>{if(i%4&&i!==c.samples.length-1)return;const [x,y]=mapProject(q.x,q.z);i?ct.lineTo(x,y):ct.moveTo(x,y);});ct.strokeStyle='#071020';ct.lineWidth=9;ct.stroke();ct.strokeStyle='#9bbdd0';ct.lineWidth=4;ct.stroke();for(const q of c.gates){const [x,y]=mapProject(q.x,q.z);ct.fillStyle='#687d9c';ct.fillRect(x-2.4,y-2.4,4.8,4.8);}}
    ctx.clearRect(0,0,W,H);ctx.drawImage(mapImage,0,0);ctx.save();ctx.translate(0,16);if(gate){const [x,y]=mapProject(gate.x,gate.z);ctx.strokeStyle='#ff55a4';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.stroke();}for(let i=vs.length-1;i>=0;i--){const v=vs[i],[x,y]=mapProject(v.x,v.z);ctx.fillStyle=i?'#f3a3d3':'#68ffe1';ctx.strokeStyle='#081426';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,i?4.4:6.5,0,2*Math.PI);ctx.fill();ctx.stroke();}ctx.restore();}
  // The line is the surveyed racing surface. Position and grade follow the
  // player's route branch, including when the replay crosses the figure eight.
  let plottedCourse=null,profileRange,profileFloor;
  function gradeDisplay(c,p){
    if(plottedCourse!==c){
      const heights=c.samples.map(q=>q.y);
      profileFloor=Math.min(...heights);profileRange=Math.max(2,Math.max(...heights)-profileFloor);
      const line=c.samples.map((q,i)=>(i?'L':'M')+(2+196*q.s/c.length).toFixed(1)+' '+(29-26*(q.y-profileFloor)/profileRange).toFixed(1)).join(' ');
      $('reliefLine').setAttribute('d',line);plottedCourse=c;
    }
    const progress=p.near?.s??c.nearest(p.x,p.z,(p.progress??0)%c.length).s;
    const a=c.at(progress-6),b=c.at(progress+6);
    const grade=Math.round(100*(c.ground(b.x,b.z)-c.ground(a.x,a.z))/12);
    const alt=c.ground(p.x,p.z),delta=Math.round((alt-c.samples[0].y)*3.28084);
    $('reliefGrade').textContent=(grade>0?'+':'')+grade+'%';
    $('reliefHeight').textContent=(delta>0?'+':'')+delta+' ft';
    $('reliefDot').setAttribute('cx',2+196*progress/c.length);
    $('reliefDot').setAttribute('cy',cap(29-26*(alt-profileFloor)/profileRange,2,29));
  }
  function renderHUD(p=g.p,rank=g.rank,t=g.time,vs=[g.p,...g.ai]){const c=g.c,gate=c.gates[Math.min(p.gate,c.gates.length-1)],s=p.surface||'dirt',manual=g.settings.transmission===1;
    gradeDisplay(c,p);
    for(const id of ['shiftUp','shiftDown','shiftKeys','shiftHint'])$(id).hidden=!manual||state==='replay';
    $('shiftHint').textContent=p.shift<=0&&p.rpm>6050&&p.gear>0&&p.gear<5?'SHIFT ↑':'MAN';
    $('shiftHint').classList.toggle('redline',p.shift<=0&&p.rpm>6050&&p.gear>0&&p.gear<5);$('hudMode').textContent=state==='replay'?'INSTANT REPLAY':series?'TOURNAMENT · ROUND '+(series.round+1)+'/3':'2389 / '+c.type.toUpperCase()+' · '+roster[p.truck].name.toUpperCase();$('hudName').textContent=c.name;$('posHud').textContent=rank+' / '+c.entrants;$('lapLbl').textContent=c.loop?'LAP':'GATE';$('lapHud').textContent=c.loop?Math.min(c.laps,p.lap+1)+' / '+c.laps:Math.min(c.gates.length,p.gate+1)+' / '+c.gates.length;$('timeHud').textContent=time(t);$('mphHud').textContent=Math.round(p.speed*2.23694);$('gearHud').textContent=p.gear<0?'R':p.gear===0?'N':p.gear;$('rpmBar').style.width=cap(p.rpm/7000*100,8,100)+'%';$('surfaceHud').textContent=p.grounded?s.toUpperCase():'AIRBORNE';$('finderLabel').textContent=gate.finish?(c.loop&&p.lap+1<c.laps?'LAP LINE':'FINISH'):'GATE '+String(p.gate+1).padStart(2,'0');$('finderDist').textContent=Math.round(Math.hypot(gate.x-p.x,gate.z-p.z))+' m';const rel=P.wrap(Math.atan2(gate.x-p.x,gate.z-p.z)-p.yaw);$('needle').style.transform=`rotate(${-rel}rad)`;trackMap(c,vs,gate);document.body.classList.toggle('cockpit',V.mode===1);if(V.mode===1){hud.style.setProperty('--steer',(p.steer*-49)+'deg');hud.style.setProperty('--rev',(-108+220*cap(p.rpm/7200,0,1))+'deg');}}
  function showGridCoach(){
    const coach=$('startCoach'),grid=g.grid;coach.hidden=false;
    const c=grid.phase,tips={idle:'Hold throttle as 2 lights up',gear:'Select first gear for launch',early:'Ease off · try again on 2',ready:'Hold it through green',late:'Hold for green'};
    if(coach.dataset.phase!==c){coach.dataset.phase=c;$('startCue').textContent=tips[c];}
    $('startFill').style.transform='scaleX('+g.p.wheelspin.toFixed(3)+')';
  }
  let lastHUD=0;
  function loop(now){raf=requestAnimationFrame(loop);const raw=last?Math.max(0,(now-last)/1000):0,dt=Math.min(raw,.55);last=now;if(document.hidden)return;const pad=getPad();padActions(pad);if(dialog==='garage'){V.garageFrame(dt);return;}if(state==='tour'){g.tourTime+=dt;if(g.tourStop?.kind==='finish'){MTMFinish.soundCues(g.c,g.tourTime-dt,g.tourTime,null,cue=>A.effect('firework',cue));droneSound(g.tourTime,null);}V.tour(g,g.tourStop,g.tourTime);listenToFans(g.tourTime);return;}if(!g||['home','paused','loading','results'].includes(state))return;
    if(now>messageUntil)$('raceMessage').classList.remove('on');
    if(state==='replay'){replay(dt);return;}
    const inp=input(pad),step=MTMMotion.step;
    if(state==='countdown'||state==='playing'){
      // One clock drives staging and the race. A frame straddling the green
      // advances only its post-light ticks into elapsed race time.
      acc+=dt;
      while(acc+1e-10>=step&&!g.complete){
        motion.beforeStep();acc=Math.max(0,acc-step);
        if(state==='countdown'){
          const prev=Math.min(3,Math.ceil(count-1e-7));
          P.stage(g,inp,step);count=g.grid.remaining;
          const n=Math.min(3,Math.ceil(count-1e-7));
          if(n>0){countText(String(n));if(n<prev)A.effect('tick');}
          else{
            state='playing';const outcome=P.releaseGrid(g,inp);if(g.c.crowd)MTMCrowd.react(g,3.1,g.p,outcome==='perfect'?1:.72);
            $('startCoach').hidden=true;A.effect('go');countText('Go!');say('Go, go, go!');
            if(outcome){const perfect=outcome==='perfect';message(perfect?'Perfect launch':'Overrev · wheelspin',1.45);A.effect(perfect?'launchPerfect':'launchBog');}
            capture();
          }
        }else{
          P.drive(g,inp,step);crowdPass();captureClock+=step;
          if(captureClock+1e-9>=1/15){captureClock-=1/15;capture();}
        }
      }
      if(state==='countdown')showGridCoach();
      if(state==='playing'){eventSounds();if(g.complete)finish();else if(g.time>.75)countText('');}
    }
    if(state==='finishing'){
      const previousShow=g.paradeTime;fin-=dt;acc+=dt;
      while(acc>=step){motion.beforeStep();P.drive(g,inp,step);g.paradeTime+=step;acc-=step;}
      MTMFinish.soundCues(g.c,previousShow,g.paradeTime,g.p,cue=>A.effect('firework',cue));
      droneSound(g.paradeTime,g.p);
      g.events.length=0;
      if(fin<23&&fin>22)countText('');
      if(fin<23&&fin>22.8)message(g.c.loop?'Bear right into the victory bowl':'Victory bowl ahead · brake for the turnaround',3);
      if(fin<=0){showResult();return;}
    }
    const p=g.p;A.update({rpm:p.rpm,wheelspin:p.wheelspin,throttle:inp.throttle,speed:p.speed,slide:p.slide,rub:p.rub,rubMaterial:p.rubMaterial,airborne:!p.grounded,active:state==='playing'||state==='countdown'||state==='finishing'});
    g.viewTime=g.complete?g.time+(g.paradeTime||0):Math.max(0,g.time-step+acc);
    V.render(g,dt,motion.at(g.complete&&!g.parade?1:acc/step));
    listenToFans(g.grid.released?3.1+g.viewTime:g.grid.elapsed);
    if(now-lastHUD>45||state==='finishing'){renderHUD();lastHUD=now;}
    if(raw>(V.webgl ? .049 : .042)){if(++slowFrames>16){V.reduce();slowFrames=0;}}else slowFrames=Math.max(0,slowFrames-.33);
  }
  window.addEventListener('resize',()=>{V.resize();if(g&&state==='tour'){V.tour(g,g.tourStop,g.tourTime);showStarGuide();}else if(g&&['paused','results'].includes(state))V.render(g,0);});
  window.addEventListener('pagehide',()=>{A.stop();});requestAnimationFrame(loop);
})();
