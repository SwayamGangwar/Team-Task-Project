const router = require("express").Router();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");

router.get("/", auth, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Only admins can list users" });
        }
        const users = await User.find().select("name email role").sort({ name: 1 }).lean();
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message || "Failed to list users" });
    }
});

router.patch("/:id/role", auth, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Only admins can change roles" });
        }
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid user id" });
        }

        const { role } = req.body;
        if (role !== "admin" && role !== "member") {
            return res.status(400).json({ message: "role must be admin or member" });
        }

        const target = await User.findById(req.params.id);
        if (!target) return res.status(404).json({ message: "User not found" });

        if (role === "member" && String(target._id) === String(req.user.id)) {
            const adminCount = await User.countDocuments({ role: "admin" });
            if (adminCount <= 1) {
                return res.status(400).json({
                    message: "Cannot demote the last administrator",
                });
            }
        }

        target.role = role;
        await target.save();

        const updated = await User.findById(req.params.id).select("name email role").lean();

        const payload = {
            user: {
                id: updated._id,
                name: updated.name,
                email: updated.email,
                role: updated.role,
            },
        };

        if (String(req.params.id) === String(req.user.id)) {
            payload.token = jwt.sign(
                { id: String(updated._id), role: updated.role },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );
        }

        res.json(payload);
    } catch (err) {
        res.status(500).json({ message: err.message || "Failed to update role" });
    }
});

module.exports = router;
