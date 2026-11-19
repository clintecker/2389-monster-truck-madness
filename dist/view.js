/* One renderer is reused by the showroom and race. The 2D projection shares the
   same camera, simulation and timing on devices that cannot create WebGL. */
import { MTMCarnival } from './carnival.js';
import { MTMCelestial } from './celestial.js';
import { MTMCrowd } from './crowd.js';
import { MTMElectric } from './electric.js';
import { MTMFinish } from './finish.js';
import { MTMFitmentArt } from './fitment-sprites.js';
import { MTMMidway } from './midway.js';
import { MTMOddities } from './oddities.js';
import { MTMPhysics } from './physics.js';
import { MTMProps } from './props.js';
import { MTMScenery } from './scenery.js';
import { MTMSoftwareRenderer } from './software.js';
import { MTMSoilArt } from './soilart.js';
import { MTMTrack } from './track.js';
import { MTMTrucks } from './trucks.js';
import { MTMWorld } from './world.js';

const MTMView = (() => {
  const T=THREE, V=T.Vector3, cache=new Map(),rigs=new Map(),sprites=new Map(),shadowPool=[];
  let renderer=null,initialized=false,soft=null,scene=null,camera=null,sun=null,active=null,camMode=0,scale=1,garageTime=.56,garageModel=null,garageRigs=new Map(),garageScene=null,garageCam=null,garageIndex=0,garageTurn=0;
  let garageWheel=false,sightseeing=false,garageFit={tires:0,suspension:1};
  const garageSpring={bounce:0,bounceV:0},wheelOffsets=new Float32Array(4);
  let headlights=null,sparks=null,displayed=[],shadows=[],hood=null,dust=null,width=1,height=1,host=null,shake=0,wasGarage=false,initialCamera=true,softTex=null;
  const followAnchor=new V(),chaseAim=new V(),targetPos=new V(),targetAim=new V(),screenV=new V(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const modeNames=['Chase','Cockpit','Blimp'];
  function init(){
    if(initialized)return;initialized=true;camera=new T.PerspectiveCamera(59,1,.18,1350);scene=new T.Scene();
    try{
      const can=document.createElement('canvas'),attrs={antialias:true,alpha:false,powerPreference:'high-performance'},gl=can.getContext('webgl2',attrs)||can.getContext('webgl',attrs);
      if(gl){renderer=new T.WebGLRenderer({...attrs,canvas:can,context:gl});renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.04;
        const ext=gl.getExtension('WEBGL_debug_renderer_info'),slowGPU=ext&&/swiftshader|llvmpipe|software renderer/i.test(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL));scale=slowGPU?.68:Math.min(1.6,window.devicePixelRatio||1);renderer.shadowMap.enabled=!slowGPU&&innerWidth>=660;renderer.shadowMap.type=T.PCFSoftShadowMap;
        renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();window.dispatchEvent(new CustomEvent('mtm-context-lost'));});}
    }catch(e){renderer=null;}
    if(!renderer){try{renderer=MTMSoftwareRenderer();scale=Math.min(.92,Math.max(.38,665/Math.max(640,innerWidth)));}catch(e){renderer=null;}}
    if(!renderer)soft=document.createElement('canvas');
    if(renderer){
      const hemi=new T.HemisphereLight(0xcbdfff,0x54506c,1.75);scene.add(hemi);
      sun=new T.DirectionalLight(0xd9eaff,2.22);sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);sun.shadow.camera.left=-39;sun.shadow.camera.right=39;sun.shadow.camera.top=39;sun.shadow.camera.bottom=-39;sun.shadow.camera.near=7;sun.shadow.camera.far=160;sun.shadow.bias=-.00045;sun.shadow.normalBias=.035;scene.add(sun,sun.target);
      const rim=new T.DirectionalLight(0xf39acd,.73);rim.position.set(45,19,55);scene.add(rim);scene.userData.softwareTint=[.88,.94,1];
      hood=new T.Mesh(new T.BoxGeometry(2.32,.25,1.54),new T.MeshStandardMaterial({roughness:.48,metalness:.22}));hood.material.userData.dynamicColor=true;scene.add(hood);hood.visible=false;
      dust=makeDust();sparks=makeSparks();scene.add(dust.obj,sparks.obj);
      headlights=makeHeadlights();scene.add(headlights.beam);
      garageScene=new T.Scene();garageScene.background=new T.Color('#18263c');garageScene.fog=new T.FogExp2('#18263c',.035);garageCam=new T.PerspectiveCamera(36,1,.1,80);
      garageScene.add(new T.HemisphereLight(0xcfe9ff,0x536285,2.16));
      for(const [x,y,z,power,col] of [[3,6,6,2.8,0xe9f4ff],[-5,2,-3,2.2,0x73edee],[4,3,-3,1.25,0xff86c8]]){
        const lamp=new T.DirectionalLight(col,power);lamp.position.set(x,y,z);garageScene.add(lamp);
      }
      buildGarage(garageScene);
    }
  }
  function mount(node){init();const can=renderer?renderer.domElement:soft;if(can.parentNode!==node)node.appendChild(can);host=node;resize();}
  function resize(){if(!host)return;const w=Math.max(1,Math.round(host.clientWidth)),h=Math.max(1,Math.round(host.clientHeight));width=w;height=h;
    if(renderer){
      // Give the tour's close-up signs an independent reading resolution.
      // Only the race needs the adaptive pixel budget for timing and handling.
      const detail=host.id==='garageView'&&renderer.isSoftware?Math.min(1.5,820/w,390/h):
        sightseeing&&renderer.isSoftware?Math.min(1.18,975/w,665/h):scale;
      renderer.setPixelRatio(detail);renderer.setSize(w,h,false);
    }else{const d=Math.min(1.45,devicePixelRatio||1);soft.width=Math.round(w*d);soft.height=Math.round(h*d);}
    camera.aspect=w/h;camera.updateProjectionMatrix();if(garageCam){garageCam.aspect=w/h;garageCam.updateProjectionMatrix();}}
  function rig(v,player){
    const key=[v.truck,player,v.tires,v.suspension].join(':');
    if(!rigs.has(key))rigs.set(key,MTMTrucks.make(v.truck,player,v));
    return rigs.get(key);
  }
  function shadowPlane(){if(!softTex){const c=MTMTrack.canvas(96,96),g=c.getContext('2d'),gr=g.createRadialGradient(48,48,6,48,48,46);gr.addColorStop(0,'rgba(23,19,17,.69)');gr.addColorStop(.44,'rgba(23,19,17,.51)');gr.addColorStop(1,'rgba(23,19,17,0)');g.fillStyle=gr;g.fillRect(0,0,96,96);softTex=MTMTrack.map(c,false);}
    const m=new T.Mesh(new T.PlaneGeometry(5.9,7.3),new T.MeshBasicMaterial({map:softTex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));m.rotation.order='YXZ';m.rotation.x=-Math.PI*.5;m.renderOrder=2;return m;}
  // The projected light is a shallow ground-following grid. Both renderers use
  // the same beam footprint, including when the truck crosses a dirt ramp.
  function makeHeadlights(){
    const w=128,h=192,cv=MTMTrack.canvas(w,h),g=cv.getContext('2d'),pixels=g.createImageData(w,h);
    for(let y=0;y<h;y++){
      const reach=y/(h-1),spread=.85+reach*3.95,center=1+reach*.7;
      const falloff=Math.min(1,reach*17)*(1-reach)**1.58;
      for(let x=0;x<w;x++){
        const side=(x/(w-1)-.5)*16;
        const offset=(Math.abs(side)-center)/spread,near=Math.exp(-.88*offset*offset);
        const j=4*(y*w+x);
        pixels.data.set([184,225,238,Math.round(134*falloff*near)],j);
      }
    }
    g.putImageData(pixels,0,0);
    const geo=new T.PlaneGeometry(16,25,8,14);
    geo.rotateX(-Math.PI/2);geo.translate(0,0,14.25);
    geo.userData.followGround=true;
    const pos=geo.attributes.position;pos.setUsage(T.DynamicDrawUsage);
    const mat=new T.MeshBasicMaterial({map:MTMTrack.map(cv,false),transparent:true,depthWrite:false,side:T.DoubleSide,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-1});
    const beam=new T.Mesh(geo,mat);beam.frustumCulled=false;beam.renderOrder=1;
    return {beam,update(c,p){
      const sn=Math.sin(p.yaw),cs=Math.cos(p.yaw);
      beam.position.set(p.x,0,p.z);beam.rotation.y=p.yaw;
      for(let i=0;i<pos.count;i++){
        const x=pos.getX(i),z=pos.getZ(i);
        pos.setY(i,c.ground(p.x+x*cs+z*sn,p.z-x*sn+z*cs)+.20);
      }
      pos.needsUpdate=true;
      mat.opacity=Math.max(.4,1-Math.max(0,p.y-c.ground(p.x,p.z)-.3)*.09);
    }};
  }
  function buildGarage(scene){
    // Eight inward-facing wall bays keep the motor pool visible at every orbit angle.
    const cv=MTMTrack.canvas(768,256),g=cv.getContext('2d');
    const wash=g.createLinearGradient(0,0,0,256);
    wash.addColorStop(0,'#24354b');wash.addColorStop(.6,'#172438');wash.addColorStop(1,'#243040');
    g.fillStyle=wash;g.fillRect(0,0,768,256);
    g.fillStyle='#111e30';g.fillRect(80,28,608,178);
    for(let y=32;y<205;y+=12){g.fillStyle=y%24===8?'#283a4d':'#253548';g.fillRect(84,y,600,2);}
    g.fillStyle='#192739';g.fillRect(305,28,2,179);
    g.fillStyle='#0a1423';g.fillRect(80,21,608,7);g.fillRect(0,211,768,18);
    g.fillStyle='#82f2e1';g.fillRect(83,23,292,2);g.fillRect(460,23,222,2);
    g.fillStyle='#ca407d';g.fillRect(0,218,180,3);g.fillRect(593,218,175,3);
    g.fillStyle='#b1d7de';g.font='bold 44px sans-serif';g.fillText('2389',335,125);
    g.font='bold 12px sans-serif';g.fillStyle='#8eaab9';g.fillText('RESEARCH',340,143);
    for(let x=11;x<70;x+=15){g.fillStyle='#698c9e';g.fillRect(x,71,7,2);g.fillRect(x+696,71,7,2);}
    const wall=new T.PlaneGeometry(10.1,5.0);
    const door=new T.MeshBasicMaterial({map:MTMTrack.map(cv,false),toneMapped:false});
    for(let j=0;j<8;j++){
      const a=j*Math.PI/4,mesh=new T.Mesh(wall,door);
      mesh.position.set(Math.sin(a)*12.0,2.48,Math.cos(a)*12.0);mesh.rotation.y=a+Math.PI;scene.add(mesh);
    }
    const floor=new T.Mesh(new T.PlaneGeometry(44,44),new T.MeshStandardMaterial({color:0x314352,roughness:.72}));
    floor.rotation.x=-Math.PI/2;floor.position.y=-.06;scene.add(floor);
    // Thin, flush paint arcs leave the silhouette and tread of each truck readable.
    for(const [inner,outer,col,start,length] of [[4.22,4.27,0x54bcae,0,2.36],[4.22,4.27,0xc55891,2.48,1.09],[4.22,4.27,0x54bcae,3.67,2.53],[4.62,4.64,0x52697a,0,Math.PI*2]]){
      const arc=new T.Mesh(new T.RingGeometry(inner,outer,100,1,start,length),new T.MeshBasicMaterial({color:col,toneMapped:false}));
      arc.rotation.x=-Math.PI/2;arc.position.y=-.015;scene.add(arc);
    }
    const blob=shadowPlane();blob.position.y=.004;scene.add(blob);
  }
  // Metal rubs emit small sparks at the contact witness. The particles use the
  // dust renderer's attribute layout so the software path sees them as well.
  function makeSparks(){
    const n=34,geo=new T.BufferGeometry(),pos=new Float32Array(n*3),vel=new Float32Array(n*3),life=new Float32Array(n),sizes=new Float32Array(n),alpha=new Float32Array(n);
    const dyn=a=>new T.BufferAttribute(a,1).setUsage(T.DynamicDrawUsage);
    geo.setAttribute('position',new T.BufferAttribute(pos,3).setUsage(T.DynamicDrawUsage));geo.setAttribute('pSize',dyn(sizes));geo.setAttribute('opacity',dyn(alpha));
    const mat=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{color:{value:new T.Color('#ffb776')},fac:{value:400}},
      vertexShader:'attribute float pSize;attribute float opacity;varying float a;uniform float fac;void main(){vec4 v=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*v;gl_PointSize=clamp(pSize*fac/max(.1,-v.z),1.,7.);a=opacity;}',
      fragmentShader:'varying float a;uniform vec3 color;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;gl_FragColor=vec4(color,(1.-r*r)*a);\n#include <colorspace_fragment>\n}'});
    const obj=new T.Points(geo,mat);obj.frustumCulled=false;obj.renderOrder=4;let head=0,credit=0;
    return {obj,clear(){life.fill(0);alpha.fill(0);credit=0;},update(p,dt){
      mat.uniforms.fac.value=height*scale*.8;
      if(!reduced&&p.rubMaterial==='metal'&&p.rub>.14){
        credit+=dt*p.rub*35;
        while(credit>=1){credit--;const i=head++%n,k=i*3;pos.set([p.rubX,p.y+.71,p.rubZ],k);
          vel.set([p.vx*.22+(Math.random()-.5)*2,1.0+Math.random()*2,p.vz*.22+(Math.random()-.5)*2],k);
          life[i]=.12+Math.random()*.17;sizes[i]=.065+Math.random()*.08;}
      }else credit=0;
      for(let i=0;i<n;i++){if(life[i]<=0){alpha[i]=0;continue;}const k=i*3;life[i]-=dt;vel[k+1]-=8*dt;
        for(let j=0;j<3;j++)pos[k+j]+=vel[k+j]*dt;alpha[i]=Math.max(0,Math.min(.95,life[i]*6));}
      for(const key of ['position','pSize','opacity'])geo.attributes[key].needsUpdate=true;
    }};
  }
  function makeDust(){
    const count=150,geo=new T.BufferGeometry(),pos=new Float32Array(count*3),sizes=new Float32Array(count),alpha=new Float32Array(count),life=new Float32Array(count),age=new Float32Array(count),vel=new Float32Array(count*3),base=new Float32Array(count);
    geo.setAttribute('position',new T.BufferAttribute(pos,3).setUsage(T.DynamicDrawUsage));geo.setAttribute('pSize',new T.BufferAttribute(sizes,1).setUsage(T.DynamicDrawUsage));geo.setAttribute('opacity',new T.BufferAttribute(alpha,1).setUsage(T.DynamicDrawUsage));
    const mat=new T.ShaderMaterial({depthWrite:false,transparent:true,uniforms:{color:{value:new T.Color('#ac8baa')},fac:{value:400}},vertexShader:'attribute float pSize;attribute float opacity;varying float a;uniform float fac;void main(){vec4 v=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*v;gl_PointSize=clamp(pSize*fac/max(.1,-v.z),1.,100.);a=opacity;}',fragmentShader:'varying float a;uniform vec3 color;void main(){vec2 q=gl_PointCoord*2.-1.;float r=dot(q,q);if(r>1.)discard;float k=(1.-smoothstep(.1,1.,r))*(.87+.13*sin(q.x*11.+q.y*7.));gl_FragColor=vec4(color,k*a);\n#include <colorspace_fragment>\n}'});
    const obj=new T.Points(geo,mat);obj.frustumCulled=false;obj.renderOrder=3;let head=0,debt=0;
    function emit(v,spin){
      const i=(head++)%count,side=Math.random()<.5?-1:1,s=Math.sin(v.yaw),c=Math.cos(v.yaw);
      const fore=spin&&Math.random()<.28?1.5:-1.6;
      pos[3*i]=v.x+side*1.38*c+fore*s;pos[3*i+1]=v.y+.30;pos[3*i+2]=v.z-side*1.38*s+fore*c;
      const back=spin?.8+Math.random()*1.3:1+Math.random()*2,out=spin?.55+Math.random()*.85:Math.random();
      vel[3*i]=-s*back+side*c*out;vel[3*i+1]=(spin?.9:.6)+Math.random();vel[3*i+2]=-c*back-side*s*out;
      age[i]=0;life[i]=(spin?.82:.64)+Math.random()*.58;base[i]=(spin?.69:.5)+Math.random()*.62;
    }
    return {obj,clear(){life.fill(0);alpha.fill(0);head=0;debt=0;},update(vs,dt,c){
      debt+=dt*27;
      while(debt>=1){
        debt--;vs.forEach((v,i)=>{
          if(!v.grounded)return;
          const spin=(v.wheelspin||0)>.14&&v.speed<8;
          if(spin){if(Math.random()<v.wheelspin*(i?.47:1.5))emit(v,true);}
          else if(v.speed>3.6&&(i===0||Math.random()<.54))emit(v,false);
        });
      }
      mat.uniforms.fac.value=height*scale*.8;
      mat.uniforms.color.value.set(vs[0].wheelspin>.13&&vs[0].speed<8?'#c3d3da':c.id==='eight'?'#90a6b5':c.id==='indiana'?'#b398aa':'#b495b1');
      for(let i=0;i<count;i++){
        if(life[i]<=0){alpha[i]=0;continue;}age[i]+=dt;const t=age[i]/life[i];
        if(t>=1){life[i]=0;alpha[i]=0;continue;}for(let j=0;j<3;j++)pos[3*i+j]+=vel[3*i+j]*dt;
        sizes[i]=base[i]*(1+2.8*t);alpha[i]=.32*(1-t)**1.5;
      }
      for(const k of ['position','pSize','opacity'])geo.attributes[k].needsUpdate=true;
    }};

  }
  // A heat, replay, tour and Canvas mode share the same surveyed installations,
  // protected racing line and seating sections. Only their animation clocks differ.
  function fairPlan(course,data,props){
    // The Fifth Floor races indoors; the midway, carnival and fan stands
    // belong to the open-air venues and stay outside its walls.
    if(course.id==='office'){
      const fair={entries:[],carnival:{pieces:[],strands:[],venues:[],air:[],fixed:[],pal:['#8ff5e2','#ff7fae','#ffd863','#8cecf1']},crowd:{fixed:[],sections:[]},electric:{strings:[],spills:[]},lookouts:[],
        obstacles:data.obstacles||[],jokes:[],survey:null,classic:null,attraction:null};
      course.midway=fair.entries;course.carnival=fair.carnival;course.crowd=fair.crowd;
      course.obstacles=fair.obstacles;course.jokeSigns=fair.jokes;course.lookouts=fair.lookouts;
      return fair;
    }
    const entries=MTMMidway.plan(course,data);
    const carnival=MTMCarnival.plan(course,data,entries,props),electric=MTMElectric.plan(course,data.jokeSigns||[],entries);
    const crowd=MTMCrowd.plan(course,data,entries,carnival),lookouts=MTMElectric.lookouts(course,data,entries,carnival);
    const obstacles=[...(data.obstacles||[]),...MTMMidway.supports(entries),...carnival.fixed,...(crowd.fixed||[])];
    return {entries,carnival,crowd,electric,lookouts,obstacles,jokes:data.jokeSigns||[],survey:data.survey,
      classic:entries.find(e=>e.kind==='classic'),attraction:MTMOddities.location(course)};
  }
  function bindFair(course,fair){
    course.midway=fair.entries;course.carnival=fair.carnival;course.crowd=fair.crowd;
    course.obstacles=fair.obstacles;course.jokeSigns=fair.jokes;course.lookouts=fair.lookouts;
  }
  function raceStart(g){
    sightseeing=false;mount(document.getElementById('stage'));wasGarage=false;initialCamera=true;shake=0;
    const layout=g.c.original,key=layout.layoutKey;
    if(cache.size&&!cache.has(key)){
      // Keep only the current course resident. On return its deterministic
      // survey regenerates the same structures, crowd and terrain.
      if(active?.world){
        scene.remove(active.world,active.sky);
        const released=new Set();
        for(const root of [active.world,active.sky])root.traverse(o=>{
          if(o.isInstancedMesh)o.dispose?.();
          for(const asset of [o.geometry,...[].concat(o.material||[]).flatMap(m=>[m,m.map])]){
            if(asset&&!released.has(asset)){asset.dispose?.();released.add(asset);}
          }
        });
      }
      cache.clear();active=null;renderer?.resetCourse?.();
    }
    if(!renderer){
      if(!cache.has(key)){
        const group=new T.Group();MTMScenery.build(group,layout.ground,layout);
        cache.set(key,fairPlan(layout,group.userData,g.props));group.traverse(o=>o.geometry?.dispose());
      }
      active=cache.get(key);bindFair(g.c,active);
      for(const v of [g.p,...g.ai])sprite('rear',v.truck);return;
    }
    if(active?.world)scene.remove(active.world,active.sky);for(const m of displayed)scene.remove(m.root);for(const m of shadows)scene.remove(m);
    if(!cache.has(key)){
      const built=MTMTrack.build(layout);
      built.props=MTMProps.attach(built.world,layout,g.props);built.soil=MTMSoilArt.attach(built.world,layout,g.c.soil);
      built.oddity=MTMOddities.attach(built.world,layout);
      Object.assign(built,fairPlan(layout,built.world.userData,g.props));
      built.decor=MTMCarnival.attach(built.world,built.carnival);
      built.signLights=MTMElectric.attach(built.world,built.electric,layout);
      built.bleachers=MTMCrowd.attach(built.world,built.crowd);
      built.midway=MTMMidway.attach(built.world,built.entries);cache.set(key,built);
    }
    active=cache.get(key);bindFair(g.c,active);
    active.props.update(g.props);active.soil.update(g.c.soil);active.setStartSignal?.(3);
    scene.add(active.world,active.sky);scene.fog=new T.FogExp2(active.fog,g.c.id==='arizona'?.00255:.00315);
    displayed=[g.p,...g.ai].map((v,i)=>rig(v,i===0));shadows=displayed.map((_,i)=>shadowPool[i]||(shadowPool[i]=shadowPlane()));displayed.forEach((m,i)=>{scene.add(m.root,shadows[i]);});
    active.cars.forEach(car=>{car.group.scale.y=1;});const truck=MTMTrucks.roster[g.p.truck];hood.material.color.set(truck.paint||truck.color);dust.clear();sparks.clear();
  }
  const headUp=new T.Vector3(0,1,0);
  let headYaw=0,headPitch=0;
  function headLook(yaw,pitch){headYaw=yaw;headPitch=pitch;}
  function cameraStep(v,dt,mode,force=false){
    const cabLift=MTMTrucks.suspensionSets[v.suspension??1].lift-(v.bounce||0);
    const s=Math.sin(v.yaw),c=Math.cos(v.yaw),speed=v.speed||0,sh=reduced?0:shake,cam=mode;
    if(cam===1){targetPos.set(v.x+s*.43+c*.34,v.y+2.84+cabLift,v.z+c*.43-s*.34);targetAim.set(targetPos.x+s*32,targetPos.y-1.05-23*Math.sin(v.pitch+v.bPitch*.5),targetPos.z+c*32);}
    else if(cam===2){targetPos.set(v.x+15,v.y+48,v.z-23);targetAim.set(v.x+s*4,v.y,v.z+c*4);}
    else{const dist=8.9+Math.min(speed*.068,2.7);targetPos.set(v.x-s*dist,v.y+4.13+speed*.014,v.z-c*dist);targetAim.set(v.x+s*(2.7+speed*.052),v.y+1.37-Math.sin(v.pitch)*2.2,v.z+c*(2.7+speed*.052));}
    if(cam!==1&&active&&currentCourse){targetPos.y=Math.max(targetPos.y,currentCourse.ground(targetPos.x,targetPos.z)+1.45);}
    // Carry the driver's interpolated translation into the rig exactly once.
    // Only the change in boom angle, ride height and look-ahead needs damping.
    // Filtering a world position makes the camera lunge as physics ticks arrive.
    const cut=force||initialCamera;
    if(!cut&&cam!==1){
      const dx=v.x-followAnchor.x,dz=v.z-followAnchor.z;
      camera.position.x+=dx;camera.position.z+=dz;chaseAim.x+=dx;chaseAim.z+=dz;
    }
    followAnchor.set(v.x,v.y,v.z);
    const mix=cut||cam===1?1:1-Math.exp(-dt*(cam===2?4.5:7.6));
    camera.position.lerp(targetPos,mix);chaseAim.lerp(targetAim,cut||cam===1?1:1-Math.exp(-dt*9));
    camera.up.set(0,1,0);camera.lookAt(chaseAim);
    // Apply head motion after calculating the unmodified chase / cab rig.
    // Clearing the offsets restores the forward view on the very next frame.
    if(headYaw||headPitch){camera.rotateOnWorldAxis(headUp,headYaw);camera.rotateX(headPitch);}
    if(sh>.004)camera.rotateZ(Math.sin(performance.now()*.045)*sh*.012);shake*=Math.exp(-dt*8);
    const want=cam===1?74:cam===2?50:58+Math.min(7,speed*.19);
    const next=cut?want:camera.fov+(want-camera.fov)*(1-Math.exp(-dt*4.2));
    if(Math.abs(camera.fov-next)>.00001){camera.fov=next;camera.updateProjectionMatrix();}
    camera.updateMatrixWorld();initialCamera=false;
  }
  let currentCourse=null;
  // Each tire samples its own contact patch. Decompose the body rotation to
  // keep the unsprung axle against the surface and let the shocks articulate.
  function articulation(c,v){
    if(!v.grounded){wheelOffsets.fill(-.10);return wheelOffsets;}
    const sn=Math.sin(v.yaw),cs=Math.cos(v.yaw),cp=Math.cos(v.pitch),sp=Math.sin(v.pitch),cr=Math.cos(v.roll),sr=Math.sin(v.roll);
    const limit=[.27,.20,.15][v.suspension??1];
    for(let i=0;i<4;i++){
      const x=(i%2?1:-1)*1.392,z=i<2?1.65:-1.65;
      const ground=c.ground(v.x+cs*x+sn*z,v.z-sn*x+cs*z);
      const rest=v.y+(sr*x+cr*.864)*cp-sp*z,dy=(ground+.15+.864-rest)/(cr*cp);
      wheelOffsets[i]=Math.max(-limit,Math.min(limit,dy));
    }
    return wheelOffsets;
  }
  function render(g,dt,avatars=null,replay=false,replayProps=null,replaySoil=null,replayClock=0){currentCourse=g.c;const vs=avatars||[g.p,...g.ai],p=vs[0];cameraStep(p,dt,camMode);
    const clock=replay?3.1+replayClock:g.grid?.released?3.1+(g.viewTime??g.time):g.time||g.grid?.elapsed||0;
    if(!renderer){drawSoft(g,vs,replayProps||g.props,replaySoil||g.c.soil,reduced?0:clock);return;}
    active.finishShow(reduced?22.46:g.paradeTime||0,!!g.parade&&!replay);headlights.beam.visible=true;dust.obj.visible=sparks.obj.visible=true;
    active.signLights.update(reduced?0:clock,p);active.bleachers.update(g,clock,p,reduced);
    active.decor.update(g,clock,p,reduced);
    active.midway.update(clock,clock,g,p,reduced);active.oddity.update(reduced?0:clock,reduced?0:MTMMidway.response(g,active.classic,clock));active.props.update(replayProps||g.props);active.soil.update(replaySoil||g.c.soil);
    vs.forEach((v,i)=>{const r=displayed[i];r.root.position.set(v.x,v.y,v.z);r.root.rotation.set(v.pitch,v.yaw,v.roll,'YXZ');r.body.rotation.x=v.bPitch;r.body.rotation.z=v.bRoll;MTMTrucks.pose(r,v.steer*(i?1:.43),v.wheel,v.bounce,articulation(g.c,v));r.root.visible=i!==0||camMode!==1;
      const sp=shadows[i];sp.visible=true;const ct=MTMPhysics.contact(g.c,v.x,v.z,v.yaw),gap=Math.max(0,v.y-ct.y);sp.position.set(v.x,ct.y+.14,v.z);sp.rotation.set(-Math.PI/2+ct.pitch,v.yaw,ct.roll,'YXZ');sp.scale.setScalar(1+Math.min(.24,gap*.04));sp.material.opacity=Math.max(.32,1-gap*.07);});
    hood.visible=camMode===1;if(hood.visible){const sn=Math.sin(p.yaw),cs=Math.cos(p.yaw);hood.position.set(p.x+sn*1.7,p.y+1.97+MTMTrucks.suspensionSets[p.suspension??1].lift-p.bounce-Math.sin(p.pitch)*1.7,p.z+cs*1.7);hood.rotation.set(p.pitch,p.yaw,p.roll,'YXZ');}
    active.cars.forEach((car,i)=>{car.group.scale.y=g.cars[i]?.crushed?.39:1;});if(!replay&&dt>0)dust.update(vs,dt,g.c);if(dt>0)sparks.update(p,dt);active.sky.position.copy(camera.position);MTMCelestial.focus(active.sky,camera);headlights.update(g.c,p);
    sun.position.set(p.x-46,p.y+65,p.z-34);sun.target.position.set(p.x,p.y,p.z);renderer.render(scene,camera);
  }
  // The trackside viewer looks at the same meshes and posters as the race.
  // Its observer and clock are local to the tour, separate from race timing.
  const tourist={x:0,y:0,z:0,yaw:0},tourFloat={};let portraitKey=null,portraitAspect=0,portraitPose=null;
  function tour(g,e,time){
    if(!sightseeing){sightseeing=true;resize();}
    currentCourse=g.c;
    if(portraitKey!==e||portraitAspect!==camera.aspect){
      portraitKey=e;portraitAspect=camera.aspect;
      portraitPose=e.kind==='finish'?{x:MTMFinish.venue(g.c).front[0],y:MTMFinish.venue(g.c).front[1]+4,z:MTMFinish.venue(g.c).front[2],aim:e.y+10}:e.kind==='sky'?e:MTMMidway.portrait(e,g.c,camera.aspect,active.survey);
    }
    let {x,y,z,aim}=portraitPose,lookX=e.x,lookZ=e.z;
    if(e.kind==='float'){
      const floating=MTMCarnival.flight(e,reduced?0:time,tourFloat);
      // Ride alongside the real moving float so its animated parts stay in frame.
      x+=floating.x-e.x;z+=floating.z-e.z;y+=floating.y-e.y;aim+=floating.y-e.y;
      lookX=floating.x;lookZ=floating.z;
    }
    if(e.kind==='sky'){
      const d=e.direction;lookX=x+d.x*100;aim=y+d.y*100-e.drop;lookZ=z+d.z*100;
    }
    camera.fov=e.kind==='sky'?e.fov:49;
    if(e.direction?.stars&&camera.aspect<1)camera.fov=Math.min(82,Math.atan(Math.tan(e.fov*Math.PI/360)/camera.aspect)*360/Math.PI);
    camera.updateProjectionMatrix();camera.position.set(x,y,z);
    camera.up.set(0,1,0);camera.lookAt(lookX,aim,lookZ);camera.updateMatrixWorld();
    Object.assign(tourist,{x,y,z,yaw:Math.atan2(lookX-x,lookZ-z)});
    if(!renderer){drawSoft(g,[tourist],g.props,g.c.soil,reduced?0:time);return;}
    for(const m of displayed)m.root.visible=false;for(const shadow of shadows)shadow.visible=false;
    hood.visible=false;headlights.beam.visible=false;dust.obj.visible=sparks.obj.visible=false;
    active.finishShow(reduced?22.46:time,e.kind==='finish');active.signLights.update(reduced?0:time,tourist);active.bleachers.update(g,time,tourist,reduced);
    active.decor.update(g,time,tourist,reduced);
    active.midway.update(time,time,g,tourist,reduced);active.oddity.update(reduced?0:time,reduced?0:MTMMidway.response(g,active.classic,time));
    active.sky.position.copy(camera.position);MTMCelestial.focus(active.sky,camera);sun.position.set(e.x-46,e.y+65,e.z-34);sun.target.position.set(e.x,e.y,e.z);
    renderer.render(scene,camera);
  }
  // Project the chart's catalog stars through the sightseeing camera. The
  // optional guide only needs repainting when the chosen field or view changes.
  function traceStars(canvas,field){
    const w=width,h=height,pixelRatio=Math.min(2,devicePixelRatio||1);
    canvas.width=Math.round(w*pixelRatio);canvas.height=Math.round(h*pixelRatio);
    const ctx=canvas.getContext('2d');ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);
    const points=field.stars.map(star=>{
      screenV.set(star.x,star.y,star.z).multiplyScalar(500).add(camera.position).project(camera);
      return {x:(screenV.x+1)*w*.5,y:(1-screenV.y)*h*.5,name:star.name};
    });
    ctx.lineWidth=1;ctx.strokeStyle='rgba(142,232,226,.69)';ctx.setLineDash([5,5]);
    for(const [i,j] of field.edges){
      const a=points[i],b=points[j],dx=b.x-a.x,dy=b.y-a.y,k=Math.min(.24,7/Math.max(1,Math.hypot(dx,dy)));
      ctx.beginPath();ctx.moveTo(a.x+dx*k,a.y+dy*k);ctx.lineTo(b.x-dx*k,b.y-dy*k);ctx.stroke();
    }
    ctx.setLineDash([]);ctx.font='500 12px Mono, monospace';ctx.textBaseline='middle';ctx.lineWidth=3;
    for(const p of points){
      ctx.textAlign=p.x+ctx.measureText(p.name).width+16>w?'right':'left';
      const x=p.x+(ctx.textAlign==='left'?9:-9),y=p.y-10;
      ctx.strokeStyle='rgba(10,18,32,.84)';ctx.strokeText(p.name,x,y);
      ctx.fillStyle='#c5e5e8';ctx.fillText(p.name,x,y);
    }
  }
  // An equal-power stereo mix follows the listening camera. Several bleachers
  // can contribute, so a player between two stands hears both sides.
  const audience={level:0,pan:0,energy:0};
  function crowdMix(g,clock){
    const eye=camera.position,right=camera.matrixWorld.elements;
    let total=0,pan=0,loudest=0,other=0,energy=0;
    for(const section of g.c.crowd.sections){
      const x=section.x-eye.x,z=section.z-eye.z,y=(section.aimY??section.y+2)-eye.y;
      const d=Math.hypot(x,y,z);if(d>132)continue;
      const near=Math.max(0,1-(d-10)/122),weight=Math.min(1,near*near);
      const at=(x*right[0]+y*right[1]+z*right[2])/Math.max(1,d);
      total+=weight;pan+=weight*at;
      if(weight>loudest){other=loudest;loudest=weight;}else other=Math.max(other,weight);
      energy=Math.max(energy,MTMCrowd.energy(g,section,clock)*Math.min(1,1.55*weight));
    }
    audience.level=Math.min(1,loudest+.21*other);audience.pan=total?pan/total:0;audience.energy=energy;
    return audience;
  }
  function showroom(node,index,setup){
    const sameTruck=wasGarage&&index===garageIndex,entering=!wasGarage;
    sightseeing=false;mount(node);wasGarage=true;garageIndex=index;
    if(!sameTruck)garageTime=.64;
    if(entering){garageWheel=false;garageTurn=0;}
    garageFit={tires:setup?.tires??0,suspension:setup?.suspension??1};
    garageSpring.bounce=garageSpring.bounceV=0;
    node.dataset.truck=String(index);node.dataset.tires=String(garageFit.tires);node.dataset.suspension=String(garageFit.suspension);
    node.setAttribute('aria-label','3D preview of '+MTMTrucks.roster[index].name+' with '+['all-terrain','deep-tread','hardpack'][garageFit.tires]+' tires');
    if(renderer){
      // Showroom and race have different scene graphs. Their instances share
      // mesh resources in MTMTrucks, but never share a mutable transform.
      const key=index+':'+garageFit.tires+':'+garageFit.suspension;
      if(!garageRigs.has(key))garageRigs.set(key,MTMTrucks.make(index,true,garageFit));
      const next=garageRigs.get(key);
      if(next!==garageModel){if(garageModel)garageScene.remove(garageModel.root);garageModel=next;garageScene.add(next.root);}
      garageModel.root.visible=true;garageModel.root.position.set(0,0,0);garageModel.root.rotation.set(0,0,0);garageModel.body.rotation.set(0,0,0);
    }
    garageFrame(0);
  }
  function inspectWheel(on){garageWheel=on;garageFrame(0);}
  function testSuspension(){if(wasGarage){garageSpring.bounce=0;garageSpring.bounceV=3.3;}}
  function garageFrame(dt){
    if(!wasGarage)return;
    garageTime+=reduced?0:dt*.095;
    // A repeatable impulse makes the three spring and damper rates comparable.
    for(let left=Math.min(dt,.5);left>1e-6;){const step=Math.min(left,1/90);MTMPhysics.stepSpring(garageSpring,garageFit.suspension,step);left-=step;}
    if(renderer){
      MTMTrucks.pose(garageModel,.13,0,garageSpring.bounce);
      if(garageWheel){
        const hub=garageModel.wheels[1].position,a=1.11+garageTurn+.10*Math.sin(garageTime),d=3.55;
        garageCam.position.set(hub.x+Math.sin(a)*d,hub.y+1.04,hub.z+Math.cos(a)*d);
        garageCam.lookAt(hub.x,hub.y+.13,hub.z-.04);
      }else{
        const a=garageTime+garageTurn,d=8.85;
        garageCam.position.set(Math.sin(a)*d,3.35,Math.cos(a)*d);garageCam.lookAt(0,1.38,0);
      }
      renderer.render(garageScene,garageCam);return;
    }
    const ctx=soft.getContext('2d'),w=soft.width,h=soft.height;ctx.clearRect(0,0,w,h);
    if(garageWheel){
      const img=sprite('wheel',garageIndex,garageFit.tires);
      if(img?.naturalWidth){const ih=h*.93,iw=ih*img.naturalWidth/img.naturalHeight;ctx.drawImage(img,(w-iw)*.5,(h-ih)*.5,iw,ih);}
    }else drawTruck(ctx,w*.5,h*.95,Math.min(w*.63,h*1.63),garageIndex,true,garageFit,garageSpring.bounce);
  }
  function sprite(view,index,tires=0){
    const art=MTMFitmentArt;if(!art)return null;
    const key=view+':'+index+(view==='wheel'?':'+tires:'');
    if(!sprites.has(key)){const img=new Image();img.src=view==='wheel'?art.wheels[index][tires]:art[view][index];sprites.set(key,img);}
    return sprites.get(key);
  }
  function drawTruck(ctx,x,bottom,width,index,front,fit,compression=0){
    const view=front?'front':'rear',img=sprite(view,index),art=MTMFitmentArt;
    if(!img?.naturalWidth||!art)return;
    const {cellWidth:sw,cellHeight:sh}=art,t=fit?.tires??0,s=fit?.suspension??1;
    const dw=width/(art.bodyWidth?.[view]||.9),dh=dw*sh/sw*(1-compression*.20);
    const anchor=art.groundAnchor??.963;
    ctx.drawImage(img,t*sw,s*sh,sw,sh,x-dw*.5,bottom-dh*anchor,dw,dh);
  }
  // Bake small static cabinets at sign-painter resolution for a cheap painter's
  // pass. The original art is in metres and serves every track and camera.
  const salvageCards=new Map();
  function salvageCard(kit,variation){
    const id=kit.id+'/'+variation;
    if(!salvageCards.has(id)){
      const margin=.25,pixels=30,width=kit.width*1.12+margin*2,height=kit.height+margin*2;
      const pic=document.createElement('canvas');pic.width=Math.ceil(width*pixels);pic.height=Math.ceil(height*pixels);
      const ctx=pic.getContext('2d');ctx.translate(pic.width*.5,pic.height-margin*pixels);ctx.scale(pixels,-pixels);kit.draw(ctx,variation/3);
      salvageCards.set(id,{pic,w:pic.width/pixels,h:pic.height/pixels,bottom:margin});
    }
    return salvageCards.get(id);
  }
  function drawSoft(g,vs,items,soil,clock){
    const ctx=soft.getContext('2d'),w=soft.width,h=soft.height,ar=g.c.id==='arizona',stad=g.c.id==='indiana',p=vs[0];
    MTMCelestial.draw(ctx,w,h,camera,g.c.id);
    function proj(x,y,z){screenV.set(x,y,z).applyMatrix4(camera.matrixWorldInverse);const dep=-screenV.z;if(dep<.38)return null;screenV.applyMatrix4(camera.projectionMatrix);return {x:(screenV.x+1)*w*.5,y:(1-screenV.y)*h*.5,d:dep};}
    const flat=proj(p.x+Math.sin(p.yaw)*400,p.y,p.z+Math.cos(p.yaw)*400),horizon=sightseeing&&g.tourStop?.kind==='sky'?(flat?clamp2(flat.y,-h,2.5*h):2.5*h):camMode===2?h*.16:flat?Math.max(h*.10,Math.min(h*.76,flat.y)):h*.48;
    for(let l=0;l<2;l++){ctx.fillStyle=ar?['#4b4a69','#423851'][l]:['#30485a','#263e49'][l];ctx.beginPath();ctx.moveTo(0,horizon);for(let i=0;i<=90;i++){const a=(i/90-.5)*1.5+p.yaw,b=Math.sin(a*9+l)+.5*Math.sin(a*19+l);ctx.lineTo(i*w/90,horizon-(.05+l*.024)*h*(ar?Math.min(.93,Math.max(0,b+.35)):Math.abs(b)));}ctx.lineTo(w,horizon);ctx.fill();}
    ctx.fillStyle=ar?'#574051':stad?'#414050':'#314643';ctx.fillRect(0,horizon,w,h-horizon);const prim=[];
    function polygon(points,color){if(points.some(q=>!q))return;const d=points.reduce((v,q)=>v+q.d,0)/points.length;prim.push({d,fn(){ctx.fillStyle=color;ctx.beginPath();points.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();ctx.fill();}});}
    const c=g.c,ss=c.samples,stride=3,plaza=MTMFinish.venue(c);
    if(Math.hypot(plaza.hub[0]-p.x,plaza.hub[2]-p.z)<220){
      for(const f of plaza.faces)polygon(f.p.map(q=>proj(...q)),f.ink);
      MTMFinish.show(plaza,reduced?22.46:(g.paradeTime||clock),!!g.parade||g.tourStop?.kind==='finish',(q,ink)=>polygon(q.map(a=>proj(...a)),ink));
      for(const b of plaza.labels){const q=proj(...b.p);if(q)prim.push({d:q.d,fn(){const size=Math.max(4,h*1.15/q.d);ctx.fillStyle='#152037';ctx.fillRect(q.x-size*8,q.y-size,size*16,size*1.7);ctx.textAlign='center';ctx.font='bold '+size+'px Cond';ctx.fillStyle='#9effda';ctx.fillText(b.title,q.x,q.y+size*.25,size*15.8);}});}
    }
    function onRoad(q,k,y=0){const x=q.x+q.dz*k,z=q.z-q.dx*k;return proj(x,c.ground(x,z)+.17+y,z);}
    for(const mark of c.rampInk){
      if((mark.x-p.x)**2+(mark.z-p.z)**2<160**2)polygon(mark.points.map(q=>proj(...q)),mark.tint);
    }
    if(Math.hypot(c.samples[0].x-p.x,c.samples[0].z-p.z)<120)
      for(const face of c.gridInk)polygon(face.map(q=>proj(...q)),'#a9c9c8');
    for(let i=0;i<ss.length-1;i+=stride){const a=ss[i],b=ss[Math.min(ss.length-1,i+stride)];if((a.x-p.x)**2+(a.z-p.z)**2>270**2)continue;
      const hw=c.width*.5,cols=[-1.06,-.9,-.54,-.42,.42,.54,.9,1.06],palette=ar?['#4e3b49','#765769','#614653','#775a68','#634654','#78596b','#513b4c']:stad?['#4a4152','#625766','#504955','#675c6d','#504955','#625766','#4c4354']:['#364c51','#566268','#495356','#5d6a6c','#495356','#59646a','#334a4e'];
      const row=cols.map(k=>onRoad(a,k*hw)),next=cols.map(k=>onRoad(b,k*hw));for(let j=0;j<cols.length-1;j++)polygon([row[j],row[j+1],next[j+1],next[j]],palette[j]);
      if((i/stride)%3===0){for(const side of [-1,1]){const k=side*(hw+1),f=onRoad(a,k),t=onRoad(a,k,1.35);if(f&&t)prim.push({d:f.d-.04,fn(){ctx.strokeStyle='#87b5c5';ctx.lineWidth=clamp2(h*.14/f.d,1,9);ctx.beginPath();ctx.moveTo(f.x,f.y);ctx.lineTo(t.x,t.y);ctx.stroke();ctx.fillStyle=side>0?'#63f5d7':'#ef5e9c';ctx.fillRect(t.x-ctx.lineWidth/2,t.y,ctx.lineWidth,Math.abs(f.y-t.y)*.25);}});}}
      if(!stad&&(i/stride)%4===0){const side=i%2?-1:1,k=side*(hw+9+17*Math.abs(Math.sin(i*.81))),x=a.x+a.dz*k,z=a.z-a.dx*k,q=proj(x,c.base(x,z),z);if(q)prim.push({d:q.d,fn(){const size=clamp2(h*3.8/q.d,1,h*.4);ctx.save();ctx.translate(q.x,q.y);if(ar){ctx.fillStyle='#293c48';ctx.fillRect(-size*.09,-size,size*.18,size);ctx.fillRect(-size*.31,-size*.69,size*.10,size*.34);ctx.fillRect(-size*.30,-size*.40,size*.32,size*.11);ctx.fillRect(size*.07,-size*.58,size*.24,size*.11);ctx.fillRect(size*.23,-size*.82,size*.09,size*.32);}else{ctx.fillStyle='#263b46';ctx.beginPath();ctx.moveTo(0,-size*1.4);ctx.lineTo(size*.39,0);ctx.lineTo(-size*.39,0);ctx.fill();}ctx.restore();}});}
    }
    const gates=[{...c.at(0),name:c.loop?'START / FINISH':'START'},...c.gates.filter(q=>!(q.finish&&c.loop)).map(q=>({...q,name:q.finish?'FINISH':''}))];for(const q of gates){if(Math.hypot(q.x-p.x,q.z-p.z)>245)continue;let ends=[];for(const side of [-1,1]){const k=side*c.width*.58,bot=onRoad(q,k),top=onRoad(q,k,q.name?7.5:5.2);if(!bot||!top)continue;ends.push(top);prim.push({d:bot.d,fn(){ctx.lineWidth=clamp2(h*.22/bot.d,1,12);ctx.strokeStyle='#91b5bb';ctx.beginPath();ctx.moveTo(bot.x,bot.y);ctx.lineTo(top.x,top.y);ctx.stroke();if(!q.name){ctx.fillStyle=side>0?'#63f5d7':'#ef5e9c';ctx.fillRect(top.x,top.y,Math.max(3,h*1.35/bot.d),h*3.0/bot.d);}}});}if(q.name&&ends.length===2){const [a,b]=ends;prim.push({d:(a.d+b.d)/2-.2,fn(){const fw=Math.abs(b.x-a.x),fh=Math.max(3,fw*.075);ctx.fillStyle='#15243a';ctx.fillRect(Math.min(a.x,b.x),a.y,fw,fh);ctx.fillStyle='#bcfff3';ctx.textAlign='center';ctx.font='bold '+Math.max(3,fh*.83)+'px Cond';ctx.fillText(q.name,(a.x+b.x)*.5,a.y+fh*.83);}});}}
    // Use the art's actual placement and wording even on older canvas-only
    // machines. Each face is projected onto its real world-space dimensions.
    for(const board of active.jokes||[]){
      const vx=camera.position.x-board.x,vz=camera.position.z-board.z,sn=Math.sin(board.yaw),cs=Math.cos(board.yaw);
      if(vx*sn+vz*cs<0||vx*vx+vz*vz>175*175)continue;
      const left=proj(board.x-cs*board.width*.5,board.y,board.z+sn*board.width*.5);
      const right=proj(board.x+cs*board.width*.5,board.y,board.z-sn*board.width*.5);
      const mid=proj(board.x,board.y,board.z),top=proj(board.x,board.y+board.height*.5,board.z),foot=proj(board.x,board.y-board.height*.5,board.z);
      if(!left||!right||!mid||!top||!foot)continue;
      const bw=Math.abs(right.x-left.x),bh=Math.abs(foot.y-top.y);
      prim.push({d:mid.d,fn(){ctx.save();ctx.translate(mid.x,mid.y);
        ctx.fillStyle='#34404a';ctx.fillRect(-bw*.31,bh*.48,Math.max(1,bw*.033),bh*.95);ctx.fillRect(bw*.27,bh*.48,Math.max(1,bw*.033),bh*.95);
        if(board.sprite){const s=board.sprite;ctx.drawImage(s.image,s.x,s.y,s.w,s.h,-bw*.5,-bh*.5,bw,bh);}
        else {ctx.fillStyle='#142437';ctx.fillRect(-bw*.5,-bh*.5,bw,bh);ctx.fillStyle=board.accent;ctx.font='bold '+Math.max(3,bh*.31)+'px sans-serif';ctx.textAlign='center';
          ctx.fillText(board.lines[0],0,-bh*.02,bw*.91);ctx.fillText(board.lines[1],0,bh*.34,bw*.91);}
        MTMElectric.drawRim(ctx,board,bw,bh,clock);
        ctx.restore();}});
    }
    const odd=active.attraction;
    if(odd){const q=proj(odd.x,odd.y,odd.z),pulse=reduced?0:MTMMidway.response(g,active.classic,clock);
      if(q&&q.d<220)prim.push({d:q.d,fn(){const a=h*5.2/q.d;
        ctx.save();ctx.translate(q.x,q.y);ctx.scale(a,a);ctx.fillStyle='#344356';ctx.fillRect(-.32,-.92,.64,.92);
        const blob=(x,y,rx,ry,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();};
        if(pulse){ctx.translate(0,-1.05);ctx.rotate((odd.kind==='tube'?.25:.12)*pulse);ctx.scale(1+(odd.kind==='dog'?.21:.04)*pulse,1+.09*pulse);ctx.translate(0,1.05);}
        if(odd.kind==='duck'){ctx.translate(0,.045*Math.sin(clock*1.8));ctx.rotate(.04*Math.sin(clock*1.32));blob(0,-1.12,.78,.41,'#f5ba32');blob(.36,-1.55,.37,.38,'#f6c138');blob(.66,-1.49,.25,.1,'#ff8338');blob(.52,-1.64,.045,.045,'#10172a');blob(.19,-1.54,.10,.18,'#273449');}
        else if(odd.kind==='tube'){const wave=.14*Math.sin(clock*3);ctx.lineCap='round';ctx.lineWidth=.22;ctx.strokeStyle='#fd579c';ctx.beginPath();ctx.moveTo(0,-.35);ctx.quadraticCurveTo(wave,-1.05,-wave,-1.57);ctx.moveTo(-wave,-1.27);ctx.lineTo(-.50,-1.58+wave);ctx.moveTo(-wave,-1.21);ctx.lineTo(.55,-1.53-wave);ctx.stroke();blob(-wave-.04,-1.55,.025,.04,'#142437');blob(-wave+.04,-1.55,.025,.04,'#142437');}
        else{ctx.scale(.74+.26*Math.cos(clock*.57),1);blob(0,-1.22,1.18,.39,'#efa856');blob(0,-1.34,1.05,.21,'#ce6541');blob(.14,-1.57,.59,.10,'#91b451');ctx.strokeStyle='#ffdf49';ctx.lineWidth=.066;ctx.beginPath();for(let k=0;k<=16;k++){const x=-.89+k*.11,y=-1.41+.044*Math.sin(k*1.4);k?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}
        ctx.restore();}});}
    for(const entry of active.entries||[]){
      if(entry.kind==='classic')continue;
      const foot=proj(entry.x,entry.y,entry.z);if(!foot||foot.d>290)continue;
      const k=h/(2*Math.tan(camera.fov*Math.PI/360)*foot.d);
      if(foot.x+entry.width*k<0||foot.x-entry.width*k>w)continue;
      prim.push({d:foot.d,fn(){
        ctx.save();ctx.translate(foot.x,foot.y);ctx.scale(k,-k);
        if(entry.kind==='sponsor'){
          const approach=(camera.position.x-entry.x)*Math.sin(entry.yaw)+(camera.position.z-entry.z)*Math.cos(entry.yaw);
          const width=entry.width,height=entry.height;
          ctx.fillStyle='#526174';for(const x of [-width*.32,width*.32])ctx.fillRect(x-.18,0,.36,2.85);
          ctx.fillStyle='#253747';ctx.fillRect(-width*.51,2.65,width*1.02,height+.20);
          ctx.fillStyle=entry.ink;ctx.fillRect(-width*.51,2.84+height,width*1.02,.13);
          if(approach>0){ctx.scale(1,-1);ctx.drawImage(MTMMidway.poster(entry.design),-width*.5,-2.75-height,width,height);}
        }else if(entry.kind==='neon'||entry.kind==='lcd'||entry.kind==='holo'){
          // Tilt the drawn frontage into its real roadside plane. A paper-thin
          // display seen edge-on should occupy only a thin strip of screen.
          const nx=Math.sin(entry.yaw),nz=Math.cos(entry.yaw),mid=entry.y+entry.height*.5;
          const q=proj(entry.x,mid,entry.z),u=proj(entry.x+nz,mid,entry.z-nx),v=proj(entry.x,mid+1,entry.z);
          if(q&&u&&v){
            ctx.setTransform(u.x-q.x,u.y-q.y,v.x-q.x,v.y-q.y,q.x,q.y);
            ctx.translate(0,-entry.height*.5);
            if(entry.kind==='holo'||(camera.position.x-entry.x)*nx+(camera.position.z-entry.z)*nz>0)
              entry.draw(ctx,clock,reduced?0:MTMMidway.response(g,entry,clock));
            else {
              ctx.fillStyle='#394251';ctx.fillRect(-entry.width*.35,0,.24,entry.height*.65);ctx.fillRect(entry.width*.35,0,.24,entry.height*.65);
              ctx.fillRect(-entry.width*.5,entry.height*.30,entry.width,entry.height*.67);
            }
          }
        }else entry.draw(ctx,clock,reduced?0:MTMMidway.response(g,entry,clock));
        ctx.restore();
      }});
    }
    const carnival=active.carnival,focus=h/(2*Math.tan(camera.fov*Math.PI/360));
    MTMElectric.drawSpills(ctx,active.electric,g.c,p,proj,prim);
    MTMCrowd.draw(ctx,active.crowd,g,clock,p,reduced,proj,prim,focus,w,h);
    for(const item of carnival.pieces){
      if((item.x-p.x)**2+(item.z-p.z)**2>185**2)continue;
      const q=proj(item.x,item.y,item.z);if(!q)continue;
      const k=focus/q.d*item.scale,margin=k*(item.kit.width+.8);
      if(q.x+margin<0||q.x-margin>w||q.y<0||q.y-k*(item.kit.height+.8)>h)continue;
      prim.push({d:q.d,fn(){const card=salvageCard(item.kit,item.variation);
        ctx.drawImage(card.pic,q.x-card.w*.5*k,q.y-(card.h-card.bottom)*k,card.w*k,card.h*k);}});
    }
    for(const e of carnival.air){
      const v=MTMCarnival.flight(e,clock),q=proj(v.x,v.y,v.z);if(!q||q.d>465)continue;
      const k=focus/q.d;if(q.x+k*e.width<0||q.x-k*e.width>w||q.y<0||q.y-k*e.height>h)continue;
      prim.push({d:q.d,fn(){ctx.save();ctx.translate(q.x,q.y);ctx.scale(k,-k);ctx.rotate(v.roll);
        e.draw(ctx,clock,reduced?0:MTMMidway.response(g,e,clock));ctx.restore();}});
    }
    for(const line of carnival.strands){
      const [a,b]=line.ends,q=proj(a.x,a.y,a.z);if(!q||q.d>165)continue;
      function point(t,rise){return proj(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t+rise,b.z*t+a.z*(1-t));}
      for(const t of [0,1]){const end=point(t,0),top=point(t,line.h);if(!end||!top)continue;
        prim.push({d:end.d,fn(){ctx.strokeStyle='#738294';ctx.lineWidth=Math.max(.8,focus/end.d*.12);ctx.beginPath();ctx.moveTo(end.x,end.y);ctx.lineTo(top.x,top.y);ctx.stroke();}});}
      for(let j=0;j<8;j++){
        const t=(j+.5)/8,y=line.h-.82*Math.sin(Math.PI*t),left=point(t-.057,y),right=point(t+.057,y),tip=point(t,y-.64);
        if(!left||!right||!tip)continue;
        prim.push({d:left.d,fn(){ctx.strokeStyle='#8496ad';ctx.lineWidth=Math.max(.7,focus/left.d*.04);ctx.beginPath();ctx.moveTo(left.x,left.y);ctx.lineTo(right.x,right.y);ctx.stroke();}});
        polygon([left,right,tip],carnival.pal[(line.color+j+1)%4]);
      }
    }
    if(!reduced)MTMCarnival.particles(g,clock,p,(x,y,z,size,spin,i)=>{
      const q=proj(x,y,z);if(!q)return;const k=focus/q.d*size;
      prim.push({d:q.d,fn(){ctx.save();ctx.translate(q.x,q.y);ctx.rotate(spin);ctx.fillStyle=carnival.pal[i%4];ctx.fillRect(-k/2,-k/4,k,k/2);ctx.restore();}});
    });
    // Objects use their simulated positions and deformation in the lightweight camera too.
    for(const item of items){
      const q=proj(item.x,item.y,item.z);if(!q||q.d>170)continue;
      const size=Math.max(1,h*1.05/q.d),t=item.damage;
      prim.push({d:q.d,fn(){ctx.save();ctx.translate(q.x,q.y);ctx.rotate(item.tiltZ*.7);
        ctx.save();ctx.scale(focus/q.d,-focus/q.d);const detailed=MTMProps.drawLoose(ctx,item.kind,t);ctx.restore();if(detailed){ctx.restore();return;}
        const ww=size*(item.kind==='barricade'?2.35:.89),hh=size*(item.kind==='pylon'?1.45:1.1)*(1-.53*t);
        ctx.fillStyle=item.kind==='tires'?'#283346':item.kind==='barrels'?'#8f5580':'#87c9c6';ctx.fillRect(-ww*.5,-hh,ww,hh);ctx.fillStyle=item.kind==='barrels'?'#e175b5':'#66f5d7';ctx.fillRect(-ww*.5,-hh*.66,ww,Math.max(1,hh*.15));ctx.restore();}});
    }
    for(let n=0;n<soil.length;n++){const patch=g.c.soil[n],vals=soil[n].depth;
      for(let k=0;k<vals.length;k+=2){if(vals[k]<52)continue;const u=2*(k%MTMWorld.cols)/(MTMWorld.cols-1)-1,v=2*Math.floor(k/MTMWorld.cols)/(MTMWorld.rows-1)-1;
        const x=patch.x+patch.dz*u*patch.w+patch.dx*v*patch.l,z=patch.z-patch.dx*u*patch.w+patch.dz*v*patch.l,q=proj(x,g.c.ground(x,z)+.21,z);if(!q||q.d>80)continue;
        prim.push({d:q.d-.2,fn(){const r=h*.52/q.d;ctx.fillStyle='#292938aa';ctx.fillRect(q.x-r*.5,q.y,r,Math.max(1,r*.34));}});}
    }
    if(stad)g.cars.forEach(car=>{const q=proj(car.x,c.base(car.x,car.z)+.3,car.z);if(q)prim.push({d:q.d,fn(){const ww=h*3.5/q.d;ctx.fillStyle='#687b87';ctx.fillRect(q.x-ww/2,q.y-ww*(car.crushed?.09:.22),ww,ww*(car.crushed?.09:.22));}});});
    vs.forEach((v,i)=>{if(g.tourStop||i===0&&camMode===1)return;const q=proj(v.x,v.y,v.z);if(q)prim.push({d:q.d-.35,fn(){const fw=h*3.65/q.d/(2*Math.tan(camera.fov*Math.PI/360));ctx.fillStyle='#282a2255';ctx.beginPath();ctx.ellipse(q.x,q.y,fw*.54,fw*.12,0,0,Math.PI*2);ctx.fill();drawTruck(ctx,q.x,q.y,fw,v.truck,Math.cos(v.yaw-camera.rotation.y)<-.45&&i>0,v);
      if(v.wheelspin>.14&&v.speed<8){
        ctx.save();ctx.lineWidth=Math.max(1,fw*.011);ctx.lineCap='round';
        for(const side of [-1,1])for(let k=0;k<6;k++){
          const t=((Math.abs(v.wheel)*.14+k/6)%1),x=q.x+side*fw*(.40+.16*t),y=q.y-fw*t*.22;
          ctx.fillStyle='rgba(192,221,227,'+(.30*(1-t)*v.wheelspin)+')';ctx.beginPath();ctx.arc(x,y,fw*(.022+t*.078),0,Math.PI*2);ctx.fill();
          if(k<2){const yy=q.y-fw*(.12+.19*((t+k*.15)%1));ctx.strokeStyle='#a2b4c071';ctx.beginPath();ctx.moveTo(q.x+side*fw*.33,yy);ctx.lineTo(q.x+side*fw*.44,yy+fw*.025);ctx.stroke();}
        }
        ctx.restore();
      }}});});prim.sort((a,b)=>b.d-a.d);prim.forEach(v=>v.fn());
  }
  const clamp2=(v,a,b)=>Math.max(a,Math.min(b,v));
  return {raceStart,headLook,render,tour,traceStars,crowdMix,showroom,garageFrame,inspectWheel,testSuspension,resize,modeNames,turnGarage:v=>{garageTurn+=v;},cycle(){camMode=(camMode+1)%3;initialCamera=true;return modeNames[camMode];},startSignal(stage){active?.setStartSignal?.(stage);},get mode(){return camMode;},get webgl(){return !!renderer&&!renderer.isSoftware;},get scale(){return scale;},reduce(){if(renderer){const floor=renderer.isSoftware?Math.min(.55,445/Math.max(640,width)):.6;if(scale>floor+.015){scale=Math.max(floor,scale*.88);resize();}}},impact(v){shake=Math.max(shake,v);},snap(){initialCamera=true;},exitGarage(){wasGarage=false;},get initialized(){return initialized;}};
})();

export {MTMView};
