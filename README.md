# Track 2A (UZH): SwissGov-RSD with Apertus

Cross-lingual, token-level semantic-difference recognition on Swiss government
documents (EN paired with DE / FR / IT), using **Apertus v1.5**.

See `PLAN.md` for the full strategy and `technical_report.md` for the writeup.

## Setup

```bash
# Python 3.11 recommended
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

## Run (from the track_2a directory)

```bash
# Phase 2 — DiffAlign with Apertus (unsupervised, recommended first run)
python -m src.run_baseline --split dev --method diffalign --limit 10

# Phase 1 — chunked structured prompting baseline
python -m src.run_baseline --split dev --method prompt --limit 10
```

Choose the model with `APERTUS_MODEL` (defaults to the 8B):

```bash
APERTUS_MODEL=swiss-ai/Apertus-v1.5-8B python -m src.run_baseline --split dev --method diffalign
```

## Docker (recommended for reproducibility)

Two images, one compose project:
- **`gpu`** — CUDA 12.1 base, for real runs on an NVIDIA host (needs the
  [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/)).
- **`cpu`** — `python:3.11-slim`, for local dev on a Mac / CPU-only host.

> On macOS, Docker **cannot pass through a GPU**. The images build and run
> CPU-only locally — good for code checks and tiny `--limit` smoke tests, too
> slow for full Apertus inference. Do real 8B/70B runs on a GPU box with the
> `gpu` service.

```bash
# Local smoke test on a Mac (CPU)
docker compose run --rm cpu \
  python -m src.run_baseline --split dev --method diffalign --limit 2

# Real run on an NVIDIA GPU host
docker compose run --rm gpu \
  python -m src.run_baseline --split dev --method diffalign

# Private/gated HF model? pass a token (never bake it into the image)
HF_TOKEN=hf_xxx docker compose run --rm gpu \
  python -m src.run_baseline --split dev --method diffalign
```

Downloaded models/datasets persist in the `hf-cache` volume, so Apertus is only
pulled once. Pick the model with `APERTUS_MODEL` (defaults to the 8B).

```

Files:
- `coma/bootstrap_coma.sh` — clone/update, add deps to `mexa_conda`, submit smoke test.
- `coma/run_dev_smoke.sbatch` — 2-doc smoke test (conda + `module load cuda/12.6.3`).
- `coma/run_diffalign.sbatch` — full dev DiffAlign run with mean-centering.

The hidden-state extraction in `src/model.py` is ported from the thesis's
`embed_extractor.py` (Apertus-hardened: flex_attention guard, quantized-model
`.to` patch, rotary device fix, 4/8-bit support). The Docker files below are for
local dev on a Mac.

## Test-set rule (important)

The held-out `test` split must **never** be used during development. Loading it
is blocked unless you explicitly set the gate, which should happen only for the
single final run:

```bash
SWISSGOV_ALLOW_TEST=1 python -m src.run_baseline --split test --method diffalign
```

## Scoring

`src/evaluate.py` gives a fast local Spearman for dev iteration. The **official**
number must come from the challenge repo's `scripts.evaluate_predictions_admin`
(it defines preprocessing and punctuation handling). Clone
[`ZurichNLP/SwissGov-RSD`](https://github.com/ZurichNLP/SwissGov-RSD) and run
it against the saved predictions before reporting results.

## Layout

```
src/
  config.py            paths, model ids, test gate
  data.py              load dataset (test gated)
  subword_to_word.py   subword -> word score pooling (critical)
  model.py             Apertus loader (embeddings + generation)
  diffalign_apertus.py Phase 2: unsupervised alignment scoring
  prompt_chunked.py    Phase 1: chunked + structured prompting
  ensemble.py          Phase 3: rank blending
  evaluate.py          local Spearman (macro over pairs)
  run_baseline.py      driver
```
