"""Evaluation: token-level Spearman correlation, macro-averaged over pairs.

NOTE: the official challenge scoring MUST use the repo's
`scripts.evaluate_predictions_admin`, which fixes preprocessing and
punctuation handling. This module is a lightweight, dependency-free stand-in
for fast local iteration on the dev split. Always confirm final numbers with
the official script before reporting them.
"""
from __future__ import annotations

from typing import Dict, List, Sequence

import numpy as np
from scipy.stats import spearmanr


def token_spearman(pred: Sequence[float], gold: Sequence[float]) -> float:
    """Spearman correlation for one document's token scores.

    Tokens whose gold label is punctuation should already be excluded by the
    caller (the official script marks punctuation as -1 and drops it). Returns
    NaN when correlation is undefined (constant input).
    """
    if len(pred) != len(gold) or len(pred) < 2:
        return float("nan")
    filt = [(p, g) for p, g in zip(pred, gold) if g != -1]
    if len(filt) < 2:
        return float("nan")
    p_filt, g_filt = zip(*filt)
    rho, _ = spearmanr(p_filt, g_filt)
    return float(rho)


def macro_spearman(
    predictions: Dict[str, List[Sequence[float]]],
    golds: Dict[str, List[Sequence[float]]],
) -> Dict[str, float]:
    """Compute per-pair and macro-averaged Spearman.

    Args:
        predictions / golds: {pair: [per-doc token-score lists]}, aligned by
            index within each pair.
    Returns:
        {pair: mean_spearman, ..., "macro": mean over pairs}.
    """
    per_pair: Dict[str, float] = {}
    for pair, pred_docs in predictions.items():
        gold_docs = golds.get(pair, [])
        vals = []
        for p, g in zip(pred_docs, gold_docs):
            r = token_spearman(p, g)
            if not np.isnan(r):
                vals.append(r)
        per_pair[pair] = float(np.mean(vals)) if vals else float("nan")
    valid = [v for v in per_pair.values() if not np.isnan(v)]
    per_pair["macro"] = float(np.mean(valid)) if valid else float("nan")
    return per_pair
