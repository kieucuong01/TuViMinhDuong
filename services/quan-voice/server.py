"""Bounded loopback-only adapter around the official VieNeu streaming server."""
import json
import os
from pathlib import Path

MAX_BODY = 8192
MAX_TEXT = 800
VOICE = "Hải Đăng"


def validate_speech(body):
    if not isinstance(body, dict):
        raise ValueError("JSON object required")
    text = body.get("input")
    if not isinstance(text, str) or not text.strip() or len(text) > MAX_TEXT:
        raise ValueError("input must contain 1-800 characters")
    if body.get("voice", VOICE) != VOICE:
        raise ValueError("unsupported voice")
    if body.get("response_format", "pcm") != "pcm" or body.get("sample_rate", 24000) != 24000:
        raise ValueError("only mono 24000 Hz pcm is supported")
    return {"input": text, "voice": VOICE, "response_format": "pcm", "sample_rate": 24000,
            "stream_format": "audio", "max_chars": 128}


def create_app():
    import huggingface_hub
    # Pin every model download, including lazy codec / preset lookups.
    revisions = json.loads(Path(__file__).with_name("models.json").read_text())
    download = huggingface_hub.hf_hub_download

    def pinned_download(repo_id, *args, **kwargs):
        if repo_id not in revisions:
            raise ValueError("unapproved model repository")
        kwargs["revision"] = revisions[repo_id]
        return download(repo_id, *args, **kwargs)

    huggingface_hub.hf_hub_download = pinned_download
    for key, value in {"VIENEU_BACKEND": "onnx", "VIENEU_DEVICE": "cpu", "VIENEU_PRECISION": "fp32",
                       "VIENEU_WATERMARK": "0", "VIENEU_MAX_STREAMS": "1", "VIENEU_QUEUE": "2",
                       "VIENEU_QUEUE_TIMEOUT": "15", "OMP_NUM_THREADS": "1", "OPENBLAS_NUM_THREADS": "1"}.items():
        os.environ[key] = value
    from apps.openai_speech import app
    from fastapi.responses import JSONResponse

    # No voice enrollment, docs or other endpoints: only this server-side proxy contract.
    app.router.routes[:] = [r for r in app.router.routes
                           if (r.path == "/v1/audio/speech" and "POST" in r.methods)
                           or (r.path in ("/health", "/v1/voices") and "GET" in r.methods)]

    @app.middleware("http")
    async def bounds(request, call_next):
        if request.url.path == "/v1/audio/speech" and request.method == "POST":
            raw = bytearray()
            async for chunk in request.stream():
                if len(raw) + len(chunk) > MAX_BODY:
                    return JSONResponse({"error": {"message": "request too large"}}, status_code=413)
                raw.extend(chunk)
            try:
                normalized = validate_speech(json.loads(raw))
            except (ValueError, TypeError):
                return JSONResponse({"error": {"message": "invalid speech request"}}, status_code=400)
            request._body = json.dumps(normalized, ensure_ascii=False).encode()
        response = await call_next(request)
        response.headers["Cache-Control"] = "no-store"
        return response

    return app


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(create_app(), host="127.0.0.1", port=4112, workers=1, log_level="info")
