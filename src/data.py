"""Load the SwissGov-RSD dataset with the held-out test split gated off.

The dataset exposes, per row:
    text_a, text_b                 whitespace-tokenized strings (A = English)
    text_a_untokenized, ...        raw text
    labels_a, labels_b             per-word difference labels in [0, 1]
    page_en, page_other, id, ...   metadata

We expose a small `Example` dataclass so the rest of the pipeline does not
depend on the raw HuggingFace schema.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional

from datasets import load_dataset

from . import config


@dataclass
class Example:
    id: str
    pair: str                 # e.g. "en-de"
    tokens_a: List[str]       # English side, whitespace tokens
    tokens_b: List[str]       # other-language side
    text_a_raw: str
    text_b_raw: str
    labels_a: Optional[List[float]]   # gold, [0,1]; None if unavailable
    labels_b: Optional[List[float]]


def _infer_pair(row: dict) -> str:
    """Infer the language pair from metadata; fall back to subset/id."""
    other = (row.get("page_other") or "").lower()
    for code in ("de", "fr", "it"):
        if f"_{code}" in other or other.endswith(code):
            return f"en-{code}"
    subset = (row.get("subset") or row.get("id") or "").lower()
    for code in ("de", "fr", "it"):
        if code in subset:
            return f"en-{code}"
    return "en-??"


def _to_example(row: dict) -> Example:
    return Example(
        id=str(row.get("id", "")),
        pair=_infer_pair(row),
        tokens_a=(row["text_a"] or "").split(),
        tokens_b=(row["text_b"] or "").split(),
        text_a_raw=row.get("text_a_untokenized") or row.get("text_a") or "",
        text_b_raw=row.get("text_b_untokenized") or row.get("text_b") or "",
        labels_a=list(row["labels_a"]) if row.get("labels_a") is not None else None,
        labels_b=list(row["labels_b"]) if row.get("labels_b") is not None else None,
    )


def load_split(split: str) -> List[Example]:
    """Load a split by name. 'test' requires the explicit gate env var.

    Available splits depend on the HF repo (commonly 'dev'/'validation' and
    'test'). Use the exact name reported by `datasets.get_dataset_split_names`.
    """
    if split == "test" and not config.test_access_allowed():
        raise PermissionError(
            "Refusing to load the SwissGov-RSD test split during development. "
            f"Set {config.TEST_GATE_ENV}=1 only for the final evaluation run."
        )
    # Map dev/val to official HF split name 'validation'
    hf_split = "validation" if split in ("dev", "val") else split
    ds = load_dataset(config.HF_DATASET, split=hf_split)
    return [_to_example(r) for r in ds]


def group_by_pair(examples: List[Example]) -> dict:
    """Return {pair: [examples]} for the three evaluated pairs."""
    out: dict = {p: [] for p in config.LANG_PAIRS}
    for ex in examples:
        out.setdefault(ex.pair, []).append(ex)
    return out
