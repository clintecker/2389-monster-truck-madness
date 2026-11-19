/* Seven pirate-TV transmitters. Each installation has an authored, looping
   pixel film, a horn cut-in, and a physical cabinet. A single immutable reel
   per station supplies the WebGL, software 3D and projected Canvas screens. */
const MTMLcdArt=(()=>{
  'use strict';
  const T=THREE,W=144,H=80,pad=2,cellW=W+2*pad,cellH=H+2*pad,columns=6;
  const frames=32,interrupts=8,tau=Math.PI*2;
  const ink='#142036',deep='#24314a',iron='#56657e',metal='#9ca9ae',offWhite='#f5e8cb';
  const violet='#9a84ec',aqua='#65f2d2',red='#ff6f81',orange='#ffa24e',gold='#ffd46a';
  const imageCache=new Map(),fixtureCache=new Map();

  // A small block font stays legible across a spinning truck's windscreen.
  const glyphs={
    A:'010101111101101',B:'110101110101110',C:'011100100100011',D:'110101101101110',E:'111100110100111',
    F:'111100110100100',G:'011100101101011',H:'101101111101101',I:'111010010010111',J:'001001001101010',
    K:'101101110101101',L:'100100100100111',M:'101111111101101',N:'101111111111101',O:'010101101101010',
    P:'110101110100100',Q:'010101101111011',R:'110101110101101',S:'011100010001110',T:'111010010010010',
    U:'101101101101111',V:'101101101101010',W:'101101111111101',X:'101101010101101',Y:'101101010010010',
    Z:'111001010100111','0':'111101101101111','1':'010110010010111','2':'110001010100111',
    '3':'110001010001110','4':'101101111001001','5':'111100110001110','6':'011100111101111','7':'111001010010010',
    '8':'111101111101111','9':'111101111001110','/':'001001010100100','-':'000000111000000','+':'000010111010000',
    ':':'000010000010000','!':'010010010000010','.':'000000000000010','?':'110001010000010'
  };
  function block(g,x,y,w,h,col){g.fillStyle=col;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
  function letters(g,copy,x,y,size,col,align='left'){
    const width=(copy.length*4-1)*size;
    x=Math.round(x-(align==='center'?width*.5:align==='right'?width:0));y=Math.round(y);
    for(const ch of copy){
      const s=glyphs[ch];
      if(s)for(let j=0;j<5;j++)for(let i=0;i<3;i++)if(s[j*3+i]==='1')block(g,x+i*size,y+j*size,size,size,col);
      x+=4*size;
    }
  }
  function line(g,x,y,u,v,col,width=1){
    x=Math.round(x);y=Math.round(y);u=Math.round(u);v=Math.round(v);
    const dx=Math.abs(u-x),sx=x<u?1:-1,dy=-Math.abs(v-y),sy=y<v?1:-1;
    let d=dx+dy;
    for(;;){block(g,x,y,width,width,col);if(x===u&&y===v)break;const d2=2*d;if(d2>=dy){d+=dy;x+=sx;}if(d2<=dx){d+=dx;y+=sy;}}
  }
  function oval(g,x,y,rx,ry,col){
    rx=Math.max(.1,rx);ry=Math.max(.1,ry);
    for(let i=Math.ceil(y-ry);i<=y+ry;i++){
      const half=rx*Math.sqrt(Math.max(0,1-((i-y)/ry)**2)),x0=Math.ceil(x-half);
      block(g,x0,i,Math.floor(x+half)-x0+1,1,col);
    }
  }
  function poly(g,points,col){
    const ys=points.map(p=>p[1]);
    for(let y=Math.ceil(Math.min(...ys));y<Math.max(...ys);y++){
      const scan=y+.5,xs=[];
      for(let j=0;j<points.length;j++){
        const a=points[j],b=points[(j+1)%points.length];
        if((a[1]<=scan&&b[1]>scan)||(b[1]<=scan&&a[1]>scan))xs.push(a[0]+(b[0]-a[0])*(scan-a[1])/(b[1]-a[1]));
      }
      xs.sort((a,b)=>a-b);for(let j=0;j+1<xs.length;j+=2)block(g,Math.ceil(xs[j]),y,Math.ceil(xs[j+1])-Math.ceil(xs[j]),1,col);
    }
  }
  function sprite(g,picture,x,y,k,palette,flip=false){
    for(let j=0;j<picture.length;j++){
      const row=picture[j];
      for(let i=0;i<row.length;){
        const ch=row[i];let end=i+1;while(row[end]===ch)end++;
        if(palette[ch])block(g,x+(flip?row.length-end:i)*k,y+j*k,(end-i)*k,k,palette[ch]);
        i=end;
      }
    }
  }
  function ribbon(g,s,head,caption){
    // Moving sprocket marks stay outside the full-size action and subtitles.
    block(g,0,0,W,10,ink);block(g,0,9,W,1,s.ink);block(g,2,2,2,5,s.ink);
    letters(g,head,7,2,1,offWhite);letters(g,'CH '+s.channel,141,2,1,s.ink,'right');
    block(g,0,65,W,15,ink);block(g,0,65,W,1,s.ink);
    letters(g,caption,72,68,2,offWhite,'center');
  }
  function caption(g,patch,progress,text){
    block(g,4,13,text.length*4+5,9,patch);letters(g,text,7,15,1,offWhite);
    for(let i=0;i<4;i++)block(g,132+i*2,14+(4-i),1,i+1,i<=progress?offWhite:'#42616e');
  }
  function bursts(g,x,y,r,phase,col){
    for(let i=0;i<8;i++){
      const a=i*tau/8+phase,u=Math.cos(a),v=Math.sin(a);
      line(g,x+u*r*.62,y+v*r*.62,x+u*r,y+v*r,col,2);
    }
  }

  // Painted sprite sheets retain a consistent silhouette as the poses change.
  const bird=['........rr........','.......rrr........','......bbbb........','.....bbeebb.......','......bbbooo......',
    '......bb..........','t....bbb..........','.tttbbbb..........','..ttbbbbb.........','...bbbbwb.........',
    '....bbww..........','.....bbb..........'];
  const birdInk={r:red,b:'#355071',e:offWhite,o:orange,t:'#378c9a',w:'#99e9c9'};
  const hat=['....ggg......','...gwwgg.....','...gccgg.....','...rccrr.....','gggggggggggg.','.cccccccccc..'];
  const hatInk={g:'#eaa84c',w:'#ffe695',c:'#84543c',r:'#c34e50'};
  function desert(g){
    block(g,0,10,144,55,'#e99d89');
    oval(g,113,26,10,10,'#ffe6ad');
    poly(g,[[0,44],[19,39],[24,29],[40,29],[42,36],[51,39],[67,43],[75,35],[88,35],[90,42],[102,44],[113,38],[132,38],[144,42],[144,56],[0,56]],'#ba7181');
    poly(g,[[0,51],[14,47],[35,48],[50,45],[74,49],[97,46],[121,43],[144,47],[144,65],[0,65]],'#ce825d');
    block(g,0,56,144,9,'#ebb579');block(g,0,58,144,1,'#ac6b68');
    for(const [x,y] of [[14,61],[44,55],[63,60],[85,63],[128,55]])block(g,x,y,4,1,'#a96c67');
  }
  function cactus(g,x,y){
    const c='#34766d',hi='#79ad7f';
    block(g,x-3,y-24,7,24,c);block(g,x-2,y-26,5,5,c);block(g,x-2,y-23,1,21,hi);
    block(g,x-9,y-17,3,10,c);block(g,x-7,y-9,6,3,c);block(g,x+4,y-14,7,3,c);block(g,x+9,y-20,3,8,c);
    block(g,x+1,y-16,1,2,ink);block(g,x+3,y-16,1,2,ink);
  }
  function hatFilm(g,s,i,p){
    const z=i/32,honk=p>=0;desert(g);cactus(g,109,58);
    const x=Math.round(5+66*Math.min(1,z*2.0)-37*Math.max(0,(z-.78)/.22));
    const bounce=Math.round(Math.sin(i*Math.PI*.5)*1.5);
    sprite(g,bird,x,29+bounce,2,birdInk);
    line(g,x+12,52+bounce,x+9+(i%4)*2,56,ink,2);
    line(g,x+17,51+bounce,x+19-(i%4)*2,57,ink,2);
    if(honk){
      for(let n=0;n<4;n++)sprite(g,hat,8+n*30,13+(n+p)%3*5,1+(n%2),hatInk);
      bursts(g,113,42,10+p,0,'#fff099');caption(g,'#743d5a',3,'OVERTIME');
    }else{
      const travel=Math.max(0,Math.min(1,(z-.20)/.49)),tx=100*travel+2,ty=z<.2?29+bounce:Math.round(30-21*Math.sin(travel*Math.PI)-6*travel);
      sprite(g,hat,tx,ty,1.4,hatInk);
      if(z>.72){block(g,110,42,3,1,ink);if(i<27)bursts(g,109,30,14,0,'#ffea9a');}
      caption(g,'#75455a',Math.floor(z*4),'WIDE SHOT');
    }
    ribbon(g,s,'K-HT DRIVE IN',honk?'TRIPLE HAT!':z<.34?'LOOSE HAT':z<.70?'HEADS UP':'NICE HAT');
  }

  const sub=['...cccccccccccccc....','..cggggggggggggggcc..','.cggwggwggggwggwgggc.',
    'cgggggggggggggggggggc','ccccccccccccccccccccc','.lggllgggllglgglllgl.','..rrrrrrrrrrrrrrrrr..',
    '.ggggggggggggggggggg.','..ccccccccccccccccc..'];
  const subInk={c:'#95593e',g:'#efbc69',w:'#fff2ae',l:'#72bb6e',r:'#db6570'};
  function sandwichFilm(g,s,i,p){
    const z=i/32,honk=p>=0;block(g,0,10,144,55,'#1e6472');
    for(let x=8;x<144;x+=16)block(g,x,10,1,55,'#367887');
    for(let y=17;y<65;y+=13)block(g,0,y,144,1,'#367887');
    poly(g,[[0,55],[14,48],[22,50],[32,43],[45,47],[56,39],[69,42],[78,38],[84,47],[100,42],[112,45],[127,35],[144,37],[144,65],[0,65]],'#39958b');
    line(g,3,60,43,52,'#82b39a');line(g,43,52,69,58,'#82b39a');line(g,69,58,138,39,'#82b39a');
    for(const [x,y] of [[21,57],[74,54],[118,45],[131,58]]){block(g,x,y,2,3,offWhite);block(g,x-1,y+1,4,1,offWhite);}
    const x=honk?50:Math.round(4+73*z),y=honk?25:Math.round(22-4*Math.sin(z*Math.PI));
    sprite(g,sub,x,y,2,subInk);
    if(z>.33||honk)for(let n=0;n<(honk?13:6);n++){
      const px=Math.round(x+4+(n*11)%35),py=y+19+((i*4+n*5+(honk?p*5:0))%20);
      line(g,px,py,px-2,py+3,honk?'#ffe584':gold,2);
    }
    caption(g,'#18465b',Math.floor(z*4),'RADAR 07');
    ribbon(g,s,'FIELD FORECAST',honk?'SAUCE ALERT':z<.34?'SUB FRONT':z<.72?'LIGHT MUSTARD':'BREAD AHEAD');
  }

  const frog=['...ggg......ggg...','..gwwwg....gwwwg..','..gwkwg....gwkwg..','...gggggggggggg...',
    '..glllgggggglllg..','.glllllgggglllllg.','gllllllggggglllllg','ggllllggggggglllgg',
    '..gggkkkkkkkkggg..','..ggglllllllg.....','.gggggggggggggg...','gg...ggggggg...gg.','gggg.........ggggg'];
  const frogInk={g:'#458e69',w:'#e2ffc1',k:'#203c44',l:'#99df8a'};
  const cursor=['k......','kwk....','kwwk...','kwwwk..','kwwwwk.','kwwwwww','kwwkkkk','kkwk...','..kwk..','...kk..'];
  function frogFilm(g,s,i,p){
    const z=i/32,honk=p>=0;
    block(g,0,10,144,55,'#235561');
    for(let y=18;y<64;y+=8)for(let x=(y%16?5:9);x<144;x+=12)block(g,x,y,1,1,'#527a79');
    block(g,53,17,85,44,'#163e4a');block(g,51,15,85,43,'#9cd2ae');block(g,53,17,81,37,'#437f7c');block(g,53,17,81,6,'#1d4e5c');
    block(g,56,19,15,2,'#a6dfb1');block(g,126,19,5,2,offWhite);block(g,54,55,78,1,'#325b66');
    const fy=33-(i%16===3?2:0),fx=8;
    sprite(g,frog,fx,fy,2,frogInk);
    if(!honk){
      const x=z<.4?115-50*z/.4:Math.max(33,65-32*(z-.4)/.2);
      const y=Math.round(32+Math.sin(i*.5)*4);
      if(z<.6)sprite(g,cursor,Math.round(x),y,1,{k:ink,w:offWhite});
      if(z>=.35&&z<.63){line(g,38,fy+15,x+4,y+3,'#f879a0',2);}
      if(z>=.63){
        const drain=i-20,drop=drain%5;
        poly(g,[[68,27],[86,27],[82,31],[78,35],[86,44],[68,44],[75,36],[69,30]],'#e9f5c8');
        block(g,66,25,22,2,ink);block(g,66,44,22,2,ink);
        const shoulder=drain*.40;
        poly(g,[[70+shoulder,28+shoulder],[84-shoulder,28+shoulder],[77,35]],gold);
        poly(g,[[76-drain*.54,43],[77,43-drain*.40],[78+drain*.54,43]],gold);
        block(g,76,35+drop,2,1,'#a16a49');
        // The progress lights also make the OS look busy while the frog digests.
        for(let j=0;j<drain;j++)block(g,91+3*j,46,2,2,'#9fdaa8');
      }
    }else{
      const x=76+Math.round(Math.sin(p*.7)*10);
      sprite(g,cursor,x,25,2,{k:ink,w:'#ffda88'});bursts(g,x+5,36,17+p*.5,.18,'#ffb16f');
      line(g,37,fy+15,x+4,36,'#ff82ae',2);
    }
    caption(g,'#254558',Math.floor(z*4),'SYSTEM');
    ribbon(g,s,'POND OPERATING SYS',honk?'CTRL+RIBBIT':z<.34?'CLICK HERE':z<.64?'CURSOR CAUGHT':'PLEASE HOLD');
  }

  function pine(g,x,y,height,col){
    poly(g,[[x,y-height],[x+height*.37,y],[x-height*.37,y]],col);block(g,x-1,y-1,3,4,col);
  }
  function mushroom(g,x,y,k,c){
    block(g,x-2*k,y-3*k,4*k,4*k,'#f0dbb3');
    poly(g,[[x-6*k,y-3*k],[x-5*k,y-5*k],[x-2*k,y-7*k],[x+2*k,y-7*k],[x+5*k,y-5*k],[x+6*k,y-3*k]],c);
    block(g,x-2*k,y-6*k,2*k,k,offWhite);block(g,x+2*k,y-4*k,k,k,offWhite);
  }
  function capFilm(g,s,i,p){
    const z=i/32,honk=p>=0;
    block(g,0,10,144,55,'#8dcbbb');oval(g,111,21,7,7,'#f9dea6');
    poly(g,[[0,45],[17,33],[30,41],[48,25],[70,40],[86,31],[101,42],[120,29],[144,41],[144,65],[0,65]],'#589e9a');
    poly(g,[[0,53],[21,44],[44,54],[57,43],[94,55],[119,37],[144,52],[144,65],[0,65]],'#357b7c');
    for(const [x,y,k] of [[7,60,17],[23,60,15],[40,63,11],[106,60,12],[133,61,19]])pine(g,x,y,k,'#285c62');
    line(g,0,22,143,43,'#26394d',2);
    const cx=Math.round(-13+160*z),cy=Math.round(22+cx*21/143);
    block(g,cx+9,cy,3,9,ink);block(g,cx,cy+7,23,13,'#775a74');block(g,cx+2,cy+9,19,7,'#b7e4cf');block(g,cx+11,cy+8,2,10,'#7c647c');
    block(g,cx+2,cy+18,19,4,red);block(g,cx-1,cy+6,25,2,'#edd3a8');
    mushroom(g,cx+6,cy+17,1,red);
    if(honk){
      for(let n=0;n<5;n++){
        const mx=20+n*25,my=36+Math.round(9*Math.sin(n+p*.8));
        mushroom(g,mx,my,1,n%2?gold:red);line(g,mx-4,my-1,mx,my+5,offWhite);line(g,mx+4,my-1,mx,my+5,offWhite);
        block(g,mx-1,my+6,3,3,ink);
      }
    }else if(z>.48){
      const drop=(z-.48)/.52,mx=Math.round(78+24*drop),my=Math.round(30+22*drop);
      mushroom(g,mx,my,1.6,'#df7992');
      line(g,mx-5,my-3,mx,my+6,ink);line(g,mx+5,my-3,mx,my+6,ink);block(g,mx-1,my+6,3,4,'#775568');
    }
    caption(g,'#3b6864',Math.floor(z*4),'ALPINE CAM');
    ribbon(g,s,'CANOPY CABLE 8',honk?'CAP SHOWER':z<.37?'ALL ABOARD':z<.59?'NEXT STOP':'CAP DROP');
  }

  const corn=['.....ggg.....','....gyyyg....','...gywywyg...','...gyyyyyg...','...gkkykyg...',
    '...gyyyyyg...','..lgyyyyggl..','.llgyyyyglgl.','llglgyyglggl.','.lgglylgglg..','..llgggllg...','....lll......'];
  const cornInk={g:'#987040',y:'#ffc859',w:'#fff3a0',k:ink,l:'#56b37c'};
  function basketball(g,x,y,rad){
    oval(g,x,y,rad,rad,ink);oval(g,x,y,rad-1,rad-1,orange);line(g,x-rad+2,y,x+rad-1,y,'#ae5c47');
    line(g,x,y-rad+1,x+1,y+rad-1,'#ae5c47');
  }
  function popcorn(g,x,y,k){
    oval(g,x-2*k,y-1*k,3*k,3*k,'#f0b75a');oval(g,x+1*k,y-3*k,3*k,3*k,'#ffe6a0');
    oval(g,x+3*k,y,3*k,3*k,'#fff0bb');oval(g,x,y+2*k,3*k,2*k,'#e6ae56');
  }
  function cornFilm(g,s,i,p){
    const z=i/32,honk=p>=0;
    block(g,0,10,144,55,'#595674');
    for(let row=0;row<3;row++)for(let j=0;j<22;j++){
      const x=j*7+(row%2)*3,y=23+row*7;
      block(g,x,y,3,2,(row+j)%3===0?'#e6b58a':'#bc8c99');
      block(g,x-1,y+2,5,3,(row+j)%2===0?'#75938a':'#ab7783');
    }
    block(g,0,44,144,21,'#b77d63');block(g,0,45,144,2,'#fac483');block(g,0,60,144,1,'#f3c290');
    line(g,111,59,122,47,'#e7b18a',2);block(g,119,18,3,20,offWhite);block(g,121,16,10,2,ink);
    block(g,106,37,15,2,orange);line(g,107,39,110,46,offWhite);line(g,119,39,115,46,offWhite);block(g,111,45,4,1,offWhite);
    const x=Math.round(8+28*Math.min(1,z/.46)),rise=Math.round(Math.max(0,1-Math.abs((z-.46)/.15))*10);
    sprite(g,corn,x,32-rise,2,cornInk);line(g,x+9,55-rise,x+8,60-rise,ink,2);line(g,x+17,55-rise,x+20,59-rise,ink,2);
    if(honk||z>.72){
      const n=honk?9:5,a=honk?p:i-23;
      for(let j=0;j<n;j++){
        const dx=(j%3-1)*(3+a*1.2)+(j%2)*4,dy=-a*(1.8-j%3)+.19*a*a+(j-3)*1.8;
        popcorn(g,112+dx,37+dy,honk?1.12:.86);
      }
      if(!honk)bursts(g,112,34,8+2*(i%3),.17,gold);
    }else if(z<.36){basketball(g,x+28,49+Math.cos(i*1.12)*6,5);}
    else{const q=(z-.36)/.36;basketball(g,64+49*q,41-19*Math.sin(Math.PI*q)-4*q,5);}
    caption(g,'#543851',Math.floor(z*4),'REPLAY');
    ribbon(g,s,'KERNEL SPORTS',honk?'AND ONE!':z<.35?'CORN BALL':z<.71?'AT THE RIM':'POP SHOT!');
  }

  const car=['..oooooo..','.oaaaaaao.','ookbbbbkoo','okbwwwwbko','oabbbbbbao',
    'oaabbbbaao','oaaaaaaaao','oaabbbbaao','okbwwwwbko','ookbbbbkoo','.oaaaaaao.','..oooooo..'];
  const carPalette=paint=>({o:ink,a:paint,b:'#527285',k:'#243448',w:'#bfe6df'});
  function parkingFilm(g,s,i,p){
    const z=i/32,honk=p>=0;
    block(g,0,10,144,55,'#38495e');block(g,101,10,43,55,'#697786');
    block(g,99,10,2,55,'#f5d297');for(let n=0;n<8;n++)block(g,100,10+8*n,2,3,'#d37c64');
    for(let y=13;y<62;y+=13)block(g,29,y,2,7,'#b2bcbf');
    block(g,76,29,22,1,'#ffe6a6');block(g,76,49,22,1,'#ffe6a6');
    sprite(g,car,80,12,1.30,carPalette('#b98fc5'));sprite(g,car,80,50,1.2,carPalette('#dfab71'));
    const travel=Math.min(1,Math.max(0,(z-.18)/.40)),x=40+40*travel;
    const y=Math.round(27+8*Math.min(1,z/.21)-3*travel);
    sprite(g,car,x,y,1.35,carPalette('#7df0ce'));
    if(z<.58)for(let k=0;k<3;k++){const xx=Math.round(x-7-k*7);line(g,xx,y+4,xx+2,y+6,offWhite);line(g,xx+2,y+6,xx,y+8,offWhite);}
    block(g,110,31,3,15,ink);block(g,106,27,11,8,'#17293e');block(g,108,29,7,3,honk?gold:'#ee7f8b');
    if(honk||z>.60){
      const tall=honk?17+Math.floor(4*Math.sin(p)):Math.min(19,Math.floor((z-.59)*90));
      const top=27-tall;
      block(g,108,top,12,tall,'#fff2cf');block(g,110,top+2,8,1,'#bb6871');
      for(let j=4;j<tall-1;j+=3)block(g,110,top+j,6+(j%2),1,'#7d7880');
      // A coin escapes in bouncing arcs while the receipt printer runs.
      if(!honk){
        const change=i-19,coinX=113+2.1*change,coinY=52-10*Math.abs(Math.sin(change*.4));
        oval(g,coinX,coinY,1+change%3,3,gold);block(g,coinX,coinY-1,1,2,'#ac794f');
      }
      if(honk){bursts(g,114,24,10+p*.7,.3,gold);block(g,105,47,15,7,ink);letters(g,'0',112,48,1,gold,'center');}
    }
    caption(g,'#634e63',Math.floor(z*4),'LOT CAM');
    ribbon(g,s,'PARKING LEAGUE',honk?'FINE PRINT':z<.28?'OPEN SPACE':z<.6?'CRAB WALK':'NICE TICKET');
  }

  function tumble(g,x,y,r,angle){
    const main='#e9b177',hi='#f6d79c';
    for(let j=0;j<9;j++){
      const a=j*tau/9+angle,dx=Math.cos(a),dy=Math.sin(a),cx=Math.round(x+dx*r),cy=Math.round(y+dy*r);
      line(g,x,y,cx,cy,main,2);line(g,x+dx*r*.42,y+dy*r*.42,cx-dy*3,cy+dx*3,hi);
      if(j%2===0)line(g,x+dx*r*.7,y+dy*r*.7,cx+dy*4,cy-dx*4,'#ba7b5b');
    }
  }
  function vacuumFilm(g,s,i,p){
    const z=i/32,honk=p>=0;block(g,0,10,144,55,'#6e668d');
    oval(g,112,24,6,6,'#e2c6b5');
    poly(g,[[0,42],[13,38],[30,42],[54,29],[65,38],[87,33],[107,41],[124,32],[144,39],[144,63],[0,63]],'#595a7d');
    poly(g,[[0,54],[29,46],[65,51],[83,45],[97,50],[116,46],[144,51],[144,65],[0,65]],'#ac846f');
    block(g,0,59,144,2,'#e5b681');
    const x=honk?83+Math.round(Math.sin(p)*3):83+(z>.65?(z-.65)*29:0);
    block(g,x+4,34,13,19,ink);block(g,x+6,34,12,16,'#e59386');block(g,x+7,35,9,2,'#f4c2aa');
    line(g,x+12,34,x+18,20,offWhite,2);block(g,x+16,18,10,3,red);block(g,x,54,22,4,ink);
    block(g,x+3,52,17,4,'#d77b76');oval(g,x+16,57,4,4,ink);oval(g,x+16,57,2,2,metal);
    line(g,x+3,40,x-2,49,'#3e4a61',3);line(g,x-2,49,x-12,54,'#44526a',3);block(g,x-19,54,11,3,aqua);
    if(honk||z>.65){
      const k=honk?p:i-21;for(let j=0;j<3;j++)tumble(g,Math.round(71-(k*2+j*15)%60),46+(j%2)*5,4+j,k*.42);
      for(let j=0;j<3;j++)block(g,63-j*5,53+j,4,1,offWhite);
    }else{
      const bx=13+57*Math.min(1,z/.62),r=z>.46?Math.max(2,9*(1-(z-.46)/.21)):9;
      tumble(g,bx,53-r*.4,r,i*.25);
    }
    caption(g,'#4f445e',Math.floor(z*4),'DUST CAM');
    ribbon(g,s,'WESTERN CLEANUP',honk?'BLOWBACK!':z<.33?'OPEN RANGE':z<.65?'SUCTION ON':'HERD ESCAPES');
  }

  // Each compact film sheet fits the software renderer's 1,024-pixel texture
  // limit. Two pixels of extrusion around each cel keep adjacent cuts separate.
  function createCanvas(w,h){
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;return canvas;
  }
  function cell(n){return {x:(n%columns)*cellW+pad,y:Math.floor(n/columns)*cellH+pad};}
  function imageFor(s){
    if(imageCache.has(s.id))return imageCache.get(s.id);
    const atlas=createCanvas(columns*cellW,7*cellH),g=atlas.getContext('2d');
    const card=createCanvas(W,H),c=card.getContext('2d');
    g.imageSmoothingEnabled=false;
    for(let n=0;n<frames+interrupts;n++){
      const horn=n<frames?-1:n-frames,index=horn<0?n:14+horn;
      c.save();c.fillStyle=ink;c.fillRect(0,0,W,H);s.film(c,s,index,horn);c.restore();
      const {x,y}=cell(n);
      g.drawImage(card,x,y);
      g.drawImage(card,0,0,1,H,x-pad,y,pad,H);g.drawImage(card,W-1,0,1,H,x+W,y,pad,H);
      g.drawImage(card,0,0,W,1,x,y-pad,W,pad);g.drawImage(card,0,H-1,W,1,x,y+H,W,pad);
    }
    const slug=cell(40);
    block(g,slug.x,slug.y,W,18,ink);block(g,slug.x,slug.y,W,1,s.ink);
    const size=s.ident.length>16?1:2;letters(g,s.ident,slug.x+W/2,slug.y+(size===1?7:4),size,offWhite,'center');
    block(g,slug.x+1,slug.y+3,2,12,s.ink);block(g,slug.x+W-3,slug.y+3,2,12,s.ink);
    const tex=new T.CanvasTexture(atlas);tex.colorSpace=T.SRGBColorSpace;
    tex.magFilter=T.NearestFilter;tex.minFilter=T.LinearMipmapLinearFilter;tex.generateMipmaps=true;
    const mat=new T.MeshBasicMaterial({map:tex,toneMapped:false});
    const image={atlas,mat,panels:[],nameplate:null};
    imageCache.set(s.id,image);return image;
  }
  function frameAt(s,time,pulse){
    if(pulse>.00001)return frames+Math.min(interrupts-1,Math.floor((1-Math.sqrt(Math.min(1,pulse)))*interrupts));
    // The first still already establishes the gag in reduced-motion mode.
    const t=Math.floor((Number.isFinite(time)?time:0)*4+s.offset);
    return ((t%frames)+frames)%frames;
  }
  function panel(s,n,name=false){
    const image=imageFor(s);
    if(name&&image.nameplate)return image.nameplate;
    if(!name&&image.panels[n])return image.panels[n];
    const {x,y}=cell(name?40:n),w=W,h=name?18:H,a=image.atlas;
    const geometry=new T.PlaneGeometry(name?s.label.w:s.panel.w,name?s.label.h:s.panel.h);
    const uv=geometry.attributes.uv;
    for(let j=0;j<uv.count;j++)uv.setXY(j,(x+.5+uv.getX(j)*(w-1))/a.width,1-(y+.5+(1-uv.getY(j))*(h-1))/a.height);
    if(name)image.nameplate=geometry;else image.panels[n]=geometry;
    return geometry;
  }

  // Cabinet parts are described in metres. The same data paints their front
  // silhouettes on Canvas and builds the braced, vented steelwork in 3D.
  function cabinet(s){
    if(fixtureCache.has(s.id))return fixtureCache.get(s.id);
    const v=[];
    const box=(x,y,z,w,h,d,color,lit=false)=>v.push({type:'box',x,y,z,w,h,d,color,lit});
    const rod=(a,b,r,color,lit=false,rEnd=r)=>v.push({type:'rod',a,b,r,rEnd,color,lit,z:(a[2]+b[2])/2});
    const disk=(x,y,z,r,d,color,lit=false,n=14)=>v.push({type:'disk',x,y,z,r,d,color,lit,n});
    const plate=(pts,z,d,color,lit=false)=>v.push({type:'plate',pts,z,d,color,lit});
    const blade=(x,y,z,ang,r,col)=>{
      const a=ang,dx=Math.cos(a),dy=Math.sin(a);
      plate([[x+.16*dx,y+.16*dy],[x+dx*r-dy*.14,y+dy*r+dx*.14],[x+dx*r*.86-dy*.33,y+dy*r*.86+dx*.33],[x-dy*.21,y+dx*.21]],z,.08,col);
    };
    const foot=(x,z,h=.30)=>{box(x,h*.5,z,1.3,h,1.35,'#8d91a1');box(x,h+.10,z,.80,.20,.84,deep);};
    const beam=(x,y,u,w,z,rr,shade)=>rod([x,y,z],[u,w,z],rr,shade);
    const tripod=(x,height)=>{
      foot(x,-.3);rod([x,.24,-.30],[x,height,-.30],.22,iron,false,.15);
      rod([x,.32,-1.66],[x,height*.76,-.31],.13,metal);
    };
    const p=s.panel,l=s.label,a=s.ink;
    // Each display has an enclosed service side. Sunshades, latches and a
    // thin bezel stand clear of the active pixels on the front glass.
    box(p.x,p.y,-.12,p.w+.85,p.h+.78,1.25,s.case);
    box(p.x,p.y,.51,p.w+.31,p.h+.30,.19,deep);
    box(p.x,p.y+p.h/2+.32,.12,p.w+.96,.14,1.44,metal);
    box(p.x,p.y-p.h/2-.31,.18,p.w+.88,.12,1.38,s.trim);
    for(const sign of [-1,1]){
      const x=p.x+sign*(p.w*.5+.28);
      box(x,p.y+.84,.53,.095,p.h*.52,.18,a,true);
      for(let k=0;k<3;k++)box(x,p.y-p.h*.25-k*.29,.54,.13,.10,.18,metal);
    }
    for(let side=-1;side<=1;side+=2)for(let i=0;i<5;i++){
      box(p.x+side*p.w*.30,p.y+i*.37-.76,-.795,p.w*.21,.10,.16,'#344554');
    }
    box(l.x,l.y,l.z-.18,l.w+.22,l.h+.22,.30,deep);
    if(s.housing==='drive'){
      for(const side of [-1,1]){
        tripod(4.58*side,8.5);
        beam(side*4.58,.5,side*2.10,4.6,-.5,.10,metal);
        const pts=[[6.99,5.10],[7.70,4.40],[8.09,4.45],[8.82,13.60],[8.36,13.40],[7.12,11.79]];
        plate(pts.map(([x,y])=>[x*side,y]),.11,.74,'#398981');
        beam(7.75*side,5.17,8.55*side,13.18,.54,.080,'#9ffff0');
        for(let i=0;i<3;i++)box(side*(7.66+i*.10),10.48+i*.39,.59,.85,.14,.09,offWhite,true);
      }
      beam(-5.4,3.78,5.4,3.78,.1,.12,metal);
    }else if(s.housing==='weather'){
      const cx=-5.13,cy=11.63;
      box(0,1.07,-.09,12.6,.76,2.48,'#b06060');box(0,1.47,-.10,12.8,.21,2.60,metal);
      for(const x of [-4.35,4.10]){
        disk(x,.64,.98,.64,.64,deep);disk(x,.64,1.33,.32,.10,metal);
        tripod(x,5.2);
      }
      rod([6.0,.8,-.12],[8.1,.55,-.12],.12,iron);disk(8.1,.54,.00,.19,.32,deep);
      for(const y of [1.9,2.85,3.75])beam(-4.2,y,4.2,y+.72,-.31,.07,metal);
      rod([cx,10.56,-.16],[cx,13.78,-.16],.20,iron);
      // A faceted dish with a diagonal feed arm reads in silhouette at speed.
      plate([[cx-2.1,cy+.70],[cx-1.34,cy+.04],[cx+.12,cy+.26],[cx+1.86,cy+1.62],
        [cx+2.05,cy+2.20],[cx+1.42,cy+2.02],[cx-.35,cy+1.24]],-.04,.46,'#c9c9ba');
      beam(cx-1.95,cy+.67,cx+1.98,cy+2.14,.24,.09,a);beam(cx+.11,cy+.50,cx-.62,cy+2.53,.24,.090,iron);
      disk(cx-.65,cy+2.58,.26,.19,.3,orange,true);
    }else if(s.housing==='terminal'){
      plate([[-7.05,2.52],[-7.92,3.20],[-7.92,9.83],[-6.98,10.88],[6.90,10.88],[7.61,10.20],[7.61,3.02],[6.97,2.52]],-.69,1.28,'#c9c3a2');
      box(-7.25,6.76,.05,.51,6.40,.55,'#9b9b87');
      for(let i=0;i<7;i++)box(6.83,4.70+i*.36,.16,.70,.12,.38,'#627267');
      disk(6.83,8.42,.29,.37,.4,deep);disk(6.83,8.42,.53,.19,.12,'#95d3a2');
      box(0,1.13,-.22,13.75,1.70,2.66,'#a5aa96');box(0,.17,-.22,14.08,.34,2.78,'#596a6d');
      plate([[-7.62,1.40],[7.53,1.40],[6.78,2.48],[-6.96,2.48]],1.05,.98,'#ded9ba');
      for(let row=0;row<2;row++)for(let col=0;col<10;col++){
        box(-5.73+col*.8+row*.22,1.79+row*.32,1.60,.62,.19,.10,'#88958a');
      }
      box(4.68,2.16,1.60,2.34,.24,.10,'#608f84');box(5.09,1.75,1.60,1.76,.22,.10,deep);
      for(const x of [-5.4,5.4])box(x,.17,.79,.72,.32,.55,deep);
    }else if(s.housing==='lift'){
      for(const side of [-1,1]){
        const x=side*7.65;foot(x,-.12);
        beam(x,.28,x+side*.32,14.47,-.15,.22,'#4c7978');
        beam(x-side*.60,.40,x+side*.17,10.58,-.15,.14,metal);
        const h=side<0?14.55:13.71;
        disk(x+.20*side,h,-.1,.66,.76,iron);disk(x+.20*side,h,.34,.47,.12,s.trim);
        disk(x+.20*side,h,.43,.13,.13,deep);
      }
      beam(-7.82,15.03,7.85,14.16,.00,.10,deep);beam(-7.82,14.57,7.85,13.75,.00,.055,metal);
      for(const x of [-4.83,4.83]){
        const top=14.57-(x+7.82)*.05;
        beam(x,p.y+p.h*.47,x,top,.04,.13,metal);disk(x,top,.10,.23,.25,orange,true);
      }
      for(const x of [-5.88,5.88])beam(x,l.y,x,p.y-p.h/2,.05,.10,iron);
    }else if(s.housing==='arena'){
      for(const x of [-5.0,5.0]){tripod(x,6.1);disk(x,4.06,.24,.34,.28,red,true);}
      for(const side of [-1,1]){
        const x=side*8.45;
        plate([[7.06,5.23],[9.71,5.9],[9.71,10.53],[7.06,11.14]].map(([a,b])=>[side*a,b]),-.18,.93,'#7a4b63');
        box(x,8.23,.34,1.92,2.64,.22,ink);
        const seg=side<0?[0,1,2,4,5,6]:[1,2];
        for(const n of seg){
          const [xx,yy,ww,hh]=[[0,.8,1,.14],[.52,.42,.14,.68],[.52,-.4,.14,.68],[0,0,1,.14],[-.52,-.40,.14,.68],[-.52,.42,.14,.68],[0,-.82,1,.14]][n];
          box(x+xx,8.23+yy,.49,ww,hh,.06,a,true);
        }
        for(let j=0;j<3;j++)box(side*(7.64+j*.53),10.06,.35,.23,.23,.15,gold,true);
        beam(side*4.7,4.1,side*9.05,6.1,-.30,.10,metal);
      }
      beam(-6.5,12.39,6.5,12.39,-.1,.12,metal);beam(-6.5,12.98,6.5,12.98,-.1,.10,metal);
      for(let j=0;j<7;j++){const x=-6+j*2.0;beam(x-.4,12.42,x+.30,12.96,-.10,.07,metal);box(x,13.10,.12,1.0,.38,.23,'#f4e7b0',true);}
      box(0,3.1,.05,9.4,.28,1.66,'#777482');
    }else if(s.housing==='meter'){
      box(0,.22,-.07,6.10,.44,3.16,'#8b8b93');box(0,.56,-.07,4.95,.26,2.40,'#deb25d');
      box(0,2.48,-.14,1.57,3.84,1.25,'#73899a');box(-.29,2.38,.53,.20,3.08,.11,metal);
      plate([[-5.98,4.0],[-6.40,5.1],[-6.40,9.84],[-5.79,11.18],[-3.43,12.69],[0,13.23],[3.42,12.69],[5.90,11.16],[6.23,9.90],[6.23,4.83],[5.80,4.0]],-.65,.96,'#6da7a2');
      plate([[-4.19,11.09],[-3.24,12.04],[-1.38,12.54],[.72,12.60],[2.72,12.20],[4.16,11.13]],-.08,.44,offWhite);
      beam(.24,11.20,2.25,12.07,.22,.10,red);disk(.24,11.20,.22,.23,.19,deep);
      for(let i=0;i<5;i++){const x=(i-2)*1.20;box(x,12.16-Math.abs(x)*.19,.24,.09,.22,.10,deep);}
      box(6.20,7.05,-.12,1.00,2.92,1.11,iron);disk(6.75,7.93,.48,.35,.25,gold);
      box(6.93,6.82,.34,.42,.98,.18,offWhite);box(6.92,6.95,.45,.26,.07,.05,deep);
      beam(-1.34,3.0,1.34,3.0,.05,.15,metal);
    }else{
      for(const x of [-4.64,4.64]){
        disk(x,.75,.8,.75,.65,deep);disk(x,.75,1.20,.40,.16,metal);
        box(x,1.67,.03,.68,1.25,1.61,'#915c66');
      }
      plate([[-6.25,1.34],[6.25,1.34],[7.26,2.43],[7.26,9.77],[6.46,10.88],[-6.19,10.88],[-7.17,9.83],[-7.17,2.40]],-.56,1.14,'#ad6b69');
      const path=[[-6.85,1.99,-.28],[-8.13,2.63,-.28],[-8.25,10.70,-.28],[-7.16,12.18,-.28],[-3.92,12.62,-.28],[-2.35,11.10,-.28]];
      for(let j=1;j<path.length;j++)rod(path[j-1],path[j],.25,'#4b5267');
      for(let j=0;j<5;j++)box(-8.20,4.0+j*1.22,-.20,.62,.16,.62,metal);
      for(const x of [-5.09,5.09]){
        disk(x,2.62,.24,.65,.46,deep);
        for(let j=0;j<5;j++)blade(x,2.62,.53,j*tau/5,.55,metal);
        disk(x,2.62,.58,.13,.13,s.trim,true);
      }
      box(0,11.05,-.35,3.44,.32,.94,deep);
    }
    const fixture={items:v,front:[...v].sort((a,b)=>a.z-b.z),staticMesh:null};
    fixtureCache.set(s.id,fixture);return fixture;
  }

  function meshCabinet(root,art,fixture){
    // Mesa shares the same transmitters across its sprint and its longer circuit.
    if(!fixture.staticMesh){
      const rigid=new T.Group(),b=art.builder(rigid);
      for(const p of fixture.items){
        if(p.type==='box')b.box([p.x,p.y,p.z],[p.w,p.h,p.d],p.color,null,p.lit);
        else if(p.type==='rod')b.rod(p.a,p.b,p.r,p.rEnd,p.color,p.lit,6);
        else if(p.type==='disk')b.rod([p.x,p.y,p.z-p.d/2],[p.x,p.y,p.z+p.d/2],p.r,p.r,p.color,p.lit,p.n);
        else{
          const shape=new T.Shape();
          p.pts.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
          const geo=new T.ExtrudeGeometry(shape,{depth:p.d,bevelEnabled:false,curveSegments:1});
          b.add(geo,[0,0,p.z-p.d/2],[1,1,1],null,p.color,p.lit);geo.dispose();
        }
      }
      b.finish();fixture.staticMesh=rigid;
    }
    root.add(fixture.staticMesh.clone(true));
  }
  function silhouette(c,p){
    c.fillStyle=p.color;c.beginPath();
    if(p.type==='box'){c.fillRect(p.x-p.w/2,p.y-p.h/2,p.w,p.h);return;}
    if(p.type==='disk'){c.arc(p.x,p.y,p.r,0,tau);c.fill();return;}
    if(p.type==='plate'){p.pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();return;}
    const [x,y]=p.a,[u,v]=p.b,dx=u-x,dy=v-y,len=Math.hypot(dx,dy);
    if(len<.001){c.arc(x,y,p.r,0,tau);c.fill();return;}
    const nx=-dy/len,ny=dx/len;
    c.moveTo(x+nx*p.r,y+ny*p.r);c.lineTo(x-nx*p.r,y-ny*p.r);
    c.lineTo(u-nx*p.rEnd,v-ny*p.rEnd);c.lineTo(u+nx*p.rEnd,v+ny*p.rEnd);c.fill();
  }
  function rectangle(w,centerY,x=0,z=.71){return {x,y:centerY,z,w,h:w*H/W};}
  function nameplate(w,h,y,z=.63,x=0){return {x,y,z,w,h};}
  function drawScreen(c,image,n,face,name=false){
    const {x,y}=cell(name?40:n);
    c.save();c.translate(face.x,face.y+face.h/2);c.scale(1,-1);c.imageSmoothingEnabled=false;
    c.drawImage(image.atlas,x,y,W,name?18:H,-face.w/2,0,face.w,face.h);c.restore();
  }
  function dimensions(fixture){
    let farX=0,highY=0,reach=0,radius=0;
    function sample(x,y,z){
      farX=Math.max(farX,Math.abs(x));highY=Math.max(highY,y);
      reach=Math.max(reach,Math.hypot(x,z));radius=Math.max(radius,Math.hypot(x,y,z));
    }
    for(const p of fixture.items){
      if(p.type==='plate'){
        for(const [x,y] of p.pts){sample(x,y,p.z+p.d/2);sample(x,y,p.z-p.d/2);}
      }else if(p.type==='rod'){
        for(const end of [p.a,p.b]){
          const r=Math.max(p.r,p.rEnd);
          for(const dx of [-r,r])for(const dy of [-r,r])for(const dz of [-r,r])sample(end[0]+dx,end[1]+dy,end[2]+dz);
        }
      }else{
        const rx=p.type==='disk'?p.r:p.w/2,ry=p.type==='disk'?p.r:p.h/2;
        for(const dx of [-rx,rx])for(const dy of [-ry,ry])for(const dz of [-p.d/2,p.d/2])sample(p.x+dx,p.y+dy,p.z+dz);
      }
    }
    return {width:2*farX+.14,height:highY+.09,footprintRadius:reach+.10,radius:radius+.12};
  }
  function program(s){
    const fixture=cabinet(s),size=dimensions(fixture);
    return {id:'lcd-'+s.id,kind:'lcd',region:s.region,route:s.route,f:s.f,off:s.off,name:s.name,crew:s.crew,ink:s.ink,
      caption:s.caption,reply:s.reply,sound:s.sound,...size,
      build(root,art){
        meshCabinet(root,art,fixture);const image=imageFor(s),p=s.panel,l=s.label;
        const glass=new T.Mesh(panel(s,0),image.mat);glass.name=s.name+' live LCD';glass.position.set(p.x,p.y,p.z);root.add(glass);
        const banner=new T.Mesh(panel(s,40,true),image.mat);banner.position.set(l.x,l.y,l.z);root.add(banner);
        let showing=-1;
        function tune(time,pulse=0){const n=frameAt(s,time,pulse);if(n!==showing){glass.geometry=panel(s,n);showing=n;}}
        tune(0,0);return tune;
      },
      draw(c,time,pulse=0){
        c.save();for(const part of fixture.front)silhouette(c,part);
        const image=imageFor(s);drawScreen(c,image,frameAt(s,time,pulse),s.panel);drawScreen(c,image,40,s.label,true);c.restore();
      }
    };
  }
  return [
    {id:'hat-trick',name:'Hat Trick Drive-In',crew:'Ivan',region:'arizona',f:.034,off:28,ink:aqua,case:'#4e787a',trim:'#64baad',
      channel:'05',ident:'K-HT DRIVE IN',housing:'drive',panel:rectangle(13.6,8.62),label:nameplate(9.9,1.35,3.68),
      film:hatFilm,offset:3,caption:'One roadrunner, one cactus, one very transferable hat.',reply:'That cactus has won best supporting hat.',sound:'cheer'},
    {id:'sandwich-weather',name:'Sandwich Weather',crew:'Harper',region:'arizona',f:.582,off:-30,ink:gold,case:'#426c75',trim:'#e5b964',
      channel:'07',ident:'SANDWICH RADAR',housing:'weather',panel:rectangle(12.9,7.64),label:nameplate(10.4,1.23,3.10),
      film:sandwichFilm,offset:12,caption:'A sub front is moving in. Localized mustard is likely.',reply:'Weather desk advises sheltering under the pickle.',sound:'steam'},
    {id:'vacuum-stampede',name:'Vacuum Stampede',crew:'Soon',region:'arizona',route:'return',f:.775,off:-29,ink:'#fdab95',case:'#926068',trim:'#e4a29c',
      channel:'68',ident:'WESTERN CLEANUP',housing:'vacuum',panel:rectangle(12.4,7.10),label:nameplate(8.20,1.05,2.63),
      film:vacuumFilm,offset:4,caption:'Western Cleanup has accidentally put the desert in reverse.',reply:'Dust herd released on its own recognizance.',sound:'steam'},
    {id:'frog-hold',name:'Please Hold, Frog',crew:'Dylan',region:'eight',f:.042,off:-27,ink:'#b6f3ad',case:'#abb99b',trim:'#dad6b5',
      channel:'31',ident:'POND OPERATING SYS',housing:'terminal',panel:rectangle(12.00,6.72,-.38),label:nameplate(7.2,.68,.96,1.19),
      film:frogFilm,offset:7,caption:'The pointer keeps disappearing into the pond operating system.',reply:'Cursor recovered. The frog requests a second monitor.',sound:'bleep'},
    {id:'cap-transit',name:'Cap Transit',crew:'Sugi',region:'eight',f:.584,off:29,ink:'#89ffd1',case:'#537978',trim:'#dfa76b',
      channel:'08',ident:'CANOPY CABLE',housing:'lift',panel:rectangle(12.75,9.05),label:nameplate(10.10,1.14,4.60),
      film:capFilm,offset:4,caption:'A live cable-car feed. Caps double as emergency parachutes.',reply:'Five mushrooms have requested a lower fare.',sound:'bell'},
    {id:'cornball',name:'Cornball Replay',crew:'Clint',region:'indiana',f:.079,off:-28,ink:gold,case:'#82586c',trim:'#d79a70',
      channel:'23',ident:'KERNEL SPORTS',housing:'arena',panel:rectangle(12.75,8.27),label:nameplate(9.01,1.22,3.80),
      film:cornFilm,offset:4,caption:'Watch the replay. The ball pops exactly when it hits the rim.',reply:'After review, the basket is lightly salted.',sound:'cheer'},
    {id:'parking-finals',name:'Parallel Parking Finals',crew:'Mint',region:'indiana',f:.705,off:29,ink:'#8bffda',case:'#5e878d',trim:'#9ed0ab',
      channel:'44',ident:'METER DIVISION',housing:'meter',panel:rectangle(10.75,7.54),label:nameplate(7.9,1.08,3.83),
      film:parkingFilm,offset:7,caption:'A legal parking maneuver. An exceptionally long ticket.',reply:'The fine print has received a fine for excessive length.',sound:'coin'}
  ].map(program);
})();
