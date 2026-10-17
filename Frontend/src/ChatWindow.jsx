import "./ChatWindow.css";
import Chat from "./Chat";
import { MyContext } from "./MyContext";
import { useContext, useState, useRef, useEffect } from "react";
import { ScaleLoader } from "react-spinners";
import apiFetch from "./api.js";

function ChatWindow() {
    const {
        prompt, setPrompt, setReply, currThreadId, setPrevChats, setNewChat,
        token, guestId, user, logout, setAuthModalOpen, setSettingsModalOpen, setUpgradeModalOpen
    } = useContext(MyContext);

    const [loading, setLoading] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const profileRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSpeechInput = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech recognition is not supported in your browser.");
            return;
        }

        if (isListening) return; // prevent double-click during active session

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onstart = () => setIsListening(true);

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setPrompt(prev => (prev ? prev + " " + transcript : transcript));
            setIsListening(false);
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            setIsListening(false);
        };

        recognition.onend = () => setIsListening(false);

        recognition.start();
    };

    const getReply = async () => {
        const userMessage = prompt.trim();
        if (!userMessage || loading) return;

        setPrevChats(prev => [...prev, { role: "user", content: userMessage }]);
        setPrompt("");
        setNewChat(false);
        setLoading(true);

        try {
            // apiFetch attaches the correct auth header and handles 401 logout
            const response = await apiFetch(
                "/api/chat",
                {
                    method: "POST",
                    body: JSON.stringify({ message: userMessage, threadId: currThreadId })
                },
                { token, guestId, onUnauthorized: logout }
            );

            const res = await response.json();
            const assistantContent = res.reply || "Error getting response.";
            setReply(assistantContent);
            setPrevChats(prev => [...prev, { role: "assistant", content: assistantContent }]);

        } catch (err) {
            console.error(err);
            setPrevChats(prev => [...prev, { role: "assistant", content: "Failed to fetch response. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="chatWindow">
            {/* ── Floating Profile Button (top-right) ── */}
            <div className="floatingProfile" ref={profileRef}>
                <div
                    className={`userIconDiv ${isProfileOpen ? "active" : ""}`}
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    title={user ? user.username : "Guest"}
                    id="profile-btn"
                >
                    <span className="userIcon">
                        {user
                            ? user.username.charAt(0).toUpperCase()
                            : <i className="fa-solid fa-user"></i>
                        }
                    </span>
                    <i className={`fa-solid fa-chevron-down navChevron ${isProfileOpen ? "open" : ""}`}></i>
                </div>

                {isProfileOpen && (
                    <div className="dropDown" id="profile-dropdown">
                        {user && (
                            <div className="dropDownUser">
                                <span className="dropDownUserAvatar">{user.username.charAt(0).toUpperCase()}</span>
                                <div>
                                    <div className="dropDownUserName">{user.username}</div>
                                    <div className="dropDownUserPlan">Free Plan</div>
                                </div>
                            </div>
                        )}
                        <div className="dropDownDivider"></div>
                        <div className="dropDownItem" id="settings-btn" onClick={() => { setSettingsModalOpen(true); setIsProfileOpen(false); }}>
                            <i className="fa-solid fa-gear"></i> Settings
                        </div>
                        <div className="dropDownItem" id="upgrade-btn" onClick={() => { setUpgradeModalOpen(true); setIsProfileOpen(false); }}>
                            <i className="fa-solid fa-star"></i> Upgrade Plan
                        </div>
                        <div className="dropDownDivider"></div>
                        {user ? (
                            <div className="dropDownItem logout" id="logout-btn" onClick={() => { logout(); setIsProfileOpen(false); }}>
                                <i className="fa-solid fa-arrow-right-from-bracket"></i> Log Out
                            </div>
                        ) : (
                            <div className="dropDownItem" id="login-btn" onClick={() => { setAuthModalOpen(true); setIsProfileOpen(false); }}>
                                <i className="fa-solid fa-right-to-bracket"></i> Log In / Sign Up
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Chat Messages ── */}
            <Chat />

            {/* ── Loading Spinner ── */}
            {loading && (
                <div className="loadingBar">
                    <ScaleLoader color="var(--accent-color)" loading={loading} height={18} width={3} />
                </div>
            )}

            {/* ── Chat Input ── */}
            <div className="chatInput">
                <div className="inputBox">
                    <textarea
                        placeholder="Ask anything..."
                        id="chat-input"
                        name="message"
                        aria-label="Message NovaGPT"
                        value={prompt}
                        disabled={loading}
                        rows={1}
                        onChange={(e) => {
                            setPrompt(e.target.value);
                            e.target.style.height = "auto";
                            e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                getReply();
                            }
                        }}
                    />
                    <div className="inputControls">
                        <div
                            className={`micBtn ${isListening ? 'recording' : ''}`}
                            onClick={handleSpeechInput}
                            title={isListening ? "Listening..." : "Voice Input"}
                            id="mic-btn"
                        >
                            <i className="fa-solid fa-microphone"></i>
                            {isListening && <span className="micRing"></span>}
                        </div>
                        <div
                            id="submit"
                            onClick={getReply}
                            className={!prompt.trim() || loading ? "disabled" : ""}
                            title="Send Message"
                        >
                            <i className="fa-solid fa-paper-plane"></i>
                        </div>
                    </div>
                </div>
                <p className="info">
                    NovaGPT can make mistakes. Verify important information.
                </p>
            </div>
        </div>
    );
}

export default ChatWindow;