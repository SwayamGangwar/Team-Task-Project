const router = require("express").Router();
const mongoose = require("mongoose");
const Project = require("../models/Project");
const auth = require("../middleware/authMiddleware");

function uniqueValidObjectIds(ids) {
    if (!Array.isArray(ids)) return [];
    const seen = new Set();
    const out = [];
    for (const id of ids) {
        if (!mongoose.Types.ObjectId.isValid(id)) continue;
        const s = String(id);
        if (seen.has(s)) continue;
        seen.add(s);
        out.push(s);
    }
    return out;
}

router.post("/", auth, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Only admins can create projects" });
        }

        const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
        if (!name) {
            return res.status(400).json({ message: "Project name is required" });
        }

        const memberIds = uniqueValidObjectIds(req.body.members || []);
        const creator = String(req.user.id);
        if (!memberIds.includes(creator)) memberIds.push(creator);

        const project = await Project.create({
            name,
            members: memberIds,
            createdBy: req.user.id,
        });

        await project.populate("members", "name email role");
        res.status(201).json(project);
    } catch (err) {
        res.status(500).json({ message: err.message || "Failed to create project" });
    }
});

router.get("/", auth, async (req, res) => {
    try {
        const filter =
            req.user.role === "admin"
                ? {}
                : { $or: [{ members: req.user.id }, { createdBy: req.user.id }] };

        const projects = await Project.find(filter)
            .populate("members", "name email role")
            .populate("createdBy", "name email role");
        res.json(projects);
    } catch (err) {
        res.status(500).json({ message: err.message || "Failed to list projects" });
    }
});

router.put("/:id", auth, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Only admins can update projects" });
        }
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid project id" });
        }

        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: "Project not found" });

        if (typeof req.body.name === "string" && req.body.name.trim()) {
            project.name = req.body.name.trim();
        }

        if (Array.isArray(req.body.members)) {
            const memberIds = uniqueValidObjectIds(req.body.members);
            const creator = String(project.createdBy);
            if (!memberIds.includes(creator)) memberIds.push(creator);
            project.members = memberIds;
        }

        await project.save();
        await project.populate("members", "name email role");
        await project.populate("createdBy", "name email role");
        res.json(project);
    } catch (err) {
        res.status(500).json({ message: err.message || "Failed to update project" });
    }
});

module.exports = router;
