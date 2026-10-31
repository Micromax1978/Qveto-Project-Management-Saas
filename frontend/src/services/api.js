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

// Week 3: Notification API calls
export async function fetchNotifications(params = {}) {
  const query = new URLSearchParams();
  if (params.read !== undefined) query.set('read', params.read);
  if (params.type) query.set('type', params.type);
  if (params.limit) query.set('limit', params.limit);
  if (params.offset) query.set('offset', params.offset);

  const qs = query.toString();
  return request(`/notifications${qs ? `?${qs}` : ''}`);
}

export async function fetchUnreadNotificationCount() {
  return request('/notifications/unread-count');
}

export async function markNotificationAsRead(id) {
  return request(`/notifications/${id}/read`, {
    method: 'PATCH',
  });
}

export async function markAllNotificationsAsRead() {
  return request('/notifications/mark-all-read', {
    method: 'PATCH',
  });
}

// Week 3: Activity & Comment API calls
export async function fetchActivities(params = {}) {
  const query = new URLSearchParams();
  if (params.taskId) query.set('taskId', params.taskId);
  if (params.projectId) query.set('projectId', params.projectId);
  if (params.action) query.set('action', params.action);
  if (params.limit) query.set('limit', params.limit);

  const qs = query.toString();
  return request(`/activities${qs ? `?${qs}` : ''}`);
}

export async function fetchTaskActivities(taskId) {
  return request(`/tasks/${taskId}/activities`);
}

export async function fetchTaskComments(taskId) {
  return request(`/tasks/${taskId}/comments`);
}

export async function addTaskComment(taskId, content) {
  return request(`/tasks/${taskId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

// Week 3: Overdue Detection API calls
export async function checkOverdueTasks(referenceDate) {
  return request('/tasks/check-overdue', {
    method: 'POST',
    body: JSON.stringify(referenceDate ? { referenceDate } : {}),
  });
}

export async function fetchOverdueTasks() {
  return request('/tasks/overdue');
}

export async function fetchSimulatedEmails() {
  return request('/notifications/simulated-emails');
}

