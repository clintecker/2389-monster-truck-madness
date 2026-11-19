/* Every heat owns its loose objects and its dirt heightfields. The course layout
   stays immutable, so restarting or watching a replay cannot dirty the next heat. */
const MTMWorld = (() => {
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),cols=21,rows=31;
  const kinds={
    barrels:{r:.64,h:1.62,inv:13,tough:18,material:'metal'},
    tires:{r:.88,h:1.26,inv:5,tough:25,material:'rubber'},
    barricade:{hx:1.59,hz:.54,h:1.5,inv:8,tough:12,material:'plastic'},
    pylon:{r:.42,h:1.83,inv:16,tough:9,material:'plastic'},
    crt:{hx:.83,hz:.61,h:1.13,inv:10,tough:14,material:'plastic'},
    cart:{hx:.58,hz:.78,h:1.24,inv:14,tough:12,material:'metal'},
    mailbox:{hx:.41,hz:.52,h:1.64,inv:9,tough:11,material:'metal'},
    sofa:{hx:1.32,hz:.60,h:1.13,inv:6,tough:23,material:'rubber'}
  };
  // The central racing line remains open. Some breakables sit within a truck
  // width of an apex or along the optional outer line, so a driver can reach them.
  const layouts={
    arizona:[[.031,'pylon',1],[.083,'barrels',-1],[.137,'barricade',1],[.215,'tires',-1],[.331,'barrels',1],[.384,'pylon',-1],[.447,'barricade',1],[.526,'tires',-1],[.654,'barrels',1],[.722,'pylon',1],[.807,'barricade',-1],[.919,'tires',1]],
    eight:[[.043,'pylon',-1],[.115,'barrels',-1],[.181,'barricade',1],[.23,'tires',-1],[.381,'barrels',1],[.435,'pylon',1],[.559,'tires',-1],[.622,'barricade',1],[.809,'barrels',1],[.904,'pylon',-1]],
    indiana:[[.055,'pylon',1],[.118,'barrels',1],[.185,'tires',-1],[.363,'barricade',-1],[.431,'pylon',1],[.532,'tires',1],[.611,'barrels',-1],[.786,'barricade',1],[.855,'tires',-1],[.937,'pylon',1]]
  };
  function props(c){
    const list=[];
    function put(kind,p,yaw){
      const y=c.ground(p.x,p.z);
      list.push({id:list.length,kind,x:p.x,z:p.z,y,yaw,baseX:p.x,baseZ:p.z,baseY:y,baseYaw:yaw,
        vx:0,vz:0,spin:0,tiltX:0,tiltZ:0,tiltVX:0,tiltVZ:0,restX:0,restZ:0,damage:0,cool:0,changed:false});
    }
    for(const [fraction,kind,side] of layouts[c.id]){
      const count=kind==='barricade'?2:kind==='pylon'?4:3;
      for(let j=0;j<count;j++){
        const s=c.length*fraction+j*(kind==='pylon'?3.8:2.8),lane=side*c.width*(j===0?.39:j===1?.50:.55);
        const p=c.at(s,lane);put(kind,p,Math.atan2(p.dx,p.dz)+(kind==='barricade'?side*.42:0));
      }
    }
    // Loose lots sit on alternate verges. Keep every physics body away from
    // the crossing, alternate dirt shortcut, starting grid and checkpoint flags.
    const stock=['cart','crt','sofa','mailbox'],step=c.id==='indiana'?21:29;
    const bypass=c.id==='eight'?Array.from({length:29},(_,i)=>c.at(c.length*(.688+.103*i/28),-14*Math.sin(Math.PI*i/28)**1.4)):[];
    for(let i=0,s=17;s<c.length-8;i++,s+=step){
      const side=i%2?1:-1;
      for(let j=0;j<(i%3===0?2:1);j++){
        const p=c.at(s+j*4.2,side*(c.width*.50+.35+(i%3)*.55+j*.65));
        if(c.nearest(p.x,p.z).distance<c.width*.45||bypass.some(v=>Math.hypot(p.x-v.x,p.z-v.z)<6.4))continue;
        if(c.gates.some(v=>Math.abs(v.s-s)<4.5)||list.some(v=>Math.hypot(p.x-v.x,p.z-v.z)<2.3))continue;
        put(stock[(i+j+1)%4],p,Math.atan2(-side*p.dz-.45*p.dx,side*p.dx-.45*p.dz)+.32*Math.sin(i*.73));
      }
    }
    return list;
  }
  const soilSites={arizona:[[.162,-1.8,12],[.433,0,19],[.665,1.9,14],[.824,-1.4,12]],
    eight:[[.092,1.4,15],[.201,-1.6,13],[.421,1.3,17],[.843,-1.8,15]],indiana:[[.172,0,12],[.443,0,13],[.825,0,12]]};
  function sample(rough,gx,gz){
    const x=Math.min(cols-2,Math.floor(gx)),z=Math.min(rows-2,Math.floor(gz)),a=gx-x,b=gz-z,k=z*cols+x;
    return ((1-b)*((1-a)*rough[k]+a*rough[k+1])+b*((1-a)*rough[k+cols]+a*rough[k+cols+1]))/255;
  }
  function fade(x){const a=clamp((1-Math.abs(x))*3.5,0,1);return a*a*(3-2*a);}
  function patchAt(p,x,z){
    const dx=x-p.x,dz=z-p.z;if(Math.abs(dx)>p.bound||Math.abs(dz)>p.bound)return null;
    const u=(dx*p.dz-dz*p.dx)/p.w,v=(dx*p.dx+dz*p.dz)/p.l;
    return Math.abs(u)<1&&Math.abs(v)<1?{u,v,gx:(u+1)*(cols-1)*.5,gz:(v+1)*(rows-1)*.5}:null;
  }
  function uplift(p,u,v,groove){return fade(u)*fade(v)*(p.h-.30*groove);}
  function terrain(course){
    const soil=soilSites[course.id].map(([fraction,lane,l])=>{
      const q=course.at(fraction*course.length,lane),w=course.width*.41;
      return {...q,w,l,h:course.id==='indiana'?.38:.53,bound:Math.hypot(w,l),depth:new Uint8Array(cols*rows),version:0,snap:null};
    });
    const c=Object.create(course);c.original=course;c.soil=soil;
    c.ground=(x,z)=>{
      let h=course.ground(x,z);
      for(const p of soil){const q=patchAt(p,x,z);if(q)h+=uplift(p,q.u,q.v,sample(p.depth,q.gx,q.gz));}
      return h;
    };
    c.surfaceAt=(x,z,near)=>{
      const base=course.surfaceAt(x,z,near);
      if(base!=='dirt')return base;
      for(const p of soil){
        const uv=patchAt(p,x,z);
        if(uv&&Math.abs(uv.u)<.89&&Math.abs(uv.v)<.93)return course.id==='eight'?'mud':'loose';
      }
      return base;
    };
    return c;
  }
  function deform(g,v,dt){
    if(!v.grounded||v.speed<.9)return;
    const sn=Math.sin(v.yaw),cs=Math.cos(v.yaw);
    for(const p of g.c.soil){
      if((v.x-p.x)**2+(v.z-p.z)**2>(p.bound+3)**2)continue;
      let changed=false;
      for(const sx of [-1.36,1.36])for(const sz of [-1.65,1.65]){
        const q=patchAt(p,v.x+sx*cs+sz*sn,v.z-sx*sn+sz*cs);if(!q)continue;
        const ix=Math.floor(q.gx),iz=Math.floor(q.gz);
        for(let z=iz-1;z<=iz+2;z++)for(let x=ix-1;x<=ix+2;x++){
          if(x<1||z<1||x>=cols-1||z>=rows-1)continue;
          const d=(x-q.gx)**2+(z-q.gz)**2,force=Math.max(0,1-d/1.72);
          if(force<=0)continue;
          const k=z*cols+x,old=p.depth[k],delta=Math.round(force*(10+Math.min(v.speed,35)*1.8)*dt*60);
          if(delta>0&&old<255){p.depth[k]=Math.min(255,old+delta);changed=true;}
        }
      }
      if(changed)p.version++;
    }
  }
  function stepProps(g,dt){
    const vehicles=[g.p,...g.ai];
    for(const item of g.props){
      const spec=kinds[item.kind];item.cool=Math.max(0,item.cool-dt);
      for(const v of vehicles){
        if(Math.abs(v.x-item.x)>5||Math.abs(v.z-item.z)>5||v.y>item.y+spec.h*(1-.65*item.damage)+.36)continue;
        const m=MTMContact.manifold(v,item,spec,item.yaw);
        if(!m||m.depth<0)continue;
        const vn=(v.vx-item.vx)*m.nx+(v.vz-item.vz)*m.nz,closing=Math.max(0,-vn);
        const landing=v.grounded?0:Math.max(0,-v.vy)*.78,impact=Math.max(closing,landing);
        // A flattened object still bumps the wheels but no longer behaves like a wall.
        const resistance=1-.77*item.damage,impulse=closing/(1+spec.inv)*resistance;
        v.vx+=m.nx*impulse;v.vz+=m.nz*impulse;
        if(v.brain!==undefined)v.speed=Math.max(0,v.speed-impulse*.27);
        item.vx-=m.nx*impulse*spec.inv;item.vz-=m.nz*impulse*spec.inv;
        item.x-=m.nx*Math.max(0,m.depth-.025)*.67;item.z-=m.nz*Math.max(0,m.depth-.025)*.67;
        if(m.depth>.027||closing>.15)item.changed=true;
        if(impact<1.8||item.cool>0)continue;
        item.changed=true;item.cool=.28;
        const side=m.nx*Math.cos(item.yaw)-m.nz*Math.sin(item.yaw),fore=m.nx*Math.sin(item.yaw)+m.nz*Math.cos(item.yaw);
        item.damage=clamp(item.damage+impact/spec.tough,0,1);
        const bend=item.kind==='pylon'?1.22:item.kind==='barrels'?.66:.44;
        item.restX=clamp(-fore*item.damage*bend,-1.35,1.35);item.restZ=clamp(side*item.damage*bend,-1.35,1.35);
        item.tiltVX-=fore*Math.min(4,impact*.30);item.tiltVZ+=side*Math.min(4,impact*.30);
        item.spin+=clamp((m.at.x-item.x)*m.nz-(m.at.z-item.z)*m.nx,-1.5,1.5)*Math.min(2.5,impact*.17);
        if(v===g.p){v.bounceV+=Math.min(.80,.09+impact*.035);g.events.push({type:'prop',kind:item.kind,material:spec.material,impact});}
      }
      if(!item.changed)continue;
      const drag=Math.exp(-dt*(item.kind==='cart'?1.22:item.kind==='tires'?2.8:2.2));
      item.vx*=drag;item.vz*=drag;item.spin*=Math.exp(-dt*2.6);
      item.x+=item.vx*dt;item.z+=item.vz*dt;item.yaw+=item.spin*dt;item.y=g.c.ground(item.x,item.z);
      const spring=item.kind==='pylon'?32:19;
      item.tiltVX+=((item.restX-item.tiltX)*spring-item.tiltVX*7)*dt;
      item.tiltVZ+=((item.restZ-item.tiltZ)*spring-item.tiltVZ*7)*dt;
      item.tiltX=clamp(item.tiltX+item.tiltVX*dt,-1.48,1.48);
      item.tiltZ=clamp(item.tiltZ+item.tiltVZ*dt,-1.48,1.48);
    }
  }
  function snapshot(g){
    const objects=[];
    for(const p of g.props)if(p.changed)objects.push([p.id,p.x,p.y,p.z,p.yaw,p.tiltX,p.tiltZ,p.damage]);
    const soil=g.c.soil.map(p=>{
      if(!p.snap||p.version!==p.snap.version)p.snap={version:p.version,depth:p.depth.slice()};
      return p.snap;
    });
    return {objects,soil};
  }
  function replay(g,a,b,t,out){
    let ai=0,bi=0;
    for(let i=0;i<out.length;i++){
      const p=out[i],base=g.props[i],from=a[ai]?.[0]===i?a[ai++]:null,to=b[bi]?.[0]===i?b[bi++]:from;
      if(!from&&!to){Object.assign(p,{x:base.baseX,y:base.baseY,z:base.baseZ,yaw:base.baseYaw,tiltX:0,tiltZ:0,damage:0});continue;}
      const initial=[i,base.baseX,base.baseY,base.baseZ,base.baseYaw,0,0,0],l=from||initial,r=to||l;
      const fields=['x','y','z','yaw','tiltX','tiltZ','damage'];fields.forEach((k,j)=>p[k]=l[j+1]+(r[j+1]-l[j+1])*t);
    }
  }
  return {terrain,props,stepProps,deform,snapshot,replay,cols,rows,uplift};
})();
