import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Trophy, 
  Layers, 
  Languages, 
  Zap, 
  BookOpen, 
  Cpu, 
  ExternalLink,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    {
      path: '/',
      label: 'Benchmark Overview',
      icon: Trophy,
      badge: 'SOTA 0.255',
      badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
    },
    {
      path: '/layer-sweep',
      label: 'Layer Sweep & Depth',
      icon: Layers,
      badge: 'L20 Peak',
      badgeColor: 'bg-primary/10 text-primary border-primary/20'
    },
    {
      path: '/inspector',
      label: 'Document Diff Inspector',
      icon: Languages,
      badge: 'Interactive',
      badgeColor: 'bg-secondary/10 text-secondary border-secondary/20'
    },
    {
      path: '/efficiency',
      label: 'Efficiency & Speed',
      icon: Zap,
      badge: '148ms',
      badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
    },
    {
      path: '/methodology',
      label: 'Methodology & Pipeline',
      icon: BookOpen,
      badge: null,
      badgeColor: ''
    },
  ];

  return (
    <aside className="w-80 h-screen fixed left-0 top-0 bg-white dark:bg-slate-900 border-r border-outline-variant/20 flex flex-col z-50 overflow-y-auto">
      {/* Brand header */}
      <div className="p-6 border-b border-outline-variant/15 space-y-4">
        {/* Hack Apertus Logo Wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E30613] text-white flex items-center justify-center shadow-md shadow-[#E30613]/30 shrink-0 font-headline font-black text-xl">
            <span className="leading-none select-none">∧</span>
          </div>
          <div>
            <div className="flex items-baseline tracking-widest leading-tight font-black select-none">
              <span className="text-[#E30613] text-sm font-headline tracking-[0.2em]">HACK</span>
              <span className="text-[#0F172A] dark:text-white text-sm font-headline tracking-[0.18em] ml-1.5">APERTVS</span>
            </div>
            <p className="text-[11px] font-medium text-on-surface-variant">
              SwissGov-RSD Evaluation Suite
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E30613] animate-pulse" />
            <span className="font-semibold text-on-surface text-[11px]">Track 2A (UZH)</span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#E30613]/10 text-[#E30613] border border-[#E30613]/20">
            Apertus-8B
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5">
        <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70 block mb-2">
          Evaluation Views
        </span>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? 'bg-[#E30613] text-white shadow-md shadow-[#E30613]/25 font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-on-surface-variant'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        isActive
                          ? 'bg-white/20 text-white border-white/30'
                          : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}

        {/* Per-Language Quick Stats */}
        <div className="mt-6 pt-4 border-t border-outline-variant/15 space-y-2">
          <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70 block">
            Dev Set Language Breakdown
          </span>

          <div className="px-3 py-2 rounded-xl bg-surface-container-low/60 border border-outline-variant/15 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant text-[11px]">EN-DE (German):</span>
              <span className="font-mono font-bold text-on-surface">0.288</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#E30613] h-full rounded-full" style={{ width: '85%' }} />
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-on-surface-variant text-[11px]">EN-IT (Italian):</span>
              <span className="font-mono font-bold text-on-surface">0.305</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div className="bg-secondary h-full rounded-full" style={{ width: '90%' }} />
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-on-surface-variant text-[11px]">EN-FR (French):</span>
              <span className="font-mono font-bold text-on-surface">0.173</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: '55%' }} />
            </div>
          </div>
        </div>
      </nav>

      {/* Cluster Footer */}
      <div className="p-4 border-t border-outline-variant/15 space-y-3 bg-surface-container-low/30">
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <Cpu className="w-4 h-4 text-primary shrink-0" />
          <div className="truncate">
            <span className="font-semibold block text-[11px] text-on-surface truncate">NVIDIA H100 GPU</span>
            <span className="text-[10px] text-on-surface-variant/80">bfloat16 · Apertus-8B</span>
          </div>
        </div>

        <a
          href="https://github.com/ZurichNLP/SwissGov-RSD"
          target="_blank"
          rel="noreferrer"
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface border border-outline-variant/30 transition-all text-center"
        >
          <span>ZurichNLP Official Repo</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </aside>
  );
}
