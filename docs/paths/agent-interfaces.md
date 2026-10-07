# Agent interfaces

Branch: `feature/agent-interfaces`. Standing: **planned**.

Expose bounded discovery/read/proposal contracts for tools and agents.

Owner: Machine interface. Dependencies: source-intelligence, reciprocal-events.

## Acceptance

Typed I/O; capability limits; no promotion or execution implied by discovery.

## Start here

Read docs/ARCHITECTURE.md, the approved foundation spec and data/development-paths.json. Take one bounded slice, identify its authoritative source and write typed inputs/outputs and failure tests before code. Preserve existing IDs and private-source boundaries. Reconcile against main before implementation; branch existence is not runtime authority.
