/* 2389 Research Night Shift fleet: original monster-truck meshes, mechanical detail, and painted race graphics.
   Coordinates are in metres. +Z is forward and +Y is up. */
import { MTMKit } from './kit.js';

const MTMTrucks = (() => {
  'use strict';
  const T = THREE;
  const roster = [
    {name:'BIGFOOT',color:'#68f7dd',number:'01',ink:'#132646',paint:'#29497e',highlight:'#3c649d',accent:'#89ffe0',trim:'#f858a6',lamp:'#cafff0'},
    {name:'Grave Digger',color:'#ca8dff',number:'07',ink:'#281831',paint:'#51325e',highlight:'#82538b',accent:'#efddc4',trim:'#ff53aa',lamp:'#f8a9ff'},
    {name:'Snake Bite',color:'#b2fb55',number:'08',ink:'#103a38',paint:'#206355',highlight:'#397c6a',accent:'#c8ff6e',trim:'#43dfb0',lamp:'#e9ffad'},
    {name:'Carolina Crusher',color:'#ff5595',number:'12',ink:'#5c223d',paint:'#a12f5b',highlight:'#d24978',accent:'#ffc263',trim:'#ff61a0',lamp:'#ffdf99'},
    {name:'Mux Switchblade',color:'#35f3cf',number:'23',ink:'#102938',paint:'#166a75',highlight:'#8be7cf',accent:'#75ffe3',trim:'#e65798',lamp:'#fff2b0'},
    {name:'Orrery Orbital',color:'#ce9aff',number:'89',ink:'#342944',paint:'#755197',highlight:'#f0c881',accent:'#d1a5ff',trim:'#78ecfa',lamp:'#f9e7ff'},
    {name:'Soloclaw',color:'#ff815e',number:'38',ink:'#3c2229',paint:'#ac453e',highlight:'#ff895e',accent:'#cfff8c',trim:'#fcad51',lamp:'#ffebac'}
  ];
  const sideZ = 2.78, sideTop = 3.46, sideBottom = 1.24;
  const bodyPivot = 1.45;
  const panels = {
    right:[0,0,2048,512], left:[0,512,2048,512],
    front:[0,1024,1024,350], rear:[1024,1024,1024,350],
    hood:[0,1374,810,674], roof:[810,1374,520,674], bed:[1330,1374,718,674]
  };
  const caches = new Map(), skins = new Map(), wheelShapes = new Map();
  const paintMaterial = new T.MeshPhongMaterial({ vertexColors:true, shininess:24, specular:0x32343a });
  const metalMaterial = new T.MeshPhongMaterial({ vertexColors:true, shininess:65, specular:0x8d99a5 });
  const glassMaterial = new T.MeshPhongMaterial({ vertexColors:true, shininess:85, specular:0x7397ac });
  const colorPool = new Map();
  const colored = hex => {
    if (typeof hex !== 'string' && typeof hex !== 'number') return hex;
    if (!colorPool.has(hex)) colorPool.set(hex,new T.Color(hex));
    return colorPool.get(hex);
  };
  const uvPanel = (panel,u,v) => [(panel[0]+2+(panel[2]-4)*u)/2048,1-(panel[1]+2+(panel[3]-4)*v)/2048];
  const sideUV = (p,s) => uvPanel(s===1?panels.right:panels.left,(sideZ-s*p[2])/(sideZ*2),(sideTop-p[1])/(sideTop-sideBottom));
  function panelDraw(ctx,r,w,h,draw) {
    ctx.save(); ctx.beginPath(); ctx.rect(r[0],r[1],r[2],r[3]); ctx.clip();
    ctx.translate(r[0],r[1]); ctx.scale(r[2]/w,r[3]/h); draw(ctx); ctx.restore();
  }
  function poly2(c,points,fill,stroke,width=1) {
    c.beginPath(); points.forEach(([x,y],i) => i?c.lineTo(x,y):c.moveTo(x,y)); c.closePath();
    if(fill){c.fillStyle=fill;c.fill();} if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
  }
  function type(c,str,x,y,size,fill,stroke=null,line=1,stretch=1,italic=true) {
    c.save();c.translate(x,y);c.scale(stretch,1);if(italic)c.transform(1,0,-0.15,1,0,0);
    c.font='900 '+size+'px Arial Black, DejaVu Sans, Arial, sans-serif';c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';
    if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.strokeText(str,0,0);}
    c.fillStyle=fill;c.fillText(str,0,0);c.restore();
  }
  function flame(c,x,y,sz,w,fill) {
    c.save(); c.translate(x,y); c.scale(w,sz); c.beginPath(); c.moveTo(0,0);
    c.bezierCurveTo(0.27,-0.11,0.14,-0.59,0.62,-0.62);
    c.bezierCurveTo(0.48,-0.45,0.45,-0.36,0.56,-0.32);
    c.bezierCurveTo(0.74,-0.62,0.74,-0.92,1,-1);
    c.bezierCurveTo(0.82,-0.66,1.01,-0.47,0.80,-0.2);
    c.bezierCurveTo(0.88,-0.23,0.98,-0.26,1,-0.40);c.bezierCurveTo(1.04,-0.18,0.88,0.1,0.56,0.14);
    c.closePath();c.fillStyle=fill;c.fill();c.restore();
  }
  // An angular four-digit race mark. The counters in 8 and 9 are cut through
  // the paint, so this mark works on the door, roof and dark tailgate plate.
  const fleetDigits=[
    [[[0,1.4],[1.4,0],[5.75,0],[6.65,.95],[6.65,3.52],[5.72,4.53],[2.08,6.62],[6.53,6.62],[6.53,8.14],[0,8.14],[0,6.35],[4.79,3.45],[4.79,1.61],[2.24,1.61],[1.83,2.02],[1.83,2.65],[0,2.65]]],
    [[[.12,1.12],[1.45,0],[5.7,0],[6.55,.86],[6.55,3.3],[5.57,4.08],[6.52,4.82],[6.52,7.15],[5.43,8.14],[1.05,8.14],[.02,7.16],[.02,6.1],[1.92,6.1],[1.92,6.56],[4.57,6.56],[4.57,4.85],[1.94,4.85],[1.94,3.39],[4.57,3.39],[4.57,1.60],[2,1.60],[2,2.19],[.12,2.19]]],
    [[[1.15,0],[5.48,0],[6.50,1.03],[6.50,3.1],[5.72,4.01],[6.55,4.79],[6.55,7.1],[5.49,8.14],[1.07,8.14],[0,7.09],[0,4.77],[.83,4.01],[.04,3.2],[.04,1.06]],[[2,1.48],[4.56,1.48],[4.56,3.2],[2,3.2]],[[1.93,4.85],[4.63,4.85],[4.63,6.66],[1.93,6.66]]],
    [[[1.16,0],[5.45,0],[6.55,1.02],[6.55,7.05],[5.46,8.14],[1.13,8.14],[.12,7.13],[.12,6.12],[2.05,6.12],[2.05,6.58],[4.52,6.58],[4.52,4.92],[1.02,4.92],[0,3.86],[0,1.08]],[[1.98,1.52],[4.50,1.52],[4.50,3.37],[1.98,3.37]]]
  ];
  function fleetMark(c,x,y,h,ink){
    c.save();c.translate(x,y);c.scale(h/8.14,h/8.14);c.transform(1,0,-.15,1,0,0);c.translate(-14.76,-4.07);
    c.fillStyle=ink;
    for(const digit of fleetDigits){
      c.beginPath();for(const ring of digit){ring.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.closePath();}c.fill('evenodd');c.translate(7.67,0);
    }
    c.restore();
  }
  function trace(c,points,ink,width){
    c.strokeStyle=ink;c.lineWidth=width;c.lineJoin='miter';c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();
  }
  // Painted electronics on Digger's long rear quarter: a bone mask, magenta
  // afterimage, and an etched skyline of headstones on the lower van panel.
  function skull(c,x,y,h,face,outline){
    c.save();c.translate(x,y);c.scale(h/100,h/100);
    const shell=[[-39,9],[-44,-9],[-39,-30],[-26,-47],[-5,-53],[19,-50],[36,-38],[46,-14],[42,7],[31,16],[27,30],[17,31],[14,46],[-8,49],[-17,37],[-25,36],[-27,20]];
    poly2(c,shell,outline);c.save();c.translate(-4,-3);poly2(c,shell,face);
    poly2(c,[[-29,-21],[-7,-14],[-13,0],[-26,-2],[-32,-11]],'#21172c');poly2(c,[[7,-14],[30,-25],[32,-12],[23,-2],[12,0]],'#25152e');
    poly2(c,[[-1,0],[5,1],[10,18],[-5,19]],'#422a4c');c.fillStyle='#fff3d2';c.fillRect(-24,-12,11,2);c.fillStyle=outline;c.fillRect(13,-12,13,2);
    for(let i=0;i<4;i++)trace(c,[[-13+i*8,29],[-9+i*8,45]],'#66465f',2.3);
    c.restore();c.restore();
  }
  function sideSponsor(c,x,y,t){
    fleetMark(c,x,y-5,23,t.accent);type(c,'R E S E A R C H',x,y+15,11,'#e6f1ee',null,1,.97,false);
  }
  function drawSide(c,id,s) {
    const w=1180,h=460,t=roster[id],pos=z=>(sideZ-s*z)/(2*sideZ)*w,py=y=>(sideTop-y)/(sideTop-sideBottom)*h;
    const grad=c.createLinearGradient(0,80,0,h);
    grad.addColorStop(0,t.highlight);grad.addColorStop(.36,t.paint);grad.addColorStop(.70,t.ink);grad.addColorStop(1,'#111925');
    c.fillStyle=grad;c.fillRect(0,0,w,h);
    // Body stripes face the nose on each side. Typesetting is applied after the
    // reflection so both doors and both rear quarters always read normally.
    c.save();if(s===1){c.translate(w,0);c.scale(-1,1);}
    if(id===0){
      poly2(c,[[0,240],[266,250],[411,285],[666,285],[797,232],[1180,192],[1180,263],[847,273],[698,322],[464,322],[315,299],[0,284]],'#24518b');
      poly2(c,[[0,286],[266,278],[390,316],[671,317],[794,264],[1180,223],[1180,240],[813,283],[691,339],[390,337],[261,299],[0,306]],'#2aa5b9');
      trace(c,[[0,299],[264,291],[391,326],[681,327],[808,273],[1180,232]],'#87ffe0',6);
      trace(c,[[0,333],[286,321],[416,360],[701,353],[828,299],[1180,254]],'#ed4a99',4.7);
      poly2(c,[[0,356],[286,337],[414,381],[716,369],[849,317],[1180,280],[1180,294],[857,330],[711,387],[391,402],[279,363],[0,379]],'#263e67');
      for(let i=0;i<4;i++)poly2(c,[[869+i*31,322],[890+i*31,319],[875+i*31,337],[856+i*31,340]],i===3?t.trim:t.accent);
    }else if(id===1){
      const mist=c.createLinearGradient(0,94,560,318);mist.addColorStop(0,'#281b3d');mist.addColorStop(.45,'#814082');mist.addColorStop(1,'#2b1844');c.fillStyle=mist;c.fillRect(0,68,590,284);
      const moon=c.createLinearGradient(0,70,0,190);moon.addColorStop(0,'#f6d8ce');moon.addColorStop(1,'#ed71a7');c.fillStyle=moon;c.beginPath();c.arc(145,140,50,0,Math.PI*2);c.fill();
      for(let i=0;i<7;i++){c.fillStyle='#713d78';c.fillRect(92,143+i*6,106,.6+i*.42);}
      for(let i=0;i<10;i++){
        const x=12+i*50,hg=12+(i*13)%28,ww=11+i%3*3;c.fillStyle=i%2?'#31203d':'#251d36';c.fillRect(x,314-hg,ww*2,hg);c.beginPath();c.arc(x+ww,314-hg,ww,Math.PI,Math.PI*2);c.fill();
        if(i%3===1){c.fillRect(x+ww-2,282-hg,4,24);c.fillRect(x+ww-10,286-hg,19,4);}
      }
      for(let i=0;i<4;i++)trace(c,[[25,235+i*8],[134+i*12,235+i*8],[178+i*12,186+i*8],[250,186+i*8]],i%2?'#925aa6':'#d767b0',i===2?3:1.5);
      skull(c,312,183,141,'#e4d5c3','#fb55aa');
      for(let i=0;i<12;i++){
        const x=581+i*52,y=345-13*Math.sin(i*.7),ht=35+4*i+12*Math.sin(i*1.65);
        flame(c,x,y,ht,59,'#854cc1');flame(c,x+2,y,ht*.70,51,'#ff4baf');flame(c,x+4,y,ht*.34,35,'#f8c1cc');
      }
      trace(c,[[0,324],[355,318],[461,346],[620,347],[923,315],[1180,311]],'#b16fe3',6);
    }else if(id===2){
      for(let row=0;row<7;row++)for(let i=0;i<23;i++){
        const bx=i*54+(row%2)*27,by=105+row*33;
        poly2(c,[[bx,by],[bx+34,by-2],[bx+48,by+12],[bx+21,by+31],[bx+3,by+18]],(i+row*3)%5===0?'#2a8071':'#1d675f','#164d4b',2);
      }
      poly2(c,[[0,331],[167,316],[277,258],[324,285],[423,311],[557,285],[706,305],[849,250],[921,266],[1180,218],[1180,239],[923,290],[852,277],[716,329],[553,308],[415,337],[301,309],[279,285],[177,338],[0,356]],'#86ed51');
      trace(c,[[0,342],[170,328],[278,270],[305,297],[417,324],[553,296],[712,317],[850,263],[920,278],[1180,229]],'#d2ff7a',4);
      trace(c,[[0,371],[174,348],[277,302],[300,320],[417,350],[556,326],[721,348],[855,293],[923,308],[1180,253]],'#39d8b0',4.2);
      poly2(c,[[1004,260],[1056,240],[1146,243],[1092,272],[1039,277]],'#102d30','#68dba7',3);
      poly2(c,[[1043,258],[1112,246],[1092,259],[1056,266]],'#d6ff72');poly2(c,[[1080,252],[1085,252],[1080,261],[1076,263]],'#151d24');
    }else{
      poly2(c,[[0,232],[418,242],[598,287],[751,279],[1010,207],[1180,209],[1180,240],[1032,242],[758,316],[577,326],[403,281],[0,269]],'#f23883');
      poly2(c,[[0,283],[410,283],[563,332],[750,315],[1038,242],[1180,242],[1180,272],[1047,272],[756,348],[557,368],[402,318],[0,319]],'#ffac40');
      trace(c,[[0,314],[407,311],[559,359],[756,341],[1045,266],[1180,265]],'#ffe0a0',4);
      for(let i=0;i<7;i++)poly2(c,[[23+i*35,291],[41+i*35,291],[28+i*35,307],[11+i*35,307]],'#5f263a');
      for(let i=0;i<4;i++)poly2(c,[[915+i*47,317],[940+i*47,311],[913+i*47,347],[889+i*47,352]],i===3?'#ffbc49':'#f25495');
    }
    c.restore();
    // Geometry boundaries are drawn in the paint atlas, with the 2389 serial
    // below the window line where the door remains visible at race distance.
    const seam=points=>trace(c,points.map(([z,y])=>[pos(z),py(y)]),'rgba(5,11,24,.74)',2.7);
    seam([[-.75,2.4],[-.76,1.64],[-.65,1.56],[.61,1.56],[.69,1.68],[.77,2.32]]);
    if(id!==1)seam([[-.92,2.23],[-.96,1.55]]);
    const cx=pos(-.04),cy=py(2.04),rear=pos(-1.75);
    if(id===0){
      c.save();c.translate(cx,cy);poly2(c,[[-163,-56],[144,-56],[169,-36],[136,47],[-158,47],[-174,32]],'#132748');
      poly2(c,[[-163,-56],[-61,-56],[-68,-51],[-165,-51]],'#fb529e');fleetMark(c,0,-2,74,t.accent);
      type(c,'R E S E A R C H',0,46,21,'#bdf4f0','#152c49',2,.98,false);c.restore();
      type(c,'BIGFOOT',rear,py(2.095),32,'#e6f6ee','#142943',4,1.07);
    }else{
      if(id===1){type(c,'GRAVE',cx,cy-19,48,'#e2cae8','#251932',8,.98);type(c,'DIGGER',cx,cy+21,49,'#f4deca','#30182f',7,.98);}
      else if(id===2){type(c,'SNAKE BITE',cx,cy-2,50,'#ddffaf','#0e3733',8,.92);}
      else{type(c,'CAROLINA',cx,cy-17,34,'#ffe1a0','#5e2033',6,1.02);type(c,'CRUSHER',cx,cy+18,48,'#fff1da','#601f34',7,1.04);}
      sideSponsor(c,rear,py(id===1?2.10:2.085),t);
    }
    c.fillStyle='#111d29';c.fillRect(pos(-.54)-10,py(2.29),21,5);c.fillStyle='#a6c1cb';c.fillRect(pos(-.54)-9,py(2.29),18,1.45);
    type(c,t.number,pos(2.35),py(2.095),22,'#e9ecec','#192330',3.5,.98,false);
    const sp=pos(.81);for(let i=0;i<3;i++){c.fillStyle=i===1?t.trim:t.accent;c.fillRect(sp-10+i*7,py(1.90),4,12-i*2);}
  }
  function drawFace(c,id,front){
    const t=roster[id],w=670,h=240,g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,t.highlight);g.addColorStop(.43,t.paint);g.addColorStop(1,t.ink);c.fillStyle=g;c.fillRect(0,0,w,h);
    if(front){
      c.fillStyle='#15222b';c.fillRect(39,51,592,109);
      for(let i=0;i<(id===1?15:7);i++){
        if(id===1){const x=139+i*27;c.fillStyle=i%2?'#99adb5':'#6d7c8e';c.fillRect(x,62,6,85);}
        else{const y=60+i*13;c.fillStyle=i%2?'#768e9a':'#576d7e';c.fillRect(167,y,334,3.5);c.fillStyle='#2c373f';c.fillRect(170,y+4,328,2);}
      }
      c.fillStyle='#111b26';c.fillRect(287,78,96,41);fleetMark(c,335,99,19,t.accent);c.fillStyle=t.trim;c.fillRect(290,119,90,2);
      if(id===2){for(let x=45;x<625;x+=48)poly2(c,[[x,146],[x+14,160],[x+30,145]],'#dce6ad');}
      for(const x of [83,567]){c.fillStyle=t.accent;c.fillRect(x,174,23,3);}
    }else{
      poly2(c,[[49,47],[72,27],[612,27],[626,42],[615,174],[596,193],[65,193],[49,177]],'#15212e','#526171',4);
      trace(c,[[78,48],[111,48],[122,38],[307,38]],t.trim,3);trace(c,[[336,169],[558,169],[576,153],[600,153]],t.accent,3);
      fleetMark(c,209,100,55,t.accent);type(c,'R E S E A R C H',209,149,20,'#d5eeec',null,1,1.06,false);
      trace(c,[[322,65],[305,155]],'#586777',2.4);
      if(id===0)type(c,'BIGFOOT',448,107,43,'#e4f1ef',null,1,.95);
      if(id===1){type(c,'GRAVE',453,91,31,t.accent,null,1,.94);type(c,'DIGGER',453,121,34,'#f2dcdb',null,1,.97);}
      if(id===2)type(c,'SNAKE BITE',449,106,34,'#e6f6c9',null,1,.93);
      if(id===3){type(c,'CAROLINA',447,91,23,t.accent,null,1,1);type(c,'CRUSHER',447,121,35,'#fff1df',null,1,1.02);}
      type(c,'UNIT / '+t.number,450,151,13,'#b5c3c8',null,1,1,false);
      for(const x of [71,600])for(const y of [55,164]){c.fillStyle='#84949a';c.fillRect(x,y,5,5);}
    }
  }
  function drawTop(c,id,part) {
    const t=roster[id],w=400,h=440;
    const coat=c.createLinearGradient(0,0,w,0);coat.addColorStop(0,t.ink);coat.addColorStop(.20,t.paint);coat.addColorStop(.52,t.highlight);coat.addColorStop(.80,t.paint);coat.addColorStop(1,t.ink);c.fillStyle=coat;c.fillRect(0,0,w,h);
    if(part==='bed'&&id!==1){
      c.fillStyle='#18242b';c.fillRect(17,12,366,416);
      for(let i=0;i<18;i++){c.fillStyle=i%3?'#2b3d46':'#324752';c.fillRect(26+i*20,22,7,392);c.fillStyle='#101a23';c.fillRect(33+i*20,22,3,392);}
      for(const x of [21,372]){c.fillStyle=t.trim;c.fillRect(x,35,3,64);c.fillStyle=t.accent;c.fillRect(x,107,3,137);}return;
    }
    if(id===0){
      for(const s of [-1,1]){const X=x=>200+s*x;poly2(c,[[X(133),0],[X(175),0],[X(175),191],[X(150),234],[X(150),440],[X(136),440],[X(135),201],[X(143),171]],'#27769f');trace(c,[[X(169),0],[X(169),186],[X(143),228],[X(143),440]],t.accent,5);trace(c,[[X(177),0],[X(177),190],[X(151),234],[X(151),418]],t.trim,2.5);}
    }else if(id===1){
      for(let i=0;i<8;i++){flame(c,i*52-18,h+11,142+42*Math.sin(i*1.8),57,'#8157b4');flame(c,i*52-11,h+13,111+32*Math.sin(i*1.8),44,'#ff62b4');}
      if(part==='hood')skull(c,200,209,177,t.accent,t.trim);
    }else if(id===2){
      for(let j=0;j<7;j++)for(let i=0;i<7;i++){const x=i*66+(j%2)*32,y=j*68;poly2(c,[[x,y],[x+46,y+1],[x+58,y+20],[x+32,y+52],[x+6,y+41]],'#206355','#164c47',2.4);}
      for(const s of [-1,1]){const X=x=>200+s*x;trace(c,[[X(164),0],[X(149),123],[X(86),232],[X(102),238],[X(29),375]],'#a5ed5a',6);trace(c,[[X(173),0],[X(159),125],[X(99),219]],'#43e6b7',2.5);}
    }else{
      for(const s of [-1,1]){const X=x=>200+s*x;poly2(c,[[X(70),0],[X(130),0],[X(175),151],[X(175),440],[X(134),440],[X(134),173]],'#fa468c');trace(c,[[X(123),0],[X(164),153],[X(163),440]],t.accent,8);}
    }
    if(part==='roof'){
      // The race number faces the trailing camera and remains visible in blimp view.
      c.save();c.translate(w,h);c.rotate(Math.PI);
      if(id===0){fleetMark(c,204,197,72,t.accent);type(c,'R E S E A R C H',200,264,24,'#def6ef','#182b41',2,1.05,false);}
      else{type(c,t.number,200,207,151,t.accent,'#232431',12,1.05);type(c,'2389 RESEARCH',200,309,23,'#e0edf0','#202132',3,1,false);}
      c.restore();
    }else if(part==='hood'){
      if(id===0){type(c,'BIGFOOT',200,205,53,'#d8f6eb','#1c3359',6,1.03);fleetMark(c,200,267,28,t.accent);}
      else if(id===3){type(c,'CC',200,200,107,'#ffe7ac','#7b2744',7,1.03);fleetMark(c,200,288,25,t.accent);}
      else if(id===2){fleetMark(c,200,182,28,t.accent);}
    }
  }
  function skin(id){
    if(skins.has(id))return skins.get(id);
    const can=MTMKit.canvas(1024,1024);
    const c=can.getContext('2d');c.scale(.5,.5);
    panelDraw(c,panels.right,1180,460,d=>drawSide(d,id,1));panelDraw(c,panels.left,1180,460,d=>drawSide(d,id,-1));
    panelDraw(c,panels.front,670,240,d=>drawFace(d,id,true));panelDraw(c,panels.rear,670,240,d=>drawFace(d,id,false));
    ['hood','roof','bed'].forEach(p=>panelDraw(c,panels[p],400,440,d=>drawTop(d,id,p)));
    const tx=new T.CanvasTexture(can);tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=4;
    const m=new T.MeshPhongMaterial({map:tx,shininess:42,specular:0x404b54});skins.set(id,m);return m;
  }
  // Static geometry is batched by material. A truck consists of one chassis node,
  // one suspended body and four separately steerable, spinning wheel nodes.
  const primitives=new Map(), matrix=new T.Matrix4(), q=new T.Quaternion(), normalMatrix=new T.Matrix3();
  const vA=new T.Vector3(),vB=new T.Vector3(),vN=new T.Vector3(),vQ=new T.Vector3(),vS=new T.Vector3();
  const up=new T.Vector3(0,1,0);
  class Batch {
    constructor(material){this.material=material;this.p=[];this.n=[];this.c=[];this.uv=[];}
    add(p,n,col,uv){
      this.p.push(p[0],p[1],p[2]);this.n.push(n[0],n[1],n[2]);
      const c=colored(col);this.c.push(c.r,c.g,c.b);this.uv.push(...(uv||[.001,.001]));
    }
    tri(pts,col,uv,desired,ns){
      const a=pts[0],b=pts[1],c=pts[2];
      vA.set(b[0]-a[0],b[1]-a[1],b[2]-a[2]);vB.set(c[0]-a[0],c[1]-a[1],c[2]-a[2]);vN.crossVectors(vA,vB).normalize();
      const reverse=desired&&(vN.x*desired[0]+vN.y*desired[1]+vN.z*desired[2]<0);
      const normal=reverse?[-vN.x,-vN.y,-vN.z]:[vN.x,vN.y,vN.z];
      for(const i of (reverse?[0,2,1]:[0,1,2]))this.add(pts[i],ns?ns[i]:normal,Array.isArray(col)?col[i]:col,uv?uv[i]:null);
    }
    quad(pts,col,uv,desired,ns){
      for(const idx of [[0,1,2],[0,2,3]])this.tri(idx.map(i=>pts[i]),Array.isArray(col)?idx.map(i=>col[i]):col,uv&&idx.map(i=>uv[i]),desired,ns&&idx.map(i=>ns[i]));
    }
    primitive(geom,transform,col) {
      const pos=geom.attributes.position,nor=geom.attributes.normal;normalMatrix.getNormalMatrix(transform);
      const c=colored(col);
      for(let i=0;i<pos.count;i++){
        vA.fromBufferAttribute(pos,i).applyMatrix4(transform);vN.fromBufferAttribute(nor,i).applyMatrix3(normalMatrix).normalize();
        this.p.push(vA.x,vA.y,vA.z);this.n.push(vN.x,vN.y,vN.z);this.c.push(c.r,c.g,c.b);this.uv.push(.001,.001);
      }
    }
    mesh(parent,shadow=true){
      if(!this.p.length)return;
      const geom=new T.BufferGeometry();
      geom.setAttribute('position',new T.Float32BufferAttribute(this.p,3));geom.setAttribute('normal',new T.Float32BufferAttribute(this.n,3));
      geom.setAttribute('color',new T.Float32BufferAttribute(this.c,3));geom.setAttribute('uv',new T.Float32BufferAttribute(this.uv,2));geom.computeBoundingSphere();
      const m=new T.Mesh(geom,this.material);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);
    }
  }
  function primitive(key,create){
    if(!primitives.has(key)){const g=create();const ng=g.index?g.toNonIndexed():g;primitives.set(key,ng);if(g!==ng)g.dispose();}
    return primitives.get(key);
  }
  function box(batch,x,y,z,w,h,l,c,rx=0,ry=0,rz=0){
    q.setFromEuler(new T.Euler(rx,ry,rz));matrix.compose(vQ.set(x,y,z),q,vS.set(w,h,l));
    batch.primitive(primitive('box',()=>new T.BoxGeometry(1,1,1)),matrix,c);
  }
  function rod(batch,a,b,r,c,n=8){
    vA.set(...a);vB.set(...b);vN.subVectors(vB,vA);const len=vN.length();if(len<.0001)return;
    q.setFromUnitVectors(up,vN.multiplyScalar(1/len));vQ.addVectors(vA,vB).multiplyScalar(.5);
    matrix.compose(vQ,q,vS.set(r,len,r));
    batch.primitive(primitive('cyl'+n,()=>new T.CylinderGeometry(1,1,1,n,1,false)),matrix,c);
  }
  function bulb(batch,x,y,z,w,h,l,c,detail=10){
    matrix.makeScale(w,h,l).setPosition(x,y,z);
    batch.primitive(primitive('bulb'+detail,()=>new T.SphereGeometry(1,detail,Math.max(5,detail/2|0))),matrix,c);
  }
  // Join polygonal cross-sections perpendicular to the wheelbase. The van's
  // rounded fenders and Snake Bite's faceted cobra cheeks use the same loft.
  function loft(batch,sections,colors){
    const rings=sections.map(([z,ring])=>ring.map(([x,y])=>[x,y,z]));
    const centers=rings.map(r=>r.reduce((p,v)=>p.map((n,i)=>n+v[i]/r.length),[0,0,0]));
    for(let k=0;k<rings.length-1;k++){
      const a=rings[k],b=rings[k+1];
      for(let j=0;j<a.length;j++){
        const next=(j+1)%a.length,normal=[(a[j][0]+a[next][0])*.5-centers[k][0],(a[j][1]+a[next][1])*.5-centers[k][1],0];
        batch.quad([a[j],a[next],b[next],b[j]],colors[j%colors.length],null,normal);
      }
    }
    for(const k of [0,rings.length-1]){
      const r=rings[k],normal=[0,0,k===0?-1:1];
      for(let j=0;j<r.length;j++)batch.tri([centers[k],r[j],r[(j+1)%r.length]],colors[j%colors.length],null,normal);
    }
    return rings;
  }
  // The three carcasses share a loaded rolling radius. Width, shoulder, tread
  // depth, mold and sidewall art are independent of the truck's wheel center.
  const rollingRadius=.864;
  const tireSets=[
    {name:'All-terrain',mold:'Terra Chevron',radius:rollingRadius,width:1.024,depth:.079,core:.785,wall:.652},
    {name:'Deep tread',mold:'Mud Paddle',radius:rollingRadius,width:1.164,depth:.157,core:.707,wall:.593},
    {name:'Hardpack',mold:'Hardpack Block',radius:rollingRadius,width:.942,depth:.036,core:.828,wall:.684}
  ];
  const suspensionSets=[
    {name:'Soft',lift:.34,compression:.32,rebound:.23,turns:4.25,wire:.020,springRadius:.097,finish:'#8decce'},
    {name:'Balanced',lift:0,compression:.24,rebound:.19,turns:5.5,wire:.025,springRadius:.105,finish:'#d5dfe5'},
    {name:'Firm',lift:-.24,compression:.15,rebound:.13,turns:6.25,wire:.031,springRadius:.113,finish:'#edaa6b'}
  ];
  const tireMaterials=[],rubberParts=new Map(),hubParts=new Map(),axleParts=new Map(),shockParts=new Map();
  const wheelPoint=(x,r,a)=>[x,Math.cos(a)*r,Math.sin(a)*r];

  function makeTireMaterial(index){
    if(tireMaterials[index])return tireMaterials[index];
    const can=MTMKit.canvas(512,512);const c=can.getContext('2d');
    // The white corner is the neutral texel used by the three-dimensional lugs.
    c.fillStyle='#fff';c.fillRect(0,0,512,512);c.translate(256,256);
    const shade=c.createRadialGradient(-20,-7,103,0,0,220);
    shade.addColorStop(0,'#3c4147');shade.addColorStop(.33,'#292d33');shade.addColorStop(.71,'#373a40');shade.addColorStop(1,'#22252b');
    c.fillStyle=shade;c.beginPath();c.arc(0,0,224,0,2*Math.PI);c.fill();
    for(const r of [129,133,139,182,187,194,201]){c.strokeStyle=r%2?'#51545a':'#252830';c.lineWidth=r===187?3:1.5;c.beginPath();c.arc(0,0,r,0,2*Math.PI);c.stroke();}
    function arcText(words,angle,r,size,span){
      c.font='900 '+size+'px Arial, DejaVu Sans, sans-serif';c.textAlign='center';c.textBaseline='middle';
      [...words].forEach((ch,i)=>{const a=angle+((i+.5)/words.length-.5)*span;c.save();c.rotate(a);c.translate(0,-r);
        c.fillStyle='#191d21';c.fillText(ch,.8,1.4);c.fillStyle='#a7a6a3';c.fillText(ch,0,0);c.restore();});
    }
    arcText(['TERRA  /  AT','MUD  PADDLE','HARDPACK  /  HP'][index],0,159,20,2.1);
    arcText('2389  RESEARCH',Math.PI,158,14,1.74);
    for(const side of [-1,1])for(let i=0;i<(index===1?5:9);i++){
      c.save();c.rotate(side*(1.19+i*(index===1?.13:.073)));c.fillStyle=i%3===0?'#8a8e8c':'#65686a';
      c.fillRect(-1,-177,2.5,index===1?16:index===2?6:11);c.restore();
    }
    const map=new T.CanvasTexture(can);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
    const material=new T.MeshPhongMaterial({map,vertexColors:true,shininess:index===2?12:5,specular:0x17191d});
    tireMaterials[index]=material;return material;
  }
  // A tread block has an actual crown, flanks and shoulder, not a printed mark.
  // Coordinates contain lateral position, angle, base radius and tip radius.
  function treadBlock(rubber,foot,topColor,sideColor){
    const bottom=foot.map(([x,a,r])=>wheelPoint(x,r,a)),top=foot.map(([x,a,,r])=>wheelPoint(x,r,a));
    const center=[0,0,0];
    for(const v of top)for(let k=0;k<3;k++)center[k]+=v[k]/top.length;
    for(let j=0;j<top.length;j++){
      const k=(j+1)%top.length;
      rubber.tri([center,top[j],top[k]],topColor,null,[0,center[1],center[2]]);
      const normal=[0,1,2].map(axis=>(top[j][axis]+top[k][axis])*.5-center[axis]);
      rubber.quad([bottom[j],bottom[k],top[k],top[j]],sideColor,null,normal);
    }
  }
  function buildTire(index,high){
    const key=index+':'+high;if(rubberParts.has(key))return rubberParts.get(key);
    const tire=tireSets[index],w=tire.width*.5,core=tire.core;
    const rubber=new Batch(makeTireMaterial(index)),n=high?36:24;
    const side=[[.343,.340],[.402,.370],[.432,.421],[w*.985,.455],[w,tire.wall],
      [w*.964,index===1?.646:index===2?.739:.710],[w*.86,core-.034],[w*.57,core-.008],[0,core]];
    const profile=[...side.map(([x,r])=>[-x,r]),...side.slice(0,-1).reverse()];
    for(let i=0;i<profile.length-1;i++){
      const [x,r]=profile[i],[x2,r2]=profile[i+1],labels=i===3||i===12;
      const len=Math.hypot(x2-x,r2-r),nx=(r-r2)/len,nr=(x2-x)/len;
      for(let j=0;j<n;j++){
        const a=j/n*2*Math.PI,b=(j+1)/n*2*Math.PI,vs=[wheelPoint(x,r,a),wheelPoint(x2,r2,a),wheelPoint(x2,r2,b),wheelPoint(x,r,b)];
        const normals=[a,a,b,b].map(t=>[nx,nr*Math.cos(t),nr*Math.sin(t)]);
        const uv=labels?vs.map(p=>[.5-Math.sign(x)*p[2]/1.72,.5+p[1]/1.72]):null;
        rubber.quad(vs,labels?'#eceae5':i===0||i===15?'#282c31':index===2?'#34383c':'#262a30',uv,normals[0],normals);
      }
    }
    if(index===0){
      const count=high?18:16,step=2*Math.PI/count;
      for(let j=0;j<count;j++)for(const s of [-1,1]){
        const a=j*step+(s<0?.034:0),span=.38*step;
        const lug=[[s*.005,a,.779,.864],[s*.30,a-.14,.771,.850],[s*.471,a-.276,.710,.791],
          [s*.506,a-.325,.652,.732],[s*.503,a-.325+span,.652,.738],[s*.465,a-.276+span,.710,.795],
          [s*.30,a-.14+span,.771,.850],[s*.012,a+span,.779,.864]];
        treadBlock(rubber,lug,j%5===0?'#464a4e':'#3c4146','#272d32');
      }
    }else if(index===1){
      // Widely spaced scoop paddles extend over the tread center and well down
      // the sidewall. Left and right paddles alternate by half their pitch.
      const count=12,step=2*Math.PI/count;
      for(let j=0;j<count;j++)for(const s of [-1,1]){
        const a=j*step+(s<0?step*.50:0),span=step*.36;
        const lug=[[-s*.091,a,.695,.864],[s*.13,a+.025,.702,.864],[s*.38,a+.158,.686,.835],
          [s*.549,a+.297,.610,.791],[s*.582,a+.340,.568,.690],[s*.580,a+.340+span*.69,.568,.700],
          [s*.548,a+.297+span,.610,.800],[s*.36,a+.158+span,.686,.846],[s*.13,a+.025+span,.700,.864],[-s*.076,a+span*.85,.697,.864]];
        treadBlock(rubber,lug,j%3===0?'#4b4e4e':'#3f4446','#242a2c');
      }
    }else{
      // Four nearly continuous rows retain three open circumferential grooves.
      // Each block is independently chamfered, staggered and directionally cut.
      const count=high?24:18,step=2*Math.PI/count;
      const bands=[[-.453,-.251],[-.223,-.017],[.017,.223],[.251,.453]];
      const top=x=>.864-.054*(Math.abs(x)/.453)**3,base=x=>top(x)-.036;
      for(let row=0;row<bands.length;row++)for(let j=0;j<count;j++){
        const [lo,hi]=bands[row],a=j*step+(row%2)*step*.5,skew=(row<2?1:-1)*step*.18,span=.78*step;
        const poly=[[lo+.025,a],[hi-.030,a+skew],[hi,a+skew+span*.22],[hi,a+skew+span*.74],
          [hi-.025,a+skew+span],[lo+.03,a+span],[lo,a+span*.76],[lo,a+span*.18]];
        treadBlock(rubber,poly.map(([x,t])=>[x,t,base(x),top(x)]),j%4===2?'#4a4d50':'#41464a','#24292e');
      }
    }
    const node=new T.Group();rubber.mesh(node);const mesh=node.children[0];mesh.name=tire.mold+' tire';rubberParts.set(key,mesh);return mesh;
  }
  function buildHub(id,high){
    const key=id+':'+high;if(hubParts.has(key))return hubParts.get(key);
    const met=new Batch(metalMaterial),n=high?32:20,accent=['#92e9dd','#f875ba','#caff75','#ffa46b'][id]||roster[id].accent;
    const names=['Cobalt beadlock','Violet deep dish','Venom forked spokes','Industrial slotted disc','Patch-bay turbine','Astrolabe rim','Pincer split spokes'];
    for(const s of [-1,1]){
      const p=(x,r,a)=>wheelPoint(s*x,r,a),normal=[s,0,0];
      function band(x0,r0,x1,r1,ink,from=0,to=2*Math.PI,pieces=n){
        for(let i=0;i<pieces;i++){
          const a=from+(to-from)*i/pieces,b=from+(to-from)*(i+1)/pieces;
          met.quad([p(x0,r0,a),p(x1,r1,a),p(x1,r1,b),p(x0,r0,b)],ink,null,Math.abs(r0-r1)<.00001?[0,-Math.cos(a),-Math.sin(a)]:normal);
        }
      }
      const cap=(x,r,col,segs=12)=>rod(met,[s*(x-.022),0,0],[s*x,0,0],r,col,segs);
      const pin=(x,r0,a,r,col)=>{const y=Math.cos(a)*r0,z=Math.sin(a)*r0;rod(met,[s*(x-.025),y,z],[s*x,y,z],r,col,high?7:5);};
      band(.403,.425,.440,.441,id===1?'#b993bb':'#8999a1');
      band(.440,.441,.449,.420,id===3?'#e98099':accent);
      if(id>=4){
        cap(.30,.37,'#1b2530',n);band(.42,.411,.45,.355,accent);
        const count=[8,7,3][id-4];for(let k=0;k<count;k++){
          const a=k*Math.PI*2/count;
          for(const split of (id===6?[-.19,.19]:[0])){
            const pts=[p(.38,.11,a-.2),p(.44,.36,a+split+.26),p(.44,.36,a+split+.40),p(.40,.12,a+.25)];
            met.quad(pts,id===5?'#e7c380':accent,null,normal);
          }
          pin(.47,.392,a,.018,'#e4edef');
        }
        cap(.45,.14,roster[id].paint,12);cap(.47,.08,accent,8);
      }else if(id===0){
        // Forged cobalt dish with a bright beadlock and inboard fasteners.
        band(.449,.420,.442,.339,'#829aa4');band(.442,.339,.341,.295,'#375c84');
        cap(.344,.299,'#344f73',n);band(.343,.281,.395,.141,'#5778a0');
        for(let k=0;k<10;k++)pin(.463,.382,k*Math.PI/5,.021,'#e7ebe4');
        for(let k=0;k<6;k++)pin(.370,.245,(k+.5)*Math.PI/3,.039,'#192d3c');
        cap(.429,.138,'#a6bec9',14);cap(.467,.085,accent,8);
      }else if(id===1){
        // Deep, swept plum bowl with a recessed hub and a five-lobed bolt circle.
        band(.449,.420,.422,.381,'#b763a0');band(.422,.381,.258,.276,'#785083');
        band(.258,.276,.235,.140,'#4a2e5f');cap(.241,.160,'#543657',n);
        for(let k=0;k<5;k++){
          const a=k*2*Math.PI/5;
          met.quad([p(.265,.139,a-.24),p(.273,.27,a-.13),p(.295,.295,a+.10),p(.266,.151,a+.13)],'#d17cae',null,normal);
          pin(.292,.198,a,.033,'#d9bcc9');
        }
        cap(.295,.118,'#b776a7',10);cap(.316,.079,'#efcfca',5);
      }else if(id===2){
        // Split forked spokes stand in front of a recessed rotor. The openings
        // run into the barrel, so their silhouette changes through an orbit.
        band(.449,.420,.431,.360,'#77b276');band(.431,.360,.188,.349,'#263f3e');
        cap(.194,.345,'#24373c',n);
        for(let k=0;k<3;k++){
          const a=k*2*Math.PI/3;
          for(const branch of [-1,1]){
            const b=a+.18+branch*.27;
            const face=[p(.413,.130,a-.21),p(.427,.235,a+.10),p(.435,.372,b+.061),p(.439,.367,b-.091),p(.419,.184,a-.075)];
            for(let j=1;j<face.length-1;j++)met.tri([face[0],face[j],face[j+1]],branch===1?'#d2ff90':'#8bd36c',null,normal);
          }
          pin(.438,.116,a,.023,'#203e37');
        }
        cap(.436,.126,'#5d9f68',6);cap(.454,.078,accent,6);
      }else{
        // Wide slots are actual openings in the hot-pink front disc. Their
        // steel rear edges and grey rotor are visible at an oblique angle.
        band(.449,.420,.432,.317,'#ce5479');band(.432,.317,.414,.293,'#ef9b92');
        cap(.252,.323,'#313844',n);band(.420,.177,.447,.096,'#c85b78');
        for(let k=0;k<6;k++){
          const a=k*Math.PI/3,lo=a+.18,hi=a+.69;
          band(.421,.162,.431,.320,'#d76180',lo,hi,4);
          for(const [at,sign] of [[lo,-1],[hi,1]]){
            const pts=[p(.421,.162,at),p(.431,.320,at),p(.359,.320,at),p(.353,.162,at)];
            met.quad(pts,sign>0?'#9e5866':'#af806d',null,[0,-sign*Math.sin(at),sign*Math.cos(at)]);
          }
          pin(.452,.366,a,.021,'#ffd395');
        }
        cap(.461,.102,'#56555e',8);cap(.473,.064,'#ffbd6c',6);
      }
    }
    const group=new T.Group();met.mesh(group);const mesh=group.children[0];mesh.name=names[id]+' hub';hubParts.set(key,mesh);return mesh;
  }
  function wheelGeometry(id,high,tire){
    const key=id+':'+high+':'+tire;if(wheelShapes.has(key))return wheelShapes.get(key);
    const result=new T.Group();result.add(buildTire(tire,high).clone(),buildHub(id,high).clone());
    wheelShapes.set(key,result);return result;
  }
  const lerp=(a,b,t)=>a+(b-a)*t;
  const blend=(a,b,t)=>a.map((v,i)=>lerp(v,b[i],t));
  function sampleLine(profile,z){
    for(let i=1;i<profile.length;i++)if(z<=profile[i][0])return lerp(profile[i-1][1],profile[i][1],(z-profile[i-1][0])/(profile[i][0]-profile[i-1][0]));
    return profile[profile.length-1][1];
  }
  const basicLights=new T.MeshBasicMaterial({vertexColors:true,toneMapped:false});
  // Sheet metal is defined independently for each real truck style. The fixed
  // axle and tire contact points belong to the simulation, outside these shells.
  const bodies=[
    {name:'Square-nose longbed',rear:-2.67,front:2.68,br:-.83,tr:-.71,tf:.51,bf:1.09,ry:3.17,rx:.90,cab:1.05,crown:.065,
      outline:[[-2.67,2.22,.96],[-2.43,2.29,1.05],[-.86,2.29,1.05],[-.76,2.39,1.05],[1.20,2.39,1.05],[2.29,2.31,1.04],[2.68,2.27,.99]]},
    {name:'Barrel-roof panel van',rear:-2.65,front:2.55,br:-2.63,tr:-2.43,tf:.30,bf:.91,ry:3.14,rx:.99,cab:1.065,crown:.32,
      outline:[[-2.65,2.26,.99],[-2.44,2.36,1.065],[.91,2.36,1.065],[1.34,2.33,.95],[2.05,2.26,.80],[2.55,2.12,.66]]},
    {name:'Cobra canopy and spine',rear:-2.63,front:2.67,br:-1.19,tr:-.83,tf:.12,bf:1.05,ry:2.91,rx:.55,cab:.91,crown:.115,
      outline:[[-2.63,2.12,.61],[-2.31,2.18,.76],[-1.72,2.23,.89],[-1.19,2.29,.91],[1.05,2.32,.91],[1.58,2.35,1.10],[2.07,2.34,1.14],[2.43,2.20,1.02],[2.67,2.10,.85]]},
    {name:'Chopped competition pickup',rear:-2.56,front:2.58,br:-.54,tr:-.49,tf:.50,bf:.80,ry:2.96,rx:.99,cab:1.10,crown:.018,
      outline:[[-2.56,1.98,.77],[-2.10,2.02,.92],[-1.68,2.18,1.05],[-.80,2.28,1.10],[-.54,2.34,1.10],[.80,2.34,1.10],[1.51,2.32,1.14],[2.45,2.32,1.14],[2.58,2.30,1.10]]}
  ];
  // Prototype works entries share the race axles and shock mounts. Each upper
  // body has its own load-bearing frame and equipment, with local coordinates
  // kept above the four suspension contact patches.
  function worksBody(id,high){
    const d=roster[id],shell=new Batch(paintMaterial),steel=new Batch(metalMaterial),glow=new Batch(basicLights),sub=new T.Group();
    const black='#202634',silver='#88999e',dark='#263b48',window='#75b6c1';
    function plated(sections,cols){loft(shell,sections.map(([z,w,low,high,roof])=>[z,[[-w*.89,low],[-w,low+.17],[-roof,high],[roof,high],[w,low+.17],[w*.89,low]]]),cols);}
    function cable(path,r,col,batch=shell){for(let k=1;k<path.length;k++)rod(batch,path[k-1],path[k],r,col,high?10:6);}
    // Stations run from tail to nose. The sill, beltline and deck heights form
    // a utility bed, a fastback, or a stepped recovery hood around the same axles.
    const profiles=[
      [[-2.70,1.03,1.52,2.19],[-2.43,1.16,1.41,2.28],[-.33,1.16,1.42,2.28],[.18,1.02,1.33,2.12],[1.78,1.09,1.42,2.18],[2.60,.94,1.55,2.07]],
      [[-2.72,.76,1.70,2.38],[-2.27,1.12,1.47,2.30],[-1.56,1.20,1.44,2.35],[-.35,1.01,1.35,2.08],[.70,1.03,1.33,2.09],[1.78,1.17,1.45,2.17],[2.69,.80,1.63,1.96]],
      [[-2.67,.92,1.52,2.28],[-2.28,1.14,1.45,2.40],[-.78,1.14,1.36,2.38],[-.30,.97,1.38,2.13],[.31,1.15,1.46,2.19],[1.99,1.16,1.55,2.27],[2.72,.99,1.67,2.12]]
    ];
    const profile=profiles[id-4];
    loft(shell,profile.map(([z,w,low,top])=>[z,[[-w*.87,low],[-w,low+.10],[-w,top-.09],[-w*.87,top],[w*.87,top],[w,top-.09],[w,low+.10],[w*.87,low]]]),
      [d.ink,d.paint,d.highlight,d.paint,d.highlight,d.paint,d.ink,black]);

    // Wrap the artwork around the actual flanks. Reverse the UV direction on
    // the passenger side so numbers and sponsor lettering read from either side.
    for(const side of [-1,1]){
      const cv=MTMKit.canvas(1024,192);
      const c=cv.getContext('2d'),shade=c.createLinearGradient(0,0,0,192);
      shade.addColorStop(0,d.highlight);shade.addColorStop(.3,d.paint);shade.addColorStop(1,d.ink);
      c.fillStyle=shade;c.fillRect(0,0,1024,192);
      c.save();if(side<0){c.translate(1024,0);c.scale(-1,1);}
      if(id===4){
        for(let n=0;n<5;n++)trace(c,[[0,25+n*15],[195,25+n*15],[285,112+n*12],[683,112+n*12],[775,30+n*12],[1024,30+n*12]],n%2?d.trim:d.accent,6);
      }else if(id===5){
        for(let n=0;n<5;n++){c.beginPath();c.ellipse(510,135,540-n*34,65-n*9,-.16,0,2*Math.PI);c.strokeStyle=n%2?d.trim:d.highlight;c.lineWidth=4;c.stroke();}
        for(let n=0;n<54;n++){const x=(n*193)%1024,y=(n*n*19+11)%192;c.fillStyle='#fff0c5';c.fillRect(x,y,n%5?2:5,n%5?2:5);}
      }else{
        for(let x=-90;x<1100;x+=103)poly2(c,[[x,0],[x+44,0],[x-18,117],[x-80,160]],d.ink);
        trace(c,[[0,175],[340,155],[520,181],[1024,116]],d.accent,9);
      }
      c.restore();type(c,d.name.toUpperCase(),512,94,64,'#fff2ce',d.ink,10);
      for(const x of [84,940])type(c,d.number,x,85,80,'#fff0cc',d.ink,8);
      fleetMark(c,512,155,27,d.accent);
      const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;
      const ink=new Batch(new T.MeshPhongMaterial({map:tex,shininess:48}));
      function edge([z,w,low,top]){
        const x=side*(w+.005);
        return [[x,low+.10,z],[x,top-.09,z]];
      }
      function u(z){const t=(z-profile[0][0])/(profile[profile.length-1][0]-profile[0][0]);return side>0?1-t:t;}
      for(let n=1;n<profile.length;n++){
        const a=edge(profile[n-1]),b=edge(profile[n]),u0=u(profile[n-1][0]),u1=u(profile[n][0]);
        ink.quad([a[0],b[0],b[1],a[1]],'#ffffff',[[u0,0],[u1,0],[u1,1],[u0,1]],[side,0,0]);
      }
      ink.mesh(sub);
      rod(steel,[side*1.02,1.37,-1.06],[side*1.02,1.37,1.05],.068,silver);
      // Form the arches from overlapping sections so the tires show through.
      for(const z of [-1.67,1.67]){
        const arch=[];
        for(let step=0;step<=8;step++){
          const angle=Math.PI*step/8,dy=Math.sin(angle);
          arch.push([z-.76*Math.cos(angle),[[side*.99,1.65+.67*dy],[side*1.27,1.65+.67*dy],[side*1.31,1.72+.68*dy],[side*1.03,1.75+.70*dy]]]);
        }
        loft(shell,arch,[d.ink,d.paint,d.highlight,d.paint]);
      }
    }
    const nose=profile[profile.length-1][0];
    box(steel,0,1.81,nose+.01,1.12,.25,.09,black);
    for(let slot=0;slot<7;slot++)box(steel,(slot-3)*.14,1.82,nose+.064,.052,.19,.035,silver);
    for(const side of [-1,1]){
      box(glow,side*.69,1.88,nose+.06,.24,.12,.047,d.lamp);
      box(glow,side*.72,1.90,profile[0][0]-.04,.26,.10,.05,'#ff5e79');
      box(steel,side*.95,2.56,id===6?-1.14:1.10,.25,.055,.055,silver);
      box(shell,side*1.09,2.60,id===6?-1.14:1.10,.11,.18,.15,d.ink);
    }
    function cab(z,w,h,col){
      plated([[z-.86,w,1.97,h,w*.85],[z-.57,w,1.97,h+.07,w*.82],[z+.29,w,1.97,h+.04,w*.76],[z+.97,w*.88,1.99,2.43,w*.79]],[col,col,col,col,col,black]);
      const glass=new Batch(glassMaterial);
      glass.quad([[-w*.69,h+.046,z+.31],[w*.69,h+.046,z+.31],[w*.69,2.49,z+.93],[-w*.69,2.49,z+.93]],window,null,[0,.5,1]);
      for(const s of [-1,1])glass.quad([[s*w*.925,2.40,z-.65],[s*w*.85,h-.11,z-.52],[s*w*.79,h-.09,z+.21],[s*w*.919,2.43,z+.68]],s>0?'#467281':'#5795a0',null,[s,0,0]);
      glass.mesh(sub);
    }
    if(id===4){
      // A low offset cockpit leaves room for the paired signal-cable drums.
      cab(1.03,.95,2.89,d.paint);
      for(const [n,z] of [-1.64,-.53].entries()){
        const cy=2.62,r=.59;
        for(const s of [-1,1]){
          cable([[s*.89,1.96,z-.45],[s*.89,cy,z],[s*.89,1.96,z+.45]],.066,silver,steel);
          rod(shell,[s*.64,cy,z],[s*.73,cy,z],r,d.highlight,16);
          rod(glow,[s*.731,cy,z],[s*.745,cy,z],.19,d.lamp,10);
        }
        for(let j=0;j<12;j++)rod(shell,[-.62+j*.105,cy,z],[-.54+j*.105,cy,z],.49,n?d.accent:d.trim,high?18:12);
      }
      for(const s of [-1,1]){cable([[s*.7,2.69,-1.7],[s*1.03,2.64,-2.25],[s*.84,2.03,-2.64],[s*.25,2.01,-2.67]],.072,d.trim);box(glow,s*.6,2.85,1.23,.42,.09,.12,d.accent);}
    }else if(id===5){
      cab(.91,.93,2.68,d.paint);
      const center=[0,2.94,-1.00];
      rod(steel,[0,1.95,-1.0],center,.21,silver,10);bulb(shell,...center,.40,.40,.40,'#eab663');
      for(let plane=0;plane<3;plane++){
        const a=plane*.99+.23,b=.33+plane*.42,r=.74+plane*.124;
        function orbit(t){return [r*Math.cos(t)*Math.cos(a)-r*Math.sin(t)*Math.cos(b)*Math.sin(a),center[1]+r*Math.sin(t)*Math.sin(b),center[2]+r*Math.cos(t)*Math.sin(a)+r*Math.sin(t)*Math.cos(b)*Math.cos(a)];}
        const count=high?30:20;for(let j=0;j<count;j++)rod(steel,orbit(j*2*Math.PI/count),orbit((j+1)*2*Math.PI/count),.043,d.highlight,6);
        bulb(glow,...orbit(plane*1.7+.35),.167,.167,.167,plane===1?d.trim:d.accent);
      }
      for(const s of [-1,1])for(let k=0;k<3;k++)box(shell,s*.89,2.28+k*.11,1.97-k*.11,.12,.31,.6,d.paint,.2);
    }else{
      cab(-1.37,.91,3.03,d.paint);
      // Front claws rise separately from the shoulder turrets. The fixed open
      // pincers are visible from the chase camera above the compact rear cab.
      for(const s of [-1,1]){
        const path=[[s*.72,2.05,-.29],[s*.94,2.93,.07],[s*1.12,3.23,.98],[s*1.29,2.96,1.70]];
        cable(path,.185,d.paint);cable(path.map(([x,y,z])=>[x*.93,y+.12,z]),.061,d.highlight,steel);
        rod(steel,[s*.71,2.11,-.24],[s*.95,2.85,.56],.078,silver);
        for(const p of path.slice(1))bulb(steel,...p,.225,.225,.225,black);
        for(const b of [-1,1]){
          const edge=[[s*1.29,2.96,1.70],[s*(1.30+b*.34),2.75,2.11],[s*(1.30+b*.29),2.53,2.56],[s*(1.30+b*.08),2.47,2.72]];
          cable(edge,.116,d.highlight);rod(glow,edge[2],edge[3],.071,d.accent);
        }
      }
      box(shell,0,2.13,1.01,1.41,.22,1.88,d.ink);for(let i=0;i<8;i++)box(steel,0,2.25,.30+i*.20,1.16,.06,.082,silver);
    }
    for(const s of [-1,1]){rod(steel,[s*.96,1.49,-2.69],[s*.96,1.49,2.56],.065,silver);box(steel,s*.71,1.53,2.60,.43,.17,.21,black);}
    // Small backlit sponsor plates can be read from the chase camera.
    const cv=MTMKit.canvas(512,112);const ctx=cv.getContext('2d');
    ctx.fillStyle=d.ink;ctx.fillRect(0,0,512,112);ctx.fillStyle=d.accent;ctx.fillRect(0,0,512,4);
    ctx.textAlign='center';ctx.font='bold 47px sans-serif';ctx.fillText(d.name.toUpperCase(),256,55,485);
    ctx.fillStyle='#f3f7e8';ctx.font='bold 24px monospace';ctx.fillText('2389 RESEARCH  /  '+d.number,256,94);
    const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;
    const label=new T.MeshBasicMaterial({map:tex});
    for(const [x,y,z,yaw,w,h] of [[0,1.96,profile[0][0]-.012,Math.PI,1.44,.33]]){
      const sign=new T.Mesh(new T.PlaneGeometry(w,h),label);sign.position.set(x,y,z);sign.rotation.y=yaw;sub.add(sign);
    }
    shell.mesh(sub);steel.mesh(sub);glow.mesh(sub,false);sub.name=d.name;sub.position.y=-bodyPivot;return sub;
  }

  function buildBody(id,high){
    if(id>=4)return worksBody(id,high);
    const d=roster[id],van=id===1,snake=id===2,crusher=id===3;
    const decal=new Batch(skin(id)),shell=new Batch(paintMaterial),metal=new Batch(metalMaterial),glass=new Batch(glassMaterial),lit=new Batch(basicLights);
    const body=bodies[id],{rear,front,br,tr,tf,bf,ry,rx}=body,hoodBack=bf;
    const topProfile=body.outline.map(([z,y])=>[z,y]),widthProfile=body.outline.map(([z,,w])=>[z,w]);
    const top=z=>sampleLine(topProfile,z),width=z=>sampleLine(widthProfile,z);
    const arch=z=>{const e=Math.min(Math.abs(z-1.64),Math.abs(z+1.64));return Math.max(1.51,.965+Math.sqrt(Math.max(0,.965*.965-e*e)));};
    // A multi-section body follows both wheel arches, with an inward return on the lower sheet metal.
    const stations=[...new Set([...body.outline.map(p=>p[0]),-2.49,-2.40,-2.31,-2.17,-1.98,-1.81,-1.64,-1.47,-1.28,-1.10,-.96,-.85,-.77,-.68,-.2,.65,.77,.85,.96,1.10,1.28,1.47,1.64,1.81,1.98,2.17,2.31,2.40,2.49])].sort((a,b)=>a-b);
    for(const s of [-1,1])for(let k=0;k<stations.length-1;k++){
      const a=stations[k],b=stations[k+1],lo=z=>[s*(width(z)-.018),arch(z),z],hi=z=>[s*width(z),top(z),z];
      const side=[lo(a),lo(b),hi(b),hi(a)];decal.quad(side,'#fff',side.map(p=>sideUV(p,s)),[s,0,0]);
      const inside=[lo(a),lo(b),[s*(width(b)-.19),arch(b)+.03,b],[s*(width(a)-.19),arch(a)+.03,a]];
      shell.quad(inside,'#34363a',null,[0,-1,0]);
      if(arch(a)>1.53&&arch(b)>1.53){
        const trim=[lo(a),lo(b),[lo(b)[0]+s*.004,arch(b)+.034,b],[lo(a)[0]+s*.004,arch(a)+.034,a]];
        shell.quad(trim,id===0?'#5d9aab':van?'#ab64bd':snake?'#579c76':'#dd7d86',null,[s,0,0]);
      }
    }
    function face(frontFace){
      const z=frontFace?front:rear,ww=width(z),bottom=1.54,yt=top(z),p=frontFace?panels.front:panels.rear;
      const pts=[[-ww,bottom,z],[ww,bottom,z],[ww,yt,z],[-ww,yt,z]];
      const uv=pts.map(a=>uvPanel(p,.5+(frontFace?1:-1)*a[0]/(ww*2),(yt-a[1])/(yt-bottom)));
      decal.quad(pts,'#fff',uv,[0,0,frontFace?1:-1]);
    }
    face(true);face(false);
    // Raised hood stamping, with several shallow longitudinal creases picking up the sky.
    const hoodStations=[...new Set([hoodBack,1.6,2.19,front,...body.outline.map(p=>p[0]).filter(z=>z>hoodBack)])].sort((a,b)=>a-b),clines=[-1,-.83,-.69,.0,.69,.83,1];
    const hoodPoint=(u,z)=>[u*width(z),top(z)+(1-Math.abs(u))*(van?.33:snake?.11:crusher?.022:.073)+(Math.abs(u)<.7?.025:0),z];
    for(let k=0;k<hoodStations.length-1;k++)for(let j=0;j<clines.length-1;j++){
      const pts=[hoodPoint(clines[j],hoodStations[k]),hoodPoint(clines[j+1],hoodStations[k]),hoodPoint(clines[j+1],hoodStations[k+1]),hoodPoint(clines[j],hoodStations[k+1])];
      const uv=pts.map(p=>uvPanel(panels.hood,.5+p[0]/(2*width(p[2])),(p[2]-hoodBack)/(front-hoodBack)));
      decal.quad(pts,'#fff',uv,[0,1,0]);
    }
    for(let j=0;j<clines.length-1;j++){
      const a=hoodPoint(clines[j],front),b=hoodPoint(clines[j+1],front);
      shell.quad([[a[0],top(front),front],[b[0],top(front),front],b,a],d.paint,null,[0,0,1]);
      if(van)rod(metal,a,b,.012,'#ab86a1',6);
    }
    function cabSide(s,z,y){const f=Math.max(0,Math.min(1,(y-top(z))/(ry-top(z))));return [s*lerp(body.cab,rx,f),y,z];}
    for(const s of [-1,1]){
      const vs=[cabSide(s,br,top(br)),cabSide(s,bf,top(bf)),cabSide(s,tf,ry),cabSide(s,tr,ry)];
      decal.quad(vs,'#fff',vs.map(p=>sideUV(p,s)),[s,0,0]);
    }
    const roofZ=[tr,tr+.14,tf-.14,tf],cuts=van?[-1,-.97,-.88,-.69,-.36,0,.36,.69,.88,.97,1]:[-1,-.65,0,.65,1];
    const rp=(u,z)=>{
      const arch=van?Math.sqrt(Math.max(0,1-u*u)):1-u*u,edge=(z===tf?1:z===tr?-1:0);
      return [u*rx,ry+body.crown*arch+(van?.025:.005)*Math.sin(Math.PI*(z-tr)/(tf-tr)),z+(van?edge*.085*arch:0)];
    };
    for(let j=0;j<cuts.length-1;j++){
      const a=cuts[j],b=cuts[j+1];
      for(let k=0;k<roofZ.length-1;k++){
        const vs=[rp(a,roofZ[k]),rp(b,roofZ[k]),rp(b,roofZ[k+1]),rp(a,roofZ[k+1])];
        decal.quad(vs,'#fff',vs.map(p=>uvPanel(panels.roof,.5+p[0]/(2*rx),Math.max(0,Math.min(1,(p[2]-tr)/(tf-tr))))),[0,1,0]);
      }
      // Close the raised header over the windshield and over the rear barn doors.
      for(const [z,n] of [[tr,-1],[tf,1]])shell.quad([[a*rx,ry,z],[b*rx,ry,z],rp(b,z),rp(a,z)],d.paint,null,[0,0,n]);
    }
    const fw=[cabSide(-1,bf,top(bf)),cabSide(1,bf,top(bf)),cabSide(1,tf,ry),cabSide(-1,tf,ry)];
    shell.quad(fw,d.ink,null,[0,.28,1]);
    const backWall=[cabSide(1,br,top(br)),cabSide(-1,br,top(br)),cabSide(-1,tr,ry),cabSide(1,tr,ry)];
    shell.quad(backWall,d.ink,null,[0,.24,-1]);
    function pointAt(vs,u,v){return blend(blend(vs[0],vs[1],u),blend(vs[3],vs[2],u),v);}
    function pane(vs,normal,tint){
      // Narrow rubber seals, an opaque graded sky reflection, and a single oblique highlight.
      shell.quad(vs,'#172026',null,normal);
      const pt=(u,v,push=.009)=>pointAt(vs,u,v).map((n,i)=>n+normal[i]*push);
      const gi=[pt(.026,.043),pt(.974,.043),pt(.974,.960),pt(.026,.960)];
      const colors=tint?['#132435','#263d53','#627e93','#455673']:['#142739','#244354','#7194a5','#5b658c'];
      glass.quad(gi,colors,null,normal);
      const gl=[pt(.08,.65,.016),pt(.41,.65,.016),pt(.73,.92,.016),pt(.38,.92,.016)];
      glass.quad(gl,[tint?'#344a65':'#435d72',tint?'#3d5571':'#536982',tint?'#5b6a90':'#74879e',tint?'#536880':'#637895'],null,normal);
    }
    const pushZ=(p,amount)=>[p[0],p[1],p[2]+amount];
    const windshield=[pointAt(fw,.052,.11),pointAt(fw,.948,.11),pointAt(fw,.947,.912),pointAt(fw,.053,.912)].map(p=>pushZ(p,.011));
    pane(windshield,[0,.35,1],false);
    if(van)rod(metal,pushZ(pointAt(windshield,.50,.01),.027),pushZ(pointAt(windshield,.50,.99),.027),.023,'#a9a2ae',7);
    const rearWindow=[pointAt(backWall,.089,.17),pointAt(backWall,.911,.17),pointAt(backWall,.91,.89),pointAt(backWall,.09,.89)].map(p=>pushZ(p,-.012));
    if(van){
      // Each stamped barn door has its own round-corner window and chrome seal.
      for(const cx of [.25,.75]){
        const point=(angle,r)=>{const cs=Math.cos(angle),sn=Math.sin(angle),u=Math.sign(cs)*Math.abs(cs)**.70,v=Math.sign(sn)*Math.abs(sn)**.70;
          return pushZ(pointAt(rearWindow,cx+u*.224*r,.51+v*.40*r),-.014);};
        const center=pushZ(pointAt(rearWindow,cx,.51),-.014),normal=[0,.15,-1];
        for(let j=0;j<24;j++){
          const a=2*Math.PI*j/24,b=2*Math.PI*(j+1)/24,sh=angle=>Math.sin(angle)>.30?'#6b7698':Math.sin(angle)<-.45?'#233345':'#425469';
          metal.quad([point(a,1),point(b,1),point(b,.89),point(a,.89)],'#a59bb2',null,normal);
          glass.tri([center,point(a,.89),point(b,.89)],['#48556e',sh(a),sh(b)],null,normal);
        }
      }
      rod(metal,pushZ(pointAt(backWall,.50,.05),-.026),pushZ(pointAt(backWall,.50,.97),-.026),.014,'#765a83',6);
    }else pane(rearWindow,[0,.16,-1],true);
    for(const s of [-1,1]){
      const sidePoint=(z,y)=>{const p=cabSide(s,z,y);p[0]+=s*.012;return p;};
      const windowY=top(.32)+.027,upper=ry-.073;
      const rearWin=van?-.59:br+.085,roofRearWin=van?-.54:tr+.06;
      const w=[sidePoint(rearWin,windowY),sidePoint(bf-.105,windowY),sidePoint(tf-.026,upper),sidePoint(roofRearWin,upper)];
      for(const [a,b] of (snake||crusher?[[0,1]]:[[0,.22],[.256,1]]))pane([pointAt(w,a,0),pointAt(w,b,0),pointAt(w,b,1),pointAt(w,a,1)],[s,.20,0],true);
      if(crusher){
        const net=(u,v)=>{const p=pointAt(w,u,v);p[0]+=s*.025;return p;};
        for(const t of [.24,.50,.76])rod(metal,net(t,.06),net(t,.93),.013,'#473a4c',5);
        for(const t of [.33,.66])rod(metal,net(.03,t),net(.97,t),.013,'#6e5264',5);
      }
      if(high&&!snake){
        const ax=body.cab,sz=bf-.32,ay=top(sz)+.028;
        rod(metal,[s*(ax-.02),ay,sz],[s*(ax+.12),ay+.033,sz-.08],.025,'#555e67',6);
        box(shell,s*(ax+.14),ay+.085,sz-.12,.13,.16,.18,'#252b32',0,-s*.12,0);
        box(glass,s*(ax+.145),ay+.085,sz-.215,.098,.125,.012,'#80939b',0,-s*.12,0);
      }
    }
    if(high)for(const s of [-1,1]){
      const ary=[pointAt(windshield,s<0?.12:.53,.078),pointAt(windshield,s<0?.38:.79,.124)];
      rod(metal,pushZ(ary[0],.033),pushZ(ary[1],.033),.010,'#263039',5);
    }
    if(id===0||crusher){
      // An open pickup box has its own floor and inside faces. Crusher's deck
      // narrows to expose its rear trusses; BIGFOOT keeps a straight longbed.
      const rz=rear+.035,fz=br-.025,yFloor=crusher?1.84:1.94;
      const deckZ=[rz,((rz+fz)*.5),fz],floorPoint=(s,z)=>[s*(width(z)-.072),yFloor,z];
      for(let k=0;k<deckZ.length-1;k++){
        const z1=deckZ[k],z2=deckZ[k+1],vs=[floorPoint(-1,z1),floorPoint(1,z1),floorPoint(1,z2),floorPoint(-1,z2)];
        decal.quad(vs,'#fff',vs.map(p=>uvPanel(panels.bed,(p[0]/(width(p[2])-.072)+1)/2,(p[2]-rz)/(fz-rz))),[0,1,0]);
        for(const s of [-1,1]){
          const e=z=>[s*width(z),top(z),z],a=e(z1),b=e(z2),ai=[a[0]-s*.064,a[1],z1],bi=[b[0]-s*.064,b[1],z2];
          shell.quad([floorPoint(s,z1),floorPoint(s,z2),bi,ai],d.ink,null,[-s,0,0]);
          shell.quad([a,b,bi,ai],d.highlight,null,[0,1,0]);
        }
      }
      box(shell,0,top(rz)-.026,rz,2*width(rz),.054,.07,d.paint);
    }
    if(id===0){
      // The square longbed carries a full-width sports hoop, four circular
      // forward-facing rally lamps, twin exhaust stacks and a centrally strapped fuel cell.
      const bar='#9bb3bc',hz=-.98;
      box(metal,0,2.025,-1.94,.68,.15,.39,'#3d505d');
      for(const sx of [-.24,.24])box(metal,sx,2.105,-1.94,.047,.017,.395,'#a3b6c1');
      box(lit,0,2.105,-2.05,.30,.015,.025,d.accent);
      const hoop=[[-.87,2.03,hz],[-.87,2.93,hz],[-.72,3.13,hz],[.72,3.13,hz],[.87,2.93,hz],[.87,2.03,hz]];
      for(let i=1;i<hoop.length;i++)rod(metal,hoop[i-1],hoop[i],.058,bar);
      for(const s of [-1,1]){
        rod(metal,[s*.835,2.95,hz],[s*.82,2.09,-2.39],.046,bar);
        rod(metal,[s*.69,2.01,-1.25],[s*.69,2.88,-1.25],.086,'#627785',12);
        rod(metal,[s*.69,2.86,-1.25],[s*.69,2.976,-1.278],.095,'#a2b7bf',12);
        rod(shell,[s*.69,2.971,-1.278],[s*.69,2.982,-1.28],.068,'#25313a',12);
      }
      for(const x of [-.64,-.22,.22,.64]){
        rod(metal,[x,3.11,hz],[x,3.22,hz],.037,'#566d79',6);
        rod(metal,[x,3.255,hz-.080],[x,3.255,hz+.061],.157,'#b0bec4',high?16:10);
        rod(shell,[x,3.255,hz-.084],[x,3.255,hz-.106],.132,'#293847',high?16:10);
        box(lit,x,3.254,hz-.108,.084,.018,.008,d.accent);
        rod(lit,[x,3.255,hz+.062],[x,3.255,hz+.075],.132,d.lamp,high?16:10);
      }
    }
    if(snake){
      // The rear shell closes over the engine as a tapering reptilian tail.
      // Its three raised chevron scales are part of the rear silhouette.
      const tailZ=[rear,-2.30,-1.71,br],us=[-1,-.54,0,.54,1];
      const crown=z=>.172+.115*(z-rear)/(br-rear);
      const point=(u,z)=>[u*width(z),top(z)+crown(z)*(1-Math.abs(u)),z];
      for(let k=0;k<tailZ.length-1;k++)for(let j=0;j<us.length-1;j++){
        const a=us[j],b=us[j+1],z1=tailZ[k],z2=tailZ[k+1];
        const p=[point(a,z1),point(b,z1),point(b,z2),point(a,z2)];
        shell.quad(p,j===1||j===2?'#317766':'#235f55',null,[0,1,0]);
      }
      for(let j=0;j<us.length-1;j++){
        const a=point(us[j],rear),b=point(us[j+1],rear);
        shell.quad([[a[0],top(rear),rear],[b[0],top(rear),rear],b,a],'#2a685b',null,[0,0,-1]);
      }
      for(const z of [-2.26,-1.82,-1.38]){
        const scale=.79+(z+2.26)*.27,y=top(z)+crown(z);
        for(const s of [-1,1]){
          // The ridged root and the pale tip are individually visible from behind.
          const a=[s*.025,y+.014,z-.18],b=[s*.52*scale,y-.115,z-.24],c=[s*.71*scale,y+.40*scale,z-.06],e=[s*.34*scale,y-.045,z+.23];
          shell.tri([a,b,c],'#358978',null,[0,.25,-1]);
          shell.tri([a,c,e],'#70bd73',null,[-s*.2,1,0]);
          shell.tri([b,e,c],'#244f4e',null,[s,0,0]);
          rod(lit,blend(b,c,.28),blend(b,c,.95),.015,d.accent,5);
          rod(metal,blend(a,c,.08),blend(a,c,.91),.012,'#72ad75',5);
        }
      }
      for(const s of [-1,1]){
        rod(metal,[s*.79,2.04,-1.29],[s*.45,1.925,-2.54],.049,'#629084',7);
        rod(metal,[s*.90,1.65,-1.51],[s*.45,1.925,-2.54],.041,'#72a88b',7);
      }
    }
    if(crusher){
      // Crusher's two exposed radiator fans face the chase camera. Its rear
      // stabilizer mounts to the frame on open V-struts rather than a pickup hoop.
      box(metal,0,2.285,-1.55,1.40,.58,.18,'#5d5961',.09);
      box(shell,0,2.285,-1.658,1.31,.52,.04,'#292b34',.09);
      for(const s of [-1,1]){
        const x=s*.345,y=2.30,z=-1.69;
        rod(metal,[x,y,z+.026],[x,y,z-.018],.226,'#96838a',high?20:12);
        rod(shell,[x,y,z-.017],[x,y,z-.026],.198,'#13232a',high?20:12);
        for(let b=0;b<6;b++){
          const a=b*Math.PI/3,fan=(r,angle)=>[x+r*Math.cos(angle),y+r*Math.sin(angle),z-.031];
          metal.quad([fan(.059,a-.27),fan(.181,a-.10),fan(.178,a+.48),fan(.093,a+.28)],'#74828a',null,[0,0,-1]);
        }
        rod(metal,[x,y,z-.03],[x,y,z-.056],.053,d.accent,8);
        rod(metal,[s*.57,1.91,-.88],[s*1.03,2.78,-2.33],.052,'#b36f83',7);
        rod(metal,[s*.65,1.875,-2.43],[s*1.03,2.78,-2.33],.056,'#bb8392',7);
        rod(metal,[s*.78,2.44,-.60],[s*.83,1.998,-2.18],.040,'#a57585',7);
        rod(metal,[s*1.03,2.76,-2.33],[s*.63,1.88,-1.46],.033,'#c09598',7);
        box(shell,s*1.14,2.837,-2.31,.065,.30,.51,d.paint,-.13);
        box(lit,s*1.177,2.87,-2.32,.010,.040,.26,d.accent,-.13);
      }
      box(shell,0,2.815,-2.33,2.29,.076,.442,d.highlight,-.13);
      box(lit,0,2.865,-2.532,2.19,.033,.027,d.accent,-.13);
    }
    // Four nose assemblies and three different taillight patterns leave a
    // recognizable vehicle at both ends, even with the paint switched off.
    for(const s of [-1,1]){
      if(id===0){
        box(metal,s*.78,2.065,front+.013,.37,.249,.072,'#455968');
        box(lit,s*.783,2.087,front+.054,.310,.116,.012,d.lamp);
        box(lit,s*.783,1.980,front+.055,.288,.032,.012,d.accent);
        if(high)for(let i=0;i<4;i++)box(metal,s*.783+(i-1.5)*.070,2.087,front+.062,.009,.118,.006,'#466671');
      }else if(van){
        // Round lamps sit in independent torpedo fenders beside the narrow bonnet.
        const podX=s*.922,podZ=front-.025;
        rod(metal,[podX,2.088,podZ-.16],[podX,2.088,podZ+.062],.170,'#a0a1ad',high?20:12);
        rod(lit,[podX,2.088,podZ+.062],[podX,2.088,podZ+.073],.133,d.lamp,high?20:12);
        box(lit,podX,2.088,podZ+.080,.162,.032,.007,'#fff1f7');
      }else if(crusher){
        // Four square lamps flank a full-width competition grille.
        box(metal,s*.865,2.023,front+.020,.401,.333,.087,'#6c5864');
        for(const dy of [-.082,.082]){
          box(shell,s*.865,2.023+dy,front+.063,.329,.143,.013,'#242e39');
          box(lit,s*.865,2.023+dy,front+.073,.259,.079,.012,dy>0?d.lamp:d.accent);
        }
      }
      const tx=width(rear)*.88,ty=crusher?1.80:1.91;
      if(van){
        for(let i=0;i<2;i++)rod(lit,[s*tx,1.75+i*.16,rear+.01],[s*tx,1.75+i*.16,rear-.040],.065,i?'#fd62ab':'#a52c84',12);
      }else if(snake){
        rod(lit,[s*(tx-.15),1.77,rear-.029],[s*(tx+.018),1.98,rear-.029],.028,d.trim,6);
      }else{
        box(metal,s*tx,ty,rear-.012,.140,crusher?.26:.35,.044,'#2c3040');
        for(let i=-1;i<=1;i++)box(lit,s*tx,ty+i*(crusher?.063:.083),rear-.038,.103,.033,.013,i===1?d.trim:'#ff4976');
      }
      const rockerX=width(0)-.007;
      box(metal,s*rockerX,1.577,-.02,.036,.065,1.18,'#283c49');
      box(lit,s*(rockerX+.023),1.583,-.02,.010,.022,.96,van?d.trim:d.accent);
      box(lit,s*(width(rear)*.51),1.628,rear-.019,width(rear)*.51,.023,.029,snake?d.trim:'#f94c87');
    }
    if(van){
      // A high rounded grille and separate rolled wings make the 1950s face.
      const zg=front+.034,half=.389;
      const face=[[-half,1.65,zg],[half,1.65,zg],[half*.76,2.215,zg+.065],[-half*.76,2.215,zg+.065]];
      shell.quad(face,'#252733',null,[0,0,1]);
      for(let i=-4;i<=4;i++){
        const x=i*.074,gt=2.229-.088*Math.abs(i)/4;
        rod(metal,[x,1.678,zg+.014],[x*.79,gt,zg+.076],.022,'#b8afbb',high?8:6);
      }
      for(const s of [-1,1]){
        const rolled=(z,inner,outer,low,crest)=>{
          const center=(inner+outer)/2,rad=(outer-inner)/2,ring=[];
          for(let i=0;i<=8;i++){const a=i*Math.PI/8;ring.push([s*(center+rad*Math.cos(a)),low+(crest-low)*Math.sin(a)]);}
          ring.push([s*inner,low-.18],[s*outer,low-.18]);return [z,ring];
        };
        loft(shell,[rolled(.86,.66,1.015,2.29,2.36),rolled(1.30,.60,1.17,2.20,2.45),rolled(1.77,.55,1.23,2.15,2.48),rolled(2.18,.57,1.20,2.10,2.43),rolled(2.46,.63,1.14,2.06,2.31),rolled(2.54,.72,1.06,2.05,2.23)],
          ['#452d55','#664675','#80558a','#985796','#995a99','#835892','#5c3b6a','#4b2c56','#35253d','#332537','#47304c']);
        for(let i=0;i<3;i++)rod(metal,[s*1.04,2.19,1.07+i*.079],[s*1.064,2.31,1.13+i*.079],.013,'#c68eaa',5);
      }
      // Two inset marker lights sit under the rounded windshield header.
      for(const s of [-1,1])box(lit,s*.61,3.164,.352,.164,.031,.024,d.lamp);
    }
    if(snake){
      // The front end is a broad cobra head. Its raised cheeks carry shaped
      // eyes in the actual outer facet, so the pupil follows the head in 3D.
      const mouthZ=front+.035;
      shell.quad([[-.81,1.64,mouthZ],[.81,1.64,mouthZ],[.75,2.08,mouthZ],[-.75,2.08,mouthZ]],'#182a2a',null,[0,0,1]);
      for(const s of [-1,1]){
        const brow=(z,inside,outside,low,high)=>[z,[[s*inside,low],[s*(inside+.02),high-.08],[s*(inside+(outside-inside)*.57),high+.079],[s*outside,high-.034],[s*(outside-.03),low+.027]]];
        const rings=loft(shell,[brow(.58,.56,.85,2.25,2.39),brow(1.30,.53,1.19,2.18,2.55),brow(1.88,.48,1.31,2.11,2.64),brow(2.37,.39,1.10,2.07,2.48),brow(2.66,.32,.85,2.04,2.28)],
          ['#2e675a','#58a367','#418a6c','#23594f','#294d48']);
        const rearEdge=rings[2],frontEdge=rings[3],eyeFace=[frontEdge[4],rearEdge[4],rearEdge[3],frontEdge[3]];
        const ep=(u,v,depth=0)=>{const pt=pointAt(eyeFace,u,v);pt[0]+=s*(.010+depth);return pt;};
        const eye=(batch,pairs,col,depth)=>{const pts=pairs.map(([u,v])=>ep(u,v,depth));for(let j=1;j<pts.length-1;j++)batch.tri([pts[0],pts[j],pts[j+1]],col,null,[s,0,.40]);};
        eye(shell,[[.01,.26],[.52,.76],[.98,.91],[.84,.48],[.37,.20]],'#15272a',.002);
        eye(lit,[[.09,.30],[.53,.67],[.89,.80],[.75,.52],[.33,.28]],d.accent,.008);
        eye(shell,[[.48,.40],[.51,.60],[.59,.66],[.55,.43]],'#173631',.014);
        // An ivory tapered fang is independent of the lower jaw and front bumper.
        const x=s*.57,z=mouthZ+.018;
        const root=[[x-.111,2.076,z],[x+.111,2.076,z],[x+.081,2.068,z+.070],[x-.081,2.068,z+.070]];
        const mid=root.map(([px,,pz])=>[.85*(px-x)+s*.55,1.83,pz+.006]);
        for(let k=0;k<4;k++){
          const next=(k+1)%4,normal=[Math.sin(k*Math.PI*.5),-.08,Math.cos(k*Math.PI*.5)];
          shell.quad([root[k],root[next],mid[next],mid[k]],'#e4dcb0',null,normal);
          shell.tri([mid[k],mid[next],[s*.49,1.385,z-.04]],'#f7edca',null,normal);
        }
        for(let j=0;j<2;j++){const x=s*(.15+j*.14);shell.tri([[x-.05,2.05,z],[x+.05,2.05,z],[x,1.89+j*.016,z+.015]],'#dedcb5',null,[0,0,1]);}
        rod(shell,[s*.31,2.182,2.52],[s*.31,2.214,2.57],.066,'#1b4540',8);
      }
    }
    if(crusher){
      // A blunt fender lip, slatted grille and three-port injector protrude from the square hood.
      box(shell,0,2.04,front+.019,1.34,.325,.047,'#202d34');
      for(const y of [1.93,2.038,2.147])box(metal,0,y,front+.046,1.27,.024,.026,'#ab9da1');
      for(const s of [-1,1]){
        box(shell,s*1.12,2.285,1.80,.13,.12,1.43,d.highlight);
        box(lit,s*1.19,2.293,1.81,.012,.018,1.24,d.accent);
      }
      box(metal,0,2.426,1.57,.57,.113,.53,'#81777d');
      loft(shell,[[1.24,[[-.22,2.46],[-.19,2.57],[.19,2.57],[.22,2.46]]],[1.69,[[-.30,2.46],[-.30,2.69],[.30,2.69],[.30,2.46]]],[1.84,[[-.30,2.46],[-.30,2.69],[.30,2.69],[.30,2.46]]]],['#902c53','#ee5588','#8b3556','#402e38']);
      for(const x of [-.19,0,.19]){
        rod(metal,[x,2.573,1.827],[x,2.573,1.855],.084,'#d4a6a0',12);
        rod(shell,[x,2.573,1.854],[x,2.573,1.863],.061,'#1f2b31',12);
      }
    }
    const sub=new T.Group();sub.name=body.name;decal.mesh(sub);shell.mesh(sub);metal.mesh(sub);glass.mesh(sub);lit.mesh(sub,false);sub.position.y=-bodyPivot;
    return sub;
  }
  function chassis(id,high){
    const frame=new Batch(metalMaterial),dark=new Batch(paintMaterial),d=roster[id],van=id===1;
    const rail=van?'#6d4881':id===2?'#3a695c':id===3?'#85415b':'#405675';
    const frameNames=['Open ladder frame','Cross-braced van cradle','Tapered backbone frame','Wide competition spaceframe'];
    for(const s of [-1,1]){
      // Each chassis shares its axle interfaces, with its own exposed load path.
      const strut=(a,b,r=.056,finish=rail)=>rod(frame,[s*a[0],a[1],a[2]],[s*b[0],b[1],b[2]],r,finish,8);
      if(id===0){
        strut([.63,1.41,-2.60],[.63,1.41,2.57],.075);
        strut([.54,.96,-.85],[.54,.96,.79],.071);
        strut([.54,.96,-.85],[.63,1.41,-1.42]);strut([.54,.96,.79],[.63,1.41,1.35]);
        for(const z of [-.67,.62])strut([.54,.96,z],[.63,1.41,z],.045);
      }else if(van){
        strut([.67,1.41,-2.57],[.70,1.41,.98],.071);
        strut([.70,1.41,.98],[.46,1.34,2.59],.063);
        strut([.56,.95,-1.05],[.56,.95,.92],.066);
        strut([.57,.97,-1.08],[.70,1.41,.36]);strut([.67,1.41,-.98],[.56,.95,.40]);
        strut([.56,.95,-1.05],[.67,1.41,-1.69]);strut([.56,.95,.92],[.67,1.40,1.56]);
      }else if(id===2){
        strut([.34,1.48,-2.61],[.73,1.35,-.68],.067);
        strut([.73,1.35,-.68],[.73,1.35,.74],.067);
        strut([.73,1.35,.74],[.49,1.49,2.57],.067);
        strut([.34,1.48,-2.61],[.45,.91,-.50]);
        strut([.45,.91,-.50],[.45,.91,.52],.070);strut([.45,.91,.52],[.49,1.49,2.57]);
        strut([.45,.91,-.50],[.73,1.35,.74],.051,'#659887');
      }else{
        strut([.90,1.43,-2.49],[.72,1.42,-.52],.077);
        strut([.72,1.42,-.52],[.72,1.42,.79],.079);
        strut([.72,1.42,.79],[.89,1.42,2.53],.077);
        strut([.64,.94,-1.10],[.64,.94,1.04],.068);
        for(const z of [-1,0,1]){strut([.64,.94,z],[.72,1.42,z+.43],.048);strut([.72,1.42,z-.38],[.64,.94,z],.045);}
        strut([.64,.94,-1.10],[.90,1.43,-2.49]);strut([.64,.94,1.04],[.89,1.42,2.53]);
      }
      if(high)rod(frame,[s*.60,1.39,.20],[s*.53,.98,.68],.042,rail);
      // Shock towers carry both the cylinder eye and the upper reaction link.
      for(const end of [-1,1]){
        rod(frame,[s*.60,1.38,end*1.24],[s*.81,1.91,end*1.24],.055,rail,7);
        rod(frame,[s*.60,1.38,end*1.72],[s*.81,1.91,end*1.24],.046,rail,7);
        rod(frame,[s*.60,1.38,end*.53],[s*.54,1.34,end*.53],.056,rail,7);
      }
    }
    for(const z of [-2.35,-.64,.71,2.39])rod(frame,[-.60,1.39,z],[.60,1.39,z],.055,rail);
    // Lower sump, cast block and a pair of real exhaust runs keep the underside legible in midair.
    box(dark,0,1.17,.35,.69,.39,.96,'#3e464b');
    box(frame,0,.963,.32,.52,.094,.64,'#7a7d75');
    for(const s of [-1,1]){
      box(frame,s*.25,1.43,.36,.25,.15,.86,van?'#735583':'#687984',0,0,s*.18);
      rod(frame,[s*.44,1.32,.67],[s*.65,1.17,.02],.06,'#798589',8);
      rod(frame,[s*.65,1.17,.02],[s*.66,1.26,-.84],.07,'#80868b',8);
      rod(frame,[s*.66,1.26,-.84],[s*.89,1.43,-1.02],.081,'#b3b9b9',8);
    }
    // The fanged nose and narrow tail have a V-guard. The longbed uses rolled
    // chrome, the panel van a curved tubular bar, and Crusher a square bash bar.
    for(const end of [-1,1]){
      const bp=bodies[id],z=end>0?bp.front+.031:bp.rear-.033;
      if(id===0){
        rod(frame,[-.97,1.54,z],[.97,1.54,z],.075,'#a3b1b9',high?12:8);
        for(const s of [-1,1])rod(frame,[s*.97,1.54,z],[s*1.02,1.57,z-end*.22],.057,'#8b969a');
      }else if(van){
        rod(frame,[-.59,1.55,z],[.59,1.55,z],.077,'#9f96a8',high?12:8);
        for(const s of [-1,1]){
          rod(frame,[s*.59,1.55,z],[s*1.04,1.62,z-end*.15],.071,'#9f96a8');
          rod(frame,[s*1.04,1.62,z-end*.15],[s*1.10,1.70,z-end*.33],.067,'#938a9d');
        }
      }else if(id===2){
        for(const s of [-1,1]){
          rod(frame,[0,1.41,z],[s*(end>0?.82:.68),1.57,z-end*.22],.052,'#789e89',7);
          rod(frame,[s*.49,1.38,z-end*.49],[s*(end>0?.82:.68),1.57,z-end*.22],.046,rail,7);
        }
      }else{
        const w=end>0?2.18:1.82;
        box(frame,0,1.50,z,w,.144,.14,'#6f6974');
        for(const s of [-1,1]){
          box(frame,s*(w/2-.10),1.50,z,.15,.175,.16,d.paint);
          rod(frame,[s*.61,1.22,z-end*.31],[s*.80,1.49,z],.050,rail,7);
        }
      }
      rod(frame,[-.43,1.38,z-end*.11],[.43,1.38,z-end*.11],.042,rail);
    }
    box(frame,0,1.33,bodies[id].rear+.02,.14,.085,.18,'#353c40');
    const node=new T.Group();node.name=frameNames[id];frame.mesh(node);dark.mesh(node);return node;
  }
  // The axle housings and differentials are unsprung. A setup change moves the
  // body, frame and engine above them without moving a single wheel center.
  function axles(high){
    if(axleParts.has(high))return axleParts.get(high);
    const node=new T.Group();node.name='Live axles and differentials';
    for(const z of [1.65,-1.65]){
      const steel=new Batch(metalMaterial);
      rod(steel,[-1.39,.864,z],[1.39,.864,z],.106,'#384047',high?14:8);
      bulb(steel,0,.864,z,.26,.23,.25,'#42505b',high?14:8);
      for(const s of [-1,1])box(steel,s*.89,.878,z,.33,.114,.19,'#687581');
      steel.mesh(node);
      const housing=node.children[node.children.length-1];housing.name=z>0?'Front live axle':'Rear live axle';housing.matrixAutoUpdate=false;
    }
    axleParts.set(high,node);return node;
  }

  // Build a continuous helical wire directly into the shock mesh. Geometry is
  // shared between trucks and stays fixed in GPU and software vertex buffers.
  function coilWire(batch,a,b,radius,wire,turns,color,high){
    const start=new T.Vector3(...a),end=new T.Vector3(...b),axis=end.clone().sub(start).normalize();
    const u=new T.Vector3(1,0,0).cross(axis).normalize(),v=axis.clone().cross(u).normalize();
    const rings=[],steps=Math.ceil(turns*(high?10:7)),sides=high?5:4;
    for(let i=0;i<=steps;i++){
      const t=i/steps,angle=t*turns*2*Math.PI,cs=Math.cos(angle),sn=Math.sin(angle);
      const radial=u.clone().multiplyScalar(cs).addScaledVector(v,sn);
      const center=start.clone().lerp(end,t).addScaledVector(radial,radius),ring=[];
      for(let j=0;j<sides;j++){
        const a=j*2*Math.PI/sides,n=radial.clone().multiplyScalar(Math.cos(a)).addScaledVector(axis,Math.sin(a));
        ring.push({p:center.clone().addScaledVector(n,wire).toArray(),n:n.toArray()});
      }
      rings.push(ring);
    }
    for(let i=1;i<rings.length;i++)for(let j=0;j<sides;j++){
      const k=(j+1)%sides,verts=[rings[i-1][j],rings[i][j],rings[i][k],rings[i-1][k]];
      batch.quad(verts.map(q=>q.p),color,null,verts[0].n,verts.map(q=>q.n));
    }
  }
  const basisVector=new T.Vector3(1,0,0);
  function mountBasis(dest,base,shock,arm,axleAxis=basisVector){
    // Two fixed bearing points define the axle line. The two moving upper
    // mounts determine the other basis vectors for both trailing arms and spring.
    return dest.makeBasis(axleAxis,vA.subVectors(shock,base),vB.subVectors(arm,base)).setPosition(base);
  }
  function cornerSuspension(which,side,end,high){
    const key=[which,side,end,high].join(':');if(shockParts.has(key))return shockParts.get(key);
    const spec=suspensionSets[which],mount=new Batch(metalMaterial),s=side,z=end;
    const base=new T.Vector3(s*1.036,.864,z*1.65);
    const neutralShock=new T.Vector3(s*.81,1.91-bodyPivot,z*1.24);
    const neutralArm=new T.Vector3(s*.54,1.34-bodyPivot,z*.53);
    const upper=neutralShock.clone();upper.y+=bodyPivot+spec.lift;
    const link=neutralArm.clone();link.y+=bodyPivot+spec.lift;
    const a=base.toArray(),b=upper.toArray(),c=link.toArray(),foot=[s*.68,.864,z*1.65];
    const shade=which===0?'#508a83':which===1?'#628399':'#a76d58';
    // The two rod ends on the axle remain fixed. The frame-side ends move with
    // their mounts around the body's pitch and roll pivot on every pose.
    rod(mount,foot,c,.053,'#9aabb3',high?8:6);
    rod(mount,[s*.87,.864,z*1.65],[s*(.54+.15),c[1],c[2]],.043,'#778c98',high?8:6);
    rod(mount,[s*.76,.864,z*1.65],b,.051,shade,high?8:6);
    rod(mount,a,b,.034,'#d2dadc',high?10:7);
    const n=high?12:8;
    // The high-travel kit has a long bright shaft and open coils. The firm kit
    // has tight copper wire and an externally mounted short bypass reservoir.
    const lower=[.34,.25,.16][which],upperCoil=[.88,.90,.92][which];
    rod(mount,blend(a,b,lower-.03),blend(a,b,.97),.065,shade,n);
    rod(mount,blend(a,b,lower-.045),blend(a,b,lower),spec.springRadius+.020,'#9bafb8',n);
    rod(mount,blend(a,b,upperCoil),blend(a,b,upperCoil+.042),spec.springRadius+.020,'#9bafb8',n);
    coilWire(mount,blend(a,b,lower+.006),blend(a,b,upperCoil-.005),spec.springRadius,spec.wire,spec.turns,spec.finish,high);
    for(const pt of [a,b,c])rod(mount,[pt[0]-.060,pt[1],pt[2]],[pt[0]+.060,pt[1],pt[2]],.074,'#59656d',n);
    if(which===2){
      const off=(p,amount)=>[p[0]+s*.07,p[1],p[2]+z*amount];
      const aa=off(blend(a,b,.23),.185),bb=off(blend(a,b,.78),.185);
      rod(mount,aa,bb,.064,'#c68d67',n);
      for(const f of [.32,.72])rod(mount,blend(a,b,f),off(blend(a,b,f),.185),.023,'#9aa7ac',6);
    }
    const node=new T.Group();node.name=spec.name+' coilover and four-link';mount.mesh(node);
    const inverse=mountBasis(new T.Matrix4(),base,upper,link).invert();
    const result={node,base,neutralShock,neutralArm,inverse};shockParts.set(key,result);return result;
  }
  function selection(n,fallback){
    if(n===undefined||n===null||n==='')return fallback;
    const v=Number(n);return Number.isInteger(v)&&v>=0&&v<=2?v:fallback;
  }
  function make(index,highDetail=true,setup={}){
    const num=Number(index),id=Number.isFinite(num)?((Math.trunc(num)%roster.length)+roster.length)%roster.length:0;
    const tires=selection(setup?.tires,0),suspension=selection(setup?.suspension,1),preset=suspensionSets[suspension];
    const high=!!highDetail,key=id+':'+high;
    if(!caches.has(key))caches.set(key,{paint:buildBody(id,high),chassis:chassis(id<4?id:[0,1,3][id-4],high)});
    const parts=caches.get(key),wheel=wheelGeometry(id,high,tires),root=new T.Group(),body=new T.Group(),wheels=[],spins=[],struts=[];
    root.name=roster[id].name;body.name='Suspended body';body.position.y=bodyPivot+preset.lift;
    const sprungFrame=parts.chassis.clone(true);sprungFrame.position.y=-bodyPivot;
    const housings=axles(high).clone(true);
    body.add(parts.paint.clone(true),sprungFrame);root.add(housings,body);
    for(const axle of [1,-1])for(const side of [-1,1]){
      const pivot=new T.Group(),spin=wheel.clone(true);
      pivot.position.set(side*1.392,rollingRadius,axle*1.65);pivot.name=(axle===1?'Front ':'Rear ')+(side===1?'right':'left');
      pivot.userData.front=axle===1;pivot.userData.side=side;pivot.add(spin);root.add(pivot);wheels.push(pivot);spins.push(spin);
      const part=cornerSuspension(suspension,side,axle,high),node=part.node.clone(true);
      node.matrixAutoUpdate=false;root.add(node);struts.push({part,node});
    }
    const model={root,body,wheels,spins,struts,axles:housings.children,index:id,setup:{tires,suspension},bodyRestY:bodyPivot+preset.lift,
      rideLift:preset.lift,wheelRadius:rollingRadius,wheelWidth:tireSets[tires].width};
    pose(model,0,0,0);return model;
  }
  const movingShock=new T.Vector3(),movingArm=new T.Vector3(),movingBase=new T.Vector3(),axleDirection=new T.Vector3();
  function pose(model,steerRadians,wheelAngle,compression=0,wheelOffsets){
    const spec=suspensionSets[model.setup.suspension],travel=Math.max(-spec.rebound,Math.min(spec.compression,compression||0));
    model.body.position.y=model.bodyRestY-travel;model.body.updateMatrix();
    for(let axle=0;axle<2;axle++){
      const left=wheelOffsets?.[2*axle],right=wheelOffsets?.[2*axle+1];
      const l=Number.isFinite(left)?left:0,r=Number.isFinite(right)?right:0;
      const rise=(l+r)*.5,slope=(r-l)/(2*1.392),housing=model.axles[axle];
      // The axle line connects the two wheel bearings; interpolate across it
      // to find the exact lower damper and trailing-arm clevis heights.
      housing.matrix.set(1,0,0,0,slope,1,0,rise,0,0,1,0,0,0,0,1);
      housing.matrixWorldNeedsUpdate=true;axleDirection.set(1,slope,0);
      for(let side=0;side<2;side++){
        const i=2*axle+side,pivot=model.wheels[i];
        pivot.position.y=rollingRadius+(side?r:l);pivot.rotation.y=axle===0?steerRadians:-steerRadians*.19;
        model.spins[i].rotation.x=wheelAngle;
        const {node,part}=model.struts[i];
        movingBase.copy(part.base);movingBase.y+=rise+slope*movingBase.x;
        movingShock.copy(part.neutralShock).applyMatrix4(model.body.matrix);
        movingArm.copy(part.neutralArm).applyMatrix4(model.body.matrix);
        mountBasis(node.matrix,movingBase,movingShock,movingArm,axleDirection).multiply(part.inverse);
        node.matrixWorldNeedsUpdate=true;
      }
    }
  }
  return {roster,tireSets,suspensionSets,make,pose};
})();

export {MTMTrucks};
