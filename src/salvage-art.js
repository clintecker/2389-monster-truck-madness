/* Stock from the 2389 salvage auction. The small-format exhibits batch into the
   circuit's static scenery. Canvas shares the meshes and four paint/pose variants. */
const MTMSalvageArt=(()=>{
  const T=THREE,pi=Math.PI,tau=2*pi,cache=new Map();
  const navy='#20293b',coal='#32394a',iron='#5d7082',galv='#91a5ac',bone='#eee5c6';
  const rust='#af6549',umber='#835545',clay='#d3845b',amber='#ffc45a',brass='#d0a059';
  const spruce='#355b59',fern='#7a9b6e',lime='#b9ec71',aqua='#68f6df',ice='#a6edfa';
  const plum='#6e5277',purple='#ab88dc',rose='#fa6f9e',red='#cb535f',white='#f7eecf';
  const finishes=[aqua,rose,amber,purple],shells=['#768a83','#9a777d','#af905d','#847a95'];
  const flat=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]];
  const outlines={
    flat,triangle:[[-.5,-.5],[.5,-.5],[0,.5]],
    cabinet:[[-.49,-.50],[.45,-.50],[.5,.40],[.39,.50],[-.40,.50],[-.5,.41]],
    iceBite:[[-.45,-.50],[.45,-.50],[.50,-.40],[.50,.18],[.40,.17],[.31,.25],[.32,.34],[.23,.32],[.13,.39],[.11,.49],[-.25,.50],[-.43,.43],[-.5,.26],[-.50,-.36]],
    screen:[[-.43,-.50],[.40,-.50],[.50,-.33],[.50,.28],[.40,.47],[-.29,.50],[-.48,.33],[-.50,-.30]],
    shelf:[[-.48,-.50],[.28,-.50],[.49,-.08],[.32,.33],[-.24,.50],[-.50,.25]],
    boot:[[-.5,-.48],[.37,-.48],[.50,-.32],[.44,-.04],[.05,.01],[-.04,.48],[-.40,.50],[-.36,-.06]],
    tub:[[-.5,.45],[-.40,-.16],[-.25,-.46],[.24,-.5],[.39,-.30],[.50,.5],[.28,.39],[-.28,.32]],
    pot:[[-.5,.35],[-.4,-.22],[-.18,-.49],[.20,-.50],[.43,-.20],[.50,.39],[.27,.5],[-.27,.5]],
    wing:[[-.47,-.30],[-.44,.04],[-.05,.22],[.5,.5],[.28,.04],[.10,-.32],[-.34,-.48]],
    hood:[[-.5,-.47],[.50,-.47],[.46,-.08],[.27,.40],[-.17,.50],[-.45,.16]],
    fin:[[-.5,-.5],[.40,-.45],[.50,.5],[-.08,.34],[-.33,.13]],
    chop:[[-.50,-.40],[-.08,-.50],[.50,-.32],[.47,.20],[.05,.5],[-.36,.30],[-.5,.10]],
    blade:[[-.5,-.01],[-.26,-.40],[.20,-.50],[.50,-.32],[.29,.22],[-.17,.50],[-.44,.35]],
    bolt:[[-.02,.50],[.50,.50],[.16,.09],[.44,.10],[-.28,-.50],[-.12,-.05],[-.5,-.05]],
    note:[[-.47,-.50],[.5,-.50],[.5,.25],[.15,.50],[-.5,.50]],
    heart:[[-.49,.12],[-.43,.39],[-.20,.50],[0,.30],[.19,.50],[.42,.40],[.5,.15],[.35,-.16],[0,-.5],[-.32,-.19]],
    ear:[[-.46,-.50],[.35,-.36],[.50,.16],[.31,.50],[-.05,.45],[-.36,.14]],
    flame:[[-.49,-.40],[-.45,.14],[-.17,-.01],[-.04,.50],[.13,.16],[.43,.39],[.5,-.32],[.21,-.5]],
    key:[[-.48,-.36],[-.27,-.50],[.10,-.45],[.26,-.23],[.48,-.22],[.50,.05],[.31,.06],[.32,.24],[.09,.27],[.02,.49],[-.25,.50],[-.49,.28]],
    finger:[[-.39,-.46],[.24,-.5],[.38,-.26],[.45,-.09],[.33,.04],[.18,.05],[.18,.43],[.09,.5],[-.04,.47],[-.08,.09],[-.29,.15],[-.43,.03],[-.48,-.20]],
    leaf:[[-.5,-.43],[-.39,.17],[-.12,.39],[.5,.50],[.34,-.06],[.10,-.33]],
    pin:[[-.16,-.50],[.16,-.5],[.31,-.29],[.32,-.10],[.15,.15],[.12,.30],[.20,.40],[.15,.48],[-.10,.50],[-.19,.40],[-.13,.29],[-.14,.14],[-.31,-.09],[-.30,-.31]],
    car:[[-.50,-.42],[.50,-.42],[.48,.04],[.32,.12],[.18,.45],[-.15,.50],[-.31,.14],[-.49,.08]],
    seat:[[-.5,-.42],[.34,-.46],[.50,-.03],[.40,.5],[.15,.44],[.19,-.1],[-.46,-.10]],
    ghost:[[-.50,-.42],[-.30,-.28],[-.10,-.5],[.10,-.30],[.30,-.46],[.50,-.25],[.47,.19],[.29,.41],[.05,.50],[-.20,.43],[-.42,.25]],
    tape:[[-.50,-.3],[-.38,-.50],[.4,-.48],[.5,-.25],[.5,.37],[.38,.50],[-.42,.5],[-.50,.35]]
  };
  const normalizedCircle=n=>Array.from({length:n},(_,i)=>[.5*Math.cos(tau*i/n+.5*pi),.5*Math.sin(tau*i/n+.5*pi)]);
  outlines.round=normalizedCircle(9);outlines.round12=normalizedCircle(12);outlines.hex=normalizedCircle(6);
  function cached(key,make){if(!cache.has(key))cache.set(key,make());return cache.get(key);}
  // Each outlined piece has a real front, back and edge. A printed symbol uses
  // the same outline flattened to its face, saving the hidden side triangles.
  function profile(key,faceOnly=false){
    return cached('profile/'+key+'/'+faceOnly,()=>{
      const loop=outlines[key].map(p=>new T.Vector2(...p));
      if(T.ShapeUtils.isClockWise(loop))loop.reverse();
      const faces=T.ShapeUtils.triangulateShape(loop,[]),arr=[];
      const point=(i,z)=>arr.push(loop[i].x,loop[i].y,z);
      for(const [a,b,c] of faces){point(a,faceOnly?0:.5);point(b,faceOnly?0:.5);point(c,faceOnly?0:.5);}
      if(!faceOnly){
        for(const [a,b,c] of faces){point(c,-.5);point(b,-.5);point(a,-.5);}
        for(let i=0;i<loop.length;i++){
          const j=(i+1)%loop.length;
          point(i,-.5);point(j,-.5);point(j,.5);point(i,-.5);point(j,.5);point(i,.5);
        }
      }
      const mesh=new T.BufferGeometry();mesh.setAttribute('position',new T.Float32BufferAttribute(arr,3));mesh.computeVertexNormals();return mesh;
    });
  }
  function ringMesh(n){
    return cached('ring/'+n,()=>{
      const xyz=[],rim=.34,add=(r,i,z)=>xyz.push(r*Math.cos(tau*i/n),r*Math.sin(tau*i/n),z);
      for(let i=0;i<n;i++){const j=i+1;
        for(const p of [[[.5,i,.5],[.5,j,.5],[rim,j,.5]],[[.5,i,.5],[rim,j,.5],[rim,i,.5]],
                        [[.5,i,-.5],[.5,j,-.5],[.5,j,.5]],[[.5,i,-.5],[.5,j,.5],[.5,i,.5]],
                        [[rim,i,.5],[rim,j,.5],[rim,j,-.5]],[[rim,i,.5],[rim,j,-.5],[rim,i,-.5]]])for(const v of p)add(...v);
      }
      const mesh=new T.BufferGeometry();mesh.setAttribute('position',new T.Float32BufferAttribute(xyz,3));mesh.computeVertexNormals();return mesh;
    });
  }
  function slab(b,x,y,z,w,h,d,color,roll=0,glow=false,turn=0){b.box([x,y,z],[w,h,d],color,[0,turn,roll],glow);}
  function cut(b,key,x,y,z,w,h,d,color,roll=0,glow=false,turn=0){b.add(profile(key),[x,y,z],[w,h,d],[0,turn,roll],color,glow);}
  function print(b,key,x,y,z,w,h,color,roll=0,glow=false){b.add(profile(key,true),[x,y,z],[w,h,1],[0,0,roll],color,glow);}
  function bulb(b,x,y,z,w,h,d,color,roll=0,glow=false){
    b.add(cached('bulb',()=>new T.SphereGeometry(.5,7,3)),[x,y,z],[w,h,d],[0,0,roll],color,glow);
  }
  function disc(b,x,y,z,diam,depth,color,n=8,glow=false){
    b.add(cached('disc/'+n,()=>new T.CylinderGeometry(.5,.5,1,n)),[x,y,z],[diam,depth,diam],[pi/2,0,0],color,glow);
  }
  function wreath(b,x,y,z,w,h,depth,color,roll=0,n=8,glow=false){b.add(ringMesh(n),[x,y,z],[w,h,depth],[0,0,roll],color,glow);}
  function band(b,p,q,r,shade,taper=1,n=4,glow=false){
    const a=new T.Vector3(...p),delta=new T.Vector3(...q).sub(a),len=delta.length();
    if(!len)return;
    const geom=cached('open/'+n+'/'+taper,()=>new T.CylinderGeometry(taper,1,1,n,1,true));
    const rot=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.multiplyScalar(1/len));
    b.add(geom,[(p[0]+q[0])/2,(p[1]+q[1])/2,(p[2]+q[2])/2],[r,len,r],rot,shade,glow);
  }
  function cable(b,pts,r,color,glow=false){for(let i=1;i<pts.length;i++)band(b,pts[i-1],pts[i],r,color,1,4,glow);}
  function foot(b,x,y,z,w,h,d,color=iron){slab(b,x,y,z,w,h,d,color);}
  function wheels(b,x,y,z,sep,r){for(const side of [-1,1]){disc(b,x+side*sep,y,z,r*2,.39,coal,7);print(b,'hex',x+side*sep,y,z+.202,r*.85,r*.85,galv);}}
  function wheel(b,x,y,z,w,face){disc(b,x,y,z,w,.38,coal,8);print(b,'round',x,y,z+.20,w*.54,w*.54,face);}
  function finish(v){return finishes[v];}

  // Ivan's dispenser has slipped off its feet. The snacks stay level, and one
  // dark slot glows with the outline of a loose bolt.
  function snack(b,v){
    slab(b,0,.14,0,2.48,.28,1.72,umber);cut(b,'cabinet',.02,1.79,0,2.15,3.28,1.35,shells[v],-.085);
    cut(b,'screen',-.26,1.99,.69,1.27,1.81,.09,navy,-.085);
    for(let row=0;row<2;row++)for(let col=0;col<3;col++)
      print(b,col===1?'hex':'note',-.68+col*.36,1.63+row*.63,.747,.21+.03*row,.33,[amber,rose,aqua][(col+row+v)%3],(col-1)*.08,true);
    print(b,'flat',.67,2.38,.685,.28,.64,coal,-.085);print(b,'flat',.67,2.51,.699,.16,.13,finish(v),-.085,true);
    slab(b,-.16,.65,.73,1.38,.32,.20,navy,-.085);print(b,'bolt',-.51,.65,.838,.22,.22,amber,0,true);
    slab(b,.15,3.21,.71,1.85,.16,.15,finish(v),-.085,true);
  }
  function crt(b,v){
    slab(b,0,.12,0,3.70,.24,1.66,umber);
    for(const [i,x,y,z,rot] of [[0,-.86,.79,.12,.06],[1,.84,.78,-.04,-.04],[2,.05,2.05,-.03,-.13]]){
      cut(b,'hood',x,y,z,1.74,1.33,1.27,[iron,plum,'#768477'][i],rot);
      print(b,'screen',x-.10,y+.02,z+.65,1.16,.85,[aqua,rose,lime][(v+i)%3],rot,true);
      if(i===0){
        for(const offset of [-.31,.07])print(b,'flat',x+offset,y+.13,z+.657,.12,.20,navy,rot);
        print(b,'flat',x-.10,y-.13,z+.66,.40,.07,navy,rot);
      }else if(i===1){
        for(const [u,w,a] of [[-.38,.31,.06],[-.13,.27,1.13],[.06,.29,-.92],[.27,.22,.06]])
          print(b,'flat',x+u,y+.04,z+.657,w,.075,navy,a);
      }else{
        print(b,'round',x-.09,y+.03,z+.655,.59,.53,bone,rot);
        print(b,'round',x-.01,y+.03,z+.660,.29,.31,navy,rot);
      }
      print(b,'hex',x+.65,y-.14,z+.653,.14,.14,amber);
    }
    cable(b,[[-.80,3.40,-.28],[-.32,2.64,-.22],[.46,3.44,-.24]],.043,galv);
  }
  function meter(b,v){
    slab(b,-.14,.13,0,1.97,.24,1.19,iron);band(b,[-.28,.19,0],[-.28,2.54,0],.18,galv,1,7);
    cut(b,'screen',-.23,2.82,0,1.14,1.17,.69,shells[v],-.06);
    print(b,'screen',-.24,3.03,.357,.83,.49,navy,-.06);print(b,'flat',-.19,3.02,.362,.47,.13,rose,-.06,true);
    cut(b,'boot',.20,.69,.12,1.98,1.16,1.05,amber,-.14);
    slab(b,.10,.22,.13,1.75,.17,1.04,coal,-.09);print(b,'flat',-.21,.93,.658,.50,.19,navy,-.11);
    print(b,'hex',-.24,.92,.667,.22,.19,bone);slab(b,.30,2.64,.43,.36,.15,.18,coal,-.15);
  }
  function tape(b,v){
    wheels(b,0,.36,.40,1.58,.32);slab(b,0,.64,0,4.06,.22,1.29,rust);
    cut(b,'tape',0,1.67,0,3.36,1.89,1.05,shells[v],.07);
    print(b,'tape',0,1.87,.537,2.79,1.05,bone,.07);
    for(const x of [-.77,.77]){disc(b,x,1.90+.06*x,.56,.59,.10,coal,7);print(b,'hex',x,1.90+.06*x,.617,.27,.27,amber);}
    print(b,'flat',-.02,1.87,.552,.55,.22,finish(v),.07,true);
    cable(b,[[1.40,.95,.29],[2.28,.67,.65],[2.49,1.29,.70],[2.03,1.67,.66],[1.72,1.42,.65]],.062,navy);
    band(b,[-2.04,.61,-.20],[-2.55,.91,-.10],.062,iron);
  }
  function baggage(b,v){
    slab(b,.05,.11,0,3.30,.22,2.02,iron);band(b,[-1.2,.15,-.33],[-.80,2.57,-.30],.10,galv);
    band(b,[-.80,2.57,-.30],[.12,3.20,-.30],.11,galv);
    band(b,[.10,3.03,0],[.10,3.28,0],1.46,iron,.81,9);bulb(b,.10,3.24,0,1.54,.83,1.15,aqua,0,true);
    for(const x of [-1,0,1])print(b,'round',.09+x*.71,3.07,1.15-x*x*.30,.17,.15,amber,0,true);
    band(b,[.08,1.42,-.02],[.12,2.98,-.02],.058,ice,1,4,true);
    cut(b,'cabinet',.08,.96,.08,1.80,1.15,.84,clay,-.16);slab(b,.03,1.55,.10,.55,.15,.30,coal,-.16);
    for(const x of [-.46,.55])print(b,'flat',x,.96+x*.16,.512,.12,.86,bone,-.16);
    print(b,'triangle',.14,1.00,.515,.35,.32,finish(v),.28,true);
  }
  function patch(b,v){
    slab(b,-.43,.14,0,2.83,.27,1.52,iron);cut(b,'cabinet',-.46,1.23,-.10,2.45,2.04,1.35,navy,.03);
    for(const [i,y] of [[0,1],[1,1.67]]){
      slab(b,-.44,y,.60,2.14,.38,.09,i?shells[v]:galv);
      for(const x of [-1.22,-.64,-.06,.40])print(b,'round',x,y,.653,.19,.19,i?aqua:rose,0,true);
    }
    cable(b,[[-1.22,1.67,.73],[-1.38,1.18,.88],[-.98,.9,.91],[-.64,1,.75]],.069,brass);
    cable(b,[[.40,1.66,.72],[1.22,1.36,.87],[1.55,.47,.90],[1.97,.35,.75],[2.15,.83,.62]],.09,finish(v));
    slab(b,2.16,.93,.63,.36,.48,.46,coal,-.20);band(b,[2.10,1.12,.62],[2.05,1.43,.63],.07,bone);
  }
  // Desert salvage: every piece is braced, repaired, or caught mid-subsidence.
  function bath(b,v){
    for(const x of [-1.21,1.12]){
      foot(b,x,.11,0,.83,.22,1.12);
      cable(b,[[x-.24,.20,.13],[x+.24,.37,.18],[x-.24,.55,.12],[x+.24,.72,.18],[x-.21,.91,.14]],.085,brass);
    }
    cut(b,'tub',0,1.51,0,3.85,1.47,1.73,bone,.035);
    slab(b,0,2.16,-.03,3.85,.18,1.81,galv,.035);
    slab(b,0,2.23,.00,3.53,.10,1.45,navy,.035);
    slab(b,.10,2.29,.02,3.13,.05,1.20,[aqua,rose,lime,ice][v],.035,true);
    cable(b,[[-1.54,1.99,-.53],[-1.54,2.84,-.56],[-1.23,3.04,-.56],[-.94,2.97,-.54],[-.91,2.71,-.48]],.10,iron);
    print(b,'heart',-.44,1.53,.873,.44,.39,rust,-.17);
  }
  function postoffice(b,v){
    slab(b,0,.10,0,3.63,.20,1.50,umber);
    for(const [i,x,y,roll] of [[0,-1.23,1.45,-.13],[1,.08,2.23,.08],[2,1.24,1.49,-.15]]){
      band(b,[x-.20,.17,-.20],[x,y,-.12],.14,clay,.88,5);
      cut(b,'hood',x,y+.29,.10,1.18,.85,1.38,[rust,navy,shells[v]][i],roll);
      print(b,'screen',x,y+.30,.802,.92,.64,i===1?rose:bone,roll);
      print(b,'flat',x,y+.39,.807,.62,.10,navy,roll);
      band(b,[x+.53,y+.40,-.09],[x+.49,y+.93,-.11],.052,galv);
      print(b,'flat',x+.62,y+.91,-.08,.28,.17,red,0,true);
    }
    print(b,'note',.05,2.46,.814,.53,.33,amber,-.19);
  }
  function iceFossil(b,v){
    cut(b,'chop',-.64,.52,.03,2.81,1.03,1.65,umber,-.08);cut(b,'chop',.84,.33,.11,1.86,.70,1.34,clay,.07);
    slab(b,-.08,1.34,0,.45,1.77,.36,brass,.12);
    cut(b,'iceBite',-.24,3.22,0,1.97,2.75,.84,[rose,aqua,amber,purple][v],.12);
    print(b,'flat',-.60,3.39,.428,.16,1.68,bone,.12);print(b,'flat',-.27,3.43,.430,.11,1.80,bone,.12);
    // Two tiny exposed inclusions sit beneath the big bite in the side profile.
    print(b,'hex',.31,3.87,.427,.13,.10,bone,.12);
    print(b,'hex',.43,3.72,.427,.08,.07,bone,-.16);
    cut(b,'fin',.19,1.17,.44,.59,1.00,.39,rust,-.28);
  }
  function radiator(b,v){
    slab(b,0,.18,0,2.94,.34,1.42,coal);cut(b,'cabinet',-.22,1.52,-.12,2.36,2.86,.80,shells[v],-.04);
    print(b,'cabinet',-.23,1.53,.30,1.93,2.25,navy,-.04);
    for(let i=0;i<5;i++)print(b,'flat',-.22, .85+i*.34,.313,1.80,.07,galv,-.04);
    wreath(b,-.24,1.64,.47,1.68,1.68,.16,iron);
    for(let i=0;i<3;i++){const a=tau*i/3+v*.23;print(b,'blade',-.24+.36*Math.cos(a),1.64+.36*Math.sin(a),.57,.70,.44,amber,a,true);}
    print(b,'hex',-.24,1.64,.60,.29,.29,bone);
    cable(b,[[.81,1.03,.1],[1.46,1.02,.15],[1.64,2.19,.11],[1.49,3.12,.12]],.14,rust);
    cut(b,'pot',1.48,3.13,.13,.46,.34,.45,clay);
  }
  function weatherbone(b,v){
    cut(b,'chop',-.18,.43,0,2.87,.82,1.61,rust,.05);
    band(b,[0,.53,0],[.05,3.42,.02],.15,galv,.80,6);
    cable(b,[[-1.94,2.95,0],[-1.17,3.33,0],[-.25,3.38,0],[.45,3.26,0],[1.33,3.44,0]],.13,bone);
    for(const x of [-1.13,-.59,-.05,.48]){
      cable(b,[[x,3.35,.01],[x-.10,2.99,.28],[x+.08,2.49,.32],[x+.32,2.32,.14]],.075,brass);
    }
    cut(b,'chop',1.41,3.44,0,1.12,.65,.64,bone,.17);
    print(b,'hex',1.54,3.56,.331,.20,.19,finish(v),0,true);
    cut(b,'fin',-1.81,3.18,0,.83,.73,.15,shells[v],.16);
    print(b,'triangle',1.13,3.11,.22,.16,.24,bone,pi);print(b,'triangle',1.47,3.10,.22,.14,.22,bone,pi);
  }
  function sunglasses(b,v){
    const lens=[aqua,rose,amber,purple][v];
    for(const side of [-1,1]){
      band(b,[side*1.37,.20,-.18],[side*1.46,1.82,-.17],.13,rust);
      foot(b,side*1.37,.11,-.10,.91,.21,1.22);
      cut(b,'screen',side*1.07,2.14,0,2.12,1.44,.35,red,side*.06);
      cut(b,'screen',side*1.07,2.12,.17,1.75,1.10,.09,navy,side*.06);
      print(b,'flat',side*1.07-.20,2.20,.222,.13,.64,lens,-.59,true);
      band(b,[side*2.00,2.40,-.09],[side*1.96,2.11,-1.32],.13,plum);
    }
    cable(b,[[-.30,2.28,.09],[0,2.48,.10],[.30,2.28,.09]],.126,red);
  }
  function jackalope(b,v){
    cut(b,'chop',-.23,.37,.05,2.60,.75,1.38,rust);
    bulb(b,-.13,1.22,0,1.60,1.57,1.03,galv,.30);
    bulb(b,.48,1.95,.03,1.18,1.01,1.04,bone);
    cut(b,'ear',-.11,2.66,0,.61,1.29,.22,galv,.32);
    cut(b,'ear',.47,2.76,0,.52,1.34,.26,iron,-.09);
    print(b,'ear',-.10,2.66,.117,.31,.77,finish(v),.32,true);
    print(b,'round',.68,2.11,.525,.20,.20,navy);print(b,'hex',1.07,1.90,.32,.17,.14,rose);
    for(const side of [-1,1]){
      cable(b,[[.40,2.31,-.15],[.48+side*.49,3.06,-.23],[.50+side*.73,3.81,-.28]],.066,brass);
      band(b,[.48+side*.48,3.05,-.23],[.48+side*.94,3.32,-.17],.066,brass,.65);
    }
    cut(b,'shelf',-.72,.93,.37,.94,.78,.46,iron,.16);
    slab(b,-.46,.56,.52,1.11,.19,.48,bone,-.10);
  }
  function toll(b,v){
    slab(b,0,.16,0,2.30,.32,1.42,iron);
    cut(b,'cabinet',-.33,1.34,-.10,1.75,2.34,1.02,shells[v],.055);
    print(b,'screen',-.38,1.69,.421,1.11,.70,navy,.055);
    print(b,'round',-.38,1.69,.428,.48,.48,amber,0,true);print(b,'flat',-.38,1.69,.437,.11,.31,white);
    // A tollbooth crank, lever and pennant announce a manually metered mirage.
    wreath(b,.38,1.02,.52,.82,.82,.15,rust);print(b,'hex',.39,1.02,.61,.19,.19,bone);
    cable(b,[[.60,1.28,.58],[.90,1.52,.64],[.92,1.72,.71]],.08,brass);
    band(b,[-.92,2.21,-.21],[-.94,3.36,-.18],.065,iron);cut(b,'fin',-.57,3.13,-.17,.72,.55,.10,finish(v),-1.38);
    print(b,'flat',-.54,.72,.42,.70,.09,bone,.055);
  }
  // The feedback woods use damp enamel, copper, and outdoor lab equipment.
  function bouquet(b,v){
    cut(b,'pot',0,.63,0,1.73,1.29,1.32,shells[v]);slab(b,0,1.20,0,1.85,.20,1.37,brass);
    for(const [i,x,y,roll] of [[0,-1.05,3.11,.27],[1,.16,4.03,-.09],[2,1.07,3.43,-.24]]){
      band(b,[0,1.20,0],[x,y,-.05],.077,galv,.72,5);
      const len=[1.43,1.87,1.27][i];
      band(b,[x-.5*len,y-roll,-.02],[x+.5*len,y+roll,-.02],.059,iron,1,4);
      for(let j=0;j<3;j++){
        const s=(j-1)*len*.33,m=x+s,k=y+roll*(j-1)*.62;
        band(b,[m-.14,k-.34,-.03],[m+.14,k+.35,-.03],.041,j===1?finish(v):bone,1,4,j===1);
      }
    }
  }
  function kettle(b,v){
    slab(b,0,.14,0,3,.26,1.63,umber);
    bulb(b,-.05,1.05,0,2.27,1.69,1.66,clay);
    cut(b,'hood',-.06,1.84,0,1.60,.48,1.10,brass);
    wreath(b,-.22,2.22,-.04,1.71,1.99,.25,iron,.05);
    cable(b,[[.66,1.06,.05],[1.20,1.26,.04],[1.49,1.89,.08],[1.76,2.12,.06]],.25,rust);
    cut(b,'wing',1.73,2.15,.01,.67,.37,.47,bone,.11);
    band(b,[-.05,2.04,-.03],[-.05,3.66,-.04],.058,galv,1,5);
    for(const [x,y] of [[.00,3.43],[-.10,3.10]])band(b,[x-.29,y-.07,-.05],[x+.29,y+.07,-.05],.048,finish(v),1,4,true);
    print(b,'bolt',-.10,1.09,.846,.55,.69,bone,.02);
  }
  function scream(b,v){
    slab(b,0,.16,0,2.16,.31,1.51,iron);
    for(const x of [-.83,.83])slab(b,x,1.72,-.19,.19,3.17,1.08,shells[v]);
    slab(b,0,3.11,-.13,2.09,.39,1.42,shells[v]);slab(b,0,1.60,-.66,1.52,2.52,.13,spruce);
    print(b,'flat',0,3.10,.587,1.58,.18,finish(v),0,true);
    cut(b,'screen',-.19,1.81,-.34,1.02,1.50,.29,navy);print(b,'flat',-.21,2.08,-.18,.58,.22,ice,0,true);
    cable(b,[[-.59,2.27,.18],[-.76,2.13,.27],[-.72,1.70,.33],[-.52,1.54,.30]],.12,rose);
    cable(b,[[-.60,1.64,.20],[-.48,.78,.30],[.05,.72,.26],[.22,1.41,.05]],.052,brass);
    band(b,[.35,3.20,-.16],[1.17,3.80,.44],.14,galv,3.75,8);
    const mouth=new T.Vector3(.82,.60,.60).normalize(),face=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),mouth);
    b.add(profile('round',true),[1.176,3.806,.446],[1.01,1.01,1],face,amber,true);
    b.add(profile('round',true),[1.181,3.812,.453],[.71,.71,1],face,coal);
    bulb(b,1.23,3.84,.49,.25,.27,.25,rose);
  }
  function clocks(b,v){
    cut(b,'chop',.09,.32,0,3.21,.61,1.30,spruce);
    for(const [i,x,h,diam,roll] of [[0,-1.08,1.80,.98,.15],[1,.03,3.06,1.29,-.09],[2,1.02,2.29,.92,.19]]){
      band(b,[x*.50,.33,-.05],[x,h,-.04],.09,umber,1,5);
      disc(b,x,h,.01,diam,.33,[brass,iron,shells[v]][i],9);
      print(b,'round',x,h,.185,diam*.80,diam*.80,bone);
      for(const a of [i*.97+v*.23+roll,2.22+i*.37])print(b,'flat',x-.09*Math.sin(a),h+.09*Math.cos(a),.193,.068,diam*.45,navy,a);
      print(b,'hex',x,h,.201,.12,.11,rose,0,true);
    }
  }
  function cheeseRack(b,v){
    slab(b,-.21,.12,.01,2.86,.24,1.49,umber);
    cut(b,'cabinet',-.43,1.61,-.12,2.12,3.02,1.24,iron,.03);
    for(const [i,y] of [[0,.88],[1,1.72],[2,2.52]]){
      const x=-.44+.10*i,z=i===1?.63:.42;
      slab(b,x,y,z,1.83,.65,.39,[spruce,brass,shells[v]][i],i===1?-.06:.03);
      if(i!==1){slab(b,x,y+.02,z+.22,.48,.12,.12,bone,.03);print(b,'flat',x-.58,y+.02,z+.205,.21,.22,finish(v),.03,true);}
      else {
        cut(b,'triangle',-.19,2.01,z+.17,1.18,.59,.39,amber,-.06);
        for(const [px,py,r] of [[-.38,2.00,.16],[-.10,2.10,.13],[.06,1.88,.18]])print(b,'round',px,py,z+.38,r,r,umber);
      }
    }
    cable(b,[[.35,.53,.87],[.91,.31,.92],[1.31,.43,.86],[1.56,.35,.70]],.061,rose);
    bulb(b,1.65,.34,.63,.48,.28,.53,bone);
  }
  function tripod(b,v){
    for(const [x,z] of [[-1.18,.52],[1.18,.45],[.12,-.99]]){
      foot(b,x,.12,z,.53,.22,.54);
      band(b,[x,.22,z],[x*.68,1.42,z*.69],.115,galv,.78,5);
      band(b,[x*.68,1.42,z*.69],[0,2.47,0],.14,iron,.66,5);
      bulb(b,x*.68,1.42,z*.69,.26,.23,.23,brass);
    }
    cut(b,'hood',.08,2.80,-.09,1.55,.96,.98,shells[v],.08);
    disc(b,.32,2.81,.50,.76,.26,coal,8);print(b,'round',.32,2.82,.64,.55,.55,finish(v),0,true);
    print(b,'flat',.34,2.83,.648,.14,.43,navy);band(b,[-.48,3.08,-.22],[-.83,3.77,-.24],.056,brass);
    print(b,'hex',-.84,3.76,-.19,.17,.17,amber,0,true);
  }
  function shoeTree(b,v){
    cut(b,'chop',.04,.39,0,2.36,.78,1.38,umber);
    cable(b,[[-.14,.29,-.12],[-.03,1.90,-.11],[-.48,2.91,-.12],[-.45,3.75,-.15]],.145,rust);
    for(const [i,x,y] of [[0,-1.24,2.84],[1,.59,3.41],[2,1.31,2.47]]){
      band(b,[i===1?-.43:0,i===1?2.83:1.86,-.10],[x,y,-.03],.117,umber,.63,5);
      cable(b,[[x,y,-.02],[x+.05,y-.20,.14],[x-.11,y-.47,.15]],.038,bone);
      cut(b,'boot',x-.12,y-.67,.17,.99,.67,.47,[purple,shells[v],rose][i],.18-.15*i);
      print(b,'flat',x-.22,y-.67,.412,.33,.10,bone,.1);
    }
    print(b,'hex',-.47,3.74,-.091,.22,.23,aqua,0,true);
  }
  function ghostTerminal(b,v){
    slab(b,0,.14,0,2.13,.28,1.40,coal);
    cut(b,'cabinet',-.10,.95,-.07,1.76,1.59,1.10,shells[v],-.04);
    slab(b,-.10,1.60,.30,1.99,.19,1.32,galv,-.04);
    for(let i=0;i<5;i++)print(b,'flat',-.77+i*.30,1.64,.965,.16,.07,i===2?finish(v):navy,0,i===2);
    cut(b,'screen',-.11,2.26,-.25,1.57,1.11,.78,coal,-.04);
    print(b,'screen',-.11,2.26,.152,1.29,.88,spruce,-.04);
    print(b,'ghost',-.14,2.31,.162,.51,.58,aqua,-.04,true);
    for(const x of [-.22,-.08])print(b,'hex',x,2.35,.17,.07,.10,navy);
    // A second, solid ghost is climbing out of the back of the CRT.
    cut(b,'ghost',.13,3.24,-.28,.87,1.13,.43,bone,.24);
    for(const x of [.00,.23])print(b,'round',x,3.39,-.055,.14,.18,navy);
    cable(b,[[.76,.62,.1],[1.19,.28,.28],[1.63,.32,.29],[1.68,.59,.20]],.07,brass);
  }
  // The county fair kept the splashy paint jobs after the rides went to auction.
  function coupe(b,v){
    cut(b,'car',.05,.87,-.02,4.63,1.10,1.65,shells[v],-.045);
    cut(b,'hood',-.08,1.59,-.02,2.31,1.04,1.39,iron,-.09);
    print(b,'hood',-.10,1.60,.69,1.94,.69,navy,-.09);print(b,'flat',-.04,1.65,.697,.13,.58,galv,-.09);
    wheel(b,-1.38,.53,.83,1.06,bone);wheel(b,1.33,.54,.83,1.03,brass);
    for(const [i,x] of [[0,-1.72],[1,-1.49],[2,-1.25]])print(b,'flat',x,1.04,.82,.12,.58,i===1?rose:coal,-.25);
    slab(b,-2.13,.65,.02,.61,.24,1.71,galv,-.15);slab(b,2.18,.76,0,.40,.24,1.69,rust,.10);
    print(b,'round',.56,1.07,.821,.48,.48,bone);print(b,'bolt',.55,1.08,.831,.25,.34,red,.08);
    cable(b,[[.75,.86,.86],[.99,1.57,.67],[.83,1.94,.52]],.074,finish(v));
    cut(b,'fin',1.88,1.49,-.21,.82,.65,.32,red,-.05);
  }
  function gumball(b,v){
    cut(b,'pot',0,.43,0,1.76,.86,1.51,red,pi);
    cut(b,'cabinet',0,1.16,0,1.30,1.28,1.05,shells[v]);
    print(b,'flat',-.33,1.18,.545,.24,.11,coal);disc(b,.13,1.24,.57,.47,.15,iron,7);
    print(b,'flat',.13,1.25,.651,.35,.11,bone,.22);
    cut(b,'hex',0,2.37,-.13,1.74,1.49,.98,ice);
    for(const [x,y,r,c] of [[-.45,2.20,.34,rose],[-.07,2.16,.47,amber],[.38,2.16,.38,purple],[-.30,2.56,.35,red],[.13,2.52,.45,finish(v)],[.43,2.66,.29,bone]])
      print(b,'round',x,y,.385,r,r,c,0,true);
    cut(b,'hood',.01,3.12,-.10,1.24,.38,1.06,red);bulb(b,.02,3.42,0,.34,.36,.36,brass);
  }
  function photo(b,v){
    slab(b,0,.13,0,3.32,.27,1.42,iron);
    for(const x of [-1.13,.95])band(b,[x,.20,-.23],[x,2.51,-.18],.11,galv,1,5);
    // An old portrait board retains its physical face hole. The sides double
    // as the shoulders of the uniform the visitor is meant to pose inside.
    cut(b,'hood',-.13,1.62,-.05,2.68,1.68,.26,[spruce,plum,rust,iron][v]);
    wreath(b,-.11,2.98,-.04,1.53,1.77,.29,bone,-.08,9);
    cut(b,'hood',-.28,3.85,-.07,1.51,.61,.31,navy,.12);
    slab(b,-.03,3.65,.09,1.64,.13,.24,amber,.12);
    print(b,'triangle',-.11,2.10,.105,.55,.41,white,pi);print(b,'bolt',-.11,1.76,.11,.32,.65,rose,0,true);
    band(b,[1.21,.22,.03],[1.49,2.85,.05],.08,iron);
    cut(b,'cabinet',1.45,2.90,.05,.66,.56,.39,coal,.19);
    print(b,'screen',1.46,2.90,.254,.50,.38,finish(v),.19,true);
  }
  function soda(b,v){
    for(const [side,x,j] of [[-1,-.51,.12],[1,.39,-.19]]){
      cable(b,[[x,1.53,-.02],[x+side*.24,.88,.05],[x+side*.38+j,.39,.19]],.105,galv);
      cut(b,'boot',x+side*.42+j,.28,.30,.92,.52,.52,navy,side*.10);
      print(b,'flat',x+side*.40+j,.10,.57,.65,.11,bone,side*.10);
    }
    cut(b,'pot',-.09,2.13,-.05,1.82,1.94,1.38,[rose,spruce,plum,red][v],-.13);
    slab(b,.03,3.06,-.04,1.98,.19,1.46,white,-.13);
    print(b,'bolt',-.11,2.21,.654,.98,1.20,amber,-.20,true);
    cable(b,[[.27,2.97,-.06],[.08,3.91,-.06],[.37,4.21,0],[.70,4.27,0]],.112,bone);
    band(b,[.18,3.48,-.06],[.14,3.68,-.06],.116,rose);
    print(b,'round',.67,2.68,.664,.18,.18,bone);
  }
  function saltPepper(b,v){
    slab(b,0,.16,0,3.07,.32,1.44,navy);slab(b,0,.37,0,1.35,.32,1.40,shells[v]);
    for(const [i,x,y,scale,body] of [[0,-.76,.28,.91,bone],[1,.56,.43,1.13,coal]]){
      const h=1.45*scale;
      cut(b,'cabinet',x,y+h*.54,0,1.12*scale,h,1.08*scale,body,i?.10:-.08);
      cut(b,'hood',x-.03,y+h+.07,0,1.15*scale,.48*scale,1.1*scale,galv,i?.10:-.08);
      for(const dx of [-.24,0,.24])print(b,'round',x+dx,y+h+.13,.56*scale,.12,.10,navy);
      print(b,'flat',x,y+h*.55,.55*scale,.48*scale,.45*scale,i?amber:navy,i?.10:-.08);
      print(b,i?'bolt':'triangle',x,y+h*.55,.56*scale,.26*scale,.29*scale,i?navy:bone);
    }
    band(b,[-1.37,.48,-.45],[-1.51,2.88,-.39],.055,brass);
    cut(b,'fin',-1.17,2.68,-.39,.68,.57,.10,finish(v),-1.33);
  }
  function bowling(b,v){
    wheels(b,-.10,.31,.55,1.02,.28);
    slab(b,-.03,.63,0,2.64,.18,1.38,iron);
    for(const x of [-1.13,1.08])band(b,[x*.82,.66,.50],[x,1.56,.59],.071,galv);
    for(const y of [1.03,1.39])band(b,[-1.14,y,.60],[1.13,y,.60],.057,galv);
    cable(b,[[1.10,.66,-.24],[1.41,1.87,-.16],[1.86,1.87,-.16]],.086,finish(v));
    cut(b,'pin',-.29,1.96,.03,1.56,2.40,.68,bone,-.31);
    print(b,'flat',-.135,2.46,.382,.38,.13,red,-.31);
    print(b,'flat',-.080,2.63,.385,.31,.085,red,-.31);
    bulb(b,.62,1.22,.10,.89,.89,.89,plum);
    for(const [x,y] of [[.56,1.39],[.73,1.39],[.66,1.24]])print(b,'round',x,y,.54,.095,.095,navy);
  }
  function flamingo(b,v){
    wheels(b,-.12,.28,.36,1.15,.26);
    slab(b,0,.57,0,3.02,.29,1.15,[clay,rose,brass,galv][v],.01);
    band(b,[-.94,.57,0],[.47,1.40,.03],.16,brass,.73,6);
    band(b,[.66,.58,.09],[.24,1.29,.10],.117,iron,1,5);
    cable(b,[[-1.14,.60,-.10],[-1.58,1.40,-.10],[-1.83,2.60,-.13]],.082,navy);
    slab(b,.44,1.42,0,1.16,.15,.74,iron);
    for(const x of [.30,.64])band(b,[x,1.49,.12],[x+.06,2.21,.11],.051,red);
    bulb(b,.43,2.31,.03,1.19,.76,.66,rose,-.10);
    cut(b,'wing',.24,2.34,.34,.72,.30,.11,red,.13);
    cable(b,[[.78,2.46,.01],[1.03,2.85,.01],[.97,3.31,.02],[1.07,3.47,.09]],.10,rose);
    bulb(b,1.19,3.48,.08,.49,.43,.45,rose);
    cut(b,'blade',1.46,3.34,.08,.42,.26,.33,navy,-.56);
    print(b,'round',1.25,3.55,.303,.10,.10,white);
  }
  function foam(b,v){
    slab(b,0,.14,0,2.98,.27,1.47,iron);
    cut(b,'tub',0,.63,-.01,2.88,1.13,1.41,shells[v]);slab(b,.06,1.12,0,2.86,.14,1.42,galv);
    for(const [i,x,h,roll] of [[0,-.91,1.95,.37],[1,.06,2.62,-.03],[2,.95,1.99,-.40]]){
      const sz=[2.08,3.00,1.92][i],shade=[amber,finish(v),rose][i];
      cut(b,'finger',x,h,-.05+i*.065,sz*.58,sz,.49,shade,roll);
      print(b,'flat',x,h-.03,.21+i*.065,.1,.57,navy,roll);
      print(b,'flat',x-.065,h+.24,.22+i*.065,.16,.11,navy,roll-.57);
    }
    print(b,'flat',.10,.61,.704,.78,.13,bone);
  }
  const desert=['arizona'],woods=['eight'],fair=['indiana'],all=['arizona','eight','indiana'];
  const desertFair=['arizona','indiana'],forestFair=['eight','indiana'];
  // Width is the X extent of a front view. Radius encloses the complete X/Z
  // footprint of both the machine and any bent cables, straws or handlebars.
  const inventory=[
    ['snack-compiler','Snack Compiler','Ivan',all,2.5,3.55,1.55,snack],
    ['crt-choir','Dead Pixel Choir','Dylan',all,3.75,3.5,2.05,crt],
    ['parking-boot','You Have Been Booted','Mint',all,2.3,3.45,1.35,meter],
    ['tape-cart','Emergency Rewind','Soon',desertFair,5.2,2.75,2.7,tape],
    ['baggage','Unidentified Flying Luggage','Harper',desertFair,3.45,3.7,2.0,baggage],
    ['patch-bay','Overgrown Patch Bay','Eryan',forestFair,4.8,2.3,2.6,patch],
    ['spring-bath','Public Hot Springs','Sugi',desert,3.95,3.2,2.2,bath],
    ['mailbox','Dead Letter Antennas','Soon',desert,4.05,3.25,2.05,postoffice],
    ['ice-fossil','Fossil Popsicle','Harper',desert,4.2,4.6,2.3,iceFossil],
    ['radiator','Local Fan Club','Clint',desert,3.6,3.35,1.8,radiator],
    ['weatherbone','Bone Forecast','Ivan',desert,4.35,3.8,2.2,weatherbone],
    ['eclipse-glasses','Emergency Eclipse Glasses','Sophie',desert,4.35,2.95,2.5,sunglasses],
    ['jackalope','Jackalope Receiver','Eden',desert,3.1,3.85,1.75,jackalope],
    ['toll-crank','Mirage Tollbooth','Mint',desert,2.55,3.45,1.45,toll],
    ['antenna-bouquet','Bouquet of Yagis','Dylan',woods,3.6,4.5,1.85,bouquet],
    ['kettle','Copper Kettle Repeater','Sugi',woods,4.15,3.7,2.1,kettle],
    ['scream','Pay-Per-Scream','Eryan',woods,3.1,4.3,1.6,scream],
    ['clocks','Clockweed Nursery','Eden',woods,3.45,3.7,1.85,clocks],
    ['cheese-rack','Rack of Cheese','Sugi',woods,3.7,3.2,2.0,cheeseRack],
    ['trip-hazard','Trip Hazard Tripod','Dylan',woods,2.95,3.9,1.7,tripod],
    ['shoe-tree','Boot Tree','Eryan',woods,3.65,3.9,1.9,shoeTree],
    ['ghost-terminal','Ghost in the Terminal','Sophie',woods,3.55,3.85,1.8,ghostTerminal],
    ['coupe','Warranty Accordion','Clint',fair,4.95,2.2,2.65,coupe],
    ['gumball','Coin-Operated Mint','Mint',fair,1.8,3.65,1.2,gumball],
    ['photo','Face Required','Sophie',fair,3.65,4.2,1.85,photo],
    ['soda','Tap-Dancing Soda','Eden',fair,2.65,4.4,1.45,soda],
    ['podium','Competitive Seasoning','Mint',fair,3.15,3.0,1.75,saltPepper],
    ['bowling','Bowling Aisle Four','Clint',fair,3.75,3.2,1.9,bowling],
    ['flamingo','Factory Jack Flamingo','Sophie',fair,3.85,3.75,1.95,flamingo],
    ['foam','Second-Hand Foam Hands','Eden',fair,3.0,4.15,1.7,foam]
  ];

  // Render once from the same triangles used for the physical model. The
  // slight angle reveals open tubs, wheels, cables and dials in the 2D camera.
  // The depth buffer keeps a front-panel graphic on top of its large cabinet.
  function makeSprite(recipe,v){
    const tiles=[],position=new T.Vector3(),scale=new T.Vector3(),rotation=new T.Quaternion(),euler=new T.Euler();
    const model=new T.Matrix4(),normal=new T.Vector3(),side=new T.Vector3();
    const eye=new T.Vector3(.19,.14,1).normalize(),horizontal=new T.Vector3(1,0,-.19).normalize(),vertical=new T.Vector3().crossVectors(eye,horizontal);
    let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;
    const keyLight=new T.Vector3(-.34,.72,.60).normalize(),a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
    function mesh(g,at,size,axis,color,glow=false){
      rotation.identity();if(axis?.isQuaternion)rotation.copy(axis);else if(axis)rotation.setFromEuler(euler.set(...axis,'YXZ'));
      model.compose(position.fromArray(at),rotation,scale.fromArray(size));
      const points=g.attributes.position,projected=[],idx=g.index,count=idx?idx.count:points.count;
      for(let i=0;i<points.count;i++){
        const p=new T.Vector3().fromBufferAttribute(points,i).applyMatrix4(model);
        const x=p.dot(horizontal),y=p.dot(vertical);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
        projected.push({p,x,y,z:p.dot(eye)});
      }
      const hex=parseInt(color.slice(1),16);
      for(let i=0;i<count;i+=3){
        const first=projected[idx?idx.getX(i):i],second=projected[idx?idx.getX(i+1):i+1],third=projected[idx?idx.getX(i+2):i+2];
        a.copy(first.p);b.copy(second.p);c.copy(third.p);
        normal.copy(b).sub(a).cross(side.copy(c).sub(a)).normalize();
        if(normal.dot(eye)<.0001)continue;
        const value=glow?1.03:.71+.35*Math.max(0,normal.dot(keyLight));
        const r=Math.min(255,Math.round((hex>>16)*value)),g=Math.min(255,Math.round((hex>>8&255)*value)),bl=Math.min(255,Math.round((hex&255)*value));
        tiles.push([first,second,third,(r<<16)|(g<<8)|bl]);
      }
    }
    recipe({add:mesh,box(p,s,ink,o,lit){mesh(cached('box',()=>new T.BoxGeometry(1,1,1)),p,s,o,ink,lit);}},v);
    // The largest exhibit is under six metres. About thirty pixels per metre
    // is sufficient for the sprite camera and keeps the cached variants small.
    const ppm=33,margin=2,w=Math.ceil((x1-x0)*ppm)+2*margin,h=Math.ceil((y1-y0)*ppm)+2*margin;
    const depth=new Float32Array(w*h).fill(-Infinity),pixels=new Int32Array(w*h).fill(-1);
    for(const [p,q,r,ink] of tiles){
      const ax=(p.x-x0)*ppm+margin,ay=(y1-p.y)*ppm+margin,bx=(q.x-x0)*ppm+margin,by=(y1-q.y)*ppm+margin;
      const cx=(r.x-x0)*ppm+margin,cy=(y1-r.y)*ppm+margin,den=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);
      if(Math.abs(den)<.00001)continue;
      const left=Math.max(0,Math.floor(Math.min(ax,bx,cx))),right=Math.min(w-1,Math.ceil(Math.max(ax,bx,cx)));
      const top=Math.max(0,Math.floor(Math.min(ay,by,cy))),bottom=Math.min(h-1,Math.ceil(Math.max(ay,by,cy)));
      for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){
        const pa=((by-cy)*(x+.5-cx)+(cx-bx)*(y+.5-cy))/den,pb=((cy-ay)*(x+.5-cx)+(ax-cx)*(y+.5-cy))/den,pc=1-pa-pb;
        if(pa<-.0002||pb<-.0002||pc<-.0002)continue;
        const z=pa*p.z+pb*q.z+pc*r.z,k=y*w+x;
        if(z>depth[k]-.00001){depth[k]=z;pixels[k]=ink;}
      }
    }
    const sprite={x:x0-margin/ppm,y:y1+margin/ppm,w,h,ppm};
    // OffscreenCanvas is optional. Older 2D-only browsers and headless
    // renderers use the identical color spans without creating DOM elements.
    if(typeof OffscreenCanvas==='function'){
      const bitmap=new OffscreenCanvas(w,h),ink=bitmap.getContext('2d');
      if(ink){
        const image=ink.createImageData(w,h);
        for(let i=0;i<pixels.length;i++){const rgb=pixels[i];if(rgb<0)continue;
          image.data[4*i]=rgb>>16;image.data[4*i+1]=(rgb>>8)&255;image.data[4*i+2]=rgb&255;image.data[4*i+3]=255;
        }
        ink.putImageData(image,0,0);sprite.bitmap=bitmap;return sprite;
      }
    }
    const spans=new Map();
    for(let y=0;y<h;y++){
      for(let x=0;x<w;){
        const rgb=pixels[x+y*w],start=x;while(++x<w&&pixels[x+y*w]===rgb){}
        if(rgb<0)continue;
        if(!spans.has(rgb))spans.set(rgb,[]);
        spans.get(rgb).push(start,y,x-start);
      }
    }
    sprite.spans=[...spans].map(([rgb,runs])=>{
      const color='#'+rgb.toString(16).padStart(6,'0');
      if(typeof Path2D!=='function')return {color,runs};
      const path=new Path2D();
      for(let i=0;i<runs.length;i+=3)path.rect(runs[i],runs[i+1],runs[i+2],1);
      return {color,path};
    });
    return sprite;
  }
  function paint(ctx,s){
    ctx.save();ctx.translate(s.x,s.y);ctx.scale(1/s.ppm,-1/s.ppm);
    if(s.bitmap)ctx.drawImage(s.bitmap,0,0);
    else for(const swatch of s.spans){
      ctx.fillStyle=swatch.color;
      if(swatch.path)ctx.fill(swatch.path);
      else{const a=swatch.runs;ctx.beginPath();for(let i=0;i<a.length;i+=3)ctx.rect(a[i],a[i+1],a[i+2],1);ctx.fill();}
    }
    ctx.restore();
  }
  const kits=inventory.map(([id,name,crew,regions,width,height,radius,recipe])=>{
    const sprites=[],variant=value=>Math.max(0,Math.min(3,Math.floor((value||0)*4)));
    return {id:'salvage-'+id,name,crew,regions,width,height,radius,
      build(builder,value){recipe(builder,variant(value));},
      draw(ctx,value){const v=variant(value);if(!sprites[v])sprites[v]=makeSprite(recipe,v);paint(ctx,sprites[v]);}
    };
  });
  return {kits};
})();
