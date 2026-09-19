import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve,extname} from 'node:path';
import {checkExperience,checkRecovery} from './experience-qa.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/worra/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-unsafe-swiftshader','--use-gl=angle']});
let server;const results=[];
if(process.argv.includes('--production')){
 const root=resolve('dist'),types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.pdf':'application/pdf','.glb':'model/gltf-binary','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2'};
 server=createServer(async(req,res)=>{try{const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(path!==root&&!path.startsWith(root+'\\')){res.writeHead(403).end();return;}const file=path===root?resolve(root,'index.html'):path,data=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Content-Length':data.length});res.end(data);}catch{res.writeHead(404).end();}});
 await new Promise(resolve=>server.listen(4173,'127.0.0.1',resolve));
}
const base=server?'http://127.0.0.1:4173/':process.env.QA_URL||'http://127.0.0.1:5173/';
try{
 if(process.argv.includes('--hotspot-images')){
  const {checkHotspotImages}=await import('./hotspot-image-qa.mjs');
  for(const mobile of [false,true])results.push(await checkHotspotImages(browser,base,mobile));
 }else{
 for(const mobile of process.argv.includes('--mobile')?[true]:[false,true]){
  console.log(`Checking ${mobile?'mobile':'desktop'} Explore, gallery and master plan…`);
  results.push(await checkExperience(browser,base,mobile));
 }
 results.push(await checkRecovery(browser,base));
 }
 results.push({build:server?'production dist':'development'});
 await writeFile(process.argv.includes('--hotspot-images')?'qa/hotspot-image-results.json':'qa/browser-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
}catch(error){
 const page=browser.contexts().flatMap(context=>context.pages()).at(-1);
 if(page){await page.screenshot({path:'qa/browser-failure.png',scale:'css'});console.error(await page.evaluate(()=>({url:location.href,scrollY,bodyStyle:document.body.getAttribute('style'),diagnostics:document.querySelector('.webgl')?.__sceneDiagnostics,plan:{zoom:document.querySelector('.plan-viewport')?.dataset.zoom,panX:document.querySelector('.plan-viewport')?.dataset.panX,panY:document.querySelector('.plan-viewport')?.dataset.panY}})));}
 throw error;
}finally{await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
