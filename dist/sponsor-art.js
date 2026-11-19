/* Original spot-color campaigns for the 2389 Research motor pool. Each plate
   paints in a 640 × 256 local space and needs only a 2D canvas context. */
const MTMSponsorArt = (() => {
  'use strict';
  const WIDTH = 640, HEIGHT = 256, TAU = Math.PI * 2;
  const condensed = '700 100px Cond, "Arial Narrow", "DejaVu Sans", sans-serif';
  const grotesk = '900 100px "Arial Black", Body, "DejaVu Sans", sans-serif';
  const racing = 'italic 900 100px Display, Impact, "DejaVu Sans", sans-serif';
  const slab = 'bold 100px Georgia, "DejaVu Serif", serif';
  const outlines = new Map();
  const pathCalls = {M:'moveTo',L:'lineTo',Q:'quadraticCurveTo',C:'bezierCurveTo',Z:'closePath'};
  const pathArity = {M:2,L:2,Q:4,C:6,Z:0};

  // A tiny absolute-path reader keeps the hand-lettering and illustrations
  // portable to ordinary browser canvas, OffscreenCanvas and native test canvases.
  function path(c, drawing, ink, border, width = 1) {
    let calls = outlines.get(drawing);
    if (!calls) {
      calls = [];
      for (const run of drawing.match(/[MLQCZ][^MLQCZ]*/g)) {
        let verb = run[0];
        const points = (run.slice(1).match(/-?(?:\d*\.)?\d+/g) || []).map(Number);
        if (verb === 'Z') calls.push([pathCalls.Z, []]);
        for (let i = 0; i < points.length; i += pathArity[verb]) {
          calls.push([pathCalls[verb], points.slice(i, i + pathArity[verb])]);
          if (verb === 'M') verb = 'L';
        }
      }
      outlines.set(drawing, calls);
    }
    c.beginPath();
    for (const [method,points] of calls) c[method](...points);
    if (ink) {c.fillStyle = ink;c.fill('evenodd');}
    if (border) {c.strokeStyle = border;c.lineWidth = width;c.stroke();}
  }
  function rect(c,x,y,w,h,ink) {c.fillStyle=ink;c.fillRect(x,y,w,h);}
  function ellipse(c,x,y,rx,ry,angle,ink,border,width=1) {
    c.beginPath();c.ellipse(x,y,rx,ry,angle,0,TAU);
    if(ink){c.fillStyle=ink;c.fill();}
    if(border){c.strokeStyle=border;c.lineWidth=width;c.stroke();}
  }
  function dots(c,x,y,w,h,step,r,ink) {
    c.fillStyle=ink;c.beginPath();
    for(let j=0;j*step<h;j++) for(let i=0;i*step<w;i++) {
      const px=x+i*step+(j%2)*step*.5,py=y+j*step;
      c.moveTo(px+r,py);c.arc(px,py,r,0,TAU);
    }
    c.fill();
  }
  function glint(c,x,y,r,ink) {
    c.save();c.translate(x,y);c.scale(r,r);
    path(c,'M0 -1 Q.07 -.12 .76 0 Q.11 .08 0 1 Q-.12 .10 -.76 0 Q-.12 -.10 0 -1 Z',ink);
    c.restore();
  }
  function burst(c,x,y,r,n,inner,ink,angle=0) {
    c.beginPath();
    for(let i=0;i<n*2;i++){
      const site=angle+i*Math.PI/n,length=i%2?inner:r;
      const xx=x+Math.cos(site)*length,yy=y+Math.sin(site)*length;
      if(i)c.lineTo(xx,yy);else c.moveTo(xx,yy);
    }
    c.closePath();c.fillStyle=ink;c.fill();
  }
  // Set a visible ink rectangle, independent of whether an embedded typeface
  // has finished loading when the course first builds its texture atlas.
  function type(c,word,x,y,w,h,ink,font=grotesk,border=null,stroke=2) {
    c.save();c.font=font;c.textAlign='left';c.textBaseline='alphabetic';
    const m=c.measureText(word);
    const left=m.actualBoundingBoxLeft||0,right=m.actualBoundingBoxRight||m.width;
    const up=m.actualBoundingBoxAscent||73,down=m.actualBoundingBoxDescent||0;
    c.translate(x,y);c.scale(w/(left+right),h/(up+down));
    if(border){c.strokeStyle=border;c.lineWidth=stroke;c.strokeText(word,left,up);}
    c.fillStyle=ink;c.fillText(word,left,up);c.restore();
  }
  function maker(c,x,y,ink) {
    // The split numeral logotype also works on the very small 2D race signs.
    type(c,'2389',x,y,40,13,ink,racing);
    rect(c,x+45,y-1,2,15,ink);
    type(c,'RESEARCH',x+52,y+3,57,8,ink,grotesk);
  }
  function plate(id,name,tag,accent,background,painter) {
    return {id,name,tag,accent,background,draw(c,w,h) {
      if(!(w>0&&h>0))return;
      c.save();c.scale(w/WIDTH,h/HEIGHT);c.beginPath();c.rect(0,0,WIDTH,HEIGHT);c.clip();
      c.lineCap='round';c.lineJoin='round';
      rect(c,0,0,WIDTH,HEIGHT,background);
      painter(c,tag);c.restore();
    }};
  }

  // Tracker's human gate gets a real marshal's glove and a starting light.
  function tracker(c,tag) {
    const dark='#152330',paper='#fff5c7',mint='#65f6ac',shade='#309e87';
    path(c,'M498 0 L640 0 640 256 352 256 Z',dark);
    path(c,'M539 0 L578 0 427 256 390 256 Z','#274756');
    path(c,'M597 0 L610 0 463 256 450 256 Z',shade);
    c.save();c.beginPath();c.rect(0,229,373,27);c.clip();
    for(let x=-24;x<410;x+=39){c.save();c.translate(x,0);path(c,'M0 256 L22 229 38 229 16 256 Z',dark);c.restore();}
    c.restore();
    dots(c,334,26,77,44,7,1.5,'#c2a93b');
    maker(c,24,18,dark);
    rect(c,146,24,181,3,dark);
    for(let i=0;i<4;i++)rect(c,335+i*8,20,3,10,dark);
    type(c,'TRACKER',22,62,397,88,shade,racing);
    type(c,'TRACKER',15,55,397,88,dark,racing);
    path(c,'M23 164 L374 164 350 206 19 206 Z',dark);
    type(c,tag,34,173,297,25,paper,condensed);
    // Oblique die-cast semaphore with two unlit lenses and one green lens.
    c.save();c.translate(468,11);c.rotate(.16);
    path(c,'M12 9 L45 2 60 12 60 120 45 133 7 124 2 20 Z','#344e50',paper,3);
    path(c,'M10 12 L44 6 53 16 50 116 37 125 6 118 7 24 Z',dark);
    for(let i=0;i<3;i++){
      const by=29+i*38;
      ellipse(c,28,by,15,16,0,i===2?mint:'#6f7772',null);
      ellipse(c,28,by,11.5,12,0,i===2?'#d2ff8c':'#344449',null);
      c.save();c.translate(0,i*38);path(c,'M11 22 Q25 9 44 19',null,dark,3);c.restore();
      if(i===2)glint(c,32,by-4,5,paper);
    }
    c.restore();
    // An oversized foam glove gives the actual approval, with three knuckle
    // folds and the double seam of the race marshal's cyan cuff.
    c.save();c.translate(8,-4);
    path(c,'M474 202 C461 194 457 173 464 158 L480 129 Q487 119 503 119 L521 117 C527 104 532 91 532 76 C532 63 545 57 555 65 C568 77 564 103 557 122 L590 116 Q610 113 614 127 Q619 138 608 147 Q619 157 609 169 Q612 181 598 187 Q597 200 581 205 L546 214 Q528 219 513 214 L501 219 Z',paper,dark,7);
    path(c,'M539 79 Q551 74 551 86 L545 111 M556 135 L593 128 M548 153 L600 145 M546 170 L600 162 M550 188 L590 180 M500 131 Q481 151 479 171',null,dark,3.8);
    path(c,'M477 173 Q478 197 492 203 L512 210 501 220 469 205 Z','#efb955');
    path(c,'M455 175 L512 207 493 240 434 207 Z',mint,dark,7);
    path(c,'M450 187 L504 217 M458 202 L477 213',null,shade,3);
    c.restore();
    glint(c,608,66,10,paper);
  }

  // Dippin's branching workflow is stamped into a clattery three-key keyboard.
  // The title is a continuous, hand-drawn sign-painter's script.
  const dippinScript='M12 62 C17 47 24 22 23 12 M5 20 C26 -2 56 1 58 24 C61 47 39 67 12 62 M65 31 L59 49 Q55 63 67 55 L75 46 M78 82 L91 31 M85 48 C102 22 115 31 107 46 Q100 61 88 53 Q100 61 115 47 M116 82 L129 31 M122 48 C142 21 154 33 144 48 Q137 60 126 53 Q140 59 153 47 M160 32 L154 49 Q152 61 162 55 L171 45 M177 32 L169 57 Q191 22 199 32 Q203 36 195 49 Q191 60 202 55 L214 45';
  function keycap(c,x,y,scale,base,face,legend) {
    const ink='#111a41';
    c.save();c.translate(x,y);c.scale(scale,scale);
    path(c,'M0 31 L76 0 140 26 140 68 64 101 0 73 Z',base,ink,6);
    path(c,'M64 62 L140 29 140 68 64 101 Z','#3453a6',ink,4);
    path(c,'M8 30 L75 6 132 28 65 57 Z',face,ink,4);
    path(c,'M9 39 L56 59 M71 66 L128 41',null,'#fbedc9',2.5);
    if(legend==='branch'){
      path(c,'M43 25 L63 34 79 27 M63 34 L76 40 92 32',null,ink,3.5);
      for(const [xx,yy] of [[43,25],[79,27],[93,32]])ellipse(c,xx,yy,4.6,2.8,0,ink);
    }else{
      c.save();c.translate(39,25);c.transform(1,-.4,.95,.54,0,0);
      type(c,legend,0,0,52,20,ink,grotesk);c.restore();
    }
    c.restore();
  }
  function dippin(c,tag) {
    const ink='#121b47',cream='#fff3ce',pink='#ff93a1';
    path(c,'M0 0 L205 0 266 256 0 256 Z','#86e9d7');
    path(c,'M0 208 L134 161 198 186 0 253 Z',cream);
    dots(c,8,21,124,66,9,2,'#31aaa8');
    path(c,'M640 10 L556 47 640 37 Z',pink);
    path(c,'M640 49 L597 67 640 60 Z',cream);
    keycap(c,17,35,.71,'#ff7296','#ffcf91','{ }');
    keycap(c,121,73,.76,'#a1babd',cream,'branch');
    keycap(c,21,128,1.09,'#fe7294',pink,'.dip');
    for(const [x,y] of [[19,118],[199,48],[218,201]])glint(c,x,y,8,ink);
    maker(c,253,18,cream);
    c.save();c.translate(247,61);c.scale(1.73,1.22);
    // The dark keyline and independent pink plate deliberately miss register.
    c.save();c.translate(3,5);path(c,dippinScript,null,ink,13);c.restore();
    path(c,dippinScript,null,cream,10);
    for(const x of [69,164]){ellipse(c,x,15,5.5,6.4,.35,pink,ink,1.4);}
    c.restore();
    path(c,'M250 184 L599 178 585 220 245 226 Z',ink);
    type(c,tag,267,190,284,24,cream,grotesk);
    path(c,'M604 181 L618 180 603 220 589 220 Z',pink);
    rect(c,255,235,91,3,'#91eee2');rect(c,350,235,33,3,pink);
  }

  // An engraved brass orrery connects individual documents like a small galaxy.
  function orrery(c,tag) {
    const night='#181a36',brass='#eebd71',ivory='#ffebbd',cyan='#79dcdb',coral='#f27673',muted='#5f7396';
    path(c,'M0 193 L250 143 255 256 0 256 Z','#242742');
    c.save();c.beginPath();c.rect(0,0,237,256);c.clip();
    for(let i=0;i<32;i++){
      const x=(i*67+17)%238,y=(i*83+15)%245;
      ellipse(c,x,y,i%4===0?1.6:.9,i%4===0?1.6:.9,0,muted);
    }
    for(const [x,y,r] of [[30,29,5],[169,14,6],[26,174,4],[223,45,4]])glint(c,x,y,r,ivory);
    // Counterweighted stand and graduated arm.
    path(c,'M116 176 C119 203 112 212 102 216 L97 221 170 221 159 215 Q146 208 145 175 Z','#8b6c58',brass,2.5);
    path(c,'M89 218 Q132 209 178 217 L189 228 Q136 239 80 230 Z',brass,night,3);
    path(c,'M81 229 Q139 237 190 225 L188 235 Q135 246 77 237 Z',muted,night,2);
    path(c,'M132 195 L132 50',null,brass,4);
    for(const [rx,ry,a,clr,weight] of [[106,39,-.38,brass,3],[99,57,.26,muted,2],[76,79,-.58,cyan,2],[89,34,.72,brass,1.7]]){
      ellipse(c,129,118,rx,ry,a,null,clr,weight);
    }
    path(c,'M42 151 L83 120 131 117 189 66 M101 161 L131 117 177 137',null,muted,1.6);
    for(const [x,y,r,ink] of [[43,151,12,cyan],[193,65,8,coral],[87,55,5,brass],[176,140,8,ivory],[103,162,4,coral]]){
      ellipse(c,x,y,r,r,0,ink,night,2);ellipse(c,x-r*.26,y-r*.32,r*.20,r*.20,0,ivory);
    }
    ellipse(c,131,117,24,24,0,coral,night,2.4);
    path(c,'M110 120 Q126 105 149 108 M113 128 Q127 114 153 113 M120 135 Q137 121 152 120',null,'#b44a60',2.5);
    c.save();c.beginPath();c.rect(0,115,237,40);c.clip();ellipse(c,131,117,40,10,-.31,null,ivory,3.7);c.restore();
    c.restore();
    maker(c,252,23,brass);
    path(c,'M378 30 L591 30 M604 30 L620 30',null,muted,1.4);
    for(const [x,y,r] of [[587,56,8],[617,128,5],[235,156,4]])glint(c,x,y,r,cyan);
    type(c,'ORRERY',247,78,369,70,'#754d65',slab);
    type(c,'ORRERY',244,73,369,70,ivory,slab);
    path(c,'M247 162 L608 162',null,brass,2);
    type(c,tag,248,178,354,28,cyan,condensed);
    for(let i=0;i<32;i++)rect(c,247+i*11.5,229,1,i%4===0?8:3,muted);
    ellipse(c,614,229,3,3,0,brass);
  }

  // Simmer uses restaurant lettering, a proofreading pencil and ribbon noodles.
  const simmerScript='M48 12 C18 -2 1 20 20 33 L36 42 C62 57 29 79 8 59 M61 31 L55 48 Q51 62 63 54 L71 45 M78 31 L70 57 Q90 21 97 32 L90 55 Q108 23 116 32 Q119 36 111 49 Q107 59 118 53 L124 46 M131 31 L123 57 Q145 22 151 32 L144 56 Q165 23 171 32 Q174 36 166 48 Q163 60 174 53 L182 45 M183 48 C208 44 210 25 197 28 C181 31 172 57 191 59 Q203 60 215 45 M211 57 L220 30 Q224 21 229 28 Q233 31 225 35 C235 29 244 30 248 34';
  function simmer(c,tag) {
    const red='#d73940',claret='#612336',cream='#fff0b9',orange='#ff9c4e',dark='#35223b';
    path(c,'M404 0 L640 0 640 256 345 256 Q427 125 404 0 Z',cream);
    for(let i=0;i<10;i++){
      c.save();c.translate(548,137);c.rotate(i*TAU/10-.12);
      path(c,'M0 0 L143 -10 145 4 Z','#f2d78d');c.restore();
    }
    path(c,'M0 218 Q166 233 356 208 L340 256 0 256 Z',claret);
    dots(c,12,225,308,31,9,1.5,'#ac4550');
    maker(c,24,17,cream);
    c.save();c.translate(13,53);c.scale(1.55,1.33);
    c.save();c.translate(2.6,4.2);path(c,simmerScript,null,claret,12);c.restore();
    path(c,simmerScript,null,cream,8.4);ellipse(c,65.5,15.5,4.6,5.5,.35,orange);
    c.restore();
    path(c,'M21 164 Q141 151 360 157 L350 166 Q187 161 30 172 Z',orange);
    type(c,tag,25,177,332,27,cream,condensed);
    // The page-pencil cuts the spiral of steam and re-enters the cooked draft.
    path(c,'M492 104 C460 76 512 74 497 47 M518 100 C496 79 536 71 525 49 M542 92 C537 79 554 68 550 59',null,red,4);
    c.save();c.translate(540,109);c.rotate(.51);
    path(c,'M-7 -75 L7 -75 7 44 0 60 -7 44 Z',orange,dark,3);
    rect(c,-6,-74,12,12,'#ee7091');rect(c,-6,-62,12,6,'#9ca7a0');rect(c,2,-54,2,93,'#d56a3d');
    path(c,'M-6 43 L6 43 0 60 Z',cream,dark,1.2);path(c,'M-2.5 54 L2.5 54 0 60 Z',dark);c.restore();
    ellipse(c,526,132,81,22,-.06,claret,dark,5);
    ellipse(c,526,130,72,14,-.06,'#e57b48');
    for(let j=0;j<3;j++){
      c.save();c.translate(j*17,-j*2);
      path(c,'M469 132 C490 112 493 147 505 131 C523 106 526 144 539 129',null,cream,3.3);c.restore();
    }
    path(c,'M445 134 Q459 189 498 202 Q524 216 556 198 Q596 179 607 126 Q537 161 445 134 Z',red,dark,5);
    path(c,'M453 148 Q534 173 600 140 M461 163 Q536 187 593 153',null,cream,5);
    ellipse(c,530,204,31,6,-.11,claret,dark,2.3);
    path(c,'M479 174 Q504 195 520 193',null,orange,4);
    glint(c,609,70,11,red);
  }

  // Five separate, original cut-paper capitals give Coven a metal-band logo.
  const covenLetters=[
    'M42 0 L39 17 32 11 24 8 14 16 14 48 24 56 37 49 44 40 40 58 23 68 3 54 3 17 23 2 34 5 Z',
    'M22 1 L42 12 42 52 23 68 3 56 3 17 Z M15 17 L15 47 26 57 31 51 31 20 21 11 Z',
    'M0 0 L18 6 16 12 24 47 34 14 29 8 45 1 44 14 26 63 21 69 6 16 Z',
    'M1 5 L42 2 37 17 31 11 16 12 16 29 36 26 32 39 16 38 16 53 33 56 43 46 39 64 23 68 2 57 6 51 6 16 Z',
    'M0 9 L14 0 35 37 34 14 29 8 45 1 44 60 37 69 15 29 16 55 21 60 2 67 4 17 Z'
  ];
  function familiar(c,x,y,s,trim) {
    const night='#231b3b';
    c.save();c.translate(x,y);c.scale(s,s);
    path(c,'M-25 25 Q-25 6 -14 -7 Q-9 -18 4 -25 Q18 -17 22 2 L28 24 Q2 37 -25 25 Z',night,trim,2.6);
    path(c,'M-13 7 Q-6 -4 4 -10 Q13 -6 15 8 Q1 17 -13 7 Z','#100f25');
    path(c,'M-8 6 L-2 8 M5 8 L10 5',null,trim,3.2);
    c.restore();
  }
  function coven(c,tag) {
    const night='#251737',lilac='#e6c7f1',acid='#d4ff87',violet='#aa7bdf';
    path(c,'M0 0 L222 0 258 256 0 256 Z','#34234f');
    ellipse(c,126,118,93,94,0,'#916dbe');
    ellipse(c,126,118,86,87,0,null,'#4f3779',2);
    for(let j=0;j<6;j++)rect(c,20,138+j*10,208,2+j*.8,'#34234f');
    dots(c,7,9,91,46,8,1.4,'#715494');
    // A witch's hat sits on the physical host, with three little agents sharing it.
    path(c,'M39 100 Q63 94 76 81 C80 60 90 36 105 19 Q119 10 143 24 L120 28 132 49 148 76 Q170 82 181 96 Q122 120 39 100 Z',night,acid,3.2);
    path(c,'M77 79 Q111 84 145 70 L152 80 Q113 96 76 89 Z',violet,night,2.6);
    path(c,'M104 80 L121 77 120 87 103 90 Z',acid,night,1.8);
    path(c,'M92 62 Q99 39 107 31 M51 100 Q99 108 157 91',null,'#7658a0',2.8);
    for(let j=0;j<3;j++){
      const yy=112+j*20;
      c.save();c.translate(0,yy);
      path(c,'M70 2 L146 -3 158 2 156 14 78 19 68 14 Z',j===2?'#654e8e':lilac,night,3);
      path(c,'M78 7 L106 6 M78 11 L100 10',null,'#694e80',2);
      ellipse(c,140,5.7,2.3,2.3,0,'#4d956a');ellipse(c,148,5.2,2,2,0,'#a85084');c.restore();
    }
    path(c,'M116 173 L116 185 72 190 61 204 M116 185 L155 190 171 204',null,acid,2.4);
    familiar(c,49,198,.73,acid);familiar(c,176,194,.75,acid);familiar(c,112,206,.94,lilac);
    glint(c,26,76,9,acid);glint(c,187,40,12,lilac);glint(c,211,169,5,acid);
    path(c,'M250 9 L260 9 243 245 234 245 Z','#8c5fbd');
    maker(c,267,24,lilac);
    path(c,'M390 31 L608 31',null,'#ab82cc',1.4);
    c.save();c.translate(261,58);c.scale(1.58,1.45);
    for(let j=0;j<covenLetters.length;j++){
      c.save();c.translate(j*46,0);
      c.save();c.translate(2.8,4);path(c,covenLetters[j],night,night,3);c.restore();
      path(c,covenLetters[j],acid,night,1.5);c.restore();
    }
    c.restore();
    path(c,'M264 177 L620 170 608 214 271 222 Z',night);
    type(c,tag,279,185,309,24,lilac,condensed);
    glint(c,606,53,6,lilac);glint(c,616,227,7,acid);
  }

  // MermaidKit's tail and branching chart share a single wave in this surf ad.
  function mermaid(c,tag) {
    const navy='#123750',deep='#176d7d',cream='#fff1cf',coral='#ff816e';
    path(c,'M367 0 L640 0 640 256 399 256 Q439 101 367 0 Z','#b7f0d8');
    ellipse(c,536,94,60,60,0,coral);
    for(let y=108;y<156;y+=9)rect(c,471,y,130,4,'#b7f0d8');
    dots(c,390,10,77,43,8,1.4,'#60bcb7');
    // Two opposing fins meet a scaled body. Fin rays are individually cut
    // against the sky, like a large three-ink Japanese seaside print.
    path(c,'M441 207 Q478 192 494 174 C529 155 547 137 549 110 C552 93 548 82 535 67 Q552 68 561 78 Q557 56 546 45 C571 50 582 78 571 101 Q593 82 619 82 Q606 90 602 102 Q593 119 569 124 C571 159 558 185 536 207 Q502 232 458 239 Z',deep,navy,4);
    path(c,'M549 111 Q551 94 536 69 Q552 70 562 84 Q557 58 548 47 Q579 57 572 98 Q596 82 617 83 Q605 92 601 103 Q593 117 570 122 Z',coral,navy,3.5);
    path(c,'M565 104 Q564 83 554 64 M570 105 Q573 77 562 63 M574 113 Q591 101 602 94 M575 117 Q594 113 596 107',null,cream,2);
    path(c,'M546 125 Q546 149 525 169 M508 195 Q531 187 545 165',null,'#68d7bf',3.3);
    for(const [x,y] of [[542,142],[537,152],[532,163],[527,150],[521,164],[517,174],[506,174],[500,186],[534,175],[518,188]]){
      c.save();c.translate(x,y);path(c,'M-4 -3 Q0 4 5 -3',null,'#83e4c9',1.6);c.restore();
    }
    path(c,'M393 235 Q421 230 448 208 C471 192 491 196 506 207 C500 194 489 183 474 185 Q501 167 527 198 Q549 222 569 204 Q597 179 640 182 L640 256 391 256 Z',deep,navy,3.5);
    path(c,'M401 237 Q432 228 451 213 C473 198 492 200 507 211 Q508 199 492 190 Q507 190 521 205 Q542 230 568 214 Q592 195 614 193',null,cream,5);
    path(c,'M417 249 Q454 240 472 225 M542 247 Q569 245 588 227',null,'#67cfbe',2);
    // Small real flowchart symbols, connected as a branch, double as sea foam.
    path(c,'M446 110 L426 110 426 86 411 86 M426 110 L426 133 406 133',null,navy,2.8);
    path(c,'M445 110 L456 101 467 110 456 119 Z',cream,navy,2.4);
    rect(c,392,80,18,12,navy);rect(c,395,83,12,6,cream);
    rect(c,386,127,18,12,navy);rect(c,389,130,12,6,cream);
    maker(c,23,22,navy);
    path(c,'M149 29 L364 29',null,deep,1.8);
    type(c,'Mermaid',21,68,292,70,'#69b6ad',slab);
    type(c,'Mermaid',18,63,292,70,navy,slab);
    c.save();c.translate(313,68);c.rotate(-.085);
    path(c,'M0 3 L70 0 69 58 0 57 Z',coral,navy,3);
    type(c,'KIT',8,12,53,35,navy,grotesk);c.restore();
    type(c,tag,22,166,361,26,navy,condensed);
    path(c,'M20 208 Q64 205 84 209 Q113 215 141 205 L365 205',null,deep,2.5);
    ellipse(c,372,205,4,4,0,coral,navy,1.3);
  }

  // Smasher is a giant stamping press putting a DOT graph into gear.
  function smasher(c,tag) {
    const ink='#272634',cream='#ffebc0',lemon='#ffce50',metal='#8c8591';
    path(c,'M0 0 L248 0 194 256 0 256 Z','#ad443b');
    path(c,'M224 0 L255 0 198 256 167 256 Z',ink);
    dots(c,260,12,350,45,8,1.6,'#ba4a39');
    for(let i=0;i<5;i++){
      c.save();c.translate(14,112+i*18);path(c,'M0 0 L90 7 16 9 Z',cream);c.restore();
    }
    burst(c,121,181,100,13,41,ink,.12);
    burst(c,121,181,87,13,34,lemon,.12);
    burst(c,121,181,53,9,20,cream,.22);
    path(c,'M49 206 L75 186 118 197 154 176 185 189',null,ink,4);
    for(const [x,y] of [[49,206],[75,186],[118,197],[154,176],[185,189]])ellipse(c,x,y,5,5,0,cream,ink,2.5);
    // The rectangular die, not a hand tool, advances the connected nodes.
    c.save();c.translate(124,157);c.rotate(-.22);
    path(c,'M-39 -164 L27 -164 27 -110 17 -100 -28 -100 -39 -110 Z',metal,ink,5);
    for(let j=0;j<3;j++)rect(c,-31,-148+j*13,51,3,ink);
    path(c,'M-25 -103 L16 -103 16 -50 -25 -50 Z',cream,ink,4);
    rect(c,-20,-100,7,47,metal);
    path(c,'M-47 -54 L38 -54 53 -41 53 -17 44 -9 -53 -9 -61 -19 -61 -39 Z','#615d70',ink,5);
    path(c,'M-53 -34 L47 -34 47 -15 -52 -15 Z',lemon,ink,2.3);
    for(let x=-39;x<32;x+=17){
      c.save();c.translate(x,0);path(c,'M0 -32 L8 -32 1 -17 -7 -17 Z',ink);c.restore();
    }
    path(c,'M-27 -9 L26 -9 24 8 -25 8 Z',metal,ink,3);
    c.restore();
    maker(c,264,19,cream);
    path(c,'M254 54 L620 46 630 61 609 139 229 158 Z',ink);
    type(c,'SMASHER',238,67,379,76,'#a5443d',racing);
    type(c,'SMASHER',234,61,379,76,cream,racing);
    path(c,'M231 162 L606 152 599 161 229 171 Z',lemon);
    type(c,tag,239,184,344,29,ink,grotesk);
    for(let i=0;i<6;i++){c.save();c.translate(527+i*15,232);path(c,'M0 0 L8 0 1 14 -7 14 Z',ink);c.restore();}
  }

  // Neon tubing in Pulse's wordmark becomes the signal on its journal pager.
  const pulseTubes='M7 65 L7 7 30 7 Q48 7 48 22 Q48 37 30 37 L8 37 M61 7 L61 46 Q61 65 79 65 Q98 65 98 46 L98 7 M116 7 L116 65 151 65 M199 12 Q192 5 180 7 Q162 8 163 22 Q163 32 183 37 Q204 42 201 54 Q199 66 183 66 Q169 67 160 60 M254 8 L221 8 221 65 255 65 M221 36 L249 36';
  function pulse(c,tag) {
    const pink='#f45798',dark='#35203e',ink='#26182f',ice='#b8f1ea',cream='#fff2d8',lavender='#a69de2';
    path(c,'M380 0 L640 0 640 256 437 256 Z','#814877');
    path(c,'M428 0 L640 0 640 256 485 256 Z',dark);
    dots(c,440,9,202,241,10,1.25,'#625271');
    maker(c,23,21,ink);
    path(c,'M152 29 L369 29',null,ink,2);
    c.save();c.translate(16,64);c.transform(1.38,0,-.075,1.18,0,0);
    c.save();c.translate(3.8,5);path(c,pulseTubes,null,'#ab396c',19);c.restore();
    path(c,pulseTubes,null,dark,17);path(c,pulseTubes,null,cream,9.7);
    path(c,pulseTubes,null,'#ffd5df',2.2);c.restore();
    // A diary and an opt-in speech bubble occupy visibly separate pieces of paper.
    path(c,'M23 165 L208 165 210 210 78 210 63 222 65 210 23 210 Z',dark);
    path(c,'M217 165 L381 165 381 209 259 209 241 220 245 209 217 209 Z',ice,dark,2.7);
    const split=tag.indexOf(' HI,');
    type(c,tag.slice(0,split),34,178,158,21,cream,condensed);
    type(c,tag.slice(split+1),230,178,136,21,dark,condensed);
    // Ring-bound signal diary, with a physical lock and an LCD heartbeat trace.
    c.save();c.translate(506,152);c.rotate(-.15);
    path(c,'M-72 -59 Q-67 -67 -56 -67 L46 -67 Q56 -67 61 -57 L61 45 53 58 -61 58 -72 44 Z','#6ba8af',ink,5);
    path(c,'M-65 -58 L45 -58 53 -51 53 42 45 48 -64 48 Z',cream,ink,3);
    path(c,'M-70 -62 L39 -62 48 -54 48 36 39 42 -70 42 Z',ice,ink,4);
    for(let j=0;j<4;j++){
      ellipse(c,-62,-46+j*24,4,4,0,ink);
      c.save();c.translate(0,j*24);
      path(c,'M-62 -46 Q-82 -53 -80 -41 Q-79 -36 -70 -37',null,ink,4);c.restore();
    }
    path(c,'M-47 -43 L31 -43 31 -10 -47 -10 Z',dark,ink,2);
    path(c,'M-41 -27 L-30 -27 -25 -36 -19 -17 -12 -32 -8 -25 2 -25 9 -30 15 -26 25 -26',null,pink,2.7);
    path(c,'M-45 6 L-14 6 M-45 14 L-6 14 M-45 22 L-23 22',null,'#518a95',2.8);
    path(c,'M17 -1 L44 -1 56 4 53 19 15 19 Z',lavender,ink,2.5);
    path(c,'M23 2 L23 -4 Q29 -16 36 -6 L36 2',null,ink,3.2);
    path(c,'M21 2 L37 2 37 15 21 15 Z',pink,ink,2.2);
    ellipse(c,29,8,1.8,2.3,0,ink);c.restore();
    path(c,'M527 29 Q529 22 537 21 L593 19 Q603 19 604 28 L604 54 Q604 62 594 63 L568 64 551 80 554 64 532 65 Q524 63 525 55 Z',pink,ink,3.5);
    for(let j=0;j<3;j++)ellipse(c,546+j*16,43,4.2,4.2,0,cream);
    glint(c,617,112,11,ice);glint(c,431,58,6,cream);glint(c,587,211,5,lavender);
  }

  // A second print run gives each district its own local advertisers.
  function mammoth(c,tag){
    const soot='#292022',paper='#ffe1a5',red='#d54132';
    for(let i=0;i<6;i++)rect(c,0,2+i*4,155-i*7,2,i%2?red:'#f4bd63');
    dots(c,8,85,367,149,10,1.35,'#bf7e45');
    maker(c,30,23,soot);type(c,'MAMMOTH',20,70,391,83,soot,grotesk);
    path(c,'M16 166 L389 162 377 205 25 213 Z',soot);type(c,tag,37,176,320,23,paper,condensed);
    // The mammoth's legs and branching pipeline sit in the same woodcut.
    path(c,'M385 151 Q377 80 417 60 L428 44 440 48 451 36 462 40 Q489 30 519 49 Q547 40 575 65 L587 83 582 93 Q613 101 604 139 L601 170 Q610 182 619 155 Q631 168 618 190 Q602 209 582 188 Q571 177 576 150 L568 129 545 133 536 182 510 185 506 152 479 151 468 186 444 184 444 147 421 143 411 175 389 172 Z',soot);
    path(c,'M553 124 Q588 158 623 114 Q615 158 580 157 Q556 154 545 134 Z',paper,soot,3);
    ellipse(c,562,93,5,5,0,paper);ellipse(c,563,94,2.6,2.6,0,soot);
    for(const [x,y] of [[422,83],[454,66],[486,61],[516,69]]){
      c.save();c.translate(x,y);path(c,'M0 0 L-5 16 M6 1 L3 13',null,red,2.8);c.restore();
    }
    path(c,'M386 211 L452 211 464 221 499 221 512 210 620 210',null,red,4);
    for(const x of [386,452,512,620])ellipse(c,x,211,4.5,4.5,0,soot);
  }
  function rodeo(c,tag){
    const ink='#472446',gold='#ffcb54',cream='#fff7d7';
    for(let i=0;i<14;i++){c.save();c.translate(106,135);c.rotate(i*TAU/14);path(c,'M0 0 L235 -9 235 7 Z','#f47664');c.restore();}
    // A cat in a western hat rides a rocking reaction bubble.
    c.save();c.translate(117,135);c.rotate(-.13);
    path(c,'M-74 19 Q-59 -26 -9 -28 Q19 -39 55 -13 L72 -15 68 -37 82 -20 Q103 1 83 26 L58 43 48 76 32 76 36 47 -21 48 -43 70 -62 68 -47 42 Z',gold,ink,5);
    path(c,'M-48 22 Q-64 -3 -81 9 Q-92 19 -85 28',null,ink,6);
    path(c,'M-23 -30 L-26 -62 -12 -49 3 -51 16 -63 17 -36 Q-2 -14 -23 -30 Z',cream,ink,4);
    path(c,'M-44 -59 Q-24 -50 -17 -78 Q-6 -88 8 -76 L15 -66 Q27 -65 30 -72 Q37 -47 -4 -48 Z',ink);
    path(c,'M-15 -40 L-10 -39 M7 -42 L11 -43 M-2 -36 L0 -34',null,ink,2.6);c.restore();
    maker(c,236,23,cream);type(c,'MEME',222,48,292,62,cream,slab,ink,4);type(c,'RODEO',213,112,403,81,gold,slab,ink,4);
    rect(c,222,207,387,29,ink);type(c,tag,246,214,338,15,cream,condensed);
    for(const [x,y] of [[38,45],[191,57],[593,58]])glint(c,x,y,11,gold);
  }
  function turtle(c,tag){
    const ink='#103d42',mint='#abf5ae',lime='#e8f790',blue='#317783';
    for(let i=0;i<9;i++)rect(c,0,17+i*27,640,2,'#75c5af');
    rect(c,16,14,610,227,ink);rect(c,22,20,598,215,'#80cec0');maker(c,36,32,ink);
    type(c,'turtle',36,77,320,94,ink,slab);type(c,tag,37,185,320,24,ink,condensed);
    ellipse(c,490,177,64,9,0,blue);
    path(c,'M408 155 L386 151 403 141 412 137 Q414 71 462 60 504 48 534 80 Q551 104 550 128 L573 114 Q588 99 600 111 Q614 125 605 138 601 150 576 153 L549 163 541 181 525 180 524 164 464 168 450 183 431 181 435 165 Z',mint,ink,5);
    path(c,'M414 137 Q422 70 467 65 Q521 46 544 118 L535 139 421 151 Z',ink);
    path(c,'M423 133 Q433 89 453 79 L463 125 Z M464 76 Q491 64 509 74 L506 118 473 123 Z M517 80 Q532 96 537 119 L515 121 Z',lime);
    path(c,'M479 90 L486 96 479 102 M492 104 L499 103',null,ink,3);ellipse(c,599,121,3.4,3.4,0,ink);
  }
  function kitchen(c,tag){
    const ink='#192c42',red='#ed4846',paper='#ffefc9';
    for(let i=0;i<16;i++)for(let j=0;j<2;j++)if((i+j)%2===0)rect(c,i*40,216+j*20,40,20,red);
    maker(c,25,20,ink);type(c,'TEST',22,53,219,50,red,grotesk);type(c,'KITCHEN',19,107,398,76,ink,grotesk);
    type(c,tag,26,193,312,15,red,condensed);
    c.save();c.translate(509,125);c.rotate(-.18);
    path(c,'M-60 8 Q-80 -20 -60 -35 Q-53 -43 -43 -41 Q-37 -68 -12 -63 Q-5 -78 16 -72 Q38 -69 43 -53 Q65 -60 75 -38 Q86 -16 54 4 L50 37 -44 37 Z',paper,ink,5);
    path(c,'M-47 28 L50 24 M-26 -34 Q-13 -21 -18 -10 M22 -41 Q12 -27 20 -17',null,red,4);
    path(c,'M-69 50 Q-11 80 59 42 L78 41 Q71 69 39 78 L32 88 -28 88 -34 77 Q-67 71 -73 59 Z',red,ink,4);c.restore();
    glint(c,592,56,13,red);
  }
  function phones(c,tag){
    const dark='#182344',yellow='#f7e258',ice='#a2f9ec',pink='#ff769a';
    for(let i=0;i<9;i++)rect(c,0,8+i*29,640,1.5,'#35456e');
    maker(c,26,17,ice);type(c,'PHONEGANG',18,51,600,75,yellow,condensed);
    type(c,tag,27,181,308,26,ice,condensed);path(c,'M27 165 L347 165 361 152',null,pink,3);
    for(const [i,x] of [406,480,555].entries()){
      c.save();c.translate(x,177+(i===1?-8:3));c.rotate((i-1)*.16);
      path(c,'M-23 -45 Q-29 -45 -29 -36 L-29 37 Q-29 47 -19 47 L23 47 Q29 46 29 38 L29 -36 Q30 -45 22 -45 Z',[pink,ice,yellow][i],dark,4);
      rect(c,-22,-32,44,62,dark);rect(c,-10,-39,20,2,dark);
      path(c,'M-13 -1 L-7 -2 M7 -2 L13 -3 M-9 9 Q0 16 10 8',null,[pink,ice,yellow][i],3);
      ellipse(c,0,38,3,3,0,dark);c.restore();
    }
  }
  function jeff(c,tag){
    const ink='#28233d',paper='#fff1d2',blue='#527cce',rhubarb='#ed7968';
    for(let i=-2;i<13;i++){c.save();c.translate(i*62,0);c.rotate(.52);rect(c,0,-18,16,46,blue);rect(c,28,-18,16,46,rhubarb);c.restore();}
    maker(c,29,45,ink);type(c,'JEFF',23,81,331,99,ink,grotesk);type(c,tag,30,194,323,24,rhubarb,condensed);
    c.save();c.translate(489,135);c.rotate(-.13);
    path(c,'M-93 -47 L72 -47 89 -33 89 58 -93 58 Z',blue,ink,4);
    path(c,'M-91 45 L-22 -11 M88 45 L19 -12',null,ink,3);
    path(c,'M-91 -46 L-3 15 86 -38',paper,ink,5);
    ellipse(c,-25,-21,3.2,4.6,0,ink);ellipse(c,24,-21,3.2,4.6,0,ink);path(c,'M-11 -10 Q0 0 12 -11',null,ink,2.5);
    c.restore();path(c,'M382 124 L354 124 M380 135 L345 135 M378 146 L362 146',null,rhubarb,3);
  }
  return [
    plate('tracker','Tracker','HUMAN SAYS GO.','#65f6ac','#ffe143',tracker),
    plate('dippin','Dippin','JUST MY TYPE.','#ff93a1','#285dd5',dippin),
    plate('orrery','Orrery','NOTES HAVE GRAVITY.','#eebd71','#181a36',orrery),
    plate('simmer','Simmer','STIR UNTIL EDITED.','#ff9c4e','#d73940',simmer),
    plate('coven','Coven','HOST YOUR OWN HAUNT.','#d4ff87','#552d9c',coven),
    plate('mermaidkit','MermaidKit','GO WITH THE FLOWCHART.','#ff816e','#8be8d5',mermaid),
    plate('smasher','Smasher','PUT DOT IN DRIVE.','#ffce50','#de5733',smasher),
    plate('pulse','Pulse','DEAR DIARY. HI, FEED.','#b8f1ea','#f45798',pulse),
    plate('mammoth','Mammoth','HERD THE GRAPHS.','#f8b14e','#f6d28e',mammoth),
    plate('rodeo','Meme Rodeo','RIDE THE REPOST.','#ffbf58','#da555f',rodeo),
    plate('turtle','Turtle','SHELL SCHOOL.','#cbef92','#a8dfbd',turtle),
    plate('kitchen','Test Kitchen','FORK THE RECIPE.','#ff745c','#fff0cc',kitchen),
    plate('phones','Phonegang','PHONES IN FORMATION.','#a1ffda','#182344',phones),
    plate('jeff','Jeff',"YOU'VE GOT JEFF.",'#f68d78','#fff1d2',jeff)
  ];
})();

export {MTMSponsorArt};
