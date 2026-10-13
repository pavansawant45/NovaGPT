import "dotenv/config";

const getOpenAIResponse = async (messagesInput) => {
  const formattedMessages = Array.isArray(messagesInput)
    ? messagesInput.map(m => ({ role: m.role, content: m.content }))
    : [{ role: "user", content: messagesInput }];

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      messages: formattedMessages
    })
  };

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", options);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Groq API Error (${response.status}):`, errorText);
      throw new Error(`Groq API returned status ${response.status}`);
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Sorry, I could not process your request.";
  } catch (error) {
    console.error("Error in getOpenAIResponse:", error);
    throw error;
  }
};

export default getOpenAIResponse;