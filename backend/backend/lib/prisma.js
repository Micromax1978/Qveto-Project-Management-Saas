// backend/lib/prisma.js
// Universal Prisma client with in-memory fallback for Qveto SaaS (Week 2)
const bcrypt = require("bcryptjs");

function createInitialStore() {
    const defaultPasswordHash = bcrypt.hashSync("Password123!", 10);

    const org1 = {
        id: "org_test_123",
        name: "Qveto Test Organization",
        createdAt: new Date("2026-10-01T08:00:00Z"),
        updatedAt: new Date("2026-10-01T08:00:00Z"),
    };

    const userOwner = {
        id: "user_owner_1",
        name: "Alice Owner",
        email: "owner@qveto.com",
        passwordHash: defaultPasswordHash,
        createdAt: new Date("2026-10-01T08:00:00Z"),
        updatedAt: new Date("2026-10-01T08:00:00Z"),
    };

    const userManager = {
        id: "user_mgr_1",
        name: "Bob Manager",
        email: "manager@qveto.com",
        passwordHash: defaultPasswordHash,
        createdAt: new Date("2026-10-01T08:00:00Z"),
        updatedAt: new Date("2026-10-01T08:00:00Z"),
    };

    const userEmployee = {
        id: "user_emp_1",
        name: "Charlie Dev",
        email: "employee@qveto.com",
        passwordHash: defaultPasswordHash,
        createdAt: new Date("2026-10-01T08:00:00Z"),
        updatedAt: new Date("2026-10-01T08:00:00Z"),
    };

    const memberships = [
        { id: "mem_1", organizationId: "org_test_123", userId: "user_owner_1", role: "owner", createdAt: new Date() },
        { id: "mem_2", organizationId: "org_test_123", userId: "user_mgr_1", role: "manager", createdAt: new Date() },
        { id: "mem_3", organizationId: "org_test_123", userId: "user_emp_1", role: "employee", createdAt: new Date() },
    ];

    const invitations = [
        {
            id: "inv_1",
            code: "MANAGER123",
            organizationId: "org_test_123",
            role: "manager",
            used: false,
            createdAt: new Date(),
            expiresAt: null
        },
        {
            id: "inv_2",
            code: "EMPLOYEE123",
            organizationId: "org_test_123",
            role: "employee",
            used: false,
            createdAt: new Date(),
            expiresAt: null
        }
    ];

    const workspaces = [
        { id: "ws_default_1", organizationId: "org_test_123", name: "Engineering & Product Workspace" }
    ];

    const projects = [
        {
            id: "proj_core_1",
            organizationId: "org_test_123",
            workspaceId: "ws_default_1",
            name: "Qveto Core SaaS",
            description: "Multi-tenant project management platform and team collaboration engine",
            createdAt: new Date("2026-10-05T09:00:00Z"),
            updatedAt: new Date("2026-10-05T09:00:00Z"),
        },
        {
            id: "proj_mobile_1",
            organizationId: "org_test_123",
            workspaceId: "ws_default_1",
            name: "Mobile Client App",
            description: "Cross-platform mobile companion app for task tracking",
            createdAt: new Date("2026-10-10T09:00:00Z"),
            updatedAt: new Date("2026-10-10T09:00:00Z"),
        }
    ];

    const projectMembers = [
        { id: "pm_1", projectId: "proj_core_1", userId: "user_owner_1", createdAt: new Date("2026-10-05T09:00:00Z") },
        { id: "pm_2", projectId: "proj_core_1", userId: "user_mgr_1", createdAt: new Date("2026-10-05T09:00:00Z") },
        { id: "pm_3", projectId: "proj_core_1", userId: "user_emp_1", createdAt: new Date("2026-10-05T09:00:00Z") },
        { id: "pm_4", projectId: "proj_mobile_1", userId: "user_owner_1", createdAt: new Date("2026-10-10T09:00:00Z") },
        { id: "pm_5", projectId: "proj_mobile_1", userId: "user_mgr_1", createdAt: new Date("2026-10-10T09:00:00Z") },
    ];

    const labels = [
        { id: "lbl_1", name: "frontend" },
        { id: "lbl_2", name: "backend" },
        { id: "lbl_3", name: "ui/ux" },
        { id: "lbl_4", name: "database" },
        { id: "lbl_5", name: "architecture" },
    ];

    const tasks = [
        {
            id: "task_1",
            organizationId: "org_test_123",
            projectId: "proj_core_1",
            assigneeId: "user_emp_1",
            title: "Implement Multi-tenant DB Isolation & Row Policies",
            description: "Enforce organization-scoped row policies across PostgreSQL tables",
            status: "DONE",
            priority: "HIGH",
            orderIndex: 0,
            dueDate: new Date("2026-10-15T18:00:00Z"),
            completedAt: new Date("2026-10-15T16:00:00Z"),
            createdAt: new Date("2026-10-06T10:00:00Z"),
            updatedAt: new Date("2026-10-15T16:00:00Z")
        },
        {
            id: "task_2",
            organizationId: "org_test_123",
            projectId: "proj_core_1",
            assigneeId: "user_mgr_1",
            title: "Build JWT Authentication & Invitation Token System",
            description: "Seed invitation codes for role-based onboarding",
            status: "DONE",
            priority: "HIGH",
            orderIndex: 1,
            dueDate: new Date("2026-10-20T18:00:00Z"),
            completedAt: new Date("2026-10-19T14:30:00Z"),
            createdAt: new Date("2026-10-07T11:00:00Z"),
            updatedAt: new Date("2026-10-19T14:30:00Z")
        },
        {
            id: "task_3",
            organizationId: "org_test_123",
            projectId: "proj_core_1",
            assigneeId: "user_emp_1",
            title: "Interactive Kanban Board Drag & Drop Support",
            description: "Columns: TODO, IN_PROGRESS, REVIEW, DONE with position ordering",
            status: "IN_PROGRESS",
            priority: "URGENT",
            orderIndex: 0,
            dueDate: new Date("2026-11-05T18:00:00Z"),
            completedAt: null,
            createdAt: new Date("2026-10-08T12:00:00Z"),
            updatedAt: new Date("2026-10-08T12:00:00Z")
        },
        {
            id: "task_4",
            organizationId: "org_test_123",
            projectId: "proj_core_1",
            assigneeId: null,
            title: "Develop Task Filtering and Multi-Column Search",
            description: "Support filtering by status, priority, assignee, due date, and labels",
            status: "REVIEW",
            priority: "MEDIUM",
            orderIndex: 0,
            dueDate: new Date("2026-11-10T18:00:00Z"),
            completedAt: null,
            createdAt: new Date("2026-10-09T14:00:00Z"),
            updatedAt: new Date("2026-10-09T14:00:00Z")
        },
        {
            id: "task_5",
            organizationId: "org_test_123",
            projectId: "proj_core_1",
            assigneeId: null,
            title: "Automate Security and Boundary Unit Test Suite",
            description: "Prevent cross-organization and cross-project operations",
            status: "TODO",
            priority: "LOW",
            orderIndex: 0,
            dueDate: new Date("2026-11-15T18:00:00Z"),
            completedAt: null,
            createdAt: new Date("2026-10-10T15:00:00Z"),
            updatedAt: new Date("2026-10-10T15:00:00Z")
        }
    ];

    const subtasks = [
        { id: "sub_1", taskId: "task_1", title: "Write row-level security SQL migration", status: "DONE", isCompleted: true, createdAt: new Date() },
        { id: "sub_2", taskId: "task_1", title: "Verify tenant isolation unit tests", status: "DONE", isCompleted: true, createdAt: new Date() },
        { id: "sub_3", taskId: "task_3", title: "Render TODO, IN_PROGRESS, REVIEW, DONE columns", status: "DONE", isCompleted: true, createdAt: new Date() },
        { id: "sub_4", taskId: "task_3", title: "Implement status change PATCH handler", status: "IN_PROGRESS", isCompleted: false, createdAt: new Date() },
        { id: "sub_5", taskId: "task_3", title: "Persist column orderIndex", status: "TODO", isCompleted: false, createdAt: new Date() },
    ];

    const taskLabels = [
        { id: "tl_1", taskId: "task_1", labelId: "lbl_4" },
        { id: "tl_2", taskId: "task_1", labelId: "lbl_5" },
        { id: "tl_3", taskId: "task_3", labelId: "lbl_1" },
        { id: "tl_4", taskId: "task_3", labelId: "lbl_3" },
        { id: "tl_5", taskId: "task_4", labelId: "lbl_2" },
    ];

    return {
        organizations: [org1],
        users: [userOwner, userManager, userEmployee],
        memberships,
        invitations,
        workspaces,
        projects,
        projectMembers,
        labels,
        tasks,
        subtasks,
        taskLabels
    };
}

let store = createInitialStore();

function genId(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}

function matchFilter(item, where) {
    if (!where) return true;
    for (const [key, val] of Object.entries(where)) {
        if (val === undefined) continue;
        if (typeof val === "object" && val !== null) {
            if (Array.isArray(val.in)) {
                if (!val.in.includes(item[key])) return false;
                continue;
            }
            continue;
        }
        if (item[key] !== val) return false;
    }
    return true;
}

const mockPrisma = {
    organization: {
        async findMany(args) {
            let res = [...store.organizations];
            if (args?.where) res = res.filter(o => matchFilter(o, args.where));
            return res;
        },
        async findFirst(args) {
            return store.organizations.find(o => matchFilter(o, args?.where)) || null;
        },
        async findUnique(args) {
            return store.organizations.find(o => matchFilter(o, args?.where)) || null;
        },
        async create({ data }) {
            const org = {
                id: data.id || genId("org"),
                name: data.name,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            store.organizations.push(org);
            return org;
        }
    },

    user: {
        async findUnique({ where }) {
            return store.users.find(u => {
                if (where.id) return u.id === where.id;
                if (where.email) return u.email.toLowerCase() === where.email.toLowerCase();
                return false;
            }) || null;
        },
        async findFirst({ where }) {
            return store.users.find(u => matchFilter(u, where)) || null;
        },
        async findMany(args) {
            let res = [...store.users];
            if (args?.where) res = res.filter(u => matchFilter(u, args.where));
            return res;
        },
        async create({ data }) {
            const user = {
                id: data.id || genId("user"),
                name: data.name,
                email: data.email.toLowerCase(),
                passwordHash: data.passwordHash,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            store.users.push(user);
            return user;
        }
    },

    membership: {
        async findFirst({ where }) {
            return store.memberships.find(m => matchFilter(m, where)) || null;
        },
        async findMany(args) {
            let res = store.memberships.filter(m => matchFilter(m, args?.where));
            if (args?.include?.user) {
                res = res.map(m => {
                    const u = store.users.find(usr => usr.id === m.userId);
                    return {
                        ...m,
                        user: u ? { id: u.id, name: u.name, email: u.email } : null
                    };
                });
            }
            return res;
        },
        async create({ data }) {
            const mem = {
                id: data.id || genId("mem"),
                organizationId: data.organizationId,
                userId: data.userId,
                role: data.role,
                createdAt: new Date()
            };
            store.memberships.push(mem);
            return mem;
        }
    },

    invitation: {
        async findUnique({ where }) {
            return store.invitations.find(i => {
                if (where.code) return i.code === where.code;
                if (where.id) return i.id === where.id;
                return false;
            }) || null;
        },
        async create({ data }) {
            const inv = {
                id: data.id || genId("inv"),
                code: data.code,
                organizationId: data.organizationId,
                role: data.role,
                used: data.used !== undefined ? data.used : false,
                expiresAt: data.expiresAt || null,
                createdAt: new Date()
            };
            store.invitations.push(inv);
            return inv;
        },
        async update({ where, data }) {
            const idx = store.invitations.findIndex(i => {
                if (where.id) return i.id === where.id;
                if (where.code) return i.code === where.code;
                return false;
            });
            if (idx === -1) throw new Error("Invitation not found");
            store.invitations[idx] = { ...store.invitations[idx], ...data };
            return store.invitations[idx];
        }
    },

    workspace: {
        async findFirst({ where }) {
            return store.workspaces.find(w => matchFilter(w, where)) || null;
        },
        async findMany(args) {
            let res = [...store.workspaces];
            if (args?.where) res = res.filter(w => matchFilter(w, args.where));
            return res;
        },
        async create({ data }) {
            const ws = {
                id: data.id || genId("ws"),
                organizationId: data.organizationId,
                name: data.name
            };
            store.workspaces.push(ws);
            return ws;
        }
    },

    project: {
        async findFirst({ where }) {
            return store.projects.find(p => matchFilter(p, where)) || null;
        },
        async findMany(args) {
            let res = [...store.projects];
            if (args?.where) res = res.filter(p => matchFilter(p, args.where));
            if (args?.include?.projectMembers) {
                res = res.map(p => ({
                    ...p,
                    projectMembers: store.projectMembers
                        .filter(pm => pm.projectId === p.id)
                        .map(pm => {
                            const u = store.users.find(usr => usr.id === pm.userId);
                            return {
                                ...pm,
                                user: u ? { id: u.id, name: u.name, email: u.email } : null
                            };
                        })
                }));
            }
            return res;
        },
        async create({ data }) {
            const proj = {
                id: data.id || genId("proj"),
                organizationId: data.organizationId,
                workspaceId: data.workspaceId,
                name: data.name,
                description: data.description || null,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            store.projects.push(proj);
            return proj;
        },
        async update({ where, data }) {
            const idx = store.projects.findIndex(p => p.id === where.id);
            if (idx === -1) throw new Error("Project not found");
            store.projects[idx] = { ...store.projects[idx], ...data, updatedAt: new Date() };
            return store.projects[idx];
        },
        async delete({ where }) {
            const idx = store.projects.findIndex(p => p.id === where.id);
            if (idx === -1) throw new Error("Project not found");
            const deleted = store.projects.splice(idx, 1)[0];
            store.tasks = store.tasks.filter(t => t.projectId !== where.id);
            store.projectMembers = store.projectMembers.filter(pm => pm.projectId !== where.id);
            return deleted;
        }
    },

    projectMember: {
        async findFirst({ where }) {
            return store.projectMembers.find(pm => matchFilter(pm, where)) || null;
        },
        async findMany(args) {
            let res = store.projectMembers.filter(pm => matchFilter(pm, args?.where));
            if (args?.include?.user) {
                res = res.map(pm => {
                    const u = store.users.find(usr => usr.id === pm.userId);
                    return {
                        ...pm,
                        user: u ? { id: u.id, name: u.name, email: u.email } : null
                    };
                });
            }
            return res;
        },
        async create({ data }) {
            const pm = {
                id: data.id || genId("pm"),
                projectId: data.projectId,
                userId: data.userId,
                createdAt: new Date()
            };
            store.projectMembers.push(pm);
            return pm;
        },
        async delete({ where }) {
            const idx = store.projectMembers.findIndex(pm => {
                if (where.id) return pm.id === where.id;
                if (where.projectId_userId) {
                    return pm.projectId === where.projectId_userId.projectId && pm.userId === where.projectId_userId.userId;
                }
                return false;
            });
            if (idx === -1) throw new Error("ProjectMember not found");
            return store.projectMembers.splice(idx, 1)[0];
        },
        async deleteMany({ where }) {
            const beforeLen = store.projectMembers.length;
            store.projectMembers = store.projectMembers.filter(pm => !matchFilter(pm, where));
            return { count: beforeLen - store.projectMembers.length };
        }
    },

    task: {
        async findFirst(args) {
            const { where, include } = args || {};
            const task = store.tasks.find(t => matchFilter(t, where));
            if (!task) return null;
            return enrichTask(task, include);
        },
        async findMany(args) {
            let res = store.tasks.filter(t => matchFilter(t, args?.where));
            if (args?.orderBy?.title === "asc") {
                res.sort((a, b) => a.title.localeCompare(b.title));
            } else if (args?.orderBy?.orderIndex === "asc") {
                res.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
            }
            return res.map(t => enrichTask(t, args?.include));
        },
        async create({ data }) {
            const task = {
                id: data.id || genId("task"),
                organizationId: data.organizationId,
                projectId: data.projectId,
                title: data.title,
                description: data.description || null,
                status: data.status || "TODO",
                priority: data.priority || null,
                orderIndex: data.orderIndex !== undefined ? data.orderIndex : 0,
                assigneeId: data.assigneeId || null,
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
                completedAt: data.status === "DONE" ? new Date() : null,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            store.tasks.push(task);
            return task;
        },
        async update({ where, data }) {
            const idx = store.tasks.findIndex(t => t.id === where.id);
            if (idx === -1) throw new Error("Task not found");
            const prev = store.tasks[idx];
            let completedAt = prev.completedAt;
            if (data.status !== undefined) {
                if (data.status === "DONE" && prev.status !== "DONE") {
                    completedAt = new Date();
                } else if (data.status !== "DONE") {
                    completedAt = null;
                }
            }
            store.tasks[idx] = {
                ...prev,
                ...data,
                completedAt,
                updatedAt: new Date()
            };
            return store.tasks[idx];
        },
        async delete({ where }) {
            const idx = store.tasks.findIndex(t => t.id === where.id);
            if (idx === -1) throw new Error("Task not found");
            const deleted = store.tasks.splice(idx, 1)[0];
            store.subtasks = store.subtasks.filter(s => s.taskId !== where.id);
            store.taskLabels = store.taskLabels.filter(tl => tl.taskId !== where.id);
            return deleted;
        }
    },

    subtask: {
        async findFirst({ where }) {
            return store.subtasks.find(s => matchFilter(s, where)) || null;
        },
        async findMany(args) {
            let res = store.subtasks.filter(s => matchFilter(s, args?.where));
            return res;
        },
        async create({ data }) {
            const sub = {
                id: data.id || genId("sub"),
                taskId: data.taskId,
                title: data.title,
                status: data.status || (data.isCompleted ? "DONE" : "TODO"),
                isCompleted: Boolean(data.isCompleted),
                createdAt: new Date()
            };
            store.subtasks.push(sub);
            return sub;
        },
        async update({ where, data }) {
            const idx = store.subtasks.findIndex(s => s.id === where.id);
            if (idx === -1) throw new Error("Subtask not found");
            const isComp = data.isCompleted !== undefined ? data.isCompleted : (data.status === "DONE");
            store.subtasks[idx] = {
                ...store.subtasks[idx],
                ...data,
                isCompleted: isComp,
                status: isComp ? "DONE" : "TODO"
            };
            return store.subtasks[idx];
        },
        async delete({ where }) {
            const idx = store.subtasks.findIndex(s => s.id === where.id);
            if (idx === -1) throw new Error("Subtask not found");
            return store.subtasks.splice(idx, 1)[0];
        }
    },

    label: {
        async findFirst({ where }) {
            return store.labels.find(l => matchFilter(l, where)) || null;
        },
        async findMany(args) {
            let res = store.labels.filter(l => matchFilter(l, args?.where));
            return res;
        },
        async create({ data }) {
            const lbl = {
                id: data.id || genId("lbl"),
                name: data.name.toLowerCase().trim()
            };
            store.labels.push(lbl);
            return lbl;
        }
    },

    taskLabel: {
        async findFirst({ where }) {
            return store.taskLabels.find(tl => matchFilter(tl, where)) || null;
        },
        async findMany(args) {
            let res = store.taskLabels.filter(tl => matchFilter(tl, args?.where));
            if (args?.include?.label) {
                res = res.map(tl => ({
                    ...tl,
                    label: store.labels.find(l => l.id === tl.labelId) || null
                }));
            }
            return res;
        },
        async create({ data }) {
            const tl = {
                id: data.id || genId("tl"),
                taskId: data.taskId,
                labelId: data.labelId
            };
            store.taskLabels.push(tl);
            return tl;
        },
        async deleteMany({ where }) {
            const beforeLen = store.taskLabels.length;
            store.taskLabels = store.taskLabels.filter(tl => !matchFilter(tl, where));
            return { count: beforeLen - store.taskLabels.length };
        }
    },

    async $transaction(cb) {
        if (typeof cb === "function") {
            return await cb(mockPrisma);
        }
        return Promise.all(cb);
    },

    async $queryRaw() {
        return [{ connected: true }];
    },

    async $disconnect() {
        return Promise.resolve();
    },

    _getStore() {
        return store;
    },

    _resetStore() {
        store = createInitialStore();
        return store;
    }
};

function enrichTask(task, include) {
    const enriched = { ...task };
    if (include?.subtasks) {
        enriched.subtasks = store.subtasks.filter(s => s.taskId === task.id);
    }
    if (include?.taskLabels) {
        enriched.taskLabels = store.taskLabels
            .filter(tl => tl.taskId === task.id)
            .map(tl => ({
                ...tl,
                label: store.labels.find(l => l.id === tl.labelId) || null
            }));
    }
    if (include?.assignee) {
        const u = task.assigneeId ? store.users.find(usr => usr.id === task.assigneeId) : null;
        enriched.assignee = u ? { id: u.id, name: u.name, email: u.email } : null;
    }
    return enriched;
}

module.exports = mockPrisma;
