import {Box3,MathUtils,Ray,Spherical,Vector3} from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {exploreView,exploreLimits,hotspots} from './data/hotspots';
import {sourceView} from './story';

export function createExplorer(camera,element,{model,cameras,invalidate,onState,reducedMotion}){
 const limits=exploreLimits,controls=new OrbitControls(camera);
 Object.assign(controls,{enabled:false,enableDamping:true,dampingFactor:.085,enableRotate:true,enableZoom:true,enablePan:true,screenSpacePanning:false,rotateSpeed:.55,zoomSpeed:.7,panSpeed:.65,minDistance:limits.minDistance,maxDistance:limits.maxDistance,minPolarAngle:limits.minPolarAngle,maxPolarAngle:limits.maxPolarAngle});
 const minTarget=new Vector3(...limits.targetMin),maxTarget=new Vector3(...limits.targetMax);
 const collisionBoxes=[],anchors={};
 model.updateMatrixWorld(true);
 for(const item of hotspots){
  const box=new Box3();
  model.traverse(o=>{if(o.name.startsWith(item.group))box.union(new Box3().setFromObject(o));});
  const anchor=box.isEmpty()?new Vector3(...item.anchor):box.getCenter(new Vector3());
  if(!box.isEmpty())anchor.y=box.max.y+1.5;
  anchors[item.id]=anchor;
  if(item.id!=='pool' && !box.isEmpty())collisionBoxes.push(box.expandByScalar(1.5));
 }
 let mode='guided',transition=null,connected=false,horizontalFov=exploreView.fov;
 const priorPosition=new Vector3(),priorTarget=new Vector3(),delta=new Vector3(),hit=new Vector3(),ray=new Ray();
 const report=value=>{mode=value;onState(value);};
 function disconnect(){if(connected){controls.disconnect();connected=false;}controls.enabled=false;}
 function connect(){
  controls.enableDamping=false;controls.update();controls.enableDamping=true;
  if(!connected){controls.connect(element);controls.listenToKeyEvents(element);connected=true;}
  controls.enabled=true;
 }
 controls.addEventListener('change',invalidate);
 controls.addEventListener('start',invalidate);
 function safeView(view){
  const target=new Vector3(...view.target).clamp(minTarget,maxTarget),position=new Vector3(...view.position);
  delta.copy(position).sub(target);
  if(delta.length()<limits.minDistance)position.copy(target).add(delta.setLength(limits.minDistance));
  if(delta.length()>limits.maxDistance)position.copy(target).add(delta.setLength(limits.maxDistance));
  const spherical=new Spherical().setFromVector3(position.clone().sub(target));
  spherical.phi=MathUtils.clamp(spherical.phi,limits.minPolarAngle,limits.maxPolarAngle);
  position.copy(target).add(new Vector3().setFromSpherical(spherical));
  position.y=Math.max(limits.minHeight,position.y);
  for(const box of collisionBoxes)if(box.containsPoint(position))position.y=box.max.y+4;
  return {position,target,fov:view.fov};
 }
 function animate(view,nextMode,finish){
  disconnect();
  const destination=nextMode==='returning'?{position:new Vector3(...view.position),target:new Vector3(...view.target),fov:view.fov}:safeView(view);
  transition={from:camera.position.clone(),fromTarget:controls.target.clone(),fromFov:horizontalFov,...destination,elapsed:0,duration:reducedMotion?0:1.25,finish};
  // Travel above source-derived building boxes before descending to a focus view.
  transition.clearance=Math.max(transition.from.y,destination.position.y,...collisionBoxes.map(b=>b.max.y+10));
  report(nextMode);invalidate();
 }
 function enter(view){
  if(mode!=='guided')return;
  controls.target.fromArray(view.target);horizontalFov=view.fov;
  animate(exploreView,'entering',()=>{connect();report('explore');element.focus({preventScroll:true});});
 }
 function resume(view){if(mode==='guided')return;animate(view,'returning',()=>report('guided'));}
 function reset(){if(mode==='guided')return;animate(exploreView,'resetting',()=>{connect();report('explore');});}
 function focus(id){
  const item=hotspots.find(h=>h.id===id);if(!item || mode==='guided')return;
  animate(sourceView(cameras,item.camera,item.distance),'focusing',()=>{connect();report('explore');});
 }
 function tick(dt){
  if(transition){
   const t=transition;t.elapsed+=dt;
   const u=t.duration?Math.min(1,t.elapsed/t.duration):1;
   const ease=x=>{x=MathUtils.clamp(x,0,1);return x*x*(3-2*x);};
   camera.position.copy(t.from).lerp(t.position,ease((u-.22)/.56));
   camera.position.y=u<.22?MathUtils.lerp(t.from.y,t.clearance,ease(u/.22)):u>.78?MathUtils.lerp(t.clearance,t.position.y,ease((u-.78)/.22)):t.clearance;
   controls.target.copy(t.fromTarget).lerp(t.target,ease(u));
   horizontalFov=MathUtils.lerp(t.fromFov,t.fov,ease(u));camera.lookAt(controls.target);
   if(u===1){transition=null;t.finish();}
   return true;
  }
  if(mode==='guided')return false;
  priorPosition.copy(camera.position);priorTarget.copy(controls.target);
  const changed=controls.update(dt);
  delta.copy(controls.target);controls.target.clamp(minTarget,maxTarget);delta.sub(controls.target);camera.position.sub(delta);
  camera.position.y=Math.max(limits.minHeight,camera.position.y);
  delta.copy(camera.position).sub(priorPosition);
  const distance=delta.length();ray.set(priorPosition,delta.normalize());
  const blocked=collisionBoxes.some(box=>box.containsPoint(camera.position) || (distance>.0001 && ray.intersectBox(box,hit) && hit.distanceTo(priorPosition)<=distance));
  if(blocked){camera.position.copy(priorPosition);controls.target.copy(priorTarget);}
  camera.lookAt(controls.target);
  return changed;
 }
 return {enter,resume,reset,focus,tick,anchors,collisionBoxes,get active(){return mode!=='guided';},get mode(){return mode;},get fov(){return horizontalFov;},get target(){return controls.target;},dispose(){disconnect();controls.dispose();}};
}
