// ownerFilter.js – returns the correct MongoDB filter for thread ownership.
//
// Design: a single helper rather than duplicating the if/else in every route.
// It throws a structured error object that the central error handler can catch
// and convert to a 403 — keeping route handlers clean.
//
// Alternative rejected: putting this logic inside authMiddleware. That would
// mix two concerns (token verification vs. ownership semantics) in one place.

/**
 * Returns { userId } for authenticated requests or { guestId } for anonymous
 * requests. Throws if neither identifier is present.
 *
 * @param {import("express").Request} req
 * @returns {{ userId: string } | { guestId: string }}
 */

// UUID, versions 1-8 (crypto.randomUUID() produces v4).
// Guest ids act like secret keys, so they must be unguessable: a value like "a" is rejected.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const httpError = (status, message) => {
    const err = new Error(message);
    err.status = status;
    return err;
};

const ownerFilter = (req) => {
    if (req.user?.id) {
        return { userId: req.user.id };
    }

    const raw = req.headers["x-guest-id"];
    if (raw === undefined) {
        throw httpError(403, "No owner identifier provided");
    }

    const guestId = typeof raw === "string" ? raw.trim() : "";
    if (!UUID_RE.test(guestId)) {
        throw httpError(400, "Invalid guest id");
    }

    return { guestId: guestId.toLowerCase() };
};

export default ownerFilter;
