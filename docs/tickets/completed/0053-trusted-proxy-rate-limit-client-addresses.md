# Ticket 0053: Trusted Proxy Client Addresses For Rate Limiting

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Keep per-client authentication limits working behind a reverse proxy without letting clients spoof their address through forwarded headers.

## Requirements
- [x] Different clients behind a configured trusted proxy have separate rate-limit buckets.
- [x] Requests still use the socket address when received directly or through an untrusted peer.
- [x] Supplying a forged forwarded header cannot reset a client's bucket or choose another client's bucket.
- [x] Proxy-chain handling has explicit rules for which address is trusted.
- [x] Production setup docs explain the required proxy and application settings.

## Tasks
- [x] Add explicit trusted-proxy configuration or an equivalent deployment boundary that rejects untrusted peers.
- [x] Resolve client addresses through that trust policy before constructing rate-limit keys.
- [x] Document how the reverse proxy must replace or sanitize incoming forwarded headers.
- [x] Use the same resolved client address for rate limiting and request diagnostics where appropriate.

## Notes
- `NUXT_TRUSTED_PROXIES` is empty by default. The shared resolver only follows `X-Forwarded-For` when the socket peer is trusted, walking the chain from right to left and stopping at the first untrusted address.
- The reverse proxy must replace or consistently append the client address to `X-Forwarded-For`; do not trust forwarded headers from untrusted socket peers.
- This ticket addresses client identity for the existing limits. Broader write-endpoint rate-limit coverage remains separate roadmap work.
- Coordinate proxy setup guidance with [Ticket 0029](0029-production-quickstart-doc.md).

## Relevant Files
- server/middleware/protection.ts
- server/plugins/errorHandler.ts
- server/utils/clientAddress.ts
- nuxt.config.ts
- scripts/release.env
- docs/.env.example
- docs/Quickstart.md
- docs/Architecture.md

## Progress Log
- 2026-10-22: Completed trusted-proxy configuration, shared client-address resolution for rate limiting and diagnostics, environment examples, and proxy guidance. Focused manual checks covered direct/untrusted peers, trusted single- and multi-hop chains, malformed or missing addresses, IPv4-mapped addresses, and rejection of `/0`. Repeatable tests are out of scope because the project has no test setup.
- 2026-10-21: Ticket created.
