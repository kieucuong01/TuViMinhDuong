# Quán voice worker (not enabled in production)

This is an isolated, loopback-only adapter to the official torch-free VieNeu-TTS v3 Turbo OpenAI-compatible streaming server. No voice cloning, GPU, paid TTS, public listener, PM2 change or Nginx change. Stock male Vietnamese preset: **Hải Đăng**, northern natural voice, shipped in the Apache-2.0 package. No real person's recording was uploaded or cloned.

## Current capacity decision: one global stream at one CPU core

A follow-up explicitly authorized by the parent task increased **only `CPUQuota` to 100%** (one core of the two-core VPS). RAM stayed 1400 MiB, swap stayed forbidden, and ONNX thread settings were unchanged. Three sequential single requests measured TTFA **0.725 / 0.707 / 0.730 seconds**, RTF **0.822 / 0.866 / 0.837**. A longer conversational reply measured **0.755 seconds TTFA**, **17.086 seconds generation / 21.25 seconds audio**, **RTF 0.804**. Every request maintained at least **170.5 ms positive playback lead** after first audio; immediate playback never fell behind in these samples. A browser should still prebuffer 150–300 ms for network jitter.

The follow-up tested **one stream only**, never multiple concurrent streams. The one model/one stream is shared across all NPC kinds. The existing queue can admit two waiters with a 15-second timeout; concurrent queue capacity at 100% has **not** been tested, and a queued long reply may receive 429 rather than wait indefinitely. Do not claim several simultaneously speaking NPCs/users are supported.

During these samples home stayed 200, max **100 ms**, host available memory minimum **710 MiB**. Peak observed process RSS/high-water **1,424,340 KiB**, peak cgroup **1,468,006,400 bytes**. Memory remains close to the hard limit. This supports a bounded trial with **one global synthesis stream**, not a broad load-capacity guarantee. More CPU would compete with the website; limits were not raised further. Worker was stopped after proof; public voice is still disabled pending root integration and audio quality verification.

Exact follow-up records: `benchmark-single-100.json` and `benchmark-single-100-long.json`. Listening artifacts (ignored, not committed): `benchmark-output/clip-100-single.wav` and `clip-100-long.wav`; expected text is saved beside each as `.txt`. Human pronunciation and microphone→STT→LLM timing are still unverified.

## Initial benchmark: 65% CPU cannot sustain real time

Measured 2026-11-04 18:56–18:57 UTC on the existing 2-vCPU / 3915 MiB VPS with its production applications running. CPU AMD EPYC 7773X exposes AVX2 but **no VNNI**. Upstream explicitly warns int8 needs VNNI to avoid distortion, so this test used the full official **fp32** Turbo model; no smaller model was substituted.

Hard limits: `CPUQuota=65%`, `MemoryMax=1400M`, `MemorySwapMax=0`, `TasksMax=48`, one inference stream and two bounded waiting slots. Limits were not raised. Real speech was generated for Vietnamese sentences naming Tử Vi, Thiên Phủ, Thái Dương, Thái Âm, Thiên Cơ, Cự Môn, Phu Thê and Tài Bạch.

| Simultaneous requests | Time to first actual PCM byte (seconds) | End-to-end RTF, including queue |
| --- | --- | --- |
| 1 | 1.244 | 1.429 |
| 2 | 1.176 / 6.284 | 1.433 / 2.784 |
| 3 | 1.481 / 8.598 / 14.875 | 1.647 / 3.420 / 5.672 |

All six requests returned nonempty 24 kHz WAV artifacts, 3.36–4.16 seconds each. RTF = response generation wall time / audio duration; **RTF > 1 even alone means immediate streaming can stall**. These are TTS-only measurements, not microphone→STT→LLM→audio timing. Do not describe this worker as meeting live conversation capacity.

Peak process RSS/high-water mark observed via `/proc/<MainPID>/status`: **1,397,204 KiB**. Peak cgroup usage **1,468,649,472 bytes** (~1400 MiB, including charged file cache), very close to the ceiling. During 17 host samples home returned 200 throughout, max 148 ms; initial baseline was 176 ms. Minimum host available memory was **692 MiB**, above the watchdog's 650 MiB stop threshold but with little spare capacity. The watchdog also stops only our unit after three web failures or requests over one second. Swap was not disabled, expanded or cleared; our cgroup cannot use swap. Existing host swap usage was already 3644 MiB, and 3671 MiB after installation/benchmark.

The transient test unit was explicitly stopped after collecting results. Host memory available returned to 2023 MiB and home returned 200 / 70 ms. No existing services were restarted. Isolated runtime remains `/opt/lasotinhhoa/var/quan-voice`, ~791 MiB venv and ~581 MiB cached model files; disk had ~4.1 GiB free afterwards. The extra upstream source checkout remains there for inspection.

Raw measurements: `benchmark-result.json`. WAV files remain on the VPS in `benchmark-output/`; two listening samples are copied to this directory's ignored `benchmark-output/clip-10.wav` and `clip-21.wav`. These clips were generated and structurally verified; **human listening/pronunciation quality has not been checked**.

## Reproducible install

Python 3.12.3 was tested. `requirements.lock` contains the actual tested complete pip environment, without torch, CUDA or NVIDIA packages. `models.json` pins the Turbo and OpenMOSS codec model revisions; the wrapper enforces those revisions on every model download, including lazy requests. Both model cards report Apache-2.0. Upstream source inspected: `04044e1b8f822f946bafb2c88b716459f4164152`; installed runtime package `vieneu==3.8.3`.

Official references: [streaming API](https://github.com/pnnbao97/VieNeu-TTS/blob/04044e1b8f822f946bafb2c88b716459f4164152/docs/streaming.md), [server](https://github.com/pnnbao97/VieNeu-TTS/blob/04044e1b8f822f946bafb2c88b716459f4164152/apps/openai_speech.py), [CPU engine](https://github.com/pnnbao97/VieNeu-TTS/blob/04044e1b8f822f946bafb2c88b716459f4164152/src/vieneu/_v3_turbo_engine/onnx_runtime_lite.py).

Copy this directory to an isolated runtime, then on Linux:

```sh
cd /opt/lasotinhhoa/var/quan-voice
python3 -m venv venv
venv/bin/pip install --no-cache-dir -r requirements.lock
venv/bin/python -m unittest discover -p 'test_*.py'
```

No automatic startup has been installed. To repeat the bounded experiment deliberately (not a launch command):

```sh
systemd-run --unit=quan-voice-bench \
  --property=MemoryMax=1400M --property=MemorySwapMax=0 \
  --property=CPUQuota=100% --property=TasksMax=48 \
  --property=WorkingDirectory=/opt/lasotinhhoa/var/quan-voice \
  --setenv=HF_HOME=/opt/lasotinhhoa/var/quan-voice/huggingface \
  --setenv=HF_HUB_DISABLE_XET=1 \
  /opt/lasotinhhoa/var/quan-voice/venv/bin/python server.py
venv/bin/python benchmark.py --single
systemctl stop quan-voice-bench
```

First startup downloads pinned weights and warms the actual model before listening. Monitor disk and memory during download. Do not leave the experiment running unattended or enable a public proxy until adequate capacity is established on suitable hardware. A faster dedicated CPU with VNNI or separate worker host can be tested next without touching the website.

## Private proxy contract

`POST http://127.0.0.1:4112/v1/audio/speech`, `Content-Type: application/json`:

```json
{"model":"vieneu-v3-turbo","input":"Cung Mệnh có sao Tử Vi và Thiên Phủ.","voice":"Hải Đăng","response_format":"pcm","sample_rate":24000,"stream_format":"audio"}
```

The wrapper limits input to 800 characters / request body to 8192 bytes, normalizes sampling options and uses the single stock preset. Response is streamed **signed 16-bit little-endian PCM, mono, 24000 Hz**, `Content-Type: audio/pcm`, `X-Sample-Rate: 24000`, `Cache-Control: no-store`. Read browser PCM samples with little-endian enabled. `audio/L16` conventionally means big endian; a public route must label or document this distinction correctly.

`GET /health` is the official health shape (active/waiting/max_streams). `GET /v1/voices` returns stock preset metadata; synthesis intentionally allows only Hải Đăng. All enrollment routes are removed. Optional `VIENEU_API_KEY` requires `Authorization: Bearer <same key>`; keep it server-side in the root app's private voice proxy configuration. The listener is hard-coded loopback 4112 and has no CORS or public forwarding.

The root website must authenticate encounter ownership, enforce its daily/paid budget, retrieve only its stored answer, enforce same origin and rate limiting, then forward that text server-side. This worker does not decide entitlement and must never be exposed directly to browsers. Check health before advertising voice availability, fail honestly if offline, and abort the upstream request when the player interrupts/leaves. Queue overflow or timeout yields 429. API reachability alone does not prove capacity.

Verified: five Python validation/HTTP/auth/enrollment tests pass in the actual VPS venv; real model inference passed 1/2/3 request runs at 65% and single-only short/long runs at 100%. No full-app build or public enable was performed by this service change.
