import { setMode } from '../managers/modeManager.js';
import { showLoadDialog, setupPaginationListeners, handleLoadOK, handleLoadCancel } from './dialogs/loadDialog.js';
import { showSaveAsDialog, handleSaveAsOK, handleSaveAsCancel } from './dialogs/saveAsDialog.js';
import { saveAllChanges, discardAllChanges, clearGraph } from './saveDiscardUI.js';
import { hideContextMenu } from './contextMenu.js';
import { showSearchDialog } from './dialogs/searchDialog.js';

export function setupEventListeners() {
    // Mode buttons
    document.getElementById('select-mode').addEventListener('click', () => setMode('select'));
    document.getElementById('node-mode').addEventListener('click', () => setMode('node'));
    document.getElementById('edge-mode').addEventListener('click', () => setMode('edge'));

    // Load button
    document.getElementById('load-btn').addEventListener('click', () => showLoadDialog());

    // Save As button
    document.getElementById('save-as-btn').addEventListener('click', () => showSaveAsDialog());

    // Action buttons
    document.getElementById('clear-btn').addEventListener('click', clearGraph);

    // Search dialog button
    const searchDialogBtn = document.getElementById('search-dialog-btn');
    if (searchDialogBtn) {
        searchDialogBtn.addEventListener('click', () => showSearchDialog());
    }

    // Save/Discard buttons
    const saveChangesButton = document.getElementById('save-changes');
    if (saveChangesButton) {
        saveChangesButton.addEventListener('click', saveAllChanges);
    }

    const discardChangesButton = document.getElementById('discard-changes');
    if (discardChangesButton) {
        discardChangesButton.addEventListener('click', discardAllChanges);
    }

    // Hide context menu when clicking elsewhere
    document.addEventListener('click', () => {
        hideContextMenu();
    });

    // Show Edge Arrows (Flow Effect) checkbox
    const showEdgeArrowsCheckbox = document.getElementById('show-edge-arrows');
    if (showEdgeArrowsCheckbox) {
        // Initialize appState if it doesn't exist
        if (!window.appState) {
            window.appState = { showEdgeArrows: false };
        }
        
        // Set initial checkbox state
        showEdgeArrowsCheckbox.checked = window.appState.showEdgeArrows || false;
        
        // Listen for changes
        showEdgeArrowsCheckbox.addEventListener('change', (e) => {
            // Update appState
            if (!window.appState) {
                window.appState = {};
            }
            window.appState.showEdgeArrows = e.target.checked;
            
            // Reset animation start time when toggling
            const graph = window.graph || window.getGraph?.();
            if (graph && graph.renderer) {
                graph.renderer.animationStartTime = Date.now();
            }
            
            // Trigger graph re-render to start/stop animation
            if (graph && graph.render) {
                graph.render();
            }
        });
    }
}

export function setupDialogs() {
    // Node dialog - use ui-functions.js handlers
    const nodeOk = document.getElementById('node-ok');
    if (nodeOk) {
        nodeOk.addEventListener('click', handleNodeOK);
    }
    const nodeCancel = document.getElementById('node-cancel');
    if (nodeCancel) {
        nodeCancel.addEventListener('click', handleNodeCancel);
    }
    const nodeDelete = document.getElementById('node-delete');
    if (nodeDelete) {
        nodeDelete.addEventListener('click', handleNodeDelete);
    }

    // Edge/Weight dialog - use ui-functions.js handlers
    const weightOk = document.getElementById('weight-ok');
    if (weightOk) {
        weightOk.addEventListener('click', handleWeightOK);
    }
    const weightCancel = document.getElementById('weight-cancel');
    if (weightCancel) {
        weightCancel.addEventListener('click', handleWeightCancel);
    }
    const weightDelete = document.getElementById('weight-delete');
    if (weightDelete) {
        weightDelete.addEventListener('click', handleWeightDelete);
    }
    const reverseEdgeBtn = document.getElementById('reverse-edge-btn');
    if (reverseEdgeBtn) {
        reverseEdgeBtn.addEventListener('click', handleReverseEdgeDirection);
    }

    // Load dialog handlers
    const loadOk = document.getElementById('load-ok');
    if (loadOk) {
        loadOk.addEventListener('click', handleLoadOK);
    }
    const loadCancel = document.getElementById('load-cancel');
    if (loadCancel) {
        loadCancel.addEventListener('click', handleLoadCancel);
    }

    // Save As dialog handlers
    const saveAsOk = document.getElementById('save-as-ok');
    if (saveAsOk) {
        saveAsOk.addEventListener('click', handleSaveAsOK);
    }
    const saveAsCancel = document.getElementById('save-as-cancel');
    if (saveAsCancel) {
        saveAsCancel.addEventListener('click', handleSaveAsCancel);
    }

    // Allow Enter key to submit Save As dialog
    const saveAsFilename = document.getElementById('save-as-filename');
    if (saveAsFilename) {
        saveAsFilename.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSaveAsOK();
            }
        });
    }

    // Setup pagination listeners
    setupPaginationListeners();

    // Connections dialog handlers
    const nodeConnectionsBtn = document.getElementById('node-connections-btn');
    if (nodeConnectionsBtn) {
        nodeConnectionsBtn.addEventListener('click', () => {
            const node = window.currentEditingNode;
            if (node && window.showNodeConnections) {
                window.showNodeConnections(node.id);
            }
        });
    }

    const connectionsHighlightAllBtn = document.getElementById('connections-highlight-all-btn');
    if (connectionsHighlightAllBtn) {
        connectionsHighlightAllBtn.addEventListener('click', () => {
            if (window.highlightAllConnections) {
                window.highlightAllConnections();
            }
        });
    }

    const connectionsFocusBtn = document.getElementById('connections-focus-btn');
    if (connectionsFocusBtn) {
        connectionsFocusBtn.addEventListener('click', () => {
            if (window.focusOnConnectionsNode) {
                window.focusOnConnectionsNode();
            }
        });
    }

    const connectionsCloseBtn = document.getElementById('connections-close-btn');
    if (connectionsCloseBtn) {
        connectionsCloseBtn.addEventListener('click', () => {
            if (window.closeConnectionsDialog) {
                window.closeConnectionsDialog();
            }
        });
    }
}

