export function sourceView(cameras,name,distance=45){
 const camera=cameras.find(item=>item.name===name);
 if(!camera)throw Error(`Missing source camera: ${name}`);
 return {position:camera.position,target:camera.position.map((value,index)=>value+camera.direction[index]*distance),fov:camera.fov};
}
