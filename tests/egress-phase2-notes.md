# Egress phase 2 — 2026-09-15

Release baseline: 3982452. Asset version: 20260915-egress-phase2.

- Uploads use immutable SHA-256 names and are verified byte-for-byte before attaching a URL.
- Failed uploads no longer fall back to embedding Base64 in reports.
- Four report upload forms retain failed files in an in-memory queue with retry/cancel controls. Submission is blocked until pending files are uploaded or explicitly cancelled. Pending files are retained only while the form remains open.
- Insert/edit helpers convert embedded photos from older caches before saving. Other business fields and existing remote URLs are preserved.
- Existing Base64 photos are copied to daily-photos Storage without recompression. Original data and a conditional photo-only rollback are saved privately outside the Git repository.
- Migration updates only photos of the 18 backed-up reports, using a compare-and-set check of the original photo array. Concurrent photo edits are skipped; other fields are never restored from the backup.
- 16 phase-1 regression checks and 9 phase-2 upload/queue checks pass. Tests use fixtures, not live writes.

Users should save their work and reload after release. Previously opened old versions can still write Base64 until reloaded; this release does not force reload or change database permissions.

Actual migration verification and byte measurements are kept with the private backup. Reverting this code does not require reverting image URLs: the baseline already supports URL photos. Do not restore entire reports over user edits.
