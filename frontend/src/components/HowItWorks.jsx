import React from 'react';
import { CheckCircle2 } from 'lucide-react';

import { WORKFLOW_STEPS } from '../data/landingPageData';

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/70 text-blue-800 text-xs font-semibold uppercase tracking-wider mb-3">
            <span>Structured Workflow</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
            From scattered tasks to structured progress.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            A proven three-step approach designed to eliminate coordination friction and accelerate team delivery.
          </p>
        </div>

        {/* Steps Grid: Horizontal on Desktop, Vertical on Mobile */}
        <div className="relative">
          
          {/* Connecting line on desktop */}
          <div className="hidden lg:block absolute top-28 left-[16%] right-[16%] h-0.5 bg-linear-to-r from-blue-300 via-blue-500 to-emerald-400 -z-0" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
            {WORKFLOW_STEPS.map((step, idx) => (
              <div
                key={step.stepNumber}
                className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Step Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md shadow-blue-500/25 ring-4 ring-blue-50">
                      {step.stepNumber}
                    </div>
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                      {step.tag}
                    </span>
                  </div>

                  {/* Step Title */}
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    {step.title}
                  </h3>

                  {/* Step Description */}
                  <p className="text-slate-600 text-sm leading-relaxed mb-6 font-normal">
                    {step.description}
                  </p>

                  {/* Step Bullets */}
                  <ul className="space-y-2.5 mb-6 text-xs text-slate-700">
                    {step.details.map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Step Visual Mini-Widget */}
                <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/80 rounded-xl p-3 text-xs">
                  {idx === 0 && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between font-semibold text-slate-800">
                        <span>Milestone 1: MVP Architecture</span>
                        <span className="text-blue-600 font-bold">Planned</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full w-2/5" />
                      </div>
                    </div>
                  )}
                  {idx === 1 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">
                          EC
                        </div>
                        <span className="font-semibold text-slate-800">Elena Chen (Assigned)</span>
                      </div>
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">High Priority</span>
                    </div>
                  )}
                  {idx === 2 && (
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">Sprint 14 Velocity</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> 94% on schedule
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
