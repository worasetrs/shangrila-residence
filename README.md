# Shangri-La Residence · Hua Hin

An architectural presentation built on the existing Shangri-La visual identity with React, Vite, Three.js, GSAP ScrollTrigger and Lenis. The source architecture is unchanged.

## Run and deploy

Requires Node.js 22.12 or newer.

```sh
npm ci
npm run dev
npm run build
npm run preview
```

Netlify repository deployment: build command `npm run build`, publish directory `dist`. `netlify.toml` contains these settings. For manual deployment, extract `SHANGRILA_WEB_NETLIFY.zip` and upload the extracted folder containing `index.html`. No backend, API keys or environment variables are needed. GitHub push and Netlify publication are separate; this task does not configure a Netlify account.

## The experience

Eight main chapters: bird-eye hero, project orbit, arrival, pool/common areas, Explore, interior imagery, master plan and evening closing. Navigation and the camera path follow this order. The opening has one subtle four-second camera drift; reduced-motion users see no drift.

**Guided tour:** scrolling moves the exterior camera through the source views and elevated connecting shots. Touch devices use native page scrolling; desktop wheel input uses Lenis. The interior section uses images, with no live interior camera sequence.

**Explore:** explicit opt-in in chapter five. Left-drag rotates, wheel zooms and right-drag pans. Touch uses one finger to rotate and two fingers to zoom/pan. Arrow keys pan when the canvas is focused. Instructions appear once. Reset View and Back to overview use a 1.25-second camera transition. Continue Tour returns to the current guided camera before releasing the page and moving to interiors. Exit Explore or Escape returns to the same section. Reduced motion makes these transitions immediate.

Explore stops the scroll camera and locks the page only while active. Focus is contained in the Explore dialog; background navigation is inert. Camera distance, polar angle and target bounds are constrained. Inflated bounds from source buildings prevent entering or crossing building volumes during orbit/pan/zoom; preset focus transitions travel above those buildings. These conservative exterior bounds intentionally keep some close views out of reach. Seven accessible hotspots focus the source cameras and show an image/details panel with Back to overview.

**Mobile quality restored:** phones load the same `SHANGRILA_MASTER_REFINED.glb` as desktop. Antialiasing is enabled, pixel ratio is capped at 1.5, and the original cached 2048px shadows are restored. There is no automatic drop to the former pixel ratio of 0.7 or stripped mobile geometry. Image mode is the initial experience on touch, low-memory, data-saver and reduced-motion devices; 3D remains opt-in. The device choice stays stable on rotation.

Rendering occurs during camera motion or interaction, then stops entirely at rest. It pauses over interiors/master plan/closing and in hidden tabs. Shadow maps are computed once for the static scene. Animation is capped at 60 Hz. Model downloads are abortable; switching to images releases the renderer. WebGL failure/context loss returns to a visible image tour.

**Lighting and colour:** warm side sunlight, a restrained cool fill and a softer ambient balance bring out the ivory facades and bronze finishes. An outdoor sky is baked once into the reflection map. Existing architectural light strips have a warmer glow, planting uses deeper greens, and the turquoise pool has subtle static ripple normals that catch the light as the camera moves. These are presentation material/lighting adjustments; the source architecture and model geometry are unchanged. The effect uses the same single cached shadow map on desktop and mobile, with no post-processing or continuous water animation.

## Asset paths and provenance

| Asset | Runtime path | Source |
| --- | --- | --- |
| Full-quality model | `public/assets/SHANGRILA_MASTER_REFINED.glb` | `../03_BLENDER/SHANGRILA_MASTER_REFINED.blend` |
| Camera poses | `public/assets/cameras.json` | 28 cameras from the source Blender scene |
| Exterior fallback/closing | `public/assets/*.webp` | Existing project review renders |
| Master plan preview | `public/assets/masterplan.webp` | Rasterized original `SITE_MASTERPLAN.pdf`, 2384×1684 |
| Original master plan | `public/assets/SITE_MASTERPLAN.pdf` | Byte-identical source PDF |
| Interior images | `public/images/interior/*.webp` | Existing interior presentation exports and concepts |
| P05 hotspot image | `public/images/hotspots/p05.webp` | `../03_BLENDER/review/12_P05_REVIEW.png` |

The 24.8 MB model contains 2.12 million triangles and 150 material primitives. Geometry was spatially batched, conservatively simplified and meshopt-compressed. The broad context ground stays separate for road precision. Original object dimensions and site layout are retained. Blender procedural finishes are exported as base colours/roughness, with runtime presentation adjustments in `src/lighting.js`; real-time shading differs from offline rendering. The evening poster is an existing presentation image and predates the latest facade pass.

Interior storytelling contains eight groups and nine images: Main Living, Dining, Kitchen, Master Bedroom, Master Bathroom, Restaurant Interior, P05 Spa/Sauna and P06 Staff Accommodation. Living/Dining/Kitchen are native images from the original interior design PDF (`06_INTERIOR_PRESENTATION_IMAGES/03_FINAL_OUTPUT`). The remaining images are existing **provisional AI concept studies**, visibly captioned **CONCEPT STUDY · DESIGN UNDER REVIEW**. They are not claimed to be final approved designs or current-model renders. P06 uses the staff-room image, avoiding the known lounge layout discrepancy. No unfinished files from the concurrently developed photoreal render folder are used.

`qa/interior-assets.json` records exact source paths/hashes, provenance, missing assets and groups still awaiting final images. There are currently no missing image files; five groups lack final source imagery and use the labelled concepts. Missing or failed images display a clean placeholder. Images use responsive WebP variants, lazy decoding/loading and no artificial upscaling. Native Kitchen resolution is 1264×841.

The master plan stays a direct image with zoom, mouse drag, native touch pan, keyboard pan and fullscreen. No PDF.js, worker or iframe is loaded. The original PDF is available as an explicit link. If the image fails, its viewer displays a PDF link instead of a broken image. All assets and fonts are local; no runtime CDN is used.

## Code map

```text
src/main.jsx                         Navigation, mode and scroll lifecycle
src/scene.js                         Original-quality rendering/loading/cleanup
src/lighting.js                      Warm sunlight, outdoor reflections and material grading
src/explorer.js                      Orbit controls, bounds and camera transitions
src/story.js                         Central exterior camera keyframes
src/data/project.js                 Chapters and interior story configuration
src/data/hotspots.js                 Hotspot/source-camera definitions and limits
src/data/interior-assets.json        Generated responsive image manifest
src/components/ExploreControls.jsx   Explore toolbar, hotspot buttons and details
src/components/InteriorGallery.jsx   Image story and failure placeholders
src/components/LoadingScreen.jsx     Minimal non-blocking loading indicator
src/MasterPlan.jsx                   Master plan image viewer
src/style.css                       Existing brand system
src/experience.css                  Interactive/editorial responsive extensions
```

To regenerate imagery, run `python scripts/prepare-interiors.py` with Pillow installed. It reads existing project files, writes WebP variants and updates the manifests. Update the corresponding image entry and provenance when final images become available.

`python scripts/prepare-hotspots.py` prepares the P05 exterior review image and its provenance manifest. Other hotspot images reuse the existing exterior posters.

To regenerate the model, run Blender 5.2 in background mode against the original source, then optimize. No source `.blend` is saved over:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' -b '..\03_BLENDER\SHANGRILA_MASTER_REFINED.blend' --python 'scripts\export_web.py'
node scripts/optimize.mjs
```

The older optional `--mobile` conversion and its reports describe a superseded experiment. The live site never selects that model; regeneration of that tier is unnecessary.

## Verification

```sh
npm run check:assets
npm run build
node scripts/browser-qa.mjs --production
node scripts/browser-qa.mjs --production --smoke
node scripts/browser-qa.mjs --production --lighting
```

Asset checks verify GLB structure/compression, required source cameras, unchanged source Blender/PDF and source image hashes. Production browser checks cover desktop, touch tablet and a DPR-3 mobile viewport: guided navigation, rotate/zoom/pan including real touch events, seven hotspots, reset, camera clearance, smooth return, scroll release, rotation, idle rendering, eight interior groups, spa/sauna switching, master plan controls, reduced motion and asset-failure recovery. Results and screenshots are in `qa/`. Browser scripts use the bundled Playwright installation; set `PLAYWRIGHT_MODULE` to use another installation.

These checks run in headless Edge on the local machine, not physical iOS/Android hardware. Rendering speed depends on the device GPU and network; no phone frame-rate guarantee is inferred from browser callbacks.

The lighting check captures overview, Building A and pool views at desktop and mobile sizes, checks shader/browser errors, confirms original model quality and zero idle frames, and recreates the renderer after switching to images. Its results are in `qa/lighting-results.json`.
