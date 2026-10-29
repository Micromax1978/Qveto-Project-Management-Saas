/**
 * projectService.js
 * Dedicated frontend service layer for Project management.
 * Adheres to backend contract and permission matrix:
 * - OWNER & MANAGER can create, edit, view all projects
 * - EMPLOYEE can only view projects they are a member of
 * - Only OWNER can delete projects
 */

import { Storage } from './storage.js';
import { ROLES, Permissions } from '../constants/roles.js';

// Simulated network latency helper
const delay = (ms = 80) => new Promise((resolve) => setTimeout(resolve, ms));

export const projectService = {
  /**
   * List all projects accessible to the current user
   */
  async listProjects(user, search = '') {
    await delay();
    const allProjects = Storage.getProjects();
    const currentUser = user || Storage.getCurrentUser();

    if (!currentUser) {
      throw new Error('Unauthorized: No active session');
    }

    // Role-based visibility
    let accessible = [];
    if (currentUser.role === ROLES.OWNER || currentUser.role === ROLES.MANAGER) {
      accessible = allProjects.filter((p) => p.orgId === currentUser.orgId);
    } else {
      // Employee only sees projects where they are an assigned member
      accessible = allProjects.filter(
        (p) => p.orgId === currentUser.orgId && (p.members || []).includes(currentUser.id)
      );
    }

    // Optional search filter
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      accessible = accessible.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    return accessible;
  },

  /**
   * Get project by ID with membership validation
   */
  async getProjectById(projectId, user) {
    await delay();
    const allProjects = Storage.getProjects();
    const currentUser = user || Storage.getCurrentUser();

    const project = allProjects.find((p) => p.id === projectId);
    if (!project) {
      const error = new Error('Project not found');
      error.status = 404;
      throw error;
    }

    // Cross-tenant check (mask existence with 404)
    if (project.orgId !== currentUser.orgId) {
      const error = new Error('Project not found');
      error.status = 404;
      throw error;
    }

    // Employee membership check
    if (
      currentUser.role === ROLES.EMPLOYEE &&
      !(project.members || []).includes(currentUser.id)
    ) {
      const error = new Error('Forbidden: You are not a member of this project');
      error.status = 403;
      throw error;
    }

    return project;
  },

  /**
   * Create a new project (OWNER and MANAGER only)
   */
  async createProject(projectData, user) {
    await delay(120);
    const currentUser = user || Storage.getCurrentUser();

    if (!Permissions.canCreateProject(currentUser.role)) {
      const error = new Error('Forbidden: Employees cannot create projects');
      error.status = 403;
      throw error;
    }

    if (!projectData.name || !projectData.name.trim()) {
      const error = new Error('Project name is required');
      error.status = 400;
      throw error;
    }

    const trimmedName = projectData.name.trim();
    const allProjects = Storage.getProjects();

    // Check duplicate name within same organization
    const duplicate = allProjects.some(
      (p) =>
        p.orgId === currentUser.orgId &&
        p.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      const error = new Error('A project with this name already exists in your organization');
      error.status = 400;
      throw error;
    }

    const newProject = {
      id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      orgId: currentUser.orgId,
      name: trimmedName,
      description: projectData.description ? projectData.description.trim() : '',
      status: projectData.status || 'ACTIVE',
      createdById: currentUser.id,
      members: Array.from(new Set([currentUser.id, ...(projectData.members || [])])),
      startDate: projectData.startDate || new Date().toISOString().split('T')[0],
      dueDate: projectData.dueDate || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedProjects = [newProject, ...allProjects];
    Storage.setProjects(updatedProjects);

    return newProject;
  },

  /**
   * Update an existing project
   */
  async updateProject(projectId, updates, user) {
    await delay();
    const currentUser = user || Storage.getCurrentUser();

    if (!Permissions.canEditProject(currentUser.role)) {
      const error = new Error('Forbidden: Employees cannot edit project settings');
      error.status = 403;
      throw error;
    }

    const allProjects = Storage.getProjects();
    const index = allProjects.findIndex((p) => p.id === projectId);

    if (index === -1) {
      const error = new Error('Project not found');
      error.status = 404;
      throw error;
    }

    const project = allProjects[index];
    if (project.orgId !== currentUser.orgId) {
      const error = new Error('Project not found');
      error.status = 404;
      throw error;
    }

    if (updates.name !== undefined) {
      if (!updates.name || !updates.name.trim()) {
        const error = new Error('Project name cannot be empty');
        error.status = 400;
        throw error;
      }
      project.name = updates.name.trim();
    }

    if (updates.description !== undefined) {
      project.description = updates.description.trim();
    }

    if (updates.status !== undefined) {
      project.status = updates.status;
    }

    if (updates.startDate !== undefined) {
      project.startDate = updates.startDate;
    }

    if (updates.dueDate !== undefined) {
      project.dueDate = updates.dueDate;
    }

    if (updates.members && Array.isArray(updates.members)) {
      project.members = Array.from(new Set(updates.members));
    }

    project.updatedAt = new Date().toISOString();
    allProjects[index] = { ...project };
    Storage.setProjects(allProjects);

    return project;
  },

  /**
   * Delete a project (OWNER only)
   */
  async deleteProject(projectId, user) {
    await delay();
    const currentUser = user || Storage.getCurrentUser();

    if (!Permissions.canDeleteProject(currentUser.role)) {
      const error = new Error('Forbidden: Only organization owners can delete projects');
      error.status = 403;
      throw error;
    }

    const allProjects = Storage.getProjects();
    const filtered = allProjects.filter((p) => p.id !== projectId);
    Storage.setProjects(filtered);

    // Also delete associated tasks
    const allTasks = Storage.getTasks();
    const remainingTasks = allTasks.filter((t) => t.projectId !== projectId);
    Storage.setTasks(remainingTasks);

    return { success: true };
  },
};
