# Federation transport

Branch: `feature/federation-transport`. Standing: **planned**.

Connect accepted contracts to Atlas, Diamond and Swarm when real hosts and scoped credentials exist.

Owner: Network adapters. Dependencies: diamond-tool-adapters, agent-interfaces.

## Acceptance

Verified authenticated roundtrip; expiry/revocation; idempotency; secrets server-only.

## Start here

Read docs/ARCHITECTURE.md, the approved foundation spec and data/development-paths.json. Take one bounded slice, identify its authoritative source and write typed inputs/outputs and failure tests before code. Preserve existing IDs and private-source boundaries. Reconcile against main before implementation; branch existence is not runtime authority.
