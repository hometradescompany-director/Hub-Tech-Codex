# Real 3D renderer implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Replace the two spatial 2D projections with a visible, interactive WebGL renderer.
**Architecture:** Pure geometry/camera functions feed a locally authored WebGL renderer. Thin adapters retain existing source projections and navigation; the conversation preview embeds exactly the same renderer.
**Tech Stack:** Node 22+, native WebGL, JavaScript modules, operator-provided Playwright.
**Spec:** docs/superpowers/specs/2026-10-08-real-3d-renderer.md

## Global constraints

No new runtime dependency. Preserve stable IDs, typed edges, replay, reciprocal navigation and source/evidence inspection. No proprietary source, admission, spending or production deployment. Never silently label a 2D fallback as 3D.

## Review focus

- Nearest-target picking with overlapping depth and behind-camera objects.
- Finite camera/projection after hidden entry, touch pinch and extreme aspect ratios.
- Cyclic/multi-parent source graphs retain one identity without source mutation.
- World/list/visibility transitions stop animation and preserve camera context.
- GPU/context failure is explicit and disposal removes resources/listeners.

### Task 1: geometry and camera

Files: create src/space3d.mjs and test/space3d.test.mjs.
Interfaces: perspective(fov,aspect,near,far), lookAt(eye,target), multiply(a,b), project(point,matrix,width,height), cameraRay(x,y,width,height,camera), pickRay(ray,objects), sphereMesh(), torusMesh(), layoutGraph(nodes,edges,focus).
- [ ] Write literal tests for perspective depth, rays, nearest/behind picking, mesh bounds/normals and cycle/reordering identity.
- [ ] Run node --test test/space3d.test.mjs; expected new behavior absent/failing.
- [ ] Implement the pure functions and run the tests; expected all pass.
- [ ] Commit geometry and tests.

### Task 2: renderer and integration

Files: create src/world3d.mjs; modify src/app.mjs, src/cosmic-app.mjs, cosmic.html, styles.css, cosmic.css; add scripts/world3d-smoke.cjs and browser CI.
Interface: mountWorld3D(host,{onSelect,onError}) returns setScene({objects,edges,selected,focus}), setActive(bool), setMotion(bool), fit(), cameraState(), dispose(). Objects retain source id/label/kind and receive positions/radii solely as view state.
- [ ] Add browser checks for an actual WebGL context, finite 3D coordinates, camera orbit, mesh selection, source evidence, replay and entry/exit. Observe the missing renderer failing locally or in CI before accepting the new behavior.
- [ ] Implement mesh/depth/light rendering, camera gestures, projected native selection labels and explicit GPU failure.
- [ ] Integrate the same renderer into Hub constellation and Cosmic field. Preserve list/source controls.
- [ ] Run npm test, npm run check and browser smoke; expected all pass, or record the exact unavailable environment.
- [ ] Commit code and scoped verification evidence.

### Task 3: visible review and publication

Files: generate conversation fragment outside repo; update README.md and docs/receipts/2026-10-08-real-3d-renderer.md.
- [ ] Embed the same authored modules and verified synthetic fixture without network calls in an interactive conversation fragment.
- [ ] Inspect an actual browser render, collect screenshot and checks, then request one whole-change source review.
- [ ] Correct important findings with failing-then-passing regressions; verify final source tree.
- [ ] Publish a feature PR and show the real render. Do not merge or claim final art acceptance on the user's behalf.
