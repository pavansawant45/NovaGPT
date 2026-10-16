import jwt from "jsonwebtoken";
import config from "../config.js";

// Uses config.jwtSecret — no hardcoded fallback so a missing secret
// is caught at startup (config.js) rather than silently using an insecure value.
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        // No token: treat as unauthenticated (guest flow handled by ownerFilter)
        req.user = null;
        return next();
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};

// Use this on routes that require a logged-in user (e.g. /auth/me)
export const requireAuth = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
    }
    next();
};

export default authMiddleware;
