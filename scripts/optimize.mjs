import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dedup,prune,weld,meshopt,simplifyPrimitive,join} from '@gltf-transform/functions';
import {MeshoptEncoder,MeshoptDecoder,MeshoptSimplifier} from 'meshoptimizer';
import {writeFile,stat} from 'node:fs/promises';
await MeshoptEncoder.ready;await MeshoptDecoder.ready;await MeshoptSimplifier.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const mobile=process.argv.includes('--mobile');
const input=mobile?'qa/mobile-source-export.glb':'qa/source-export.glb',output=mobile?'public/assets/SHANGRILA_MOBILE.glb':'public/assets/SHANGRILA_MASTER_REFINED.glb';
const doc=await io.read(input);
await doc.transform(dedup(),weld(),prune());
// Constrain architectural error to 0.02% of each spatial batch's radius.
// Furniture and planting permit slightly more error, preserving source silhouettes.
for(const mesh of doc.getRoot().listMeshes()){
  const landscape=mesh.getName().startsWith('LANDSCAPE');
  const furniture=/^(INTERIOR|VEHICLES)/.test(mesh.getName());
  for(const p of mesh.listPrimitives())simplifyPrimitive(p,{simplifier:MeshoptSimplifier,ratio:landscape?.18:furniture?.3:.65,error:landscape?.003:furniture?.0007:.0002,lockBorder:true});
}
// Keep the 7.2 km context ground separate so its precision grid cannot shift
// millimetre-spaced road/site surfaces when quantizing architectural meshes.
const groups=['BUILDING_A','BUILDING_B','GUARDHOUSE','INTERIOR','LANDSCAPE','P05_POOL_FACILITIES','P06_STAFF_ACCOMMODATION','PARKING','PEDESTRIAN','POOL','POOL_DECK','RESTAURANT','ROAD','VEHICLES'];
for(const group of groups)await doc.transform(join({filter:node=>node.getName().startsWith(group+'_(')}));
await doc.transform(prune(),meshopt({encoder:MeshoptEncoder,level:'high',quantizePosition:16,quantizationVolume:'mesh'}));
await io.write(output,doc);
let triangles=0,primitives=0;
for(const mesh of doc.getRoot().listMeshes())for(const p of mesh.listPrimitives()){primitives++;triangles+=(p.getIndices()?.getCount()||p.getAttribute('POSITION').getCount())/3;}
const report={inputBytes:(await stat(input)).size,outputBytes:(await stat(output)).size,nodes:doc.getRoot().listNodes().length,meshes:doc.getRoot().listMeshes().length,primitives,triangles,compression:'EXT_meshopt_compression; quantized attributes; topology borders locked; architectural simplification error 0.02% of batch radius; furniture 0.07%; foliage 0.3%'};
await writeFile(mobile?'qa/mobile-optimization-report.json':'qa/optimization-report.json',JSON.stringify(report,null,2));console.log(report);
