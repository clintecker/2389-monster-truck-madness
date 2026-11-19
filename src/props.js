/* Articulated course furniture. Physics supplies ground-pivot transforms and
   permanent damage; these shared models do not modify simulation or replay data. */
const MTMProps = (() => {
  const T=THREE, tau=Math.PI*2, library=new Map(), paint=new Map();
  const metal=new T.MeshStandardMaterial({vertexColors:true,roughness:.68,metalness:.16,side:T.DoubleSide});
  const reflector=new T.MeshBasicMaterial({vertexColors:true,toneMapped:false,side:T.DoubleSide});
  const stain=new T.MeshBasicMaterial({vertexColors:true,toneMapped:false,side:T.DoubleSide,
    polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-3});
  const mint='#77ffdb',pink='#ff509e',white='#d9f7ed',ink='#172135',silver='#a7b4c4';

  // Bake every rigid piece into colored indexed geometry once. The numbers on
  // housings are actual stencils and stay visible through both rendering paths.
  class Builder {
    constructor(){this.p=[];this.c=[];this.i=[];}
    face(points,shade){
      let color=paint.get(shade);if(!color){color=new T.Color(shade);paint.set(shade,color);}
      const start=this.p.length/3;
      for(const p of points){this.p.push(...p);this.c.push(color.r,color.g,color.b);}
      for(let k=1;k<points.length-1;k++)this.i.push(start,start+k,start+k+1);
    }
    box(x,y,z,w,h,d,shade){
      const a=w*.5,b=h*.5,c=d*.5,p=[
        [x-a,y-b,z-c],[x+a,y-b,z-c],[x+a,y+b,z-c],[x-a,y+b,z-c],
        [x-a,y-b,z+c],[x+a,y-b,z+c],[x+a,y+b,z+c],[x-a,y+b,z+c]];
      for(const f of [[4,5,6,7],[1,0,3,2],[0,4,7,3],[5,1,2,6],[7,6,2,3],[0,1,5,4]])this.face(f.map(n=>p[n]),shade);
    }
    radial(profile,bands,n=16){
      for(let j=1;j<profile.length;j++)for(let i=0;i<n;i++){
        const a=i*tau/n,b=(i+1)*tau/n,[y,r]=profile[j-1],[v,s]=profile[j];
        const col=typeof bands==='function'?bands(j-1,i):bands[j-1];
        this.face([polar(a,r,y),polar(b,r,y),polar(b,s,v),polar(a,s,v)],col);
      }
    }
    geometry(){
      const geo=new T.BufferGeometry();
      geo.setAttribute('position',new T.Float32BufferAttribute(this.p,3));
      geo.setAttribute('color',new T.Float32BufferAttribute(this.c,3));geo.setIndex(this.i);
      geo.computeVertexNormals();geo.computeBoundingSphere();return geo;
    }
  }
  function polar(a,r,y){return [Math.sin(a)*r,y,Math.cos(a)*r];}
  function sheet(b,x0,x1,y0,y1,z,shade){b.face([[x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z]],shade);}
  const digits={2:['111','001','111','100','111'],3:['111','001','111','001','111'],8:['111','101','111','101','111'],9:['111','101','111','001','111']};
  function stencil(b,x,y,z,cell,normal,shade){
    const chars='2389';
    for(let k=0;k<chars.length;k++)for(let row=0;row<5;row++){
      const pattern=digits[chars[k]][row];
      for(let i=0;i<3;i++){if(pattern[i]!=='1')continue;let end=i+1;while(pattern[end]==='1')end++;
        const a=x+normal*((4*k+i-7.5)*cell),e=x+normal*((4*k+end-7.5)*cell);
        sheet(b,a,e,y+(1.5-row)*cell,y+(2.5-row)*cell,z,shade);i=end-1;
      }
    }
  }
  function rigid(pose,mat,draw){
    const b=new Builder();draw(b);return {pose,material:mat,geometry:b.geometry()};
  }
  function drum(){
    return [
      rigid('drumFoot',metal,b=>{
        b.radial([[0,0],[0,.55],[.04,.63],[.10,.64],[.15,.57],[.47,.58],[.53,.62],[.60,.62],[.65,.55],[.75,.54]],
          [ink,'#4b5366',silver,'#383d52','#df6855','#733d4e','#c0cad1','#8e4651','#bd534e']);
        for(const z of [-.585,.585])b.box(0,.32,z,.35,.13,.024,'#593442');
      }),
      rigid('drumBody',metal,b=>{
        b.radial([[-.05,.52],[.01,.55],[.13,.60],[.19,.62],[.24,.59],[.59,.59],[.68,.61],[.78,.58],[.83,.55],[.83,.16]],
          ['#9e434a','#da6457','#914c54','#e88065','#f08a65','#ab5960','#db755d','#9b5260','#384559']);
        for(const z of [-.596,.596])b.box(0,.41,z,.53,.24,.03,ink);
      }),
      rigid('drumBody',reflector,b=>{
        b.radial([[.20,.623],[.237,.611]],()=>mint);
        for(const face of [-1,1])stencil(b,0,.418,face*.616,.028,face,white);
      }),
      rigid('drumLid',metal,b=>{
        b.radial([[-.045,0],[-.045,.55],[-.024,.625],[.028,.625],[.049,.55],[.049,.43],[.039,.40],[.039,.001]],
          ['#343a49','#9095a3','#c2c5c6','#7e8797','#566777','#364859','#5d7181']);
        b.box(.23,.065,.15,.15,.05,.13,'#cdd5d0');b.box(-.19,.063,-.21,.09,.05,.09,'#394a59');
      }),
      rigid('spill',stain,b=>{
        function puddle(x,z,r,shade){
          const shape=[1,.65,.82,1.05,.63,.88,.58,.93,.67,.77,.99,.72];
          b.face(shape.map((v,i)=>[x+Math.cos(-i*tau/shape.length)*v*r,.005,z+Math.sin(-i*tau/shape.length)*v*r*.58]),shade);
        }
        puddle(.78,.10,.88,'#1c555e');puddle(1.42,.07,.39,'#245a60');puddle(1.77,.19,.16,'#367b79');puddle(1.22,-.49,.13,'#367b79');
        b.face([[.40,.012,.26],[.68,.012,.35],[.96,.012,.25],[.73,.012,.29]],'#55a7a0');
      })
    ];
  }
  function tire(b,center,upper){
    const y=center,profile=[[-.202,.38],[-.202,.62],[-.159,.77],[-.106,.82],[.109,.82],[.155,.77],[.201,.62],[.201,.405],[.15,.35],[-.15,.35],[-.202,.38]];
    const side=['#333e4c','#384352','#26303c','#252c37','#303946','#424d59','#35404c','#202936','#141e2a','#25313e'];
    b.radial(profile.map(([v,r])=>[y+v,r]),(j,i)=>(j===3&&i%4===0?'#3a444d':side[j]),18);
    // Slightly proud diagonal tread blocks and sidewall registration marks.
    for(let i=0;i<18;i++){
      const a=i*tau/18,r=.848,scuff=i%5===1?(upper?'#a6b9b8':'#73818c'):'#48505a';
      b.face([polar(a-.15,r,y-.079),polar(a-.055,r,y-.092),polar(a+.12,r,y+.052),polar(a+.027,r,y+.078)],scuff);
      if(i%6===0)b.face([polar(a-.12,.766,y+.162),polar(a+.06,.766,y+.162),polar(a+.055,.64,y+.205),polar(a-.10,.64,y+.205)],upper?pink:silver);
    }
  }
  function tires(){
    return [
      rigid('rubberBase',metal,b=>{
        tire(b,.215,false);tire(b,.621,false);
        for(const z of [-.825,.825]){b.box(.14,.423,z,.082,.70,.039,'#779d9c');b.box(.14,.44,z*1.027,.12,.09,.025,'#c1c7bf');}
      }),
      rigid('looseTire',metal,b=>{
        tire(b,0,true);for(const z of [-.826,.826])b.box(.14,0,z,.08,.31,.025,'#80b2a9');
      })
    ];
  }
  function barricade(){
    return [
      rigid('fixed',metal,b=>{
        for(const x of [-1.08,1.08]){
          b.box(x,.13,0,.45,.26,1.08,'#323c48');b.box(x,.20,0,.35,.24,.80,'#576571');
          for(const z of [-.45,.45])b.box(x,.12,z,.46,.10,.13,'#a8b4b8');
          b.box(x,.31,0,.27,.30,.27,ink);
        }
      }),
      rigid('fold',metal,b=>{
        for(const x of [-1.08,1.08]){b.box(x,.52,0,.19,1.02,.21,'#b9c0c2');b.box(x,.10,0,.32,.18,.26,'#697583');}
        b.box(0,.37,0,2.77,.18,.17,'#73838d');b.box(0,.88,0,3.18,.43,.23,'#273247');
        b.box(0,1.085,0,3.14,.045,.26,silver);b.box(0,.679,0,3.14,.043,.25,silver);
        for(const h of [-1.43,1.43])b.box(h,1.118,0,.18,.12,.19,ink);
      }),
      rigid('fold',reflector,b=>{
        for(const face of [-1,1]){
          const z=.118*face;
          for(const center of [-1.325,-.99,-.65,.43,.765,1.10]){
            b.face([[center-.15,.717,z],[center+.015,.717,z],[center+.255,1.043,z],[center+.09,1.043,z]],pink);
          }
          stencil(b,0,.884,z+face*.003,.047,face,white);
        }
        for(const x of [-1.43,1.43])b.box(x,1.202,0,.146,.073,.145,mint);
      })
    ];
  }
  function pylon(){
    return [
      rigid('fixed',metal,b=>{
        b.radial([[0,0],[0,.39],[.047,.42],[.12,.40],[.17,.28],[.22,.23],[.28,.19],[.74,.15],[.82,.17],[.91,.14]],
          [ink,'#344255','#4b5363',silver,'#596474','#a5536a','#e25084','#412f49','#f58291'],10);
      }),
      rigid('pylonTop',metal,b=>{
        b.radial([[-.05,.143],[.03,.15],[.28,.14],[.31,.153],[.62,.128],[.75,.115],[.83,.14],[.89,.12],[.91,0]],
          ['#9e4965','#fd6798','#364357','#f875a0','#435466','#348c98','#303d51','#596976'],10);
      }),
      rigid('pylonTop',reflector,b=>{
        b.radial([[.23,.145],[.30,.153]],()=>white,10);
        b.radial([[.64,.129],[.73,.121]],()=>mint,10);
        b.radial([[.845,.144],[.883,.131]],()=>mint,10);
      })
    ];
  }
  // Flea-market rejects have break points of their own. Each rigid subassembly
  // is instanced across the route and driven by the recorded damage value.
  function crt(){
    return [
      rigid('fixed',metal,b=>{b.box(0,.13,0,1.38,.26,.96,'#3e435a');b.box(0,.28,-.10,1.55,.13,1.01,ink);}),
      rigid('tvShell',metal,b=>{
        b.box(0,.36,0,1.56,.77,1.05,'#a7758e');b.box(0,.39,.48,1.61,.76,.16,'#cbb7a6');
        b.box(-.13,.43,.575,1.12,.53,.085,ink);
        for(let i=0;i<5;i++)b.box(.615,.21+i*.075,.571,.19,.025,.025,'#454558');
        b.box(.60,.65,.576,.18,.11,.075,'#d27073');
      }),
      rigid('tvShell',reflector,b=>{
        sheet(b,-.61,.36,.23,.64,.622,'#5aab9c');
        for(const x of [-.38,.12])sheet(b,x,x+.063,.43,.54,.625,mint);
        sheet(b,-.34,.12,.36,.39,.625,'#9dfbcb');
      }),
      rigid('tvCrack',reflector,b=>{
        b.face([[.15,.62,.633],[.02,.46,.634],[.12,.48,.634],[-.12,.29,.634],[.027,.51,.634],[-.035,.50,.634]],'#e0fbeb');
      })
    ];
  }
  function cart(){
    return [
      rigid('fixed',metal,b=>{
        for(const x of [-.43,.43])for(const z of [-.53,.47]){b.box(x,.15,z,.23,.29,.22,ink);b.box(x,.26,z,.11,.23,.12,silver);}
        b.box(0,.34,0,1.04,.11,1.44,'#70849a');for(const x of [-.43,.43])b.box(x,.43,-.22,.08,.27,.67,silver);
      }),
      rigid('cartBasket',metal,b=>{
        b.box(0,.045,0,1.11,.09,1.47,'#53677a');
        for(const x of [-.52,.52]){
          for(const y of [.20,.40,.57])b.box(x,y,0,.053,.05,1.46,silver);
          for(let k=-3;k<=3;k++)b.box(x,.30,k*.215,.052,.60,.045,'#a9bac4');
          b.box(x,.42,-.72,.065,.82,.065,silver);
        }
        for(const z of [-.69,.69]){for(const y of [.20,.39,.57])b.box(0,y,z,1.08,.05,.05,silver);}
        b.box(0,.80,-.72,1.14,.11,.12,'#fa5b96');
      })
    ];
  }
  function mailbox(){
    return [
      rigid('fixed',metal,b=>{b.box(0,.15,0,.78,.30,.82,'#746981');b.box(0,.59,0,.21,.92,.23,'#9d8290');}),
      rigid('mailBody',metal,b=>{
        b.box(0,.19,0,.77,.39,1.02,'#438f9c');b.box(0,.39,0,.68,.15,.96,'#70bcb7');
        b.box(0,.49,0,.48,.11,.94,'#8bc8c0');b.box(0,.19,.512,.63,.31,.035,ink);
        b.box(.41,.36,-.15,.055,.49,.072,'#fc6885');b.box(.41,.56,-.06,.06,.13,.22,'#fc6885');
      }),
      rigid('mailDoor',metal,b=>{b.box(0,.16,.04,.69,.32,.065,'#e9bf78');b.box(0,.24,.085,.24,.065,.035,ink);}),
      rigid('mailLetter',reflector,b=>{b.box(0,0,0,.49,.028,.33,'#f6edd6');b.box(.13,.017,-.065,.09,.009,.08,pink);})
    ];
  }
  function sofa(){
    return [
      rigid('fixed',metal,b=>{
        for(const x of [-1.00,1.00])for(const z of [-.38,.38])b.box(x,.12,z,.18,.24,.18,'#614b42');
        b.box(0,.35,0,2.43,.37,1.11,'#7c4968');for(const x of [-1.12,1.12]){
          b.box(x,.58,0,.30,.54,1.16,'#c67b93');b.box(x,.86,0,.32,.09,1.16,'#e89ba0');}
      }),
      rigid('cushion',metal,b=>{for(const x of [-.51,.51]){b.box(x,.075,.07,.97,.19,.81,'#df9a9c');b.box(x,.17,.075,.90,.035,.72,'#eeb3a6');}}),
      rigid('sofaBack',metal,b=>{b.box(0,.25,-.02,2.14,.55,.26,'#bc7890');b.box(0,.53,-.02,2.1,.07,.27,'#e69ca0');
        for(const x of [-.77,-.26,.26,.77])b.box(x,.32,.121,.080,.053,.024,'#694758');})
    ];
  }
  const make={barrels:drum,tires,barricade,pylon,crt,cart,mailbox,sofa};
  function model(kind){if(!library.has(kind))library.set(kind,make[kind]());return library.get(kind);}

  // The root follows the physical object's YXZ pose. Local transforms below
  // articulate only the damaged parts, keeping each replay pose deterministic.
  function localPose(o,part,d,side){
    o.position.set(0,0,0);o.rotation.set(0,0,0,'YXZ');o.scale.set(1,1,1);
    switch(part){
      case 'drumFoot':
        o.scale.set(1+.14*d,1-.23*d,1+.085*d);break;
      case 'drumBody':
        o.position.set(.20*d*side,.73-.22*d,.076*d);o.rotation.z=-.32*d*side;
        o.scale.set(1+.10*d,1-.58*d,1-.05*d);break;
      case 'drumLid':{
        const lift=Math.max(0,(d-.15)/.85);
        o.position.set(.40*d*side+.48*lift*side,1.566-.78*d+.10*Math.sin(lift*Math.PI),.26*lift);
        o.rotation.set(.31*lift,.67*lift*side,-.87*lift*side,'YXZ');break;
      }
      case 'rubberBase':
        o.scale.set(1+.07*d,1-.14*d,1+.08*d);break;
      case 'looseTire':
        o.position.set(.98*d*side,1.04-.34*d+.12*Math.sin(d*Math.PI),.25*d);
        o.rotation.set(.19*d,.40*d*side,-.96*d*side,'YXZ');break;
      case 'fold':
        o.position.set(.11*d*side,.279-.13*d,0);o.rotation.set(1.27*d,.09*d*side,-.15*d*side,'YXZ');break;
      case 'pylonTop':
        o.position.set(.065*d*side,.91-.14*d,0);o.rotation.set(.31*d,.10*d*side,-1.29*d*side,'YXZ');break;
      case 'tvShell':case 'tvCrack':
        o.position.set(d*side*.17,.345-.08*d,.10*d);o.rotation.z=-.42*d*side;o.scale.set(1+.09*d,1-.69*d,1);
        if(part==='tvCrack'&&d<.12)o.position.y-=3;break;
      case 'cartBasket':
        o.position.set(.52*d*side,.50-.21*d,d*.17);o.rotation.set(.45*d,d*side*.43,-.85*d*side);o.scale.y=1-.44*d;break;
      case 'mailBody':case 'mailDoor':case 'mailLetter':{
        const drop=.94-.44*d,lean=-.66*side*d;
        o.position.set(side*.37*d,drop,0);o.rotation.z=lean;
        if(part==='mailDoor'){o.position.z=.50;o.rotateX(Math.min(1,d*1.8)*1.58);}
        if(part==='mailLetter'){const t=Math.min(1,d*1.45);o.position.set(.35*d*side,drop+.16+.47*Math.sin(Math.PI*t),.10+1.13*t);o.rotateZ(.39*d);}
        break;
      }
      case 'cushion':
        o.position.set(side*.43*d,.54-.14*d,.36*d);o.rotation.z=.28*d*side;break;
      case 'sofaBack':
        o.position.set(0,.56-.21*d,-.47);o.rotation.x=-1.26*d;break;
    }
    o.updateMatrix();
  }

  // The painted road sits above the terrain sheet. Match its crown or the
  // exposed ground and align spilled coolant to the local slope just once.
  function spillSite(course,item,yaw){
    const x=item.baseX,z=item.baseZ;
    if(!course?.ground||!course.nearest)return {x,z,baseY:item.baseY,yaw,y:item.baseY+.018,pitch:0,roll:0};
    const near=course.nearest(x,z),k=Math.min(1,near.distance/(course.width*.5));
    const onRoad=near.distance<=course.width*.5,h=onRoad?course.ground:(course.base||course.ground);
    const cx=Math.cos(yaw),sz=Math.sin(yaw);
    const uphillX=(h(x+cx,z-sz)-h(x-cx,z+sz))*.5;
    const uphillZ=(h(x+sz,z+cx)-h(x-sz,z-cx))*.5;
    return {x,z,baseY:item.baseY,yaw,y:h(x,z)+(onRoad ? .197-.06*k*k : -.205),pitch:-Math.atan(uphillZ),roll:Math.atan(uphillX)};
  }
  const fields=['x','y','z','yaw','tiltX','tiltZ','damage','baseX','baseY','baseZ','baseYaw'];
  function attach(world,course,initial){
    const root=new T.Group(),body=new T.Object3D(),joint=new T.Object3D(),matrix=new T.Matrix4();
    root.name='Displaceable course objects';world.add(root);let rows=[],batches=[];
    function layout(items){
      for(const group of batches)for(const part of group.parts){root.remove(part.mesh);part.mesh.dispose();}
      rows=[];batches=[];const groups=new Map();
      items.forEach((item,index)=>{
        let group=groups.get(item.kind);
        if(!group){group={kind:item.kind,count:0,parts:[]};groups.set(item.kind,group);batches.push(group);}
        rows[index]={group,slot:group.count++,last:new Float64Array(fields.length).fill(NaN)};
      });
      for(const group of batches)for(const part of model(group.kind)){
        const mesh=new T.InstancedMesh(part.geometry,part.material,group.count);
        mesh.name=group.kind+' '+part.pose;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
        // Each item can leave its original cell. The software rasterizer still
        // tests each instance's own bounding sphere after its current transform.
        mesh.frustumCulled=false;mesh.castShadow=part.material===metal;mesh.receiveShadow=part.material===metal;
        root.add(mesh);group.parts.push({mesh,pose:part.pose});
      }
    }
    function update(items){
      items=items||[];
      if(rows.length!==items.length||items.some((item,i)=>rows[i].group.kind!==item.kind))layout(items);
      const changed=new Set();
      for(let i=0;i<items.length;i++){
        const item=items[i],r=rows[i];
        if(!fields.some((f,k)=>r.last[k]!==item[f]))continue;
        for(let k=0;k<fields.length;k++)r.last[k]=item[fields[k]];
        const d=Math.min(1,Math.max(0,item.damage)),side=Math.sin(item.baseX*1.37+item.baseZ*.73)>=0?1:-1;
        body.position.set(item.x,item.y,item.z);body.rotation.set(item.tiltX,item.yaw,item.tiltZ,'YXZ');body.updateMatrix();
        for(const part of r.group.parts){
          if(part.pose==='spill'){
            // Liquid is left where the drum first stood. Move tiny hidden decals
            // beneath the terrain, avoiding zero-scale normal matrices.
            const wet=Math.max(0,(d-.2)/.8),k=Math.max(.001,Math.sqrt(wet));
            const yaw=item.baseYaw+(side<0?Math.PI:0);
            if(!r.site||r.site.x!==item.baseX||r.site.z!==item.baseZ||r.site.baseY!==item.baseY||r.site.yaw!==yaw)r.site=spillSite(course,item,yaw);
            joint.position.set(item.baseX,r.site.y+(wet?0:-2),item.baseZ);
            joint.rotation.set(r.site.pitch,yaw,r.site.roll,'YXZ');joint.scale.set(k,1,k);joint.updateMatrix();
            matrix.copy(joint.matrix);
          }else{localPose(joint,part.pose,d,side);matrix.multiplyMatrices(body.matrix,joint.matrix);}
          part.mesh.setMatrixAt(r.slot,matrix);
        }
        changed.add(r.group);
      }
      for(const group of changed)for(const part of group.parts)part.mesh.instanceMatrix.needsUpdate=true;
    }
    update(initial);return {update};
  }
  // Flat-camera silhouettes share the same deformation curve as the joints.
  function drawLoose(ctx,kind,d){
    const rect=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
    if(kind==='crt'){
      rect(-.69,0,1.38,.26,'#646378');ctx.translate(.16*d,.31);ctx.rotate(-.4*d);ctx.scale(1+.09*d,1-.69*d);
      rect(-.78,0,1.56,.78,'#cbb7a6');rect(-.67,.13,1.10,.55,ink);rect(-.60,.21,.95,.38,'#63b8a6');
      rect(-.45,.41,.08,.11,mint);rect(.13,.41,.08,.11,mint);rect(-.38,.31,.49,.04,mint);rect(.52,.55,.15,.11,pink);
      if(d>.12){ctx.strokeStyle=white;ctx.lineWidth=.04;ctx.beginPath();ctx.moveTo(.13,.59);ctx.lineTo(-.01,.43);ctx.lineTo(.09,.43);ctx.lineTo(-.17,.25);ctx.stroke();}
    }else if(kind==='cart'){
      for(const x of [-.48,.40])rect(x,.01,.21,.29,ink);rect(-.62,.31,1.40,.08,silver);
      ctx.translate(.40*d,.47-.20*d);ctx.rotate(-.62*d);ctx.scale(1,1-.44*d);
      for(const y of [.03,.22,.41,.60])rect(-.66,y,1.40,.035,silver);for(let i=0;i<7;i++)rect(-.65+i*.22,0,.035,.62,silver);
      rect(-.70,.50,.06,.32,silver);rect(-.79,.79,.28,.07,pink);
    }else if(kind==='mailbox'){
      rect(-.33,0,.66,.21,'#795f7b');rect(-.11,.20,.22,.80,'#b99a92');
      ctx.translate(.25*d,.95-.40*d);ctx.rotate(-.63*d);rect(-.42,0,.85,.40,'#58a8a8');rect(-.30,.39,.62,.12,'#86cbc3');
      rect(-.33,.04,.63,.31,ink);ctx.save();ctx.translate(-.32,.04);ctx.rotate(-1.48*d);rect(0,0,.62,.25,'#e9bf78');ctx.restore();
      rect(.39,.20,.06,.38,pink);rect(.41,.49,.17,.09,pink);if(d>.12)rect(-.22+.65*d,.16+.18*Math.sin(d*Math.PI),.44,.057,white);
    }else if(kind==='sofa'){
      for(const x of [-1.03,.87])rect(x,.02,.17,.22,'#614b42');rect(-1.19,.23,2.38,.34,'#824c69');
      rect(-1.05,.73-.29*d,2.10,.38*(1-.60*d),'#bc7890');
      for(const x of [-.98,.02])rect(x+.37*d,.52-.11*d,.94,.18,'#efad9f');
      for(const x of [-1.27,.99])rect(x,.44,.27,.43,'#d993a1');
    }else return false;
    return true;
  }
  return {attach,drawLoose};
})();

export {MTMProps};
