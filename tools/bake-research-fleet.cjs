const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('node:assert/strict'),cn=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'../src');global.window=global;global.THREE=require(root+'/three.min.js');global.document={createElement:()=>cn.createCanvas(8,8)};
for(const n of ['trucks','software'])vm.runInThisContext(fs.readFileSync(root+'/'+n+'.js','utf8').replace('/*__WASM__*/',fs.readFileSync(root+'/raster.wasm').toString('base64')),{filename:n});
vm.runInThisContext(fs.readFileSync(root+'/fitment-sprites.js','utf8'));
const art=MTMFitmentArt; const W=288,H=216;
function pic(r,scene,{w,h,from,to,fov=32}){
 r.setPixelRatio(1);r.setSize(w,h);const cam=new THREE.PerspectiveCamera(fov,w/h,.1,90);cam.position.set(...from);cam.lookAt(...to);r.render(scene,cam);
 const cv=cn.createCanvas(w,h),ctx=cv.getContext('2d');ctx.drawImage(r.domElement,0,0,w,h);
 const im=ctx.getImageData(0,0,w,h),bg=im.data.slice(0,3);
 for(let i=0;i<im.data.length;i+=4)if(im.data[i]===bg[0]&&im.data[i+1]===bg[1]&&im.data[i+2]===bg[2])im.data[i+3]=0;
 ctx.putImageData(im,0,0);return cv;
}
function data(cv){return cv.toDataURL('image/webp',.87);}
for(let id=4;id<=6;id++){
 const slots=['mux','orrery','soloclaw'],slug=slots[id-4],r=MTMSoftwareRenderer(),scene=new THREE.Scene();scene.background=new THREE.Color('#06f701');
 const sheets=Object.fromEntries(['front','rear'].map(k=>[k,cn.createCanvas(W*3,H*3)])),fit=new Set();const wheels=[];
 for(let susp=0;susp<3;susp++)for(let tire=0;tire<3;tire++){
   const rig=MTMTrucks.make(id,true,{tires:tire,suspension:susp});scene.add(rig.root);
   for(const view of ['front','rear']){
     const front=view==='front',from=front?[7.9,4.65,8.85]:[-.001,4.27,-10.05],to=[0,1.73,0];
     const frame=pic(r,scene,{w:W,h:H,from,to,fov:front?25:26});
     const ctx=sheets[view].getContext('2d');ctx.drawImage(frame,tire*W,susp*H);
     if(front)fit.add(require('crypto').createHash('sha1').update(frame.toBuffer('image/png')).digest('hex'));
   }
   if(susp===1){
     const bare=new THREE.Scene();bare.background=scene.background;const wheel=rig.spins[1].clone(true);bare.add(wheel);
     const wheelPic=pic(r,bare,{w:320,h:294,from:[3,1.05,1.38],to:[0,0,0],fov:32});wheels.push(data(wheelPic));
   }
   scene.remove(rig.root);
 }
 assert.equal(fit.size,9);assert.equal(new Set(wheels).size,3);art.front[id]=data(sheets.front);art.rear[id]=data(sheets.rear);art.wheels[id]=wheels;
 console.log(slug,'complete',fit.size,'distinct settings');
}
fs.writeFileSync(root+'/fitment-sprites.js','/* Race-mesh renders. Columns select tires and rows select suspension. */\nwindow.MTMFitmentArt='+JSON.stringify(art)+';\n');
