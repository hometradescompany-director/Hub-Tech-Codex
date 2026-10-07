# V1 renderer browser verification receipt

Observed 8 October 2026 in the isolated verification environment. Tested renderer source: `feature/v1-renderer-probe` at **`08273bba54c5a74fd17219cffb65bbfeb4ee22bc`**. This verifies that optional local fixture probe only; it does not change the renderer, fixture engine, root UI or canonical V1 standing.

## Runtime and tooling

- Node.js **v22.23.3**, npm **10.9.9**.
- Chromium **154.0.8037.0**, `/usr/bin/chromium`, supplied by this environment. The browser package provenance/licence was not independently available; no browser binary was installed or redistributed.
- Playwright **1.63.0**, Apache-2.0, from the public Microsoft Playwright npm package (`https://github.com/microsoft/playwright`, `https://registry.npmjs.org/playwright`). Installed only in `/tmp/v1-browser-runtime`, not in root or probe dependencies. The GitHub advisory database reported no known vulnerabilities for `playwright@1.63.0`.
- Babylon.js **8.32.0**, Apache-2.0, installed from the probe lockfile with scripts disabled. Its source, integrity, notices and footprint remain documented in [the implementation receipt](2026-10-08-v1-renderer-probe.md).
- Headless Chromium used `--use-angle=swiftshader --enable-unsafe-swiftshader`; the live WebGL 2 context reported `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)`.

Setup and browser command:

```sh
npm ci --ignore-scripts --prefix probes/v1-renderer
npm install --prefix /tmp/v1-browser-runtime --ignore-scripts --no-audit --no-fund --save-exact playwright@1.63.0
CODEX_PRIMARY_RUNTIME_NODE_MODULES=/tmp/v1-browser-runtime/node_modules \
PROBE_CHROMIUM_EXECUTABLE=/usr/bin/chromium \
PROBE_EVIDENCE_DIR=/tmp/v1-renderer-evidence \
node probes/v1-renderer/browser-smoke.cjs
```

The optional smoke now starts the static server on an available loopback port and closes pages, browser and server in `finally`, including on failure. It starts no external service.

## Results

The real pinned SDK created an active WebGL 2 scene in both headless viewports:

| Browser viewport | Canvas backing size | Local requests | Decoded response-body bytes |
| --- | ---: | ---: | ---: |
| 1280 × 800 desktop | 1000 × 420 | 2,085 | 15,626,451 |
| 390 × 844 mobile viewport | 366 × 260 | 2,085 | 15,626,451 |

Requests were observed from navigation through interaction and response bodies were awaited before summing their decoded byte lengths. Every request stayed on the probe's `127.0.0.1` origin. These are response-body bytes, not compressed wire transfer; they are not production performance, load-time or memory measurements.

- No console or page errors occurred in the desktop/mobile main scenarios.
- Camera orbit and rendered frames left the visible fixture snapshot and revision unchanged. Semantic legal movement, an unreachable move refusal with identical snapshot/revision, keyboard Enter activation, practice, and an actual Babylon mesh pick through the same move path passed.
- Disposal left semantic controls usable; remount restored active 3D and preserved fixture use.
- The browser's real `WEBGL_lose_context` extension caused the explicit context-lost fallback; semantic movement continued to work. No console/page errors occurred.
- Missing SDK was tested by returning a local HTTP 404 for the pinned SDK entry. Explicit textual fallback and semantic movement passed, with no page error. Chromium emitted the expected single resource 404 console message.
- For the stale-load case, the actual SDK entry request was held, initial and overlapping mounts were started, and the renderer was disposed before the request was released. When the pinned SDK finished loading, disposed status and fixture state remained unchanged, controls still worked, and no page/console errors occurred.
- No renderer defect was reproduced. The initial browser run exposed only a smoke-coordinate issue after browser-driven scrolling; the smoke now resets the viewport before locating a real mesh-pick point. No adapter/view/controller/engine changes were made.

## Evidence and limits

Screenshots were captured outside tracked source:

- `/tmp/v1-renderer-evidence/desktop-1280x800.png` — 1280 × 1388 full-page capture.
- `/tmp/v1-renderer-evidence/mobile-viewport-390x844.png` — 390 × 1402 full-page capture.

These files are local ephemeral evidence; no supported PR artifact-upload mechanism was available in this session, so screenshots are neither committed nor attached. A mobile-sized viewport is not a touchscreen or physical phone. Physical phone, headset/WebXR, production GPU behavior, GPU memory, performance and compressed transfer remain unmeasured.

Checks:

- `npm test`: **50/50 passed**.
- `npm run check`: passed.
- `npm test --prefix probes/v1-renderer`: **4/4 passed**.
- `npm run check --prefix probes/v1-renderer`: passed.
- `node --check probes/v1-renderer/browser-smoke.cjs` and `git diff --check`: passed.
- The Foundation checks run for the verification PR had `action_required` and zero jobs; there were no failed-job logs. That workflow status is not counted as a test result.
