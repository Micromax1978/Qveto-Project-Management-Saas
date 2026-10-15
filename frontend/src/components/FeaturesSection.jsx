import React from 'react';
import { 
  FolderKanban, 
  CheckSquare, 
  Columns3, 
  Users, 
  BarChart2, 
  LineChart, 
  ArrowUpRight 
} from 'lucide-react';
import { FEATURES } from '../data/landingPageData';

const iconMap = {
  FolderKanban,
  CheckSquare,
  Columns3,
  Users,
  BarChart2,
  LineChart,
};

function FeatureCard({ feature, onSelect }) {
  const Icon = iconMap[feature.iconName] || FolderKanban;

  return (
    <div
      onClick={onSelect}
      className="group relative bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between cursor-pointer"
    >
      <div>
        {/* Card Header: Icon & Category Badge */}
        <div className="flex items-center justify-between mb-5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-2xs">
            <Icon className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 group-hover:bg-blue-50 group-hover:text-blue-700 px-2.5 py-1 rounded-md transition-colors">
            {feature.badge}
          </span>
        </div>

        {/* Feature Title */}
        <h3 className="text-xl font-bold text-slate-900 mb-2.5 group-hover:text-blue-600 transition-colors">
          {feature.title}
        </h3>

        {/* Feature Description */}
        <p className="text-slate-600 text-sm leading-relaxed font-normal">
          {feature.description}
        </p>
      </div>

      {/* Subtle Bottom Link Indicator */}
      <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:text-blue-700">
        <span>Learn capability</span>
        <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </div>
    </div>
  );
}

export default function FeaturesSection({ onOpenAuth }) {
  return (
    <section id="features" className="py-20 lg:py-28 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-3 border border-blue-200">
            <span>Core Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
            Everything works better when it&apos;s connected.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            From the first project plan to the final milestone, TASKORA keeps your team organized and moving forward.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {FEATURES.map((feature) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              onSelect={() => onOpenAuth(`feature-${feature.id}`)}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
