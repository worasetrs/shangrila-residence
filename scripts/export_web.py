"""Read-only source conversion. Run with Blender --background SOURCE.blend --python this.py.
No source .blend is saved. Preserve source geometry and evaluated edge modifiers;
batch by source collection and material, without changing any site dimensions.
"""
import bpy, json, math, time, hashlib, sys
import numpy as np
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
MOBILE = '--mobile' in sys.argv
RAW = ROOT/('qa/mobile-source-export.glb' if MOBILE else 'qa/source-export.glb')
source = bpy.data.scenes['SHANGRILA_MASTER']
bpy.context.window.scene = source
# Web-only tessellation of tiny rounded edges. This changes only this disposable
# background process, never the source file or the dimensions of any object.
for o in source.objects:
 for modifier in o.modifiers:
  if modifier.type=='BEVEL':
   modifier.segments=min(modifier.segments,1 if modifier.width<=.12 else 2)
   if MOBILE and modifier.width<=.03:modifier.show_viewport=False
 if o.type=='CURVE':o.data.bevel_resolution=min(o.data.bevel_resolution,0 if MOBILE else 1)
 # Each source canopy leaf is a five-vertex, four-triangle fan. Flatten only
 # its tiny centre ridge into a quad: every leaf, tree position and outline stays.
 if MOBILE and o.type=='MESH' and ('broadleaf canopy' in o.name or 'layered shrub foliage' in o.name):
  original=o.data
  if len(original.vertices)%5==0 and len(original.polygons)==len(original.vertices)//5*4:
   verts=[];faces=[];indices=[]
   for leaf in range(len(original.vertices)//5):
    start=len(verts);verts.extend(tuple(original.vertices[leaf*5+k].co) for k in range(4));faces.append(tuple(start+k for k in range(4)));indices.append(original.polygons[leaf*4].material_index)
   replacement=bpy.data.meshes.new(o.name+'_MOBILE_LEAVES');replacement.from_pydata(verts,[],faces)
   for material in original.materials:replacement.materials.append(material)
   replacement.polygons.foreach_set('material_index',indices);replacement.update();o.data=replacement
bpy.context.view_layer.update()
deps = bpy.context.evaluated_depsgraph_get()
groups = {}
object_groups = {}
def collect(c, group, hidden=False):
 hidden = hidden or c.hide_render or c.name in {'REFERENCE','SOURCE_CORRECTION_ARCHIVE','PROVISIONAL','REVIEW_CAMERAS'}
 if hidden: return
 for o in c.objects:
  if not o.hide_render and o.type in {'MESH','CURVE','FONT','SURFACE'}:
   object_groups[o.name] = group
 for sub in c.children: collect(sub, group, hidden)
for c in source.collection.children: collect(c,c.name)

# Keep the source material base colours/roughness. Blender-only procedural
# textures are reduced to their original PBR values; no synthetic textures added.
webmats={}
def webmat(original):
 key=original.name if original else 'Default'
 if key in webmats:return webmats[key]
 m=bpy.data.materials.new('WEB '+key);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF')
 orig=next((n for n in original.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None) if original and original.use_nodes else None
 col=(original.diffuse_color[:] if orig.inputs['Base Color'].is_linked else orig.inputs['Base Color'].default_value[:]) if orig else (original.diffuse_color[:] if original else (.6,.6,.6,1))
 p.inputs['Base Color'].default_value=col
 p.inputs['Roughness'].default_value=orig.inputs['Roughness'].default_value if orig else .6
 p.inputs['Metallic'].default_value=orig.inputs['Metallic'].default_value if orig else 0
 if orig:
  p.inputs['Emission Color'].default_value=orig.inputs['Emission Color'].default_value[:]
  p.inputs['Emission Strength'].default_value=min(orig.inputs['Emission Strength'].default_value,2)
 if 'glaz' in key.lower() or 'glass' in key.lower():
  p.inputs['Alpha'].default_value=.23
  m.surface_render_method='DITHERED'
 if 'water' in key.lower():
  p.inputs['Metallic'].default_value=.3;p.inputs['Roughness'].default_value=.19
 webmats[key]=m
 return m

started=time.time()
for i,(name,group) in enumerate(object_groups.items()):
 o=source.objects[name]
 evaluated=o.evaluated_get(deps)
 try: me=evaluated.to_mesh(preserve_all_data_layers=False,depsgraph=deps)
 except RuntimeError: continue
 if not me or not len(me.vertices):
  evaluated.to_mesh_clear();continue
 # Spatial buckets retain culling for interiors/floors and landscape.
 centre=o.matrix_world @ (sum((Vector(v) for v in o.bound_box),Vector())/8)
 cell=(int(centre.x//24),int(centre.y//24),int(centre.z//9))
 g=groups.setdefault((group,cell),{'v':[],'f':[],'mi':[],'smooth':[],'mats':[],'lookup':{},'n':0})
 coords=np.empty(len(me.vertices)*3,dtype=np.float32);me.vertices.foreach_get('co',coords)
 coords=coords.reshape(-1,3); matrix=np.array(o.matrix_world,dtype=np.float32)
 coords=coords@matrix[:3,:3].T+matrix[:3,3]
 start=g['n'];g['v'].append(coords);g['n']+=len(coords)
 slots={}
 for j,m in enumerate(me.materials):
  wm=webmat(m)
  if wm.name not in g['lookup']:g['lookup'][wm.name]=len(g['mats']);g['mats'].append(wm)
  slots[j]=g['lookup'][wm.name]
 if not slots:
  wm=webmat(None)
  if wm.name not in g['lookup']:g['lookup'][wm.name]=len(g['mats']);g['mats'].append(wm)
  slots[0]=g['lookup'][wm.name]
 for f in me.polygons:
  g['f'].append(tuple(start+k for k in f.vertices));g['mi'].append(slots.get(f.material_index,0));g['smooth'].append(f.use_smooth)
 evaluated.to_mesh_clear()
 if i%1500==0:print('BATCH',i,'/',len(object_groups),'seconds',round(time.time()-started),flush=True)

web=bpy.data.scenes.new('WEB_EXPORT');bpy.context.window.scene=web
for (name,cell),g in groups.items():
 me=bpy.data.meshes.new(name+str(cell));me.from_pydata(np.concatenate(g['v']).tolist(),[],g['f'])
 for m in g['mats']:me.materials.append(m)
 me.polygons.foreach_set('material_index',g['mi']);me.polygons.foreach_set('use_smooth',g['smooth']);me.update()
 obj=bpy.data.objects.new(name+'_'+str(cell),me);web.collection.objects.link(obj)
 del g['v'],g['f']
cams=[]
for o in source.objects:
 if o.type=='CAMERA':
  p=o.matrix_world.translation; d=o.matrix_world.to_quaternion()@Vector((0,0,-1))
  conv=lambda v:[round(v.x,5),round(v.z,5),round(-v.y,5)]
  cams.append({'name':o.name,'position':conv(p),'direction':conv(d),'fov':round(math.degrees(o.data.angle),3)})
if not MOBILE:(ROOT/'public/assets/cameras.json').write_text(json.dumps(cams,indent=2))
bpy.ops.export_scene.gltf(filepath=str(RAW),export_format='GLB',use_active_scene=True,use_visible=False,use_renderable=False,export_cameras=False,export_lights=False,export_animations=False,export_yup=True,export_texcoords=False,export_normals=True,export_materials='EXPORT')
report={'source':bpy.data.filepath,'source_sha256':hashlib.sha256(Path(bpy.data.filepath).read_bytes()).hexdigest(),'profile':'mobile' if MOBILE else 'desktop','source_objects':len(source.objects),'exported_source_objects':len(object_groups),'web_batches':len(web.objects),'materials':len(webmats),'seconds':round(time.time()-started),'geometry_policy':('Leaf fans converted to quads without removing leaves; sub-3cm bevels disabled; thin curves use four-sided cross sections. All buildings and interiors retained.' if MOBILE else 'Small bevel tessellation reduced. Source geometry and site dimensions retained.')+' Hidden archives/reference excluded; procedural finishes use original PBR base values.','export_bytes':RAW.stat().st_size}
(ROOT/('qa/mobile-export-report.json' if MOBILE else 'qa/export-report.json')).write_text(json.dumps(report,indent=2));print('EXPORT_COMPLETE',json.dumps(report),flush=True)
