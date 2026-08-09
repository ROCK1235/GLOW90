# GlowTrack — Technical Specification

Derived from *GlowTrack — Full Project Context & PRD*. This document turns the PRD's
module list into concrete data models, API contracts and architectural rules that can be
built against directly.

Status: draft v0.1 — greenfield, nothing implemented yet.

---

## 1. Guiding constraints

The PRD's key principle — *everything data-driven instead of hardcoded* — is the single
most load-bearing decision in the project. It is interpreted here as three concrete rules
that every module must follow:

**Rule 1 — Catalog / Instance / Log separation.** Every trackable thing is modelled as
three layers: a shared **catalog** document (system-seeded, e.g. "Drink 2L water",
"Vitamin D3", "Bench Press"), a per-user **instance** document that captures the user's
configuration of it (target, schedule, reminder time, order), and an append-only **log**
document that records a single event. New habits, supplements or exercises are added by
inserting catalog rows, never by shipping app code.

**Rule 2 — The dashboard is a query result, not a screen.** The client renders whatever
cards the server returns, in the order returned. Adding a card to the product is a
database change plus a renderer for that card `type`.

**Rule 3 — Rules live in documents.** Achievements, reminder schedules and streak
frequencies are stored as small declarative documents evaluated by a generic engine.
There should be no `if (habitName === ...)` anywhere in the codebase.

---

## 2. System architecture

```
React Native (Expo)
  └─ RTK Query / Axios  ──HTTPS──▶  Nginx  ──▶  Express API (PM2, Docker)
                                                  ├─ Controller layer   (HTTP only)
                                                  ├─ Service layer      (business rules)
                                                  ├─ Repository layer   (Mongoose access)
                                                  ├─ Event bus          (domain events)
                                                  └─ Job workers        (reminders, digests)
                                                          │
                                                     MongoDB (Atlas)
                                                     S3 (photos, reports)
                                                     Expo Push / FCM
```

Controllers never touch Mongoose models; services never touch `req`/`res`. This keeps the
service layer reusable from job workers and future GraphQL or gRPC surfaces.

### Repository layout

```
glowtrack/
├── app/                        # Expo React Native client
│   └── src/
│       ├── api/                # axios instance, RTK Query endpoints per module
│       ├── app/                # store, root reducer, listener middleware, outbox
│       ├── features/<module>/  # screens, components, hooks, slice
│       ├── components/ui/      # design-system primitives (Ring, Card, Sheet, Chart)
│       ├── theme/              # tokens, light/dark palettes, typography scale
│       ├── navigation/         # stacks, tabs, deep links
│       └── lib/                # date/tz helpers, storage, push registration
├── server/                     # Express API
│   └── src/
│       ├── modules/<name>/     # model, repository, service, controller, routes, schema
│       ├── middleware/         # auth, validate, rateLimit, errorHandler
│       ├── events/             # bus + subscribers (achievements, notifications)
│       ├── jobs/               # reminder scheduler, streak repair, digests
│       └── config/             # env, db, logger
├── packages/shared/            # shared TS types + zod schemas (single source of truth)
├── docker/                     # compose, Dockerfiles, nginx conf
└── docs/
```

`packages/shared` is worth the small monorepo overhead: API response types and validation
schemas are written once and imported by both sides, so a field rename breaks the client
build instead of production.

---

## 3. Cross-cutting model conventions

Every user-scoped document carries:

| Field | Type | Purpose |
|---|---|---|
| `userId` | ObjectId, indexed | Ownership. Always taken from the JWT, never from the request body. |
| `localDate` | string `YYYY-MM-DD` | The user's calendar day. All "today" logic keys off this. |
| `loggedAt` | Date (UTC) | Precise instant, for charts and ordering. |
| `tzOffsetMinutes` | number | Offset at write time, so history stays interpretable after travel. |
| `source` | enum | `manual` \| `reminder` \| `import` \| `wearable` |
| `clientLogId` | UUID, from client | Idempotency key. Unique per `{ userId, clientLogId }`. |
| `deletedAt` | Date \| null | Soft delete marker. |
| `createdAt` / `updatedAt` | Date | Mongoose timestamps. |

**Why `localDate` as a string.** Streaks, "log today" checks and calendar heatmaps are
all calendar-day questions, not instant questions. Storing a precomputed local date string
makes them index-friendly equality queries and removes an entire category of off-by-one
bugs around midnight, DST and travel. The client sends its IANA timezone; the server
computes `localDate` — the client never decides it alone.

**Idempotency.** Retry safety comes from `clientLogId`, a UUID the *client* generates when
the user taps, carried through the offline outbox and unique per `{ userId, clientLogId }`.
A retried request therefore collides on a value the client controls, and the server returns
the existing document with `200` instead of inserting a second one.

This matters because natural keys are not sufficient. `{ userId, refId, localDate }` works
only for once-per-day records (habit ticks, weigh-ins) and is actively wrong for water,
where several glasses a day is the entire point. A key including `loggedAt` cannot dedupe
at all, since the server assigns a new instant on every retry. `clientLogId` is the only
key that is both safe for repeated logs and stable across retries, so **every** log
collection carries it.

**Write semantics, stated explicitly per collection** — the three cases behave differently
and conflating them causes silent data loss:

| Pattern | Collections | Behaviour on repeat write |
|---|---|---|
| Append | WaterLogs, MoodLogs, MealEntries, WorkoutSessions | New document each time; deduped only by `clientLogId` |
| Accumulate | HabitLogs (when `unit` is countable) | Increments `value` on the day's document, recomputes `completed` |
| Upsert | WeightLogs, HabitLogs (boolean habits), SupplementLogs | Replaces the day's values |

**Soft delete.** User-facing deletions set `deletedAt` rather than removing documents;
analytics and streak recomputation need the history. Consequently **every unique index
must be a partial index filtered on `deletedAt: null`** — otherwise un-ticking a habit
leaves a tombstone that makes re-ticking the same day fail with a duplicate-key error.
The same applies to `users.email` during the 30-day deletion grace window, which would
otherwise block a user from re-registering. Hard deletion happens only through account
deletion.

---

## 4. Data model

### 4.1 Identity and settings

**Users** — `email` (unique, lowercased), `passwordHash` (argon2id), `name`, `avatarUrl`,
`dateOfBirth`, `sex`, `heightCm`, `timezone` (IANA), `locale`, `units` (`metric` |
`imperial`), `goals` (`{ type: 'weight_loss'|'muscle_gain'|'maintenance', targetWeightKg,
targetDate }`), `onboardingCompletedAt`, `status`, `devices[]` (`{ expoPushToken,
platform, lastSeenAt }`), `deletedAt`.

**RefreshTokens** — `userId`, `tokenHash`, `family`, `expiresAt`, `revokedAt`,
`replacedBy`, `userAgent`, `ip`. Separate collection so rotation and reuse detection are
possible; see §6.

**Settings** — one document per user: `theme` (`system`|`light`|`dark`), `notifications`
(per-module toggles plus quiet hours), `privacy`, `dashboardLayout` (ordered card refs and
overrides), `weekStartsOn`.

### 4.2 Habits

**Habits (catalog)** — `slug` (unique), `name`, `description`, `category`, `icon`,
`colorToken`, `defaultTargetValue`, `unit`, `defaultFrequency`, `suggestedReminderTime`,
`isSystem`, `createdByUserId` (null for system habits), `isActive`.

**UserHabits (instance)** — `userId`, `habitId`, `targetValue`, `unit`, `frequency`
(see below), `reminder` (`{ enabled, times[], daysOfWeek[] }`), `order`, `startedAt`,
`archivedAt`, plus denormalised `currentStreak`, `longestStreak`,
`lastCompletedLocalDate`, `totalCompletions`.

**HabitLogs** — `userId`, `userHabitId`, `habitId`, `localDate`, `loggedAt`, `value`,
`targetAtTime` (snapshot — targets change over time and history must not retroactively
shift), `completed`, `note`, `source`. Unique index `{ userId, userHabitId, localDate }`.

> **PRD gap.** The PRD lists `Habits` and `UserHabits` but no log collection. Without
> `HabitLogs` there is nowhere to record completion, so streaks, the calendar heatmap and
> analytics have no source data. `HabitLogs` is added here and the same pattern is applied
> to skincare.

**Frequency object** — the streak engine reads this rather than branching on habit type:

```jsonc
{ "type": "daily" }
{ "type": "weekdays", "days": [1,2,3,4,5] }      // 0 = Sunday
{ "type": "times_per_week", "count": 3 }
{ "type": "every_n_days", "n": 2, "anchorDate": "2026-08-04" }
```

`every_n_days` requires an explicit `anchorDate` (defaulting to `startedAt`) — without one
there is no way to know which days are scheduled. The anchor does **not** shift on a miss;
the schedule stays on its original phase so a user who skips a day returns to the rhythm
they set rather than silently drifting.

**Streak rules.** A streak advances when a scheduled occasion is satisfied and breaks when
a scheduled occasion is missed — non-scheduled days are skipped, not counted as misses.
For `times_per_week` the unit of streak is the week, evaluated at week close. Denormalised
counters on `UserHabit` are a cache; `HabitLogs` is the source of truth and a nightly job
recomputes any user whose counters drifted. Optional `streakFreezes` (a small monthly
allowance) is worth considering — it materially improves retention in habit apps — but is
deliberately out of MVP scope.

### 4.3 Water, weight, supplements, skincare

**WaterContainers (catalog + user)** — `slug`, `name`, `volumeMl`, `icon`, `userId`
(null for system presets). Backs the quick-add buttons; users can add their own bottle.

**WaterLogs** — `userId`, `localDate`, `loggedAt`, `amountMl`, `containerId`,
`clientLogId`, `source`. Append-only — the day's total is an aggregation, never a stored
field.

**Water goal** is stored on `Settings.hydration` as `{ mode: 'fixed'|'by_weight',
fixedMl, mlPerKg }` and resolved server-side at read time. It is a stored setting with a
derivation option rather than either alone, because `water.goal_met` is an achievement
trigger and an unresolved goal makes that event undefined.

**WeightLogs** — `userId`, `localDate`, `loggedAt`, `weightKg`, `bodyFatPct`,
`measurements` (`{ waistCm, chestCm, hipsCm, armCm, thighCm }`), `note`, `photoIds[]`.
Unique on `{ userId, localDate }` — one weigh-in per day, later writes update it.

**Supplements (catalog)** — `slug`, `name`, `brand`, `form`, `defaultDoseValue`,
`defaultDoseUnit`, `timingHint`, `notes`, `isSystem`.

**UserSupplements** — `userId`, `supplementId`, `doseValue`, `doseUnit`, `schedule`
(same frequency object as habits), `timesOfDay[]`, `withFood`, `startedAt`, `endsAt`,
`stockCount`, `lowStockThreshold`, `archivedAt`.

**SupplementLogs** — `userId`, `userSupplementId`, `localDate`, `scheduledTime` (`"adhoc"`
for unscheduled doses, so the key stays well-defined), `loggedAt`, `tzOffsetMinutes`,
`takenAt`, `status` (`taken`|`skipped`|`missed`), `doseValue`, `clientLogId`, `source`.
Partial-unique on `{ userId, userSupplementId, localDate, scheduledTime }` where
`deletedAt: null`, so multi-dose-per-day works while retries stay safe.

**SkincareProducts (catalog)** — `slug`, `name`, `brand`, `category` (`cleanser`|`serum`|
`moisturizer`|`spf`|`treatment`), `keyIngredients[]`, `userId` (null for system entries).
Included so skincare follows Rule 1 like every other module rather than storing free-text
product names on routine steps.

**SkincareRoutines** — `userId`, `name`, `timeOfDay` (`am`|`pm`), `steps[]`
(`{ order, productId, productNameSnapshot, instruction, durationSec }`), `isActive`.

**SkincareLogs** — `userId`, `routineId`, `localDate`, `completedSteps[]`, `skippedSteps[]`,
`skinCondition` (1–5), `note`, `photoId`.

### 4.4 V2 collections

**Foods** — `name`, `brand`, `barcode`, `servingSizes[]`, `nutrientsPer100g`
(`{ kcal, proteinG, carbsG, fatG, fiberG, sugarG, sodiumMg }`), `verified`, `provenance`
(which database or user contributed it — named distinctly from the cross-cutting `source`
enum, which means something else entirely).

**Meals** — user-saved combinations: `userId`, `name`, `items[]` (`{ foodId, grams }`).

**MealEntries** — `userId`, `localDate`, `mealType` (`breakfast`|`lunch`|`dinner`|`snack`),
`items[]` (`{ foodId, grams, nutrientSnapshot }`), `totals`. Nutrients are snapshotted at
log time so later corrections to the food database do not rewrite a user's history.

**Exercises (catalog)** — `slug`, `name`, `primaryMuscle`, `secondaryMuscles[]`,
`equipment`, `mediaUrl`, `instructions[]`, `metricType` (`weight_reps` | `time` |
`distance` | `bodyweight_reps`).

**Workouts** — templates: `userId` (null for system programs), `name`, `blocks[]`
(`{ exerciseId, sets, targetReps, targetWeightKg, restSec, supersetGroup }`).

**WorkoutSessions** — `userId`, `workoutId`, `localDate`, `startedAt`, `completedAt`,
`sets[]` (`{ exerciseId, setIndex, reps, weightKg, rpe, isWarmup, completedAt }`),
`totalVolumeKg`, `note`.

**SleepLogs** — `userId`, `localDate`, `bedtime`, `wakeTime`, `durationMin`,
`quality` (1–5), `source`. **`localDate` is the wake date**, not the bedtime date — a
23:30→07:00 sleep belongs to the morning it ends, which is how users think about "last
night's sleep" and how it must join against that day's mood and workout data.

**MoodLogs** — `userId`, `localDate`, `loggedAt`, `mood` (1–5), `energy` (1–5),
`tags[]`, `note`.

**ProgressPhotos** — `userId`, `localDate`, `s3Key`, `pose` (`front`|`side`|`back`),
`weightKgAtTime`, `isPrivate`. Never public URLs — see §6.

**BloodReports** — `userId`, `reportDate`, `labName`, `fileS3Key`, `parseStatus`,
`parsedAt`, `notes`.
**BloodParameters** — `reportId`, `userId`, `code` (e.g. `HDL`, `TSH`), `name`, `value`,
`unit`, `refRangeLow`, `refRangeHigh`, `flag` (`low`|`normal`|`high`).
**BloodReferenceRanges (catalog)** — `code`, `name`, `unit`, `sex`, `ageMin`, `ageMax`,
`low`, `high`, `sourceCitation`. Trend charts shade the normal band from this catalog
rather than hardcoding ranges, and it is versioned because reference ranges are revised.

> Blood reports must never be interpreted as medical advice by the app. Copy should
> present values, trends and reference ranges, and defer diagnosis to a clinician. This is
> a product-safety requirement, not a nice-to-have, and it constrains the AI Coach in V3.

### 4.5 Engagement

**DashboardCards** — the data behind Rule 2: `key`, `type` (`ring` | `stat` | `chart` |
`list` | `streak` | `cta`), `module`, `title`, `dataSource` (endpoint or aggregation key),
`defaultOrder`, `minAppVersion`, `enabledByDefault`, `visibilityRule`.

`visibilityRule` uses the same declarative shape as achievement conditions:
`{ "all": [ { "metric": "module_enabled", "scope": "water", "op": "==", "value": true },
{ "metric": "days_since_signup", "op": ">=", "value": 3 } ] }`. Cards that would render
empty are hidden, which is how a seventeen-module app avoids a home screen full of zeroes
on day one.

**AnalyticsRollups** — `userId`, `period` (`day`|`week`|`month`), `periodKey`
(`2026-08-04`, `2026-W32`), `module`, `metrics` (`{ [name]: number }`), `computedAt`.
Nightly job aggregates raw logs into this collection; charts and correlations read rollups
rather than scanning log history. Unique on `{ userId, period, periodKey, module }`.

**CoachConversations** / **CoachMessages** (V3) — `userId`, `title`, `contextScope`
(which modules the coach may read), and `role`, `content`, `citedDataRefs[]`,
`modelVersion`, `flagged` respectively. Cited data references are what let a coach reply
be traced back to the logs it was based on.

**Achievements** — `slug`, `name`, `description`, `icon`, `tier`, `points`, `trigger`
(domain event name), `condition` (declarative, see §7), `isActive`.

**UserAchievements** — `userId`, `achievementId`, `unlockedAt`, `progress`, `seenAt`.

**NotificationTemplates** — `key`, `channel`, `titleTemplate`, `bodyTemplate`,
`deepLink`, `category`.
**Notifications** — `userId`, `templateKey`, `payload`, `scheduledFor`, `sentAt`,
`readAt`, `status`, `providerMessageId`.

### 4.6 Indexes worth creating on day one

Unique indexes are **partial**, filtered on `deletedAt: null`, for the soft-delete reason
given in §3. Every log collection additionally carries the idempotency index.

```
users:            { email: 1 } unique, partial { deletedAt: null }
refreshtokens:    { tokenHash: 1 } unique, { userId: 1, family: 1 }
<all log cols>:   { userId: 1, clientLogId: 1 } unique          // retry safety
habitlogs:        { userId: 1, userHabitId: 1, localDate: 1 } unique partial
                  { userId: 1, localDate: -1 }
waterlogs:        { userId: 1, localDate: 1 }                    // non-unique: many/day
weightlogs:       { userId: 1, localDate: 1 } unique partial
supplementlogs:   { userId: 1, userSupplementId: 1, localDate: 1, scheduledTime: 1 }
                    unique partial
                  { userId: 1, localDate: 1 }                    // dashboard read path
skincarelogs:     { userId: 1, localDate: 1 }
userhabits:       { userId: 1, archivedAt: 1, order: 1 }
userachievements: { userId: 1, achievementId: 1 } unique         // no double unlocks
notifications:    { userId: 1, scheduledFor: 1, status: 1 }
analyticsrollups: { userId: 1, period: 1, periodKey: 1, module: 1 } unique
```

Note the second `supplementlogs` index. The four-field one cannot serve a
`{ userId, localDate }` dashboard query — Mongo can only use the `userId` prefix, so the
home screen would scan. Any collection the dashboard reads needs a `{ userId, localDate }`
prefix available, which is why `skincarelogs` has one despite having no uniqueness need.

Every dashboard read is `{ userId, localDate }` — that compound index is what keeps the
home screen fast as log volume grows.

---

## 5. API contract

Base path `/api/v1`. JSON only. All timestamps ISO-8601 UTC.

**Envelope**

```jsonc
// success
{ "success": true, "data": { }, "meta": { "cursor": "...", "hasMore": false } }
// failure
{ "success": false, "error": { "code": "HABIT_NOT_FOUND", "message": "...", "details": [] } }
```

Machine-readable `code` matters more than the message: the client maps codes to localized
copy, so backend wording changes never break the UI.

**Conventions.** Cursor pagination (`?limit=&cursor=`), never offset. Validation with zod
at the route boundary, returning `422` with a field-level `details` array. `PATCH` for
partial updates. Rate limits: 5/min on auth endpoints, 120/min authenticated general.

### MVP endpoints

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/register` | Returns access + refresh, creates default Settings and seeds starter habits |
| POST | `/auth/login` | |
| POST | `/auth/refresh` | Rotating refresh token, reuse detection |
| POST | `/auth/logout` | Revokes the token family |
| POST | `/auth/forgot-password` · `/auth/reset-password` | Single-use, 30-min token |
| GET/PATCH | `/users/me` | Profile, timezone, units, goals |
| DELETE | `/users/me` | Account deletion, 30-day grace |
| POST/DELETE | `/users/me/devices` | Expo push token registration |
| GET | `/dashboard?date=YYYY-MM-DD` | Composed card payload — the app's single home-screen call |
| GET | `/habits` | Catalog, `?category=&search=` |
| GET/POST | `/habits/me` | List / subscribe to a habit |
| PATCH/DELETE | `/habits/me/:userHabitId` | Edit target, schedule, order; archive |
| POST | `/habits/me/:userHabitId/logs` | Idempotent via `clientLogId` |
| DELETE | `/habits/me/:userHabitId/logs/:localDate` | Undo |
| GET | `/habits/me/:userHabitId/history?from=&to=` | Heatmap + streak data |
| GET/POST | `/water` | Day's logs, add |
| DELETE | `/water/:waterLogId` | Remove a single entry |
| GET | `/water/containers` | Quick-add presets, system + user |
| GET | `/water/summary?from=&to=` | Daily totals vs resolved goal |
| GET/POST | `/weight` | Trend series, upsert today |
| GET | `/supplements` · `/supplements/me` | Catalog and user regimen |
| POST | `/supplements/me/:userSupplementId/logs` | `taken` / `skipped` |
| GET | `/skincare/products` | Product catalog |
| GET/POST/PATCH | `/skincare/routines` | AM/PM routines and steps |
| POST | `/skincare/routines/:routineId/logs` | Step completion |
| GET | `/notifications` | Inbox |
| PATCH | `/notifications/:notificationId` | Mark read |
| POST | `/notifications/read-all` | Bulk mark read |
| GET/PATCH | `/settings` | Theme, notification prefs, dashboard layout |
| GET | `/achievements` · `/achievements/me` | Definitions and unlock state |

`GET /dashboard` returning a ready-composed payload is what makes Rule 2 real. Its shape:

```jsonc
{
  "date": "2026-08-04",
  "greeting": { "name": "Ayush", "streakDays": 12 },
  "cards": [
    { "key": "water", "type": "ring", "title": "Water",
      "value": 1400, "target": 2500, "unit": "ml", "deepLink": "glowtrack://water" },
    { "key": "habits", "type": "list", "title": "Today's habits",
      "items": [{ "id": "...", "label": "Morning walk", "done": true, "streak": 12 }] }
  ]
}
```

The client has a renderer per `type`, not per feature. A new card ships without an app
update — which matters a lot given App Store review latency.

**V2/V3 additions.** `/nutrition/foods`, `/nutrition/meals`, `/nutrition/entries`,
`/workouts`, `/workouts/sessions`, `/sleep`, `/mood`, `/photos` (presigned upload),
`/reports` (upload + OCR status), `/analytics/overview`, `/analytics/:module`,
`/coach/conversations`, `/coach/conversations/:id/messages`.

Three endpoint paths deliberately differ from their PRD module names — Progress Photos is
`/photos`, Blood Reports is `/reports`, AI Coach is `/coach` — for brevity. The mapping is
recorded here so it does not have to be rediscovered.

**Path parameters are always named for the entity they identify** (`:userHabitId`, not
`:id`). With eleven modules exposing nested log routes, `:id` becomes ambiguous fast.

---

## 6. Security and privacy

This app stores weight, body measurements, progress photos and blood panels. That is
health data, and it raises the baseline above a typical CRUD app.

- Argon2id password hashing; access tokens 15 min, refresh tokens 30 days, rotated on
  every use with reuse detection that revokes the whole family.
- Photos and report PDFs live in a private S3 bucket, server-side encrypted, served only
  via short-lived presigned URLs. No object is ever publicly readable, and keys are
  random UUIDs rather than guessable paths.
- Every query is scoped by `userId` from the token. A repository-level helper that
  requires a `userId` argument makes the insecure version awkward to write.
- Helmet, CORS allow-list, request size limits, and `express-rate-limit` backed by Redis
  **from the first production deploy** — not "later". Production runs PM2 in cluster mode
  (§9), so an in-memory limiter is per-process, and the intended 5/min auth limit would
  actually be 5 × the number of workers.
- Account deletion genuinely deletes: Mongo documents and S3 objects, after a 30-day grace
  window, with an export endpoint offered first.
- Secrets via environment only, never committed; rotate the JWT signing key with a `kid`
  header so rotation does not log everyone out.

---

## 7. Engines

### 7.1 Domain event bus

Services emit events after successful writes: `habit.logged`, `habit.streak_advanced`,
`water.goal_met`, `weight.logged`, `supplement.taken`, `workout.completed`. Subscribers
handle achievements, notifications and analytics rollups. This is what keeps the
achievement logic out of the habit service.

Start with an in-process emitter and a transactional outbox collection; move to a real
queue only when a job genuinely needs to survive a restart.

### 7.2 Achievement evaluation

Conditions are documents, not code:

```jsonc
{
  "slug": "hydration-hero",
  "trigger": "water.goal_met",
  "condition": { "metric": "consecutive_days", "scope": "water_goal", "op": ">=", "value": 7 },
  "points": 50
}
```

The evaluator resolves a small, fixed set of `metric` kinds (`consecutive_days`,
`total_count`, `distinct_days_in_window`, `value_threshold`) against the log collections.
Adding an achievement is an insert; adding a *kind* of achievement is the only thing that
needs a deploy.

### 7.3 Reminder scheduler

A worker runs every 15 minutes, computes which local-time buckets just became due, and
selects users whose timezone maps to that bucket with a matching reminder schedule.
Quiet hours and per-module toggles are applied before send; deliveries are recorded so a
crash-and-retry cannot double-notify. Expo push in MVP, with FCM/APNs direct as a later
swap behind the same interface.

---

## 8. Client architecture

**State.** Redux Toolkit with RTK Query for all server state. Local UI state stays in
components. `redux-persist` holds the cached dashboard so the app opens to content rather
than a spinner.

**Offline-first logging.** Log actions (habit tick, water glass, supplement taken) queue in
an outbox and replay on reconnect. Replay is safe because each queued action carries the
`clientLogId` generated at tap time (§3) — the server collapses duplicates on a key the
client owns. This is not gold-plating: people log water in a gym basement and habits on
planes, and an app that loses those taps loses the streak, which is the entire retention
mechanic.

**Navigation.** Bottom tabs — Home, Habits, Progress, More — with modal sheets for logging.
Every notification carries a deep link (`glowtrack://habits/<id>/log`).

**Design system.** Tokens first: spacing scale, radii, elevation, semantic colors
(`bg.primary`, `text.secondary`, `accent.water`) resolved per theme. `useTheme()` is the
only way components read color; no literal hex values outside the token file. Primitives:
`Ring`, `StatCard`, `Sheet`, `Chart`, `EmptyState`, `SkeletonCard`. Animation via
Reanimated 3, springs not linear easing, and `Haptics.selectionAsync()` on every log
action — the tactile confirmation is a meaningful part of the "premium" feel the PRD asks
for.

**Accessibility.** Dynamic Type support, minimum 44pt touch targets, 4.5:1 contrast in
both themes, and never color alone to convey state (a red ring needs a label too).

---

## 9. Environments and delivery

Local development runs Mongo and the API through Docker Compose with the Expo client
against `localhost`. Staging and production run on EC2 behind Nginx with PM2 in cluster
mode, per the PRD, with MongoDB Atlas rather than a self-managed instance — managed
backups and point-in-time restore are worth far more than the hosting saving when the data
is irreplaceable user health history.

CI on GitHub Actions: typecheck, lint, unit tests, then build. EAS Build handles the app
binaries, with EAS Update for JS-only fixes so small corrections skip store review.
Observability from day one is modest but non-negotiable: structured JSON logs with a
request id, Sentry on both client and server, and an uptime check on `/health`.

Testing effort concentrates where bugs are expensive: unit tests on the streak engine, the
achievement evaluator and all date/timezone helpers; integration tests on auth and the log
write paths; a handful of Detox smoke flows for register → add habit → log → see streak.

---

## 10. Open questions

These need answers before or during the first build phase; several change the data model.

1. **Solo or social?** The PRD mentions Community in V3 but no friend, share or feed
   models. If social is real, `Users` needs a public profile shape and every log needs a
   visibility field — retrofitting that later is painful.
2. **Monetisation.** No pricing model is specified. Subscriptions affect entitlement
   checks, store setup and which features gate — cheapest to decide before the paywall
   has to be threaded through 17 modules.
3. **Food database source.** Building a food catalog is a project in itself. Open Food
   Facts, USDA FDC and commercial APIs differ enormously in coverage and licensing, and
   this decision gates the entire V2 nutrition module.
4. **OCR for blood reports.** Lab PDFs are wildly inconsistent. Realistically this is
   "extract what we can, ask the user to confirm", not full automation.
5. **AI Coach boundaries.** What it may and may not say about health data, whether it
   sees blood panels, and which model. Needs a written policy before it is built.
6. **Wearables.** Apple Health and Google Fit are listed for V3 but affect earlier
   decisions — the `source` field and idempotency rules above exist to keep that door open.
7. **Scope.** Seventeen modules is very large for a first release. The MVP list in the
   build plan is the recommended cut.
