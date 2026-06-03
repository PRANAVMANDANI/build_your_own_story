import { useState, useEffect } from "react";

const LOADING_STEPS = [
    "Aligning cosmic story particles...",
    "Drafting crucial decisions & branches...",
    "Weaving atmospheric descriptions...",
    "Calculating potential story endings...",
    "Writing custom dialogue elements...",
    "Polishing plot twists and choices...",
    "Assembling the narrative database..."
];

function LoadingStatus({ theme }) {
    const [stepIndex, setStepIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
        }, 2200);

        return () => clearInterval(interval);
    }, []);

    return (
        <div id="loading-status-container" className="loading-container glass-panel animate-fade-in">
            <h2 id="loading-header">Forging Your Adventure...</h2>
            
            <div className="loading-animation">
                <div id="loading-spinner" className="spinner"></div>
            </div>

            <div className="loading-message-slider">
                <p key={stepIndex} className="loading-status-step animate-slide-up">
                    ⚙️ {LOADING_STEPS[stepIndex]}
                </p>
            </div>

            <p id="loading-info-text" className="loading-info">
                Creating custom interactive {theme ? `"${theme}"` : "story"} pathways. This takes 10-15 seconds.
            </p>
        </div>
    );
}

export default LoadingStatus;