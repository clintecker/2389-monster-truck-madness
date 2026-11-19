/* Kinetic airshow floats. Models are broadside to local +Z, origin beneath
   the float. Animation is a pure function of course time and horn response. */
const MTMParadeArt=(()=>{
  'use strict';
  const T=THREE,turn=Math.PI*2,pi=Math.PI,meshCache=new Map(),decalCache=new Map();
  const night='#182038',shadow='#32415b',iron='#607389',silver='#a9c7cc',cream='#fff1ce';
  const mint='#72ffdb',ice='#9beaff',pink='#ff629e',gold='#ffd063',orange='#fd9256',purple='#ad86ff';
  const pulse=v=>Math.max(0,Math.min(1,v||0));
  function geo(key,create){if(!meshCache.has(key))meshCache.set(key,create());return meshCache.get(key);}
  function egg(b,at,radii,color,glow=false,size=1,rot=null){
    const n=[7,10,15][size],h=[4,5,7][size];
    b.add(geo('egg'+size,()=>new T.SphereGeometry(1,n,h)),at,radii,rot,color,glow);
  }
  function cut(b,id,points,at,depth,color,glow=false,rot=null){
    const shape=geo('cut'+id,()=>{
      const path=new T.Shape(points.map(([x,y])=>new T.Vector2(x,y)));
      const g=new T.ExtrudeGeometry(path,{depth:1,bevelEnabled:false,curveSegments:1});
      g.translate(0,0,-.5);return g;
    });
    b.add(shape,at,[1,1,depth],rot,color,glow);
  }
  function ring(b,at,r,thick,color,glow=false,rot=null,sides=16,scale=[1,1,1]){
    const g=geo('ring'+[r,thick,sides],()=>new T.TorusGeometry(r,thick,4,sides));
    b.add(g,at,scale,rot,color,glow);
  }
  function surface(b,key,profile,at,color,scale=[1,1,1],sides=16,rot=null){
    const g=geo('skin'+key,()=>new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),sides));
    b.add(g,at,scale,rot,color);
  }
  function bars(b,pts,r,color,glow=false){for(let i=1;i<pts.length;i++)b.rod(pts[i-1],pts[i],r,r,color,glow,5);}
  function coin(b,x,y,z,r,depth,color,glow=false,n=10){
    b.rod([x,y,z-depth*.5],[x,y,z+depth*.5],r,r,color,glow,n);
  }
  // Flush medallions do not need a second face or a hidden cylinder wall.
  function badge(b,x,y,z,r,color,glow,n=10,back=false){
    const g=geo('badge'+n,()=>new T.CircleGeometry(1,n));
    b.add(g,[x,y,z],[r,r,1],back?[0,pi,0]:null,color,glow);
  }
  function decal(root,art,title,subtitle,x,y,z,w,h,accent){
    // Float instances share type artwork and its GPU allocation on every route.
    if(!decalCache.has(title)){
      const template=new T.Group();
      art.label(template,title,subtitle,w,h,0,0,accent);
      decalCache.set(title,template.children[0]);
    }
    const m=decalCache.get(title).clone();m.position.set(x,y,z);root.add(m);
  }

  // Flat front elevations use the same metres and moving joint angles as the meshes.
  const {paint} = MTMKit, poly = paint.poly, oval = paint.oval, rect = paint.rect;
  const line = (c,pts,fill,width) => paint.stroke(c,pts,fill,width);
  function loop(c,x,y,rx,ry,ink,width){c.strokeStyle=ink;c.lineWidth=width;c.beginPath();c.ellipse(x,y,rx,ry,0,0,turn);c.stroke();}
  function glyph(c,text,x,y,w,h,ink){c.save();c.translate(x,y);c.scale(1,-1);c.fillStyle=ink;c.font='900 italic '+h+'px Display, Impact, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(text,0,0,w);c.restore();}
  function plate(c,text,x,y,w,h,ink){rect(c,x-w*.5,y-h*.5,w,h,night);rect(c,x-w*.5,y+h*.39,w,h*.11,ink);glyph(c,text,x,y-.015,w*.94,h*.79,cream);}

  // A flying dinner plate collects the booth, table and ketchup in one tractor beam.
  function platePose(t,p){p=pulse(p);return {lift:.32+.32*Math.sin(t*.95)+1.65*p,swing:.12*Math.sin(t*.82)-.28*p,scan:(t*.48+.37*p)%1};}
  function bluePlate(root,a){
    const b=a.builder(root);
    surface(b,'plateHull',[[.1,-1.15],[4.3,-1.1],[8.9,-.57],[10.9,.14],[10.25,.52],[5.8,1.0],[.1,1]], [0,9,0],n=>n.y<-.4?'#465886':'#d5d5cb',[1,1,.73],18);
    surface(b,'plateRail',[[10.26,.01],[10.99,.44],[10.85,.55],[10,.6]],[0,8.78,0],mint,[1,1,.73],18);
    egg(b,[0,10.1,0],[5.6,.94,4],cream,false,2);
    egg(b,[.8,10.56,.22],[2.95,1.52,2.50],'#ffbc45',false,1);
    for(let j=0;j<10;j++){
      const angle=j*turn/10,x=9.9*Math.cos(angle),z=7.0*Math.sin(angle);
      b.box([x,9.04,z],[.65,.35,.4],j%3===0?pink:ice,[0,-angle,0],true);
    }
    for(const s of [-1,1])for(const z of [-1,1])
      b.rod([s*2.7,7.96,z*1.67],[s*4.12,.92,z*2.35],.072,.045,ice,true,5);
    b.finish();decal(root,a,'BLUE PLATE','IVAN / TABLE FOR UFO',0,8.89,7.83,6.3,1.14,mint);
    const booth=a.node(root),bb=a.builder(booth);
    bb.box([0,.33,0],[7.05,.46,3.1],'#4d626c');
    for(const s of [-1,1]){
      bb.box([s*2.68,1.02,-.18],[1.67,.44,2.53],'#c8465b');
      bb.box([s*3.29,1.66,-.18],[.37,1.42,2.59],'#fa7580',[0,0,-s*.13]);
      bb.box([s*3.30,2.20,-.18],[.40,.11,2.67],cream);
      bb.rod([s*2.64,.55,-.2],[s*2.64,.91,-.2],.27,.30,iron,false,6);
    }
    bb.rod([0,.50,-.03],[0,1.54,-.03],.14,.17,silver,false,7);
    bb.box([0,1.63,-.05],[3.32,.18,2.12],cream);
    for(let i=0;i<5;i++)bb.box([(i-2)*.62,1.64,1.03],[.31,.19,.09],night);
    bb.rod([.50,1.74,.17],[.50,2.24,.17],.16,.12,'#ee5a56',false,7);
    bb.rod([.50,2.24,.17],[.50,2.37,.17],.09,.06,cream,false,7);
    bb.finish();
    const scan=a.node(root),sb=a.builder(scan);
    ring(sb,[0,0,0],3.76,.066,mint,true,[pi/2,0,0],15,[1,.68,1]);sb.finish();
    return (t,p)=>{const q=platePose(t,p);booth.position.y=q.lift;booth.rotation.y=q.swing;scan.position.y=1.05+q.scan*6.20;scan.scale.setScalar(1.05-.29*q.scan);};
  }
  function drawBlue(c,t,p){
    const q=platePose(t,p);
    for(const s of [-1,1])line(c,[[s*2.7,8.04],[s*4.12,.92]],ice,.11);
    loop(c,0,1.05+q.scan*6.2,4-.95*q.scan,.48,mint,.12);
    c.save();c.translate(0,q.lift);c.scale(1-.12*Math.abs(q.swing),1);
    rect(c,-3.53,.10,7.06,.45,iron);
    for(const s of [-1,1]){rect(c,s*2.68-.83,.80,1.66,.46,'#cb405c');line(c,[[s*3.20,1],[s*3.38,2.27]],'#ff8290',.42);rect(c,s*2.62-.15,.48,.3,.37,silver);}
    rect(c,-.13,.49,.26,1.11,silver);rect(c,-1.66,1.55,3.32,.18,cream);rect(c,.36,1.74,.27,.57,'#d94a4a');c.restore();
    poly(c,[[-10.9,9.16],[-8.9,8.42],[-4.3,7.88],[4.3,7.88],[8.9,8.42],[10.9,9.16],[7.9,9.76],[-7.9,9.76]],'#78889e');
    oval(c,0,9.32,10.88,.95,'#d9dbd1');line(c,[[-10.65,9.14],[-7.7,8.78],[0,8.53],[7.7,8.78],[10.65,9.14]],mint,.20);
    oval(c,0,10.03,5.64,.96,cream);oval(c,.75,10.65,2.92,1.48,'#ffb841');oval(c,1.23,11.2,1.10,.32,'#ffe48d');
    for(let j=0;j<7;j++)oval(c,-9.4+j*3.13,9.15,.23,.13,j%2?ice:pink);
    plate(c,'BLUE PLATE',0,8.83,6.33,1.04,mint);
  }

  // The flukes, postman's cap and slung mail sack must read in silhouette.
  const whaleFluke=[[-.1,.07],[-1.6,1.9],[-3.0,2.35],[-5.0,2.08],[-3.68,1.22],[-2.9,.06],[-4.52,-1.85],[-2.57,-1.62],[-1.03,-.55]];
  const whaleFin=[[-1.75,.47],[-.84,.60],[.83,.24],[2.18,-1.77],[2.23,-2.17],[1.03,-1.81],[-1.25,-.91]];
  function whalePose(t,p){p=pulse(p);return {tail:.16*Math.cos(t*1.47)-.37*p,gush:.18+.57*(.5+.5*Math.cos(t*1.55))**2+.46*p,bag:.12*Math.sin(t*.76)+.12*p};}
  function whale(root,a){
    const b=a.builder(root);
    surface(b,'whaleBody',[[.15,-7.45],[.81,-6.7],[1.89,-5.4],[2.74,-3.25],[3.06,-.3],[3.12,2.95],[2.72,5.33],[2.13,6.85],[1.30,7.72],[.22,8.24]],
      [0,6.4,0],(p,n)=>p.x>1.55?'#b2cad2':n.x<-.65?'#5470a1':'#748bbc',[1,1,.95],14,[0,0,-pi/2]);
    for(const s of [-1,1]){
      cut(b,'whaleFin',whaleFin,[-.15,5.54,s*2.53],.50,'#4a608f',false,[s*.42,0,.14]);
      egg(b,[5.58,7.03,s*2.44],[.44,.44,.13],night,true,0);
      egg(b,[5.72,7.14,s*2.54],[.13,.13,.055],cream,true,0);
      bars(b,[[5.55,5.70,s*2.34],[6.46,5.62,s*1.94],[7.57,5.86,s*1.12]],.072,'#38445e');
    }
    egg(b,[4.50,8.94,0],[2.41,.46,1.95],night,false,1);
    egg(b,[4.14,9.19,-.12],[1.64,.64,1.43],'#455b86',false,1);
    b.box([5.66,8.97,.53],[1.21,.13,2.40],gold,[0,0,.07]);
    b.rod([.2,3.52,-.28],[-2.15,1.94,-.28],.10,.10,silver,false,6);
    b.rod([1.8,3.64,-.28],[2.23,1.94,-.28],.10,.10,silver,false,6);b.finish();
    const tail=a.node(root,-7.15,6.42,0),tb=a.builder(tail);cut(tb,'whaleFluke',whaleFluke,[0,0,0],.95,'#829ac9',false,[-.24,0,0]);tb.finish();
    const bag=a.node(root,0,1.61,0),mb=a.builder(bag);
    mb.box([0,-.45,0],[5.25,1.80,2.47],'#bc7866');mb.box([0,.48,0],[5.4,.22,2.61],cream);
    for(let i=0;i<6;i++)mb.box([-2.28+i*.90,.43,1.34],[.36,.28,.03],i%2?'#5785ad':'#e2666e',[0,0,-.35]);
    mb.box([.16,.90,-.2],[2.6,.99,.29],cream,[0,.13,-.13]);mb.box([-1.12,.75,-.39],[1.6,.92,.23],'#f2c78b',[0,-.08,.21]);
    mb.finish();decal(bag,a,'WHALE MAIL','HARPER / RETURN TO SEA LEVEL',0,-.47,1.25,4.5,.90,gold);
    const spout=a.node(root,-1.15,9.20,0),sp=a.builder(spout);
    for(const s of [-1,1]){
      bars(sp,[[0,.02,0],[s*.24,1.32,0],[s*.94,2.38,.03],[s*1.78,2.65,.07],[s*2.25,2.27,.08]],.16,ice,true);
      egg(sp,[s*2.57,1.85,.08],[.22,.37,.23],ice,true,0,[0,0,s*.39]);
    }sp.finish();
    return (t,p)=>{const v=whalePose(t,p);tail.rotation.z=v.tail;spout.scale.set(1,v.gush,1);bag.rotation.z=v.bag;};
  }
  function drawWhale(c,t,p){
    const q=whalePose(t,p);c.save();c.translate(-7.15,6.42);c.rotate(q.tail);poly(c,whaleFluke,'#829ac9');c.restore();
    line(c,[[.2,3.6],[-2.14,1.93]],silver,.14);line(c,[[1.8,3.64],[2.24,1.93]],silver,.14);
    c.save();c.translate(0,1.61);c.rotate(q.bag);rect(c,-2.64,-1.35,5.28,1.80,'#b97b6c');rect(c,-2.64,.37,5.28,.22,cream);poly(c,[[-1.8,.61],[1.55,.61],[1.4,1.29],[-1.9,1.51]],cream);plate(c,'WHALE MAIL',0,-.44,4.64,.90,gold);c.restore();
    poly(c,[[-7.51,6.50],[-6.7,7.45],[-5.35,8.32],[-3.2,9.10],[.2,9.51],[3,9.55],[5.42,9.18],[6.95,8.43],[7.84,7.57],[8.22,6.39],[7.53,5.10],[6.37,4.34],[4.81,3.66],[2.95,3.25],[-.3,3.34],[-3.2,3.75],[-5.30,4.47],[-6.82,5.61]],'#748bbc');
    poly(c,[[-4.7,4.84],[-1.2,4.30],[1.6,4.34],[4.43,4.62],[7.87,6.31],[7.54,5.10],[6.37,4.34],[4.81,3.66],[2.95,3.25],[-.3,3.34],[-3.2,3.75]],'#aec9d4');
    c.save();c.translate(-.15,5.54);poly(c,whaleFin,'#465e91');c.restore();
    oval(c,5.58,7.04,.44,.44,night);oval(c,5.72,7.14,.13,.13,cream);line(c,[[5.54,5.67],[6.45,5.61],[7.58,5.88]],night,.10);
    oval(c,4.53,8.98,2.40,.46,night);oval(c,4.14,9.20,1.69,.67,'#496093');rect(c,5,8.97,1.3,.12,gold);
    c.save();c.translate(-1.15,9.20);c.scale(1,q.gush);for(const s of [-1,1]){line(c,[[0,0],[s*.24,1.32],[s*.94,2.38],[s*1.78,2.65],[s*2.25,2.27]],ice,.29);oval(c,s*2.57,1.85,.23,.37,ice);}c.restore();
  }

  // The magnetic hotel's only vacant room is permanently attached to its key.
  function arcBand(cx,cy,outer,inner,steps){const out=[];for(let i=0;i<=steps;i++){const t=i*pi/steps;out.push([cx+outer*Math.cos(t),cy+outer*Math.sin(t)]);}for(let i=steps;i>=0;i--){const t=i*pi/steps;out.push([cx+inner*Math.cos(t),cy+inner*Math.sin(t)]);}return out;}
  const magnetArc=arcBand(0,6.60,5.52,3.36,12),tag=[[-1.95,0],[0,1.31],[1.97,0],[0,-1.31]];
  function magnetPose(t,p){p=pulse(p);return {keyY:3.24+.23*Math.sin(t*1.47)+1.11*p,tilt:.12*Math.sin(t*1.73)-.22*p,field:1.0+.09*Math.sin(t*3)+.11*p};}
  function vacancy(root,a){
    const b=a.builder(root);cut(b,'hotelArc',magnetArc,[0,0,0],2.50,'#e16d76');
    for(const s of [-1,1]){
      b.box([s*4.44,6.24,0],[2.15,1.40,2.50],'#e16d76');
      b.box([s*4.44,5.23,0],[2.18,1.05,2.58],s<0?ice:silver);
      b.box([s*4.44,5.82,0],[2.20,.23,2.59],cream);
      const fin=[[s*5.2,6.00],[s*8.1,7.84],[s*8.46,8.37],[s*5.03,7.71]];
      cut(b,'magnetFin'+s,fin,[0,0,-.34],.28,shadow);
      bars(b,[[s*5.07,7.68,.03],[s*8.24,8.30,.03]],.09,s<0?mint:pink,true);
      coin(b,s*4.40,6.38,1.30,.28,.09,s<0?mint:pink,true,8);
    }
    for(let j=0;j<7;j++){const t=(j+1)*pi/8,x=4.43*Math.cos(t),y=6.60+4.43*Math.sin(t);b.box([x,y,1.30],[.23,.66,.11],j%2?cream:gold,[0,0,t-pi/2],true);}
    b.box([0,11.81,1.10],[5.54,1.18,.68],night);b.finish();
    decal(root,a,'VACANCY','SOON / ATTRACTIVE RATES',0,11.81,1.47,5.3,1.01,mint);
    const key=a.node(root),kb=a.builder(key);
    ring(kb,[-3.11,0,0],.95,.27,gold,false,null,16);
    kb.box([.23,.02,0],[4.92,.51,.50],gold);kb.box([2.25,-.36,0],[.58,.91,.50],gold);kb.box([1.23,-.23,0],[.46,.65,.52],gold);
    kb.rod([-3.71,-.72,.04],[-4.2,-1.03,.05],.085,.085,silver,false,5);
    cut(kb,'hotelTag',tag,[-5.63,-.96,.05],.20,'#3c9eaa');coin(kb,-4.37,-.92,.19,.11,.06,cream,true,6);
    kb.finish();decal(key,a,'2389','MOTOR LODGE',-5.63,-1.00,.16,1.82,.67,gold);
    const field=a.node(root,0,4.55,0),fb=a.builder(field);
    for(const s of [-1,1])bars(fb,[[s*4.40,0,0],[s*4.28,-.36,.02],[s*3.85,-.69,.02],[s*3.88,-1.10,.05]],.085,s<0?ice:pink,true);
    fb.finish();return (t,p)=>{const v=magnetPose(t,p);key.position.y=v.keyY;key.rotation.z=v.tilt;field.scale.y=v.field;};
  }
  function drawVacancy(c,t,p){
    const q=magnetPose(t,p);
    for(const s of [-1,1]){poly(c,[[s*5.2,6],[s*8.1,7.84],[s*8.46,8.37],[s*5.03,7.71]],shadow);line(c,[[s*5.07,7.68],[s*8.24,8.3]],s<0?mint:pink,.18);}
    poly(c,magnetArc,'#e16d76');for(const s of [-1,1]){rect(c,s*4.44-1.07,5.55,2.14,1.3,'#e16d76');rect(c,s*4.44-1.09,4.71,2.18,1.05,s<0?ice:silver);rect(c,s*4.44-1.1,5.71,2.2,.22,cream);
      line(c,[[s*4.4,4.55],[s*4.25,4.55-.36*q.field],[s*3.84,4.55-.69*q.field],[s*3.88,4.55-1.10*q.field]],s<0?ice:pink,.15);}
    for(let j=1;j<=7;j++){const a=j*pi/8;line(c,[[4.14*Math.cos(a),6.6+4.14*Math.sin(a)],[4.73*Math.cos(a),6.6+4.73*Math.sin(a)]],cream,.18);}
    plate(c,'VACANCY',0,11.81,5.3,1.04,mint);c.save();c.translate(0,q.keyY);c.rotate(q.tilt);
    loop(c,-3.11,0,.95,.95,gold,.45);rect(c,-2.24,-.24,4.89,.5,gold);rect(c,2.0,-.81,.55,.7,gold);rect(c,1.0,-.53,.46,.56,gold);
    line(c,[[-3.7,-.7],[-4.18,-1.04]],silver,.15);c.translate(-5.63,-.96);poly(c,tag,'#389ea9');glyph(c,'2389',0,0,2.12,.76,cream);c.restore();
  }

  // One read-only disk, five entirely unnecessary Ethernet tails.
  const diskFace=[[-5.62,7.0],[4.63,7.0],[5.60,7.92],[5.60,15.28],[4.85,15.98],[-5.38,15.98],[-5.62,15.74]];
  const wireColor=[mint,'#a2cbff',pink,'#c3a3ff',gold];
  function wirePath(i){
    const length=[4.63,5.48,6.11,5.31,4.66][i],bend=(i-2)*.39+(i%2?.18:-.19);
    return [[0,0,0],[bend*.48,-length*.31,.14],[bend*.94+(i%2?.29:-.26),-length*.59,.22],[bend*.54,-length*.80,.12],[bend,-length,0]];
  }
  function cableAngle(t,p,i){return .105*Math.sin(t*1.52+i*.81)+(i-2)*(.034+.184*pulse(p));}
  function floppy(root,a){
    const b=a.builder(root);
    cut(b,'jellyDisk',diskFace,[0,0,0],1.52,'#746db3');cut(b,'jellyDiskInset',diskFace,[0,0,.66],.24,'#8d86d0');
    b.box([-.12,13.72,.87],[6.73,4.21,.21],'#48577c');
    b.box([-.06,13.83,.994],[5.97,3.92,.09],silver);
    b.box([.81,14.14,1.08],[1.10,2.74,.08],night);
    for(let k=0;k<3;k++)b.box([-2.45+k*.26,13.46,1.069],[.075,2.61,.045],'#8ea9b6');
    b.box([0,9.30,.89],[8.64,3.58,.17],cream);b.box([0,10.83,1.0],[8.63,.55,.045],pink);
    b.box([-4.68,7.95,.89],[.75,.50,.13],night);b.box([4.70,7.95,.89],[.75,.50,.13],night);
    for(const s of [-1,1])b.box([s*4.61,14.92,.85],[.23,1.21,.10],mint,null,true);
    b.finish();decal(root,a,'FLOPPY JELLY','DYLAN / 1.44 MEGABITES',0,9.39,1.0,7.97,1.90,purple);
    const wires=[];
    for(let i=0;i<5;i++){
      const joint=a.node(root,(i-2)*2.03,7.06,-.05),w=a.builder(joint),points=wirePath(i),end=points[4];
      bars(w,points,.135,wireColor[i],true);
      w.box([end[0],end[1]-.04,.03],[.73,.69,.49],'#728da4',null,true);
      w.box([end[0],end[1]-.49,.04],[.61,.42,.40],'#bfdece',null,true);
      for(let j=0;j<3;j++)w.box([end[0]+(j-1)*.14,end[1]-.44,.257],[.062,.23,.03],gold,null,true);
      w.finish();wires.push(joint);
    }
    return (t,p)=>{for(let i=0;i<wires.length;i++){wires[i].rotation.z=cableAngle(t,p,i);wires[i].rotation.x=.078*Math.cos(t*.96+i);}};
  }
  function drawFloppy(c,t,p){
    for(let i=0;i<5;i++){
      const pts=wirePath(i).map(([x,y])=>[x,y]),[x,y]=pts[4];c.save();c.translate((i-2)*2.03,7.06);c.rotate(cableAngle(t,p,i));
      line(c,pts,wireColor[i],.29);rect(c,x-.37,y-.38,.74,.69,'#829ab0');rect(c,x-.31,y-.71,.62,.42,'#d2ecd9');
      for(let k=-1;k<2;k++)rect(c,x+k*.15-.035,y-.57,.07,.25,gold);c.restore();
    }
    poly(c,diskFace,'#8a83c9');line(c,[[-5.48,15.80],[-5.48,7.22],[4.63,7.22],[5.48,7.98]],'#625b94',.21);
    rect(c,-3.47,11.60,6.70,4.15,'#455378');rect(c,-3.09,11.88,5.95,3.90,silver);rect(c,.26,12.78,1.1,2.73,night);
    for(let j=0;j<3;j++)rect(c,-2.45+j*.26,12.14,.07,2.61,'#809cab');rect(c,-4.33,7.53,8.66,3.56,cream);rect(c,-4.33,10.56,8.66,.55,pink);
    for(const s of [-1,1]){rect(c,s*4.7-.37,7.70,.74,.51,night);rect(c,s*4.61-.11,14.29,.22,1.2,mint);}
    plate(c,'FLOPPY JELLY',0,9.35,7.94,1.78,purple);
  }

  // This airborne watering can tends the garden hanging from its own rigging.
  function pourPose(t,p){p=pulse(p);return -.075-.072*Math.cos(t*.79)-.20*p;}
  function dripPhase(t,i,p){return (t*.66+i*.31+.24*pulse(p))%1;}
  const canSide=[[-4.86,-2.15],[1.50,-2.15],[2.18,1.80],[-5.36,1.80]];
  function rain(root,a){
    const garden=a.builder(root);
    for(const s of [-1,1])garden.rod([s*3.11,8.55,-.73],[3.22+s*3.22,1.2,-.48],.098,.098,silver,false,6);
    garden.box([3.22,.64,-.12],[7.40,1.02,2.06],'#a76f59');garden.box([3.22,1.18,-.12],[7.66,.20,2.23],cream);
    for(let j=0;j<5;j++)garden.box([.42+j*1.41,.62,.929],[.98,.45,.065],j%2?'#bb8152':'#bd9365');
    const blooms=[];
    for(const [i,x] of [1.12,3.30,5.29].entries()){
      const y=2.76+(i%2)*.48;
      garden.rod([x,1.25,0],[x+.12,y,0],.117,.09,'#508e73',false,6);
      egg(garden,[x-.22,1.99,.05],[.58,.18,.21],mint,false,0,[0,0,-.45]);
      const flower=a.node(root,x+.12,y,.06),f=a.builder(flower),col=[pink,cream,gold][i];
      const petal=geo('petal',()=>new T.SphereGeometry(1,6,3));
      for(let j=0;j<5;j++){const ang=j*turn/5;f.add(petal,[.49*Math.cos(ang),.49*Math.sin(ang),.01],[.40,.31,.17],[0,0,ang],col,true);}
      coin(f,0,0,.20,.26,.17,'#ffbc54',true,8);f.finish();blooms.push(flower);
    }garden.finish();
    const can=a.node(root,0,9.63,0),b=a.builder(can);
    surface(b,'canBody',[[.20,-2.27],[2.83,-2.23],[3.36,-.91],[3.60,1.88],[3.13,1.98],[2.97,1.65]],[-1.60,0,0],'#57a99f',[1,1,.73],14);
    b.rod([-1.60,1.78,0],[-1.60,2.04,0],2.7,2.95,shadow,false,14);
    ring(b,[-1.60,1.95,0],3.42,.17,mint,true,[pi/2,0,0],16,[1,.73,1]);
    b.rod([.4,-.95,-.04],[5.14,2.04,-.05],1.07,.48,'#599d92',false,10);
    b.rod([5.06,1.98,-.05],[6.08,2.24,-.04],.49,.61,iron,false,9);
    b.rod([6.05,2.23,-.04],[6.92,1.65,0],.63,1.03,silver,false,10);
    b.rod([6.89,1.68,0],[7.03,1.57,0],1.03,.99,mint,true,10);
    const handle=[[-4.59,1.03,0],[-5.56,1.43,0],[-6.7,1.24,0],[-7.34,.55,0],[-7.30,-.49,0],[-6.58,-1.19,0],[-5.53,-1.48,0],[-4.22,-1.21,0]];
    bars(b,handle,.25,'#a7dacc');
    b.box([-1.62,-.22,2.42],[5.08,1.28,.24],night);b.finish();
    decal(can,a,'RAIN CHECK','ERYAN / BILLABLE WEATHER',-1.62,-.22,2.58,4.88,1.08,gold);
    const drops=[];
    for(let i=0;i<3;i++){const node=a.node(root),d=a.builder(node);egg(d,[0,0,0],[.25,.43,.22],ice,true,0);d.finish();drops.push(node);}
    return (t,p)=>{
      const angle=pourPose(t,p);can.rotation.z=angle;
      const startX=7.07*Math.cos(angle)-1.51*Math.sin(angle),startY=9.63+7.07*Math.sin(angle)+1.51*Math.cos(angle);
      for(let i=0;i<3;i++){
        const f=dripPhase(t,i,p);
        drops[i].position.set(startX+(5.25-startX)*f,startY+(3.11-startY)*f*f,.16);
        drops[i].scale.setScalar(Math.max(.025,Math.sin(f*pi))*(1+.22*pulse(p)));
        blooms[i].rotation.z=.14*Math.sin(t*1.31+i)+pulse(p)*(.78+i*.12);
      }
    };
  }
  function drawRain(c,t,p){
    const a=pourPose(t,p),sx=7.07*Math.cos(a)-1.51*Math.sin(a),sy=9.63+7.07*Math.sin(a)+1.51*Math.cos(a);
    for(const s of [-1,1])line(c,[[s*3.11,8.55],[3.22+s*3.22,1.20]],silver,.14);
    rect(c,-.48,.13,7.4,1.03,'#b0795d');rect(c,-.60,1.08,7.64,.22,cream);
    for(const [i,x] of [1.12,3.30,5.29].entries()){
      const y=2.76+i%2*.48;line(c,[[x,1.25],[x+.12,y]],'#4e947e',.22);oval(c,x-.22,1.99,.58,.18,mint,-.45);
      c.save();c.translate(x+.12,y);c.rotate(.14*Math.sin(t*1.31+i)+pulse(p)*(.78+i*.12));for(let j=0;j<5;j++)oval(c,.49*Math.cos(j*turn/5),.49*Math.sin(j*turn/5),.40,.31,[pink,cream,gold][i],j*turn/5);oval(c,0,0,.26,.25,'#ffbb53');c.restore();
      const f=dripPhase(t,i,p),sc=Math.max(.025,Math.sin(f*pi))*(1+.22*pulse(p));oval(c,sx+(5.25-sx)*f,sy+(3.11-sy)*f*f,.24*sc,.40*sc,ice);
    }
    c.save();c.translate(0,9.63);c.rotate(a);
    line(c,[[-4.59,1.03],[-5.56,1.43],[-6.7,1.24],[-7.34,.55],[-7.30,-.49],[-6.58,-1.19],[-5.53,-1.48],[-4.22,-1.21]],'#afded0',.43);
    poly(c,[[.42,-1.85],[5.55,1.68],[5.16,2.54],[.43,.09]],'#64a89c');poly(c,[[4.99,1.94],[6.01,2.77],[7.50,2.03],[6.73,1.14]],silver);line(c,[[6.75,1.11],[7.52,2.06]],mint,.29);
    poly(c,canSide,'#58a59c');oval(c,-1.60,1.82,3.59,.40,mint);oval(c,-1.60,1.86,3.08,.25,shadow);plate(c,'RAIN CHECK',-1.62,-.2,4.9,1.08,gold);c.restore();
  }

  // A swivelling office chair travels beneath a scalloped cocktail umbrella.
  function parasol(b){
    const positions=[],normals=[],swatches=[];
    const ribs=12,apex=[0,15.23,0];
    function addTri(a,c,d,color){
      const v=new T.Vector3(...c).sub(new T.Vector3(...a)),w=new T.Vector3(...d).sub(new T.Vector3(...a)),n=v.cross(w).normalize();
      positions.push(...a,...c,...d);for(let k=0;k<3;k++){normals.push(n.x,n.y,n.z);swatches.push(color);}
    }
    const at=(i,r,y)=>[Math.cos(i*turn/ribs)*r,y,Math.sin(i*turn/ribs)*r*.83];
    for(let j=0;j<ribs;j++){
      const col=['#fa7489','#fff0c6','#5e829d'][j%3],rimA=at(j,7.95,12.34),rimB=at(j+1,7.95,12.34);
      const midA=at(j,4.81,14.29),midB=at(j+1,4.81,14.29),hanging=at(j+.5,7.72,11.73);
      addTri(apex,midB,midA,col);addTri(midA,midB,rimA,col);addTri(midB,rimB,rimA,col);
      addTri(rimA,rimB,hanging,j%3===1?'#efbd91':j%3===2?'#49718d':'#d35375');
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));
    let index=0;b.add(g,[0,0,0],[1,1,1],null,()=>swatches[index++],false);g.dispose();
  }
  function chairAngles(t,p){p=pulse(p);return {tilt:.072*Math.sin(t*1.06)+p*.17,turn:.26*Math.sin(t*.72)-p*.80};}
  function chairlift(root,a){
    const b=a.builder(root);parasol(b);
    b.rod([0,10.03,0],[0,15.52,0],.14,.10,'#bd976e',false,8);
    egg(b,[0,15.45,0],[.35,.30,.35],gold,true,0);
    for(let j=0;j<6;j++){const ang=j*turn/6;bars(b,[[0,13.5,0],[2.40*Math.cos(ang),13.79,2.01*Math.sin(ang)],[7.93*Math.cos(ang),12.31,6.58*Math.sin(ang)]],.072,silver);}
    b.finish();
    const swing=a.node(root,0,10.12,0),se=a.builder(swing);
    for(const s of [-1,1])se.rod([0,0,.08],[s*1.36,-1.89,.05],.099,.099,gold,false,6);
    se.box([0,-5.95,.25],[5.1,.83,3.83],'#578b92');
    se.box([0,-5.48,.23],[5.24,.43,3.94],'#90c9bf');
    se.box([0,-3.90,-1.43],[5.13,3.58,.99],'#528489',[-.12,0,0]);
    se.box([0,-3.89,-.90],[4.72,2.95,.39],'#86bdba',[-.12,0,0]);
    for(const s of [-1,1]){
      se.rod([s*2.27,-5.66,.2],[s*2.70,-4.36,.1],.16,.14,silver,false,8);
      se.box([s*2.70,-4.28,.02],[.72,.32,2.77],'#3a6370');
      coin(se,s*1.12,-3.68,-.614,.16,.06,'#537b80',false,7);
    }
    se.rod([0,-8.43,.06],[0,-6.21,.06],.28,.28,silver,false,9);
    for(let i=0;i<5;i++){
      const an=(i+.1)*turn/5,x=2.67*Math.sin(an),z=2.67*Math.cos(an);
      se.rod([0,-8.19,0],[x,-8.73,z],.21,.18,iron,false,6);
      coin(se,x,-9.00,z,.39,.43,night,false,9);
      coin(se,x,-9.00,z+.24,.17,.09,mint,true,6);
    }
    se.box([0,-6.20,2.03],[3.91,.91,.24],night);se.finish();
    decal(swing,a,'OUT OF OFFICE','SUGI / IN TRANSIT',0,-6.20,2.18,3.73,.79,pink);
    return (t,p)=>{const q=chairAngles(t,p);swing.rotation.set(.028*Math.cos(t*.86),q.turn,q.tilt,'YXZ');};
  }
  function drawChair(c,t,p){
    const q=chairAngles(t,p);c.save();c.translate(0,10.12);c.rotate(q.tilt);c.scale(1-.13*Math.abs(q.turn),1);
    for(const s of [-1,1])line(c,[[0,0],[s*1.36,-1.89]],gold,.17);
    rect(c,-.25,-8.48,.5,2.40,silver);
    for(const x of [-2.50,-.8,1.5,2.6]){line(c,[[0,-8.18],[x,-8.74]],iron,.32);oval(c,x,-9,.39,.39,night);oval(c,x,-9,.17,.17,mint);}
    rect(c,-2.57,-5.68,5.14,3.58,'#54898a');rect(c,-2.33,-5.34,4.66,2.91,'#87bfbb');rect(c,-2.6,-6.36,5.2,.92,'#60999b');
    for(const s of [-1,1]){line(c,[[s*2.22,-5.67],[s*2.7,-4.36]],silver,.28);rect(c,s*2.7-.37,-4.44,.74,.32,'#366473');oval(c,s*1.12,-3.68,.15,.15,'#587d83');}
    plate(c,'OUT OF OFFICE',0,-6.2,3.88,.78,pink);c.restore();line(c,[[0,10.08],[0,15.31]],'#c6ae84',.21);
    const rim=[[-7.95,12.34],[-6.85,12.21],[-3.99,12.09],[0,12.02],[3.99,12.09],[6.85,12.21],[7.95,12.34]],cols=['#62829b','#ffe7bd','#f27189','#62829b','#ffe7bd','#f27189'];
    for(let j=0;j<6;j++){
      const a=rim[j],b=rim[j+1],center=(a[0]+b[0])*.5;
      poly(c,[[0,15.23],[a[0]*.64,14.22],a,[center,11.72],b,[b[0]*.64,14.22]],cols[j]);
      line(c,[[0,15.23],[a[0]*.64,14.22],a],'#ddd6b5',.065);
    }
    oval(c,0,15.45,.33,.30,gold);
  }

  // A duck-shaped steam engine tows two duckling tenders on an invisible railway.
  function trainMotion(t,p,i){return .09*Math.sin(t*1.75-i*.83)+pulse(p)*(.48+i*.15);}
  function trussWheel(b,x,y,r,z,accent){
    coin(b,x,y,0,r,z*2,night,false,9);
    for(const s of [-1,1])badge(b,x,y,s*(z+.07),r*.57,accent,true,8,s<0);
  }
  function duckTender(root,a,x,shade){
    const n=a.node(root,x,0,-.06),b=a.builder(n);
    b.box([0,2.03,0],[5.5,.65,2.68],'#884654');
    b.box([0,2.46,0],[5.24,.40,2.68],cream);
    trussWheel(b,-1.59,1.33,.80,1.19,gold);trussWheel(b,1.67,1.33,.80,1.19,gold);
    egg(b,[-.35,3.31,0],[1.93,1.14,1.24],shade,false,1);
    egg(b,[.83,4.01,-.01],[1.05,1.17,.94],shade,false,0);
    egg(b,[1.87,3.94,.04],[.68,.23,.70],orange,false,0);
    for(const s of [-1,1])coin(b,1.11,4.26,s*.78,.127,.055,night,true,6);
    const tail=[[-1.25,3.50],[-2.47,4.56],[-2.30,3.43],[-1.83,2.97]];
    cut(b,'ducklingTail',tail,[0,0,0],.58,shade);
    b.finish();return n;
  }
  function quack(root,a){
    const b=a.builder(root);
    b.box([5.12,2.25,.02],[9.14,1.14,3.46],'#a34e63');b.box([5.12,2.78,.02],[9.33,.22,3.56],cream);
    for(let j=0;j<3;j++)trussWheel(b,2.11+j*2.93,1.50,.98,1.64,silver);
    egg(b,[6.21,3.98,-.02],[2.45,1.42,1.45],'#f4bd46',false,1);
    egg(b,[8.48,4.98,-.02],[1.48,1.59,1.36],gold,false,1);
    egg(b,[9.94,4.83,.01],[1.20,.35,1.06],orange,false,0);
    for(const s of [-1,1])coin(b,8.83,5.30,s*1.21,.22,.075,night,true,7);
    b.box([3.03,4.13,-.02],[2.27,2.67,2.70],'#49727b');
    for(const s of [-1,1])b.box([3.02,4.46,s*1.37],[1.43,1.06,.085],ice,null,true);
    b.box([3.02,5.58,0],[2.88,.30,3.14],'#456477');
    b.rod([6.18,5.09,-.11],[6.18,6.45,-.11],.51,.56,shadow,false,9);
    b.rod([6.18,6.33,-.11],[6.18,6.74,-.11],.56,.87,'#cf797b',false,9);
    for(const s of [-1,1])bars(b,[[s*.10+8.71,2.69,s*1.46],[10.49,1.13,s*1.6],[9.16,1.14,s*1.6]],.16,'#8b97a5',false);
    for(const x of [-7.11,-.41])b.box([x,2.10,0],[2.06,.18,.30],silver);
    b.finish();decal(root,a,'QUACK LOCAL','EDEN / FLAG STOP',5.22,2.23,1.78,4.83,.81,ice);
    const tenders=[duckTender(root,a,-3.63,'#f8d571'),duckTender(root,a,-10.44,'#ffcb50')];
    const vapor=a.node(root,6.18,6.70,-.14),s=a.builder(vapor);
    egg(s,[-.40,.64,-.02],[.58,.52,.49],cream,false,0);
    egg(s,[-1.20,1.30,-.03],[.76,.57,.55],'#d2e8de',false,0);
    egg(s,[-2.29,1.72,-.02],[.90,.56,.66],'#b6cfd3',false,0);s.finish();
    return (t,p)=>{for(let i=0;i<tenders.length;i++){tenders[i].position.y=trainMotion(t,p,i);tenders[i].rotation.z=.025*Math.sin(t*1.36+i)+.052*pulse(p);}
      const k=.78+.23*Math.sin(t*2.18)+.34*pulse(p);vapor.scale.set(k,1.1*k,k);vapor.rotation.z=.14*Math.sin(t*1.44);};
  }
  function drawQuack(c,t,p){
    for(let i=1;i>=0;i--){
      c.save();c.translate(i?-10.44:-3.63,trainMotion(t,p,i));c.rotate(.025*Math.sin(t*1.36+i)+.052*pulse(p));
      for(const x of [-1.59,1.67]){oval(c,x,1.33,.80,.8,night);oval(c,x,1.33,.45,.45,gold);}
      rect(c,-2.76,1.70,5.52,.66,'#8c4656');rect(c,-2.62,2.27,5.24,.38,cream);
      const col=i?'#ffcb50':'#f8d571';
      poly(c,[[-1.24,3.5],[-2.47,4.56],[-2.30,3.43],[-1.83,2.97]],col);oval(c,-.35,3.31,1.93,1.14,col);oval(c,.83,4.01,1.05,1.17,col);
      oval(c,1.86,3.94,.69,.23,orange);oval(c,1.11,4.26,.13,.13,night);c.restore();
    }
    for(const x of [-7.11,-.41])rect(c,x-1.03,2.01,2.06,.16,silver);
    for(let j=0;j<3;j++){const x=2.11+j*2.93;oval(c,x,1.50,.98,.98,night);oval(c,x,1.50,.55,.55,silver);}
    rect(c,.55,1.70,9.14,1.13,'#a14c62');rect(c,.46,2.68,9.32,.21,cream);oval(c,6.21,3.98,2.45,1.42,'#f4bd46');oval(c,8.48,4.98,1.48,1.59,gold);oval(c,9.94,4.83,1.21,.35,orange);oval(c,8.83,5.3,.22,.22,night);
    rect(c,1.90,2.81,2.27,2.66,'#51767e');rect(c,2.31,3.93,1.43,1.06,ice);rect(c,1.58,5.43,2.88,.30,shadow);
    poly(c,[[5.67,5.08],[6.69,5.08],[6.72,6.34],[7.05,6.72],[5.31,6.72],[5.63,6.34]],shadow);
    line(c,[[8.71,2.69],[10.49,1.13],[9.16,1.14]],silver,.23);plate(c,'QUACK LOCAL',5.22,2.23,4.83,.81,ice);
    c.save();c.translate(6.18,6.70);c.rotate(.14*Math.sin(t*1.44));const k=.78+.23*Math.sin(t*2.18)+.34*pulse(p);c.scale(k,k*1.1);
    oval(c,-.4,.64,.58,.52,cream);oval(c,-1.20,1.30,.76,.57,'#d2e8de');oval(c,-2.29,1.72,.90,.56,'#b6cfd3');c.restore();
  }

  // A battered sausage flies on a popsicle stick and wears the fair's first prize.
  const bread=[[.10,-7.70],[.95,-7.37],[1.75,-6.64],[2.01,-5.70],[2.16,-2.70],[2.21,.9],[2.16,3.61],[1.96,5.32],[1.48,6.47],[.85,7.14],[.12,7.45]];
  const zigzag=[[-6.03,7.89,1.75],[-4.94,8.56,1.91],[-3.75,7.72,2.01],[-2.60,8.62,2.06],[-1.44,7.74,2.14],[-.31,8.64,2.13],[.87,7.74,2.19],[2.05,8.58,2.09],[3.24,7.73,2.06],[4.35,8.45,1.97],[5.49,7.76,1.68]];
  const crumbSpots=[[-5.68,6.81,1.12],[-4.55,8.89,1.64],[-3.77,6.69,1.56],[-2.34,9.27,1.51],[-1.15,6.52,1.37],[.06,9.41,1.57],[1.11,6.58,1.37],[2.64,9.21,1.71],[3.70,6.63,1.41],[4.96,8.92,1.55],[5.69,6.96,1.19]];
  function cornPose(t,p){p=pulse(p);return {ribbon:.12*Math.sin(t*1.55)-.41*p,fan:t*2.16+p*1.78};}
  function airCorn(root,a){
    const b=a.builder(root);
    b.box([-8.65,8.02,0],[6.55,.55,1.24],'#d5a778');
    surface(b,'cornCrust',bread,[0,8.02,0],(v,n)=>n.x>.53?'#d58e47':n.x<-.6?'#ffc061':'#ecaa54',[1,1,1],14,[0,0,-pi/2]);
    egg(b,[6.93,8.01,0],[1.54,1.01,1.02],'#e47b64',false,1);
    bars(b,zigzag,.225,'#ffe251',true);
    for(const [i,spot] of crumbSpots.entries())b.box(spot,[.34+(i%3)*.04,.18,.21],i%2?'#d99351':'#facc71',[0,0,i%2?.32:-.33]);
    // The cabin, in landing-gear colors, is slung on four braced rods.
    for(const x of [-2.15,2.13])for(const z of [-.71,.71])b.rod([x*1.62,6.05,z],[x,2.52,z*1.27],.12,.11,'#93b9bd',false,6);
    b.box([0,2.08,0],[5.30,1.38,2.47],'#3a7081');b.box([0,2.88,0],[5.45,.24,2.58],cream);
    for(const s of [-1,1])b.box([0,2.15,s*1.27],[3.97,.53,.09],ice,null,true);
    b.finish();decal(root,a,'AIR CORN ONE','MINT / COUNTY AIR FLEET',0,1.61,1.30,4.84,.70,gold);
    const ribbon=a.node(root,-6.62,6.95,1.33),r=a.builder(ribbon);
    const tail=[[-.52,-.55],[.55,-.57],[.47,-2.93],[.04,-2.39],[-.50,-2.91]];
    cut(r,'cornRibbon',tail,[-.47,-.05,0],.18,'#4d78bd',false,[0,0,-.22]);
    cut(r,'cornRibbon',tail,[.49,-.05,0],.18,'#6d95da',false,[0,0,.22]);
    const star=[];for(let i=0;i<24;i++){const r=i%2?1.10:1.45;star.push([Math.cos(i*turn/24)*r,Math.sin(i*turn/24)*r]);}
    cut(r,'cornRosette',star,[0,0,0],.30,'#597ac2');
    coin(r,0,0,.23,1.04,.15,gold,true,16);coin(r,0,0,.36,.81,.10,'#5e7dc5',false,14);
    bars(r,[[-.19,.26,.46],[.06,.40,.46],[.06,-.39,.46]],.105,cream,true);r.finish();
    const fan=a.node(root,-11.91,8.03,0),f=a.builder(fan);
    for(const s of [-1,1])f.box([0,s*1.04,0],[.25,1.70,.36],'#719eac',[s*.13,0,0]);
    f.rod([-.38,0,0],[.24,0,0],.28,.30,shadow,false,8);f.finish();
    return (t,p)=>{const v=cornPose(t,p);ribbon.rotation.z=v.ribbon;fan.rotation.x=v.fan;};
  }
  function drawCorn(c,t,p){
    const q=cornPose(t,p);for(const x of [-2.15,2.13])line(c,[[x*1.62,6.05],[x,2.50]],silver,.18);
    rect(c,-2.65,1.39,5.30,1.39,'#46788a');rect(c,-2.73,2.77,5.46,.24,cream);rect(c,-1.99,1.91,3.98,.51,ice);plate(c,'AIR CORN ONE',0,1.61,4.84,.70,gold);
    rect(c,-11.93,7.74,6.55,.56,'#d5a778');line(c,[[-11.92,8.03-1.84*Math.cos(q.fan)],[-11.92,8.03+1.84*Math.cos(q.fan)]],'#8bbcc5',.31);
    oval(c,6.93,8.01,1.54,1.01,'#db755f');
    const top=bread.map(([r,x])=>[x,8.02+r]),base=bread.slice().reverse().map(([r,x])=>[x,8.02-r]);poly(c,top.concat(base),'#eaaa53');
    for(const [i,[x,y]] of crumbSpots.entries()){c.save();c.translate(x,y);c.rotate(i%2?.32:-.33);rect(c,-.18,-.09,.36,.18,i%2?'#c48243':'#facd77');c.restore();}
    line(c,zigzag.map(([x,y])=>[x,y]),'#ffe251',.44);
    c.save();c.translate(-6.62,6.95);c.rotate(q.ribbon);
    poly(c,[[-1.06,-.66],[-.04,-.68],[-.79,-3.05],[-1.01,-2.41],[-1.39,-2.65]],'#4d78bd');poly(c,[[.03,-.66],[1.06,-.65],[1.40,-2.64],[1.01,-2.41],[.80,-3.05]],'#6d95da');
    const star=[];for(let i=0;i<24;i++){const r=i%2?1.1:1.45;star.push([Math.cos(i*turn/24)*r,Math.sin(i*turn/24)*r]);}
    poly(c,star,'#587ec9');oval(c,0,0,1.04,1.04,gold);oval(c,0,0,.82,.82,'#5f7ec2');glyph(c,'1',0,-.04,.85,1.18,cream);c.restore();
  }

  // With retractable feather wings and working quad wheels, the high-top has
  // technically satisfied both the skating and aviation departments.
  const highTop=[[-6.43,3.52],[-6.52,7.70],[-7.04,9.90],[-6.93,10.64],[-3.24,10.77],[-1.61,9.78],[-1.35,8.57],[.11,7.26],[2.77,6.14],[5.71,5.73],[6.88,5.06],[7.12,4.28],[6.93,3.70],[5.41,3.50]];
  const bootStripe=[[-5.85,7.70],[-1.51,7.28],[.07,6.23],[-1.85,6.11],[2.48,4.68],[-2.65,5.22],[-4.55,6.30],[-2.74,6.61]];
  const bootWing=[[-.30,-.50],[-1.19,1.27],[-4.11,3.45],[-5.07,3.61],[-4.79,2.82],[-3.98,2.01],[-5.28,2.28],[-5.05,1.47],[-3.84,.66],[-4.81,.76],[-4.29,-.08],[-2.48,-.69]];
  function wheelSpin(t,p){return t*2.36+1.60*pulse(p);}
  function skate(root,a){
    const b=a.builder(root);
    cut(b,'skateUpper',highTop,[0,0,0],3.30,'#c66b90');
    b.box([-.17,3.57,.04],[14.07,.49,3.58],cream,[0,0,.01]);
    b.box([-.20,3.22,.02],[13.92,.27,3.48],mint,null,true);
    b.box([-4.83,10.55,0],[4.39,.50,3.52],'#57415f',[0,0,.035]);b.box([-4.77,10.80,0],[4.00,.13,3.03],night,[0,0,.035]);
    cut(b,'skateFlash',bootStripe,[0,0,1.69],.11,ice,true);
    cut(b,'skateFlash',bootStripe,[0,0,-1.69],.11,ice,true);
    for(const s of [-1,1])for(const [i,x] of [-2.65,-2.11,-1.40,-.08].entries()){
      const y=9.18-i*.68;coin(b,x,y,s*1.73,.25,.12,night,false,7);
      bars(b,[[x,y,s*1.83],[x+.68,y+.11,s*1.30],[x+.89,y+.18,s*.60]],.089,cream,false);
    }
    b.box([-.22,2.62,0],[10.59,.48,2.33],iron);
    for(const x of [-4.64,4.38])b.rod([x,1.46,-2.23],[x,1.46,2.23],.31,.31,silver,false,8);
    b.finish();decal(root,a,'NO-FLY SKATE','SOPHIE / AIRSPACE CITATION',3.38,4.41,1.67,4.30,.89,pink);
    const wings=[];
    for(const s of [-1,1]){const n=a.node(root,-5.23,6.61,s*1.56),b=a.builder(n);
      cut(b,'skateWing',bootWing,[0,0,0],.33,'#f7dcad');bars(b,[[-.58,-.14,s*.19],[-2.31,.54,s*.19],[-4.09,1.76,s*.19]],.081,gold,true);b.finish();wings.push(n);}
    const wheels=[];
    for(const [i,x] of [-4.64,4.38].entries()){
      const n=a.node(root,x,1.46,0),w=a.builder(n);
      for(const s of [-1,1]){
        const z=s*1.95,front=s*2.42;
        coin(w,0,0,z,1.40,.81,'#443b59',false,14);
        badge(w,0,0,front,1.10,i?pink:mint,true,14,s<0);
        badge(w,0,0,front+s*.095,.79,'#756a8a',false,12,s<0);
        for(let j=0;j<3;j++){const v=(j+.2)*turn/3;w.box([.47*Math.cos(v),.47*Math.sin(v),front+s*.175],[.53,.16,.06],cream,[0,0,v],true);}
        badge(w,0,0,front+s*.21,.26,silver,false,8,s<0);
      }w.finish();wheels.push(n);
    }
    return (t,p)=>{for(const v of wheels)v.rotation.z=-wheelSpin(t,p);for(let i=0;i<2;i++){const s=i?1:-1;wings[i].rotation.y=s*(.18+.14*Math.cos(t*1.6)+.60*pulse(p));wings[i].rotation.z=-.04+.12*Math.sin(t*1.6)+.32*pulse(p);}};
  }
  function drawSkate(c,t,p){
    poly(c,highTop,'#cb7396');rect(c,-7.13,3.31,14.1,.49,cream);rect(c,-7.17,3.09,13.93,.26,mint);
    rect(c,-7.03,10.33,4.40,.5,shadow);rect(c,-6.78,10.75,4.0,.14,night);poly(c,bootStripe,ice);
    for(const [i,x] of [-2.65,-2.11,-1.40,-.08].entries()){const y=9.18-i*.68;oval(c,x,y,.25,.25,night);line(c,[[x,y],[x+.68,y+.11],[x+.91,y+.18]],cream,.16);}
    plate(c,'NO-FLY SKATE',3.38,4.41,4.30,.89,pink);
    c.save();c.translate(-5.23,6.61);c.rotate(-.04+.12*Math.sin(t*1.6)+.32*pulse(p));c.scale(Math.cos(.18+.14*Math.cos(t*1.6)+.60*pulse(p)),1);poly(c,bootWing,'#ffe2b4');line(c,[[-.58,-.14],[-2.31,.54],[-4.09,1.76]],gold,.14);c.restore();
    rect(c,-5.53,2.38,10.59,.49,iron);for(const [i,x] of [-4.64,4.38].entries()){
      c.save();c.translate(x,1.46);c.rotate(-wheelSpin(t,p));oval(c,0,0,1.40,1.4,'#443b59');oval(c,0,0,1.10,1.1,i?pink:mint);oval(c,0,0,.79,.79,'#756a8a');
      for(let j=0;j<3;j++){const a=(j+.2)*turn/3;line(c,[[.2*Math.cos(a),.2*Math.sin(a)],[.73*Math.cos(a),.73*Math.sin(a)]],cream,.16);}
      oval(c,0,0,.26,.26,silver);c.restore();
    }
  }

  // Trim each float to its swept bounds so the visitor camera and sky traffic
  // position it by bottom-center, including its full idle and horn poses.
  const floats=[
    {id:'sky-blue-plate',name:'Blue Plate Abduction',region:'arizona',crew:'Ivan',
      width:22.0,height:12.2,depth:16.2,origin:[0,-.07],ink:mint,sound:'bleep',reply:'I ordered the entire booth to go.',build:bluePlate,draw:drawBlue},
    {id:'sky-whale-mail',name:'Whale Mail',region:'arizona',crew:'Harper',
      width:21.0,height:13.2,depth:6.15,origin:[2.10,.39],ink:ice,sound:'bell',reply:'Sign here. The pen is a squid.',build:whale,draw:drawWhale},
    {id:'sky-vacancy',name:'Vacancy Magnet',region:'arizona',crew:'Soon',
      width:17.1,height:12.6,depth:3.12,origin:[0,0],ink:pink,sound:'bleep',reply:'Your room is stuck to the key again.',build:vacancy,draw:drawVacancy},
    {id:'sky-floppy-jelly',name:'Floppy Jellyfish',region:'eight',crew:'Dylan',
      width:15.85,height:16.0,depth:2.6,origin:[.15,-.17],ink:purple,sound:'bleep',reply:'Disk full. Mostly seawater.',build:floppy,draw:drawFloppy},
    {id:'sky-rain',name:'Rain Check',region:'eight',crew:'Eryan',
      width:16.0,height:13.5,depth:6.15,origin:[-.19,-.08],ink:mint,sound:'steam',reply:'Three drops. Keep the receipt.',build:rain,draw:drawRain},
    {id:'sky-chairlift',name:'Unscheduled Chairlift',region:'eight',crew:'Sugi',
      width:16.1,height:15.8,depth:13.4,origin:[0,-.22],ink:pink,sound:'bell',reply:'Your meeting has reached cruising altitude.',build:chairlift,draw:drawChair},
    {id:'sky-quack-local',name:'The Quack Local',region:'indiana',crew:'Eden',
      width:24.8,height:10.5,depth:3.9,origin:[1.17,-.29],ink:gold,sound:'quack',reply:'Mind the quack between train and platform.',build:quack,draw:drawQuack},
    {id:'sky-air-corn',name:'Air Corn One',region:'indiana',crew:'Mint',
      width:21.0,height:9.25,depth:5.1,origin:[1.95,-1.16],ink:gold,sound:'cheer',reply:'Tower, requesting permission to mustard.',build:airCorn,draw:drawCorn},
    {id:'sky-no-fly',name:'No-Fly Skate',region:'indiana',crew:'Sophie',
      width:18.15,height:11.2,depth:13.0,origin:[1.76,0],ink:pink,sound:'cheer',reply:'Radar clocked your left shoe at Mach one.',build:skate,draw:drawSkate}
  ];
  return floats.map(({origin:[x,y],build,draw,...float})=>({...float,
    build(root,art){return build(art.node(root,x,y,0),art);},
    draw(c,t,p){c.save();c.translate(x,y);draw(c,t,p);c.restore();}
  }));
})();
