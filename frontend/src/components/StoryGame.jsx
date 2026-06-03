import { useState, useEffect, useRef, useMemo } from 'react';
import CharacterSelect from './CharacterSelect';
import CharacterHUD from './CharacterHUD';
import AdventureMap from './AdventureMap';
import StoryEndSummary from './StoryEndSummary';
import audioEngine from '../util/audioEngine';

const CONSEQUENCE_META = {
    courageous: { label: "Courageous", icon: "⚔️", color: "#f59e0b", bgClass: "badge-courageous" },
    cunning:    { label: "Cunning",    icon: "🗡️", color: "#a78bfa", bgClass: "badge-cunning"    },
    cautious:   { label: "Cautious",   icon: "🛡️", color: "#34d399", bgClass: "badge-cautious"   },
    reckless:   { label: "Reckless",   icon: "💥", color: "#f87171", bgClass: "badge-reckless"   },
};

function StoryGame({ story, onNewStory }) {
    // Character / RPG state
    const [character, setCharacter] = useState(null);
    const [notifications, setNotifications] = useState([]);

    // Navigation
    const [currentNodeId, setCurrentNodeId] = useState(null);
    const [currentNode, setCurrentNode] = useState(null);
    const [options, setOptions] = useState([]);
    const [isEnding, setIsEnding] = useState(false);
    const [isWinningEnding, setIsWinningEnding] = useState(false);
    const [visitedNodes, setVisitedNodes] = useState([]);
    const [chapterDepth, setChapterDepth] = useState(0);
    const [showEndSummary, setShowEndSummary] = useState(false);

    // UI
    const [showMap, setShowMap] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(audioEngine.soundOn);

    // Typewriter
    const [displayedText, setDisplayedText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const textToType = currentNode?.content || "";
    const typingTimerRef = useRef(null);

    // Genre
    const genre = story ? detectGenre(story.title, story.theme || "") : "default";

    // Compute tree max depth
    const maxDepth = useMemo(() => {
        if (!story?.root_node) return 5;
        let deepest = 0;
        const traverse = (nodeId, depth) => {
            const node = story.root_node[nodeId];
            if (!node) return;
            deepest = Math.max(deepest, depth);
            if (node.options) node.options.forEach(opt => traverse(opt.node_id, depth + 1));
        };
        const root = Object.values(story.root_node).find(n => n.is_root);
        if (root) traverse(root.id, 0);
        return Math.max(deepest, 1);
    }, [story]);

    function detectGenre(title, themeText) {
        const text = `${title} ${themeText}`.toLowerCase();
        if (text.includes("space") || text.includes("star") || text.includes("galaxy") || text.includes("planet") || text.includes("alien") || text.includes("spaceship") || text.includes("orbit")) return "space";
        if (text.includes("magic") || text.includes("spell") || text.includes("wizard") || text.includes("dragon") || text.includes("sword") || text.includes("castle") || text.includes("dungeon") || text.includes("elf") || text.includes("quest")) return "fantasy";
        if (text.includes("horror") || text.includes("ghost") || text.includes("spooky") || text.includes("haunted") || text.includes("zombie") || text.includes("vampire") || text.includes("creepy") || text.includes("cursed") || text.includes("manor") || text.includes("asylum")) return "horror";
        if (text.includes("pirate") || text.includes("sea") || text.includes("ocean") || text.includes("sail") || text.includes("island") || text.includes("shipwreck") || text.includes("treasure")) return "ocean";
        if (text.includes("cyberpunk") || text.includes("hack") || text.includes("neo") || text.includes("grid") || text.includes("hacker") || text.includes("matrix") || text.includes("corporation")) return "cyberpunk";
        return "default";
    }

    const toggleSound = () => {
        const nextSound = audioEngine.toggleSound();
        setSoundEnabled(nextSound);
        if (nextSound) audioEngine.startAmbient(genre);
        else audioEngine.stopAmbient();
    };

    useEffect(() => {
        if (character) audioEngine.startAmbient(genre);
        return () => audioEngine.stopAmbient();
    }, [genre, character]);

    useEffect(() => {
        if (story?.root_node) {
            const nodes = Object.values(story.root_node);
            const rootNode = nodes.find(n => n.is_root) || nodes[0];
            if (rootNode) setCurrentNodeId(rootNode.id);
        }
    }, [story]);

    // Node transition — compute momentum & items
    useEffect(() => {
        if (!currentNodeId || !story?.root_node || !character) return;
        const node = story.root_node[currentNodeId];
        if (!node) return;

        setCurrentNode(node);
        setIsEnding(node.is_ending);
        setIsWinningEnding(node.is_winning_ending);

        // Track visited
        setVisitedNodes(prev => prev.includes(currentNodeId) ? prev : [...prev, currentNodeId]);

        // Calculate depth for this node
        const computeDepth = (targetId) => {
            const allNodes = Object.values(story.root_node);
            const parentMap = {};
            allNodes.forEach(n => {
                if (n.options) n.options.forEach(opt => { parentMap[opt.node_id] = n.id; });
            });
            let d = 0, cur = targetId;
            while (parentMap[cur]) { d++; cur = parentMap[cur]; }
            return d;
        };
        setChapterDepth(computeDepth(currentNodeId));

        // Audio
        if (node.is_ending) {
            if (node.is_winning_ending) audioEngine.playWin();
            else audioEngine.playLose();
        } else {
            audioEngine.playSelect();
        }

        // Options
        if (!node.is_ending && node.options?.length > 0) {
            setOptions(node.options);
        } else {
            setOptions([]);
            // Show end summary after a short delay so the text reads first
            if (node.is_ending) {
                setTimeout(() => setShowEndSummary(true), 3000);
            }
        }
    }, [currentNodeId, story, character === null]);

    // Word-by-word typewriter
    useEffect(() => {
        if (!textToType) return;
        if (typingTimerRef.current) clearInterval(typingTimerRef.current);
        setDisplayedText("");
        setIsTyping(true);
        const words = textToType.split(" ");
        let index = 0, built = "";
        typingTimerRef.current = setInterval(() => {
            if (index < words.length) {
                built += (index === 0 ? "" : " ") + words[index];
                setDisplayedText(built);
                index++;
            } else {
                clearInterval(typingTimerRef.current);
                setIsTyping(false);
            }
        }, 35);
        return () => { if (typingTimerRef.current) clearInterval(typingTimerRef.current); };
    }, [textToType]);

    // Auto-dismiss notifications
    useEffect(() => {
        if (notifications.length > 0) {
            const t = setTimeout(() => setNotifications(prev => prev.slice(1)), 3500);
            return () => clearTimeout(t);
        }
    }, [notifications]);

    // Item parser (kept — works well)
    const parseItemsFromText = (text, currentItems) => {
        const textLower = text.toLowerCase();
        const itemRegex = /(?:pick up|acquire|find|obtain|take|receives?|discover|pocket)\s+(?:a|an|the)\s+([a-zA-Z0-9\s\-]{3,20})(?:\.|,|$|and|but)/g;
        let match;
        const newItems = [...currentItems];
        const gainedItems = [];
        while ((match = itemRegex.exec(textLower)) !== null) {
            const itemCandidate = match[1].trim();
            const itemClean = itemCandidate.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
            const isJunk = ["few", "some", "the", "something", "it", "this", "way", "path", "moment", "place"].includes(itemClean.toLowerCase());
            if (itemClean && !newItems.includes(itemClean) && !isJunk) {
                newItems.push(itemClean);
                gainedItems.push(itemClean);
            }
        }
        return { items: newItems, gainedItems };
    };

    // Momentum calculation based on consequence + class bonus
    const calcMomentumChange = (consequence, classId) => {
        const base = { courageous: 12, cunning: 12, cautious: 8, reckless: -15 };
        let delta = base[consequence] ?? 8;
        // Class bonuses
        if (classId === "warrior" && consequence === "courageous") delta = Math.round(delta * 1.2);
        if (classId === "rogue"   && consequence === "cunning")    delta = Math.round(delta * 1.2);
        if (classId === "mage"    && (consequence === "cautious" || consequence === "courageous")) delta = Math.round(delta * 1.15);
        return delta;
    };

    const chooseOption = (option) => {
        audioEngine.playClick();
        const consequence = option.consequence || "cautious";
        const momentumDelta = calcMomentumChange(consequence, character?.classId);
        const newMomentum = Math.max(5, Math.min(100, (character?.momentum ?? 50) + momentumDelta));

        // Parse items from the chosen option's destination node
        const destNode = story?.root_node?.[option.node_id];
        const { items: newItems, gainedItems } = parseItemsFromText(
            destNode?.content || "",
            character?.items || []
        );

        const newChoiceHistory = [...(character?.choiceHistory || []), consequence];
        setCharacter(prev => ({
            ...prev,
            momentum: newMomentum,
            choiceHistory: newChoiceHistory,
            items: newItems
        }));

        // Notifications
        const notifs = [];
        const meta = CONSEQUENCE_META[consequence];
        if (momentumDelta > 0) {
            notifs.push({ id: Math.random(), text: `${meta.icon} ${meta.label} choice! ⚡ +${momentumDelta} Momentum`, type: "momentum-up" });
        } else {
            notifs.push({ id: Math.random(), text: `${meta.icon} ${meta.label} choice! ⚡ ${momentumDelta} Momentum`, type: "momentum-down" });
        }
        gainedItems.forEach(item => {
            notifs.push({ id: Math.random(), text: `🎒 Gained: "${item}"`, type: "item" });
        });
        if (notifs.length > 0) setNotifications(prev => [...prev, ...notifs]);

        setCurrentNodeId(option.node_id);
    };

    const handleCharacterSelect = (charData) => {
        setCharacter(charData);
        if (story?.root_node) {
            const nodes = Object.values(story.root_node);
            const rootNode = nodes.find(n => n.is_root) || nodes[0];
            if (rootNode) setCurrentNodeId(rootNode.id);
        }
    };

    const handleRewind = (nodeId) => {
        // Find the choice history up to this node
        const idx = visitedNodes.indexOf(nodeId);
        if (idx !== -1) {
            const trimmedHistory = (character?.choiceHistory || []).slice(0, Math.max(0, idx));
            const momentumBase = 50;
            const recomputedMomentum = trimmedHistory.reduce((acc, c) => {
                const delta = calcMomentumChange(c, character?.classId);
                return Math.max(5, Math.min(100, acc + delta));
            }, momentumBase);
            setCharacter(prev => ({
                ...prev,
                momentum: recomputedMomentum,
                choiceHistory: trimmedHistory
            }));
            setVisitedNodes(visitedNodes.slice(0, idx + 1));
        }
        setShowEndSummary(false);
        setCurrentNodeId(nodeId);
    };

    const restartStory = () => {
        audioEngine.playSelect();
        if (story?.root_node) {
            const nodes = Object.values(story.root_node);
            const rootNode = nodes.find(n => n.is_root) || nodes[0];
            if (rootNode && character) {
                setCharacter(prev => ({ ...prev, momentum: 50, choiceHistory: [], items: getStartingItems(prev.classId) }));
                setVisitedNodes([rootNode.id]);
                setShowEndSummary(false);
                setCurrentNodeId(rootNode.id);
            }
        }
    };

    const getStartingItems = (classId) => ({
        warrior:  ["Iron Sword", "Steel Shield"],
        rogue:    ["Dual Daggers", "Lockpick"],
        mage:     ["Glowing Staff", "Mana Potion"],
        explorer: ["Brass Lantern", "Pocket Map"],
    }[classId] || []);

    const renderGenreParticles = (themeGenre) => {
        if (themeGenre === "space") return (
            <div className="ambient-particles space-particles">
                {[...Array(20)].map((_, i) => (
                    <div key={i} className="star-particle" style={{
                        left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 5}s`, animationDuration: `${3 + Math.random() * 4}s`
                    }} />
                ))}
            </div>
        );
        if (themeGenre === "horror") return (
            <div className="ambient-particles horror-particles">
                {[...Array(15)].map((_, i) => (
                    <div key={i} className="ember-particle" style={{
                        left: `${Math.random() * 100}%`, bottom: `0%`,
                        animationDelay: `${Math.random() * 6}s`, animationDuration: `${5 + Math.random() * 5}s`
                    }} />
                ))}
            </div>
        );
        if (themeGenre === "fantasy") return (
            <div className="ambient-particles fantasy-particles">
                {[...Array(15)].map((_, i) => (
                    <div key={i} className="sparkle-particle" style={{
                        left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 4}s`, animationDuration: `${2 + Math.random() * 3}s`
                    }} />
                ))}
            </div>
        );
        if (themeGenre === "ocean") return (
            <div className="ambient-particles ocean-particles">
                {[...Array(20)].map((_, i) => (
                    <div key={i} className="bubble-particle" style={{
                        left: `${Math.random() * 100}%`, bottom: `-5%`,
                        animationDelay: `${Math.random() * 5}s`, animationDuration: `${4 + Math.random() * 5}s`
                    }} />
                ))}
            </div>
        );
        if (themeGenre === "cyberpunk") return (
            <div className="ambient-particles cyberpunk-particles">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="glitch-line" style={{
                        left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 8}s`, animationDuration: `${6 + Math.random() * 6}s`
                    }} />
                ))}
            </div>
        );
        return null;
    };

    if (!character) return <CharacterSelect onSelect={handleCharacterSelect} />;

    return (
        <div className={`story-game theme-${genre}`}>
            {renderGenreParticles(genre)}

            {/* Notifications */}
            <div className="notifications-container">
                {notifications.map(notif => (
                    <div key={notif.id} className={`notification-toast toast-${notif.type} animate-slide-in`}>
                        {notif.text}
                    </div>
                ))}
            </div>

            <header className="story-header glass-panel">
                <div className="story-nav-controls">
                    <button className="sound-toggle-btn" onClick={toggleSound} title="Toggle Audio">
                        {soundEnabled ? "🔊 Sound: On" : "🔇 Sound: Off"}
                    </button>
                    <button className="map-toggle-btn animate-pulse-glow" onClick={() => { audioEngine.playClick(); setShowMap(true); }}>
                        🗺️ Adventure Map
                    </button>
                </div>
                <h2 id="story-title">📖 {story.title}</h2>
            </header>

            <CharacterHUD
                character={character}
                chapterDepth={chapterDepth}
                maxDepth={maxDepth}
            />

            <div className="story-content glass-panel">
                {currentNode && (
                    <div className="story-node">
                        <p id="story-content-text" className="narrative-text">
                            {displayedText}
                            {isTyping && <span className="typewriter-cursor">|</span>}
                        </p>

                        {!isTyping && (
                            <div className="choices-section animate-fade-in">
                                {isEnding ? (
                                    <div className={`story-ending ${isWinningEnding ? "win-ending" : "lose-ending"}`}>
                                        <h3 id="ending-header">{isWinningEnding ? "🏆 Triumph!" : "🚪 The End"}</h3>
                                        <p id="ending-text">
                                            {isWinningEnding
                                                ? "Congratulations! You reached a winning resolution to your saga."
                                                : "Your adventure has reached its natural conclusion."}
                                        </p>
                                        <p className="summary-cta">✨ Your adventure summary is loading...</p>
                                    </div>
                                ) : (
                                    <div className="story-options">
                                        <h3 id="options-header">Select your destiny:</h3>
                                        <div className="options-list">
                                            {options.map((option, index) => {
                                                const meta = CONSEQUENCE_META[option.consequence] || CONSEQUENCE_META.cautious;
                                                return (
                                                    <button
                                                        key={index}
                                                        id={`option-${option.node_id}`}
                                                        onClick={() => chooseOption(option)}
                                                        className="option-btn"
                                                        style={{ animationDelay: `${index * 0.1}s` }}
                                                    >
                                                        <div className="option-top-row">
                                                            <span className={`consequence-badge ${meta.bgClass}`}>
                                                                {meta.icon} {meta.label}
                                                            </span>
                                                        </div>
                                                        <span className="option-text">
                                                            <span className="option-arrow">➔</span> {option.text}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {!isTyping && !isEnding && (
                    <div className="story-controls">
                        <button id="restart-button" onClick={restartStory} className="reset-btn">
                            🌀 Restart Adventure
                        </button>
                        {onNewStory && (
                            <button id="new-story-button" onClick={() => { audioEngine.playClick(); onNewStory(); }} className="new-story-btn">
                                🎨 Forge New Concept
                            </button>
                        )}
                    </div>
                )}
            </div>

            {showMap && (
                <AdventureMap
                    story={story}
                    visitedNodes={visitedNodes}
                    currentNodeId={currentNodeId}
                    onRewind={handleRewind}
                    onClose={() => { audioEngine.playClick(); setShowMap(false); }}
                />
            )}

            {showEndSummary && (
                <StoryEndSummary
                    character={character}
                    isWinningEnding={isWinningEnding}
                    choiceHistory={character?.choiceHistory || []}
                    visitedNodes={visitedNodes}
                    storyTitle={story?.title || ""}
                    onRestart={restartStory}
                    onNewStory={onNewStory}
                />
            )}
        </div>
    );
}


export default StoryGame;