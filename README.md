# Shangri-La Residence · Hua Hin

A direct 3D Explore experience, the complete presentation image gallery and the original site master plan. Built with React, Vite and Three.js, using the existing ivory/bronze visual identity.

## Run and deploy

Requires Node.js 22.12 or newer.

```sh
npm ci
npm run dev
npm run build
npm run preview
```

Netlify repository deployment uses `npm run build` and the `dist` publish directory, as configured in `netlify.toml`. For manual deployment, extract `SHANGRILA_WEB_NETLIFY.zip` and upload the folder containing `index.html`. No backend, API keys, environment variables or runtime CDN are required. GitHub push does not configure or publish to a Netlify account.

## The experience

**Explore opens automatically:** desktop, tablet and phone load the same model at the initial overview. Once loading completes, visitors can rotate, zoom, pan and select any of seven hotspots immediately. There is no entry button, guided tour, scroll-driven camera, automatic orbit or closing animation. Navigation stays available throughout; Gallery and Master plan are also linked from the viewer. A source exterior image and a gallery link remain visible during loading. If WebGL or the model fails, the gallery stays usable and Retry 3D restarts the viewer.

Drag to rotate, wheel or pinch to zoom, right-drag or two fingers to pan. Arrow keys pan when the canvas is focused. Plus/minus camera buttons and Reset View are provided. Reset and hotspot focus use smooth transitions above conservative building bounds; reduced-motion users get immediate transitions. Source-derived bounds keep the camera outside buildings, with distance, height, polar-angle and target limits. Moving between page sections preserves the user's camera.

**Original mobile quality:** all devices use the 24.8 MB `SHANGRILA_MASTER_REFINED.glb`, with antialiasing, a pixel-ratio cap of 1.5 and a cached 2048px shadow map. No stripped mobile model or adaptive resolution downgrade is selected. Rendering stops at rest, pauses when Explore leaves the visible area and pauses in hidden tabs. There is no body scroll lock for Explore. Pointer gestures belong to the canvas; visitors can use the visible Gallery/Master plan links or scroll outside it to continue.

**Warm lighting:** side sunlight, a restrained cool fill and a softer ambient balance bring out the ivory facades and bronze finishes. An outdoor sky is baked once into the reflection map. Existing architectural light strips glow warmly, planting uses deeper greens, and turquoise pool water has static ripple normals. This uses no post-processing or continuous water animation. The lighting and material grading do not change the source architecture.

**Gallery:** all 29 selected images from `../06_INTERIOR_PRESENTATION_IMAGES/01_SCENE_LIST/SCENE_PLAN.json` are included, covering 28 spaces. Native images from `03_FINAL_OUTPUT` take precedence over duplicate draft copies; the other selected images come from `02_DRAFT_OUTPUT`. Reference exports, thumbnails, contact sheets and superseded versions are not duplicated in the gallery. Filters cover Residences, Restaurant, Wellness, Staff and Support. Every image opens in a full-size modal with previous/next controls, keyboard navigation, Escape and focus restoration. Responsive WebP derivatives load lazily and are never upscaled.

Six images are native exports from the original interior PDF. The other 23 are existing provisional AI concept studies and retain visible **CONCEPT STUDY · DESIGN UNDER REVIEW** captions. They are not final approved designs or current-model renders. This includes the P06 lounge concept, whose open layout still differs from the model. The source review notes remain in the original image folder; `qa/interior-assets.json` records the selected files, hashes, dimensions and provenance.

**Master plan:** a direct 2384×1684 image, with no PDF.js, iframe or worker. One finger or a mouse drag pans; a two-finger pinch zooms around the fingers' midpoint. Zoom is clamped from 75% to 500%, and pan bounds keep the drawing in view. Buttons, keyboard +/−/0, arrow keys, Ctrl+wheel/trackpad pinch, Reset and fullscreen are available. Normal wheel scrolling outside fullscreen continues through the page. Gestures zoom only the drawing, not the browser page. Fullscreen supports rotation, Escape and focus restoration. The original PDF remains an explicit download and a fallback link if the image fails.

## Assets and source fidelity

| Asset | Runtime path | Source |
| --- | --- | --- |
| Full-quality model | `public/assets/SHANGRILA_MASTER_REFINED.glb` | `../03_BLENDER/SHANGRILA_MASTER_REFINED.blend` |
| Camera poses | `public/assets/cameras.json` | 28 cameras from the original Blender scene |
| Exterior loading/hotspot imagery | `public/assets/*.webp` | Existing project review renders |
| P05 hotspot | `public/images/hotspots/p05.webp` | `../03_BLENDER/review/12_P05_REVIEW.png` |
| Complete gallery | `public/images/interior/*.webp` | 29 selected images in `../06_INTERIOR_PRESENTATION_IMAGES` |
| Master plan preview | `public/assets/masterplan.webp` | Rasterized original site PDF |
| Original master plan | `public/assets/SITE_MASTERPLAN.pdf` | Byte-identical original PDF |

The model contains 2.12 million triangles and 150 material primitives. Its geometry is spatially batched, conservatively simplified and meshopt-compressed; the broad context ground remains separate for road precision. Original dimensions and layout are retained. Procedural Blender finishes are exported as base colours/roughness, then graded by `src/lighting.js`; real-time shading differs from offline rendering. Original Blender, PDF and image files are not overwritten.

## Code and asset preparation

`src/main.jsx` manages navigation and scene visibility. `src/scene.js` loads and renders the original model; `src/explorer.js` handles controls, bounds and source-camera focus; `src/lighting.js` holds the lighting and water shader. `src/components/InteriorGallery.jsx` renders the gallery and lightbox. `src/MasterPlan.jsx` owns the bounded pointer/pinch viewer. Styling is in `src/style.css`.

Run `python scripts/prepare-interiors.py` with Pillow installed to rebuild the gallery derivatives and manifests from the selected source list. The script prefers final exports, preserves original resolution up to 3000px and removes only obsolete derivatives identified by its previous manifest. `python scripts/prepare-hotspots.py` prepares the P05 image.

To regenerate the model, use Blender 5.2 against the original file, then optimize. Neither command saves over the source:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' -b '..\03_BLENDER\SHANGRILA_MASTER_REFINED.blend' --python 'scripts\export_web.py'
node scripts/optimize.mjs
```

The export script's older optional mobile conversion and associated historical reports are not used by the website.

## Verification and delivery

```sh
npm run check:assets
npm run build
node scripts/browser-qa.mjs --production
python scripts/package_delivery.py
```

Asset checks verify model structure/compression, source camera availability, all 29 gallery images, source image hashes, and unchanged source Blender/PDF. Browser QA checks desktop and a DPR-3 phone viewport: automatic Explore, rotation/zoom/pan, seven hotspots and camera clearance, idle/offscreen rendering, preserved camera, gallery filters, all images, full-image navigation and focus, real touch pinch/pan with an anchored midpoint on the master plan, zoom limits, fullscreen rotation, and model/image failure recovery. Current results are in `qa/browser-results.json`; screenshots are local QA outputs. Tests use headless Edge, not physical iOS/Android hardware. Set `PLAYWRIGHT_MODULE` to use a different Playwright installation.

Packaging writes source and static deployment ZIPs to `../04_FINAL/SHANGRILA_WEB`, excluding dependencies, Git metadata, screenshots and temporary working files.
