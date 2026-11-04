const express = require("express");
const prisma = require("../lib/prisma");
const authenticateToken = require("../middleware/auth.middleware");
const requireOrganization = require("../middleware/organization.middleware");
const requireRole = require("../middleware/role.middleware");
const { HttpError } = require("../lib/errors");
const { assertId } = require("../lib/access");
const { parsePagination, queryString } = require("../lib/validation");
const { scanOverdueTasks } = require("../services/overdue.service");

const router = express.Router();

router.use(authenticateToken, requireOrganization);

// Notifications are strictly private: every query is filtered by req.userId.
function ownWhere(req, extra = {}) {
    return { userId: req.userId, organizationId: req.organizationId, ...extra };
}

// GET /api/notifications?unread=true&page&pageSize
router.get("/", async (req, res) => {
    const { page, pageSize, skip, take } = parsePagination(req.query);
    const unreadOnly = queryString(req.query, "unread") === "true";

    const where = ownWhere(req, unreadOnly ? { read: false } : {});

    const [total, unreadCount, notifications] = await Promise.all([
        prisma.notification.count({ where }),
        prisma.notification.count({ where: ownWhere(req, { read: false }) }),
        prisma.notification.findMany({
            where,
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            skip,
            take,
            include: {
                task: { select: { id: true, title: true } },
                project: { select: { id: true, name: true } }
            }
        })
    ]);

    return res.json({
        status: "OK",
        count: notifications.length,
        total,
        unreadCount,
        page,
        pageSize,
        notifications
    });
});

// GET /api/notifications/unread-count
router.get("/unread-count", async (req, res) => {
    const unreadCount = await prisma.notification.count({
        where: ownWhere(req, { read: false })
    });

    return res.json({ status: "OK", unreadCount });
});

// PATCH /api/notifications/read-all
router.patch("/read-all", async (req, res) => {
    const result = await prisma.notification.updateMany({
        where: ownWhere(req, { read: false }),
        data: { read: true }
    });

    return res.json({
        status: "OK",
        message: "All notifications marked as read",
        updated: result.count
    });
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", async (req, res) => {
    const id = assertId(req.params.id, "Notification ID");

    const result = await prisma.notification.updateMany({
        where: ownWhere(req, { id }),
        data: { read: true }
    });

    if (result.count === 0) {
        throw new HttpError(404, "Notification not found");
    }

    return res.json({ status: "OK", message: "Notification marked as read" });
});

// POST /api/notifications/scan-overdue - run the overdue scan for this organization now
router.post("/scan-overdue", requireRole("owner", "manager"), async (req, res) => {
    const result = await scanOverdueTasks({ organizationId: req.organizationId });

    return res.json({
        status: "OK",
        message: "Overdue scan completed",
        ...result
    });
});

module.exports = router;
