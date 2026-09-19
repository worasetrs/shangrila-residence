import * as THREE from 'three';
import {Sky} from 'three/addons/objects/Sky.js';

// Bake the outdoor reflections once; camera interaction needs no extra render passes.
export function createLuxuryLighting(renderer,scene){
 renderer.toneMappingExposure=.9;
 const horizon=new THREE.Color('#d9d6c9');
 scene.background=horizon;scene.fog=new THREE.Fog(horizon,250,720);

 const sun=new THREE.DirectionalLight('#ffd39b',3.1);
 sun.position.set(5,85,45);sun.target.position.set(85,0,-65);
 sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
 Object.assign(sun.shadow.camera,{left:-105,right:105,top:90,bottom:-90,near:1,far:400});
 sun.shadow.normalBias=.08;sun.shadow.bias=-.0006;
 scene.add(sun,sun.target);

 const sky=new Sky(),skyScene=new THREE.Scene();sky.scale.setScalar(10000);
 const uniforms=sky.material.uniforms;
 uniforms.turbidity.value=3.2;uniforms.rayleigh.value=1.3;
 uniforms.mieCoefficient.value=.005;uniforms.mieDirectionalG.value=.8;
 uniforms.sunPosition.value.copy(sun.position).sub(sun.target.position).normalize();
 skyScene.add(sky);
 const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(skyScene,.04);
 scene.environment=environment.texture;scene.environmentIntensity=.18;
 sky.geometry.dispose();sky.material.dispose();pmrem.dispose();

 const ambient=new THREE.HemisphereLight('#dceaff','#70654b',.5);
 const fill=new THREE.DirectionalLight('#bfd6ec',.35);
 fill.position.set(180,65,-115);fill.target.position.copy(sun.target.position);
 scene.add(ambient,fill,fill.target);
 return {dispose(){environment.dispose();sun.shadow.map?.dispose();}};
}

function addWaterReflections(material){
 // Static world-space ripples catch the sky and sun without textures or an idle animation.
 material.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec2 vWaterPosition;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   vWaterPosition=(modelMatrix*vec4(transformed,1.0)).xz;`);
  shader.fragmentShader='varying vec2 vWaterPosition;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   vec2 p=vWaterPosition;
   p+=.16*vec2(sin(p.y*1.7),cos(p.x*1.3));
   float rippleA=cos(dot(p,vec2(6.6,1.8)));
   float rippleB=cos(dot(p,vec2(-3.4,8.1))+1.8);
   float rippleC=cos(dot(p,vec2(10.2,13.7))+3.4);
   vec2 slope=vec2(.033,.009)*rippleA+vec2(-.01,.024)*rippleB+vec2(.01,.014)*rippleC;
   normal=normalize(mat3(viewMatrix)*vec3(-slope.x,1.0,-slope.y));`);
 };
 material.customProgramCacheKey=()=> 'shangrila-water-ripples-v1';
}

export function refinePresentationMaterials(model,environment){
 const visited=new Set();
 model.traverse(object=>{
  if(!object.isMesh)return;
  object.castShadow=true;object.receiveShadow=true;
  for(const material of(Array.isArray(object.material)?object.material:[object.material])){
   const name=material.name;
   if(/glaz|glass/i.test(name))object.castShadow=false;
   if(visited.has(material))continue;
   visited.add(material);
   if(/glaz|glass/i.test(name)){
    material.transparent=true;material.opacity=.21;material.depthWrite=false;material.side=THREE.DoubleSide;
    material.envMap=environment;material.envMapIntensity=.26;
   }else if(/Pool water/i.test(name)){
    material.color.set('#42a4aa');material.roughness=.24;material.metalness=.25;
    material.envMap=environment;material.envMapIntensity=.28;addWaterReflections(material);
   }else if(/Pool pale aqua mosaic/i.test(name)){
    material.color.set('#6bb5b0');
   }else if(/Tropical lawn/i.test(name)){
    material.color.set('#536c45');
   }else if(/Palm foliage/i.test(name)){
    material.color.multiplyScalar(.78);material.roughness=.72;
   }else if(/brass|bronze|champagne/i.test(name)){
    material.envMap=environment;material.envMapIntensity=.32;
   }
   // Accentuate the light strips already present in the source architecture.
   if(/warm linear lighting|2700K architectural light/i.test(name)){
    material.emissive.set('#ffac58');material.emissiveIntensity=3;
   }
  }
 });
}
