import './App.css';
import './modal-extras.css';
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import AuthModal from "./AuthModal";
import SettingsModal from "./SettingsModal";
import UpgradeModal from "./UpgradeModal";
import { MyContext } from "./MyContext";
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from "uuid"; // v4 = random UUID, matching crypto.randomUUID output format

function App() {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState(null);
  const [currThreadId, setCurrThreadId] = useState(() => uuidv4());
  const [prevChats, setPrevChats] = useState([]);
  const [newChat, setNewChat] = useState(true);
  const [allThreads, setAllThreads] = useState([]);

  // Feature States
  const [theme, setTheme] = useState(() => localStorage.getItem("novagpt_theme") || "dark");
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("novagpt_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("novagpt_token") || null);
  const [autoSpeak, setAutoSpeak] = useState(false);

  // Guest session identifier — generated once per browser, persisted in localStorage.
  // crypto.randomUUID is available in all modern browsers and produces a v4 UUID.
  const [guestId] = useState(() => {
    const existing = localStorage.getItem("novagpt_guest_id");
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem("novagpt_guest_id", id);
    return id;
  });

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("novagpt_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  };

  const login = (authToken, userData) => {
    setToken(authToken);
    setUser(userData);
    localStorage.setItem("novagpt_token", authToken);
    localStorage.setItem("novagpt_user", JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("novagpt_token");
    localStorage.removeItem("novagpt_user");
    setCurrThreadId(uuidv4());
    setPrevChats([]);
    setNewChat(true);
  };

  const providerValues = {
    prompt, setPrompt,
    reply, setReply,
    currThreadId, setCurrThreadId,
    newChat, setNewChat,
    prevChats, setPrevChats,
    allThreads, setAllThreads,
    theme, toggleTheme,
    user, token, login, logout,
    autoSpeak, setAutoSpeak,
    guestId,               // available to all consumers for X-Guest-Id header
    setAuthModalOpen,
    setSettingsModalOpen,
    setUpgradeModalOpen
  };

  return (
    <div className="app">
      <MyContext.Provider value={providerValues}>
        <Sidebar />
        <ChatWindow />
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        <SettingsModal isOpen={settingsModalOpen} onClose={() => setSettingsModalOpen(false)} />
        <UpgradeModal isOpen={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
      </MyContext.Provider>
    </div>
  );
}

export default App;
