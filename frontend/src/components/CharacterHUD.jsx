import { useMemo } from "react";

const CONSEQUENCE_META = {
    courageous: { label: "Courageous", icon: "⚔️", color: "#f59e0b" },
    cunning:    { label: "Cunning",    icon: "🗡️", color: "#a78bfa" },
    cautious:   { label: "Cautious",   icon: "🛡️", color: "#34d399" },
    reckless:   { label: "Reckless",   icon: "💥", color: "#f87171" },
};

function CharacterHUD({ character, chapterDepth, maxDepth }) {
    if (!character) return null;

    const momentum = character.momentum ?? 50;
    const choiceHistory = character.choiceHistory ?? [];

    // Determine dominant style
    const styleCounts = { courageous: 0, cunning: 0, cautious: 0, reckless: 0 };
    choiceHistory.forEach(c => { if (styleCounts[c] !== undefined) styleCounts[c]++; });
    const dominantStyle = Object.entries(styleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const meta = dominantStyle ? CONSEQUENCE_META[dominantStyle] : null;

    // Momentum bar color
    let momentumColor = "#34d399";
    if (momentum < 30) momentumColor = "#f87171";
    else if (momentum < 60) momentumColor = "#f59e0b";

    const chapterNum = Math.min(chapterDepth + 1, maxDepth || 5);
    const chapterProgress = maxDepth ? ((chapterDepth) / maxDepth) * 100 : 0;

    return (
        <div className="character-hud glass-panel animate-fade-in">
            <div className="hud-main">
                {/* Identity */}
                <div className="hud-identity">
                    <span className="hud-emoji">{character.classEmoji}</span>
                    <div>
                        <div className="hud-name">{character.name}</div>
                        <div className="hud-class">{character.className}</div>
                    </div>
                </div>

                {/* Momentum Bar */}
                <div className="hud-stat-bar">
                    <div className="stat-label">
                        <span>⚡ Momentum</span>
                        <span>{Math.round(momentum)}%</span>
                    </div>
                    <div className="bar-bg">
                        <div
                            className="bar-fill momentum-fill"
                            style={{ width: `${momentum}%`, backgroundColor: momentumColor }}
                        />
                    </div>
                </div>

                {/* Chapter Progress */}
                <div className="hud-stat-bar">
                    <div className="stat-label">
                        <span>📖 Chapter</span>
                        <span>{chapterNum} / {maxDepth || 5}</span>
                    </div>
                    <div className="bar-bg">
                        <div
                            className="bar-fill chapter-fill"
                            style={{ width: `${chapterProgress}%` }}
                        />
                    </div>
                </div>

                {/* Decision Style */}
                {meta && (
                    <div className="hud-style">
                        <div className="stat-label">🧠 Your Style</div>
                        <div className="style-badge" style={{ borderColor: meta.color, color: meta.color }}>
                            {meta.icon} {meta.label}
                        </div>
                    </div>
                )}

                {/* Inventory */}
                <div className="hud-inventory">
                    <div className="stat-label">🎒 Inventory</div>
                    <div className="inventory-tags">
                        {character.items.length === 0 ? (
                            <span className="empty-inventory">Empty</span>
                        ) : (
                            character.items.map((item, idx) => (
                                <span key={idx} className="inventory-tag" title={item}>
                                    {item}
                                </span>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CharacterHUD;
