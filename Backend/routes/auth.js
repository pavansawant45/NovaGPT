import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import User from "../models/User.js";
import config from "../config.js";
import authMiddleware, { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// ── Zod schemas ──────────────────────────────────────────────────────────────

const registerSchema = z.object({
    username: z.string().min(2, "Username must be at least 2 characters")
                        .max(40, "Username must be at most 40 characters")
                        .trim(),
    email: z.string().email("Invalid email format").toLowerCase().trim(),
    password: z.string().min(8, "Password must be at least 8 characters")
});

const loginSchema = z.object({
    email: z.string().email("Invalid email format").toLowerCase().trim(),
    password: z.string().min(1, "Password is required")
});

// ── Register ─────────────────────────────────────────────────────────────────

router.post("/register", async (req, res, next) => {
    // Validate with zod; send back the first validation error
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const { username, email, password } = parsed.data;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "User with this email already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({ username, email, password: hashedPassword });
        await user.save();

        const token = jwt.sign(
            { id: user._id, username: user.username, email: user.email },
            config.jwtSecret,
            { expiresIn: "7d" }
        );

        res.status(201).json({
            token,
            user: { id: user._id, username: user.username, email: user.email }
        });
    } catch (error) {
        next(error); // passes to central error handler
    }
});

// ── Login ─────────────────────────────────────────────────────────────────────

router.post("/login", async (req, res, next) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const { email, password } = parsed.data;

    try {
        const user = await User.findOne({ email });
        const isMatch = user && await bcrypt.compare(password, user.password);

        // Generic message regardless of whether user exists or password is wrong.
        // This prevents user enumeration attacks.
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const token = jwt.sign(
            { id: user._id, username: user.username, email: user.email },
            config.jwtSecret,
            { expiresIn: "7d" }
        );

        res.json({
            token,
            user: { id: user._id, username: user.username, email: user.email }
        });
    } catch (error) {
        next(error);
    }
});

// ── Get current user ──────────────────────────────────────────────────────────

// requireAuth enforces a valid JWT; authMiddleware runs first to populate req.user
router.get("/me", authMiddleware, requireAuth, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json({ user });
    } catch (error) {
        next(error);
    }
});

export default router;
