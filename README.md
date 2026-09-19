# Shangri-La Hua Hin

A scroll-driven architectural presentation, built with React, Vite, Three.js, GSAP ScrollTrigger and Lenis. All project geometry comes from `SHANGRILA_MASTER_REFINED.blend`.

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
- Mobile, touch tablets, reduced-motion preferences, data-saver connections and low-memory devices begin in the image tour. Visitors can opt into 3D.
- Touch and small-screen devices use the 11.1 MB mobile model. The device profile stays stable when rotating the screen. Touch scrolling is native; desktop wheel scrolling uses Lenis.
- Mobile renders at a maximum pixel ratio of 1, with MSAA and shadow maps disabled. Environment and directional lighting remain. Pixel ratio can fall to 0.7 under sustained load; desktop retains shadows and a maximum ratio of 1.5.
- Rendering runs while the camera eases, stops completely at rest, and pauses over the plan or while the browser tab is hidden. Animated rendering is capped at 60 Hz. Scroll, resize and visibility changes wake it again.
- WebGL failure or context loss returns to the image tour. Switching to images aborts pending model downloads and releases the renderer and geometry.
- The master plan is a direct 2384×1684 WebP image rendered from the original drawing. It supports zoom, mouse drag, native touch pan, keyboard pan, fullscreen, opening in a new tab and image download. Escape closes fullscreen and restores focus. It needs no PDF viewer, PDF request or worker.
- Fonts, both models and images are served locally; no runtime CDN is needed.

## Source assets and fidelity

Source file: `../03_BLENDER/SHANGRILA_MASTER_REFINED.blend`.

Master plan: `../00_ORIGINAL/SITE_MASTERPLAN.pdf`, 18 September 2026. The page displays and downloads `public/assets/masterplan.webp`. A byte-identical copy of the original PDF remains in the assets for archival use. Building A/B and aerial posters use the latest pages 2–6 review renders. Interior imagery uses the source-corrected interior review. Other posters come from the existing refined review renders; the evening poster predates the latest facade pass, while live 3D always uses the current model.

The original Blender and PDF files are never saved over. Hidden archive/reference collections, cameras and lights are excluded from the GLB. Source dimensions, architecture, site layout and interiors are retained. Small bevels and thin curve sections use fewer radial segments in the web export. Spatial batches undergo bounded mesh simplification, then merge by original collection and material, followed by meshopt compression. The large context ground stays separate to protect the precision of the roads. The desktop model is approximately 24.8 MB with 150 material primitives and 2.12 million triangles. Blender procedural finishes are reduced to their original material base colours and roughness; complex offline shading is not reproduced exactly. Glass uses real-time transparency, and dusk is a presentation lighting treatment.

The mobile model retains the same 17,080 source objects, 46 exported batches and source camera path. Leaf fans become flat quads without removing leaves; bevel modifiers up to 3 cm are disabled and thin curves use four-sided cross sections. It contains 1.30 million triangles in 11.1 MB: about 39% fewer triangles and 55% fewer download bytes than desktop. This simplifies small surface details without removing buildings, interiors or planting locations.

The GLB is an architectural presentation asset. Original model coordination qualifications remain applicable; see `../03_BLENDER/MODEL_COORDINATION_NOTES.md`.

## Project structure

```text
src/main.jsx             Narrative, navigation, mode switching, scroll lifecycle
src/story.js             Chapter copy and source-camera choreography
src/scene.js             Three.js renderer, lighting, loading and cleanup
src/MasterPlan.jsx       Direct plan image, zoom, pan and fullscreen
src/device.js            Stable mobile/touch rendering profile
src/style.css            Responsive visual system
public/assets/           Desktop/mobile GLBs, cameras, WebP images and archived PDF
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
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' -b '..\03_BLENDER\SHANGRILA_MASTER_REFINED.blend' --python 'scripts\export_web.py' -- --mobile
node scripts/optimize.mjs --mobile
npm run check:assets
npm run build
```

`export_web.py` writes only into this project. Large intermediate GLBs stay in `qa/` and are ignored by Git. Both deployable models are included under `public/assets/`. Desktop and `mobile-` export/optimization reports in `qa/` record source hashes, batch counts and sizes.

## Verification

`npm run check:assets` validates both GLB headers, meshopt compression, matching scene batches, the mobile size reduction, source camera set, image files, unchanged source Blender and archived PDF.

Run `node scripts/browser-qa.mjs --production` after building. Checks cover 1440×960 desktop, 820×1180 touch tablet, 390×844 mobile, all ten chapters, navigation, image zoom/fit/fullscreen/Escape, no PDF/worker requests, no horizontal overflow, reduced-motion loading and failed-model recovery. Mobile checks opt into 3D with DPR 3 and 4× CPU throttling, verify the smaller model and render resolution, exercise a native touch gesture and screen rotation, and verify zero idle frames, pausing over the plan and renderer cleanup. `qa/browser-results.json` records the result.

These are local headless Edge tests, not physical iOS/Android GPU benchmarks. The earlier `qa/scene-results.json` records browser animation callbacks, not 3D throughput. No phone frame-rate guarantee is inferred from it. Final performance depends on device GPU, network and browser; the image tour is available throughout. Browser scripts use the bundled Playwright runtime; set `PLAYWRIGHT_MODULE` if using a different installation.
