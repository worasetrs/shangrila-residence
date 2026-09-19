import assert from 'node:assert/strict';
const distance=(a,b)=>Math.hypot(...a.map((value,index)=>value-b[index]));
const pause=page=>page.waitForTimeout(250);
async function navigate(page,id){
 await page.getByRole('button',{name:'Open navigation',exact:true}).click();
 await page.locator(`#section-menu a[href="#${id}"]`).click();
 await page.waitForFunction(id=>Math.abs(document.getElementById(id).getBoundingClientRect().top-document.querySelector('.header').getBoundingClientRect().height)<4,id);
}
async function touch(cdp,page,points,moves){
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});
 for(const touchPoints of moves){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints});await page.waitForTimeout(25);}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(page);
}
export async function checkExperience(browser,base,mobile){
 const name=mobile?'mobile':'desktop',context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:960},deviceScaleFactor:mobile?3:1,isMobile:mobile,hasTouch:mobile});
 const page=await context.newPage(),errors=[],failures=[],requests=[];page.setDefaultTimeout(90000);
 page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 page.on('request',request=>requests.push(request.url()));page.on('response',response=>{if(response.status()>=400)failures.push(response.url());});
 await page.goto(base,{waitUntil:'networkidle'});
 await page.waitForFunction(()=>document.querySelector('.webgl')?.__sceneDiagnostics?.mode==='explore'&&getComputedStyle(document.querySelector('.webgl')).opacity==='1');
 const read=()=>page.evaluate(()=>structuredClone(document.querySelector('.webgl').__sceneDiagnostics));
 const settled=async()=>{await page.waitForFunction(()=>document.querySelector('.webgl').__sceneDiagnostics.mode==='explore');await pause(page);};
 const initial=await read();assert.equal(initial.quality,'original');assert.equal(initial.pixelRatio,mobile?1.5:1);assert(initial.antialias&&initial.shadows===2048&&initial.triangles>2000000);
 assert.equal(await page.getByRole('button',{name:'Enable 3D experience'}).count(),0);
 assert.equal(await page.locator('main>section').count(),3);assert.equal(await page.locator('[data-hotspot-id]').count(),7);
 assert.equal(await page.evaluate(()=>document.body.style.position),'');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:`qa/${name}-explore-first.png`,scale:'css'});
 const cdp=mobile?await context.newCDPSession(page):null,box=await page.locator('.webgl canvas').boundingBox(),x=box.width*.3,y=box.y+box.height*.7;
 if(mobile)await touch(cdp,page,[{x,y}],Array.from({length:8},(_,i)=>[{x:x+10*(i+1),y:y-3*(i+1)}]));
 else{await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+130,y-30,{steps:12});await page.mouse.up();await page.waitForTimeout(650);}
 assert(distance(initial.camera,(await read()).camera)>1,'Explore must rotate without an entry click');
 const beforeZoom=await read();
 if(mobile)await touch(cdp,page,[{x:x-30,y},{x:x+30,y}],Array.from({length:8},(_,i)=>[{x:x-30-4*(i+1),y},{x:x+30+4*(i+1),y}]));
 else{await page.getByRole('button',{name:'Zoom 3D in',exact:true}).click();await pause(page);}
 const zoomed=await read();assert(distance(zoomed.camera,zoomed.target)<distance(beforeZoom.camera,beforeZoom.target)-1);
 await page.locator('.webgl canvas').focus();const targetBefore=(await read()).target;
 await page.keyboard.press('ArrowRight');await pause(page);assert(distance(targetBefore,(await read()).target)>.01);
 for(const id of ['building-a','building-b','restaurant','pool','p05','p06','guardhouse']){
  await page.getByRole('button',{name:'Reset View',exact:true}).click();await settled();
  await page.locator(`[data-hotspot-id="${id}"]`).click();await settled();
  const state=await read();assert(state.camera[1]>=4);assert(!state.collisionBoxes.some(box=>state.camera.every((v,i)=>v>=box.min[i]&&v<=box.max[i])));
  if(['building-a','pool'].includes(id))await page.screenshot({path:`qa/${name}-explore-${id}.png`,scale:'css'});
 }
 await page.getByRole('button',{name:'Reset View',exact:true}).click();await settled();
 const idle=(await read()).renders;await page.waitForTimeout(650);assert.equal((await read()).renders,idle,'No idle rendering');
 const cameraBeforeGallery=(await read()).camera;
 await page.locator('.gallery-link').click();
 await page.waitForFunction(()=>document.querySelector('.webgl').__sceneDiagnostics.paused);
 const paused=(await read()).renders;await page.waitForTimeout(500);assert.equal((await read()).renders,paused);
 assert.deepEqual((await read()).camera,cameraBeforeGallery,'Page scrolling must not drive the camera');
 await page.waitForFunction(()=>Math.abs(document.getElementById('interiors').getBoundingClientRect().top-document.querySelector('.header').offsetHeight)<4);
 await page.screenshot({path:`qa/${name}-gallery.png`,scale:'css'});
 assert.equal(await page.locator('.gallery-card').count(),29);
 assert.equal(await page.locator('.gallery-caption p').filter({hasText:'CONCEPT STUDY'}).count(),23);
 for(const card of await page.locator('.gallery-card').all()){
  await card.scrollIntoViewIfNeeded();await card.locator('img').waitFor();
  await page.waitForFunction(id=>document.querySelector(`[data-image-id="${id}"] img`)?.naturalWidth>0,await card.getAttribute('data-image-id'));
 }
 await navigate(page,'interiors');
 for(const [label,count] of [['Residences',14],['Restaurant',3],['Wellness',4],['Staff',3],['Support',5]]){
  await page.locator('.gallery-filters').getByRole('button',{name:new RegExp('^'+label)}).click();assert.equal(await page.locator('.gallery-card').count(),count);
 }
 await page.locator('.gallery-filters').getByRole('button',{name:/^All spaces/}).click();
 await page.locator('.gallery-picture').first().click();
 await page.waitForFunction(()=>document.querySelector('dialog[open] img')?.naturalWidth===3000);
 const firstSrc=await page.locator('dialog img').getAttribute('src');
 await page.getByRole('button',{name:'Next image',exact:true}).click();assert.notEqual(await page.locator('dialog img').getAttribute('src'),firstSrc);
 await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('dialog img').getAttribute('src'),firstSrc);
 await page.screenshot({path:`qa/${name}-gallery-lightbox.png`,scale:'css'});
 await page.keyboard.press('Escape');assert.equal(await page.locator('dialog').count(),0);
 assert.equal(await page.evaluate(()=>document.activeElement.className),'gallery-picture');assert.equal(await page.evaluate(()=>document.body.style.overflow),'');
 await navigate(page,'masterplan');await page.waitForFunction(()=>document.querySelector('.plan-sheet img')?.naturalWidth===2384);
 assert(!requests.some(url=>/\.pdf(?:$|\?)/.test(url)),'The master plan must use an image');
 const plan=page.locator('.plan-viewport');
 await page.getByRole('button',{name:'Zoom in',exact:true}).click();await page.getByRole('button',{name:'Zoom in',exact:true}).click();
 assert.equal(await page.locator('.plan-tools output').textContent(),'150%');
 await page.getByRole('button',{name:'Fit plan to view'}).click();
 if(mobile){
  await plan.scrollIntoViewIfNeeded();await pause(page);
  const bounds=await plan.boundingBox(),cx=bounds.x+bounds.width/2+18,cy=bounds.y+bounds.height/2,oldImage=await page.locator('.plan-sheet img').boundingBox(),oldY=await page.evaluate(()=>scrollY);
  const hit=await page.evaluate(({x,y})=>({tag:document.elementFromPoint(x,y)?.className,scale:visualViewport.scale}),{x:cx,y:cy});
  assert.equal(hit.scale,1,'Page scale before plan gesture');assert.equal(hit.tag,'plan-viewport',`Pinch target: ${JSON.stringify({bounds,cx,cy,hit})}`);
  const focalBefore=(cx-oldImage.x)/oldImage.width;
  await touch(cdp,page,[{x:cx-38,y:cy},{x:cx+38,y:cy}],Array.from({length:10},(_,i)=>[{x:cx-38-5*(i+1),y:cy},{x:cx+38+5*(i+1),y:cy}]));
  const zoom=Number(await plan.getAttribute('data-zoom'));assert(zoom>2.2&&zoom<2.4,'Pinch must zoom the plan');
  const newImage=await page.locator('.plan-sheet img').boundingBox();assert(Math.abs((cx-newImage.x)/newImage.width-focalBefore)<.015,'Keep the drawing under the pinch midpoint');
  assert.equal(await page.evaluate(()=>visualViewport.scale),1,'Pinch must not zoom the browser');assert.equal(await page.evaluate(()=>scrollY),oldY);
  const beforePan=Number(await plan.getAttribute('data-pan-x'));
  await touch(cdp,page,[{x:cx,y:cy}],Array.from({length:8},(_,i)=>[{x:cx+5*(i+1),y:cy-2*(i+1)}]));
  assert(Math.abs(Number(await plan.getAttribute('data-pan-x'))-beforePan)>25,'One finger must pan the enlarged plan');
 }else{
  await plan.focus();for(let i=0;i<6;i++)await page.keyboard.press('+');
  const bounds=await plan.boundingBox();await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);await page.mouse.down();await page.mouse.move(bounds.x+bounds.width/2+70,bounds.y+bounds.height/2+40,{steps:8});await page.mouse.up();
  assert(Number(await plan.getAttribute('data-pan-x'))>50,'Mouse must pan the plan');
 }
 await page.screenshot({path:`qa/${name}-plan-zoom.png`,scale:'css'});
 await page.getByRole('button',{name:'View fullscreen'}).click();assert.equal(await page.getByRole('dialog').count(),1);await pause(page);
 if(mobile){await page.setViewportSize({width:844,height:390});await page.waitForTimeout(400);}
 await plan.focus();for(let i=0;i<20;i++)await page.keyboard.press('+');assert.equal(await plan.getAttribute('data-zoom'),'5');
 for(let i=0;i<22;i++)await page.keyboard.press('-');assert.equal(await plan.getAttribute('data-zoom'),'0.75');
 await page.getByRole('button',{name:'Fit plan to view'}).click();assert.equal(await plan.getAttribute('data-pan-x'),'0');assert.equal(await plan.getAttribute('data-pan-y'),'0');
 await page.screenshot({path:`qa/${name}-plan-fullscreen.png`,scale:'css'});
 await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);assert.equal(await page.evaluate(()=>document.body.style.overflow),'');
 if(mobile){await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);}
 await navigate(page,'explore');await page.waitForFunction(()=>!document.querySelector('.webgl').__sceneDiagnostics.paused);await pause(page);
 assert.deepEqual((await read()).camera,cameraBeforeGallery);assert.equal(requests.filter(url=>url.endsWith('.glb')).length,1);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
 const sizes=await page.locator('#explore button:visible,#explore .gallery-link,.plan-tools button,.plan-tools a').evaluateAll(items=>items.map(el=>({name:el.getAttribute('aria-label')||el.textContent,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height})));
 assert(sizes.every(item=>item.width>=43.9&&item.height>=43.9),'Touch controls must be at least 44px');
 await cdp?.detach();await context.close();
 return {viewport:name,autoExplore:true,originalQuality:true,pixelRatio:initial.pixelRatio,rotate:true,zoom:true,keyboardPan:true,hotspots:7,zeroIdleFrames:true,pausesForImages:true,cameraPreserved:true,galleryImages:29,conceptCaptions:23,filters:true,lightbox:true,masterPlan:{imageOnly:true,pinch:mobile,focalAnchor:mobile,pan:true,zoomBounds:[.75,5],fullscreen:true,rotation:mobile},errors,failures};
}
export async function checkRecovery(browser,base){
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(60000);
 await page.route('**/*.glb',route=>route.abort());await page.goto(base,{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Retry 3D',exact:true}).waitFor();await page.getByRole('link',{name:'View gallery',exact:true}).click();
 assert.equal(await page.locator('.gallery-card').count(),29);
 await page.unroute('**/*.glb');await navigate(page,'explore');await page.getByRole('button',{name:'Retry 3D',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.webgl')?.__sceneDiagnostics?.mode==='explore',null,{timeout:90000});
 await page.route('**/assets/masterplan.webp',route=>route.abort());await navigate(page,'masterplan');await page.getByRole('link',{name:'Open original master plan PDF'}).waitFor();
 assert.equal(await page.locator('.plan-sheet img').count(),0);await context.close();
 return {failedModel:'Gallery remains available; Retry restores Explore',reducedMotion:'Explore opens without an automatic camera animation',failedMasterPlan:'Original PDF link remains available'};
}
