/* Physics advances in fixed ticks. Keep the two endpoints around the render
   instant so trucks, tires and their chase cameras see a single smooth pose. */
const MTMMotion=(()=>{
  const step=1/60;
  const channels=['x','y','z','pitch','roll','bPitch','bRoll','steer','wheel','bounce','speed','wheelspin','rpm'];
  function mix(previous,current,t,out){
    // Recoveries teleport. Interpolating across the gap would drive through the map.
    if(previous.poseEpoch!==current.poseEpoch)t=1;
    for(const key of channels){
      const a=previous[key]??0,b=current[key]??0;
      out[key]=a+(b-a)*t;
    }
    const turn=current.yaw-previous.yaw;
    out.yaw=previous.yaw+Math.atan2(Math.sin(turn),Math.cos(turn))*t;
    return out;
  }
  function track(game){
    const vehicles=[game.p,...game.ai];
    const previous=vehicles.map(()=>({})),view=vehicles.map(v=>Object.create(v));
    function beforeStep(){
      for(let i=0;i<vehicles.length;i++){
        const p=previous[i],v=vehicles[i];p.yaw=v.yaw;p.poseEpoch=v.poseEpoch;
        for(const key of channels)p[key]=v[key]??0;
      }
    }
    function at(fraction){
      const t=Math.min(1,Math.max(0,fraction));
      for(let i=0;i<vehicles.length;i++)mix(previous[i],vehicles[i],t,view[i]);
      return view;
    }
    beforeStep();return {beforeStep,at};
  }
  return {step,track,mix};
})();

export {MTMMotion};
