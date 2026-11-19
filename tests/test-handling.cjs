/* Regression checks for the reported garage, wheel contact and transmission issues. */
const assert=require('node:assert/strict');
require('../src/three.min.js');global.THREE=globalThis.THREE;
require('./support/bundle.cjs').run(['kit','course','world','contact','physics']);
const P=MTMPhysics,make=(id=2,transmission=1)=>P.create(MTMCourses[id],0,{difficulty:0,tires:0,suspension:1,gearing:1,transmission});
const dt=1/60,gas={steer:0,throttle:1,brake:0,handbrake:false},off={...gas,throttle:0};
const advance=(g,seconds,input=gas)=>{for(let i=0;i<Math.round(seconds/dt);i++)P.drive(g,input,dt);};
let g=make();g.ai=[];g.props=[];
advance(g,3);const firstSpeed=g.p.speed;assert.equal(g.p.gear,1);assert(firstSpeed>8.8&&firstSpeed<10.2);assert(g.p.rpm>6050);
assert(P.shiftGear(g,1).ok);advance(g,3);assert.equal(g.p.gear,2);assert(g.p.speed>firstSpeed*1.55);
assert(!P.shiftGear(g,-1).ok);assert.equal(g.p.gear,2);
g=make();g.ai=[];g.props=[];assert(P.shiftGear(g,-1).ok);advance(g,2);assert.equal(g.p.gear,0);assert(g.p.speed<.1&&g.p.rpm>5800);
assert(P.shiftGear(g,-1).ok);advance(g,2);assert.equal(g.p.gear,-1);assert(g.p.vz<-4);
assert(P.shiftGear(g,1).ok);advance(g,.24,off);assert(!P.shiftGear(g,1).ok);
console.log('Manual first and second, rev limiter, downshift protection, neutral, reverse and moving direction interlock passed.');

g=make(2,0);g.ai=[];g.props=[];const v=g.p;
Object.assign(v,{x:.72,z:0,y:0,groundY:0,yaw:0,vx:2.5,vz:18,hitCooldown:0});
g.c.obstacles=[{x:3.4,z:0,hx:1.0,hz:50,material:'metal'}];
MTMContact.vehicles(g,dt);assert(v.x<.72&&v.vx<.4);assert(v.vz>16.8);assert(v.rubMaterial==='metal'&&v.rub>0);
const after=v.rub;v.x=-14;for(let i=0;i<40;i++){v.rubThisStep=0;MTMContact.vehicles(g,dt);}assert(v.rub<after*.001);
Object.assign(v,{x:0,z:0,yaw:0,vx:2,vz:19,rubThisStep:0});
const a=P.create(g.c.original,0,g.settings).ai[0];Object.assign(a,{x:3.5,z:.5,y:v.y,yaw:0,vx:0,vz:15,s:210,lane:3.5,speed:15,finishTime:null});g.ai=[a];g.c.obstacles=[];
MTMContact.vehicles(g,dt);assert(a.laneV>.5&&v.vx<1.5);assert(v.vz>18.3);assert(v.rubMaterial==='rubber');
console.log('Shallow metal contact retained longitudinal speed, released cleanly and exchanged momentum with a rival.');

g=make(0);g.ai=[];const patch=g.c.soil[1],yaw=Math.atan2(patch.dx,patch.dz);
const wx=patch.x+1.36*patch.dz,wz=patch.z-1.36*patch.dx,oldHeight=g.c.ground(wx,wz);
const before=MTMWorld.snapshot(g);
for(let pass=0;pass<3;pass++)for(let t=-10;t<10;t+=.22){
 Object.assign(g.p,{x:patch.x+t*patch.dx,z:patch.z+t*patch.dz,yaw,speed:16,grounded:true});MTMWorld.deform(g,g.p,dt);
}
assert(oldHeight-g.c.ground(wx,wz)>.19);assert(!before.soil[1].depth.some(x=>x));assert(MTMWorld.snapshot(g).soil[1].depth.some(x=>x));
assert(Math.abs(make(0).c.ground(wx,wz)-oldHeight)<1e-6);
for(const kind of ['barrels','tires','barricade','pylon','crt','cart','mailbox','sofa']){
 g=make(0);g.ai=[];const p=g.props.find(p=>p.kind===kind);g.props=[{...p,id:0}];const body=g.props[0],c=Math.cos(p.yaw),s=Math.sin(p.yaw);
 Object.assign(g.p,{x:p.x-2.29*s,z:p.z-2.29*c,y:p.y+.15,yaw:p.yaw,vx:16*s,vz:16*c,speed:16,grounded:true});
 const pre=MTMWorld.snapshot(g);for(let i=0;i<25;i++)MTMWorld.stepProps(g,dt);
 assert(body.damage>.48&&Math.hypot(body.x-p.baseX,body.z-p.baseZ)>1);assert(g.events.some(e=>e.type==='prop'&&e.kind===kind));
 const end=MTMWorld.snapshot(g),copy=g.props.map(p=>({...p}));MTMWorld.replay(g,pre.objects,end.objects,0,copy);assert.equal(copy[0].damage,0);
 MTMWorld.replay(g,pre.objects,end.objects,1,copy);assert.equal(copy[0].damage,body.damage);assert.equal(copy[0].yaw,body.yaw);
}
console.log('Persistent wheel ruts, eight prop impact responses, fresh starts and replay reconstruction passed.');
