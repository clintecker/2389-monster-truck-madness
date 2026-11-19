/* Every route has a permanent salvage market and a flying parade. Only their
   poses and horn responses change during a heat. The same survey feeds all
   three renderers, the trackside visitor camera and instant replay. */
import { MTMCourses } from './course.js';
import { MTMFinish } from './finish.js';
import { MTMMidway } from './midway.js';
import { MTMOddities } from './oddities.js';
import { MTMParadeArt } from './parade-art.js';
import { MTMSalvageArt } from './salvage-art.js';

const MTMCarnival=(()=>{
  const T=THREE,art=MTMOddities.art,tau=Math.PI*2;
  const palettes={arizona:['#ff9863','#72f8d8','#f7cb64','#ff6ba4'],eight:['#b6a0ff','#82f5cc','#ef88ca','#ffd896'],indiana:['#ff659c','#8cecf1','#ffd572','#baa1ff']};
  const districts={
    arizona:[
      [.11,'Ivan','Municipal Sand Reserve','Sand is issued by weight. Please return the weight.'],
      [.36,'Harper','The Breakfast Interchange','Exit through the breakfast gift shop. Exit the gift shop through breakfast.'],
      [.71,'Soon','Tomorrow’s Flea Market','Yesterday’s bargains arrive Thursday. Bring yesterday.'],
      [.95,'Ivan','Lost Property Crater','The crater itself was handed in last week.']
    ],
    eight:[
      [.08,'Dylan','Last Known Goodwill','Every donation successfully restored from backup.'],
      [.36,'Sugi','Noodle Right of Way','The broth has obtained a permanent easement.'],
      [.65,'Eryan','Spin Cycle Surplus','One human sock. Eight hundred and six matching dryers.'],
      [.89,'Night Shift','After-Hours Reuse Annex','The out-of-office replies have formed a tenant union.']
    ],
    indiana:[
      [.13,'Clint','The Parts Department','No two parts agree on what they came off.'],
      [.39,'Mint','Change Machine Alley','The change machines have changed their minds.'],
      [.62,'Sophie','The Near Mint Condition','All photographic evidence is a little blurry.'],
      [.90,'Eden','Unclaimed Prize Pound','Prizes may be claimed by the prizes themselves.']
    ]
  };
  function rng(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
  const modelCache=new Map();
  function template(kit,variation){
    const key=kit.id+'/'+variation;
    if(!modelCache.has(key)){
      const root=new T.Group(),b=art.builder(root);kit.build(b,variation/3);b.finish();modelCache.set(key,root.children);
    }
    return modelCache.get(key);
  }
  // Local buckets keep the survey linear in track length. Large rectangular
  // stands retain their real footprints, including their open track-side apron.
  function occupancy(){
    const buckets=new Map(),cell=20;
    function visit(x,z,rx,rz,fn){
      for(let i=Math.floor((x-rx)/cell);i<=Math.floor((x+rx)/cell);i++)
        for(let j=Math.floor((z-rz)/cell);j<=Math.floor((z+rz)/cell);j++)
          if(fn(i*65536+j))return true;
      return false;
    }
    function add(p){
      visit(p.x,p.z,p.r||p.hx||0,p.r||p.hz||0,key=>{
        let list=buckets.get(key);if(!list)buckets.set(key,list=[]);list.push(p);
      });
    }
    function blocked(x,z,r){
      return visit(x,z,r,r,key=>(buckets.get(key)||[]).some(p=>{
        if(p.r)return (x-p.x)**2+(z-p.z)**2<(r+p.r)**2;
        return Math.hypot(Math.max(0,Math.abs(x-p.x)-(p.hx||0)),Math.max(0,Math.abs(z-p.z)-(p.hz||0)))<r;
      }));
    }
    return {add,blocked};
  }
  function blocksReading(x,y,z,r,h,window){
    if(x+r<window.minX||x-r>window.maxX||z+r<window.minZ||z-r>window.maxZ)return false;
    const {a,b,dx,dz,length}=window;
    const t=((x-a[0])*dx+(z-a[2])*dz)/length;
    if(t<.02||t>.99)return false;
    const rayY=a[1]+(b[1]-a[1])*t;
    return rayY>=y&&rayY<y+h+.16&&(a[0]+dx*t-x)**2+(a[2]+dz*t-z)**2<(r+.25)**2;
  }
  function sightline(a,b){
    const dx=b[0]-a[0],dz=b[2]-a[2];
    return {a,b,dx,dz,length:dx*dx+dz*dz||1,minX:Math.min(a[0],b[0]),maxX:Math.max(a[0],b[0]),minZ:Math.min(a[2],b[2]),maxZ:Math.max(a[2],b[2])};
  }
  function plan(c,data,entries,props){
    const seed={arizona:238928,eight:486838,indiana:177099}[c.id],random=rng(seed),room=occupancy();
    const pieces=[],strands=[],lots=[],fixed=[],air=[],venues=[],sightlines=[];
    const localKits=MTMSalvageArt.kits.filter(k=>k.regions.includes(c.id)),pal=palettes[c.id];
    for(const b of data.obstacles||[])room.add(b);
    for(const b of data.jokeSigns||[])room.add({x:b.x,z:b.z,r:b.width*.41});
    for(const b of props)room.add({x:b.baseX,z:b.baseZ,r:1.55});
    for(const e of entries){
      room.add({x:e.x,z:e.z,r:e.footprintRadius||e.radius||5});
      const at=c.at(e.s-40),h=e.kind==='sponsor'?2.75+e.height*.30:e.height*.29;
      sightlines.push(sightline([at.x,c.ground(at.x,at.z)+3.2,at.z],[e.x,e.y+h,e.z]));
    }
    for(const w of data.survey?.readingWindows||[]){
      for(const eye of w.eyes)for(const i of [0,w.targets.length-2])sightlines.push(sightline(eye,w.targets[i]));
    }
    const bypass=c.id==='eight'?Array.from({length:31},(_,i)=>c.at(c.length*(.688+.103*i/30),-14*Math.sin(Math.PI*i/30)**1.4)):[];
    const clear=(p,r,h)=>{
      if(MTMFinish.reserved(c,p.x,p.z,r))return false;
      if(room.blocked(p.x,p.z,r+.34)||c.nearest(p.x,p.z).distance<c.width*.51+r+1.05)return false;
      if(bypass.some(q=>(q.x-p.x)**2+(q.z-p.z)**2<(6.1+r)**2))return false;
      return !sightlines.some(w=>blocksReading(p.x,p.y,p.z,r,h,w));
    };
    const hop=c.id==='indiana'?16:c.id==='eight'?18:20;
    for(let index=0,station=2;station<c.length-2;index++,station+=hop){
      const primary=index%2?1:-1;
      for(const side of index%3===0?[primary,-primary]:[primary]){
        const members=[],total=5+Math.floor(random()*3);
        for(let j=0;j<total;j++){
          const kit=localKits[(Math.floor(random()*localKits.length)+index+j)%localKits.length];
          const variance=.76+random()*.39,variation=Math.floor(random()*4),r=kit.radius*variance;
          const s=Math.max(-4,Math.min(c.length-1,station+(j===0?0:(random()-.5)*hop*1.54)));
          const base=c.width*.5+(j===0?3.2:2.8+random()*13.5)+r,twist=(random()-.5)*.68;
          const from=c.at(s-28);
          // Try the front of a market before pushing a cabinet behind the fence.
          for(const extra of [0,3.8,8.8,14,21,31,42]){
            const q=c.at(s,side*(base+extra));q.y=c.ground(q.x,q.z);
            if(!clear(q,r,kit.height*variance))continue;
            const item={kit,variation,scale:variance,x:q.x,y:q.y,z:q.z,s,yaw:Math.atan2(from.x-q.x,from.z-q.z)+twist,r,
              height:kit.height*variance,width:kit.width*variance};
            pieces.push(item);members.push(item);room.add({x:q.x,z:q.z,r});
            // A short ground footprint makes the cabinets solid without catching
            // tires on a roof or an aerial jutting over the apron.
            fixed.push({x:q.x,z:q.z,r:Math.min(r*.63,1.45),material:'metal'});break;
          }
        }
        if(!members.length)continue;
        const focus=members.reduce((a,b)=>a.height>b.height?a:b);
        lots.push({s:focus.s,x:focus.x,y:focus.y,z:focus.z,yaw:focus.yaw,members});
        if(index%3===0){
          const h=3.9+random()*1.4;
          // Bleacher aisles and barriers occupy the first shoulder on the
          // drag strip. Fasten the bunting in a free aisle or the next row.
          for(const offset of [4.1+(index%2)*2,2.4,8.6,14.7,22.5,31,42]){
            const lane=side*(c.width*.5+offset);
            const ends=[station-4.2,station+4.2].map(s=>{const q=c.at(s,lane);return {x:q.x,y:c.ground(q.x,q.z),z:q.z};});
            if(!ends.every(p=>clear(p,.29,h)))continue;
            strands.push({ends,h,color:index%4});for(const p of ends){room.add({...p,r:.24});fixed.push({...p,r:.12,material:'wood'});}break;
          }
        }
      }
    }
    // Name real stalls, so Trackside always looks at a physical cluster.
    function addVenue(f,crew,name,caption){
      let best=null,low=Infinity;
      for(const lot of lots){
        const score=Math.abs(lot.s-c.length*f)+(7-lot.members.length)*2.2;
        if(!lot.named&&score<low){low=score;best=lot;}
      }
      if(!best)return;best.named=true;
      const interest=best.members.reduce((a,b)=>b.width+b.height>a.width+a.height?b:a);
      venues.push({id:'yard-'+c.id+'-'+venues.length,kind:'yard',crew,name,caption,ink:pal[venues.length%4],s:interest.s,
        x:interest.x,y:interest.y,z:interest.z,yaw:interest.yaw,focusPiece:interest,width:Math.max(8,interest.width*2.15),height:Math.max(4,interest.height*1.65)});
    }
    for(const [frac,crew,name,copy] of districts[c.id]){
      let f=frac;
      if(c.layoutKey==='arizona-circuit'){const q=MTMCourses[0].at(MTMCourses[0].length*frac);f=c.nearest(q.x,q.z).s/c.length;}
      addVenue(f,crew,name,copy);
    }
    if(c.layoutKey==='arizona-circuit'){
      addVenue(.67,'Soon','Western Receipts Exchange','Please keep the receipt for your receipt.');
      addVenue(.89,'Harper','The Lunar Reclaim Yard','The moon is still under warranty. The crate is sold as seen.');
    }
    const fleet=MTMParadeArt.filter(e=>e.region===c.id),copies=c.layoutKey==='arizona-circuit'?2:1;
    for(let lap=0;lap<copies;lap++)fleet.forEach((model,i)=>{
      const first=Math.min(.23,Math.max(.07,100/c.length));
      let s=c.length*[first,.47,.78][i%3];
      if(copies===2&&lap===0){
        const rally=MTMCourses[0],q=rally.at([.079,.47,.78][i%3]*rally.length);s=c.nearest(q.x,q.z).s;
      }else if(lap===1)s=c.length*[.59,.76,.93][i%3];
      const side=(i+lap)%2?-1:1,off=side*(c.width*.5+14),q=c.at(s,off),at=c.at(s-58);
      const altitude=(c.id==='indiana'?14:17)+(i%3)*3;
      air.push({...model,kind:'float',id:model.id+'-'+lap,x:q.x,y:c.ground(q.x,q.z)+altitude,z:q.z,
        s,dx:q.dx,dz:q.dz,yaw:Math.atan2(at.x-q.x,at.z-q.z),phase:i*2.38+lap*.93,period:40+i*9,
        crew:model.crew||'2389 Air Parade',reply:model.reply||['Flight control acknowledges the honk.','Permission to loiter granted.','Your flyover is double parked.'][i%3],sound:model.sound||['cheer','bleep','bell'][i%3]});
    });
    return {pieces,strands,venues,air,fixed,pal};
  }
  // An aircraft follows the same figure-eight in world space on every renderer.
  function flight(e,time,out={}){
    const a=e.phase+time*tau/e.period,along=12*Math.sin(a),side=6.3*Math.sin(2*a);
    out.x=e.x+e.dx*along+e.dz*side;out.z=e.z+e.dz*along-e.dx*side;
    out.y=e.y+1.12*Math.sin(a+.4);out.yaw=e.yaw+.19*Math.sin(a+.7);out.roll=.047*Math.sin(a*2+.2);
    return out;
  }
  const pennant=new T.BufferGeometry();
  pennant.setAttribute('position',new T.Float32BufferAttribute([-.5,0,0,.5,0,0,-.08,-1,.04],3));pennant.computeVertexNormals();
  function strandArt(b,line,pal,ox,oz){
    const [a,z]=line.ends,deltaY=z.y-a.y,dx=z.x-a.x,dz=z.z-a.z,yaw=-Math.atan2(dz,dx);
    function point(t){return [a.x+dx*t-ox,a.y+line.h+deltaY*t-.82*Math.sin(Math.PI*t),a.z+dz*t-oz];}
    for(const p of [a,z]){
      b.rod([p.x-ox,p.y,p.z-oz],[p.x-ox,p.y+line.h+.12,p.z-oz],.09,.055,'#546479',false,5);
    }
    let left=point(0);
    for(let j=1;j<=8;j++){
      const right=point(j/8),mid=point((j-.5)/8);b.rod(left,right,.035,.035,'#826f94',false,4);
      b.add(pennant,mid,[.69,.64,1],[0,yaw,.12*Math.sin(j*2)],pal[(line.color+j)%4],true);left=right;
    }
  }
  function attach(world,plan){
    const chunks=new Map(),cell=58,pose=new T.Object3D();
    function chunk(x,z){
      const cx=Math.floor(x/cell),cz=Math.floor(z/cell),key=cx*65536+cz;
      if(!chunks.has(key)){
        const ox=(cx+.5)*cell,oz=(cz+.5)*cell,root=art.node(world,ox,0,oz);
        root.name='Salvage market';chunks.set(key,{ox,oz,root,b:art.builder(root)});
      }
      return chunks.get(key);
    }
    for(const p of plan.pieces){
      const group=chunk(p.x,p.z);
      pose.position.set(p.x-group.ox,p.y,p.z-group.oz);pose.rotation.set(0,p.yaw,0);pose.scale.setScalar(p.scale);pose.updateMatrix();
      for(const mesh of template(p.kit,p.variation))group.b.instance(mesh,pose.matrix);
    }
    for(const line of plan.strands){
      const q=line.ends[0],group=chunk(q.x,q.z);strandArt(group.b,line,plan.pal,group.ox,group.oz);
    }
    const staticGroups=[...chunks.values()];
    for(const group of staticGroups){
      group.b.finish();delete group.b;
      group.root.traverse(o=>{o.updateMatrix();o.matrixAutoUpdate=false;});
    }
    const rigs=plan.air.map(e=>{
      const root=art.node(world);root.name=e.name;return {e,root,animate:e.build(root,art),point:{}};
    });
    const confetti=new T.InstancedMesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({color:0xffffff,side:T.DoubleSide,toneMapped:false}),160);
    confetti.name='Ticket confetti';confetti.instanceMatrix.setUsage(T.DynamicDrawUsage);confetti.frustumCulled=false;confetti.count=0;
    const dye=new T.Color();for(let i=0;i<160;i++)confetti.setColorAt(i,dye.set(plan.pal[i%4]));world.add(confetti);
    function update(g,clock,observer,reduced){
      const t=reduced?0:clock;
      for(const group of staticGroups){const dx=group.ox-observer.x,dz=group.oz-observer.z;group.root.visible=dx*dx+dz*dz<205*205;}
      for(const r of rigs){
        const p=flight(r.e,t,r.point);r.root.visible=(p.x-observer.x)**2+(p.z-observer.z)**2<465**2;
        if(!r.root.visible)continue;
        r.root.position.set(p.x,p.y,p.z);r.root.rotation.set(0,p.yaw,p.roll,'YXZ');
        r.animate?.(t,reduced?0:MTMMidway.response(g,r.e,clock));
      }
      let n=0;
      if(!reduced)particles(g,clock,observer,(x,y,z,size,spin)=>{
        if(n>=160)return;
        pose.position.set(x,y,z);pose.rotation.set(spin*.9,spin*.32,spin);pose.scale.set(size,size*.48,1);pose.updateMatrix();confetti.setMatrixAt(n++,pose.matrix);
      });
      confetti.count=n;confetti.visible=n>0;if(n)confetti.instanceMatrix.needsUpdate=true;
    }
    return {update};
  }
  // Paper tickets arc from a real attraction when it answers the horn. Burst
  // origins/times are retained long enough for the complete instant replay.
  function salute(g,x,y,z,clock,count=34){
    const live=(g.carnivalBursts||[]).filter(b=>clock-b.t<35);
    live.push({x,y,z,t:clock,count,seed:Math.abs(x*.23+z*.47+clock*1.7)%tau});g.carnivalBursts=live;
  }
  function particles(g,time,eye,draw){
    for(const b of g.carnivalBursts||[]){
      const age=time-b.t;if(age<0||age>2.9||(b.x-eye.x)**2+(b.z-eye.z)**2>165**2)continue;
      for(let i=0;i<b.count;i++){
        const phase=i*2.39996+b.seed,v=2.4+((i*37)%19)*.24,up=5+((i*29)%17)*.36;
        const y=b.y+age*(up-4.55*age);if(y<b.y-.8)continue;
        const wind=age*(.26+.12*Math.sin(phase));draw(b.x+Math.cos(phase)*v*age+wind,y,b.z+Math.sin(phase)*v*age,i%3===0?.50:.35,phase+age*(3+i%6),i);
      }
    }
  }
  return {plan,attach,flight,salute,particles};
})();

export {MTMCarnival};
