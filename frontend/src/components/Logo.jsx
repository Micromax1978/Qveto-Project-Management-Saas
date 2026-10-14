import React from 'react';

/**
 * TASKORA Official Logo Component
 * Connected workflow nodes forming a stylized letter 'T'.
 */
export default function Logo({ size = 'md', variant = 'dark', showWordmark = true, className = '' }) {
  // Size mappings
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const textColor = variant === 'light' ? 'text-white' : 'text-slate-950';

  return (
    <div className={`inline-flex items-center gap-2.5 font-bold tracking-tight select-none ${className}`}>
      {/* Stylized Node-based 'T' Icon */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center rounded-lg bg-blue-600 shadow-sm shadow-blue-500/20 shrink-0 transition-transform duration-200 hover:scale-105`}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 32 32"
          className="w-full h-full p-1.5"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Top horizontal connection bridge */}
          <line x1="7" y1="9" x2="25" y2="9" stroke="white" strokeWidth="2.75" strokeLinecap="round" />
          {/* Vertical stem connection */}
          <line x1="16" y1="9" x2="16" y2="24" stroke="white" strokeWidth="2.75" strokeLinecap="round" />
          
          {/* Left workflow node */}
          <circle cx="7" cy="9" r="3" fill="#FFFFFF" stroke="#2563EB" strokeWidth="1.5" />
          {/* Center workflow hub node */}
          <circle cx="16" cy="9" r="3.5" fill="#93C5FD" stroke="#FFFFFF" strokeWidth="1.75" />
          {/* Right workflow node */}
          <circle cx="25" cy="9" r="3" fill="#FFFFFF" stroke="#2563EB" strokeWidth="1.5" />
          {/* Bottom terminal node */}
          <circle cx="16" cy="24" r="3" fill="#FFFFFF" stroke="#2563EB" strokeWidth="1.5" />
        </svg>
      </div>

      {showWordmark && (
        <span className={`${textSizes[size]} ${textColor} font-extrabold tracking-tight transition-colors`}>
          TASKORA
        </span>
      )}
    </div>
  );
}
