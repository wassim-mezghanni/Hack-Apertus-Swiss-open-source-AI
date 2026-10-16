import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Languages, 
  Sparkles, 
  Sliders, 
  FileText, 
  Eye, 
  Info,
  AlertCircle
} from 'lucide-react';

interface SampleDoc {
  id: string;
  lang_pair: string;
  words_a: string[];
  words_b: string[];
  scores_a: number[];
  scores_b: number[];
  num_words_a: number;
  num_words_b: number;
  mean_score_a: number;
  mean_score_b: number;
}

type LangMap = Record<string, SampleDoc[]>;

function getScoreBgColor(score: number, threshold: number): { bg: string; text: string; border: string } {
  if (score < threshold) {
    return { bg: 'bg-transparent', text: 'text-on-surface', border: 'border-transparent' };
  }
  if (score < 0.20) {
    return { bg: 'bg-cyan-500/10', text: 'text-cyan-900 dark:text-cyan-200', border: 'border-cyan-500/20' };
  }
  if (score < 0.35) {
    return { bg: 'bg-amber-500/15', text: 'text-amber-900 dark:text-amber-200', border: 'border-amber-500/30' };
  }
  if (score < 0.55) {
    return { bg: 'bg-orange-500/20', text: 'text-orange-900 dark:text-orange-200', border: 'border-orange-500/40' };
  }
  return { bg: 'bg-rose-500/30 font-semibold', text: 'text-rose-950 dark:text-rose-100', border: 'border-rose-500/50' };
}

export default function DiffInspector() {
  const [data, setData] = useState<LangMap | null>(null);
  const [selectedLang, setSelectedLang] = useState<'de' | 'fr' | 'it'>('de');
  const [selectedDocIndex, setSelectedDocIndex] = useState<number>(0);
  const [threshold, setThreshold] = useState<number>(0.15);
  const [hoveredWord, setHoveredWord] = useState<{ word: string; score: number; side: 'A' | 'B'; idx: number } | null>(null);

  useEffect(() => {
    fetch('/data/sample_predictions.json')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((err) => console.error('Failed to load sample predictions:', err));
  }, []);

  const currentDocs = data ? data[selectedLang] || [] : [];
  const currentDoc: SampleDoc | undefined = currentDocs[selectedDocIndex] || currentDocs[0];

  // Extract top divergent words
  const topDiffWordsA = useMemo(() => {
    if (!currentDoc) return [];
    return currentDoc.words_a
      .map((word, idx) => ({ word, score: currentDoc.scores_a[idx] ?? 0, idx }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [currentDoc]);

  const topDiffWordsB = useMemo(() => {
    if (!currentDoc) return [];
    return currentDoc.words_b
      .map((word, idx) => ({ word, score: currentDoc.scores_b[idx] ?? 0, idx }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [currentDoc]);

  if (!data || !currentDoc) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-on-surface-variant">Loading Document Diff Heatmaps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
            <Languages className="w-4 h-4" />
            <span>Token-Level Semantic Differences</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-on-surface tracking-tight">
            Interactive Document Diff Inspector
          </h1>
          <p className="text-xs md:text-sm text-on-surface-variant mt-1 max-w-2xl">
            Visualize Apertus-8B DiffAlign word-by-word difference scores on official Swiss government document pairs (admin.ch). Colors highlight semantic divergence, omissions, and country-specific adaptations.
          </p>
        </div>

        {/* Language Pair Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-container rounded-xl text-xs font-semibold">
          <button
            onClick={() => { setSelectedLang('de'); setSelectedDocIndex(0); }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              selectedLang === 'de'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            EN - German (DE)
          </button>
          <button
            onClick={() => { setSelectedLang('fr'); setSelectedDocIndex(0); }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              selectedLang === 'fr'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            EN - French (FR)
          </button>
          <button
            onClick={() => { setSelectedLang('it'); setSelectedDocIndex(0); }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              selectedLang === 'it'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            EN - Italian (IT)
          </button>
        </div>
      </div>

      {/* Control Bar: Document Selection & Threshold Slider */}
      <div className="p-4 md:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-outline-variant/30 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Document Selection Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mr-1 flex items-center gap-1 shrink-0">
            <FileText className="w-3.5 h-3.5" />
            <span>Document:</span>
          </span>
          {currentDocs.map((doc, idx) => (
            <button
              key={doc.id}
              onClick={() => setSelectedDocIndex(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all shrink-0 ${
                selectedDocIndex === idx
                  ? 'bg-primary text-white shadow-sm font-bold'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              {doc.id}
            </button>
          ))}
        </div>

        {/* Heatmap Threshold Slider */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-outline-variant/20">
          <span className="text-xs font-medium text-on-surface-variant shrink-0 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-primary" />
            <span>Diff Filter:</span>
            <strong className="font-mono text-on-surface font-bold">&gt; {threshold.toFixed(2)}</strong>
          </span>
          <input
            type="range"
            min="0.0"
            max="0.60"
            step="0.05"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="w-32 h-1.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>
      </div>

      {/* Side-by-Side Document Comparison Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Text A: English Source */}
        <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-outline-variant/30 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider">
                English (Source)
              </span>
              <span className="text-xs text-on-surface-variant font-mono">
                {currentDoc.words_a.length} tokens
              </span>
            </div>

            <div className="text-xs text-on-surface-variant">
              Mean Diff: <strong className="font-mono text-on-surface">{currentDoc.mean_score_a.toFixed(4)}</strong>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-low/40 border border-outline-variant/15 text-sm leading-relaxed font-body min-h-[300px] max-h-[480px] overflow-y-auto">
            {currentDoc.words_a.map((word, idx) => {
              const score = currentDoc.scores_a[idx] ?? 0;
              const style = getScoreBgColor(score, threshold);
              return (
                <span
                  key={idx}
                  onMouseEnter={() => setHoveredWord({ word, score, side: 'A', idx })}
                  onMouseLeave={() => setHoveredWord(null)}
                  className={`inline-block mx-0.5 my-0.5 px-1.5 py-0.5 rounded border transition-all cursor-pointer ${style.bg} ${style.text} ${style.border} hover:ring-2 hover:ring-primary/50`}
                >
                  {word}
                </span>
              );
            })}
          </div>
        </div>

        {/* Text B: Target Language (DE / FR / IT) */}
        <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-outline-variant/30 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-secondary/10 text-secondary font-bold text-xs uppercase tracking-wider">
                {selectedLang === 'de' ? 'German (DE)' : selectedLang === 'fr' ? 'French (FR)' : 'Italian (IT)'}
              </span>
              <span className="text-xs text-on-surface-variant font-mono">
                {currentDoc.words_b.length} tokens
              </span>
            </div>

            <div className="text-xs text-on-surface-variant">
              Mean Diff: <strong className="font-mono text-on-surface">{currentDoc.mean_score_b.toFixed(4)}</strong>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-low/40 border border-outline-variant/15 text-sm leading-relaxed font-body min-h-[300px] max-h-[480px] overflow-y-auto">
            {currentDoc.words_b.map((word, idx) => {
              const score = currentDoc.scores_b[idx] ?? 0;
              const style = getScoreBgColor(score, threshold);
              return (
                <span
                  key={idx}
                  onMouseEnter={() => setHoveredWord({ word, score, side: 'B', idx })}
                  onMouseLeave={() => setHoveredWord(null)}
                  className={`inline-block mx-0.5 my-0.5 px-1.5 py-0.5 rounded border transition-all cursor-pointer ${style.bg} ${style.text} ${style.border} hover:ring-2 hover:ring-secondary/50`}
                >
                  {word}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating or Status Bar for Hovered Word */}
      <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 flex items-center justify-between text-xs">
        {hoveredWord ? (
          <div className="flex items-center gap-3">
            <span className="font-semibold text-primary">
              Inspecting Word [{hoveredWord.side}#{hoveredWord.idx}]:
            </span>
            <span className="font-bold text-on-surface bg-white dark:bg-slate-800 px-2 py-1 rounded border border-outline-variant/20 font-mono text-sm">
              "{hoveredWord.word}"
            </span>
            <span>
              DiffAlign Score: <strong className="font-mono text-primary text-sm font-bold">{hoveredWord.score.toFixed(4)}</strong>
            </span>
            <span className="text-on-surface-variant">
              ({hoveredWord.score > 0.4 ? 'High divergence / omission' : hoveredWord.score > 0.2 ? 'Moderate divergence' : 'Close semantic match'})
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-on-surface-variant">
            <Eye className="w-4 h-4 text-primary" />
            <span>Hover over any word in English or {selectedLang.toUpperCase()} above to inspect token alignment and semantic difference scores.</span>
          </div>
        )}

        <div className="flex items-center gap-3 text-[11px] font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-cyan-500/30 border border-cyan-500/50" />
            <span>Low Diff (&lt;0.20)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-500/40 border border-amber-500/60" />
            <span>Medium (0.20 - 0.40)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-rose-500/60 border border-rose-500/80" />
            <span>High Diff (&gt;0.40)</span>
          </div>
        </div>
      </div>

      {/* Top Divergent Words Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Diff Words EN */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-outline-variant/30 shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            <span>Highest Divergence Words — English</span>
          </h3>
          <div className="divide-y divide-outline-variant/15 text-xs">
            {topDiffWordsA.map((item, idx) => (
              <div key={idx} className="py-2 flex items-center justify-between">
                <span className="font-mono text-on-surface font-semibold">
                  #{item.idx + 1} {item.word}
                </span>
                <span className="font-mono font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                  {item.score.toFixed(4)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Diff Words DE/FR/IT */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-outline-variant/30 shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            <span>Highest Divergence Words — {selectedLang.toUpperCase()}</span>
          </h3>
          <div className="divide-y divide-outline-variant/15 text-xs">
            {topDiffWordsB.map((item, idx) => (
              <div key={idx} className="py-2 flex items-center justify-between">
                <span className="font-mono text-on-surface font-semibold">
                  #{item.idx + 1} {item.word}
                </span>
                <span className="font-mono font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                  {item.score.toFixed(4)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
