import { useState, useContext } from "react";
import { MyContext } from "./MyContext";
import apiFetch from "./api.js";

function AuthModal({ isOpen, onClose }) {
    const { login } = useContext(MyContext);
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
        const body = isLogin ? { email, password } : { username, email, password };

        try {
            // No token / onUnauthorized here: a 401 from /login means "wrong password",
            // not "session expired", so it must not trigger a logout.
            const res = await apiFetch(endpoint, {
                method: "POST",
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Authentication failed");
            } else {
                login(data.token, data.user);
                onClose();
            }
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const switchMode = () => {
        setIsLogin(!isLogin);
        setError("");
        setUsername("");
        setEmail("");
        setPassword("");
    };

    return (
        <div className="authOverlay" onClick={onClose}>
            <div className="authCard" onClick={(e) => e.stopPropagation()}>
                {/* ── Left Panel ── */}
                <div className="authLeft">
                    <div className="authLeftContent">
                        <div className="authBrand">
                            <div className="authBrandIcon">
                                <i className="fa-solid fa-bolt"></i>
                            </div>
                            <span className="authBrandName">NovaGPT</span>
                        </div>
                        <h2 className="authLeftTitle">
                            Your AI,<br />
                            <span className="authLeftGradient">reimagined.</span>
                        </h2>
                        <p className="authLeftSub">
                            Sign in to save your conversations and access them from anywhere.
                        </p>
                        <ul className="authFeatureList">
                            <li><i className="fa-solid fa-check-circle"></i> Unlimited chat history</li>
                            <li><i className="fa-solid fa-check-circle"></i> Sync across all devices</li>
                            <li><i className="fa-solid fa-check-circle"></i> Voice input & read-aloud</li>
                            <li><i className="fa-solid fa-check-circle"></i> Powered by latest AI models</li>
                        </ul>
                    </div>
                    <div className="authLeftGlow"></div>
                </div>

                {/* ── Right Panel ── */}
                <div className="authRight">
                    <button className="authCloseBtn" onClick={onClose} aria-label="Close">
                        <i className="fa-solid fa-xmark"></i>
                    </button>

                    {/* Tab switcher */}
                    <div className="authTabs">
                        <button
                            className={`authTab ${isLogin ? "active" : ""}`}
                            onClick={() => isLogin || switchMode()}
                        >
                            Sign In
                        </button>
                        <button
                            className={`authTab ${!isLogin ? "active" : ""}`}
                            onClick={() => isLogin && switchMode()}
                        >
                            Sign Up
                        </button>
                    </div>

                    <h3 className="authFormTitle">
                        {isLogin ? "Welcome back!" : "Create your account"}
                    </h3>
                    <p className="authFormSub">
                        {isLogin
                            ? "Enter your credentials to continue."
                            : "Fill in the details below to get started."}
                    </p>

                    {error && (
                        <div className="authError">
                            <i className="fa-solid fa-circle-exclamation"></i>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="authForm">
                        {!isLogin && (
                            <div className="authField">
                                <label className="authLabel">Username</label>
                                <div className="authInputWrap">
                                    <i className="fa-solid fa-user authInputIcon"></i>
                                    <input
                                        type="text"
                                        id="auth-username"
                                        name="username"
                                        required
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="John Doe"
                                        className="authInput"
                                        autoComplete="username"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="authField">
                            <label className="authLabel">Email</label>
                            <div className="authInputWrap">
                                <i className="fa-solid fa-envelope authInputIcon"></i>
                                <input
                                    type="email"
                                    id="auth-email"
                                    name="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="user@example.com"
                                    className="authInput"
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="authField">
                            <label className="authLabel">Password</label>
                            <div className="authInputWrap">
                                <i className="fa-solid fa-lock authInputIcon"></i>
                                <input
                                    type={showPass ? "text" : "password"}
                                    id="auth-password"
                                    name="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="authInput"
                                    autoComplete={isLogin ? "current-password" : "new-password"}
                                />
                                <button
                                    type="button"
                                    className="authEyeBtn"
                                    onClick={() => setShowPass(!showPass)}
                                    tabIndex={-1}
                                    aria-label="Toggle password"
                                >
                                    <i className={`fa-solid ${showPass ? "fa-eye-slash" : "fa-eye"}`}></i>
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="authSubmitBtn"
                            id="auth-submit-btn"
                        >
                            {loading ? (
                                <>
                                    <span className="authSpinner"></span>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <i className={`fa-solid ${isLogin ? "fa-right-to-bracket" : "fa-user-plus"}`}></i>
                                    {isLogin ? "Sign In" : "Create Account"}
                                </>
                            )}
                        </button>
                    </form>

                    <p className="authSwitchText">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                        <span onClick={switchMode} className="authSwitchLink">
                            {isLogin ? "Sign Up" : "Log In"}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default AuthModal;
