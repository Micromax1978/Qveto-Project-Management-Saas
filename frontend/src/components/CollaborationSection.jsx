import React from 'react';
import { CheckCircle2, ArrowRight, ShieldCheck, CornerDownRight } from 'lucide-react';

import { COLLABORATION_BENEFITS } from '../data/landingPageData';

export default function CollaborationSection({ onOpenAuth }) {
  return (
    <section className="py-20 lg:py-28 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* Left Column: Headline and 3 Benefits */}
          <div className="lg:col-span-6 space-y-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-3 border border-blue-200">
                <span>Team Collaboration</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
                Everyone aligned. <br />
                <span className="text-blue-600">Every task accountable.</span>
              </h2>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
                Give your team a shared view of priorities, responsibilities, and progress. Reduce confusion and make collaboration a natural part of getting work done.
              </p>
            </div>

            {/* Three Structured Benefits */}
            <div className="space-y-4">
              {COLLABORATION_BENEFITS.map((benefit, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3.5 p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed font-normal">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick action button */}
            <button
              type="button"
              onClick={() => onOpenAuth('collaboration-demo')}
              className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors group"
            >
              <span>Explore real-time team workflow</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Right Column: Original Visual Collaboration Dashboard Illustration */}
          <div className="lg:col-span-6">
            <div className="relative mx-auto max-w-lg lg:max-w-none bg-slate-900 rounded-2xl p-5 sm:p-7 shadow-2xl text-white border border-slate-800">
              
              {/* Header inside illustration */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                    TK
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Task Discussion & Activity</h4>
                    <p className="text-xs text-slate-400">#tsk-104: Component System Audit</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700/50">
                  Sprint Active
                </span>
              </div>

              {/* Task Detail Card inside illustration */}
              <div className="bg-slate-800/90 rounded-xl p-4 border border-slate-700/80 mb-5">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>Assigned to: <strong className="text-white">Elena Chen (Design Lead)</strong></span>
                  <span className="text-amber-400 font-semibold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                    High Priority
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-200">
                  &ldquo;Refactor standard modal transitions and verify WCAG AA color contrast on all button tokens.&rdquo;
                </p>
              </div>

              {/* Live Activity & Contextual Discussion Stream */}
              <div className="space-y-3.5 mb-5">
                
                {/* Comment 1 */}
                <div className="flex items-start gap-3 text-xs">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                    EC
                  </div>
                  <div className="flex-1 bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-200">Elena Chen</span>
                      <span className="text-[10px] text-slate-400">10:42 AM</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      Updated the color palette. Blue accents now hit 4.8:1 contrast on white and dark backdrops.
                    </p>
                  </div>
                </div>

                {/* Comment 2 with reply */}
                <div className="flex items-start gap-3 text-xs pl-4 sm:pl-6 border-l-2 border-blue-600/40">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                    DK
                  </div>
                  <div className="flex-1 bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-200">David Kim</span>
                      <span className="text-[10px] text-slate-400">11:05 AM</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      Reviewed and approved. Ready to pull into the master frontend release branch.
                    </p>
                  </div>
                </div>

                {/* System Activity Log */}
                <div className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-slate-800/40 border border-slate-700/40 text-[11px] text-slate-400">
                  <CornerDownRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    Status moved from <strong className="text-amber-300">In Review</strong> to <strong className="text-emerald-400">Done</strong> by David Kim
                  </span>
                </div>

              </div>

              {/* Team Members Alignment Bar */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>All 4 team members in sync</span>
                </span>
                <span className="text-[11px] text-blue-400 font-semibold">Real-time thread</span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
