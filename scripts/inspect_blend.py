import bpy, json
from pathlib import Path
from mathutils import Vector
out = Path('C:/Shangrila Working/06_WEB_PRESENTATION/qa')
scene = bpy.data.scenes.get('SHANGRILA_MASTER') or bpy.context.scene
bpy.context.window.scene = scene
def v(x): return [round(float(a), 4) for a in x]
info = {'scenes': [s.name for s in bpy.data.scenes], 'objects':len(scene.objects),
 'collections': {c.name:len(c.all_objects) for c in scene.collection.children},
 'cameras': [], 'materials': [], 'meshes': []}
for o in scene.objects:
 if o.type == 'CAMERA':
  info['cameras'].append({'name':o.name,'position':v(o.matrix_world.translation), 'direction':v(o.matrix_world.to_quaternion() @ Vector((0,0,-1))), 'lens':o.data.lens, 'type':o.data.type})
 elif o.type in {'MESH','CURVE'} and not o.hide_render:
  info['meshes'].append({'name':o.name,'type':o.type,'vertices':len(o.data.vertices) if o.type=='MESH' else 0,'polygons':len(o.data.polygons) if o.type=='MESH' else 0,'collections':[c.name for c in o.users_collection]})
for m in bpy.data.materials:
 info['materials'].append({'name':m.name,'diffuse':v(m.diffuse_color), 'nodes':[n.type for n in m.node_tree.nodes] if m.use_nodes else []})
(out/'blend-audit.json').write_text(json.dumps(info,indent=2))
print('WEB_AUDIT', json.dumps({k:v for k,v in info.items() if k not in ['meshes','materials']}))
print('GEOMETRY',sum(m['vertices'] for m in info['meshes']), 'VERTICES',sum(m['polygons'] for m in info['meshes']), 'POLYGONS')
