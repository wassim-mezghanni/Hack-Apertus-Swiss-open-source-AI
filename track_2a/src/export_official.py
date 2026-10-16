"""Export predictions to the official ZurichNLP evaluation benchmark schema.

Generates:
    <out_dir>/diffalign_{de,fr,it}.jsonl.jsonl
    <out_dir>/diffalign_{de,fr,it}.jsonl (clean single extension)
"""
import argparse
import json
from pathlib import Path
from . import data, config


def export(split: str = "dev", in_file: Path | None = None, out_dir: Path | None = None):
    in_dir = config.PRED_TEST if split == "test" else config.PRED_DEV
    if in_file is None:
        in_file = in_dir / f"diffalign_{split}.jsonl"
    if out_dir is None:
        out_dir = in_dir / "official_format"
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"Loading predictions from {in_file}...")
    with open(in_file, "r", encoding="utf-8") as f:
        preds = {r["id"]: r for r in (json.loads(line) for line in f if line.strip())}

    print(f"Loading dataset split {split}...")
    exs = {e.id: e for e in data.load_split(split)}

    gold_dir = Path.home() / "swissgov" / "SwissGov-RSD" / "data" / "evaluation" / "gold_labels" / split

    for lang in ["de", "fr", "it"]:
        gold_file = gold_dir / f"gold_admin_{lang}.jsonl"
        gold_ids = []
        if gold_file.exists():
            with open(gold_file, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        gold_ids.append(json.loads(line)["id"])
        else:
            # Fallback to IDs matching language tag
            gold_ids = [eid for eid in exs if f"_{lang}_" in eid]

        target_double = out_dir / f"diffalign_{lang}.jsonl.jsonl"
        target_single = out_dir / f"diffalign_{lang}.jsonl"

        with open(target_double, "w", encoding="utf-8") as f_double, \
             open(target_single, "w", encoding="utf-8") as f_single:
            for gid in gold_ids:
                p = preds.get(gid)
                ex = exs.get(gid)
                if not p or not ex:
                    continue
                rec = {
                    "id": gid,
                    "text_a": " ".join(ex.tokens_a),
                    "text_b": " ".join(ex.tokens_b),
                    "labels_a": p["scores_a"],
                    "labels_b": p["scores_b"],
                }
                line = json.dumps(rec, ensure_ascii=False) + "\n"
                f_double.write(line)
                f_single.write(line)

        print(f"Exported {len(gold_ids)} items for {lang} -> {target_double.name} & {target_single.name}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--split", default="dev")
    parser.add_argument("--in-file", type=Path, default=None)
    parser.add_argument("--out-dir", type=Path, default=None)
    args = parser.parse_args()
    export(args.split, args.in_file, args.out_dir)
