/* Check staging, green-light timing and engine behavior in simulation time. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
global.THREE=require('../src/three.min.js');
for(const n of ['course','world','contact','physics','motion'])vm.runInThisContext(fs.readFileSync(__dirname+'/../src/'+n+'.js','utf8'),{filename:n});
const P=MTMPhysics,dt=1/60,gas={throttle:1,brake:0,steer:0,handbrake:false},off={...gas,throttle:0};
const make=(layout=MTMCourses[2],manual=0)=>P.create(layout,0,{difficulty:0,tires:0,suspension:1,gearing:1,transmission:manual});
const coords=g=>[g.p,...g.ai].map(r=>[r.x,r.y,r.z,r.progress,r.yaw]);
for(const c of [...MTMCourses,MTMCourses.forDistance(0,2)]){
 const g=make(c),trucks=[g.p,...g.ai],start=coords(g);
 let closest=Infinity;
 for(let i=0;i<trucks.length;i++)for(let j=0;j<i;j++)closest=Math.min(closest,Math.hypot(trucks[i].x-trucks[j].x,trucks[i].z-trucks[j].z));
 assert(closest>11,'grid spacing '+closest);assert.equal(c.gridInk.length,trucks.length*8);
 if(c.id==='indiana')assert.equal(g.p.progress,g.ai[0].s);
 for(let i=0;i<186;i++)P.stage(g,gas,dt);
 assert.deepEqual(coords(g),start);assert.equal(g.time,0);assert.equal(g.p.speed,0);
 assert(g.p.rpm>6450&&g.p.wheelspin>.98&&g.p.wheel>45);assert(g.ai.every(a=>a.wheel>2));
 console.log(c.layoutKey,'closest staged centers',closest.toFixed(1),'m');
}
function run(when,manual,gear=1){
 const g=make(MTMCourses[2],manual);if(manual)g.p.gear=gear;
 for(let i=0;i<186;i++)P.stage(g,g.grid.remaining<=when?gas:off,dt);
 const input=when?gas:off,wheel=g.p.wheel,outcome=P.releaseGrid(g,input);
 assert.equal(P.releaseGrid(g,input),outcome);
 const start=g.p.z;for(let i=0;i<60;i++)P.drive(g,gas,dt);
 return {outcome,wheel,speed:g.p.speed,distance:g.p.z-start,rpm:g.p.rpm};
}
for(const manual of [0,1]){
 const good=run(1.96,manual),late=run(.24,manual),early=run(3.11,manual),idle=run(0,manual);
 assert.equal(good.outcome,'perfect');assert.equal(early.outcome,'bog');assert.equal(late.outcome,'');assert.equal(idle.outcome,'');
 assert(good.speed>late.speed&&late.speed>early.speed);assert(good.distance>late.distance&&late.distance>early.distance);
 console.log(manual?'Manual':'Automatic','distance at 1s (perfect / normal / bogged)',[good,late,early].map(r=>r.distance.toFixed(2)).join(' / '),'m');
}
const neutral=run(1.93,1,0);assert(!neutral.wheel&&neutral.speed<.02&&neutral.rpm>6000&&!neutral.outcome);
const reverse=run(1.93,1,-1);assert(reverse.wheel<0&&reverse.distance<0&&!reverse.outcome);
const g=make();for(let i=0;i<186;i++){const t=g.grid.remaining;P.stage(g,t>2.8||t<=1.96?gas:off,dt);}
assert.equal(P.releaseGrid(g,gas),'perfect','a driver can lift and re-time the throttle');
const motion=MTMMotion.track(g);g.p.z+=2;
assert.equal(motion.at(.5)[0].z,g.p.z-1);motion.beforeStep();g.p.z+=60;g.p.poseEpoch++;
assert.equal(motion.at(.1)[0].z,g.p.z,'recoveries cut immediately');
