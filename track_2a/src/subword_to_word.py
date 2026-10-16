"""Map subword-level scores back to whitespace-word-level scores.

This is the single most important correctness component. The gold labels are
defined over whitespace tokens, but Apertus (and any subword tokenizer) splits
words into multiple pieces. If we score at the subword level and compare to
word-level gold, the Spearman correlation is meaningless.

Strategy: use the tokenizer's offset mapping to assign each subword to the
whitespace word whose character span contains it, then pool the subword scores
per word (default: max, since any strongly-differing piece should mark the
word as differing).
"""
from __future__ import annotations

from typing import Callable, List, Sequence

import numpy as np


def word_char_spans(text: str) -> List[tuple]:
    """Return (start, end) character spans for each whitespace-delimited word.

    `text` must be the exact string whose `.split()` produced the token list,
    so spans line up with the whitespace tokenization used for the gold labels.
    """
    spans = []
    i = 0
    n = len(text)
    while i < n:
        while i < n and text[i].isspace():
            i += 1
        if i >= n:
            break
        start = i
        while i < n and not text[i].isspace():
            i += 1
        spans.append((start, i))
    return spans


def pool_subword_to_word(
    subword_scores: Sequence[float],
    offsets: Sequence[tuple],
    word_spans: Sequence[tuple],
    reduce: Callable[[List[float]], float] = max,
    default: float = 0.0,
) -> List[float]:
    """Aggregate subword scores into one score per whitespace word.

    Args:
        subword_scores: score per subword token.
        offsets: (char_start, char_end) per subword token (special tokens
            should have start == end so they contribute to no word).
        word_spans: (char_start, char_end) per whitespace word.
        reduce: pooling function over the subword scores of a word.
        default: score for words that received no subword (should be rare).
    """
    buckets: List[List[float]] = [[] for _ in word_spans]
    # Two-pointer sweep assuming both lists are in increasing char order.
    wi = 0
    for score, (s, e) in zip(subword_scores, offsets):
        if e <= s:  # special token / empty span
            continue
        center = (s + e) / 2.0
        # advance to the word whose span contains the subword center
        while wi < len(word_spans) and word_spans[wi][1] <= center:
            wi += 1
        if wi >= len(word_spans):
            break
        ws, we = word_spans[wi]
        if ws <= center < we:
            buckets[wi].append(float(score))
        else:
            # subword sits in inter-word whitespace; attach to nearest prior word
            if wi > 0:
                buckets[wi - 1].append(float(score))
    return [reduce(b) if b else default for b in buckets]


def normalize_scores(scores: Sequence[float]) -> List[float]:
    """Min-max normalize to [0,1]; Spearman is rank-based so this is cosmetic,
    but keeps outputs comparable across methods for ensembling."""
    arr = np.asarray(scores, dtype=float)
    if arr.size == 0:
        return []
    lo, hi = float(arr.min()), float(arr.max())
    if hi - lo < 1e-9:
        return [0.0] * arr.size
    return ((arr - lo) / (hi - lo)).tolist()
