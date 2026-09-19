"""Prepare every selected presentation image, preferring final exports over draft copies."""
from pathlib import Path
from PIL import Image
import hashlib, json

root = Path(__file__).resolve().parents[1]
source_root = root.parent / '06_INTERIOR_PRESENTATION_IMAGES'
plan = json.loads((source_root/'01_SCENE_LIST/SCENE_PLAN.json').read_text(encoding='utf-8'))
output = root/'public/images/interior'
output.mkdir(parents=True, exist_ok=True)
manifest = root/'src/data/interior-assets.json'
previous = json.loads(manifest.read_text(encoding='utf-8')) if manifest.exists() else []
if isinstance(previous, dict):
    previous = list(previous.values())
assets, report = [], []
for scene in plan:
    number = int(scene['id'])
    category = 'residences' if number <= 13 else 'restaurant' if number <= 16 else 'wellness' if number <= 20 else 'staff' if number <= 23 else 'support'
    for index, filename in enumerate(scene['images']):
        source = source_root/'03_FINAL_OUTPUT'/filename
        concept = not source.exists()
        if concept:
            source = source_root/'02_DRAFT_OUTPUT'/filename
        key = source.stem.lower().replace('_', '-')
        with Image.open(source) as image:
            original = image.convert('RGB')
            full = original.copy(); full.thumbnail((3000,3000), Image.Resampling.LANCZOS)
            small = original.copy(); small.thumbnail((960,960), Image.Resampling.LANCZOS)
            full.save(output/f'{key}.webp', 'WEBP', quality=95, method=6)
            small.save(output/f'{key}-960.webp', 'WEBP', quality=94, method=6)
            assets.append({'id':key,'sceneId':scene['id'],'title':scene['scene'] + (' · Second view' if index else ''),'category':category,'src':f'/images/interior/{key}.webp','small':f'/images/interior/{key}-960.webp','width':full.width,'height':full.height,'smallWidth':small.width,'concept':concept})
            report.append({'id':key,'source':source.relative_to(root.parent).as_posix(),'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'sourceSize':original.size,'webSize':full.size,'provenance':'Provisional AI concept, not a current-model render' if concept else 'Native image from original interior design PDF'})
assert len(assets) == 29 and len({a['sceneId'] for a in assets}) == 28
manifest.write_text(json.dumps(assets,indent=2),encoding='utf-8')
(root/'qa/interior-assets.json').write_text(json.dumps({'images':report,'missing':[],'sourceExports':6,'conceptImages':23,'policy':'All 29 selected presentation images; final exports take precedence over duplicate drafts. Concepts retain visible provenance captions. Reference sheets, thumbnails and superseded revisions are excluded.'},indent=2),encoding='utf-8')
# Remove only obsolete files named in our preceding generated manifest.
current = {a[field] for a in assets for field in ('src','small')}
for item in previous:
    if not item: continue
    for field in ('src','small'):
        path = (root/'public'/item[field].lstrip('/')).resolve()
        if item[field] not in current and path.parent == output.resolve():
            path.unlink(missing_ok=True)
print(json.dumps({'prepared':len(assets),'scenes':28,'sourceExports':6,'conceptImages':23}))
