# Ticket 0053: Trusted Proxy Client Addresses For Rate Limiting

## Status
- State: Planned
- Priority: Medium
- Next: Define trusted-proxy configuration for resolving the rate-limit client address.

## Goal
Keep per-client authentication limits working behind a reverse proxy without letting clients spoof their address through forwarded headers.

## Requirements
- [ ] Different clients behind a configured trusted proxy have separate rate-limit buckets.
- [ ] Requests still use the socket address when received directly or through an untrusted peer.
- [ ] Supplying a forged forwarded header cannot reset a client's bucket or choose another client's bucket.
- [ ] Proxy-chain handling has explicit rules for which address is trusted.
- [ ] Production setup docs explain the required proxy and application settings.

## Tasks
- [ ] Add explicit trusted-proxy configuration or an equivalent deployment boundary that rejects untrusted peers.
- [ ] Resolve client addresses through that trust policy before constructing rate-limit keys.
- [ ] Document how the reverse proxy must replace or sanitize incoming forwarded headers.
- [ ] Test direct requests, multiple clients behind a trusted proxy, untrusted peers, forged headers, and multi-hop chains.
- [ ] Use the same resolved client address for rate limiting and request diagnostics where appropriate.

## Notes
- The current limiter calls `getRequestIP(event, { xForwardedFor: false })`. Behind a conventional reverse proxy, all clients therefore share the proxy's socket address and the five-request-per-minute login bucket.
- Unconditionally enabling forwarded-header trust is not a safe fix.
- This ticket addresses client identity for the existing limits. Broader write-endpoint rate-limit coverage remains separate roadmap work.
- Coordinate proxy setup guidance with [Ticket 0029](0029-production-quickstart-doc.md).

## Relevant Files
- server/middleware/protection.ts
- server/plugins/errorHandler.ts
- nuxt.config.ts
- scripts/release.env
- docs/Quickstart.md
- docs/Architecture.md

## Progress Log
- 2026-10-21: Ticket created.
