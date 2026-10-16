"""Parallel multi-core test split inference orchestrator.

Runs Apertus-v1.5-8B DiffAlign across N shards on CPU, merges predictions,
exports the official ZurichNLP benchmark files, and produces the final test submission zip.
"""
import argparse
import glob
import json
from pathlib import Path
import subprocess
import sys
import time
import zipfile

from . import config, export_official


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--num-shards", type=int, default=6, help="number of parallel workers")
    ap.add_argument("--num-threads", type=int, default=8, help="threads per worker")
    ap.add_argument("--layer", type=int, default=20, help="hidden layer for DiffAlign")
    ap.add_argument("--model", default="swiss-ai/Apertus-v1.5-8B", help="model ID")
    args = ap.parse_args()

    out_dir = config.PRED_TEST
    out_dir.mkdir(parents=True, exist_ok=True)
    merged_file = out_dir / "diffalign_test.jsonl"

    print(f"=== Starting parallel test inference: {args.num_shards} workers, {args.num_threads} threads/worker ===")
    t0 = time.time()

    env = dict(subprocess.os.environ)
    env["MKL_THREADING_LAYER"] = "GNU"
    env["MKL_SERVICE_FORCE_INTEL"] = "1"

    processes = []
    for shard_id in range(args.num_shards):
        cmd = [
            sys.executable,
            "-m", "src.run_baseline",
            "--split", "test",
            "--method", "diffalign",
            "--model", args.model,
            "--layer", str(args.layer),
            "--center",
            "--shard-id", str(shard_id),
            "--num-shards", str(args.num_shards),
            "--num-threads", str(args.num_threads),
        ]
        log_path = out_dir / f"worker_{shard_id}.log"
        f_log = open(log_path, "w", encoding="utf-8")
        p = subprocess.Popen(cmd, stdout=f_log, stderr=subprocess.STDOUT, env=env)
        processes.append((shard_id, p, f_log, log_path))
        print(f"  Launched worker {shard_id} (PID {p.pid}) -> {log_path.name}")

    print("Waiting for all workers to complete...")
    for shard_id, p, f_log, log_path in processes:
        ret = p.wait()
        f_log.close()
        status = "SUCCESS" if ret == 0 else f"FAILED (code {ret})"
        print(f"  Worker {shard_id} finished: {status}")
        if ret != 0:
            print(f"--- Tail of {log_path.name} ---")
            with open(log_path, "r") as f:
                print("".join(f.readlines()[-20:]))
            raise RuntimeError(f"Worker {shard_id} failed!")

    elapsed = time.time() - t0
    print(f"All workers finished in {elapsed/60:.2f} minutes.")

    # Merge shards
    print("Merging shard predictions into diffalign_test.jsonl...")
    merged_records = []
    seen_ids = set()
    for shard_id in range(args.num_shards):
        shard_file = out_dir / f"diffalign_test_{shard_id}.jsonl"
        with open(shard_file, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    rec = json.loads(line)
                    if rec["id"] not in seen_ids:
                        seen_ids.add(rec["id"])
                        merged_records.append(rec)

    with open(merged_file, "w", encoding="utf-8") as f:
        for r in merged_records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    print(f"Merged {len(merged_records)} unique document predictions into {merged_file}")

    # Export official format
    print("Exporting official format...")
    export_official.export(split="test", in_file=merged_file)

    # Package into submission zip
    official_dir = out_dir / "official_format"
    zip_path = config.DIR_PREDICTIONS / "swissgov_rsd_track2a_apertus_submission_test.zip"
    print(f"Packaging {zip_path}...")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        for fpath in glob.glob(str(official_dir / "*.jsonl")):
            arcname = Path(fpath).name
            z.write(fpath, arcname)
            print(f"  Added {arcname} ({Path(fpath).stat().st_size} bytes)")

    print(f"=== Complete! Test submission archive ready: {zip_path} ({zip_path.stat().st_size / 1024:.1f} KB) ===")


if __name__ == "__main__":
    main()
