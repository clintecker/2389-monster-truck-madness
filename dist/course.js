/* Distances in metres. Each event uses an arc-length path for signage, timing,
   AI and the printed route map. The player drives freely in world space. */
import { MTMKit } from './kit.js';

const MTMCourses = (() => {
  const specs = [
    {id:'arizona', name:'Blackout Mesa', classic:'Arizona Rally', type:'Rally', place:'Arizona desert', surface:'Sand & hardpack', width:21, laps:1, entrants:4, checkpoints:[.11,.24,.37,.49,.62,.75,.88,1],
      nodes:[[-165,-280],[-165,-188],[-128,-120],[-58,-96],[-10,-36],[-24,40],[-75,92],[-72,154],[-5,211],[92,220],[160,168],[175,80],[235,25],[301,56],[365,125],[364,211],[316,281],[334,360]]},
    {id:'eight', name:'Feedback Loop', classic:'A Crazy Eight', type:'Circuit', place:'Construction grounds', surface:'Dirt & grass', width:20, laps:5, entrants:4, checkpoints:[.16,.32,.48,.64,.80,1],
      nodes:[[-66,-133],[-70,-87],[-36,-32],[12,27],[77,85],[105,143],[75,184],[5,181],[-48,142],[-55,86],[-12,31],[39,-27],[106,-88],[109,-146],[64,-184],[-8,-181]]},
    {id:'indiana', name:'Overclock Strip', classic:'Indiana Fairgrounds', type:'Drag', place:'Indiana State Fairgrounds', surface:'Packed stadium dirt', width:23, laps:1, entrants:2, checkpoints:[.50,1],
      nodes:[[0,-210],[0,-105],[0,0],[0,100],[0,192.336]]}
  ];
  // Night Shift championship roads use their own timing records, profiles and
  // surveyed jump sites. The biome id selects reusable local scenery and soil.
  specs.push(
    {id:'arizona',layoutKey:'packet-pass',name:'Packet Loss Pass',classic:'2389 Mountain Relay',type:'Hill circuit',
      place:'Transmitter ridge',surface:'Sand & hardpack',closed:true,width:24,laps:2,entrants:4,
      checkpoints:[.061,.127,.198,.258,.319,.383,.447,.514,.579,.651,.714,.785,.852,.928,1],
      nodes:[[-240,-272],[-237,-182],[-179,-112],[-122,-59],[-158,-8],[-250,34],[-282,101],[-227,154],[-150,110],[-93,141],[-102,234],[-51,297],[49,307],[99,248],[71,183],[112,136],[213,181],[292,150],[310,60],[263,9],[167,31],[101,-14],[121,-95],[222,-131],[257,-199],[199,-260],[100,-236],[63,-160],[-8,-146],[-41,-219],[-96,-293],[-193,-324]],
      relief:[[-189,114,160,154,52],[57,233,171,120,37],[205,58,153,155,-23],[-73,-158,160,121,19],[191,-205,135,133,36]],
      jumps:[[.11,22,12,2.7,'earth'],[.215,22,14,3,'earth'],[.37,22,11,3.2,'earth'],[.476,24,11,3.6,'earth'],[.573,24,10,3.2,'rail'],[.689,20,13,3,'earth'],[.842,20,9,2.8,'earth']]},
    {id:'eight',layoutKey:'dead-letter',name:'Dead Letter Switchyard',classic:'2389 Dispatch District',type:'Switchyard GP',
      place:'Postal sorting grounds',surface:'Dirt & grass',closed:true,width:24,laps:2,entrants:4,
      checkpoints:[.064,.136,.204,.271,.343,.412,.486,.551,.613,.683,.752,.829,.911,1],
      nodes:[[-244,-180],[-241,-89],[-234,89],[-190,175],[-108,187],[-58,134],[-92,71],[-160,36],[-153,-35],[-82,-69],[-15,-21],[21,75],[9,181],[56,238],[145,230],[207,171],[182,103],[105,84],[75,22],[128,-27],[210,0],[281,-44],[285,-139],[219,-184],[137,-136],[70,-175],[12,-245],[-82,-248],[-141,-181],[-198,-230]],
      relief:[[-162,85,150,160,27],[82,155,145,150,33],[225,-106,106,109,-15],[-68,-173,125,115,14]],
      jumps:[[.141,22,16,2.1,'earth'],[.269,22,14,2.5,'earth'],[.368,21,12,2.7,'earth'],[.49,19,13,2.35,'earth'],[.618,22,14,2.5,'earth'],[.735,20,6,3.8,'bridge'],[.84,22,15,2.7,'earth']]},
    {id:'arizona',layoutKey:'context-window',name:'Context Window 2389',classic:'2389 Long Context Rally',type:'Endurance',
      place:'Forgetful Basin',surface:'Hardpack & wash',closed:true,width:25,laps:1,entrants:4,
      checkpoints:[.047,.101,.154,.211,.268,.322,.375,.433,.498,.552,.607,.663,.722,.781,.837,.889,.945,1],
      nodes:[[-297,-253],[-298,-143],[-331,-62],[-338,61],[-284,127],[-193,121],[-151,187],[-208,241],[-177,322],[-77,346],[-8,275],[-36,180],[10,107],[102,127],[145,211],[242,266],[321,216],[314,133],[228,105],[198,36],[259,-16],[349,4],[393,-71],[367,-163],[269,-180],[194,-130],[127,-170],[136,-252],[76,-321],[-20,-325],[-67,-250],[-38,-158],[-95,-93],[-178,-107],[-193,-207],[-226,-292]],
      relief:[[-257,125,179,164,47],[-67,264,147,143,-18],[177,156,178,155,52],[310,-95,146,143,31],[42,-254,138,147,-19],[-121,-128,125,127,22]],
      jumps:[[.083,23,12,3.4,'earth'],[.198,24,12,3.3,'earth'],[.294,23,14,3.6,'earth'],[.382,23,12,3.1,'earth'],[.489,25,12,3.3,'rail'],[.579,21,12,2.9,'earth'],[.676,23,11,3.4,'earth'],[.773,20,12,2.6,'earth'],[.876,24,13,3.1,'earth']]}
  );
  specs.push(
    {id:'office',layoutKey:'fifth-floor',name:'The Fifth Floor',classic:'2389 Office GP',type:'Circuit',
      place:'The 2389 office, ten times over',surface:'Commercial carpet',closed:true,width:16,laps:2,entrants:4,gateHalf:16,
      checkpoints:[.24,.48,.72,1],
      nodes:[[-20,-76],[10,-72],[40,-46],[55,-58],[100,-62],
        [130,-78],[160,-25],[165,40],[135,105],[95,115],[10,104],
        [10,80],[-20,79],[-30,55],[-30,30],
        [-60,30],[-110,30],[-150,15],[-158,-30],[-130,-60],[-90,-58],
        [-72,-28],[-45,-45],[-30,-80]],
      relief:[],
      jumps:[[.15,14,9,2,'earth'],[.42,16,9,2.4,'earth'],[.8,14,8,2,'earth']]}
  );
  const {clamp} = MTMKit;
  const smooth=t=>t*t*(3-2*t);
  function make(spec) {
    const loop=spec.closed===true||spec.id==='eight';
    const curve=new THREE.CatmullRomCurve3(spec.nodes.map(([x,z])=>new THREE.Vector3(x,0,z)),loop,'centripetal');
    curve.arcLengthDivisions=2400; const length=curve.getLength(), n=Math.ceil(length/2.8), ds=length/n;
    const samples=[];
    for(let i=0;i<=n;i++) {
      const u=i/n,p=curve.getPointAt(u),t=curve.getTangentAt(u);
      samples.push({x:p.x,z:p.z,y:0,dx:t.x,dz:t.z,s:i*ds});
    }
    function at(s,offset=0) {
      let q=s;
      if(loop) q=((s%length)+length)%length;
      if(!loop&&(q<0||q>length)){
        const a=q<0?samples[0]:samples[n],d=q<0?q:q-length;
        return {x:a.x+a.dx*d+a.dz*offset,z:a.z+a.dz*d-a.dx*offset,dx:a.dx,dz:a.dz,s};
      }
      q=clamp(q,0,length);const f=q/ds,i=Math.min(n-1,Math.floor(f)),t=f-i,a=samples[i],b=samples[i+1];
      const dx=a.dx+(b.dx-a.dx)*t,dz=a.dz+(b.dz-a.dz)*t;
      return {x:a.x+(b.x-a.x)*t+dz*offset,z:a.z+(b.z-a.z)*t-dx*offset,dx,dz,s:q};
    }
    // Associate each segment with nearby grid cells. At the figure-eight crossing,
    // an optional expected distance breaks ties between equally close branches.
    const grid=new Map(),cell=32;
    const key=(a,b)=>a*65536+b;
    for(let i=0;i<n;i++){
      const a=samples[i],b=samples[i+1];
      for(let x=Math.floor((Math.min(a.x,b.x)-24)/cell);x<=Math.floor((Math.max(a.x,b.x)+24)/cell);x++){
        for(let z=Math.floor((Math.min(a.z,b.z)-24)/cell);z<=Math.floor((Math.max(a.z,b.z)+24)/cell);z++){
          const k=key(x,z);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(i);
        }
      }
    }
    function nearest(x,z,expected=NaN) {
      const mx=Math.floor(x/cell),mz=Math.floor(z/cell),candidates=grid.get(key(mx,mz));
      let best=Infinity,bestScore=Infinity,win=0,frac=0;
      const count=candidates?candidates.length:n;
      for(let j=0;j<count;j++){
        const i=candidates?candidates[j]:j,a=samples[i],b=samples[i+1],dx=b.x-a.x,dz=b.z-a.z;
        const t=clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz),0,1),ex=x-a.x-t*dx,ez=z-a.z-t*dz,d=ex*ex+ez*ez;
        let score=d;
        if(Number.isFinite(expected)){let delta=Math.abs((i+t)*ds-expected);if(loop)delta=Math.min(delta,Math.abs(length-delta));score+=Math.min(49,delta*.055);}
        if(score<bestScore){bestScore=score;best=d;win=i;frac=t;}
      }
      const s=(win+frac)*ds,p=at(s);return {...p,distance:Math.sqrt(best),side:(x-p.x)*p.dz-(z-p.z)*p.dx};
    }
    // Broad landforms live in world coordinates, so the figure-eight crossing,
    // the desert return road, and a truck exploring the shoulders agree on height.
    const landforms=spec.relief||(spec.id==='eight'?
      [[85,137,121,115,25.52],[-48,108,89,97,11.44],[88,-122,117,104,-14.08],[-9,-166,85,81,10.56]]:
      [[-89,-110,146,113,35],[-27,47,104,106,-13],[152,142,146,135,42],
       [292,56,103,109,-12],[344,221,110,143,31],[-235,54,140,186,48],
       [-239,-133,102,100,-13],[97,395,143,116,33]]);
    // The drag lanes share this profile. Both stage level, then crest the
    // grandstand hill, drop into the bowl, and climb the second car stack.
    const stripProfile=[[-190,0],[-108,9],[-35,-5],[37,6],[93,1],[149,10],[186,4]];
    function stripHeight(z){
      if(z<=stripProfile[0][0])return 0;
      for(let i=1;i<stripProfile.length;i++){
        const [end,h]=stripProfile[i];if(z>end)continue;
        const [start,prev]=stripProfile[i-1];return prev+(h-prev)*smooth((z-start)/(end-start));
      }
      return stripProfile[stripProfile.length-1][1];
    }
    function base(x,z){
      if(spec.id==='office')return 0;
      if(spec.id==='indiana')return stripHeight(z)*1.16;
      let h=spec.id==='eight'?2.8*Math.sin(z*.023)+1.8*Math.sin(x*.030+z*.011)+.55*Math.sin(x*.06-z*.02):
        4.2*Math.sin(z*.020+x*.008)+3.1*Math.sin(x*.022-z*.009)+1.05*Math.sin(x*.047+z*.026)+.43*Math.sin(z*.083-x*.027);
      for(const [cx,cz,rx,rz,rise] of landforms){
        const u=(x-cx)/rx,v=(z-cz)/rz,q=1-u*u-v*v;
        if(q>0)h+=rise*q*q*q*(spec.id==='arizona'?.86:1);
      }
      return h;
    }
    const defs=spec.jumps?.slice()||(spec.id==='indiana'?[[.28,17,6,2.65,'cars'],[.69,19,7,3.1,'cars']]:
      spec.id==='eight'?[[.125,17,12,1.3,'earth'],[.27,17,7,2.145,'earth'],[.445,23,15,2.08,'earth'],[.735,20,4,4.6,'bridge'],[.872,18,10,1.755,'earth']]:
      [[.102,16,10,2.3,'earth'],[.182,19,9,3,'earth'],[.358,24,14,4.2,'earth'],[.588,21,6,3.15,'rail'],[.724,19,11,3.4,'earth'],[.848,22,9,3.7,'earth']]);
    if(spec.closed)defs.push([.933,19,11,3.2,'earth']);
    const ramps=defs.map(([f,approach,drop,h,kind])=>({...at(f*length),approach,drop,h:spec.id==='eight'&&kind==='earth'?h*.91:h,kind,half:kind==='bridge'?5.4:spec.width*.49}));
    function ground(x,z){
      let height=base(x,z);
      for(const r of ramps){
        const ax=x-r.x,az=z-r.z;if(Math.abs(ax)>33||Math.abs(az)>33)continue;
        const side=Math.abs(ax*r.dz-az*r.dx),along=ax*r.dx+az*r.dz;
        if(side>r.half+2||along< -r.approach||along>r.drop)continue;
        const rise=along<0?(1+along/r.approach)**1.48:1-along/r.drop;
        height+=r.h*rise*(1-smooth(clamp((side-r.half)/2,0,1)));
      }
      return height;
    }
    samples.forEach(p=>{p.y=ground(p.x,p.z)});
    const gates=spec.checkpoints.map((f,i)=>({...at(f*length),s:f*length,index:i,finish:i===spec.checkpoints.length-1}));
    const bounds=samples.reduce((b,p)=>({minX:Math.min(b.minX,p.x),maxX:Math.max(b.maxX,p.x),minZ:Math.min(b.minZ,p.z),maxZ:Math.max(b.maxZ,p.z)}),{minX:Infinity,maxX:-Infinity,minZ:Infinity,maxZ:-Infinity});
    const surfaceAt=(x,z,near)=>{
      if(spec.id==='office')return 'dirt';
      if(spec.id==='eight'&&near.distance>spec.width*.54)return 'grass';
      if(spec.id==='arizona'&&near.distance>spec.width*.54)return 'sand';
      if(spec.id==='arizona'&&near.s>length*.421&&near.s<length*.448&&near.distance<spec.width*.7)return 'mud';
      return near.distance>spec.width*.62?'loose':'dirt';
    };
    // The paint and the spawning code use the same grid. A drag race stages
    // both front axles on one line. Rally trucks occupy two staggered rows.
    const lane=Math.min(6.7,spec.width*.295);
    const gridSlots=spec.id==='indiana'?[[-.2,lane],[-.2,-lane]]:
      spec.id==='office'?[[-21.5,lane],[-10,-lane],[1.5,lane],[13,-lane]]:
      [[-19.4,lane],[-2.8,-lane],[-5.3,lane],[-16.9,-lane]];
    const gridInk=[];
    for(const [s,side] of gridSlots){
      const q=at(s,side);
      function roadPoint(u,v){
        const x=q.x+u*q.dz+v*q.dx,z=q.z-u*q.dx+v*q.dz;
        return [x,ground(x,z)+.245,z];
      }
      for(const u of [-1,1])for(const v of [-1,1]){
        // Open brackets make the wheel position visible through tire smoke.
        for(const [x1,x2,z1,z2] of [[1.34,2.18,2.76,2.93],[2.00,2.18,1.88,2.76]])
          gridInk.push([[x1,z1],[x2,z1],[x2,z2],[x1,z2]].map(([x,z])=>roadPoint(u*x,v*z)));
      }
    }
    // Paired amber arrows mark the approach. Mint bars straddle the landing
    // apron; both follow the actual dirt height on the inside and outside lane.
    const rampInk=[];
    function trailPaint(station,off,outline,tint){
      const points=outline.map(([ds,du])=>{
        const p=at(station+ds,off+du);return [p.x,ground(p.x,p.z)+.27,p.z];
      });
      rampInk.push({points,tint,x:points[0][0],z:points[0][2]});
    }
    for(const r of ramps)for(const side of [-1,1]){
      const lane=side*Math.min(r.half-.8,spec.width*.36);
      for(const ahead of [18,10,2]){
        const atS=r.s-r.approach-ahead;
        for(const wing of [-1,1])
          trailPaint(atS,lane,[[0,0],[-1.55,wing*1.13],[-2.1,wing*1.13],[-.55,0]],'#ffbd57');
      }
      for(const pad of [3,8])
        trailPaint(r.s+r.drop+pad,lane,[[0,-1.3],[.48,-1.3],[.48,1.3],[0,1.3]],'#64efcf');
    }
    return {...spec,layoutKey:spec.layoutKey||spec.id,length,loop,samples,at,nearest,base,ground,gates,ramps,bounds,surfaceAt,gridSlots,gridInk,rampInk};
  }
  const events=specs.map(make),formats=new Map();
  const maxLaps=13;
  // The desert sprint keeps its original finish. Long races take a real return
  // road down the western side of the mesa and pass the starting gantry again.
  const returnRoad=[[309,411],[231,446],[138,408],[81,346],[0,310],[-97,272],
    [-177,205],[-208,125],[-242,45],[-274,-39],[-283,-137],[-255,-230],
    [-234,-293],[-204,-328],[-179,-324],[-166,-305]];
  let mesaCircuit=null;
  function recordKey(index,laps){
    // The previous release recorded the three-lap figure eight under "eight".
    const id=specs[index].layoutKey||specs[index].id;
    if(laps===13&&index<2)return id+'-long';
    if(index===2||(index===0&&laps===1)||(index===1&&laps===3))return id;
    return id+'-'+laps;
  }
  function forDistance(index,requested){
    const base=events[index];
    const n=index===2?1:Number.isInteger(requested)&&requested>=1&&requested<=(index<2?maxLaps:12)?requested:base.laps;
    const key=recordKey(index,n);
    if(formats.has(key))return formats.get(key);
    let layout=base;
    // The long-course selector lengthens the lap itself while preserving the timing
    // keys and geometry of every pre-existing sprint and 2–12 lap event.
    if(n===13&&(index===0||index===1)){
      const atMesa=index===0;
      const route=atMesa?[
        ...specs[0].nodes,[342,442],[266,482],[180,444],[126,395],[67,412],[10,474],
        [-74,477],[-126,416],[-103,349],[-169,296],[-244,314],[-319,256],[-310,183],
        [-226,142],[-207,75],[-267,21],[-350,39],[-397,-37],[-379,-109],[-302,-147],
        [-321,-224],[-269,-303],[-204,-328],[-179,-324],[-166,-305]
      ]:[
        ...specs[1].nodes.slice(0,6),[150,219],[124,284],[45,291],[-20,239],[-91,246],
        [-147,186],[-118,113],[-55,86],[-12,31],[39,-27],[106,-88],[167,-151],
        [223,-106],[291,-121],[304,-202],[246,-262],[151,-245],[119,-298],[46,-324],[-17,-283],[-8,-181]
      ];
      layout=make({...specs[index],nodes:route,closed:true,layoutKey:base.id+'-marathon',
        type:atMesa?'Long rally':'Long circuit',checkpoints:Array.from({length:atMesa?21:16},(_,i)=>(i+1)/(atMesa?21:16))});
    }else if(index===0&&n>1){
      if(!mesaCircuit)mesaCircuit=make({...specs[0],closed:true,layoutKey:'arizona-circuit',type:'Rallycross',
        nodes:[...specs[0].nodes,...returnRoad],checkpoints:[.059,.125,.198,.26,.33,.40,.467,.528,.596,.68,.773,.85,.927,1]});
      layout=mesaCircuit;
    }
    const event=Object.create(layout);
    event.laps=n===13?1:n;event.recordKey=key;formats.set(key,event);return event;
  }
  return Object.assign(events,{forDistance,recordKey,maxLaps});
})();

export {MTMCourses};
