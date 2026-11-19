/* The Chicago midway at Overclock Strip. Its rides run on the race clock;
   each horn response is a pure pose that replays identically at the same time. */
import { MTMKit } from './kit.js';

const MTMStripMidway=(()=>{
  'use strict';
  const T=THREE,TAU=2*Math.PI,dark='#172237',frame='#465575',steel='#879cb3',ivory='#fff0cd';
  const teal='#67ffe2',rose='#ff609d',gold='#ffc357',violet='#a87fff';
  const shapes=new Map();
  function geom(key,fn){if(!shapes.has(key))shapes.set(key,fn());return shapes.get(key);}
  function ell(b,at,scale,shade,glow=false,rot=null,fine=false){
    b.add(geom(fine?'body':'bead',()=>new T.SphereGeometry(1,fine?14:9,fine?8:5)),at,scale,rot,shade,glow);
  }
  function disc(b,x,y,z,rx,ry,thick,shade,glow=false,sides=18){
    b.add(geom('disc'+sides,()=>new T.CylinderGeometry(1,1,1,sides)),[x,y,z],[rx,thick,ry],[Math.PI/2,0,0],shade,glow);
  }
  function hoop(b,x,y,z,r,tube,shade,glow=false,count=32){
    b.add(geom(['hoop',r,tube,count].join(),()=>new T.TorusGeometry(r,tube,4,count)),[x,y,z],[1,1,1],null,shade,glow);
  }
  function path(b,key,pts,r,shade,glow=false,n=12,sides=5){
    const g=geom(key,()=>new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p))),n,r,sides,false));
    b.add(g,[0,0,0],[1,1,1],null,shade,glow);
  }
  const silhouettes={
    ear:[[-.61,0],[.60,0],[.15,1.15]],star:[[0,1],[.18,.19],[.79,0],[.18,-.18],[0,-1],[-.18,-.18],[-.80,0],[-.18,.19]],
    jaw:[[-.21,.10],[.22,.10],[.37,-.76],[.20,-1.54],[-.58,-2.22],[-.86,-2.26],[-.53,-1.80],[-.13,-1.37],[.00,-.75]],
    needle:[[-.075,-.13],[.075,-.13],[.036,.72],[0,.95],[-.036,.72]]
  };
  function cutout(b,key,at,scale,shade,glow=false,rot=null){
    const g=geom('shape/'+key,()=>{
      const shape=new T.Shape(),pts=silhouettes[key];pts.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
      const g=new T.ExtrudeGeometry(shape,{depth:1,bevelEnabled:false,curveSegments:1});g.translate(0,0,-.5);return g;
    });
    b.add(g,at,scale,rot,shade,glow);
  }
  function sign(b,root,label,title,sub,w,h,y,z,color){
    b.box([0,y,z-.13],[w+.20,h+.20,.23],dark);
    label(root,title,sub,w,h,y,z,color);
  }
  const clamp=x=>Math.max(0,Math.min(1,x||0));
  const {paint} = MTMKit, rect = paint.rect, oval = paint.oval, poly = paint.poly;
  function line(c,p,ink,r){c.strokeStyle=ink;c.lineWidth=r;c.lineJoin='round';c.lineCap='round';c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
  function ring(c,x,y,r,ink,w){c.strokeStyle=ink;c.lineWidth=w;c.beginPath();c.arc(x,y,r,0,TAU);c.stroke();}
  function star(c,x,y,r,ink){poly(c,silhouettes.star.map(([u,v])=>[x+u*r,y+v*r]),ink);}

  // Clint's giant rat runs a striped flywheel. The gauge reads considerably
  // higher when a horn startles the rat, even in the flat fallback projection.
  function ratMotion(t,p){
    p=clamp(p);const gait=t*5.65+p*1.18;
    return {wheel:-t*.96-p*.66,gait,y:4.22+.12*Math.cos(2*gait)+p*.72,tilt:.045*Math.sin(gait)+p*.13,needle:.88-.32*Math.sin(gait*.63)-1.75*p};
  }
  function rat(root,{builder,node,label}){
    const b=builder(root);
    b.box([0,.32,0],[10.2,.64,3.85],dark);b.box([0,.69,0],[9.62,.16,3.54],'#818397');
    for(const x of [-3.95,3.95]){
      b.rod([x,.75,-.15],[0,6.28,-.50],.25,.16,steel,false,7);
      b.rod([x,.78,-1.27],[0,6.24,-.70],.12,.11,teal,false,6);
    }
    // The rat's feet land on a real belt between the two dynamometer rollers.
    b.box([-.14,2.93,.98],[3.72,.33,1.19],'#4a5361');
    b.box([-.14,3.126,.98],[3.62,.085,1.10],'#88a4a4');
    for(const x of [-1.69,1.37]){
      b.rod([x,1.72,.89],[x,2.89,.89],.113,.115,steel,false,6);
      disc(b,x,2.93,1.62,.258,.258,.16,'#b2a075',false,9);disc(b,x,2.93,1.72,.12,.12,.045,'#4e626e',false,7);
    }
    disc(b,0,6.30,-.72,.49,.49,1.1,'#596883');
    disc(b,4.14,2.20,1.45,1.08,1.08,.32,steel);disc(b,4.14,2.20,1.66,.91,.91,.08,'#f7d799',true);
    for(let i=0;i<5;i++){const a=(-.36+i*.18)*Math.PI;b.box([4.14+.77*Math.sin(a),2.20+.77*Math.cos(a),1.73],[.075,.22,.04],i>2?rose:dark,[0,0,-a],i>2);}
    sign(b,root,label,'RAT RACE DYNO','CLINT  /  RODENT HORSEPOWER',6.92,1.18,1.42,1.88,teal);b.finish();
    const meter=node(root,4.14,2.20,1.77),m=builder(meter);cutout(m,'needle',[0,0,0],[1,.84,.06],rose,true);disc(m,0,0,.05,.125,.125,.05,dark,true);m.finish();
    const wheel=node(root,0,6.30,0),w=builder(wheel);
    hoop(w,0,0,-.69,4.82,.185,'#5b7690',false,26);hoop(w,0,0,.69,4.82,.175,'#70dfce',true,26);
    for(let i=0;i<18;i++){
      const a=i*TAU/18,x=4.82*Math.cos(a),y=4.82*Math.sin(a);
      w.box([x,y,0],[.22,.48,1.53],i%3===0?gold:steel,[0,0,a]);
      if(i%3===0){
        w.rod([.26*Math.cos(a),.26*Math.sin(a),-.69],[x,y,-.69],.085,.11,'#67788e',false,5);
        w.box([x,y,.91],[.15,.48,.075],i%2===0?ivory:rose,[0,0,a],true);
      }
    }
    w.finish();
    const rat=node(root,0,4.22,1.13),r=builder(rat);
    ell(r,[-.56,.48,0],[1.85,1.15,.92],'#a39abb',false,[0,0,.16],true);
    ell(r,[.83,1.00,.02],[1.30,.91,.82],'#bcacc2',false,[0,0,-.13]);
    r.rod([1.31,1.00,.02],[2.78,.65,.09],.72,.135,'#c8b2b7',false,10);
    ell(r,[2.81,.67,.085],[.245,.22,.23],rose);
    for(const side of [-1,1]){
      disc(r,.53,1.91,side*.61,.51,.61,.23,'#a493ab',false,12);
      disc(r,.53,1.91,side*.75,.34,.44,.04,'#e8a1b4',false,11);
      disc(r,1.55,1.22,side*.65,.191,.21,.111,dark,false,10);disc(r,1.60,1.30,side*.72,.066,.065,.024,ivory,false,7);
      for(const k of [-1,1])r.rod([2.22,.74,side*.27],[2.91,.84+k*.24,side*1.03],.045,.021,'#e8d3c8',false,5);
    }
    path(r,'rat/tail',[[-2.02,.64,-.03],[-2.65,.87,-.01],[-3.18,1.49,-.02],[-3.41,2.04,-.03],[-3.11,2.36,-.03],[-2.81,2.28,-.03]],.135,'#f38ea9',false,14);
    r.finish();
    const legs=[node(rat,-1.18,-.03,.51),node(rat,.75,.16,.56)];
    legs.forEach((joint,i)=>{const f=builder(joint);
      f.rod([0,.05,0],[i?.29:-.27,-.61,0],.26,.15,'#a597ae',false,7);
      f.rod([i?.29:-.27,-.61,0],[i?.07:.04,-1.03,0],.15,.11,'#c7a4b0',false,6);
      ell(f,[.23,-1.04,.04],[.37,.16,.20],'#f3a4b5');f.finish();});
    return (t,p)=>{const a=ratMotion(t,p);wheel.rotation.z=a.wheel;rat.position.y=a.y;rat.rotation.z=a.tilt;
      legs[0].rotation.z=.86*Math.sin(a.gait);legs[1].rotation.z=-.91*Math.sin(a.gait);meter.rotation.z=a.needle;};
  }
  function drawRat(c,t,p){
    const a=ratMotion(t,p);c.save();rect(c,-5.1,0,10.2,.76,dark);line(c,[[-3.9,.6],[0,6.3],[3.9,.6]],steel,.38);
    ring(c,0,6.30,4.82,teal,.28);
    for(let i=0;i<12;i++){const q=i*TAU/12+a.wheel,x=Math.cos(q),y=Math.sin(q);
      if(i%2===0)line(c,[[x*.48,6.3+y*.48],[x*4.60,6.3+y*4.60]],'#64798b',.12);
      line(c,[[x*4.64,6.3+y*4.64],[x*4.97,6.3+y*4.97]],i%3?steel:gold,.23);}
    rect(c,-1.99,2.77,3.72,.39,'#526879');for(const x of [-1.69,1.37])oval(c,x,2.93,.25,.25,'#c3ab80');
    c.save();c.translate(0,a.y);c.rotate(a.tilt);
    line(c,[[-1.6,.42],[-2.5,.72],[-3.19,1.48],[-3.36,2.07],[-3.03,2.30],[-2.78,2.27]],rose,.22);
    for(const [x,sign] of [[-1.17,1],[.78,-1]]){const dx=.59*sign*Math.sin(a.gait);line(c,[[x,.02],[x+dx,-.54],[x+dx+.14,-1.01],[x+dx+.50,-1.01]],'#f5a8b4',.24);}
    oval(c,-.49,.53,1.82,1.13,'#a59ab9',.13);oval(c,.93,1.03,1.25,.88,'#bfaec2');
    poly(c,[[1.22,1.65],[2.81,.71],[1.14,.36]],'#c8b0ba');oval(c,.50,1.96,.51,.60,'#e6a5b3');oval(c,1.55,1.25,.16,.17,dark);oval(c,2.79,.7,.22,.18,rose);
    c.restore();rect(c,-3.45,.83,6.9,1.18,dark);rect(c,-3.45,1.88,6.9,.12,teal);oval(c,4.14,2.2,1.01,1.01,gold);
    line(c,[[4.14,2.2],[4.14-.72*Math.sin(a.needle),2.2+.72*Math.cos(a.needle)]],rose,.13);c.restore();
  }

  // Mint's coin-operated maneki-neko holds a Chicago-star token in one paw and
  // waves with the other. The second token tumbles down the change return.
  function catMotion(t,p){
    p=clamp(p);const cycle=t*.53+.11+p*.18,q=cycle-Math.floor(cycle);
    return {wave:-.27+.33*Math.sin(t*2.44)-p*.36,x:2.94+.58*Math.sin(q*Math.PI),y:5.60-3.40*q,pivot:t*3.8+p*2.7,coinScale:Math.min(1,q/.09,(1-q)/.085)};
  }
  function cat(root,{builder,node,label}){
    const b=builder(root);
    b.box([0,.54,0],[8.50,1.08,4.05],'#26545e');
    b.box([0,1.26,0],[8.76,.41,4.24],teal,null,true);b.box([0,1.59,0],[8.36,.34,4.0],'#407b85');
    for(const x of [-3.72,3.72])b.box([x,1.78,.04],[.58,.26,3.62],'#6e8d9b');
    sign(b,root,label,'EXACT CHANGE','MINT  /  NINE-LIFE CHANGE MACHINE',6.69,1.07,.81,2.13,gold);
    ell(b,[-.24,4.15,0],[2.16,2.46,1.42],'#efe6d4',false,null,true);
    for(const x of [-1.38,.91])ell(b,[x,2.12,.72],[.88,.54,.82],'#fff0d7');
    path(b,'mint/tail',[[-1.75,3.39,-.46],[-2.66,3.20,-.49],[-3.46,3.83,-.44],[-3.63,4.76,-.41],[-3.25,5.27,-.37]],.34,'#d99d7f',false,14);
    ell(b,[-.25,6.96,.05],[2.12,1.78,1.47],'#fff0d9',false,null,true);
    for(const s of [-1,1]){
      const x=-.24+s*1.32;
      cutout(b,'ear',[x,8.02,.13],[1.60,1.46,1.08],s===1?'#c87367':'#f7dfbb',false,[0,0,s*-.19]);
      cutout(b,'ear',[x,8.20,.71],[.94,.89,.08],'#f4a7ad',false,[0,0,s*-.19]);
      const eye=-.24+s*.78;
      path(b,'mint/eye'+s,[[eye-.34,7.23,1.39],[eye,7.43,1.44],[eye+.34,7.23,1.39]],.078,dark,false,6);
      for(const k of [-1,1])b.rod([-.24+s*1.39,6.82,1.10],[-.24+s*2.35,6.80+k*.18,.94],.051,.027,'#8a6c77',false,5);
    }
    ell(b,[-.24,6.79,1.56],[.21,.16,.13],rose,true);
    path(b,'mint/mouth',[[-.61,6.60,1.46],[-.49,6.48,1.50],[-.24,6.61,1.54],[.02,6.48,1.50],[.15,6.62,1.46]],.055,'#64536b',false,9);
    b.box([-.24,5.56,.61],[3.40,.34,1.55],'#d8507b');ell(b,[-.24,5.42,1.51],[.32,.33,.20],gold,true);
    disc(b,-.46,3.85,1.46,1.43,1.30,.26,'#c8903d',false,20);disc(b,-.46,3.85,1.64,1.23,1.12,.10,gold,true,18);
    cutout(b,'star',[-.46,3.84,1.76],[.83,.81,.065],'#a15c37');
    ell(b,[-1.50,4.18,1.38],[.65,.73,.48],'#f7dfc7',false,[0,.03,-.37]);
    b.box([3.08,1.95,.55],[1.65,.26,1.49],'#c58d50');b.finish();
    const shoulder=node(root,1.57,5.31,.24),arm=builder(shoulder);
    ell(arm,[.45,1.08,.16],[.60,1.38,.61],'#f1e7ce',false,[0,0,-.29],true);
    ell(arm,[.86,2.27,.32],[.65,.72,.56],'#fef2d9',false,null,true);
    for(const x of [.62,.84,1.06])ell(arm,[x,2.43,.807],[.108,.14,.081],'#f0acaa');
    ell(arm,[.86,2.19,.85],[.28,.19,.06],'#ed9aa6');arm.finish();
    const coin=node(root,2.94,4.8,1.10),c=builder(coin);
    disc(c,0,0,0,.59,.59,.16,'#d79839',false,14);disc(c,0,0,.09,.49,.49,.035,gold,true,14);
    cutout(c,'star',[0,0,.122],[.32,.32,.035],'#8b6035');c.finish();
    return (t,p)=>{const a=catMotion(t,p);shoulder.rotation.z=a.wave;coin.position.x=a.x;coin.position.y=a.y;coin.rotation.y=a.pivot;coin.scale.setScalar(.001+.999*a.coinScale);};
  }
  function drawCat(c,t,p){
    const a=catMotion(t,p);c.save();rect(c,-4.3,0,8.6,1.7,'#386572');rect(c,-4.38,1.16,8.76,.28,teal);
    line(c,[[-1.56,3.25],[-2.83,3.21],[-3.53,4.04],[-3.60,4.77],[-3.29,5.23]],'#de9f83',.62);
    oval(c,-.24,4.19,2.14,2.45,'#f0e3cb');oval(c,-1.39,2.12,.85,.48,ivory);oval(c,.98,2.12,.87,.50,ivory);
    for(const s of [-1,1]){const x=-.24+s*1.33;poly(c,[[x-.84,7.83],[x+.76,7.83],[x+s*.38,9.74]],s>0?'#c87e72':ivory);poly(c,[[x-.51,8.10],[x+.50,8.1],[x+s*.26,9.20]],'#ed9daf');}
    oval(c,-.24,6.97,2.14,1.73,ivory);for(const s of [-1,1]){const x=-.24+s*.77;line(c,[[x-.33,7.22],[x,7.43],[x+.31,7.22]],dark,.12);
      line(c,[[-.24+s*1.45,6.86],[-.24+s*2.24,7.01]],'#987a84',.085);}
    oval(c,-.24,6.78,.20,.15,rose);rect(c,-1.82,5.44,3.20,.27,'#d75077');
    oval(c,-.46,3.85,1.4,1.26,gold);star(c,-.46,3.85,.76,'#985a36');
    c.save();c.translate(1.57,5.31);c.rotate(a.wave);oval(c,.42,1.07,.55,1.38,ivory,-.28);oval(c,.86,2.27,.64,.71,ivory);oval(c,.86,2.20,.27,.18,'#ed9fa8');c.restore();
    oval(c,a.x,a.y,(.14+.45*Math.abs(Math.cos(a.pivot)))*a.coinScale,.58*a.coinScale,gold);c.restore();
  }

  // The mirror ball uses genuinely separated square tiles over a dark core.
  // Each quad gets one flat normal so the facets remain square on the CPU path.
  function mirrorBall(){
    return geom('sophie/mirror-tiles',()=>{
      const p=[],n=[],indices=[],lat=10,lon=20;
      const point=(v,u)=>[Math.cos(v)*Math.sin(u),Math.sin(v),Math.cos(v)*Math.cos(u)];
      for(let j=0;j<lat;j++)for(let i=0;i<lon;i++){
        const v=(j+.5)*Math.PI/lat-Math.PI/2,u=(i+.5)*TAU/lon,a=.465*Math.PI/lat,b=.462*TAU/lon;
        const norm=point(v,u),k=p.length/3;
        for(const [x,y] of [[-b,-a],[b,-a],[b,a],[-b,a]]){p.push(...point(v+y,u+x));n.push(...norm);}
        indices.push(k,k+1,k+2,k,k+2,k+3);
      }
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(n,3));g.setIndex(indices);return g;
    });
  }
  const mirrorColors=['#c5b4e3','#90bbe4','#d6b4d6','#86a2c5','#e1d2e5','#a9bed0','#c5a4c9','#80b9d3'];
  function eyeMotion(t,p){p=clamp(p);return {turn:t*.34,look:.37*Math.sin(t*.67)+p*.32,nod:.085*Math.cos(t*.93)-p*.10,open:1-.25*p,wing:.22+.10*Math.sin(t*1.22)+p*.54};}
  function eye(root,{builder,node,label}){
    const b=builder(root);
    b.box([0,.36,0],[9.60,.72,4.34],dark);b.box([0,.82,0],[9.17,.21,4.08],'#8a7d98');
    for(const s of [-1,1]){
      b.rod([s*3.80,.91,-.28],[s*1.50,4.99,-.35],.26,.18,'#766b93',false,8);
      b.rod([s*1.92,.94,-.29],[s*2.79,3.15,-.26],.114,.115,teal,false,6);
      b.rod([s*3.55,1.22,-.31],[s*.87,3.66,-.31],.105,.095,'#ae91b7',false,6);
      b.rod([s*3.53,.96,-1.29],[s*1.59,4.77,-.48],.15,.13,'#64738d',false,7);
      // A pair of rigid checkered finish pennants flank the camera housing.
      b.rod([s*2.46,3.32,-.50],[s*5.22,7.13,-.54],.105,.085,'#a6bfbd',false,7);
      for(let row=0;row<2;row++)for(let col=0;col<3;col++){
        const x=s*(4.58+col*.45-row*.10),y=6.70+col*.24-row*.39;
        b.box([x,y,-.53],[.51,.43,.07],(row+col)%2===0?ivory:dark,[0,0,s*.43],(row+col)%2===0);
      }
    }
    b.box([0,4.60,-.28],[4.97,.59,1.6],'#44556f');
    sign(b,root,label,'LAST BLINK','SOPHIE  /  PHOTO FINISH',7.10,1.20,1.58,1.88,rose);b.finish();
    const globe=node(root,0,7.23,0),d=builder(globe);
    ell(d,[0,0,0],[3.38,3.14,3.33],'#34314e',false,null,true);
    d.add(mirrorBall(),[0,0,0],[3.46,3.22,3.42],null,(_,normal)=>{
      const k=Math.floor(20*(Math.atan2(normal.x,normal.z)/TAU+1))%20,j=Math.floor(10*(Math.asin(normal.y)/Math.PI+.5));
      return mirrorColors[(j*5+k*3+(j*k)%5)%mirrorColors.length];
    });
    d.finish();
    const optic=node(root,0,7.23,0),lens=builder(optic);
    // A colored iris, cut-glass highlight and staring black pupil make this
    // readable as an eye even while the mirrored globe turns independently.
    disc(lens,0,0,2.88,2.42,2.02,.40,'#745578',false,24);
    disc(lens,0,0,3.13,2.26,1.88,.16,'#f4dbdf',true,24);
    disc(lens,0,0,3.27,1.54,1.49,.15,'#832b78',false,22);
    disc(lens,0,0,3.37,1.39,1.34,.15,'#f56bb2',true,22);
    for(let i=0;i<12;i++){
      const a=i*TAU/12,x=1.18*Math.cos(a),y=1.11*Math.sin(a);
      lens.box([x,y,3.47],[.28,.068,.042],i%3===0?ivory:'#b6499c',[0,0,a],i%3===0);
    }
    for(const s of [-1,1])for(let i=0;i<2;i++){
      const x=s*(1.15+i*.69),y=1.75-i*.26;
      lens.rod([x,y,3.04],[x+s*(.18+i*.21),y+.63-i*.12,2.86],.116,.061,'#433454',false,6);
    }
    lens.finish();
    const aperture=node(optic,0,0,3.49),ap=builder(aperture);
    disc(ap,0,0,0,.77,.82,.11,'#232039',true,14);
    cutout(ap,'star',[-.22,.26,.087],[.29,.35,.028],ivory,true);
    ell(ap,[.23,-.22,.08],[.10,.10,.029],teal,true);ap.finish();
    const vanes=[];
    for(const s of [-1,1]){
      const pivot=node(root,s*2.92,4.56,.32),v=builder(pivot);
      v.box([s*.84,.21,0],[1.78,.42,.36],'#574d72',null,true);v.box([s*.88,.23,.21],[1.26,.15,.045],rose,[0,0,-s*.12],true);v.finish();vanes.push(pivot);
    }
    return (t,p)=>{const a=eyeMotion(t,p);globe.rotation.y=a.turn;optic.rotation.set(a.nod,a.look,0,'YXZ');aperture.scale.set(a.open,a.open,1);
      vanes[0].rotation.z=-a.wing;vanes[1].rotation.z=a.wing;};
  }
  function drawEye(c,t,p){
    const a=eyeMotion(t,p);c.save();rect(c,-4.82,0,9.64,.87,dark);line(c,[[-3.8,.8],[-1.49,4.97],[1.49,4.97],[3.8,.8]],'#8c82a4',.45);
    for(const s of [-1,1]){
      line(c,[[2.46*s,3.32],[5.23*s,7.14]],steel,.18);for(let row=0;row<2;row++)for(let i=0;i<3;i++){
        const x=s*(4.43+i*.44),y=6.33+i*.22-row*.35;poly(c,[[x,y],[x+s*.45,y+.22],[x+s*.46,y+.60],[x,y+.37]],(i+row)%2?dark:ivory);}
      line(c,[[s*2.91,4.55],[s*(2.92+1.63*Math.cos(a.wing)),4.56+1.65*Math.sin(a.wing)]],rose,.30);}
    oval(c,0,7.23,3.48,3.21,'#8d9cbd');
    // A handful of broad colored tiles survive the smallest roadside projection.
    for(let j=-2;j<=2;j++)for(let k=-3;k<=3;k++){
      const x=k*.76+.29*Math.sin(a.turn+j*.35),y=j*.75;
      if((x/3.23)**2+(y/3.05)**2>.85)continue;
      rect(c,x-.32,7.23+y-.29,.65,.58,mirrorColors[(k+9+3*(j+2))%8]);
    }
    const ex=Math.sin(a.look)*1.83,ey=7.15-a.nod;
    oval(c,ex,ey,2.26,1.82,'#f4d8e4');oval(c,ex+.10,ey,1.37,1.32,rose);oval(c,ex+.15,ey,.77*a.open,.82*a.open,'#211e39');
    star(c,ex-.08,ey+.28,.33,ivory);for(const s of [-1,1])line(c,[[ex+s*1.45,ey+1.26],[ex+s*1.75,ey+1.99]],dark,.15);
    rect(c,-3.55,.98,7.10,1.18,dark);rect(c,-3.55,2.06,7.1,.12,rose);c.restore();
  }

  // Eden's motorized crane travels to the prize, closes, lifts, and returns it
  // to the prize chute. The little wheel never follows an open, empty claw.
  function ramp(x,a,b){const f=Math.max(0,Math.min(1,(x-a)/(b-a)));return f*f*(3-2*f);}
  function clawMotion(t,p){
    p=clamp(p);const cycle=t*.153+.03,q=cycle-Math.floor(cycle);
    const x=-2.08+4.16*ramp(q,.02,.17)-4.16*ramp(q,.55,.72);
    const drop=ramp(q,.17,.34)-ramp(q,.39,.55),hy=8.03-2.89*drop;
    const closed=ramp(q,.27,.36)-ramp(q,.72,.78);
    const spread=.52-.36*closed-.12*p;
    const grabbed=q>=.36&&q<.75;
    const wx=q<.36?2.08:q<.86?x:q<.91?-2.08:2.08;
    const wy=grabbed?hy-2.16:q<.36?2.98:q<.86?5.87-4.45*ramp(q,.75,.86):q<.91?1.42:1.42+1.56*ramp(q,.92,.99);
    const prizeScale=q<.84?1:q<.91?1-ramp(q,.84,.90):ramp(q,.92,.985);
    return {x,hy,spread,wx,wy:wy+p*.11*Math.cos(t*4.1),prizeScale,rot:(grabbed?.17*Math.sin(q*20):.05)+p*.25};
  }
  function crane(root,{builder,node,label}){
    const b=builder(root);
    b.box([0,.79,0],[10.45,1.58,4.33],'#583651');b.box([0,1.59,0],[10.67,.18,4.49],rose,null,true);
    b.box([0,1.82,0],[10.25,.35,4.20],'#735171');b.box([-2.08,2.01,.28],[2.36,.08,1.75],dark);
    b.box([-2.08,.96,2.17],[2.54,.55,.10],'#262539');b.box([-2.08,.68,2.29],[2.60,.11,.37],'#dd9974');
    // Smaller, unreached tires stay in the bin as the claw wins the big wheel.
    for(const [x,y,z] of [[-.62,2.63,-.68],[.68,2.63,-.93]]){
      hoop(b,x,y,z,.48,.17,'#454456',false,14);disc(b,x,y,z+.13,.30,.30,.12,'#af91ae',false,10);disc(b,x,y,z+.21,.14,.14,.07,teal,true,8);
    }
    b.box([2.08,1.18,-.19],[2.23,.28,1.69],'#9b7693');
    for(const s of [-1,1])for(const z of [-1.30,1.29]){
      b.box([s*4.48,5.29,z],[.34,7.20,.32],z<0?'#5f557e':'#a36894');
      if(z>0)b.box([s*4.48,5.31,z+.18],[.095,6.92,.065],teal,null,true);
    }
    for(const s of [-1,1]){
      b.rod([s*4.43,7.63,-1.31],[s*3.20,9.22,-1.31],.105,.104,'#9a85b3',false,6);
      b.rod([s*4.45,7.63,1.27],[s*3.30,9.14,1.27],.099,.096,'#bd8b9f',false,6);
    }
    b.box([0,9.28,0],[10.18,.76,3.48],'#834974');b.box([0,9.74,0],[10.56,.25,3.67],violet,null,true);
    b.box([0,8.95,-.08],[8.12,.17,.24],'#a9b2bd');
    for(let i=0;i<9;i++)b.box([-4.19+i*1.05,.91,2.19],[.48,.28,.06],i%2?teal:gold,null,true);
    sign(b,root,label,'AXLE CLAW','EDEN  /  THREE REMAINING',7.35,1.11,9.30,1.90,gold);
    // An outsized joystick on the plinth makes this an arcade cabinet.
    b.box([3.59,1.86,1.38],[1.38,.24,1.10],dark,[.14,0,0]);
    b.rod([3.61,1.92,1.42],[3.87,2.45,1.38],.095,.115,'#b1a3aa',false,7);
    ell(b,[3.90,2.52,1.38],[.29,.29,.29],rose,true);b.finish();
    const trolley=node(root,0,9.01,0),rail=builder(trolley);rail.box([0,-.11,0],[1.57,.49,1.16],dark,null,true);rail.box([0,-.15,.62],[.96,.17,.08],gold,null,true);rail.finish();
    const cable=node(trolley,0,-.23,0),linework=builder(cable);
    linework.rod([0,0,0],[0,-1,0],.10,.10,'#b1bfce',false,7);linework.finish();
    const head=node(root),h=builder(head);
    h.rod([0,.10,0],[0,.53,0],.67,.48,'#ae84a7',false,10);h.rod([0,-.13,0],[0,.14,0],.88,.69,'#674b70',false,10);
    h.rod([0,.10,0],[0,.19,0],.71,.69,teal,false,10);h.finish();
    const hinges=[];
    for(const yaw of [0,Math.PI,.5*Math.PI]){
      const swivel=node(head);swivel.rotation.y=yaw;const joint=node(swivel,.66,-.13,0),jaw=builder(joint);
      cutout(jaw,'jaw',[0,0,0],[1.05,1,.34],'#c79493');disc(jaw,0,-.07,.22,.18,.18,.09,'#efba73',false,10);
      jaw.finish();hinges.push(joint);
    }
    const prize=node(root),tire=builder(prize);
    hoop(tire,0,0,0,.72,.27,'#303549',false,22);
    for(let i=0;i<12;i++){
      const a=i*TAU/12;tire.box([.90*Math.cos(a),.90*Math.sin(a),0],[.17,.33,.51],i%3?'#465265':'#626e79',[0,0,a]);
    }
    disc(tire,0,0,.10,.53,.53,.29,'#b28a9d',false,14);disc(tire,0,0,.28,.39,.39,.11,'#fba35f',false,12);
    disc(tire,0,0,.36,.16,.16,.08,dark,false,8);tire.finish();
    return (t,p)=>{const a=clawMotion(t,p);trolley.position.x=a.x;cable.scale.y=8.78-(a.hy+.50);head.position.set(a.x,a.hy,0);
      for(const hinge of hinges)hinge.rotation.z=a.spread;
      prize.position.set(a.wx,a.wy,.07);prize.rotation.z=a.rot;prize.scale.setScalar(.001+.999*a.prizeScale);};
  }
  function drawCrane(c,t,p){
    const a=clawMotion(t,p);c.save();rect(c,-5.22,0,10.44,1.80,'#744969');rect(c,-5.34,1.50,10.68,.22,rose);
    for(const s of [-1,1]){
      rect(c,s*4.48-.17,1.72,.34,7.49,'#ac7499');rect(c,s*4.48-.045,1.75,.09,7.36,teal);
      line(c,[[s*4.48,7.65],[s*3.25,9.05]],'#ad8eab',.19);}
    rect(c,-3.29,.71,2.44,.47,dark);for(const x of [-.62,.68]){oval(c,x,2.61,.63,.63,'#494759');oval(c,x,2.61,.24,.24,teal);}
    rect(c,-5.13,8.88,10.26,.80,'#86567e');rect(c,-5.28,9.62,10.56,.25,violet);
    rect(c,a.x-.75,8.76,1.5,.45,dark);line(c,[[a.x,8.82],[a.x,a.hy+.43]],steel,.14);
    c.save();c.translate(a.wx,a.wy);c.rotate(a.rot);c.scale(a.prizeScale,a.prizeScale);
    oval(c,0,0,1.01,1.01,'#303b4d');ring(c,0,0,.78,'#637182',.17);oval(c,0,0,.46,.46,gold);oval(c,0,0,.17,.17,dark);c.restore();
    oval(c,a.x,a.hy+.08,.83,.30,'#a487aa');for(const s of [-1,1]){
      c.save();c.translate(a.x+s*.66,a.hy-.13);c.scale(s,1);c.rotate(a.spread);
      poly(c,silhouettes.jaw,'#d5a399');c.restore();}
    rect(c,-3.65,8.86,7.30,.79,dark);rect(c,-3.65,9.54,7.3,.11,gold);line(c,[[3.61,1.89],[3.90,2.52]],steel,.15);oval(c,3.90,2.52,.28,.28,rose);c.restore();
  }

  // Handbill faces in the stripped-down renderer use the same sign name,
  // credit and accent as their textured counterparts. Canvas is Y-up here.
  function handbill(c,title,credit,w,h,y,accent){
    c.save();c.translate(0,y);c.scale(1/70,-1/70);
    const W=w*70,H=h*70;
    rect(c,-W/2,-H/2,W,H,dark);rect(c,-W/2,-H/2,W,H*.08,accent);
    c.textAlign='center';c.textBaseline='middle';c.fillStyle=ivory;
    c.font='italic 900 '+Math.round(H*.47)+'px Display, sans-serif';
    c.fillText(title,0,-H*.10,W*.91);c.fillStyle=accent;
    c.font='bold '+Math.round(H*.19)+'px Mono, monospace';c.fillText(credit,0,H*.28,W*.91);c.restore();
  }
  function pad(b,w,d,ink){
    b.box([0,.29,0],[w,.58,d],dark);
    b.box([0,.60,0],[w*.98,.12,d*.97],ink,null,true);
  }
  function upright(b,x,y,z,bottom,top,h,ink,glow=false,sides=14){
    b.rod([x,y,z],[x,y+h,z],bottom,top,ink,glow,sides);
  }
  function profile(b,key,points,p,s,ink,glow=false,sides=18,rot=null){
    b.add(geom(key,()=>new T.LatheGeometry(points.map(([r,y])=>new T.Vector2(r,y)),sides)),p,s,rot,ink,glow);
  }
  function plate(b,key,points,x,y,z,depth,ink,glow=false){
    if(!silhouettes[key])silhouettes[key]=points;
    cutout(b,key,[x,y,z],[1,1,depth],ink,glow);
  }
  // Tiny eyes, candy highlights and kernel lobes need a bright silhouette at
  // racing distance. A single cached icosahedron keeps these details cheap.
  function fleck(b,at,scale,ink,glow=false,rot=null){
    b.add(geom('fair/fleck',()=>new T.IcosahedronGeometry(1,0)),at,scale,rot,ink,glow);
  }

  // Two riveted bascule leaves counterrotate as a squat little river tug
  // sails through. Horn priority raises both leaves and blows its stack.
  const bridgeRed='#d45956',bridgeLight='#ffa386',aqua='#42c7d4';
  function bridgeMotion(t,p){
    p=clamp(p);const travel=Math.sin(t*.75),opening=1-travel*travel;
    return {angle:.09+.85*opening+p*.45,boat:2.00*travel,depth:.24+1.03*travel,rock:.06*Math.cos(t*1.5)+p*.16,steam:.5+.5*Math.sin(t*4.0),p};
  }
  function bridge(root,{builder,node,label}){
    const b=builder(root);pad(b,13.7,3.65,teal);
    b.box([0,1.07,0],[12.74,.8,3.05],'#206579');
    for(let i=0;i<10;i++)b.box([-5.6+i*1.25,1.51,(i%3-1)*.87],[.75,.045,.12],i%2?teal:aqua,null,true);
    for(const k of [-1,1]){
      b.box([k*5.75,2.12,-.10],[1.65,2.58,2.88],'#965553');
      b.box([k*5.75,3.54,-.10],[2.07,.33,3.02],'#b3a39a');
      for(const edge of [-1,1])b.rod([k*6.07,3.65,edge*1.25],[k*6.07,5.61,edge*1.25],.095,.085,steel,false,6);
      b.box([k*6.07,5.68,0],[.65,.19,3.05],teal,null,true);
      disc(b,k*5.42,3.89,1.09,.41,.41,.26,steel,false,12);
    }
    sign(b,root,label,'BASCULE BALLET','CLINT  /  RIVER OVERRIDE',6.30,.90,.91,1.75,teal);b.finish();
    const leaves=[];
    for(const k of [-1,1]){
      const joint=node(root,k*5.42,3.89,0),arm=builder(joint),span=5.32;
      arm.box([-k*span*.5,0,0],[span,.35,2.22],'#475263');
      for(const z of [-.95,.95]){
        arm.box([-k*span*.5,.18,z],[span,.27,.21],bridgeRed);
        arm.rod([0,1.68,z],[-k*span,.38,z],.13,.095,bridgeLight,false,6);
        for(let j=0;j<4;j++){
          const x0=span*j/4,x1=span*(j+1)/4;
          arm.rod([-k*x0,.24,z],[-k*(j%2?x0:x1),1.66-1.26*(j%2?x0:x1)/span,z],.118,.10,bridgeRed,false,5);
          arm.rod([-k*x1,.24,z],[-k*(j%2?x0:x1),1.66-1.26*(j%2?x0:x1)/span,z],.110,.09,bridgeRed,false,5);
        }
      }
      arm.box([k*.35,-.25,0],[.69,.76,2.50],steel);arm.finish();leaves.push([k,joint]);
    }
    const tug=node(root,0,1.64,.24),ship=builder(tug);tug.rotation.order='YXZ';tug.rotation.y=-.47;
    plate(ship,'tug hull',[[-1.62,.36],[-1.11,-.31],[.93,-.31],[1.62,.36]],0,0,0,.78,bridgeRed);
    ship.box([-.15,.64,0],[1.35,.62,.70],ivory);ship.box([-.15,.98,0],[1.69,.15,.86],teal,null,true);
    ship.box([-.13,.66,.366],[.95,.23,.06],'#365b72');
    upright(ship,-.79,.80,0,.19,.17,.68,frame,false,9);ship.finish();
    const steam=node(tug,-.79,1.48,0),sb=builder(steam);
    for(const [x,y,r] of [[0,0,.19],[-.17,.32,.27],[-.44,.63,.32]])ell(sb,[x,y,0],[r,r*.72,r*.73],'#d1eadc');
    sb.finish();
    return(t,p)=>{const a=bridgeMotion(t,p);for(const [k,joint] of leaves)joint.rotation.z=-k*a.angle;
      tug.position.x=a.boat;tug.position.z=a.depth;tug.rotation.z=a.rock;steam.scale.setScalar(.63+.24*a.steam+.7*a.p);};
  }
  function drawBridge(c,t,p){
    const a=bridgeMotion(t,p);c.save();rect(c,-6.85,0,13.70,.67,dark);rect(c,-6.37,.69,12.74,.82,'#286e83');
    for(const k of [-1,1]){
      rect(c,k*5.75-.83,.88,1.66,2.6,'#a1605e');rect(c,k*5.75-1.03,3.38,2.06,.32,ivory);
      line(c,[[k*6.07,3.61],[k*6.07,5.68]],steel,.17);rect(c,k*6.07-.33,5.60,.66,.15,teal);
      c.save();c.translate(k*5.42,3.89);c.rotate(-k*a.angle);c.scale(-k,1);
      rect(c,0,-.17,5.32,.35,dark);line(c,[[0,1.66],[5.32,.38],[5.32,.16],[0,.16],[0,1.66]],bridgeLight,.17);
      for(let j=0;j<4;j++)line(c,[[j*1.33,.20],[(j+1)*1.33,1.68-(j+1)*.325]],bridgeRed,.15);
      c.restore();
    }
    c.save();c.translate(a.boat,1.64-a.depth*.09);c.scale(.89,1);c.rotate(a.rock);poly(c,silhouettes['tug hull']||[[-1.62,.36],[-1.11,-.31],[.93,-.31],[1.62,.36]],bridgeRed);
    rect(c,-.83,.33,1.35,.62,ivory);rect(c,-.99,.92,1.69,.15,teal);rect(c,-.59,.54,.95,.22,'#365b72');rect(c,-.95,.8,.34,.66,frame);
    for(const [x,y,r] of [[-.79,1.55,.17],[-.97,1.86,.24],[-1.21,2.18,.29]])oval(c,x,y,r*(.65+.65*a.p),r*.8,'#d1eadc');
    c.restore();handbill(c,'BASCULE BALLET','CLINT / RIVER OVERRIDE',6.3,.90,.91,teal);c.restore();
  }

  // The butter sculpture wears two long steel skates. Its entire weight rises
  // from the broken-ice turntable when Mint's cow attempts a small salchow.
  const butter='#ffcf55',lightButter='#ffe794',butterShadow='#ce912e';
  function cowMotion(t,p){p=clamp(p);return {x:.76*Math.sin(t*.86),jump:.12*(.5+.5*Math.cos(t*1.72))+1.55*p,twist:-.13+.35*Math.sin(t*1.32)+.80*p,lean:.07*Math.sin(t*.86)-.16*p,tail:.13*Math.sin(t*3.3)-p*.37};}
  function cow(root,{builder,node,label}){
    const b=builder(root);
    upright(b,0,0,0,4.58,4.62,.46,'#3f7086',false,16);
    upright(b,0,.46,0,4.65,4.42,.45,'#97daca',false,16);
    upright(b,0,.85,0,4.46,4.28,.23,teal,true,16);
    for(const k of [-1,1])b.rod([k*1.7,1.09,.45],[k*3.85,1.09,.94],.05,.04,'#e3fff5',true,5);
    sign(b,root,label,'BUTTER ON ICE','MINT  /  SALTED DIVISION',7.08,1.15,1.06,4.59,gold);b.finish();
    const animal=node(root,0,1.13,0),body=builder(animal);
    const sculpted=geom('fair/butter sculpture',()=>new T.SphereGeometry(1,12,6));
    body.add(sculpted,[-.61,3.83,0],[2.94,1.49,1.35],[0,0,.04],butter);
    ell(body,[1.58,4.45,.02],[1.14,1.56,1.08],butter,false,[0,0,-.26]);
    body.add(sculpted,[2.63,5.45,.09],[1.14,1.01,.87],[0,0,-.13],lightButter);
    ell(body,[3.50,5.03,.10],[.79,.52,.72],'#f4b956');
    for(const k of [-1,1]){
      body.ball([2.16,5.68,k*.94],[.68,.34,.34],butterShadow,[k*.26,0,.12],false,true);
      body.rod([2.37,6.03,k*.50],[2.08,6.73,k*.81],.23,.09,ivory,false,6);
      body.rod([2.08,6.73,k*.81],[1.88,6.92,k*.73],.105,.019,ivory,false,6);
      body.ball([2.89,5.69,.09+k*.842],[.21,.23,.12],dark,null,true,true);
      fleck(body,[2.95,5.75,.09+k*.936],[.073,.074,.047],ivory,true);
      fleck(body,[3.89,5.15,.10+k*.61],[.16,.12,.08],'#976638');
      body.ball([-.70,2.66,k*.52],[.88,.51,.54],'#f2aa78',null,false,true);
      // Butter-carved cowhide, hand-cut like the lifesized fair sculptures.
      plate(body,'butter/patch',[[-.83,.20],[-.47,.61],[-.04,.43],[.36,.51],[.70,.20],[.53,-.04],[.17,-.12],[-.07,-.44],[-.40,-.38],[-.46,-.11]],-.69,3.87,k*1.31,.13,'#dba341');
      const z=k*.78;
      for(const x of [-2.06,1.18]){
        body.rod([x,3.35,z],[x+.17,1.47,z],.37,.19,butterShadow,false,6);
        body.rod([x+.17,1.49,z],[x+.33,.86,z],.21,.18,butter,false,6);
        body.ball([x+.44,.79,z],[.44,.22,.30],'#a06b43',null,false,true);
        body.rod([x+.42,.74,z],[x+.43,.37,z],.085,.075,steel,false,5);
      }
      path(body,'butter/blade'+k,[[-2.65,.55,z],[-2.38,.30,z],[-1.75,.24,z],[1.67,.24,z],[1.99,.31,z],[2.29,.58,z]],.10,'#dcfff2',true,7,4);
    }
    body.finish();const tip=node(animal,-2.99,4.26,0),tail=builder(tip);
    path(tail,'butter/tail',[[0,0,0],[-.55,-.26,-.05],[-.63,-1.00,-.13],[-.86,-1.52,-.08]],.12,butterShadow,false,7);
    tail.ball([-.88,-1.58,-.08],[.26,.40,.23],butter,null,false,true);tail.finish();
    return (t,p)=>{const a=cowMotion(t,p);animal.position.set(a.x,1.13+a.jump,0);animal.rotation.set(0,a.twist,a.lean,'YXZ');tip.rotation.z=a.tail;};
  }
  function drawCow(c,t,p){
    const a=cowMotion(t,p);c.save();rect(c,-4.60,.35,9.2,.43,'#5b99a5');oval(c,0,.84,4.62,.48,teal);
    c.save();c.translate(a.x,1.13+a.jump);c.rotate(a.lean);c.scale(.71+.29*Math.cos(a.twist),1);
    for(const k of [-.27,.22]){for(const x of [-2.00,1.24])line(c,[[x+k,3.31],[x+k+.17,1.48],[x+k+.33,.82]],k<0?butterShadow:butter,.45);
      line(c,[[-2.60+k,.56],[-2.34+k,.28],[1.68+k,.25],[2.18+k,.57]],'#c7fbea',.16);}
    c.save();c.translate(-2.99,4.26);c.rotate(a.tail);line(c,[[0,0],[-.55,-.23],[-.66,-.97],[-.88,-1.62]],butterShadow,.23);oval(c,-.88,-1.61,.24,.36,butter);c.restore();
    oval(c,-.69,2.7,.88,.53,'#f3ad7b');oval(c,-.61,3.86,2.96,1.46,butter,.04);oval(c,1.57,4.47,1.08,1.52,butter,-.26);
    poly(c,[[-1.52,4.07],[-1.16,4.48],[-.73,4.30],[-.33,4.38],[.01,4.07],[-.16,3.83],[-.52,3.75],[-.76,3.43],[-1.09,3.49],[-1.15,3.76]],'#dba341');
    poly(c,[[2.20,5.97],[2.02,6.68],[1.88,6.92],[2.30,6.68],[2.52,6.11]],ivory);
    oval(c,2.64,5.46,1.09,1.0,lightButter,-.12);oval(c,3.53,5.02,.77,.49,'#f1b75a');oval(c,3.90,5.12,.12,.09,'#976638');
    oval(c,2.05,5.76,.67,.30,butterShadow,-.23);oval(c,2.90,5.69,.21,.23,dark);oval(c,2.96,5.76,.071,.072,ivory);c.restore();
    handbill(c,'BUTTER ON ICE','MINT / SALTED DIVISION',7.08,1.15,1.05,gold);c.restore();
  }

  const popRed='#d95162',popWhite='#fff2ce',popSky='#b5badb',popBrown='#be7f45';
  function fallAt(t,p,i){
    const u=t*.49+i*.213+.19*clamp(p),q=u-Math.floor(u);
    return {x:-2.30+i*1.12+.22*Math.sin(q*4+i)+p*.25*Math.sin(i),y:9.26-5.45*q*q,
      spin:q*4.3+i,scale:Math.min(1,q/.11,(1-q)/.12)};
  }
  function popMotion(t,p){p=clamp(p);return {lean:.075*Math.sin(t*1.5)+p*.40,cloud:.21*Math.sin(t*1.55)+p*.62,probe:-.40+.63*Math.sin(t*.94)+.95*p};}
  function kernel(b,x,y,z,r){
    fleck(b,[x,y,z],[r*.56,r*.58,r*.50],popBrown);
    for(const [dx,dy,dz,size] of [[-.35,.14,0,.57],[.27,.29,-.14,.59],[.0,.49,.26,.48]]){
      fleck(b,[x+dx*r,y+dy*r,z+dz*r],[size*r,size*r,size*r],popWhite);
    }
  }
  function weather(root,{builder,node,label}){
    const b=builder(root);pad(b,7.08,3.45,rose);
    // A striped popcorn carton is also the rain gauge.
    const striped=(p,n)=>Math.abs(n.y)>.8?popRed:Math.cos(Math.atan2(p.x,p.z)*6)>0?popWhite:popRed;
    profile(b,'popcorn/carton',[[0,0],[1.75,.01],[2.38,2.75],[2.24,2.75],[2.15,2.53]],[-.15,.65,0],[1,1,.65],striped,false,24);
    for(const s of [-1,1])b.rod([s*2.36,1.00,-1.11],[s*2.36,9.53,-1.11],.10,.081,steel,false,5);
    b.rod([-2.36,9.52,-1.11],[2.36,9.52,-1.11],.104,.104,steel,false,6);
    sign(b,root,label,'POPCORN DOPPLER','SOPHIE  /  KERNEL WEATHER SERVICE',6.83,1.09,1.62,1.50,rose);b.finish();
    const umbrella=node(root,.20,3.02,.10),canopy=builder(umbrella);
    canopy.rod([0,-.48,0],[0,2.99,0],.092,.080,steel,false,7);
    profile(canopy,'popcorn/umbrella',[[0,3.29],[.38,3.20],[1.51,3.02],[2.53,2.67],[3.14,2.18],[3.21,1.99]], [0,0,0],[1,1,.74],(p,n)=>Math.cos(Math.atan2(p.x,p.z)*5)>.15?'#5de0d6':'#55719b',false,20);
    for(const s of [-1,1])canopy.rod([0,2.25,0],[s*2.91,2.11,.06],.064,.041,ivory,false,5);
    canopy.finish();
    const cloud=node(root,0,10.04,0),cb=builder(cloud);
    for(const [x,y,r,z] of [[-2.75,-.15,1.18,.10],[-1.72,.46,1.62,-.12],[-.32,.74,1.82,.04],[1.29,.29,1.45,-.08],[2.61,-.13,1.05,.12]]){
      kernel(cb,x,y,z,r);
      cb.ball([x+.12,y-.42,z-.25],[r*.74,r*.45,r*.56],popSky,null,false,true);
    }
    cb.finish();
    const drops=[];
    for(let i=0;i<5;i++){const d=node(root,0,0,.60+i%2*.17),k=builder(d);kernel(k,0,0,0,.43);k.finish();drops.push(d);}
    // An offset brass dish scans the canopy from its own narrow pylon.
    const mast=builder(root);
    mast.rod([-3.05,.68,-.15],[-3.05,5.45,-.15],.15,.11,steel,false,6);mast.finish();
    const dish=node(root,-3.05,5.42,-.15),db=builder(dish);
    profile(db,'popcorn/dish',[[.16,0],[.49,.10],[.86,.24],[1.05,.43],[1.05,.51],[.76,.34],[.23,.16]], [0,0,0],[1,1,1],gold,false,12,[.49,0,0]);
    db.rod([0,.03,0],[0,1.03,.54],.047,.035,ivory,true,5);db.finish();
    return(t,p)=>{const a=popMotion(t,p);umbrella.rotation.z=a.lean;cloud.position.y=10.04+a.cloud;dish.rotation.z=a.probe;
      drops.forEach((d,i)=>{const f=fallAt(t,p,i);d.position.x=f.x;d.position.y=f.y;d.rotation.z=f.spin;d.scale.setScalar(.001+f.scale);});};
  }
  function drawWeather(c,t,p){
    const a=popMotion(t,p);c.save();rect(c,-3.54,0,7.08,.60,dark);
    for(const x of [-2.36,2.36])line(c,[[x,.65],[x,9.50]],steel,.16);
    poly(c,[[-1.90,.64],[1.60,.64],[2.23,3.4],[-2.52,3.4]],popWhite);
    for(const k of [-1,0,1]){const bx=-.15+k*1.00,tx=-.15+k*1.34;poly(c,[[bx-.24,.65],[bx+.24,.65],[tx+.42,3.4],[tx-.42,3.4]],popRed);}
    const base=10.04+a.cloud;
    for(const [x,y,r] of [[-2.7,-.14,1.10],[-1.62,.44,1.45],[-.25,.70,1.65],[1.35,.26,1.40],[2.65,-.12,1.04]]){
      oval(c,x,base+y-.36,r*.84,r*.50,popSky);oval(c,x-.23*r,base+y+.14*r,r*.6,r*.52,popWhite);oval(c,x+.28*r,base+y+.25*r,r*.59,r*.55,popWhite);}
    for(let i=0;i<5;i++){const f=fallAt(t,p,i);c.save();c.translate(f.x,f.y);c.rotate(f.spin);c.scale(f.scale,f.scale);
      oval(c,0,0,.26,.23,popBrown);oval(c,-.14,.06,.24,.25,popWhite);oval(c,.13,.11,.25,.22,ivory);c.restore();}
    c.save();c.translate(.20,3.02);c.rotate(a.lean);line(c,[[0,-.42],[0,3.25]],steel,.16);
    poly(c,[[-3.19,1.99],[-2.54,2.69],[-1.46,3.04],[0,3.29],[1.47,3.04],[2.54,2.69],[3.18,1.99],[1.65,2.18],[0,1.99],[-1.57,2.18]],'#56dbce');
    poly(c,[[0,3.29],[1.1,2.94],[1.65,2.18],[0,1.99]],'#5679a0');c.restore();
    line(c,[[-3.05,.63],[-3.05,5.42]],steel,.22);c.save();c.translate(-3.05,5.42);c.rotate(a.probe);
    poly(c,[[-1.02,.49],[-.73,.21],[-.15,0],[.30,.04],[.84,.30],[1.02,.49],[0,.23]],gold);
    line(c,[[0,.12],[0,1.02]],ivory,.08);c.restore();
    handbill(c,'POPCORN DOPPLER','SOPHIE / KERNEL WEATHER SERVICE',6.83,1.09,1.62,rose);c.restore();
  }

  const unionBlue='#3766a3',orange='#ff9a52',copper='#d28962';
  function stewardMotion(t,p){
    p=clamp(p);const cycle=.5+.5*Math.sin(t*1.33);return {rise:1.0+2.60*cycle+2.28*p,
      lid:-.71-.32*cycle-.23*p,head:.12*Math.sin(t*1.9)-.22*p,arm:.05+.15*Math.sin(t*2.2)+.95*p};
  }
  function steward(root,{builder,node,label}){
    const b=builder(root);pad(b,5.92,4.05,orange);
    b.box([0,1.99,0],[5.44,2.70,3.70],unionBlue);
    for(const s of [-1,1])b.box([s*2.61,1.99,1.85],[.17,2.54,.16],gold,null,true);
    b.box([0,3.35,0],[5.55,.19,3.83],gold);
    // An open black well reads as the source of the copper spring.
    b.box([0,3.47,0],[5.08,.06,3.45],dark);
    sign(b,root,label,'SHOP STEWARD','EDEN  /  LOCAL SPRING 2389',4.91,1.46,2.05,1.96,orange);b.finish();
    const lid=node(root,0,3.47,-1.77),l=builder(lid);
    l.box([0,0,1.82],[5.54,.22,3.66],'#365b94');l.box([0,.13,1.82],[4.96,.056,3.16],'#86b6b4');
    for(const x of [-1.62,0,1.62])l.box([x,-.133,1.84],[.19,.044,3.14],steel);l.finish();
    const spring=node(root,0,3.45,.23),s=builder(spring);
    const coil=geom('steward/helix',()=>{
      class Spring extends T.Curve{getPoint(u,target=new T.Vector3()){
        const a=TAU*4.5*u;return target.set(1.37*Math.cos(a),5*u,1.02*Math.sin(a));
      }}
      return new T.TubeGeometry(new Spring(),47,.11,5,false);
    });
    s.add(coil,[0,0,0],[1,1,1],null,copper);s.finish();
    const head=node(root,0,5,.21),h=builder(head);
    h.box([0,.79,0],[2.79,1.55,1.72],'#d0c3ad');h.box([0,.48,.89],[2.25,.29,.12],'#705468');
    for(let i=0;i<6;i++)h.box([-.86+i*.34,.51,.961],[.14,.15,.055],ivory);
    for(const x of [-.67,.67]){
      h.box([x,.99,.91],[.61,.52,.13],dark);h.box([x+.03,1.0,.991],[.27,.29,.04],teal,null,true);
      h.box([x,1.36,.91],[.72,.13,.13],frame,[0,0,x<0?-.14:.14]);
    }
    profile(h,'steward/helmet',[[.03,0],[1.65,.02],[1.68,.17],[1.40,.23],[1.30,.51],[1.01,.82],[.46,1.02],[.0,1.04]], [0,1.52,0],[1,1,.72],gold,false,16);
    h.box([0,2.32,0],[.21,.61,1.26],orange);
    h.rod([-1.33,.67,0],[-1.88,.10,.12],.175,.15,steel,false,7);h.rod([-1.88,.10,.12],[-2.28,.66,.24],.155,.14,steel,false,7);
    ell(h,[-2.26,.71,.24],[.31,.31,.28],gold);h.finish();
    const arm=node(head,1.31,.66,.19),a=builder(arm);
    a.rod([0,0,0],[.71,-.26,.01],.16,.14,steel,false,7);a.rod([.71,-.26,.01],[1.06,.32,.13],.14,.14,steel,false,7);
    a.box([1.27,.53,.17],[1.12,1.39,.21],'#9f694b',[0,0,-.10]);a.box([1.27,.53,.30],[.93,1.16,.07],ivory,[0,0,-.10]);
    for(let j=0;j<3;j++)a.box([1.26,.74-j*.22,.35],[.66,.066,.03],'#49506b',[0,0,-.10]);
    a.box([1.24,1.18,.31],[.55,.18,.14],steel);a.finish();
    return(t,p)=>{const a=stewardMotion(t,p);lid.rotation.x=a.lid;spring.scale.y=a.rise/5;head.position.y=3.46+a.rise;
      head.rotation.z=a.head;arm.rotation.z=a.arm;};
  }
  function drawSteward(c,t,p){
    const a=stewardMotion(t,p);c.save();rect(c,-2.97,0,5.94,.65,dark);rect(c,-2.72,.66,5.44,2.72,unionBlue);
    rect(c,-2.77,3.25,5.54,.20,gold);rect(c,-2.65,3.46,5.30,3.55*Math.sin(-a.lid),'#729899');
    const helix=[];for(let j=0;j<=45;j++){const u=j/45;helix.push([1.37*Math.cos(4.5*TAU*u),3.45+a.rise*u]);}line(c,helix,copper,.20);
    c.save();c.translate(0,3.46+a.rise);c.rotate(a.head);
    rect(c,-1.41,.02,2.82,1.54,'#d0c3ad');rect(c,-1.14,.31,2.28,.31,'#705468');
    for(const x of [-.67,.67]){rect(c,x-.31,.75,.62,.53,dark);rect(c,x-.11,.85,.26,.29,teal);}
    for(let j=0;j<6;j++)rect(c,-.95+j*.34,.43,.13,.16,ivory);
    poly(c,[[-1.63,1.51],[1.65,1.51],[1.63,1.73],[1.27,1.86],[1.08,2.31],[.46,2.52],[-.46,2.52],[-1.05,2.30],[-1.37,1.79],[-1.63,1.72]],gold);
    line(c,[[-1.31,.67],[-1.88,.14],[-2.22,.70]],steel,.29);oval(c,-2.26,.71,.27,.27,gold);
    c.save();c.translate(1.31,.66);c.rotate(a.arm);line(c,[[0,0],[.71,-.27],[1.05,.32]],steel,.28);
    rect(c,.69,-.14,1.13,1.36,copper);rect(c,.79,-.03,.93,1.14,ivory);for(let j=0;j<3;j++)rect(c,.90,.71-j*.22,.65,.06,frame);c.restore();c.restore();
    handbill(c,'SHOP STEWARD','EDEN / LOCAL SPRING 2389',4.91,1.46,2.05,orange);c.restore();
  }

  // The deep dish sits on edge in a testing frame. The sector cut out of the
  // pan has exactly the same two radial edges as the rising slice.
  const sliceA=.13*Math.PI,sliceB=.55*Math.PI,crust='#d69758',sauce='#aa4841',cheese='#ffcd66',pepper='#b3484a';
  function sectorPoints(r,a,b,inner=0,count=22){
    const pts=[];if(!inner)pts.push([0,0]);
    for(let i=0;i<=count;i++){const t=a+(b-a)*i/count;pts.push([r*Math.cos(t),r*Math.sin(t)]);}
    if(inner)for(let i=count;i>=0;i--){const t=a+(b-a)*i/count;pts.push([inner*Math.cos(t),inner*Math.sin(t)]);}
    return pts;
  }
  const sliceR=3.55,mainStart=sliceB,mainEnd=TAU+sliceA;
  function pizzaLayers(a,b,n){return {body:sectorPoints(sliceR,a,b,0,n),sauce:sectorPoints(3.37,a,b,0,n),
    cheese:sectorPoints(3.07,a,b,0,n),rim:sectorPoints(3.57,a,b,3.31,n)};}
  const pieLayers={whole:pizzaLayers(mainStart,mainEnd,25),slice:pizzaLayers(sliceA,sliceB,8)};
  const pepperoni=[[-1.23,1.69,.37],[-2.38,.11,.42],[-1.57,-1.55,.43],[.48,-2.20,.44],[2.05,-.97,.38],[-.54,.13,.39]];
  const slicePepperoni=[[1.02,1.40,.40],[1.85,1.77,.30]];
  const cheeseEnds=[.72,1.75,2.52,3.03].map((r,i)=>{const a=i%2?sliceB:sliceA;return [r*Math.cos(a),r*Math.sin(a)];});
  function pizzaMotion(t,p){
    p=clamp(p);const pull=.5+.5*Math.sin(t*1.28);
    return {dx:.30+.82*pull+1.33*p,dy:.43+1.11*pull+1.76*p,needle:-.63+.84*pull+.87*p};
  }
  function bakeSector(b,id,z){
    const whole=id==='whole',layers=pieLayers[id];
    plate(b,'pizza-base-'+id,layers.body,0,0,z,.40,crust);
    plate(b,'pizza-sauce-'+id,layers.sauce,0,0,z+.24,.13,sauce);
    plate(b,'pizza-cheese-'+id,layers.cheese,0,0,z+.34,.13,cheese);
    plate(b,'pizza-rim-'+id,layers.rim,0,0,z+.20,.37,'#e9b36b');
    const toppings=whole?pepperoni:slicePepperoni;
    for(const [x,y,r] of toppings){disc(b,x,y,z+.445,r,r*.92,.078,pepper,false,9);disc(b,x-r*.29,y+r*.14,z+.497,r*.14,r*.12,.025,'#ef915e',false,6);}
    for(const [x,y] of whole?[[-.71,2.54],[-1.21,-.63],[1.38,-1.42],[-2.53,.94]]:[[1.57,1.11]]){
      b.box([x,y,z+.46],[.29,.11,.056],'#657757',[0,0,x]);
    }
  }
  function pizza(root,{builder,node,label}){
    const b=builder(root);pad(b,9.81,3.12,rose);
    for(const x of [-3.47,3.47]){
      b.rod([x,.65,-1.02],[x*.57,5.76,-.62],.21,.16,frame,false,7);
      b.rod([x*.73,.69,-.90],[x*1.04,3.31,-.55],.125,.11,'#838e91',false,6);
    }
    b.box([0,2.14,-.51],[6.69,.30,1.06],steel);
    sign(b,root,label,'DEEP DISH TEST','CLINT  /  CHEESE TENSILE LAB',7.15,1.17,1.12,1.64,rose);
    disc(b,3.90,2.66,.29,.73,.73,.24,dark);disc(b,3.90,2.66,.44,.61,.61,.065,ivory,true,14);b.finish();
    const meter=node(root,3.9,2.66,.5),m=builder(meter);m.box([0,.22,0],[.082,.49,.056],rose,null,true);m.finish();
    const pan=node(root,-.44,4.80,0);pan.rotation.x=.14;const fixed=builder(pan);bakeSector(fixed,'whole',0);fixed.finish();
    const sling=node(pan),slice=builder(sling);bakeSector(slice,'slice',.004);slice.finish();
    const strings=cheeseEnds.map(([x,y],i)=>{
      const strand=node(pan,x,y,.30+i%2*.04),l=builder(strand);
      l.rod([0,0,0],[0,1,0],i%2?.074:.097,i%2?.069:.081,i%2?ivory:cheese,false,6);l.finish();return strand;
    });
    return(t,p)=>{const a=pizzaMotion(t,p);sling.position.set(a.dx,a.dy,0);meter.rotation.z=-a.needle;
      const axis=-Math.atan2(a.dx,a.dy),len=Math.hypot(a.dx,a.dy);
      for(const strand of strings){strand.rotation.z=axis;strand.scale.y=len;}};
  }
  function drawPizza(c,t,p){
    const a=pizzaMotion(t,p);c.save();rect(c,-4.9,0,9.8,.64,dark);
    for(const x of [-3.47,3.47])line(c,[[x,.66],[x*.57,5.76]],steel,.34);
    c.save();c.translate(-.44,4.80);
    function pie(layers,toppings){
      poly(c,layers.body,crust);poly(c,layers.sauce,sauce);poly(c,layers.cheese,cheese);
      for(const [x,y,r] of toppings){oval(c,x,y,r,r*.92,pepper);oval(c,x-r*.29,y+r*.14,r*.12,r*.11,'#ef915e');}
    }
    pie(pieLayers.whole,pepperoni);
    for(const [x,y] of cheeseEnds)line(c,[[x,y],[x+a.dx,y+a.dy]],'#ffdda0',.17);
    c.translate(a.dx,a.dy);pie(pieLayers.slice,slicePepperoni);c.restore();
    oval(c,3.90,2.66,.70,.70,ivory);line(c,[[3.90,2.66],[3.90+.49*Math.sin(a.needle),2.66+.49*Math.cos(a.needle)]],rose,.08);
    handbill(c,'DEEP DISH TEST','CLINT / CHEESE TENSILE LAB',7.15,1.17,1.12,rose);c.restore();
  }

  const mitten=[[-.62,-.93],[-.72,-.42],[-.79,.35],[-.65,.86],[-.36,1.14],[.06,1.21],[.41,1.01],[.58,.61],[.56,.20],[.82,.61],[1.05,.59],[1.17,.34],[1.08,.05],[.66,-.40],[.45,-.94]];
  const mittColors=['#f77392','#75dfcb','#ffc25f','#9ca4f1'];
  function mittenMotion(t,p,i){
    return {turn:t*.63+.39*clamp(p),y:3.79+.40*Math.sin(t*2.00+i*1.57)+(.49+.35*(i===1))*clamp(p),tilt:.14*Math.sin(t*2.28+i)-.52*clamp(p)};
  }
  function carousel(root,{builder,node,label}){
    const b=builder(root);
    upright(b,0,0,0,4.38,4.48,.51,'#60516f',false,20);
    upright(b,0,.51,0,4.46,4.43,.26,gold,true,20);
    upright(b,0,.77,0,4.42,4.24,.20,'#d4b38c',false,20);
    upright(b,0,.90,0,.52,.38,7.3,'#c5996c',false,10);
    for(let i=0;i<12;i++){const a=i*TAU/12;b.box([4.30*Math.cos(a),.38,4.30*Math.sin(a)],[.32,.15,.33],i%2?rose:ivory,null,true);}
    sign(b,root,label,'LOST MITTENS','SOPHIE  /  PAIRS MUST RIDE ALONE',6.69,1.02,1.02,4.44,rose);b.finish();
    const rotor=node(root),tent=builder(rotor);
    const stripe=p=>Math.cos(Math.atan2(p.x,p.z)*6)>0?'#ba4470':'#ffd5a9';
    profile(tent,'mitten/canopy',[[0,8.96],[.39,8.80],[1.35,8.24],[3.18,7.69],[4.41,7.57],[4.45,7.17],[4.18,7.13]], [0,0,0],[1,1,1],stripe,false,24);
    upright(tent,0,8.86,0,.13,.13,.82,'#d7b580',false,7);
    plate(tent,'carousel/flag',[[0,.09],[1.10,.32],[.66,.55],[.98,.76],[0,.71]],0,9.04,0,.095,teal,true);
    for(let i=0;i<4;i++){const a=i*TAU/4;upright(tent,3.0*Math.cos(a),1.12,3.0*Math.sin(a),.105,.095,6.21,gold,false,7);}
    tent.finish();
    const hands=[];
    for(let i=0;i<4;i++){
      const a=i*TAU/4,x=3.0*Math.cos(a),z=3.0*Math.sin(a),hand=node(rotor,x,3.6,z),h=builder(hand);
      hand.rotation.order='YXZ';hand.rotation.y=Math.atan2(x,z);
      plate(h,'carousel/mitten',mitten,0,0,0,.68,mittColors[i]);
      h.box([-.09,-.96,0],[1.23,.41,.74],ivory);
      for(const k of [-1,1]){
        h.rod([-.44,.33,k*.357],[-.03,.04,k*.357],.058,.06,ivory,false,5);
        h.rod([-.03,.04,k*.357],[.37,.33,k*.357],.058,.06,ivory,false,5);
        h.box([-.09,-.91,k*.38],[1.07,.085,.03],mittColors[i]);
      }
      h.finish();hands.push(hand);
    }
    return(t,p)=>{rotor.rotation.y=mittenMotion(t,p,0).turn;hands.forEach((h,i)=>{const a=mittenMotion(t,p,i);h.position.y=a.y;h.rotation.z=a.tilt;});};
  }
  function drawCarousel(c,t,p){
    c.save();const turn=mittenMotion(t,p,0).turn;rect(c,-4.38,.13,8.76,.52,'#756582');oval(c,0,.79,4.44,.51,gold);
    line(c,[[0,.82],[0,8.20]],steel,.48);
    const depth=[0,1,2,3].map(i=>({i,a:i*TAU/4-turn})).sort((a,b)=>Math.sin(a.a)-Math.sin(b.a));
    for(const {i,a} of depth){
      const x=3*Math.cos(a),dy=.25*Math.sin(a),q=mittenMotion(t,p,i);line(c,[[x,1.12+dy],[x,7.34+dy]],gold,.16);
      c.save();c.translate(x,q.y+dy);c.rotate(q.tilt);c.scale(.28+.72*Math.abs(Math.sin(a)),1);
      poly(c,mitten,mittColors[i]);rect(c,-.70,-1.16,1.23,.38,ivory);line(c,[[-.43,.31],[-.03,.04],[.37,.31]],ivory,.10);c.restore();
    }
    poly(c,[[-4.45,7.18],[-4.40,7.55],[-3.18,7.71],[-1.35,8.24],[0,8.99],[1.35,8.24],[3.18,7.71],[4.40,7.55],[4.45,7.18]],'#f2d4b7');
    for(let i=0;i<6;i++){const ang=turn+i*TAU/6;if(Math.sin(ang)<-.05)continue;
      poly(c,[[0,8.94],[4.39*Math.cos(ang-.21),7.54],[4.39*Math.cos(ang-.21),7.19],[4.39*Math.cos(ang+.21),7.19],[4.39*Math.cos(ang+.21),7.54]],'#ba4470');}
    line(c,[[0,8.85],[0,9.73]],gold,.13);poly(c,[[0,9.13],[1.02,9.37],[.67,9.57],[.98,9.78],[0,9.74]],teal);
    handbill(c,'LOST MITTENS','SOPHIE / PAIRS MUST RIDE ALONE',6.69,1.02,1.02,rose);c.restore();
  }

  const gumColors=['#fa89ad','#87f0d4','#ffca56','#af8dfc','#88d6f8','#f89b6b'];
  const gumOrbits=[[-1.33,-.92,-.17,.62],[.00,-1.38,.35,.46],[1.36,-.82,-.12,.65],[-.93,.26,.18,.71],[.78,.15,.51,.77],[.31,1.10,-.79,.47]];
  function gumAt(t,p,i){
    p=clamp(p);const [x,y,z,r]=gumOrbits[i],a=t*(.62+i*.045)+i*1.22;
    // The valve reverses local gravity. Interior candy packs against the top
    // hemisphere on a horn and settles back as the pulse decays.
    return {x:x+.15*Math.sin(a*1.7),y:y+(.20+.10*Math.cos(a))*(1+Math.sin(a))+p*(1.04-.36*y),z,r};
  }
  function gumMotion(t,p){p=clamp(p);return {lever:-.23+.15*Math.sin(t*.93)+p*1.69,orbit:t*.40+p*.79};}
  function gumball(root,{builder,node,label}){
    const b=builder(root);pad(b,5.57,3.61,violet);
    profile(b,'gum/pedestal',[[0,0],[2.52,.05],[2.50,.42],[2.03,1.25],[1.83,3.04],[2.42,3.40],[2.37,3.62],[0,3.62]], [0,.64,0],[1,1,.79],'#ad4e6b',false,20);
    profile(b,'gum/shoe',[[2.47,0],[2.56,.05],[2.55,.16],[2.43,.23]],[0,.86,0],[1,1,.79],gold,true,20);
    disc(b,0,2.87,1.51,.64,.64,.17,'#364052',false,14);
    disc(b,0,2.87,1.63,.48,.48,.11,steel,false,12);
    b.box([0,1.56,1.99],[1.23,.47,.19],dark);
    b.box([0,1.34,2.11],[1.39,.13,.47],steel);
    sign(b,root,label,'GUMBALL GRAVITY','MINT  /  ONE G PER QUARTER',5.27,.82,.69,2.08,violet);
    // Open metal meridians give the sphere a transparent silhouette while
    // keeping the candy visible in the game software rasterizer.
    const cy=6.87,rx=3.12,ry=3.19;
    for(let i=0;i<6;i++){
      const az=i*TAU/6+.17,pts=[];
      for(let j=0;j<=10;j++){
        const u=-1.10+j*.225,k=Math.cos(u);
        pts.push([rx*k*Math.cos(az),cy+ry*Math.sin(u),rx*k*Math.sin(az)*.84]);
      }
      path(b,'gum/meridian'+i,pts,i%3===0?.085:.054,i%3===0?'#b9ebe8':'#65a0af',i%3===0,9,3);
    }
    upright(b,0,9.70,0,1.40,1.52,.19,steel,false,16);
    profile(b,'gum/lid',[[1.51,0],[1.55,.17],[1.20,.44],[.36,.54],[.30,.63]], [0,9.86,0],[1,1,.87],'#bd657f',false,16);
    b.ball([0,10.55,0],[.32,.30,.32],gold,null,false,true);b.finish();
    const handle=node(root,0,2.87,1.75),lever=builder(handle);
    lever.box([0,0,0],[1.62,.22,.24],ivory);
    for(const x of [-.83,.83])disc(lever,x,0,.03,.21,.21,.29,teal,true,9);
    lever.finish();
    const candy=gumOrbits.map((v,i)=>{
      const g=node(root,v[0],cy+v[1],v[2]),sweet=builder(g),r=v[3];
      ell(sweet,[0,0,0],[r,r,r],gumColors[i],true);
      fleck(sweet,[-.23*r,.33*r,.81*r],[.17*r,.11*r,.065*r],'#fff4dd',true);
      if(i===4)sweet.add(geom('gum/orbit ring',()=>new T.TorusGeometry(1.12,.069,4,18)),[0,0,0],[1,1,1],[1.03,.23,-.21],ivory,true);
      sweet.finish();return g;
    });
    return(t,p)=>{const m=gumMotion(t,p);handle.rotation.z=m.lever;candy.forEach((g,i)=>{const a=gumAt(t,p,i);g.position.set(a.x,cy+a.y,a.z);if(i===4)g.rotation.y=.52*Math.sin(m.orbit);});};
  }
  function drawGumball(c,t,p){
    const a=gumMotion(t,p);c.save();rect(c,-2.78,0,5.56,.60,dark);
    poly(c,[[-2.5,.64],[2.5,.64],[2.14,1.77],[1.83,3.65],[2.44,4.10],[2.31,4.24],[-2.31,4.24],[-2.44,4.10],[-1.83,3.65],[-2.14,1.77]],'#b75671');
    c.strokeStyle='#9acdd2';c.lineWidth=.17;c.beginPath();c.ellipse(0,6.87,3.1,3.19,0,0,TAU);c.stroke();
    for(let i=0;i<6;i++){
      const q=gumAt(t,p,i);oval(c,q.x,6.87+q.y,q.r,q.r,gumColors[i]);oval(c,q.x-.21*q.r,6.87+q.y+.32*q.r,.15*q.r,.105*q.r,ivory);
      if(i===4){c.strokeStyle=ivory;c.lineWidth=.11;c.beginPath();c.ellipse(q.x,6.87+q.y,1.11,.35,-.20+.26*Math.sin(a.orbit),0,TAU);c.stroke();}
    }
    for(const s of [-1,1]){
      const pts=[];for(let j=0;j<=10;j++){const u=-1.10+j*.225;pts.push([s*1.42*Math.cos(u),6.87+3.19*Math.sin(u)]);}
      line(c,pts,'#8fb9c2',.076);
    }
    poly(c,[[-1.50,9.74],[1.50,9.74],[1.54,10.04],[1.13,10.33],[.27,10.46],[-.27,10.46],[-1.15,10.33],[-1.53,10.04]],'#cb7890');
    oval(c,0,10.57,.31,.29,gold);oval(c,0,2.87,.61,.61,frame);
    c.save();c.translate(0,2.87);c.rotate(a.lever);line(c,[[-.83,0],[.83,0]],ivory,.22);for(const x of [-.83,.83])oval(c,x,0,.20,.20,teal);c.restore();
    rect(c,-.61,1.33,1.22,.38,dark);handbill(c,'GUMBALL GRAVITY','MINT / ONE G PER QUARTER',5.27,.82,.69,violet);c.restore();
  }

  const brass='#e9a94e',brassShadow='#a76b45',silverKey='#daecdf';
  const brassLoops=[
    {key:'outer',pts:[[1.43,6.70,-.05],[1.64,5.60,-.10],[1.71,3.16,-.18],[1.25,2.28,-.19],
      [.20,1.84,-.17],[-1.55,2.00,-.17],[-2.13,2.91,-.09],[-2.11,4.41,.04],[-1.87,5.10,.11],[-1.16,5.32,.12],[-.72,4.91,.15]],radius:.34,n:24},
    {key:'inner',pts:[[-.72,4.91,.15],[-.54,4.24,.20],[-.74,3.31,.29],[-.50,2.92,.36],[.10,2.82,.35],[.54,3.19,.33],[.51,4.59,.30]],radius:.19,n:17},
    {key:'lead',pts:[[.54,4.59,.30],[.13,4.88,.35],[-.89,4.92,.38],[-1.28,5.28,.25],[-1.77,5.72,.15],[-2.55,5.80,.09],[-2.93,6.01,.07]],radius:.14,n:13}
  ];
  function tubaMotion(t,p){p=clamp(p);return {bell:.30+.15*Math.sin(t*.87)+p*.54,
    phase:t*.58+.17*p,key:t*3.8,p};}
  function musicAt(t,p,i){
    const m=tubaMotion(t,p),z=m.phase+i*.37,q=z-Math.floor(z);
    return {x:2.72-2.60*q+.38*Math.sin(q*4+i),y:8.3+4.62*q+1.36*m.p,tilt:-.22+.27*Math.sin(q*5+i),s:Math.max(0,Math.min(1,q/.14,(1-q)/.24))};
  }
  function tuba(root,{builder,node,label}){
    const b=builder(root);pad(b,8.25,3.39,gold);
    for(const x of [-2.15,1.42]){
      b.box([x,1.12,-.16],[.64,.93,1.44],'#4e5368');b.box([x,1.65,-.16],[1.09,.21,1.77],steel);
    }
    for(const v of brassLoops)path(b,'eden/tuba/'+v.key,v.pts,v.radius,v.key==='outer'?brass:brassShadow,false,v.n);
    b.rod([-2.94,6.02,.07],[-3.30,6.20,.08],.16,.31,ivory,false,12);
    for(let i=0;i<3;i++){
      const x=-.98+.49*i;b.rod([x,3.50,.50],[x,5.46,.50],.16,.16,brass,false,8);
      b.rod([x,5.39,.50],[x,5.58,.50],.205,.208,silverKey,false,8);
    }
    sign(b,root,label,'MUNICIPAL TUBA','EDEN  /  DEPARTMENT OF VOLUME',6.79,1.07,1.02,1.59,gold);b.finish();
    const bell=node(root,1.43,5.95,-.06),horn=builder(bell);
    profile(horn,'eden/tuba/bell',[[.34,0],[.45,.76],[.54,1.52],[.82,2.06],[1.28,2.52],[1.97,2.89],[2.32,3.03],[2.39,3.12],[2.35,3.21],[2.18,3.18],[1.81,2.98],[1.22,2.62],[.73,2.15],[.43,1.48],[.32,.08]],
      [0,0,0],[1,1,1],(q,n)=>q.y>3.05?'#ffda71':q.x*n.x+q.z*n.z<0?'#925a45':brass,false,20);
    horn.finish();
    const keys=[];for(let i=0;i<3;i++){const k=node(root,-.98+.49*i,5.48,.50),v=builder(k);
      upright(v,0,0,0,.073,.072,.37,silverKey,false,6);upright(v,0,.33,0,.21,.22,.12,ivory,false,9);v.finish();keys.push(k);}
    const notes=[];for(let i=0;i<3;i++){
      const g=node(root),n=builder(g),color=[teal,rose,gold][i];
      ell(n,[-.22,0,0],[.37,.23,.16],color,true,[0,0,.23]);
      n.box([.08,.47,0],[.105,.97,.105],color,null,true);
      plate(n,'tuba/eighth',[[.03,.99],[.41,.86],[.60,.63],[.53,.51],[.24,.69],[.03,.73]],0,0,0,.095,color,true);
      n.finish();notes.push(g);
    }
    return(t,p)=>{const a=tubaMotion(t,p);bell.rotation.set(a.bell,0,-.18,'YXZ');
      keys.forEach((k,i)=>{k.position.y=5.48-.13*(.5+.5*Math.cos(a.key+i*1.8))-.22*a.p;});
      notes.forEach((n,i)=>{const q=musicAt(t,p,i);n.position.set(q.x,q.y,1.31);n.rotation.z=q.tilt;n.scale.setScalar(.001+q.s);});};
  }
  function drawTuba(c,t,p){
    const m=tubaMotion(t,p);c.save();rect(c,-4.12,0,8.24,.64,dark);for(const x of [-2.15,1.42])rect(c,x-.34,.66,.68,.9,frame);
    for(const v of brassLoops){const path=v.pts.map(([x,y])=>[x,y]);line(c,path,brassShadow,v.radius*2.25);line(c,path,brass,v.radius*1.44);}
    for(let i=0;i<3;i++){const x=-.98+i*.49,dy=-.13*(.5+.5*Math.cos(m.key+i*1.8))-.22*m.p;rect(c,x-.13,3.48,.26,1.99,brass);rect(c,x-.06,5.38,.12,.43+dy,silverKey);oval(c,x,5.89+dy,.21,.08,ivory);}
    const by=5.95+3.12*Math.cos(m.bell),bx=1.43+3.12*.18;
    poly(c,[[1.13,5.95],[1.82,5.95],[2.02,by-1.42],[2.94,by-.57],[bx+2.36,by],
      [bx-2.36,by],[.79,by-.59],[1.03,by-1.36]],brass);
    oval(c,bx,by,2.34,.24+1.14*Math.sin(m.bell),gold,.12);
    oval(c,bx,by+.02,2.16,.19+1.04*Math.sin(m.bell),brassShadow,.12);oval(c,bx+.06,by+.02,.59,.16,'#654750',.12);
    for(let i=0;i<3;i++){const a=musicAt(t,p,i),ink=[teal,rose,gold][i];c.save();c.translate(a.x,a.y);c.rotate(a.tilt);c.scale(a.s,a.s);
      oval(c,-.22,0,.37,.23,ink,.23);rect(c,.03,0,.105,.99,ink);poly(c,[[.03,.99],[.41,.86],[.60,.63],[.53,.51],[.24,.69],[.03,.73]],ink);c.restore();}
    handbill(c,'MUNICIPAL TUBA','EDEN / DEPARTMENT OF VOLUME',6.79,1.07,1.02,gold);c.restore();
  }

  // Envelopes include the moving geometry and the full horn pose. The first
  // radius is measured from the ground origin; the footprint lies in X/Z.
  return [
    {id:'strip-rat-race',crew:'Clint',name:'Rat Race Dyno',f:.070,off:28,radius:11.35,footprintRadius:5.48,width:10.44,height:11.33,ink:teal,reply:'That rat just made six horsepower.',sound:'steam',build:rat,draw:drawRat},
    {id:'strip-exact-change',crew:'Mint',name:'Exact Change Cat',f:.319,off:-29,radius:9.90,footprintRadius:4.89,width:9.28,height:9.74,ink:gold,reply:'Nine lives. No refunds.',sound:'bell',build:cat,draw:drawCat},
    {id:'strip-last-blink',crew:'Sophie',name:'Last Blink Photo Finish',f:.550,off:32,radius:10.52,footprintRadius:5.85,width:11.64,height:10.48,ink:rose,reply:'You blinked. The track saw everything.',sound:'cheer',build:eye,draw:drawEye},
    {id:'strip-axle-claw',crew:'Eden',name:'Axle Claw',f:.852,off:-30,radius:11.37,footprintRadius:5.82,width:10.70,height:9.98,ink:violet,reply:'The claw wants the other three.',sound:'bleep',build:crane,draw:drawCrane},
    {id:'strip-bascule-ballet',crew:'Clint',name:'Bascule Ballet',f:.32,off:38,radius:10.61,footprintRadius:7.30,width:14.44,height:9.31,ink:teal,reply:'The tugboat has the right of whey. It is carrying cheese.',sound:'bell',build:bridge,draw:drawBridge},
    {id:'strip-butter-revue',crew:'Mint',name:'Butter Cow Ice Revue',f:.74,off:19,radius:10.20,footprintRadius:5.93,width:10.84,height:9.70,ink:gold,reply:'She stuck the landing. Salted division.',sound:'cheer',build:cow,draw:drawCow},
    {id:'strip-popcorn-doppler',crew:'Sophie',name:'Popcorn Doppler',f:.041,off:-23,radius:13.38,footprintRadius:4.28,width:8.48,height:13.35,ink:rose,reply:'Large butter front moving in off the lake.',sound:'bleep',build:weather,draw:drawWeather},
    {id:'strip-shop-steward',crew:'Eden',name:'Spring Shop Steward',f:.400,off:-23,radius:12.29,footprintRadius:3.65,width:7.05,height:12.17,ink:orange,reply:'The spring would like a word about overtime.',sound:'bell',build:steward,draw:drawSteward},
    {id:'strip-pizza-pull',crew:'Clint',name:'Deep-Dish Tensile Test',f:.25,off:25,radius:12.01,footprintRadius:5.45,width:10.66,height:11.73,ink:rose,reply:'The cheese held. The clipboard snapped.',sound:'steam',build:pizza,draw:drawPizza},
    {id:'strip-mitten-carousel',crew:'Sophie',name:'Lost Mitten Carousel',f:.680,off:-32,radius:9.97,footprintRadius:5.67,width:9.04,height:9.92,ink:rose,reply:'The blue one recognized you.',sound:'cheer',build:carousel,draw:drawCarousel},
    {id:'strip-gumball-gravity',crew:'Mint',name:'Gumball Gravity Well',f:.32,off:19,radius:10.96,footprintRadius:3.50,width:6.42,height:10.96,ink:violet,reply:'For another quarter we can turn gravity back on.',sound:'coin',build:gumball,draw:drawGumball},
    {id:'strip-municipal-tuba',crew:'Eden',name:'Municipal Tuba',f:.93,off:-27,radius:14.55,footprintRadius:5.06,width:8.78,height:14.47,ink:gold,reply:'The tuba has filed a noise complaint.',sound:'brass',build:tuba,draw:drawTuba}
  ];
})();

export {MTMStripMidway};
