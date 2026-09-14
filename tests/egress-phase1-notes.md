# Egress phase 1 — 2026-09-14

## Scope
No database migration, Storage changes, photo conversion, or business write payload changes.
One initial read remains necessary for the existing local credential login flow.

## Behavior
- One versioned DB module shared by app and UI.
- Signed-in foreground clients reconcile every 10 minutes with healthy Realtime, or every 2 minutes without it.
- Realtime changes still schedule a debounced full reconciliation; changes arriving during a read/write remain pending.
- Hidden/offline clients defer automatic reads and reconcile when returning.
- Focus/visibility events coalesce; rapid manual refreshes share reads.
- Read timeout aborts requests. Automatic failures back off from 15 seconds to 5 minutes.
- Logout stops timers/listeners/channel and aborts reads, without aborting business writes.
- Read results are discarded if local cache or write revision changed during the request.
- Notification clicks focus existing app without navigation. New clients open accessible projects in place, preserving open forms; older open clients only focus until reloaded.

## Verification
Run `node tests/egress-phase1.cjs` (Node built-ins only, fake data, no real network).
16 checks: baseline data equality including photos, timer count, auth lifecycle, hidden/offline, burst coalescing, stale reads, in-flight reuse, cancellation/backoff, mid-read changes, mid-write changes, reconnect, deletion, unchanged write payloads, imports, notification routing.
30-minute simulated idle foreground session: periodic rounds 15 -> 3 (80% fewer); total table requests including bootstrap 96 -> 24 (75% fewer).
Browser smoke test used an isolated localhost server with a mocked Supabase client: login, manager overview, manual sync, logout passed.
Syntax and whitespace checks passed.
Actual billed egress reduction is not yet measured. Base64 payloads remain for phase 2.

## Release and rollback
Baseline: e8e7b02f68bb4f6eae23a1018f677ee50bc01c42.
Release asset version: 20260914-egress-phase1.
After release, users should finish/save open work before reloading the app. Existing tabs continue the previous loaded code until reloaded.
If needed, revert only the phase-1 release commit and redeploy. No database restoration is needed for this code-only release; do not restore old business data over newer user edits.
