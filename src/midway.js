/* Put each attraction in the physical circuit. The same surveyed positions
   feed the race renderer, the canvas fallback, horn responses and track tour. */
import { MTMCarnival } from './carnival.js';
import { MTMCourses } from './course.js';
import { MTMFinish } from './finish.js';
import { MTMHoloArt } from './holo-art.js';
import { MTMKit } from './kit.js';
import { MTMLcdArt } from './lcd-art.js';
import { MTMLoopMidway } from './midway-loop.js';
import { MTMMesaMidway } from './midway-mesa.js';
import { MTMNeonArt } from './neon-art.js';
import { MTMOddities } from './oddities.js';
import { MTMProjectFair } from './project-fair.js';
import { MTMSponsorArt } from './sponsor-art.js';
import { MTMStripMidway } from './midway-strip.js';

const MTMMidway=(()=>{
  const T=THREE,posters=new Map(),materials=new Map(),art=MTMOddities.art;
  const programs={arizona:MTMMesaMidway,eight:MTMLoopMidway,indiana:MTMStripMidway};
  const sponsors=Object.fromEntries(MTMSponsorArt.map(a=>[a.id,a]));
  const projects={tracker:'tracker',dippin:'dippin-lang',orrery:'orrery',simmer:'simmer',coven:'coven',mermaidkit:'mermaidkit',smasher:'smasher',pulse:'pulse',
    mammoth:'mammoth',rodeo:'meme-rodeo',turtle:'turtle',kitchen:'test-kitchen',phones:'phonegang',jeff:'jeff'};
  // Ad placements follow the road and face approaching traffic. Western-return
  // ads get their own locations so a long desert heat reveals another district.
  const boards={
    arizona:[['tracker',.036,-1],['orrery',.223,1],['simmer',.405,-1],['dippin',.645,1],['pulse',.817,-1],
      ['mammoth',.096,1],['rodeo',.327,-1],['kitchen',.538,1],['jeff',.944,1],
      ['coven',.604,1,'return'],['mermaidkit',.746,-1,'return'],['smasher',.925,1,'return'],['phones',.678,1,'return'],['turtle',.839,-1,'return']],
    eight:[['dippin',.078,-1],['smasher',.187,1],['coven',.359,-1],['mermaidkit',.582,1],['tracker',.771,1],['simmer',.917,1],
      ['turtle',.028,1],['mammoth',.429,1],['jeff',.653,-1],['phones',.834,-1]],
    indiana:[['pulse',.086,-1],['smasher',.295,1],['mermaidkit',.565,-1],['orrery',.803,1],
      ['rodeo',.160,1],['phones',.443,-1],['kitchen',.722,1],['turtle',.950,-1]]
  };
  const oldSites={
    duck:{id:'quack-array',name:'Quack Array',crew:'2389 Acoustics',ink:'#ffca39',width:11,height:12,radius:6.7,reply:'Your call may be recorded for quack assurance.',sound:'quack'},
    tube:{id:'air-support',name:'Air Support',crew:'Night Shift Mechanics',ink:'#ff62b1',width:10,height:13,radius:5.9,reply:'Torque specification: jazz hands.',sound:'bleep'},
    dog:{id:'frank-lab',name:'Frank Lab',crew:'Department of Mustard',ink:'#ffda50',width:12,height:9,radius:7.3,reply:'Ketchup request denied.',sound:'bell'}
  };
  function poster(design){
    if(!posters.has(design.id)){
      const canvas=MTMKit.canvas(640,256);
      design.draw(canvas.getContext('2d'),640,256);posters.set(design.id,canvas);
    }
    return posters.get(design.id);
  }
  function billboard(entry,root){
    const {width:w,height:h,ink}=entry,b=art.builder(root),bottom=2.75,top=bottom+h;
    for(const x of [-w*.32,w*.32]){
      b.box([x,.25,0],[.95,.5,1.1],'#76849c');
      b.box([x,bottom*.55,0],[.36,bottom*1.12,.40],'#36475a');
      b.rod([x,.34,-1.15],[x,bottom,-.1],.10,.092,'#8c9aab',false,7);
    }
    b.box([0,bottom+h*.5,0],[w+.38,h+.36,.52],'#263448');
    b.box([0,top+.23,.06],[w+.50,.12,.43],ink,null,true);
    b.box([-w*.5-.13,bottom+h*.29,.20],[.13,h*.60,.36],ink,null,true);
    b.box([w*.38,bottom-.23,.12],[w*.27,.10,.38],ink,null,true);
    b.finish();
    if(!materials.has(entry.design.id)){
      const texture=new T.CanvasTexture(poster(entry.design));texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
      materials.set(entry.design.id,new T.MeshBasicMaterial({map:texture,toneMapped:false}));
    }
    const face=new T.Mesh(new T.PlaneGeometry(w,h),materials.get(entry.design.id));
    face.position.set(0,bottom+h*.5,.28);root.add(face);return null;
  }
  function roadDistance(course,f,route){
    if(course.layoutKey==='arizona-circuit'&&route!=='return'){
      const rally=MTMCourses[0],p=rally.at(rally.length*f);
      return course.nearest(p.x,p.z).s;
    }
    return course.length*f;
  }
  function obstacleGap(p,b){
    if(b.r)return Math.hypot(p.x-b.x,p.z-b.z)-b.r;
    return Math.hypot(Math.max(0,Math.abs(p.x-b.x)-(b.hx||0)),Math.max(0,Math.abs(p.z-b.z)-(b.hz||0)));
  }
  // Test a finite sightline against a nearby display. A sign is only as thick
  // as its steel cabinet. A moving sculpture reserves its physical footprint.
  function covers(from,to,e){
    const dx=to[0]-from[0],dy=to[1]-from[1],dz=to[2]-from[2];
    const h=e.kind==='sponsor'?e.height+2.75:e.height;
    if(e.kind==='sponsor'){
      const sn=Math.sin(e.yaw),cs=Math.cos(e.yaw),denom=dx*sn+dz*cs;
      if(Math.abs(denom)<.001)return false;
      const t=((e.x-from[0])*sn+(e.z-from[2])*cs)/denom;
      if(t<=.01||t>=.98)return false;
      const off=(from[0]+t*dx-e.x)*cs-(from[2]+t*dz-e.z)*sn,up=from[1]+t*dy-e.y;
      return Math.abs(off)<e.width*.51&&up>=2.58&&up<=h+.28;
    }
    const t=Math.max(0,Math.min(.98,((e.x-from[0])*dx+(e.z-from[2])*dz)/(dx*dx+dz*dz||1)));
    const up=from[1]+t*dy-e.y,r=e.footprintRadius||e.groundRadius||e.radius||e.r;
    return up>=-.3&&up<h&&Math.hypot(from[0]+t*dx-e.x,from[2]+t*dz-e.z)<r*.83;
  }
  function faceSamples(e){
    const sponsor=e.kind==='sponsor',notice=e.kind==='notice',mid=e.aimY??(sponsor?e.y+2.75+e.height*.50:e.y+e.height*.5);
    const height=notice?e.faceHeight:e.height,cs=Math.cos(e.yaw),sn=Math.sin(e.yaw);
    const points=[];
    for(const k of [-.41,0,.41])for(const u of [-.44,-.22,.03,.33,.43])
      points.push([e.x+cs*k*e.width,mid+u*height,e.z-sn*k*e.width]);
    return points;
  }
  function visible(eye,points,course,survey,displays,subject){
    let clear=0;
    for(const q of points){
      if(survey?.blocked(eye,q)||displays.some(e=>e!==subject&&covers(eye,q,e)))continue;
      let aboveGround=true;
      for(const t of [.30,.58,.82]){
        const x=eye[0]+(q[0]-eye[0])*t,z=eye[2]+(q[2]-eye[2])*t;
        if(course.ground(x,z)+.18>eye[1]+(q[1]-eye[1])*t){aboveGround=false;break;}
      }
      if(aboveGround)clear++;
    }
    return clear/points.length;
  }
  function approach(entry,course,survey,displays){
    const points=faceSamples(entry);
    let score=0;
    for(const back of [36,53]){
      const p=course.at(entry.s-back);
      score+=visible([p.x,course.ground(p.x,p.z)+3.4,p.z],points,course,survey,displays,entry)*.5;
    }
    return score;
  }
  // Keep the front of a roadside installation in view in both wide and
  // portrait windows. The preferred viewpoint is used if the full face clears.
  function portrait(e,course,aspect,survey){
    const sponsor=e.kind==='sponsor',h=sponsor?e.height+2.75:e.height;
    const width=e.width,height=e.kind==='notice'?e.faceHeight*1.7:h;
    const base=Math.max(10.5,height*1.55,width*1.36/Math.max(.42,aspect));
    const aim=e.aimY??(e.y+h*(sponsor?.63:.46)),samples=faceSamples(e);
    const displays=[...(course.midway||[])];
    for(const p of course.carnival?.pieces||[]){
      if(p!==e.focusPiece&&Math.hypot(p.x-e.x,p.z-e.z)<base*1.25+p.r)displays.push(p);
    }
    let best=null,bestScore=-Infinity;
    for(const scale of [1,.82,1.15])for(const rise of [.13,.40,.82])for(const offset of [.08,-.23,.36,-.55,.62,-.83,.93]){
      const angle=e.yaw+offset,dist=base*scale;
      const x=e.x+Math.sin(angle)*dist,z=e.z+Math.cos(angle)*dist;
      const y=Math.max(course.ground(x,z)+1.7,aim+height*rise);
      const eye=[x,y,z],clear=visible(eye,samples,course,survey,displays,e);
      const score=clear*100-Math.abs(offset)*1.6-Math.abs(scale-1)*1.2-rise*.6;
      if(score>bestScore){best={x,y,z,aim};bestScore=score;}
      if(clear===1&&bestScore>99.7)return best;
    }
    return best;
  }
  function plan(course,sceneData){
    const solids=sceneData.obstacles||[],jokes=sceneData.jokeSigns||[],occupied=[],entries=[];
    // Try the lowest-cost physical locations first. Once the base cost alone
    // exceeds the best surveyed view, all remaining locations can be skipped.
    const offsets=[];
    for(const sign of [1,-1])for(const ds of [0,7,-7,15,-15,24,-24,34,-34,48,-48,64,-64,78,-78])
      for(const extra of [0,4,-3,9,15,22,31,43,52])
        offsets.push({sign,ds,extra,cost:Math.abs(ds)*.68+Math.abs(extra)*.86+(sign<0?50:0)});
    offsets.sort((a,b)=>a.cost-b.cost);
    const bypass=course.id==='eight'?Array.from({length:29},(_,i)=>course.at(course.length*(.688+.103*i/28),-14*Math.sin(Math.PI*i/28)**1.4)):[];
    const old=MTMOddities.location(course);
    if(old){
      const c={...old,...oldSites[old.kind],kind:'classic',s:course.nearest(old.x,old.z).s};
      occupied.push(c);entries.push(c);
    }
    function place(spec){
      if(spec.route==='return'&&course.layoutKey!=='arizona-circuit')return;
      const nominal=roadDistance(course,spec.f,spec.route);
      const radius=spec.footprint||spec.footprintRadius||spec.groundRadius||spec.radius;
      let chosen=null,best=Infinity;
      // Test the complete footprint and both branches of the eight. Favor
      // the designed side. Search around pre-existing supports and buildings.
      for(const {sign,ds,extra,cost} of offsets){
        if(cost>=best)break;
        const s=Math.max(4,Math.min(course.length-4,nominal+ds));
          const off=(spec.off+Math.sign(spec.off)*extra)*sign,p=course.at(s,off);
          if(MTMFinish.reserved(course,p.x,p.z,radius))continue;
          if(course.nearest(p.x,p.z).distance<course.width*.53+radius+1.0)continue;
          if(bypass.some(q=>Math.hypot(q.x-p.x,q.z-p.z)<radius+5.9))continue;
          if(occupied.some(q=>Math.hypot(q.x-p.x,q.z-p.z)<radius+(q.footprintRadius||q.groundRadius||q.radius)+2.0))continue;
          if(solids.some(q=>obstacleGap(p,q)<radius+.25))continue;
          if(jokes.some(q=>Math.hypot(q.x-p.x,q.z-p.z)<radius+q.width*.34+.7))continue;
          const from=course.at(s-(spec.kind==='sponsor'?48:50)),yaw=Math.atan2(from.x-p.x,from.z-p.z);
          const candidate={...spec,x:p.x,y:course.ground(p.x,p.z),z:p.z,yaw,s,off,footprintRadius:radius};
          let costWithView=cost+(1-approach(candidate,course,sceneData.survey,occupied))*210;
          if(costWithView>=best)continue;
          for(const window of sceneData.survey?.readingWindows||[]){
            if(Math.hypot(p.x-window.x,p.z-window.z)>65)continue;
            let obscured=0;
            for(const eye of window.eyes)for(const mark of window.targets)if(covers(eye,mark,candidate))obscured++;
            costWithView+=obscured/(window.eyes.length*window.targets.length)*200;
          }
          if(costWithView<best){chosen=candidate;best=costWithView;}
      }
      if(chosen){entries.push(chosen);occupied.push(chosen);}
    }
    for(const asset of programs[course.id])place({...asset,kind:'attraction'});
    for(const [id,f,side,route] of boards[course.id]){
      const design=sponsors[id],width=course.id==='indiana'?10.7:12.1;
      place({id:'ad-'+id+'-'+f,kind:'sponsor',design,name:design.name,crew:'2389 Research',slogan:design.tag,ink:design.accent,
        f,route,off:side*(course.width*.5+9),width,height:width/2.5,radius:width*.52,
        url:'https://2389.ai/research/products/'+projects[id]+'/'});
    }
    // All three electrical trades buy real land on the same course. The
    // existing rides and printed messages get first pick of their sightlines.
    for(const asset of [...MTMNeonArt,...MTMLcdArt,...MTMHoloArt,...MTMProjectFair]){
      if(asset.region===course.id)place(asset);
    }
    return entries.sort((a,b)=>a.s-b.s);
  }
  function attach(world,entries){
    const rigs=[];
    for(const e of entries){
      if(e.kind==='classic')continue;
      const root=art.node(world,e.x,e.y,e.z);root.name=e.name;root.rotation.y=e.yaw;
      const pose=e.kind==='sponsor'?billboard(e,root):e.build(root,art);
      rigs.push({e,root,pose});
    }
    return {update(t,raceClock,g,observer,reduced){
      for(const {e,root,pose} of rigs){
        const dx=observer.x-e.x,dz=observer.z-e.z;root.visible=dx*dx+dz*dz<315*315;
        if(root.visible&&pose)pose(reduced?0:t,reduced?0:response(g,e,raceClock));
      }
    }};
  }
  function supports(entries){
    const fixed=[];
    for(const e of entries){
      if(e.kind==='sponsor'){
        // The empty space beneath the printed face stays driveable.
        for(const sign of [-1,1]){
          const u=sign*e.width*.32;
          fixed.push({x:e.x+u*Math.cos(e.yaw),z:e.z-u*Math.sin(e.yaw),r:.43,material:'metal'});
        }
      }else if(e.kind==='attraction'||e.kind==='neon'||e.kind==='holo'||e.kind==='lcd'||e.kind==='project'){
        const radius=Math.min(e.footprintRadius*.42,2.5),span=Math.min(e.width*.5-radius,e.footprintRadius-radius)*.86;
        for(const u of [-span,0,span])fixed.push({x:e.x+u*Math.cos(e.yaw),z:e.z-u*Math.sin(e.yaw),r:radius,material:'metal'});
      }
    }
    return fixed;
  }
  function signal(g,item,clock){
    const store=g.midwayHorns||(g.midwayHorns=new Map()),old=store.get(item.id)||[];
    if(old.length&&clock-old[old.length-1]<.65)return false;
    const fresh=old.filter(t=>clock-t<36);fresh.push(clock);store.set(item.id,fresh);
    return true;
  }
  function response(g,item,clock){
    const times=g.midwayHorns?.get(item.id);if(!times)return 0;
    for(let i=times.length-1;i>=0;i--){if(times[i]<=clock){const f=Math.max(0,1-(clock-times[i])/1.55);return f*f;}}
    return 0;
  }
  // Use the same world-space positions for the horn, the responding animation
  // and the ticket cannons. Secondary booths answer after the wave reaches them.
  function hornWave(g,item,clock){
    if(!item?.reply)return false;
    // A booth already playing its neighbor's response still answers a driver
    // who honks at it directly. Do not duplicate its tickets or animation.
    if(!signal(g,item,clock))return true;
    if(!g.c.carnival)return true;
    const position=(e,t)=>e.kind==='float'?MTMCarnival.flight(e,t):e;
    const origin=position(item,clock),fire=(e,t,count)=>{
      const p=position(e,t);MTMCarnival.salute(g,p.x,p.y+e.height*.60,p.z,t,count);
    };
    if(item.kind!=='crowd')fire(item,clock,42);
    for(const e of [...g.c.midway,...g.c.carnival.air]){
      if(e===item||!e.reply)continue;
      const p=position(e,clock),dist=Math.hypot(origin.x-p.x,origin.z-p.z);
      if(dist>103)continue;
      const t=clock+.09+dist/103;
      if(signal(g,e,t))fire(e,t,22);
    }
    return true;
  }
  function near(g,clock=0){
    let best=null,limit=Infinity;
    for(const e of [...(g.c.midway||[]),...(g.c.carnival?.air||[])]){
      if(e.kind==='sponsor')continue;
      const p=e.kind==='float'?MTMCarnival.flight(e,clock):e;
      const d=Math.hypot(g.p.x-p.x,g.p.z-p.z);
      if(d<limit&&d<(e.id==='quack-array'?73:59)){best=e;limit=d;}
    }
    if(!best)for(const section of g.c.crowd?.sections||[]){
      const d=Math.hypot(g.p.x-section.x,g.p.z-section.z);
      if(d<limit&&d<47){best=section;limit=d;}
    }
    return best;
  }
  function catalog(course,entries,jokes){
    const signs=jokes.map((b,i)=>{
      const ground=course.ground(b.x,b.z);
      return {...b,id:'notice-'+i,name:b.lines.join(' / '),kind:'notice',...b.campaign,ink:b.accent,crew:'Roadside notices',
        s:course.nearest(b.x,b.z).s,y:ground,aimY:b.y,faceHeight:b.height,height:b.y-ground+b.height/2};
    });
    return [MTMFinish.venue(course).tour,...entries,...signs,...(course.carnival?.air||[]),...(course.carnival?.venues||[]),
      ...(course.crowd?.sections||[]),...(course.lookouts||[])].sort((a,b)=>a.s-b.s);
  }
  return {plan,attach,signal,response,near,hornWave,poster,catalog,portrait,supports};
})();

export {MTMMidway};
