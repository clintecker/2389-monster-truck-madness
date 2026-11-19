/* Six midway machines licensed from the 2389 project fair. Geometry, paint,
   and horn choreography share one set of forms across the three renderers. */
const MTMProjectFair=(()=>{
  'use strict';
  const T=THREE,TAU=Math.PI*2,ink='#152137',shadow='#273750',iron='#53667a',nickel='#a3b6bb',
    paper='#fff1cf',gold='#ffc458',pink='#ff639e',aqua='#6ff2dc',plum='#705692';
  const tags=new Map();
  function placard(title,sub,accent,theme){
    const key=[title,sub,accent,theme].join('|');if(tags.has(key))return tags.get(key);
    const c=document.createElement('canvas');c.width=768;c.height=sub?184:110;
    const g=c.getContext('2d'),h=c.height;
    g.fillStyle=theme||ink;g.fillRect(0,0,c.width,h);
    g.fillStyle=accent;g.fillRect(0,0,11,h);g.fillRect(0,0,c.width,5);g.fillRect(0,h-5,c.width,5);
    for(const x of [20,740]){g.fillStyle=nickel;g.fillRect(x,13,7,7);g.fillRect(x,h-20,7,7);}
    g.textAlign='center';g.textBaseline='middle';g.fillStyle=paper;
    g.font='900 italic '+(sub?90:78)+'px Display, Impact, sans-serif';g.fillText(title,384,sub?65:h/2+3,676);
    if(sub){g.fillStyle=accent;g.font='bold 35px Mono, monospace';g.fillText(sub,384,141,709);}
    const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;
    const material=new T.MeshBasicMaterial({map:texture,toneMapped:false});
    const tag={canvas:c,material};tags.set(key,tag);return tag;
  }
  // Groups turn around actual hinges. Both projection paths evaluate the same
  // absolute-time pose, including when a replay seeks backwards.
  function model(){
    const parts=[];
    function part(x=0,y=0,z=0,motion=null){
      const p={x,y,z,motion,forms:[]};parts.push(p);
      return {
        box(x,y,z,w,h,d,c,lit=false){p.forms.push({k:'box',x,y,z,w,h,d,c,lit});},
        oval(x,y,z,rx,ry,rz,c,lit=false){p.forms.push({k:'oval',x,y,z,rx,ry,rz,c,lit});},
        rod(x,y,z,u,v,w,r,c,lit=false){p.forms.push({k:'rod',x,y,z,u,v,w,r,c,lit});},
        poly(points,z,d,c,lit=false){p.forms.push({k:'poly',points,z,d,c,lit});},
        ring(x,y,z,r,th,c,lit=false){p.forms.push({k:'ring',x,y,z,r,th,c,lit});},
        sign(x,y,z,w,h,title,sub,c,theme){p.forms.push({k:'sign',x,y,z,w,h,title,sub,c,theme});}
      };
    }
    function build(parent,art){
      const actuators=[];
      for(const p of parts){
        const n=art.node(parent,p.x,p.y,p.z),b=art.builder(n);
        for(const f of p.forms){
          const pos=[f.x,f.y,f.z];
          if(f.k==='box')b.box(pos,[f.w,f.h,f.d],f.c,null,f.lit);
          else if(f.k==='oval')b.ball(pos,[f.rx,f.ry,f.rz],f.c,null,f.lit);
          else if(f.k==='rod')b.rod(pos,[f.u,f.v,f.w],f.r,f.r,f.c,f.lit,9);
          else if(f.k==='ring'){
            const geo=new T.TorusGeometry(f.r,f.th,6,32);b.add(geo,pos,[1,1,1],null,f.c,f.lit);geo.dispose();
          }else if(f.k==='poly'){
            const shape=new T.Shape(f.points.map(([x,y])=>new T.Vector2(x,y)));
            const geo=new T.ExtrudeGeometry(shape,{depth:f.d,bevelEnabled:false});
            b.add(geo,[0,0,f.z-f.d],[1,1,1],null,f.c,f.lit);geo.dispose();
          }else{
            const pic=placard(f.title,f.sub,f.c,f.theme),mesh=new T.Mesh(new T.PlaneGeometry(f.w,f.h),pic.material);
            mesh.position.set(f.x,f.y,f.z);n.add(mesh);
          }
        }
        b.finish();if(p.motion)actuators.push({p,n});
      }
      return (t,pulse=0)=>{for(const {p,n} of actuators){
        const [dx,dy,r]=p.motion(t,pulse);n.position.set(p.x+dx,p.y+dy,p.z);n.rotation.z=r;
      }};
    }
    // The fallback preserves lettering, unequal silhouettes, and moving parts
    // when the browser cannot initialize a mesh renderer.
    function draw(ctx,t,pulse=0){
      for(const p of parts){
        ctx.save();let dx=0,dy=0,r=0;if(p.motion)[dx,dy,r]=p.motion(t,pulse);
        ctx.translate(p.x+dx,p.y+dy);ctx.rotate(r);
        for(const f of p.forms){
          ctx.fillStyle=f.c||ink;ctx.strokeStyle=f.c||ink;ctx.lineCap='round';ctx.lineJoin='round';
          if(f.k==='box')ctx.fillRect(f.x-f.w/2,f.y-f.h/2,f.w,f.h);
          else if(f.k==='oval'){ctx.beginPath();ctx.ellipse(f.x,f.y,f.rx,f.ry,0,0,TAU);ctx.fill();}
          else if(f.k==='rod'){ctx.lineWidth=f.r*2;ctx.beginPath();ctx.moveTo(f.x,f.y);ctx.lineTo(f.u,f.v);ctx.stroke();}
          else if(f.k==='ring'){ctx.lineWidth=f.th*2;ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,TAU);ctx.stroke();}
          else if(f.k==='poly'){ctx.beginPath();for(const [i,xy] of f.points.entries())i?ctx.lineTo(...xy):ctx.moveTo(...xy);ctx.closePath();ctx.fill();}
          else{ctx.save();ctx.translate(f.x,f.y);ctx.scale(1,-1);ctx.drawImage(placard(f.title,f.sub,f.c,f.theme).canvas,-f.w/2,-f.h/2,f.w,f.h);ctx.restore();}
        }
        ctx.restore();
      }
    }
    return {part,build,draw};
  }
  function line(p,points,z,r,c,lit=false){
    for(let i=1;i<points.length;i++)p.rod(...points[i-1],z,...points[i],z,r,c,lit);
  }
  function foundation(p,w,accent,title,sub){
    for(const s of [-1,1]){
      p.box(s*w*.34,.28,0,1.3,.56,3.5,nickel);
      p.box(s*w*.34,1.3,-.6,.55,2.5,1,iron);
      p.rod(s*w*.42,.35,1,s*w*.27,2.6,-.5,.16,iron);
    }
    p.box(0,2.4,-.3,w,1.6,3.3,shadow);
    p.box(0,3.27,-.3,w+.14,.16,3.4,accent,true);
    p.sign(0,2.38,1.40,w-.18,1.76,title,sub,accent);
  }
  // Four differently costumed CRT jurors look up as the giant judge's gavel
  // drops. Their lenses and pupils sit in front of the carved cabinets.
  function tribunal(m){
    const b=m.part();foundation(b,11.8,gold,'REVIEW-SQUAD','OBJECTION JUNCTION');
    b.poly([[-5.45,3.35],[-4.7,5.1],[4.7,5.1],[5.45,3.35]],-.45,1.7,'#773e53');
    b.box(0,5.12,-.55,10.1,.26,2.3,gold);
    for(let i=0;i<4;i++){
      const x=-3.9+i*2.6,col=[pink,aqua,gold,'#bb91fc'][i];
      const j=m.part(x,6.25,.1,(t,h)=>[0,.10*Math.sin(t*2+i)+.72*h*(1-.12*i),.075*Math.sin(t*1.4+i*1.9)]);
      j.box(0,0,0,2.17,1.63,1.55,iron);j.box(0,0,.8,1.82,1.30,.14,col);
      j.box(0,.02,.91,1.56,.99,.14,ink);
      for(const eye of [-.4,.4]){j.oval(eye,.14,1.03,.22,.26,.12,paper,true);j.oval(eye+.04,.06,1.13,.095,.14,.045,ink);}
      if(i===0)j.poly([[-1,.81],[-.58,1.16],[0,1.38],[.58,1.16],[1,.81]],.45,.9,'#dfdbb8');
      if(i===1){j.box(0,.95,.22,1.47,.35,1.17,'#5088a3');j.box(.41,.81,.89,1.64,.14,.82,aqua);}
      if(i===2){j.ring(-.4,.14,1.17,.30,.07,gold,true);j.rod(-.71,.15,1.1,-.92,-.50,.85,.035,gold);}
      if(i===3)j.rod(-.75,.58,1.15,.76,.36,1.15,.10,pink);
    }
    // A sprung brass desk bell receives the hammer when the panel votes.
    b.rod(-2.51,5.10,-.9,-2.51,7.79,-.9,.15,iron);
    b.oval(-2.51,7.85,-.9,1.0,.42,.73,'#e49a43');
    for(const [i,title] of ['EXPERT','VISITOR','REGULAR','PEDANT'].entries())b.sign(-3.9+i*2.6,4.48,1.04,2.15,.58,title,'',paper);
    const arm=m.part(2.6,9.65,-.42,(t,h)=>[0,0,.12*Math.sin(1.35*t)+.43*h]);
    arm.rod(-.7,0,0,-5.2,.40,0,.35,'#a9684c');
    arm.rod(-5.2,-.9,0,-5.0,1.55,0,.82,'#a56968');
    for(const y of [-.73,1.30])arm.oval(-5.11,y,0,1.01,.27,.96,gold);
    arm.oval(0,0,0,.49,.49,.49,pink,true);
    b.rod(2.6,4.9,-1,2.6,9.7,-1,.26,nickel);b.oval(2.6,9.7,-1,.7,.7,.5,iron);
  }
  // A physically indexed dial turns in the door of a monumental archive safe.
  // The retrieved transcript pokes out from the slot with the driver's horn.
  function archive(m){
    const b=m.part();foundation(b,9.1,aqua,'CCVAULT','DEPARTMENT OF LOST CONTEXT');
    b.poly([[-4.2,3.35],[-4.2,9.75],[-3.65,10.5],[3.48,10.5],[4.2,9.76],[4.2,3.35]],.28,3.45,'#42716d');
    b.box(0,6.90,.52,7.65,6.0,.40,nickel);b.box(0,6.9,.81,7.15,5.55,.31,'#2d5b62');
    for(const x of [-3.2,3.2])for(const y of [4.52,9.25])b.oval(x,y,1,.16,.16,.12,gold,true);
    b.box(2.35,6.7,1.0,1.28,1.02,.21,ink);b.box(2.35,6.7,1.16,.84,.13,.10,aqua,true);
    b.oval(-.75,6.9,1.10,2.23,2.23,.40,ink);b.ring(-.75,6.9,1.40,2.1,.19,gold);
    const dial=m.part(-.75,6.9,1.48,(t,h)=>[0,0,t*.23+h*1.38]);
    for(let i=0;i<6;i++){
      const a=i*TAU/6,x=Math.cos(a),y=Math.sin(a);
      dial.rod(.26*x,.26*y,.05,1.63*x,1.63*y,.12,.19,nickel);
      dial.oval(1.69*x,1.69*y,.16,.29,.29,.19,aqua,true);
    }
    dial.oval(0,0,.22,.57,.57,.25,'#d59263');dial.oval(0,0,.43,.24,.24,.08,gold,true);
    const slip=m.part(1.5,9.85,-.44,(t,h)=>[0,.3+.25*Math.sin(t*1.45)+1.26*h,.055*Math.sin(t*1.35)]);
    slip.poly([[-1.36,0],[1.36,0],[1.36,2.42],[.88,2.9],[-1.36,2.9]],.12,.12,paper);
    for(let i=0;i<3;i++)slip.box(-.13,1.96-i*.42,.2,1.70-(i%2)*.45,.14,.06,i===1?'#568f81':ink);
    b.box(1.5,10.40,.10,3.25,.38,1.12,shadow);
    for(let i=0;i<3;i++){
      const y=5.92-i*.55;b.box(2.34,y,1.01,1.25,.35,.18,shadow);
      for(let j=0;j<3;j++)b.oval(1.98+j*.35,y,1.15,.086,.086,.057,i===j?gold:nickel,i===j);
    }
    for(let i=0;i<2;i++)b.box(-3.63,5.32+2.78*i,1,.75,.52,.82,'#c78f62');
    const key=m.part(-2.22,10.69,-1.0,(t,h)=>[0,0,.12*Math.sin(t*1.72)-.40*h]);
    key.ring(-.97,.55,.1,.58,.20,gold);key.rod(-.37,.54,.1,1.57,.54,.1,.15,gold);
    key.box(1.49,.26,.1,.24,.58,.31,gold);key.box(.94,.33,.1,.20,.39,.31,gold);
  }
  // The switchboard splits one plug into three agents. A lit packet travels
  // each branch while the rotary selector sweeps neighboring brass sockets.
  function switchboard(m){
    const b=m.part();foundation(b,12.3,pink,'MUX','SPAGHETTI INTERCHANGE');
    b.poly([[-5.85,3.32],[-5.58,8.7],[-4.3,10.0],[4.3,10],[5.58,8.7],[5.85,3.32]],.12,1.98,'#4d3b69');
    b.box(0,6.8,.33,10.2,5.35,.25,ink);
    const hues=[aqua,gold,pink],starts=[-3.75,0,3.75];
    // Exposed patch cords snake over each cheek of the cabinet.
    for(const s of [-1,1]){
      const cord=[[s*4.9,8.57],[s*5.35,8.16],[s*5.78,6.76],[s*5.78,5.02],[s*5.35,4.74],[s*4.95,5.3],[s*4.92,6.26]];
      line(b,cord,.55,.123,s<0?pink:gold);b.ring(s*4.92,6.36,.58,.21,.075,paper);
    }
    for(let j=0;j<5;j++)b.box(-1.36+j*.68,9.57,.60,.40,.18,.16,j===2?pink:iron,j===2);
    for(let i=0;i<3;i++){
      const x=starts[i],color=hues[i];
      const path=[[0,4.6],[x*.42,5.65],[x,6.45],[x,8.6]];
      line(b,path,.77,.23,iron);line(b,path,1.01,.12,color,true);
      b.ring(x,8.65,.91,.56,.14,color,true);b.oval(x,8.65,.76,.45,.45,.22,shadow);
      const packet=m.part(0,0,1.23,(t,h)=>{
        const v=((t*.43+i*.27+h*.31)%1+1)%1*3,j=Math.min(2,Math.floor(v)),u=v-j;
        return [path[j][0]*(1-u)+path[j+1][0]*u,path[j][1]*(1-u)+path[j+1][1]*u,0];
      });
      packet.oval(0,0,0,.21,.21,.15,paper,true);
      b.rod(x,9.54,-.5,x,10.52,-.5,.20,nickel);b.oval(x,10.68,-.5,.49,.49,.43,color,true);
    }
    const plug=m.part(0,4.6,1.35,(t,h)=>[0,0,.23*Math.sin(t*1.05)+.80*h]);
    plug.rod(0,0,0,-1.7,.25,.05,.25,'#8c4875');plug.box(-1.87,.28,.05,.95,.79,.62,pink);
    for(const y of [.08,.53])plug.box(-2.51,y,.05,.49,.16,.26,gold,true);
    b.oval(0,4.6,1.28,.49,.49,.37,gold);
  }
  // The cabinet houses a giant rust-colored lobster. The travelling claw
  // unfolds around one blinking terminal, like the real one-at-a-time prompt.
  function crabinet(m){
    const b=m.part();foundation(b,10.5,'#ff886b','SOLOCLAW','LICENSED TO PINCH');
    b.box(0,3.78,0,9.6,.78,3.1,'#9d4f53');
    for(const side of [-1,1]){
      b.box(side*4.45,7.24,-.6,.4,6.6,1.12,iron);
      b.box(side*4.43,7.24,.03,.13,6.42,.1,aqua,true);
    }
    b.box(0,10.52,-.55,9.7,.77,1.58,'#b85455');
    b.sign(0,10.53,.27,5.64,.67,'ALLOW ONCE','',gold);
    for(const s of [-1,1])for(let i=0;i<5;i++)b.box(s*4.45,4.52+i*1.19,.10,.22,.47,.10,'#ffd076',true);
    b.box(3.51,3.83,1.51,1.17,.63,.12,shadow);b.box(3.51,3.9,1.62,.68,.12,.06,gold,true);b.box(0,10.85,.20,9.5,.19,.28,gold,true);
    const motion=(t,h)=>[1.68*Math.sin(t*.67)*(1-.80*h),-.24*(1+Math.sin(t*1.34))-.78*h,0];
    const head=m.part(0,9.55,.23,motion);
    head.box(0,.73,-.12,1.63,.38,.9,nickel);head.rod(0,.63,0,0,-.30,0,.14,iron);
    head.oval(0,-.43,0,.86,.59,.63,'#e46555');
    for(const s of [-1,1]){
      line(head,[[s*.38,-.05],[s*.99,.43],[s*1.53,.52],[s*1.85,.40]],.04,.055,'#f6bb8a');
      for(let i=0;i<3;i++)line(head,[[s*.55,-.4-i*.17],[s*1.07,-.58-i*.18],[s*1.19,-.8-i*.12]],-.31,.055,'#ffb175');
    }
    for(const s of [-1,1]){
      head.rod(s*.37,-.12,.20,s*.69,.24,.21,.09,'#f58967');
      head.oval(s*.69,.26,.23,.18,.2,.18,paper);head.oval(s*.69,.29,.37,.074,.08,.065,ink);
      const jaw=m.part(0,9.55,.26,(t,h)=>{
        const [x,y]=motion(t,h);return [x+s*.53,y-.50,s*(.09*Math.sin(t*1.34)-.32*h)];
      });
      jaw.poly([[0,0],[s*.68,.04],[s*1.42,-.89],[s*1.28,-1.82],[s*.66,-2.48],[s*.79,-1.5],[s*.47,-1.21],[s*.34,-1.72],[s*.04,-1.08],[s*.5,-.72]],.30,.6,'#f07458');
    }
    const prize=m.part(0,4.78,.88,(t,h)=>[0,.07*Math.sin(t*2.5)+1.42*h,-.08*h]);
    prize.box(0,0,0,2.36,1.50,1.10,'#6b91a3');prize.box(0,0,.66,1.9,1.03,.19,ink);
    line(prize,[[-.57,.24],[-.27,0],[-.57,-.21]],.82,.074,aqua,true);prize.box(.29,-.22,.82,.50,.10,.10,aqua,true);
    for(const [x,col] of [[-3.35,gold],[-2.52,plum],[3.05,pink]])b.oval(x,4.42,.42,.67,.58,.64,col);
  }
  // Left: the typewriter. Right: a real five-node directed graph. The little
  // captive pinball traces actual edges and changes branches on the horn.
  function pinball(m){
    const b=m.part();foundation(b,12.45,aqua,'DOT VIEWER','GRAPHVIZ PINBALL PALACE');
    b.poly([[-5.8,3.4],[-5.45,9.22],[-4.70,10.08],[4.70,10.08],[5.45,9.22],[5.8,3.4]],.15,2.0,'#535b83');
    b.box(-2.86,6.9,.35,4.53,4.74,.35,'#172f48');b.box(2.54,6.90,.35,5.64,4.74,.35,ink);
    for(let i=0;i<7;i++){const x=-4.73+(i%3)*.3,y=8.64-i*.51;b.box(x+.53,y,.60,1.08,.13,.09,i%2?pink:aqua,true);b.box(x+1.62,y,.60,.62+(i%3)*.19,.13,.09,i%2?gold:nickel,true);}
    for(let i=0;i<8;i++)b.box(-4.71+i*.48,3.98,.87,.34,.26,.46,paper);
    b.box(-1.34,9.6,.72,.24,.24,.14,pink,true);
    const dots=[[2.48,8.72],[1.0,7.02],[4.05,7.02],[2.48,5.15],[4.6,5.20]];
    for(const [i,j] of [[0,1],[0,2],[1,3],[2,3],[2,4]]){
      const [x,y]=dots[i],[u,v]=dots[j];b.rod(x,y,.76,u,v,.76,.075,aqua,true);
      const dx=u-x,dy=v-y,d=Math.hypot(dx,dy),nx=dx/d,ny=dy/d,k=.58,px=x+dx*k,py=y+dy*k;
      b.poly([[px+.19*nx,py+.19*ny],[px-.14*nx+.15*ny,py-.14*ny-.15*nx],[px-.14*nx-.15*ny,py-.14*ny+.15*nx]],.90,.10,paper,true);
    }
    for(let i=0;i<dots.length;i++){const [x,y]=dots[i];b.oval(x,y,.85,.38,.32,.22,i===0?pink:i>2?gold:aqua,true);b.oval(x,y,1.02,.19,.14,.09,ink);}
    // The return chute loops outside the diagram, carrying the ball from
    // either drain back to the head while keeping directional arrows legible.
    const home=[[4.96,4.86],[5.12,8.76],[4.84,9.19],[2.87,9.19],dots[0]];
    for(const index of [3,4])line(b,[dots[index],...home],.66,.045,'#c69490');
    const paths=[[dots[0],dots[1],dots[3],...home],[dots[0],dots[2],dots[4],...home]];
    const ball=m.part(0,0,1.23,(t,h)=>{
      const seq=paths[h>.18?1:0],v=((t*.27)%1+1)%1*(seq.length-1),i=Math.min(seq.length-2,Math.floor(v)),k=v-i;
      const a=seq[i],b=seq[i+1];
      return [a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,0];
    });
    ball.oval(0,0,0,.23,.23,.23,paper,true);
    const lever=m.part(5.18,4.6,.85,(t,h)=>[0,0,.07*Math.sin(t*2.25)-.33*h]);
    lever.rod(0,0,0,.71,1.95,0,.16,nickel);lever.oval(.71,2.04,0,.34,.34,.34,pink,true);
  }
  // A tin racing greyhound runs on two rollers and hands its output to the
  // checkered test gate. Four articulated legs use opposing gallop phases.
  function greyhound(m){
    const b=m.part();foundation(b,12.38,gold,'SPEED-RUN','TURBO GREYHOUND TRIALS');
    for(const x of [-3.35,2.3]){
      b.oval(x,4.30,.05,1.05,1.05,.76,iron);b.ring(x,4.30,.82,.81,.13,gold,true);
      const w=m.part(x,4.30,.86,(t,h)=>[0,0,-2.1*t-h*1.8]);
      for(let i=0;i<4;i++){const a=i*Math.PI/2;w.rod(0,0,0,Math.cos(a)*.7,Math.sin(a)*.7,0,.075,paper);}
    }
    b.box(-.55,5.17,-.1,7.95,.30,1.85,shadow);
    for(let j=0;j<4;j++){
      const sx=j<2?-1.94:.76,s=(j%2?1:-1);
      const leg=m.part(sx,7.37,j%2?.54:-.62,(t,h)=>[0,.13*Math.sin(3.3*t),s*.64*Math.sin(t*3.3+(j<2?0:1.8))-.12*h]);
      const col=j%2?paper:nickel;
      line(leg,[[0,0],[s*.8,-.9],[-s*.7,-1.65],[-s*1.04,-1.83]],.05,.17,col);
      leg.oval(s*.8,-.9,.04,.23,.23,.25,j%2?gold:iron);
    }
    const dog=m.part(0,0,.10,(t,h)=>[.19*h,.13*Math.sin(3.3*t)+.30*h,-.035*h]);
    dog.poly([[-2.55,7.73],[-2.0,8.23],[-.9,8.06],[.45,8.34],[1.16,8.85],[1.62,9.33],[1.66,9.98],[2.20,9.49],[2.74,9.5],[3.12,9.22],[4.06,9.01],[4.17,8.73],[3.01,8.66],[2.28,8.43],[1.34,7.29],[.61,7.10],[-.24,7.51],[-1,7.43],[-1.86,6.9],[-2.39,7.01]],.56,1.42,'#efa25e');
    dog.poly([[-1.8,7.76],[-.47,8.08],[.79,8.04],[.42,7.57],[-1.15,7.39]],.61,.10,'#e04e81');
    dog.oval(2.62,9.14,.64,.12,.12,.06,ink);dog.oval(4.10,8.88,.56,.14,.14,.14,ink);
    line(dog,[[-2.26,7.65],[-3.34,7.96],[-4.38,8.68],[-4.92,8.60]],.1,.13,paper);
    for(let i=0;i<3;i++)b.rod(-4.92,7.42-i*.41,-.35,-3.23-i*.34,7.42-i*.41,-.35,.075,i===0?gold:nickel,true);
    b.box(5.31,7.18,-.67,.34,7.74,.49,iron);
    const flag=m.part(5.31,10.99,-.53,(t,h)=>[0,0,.085*Math.sin(t*2.4)+.61*h]);
    for(let j=0;j<3;j++)for(let i=0;i<4;i++)flag.box(-.24-i*.46,.23+j*.44,.09,.46,.44,.14,(i+j)%2?shadow:paper);
  }

  const exhibits=[
    ['review-squad','review-squad','Objection Junction','arizona',.142,29,'Harper',gold,12.3,12.2,tribunal,'Four reviewer panels bring different perspectives to a release. Today all four have objections to the gavel.','Three approvals. One pedant objects to the spelling of HONNNK.','bell'],
    ['ccvault','ccvault','Department of Lost Context','arizona',.677,-29,'Ivan',aqua,10.25,14.8,archive,'ccvault makes Claude Code conversations searchable. This vault accepts queries about where you parked.','Found one matching transcript. It also asks where you parked.','copier'],
    ['mux','Mux','Spaghetti Interchange','eight',.208,27,'Dylan',pink,13,11.5,switchboard,'Mux routes agents to models and tools. The operator has patched your horn through three separate noodles.','All three operators have approved the same honk.','bleep'],
    ['soloclaw','Soloclaw','Licensed to Pinch','eight',.646,-28,'Sugi','#ff886b',11,11.4,crabinet,'One standalone terminal agent, one conversation, one very large claw. Prize retrieval requires permission.','ALLOW ONCE. The lobster has briefly acquired a terminal.','coin'],
    ['dot-viewer','Dot Viewer','Graphviz Pinball Palace','indiana',.348,-31,'Sophie',aqua,14.3,10.5,pinball,'Dot Viewer pairs Graphviz source with its live diagram. The pinball follows the edges you type.','New edge rendered. The pinball has filed a change of address.','bell'],
    ['speed-run','Speed-Run','Turbo Greyhound Trials','indiana',.806,32,'Clint',gold,13,12.6,greyhound,'Speed-Run pairs fast code generation with planning and tests. The tin greyhound handles the fast part.','Code delivered. The finish line has passed its tests.','cheer']
  ];
  return exhibits.map(([slug,projectName,name,region,f,off,crew,accent,width,height,create,caption,reply,sound])=>{
    const m=model();create(m);
    return {id:'project-'+slug,kind:'project',region,f,off,name,projectName,crew,ink:accent,width,height,
      radius:width*.53,footprintRadius:width*.53,url:'https://2389.ai/research/products/'+slug+'/',
      caption,reply,sound,build:m.build,draw:m.draw};
  });
})();
