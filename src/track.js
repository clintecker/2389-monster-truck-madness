/* The terrain, road surface and physical takeoffs share the same height function.
   Most detail is painted into repeating gravel and track textures to keep the
   number of objects independent of the length of the race. */
const MTMTrack = (() => {
  const T=THREE,{clamp, rng, canvas, map} = MTMKit;
  const palettes={
    arizona:{road:[106,91,103],ground:[65,49,67],gravel:'#d3b0ba',fog:0x444058},
    eight:{road:[80,99,100],ground:[38,54,55],gravel:'#b3cec3',fog:0x334951},
    indiana:{road:[94,88,112],ground:[47,45,62],gravel:'#c5bdde',fog:0x403a54}
  };
  const mint='#67ffe0',pink='#ff4899';
  const textureCache=new Map();
  function dirt(id,road){
    const key=id+(road?'-road':'-ground');if(textureCache.has(key))return textureCache.get(key);
    const p=palettes[id],c=canvas(road?512:256,512),g=c.getContext('2d'),w=c.width,h=c.height;
    const rand=rng(id==='eight'?120:id==='indiana'?801:353),im=g.createImageData(w,h),base=road?p.road:p.ground;
    const tau=Math.PI*2,lanes=[.13,.258,.429,.568,.743,.866],centers=new Float32Array(lanes.length);
    const cross=new Float32Array(w),long=new Float32Array(h);
    for(let x=0;x<w;x++)cross[x]=1.7*Math.sin(x/w*tau*67)+.8*Math.cos(x/w*tau*103);
    for(let y=0;y<h;y++)long[y]=Math.sin(y/h*tau*3)*2+Math.sin(y/h*tau*7)*1.3;
    for(let y=0;y<h;y++){
      const v=y/h;
      for(let i=0;i<lanes.length;i++)centers[i]=lanes[i]+.008*Math.sin(v*tau+i*1.7)+.002*Math.sin(v*tau*3+i);
      for(let x=0;x<w;x++){
        const u=x/w;
        const aggregate=3.2*Math.sin(tau*(4*u+v))+2.5*Math.cos(tau*(2*v-3*u))+1.4*Math.sin(tau*(11*u-4*v));
        let furrow=0;
        if(road)for(const lane of centers){const d=Math.abs(u-lane);if(d<.026)furrow=Math.max(furrow,1-d/.026);}
        const shoulder=road?Math.max(0,(Math.abs(u-.5)-.37)*6):0;
        const grain=(rand()+rand()-1)*(road?30:27),m=aggregate+grain+(road?cross[x]*.9-13*furrow-11*shoulder:long[y]*.6);
        const o=(y*w+x)*4;im.data[o]=base[0]+m*.95;im.data[o+1]=base[1]+m;im.data[o+2]=base[2]+m*1.07;im.data[o+3]=255;
      }
    }
    g.putImageData(im,0,0);
    // Larger chips, paired tread-block impressions, and isolated shallow puddles
    // break up the fine aggregate. The texture tiles along the direction of travel.
    for(let i=0;i<(road?4400:2800);i++){
      const x=rand()*w,y=rand()*h,r=rand()**3*2.2+.24;
      g.globalAlpha=i%3?.28:.42;g.fillStyle=i%3?'#1b1c28':p.gravel;
      g.beginPath();g.ellipse(x,y,r*(1+rand()),r*.62,rand()*3.1,0,tau);g.fill();
    }
    g.globalAlpha=1;
    if(road){
      for(let l=0;l<lanes.length;l++)for(let j=0;j<66;j++){
        const v=j/66,y=v*h,x=(lanes[l]+.008*Math.sin(v*tau+l*1.7)+.002*Math.sin(v*tau*3+l))*w;
        g.strokeStyle='rgba(24,25,34,.32)';g.lineWidth=1.6;g.beginPath();g.moveTo(x-5,y-.8);g.lineTo(x-.8,y+1.6);g.moveTo(x+1,y+1.6);g.lineTo(x+5.5,y-.8);g.stroke();
      }
      for(let i=0;i<12;i++){
        const x=w*(.08+.84*rand()),y=h*(.10+.80*rand()),rx=5+rand()*14,ry=7+rand()*24,phase=rand()*tau;
        g.fillStyle='rgba(21,31,48,.17)';g.beginPath();
        for(let j=0;j<20;j++){const t=j*tau/20,v=.85+.14*Math.sin(3*t+phase)+.07*Math.sin(7*t);const px=x+Math.cos(t)*rx*v,py=y+Math.sin(t)*ry*v;j?g.lineTo(px,py):g.moveTo(px,py);}g.closePath();g.fill();
        g.fillStyle=i%3?'rgba(162,202,214,.25)':'rgba(219,153,199,.22)';
        for(let j=0;j<12;j++){const v=rand()*1.65-.82;g.fillRect(x+rand()*rx*.8-rx*.5,y+v*ry,rand()*rx*(1-v*v)*.7+.9,.45+rand()*.55);}
      }
    }else if(id==='eight'){
      for(let i=0;i<1950;i++){const x=rand()*w,y=rand()*h;g.strokeStyle=i%2?'rgba(79,101,88,.5)':'rgba(25,38,41,.45)';g.beginPath();g.moveTo(x,y);g.lineTo(x+rand()*2-1,y-1-rand()*4);g.stroke();}
    }
    const texture=map(c);textureCache.set(key,texture);return texture;
  }
  function meshGeom(pos,uv,idx,colors){const ge=new T.BufferGeometry();ge.setAttribute('position',new T.Float32BufferAttribute(pos,3));if(uv)ge.setAttribute('uv',new T.Float32BufferAttribute(uv,2));if(colors)ge.setAttribute('color',new T.Float32BufferAttribute(colors,3));ge.setIndex(idx);ge.computeVertexNormals();return ge;}
  function terrainMesh(c){
    const b=c.bounds,margin=c.id==='indiana'?120:200,step=c.id==='indiana'?4:5;
    const x0=b.minX-margin,z0=b.minZ-margin,nx=Math.ceil((b.maxX-b.minX+2*margin)/step),nz=Math.ceil((b.maxZ-b.minZ+2*margin)/step),pos=[],uv=[],idx=[],colors=[];
    for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
      const x=x0+i*step,z=z0+j*step;pos.push(x,c.base(x,z)-.25,z);uv.push(x/9,z/9);
      const val=.85+.085*Math.sin(x*.034+z*.019)+.07*Math.sin(x*.1-z*.037)+.063*Math.sin(z*.059-x*.017);colors.push(val*1.02,val,val*.97);
      if(i<nx&&j<nz){const a=j*(nx+1)+i;idx.push(a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2);}
    }
    const m=new T.Mesh(meshGeom(pos,uv,idx,colors),new T.MeshStandardMaterial({map:dirt(c.id,false),roughness:1,vertexColors:true}));m.receiveShadow=true;m.userData.groundSheet=true;return m;
  }
  function ribbon(c,start,end,offsetFn,width,secondary=false){
    const pos=[],uv=[],idx=[],colors=[],cols=secondary?[-1,-.6,0,.6,1]:[-1,-.88,-.68,-.48,-.25,0,.25,.48,.68,.88,1],steps=Math.ceil((end-start)/2.1);
    for(let j=0;j<=steps;j++){
      const t=j/steps,s=start+(end-start)*t,offset=offsetFn(t),a=c.at(s);
      for(let i=0;i<cols.length;i++){
        const k=cols[i],noise=Math.sin(s*.21+Math.sign(k)*42)*.35+Math.sin(s*.063)*.6;
        const side=k*width/2+(Math.abs(k)**5)*noise+offset,x=a.x+a.dz*side,z=a.z-a.dx*side;
        // Gentle crowned bed, blended shoulder color, and a wet arroyo in Arizona.
        const y=c.ground(x,z)+.12+.06*(1-k*k)+(secondary?.035:0);
        pos.push(x,y,z);uv.push((k+1)*.5,s/21);
        const shoulder=clamp((Math.abs(k)-.78)/.22,0,1),variation=.96+.035*Math.sin(s*.121+k*3)+.035*Math.sin(s*.063-k*4);
        const wet=c.id==='arizona'?Math.min(clamp((s/c.length-.422)*190,0,1),clamp((.448-s/c.length)*190,0,1)):0;
        const reflected=Math.pow(Math.abs(k),2)*Math.pow(.5+.5*Math.cos((s-12)*Math.PI*2/22),3)*.25;
        const body=variation*(1-.30*shoulder)*(1-.35*wet);
        colors.push(body+(k<0?reflected:.025),body+(k>0?reflected:0),body+reflected*.58+wet*.08);
        if(i<cols.length-1&&j<steps){const p=j*cols.length+i;idx.push(p,p+cols.length,p+1,p+1,p+cols.length,p+cols.length+1);}
      }
    }
    const mat=new T.MeshStandardMaterial({map:dirt(c.id,true),vertexColors:true,roughness:.77,metalness:.08,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2});
    const m=new T.Mesh(meshGeom(pos,uv,idx,colors),mat);m.receiveShadow=true;return m;
  }
  const unitBox=new T.BoxGeometry(1,1,1),poleGeo=new T.CylinderGeometry(1,1,1,8);
  function batch(world,geo,items,mat){if(!items.length)return;const mesh=new T.InstancedMesh(geo,mat,items.length),dummy=new T.Object3D();items.forEach((p,i)=>{dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(0,p.yaw||0,0);dummy.scale.set(p.w,p.h,p.d);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);if(p.color)mesh.setColorAt(i,new T.Color(p.color));});mesh.castShadow=mesh.receiveShadow=!mat.isMeshBasicMaterial;world.add(mesh);}
  function board(label){
    const c=canvas(1024,96),g=c.getContext('2d');
    g.fillStyle='#0b1120';g.fillRect(0,0,1024,96);g.fillStyle=mint;g.fillRect(0,0,1024,4);g.fillStyle=pink;g.fillRect(0,91,1024,5);
    g.fillStyle='#8bfde0';g.beginPath();g.moveTo(0,7);g.lineTo(152,7);g.lineTo(129,88);g.lineTo(0,88);g.fill();
    g.fillStyle='#071e26';g.textBaseline='middle';g.textAlign='center';g.font='italic 900 49px Display, Impact, sans-serif';g.fillText('2389',71,38,109);
    g.font='bold 13px Mono, monospace';g.fillText('R E S E A R C H',69,69,108);
    g.fillStyle='#ddfff4';g.font='italic 900 57px Display, Impact, sans-serif';g.fillText(label,519,48,525);
    for(let row=0;row<4;row++)for(let col=0;col<6;col++){g.fillStyle=(row+col)%2?'#a4e8df':'#213142';g.fillRect(885+col*18+(3-row)*2,14+row*17,18,17);}
    return map(c,false);
  }
  function gateBanner(n,tint){
    const c=canvas(128,256),g=c.getContext('2d');g.fillStyle='#10192b';g.fillRect(0,0,128,256);g.fillStyle=tint;g.fillRect(0,0,128,10);g.fillRect(0,10,7,246);g.fillRect(121,10,7,246);
    g.font='700 22px Cond, sans-serif';g.textAlign='center';g.fillText('GATE',64,44);g.fillStyle='#ecfff8';g.font='italic 900 94px Display, Impact, sans-serif';g.fillText(String(n).padStart(2,'0'),63,137,111);
    g.fillStyle=tint;for(let y=158;y<=210;y+=25){g.beginPath();g.moveTo(21,y);g.lineTo(64,y+14);g.lineTo(107,y);g.lineTo(107,y+9);g.lineTo(64,y+23);g.lineTo(21,y+9);g.fill();}g.fillRect(0,245,128,11);
    return map(c,false);
  }
  function reflections(world,c,patches){
    // A single translucent mesh paints light on the road beneath real beacons.
    // The fine broken highlights suggest wet gravel rather than a perfect mirror.
    const tex=canvas(96,160),ctx=tex.getContext('2d'),im=ctx.createImageData(tex.width,tex.height),rand=rng(2389);
    for(let j=0;j<tex.height;j++){
      const y=j/(tex.height-1)*2-1,broken=.68+.22*Math.sin(36*y)+.10*Math.cos(117*y),aperture=1.15-.62*Math.abs(y);
      for(let i=0;i<tex.width;i++){
        const x=(i/(tex.width-1)*2-1+.035*Math.sin(y*23))/aperture,rr=x*x+y*y;
        const halo=Math.max(0,1-rr)**2,filament=Math.exp(-x*x*60)*Math.max(0,1-Math.abs(y));const a=halo*.21+filament*.21*broken;
        const o=(j*tex.width+i)*4;im.data[o]=im.data[o+1]=im.data[o+2]=255;im.data[o+3]=255*a*(.60+.40*rand())*broken;
      }
    }ctx.putImageData(im,0,0);
    const pos=[],uv=[],idx=[],rgb=[];
    for(const patch of patches){
      const offset=pos.length/3,col=new T.Color(patch.tint),rows=4,cols=3;
      for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
        const u=x/(cols-1),v=y/(rows-1),s=patch.s+(v-.5)*patch.len,off=patch.side+(u-.5)*patch.w,q=c.at(s,off);
        const crown=.12+.06*(1-Math.min(1,(off/(c.width*.5))**2));pos.push(q.x,c.ground(q.x,q.z)+crown+.065,q.z);uv.push(u,v);rgb.push(col.r,col.g,col.b);
        if(x+1<cols&&y+1<rows){const n=offset+y*cols+x;idx.push(n,n+cols,n+1,n+1,n+cols,n+cols+1);}
      }
    }
    const material=new T.MeshBasicMaterial({map:map(tex,false),vertexColors:true,transparent:true,depthWrite:false,side:T.DoubleSide,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-3});
    const mesh=new T.Mesh(meshGeom(pos,uv,idx,rgb),material);mesh.renderOrder=1;world.add(mesh);
  }
  function gatesAndSigns(world,c){
    const parts=[],poles=[],lights=[],posts=[],patches=[];
    const matte=new T.MeshStandardMaterial({roughness:.74,metalness:.17}),lit=new T.MeshBasicMaterial({toneMapped:false});
    const bulbs=Array.from({length:4},()=>{const m=new T.MeshBasicMaterial({toneMapped:false});m.userData.dynamicColor=true;return m;});
    const inkPos=[],inkIndices=[];
    for(const face of c.gridInk){
      const n=inkPos.length/3;
      for(const p of face)inkPos.push(...p);
      inkIndices.push(n,n+1,n+2,n,n+2,n+3);
    }
    const ink=new T.MeshBasicMaterial({color:'#a9c9c8',side:T.DoubleSide,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-2});
    world.add(new T.Mesh(meshGeom(inkPos,null,inkIndices),ink));
    const paint=[],faceColors=[];
    for(const {points,tint} of c.rampInk){
      const color=new T.Color(tint);
      for(const vertex of [0,1,2,0,2,3]){
        paint.push(...points[vertex]);faceColors.push(color.r,color.g,color.b);
      }
    }
    const roadPaint=new T.BufferGeometry();roadPaint.setAttribute('position',new T.Float32BufferAttribute(paint,3));
    roadPaint.setAttribute('color',new T.Float32BufferAttribute(faceColors,3));
    world.add(new T.Mesh(roadPaint,new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide,toneMapped:false})));
    function lamp(x,y,z,w,h,d,yaw,mat){const m=new T.Mesh(unitBox,mat);m.position.set(x,y,z);m.rotation.y=yaw;m.scale.set(w,h,d);world.add(m);}
    // The drag grid stages on the painted line itself. Its overhead banner
    // spans the far edge of the starting box so both lanes can read it.
    const startSign=c.id==='indiana'?6.3:0;
    const all=[{...c.at(startSign),s:startSign,finish:c.loop,start:true},...c.gates.filter(p=>!c.loop||!p.finish)];
    for(const a of all){
      const yaw=Math.atan2(a.dx,a.dz),edge=c.width*.58,centerY=c.ground(a.x,a.z),large=a.start||a.finish,height=large?(c.id==='indiana'?7.1:7.8):4.95;
      for(const side of [-1,1]){
        const tint=side>0?mint:pink,x=a.x+a.dz*edge*side,z=a.z-a.dx*edge*side,bottom=c.ground(x,z),top=centerY+height;
        parts.push({x,y:bottom+.32,z,w:large?1.04:.7,h:.64,d:large?.95:.7,yaw,color:'#24283b'});
        parts.push({x,y:(top+bottom)*.5,z,w:large?.38:.22,h:top-bottom,d:large?.52:.27,yaw,color:'#465069'});
        for(const [w,h,y] of [[large?.43:.28,.20,bottom+.73],[large?.45:.29,.13,top-.12]])lights.push({x,y,z,w,h,d:w+.04,yaw,color:tint});
        if(large){
          lights.push({x:x-a.dx*.27,y:(bottom+top)*.5,z:z-a.dz*.27,w:.095,h:Math.max(.3,top-bottom-.9),d:.04,yaw,color:tint});
          for(let i=0;i<4;i++)parts.push({x,y:bottom+1.13+i*1.38,z,w:.50,h:.11,d:.61,yaw,color:'#99a3b5'});
        }else{
          const f=new T.Mesh(new T.PlaneGeometry(1.78,3.15),new T.MeshBasicMaterial({map:gateBanner(a.index+1,tint),side:T.DoubleSide,toneMapped:false}));
          f.position.set(x+a.dz*.91*side,top-1.57,z-a.dx*.91*side);f.rotation.y=yaw+Math.PI;world.add(f);
          lights.push({x:x+a.dz*.89*side,y:top,z:z-a.dx*.89*side,w:1.94,h:.12,d:.24,yaw,color:tint});
        }
        patches.push({s:a.s,side:side*(c.width*.46),tint,len:large?13:10,w:large?6.5:4.4});
      }
      if(large){
        const len=edge*2+.58,label=a.start?(c.loop?'START / FINISH':'START'):'FINISH';
        parts.push({x:a.x,y:centerY+height-.23,z:a.z,w:len,h:1.53,d:.5,yaw,color:'#1a2232'});
        lights.push({x:a.x,y:centerY+height+.54,z:a.z,w:len,h:.08,d:.55,yaw,color:mint});
        lights.push({x:a.x,y:centerY+height-1.02,z:a.z,w:len,h:.075,d:.53,yaw,color:pink});
        const f=new T.Mesh(new T.PlaneGeometry(len-.14,1.45),new T.MeshBasicMaterial({map:board(label),side:T.DoubleSide,toneMapped:false}));
        f.rotation.y=yaw+Math.PI;f.position.set(a.x-a.dx*.265,centerY+height-.23,a.z-a.dz*.265);world.add(f);
        if(a.start){
          for(let i=0;i<4;i++){const u=(1.5-i)*.93;const x=a.x+a.dz*u,z=a.z-a.dx*u;
            parts.push({x,y:centerY+height-1.21,z,w:.84,h:.30,d:.31,yaw,color:'#101927'});
            lamp(x-a.dx*.18,centerY+height-1.21,z-a.dz*.18,.64,.16,.045,yaw,bulbs[i]);}
        }
      }
    }
    // The driving-left edge carries mint beacons, the driving-right edge pink.
    // Their broken cadence continues beyond each corner and stays visible in fog.
    for(let s=12;s<c.length-9;s+=22){const a=c.at(s);for(const side of [-1,1]){
      const off=(c.width*.5+1.20)*side,x=a.x+a.dz*off,z=a.z-a.dx*off,y=c.ground(x,z),tint=side>0?mint:pink,yaw=Math.atan2(a.dx,a.dz);
      poles.push({x,y:y+.57,z,w:.115,h:1.14,d:.115,color:'#89909e'});
      lights.push({x,y:y+1.075,z,w:.28,h:.24,d:.21,yaw,color:tint});
      if(Math.round((s-12)/22)%2===0)patches.push({s:s-.8,side:side*(c.width*.46),tint,len:6.0,w:4.1});
    }}
    for(const line of c.loop?[0]:[0,c.length])for(let i=0;i<20;i++){
      const a=c.at(line+.9+i%2*.45,(Math.floor(i/2)-4.5)*(c.width/10));parts.push({x:a.x,y:c.ground(a.x,a.z)+.21,z:a.z,w:c.width/10,h:.035,d:.47,yaw:Math.atan2(a.dx,a.dz),color:i%4===0||i%4===3?'#b2bec2':'#222536'});
    }
    const chevs=[-1,1].map(dir=>{
      const cn=canvas(128,64),g=cn.getContext('2d');g.fillStyle='#0b1424';g.fillRect(0,0,128,64);g.fillStyle='#6e899b';g.fillRect(0,0,128,2);g.fillRect(0,62,128,2);
      g.fillStyle=mint;for(let i=0;i<3;i++){let x=27+i*34;g.beginPath();g.moveTo(x-dir*14,9);g.lineTo(x-dir*2,9);g.lineTo(x+dir*14,31);g.lineTo(x-dir*2,54);g.lineTo(x-dir*14,54);g.lineTo(x+dir*2,31);g.fill();}
      return new T.MeshBasicMaterial({map:map(cn,false),side:T.DoubleSide,toneMapped:false});
    });
    if(c.id!=='indiana')for(let s=46;s<c.length-20;s+=38){const a=c.at(s),b=c.at(s+18),bend=a.dz*b.dx-a.dx*b.dz;if(Math.abs(bend)<.19)continue;
      const side=-Math.sign(bend),off=(c.width*.5+2.5)*side,x=a.x+a.dz*off,z=a.z-a.dx*off,y=c.ground(x,z),yaw=Math.atan2(a.dx,a.dz);
      const sign=new T.Mesh(new T.PlaneGeometry(3.45,1.42),chevs[bend>0?0:1]);sign.position.set(x,y+1.64,z);sign.rotation.y=yaw+Math.PI;world.add(sign);posts.push({x,y:y+.70,z,w:.14,h:1.4,d:.14,yaw,color:'#626b79'});
    }
    if(c.id==='indiana'){
      // Matching lanes see the same physical Christmas tree. The driving loop
      // advances its four lamp banks from the shared race countdown.
      const q=c.at(12,c.width*.57),y=c.ground(q.x,q.z),yaw=Math.atan2(q.dx,q.dz);
      parts.push({x:q.x,y:y+1.9,z:q.z,w:.13,h:3.8,d:.14,yaw,color:'#a1a7ad'},{x:q.x,y:y+3.7,z:q.z,w:1.20,h:2.17,d:.23,yaw,color:'#151f2d'});
      for(let i=0;i<4;i++)for(const u of [-.27,.27])lamp(q.x+q.dz*u-q.dx*.145,y+4.43-i*.46,q.z-q.dx*u-q.dz*.145,.30,.25,.05,yaw,bulbs[i]);
    }
    batch(world,unitBox,parts,matte);batch(world,poleGeo,poles,matte);batch(world,unitBox,posts,matte);batch(world,unitBox,lights,lit);reflections(world,c,patches);
    let last=-1;
    function setStartSignal(stage){stage=clamp(Math.round(stage),0,3);if(stage===last)return;last=stage;
      bulbs.forEach((m,i)=>m.color.set(i===3?(stage===0?'#76ffd0':'#173937'):(stage>0&&i<=3-stage?'#ffbe64':'#443349')));
    }
    setStartSignal(3);return setStartSignal;
  }
  function landmarks(world,c){
    const blocks=[],glints=[],cars=[],materials=new Map(),mat=new T.MeshStandardMaterial({roughness:.85});
    // Wreck shells remain separately crushable, but all matching paint and rubber
    // pieces share materials. The guide lights form one draw call per event.
    function carPaint(color){
      if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.81,metalness:.12}));
      return materials.get(color);
    }
    function local(p,u,v,y,w,h,d,color){return {x:p.x+p.dz*u+p.dx*v,y,z:p.z-p.dx*u+p.dz*v,w,h,d,yaw:Math.atan2(p.dx,p.dz),color};}
    function quadStripe(a,b,dx,dz){
      const pos=[];
      for(const [p,side] of [[a,-1],[a,1],[b,1],[b,-1]]){
        const x=p.x+dx*side,z=p.z+dz*side;pos.push(x,c.ground(x,z)+.23,z);
      }
      stripePositions.push(...pos.slice(0,9),...pos.slice(0,3),...pos.slice(6,12));
    }
    const stripePositions=[];
    if(c.id==='indiana'){
      for(const r of c.ramps)for(const side of [-1,1])for(let j=0;j<3;j++){
        const d=r.drop+1.4+j*2.15,u=side*4.8,p=local(r,u,d,0,1,1,1,'white'),group=new T.Group(),base=c.base(p.x,p.z)+.14;
        group.position.set(p.x,base,p.z);group.rotation.y=Math.atan2(r.dx,r.dz);world.add(group);const shade=['#639ba3','#a66e98','#5c77a2','#965878','#9b8965','#588181'][(j+(side+1)*1.5+r.s|0)%6];
        function piece(w,h,depth,x,y,z,col){const m=new T.Mesh(unitBox,carPaint(col));m.scale.set(w,h,depth);m.position.set(x,y,z);m.castShadow=true;group.add(m);}
        piece(4.4,.54,1.6,0,.52,0,shade);piece(2.1,.48,1.39,-.14,1.02,0,'#29374c');piece(2,.12,1.44,-.15,1.30,0,shade);for(const x of [-1.34,1.34])for(const z of [-.78,.78])piece(.65,.62,.18,x,.34,z,'#242322');
        cars.push({x:p.x,z:p.z,group,crushed:false});
      }
      for(let v=0;v<c.length;v+=12){const a=c.at(v);const b=c.at(v+4.8),dx=a.dz*.095,dz=-a.dx*.095;quadStripe(a,b,dx,dz);}
    }
    if(stripePositions.length){
      const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(stripePositions,3));
      world.add(new T.Mesh(geo,new T.MeshBasicMaterial({color:'#a5a8c2',side:T.DoubleSide})));
    }
    if(c.id==='arizona'){
      const r=c.ramps.find(v=>v.kind==='rail'),a=c.at(r.s+9);
      for(let u=-44;u<=44;u+=1.45){const p=local(a,u,0,0,1,1,1);blocks.push(local(a,u,0,c.base(p.x,p.z)+.21,.37,.23,3.4,'#524552'));}
      for(const z of [-1,1])for(let u=-45;u<45;u+=3){const p=local(a,u,z,0,1,1,1);blocks.push(local(a,u,z,c.base(p.x,p.z)+.43,3.05,.13,.14,'#8892a5'));}
      for(const u of [-25,27]){const p=local(a,u,0,0,1,1,1),y=c.base(p.x,p.z);blocks.push(local(a,u,0,y+1.1,11,1,3,'#3e4352'),local(a,u+.7,0,y+2.5,8.6,2,2.5,'#4e556f'),local(a,u-3.3,0,y+3.22,2.8,3.1,2.9,'#704a64'),local(a,u-3.3,-1.48,y+4.0,2,.66,.12,'#28394c'),local(a,u-3.3,0,y+4.9,3.3,.22,3.3,'#34384d'));glints.push(local(a,u-3.3,-1.56,y+4.02,1.7,.32,.06,'#88c2dc'),local(a,u+.7,-1.28,y+2.17,7.9,.09,.065,mint));for(const q of [-3.6,-2.2,2.2,3.6])blocks.push(local(a,u+q,0,y+.56,.92,1.0,2.64,'#303333'));}
    }
    if(c.id==='eight'){
      const r=c.ramps.find(v=>v.kind==='bridge');
      for(let v=-17;v<=0;v+=.82){const p=local(r,0,v,0,1,1,1);blocks.push(local(r,0,v,c.ground(p.x,p.z)+.11,10.7,.19,.77,'#847f86'));}
      for(const u of [-5.55,5.55])for(let v=-16;v<=0;v+=4){const p=local(r,u*.93,v,0,1,1,1),y=c.ground(p.x,p.z);blocks.push(local(r,u,v,y+.67,.22,1.45,.22,'#718193'));glints.push(local(r,u,v,y+1.35,.26,.20,.26,u>0?mint:pink));}
    }
    batch(world,unitBox,blocks,mat);batch(world,unitBox,glints,new T.MeshBasicMaterial({toneMapped:false}));return cars;
  }
  function build(c){
    const world=new T.Group(),fog=palettes[c.id].fog;
    world.add(terrainMesh(c),ribbon(c,c.loop?0:-24,c.loop?c.length:c.length+29,()=>0,c.width));
    if(c.id==='eight')world.add(ribbon(c,c.length*.688,c.length*.791,t=>-14*Math.sin(t*Math.PI)**1.4,10,true));
    const setStartSignal=gatesAndSigns(world,c),cars=landmarks(world,c);if(window.MTMScenery)MTMScenery.build(world,c.ground,c);
    const finishShow=MTMFinish.attach(world,c,board);return {world,finishShow,sky:MTMCelestial.build(c.id),cars,fog,setStartSignal};
  }
  return {build,canvas,map,rng};
})();
