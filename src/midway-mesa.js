/* Blackout Mesa's roadside midway. A clock value and a decaying horn pulse
   completely determine each pose, including the simplified projection artwork. */
const MTMMesaMidway=(()=>{
  const pi=Math.PI,tau=2*pi,sin=Math.sin,cos=Math.cos;
  const dark='#192038',steel='#53657d',alloy='#abb9c4',white='#f5f5df';
  const mint='#76ffdd',blue='#5ccdd8',pink='#ff5fa4',lemon='#ffda56',orange='#fa9861',plum='#453448';
  function peb(b,p,s,c,glow=false,r=null){b.ball(p,s,c,r,glow,true);}
  function pipe(b,points,r,c,glow=false,n=7){for(let i=1;i<points.length;i++)b.rod(points[i-1],points[i],r,r,c,glow,n);}
  function axle(b,x,y,z,r,d,c,glow=false,n=14){b.rod([x,y,z-d/2],[x,y,z+d/2],r,r,c,glow,n);}
  function badge(root,A,name,crew,w,h,y,z,c){
    A.label(root,name.toUpperCase(),crew.toUpperCase()+'  /  2389 RESEARCH',w,h,y,z,c);
  }
  // Canvas helpers use the same metre scale as the mesh. The host supplies the
  // upward-positive transform and may call the drawing code in any camera mode.
  const {paint} = MTMKit, poly = paint.poly, stroke = (c,pts,w,ink) => paint.stroke(c,pts,ink,w), oval = paint.oval;
  function box(c,x,y,w,h,ink){c.fillStyle=ink;c.fillRect(x-w/2,y-h/2,w,h);}
  function wheel(c,x,y,r){oval(c,x,y,r,r,dark);oval(c,x,y,r*.62,r*.62,alloy);oval(c,x,y,r*.23,r*.23,pink);}

  // A public payphone with an alien face, a real coin slot and an oversized
  // receiver. The cord remains attached at both ends throughout the lift.
  const phonePose=(t,p)=>[9.30+.22*sin(t*1.54)+2.12*p,.12*sin(t*1.74)+p*.47];
  function phone(root,A){
    const b=A.builder(root);
    b.box([0,.20,0],[5.9,.44,3.52],steel);b.box([0,1.54,0],[2.36,2.55,1.57],dark);
    b.box([0,4.88,0],[4.65,5.48,2.42],'#407d83');b.box([0,5.08,1.25],[4.28,5.03,.21],'#75afa4');
    b.box([0,7.70,-.51],[5.18,.42,2.77],dark);b.box([0,7.73,.79],[5.18,.12,.16],mint,null,true);
    for(const side of [-1,1]){
      b.box([side*2.21,5.10,.93],[.28,5.14,1.09],'#548794');
      b.box([side*2.28,5.39,1.50],[.13,4.13,.10],mint,null,true);
      b.rod([side*1.88,7.76,-.62],[side*2.54,8.66,-.69],.14,.095,steel,false,7);
      peb(b,[side*2.57,8.71,-.69],[.22,.25,.23],lemon,true);
    }
    b.box([0,6.10,1.42],[3.51,1.33,.18],dark);
    for(const side of [-1,1]){
      peb(b,[side*.71,6.11,1.56],[.47,.29,.10],mint,true,[0,0,side*.32]);
      peb(b,[side*.68,6.12,1.65],[.12,.14,.06],dark,true);
    }
    for(let row=0;row<3;row++)for(let col=0;col<3;col++)b.box([(col-1)*.52-.64,4.95-row*.49,1.49],[.36,.31,.18],row===1?white:alloy);
    b.box([1.05,4.48,1.49],[.80,.90,.14],steel);b.box([1.05,4.58,1.58],[.51,.12,.055],dark);
    b.box([0,2.92,1.48],[3.81,.63,.11],dark);b.finish();badge(root,A,'Collect Callisto','Ivan',3.67,.54,2.92,1.552,mint);
    const receiver=A.node(root),h=A.builder(receiver);
    pipe(h,[[-2.82,-.30,0],[-2.22,.38,0],[-1.75,.76,0],[1.75,.76,0],[2.22,.38,0],[2.82,-.30,0]],.365,'#e4538f',false,9);
    for(const side of [-1,1]){
      peb(h,[side*2.84,-.29,0],[.79,.62,.72],pink);
      h.rod([side*2.79,-.36,0],[side*3.12,-.77,0],.67,.77,'#ff75ad',false,10);
      h.rod([side*3.12,-.77,0],[side*3.17,-.84,0],.70,.67,plum,false,10);
    }
    h.finish();
    const cord=A.node(root),coil=A.builder(cord),loop=[];cord.matrixAutoUpdate=false;
    for(let i=0;i<=28;i++){const u=i/28;loop.push([.23*(cos(u*tau*5)-1),u*6,.16*sin(u*tau*5)]);}
    pipe(coil,loop,.057,'#273349',false,5);coil.finish();
    return (t,p)=>{const [y,z]=phonePose(t,p);receiver.position.set(0,y,.12);receiver.rotation.z=z;
      const endX=-2.82*cos(z)+.29*sin(z),endY=y-2.82*sin(z)-.29*cos(z);
      cord.matrix.set(1,(endX+2.34)/6,0,-2.34,0,(endY-3.22)/6,0,3.22,0,(.12-1.04)/6,1,1.04,0,0,0,1);cord.matrixWorldNeedsUpdate=true;};
  }
  function drawPhone(c,t,p){
    c.save();box(c,0,.19,5.9,.44,steel);box(c,0,1.55,2.33,2.8,dark);box(c,0,4.98,4.67,5.48,'#548f90');box(c,0,7.68,5.16,.36,mint);
    for(const side of [-1,1]){stroke(c,[[side*1.9,7.79],[side*2.54,8.65]],.15,steel);oval(c,side*2.57,8.7,.24,.24,lemon);}
    box(c,0,6.12,3.51,1.32,dark);for(const side of [-1,1])oval(c,side*.71,6.13,.43,.23,mint,side*.32);
    for(let row=0;row<3;row++)for(let col=0;col<3;col++)box(c,(col-1)*.52-.6,4.95-row*.49,.34,.30,white);
    box(c,1.04,4.53,.8,.8,steel);box(c,1.04,4.61,.47,.10,dark);
    const [y,rz]=phonePose(t,p),cord=[];for(let i=0;i<=31;i++)cord.push([-2.62+.19*cos(i*1.09),3.22+i/31*(y-3.55-2.8*sin(rz))]);stroke(c,cord,.11,dark);
    c.translate(0,y);c.rotate(rz);stroke(c,[[-2.83,-.3],[-1.73,.77],[1.73,.77],[2.83,-.3]],.71,pink);
    for(const side of [-1,1]){oval(c,side*2.91,-.43,.86,.62,pink,-side*.54);oval(c,side*3.13,-.78,.53,.16,dark,-side*.54);}c.restore();
  }

  // Two independently popping toast slices and a physical side lever give the
  // toaster its silhouette. Their faces sit inside the darker baked crust.
  const toastY=(t,p,i)=>6.00+(i?.45:0)+2.33*Math.max(0,sin(t*1.36+i*2.6))**3+(i?2.90:3.64)*p;
  function toaster(root,A){
    const b=A.builder(root);b.box([0,.23,0],[8.27,.46,4.46],steel);
    for(const x of [-2.89,2.89])b.box([x,.63,0],[1.28,.75,3.1],dark);
    b.box([0,3.17,0],[7.86,4.58,3.73],'#67bfb4');b.box([0,5.42,0],[7.86,.50,3.72],'#b9ddd1');
    b.box([0,1.35,1.89],[7.66,.38,.13],dark);b.box([0,1.48,1.98],[7.67,.07,.08],mint,null,true);
    for(const side of [-1,1])for(let j=0;j<5;j++)b.box([side*3.956,2.32+j*.38,-.15],[.067,.16,1.11],dark);
    for(const x of [-1.84,1.84]){
      b.box([x,5.69,0],[3.25,.18,1.76],'#dce5d5');b.box([x,5.79,0],[3.01,.12,1.37],dark);
    }
    axle(b,2.65,2.93,1.95,.60,.22,'#283a52',false,12);axle(b,2.65,2.93,2.09,.43,.12,'#f78a64',false,11);
    b.box([2.77,3.04,2.18],[.18,.28,.06],white,[0,0,-.45],true);
    b.box([-1.00,3.15,1.91],[4.57,1.15,.14],dark);b.finish();badge(A.node(root,-1.0,0,0),A,'Toast Control','Harper',4.36,1.01,3.15,2.00,pink);
    const toast=[];
    for(let i=0;i<2;i++){
      const n=A.node(root,(i?1:-1)*1.80,0,i?.12:-.11),s=A.builder(n);
      s.box([0,0,0],[2.57,2.26,.61],'#a65d32');peb(s,[0,1.07,0],[1.57,.88,.37],'#ad632e');
      s.box([0,.06,.321],[2.23,1.90,.08],'#ffcc71');peb(s,[0,1.09,.310],[1.30,.65,.087],'#ffd88a');
      for(const [x,y] of [[-.76,.88],[.46,1.14],[.72,.95]])peb(s,[x,y,.394],[.083,.058,.016],'#b98750');
      for(const sign of [-1,1])peb(s,[sign*.50,.42,.390],[.115,.16,.060],dark,true);
      pipe(s,[[-.34,-.12,.387],[0,-.27,.399],[.35,-.07,.389]],.065,'#a15c41',false,6);
      s.finish();toast.push(n);
    }
    const arm=A.node(root,3.93,3.96,0),a=A.builder(arm);
    a.rod([0,0,0],[.97,0,0],.12,.12,alloy,false,7);peb(a,[1.02,0,0],[.52,.25,.59],pink);a.finish();
    return (t,p)=>{toast.forEach((s,i)=>{s.position.y=toastY(t,p,i);s.rotation.z=(i?-.07:.08)*sin(t*1.36+i)+p*(i?.22:-.24);});arm.position.y=3.92-.48*Math.max(0,sin(t*1.36))-.99*p;};
  }
  function drawToaster(c,t,p){
    c.save();box(c,0,.57,6.88,1.02,dark);box(c,0,3.12,7.87,4.61,'#67beb7');box(c,0,5.48,7.88,.47,'#c3e4d8');
    for(const x of [-1.82,1.82])oval(c,x,5.69,1.46,.20,dark);
    oval(c,2.67,2.91,.57,.57,dark);oval(c,2.67,2.91,.39,.39,orange);box(c,-1.03,3.13,4.51,1.15,dark);
    for(let i=0;i<2;i++){c.save();c.translate((i?1:-1)*1.8,toastY(t,p,i));c.rotate((i?-.07:.08)*sin(t*1.36+i)+p*(i?.22:-.24));
      box(c,0,0,2.59,2.24,'#a85f31');oval(c,0,1.06,1.59,.86,'#a85f31');box(c,0,.05,2.24,1.92,'#ffc971');oval(c,0,1.1,1.3,.64,'#ffcf7b');
      for(const x of [-.50,.50])oval(c,x,.40,.12,.16,dark);stroke(c,[[-.32,-.12],[0,-.27],[.32,-.09]],.10,'#9a583e');c.restore();}
    const a=3.92-.48*Math.max(0,sin(t*1.36))-.99*p;stroke(c,[[3.85,a],[4.88,a]],.13,alloy);oval(c,4.99,a,.49,.23,pink);c.restore();
  }

  // The beam surrounds one grain on a laboratory balance. It is made from open
  // filaments so the saucer and its specimen are visible from either direction.
  const saucerY=(t,p)=>9.0+.39*sin(t*.91)+1.70*p;
  function inspector(root,A){
    const b=A.builder(root);
    b.rod([0,-.29,0],[0,.45,0],3.02,3.20,steel,false,12);b.rod([0,.45,0],[0,1.94,0],2.81,2.53,'#566e80',false,12);
    b.rod([0,1.94,0],[0,2.16,0],2.61,2.69,mint,true,12);b.rod([0,2.14,0],[0,2.49,0],1.62,2.01,'#aabac3',false,12);
    b.box([0,1.20,2.67],[4.31,1.03,.16],dark);b.finish();badge(root,A,'Grain Inspector','Ivan',4.14,.92,1.20,2.77,mint);
    const grain=A.node(root,0,3.60,0),g=A.builder(grain);
    g.rod([0,-.83,0],[0,-.17,0],.16,.88,'#b67836',false,6);g.rod([0,-.17,0],[.09,.29,-.08],.88,.76,'#ffc46a',false,6);
    g.rod([.09,.29,-.08],[.19,.72,-.11],.76,.21,'#ffdc90',false,6);g.finish();
    const ship=A.node(root),s=A.builder(ship);
    s.rod([0,-.73,0],[0,-.43,0],1.47,3.15,plum,false,14);
    s.rod([0,-.43,0],[0,-.08,0],3.15,5.25,'#677593',false,16);
    s.rod([0,-.08,0],[0,.14,0],5.25,5.25,mint,true,16);s.rod([0,.14,0],[0,.85,0],5.25,2.24,'#a08daf',false,16);
    s.ball([0,.85,0],[2.02,1.32,1.78],'#5baab4');
    for(let i=0;i<9;i++){const a=i*tau/9;peb(s,[3.68*sin(a),.48,3.68*cos(a)],[.28,.19,.28],i%3?pink:lemon,true);}
    s.rod([.11,2.05,0],[.50,2.85,.04],.10,.07,alloy,false,7);peb(s,[.52,2.95,.04],[.27,.27,.27],pink,true);
    s.finish();const scan=A.node(root),beams=A.builder(scan);
    for(let i=0;i<5;i++){const a=i*tau/5;beams.rod([1.55*cos(a),0,1.55*sin(a)],[2.11*cos(a),-1,2.11*sin(a)],.035,.04,i%2?blue:'#bf9edf',true,5);}
    beams.finish();
    return (t,p)=>{const y=saucerY(t,p);ship.position.y=y;ship.rotation.set(.045*sin(t*.76),t*.37,.052*cos(t*.81)+p*.14,'YXZ');
      scan.position.y=y-.66;scan.scale.y=y-3.32;scan.rotation.y=t*.45;grain.position.y=3.72+.38*sin(t*1.39)+2.11*p;grain.rotation.set(.27,t*.91,.21,'YXZ');};
  }
  function drawInspector(c,t,p){
    c.save();const y=saucerY(t,p);box(c,0,1.08,5.6,1.76,steel);oval(c,0,2.0,2.70,.32,mint);oval(c,0,2.37,2.06,.25,alloy);
    for(const side of [-1,1])stroke(c,[[side*1.52,y-.69],[side*2.11,2.74]],.085,blue);
    const gy=3.72+.38*sin(t*1.39)+2.11*p;poly(c,[[-.82,gy-.13],[-.15,gy-.84],[.71,gy-.13],[.41,gy+.57],[.01,gy+.77]],'#ffcb70');
    c.translate(0,y);c.rotate(.052*cos(t*.81)+p*.14);oval(c,0,.75,2.11,1.34,'#62aeb9');
    stroke(c,[[.1,1.98],[.48,2.85]],.13,alloy);oval(c,.51,2.94,.25,.25,pink);
    poly(c,[[-5.27,0],[-2.19,.89],[2.19,.89],[5.27,0],[2.17,-.64],[-2.17,-.64]],'#9b8caf');oval(c,0,-.03,5.19,.16,mint);
    for(const x of [-3.6,-1.9,0,1.9,3.6])oval(c,x,.26,.19,.12,x?pink:lemon);c.restore();
  }

  // The clock is the snail's actual shell. Its minute hand jumps on a horn,
  // while the towed hourglass independently tips over in its little cart.
  function escargot(root,A){
    const all=A.node(root);all.scale.setScalar(1.14);const body=A.node(all),b=A.builder(body);
    b.ball([-.12,1.36,0],[4.44,1.15,1.62],'#6cb99f');
    peb(b,[-3.64,1.08,.10],[1.59,.64,1.04],'#76c5a7');
    b.rod([1.96,1.42,0],[3.45,3.99,0],.96,.78,'#83c7a5',false,10);peb(b,[3.49,4.0,0],[1.12,.88,.94],'#a5d7a8');
    for(let i=0;i<7;i++)peb(b,[-2.76+i*.80,.90,1.14],[.31,.18,.38],i%2?'#9bd4ad':'#75b8a0');
    pipe(b,[[3.80,3.82,.83],[4.12,3.84,.86],[4.35,3.99,.73]],.068,'#4a7061',false,6);
    axle(b,-.77,4.51,0,2.77,1.64,'#8b6494',false,16);axle(b,-.77,4.51,.86,2.62,.22,'#cd719d',false,16);
    axle(b,-.77,4.51,1.03,2.39,.14,'#e2d49d',false,18);axle(b,-.77,4.51,1.12,2.04,.10,'#253f50',false,18);
    for(let j=0;j<12;j++){
      const a=j*tau/12;b.box([-.77+1.82*sin(a),4.51+1.82*cos(a),1.21],[j%3?.115:.19,j%3?.23:.33,.065],j%3?'#c9d7be':mint,[0,0,-a],j%3===0);
    }
    pipe(b,[[-4.46,.65,0],[-5.10,.44,.04],[-5.86,.67,.03]],.095,alloy,false,6);
    b.box([0,1.33,1.667],[3.16,.68,.14],dark);b.finish();const minute=A.node(body,-.77,4.51,1.27),hour=A.node(body,-.77,4.51,1.33);
    const m=A.builder(minute);m.box([0,.82,0],[.13,1.76,.075],pink,null,true);m.finish();
    const h=A.builder(hour);h.box([0,.50,0],[.20,1.17,.08],lemon,null,true);axle(h,0,0,.08,.175,.10,white,true,9);h.finish();
    const eyes=[];
    for(const [n,x] of [[0,3.14],[1,3.85]]){
      const eye=A.node(body,x,4.58,(n?-.19:.29)),e=A.builder(eye),d=n?.91:-.36;
      e.rod([0,0,0],[d,1.46,0],.14,.12,'#739e83',false,7);
      peb(e,[d,1.54,0],[.44,.47,.39],white);peb(e,[d+.095,1.55,.305],[.22,.24,.13],dark,true);
      e.finish();eyes.push(eye);
    }
    const cart=A.builder(all);
    cart.box([-6.48,.80,0],[2.31,.45,1.52],'#ad617b');
    for(const side of [-1,1])for(const x of [-7.28,-5.72]){
      axle(cart,x,.50,side*.79,.40,.23,dark,false,9);axle(cart,x,.50,side*.92,.23,.09,alloy,false,8);}
    for(const x of [-7.38,-5.58])cart.rod([x,.96,0],[x,2.39,0],.087,.08,alloy,false,6);
    cart.finish();
    const sand=A.node(all,-6.49,2.19,0),sg=A.builder(sand);
    sg.rod([0,-1.02,0],[0,-.87,0],.81,.81,'#bd8292',false,10);sg.rod([0,.87,0],[0,1.02,0],.81,.81,'#bd8292',false,10);
    sg.rod([0,-.84,0],[0,-.04,0],.62,.05,'#ddc67e',false,8);sg.rod([0,.05,0],[0,.84,0],.055,.62,'#a7c3ba',false,8);
    sg.finish();badge(body,A,'Escargot Express','Soon',3.0,.58,1.34,1.748,pink);
    return (t,p)=>{body.position.x=.10*sin(t*1.02)+.26*p;body.scale.y=1+.035*sin(t*1.33)-.05*p;
      minute.rotation.z=-t*1.11-2.31*p;hour.rotation.z=-.76-t*.087-.23*p;sand.rotation.z=.1*sin(t*1.05)+pi*p;
      eyes.forEach((o,i)=>o.rotation.z=.11*sin(t*1.24+i*.78)-(.42+i*.08)*p);};
  }
  function drawEscargot(c,t,p){
    c.save();c.scale(1.14,1.14);stroke(c,[[-4.2,.76],[-5.8,.58]],.14,alloy);
    box(c,-6.48,.80,2.30,.43,'#b86d88');wheel(c,-7.23,.47,.39);wheel(c,-5.75,.47,.39);
    c.save();c.translate(-6.48,2.17);c.rotate(.10*sin(t*1.05)+pi*p);poly(c,[[-.65,.86],[.65,.86],[-.61,-.86],[.61,-.86]],'#d6c787');box(c,0,.93,1.63,.15,pink);box(c,0,-.93,1.63,.15,pink);c.restore();
    c.translate(.10*sin(t*1.02)+.26*p,0);c.scale(1,1+.035*sin(t*1.33)-.05*p);
    oval(c,-.43,1.31,4.66,1.10,'#73bca2');stroke(c,[[1.96,1.41],[3.51,4.05]],1.72,'#8dcbab');oval(c,3.49,4.0,1.08,.87,'#a3d5a8');
    for(const [i,x,d] of [[0,3.14,-.36],[1,3.85,.91]]){c.save();c.translate(x,4.56);c.rotate(.11*sin(t*1.24+i*.78)-(.42+i*.08)*p);stroke(c,[[0,0],[d,1.46]],.23,'#73a68d');oval(c,d,1.54,.41,.44,white);oval(c,d+.08,1.55,.18,.20,dark);c.restore();}
    oval(c,-.77,4.51,2.76,2.76,'#c47c9a');oval(c,-.77,4.51,2.37,2.37,'#e1d19a');oval(c,-.77,4.51,2.03,2.03,'#2c4151');
    for(let i=0;i<12;i++){const a=i*tau/12;stroke(c,[[-.77+1.69*sin(a),4.51+1.69*cos(a)],[-.77+1.91*sin(a),4.51+1.91*cos(a)]],.15,i%3?white:mint);}
    for(const [a,len,w,col] of [[t*1.11+2.31*p,1.67,.14,pink],[.76+t*.087+.23*p,1.10,.20,lemon]])stroke(c,[[-.77,4.51],[-.77+len*sin(a),4.51+len*cos(a)]],w,col);c.restore();
  }

  // A laundromat grew into a saguaro. Rotating laundry prints live behind its
  // drum rim; the last sock still on the line swings away from the right arm.
  function cactus(root,A){
    const b=A.builder(root);b.rod([0,-.25,0],[0,.44,0],3.49,3.62,steel,false,11);
    b.rod([0,.38,0],[0,1.12,0],3.24,2.76,'#567d78',false,11);
    b.rod([0,.93,0],[0,8.85,0],1.89,1.36,'#539b81',false,12);peb(b,[0,8.83,0],[1.41,1.68,1.35],'#6ab393');
    for(const [side,out,bend,top] of [[-1,3.95,4.85,8.47],[1,3.78,6.05,9.54]]){
      pipe(b,[[side*.85,bend+.03,0],[side*(out-.91),bend,0],[side*out,bend+.94,0],[side*out,top,0]],.62,'#60a98d',false,9);
      peb(b,[side*(out-.5),bend+.31,0],[.91,.69,.69],'#63ad8e');peb(b,[side*out,top,0],[.65,.84,.64],'#72bb94');
      b.rod([side*out,top-.82,.63],[side*out,top+.17,.63],.045,.045,mint,true,5);
    }
    for(const x of [-.74,0,.73])b.rod([x,6.34,1.23],[x*.58,9.48,1.15],.046,.038,'#a1cf9a',false,5);
    for(const [x,y] of [[-1.26,7.94],[.91,8.58],[-3.96,7.4],[3.78,7.62]])for(const side of [-1,1])
      b.rod([x,y,.17],[x+side*.31,y+.38,.33],.06,.014,'#ecd58f',false,5);
    // Three petals and their throat form a bright washer-status flower.
    for(const [x,y] of [[-.38,10.18],[.05,10.49],[.47,10.20]])peb(b,[x,y,0],[.40,.46,.29],pink);
    peb(b,[.05,10.15,.14],[.29,.29,.22],lemon,true);
    b.box([0,4.44,1.18],[4.55,4.72,1.39],'#c1c9ae');b.box([0,6.35,1.93],[4.37,.77,.14],dark);
    b.box([-1.39,6.32,2.03],[.84,.27,.06],mint,null,true);axle(b,1.49,6.32,2.02,.25,.12,'#e5c477',false,10);
    axle(b,0,4.29,1.99,1.94,.23,'#596977',false,16);axle(b,0,4.29,2.15,1.75,.16,'#93b8b4',false,16);
    axle(b,0,4.29,2.27,1.51,.10,'#263949',false,16);
    b.box([0,1.54,2.01],[4.51,.78,.18],dark);b.finish();badge(root,A,'Saguaro Spin Cycle','Soon',4.36,.65,1.54,2.115,mint);
    const drum=A.node(root,0,4.29,2.35),laundry=A.builder(drum);
    for(const [i,col] of [pink,lemon,mint].entries()){
      const a=i*tau/3;peb(laundry,[.85*sin(a),.85*cos(a),.012],[.62,.34,.06],col,false,[0,0,.28-a]);}
    laundry.finish();
    const sock=A.node(root,3.76,9.48,.07),s=A.builder(sock);
    pipe(s,[[0,0,0],[.66,-.26,.05],[1.27,-.08,.03]],.067,'#dec393',false,5);
    s.box([1.26,-.34,.11],[.65,.24,.29],white);s.box([1.27,-1.06,.12],[.54,1.36,.34],pink,[0,0,.02]);
    s.box([1.54,-1.70,.13],[.91,.44,.38],pink,[0,0,.07]);s.box([1.84,-1.70,.13],[.27,.44,.37],lemon,[0,0,.07]);s.finish();
    return (t,p)=>{drum.rotation.z=-t*1.76-3.48*p;sock.rotation.z=.23*sin(t*1.53)+.86*p;};
  }
  function drawCactus(c,t,p){
    c.save();box(c,0,.44,6.94,.86,steel);stroke(c,[[0,1.15],[0,8.86]],3.44,'#63a787');
    for(const [x,y,top] of [[-3.95,4.85,8.47],[3.78,6.05,9.52]])stroke(c,[[0,y],[x*.76,y],[x,y+.94],[x,top]],1.24,'#67ad90');
    oval(c,0,8.87,1.40,1.65,'#6bb194');for(const [x,y] of [[-.38,10.19],[.05,10.49],[.47,10.20]])oval(c,x,y,.44,.46,pink);oval(c,0,10.17,.27,.27,lemon);
    box(c,0,4.42,4.56,4.72,'#bdcbb1');box(c,0,6.33,4.43,.70,dark);box(c,-1.36,6.32,.81,.24,mint);oval(c,1.46,6.33,.24,.24,lemon);
    oval(c,0,4.29,1.93,1.93,steel);oval(c,0,4.29,1.71,1.71,'#a6c6bf');oval(c,0,4.29,1.50,1.50,'#293f51');
    c.save();c.translate(0,4.29);c.rotate(-t*1.76-3.48*p);for(const [i,col] of [pink,lemon,mint].entries()){const a=i*tau/3;oval(c,.85*sin(a),.85*cos(a),.60,.34,col,.28-a);}c.restore();
    c.translate(3.76,9.48);c.rotate(.23*sin(t*1.53)+.86*p);stroke(c,[[0,0],[.66,-.26],[1.27,-.08]],.12,'#e6d395');box(c,1.26,-.35,.62,.20,white);box(c,1.27,-1.05,.54,1.34,pink);box(c,1.52,-1.7,.89,.44,pink);box(c,1.84,-1.70,.26,.44,lemon);c.restore();
  }

  // Two lacquered chopsticks orbit a pleated, ringed bao above a folded
  // takeout carton. The horn closes the sticks and launches the little moon.
  function chopPose(t,p){
    const center=.38+.065*sin(t*.87),opening=.145+.083*sin(t*1.43)-.091*p;
    return {a:center-opening,b:center+opening,x:-2.39+8.55*sin(center),y:4.73+8.55*cos(center)+.20*sin(t*1.7)+2.06*p};
  }
  function eclipse(root,A){
    const pedestal=A.builder(root);pedestal.box([0,.18,0],[6.63,.39,4.09],steel);pedestal.finish();
    const squashed=A.node(root);squashed.scale.z=.61;
    const corners=A.node(squashed);corners.rotation.y=pi*.25;const carton=A.builder(corners);
    carton.rod([0,.35,0],[0,5.43,0],4.0,5.18,'#e6ddb1',false,4);carton.rod([0,5.40,0],[0,5.60,0],5.20,5.20,'#b75c62',false,4);carton.finish();
    const b=A.builder(root);
    b.box([0,5.58,0],[6.82,.11,3.96],'#71525b');
    b.box([-3.41,5.89,0],[1.53,.15,3.92],'#ffedc8',[0,0,-.46]);b.box([3.41,5.89,0],[1.53,.15,3.92],'#f8ddac',[0,0,.46]);
    b.box([0,5.73,-2.09],[6.4,.14,1.03],'#f6e0b1',[.46,0,0]);b.box([0,5.67,2.0],[6.34,.12,.81],'#f9e5c0',[-.32,0,0]);
    for(const side of [-1,1])pipe(b,[[side*3.37,3.85,.42],[side*3.47,6.12,-.03],[side*2.29,7.32,-.43],[0,7.50,-.44]],.092,steel,false,7);
    for(const side of [-1,1])pipe(b,[[side*2.64,.65,1.85],[side*2.94,3.12,2.06],[side*3.50,5.37,2.24]],.085,'#a85b66',false,6);
    axle(b,0,3.63,2.15,1.11,.11,'#cf706c',false,13);axle(b,0,3.63,2.23,.85,.07,'#f7e7bd',false,13);
    pipe(b,[[-.62,3.57,2.31],[-.21,3.90,2.31],[.20,3.52,2.31],[.61,3.77,2.31]],.10,'#a24e68',false,6);
    b.box([0,1.49,1.93],[4.74,1.19,.15],dark);b.finish();badge(root,A,'Dim Sum Eclipse','Harper',4.51,1.02,1.49,2.025,pink);
    const sticks=[];
    for(const [i,z] of [[0,-.06],[1,.29]]){
      const n=A.node(root,-2.39,4.73,z),chop=A.builder(n);
      chop.rod([0,.05,0],[0,8.90,0],.21,.092,i?'#b94e69':'#bd5c55',false,7);
      chop.rod([0,.85,0],[0,1.49,0],.236,.227,'#e6c078',false,7);
      chop.rod([0,6.76,0],[0,7.23,0],.154,.147,mint,true,7);chop.rod([0,8.86,0],[0,9.15,0],.097,.062,'#f1cd85',false,7);
      chop.finish();sticks.push(n);
    }
    const moon=A.node(root),m=A.builder(moon);
    m.ball([0,.04,0],[1.66,1.23,1.19],'#eed9a5');
    m.rod([0,.64,0],[0,1.27,0],1.32,.47,'#efdbac',false,10);
    for(let i=0;i<9;i++){
      const a=i*tau/9,outer=[1.12*cos(a),.64,1.02*sin(a)],mid=[.85*cos(a+.09),1.04,.76*sin(a+.09)],tip=[.32*cos(a+.27),1.29,.28*sin(a+.27)];
      pipe(m,[outer,mid,tip],.066,'#bf9b72',false,5);
    }
    peb(m,[.05,1.28,-.01],[.44,.22,.37],'#f6e3b4');
    for(const side of [-1,1]){peb(m,[side*.47,.18,1.10],[.16,.20,.10],dark,true);peb(m,[side*.74,-.11,1.01],[.22,.11,.07],pink);}
    pipe(m,[[-.23,-.15,1.17],[0,-.24,1.18],[.22,-.13,1.17]],.047,'#7f6358',false,5);
    const orbit=[];for(let i=0;i<=18;i++){const a=i*tau/18;orbit.push([2.22*cos(a),-.18+.29*cos(a)+.28*sin(a),1.33*sin(a)]);}
    pipe(m,orbit,.060,mint,true,5);peb(m,[-1.72,-.17,.71],[.18,.18,.18],lemon,true);m.finish();
    return (t,p)=>{const q=chopPose(t,p);sticks[0].rotation.z=-q.a;sticks[1].rotation.z=-q.b;
      moon.position.set(q.x,q.y,.23);moon.rotation.set(.05*sin(t*1.24),.12*sin(t*.90),.14*sin(t*1.19)+p*.63,'YXZ');};
  }
  function drawEclipse(c,t,p){
    c.save();box(c,0,.20,6.67,.38,steel);poly(c,[[-2.81,.34],[2.81,.34],[3.68,5.51],[-3.68,5.51]],'#e4d6b0');
    stroke(c,[[-2.95,3.89],[-3.45,6.1],[-2.28,7.32],[0,7.52],[2.28,7.32],[3.45,6.1],[2.95,3.89]],.14,steel);
    poly(c,[[-4.03,6.18],[-2.91,5.49],[2.9,5.49],[4.07,6.18],[3.61,5.36],[-3.62,5.36]],'#f8e6be');
    oval(c,0,3.65,1.10,1.10,'#c96a70');oval(c,0,3.65,.82,.82,'#f5e4ba');stroke(c,[[-.59,3.56],[-.21,3.88],[.17,3.56],[.58,3.78]],.13,'#a55469');
    const q=chopPose(t,p);for(const [i,a] of [q.a,q.b].entries()){c.save();c.translate(-2.39,4.73);c.rotate(-a);poly(c,[[-.22,0],[.22,0],[.074,9.16],[-.074,9.16]],i?'#bd5467':'#d17564');box(c,0,7.00,.24,.46,mint);c.restore();}
    c.translate(q.x,q.y);c.rotate(.14*sin(t*1.19)+p*.63);oval(c,0,.04,1.64,1.22,'#ecdaad');oval(c,0,.78,1.08,.55,'#efdfb2');
    for(const x of [-.76,-.38,0,.38,.76])stroke(c,[[x,.75],[x*.62,1.11],[x*.32,1.24]],.065,'#b8a078');
    for(const x of [-.47,.47])oval(c,x,.17,.145,.19,dark);
    c.strokeStyle=mint;c.lineWidth=.085;c.beginPath();c.ellipse(0,-.16,2.24,.43,.15,0,tau);c.stroke();c.restore();
  }

  // Deep-cut enamel profiles give the new billboard sculptures a readable
  // outline at driving speed. Geometry is shared between mirrored panels.
  const shapes=new WeakMap();
  function cut(b,outline,p,s,shade,rot=null,glow=false){
    if(!shapes.has(outline)){
      const shape=new THREE.Shape(outline.map(([x,y])=>new THREE.Vector2(x,y)));
      const g=new THREE.ExtrudeGeometry(shape,{depth:1,bevelEnabled:false,curveSegments:1,steps:1});
      g.translate(0,0,-.5);shapes.set(outline,g);
    }
    b.add(shapes.get(outline),p,s,rot,shade,glow);
  }
  const aqua='#66b9bc',coral='#f77878',cream='#ffe6a5',cobalt='#50668d';

  // Paint the same roadside marquee in the upright, meter-based Canvas view.
  function marquee(c,title,x,y,w,h,accent){
    c.save();c.translate(x,y);c.scale(w/500,-h/100);
    box(c,0,0,500,100,dark);box(c,0,-45,480,7,accent);
    c.fillStyle=white;c.font='italic 900 62px Display, Impact, sans-serif';
    c.textAlign='center';c.textBaseline='middle';c.fillText(title.toUpperCase(),0,3,462);c.restore();
  }

  // The motel literally walks in. Each diagonal pair of feet takes a turn,
  // while the hanging room key kicks away from the roof when a room is called.
  const motelFob=[[0,1.76],[.85,1.08],[1.17,-.52],[.35,-1.43],[-.52,-1.15],[-1.04,.32],[-.79,1.18]];
  const motelRoof=[[-5.60,-.56],[4.95,-.34],[5.80,.59],[.95,.10],[-5.79,.41]];
  const motelGait=(t,p,i)=>sin(t*2.02+i*pi)+p*(i?1.65:-1.65);
  function motelHip(h,s,p){
    // Follow the outer corner of the rotated foot to keep its sole on the ground.
    const a=h*.23,sole=a-s*.06;
    const ground=-s*1.42*sin(a)+2.76*cos(a)+.905*Math.abs(sin(sole))+.26*Math.abs(cos(sole))+.04;
    return Math.max(ground,3.16+.24*Math.max(0,h)+.26*p);
  }
  function motorInn(root,A){
    const deck=A.node(root),b=A.builder(deck);
    b.box([0,5.54,0],[9.52,3.67,3.18],aqua);b.box([0,3.68,0],[10.30,.40,3.79],dark);
    b.box([0,4.05,1.72],[9.77,.29,.58],coral);cut(b,motelRoof,[0,7.62,0],[1,1,3.91],cream);
    for(let i=-1;i<=1;i++){
      const x=i*3.03;b.box([x-.63,5.25,1.64],[.95,2.20,.15],plum);
      b.box([x-.74,5.55,1.74],[.44,.42,.07],lemon,null,true);
      b.box([x+.54,5.86,1.66],[1.08,.92,.14],dark);
      b.box([x+.54,5.89,1.77],[.89,.69,.08],i?blue:pink,null,true);
      b.box([x+.56,5.92,1.84],[.057,.75,.045],cream);
    }
    for(const x of [-4.86,4.84])b.box([x,5.49,1.74],[.14,3.0,.15],cream);
    for(const z of [-.71,.71])b.rod([1.24,7.75,z],[1.24,9.44,z],.15,.12,steel,false,6);
    const rooftop=A.node(deck,1.19,0,0);
    badge(rooftop,A,'Walk-Inn Motel','Soon',7.78,1.34,9.15,1.17,pink);
    // The backing is centered under the lettering, including its roof offset.
    b.box([1.18,9.15,.97],[7.94,1.49,.36],dark);
    pipe(b,[[-4.28,7.74,.4],[-4.28,11.52,.4],[-2.74,11.52,.4]],.11,alloy,false,6);
    b.finish();
    const fob=A.node(deck,-2.80,11.46,.41),k=A.builder(fob);
    k.rod([0,0,0],[0,-.52,0],.078,.078,alloy,false,6);
    cut(k,motelFob,[0,-1.67,0],[.69,.82,.28],lemon);
    axle(k,0,-1.60,.18,.43,.075,plum,false,10);k.box([0,-1.61,.24],[.13,.51,.04],white,[0,0,-.22],true);k.finish();
    const legs=[];
    for(const x of [-3.40,3.35])for(const z of [-1.19,1.19]){
      const leg=A.node(root,x,3.94,z),l=A.builder(leg),s=x>0?1:-1;
      l.rod([0,-.11,0],[0,1.40,0],.29,.21,steel,false,6);
      l.rod([0,0,0],[s*.51,-1.41,0],.29,.20,steel,false,7);axle(l,s*.51,-1.41,.035,.37,.62,orange,false,9);
      l.rod([s*.51,-1.41,0],[s*1.18,-2.55,.10],.18,.27,alloy,false,7);
      l.box([s*1.42,-2.76,.13],[1.81,.52,1.05],dark,[0,0,-s*.06]);
      l.box([s*1.43,-2.63,.71],[1.47,.12,.08],mint,null,true);l.finish();legs.push({leg,s,i:(x>0)!==(z>0)?1:0});
    }
    return (t,p)=>{deck.position.y=-.30+.17*cos(t*4.04)+.57*p;deck.rotation.z=.014*sin(t*2.02)+.042*p;
      legs.forEach(({leg,i,s})=>{const h=motelGait(t,p,i);leg.rotation.z=h*.23;leg.position.y=motelHip(h,s,p);});
      fob.rotation.z=.27*sin(t*2.02+.87)+1.35*p;};
  }
  function drawMotorInn(c,t,p){
    c.save();for(const [i,x] of [-3.40,3.35].entries()){const s=i?1:-1,h=motelGait(t,p,i);
      c.save();c.translate(x,motelHip(h,s,p));c.rotate(h*.23);
      stroke(c,[[0,1.4],[0,0],[s*.51,-1.41],[s*1.18,-2.55]],.46,alloy);oval(c,s*.51,-1.41,.35,.35,orange);
      box(c,s*1.42,-2.76,1.81,.52,dark);box(c,s*1.42,-2.66,1.46,.10,mint);c.restore();}
    c.translate(0,-.30+.17*cos(t*4.04)+.57*p);c.rotate(.014*sin(t*2.02)+.042*p);
    box(c,0,5.54,9.52,3.67,aqua);box(c,0,3.71,10.28,.43,dark);box(c,0,4.05,9.77,.25,coral);
    for(const x of [-3.03,0,3.03]){box(c,x-.63,5.24,.95,2.19,plum);box(c,x-.75,5.55,.42,.39,lemon);box(c,x+.54,5.87,1.09,.90,dark);box(c,x+.54,5.88,.83,.65,x?blue:pink);}
    poly(c,motelRoof.map(([x,y])=>[x,7.62+y]),cream);stroke(c,[[1.20,7.71],[1.20,9.43]],.23,alloy);
    marquee(c,'Walk-Inn Motel',1.18,9.15,7.94,1.49,pink);
    stroke(c,[[-4.28,7.75],[-4.28,11.52],[-2.80,11.52]],.19,alloy);
    c.translate(-2.80,11.46);c.rotate(.27*sin(t*2.02+.87)+1.35*p);poly(c,motelFob.map(([x,y])=>[x*.69,-1.67+y*.82]),lemon);oval(c,0,-1.62,.40,.40,plum);c.restore();
  }

  // The walking beam pumps the wafer tank. A sudden pressure surge can pop
  // the cherry clean off the uppermost swirl.
  const pumpHead=[[-.49,-1.00],[.34,-1.13],[.83,-.67],[.89,.50],[.39,1.33],[-.69,.99],[-.29,.30]];
  const creamLayers=[[7.85,2.84,1.15,cream,0],[8.98,2.43,1.02,'#fcb88e',-.22],
    [9.94,1.88,.93,cream,.18],[10.71,1.27,.76,'#f7c19d',.40],[11.36,.69,.63,cream,.69]];
  const pumpTilt=(t,p)=>-.12+.16*sin(t*1.54)+.30*p;
  function sundae(root,A){
    const b=A.builder(root),cx=2.05;b.box([0,.19,0],[11.6,.38,4.10],steel);
    for(const side of [-1,1]){
      for(const z of [-.91,.91])b.rod([-3.49+side*2.08,.42,z],[-3.49+side*.32,8.12,z*.35],.22,.15,'#bb7d65',false,6);
      b.rod([-3.52-side*1.58,2.56,side*.79],[-3.50+side*.94,5.67,side*.52],.105,.105,alloy,false,6);
    }
    b.box([-3.47,7.99,1.01],[1.27,.54,3.23],dark);axle(b,-3.47,8.28,1.19,.48,3.09,lemon,false,10);
    b.rod([cx,.55,0],[cx,7.73,0],.22,2.60,'#d49759',false,12);
    // Diagonal burnt waffle grooves follow the taper of the cone.
    for(let i=0;i<10;i++)for(const side of [-1,1]){
      const a=i*tau/10,r0=.92,r1=2.58,shift=side*.82,mr=(r0+r1)*.50;
      pipe(b,[[cx+r0*cos(a),2.53,r0*sin(a)],[cx+mr*cos(a+shift*.50),5.05,mr*sin(a+shift*.50)],[cx+r1*cos(a+shift),7.64,r1*sin(a+shift)]],.061,'#9c674d',false,5);
    }
    b.rod([cx,7.44,0],[cx,7.73,0],2.60,2.70,'#efad67',false,12);
    for(const [y,r,ry,col,off] of creamLayers)peb(b,[cx+off,y,0],[r,ry,r*.84],col);
    for(const [x,y,z] of [[1.03,8.62,2],[2.46,8.38,2.14],[3.40,9.34,1.54],[1.78,10.04,1.48]])
      b.box([x,y,z],[.37,.095,.08],pink,[0,0,.49],true);
    b.box([cx,.62,0],[2.77,.64,2.73],plum);const tag=A.node(root,-.42,0,0);
    b.box([-.42,1.44,1.90],[5.90,1.09,.19],dark);badge(tag,A,'Crude Sundae','Harper',5.72,.96,1.44,2.01,orange);b.finish();
    const boom=A.node(root,-3.47,8.28,2.63),rig=A.builder(boom);
    rig.box([2.26,.14,0],[8.27,.34,.70],alloy);rig.box([2.31,.34,0],[8.20,.09,.72],lemon,null,true);
    cut(rig,pumpHead,[6.00,-.01,.01],[.70,.83,.88],coral);rig.box([-1.42,-.48,0],[1.34,1.36,.94],cobalt);rig.finish();
    const cherry=A.node(root),fruit=A.builder(cherry);
    peb(fruit,[0,0,0],[.86,.87,.83],pink);peb(fruit,[-.27,.27,.63],[.20,.14,.07],white,true);
    pipe(fruit,[[.04,.65,-.01],[.18,1.53,0],[.71,1.97,0]],.11,'#455b49',false,6);peb(fruit,[.71,1.78,0],[.52,.16,.19],'#89bc7f',false,[0,0,.46]);fruit.finish();
    return (t,p)=>{boom.rotation.z=pumpTilt(t,p);cherry.position.set(2.53+.23*cos(t*1.54)+.28*p,12.17+.51*sin(t*1.54)+2.19*p,.05);cherry.rotation.z=.15*sin(t*1.54+.71)+.38*p;};
  }
  function drawSundae(c,t,p){
    c.save();box(c,0,.20,11.6,.39,steel);for(const x of [-5.57,-1.41])stroke(c,[[x,.39],[-3.47,8.16]],.39,'#c58266');
    stroke(c,[[-4.94,2.55],[-2.60,5.68],[-4.23,5.68],[-1.91,2.55]],.15,alloy);
    poly(c,[[1.84,.58],[2.27,.58],[4.65,7.72],[-.56,7.72]],'#df9c61');
    poly(c,[[.95,3.37],[1.32,4.69],[2.85,6.42],[3.94,7.64],[3.62,7.64],[1.02,4.41]],'#a86f52');
    poly(c,[[.15,5.66],[.38,6.49],[1.45,7.66],[1.08,7.66]],'#a86f52');
    for(const [y,r,ry,col,off] of creamLayers)oval(c,2.05+off,y,r,ry,col);marquee(c,'Crude Sundae',-.42,1.44,5.89,1.09,orange);
    c.save();c.translate(-3.47,8.28);c.rotate(pumpTilt(t,p));box(c,2.26,.14,8.27,.40,alloy);box(c,2.31,.37,8.20,.09,lemon);box(c,-1.42,-.48,1.34,1.36,cobalt);
    poly(c,pumpHead.map(([x,y])=>[6+x*.70,y*.83]),coral);c.restore();
    c.translate(2.53+.23*cos(t*1.54)+.28*p,12.17+.51*sin(t*1.54)+2.19*p);c.rotate(.15*sin(t*1.54+.71)+.38*p);
    oval(c,0,0,.86,.87,pink);oval(c,-.27,.27,.19,.14,white);stroke(c,[[.04,.65],[.18,1.53],[.71,1.97]],.16,'#628460');oval(c,.71,1.78,.52,.15,'#92c585',.46);c.restore();
  }

  // A forklift passed its flamingo exam. The pink counterweight is its body,
  // the crooked black-tipped bill is the mast and the fork holds a real pallet.
  const wingPlume=[[-2.62,.17],[-1.86,.99],[-.60,1.14],[1.64,.58],[2.23,.06],[.79,-.08],[1.59,-.42],[.16,-.42],[.72,-.82],[-.63,-.69],[-1.33,-1.08],[-2.07,-.38]];
  const flamingoBill=[[-.86,.34],[-.52,.69],[.45,.48],[1.19,-.32],[1.14,-1.12],[.61,-1.68],[.64,-.87],[.10,-.43],[-.80,-.20]];
  const neckTip=(t,p)=>.08*sin(t*1.34)-.29*p;
  function flamingo(root,A){
    const b=A.builder(root);b.box([0,.20,0],[9.30,.40,4.15],steel);
    for(const z of [-.69,.69]){
      pipe(b,[[-.29,.47,z],[-.94,3.46,z],[.04,6.47,z]],.18,coral,false,7);
      b.box([-.43,.53,z],[2.49,.24,.65],dark);
      pipe(b,[[-1.65,6.35,z],[-3.22,3.75,z],[-1.64,2.91,z]],.20,'#cb7e8e',false,7);
      b.box([-1.51,2.84,z],[1.08,.19,.54],lemon);
      axle(b,-.94,3.48,z,.32,.37,alloy,false,8);
    }
    peb(b,[-.91,6.87,0],[3.25,1.54,1.35],'#e98cad');
    for(const side of [-1,1])cut(b,wingPlume,[-1.68,6.88,side*.98],[1.09,1.0,.30],side<0?'#af627f':'#e07898',[0,0,.08]);
    pipe(b,[[-3.68,7.13,-.04],[-4.40,7.48,0],[-4.83,7.36,0]],.21,pink,false,7);
    for(const z of [-.56,.56]){
      b.rod([-.08,7.06,z],[.16,8.95,z],.17,.17,steel,false,6);
      b.rod([1.35,6.46,z],[1.52,8.91,z],.13,.13,steel,false,6);
    }
    b.box([.84,8.98,0],[2.68,.20,1.93],lemon);b.box([.70,7.11,0],[.70,.51,.71],dark);
    b.box([-.48,1.43,1.74],[6.11,1.02,.18],dark);badge(A.node(root,-.48,0,0),A,'Forklift Flamingo','Ivan',5.96,.89,1.43,1.844,pink);b.finish();
    const head=A.node(root,1.73,7.32,.16),n=A.builder(head);
    pipe(n,[[0,0,0],[1.21,1.53,.02],[1.18,2.58,.03],[-.31,3.93,.07],[-.52,4.91,.12],[.54,5.55,.15]],.39,'#ee90a8',false,9);
    peb(n,[.76,5.53,.18],[.88,.59,.56],'#ffb3b8');cut(n,flamingoBill,[1.35,5.33,.23],[.89,.85,.78],cream);
    cut(n,[[.55,-.42],[1.15,-.32],[1.13,-1.10],[.61,-1.68],[.64,-.88]],[1.35,5.33,.24],[.90,.86,.80],dark);
    peb(n,[.84,5.67,.69],[.22,.22,.06],lemon,true);peb(n,[.90,5.66,.76],[.10,.11,.045],dark,true);
    n.box([2.20,4.18,0],[.19,2.21,1.27],steel);
    for(const z of [-.50,.50]){n.box([2.86,3.19,z],[1.46,.16,.20],lemon);}
    n.box([2.97,3.39,.00],[1.42,.19,1.38],'#be8f66');
    for(const x of [2.52,2.89,3.27])n.box([x,3.51,0],[.25,.10,1.46],cream);
    // A cone loaded on a pallet is the certification test.
    n.box([2.97,3.59,0],[.72,.10,.72],dark);n.rod([2.97,3.64,0],[2.97,4.58,0],.35,.038,orange,false,7);
    n.rod([2.97,3.94,0],[2.97,4.10,0],.251,.20,white,true,7);n.finish();
    return (t,p)=>{head.rotation.z=neckTip(t,p);head.position.y=7.32+.12*sin(t*1.19)+.57*p;};
  }
  function drawFlamingo(c,t,p){
    c.save();box(c,0,.2,9.3,.40,steel);stroke(c,[[-.30,.47],[-.94,3.46],[.04,6.47]],.35,coral);box(c,-.42,.53,2.49,.24,dark);
    stroke(c,[[-1.65,6.35],[-3.22,3.75],[-1.64,2.91]],.37,'#cb7e8e');box(c,-1.51,2.84,1.08,.19,lemon);
    oval(c,-.91,6.88,3.25,1.54,'#ee96af');poly(c,wingPlume.map(([x,y])=>[-1.68+x*1.09,6.88+y]),'#cb7495');stroke(c,[[0,7.05],[.17,8.95],[1.50,8.95],[1.35,6.58]],.25,steel);box(c,.84,8.98,2.67,.21,lemon);
    marquee(c,'Forklift Flamingo',-.48,1.44,6.08,1.01,pink);c.translate(1.73,7.32+.12*sin(t*1.19)+.57*p);c.rotate(neckTip(t,p));
    stroke(c,[[0,0],[1.21,1.53],[1.18,2.58],[-.31,3.93],[-.52,4.91],[.54,5.55]],.75,'#eb91a8');
    oval(c,.76,5.53,.88,.59,'#ffb3b8');poly(c,flamingoBill.map(([x,y])=>[1.35+x*.89,5.33+y*.85]),cream);
    poly(c,[[1.90,4.98],[2.39,5.00],[2.35,4.36],[1.89,3.91],[1.95,4.59]],dark);oval(c,.85,5.67,.18,.18,lemon);oval(c,.9,5.66,.09,.1,dark);
    stroke(c,[[2.20,5.19],[2.20,3.19],[3.62,3.19]],.18,lemon);box(c,2.97,3.43,1.43,.22,'#bf9a72');poly(c,[[2.62,3.63],[3.32,3.63],[3.01,4.60],[2.94,4.60]],orange);c.restore();
  }

  // The upper denture swings about a hinge at the back of the examination rig.
  // Both U-shaped gum lines have real depth and a row of individual teeth.
  const gumArc=Array.from({length:11},(_,i)=>{const a=i*pi/10;return [4.33*cos(a),-.14+2.28*sin(a)];});
  const toothArc=Array.from({length:9},(_,i)=>{const a=(i+.45)*pi/9;return [4.01*cos(a),-.12+2.20*sin(a),a];});
  const jawLift=(t,p)=>-.36-.135*(1+sin(t*1.32))+.34*p;
  function dentist(root,A){
    root=A.node(root);root.scale.setScalar(1.27);
    const b=A.builder(root);b.box([0,.22,0],[10.28,.46,5.88],steel);b.box([0,1.05,.22],[7.59,1.28,4.18],cobalt);
    for(const x of [-3.15,3.15]){
      b.rod([x,1.18,-1.46],[x,5.53,-2.16],.32,.25,steel,false,7);
      axle(b,x,5.41,-2.12,.46,.65,lemon,false,10);
    }
    b.rod([0,1.32,0],[0,2.06,0],2.15,2.62,dark,false,10);
    b.box([0,1.19,2.37],[6.83,1.17,.18],dark);badge(root,A,'Bedrock Dentistry','Harper',6.68,1.02,1.19,2.477,pink);
    // The lower plate's chrome ribs carry a violet quartz "patient".
    for(const side of [-1,1])b.rod([side*2.29,1.75,-.26],[side*3.60,2.97,.07],.16,.24,alloy,false,6);
    function row(batch,y,z,down){
      const points=gumArc.map(([x,v])=>[x,y,z+v]);pipe(batch,points,.65,down?'#f396a4':'#db7794',false,7);
      for(const [i,[x,v,a]] of toothArc.entries()){
        const col=i===(down?2:7)?lemon:i%3?'#f7e7c3':'#eeddba';
        batch.box([x,y+(down?-.52:.52),z+v],[i<2||i>6?.83:1.04,.89,.87],col,[0,pi*.5-a,0]);
        peb(batch,[x,y+(down?-.91:.91),z+v],[.46,.22,.45],col);
      }
    }
    row(b,2.75,0,false);
    b.rod([0,2.18,-.03],[0,3.39,-.03],.35,.37,alloy,false,8);
    b.rod([0,3.14,0],[.20,4.40,-.03],.83,1.43,'#9374a7',false,7);
    b.rod([.20,4.40,-.03],[-.15,5.22,0],1.43,.50,'#bf94c4',false,7);
    b.finish();
    const top=A.node(root,0,5.49,-2.24),u=A.builder(top);
    row(u,.38,2.26,true);for(const x of [-3.15,3.15])u.rod([x,.01,0],[x*.98,.38,2.94],.21,.32,alloy,false,7);
    // A separate gum roof and neon curing lamp make the gap read from above.
    peb(u,[0,.41,2.65],[3.21,.37,1.43],'#e68c9c');u.box([0,.75,2.77],[1.82,.19,.92],mint,null,true);u.finish();
    return (t,p)=>{top.rotation.x=jawLift(t,p);top.position.y=5.49+.16*sin(t*1.32)-.44*p;};
  }
  function drawDentist(c,t,p){
    c.save();c.scale(1.27,1.27);box(c,0,.21,10.28,.46,steel);box(c,0,1.09,7.59,1.28,cobalt);box(c,0,1.19,6.82,1.17,dark);
    for(const x of [-3.15,3.15])stroke(c,[[x,1.2],[x,5.55]],.45,steel);
    oval(c,0,2.80,4.81,.83,'#dd7c97');
    for(const [i,[x]] of toothArc.entries()){box(c,x,3.33,i===0||i===8?.76:1.01,.86,i===7?lemon:cream);}
    poly(c,[[-.75,3.22],[-1.18,4.31],[-.12,5.22],[1.45,4.40],[.71,3.24]],'#c59ad2');
    const angle=jawLift(t,p),hinge=5.49+.16*sin(t*1.32)-.44*p;
    const edge=hinge+.38*cos(angle)-4.08*sin(angle);const upper=gumArc.map(([x,v])=>[x,hinge+.38*cos(angle)-(2.26+v)*sin(angle)]);
    stroke(c,upper,1.19,'#f096a4');
    for(const [i,[x,v]] of toothArc.entries()){const y=hinge-.24*cos(angle)-(2.26+v)*sin(angle);box(c,x,y,.91,.83,i===2?lemon:cream);}
    box(c,0,edge+.27,1.72,.12,mint);marquee(c,'Bedrock Dentistry',0,1.19,6.82,1.17,pink);c.restore();
  }

  // A taxi and a desert jackalope share a chassis. The four wheels stay on
  // the stand when the yellow body hops and the meter flags a new fare.
  const cabShell=[[-5.24,.18],[-5.37,1.48],[-4.64,2.07],[-3.18,2.28],[-2.30,3.74],[-.47,3.85],[.94,2.47],[3.49,2.20],[4.82,1.78],[5.02,.60],[4.57,.13]];
  const hareEar=[[-.29,0],[-.58,1.28],[-.54,2.52],[-.23,3.25],[.14,3.66],[.50,2.72],[.47,1.25],[.24,.03]];
  const cabBounce=(t,p)=>.15+.12*(1+sin(t*2.78))+1.28*p;
  function jackCab(root,A){
    const base=A.builder(root);base.box([0,.16,0],[12.00,.32,4.37],steel);
    for(const x of [-3.26,3.18]){
      base.rod([x,1.37,-1.70],[x,1.37,1.70],.30,.30,steel,false,7);
      for(const z of [-1.59,1.59]){
        axle(base,x,1.36,z,1.14,.58,dark,false,13);
        axle(base,x,1.36,z+Math.sign(z)*.303,.67,.10,alloy,false,10);
        axle(base,x,1.36,z+Math.sign(z)*.363,.31,.06,pink,true,8);
      }
    }
    base.finish();const body=A.node(root,0,2.18,0),b=A.builder(body);
    cut(b,cabShell,[0,0,0],[1,1,2.85],'#f4bd46');
    cut(b,[[-2.64,2.32],[-2.04,3.36],[-1.35,3.41],[-1.35,2.32]],[0,0,1.443],[1,1,.06],cobalt);
    cut(b,[[-1.12,2.32],[-1.12,3.41],[-.60,3.45],[.41,2.40]],[0,0,1.443],[1,1,.06],cobalt);
    for(let i=0;i<13;i++)for(let j=0;j<2;j++)b.box([-4.49+i*.68,1.43+j*.31,1.45],[.67,.30,.06],(i+j)%2?cream:dark);
    b.box([-5.03,.49,0],[.63,.36,3.07],alloy);b.box([4.82,.50,0],[.73,.36,3.07],alloy);
    peb(b,[-4.84,2.49,-.03],[.81,.87,.78],cream);
    b.rod([1.73,1.87,.05],[2.84,4.08,.03],1.01,.73,'#e4a93d',false,10);
    peb(b,[3.24,4.21,.01],[1.38,1.06,.95],'#f5c16a');peb(b,[4.22,3.96,.12],[1.04,.63,.69],cream);
    peb(b,[5.08,4.07,.19],[.37,.28,.40],plum);peb(b,[3.78,4.54,.86],[.25,.28,.09],dark,true);
    peb(b,[3.85,4.63,.94],[.061,.064,.04],white,true);
    for(const [x,z,s] of [[2.88,-.39,-1],[2.93,.42,1]]){
      pipe(b,[[x,4.92,z],[x-1.01,6.24,z+s*.38],[x-2.17,6.58,z+s*.56],[x-2.80,7.47,z+s*.68]],.14,'#c59067',false,7);
      pipe(b,[[x-1.01,6.23,z+s*.38],[x-1.22,7.16,z+s*.40],[x-.95,7.80,z+s*.48]],.12,cream,false,6);
      b.rod([x-2.17,6.58,z+s*.56],[x-2.33,7.33,z+s*.66],.12,.045,cream,false,6);
    }
    const plateRoot=A.node(body,-1.03,0,0);b.box([-1.03,4.28,.08],[2.02,.77,.94],lemon);
    A.label(plateRoot,'TAXI','HAIL THE HARE',1.88,.61,4.28,.565,lemon);
    b.box([-.47,.63,1.47],[5.82,.80,.11],dark);badge(A.node(body,-.47,0,0),A,'Jackalope Cab Co.','Ivan',5.67,.67,.63,1.54,lemon);b.finish();
    const ears=[];
    for(const [i,x,z,tilt] of [[0,3.23,.38,-.18],[1,3.48,-.33,.15]]){
      const ear=A.node(body,x,4.88,z),e=A.builder(ear);cut(e,hareEar,[0,0,0],[1,1,.48],cream);
      cut(e,hareEar,[-.025,.43,.25],[.49,.76,.054],coral);e.finish();ears.push({ear,i,tilt});
    }
    return (t,p)=>{body.position.y=1.71+cabBounce(t,p);body.rotation.z=.025*sin(t*1.39)+.075*p;
      ears.forEach(({ear,i,tilt})=>ear.rotation.z=tilt+.11*sin(t*2.78+i)-p*(i?.27:-.30));};
  }
  function drawJackCab(c,t,p){
    c.save();box(c,0,.17,12.0,.32,steel);
    for(const x of [-3.26,3.18])wheel(c,x,1.37,1.14);
    c.translate(0,1.71+cabBounce(t,p));c.rotate(.025*sin(t*1.39)+.075*p);poly(c,cabShell,'#f4bd46');
    poly(c,[[-2.64,2.32],[-2.02,3.36],[-.60,3.45],[.41,2.40]],cobalt);
    for(let i=0;i<13;i++)for(let j=0;j<2;j++)box(c,-4.49+i*.68,1.43+j*.31,.67,.30,(i+j)%2?cream:dark);
    oval(c,-4.84,2.49,.81,.87,cream);stroke(c,[[1.73,1.87],[2.84,4.08]],1.51,'#e4a93d');
    for(const offset of [-.2,.22]){
      stroke(c,[[2.93,4.92],[1.93,6.23+offset],[.77,6.58+offset],[.13,7.47+offset]],.23,'#ceaa80');
      stroke(c,[[1.93,6.23+offset],[1.71,7.16+offset],[1.99,7.80+offset]],.17,cream);}
    oval(c,3.24,4.21,1.38,1.06,'#f5c16a');oval(c,4.21,3.96,1.04,.63,cream);oval(c,5.08,4.07,.36,.28,plum);oval(c,3.78,4.54,.21,.26,dark);
    for(const [i,x,tilt] of [[1,3.48,.15],[0,3.23,-.18]]){c.save();c.translate(x,4.88);c.rotate(tilt+.11*sin(t*2.78+i)-p*(i?.27:-.30));poly(c,hareEar,cream);poly(c,hareEar.map(([u,v])=>[u*.49,.43+v*.76]),coral);c.restore();}
    marquee(c,'Taxi',-1.03,4.28,2.02,.77,lemon);marquee(c,'Jackalope Cab Co.',-.47,.63,5.82,.80,lemon);c.restore();
  }

  // The roller-skate launch stand is the western return's limber-up lane.
  // The exhaust is attached to the boot and extends away from the skater.
  const bootShape=[[-5.41,1.29],[-5.75,1.89],[-5.44,2.54],[-4.69,2.99],[-2.35,3.14],[-1.55,3.60],[-.33,6.47],[-.38,8.03],[.47,8.74],[2.94,8.47],[3.41,7.88],[3.03,4.40],[3.52,2.99],[3.64,1.81],[3.12,1.31],[-2.75,1.07]];
  const jetFlame=[[0,-.63],[1.34,-.56],[1.00,-.33],[2.94,-.52],[2.14,-.13],[3.91,.04],[1.79,.29],[2.57,.63],[.94,.47],[0,.75]];
  const bootTilt=(t,p)=>-.07+.09*sin(t*1.81)-.34*p;
  const plumeSize=(t,p)=>.32+.07*sin(t*7.47)+.89*p;
  function moonBoot(root,A){
    const base=A.builder(root);base.box([0,.22,0],[11.88,.44,4.62],steel);
    for(const z of [-1.43,1.43]){
      base.rod([1.10,.36,z],[1.90,2.56,z*.63],.24,.17,alloy,false,7);
      base.rod([3.05,.36,z],[1.90,2.56,z*.63],.22,.17,steel,false,7);
    }
    base.finish();const boot=A.node(root,-.24,1.06,0),b=A.builder(boot);
    cut(b,bootShape,[0,.36,0],[1,1,2.30],'#8375b2');
    cut(b,[[-5.49,1.32],[-5.76,1.84],[-5.55,2.14],[-3.81,1.78],[-.65,1.68],[3.52,1.93],[3.58,1.53],[3.12,1.24],[-2.76,1.03]],[0,.36,0],[1,1,2.49],cream);
    for(const z of [-1.18,1.18]){
      for(const [i,x,y] of [[0,-2.19,3.41],[1,-1.68,4.02],[2,-1.30,4.70],[3,-.98,5.42],[4,-.62,6.16]])
        b.rod([x,y+.35,z],[x+.99,y+.68,z],.075,.075,i%2?mint:cream,false,5);
      b.box([1.53,8.58,z],[2.61,.42,.14],pink,[0,0,-.09],true);
    }
    cut(b,[[-.50,.26],[-.05,.42],[.13,.93],[.43,.52],[.98,.56],[.62,.10],[.79,-.48],[.24,-.28],[-.29,-.61],[-.23,-.04]],[1.56,5.80,1.18],[1.36,1.36,.10],lemon,null,true);
    b.box([-1.08,1.08,0],[8.20,.33,1.65],alloy,[0,0,.02]);
    for(const x of [-4.18,-.61,2.22])for(const z of [-.88,.88]){
      axle(b,x,.52,z,.55,.48,dark,false,10);axle(b,x,.52,z+Math.sign(z)*.26,.36,.065,blue,true,9);}
    b.rod([2.99,3.40,0],[4.36,3.48,0],.68,.93,steel,false,9);
    b.rod([4.24,3.47,0],[4.47,3.49,0],.93,.94,lemon,true,9);
    b.box([-.35,2.68,1.19],[5.26,.91,.13],dark);badge(A.node(boot,-.35,0,0),A,'Escape Velocity Boot','Soon',5.11,.80,2.68,1.27,mint);b.finish();
    const exhaust=A.node(boot,4.43,3.49,0),f=A.builder(exhaust);
    cut(f,jetFlame,[0,0,0],[1,1,.78],pink,null,true);cut(f,jetFlame,[0,.01,.407],[.64,.53,.11],lemon,null,true);f.finish();
    return (t,p)=>{boot.rotation.z=bootTilt(t,p);boot.position.y=1.01+.15*sin(t*1.81)+1.25*p;exhaust.scale.x=plumeSize(t,p);};
  }
  function drawMoonBoot(c,t,p){
    c.save();box(c,0,.22,11.88,.44,steel);stroke(c,[[1.10,.36],[1.90,2.56],[3.05,.36]],.33,alloy);
    c.translate(-.24,1.01+.15*sin(t*1.81)+1.25*p);c.rotate(bootTilt(t,p));
    for(const x of [-4.18,-.61,2.22])wheel(c,x,.52,.56);box(c,-1.08,1.08,8.2,.33,alloy);
    poly(c,bootShape.map(([x,y])=>[x,y+.36]),'#9786b9');
    stroke(c,[[-5.38,1.85],[-3.44,1.59],[-.67,1.56],[3.23,1.9]],.30,cream);
    stroke(c,[[.29,8.95],[2.85,8.70]],.37,pink);for(const [x,y] of [[-2.19,3.41],[-1.68,4.02],[-1.30,4.70],[-.98,5.42],[-.62,6.16]])stroke(c,[[x,y+.35],[x+.99,y+.68]],.14,mint);
    poly(c,[[1.00,6.09],[1.54,6.42],[1.73,7.06],[2.08,6.50],[2.78,6.57],[2.35,5.97],[2.55,5.30],[1.84,5.51],[1.18,5.02],[1.28,5.75]],lemon);
    marquee(c,'Escape Velocity Boot',-.35,2.68,5.26,.91,mint);box(c,3.79,3.49,1.41,1.36,steel);
    c.translate(4.43,3.49);c.scale(plumeSize(t,p),1);poly(c,jetFlame,pink);poly(c,jetFlame.map(([x,y])=>[x*.64,y*.53]),lemon);c.restore();
  }

  // The miniature-golf moon follows one arc into the windmill. A lower
  // retrieval track carries it back to the tee before the next horn.
  const golfBlade=[[.04,.58],[.16,1.72],[-.36,2.08],[-.37,3.71],[.51,4.13],[.69,4.03],[.58,1.34],[.22,.59]];
  function golfShot(t,p){
    const u=1-Math.sqrt(Math.min(1,Math.max(0,p)));
    const out=u<.65?u/.65:(1-u)/.35;
    return {x:-3.01+7.50*out,y:2.25+(u<.65?5.22:-.65)*sin(pi*out),z:.68+(u<.65?.21:-.83)*sin(pi*out),
      swing:.06+.05*sin(t*1.52)+p*.26+.30*Math.max(0,sin(pi*Math.min(1,u/.48)))*p};
  }
  function moonPutt(root,A){
    const b=A.builder(root);
    b.box([0,.32,0],[13.89,.64,4.89],steel);b.box([0,.73,.02],[13.66,.25,4.68],'#75af89');
    for(const z of [-1.91,1.91])b.box([0,.9,z],[13.76,.18,.19],cream);
    const wind=4.30;b.rod([wind,.86,-.48],[wind,6.19,-.48],2.06,1.17,'#c78473',false,9);
    b.rod([wind,5.88,-.48],[wind,6.35,-.48],2.02,2.06,plum,false,10);
    b.rod([wind,6.34,-.48],[wind,8.14,-.48],2.04,.21,'#da7e76',false,10);
    b.box([wind,1.73,1.30],[1.64,1.57,.13],dark);
    for(const side of [-1,1])b.box([wind+side*.83,1.74,1.39],[.13,1.57,.10],lemon,null,true);
    b.box([wind,2.55,1.39],[1.81,.16,.10],lemon,null,true);
    for(const z of [-.81,.82])pipe(b,[[-5.72,.81,z],[-5.91,7.89,z],[-4.74,9.66,z],[-3.81,9.66,z]],.18,steel,false,7);
    axle(b,-4.71,9.46,0,.46,1.94,lemon,false,10);
    b.rod([-.78,.83,-1.62],[-.78,5.88,-1.62],.077,.063,alloy,false,7);
    cut(b,[[0,0],[1.83,.18],[.99,-.39],[.17,-.61],[0,-.60]],[-.78,5.74,-1.62],[1,1,.1],pink);
    b.box([0,1.43,2.24],[6.28,1.12,.20],dark);badge(root,A,'Moon Putt','Harper',6.08,.98,1.43,2.357,mint);b.finish();
    const fan=A.node(root,wind,6.21,1.40),f=A.builder(fan);
    for(let j=0;j<4;j++){
      const a=j*pi*.5;cut(f,golfBlade,[0,0,0],[1,1,.20],j%2?cream:'#98ccbb',[0,0,a]);
      const x=-3.27*sin(a),y=3.27*cos(a);f.box([x,y,.136],[.64,.22,.07],j%2?pink:lemon,[0,0,a],true);
      f.rod([0,0,-.02],[-2.04*sin(a),2.04*cos(a),-.02],.102,.080,alloy,false,7);
    }
    axle(f,0,0,.22,.45,.24,lemon,false,12);f.finish();
    const driver=A.node(root,-4.71,9.46,.21),d=A.builder(driver);
    d.rod([0,.35,0],[0,-2.12,0],.23,.19,plum,false,8);d.rod([0,-2.12,0],[.19,-7.17,.31],.11,.12,alloy,false,7);
    d.box([.72,-7.30,.29],[1.72,.60,.87],cobalt,[0,0,.04]);d.box([.76,-7.53,.31],[1.70,.12,.90],mint,[0,0,.04],true);d.finish();
    const ball=A.node(root),m=A.builder(ball);m.ball([0,0,0],[.91,.91,.91],'#e6dcac');
    for(const [x,y,z,r] of [[-.40,.25,.72,.23],[.28,.48,.67,.17],[.24,-.32,.82,.25],[-.12,.79,.38,.16],[-.72,-.02,.49,.13]])
      peb(m,[x,y,z],[r,r*.79,.055],'#969d94');
    m.finish();return (t,p)=>{const q=golfShot(t,p);ball.position.set(q.x,q.y,q.z);ball.rotation.z=.13*sin(t*.94)-q.x*1.17;
      driver.rotation.z=q.swing;fan.rotation.z=t*.85+2.02*p;};
  }
  function drawMoonPutt(c,t,p){
    c.save();box(c,0,.31,13.89,.64,steel);box(c,0,.74,13.66,.25,'#75af89');box(c,0,.9,13.76,.16,cream);
    poly(c,[[2.26,.85],[6.36,.85],[5.47,6.19],[3.13,6.19]],'#cc8878');poly(c,[[2.24,6.33],[4.30,8.15],[6.36,6.33]],'#dc8479');
    box(c,4.30,1.74,1.70,1.58,lemon);box(c,4.30,1.67,1.42,1.38,dark);
    stroke(c,[[-5.72,.81],[-5.91,7.89],[-4.74,9.66],[-3.81,9.66]],.36,steel);oval(c,-4.71,9.46,.44,.44,lemon);
    stroke(c,[[-.78,.84],[-.78,5.87]],.13,alloy);poly(c,[[-.78,5.74],[1.06,5.93],[.20,5.33],[-.78,5.14]],pink);
    const q=golfShot(t,p);c.save();c.translate(-4.71,9.46);c.rotate(q.swing);stroke(c,[[0,.35],[0,-2.12],[.19,-7.17]],.24,alloy);box(c,.72,-7.30,1.72,.60,cobalt);c.restore();
    c.save();c.translate(4.30,6.21);c.rotate(t*.85+2.02*p);for(let i=0;i<4;i++){poly(c,golfBlade,i%2?cream:'#98ccbb');stroke(c,[[0,0],[0,2.04]],.18,alloy);box(c,0,3.27,.64,.22,i%2?pink:lemon);c.rotate(pi*.5);}oval(c,0,0,.45,.45,lemon);c.restore();
    c.save();c.translate(q.x,q.y);c.rotate(.13*sin(t*.94)-q.x*1.17);oval(c,0,0,.91,.91,'#e6dcac');for(const [x,y,r] of [[-.40,.25,.23],[.28,.48,.17],[.24,-.32,.25]])oval(c,x,y,r,r*.79,'#969d94');c.restore();
    marquee(c,'Moon Putt',0,1.43,6.28,1.12,mint);c.restore();
  }

  // The vulture's primary feathers are overlapping stamped license plates.
  // It guards an assortment of hard-sided luggage and carries the claim tag.
  const vultureWing=[[0,-.43],[.63,1.05],[2.12,1.51],[4.16,1.31],[5.41,.87],[7.49,.38],[6.15,-.23],[5.57,-.21],[6.76,-.66],[5.04,-.91],[4.43,-.67],[5.24,-1.31],[3.61,-1.38],[2.86,-1.02],[2.96,-1.60],[1.28,-1.33]];
  const feather=[[-.48,-.09],[-.43,.33],[.87,.31],[1.94,.04],[1.63,-.18],[.30,-.26]];
  const wingSide=[-1,1].map(sign=>vultureWing.map(([x,y])=>[sign*x,y]));
  const featherSide=[-1,1].map(sign=>feather.map(([x,y])=>[sign*x,y]));
  const beakShape=[[-.12,.39],[.59,.52],[1.24,.31],[1.54,-.10],[1.49,-.65],[1.18,-.90],[1.14,-.44],[.63,-.21],[-.28,-.25]];
  const vultureFlap=(t,p)=>-.34+.095*sin(t*1.31)+.94*p;
  const caseColors=['#9c586b','#e5a35d'];
  function vulture(root,A){
    const b=A.builder(root);b.box([0,.15,0],[10.45,.32,4.46],steel);
    for(const [i,x,y,w,h,d] of [[0,-.43,1.24,8.71,1.95,3.66],[1,.68,3.13,6.13,1.79,2.94]]){
      b.box([x,y,0],[w,h,d],caseColors[i]);
      for(const s of [-1,1]){b.box([x+s*w*.30,y,0],[.22,h+.09,d+.11],cream);
        b.box([x+s*w*.30,y+.01,d*.5+.08],[.35,.30,.13],steel);}
      pipe(b,[[x-.61,y+.28,d*.5+.06],[x-.54,y-.09,d*.5+.39],[x+.56,y-.09,d*.5+.39],[x+.64,y+.28,d*.5+.06]],.10,plum,false,6);
      for(const s of [-1,1])for(const z of [-1,1])b.box([x+s*(w*.5-.16),y+.01,z*(d*.5-.08)],[.34,h+.05,.23],cobalt);
    }
    b.box([-.42,1.27,1.88],[5.31,.97,.16],dark);badge(A.node(root,-.42,0,0),A,'Carrion Luggage','Ivan',5.16,.83,1.27,1.97,pink);b.finish();
    const bird=A.node(root),s=A.builder(bird);
    for(const side of [-1,1]){
      s.rod([side*.74,6.15,.04],[side*.79,4.26,.02],.24,.13,'#b68a67',false,7);
      for(const toe of [-1,0,1])s.rod([side*.79,4.22,.04],[side*.79+toe*.45,4.07,.81-.13*Math.abs(toe)],.10,.027,cream,false,6);
    }
    peb(s,[0,6.60,0],[1.59,2.18,1.26],'#5b5b79',false,[0,0,.09]);
    for(const [x,rz] of [[-.61,.28],[.05,0],[.57,-.26]])s.box([x,5.13,-.60],[.43,1.77,.27],cobalt,[0,0,rz]);
    peb(s,[.17,8.20,.06],[1.37,.76,1.09],cream);peb(s,[.39,8.61,.08],[1.04,.59,.92],'#e4bd8d');
    s.finish();const head=A.node(bird,.40,8.48,.06),v=A.builder(head);
    v.rod([.06,-.10,0],[.51,1.51,.18],.53,.46,'#c66f7c',false,8);
    peb(v,[.72,1.67,.18],[.89,.86,.76],'#e59194');cut(v,beakShape,[1.19,1.60,.18],[1.04,1.12,.84],lemon);
    peb(v,[.96,1.87,.85],[.22,.25,.075],cream);peb(v,[1.02,1.87,.93],[.102,.13,.041],dark,true);
    v.finish();
    const tag=A.node(head,2.53,.82,.39),g=A.builder(tag);
    g.rod([0,.12,0],[0,-.57,0],.042,.042,alloy,false,5);
    cut(g,[[-.51,0],[-.33,.24],[.36,.24],[.54,.03],[.49,-1.07],[-.46,-1.07]],[0,-.66,0],[1,1,.17],pink,null,true);
    g.box([0,-1.12,.10],[.61,.11,.04],plum);g.box([-.07,-1.37,.10],[.46,.095,.04],plum);g.finish();
    const wings=[];
    for(const [i,side] of [-1,1].entries()){
      const w=A.node(bird,side*.86,7.16,-.10),e=A.builder(w);cut(e,wingSide[i],[0,0,0],[1,1,.64],cobalt);
      for(const [j,x,y,rz,col] of [[0,1.97,.56,-.11,'#84b5b5'],[1,3.36,.37,-.16,'#dfad77'],[2,4.46,.12,-.14,'#b993b0'],[3,2.76,-.32,-.23,'#bed3c4']]){
        cut(e,featherSide[i],[side*x,y,.37+j*.016],[1,1,.105],col,[0,0,side*rz]);
        e.box([side*(x+.53),y+.06,.46+j*.018],[.91,.084,.041],j%2?plum:'#496b75',[0,0,side*rz]);
        axle(e,side*(x+.04),y+.20,.46+j*.018,.064,.041,cream,true,6);
      }
      e.finish();wings.push({w,side});
    }
    return (t,p)=>{bird.position.y=.05*(1+sin(t*1.31))+.34*p;head.rotation.z=.13*sin(t*.92)+.34*p;
      tag.rotation.z=.38*sin(t*1.63)-.83*p;for(const {w,side} of wings)w.rotation.z=side*vultureFlap(t,p);};
  }
  function drawVulture(c,t,p){
    c.save();box(c,0,.16,10.45,.32,steel);for(const [i,x,y,w,h] of [[0,-.43,1.24,8.71,1.95],[1,.68,3.13,6.13,1.79]]){box(c,x,y,w,h,caseColors[i]);for(const side of [-1,1])box(c,x+side*w*.30,y,.22,h+.08,cream);stroke(c,[[x-.62,y+.28],[x-.54,y-.09],[x+.56,y-.09],[x+.64,y+.28]],.17,plum);}
    marquee(c,'Carrion Luggage',-.42,1.27,5.30,.97,pink);c.translate(0,.05*(1+sin(t*1.31))+.34*p);
    for(const [i,side] of [-1,1].entries()){
      stroke(c,[[side*.74,6.15],[side*.79,4.25],[side*1.24,4.07]],.31,'#c49170');c.save();c.translate(side*.86,7.16);c.rotate(side*vultureFlap(t,p));poly(c,wingSide[i],cobalt);
      for(const [x,y,rz,col] of [[1.97,.56,-.11,'#84b5b5'],[3.36,.37,-.16,'#dfad77'],[4.46,.12,-.14,'#b993b0'],[2.76,-.32,-.23,'#bed3c4']]){c.save();c.translate(side*x,y);c.rotate(side*rz);poly(c,featherSide[i],col);box(c,side*.53,.06,.91,.084,plum);c.restore();}c.restore();
    }
    oval(c,0,6.60,1.59,2.18,'#666883',.09);oval(c,.17,8.20,1.37,.76,cream);c.translate(.40,8.48);c.rotate(.13*sin(t*.92)+.34*p);
    stroke(c,[[.06,-.10],[.51,1.51]],.93,'#cb7981');oval(c,.72,1.67,.89,.86,'#e59194');poly(c,beakShape.map(([x,y])=>[1.19+x*1.04,1.60+y*1.12]),lemon);
    oval(c,.96,1.87,.22,.24,cream);oval(c,1.02,1.87,.105,.13,dark);c.translate(2.53,.82);c.rotate(.38*sin(t*1.63)-.83*p);stroke(c,[[0,.12],[0,-.55]],.08,alloy);box(c,0,-1.05,1.0,1.22,pink);box(c,0,-1.12,.61,.11,plum);c.restore();
  }

  return [
    {id:'mesa-collect-callisto',crew:'Ivan',name:'Collect Callisto',f:.127,off:-31,radius:3.82,width:7.55,height:13.75,ink:mint,reply:'Earth declined the charges.',sound:'bleep',build:phone,draw:drawPhone},
    {id:'mesa-toast-control',crew:'Harper',name:'Toast Control',f:.306,off:27,radius:5.46,width:9.62,height:14.02,ink:pink,reply:'Breakfast has cleared the tower.',sound:'steam',build:toaster,draw:drawToaster},
    {id:'mesa-grain-inspector',crew:'Ivan',name:'Grain Inspector',f:.693,off:27,radius:5.31,width:10.55,height:14.45,ink:mint,reply:'One. Recount requested.',sound:'bleep',build:inspector,draw:drawInspector},
    {id:'mesa-escargot-express',crew:'Soon',name:'Escargot Express',f:.889,off:25,radius:8.89,width:16.03,height:8.70,ink:pink,reply:'Ahead of yesterday.',sound:'bell',build:escargot,draw:drawEscargot},
    {id:'mesa-saguaro-spin',crew:'Soon',name:'Saguaro Spin Cycle',route:'return',f:.661,off:-27,radius:6.58,width:11.21,height:11.04,ink:mint,reply:'One sock entered witness protection.',sound:'steam',build:cactus,draw:drawCactus},
    {id:'mesa-dim-sum-eclipse',crew:'Harper',name:'Dim Sum Eclipse',route:'return',f:.881,off:-25,radius:4.65,width:8.38,height:16.90,ink:pink,reply:'The moon is steamed.',sound:'cheer',build:eclipse,draw:drawEclipse},
    {id:'mesa-walk-inn',crew:'Soon',name:'Walk-Inn Motel',f:.052,off:29,radius:13.00,footprintRadius:7.40,width:14.30,height:12.95,ink:pink,reply:'Room 4 has checked itself out.',sound:'bell',build:motorInn,draw:drawMotorInn},
    {id:'mesa-crude-sundae',crew:'Harper',name:'Crude Sundae',f:.223,off:-30,radius:17.60,footprintRadius:6.75,width:11.80,height:17.35,ink:orange,reply:'The cherry has exceeded wellhead pressure.',sound:'steam',build:sundae,draw:drawSundae},
    {id:'mesa-forklift-flamingo',crew:'Ivan',name:'Forklift Flamingo',f:.390,off:31,radius:14.55,footprintRadius:6.65,width:13.10,height:14.05,ink:pink,reply:'Certified on one leg. Renewal due Thursday.',sound:'bleep',build:flamingo,draw:drawFlamingo},
    {id:'mesa-bedrock-dentistry',crew:'Harper',name:'Bedrock Dentistry',f:.595,off:-29,radius:12.15,footprintRadius:7.70,width:13.25,height:11.95,ink:pink,reply:'Good news. The geode flosses.',sound:'cheer',build:dentist,draw:drawDentist},
    {id:'mesa-jackalope-cab',crew:'Ivan',name:'Jackalope Cab Co.',f:.787,off:31,radius:12.85,footprintRadius:6.55,width:12.20,height:12.45,ink:lemon,reply:'Meter started three hops ago.',sound:'bell',build:jackCab,draw:drawJackCab},
    {id:'mesa-escape-boot',crew:'Soon',name:'Escape Velocity Boot',route:'return',f:.566,off:29,radius:11.60,footprintRadius:10.05,width:19.90,height:11.10,ink:mint,reply:'One small step. One missing left shoe.',sound:'steam',build:moonBoot,draw:drawMoonBoot},
    {id:'mesa-moon-putt',crew:'Harper',name:'Moon Putt',route:'return',f:.759,off:28,radius:12.05,footprintRadius:8.80,width:17.15,height:10.60,ink:mint,reply:'One under par. Two over the county line.',sound:'cheer',build:moonPutt,draw:drawMoonPutt},
    {id:'mesa-carrion-luggage',crew:'Ivan',name:'Carrion Luggage',route:'return',f:.960,off:-31,radius:14.45,footprintRadius:8.55,width:16.95,height:12.90,ink:pink,reply:'The bird has claimed your baggage claim.',sound:'bell',build:vulture,draw:drawVulture}
  ];
})();
