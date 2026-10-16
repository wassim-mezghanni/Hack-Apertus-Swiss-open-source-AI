"""Phase 0/2 driver: run a method over a split, save predictions, score locally.

Usage (from the track_2a directory):

    python -m src.run_baseline --split dev --method diffalign
    python -m src.run_baseline --split dev --method prompt --limit 20

The default split is 'dev'. The 'test' split is refused unless the
SWISSGOV_ALLOW_TEST=1 gate is set (final run only). Local scores use the
dependency-free Spearman in src.evaluate; confirm final numbers with the
official scripts.evaluate_predictions_admin.
"""
from __future__ import annotations

import argparse
import json
import torch

from tqdm import tqdm

from . import config, data
from .evaluate import macro_spearman


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--split", default="dev")
    ap.add_argument("--method", choices=["diffalign", "prompt"], default="diffalign")
    ap.add_argument("--model", default=config.DEFAULT_MODEL)
    ap.add_argument("--layer", type=int, default=-1, help="hidden layer for diffalign")
    ap.add_argument("--center", action="store_true",
                    help="mean-center embeddings (thesis-recommended for Apertus)")
    ap.add_argument("--load-in-4bit", action="store_true",
                    help="4-bit quantization (fits the 70B on one GPU)")
    ap.add_argument("--shard-id", type=int, default=0, help="shard index (0-indexed)")
    ap.add_argument("--num-shards", type=int, default=1, help="total shards for parallel inference")
    ap.add_argument("--num-threads", type=int, default=0, help="torch threads per worker (0=default)")
    ap.add_argument("--limit", type=int, default=0, help="cap #docs (0 = all)")
    args = ap.parse_args()

    if args.num_threads > 0:
        torch.set_num_threads(args.num_threads)

    examples = data.load_split(args.split)
    if args.num_shards > 1:
        examples = [ex for i, ex in enumerate(examples) if i % args.num_shards == args.shard_id]
    if args.limit:
        examples = examples[: args.limit]
    by_pair = data.group_by_pair(examples)

    preds: dict = {p: [] for p in config.LANG_PAIRS}
    golds: dict = {p: [] for p in config.LANG_PAIRS}
    records = []

    for pair in config.LANG_PAIRS:
        for ex in tqdm(by_pair.get(pair, []), desc=f"{args.method}:{pair}"):
            if args.method == "diffalign":
                from .diffalign_apertus import score_pair

                sa, sb = score_pair(" ".join(ex.tokens_a),
                                    " ".join(ex.tokens_b),
                                    layer=args.layer, model_id=args.model,
                                    center=args.center, load_in_4bit=args.load_in_4bit)
            else:
                from .prompt_chunked import score_document

                sa = score_document(ex.tokens_a, ex.tokens_b, model_id=args.model)
                sb = score_document(ex.tokens_b, ex.tokens_a, model_id=args.model)

            preds[pair].append(sa)
            if ex.labels_a is not None:
                golds[pair].append(ex.labels_a)
            records.append({"id": ex.id, "pair": pair,
                            "scores_a": sa, "scores_b": sb})

    out_dir = config.PRED_TEST if args.split == "test" else config.PRED_DEV
    suffix = f"_{args.shard_id}" if args.num_shards > 1 else ""
    out_file = out_dir / f"{args.method}_{args.split}{suffix}.jsonl"
    with open(out_file, "w", encoding="utf-8") as fh:
        for r in records:
            fh.write(json.dumps(r, ensure_ascii=False) + "\n")
    print(f"wrote predictions -> {out_file}")

    if any(golds[p] for p in config.LANG_PAIRS):
        scores = macro_spearman(preds, golds)
        print("local Spearman (confirm with official script):")
        for k, v in scores.items():
            print(f"  {k}: {v:.4f}")


if __name__ == "__main__":
    main()
