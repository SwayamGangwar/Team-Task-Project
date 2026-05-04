const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { BOOTSTRAP_ADMIN_EMAIL } = require("../config/bootstrapAdmin");

const emailOk = (email) =>
    typeof email === "string" && email.trim().length > 3 && email.includes("@");

router.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || typeof name !== "string" || !name.trim()) {
            return res.status(400).json({ message: "Name is required" });
        }
        if (!emailOk(email)) {
            return res.status(400).json({ message: "Valid email is required" });
        }
        if (!password || typeof password !== "string" || password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const normalizedEmail = email.trim().toLowerCase();
        if (normalizedEmail === BOOTSTRAP_ADMIN_EMAIL) {
            return res.status(403).json({
                message:
                    "This email is reserved for the system administrator. Use a different email to register as a team member, or sign in with the admin account.",
            });
        }

        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
            return res.status(409).json({ message: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: "member",
        });

        res.status(201).json(user);
    } catch (err) {
        res.status(500).json({ message: err.message || "Signup failed" });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!emailOk(email) || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email: email.trim().toLowerCase() }).select(
            "+password"
        );
        if (!user) return res.status(400).json({ message: "Invalid email or password" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

        const token = jwt.sign(
            { id: String(user._id), role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ message: err.message || "Login failed" });
    }
});

module.exports = router;
