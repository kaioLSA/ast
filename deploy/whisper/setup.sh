#!/bin/bash
# Instala o serviço Whisper de transcrição na VPS.
# Uso: bash setup.sh
set -e

echo "[1/5] Dependências do sistema (pip, venv, ffmpeg)..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq python3-pip python3-venv ffmpeg

echo "[2/5] Criando ambiente virtual em /opt/whisper/venv..."
mkdir -p /opt/whisper
python3 -m venv /opt/whisper/venv

echo "[3/5] Instalando faster-whisper + flask..."
/opt/whisper/venv/bin/pip install --upgrade pip -q
/opt/whisper/venv/bin/pip install -q faster-whisper flask

echo "[4/5] Pré-baixando o modelo small (int8)..."
/opt/whisper/venv/bin/python -c "from faster_whisper import WhisperModel; WhisperModel('small', device='cpu', compute_type='int8'); print('modelo baixado')"

echo "[5/5] Instalando e iniciando o serviço systemd..."
cp /opt/whisper/whisper.service /etc/systemd/system/whisper.service
systemctl daemon-reload
systemctl enable whisper
systemctl restart whisper

sleep 3
systemctl is-active whisper && echo "WHISPER ATIVO" || echo "FALHOU AO INICIAR"
