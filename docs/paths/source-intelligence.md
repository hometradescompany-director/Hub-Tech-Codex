# GitHub intelligence

Branch: `feature/source-intelligence`. Standing: **planned**.

Read repository metadata, pinned manifests, releases and source changes.

Owner: GitHub observations. Dependencies: foundation.

## Acceptance

Bounded pagination; conditional refresh; pinned file provenance; rate-limit tests.

## Start here

Read docs/ARCHITECTURE.md, the approved foundation spec and data/development-paths.json. Take one bounded slice, identify its authoritative source and write typed inputs/outputs and failure tests before code. Preserve existing IDs and private-source boundaries. Reconcile against main before implementation; branch existence is not runtime authority.
