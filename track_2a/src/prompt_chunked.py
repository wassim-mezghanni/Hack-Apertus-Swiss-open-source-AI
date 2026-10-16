"""Phase 1 — chunked + structured prompting of Apertus.

Addresses the main failure mode reported in the paper: open-weight LLMs produce
malformed JSON or wrong token counts on long inputs. We therefore
  1. split each document into short windows,
  2. prompt for strict JSON with exactly one score per input token,
  3. repair / fall back when parsing or length checks fail,
  4. convert the 0-5 similarity scale into a [0,1] difference score.

The prompt mirrors the paper's labeling scheme (0 = unrelated .. 5 = equivalent,
-1 = punctuation) so results are comparable to the published baseline.
"""
from __future__ import annotations

import json
import re
from typing import List

import torch

from . import model as M

SYSTEM = (
    "Annotate a pair of input token lists. For every token in sentence 1, "
    "output an integer semantic-similarity score to the content of sentence 2 "
    "on this scale: 5 complete equivalence, 3-4 similar, 1-2 slightly similar, "
    "0 unrelated, -1 punctuation. Return ONLY raw JSON of the form "
    '{"sentence1": [["tok", score], ...]} preserving the exact tokenization.'
)


def _window(tokens: List[str], size: int, stride: int):
    i = 0
    while i < len(tokens):
        yield i, tokens[i : i + size]
        if i + size >= len(tokens):
            break
        i += stride


def _build_prompt(tok, win_a: List[str], tokens_b: List[str]) -> str:
    user = (
        f"Sentence 1 tokens: {json.dumps(win_a, ensure_ascii=False)}\n"
        f"Sentence 2 tokens: {json.dumps(tokens_b, ensure_ascii=False)}\n"
        "Respond with the JSON object."
    )
    msgs = [{"role": "system", "content": SYSTEM}, {"role": "user", "content": user}]
    if hasattr(tok, "apply_chat_template") and tok.chat_template:
        return tok.apply_chat_template(msgs, tokenize=False, add_generation_prompt=True)
    return SYSTEM + "\n\n" + user + "\n"


def _parse_scores(text: str, expected: int) -> List[float]:
    """Extract one similarity score per expected token; 0..5 scale.

    Returns a list of length `expected`; missing/invalid entries default to a
    neutral mid-similarity (2.5) so they do not dominate the correlation.
    """
    m = re.search(r"\{.*\}", text, flags=re.DOTALL)
    neutral = [2.5] * expected
    if not m:
        return neutral
    try:
        obj = json.loads(m.group(0))
        pairs = obj.get("sentence1", [])
        scores = [float(p[1]) for p in pairs]
    except (json.JSONDecodeError, ValueError, IndexError, TypeError):
        return neutral
    if len(scores) != expected:
        # length mismatch: pad / trim, the known failure mode we guard against
        scores = (scores + neutral)[:expected]
    return scores


@torch.no_grad()
def score_document(
    tokens_a: List[str],
    tokens_b: List[str],
    window: int = 60,
    stride: int = 50,
    model_id: str | None = None,
    max_new_tokens: int = 1024,
) -> List[float]:
    """Return a [0,1] difference score per token in `tokens_a`.

    Difference = 1 - similarity/5. Overlapping windows are averaged.
    """
    tok, lm = M.get_model(model_id)
    device = next(lm.parameters()).device

    acc = [0.0] * len(tokens_a)
    cnt = [0] * len(tokens_a)
    for start, win in _window(tokens_a, window, stride):
        prompt = _build_prompt(tok, win, tokens_b)
        enc = tok(prompt, return_tensors="pt", truncation=True, max_length=8192).to(device)
        gen_model = getattr(lm, "_gen_model", lm)
        gen = gen_model.generate(**enc, max_new_tokens=max_new_tokens, do_sample=False)
        text = tok.decode(gen[0, enc["input_ids"].shape[1]:], skip_special_tokens=True)
        sims = _parse_scores(text, len(win))
        for j, s in enumerate(sims):
            diff = 1.0 - max(0.0, min(5.0, s)) / 5.0
            acc[start + j] += diff
            cnt[start + j] += 1
    return [acc[i] / cnt[i] if cnt[i] else 0.5 for i in range(len(tokens_a))]
