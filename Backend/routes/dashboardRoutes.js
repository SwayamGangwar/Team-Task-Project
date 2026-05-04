const router = require("express").Router();
const Task = require("../models/Task");
const Project = require("../models/Project");
const auth = require("../middleware/authMiddleware");

router.get("/", auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const isAdmin = req.user.role === "admin";

        const projectFilter = isAdmin
            ? {}
            : { $or: [{ members: userId }, { createdBy: userId }] };

        const projects = await Project.find(projectFilter).select("_id name");
        const projectIds = projects.map((p) => p._id);

        const taskFilter = isAdmin ? {} : { projectId: { $in: projectIds } };
        const tasks = await Task.find(taskFilter);

        const byStatus = { todo: 0, in_progress: 0, done: 0 };
        const now = new Date();
        let overdue = 0;

        for (const t of tasks) {
            if (byStatus[t.status] !== undefined) byStatus[t.status] += 1;
            if (t.dueDate && t.dueDate < now && t.status !== "done") overdue += 1;
        }

        const myOpenTasks = await Task.countDocuments({
            assignedTo: userId,
            status: { $ne: "done" },
            ...(isAdmin ? {} : { projectId: { $in: projectIds } }),
        });

        res.json({
            projects: projects.length,
            tasks: {
                total: tasks.length,
                byStatus,
                overdue,
            },
            myOpenTasks,
        });
    } catch (err) {
        res.status(500).json({ message: err.message || "Failed to load dashboard" });
    }
});

module.exports = router;
