import React from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  ShieldCheck, 
  FileCode, 
  Layers, 
  Cpu, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function Methodology() {
  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Technical Methodology</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-on-surface tracking-tight">
            Mathematical Formulation & Challenge Architecture
          </h1>
          <p className="text-xs md:text-sm text-on-surface-variant mt-1 max-w-2xl">
            Detailed walkthrough of the Apertus-8B DiffAlign algorithm, subword-to-word pooling, document mean-centering, and compliance with the ZurichNLP benchmark.
          </p>
        </div>

        <a
          href="https://github.com/ZurichNLP/SwissGov-RSD"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-all border border-outline-variant/30 self-start md:self-auto"
        >
          <span>SwissGov-RSD Repository</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* 4 Step Methodology Pipeline */}
      <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-outline-variant/30 shadow-sm space-y-6">
        <h2 className="text-lg font-headline font-bold text-on-surface">
          4-Stage Unsupervised DiffAlign Pipeline
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Stage 1 */}
          <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">1</span>
              <span>Layer 20 Hidden State Extraction</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              We pass the source and target document texts through <strong>Apertus-v1.5-8B</strong> in native bfloat16. Rather than using the final unembedding layer (Layer 31), we tap hidden states at <strong>Layer 20 (62.5% depth)</strong>, where representations preserve abstract cross-lingual semantic alignment before specialized next-token generation.
            </p>
          </div>

          {/* Stage 2 */}
          <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">2</span>
              <span>Document Mean-Centering</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              To eradicate language-specific centroid vectors that drift representations apart, we apply document-level mean subtraction:
              <br />
              <code className="inline-block mt-1 font-mono text-[11px] bg-black/5 dark:bg-white/10 px-2 py-1 rounded text-primary">
                ũ_i = u_i - (1 / N) * Σ_k u_k
              </code>
              <br />
              This removes dominant language bias and doubles alignment performance (+98% gain).
            </p>
          </div>

          {/* Stage 3 */}
          <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">3</span>
              <span>Cosine Distance Matching</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              For every subword token in document A, we compute its maximum cosine similarity against all candidate tokens in document B. The difference score is defined as:
              <br />
              <code className="inline-block mt-1 font-mono text-[11px] bg-black/5 dark:bg-white/10 px-2 py-1 rounded text-primary">
                score(u_i, V) = 1 - max_j cosine_sim(ũ_i, ṽ_j)
              </code>
              <br />
              Unpaired or semantically modified tokens yield near-zero cosine similarity, producing high difference scores.
            </p>
          </div>

          {/* Stage 4 */}
          <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">4</span>
              <span>Subword-to-Word Pooling</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Gold standard labels are evaluated on whitespace words, whereas Apertus tokenizes via SentencePiece/BPE subwords. We track subword spans per whitespace token and pool subword scores via mean aggregation, guaranteeing strict 1:1 format compliance without token loss.
            </p>
          </div>
        </div>
      </div>

      {/* Official Rules & Ethics */}
      <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-outline-variant/30 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>Evaluation Integrity & Anti-Leakage Protocol</span>
        </div>

        <h3 className="text-base font-headline font-bold text-on-surface">
          Strict Compliance with HackApertus Guidelines
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/15 text-xs text-on-surface-variant space-y-1">
            <span className="font-bold text-on-surface block">Zero Test Split Leakage</span>
            <p>The held-out <code className="font-mono bg-black/5 px-1 rounded">test</code> split was never loaded during development. Loading is locked behind the <code className="font-mono bg-black/5 px-1 rounded">SWISSGOV_ALLOW_TEST=1</code> gate.</p>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/15 text-xs text-on-surface-variant space-y-1">
            <span className="font-bold text-on-surface block">Standardized Apertus Family</span>
            <p>All embeddings are generated exclusively with <code className="font-mono bg-black/5 px-1 rounded">swiss-ai/Apertus-v1.5-8B</code>, adhering to Track 2 guidelines.</p>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/15 text-xs text-on-surface-variant space-y-1">
            <span className="font-bold text-on-surface block">Official ZurichNLP Script</span>
            <p>All metrics presented in this dashboard are computed using <code className="font-mono bg-black/5 px-1 rounded">scripts.evaluate_predictions_admin</code>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
