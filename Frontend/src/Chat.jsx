import "./Chat.css";
import { useContext, useState, useEffect, useRef } from "react";
import { MyContext } from "./MyContext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import "highlight.js/styles/github-dark.css";

const SUGGESTION_CHIPS = [
    { icon: "fa-lightbulb", text: "Explain quantum computing" },
    { icon: "fa-code", text: "Write a Python script" },
    { icon: "fa-pen-nib", text: "Help me write an email" },
    { icon: "fa-chart-line", text: "Analyze market trends" },
];

function Chat() {
    const { newChat, prevChats, reply, autoSpeak, setPrompt } = useContext(MyContext);
    const [latestReply, setLatestReply] = useState(null);
    const [speakingIdx, setSpeakingIdx] = useState(null);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [prevChats, latestReply]);

    useEffect(() => {
        if (!reply) {
            setLatestReply(null);
            return;
        }

        if (!prevChats?.length) return;

        const content = reply.split(" ");
        let idx = 0;
        const interval = setInterval(() => {
            setLatestReply(content.slice(0, idx + 1).join(" "));
            idx++;
            if (idx >= content.length) {
                clearInterval(interval);
                if (autoSpeak) {
                    speakText(reply, prevChats.length - 1);
                }
            }
        }, 30);

        return () => clearInterval(interval);
    }, [reply]);

    const speakText = (text, idx) => {
        if (!window.speechSynthesis) {
            alert("Text-to-speech is not supported in your browser.");
            return;
        }

        if (speakingIdx === idx) {
            window.speechSynthesis.cancel();
            setSpeakingIdx(null);
            return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setSpeakingIdx(null);
        utterance.onerror = () => setSpeakingIdx(null);
        setSpeakingIdx(idx);
        window.speechSynthesis.speak(utterance);
    };

    const handleChipClick = (text) => {
        setPrompt(text);
    };

    return (
        <div className="chatArea">
            {newChat && (
                <div className="welcomeScreen">
                    <div className="welcomeContent">
                        <div className="welcomeIconWrap">
                            <i className="fa-solid fa-bolt welcomeIcon"></i>
                        </div>
                        <h1 className="welcomeTitle">
                            How can I help you<br />
                            <span className="welcomeGradient">today?</span>
                        </h1>
                        <p className="welcomeSubtitle">
                            Ask me anything — code, concepts, creative writing, and more.
                        </p>
                        <div className="suggestionChips">
                            {SUGGESTION_CHIPS.map((chip, i) => (
                                <button
                                    key={i}
                                    className="chip"
                                    onClick={() => handleChipClick(chip.text)}
                                    id={`chip-${i}`}
                                >
                                    <i className={`fa-solid ${chip.icon} chipIcon`}></i>
                                    <span>{chip.text}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className={`chats ${newChat ? "hidden" : ""}`}>
                {
                    prevChats?.map((chat, idx) => {
                        const isLastAssistant = idx === prevChats.length - 1 && chat.role === "assistant";
                        const displayContent = (isLastAssistant && latestReply !== null) ? latestReply : chat.content;

                        return (
                            <div className={chat.role === "user" ? "userDiv" : "gptDiv"} key={idx}>
                                {
                                    chat.role === "user" ? (
                                        <p className="userMessage">{chat.content}</p>
                                    ) : (
                                        <>
                                            <div className="assistantAvatar">
                                                <i className="fa-solid fa-bolt"></i>
                                            </div>
                                <div className="assistantContent">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    rehypePlugins={[rehypeHighlight]}
                                                >
                                                    {displayContent}
                                                </ReactMarkdown>
                                                <div className="messageActions">
                                                    <button
                                                        className={`speakBtn ${speakingIdx === idx ? "speaking" : ""}`}
                                                        onClick={() => speakText(chat.content, idx)}
                                                        title={speakingIdx === idx ? "Stop speaking" : "Read aloud"}
                                                        id={`speak-btn-${idx}`}
                                                    >
                                                        <i className={`fa-solid ${speakingIdx === idx ? "fa-volume-xmark" : "fa-volume-high"}`}></i>
                                                        <span>{speakingIdx === idx ? "Stop" : "Listen"}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )
                                }
                            </div>
                        );
                    })
                }
                <div ref={chatEndRef} />
            </div>
        </div>
    );
}

export default Chat;