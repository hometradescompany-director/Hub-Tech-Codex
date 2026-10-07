# V1 Renderer Probe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax.

**Goal:** Produce a tested optional Babylon.js view of the existing V1 local fixture.
**Architecture:** A pure verified scene projection bridges the unchanged fixture engine to an isolated renderer workspace. Renderer actions remain proposals to act/replay; the textual fixture remains the fallback.
**Tech Stack:** Node.js 22+, browser JavaScript, pinned Babylon.js in an isolated npm workspace.
**Spec:** docs/superpowers/specs/2026-10-08-v1-renderer-probe-design.md

## Global Constraints
- Preserve existing stable place IDs, accepted actions and v1-local-rules/1.
- grantsAuthority:false; no new admission, account, event authority or earned progression.
- No private Atlas source, global installs, root runtime packages or learning CDN.
- Dependency releases must be pinned with source/licence evidence and a lockfile.
- Keep the population/environment branch untouched.
- Report desktop/mobile-viewport evidence separately from physical device performance.

## Review Focus
- Tampered run snapshots must never reach a trusted scene projection.
- Scene coordinates must not create travel edges or canonical geography.
- Renderer failure must leave readable place/action state.
- Repeated mounting/disposal must release scene/engine/listeners.
- Animation and input retries must not append undeclared or duplicate events.

### Task 1: Verified projection and isolated renderer
**Files:** Create src/v1-scene.mjs, test/v1-scene.test.mjs, probes/v1-renderer/ package/lock/server/view/adapter/test files, and docs/receipts/2026-10-08-v1-renderer-probe.md. Keep changes within those paths plus the referenced spec/plan. Modify no root UI or engine.
**Interfaces:** createSceneProjection(run) consumes the unchanged v1-engine run and returns a display projection with existing IDs, revision/rulesVersion, character/place and grantsAuthority:false. The probe controller uses createRun/act/replay exactly as existing callers do.

- [ ] Write and run failing tests for stable place identities, unchanged history and tampered snapshot refusal.
- [ ] Implement createSceneProjection(run) with explicit probe-only display coordinates.
- [ ] Select and pin Babylon.js from authoritative package/upstream evidence. Record licence/source, integrity and need. Use an isolated install; no extra tooling without justification.
- [ ] Implement the local self-hosted probe, 3D adapter and readable keyboard/touch fallback. Preserve fixture-owned actions and explicit refusals.
- [ ] Test real SDK scene identity/update/cleanup where supported; exercise unavailable-renderer fallback, repeated disposal and no events from frames. Record any integration limitation.
- [ ] Run root npm test and npm run check, probe-specific checks and available browser smoke. Capture screenshot and footprint evidence; avoid claiming physical phone/WebXR performance.
- [ ] Self-review the diff, write the receipt with commands/results/runtime/limitations, and commit this single lane.

Execution: authorised continuation with separate workspaces. Root coordinates publication and independent review; implementer does not spawn agents or publish.
