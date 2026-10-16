# Technical Report — Track 2A: SwissGov-RSD with Apertus

> Fill in results as experiments complete. Structure follows the HackApertus
> template; adjust as needed.

## 1. Task

Token-level recognition of cross-lingual semantic differences on SwissGov-RSD
(EN-DE, EN-FR, EN-IT). Primary metric: token-level Spearman correlation,
macro-averaged over the three pairs. Scored with the official
`evaluate_predictions_admin` script.

## 2. Published Baselines vs. Our Method

| Approach | Model | EN-DE | EN-FR | EN-IT | Macro Spearman |
|---|---|---|---|---|---|
| Open-weight LLMs (few-shot) | LLaMA / Mistral | ~0.01 | ~0.02 | ~0.02 | ~0.017 |
| GPT-4o (few-shot) | GPT-4o | ~0.04 | ~0.04 | ~0.04 | ~0.040 |
| Best published DiffAlign | XLM-R + SimCSE / Qwen3 | ~0.155 | ~0.150 | ~0.160 | ~0.155 |
| **Apertus-8B (DiffAlign, Layer 31, Uncentered)** | Apertus-v1.5-8B | 0.073 | 0.060 | 0.100 | **0.078** |
| **Apertus-8B (DiffAlign, Layer 31, Centered)** | Apertus-v1.5-8B | 0.172 | 0.112 | 0.179 | **0.154** |
| **Apertus-8B (DiffAlign, Layer 20, Centered)** | Apertus-v1.5-8B | **0.288** | **0.173** | **0.305** | **0.255** |

## 3. Method & Empirical Insights

1. **Mean-Centering (MEXA Thesis Extension)**:
   - Apertus exhibits language-specific centroid offsets in raw hidden states. Subtracting the document mean representation removes this language bias, lifting macro Spearman from **0.078 to 0.154** (+98% relative gain on the final layer).
2. **Intermediate Layer Geometry (60–80% Depth)**:
   - Consistent with MEXA findings on cross-lingual representation space, alignment quality peaks at intermediate representations before task-specific next-token specialization. Sweeping from Layer 31 down to Layer 20 (62.5% depth) boosted performance to **0.255 macro Spearman** (+65% over Layer 31).

## 4. Comprehensive Layer Sweep & Ablation (Official ZurichNLP Evaluator)

*All experiments evaluated on the full dev set (168 docs/lang = 504 total pairs) via `scripts.evaluate_predictions_admin`.*

| Configuration | Layer | Depth | Center | Spearman (DE) | Spearman (FR) | Spearman (IT) | **Macro Spearman** | **Macro Kendall's Tau-b** |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Output Layer (No Center) | 31 | 100% | ✗ | 0.073 | 0.060 | 0.100 | **0.0777** | 0.0617 |
| Output Layer (Centered) | 31 | 100% | ✓ | 0.172 | 0.112 | 0.179 | **0.1543** | 0.1233 |
| Upper Layer (Centered) | 28 | 87.5% | ✓ | 0.229 | 0.145 | 0.242 | **0.2053** | 0.1643 |
| Middle-Upper (Centered) | 24 | 75.0% | ✓ | 0.260 | 0.163 | 0.275 | **0.2327** | 0.1860 |
| **Peak Alignment (Centered)** | **20** | **62.5%** | **✓** | **0.288** | **0.173** | **0.305** | **0.2553** | **0.2047** |
| Mid Layer (Centered) | 16 | 50.0% | ✓ | 0.282 | 0.154 | 0.291 | **0.2423** | 0.1943 |

## 5. Efficiency & Latency

- **Model Parameters**: 8.2B (`swiss-ai/Apertus-v1.5-8B`), evaluated in native `bfloat16`.
- **GPU Architecture**: 1x NVIDIA H100 (LRZ AI Systems `lrz-hgx-h100-94x4`).
- **Memory Footprint**: ~16.5 GB VRAM peak allocation (fits comfortably on a single 24GB+ GPU; compatible with 4-bit quantization for smaller accelerators).
- **Throughput & Speed**:
  - Entire dev split (504 document pairs across 3 language pairs): **~75 seconds total execution time**.
  - Average inference latency: **~148 ms per document pair**.
  - Compared to generative LLM prompting (~5–15 seconds per document with auto-regressive decoding loops), our DiffAlign formulation is **~50x faster** while achieving a **6x higher Spearman correlation**.

## 6. Ethics & compliance

The held-out test split was not used in any development step (loading gated via
`SWISSGOV_ALLOW_TEST`). Final numbers come from a single test run.

## 7. Reproducibility

Commands, seeds, model revisions, environment. See `README.md`.
