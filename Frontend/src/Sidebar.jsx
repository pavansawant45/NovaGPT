import "./Sidebar.css";
import { useContext, useEffect, useRef, useState } from "react";
import { MyContext } from "./MyContext";
import { v4 as uuidv4 } from "uuid";
import apiFetch from "./api.js";
// Must match the backend default page size (GET /api/thread, limit=20).
const PAGE_SIZE = 20;

function Sidebar() {
    const {
        allThreads, setAllThreads, currThreadId, setNewChat, setPrompt,
        setReply, setCurrThreadId, setPrevChats, token, guestId, user,
        logout, setAuthModalOpen
    } = useContext(MyContext);

    // Pagination state. The backend cursor is "<updatedAt>|<_id>" of the LAST thread
    // received. It lives in a ref because it never needs to trigger a re-render.
    const cursorRef = useRef(null);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    const toListItem = (thread) => ({ threadId: thread.threadId, title: thread.title });

    // Pure helper (no state updates): builds the cursor for the NEXT page from the last item.
    const cursorFrom = (page) => {
        const last = page[page.length - 1];
        return last ? `${last.updatedAt}|${last._id}` : null;
    };

    // Loads the next (older) page and appends it.
    const loadMore = async () => {
        if (!cursorRef.current || loadingMore) return;
        setLoadingMore(true);
        try {
            const response = await apiFetch(
                `/api/thread?limit=${PAGE_SIZE}&cursor=${encodeURIComponent(cursorRef.current)}`,
                {},
                { token, guestId, onUnauthorized: logout }
            );
            const res = await response.json();
            if (Array.isArray(res)) {
                // De-duplicate: a thread you just chatted in moves to the top and could
                // otherwise show up again in an older page.
                setAllThreads(prev => {
                    const seen = new Set(prev.map(t => t.threadId));
                    return [...prev, ...res.filter(t => !seen.has(t.threadId)).map(toListItem)];
                });
                cursorRef.current = cursorFrom(res);
                setHasMore(res.length === PAGE_SIZE);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingMore(false);
        }
    };

    // Loads the first (newest) page and resets the list whenever the open chat or the
    // login state changes. `cancelled` ignores a response that arrives after a newer
    // request has started (for example when logging in or out quickly).
    useEffect(() => {
        let cancelled = false;
        const loadFirstPage = async () => {
            try {
                const response = await apiFetch(
                    `/api/thread?limit=${PAGE_SIZE}`,
                    {},
                    { token, guestId, onUnauthorized: logout }
                );
                const res = await response.json();
                if (!cancelled && Array.isArray(res)) {
                    setAllThreads(res.map(toListItem));
                    cursorRef.current = cursorFrom(res);
                    setHasMore(res.length === PAGE_SIZE);
                }
            } catch (err) {
                console.error(err);
            }
        };
        loadFirstPage();
        return () => { cancelled = true; };
        // `logout` is recreated on every render, so it is deliberately left out of the dependencies.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currThreadId, token, guestId]);

    const createNewChat = () => {
        setNewChat(true);
        setPrompt("");
        setReply(null);
        setCurrThreadId(uuidv4()); // v4 UUID matches backend zod schema
        setPrevChats([]);
    };

    const changeThread = async (newThreadId) => {
        setCurrThreadId(newThreadId);
        try {
            const response = await apiFetch(
                `/api/thread/${newThreadId}`,
                {},
                { token, guestId, onUnauthorized: logout }
            );
            const res = await response.json();
            if (Array.isArray(res)) {
                setPrevChats(res);
                setNewChat(false);
                setReply(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const deleteThread = async (threadId) => {
        try {
            await apiFetch(
                `/api/thread/${threadId}`,
                { method: "DELETE" },
                { token, guestId, onUnauthorized: logout }
            );
            setAllThreads(prev => prev.filter(thread => thread.threadId !== threadId));
            if (threadId === currThreadId) {
                createNewChat();
            }
        } catch (err) {
            console.error(err);
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
                        <li key={thread.threadId}
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
                {hasMore && (
                    <li className="loadMoreItem">
                        <button
                            className="loadMoreBtn"
                            onClick={loadMore}
                            disabled={loadingMore}
                            id="load-more-threads"
                        >
                            {loadingMore ? "Loading…" : "Load more"}
                        </button>
                    </li>
                )}
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