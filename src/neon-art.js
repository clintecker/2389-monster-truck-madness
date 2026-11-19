/* Bent-glass signs for the 2389 night circuit. The cabinet, the glass artwork
   and each bank of chasing lamps share a drawing measured in sign-shop units.
   The bezels and enamel are painted once. Bright glass and moving bulbs are
   separate raised meshes with graduated halos, including in the CPU renderer. */
const MTMNeonArt=(()=>{
  'use strict';
  const T=THREE,W=120,H=100,tau=Math.PI*2;
  const palette={
    pink:['#ff4f94','#fff2fb'],aqua:['#33f6d9','#ecfffb'],gold:['#ffac37','#fff2a8'],
    lilac:['#ad77ff','#f7e9ff'],ice:['#68caff','#edffff'],red:['#ff654e','#fff0db'],
    ivory:['#ffd9a0','#fffdec'],apple:['#a5ed66','#f8ffdb']
  };
  const colorCache=new Map(),pathCache=new Map();
  // A small absolute-coordinate path reader lets the cabinet press, tube
  // bender and fallback painter all follow exactly the same curves.
  function path(source){
    if(Array.isArray(source))return source;
    if(pathCache.has(source))return pathCache.get(source);
    const tokens=source.match(/[MLQCZ]|-?\d*\.?\d+/g),lines=[];let p=[],i=0,x=0,y=0;
    const number=()=>+tokens[i++];
    const put=(u,v)=>{if(!p.length||Math.hypot(u-p[p.length-1][0],v-p[p.length-1][1])>.001)p.push([u,v]);};
    while(i<tokens.length){
      const op=tokens[i++];
      if(op==='M'){p=[];lines.push(p);x=number();y=number();put(x,y);continue;}
      if(op==='Z'){put(p[0][0],p[0][1]);x=p[0][0];y=p[0][1];continue;}
      if(op==='L'){x=number();y=number();put(x,y);continue;}
      const x0=x,y0=y,cx=number(),cy=number();
      if(op==='Q'){
        x=number();y=number();
        const n=Math.max(3,Math.ceil((Math.hypot(cx-x0,cy-y0)+Math.hypot(x-cx,y-cy))/4));
        for(let j=1;j<=n;j++){const t=j/n,k=1-t;put(k*k*x0+2*k*t*cx+t*t*x,k*k*y0+2*k*t*cy+t*t*y);}
      }else if(op==='C'){
        const ex=number(),ey=number();x=number();y=number();
        const n=Math.max(4,Math.ceil((Math.hypot(cx-x0,cy-y0)+Math.hypot(ex-cx,ey-cy)+Math.hypot(x-ex,y-ey))/4));
        for(let j=1;j<=n;j++){const t=j/n,k=1-t;put(k*k*k*x0+3*k*k*t*cx+3*k*t*t*ex+t*t*t*x,k*k*k*y0+3*k*k*t*cy+3*k*t*t*ey+t*t*t*y);}
      }else throw new Error('Unknown neon tube command '+op);
    }
    pathCache.set(source,lines);return lines;
  }
  const stroke=(d,tone,w=1.2)=>({lines:path(d),tone,w});
  function ring(x,y,rx,ry=rx,count=24){return [Array.from({length:count+1},(_,i)=>[x+Math.cos(i/count*tau)*rx,y+Math.sin(i/count*tau)*ry])];}
  function polygon(ctx,line){ctx.beginPath();line.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();}
  function trace(ctx,lines){
    ctx.beginPath();
    for(const line of lines)line.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
  }
  function circle(ctx,x,y,r,ink){ctx.fillStyle=ink;ctx.beginPath();ctx.arc(x,y,r,0,tau);ctx.fill();}
  // The lettering is bent from a single family of open-ended tubes, avoiding
  // alternate font metrics between a local file, a phone and the game tour.
  const letters={
    A:'M0 7 L2.4 0 L4.8 7 M1 4.9 L3.8 4.9',B:'M0 7 L0 0 L2.7 0 Q5.8 0 4 2.8 L2.9 3.2 L.9 3.2 M2.8 3.3 Q5.4 3.4 4.6 5.5 Q4.3 7 2.8 7 L.7 7',
    C:'M4.5 .7 Q3.2 -.1 1.8 .3 Q0 .8 0 3.1 L0 4 Q0 6.4 1.9 6.9 Q3.6 7.3 4.6 6.3',
    D:'M0 7 L0 0 L1.8 0 Q4.9 0 4.9 3.5 Q4.9 7 1.7 7 L.7 7',
    E:'M4.6 .1 L0 .1 L0 7 L4.7 7 M.6 3.4 L3.8 3.4',F:'M0 7 L0 0 L4.8 0 M.6 3.3 L3.9 3.3',
    G:'M4.5 .8 Q3.2 -.1 1.7 .3 Q0 .8 0 3.2 L0 4.1 Q.1 7 2.7 7 Q4.2 6.9 4.8 6.3 L4.8 3.6 L2.7 3.6',
    H:'M0 0 L0 7 M4.8 0 L4.8 7 M.65 3.5 L4.2 3.5',I:'M.3 0 L4.5 0 M2.4 .5 L2.4 6.5 M.3 7 L4.5 7',
    J:'M.1 5 Q.1 7 2.2 7 Q4.6 7 4.6 4.7 L4.6 0',
    K:'M0 0 L0 7 M4.6 0 L.8 3.7 L4.7 7',L:'M0 0 L0 7 L4.65 7',
    M:'M0 7 L0 .1 L2.45 4.1 L4.85 .1 L4.85 7',N:'M0 7 L0 .2 L4.8 6.8 L4.8 0',
    O:'M2.5 .12 Q4.85 .12 4.85 2.7 L4.85 4.4 Q4.85 6.95 2.45 6.95 Q.04 6.95 .04 4.4 L.04 2.7 Q.04 .4 1.87 .16',
    P:'M0 7 L0 0 L2.7 0 Q4.9 0 4.9 1.9 Q4.9 3.7 2.6 3.7 L.7 3.7',
    Q:'M2.4 .1 Q4.8 .1 4.8 3.4 Q4.8 7 2.4 7 Q0 7 0 3.5 Q0 .1 1.8 .1 M2.8 5.2 L5.1 7.8',
    R:'M0 7 L0 0 L2.7 0 Q4.9 0 4.9 1.9 Q4.9 3.5 2.5 3.5 L.8 3.5 M2.3 4 L4.9 7',
    S:'M4.5 .65 Q3.1 -.15 1.7 .2 Q-.2 .5 .1 2 Q.25 3 2.65 3.5 Q5 4.1 4.7 5.7 Q4.5 7.3 2.2 7 Q.9 7 .1 6.3',
    T:'M0 0 L4.8 0 M2.4 .55 L2.4 7',U:'M0 .05 L0 4.7 Q0 7 2.4 7 Q4.8 7 4.8 4.7 L4.8 .05',
    V:'M0 0 L2.4 7 L4.8 0',W:'M0 0 L.65 7 L2.45 3.25 L4.2 7 L4.9 0',
    X:'M0 .1 L4.8 7 M4.8 .1 L0 7',Y:'M0 0 L2.4 3.6 L4.8 0 M2.4 4.2 L2.4 7',
    Z:'M.1 0 L4.8 0 L.1 7 L4.8 7','-':'M.55 3.5 L4.2 3.5'
  };
  function word(value,x,y,w,h,tone,italic=0){
    const lines=[],step=6.35,sx=w/((value.length-1)*step+4.85),sy=h/7;
    for(let i=0;i<value.length;i++){
      if(!letters[value[i]])continue;
      for(const line of path(letters[value[i]]))lines.push(line.map(([a,b])=>[x-w/2+(a+i*step)*sx+italic*(1-b/7),y+b*sy]));
    }
    return {lines,tone,w:Math.min(1.48,Math.max(.88,.74*Math.min(sy,sx)))};
  }
  const frame=(outer,paint)=>({outer,paint});
  const cobalt='#133247',wine='#53253d',umber='#563438',plum='#382b55',green='#1d433d',blush='#71444d';
  const boot='M40 8 Q50 4 55 12 Q63 16 70 6 L79 10 L72 43 Q69 54 76 58 Q85 64 94 62 Q106 59 113 65 Q117 69 113 72 Q105 81 82 83 L56 82 L54 88 L31 88 L32 79 Q26 74 29 66 L38 45 Z';
  const bootRail='M42 12 Q50 9 54 15 Q63 21 70 11 L75 13 L69 44 Q66 56 75 61 Q86 68 96 65 Q106 62 110 68 Q104 78 82 80 L54 79 L52 85 L34 85 L35 77 Q29 71 32 66 L41 45 Z';
  const cres='M87 7 Q65 -1 46 10 Q22 22 19 48 Q16 73 38 85 Q57 94 79 81 Q51 84 42 62 Q32 39 53 22 Q68 10 87 7 Z';
  const moonPlaque='M48 47 L108 43 L116 48 L110 72 L49 76 L43 72 Z';
  const coyote='M12 52 Q17 35 32 28 L24 11 L41 18 L44 5 L57 21 Q68 21 76 27 L97 18 L108 13 L113 18 L105 27 L91 34 L74 40 L68 51 Q62 57 53 62 L53 68 L99 67 L106 72 L102 88 L14 89 L8 83 Z';
  const heart='M56 23 L53 12 Q52 8 56 7 L61 6 L65 21 L66 9 Q66 5 71 5 L76 7 L73 22 L81 12 Q83 10 87 14 L88 17 L80 28 Q97 33 99 48 Q103 65 91 78 Q81 87 64 94 Q35 83 24 63 Q12 40 25 29 Q34 21 44 25 L36 14 Q34 11 38 9 L43 8 Z';
  const owl='M6 19 Q24 16 41 28 Q50 24 59 31 Q72 22 83 28 Q94 17 114 18 L111 44 Q104 58 89 59 Q72 62 65 46 L59 42 L55 47 Q45 62 31 58 Q13 54 10 41 Z';
  const owlPlaque='M23 63 L95 60 L106 67 L101 83 L26 86 L16 80 L17 67 Z';
  const shroom='M6 50 Q9 32 25 20 Q43 6 61 7 Q84 8 103 28 Q111 37 114 51 Q98 61 74 63 L78 72 Q83 77 88 79 L86 86 Q61 95 38 86 L34 82 L39 76 Q45 72 46 63 Q21 61 6 53 Z';
  const arrow='M7 20 L77 15 Q103 13 108 36 L111 50 L118 45 L107 82 L80 58 L91 58 L86 42 L47 46 L48 56 L13 60 Z';
  const arrowPlate='M8 66 L57 60 L67 68 L56 79 L14 83 Z';
  const fan='M60 89 Q57 90 54 87 L7 51 L13 38 L8 34 L22 19 L27 20 L36 10 L43 13 L57 4 L66 10 L78 6 L86 16 L94 15 L105 31 L110 33 L115 47 L65 87 Z';
  const fanPlaque='M24 59 L92 59 L99 65 L94 78 L28 80 L21 73 Z';
  const pin='M56 6 Q67 2 74 8 Q80 15 74 27 Q68 37 73 47 Q83 60 85 73 Q86 87 75 93 L44 93 Q32 89 34 74 Q35 60 47 44 Q52 36 47 25 Q40 12 50 8 Z';
  const pinPlate='M9 54 L50 48 L58 54 L54 76 L13 82 L5 75 Z';
  const railOf=(d)=>path(d)[0];
  function rails(...strings){return strings.map(railOf);}
  const where=[
    {id:'neon-boot-loop',region:'arizona',f:.039,off:24,name:'Boot Loop',crew:'Ivan',ink:'#ffbd66',reply:'Sole rebooted. Your left foot needs a firmware update.',sound:'bleep',
      caption:'Ivan’s boot-repair counter has been restarting since mile zero.',unit:.157,lift:3.3,mount:'angle',support:49,edge:'gold',lamp:'ivory',enamel:umber,
      panels:[frame(boot,umber)],rail:rails(bootRail),bulbs:54,
      words:[['BOOT',55,26,25.5,10,'ice',1],['LOOP',69,65,48,11,'ivory',1]],
      tubes:[stroke('M41 17 Q51 12 57 20 Q64 22 71 15','pink',1.25),stroke('M48 42 L53 52 L59 40 M43 47 L47 54 L50 57 M62 44 L58 54 L54 57','gold'),stroke('M34 76 Q44 72 54 76 M78 59 Q85 60 91 58','pink',.95)],
      chime:'spur'},
    {id:'neon-moon-lease',region:'arizona',f:.426,off:-27,name:'Moon by the Hour',crew:'Soon',ink:'#8edcff',reply:'The remaining crescent is being held as your deposit.',sound:'bell',
      caption:'Soon rents the bright half. Utilities are extra.',unit:.153,lift:3.8,mount:'rail',support:49,edge:'ice',lamp:'gold',enamel:cobalt,
      panels:[frame(cres,cobalt),frame(moonPlaque,plum)],rail:rails(cres),bulbs:46,
      words:[['MOON',81,49,47,9,'ivory',.7],['FOR RENT',79,62,59,7,'pink',.7]],
      tubes:[stroke('M34 34 Q37 37 40 34 M31 45 Q29 50 34 51 M34 57 Q38 59 40 55','ice',1.35),
        stroke('M25 47 Q22 65 36 75 M46 80 L52 82','aqua',.9)],chime:'stars'},
    {id:'neon-howl-mat',region:'arizona',f:.825,off:25,name:'Howl-a-Mat',crew:'Harper',ink:'#ff9566',reply:'Your howl is clean. Tumble dry on low.',sound:'cheer',
      caption:'Harper washes howls, growls and other delicate fabrics.',unit:.146,lift:3.0,mount:'twins',support:51,edge:'red',lamp:'gold',enamel:wine,
      panels:[frame(coyote,wine)],rail:rails('M14 80 L18 59 M15 82 L98 81 L100 75','M31 28 L29 17 L40 23 M46 22 L46 12 L54 23'),bulbs:24,
      words:[['HOWL',36,39,32,12,'gold',1],['HOWL-A-MAT',59,72,77,9,'ivory',.7]],
      tubes:[stroke('M48 26 Q58 26 66 30 L62 32 L57 32 M74 32 L91 26 L104 19 M74 36 L86 35 M41 50 L35 58 L42 56 L39 63 L52 57','red',1.35),stroke('M17 57 L22 50 M21 59 L25 54','pink',1.05)],chime:'howl'},
    {id:'neon-overclock-cardio',region:'eight',f:.105,off:-23,name:'Overclock Cardiology',crew:'Eryan',ink:'#ff7797',reply:'One hundred and eighty beats per sandwich.',sound:'bleep',
      caption:'Walk-in cardiology. Walk-out tempo varies.',unit:.165,lift:2.8,mount:'tripod',support:61,edge:'pink',lamp:'ice',enamel:wine,
      panels:[frame(heart,wine)],rail:rails('M78 29 Q93 34 95 47 Q99 62 88 75 Q79 83 63 90 Q39 80 27 62 Q17 44 26 34'),bulbs:31,
      words:[['BEAT',62,37,50,13,'ivory',1],['CREDIT',61,70,44,8,'pink',.5]],
      tubes:[stroke('M39 12 L46 23 L47 32 M57 11 L61 24 M70 9 L68 25 Q66 30 60 32 M83 16 L75 28','red',1.4),
        stroke('M36 62 Q42 68 46 70 M75 79 L67 85','lilac',.9)],chime:'beat'},
    {id:'neon-night-owl-optical',region:'eight',f:.513,off:27,name:'Night Owl Optical',crew:'Dylan',ink:'#b399ff',reply:'Both eyes have independently requested a second opinion.',sound:'bleep',
      caption:'Dylan’s optician works the graveyard shift by instinct.',unit:.156,lift:3.7,mount:'rail',support:60,edge:'lilac',lamp:'pink',enamel:plum,
      panels:[frame(owl,plum),frame(owlPlaque,cobalt)],rail:rails('M21 68 L27 66 L94 63 L101 68 L97 79 L27 83 L20 78 Z'),bulbs:33,
      words:[['OWL OPTICAL',61,68,73,10,'ivory',.4]],
      tubes:[stroke('M13 24 Q28 25 39 34 Q49 30 54 36 M108 23 Q94 23 83 34 Q72 31 65 36 M55 34 Q60 30 65 34','pink',1.5),
        stroke('M16 35 Q32 25 48 39 Q43 56 31 53 Q19 51 16 35 Z M71 39 Q89 25 104 32 Q103 49 90 53 Q77 56 71 39 Z','aqua',1.5),
        stroke('M58 43 L61 51 L67 43','gold',1.5)],chime:'eyes'},
    {id:'neon-shroom-service',region:'eight',f:.82,off:-27,name:'Shroom Service',crew:'Sugi',ink:'#b8f97c',reply:'Breakfast has been left outside your spore.',sound:'bell',
      caption:'Sugi’s room-service menu is mycelium only.',unit:.146,lift:3.3,mount:'angle',support:60,edge:'apple',lamp:'gold',enamel:green,
      panels:[frame(shroom,green)],rail:rails('M11 48 Q15 31 31 20 Q45 10 61 11 Q83 12 99 30 Q107 40 110 49 Q90 59 66 59 Q34 60 11 50 Z'),bulbs:45,
      words:[['SHROOM',61,40,68,11,'ivory',1],['SERVICE',61,74,36,8,'gold',.7]],
      tubes:[stroke('M23 54 Q35 56 48 55 M72 55 Q92 52 99 48 M50 63 L48 70 M72 64 L75 70 M47 83 Q61 88 75 83','aqua',1)],chime:'mushroom'},
    {id:'neon-wrong-valet',region:'indiana',f:.247,off:33,name:'Wrong Number Valet',crew:'Clint',ink:'#ff8b73',reply:'We brought a car. The rest is statistically promising.',sound:'bleep',
      caption:'Clint’s valet has misplaced the idea of parking.',unit:.151,lift:15.6,mount:'twins',support:39,edge:'red',lamp:'ivory',enamel:wine,
      panels:[frame(arrow,wine),frame(arrowPlate,cobalt)],rail:rails('M11 23 L76 19 Q99 17 105 37 L108 55 L113 52 L106 75 L88 60 L95 61 L90 40 L45 43','M14 56 L45 52'),bulbs:53,
      words:[['VALET',44,25,56,13,'ivory',1.8],['BAD AT IT',36,68,46,6.6,'ice',.5]],
      tubes:[stroke('M18 49 L38 46 M83 25 Q92 26 96 34','pink',1)],chime:'valet'},
    {id:'neon-fan-club',region:'indiana',f:.471,off:31,name:'Fan Club Fan Club',crew:'Mint',ink:'#ff8fba',reply:'The fans have requested more fans.',sound:'cheer',
      caption:'Mint’s fan club sells folding fans to clubs of folding-fan fans.',unit:.15,lift:3.4,mount:'tripod',support:60,edge:'pink',lamp:'ice',enamel:plum,
      panels:[frame(fan,plum),frame(fanPlaque,wine)],rail:rails('M11 50 L17 39 L13 33 L23 23 L28 24 L37 14 L44 17 L57 8 L65 14 L77 10 L85 20 L93 19 L103 34 L108 36 L111 46'),bulbs:32,
      words:[['FAN CLUB',60,63,65,11,'ivory',.6]],
      tubes:[stroke('M12 48 L25 58 M19 34 L40 58 M33 23 L50 58 M61 19 L61 58 M86 25 L73 58 M105 40 L87 58','lilac',.85),
        stroke('M56 80 Q60 77 65 81 Q66 86 61 86 Q56 86 56 80 Z','gold',1.15)],chime:'fan'},
    {id:'neon-split-city',region:'indiana',f:.841,off:-26,name:'Split City Lanes',crew:'Sophie & Eden',ink:'#99e5ff',reply:'Gutter verified. Your ball will be returned by freight.',sound:'bell',
      caption:'Sophie keeps score. Eden negotiates with the pins.',unit:.156,lift:3.1,mount:'angle',support:59,edge:'ice',lamp:'gold',enamel:cobalt,
      panels:[frame(pin,cobalt),frame(pinPlate,plum)],rail:rails('M55 10 Q66 5 71 12 Q75 18 69 29 Q65 38 70 48 Q80 62 81 74 Q82 85 73 88 L46 88 Q37 84 39 74'),bulbs:34,
      words:[['SPLIT',33,57,39,9,'ivory',1],['CITY',34,67,31,7,'pink',1]],
      tubes:[stroke('M48 29 Q59 32 71 28 M50 34 Q59 37 69 33','red',1.9),
        stroke('M55 14 Q58 11 63 11 M73 54 Q78 63 78 69','ice',1.15)],chime:'bowl'}
  ];
  // Sample a string of incandescent sockets by physical perimeter length, so
  // the electrical chase does not bunch up on the tight corners of the die.
  function lamps(rail,count){
    const edges=[];let length=0;
    for(const points of rail)for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],size=Math.hypot(b[0]-a[0],b[1]-a[1]);
      if(size>.01){edges.push({a,b,at:length,end:length+size});length+=size;}
    }
    const out=[];let n=0;
    for(let i=0;i<count;i++){
      const s=(i+.42)*length/count;
      while(n<edges.length-1&&s>edges[n].end)n++;
      const {a,b,at,end}=edges[n],k=(s-at)/(end-at);out.push([a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k]);
    }
    return out;
  }
  function states(d,index,react){
    const strokes=[],dots=[],t=index/8*tau,k=react?1:0;
    const line=(pts,tone,w=1.15)=>strokes.push(stroke([pts],tone,w));
    const ellipse=(x,y,rx,ry,tone,w=1)=>strokes.push(stroke(ring(x,y,rx,ry),tone,w));
    const star=(x,y,r,tone)=>{
      line([[x-r*.65,y],[x-r*.18,y-r*.15],[x,y-r],[x+r*.18,y-r*.15],[x+r*.65,y],[x+r*.18,y+r*.15],[x,y+r],[x-r*.18,y+r*.15],[x-r*.65,y]],tone,.83);
    };
    const point=(x,y,r,tone,power=1)=>dots.push({x,y,r,tone,power});
    // A second circuit answers the horn by changing the picture on the sign.
    // Both circuits use the supplied clock, so scrubbing a replay is exact.
    if(d.chime==='spur'){
      const sx=25,sy=66,r=6.25+1.4*k;
      line([[34,65],[26,65]],'ivory',1.65);ellipse(sx,sy,2.5,2.5,'pink',1.0);
      const pts=[];for(let j=0;j<=14;j++){
        const a=j*Math.PI/7+t/7+k*.17,rr=j%2?r*.47:r;pts.push([sx+Math.cos(a)*rr,sy+Math.sin(a)*rr]);
      }line(pts,'gold',1.15);
      if(react){star(18,57,3,'ice');star(24,52,2.1,'ivory');}
    }else if(d.chime==='stars'){
      for(const [i,x,y,r] of [[0,68,21,5.1],[1,83,32,3.4],[2,98,20,3.8],[3,57,36,2.2]]){
        const s=.45+.55*(.5+.5*Math.cos(t-i*.99));star(x+Math.sin(t+i)*1.2*k,y-i*.25*k,r*s*(1+.34*k),i%2?'gold':'ice');
      }
      if(react)line([[62,38],[73,36],[79,34]],'pink',1.15);
    }else if(d.chime==='howl'){
      for(let j=0;j<3;j++){
        const active=(index+j*3)%8;if(active<4&&!react)continue;
        const x=86+9*j,y=15-3*j-k*1.45;
        line([[x-3,y+2],[x+1,y-2.0-j*.2],[x+3,y+1.2],[x+5,y-2.4]],j===1?'ivory':'gold',1.05+.27*k);
      }
      point(63,27.8,1.03,'ice');if(react)star(113,6.4,3.0,'pink');
    }else if(d.chime==='beat'){
      const m=43+index*4.1;
      line([[30,59],[m-5,59],[m-3.5,57.1],[m-1.8,60],[m,54-3.1*k],[m+2.6,65+2*k],[m+5.2,56.5],[m+7,59],[92,59]],react?'gold':'aqua',1.5);
      point(m,54-3.1*k,1.2,'ivory');
    }else if(d.chime==='eyes'){
      const shift=Math.sin(t)*4.5,blink=index===5?.22:index===6?.69:1;
      for(const [x,y,sign] of [[33,42,1],[89,42,-1]]){
        const xx=x+(react?sign*7.0:shift);
        ellipse(xx,y,3.15,4.40*blink,react?'gold':'ice',1.3);point(xx+.8,y-1.5*blink,1.1,'ivory');
      }
    }else if(d.chime==='mushroom'){
      for(const [n,x,y,rx,ry] of [[0,39,30,6.5,3.7],[1,58,21,6.3,4.4],[2,79,31,7.3,4],[3,94,39,3.2,2.25],[4,23,41,3.1,2]]){
        const a=(n*2+index)%8,v=.65+(a<3?.33:0)+k*.18;
        ellipse(x,y,rx*v,ry*v,a<3?'ivory':k?'gold':'pink',a<3?1.5:1.0);
      }
      if(react){star(31,12,3.3,'gold');star(80,7,2.6,'ice');}
    }else if(d.chime==='valet'){
      const arrowheads=[[[73,31],[78,28],[74,25]],[[82,32],[88,31],[84,26]],[[91,39],[97,39],[96,34]],[[96,47],[101,49],[102,43]],[[99,56],[103,59],[106,53]],[[101,65],[105,69],[107,62]]];
      for(let j=0;j<arrowheads.length;j++){
        const n=((react?-index:index)-j+16)%8;
        if(n<3||react&&n===5)line(arrowheads[j],n===0?'ivory':n===1?'gold':'pink',1.15+.36*(n===0));
      }
    }else if(d.chime==='fan'){
      const rays=[[14,45],[21,34],[33,23],[45,18],[58,12],[72,15],[84,22],[97,31],[106,43]];
      for(let j=0;j<rays.length;j++){
        const n=(index+j)%8;if(n>3&&!react)continue;
        const [x,y]=rays[j],end=[60+(x-60)*.26,57.2];
        line([[x,y],end],n<2?'gold':react?'aqua':'pink',n<2?1.52:1.0);
      }
    }else{
      // The rotating finger holes give the ball a readable rolling direction.
      const u=index/7,x=55+17*u,y=82-Math.sin(u*Math.PI)*2.4-k*.75;
      ellipse(x,y,3.45,3.45,react?'pink':'gold',1.45);
      for(let i=0;i<3;i++){const a=t+i*1.1;point(x+.98*Math.cos(a),y+.98*Math.sin(a),.35,'ivory');}
      if(react||index>5){star(80,72,react?5.9:3,'gold');star(87,67,react?3.5:2,'ice');}
    }
    for(let i=0;i<d.sockets.length;i++){
      const position=((react?-index:index)-i+8*(d.sockets.length+1))%8;
      const power=position===0?1:position===1?.80:position===2?.35:0;
      if(power){const [x,y]=d.sockets[i];point(x,y,react?1.33:1.19,position===0&&react?'ice':d.lamp,power);}
    }
    return {strokes,dots};
  }
  // The fixed texture holds only the reflected light, porcelain and sockets.
  // The coloured tubes are raised independently, so they also read edge-on.
  function plate(d){
    if(d.card)return d.card;
    const c=document.createElement('canvas'),scale=5;c.width=W*scale;c.height=H*scale;
    const ctx=c.getContext('2d');ctx.scale(scale,scale);ctx.lineCap='round';ctx.lineJoin='round';
    for(const panel of d.panels){
      const points=railOf(panel.outer);polygon(ctx,points);
      const enamel=ctx.createLinearGradient(2,2,99,98);enamel.addColorStop(0,'#755969');enamel.addColorStop(.17,panel.paint);enamel.addColorStop(.70,panel.paint);enamel.addColorStop(1,'#15293d');
      ctx.fillStyle=enamel;ctx.fill();
      ctx.save();ctx.clip();
      ctx.strokeStyle='#9c8892';ctx.lineWidth=2.8;ctx.stroke();ctx.lineWidth=1.15;ctx.strokeStyle='#332a3b';ctx.stroke();
      // Thin embossed rules and a fine stipple catch light at close quarters.
      for(let row=0;row<6;row++){
        ctx.strokeStyle='rgba(241,203,180,.035)';ctx.lineWidth=.41;
        ctx.beginPath();ctx.moveTo(0,row*21+6);ctx.lineTo(120,row*21-9);ctx.stroke();
      }
      ctx.restore();
      trace(ctx,[points]);ctx.lineWidth=.68;ctx.strokeStyle=palette[d.edge][0];ctx.stroke();
    }
    for(const line of d.art){
      trace(ctx,line.lines);ctx.strokeStyle='#101c2c';ctx.lineWidth=line.w*2.4;ctx.stroke();
      for(const [size,opacity] of [[7,.10],[4.4,.18],[2.7,.24]]){
        ctx.lineWidth=line.w*size;ctx.globalAlpha=opacity;ctx.strokeStyle=palette[line.tone][0];ctx.stroke();
      }ctx.globalAlpha=1;
    }
    for(const r of d.rail){trace(ctx,[r]);ctx.lineWidth=2.7;ctx.strokeStyle='#313145';ctx.stroke();ctx.lineWidth=.62;ctx.strokeStyle='#98797e';ctx.stroke();}
    for(const [x,y] of d.sockets){
      circle(ctx,x+.12,y+.23,1.57,'#352a3e');circle(ctx,x,y,1.48,'#a17c76');
      circle(ctx,x,y,1.15,'#6c4c4f');circle(ctx,x-.16,y-.20,.82,'#ad7b64');
      circle(ctx,x-.39,y-.46,.24,'#edbb83');
    }
    d.card=c;return c;
  }
  // Rounded banked strips place the colored gas below a fine white-hot core.
  // Colour and alpha vary across a mesh rather than requiring postprocessing.
  const glassMaterial=new T.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,toneMapped:false,side:T.DoubleSide});
  function color(ink){if(!colorCache.has(ink))colorCache.set(ink,new T.Color(ink));return colorCache.get(ink);}
  function glowGeometry(strokes,dots){
    const positions=[],colors=[],indices=[];
    function vertex(x,y,z,ink,a){
      const c=color(ink),i=positions.length/3;
      positions.push(x-W/2,H-y,z);colors.push(c.r,c.g,c.b,a);return i;
    }
    const z=3.5;
    for(const s of strokes){
      const [gas,core]=palette[s.tone];
      for(const pts of s.lines){
        if(pts.length<2)continue;
        let old=-1;
        for(let j=0;j<pts.length;j++){
          const at=pts[j],a=pts[Math.max(0,j-1)],b=pts[Math.min(pts.length-1,j+1)];
          const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
          const next=positions.length/3;
          for(const [size,depth,alpha,ink] of [[-2.25,0,0,gas],[-.85,.10,.35,gas],[-.47,.22,.99,gas],[-.16,.37,1,core],[.16,.37,1,core],[.47,.22,.99,gas],[.85,.10,.35,gas],[2.25,0,0,gas]]){
            vertex(at[0]+nx*size*s.w,at[1]+ny*size*s.w,z+depth*s.w,ink,alpha);
          }
          if(old>=0)for(let c=0;c<7;c++)indices.push(old+c,next+c,old+c+1,old+c+1,next+c,next+c+1);
          old=next;
        }
      }
    }
    for(const d of dots){
      const [gas,core]=palette[d.tone],steps=8;let prev=-1;
      const cap=vertex(d.x,d.y,z+.56,core,d.power);
      for(const [r,depth,alpha,ink] of [[.44,.46,1,core],[.85,.32,.99,gas],[1.18,.14,.54,gas],[2.45,0,0,gas]]){
        const start=positions.length/3;
        for(let i=0;i<steps;i++){const a=tau*i/steps;vertex(d.x+Math.cos(a)*d.r*r,d.y+Math.sin(a)*d.r*r,z+depth,ink,alpha*d.power);}
        for(let i=0;i<steps;i++){
          const j=(i+1)%steps;
          if(prev<0)indices.push(cap,start+i,start+j);else indices.push(prev+i,start+i,prev+j,prev+j,start+i,start+j);
        }prev=start;
      }
    }
    const g=new T.BufferGeometry();
    g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,4));g.setIndex(indices);g.computeBoundingSphere();return g;
  }
  function paintGlass(ctx,strokes,dots){
    ctx.lineCap='round';ctx.lineJoin='round';
    for(const s of strokes){
      const [gas,core]=palette[s.tone];trace(ctx,s.lines);
      for(const [width,alpha,ink] of [[4.2,.09,gas],[2.18,.24,gas],[1.04,1,gas],[.32,1,core]]){
        ctx.lineWidth=s.w*width;ctx.globalAlpha=alpha;ctx.strokeStyle=ink;ctx.stroke();
      }
    }
    for(const d of dots){
      const [gas,core]=palette[d.tone];
      for(const [r,alpha,ink] of [[2.32,.11,gas],[1.43,.28,gas],[.90,.99,gas],[.46,1,core]]){
        ctx.globalAlpha=alpha*d.power;circle(ctx,d.x,d.y,d.r*r,ink);
      }
    }ctx.globalAlpha=1;
  }
  function numberPlate(ctx,x,y,w,h){
    ctx.fillStyle='#243545';ctx.fillRect(x-w/2,y-h/2,w,h);ctx.strokeStyle='#9a8f89';ctx.lineWidth=.48;ctx.strokeRect(x-w/2,y-h/2,w,h);
    ctx.textBaseline='middle';ctx.textAlign='center';ctx.fillStyle='#daceb7';ctx.font='bold 3.2px monospace';ctx.fillText('2389',x,y+.1,w-1.3);
  }
  function geometryForPanel(panel){
    if(panel.geometry)return panel.geometry;
    const shape=new T.Shape();for(const [i,[x,y]] of railOf(panel.outer).entries())i?shape.lineTo(x-60,100-y):shape.moveTo(x-60,100-y);
    shape.closePath();panel.geometry=new T.ExtrudeGeometry(shape,{depth:3.5,bevelEnabled:false,curveSegments:1});panel.geometry.translate(0,0,-2.1);return panel.geometry;
  }
  function mountLayout(d){
    const front=(d.support-60)*d.unit;
    if(d.mount==='twins')return [[front-3.0,front-2.55,4.95],[front+2.9,front+2.55,5.7]];
    if(d.mount==='angle')return [[front-1.75,front+.80,7.4],[front+.25,front-1.05,4.1]];
    if(d.mount==='tripod')return [[front-2.06,front,6.6],[front+2.06,front,6.6]];
    return [[front,front,6.9],[front-1.17,front-1.17,4.4]];
  }
  // The elevated valet arrow clears the grandstand on a three-bay steel tower.
  // Sample both leaning columns at the joint heights so the crosspieces meet.
  function towerBracing(d){
    if(d.lift<10)return [];
    const levels=[.9,5.75,10.65,d.lift];
    const joint=([bottom,top,rise],y)=>[bottom+(top-bottom)*(y-.34)/(d.lift+rise-.34),y];
    const bays=[];
    for(let i=1;i<levels.length;i++){
      const a=joint(d.columns[0],levels[i-1]),b=joint(d.columns[1],levels[i-1]);
      const c=joint(d.columns[0],levels[i]),e=joint(d.columns[1],levels[i]);bays.push([a,e],[b,c],[c,e]);
    }
    return bays;
  }
  function build(d,root,art){
    const chassis=art.builder(root);
    for(const [bottom,top,rise] of d.columns){
      chassis.box([bottom,.20,-.33],[.91,.40,1.25],'#7e8594');
      chassis.rod([bottom,.34,-.34],[top,d.lift+rise,-.34],.18,.14,'#66778a',false,7);
      chassis.rod([bottom,.35,-.38],[top,d.lift+rise,-.38],.074,.055,'#a9abaf',false,5);
      chassis.rod([bottom+Math.sign(bottom||1)*.47,.35,-.98],[bottom,1.7,-.37],.08,.07,'#5c6074',false,5);
    }
    for(const [from,to] of d.braces)chassis.rod([...from,-.42],[...to,-.42],.095,.095,'#8c94a8',false,5);
    const [lo,hi]=d.columns,x=(d.support-60)*d.unit;
    chassis.box([x,d.lift+4.28,-.36],[5.34,.20,.40],'#46566d');
    const serial=(lo[0]+hi[0])/2;
    chassis.box([serial,1.40,-.33],[Math.abs(hi[0]-lo[0])+.19,.11,.18],'#6c7585');
    chassis.box([serial,1.40,-.19],[1.30,.51,.14],'#908c82');
    chassis.box([serial,1.40,-.108],[1.22,.415,.025],'#253647');
    const stencil=['111 111 111 111','001 001 101 101','111 011 111 111','100 001 101 001','111 111 111 111'];
    for(let iy=0;iy<5;iy++)for(let ix=0;ix<stencil[iy].length;ix++){
      if(stencil[iy][ix]==='1')chassis.add(serialPixel,[serial+(ix-7)*.059,1.40+(2-iy)*.051,-.091],[.054,.046,1],null,'#ddd5bc');
    }
    chassis.finish();
    const cabinet=art.node(root,0,d.lift,0);cabinet.name=d.name+' cabinet';cabinet.scale.setScalar(d.unit);
    const wall=art.builder(cabinet);d.panels.forEach((p,i)=>wall.add(geometryForPanel(p),[0,0,i*.62],[1,1,1],null,p.paint));wall.finish();
    if(!d.faceMaterial){
      const map=new T.CanvasTexture(plate(d));map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
      d.faceMaterial=new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,toneMapped:false,side:T.FrontSide});
    }
    const enamel=new T.Mesh(faceGeometry,d.faceMaterial);enamel.position.set(0,H/2,2.65);enamel.renderOrder=2;cabinet.add(enamel);
    if(!d.fixedGlass)d.fixedGlass=glowGeometry(d.art,[]);
    const glass=new T.Mesh(d.fixedGlass,glassMaterial);glass.renderOrder=3;cabinet.add(glass);
    // Keep all bulbs and all moving tubes in one draw and one shared immutable
    // geometry per electrical state. No per-frame texture uploads or allocations.
    const live=new T.Mesh(d.fixedGlass,glassMaterial);live.name='Sequenced neon';live.renderOrder=4;cabinet.add(live);
    let last=-1;
    function update(t,pulse){
      const k=stateKey(t,pulse,d);if(k===last)return;last=k;
      const s=state(d,k);if(!s.ge)s.ge=glowGeometry(s.strokes,s.dots);live.geometry=s.ge;
    }
    update(0,0);return update;
  }
  const faceGeometry=new T.PlaneGeometry(W,H),serialPixel=new T.PlaneGeometry(1,1);
  function stateKey(t,p,d){return ((Math.floor(Math.max(0,t||0)*d.rate)+d.phase)%8)+(p>.055?8:0);}
  function state(d,k){return d.frames[k]||(d.frames[k]=states(d,k%8,k>=8));}
  function flat(d,ctx,t,p){
    ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
    if(d.braces.length){ctx.strokeStyle='#858da0';ctx.lineWidth=.18;trace(ctx,d.braces);ctx.stroke();}
    for(const [bottom,top,rise] of d.columns){
      ctx.fillStyle='#7e8594';ctx.fillRect(bottom-.45,.01,.90,.38);
      ctx.strokeStyle='#66778a';ctx.lineWidth=.33;trace(ctx,[[[bottom,.32],[top,d.lift+rise]]]);ctx.stroke();
      ctx.strokeStyle='#9ea6b5';ctx.lineWidth=.075;trace(ctx,[[[bottom-.065,.36],[top-.065,d.lift+rise]]]);ctx.stroke();
    }
    const x=(d.support-60)*d.unit,lo=d.columns[0][0],hi=d.columns[1][0];ctx.fillStyle='#46566d';ctx.fillRect(x-2.67,d.lift+4.18,5.34,.20);
    ctx.fillStyle='#6c7585';ctx.fillRect(Math.min(lo,hi)-.09,1.345,Math.abs(hi-lo)+.18,.11);
    ctx.translate(0,d.lift+H*d.unit);ctx.scale(d.unit,-d.unit);ctx.translate(-W/2,0);
    if(!d.flatFixed){
      const c=document.createElement('canvas');c.width=W*4;c.height=H*4;const g=c.getContext('2d');g.scale(4,4);
      // The folded steel cabinet has a visible lower and right return, with
      // the same irregular silhouette as the model's extruded edge.
      g.save();g.translate(1.25,1.35);for(const panel of d.panels){polygon(g,railOf(panel.outer));g.fillStyle='#34364c';g.fill();}g.restore();
      g.drawImage(plate(d),0,0,W,H);paintGlass(g,d.art,[]);d.flatFixed=c;
    }
    ctx.drawImage(d.flatFixed,0,0,W,H);
    const k=stateKey(t,p,d),s=state(d,k);
    if(!s.card){
      const c=document.createElement('canvas');c.width=W*2;c.height=H*2;const g=c.getContext('2d');g.scale(2,2);paintGlass(g,s.strokes,s.dots);s.card=c;
    }
    ctx.drawImage(s.card,0,0,W,H);
    const avg=(d.columns[0][0]+d.columns[1][0])/2;
    numberPlate(ctx,60+avg/d.unit,H+(d.lift-1.4)/d.unit,8.5,3.7);
    ctx.restore();
  }
  return where.map((d,i)=>{
    d.columns=mountLayout(d);d.braces=towerBracing(d);d.art=d.tubes.concat(d.words.map(args=>word(...args)));d.sockets=lamps(d.rail,d.bulbs);
    d.phase=(i*3)%8;d.rate=4.25+i%3*.52;d.frames=[];
    const feet=Math.max(...d.columns.map(([bottom])=>Math.hypot(Math.abs(bottom)+.62,1.12)));
    return {id:d.id,kind:'neon',region:d.region,f:d.f,off:d.off,name:d.name,crew:d.crew,ink:d.ink,reply:d.reply,sound:d.sound,caption:d.caption,
      width:W*d.unit+.03,height:d.lift+H*d.unit+.03,groundRadius:feet,footprintRadius:W*d.unit*.50+.04,radius:Math.hypot(d.lift+H*d.unit,W*d.unit*.5)+.04,
      build:(root,art)=>build(d,root,art),draw:(ctx,t,p)=>flat(d,ctx,t,p)};
  });
})();
