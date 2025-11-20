// Main application orchestrator
import { setGraph } from './state/appState.js';
import { setupEventListeners, setupDialogs } from './ui/eventListeners.js';
import { setupContextMenu } from './ui/contextMenu.js';
import { loadGraphFromDb } from './services/databaseService.js';
import { setupViewStateSaving } from './managers/viewStateManager.js';
import { setMode } from './managers/modeManager.js';
import { updateSaveButtonVisibility } from './ui/saveDiscardUI.js';
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

    // Setup UI components
    setupEventListeners();
    setupContextMenu();
    setupDialogs();

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
