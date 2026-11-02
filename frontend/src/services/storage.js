/**
 * Persistent Storage Adapter for Taskora Demo / Local State
 * Uses localStorage with fallback to in-memory state.
 */

import {
  INITIAL_ORGANIZATION,
  INITIAL_USERS,
  INITIAL_PROJECTS,
  INITIAL_TASKS,
  INITIAL_COMMENTS,
  INITIAL_ATTACHMENTS,
  INITIAL_ACTIVITIES,
  INITIAL_NOTIFICATIONS,
  INITIAL_TEAMS,
} from './mockData.js';

const STORAGE_KEYS = {
  CURRENT_USER: 'taskora_current_user',
  ORGANIZATION: 'taskora_organization',
  USERS: 'taskora_users',
  TEAMS: 'taskora_teams',
  ACTIVE_WORKSPACE: 'taskora_active_workspace',
  PROJECTS: 'taskora_projects',
  TASKS: 'taskora_tasks',
  COMMENTS: 'taskora_comments',
  ATTACHMENTS: 'taskora_attachments',
  ACTIVITIES: 'taskora_activities',
  NOTIFICATIONS: 'taskora_notifications',
  DATA_INITIALIZED: 'taskora_v3_initialized',
};

function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`[Taskora Storage] Failed to read ${key}:`, e);
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`[Taskora Storage] Failed to write ${key}:`, e);
  }
}

export function initStorage() {
  const initialized = safeGet(STORAGE_KEYS.DATA_INITIALIZED, false);
  if (!initialized) {
    resetStorage();
  } else {
    // Backfill week 3 keys if upgrading
    if (!localStorage.getItem(STORAGE_KEYS.COMMENTS)) {
      safeSet(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ATTACHMENTS)) {
      safeSet(STORAGE_KEYS.ATTACHMENTS, INITIAL_ATTACHMENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) {
      safeSet(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      safeSet(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.TEAMS)) {
      safeSet(STORAGE_KEYS.TEAMS, INITIAL_TEAMS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_WORKSPACE)) {
      safeSet(STORAGE_KEYS.ACTIVE_WORKSPACE, 'ws_eng');
    }
  }
}

export function resetStorage() {
  safeSet(STORAGE_KEYS.ORGANIZATION, INITIAL_ORGANIZATION);
  safeSet(STORAGE_KEYS.USERS, INITIAL_USERS);
  safeSet(STORAGE_KEYS.TEAMS, INITIAL_TEAMS);
  safeSet(STORAGE_KEYS.ACTIVE_WORKSPACE, 'ws_eng');
  safeSet(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  safeSet(STORAGE_KEYS.TASKS, INITIAL_TASKS);
  safeSet(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
  safeSet(STORAGE_KEYS.ATTACHMENTS, INITIAL_ATTACHMENTS);
  safeSet(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
  safeSet(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  // Default active user is Bob Manager (so user has access to create projects/manage tasks out of the box)
  safeSet(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[1]);
  safeSet(STORAGE_KEYS.DATA_INITIALIZED, true);
}

export const Storage = {
  // Current user session
  getCurrentUser: () => safeGet(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[1]),
  setCurrentUser: (user) => safeSet(STORAGE_KEYS.CURRENT_USER, user),

  // Organization
  getOrganization: () => safeGet(STORAGE_KEYS.ORGANIZATION, INITIAL_ORGANIZATION),
  setOrganization: (org) => safeSet(STORAGE_KEYS.ORGANIZATION, org),

  // Users
  getUsers: () => safeGet(STORAGE_KEYS.USERS, INITIAL_USERS),
  setUsers: (users) => safeSet(STORAGE_KEYS.USERS, users),

  // Teams
  getTeams: () => safeGet(STORAGE_KEYS.TEAMS, INITIAL_TEAMS),
  setTeams: (teams) => safeSet(STORAGE_KEYS.TEAMS, teams),

  // Active Workspace
  getActiveWorkspaceId: () => safeGet(STORAGE_KEYS.ACTIVE_WORKSPACE, 'ws_eng'),
  setActiveWorkspaceId: (id) => safeSet(STORAGE_KEYS.ACTIVE_WORKSPACE, id),

  // Projects
  getProjects: () => safeGet(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS),
  setProjects: (projects) => safeSet(STORAGE_KEYS.PROJECTS, projects),

  // Tasks
  getTasks: () => safeGet(STORAGE_KEYS.TASKS, INITIAL_TASKS),
  setTasks: (tasks) => safeSet(STORAGE_KEYS.TASKS, tasks),

  // Comments (Week 3)
  getComments: () => safeGet(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS),
  setComments: (comments) => safeSet(STORAGE_KEYS.COMMENTS, comments),

  // Attachments (Week 3)
  getAttachments: () => safeGet(STORAGE_KEYS.ATTACHMENTS, INITIAL_ATTACHMENTS),
  setAttachments: (attachments) => safeSet(STORAGE_KEYS.ATTACHMENTS, attachments),

  // Activities (Week 3)
  getActivities: () => safeGet(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES),
  setActivities: (activities) => safeSet(STORAGE_KEYS.ACTIVITIES, activities),

  // Notifications (Week 3)
  getNotifications: () => safeGet(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS),
  setNotifications: (notifications) => safeSet(STORAGE_KEYS.NOTIFICATIONS, notifications),
};
