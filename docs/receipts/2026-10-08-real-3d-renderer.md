# Real 3D renderer — 8 October 2026

Corrects the mismatch between the user's explicit three-dimensional requirement and the prior HTML/SVG spatial implementation. Both the Hub constellation and Cosmic field now use the same newly authored native WebGL renderer: indexed sphere/torus meshes, perspective camera, depth testing, surface lighting, luminous rings, 3D relationship paths and a bounded parallax star field. No runtime package dependency is introduced.

Drag orbits; scroll/pinch zooms; Shift-drag/right-drag pans. Native labels retain keyboard selection; arrow keys on a label orbit, +/− zoom, Home fits. Clicking an opaque indexed mesh selects the nearest intersected source identity; empty sphere envelopes and ring holes do not intercept clicks. Labels are camera projections and are decluttered independently of source identity. Their visibility never deletes source data.

The adapters preserve source IDs, explicit relationships and replay, with no additional authority or invented causality. Cosmic Enter/Exit, occurrence/knowledge controls, evidence and context navigation remain owned by the existing shell. Directory, reciprocal inspection and event lists remain semantic controls. Source JSON is not executed. This is a geometry view over the public synthetic/declared packets, not private Atlas telemetry or an admitted game session.

The first iteration is an actual interactive 3D scene. It does not certify final art direction, complete game interiors or production performance. GPU budgets are 700 visible objects / 6,000 relationships, pixel ratio at most 2 and 900 decorative stars. Context loss and unavailable WebGL are explicit; renderer disposal releases buffers/programs/shaders/listeners. Camera history is bounded to 100 contexts.

## Verification

- Geometry tests cover literal perspective/depth coordinates, centre rays, nearest/behind picking, extreme aspect/vertical cameras, smooth indexed meshes and stable cyclic/multi-parent layout without source mutation.
- Adapter tests cover all original body/event IDs, explicit edges, descending context and Hub source IDs.
- All 62 Node tests and graph/syntax checks pass locally and in CI. Browser launch is unavailable locally because the Playwright browser executable is absent; the actual browser verification ran in GitHub Actions.
- [Browser verification run 37710205279](https://github.com/hometradescompany-director/Hub-Tech-Codex/actions/runs/37710205279) passed both operator-only Playwright checks against code commit `31a7757f457a5454232dfafc68f141c04b737313`: actual WebGL draw with no GPU errors, orbit, opaque-mesh selection, evidence, replay, desktop/phone projection, shell entry/exit, source import, hostile-text refusal, reciprocal traversal and proof/refusal. Desktop/phone screenshots were downloaded and visually inspected. This verifies Chromium with software WebGL, not performance across all GPU/device combinations.
- A fresh source review identified invisible-envelope selection, foreground path ordering, cleanup after failed shader initialization and obsolete browser selectors. All four were corrected; mesh-hole/nearest-visible selection and failed-init cleanup have regression coverage. The source-navigation smoke follows the recorded Universe → Architecture → Identity/event spine → Atlas containment path.
- The in-conversation scene is generated from these same source modules and the accepted synthetic fixture; it makes the current art/interaction direction reviewable.

The earlier 2D HUD coordinate helper/smoke was replaced by 3D camera and WebGL verification; its dated receipt records the earlier iteration only. No production deployment, paid account action, private source import or live runtime admission.
