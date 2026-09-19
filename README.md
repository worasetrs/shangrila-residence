# Shangri-La Hua Hin

A scroll-driven architectural presentation, built with React, Vite, Three.js, GSAP ScrollTrigger, Lenis and PDF.js. All project geometry comes from `SHANGRILA_MASTER_REFINED.blend`.

## Open locally

Requires Node.js 22.12+.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. For a production preview:

```sh
npm run build
npm run preview
```

## Netlify

The project is ready for a static Netlify deployment. Import this folder as a repository with build command `npm run build` and publish directory `dist`; `netlify.toml` supplies both settings. Alternatively, drag the contents of the built `dist` folder into Netlify's manual deployment interface. No API keys, backend, database or environment variables are required. The local preview has not been published to a Netlify account.

## Experience

Ten chapters cover the bird-eye view, project overview, arrival, pool, pavilion, Buildings A/B, original-design interiors, P05/P06/ground-floor parking, original master plan and closing view. The camera follows the scroll position, and chapter navigation works with mouse, keyboard and touch.

- Desktop loads the GLB asynchronously behind a source-rendered poster. The loading status never blocks navigation.
- Mobile, reduced-motion preferences, data-saver connections and low-memory devices begin in the image tour. Visitors can opt into 3D.
- WebGL failure or context loss returns to the image tour. The 3D/image switch releases the renderer when disabled.
- Rendering pauses while the plan is visible and when the browser tab is hidden; pixel ratio drops if the frame budget is exceeded.
- PDF.js loads near the final section. The original PDF supports zoom, mouse drag, native touch pan, keyboard pan, fullscreen, opening in a new tab and download. Escape closes fullscreen and restores focus. A rendered preview remains available if PDF.js fails.
- Fonts, the model, images, worker and original PDF are served locally; no runtime CDN is needed.

## Source assets and fidelity

Source file: `../03_BLENDER/SHANGRILA_MASTER_REFINED.blend`.

Master plan: `../00_ORIGINAL/SITE_MASTERPLAN.pdf`, 18 September 2026. The web download is byte-identical to this original. Building A/B and aerial posters use the latest pages 2–6 review renders. Interior imagery uses the source-corrected interior review. Other posters come from the existing refined review renders; the evening poster predates the latest facade pass, while live 3D always uses the current model.

The original Blender and PDF files are never saved over. Hidden archive/reference collections, cameras and lights are excluded from the GLB. Source dimensions, architecture, site layout and interiors are retained. Small bevels and thin curve sections use fewer radial segments in the web export. Spatial batches undergo bounded mesh simplification, then merge by original collection and material, followed by meshopt compression. The large context ground stays separate to protect the precision of the roads. The delivered model is approximately 24.8 MB with 150 material primitives and 2.12 million triangles. Blender procedural finishes are reduced to their original material base colours and roughness; complex offline shading is not reproduced exactly. Glass uses real-time transparency, and dusk is a presentation lighting treatment.

The GLB is an architectural presentation asset. Original model coordination qualifications remain applicable; see `../03_BLENDER/MODEL_COORDINATION_NOTES.md`.

## Project structure

```text
src/main.jsx             Narrative, navigation, mode switching, scroll lifecycle
src/story.js             Chapter copy and source-camera choreography
src/scene.js             Three.js renderer, lighting, loading and cleanup
src/MasterPlan.jsx       Lazy PDF viewer and fullscreen interaction
src/style.css            Responsive visual system
public/assets/           Compressed GLB, cameras, WebP posters and original PDF
scripts/export_web.py    Reproducible Blender conversion (source stays unchanged)
scripts/optimize.mjs     Geometry optimization and meshopt compression
scripts/check-assets.mjs Source integrity and GLB checks
qa/                     Export statistics and browser verification reports
netlify.toml             Netlify build and response headers
```

## Regenerate the model

Run the export in a Blender 5.2 background process (edit the source path if necessary):

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' -b '..\03_BLENDER\SHANGRILA_MASTER_REFINED.blend' --python 'scripts\export_web.py'
node scripts/optimize.mjs
npm run check:assets
npm run build
```

`export_web.py` writes only into this project. The large intermediate GLB stays in `qa/` and is ignored by Git. The deployable model is included under `public/assets/`. `qa/export-report.json` and `qa/optimization-report.json` record the source hash, batch counts and size.

## Verification

`npm run check:assets` validates the GLB header, meshopt requirement, source camera set, poster files, unchanged source Blender and unchanged PDF.

Browser checks cover 1440×960 desktop, 820×1180 tablet, 390×844 mobile, all ten chapters, navigation, PDF zoom/fit/fullscreen/Escape, no horizontal overflow and reduced-motion loading. `qa/browser-results.json` records the result. These are viewport tests on the local browser, not tests on physical iOS/Android devices. Browser scripts use the bundled Playwright runtime; set `PLAYWRIGHT_MODULE` if using a different installation.

Camera checkpoints and a local frame-time sample are recorded separately. The local headless Edge sample was approximately 60 fps; this is not a guarantee for other devices. Final performance depends on device GPU, network and browser; the image tour is available throughout.
