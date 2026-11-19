/* Fixed-step four-wheel arcade handling. Ground contact and race timing remain
   independent of rendering, camera choice, frame rate, and input device. */
import { MTMContact } from './contact.js';
import { MTMKit } from './kit.js';
import { MTMWorld } from './world.js';

const MTMPhysics = (() => {
  const {clamp, mix: lerp} = MTMKit;
  const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
  function contact(c,x,z,yaw){
    const sn=Math.sin(yaw),cs=Math.cos(yaw),fz=cs*1.65,fx=sn*1.65,sx=cs*1.33,sz=-sn*1.33;
    const fl=c.ground(x+fx+sx,z+fz+sz),fr=c.ground(x+fx-sx,z+fz-sz),bl=c.ground(x-fx+sx,z-fz+sz),br=c.ground(x-fx-sx,z-fz-sz);
    return {y:(fl+fr+bl+br)*.25+.15,pitch:-Math.atan2((fl+fr-bl-br)*.5,3.3),roll:Math.atan2((fl+bl-fr-br)*.5,2.66)};
  }
  // Five sequential forward gears share the final-drive setting. Neutral spins
  // freely, reverse uses the gas pedal, and a rolling downshift has an RPM guard.
  const redSpeeds=[0,9.8,17.8,26.3,34.4,42.2];
  const topFor=s=>[30.4,33.6,37.1][s.gearing];
  const redSpeed=(gear,top)=>gear===-1?8.5:((redSpeeds[gear]||9.8)*top/33.6);
  function shiftGear(g,direction){
    if(g.settings.transmission!==1||(g.complete&&!g.parade))return {ok:false};
    const p=g.p,next=clamp(p.gear+Math.sign(direction),-1,5);
    if(next===p.gear||p.shift>.015)return {ok:false};
    const roadSpeed=p.vx*Math.sin(p.yaw)+p.vz*Math.cos(p.yaw);
    if((next<0&&roadSpeed>1.4)||(next>0&&roadSpeed< -1.4))return {ok:false,message:'Slow down to change direction'};
    if(next>0&&roadSpeed/redSpeed(next,topFor(g.settings))>1.055)return {ok:false,message:'Downshift blocked · high RPM'};
    p.gear=next;p.shift=.17;return {ok:true,gear:next};
  }
  function manualPull(p,forward,top,torque,gas,brake){
    const rev=redSpeed(p.gear,top),direction=Math.sign(p.gear),load=Math.max(0,forward*direction)/rev;
    const band=[0,1.22,1.06,.94,.84,.76][Math.max(0,p.gear)];
    let drive=p.gear<0?7.2:torque*band*(.45+.55*clamp(load/.37,0,1));
    if(p.gear===1)drive=torque*1.13*(1-.27*clamp(load,0,1));
    // Taper torque into the governor so a held throttle reaches equilibrium
    // without alternating full torque and zero on consecutive physics ticks.
    drive*=clamp((1.012-load)/.057,0,1);
    if(!p.gear||p.shift>0)drive=0;
    // Above the limiter, engine braking lets excess downhill speed dissipate.
    const engineDrag=p.gear&&Math.abs(forward)>.4?Math.sign(forward)*((1-gas)*(.4+load*1.05)+Math.max(0,load-1)*35):0;
    return gas*direction*drive-engineDrag-Math.sign(forward)*18.5*brake;
  }
  function placement(course,s,lane,truck){const q=course.at(s,lane),yaw=Math.atan2(q.dx,q.dz),g=contact(course,q.x,q.z,yaw);
    return {x:q.x,z:q.z,y:g.y,yaw,pitch:g.pitch,roll:g.roll,vx:0,vz:0,vy:0,grounded:true,groundY:g.y,groundV:0,speed:0,wheel:0,wheelspin:0,poseEpoch:0,steer:0,steerRate:0,bPitch:0,bRoll:0,bounce:0,bounceV:0,air:0,slide:0,rpm:850,gear:0,shift:0,reverseWait:0,hitCooldown:0,contactSpin:0,rub:0,rubThisStep:0,rubMaterial:'rubber',rubX:q.x,rubZ:q.z,truck,gate:0,lap:0,progress:s,safeS:0,near:course.nearest(q.x,q.z),surface:'dirt',finishTime:null};}
  function create(layout,truck,settings){
    const course=MTMWorld.terrain(layout);
    // Keep equal launch distances for the drag. The rally and circuit use a
    // staggered two-row grid with a full truck length clear fore and aft.
    const drag=course.id==='indiana',[driverSlot,...slots]=course.gridSlots;
    const player=placement(course,...driverSlot,truck),opps=[];
    for(let i=0;i<slots.length;i++){
      const [s,side]=slots[i],a=placement(course,s,side,(truck+i+1)%(settings.fits?.length||4));
      Object.assign(a,{s,lane:side,gridLane:side,gridS:s,baseLane:Math.sign(side)*(drag?5:3.1),laneV:0,brain:i,delay:(drag?.29:.24)+i*.13});
      opps.push(a);
    }
    const cars=[];if(drag)for(const r of course.ramps)for(const side of [-1,1])for(let j=0;j<3;j++){
      const p=course.at(r.s),d=r.drop+1.4+j*2.15,u=side*4.8;cars.push({x:p.x+p.dz*u+p.dx*d,z:p.z-p.dx*u+p.dz*d,crushed:false});}
    for(const v of [player,...opps]){
      const setup=v===player?settings:settings.fits?.[v.truck];
      v.tires=setup?.tires??0;v.suspension=setup?.suspension??1;
    }
    if(settings.transmission===1)player.gear=1;
    return {c:course,p:player,ai:opps,props:MTMWorld.props(course),settings,grid:{remaining:3.1,elapsed:0,pressed:false,engagedAt:null,boost:0,bog:0,outcome:'',phase:'idle'},time:0,events:[],cars,rank:course.entrants,lapStart:0,lapTimes:[],complete:false};
  }
  // The grid clutch holds the chassis. Tire angle, revs and smoke are real
  // simulation state, so opening the throttle before green is visible and audible.
  function stage(g,input,dt){
    const {p,grid}=g,gas=clamp(input.throttle,0,1),manual=g.settings.transmission===1;
    if(!grid.pressed&&gas>=.42){grid.pressed=true;grid.engagedAt=grid.remaining;}
    if(grid.pressed&&gas<=.18){grid.pressed=false;grid.engagedAt=null;}
    const coupled=manual?Math.sign(p.gear):1;
    if(!manual)p.gear=gas>.16?1:0;
    p.shift=Math.max(0,p.shift-dt);
    p.steer=lerp(p.steer,clamp(input.steer,-1,1),1-Math.exp(-5.8*dt));
    p.rpm=lerp(p.rpm,875+gas*5675,1-Math.exp(-(gas>.18?4.2:6)*dt));
    p.wheelspin=lerp(p.wheelspin,coupled?gas:0,1-Math.exp(-4.1*dt));
    p.wheel+=coupled*(2+p.wheelspin*17)*p.wheelspin*dt;
    // Rivals blip their throttles at different times. Grid coordinates and the
    // race clock stay fixed until the starting signal.
    for(const a of g.ai){
      const warm=grid.elapsed-.73-a.brain*.19;
      const throttle=warm>0?.37+.23*Math.sin(warm*4.7+a.brain*1.2):0;
      a.wheelspin=lerp(a.wheelspin,throttle,1-Math.exp(-3.6*dt));
      a.wheel+=a.wheelspin*(3+12*a.wheelspin)*dt;
    }
    grid.elapsed+=dt;grid.remaining=Math.max(0,grid.remaining-dt);
    const timing=grid.engagedAt;
    grid.phase=!coupled||manual&&p.gear!==1?'gear':!grid.pressed?'idle':timing>2.25?'early':timing>=1.42?'ready':'late';
  }
  function releaseGrid(g,input){
    const {grid,p}=g;
    if(grid.released)return grid.outcome;
    grid.released=true;grid.remaining=0;
    if(input.throttle>=.42&&grid.pressed&&(g.settings.transmission!==1||p.gear===1)){
      if(grid.phase==='ready'){grid.boost=1.08;grid.outcome='perfect';}
      else if(grid.phase==='early'){grid.bog=.62;grid.outcome='bog';}
    }
    return grid.outcome;
  }
  // The same damper is used for a landing and the garage bounce test. Travel
  // stops absorb excess velocity instead of storing it for the next frame.
  const springs=[
    {rate:57,damping:7.2,down:-.23,up:.32},
    {rate:84,damping:10,down:-.19,up:.24},
    {rate:118,damping:13,down:-.13,up:.15}
  ];
  function stepSpring(state,setting,dt){
    const s=springs[setting]||springs[1];
    state.bounceV+=(-s.rate*state.bounce-s.damping*state.bounceV)*dt;
    const next=state.bounce+state.bounceV*dt;
    state.bounce=clamp(next,s.down,s.up);
    if(state.bounce!==next)state.bounceV*=.22;
  }
  // Transverse grip, longitudinal traction and rolling resistance per tire.
  // Tables use all-terrain, deep tread, hardpack order, as in the garage.
  const tireForces={
    dirt:[[6.15,1,1],[5.72,.93,1.12],[6.85,1.07,.92]],
    mud:[[3.7,1,1],[4.85,1.22,.83],[2.73,.74,1.24]],
    sand:[[4.6,1,1],[5.48,1.16,.86],[3.27,.83,1.17]],
    grass:[[4.4,1,1],[5.04,1.07,.92],[3.74,.86,1.13]],
    loose:[[4.8,1,1],[5.32,1.1,.91],[4.07,.88,1.11]]
  };
  function elevation(p,c,dt,rigidity,player,events){
    const g=contact(c,p.x,p.z,p.yaw),gv=(g.y-p.groundY)/dt;
    if(p.grounded){
      if(p.speed>7&&p.groundV-gv>1.25&&p.groundV>1.3){p.grounded=false;p.vy=p.groundV;p.air=0;}
      else{p.y=g.y;p.vy=gv;p.groundV=lerp(p.groundV,gv,clamp(dt*33,0,1));}
    }
    if(!p.grounded){
      p.air+=dt;p.vy-=14.5*dt;p.y+=p.vy*dt;
      if(p.y<=g.y&&p.vy<=gv){
        const impact=Math.max(0,gv-p.vy);p.y=g.y;p.grounded=true;p.groundV=gv;p.vy=gv;p.bounceV+=Math.min(3.2,impact*.24);
        if(player&&impact>3.3)events.push({type:'land',air:p.air});p.air=0;
      }
    }
    p.groundY=g.y;
    const targetPitch=p.grounded?g.pitch:clamp(p.pitch+dt*.06,-.39,.39),targetRoll=p.grounded?g.roll:p.roll*.995;
    p.pitch=lerp(p.pitch,targetPitch,clamp(dt*14,0,1));p.roll=lerp(p.roll,targetRoll,clamp(dt*12,0,1));
    stepSpring(p,rigidity,dt);
  }
  function aiStep(g,a,dt,animate=true){
    const {c,settings}=g;
    if(a.finishTime!==null){
      if(!animate)return;
      // Peel off the circuit and fan out into separate marked parking bays.
      const base=c.length*c.laps,old=a.s-base,bay=79-(a.brain%2)*1.8,left=Math.max(0,bay-old);
      if(left<.025){a.speed=a.vx=a.vz=0;return;}
      const target=Math.min(10,Math.sqrt(7*left));
      a.speed+=clamp(target-a.speed,-10*dt,3*dt);
      const travel=Math.min(left,a.speed*dt),v=old+travel,gate=c.gates.at(-1);
      const spread=clamp((v-40)/36,0,1),u=(c.loop?-32:0)*clamp((v-2)/49,0,1)+lerp(a.lane,(a.brain-1)*6.5,spread);
      const x=gate.x+gate.dz*u+gate.dx*v,z=gate.z-gate.dx*u+gate.dz*v;
      a.s+=travel;a.wheel+=travel/.86;a.vx=(x-a.x)/dt;a.vz=(z-a.z)/dt;
      a.yaw=Math.atan2(a.vx,a.vz);a.x=x;a.z=z;elevation(a,c,dt,a.suspension,false,g.events);return;
    }
    if(g.time<a.delay)return;
    const here=c.at(a.s),ahead=c.at(a.s+22),bend=Math.abs(wrap(Math.atan2(ahead.dx,ahead.dz)-Math.atan2(here.dx,here.dz)))/22;
    const level=[.94,1.04,1.14][settings.difficulty],vmax=(c.id==='indiana'?32.1:30.0-a.brain*.95)*level;
    const target=Math.min(vmax,Math.sqrt(14.5/Math.max(.004,bend))*level)*(1+.017*Math.sin(a.s*.025+a.brain*2.7));
    a.speed+=clamp(target-a.speed,-14*dt,(c.id==='indiana'?9.0:8.1)*level*(1-.45*Math.min(1,a.speed/vmax))*dt);
    const olds=a.s;a.s+=a.speed*dt;a.progress=a.s;
    if(a.s>=c.length*c.laps){a.finishTime=g.time-(a.s-c.length*c.laps)/Math.max(1,a.speed);a.s=c.length*c.laps;}
    if(!animate)return;
    const merge=clamp((a.s-a.gridS)/38,0,1),racingLane=a.baseLane+(c.id==='indiana'?0:Math.sin(a.s*.023+a.brain*2)*1.05);
    const smoothLane=lerp(a.gridLane,racingLane,merge*merge*(3-2*merge));
    a.laneV+=((smoothLane-a.lane)*3.3-a.laneV*3.8)*dt;a.lane=clamp(a.lane+a.laneV*dt,-c.width*.43,c.width*.43);
    const q=c.at(a.s,a.lane),nx=q.x,nz=q.z,dx=nx-a.x,dz=nz-a.z;
    if(dx*dx+dz*dz>.000001)a.yaw=Math.atan2(dx,dz);a.x=nx;a.z=nz;a.vx=dx/dt;a.vz=dz/dt;
    a.steer=clamp(wrap(Math.atan2(ahead.dx,ahead.dz)-Math.atan2(here.dx,here.dz)),-.4,.4);a.wheel+=(a.s-olds)/.86;
    elevation(a,c,dt,a.suspension,false,g.events);a.bRoll=lerp(a.bRoll,a.steer*a.speed*.004,dt*4);
  }
  function gateCheck(g,oldX,oldZ,dt){
    const {p,c}=g,a=c.gates[p.gate],old=(oldX-a.x)*a.dx+(oldZ-a.z)*a.dz,now=(p.x-a.x)*a.dx+(p.z-a.z)*a.dz;
    // Test the swept crossing exactly. Driving backward or merely coming close
    // never awards a checkpoint, and the gate sequence cannot be skipped.
    if(old>=0||now<0||now===old)return;
    const f=clamp(-old/(now-old),0,1),x=lerp(oldX,p.x,f),z=lerp(oldZ,p.z,f),side=(x-a.x)*a.dz-(z-a.z)*a.dx;
    if(Math.abs(side)>c.width*.58+1.25)return;
    const stamp=g.time-dt+f*dt;
    if(a.finish){
      p.lap++;g.lapTimes.push(stamp-g.lapStart);g.lapStart=stamp;p.safeS=0;
      if(p.lap>=c.laps){p.finishTime=stamp;p.progress=c.length*c.laps;g.complete=true;g.events.push({type:'finish'});return;}
      p.gate=0;g.events.push({type:'lap',lap:p.lap+1});
    }else{p.gate++;p.safeS=a.s;g.events.push({type:'checkpoint',gate:p.gate});}
  }
  function drive(g,input,dt){
    if(g.complete&&!g.parade)return;const {p,c,settings}=g;if(!g.parade)g.time+=dt;
    const oldX=p.x,oldZ=p.z,near=p.near,grounded=p.grounded;
    let sn=Math.sin(p.yaw),cs=Math.cos(p.yaw),forward=p.vx*sn+p.vz*cs,lateral=p.vx*cs-p.vz*sn;
    const abs=Math.abs(forward),throttle=clamp(input.throttle,0,1),brake=clamp(input.brake,0,1),hand=input.handbrake?1:0;
    p.surface=c.surfaceAt(p.x,p.z,near);const loose=p.surface!=='dirt';
    const manual=settings.transmission===1,top=topFor(settings),torque=[12.9,11.25,9.9][settings.gearing];
    let acceleration=0;
    if(manual)acceleration=manualPull(p,forward,top,torque,throttle,brake);
    else if(throttle){acceleration+=(forward<-.5?18:torque*Math.max(.14,1-.68*(Math.max(0,forward)/top)**1.18))*throttle;p.reverseWait=0;}
    if(!manual&&brake){if(forward>.4){acceleration-=18.5*brake;p.reverseWait=0;}else{p.reverseWait+=dt;if(p.reverseWait>.24||forward<-.35)acceleration-=6.2*brake;else if(Math.abs(forward)<.4)forward=0;}}
    if(g.grid.boost>0){acceleration+=7.8*throttle*(g.grid.boost/1.08);g.grid.boost=Math.max(0,g.grid.boost-dt);}
    if(g.grid.bog>0){acceleration*=1-.80*g.grid.bog/.62;g.grid.bog=Math.max(0,g.grid.bog-dt);}
    if(grounded){
      const [grip,traction,rolling]=(tireForces[p.surface]||tireForces.loose)[p.tires];
      acceleration*=traction;
      // A pit-speed governor sheds race speed during the runoff. Steering,
      // reverse and the service brake remain under the driver's control.
      if(g.parade&&forward>10)acceleration=Math.min(acceleration,-10.5);
      const drag=rolling*(.43+(loose?(p.surface==='mud'?.055:.018):.0025)*abs+.0015*abs*abs)*(forward===0?0:Math.sign(forward));
      const last=forward;forward+=(acceleration-drag+Math.sin(p.pitch)*5.6-(hand?Math.sign(forward)*7.9:0))*dt;
      if(((manual&&brake)||(!throttle&&(!brake||p.reverseWait<=.24)))&&last*forward<0)forward=0;
      if(acceleration>0&&forward>=top)forward=Math.min(forward,Math.max(top,last-.5*dt));forward=clamp(forward,-9,top*1.15);
      lateral*=Math.exp(-grip*(hand?.19:1)*dt);
    }else{forward*=Math.exp(-.018*dt);}
    const targetSteer=clamp(input.steer,-1,1);p.steer=lerp(p.steer,targetSteer,1-Math.exp(-dt*(targetSteer?5.8:8.4)));
    const rate=(1.39-.013*Math.min(abs,34))*(hand?1.49:1)*Math.min(1,abs/5.1)*Math.sign(forward);
    p.steerRate=lerp(p.steerRate,p.steer*rate,1-Math.exp(-dt*(grounded?6:1.1)));
    p.contactSpin*=Math.exp(-dt*4.2);p.yaw=wrap(p.yaw+(p.steerRate+p.contactSpin)*dt*(grounded?1:.17));
    // Apply part of the yaw to the velocity frame. At speed this leaves lateral
    // momentum to scrub off against the tires rather than snapping to heading.
    const follow=(grounded?(hand?.04:clamp(.47-abs*.008,.14,.47)):0),va=p.yaw-p.steerRate*dt*(grounded?1:.17)*(1-follow);
    sn=Math.sin(va);cs=Math.cos(va);p.vx=sn*forward+cs*lateral;p.vz=cs*forward-sn*lateral;
    p.x+=p.vx*dt;p.z+=p.vz*dt;p.speed=Math.hypot(p.vx,p.vz);
    p.wheelspin*=Math.exp(-dt*(g.grid.bog>0?2.4:4.3));
    p.wheel+=(forward/.86+(p.gear<0?-1:1)*p.wheelspin*15)*dt;
    for(const a of g.ai){a.wheelspin*=Math.exp(-5*dt);a.wheel+=a.wheelspin*8*dt;}
    p.slide=clamp((Math.abs(lateral)+hand*abs*.23)/8,0,1);p.hitCooldown=Math.max(0,p.hitCooldown-dt);
    for(const a of g.ai)aiStep(g.parade?{...g,time:g.time+g.paradeTime}:g,a,dt);
    p.rubThisStep=0;MTMContact.vehicles(g,dt);MTMWorld.stepProps(g,dt);
    p.speed=Math.hypot(p.vx,p.vz);
    for(const v of [p,...g.ai])MTMWorld.deform(g,v,dt);
    elevation(p,c,dt,settings.suspension,true,g.events);
    p.bPitch=lerp(p.bPitch,grounded?clamp(-acceleration*.0042,-.067,.075):0,dt*4.2);
    p.bRoll=lerp(p.bRoll,grounded?-p.steerRate*abs*[.0057,.0044,.0031][settings.suspension]:0,dt*4.5);
    p.shift=Math.max(0,p.shift-dt);
    if(manual){
      const rev=p.gear?Math.max(860+800*throttle,Math.abs(forward)*6800/redSpeed(p.gear,top)):850+throttle*5900;
      p.rpm=lerp(p.rpm,clamp(rev-(p.shift>0?370:0),810,6950),1-Math.exp(-dt*8));
    }else{
      const gear=forward<-.55?-1:abs<1.3?(throttle?1:0):1+[8.1,15.2,23.3,30.5].filter(v=>abs>v*(top/33.6)).length;
      if(gear!==p.gear){p.gear=gear;p.shift=.16;}
      const limits=[0,8.1,15.2,23.3,30.5,40].map(v=>v*top/33.6),ix=Math.max(1,gear);
      const rpm=gear>0?clamp(2450+3600*(abs-limits[ix-1])/(limits[ix]-limits[ix-1])+throttle*450,950,7100):gear<0?1700+abs*300:850+throttle*1700;
      p.rpm=lerp(p.rpm,rpm-(p.shift>0?820:0),1-Math.exp(-dt*7));
    }
    p.near=c.nearest(p.x,p.z,near.s);if(!g.parade)gateCheck(g,oldX,oldZ,dt);
    for(let i=0;i<g.cars.length;i++){
      const car=g.cars[i];if(car.crushed)continue;
      for(const v of [p,...g.ai])if(Math.abs(v.x-car.x)<2.9&&Math.abs(v.z-car.z)<2.15&&v.y<c.base(car.x,car.z)+1.4&&v.speed>1.6){car.crushed=true;if(v===p){p.bounceV+=.82;g.events.push({type:'crush'});}break;}
    }
    if(!g.complete){const prev=p.gate?c.gates[p.gate-1].s:0,next=c.gates[p.gate].s;let ns=p.near.s;
      if(c.loop&&p.gate===0&&ns>c.length*.85)ns-=c.length;
      if(!c.loop&&p.gate===0&&ns<1){const a=c.samples[0];ns=Math.min(ns,(p.x-a.x)*a.dx+(p.z-a.z)*a.dz);}
      if(ns>=prev-28&&ns<=next+5&&p.near.distance<c.width*.8)p.safeS=clamp(ns,prev,next-5);
      if(ns<prev-40||ns>next+40){const end=c.gates[p.gate],start=c.at(prev),segment=Math.max(1,Math.hypot(end.x-start.x,end.z-start.z));ns=prev+(next-prev)*clamp(1-Math.hypot(p.x-end.x,p.z-end.z)/segment,0,.98);}
      p.progress=p.lap*c.length+clamp(ns,prev-18,next-.01);
    }
    g.rank=1+g.ai.filter(a=>p.finishTime!==null?(a.finishTime!==null&&a.finishTime<p.finishTime):a.progress>p.progress+.05).length;
    const b=c.bounds;if(p.x<b.minX-130||p.x>b.maxX+130||p.z<b.minZ-130||p.z>b.maxZ+130)recover(g);
  }
  function recover(g){const p=g.p,c=g.c,prev=p.gate?c.gates[p.gate-1].s:0,next=c.gates[p.gate].s,s=clamp(p.safeS,prev,Math.max(prev,next-6)),q=c.at(s,c.id==='indiana'?5:0);p.x=q.x;p.z=q.z;p.yaw=Math.atan2(q.dx,q.dz);const ground=contact(c,q.x,q.z,p.yaw);Object.assign(p,{poseEpoch:p.poseEpoch+1,wheelspin:0,gear:g.settings.transmission===1?1:0,shift:0,rub:0,rubThisStep:0,contactSpin:0,y:ground.y+2.3,groundY:ground.y,groundV:0,pitch:ground.pitch,roll:ground.roll,vy:0,vx:0,vz:0,steer:0,steerRate:0,speed:0,grounded:false,air:0,near:c.nearest(q.x,q.z,s)});g.events.push({type:'recover'});}
  function standings(g){
    // Finish the remaining computer runs on their existing trajectories so the
    // results list contains comparable finish times even when the player wins.
    const sim={...g,ai:g.ai.map(a=>({...a}))};for(let steps=0;sim.ai.some(a=>a.finishTime===null)&&steps<12000;steps++){sim.time+=.05;for(const a of sim.ai)aiStep(sim,a,.05,false);}
    return [{truck:g.p.truck,time:g.p.finishTime,me:true},...sim.ai.map(a=>({truck:a.truck,time:a.finishTime,me:false}))].sort((a,b)=>a.time-b.time);
  }
  function otherHeat(c,trucks,settings){const sim={c,settings,time:0};const bots=trucks.map((t,i)=>({...placement(c,-.2,i?5:-5,t),s:-.2,brain:i,delay:.24+i*.09}));
    for(let i=0;bots.some(a=>a.finishTime===null)&&i<5000;i++){sim.time+=.05;for(const a of bots)aiStep(sim,a,.05,false);}return bots.map(a=>({truck:a.truck,time:a.finishTime,me:false,heat:2}));}
  return {create,drive,stage,releaseGrid,stepSpring,shiftGear,recover,standings,otherHeat,contact,wrap,clamp};
})();

export {MTMPhysics};
