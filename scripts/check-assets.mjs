import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const model=await readFile('public/assets/SHANGRILA_MASTER_REFINED.glb');
assert.equal(model.toString('ascii',0,4),'glTF');assert.equal(model.readUInt32LE(4),2);assert.equal(model.readUInt32LE(8),model.length);
const gltf=JSON.parse(model.subarray(20,20+model.readUInt32LE(12)).toString());
assert.equal(gltf.scenes.length,1,'Only the web scene should be exported');
assert(gltf.extensionsRequired.includes('EXT_meshopt_compression'));
assert(!gltf.nodes.some(n=>/ARCHIVE|REFERENCE|Cube/.test(n.name||'')),'Hidden/reference geometry leaked into export');
const cameras=JSON.parse(await readFile('public/assets/cameras.json','utf8'));
assert(cameras.length>=13);
for(const name of ['01_AERIAL','02_ENTRANCE','03_POOL','06_RESTAURANT','P26_A_HERO','P26_B_HERO','SOURCE_INTERIOR_SOUTH','07_P05','08_P06','13_GF_PARKING'])assert(cameras.some(c=>c.name===name),`Missing ${name}`);
const pdf=await readFile('public/assets/SITE_MASTERPLAN.pdf');
assert.equal(pdf.toString('ascii',0,4),'%PDF');
const source=await readFile('../00_ORIGINAL/SITE_MASTERPLAN.pdf');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
assert.equal(hash(pdf),hash(source),'The archived PDF must be byte-identical to the original');
for(const name of ['aerial','arrival','pool','pavilion','building-a','building-b','interior','facilities','parking','evening','masterplan'])assert((await stat(`public/assets/${name}.webp`)).size>1000);
const sourceModel=await readFile('../03_BLENDER/SHANGRILA_MASTER_REFINED.blend');
const report=JSON.parse(await readFile('qa/export-report.json','utf8'));
assert.equal(hash(sourceModel),report.source_sha256,'Source Blender file changed since export');
const interiors=JSON.parse(await readFile('src/data/interior-assets.json','utf8'));
assert.equal(interiors.length,29);
assert.equal(new Set(interiors.map(item=>item.sceneId)).size,28);
assert.equal(interiors.filter(item=>item.concept).length,23);
const plan=JSON.parse(await readFile('../06_INTERIOR_PRESENTATION_IMAGES/01_SCENE_LIST/SCENE_PLAN.json','utf8'));
assert.equal(plan.reduce((total,scene)=>total+scene.images.length,0),interiors.length);
for(const item of interiors){
 for(const path of [item.src,item.small])assert((await stat('public'+path)).size>1000,`Missing ${item.id}`);
}
const assetsReport=JSON.parse(await readFile('qa/interior-assets.json','utf8'));
for(const item of assetsReport.images)assert.equal(hash(await readFile('../'+item.source)),item.sha256,`Source image changed: ${item.id}`);
const hotspotAssets=JSON.parse(await readFile('qa/hotspot-assets.json','utf8'));
for(const item of Object.values(hotspotAssets)){assert.equal(hash(await readFile('../'+item.source)),item.sha256);assert((await stat('public'+item.output)).size>1000);}
console.log(`Assets verified: ${(model.length/1048576).toFixed(1)} MiB original-quality GLB on all devices, ${gltf.nodes.length} nodes, ${cameras.length} cameras, ${interiors.length} gallery images. Source Blender, PDF and images preserved.`);
