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
const ownerFilter = (req) => {
    if (req.user?.id) {
        return { userId: req.user.id };
    }

    const guestId = req.headers["x-guest-id"];
    if (guestId && typeof guestId === "string" && guestId.trim()) {
        return { guestId: guestId.trim() };
    }

    // Neither a JWT user nor a guest header — reject outright.
    const err = new Error("No owner identifier provided");
    err.status = 403;
    throw err;
};

export default ownerFilter;
