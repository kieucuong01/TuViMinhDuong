# Tử Vi Quán — the voice game correction

User explicitly corrected the implementation on 2026-11-04. The core product is a multiplayer 3D roleplaying encounter, seated opposite an AI diviner with a live two-way Vietnamese spoken conversation. Reports and menus are secondary. The user chose self-hosted free VieNeu-TTS, five minutes of basic conversation per Vietnam calendar day, then existing PayOS sessions 100k/15min or200k/30min. Original bank donation QR stays a separate voluntary transfer.

## Ownership

- Root owns conversation persistence, free quota, paid context/entitlement, private voice/STT/TTS routes, parent `tu-vi-quan.tsx`, migration, merge/recovery and integration/release.
- Voice service agent owns `services/quan-voice/` (Python VieNeu worker, pinned requirements, benchmark, installation/run notes) and isolated VPS voice runtime only. No Next/Prisma changes. Must benchmark real model with resource limits before running it alongside production. Loopback4112, CPU ceiling65% and memory ceiling1400MB during initial benchmark, no swap increase. Begin with official torch-free v3 Turbo ONNX int8 if CPU supports it. Do not pick a smaller/low-quality model merely for speed. Stop benchmark if public app latency or memory pressure worsens. Keep all existing VPS services/files.
- Scene agent owns `tu-vi-quan-scene.tsx` and scene helpers/CSS only. Seated close opposite teacher/reader, actual posture + mouth and listening/talking gesture, meaningful free ritual animations on objects and Tarot/Dịch ritual on table. Keep old walking/quality/lifecycle. Three hosts at existing teacher/tea/meditation locations. Agree callbacks with UI. No parent or backend changes.
- Social agent owns realtime script/presence helpers/tests and new `tu-vi-quan-social.tsx`/CSS only. Nearby courtyard social text/quick greetings and emotes. Text bounded120 chars, rate limit, shared moderate/filter, ephemeral latest messages, room isolation, no private AI transcript/audio in shared state. Parent integration by root.
- Root builds the new lightweight `tu-vi-quan-encounter.tsx` conversation HUD if no fourth slot. NPC speech/subtitles + microphone bar within scene, one-turn response at a time, optional transcript drawer. No report wall or automatic navigation into paid report. Ask followups in conversation; rituals triggered in world. Preserve existing legacy report/payment routes for website users.

## Scene/HUD contract

Optional scene props: `encounter?: {kind:'tuvi'|'tarot'|'iching', state:'greeting'|'listening'|'thinking'|'speaking'|'idle', audioLevel:number}`, `onHost?: (kind)=>void`, `ritual?: {kind:'incense'|'meditate'|'greet'|'tarot'|'iching', requestId:number, count?:number, values?:number[]}`, `speech?: {id:string,text:string}[]` public greetings only. When seated, show player opposite NPC, intimate camera, hide general HUD panels, prevent wandering but retain leave-chair button. Mouth follows audioLevel, reduced motion respected.

## Root API target

GET `/api/tu-vi-quan/encounter` returns {encounter:null|{id,kind,tier:'free'|'paid',state,startedAt,endsAt,remainingSeconds,messages:[{id,question,answer,interrupted}],context,orderId?},freeRemainingSeconds,capabilities:{stt,tts}}.
POST same route actions `begin {kind,orderId?}`, `start {id}`, `turn {id,turnId,question}`, `interrupt {id,turnId}`, `leave {id}`. Reusing a turn ID is idempotent. The model handles one turn at a time and replies in at most 100 Vietnamese words using the chart or draw and the recent conversation. One five-minute window is shared across all hosts per Vietnam calendar day. The clock starts when the guest accepts the seat and continues if the guest leaves or disconnects. Paid seats use the duration on the verified order and the existing outage and refund rules.

POST `/api/tu-vi-quan/voice/transcribe` multipart {id,audio}, <=6MB and30secs, authenticated active encounter, same origin, rate limited. Reuse configured Groq Whisper Vietnamese for STT, no storage of raw microphone clips.
POST `/api/tu-vi-quan/voice/speak` JSON `{id,turnId}` reads the host greeting or a stored answer belonging to the guest. The loopback VieNeu worker sends 24 kHz mono PCM (`audio/pcm`). Web Audio plays chunks as they arrive and cancels playback when the guest interrupts. Microphone access requires a click. Recording stops when the tab is hidden or the guest leaves.

## Release gate

`TU_VI_QUAN_VOICE_ENABLED` defaults to off in production. Apply the additive migration before enabling the flag. The first pilot has one shared voice seat and one synthesis stream across all three hosts. Check FFmpeg, the configured Groq connection and the loopback VieNeu worker before starting the pilot. Keep `TU_VI_QUAN_PAYMENTS_ENABLED` off until the paid voice flow passes its production checks. The donation QR is independent of both flags.

## Acceptance

Run the voice PostgreSQL fixtures with `QUAN_VOICE_TEST_DATABASE_URL` pointing at a migrated disposable `quan_test` database. Use a separate database for `QUAN_TEST_DATABASE_URL` when running the full suite because both suites share the global queue within each database.

Prove actual Vietnamese speech clips and timestamps (ASR -> LLM -> first audio), hear pronunciation of tử vi terms, measure CPU/RAM, 1/2/3 queue tests. Unit + PostgreSQL tests for five-minute quota, reset, switching host, repeat requests, private ownership, paid timers/refunds and interruption. Browser test seated framing, microphone flow with synthetic input, interrupted audio, social rooms and in-world rituals. Actual microphone/native audio checks must be stated separately. Launch voice only when the local worker is healthy and capacity proved.
