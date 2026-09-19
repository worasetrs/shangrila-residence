import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
import {checkExplore} from './explore-qa.mjs';
if(process.argv.includes('--scenes')){await import('./scene-qa.mjs');process.exit(0);}
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/worra/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-unsafe-swiftshader','--use-gl=angle']});
const results=[];
let server;
if(process.argv.includes('--production')){
 const root=resolve('dist');const types={'.html':'text/html','.js':'application/javascript','.mjs':'application/javascript','.css':'text/css','.pdf':'application/pdf','.glb':'model/gltf-binary','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2'};
 server=createServer(async(req,res)=>{try{const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(path!==root && !path.startsWith(root+'\\')){res.writeHead(403).end();return;}const file=path===root?resolve(root,'index.html'):path;const data=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Content-Length':data.length});res.end(data);}catch{res.writeHead(404).end();}});
 await new Promise(resolve=>server.listen(4173,'127.0.0.1',resolve));
}
const base=server?'http://127.0.0.1:4173/':process.env.QA_URL || 'http://127.0.0.1:5173/';
try{
 if(process.argv.includes('--smoke')){
  const {checkFinalSmoke}=await import('./final-smoke.mjs');results.push(await checkFinalSmoke(browser,base));
 }else{
 for(const config of [{name:'desktop',width:1440,height:960},{name:'tablet',width:820,height:1180},{name:'mobile',width:390,height:844}]){
  const context=await browser.newContext({viewport:{width:config.width,height:config.height},deviceScaleFactor:config.name==='mobile'?3:1,isMobile:config.name==='mobile',hasTouch:config.name!=='desktop'});
  const page=await context.newPage(),errors=[],requests=[];page.setDefaultTimeout(60000);
  page.on('request',r=>requests.push(r.url()));
  page.on('pageerror',e=>errors.push(e.message));
  const failures=[];page.on('response',r=>{if(r.status()>=400)failures.push(`${r.status()} ${r.url()}`);});
  await page.goto(base,{waitUntil:'networkidle'});
  if(config.name==='desktop')await page.waitForFunction(()=>getComputedStyle(document.querySelector('.webgl')).opacity==='1');
  await page.screenshot({path:`qa/${config.name}-hero.png`});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  const count=await page.locator('[data-chapter]').count();
  if(overflow)throw Error(config.name+' horizontal overflow');if(count!==8)throw Error('Missing chapter');
  if(config.name!=='desktop' && requests.some(u=>u.endsWith('.glb')))throw Error('Touch device loads GLB before opt-in');
  let explore;
  if(config.name!=='tablet'){
   if(config.name==='mobile'){
    await page.getByRole('button',{name:'Enable 3D experience'}).tap();
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('.webgl')).opacity==='1',null,{timeout:90000});
    await page.waitForTimeout(4400);
    await page.screenshot({path:'qa/mobile-3d-hero.png',scale:'css'});
   }
   await page.getByRole('button',{name:'Open chapters'}).click();
   await page.locator('#chapter-menu a[href="#explore"]').click();
   await page.waitForFunction(()=>Math.abs(document.getElementById('explore').getBoundingClientRect().top)<20);
   await page.waitForTimeout(1800);
   explore=await checkExplore(page,context,config.name==='mobile',config.name);
   const before=await page.evaluate(()=>document.querySelector('.webgl').__sceneDiagnostics.renders);
   await page.waitForTimeout(500);
   assert.equal(await page.evaluate(()=>document.querySelector('.webgl').__sceneDiagnostics.renders),before,'Interiors must pause real-time rendering');
   explore.pausesForInteriors=true;
  }else{
   await page.getByRole('button',{name:'Open chapters'}).click();
   await page.locator('#chapter-menu a[href="#interiors"]').click();
  }
  for(const article of await page.locator('[data-interior]').all()){
   await article.scrollIntoViewIfNeeded();
   await page.waitForFunction(id=>document.querySelector(`[data-interior="${id}"] img`)?.naturalWidth>0,await article.getAttribute('data-interior'));
  }
  assert.equal(await page.locator('[data-interior]').count(),8);
  await page.locator('#interior-spa').scrollIntoViewIfNeeded();await page.getByRole('button',{name:'Sauna',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#interior-spa img')?.currentSrc.includes('sauna')&&document.querySelector('#interior-spa img').complete);
  await page.locator('#interior-living').scrollIntoViewIfNeeded();await page.waitForTimeout(750);
  await page.screenshot({path:`qa/${config.name}-interiors.png`,scale:'css'});
  await page.getByRole('button',{name:'Open chapters'}).click();
  await page.locator('#chapter-menu a[href="#masterplan"]').click();
  await page.waitForFunction(()=>Math.abs(document.getElementById('masterplan').getBoundingClientRect().top)<20);
  await page.waitForFunction(()=>document.querySelector('.plan-sheet img')?.naturalWidth===2384);
  if(requests.some(u=>/\.pdf(?:$|\?)|pdf\.worker/.test(u)))throw Error('Master plan requested PDF or PDF worker');
  await page.waitForFunction(()=>document.querySelector('.plan-caption')?.textContent.includes('Zoom in to explore'));
  await page.screenshot({path:`qa/${config.name}-plan.png`});
  if(config.name==='mobile'){
   const before=await page.evaluate(()=>document.querySelector('.webgl').__sceneDiagnostics.renders);
   await page.waitForTimeout(600);
   const after=await page.evaluate(()=>document.querySelector('.webgl').__sceneDiagnostics);
   if(!after.paused || after.renders!==before)throw Error('3D keeps rendering over the master plan');
   explore.pausesOverPlan=true;
  }
  await page.getByRole('button',{name:'Zoom in',exact:true}).click();
  await page.getByRole('button',{name:'Zoom in',exact:true}).click();
  if(await page.locator('.plan-tools output').textContent()!=='150%')throw Error('Zoom failed');
  await page.getByRole('button',{name:'Fit plan to view'}).click();
  if(config.name==='desktop'){
   const before=await page.evaluate(()=>scrollY);
   await page.locator('.plan-viewport').hover();await page.mouse.wheel(0,180);
   await page.waitForFunction(before=>scrollY>before+20,before);
  }
  await page.getByRole('button',{name:'View fullscreen'}).click();
  if(await page.getByRole('dialog').count()!==1)throw Error('Fullscreen failed');
  await page.waitForTimeout(400);
  await page.waitForFunction(()=>document.querySelector('.plan-caption')?.textContent.includes('Zoom in to explore'));
  if(await page.getByRole('button',{name:'Exit fullscreen'}).isVisible()!==true)throw Error('Fullscreen controls hidden');
  await page.screenshot({path:`qa/${config.name}-fullscreen.png`});
  await page.keyboard.press('Escape');
  if(await page.getByRole('dialog').count()!==0)throw Error('Escape failed');
  await page.getByRole('button',{name:'Open chapters'}).click();
  await page.locator('#chapter-menu a[href="#closing"]').click();
  await page.waitForFunction(()=>document.getElementById('closing').getBoundingClientRect().top<20).catch(async()=>{throw Error(config.name+' closing navigation: '+JSON.stringify(await page.evaluate(()=>({top:document.getElementById('closing').getBoundingClientRect().top,y:scrollY,max:document.documentElement.scrollHeight-innerHeight,height:innerHeight,bodyOverflow:document.body.style.overflow}))));});
  await page.screenshot({path:`qa/${config.name}-closing.png`});
  await page.getByRole('link',{name:'Back to the beginning'}).click();
  await page.waitForFunction(()=>scrollY<110);
  if(config.name==='mobile'){
   await page.waitForFunction(()=>!document.querySelector('.webgl').__sceneDiagnostics.paused);
   await page.getByRole('button',{name:'Switch to image tour'}).click();
   await page.waitForFunction(()=>!document.querySelector('.webgl canvas'));
   explore.releasesRenderer=true;
  }
  if(errors.length || failures.length)throw Error(config.name+' browser failures: '+JSON.stringify({errors,failures}));
  results.push({viewport:config.name,chapters:count,interiorGroups:8,horizontalOverflow:overflow,masterPlan:'Direct 2384×1684 image; no PDF or worker requests',zoom:true,fullscreen:true,backToTop:true,explore,errors,failures});
  await context.close();
 }
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const page=await context.newPage();const requests=[];page.on('request',r=>requests.push(r.url()));
 await page.goto(base,{waitUntil:'networkidle'});
 if(requests.some(u=>u.endsWith('.glb')))throw Error('Reduced motion loads unnecessary GLB');
 results.push({reducedMotion:'image tour, no GLB request'});await context.close();
 const failedContext=await browser.newContext({viewport:{width:1440,height:960}});
 const failed=await failedContext.newPage();await failed.addInitScript(()=>Object.defineProperty(navigator,'deviceMemory',{get:()=>8}));
 await failed.route('**/*.glb',route=>route.abort());
 await failed.goto(base,{waitUntil:'networkidle'});
 await failed.getByRole('button',{name:'Enable 3D experience'}).waitFor();
 await failed.route('**/SITE_MASTERPLAN.pdf',route=>route.fulfill({status:500,body:'Test unavailable PDF'}));
 await failed.getByRole('link',{name:'The master plan',exact:true}).click();
 await failed.waitForFunction(()=>document.querySelector('.plan-sheet img')?.naturalWidth>0);
 results.push({failureRecovery:'Blocked GLB returns to image tour; master plan image works with PDF unavailable'});await failedContext.close();
 const missingContext=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),missing=await missingContext.newPage();
 await missing.route('**/images/interior/living*.webp',route=>route.abort());
 await missing.route('**/assets/masterplan.webp',route=>route.abort());
 await missing.goto(base,{waitUntil:'networkidle'});
 await missing.locator('#interior-living').scrollIntoViewIfNeeded();
 await missing.locator('#interior-living .image-placeholder').waitFor();
 await missing.locator('#masterplan').scrollIntoViewIfNeeded();
 await missing.getByRole('link',{name:'Open original master plan PDF'}).waitFor();
 assert.equal(await missing.locator('.plan-sheet img').count(),0);
 results.push({missingImages:'Clean interior placeholder and master-plan PDF link; no broken images'});await missingContext.close();
 }
 results.push({build:server?'production dist':'development'});
 await writeFile(process.argv.includes('--smoke')?'qa/final-smoke-results.json':'qa/browser-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
}catch(error){
 const page=browser.contexts().flatMap(c=>c.pages()).at(-1);
 if(page){await page.screenshot({path:'qa/browser-failure.png',scale:'css'});console.error(await page.evaluate(()=>({url:location.href,y:scrollY,bodyStyle:document.body.getAttribute('style'),current:document.querySelector('.chapter.current')?.id,interiorTop:document.getElementById('interiors')?.getBoundingClientRect().top,diagnostics:document.querySelector('.webgl')?.__sceneDiagnostics})));}
 throw error;
}finally{await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
