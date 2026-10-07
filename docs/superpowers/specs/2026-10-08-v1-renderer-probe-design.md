# V1 renderer probe design

Origin: Jarrod Cobb's approved continuation, 8 October 2026, Brisbane. Scope: an optional browser 3D probe over the existing local V1 fixture, separate from canonical world admission and the population environment lane.

## Outcome
Evaluate Babylon.js first, as recorded in docs/worlds/PUBLIC-REUSE.md. Render Camp, Training ground and Forge using their existing stable place IDs, plus the current local character. Keep the existing v1.html fixture usable without installing renderer packages.

## Contract
A pure createSceneProjection(run) validates the run by replaying accepted fixture events and comparing the snapshot. It returns the rule version, revision, stable place IDs/labels, explicitly authored display coordinates and current character/place, with grantsAuthority:false. Coordinates describe this probe only; they add no canonical geography or travel edges. Invalid/tampered runs are refused.

An isolated probes/v1-renderer workspace uses a pinned Babylon.js release with a lockfile and recorded source/licence evidence. Install no global packages and add no root runtime dependency. Serve SDK assets from local installed or bundled files; use no learning CDN. Additional tooling requires a concrete reason and licence record.

The renderer consumes verified projections and sends action proposals through the local fixture controller. The existing act/replay functions remain the only fixture transition path. Camera, animation frames, collision visuals and mesh selection award no practice, inventory, magic or authority. No server, account, admission, private Atlas code, population import or autonomous agents are introduced.

## Interaction and failure
Provide a keyboard/touch-readable list of places alongside the 3D view. Stable place selection is identical in both views. A refused move preserves state. Missing SDK, missing WebGL, context failure and disposal leave a useful textual fixture; explicitly report the rendering failure. Repeated mounting and disposal must release engine, scene, callbacks/listeners and resize handling.

## Evidence
Measure actual installed release, lock/integrity, served or built asset sizes, browser/viewport and observed runtime behavior. Use headless desktop/mobile-viewport checks where available, clearly separated from physical phone/WebXR performance. Physical phone and headset capability remain unmeasured. No performance or production-readiness claim is inferred from a screenshot.

## Acceptance
Tests cover stable projection, snapshot tampering refusal, replay unchanged across animation and place-selection parity, refusal behavior, fallback and resource cleanup. Use the real selected SDK in integration checks when available. Run npm test and npm run check at root and isolated probe tests. Capture at least one browser screenshot if the environment supports it, retaining it as review evidence rather than shipping generated screenshots in source.
