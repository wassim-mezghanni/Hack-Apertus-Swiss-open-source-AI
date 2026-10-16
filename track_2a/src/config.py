"""Central configuration for the Track 2A SwissGov-RSD solution.

Nothing here loads data or models; it only declares paths, identifiers, and the
test-set gate. Keeping the gate in one place makes it hard to accidentally leak
the held-out test set into development.
"""
from __future__ import annotations

import os
from pathlib import Path

# --- Paths -----------------------------------------------------------------
ROOT = Path(__file__).resolve().parents[1]
PRED_DIR = ROOT / "predictions"
PRED_DEV = PRED_DIR / "dev"
PRED_TEST = PRED_DIR / "test"
for _p in (PRED_DEV, PRED_TEST):
    _p.mkdir(parents=True, exist_ok=True)

# --- Dataset ---------------------------------------------------------------
HF_DATASET = "ZurichNLP/SwissGov-RSD"

# The three evaluated language pairs. "a" is always English, "b" the other side.
LANG_PAIRS = ("en-de", "en-fr", "en-it")

# --- Models ----------------------------------------------------------------
APERTUS_8B = "swiss-ai/Apertus-v1.5-8B"
APERTUS_70B = "swiss-ai/Apertus-v1.5-70B"
# Default to 8B for iteration; efficiency is a scored (secondary) criterion.
DEFAULT_MODEL = os.environ.get("APERTUS_MODEL", APERTUS_8B)

# --- Test-set gate ---------------------------------------------------------
# The challenge forbids any development use of the test split. Loading it is
# only allowed when this env var is explicitly set to "1" (final run only).
TEST_GATE_ENV = "SWISSGOV_ALLOW_TEST"


def test_access_allowed() -> bool:
    return os.environ.get(TEST_GATE_ENV, "0") == "1"
