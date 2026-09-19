"""Keep hotspot imagery tied to the existing source review renders."""
from pathlib import Path
from PIL import Image
import json, hashlib
root=Path(__file__).resolve().parents[1]
source=root.parent/'03_BLENDER/review/12_P05_REVIEW.png'
destination=root/'public/images/hotspots/p05.webp'
destination.parent.mkdir(parents=True,exist_ok=True)
with Image.open(source) as image:
 image=image.convert('RGB');image.thumbnail((1200,1200),Image.Resampling.LANCZOS)
 image.save(destination,'WEBP',quality=94,method=6)
(root/'qa/hotspot-assets.json').write_text(json.dumps({'p05':{'source':str(source.relative_to(root.parent)),'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'output':'/images/hotspots/p05.webp'}},indent=2),encoding='utf-8')
print('Prepared source P05 hotspot image')
