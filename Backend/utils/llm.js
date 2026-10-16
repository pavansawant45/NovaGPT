// llm.js – wraps the Groq chat-completions endpoint.
// Named "llm" rather than "openai" because Groq is the actual provider;
// using the OpenAI-compatible API surface is an implementation detail.
import config from "../config.js";

/**
 * Send a conversation history to the LLM and return the assistant's reply.
 *
 * @param {Array<{ role: "user"|"assistant", content: string }>} messagesInput
 * @returns {Promise<string>}
 */
const getLLMResponse = async (messagesInput) => {
    const formattedMessages = Array.isArray(messagesInput)
        ? messagesInput.map(m => ({ role: m.role, content: m.content }))
        : [{ role: "user", content: messagesInput }];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${config.groqApiKey}`
        },
        body: JSON.stringify({
            // Model is configurable via GROQ_MODEL env var (see config.js)
            model: config.groqModel,
            messages: formattedMessages
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Groq API Error (${response.status}):`, errorText);
        throw new Error(`Groq API returned status ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Sorry, I could not process your request.";
};

export default getLLMResponse;
