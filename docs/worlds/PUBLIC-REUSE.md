# Public reuse candidates for V1

Observed 7 October 2026. These upstream repository revisions and declared main-code licences were inspected as discovery evidence. No packages installed, code copied, services connected or asset rights inferred. Selection is deferred to bounded compatibility probes. Licences of dependencies, extensions, examples, artwork and exported distributions require their own review at the pinned release actually selected.

## BabylonJS/Babylon.js

[Upstream](https://github.com/BabylonJS/Babylon.js) · [observed revision](https://github.com/BabylonJS/Babylon.js/tree/a78e0fe21c8a5349329610b5cec6d063b17935cb) · declared main-code licence: Apache-2.0.

Role: Browser 3D and WebXR renderer candidate. Mobile GPU/memory, accessible fallback, bundle size and actual headset capability remain untested; production packages must be self-hosted or bundled rather than the learning CDN.

Probe: render or execute one bounded fixture using the existing world state's stable identities. Record release/package hash, required notices, runtime footprint, failure/fallback, interoperability and measured cost. Failures leave the existing world owner usable. No candidate is a substitute for admission, restart/replay, player isolation or source provenance.

## colyseus/colyseus

[Upstream](https://github.com/colyseus/colyseus) · [observed revision](https://github.com/colyseus/colyseus/tree/74c7f66e7261fd7d333ab760ed235d918c7bd1fa) · declared main-code licence: MIT.

Role: Optional authoritative multiplayer transport candidate. Existing world owner must remain authoritative; avoid a second ledger/session authority. Deploy only if a measured realtime requirement justifies another service.

Probe: render or execute one bounded fixture using the existing world state's stable identities. Record release/package hash, required notices, runtime footprint, failure/fallback, interoperability and measured cost. Failures leave the existing world owner usable. No candidate is a substitute for admission, restart/replay, player isolation or source provenance.

## dimforge/rapier

[Upstream](https://github.com/dimforge/rapier) · [observed revision](https://github.com/dimforge/rapier/tree/3406750a38286a0d3c7d0f4be2f9d53153e81d90) · declared main-code licence: Apache-2.0.

Role: Optional bounded collision/physics adapter candidate. Physical simulation does not provide RPG rules, crafting, magic or governance. Determinism must be tested across selected version/platform rather than assumed.

Probe: render or execute one bounded fixture using the existing world state's stable identities. Record release/package hash, required notices, runtime footprint, failure/fallback, interoperability and measured cost. Failures leave the existing world owner usable. No candidate is a substitute for admission, restart/replay, player isolation or source provenance.

## godotengine/godot

[Upstream](https://github.com/godotengine/godot) · [observed revision](https://github.com/godotengine/godot/tree/3ea0cf3e72699c5e3b35f7956670ac93b9d1d4a0) · declared main-code licence: MIT.

Role: Alternative native/desktop engine path. A separate engine/toolchain/export path adds maintenance and duplication risks; do not run it alongside a browser renderer by default.

Probe: render or execute one bounded fixture using the existing world state's stable identities. Record release/package hash, required notices, runtime footprint, failure/fallback, interoperability and measured cost. Failures leave the existing world owner usable. No candidate is a substitute for admission, restart/replay, player isolation or source provenance.

## Selection direction

Evaluate Babylon.js first for a browser-first 3D view; retain Godot as an alternative when actual device/native constraints justify it. Evaluate Rapier only where explicit collision/physics rules are needed. Evaluate Colyseus only if shared realtime interaction cannot be served adequately by the existing turn-based owner. This recommendation is an inference from the present architecture and repository capabilities, not a tested integration result.

Open-source code can remove large implementation tasks. It cannot establish that equivalent whole-system capability will be achieved within hours. Pin versions, preserve notices, contribute upstream where useful, and retain proprietary product source and livelihood. Hub Tech Codex discovers and routes; owning projects integrate and release independently.

