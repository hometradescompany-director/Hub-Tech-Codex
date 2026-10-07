# Health lens

Branch: `domain/health`. Standing: **planned**.

Synthetic continuity/consent views only; no clinical decisions or live health data.

Owner: Domain projection. Dependencies: domain-lenses.

## Acceptance

Read-only synthetic projection; source references; domain-owned truth; privacy and absence tests.

## Start here

Read docs/ARCHITECTURE.md, the approved foundation spec and data/development-paths.json. Take one bounded slice, identify its authoritative source and write typed inputs/outputs and failure tests before code. Preserve existing IDs and private-source boundaries. Reconcile against main before implementation; branch existence is not runtime authority.
