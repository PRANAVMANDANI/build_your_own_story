import audioEngine from "../util/audioEngine";

const CONSEQUENCE_META = {
    courageous: { label: "Courageous", icon: "⚔️", color: "#f59e0b", desc: "You charged bravely into the unknown." },
    cunning:    { label: "Cunning",    icon: "🗡️", color: "#a78bfa", desc: "You outsmarted every obstacle." },
    cautious:   { label: "Cautious",   icon: "🛡️", color: "#34d399", desc: "You read every sign before acting." },
    reckless:   { label: "Reckless",   icon: "💥", color: "#f87171", desc: "You gambled and lived dangerously." },
};

const PERSONALITIES = [
    {
        id: "daring_hero",
        name: "The Daring Hero",
        icon: "🦁",
        desc: "You lead with courage and face every challenge head-on. Legends are written about people like you.",
        condition: (counts) => counts.courageous >= counts.cunning && counts.courageous >= counts.cautious
    },
    {
        id: "cunning_fox",
        name: "The Cunning Fox",
        icon: "🦊",
        desc: "You outmaneuver every opponent with wit and deception. Strategy is your greatest weapon.",
        condition: (counts) => counts.cunning >= counts.courageous && counts.cunning >= counts.cautious
    },
    {
        id: "careful_scholar",
        name: "The Careful Scholar",
        icon: "🦉",
        desc: "You observe before you act. Your patience and wisdom lead to outcomes others never see coming.",
        condition: (counts) => counts.cautious >= counts.courageous && counts.cautious >= counts.cunning
    },
    {
        id: "daredevil",
        name: "The Daredevil",
        icon: "⚡",
        desc: "You throw caution to the wind and live on the edge. Every moment is a thrilling gamble.",
        condition: (counts) => counts.reckless > (counts.courageous + counts.cunning + counts.cautious) / 3
    },
];

function StoryEndSummary({ character, isWinningEnding, choiceHistory, visitedNodes, storyTitle, onRestart, onNewStory }) {
    const counts = { courageous: 0, cunning: 0, cautious: 0, reckless: 0 };
    choiceHistory.forEach(c => { if (counts[c] !== undefined) counts[c]++; });
    const total = choiceHistory.length;

    const personality = PERSONALITIES.find(p => p.condition(counts)) || PERSONALITIES[0];

    const handleRestart = () => {
        audioEngine.playSelect();
        onRestart();
    };

    const handleNew = () => {
        audioEngine.playClick();
        onNewStory();
    };

    return (
        <div className="end-summary-overlay animate-fade-in">
            <div className="end-summary-card glass-panel animate-scale-up">

                {/* Outcome Banner */}
                <div className={`outcome-banner ${isWinningEnding ? "banner-win" : "banner-lose"}`}>
                    <span className="outcome-icon">{isWinningEnding ? "🏆" : "💀"}</span>
                    <div>
                        <div className="outcome-title">{isWinningEnding ? "Victory!" : "Defeat"}</div>
                        <div className="outcome-story">{storyTitle}</div>
                    </div>
                </div>

                {/* Personality Result */}
                <div className="personality-card">
                    <div className="personality-icon">{personality.icon}</div>
                    <div className="personality-name">{personality.name}</div>
                    <div className="personality-desc">{personality.desc}</div>
                </div>

                {/* Choice Breakdown */}
                {total > 0 && (
                    <div className="choice-breakdown">
                        <div className="breakdown-title">Your Decisions ({total} choices made)</div>
                        <div className="breakdown-bars">
                            {Object.entries(counts).map(([type, count]) => {
                                if (count === 0) return null;
                                const pct = Math.round((count / total) * 100);
                                const meta = CONSEQUENCE_META[type];
                                return (
                                    <div key={type} className="breakdown-row">
                                        <span className="breakdown-label" style={{ color: meta.color }}>
                                            {meta.icon} {meta.label}
                                        </span>
                                        <div className="breakdown-bar-bg">
                                            <div
                                                className="breakdown-bar-fill"
                                                style={{ width: `${pct}%`, backgroundColor: meta.color }}
                                            />
                                        </div>
                                        <span className="breakdown-pct">{count}×</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Stats Row */}
                <div className="summary-stats-row">
                    <div className="summary-stat">
                        <div className="summary-stat-val">{visitedNodes.length}</div>
                        <div className="summary-stat-label">Scenes Visited</div>
                    </div>
                    <div className="summary-stat">
                        <div className="summary-stat-val">{total}</div>
                        <div className="summary-stat-label">Choices Made</div>
                    </div>
                    <div className="summary-stat">
                        <div className="summary-stat-val">{character?.momentum ? Math.round(character.momentum) : 50}%</div>
                        <div className="summary-stat-label">Final Momentum</div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="summary-actions">
                    <button className="reset-btn summary-action-btn" onClick={handleRestart}>
                        🌀 Play Again
                    </button>
                    {onNewStory && (
                        <button className="new-story-btn summary-action-btn" onClick={handleNew}>
                            🎨 New Story
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default StoryEndSummary;
