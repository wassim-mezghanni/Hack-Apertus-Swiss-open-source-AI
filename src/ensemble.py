"""Phase 3 — blend method outputs and apply dev-calibrated post-processing.

Spearman is rank-based, so the ensemble combines rank information. We convert
each method's per-token scores to ranks, average the ranks (optionally
weighted), and return the combined ranking. Weights should be tuned on the dev
split only.
"""
from __future__ import annotations

from typing import List, Sequence

import numpy as np
from scipy.stats import rankdata


def rank_blend(
    score_lists: Sequence[Sequence[float]],
    weights: Sequence[float] | None = None,
) -> List[float]:
    """Weighted average of per-method ranks for one document.

    All score lists must have the same length (one score per token).
    """
    arrays = [np.asarray(s, dtype=float) for s in score_lists]
    n = arrays[0].size
    if any(a.size != n for a in arrays):
        raise ValueError("All score lists must share the same length")
    if weights is None:
        weights = [1.0] * len(arrays)
    w = np.asarray(weights, dtype=float)
    w = w / w.sum()
    ranks = np.vstack([rankdata(a) for a in arrays])   # (methods, tokens)
    blended = (w[:, None] * ranks).sum(axis=0)
    return blended.tolist()
