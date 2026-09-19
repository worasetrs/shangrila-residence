import {exploreView} from './data/hotspots';
export {chapters,navigation} from './data/project';
export function sourceView(cameras,name,distance=45){
 const c=cameras.find(c=>c.name===name);
 if(!c)throw Error(`Missing source camera: ${name}`);
 return {position:c.position,target:c.position.map((v,i)=>v+c.direction[i]*distance),fov:c.fov};
}
// All real-time interiors are excluded from this exterior camera story.
export function makeCameraPath(cameras){
 const key=(t,name,distance)=>({t,...sourceView(cameras,name,distance)});
 return [
  key(0,'01_AERIAL',205),
  {t:.8,position:[185,104,12],target:[87,7,-65],fov:48},
  {t:1.25,position:[164,89,-135],target:[87,7,-65],fov:52},
  {t:1.55,position:[181,62,-17],target:[109,5,-58],fov:53},
  key(2,'02_ENTRANCE',48),
  key(2.22,'09_GUARDHOUSE',23),
  {t:2.52,position:[130,45,-24],target:[93,3,-66],fov:55},
  key(2.85,'03_POOL',38),
  {t:3.15,position:[65,27,-38],target:[82,2,-72],fov:52},
  {t:3.42,position:[104,32,-20],target:[98,4,-51],fov:54},
  {t:3.72,position:[173,58,-9],target:[120,10,-72],fov:52},
  {t:4,...exploreView},
 ];
}
export function samplePath(path,progress){
 let i=0;while(i<path.length-2 && progress>path[i+1].t)i++;
 const a=path[i],b=path[i+1],u=Math.max(0,Math.min(1,(progress-a.t)/(b.t-a.t))),s=u*u*(3-2*u);
 return {position:a.position.map((v,k)=>v+(b.position[k]-v)*s),target:a.target.map((v,k)=>v+(b.target[k]-v)*s),fov:a.fov+(b.fov-a.fov)*s};
}
