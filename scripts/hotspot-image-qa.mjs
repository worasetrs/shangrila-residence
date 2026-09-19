import assert from 'node:assert/strict';

export async function checkHotspotImages(browser,base,mobile){
 const name=mobile?'mobile':'desktop',context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:960},deviceScaleFactor:mobile?3:1,isMobile:mobile,hasTouch:mobile});
 const page=await context.newPage(),errors=[];page.setDefaultTimeout(90000);
 page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 await page.goto(base,{waitUntil:'networkidle'});
 await page.waitForFunction(()=>document.querySelector('.webgl').__sceneDiagnostics?.mode==='explore'&&getComputedStyle(document.querySelector('.webgl')).opacity==='1');
 const settled=async()=>{await page.waitForFunction(()=>document.querySelector('.webgl').__sceneDiagnostics.mode==='explore');await page.waitForTimeout(200);};
 const camera=()=>page.evaluate(()=>[...document.querySelector('.webgl').__sceneDiagnostics.camera]);
 const open=async()=>{const thumbnail=page.locator('.hotspot-preview');if(mobile)await thumbnail.tap();else await thumbnail.click();await page.waitForFunction(()=>document.querySelector('.hotspot-image-dialog[open] img')?.naturalWidth>0);};
 for(const id of ['building-a','building-b','restaurant','pool','p05','p06','guardhouse']){
  await page.getByRole('button',{name:'Reset View',exact:true}).click();await settled();
  const marker=page.locator(`[data-hotspot-id="${id}"]`);if(mobile)await marker.tap();else await marker.click();await settled();
  const thumbnail=page.locator('.hotspot-preview'),source=await thumbnail.locator('img').getAttribute('src'),small=await thumbnail.boundingBox(),before=await camera();
  await open();assert.equal(await page.locator('.hotspot-image-dialog img').getAttribute('src'),source);
  const large=await page.locator('.hotspot-image-dialog img').boundingBox();assert(large.width>small.width*1.5,'Enlarged photo must be larger than its thumbnail');
  assert(large.width<=page.viewportSize().width&&large.height<=page.viewportSize().height,'Photo must fit the screen');
  await page.keyboard.press('ArrowRight');assert(Math.hypot(...(await camera()).map((v,i)=>v-before[i]))<.00001,'Image controls must not move the 3D camera');
  if(id==='building-a')await page.screenshot({path:`qa/${name}-hotspot-large.png`,scale:'css'});
  if(id==='building-a')await page.keyboard.press('Escape');else if(mobile)await page.getByRole('button',{name:'Close enlarged image'}).tap();else await page.getByRole('button',{name:'Close enlarged image'}).click();
  assert.equal(await page.locator('.hotspot-image-dialog').count(),0);
  assert.equal(await page.evaluate(()=>document.activeElement?.className),'hotspot-preview');
  assert.equal(await page.evaluate(()=>document.body.style.overflow),'');
  assert(Math.hypot(...(await camera()).map((v,i)=>v-before[i]))<.00001);
  if(id==='p05'){
   assert(source.endsWith('/hotspots/p05.webp'));await open();
   const dialog=await page.locator('.hotspot-image-dialog').boundingBox();
   const point=dialog.y>12?{x:5,y:5}:{x:2,y:page.viewportSize().height/2};
   if(mobile)await page.touchscreen.tap(point.x,point.y);else await page.mouse.click(point.x,point.y);
   assert.equal(await page.locator('.hotspot-image-dialog').count(),0,'Clicking the backdrop closes the image');
  }
 }
 await page.screenshot({path:`qa/${name}-hotspot-clickable.png`,scale:'css'});
 assert.deepEqual(errors,[]);await context.close();
 return {viewport:name,clickableHotspotImages:7,enlargedSourceImage:true,closeButton:true,escape:true,backdrop:true,focusRestored:true,cameraPreserved:true,errors};
}
