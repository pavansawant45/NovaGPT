import "./Sidebar.css";
import { useContext, useEffect } from "react";
import { MyContext } from "./MyContext";
import { v1 as uuidv1} from "uuid";

function Sidebar() {
    const { allThreads, setAllThreads, currThreadId, setNewChat, setPrompt, setReply, setCurrThreadId, setPrevChats, token, user, setAuthModalOpen } = useContext(MyContext);

    const getHeaders = () => {
        const headers = { "Content-Type": "application/json" };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        return headers;
    };

    const getAllThreads = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/thread", { headers: getHeaders() });
            const res = await response.json();
            if (Array.isArray(res)) {
                const filteredData = res.map(thread => ({ threadId: thread.threadId, title: thread.title }));
                setAllThreads(filteredData);
            }
        } catch(err) {
            console.log(err);
        }
    };

    useEffect(() => {
        getAllThreads();
    }, [currThreadId, token]);

    const createNewChat = () => {
        setNewChat(true);
        setPrompt("");
        setReply(null);
        setCurrThreadId(uuidv1());
        setPrevChats([]);
    };

    const changeThread = async (newThreadId) => {
       setCurrThreadId(newThreadId);

       try {
            const response = await fetch(`http://localhost:5000/api/thread/${newThreadId}`, { headers: getHeaders() });
            const res = await response.json();
            if (Array.isArray(res)) {
                setPrevChats(res);
                setNewChat(false);
                setReply(null);
            }
       } catch (err) {
            console.log(err);
       }
    };

    const deleteThread = async (threadId) => {
        try {
            await fetch(`http://localhost:5000/api/thread/${threadId}`, {
                method: "DELETE",
                headers: getHeaders()
            });

            setAllThreads(prev => prev.filter(thread => thread.threadId !== threadId));

            if (threadId === currThreadId) {
                createNewChat();
            }
        } catch(err) {
            console.log(err);
        }
    };

    return (
        <section className="sidebar">
            {/* Top: Logo + New Chat button */}
            <div className="sidebarHeader">
                <div className="sidebarBrand" onClick={createNewChat} title="New Chat" style={{ cursor: "pointer" }}>
                    <div className="sidebarLogo">
                        <i className="fa-solid fa-bolt"></i>
                    </div>
                    <span className="sidebarBrandName">NovaGPT</span>
                </div>
                <button
                    className="newChatBtn"
                    onClick={createNewChat}
                    title="New Chat"
                    id="new-chat-btn"
                >
                    <i className="fa-solid fa-pen-to-square"></i>
                </button>
            </div>

            {/* Chat history */}
            <div className="historyLabel">Recent</div>
            <ul className="history">
                {
                    allThreads?.map((thread, idx) => (
                        <li key={idx}
                           onClick={() => changeThread(thread.threadId)}
                           className={thread.threadId === currThreadId ? "highlighted" : ""}
                           id={`thread-${idx}`}
                        >
                            <i className="fa-regular fa-message threadIcon"></i>
                            <span className="threadTitle">{thread.title}</span>
                            <i className="fa-solid fa-trash trashIcon"
                            onClick={(e) => {
                                e.stopPropagation();
                                deleteThread(thread.threadId);
                            }}
                            ></i>
                        </li>
                    ))
                }
            </ul>

            {/* Bottom: User info */}
            <div className="sidebarFooter">
                {user ? (
                    <div className="userCard">
                        <div className="userCardAvatar">
                            {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="userCardInfo">
                            <div className="userCardName">{user.username}</div>
                            <div className="userCardPlan">
                                <span className="planDot"></span>
                                Free Plan
                            </div>
                        </div>
                        <div className="userCardBadge">
                            <i className="fa-solid fa-check-circle"></i>
                        </div>
                    </div>
                ) : (
                    <div className="guestCard" onClick={() => setAuthModalOpen(true)} id="sign-in-sidebar">
                        <div className="guestIcon">
                            <i className="fa-solid fa-user"></i>
                        </div>
                        <div className="guestInfo">
                            <div className="guestTitle">Sign in to save chats</div>
                            <div className="guestSub">Sync across devices</div>
                        </div>
                        <i className="fa-solid fa-chevron-right guestArrow"></i>
                    </div>
                )}
                <div className="sidebarCredit">Made with ♥ by PavanSawant</div>
            </div>
        </section>
    );
}

export default Sidebar;