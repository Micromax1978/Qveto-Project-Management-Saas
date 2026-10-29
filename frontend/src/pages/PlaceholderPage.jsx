import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PlaceholderPage({
  title,
  subtitle,
  icon: Icon,
  badge = 'Coming in Week 3',
}) {
  return (
    <div className="py-12 sm:py-20 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 mb-4 shadow-xs">
        {Icon ? <Icon className="w-7 h-7" /> : <Sparkles className="w-7 h-7" />}
      </div>

      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-3">
        <Sparkles className="w-3.5 h-3.5" />
        <span>{badge}</span>
      </span>

      <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2">
        {title}
      </h1>

      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6">
        {subtitle}
      </p>

      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs w-full text-left text-xs space-y-2 mb-6">
        <p className="font-bold text-slate-800">Sprint Roadmap Integration Notice:</p>
        <p className="text-slate-500 text-[11px] leading-relaxed">
          Week 2 deliverables focus exclusively on <strong>Projects, Tasks, and Kanban Workflows</strong>. Enterprise invitation management, full notification websockets, and organization governance belong to Phase 3.
        </p>
      </div>

      <Link
        to="/app/projects"
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors"
      >
        <span>Back to Projects</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
