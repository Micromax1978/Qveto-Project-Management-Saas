import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export default function StatMetricCard({
  title,
  value,
  subtext,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBg = 'bg-blue-50',
  trend = null, // { value: '+12%', isPositive: true|false|neutral, label: 'vs last week' }
  badge = null,
}) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className={`w-8 h-8 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </span>
        {badge && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {badge}
          </span>
        )}
      </div>

      {subtext && (
        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{subtext}</p>
      )}

      {trend && (
        <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100 text-[11px] font-semibold">
          {trend.isPositive === true && (
            <span className="inline-flex items-center gap-0.5 text-emerald-600">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{trend.value}</span>
            </span>
          )}
          {trend.isPositive === false && (
            <span className="inline-flex items-center gap-0.5 text-rose-600">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>{trend.value}</span>
            </span>
          )}
          {trend.isPositive === 'neutral' && (
            <span className="inline-flex items-center gap-0.5 text-slate-500">
              <Minus className="w-3.5 h-3.5" />
              <span>{trend.value}</span>
            </span>
          )}
          {trend.label && <span className="text-slate-400 font-normal">{trend.label}</span>}
        </div>
      )}
    </div>
  );
}
