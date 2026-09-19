import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { makeCameraPath, samplePath } from './story';

export async function createScene(host, { signal, onProgress, onReady, onFailure, onController, getProgress, getClosing, reducedMotion, mobile=false }) {
  if(signal.aborted)return () => {};
  let renderer;
  try { renderer=new THREE.WebGLRenderer({alpha:false,antialias:!mobile,powerPreference:'high-performance'}); }
  catch { onFailure('This device is best experienced in our image tour.'); return () => {}; }
  const scene=new THREE.Scene();
  const day=new THREE.Color('#d9ddd3'), dusk=new THREE.Color('#525c66');
  scene.background=day.clone();scene.fog=new THREE.Fog(day,230,650);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,mobile?1:1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
  renderer.shadowMap.enabled=!mobile;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);
  const camera=new THREE.PerspectiveCamera(40,1,.12,1200);
  const pmrem=new THREE.PMREMGenerator(renderer), room=new RoomEnvironment();
  const environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;scene.environmentIntensity=.35;
  room.dispose();pmrem.dispose();
  const hemi=new THREE.HemisphereLight('#fff4dc','#66765f',1.4);scene.add(hemi);
  const sun=new THREE.DirectionalLight('#fff1d3',2.3);sun.position.set(180,160,-25);sun.target.position.set(85,0,-65);
  sun.castShadow=!mobile;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-115,right:115,top:115,bottom:-115,near:1,far:450});
  sun.shadow.normalBias=.045;sun.shadow.bias=-.0002;scene.add(sun,sun.target);
  const fill=new THREE.DirectionalLight('#d9e6ff',1);fill.position.set(20,50,-140);scene.add(fill);
  const modelURL=mobile?'/assets/SHANGRILA_MOBILE.glb':'/assets/SHANGRILA_MASTER_REFINED.glb';
  const diagnostics={profile:mobile?'mobile':'desktop',modelURL,renders:0,pixelRatio:renderer.getPixelRatio(),paused:false,triangles:0,drawCalls:0};
  host.__sceneDiagnostics=diagnostics;
  let model, frame=0, dead=false, visible=!document.hidden, paused=host.dataset.paused==='true', path, last=0, frameSum=0, frameCount=0, announced=false;
  let progress=getProgress(),closing=getClosing()?1:0;
  const target=new THREE.Vector3();
  function invalidate(){
    if(dead || !path || !visible || paused || frame)return;
    frame=requestAnimationFrame(render);
  }
  function stop(){cancelAnimationFrame(frame);frame=0;last=0;frameSum=0;frameCount=0;}
  function setPaused(value){paused=value;diagnostics.paused=value;if(value)stop();else invalidate();}
  const resize=()=>{
    const {width,height}=host.getBoundingClientRect();
    if(!width || !height)return;
    renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();invalidate();
  };
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  const disposeModel=()=>{
    const geometries=new Set(),materials=new Set();
    model?.traverse(o=>{if(o.isMesh){geometries.add(o.geometry);for(const m of (Array.isArray(o.material)?o.material:[o.material]))materials.add(m);}});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());model=undefined;
  };
  const cleanup=()=>{
    if(dead)return;dead=true;stop();observer.disconnect();document.removeEventListener('visibilitychange',visibility);signal.removeEventListener('abort',cleanup);
    renderer.domElement.removeEventListener('webglcontextlost',lost);disposeModel();environment.dispose();sun.shadow.map?.dispose();renderer.dispose();renderer.domElement.remove();
    if(host.__sceneDiagnostics===diagnostics)delete host.__sceneDiagnostics;
  };
  const lost=e=>{e.preventDefault();onFailure('The image tour is ready to continue.');cleanup();};
  renderer.domElement.addEventListener('webglcontextlost',lost);
  const visibility=()=>{visible=!document.hidden;if(visible)invalidate();else stop();};document.addEventListener('visibilitychange',visibility);
  signal.addEventListener('abort',cleanup,{once:true});
  onController({invalidate,setPaused});
  function render(time){
    frame=0;
    if(dead || !visible || paused)return;
    const elapsed=last?(time-last)/1000:0;
    // Limit animated rendering to 60 Hz even on 120/144 Hz phone displays.
    if(elapsed && elapsed<1/60-.001){invalidate();return;}
    last=time;
    const dt=elapsed?Math.min(elapsed,.06):1/60;
    const desired=getProgress(), c=getClosing()?1:0;
    progress=reducedMotion?desired:THREE.MathUtils.damp(progress,desired,5,dt);
    closing=reducedMotion?c:THREE.MathUtils.damp(closing,c,2,dt);
    if(Math.abs(progress-desired)<.0005)progress=desired;
    if(Math.abs(closing-c)<.001)closing=c;
    const shot=samplePath(path,progress);
    camera.position.fromArray(shot.position);target.fromArray(shot.target);camera.lookAt(target);
    const horizontal=shot.fov*Math.PI/180;
    const fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(horizontal/2)/Math.min(camera.aspect,1.6)));
    if(Math.abs(camera.fov-fov)>.001){camera.fov=fov;camera.updateProjectionMatrix();}
    scene.background.copy(day).lerp(dusk,closing);scene.fog.color.copy(scene.background);
    hemi.intensity=1.4-closing*.7;sun.intensity=2.3-closing*1.95;fill.intensity=1+closing*.3;renderer.toneMappingExposure=1-closing*.08;
    renderer.render(scene,camera);
    diagnostics.renders++;diagnostics.triangles=renderer.info.render.triangles;diagnostics.drawCalls=renderer.info.render.calls;
    if(!announced){announced=true;onReady();}
    const moving=progress!==desired || closing!==c;
    // Measure only consecutive animated frames; idle time is not slow rendering.
    if(moving && elapsed){
      frameSum+=elapsed;frameCount++;
      if(frameCount===45){
        if(frameSum/frameCount>.034 && renderer.getPixelRatio()>(mobile ? .7 : 1)){
          renderer.setPixelRatio(Math.max(mobile ? .7 : 1,renderer.getPixelRatio()-.15));
          diagnostics.pixelRatio=renderer.getPixelRatio();resize();
        }
        frameSum=0;frameCount=0;
      }
    }
    if(moving)invalidate();else{last=0;frameSum=0;frameCount=0;}
  }
  try {
    const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const [buffer,cameras]=await Promise.all([
      fetch(modelURL,{signal}).then(async r=>{
        if(!r.ok)throw Error('model load');
        const total=Number(r.headers.get('content-length')),reader=r.body.getReader(),chunks=[];let loaded=0;
        while(true){const {done,value}=await reader.read();if(done)break;chunks.push(value);loaded+=value.length;if(!dead)onProgress(total?Math.min(.9,loaded/total*.9):.3);}
        const bytes=new Uint8Array(loaded);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
        return bytes.buffer;
      }),
      fetch('/assets/cameras.json',{signal}).then(r=>{if(!r.ok)throw Error('camera load');return r.json();})
    ]);
    if(dead)return cleanup;
    const gltf=await loader.parseAsync(buffer,'/assets/');
    model=gltf.scene;
    if(dead){disposeModel();return cleanup;}
    path=makeCameraPath(cameras);
    model.traverse(o=>{
      if(!o.isMesh)return;
      o.castShadow=!mobile;o.receiveShadow=!mobile;
      for(const material of (Array.isArray(o.material)?o.material:[o.material])){
        // Transparent panes retain the original model and permit views through glazing.
        if(/glaz|glass/i.test(material.name)){material.transparent=true;material.opacity=.21;material.depthWrite=false;material.side=THREE.DoubleSide;o.castShadow=false;}
      }
    });
    scene.add(model);renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
    progress=getProgress();onProgress(1);invalidate();
  } catch(error) { if(!dead && error.name!=='AbortError'){onFailure('The image tour is ready. You can try 3D again at any time.');cleanup();} }
  return cleanup;
}
