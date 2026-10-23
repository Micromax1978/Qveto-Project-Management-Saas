/**
 * project.service.js
 * Business logic and authorization for Project Management.
 */

const { getDb } = require('../data/mockDb');

class ProjectService {
  /**
   * List projects accessible by the user within their organization
   */
  static listProjects(user) {
    const db = getDb();
    if (!user || !user.orgId) {
      throw { status: 401, message: 'Unauthorized: missing authentication or organization' };
    }

    // Role check:
    // OWNER and MANAGER can view all projects in their organization
    // EMPLOYEE can only view projects where they are explicitly added to the members list
    if (user.role === 'OWNER' || user.role === 'MANAGER') {
      return db.projects.filter(p => p.orgId === user.orgId);
    } else if (user.role === 'EMPLOYEE') {
      return db.projects.filter(p => p.orgId === user.orgId && p.members.includes(user.id));
    }

    return [];
  }

  /**
   * Get a single project by ID with tenant & membership checks
   */
  static getProjectById(projectId, user) {
    const db = getDb();
    if (!user || !user.orgId) {
      throw { status: 401, message: 'Unauthorized' };
    }

    const project = db.projects.find(p => p.id === projectId);
    if (!project) {
      throw { status: 404, message: 'Project not found' };
    }

    // Cross-tenant data isolation check
    if (project.orgId !== user.orgId) {
      throw { status: 404, message: 'Project not found' }; // Mask cross-tenant existence
    }

    // Employee visibility check
    if (user.role === 'EMPLOYEE' && !project.members.includes(user.id)) {
      throw { status: 403, message: 'Forbidden: you are not a member of this project' };
    }

    return project;
  }

  /**
   * Create a new project (OWNER or MANAGER only)
   */
  static createProject(data, user) {
    const db = getDb();
    if (!user || !user.orgId) {
      throw { status: 401, message: 'Unauthorized' };
    }

    // Role permission check: EMPLOYEE cannot create projects
    if (user.role === 'EMPLOYEE') {
      throw { status: 403, message: 'Forbidden: employees cannot create projects' };
    }

    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      throw { status: 400, message: 'Project name is required' };
    }

    const trimmedName = data.name.trim();

    // Check name uniqueness within the organization
    const nameExists = db.projects.some(
      p => p.orgId === user.orgId && p.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (nameExists) {
      throw { status: 400, message: 'A project with this name already exists in your organization' };
    }

    const newProject = {
      id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      orgId: user.orgId,
      name: trimmedName,
      description: data.description ? data.description.trim() : '',
      status: 'ACTIVE',
      createdById: user.id,
      members: Array.from(new Set([user.id, ...(data.members || [])])),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.projects.push(newProject);
    return newProject;
  }

  /**
   * Edit/Update project details (OWNER or MANAGER only)
   */
  static updateProject(projectId, updates, user) {
    const project = this.getProjectById(projectId, user);

    // Permission check: EMPLOYEE cannot edit projects
    if (user.role === 'EMPLOYEE') {
      throw { status: 403, message: 'Forbidden: employees cannot edit project settings' };
    }

    if (updates.name !== undefined) {
      if (typeof updates.name !== 'string' || updates.name.trim() === '') {
        throw { status: 400, message: 'Project name cannot be empty' };
      }
      project.name = updates.name.trim();
    }

    if (updates.description !== undefined) {
      project.description = updates.description.trim();
    }

    if (updates.status !== undefined) {
      const allowed = ['ACTIVE', 'ARCHIVED', 'COMPLETED'];
      if (!allowed.includes(updates.status)) {
        throw { status: 400, message: `Invalid status. Allowed: ${allowed.join(', ')}` };
      }
      project.status = updates.status;
    }

    if (updates.members && Array.isArray(updates.members)) {
      project.members = Array.from(new Set(updates.members));
    }

    project.updatedAt = new Date().toISOString();
    return project;
  }
}

module.exports = ProjectService;
