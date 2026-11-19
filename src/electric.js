/* The old motor-court and theatre signs are still the original printed signs.
   Their strings of independent lamps follow the actual steel cutting patterns.
   All animation is sampled from the race clock, including instant replay. */
const MTMElectric=(()=>{
  const T=THREE,TAU=2*Math.PI;
  const wired=new Set(['marquee','motel','blade','ticket','dialbox','shop','terminal']);
  const rectangle=[[.012,.05],[.012,.95],[.988,.95],[.988,.05]];
  const levels=[1,.77,.43,.18,.08,.055,.045,.045];
  function bank(r,t){return Math.floor(t*r.rate+r.phase)%levels.length;}
  function rim(board,index){
    const raw=board.outline||rectangle,pts=raw.map(([u,v])=>[(u-.5)*board.width*.985,(v-.5)*board.height*.976]);
    const edges=pts.map(([x,y],i)=>{const b=pts[(i+1)%pts.length];return Math.hypot(b[0]-x,b[1]-y);});
    const length=edges.reduce((a,b)=>a+b,0),n=8*Math.max(3,Math.round(length/(8*.46))),bulbs=[];
    let edge=0,start=0;
    for(let i=0;i<n;i++){
      const s=(i+.35)*length/n;
      while(edge<edges.length-1&&s>=start+edges[edge])start+=edges[edge++];
      const a=pts[edge],b=pts[(edge+1)%pts.length],u=(s-start)/edges[edge];
      bulbs.push({x:a[0]+(b[0]-a[0])*u,y:a[1]+(b[1]-a[1])*u,slot:i%8});
    }
    const accent=board.style==='marquee'||board.style==='ticket'?'#ffc060':board.style==='motel'?'#ff6796':board.accent;
    return {bulbs,rate:5.25+(index%4)*.57,phase:index%8,hue:accent,
      color:new T.Color(accent),inverse:index%3===1?-1:1,radius:Math.min(.15,board.height*.046)};
  }
  function plan(course,boards,entries){
    const strings=[];
    boards.forEach((b,i)=>{
      if(!wired.has(b.style))return;
      b.electric=rim(b,i);strings.push(b);
    });
    const spills=entries.filter(e=>e.kind==='neon'||e.kind==='lcd'||e.kind==='holo').map((e,i)=>{
      // Light pools sit between the light source and the driving verge.
      // Shoulder spills follow the ground and end before the middle racing line.
      const road=course.at(e.s),dx=road.x-e.x,dz=road.z-e.z,length=Math.hypot(dx,dz)||1;
      const along=Math.max(1,Math.min(length-course.width*.41,e.height*.87));
      return {e,x:e.x+dx/length*along*.53,z:e.z+dz/length*along*.53,
        dx:dx/length,dz:dz/length,long:along*.76,wide:Math.max(3.2,e.width*.53),phase:i*.91};
    });
    return {strings,spills};
  }
  const paint=new Map();
  function lampMaterial(hue,level){
    const key=hue+level;let m=paint.get(key);
    if(!m){
      // Outer vertices of each bulb are transparent. A lit bulb has a white
      // hot core surrounded by its saturated glass color and a faint halo.
      m=new T.MeshBasicMaterial({color:new T.Color(hue).lerp(new T.Color('#fff4dd'),level*.37),
        vertexColors:true,toneMapped:false,side:T.DoubleSide,transparent:true,opacity:.12+.88*level,depthWrite:false});
      paint.set(key,m);
    }
    return m;
  }
  function fixture(board){
    const r=board.electric,root=new T.Group(),geometries=[];
    root.position.set(board.x,board.y,board.z);root.rotation.y=board.yaw;
    const hues=levels.map(level=>lampMaterial(r.hue,level));
    for(let slot=0;slot<8;slot++){
      const pos=[],col=[],idx=[];
      for(const b of r.bulbs){
        if(b.slot!==slot)continue;const first=pos.length/3;
        pos.push(b.x,b.y,.065);col.push(1,1,1,1);
        for(const [radius,alpha] of [[.60,1],[1,.87],[1.85,.16],[2.8,0]]){
          for(let k=0;k<8;k++){
            const a=k*TAU/8;pos.push(b.x+Math.cos(a)*r.radius*radius,b.y+Math.sin(a)*r.radius*radius,.063);
            col.push(radius<1?1:.86,radius<1?1:.78,radius<1?1:.68,alpha);
          }
        }
        for(let k=0;k<8;k++){const next=(k+1)%8;idx.push(first,first+1+k,first+1+next);
          for(let j=0;j<3;j++){const a=first+1+j*8;idx.push(a+k,a+8+k,a+next,a+next,a+8+k,a+8+next);}
        }
      }
      const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('color',new T.Float32BufferAttribute(col,4));geo.setIndex(idx);geo.computeBoundingSphere();
      const mesh=new T.Mesh(geo,hues[slot]);mesh.renderOrder=3;root.add(mesh);geometries.push(mesh);
    }
    return {root,geometries,hues,r,last:-1};
  }
  function surface(course,x,z){
    const d=course.nearest(x,z).distance,hw=course.width*.5;
    return d<hw?course.ground(x,z)+.18-.055*(d/hw)**2:course.base(x,z)-.18;
  }
  function puddle(s,course){
    const steps=24,rings=5,pos=[],col=[],idx=[];
    function vertex(u,v,alpha){
      const x=s.x+s.dx*u*s.long+s.dz*v*s.wide,z=s.z+s.dz*u*s.long-s.dx*v*s.wide;
      pos.push(x,surface(course,x,z)+.022,z);col.push(1,1,1,alpha);
    }
    vertex(0,0,.28);
    for(let j=1;j<=rings;j++)for(let k=0;k<steps;k++){
      const t=TAU*k/steps,r=j/rings,noise=.94+.045*Math.sin(3*t+s.phase)+.026*Math.sin(7*t);
      vertex(Math.cos(t)*r*noise,Math.sin(t)*r*noise,Math.max(0,.29*(1-r)**1.6*(.87+.13*Math.sin(t*9+j+s.phase))));
    }
    for(let k=0;k<steps;k++){const n=(k+1)%steps;idx.push(0,k+1,n+1);
      for(let j=1;j<rings;j++){const a=1+(j-1)*steps;idx.push(a+k,a+steps+k,a+n,a+n,a+steps+k,a+steps+n);}
    }
    const geom=new T.BufferGeometry();geom.setAttribute('position',new T.Float32BufferAttribute(pos,3));geom.setAttribute('color',new T.Float32BufferAttribute(col,4));geom.setIndex(idx);
    const material=new T.MeshBasicMaterial({color:s.e.ink,vertexColors:true,transparent:true,side:T.DoubleSide,depthWrite:false,
      toneMapped:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-1});
    const mesh=new T.Mesh(geom,material);mesh.renderOrder=1;return {s,mesh};
  }
  function attach(world,plan,course){
    const rows=plan.strings.map(fixture),pools=plan.spills.map(s=>puddle(s,course));
    for(const b of rows)world.add(b.root);for(const q of pools)world.add(q.mesh);
    return {update(t,eye){
      for(const b of rows){
        const p=b.root.position;b.root.visible=(eye.x-p.x)**2+(eye.z-p.z)**2<160**2;
        const phase=bank(b.r,t);if(!b.root.visible||b.last===phase)continue;
        b.last=phase;for(let i=0;i<8;i++)b.geometries[i].material=b.hues[(phase+16-b.r.inverse*i)%8];
      }
      for(const {s,mesh} of pools){mesh.visible=(s.x-eye.x)**2+(s.z-eye.z)**2<145**2;
        if(mesh.visible)mesh.material.opacity=.83+.10*Math.sin(s.phase+t*1.85);}
    }};
  }
  // Flat fallback uses the very same wiring, lamp spacing, direction and clock.
  function drawRim(ctx,b,w,h,t){
    const r=b.electric;if(!r||w<12||h<3)return;
    const k=(w/b.width+h/b.height)*.5,rad=Math.max(.65,k*r.radius),phase=bank(r,t);
    for(const bulb of r.bulbs){
      const level=levels[(phase+16-bulb.slot*r.inverse)%8],x=bulb.x*w/b.width,y=-bulb.y*h/b.height;
      ctx.fillStyle=r.hue;ctx.globalAlpha=.10+level*.15;ctx.beginPath();ctx.arc(x,y,rad*2.05,0,TAU);ctx.fill();
      ctx.globalAlpha=.20+.80*level;ctx.beginPath();ctx.arc(x,y,rad*.94,0,TAU);ctx.fill();
      if(level>.40){ctx.fillStyle='#fff1d7';ctx.globalAlpha=level;ctx.beginPath();ctx.arc(x,y,Math.max(.40,rad*.49),0,TAU);ctx.fill();}
    }ctx.globalAlpha=1;
  }
  function drawSpills(ctx,plan,course,eye,proj,prim){
    for(const s of plan.spills){
      if((s.x-eye.x)**2+(s.z-eye.z)**2>140**2)continue;
      const y=surface(course,s.x,s.z)+.03,p=proj(s.x,y,s.z),a=proj(s.x+s.dx*s.long,y,s.z+s.dz*s.long),b=proj(s.x+s.dz*s.wide,y,s.z-s.dx*s.wide);
      if(!p||!a||!b)continue;
      prim.push({d:p.d-.04,fn(){
        ctx.save();ctx.transform(a.x-p.x,a.y-p.y,b.x-p.x,b.y-p.y,p.x,p.y);
        const grad=ctx.createRadialGradient(0,0,0,0,0,1);grad.addColorStop(0,s.e.ink+'48');grad.addColorStop(1,s.e.ink+'00');
        ctx.fillStyle=grad;ctx.fillRect(-1,-1,2,2);ctx.restore();
      }});
    }
  }
  function lookouts(c,data,entries,carnival){
    const m=MTMCelestial.moon(c.id),courseNames={arizona:'Mesa Moonwatch',eight:'Canopy Observatory',indiana:'Fairground Moon Deck'};
    // The entire lunar disk needs an unobstructed cone. Reserve the whole
    // flight envelope of parade floats so a looping duck cannot eclipse it.
    const scenery=entries.map(e=>({x:e.x,z:e.z,r:e.footprintRadius||e.radius||1,top:e.y+e.height+3}));
    for(const e of carnival.air)scenery.push({x:e.x,z:e.z,r:e.width*.64+15,top:e.y+e.height+2});
    const cos=Math.hypot(m.x,m.z),dx=m.x/cos,dz=m.z/cos;
    const slope=m.y/cos,margin=Math.tan((m.diameter*.5+1.5)*Math.PI/180);
    let pick=null,best=-Infinity;
    for(const f of [.022,.13,.26,.43,.57,.72,.84,.95])for(const offset of [0,c.width*.58,-c.width*.58]){
      const s=c.length*f,p=c.at(s,offset),base=c.ground(p.x,p.z);
      let minY=base+26;
      for(let d=5;d<=570;d+=7){
        const a=p.x+dx*d,b=p.z+dz*d,pad=margin*d;
        const peak=Math.max(c.ground(a,b),c.ground(a+dz*pad,b-dx*pad),c.ground(a-dz*pad,b+dx*pad));
        minY=Math.max(minY,peak+3-d*(slope-margin));
      }
      for(const q of scenery){
        const x=q.x-p.x,z=q.z-p.z,d=x*dx+z*dz;
        if(d+q.r<0||d-q.r>570||Math.abs(x*dz-z*dx)>q.r+margin*Math.max(0,d))continue;
        minY=Math.max(minY,q.top-(slope-margin)*Math.max(0,d-q.r));
      }
      for(const extra of [0,8,17,32]){
        const y=minY+extra,eye=[p.x,y,p.z];
        const blocked=[-1,0,1].some(side=>data.survey?.blocked(eye,[p.x+(dx+side*margin*dz)*570,y+(slope-margin)*570,p.z+(dz-side*margin*dx)*570]));
        if(blocked)continue;
        const score=(dx*p.dx+dz*p.dz)*4-(y-base)*.23-Math.abs(offset)*.025;
        if(score>best){pick={x:p.x,y,z:p.z,s};best=score;}
        break;
      }
    }
    if(!pick){const p=c.at(c.length*.13);pick={...p,y:c.ground(p.x,p.z)+65};}
    const deck={...pick,kind:'sky',ink:'#aac9ee',crew:'2389 Night Observatory'};
    const field=MTMCelestial.starField(c.id);
    return [
      {...deck,id:'sky-moon-'+c.id,name:courseNames[c.id],direction:m,fov:18,drop:5.5,caption:m.caption},
      {...deck,id:'sky-stars-'+c.id,name:field.label,direction:field,fov:field.fov||49,drop:0,caption:field.caption}
    ];
  }
  return {plan,attach,drawRim,drawSpills,lookouts};
})();
