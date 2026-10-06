# Plan: persist preference signals server-side

Status: **draft only, nothing in this document is implemented or wired up.**
Written as part of the overnight hardening branch (item 7).

## 1. What exists today

| Data | Where | Notes |
| --- | --- | --- |
| Whisper engagement (`characterName`, `trope`, `listened`, `listenDuration`, `replayed`, `timestamp`) | `localStorage` key `vitruviano_whisper_engagement` (`services/whisperBackService.ts`) | The **only** preference signal actually recorded. Per-browser, unbounded, lost on clear/other device, invisible to you. |
| Council personas cache | `localStorage` `vitruviano_personas` | Cache, not a signal. Leave as is. |
| Daily-claim flag | `sessionStorage` `daily_claimed` | UI state. Leave as is. |
| Wallet / coins | React state in `App.tsx` | Resets on reload; never trustworthy client-side. Out of scope here, but note it. |

The README says "every interaction captures preference signals". In reality these
interactions are **not** recorded anywhere today, and are the natural signals:

- Casting reaction: `onComplete(trope, "Defiant" | "Surrendered")` (`CastingDirector`)
- Director inputs: trope, archetype, vibe (`InputForm`)
- Manifest requests: *that* one was made, plus the resulting trope/atmosphere (not the raw text)
- Feature use: whisper played/replayed, live call started/duration, 3 AM vault unlocked, intimates image requested, chat opened / messages sent (count only)
- Superuser-panel usage must be **excluded** (it currently pollutes engagement data).

## 2. Goals and non-goals

Goals
- Durable, cross-session, queryable signals you can analyse (top tropes, replay rate, reaction split).
- No PII, no raw user text, cheap to run, safe against abuse.
- Replace `getWhisperAnalytics()` with a superuser-only server summary.

Non-goals (for now)
- User accounts or login. Signals are keyed by a random anonymous id.
- Real-time dashboards, ML pipelines, or personalisation fed back into prompts.
- Server-side wallet/economy (separate project).

## 3. Privacy first (decide before building)

Attraction and sexual-content preferences are sensitive even when anonymous.

1. **Consent**: no event is sent until the user accepts a short, plain-language notice
   ("we record which archetypes you choose, anonymously, to study aesthetic preference").
   Store the choice in a first-party cookie; honour Do Not Track / Global Privacy Control.
2. **Minimise**: allow-listed fields only. Never store free text (manifest descriptions, chat
   messages, generated lore), never store IP or user agent, never fingerprint.
3. **Anonymous id**: random UUID in a first-party cookie (`vit_aid`, 1 year, `SameSite=Lax`).
   "Delete my data" = delete rows by that id (add `DELETE /api/signals` for the caller's own id).
4. **Retention**: raw events 13 months, then keep only aggregates.
5. **Age**: the app has suggestive content; confirm whether an age gate is required before
   collecting anything. (Open question for the owner, see section 9.)
6. Check regional rules (GDPR/UK, CCPA) with whoever advises you before launch.

## 4. Event schema (versioned, validated server-side)

```ts
interface SignalEvent {
  id: string;            // client UUID, used for idempotent inserts
  type:
    | 'casting_reaction'   // props: { trope, reaction: 'Defiant' | 'Surrendered' }
    | 'profile_created'    // props: { source: 'manifest'|'director'|'casting', trope, archetype?, atmosphere?, vibe? }
    | 'whisper'            // props: { trope, listened, listenDurationSec?, replayed }
    | 'live_call'          // props: { trope, durationSec }
    | 'vault_unlock' | 'intimates_image' | 'chat_opened';  // props: { trope }
  props: Record<string, string | number | boolean>; // allow-list per type, string max 100 chars
  clientTs: number;      // advisory only; server stamps its own time
}
interface SignalBatch { v: 1; events: SignalEvent[] } // max 20 events, max 8 KB
```

`trope`, `archetype`, `atmosphere` and `reaction` are validated against the enums in
`types.ts` (server keeps its own copy of the allowed values, as `api/_lib/voices.ts` does).
Unknown types or props are dropped, not stored.

## 5. Architecture

```
browser ──(consent given)──► services/signalService.ts
          queue (capped 50, in memory + localStorage backup)
          flush every 10 s / on pagehide via navigator.sendBeacon
                         │
                         ▼
               POST /api/signals          (Vercel function, same-origin only)
          validate -> rate-limit -> idempotent insert
                         │
                         ▼
        Postgres (Neon via Vercel Marketplace): signal_events
                         │
GET /api/signals/summary ◄── superuser session cookie (reuses api/_lib/superuser.ts)
```

Why Postgres: low volume, relational rollups, trivial to export; Vercel Marketplace gives
`DATABASE_URL` as an env var. Alternative if you want zero SQL: Upstash Redis hashes with
`HINCRBY` counters (cheaper, but you lose raw events and ad-hoc analysis).

Suggested table:

```sql
create table signal_events (
  id          uuid primary key,          -- client id, makes retries idempotent
  anon_id     uuid not null,
  type        text not null,
  props       jsonb not null,
  received_at timestamptz not null default now(),
  schema_v    smallint not null
);
create index on signal_events (type, received_at);
create index on signal_events (anon_id);
```

Summary endpoint returns the same shape `getWhisperAnalytics()` returns today
(`totalListens`, `averageDuration`, `replayRate`, `topTropes`) plus reaction split and
trope counts by `profile_created`, computed with `group by` over a date range.

## 6. Abuse and cost controls

- Same pattern as the existing routes: `readJson` size cap, hand validation, generic errors.
- Rate limit per `anon_id` and per hashed IP (Upstash `@upstash/ratelimit`, or Vercel WAF
  rules). Hash IPs with a salt (`SIGNALS_HASH_SALT`) in memory only; never persist them.
- Vercel BotID or WAF to cut scripted spam; reject batches with no valid consent cookie.
- Cap rows per `anon_id` per day (for example 500) so one actor cannot dominate the data.
- The summary endpoint is superuser-only and `Cache-Control: no-store`.

## 7. Delivery plan

| Phase | Work | Done when |
| --- | --- | --- |
| 0. Decisions | Answer section 9; pick Neon vs Redis; write consent copy | Owner signs off |
| 1. Server | `api/_lib/signals.ts` (schema + validation), `api/signals.ts`, `api/signals/summary.ts`, migration SQL, `DATABASE_URL` + `SIGNALS_HASH_SALT` in `.env.example` | Vitest: schema accepts/drops correctly, rate limit, idempotent retry, superuser gate, no PII stored (DB layer mocked like `@google/genai`) |
| 2. Client | `services/signalService.ts` (consent-gated queue + beacon), consent banner, emit events from the places in section 1; exclude superuser sessions | Nothing is sent before consent; `noClientSecrets` guard still passes |
| 3. Migrate | One-time, consented upload of any existing `vitruviano_whisper_engagement` entries, then delete the key; remove localStorage code from `whisperBackService` | `getWhisperAnalytics` reads from `/api/signals/summary` |
| 4. Review | Run for a week behind a feature flag; sanity-check volumes, cost, and the privacy notice | Flip flag on for everyone |

Rough effort: phases 1-2 about one focused day each; phase 3 half a day.

Testing approach: mirror `tests/` (Vitest, mock the DB client the way `@google/genai` and
`fetch` are mocked, no real services), plus a guard test that the allow-list is the only
path into `props`.

## 8. Risks

- **Consent drop-off** will bias the data toward users who accept; record the consent rate itself.
- **Sensitive-data liability** is the biggest risk, hence section 3 comes first.
- **Anonymous ids reset** when cookies clear, so "unique users" is an upper bound.
- **Schema drift**: every event carries `schema_v`; bump it rather than mutating shapes.

## 9. Open questions for you

1. Is an age gate required before any collection, given the intimate-content features?
2. Neon Postgres or Upstash Redis? (Recommendation: Postgres.)
3. Which jurisdictions do you expect users in (drives consent wording and retention)?
4. Should signals ever feed back into generation (personalisation)? That changes the privacy analysis.
5. Do you want the whisper `listenDuration` / `replayed` fields to be collected at all, or only trope choices?
