/* The runoff and all show cues share finish-relative coordinates. Positive v
   points through the timing beam. Circuit runoffs peel away from the next lap. */
const MTMFinish=(()=>{
  const cache=new WeakMap(),tau=Math.PI*2;
  function venue(c){
    c=c.original||c;if(cache.has(c))return cache.get(c);
    const gate=c.gates.at(-1),side=c.loop?-1:0,cu=side*32,cv=59,faces=[],labels=[];
    function point(u,v,h=0){const x=gate.x+gate.dz*u+gate.dx*v,z=gate.z-gate.dx*u+gate.dz*v;return [x,c.ground(x,z)+h,z];}
    function face(coords,ink){faces.push({p:coords.map(q=>point(...q)),ink});}
    function ring(r,a){return [cu+r*Math.sin(a),cv+r*Math.cos(a)];}
    // Fine radial strips follow the same ground height sampled by the tires.
    for(let i=0;i<64;i++)for(let j=0;j<6;j++){
      const r=[0,7,15,23,29,30,32],a=i*tau/64,b=(i+1)*tau/64;
      face([ring(r[j],a),ring(r[j+1],a),ring(r[j+1],b),ring(r[j],b)].map(q=>[...q,.21]),j===4?(i%2?'#ead3ba':'#af4a63'):j===5?'#54566a':['#4d4b5a','#484958','#484958','#52515d'][j]);
    }
    const neck=v=>cu*Math.min(1,Math.max(0,(v-2)/49));
    for(let v=0;v<52;v+=2){const a=neck(v),b=neck(v+2),w=c.width*.53;
      face([[a-w,v,.24],[a+w,v,.24],[b+w,v+2,.24],[b-w,v+2,.24]],'#585461');
      if(v%8===0)for(const s of [-1,1])face([[a+s*(w-1),v,.29],[a+s*(w-.65),v,.29],[b+s*(w-.65),v+2,.29],[b+s*(w-1),v+2,.29]],'#ffcf78');
    }
    for(let row=0;row<3;row++)for(let i=0;i<18;i++){
      const w=c.width/18,u=(i-9)*w;face([[u,row*.67,.32],[u+w,row*.67,.32],[u+w,(row+1)*.67,.32],[u,(row+1)*.67,.32]],(row+i)%2?'#f4f0d9':'#222332');
    }
    // Scuffed turning circles, numbered parking bays and wheel stops set the scale.
    for(let i=0;i<52;i++)for(const gap of [0,1.65]){
      const a=i*.107+.8,b=a+.106,r=10+gap;
      face([ring(r,a),ring(r+.31,a),ring(r+.31,b),ring(r,b)].map(q=>[...q,.25]),'#383843');
    }
    for(let i=-4;i<=4;i++){
      const a=i*.195;face([ring(19,a),ring(19,a+.012),ring(27,a+.012),ring(27,a)].map(q=>[...q,.29]),'#d7d3b4');
      if(i<4)face([ring(26,a+.041),ring(26,a+.144),ring(26.65,a+.144),ring(26.65,a+.041)].map(q=>[...q,.38]),'#e7ae5e');
    }
    const colors=['#ff709d','#70eddf','#ffe28a','#af9aff','#79bbff'];
    const fans=[];
    for(let i=0;i<42;i++){const a=(i-20.5)*.089;
      for(let tier=0;tier<3;tier++){const r=34+tier*1.65,h=1+tier*.95;
        face([[...ring(r,a-.043),h],[...ring(r,a+.043),h],[...ring(r+1.6,a+.043),h],[...ring(r+1.6,a-.043),h]],'#687186');
        face([[...ring(r,a-.043),0],[...ring(r,a+.043),0],[...ring(r,a+.043),h],[...ring(r,a-.043),h]],'#364258');
        fans.push({q:point(...ring(r+.8,a),h),i:i*3+tier});
      }
    }
    ['CCVAULT • CLAIM YOUR LOST LAP','MUX • ALL LANES MERGE','2389 VICTORY MOTOR POOL','REVIEW-SQUAD • DENT APPROVED','CAUTION • LOAD BEARING APPLAUSE'].forEach((title,i)=>{
      const a=(i-2)*.69,r=42,p=point(...ring(r,a),7.7);labels.push({title,p,yaw:Math.atan2(gate.dx,gate.dz)+a+Math.PI});
      for(const end of [-.13,.13]){const q=ring(r,a+end);face([[q[0]-.22,q[1],0],[q[0]+.22,q[1],0],[q[0]+.22,q[1],8],[q[0]-.22,q[1],8]],'#768294');}
    });
    const hub=point(cu,cv),front=point(neck(12),12,7);
    const tour={id:'finish-plaza',kind:'finish',name:'Victory Motor Pool',crew:'2389 Research',ink:'#68ffe0',caption:'Run through the checks, park in the bowl, and look up for the 2389 drone salute.',s:c.length,x:hub[0],y:hub[1],z:hub[2],height:13,width:60,yaw:Math.atan2(-gate.dx,-gate.dz)};
    const v={gate,faces,labels,fans,colors,point,cu,cv,tour,front,hub};cache.set(c,v);return v;
  }
  // LED dots are drawn as triangles in both renderers, including software 3D.
  const digits=['111001111100111','111001111001111','111101111101111','111101111001111'];
  // A timed score is shared by the light and sound systems. Positions are
  // deterministic so a tour frame, a suspended tab and a replay agree.
  const period=24;
  const score=[
    [.12,-17,'peony'],[2.20,20,'ring'],[4.65,-28,'palm'],[5.02,26,'palm'],
    [7.12,0,'willow'],[10.1,-23,'split'],[11.0,20,'split'],[13.3,-8,'crackle'],
    [15.55,-30,'ring'],[15.98,0,'peony'],[16.41,30,'ring'],
    [18.7,-23,'palm'],[19.09,21,'crackle'],[19.78,0,'willow'],[20.46,-13,'peony']
  ];
  const stars={peony:52,ring:42,palm:11,willow:34,split:18,crackle:35};
  const palettes=[['#fff8d0','#ffe492','#f6ad49','#a45932'],['#fff7e9','#ffaa9f','#ff536a','#ab3549'],['#ecffff','#9ceee2','#3eb6be','#426179'],['#fff0ff','#dfa7ff','#a572ef','#644880'],['#f7fdff','#cef0ff','#6999ff','#44577a']];
  const rand=(i,seed)=>{const x=Math.sin(i*127.1+seed*311.7)*43758.5453;return x-Math.floor(x);};
  function pyrotechnics(v){
    if(v.shells)return v.shells;
    const routeSeed=v.tour.s*.019;
    v.shells=score.map(([time,offset,kind],i)=>{
      const seed=i*17+routeSeed,flight=1.05+rand(2,seed)*.52,height=24+rand(3,seed)*12+(kind==='willow'?4:0);
      const foot=v.point(v.cu+offset,v.cv+36+rand(4,seed)*12,1.3);
      const drift=(rand(5,seed)-.5)*5,wind=(rand(6,seed)-.5)*2.7;
      const origin=[foot[0]+drift,foot[1]+height,foot[2]+wind],count=stars[kind];
      const palette=palettes[kind==='willow'||kind==='palm'?0:(i+Math.floor(routeSeed))%palettes.length];
      const rays=Array.from({length:count},(_,k)=>{
        const a=k*2.399963+rand(9,seed),y=1-2*(k+.5)/count,r=Math.sqrt(1-y*y),angular=k*tau/count+.25;
        let dx=r*Math.cos(a),dy=y,dz=r*Math.sin(a);
        if(kind==='ring'){const tilt=.23+rand(12,seed)*.5;dx=Math.cos(angular);dy=Math.sin(angular)*Math.cos(tilt);dz=Math.sin(angular)*Math.sin(tilt);}
        if(kind==='palm'){dx=Math.cos(angular)*.79;dy=.35+rand(k+7,seed)*.53;dz=Math.sin(angular)*.79;}
        if(kind==='willow')dy=.32+.70*dy;
        const speed=(kind==='ring'?12:kind==='willow'?13:kind==='palm'?17:15)*(.89+.22*rand(k+21,seed));
        return {x:dx*speed,y:dy*speed,z:dz*speed,life:(kind==='willow'?3.65:kind==='palm'?2.9:2.12)*(.82+.31*rand(k+51,seed)),noise:rand(k+71,seed)};
      });
      return {time,flight,kind,seed,foot,origin,drift,wind,height,palette,rays};
    });
    return v.shells;
  }
  function comet(s,t){const f=Math.max(0,t/s.flight),u=f*(1.55-.55*f);
    return [s.foot[0]+s.drift*f,s.foot[1]+s.height*u,s.foot[2]+s.wind*f];}
  function star(s,r,t){
    // Exponential drag arrests the initial expansion; gravity subsequently
    // pulls longer-lived sparks down and the breeze carries them sideways.
    const q=(1-Math.exp(-.69*t))/.69;
    return [s.origin[0]+r.x*q+.47*t*t,s.origin[1]+r.y*q-2.42*t*t,s.origin[2]+r.z*q+s.wind*t*.25];
  }
  function fireworks(v,t,line,light){
    for(const s of pyrotechnics(v)){let age=t%period-s.time;if(age<0){if(t<period)continue;age+=period;}
      if(age>s.flight+4.25)continue;
      if(age<s.flight){const tip=comet(s,age);
        for(let k=0;k<4;k++)line(comet(s,Math.max(0,age-(k+1)*.048)),comet(s,Math.max(0,age-k*.048)),.07+.035*(3-k),palettes[0][k]);
        light(tip,.18,.32,'#fff5c5');continue;
      }
      const dt=age-s.flight;if(dt<.15){const radius=1.45*(1-dt/.15)+.12;light(s.origin,radius,radius*.8,'#fff0ce');}
      for(const [i,r] of s.rays.entries()){
        if(dt>=r.life)continue;
        const f=dt/r.life,pal=s.palette,head=star(s,r,dt);
        const tail=s.kind==='willow'?.94:s.kind==='palm'?.68:s.kind==='crackle'?.20:.31;
        const sections=s.kind==='palm'||s.kind==='willow'?4:2;
        for(let j=sections-1;j>=0;j--){
          const a=star(s,r,Math.max(0,dt-tail*(j+1)/sections)),b=star(s,r,Math.max(0,dt-tail*j/sections));
          const shade=Math.min(3,Math.floor(f*1.6+j*2.3/sections)+1);
          line(a,b,(s.kind==='palm'?.29:.20)*(1-.72*f)*(1-.55*j/sections),pal[shade]);
        }
        const sz=(s.kind==='palm'?.40:.34)*(1-.72*f);
        light(head,sz,sz*(s.kind==='willow'?1.6:1),pal[Math.min(3,Math.floor(3.7*f))]);
        // Crossettes separate into four short lateral tracks. Crackling stars
        // shed small irregular pinpricks just before their main color dies.
        if(s.kind==='split'&&dt>.8+r.noise*.23){const d=dt-.8-r.noise*.23;
          for(let j=0;j<4;j++){const a=j*tau/4+i;line(head,[head[0]+Math.cos(a)*d*3.8,head[1]+Math.sin(a)*d*3.8-.8*d*d,head[2]+d*Math.cos(i)],.085,pal[2]);}}
        if(s.kind==='crackle'&&f>.48&&Math.sin(dt*30+i*12.7)>.43){
          const phase=dt*7+r.noise*21;
          light([head[0]+Math.cos(phase)*.75,head[1]+Math.sin(phase)*.8,head[2]],.19,.21,'#ffe5ac');
        }
      }
    }
  }
  function soundCues(course,previous,time,listener,emit){
    if(time<=previous||time-previous>1)return;
    const v=venue(course),ear=listener?[listener.x,listener.y+1.8,listener.z]:v.front;
    // Enqueue at the visual event, then let Web Audio propagate the report.
    // Sampling the listener only at emission avoids double hits when driving.
    for(let loop=Math.max(0,Math.floor(previous/period)-1);loop<=Math.floor(time/period);loop++)
      for(const s of pyrotechnics(v))for(const lift of [true,false]){
        const when=loop*period+s.time+(lift?0:s.flight);
        if(when<=previous||when>time)continue;
        const pos=lift?s.foot:s.origin,distance=Math.hypot(pos[0]-ear[0],pos[1]-ear[1],pos[2]-ear[2]);
        emit({lift,kind:s.kind,seed:s.seed,rack:s.time,distance,delay:Math.max(0,distance/343-(time-when)),venue:course.id});
      }
  }
  function show(v,t,live,emit){
    const {point,cu,cv,colors}=v;
    function line(a,b,w,ink){
      // Face the finish approach and give horizontal sparks as much visible
      // width as vertical streaks. A fixed sideways offset collapses them.
      const lateral=(b[0]-a[0])*v.gate.dz-(b[2]-a[2])*v.gate.dx,up=b[1]-a[1];
      const inv=w/(Math.hypot(lateral,up)||1),dx=up*inv*v.gate.dz,dz=-up*inv*v.gate.dx,dy=-lateral*inv;
      emit([[a[0]-dx,a[1]-dy,a[2]-dz],[a[0]+dx,a[1]+dy,a[2]+dz],[b[0]+dx,b[1]+dy,b[2]+dz],[b[0]-dx,b[1]-dy,b[2]-dz]],ink);
    }
    function light(q,w,h,ink){emit([[q[0]-w,q[1],q[2]],[q[0],q[1]+h,q[2]],[q[0]+w,q[1],q[2]],[q[0],q[1]-h,q[2]]],ink);}
    for(const {q,i} of v.fans){const k=live?Math.max(0,Math.sin(t*5+i))* .58:0,y=q[1]+k;
      line([q[0],y,q[2]],[q[0],y+1.05,q[2]],.29,colors[i%5]);light([q[0],y+1.36,q[2]],.23,.29,'#dfaa87');
      if(live)line([q[0],y+.7,q[2]],[q[0]+.55*Math.sin(i+2*t),y+1.55,q[2]],.09,colors[i%5]);}
    if(!live)return;
    // The lighting desk trims the scanning beams during a shell break.
    const showClock=t%period,breakLight=pyrotechnics(v).some(s=>showClock-s.time-s.flight>=0&&showClock-s.time-s.flight<2.6);
    const beamInk=breakLight?['#a64576','#408f86','#b2a064','#78639f','#536e97']:colors;
    for(let i=0;i<6;i++){const a=i*tau/6;
      line(point(cu+33*Math.sin(a),cv+33*Math.cos(a),2),point(cu+28*Math.sin(a+t*.65),cv+23*Math.cos(a+t*.65),38+5*Math.sin(t+i)),breakLight?.065:.11,beamInk[i%5]);}
    fireworks(v,t,line,light);
    for(let n=0;n<4;n++)for(let j=0;j<15;j++)if(digits[n][j]==='1'){const k=n*15+j,a=k*.57+t*.3,f=(1-Math.cos(t*.47))*.5;
      const u=-(n*4+j%3-7.5)*1.65,vv=28-Math.floor(j/3)*1.65;
      light(point(cu+u*(1-f)+Math.cos(a)*14*f,cv+26,vv*(1-f)+(26+7*Math.sin(a))*f),.32,.38,colors[n]);}
  }
  function geometry(faces){const pos=[],col=[];for(const f of faces){const color=new THREE.Color(f.ink);for(const i of [0,1,2,0,2,3]){pos.push(...f.p[i]);col.push(color.r,color.g,color.b);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));return g;}
  function attach(world,c,board){const v=venue(c),mat=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide});
    world.add(new THREE.Mesh(geometry(v.faces),mat));
    for(const b of v.labels){const sign=new THREE.Mesh(new THREE.PlaneGeometry(19,2.45),new THREE.MeshBasicMaterial({map:board(b.title),side:THREE.DoubleSide}));sign.position.set(...b.p);sign.rotation.y=b.yaw;world.add(sign);}
    const people=[];show(v,0,false,(p,ink)=>people.push({p,ink}));const standing=new THREE.Mesh(geometry(people),mat);world.add(standing);
    // Both GPU and WASM retain these buffers. Collapse unused quads rather
    // than allocating a new geometry or software-renderer heap block per tick.
    const dyn=new THREE.BufferGeometry(),capacity=1900*6;
    const xyz=new THREE.Float32BufferAttribute(new Float32Array(capacity*3),3);
    const rgb=new THREE.Float32BufferAttribute(new Float32Array(capacity*3),3);
    dyn.setAttribute('position',xyz);dyn.setAttribute('color',rgb);dyn.userData.animatedPositions=true;dyn.userData.animatedColors=true;
    dyn.boundingSphere=new THREE.Sphere(new THREE.Vector3(...v.hub),125);
    const animated=new THREE.Mesh(dyn,mat),paint=new THREE.Color();world.add(animated);let frame=-1,previous=0;animated.visible=false;
    return (t,live)=>{animated.visible=live;standing.visible=!live;if(!live||Math.floor(t*20)===frame)return;frame=Math.floor(t*20);let used=0;
      show(v,t,true,(p,ink)=>{paint.set(ink);for(const i of [0,1,2,0,2,3]){xyz.setXYZ(used,...p[i]);rgb.setXYZ(used++,paint.r,paint.g,paint.b);}});
      if(used<previous)xyz.array.fill(0,used*3,previous*3);previous=used;xyz.needsUpdate=true;rgb.needsUpdate=true;dyn.setDrawRange(0,used);
    };
  }
  function reserved(c,x,z,r=0){
    const g=c.gates.at(-1),dx=x-g.x,dz=z-g.z,u=dx*g.dz-dz*g.dx,v=dx*g.dx+dz*g.dz,cu=c.loop?-32:0;
    return Math.hypot(u-cu,v-59)<34+r||(v>3-r&&v<55+r&&Math.abs(u-cu*Math.max(0,Math.min(1,(v-2)/49)))<c.width*.55+r);
  }
  return {venue,attach,show,reserved,soundCues};
})();
