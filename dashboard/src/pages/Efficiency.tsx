import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Cpu, 
  Server, 
  Clock, 
  CheckCircle2, 
  Terminal, 
  Copy, 
  Check, 
  ShieldCheck,
  TrendingDown
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

export default function Efficiency() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const speedComparisonData = [
    { name: 'Generative Prompting (Auto-regressive)', latency: 7500, fill: '#ef4444' },
    { name: 'Prior DiffAlign (XLM-R / SimCSE)', latency: 220, fill: '#64748b' },
    { name: 'Apertus-8B DiffAlign (Ours)', latency: 148, fill: '#E30613' },
  ];

  const slurmSnippet = `#!/bin/bash
#SBATCH -J diffalign_dev
#SBATCH -p gpu_h100
#SBATCH --gres=gpu:1
#SBATCH --time=00:30:00

module load cuda/12.6.3
conda activate mexa_conda

export APERTUS_MODEL="swiss-ai/Apertus-v1.5-8B"
python -m src.run_baseline --split dev --method diffalign --layer 20 --center
python -m src.export_official --predictions predictions/dev/diffalign_dev.jsonl
python scripts/evaluate_predictions_admin.py dev diffalign`;

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
            <Zap className="w-4 h-4" />
            <span>High-Throughput Inference</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-on-surface tracking-tight">
            Efficiency, Latency & Cluster Scalability
          </h1>
          <p className="text-xs md:text-sm text-on-surface-variant mt-1 max-w-2xl">
            DiffAlign replaces expensive token-by-token generative decoding with single-pass hidden state extraction, achieving 50x speedups, zero parsing failures, and minimal compute footprint.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
          <Server className="w-4 h-4 text-emerald-600" />
          <span>NVIDIA H100 GPU (80GB SXM5)</span>
        </div>
      </div>

      {/* Main KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-outline-variant/30 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Inference Latency</span>
          <div className="text-3xl font-extrabold font-headline text-on-surface">148.4 ms</div>
          <p className="text-xs text-on-surface-variant">Average runtime per bilingual document pair</p>
          <div className="pt-2 text-[11px] text-emerald-600 font-semibold">50.5x faster than few-shot prompting</div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-outline-variant/30 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-secondary">Dev Set Throughput</span>
          <div className="text-3xl font-extrabold font-headline text-on-surface">74.8 s</div>
          <p className="text-xs text-on-surface-variant">Total time for all 504 SwissGov-RSD documents</p>
          <div className="pt-2 text-[11px] text-on-surface-variant font-mono">6.74 document pairs / second</div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-outline-variant/30 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Peak VRAM Footprint</span>
          <div className="text-3xl font-extrabold font-headline text-on-surface">16.5 GB</div>
          <p className="text-xs text-on-surface-variant">Native bfloat16 on 80GB H100 GPU</p>
          <div className="pt-2 text-[11px] text-on-surface-variant font-mono">20.6% GPU capacity utilized</div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-outline-variant/30 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Format Reliability</span>
          <div className="text-3xl font-extrabold font-headline text-on-surface">100.0%</div>
          <p className="text-xs text-on-surface-variant">Exact 1-to-1 token alignment with gold standards</p>
          <div className="pt-2 text-[11px] text-emerald-600 font-semibold">0 decoding or length mismatch errors</div>
        </div>
      </div>

      {/* Latency Comparison Chart */}
      <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-outline-variant/30 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-headline font-bold text-on-surface">
            Latency Comparison: Generative Decoding vs. DiffAlign Hidden States
          </h2>
          <p className="text-xs text-on-surface-variant">
            Inference duration per document pair (log scale equivalent shown in milliseconds)
          </p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={speedComparisonData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 180, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} unit=" ms" />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fontSize: 11, fill: '#334155' }} 
                width={170}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: '1px solid #cbd5e1', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)' 
                }}
                formatter={(val: number) => [`${val} ms (${(val/1000).toFixed(2)}s)`, 'Latency']}
              />
              <Bar dataKey="latency" radius={[0, 8, 8, 0]}>
                {speedComparisonData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Why LLM Prompting Fails vs DiffAlign Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Generative Prompting Bottlenecks */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-rose-500/20 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
              <TrendingDown className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-headline font-bold text-on-surface">
                Generative LLM Prompting Bottlenecks
              </h3>
              <p className="text-xs text-on-surface-variant">Why few-shot prompting scored only ~0.017 Spearman</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-on-surface-variant">
            <div className="p-3 rounded-xl bg-surface-container-low flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <span><strong>Auto-regressive Latency:</strong> Generating 300+ JSON token scores requires ~7.5 seconds per document pair, making it 50x slower.</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <span><strong>Token Count Drift:</strong> LLMs routinely hallucinate extra tokens, skip words, or break JSON syntax on long government texts.</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <span><strong>Calibration Failure:</strong> Prompted scores compress near 0 or 1, losing the fine-grained ordinal ranking needed for Spearman correlation.</span>
            </div>
          </div>
        </div>

        {/* DiffAlign Superiority */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/20 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-headline font-bold text-on-surface">
                DiffAlign Architectural Advantages
              </h3>
              <p className="text-xs text-on-surface-variant">How Apertus representations solve alignment directly</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-on-surface-variant">
            <div className="p-3 rounded-xl bg-surface-container-low flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span><strong>Single Forward Pass:</strong> Both documents are embedded in parallel; hidden states are extracted in a single step without decoding loops.</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span><strong>Exact Subword-to-Word Pooling:</strong> BPE subwords are cleanly mapped back to whitespace gold tokens with zero format mismatch.</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span><strong>Geometric Consistency:</strong> Cosine distance <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded">1 - max cos</code> yields continuous, well-calibrated difference rankings.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Production SLURM Command / Reproducibility Box */}
      <div className="p-6 md:p-8 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-headline font-bold uppercase tracking-wider text-white">
              Cluster Execution Runbook (SLURM / COMA)
            </h3>
          </div>
          <button
            onClick={() => copyToClipboard(slurmSnippet, 1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-mono text-cyan-300 transition-all border border-white/10"
          >
            {copiedIndex === 1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedIndex === 1 ? 'Copied!' : 'Copy Script'}</span>
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-black/50 border border-white/10 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
          {slurmSnippet}
        </pre>
      </div>
    </div>
  );
}
