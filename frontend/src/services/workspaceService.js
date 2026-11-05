/**
 * Workspace Service
 * Manages organization workspace hierarchies, creation, active selection, and editing.
 */

import { Storage } from './storage.js';

export const workspaceService = {
  /**
   * List all workspaces for the active organization
   */
  async getWorkspaces() {
    const org = Storage.getOrganization();
    return org?.workspaces || [];
  },

  /**
   * Get active workspace
   */
  async getActiveWorkspace() {
    const org = Storage.getOrganization();
    const activeId = Storage.getActiveWorkspaceId();
    const ws = org?.workspaces?.find((w) => w.id === activeId) || org?.workspaces?.[0];
    return ws || null;
  },

  /**
   * Set active workspace ID
   */
  async setActiveWorkspace(workspaceId) {
    const org = Storage.getOrganization();
    const exists = org?.workspaces?.some((w) => w.id === workspaceId);
    if (!exists) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }
    Storage.setActiveWorkspaceId(workspaceId);
    return workspaceId;
  },

  /**
   * Create a new workspace
   */
  async createWorkspace({ name, description = '' }) {
    if (!name || !name.trim()) {
      throw new Error('Workspace name is required');
    }
    const org = Storage.getOrganization();
    const workspaces = org?.workspaces || [];

    // Check duplicate name
    if (workspaces.some((w) => w.name.toLowerCase() === name.trim().toLowerCase())) {
      throw new Error(`Workspace "${name.trim()}" already exists`);
    }

    const id = `ws_${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now().toString(36)}`;
    const newWs = {
      id,
      name: name.trim(),
      description: description.trim(),
      isDefault: workspaces.length === 0,
      createdAt: new Date().toISOString(),
    };

    const updatedWorkspaces = [...workspaces, newWs];
    const updatedOrg = { ...org, workspaces: updatedWorkspaces };
    Storage.setOrganization(updatedOrg);

    return newWs;
  },

  /**
   * Update an existing workspace
   */
  async updateWorkspace(workspaceId, updates) {
    const org = Storage.getOrganization();
    const workspaces = org?.workspaces || [];
    const index = workspaces.findIndex((w) => w.id === workspaceId);

    if (index === -1) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }

    const updatedWs = {
      ...workspaces[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const updatedWorkspaces = [...workspaces];
    updatedWorkspaces[index] = updatedWs;

    const updatedOrg = { ...org, workspaces: updatedWorkspaces };
    Storage.setOrganization(updatedOrg);

    return updatedWs;
  },

  /**
   * Delete a workspace (cannot delete if it's the only one or default)
   */
  async deleteWorkspace(workspaceId) {
    const org = Storage.getOrganization();
    const workspaces = org?.workspaces || [];

    if (workspaces.length <= 1) {
      throw new Error('Cannot delete the sole remaining workspace in the organization.');
    }

    const target = workspaces.find((w) => w.id === workspaceId);
    if (target?.isDefault) {
      throw new Error('Cannot delete the default organization workspace.');
    }

    const updatedWorkspaces = workspaces.filter((w) => w.id !== workspaceId);
    const updatedOrg = { ...org, workspaces: updatedWorkspaces };
    Storage.setOrganization(updatedOrg);

    // If active workspace was deleted, fall back to first
    if (Storage.getActiveWorkspaceId() === workspaceId) {
      Storage.setActiveWorkspaceId(updatedWorkspaces[0].id);
    }

    return { success: true };
  },
};
