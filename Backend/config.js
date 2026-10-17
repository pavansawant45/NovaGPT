// config.js – single source of truth for all environment variables.
// Validated at startup so the server never starts in a broken state.
import "dotenv/config";

const required = ["MONGODB_URI", "JWT_SECRET", "GROQ_API_KEY", "CLIENT_ORIGIN"];

for (const key of required) {
    if (!process.env[key]) {
        console.error(`[config] Missing required env var: ${key}`);
        process.exit(1);
    }
}

const config = {
    port: process.env.PORT || 5000,
    mongoUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    groqApiKey: process.env.GROQ_API_KEY,
    clientOrigin: process.env.CLIENT_ORIGIN,
    // Optional: Groq model override, falls back to a known-good default
    groqModel: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
};

export default config;
