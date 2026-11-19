/* A WebAssembly depth-buffered renderer consumes the same Three.js geometries,
   transforms, texture atlases and cameras when WebGL is unavailable. */
function MTMSoftwareRenderer(){
  const T=THREE, bytes=Uint8Array.from(atob('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'),c=>c.charCodeAt(0));
  const wasm=new WebAssembly.Instance(new WebAssembly.Module(bytes),{}).exports,mem=wasm.memory;
  let heap=65536,tmp=0,tmpCapacity=0,pixel=0,depth=0,frameCap=0,image=null,ratio=.58,w=1,h=1;
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{alpha:false}),materialColors=new WeakMap();
  let geometries=new WeakMap(),textures=new WeakMap();
  const pv=new T.Matrix4(),mview=new T.Matrix4(),inst=new T.Matrix4(),model=new T.Matrix4(),rot=new T.Matrix4(),frustum=new T.Frustum(),ball=new T.Sphere();
  const light=new T.Vector3(-46,65,-34).normalize(),lightLocal=new T.Vector3(),upLocal=new T.Vector3(),ref=new T.Vector3(),col=new T.Color();
  let nightTint=[1,1,1];
  const gamma=x=>x<=.0031308?12.92*x:1.055*x**(1/2.4)-.055;
  function alloc(bytes){const ptr=(heap+15)&~15;heap=ptr+bytes;if(heap>mem.buffer.byteLength)mem.grow(Math.ceil((heap-mem.buffer.byteLength)/65536)+8);return ptr;}
  function geometry(geo){const cached=geometries.get(geo);
    if(cached){
      // The lamps follow ground height; performers can articulate in all
      // three dimensions. Both keep their indices, UVs and color data intact.
      if((geo.userData.followGround||geo.userData.animatedPositions)&&cached.version!==geo.attributes.position.version){
        const positions=geo.attributes.position,values=new Float32Array(mem.buffer,cached.src,cached.nv*12);
        const normals=geo.attributes.normal,colors=geo.attributes.color;
        for(let i=0;i<cached.nv;i++){
          const k=i*12;values[k+1]=positions.getY(i);
          if(geo.userData.animatedPositions){values[k]=positions.getX(i);values[k+2]=positions.getZ(i);}
          if(geo.userData.animatedColors){values[k+8]=255*gamma(colors.getX(i));values[k+9]=255*gamma(colors.getY(i));values[k+10]=255*gamma(colors.getZ(i));}
          if(geo.userData.softSoil){
            values[k+3]=normals.getX(i);values[k+4]=normals.getY(i);values[k+5]=normals.getZ(i);
            values[k+8]=255*gamma(colors.getX(i));values[k+9]=255*gamma(colors.getY(i));values[k+10]=255*gamma(colors.getZ(i));
          }
        }
        cached.version=positions.version;
      }
      return cached;
    }
    const p=geo.attributes.position,n=geo.attributes.normal,u=geo.attributes.uv,c=geo.attributes.color,idx=geo.index,nv=p.count,ni=idx?idx.count:nv;
    const src=alloc(nv*48),ip=alloc(ni*4),values=new Float32Array(mem.buffer,src,nv*12),indices=new Uint32Array(mem.buffer,ip,ni);
    for(let i=0;i<nv;i++){const o=i*12;values[o]=p.getX(i);values[o+1]=p.getY(i);values[o+2]=p.getZ(i);values[o+3]=n?n.getX(i):0;values[o+4]=n?n.getY(i):1;values[o+5]=n?n.getZ(i):0;values[o+6]=u?u.getX(i):0;values[o+7]=u?u.getY(i):0;values[o+8]=c?255*gamma(c.getX(i)):255;values[o+9]=c?255*gamma(c.getY(i)):255;values[o+10]=c?255*gamma(c.getZ(i)):255;values[o+11]=c&&c.itemSize===4?c.getW(i):1;}
    if(idx)indices.set(idx.array);else for(let i=0;i<ni;i++)indices[i]=i;
    if(!geo.boundingSphere)geo.computeBoundingSphere();const data={src,ip,nv,ni,version:p.version};geometries.set(geo,data);return data;
  }
  const mipSurfaces=Array.from({length:9},()=>document.createElement('canvas'));
  function texture(t){if(!t?.image)return 0;if(textures.has(t))return textures.get(t);const desc=alloc(9*12),im=t.image,fac=Math.min(1,1024/Math.max(im.width,im.height));let sw=Math.max(1,Math.round(im.width*fac)),sh=Math.max(1,Math.round(im.height*fac));
    let last=im;for(let i=0;i<9;i++){const c=mipSurfaces[i];if(c.width!==sw)c.width=sw;if(c.height!==sh)c.height=sh;const g=c.getContext('2d',{willReadFrequently:true});g.clearRect(0,0,sw,sh);g.drawImage(last,0,0,sw,sh);const data=g.getImageData(0,0,sw,sh).data,ptr=alloc(data.length);new Uint8Array(mem.buffer,ptr,data.length).set(data);new Uint32Array(mem.buffer,desc+i*12,3).set([ptr,sw,sh]);if(sw===1&&sh===1)break;last=c;sw=Math.max(1,sw>>1);sh=Math.max(1,sh>>1);}
    textures.set(t,desc);return desc;
  }
  function setSize(cssW,cssH){const s=Math.min(ratio,980/cssW,675/cssH);w=Math.max(2,Math.round(cssW*s));h=Math.max(2,Math.round(cssH*s));if(canvas.width!==w||canvas.height!==h||!image){canvas.width=w;canvas.height=h;image=ctx.createImageData(w,h);}if(w*h>frameCap){frameCap=w*h;pixel=alloc(frameCap*4);depth=alloc(frameCap*4);}}
  function material(m){if(materialColors.has(m)&&!m.userData.dynamicColor)return materialColors.get(m);const c=m.color||new T.Color(0xffffff),res=[gamma(c.r),gamma(c.g),gamma(c.b)];materialColors.set(m,res);return res;}
  function paint(o,matrix,m,camera,tint=null){
    const ge=o.geometry,d=geometry(ge),tex=texture(m.map);if(d.nv>tmpCapacity){tmpCapacity=Math.max(d.nv,tmpCapacity*1.4|0);tmp=alloc(tmpCapacity*52);}
    mview.multiplyMatrices(camera.matrixWorldInverse,matrix);rot.extractRotation(matrix).transpose();lightLocal.copy(light).transformDirection(rot);upLocal.set(0,1,0).transformDirection(rot);
    const ptr=8192,values=new Float32Array(mem.buffer,ptr,22);values.set(mview.elements);values.set([lightLocal.x,lightLocal.y,lightLocal.z,upLocal.x,upLocal.y,upLocal.z],16);
    const flags=(m.isMeshBasicMaterial?1:0)|(!m.fog?2:0)|(m.transparent?4:0)|(!m.depthWrite?8:0)|(m.map?.wrapS===T.RepeatWrapping?16:0)|(m.map?.wrapT===T.RepeatWrapping?32:0)|(m.polygonOffset?64:0)|(m.side===T.FrontSide?128:m.side===T.BackSide?256:0),k=material(m);
    wasm.mesh(d.src,d.ip,tmp,d.nv,d.ni,ptr,tex,flags,k[0]*(m.isMeshBasicMaterial?1:nightTint[0])*(tint?gamma(tint.r):1),k[1]*(m.isMeshBasicMaterial?1:nightTint[1])*(tint?gamma(tint.g):1),k[2]*(m.isMeshBasicMaterial?1:nightTint[2])*(tint?gamma(tint.b):1),m.opacity);
  }
  function render(scene,camera){nightTint=scene.userData.softwareTint||[1,1,1];scene.updateMatrixWorld();camera.updateMatrixWorld();pv.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(pv);
    const fog=scene.fog,fc=fog?.color||scene.background||new T.Color('#abae9e'),bg=scene.background?.isColor?scene.background:fc,focus=h/(2*Math.tan(camera.fov*Math.PI/360));
    wasm.begin(w,h,pixel,depth,focus,gamma(fc.r)*255,gamma(fc.g)*255,gamma(fc.b)*255,fog?.density||0,((255<<24)|(Math.round(gamma(bg.b)*255)<<16)|(Math.round(gamma(bg.g)*255)<<8)|Math.round(gamma(bg.r)*255))>>>0);
    const opaque=[],alpha=[],dust=[];scene.traverseVisible(o=>{if(o.isPoints){dust.push(o);return;}if(!o.isMesh||!o.material)return;if(o.frustumCulled&&!frustum.intersectsObject(o))return;(o.material.transparent?alpha:opaque).push(o);});// Paint foreground solids before the terrain and sky to reject covered pixels early.
    const layer=o=>o.renderOrder<0?3:o.userData.groundSheet?2:o.geometry.type==='PlaneGeometry'&&o.geometry.parameters.width>=40?2:0;
    opaque.sort((a,b)=>layer(a)-layer(b));alpha.sort((a,b)=>a.renderOrder-b.renderOrder);
    for(const o of [...opaque,...alpha]){const m=o.material;if(Array.isArray(m))continue;if(o.isInstancedMesh){if(!o.geometry.boundingSphere)o.geometry.computeBoundingSphere();for(let i=0;i<o.count;i++){o.getMatrixAt(i,inst);model.multiplyMatrices(o.matrixWorld,inst);ball.copy(o.geometry.boundingSphere).applyMatrix4(model);if(!frustum.intersectsSphere(ball))continue;let tint=null;if(o.instanceColor){o.getColorAt(i,col);tint=col;}paint(o,model,m,camera,tint);}}else paint(o,o.matrixWorld,m,camera);}
    for(const o of dust){const ge=o.geometry,ps=ge.attributes.position,al=ge.attributes.opacity,sz=ge.attributes.pSize,co=o.material.uniforms?.color?.value;if(!al||!sz||!co)continue;const cr=gamma(co.r)*255,cg=gamma(co.g)*255,cb=gamma(co.b)*255;for(let i=0;i<ps.count;i++){const a=al.getX(i);if(a<.014)continue;ref.fromBufferAttribute(ps,i).applyMatrix4(camera.matrixWorldInverse);if(ref.z>-.2)continue;const iz=-1/ref.z,rr=Math.min(52,sz.getX(i)*focus*iz*.52);wasm.dust(w*.5+ref.x*focus*iz,h*.5-ref.y*focus*iz,iz,rr,a,cr,cg,cb);}}
    image.data.set(new Uint8ClampedArray(mem.buffer,pixel,w*h*4));ctx.putImageData(image,0,0);
  }
  return {resetCourse(){
    // Geometry and texture pointers are scoped to this course. Reuse WASM
    // pages and reserve fresh frame buffers before uploading any new meshes.
    geometries=new WeakMap();textures=new WeakMap();heap=65536;tmp=0;tmpCapacity=0;
    frameCap=w*h;pixel=alloc(frameCap*4);depth=alloc(frameCap*4);
  },domElement:canvas,isSoftware:true,shadowMap:{enabled:false},setPixelRatio(v){ratio=v;},setSize,render};
}

export {MTMSoftwareRenderer};
