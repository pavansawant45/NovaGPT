import { useContext } from "react";
import { MyContext } from "./MyContext";

function SettingsModal({ isOpen, onClose }) {
    const { theme, toggleTheme, autoSpeak, setAutoSpeak } = useContext(MyContext);

    if (!isOpen) return null;

    return (
        <div className="modalOverlay" onClick={onClose}>
            <div className="modalContent settingsModal" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="modalHeader">
                    <div className="modalTitleGroup">
                        <div className="modalIcon settingsIcon">
                            <i className="fa-solid fa-gear"></i>
                        </div>
                        <h2>Settings</h2>
                    </div>
                    <button className="closeBtn" onClick={onClose}>&times;</button>
                </div>

                {/* Body */}
                <div className="settingsBody">

                    {/* Appearance */}
                    <div className="settingSection">
                        <div className="settingSectionLabel">Appearance</div>
                        <div className="settingRow">
                            <div className="settingInfo">
                                <div className="settingTitle">Theme</div>
                                <div className="settingDesc">Switch between Light and Dark interface</div>
                            </div>
                            <button className="themeToggleBtn" onClick={toggleTheme} id="theme-toggle-btn">
                                {theme === "dark" ? (
                                    <><i className="fa-solid fa-moon"></i> Dark</>
                                ) : (
                                    <><i className="fa-solid fa-sun"></i> Light</>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Audio */}
                    <div className="settingSection">
                        <div className="settingSectionLabel">Audio</div>
                        <div className="settingRow">
                            <div className="settingInfo">
                                <div className="settingTitle">Voice Auto-Read</div>
                                <div className="settingDesc">Automatically speak AI responses aloud</div>
                            </div>
                            <label className="toggleSwitch" id="auto-speak-toggle">
                                <input
                                    type="checkbox"
                                    checked={autoSpeak}
                                    onChange={(e) => setAutoSpeak(e.target.checked)}
                                />
                                <span className="toggleTrack">
                                    <span className="toggleThumb"></span>
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Model */}
                    <div className="settingSection">
                        <div className="settingSectionLabel">Model</div>
                        <div className="settingRow">
                            <div className="settingInfo">
                                <div className="settingTitle">Current Engine</div>
                                <div className="settingDesc">Groq Llama 3.3 · 70B Versatile</div>
                            </div>
                            <span className="activeBadge">
                                <span className="activeDot"></span>
                                Active
                            </span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default SettingsModal;
