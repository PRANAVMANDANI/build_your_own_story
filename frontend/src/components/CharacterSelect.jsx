import { useState } from "react";
import audioEngine from "../util/audioEngine";

const CLASSES = [
    {
        id: "warrior",
        name: "Warrior",
        emoji: "⚔️",
        desc: "A fearless fighter who charges head-on. Courageous choices earn bonus momentum.",
        bonus: "⚡ +20% Momentum on Courageous actions",
        bonusType: "courageous",
        items: ["Iron Sword", "Steel Shield"]
    },
    {
        id: "rogue",
        name: "Rogue",
        emoji: "🗡️",
        desc: "A shadow operative who outsmarts enemies. Cunning choices earn bonus momentum.",
        bonus: "⚡ +20% Momentum on Cunning actions",
        bonusType: "cunning",
        items: ["Dual Daggers", "Lockpick"]
    },
    {
        id: "mage",
        name: "Mage",
        emoji: "🔮",
        desc: "A spellcaster of arcane wisdom. Gains momentum on any non-reckless choice.",
        bonus: "✨ Gains momentum on Cautious & Courageous choices",
        bonusType: "mage",
        items: ["Glowing Staff", "Mana Potion"]
    },
    {
        id: "explorer",
        name: "Explorer",
        emoji: "🧭",
        desc: "A scout who reads the terrain. Starts with higher starting momentum.",
        bonus: "🧭 Starts with 70 Momentum instead of 50",
        bonusType: "explorer",
        items: ["Brass Lantern", "Pocket Map"]
    }
];

function CharacterSelect({ onSelect }) {
    const [name, setName] = useState("");
    const [selectedClassId, setSelectedClassId] = useState("explorer");

    const selectedClass = CLASSES.find(c => c.id === selectedClassId);

    const handleSubmit = (e) => {
        e.preventDefault();
        audioEngine.playSelect();
        const finalName = name.trim() || "Adventurer";
        onSelect({
            name: finalName,
            classId: selectedClass.id,
            className: selectedClass.name,
            classEmoji: selectedClass.emoji,
            bonusType: selectedClass.bonusType,
            momentum: selectedClass.id === "explorer" ? 70 : 50,
            items: [...selectedClass.items],
            choiceHistory: []
        });
    };

    const handleClassClick = (id) => {
        audioEngine.playClick();
        setSelectedClassId(id);
    };

    return (
        <div className="character-select-container glass-panel animate-fade-in">
            <h2>Customize Your Hero</h2>
            <p className="subtitle">Your class shapes how your choices fuel your momentum</p>

            <form onSubmit={handleSubmit} className="char-form">
                <div className="input-group">
                    <label htmlFor="char-name">Character Name</label>
                    <input
                        id="char-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter adventurer name..."
                        maxLength={20}
                        autoComplete="off"
                    />
                </div>

                <div className="class-grid-label">Choose Your Archetype</div>
                <div className="class-grid">
                    {CLASSES.map((cls) => (
                        <div
                            key={cls.id}
                            className={`class-card ${selectedClassId === cls.id ? "selected" : ""}`}
                            onClick={() => handleClassClick(cls.id)}
                        >
                            <div className="class-emoji">{cls.emoji}</div>
                            <h3>{cls.name}</h3>
                            <p className="class-desc">{cls.desc}</p>
                            <div className="class-bonus-tag">{cls.bonus}</div>
                        </div>
                    ))}
                </div>

                <div className="starting-gear-preview">
                    <h4>Starting Gear:</h4>
                    <div className="gear-tags">
                        {selectedClass.items.map((item, index) => (
                            <span key={index} className="gear-tag">📦 {item}</span>
                        ))}
                    </div>
                </div>

                <button type="submit" className="start-btn">
                    Begin Adventure 🚀
                </button>
            </form>
        </div>
    );
}

export default CharacterSelect;
