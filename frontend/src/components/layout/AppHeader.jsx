import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  Plus,
  ChevronDown,
  RefreshCw,
  LogOut,
  Shield,
} from 'lucide-react';
import Avatar from '../ui/Avatar';
import { RoleBadge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { Permissions } from '../../constants/roles';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../../services/api';

export default function AppHeader({
  onOpenMobileMenu,
  onOpenCreateProject,
  onOpenCreateTask,
  searchQuery = '',
  onSearchChange,
}) {
  const { currentUser, users, switchUser, resetData } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const loadNotifications = async () => {
    try {
      const res = await fetchNotifications({ limit: 10 });
      if (res && res.notifications) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (_) {
      // Silent failover to maintain UI resilience
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [currentUser]);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      try {
        await markNotificationAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine current page contextual title & primary action
  const isProjectsList = location.pathname === '/app/projects';
  const isProjectDetail = location.pathname.startsWith('/app/projects/');
  const isTasksPage = location.pathname === '/app/tasks';

  const canCreateProj = Permissions.canCreateProject(currentUser?.role);

  return (
    <header className="h-16 px-4 sm:px-6 bg-white border-b border-slate-200/90 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile hamburger & breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Dynamic Breadcrumbs / Title */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs">
          <Link
            to="/app/projects"
            className="font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Workspace
          </Link>
          <span className="text-slate-300">/</span>
          {isProjectsList && (
            <span className="font-bold text-slate-900">Projects</span>
          )}
          {isProjectDetail && (
            <span className="font-bold text-slate-900">Project View</span>
          )}
          {isTasksPage && (
            <span className="font-bold text-slate-900">My Tasks</span>
          )}
          {!isProjectsList && !isProjectDetail && !isTasksPage && (
            <span className="font-bold text-slate-900 capitalize">
              {location.pathname.replace('/app/', '')}
            </span>
          )}
        </nav>
      </div>

      {/* Right: Search, Notifications, Primary Action, User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Contextual Action Button */}
        {isProjectsList && onOpenCreateProject && (
          <button
            type="button"
            onClick={onOpenCreateProject}
            disabled={!canCreateProj}
            title={!canCreateProj ? 'Employees cannot create projects' : 'Create new project'}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-semibold text-white shadow-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
              canCreateProj
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Project</span>
            <span className="sm:hidden">New</span>
          </button>
        )}

        {isProjectDetail && onOpenCreateTask && (
          <button
            type="button"
            onClick={onOpenCreateTask}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Task</span>
            <span className="sm:hidden">Task</span>
          </button>
        )}

        {/* Notifications Icon with Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              if (!notificationsOpen) loadNotifications();
            }}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors relative focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-white" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-84 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-xl p-4 z-40 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold text-white bg-blue-600 px-1.5 py-0.2 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              
              <div className="space-y-2 text-xs max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-slate-400">
                    <p className="text-xs font-medium text-slate-600">No notifications yet</p>
                    <p className="text-[10px] mt-0.5 text-slate-400">You're all caught up!</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                        n.read
                          ? 'bg-slate-50/70 border-slate-100 text-slate-600'
                          : 'bg-blue-50/60 border-blue-200 text-slate-900 shadow-2xs hover:bg-blue-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <p className="font-bold text-[11px] text-slate-900 leading-snug">{n.title}</p>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        {n.message}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 text-[9px] text-slate-400">
                        <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                        <span className="uppercase tracking-wider font-bold text-[8px] bg-slate-200/60 px-1.5 py-0.5 rounded text-slate-600">
                          {n.type?.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Interactive Role Switcher Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            aria-expanded={profileOpen}
            aria-haspopup="true"
          >
            <Avatar user={currentUser} size="sm" showTooltip={false} />
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser?.name}
              </span>
              <span className="text-[10px] text-slate-500 leading-tight">
                {currentUser?.role}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-xl p-3 z-40 animate-in fade-in zoom-in-95 duration-150">
              {/* User summary */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 mb-2">
                <div className="flex items-center gap-2.5">
                  <Avatar user={currentUser} size="md" showTooltip={false} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {currentUser?.name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {currentUser?.email}
                    </p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Active Role</span>
                  <RoleBadge role={currentUser?.role || 'EMPLOYEE'} />
                </div>
              </div>

              {/* Demo Role Switcher */}
              <div className="py-2 border-t border-b border-slate-100">
                <div className="px-2 pb-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Test Account
                  </span>
                  <Shield className="w-3 h-3 text-slate-400" />
                </div>
                <div className="space-y-1">
                  {users.map((u) => {
                    const isSelected = u.id === currentUser?.id;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          switchUser(u.id);
                          setProfileOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                          isSelected
                            ? 'bg-blue-50 text-blue-700 font-bold'
                            : 'text-slate-700 hover:bg-slate-100 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar user={u} size="xs" showTooltip={false} />
                          <span className="truncate">{u.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 capitalize">
                          {u.role.toLowerCase()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reset Local Demo Data */}
              <div className="pt-2 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset all demo projects and tasks to default?')) {
                      resetData();
                      setProfileOpen(false);
                    }
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-slate-700 hover:bg-slate-100 transition-colors font-medium text-left"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reset Demo Data</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-rose-600 hover:bg-rose-50 transition-colors font-medium text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
