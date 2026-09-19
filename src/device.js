// Touch devices keep native page scrolling and opt into the full-quality 3D asset.
export function getDeviceProfile(){
  const touch=window.matchMedia('(pointer: coarse)').matches;
  return {mobile:touch || window.innerWidth<768 || (navigator.deviceMemory>0 && navigator.deviceMemory<=4),touch};
}
