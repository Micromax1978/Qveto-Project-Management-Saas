import React from 'react';
import { Building2, Briefcase, UserCheck } from 'lucide-react';

const ROLES = [
  {
    id: 'organization',
    label: 'Organization',
    shortLabel: 'Org',
    badge: 'Enterprise Root',
    description: 'Admin & executive workspace',
    icon: Building2,
  },
  {
    id: 'manager',
    label: 'Manager',
    shortLabel: 'Manager',
    badge: 'Project Lead',
    description: 'Sprint & team orchestration',
    icon: Briefcase,
  },
  {
    id: 'employee',
    label: 'Employee',
    shortLabel: 'Employee',
    badge: 'Member',
    description: 'Task execution & collaboration',
    icon: UserCheck,
  },
];

export default function RoleSelector({
  selectedRole = 'manager',
  onSelectRole,
  disabled = false,
  className = '',
}) {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
          Sign In As
        </label>
        <span className="text-[11px] font-medium text-slate-400">
          Role-based workspace access
        </span>
      </div>

      <div
        role="tablist"
        aria-label="Select User Role"
        className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-100/90 rounded-xl border border-slate-200/90 shadow-2xs"
      >
        {ROLES.map((role) => {
          const isSelected = selectedRole === role.id;
          const Icon = role.icon;

          return (
            <button
              key={role.id}
              type="button"
              role="tab"
              id={`role-tab-${role.id}`}
              aria-selected={isSelected}
              aria-controls={`role-panel-${role.id}`}
              disabled={disabled}
              onClick={() => onSelectRole(role.id)}
              className={`relative flex flex-col items-center justify-center py-2.5 px-2 rounded-lg text-xs font-semibold transition-all duration-200 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:ring-offset-1 select-none ${
                isSelected
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/70'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 border border-transparent'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isSelected ? 'text-blue-600' : 'text-slate-400'
                  }`}
                  aria-hidden="true"
                />
                <span className="font-bold">{role.label}</span>
              </div>

              {/* Subtle active indicator dot */}
              {isSelected && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-0.5"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
