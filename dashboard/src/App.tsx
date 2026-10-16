import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Overview from './pages/Overview';
import LayerSweep from './pages/LayerSweep';
import DiffInspector from './pages/DiffInspector';
import Efficiency from './pages/Efficiency';
import Methodology from './pages/Methodology';
import { Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';

/* ── Top App Bar ── */
function TopAppBar() {
  return (
    <header className="w-full sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-40 flex justify-between items-center px-6 md:px-10 h-16 border-b border-outline-variant/15">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-1 bg-[#E30613]/10 text-[#E30613] border border-[#E30613]/25 rounded-md text-[11px] font-headline font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#E30613]" />
            HACK APERTVS 2026
          </span>
          <span className="text-xs md:text-sm font-headline font-bold text-on-surface hidden sm:inline">
            Track 2A: SwissGov-RSD Token-Level Semantic Differences
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Official Benchmark: 0.2553 Macro Spearman</span>
        </div>

        <a
          href="https://github.com/ZurichNLP/SwissGov-RSD"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/30 transition-all"
        >
          <span>ZurichNLP</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </header>
  );
}

/* ── Footer ── */
function Footer() {
  return (
    <footer className="w-full py-6 bg-white dark:bg-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 px-6 md:px-10 mt-auto border-t border-outline-variant/15 text-on-surface-variant/70 text-xs">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary" />
        <p className="text-[11px]">
          <strong className="text-on-surface font-semibold">HackApertus 2026</strong> · SwissGov-RSD with swiss-ai/Apertus-v1.5-8B (DiffAlign)
        </p>
      </div>
      <div className="text-[10px] text-center text-on-surface-variant/70">
        Evaluated on 1x NVIDIA H100 (SXM5) via ZurichNLP official admin evaluation scripts
      </div>
      <div className="flex gap-4 text-[11px]">
        <NavLink to="/" className="hover:text-primary transition-colors">Overview</NavLink>
        <NavLink to="/layer-sweep" className="hover:text-primary transition-colors">Layer Sweep</NavLink>
        <NavLink to="/inspector" className="hover:text-primary transition-colors">Diff Inspector</NavLink>
        <NavLink to="/efficiency" className="hover:text-primary transition-colors">Efficiency</NavLink>
      </div>
    </footer>
  );
}

/* ── Main App ── */
export default function App() {
  return (
    <BrowserRouter>
      <div className="font-body text-on-surface bg-surface min-h-screen flex">
        <Sidebar />

        <div className="ml-80 flex-1 min-h-screen flex flex-col">
          <TopAppBar />

          <main className="flex-1 p-6 md:p-10">
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/layer-sweep" element={<LayerSweep />} />
              <Route path="/inspector" element={<DiffInspector />} />
              <Route path="/efficiency" element={<Efficiency />} />
              <Route path="/methodology" element={<Methodology />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </div>
    </BrowserRouter>
  );
}
