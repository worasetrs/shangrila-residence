// Keep the selected geometry tier stable across address-bar and orientation changes.
export function getDeviceProfile(){
  const touch=window.matchMedia('(pointer: coarse)').matches;
  return {mobile:touch || window.innerWidth<768 || (navigator.deviceMemory>0 && navigator.deviceMemory<=4),touch};
}
