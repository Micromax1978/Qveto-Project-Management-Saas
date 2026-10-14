import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../Logo';
import {
  CheckCircle2,
  Clock,
  Layers,
  Activity,
} from 'lucide-react';

export default function AuthBrandPanel({ mode = 'login' }) {
  const isLogin = mode === 'login';

  return (
    <div className="relative w-full h-full min-h-[640px] flex flex-col justify-between p-8 sm:p-12 lg:p-14 bg-slate-950 text-white overflow-hidden rounded-2xl border border-slate-800/80 shadow-2xl">
      {/* Subtle background decorative grid and glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />
      
      {/* Ambient soft glow accents */}
      <div
        className="absolute -top-32 -left-32 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Top Section: Brand Logo */}
      <div className="relative z-10 flex items-center justify-between">
        <Link
          to="/"
          className="group inline-flex items-center gap-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500 rounded-lg p-1 -m-1"
          aria-label="TASKORA - Return to Homepage"
        >
          <Logo size="md" variant="light" />
        </Link>
        <span className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-900/90 text-blue-400 border border-slate-800">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Enterprise-ready
        </span>
      </div>

      {/* Middle Section: Copy & Visual Dashboard Composition */}
      <div className="relative z-10 my-auto py-8">
        {/* Headlines */}
        <div className="max-w-md">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {isLogin ? (
              <>
                Welcome back to <br />
                <span className="text-blue-400">better teamwork.</span>
              </>
            ) : (
              <>
                Bring your team <br />
                <span className="text-blue-400">together.</span>
              </>
            )}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed font-normal">
            {isLogin
              ? 'Pick up where your team left off. Your projects, priorities, and progress are all waiting in one organized workspace.'
              : 'Create your workspace for clearer priorities, organized projects, and better collaboration.'}
          </p>
        </div>

        {/* Polished Interactive Dashboard Illustration */}
        <div className="mt-8 relative max-w-lg">
          {/* Main Workspace Preview Card */}
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md p-5 transition-all">
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white tracking-wide">
                    {isLogin ? 'Sprint 14: Q3 Platform Release' : 'Global Workspace Roadmap'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {isLogin ? '14 of 17 tasks completed' : 'Cross-functional Team Space'}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                On Track
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-[11px] font-medium mb-1.5">
                <span className="text-slate-400">Milestone Velocity</span>
                <span className="text-white font-semibold">{isLogin ? '82%' : '94%'}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: isLogin ? '82%' : '94%' }}
                />
              </div>
            </div>

            {/* Mini Kanban Columns or Connected Tasks */}
            {isLogin ? (
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {/* Column 1: In Progress */}
                <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      In Progress
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">2</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="bg-slate-900 p-2 rounded border border-slate-800 text-xs">
                      <p className="font-medium text-slate-200 line-clamp-1">Design System Sync</p>
                      <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400">
                        <span className="text-amber-400 font-medium">High</span>
                        <div className="flex -space-x-1">
                          <span className="w-4 h-4 rounded-full bg-blue-700 text-[9px] font-bold flex items-center justify-center text-white ring-1 ring-slate-900">
                            SC
                          </span>
                          <span className="w-4 h-4 rounded-full bg-purple-700 text-[9px] font-bold flex items-center justify-center text-white ring-1 ring-slate-900">
                            MR
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Completed / Done */}
                <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Completed
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">12</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="bg-slate-900/80 p-2 rounded border border-slate-800 text-xs">
                      <p className="font-medium text-slate-300 line-clamp-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        Auth UI Architecture
                      </p>
                      <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400">
                        <span className="text-emerald-400 font-medium">Shipped</span>
                        <span className="w-4 h-4 rounded-full bg-emerald-700 text-[9px] font-bold flex items-center justify-center text-white ring-1 ring-slate-900">
                          EL
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Sign Up Variant: Connected Workflow Nodes */
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <div>
                      <p className="text-xs font-semibold text-slate-200">Shared Sprint Planning</p>
                      <p className="text-[10px] text-slate-400">Live priority sync across 8 departments</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-blue-400">Active</span>
                </div>

                <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <div>
                      <p className="text-xs font-semibold text-slate-200">Automated Status Tracking</p>
                      <p className="text-[10px] text-slate-400">Zero status-meeting friction</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-400">Enabled</span>
                </div>
              </div>
            )}

            {/* Bottom Team Activity Pill */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-[10px] font-bold flex items-center justify-center text-white border border-slate-900">
                    JD
                  </span>
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-[10px] font-bold flex items-center justify-center text-white border border-slate-900">
                    AK
                  </span>
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-[10px] font-bold flex items-center justify-center text-white border border-slate-900">
                    MR
                  </span>
                </div>
                <span>4 active contributors</span>
              </div>
              <span className="text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Updated 2m ago
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Trust & Security Indicators */}
      <div className="relative z-10 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2 font-medium">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>99.9% Uptime Guarantee</span>
        </div>
        <div className="flex items-center gap-3">
          <span>SOC 2 Ready</span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span>AES-256 Encryption</span>
        </div>
      </div>
    </div>
  );
}
