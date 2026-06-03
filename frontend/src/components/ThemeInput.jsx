import { useState } from "react";
import audioEngine from "../util/audioEngine";

const FEATURED_ADVENTURES = [
    {
        title: "Isle of Whispers",
        theme: "Pirates looking for a cursed treasure on a haunted island",
        icon: "🏴‍☠️",
        tag: "High Seas Fantasy",
        color: "linear-gradient(135deg, #1e293b, #334155)"
    },
    {
        title: "Nebula Station Zero",
        theme: "A cosmic anomaly trapping a crew on a derelict space station",
        icon: "🚀",
        tag: "Sci-Fi Horror",
        color: "linear-gradient(135deg, #1e1b4b, #312e81)"
    },
    {
        title: "The Cursed Obelisk",
        theme: "An archeologist exploring ancient underground ruins with active magical traps",
        icon: "🔮",
        tag: "Gothic Fantasy",
        color: "linear-gradient(135deg, #2e1065, #4c1d95)"
    },
    {
        title: "Neon Syndicate",
        theme: "A rogue hacker infiltrating a mega-corporation's neural network",
        icon: "🌆",
        tag: "Cyberpunk Tech",
        color: "linear-gradient(135deg, #180828, #3b0764)"
    },
    {
        title: "Shadowcrest Manor",
        theme: "Investigating the spooky disappearance of a family in a Victorian mansion",
        icon: "👻",
        tag: "Survival Horror",
        color: "linear-gradient(135deg, #18181b, #27272a)"
    }
];

function ThemeInput({ onSubmit }) {
    const [theme, setTheme] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        audioEngine.playSelect();
        if (!theme.trim()) {
            setError("Please describe your story's theme");
            return;
        }
        onSubmit(theme);
    };

    const handleFeaturedClick = (adventureTheme) => {
        audioEngine.playSelect();
        onSubmit(adventureTheme);
    };

    const handleMouseEnter = () => {
        audioEngine.playClick();
    };

    return (
        <div className="theme-input-container glass-panel animate-fade-in">
            <h2>✨ AI Adventure Generator</h2>
            <p className="subtitle">Enter any concept to construct a unique, branching interactive text game</p>
            
            <form onSubmit={handleSubmit} className="theme-form">
                <div className="input-group">
                    <input
                        id="theme-input"
                        type="text"
                        value={theme}
                        onChange={(e) => {
                            setTheme(e.target.value);
                            if (error) setError("");
                        }}
                        placeholder="Describe your setting! (e.g. Roman gladiator, deep-sea submarine, wizard school...)"
                        className={error ? 'error' : ''}
                        maxLength={100}
                    />
                    {error && <p id="theme-error-text" className="error-text">{error}</p>}
                </div>
                <button
                    id="generate-button"
                    type="submit"
                    className="generate-btn animate-pulse-glow"
                    onMouseEnter={handleMouseEnter}
                >
                    Forge Story 🛠️
                </button>
            </form>

            <div className="featured-section">
                <h3>Or Choose a Preset Adventure:</h3>
                <div className="featured-grid">
                    {FEATURED_ADVENTURES.map((adv, index) => (
                        <div
                            key={index}
                            className="featured-card"
                            style={{ "--card-bg": adv.color }}
                            onClick={() => handleFeaturedClick(adv.theme)}
                            onMouseEnter={handleMouseEnter}
                        >
                            <span className="card-tag">{adv.tag}</span>
                            <div className="card-icon">{adv.icon}</div>
                            <h4>{adv.title}</h4>
                            <p>{adv.theme}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default ThemeInput;