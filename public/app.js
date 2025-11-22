// Main application orchestrator
import { Graph } from './graph.js';
import { GRAPH_CONSTANTS } from './utils/constants.js';
import { setGraph } from './state/appState.js';
import { setupEventListeners, setupDialogs } from './ui/eventListeners.js';
import { setupContextMenu } from './ui/contextMenu.js';
import { loadGraphFromDb } from './services/databaseService.js';
import { setupViewStateSaving } from './managers/viewStateManager.js';
import { setMode } from './managers/modeManager.js';
import { updateSaveButtonVisibility } from './ui/saveDiscardUI.js';
import { initSidebarResizer } from './ui/sidebarResizer.js';
import {
    trackNodeCreate,
    trackNodeUpdate,
    trackNodeDelete,
    trackEdgeCreate,
    trackEdgeUpdate,
    trackEdgeDelete
} from './managers/changeTracker.js';

function init() {
    const canvas = document.getElementById('graph-canvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    
    // Initialize graph with change tracking callbacks
    const graph = new Graph(canvas, {
        onNodeCreate: trackNodeCreate,
        onNodeUpdate: trackNodeUpdate,
        onNodeDelete: trackNodeDelete,
        onEdgeCreate: trackEdgeCreate,
        onEdgeUpdate: trackEdgeUpdate,
        onEdgeDelete: trackEdgeDelete
    });
    
    // Store graph instance in state
    setGraph(graph);

    // Expose change tracking functions on window for non-module scripts (like ui-functions.js)
    window.trackNodeCreate = trackNodeCreate;
    window.trackNodeUpdate = trackNodeUpdate;
    window.trackNodeDelete = trackNodeDelete;
    window.trackEdgeCreate = trackEdgeCreate;
    window.trackEdgeUpdate = trackEdgeUpdate;
    window.trackEdgeDelete = trackEdgeDelete;
    
    // Expose constants on window for non-module scripts
    window.GRAPH_CONSTANTS = GRAPH_CONSTANTS;

    // Setup UI components
    setupEventListeners();
    setupContextMenu();
    setupDialogs();
    initSidebarResizer();

    // Set initial mode - match HTML default (node-mode is active)
    setMode('node');
    
    // Load existing graph data from database
    loadGraphFromDb().then(() => {
        // Initialize save/discard button visibility after loading
        updateSaveButtonVisibility();
    });
    
    // Monitor scale and offset changes and save them
    setupViewStateSaving();
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', init);
