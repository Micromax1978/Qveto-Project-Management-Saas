import React, { useState } from 'react';
import {
  Settings,
  Layers,
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Check,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { workspaceService } from '../../services/workspaceService';
import { ROLES } from '../../constants/roles';
import { RoleBadge } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';

export default function SettingsPage() {
  const { currentUser, organization, updateOrganization, activeWorkspaceId, switchWorkspace, refreshAuth, resetData } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('organization'); // 'organization' | 'workspaces' | 'permissions' | 'security'
  const isOwner = currentUser?.role === ROLES.OWNER;
  const isManagerOrOwner = currentUser?.role === ROLES.OWNER || currentUser?.role === ROLES.MANAGER;

  // Org form state
  const [orgForm, setOrgForm] = useState({
    name: organization?.name || 'Acme Corporation',
    slug: organization?.slug || 'acme-corp',
    plan: organization?.plan || 'Enterprise Pro',
  });
  const [isSavingOrg, setIsSavingOrg] = useState(false);

  // Workspace modal
  const [createWsOpen, setCreateWsOpen] = useState(false);
  const [wsData, setWsData] = useState({ name: '', description: '' });
  const [isCreatingWs, setIsCreatingWs] = useState(false);

  // Edit workspace modal
  const [editingWs, setEditingWs] = useState(null);
  const [editWsData, setEditWsData] = useState({ name: '', description: '' });
  const [isUpdatingWs, setIsUpdatingWs] = useState(false);

  const handleOrgSave = (e) => {
    e.preventDefault();
    if (!isOwner) {
      showToast?.('Only Organization Owner can modify organization settings', 'error');
      return;
    }
    setIsSavingOrg(true);
    updateOrganization({
      name: orgForm.name.trim(),
      slug: orgForm.slug.trim(),
      plan: orgForm.plan,
    });
    setTimeout(() => {
      setIsSavingOrg(false);
      showToast?.('Organization profile updated successfully', 'success');
    }, 400);
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!wsData.name.trim()) return;
    setIsCreatingWs(true);
    try {
      const created = await workspaceService.createWorkspace(wsData);
      refreshAuth();
      setCreateWsOpen(false);
      setWsData({ name: '', description: '' });
      showToast?.(`Workspace "${created.name}" created`, 'success');
    } catch (err) {
      showToast?.(err.message || 'Failed to create workspace', 'error');
    } finally {
      setIsCreatingWs(false);
    }
  };

  const handleUpdateWorkspace = async (e) => {
    e.preventDefault();
    if (!editingWs || !editWsData.name.trim()) return;
    setIsUpdatingWs(true);
    try {
      await workspaceService.updateWorkspace(editingWs.id, editWsData);
      refreshAuth();
      setEditingWs(null);
      showToast?.('Workspace updated successfully', 'success');
    } catch (err) {
      showToast?.(err.message || 'Failed to update workspace', 'error');
    } finally {
      setIsUpdatingWs(false);
    }
  };

  const handleDeleteWorkspace = async (wsId) => {
    if (!window.confirm('Are you sure you want to delete this workspace?')) return;
    try {
      await workspaceService.deleteWorkspace(wsId);
      refreshAuth();
      showToast?.('Workspace deleted', 'info');
    } catch (err) {
      showToast?.(err.message || 'Cannot delete workspace', 'error');
    }
  };

  const permissionsMatrix = [
    { module: 'Projects', action: 'Create Projects', owner: true, manager: true, employee: false },
    { module: 'Projects', action: 'Edit Project Details', owner: true, manager: true, employee: false },
    { module: 'Projects', action: 'Delete Projects', owner: true, manager: false, employee: false },
    { module: 'Tasks', action: 'Create Tasks', owner: true, manager: true, employee: true },
    { module: 'Tasks', action: 'Update Task & Move Status', owner: true, manager: true, employee: true },
    { module: 'Tasks', action: 'Delete Tasks', owner: true, manager: true, employee: false },
    { module: 'Tasks', action: 'Assign Tasks to Others', owner: true, manager: true, employee: false },
    { module: 'Comments', action: 'Add Comments', owner: true, manager: true, employee: true },
    { module: 'Comments', action: 'Moderate / Delete Comments', owner: true, manager: true, employee: 'Own only' },
    { module: 'Attachments', action: 'Upload & Download Files', owner: true, manager: true, employee: true },
    { module: 'Organization', action: 'Edit Organization Name & Plan', owner: true, manager: false, employee: false },
    { module: 'Organization', action: 'Manage Workspaces & Teams', owner: true, manager: true, employee: false },
    { module: 'Members', action: 'Invite New Users', owner: true, manager: true, employee: false },
    { module: 'Members', action: 'Modify User Roles', owner: true, manager: false, employee: false },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
          <Settings className="w-4 h-4" />
          <span>Tenant Configuration</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500">{organization?.name}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Organization & Workspace Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage organization attributes, multi-tenant workspace environments, and role access permissions.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('organization')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'organization'
              ? 'bg-blue-50 text-blue-700'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Organization Profile
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('workspaces')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'workspaces'
              ? 'bg-blue-50 text-blue-700'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Workspaces ({organization?.workspaces?.length || 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('permissions')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'permissions'
              ? 'bg-blue-50 text-blue-700'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Permissions Matrix
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-blue-50 text-blue-700'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Security & Multi-Tenancy
        </button>
      </div>

      {/* Tab 1: Organization Profile */}
      {activeTab === 'organization' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs max-w-3xl">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Enterprise Organization Profile</h2>
              <p className="text-xs text-slate-500">Root multi-tenant entity metadata</p>
            </div>
            {!isOwner && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold">
                <Lock className="w-3.5 h-3.5" />
                <span>Read-Only (Owner required to modify)</span>
              </span>
            )}
          </div>

          <form onSubmit={handleOrgSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Organization Name</label>
              <input
                type="text"
                disabled={!isOwner}
                value={orgForm.name}
                onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:opacity-75 disabled:bg-slate-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tenant Slug / Subdomain</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    disabled={!isOwner}
                    value={orgForm.slug}
                    onChange={(e) => setOrgForm({ ...orgForm, slug: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:opacity-75 disabled:bg-slate-100 font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Tenant URL: https://{orgForm.slug}.taskora.app</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subscription Plan</label>
                <select
                  disabled={!isOwner}
                  value={orgForm.plan}
                  onChange={(e) => setOrgForm({ ...orgForm, plan: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:opacity-75 disabled:bg-slate-100"
                >
                  <option value="Enterprise Pro">Enterprise Pro (Unlimited)</option>
                  <option value="Business Growth">Business Growth</option>
                  <option value="Starter Team">Starter Team</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Multi-tenant RLS enabled</p>
              </div>
            </div>

            {isOwner && (
              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingOrg}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSavingOrg ? 'Saving Changes...' : 'Save Organization Settings'}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Tab 2: Workspaces */}
      {activeTab === 'workspaces' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Workspaces in this Organization</h2>
              <p className="text-xs text-slate-500">Each workspace provides an isolated project portfolio and member context.</p>
            </div>
            {isManagerOrOwner && (
              <button
                type="button"
                onClick={() => setCreateWsOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Workspace</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(organization?.workspaces || []).map((ws) => {
              const isActive = ws.id === activeWorkspaceId;
              return (
                <div
                  key={ws.id}
                  className={`bg-white p-5 rounded-2xl border transition-all ${
                    isActive ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{ws.name}</h3>
                        {ws.isDefault && (
                          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            Default Workspace
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isManagerOrOwner && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingWs(ws);
                            setEditWsData({ name: ws.name, description: ws.description || '' });
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                          title="Edit workspace"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isOwner && !ws.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleDeleteWorkspace(ws.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                          title="Delete workspace"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 mb-4 min-h-[32px]">
                    {ws.description || 'No description provided.'}
                  </p>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">ID: {ws.id}</span>
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600">
                        <Check className="w-3.5 h-3.5" />
                        <span>Currently Active</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          switchWorkspace(ws.id);
                          showToast?.(`Switched to workspace "${ws.name}"`, 'info');
                        }}
                        className="text-xs font-semibold text-slate-600 hover:text-blue-600 hover:underline"
                      >
                        Switch to this Workspace
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Permissions Matrix */}
      {activeTab === 'permissions' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50/75 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Role-Based Access Control (RBAC) Matrix</h2>
              <p className="text-xs text-slate-500">Defines exact operational permissions across tenant user tiers</p>
            </div>
            <div className="flex items-center gap-2">
              <RoleBadge role="OWNER" />
              <RoleBadge role="MANAGER" />
              <RoleBadge role="EMPLOYEE" />
            </div>
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-4">Module</th>
                <th className="py-2.5 px-4">Action / Capability</th>
                <th className="py-2.5 px-4 text-center">Owner</th>
                <th className="py-2.5 px-4 text-center">Manager</th>
                <th className="py-2.5 px-4 text-center">Employee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {permissionsMatrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-4 font-semibold text-slate-800">{row.module}</td>
                  <td className="py-2.5 px-4 text-slate-600">{row.action}</td>
                  <td className="py-2.5 px-4 text-center">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700">
                      Allowed
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {row.manager ? (
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700">
                        Allowed
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-600">
                        Denied
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {row.employee === true ? (
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700">
                        Allowed
                      </span>
                    ) : row.employee === false ? (
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-600">
                        Denied
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700">
                        {row.employee}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Security & Multi-Tenancy */}
      {activeTab === 'security' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs max-w-3xl space-y-6">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900">
            <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0" />
            <div className="text-xs">
              <p className="font-bold">Multi-Tenant Data Isolation Active</p>
              <p className="text-blue-700">
                All queries, tasks, and project models are scoped with <strong className="font-mono">org_id: {organization?.id}</strong>.
                Direct cross-tenant access returns 404/403 at the API and service gateway.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Demo Testing & Data Reset</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Taskora maintains an in-browser local storage replica aligned with backend PostgreSQL schemas.
              You can reset the database seed at any time to test the initial clean workspace experience.
            </p>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset all demo state to fresh default seed?')) {
                  resetData();
                  showToast?.('Local demo seed reset to initial state', 'info');
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Demo Seed Data</span>
            </button>
          </div>
        </div>
      )}

      {/* Create Workspace Modal */}
      <Modal
        isOpen={createWsOpen}
        onClose={() => setCreateWsOpen(false)}
        title="Create New Workspace"
      >
        <form onSubmit={handleCreateWorkspace} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Workspace Name</label>
            <input
              type="text"
              required
              placeholder="e.g., Mobile Apps, Sales Operations..."
              value={wsData.name}
              onChange={(e) => setWsData({ ...wsData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Workspace scope and primary focus..."
              value={wsData.description}
              onChange={(e) => setWsData({ ...wsData, description: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateWsOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreatingWs}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50"
            >
              {isCreatingWs ? 'Creating...' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Workspace Modal */}
      <Modal
        isOpen={Boolean(editingWs)}
        onClose={() => setEditingWs(null)}
        title="Edit Workspace"
      >
        <form onSubmit={handleUpdateWorkspace} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Workspace Name</label>
            <input
              type="text"
              required
              value={editWsData.name}
              onChange={(e) => setEditWsData({ ...editWsData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={editWsData.description}
              onChange={(e) => setEditWsData({ ...editWsData, description: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditingWs(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdatingWs}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50"
            >
              {isUpdatingWs ? 'Saving...' : 'Update Workspace'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

