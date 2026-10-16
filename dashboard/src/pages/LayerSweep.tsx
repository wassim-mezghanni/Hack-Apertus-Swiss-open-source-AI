import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Sliders, 
  Info,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  ReferenceLine 
} from 'recharts';

interface LayerSweepItem {
  layer: number;
  depth_pct: number;
  center: boolean;
  config_label: string;
  de_spearman: number;
  fr_spearman: number;
  it_spearman: number;
  macro_spearman: number;
  de_taub: number;
  fr_taub: number;
  it_taub: number;
  macro_taub: number;
}

export default function LayerSweep() {
  const [data, setData] = useState<LayerSweepItem[]>([]);
  const [selectedLayerIndex, setSelectedLayerIndex] = useState<number>(1); // default to Layer 20 (SOTA)
  const [activeMetric, setActiveMetric] = useState<'spearman' | 'taub'>('spearman');

  useEffect(() => {
    fetch('/data/layer_sweep.json')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((err) => console.error('Failed to load layer sweep:', err));
  }, []);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-on-surface-variant">Loading Layer Sweep Data...</p>
        </div>
      </div>
    );
  }

  // Filter centered items for the depth trend curve (ordered by layer ascending)
  const depthTrendData = data
    .filter((d) => d.center)
    .sort((a, b) => a.layer - b.layer)
    .map((d) => ({
      name: `Layer ${d.layer} (${d.depth_pct}%)`,
      layer: d.layer,
      depth: d.depth_pct,
      Macro: activeMetric === 'spearman' ? d.macro_spearman : d.macro_taub,
      German: activeMetric === 'spearman' ? d.de_spearman : d.de_taub,
      French: activeMetric === 'spearman' ? d.fr_spearman : d.fr_taub,
      Italian: activeMetric === 'spearman' ? d.it_spearman : d.it_taub,
    }));

  const selectedItem = data[selectedLayerIndex] || data[1];
  const l31Uncentered = data.find((d) => d.layer === 31 && !d.center);
  const l31Centered = data.find((d) => d.layer === 31 && d.center);

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
            <Layers className="w-4 h-4" />
            <span>Representation Space Geometry</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-on-surface tracking-tight">
            Layer Sweep & Representation Depth Analysis
          </h1>
          <p className="text-xs md:text-sm text-on-surface-variant mt-1 max-w-2xl">
            Apertus-8B transformer layers exhibit distinct representational geometries: peak cross-lingual semantic alignment emerges at intermediate layers (60–80% depth) rather than the final decoder output.
          </p>
        </div>

        <div className="flex items-center gap-2 p-1 bg-surface-container rounded-xl text-xs font-medium self-start md:self-auto">
          <button
            onClick={() => setActiveMetric('spearman')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeMetric === 'spearman'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Spearman Correlation
          </button>
          <button
            onClick={() => setActiveMetric('taub')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeMetric === 'taub'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Kendall's Tau-b
          </button>
        </div>
      </div>

      {/* Main Depth Curve Chart */}
      <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-outline-variant/30 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-headline font-bold text-on-surface flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span>Alignment Quality Across Layer Depth (Centered Hidden States)</span>
            </h2>
            <p className="text-xs text-on-surface-variant">
              Evaluating Layers 16 (50%), 20 (62.5%), 24 (75%), 28 (87.5%), and 31 (100%) on official ZurichNLP dev set
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Optimal Operating Point: Layer 20</span>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={depthTrendData}
              margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11, fill: '#64748b' }} 
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                domain={[0.08, 0.33]}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: '1px solid #cbd5e1', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)' 
                }}
                formatter={(val: number) => [val.toFixed(4), '']}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <ReferenceLine x="Layer 20 (62.5%)" stroke="#E30613" strokeDasharray="4 4" label={{ value: 'Peak SOTA', fill: '#E30613', fontSize: 11, fontWeight: 'bold' }} />
              <Line 
                type="monotone" 
                dataKey="Macro" 
                stroke="#E30613" 
                strokeWidth={3.5} 
                dot={{ r: 6, fill: '#E30613' }} 
                activeDot={{ r: 8 }}
              />
              <Line 
                type="monotone" 
                dataKey="German" 
                stroke="#0284c7" 
                strokeWidth={2} 
                strokeDasharray="4 4"
                dot={{ r: 4 }} 
              />
              <Line 
                type="monotone" 
                dataKey="Italian" 
                stroke="#8b5cf6" 
                strokeWidth={2} 
                strokeDasharray="4 4"
                dot={{ r: 4 }} 
              />
              <Line 
                type="monotone" 
                dataKey="French" 
                stroke="#f59e0b" 
                strokeWidth={2} 
                strokeDasharray="4 4"
                dot={{ r: 4 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interactive Layer Selector & Detailed Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Layer Selector List */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-outline-variant/30 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-headline font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-primary" />
              <span>Tested Configurations</span>
            </h3>
            <span className="text-[11px] text-on-surface-variant font-mono">6 runs</span>
          </div>

          <div className="space-y-2">
            {data.map((item, idx) => {
              const isSelected = selectedLayerIndex === idx;
              const isSOTA = item.layer === 20 && item.center;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedLayerIndex(idx)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-surface hover:bg-surface-container-high border-outline-variant/30 text-on-surface'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs">
                        Layer {item.layer}
                      </span>
                      {isSOTA && (
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                          isSelected ? 'bg-white text-primary' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          SOTA
                        </span>
                      )}
                      {!item.center && (
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'
                        }`}>
                          Raw
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] ${isSelected ? 'text-white/80' : 'text-on-surface-variant'}`}>
                      {item.depth_pct}% Depth · {item.center ? 'Centered' : 'No Centering'}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-sm">
                      {item.macro_spearman.toFixed(4)}
                    </span>
                    <span className={`block text-[10px] ${isSelected ? 'text-white/70' : 'text-on-surface-variant'}`}>
                      Macro Spearman
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Layer Details Card */}
        <div className="lg:col-span-2 p-6 md:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-outline-variant/30 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Configuration Details</span>
                <h3 className="text-xl font-headline font-extrabold text-on-surface mt-0.5">
                  {selectedItem.config_label}
                </h3>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedItem.layer === 20 && selectedItem.center
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-surface-container text-on-surface-variant'
              }`}>
                {selectedItem.center ? 'Mean-Centered' : 'Uncentered Baseline'}
              </span>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 text-center">
                <span className="block text-[11px] font-semibold text-on-surface-variant uppercase">Macro Spearman</span>
                <span className="text-2xl font-mono font-bold text-primary mt-1 block">
                  {selectedItem.macro_spearman.toFixed(4)}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 text-center">
                <span className="block text-[11px] font-semibold text-on-surface-variant uppercase">EN-DE Spearman</span>
                <span className="text-2xl font-mono font-bold text-on-surface mt-1 block">
                  {selectedItem.de_spearman.toFixed(3)}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 text-center">
                <span className="block text-[11px] font-semibold text-on-surface-variant uppercase">EN-FR Spearman</span>
                <span className="text-2xl font-mono font-bold text-on-surface mt-1 block">
                  {selectedItem.fr_spearman.toFixed(3)}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 text-center">
                <span className="block text-[11px] font-semibold text-on-surface-variant uppercase">EN-IT Spearman</span>
                <span className="text-2xl font-mono font-bold text-on-surface mt-1 block">
                  {selectedItem.it_spearman.toFixed(3)}
                </span>
              </div>
            </div>

            {/* Kendall's Tau-b subrow */}
            <div className="p-4 rounded-xl bg-surface-container-low/60 border border-outline-variant/15 flex flex-wrap items-center justify-between text-xs text-on-surface-variant gap-3">
              <span className="font-semibold text-on-surface">Kendall's Tau-b Concordance:</span>
              <span>Macro: <strong className="font-mono text-on-surface">{selectedItem.macro_taub.toFixed(4)}</strong></span>
              <span>DE: <strong className="font-mono text-on-surface">{selectedItem.de_taub.toFixed(3)}</strong></span>
              <span>FR: <strong className="font-mono text-on-surface">{selectedItem.fr_taub.toFixed(3)}</strong></span>
              <span>IT: <strong className="font-mono text-on-surface">{selectedItem.it_taub.toFixed(3)}</strong></span>
            </div>

            {/* Scientific Explanation Box */}
            <div className="p-5 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Info className="w-4 h-4" />
                <span>Representation Geometry Insight</span>
              </h4>
              <p className="text-xs text-on-surface leading-relaxed">
                {selectedItem.layer === 20 && selectedItem.center ? (
                  <>
                    <strong>Peak Alignment at Layer 20:</strong> Layer 20 corresponds to exactly 62.5% of Apertus-8B's 32-layer depth. Hidden states at this depth have abstracted away syntactic surface tokens into conceptual multilingual representations, without suffering from the language specialization that occurs near the unembedding head.
                  </>
                ) : !selectedItem.center ? (
                  <>
                    <strong>The Impact of Language Centroid Shift:</strong> Without mean-centering, Apertus-8B token representations are biased by language-specific centroid vectors. Raw cosine similarities are skewed towards origin offsets rather than true semantic divergence, resulting in a low 0.0777 Spearman score.
                  </>
                ) : (
                  <>
                    <strong>Transition Zone:</strong> Layer {selectedItem.layer} ({selectedItem.depth_pct}% depth) provides high quality cross-lingual alignment ({selectedItem.macro_spearman.toFixed(4)} Macro Spearman). Moving deeper towards Layer 31 gradually shifts representations towards next-token prediction, reducing cross-lingual concordance.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Centering Ablation Visual Comparison */}
      {l31Uncentered && l31Centered && (
        <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg border border-slate-700 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                Ablation Experiment
              </span>
              <h3 className="text-xl font-headline font-extrabold text-white mt-2">
                Mean-Centering Ablation on Output Layer (Layer 31)
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl mt-1">
                Subtracting document-level mean representation (<code className="bg-black/30 px-1.5 py-0.5 rounded text-cyan-200">u_i - mean(U)</code>) isolates true semantic differences from language-specific cluster displacement.
              </p>
            </div>

            <div className="text-right">
              <span className="text-3xl font-extrabold font-headline text-emerald-400 block">
                +98.6%
              </span>
              <span className="text-[11px] text-slate-300 uppercase tracking-wider font-semibold">
                Relative Spearman Gain
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Uncentered */}
            <div className="p-5 rounded-xl bg-black/40 border border-rose-500/30 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-rose-300 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  Output Layer (Raw Hidden States)
                </span>
                <span className="font-mono text-rose-400 font-bold">0.0777 Macro</span>
              </div>
              <div className="space-y-1 text-xs text-slate-300">
                <p>• Language cluster vectors dominate cosine distances.</p>
                <p>• False divergence between synonymous tokens in different languages.</p>
                <div className="pt-2 border-t border-white/10 flex justify-between text-[11px] font-mono text-slate-400">
                  <span>DE: 0.073</span>
                  <span>FR: 0.060</span>
                  <span>IT: 0.100</span>
                </div>
              </div>
            </div>

            {/* Centered */}
            <div className="p-5 rounded-xl bg-black/40 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Output Layer + Document Mean-Centering
                </span>
                <span className="font-mono text-emerald-400 font-bold">0.1543 Macro</span>
              </div>
              <div className="space-y-1 text-xs text-slate-300">
                <p>• Removes the dominant language centroid offset vector.</p>
                <p>• Substantially sharpens token-to-token similarity contrast.</p>
                <div className="pt-2 border-t border-white/10 flex justify-between text-[11px] font-mono text-emerald-300">
                  <span>DE: 0.172</span>
                  <span>FR: 0.112</span>
                  <span>IT: 0.179</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
