# SwissGov-RSD with Apertus — Short Method Description

**Track 2A (UZH) · HackApertus 2026**
**Task:** Token-level cross-lingual semantic-difference recognition (EN–DE, EN–FR, EN–IT)
**Model:** `swiss-ai/Apertus-v1.5-8B` · **Primary metric:** macro-averaged token-level Spearman correlation

---

## 1. Problem and approach in one paragraph

For a pair of related documents in two languages, we assign every whitespace
token a score for how strongly its meaning diverges from the aligned content in
the other document. Prior work shows prompted LLMs perform poorly on this
benchmark and lose to unsupervised encoder-embedding methods. We therefore do
**not** prompt Apertus to emit scores. Instead we use Apertus purely as an
**encoder** and compute alignment geometrically in its hidden-state space — an
unsupervised, training-free method we call **DiffAlign-Apertus**. Two design
choices, both motivated by prior findings on Apertus's representation geometry,
drive the result: (i) scoring from an **intermediate layer** rather than the
output layer, and (ii) **mean-centering** token embeddings before comparison.

## 2. Method: DiffAlign-Apertus

**Encoding.** Each document is tokenized and passed once through Apertus-v1.5-8B
with `output_hidden_states=True`. We take the per-token hidden states of a single
layer `ℓ`. (Apertus-v1.5 is a multimodal/Omni checkpoint; we extract the inner
language-model module to obtain text hidden states.)

**Alignment score.** Let `H_A ∈ R^{n×d}` and `H_B ∈ R^{m×d}` be the subword
hidden states of documents A and B at layer `ℓ`. For each token `a_i` in A we
compute its best cross-document alignment as the maximum cosine similarity to any
token in B, and define its **difference score** as its complement:

```
diff(a_i) = 1 − max_j cos( h(a_i), h(b_j) )
```

The symmetric score for B is computed the same way against A. A token that has no
well-aligned counterpart (an addition, omission, or mistranslation) receives a
high difference score. The method is entirely unsupervised: no labels, no
training, no risk of test-set leakage.

**Mean-centering.** Apertus's embedding space is anisotropic: raw cosine
nearest-neighbour retrieval is weak even where the representations are
semantically informative, because a shared language-identity offset dominates the
geometry. We subtract the per-document mean token vector before scoring:

```
h̃(a_i) = h(a_i) − (1/n) Σ_k h(a_k)
```

This removes the language-identity component and exposes the semantic signal.
Empirically it is the single largest lever in our system (Section 4).

**Layer selection.** We score from an intermediate layer rather than the final
layer. Cross-lingual alignment in decoder LLMs peaks in the middle of the network
(≈60–80% depth), where representations are most language-agnostic, before
diverging in the final layers for next-token prediction. A dev-set sweep confirms
this on Apertus (Section 4), with the peak at **layer 20 (62.5% depth)**.

**Subword→word pooling.** Gold labels are defined over whitespace words, while
Apertus uses subword tokenization. Using the tokenizer's character offset
mapping, we assign each subword to its whitespace word and pool subword scores by
**max** (any strongly-diverging piece marks the word as different). This step is
essential: a subword/word mismatch silently destroys the token-level correlation.
Punctuation is excluded from scoring to match the official evaluation.

## 3. Experimental setup

- **Data.** `ZurichNLP/SwissGov-RSD`, development split (168 documents per
  language, 504 total). The held-out **test split is never used during
  development**; it is gated behind an explicit flag and run only once at the end.
- **Scoring.** The official `evaluate_predictions_admin.py` from the ZurichNLP
  repository (defines preprocessing and punctuation handling). We report both
  Spearman and Kendall τ-b.
- **Hyperparameter selection.** Layer and centering chosen on **dev only**.
- **Hardware.** A single NVIDIA H100 (80 GB) on the LRZ AI Systems cluster;
  Apertus loaded in native bfloat16.

## 4. Results (development split, official evaluator)

**Layer sweep and centering ablation** (macro-averaged token-level Spearman):

| Configuration | Layer | Depth | Center | DE | FR | IT | **Macro** |
|---|---:|---:|:---:|---:|---:|---:|---:|
| Output, uncentered | 31 | 100% | ✗ | 0.073 | 0.060 | 0.100 | **0.078** |
| Output, centered | 31 | 100% | ✓ | 0.172 | 0.112 | 0.179 | **0.154** |
| Upper, centered | 28 | 87.5% | ✓ | 0.229 | 0.145 | 0.242 | **0.205** |
| Mid-upper, centered | 24 | 75.0% | ✓ | 0.260 | 0.163 | 0.275 | **0.233** |
| Mid, centered | 16 | 50.0% | ✓ | 0.282 | 0.154 | 0.291 | **0.242** |
| **Peak, centered (ours)** | **20** | **62.5%** | **✓** | **0.288** | **0.173** | **0.305** | **0.255** |

**Two findings.**
1. **Mean-centering roughly doubles alignment** at the output layer (0.078 →
   0.154 macro), confirming that Apertus's anisotropy, not a lack of semantic
   content, limits raw cosine retrieval.
2. **Alignment peaks at intermediate depth**, not the output layer: layer 20
   (62.5% depth) is best at **0.255 macro**, with performance rising toward the
   middle and falling at both ends.

**Context.** Published SwissGov-RSD results report prompted LLMs around
0.02–0.04 and the best unsupervised DiffAlign (XLM-R/Qwen3 encoders) around 0.155
macro Spearman. Our dev result of **0.255** is therefore substantially above the
prompting baselines and above the published unsupervised figures. *Caveat:* our
0.255 is a **dev-set** number; published figures are on the test split, so this
is an indicative, not a like-for-like, comparison. The final test-set number
(single run, frozen config) is reported in the technical report.

## 5. Efficiency (secondary criterion)

DiffAlign-Apertus is a **single forward pass** with no autoregressive decoding.
On one H100 it processes the 504-document dev set in ≈75 s (~0.15 s per document
pair) with ≈16.5 GB peak VRAM. By construction it produces exactly one score per
input token, so it has **no JSON-parsing or token-count failures** — the main
failure mode of prompting approaches on long documents. This makes a well-tuned
8B configuration both accurate and cheap.

## 6. Reproducibility and deliverables

- Code: `src/` (model loader, DiffAlign, subword pooling, official export) with
  conda/Slurm run scripts for the LRZ and COMA clusters.
- Final config: `--method diffalign --layer 20 --center` on Apertus-v1.5-8B.
- Baseline contrast: a few-shot prompting run on the same model records the
  required before/after delta.
- Predictions exported to the official ZurichNLP schema; test run executed once
  with the dev-frozen config.

**Summary.** Treating Apertus as an encoder, correcting for its anisotropic
geometry via mean-centering, and reading from the layer where cross-lingual
alignment peaks turns an 8B decoder — weak at this task under prompting — into a
competitive, efficient, fully unsupervised semantic-difference detector.
