/**
 * Main application logic for graph viewer web app
 */
import { GraphRenderer } from './graph-renderer.js';
import { GRAPH_CONSTANTS } from './utils/constants.js';
import { screenToWorld } from './utils/geometry.js';
import { getScaledRadius } from './utils/styles.js';

// Wait for SQL.js to load
let SQL = null;
let db = null;

// Graph data
let nodes = [];
let edges = [];
let viewState = {
    scale: 1,
    offset: { x: 0, y: 0 }
};

// Pan state
let isPanning = false;
let lastPanPoint = { x: 0, y: 0 };
let panStartPoint = { x: 0, y: 0 };

// Selection state
let selectedNode = null;

// Graph renderer
let renderer = null;

// Initialize SQL.js
async function initSQL() {
    // Wait for SQL.js to be available
    if (typeof window.initSqlJs === 'undefined') {
        // Wait a bit for the script to load
        await new Promise(resolve => setTimeout(resolve, 100));
        if (typeof window.initSqlJs === 'undefined') {
            throw new Error('SQL.js not loaded. Please check your internet connection.');
        }
    }
    
    SQL = await window.initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
    });
    console.log('SQL.js initialized');
}

/**
 * Load database from file
 */
async function loadDatabase(file) {
    const statusText = document.getElementById('status-text');
    statusText.textContent = 'Loading database...';
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        if (!SQL) {
            await initSQL();
        }
        
        db = new SQL.Database(uint8Array);
        console.log('Database loaded');
        
        // Read graph data
        await readGraphData();
        
        statusText.textContent = `Loaded: ${nodes.length} nodes, ${edges.length} edges`;
        
        // Clear selection when loading new data
        selectedNode = null;
        hideSelectionInfoPopup();
        
        // Initial render
        render();
    } catch (error) {
        console.error('Error loading database:', error);
        statusText.textContent = `Error: ${error.message}`;
        alert(`Failed to load database: ${error.message}`);
    }
}

/**
 * Load graph data from JSON export file
 */
async function loadJSON(file) {
    const statusText = document.getElementById('status-text');
    statusText.textContent = 'Loading JSON export...';
    
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        // Validate JSON structure
        if (!data.graph_nodes || !data.graph_edges) {
            throw new Error('Invalid JSON format. Expected graph_nodes and graph_edges arrays.');
        }
        
        // Convert database format to graph format
        nodes = data.graph_nodes.map(node => ({
            id: node.id,
            x: node.x,
            y: node.y,
            label: node.label || '',
            chineseLabel: node.chinese_label || node.chineseLabel || '',
            color: node.color || GRAPH_CONSTANTS.DEFAULT_NODE_COLOR,
            radius: node.radius || GRAPH_CONSTANTS.DEFAULT_NODE_RADIUS,
            category: node.category || null,
            layers: node.layers 
                ? (typeof node.layers === 'string' 
                    ? node.layers.split(',').map(l => l.trim()).filter(l => l)
                    : node.layers)
                : []
        }));
        
        edges = data.graph_edges.map(edge => ({
            id: edge.id,
            from: edge.from_node_id || edge.from,
            to: edge.to_node_id || edge.to,
            weight: edge.weight || 1,
            category: edge.category || null
        }));
        
        // Load view state from metadata if available
        if (data.graph_metadata && data.graph_metadata.length > 0) {
            const meta = data.graph_metadata[0];
            viewState.scale = meta.scale || 1;
            viewState.offset = { 
                x: meta.offset_x || 0, 
                y: meta.offset_y || 0 
            };
        } else {
            viewState.scale = 1;
            viewState.offset = { x: 0, y: 0 };
        }
        
        statusText.textContent = `Loaded: ${nodes.length} nodes, ${edges.length} edges (from JSON)`;
        
        // Clear selection when loading new data
        selectedNode = null;
        hideSelectionInfoPopup();
        
        // Initial render
        render();
    } catch (error) {
        console.error('Error loading JSON:', error);
        statusText.textContent = `Error: ${error.message}`;
        alert(`Failed to load JSON: ${error.message}`);
    }
}

/**
 * Read graph data from SQLite database
 */
async function readGraphData() {
    if (!db) return;
    
    try {
        // Read nodes
        const nodesResult = db.exec('SELECT id, x, y, label, chinese_label, color, radius, category, layers FROM graph_nodes ORDER BY sequence_id ASC');
        if (nodesResult.length > 0) {
            const columns = nodesResult[0].columns;
            const values = nodesResult[0].values;
            
            nodes = values.map(row => {
                const node = {};
                columns.forEach((col, idx) => {
                    if (col === 'chinese_label') {
                        node.chineseLabel = row[idx] || '';
                    } else if (col === 'layers') {
                        // Parse layers from comma-separated string
                        node.layers = row[idx] ? row[idx].split(',').map(l => l.trim()).filter(l => l) : [];
                    } else {
                        node[col] = row[idx];
                    }
                });
                return node;
            });
        }
        
        // Read edges
        const edgesResult = db.exec('SELECT id, from_node_id, to_node_id, weight, category FROM graph_edges ORDER BY sequence_id ASC');
        if (edgesResult.length > 0) {
            const columns = edgesResult[0].columns;
            const values = edgesResult[0].values;
            
            edges = values.map(row => {
                const edge = {};
                columns.forEach((col, idx) => {
                    if (col === 'from_node_id') {
                        edge.from = row[idx];
                    } else if (col === 'to_node_id') {
                        edge.to = row[idx];
                    } else {
                        edge[col] = row[idx];
                    }
                });
                return edge;
            });
        }
        
        // Read view state (scale, offset)
        const metadataResult = db.exec('SELECT scale, offset_x, offset_y FROM graph_metadata WHERE id = 1');
        if (metadataResult.length > 0 && metadataResult[0].values.length > 0) {
            const [scale, offset_x, offset_y] = metadataResult[0].values[0];
            viewState.scale = scale || 1;
            viewState.offset = { x: offset_x || 0, y: offset_y || 0 };
        }
        
        console.log(`Loaded ${nodes.length} nodes and ${edges.length} edges`);
    } catch (error) {
        console.error('Error reading graph data:', error);
        throw error;
    }
}

/**
 * Initialize canvas and renderer
 */
function initCanvas() {
    const canvas = document.getElementById('graph-canvas');
    const container = canvas.parentElement;
    
    // Set canvas size
    const resizeCanvas = () => {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        if (renderer) {
            renderer.resize(canvas.width, canvas.height);
            render();
        }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Initialize renderer
    renderer = new GraphRenderer(canvas);
    
    // Setup pan and zoom handlers
    setupPanAndZoom(canvas);
}

/**
 * Get node at world coordinates
 */
function getNodeAt(worldX, worldY) {
    let closestNode = null;
    let minDistance = Infinity;
    const hitRadiusPadding = 3; // Extra pixels for easier clicking
    
    for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        const dx = worldX - node.x;
        const dy = worldY - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const hitRadius = getScaledRadius(node.radius || GRAPH_CONSTANTS.DEFAULT_NODE_RADIUS, viewState.scale) + hitRadiusPadding;
        
        if (distance <= hitRadius && distance < minDistance) {
            minDistance = distance;
            closestNode = node;
        }
    }
    
    return closestNode;
}

/**
 * Show selection info popup
 */
function showSelectionInfoPopup(node, screenX, screenY) {
    const popup = document.getElementById('selection-info-popup');
    const popupContent = document.getElementById('selection-info-popup-content');
    
    if (!popup || !popupContent) return;
    
    if (node) {
        const layers = node.layers && Array.isArray(node.layers) && node.layers.length > 0
            ? node.layers.join(', ')
            : 'None';
        
        // Format timestamps
        const formatTimestamp = (timestamp) => {
            if (!timestamp) return 'N/A';
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return 'N/A';
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
        };
        
        const escapeHtml = (text) => {
            if (!text) return "";
            const div = document.createElement("div");
            div.textContent = text;
            return div.innerHTML;
        };
        
        const createdAt = formatTimestamp(node.created_at || node.createdAt);
        const modifiedAt = formatTimestamp(node.updated_at || node.updatedAt || node.modifiedAt);
        
        popupContent.innerHTML = `
            <div><strong>English:</strong> ${escapeHtml(node.label || 'Unnamed Node')}</div>
            ${node.chineseLabel ? `<div><strong>中文:</strong> ${escapeHtml(node.chineseLabel)}</div>` : ''}
            <div><strong>Position:</strong> (${Math.round(node.x)}, ${Math.round(node.y)})</div>
            <div><strong>Color:</strong> <span style="display: inline-block; width: 14px; height: 14px; background: ${node.color || GRAPH_CONSTANTS.DEFAULT_NODE_COLOR}; border: 1px solid #ccc; border-radius: 2px; vertical-align: middle; margin-right: 4px;"></span>${node.color || GRAPH_CONSTANTS.DEFAULT_NODE_COLOR}</div>
            <div><strong>Size:</strong> ${node.radius || GRAPH_CONSTANTS.DEFAULT_NODE_RADIUS}px</div>
            ${node.category ? `<div><strong>Category:</strong> ${escapeHtml(node.category)}</div>` : ''}
            <div><strong>Layers:</strong> ${escapeHtml(layers)}</div>
            <div><strong>Created:</strong> ${createdAt}</div>
            <div><strong>Modified:</strong> ${modifiedAt}</div>
        `;
    } else {
        popupContent.innerHTML = '<p>Nothing selected</p>';
    }
    
    // Position popup near click position, but keep it within viewport
    const popupWidth = 300;
    const popupHeight = 200;
    const padding = 20;
    
    let popupX = screenX + 20;
    let popupY = screenY + 20;
    
    // Adjust if popup would go off screen
    if (popupX + popupWidth > window.innerWidth) {
        popupX = screenX - popupWidth - 20;
    }
    if (popupY + popupHeight > window.innerHeight) {
        popupY = screenY - popupHeight - 20;
    }
    
    // Ensure popup stays within viewport
    popupX = Math.max(padding, Math.min(popupX, window.innerWidth - popupWidth - padding));
    popupY = Math.max(padding, Math.min(popupY, window.innerHeight - popupHeight - padding));
    
    popup.style.left = popupX + 'px';
    popup.style.top = popupY + 'px';
    popup.classList.add('visible');
}

/**
 * Hide selection info popup
 */
function hideSelectionInfoPopup() {
    const popup = document.getElementById('selection-info-popup');
    if (popup) {
        popup.classList.remove('visible');
    }
}

/**
 * Setup pan and zoom functionality
 */
function setupPanAndZoom(canvas) {
    // Pan with mouse drag
    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) { // Left mouse button
            const rect = canvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            
            // Convert to world coordinates
            const worldPos = screenToWorld(screenX, screenY, viewState.offset.x, viewState.offset.y, viewState.scale);
            
            // Check if clicking on a node
            const clickedNode = getNodeAt(worldPos.x, worldPos.y);
            
            if (clickedNode) {
                // Select node and show popup
                selectedNode = clickedNode;
                showSelectionInfoPopup(clickedNode, e.clientX, e.clientY);
                render();
            } else {
                // Start panning
                isPanning = true;
                panStartPoint = { x: screenX, y: screenY };
                lastPanPoint = { x: e.clientX, y: e.clientY };
                canvas.style.cursor = 'grabbing';
                
                // Hide popup when clicking empty space
                hideSelectionInfoPopup();
                selectedNode = null;
                render();
            }
        }
    });
    
    canvas.addEventListener('mousemove', (e) => {
        if (isPanning) {
            const dx = e.clientX - lastPanPoint.x;
            const dy = e.clientY - lastPanPoint.y;
            
            viewState.offset.x += dx;
            viewState.offset.y += dy;
            
            lastPanPoint = { x: e.clientX, y: e.clientY };
            render();
        }
    });
    
    canvas.addEventListener('mouseup', () => {
        isPanning = false;
        canvas.style.cursor = 'grab';
    });
    
    canvas.addEventListener('mouseleave', () => {
        isPanning = false;
        canvas.style.cursor = 'grab';
    });
    
    // Zoom with mouse wheel
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Calculate zoom point in world coordinates
        const worldX = (mouseX - viewState.offset.x) / viewState.scale;
        const worldY = (mouseY - viewState.offset.y) / viewState.scale;
        
        // Apply zoom
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.1, Math.min(5, viewState.scale * zoomFactor));
        
        // Adjust offset to zoom towards mouse position
        viewState.offset.x = mouseX - worldX * newScale;
        viewState.offset.y = mouseY - worldY * newScale;
        viewState.scale = newScale;
        
        render();
    });
}

/**
 * Render the graph
 */
function render() {
    if (!renderer || nodes.length === 0) return;
    
    renderer.render(nodes, edges, viewState, {
        selectedNode: selectedNode,
        highlightedNodes: []
    });
}

/**
 * Load sample graph data
 */
async function loadSampleGraph() {
    const statusText = document.getElementById('status-text');
    statusText.textContent = 'Loading sample graph...';
    
    try {
        const response = await fetch('sample-graph.json');
        if (!response.ok) {
            throw new Error('Failed to load sample graph file');
        }
        
        const data = await response.json();
        
        // Validate JSON structure
        if (!data.graph_nodes || !data.graph_edges) {
            throw new Error('Invalid JSON format. Expected graph_nodes and graph_edges arrays.');
        }
        
        // Convert database format to graph format
        nodes = data.graph_nodes.map(node => ({
            id: node.id,
            x: node.x,
            y: node.y,
            label: node.label || '',
            chineseLabel: node.chinese_label || node.chineseLabel || '',
            color: node.color || GRAPH_CONSTANTS.DEFAULT_NODE_COLOR,
            radius: node.radius || GRAPH_CONSTANTS.DEFAULT_NODE_RADIUS,
            category: node.category || null,
            layers: node.layers 
                ? (typeof node.layers === 'string' 
                    ? node.layers.split(',').map(l => l.trim()).filter(l => l)
                    : node.layers)
                : []
        }));
        
        edges = data.graph_edges.map(edge => ({
            id: edge.id,
            from: edge.from_node_id || edge.from,
            to: edge.to_node_id || edge.to,
            weight: edge.weight || 1,
            category: edge.category || null
        }));
        
        // Load view state from metadata if available
        if (data.graph_metadata && data.graph_metadata.length > 0) {
            const meta = data.graph_metadata[0];
            viewState.scale = meta.scale || 1;
            viewState.offset = { 
                x: meta.offset_x || 0, 
                y: meta.offset_y || 0 
            };
        } else {
            viewState.scale = 1;
            viewState.offset = { x: 0, y: 0 };
        }
        
        statusText.textContent = `Loaded sample: ${nodes.length} nodes, ${edges.length} edges`;
        
        // Clear selection when loading new data
        selectedNode = null;
        hideSelectionInfoPopup();
        
        // Initial render
        render();
    } catch (error) {
        console.error('Error loading sample graph:', error);
        statusText.textContent = `Error: ${error.message}`;
        alert(`Failed to load sample graph: ${error.message}`);
    }
}

/**
 * Reset view to default
 */
function resetView() {
    viewState.scale = 1;
    viewState.offset = { x: 0, y: 0 };
    selectedNode = null;
    hideSelectionInfoPopup();
    render();
}

/**
 * Initialize application
 */
function init() {
    // Initialize canvas
    initCanvas();
    
    // Setup file input
    const fileInput = document.getElementById('db-file-input');
    const fileLabel = fileInput.previousElementSibling;
    
    fileLabel.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            loadDatabase(file);
        }
    });
    
    // Setup JSON file input
    const jsonFileInput = document.getElementById('json-file-input');
    const jsonFileLabel = jsonFileInput.previousElementSibling;
    
    jsonFileLabel.addEventListener('click', () => {
        jsonFileInput.click();
    });
    
    jsonFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            loadJSON(file);
        }
    });
    
    // Setup load sample button
    document.getElementById('load-sample-btn').addEventListener('click', loadSampleGraph);
    
    // Setup reset view button
    document.getElementById('reset-view-btn').addEventListener('click', resetView);
    
    // Setup popup close button
    const popupCloseBtn = document.getElementById('selection-info-popup-close');
    if (popupCloseBtn) {
        popupCloseBtn.addEventListener('click', hideSelectionInfoPopup);
    }
    
    // Hide popup when clicking outside (but not on canvas)
    document.addEventListener('click', (e) => {
        const popup = document.getElementById('selection-info-popup');
        const canvas = document.getElementById('graph-canvas');
        
        if (popup && popup.classList.contains('visible')) {
            // Check if click is outside popup and not on canvas
            if (!popup.contains(e.target) && e.target !== canvas) {
                hideSelectionInfoPopup();
                selectedNode = null;
                render();
            }
        }
    });
    
    // ESC key to close popup
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const popup = document.getElementById('selection-info-popup');
            if (popup && popup.classList.contains('visible')) {
                hideSelectionInfoPopup();
                selectedNode = null;
                render();
            }
        }
    });
    
    console.log('Graph viewer initialized');
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

