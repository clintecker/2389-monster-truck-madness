/* The night-shift supporters' clubs. Every throw and every pose is a function of
   the race clock, seat number and recorded events; the tour can rewind a chant. */
const MTMCrowd=(()=>{
  'use strict';
  const T=THREE,tau=Math.PI*2,frames=12,beat=7.8,release=7;
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),cycle=(x,n)=>((x%n)+n)%n;
  const ink='#1d2336',bone='#f1eee0',mint='#8df9d5',pink='#ff68a8',sun='#ffd06f';
  const prizes=[pink,mint,sun,'#f4f3ec','#59c9ff','#b69dff'];
  const glassProfile=[[0,.071],[.025,.087],[.215,.087],[.272,.044],[.365,.036],[.372,.048],[.40,.046]];
  const glassShades=['#438467','#b77938'];
  const wardrobe=[
    // Jacket, contrasting trim, skin, hair, trousers, headwear and behavior.
    ['#d85861','#ffd773','#dba47d','#523743','#473847','cowboy','foam'],
    ['#3b98a5','#dfffd1','#975e48','#302941','#2f3f58','bun','clap'],
    ['#9975c8','#f6a1cc','#edc29e','#a45245','#3c4161','mohawk','bottle'],
    ['#d2793e','#98f6d9','#a16d59','#493135','#364757','peak','scarf'],
    ['#5b82b9','#ffcb62','#e0a27d','#4e3c3b','#2e3851','beanie','sign'],
    ['#b14975','#81e5f1','#9b6555','#382d42','#3d405d','visor','pump'],
    ['#798746','#fbb45f','#edcdb1','#bf7643','#384857','headband','bottle'],
    ['#457c78','#f7a5b9','#b07954','#3f3346','#514151','earphones','foam'],
    ['#bc956a','#d45466','#e3b188','#513d39','#354b59','beanie','whistle'],
    ['#685b98','#ffcf72','#c68c66','#483444','#3e394e','bun','scarf'],
    ['#cd6a83','#dde79d','#774e40','#392d33','#3f4d60','peak','pump'],
    ['#cc8b48','#81dde5','#c99177','#754744','#3f4359','cowboy','bottle']
  ];
  const stripNames=[
    ['Sophie','False Start Choir','We practiced this encore during qualifying.'],['Eden','West Bleacher Brass','The tubas have taken a breather. Nobody else has.'],
    ['Mint','The Foam Finger Caucus','Motion carried unanimously on twelve index fingers.'],['Clint','Section 404','Our seats were found. The beer remains missing.'],
    ['Sophie','The Sidestand Ovation','None of these seats have been used as intended.'],['Eden','Dirt Opera Balcony','Tonight’s solo is written for empty bottles.'],
    ['Clint','The Photo Finishers','We have a photograph of the last photograph.'],['Mint','The Staging Union','The night shift demands another lap.'],
    ['Eden','Municipal Yelling Office','Inside voices have been recalled.'],['Clint','Quarter-Mile Beer Garden','Beer sold by the lap. Empties fly free.'],
    ['Sophie','The Pocket Confetti Pit','That was our good pocket.'],['Mint','Standing Room Only','The seated delegation has also stood up.'],
    ['Eden','The Encore Department','The encore requests its own encore.'],['Clint','Last Call Grandstand','Last call has a rolling start.']
  ];
  const popups={
    arizona:[[.010,-1,'Ivan','The Sand Pit Choir','Please remain completely unseated.'],[.155,1,'Harper','The Dry Lake Yacht Club','The tide is late again.'],[.315,-1,'Soon','Tomorrow’s Tailgate','We were here before we arrived.'],[.48,1,'Ivan','The Dust Devils','Every cough is counted as applause.'],[.655,-1,'Harper','The Gravel Garglers','Take a number. Eat the number.'],[.855,1,'Soon','No Vacancy Bleachers','The motel made the reservations.'],[.966,-1,'Harper','Mile Marker Mosh Pit','All elbows filed in triplicate.']],
    eight:[[.012,1,'Dylan','The Heckle Buffer','Your hoot is important to us.'],[.16,-1,'Eryan','The Frog-Casting Gallery','All frogs know the chorus.'],[.297,1,'Sugi','Noodle Supporters’ Section','Hands up if you prefer the wide noodles.'],[.477,-1,'Dylan','The Rebootleggers','That was the technically correct hoot.'],[.639,1,'Sugi','Brothside Seats','The thermoses have excellent pitch.'],[.847,-1,'Eryan','The Aftershock Club','Holler once for each of the eight.']],
    indiana:[[.013,1,'Eden','The Launch Choir','Make some noise before the noise starts.']]
  };
  const west=[[.618,-1,'Ivan','The Echo Choir','The second round is on the canyon.'],[.731,1,'Soon','Western Hoof Beats','The boot does the counting.'],[.867,-1,'Harper','The Lunar Tailgate','The return bus leaves at moonset.']];
  const chants={Ivan:['WHO MOVED THE SAND?','FORK! LIFT! FORK! LIFT!'],Harper:['SCOOP! THERE IT IS!','ONE MORE ORBIT!'],Soon:['TEN MORE MINUTES! YESTERDAY!','GIVE THE BOOT A BOOT!'],
    Dylan:['JAM! THAT! PRINTER!','REBOOT! REBOOT! REBOOT!'],Sugi:['BROTH! BROTH! BROTH!','SEND NOODLES!'],Eryan:['ALL! FROGS! CAST!','THE PEAS HAVE IT!'],
    Sophie:['DO IT FOR THE CORN!','ONE MORE FOR THE MITTENS!'],Eden:['LET THE TUBA COOK!','MIND! THE! QUACK!'],
    Mint:['BUTTER! BOTH! SIDES!','WHO HAS EXACT CHANGE?'],Clint:['DEEP! DISH! DEEP! DISH!','RIGHT OF WHEY!']};
  function hash(n){n=Math.imul(n^(n>>>16),0x45d9f3b);n=Math.imul(n^(n>>>16),0x45d9f3b);return (n^(n>>>16))>>>0;}
  const unit=n=>hash(n)/4294967296;
  function basis(section,x,y,z){const cs=section.cs,sn=section.sn;return [section.ox+x*cs+z*sn,section.oy+y,section.oz-x*sn+z*cs];}
  function seat(s,x,y,z,seed,front,seated,style,scale){
    const [wx,wy,wz]=basis(s,x,y,z);
    return {x:wx,y:wy,z:wz,lx:x,ly:y,lz:z,seed,front,seated,style,size:scale,phase:hash(seed+22)%frames,
      flair:(hash(seed+78)%6),twist:unit(seed+91)*.22-.11};
  }
  function section(c,index,x,y,z,yaw,s,width,rows,name,crew,caption,stand){
    const cs=Math.cos(yaw),sn=Math.sin(yaw),target=stand?width*.12:0,depth=stand?-.65:-.34;
    return {id:'crowd-'+c.id+'-'+index,kind:'crowd',name,crew,s,caption,reply:chants[crew][(index>>1)%2],sound:'holler',ink:prizes[(index+c.id.length)%prizes.length],
      ox:x,oy:y,oz:z,x:x+cs*target+sn*depth,y,z:z-sn*target+cs*depth,yaw,cs,sn,rows,
      frontWidth:width,width:stand?9.0:width+.7,height:stand?4.6:3.4,aimY:y+(stand?2.52:1.30),stand,
      phase:hash(index+341)%frames,seed:hash(index*318+c.id.length),fans:[],casters:[],clappers:[]};
  }
  // A touring camera can inspect individual fans at the front rail; the actual
  // raised tiers and seats stay at their original place on the fairgrounds.
  function plan(c,data,entries,carnival){
    const sections=[],fixed=[];
    for(const [i,stand] of (data.crowdStands||[]).entries()){
      const [crew,name,caption]=stripNames[i%stripNames.length];
      const q=section(c,i,stand.x,stand.y,stand.z,stand.yaw,c.nearest(stand.x,stand.z).s,stand.width,stand.rows,name,crew,caption,true);
      for(const [j,v] of stand.seats.entries()){
        const seed=hash(i*773+j*97+2389);
        const sitting=unit(seed+138)<(v.row===0?.21:.52),style=hash(seed+32)%wardrobe.length;
        q.fans.push(seat(q,v.x,v.y-(sitting?.60:.31),v.z,seed,v.row<2,sitting,style,.88+(v.size-.83)*.65));
      }
      sections.push(q);
    }
    const bypass=c.id==='eight'?Array.from({length:33},(_,i)=>c.at(c.length*(.688+.103*i/32),-14*Math.pow(Math.sin(Math.PI*i/32),1.4))):[];
    const wood=[...(data.obstacles||[]),...(carnival.pieces||[]),...entries.map(v=>({x:v.x,z:v.z,r:v.footprintRadius||v.radius||4})),
      ...(data.jokeSigns||[]).map(v=>({x:v.x,z:v.z,r:Math.min(2.45,v.width*.34)}))];
    // Reject individual obstruction shapes rather than reserving a huge circle
    // on a tight bend. A pen fits into a real gap between cabinets and signs.
    function locate(station,side,width){
      let best=null,bestCost=Infinity;
      for(const flip of [1,-1])for(const ds of [0,5,-5,10,-10,18,-18,28,-28,39,-39,55,-55]){
        const s=clamp(station+ds,1.6,c.length-2);
        for(const extra of [2.7,4.1,6.5,9.2,12.2,16.8,22,30]){
          const cost=Math.abs(ds)*.62+extra+(flip<0?9:0);if(cost>=bestCost)continue;
          const off=side*flip*(c.width*.5+extra),p=c.at(s,off),center=c.at(s-4);
          const yaw=Math.atan2(center.x-p.x,center.z-p.z),cs=Math.cos(yaw),sn=Math.sin(yaw);
          let clear=true;
          for(const along of [-width*.5,0,width*.5])for(const depth of [-1.8,.58]){
            const x=p.x+cs*along+sn*depth,z=p.z-sn*along+cs*depth;
            if(c.nearest(x,z).distance<c.width*.5+.86||bypass.some(v=>(v.x-x)**2+(v.z-z)**2<5.75**2)){clear=false;break;}
            for(const v of wood){
              const dx=Math.abs(x-v.x),dz=Math.abs(z-v.z);
              if(v.r?dx<v.r+1.25&&dz<v.r+1.25&&dx*dx+dz*dz<(v.r+1.25)**2:dx<(v.hx||.3)+1.20&&dz<(v.hz||.3)+1.20){clear=false;break;}
            }
            if(!clear)break;
          }
          if(!clear)continue;best={...p,yaw,s};bestCost=cost;
        }
      }
      return best;
    }
    const route=[...popups[c.id],...(c.layoutKey==='arizona-circuit'?west:[])];
    for(const [i,[f,side,crew,name,caption]] of route.entries()){
      let station=c.length*f;
      if(c.layoutKey==='arizona-circuit'&&i<popups.arizona.length){const old=MTMCourses[0].at(MTMCourses[0].length*f);station=c.nearest(old.x,old.z).s;}
      const width=c.id==='indiana'?6.1:(i%3===1?7.2:6.2),p=locate(station,side,width);if(!p)continue;
      const q=section(c,sections.length,p.x,c.ground(p.x,p.z),p.z,p.yaw,p.s,width,2+(i%3===0?1:0),name,crew,caption,false);
      const columns=Math.floor((width-.20)/.74);
      for(let r=0;r<q.rows;r++)for(let j=0;j<columns;j++){
        const seed=hash((sections.length+27)*887+r*151+j*43);
        const x=(j+.5-columns*.5)*.74+(unit(seed)-.5)*.13,z=-r*.83+unit(seed+61)*.14;
        const [wx,,wz]=basis(q,x,0,z),y=c.ground(wx,wz)-q.oy+r*.29+.08;
        q.fans.push(seat(q,x,y,z,seed,true,false,hash(seed+32)%wardrobe.length,.92+.17*unit(seed+9)));
      }
      sections.push(q);
      for(const v of [-1,0,1]){const [x,,z]=basis(q,v*(width*.5-.45),0,.66);fixed.push({x,z,r:v===0?.73:.64,material:'metal'});}
      wood.push({x:p.x,z:p.z,r:width*.48});
    }
    for(const q of sections){
      const front=q.fans.filter(f=>f.front),holders=front.filter(f=>wardrobe[f.style][6]==='bottle');
      if(!holders.length&&front.length){const f=front[front.length>>1];f.style=2;holders.push(f);}
      const limit=q.stand?4:2;
      for(let j=0;j<Math.min(limit,holders.length);j++){
        const f=holders[Math.floor((j+.5)*holders.length/Math.min(limit,holders.length))],amber=(j+q.phase)%2;
        if(f.style%2!==amber)f.style=amber?11:(f.seed%2?2:6);
        f.caster=j;q.casters.push(f);
      }
      const eligible=front.filter(f=>f.caster===undefined&&['pump','clap','foam','whistle'].includes(wardrobe[f.style][6]));
      for(let j=0;j<Math.min(4,eligible.length);j++)q.clappers.push(eligible[Math.floor((j+.5)*eligible.length/Math.min(4,eligible.length))]);
    }
    return {sections,fixed};
  }
  const paintCache=new Map(),models=new Map();
  const matte=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide});
  function color(value){if(!paintCache.has(value))paintCache.set(value,new T.Color(value));return paintCache.get(value);}
  const lettering={W:['10101','10101','10101','11111','01010'],O:['111','101','101','101','111'],G:['111','100','101','101','111'],
    '2':['111','001','111','100','111'],'3':['111','001','111','001','111'],'8':['111','101','111','101','111'],'9':['111','101','111','001','111']};
  // The same colored polygon rig is baked to a tiny distant atlas and used
  // at full depth by the front-row supporters. Faces and moving hands match.
  function avatar(style,frame,seated){
    const key=(style*frames+frame)*2+(seated?1:0);if(models.has(key))return models.get(key);
    const [jacket,trim,skin,hair,trousers,cap,gesture]=wardrobe[style],phase=frame/frames*tau;
    const faces=[],swing=Math.sin(phase),lift=(1-Math.cos(phase))*.5;
    function face(a,col){faces.push({p:a,c:col});}
    function box(x,y,z,w,h,d,col){
      const a=w*.5,b=h*.5,e=d*.5,p=[[x-a,y-b,z-e],[x+a,y-b,z-e],[x+a,y+b,z-e],[x-a,y+b,z-e],
        [x-a,y-b,z+e],[x+a,y-b,z+e],[x+a,y+b,z+e],[x-a,y+b,z+e]];
      for(const f of [[4,5,6,7],[1,0,3,2],[0,4,7,3],[5,1,2,6],[7,6,2,3],[0,1,5,4]])face(f.map(i=>p[i]),col);
    }
    function oval(x,y,z,profile,col,n=7){
      let prev=null;
      for(const [dy,rx,rz] of profile){
        const verts=Array.from({length:n},(_,j)=>{const a=(j+.5)*tau/n;return [x+Math.sin(a)*rx,y+dy,z+Math.cos(a)*rz];});
        if(prev){for(let j=0;j<n;j++){const b=(j+1)%n;face([prev[j],prev[b],verts[b],verts[j]],col);}}
        else face([...verts].reverse(),col);
        prev=verts;
      }
      face(prev,col);
    }
    function link(a,b,r,rb,col){
      const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],len=Math.hypot(dx,dy,dz)||1,axis=[dx/len,dy/len,dz/len];
      const k=Math.hypot(axis[0],axis[1]),u=k>.001?[axis[1]/k,-axis[0]/k,0]:[1,0,0],v=[axis[1]*u[2]-axis[2]*u[1],axis[2]*u[0]-axis[0]*u[2],axis[0]*u[1]-axis[1]*u[0]];
      const ring=(p,rad)=>Array.from({length:5},(_,i)=>{const c=Math.cos(i*tau/5)*rad,s=Math.sin(i*tau/5)*rad;return [p[0]+u[0]*c+v[0]*s,p[1]+u[1]*c+v[1]*s,p[2]+u[2]*c+v[2]*s];});
      const A=ring(a,r),B=ring(b,rb);for(let j=0;j<5;j++){const n=(j+1)%5;face([A[j],A[n],B[n],B[j]],col);}
      face([...A].reverse(),col);face(B,col);
    }
    function letters(text,x,y,z,cell,col){
      for(const ch of text){
        const rows=lettering[ch];if(!rows)continue;
        for(let j=0;j<rows.length;j++)for(let k=0;k<rows[j].length;k++){
          if(rows[j][k]!=='1')continue;
          let last=k+1;while(rows[j][last]==='1')last++;
          const a=x+k*cell,b=x+last*cell,top=y-j*cell;
          face([[a,top-cell,z],[b,top-cell,z],[b,top,z],[a,top,z]],col);faces[faces.length-1].decal=true;k=last-1;
        }
        x+=(rows[0].length+1)*cell;
      }
    }
    const leap=seated?0:(gesture==='pump'||gesture==='foam'?.235:gesture==='bottle'?.075:.12)*Math.max(0,Math.sin(phase-.28))**1.65;
    const pelvis=(seated?.59:.90)+leap,slant=swing*(seated?.014:.034),bodyX=slant,bodyZ=seated?.12:.005;
    const chest=pelvis+.39,shoulder=pelvis+.50,top=pelvis+.55,headY=top+.25+.021*swing;
    const hipWidth=style%3===1?.219:.19,shoulderWidth=style%4===1?.28:.247;
    for(const side of [-1,1]){
      const x=side*hipWidth*.71;
      const H=[x+slant,pelvis,bodyZ-.02],K=[x+side*.025,(seated?.50:.50)+leap,seated?.48:.026+side*.037],
        F=[x+side*.07,.13+leap*.88,seated?.47:.045+side*.035];
      link(H,K,.115,.086,trousers);link(K,F,.094,.071,style%3===2?skin:trousers);
      box(F[0],F[1]-.054,F[2]+.06,.17,.16,.29,style%4===0?trim:ink);
      box(F[0],F[1]-.121,F[2]+.065,.174,.037,.293,bone);
    }
    oval(bodyX,pelvis,bodyZ,[[-.05,hipWidth,.142],[.10,hipWidth+.017,.15],[.34,shoulderWidth,.177],[.47,shoulderWidth+.022,.163],[.53,.117,.110]],jacket,7);
    oval(bodyX,pelvis+.021,bodyZ,[[0,hipWidth+.012,.155],[.065,hipWidth+.018,.159]],trousers);
    box(bodyX-.04,pelvis+.25,bodyZ+.164,.026,.37,.016,trim);
    face([[bodyX+.045,chest-.07,bodyZ+.170],[bodyX+.131,chest-.07,bodyZ+.170],[bodyX+.118,chest-.016,bodyZ+.173],[bodyX+.05,chest-.016,bodyZ+.173]],trim);
    if(style%3===0)box(bodyX,pelvis+.13,bodyZ+.163,hipWidth*1.54,.045,.012,trim);
    const hx=bodyX+swing*.021,hz=bodyZ+.025;
    box(hx,top+.046,hz,.14,.17,.15,skin);
    oval(hx,headY,hz,[[-.185,.11,.113],[-.108,.153,.140],[.096,.159,.15],[.157,.119,.123]],skin,7);
    const fy=hz+.139;
    if(cap==='visor'||cap==='earphones'||style===0){box(hx,headY+.025,fy,.23,.057,.046,ink);box(hx-.058,headY+.034,fy+.026,.066,.014,.012,trim);}
    else for(const dx of [-.063,.063])box(hx+dx,headY+.025,fy,.036,.029,.019,ink);
    box(hx,headY-.027,fy+.005,.044,.043,.048,skin);
    box(hx,headY-.090,fy-.006,.090,.030+lift*.033,.030,style%4===2?hair:'#803d47');
    if(style===2||style===6||style===10)box(hx,headY-.115,hz+.112,.155,.049,.028,hair);
    oval(hx,headY+.106,hz,[[-.027,.16,.148],[.055,.148,.141],[.095,.096,.098]],hair);
    if(cap==='peak'||cap==='cowboy'){
      oval(hx,headY+.152,hz,[[.003,.17,.16],[.073,.15,.15],[.11,.103,.106]],cap==='cowboy'?'#cda166':jacket);
      box(hx,headY+.159,hz+(cap==='cowboy'?.006:.115),cap==='cowboy'?.43:.26,.038,cap==='cowboy'?.39:.29,cap==='cowboy'?'#deb67b':trim);
    }else if(cap==='beanie'){oval(hx,headY+.12,hz,[[0,.167,.156],[.080,.154,.144],[.149,.056,.060]],trim);box(hx+.022,headY+.264,hz,.087,.073,.087,jacket);}
    else if(cap==='mohawk'){for(let j=0;j<4;j++){const z=hz+.10-j*.07;box(hx,headY+.196+(j%2)*.027,z,.066,.17,.095,trim);}}
    else if(cap==='bun'){for(const side of [-1,1])oval(hx+.139*side,headY+.13,hz-.035,[[-.043,.05,.053],[.033,.083,.067],[.095,.037,.049]],hair,6);}
    else if(cap==='headband')oval(hx,headY+.120,hz,[[0,.169,.161],[.044,.162,.155]],trim);
    else if(cap==='earphones'){for(const side of [-1,1])box(hx+.158*side,headY+.032,hz,.085,.158,.115,trim);}
    let hands=[];
    for(const side of [-1,1]){
      const a=[bodyX+side*shoulderWidth*.91,shoulder,bodyZ],v=phase+(side<0?.15:0);
      let ex,ey,ez=.025,wx,wy,wz=.14;
      if(gesture==='clap'){
        ex=side*(.30+.085*lift);ey=shoulder-.11+.046*swing;ez=.09;
        wx=side*(.039+.28*lift);wy=shoulder+.14+.092*swing;wz=.29;
      }else if(gesture==='scarf'||gesture==='sign'){
        ex=side*(.385+.064*swing);ey=shoulder+.124+.17*lift;
        wx=side*(gesture==='scarf'?.455:.345)+.072*swing;wy=shoulder+.34+.16*lift;wz=.092;
      }else if(gesture==='whistle'){
        ex=side*(.32+.05*lift);ey=shoulder-.07+.07*lift;wx=side*.088;wy=headY-.13+.025*swing;wz=.23;
      }else if(gesture==='bottle'&&side===1){
        const fire=clamp((frame-3)/4,0,1),follow=clamp((frame-7)/4,0,1);
        ex=.37+.042*Math.sin(v);ey=shoulder-.12+.41*fire-.22*follow;ez=-.09+.10*fire;
        wx=.30+.18*fire;wy=shoulder+.03+.58*fire-.50*follow;wz=.18-.35*Math.sin(fire*Math.PI)+.17*follow;
      }else{
        const higher=side===1?lift:(1+Math.sin(v+.8))*.5;
        ex=side*(.38+.09*higher);ey=shoulder-.19+.30*higher;ez=.04;
        wx=side*(.31+.17*higher)+.07*swing;wy=shoulder-.05+.58*higher;wz=.14+.10*(1-higher);
      }
      const E=[bodyX+ex,ey,bodyZ+ez],H=[bodyX+wx,wy,bodyZ+wz];
      link(a,E,.105,.081,jacket);link(E,H,.075,.055,skin);box(H[0],H[1],H[2],.105,.119,.11,skin);
      if(side===1&&gesture!=='scarf')box(H[0],H[1]-.073,H[2],.107,.043,.107,trim);
      hands.push(H);
    }
    const hand=hands[1],other=hands[0];
    if(gesture==='foam'){
      const [x,y,z]=hand;
      box(x,y+.12,z,.222,.26,.10,trim);box(x+.06,y+.34,z,.072,.26,.10,trim);box(x-.111,y+.17,z,.074,.13,.094,trim);
      box(x+.057,y+.353,z+.052,.019,.18,.006,ink);box(x,y+.099,z+.056,.082,.025,.008,ink);
    }else if(gesture==='scarf'){
      const y=(hand[1]+other[1])*.5,x=(hand[0]+other[0])*.5,z=hand[2];
      box(x,y+.065,z,.95,.136,.042,trim);for(const side of [-1,1]){box(x+side*.45,y-.059,z,.092,.19,.042,jacket);box(x+side*.319,y+.066,z+.025,.088,.136,.012,jacket);}
      box(x,y+.067,z+.026,.237,.032,.012,jacket);
    }else if(gesture==='sign'){
      const y=(hand[1]+other[1])*.5+.175,x=(hand[0]+other[0])*.5,z=hand[2]+.019;
      box(x,y,z,.91,.52,.048,'#4a3945');box(x,y,z+.029,.865,.464,.018,'#e8d68b');
      letters('WOO',x-.34,y+.119,z+.041,.047,'#3c303d');
    }else if(gesture==='bottle'&&frame<release){
      const [x,y,z]=hand,col=glassShades[style%2],bottom=y-.19;
      oval(x,bottom,z,glassProfile.slice(0,6).map(([h,r])=>[h,r,r]),col,7);
      oval(x,bottom,z,[[.372,.048,.048],[.40,.046,.046]],'#ead6a4',7);
      oval(x,bottom,z,[[.071,.089,.089],[.16,.089,.089]],'#f3cf82',7);
    }
    const out={faces,hand,other};models.set(key,out);return out;
  }
  // One 720×1008 sheet per seat posture contains all costumes and gestures.
  // The opaque renderers depth-test only the ink, so railings and hands can
  // cross in front of a neighbor without sorting entire grandstands.
  const cellW=60,cellH=84,cardW=1.78,cardH=2.75,padY=.048,sheets=[],atlasMats=[],shades=new Map();
  function geometry(model){
    if(model.geo)return model.geo;
    const xyz=[],rgb=[],norm=[],indices=[];
    for(const f of model.faces){
      const a=f.p[0],b=f.p[1],c=f.p[2],ax=b[0]-a[0],ay=b[1]-a[1],az=b[2]-a[2],bx=c[0]-a[0],by=c[1]-a[1],bz=c[2]-a[2];
      let nx=ay*bz-az*by,ny=az*bx-ax*bz,nz=ax*by-ay*bx;
      const n=Math.hypot(nx,ny,nz)||1;nx/=n;ny/=n;nz/=n;f.n=[nx,ny,nz];
      const col=color(f.c),base=xyz.length/3;
      for(const p of f.p){xyz.push(...p);rgb.push(col.r,col.g,col.b);norm.push(nx,ny,nz);}
      for(let i=1;i<f.p.length-1;i++)indices.push(base,base+i,base+i+1);
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(xyz,3));g.setAttribute('color',new T.Float32BufferAttribute(rgb,3));
    g.setAttribute('normal',new T.Float32BufferAttribute(norm,3));g.setIndex(indices);g.computeBoundingSphere();model.geo=g;return g;
  }
  function litInk(hex,intensity){
    const level=clamp(Math.round(intensity*18),3,22),key=hex+level;
    if(!shades.has(key)){
      const n=parseInt(hex.slice(1),16),s=level/18;
      const r=Math.min(255,Math.round((n>>16)*s)),g=Math.min(255,Math.round(((n>>8)&255)*s)),b=Math.min(255,Math.round((n&255)*s));
      shades.set(key,'rgb('+r+','+g+','+b+')');
    }
    return shades.get(key);
  }
  function atlas(seated){
    const idx=+seated;if(sheets[idx])return sheets[idx];
    const canvas=document.createElement('canvas');canvas.width=frames*cellW;canvas.height=wardrobe.length*cellH;
    const ctx=canvas.getContext('2d'),turn=.105,cs=Math.cos(turn),sn=Math.sin(turn);
    for(let style=0;style<wardrobe.length;style++)for(let k=0;k<frames;k++){
      const model=avatar(style,k,seated);geometry(model);
      const ox=(k+.5)*cellW,oy=(style+1)*cellH-(padY/cardH)*cellH;
      const faces=[];
      for(const f of model.faces){
        const a=f.n;if(a[0]*sn+a[1]*.07+a[2]*cs<-.04)continue;
        const depth=f.p.reduce((v,p)=>v+p[0]*sn+p[1]*.07+p[2]*cs,0)/f.p.length;
        faces.push([depth+(f.decal?.16:0),f]);
      }
      faces.sort((a,b)=>a[0]-b[0]);ctx.save();ctx.beginPath();ctx.rect(k*cellW,style*cellH,cellW,cellH);ctx.clip();
      for(const [,f] of faces){
        const n=f.n;ctx.fillStyle=litInk(f.c,.82+Math.max(0,-n[0]*.34+n[1]*.72+n[2]*.58)*.28);
        ctx.beginPath();for(let j=0;j<f.p.length;j++){
          const p=f.p[j],x=ox+(p[0]*cs-p[2]*sn)*cellW/cardW,y=oy-(p[1]-.07*p[2])*cellH/cardH;
          if(j)ctx.lineTo(x,y);else ctx.moveTo(x,y);
        }
        ctx.closePath();ctx.fill();
      }
      ctx.restore();
      // CPU hit locations and the GPU mesh stay cached; the drafting polygons
      // have finished both jobs and no longer need to occupy the JS heap.
      model.faces=null;
    }
    sheets[idx]=canvas;return canvas;
  }
  function actorMaterial(seated){
    const i=+seated;if(!atlasMats[i]){
      const tx=new T.CanvasTexture(atlas(seated));tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=2;
      atlasMats[i]=new T.MeshBasicMaterial({map:tx,side:T.DoubleSide,alphaTest:.14,toneMapped:false});
    }
    return atlasMats[i];
  }
  function holdBottle(k){return k<release?k:frames-1-k;}
  function cardFrame(f,k){
    const i=cycle((f.flair===4&&f.caster===undefined?k*2:k)+f.phase,frames);
    return f.caster===undefined&&wardrobe[f.style][6]==='bottle'?holdBottle(i):i;
  }
  function crowdCards(s,fans,seated){
    if(!fans.length)return null;
    const vertices=[],indices=[],at=[];
    for(const f of fans){
      const y=f.ly-padY*f.size,h=cardH*f.size,wide=cardW*f.size*.5,side=f.twist;
      // A shallow folded face gives a grazing driver a silhouette on both the
      // approach and departure. The near front rows switch to closed geometry.
      for(const [u,depth] of [[-.5,-.36],[0,.10],[.5,-.36]]){
        const xx=f.lx+2*u*wide+depth*Math.sin(side),zz=f.lz+depth*Math.cos(side);
        vertices.push(xx,y,zz,xx,y+h,zz);
      }
      const k=vertices.length/3-6;indices.push(k,k+2,k+3,k,k+3,k+1,k+2,k+4,k+5,k+2,k+5,k+3);
      at.push(f);
    }
    const pos=new T.Float32BufferAttribute(vertices,3),index=new T.Uint16BufferAttribute(indices,1),variants=[];
    for(let k=0;k<frames;k++){
      const uv=[];
      for(const f of at){
        const step=cardFrame(f,k),lo=step/frames,hi=(step+1)/frames;
        const v=1-(f.style+1)/wardrobe.length,vt=v+1/wardrobe.length;
        for(const u of [lo,(lo+hi)*.5,hi])uv.push(u,v,u,vt);
      }
      const geo=new T.BufferGeometry();geo.setAttribute('position',pos);geo.setIndex(index);
      geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.computeBoundingSphere();variants.push(geo);
    }
    const mesh=new T.Mesh(variants[0],actorMaterial(seated));mesh.name='Animated grandstand rows';return {mesh,variants};
  }
  function react(g,t,where,strength=1){
    const plan=g?.c?.crowd;if(!plan||!where||!Number.isFinite(t))return;
    const old=g.crowdReactions||[],arr=old.filter(e=>t-e.t<45);
    for(const s of plan.sections){
      const d=Math.hypot(s.x-where.x,s.z-where.z),range=70+22*Math.min(1.6,strength);
      if(d>range)continue;
      const start=t+.032+d*.0031,power=Math.min(1.3,Math.max(0,strength))*(1-.69*d/range);
      if(power<.10)continue;
      // Keep an earlier reaction immutable: an adjacent landing or horn is
      // audible from its own timestamp, including when this lap is replayed.
      let last=null;for(let i=arr.length-1;i>=0;i--)if(arr[i].id===s.id){last=arr[i];break;}
      if(last&&Math.abs(last.t-start)<.46&&power<last.power+.10)continue;
      arr.push({id:s.id,t:start,power,salt:hash(s.seed+Math.round(t*9))});
    }
    g.crowdReactions=arr;
  }
  function energy(g,s,t){
    let power=0;for(const e of g?.crowdReactions||[]){
      const age=t-e.t;if(e.id!==s.id||age<0||age>4.0)continue;
      power+=e.power*Math.min(1,.30+age*7.7)*Math.exp(-Math.max(0,age-.27)*.91);
    }
    return Math.min(1,power);
  }
  function eventFor(g,s,t){const events=g?.crowdReactions||[];for(let i=events.length-1;i>=0;i--){
    const ev=events[i],u=t-ev.t;if(ev.id===s.id&&u>=0&&u<2.55)return ev;}return null;}
  function step(s,t,energy,reduced){return reduced?0:Math.floor(t*beat+s.phase+energy*1.45);}
  function cueDelay(f){return .05+(f.caster??(f.seed%3))*.23;}
  function poseFrame(s,f,t,k,reactive,reduced){
    if(reduced)return cardFrame(f,0);
    if(f.caster===undefined)return cardFrame(f,k);
    if(reactive){
      const age=t-reactive.t-cueDelay(f);
      if(age>=0&&age<1.13)return clamp(Math.floor(age*10)+2,0,frames-1);
    }
    const tick=Math.floor(t*beat+s.phase)+f.phase,frame=cycle(tick,frames);
    const actualToss=cycle(Math.floor(tick/frames)+f.caster+s.phase,s.stand?4:3)===0;
    return actualToss?frame:holdBottle(frame);
  }
  function throwFrom(s,f,frame){
    const hands=f.worldHands||(f.worldHands=[]);if(hands[frame])return hands[frame];
    const local=avatar(f.style,frame,f.seated).hand,cs=Math.cos(s.yaw+f.twist),sn=Math.sin(s.yaw+f.twist),a=f.size;
    return hands[frame]=[f.x+(local[0]*cs+local[2]*sn)*a,f.y+local[1]*a,f.z+(-local[0]*sn+local[2]*cs)*a];
  }
  function projectiles(plan,g,t,eye,emit){
    // Sample the last two seconds of the known release schedule, without
    // spawning or integrating mutable particles. An instant replay reconstructs
    // the exact throw, including the instant the glass leaves the hand.
    const addToss=(s,f,born,salt,confetti,power)=>{
      const age=t-born;if(age<0||age>2.72)return;
      const frame=confetti?poseFrame(s,f,born,step(s,born,energy(g,s,born),false),eventFor(g,s,born),false):release;
      const [sx,sy,sz]=throwFrom(s,f,frame);
      if(confetti){
        for(let i=0;i<Math.round(14+14*power);i++){
          const key=hash(salt+i*47),a=unit(key+2)*tau,drift=1.1+unit(key+3)*2.8,up=4.1+unit(key+4)*3.7+power;
          const forward=age*(1.3+unit(key+7)),y=sy+up*age-3.14*age*age;
          if(y<s.oy+.2)continue;
          const spin=age*(5+unit(key+22)*8)+a,flutter=.26*Math.sin(spin)*age;
          emit('paper',sx+s.sn*forward+Math.cos(a)*(drift*age+flutter),y,sz+s.cs*forward+Math.sin(a)*drift*age,.11+.10*unit(key+8),spin,a,key%prizes.length);
        }
      }else{
        const across=(unit(salt+1)-.5)*4.7,forward=2.5+unit(salt+2)*2.6+power*1.0,up=5.2+unit(salt+3)*2.5+.85*power;
        const y=sy+up*age-4.55*age*age;if(y<s.oy+.11)return;
        emit('bottle',sx+(s.cs*across+s.sn*forward)*age,y,sz+(-s.sn*across+s.cs*forward)*age,f.size,.12+age*(6+5*unit(salt+5)),s.yaw+age*(2+unit(salt+6)),f.style%2);
      }
    };
    for(const s of plan.sections){
      if((s.x-eye.x)**2+(s.z-eye.z)**2>112**2)continue;
      for(const [j,f] of s.casters.entries()){
        const shift=f.phase+s.phase,beatNumber=Math.floor((t*beat+shift-release)/frames),stride=s.stand?4:3;
        for(const n of [beatNumber,beatNumber-1]){
          if(cycle(n+j+s.phase,stride)!==0)continue;
          const born=(n*frames+release-shift)/beat;
          // An event windup owns this arm until its follow-through finishes.
          const override=eventFor(g,s,born),windup=override?born-override.t-cueDelay(f):-1;
          if(born>=0&&(windup<0||windup>=1.13))addToss(s,f,born,hash(f.seed+n*71),false,.28);
        }
      }
      // The front row tears tickets into the air in an alternating refrain.
      for(const [j,f] of s.clappers.entries()){
        const period=4.35+j*.39,offset=(j*.73+s.phase*.51)%period,n=Math.floor((t-offset)/period);
        const born=n*period+offset;if(born>=0)addToss(s,f,born,hash(f.seed+91*n),true,.28);
      }
      for(const e of g?.crowdReactions||[]){
        if(e.id!==s.id||t-e.t<0||t-e.t>3.60)continue;
        for(const [i,f] of s.casters.entries()){
          const born=e.t+cueDelay(f)+(release-2)/10;
          if(eventFor(g,s,born)===e)addToss(s,f,born,hash(e.salt+i*141),false,e.power);
        }
        for(let i=0;i<Math.min(s.clappers.length,e.power>.42?3:1);i++)
          addToss(s,s.clappers[i],e.t+.24+i*.25,hash(e.salt+30+i*89),true,e.power);
      }
    }
  }
  function fence(root,s){
    const art=MTMOddities.art,b=art.builder(root),half=s.frontWidth*.5,steel='#65778d',edge='#acbac6';
    for(let r=0;r<s.rows;r++){
      b.box([0,r*.29+.045,-r*.83],[s.frontWidth+.12,.12,.84],r%2?'#495267':'#535b72');
      b.box([0,r*.29+.02,-r*.83+.41],[s.frontWidth+.12,.13,.045],ink);
    }
    for(let x=-half+.14;x<half+.1;x+=Math.max(1,(s.frontWidth-.28)/3)){
      b.rod([x,.02,.67],[x,1.04,.67],.058,.055,steel,false,5);b.box([x,.06,.66],[.30,.12,.37],ink);
    }
    for(const y of [.31,.91])b.rod([-half,y,.67],[half,y,.67],.040,.040,y>.6?edge:steel,false,5);
    for(const x of [-half+.10,half-.10]){
      b.rod([x,.02,-(s.rows-1)*.83],[x,1.28,-(s.rows-1)*.83],.055,.052,steel,false,5);
      b.rod([x,.94,.64],[x,1.28,-(s.rows-1)*.83],.040,.040,edge,false,5);
    }
    b.box([0,.48,.70],[Math.min(3.25,s.frontWidth*.66),.58,.060],ink);
    b.box([0,.79,.71],[Math.min(3.3,s.frontWidth*.67),.048,.065],s.ink,null,true);b.finish();
    art.label(root,s.name.toUpperCase(),s.crew.toUpperCase()+'  /  SUPPORTERS CLUB',Math.min(3.16,s.frontWidth*.61),.55,.48,.742,s.ink);
  }
  function glass(colorIndex){
    const faces=[],col=glassShades[colorIndex],shape=glassProfile;
    const ring=(k,i)=>{const a=(i+.5)*tau/7;return [Math.sin(a)*shape[k][1],shape[k][0]-.19,Math.cos(a)*shape[k][1]];};
    faces.push({p:Array.from({length:7},(_,i)=>ring(0,6-i)),c:col},
      {p:Array.from({length:7},(_,i)=>ring(shape.length-1,i)),c:'#ead6a4'});
    for(let j=1;j<shape.length;j++)for(let v=0;v<7;v++){
      faces.push({p:[ring(j-1,v),ring(j-1,v+1),ring(j,v+1),ring(j,v)],c:j===6?'#e1cc92':col});
    }
    for(const [lo,hi,rad,shade] of [[.071,.133,.089,'#f3cf82'],[.134,.16,.089,'#bc6d54']]){
      for(let i=0;i<7;i++){const a=(i+.5)*tau/7,b=(i+1.5)*tau/7;
        faces.push({p:[[Math.sin(a)*rad,lo-.19,Math.cos(a)*rad],[Math.sin(b)*rad,lo-.19,Math.cos(b)*rad],
          [Math.sin(b)*rad,hi-.19,Math.cos(b)*rad],[Math.sin(a)*rad,hi-.19,Math.cos(a)*rad]],c:shade});}
    }
    return geometry({faces});
  }
  function attach(world,plan){
    const art=MTMOddities.art,rigs=[],pool=new Map(),body=new T.Object3D(),limits=new Map();
    const neighborhood=art.node(world);neighborhood.name='Night Shift supporters and airborne concessions';
    for(const s of plan.sections){
      const root=art.node(neighborhood,s.ox,s.oy,s.oz);root.rotation.y=s.yaw;root.name=s.name;
      if(!s.stand)fence(root,s);
      const cards=[],front=s.fans.filter(f=>f.front);
      for(const near of [false,true])for(const seated of [false,true]){
        const line=crowdCards(s,s.fans.filter(f=>f.front===near&&f.seated===seated),seated);
        if(line){root.add(line.mesh);cards.push({...line,front:near});}
      }
      for(const f of front){const k=f.style*2+(+f.seated);limits.set(k,(limits.get(k)||0)+1);}
      rigs.push({s,root,cards,front});
    }
    const paper=new T.InstancedMesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({color:0xffffff,side:T.DoubleSide,toneMapped:false}),600);
    const bottles=[0,1].map(i=>new T.InstancedMesh(glass(i),matte,48)),inks=prizes.map(n=>color(n));
    for(const [i,m] of [paper,...bottles].entries()){
      m.name=i?'Beer bottles in flight':'Fan-thrown confetti';m.count=0;m.frustumCulled=false;
      m.instanceMatrix.setUsage(T.DynamicDrawUsage);neighborhood.add(m);
    }
    // Only foreground figures need individual meshes. Each (costume, pose)
    // shares a single instanced draw across every nearby section and replay.
    function actor(s,f,k){
      const key=(f.style*frames+k)*2+(+f.seated);
      let mesh=pool.get(key);
      if(!mesh){
        mesh=new T.InstancedMesh(geometry(avatar(f.style,k,f.seated)),matte,limits.get(f.style*2+(+f.seated))||1);
        mesh.name=wardrobe[f.style][6]+' supporter';mesh.count=0;mesh.frustumCulled=false;
        mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);neighborhood.add(mesh);pool.set(key,mesh);
      }
      body.position.set(f.x,f.y,f.z);body.rotation.set(0,s.yaw+f.twist,0);body.scale.setScalar(f.size);
      body.updateMatrix();mesh.setMatrixAt(mesh.count++,body.matrix);
    }
    function update(g,t,eye,reduced){
      for(const m of pool.values())m.count=0;
      for(const {s,root,cards,front} of rigs){
        const dst=(s.x-eye.x)**2+(s.z-eye.z)**2;root.visible=dst<235**2;if(!root.visible)continue;
        const proximity=dst<(s.stand?35:39)**2,excitement=reduced?0:energy(g,s,t),reactive=reduced?null:eventFor(g,s,t);
        const k=step(s,t,excitement,reduced),frame=cycle(k,frames);
        for(const c of cards){c.mesh.visible=!(c.front&&proximity);if(c.mesh.visible)c.mesh.geometry=c.variants[frame];}
        if(proximity)for(const f of front)actor(s,f,poseFrame(s,f,t,k,reactive,reduced));
      }
      for(const m of pool.values()){m.visible=m.count>0;if(m.visible)m.instanceMatrix.needsUpdate=true;}
      paper.count=0;for(const m of bottles)m.count=0;
      if(!reduced)projectiles(plan,g,t,eye,(type,x,y,z,size,spin,turn,tint)=>{
        body.position.set(x,y,z);
        if(type==='bottle'){
          const m=bottles[tint];if(m.count>=48)return;
          body.rotation.set(spin*.85,turn,spin,'YXZ');body.scale.setScalar(size);body.updateMatrix();m.setMatrixAt(m.count++,body.matrix);
        }else if(paper.count<600){
          body.rotation.set(spin,turn+spin*.35,spin*.67,'YXZ');body.scale.set(size*.65,size,1);
          body.updateMatrix();paper.setColorAt(paper.count,inks[tint]);paper.setMatrixAt(paper.count++,body.matrix);
        }
      });
      for(const m of [paper,...bottles]){m.visible=!!m.count;if(m.visible)m.instanceMatrix.needsUpdate=true;}
      if(paper.count)paper.instanceColor.needsUpdate=true;
    }
    return {update};
  }
  function draw(ctx,plan,g,t,eye,reduced,proj,prim,focus,w,h){
    // The emergency renderer paints the same surveyed rows and character
    // frames. Split each stand by rows so props and trucks can occlude it.
    function quad(s,points,shade){
      const corners=points.map(v=>proj(...basis(s,...v)));if(corners.some(p=>!p))return;
      prim.push({d:corners.reduce((a,b)=>a+b.d,0)/4,fn(){ctx.fillStyle=shade;ctx.beginPath();for(let i=0;i<corners.length;i++){const p=corners[i];if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);}ctx.closePath();ctx.fill();}});
    }
    for(const s of plan.sections){
      const d=(s.x-eye.x)**2+(s.z-eye.z)**2;if(d>180**2)continue;
      const test=proj(s.x,s.y+2,s.z);if(!test&&d>40**2)continue;
      if(test&&(test.x+focus*s.frontWidth/test.d<0||test.x-focus*s.frontWidth/test.d>w))continue;
      const k=step(s,t,reduced?0:energy(g,s,t),reduced),e=reduced?null:eventFor(g,s,t),half=s.frontWidth*.5;
      for(let j=0;j<s.rows;j++){
        const y=s.stand?.74+j*.68:j*.29+.09,z=s.stand?-j*1.24:-j*.83,deep=s.stand?.64:.43;
        quad(s,[[-half,y,z+deep],[half,y,z+deep],[half,y,z-deep],[-half,y,z-deep]],s.stand?'#778196':'#51596b');
        quad(s,[[-half,y-.19,z+deep],[half,y-.19,z+deep],[half,y,z+deep],[-half,y,z+deep]],s.stand?'#545f74':'#3b4354');
      }
      const rail=s.stand?1.09:.68;
      for(const level of [.31,.93])quad(s,[[-half,level-.025,rail],[half,level-.025,rail],[half,level+.025,rail],[-half,level+.025,rail]],'#a4b6c5');
      for(let x=-half+.12;x<half+.1;x+=(s.frontWidth-.24)/(s.stand?10:3))quad(s,[[x-.045,.03,rail],[x+.045,.03,rail],[x+.045,1.03,rail],[x-.045,1.03,rail]],'#7a879c');
      if(!s.stand&&(eye.x-s.x)*s.sn+(eye.z-s.z)*s.cs>0){
        const span=Math.min(3.16,s.frontWidth*.61)/2;
        const ul=proj(...basis(s,-span,.775,.755)),ur=proj(...basis(s,span,.775,.755)),ll=proj(...basis(s,-span,.20,.755));
        if(ul&&ur&&ll){
          if(!s.banner){
            const badge=document.createElement('canvas');badge.width=400;badge.height=70;const b=badge.getContext('2d');
            b.fillStyle=ink;b.fillRect(0,0,400,70);b.fillStyle=s.ink;b.fillRect(0,0,400,4);b.fillRect(0,66,400,4);
            b.textAlign='center';b.fillStyle=bone;b.font='bold italic 31px Georgia,serif';b.fillText(s.name.toUpperCase(),200,37,385);
            b.fillStyle=s.ink;b.font='bold 13px sans-serif';b.fillText(s.crew.toUpperCase()+'  /  SUPPORTERS CLUB',200,57);s.banner=badge;
          }
          prim.push({d:(ul.d+ur.d)/2-.03,fn(){ctx.save();ctx.transform((ur.x-ul.x)/400,(ur.y-ul.y)/400,(ll.x-ul.x)/70,(ll.y-ul.y)/70,ul.x,ul.y);ctx.drawImage(s.banner,0,0);ctx.restore();}});
        }
      }
      for(const f of s.fans){
        const q=proj(f.x,f.y,f.z);if(!q)continue;const size=focus/q.d*f.size,ww=cardW*size,hh=cardH*size;
        if(q.x+ww/2<0||q.x-ww/2>w||q.y+size*.1<0||q.y-hh>h)continue;
        const frame=poseFrame(s,f,t,k,e,reduced),img=atlas(f.seated);
        prim.push({d:q.d-.03,fn(){ctx.drawImage(img,frame*cellW,f.style*cellH,cellW,cellH,q.x-ww*.5,q.y-hh+padY*size,ww,hh);}});
      }
    }
    if(!reduced)projectiles(plan,g,t,eye,(type,x,y,z,size,spin,turn,tint)=>{
      const q=proj(x,y,z);if(!q||q.x<0||q.x>w||q.y<0||q.y>h)return;
      const k=size*focus/q.d;prim.push({d:q.d,fn(){ctx.save();ctx.translate(q.x,q.y);ctx.rotate(spin);
        if(type==='bottle'){
          ctx.fillStyle=tint?'#a86b38':'#48936d';ctx.beginPath();ctx.moveTo(-k*.041,-k*.21);ctx.lineTo(k*.041,-k*.21);
          ctx.lineTo(k*.04,-k*.083);ctx.lineTo(k*.085,-k*.042);ctx.lineTo(k*.085,k*.19);ctx.lineTo(-k*.085,k*.19);ctx.lineTo(-k*.085,-k*.042);ctx.lineTo(-k*.04,-k*.083);ctx.closePath();ctx.fill();
          ctx.fillStyle='#efd494';ctx.fillRect(-k*.081,k*.015,k*.162,k*.091);ctx.fillRect(-k*.048,-k*.215,k*.096,k*.028);
        }else{ctx.fillStyle=prizes[tint];ctx.fillRect(-k*.31,-k*.5,k*(.18+.45*Math.abs(Math.cos(turn+spin))),k);}
        ctx.restore();}});
    });
  }
  return {plan,attach,draw,react,energy,projectiles};
})();
