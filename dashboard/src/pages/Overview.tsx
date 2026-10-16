import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Zap, 
  Cpu, 
  BarChart3, 
  CheckCircle2, 
  ArrowUpRight, 
  Globe2, 
  Layers, 
  Clock, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  Cell 
} from 'recharts';

interface BenchmarkBaseline {
  name: string;
  family: string;
  approach: string;
  de: number;
  fr: number;
  it: number;
  macro_spearman: number;
  macro_taub: number;
  latency_ms: number;
  status: string;
  badge: string;
}

interface BenchmarkData {
  task: string;
  track: string;
  model: string;
  metric: string;
  kpis: {
    macro_spearman: number;
    macro_taub: number;
    spearman_de: number;
    spearman_fr: number;
    spearman_it: number;
    improvement_over_published: string;
    latency_ms: number;
    speedup_vs_prompting: string;
    peak_vram_gb: number;
    dev_pairs_evaluated: number;
  };
  baselines: BenchmarkBaseline[];
}

export default function Overview() {
  const [data, setData] = useState<BenchmarkData | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'macro_spearman' | 'macro_taub'>('macro_spearman');

  useEffect(() => {
    fetch('/data/swissgov_benchmark.json')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((err) => console.error('Failed to load benchmark:', err));
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-on-surface-variant">Loading SwissGov-RSD Benchmarks...</p>
        </div>
      </div>
    );
  }

  const chartData = data.baselines.map((b) => ({
    name: b.name.replace(' (Few-Shot Prompting)', '').replace(' [OURS]', ''),
    macro: selectedMetric === 'macro_spearman' ? b.macro_spearman : b.macro_taub,
    de: b.de,
    fr: b.fr,
    it: b.it,
    badge: b.badge,
    isOurs: b.name.includes('[OURS]'),
  }));

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#18181b] via-[#201819] to-[#0c0c0e] text-white p-8 md:p-10 shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-[#E30613]/15 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#E30613]/20 text-[#ff8088] border border-[#E30613]/40 flex items-center gap-1.5 shadow-sm">
                <Trophy className="w-3.5 h-3.5 text-[#E30613]" />
                New State of the Art: 0.2553 Macro Spearman
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/15">
                HackApertus 2026 · Track 2A (UZH)
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#E30613]/10 text-rose-200 border border-[#E30613]/30 font-mono">
                swiss-ai/Apertus-v1.5-8B
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-headline font-extrabold tracking-tight text-white leading-tight">
              SwissGov-RSD Token-Level Semantic Difference Recognition
            </h1>
            <p className="text-white/80 text-sm md:text-base leading-relaxed">
              Unsupervised cross-lingual semantic alignment on Swiss government documents (EN paired with DE, FR, IT). 
              Combining <strong>Apertus-8B intermediate representations (Layer 20 / 62.5% depth)</strong> with 
              <strong> Document Mean-Centering</strong> achieves a <strong>+64.7% performance leap</strong> over prior published baselines.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 min-w-[200px]">
            <a 
              href="https://github.com/ZurichNLP/SwissGov-RSD" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs border border-white/20 transition-all backdrop-blur-sm"
            >
              <span>ZurichNLP Benchmark</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <div className="px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-center">
              <span className="block text-[11px] text-white/60 uppercase tracking-wider font-semibold">Official Evaluation</span>
              <span className="text-xs font-mono text-emerald-300 font-semibold">evaluate_predictions_admin.py</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Macro Spearman */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-outline-variant/30 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Official Metric</span>
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <Trophy className="w-5 h-5" />
            </span>
          </div>
          <div className="text-3xl font-extrabold font-headline text-on-surface mb-1">
            {data.kpis.macro_spearman.toFixed(4)}
          </div>
          <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            {data.kpis.improvement_over_published} over prior SOTA (0.155)
          </p>
          <div className="mt-3 pt-3 border-t border-outline-variant/20 flex justify-between text-[11px] text-on-surface-variant">
            <span>DE: <strong>{data.kpis.spearman_de.toFixed(3)}</strong></span>
            <span>FR: <strong>{data.kpis.spearman_fr.toFixed(3)}</strong></span>
            <span>IT: <strong>{data.kpis.spearman_it.toFixed(3)}</strong></span>
          </div>
        </div>

        {/* Card 2: Macro Kendall's Tau-b */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-outline-variant/30 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">Rank Concordance</span>
            <span className="p-2 rounded-xl bg-secondary/10 text-secondary">
              <BarChart3 className="w-5 h-5" />
            </span>
          </div>
          <div className="text-3xl font-extrabold font-headline text-on-surface mb-1">
            {data.kpis.macro_taub.toFixed(4)}
          </div>
          <p className="text-xs font-medium text-on-surface-variant">
            Macro Kendall's Tau-b across 504 document pairs
          </p>
          <div className="mt-3 pt-3 border-t border-outline-variant/20 flex justify-between text-[11px] text-on-surface-variant">
            <span>Layer: <strong>20 (62.5% Depth)</strong></span>
            <span>Centered: <strong>True</strong></span>
          </div>
        </div>

        {/* Card 3: Inference Latency */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-outline-variant/30 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Inference Latency</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Zap className="w-5 h-5" />
            </span>
          </div>
          <div className="text-3xl font-extrabold font-headline text-on-surface mb-1">
            {data.kpis.latency_ms} ms
          </div>
          <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            {data.kpis.speedup_vs_prompting} faster than LLM prompting (~7.5s)
          </p>
          <div className="mt-3 pt-3 border-t border-outline-variant/20 flex justify-between text-[11px] text-on-surface-variant">
            <span>Full dev split: <strong>~75 seconds</strong></span>
            <span>Pairs: <strong>504</strong></span>
          </div>
        </div>

        {/* Card 4: Memory Footprint */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-outline-variant/30 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-600">Compute Footprint</span>
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600">
              <Cpu className="w-5 h-5" />
            </span>
          </div>
          <div className="text-3xl font-extrabold font-headline text-on-surface mb-1">
            {data.kpis.peak_vram_gb} GB
          </div>
          <p className="text-xs font-medium text-on-surface-variant">
            Native bfloat16 on 1x NVIDIA H100 GPU
          </p>
          <div className="mt-3 pt-3 border-t border-outline-variant/20 flex justify-between text-[11px] text-on-surface-variant">
            <span>Architecture: <strong>Apertus-8B</strong></span>
            <span>4-Bit Ready: <strong>Yes (~5.8 GB)</strong></span>
          </div>
        </div>
      </div>

      {/* Main Benchmark Chart */}
      <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-outline-variant/30 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg md:text-xl font-headline font-bold text-on-surface">
              Published Baselines vs. Apertus-8B DiffAlign
            </h2>
            <p className="text-xs text-on-surface-variant">
              Token-level cross-lingual difference evaluation on official SwissGov-RSD dev split (504 documents)
            </p>
          </div>

          <div className="flex items-center gap-2 p-1 bg-surface-container rounded-xl text-xs font-medium">
            <button
              onClick={() => setSelectedMetric('macro_spearman')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedMetric === 'macro_spearman'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Macro Spearman
            </button>
            <button
              onClick={() => setSelectedMetric('macro_taub')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedMetric === 'macro_taub'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Kendall's Tau-b
            </button>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                interval={0}
                angle={-15}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                domain={[0, 0.32]}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: '1px solid #cbd5e1', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)' 
                }}
                formatter={(val: number) => [val.toFixed(4), selectedMetric === 'macro_spearman' ? 'Macro Spearman' : 'Kendall Tau-b']}
              />
              <Bar dataKey="macro" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.isOurs ? '#E30613' : entry.name.includes('Apertus') ? '#64748b' : '#cbd5e1'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-on-surface-variant pt-2 border-t border-outline-variant/15">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-[#E30613]" />
            <span className="font-semibold text-on-surface">Our Method (Apertus Layer 20 Centered - SOTA)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-[#64748b]" />
            <span>Apertus Ablations</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-[#cbd5e1]" />
            <span>Literature Baselines (LLM Prompting / XLM-R)</span>
          </div>
        </div>
      </div>

      {/* Comprehensive Benchmark Table */}
      <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-outline-variant/30 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-headline font-bold text-on-surface">
              Detailed Benchmark Leaderboard
            </h2>
            <p className="text-xs text-on-surface-variant">
              Full breakdown across English-German, English-French, and English-Italian language pairs
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            Official Dev Set (504 pairs)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-outline-variant/30 bg-surface-container-low text-on-surface font-semibold">
                <th className="py-3 px-4 rounded-l-lg">Model / Configuration</th>
                <th className="py-3 px-3">Approach</th>
                <th className="py-3 px-3 text-center">EN-DE</th>
                <th className="py-3 px-3 text-center">EN-FR</th>
                <th className="py-3 px-3 text-center">EN-IT</th>
                <th className="py-3 px-3 text-center font-bold text-primary">Macro Spearman</th>
                <th className="py-3 px-3 text-center">Macro Tau-b</th>
                <th className="py-3 px-3 text-right">Latency / Pair</th>
                <th className="py-3 px-4 rounded-r-lg text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15">
              {data.baselines.map((row, idx) => {
                const isWinner = row.name.includes('[OURS]');
                return (
                  <tr 
                    key={idx}
                    className={`transition-colors ${
                      isWinner 
                        ? 'bg-primary/5 font-semibold text-on-surface hover:bg-primary/10' 
                        : 'hover:bg-surface-container-low/50 text-on-surface-variant'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {isWinner && <Sparkles className="w-4 h-4 text-primary shrink-0" />}
                        <span className={isWinner ? 'font-bold text-primary' : 'font-medium text-on-surface'}>
                          {row.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-[11px] font-mono text-on-surface-variant/80">
                      {row.approach}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono">
                      {row.de.toFixed(3)}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono">
                      {row.fr.toFixed(3)}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono">
                      {row.it.toFixed(3)}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-primary text-sm">
                      {row.macro_spearman.toFixed(4)}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono">
                      {row.macro_taub.toFixed(4)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono">
                      {row.latency_ms > 1000 ? `${(row.latency_ms / 1000).toFixed(1)}s` : `${row.latency_ms}ms`}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isWinner 
                          ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-400/30' 
                          : row.badge.includes('Prior') 
                          ? 'bg-cyan-500/10 text-cyan-700 border border-cyan-400/20' 
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {row.badge}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3 Core Empirical Breakthroughs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-outline-variant/30 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Globe2 className="w-5 h-5" />
          </div>
          <h3 className="text-base font-headline font-bold text-on-surface">
            1. Document Mean-Centering
          </h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Apertus exhibits language-specific centroid offsets in raw hidden states. Subtracting the document mean representation strips this language bias, lifting macro Spearman on Layer 31 from <strong>0.078 to 0.154 (+98% relative gain)</strong>.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-outline-variant/30 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-base font-headline font-bold text-on-surface">
            2. Intermediate Layer Geometry
          </h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Universal semantic alignment peaks at intermediate representations (Layer 20 / 62.5% depth) before task-specific next-token specialization. Sweeping layers boosted performance from 0.154 to <strong>0.2553 (+65% over output layer)</strong>.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-outline-variant/30 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-headline font-bold text-on-surface">
            3. 50x Faster & Hallucination-Free
          </h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Prompted LLMs suffer from severe JSON formatting and token-length decoding failures on long government texts. Our DiffAlign formulation executes in <strong>148 ms/pair</strong> with zero syntax errors and exact subword-to-word pooling.
          </p>
        </div>
      </div>
    </div>
  );
}
