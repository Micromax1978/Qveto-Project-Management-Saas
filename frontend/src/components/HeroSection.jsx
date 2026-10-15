import React from 'react';
import { ArrowRight, Sparkles, CheckCircle2, Clock } from 'lucide-react';

export default function HeroSection({ onOpenAuth }) {
  const handleExploreFeatures = (e) => {
    e.preventDefault();
    const elem = document.querySelector('#features');
    if (elem) {
      const navHeight = 72;
      const elementPosition = elem.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - navHeight,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-slate-200/80 bg-linear-to-b from-blue-50/40 via-white to-white">
      {/* Subtle background ambient mesh */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-40 right-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-80 h-80 bg-indigo-50/60 rounded-full blur-2xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* LEFT SIDE: Hero Messaging */}
          <div className="lg:col-span-6 space-y-6 text-left">
            {/* Small Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold uppercase tracking-wider shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>ONE WORKSPACE. EVERY PROJECT.</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
              Plan Better. <br />
              <span className="text-blue-600">Work Smarter.</span> <br />
              Achieve More.
            </h1>

            {/* Supporting Paragraph */}
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal max-w-xl">
              TASKORA brings your projects, tasks, and team collaboration together in one organized workspace—so everyone knows what to do, what matters, and what comes next.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onOpenAuth('signup')}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-base hover:bg-blue-700 active:bg-blue-800 transition-all shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleExploreFeatures}
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-base hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                Explore Features
              </button>
            </div>

            {/* Supporting Statement */}
            <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-sm text-slate-500 font-medium">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Clear priorities. Connected teams. Better execution.</span>
            </div>
          </div>

          {/* RIGHT SIDE: Realistic TASKORA Dashboard Component Preview */}
          <div className="lg:col-span-6 w-full">
            <div className="relative mx-auto max-w-lg lg:max-w-none rounded-2xl bg-white border border-slate-200/90 shadow-xl shadow-slate-200/50 p-4 sm:p-5 transition-all">
              
              {/* Dashboard Top Header Strip */}
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="ml-2 text-xs font-semibold text-slate-500">TASKORA Core Workspace</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    Sprint 14
                  </span>
                </div>
              </div>

              {/* Project Title & Progress */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/70 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Website Redesign</h3>
                    <p className="text-xs text-slate-500">Milestone 2 • Q4 Launch Preparation</p>
                  </div>
                  <span className="text-xs font-bold text-blue-700 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                    68% Complete
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: '68%' }} />
                </div>
              </div>

              {/* Mini Interactive Kanban Representation (2x2 Grid / Stacked) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                
                {/* Card 1: To Do */}
                <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      To Do
                    </span>
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                      High
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900 mb-2 leading-tight">
                    Design landing page
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> Oct 18
                    </span>
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[9px]">
                      EC
                    </div>
                  </div>
                </div>

                {/* Card 2: In Progress */}
                <div className="bg-white rounded-lg p-3 border border-blue-200 bg-blue-50/20 shadow-2xs hover:border-blue-300 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      In Progress
                    </span>
                    <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                      Urgent
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900 mb-2 leading-tight">
                    Build navigation
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> Tomorrow
                    </span>
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[9px]">
                      DK
                    </div>
                  </div>
                </div>

                {/* Card 3: In Review */}
                <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                      In Review
                    </span>
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                      Medium
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900 mb-2 leading-tight">
                    Review components
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> Oct 16
                    </span>
                    <div className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-[9px]">
                      MR
                    </div>
                  </div>
                </div>

                {/* Card 4: Done */}
                <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Done
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900 mb-2 leading-tight">
                    Finalize responsive layout
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                    <span className="text-emerald-700 font-medium">Completed</span>
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[9px]">
                      SL
                    </div>
                  </div>
                </div>
              </div>

              {/* Small Activity Feed Strip */}
              <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-200/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-600 truncate">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">
                    <strong className="text-slate-800">Sarah Lin</strong> finalized responsive layout
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0 ml-2">12m ago</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
