/* Kinetic roadside art for Feedback Loop. Each rigid section shares a mesh;
   every pose is a pure function of replay time and the local horn pulse. */
import { MTMKit } from './kit.js';
import { MTMOddities } from './oddities.js';

const MTMLoopMidway = (() => {
  'use strict';

  const tau=2*Math.PI;
  const night='#11192c',shadow='#25304a',steel='#61748e',alloy='#b2c5cb';
  const mint='#70ffcc',ice='#a3f6ff',pink='#ff5aab',violet='#a17afc';
  const gold='#ffd767',cream='#fff2ce',cherry='#f85362';

  function prism(b,points,depth,pos,shade,lit=false) {
    const shape=new THREE.Shape(points.map(([x,y])=>new THREE.Vector2(x,y)));
    const geo=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:5});
    b.add(geo,pos,[1,1,1],null,shade,lit);geo.dispose();
  }
  function surface(b,profile,sides,pos,shade) {
    const geo=new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r,y)),sides);
    b.add(geo,pos,[1,1,1],null,shade);geo.dispose();
  }
  function tube(b,points,r,shade,lit=false,segments=16,rings=6) {
    const curve=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v)));
    const geo=new THREE.TubeGeometry(curve,segments,r,rings,false);
    b.add(geo,[0,0,0],[1,1,1],null,shade,lit);geo.dispose();
  }
  function bezel(b,pos,r,thickness,shade,lit=false,segments=22) {
    const geo=new THREE.TorusGeometry(r,thickness,5,segments);
    b.add(geo,pos,[1,1,1],null,shade,lit);geo.dispose();
  }
  function faceDisk(b,x,y,z,r,depth,shade,lit=false,sides=12) {
    b.rod([x,y,z-depth*.5],[x,y,z+depth*.5],r,r,shade,lit,sides);
  }
  function zig(b,points,r,shade,lit=false,sides=6) {
    for(let i=1;i<points.length;i++) b.rod(points[i-1],points[i],r,r,shade,lit,sides);
  }

  // Canvas drawings use the same world dimensions, forward view and animation
  // phase as their mesh counterparts. Positive Y is up in this coordinate system.
  const {paint} = MTMKit, poly = paint.poly, rect = paint.rect, stroke = paint.stroke;
  const disk = (g,x,y,rx,ry,ink) => paint.oval(g,x,y,rx,ry,ink);
  const pipeHeights=[7.5,9.0,11.25,13.6,12.6,10.25,8.75,7.3];
  const keyXs=[-3.82,-2.82,-1.82,-.82,.18,1.18,2.18,3.18];
  const keyPress=(t,index,pulse)=>.10+.37*Math.max(0,Math.cos(t*3.1-index*1.29))**3+.34*pulse;

  function organ(parent,{builder,node,label}) {
    const b=builder(parent);
    b.box([0,.34,-.12],[10.75,.68,4.18],night);
    for(const side of [-1,1]){
      b.box([side*4.55,.78,0],[1.14,.32,3.53],steel);
      for(const z of [-1,1])b.rod([side*4.54,.91,z],[side*4.15,3.42,z*.90],.31,.23,'#74729c',false,7);
      b.box([side*4.32,2.35,1.00],[.20,1.46,.23],violet,null,true);
    }
    b.box([0,3.44,0],[10.25,.60,3.80],'#4e5488');
    b.box([0,3.79,.23],[9.90,.33,3.46],night);
    b.box([0,3.50,1.92],[9.16,.13,.11],mint,null,true);
    // Pipe bells sit behind the keybed. A black throat and lower lip make every
    // pipe read as hollow, even against the trees behind the console.
    for(let j=0;j<pipeHeights.length;j++) {
      const x=-4.27+j*1.22,z=-.91-.13*(j%2),h=pipeHeights[j],r=.42+.055*(j%3);
      b.rod([x,3.4,z],[x,h-.68,z],r*.71,r,'#839aab',false,9);
      b.rod([x,h-.84,z],[x,h,z],r*.95,r*1.31,j%2?'#bcd0cd':'#9fbcc1',false,9);
      b.rod([x,h+.006,z],[x,h+.029,z],r*1.15,r*1.10,night,false,9);
      b.rod([x,h-.15,z],[x,h-.029,z],r*1.30,r*1.31,j%2?mint:ice,true,9);
      b.box([x,5.02+.14*(j%2),z+r*.90],[r*1.22,.43,.14],night);
      b.box([x,4.83+.14*(j%2),z+r*.99],[r*1.32,.095,.09],pink,null,true);
    }
    for(let j=0;j<3;j++) {
      const x=-3.6+j*3.60;
      b.box([x,1.45,1.54],[1.16,.47,.22],shadow);
      for(let i=0;i<3;i++)b.box([x-.36+i*.36,1.45,1.67],[.20,.16,.07],i===j?pink:mint,null,true);
    }
    b.finish();
    const keys=[];
    for(let i=0;i<3;i++) {
      const row=node(parent),k=builder(row);
      for(let j=i;j<keyXs.length;j+=3) {
        const x=keyXs[j];
        k.box([x,4.02,1.14],[.93,.54,2.08],j%3?'#e5e3cd':'#fff0c4',[-.12,0,0]);
        k.box([x,3.89,2.09],[.80,.16,.14],j%2?'#667790':'#7b6f80');
        if(j!==2&&j!==6)k.box([x+.41,4.35,.62],[.53,.48,1.24],night,[-.13,0,0]);
      }
      k.finish();keys.push(row);
    }
    const eject=node(parent,-3.39,4.96,.10),e=builder(eject);
    e.box([0,0,0],[2.34,.78,1.63],'#ab374c');
    e.box([0,.36,-.03],[2.12,.26,1.41],cherry);
    e.box([0,-.39,.20],[.85,.47,.68],'#5c4366');
    e.finish();label(eject,'ESC','',1.72,.48,.02,.832,cream);
    const lights=node(parent,0,0,0),l=builder(lights);
    for(const [j,h] of pipeHeights.entries()) {
      const x=-4.27+j*1.22;
      l.box([x,h+.34,-1.0],[.20,.48,.20],j%2?pink:mint,null,true);
    }
    l.finish();
    return (t,pulse=0)=>{
      keys.forEach((p,i)=>{p.position.y=-keyPress(t,i,pulse);});
      eject.position.y=4.91+.12*Math.sin(t*2.2)+1.62*pulse;
      eject.rotation.z=.065*Math.sin(t*2.2)-.22*pulse;
      lights.position.y=.045*Math.sin(t*3.1)+.32*pulse;
    };
  }
  function drawOrgan(g,t,pulse=0) {
    g.save();
    rect(g,-5.37,0,10.74,.62,night);
    for(const side of [-1,1]) {
      stroke(g,[[side*4.55,.52],[side*4.13,3.5]],steel,.59);
      stroke(g,[[side*4.48,1.0],[side*4.17,3.24]],violet,.11);
    }
    for(const [i,h] of pipeHeights.entries()){
      const x=-4.27+i*1.22,r=.42+.055*(i%3);
      poly(g,[[x-r*.70,3.2],[x-r,h-.72],[x-r*1.3,h],[x+r*1.3,h],[x+r,h-.72],[x+r*.70,3.2]],i%2?'#92aebd':'#7189ab');
      rect(g,x-r*.47,3.72,.17,h-4.0,'#c4d6d7');
      disk(g,x,h,r*1.30,.115,i%2?mint:ice);disk(g,x,h+.012,r*.96,.062,night);
      rect(g,x-r*.63,4.82,r*1.26,.4,night);
      disk(g,x,h+.35+.32*pulse,.11,.22,i%2?pink:mint);
    }
    rect(g,-5.13,3.14,10.26,.66,'#555782');rect(g,-4.80,3.46,9.6,.13,mint);
    for(const [j,x] of keyXs.entries()){
      const y=4.02-keyPress(t,j%3,pulse);
      rect(g,x-.47,y-.14,.91,.70,j%3?'#eadfc9':'#fff2d4');rect(g,x-.47,y-.17,.91,.18,'#8292a3');
      if(j!==2&&j!==6)rect(g,x+.18,y+.24,.48,.64,night);
    }
    g.translate(-3.39,4.91+.12*Math.sin(t*2.2)+1.62*pulse);g.rotate(.065*Math.sin(t*2.2)-.22*pulse);
    rect(g,-1.16,-.39,2.32,.78,'#bc4257');rect(g,-1.05,.23,2.10,.22,cherry);
    stroke(g,[[-.24,.13],[-.62,.13],[-.62,-.17],[-.24,-.17]],cream,.06);
    stroke(g,[[-.62,-.02],[-.34,-.02]],cream,.055);
    stroke(g,[[.18,.13],[-.11,.13],[-.11,-.015],[.15,-.015],[.15,-.17],[-.14,-.17]],cream,.055);
    stroke(g,[[.61,.13],[.33,.13],[.33,-.17],[.61,-.17]],cream,.06);
    g.restore();
  }

  const noodlePoints=[[0,0,0],[.60,-.70,-.04],[.36,-1.53,.09],[-.48,-2.22,.24],[-.36,-3.04,.23],[.54,-3.70,.08],[.70,-4.48,-.10],[-.27,-5.06,.04],[-.32,-5.68,.21],[.20,-6.17,.36]];
  const spill=(t,p)=>.81+.11*Math.sin(t*1.19)+.26*p;
  function noodleCrane(parent,{builder,node}) {
    const b=builder(parent);
    // A porcelain soup bowl sits beside a wheeled lattice crane. The bowl's
    // sloping profile carries an uninterrupted lacquer-red stripe around its rim.
    const bowlX=1.47;
    surface(b,[[.08,.45],[1.49,.45],[1.74,.72],[2.63,1.35],[3.49,2.61],[3.61,3.07],[3.62,3.35],[3.48,3.48],[3.33,3.28]],20,[bowlX,0,.28],
      (v,n)=>v.y>3.31?'#ffd1a6':v.y>2.97?cherry:v.y<1.5?'#9b4253':'#da685e');
    b.rod([bowlX,3.22,.28],[bowlX,3.27,.28],3.34,3.34,'#ba7950',false,20);
    for(let j=0;j<12;j++){
      const a=j*tau/12,x=bowlX+Math.cos(a)*3.4,z=.28+Math.sin(a)*3.4;
      b.box([x,2.76,z],[.26,.28,.26],cream,[0,0,.76]);
    }
    b.ball([bowlX+1.13,3.38,.65],[.94,.18,.62],cream,null,false,true);
    b.ball([bowlX+1.26,3.53,.68],[.36,.15,.34],gold,null,true,true);
    for(let j=0;j<9;j++){
      const a=j*2.3999,r=1.15+(j%3)*.48;
      b.box([bowlX+Math.cos(a)*r,3.35,.28+Math.sin(a)*r],[.50,.13,.18],j%2?mint:'#70b779',[0,j*1.23,0]);
    }
    b.box([-3.72,.42,-.85],[2.91,.84,3.24],night);
    b.box([-3.72,.98,-.85],[2.80,.34,3.07],'#b05a54');
    for(const z of [-1.96,.23]){
      faceDisk(b,-4.38,.45,z,.39,.19,steel,false,8);faceDisk(b,-3.05,.45,z,.39,.19,steel,false,8);
    }
    const side=-3.76,back=-.89;
    for(const x of [-.56,.56])for(const z of [-.42,.42]){
      b.rod([side+x,1.0,back+z],[side+x*.50,9.91,back+z*.67],.13,.105,'#e88357',false,6);
    }
    for(let j=0;j<5;j++) {
      const x0=.54-j*.045,h=1.20+j*1.68;
      b.rod([side-x0,h,back+.4],[side+x0*.93,h+1.63,back+.36],.095,.085,j%2?gold:'#db7556',false,6);
    }
    zig(b,[[side,9.65,back],[-2.86,11.40,back],[1.36,10.84,back],[2.10,9.96,back]],.16,'#e4a55d');
    zig(b,[[side,9.65,back],[2.10,9.96,back]],.135,'#f68d57');
    for(let j=0;j<4;j++){
      const a=-2.8+j*1.17,h=11.38-j*.16;
      b.rod([a,h,back],[a+.53,9.83+j*.045,back],.075,.075,gold,false,5);
    }
    b.box([-3.75,3.82,-.24],[1.64,1.18,1.40],'#ca6458');
    b.box([-3.75,3.98,.485],[1.16,.67,.055],ice,null,true);
    b.rod([1.50,10.0,-.87],[1.50,10.0,.72],.28,.26,steel,false,10);
    for(const side of [-1,1]) b.rod([.55+side*.27,8.47,-.35],[2.1+side*.25,11.98,-.74],.093,.175,'#e68443',false,7);
    b.finish();
    const reel=node(parent,1.51,10.04,.57),r=builder(reel);
    faceDisk(r,0,0,0,1.15,.34,'#dbb25f',false,18);
    faceDisk(r,0,0,.18,.91,.08,night,false,16);
    for(let j=0;j<6;j++){
      const a=j*tau/6;
      r.rod([Math.cos(a)*.30,Math.sin(a)*.30,.24],[Math.cos(a)*.87,Math.sin(a)*.87,.24],.087,.087,mint,true,5);
    }
    faceDisk(r,0,0,.28,.28,.15,cherry,true,10);r.finish();
    const strip=node(parent,1.61,9.25,.50),n=builder(strip);
    tube(n,noodlePoints,.203,'#ffca59',true,30,7);
    tube(n,noodlePoints.map(v=>[v[0]-.064,v[1],v[2]+.173]),.034,cream,true,26,4);
    n.finish();
    return (t,pulse=0)=>{
      reel.rotation.z=-.90*t+.88*pulse;
      strip.scale.set(1,.99*spill(t,pulse),1);
      strip.rotation.z=.048*Math.sin(t*1.85)-.089*pulse;
    };
  }
  function drawCrane(g,t,pulse=0) {
    g.save();
    rect(g,-5.14,0,2.9,.72,night);rect(g,-5.06,.68,2.73,.50,'#ae5e59');
    const foot=-3.76;
    stroke(g,[[foot-.54,1],[foot-.28,9.84],[foot+.29,9.84],[foot+.55,1]],'#e68355',.23);
    for(let j=0;j<5;j++)stroke(g,[[foot-.53+j*.044,1.15+j*1.68],[foot+.51-j*.044,2.78+j*1.68]],gold,.14);
    stroke(g,[[foot,9.70],[-2.86,11.40],[1.36,10.84],[2.1,9.96],[foot,9.70]],'#f18b5d',.28);
    for(let j=0;j<4;j++)stroke(g,[[-2.8+j*1.17,11.38-j*.16],[-2.27+j*1.17,9.83+j*.045]],gold,.13);
    rect(g,-4.57,3.22,1.64,1.18,'#cc6057');rect(g,-4.32,3.67,1.13,.52,ice);
    for(const s of [-1,1])stroke(g,[[.55+s*.27,8.47],[2.1+s*.25,11.98]],'#ee9857',.18);
    g.save();g.translate(1.51,10.04);g.rotate(-.9*t+.88*pulse);disk(g,0,0,1.16,1.16,'#d4af67');disk(g,0,0,.91,.91,night);
    for(let k=0;k<6;k++){const a=k*tau/6;stroke(g,[[Math.cos(a)*.27,Math.sin(a)*.27],[Math.cos(a)*.83,Math.sin(a)*.83]],mint,.15);}
    disk(g,0,0,.27,.27,cherry);g.restore();
    const bx=1.47;
    poly(g,[[bx-3.62,3.39],[bx+3.62,3.39],[bx+3.45,2.61],[bx+2.66,1.35],[bx+1.50,.45],[bx-1.50,.45],[bx-2.66,1.35],[bx-3.45,2.61]],'#d76763');
    disk(g,bx,3.36,3.62,.48,'#ffb18e');disk(g,bx,3.38,3.39,.35,'#ad7651');
    for(let j=-2;j<=2;j++)poly(g,[[bx+j*1.19-.17,2.60],[bx+j*1.19,2.77],[bx+j*1.19+.17,2.60],[bx+j*1.19,2.43]],cream);
    disk(g,bx+1.06,3.44,.76,.18,cream);disk(g,bx+1.11,3.49,.33,.13,gold);
    g.translate(1.61,9.25);g.rotate(.048*Math.sin(t*1.85)-.089*pulse);g.scale(1,.99*spill(t,pulse));
    const points=noodlePoints.map(p=>[p[0],p[1]]);stroke(g,points,gold,.41);
    stroke(g,points.map(v=>[v[0]-.04,v[1]+.025]),cream,.066);
    g.restore();
  }

  // The two intersecting arcs make a solid crescent with a deep interior bite.
  const crescent=(()=>{
    const out=[],a=1.00;
    for(let i=0;i<=18;i++) {
      const angle=a+(tau-2*a)*i/18;out.push([1.55*Math.cos(angle),1.55*Math.sin(angle)]);
    }
    for(let i=1;i<15;i++){
      const angle=-Math.PI/2-Math.PI*i/15;
      out.push([1.55*(Math.cos(a)+Math.sin(a)*Math.cos(angle)),1.55*Math.sin(a)*Math.sin(angle)]);
    }
    return out;
  })();
  function starPoints(r) {
    return Array.from({length:8},(_,i)=>{
      const a=i*Math.PI/4,q=i%2?r*.23:r;
      return [Math.cos(a)*q,Math.sin(a)*q];
    });
  }
  const drumPhase=(t,p)=>t*.59+1.43*p;
  function laundry(parent,{builder,node}) {
    const b=builder(parent);
    const shell=[[-4.37,1.3],[-3.99,.81],[4,.81],[4.37,1.26],[4.37,8.87],[3.71,9.63],[-3.76,9.63],[-4.37,8.91]];
    prism(b,shell,4.12,[0,0,-2.14],(v,n)=>n.z>.75?'#52818e':n.x<-.25?'#314c6e':'#6b9ea2');
    for(const x of [-3.36,3.36])for(const z of [-1.43,1.43]){
      b.box([x,.54,z],[1.39,.96,1.16],night);b.box([x,.22,z],[1.57,.24,1.29],steel);
    }
    b.box([0,1.28,2.01],[8.14,.46,.24],'#304158');
    for(let i=0;i<11;i++)b.box([-2.9+i*.58,1.29,2.15],[.25,.13,.05],i%3?'#17243a':mint,null,i%3===0);
    b.box([0,8.68,2.04],[8.14,1.20,.30],'#263852');
    b.box([-1.96,8.72,2.21],[3.31,.68,.11],'#87a8ae');
    b.box([-1.96,8.78,2.29],[2.53,.19,.07],night);
    b.box([.65,8.70,2.25],[1.47,.68,.09],night);
    b.box([.64,8.76,2.33],[1.09,.12,.03],mint,null,true);
    faceDisk(b,2.72,8.72,2.31,.51,.35,'#dce2ce',false,12);
    b.box([2.84,8.84,2.51],[.32,.08,.06],pink,[0,0,.75],true);
    faceDisk(b,0,4.89,2.06,3.18,.25,'#33485e',false,24);
    faceDisk(b,0,4.89,2.21,2.95,.10,night,false,24);
    for(let j=0;j<13;j++) {
      const a=j*tau/13;
      faceDisk(b,Math.cos(a)*2.54,4.89+Math.sin(a)*2.54,2.28,.089,.035,'#6b8f9b',false,6);
    }
    // A little coin return has spat out one last token.
    b.box([3.63,2.03,2.08],[.85,.75,.22],alloy);b.box([3.63,2.15,2.20],[.53,.14,.08],night);
    faceDisk(b,3.62,1.94,2.27,.17,.10,gold,true,8);
    b.finish();
    const drum=node(parent,0,4.89,2.31),s=builder(drum);
    prism(s,crescent,.28,[-.12,.1,.02],(v,n)=>n.z>.85?'#ffe6a3':n.y>.15?'#e8ba78':'#ad7858',true);
    for(const [x,y,r] of [[-1.12,.39,.17],[-1.25,-.25,.12],[-.73,-.78,.15]]) {
      faceDisk(s,x,y,.306,r,.011,'#c09370',true,9);
      faceDisk(s,x-.035,y+.022,.314,r*.62,.010,'#d4aa79',true,7);
    }
    for(const [x,y,r] of [[1.25,.49,.34],[.83,-1.23,.22],[-.81,1.53,.16],[1.56,-.51,.12]]) {
      prism(s,starPoints(r),.05,[x,y,.20],ice,true);
    }
    s.finish();
    const hinge=node(parent,-2.88,4.89,2.62),ring=builder(hinge);
    bezel(ring,[2.88,0,.02],2.89,.205,'#a7c5bd',false,28);
    bezel(ring,[2.88,0,.17],2.68,.080,mint,true,25);
    ring.box([5.68,.04,.35],[.44,1.08,.36],'#b6bbc6');
    ring.box([5.71,.12,.56],[.24,.77,.13],pink,null,true);
    ring.finish();
    return (t,pulse=0)=>{
      drum.rotation.z=drumPhase(t,pulse);
      drum.position.y=4.89+.055*Math.sin(t*5.1)+.16*pulse;
      hinge.rotation.y=-.065-.81*pulse-.028*Math.sin(t*1.16);
    };
  }
  function drawLaundry(g,t,pulse=0) {
    g.save();
    for(const x of [-3.36,3.36]){rect(g,x-.70,.18,1.40,.84,night);rect(g,x-.78,.10,1.56,.23,steel);}
    poly(g,[[-4.37,1.3],[-3.99,.81],[4,.81],[4.37,1.26],[4.37,8.87],[3.71,9.63],[-3.76,9.63],[-4.37,8.91]],'#648b99');
    poly(g,[[-4.37,1.3],[-3.97,1.0],[-3.97,8.73],[-3.50,9.61],[-3.76,9.63],[-4.37,8.91]],'#405d7a');
    rect(g,-4.01,1.15,8.02,.36,'#354962');
    for(let i=0;i<11;i++)rect(g,-3.03+i*.58,1.24,.25,.13,i%3?night:mint);
    rect(g,-4.04,8.02,8.08,1.23,shadow);rect(g,-3.62,8.35,3.32,.68,'#98acba');rect(g,-3.21,8.70,2.51,.16,night);
    rect(g,-.06,8.39,1.43,.63,night);rect(g,.12,8.69,1.07,.11,mint);
    disk(g,2.72,8.70,.55,.55,cream);stroke(g,[[2.72,8.70],[2.94,8.95]],pink,.10);
    disk(g,0,4.89,3.14,3.14,'#34485c');disk(g,0,4.89,2.93,2.93,night);
    g.save();g.translate(0,4.89+.055*Math.sin(t*5.1)+.16*pulse);g.rotate(drumPhase(t,pulse));
    poly(g,crescent.map(v=>[v[0]-.12,v[1]+.1]),'#ffe6a3');
    for(const [x,y,r] of [[-1.12,.39,.17],[-1.25,-.25,.12],[-.73,-.78,.15]])disk(g,x,y,r,r,'#c69e77');
    for(const [x,y,r] of [[1.25,.49,.34],[.83,-1.23,.22],[-.81,1.53,.16],[1.56,-.51,.12]])poly(g,starPoints(r).map(v=>[v[0]+x,v[1]+y]),ice);
    g.restore();
    const aperture=Math.cos(.065+.81*pulse+.028*Math.sin(t*1.16));
    g.save();g.translate(-2.88,4.89);g.scale(aperture,1);g.translate(2.88,0);
    for(const [r,w,ink] of [[2.89,.40,'#b6cac8'],[2.68,.15,mint]]) {
      g.strokeStyle=ink;g.lineWidth=w;g.beginPath();g.arc(0,0,r,0,tau);g.stroke();
    }
    rect(g,2.62,-.48,.45,1.04,alloy);rect(g,2.76,-.24,.17,.61,pink);g.restore();
    rect(g,3.21,1.75,.8,.66,alloy);rect(g,3.37,2.08,.51,.13,night);disk(g,3.63,1.92,.15,.15,gold);
    g.restore();
  }

  const upperWing=[[0,-.2],[.20,1.26],[1.47,3.05],[3.27,4.36],[5.07,4.18],[5.87,3.28],[5.59,2.28],[4.78,1.03],[3.04,-.03],[1.44,-.72],[.45,-.46]];
  const lowerWing=[[.15,-.26],[1.52,-.69],[3.14,-.22],[4.86,.71],[4.66,-.72],[3.64,-2.15],[2.06,-3.12],[1.31,-2.83],[.51,-1.31]];
  const mothFlap=(t,p)=>.33+.26*Math.sin(t*1.75)+.48*p*Math.sin(t*8.53);
  const mothBob=(t,p)=>6.42+.38*Math.sin(t*1.27)+.43*p;
  function hotline(parent,{builder,node}) {
    const b=builder(parent);
    b.rod([0,-.28,-.46],[0,.52,-.46],2.30,2.43,'#37455d',false,12);
    b.rod([0,.52,-.46],[0,.81,-.46],2.42,2.06,'#56647c',false,12);
    b.rod([0,.80,-.46],[0,.88,-.46],2.04,1.98,violet,true,12);
    b.rod([.05,.86,-.56],[.05,5.77,-.56],.17,.105,'#555883',false,7);
    // A small articulated desk lamp gives this enormous moth an extremely
    // mundane reason to be hovering over the racetrack.
    const lx=-1.62,lz=2.15;
    b.rod([lx,0,lz],[lx,.4,lz],1.05,1.16,night,false,10);
    b.rod([lx,.4,lz],[lx,.57,lz],1.16,.91,'#d38865',false,10);
    zig(b,[[lx,.57,lz],[lx-.76,3.34,lz],[lx+1.06,4.81,lz]],.13,'#ad887e',false,6);
    zig(b,[[lx+.25,.57,lz],[lx-.47,3.34,lz],[lx+1.16,4.55,lz]],.083,gold,false,5);
    for(const [x,y] of [[lx,.58],[lx-.63,3.34],[lx+1.1,4.69]])faceDisk(b,x,y,lz+.13,.21,.19,'#797e90',false,7);
    b.rod([lx+1.07,4.92,lz],[lx+.97,4.34,lz+.03],.27,.71,'#d88d63',false,12);
    b.finish();
    const bulb=node(parent,lx+.97,4.27,lz+.08),light=builder(bulb);
    light.ball([0,0,0],[.51,.32,.51],gold,null,true,true);light.finish();
    const bug=node(parent,0,6.42,0),body=builder(bug);
    body.ball([0,-.97,.02],[.50,1.43,.50],(v,n)=>n.z>.22?'#bd9b94':'#775d8c',null,false,true);
    body.ball([0,.19,.12],[.69,1.06,.63],'#9f75a4',null,false,true);
    for(const x of [-1,1]) {
      body.ball([x*.39,.89,.26],[.42,.55,.38],'#7d598b',null,false,true);
      body.ball([x*.41,.99,.54],[.31,.34,.23],mint,null,true,true);
      body.ball([x*.45,1.03,.75],[.12,.15,.062],night,null,false,true);
      const feeler=[[x*.25,1.24,.08],[x*.44,1.98,.01],[x*1.11,2.55,-.03],[x*1.45,2.70,-.03]];
      zig(body,feeler,.085,'#dc9dc4',false,5);
      for(let j=0;j<3;j++)body.rod([x*(.5+j*.25),2.02+j*.19,-.012],[x*(.37+j*.23),2.36+j*.23,-.005],.052,.025,pink,true,4);
      for(let j=0;j<2;j++)zig(body,[[x*.44,-.05-j*.56,.31],[x*.82,-.51-j*.56,.58],[x*.67,-.76-j*.52,.93]],.068,'#b8928f',false,5);
    }
    body.finish();
    const wings=[];
    for(const side of [-1,1]){
      const pivot=node(bug,side*.39,.23,-.10),w=builder(pivot);
      // Satin panels, concentric owl eyes and actual raised conductive traces
      // remain legible as the wings fold toward the oncoming driver.
      prism(w,lowerWing,.19,[0,0,-.08],(v,n)=>n.z>0?'#694f99':'#4d416e');
      prism(w,upperWing,.23,[0,0,.02],(v,n)=>n.z>.2?'#a36db9':'#594274');
      prism(w,[[.47,.54],[2.10,2.97],[4.25,3.87],[5.25,3.55],[4.28,3.03],[2.50,2.6]],.037,[0,0,.265],'#e89bae');
      prism(w,[[.56,-.55],[1.67,-1.57],[3.95,-.63],[3.30,-1.55],[2.14,-2.49],[1.40,-2.1]],.045,[0,0,.125],'#a27ab8');
      zig(w,[[.48,.25,.28],[1.33,1.24,.28],[2.13,1.31,.28],[2.72,2.12,.28]],.066,ice,true,5);
      zig(w,[[.61,-.72,.16],[1.43,-1.78,.16],[2.45,-1.72,.16],[3.03,-1.07,.17]],.065,pink,true,5);
      faceDisk(w,3.93,2.38,.31,1.11,.11,night,false,15);
      faceDisk(w,3.93,2.38,.39,.90,.081,violet,true,13);
      faceDisk(w,3.93,2.38,.43,.65,.078,night,false,12);
      faceDisk(w,3.94,2.38,.485,.34,.045,gold,true,10);
      faceDisk(w,3.85,2.50,.526,.13,.028,cream,true,7);
      for(const [x,y,r] of [[2.43,-1.62,.22],[1.95,-2.16,.13],[5.24,3.39,.11]])faceDisk(w,x,y,.26,r,.053,mint,true,7);
      w.finish();
      pivot.scale.x=side;wings.push({side,pivot});
    }
    return (t,pulse=0)=>{
      bug.position.y=mothBob(t,pulse);
      bug.rotation.z=.065*Math.sin(t*.84)-.085*pulse;
      const a=mothFlap(t,pulse);
      for(const {side,pivot} of wings)pivot.rotation.y=side*a;
      bulb.scale.setScalar(1+.54*pulse+.08*Math.sin(t*2.65));
    };
  }
  function drawHotline(g,t,pulse=0) {
    g.save();
    disk(g,0,.42,2.38,.48,'#57667c');rect(g,-1.87,.64,3.74,.16,violet);
    stroke(g,[[.03,.78],[.03,5.77]],'#6d638f',.17);
    g.save();g.translate(0,mothBob(t,pulse));g.rotate(.065*Math.sin(t*.84)-.085*pulse);
    const flap=mothFlap(t,pulse),flatten=Math.cos(flap);
    for(const side of [-1,1]){
      g.save();g.translate(side*.39,.23);g.scale(side*flatten,1);
      poly(g,lowerWing,'#71579f');poly(g,upperWing,'#ab73c0');
      poly(g,[[.47,.54],[2.10,2.97],[4.25,3.87],[5.25,3.55],[4.28,3.03],[2.5,2.6]],'#e89bae');
      poly(g,[[.56,-.55],[1.67,-1.57],[3.95,-.63],[3.30,-1.55],[2.14,-2.49],[1.40,-2.1]],'#b78ec2');
      stroke(g,[[.48,.25],[1.33,1.24],[2.13,1.31],[2.72,2.12]],ice,.13);
      stroke(g,[[.61,-.72],[1.43,-1.78],[2.45,-1.72],[3.03,-1.07]],pink,.13);
      for(const [r,ink] of [[1.11,night],[.90,violet],[.65,night],[.34,gold]])disk(g,3.93,2.38,r,r,ink);
      disk(g,3.85,2.50,.13,.13,cream);disk(g,2.43,-1.62,.22,.22,mint);disk(g,1.95,-2.16,.13,.13,mint);g.restore();
    }
    disk(g,0,-.94,.51,1.43,'#ba9699');disk(g,0,.19,.68,1.08,'#a576b0');
    for(const s of [-1,1]){
      disk(g,s*.39,.91,.44,.54,'#765b8d');disk(g,s*.41,1.00,.30,.34,mint);disk(g,s*.44,1.04,.11,.14,night);
      stroke(g,[[s*.25,1.24],[s*.44,1.98],[s*1.11,2.55],[s*1.45,2.70]],'#d99bc5',.14);
      for(let j=0;j<3;j++)stroke(g,[[s*(.5+j*.25),2.02+j*.19],[s*(.37+j*.23),2.36+j*.23]],pink,.07);
    }
    g.restore();
    disk(g,-1.62,.24,1.14,.26,night);rect(g,-2.53,.34,1.82,.22,'#ca8967');
    stroke(g,[[-1.62,.56],[-2.38,3.35],[-.53,4.81]],'#ae8b88',.23);stroke(g,[[-1.38,.58],[-2.10,3.34],[-.40,4.56]],gold,.115);
    const q=1+.54*pulse+.08*Math.sin(t*2.65);disk(g,-.65,4.27,.51*q,.32*q,gold);
    poly(g,[[-.82,4.91],[-.28,4.91],[.07,4.34],[-1.35,4.34]],'#dc9166');g.restore();
  }

  // The campus rides share their actual mesh parts with the flat renderer.
  // A small orthographic sprite is painted once per rigid part. Moving parts
  // then cost one canvas draw each and use the same nested joints as the ride.
  const sideView=.17,topView=.13,illustrationDensity=26;
  function paintPart(group) {
    const faces=[],tone=new THREE.Color(),origin=new THREE.Vector3();
    let left=Infinity,bottom=Infinity,right=-Infinity,top=-Infinity,minZ=Infinity,maxZ=-Infinity;
    function include(x,y,z){left=Math.min(left,x);right=Math.max(right,x);bottom=Math.min(bottom,y);top=Math.max(top,y);minZ=Math.min(minZ,z);maxZ=Math.max(maxZ,z);}
    for(const mesh of group.children) {
      if(!mesh.isMesh)continue;
      const geom=mesh.geometry,attrs=geom.attributes,index=geom.index,mat=mesh.material;
      if(mat.map?.image){
        // Ride labels are front-facing planes mounted on the cabinet itself.
        const {x,y,z}=mesh.position,u=x-sideView*z,v=y-topView*z,w=geom.parameters.width,h=geom.parameters.height;
        faces.push({image:mat.map.image,x:u-w/2,y:v+h/2,w,h,depth:z});
        include(u-w/2,v-h/2,z);include(u+w/2,v+h/2,z);continue;
      }
      const pos=attrs.position,norm=attrs.normal,col=attrs.color,verts=[];
      for(let i=0;i<pos.count;i++){
        const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),u=x-sideView*z,v=y-topView*z;
        const k=mat.isMeshBasicMaterial?1:.69+Math.max(0,-.36*norm.getX(i)+.76*norm.getY(i)+.56*norm.getZ(i))*.45;
        // At a fixed projected pixel, larger local z always means nearer.
        // An x/y bias here incorrectly splits wide decals along a triangle edge.
        verts.push([u,v,z,col.getX(i)*k,col.getY(i)*k,col.getZ(i)*k]);include(u,v,z);
      }
      const count=index?index.count:pos.count;
      for(let i=0;i<count;i+=3){
        const a=verts[index?index.getX(i):i],b=verts[index?index.getX(i+1):i+1],c=verts[index?index.getX(i+2):i+2];
        if((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])<.00004)continue;
        tone.setRGB((a[3]+b[3]+c[3])/3,(a[4]+b[4]+c[4])/3,(a[5]+b[5]+c[5])/3);
        faces.push({a,b,c,depth:(a[2]+b[2]+c[2])/3,ink:'#'+tone.getHexString()});
      }
    }
    if(!faces.length)return null;
    const canvas=document.createElement('canvas'),d=illustrationDensity;left-=.07;bottom-=.07;
    canvas.width=Math.ceil((right-left+.07)*d);canvas.height=Math.ceil((top-bottom+.07)*d);
    const w=canvas.width/d,h=canvas.height/d;top=bottom+h;
    const ctx=canvas.getContext('2d');ctx.setTransform(d,0,0,-d,-left*d,top*d);ctx.lineJoin='round';ctx.lineWidth=.37/d;
    for(const f of faces.sort((a,b)=>a.depth-b.depth)){
      if(f.image){ctx.save();ctx.scale(1,-1);ctx.drawImage(f.image,f.x,-f.y,f.w,f.h);ctx.restore();continue;}
      const {a,b,c}=f;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.lineTo(c[0],c[1]);ctx.closePath();ctx.fillStyle=ctx.strokeStyle=f.ink;ctx.fill();ctx.stroke();
    }
    const z=(minZ+maxZ)*.5;origin.set((left+right)*.5+sideView*z,(bottom+top)*.5+topView*z,z);
    return {group,canvas,left,top,w,h,origin,depth:0};
  }
  function campusRide(fields,assemble){
    let flat=null;
    function draw(g,t,p=0){
      if(!flat){
        const group=new THREE.Group(),animate=assemble(group,MTMOddities.art),layers=[],baked=[];
        group.traverse(part=>{if(part.isMesh)baked.push(part);else if(part.isGroup){const layer=paintPart(part);if(layer)layers.push(layer);}});
        // Canvas keeps the articulated joint graph and its sprites. These
        // privately built meshes and label maps are no longer needed.
        for(const mesh of baked){mesh.removeFromParent();mesh.geometry.dispose();if(mesh.material.map){mesh.material.map.dispose();mesh.material.dispose();}}
        flat={group,animate,layers,point:new THREE.Vector3()};
      }
      flat.animate(t,p);flat.group.updateMatrixWorld(true);
      for(const layer of flat.layers){const v=flat.point.copy(layer.origin).applyMatrix4(layer.group.matrixWorld);layer.depth=v.z+v.x*sideView+v.y*topView;}
      for(const layer of flat.layers.sort((a,b)=>a.depth-b.depth)){
        const m=layer.group.matrixWorld.elements;
        g.save();g.transform(m[0]-sideView*m[2],m[1]-topView*m[2],m[4]-sideView*m[6],m[5]-topView*m[6],m[12]-sideView*m[14],m[13]-topView*m[14]);
        g.scale(1,-1);g.drawImage(layer.canvas,layer.left,-layer.top,layer.w,layer.h);g.restore();
      }
    }
    return {...fields,build:assemble,draw};
  }

  const coral='#ff8878',aqua='#53e3d1',leaf='#9cd667',plum='#565081',amber='#ffa748',denim='#565e9e',peach='#ffbf9a';
  const sphere12=new THREE.SphereGeometry(1,12,7),tipGem=new THREE.IcosahedronGeometry(1,0);
  function egg(b,p,scale,ink,rot=null,lit=false){b.add(sphere12,p,scale,rot,ink,lit);}
  function plaque(api,parent,x,y,z,w,h,title,caption,color){
    const part=api.node(parent,x,y,z),b=api.builder(part);
    b.box([0,0,0],[w+.13,h+.14,.22],night);b.finish();api.label(part,title,caption,w,h,0,.13,color);
  }
  function shoes(b,side,y,x,z,r){
    // Two cast steps anchor the tall displays to the forest floor.
    b.box([side*x,y,z],[r,.36,1.62],shadow);
    b.box([side*x,y+.21,z],[r*.87,.11,1.40],steel);
  }
  function glint(b,x,y,z,size,color){prism(b,starPoints(size),.09,[x,y,z],color,true);}

  function paperSafari(parent,api){
    const {builder,node}=api,b=builder(parent),face=builder(node(parent)),bodyProfile=[[-4.18,2.03],[-4.46,2.52],[-4.46,5.77],[-3.98,6.31],[3.96,6.31],[4.45,5.77],[4.45,2.45],[4.01,2.03]];
    // A drop-in feed slot, toothed rollers and a hot-pink service plate make
    // the enormous dot-matrix printer legible from gravel level.
    for(const x of [-3.47,3.47]){shoes(b,Math.sign(x),.18,Math.abs(x),0,1.62);b.box([x,1.14,-.05],[.77,1.69,1.32],steel);}
    prism(b,bodyProfile,3.5,[0,0,-1.77],(v,n)=>n.z>.70?'#c1c7bc':n.y>.40?cream:'#8c91a3');
    // The front fascia sits ahead of the feed path. It masks the car roof
    // as it disappears into the cabinet in both the mesh and sprite versions.
    prism(face,bodyProfile,.035,[0,0,1.732],'#c1c7bc');
    face.box([0,3.58,1.8],[7.34,1.10,.18],shadow);face.box([0,3.61,1.906],[6.58,.50,.09],night);
    for(let i=0;i<8;i++)face.box([-2.67+i*.76,3.77,1.974],[.20,.23,.06],i===4?pink:steel);
    face.box([-2.67,5.55,1.84],[1.94,.52,.20],night);face.box([-2.69,5.59,1.966],[1.42,.16,.06],aqua,null,true);
    for(let i=0;i<3;i++)faceDisk(face,1.55+i*.64,5.53,1.95,.18,.16,i===2?pink:gold,true,8);
    face.finish();
    b.box([0,6.31,.01],[6.87,.13,2.32],night);b.box([0,6.42,-.83],[6.78,.12,.23],coral,null,true);
    // A continuous sheet curls forward in an S. Tractor perforations march
    // along both edges; only its upper section is visible above the swallowed car.
    const feed=[[0,6.48,-.57],[0,7.72,-.72],[0,8.90,-.98],[0,10.12,-1.40],[0,10.95,-1.54],[0,11.36,-1.11],[0,11.41,-.46],[0,11.20,-.03]];
    for(let i=1;i<feed.length;i++){
      const a=feed[i-1],v=feed[i],dy=v[1]-a[1],dz=v[2]-a[2],len=Math.hypot(dy,dz);
      b.box([.36,(v[1]+a[1])*.5,(v[2]+a[2])*.5],[3.59,len+.07,.075],cream,[Math.atan2(dz,dy),0,0]);
      if(i<5){for(const x of [-1.16,1.88])b.box([x,a[1]+dy*.55,a[2]+dz*.55+.043],[.17,.22,.04],plum);b.box([.32,a[1]+dy*.65,a[2]+dz*.65+.045],[1.86-i*.15,.07,.05],i%2?steel:denim);}
    }
    for(const x of [-3.18,3.18])b.rod([x,6.26,.20],[x,7.29,.20],.27,.25,steel,false,8);
    b.finish();plaque(api,parent,0,1.57,1.17,5.55,.89,'PAPER JAM','DYLAN  /  VEHICLE FEED',coral);
    const roll=node(parent,0,7.18,.23),r=builder(roll);
    r.rod([-3.40,0,0],[3.40,0,0],.32,.32,'#45576c',false,12);
    for(const x of [-2.89,2.89])r.rod([x-.23,0,0],[x+.23,0,0],.51,.51,aqua,true,8);
    for(const x of [-2.4,-1.5,1.6,2.4])r.rod([x-.13,0,0],[x+.13,0,0],.38,.38,'#91a8ab',false,9);
    r.finish();
    const car=node(parent,0,6.13,.47),v=builder(car);
    prism(v,[[-2.08,.08],[-2.03,.65],[-1.54,.78],[-.90,1.68],[.92,1.64],[1.39,1.00],[2.03,.79],[2.16,.47],[2.12,.05]],1.44,[0,0,-.68],gold);
    prism(v,[[-1.16,.83],[-.79,1.45],[-.13,1.47],[-.10,.88]],.05,[0,0,.78],denim);
    prism(v,[[.09,.88],[.09,1.47],[.79,1.45],[1.14,.88]],.05,[0,0,.78],ice,true);
    v.box([0,.43,.80],[3.97,.12,.06],coral,null,true);
    for(const x of [-1.37,1.40])for(const z of [-.64,.82]){faceDisk(v,x,.16,z,.47,.22,night,false,11);faceDisk(v,x,.16,z+.13,.22,.06,alloy,false,8);}
    v.box([2.10,.60,.48],[.13,.25,.35],cream,null,true);v.finish();
    return (t,p=0)=>{car.position.y=7.55+.52*Math.sin(t*1.52)-1.87*p;car.rotation.z=-.28+.16*Math.sin(t*1.52+.35)-.41*p;roll.rotation.x=t*1.9+3*p;};
  }

  function vaneNewt(parent,api){
    const {builder,node}=api,b=builder(parent);
    b.rod([0,.04,0],[0,.55,0],2.74,2.49,plum,false,12);b.rod([0,.55,0],[0,.68,0],2.40,2.30,pink,true,12);
    b.rod([0,.67,0],[0,6.87,0],.40,.22,'#8193a1',false,9);
    for(let t=0;t<3;t++){const y=1.60+t*1.45;b.rod([0,y,0],[0,y+.14,0],.38-t*.045,.38-t*.045,t%2?gold:aqua,true,9);}
    for(const s of [-1,1]){b.rod([s*2.12,.50,.05],[s*.05,3.58,.05],.12,.1,steel,false,6);b.rod([s,.92,-1.4],[0,2.97,-.04],.11,.10,steel,false,6);}
    b.rod([-3.75,4.14,0],[3.75,4.14,0],.12,.12,steel,false,7);
    prism(b,[[-.62,.0],[.31,.41],[.31,-.41]],.14,[-3.49,4.14,-.05],cream,true);
    prism(b,[[-.42,.0],[.43,.39],[.31,0],[.43,-.39]],.14,[3.36,4.14,-.05],gold,true);
    b.finish();plaque(api,parent,0,1.37,1.83,4.2,.77,'WIND NEWT','SUGI METEOROLOGY',pink);
    const head=node(parent,0,7.53,0),a=builder(head);
    // One huge external-gilled salamander balances on a weather-vane bearing.
    egg(a,[-.19,.06,-.13],[2.51,1.10,1.17],'#ef9d98',[0,0,.04]);
    tube(a,[[-1.39,.13,-.22],[-2.74,.26,-.34],[-3.60,.72,-.14],[-4.07,1.51,.19],[-4.47,1.85,.26]],.38,'#ec979d',false,11,6);
    prism(a,[[-4.48,1.78],[-5.72,3.13],[-4.15,2.72],[-3.92,2.14],[-3.65,1.47],[-3.10,1.02],[-3.92,.79]],.26,[0,0,.09],coral);
    egg(a,[1.46,.56,.16],[1.93,1.38,1.34],'#ffad9d');
    for(const x of [.52,2.39]){a.ball([x,1.03,1.22],[.22,.30,.16],night,null,false,true);a.ball([x-.045,1.105,1.36],[.071,.074,.044],cream,null,true,true);}
    tube(a,[[1.13,.58,1.49],[1.37,.46,1.53],[1.65,.45,1.51],[1.91,.58,1.42]],.068,'#a75978',false,6,5);
    for(const x of [-1.49,.35])for(const z of [-.75,.72]){a.rod([x,.0,z],[x+.37,-.68,z*1.50],.25,.18,'#ee9997',false,7);a.ball([x+.57,-.73,z*1.57],[.45,.17,.24],peach,null,false,true);}
    a.finish();
    const gills=[];
    for(const side of [-1,1]){const pivot=node(head,1.52+side*1.35,1.03,.16),g=builder(pivot);
      for(let j=0;j<3;j++){
        const x=side*(.46+j*.43),y=1.57-j*.61;
        g.rod([0,.01,0],[x,y,-.12],.17,.22,'#cc4d80',false,6);
        for(let i=0;i<3;i++){const u=.46+i*.22,qx=x*u,qy=y*u;g.rod([qx,qy,-.12*u],[qx+side*(.30+.09*i),qy+.33,-.08],.082,.12,i%2?coral:pink,true,5);}
        g.add(tipGem,[x,y,-.12],[.24,.31,.22],[0,0,-side*.42],pink,true);
      }g.finish();gills.push({pivot,side});}
    return (t,p=0)=>{head.rotation.y=.18*Math.sin(t*.82)-.33*p;head.rotation.z=.055*Math.sin(t*1.70)+.19*p;head.position.y=7.57+.14*Math.sin(t*1.37)+.49*p;for(const {pivot,side} of gills)pivot.rotation.z=side*(.12*Math.sin(t*1.87)-.8*p);};
  }

  function optionsScale(parent,api){
    const {builder,node}=api,b=builder(parent);
    const base=[[-2.87,.23],[-2.38,.90],[-1.36,1.49],[-.86,2.52],[-.56,7.7],[0,8.62],[.56,7.7],[.86,2.52],[1.36,1.49],[2.38,.90],[2.87,.23]];
    prism(b,base,1.63,[0,0,-.85],(v,n)=>n.z>.70?'#947865':'#685867');
    b.box([0,.21,0],[6.20,.42,3.07],night);b.box([0,.52,0],[5.70,.18,2.79],gold,null,true);
    b.box([0,3.85,.89],[.19,3.32,.12],aqua,null,true);
    faceDisk(b,0,7.66,.60,.92,.68,'#8c694e',false,16);faceDisk(b,0,7.66,1.0,.61,.19,gold,true,12);
    b.finish();plaque(api,parent,0,1.11,1.59,5.34,.81,'WEIGH YOUR OPTIONS','ERYAN  /  SMALL CLAIMS',gold);
    const beam=node(parent,0,7.69,.11),p=builder(beam);
    prism(p,[[-5.31,.10],[-4.76,.60],[-2.15,.43],[0,.83],[2.15,.43],[4.76,.60],[5.31,.10],[4.44,-.12],[2.04,.034],[0,.28],[-2.04,.034],[-4.44,-.12]],.54,[0,0,-.27],gold);
    for(const x of [-4.81,4.81])faceDisk(p,x,.19,.17,.33,.29,cream,true,9);
    prism(p,[[-.30,.58],[0,1.84],[.30,.58]],.32,[0,0,-.13],coral,true);p.finish();
    const pans=[];
    for(const side of [-1,1]){const pan=node(beam,side*4.8,.19,.10),u=builder(pan);
      for(const [x,z] of [[-1.56,.87],[1.56,.87],[0,-1.64]])u.rod([0,-.05,0],[x,-3.65,z],.064,.072,'#f2d6a2',false,5);
      u.rod([0,-4.1,0],[0,-3.69,0],.75,1.84,'#b17e62',false,14);u.rod([0,-3.70,0],[0,-3.59,0],1.86,1.82,gold,true,14);
      if(side<0){
        u.box([0,-3.52,0],[2.0,.20,1.82],coral);
        for(const [ya,yb,ra,rb,ink] of [[-3.43,-2.67,.89,.64,'#ea713e'],[-2.67,-2.39,.64,.54,cream],[-2.39,-1.75,.54,.32,'#ed7946'],[-1.75,-1.51,.32,.23,cream],[-1.51,-1.11,.23,.10,'#f88e51']])u.rod([0,ya,0],[0,yb,0],ra,rb,ink,false,12);
      }else{
        egg(u,[0,-2.50,0],[1.12,1.09,1.09],leaf);u.ball([-.31,-2.14,.93],[.23,.18,.10],'#d3f890',null,false,true);
        tube(u,[[0,-1.48,0],[.24,-1.03,.03],[.52,-1.01,.06],[.56,-1.24,.09]],.079,'#849656',false,6,5);
        prism(u,[[0,0],[.33,.43],[.99,.42],[.60,.04]],.065,[.14,-1.38,.1],aqua);
      }u.finish();pans.push(pan);
    }
    return (t,p=0)=>{const a=.090*Math.sin(t*1.20)+.46*p;beam.rotation.z=a;for(const [i,pan] of pans.entries())pan.rotation.z=-a+.05*Math.sin(t*1.77+i*.66)-p*.08;};
  }

  function lostPossum(parent,api){
    const {builder,node}=api,b=builder(parent);
    // Discarded trolley hardware supports the marsupial by its curled tail.
    for(const x of [-4.1,4.1]){
      shoes(b,Math.sign(x),.18,4.1,-.6,1.39);b.rod([x,.40,-.65],[x*.93,10.77,-.65],.23,.16,steel,false,8);
      b.rod([x*.96,7.25,-.65],[x*.51,10.04,-.65],.105,.10,'#798395',false,6);
      for(const y of [2.24,2.57])b.box([x*.99,y,-.63],[.42,.17,.44],amber,null,true);
      b.ball([x*.93,10.79,-.62],[.30,.31,.27],aqua,null,true,true);
    }
    b.rod([-4.43,10.19,-.65],[4.43,10.19,-.65],.14,.14,'#9096a0',false,8);
    tube(b,[[-4.47,10.9,-.73],[0,10.49,-.73],[4.48,10.92,-.73]],.05,shadow,false,7,5);
    // Folded sheet steel on the dumpster, including the hinged top edge.
    prism(b,[[-2.71,.68],[-3.1,3.32],[3.10,3.32],[2.71,.68]],2.1,[.10,0,-1.13],'#477982');
    b.box([.10,3.34,-.06],[6.48,.22,2.40],night);
    for(const x of [-2.81,2.98])b.box([x,2.0,1.02],[.18,2.57,.14],steel,[0,0,x<0?.14:-.14]);
    for(const x of [-1.54,-.37,.80,1.97])b.box([x,2.05,1.01],[.14,1.99,.12],'#64a291');
    for(const x of [-2.29,2.48])faceDisk(b,x,.49,.86,.38,.30,night,false,8);
    b.finish();plaque(api,parent,.10,2.09,1.22,4.54,.75,'LOST & FOUND','NIGHT SHIFT CLAIM WINDOW',aqua);
    const pet=node(parent,.54,10.48,-.40),a=builder(pet);
    tube(a,[[.42,.12,-.46],[.08,.43,-.29],[-.25,.25,-.04],[-.17,-.34,.25],[.15,-.77,.31],[.43,-1.21,.25],[.26,-1.85,.15],[-.17,-2.13,.11]],.185,'#e9a99e',false,15,7);
    egg(a,[-.39,-3.05,.17],[.93,1.35,.75],(v,n)=>n.y>.42?'#9a9d9e':'#86889a',[0,0,-.14]);
    egg(a,[-.43,-3.18,.43],[.98,.76,.58],amber,[0,0,-.15]);a.box([-.42,-3.10,1.01],[1.48,.19,.10],cream,[0,0,-.16],true);
    egg(a,[-.22,-4.08,.39],[.91,.83,.81],'#c1c3bf');
    prism(a,[[-.84,-4.07],[-.52,-4.71],[-.16,-5.12],[.15,-5.24],[.61,-4.45],[.66,-4.05]],.47,[0,0,.73],cream);
    a.ball([.12,-5.18,1.10],[.24,.18,.17],pink,null,false,true);
    for(const s of [-1,1]){
      a.ball([-.23+s*.81,-4.04,.47],[.29,.34,.18],plum,null,false,true);a.ball([-.23+s*.82,-4.08,.60],[.19,.21,.09],coral,null,false,true);
      a.ball([s*.35-.07,-4.46,1.13],[.15,.16,.085],night,null,false,true);
      a.rod([-.39+s*.61,-3.23,.42],[-.36+s*1.17,-3.74,.79],.18,.12,'#838095',false,8);
      a.ball([-.37+s*1.19,-3.82,.86],[.22,.24,.19],'#f2b7a7',null,false,true);
      for(let k=0;k<2;k++)a.rod([s*.56,-4.66,1.09],[s*1.12,-4.54-.34*k,1.33],.038,.024,alloy,false,4);
    }a.finish();
    const lid=node(parent,.10,3.43,-1.16),l=builder(lid);
    l.box([0,0,.52],[6.40,.17,1.07],'#344a5c');l.box([0,.08,.31],[5.91,.10,.09],aqua,null,true);l.finish();
    const prize=node(parent,-2.11,3.34,.12),u=builder(prize);
    // A stolen gold ring is offered through the window when the driver honks.
    bezel(u,[0,0,0],.52,.13,gold,true,13);prism(u,[[-.34,0],[-.20,.26],[.15,.34],[.38,.12],[.17,-.14]],.19,[0,.51,-.11],ice,true);u.finish();
    return (t,p=0)=>{pet.rotation.z=.13*Math.sin(t*1.37)+.25*p;lid.rotation.x=.13+.11*Math.sin(t*1.14)-.94*p;prize.position.y=3.16+.09*Math.sin(t*2.0)+1.59*p;prize.rotation.z=.14*Math.sin(t*2.0)+.51*p;};
  }

  function circulating(parent,api){
    const {builder,node}=api,b=builder(parent);
    for(const x of [-3.71,3.71]){
      shoes(b,Math.sign(x),.18,3.72,-.36,1.65);
      for(const z of [-1.44,.40])b.rod([x,.43,z],[0,6.45,z*.53],.27,.18,'#a37d70',false,8);
      b.rod([x*.87,1.19,.28],[x*.35,4.35,.13],.092,.095,gold,true,5);
    }
    b.box([0,.70,-.56],[8.8,.80,3.47],plum);b.box([0,1.08,-.56],[8.46,.16,3.32],coral,null,true);
    b.rod([0,6.53,-1.60],[0,6.53,.97],.41,.41,steel,false,12);b.finish();
    plaque(api,parent,0,1.20,1.27,6.6,.95,'CIRCULATING LIBRARY','DYLAN / RETURNS IN PERPETUITY',gold);
    const wheel=node(parent,0,6.61,-.44),w=builder(wheel),rad=4.27;
    bezel(w,[0,0,-.58],rad,.19,'#947995',false,21);bezel(w,[0,0,.18],rad,.125,gold,true,21);
    for(let i=0;i<5;i++){const a=tau*i/5,x=Math.sin(a)*rad,y=Math.cos(a)*rad;
      w.rod([0,0,-.56],[x,y,-.56],.16,.105,denim,false,7);w.rod([x,y,-.63],[x,y,.84],.14,.14,coral,false,7);
      glint(w,x*.61,y*.61,-.34,.27,i%2?gold:aqua);
    }
    faceDisk(w,0,0,.06,.90,.42,plum,false,14);faceDisk(w,0,0,.34,.58,.13,pink,true,10);w.finish();
    const books=[],covers=[coral,aqua,'#c18ae6',amber,'#87bde2'];
    for(let i=0;i<5;i++){
      const a=tau*i/5,book=node(wheel,Math.sin(a)*rad,Math.cos(a)*rad,.71),u=builder(book);
      for(const x of [-.90,.90])u.rod([0,.04,0],[x,-.79,.14],.064,.068,steel,false,5);
      // Open folios hang like level Ferris-wheel cars. Cover rails, two page
      // blocks and cloth bookmarks are painted in each publishing imprint.
      for(const side of [-1,1]){
        const rot=-side*.27;
        u.box([side*.74,-1.03,.05],[1.54,1.00,.30],covers[i],[0,rot,side*.21]);
        u.box([side*.70,-.95,.27],[1.36,.86,.19],cream,[0,rot,side*.21]);
        for(let j=0;j<2;j++)u.box([side*.67,-.82-j*.21,.391],[.75,.055,.035],j?steel:plum,[0,rot,side*.21]);
      }
      u.box([.34,-1.31,.39],[.17,.41,.035],covers[(i+2)%5],[0,0,.17],true);u.finish();books.push(book);
    }
    return (t,p=0)=>{const angle=t*.36+1.12*p;wheel.rotation.z=angle;books.forEach((book,i)=>{book.rotation.z=-angle+.09*Math.sin(t*1.42+i*1.14)+p*.19*Math.sin(t*4.4+i*.4);});};
  }

  function reversedDairy(parent,api){
    const {builder,node}=api,b=builder(parent);
    // A drinking glass below the pipe supplies the upward pour. Its clear
    // side is suggested with slim sapphire mullions around opaque milk.
    const gx=2.67;
    b.rod([gx,.08,.18],[gx,.42,.18],1.62,1.74,steel,false,13);
    b.rod([gx,.43,.18],[gx,1.48,.18],1.40,1.60,'#b7c9d6',false,15);
    b.rod([gx,1.43,.18],[gx,1.53,.18],1.58,1.58,cream,false,15);
    for(const a of [.35,1.56,2.74,4.27,5.56])b.rod([gx+Math.cos(a)*1.39,.49,.18+Math.sin(a)*1.39],[gx+Math.cos(a)*1.75,2.93,.18+Math.sin(a)*1.75],.062,.08,ice,true,6);
    const profile=[[1.67,2.80],[1.78,2.8],[1.78,2.96],[1.68,2.99]];surface(b,profile,17,[gx,0,.18],ice);
    b.box([-1.97,.39,-.95],[5.05,.78,3.39],shadow);b.box([-1.97,.84,-.95],[4.69,.16,3.16],aqua,null,true);
    b.rod([-3.66,.91,-1.50],[-2.67,5.08,-1.5],.23,.18,'#949abc',false,8);b.rod([-.39,.91,-1.50],[-1.45,5.63,-1.5],.20,.16,steel,false,8);
    faceDisk(b,-2.15,5.17,-1.35,.75,.54,denim,false,13);b.finish();
    plaque(api,parent,-1.94,1.19,.79,4.91,.80,'UPHILL MILK','SUGI  /  REVERSE DAIRY',ice);
    const carton=node(parent,-1.70,5.36,.04),c=builder(carton),w=3.74;
    c.box([0,1.20,0],[w,4.83,2.73],cream);
    c.box([0,1.24,1.40],[3.58,2.92,.09],denim);c.box([0,-.68,1.405],[3.59,.32,.08],aqua,null,true);
    c.box([0,2.91,1.405],[3.59,.24,.08],coral,null,true);
    // A gable, a triangular crimp and one open paper beak complete the carton.
    prism(c,[[-1.88,3.56],[-1.05,4.96],[1.14,4.96],[1.86,3.56]],2.72,[0,0,-1.37],(v,n)=>n.z>.6?'#aebcce':'#8b90a8');
    c.box([.04,4.93,-.08],[2.48,.34,2.77],denim);c.box([.06,5.21,-.14],[2.41,.24,2.55],aqua,null,true);
    prism(c,[[1.11,4.96],[2.59,5.05],[2.31,4.12],[1.86,3.58]],1.31,[0,0,-.65],cream);
    prism(c,[[1.44,4.89],[2.35,4.95],[2.19,4.61]],.04,[0,0,.68],plum);
    // Big trompe-l'oeil milk drop on the carton; two vents underneath it.
    const drop=[[-.03,2.44],[.73,1.61],[.94,1.04],[.77,.62],[.30,.40],[-.29,.4],[-.80,.72],[-.87,1.24],[-.60,1.69]];
    prism(c,drop,.12,[0,0,1.46],cream,true);
    for(const x of [-.31,.32])c.ball([x,1.19,1.62],[.08,.12,.065],denim,null,false,true);
    c.finish();
    const stream=node(parent,0,0,0),s=builder(stream);
    // Frozen splash arcs give the animated droplets a place to launch from.
    for(const [dx,dz,h] of [[-.70,.53,.84],[.56,.18,1.01],[.16,-.72,.68]]){
      tube(s,[[gx,1.47,.16],[gx+dx*.6,1.48+h*.75,.16+dz*.6],[gx+dx,1.40+h,.16+dz],[gx+dx*1.25,1.35+h*.83,.16+dz*1.25]],.105,cream,true,6,5);
    }s.finish();
    const drops=[];for(let i=0;i<4;i++){const d=node(parent),q=builder(d);q.ball([0,0,0],[.27,.47,.24],i===1?ice:cream,null,true,true);q.finish();drops.push(d);}
    return (t,p=0)=>{
      const tilt=-.25-.065*Math.sin(t*.98)-.18*p;carton.rotation.z=tilt;
      const topX=-1.7+2.46*Math.cos(tilt)-4.97*Math.sin(tilt),topY=5.36+2.46*Math.sin(tilt)+4.97*Math.cos(tilt);
      for(let i=0;i<drops.length;i++){const u=(t*.49+i/4+.19*p)%1,travel=u*u*(3-2*u);drops[i].position.set(gx+(topX-gx)*travel+.52*Math.sin(u*Math.PI),1.72+(topY-1.72)*u,.18*(1-u));
        const size=.33+.70*Math.sin(Math.PI*u);drops[i].scale.set(size,size*(1+.46*p),size);drops[i].rotation.z=.15*Math.sin(u*tau);}
    };
  }

  function transitShoe(parent,api){
    const {builder,node}=api,b=builder(parent);
    for(const x of [-3.48,3.48]){shoes(b,Math.sign(x),.18,Math.abs(x),0,1.55);b.rod([x,.40,-.18],[x*.72,2.64,-.18],.21,.17,steel,false,7);}
    b.box([0,2.41,-.12],[9.70,.57,3.30],shadow);b.box([0,2.76,-.12],[9.56,.12,3.14],aqua,null,true);
    b.rod([-2.3,.41,-.80],[2.45,2.35,-.80],.12,.12,'#7c829d',false,6);
    for(const side of [-1,1])b.box([side*4.39,2.99,-.12],[.24,.48,3.11],amber,null,true);
    b.finish();plaque(api,parent,0,1.81,1.60,6.04,.92,'ONE-SHOE TRANSIT','ERYAN / LEFT FEET BOARD HERE',aqua);
    const shoe=node(parent,0,4.57,0),s=builder(shoe);
    const sole=[[-4.06,-.12],[-3.64,-.57],[2.04,-.60],[3.43,-.40],[4.09,.02],[4.32,.62],[3.56,.58],[2.04,.12],[-3.61,.11]];
    prism(s,sole,2.34,[0,0,-1.16],cream);s.box([-.34,-.52,.06],[6.8,.30,1.90],'#836c70');
    const upper=[[-3.91,.18],[-3.68,4.23],[-3.39,6.69],[-2.68,6.93],[-2.41,6.12],[-1.04,6.22],[-.40,4.40],[.07,3.03],[.72,1.90],[1.70,1.22],[3.28,1.11],[3.96,.76],[4.20,.40],[3.31,-.02],[2.06,-.10],[-3.46,-.09]];
    prism(s,upper,2.04,[0,0,-1.02],(v,n)=>n.z>.65?'#cf6278':n.x>.3?'#e88a83':'#9c597a');
    prism(s,[[-3.52,4.85],[-3.43,6.54],[-2.82,6.65],[-2.57,5.86],[-1.12,5.95],[-.84,5.17],[-2.49,5.04]],.11,[0,0,1.045],plum);
    prism(s,[[-3.55,.60],[-2.92,.44],[-1.44,1.51],[.09,.98],[1.66,.61],[.68,1.44],[-.98,2.26],[-2.60,1.21]],.10,[0,0,1.06],cream);
    faceDisk(s,-2.64,3.48,1.06,.63,.13,denim,false,14);glint(s,-2.64,3.47,1.15,.46,gold);
    for(let j=0;j<4;j++){
      const y=2.08+j*.85,x=.50-j*.35;faceDisk(s,x-.68,y+.13,1.16,.14,.08,'#8b6578',false,7);faceDisk(s,x+.43,y-.01,1.16,.14,.08,'#8b6578',false,7);
      s.rod([x-.72,y+.17,1.25],[x+.43,y-.02,1.25],.080,.083,aqua,true,6);
      s.rod([x-.41,y+.15,1.24],[x+.10,y+.54,1.24],.067,.067,cream,false,6);
    }
    s.box([.12,-.69,0],[5.80,.22,1.46],steel);
    for(const x of [-2.46,2.35])s.rod([x,-.90,-1.09],[x,-.90,1.09],.16,.16,alloy,false,7);
    s.rod([3.03,-.50,0],[3.54,-1.25,0],.17,.18,alloy,false,8);s.ball([3.56,-1.30,.03],[.44,.30,.76],violet,null,false,true);s.finish();
    const wheels=[];for(const x of [-2.49,2.35]){const axle=node(shoe,x,-.88,0),w=builder(axle);
      for(const side of [-1,1]){const z=side*1.13;
        faceDisk(w,0,0,z,.81,.57,'#51a5a8',false,17);faceDisk(w,0,0,z+side*.27,.71,.12,aqua,true,15);
        faceDisk(w,0,0,z+side*.35,.42,.06,plum,false,12);faceDisk(w,0,0,z+side*.40,.18,.03,gold,true,8);
        for(let j=0;j<3;j++){const a=tau*j/3;w.box([.52*Math.cos(a),.52*Math.sin(a),z+side*.35],[.23,.10,.035],cream,[0,0,a],true);}
      }w.finish();wheels.push(axle);
    }
    return(t,p=0)=>{shoe.rotation.z=-.025+.052*Math.sin(t*1.48)+.33*p;shoe.position.x=.34*Math.sin(t*.91)+.67*p;shoe.position.y=4.57+.10*Math.cos(t*1.48)+.86*p;for(const axle of wheels)axle.rotation.z=-t*2.3-2*p;};
  }

  function melonCollider(parent,api){
    const {builder,node}=api,b=builder(parent);
    for(const side of [-1,1]){
      for(const z of [-1.47,1.27]){b.box([side*4.65,.20,z],[1.18,.40,1.17],shadow);b.rod([side*4.66,.39,z],[side*3.94,10.07,z*.60],.23,.205,plum,false,8);}
      b.rod([side*4.64,.62,-1.38],[side*4.29,4.71,.97],.13,.12,'#8499a0',false,6);
      b.rod([side*4.44,2.23,1.20],[side*4.32,4.09,1.12],.22,.20,aqua,true,7);
    }
    for(const z of [-.9,.82]){b.rod([-4.1,10.08,z],[4.11,10.08,z],.26,.26,steel,false,9);b.rod([-3.93,10.36,z],[3.93,10.36,z],.086,.086,leaf,true,6);}
    b.box([0,.62,-.08],[9.86,.77,3.56],shadow);b.box([0,1.08,-.08],[9.68,.104,3.41],coral,null,true);b.finish();
    plaque(api,parent,0,1.02,1.77,6.50,.89,'MELON COLLIDER','NIGHT SHIFT / APPLIED FRUIT',coral);
    const slings=[];
    for(let i=0;i<3;i++){
      const arm=node(parent,(i-1)*2.44,10.08,0),m=builder(arm),y=-5.96;
      for(const z of [-.91,.77])m.rod([0,0,z],[0,y+.84,z*.61],.066,.071,'#d3d0ab',false,5);
      egg(m,[0,y,0],[1.22,1.43,1.04],(v,n)=>Math.cos(Math.atan2(v.x,v.z)*7.0+v.y*.45)>.22?'#95c958':'#447861',[0,0,.04*(i-1)]);
      if(i===2){
        // A bite shows watermelon flesh and five black seeds on the front.
        prism(m,[[-.72,-.56],[-.88,.13],[-.64,.76],[-.31,.86],[.06,.52],[.33,.50],[.54,.21],[.74,.02],[.70,-.23],[.04,-.63],[-.34,-.69]],.097,[0,y,.91],cream);
        prism(m,[[-.62,-.48],[-.74,.12],[-.57,.66],[-.31,.73],[-.02,.41],[.22,.40],[.45,.12],[.59,-.02],[.54,-.16],[.01,-.51],[-.31,-.55]],.066,[0,y,1.02],coral);
        for(const [x,dy] of [[-.54,.13],[-.28,.39],[-.19,-.22],[.02,.16],[.32,-.04]])m.ball([x,y+dy,1.105],[.057,.11,.032],night,[0,0,.29],false,true);
      }
      m.rod([0,y+1.31,0],[.19,y+1.67,-.01],.082,.066,'#998552',false,6);m.finish();slings.push(arm);
    }
    return(t,p=0)=>{const cycle=Math.sin(t*1.45);slings[0].rotation.z=-.57*Math.max(0,cycle)**1.6-.75*p;slings[2].rotation.z=.57*Math.max(0,-cycle)**1.6+.75*p;slings[1].rotation.z=.025*Math.sin(t*2.90)+.16*p*Math.sin(t*5);};
  }

  return [
    {id:'esc-organ',crew:'Dylan',name:'ESC Organ',f:.042,off:28,radius:6.0,width:11.3,height:14.7,
      ink:mint,reply:'Escape key changed the key signature.',sound:'bell',build:organ,draw:drawOrgan},
    {id:'noodle-crane',crew:'Sugi',name:'Emergency Noodle',f:.226,off:-29,radius:5.9,width:10.7,height:12.4,
      ink:gold,reply:'One emergency noodle deployed.',sound:'steam',build:noodleCrane,draw:drawCrane},
    {id:'lunar-laundry',crew:'Eryan',name:'Lunar Laundry',f:.533,off:-29,radius:7.8,width:9.0,height:9.9,
      ink:ice,reply:'The moon is on delicate.',sound:'bleep',build:laundry,draw:drawLaundry},
    {id:'moth-hotline',crew:'Night Shift',name:'Moth Hotline',f:.892,off:-27,radius:7.2,width:14.2,height:13.0,
      ink:pink,reply:'Your call has been transferred to the lamp.',sound:'cheer',build:hotline,draw:drawHotline},
    campusRide({id:'paper-jam-safari',crew:'Dylan',name:'Paper Jam Safari',f:.119,off:-27,radius:11.9,footprintRadius:5.0,width:9.1,height:11.6,ink:coral,
      reply:'Paper jam cleared. Please reload the station wagon.',sound:'copier'},paperSafari),
    campusRide({id:'axolotl-vane',crew:'Sugi',name:'Axolotl Weather Vane',f:.177,off:26,radius:12.8,footprintRadius:6.55,width:12.9,height:11.6,ink:pink,
      reply:'Crosswinds today, with a chance of gills.',sound:'steam'},vaneNewt),
    campusRide({id:'weigh-options',crew:'Eryan',name:'Weigh Your Options',f:.306,off:-26,radius:11.8,footprintRadius:7.1,width:14.05,height:10.9,ink:gold,
      reply:'The court finds in favor of the pea.',sound:'bell'},optionsScale),
    campusRide({id:'possum-claims',crew:'Night Shift',name:'Possum Lost & Found',f:.413,off:27,radius:12.0,footprintRadius:5.16,width:9.85,height:11.25,ink:aqua,
      reply:'The ring is yours. The possum keeps the receipt.',sound:'cheer'},lostPossum),
    campusRide({id:'circulating-library',crew:'Dylan',name:'The Circulating Library',f:.472,off:27,radius:11.45,footprintRadius:6.45,width:12.7,height:11.3,ink:gold,
      reply:'Your book is due in one revolution.',sound:'bell'},circulating),
    campusRide({id:'uphill-milk',crew:'Sugi',name:'Uphill Milk Works',f:.624,off:29,radius:11.3,footprintRadius:5.42,width:9.2,height:11.0,ink:ice,
      reply:'Spill recalled. Please uncry.',sound:'steam'},reversedDairy),
    campusRide({id:'one-shoe-transit',crew:'Eryan',name:'One-Shoe Transit',f:.718,off:29,radius:12.55,footprintRadius:5.5,width:10.8,height:12,ink:aqua,
      reply:'The other skate is rail replacement service.',sound:'cheer'},transitShoe),
    campusRide({id:'melon-collider',crew:'Night Shift',name:'Melon Collider',f:.969,off:28,radius:13.45,footprintRadius:9.9,width:19.8,height:10.7,ink:coral,
      reply:'Particle identified. It was a seed.',sound:'bell'},melonCollider)
  ];
})();

export {MTMLoopMidway};
