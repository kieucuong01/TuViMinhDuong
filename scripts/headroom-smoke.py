import json
import sys

from headroom.compress import compress


MARKER = "headroom-smoke-critical"


def large_log() -> str:
    rows: list[str] = []
    for i in range(1, 5201):
        if i == 3217:
            rows.append(
                "[2026-06-28T04:00:00Z] FATAL payment-webhook signature mismatch "
                f"order=TUVI-3217 trace_id={MARKER}"
            )
        else:
            rows.append(
                "[2026-06-28T04:00:00Z] INFO request completed status=200 "
                f"route=/api/me duration=18ms worker={i % 12} trace_id=headroom-smoke-{i % 31}"
            )
    return "\n".join(rows)


def large_json() -> str:
    events: list[dict[str, object]] = []
    for i in range(1, 2801):
        events.append(
            {
                "timestamp": "2026-06-28T04:00:00Z",
                "level": "INFO",
                "route": "/api/me",
                "status": 200,
                "duration_ms": 18,
                "worker": i % 12,
                "trace_id": f"json-smoke-{i % 31}",
                "message": "request completed with cached user session",
            }
        )
    events[2176] = {
        "timestamp": "2026-06-28T04:00:00Z",
        "level": "FATAL",
        "route": "/api/payments/webhook",
        "status": 500,
        "duration_ms": 91,
        "worker": 5,
        "trace_id": MARKER,
        "message": "payment-webhook signature mismatch",
    }
    return json.dumps(events, ensure_ascii=False)


def main() -> int:
    attempts = []
    for name, content in (("large-log", large_log()), ("large-json", large_json())):
        result = compress(
            [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "tool_result",
                            "tool_use_id": f"headroom_smoke_{name}",
                            "content": content,
                        }
                    ],
                }
            ],
            model="claude-sonnet-4-5-20250929",
            savings_profile="agent-90",
            protect_recent=0,
            protect_analysis_context=False,
            target_ratio=0.2,
        )
        compressed = json.dumps(result.messages, ensure_ascii=False)
        attempt = {
            "sample": name,
            "tokensBefore": int(result.tokens_before),
            "tokensAfter": int(result.tokens_after),
            "tokensSaved": int(result.tokens_saved),
            "compressionRatio": float(result.compression_ratio),
            "transforms": list(result.transforms_applied),
            "fatalPreserved": MARKER in compressed,
        }
        attempts.append(attempt)
        if attempt["tokensSaved"] > 0 and attempt["fatalPreserved"]:
            attempt["status"] = "ok"
            print(json.dumps(attempt, ensure_ascii=False))
            return 0

    print(json.dumps({"status": "failed", "attempts": attempts}, ensure_ascii=False))
    return 1


if __name__ == "__main__":
    sys.exit(main())
