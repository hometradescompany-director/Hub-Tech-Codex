# Optional V1 Babylon.js probe

This isolated, local synthetic fixture grants no authority. Root `v1.html` needs no renderer install.

From the repository root:

```sh
npm ci --ignore-scripts --prefix probes/v1-renderer
npm start --prefix probes/v1-renderer
# http://127.0.0.1:4184/
npm test --prefix probes/v1-renderer
npm run check --prefix probes/v1-renderer
```

The localhost process only serves static files. It owns no shared world, account or progression. Place buttons work through the same controller as mesh picks; Tab/Enter and ordinary touch buttons remain available when 3D fails or is disposed. Repeated mount replaces the old renderer. Camp connects to Training ground and Forge; the renderer adds no edges. Refusals preserve the current run. Reload starts a new local run.

For optional browser smoke, use operator-installed Playwright and Chromium. Set `CODEX_PRIMARY_RUNTIME_NODE_MODULES` to that dependency directory and `PROBE_EVIDENCE_DIR` to an existing directory outside tracked source, then run `node probes/v1-renderer/browser-smoke.cjs` while the static server runs. Desktop and mobile viewport checks use headless software rendering, not physical phone or headset performance.

Only `@babylonjs/core` 8.32.0 is installed, for scene/camera/mesh rendering. It is Apache-2.0, sourced from the BabylonJS/Babylon.js npm publication. Its `license.md` and `NOTICE.md` remain intact in the installation. No third-party models, textures, physics, compression assets or CDN requests are used. Full ESM `index.js` imports deliberately avoid an additional bundler; this is an unoptimized compatibility probe. See the dated receipt for integrity and footprint.
