/**
 * Main application logic for graph viewer web app
 */
import { GraphRenderer } from './graph-renderer.js';

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
        
        // Initial render
        render();
    } catch (error) {
        console.error('Error loading database:', error);
        statusText.textContent = `Error: ${error.message}`;
        alert(`Failed to load database: ${error.message}`);
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
 * Setup pan and zoom functionality
 */
function setupPanAndZoom(canvas) {
    // Pan with mouse drag
    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) { // Left mouse button
            isPanning = true;
            lastPanPoint = { x: e.clientX, y: e.clientY };
            canvas.style.cursor = 'grabbing';
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
        selectedNode: null,
        highlightedNodes: []
    });
}

/**
 * Reset view to default
 */
function resetView() {
    viewState.scale = 1;
    viewState.offset = { x: 0, y: 0 };
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
    
    // Setup reset view button
    document.getElementById('reset-view-btn').addEventListener('click', resetView);
    
    console.log('Graph viewer initialized');
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

