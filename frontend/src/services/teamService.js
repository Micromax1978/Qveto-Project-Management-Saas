/**
 * Team & Directory Service
 * Manages organization departments, teams, team assignments, and member invitations.
 */

import { Storage } from './storage.js';
import { ROLES } from '../constants/roles.js';

export const teamService = {
  /**
   * List all teams in the organization
   */
  async getTeams() {
    return Storage.getTeams();
  },

  /**
   * Get team by ID
   */
  async getTeamById(teamId) {
    const teams = Storage.getTeams();
    return teams.find((t) => t.id === teamId) || null;
  },

  /**
   * Create a new team/department
   */
  async createTeam({ name, description = '', leadId = null, members = [] }) {
    if (!name || !name.trim()) {
      throw new Error('Team name is required');
    }
    const teams = Storage.getTeams();
    if (teams.some((t) => t.name.toLowerCase() === name.trim().toLowerCase())) {
      throw new Error(`Team "${name.trim()}" already exists`);
    }

    const id = `team_${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now().toString(36)}`;
    const newTeam = {
      id,
      orgId: Storage.getOrganization()?.id || 'org_acme_corp',
      name: name.trim(),
      description: description.trim(),
      leadId,
      members: Array.from(new Set(members)),
      createdAt: new Date().toISOString(),
    };

    const updated = [...teams, newTeam];
    Storage.setTeams(updated);
    return newTeam;
  },

  /**
   * Update an existing team
   */
  async updateTeam(teamId, updates) {
    const teams = Storage.getTeams();
    const index = teams.findIndex((t) => t.id === teamId);
    if (index === -1) {
      throw new Error(`Team ${teamId} not found`);
    }

    const updatedTeam = {
      ...teams[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const updated = [...teams];
    updated[index] = updatedTeam;
    Storage.setTeams(updated);
    return updatedTeam;
  },

  /**
   * Delete a team
   */
  async deleteTeam(teamId) {
    const teams = Storage.getTeams();
    const filtered = teams.filter((t) => t.id !== teamId);
    Storage.setTeams(filtered);
    return { success: true };
  },

  /**
   * Add a member to a team
   */
  async addMemberToTeam(teamId, userId) {
    const teams = Storage.getTeams();
    const team = teams.find((t) => t.id === teamId);
    if (!team) throw new Error('Team not found');

    if (!team.members.includes(userId)) {
      const updatedMembers = [...team.members, userId];
      return this.updateTeam(teamId, { members: updatedMembers });
    }
    return team;
  },

  /**
   * Remove member from a team
   */
  async removeMemberFromTeam(teamId, userId) {
    const teams = Storage.getTeams();
    const team = teams.find((t) => t.id === teamId);
    if (!team) throw new Error('Team not found');

    const updatedMembers = team.members.filter((id) => id !== userId);
    return this.updateTeam(teamId, { members: updatedMembers });
  },

  /**
   * Invite a new member to the organization
   */
  async inviteMember({ email, name, role = ROLES.EMPLOYEE, teamId = null }) {
    if (!email || !email.trim()) {
      throw new Error('Email is required');
    }
    if (!name || !name.trim()) {
      throw new Error('Name is required');
    }

    const users = Storage.getUsers();
    if (users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
      throw new Error(`User with email "${email.trim()}" is already registered in this organization`);
    }

    const newUser = {
      id: `user_${Date.now().toString(36)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role.toUpperCase(),
      orgId: Storage.getOrganization()?.id || 'org_acme_corp',
      avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?w=150&auto=format&fit=crop&q=80`,
      title: role === ROLES.MANAGER ? 'Engineering Lead' : (role === ROLES.OWNER ? 'Executive Lead' : 'Software Specialist'),
      status: 'INVITED',
      invitedAt: new Date().toISOString(),
    };

    const updatedUsers = [...users, newUser];
    Storage.setUsers(updatedUsers);

    // If a teamId was provided, attach user to that team
    if (teamId) {
      await this.addMemberToTeam(teamId, newUser.id);
    }

    // Generate simulated invitation code
    const invitationToken = `inv_${Math.random().toString(36).substring(2, 10)}`;

    const baseUrl = typeof window !== 'undefined' && window?.location?.origin
      ? window.location.origin
      : 'https://taskora.app';

    return {
      user: newUser,
      invitationToken,
      invitationUrl: `${baseUrl}/signup?invite=${invitationToken}&role=${role.toLowerCase()}`,
    };
  },

  /**
   * Update a user's role (enforcing that actor must be OWNER)
   */
  async updateUserRole(userId, newRole, actorRole) {
    if (actorRole !== ROLES.OWNER) {
      const err = new Error('Only the Organization Owner can modify member roles.');
      err.status = 403;
      throw err;
    }

    const users = Storage.getUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) {
      throw new Error('User not found');
    }

    const updatedUser = { ...users[index], role: newRole };
    const updatedUsers = [...users];
    updatedUsers[index] = updatedUser;
    Storage.setUsers(updatedUsers);

    // If current session user is updated, update storage too
    const current = Storage.getCurrentUser();
    if (current && current.id === userId) {
      Storage.setCurrentUser(updatedUser);
    }

    return updatedUser;
  },
};
