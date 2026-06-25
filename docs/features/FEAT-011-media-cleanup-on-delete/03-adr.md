# ADR: Object-storage cleanup when a lot or auction is deleted

**Feature:** FEAT-011-media-cleanup-on-delete
**ADR ID:** ADR-FEAT-011-01
**Status:** Proposed
**Date:** 2026-06-25
**Decision makers:** sdlc-adr

---

## 1. Context

Lot images live in two places. The metadata row (`LotImage`, holding `s3Key`) lives in
Postgres; the actual `.webp` object lives in S3/MinIO under the key
`lots/${lotId}/${uuid}.webp`. Deleting either side independently leaves the other dangling.

Today, deletion only cleans **one** side. `LotsService.removeLot` calls
`lotsRepository.delete(...)` and `AuctionsService.removeOne` calls
`auctionsRepository.delete(...)`. The entity graph cascades at the **database** level only
(`LotImage.lot` and `Lot.auction` are `onDelete: 'CASCADE'`), so the Postgres rows vanish —
but nothing calls `StorageService.deleteObject`, so every `.webp` object is **orphaned in the
bucket forever**. Only the single-image path (`LotsService.removeImage`) deletes the object,
and it does so synchronously and best-effort. The architectural question: **how do we
guarantee that storage objects are removed when a lot or an auction is deleted, without making
the user's delete request wait for the storage I/O?**

Two forces shape the answer (confirmed with the product owner):
1. The cleanup must be **guaranteed** — an object must never be left behind because the
   process crashed between the DB commit and the storage call.
2. The user must **not wait** for the full cleanup — the delete request should return as soon
   as the database state is consistent; object removal happens afterward.

Constraints from the existing stack: a single NestJS gateway, Postgres 16 (with TypeORM
migrations already in use), Redis 7 (currently `ioredis`, used only for the socket.io adapter
and live auction state — no job queue), and an S3-compatible `StorageService` that today
exposes only single-object `deleteObject`. Object keys are grouped **per lot**
(`lots/${lotId}/…`), not per auction, so auction deletion must enumerate its lots' keys.

> **Assumption — no formal `01-feature-spec.md`.** Like `FEAT-010-auction-reset-teardown`,
> this ADR was raised directly from a code-level gap because the cleanup mechanism has lasting,
> cross-cutting consequences and deserves its own record. Drivers below come from the product
> owner's two answers (guaranteed + non-blocking) and the existing-code review, not from FR/NFR
> IDs. If volumes or compliance later demand a spec, back-port via `sdlc-ba`.

## 2. Decision Drivers

In order of importance:

- **Durability — no orphans, even across a crash.** The intent to delete an object must
  survive a process restart between the DB commit and the storage call. This is the top driver
  and rules out any purely in-request, fire-and-forget approach.
- **Non-blocking — the user does not wait for storage I/O.** The HTTP delete returns once the
  database is consistent; object deletion is drained afterward. An auction with up to 50 lots ×
  several images each could otherwise add hundreds of S3 round-trips to one request.
- **Reuse the existing stack; add new infrastructure only with a clear advantage.** Consistent
  with `ADR-FEAT-010-01`'s KISS / no-new-infra preference. Prefer Postgres + NestJS already in
  the project; justify any new dependency or runtime process explicitly.
- **Correctness across all delete paths.** Lot delete, auction delete (cascade), and the
  existing single-image delete must all converge on the same cleanup guarantee — no path may
  silently skip it.
- **Batch efficiency.** Auction deletion fans out to many objects; the chosen mechanism should
  be able to delete in batches (S3 `DeleteObjects`, up to 1000 keys/request) rather than one
  request per object.

## 3. Options Considered

Baseline (status quo): DB rows cascade, objects are never deleted. Rejected — it is exactly
the bug under repair, and it leaks storage cost indefinitely.

### Option A: Transactional outbox table + in-process scheduled drainer

**Description:** Introduce a `pending_object_deletion` table (`s3Key`, `attempts`,
`createdAt`, optional `status`). In the **same DB transaction** that deletes the lot/auction,
collect the affected `LotImage.s3Key`s and insert outbox rows. Because the insert commits
atomically with the entity delete, the intent to delete survives any later crash. A background
job (`@nestjs/schedule` `@Interval`/`@Cron`, running in-process) periodically claims pending
rows, deletes them from storage in batches (`DeleteObjects`), and removes the outbox rows on
success or increments `attempts` on failure for a later retry. The HTTP request returns right
after the transaction commits.

**Pros:**
- Satisfies both top drivers directly: durability comes from the row being committed in the
  same transaction (survives crash); non-blocking because the drain is asynchronous.
- Reuses Postgres (the durable source of truth) and TypeORM migrations — the project's normal
  pattern. The only new dependency is `@nestjs/schedule`, a small official Nest package that
  runs in-process with **no separate worker process and no broker**.
- Built-in retry by construction: a failed delete simply stays in the table for the next tick.
- Natural batching — a tick can pull N pending keys and issue one `DeleteObjects` call.

**Cons:**
- Adds one migration and one table.
- Deletion latency is bounded by the poll interval (seconds-to-minutes), not immediate.
- An in-process `@Interval` fires on every running instance; if the gateway is ever scaled
  horizontally, the claim step needs a row-lock / `SKIP LOCKED` to avoid double-processing.
  (Single gateway today — see §7.)
- Requires `StorageService` to gain a batch-delete method.

**Estimated effort:** ~1–1.5 days (migration + outbox repo, transactional inserts in two
delete paths, scheduler drainer, `deleteObjects` batch method, tests).

### Option B: Transactional outbox + BullMQ queue/worker on the existing Redis

**Description:** Same outbox concept for durability, but instead of an in-process poller, the
committed rows are enqueued into a BullMQ queue (on the existing Redis) and consumed by a
dedicated worker with built-in backoff/retry/concurrency.

**Pros:**
- First-class retry/backoff, concurrency control, and job observability (e.g. Bull Board).
- The worker is decoupled from the API process and can be scaled independently.

**Cons:**
- More moving parts than the scale justifies: a new `bullmq` dependency **and** a worker
  runtime to deploy and monitor, plus the outbox→queue handoff still has to be made reliable
  (otherwise it reintroduces the crash gap the outbox was meant to close).
- BullMQ's headline value (backoff/retry) is largely **redundant** once the outbox table is
  the durable source of truth — a cron drainer re-polling failed rows already retries.
- Redis is currently treated as ephemeral live-auction state; making it a durable job store is
  a heavier operational commitment than `@nestjs/schedule` over Postgres.

**Estimated effort:** ~2.5–3 days (queue + worker wiring, deployment of a second process,
backoff config, outbox→queue reliability, tests).

### Option C: TypeORM `EntitySubscriber` (`afterRemove`) doing synchronous storage delete

**Description:** Register a subscriber on `LotImage` (and/or `Lot`) whose `afterRemove` hook
calls `StorageService.deleteObject` for each removed row, centralizing cleanup so every delete
path triggers it automatically.

**Pros:**
- Single choke point — any current or future delete path is covered without remembering to
  call cleanup.
- No new table, no migration, no new dependency.

**Cons:**
- **Fails the top driver:** the delete happens in-request and best-effort; a crash (or an S3
  error) between DB commit and the hook leaves an orphan with no record to retry from — exactly
  today's failure mode, just relocated.
- **Fails the non-blocking driver:** the user's request now waits for every object's storage
  round-trip (worst case hundreds for an auction).
- `afterRemove` only fires for entities loaded into the persistence context; bulk
  `repository.delete(criteria)` and DB-level `onDelete: CASCADE` (how lots/images currently
  disappear) **do not** emit it — so it would silently miss the very paths in question unless
  the services are rewritten to load-then-remove.

**Estimated effort:** ~0.5 day, but does not meet the requirements.

### Option D: Periodic reconciliation sweep (orphan garbage collector)

**Description:** No outbox. A scheduled job lists bucket keys by prefix and deletes any
`lots/${lotId}/…` object whose corresponding `LotImage`/`Lot` row no longer exists in Postgres.

**Pros:**
- Self-healing — also catches orphans from unrelated bugs or aborted uploads.
- Zero work on the delete request path; uses only existing infra plus a scheduler.

**Cons:**
- **Not timely or precisely "guaranteed":** orphans linger until the next sweep, and the sweep
  is a heuristic reconciliation rather than an explicit, recorded intent to delete.
- A full-bucket `LIST` grows more expensive as the catalog grows, and racing an in-flight
  upload (object written before its row) risks deleting a live image.
- Coarse: reasons by prefix existence, not by the specific objects a delete removed.

**Estimated effort:** ~1 day, but weak as the *primary* guarantee.

## 4. Comparison

| Criterion | Option A (outbox + scheduler) | Option B (outbox + BullMQ) | Option C (subscriber) | Option D (sweep) |
|-----------|------------------------------|----------------------------|-----------------------|------------------|
| Guaranteed across crash | Yes (committed in tx) | Yes (committed in tx) | No | Eventually, heuristic |
| Non-blocking for the user | Yes | Yes | No (in-request) | Yes |
| Covers cascade / bulk delete | Yes (explicit insert) | Yes | No (`afterRemove` skipped) | Yes |
| New dependency | `@nestjs/schedule` (small) | `bullmq` + worker process | None | `@nestjs/schedule` |
| New migration / table | One table | One table | None | None |
| Retry on failure | Yes (rows persist) | Yes (BullMQ + rows) | No | Implicit (next sweep) |
| Operational weight | Low (in-process) | Medium (extra process) | Low | Low–Medium (grows with bucket) |
| Timeliness | Poll interval | Near-immediate | Immediate (but unsafe) | Until next sweep |

## 5. Decision

**Chosen option:** A — Transactional outbox table + in-process scheduled drainer.

**Rationale:** The two top drivers decide it. *Durability* is met because the outbox row is
inserted in the **same transaction** as the entity delete, so the intent to remove the object
survives any crash — the property Option C cannot provide. *Non-blocking* is met because the
HTTP request returns at commit and the storage round-trips happen on a background tick, not in
the request. On the third driver — reuse with new infra only when it pays — Option A keeps the
durable state in Postgres (already the system of record, already on TypeORM migrations) and
adds only `@nestjs/schedule`, a small in-process Nest package, with no extra runtime process or
broker. Option B was deprioritized because BullMQ's retry/backoff is largely redundant once the
outbox table is the durable source of truth, while its cost — a new dependency *and* a worker
process to deploy and monitor, plus a still-needed reliable outbox→queue handoff — exceeds its
advantage at this scale (single gateway, ≤50 lots/auction). Option C fails both top drivers and
silently misses the cascade/bulk paths. Option D is valuable but as a safety net, not the
primary guarantee — it is timely-by-poll, heuristic, and races uploads. The accepted sacrifice
is deletion latency bounded by the poll interval, which is immaterial for orphaned media.

## 6. Tradeoffs

**Gained:**
- Crash-safe cleanup: an object scheduled for deletion is never lost, because its outbox row is
  committed atomically with the delete.
- Fast delete responses — the user never waits on S3 for lot or auction deletion.
- Uniform coverage of all three paths (lot, auction-cascade, single-image) through one
  drain mechanism, with batched `DeleteObjects`.
- Minimal footprint: Postgres + one small in-process scheduler, consistent with
  `ADR-FEAT-010-01`'s no-new-infra stance.

**Sacrificed:**
- Deletion is eventual, bounded by the poll interval, not immediate.
- One new table + migration and a small operational surface (a drainer that must be observed
  for a growing backlog / repeatedly-failing rows).
- Horizontal scale-out of the gateway later requires a claim lock (`SKIP LOCKED`) so two
  instances don't process the same rows — not needed today but a known follow-up.

## 7. Known Limitations

- **Eventual, not immediate, deletion.** Objects persist until the next drain tick. Acceptable
  for orphaned media; not suitable if an object must be provably gone synchronously (e.g. a
  hard "right to erasure" SLA — see §8).
- **Single-instance assumption.** The in-process `@Interval` is safe because there is one
  gateway. Running multiple API instances without a row-claim lock would double-process the
  outbox. This ADR does not introduce that lock; it flags it as the scale trigger in §8.
- **Outbox population is the integration's responsibility.** Durability holds only if the
  delete paths insert outbox rows **inside** the same transaction as the entity delete. A path
  that deletes entities outside a transaction (or forgets the insert) reintroduces orphans —
  this is a code-convention requirement the implementation and review must enforce.
- **Does not retro-clean existing orphans.** Objects already orphaned by today's bug are not
  addressed by the forward mechanism; a one-off reconciliation pass (Option D) is needed for
  the existing backlog — see §8.
- **Pre-upload aborts.** Presigned-URL uploads that were issued but whose `LotImage` row was
  never created leave objects with no row and thus no outbox entry. Out of scope here; covered
  by the optional sweep in §8.

## 8. Future Optimization Opportunities

- **Reconciliation sweep (Option D) as a safety net** — add a low-frequency prefix-scan job to
  catch orphans this forward mechanism cannot see (aborted uploads, pre-existing backlog, bugs).
  Trigger: run once to clear the current backlog, then schedule if orphan audits show drift.
- **Promote to BullMQ (Option B)** — adopt when deletion volume, required throughput, or
  observability needs outgrow an in-process poller, or when a dedicated worker is wanted to keep
  cleanup load off the API process.
- **`SKIP LOCKED` row claim** — add when the gateway is scaled to more than one instance, so
  concurrent drainers don't contend on the same outbox rows.
- **Dead-letter handling** — after N failed `attempts`, move a row to a `failed` state and
  alert, so a persistently unreachable object key doesn't get retried forever.

## 9. Consequences

**For the codebase:**
- New entity + migration: `PendingObjectDeletion` (`id`, `s3Key`, `attempts`, `createdAt`,
  optional `status`).
- `LotsService.removeLot` and `AuctionsService.removeOne` change to run inside a transaction
  (`dataSource.transaction`, already used by `resetAuction`), load the affected
  `LotImage.s3Key`s first, delete the entities, and insert outbox rows in the same transaction.
- `StorageService` gains a batch `deleteObjects(keys: string[])` wrapping the S3
  `DeleteObjects` command (current `deleteObject` stays for the single-image path, which can
  also be migrated onto the outbox for uniformity).
- A new scheduled drainer (e.g. `MediaCleanupService` with `@Interval`) claims pending rows,
  batch-deletes, and reconciles the table.
- New dependency: `@nestjs/schedule`; register `ScheduleModule.forRoot()` in `AppModule`.

**For the team:**
- One new, well-understood pattern (transactional outbox). No new runtime process, broker, or
  unfamiliar technology.

**For operations:**
- No new infrastructure to deploy. One thing to watch: outbox backlog size and rows with high
  `attempts` (a cheap metric/log), indicating storage-side failures.

**For testing:**
- Unit: `removeLot` / `removeOne` insert the right `s3Key`s into the outbox within the
  transaction; the drainer deletes pending rows and removes them on success, increments
  `attempts` on storage failure.
- Integration (Testcontainers, already in the repo): delete cascade produces outbox rows; a
  simulated storage failure leaves the row for retry; MinIO object is gone after a drain tick.

## 10. References

- Feature: `docs/features/FEAT-011-media-cleanup-on-delete/` (raised from code review; no
  `01-feature-spec.md` yet — see §1 assumption).
- Related ADR: `docs/features/FEAT-010-auction-reset-teardown/03-adr.md`
  (`ADR-FEAT-010-01`) — same KISS / reuse-existing-stack / no-new-infra stance.
- Code touchpoints: `server/src/modules/lots/lots.service.ts` (`removeLot`, `removeImage`),
  `server/src/modules/auctions/auctions.service.ts` (`removeOne`, transactional `resetAuction`
  as the existing transaction pattern), `server/src/modules/storage/storage.service.ts`
  (`deleteObject`), `server/src/modules/lots/entities/lot-image.entity.ts` (`s3Key`,
  per-lot key prefix `lots/${lotId}/…`).
- Pattern: Transactional Outbox (Chris Richardson, microservices.io) — model reference, not a
  benchmark.
