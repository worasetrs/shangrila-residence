import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { makeCameraPath, samplePath } from './story';

export async function createScene(host, { signal, onProgress, onReady, onFailure, getProgress, getClosing, reducedMotion }) {
  let renderer;
  try { renderer=new THREE.WebGLRenderer({alpha:false,antialias:true,powerPreference:'high-performance'}); }
  catch { onFailure('This device is best experienced in our image tour.'); return () => {}; }
  const scene=new THREE.Scene();
  const day=new THREE.Color('#d9ddd3'), dusk=new THREE.Color('#525c66');
  scene.background=day.clone();scene.fog=new THREE.Fog(day,230,650);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);
  const camera=new THREE.PerspectiveCamera(40,1,.12,1200);
  const pmrem=new THREE.PMREMGenerator(renderer), room=new RoomEnvironment();
  const environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;scene.environmentIntensity=.35;
  room.dispose();pmrem.dispose();
  const hemi=new THREE.HemisphereLight('#fff4dc','#66765f',1.4);scene.add(hemi);
  const sun=new THREE.DirectionalLight('#fff1d3',2.3);sun.position.set(180,160,-25);sun.target.position.set(85,0,-65);
  sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-115,right:115,top:115,bottom:-115,near:1,far:450});
  sun.shadow.normalBias=.045;sun.shadow.bias=-.0002;scene.add(sun,sun.target);
  const fill=new THREE.DirectionalLight('#d9e6ff',1);fill.position.set(20,50,-140);scene.add(fill);
  let model, frame, dead=false, visible=true, path, last=0, fpsSum=0, fpsCount=0, adjusted=false;
  let progress=getProgress(),closing=0;
  const target=new THREE.Vector3(),desiredPosition=new THREE.Vector3();
  const resize=()=>{
    const {width,height}=host.getBoundingClientRect();
    renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();
  };
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  const disposeModel=()=>model?.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of (Array.isArray(o.material)?o.material:[o.material]))m.dispose();}});
  const cleanup=()=>{
    if(dead)return;dead=true;cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',visibility);
    renderer.domElement.removeEventListener('webglcontextlost',lost);disposeModel();environment.dispose();sun.shadow.map?.dispose();renderer.dispose();renderer.domElement.remove();
  };
  const lost=e=>{e.preventDefault();onFailure('The image tour is ready to continue.');cleanup();};
  renderer.domElement.addEventListener('webglcontextlost',lost);
  const visibility=()=>{visible=!document.hidden;};document.addEventListener('visibilitychange',visibility);
  signal.addEventListener('abort',cleanup,{once:true});
  try {
    const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const [gltf,cameras]=await Promise.all([
      loader.loadAsync('/assets/SHANGRILA_MASTER_REFINED.glb',e=>{if(!dead)onProgress(e.total?e.loaded/e.total:Math.min(.9,e.loaded/16000000));}),
      fetch('/assets/cameras.json',{signal}).then(r=>{if(!r.ok)throw Error('camera load');return r.json();})
    ]);
    model=gltf.scene;
    if(dead){disposeModel();return cleanup;}
    path=makeCameraPath(cameras);
    model.traverse(o=>{
      if(!o.isMesh)return;
      o.castShadow=true;o.receiveShadow=true;
      for(const material of (Array.isArray(o.material)?o.material:[o.material])){
        // Transparent panes retain the original model and permit views through glazing.
        if(/glaz|glass/i.test(material.name)){material.transparent=true;material.opacity=.21;material.depthWrite=false;material.side=THREE.DoubleSide;o.castShadow=false;}
      }
    });
    scene.add(model);renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
    const initial=samplePath(path,progress);camera.position.fromArray(initial.position);target.fromArray(initial.target);
    const render=time=>{
      if(dead)return;frame=requestAnimationFrame(render);
      const dt=Math.min((time-last)/1000,.06);last=time;
      if(!visible || host.dataset.paused==='true')return;
      const desired=getProgress(), c=getClosing()?1:0;
      progress=reducedMotion?desired:THREE.MathUtils.damp(progress,desired,5,dt);
      closing=THREE.MathUtils.damp(closing,c,2,dt);
      const shot=samplePath(path,progress);
      desiredPosition.fromArray(shot.position);camera.position.copy(desiredPosition);target.fromArray(shot.target);camera.lookAt(target);
      const horizontal=shot.fov*Math.PI/180;
      camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(horizontal/2)/Math.min(camera.aspect,1.6)));
      camera.updateProjectionMatrix();
      scene.background.copy(day).lerp(dusk,closing);scene.fog.color.copy(scene.background);
      hemi.intensity=1.4-closing*.7;sun.intensity=2.3-closing*1.95;fill.intensity=1+closing*.3;renderer.toneMappingExposure=1-closing*.08;
      renderer.render(scene,camera);
      if(time>6000 && !adjusted && fpsCount<100){fpsSum+=dt;fpsCount++;if(fpsCount===100 && fpsSum/100>.038){renderer.setPixelRatio(1);resize();adjusted=true;}}
    };
    renderer.render(scene,camera);onReady();frame=requestAnimationFrame(render);
  } catch(error) { if(!dead && error.name!=='AbortError'){onFailure('The image tour is ready. You can try 3D again at any time.');cleanup();} }
  return cleanup;
}
