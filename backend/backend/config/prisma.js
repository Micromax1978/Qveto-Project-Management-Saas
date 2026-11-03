/**
 * Prisma Client Configuration with Resilient In-Memory Mock Fallback
 * Complies with AI Studio Web Migration Guidelines (Phase 2.2).
 * Allows full offline execution without requiring an active PostgreSQL database.
 */

let realPrisma = null;
if (process.env.DATABASE_URL) {
  try {
    const { PrismaClient } = require("@prisma/client");
    realPrisma = new PrismaClient();
  } catch (err) {
    console.warn("[AI Studio] PrismaClient not initialized or offline — using in-memory mock store.");
  }
}

// In-Memory Data Store for Mocking
const mockStore = {
  organizations: [
    {
      id: "org_acme_corp",
      name: "Acme Corporation",
      createdAt: new Date("2026-10-01T09:00:00Z"),
      updatedAt: new Date("2026-10-01T09:00:00Z")
    },
    {
      id: "org_beta_tech",
      name: "Beta Technologies",
      createdAt: new Date("2026-10-01T09:00:00Z"),
      updatedAt: new Date("2026-10-01T09:00:00Z")
    }
  ],
  workspaces: [
    {
      id: "ws_eng",
      name: "Engineering & Product",
      description: "Core web portal, APIs, platform infrastructure, and feature delivery.",
      organizationId: "org_acme_corp",
      createdAt: new Date("2026-10-01T08:00:00Z"),
      updatedAt: new Date("2026-10-01T08:00:00Z")
    },
    {
      id: "ws_mkt",
      name: "Growth & Marketing",
      description: "Acquisition campaigns, landing pages, tracking, and customer communications.",
      organizationId: "org_acme_corp",
      createdAt: new Date("2026-10-01T08:00:00Z"),
      updatedAt: new Date("2026-10-01T08:00:00Z")
    }
  ],
  teams: [
    {
      id: "team_core",
      name: "Core Platform",
      description: "Backend architecture, databases, auth, and cloud infrastructure.",
      organizationId: "org_acme_corp",
      createdAt: new Date("2026-10-01T08:00:00Z"),
      updatedAt: new Date("2026-10-01T08:00:00Z")
    },
    {
      id: "team_qa",
      name: "Quality Engineering",
      description: "End-to-end testing, integration tests, performance audits, and release QA.",
      organizationId: "org_acme_corp",
      createdAt: new Date("2026-10-01T08:00:00Z"),
      updatedAt: new Date("2026-10-01T08:00:00Z")
    }
  ],
  users: [
    {
      id: "user_owner_1",
      name: "Alice Owner",
      email: "alice@acme.com",
      passwordHash: "$2a$10$wT0X2xZJkeM.y7m8R9.6iO7t0vj0/5Qx0m7j5p9s8e4/2l8e6q/2K",
      createdAt: new Date("2026-10-01T09:00:00Z"),
      updatedAt: new Date("2026-10-01T09:00:00Z")
    },
    {
      id: "user_manager_1",
      name: "Bob Manager",
      email: "bob@acme.com",
      passwordHash: "$2a$10$wT0X2xZJkeM.y7m8R9.6iO7t0vj0/5Qx0m7j5p9s8e4/2l8e6q/2K",
      createdAt: new Date("2026-10-01T09:00:00Z"),
      updatedAt: new Date("2026-10-01T09:00:00Z")
    },
    {
      id: "user_employee_1",
      name: "Charlie Dev",
      email: "charlie@acme.com",
      passwordHash: "$2a$10$wT0X2xZJkeM.y7m8R9.6iO7t0vj0/5Qx0m7j5p9s8e4/2l8e6q/2K",
      createdAt: new Date("2026-10-01T09:00:00Z"),
      updatedAt: new Date("2026-10-01T09:00:00Z")
    },
    {
      id: "user_employee_2",
      name: "David QA",
      email: "david@acme.com",
      passwordHash: "$2a$10$wT0X2xZJkeM.y7m8R9.6iO7t0vj0/5Qx0m7j5p9s8e4/2l8e6q/2K",
      createdAt: new Date("2026-10-01T09:00:00Z"),
      updatedAt: new Date("2026-10-01T09:00:00Z")
    },
    {
      id: "user_external_owner",
      name: "Eve Beta Owner",
      email: "eve@beta.com",
      passwordHash: null,
      createdAt: new Date("2026-10-01T09:00:00Z"),
      updatedAt: new Date("2026-10-01T09:00:00Z")
    },
    {
      id: "user_external_emp",
      name: "Frank Beta Dev",
      email: "frank@beta.com",
      passwordHash: null,
      createdAt: new Date("2026-10-01T09:00:00Z"),
      updatedAt: new Date("2026-10-01T09:00:00Z")
    }
  ],
  memberships: [
    { id: "mem_1", organizationId: "org_acme_corp", userId: "user_owner_1", role: "OWNER", createdAt: new Date("2026-10-01T09:00:00Z") },
    { id: "mem_2", organizationId: "org_acme_corp", userId: "user_manager_1", role: "MANAGER", createdAt: new Date("2026-10-01T09:00:00Z") },
    { id: "mem_3", organizationId: "org_acme_corp", userId: "user_employee_1", role: "EMPLOYEE", createdAt: new Date("2026-10-01T09:00:00Z") },
    { id: "mem_4", organizationId: "org_acme_corp", userId: "user_employee_2", role: "EMPLOYEE", createdAt: new Date("2026-10-01T09:00:00Z") },
    { id: "mem_5", organizationId: "org_beta_tech", userId: "user_external_owner", role: "OWNER", createdAt: new Date("2026-10-01T09:00:00Z") },
    { id: "mem_6", organizationId: "org_beta_tech", userId: "user_external_emp", role: "EMPLOYEE", createdAt: new Date("2026-10-01T09:00:00Z") }
  ],
  invitations: [
    { id: "inv_1", code: "MANAGER123", role: "MANAGER", organizationId: "org_acme_corp", used: false, expiresAt: new Date("2030-01-01T00:00:00Z"), createdAt: new Date() },
    { id: "inv_2", code: "EMPLOYEE123", role: "EMPLOYEE", organizationId: "org_acme_corp", used: false, expiresAt: new Date("2030-01-01T00:00:00Z"), createdAt: new Date() }
  ],
  projects: [
    {
      id: "proj_acme_web",
      name: "Acme SaaS Web App",
      description: "Core web portal and collaboration engine",
      status: "ACTIVE",
      organizationId: "org_acme_corp",
      workspaceId: "ws_eng",
      createdById: "user_owner_1",
      createdAt: new Date("2026-10-02T10:00:00Z"),
      updatedAt: new Date("2026-10-02T10:00:00Z")
    },
    {
      id: "proj_acme_mobile",
      name: "Acme Mobile App",
      description: "iOS and Android client development",
      status: "ACTIVE",
      organizationId: "org_acme_corp",
      workspaceId: "ws_eng",
      createdById: "user_manager_1",
      createdAt: new Date("2026-10-05T10:00:00Z"),
      updatedAt: new Date("2026-10-05T10:00:00Z")
    },
    {
      id: "proj_beta_crm",
      name: "Beta CRM Platform",
      description: "Customer relations system for Beta Tech",
      status: "ACTIVE",
      organizationId: "org_beta_tech",
      workspaceId: null,
      createdById: "user_external_owner",
      createdAt: new Date("2026-10-03T11:00:00Z"),
      updatedAt: new Date("2026-10-03T11:00:00Z")
    }
  ],
  tasks: [
    {
      id: "task_1",
      title: "Design database schema and migrations",
      description: "Define relational entities for users, projects, tasks, and audit logs",
      status: "DONE",
      priority: "HIGH",
      orderIndex: 0,
      organizationId: "org_acme_corp",
      projectId: "proj_acme_web",
      assigneeId: "user_employee_1",
      createdById: "user_manager_1",
      dueDate: new Date("2026-10-10T18:00:00Z"),
      createdAt: new Date("2026-10-03T09:00:00Z"),
      updatedAt: new Date("2026-10-09T16:30:00Z")
    },
    {
      id: "task_2",
      title: "Build Kanban Board drag-and-drop UI",
      description: "Interactive columns with accessible keyboard fallback",
      status: "IN_PROGRESS",
      priority: "URGENT",
      orderIndex: 0,
      organizationId: "org_acme_corp",
      projectId: "proj_acme_web",
      assigneeId: "user_employee_1",
      createdById: "user_manager_1",
      dueDate: new Date("2026-10-25T18:00:00Z"),
      createdAt: new Date("2026-10-04T10:00:00Z"),
      updatedAt: new Date("2026-10-04T10:00:00Z")
    },
    {
      id: "task_3",
      title: "Implement Task Filtering and Search",
      description: "Enable searching by keyword, status, priority, and assigned team member",
      status: "TODO",
      priority: "MEDIUM",
      orderIndex: 0,
      organizationId: "org_acme_corp",
      projectId: "proj_acme_web",
      assigneeId: "user_employee_2",
      createdById: "user_owner_1",
      dueDate: new Date("2026-10-28T18:00:00Z"),
      createdAt: new Date("2026-10-05T11:00:00Z"),
      updatedAt: new Date("2026-10-05T11:00:00Z")
    },
    {
      id: "task_4",
      title: "Setup automated security and boundary tests",
      description: "Verify cross-tenant data isolation and role permissions",
      status: "IN_REVIEW",
      priority: "HIGH",
      orderIndex: 0,
      organizationId: "org_acme_corp",
      projectId: "proj_acme_web",
      assigneeId: "user_employee_2",
      createdById: "user_manager_1",
      dueDate: new Date("2026-10-20T18:00:00Z"),
      createdAt: new Date("2026-10-06T12:00:00Z"),
      updatedAt: new Date("2026-10-06T12:00:00Z")
    }
  ],
  projectMembers: [
    { id: "pm_1", projectId: "proj_acme_web", userId: "user_owner_1", role: "OWNER" },
    { id: "pm_2", projectId: "proj_acme_web", userId: "user_manager_1", role: "MANAGER" },
    { id: "pm_3", projectId: "proj_acme_web", userId: "user_employee_1", role: "EMPLOYEE" },
    { id: "pm_4", projectId: "proj_acme_web", userId: "user_employee_2", role: "EMPLOYEE" }
  ],
  comments: [
    {
      id: "comm_1",
      organizationId: "org_acme_corp",
      taskId: "task_2",
      userId: "user_manager_1",
      content: "Ensure responsive drag handle works on touch screens as well.",
      isEdited: false,
      createdAt: new Date("2026-10-06T14:30:00Z"),
      updatedAt: new Date("2026-10-06T14:30:00Z")
    },
    {
      id: "comm_2",
      organizationId: "org_acme_corp",
      taskId: "task_2",
      userId: "user_employee_1",
      content: "Added accessible keyboard controls for column status switching.",
      isEdited: false,
      createdAt: new Date("2026-10-07T09:15:00Z"),
      updatedAt: new Date("2026-10-07T09:15:00Z")
    }
  ],
  attachments: [],
  activities: [
    {
      id: "act_1",
      organizationId: "org_acme_corp",
      taskId: "task_2",
      userId: "user_manager_1",
      type: "TASK_CREATED",
      description: "created task",
      createdAt: new Date("2026-10-04T10:00:00Z")
    },
    {
      id: "act_2",
      organizationId: "org_acme_corp",
      taskId: "task_2",
      userId: "user_employee_1",
      type: "STATUS_CHANGED",
      description: "moved to IN_PROGRESS",
      oldValue: "TODO",
      newValue: "IN_PROGRESS",
      createdAt: new Date("2026-10-05T11:00:00Z")
    }
  ],
  notifications: []
};

function matchesFilter(item, filter) {
  if (!filter || typeof filter !== "object") return true;
  for (const [key, val] of Object.entries(filter)) {
    if (key === "OR" && Array.isArray(val)) {
      const orMatched = val.some((subFilter) => matchesFilter(item, subFilter));
      if (!orMatched) return false;
      continue;
    }
    if (key === "AND" && Array.isArray(val)) {
      const andMatched = val.every((subFilter) => matchesFilter(item, subFilter));
      if (!andMatched) return false;
      continue;
    }
    if (key === "organizationId_userId" && typeof val === "object" && val !== null) {
      if (item.organizationId !== val.organizationId || item.userId !== val.userId) {
        return false;
      }
      continue;
    }
    if (key === "projectId_userId" && typeof val === "object" && val !== null) {
      if (item.projectId !== val.projectId || item.userId !== val.userId) {
        return false;
      }
      continue;
    }
    const itemVal = item[key];
    if (val === null || val === undefined) {
      if (itemVal !== val) return false;
    } else if (typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) {
      if (val.contains !== undefined) {
        const itemStr = String(itemVal || "").toLowerCase();
        const searchStr = String(val.contains).toLowerCase();
        if (!itemStr.includes(searchStr)) return false;
      }
      if (val.equals !== undefined) {
        if (itemVal !== val.equals) return false;
      }
      if (val.in && Array.isArray(val.in)) {
        if (!val.in.includes(itemVal)) return false;
      }
      if (val.notIn && Array.isArray(val.notIn)) {
        if (val.notIn.includes(itemVal)) return false;
      }
      if (val.not !== undefined) {
        if (itemVal === val.not) return false;
      }
      if (val.lt !== undefined) {
        const itemDate = itemVal instanceof Date ? itemVal.getTime() : new Date(itemVal).getTime();
        const compDate = val.lt instanceof Date ? val.lt.getTime() : new Date(val.lt).getTime();
        if (isNaN(itemDate) || itemDate >= compDate) return false;
      }
      if (val.lte !== undefined) {
        const itemDate = itemVal instanceof Date ? itemVal.getTime() : new Date(itemVal).getTime();
        const compDate = val.lte instanceof Date ? val.lte.getTime() : new Date(val.lte).getTime();
        if (isNaN(itemDate) || itemDate > compDate) return false;
      }
      if (val.gt !== undefined) {
        const itemDate = itemVal instanceof Date ? itemVal.getTime() : new Date(itemVal).getTime();
        const compDate = val.gt instanceof Date ? val.gt.getTime() : new Date(val.gt).getTime();
        if (isNaN(itemDate) || itemDate <= compDate) return false;
      }
      if (val.gte !== undefined) {
        const itemDate = itemVal instanceof Date ? itemVal.getTime() : new Date(itemVal).getTime();
        const compDate = val.gte instanceof Date ? val.gte.getTime() : new Date(val.gte).getTime();
        if (isNaN(itemDate) || itemDate < compDate) return false;
      }
      if (val.some && typeof val.some === "object") {
        // e.g. memberships: { some: { organizationId } }
        const related = (mockStore.memberships || []).filter(m => m.userId === item.id);
        const hasSome = related.some(r => matchesFilter(r, val.some));
        if (!hasSome) return false;
      }
    } else {
      if (String(itemVal) !== String(val)) return false;
    }
  }
  return true;
}

function enrichItem(modelName, item, include) {
  if (!item || !include) return item;
  const clone = { ...item };
  if (modelName === "project") {
    if (include.workspace) {
      clone.workspace = mockStore.workspaces.find(w => w.id === item.workspaceId) || null;
    }
    if (include.tasks) {
      clone.tasks = mockStore.tasks
        .filter(t => t.projectId === item.id)
        .map(t => enrichItem("task", t, include.tasks.include || { assignee: true }));
    }
    if (include.members) {
      clone.members = (mockStore.projectMembers || [])
        .filter(pm => pm.projectId === item.id)
        .map(pm => {
          const u = mockStore.users.find(usr => usr.id === pm.userId);
          return { ...pm, user: u };
        });
    }
  } else if (modelName === "task") {
    if (include.assignee) {
      clone.assignee = mockStore.users.find(u => u.id === item.assigneeId) || null;
    }
    if (include.project) {
      clone.project = mockStore.projects.find(p => p.id === item.projectId) || null;
    }
  } else if (modelName === "organization") {
    if (include.workspaces) {
      clone.workspaces = mockStore.workspaces.filter(w => w.organizationId === item.id);
    }
    if (include.teams) {
      clone.teams = mockStore.teams.filter(t => t.organizationId === item.id);
    }
    if (include.projects) {
      clone.projects = mockStore.projects.filter(p => p.organizationId === item.id);
    }
    if (include.memberships) {
      clone.memberships = mockStore.memberships
        .filter(m => m.organizationId === item.id)
        .map(m => {
          const user = mockStore.users.find(u => u.id === m.userId);
          return { ...m, user };
        });
    }
    if (include._count) {
      clone._count = {
        memberships: mockStore.memberships.filter(m => m.organizationId === item.id).length,
        projects: mockStore.projects.filter(p => p.organizationId === item.id).length,
        tasks: mockStore.tasks.filter(t => t.organizationId === item.id).length,
      };
    }
  } else if (modelName === "user") {
    if (include && include.memberships) {
      clone.memberships = mockStore.memberships
        .filter(m => m.userId === item.id)
        .map(m => {
          const org = mockStore.organizations.find(o => o.id === m.organizationId);
          return { ...m, organization: org };
        });
    }
  } else if (modelName === "comment") {
    if (include && include.user) {
      const u = mockStore.users.find(usr => usr.id === item.userId);
      clone.user = u ? { id: u.id, name: u.name, email: u.email, role: "EMPLOYEE" } : null;
    }
  } else if (modelName === "attachment") {
    if (include && include.user) {
      const u = mockStore.users.find(usr => usr.id === item.userId);
      clone.user = u ? { id: u.id, name: u.name, email: u.email } : null;
    }
  } else if (modelName === "activity") {
    if (include && include.user) {
      const u = mockStore.users.find(usr => usr.id === item.userId);
      clone.user = u ? { id: u.id, name: u.name, email: u.email } : null;
    }
  } else if (modelName === "notification") {
    if (include && include.actor) {
      const u = mockStore.users.find(usr => usr.id === item.actorId);
      clone.actor = u ? { id: u.id, name: u.name, email: u.email } : null;
    }
    if (include && include.recipient) {
      const u = mockStore.users.find(usr => usr.id === item.recipientId);
      clone.recipient = u ? { id: u.id, name: u.name, email: u.email } : null;
    }
  }
  return clone;
}

function createModelHandler(modelName, collectionName) {
  return {
    async findMany(args = {}) {
      const collection = mockStore[collectionName] || [];
      let filtered = collection.filter(item => matchesFilter(item, args.where));
      if (args.orderBy) {
        const [sortKey, sortDir] = Object.entries(args.orderBy)[0] || ["createdAt", "desc"];
        filtered = [...filtered].sort((a, b) => {
          const valA = a[sortKey] ? new Date(a[sortKey]).getTime() || a[sortKey] : 0;
          const valB = b[sortKey] ? new Date(b[sortKey]).getTime() || b[sortKey] : 0;
          return String(sortDir).toLowerCase() === "asc" ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
        });
      }
      return filtered.map(item => enrichItem(modelName, item, args.include));
    },
    async findUnique(args = {}) {
      const collection = mockStore[collectionName] || [];
      const found = collection.find(item => matchesFilter(item, args.where));
      return found ? enrichItem(modelName, found, args.include) : null;
    },
    async findFirst(args = {}) {
      const collection = mockStore[collectionName] || [];
      const found = collection.find(item => matchesFilter(item, args.where));
      return found ? enrichItem(modelName, found, args.include) : null;
    },
    async create(args = {}) {
      const collection = mockStore[collectionName] || (mockStore[collectionName] = []);
      const newItem = {
        id: args.data.id || `${modelName}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...args.data
      };
      collection.push(newItem);
      return enrichItem(modelName, newItem, args.include);
    },
    async createMany(args = {}) {
      const collection = mockStore[collectionName] || (mockStore[collectionName] = []);
      const items = (args.data || []).map(d => ({
        id: d.id || `${modelName}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...d
      }));
      collection.push(...items);
      return { count: items.length };
    },
    async update(args = {}) {
      const collection = mockStore[collectionName] || [];
      const index = collection.findIndex(item => matchesFilter(item, args.where));
      if (index === -1) {
        const err = new Error(`Record to update not found.`);
        err.code = "P2025";
        throw err;
      }
      const updated = {
        ...collection[index],
        ...args.data,
        updatedAt: new Date()
      };
      collection[index] = updated;
      return enrichItem(modelName, updated, args.include);
    },
    async updateMany(args = {}) {
      const collection = mockStore[collectionName] || [];
      let updatedCount = 0;
      for (let i = 0; i < collection.length; i++) {
        if (matchesFilter(collection[i], args.where)) {
          collection[i] = { ...collection[i], ...args.data, updatedAt: new Date() };
          updatedCount++;
        }
      }
      return { count: updatedCount };
    },
    async upsert(args = {}) {
      const collection = mockStore[collectionName] || (mockStore[collectionName] = []);
      const index = collection.findIndex(item => matchesFilter(item, args.where));
      if (index !== -1) {
        if (args.update) {
          collection[index] = { ...collection[index], ...args.update, updatedAt: new Date() };
        }
        return enrichItem(modelName, collection[index], args.include);
      }
      const createData = args.create || {};
      const newItem = {
        id: createData.id || `${modelName}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...createData
      };
      collection.push(newItem);
      return enrichItem(modelName, newItem, args.include);
    },
    async delete(args = {}) {
      const collection = mockStore[collectionName] || [];
      const index = collection.findIndex(item => matchesFilter(item, args.where));
      if (index === -1) {
        const err = new Error(`Record to delete not found.`);
        err.code = "P2025";
        throw err;
      }
      const [removed] = collection.splice(index, 1);
      return removed;
    },
    async deleteMany(args = {}) {
      const collection = mockStore[collectionName] || [];
      const initialLen = collection.length;
      mockStore[collectionName] = collection.filter(item => !matchesFilter(item, args.where));
      return { count: initialLen - mockStore[collectionName].length };
    },
    async count(args = {}) {
      const collection = mockStore[collectionName] || [];
      return collection.filter(item => matchesFilter(item, args.where)).length;
    }
  };
}

const mockPrisma = {
  organization: createModelHandler("organization", "organizations"),
  workspace: createModelHandler("workspace", "workspaces"),
  team: createModelHandler("team", "teams"),
  user: createModelHandler("user", "users"),
  membership: createModelHandler("membership", "memberships"),
  invitation: createModelHandler("invitation", "invitations"),
  project: createModelHandler("project", "projects"),
  task: createModelHandler("task", "tasks"),
  projectMember: createModelHandler("projectMember", "projectMembers"),
  comment: createModelHandler("comment", "comments"),
  attachment: createModelHandler("attachment", "attachments"),
  activity: createModelHandler("activity", "activities"),
  notification: createModelHandler("notification", "notifications"),

  async $queryRaw() {
    return [{ "?column?": 1 }];
  },
  async $transaction(callbackOrPromises) {
    if (typeof callbackOrPromises === "function") {
      return callbackOrPromises(mockPrisma);
    }
    if (Array.isArray(callbackOrPromises)) {
      return Promise.all(callbackOrPromises);
    }
    return callbackOrPromises;
  },
  async $disconnect() {
    return Promise.resolve();
  }
};

// Create a safe fallback proxy that routes to real Prisma if available, or mock
const prisma = new Proxy(mockPrisma, {
  get(target, prop) {
    if (realPrisma && prop in realPrisma) {
      const realVal = realPrisma[prop];
      if (typeof realVal === "function") {
        return (...args) => {
          try {
            const res = realVal.apply(realPrisma, args);
            if (res && typeof res.catch === "function") {
              return res.catch((err) => {
                console.warn(`[AI Studio] Real Prisma ${String(prop)} failed, falling back to mock:`, err.message);
                if (target[prop]) {
                  const fallback = target[prop];
                  return typeof fallback === "function" ? fallback(...args) : fallback;
                }
                return null;
              });
            }
            return res;
          } catch (err) {
            console.warn(`[AI Studio] Real Prisma ${String(prop)} threw, falling back to mock:`, err.message);
            if (target[prop]) {
              const fallback = target[prop];
              return typeof fallback === "function" ? fallback(...args) : fallback;
            }
            return null;
          }
        };
      }
      return realVal;
    }
    if (prop in target) {
      return target[prop];
    }
    // Generic fallback for any unlisted model
    return createModelHandler(String(prop), String(prop).toLowerCase() + "s");
  }
});

module.exports = prisma;
