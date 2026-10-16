"""Apertus loader for token-level hidden states and generation.

Ported from the author's MEXA-fork `embed_extractor.py`, which is already
battle-tested against the Apertus family on the COMA/CSCS clusters. It carries
the Apertus-specific workarounds (flex_attention import guard, quantized-model
`.to` patch, rotary-embedding device placement, slow-tokenizer fallback, and the
empty-HF-token fix). Unlike MEXA (sentence embeddings) we expose *per-subword*
hidden states + char offsets, which the token-level RSD task needs.
"""
from __future__ import annotations

from functools import lru_cache
from typing import List, Optional, Tuple

import torch

from . import config

# --- Apertus-specific import/runtime guards (from embed_extractor.py) -------
try:  # avoid ImportError on some torch builds
    import torch.nn.attention.flex_attention as _flex
    if not hasattr(_flex, "AuxRequest"):
        _flex.AuxRequest = object
except ImportError:
    pass

try:  # `.to` is unsupported for quantized models under device_map='auto'
    from transformers import PreTrainedModel

    _orig_to = PreTrainedModel.to

    def _patched_to(self, *args, **kwargs):
        if getattr(self, "quantization_method", None) is not None:
            return self
        return _orig_to(self, *args, **kwargs)

    PreTrainedModel.to = _patched_to
except ImportError:
    pass

try:
    from transformers import AutoConfig, AutoModelForCausalLM, ApertusConfig, ApertusForCausalLM

    class Apertus1p5Config(ApertusConfig):
        model_type = "apertus1p5"

    class Apertus1p5ForCausalLM(ApertusForCausalLM):
        config_class = Apertus1p5Config

    AutoConfig.register("apertus1p5", Apertus1p5Config)
    AutoModelForCausalLM.register(Apertus1p5Config, Apertus1p5ForCausalLM)
except Exception:
    pass

if torch.cuda.is_available():
    torch.cuda.init()


@lru_cache(maxsize=2)
def _load(model_id: str, load_in_4bit: bool, load_in_8bit: bool, token: Optional[str]):
    from transformers import AutoModelForCausalLM, AutoTokenizer
    try:
        from transformers import AutoModelForMultimodalLM
    except ImportError:
        AutoModelForMultimodalLM = None

    use_cuda = torch.cuda.is_available() and (
        torch.cuda.get_device_capability()[0] >= 7.5
        if torch.cuda.is_available()
        else False
    )
    device_map = "auto" if use_cuda else "cpu"
    token = token.strip() if token and token.strip() else None  # empty token breaks HF auth

    quant_kwargs = {}
    if load_in_4bit or load_in_8bit:
        from transformers import BitsAndBytesConfig

        if load_in_4bit:
            compute_dtype = (
                torch.bfloat16
                if use_cuda and torch.cuda.is_bf16_supported()
                else torch.float16
            )
            quant_kwargs["quantization_config"] = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=compute_dtype,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_use_double_quant=True,
            )
        else:
            quant_kwargs["quantization_config"] = BitsAndBytesConfig(load_in_8bit=True)

    default_dtype = None
    if use_cuda and not quant_kwargs:
        default_dtype = torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float32

    model = None
    try:
        from transformers import Apertus1p5ForConditionalGeneration
    except ImportError:
        Apertus1p5ForConditionalGeneration = None

    if Apertus1p5ForConditionalGeneration is not None:
        try:
            model = Apertus1p5ForConditionalGeneration.from_pretrained(
                model_id,
                device_map=device_map,
                torch_dtype=default_dtype,
                trust_remote_code=True,
                token=token,
                **quant_kwargs,
            )
        except Exception:
            pass

    if model is None and AutoModelForMultimodalLM is not None:
        try:
            model = AutoModelForMultimodalLM.from_pretrained(
                model_id,
                device_map=device_map,
                torch_dtype=default_dtype,
                trust_remote_code=True,
                token=token,
                **quant_kwargs,
            )
        except Exception:
            pass

    if model is None:
        model = AutoModelForCausalLM.from_pretrained(
            model_id,
            device_map=device_map,
            torch_dtype=default_dtype,
            trust_remote_code=True,
            token=token,
            **quant_kwargs,
        )

    # If this is an Omni/multimodal conditional generation model (Apertus 1.5),
    # extract the core language model component
    if hasattr(model, "model") and hasattr(model.model, "language_model"):
        lm = model.model.language_model
    elif hasattr(model, "language_model"):
        lm = model.language_model
    else:
        lm = model

    # accelerate sometimes leaves rotary embeddings on CPU for quantized models
    if use_cuda:
        for name, module in lm.named_modules():
            if "rotary" in name.lower() or "rotary" in module.__class__.__name__.lower():
                module.to("cuda")

    object.__setattr__(lm, "_gen_model", model)
    lm.eval()
    model.eval()

    try:
        tok = AutoTokenizer.from_pretrained(model_id, token=token, trust_remote_code=True)
    except Exception:  # SentencePiece models that fail fast-tokenizer conversion
        tok = AutoTokenizer.from_pretrained(
            model_id, token=token, trust_remote_code=True, use_fast=False
        )
    if tok.pad_token is None:
        tok.pad_token = tok.eos_token
    return tok, lm


def get_model(
    model_id: str | None = None,
    load_in_4bit: bool = False,
    load_in_8bit: bool = False,
    token: str | None = None,
):
    """Load (and cache) an Apertus tokenizer+model.

    Use `load_in_4bit=True` to fit the 70B on a single GPU. `token` falls back
    to the HF_TOKEN env var inside the HF libraries if omitted.
    """
    import os

    return _load(
        model_id or config.DEFAULT_MODEL,
        load_in_4bit,
        load_in_8bit,
        token or os.environ.get("HF_TOKEN"),
    )


@torch.no_grad()
def embed_tokens(
    text: str,
    layer: int = -1,
    model_id: str | None = None,
    load_in_4bit: bool = False,
    load_in_8bit: bool = False,
) -> Tuple[torch.Tensor, List[Tuple[int, int]]]:
    """Return (subword_embeddings, char_offsets) for one text.

    subword_embeddings: (num_subwords, hidden) float tensor on CPU.
    char_offsets: (start, end) per subword, for subword->word pooling.
    `layer` selects a hidden-state layer; the thesis finds peak cross-lingual
    alignment around 60-80% network depth, so a middle layer is worth trying.
    """
    tok, lm = get_model(model_id, load_in_4bit, load_in_8bit)
    enc = tok(
        text,
        return_offsets_mapping=True,
        return_tensors="pt",
        truncation=True,
        max_length=8192,
    )
    offsets = enc.pop("offset_mapping")[0].tolist()
    device = next(lm.parameters()).device
    enc = {k: v.to(device) for k, v in enc.items()}
    out = lm(**enc, output_hidden_states=True)
    hidden = out.hidden_states[layer][0]  # (seq, hidden)
    return hidden.float().cpu(), [tuple(o) for o in offsets]
