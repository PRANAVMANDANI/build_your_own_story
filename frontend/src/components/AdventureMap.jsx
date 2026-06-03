import { useState, useMemo } from "react";
import audioEngine from "../util/audioEngine";

function AdventureMap({ story, visitedNodes, currentNodeId, onRewind, onClose }) {
    const [confirmNode, setConfirmNode] = useState(null);

    // Calculate layout dynamically
    const { nodes, connections, mapHeight } = useMemo(() => {
        if (!story || !story.root_node) return { nodes: [], connections: [], mapHeight: 400 };

        const nodesDict = story.root_node;
        const allNodes = Object.values(nodesDict);
        const rootNode = allNodes.find(n => n.is_root) || allNodes[0];
        
        if (!rootNode) return { nodes: [], connections: [], mapHeight: 400 };

        const levels = {}; // depth -> array of node IDs
        const parentMap = {}; // childId -> parentId
        const nodeInfo = {};

        // Helper to check if a node has been visited
        const isVisited = (id) => visitedNodes.includes(Number(id)) || visitedNodes.includes(String(id));

        const traverse = (nodeId, depth = 0) => {
            if (!nodeId || nodeInfo[nodeId]) return;
            const node = nodesDict[nodeId];
            if (!node) return;

            if (!levels[depth]) levels[depth] = [];
            if (!levels[depth].includes(nodeId)) {
                levels[depth].push(nodeId);
            }

            nodeInfo[nodeId] = {
                id: nodeId,
                depth,
                content: node.content,
                isEnding: node.is_ending,
                isWinningEnding: node.is_winning_ending,
                options: node.options || [],
                visited: isVisited(nodeId),
                title: node.is_root ? "Start" : node.is_ending ? (node.is_winning_ending ? "🏆 Victory" : "💀 The End") : `Choice #${nodeId}`
            };

            if (node.options && !node.is_ending) {
                node.options.forEach(opt => {
                    if (opt.node_id) {
                        parentMap[opt.node_id] = nodeId;
                        
                        // We traverse the child node if:
                        // 1. The parent was visited, to show the child.
                        // We always traverse everything to build the full static structure,
                        // but we will hide content/text of unvisited ones.
                        traverse(opt.node_id, depth + 1);
                    }
                });
            }
        };

        traverse(rootNode.id, 0);

        const width = 760;
        const levelHeight = 110;
        const layoutNodes = {};
        const depths = Object.keys(levels).map(Number);
        const maxDepth = depths.length > 0 ? Math.max(...depths) : 0;

        Object.keys(levels).forEach(depthStr => {
            const depth = Number(depthStr);
            const levelNodeIds = levels[depth];
            const count = levelNodeIds.length;
            const y = 60 + depth * levelHeight;

            levelNodeIds.forEach((nodeId, index) => {
                // Spread nodes horizontally
                const x = count === 1 ? width / 2 : (width / (count + 1)) * (index + 1);
                layoutNodes[nodeId] = {
                    ...nodeInfo[nodeId],
                    x,
                    y
                };
            });
        });

        const connections = [];
        Object.keys(parentMap).forEach(childId => {
            const parentId = parentMap[childId];
            const parent = layoutNodes[parentId];
            const child = layoutNodes[childId];
            
            if (parent && child) {
                const parentVisited = isVisited(parentId);
                const childVisited = isVisited(childId);

                connections.push({
                    id: `${parentId}-${childId}`,
                    x1: parent.x,
                    y1: parent.y,
                    x2: child.x,
                    y2: child.y,
                    parentVisited,
                    childVisited
                });
            }
        });

        return {
            nodes: Object.values(layoutNodes),
            connections,
            mapHeight: 120 + maxDepth * levelHeight
        };
    }, [story, visitedNodes]);

    const handleNodeClick = (node) => {
        if (!node.visited) {
            audioEngine.playClick();
            return; // Can't select unvisited nodes
        }
        if (node.id === currentNodeId) return;

        audioEngine.playSelect();
        setConfirmNode(node);
    };

    const handleConfirmRewind = () => {
        if (confirmNode) {
            onRewind(confirmNode.id);
            setConfirmNode(null);
            onClose();
        }
    };

    return (
        <div className="map-modal-overlay animate-fade-in">
            <div className="map-modal-content glass-panel animate-scale-up">
                <header className="map-header">
                    <h2>🗺️ Adventure Chronology Map</h2>
                    <button className="close-map-btn" onClick={onClose}>×</button>
                </header>

                <div className="map-legend">
                    <span className="legend-item"><span className="legend-dot active"></span> Current Location</span>
                    <span className="legend-item"><span className="legend-dot visited"></span> Visited (Click to Rewind Time)</span>
                    <span className="legend-item"><span className="legend-dot locked"></span> Unexplored Branch</span>
                    <span className="legend-item"><span className="legend-dot ending"></span> Ending Node</span>
                </div>

                <div className="map-svg-container">
                    <svg width="100%" height={mapHeight} viewBox={`0 0 760 ${mapHeight}`} className="map-svg">
                        {/* Define glowing drop shadows */}
                        <defs>
                            <filter id="glow-visited" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="3" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                            <filter id="glow-active" x="-30%" y="-30%" width="160%" height="160%">
                                <feGaussianBlur stdDeviation="5" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>

                        {/* Render connection lines */}
                        {connections.map((conn) => {
                            const isPathTaken = conn.parentVisited && conn.childVisited;
                            return (
                                <line
                                    key={conn.id}
                                    x1={conn.x1}
                                    y1={conn.y1}
                                    x2={conn.x2}
                                    y2={conn.y2}
                                    className={`map-connection ${isPathTaken ? "taken" : "locked"}`}
                                />
                            );
                        })}

                        {/* Render nodes */}
                        {nodes.map((node) => {
                            const isActive = node.id === currentNodeId;
                            const isExplored = node.visited;
                            
                            let nodeClass = "map-node";
                            if (isActive) nodeClass += " active";
                            else if (isExplored) nodeClass += " visited";
                            else nodeClass += " locked";

                            if (node.isEnding) nodeClass += " ending";

                            return (
                                <g 
                                    key={node.id} 
                                    transform={`translate(${node.x}, ${node.y})`}
                                    className={nodeClass}
                                    onClick={() => handleNodeClick(node)}
                                >
                                    {/* Active Outer Pulsing Ring */}
                                    {isActive && (
                                        <circle r="22" className="active-ring animate-pulse-glow" />
                                    )}

                                    {/* Core Circle */}
                                    <circle r="16" className="node-circle" />

                                    {/* Icon / Content in center */}
                                    <text y="4" textAnchor="middle" className="node-symbol">
                                        {isActive ? "📍" : node.isEnding ? (node.isWinningEnding ? "🏆" : "💀") : isExplored ? "✓" : "🔒"}
                                    </text>

                                    {/* Hover tooltip label */}
                                    <title>
                                        {isExplored 
                                            ? `${node.title}\n"${node.content.substring(0, 60)}..."` 
                                            : "Locked Choice (?)"}
                                    </title>

                                    {/* Text Label Below Node */}
                                    <text y="32" textAnchor="middle" className="node-label">
                                        {isExplored ? node.title : "?"}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>

                <div className="map-footer-hint">
                    💡 <i>Clicking on any previously visited node in the timeline lets you rewind time and explore another choice.</i>
                </div>
            </div>

            {/* Rewind Confirmation Modal */}
            {confirmNode && (
                <div className="confirm-modal-overlay">
                    <div className="confirm-modal glass-panel animate-scale-up">
                        <h3>⏳ Activate Time Travel?</h3>
                        <p>
                            Are you sure you want to rewind your adventure back to <b>{confirmNode.title}</b>?
                        </p>
                        <p className="consequence">
                            Your stats and inventory snapshots from that moment will be restored.
                        </p>
                        <div className="confirm-actions">
                            <button className="cancel-btn" onClick={() => setConfirmNode(null)}>
                                Cancel
                            </button>
                            <button className="confirm-btn" onClick={handleConfirmRewind}>
                                Rewind Time 🌀
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdventureMap;
