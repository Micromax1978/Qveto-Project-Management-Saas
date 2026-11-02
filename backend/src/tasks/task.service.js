/**
 * task.service.js
 * Business logic, validation, Kanban stage handling, filtering, and comments for Tasks.
 */

const { getDb } = require('../data/mockDb');

const VALID_STATUSES = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

class TaskService {
  /**
   * Helper to sanitize text strings (XSS prevention)
   */
  static sanitizeText(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  /**
   * Calculate subtask progress percentage safely avoiding division by zero
   */
  static calculateSubtaskProgress(subtasks) {
    if (!subtasks || !Array.isArray(subtasks) || subtasks.length === 0) {
      return 0;
    }
    const completed = subtasks.filter(s => s.isCompleted).length;
    return Math.round((completed / subtasks.length) * 100);
  }

  /**
   * Get tasks with search, filter, and tenant isolation
   */
  static listTasks(projectId, filters = {}, user) {
    const db = getDb();
    if (!user || !user.orgId) {
      throw { status: 401, message: 'Unauthorized' };
    }

    // Verify project belongs to user's org
    const project = db.projects.find(p => p.id === projectId && p.orgId === user.orgId);
    if (!project) {
      throw { status: 404, message: 'Project not found' };
    }

    // Tenant-isolated task query
    let tasks = db.tasks.filter(t => t.projectId === projectId && t.orgId === user.orgId);

    // Filter by status
    if (filters.status) {
      const statusUpper = filters.status.toUpperCase();
      tasks = tasks.filter(t => t.status === statusUpper);
    }

    // Filter by priority
    if (filters.priority) {
      const priorityUpper = filters.priority.toUpperCase();
      tasks = tasks.filter(t => t.priority === priorityUpper);
    }

    // Filter by assignee
    if (filters.assigneeId) {
      tasks = tasks.filter(t => t.assigneeId === filters.assigneeId);
    }

    // Filter by label/tag
    if (filters.label) {
      const labelLower = filters.label.toLowerCase();
      tasks = tasks.filter(t => t.labels && t.labels.some(l => l.toLowerCase() === labelLower));
    }

    // Search query in title or description
    if (filters.search && typeof filters.search === 'string' && filters.search.trim() !== '') {
      const query = filters.search.trim().toLowerCase();
      tasks = tasks.filter(t =>
        (t.title && t.title.toLowerCase().includes(query)) ||
        (t.description && t.description.toLowerCase().includes(query))
      );
    }

    // Sort by orderIndex ascending
    tasks.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

    return tasks.map(t => ({
      ...t,
      subtaskProgress: this.calculateSubtaskProgress(t.subtasks)
    }));
  }

  /**
   * Get single task with tenant verification
   */
  static getTaskById(taskId, user) {
    const db = getDb();
    if (!user || !user.orgId) {
      throw { status: 401, message: 'Unauthorized' };
    }

    const task = db.tasks.find(t => t.id === taskId);
    if (!task) {
      throw { status: 404, message: 'Task not found' };
    }

    // STRICT Multi-tenant boundary check
    if (task.orgId !== user.orgId) {
      throw { status: 404, message: 'Task not found' }; // Mask existence from other tenants
    }

    return {
      ...task,
      subtaskProgress: this.calculateSubtaskProgress(task.subtasks)
    };
  }

  /**
   * Create task with validations: Day 2 (assignment, priority, due date, subtasks, labels)
   */
  static createTask(data, user) {
    const db = getDb();
    if (!user || !user.orgId) {
      throw { status: 401, message: 'Unauthorized' };
    }

    // Validate project existence and tenant
    const project = db.projects.find(p => p.id === data.projectId && p.orgId === user.orgId);
    if (!project) {
      throw { status: 404, message: 'Project not found in your organization' };
    }

    // Validate title (empty check)
    if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
      throw { status: 400, message: 'Task title is required' };
    }

    // Priority validation
    let priority = (data.priority || 'MEDIUM').toUpperCase();
    if (!VALID_PRIORITIES.includes(priority)) {
      throw { status: 400, message: `Invalid priority. Allowed: ${VALID_PRIORITIES.join(', ')}` };
    }

    // Assignee validation
    if (data.assigneeId) {
      const assignee = db.users.find(u => u.id === data.assigneeId && u.orgId === user.orgId);
      if (!assignee) {
        throw { status: 400, message: 'Assignee does not belong to your organization' };
      }
      if (!project.members.includes(data.assigneeId)) {
        throw { status: 400, message: 'Assignee is not a member of this project' };
      }
    }

    // Due date validation
    let dueDate = null;
    if (data.dueDate) {
      const parsedDate = new Date(data.dueDate);
      if (isNaN(parsedDate.getTime())) {
        throw { status: 400, message: 'Invalid due date format. Expected valid ISO date string' };
      }
      dueDate = parsedDate.toISOString();
    }

    // Subtasks formatting
    let subtasks = [];
    if (Array.isArray(data.subtasks)) {
      subtasks = data.subtasks.map((s, idx) => ({
        id: s.id || `sub_${Date.now()}_${idx}`,
        title: this.sanitizeText(s.title || `Subtask ${idx + 1}`),
        isCompleted: Boolean(s.isCompleted)
      }));
    }

    // Labels formatting
    let labels = [];
    if (Array.isArray(data.labels)) {
      labels = data.labels
        .filter(l => typeof l === 'string' && l.trim() !== '')
        .map(l => l.trim().toLowerCase());
    }

    // Calculate next order index in column
    const existingInCol = db.tasks.filter(
      t => t.projectId === data.projectId && t.status === (data.status || 'TODO')
    );
    const orderIndex = existingInCol.length;

    const newTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      orgId: user.orgId,
      projectId: data.projectId,
      title: this.sanitizeText(data.title.trim()),
      description: data.description ? this.sanitizeText(data.description.trim()) : '',
      status: (data.status || 'TODO').toUpperCase(),
      priority,
      orderIndex,
      assigneeId: data.assigneeId || null,
      createdById: user.id,
      dueDate,
      labels,
      subtasks,
      createdAt: new Date().toISOString(),
      completedAt: (data.status === 'DONE') ? new Date().toISOString() : null
    };

    db.tasks.push(newTask);
    return {
      ...newTask,
      subtaskProgress: this.calculateSubtaskProgress(newTask.subtasks)
    };
  }

  /**
   * Update task fields (assignment, priority, dates, subtasks, labels)
   */
  static updateTask(taskId, updates, user) {
    const db = getDb();
    const task = db.tasks.find(t => t.id === taskId);
    if (!task) {
      throw { status: 404, message: 'Task not found' };
    }
    if (task.orgId !== user.orgId) {
      throw { status: 404, message: 'Task not found' };
    }

    if (updates.title !== undefined) {
      if (typeof updates.title !== 'string' || updates.title.trim() === '') {
        throw { status: 400, message: 'Task title cannot be empty' };
      }
      task.title = this.sanitizeText(updates.title.trim());
    }

    if (updates.description !== undefined) {
      task.description = this.sanitizeText(updates.description.trim());
    }

    if (updates.priority !== undefined) {
      const p = updates.priority.toUpperCase();
      if (!VALID_PRIORITIES.includes(p)) {
        throw { status: 400, message: `Invalid priority. Allowed: ${VALID_PRIORITIES.join(', ')}` };
      }
      task.priority = p;
    }

    if (updates.assigneeId !== undefined) {
      if (updates.assigneeId !== null) {
        const assignee = db.users.find(u => u.id === updates.assigneeId && u.orgId === user.orgId);
        if (!assignee) {
          throw { status: 400, message: 'Assignee does not belong to your organization' };
        }
      }
      task.assigneeId = updates.assigneeId;
    }

    if (updates.dueDate !== undefined) {
      if (updates.dueDate !== null) {
        const parsed = new Date(updates.dueDate);
        if (isNaN(parsed.getTime())) {
          throw { status: 400, message: 'Invalid due date format' };
        }
        task.dueDate = parsed.toISOString();
      } else {
        task.dueDate = null;
      }
    }

    if (updates.labels !== undefined && Array.isArray(updates.labels)) {
      task.labels = updates.labels
        .filter(l => typeof l === 'string' && l.trim() !== '')
        .map(l => l.trim().toLowerCase());
    }

    if (updates.subtasks !== undefined && Array.isArray(updates.subtasks)) {
      task.subtasks = updates.subtasks.map((s, idx) => ({
        id: s.id || `sub_${Date.now()}_${idx}`,
        title: this.sanitizeText(s.title || `Subtask ${idx + 1}`),
        isCompleted: Boolean(s.isCompleted)
      }));
    }

    return {
      ...task,
      subtaskProgress: this.calculateSubtaskProgress(task.subtasks)
    };
  }

  /**
   * Day 3 Kanban: Drag & drop move or accessible alternative status transition
   */
  static updateKanbanStatus(taskId, { targetStatus, newOrderIndex }, user) {
    const db = getDb();
    const task = db.tasks.find(t => t.id === taskId);
    if (!task) {
      throw { status: 404, message: 'Task not found' };
    }
    if (task.orgId !== user.orgId) {
      throw { status: 404, message: 'Task not found' };
    }

    const statusUpper = targetStatus.toUpperCase();
    if (!VALID_STATUSES.includes(statusUpper)) {
      throw { status: 400, message: `Invalid Kanban status. Allowed: ${VALID_STATUSES.join(', ')}` };
    }

    const prevStatus = task.status;
    task.status = statusUpper;

    // Timestamp handling for DONE
    if (statusUpper === 'DONE' && prevStatus !== 'DONE') {
      task.completedAt = new Date().toISOString();
    } else if (statusUpper !== 'DONE') {
      task.completedAt = null;
    }

    if (newOrderIndex !== undefined && typeof newOrderIndex === 'number') {
      task.orderIndex = Math.max(0, Math.floor(newOrderIndex));
    }

    return {
      ...task,
      subtaskProgress: this.calculateSubtaskProgress(task.subtasks)
    };
  }

  /**
   * Accessible keyboard navigation alternative control for Kanban
   * Steps: forward (TODO -> IN_PROGRESS -> REVIEW -> DONE) or backward
   */
  static moveKanbanAccessible(taskId, direction, user) {
    const task = this.getTaskById(taskId, user);
    const currentIndex = VALID_STATUSES.indexOf(task.status);
    let nextIndex = currentIndex;

    if (direction === 'NEXT' && currentIndex < VALID_STATUSES.length - 1) {
      nextIndex = currentIndex + 1;
    } else if (direction === 'PREV' && currentIndex > 0) {
      nextIndex = currentIndex - 1;
    } else {
      throw { status: 400, message: `Cannot move task ${direction} from stage ${task.status}` };
    }

    return this.updateKanbanStatus(taskId, { targetStatus: VALID_STATUSES[nextIndex] }, user);
  }

  /**
   * Week 3: Retrieve comments belonging to a task in oldest-first order
   */
  static listComments(taskId, user) {
    const db = getDb();
    if (!user || !user.orgId) {
      throw { status: 401, message: 'Unauthorized' };
    }

    const task = db.tasks.find(t => t.id === taskId);
    if (!task || task.orgId !== user.orgId) {
      throw { status: 404, message: 'Task not found' };
    }

    const comments = (db.comments || [])
      .filter(c => c.taskId === taskId && (c.orgId === user.orgId || c.organizationId === user.orgId))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map(c => {
        const author = db.users.find(u => u.id === c.authorId) || {
          id: c.authorId,
          name: 'User',
          email: 'user@example.com'
        };
        return {
          id: c.id,
          taskId: c.taskId,
          authorId: c.authorId,
          organizationId: c.organizationId || c.orgId,
          text: c.text,
          createdAt: c.createdAt,
          author: {
            id: author.id,
            name: author.name,
            email: author.email
          }
        };
      });

    return comments;
  }

  /**
   * Week 3: Create comment on a task with validation and activity recording
   */
  static createComment(taskId, payload, user) {
    const db = getDb();
    if (!user || !user.orgId) {
      throw { status: 401, message: 'Unauthorized' };
    }

    const task = db.tasks.find(t => t.id === taskId);
    if (!task || task.orgId !== user.orgId) {
      throw { status: 404, message: 'Task not found' };
    }

    if (!payload || !payload.text || typeof payload.text !== 'string' || payload.text.trim() === '') {
      throw { status: 400, message: 'Comment text cannot be empty' };
    }

    if (payload.text.length > 5000) {
      throw { status: 400, message: 'Comment text exceeds maximum allowed length of 5000 characters' };
    }

    const newComment = {
      id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      taskId,
      authorId: user.id,
      orgId: user.orgId,
      organizationId: user.orgId,
      text: this.sanitizeText(payload.text.trim()),
      createdAt: new Date().toISOString()
    };

    if (!db.comments) db.comments = [];
    db.comments.push(newComment);

    if (db.auditLogs) {
      db.auditLogs.push({
        id: `audit_${Date.now()}`,
        action: 'COMMENT_CREATED',
        entityId: newComment.id,
        taskId,
        orgId: user.orgId,
        actorId: user.id,
        timestamp: newComment.createdAt
      });
    }

    const author = db.users.find(u => u.id === user.id) || {
      id: user.id,
      name: user.name || 'User',
      email: user.email || 'user@example.com'
    };

    return {
      ...newComment,
      author: {
        id: author.id,
        name: author.name,
        email: author.email
      }
    };
  }
}

module.exports = {
  TaskService,
  VALID_STATUSES,
  VALID_PRIORITIES
};
