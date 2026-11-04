// Creates a sample organization with users, a project, tasks, comments and
// activity. Safe to re-run: it skips everything if the demo org already exists.
//   node scripts/seed-demo.js
//
// Demo logins (password for all: Demo@12345):
//   manager@demo.qveto.test  (role: manager)
//   alice@demo.qveto.test    (role: employee)
//   bob@demo.qveto.test      (role: employee)
require("dotenv").config();
const bcrypt = require("bcrypt");
const prisma = require("../lib/prisma");

const PASSWORD = "Demo@12345";
const DAY = 24 * 60 * 60 * 1000;

async function main() {
    const existing = await prisma.user.findUnique({ where: { email: "manager@demo.qveto.test" } });

    if (existing) {
        console.log("Demo data already exists. Nothing to do.");
        return;
    }

    const passwordHash = await bcrypt.hash(PASSWORD, 10);
    const now = Date.now();

    const org = await prisma.organization.create({ data: { name: "Demo Organization" } });
    const workspace = await prisma.workspace.create({
        data: { organizationId: org.id, name: "Product Team" }
    });

    const make = async (name, email, role) => {
        const user = await prisma.user.create({ data: { name, email, passwordHash } });
        await prisma.membership.create({ data: { organizationId: org.id, userId: user.id, role } });
        return user;
    };

    const manager = await make("Maya Manager", "manager@demo.qveto.test", "manager");
    const alice = await make("Alice Employee", "alice@demo.qveto.test", "employee");
    const bob = await make("Bob Employee", "bob@demo.qveto.test", "employee");

    const project = await prisma.project.create({
        data: {
            organizationId: org.id,
            workspaceId: workspace.id,
            name: "Website Relaunch",
            description: "Sample project showing the Kanban workflow.",
            createdById: manager.id,
            projectMembers: { create: [manager, alice, bob].map((user) => ({ userId: user.id })) }
        }
    });

    const labels = {};

    for (const [name, color] of [["design", "#8b5cf6"], ["backend", "#0ea5e9"], ["bug", "#ef4444"]]) {
        labels[name] = await prisma.label.create({ data: { organizationId: org.id, name, color } });
    }

    const defs = [
        { title: "Write launch announcement", status: "TODO", priority: "LOW", due: 10, who: null, tags: [] },
        { title: "Design new landing page", status: "IN_PROGRESS", priority: "HIGH", due: 3, who: alice, tags: ["design"] },
        { title: "Migrate contact form API", status: "IN_PROGRESS", priority: "MEDIUM", due: -2, who: bob, tags: ["backend"] },
        { title: "Fix broken pricing link", status: "REVIEW", priority: "URGENT", due: -1, who: alice, tags: ["bug"] },
        { title: "Set up analytics", status: "DONE", priority: "MEDIUM", due: -5, who: bob, tags: ["backend"] },
        { title: "Choose color palette", status: "DONE", priority: "LOW", due: -8, who: alice, tags: ["design"] }
    ];

    const positions = {};
    const tasks = [];

    for (const def of defs) {
        positions[def.status] = (positions[def.status] ?? -1) + 1;

        const task = await prisma.task.create({
            data: {
                organizationId: org.id,
                projectId: project.id,
                createdById: manager.id,
                assigneeId: def.who ? def.who.id : null,
                title: def.title,
                status: def.status,
                priority: def.priority,
                dueDate: new Date(now + def.due * DAY),
                position: positions[def.status],
                completedAt: def.status === "DONE" ? new Date(now - DAY) : null,
                taskLabels: { create: def.tags.map((tag) => ({ labelId: labels[tag].id })) }
            }
        });

        tasks.push(task);

        await prisma.activity.create({
            data: {
                organizationId: org.id,
                projectId: project.id,
                taskId: task.id,
                actorId: manager.id,
                type: "TASK_CREATED",
                message: `${manager.name} created task "${task.title}"`
            }
        });
    }

    await prisma.subtask.createMany({
        data: [
            { taskId: tasks[1].id, title: "Wireframes", status: "DONE" },
            { taskId: tasks[1].id, title: "High-fidelity mockup", status: "TODO" }
        ]
    });

    await prisma.comment.create({
        data: {
            organizationId: org.id,
            taskId: tasks[1].id,
            authorId: manager.id,
            body: "Please share the first draft by Friday."
        }
    });

    await prisma.notification.create({
        data: {
            organizationId: org.id,
            userId: alice.id,
            projectId: project.id,
            taskId: tasks[1].id,
            type: "TASK_ASSIGNED",
            message: `You were assigned to "${tasks[1].title}"`
        }
    });

    console.log("Demo data created.");
    console.log("Logins (password " + PASSWORD + "):");
    console.log("  manager@demo.qveto.test (manager)");
    console.log("  alice@demo.qveto.test   (employee)");
    console.log("  bob@demo.qveto.test     (employee)");
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
