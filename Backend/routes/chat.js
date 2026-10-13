import express from "express";
import Thread from "../models/Thread.js";
import getOpenAIResponse from "../utils/openai.js";

const router = express.Router();

//Get all threads
router.get("/thread", async (req, res) => {
    try {
        const query = req.user ? { userId: req.user.id } : { userId: null };
        const threads = await Thread.find(query).sort({ updatedAt: -1 });
        res.json(threads);
    } catch (error) {
        console.error("Error fetching threads:", error);
        res.status(500).json({ error: "Error fetching threads" });
    }
});

//get a specific thread(Or chat) by threadId
router.get("/thread/:threadId", async (req, res) => { 
    const { threadId } = req.params;
    try {
        const thread = await Thread.findOne({ threadId });
        if (!thread) {
            return res.status(404).json({ error: "Thread not found" });
        }
        res.json(thread.messages);
    } catch (error) {
        console.error("Error fetching thread:", error);
        res.status(500).json({ error: "Error fetching chat"});
    }
});  

//Delete a specific thread (Or chat) by threadId
router.delete("/thread/:threadId", async (req, res) => {
    const { threadId } = req.params;
    try {
        const deletedThread = await Thread.findOneAndDelete({ threadId });
        if(!deletedThread) {
            return res.status(404).json({ error: "Thread not found" });
        }
        res.status(200).json({ success: "Thread deleted successfully" });
    
    } catch (error) {
        console.error("Error deleting thread:", error);
        res.status(500).json({ error: "Error deleting chat" });
    }
});

//To create a new chat with a message and a reply from the assistant
router.post("/chat", async (req, res) => {
    const { threadId, message } = req.body;

    if(!threadId || !message || typeof message !== "string" || !message.trim()) {
        return res.status(400).json({ error: "Valid threadId and non-empty message are required" });
    }

    try {
        let thread = await Thread.findOne({ threadId });
        if (!thread) {
            //create a new thread in DB if it doesn't exist
            thread = new Thread({ 
                threadId,
                userId: req.user ? req.user.id : null,
                title: message.trim().slice(0, 30),
                messages: [{ role: "user", content: message.trim() }] 
            });
        } else {
            //add the new message to the existing thread
            thread.messages.push({ role: "user", content: message.trim() });
            if (req.user && !thread.userId) {
                thread.userId = req.user.id;
            }
        }

        // Pass full thread messages array to LLM for multi-turn memory
        const assistantReply = await getOpenAIResponse(thread.messages);
        thread.messages.push({ role: "assistant", content: assistantReply });
        await thread.save();
        res.json({ reply: assistantReply });

    } catch (error) {
        console.error("Error handling chat:", error);
        res.status(500).json({ error: "Error handling chat" });
    }
});


export default router;
