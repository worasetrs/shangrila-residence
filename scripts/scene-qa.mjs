import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/worra/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}});
 await page.addInitScript(()=>Object.defineProperty(navigator,'deviceMemory',{get:()=>8}));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('.webgl')).opacity==='1');
 await page.screenshot({path:'qa/scene-hero.png'});
 const shots=[['arrival',2],['pool',3],['pavilion',4],['building-a',5],['building-b',5.58],['interior',6],['kitchen',6.23],['p05',6.75],['p06',7],['parking',7.35]];
 for(const [name,t] of (process.argv.includes('--quick')?[]:shots)){
  await page.evaluate(t=>{const el=document.querySelector('.journey');window.scrollTo(0,el.offsetHeight*t/8);},t);
  // Camera's damped position and CSS transitions settle before visual inspection.
  await page.waitForTimeout(1800);
  await page.screenshot({path:`qa/scene-${name}.png`});
 }
 const frameTimes=await page.evaluate(()=>new Promise(resolve=>{let frames=[],last=performance.now();function tick(now){frames.push(now-last);last=now;if(frames.length<90)requestAnimationFrame(tick);else resolve(frames);}requestAnimationFrame(tick);}));
 const average=frameTimes.slice(5).reduce((a,b)=>a+b,0)/85;
 await writeFile('qa/scene-results.json',JSON.stringify({errors,averageFrameMs:average,approximateFps:1000/average,environment:'Headless Edge, local machine. Not a mobile hardware benchmark.'},null,2));
 console.log({errors,averageFrameMs:average,approximateFps:1000/average});
}finally{await browser.close();}
