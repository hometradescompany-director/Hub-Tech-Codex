# Optional V1 renderer probe receipt

Observed in the isolated implementation worktree on 7 October 2026 UTC; the approved specification is dated 8 October in Brisbane. Scope: a local synthetic fixture display only; `grantsAuthority:false`. No admission, account, shared authoritative server, Atlas source or population work was added.

## Implemented boundary

`createSceneProjection(run)` replays all accepted fixture events and compares the complete recomputed run against its snapshot before exposing stable Camp/training/forge identities, rule version, revision and character. Display coordinates are explicitly probe-only. The existing engine and root UI/package remain unchanged. The isolated controller calls `act` and `replay`; buttons and SDK mesh picks propose the same move. Frames and camera have no transition access. Fixture refusals preserve the run, and retry keys use existing engine idempotency.

The optional page keeps semantic place/action buttons and readable state outside the canvas. SDK/WebGL construction failure, render/resize failure, context loss and explicit disposal report failure while preserving those controls. Disposal stops the render callback, removes adapter resize/context listeners and pointer observer, and disposes scene/engine (including SDK camera controls). Repeated disposal is idempotent; repeated mount disposes the prior renderer and guards outstanding SDK loads.

## Dependency and rights evidence

Selected `@babylonjs/core` **8.32.0**, solely for optional camera/mesh/scene rendering. `npm view @babylonjs/core@8.32.0 version license dist repository homepage --json` returned official package version, Apache-2.0, upstream `git+https://github.com/BabylonJS/Babylon.js.git` and `https://www.babylonjs.com`. Registry publication: https://registry.npmjs.org/@babylonjs/core/8.32.0 ; tarball: https://registry.npmjs.org/@babylonjs/core/-/core-8.32.0.tgz . Normal `npm install --ignore-scripts --no-audit --no-fund --prefix probes/v1-renderer` installed one package without escalation, global/root packages or extra tooling.

Lockfile integrity: `sha512-Z83WIe2eZEAOo5bb9Tjd+lY4ru6N8qgtZJGjWcoXOiP3BrtbatPUXdVKqm7m60ItQABFaVdMGygvIXY+wNXU/Q==`; registry shasum: `d01f8afdabb881637ff4344b8766751c4f4b462e`. Installed `license.md` declares Apache-2.0; `NOTICE.md` names Babylon.js and bundled Draco 1.5.6, Basis, GLSLang 11.8.0 and TWGSL Apache-2.0 notices. Both remain intact in the installed package. No external models/artwork/textures or compression services are used. Node modules are untracked and restored through the pinned lockfile.

Footprint measured from installed files: **6,395 files / 57,840,858 bytes**, matching registry unpacked size; JavaScript files total **18,099,178 bytes**, sum of individually gzip-compressed JavaScript files **3,995,957 bytes**. This is package/available static-asset footprint, **not measured browser transfer or memory**. Full ESM index import avoids adding a bundler but is deliberately unoptimized. SDK modules are self-hosted by a localhost static server; no CDN is used by the probe.

## Verification

- `node --test test/v1-scene.test.mjs`: initial RED missing module; GREEN 2/2 for stable IDs, unchanged input/history, valid move and snapshot/history/authority tampering refusal.
- `npm test --prefix probes/v1-renderer`: initial RED missing controller/adapter; GREEN 3/3 for fixture selection/refusal/retry, real Babylon NullEngine stable meshes/update/pick parity/20 unchanged frames, unavailable SDK/context fallback and repeated cleanup. A cleanup assertion was corrected after inspecting the real SDK: engine disposal also calls `stopRenderLoop`; repeated adapter disposal must add no calls, rather than asserting SDK internals call it exactly once.
- Static-serving regression: RED `/` returned 404 because the resolved root retained a trailing slash; normalized root path, then GREEN. Final isolated suite **4/4** including actual localhost requests for HTML, view, SDK index and projection.
- Final `npm test`: **50/50** (48 existing + 2 projection); `npm run check`, isolated `npm run check`, `node --check probes/v1-renderer/browser-smoke.cjs` and `git diff --check`: pass. npm emits an environment `http-proxy` configuration deprecation warning; real SDK prints its NullEngine version.

Runtime: Node.js **v24.19.0**, real Babylon.js **8.32.0 NullEngine**. The SDK integration uses real scene objects and synchronous render calls, with controllable scheduling and event targets to inspect cleanup; it is not a GPU/WebGL measurement.

## Blocked evidence and limitations

Primary-runtime Playwright was found, but launch failed because `/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell` does not exist. Inventory found no alternative installed Chromium. Supported normal `playwright/cli.js install chromium` attempted Chrome for Testing 151.0.7922.34 (Playwright build 1234); all retries returned 0 MiB/invalid ZIP (`End of central directory record signature not found`), and installation exited 1. No escalation or bypass was attempted.

**No browser screenshot, desktop viewport, mobile viewport, browser GPU/transfer/memory or visual-layout measurement was obtained.** A reproducible optional browser-smoke script is included for an environment with Chromium; its viewport/picking/fallback checks remain unexecuted here. Physical phone and WebXR/headset performance are unmeasured. NullEngine and static HTTP results do not establish production readiness. Self-review found the trailing-slash static-server issue and verified its regression fix; root coordinates independent review/publication.
