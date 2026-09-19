"""Prepare existing presentation images; never upscale or alter their design."""
from pathlib import Path
from PIL import Image
import hashlib, json

root = Path(__file__).resolve().parents[1]
source_root = root.parent / '06_INTERIOR_PRESENTATION_IMAGES'
entries = [
 ('living', '03_FINAL_OUTPUT', '001_MAIN_LIVING_HERO.png'),
 ('dining', '03_FINAL_OUTPUT', '002_MAIN_DINING_HERO.png'),
 ('kitchen', '03_FINAL_OUTPUT', '003_MAIN_KITCHEN_HERO.png'),
 ('bedroom', '02_DRAFT_OUTPUT', '004_MAIN_BEDROOM_MASTER_HERO.png'),
 ('bathroom', '02_DRAFT_OUTPUT', '005_MAIN_BATHROOM_MASTER_HERO.png'),
 ('restaurant', '02_DRAFT_OUTPUT', '014_RESTAURANT_DINING_HERO.png'),
 ('spa', '02_DRAFT_OUTPUT', '019_P05_SPA_HERO.png'),
 ('sauna', '02_DRAFT_OUTPUT', '020_P05_SAUNA_HERO.png'),
 ('staff', '02_DRAFT_OUTPUT', '021_P06_STAFFROOM_TYPICAL_HERO.png'),
]
output = root / 'public/images/interior'
output.mkdir(parents=True, exist_ok=True)
assets, report, missing = {}, [], []
for key, folder, filename in entries:
 source = source_root / folder / filename
 if not source.exists():
  missing.append(str(source)); assets[key] = None; continue
 with Image.open(source) as original:
  original = original.convert('RGB')
  full = original.copy(); full.thumbnail((2400,2400), Image.Resampling.LANCZOS)
  small = original.copy(); small.thumbnail((960,960), Image.Resampling.LANCZOS)
  full.save(output/f'{key}.webp', 'WEBP', quality=95, method=6)
  small.save(output/f'{key}-960.webp', 'WEBP', quality=94, method=6)
  assets[key] = {'src':f'/images/interior/{key}.webp', 'small':f'/images/interior/{key}-960.webp', 'width':full.width, 'height':full.height, 'smallWidth':small.width, 'concept':folder=='02_DRAFT_OUTPUT'}
  report.append({'id':key,'source':str(source.relative_to(root.parent)), 'sha256':hashlib.sha256(source.read_bytes()).hexdigest(), 'sourceSize':original.size, 'webSize':full.size, 'provenance':'Provisional AI concept, not a current-model render' if folder=='02_DRAFT_OUTPUT' else 'Native image from original interior design PDF'})
(root/'src/data').mkdir(exist_ok=True)
(root/'src/data/interior-assets.json').write_text(json.dumps(assets,indent=2),encoding='utf-8')
(root/'qa/interior-assets.json').write_text(json.dumps({'images':report,'missing':missing,'missingFinals':['Master Bedroom','Master Bathroom','Restaurant Interior','P05 Spa / Sauna','P06 Staff Accommodation'],'policy':'Use existing concepts with visible Concept study captions. Never claim final source or current-model fidelity.'},indent=2),encoding='utf-8')
print(json.dumps({'prepared':len(report),'missing':missing}))
