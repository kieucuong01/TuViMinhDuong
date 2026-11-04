"""Run on VPS; stop only our transient unit if host health deteriorates."""
import concurrent.futures
import argparse
import datetime
import json
import os
from pathlib import Path
import subprocess
import threading
import time
import urllib.request
import wave

OUT = Path(os.environ.get("BENCHMARK_OUT", "benchmark-output"))
TEXTS = ["Cung Mệnh có sao Tử Vi và Thiên Phủ. Bạn muốn hỏi về công việc hay gia đình?",
         "Thái Dương, Thái Âm, Thiên Cơ và Cự Môn là những tên sao trong lá số tử vi.",
         "Mình cùng nhìn cung Phu Thê và cung Tài Bạch. Bạn đang băn khoăn điều gì?"]


def speech(index):
    start = time.monotonic()
    body = json.dumps({"input": TEXTS[index % len(TEXTS)]}).encode()
    req = urllib.request.Request("http://127.0.0.1:4112/v1/audio/speech", data=body,
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=180) as response:
            first = response.read1(65536)
            ttfa = time.monotonic() - start
            pcm = bytearray(first)
            min_lead = len(pcm) / 48000
            while chunk := response.read1(65536):
                pcm.extend(chunk)
                min_lead = min(min_lead, len(pcm) / 48000 - (time.monotonic() - start - ttfa))
        elapsed = time.monotonic() - start
        duration = len(pcm) / 48000
        with wave.open(str(OUT / f"clip-{index}.wav"), "wb") as wav:
            wav.setparams((1, 2, 24000, 0, "NONE", "not compressed"))
            wav.writeframes(pcm)
        return {"index": index, "text": TEXTS[index % len(TEXTS)], "ttfa_s": ttfa,
                "elapsed_s": elapsed, "audio_s": duration, "rtf": elapsed / duration if duration else None,
                "pcm_bytes": len(pcm), "min_playback_lead_s": min_lead}
    except Exception as error:
        return {"index": index, "error": str(error), "elapsed_s": time.monotonic() - start}


def monitor(done, samples):
    bad = 0
    while not done.is_set():
        started = time.monotonic()
        try:
            with urllib.request.urlopen("https://lasotinhhoa.vn", timeout=3) as response:
                status = response.status
        except Exception:
            status = 0
        latency = time.monotonic() - started
        mem = dict(line.split(":", 1) for line in Path("/proc/meminfo").read_text().splitlines())
        available = int(mem["MemAvailable"].split()[0]) // 1024
        unit = subprocess.check_output(["systemctl", "show", "quan-voice-bench", "-p", "MemoryCurrent",
                                        "-p", "MemoryPeak", "-p", "ActiveState", "-p", "MainPID"], text=True)
        row = {"at": datetime.datetime.now(datetime.timezone.utc).isoformat(), "web_s": latency,
               "web_status": status, "available_mib": available, "unit": unit.strip()}
        fields = dict(line.split("=", 1) for line in unit.splitlines())
        status_file = Path("/proc") / fields.get("MainPID", "0") / "status"
        if status_file.exists():
            row["process_memory"] = "\n".join(line for line in status_file.read_text().splitlines()
                                               if line.startswith(("VmRSS:", "VmHWM:")))
        samples.append(row)
        bad = bad + 1 if latency > 1 or status != 200 else 0
        if available < 650 or bad >= 3:
            subprocess.run(["systemctl", "stop", "quan-voice-bench"], check=True)
            row["stopped"] = "host memory or repeated web latency regression"
            done.set()
        done.wait(2)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--single", action="store_true", help="three sequential single-request runs only")
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    done, samples, runs = threading.Event(), [], []
    watcher = threading.Thread(target=monitor, args=(done, samples), daemon=True)
    watcher.start()
    try:
        ready = False
        for _ in range(300):
            if done.is_set():
                break
            try:
                with urllib.request.urlopen("http://127.0.0.1:4112/health", timeout=1) as r:
                    if r.status == 200:
                        ready = True
                        break
            except Exception:
                if subprocess.run(["systemctl", "is-active", "--quiet", "quan-voice-bench"]).returncode:
                    break
                time.sleep(2)
        for run, count in enumerate((1, 1, 1) if args.single else (1, 2, 3)):
            if done.is_set() or not ready:
                runs.append({"error": "worker not ready or host watchdog stopped it"})
                break
            with concurrent.futures.ThreadPoolExecutor(max_workers=count) as pool:
                results = list(pool.map(speech, range((run + 1) * 10, (run + 1) * 10 + count)))
            runs.append({"simultaneous_requests": count, "results": results})
            if any("error" in r for r in results):
                break
    except subprocess.CalledProcessError:
        pass
    finally:
        done.set()
        watcher.join(5)
        (OUT / "result.json").write_text(json.dumps({"runs": runs, "host_samples": samples}, indent=2, ensure_ascii=False))
        print(json.dumps({"runs": runs, "samples": len(samples)}, ensure_ascii=False))
