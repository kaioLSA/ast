"""
Serviço de transcrição de áudio (Whisper) para a VPS da Startsette.
Recebe áudio em base64 e devolve o texto transcrito em português.

Endpoints:
  GET  /health      → { "status": "ok" }
  POST /transcribe  → body { "audio_base64": "..." } → { "text": "..." }

Roda como serviço systemd, escutando em 0.0.0.0:9000.
Acessado pelo container CRM via o gateway da rede docker (172.16.3.1:9000).
"""
import base64
import os
import tempfile

from flask import Flask, request, jsonify
from faster_whisper import WhisperModel

app = Flask(__name__)

# Modelo "small" em int8 — bom equilíbrio entre qualidade (PT-BR) e uso de CPU/RAM.
# Carregado uma única vez na inicialização.
print("[whisper] carregando modelo small (int8)...", flush=True)
model = WhisperModel("small", device="cpu", compute_type="int8")
print("[whisper] modelo carregado, pronto.", flush=True)


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/transcribe")
def transcribe():
    data = request.get_json(force=True, silent=True) or {}
    b64 = data.get("audio_base64", "")
    if not b64:
        return jsonify({"text": ""})

    # remove prefixo "data:...;base64," se presente
    if "," in b64[:60] and b64[:5] == "data:":
        b64 = b64.split(",", 1)[1]

    try:
        audio_bytes = base64.b64decode(b64)
    except Exception:
        return jsonify({"text": "", "error": "base64 inválido"})

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".ogg", delete=False) as f:
            f.write(audio_bytes)
            tmp_path = f.name

        segments, _info = model.transcribe(tmp_path, language="pt", vad_filter=True)
        text = " ".join(seg.text.strip() for seg in segments).strip()
        return jsonify({"text": text})
    except Exception as e:
        return jsonify({"text": "", "error": str(e)})
    finally:
        if tmp_path:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9000, threaded=True)
