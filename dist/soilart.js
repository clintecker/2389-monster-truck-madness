/* The visible mud uses exactly the same wheel-compressed height samples as
   suspension contact. Only patches with a new revision upload any vertices. */
import { MTMWorld } from './world.js';

const MTMSoilArt = (() => {
  function attach(world,c,soil){
    const T=THREE,{cols,rows,uplift}=MTMWorld;
    const mat=new T.MeshStandardMaterial({map:world.children[1].material.map,vertexColors:true,roughness:.66,metalness:.08,side:T.DoubleSide,transparent:true,depthWrite:true,polygonOffset:true,polygonOffsetFactor:-1});
    const field=soil.map(p=>{
      const count=cols*rows,pos=new Float32Array(count*3),color=new Float32Array(count*4),uv=new Float32Array(count*2),base=new Float32Array(count),coords=[],ix=[];
      for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
        const k=j*cols+i,u=2*i/(cols-1)-1,v=2*j/(rows-1)-1;
        const x=p.x+p.dz*u*p.w+p.dx*v*p.l,z=p.z-p.dx*u*p.w+p.dz*v*p.l;
        pos[k*3]=x;pos[k*3+2]=z;base[k]=c.ground(x,z)+.20;pos[k*3+1]=base[k]+uplift(p,u,v,0);
        uv[k*2]=.5+u*p.w/c.width;uv[k*2+1]=(p.s+v*p.l)/21;
        coords.push([u,v]);color[k*4+3]=Math.min(1,Math.max(0,(1-Math.max(Math.abs(u),Math.abs(v)))*4));
        if(i<cols-1&&j<rows-1)ix.push(k,k+cols,k+1,k+1,k+cols,k+cols+1);
      }
      const geo=new T.BufferGeometry();geo.userData.followGround=true;geo.userData.softSoil=true;
      geo.setAttribute('position',new T.BufferAttribute(pos,3).setUsage(T.DynamicDrawUsage));geo.setAttribute('color',new T.BufferAttribute(color,4).setUsage(T.DynamicDrawUsage));
      geo.setAttribute('uv',new T.BufferAttribute(uv,2));geo.setIndex(ix);geo.computeVertexNormals();geo.computeBoundingSphere();
      const mesh=new T.Mesh(geo,mat);mesh.receiveShadow=true;mesh.renderOrder=0;world.add(mesh);
      return {p,geo,coords,base,old:null,version:-1};
    });
    return {update(state){
      for(let i=0;i<field.length;i++){
        const f=field[i],q=state[i];if(f.old===q.depth&&f.version===q.version)continue;
        const pos=f.geo.attributes.position,color=f.geo.attributes.color;
        for(let j=0;j<q.depth.length;j++){
          const [u,v]=f.coords[j],t=q.depth[j]/255;
          pos.setY(j,f.base[j]+uplift(f.p,u,v,t));
          const shade=.76-.46*t; color.setXYZ(j,shade*.91,shade*.91,shade);
        }
        pos.needsUpdate=true;color.needsUpdate=true;f.geo.computeVertexNormals();f.old=q.depth;f.version=q.version;
      }
    }};
  }
  return {attach};
})();

export {MTMSoilArt};
