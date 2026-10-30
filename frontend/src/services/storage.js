/**
 * Persistent Storage Adapter for Taskora Demo / Local State
 * Uses localStorage with fallback to in-memory state.
 */

import {
  INITIAL_ORGANIZATION,
  INITIAL_USERS,
  INITIAL_PROJECTS,
  INITIAL_TASKS,
} from './mockData.js';

const STORAGE_KEYS = {
  CURRENT_USER: 'taskora_current_user',
  ORGANIZATION: 'taskora_organization',
  USERS: 'taskora_users',
  PROJECTS: 'taskora_projects',
  TASKS: 'taskora_tasks',
  COMMENTS: 'taskora_comments',
  DATA_INITIALIZED: 'taskora_v2_initialized',
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
  }
}

export function resetStorage() {
  safeSet(STORAGE_KEYS.ORGANIZATION, INITIAL_ORGANIZATION);
  safeSet(STORAGE_KEYS.USERS, INITIAL_USERS);
  safeSet(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  safeSet(STORAGE_KEYS.TASKS, INITIAL_TASKS);
  safeSet(STORAGE_KEYS.COMMENTS, []);
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

  // Users
  getUsers: () => safeGet(STORAGE_KEYS.USERS, INITIAL_USERS),

  // Projects
  getProjects: () => safeGet(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS),
  setProjects: (projects) => safeSet(STORAGE_KEYS.PROJECTS, projects),

  // Tasks
  getTasks: () => safeGet(STORAGE_KEYS.TASKS, INITIAL_TASKS),
  setTasks: (tasks) => safeSet(STORAGE_KEYS.TASKS, tasks),

  // Comments
  getComments: () => safeGet(STORAGE_KEYS.COMMENTS, []),
  setComments: (comments) => safeSet(STORAGE_KEYS.COMMENTS, comments),
};
