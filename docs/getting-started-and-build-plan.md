# GlowTrack — How to Start & Phased Build Plan

Companion to `technical-spec.md`. This is the ordering document: what to build, in what
sequence, and what "done" means at each checkpoint.

---

## Part 1 — The first week

The biggest risk in a 17-module project is spending three weeks on setup and losing
momentum before anything works on a phone. The goal of week one is narrow and specific:

> **A real user can register on a physical phone, add a habit, tick it, and see the streak
> increment — with the data surviving an app restart.**

That single flow exercises auth, the catalog/instance/log model, the dashboard composer
and the client state layer. Everything after it is repetition of a proven pattern.

### Day 1 — Skeleton

```bash
mkdir glowtrack && cd glowtrack && git init
npm init -y                       # root workspace
# workspaces: ["app", "server", "packages/*"]

npx create-expo-app@latest app --template blank-typescript
mkdir -p server/src packages/shared/src docs docker
```

Server dependencies: `express`, `mongoose`, `zod`, `jsonwebtoken`, `argon2`, `helmet`,
`cors`, `express-rate-limit`, `pino`, `dotenv`; dev: `typescript`, `tsx`, `vitest`,
`eslint`, `prettier`.

App dependencies: `@reduxjs/toolkit`, `react-redux`, `@react-navigation/native` (+ stack
and bottom-tabs), `axios`, `react-native-reanimated`, `react-native-svg`,
`expo-notifications`, `expo-secure-store`, `redux-persist`, `date-fns` + `date-fns-tz`.

Then Docker Compose with a `mongo` service and a `GET /health` route that returns
`{ ok: true, db: 'connected' }`. Do not move on until `curl localhost:4000/health` works
and Expo Go opens the blank app on your actual phone. Simulator-only development hides
push notification, keyboard and safe-area problems until much later.

### Day 2 — Auth end to end

Register, login, refresh with rotation, `GET /users/me`. Tokens in `expo-secure-store`,
never `AsyncStorage`. An axios interceptor refreshes on `401` and retries once, with a
single in-flight refresh promise so ten parallel requests do not trigger ten refreshes.

Checkpoint: register on the phone, force-quit, reopen, still logged in.

### Day 3 — The vertical slice

Habits only: seed ten catalog habits, `POST /habits/me`, `POST /habits/me/:id/logs`, and
`GET /dashboard`. Build the streak engine as a pure function first —
`computeStreak(logs, frequency, today) → { current, longest }` — with unit tests covering
daily, weekday-only and travel-across-timezones cases. It is far cheaper to get right on
day three than to untangle from a service later.

Checkpoint: tick a habit, kill the app, reopen, streak is still there and correct.

### Day 4 — Make it feel like the product

The design tokens, the `Ring` component, light/dark theming, one spring animation and
haptics on log. Doing this now rather than "after the features" sets the quality bar that
every later screen is measured against — and retrofitting a design system across twelve
screens is one of the most reliably miserable tasks in app development.

### Day 5 — Harden and repeat

Error envelope and handler, zod validation on every route, rate limiting, Sentry both
sides, GitHub Actions running typecheck plus tests. Then add **water** — it should take
under a day. If it doesn't, the pattern isn't clean yet, and that is the moment to fix it,
while there are two modules to refactor instead of ten.

---

## Part 2 — Phased plan

Estimates assume one full-time developer and include testing. They are planning aids, not
promises.

### Phase 0 — Foundation (1.5 weeks)

Monorepo, Docker, shared types package, CI, error handling, logging, environment config,
health check, seed scripts, **and the domain event bus**. The bus belongs here rather than
alongside gamification: §7.1 of the spec has every module emitting events on write, so
building it late means retrofitting six services that were already written without it.
**Exit:** a new machine can clone and run the whole stack with one command.

### Phase 1 — MVP (13 weeks / ~65 developer-days)

| ID | Work | Depends on | Est. |
|---|---|---|---|
| M1 | Auth: register, login, refresh rotation, reset, secure storage | Phase 0 | 5d |
| M2 | User profile, settings, timezone and units handling | M1 | 3d |
| M3 | Design system: tokens, theming, primitives, animation, haptics | Phase 0 | 5d |
| M4 | Habits catalog + user habits CRUD + ordering | M1, M3 | 4d |
| M5 | Habit logging + streak engine + calendar heatmap | M4 | 5d |
| M6 | Water tracking + containers + goal resolution | M1, M3 | 3d |
| M7 | Weight + body measurements + trend chart | M1, M3 | 4d |
| M8 | Supplements: catalog, regimen, multi-dose logging | M1, M3 | 4d |
| M9 | Skincare: product catalog, AM/PM routines, step completion | M1, M3 | 4d |
| M10 | Dashboard composer + card renderers + visibility rules | M4–M9 | 5d |
| M11 | Notifications: templates, scheduler, quiet hours, deep links | M2, M4, M8 | 6d |
| M12 | Offline outbox + optimistic logging | M5, M6, M8 | 4d |
| M13 | Onboarding flow, empty states, skeletons | M10 | 4d |
| M14 | Gamification: achievement evaluator + unlock UI (bus is Phase 0) | M5, M6, M7 | 5d |
| M15 | Store prep: icons, splash, privacy policy, EAS build, TestFlight | all | 4d |

Three dependency notes that are easy to get wrong. M11 needs M4 and M8, not just M2,
because reminder schedules live on `UserHabits` and `UserSupplements` and the deep links
point at their screens. M12 covers habit, water *and* supplement logging, so it cannot
land before M8. M3 gates every UI module, not only water and weight.

**On the estimate.** Fifteen items summing to 65 days is thirteen weeks for one developer,
not the seven-to-nine a roadmap instinctively wants to promise. Roughly a third of that
(M3, M12, M13, M15) is not PRD modules at all — it is the design system, offline support,
onboarding and store readiness that separate a demo from a shipped app. If thirteen weeks
is unacceptable, cut scope explicitly (see Part 3) rather than compressing estimates.

**Exit:** installed on real testers' phones, running for two weeks without data loss.

Note that M11 (notifications) and M12 (offline) are unglamorous and jointly cost about two
weeks — but a habit app without reliable reminders does not retain users, and one that
drops logs offline destroys trust in the streak. Neither is a candidate for cutting.

### Phase 2 — Depth (8–10 weeks)

Workouts (exercise catalog, templates, session logging, rest timer, volume charts) is the
largest single module at roughly three weeks. Nutrition (food database integration,
barcode scanning, meal logging, macro rings) is comparable and gated on the food-source
decision in the spec's open questions. Sleep and mood are small — two to three days each —
and pay for themselves as correlation inputs. Progress photos need presigned uploads and a
side-by-side comparison view. Blood reports start as manual entry with trend charts and
reference-range shading; OCR waits for V3.

The analytics module belongs at the end of this phase, once there is enough data across
modules for cross-module correlations ("your mood is 30% higher on days you hit 8k steps")
to be more than a mock-up.

### Phase 3 — Intelligence (10+ weeks)

AI Coach with a written safety policy, blood-report OCR, Apple Health and Google Fit sync,
wearables and community. Each of these is a project rather than a feature; sequence them by
what your users actually ask for after Phase 2 ships, not by what sounded exciting during
planning.

---

## Part 3 — Practical advice

**Cut the MVP harder if you need to.** If eight modules feels heavy, ship with habits,
water and weight only. Three modules that feel polished beat eight that feel unfinished,
and the architecture here means adding the rest later costs days, not rewrites.

**Seed data is a real deliverable.** Fifty good starter habits and a hundred common
supplements make first launch feel alive. Budget a day for it and treat the seed script as
production code.

**Instrument from the first build.** Track activation (registered → first log), day-7
retention and logs per active user. Without these you will be guessing about what to build
in Phase 2.

**Version the API from day one.** `/api/v1` costs nothing now. Once a copy of the app is
on a phone you cannot update, having a version prefix is the difference between a
migration and a crisis.

**Write down decisions.** A short `docs/decisions/` entry each time you choose something
non-obvious — why `localDate` is a string, why refresh tokens rotate — saves genuinely
significant time when you return to the code after a break.
