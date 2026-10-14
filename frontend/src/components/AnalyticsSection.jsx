import React from 'react';
import { 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { SAMPLE_ANALYTICS } from '../data/landingPageData';

export default function AnalyticsSection() {
  const maxVelocity = 14;

  return (
    <section className="py-20 lg:py-28 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/70 text-blue-800 text-xs font-semibold uppercase tracking-wider mb-3">
            <span>Productivity Analytics</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
            See the progress behind every project.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Understand what&apos;s moving forward, what needs attention, and where your team should focus next.
          </p>
        </div>

        {/* Analytics Dashboard Illustration Frame */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-5 sm:p-8">
          
          {/* Top 4 Metric KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {SAMPLE_ANALYTICS.metrics.map((metric, i) => (
              <div
                key={i}
                className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 hover:border-blue-200 transition-colors"
              >
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="font-medium">{metric.label}</span>
                  {i === 0 && <TrendingUp className="w-4 h-4 text-blue-600" />}
                  {i === 1 && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  {i === 2 && <Clock className="w-4 h-4 text-indigo-600" />}
                  {i === 3 && <AlertCircle className="w-4 h-4 text-rose-500" />}
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">
                  {metric.value}
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold">
                  <span
                    className={
                      metric.positive === true
                        ? 'text-emerald-700'
                        : metric.positive === false
                        ? 'text-rose-600'
                        : 'text-slate-500'
                    }
                  >
                    {metric.change}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Lower Grid: Weekly Activity Chart + Active Projects Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Weekly Activity Velocity Chart (7 Cols) */}
            <div className="lg:col-span-7 bg-slate-50/50 rounded-xl p-5 border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Weekly Task Activity</h4>
                  <p className="text-xs text-slate-500">Completed vs Planned Velocity (Sprint 14)</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-3 h-3 rounded-xs bg-blue-600 inline-block" /> Completed
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-3 h-3 rounded-xs bg-slate-300 inline-block" /> Planned
                  </span>
                </div>
              </div>

              {/* Bar visualization */}
              <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 pt-6 px-2">
                {SAMPLE_ANALYTICS.weeklyActivity.map((item) => {
                  const completedHeight = `${(item.completed / maxVelocity) * 100}%`;
                  const plannedHeight = `${(item.planned / maxVelocity) * 100}%`;

                  return (
                    <div key={item.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <div className="w-full max-w-[32px] flex items-end justify-center gap-1 h-full">
                        {/* Planned Bar */}
                        <div
                          style={{ height: plannedHeight }}
                          className="w-1/2 bg-slate-200 rounded-t-xs transition-all duration-300 group-hover:bg-slate-300"
                          title={`Planned: ${item.planned}`}
                        />
                        {/* Completed Bar */}
                        <div
                          style={{ height: completedHeight }}
                          className="w-1/2 bg-blue-600 rounded-t-xs transition-all duration-300 group-hover:bg-blue-500 shadow-2xs"
                          title={`Completed: ${item.completed}`}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-600">{item.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Project Progress Bars List (5 Cols) */}
            <div className="lg:col-span-5 bg-slate-50/50 rounded-xl p-5 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-slate-900">Active Project Delivery</h4>
                <span className="text-xs text-slate-500">4 Initiatives</span>
              </div>

              <div className="space-y-4">
                {SAMPLE_ANALYTICS.projects.map((proj, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-900 mb-1.5">
                      <span>{proj.name}</span>
                      <span className="text-blue-700">{proj.progress}%</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                      <div
                        className={`${proj.color} h-full rounded-full transition-all duration-500`}
                        style={{ width: `${proj.progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Status: {proj.status}</span>
                      <span>Target: {proj.due}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Fictional Demonstration Notice footnote */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
            Fictional demonstration data illustrating TASKORA workspace velocity and project health reporting.
          </div>

        </div>

      </div>
    </section>
  );
}
