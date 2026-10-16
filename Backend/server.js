// config.js is imported first — it validates env vars and exits if any are missing.
import config from "./config.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import chatRoutes from "./routes/chat.js";
import authRoutes from "./routes/auth.js";
import authMiddleware from "./middleware/auth.js";

const app = express();

// ── Security middleware ───────────────────────────────────────────────────────

// helmet sets ~15 security-related HTTP headers in one call
app.use(helmet());

// Restrict CORS to the exact frontend origin configured in env
app.use(cors({
    origin: config.clientOrigin,
    credentials: true
}));

// 100 kb limit prevents large-payload DoS attacks
app.use(express.json({ limit: "100kb" }));

// ── Rate limiters ─────────────────────────────────────────────────────────────

// Strict limit for auth endpoints to slow down brute-force / credential stuffing
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,  // Return rate limit info in RateLimit-* headers
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." }
});

// Moderate limit on chat to prevent API cost abuse
const chatLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many messages, please slow down." }
});

// ── Routes ────────────────────────────────────────────────────────────────────

app.use("/api/auth", authLimiter, authRoutes);
// authMiddleware runs on all /api routes — populates req.user or sets it to null
app.use("/api", authMiddleware, chatRoutes);

// Separate, tighter limiter applied after authMiddleware so req.user is available
// (useful for future per-user limits); applied specifically to /api/chat
app.use("/api/chat", chatLimiter);

// ── Central error handler ─────────────────────────────────────────────────────
// Must be defined AFTER all routes. Express recognises it by the 4-arg signature.
// Stack traces never reach the client — only a safe message is returned.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = status < 500 ? err.message : "An internal server error occurred";
    if (status >= 500) {
        console.error("[error]", err);
    }
    res.status(status).json({ error: message });
});

// ── DB + server startup ───────────────────────────────────────────────────────

const connectDB = async () => {
    try {
        await mongoose.connect(config.mongoUri);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
};

const startServer = async () => {
    await connectDB();
    app.listen(config.port, () => {
        console.log(`Server is running on port ${config.port}`);
    });
};

startServer();
