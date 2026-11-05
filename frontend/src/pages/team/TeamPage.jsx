import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Plus,
  Search,
  Filter,
  Shield,
  Building,
  Mail,
  MoreVertical,
  Check,
  Copy,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { teamService } from '../../services/teamService';
import { ROLES, Permissions } from '../../constants/roles';
import Avatar from '../../components/ui/Avatar';
import { RoleBadge } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';

export default function TeamPage() {
  const { currentUser, users, organization, refreshAuth } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('members'); // 'members' | 'teams'
  const [teams, setTeams] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Invite Modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteData, setInviteData] = useState({ name: '', email: '', role: ROLES.EMPLOYEE, teamId: '' });
  const [inviteSuccess, setInviteSuccess] = useState(null);
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);

  // Create Team Modal
  const [createTeamModalOpen, setCreateTeamModalOpen] = useState(false);
  const [newTeamData, setNewTeamData] = useState({ name: '', description: '', leadId: '', members: [] });
  const [isSubmittingTeam, setIsSubmittingTeam] = useState(false);

  const canInvite = Permissions.canInviteMembers(currentUser?.role);
  const canManageTeams = Permissions.canCreateProject(currentUser?.role);
  const isOwner = currentUser?.role === ROLES.OWNER;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const teamList = await teamService.getTeams();
        setTeams(teamList || []);
      } catch (e) {
        console.error('Failed to load teams:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter members
  const filteredUsers = (users || []).filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteData.email || !inviteData.name) {
      showToast?.('Please enter both name and email', 'error');
      return;
    }
    setIsSubmittingInvite(true);
    try {
      const result = await teamService.inviteMember(inviteData);
      setInviteSuccess(result);
      refreshAuth();
      const updatedTeams = await teamService.getTeams();
      setTeams(updatedTeams);
      showToast?.(`Invitation created for ${inviteData.email}`, 'success');
    } catch (err) {
      showToast?.(err.message || 'Failed to send invite', 'error');
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const handleCreateTeamSubmit = async (e) => {
    e.preventDefault();
    if (!newTeamData.name.trim()) {
      showToast?.('Please provide a team name', 'error');
      return;
    }
    setIsSubmittingTeam(true);
    try {
      await teamService.createTeam(newTeamData);
      const updatedTeams = await teamService.getTeams();
      setTeams(updatedTeams);
      setCreateTeamModalOpen(false);
      setNewTeamData({ name: '', description: '', leadId: '', members: [] });
      showToast?.('Team created successfully', 'success');
    } catch (err) {
      showToast?.(err.message || 'Failed to create team', 'error');
    } finally {
      setIsSubmittingTeam(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await teamService.updateUserRole(userId, newRole, currentUser?.role);
      refreshAuth();
      showToast?.('Member role updated', 'success');
    } catch (err) {
      showToast?.(err.message || 'Failed to update role', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
            <Users className="w-4 h-4" />
            <span>Organization Directory</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">{users.length} Active Members</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Teams & Members
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage organization members, departments, roles, and invitation access.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {canManageTeams && (
            <button
              type="button"
              onClick={() => setCreateTeamModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Team</span>
            </button>
          )}

          {canInvite && (
            <button
              type="button"
              onClick={() => {
                setInviteSuccess(null);
                setInviteData({ name: '', email: '', role: ROLES.EMPLOYEE, teamId: '' });
                setInviteModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'members'
              ? 'bg-blue-50 text-blue-700'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Members Directory ({users.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('teams')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'teams'
              ? 'bg-blue-50 text-blue-700'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Teams & Departments ({teams.length})
        </button>
      </div>

      {/* Tab 1: Members Directory */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-500 whitespace-nowrap">Filter Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Roles</option>
                <option value="OWNER">Owner</option>
                <option value="MANAGER">Manager</option>
                <option value="EMPLOYEE">Employee</option>
              </select>
            </div>
          </div>

          {/* Members Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Title / Department</th>
                  <th className="py-3 px-4">Organization</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredUsers.map((user) => {
                  const isCurrent = user.id === currentUser?.id;
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar user={user} size="md" showTooltip={false} />
                          <div>
                            <p className="font-bold text-slate-900 flex items-center gap-2">
                              <span>{user.name}</span>
                              {isCurrent && (
                                <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-1.5 py-0.2 rounded">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {user.title || 'Team Member'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {organization?.name || 'Acme Corporation'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isOwner && !isCurrent ? (
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                            aria-label={`Change role for ${user.name}`}
                          >
                            <option value="EMPLOYEE">Employee</option>
                            <option value="MANAGER">Manager</option>
                            <option value="OWNER">Owner</option>
                          </select>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            {isCurrent ? 'Current Session' : 'Protected'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-xs text-slate-500">No members match your search criteria.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Teams & Departments */}
      {activeTab === 'teams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => {
            const lead = users.find((u) => u.id === team.leadId);
            const memberCount = (team.members || []).length;

            return (
              <div
                key={team.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">
                      Department
                    </span>
                    <span className="text-xs text-slate-400">{memberCount} members</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1">{team.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">{team.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {lead ? (
                      <>
                        <Avatar user={lead} size="xs" showTooltip={false} />
                        <span className="text-xs text-slate-600">Lead: <strong>{lead.name}</strong></span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">No designated lead</span>
                    )}
                  </div>

                  {/* Team Members Stack */}
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {(team.members || []).slice(0, 3).map((mid) => {
                      const u = users.find((usr) => usr.id === mid);
                      return u ? <Avatar key={u.id} user={u} size="xs" /> : null;
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invite Member Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite New Colleague"
      >
        {inviteSuccess ? (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
              <p className="font-bold mb-1">Invitation link created successfully!</p>
              <p>Share this invitation link with the new team member to onboard them:</p>
            </div>

            <div className="flex items-center gap-2 p-2.5 bg-slate-100 rounded-xl border border-slate-200">
              <input
                type="text"
                readOnly
                value={inviteSuccess.invitationUrl}
                className="w-full bg-transparent text-xs text-slate-700 select-all outline-hidden font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(inviteSuccess.invitationUrl);
                  showToast?.('Link copied to clipboard', 'info');
                }}
                className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                title="Copy Link"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setInviteSuccess(null);
                setInviteModalOpen(false);
              }}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleInviteSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g., Alex Johnson"
                value={inviteData.name}
                onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="alex@company.com"
                value={inviteData.email}
                onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Role Assignment</label>
                <select
                  value={inviteData.role}
                  onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value={ROLES.EMPLOYEE}>Employee</option>
                  <option value={ROLES.MANAGER}>Manager</option>
                  {isOwner && <option value={ROLES.OWNER}>Owner</option>}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assign to Team</label>
                <select
                  value={inviteData.teamId}
                  onChange={(e) => setInviteData({ ...inviteData, teamId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None (Unassigned)</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingInvite}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {isSubmittingInvite ? 'Generating Invite...' : 'Create Invitation'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Create Team Modal */}
      <Modal
        isOpen={createTeamModalOpen}
        onClose={() => setCreateTeamModalOpen(false)}
        title="Create Department or Team"
      >
        <form onSubmit={handleCreateTeamSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Team Name</label>
            <input
              type="text"
              required
              placeholder="e.g., Growth Marketing, DevOps..."
              value={newTeamData.name}
              onChange={(e) => setNewTeamData({ ...newTeamData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Primary team mission, areas of responsibility..."
              value={newTeamData.description}
              onChange={(e) => setNewTeamData({ ...newTeamData, description: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Designated Team Lead</label>
            <select
              value={newTeamData.leadId}
              onChange={(e) => setNewTeamData({ ...newTeamData, leadId: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Team Lead (Optional)</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateTeamModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingTeam}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50"
            >
              {isSubmittingTeam ? 'Creating Team...' : 'Create Team'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

