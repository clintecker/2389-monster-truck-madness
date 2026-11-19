// Allocation-free, perspective-correct triangle rasterizer for the software path.
// Source vertices contain position, normal, UV and RGBA. Projected vertices also
// retain camera coordinates so geometry crossing the near plane can be clipped.
let width:i32=1,height:i32=1,fb:usize=0,db:usize=0;
let focal:f32=1,fogR:f32=190,fogG:f32=190,fogB:f32=180,density:f32=.003;
let texture:usize=0,flags:i32=0;
const NEAR:f32=.20, IN:i32=48, OUT:i32=52;
@inline function f(p:usize,o:i32):f32{return load<f32>(p+<usize>o);}
@inline function put(p:usize,o:i32,v:f32):void{store<f32>(p+<usize>o,v);}
@inline function byte(v:f32):u32{return <u32>min<f32>(255,max<f32>(0,v));}
@inline function rgba(r:f32,g:f32,b:f32):u32{return 0xff000000|(byte(b)<<16)|(byte(g)<<8)|byte(r);}
export function begin(w:i32,h:i32,pixels:usize,depth:usize,focus:f32,red:f32,green:f32,blue:f32,haze:f32,bg:u32):void{
 width=w;height=h;fb=pixels;db=depth;focal=focus;fogR=red;fogG=green;fogB=blue;density=haze;
 memory.fill(db,0,<usize>(w*h*4));for(let i=0;i<w*h;i++)store<u32>(fb+(<usize>i<<2),bg);
}
@inline function project(p:usize):void{const iz:f32=1/f(p,8);put(p,12,<f32><f32>width*.5+f(p,0)*focal*iz);put(p,16,<f32><f32>height*.5-f(p,4)*focal*iz);put(p,20,iz);}
@inline function blend(at:usize,r:f32,g:f32,b:f32,a:f32):void{if(a<.995){const old=load<u32>(at),inv:f32=1-a;r=r*a+<f32>(old&255)*inv;g=g*a+<f32>((old>>8)&255)*inv;b=b*a+<f32>((old>>16)&255)*inv;}store<u32>(at,rgba(r,g,b));}
function triangle(a:usize,b:usize,c:usize):void{
 const ax=f(a,12),ay=f(a,16),bx=f(b,12),by=f(b,16),cx=f(c,12),cy=f(c,16);
 if((ax<0&&bx<0&&cx<0)||(ax><f32>width&&bx><f32>width&&cx><f32>width)||(ay<0&&by<0&&cy<0)||(ay><f32>height&&by><f32>height&&cy><f32>height))return;
 const xx=bx-ax,xy=by-ay,yx=cx-ax,yy=cy-ay,area=xx*yy-xy*yx;
 if(abs(area)<.09||((flags&128)!=0&&area>0)||((flags&256)!=0&&area<0))return;
 const x0=max<i32>(0,<i32>ceil(min<f32>(ax,min<f32>(bx,cx))-.5)),x1=min<i32>(width-1,<i32>floor(max<f32>(ax,max<f32>(bx,cx))-.5));
 const y0=max<i32>(0,<i32>ceil(min<f32>(ay,min<f32>(by,cy))-.5)),y1=min<i32>(height-1,<i32>floor(max<f32>(ay,max<f32>(by,cy))-.5));
 if(x0>x1||y0>y1)return;
 const inv:f32=1/area, dbx=yy*inv,dby=-yx*inv,dcx=-xy*inv,dcy=xx*inv;
 const az=f(a,20),bz=f(b,20),cz=f(c,20),bd=bz-az,cd=cz-az;
 const au=f(a,24),av=f(a,28),bu=f(b,24),bv=f(b,28),cu=f(c,24),cv=f(c,28);
 const u0=au*az,v0=av*az,ub=bu*bz-u0,vb=bv*bz-v0,uc=cu*cz-u0,vc=cv*cz-v0;
 const r0=f(a,32),g0=f(a,36),b0=f(a,40),rb=f(b,32)-r0,gb=f(b,36)-g0,bb=f(b,40)-b0,rc=f(c,32)-r0,gc=f(c,36)-g0,bc=f(c,40)-b0;
 const al0=f(a,44),alb=f(b,44)-al0,alc=f(c,44)-al0,fg0=f(a,48),fgb=f(b,48)-fg0,fgc=f(c,48)-fg0;
 let tex:usize=0,tw:i32=1,th:i32=1;
 if(texture!=0){const baseW=load<i32>(texture+4),baseH=load<i32>(texture+8);let mip=0,foot=abs((bu-au)*(cv-av)-(bv-av)*(cu-au))*<f32>(baseW*baseH)/abs(area);while(foot>2.5&&mip<8&&load<u32>(texture+<usize>((mip+1)*12))!=0){mip++;foot*=.25;}const ptr=texture+<usize>(mip*12);tex=<usize>load<u32>(ptr);tw=load<i32>(ptr+4);th=load<i32>(ptr+8);}
 const offset:f32=(flags&64)!=0?.000025:0;
 for(let y=y0;y<=y1;y++){
  const sx=<f32>x0+.5-ax,sy=<f32>y+.5-ay;let wb=sx*dbx+sy*dby,wc=sx*dcx+sy*dcy;let at=<usize>(y*width+x0)<<2;
  for(let x=x0;x<=x1;x++,at+=4,wb+=dbx,wc+=dcx){
   if(wb<-.00002||wc<-.00002||wb+wc>1.00002)continue;
   const iz=az+wb*bd+wc*cd;if(iz+offset<=load<f32>(db+at))continue;
   let red=r0+wb*rb+wc*rc,green=g0+wb*gb+wc*gc,blue=b0+wb*bb+wc*bc,alpha=al0+wb*alb+wc*alc;
   if(tex!=0){let u=(u0+wb*ub+wc*uc)/iz,v=(v0+wb*vb+wc*vc)/iz;u=(flags&16)!=0?u-Mathf.floor(u):min<f32>(.999998,max<f32>(0,u));v=(flags&32)!=0?v-Mathf.floor(v):min<f32>(.999998,max<f32>(0,v));
    const tx=min<i32>(tw-1,<i32>(u*<f32>tw)),ty=th-1-min<i32>(th-1,<i32>(v*<f32>th)),color=load<u32>(tex+(<usize>(ty*tw+tx)<<2));red*=<f32>(color&255)/255;green*=<f32>((color>>8)&255)/255;blue*=<f32>((color>>16)&255)/255;alpha*=<f32>(color>>24)/255;
   }
   if(alpha<.018)continue;const fog=fg0+wb*fgb+wc*fgc;red+=(fogR-red)*fog;green+=(fogG-green)*fog;blue+=(fogB-blue)*fog;
   blend(fb+at,red,green,blue,alpha);if((flags&8)==0)store<f32>(db+at,iz+offset);
  }
 }
}
function clipped(a:usize,b:usize,c:usize):void{
 let prev=c,num=0,inter=0;for(let k=0;k<3;k++){const cur=k==0?a:k==1?b:c,pd=f(prev,8),qd=f(cur,8);
  if((pd>=NEAR)!=(qd>=NEAR)){const v=<usize>(4096+inter*64);inter++;const t=(NEAR-pd)/(qd-pd);for(let off=0;off<OUT;off+=4)put(v,off,f(prev,off)+(f(cur,off)-f(prev,off))*t);put(v,8,NEAR);project(v);store<u32>(<usize>(4352+num++*4),v);}
  if(qd>=NEAR)store<u32>(<usize>(4352+num++*4),cur);prev=cur;
 }
 for(let k=1;k+1<num;k++)triangle(load<u32>(4352),load<u32>(<usize>(4352+k*4)),load<u32>(<usize>(4356+k*4)));
}
export function mesh(src:usize,idx:usize,tmp:usize,nv:i32,ni:i32,m:usize,tex:usize,fl:i32,mr:f32,mg:f32,mb:f32,opacity:f32):void{
 texture=tex;flags=fl;const lx=f(m,64),ly=f(m,68),lz=f(m,72),ux=f(m,76),uy=f(m,80),uz=f(m,84);
 for(let i=0;i<nv;i++){
  const p=src+<usize>(i*IN),q=tmp+<usize>(i*OUT),x=f(p,0),y=f(p,4),z=f(p,8);
  const vx=f(m,0)*x+f(m,16)*y+f(m,32)*z+f(m,48),vy=f(m,4)*x+f(m,20)*y+f(m,36)*z+f(m,52),vz=-(f(m,8)*x+f(m,24)*y+f(m,40)*z+f(m,56));put(q,0,vx);put(q,4,vy);put(q,8,vz);if(vz>=NEAR)project(q);
  const nx=f(p,12),ny=f(p,16),nz=f(p,20);let shade:f32=1;
  if((flags&1)==0){shade=.65+.13*(nx*ux+ny*uy+nz*uz)+.35*max<f32>(0,nx*lx+ny*ly+nz*lz);}
  put(q,24,f(p,24));put(q,28,f(p,28));put(q,32,f(p,32)*mr*shade);put(q,36,f(p,36)*mg*shade);put(q,40,f(p,40)*mb*shade);put(q,44,f(p,44)*opacity);
  const haze=max<f32>(0,vz)*density,mag=haze*haze;put(q,48,(flags&2)!=0?0:min<f32>(.998,mag/(1+mag*.71)));
 }
 for(let i=0;i+2<ni;i+=3){const a=tmp+<usize>(load<u32>(idx+<usize>(i*4))*OUT),b=tmp+<usize>(load<u32>(idx+<usize>((i+1)*4))*OUT),c=tmp+<usize>(load<u32>(idx+<usize>((i+2)*4))*OUT);const z1=f(a,8),z2=f(b,8),z3=f(c,8);if(z1>=NEAR&&z2>=NEAR&&z3>=NEAR)triangle(a,b,c);else if(z1>=NEAR||z2>=NEAR||z3>=NEAR)clipped(a,b,c);}
}
export function dust(x:f32,y:f32,iz:f32,r:f32,alpha:f32,cr:f32,cg:f32,cb:f32):void{
 if(r<.5||alpha<.01)return;const inv:f32=1/(r*r);for(let j=max<i32>(0,<i32>(y-r));j<=min<i32>(height-1,<i32>(y+r));j++)for(let i=max<i32>(0,<i32>(x-r));i<=min<i32>(width-1,<i32>(x+r));i++){const dd=(<f32>i-x)*(<f32>i-x)+(<f32>j-y)*(<f32>j-y),k:f32=1-dd*inv;if(k<=0)continue;const o=<usize>(j*width+i)<<2;if(iz>load<f32>(db+o))blend(fb+o,cr,cg,cb,alpha*k*k);}
}
