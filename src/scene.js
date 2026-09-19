import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {createLuxuryLighting,refinePresentationMaterials} from './lighting';
import {makeCameraPath,samplePath} from './story';
import {createExplorer} from './explorer';

export async function createScene(host,{signal,onProgress,onReady,onFailure,onController,onExploreState,getProgress,getHero,reducedMotion,mobile=false,hotspotLayer}){
 if(signal.aborted)return ()=>{};
 let renderer;
 try{renderer=new THREE.WebGLRenderer({alpha:false,antialias:true,powerPreference:'high-performance'});}
 catch{onFailure('The image tour is ready on this device.');return ()=>{};}
 // Restore the original geometry, antialiasing, resolution and cached shadows on phones.
 renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const element=renderer.domElement;element.tabIndex=-1;element.setAttribute('aria-label','3D project. In Explore, drag to rotate, pinch or wheel to zoom, and use arrow keys to pan.');host.appendChild(element);
 const scene=new THREE.Scene();
 const camera=new THREE.PerspectiveCamera(40,1,.25,1200);
 const lighting=createLuxuryLighting(renderer,scene);
 const modelURL='/assets/SHANGRILA_MASTER_REFINED.glb';
 const diagnostics={profile:mobile?'mobile':'desktop',quality:'original',modelURL,renders:0,pixelRatio:renderer.getPixelRatio(),antialias:true,shadows:2048,paused:false,mode:'guided'};host.__sceneDiagnostics=diagnostics;
 let dead=false,frame=0,last=0,visible=!document.hidden,paused=host.dataset.paused==='true',model,path,explorer,announced=false,progress=getProgress(),heroTime=0;
 const target=new THREE.Vector3(),projected=new THREE.Vector3();
 function invalidate(){if(!dead && path && visible && !paused && !frame)frame=requestAnimationFrame(render);}
 function stop(){cancelAnimationFrame(frame);frame=0;last=0;}
 function setPaused(value){paused=value;diagnostics.paused=value;if(value)stop();else invalidate();}
 function resize(){const {width,height}=host.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();invalidate();}
 const observer=new ResizeObserver(resize);observer.observe(host);resize();
 function disposeModel(){const gs=new Set(),ms=new Set();model?.traverse(o=>{if(o.isMesh){gs.add(o.geometry);for(const m of(Array.isArray(o.material)?o.material:[o.material]))ms.add(m);}});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());model=undefined;}
 function cleanup(){if(dead)return;dead=true;stop();observer.disconnect();document.removeEventListener('visibilitychange',visibility);signal.removeEventListener('abort',cleanup);element.removeEventListener('webglcontextlost',lost);explorer?.dispose();disposeModel();lighting.dispose();renderer.dispose();element.remove();if(host.__sceneDiagnostics===diagnostics)delete host.__sceneDiagnostics;}
 function lost(e){e.preventDefault();onFailure('The image tour is ready to continue.');cleanup();}
 function visibility(){visible=!document.hidden;if(visible)invalidate();else stop();}
 element.addEventListener('webglcontextlost',lost);document.addEventListener('visibilitychange',visibility);signal.addEventListener('abort',cleanup,{once:true});
 function updateHotspots(){
  if(!explorer?.active || !hotspotLayer)return;
  for(const button of hotspotLayer.querySelectorAll('[data-hotspot-id]')){
   projected.copy(explorer.anchors[button.dataset.hotspotId]).project(camera);
   const show=projected.z>-1 && projected.z<1 && Math.abs(projected.x)<.97 && Math.abs(projected.y)<.91;
   button.hidden=!show;button.style.left=`${(projected.x*.5+.5)*100}%`;button.style.top=`${(-projected.y*.5+.5)*100}%`;
  }
 }
 function render(time){
  frame=0;if(dead||paused||!visible)return;
  const elapsed=last?(time-last)/1000:0;if(elapsed && elapsed<1/60-.001){invalidate();return;}last=time;
  const dt=elapsed?Math.min(elapsed,.06):1/60;let moving=false,horizontal;
  if(explorer?.active){moving=explorer.tick(dt);target.copy(explorer.target);horizontal=explorer.fov;}
  else{
   const desired=getProgress();progress=reducedMotion?desired:THREE.MathUtils.damp(progress,desired,5,dt);if(Math.abs(progress-desired)<.0005)progress=desired;
   const shot=samplePath(path,progress);camera.position.fromArray(shot.position);target.fromArray(shot.target);horizontal=shot.fov;moving=progress!==desired;
   // One subtle opening drift, then stop entirely when the visitor rests.
   if(!reducedMotion && getHero() && heroTime<4){heroTime+=dt;camera.position.x+=Math.sin(Math.min(1,heroTime/4)*Math.PI)*1.2;moving=true;}
   camera.lookAt(target);
  }
  const fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(horizontal)/2)/Math.min(camera.aspect,1.6)));
  if(Math.abs(camera.fov-fov)>.001){camera.fov=fov;camera.updateProjectionMatrix();}
  renderer.render(scene,camera);updateHotspots();diagnostics.renders++;diagnostics.triangles=renderer.info.render.triangles;diagnostics.drawCalls=renderer.info.render.calls;diagnostics.camera=camera.position.toArray();diagnostics.target=target.toArray();diagnostics.mode=explorer?.mode||'guided';
  if(!announced){announced=true;onReady();}
  if(moving)invalidate();else last=0;
 }
 try{
  const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const [buffer,cameras]=await Promise.all([
   fetch(modelURL,{signal}).then(async r=>{if(!r.ok)throw Error('model load');const total=Number(r.headers.get('content-length')),reader=r.body.getReader(),chunks=[];let loaded=0;while(true){const {done,value}=await reader.read();if(done)break;chunks.push(value);loaded+=value.length;if(!dead)onProgress(total?Math.min(.9,loaded/total*.9):.3);}const bytes=new Uint8Array(loaded);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return bytes.buffer;}),
   fetch('/assets/cameras.json',{signal}).then(r=>{if(!r.ok)throw Error('camera load');return r.json();})
  ]);
  if(dead)return cleanup;
  model=(await loader.parseAsync(buffer,'/assets/')).scene;if(dead){disposeModel();return cleanup;}
  path=makeCameraPath(cameras);
  refinePresentationMaterials(model,scene.environment);
  scene.add(model);renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
  explorer=createExplorer(camera,element,{model,cameras,invalidate,reducedMotion,onState:state=>{diagnostics.mode=state;element.tabIndex=state==='guided'?-1:0;onExploreState(state);}});
  diagnostics.collisionBoxes=explorer.collisionBoxes.map(b=>({min:b.min.toArray(),max:b.max.toArray()}));
  onController({invalidate,setPaused,enterExplore:()=>{setPaused(false);explorer.enter(samplePath(path,progress));},continueTour:()=>{progress=getProgress();explorer.resume(samplePath(path,progress));},resetView:()=>explorer.reset(),focusHotspot:id=>explorer.focus(id)});
  progress=getProgress();onProgress(1);invalidate();
 }catch(error){if(!dead && error.name!=='AbortError'){onFailure('Continue with the image tour. You can try 3D again.');cleanup();}}
 return cleanup;
}
