const assert=require('assert');require('../src/three.min.js');global.THREE=globalThis.THREE;require('./support/bundle.cjs').run(['kit','course','world','contact','physics']);
const manual=process.argv.includes('--manual');const set={difficulty:0,tires:0,suspension:1,gearing:1,transmission:manual?1:0};
const endurance=process.argv.includes('--endurance');
const layouts=endurance?[MTMCourses.forDistance(0,12),MTMCourses.forDistance(1,12)]:MTMCourses;
for(const c of layouts){const g=MTMPhysics.create(c,0,set);let maxAir=0,events={};for(let i=0;i<60*(endurance?2300:480)&&!g.complete;i++){
  const p=g.p,gate=c.gates[p.gate];let along=p.near.s;if(c.loop&&p.gate===0&&along>c.length*.85)along-=c.length;
  const target=c.at(along+Math.min(13,5+p.speed*.36),c.id==='indiana'?5:-.7);let e=MTMPhysics.wrap(Math.atan2(target.x-p.x,target.z-p.z)-p.yaw);
  const a=c.at(along+6),b=c.at(along+26),k=Math.abs(MTMPhysics.wrap(Math.atan2(a.dx,a.dz)-Math.atan2(b.dx,b.dz)))/20;const vmx=Math.min(endurance?25:manual&&c.id==='arizona'?27:34,Math.sqrt(11/Math.max(.001,k)));if(manual){if(p.rpm>6010&&p.gear<5)MTMPhysics.shiftGear(g,1);else if(p.rpm<3080&&p.gear>1)MTMPhysics.shiftGear(g,-1);}
 MTMPhysics.drive(g,{steer:Math.max(-1,Math.min(1,e*2.6)),throttle:p.speed<vmx?1:0,brake:p.speed>vmx+1?1:0,handbrake:false},1/60);maxAir=Math.max(maxAir,p.y-p.groundY);for(const ev of g.events.splice(0))events[ev.type]=(events[ev.type]||0)+1;
  if(!Number.isFinite(p.x+p.y+p.rpm))throw new Error('Non-finite physics');}
 console.log(c.id,'length',c.length.toFixed(0),'completed',g.complete,'time',g.time.toFixed(2),'rank',g.rank,'max air metres',maxAir.toFixed(2),'events',JSON.stringify(events),'gate',g.p.gate,'AI',g.ai.map(a=>a.finishTime?.toFixed(2)));assert(g.complete);assert(events.checkpoint===(c.gates.length-1)*c.laps);assert(maxAir>.15);assert.equal(events.lap||0,c.laps-1);assert.strictEqual(g.p.lap,c.laps);assert(MTMPhysics.standings(g).every(r=>r.time>0));}
