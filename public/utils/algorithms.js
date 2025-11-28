/**
 * Algorithm utility functions for graph analysis
 */

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between two values
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Calculate distance between two points
 * @param {number} x1 - First point X
 * @param {number} y1 - First point Y
 * @param {number} x2 - Second point X
 * @param {number} y2 - Second point Y
 * @returns {number} Distance
 */
export function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Map a value from one range to another
 * @param {number} value - Value to map
 * @param {number} fromMin - Source range min
 * @param {number} fromMax - Source range max
 * @param {number} toMin - Target range min
 * @param {number} toMax - Target range max
 * @returns {number} Mapped value
 */
export function mapRange(value, fromMin, fromMax, toMin, toMax) {
    return toMin + (value - fromMin) * (toMax - toMin) / (fromMax - fromMin);
}

/**
 * Dijkstra's algorithm for shortest path calculation
 * @param {Array} nodes - Array of node objects
 * @param {Array} edges - Array of edge objects
 * @param {string} startNodeId - Starting node ID
 * @returns {Map} Map of distances from start node to all other nodes
 */
export function dijkstra(nodes, edges, startNodeId) {
    const distances = new Map();
    const visited = new Set();
    const queue = [];
    
    // Initialize distances
    nodes.forEach(node => {
        distances.set(node.id, node.id === startNodeId ? 0 : Infinity);
    });
    
    queue.push({ nodeId: startNodeId, distance: 0 });
    
    while (queue.length > 0) {
        queue.sort((a, b) => a.distance - b.distance);
        const current = queue.shift();
        
        if (visited.has(current.nodeId)) continue;
        visited.add(current.nodeId);
        
        // Find connected edges (treat as undirected - check both directions)
        const outgoingEdges = edges.filter(edge => edge.from === current.nodeId || edge.from_node_id === current.nodeId);
        const incomingEdges = edges.filter(edge => edge.to === current.nodeId || edge.to_node_id === current.nodeId);
        const allEdges = [...outgoingEdges, ...incomingEdges];

        allEdges.forEach(edge => {
            const neighborId = (edge.from === current.nodeId || edge.from_node_id === current.nodeId) 
                ? (edge.to || edge.to_node_id) 
                : (edge.from || edge.from_node_id);
            if (visited.has(neighborId)) return;

            const newDistance = current.distance + (edge.weight || 1);
            if (newDistance < distances.get(neighborId)) {
                distances.set(neighborId, newDistance);
                queue.push({ nodeId: neighborId, distance: newDistance });
            }
        });
    }
    
    return distances;
}

/**
 * Breadth-First Search (BFS) for unweighted graphs
 * @param {Array} nodes - Array of node objects
 * @param {Array} edges - Array of edge objects
 * @param {string} startNodeId - Starting node ID
 * @returns {Map} Map of distances from start node to all other nodes
 */
export function bfs(nodes, edges, startNodeId) {
    const distances = new Map();
    const queue = [startNodeId];
    
    nodes.forEach(node => {
        distances.set(node.id, node.id === startNodeId ? 0 : Infinity);
    });
    
    while (queue.length > 0) {
        const currentId = queue.shift();
        const currentDistance = distances.get(currentId);
        
        // Find connected edges (treat as undirected - check both directions)
        const outgoingEdges = edges.filter(edge => edge.from === currentId || edge.from_node_id === currentId);
        const incomingEdges = edges.filter(edge => edge.to === currentId || edge.to_node_id === currentId);
        const allEdges = [...outgoingEdges, ...incomingEdges];

        allEdges.forEach(edge => {
            const neighborId = (edge.from === currentId || edge.from_node_id === currentId) 
                ? (edge.to || edge.to_node_id) 
                : (edge.from || edge.from_node_id);
            if (distances.get(neighborId) === Infinity) {
                distances.set(neighborId, currentDistance + 1);
                queue.push(neighborId);
            }
        });
    }
    
    return distances;
}

/**
 * Get connected components of a graph
 * @param {Array} nodes - Array of node objects
 * @param {Array} edges - Array of edge objects
 * @returns {Array} Array of arrays, each containing nodes in a connected component
 */
export function getConnectedComponents(nodes, edges) {
    const visited = new Set();
    const components = [];
    
    const getNeighbors = (nodeId) => {
        const neighbors = [];
        edges.forEach(edge => {
            const fromId = edge.from || edge.from_node_id;
            const toId = edge.to || edge.to_node_id;
            if (fromId === nodeId) neighbors.push(toId);
            if (toId === nodeId) neighbors.push(fromId);
        });
        return neighbors;
    };
    
    const dfs = (nodeId, component) => {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
            component.push(node);
        }
        
        getNeighbors(nodeId).forEach(neighborId => {
            dfs(neighborId, component);
        });
    };
    
    nodes.forEach(node => {
        if (!visited.has(node.id)) {
            const component = [];
            dfs(node.id, component);
            components.push(component);
        }
    });
    
    return components;
}

/**
 * Check if graph is connected
 * @param {Array} nodes - Array of node objects
 * @param {Array} edges - Array of edge objects
 * @returns {boolean} True if graph is connected
 */
export function isConnected(nodes, edges) {
    if (nodes.length === 0) return true;
    const distances = bfs(nodes, edges, nodes[0].id);
    return Array.from(distances.values()).every(d => d !== Infinity);
}

/**
 * Calculate graph density
 * @param {Array} nodes - Array of node objects
 * @param {Array} edges - Array of edge objects
 * @returns {number} Graph density (0-1)
 */
export function calculateGraphDensity(nodes, edges) {
    const n = nodes.length;
    if (n < 2) return 0;
    
    const maxEdges = n * (n - 1) / 2;
    return edges.length / maxEdges;
}

