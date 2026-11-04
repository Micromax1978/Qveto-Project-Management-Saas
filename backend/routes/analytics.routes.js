// Dashboards and reports (Week 4).
//
// Definitions (also in the README):
//  - completion rate = DONE tasks / all tasks (0 when the project has no tasks)
//  - overdue         = due date strictly before now (UTC) and status not DONE
//  - workload        = open (not DONE) / overdue / done tasks per project member
//  - trend windows   = the last 14 days in UTC, including today
const express = require("express");
const prisma = require("../lib/prisma");
const authenticateToken = require("../middleware/auth.middleware");
const requireOrganization = require("../middleware/organization.middleware");
const { STATUSES, PRIORITIES } = require("../lib/constants");
const { getAccessibleProject, accessibleProjectIds } = require("../lib/access");
const { completionRate, zeroFill, bucketByDay, startOfWindow } = require("../lib/analytics");

const router = express.Router();

router.use(authenticateToken, requireOrganization);

const TREND_DAYS = 14;
const DUE_SOON_DAYS = 7;

// GET /api/analytics/projects/:projectId
router.get("/projects/:projectId", async (req, res) => {
    const project = await getAccessibleProject(req, req.params.projectId);

    const now = new Date();
    const windowStart = startOfWindow(TREND_DAYS, now);
    const dueSoonLimit = new Date(now.getTime() + DUE_SOON_DAYS * 24 * 60 * 60 * 1000);

    const base = { projectId: project.id, organizationId: req.organizationId };
    const overdueWhere = { ...base, dueDate: { lt: now }, status: { not: "DONE" } };

    const [
        total,
        statusRows,
        priorityRows,
        overdue,
        dueSoon,
        openByAssignee,
        overdueByAssignee,
        doneByAssignee,
        completedDates,
        activityDates,
        recentActivity,
        members
    ] = await Promise.all([
        prisma.task.count({ where: base }),
        prisma.task.groupBy({ by: ["status"], where: base, _count: { _all: true } }),
        prisma.task.groupBy({ by: ["priority"], where: base, _count: { _all: true } }),
        prisma.task.count({ where: overdueWhere }),
        prisma.task.count({
            where: { ...base, status: { not: "DONE" }, dueDate: { gte: now, lte: dueSoonLimit } }
        }),
        prisma.task.groupBy({
            by: ["assigneeId"],
            where: { ...base, status: { not: "DONE" } },
            _count: { _all: true }
        }),
        prisma.task.groupBy({ by: ["assigneeId"], where: overdueWhere, _count: { _all: true } }),
        prisma.task.groupBy({
            by: ["assigneeId"],
            where: { ...base, status: "DONE" },
            _count: { _all: true }
        }),
        prisma.task.findMany({
            where: { ...base, completedAt: { gte: windowStart } },
            select: { completedAt: true }
        }),
        prisma.activity.findMany({
            where: { projectId: project.id, createdAt: { gte: windowStart } },
            select: { createdAt: true }
        }),
        prisma.activity.findMany({
            where: { projectId: project.id },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            take: 10,
            include: { actor: { select: { id: true, name: true } } }
        }),
        prisma.projectMember.findMany({
            where: { projectId: project.id },
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: "asc" }
        })
    ]);

    const byStatus = zeroFill(STATUSES, statusRows, (row) => row.status, (row) => row._count._all);
    const byPriority = zeroFill(
        [...PRIORITIES, "NONE"],
        priorityRows,
        (row) => row.priority || "NONE",
        (row) => row._count._all
    );

    const countFor = (rows, assigneeId) => {
        const row = rows.find((entry) => entry.assigneeId === assigneeId);
        return row ? row._count._all : 0;
    };

    const workload = members.map((member) => ({
        userId: member.user.id,
        name: member.user.name,
        email: member.user.email,
        open: countFor(openByAssignee, member.user.id),
        overdue: countFor(overdueByAssignee, member.user.id),
        done: countFor(doneByAssignee, member.user.id)
    }));

    workload.push({
        userId: null,
        name: "Unassigned",
        email: null,
        open: countFor(openByAssignee, null),
        overdue: countFor(overdueByAssignee, null),
        done: countFor(doneByAssignee, null)
    });

    return res.json({
        status: "OK",
        generatedAt: now.toISOString(),
        project: { id: project.id, name: project.name },
        summary: {
            total,
            done: byStatus.DONE,
            open: total - byStatus.DONE,
            overdue,
            dueSoon,
            completionRate: completionRate(byStatus.DONE, total)
        },
        byStatus,
        byPriority,
        workload,
        completionTrend: bucketByDay(
            completedDates.map((row) => row.completedAt),
            TREND_DAYS,
            now
        ).map((bucket) => ({ date: bucket.date, completed: bucket.count })),
        activity: {
            daily: bucketByDay(activityDates.map((row) => row.createdAt), TREND_DAYS, now),
            recent: recentActivity
        }
    });
});

// GET /api/analytics/overview - all accessible projects plus the user's own workload
router.get("/overview", async (req, res) => {
    const now = new Date();
    const projectIds = await accessibleProjectIds(req);

    const [projects, statusRows, overdueRows, myOpen, myOverdue] = projectIds.length
        ? await Promise.all([
            prisma.project.findMany({
                where: { id: { in: projectIds } },
                select: { id: true, name: true },
                orderBy: { name: "asc" }
            }),
            prisma.task.groupBy({
                by: ["projectId", "status"],
                where: { projectId: { in: projectIds } },
                _count: { _all: true }
            }),
            prisma.task.groupBy({
                by: ["projectId"],
                where: {
                    projectId: { in: projectIds },
                    dueDate: { lt: now },
                    status: { not: "DONE" }
                },
                _count: { _all: true }
            }),
            prisma.task.count({
                where: { projectId: { in: projectIds }, assigneeId: req.userId, status: { not: "DONE" } }
            }),
            prisma.task.count({
                where: {
                    projectId: { in: projectIds },
                    assigneeId: req.userId,
                    dueDate: { lt: now },
                    status: { not: "DONE" }
                }
            })
        ])
        : [[], [], [], 0, 0];

    const rows = projects.map((project) => {
        const own = statusRows.filter((row) => row.projectId === project.id);
        const total = own.reduce((sum, row) => sum + row._count._all, 0);
        const done = own
            .filter((row) => row.status === "DONE")
            .reduce((sum, row) => sum + row._count._all, 0);
        const overdueRow = overdueRows.find((row) => row.projectId === project.id);

        return {
            id: project.id,
            name: project.name,
            total,
            done,
            overdue: overdueRow ? overdueRow._count._all : 0,
            completionRate: completionRate(done, total)
        };
    });

    const totals = rows.reduce(
        (sum, row) => ({
            total: sum.total + row.total,
            done: sum.done + row.done,
            overdue: sum.overdue + row.overdue
        }),
        { total: 0, done: 0, overdue: 0 }
    );

    return res.json({
        status: "OK",
        generatedAt: now.toISOString(),
        projectCount: rows.length,
        totals: { ...totals, completionRate: completionRate(totals.done, totals.total) },
        projects: rows,
        mine: { open: myOpen, overdue: myOverdue }
    });
});

module.exports = router;
