# Tử Vi Quán ecosystem implementation

Approved 2026-11-04. Ship all capabilities together, payments remain closed. Guest aliases, optional existing-account link, recovery; Postgres source of truth. CC0 locally served realistic assets, 24 guests/room, four rooms, three shared teacher tables. Daily date is Asia/Ho_Chi_Minh.

## Work ownership and interfaces

- Root: Prisma/migration, `tu-vi-quan-ecosystem.ts`, ecosystem API, administration, identity/payment ownership integration, integration tests, deployment.
- Content task: `tu-vi-quan-content.ts` and tests; generic annual report only in NEW files, do not change legacy 2026 consumers. Export `QUAN_CONTENT_VERSION`, `drawDaily(topic, chart, seed)`, `drawTarot(count, randomInt)`, `drawIChing(randomInt)`, `moderateWish(text)`, `QUAN_COSMETICS`, `quanDayKey(date)`, `buildQuanHoroscope(input, year)`. All return JSON-safe data. Publish exact types to root/UI early. Full 78-card/64-hexagram content. No AI per free draw; monthly narrative no fabricated scores.
- Scene task: only `tu-vi-quan-scene.tsx` and new scene/asset helpers and local assets/notices, plus realtime room support and tests. Keep existing props compatible. Add optional props `quality: low|medium|high`, `reducedMotion`, `muted`, `appearance`, `experience: courtyard|teacher|tarot|iching|personal`, `communityWishes`. Agree shapes with UI. CC0 GLB locally hosted, fallback geometry; correct disposal. Four rooms ×24, public state only. Do not edit parent UI or shared content.
- UI task: new `tu-vi-quan-ecosystem-panel.tsx` + CSS, parent `tu-vi-quan.tsx` / CSS integration. Do not touch scene or backend. Retain paid session UI. Service dock Hôm nay / Xem bói / Cầu an / Khám phá, profile/settings top. Ecosystem panels use one endpoint below. Full functionality in lite mode. Sharing 1080×1350 preview and Web Share/download, share URL only server redacted. Coordinate content types and scene props directly.

## Ecosystem API contract

GET `/api/tu-vi-quan/ecosystem`: `{profile:{id,alias,linked,points,earned,title,birthInput,equipped},daily,history,inventory,wishes,myWishes,event,cosmetics,flags,serverTime}`. GET no guest returns 401. All authenticated by server cookies, never client owner IDs. API 503 if disabled except admin. New launch flag `TU_VI_QUAN_ECOSYSTEM_ENABLED=true`; local defaults enabled, production off until validated.

POST same path JSON `action` plus fields, returns fresh GET snapshot except specified:
- `daily {topic:career|love|money}` -> snapshot `daily` result.
- `ritual {kind:incense|greet|meditate_start|meditate_finish,count?:1|3,note?}` -> server timed meditation and once/day reward.
- `birth {input:ChartInput|null}`, `link`, `recovery_issue` -> `{...snapshot,recoveryCode}`, `recovery_restore {code}` before guest required.
- `tarot {count:1|3}`, `iching` -> snapshot `latestResult` and history. Stable one/kind/day.
- `wish {text,public:boolean,placement:tree|lotus}`, `wish_edit {id,text,public}`, `wish_delete {id}`, `wish_react {id,kind:heart|peace|strength|joy|hope|care}`, `wish_report {id}`.
- `buy {itemId}`, `equip {itemId}`; 12 point-priced cosmetics plus three free milestone skins at 100/300/700 lifetime points. A seven-day monastery lantern is earned separately.
- `practice_start|practice_tick|practice_pause|practice_finish {mode:meditate|beads|chant|garden,tap?}`. Foreground heartbeats credit at most 12 seconds per interval. Only one practice runs per profile. Beads require 27 spaced taps and 120 seconds; chanting requires 120 seconds; gardening requires four spaced taps and 60 seconds. Meditation awards 5 points at 60 seconds and a total of 10 at 180 seconds. Legacy ritual awards share the same daily allowance.
- `redeem_voice {}` atomically debits 60 points and creates one 300-second voice ticket. One redemption per Vietnam day and at most two unused tickets. `encounter begin {kind,ticketId}` reserves an owned ticket; `start {id}` consumes it. Leaving an invitation preserves it; started tickets remain resumable until their original expiry. Tickets and paid orders use separate ledgers. No schema migration is required.
- `event_join`, `event_claim` -> 60 server seconds plus active event, one reward.
- `horoscope {year}` -> `{...snapshot,horoscope}` using saved birth input.
- `share {sourceId,showAlias:boolean}` -> `{...snapshot,share:{id,url,snapshot,expiresAt}}`, `share_revoke {id}`.
- `telemetry {name,shareId?}` allowlisted only, no free text.

## Invariants

Daily cap is 45 points: check-in5 + daily draw10 + incense5 + meditation10 + shared beads/chanting10 + garden5. Tarot and sharing earn no points. Lifetime earned points determine rank independently of spending. Reward ledger unique(profile,day,kind); practice records store mutable server timing and progress under the ecosystem transaction lock. Link merges dedupe daily rewards and retain actual spending. Existing QuanOrder IDs unchanged. No ownership from request. Private wishes default; <=120 chars, one public/day, filter URLs/phone/email/abuse. Unique reaction/profile/wish; only distinct linked accounts count toward3-report hiding. Public expiry30days. Default event lunar1/15 at20:00–20:15; override in admin. Shares whitelisted snapshot, revoked/expired404, noindex/no-referrer. Analytics pseudonymous only. Content/rule version persisted.

The monastery has its own courtyard entrance and isolated 3D interior layer, with three seated Buddha statues, red columns, cushions and a seven-day lotus garden. The courtyard has one incense action. Prayer, bowing, meditation, chanting and prayer beads are accessed inside the monastery. Its HUD supports portrait/landscape and the full activity flow also works in lite mode. Presence action `monastery` seats real visitors in the same room; decorative chibi visitors are unlabelled scenery and are excluded from the user count.

## Acceptance and launch

- Use a disposable localhost PostgreSQL database. Run `npm run db:deploy` against it, then set `QUAN_TEST_DATABASE_URL` to the migrated `quan_test` database and run `npm test`. `npm run lint`, `npm run build` and `npm audit --omit=dev --audit-level=high` cover the release candidate.
- For the internal preview, start Next on `4000` with `npm run dev:e2e` and presence on `4001` with `node scripts/tu-vi-quan-realtime.mjs --serve`. Both processes use the same local `AUTH_SECRET` and database. Set `TU_VI_QUAN_ECOSYSTEM_ENABLED=true` and leave `TU_VI_QUAN_PAYMENTS_ENABLED=false`.
- Verify day reset, duplicated actions, account merge, cross-device recovery, two tiers of payments with the mock provider, 96 sockets and four rooms, safe share URL revocation and admin moderation. A merge that would leave a negative balance rolls back and explains how many points are needed to merge. Both original inventories remain accessible.
- Verify the fresh load and interactions on an Android phone and an iPhone, including portrait and landscape. Use a cold browser and 10 Mbps connection for the 3s welcome and 8s interactive targets. Record the device, browser and quality mode for the 30 FPS target. Include WebGL fallback, shared event, PNG sharing, QR flow and readability on both screens. Desktop software WebGL results do not satisfy the hardware gate.
- Before production, verify the migration against a sanitized production copy and back up the VPS database. Configure the ecosystem flag consistently for both processes during the same `npm run ship -- "feat: launch Tu Vi Quan ecosystem" -Migrate` release. Keep paid checkout closed until it is validated separately. Verify GitHub CI, release SHA, both PM2 processes, public URL and an anonymous two-browser walkthrough. Check rates for failed draws, rewards, moderation, payment and latency during the first 48 hours.
- Moderation lives at `/admin/tu-vi-quan`. Review reports daily. The public-posting switch pauses new public wishes and private journaling stays available. Feature switches pause individual mutations. The environment flag also disables the new public share pages, scene assets and four-room mode if the whole release must be withdrawn.

The first-session activation metric uses a 30-minute window from first visit. Retention cohorts use Vietnam calendar days with eligible denominators. Share attribution is counted when a visitor follows the shared card into the quán with an active guest cookie. There is no analytics payload with birth input, alias, wish text or paid conversation.
