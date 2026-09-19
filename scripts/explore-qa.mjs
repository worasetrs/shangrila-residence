import assert from 'node:assert/strict';
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
export async function checkExplore(page,context,touch,name){
 const read=()=>page.evaluate(()=>structuredClone(document.querySelector('.webgl').__sceneDiagnostics));
 const canvas=page.locator('.webgl canvas');
 await page.getByRole('button',{name:'Explore project',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.webgl').__sceneDiagnostics?.mode==='explore',null,{timeout:60000});
 const initial=await read();assert.equal(initial.quality,'original');assert.equal(initial.antialias,true);assert.equal(initial.shadows,2048);assert(initial.modelURL.endsWith('SHANGRILA_MASTER_REFINED.glb'));
 if(touch)assert.equal(initial.pixelRatio,1.5);
 assert.equal(await page.evaluate(()=>document.body.style.position),'fixed');
 await page.screenshot({path:`qa/${name}-explore.png`,scale:'css'});
 const box=await canvas.boundingBox(),x=box.width*.35,y=box.y+box.height*.46;
 const cdp=touch?await context.newCDPSession(page):null;
 async function gesture(points,moves){
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});
  for(const touchPoints of moves){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints});await page.waitForTimeout(35);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(750);
 }
 if(touch)await gesture([{x,y}],Array.from({length:8},(_,i)=>[{x:x+12*(i+1),y:y-3*(i+1)}]));
 else{await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+150,y-35,{steps:12});await page.mouse.up();await page.waitForTimeout(750);}
 const rotated=await read();assert(distance(initial.camera,rotated.camera)>1,'Orbit did not move camera');
 const beforeZoom=distance(rotated.camera,rotated.target);
 if(touch)await gesture([{x:x-35,y},{x:x+35,y}],Array.from({length:8},(_,i)=>[{x:x-35-5*(i+1),y},{x:x+35+5*(i+1),y}]));
 else{await page.mouse.move(x,y);await page.mouse.wheel(0,-230);await page.waitForTimeout(750);}
 const zoomed=await read();assert(distance(zoomed.camera,zoomed.target)<beforeZoom-1,'Zoom did not bring camera closer');
 const beforePan=zoomed.target;
 if(touch)await gesture([{x:x-30,y},{x:x+30,y}],Array.from({length:8},(_,i)=>[{x:x-30+4*(i+1),y:y+3*(i+1)},{x:x+30+4*(i+1),y:y+3*(i+1)}]));
 else{await page.mouse.move(x,y);await page.mouse.down({button:'right'});await page.mouse.move(x+90,y+30,{steps:10});await page.mouse.up({button:'right'});await page.waitForTimeout(750);}
 const panned=await read();assert(distance(panned.target,beforePan)>.05,'Pan did not move target');
 assert.equal(await page.evaluate(()=>visualViewport.scale),1,'Explore gesture zoomed the page');
 assert.equal(await page.evaluate(()=>document.body.style.position),'fixed');
 for(const id of ['building-a','building-b','restaurant','pool','p05','p06','guardhouse']){
  await page.getByRole('button',{name:'Reset View',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.webgl').__sceneDiagnostics.mode==='explore');
  await page.locator(`[data-hotspot-id="${id}"]`).click();
  await page.waitForFunction(()=>document.querySelector('.webgl').__sceneDiagnostics.mode==='explore');
  assert.equal(await page.locator('.hotspot-card').count(),1);
  const d=await read();assert(d.camera[1]>=4,'Camera below ground');
  assert(d.target[0]>=26 && d.target[0]<=144 && d.target[2]>=-97 && d.target[2]<=-36,'Target outside site');
  assert(!d.collisionBoxes.some(b=>d.camera.every((v,i)=>v>=b.min[i]&&v<=b.max[i])),'Camera inside a building');
 }
 await page.screenshot({path:`qa/${name}-hotspot.png`,scale:'css'});
 await page.getByRole('button',{name:'Back to overview',exact:false}).click();
 await page.waitForFunction(()=>document.querySelector('.webgl').__sceneDiagnostics.mode==='explore');
 await page.waitForTimeout(180);
 const beforeIdle=(await read()).renders;await page.waitForTimeout(650);assert.equal((await read()).renders,beforeIdle,'Orbit keeps drawing at rest');
 if(touch){
  const requestsBefore=await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.name.endsWith('.glb')).length);
  await page.setViewportSize({width:844,height:390});await page.waitForTimeout(600);
  const rotatedScreen=await read();assert.equal(rotatedScreen.pixelRatio,1.5);assert.equal(rotatedScreen.quality,'original');
  assert.equal(await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.name.endsWith('.glb')).length),requestsBefore);
  await page.screenshot({path:'qa/mobile-explore-landscape.png',scale:'css'});
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(600);
 }
 await page.evaluate(()=>{window.__qaCamera=[];window.__qaSample=true;function sample(){if(!window.__qaSample)return;window.__qaCamera.push(document.querySelector('.webgl').__sceneDiagnostics.camera);requestAnimationFrame(sample);}sample();});
 await page.locator('[data-hotspot-id="pool"]').click();
 await page.waitForFunction(()=>document.querySelector('.webgl').__sceneDiagnostics.mode==='explore');
 await page.getByRole('button',{name:'Continue Tour',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.webgl').__sceneDiagnostics.mode==='guided');
 await page.waitForFunction(()=>Math.abs(document.getElementById('interiors').getBoundingClientRect().top)<20);
 const samples=await page.evaluate(()=>{window.__qaSample=false;return window.__qaCamera;});
 const largestStep=Math.max(...samples.slice(1).map((v,i)=>distance(v,samples[i])));assert(largestStep>0&&largestStep<45,'Focus/Continue Tour must interpolate without teleporting');
 assert.equal(await page.evaluate(()=>document.body.style.position),'');
 if(touch){const yBefore=await page.evaluate(()=>scrollY);await gesture([{x:200,y:700}],Array.from({length:8},(_,i)=>[{x:200,y:700-40*(i+1)}]));assert(await page.evaluate(()=>scrollY)>yBefore+100,'Native page scrolling did not resume after Explore');}
 await cdp?.detach();
 return {originalQuality:true,pixelRatio:initial.pixelRatio,rotate:true,zoom:true,pan:true,hotspots:7,cameraOutsideBuildings:true,zeroIdleFrames:true,continueTour:true,maxReturnFrameDistance:largestStep};
}
