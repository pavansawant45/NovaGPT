import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import User from "../models/User.js";
import config from "../config.js";
import authMiddleware, { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// ── Zod schemas ──────────────────────────────────────────────────────────────

// .trim() comes FIRST so the length checks apply to the trimmed value.
// Passwords are capped at 72 characters because bcrypt ignores everything after 72 bytes.
const registerSchema = z.object({
    username: z.string().trim()
        .min(2, "Username must be at least 2 characters")
        .max(40, "Username must be at most 40 characters"),
    email: z.string().trim().toLowerCase().email("Invalid email format").max(254),
    password: z.string().min(8, "Password must be at least 8 characters")
        .max(72, "Password must be at most 72 characters")
});

const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email("Invalid email format").max(254),
    password: z.string().min(1, "Password is required")
        .max(72, "Password must be at most 72 characters")
});

// Hash of a throwaway password, computed once at startup (same cost factor as real hashes).
// Login compares against it when the email is unknown so both cases take equally long.
const DUMMY_HASH = bcrypt.hashSync("timing-equalizer-not-a-real-password", 10);

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
        // Two simultaneous sign-ups with the same email: the loser hits the unique index.
        if (error?.code === 11000) {
            return res.status(400).json({ error: "User with this email already exists" });
        }
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
        // ALWAYS run bcrypt.compare, even when the user does not exist (against DUMMY_HASH).
        // `user && await bcrypt.compare(...)` skips the ~100 ms hash check for unknown emails,
        // so response time alone would reveal which emails are registered.
        const hashToCheck = user ? user.password : DUMMY_HASH;
        const passwordOk = await bcrypt.compare(password, hashToCheck);

        // Same status and message whether the email or the password was wrong.
        if (!user || !passwordOk) {
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
