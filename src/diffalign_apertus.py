"""Phase 2 — DiffAlign using Apertus hidden states (unsupervised, test-safe).

For each token in document A, the difference score is 1 minus its best
alignment (max cosine similarity) to any token in document B, and vice versa.
This reproduces the strongest published baseline family on SwissGov-RSD, but
with Apertus as the encoder instead of XLM-R / embedding models.

Thesis-grounded extension — MEAN-CENTERING: the author's MEXA thesis found that
Apertus has a non-isotropic representation geometry (strong downstream accuracy
despite weak raw cosine nearest-neighbor retrieval), and that subtracting the
per-side centroid removes language-identity offsets and lifts cross-lingual
alignment substantially. We expose `center=True` to apply the same trick here;
it is expected to help specifically on Apertus.

Entirely unsupervised: no labels, no risk of test leakage.
"""
from __future__ import annotations

from typing import List, Tuple

import torch
import torch.nn.functional as F

from . import model as M
from .subword_to_word import pool_subword_to_word, word_char_spans


def _max_alignment(h_a: torch.Tensor, h_b: torch.Tensor) -> torch.Tensor:
    """For each row in h_a, the max cosine similarity to any row in h_b."""
    a = F.normalize(h_a, dim=-1)
    b = F.normalize(h_b, dim=-1)
    sim = a @ b.T                      # (len_a, len_b)
    return sim.max(dim=1).values       # (len_a,)


def _center(h: torch.Tensor) -> torch.Tensor:
    """Subtract the mean token vector (removes language-identity offset)."""
    if h.numel() == 0:
        return h
    return h - h.mean(dim=0, keepdim=True)


def score_pair(
    text_a: str,
    text_b: str,
    layer: int = -1,
    model_id: str | None = None,
    center: bool = False,
    load_in_4bit: bool = False,
) -> Tuple[List[float], List[float]]:
    """Return (word_scores_a, word_scores_b), each in [0,1], difference scores.

    Higher = more semantically different (less well aligned to the other doc).
    Set `center=True` to apply mean-centering (recommended for Apertus).
    `load_in_4bit=True` lets the 70B fit on a single GPU.
    """
    h_a, off_a = M.embed_tokens(text_a, layer=layer, model_id=model_id, load_in_4bit=load_in_4bit)
    h_b, off_b = M.embed_tokens(text_b, layer=layer, model_id=model_id, load_in_4bit=load_in_4bit)

    if center:
        h_a, h_b = _center(h_a), _center(h_b)

    diff_a = (1.0 - _max_alignment(h_a, h_b)).clamp(0, 1).tolist()
    diff_b = (1.0 - _max_alignment(h_b, h_a)).clamp(0, 1).tolist()

    words_a = word_char_spans(text_a)
    words_b = word_char_spans(text_b)
    score_a = pool_subword_to_word(diff_a, off_a, words_a, reduce=max)
    score_b = pool_subword_to_word(diff_b, off_b, words_b, reduce=max)
    return score_a, score_b
