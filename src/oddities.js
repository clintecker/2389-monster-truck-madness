/* Each attraction is scenery only. Its few moving rigid sections follow the
   supplied race clock, so replay, pause and reduced-motion poses are repeatable. */
import { MTMCourses } from './course.js';
import { MTMKit } from './kit.js';

const MTMOddities = (() => {
  const T=THREE,tau=Math.PI*2,geometries=new Map(),colors=new Map();
  const matte=new T.MeshStandardMaterial({vertexColors:true,metalness:.08,roughness:.66,side:T.DoubleSide});
  const lit=new T.MeshBasicMaterial({vertexColors:true,toneMapped:false,side:T.DoubleSide});
  const ink='#172132',steel='#5b6c86',silver='#afbfc9',mint='#70ffdb',pink='#ff549e',cream='#fff3cf';
  function geometry(key,make){if(!geometries.has(key))geometries.set(key,make());return geometries.get(key);}
  function color(css){if(!colors.has(css))colors.set(css,new T.Color(css));return colors.get(css);}
  function node(parent,x=0,y=0,z=0){const n=new T.Group();n.position.set(x,y,z);parent.add(n);return n;}
  const boxGeo=()=>geometry('box',()=>new T.BoxGeometry(1,1,1));
  const sphereGeo=()=>geometry('sphere',()=>new T.SphereGeometry(1,16,11));
  const seedGeo=()=>geometry('seed',()=>new T.SphereGeometry(1,7,4));
  const coneGeo=(a,b,n)=>geometry('cyl'+a+','+b+','+n,()=>new T.CylinderGeometry(b,a,1,n,1,false));
  const loafGeo=()=>geometry('loaf',()=>{
    // The flattened tips and parallel center hold the silhouette of a long
    // poppy-seed roll even when its turntable presents it end-on.
    const profile=[[-1,.035],[-.984,.31],[-.94,.63],[-.88,.84],[-.79,.955],[-.64,1],[0,1.035],[.64,1],[.79,.955],[.88,.84],[.94,.63],[.984,.31],[1,.035]];
    return new T.LatheGeometry(profile.map(([y,r])=>new T.Vector2(r,y)),20);
  });
  const up=new T.Vector3(0,1,0);
  // Batch by material within each rigid section. Normals are transformed with
  // the inverse transpose so scaled ellipsoids keep their rounded highlights.
  function builder(parent){
    const bins=[0,1].map(()=>({p:[],n:[],c:[],i:[]}));
    const matrix=new T.Matrix4(),normal=new T.Matrix3(),xyz=new T.Vector3(),dir=new T.Vector3(),scale=new T.Vector3(),pos=new T.Vector3(),q=new T.Quaternion(),e=new T.Euler();
    function add(geo,p,s,orient,shade,glow=false){
      pos.fromArray(p);scale.fromArray(s);
      if(orient?.isQuaternion)q.copy(orient);else q.setFromEuler(e.set(...(orient||[0,0,0]),'YXZ'));
      matrix.compose(pos,q,scale);normal.getNormalMatrix(matrix);
      const bin=bins[+glow],attr=geo.attributes.position,norm=geo.attributes.normal,start=bin.p.length/3,index=geo.index;
      for(let j=0;j<attr.count;j++){
        xyz.fromBufferAttribute(attr,j);dir.fromBufferAttribute(norm,j);
        const cv=typeof shade==='function'?color(shade(xyz,dir)):color(shade);
        xyz.applyMatrix4(matrix);dir.applyNormalMatrix(normal);
        bin.p.push(xyz.x,xyz.y,xyz.z);bin.n.push(dir.x,dir.y,dir.z);bin.c.push(cv.r,cv.g,cv.b);
      }
      for(let j=0;j<(index?.count||attr.count);j++)bin.i.push(start+(index?index.getX(j):j));
    }
    function box(p,s,shade,orient=null,glow=false){add(boxGeo(),p,s,orient,shade,glow);}
    function ball(p,s,shade,orient=null,glow=false,tiny=false){add(tiny?seedGeo():sphereGeo(),p,s,orient,shade,glow);}
    function rod(a,b,ra,rb,shade,glow=false,sides=12){
      const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],h=Math.hypot(dx,dy,dz);if(h<.00001)return;
      const rot=new T.Quaternion().setFromUnitVectors(up,new T.Vector3(dx/h,dy/h,dz/h));
      add(coneGeo(1,rb/ra,sides),[(a[0]+b[0])*.5,(a[1]+b[1])*.5,(a[2]+b[2])*.5],[ra,h,ra],rot,shade,glow);
    }
    function path(points,r,shade,glow=false,sides=8){
      for(let i=1;i<points.length;i++)rod(points[i-1],points[i],r,r,shade,glow,sides);
      for(const p of points)ball(p,[r,r,r],shade,null,glow,true);
    }
    // Transform a finished, colored model into a geographic scenery batch.
    // A whole stretch of shoulder can then share two draws and one culling test.
    function instance(source,transform){
      const geo=source.geometry,bin=bins[source.material===lit?1:0],start=bin.p.length/3;
      const {position,normal:normals,color}=geo.attributes;
      normal.getNormalMatrix(transform);
      for(let i=0;i<position.count;i++){
        xyz.fromBufferAttribute(position,i).applyMatrix4(transform);
        dir.fromBufferAttribute(normals,i).applyNormalMatrix(normal);
        bin.p.push(xyz.x,xyz.y,xyz.z);bin.n.push(dir.x,dir.y,dir.z);
        bin.c.push(color.getX(i),color.getY(i),color.getZ(i));
      }
      const indices=geo.index;
      for(let i=0;i<(indices?indices.count:position.count);i++)bin.i.push(start+(indices?indices.getX(i):i));
    }
    function finish(){
      bins.forEach((b,i)=>{
        if(!b.i.length)return;const g=new T.BufferGeometry();
        for(const [name,data] of [['position',b.p],['normal',b.n],['color',b.c]])g.setAttribute(name,new T.Float32BufferAttribute(data,3));
        g.setIndex(b.i);g.computeBoundingSphere();const mesh=new T.Mesh(g,i?lit:matte);mesh.receiveShadow=!i;parent.add(mesh);
      });
    }
    return {add,box,ball,rod,path,instance,finish};
  }
  function label(parent,title,sub,w,h,y,z,accent){
    const c=MTMKit.canvas(512,128);const g=c.getContext('2d');
    g.fillStyle='#111a2b';g.fillRect(0,0,512,128);g.fillStyle=accent;g.fillRect(0,0,512,6);g.fillRect(0,5,8,123);
    g.textAlign='center';g.textBaseline='middle';g.fillStyle='#f7ffef';g.font='900 italic 65px Display, Impact, sans-serif';g.fillText(title,256,52,475);
    g.fillStyle=accent;g.font='bold 22px Mono, monospace';g.fillText(sub,256,102,471);
    const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;
    const mesh=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide,toneMapped:false}));
    mesh.position.set(0,y,z);parent.add(mesh);
  }
  function mountPlate(b,w,h,y,z){
    b.box([0,y,z-.115],[w+.15,h+.16,.22],ink);
    for(const x of [-w*.45,w*.45])b.rod([x,0,z-.26],[x,y,z-.26],.105,.105,steel,false,7);
  }

  function duck(parent){
    const base=builder(parent);
    base.rod([0,-.5,0],[0,.28,0],3.70,3.85,'#465169',false,14);
    base.rod([0,.28,0],[0,.92,0],3.85,3.45,'#68738a',false,14);
    base.rod([0,.79,0],[0,.9,0],3.55,3.53,mint,true,14);
    base.rod([0,.90,0],[0,1.55,0],2.98,2.88,'#293747',false,14);
    mountPlate(base,4.95,1.22,1.50,3.44);base.finish();label(parent,'QUACK ARRAY','2389  /  ACOUSTIC SURVEILLANCE',4.95,1.22,1.50,3.45,mint);
    // Turn the whole duck three-quarters to the driver. The body and raised tail
    // distinguish it from a bird's head on a pole as soon as it clears the bend.
    const shell=node(parent);shell.rotation.y=-.93;const b=builder(shell);
    b.ball([0,3.48,-.32],[3.14,2.20,3.90],'#ffca2c');
    b.ball([0,3.68,-2.18],[2.38,1.80,2.66],'#ffd443',[-.22,0,0]);
    b.ball([0,4.47,-4.05],[1.34,.88,1.75],'#ffd23d',[.50,0,0]);
    b.ball([0,4.92,-4.91],[.60,.41,.9],'#ffe16a',[.63,0,0]);
    for(const side of [-1,1]){
      b.ball([side*2.57,3.64,-.67],[.72,1.00,2.03],'#eea91f',[-.22,side*.15,0]);
      b.ball([side*2.84,3.86,-.49],[.54,.78,1.60],'#ffcb39',[-.21,side*.15,0]);
    }
    b.finish();
    const head=node(shell,0,5.88,1.26),h=builder(head);
    h.ball([0,.84,.30],[1.99,2.04,1.93],'#ffdc41');
    // Layered bill, black nares and cheek-side eyes keep the face readable from
    // either direction. The accent pieces belong to a radio headset, not the bill.
    h.ball([0,.28,1.89],[1.05,.35,1.34],'#cb612e',[.10,0,0]);
    h.ball([0,.40,2.06],[1.07,.19,1.28],'#803c34',[.065,0,0]);
    h.ball([0,.56,1.99],[1.11,.32,1.39],'#ff9b34',[.06,0,0]);
    for(const side of [-1,1]){
      h.ball([side*.43,.817,2.53],[.119,.045,.14],'#8f4c28',null,false,true);
      h.ball([side*1.03,1.41,1.80],[.30,.34,.22],'#27263a',null,true);
      h.ball([side*.985,1.51,1.983],[.097,.095,.050],'#fff6d8',null,true,true);
      h.ball([side*1.90,1.06,-.05],[.43,.76,.73],ink);
      h.ball([side*2.13,1.06,-.05],[.31,.62,.60],'#47536b');
      h.ball([side*2.36,1.06,-.05],[.12,.43,.41],mint,null,true);
      h.ball([side*2.43,1.06,-.05],[.10,.29,.27],'#334251');
    }
    const arch=[];for(let i=0;i<=10;i++){const a=i*Math.PI/10;arch.push([2.05*Math.cos(a),1.10+1.98*Math.sin(a),-.13]);}
    h.path(arch,.19,'#2c3448',false,8);h.path(arch.slice(3,8).map(p=>[p[0],p[1]+.09,p[2]]),.095,'#87a3b0',false,6);
    h.path([[-2.13,.91,.08],[-2.16,.45,.88],[-1.68,.10,1.98],[-1.18,.10,2.15]],.085,'#324058',false,7);
    h.ball([-1.12,.10,2.18],[.26,.19,.20],'#202b40');h.finish();
    return (t,p)=>{head.rotation.y=.20*Math.sin(t*.78)-.04+.44*p;head.rotation.x=.056*Math.sin(t*1.04+.7)-.27*p;};
  }

  function blower(parent){
    const b=builder(parent);
    b.box([0,.43,0],[2.9,.86,2.55],'#2b394f');b.box([0,.92,0],[3.03,.20,2.65],'#758799');
    for(const side of [-1,1]){
      b.box([side*1.34,.39,.15],[.26,.60,2.19],'#42536a');
      for(let i=0;i<7;i++)b.box([side*1.49,.44,-.78+i*.25],[.05,.39,.11],'#151e30');
    }
    for(const x of [-1.09,1.09])for(const z of [-.99,.99])b.box([x,.06,z],[.54,.12,.54],ink);
    b.rod([0,.98,0],[0,1.23,0],.95,.92,'#6a7d90',false,14);b.rod([0,1.16,0],[0,1.25,0],.936,.92,mint,true,14);
    mountPlate(b,2.55,.69,.52,1.36);b.finish();label(parent,'AIR SUPPORT','2389 / FIELD MECHANIC',2.55,.69,.52,1.37,mint);
  }
  function fabric(parent,len,r0,r1,shade,band){
    const b=builder(parent),rad=y=>r0+(r1-r0)*(y/len);
    b.rod([0,-.06,0],[0,len+.04,0],r0,r1,shade,false,12);
    b.ball([0,0,0],[r0,.36,r0],shade);
    for(const y of [len*.18,len*.79]){
      const r=rad(y)+.026;b.rod([0,y,0],[0,y+len*.07,0],r,r*.997,band,false,12);
      b.rod([0,y+.025,0],[0,y+.065,0],r+.012,r+.012,'#c0f0da',false,12);
    }
    b.finish();
  }
  function mechanic(parent){
    blower(parent);const a=node(parent,0,1.21,0),b=node(a,0,2.28,0),c=node(b,0,2.16,0);
    fabric(a,2.28,.77,.84,'#9362b9','#d0c17a');fabric(b,2.16,.84,.88,'#8752ab','#f3ad62');fabric(c,2.03,.88,.83,'#9768c2','#f6c36b');
    const head=node(c,0,2.0,0),face=builder(head);
    face.rod([0,-.09,0],[0,1.38,0],.81,.89,'#f7b957',false,14);
    face.ball([0,1.36,0],[.90,.22,.90],'#614d8b');face.rod([0,1.30,0],[0,1.51,0],.92,.91,'#715197',false,14);
    face.ball([0,1.36,.55],[.91,.105,.65],mint);face.rod([0,1.48,0],[0,1.57,0],.87,.74,'#a688ca',false,14);
    for(const side of [-1,1]){
      face.ball([side*.35,.91,.756],[.25,.289,.132],cream,null,true);
      face.ball([side*.35-.035,.885,.852],[.123,.160,.068],'#222a40',null,true);
      face.ball([side*.35-.071,.955,.916],[.039,.045,.024],'#f7ffdf',null,true,true);
    }
    face.path([[-.43,.60,.74],[-.26,.48,.80],[.01,.44,.83],[.29,.48,.81],[.44,.58,.75]],.067,'#4b3043',false,7);
    // Cloth streamers and the open end of the mechanic's foam spanner reinforce
    // the long-arm silhouette from well behind a truck approaching the woods.
    for(const [i,x] of [-.61,-.23,.21,.58].entries()){
      const z=i%2?-.17:.04;face.path([[x,1.49,z],[x*.97,1.79,z-.08],[x+(i-1.5)*.14,2.05+(i%2)*.13,z+.08]],.093,i%2?mint:pink,false,6);
    }
    face.finish();
    const arms=[];
    for(const side of [-1,1]){
      const shoulder=node(c,side*.73,1.71,0),len=side<0?2.80:2.28,elbow=node(shoulder,0,len,0),wrist=node(elbow,0,side<0?2.64:2.13,0);
      fabric(shoulder,len,.42,.37,side<0?'#ee759a':'#8ab4b0','#eec275');
      fabric(elbow,side<0?2.64:2.13,.37,.307,side<0?'#bd6da0':'#62a796','#f0c365');
      const hand=builder(wrist);
      hand.ball([0,.13,0],[.38,.41,.35],'#f4bd50');
      if(side<0){
        hand.rod([0,.20,0],[0,1.0,0],.125,.145,'#b7d2d2',false,8);
        hand.path([[-.35,1.36,0],[-.35,1.15,0],[-.19,.99,0],[.11,.96,0],[.31,1.09,0],[.40,1.32,0]],.126,'#d0ebdf',false,7);
      }else{
        for(const x of [-.21,.02,.23])hand.rod([x,.24,0],[x*1.43,.52+(x<0?.13:0),.035],.109,.069,'#ffd773',false,7);
      }
      hand.finish();arms.push({side,shoulder,elbow,wrist});
    }
    return (t,p)=>{
      a.rotation.set(.11*Math.sin(t*1.16+.5),.13*Math.sin(t*.83),.26*Math.sin(t*1.68),'YXZ');
      b.rotation.set(.15*Math.cos(t*1.43),.08*Math.sin(t*.8),.34*Math.sin(t*1.68+.92),'YXZ');
      c.rotation.set(.14*Math.sin(t*1.29+.31),.12*Math.cos(t),.29*Math.sin(t*1.68+2.09),'YXZ');
      head.rotation.z=.14*Math.sin(t*2.19+.48);
      for(const {side,shoulder,elbow,wrist} of arms){
        const phase=side<0?.45:2.25;
        shoulder.rotation.set(.14*Math.sin(t*1.37+phase),.24*side,-side*(1.18+.56*Math.sin(t*2.12+phase)+.70*p),'YXZ');
        elbow.rotation.set(.23*Math.sin(t*1.44+phase),0,side*(.27+.84*Math.sin(t*2.42+phase+.81)),'YXZ');
        wrist.rotation.z=side*.25*Math.sin(t*3.03+phase);
      }
    };
  }
  function hotDog(parent){
    const base=builder(parent);
    base.rod([0,-.76,0],[0,.29,0],2.93,3.08,'#455268',false,12);
    base.rod([0,.29,0],[0,.64,0],3.08,2.64,'#98a5a9',false,12);
    for(const side of [-1,1]){
      base.box([side*1.48,.69,0],[.87,.31,1.46],steel);
      base.rod([side*1.48,.81,0],[side*.78,7.72,0],.28,.20,'#84a899',false,8);
      base.rod([side*1.46,.88,.06],[side*.82,7.72,.06],.08,.058,mint,true,6);
      base.rod([side*1.38,1.69,0],[-side*1.07,4.42,0],.084,.082,'#91a49f',false,6);
      base.rod([side*1.03,4.41,0],[-side*.83,7.05,0],.08,.07,'#91a49f',false,6);
    }
    base.box([0,7.84,0],[3.60,.43,1.28],ink);
    base.rod([0,7.83,0],[0,8.16,0],1.67,1.76,'#758b87',false,14);
    base.rod([0,8.13,0],[0,8.23,0],1.78,1.76,mint,true,14);
    base.rod([0,8.19,0],[0,8.83,0],.72,.70,'#8a9b9f',false,12);
    base.box([0,5.75,.12],[5.98,1.62,.38],ink);base.finish();label(parent,'FRANK LAB','CHICAGO  /  NO KETCHUP',5.83,1.44,5.75,.33,'#fdd766');
    const inclined=node(parent,0,8.72,0),turn=node(inclined),b=builder(turn);
    // A long poppy-seed bun, embossed frank ends, an actual winding bead of
    // yellow mustard and a ridged pickle stay recognizable as the sign rotates.
    b.ball([0,-.08,0],[6.48,.23,2.19],'#536979');
    b.ball([0,-.004,0],[6.36,.16,2.08],'#b4d7c9');
    for(const side of [-1,1]){
      const cy=side>0?.64:.73,cz=side*1.03;
      b.add(loafGeo(),[0,cy,cz],[.94,6.93,.85],[0,0,-Math.PI/2],(p,n)=>{
        if(n.z*side<-.28)return '#ffe4a3';
        if(n.x<-.49)return '#e3a15d';
        return n.x>.53?'#c78350':'#e7b36e';
      });
    }
    b.add(loafGeo(),[0,1.38,.03],[.90,7.75,.91],[0,0,-Math.PI/2],(p,n)=>n.x<-.34?'#d57842':n.z>.47?'#c36637':'#a85137');
    // The sausage's gathered casings protrude beyond both halves of the roll.
    for(const side of [-1,1]){
      b.ball([7.56*side,1.39,.03],[.31,.43,.41],'#ad5736');
      b.rod([7.72*side,1.39,.03],[7.81*side,1.39,.03],.14,.115,'#804735',false,8);
    }
    const mustard=[];
    for(let i=0;i<=47;i++){
      const x=-6.04+12.08*i/47,z=.19+Math.sin(i/47*tau*4.45-.65)*.64;
      mustard.push([x,1.41+.90*Math.sqrt(Math.max(.13,1-((z-.03)/.91)**2)),z]);
    }
    b.path(mustard,.155,'#ffda35',false,8);
    let randomSeed=2389;
    function rand(){randomSeed=(Math.imul(randomSeed,1664525)+1013904223)>>>0;return randomSeed/4294967296;}
    for(const side of [-1,1])for(let i=0;i<39;i++){
      const x=(rand()*2-1)*6.71,a=.12+rand()*1.56;
      const t=Math.abs(x)/6.93,rad=t>.78?Math.sqrt(Math.max(.10,1-((t-.78)/.22)**2)):1.019;
      const y=(side>0?.64:.73)+.94*Math.cos(a)*rad,z=side*(1.03+.85*Math.sin(a)*rad);
      b.ball([x,y+.017,z],[.093,.039,.051],i%3?'#413833':'#584537',[0,rand()*.75-.35,0],false,true);
    }
    const pickle=[[-5.23,1.85,-.95],[-4.15,2.04,-.87],[-2.22,2.15,-.84],[-.49,2.18,-.85],[.84,2.20,-.94],[1.84,2.04,-1.02]];
    for(let i=1;i<pickle.length;i++)b.rod(pickle[i-1],pickle[i],i===1?.16:.41,i===pickle.length-1?.17:.41,'#79ac46',false,11);
    b.path(pickle.map(v=>[v[0],v[1]+.14,v[2]+.20]),.18,'#b1d368',false,8);
    for(let i=0;i<18;i++){
      const x=-4.52+rand()*5.55;
      b.ball([x,2.19+.11*Math.cos(x*.52)+rand()*.09,-.78-rand()*.17],[.14,.10,.098],'#c4d77d',null,false,true);
    }
    for(let i=0;i<24;i++){
      const x=-5.35+rand()*10.7;
      b.box([x,1.63+rand()*.12,-1.14-rand()*.29],[.17+rand()*.24,.11+rand()*.09,.15+rand()*.18],i%3?'#78a947':'#dfecc6',[.1,rand()*1.7,.12]);
    }
    for(const [x,dir] of [[2.65,1],[4.24,-1]]){
      b.rod([x-.59,1.78,-.91],[x+.10,1.88,-.84],.09,.24,'#87ab3c',false,9);
      b.rod([x+.10,1.88,-.84],[x+.59,1.91,-.88],.24,.13,'#9bb746',false,9);
      b.path([[x+.52,1.91,-.87],[x+.72,2.08,-.92],[x+.82,2.13,-.92-dir*.13]],.043,'#456c31',false,6);
    }
    b.finish();inclined.rotation.x=.32;
    return (t,p)=>{turn.rotation.y=.12+t*.31+p*1.60;inclined.rotation.x=.32+p*.14;};
  }

  // These sites sit beyond every driving line. In the stadium, use the open
  // break between the short spectator banks instead of placing art in a stand.
  const sites={
    arizona:{kind:'duck',f:.542,off:-25,size:1.18,build:duck},
    eight:{kind:'tube',f:.332,off:25,size:1.37,build:mechanic},
    indiana:{kind:'dog',f:.616,off:-23.5,size:1.09,build:hotDog}
  };
  const positions=new WeakMap();
  function location(course){
    if(positions.has(course))return positions.get(course);
    const site=sites[course.id];if(!site)return null;
    // The optional Mesa circuit retains the rally's outbound physical district.
    // Its arc length differs, so project the shared rally site onto that course.
    let distance=course.length*site.f,off=site.off;
    if(course.layoutKey==='arizona-circuit'){
      const original=typeof MTMCourses==='undefined'?null:MTMCourses.find(c=>c.id==='arizona'&&c.layoutKey!=='arizona-circuit');
      const old=original?.at(original.length*sites.arizona.f);
      distance=old?course.nearest(old.x,old.z).s:course.length*.27;
    }
    const p=course.at(distance,off),approach=course.at(distance-54);
    const place={x:p.x,y:course.ground(p.x,p.z),z:p.z,yaw:Math.atan2(approach.x-p.x,approach.z-p.z),kind:site.kind};
    positions.set(course,place);return place;
  }
  function attach(world,course){
    const p=location(course);if(!p)return {update(){}};
    const site=sites[course.id],root=node(world,p.x,p.y,p.z);
    root.name={arizona:'Quack Array',eight:'Air Support',indiana:'Frank Lab'}[course.id];
    root.rotation.y=p.yaw;root.scale.setScalar(site.size);
    const pose=site.build(root);let last=NaN,lastPulse=NaN;
    function update(time,pulse=0){
      if(!Number.isFinite(time)||time===last&&pulse===lastPulse)return;last=time;lastPulse=pulse;pose(time,pulse);
    }
    update(0);return {update};
  }
  return {attach,location,art:{builder,node,label}};
})();

export {MTMOddities};
