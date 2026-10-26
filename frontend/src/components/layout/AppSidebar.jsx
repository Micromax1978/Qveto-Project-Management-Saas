import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FolderKanban,
  CheckSquare,
  Users,
  Bell,
  Settings,
  ChevronDown,
  Building2,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';
import Logo from '../Logo';
import Avatar from '../ui/Avatar';
import { RoleBadge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';

export default function AppSidebar({
  collapsed = false,
  onToggleCollapse,
  onCloseMobile,
}) {
  const { currentUser, organization } = useAuth();
  const location = useLocation();

  // Navigation items defined in specification
  const primaryNav = [
    {
      name: 'Overview',
      path: '/app/overview',
      icon: Layers,
      isPlaceholder: true,
    },
    {
      name: 'Projects',
      path: '/app/projects',
      icon: FolderKanban,
      // Active for any project sub-route
      isActive: (path) => path.startsWith('/app/projects'),
    },
    {
      name: 'My Tasks',
      path: '/app/tasks',
      icon: CheckSquare,
      isActive: (path) => path === '/app/tasks',
    },
  ];

  const secondaryNav = [
    {
      name: 'Team',
      path: '/app/team',
      icon: Users,
      badge: 'Week 3',
      isPlaceholder: true,
    },
    {
      name: 'Notifications',
      path: '/app/notifications',
      icon: Bell,
      badge: 'Week 3',
      isPlaceholder: true,
    },
    {
      name: 'Settings',
      path: '/app/settings',
      icon: Settings,
      isPlaceholder: true,
    },
  ];

  return (
    <aside
      className={`h-screen bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-all duration-300 select-none ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80">
        <NavLink
          to="/app/projects"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
          aria-label="Taskora Home"
        >
          <Logo size="sm" variant="light" showWordmark={!collapsed} />
        </NavLink>

        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden lg:flex w-7 h-7 rounded-lg items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Workspace / Organization Selector */}
      <div className="p-3 border-b border-slate-800/60">
        <div
          className={`flex items-center gap-2.5 p-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-200 transition-colors ${
            collapsed ? 'justify-center' : 'justify-between'
          }`}
          title={organization?.name || 'Workspace'}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">
                  {organization?.name || 'Acme Corporation'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {organization?.plan || 'Enterprise Workspace'}
                </p>
              </div>
            )}
          </div>
          {!collapsed && <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-6">
        {/* Core Workflow */}
        <div>
          {!collapsed && (
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Workspace
            </p>
          )}
          <nav className="space-y-1" aria-label="Main Workspace Navigation">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              const active = item.isActive
                ? item.isActive(location.pathname)
                : location.pathname === item.path;

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={onCloseMobile}
                  title={collapsed ? item.name : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    active
                      ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  } ${collapsed ? 'justify-center px-2' : ''}`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Secondary Navigation / Placeholders */}
        <div>
          {!collapsed && (
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Management
            </p>
          )}
          <nav className="space-y-1" aria-label="Secondary Navigation">
            {secondaryNav.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={onCloseMobile}
                  title={collapsed ? item.name : undefined}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                    active
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  } ${collapsed ? 'justify-center px-2' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-slate-200" />
                    {!collapsed && <span className="truncate">{item.name}</span>}
                  </div>
                  {!collapsed && item.badge && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div
          className={`flex items-center gap-3 p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 ${
            collapsed ? 'justify-center p-1.5' : ''
          }`}
          title={`${currentUser?.name} (${currentUser?.role})`}
        >
          <Avatar user={currentUser} size={collapsed ? 'sm' : 'md'} />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-bold text-white truncate">
                  {currentUser?.name || 'Guest User'}
                </p>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {currentUser?.email}
              </p>
              <div className="mt-1">
                <RoleBadge role={currentUser?.role || 'EMPLOYEE'} />
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
