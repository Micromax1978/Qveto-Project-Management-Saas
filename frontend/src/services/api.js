/**
 * Qveto SaaS Frontend API Client
 * Connects frontend screens to backend REST API endpoints.
 */

const API_BASE = '/api';

export function getStoredAuth() {
  try {
    const token = localStorage.getItem('token');
    const orgId = localStorage.getItem('organizationId') || '8f2c3d4e-5b6a-7c8d-9e0f-1a2b3c4d5e6f';
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    return { token, organizationId: orgId, user };
  } catch (err) {
    return { token: null, organizationId: '8f2c3d4e-5b6a-7c8d-9e0f-1a2b3c4d5e6f', user: null };
  }
}

export function setStoredAuth({ token, organizationId, user }) {
  if (token) localStorage.setItem('token', token);
  if (organizationId) localStorage.setItem('organizationId', organizationId);
  if (user) localStorage.setItem('user', JSON.stringify(user));
}

async function request(endpoint, options = {}) {
  const { token, organizationId } = getStoredAuth();

  const headers = {
    'Content-Type': 'application/json',
    ...(organizationId ? { 'x-organization-id': organizationId } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = `${API_BASE}${endpoint}`;

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkError) {
    throw {
      status: 0,
      error: 'Network connection error: Unable to reach the backend server.',
    };
  }

  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = {};
  }

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with HTTP ${response.status}`;
    const errObj = new Error(errorMsg);
    errObj.status = response.status;
    errObj.error = errorMsg;
    errObj.data = data;
    throw errObj;
  }

  return data;
}

// Project API calls
export async function fetchProjects(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.workspaceId) query.set('workspaceId', params.workspaceId);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);

  const qs = query.toString();
  return request(`/projects${qs ? `?${qs}` : ''}`);
}

export async function fetchProjectById(id) {
  return request(`/projects/${id}`);
}

export async function createProject(projectData) {
  return request('/projects', {
    method: 'POST',
    body: JSON.stringify(projectData),
  });
}

export async function updateProject(id, projectData) {
  return request(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(projectData),
  });
}

export async function deleteProject(id) {
  return request(`/projects/${id}`, {
    method: 'DELETE',
  });
}

// Task & Kanban API calls
export async function fetchTasks(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  if (params.assigneeId) query.set('assigneeId', params.assigneeId);
  if (params.priority) query.set('priority', params.priority);
  if (params.due) query.set('due', params.due);
  if (params.dueDateFrom) query.set('dueDateFrom', params.dueDateFrom);
  if (params.dueDateTo) query.set('dueDateTo', params.dueDateTo);
  if (params.label) query.set('label', params.label);
  if (params.projectId) query.set('projectId', params.projectId);
  if (params.view) query.set('view', params.view);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);

  const qs = query.toString();
  return request(`/tasks${qs ? `?${qs}` : ''}`);
}

export async function createTask(taskData) {
  return request('/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData),
  });
}

export async function updateTask(id, taskData) {
  return request(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(taskData),
  });
}

export async function updateTaskStatus(id, status) {
  return request(`/tasks/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function deleteTask(id) {
  return request(`/tasks/${id}`, {
    method: 'DELETE',
  });
}

// Comment API calls (Week 3)
export async function fetchTaskComments(taskId) {
  return request(`/tasks/${taskId}/comments`);
}

export async function createTaskComment(taskId, commentData) {
  return request(`/tasks/${taskId}/comments`, {
    method: 'POST',
    body: JSON.stringify(commentData),
  });
}

export async function deleteComment(commentId) {
  return request(`/comments/${commentId}`, {
    method: 'DELETE',
  });
}
