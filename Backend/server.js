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

// API responses are per-user. "no-store" stops browsers and proxies from caching them,
// so one user's chat list can never be replayed to someone else on a shared computer.
app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

// ── Rate limiters ─────────────────────────────────────────────────────────────

const makeLimiter = (windowMs, limit, message, extra = {}) =>
    rateLimit({
        windowMs,
        limit,
        standardHeaders: true,   // send RateLimit-* headers
        legacyHeaders: false,
        message: { error: message },
        ...extra
    });

// Counts FAILED logins only (successful ones are skipped), so a shared network
// such as campus Wi-Fi is not locked out by legitimate users, while password
// guessing is still capped at 10 tries per 15 minutes per IP.
const loginLimiter = makeLimiter(
    15 * 60 * 1000, 10, "Too many login attempts, please try again later.",
    { skipSuccessfulRequests: true }
);

// Slows down mass account creation.
const registerLimiter = makeLimiter(
    60 * 60 * 1000, 20, "Too many sign-ups from this network, please try again later."
);

// Protects the paid LLM quota. Keyed by IP address.
const chatLimiter = makeLimiter(
    10 * 60 * 1000, 30, "Too many messages, please slow down."
);

// ── Routes ────────────────────────────────────────────────────────────────────

// IMPORTANT: Express runs middleware in registration order, so every limiter
// must be registered BEFORE the routes it protects. (A limiter registered after
// the route is never reached once the route has sent its response.)
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth/register", registerLimiter);
app.use("/api/chat", chatLimiter);

app.use("/api/auth", authRoutes);
// authMiddleware runs on all remaining /api routes — populates req.user or sets it to null
app.use("/api", authMiddleware, chatRoutes);

// Unknown routes get a JSON 404 instead of Express's default HTML page
app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});

// ── Central error handler ─────────────────────────────────────────────────────
// Must be defined AFTER all routes. Express recognises it by the 4-arg signature.
// Stack traces never reach the client — only a safe message is returned.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ error: "Invalid JSON body" });
    }
    if (err.type === "entity.too.large") {
        return res.status(413).json({ error: "Request body too large" });
    }
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
