const prisma = require("../config/prisma");

// GET /api/tasks/:taskId/activities
async function getActivities(req, res, next) {
  try {
    const { taskId } = req.params;
    const organizationId = req.organizationId;

    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task || task.organizationId !== organizationId) {
      return res.status(404).json({ error: "Task not found in this organization" });
    }

    const activities = await prisma.activity.findMany({
      where: {
        taskId,
        organizationId
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json({
      status: "OK",
      count: activities.length,
      data: activities,
      activities
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getActivities
};
