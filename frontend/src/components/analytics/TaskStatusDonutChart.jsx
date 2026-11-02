import React, { useState } from 'react';
import { PieChart, CheckCircle2 } from 'lucide-react';

export default function TaskStatusDonutChart({ data }) {
  const { total = 0, categories = [] } = data || {};
  const [activeSegment, setActiveSegment] = useState(null);

  const radius = 38;
  const circumference = 2 * Math.PI * radius; // ~238.76

  // Calculate cumulative offsets
  let accumulatedPercent = 0;
  const segments = categories.map((cat) => {
    const pct = total > 0 ? cat.count / total : 0;
    const strokeDasharray = `${pct * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedPercent * circumference;
    accumulatedPercent += pct;

    return {
      ...cat,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const displayItem = activeSegment || {
    label: 'Total Tasks',
    count: total,
    percentage: 100,
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Task Status Distribution</h3>
          <p className="text-xs text-slate-500">Pipeline progression breakdown</p>
        </div>
        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
          <PieChart className="w-3.5 h-3.5" />
        </div>
      </div>

      {total === 0 ? (
        <div className="h-56 flex flex-col items-center justify-center text-center p-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
            <PieChart className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-slate-600">No Task Data Available</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Tasks matching the current filters will appear here.</p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
          {/* SVG Donut */}
          <div className="relative w-40 h-40 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
              {/* Background track */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-slate-100 fill-transparent"
                strokeWidth="11"
              />

              {/* Segments */}
              {segments.map((seg) => (
                <circle
                  key={seg.key}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={activeSegment?.key === seg.key ? '13' : '11'}
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setActiveSegment(seg)}
                  onMouseLeave={() => setActiveSegment(null)}
                  role="graphics-symbol"
                  aria-label={`${seg.label}: ${seg.count} tasks (${seg.percentage}%)`}
                />
              ))}
            </svg>

            {/* Centered Total / Active Info */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-xl font-extrabold text-slate-900 leading-tight">
                {displayItem.count}
              </span>
              <span className="text-[10px] font-medium text-slate-400 truncate max-w-[80px]">
                {displayItem.label}
              </span>
            </div>
          </div>

          {/* Accessible Legend */}
          <div className="space-y-2.5 w-full">
            {categories.map((cat) => (
              <div
                key={cat.key}
                onMouseEnter={() => setActiveSegment(cat)}
                onMouseLeave={() => setActiveSegment(null)}
                className={`flex items-center justify-between p-2 rounded-xl transition-colors cursor-pointer ${
                  activeSegment?.key === cat.key ? 'bg-slate-50 font-bold' : 'hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-xs text-slate-700 font-medium">{cat.label}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-slate-900">{cat.count}</span>
                  <span className="text-[11px] text-slate-400">({cat.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
