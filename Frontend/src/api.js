// api.js – central fetch wrapper for NovaGPT.
//
// Responsibilities:
//   1. Prepend the API base URL (from VITE_API_URL env var)
//   2. Attach Authorization header for logged-in users
//   3. Attach X-Guest-Id header for anonymous users
//   4. Auto-logout on 401 so stale tokens don't silently fail
//
// Alternative rejected: axios — adds ~40kb, and native fetch is fine here.
// Alternative rejected: a React hook — this helper is also called outside
//   components (e.g. from event handlers), so a plain function is simpler.

// In development, fall back to the local backend when VITE_API_URL is not set.
// In a production build a missing VITE_API_URL becomes "" (same-origin), so the
// misconfiguration shows up as an obvious 404 instead of requests to "undefined/api/...".
const BASE_URL = (
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? "http://localhost:5000" : "")
).replace(/\/$/, "");

/**
 * @param {string} path - e.g. "/api/chat"
 * @param {RequestInit} options - standard fetch options
 * @param {{ token?: string, guestId?: string, onUnauthorized?: () => void }} auth
 */
const apiFetch = async (path, options = {}, { token, guestId, onUnauthorized } = {}) => {
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    } else if (guestId) {
        // Anonymous session identified by a UUID stored in localStorage
        headers["X-Guest-Id"] = guestId;
    }

    const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers
    });

    // Centrally handle expired / invalid token — trigger logout in one place
    if (response.status === 401 && onUnauthorized) {
        onUnauthorized();
    }

    return response;
};

export default apiFetch;
