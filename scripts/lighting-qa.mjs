import assert from 'node:assert/strict';

export async function checkLighting(browser,base){
 const results=[];
 for(const mobile of [false,true]){
  const name=mobile?'mobile':'desktop';
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:960},deviceScaleFactor:mobile?3:1,isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage(),errors=[];page.setDefaultTimeout(90000);
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error'){errors.push(message.text());console.error(message.text());}});
  await page.goto(base,{waitUntil:'networkidle'});
  await page.getByRole('button',{name:'Open chapters'}).click();
  await page.locator('#chapter-menu a[href="#explore"]').click();
  await page.waitForFunction(()=>Math.abs(document.getElementById('explore').getBoundingClientRect().top)<20);
  await page.getByRole('button',{name:'Explore project',exact:true}).click();
  const settled=async()=>{
   await page.waitForFunction(()=>document.querySelector('.webgl').__sceneDiagnostics?.mode==='explore');
   await page.waitForTimeout(200);
  };
  await settled();
  await page.screenshot({path:`qa/${name}-lighting-overview.png`,scale:'css'});
  for(const id of ['building-a','pool']){
   await page.locator(`[data-hotspot-id="${id}"]`).click();await settled();
   await page.screenshot({path:`qa/${name}-lighting-${id}.png`,scale:'css'});
   await page.getByRole('button',{name:'Back to overview',exact:false}).click();await settled();
  }
  const read=()=>page.evaluate(()=>structuredClone(document.querySelector('.webgl').__sceneDiagnostics));
  const quality=await read();
  assert.equal(quality.quality,'original');assert.equal(quality.antialias,true);assert.equal(quality.shadows,2048);
  assert.equal(quality.pixelRatio,mobile?1.5:1);
  assert(quality.triangles>2000000,'Original model detail must remain');
  await page.waitForTimeout(750);
  assert.equal((await read()).renders,quality.renders,'Lighting must not keep rendering at rest');
  await page.getByRole('button',{name:'Exit Explore',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.webgl').__sceneDiagnostics.mode==='guided');
  await page.getByRole('button',{name:'Switch to image tour'}).click();
  await page.waitForFunction(()=>!document.querySelector('.webgl canvas'));
  // Re-enter after disposal to catch stale environment/shadow resources.
  await page.getByRole('button',{name:'Explore project',exact:true}).click();await settled();
  assert.equal((await read()).quality,'original');assert.deepEqual(errors,[]);
  results.push({viewport:name,originalQuality:true,pixelRatio:quality.pixelRatio,antialias:quality.antialias,shadowSize:quality.shadows,triangles:quality.triangles,drawCalls:quality.drawCalls,views:['overview','building-a','pool'],zeroIdleFrames:true,rendererRecreated:true,errors});
  await context.close();
 }
 return results;
}
