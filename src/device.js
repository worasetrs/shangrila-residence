// Keep the device profile stable on rotation; every device starts in full-quality Explore.
export function getDeviceProfile(){
  const touch=window.matchMedia('(pointer: coarse)').matches;
  return {mobile:touch || window.innerWidth<768 || (navigator.deviceMemory>0 && navigator.deviceMemory<=4),touch};
}
