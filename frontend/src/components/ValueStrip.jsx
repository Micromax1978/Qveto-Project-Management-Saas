import React from 'react';
import { LayoutGrid, UserCheck, Activity, TrendingUp } from 'lucide-react';
import { VALUE_PROPOSITIONS } from '../data/landingPageData';

const iconMap = {
  LayoutGrid,
  UserCheck,
  Activity,
  TrendingUp,
};

export default function ValueStrip() {
  return (
    <section className="py-12 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {VALUE_PROPOSITIONS.map((item) => {
            const Icon = iconMap[item.iconName] || LayoutGrid;
            return (
              <div
                key={item.id}
                className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
              >
                <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-1 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
