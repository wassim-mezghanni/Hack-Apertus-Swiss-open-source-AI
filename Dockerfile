# GPU-ready image for SwissGov-RSD with Apertus.
#
# Base: CUDA 12.1 runtime on Ubuntu 22.04. On a machine with NVIDIA GPUs run
# with `--gpus all` (needs the NVIDIA Container Toolkit). On macOS this image
# still builds and runs CPU-only (no GPU passthrough) — fine for code tests and
# tiny `--limit` smoke runs, too slow for full 8B/70B inference.
FROM nvidia/cuda:12.1.1-cudnn8-runtime-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/cache/huggingface

# Python 3.11 (matches the upstream ZurichNLP repo recommendation).
RUN apt-get update && apt-get install -y --no-install-recommends \
        python3.11 python3.11-venv python3-pip git \
    && ln -sf /usr/bin/python3.11 /usr/bin/python \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install deps first for better layer caching.
COPY requirements.txt .
RUN python -m pip install --upgrade pip \
    && python -m pip install -r requirements.txt

COPY . .

# Model/dataset caches persist via a mounted volume (see compose).
VOLUME ["/cache/huggingface"]

# Default: a tiny DiffAlign smoke run on dev. Override the command as needed.
CMD ["python", "-m", "src.run_baseline", "--split", "dev", "--method", "diffalign", "--limit", "2"]
