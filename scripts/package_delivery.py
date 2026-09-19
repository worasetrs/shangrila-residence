"""Package source and static Netlify output without node_modules or working files."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json

root = Path(__file__).resolve().parents[1]
destination = root.parent / '04_FINAL' / 'SHANGRILA_WEB'
destination.mkdir(parents=True, exist_ok=True)
ignored = {'node_modules', 'dist', '.git', '.sites-runtime'}
source_files = [p for p in root.rglob('*') if p.is_file()
                and not any(part in ignored for part in p.relative_to(root).parts)
                and not (p.parent.name == 'qa' and (p.suffix in {'.glb', '.png', '.log'} or p.name == 'blend-audit.json'))]
jobs = [('SHANGRILA_WEB_SOURCE.zip', source_files, root),
        ('SHANGRILA_WEB_NETLIFY.zip', [p for p in (root/'dist').rglob('*') if p.is_file()], root/'dist')]
for filename, files, base in jobs:
    with ZipFile(destination/filename, 'w', ZIP_DEFLATED, compresslevel=6) as archive:
        for path in files:
            archive.write(path, path.relative_to(base).as_posix())
    with ZipFile(destination/filename) as archive:
        assert archive.testzip() is None
        assert 'index.html' in archive.namelist()
    print(filename, (destination/filename).stat().st_size, 'bytes', len(files), 'files')
(destination/'START_HERE.txt').write_text(
    'SHANGRI-LA HUA HIN — 3D WEB PRESENTATION\n\n'
    'Local preview: http://127.0.0.1:5173/ (while the development server is running)\n'
    'Source: extract SHANGRILA_WEB_SOURCE.zip, then npm ci and npm run dev.\n'
    'Production: extract SHANGRILA_WEB_NETLIFY.zip and upload the extracted folder to Netlify.\n'
    'Repository deployment: build command npm run build; publish directory dist.\n'
    'Read README.md in the source archive for details. No credentials are required.\n'
    'The source Blender file and original master plan PDF are preserved.\n'
    'The site has not been published to a Netlify account.\n', encoding='utf-8')
