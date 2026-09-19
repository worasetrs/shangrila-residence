// Used by browser-qa against the production build. Emulation is not a phone GPU benchmark.
export async function checkMobile3D(page,context,requests){
 const cdp=await context.newCDPSession(page);
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await page.getByRole('button',{name:'Enable 3D experience'}).tap();
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('.webgl')).opacity==='1',null,{timeout:60000});
 const read=()=>page.evaluate(()=>({...document.querySelector('.webgl').__sceneDiagnostics}));
 const initial=await read();
 if(initial.profile!=='mobile' || !initial.modelURL.endsWith('SHANGRILA_MOBILE.glb'))throw Error('Wrong mobile model');
 if(requests.some(u=>u.endsWith('SHANGRILA_MASTER_REFINED.glb')))throw Error('Mobile downloaded desktop geometry');
 if(initial.pixelRatio>1)throw Error('Mobile render resolution is too high');
 await page.screenshot({path:'qa/mobile-3d-hero.png',scale:'css'});
 const idleStart=(await read()).renders;
 await page.waitForTimeout(800);
 const idleEnd=(await read()).renders;
 if(idleEnd!==idleStart)throw Error('Renderer continues drawing an idle scene');
 // A real touch gesture must move the page with the 3D canvas behind it.
 const startY=await page.evaluate(()=>scrollY);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:310,y:650}]});
 for(let i=1;i<=10;i++){
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:310,y:650-i*35}]});
  await page.waitForTimeout(20);
 }
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await page.waitForFunction(y=>scrollY>y+100,startY);
 await page.waitForFunction(before=>document.querySelector('.webgl').__sceneDiagnostics.renders>before,idleEnd);
 for(const [name,t] of [['pool',3],['interior',6]]){
  await page.evaluate(t=>window.scrollTo({top:document.querySelector('.journey').offsetHeight*t/8,behavior:'instant'}),t);
  await page.waitForTimeout(2600);
  await page.screenshot({path:`qa/mobile-3d-${name}.png`,scale:'css'});
 }
 const beforeRotate=requests.filter(u=>u.endsWith('.glb')).length;
 await page.setViewportSize({width:844,height:390});
 await page.waitForTimeout(800);
 const landscape=await page.evaluate(()=>({width:document.querySelector('.webgl canvas').width,cssWidth:document.querySelector('.webgl').clientWidth,profile:document.querySelector('.webgl').__sceneDiagnostics.profile}));
 if(landscape.width>landscape.cssWidth || landscape.profile!=='mobile')throw Error('Rotation upgraded mobile rendering');
 if(requests.filter(u=>u.endsWith('.glb')).length!==beforeRotate)throw Error('Rotation downloaded another model');
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
 await page.waitForTimeout(2800);
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
 const end=await read();
 await cdp.detach();
 return {profile:end.profile,modelURL:end.modelURL,pixelRatio:end.pixelRatio,heroTriangles:initial.triangles,idleFrames:idleEnd-idleStart,nativeTouchScroll:true,rotationKeepsMobileModel:true,environment:'Headless Edge, touch viewport with DPR 3 and 4× CPU throttling. No physical phone GPU claim.'};
}
