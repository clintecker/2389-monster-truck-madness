/* Horizontal contact uses the wheel-to-wheel envelope. A small contact skin
   keeps a grazing pair in contact without making a side swipe bounce away. */
const MTMContact = (() => {
  const {clamp} = MTMKit;
  const skin=.035;
  const truck={halfWidth:1.77,halfLength:2.50};
  const grip={rubber:.44,stone:.35,wood:.30,metal:.22,plastic:.16};
  const weight=[1,.97,1.04,.93,.95,.98,.90];
  function axes(yaw=0){const s=Math.sin(yaw),c=Math.cos(yaw);return [[c,-s],[s,c]];}
  function point(p,ax,x,z){return {x:p.x+x*ax[0][0]+z*ax[1][0],z:p.z+x*ax[0][1]+z*ax[1][1]};}
  function local(dx,dz,ax){return dx*ax[0]+dz*ax[1];}
  function manifold(a,b,shape,boxYaw=0){
    const ax=axes(a.yaw),dx=b.x-a.x,dz=b.z-a.z;
    const lx=local(dx,dz,ax[0]),lz=local(dx,dz,ax[1]);
    const witness=point(a,ax,clamp(lx,-truck.halfWidth,truck.halfWidth),clamp(lz,-truck.halfLength,truck.halfLength));
    if(shape.r){
      let nx=witness.x-b.x,nz=witness.z-b.z;const d=Math.hypot(nx,nz);
      if(d>shape.r+skin)return null;
      if(d>.0001)return {nx:nx/d,nz:nz/d,depth:shape.r-d,at:witness};
      const wx=truck.halfWidth-Math.abs(lx),wz=truck.halfLength-Math.abs(lz),i=wx<wz?0:1;
      const sign=(i===0?lx:lz)>=0?-1:1;
      return {nx:ax[i][0]*sign,nz:ax[i][1]*sign,depth:shape.r+Math.min(wx,wz),at:witness};
    }
    const bx=axes(boxYaw),hw=shape.halfWidth??shape.hx,hl=shape.halfLength??shape.hz;
    let depth=Infinity,nx=0,nz=0;
    for(const n of [...ax,...bx]){
      const r=truck.halfWidth*Math.abs(local(...ax[0],n))+truck.halfLength*Math.abs(local(...ax[1],n))
        +hw*Math.abs(local(...bx[0],n))+hl*Math.abs(local(...bx[1],n));
      const sep=local(dx,dz,n),d=r-Math.abs(sep);
      if(d< -skin)return null;
      if(d<depth){const sign=sep>=0?-1:1;depth=d;nx=n[0]*sign;nz=n[1]*sign;}
    }
    return {nx,nz,depth,at:witness};
  }
  // AI position and velocity live in course coordinates. Project the impulse
  // back into that state so another vehicle cannot be pushed like a fixed wall.
  function displace(g,v,dx,dz,ix,iz){
    v.x+=dx;v.z+=dz;v.vx+=ix;v.vz+=iz;
    if(v.brain===undefined)return;
    const q=g.c.at(v.s);
    v.s+=dx*q.dx+dz*q.dz;v.lane+=dx*q.dz-dz*q.dx;
    v.speed=Math.max(0,v.speed+ix*q.dx+iz*q.dz);
    v.laneV=clamp(v.laneV+ix*q.dz-iz*q.dx,-8,8);
    v.progress=v.s;
  }
  function resolve(g,a,b,m,dt,material,fixed=false){
    const u=weight[a.truck]??1,v=fixed?0:(weight[b.truck]??1),sum=u+v;
    const {nx,nz,depth,at}=m,tx=-nz,tz=nx;
    const rx=a.vx-(fixed?0:b.vx),rz=a.vz-(fixed?0:b.vz);
    const vn=rx*nx+rz*nz,vt=rx*tx+rz*tz,impact=Math.max(0,-vn);
    const correction=Math.max(0,depth-.012)*.86/sum;
    // Hard frontal hits get a little restitution. Slow side contact slides.
    const jn=impact*(impact>4.0?1.10:1)/sum;
    const jt=-Math.sign(vt)*Math.min(Math.abs(vt)/sum,(grip[material]||.28)*(jn+(vn<.16?1.45*dt:0)));
    const jx=jn*nx+jt*tx,jz=jn*nz+jt*tz;
    const lever=(at.z-a.z)*jx-(at.x-a.x)*jz;
    displace(g,a,nx*correction*u,nz*correction*u,jx*u,jz*u);
    if(!fixed)displace(g,b,-nx*correction*v,-nz*correction*v,-jx*v,-jz*v);
    if(a!==g.p)return;
    a.contactSpin=clamp(a.contactSpin+clamp(lever*.031,-.24,.24),-.8,.8);
    if(impact>3.75&&a.hitCooldown<=0){g.events.push({type:'hit',material,impact});a.hitCooldown=.36;}
    if(vn<.22&&Math.abs(vt)>1.15){
      const strength=clamp((Math.abs(vt)-1)/20,0,1)*clamp(.44+impact*.16+Math.max(0,depth)*1.9,0,1);
      if(strength>=a.rubThisStep){a.rubThisStep=strength;a.rubMaterial=material;a.rubX=at.x;a.rubZ=at.z;}
    }
  }
  const solids=new WeakMap(),cell=20;
  const key=(x,z)=>x*65536+z;
  function gridFor(items){
    if(solids.has(items))return solids.get(items);
    const grid=new Map();
    for(const b of items){
      const rx=(b.r||b.hx)+3.3,rz=(b.r||b.hz)+3.3;
      for(let x=Math.floor((b.x-rx)/cell);x<=Math.floor((b.x+rx)/cell);x++)
        for(let z=Math.floor((b.z-rz)/cell);z<=Math.floor((b.z+rz)/cell);z++){
          const k=key(x,z);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(b);
        }
    }
    solids.set(items,grid);return grid;
  }
  function vehicles(g,dt){
    const runners=[g.p,...g.ai];
    for(let i=0;i<runners.length;i++)for(let j=i+1;j<runners.length;j++){
      const a=runners[i],b=runners[j];
      if(b.finishTime!==null||(a.x-b.x)**2+(a.z-b.z)**2>38||Math.abs(a.y-b.y)>2.45)continue;
      const m=manifold(a,b,truck,b.yaw);if(m)resolve(g,a,b,m,dt,'rubber');
    }
    const obstacles=g.c.obstacles,p=g.p;
    if(obstacles?.length&&p.y-p.groundY<1.5){
      const near=gridFor(obstacles).get(key(Math.floor(p.x/cell),Math.floor(p.z/cell)))||[];
      for(const b of near){
        const m=manifold(p,b,b);if(m)resolve(g,p,b,m,dt,b.material||'stone',true);
      }
    }
    p.rub+=(p.rubThisStep-p.rub)*(1-Math.exp(-dt*(p.rubThisStep>p.rub?25:16)));
  }
  return {manifold,vehicles};
})();
