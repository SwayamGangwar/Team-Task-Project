const router = require("express").Router();
const mongoose = require("mongoose");
const Task = require("../models/Task");
const Project = require("../models/Project");
const auth = require("../middleware/authMiddleware");

const STATUSES = new Set(["todo", "in_progress", "done"]);

async function userCanAccessProject(userId, role, projectId) {
    if (role === "admin") return true;
    const project = await Project.findById(projectId).select("members createdBy");
    if (!project) return false;
    const uid = String(userId);
    if (String(project.createdBy) === uid) return true;
    return project.members.some((m) => String(m) === uid);
}

router.post("/", auth, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Only admins can create tasks" });
        }

        const { title, description, projectId, assignedTo, dueDate, status } = req.body;

        if (!title || typeof title !== "string" || !title.trim()) {
            return res.status(400).json({ message: "Task title is required" });
        }
        if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ message: "Valid projectId is required" });
        }
        if (!assignedTo || !mongoose.Types.ObjectId.isValid(assignedTo)) {
            return res.status(400).json({ message: "You must assign the task to a team member" });
        }

        const project = await Project.findById(projectId).select("members");
        if (!project) return res.status(404).json({ message: "Project not found" });

        const assigneeInProject = project.members.some(
            (m) => String(m) === String(assignedTo)
        );
        if (!assigneeInProject) {
            return res.status(400).json({ message: "Assignee must be a member of this project" });
        }

        let nextStatus = "todo";
        if (status !== undefined) {
            if (!STATUSES.has(status)) {
                return res.status(400).json({ message: "Invalid status" });
            }
            nextStatus = status;
        }

        let due = null;
        if (dueDate !== undefined && dueDate !== null && dueDate !== "") {
            const d = new Date(dueDate);
            if (Number.isNaN(d.getTime())) {
                return res.status(400).json({ message: "Invalid dueDate" });
            }
            due = d;
        }

        const task = await Task.create({
            title: title.trim(),
            description: typeof description === "string" ? description : "",
            projectId,
            assignedTo,
            dueDate: due,
            status: nextStatus,
        });

        await task.populate("assignedTo", "name email role");
        await task.populate("projectId", "name");
        res.status(201).json(task);
    } catch (err) {
        res.status(500).json({ message: err.message || "Failed to create task" });
    }
});

router.get("/", auth, async (req, res) => {
    try {
        const { projectId } = req.query;
        let filter = {};

        if (req.user.role !== "admin") {
            const projects = await Project.find({
                $or: [{ members: req.user.id }, { createdBy: req.user.id }],
            }).select("_id");
            const ids = projects.map((p) => p._id);
            filter = { projectId: { $in: ids } };
        }

        if (projectId) {
            if (!mongoose.Types.ObjectId.isValid(projectId)) {
                return res.status(400).json({ message: "Invalid projectId" });
            }
            const canSee = await userCanAccessProject(req.user.id, req.user.role, projectId);
            if (!canSee) return res.status(403).json({ message: "Access denied" });
            filter = { ...filter, projectId };
        }

        const tasks = await Task.find(filter)
            .populate("assignedTo", "name email role")
            .populate("projectId", "name");
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: err.message || "Failed to list tasks" });
    }
});

router.put("/:id", auth, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid task id" });
        }

        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: "Task not found" });

        const allowed = await userCanAccessProject(req.user.id, req.user.role, task.projectId);
        if (!allowed) {
            return res.status(403).json({ message: "Access denied" });
        }

        if (req.user.role !== "admin") {
            if (!task.assignedTo || String(task.assignedTo) !== String(req.user.id)) {
                return res.status(403).json({ message: "You can only update tasks assigned to you" });
            }
            const memberOnlyStatus =
                req.body.status !== undefined &&
                req.body.title === undefined &&
                req.body.description === undefined &&
                req.body.dueDate === undefined &&
                req.body.assignedTo === undefined;
            if (!memberOnlyStatus) {
                return res.status(403).json({ message: "You may only mark your tasks complete or pending" });
            }
        }

        const updates = {};
        if (req.body.status !== undefined) {
            if (!STATUSES.has(req.body.status)) {
                return res.status(400).json({ message: "Invalid status" });
            }
            updates.status = req.body.status;
        }
        if (req.body.title !== undefined) {
            if (typeof req.body.title !== "string" || !req.body.title.trim()) {
                return res.status(400).json({ message: "Title cannot be empty" });
            }
            updates.title = req.body.title.trim();
        }
        if (req.body.description !== undefined && typeof req.body.description === "string") {
            updates.description = req.body.description;
        }
        if (req.body.dueDate !== undefined) {
            if (req.body.dueDate === null || req.body.dueDate === "") {
                updates.dueDate = null;
            } else {
                const d = new Date(req.body.dueDate);
                if (Number.isNaN(d.getTime())) {
                    return res.status(400).json({ message: "Invalid dueDate" });
                }
                updates.dueDate = d;
            }
        }

        if (req.body.assignedTo !== undefined && req.user.role === "admin") {
            if (req.body.assignedTo === null || req.body.assignedTo === "") {
                updates.assignedTo = null;
            } else if (!mongoose.Types.ObjectId.isValid(req.body.assignedTo)) {
                return res.status(400).json({ message: "Invalid assignee id" });
            } else {
                const project = await Project.findById(task.projectId).select("members");
                const ok = project.members.some((m) => String(m) === String(req.body.assignedTo));
                if (!ok) return res.status(400).json({ message: "Assignee must be a project member" });
                updates.assignedTo = req.body.assignedTo;
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "No valid fields to update" });
        }

        const updated = await Task.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true,
        })
            .populate("assignedTo", "name email role")
            .populate("projectId", "name");

        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message || "Failed to update task" });
    }
});

module.exports = router;
