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
import { showToast } from './utils/toast.js';
import {
    trackNodeCreate,
    trackNodeUpdate,
    trackNodeDelete,
    trackEdgeCreate,
    trackEdgeUpdate,
    trackEdgeDelete,
    trackViewStateUpdate,
    trackFilterStateUpdate
} from './managers/changeTracker.js';
import { setupSearchComponents, updateGraphInfo } from './ui/search/searchBar.js';
import { initializeSearchDialog, showSearchDialog } from './ui/dialogs/searchDialog.js';
import { initializeEdgeSearchDialog } from './ui/dialogs/edgeSearchDialog.js';
import { initializeLayerManagement } from './managers/layerManager.js';
import { initializeLayerDialog } from './ui/dialogs/layerDialog.js';
import { saveFilterStateToDb } from './services/databaseService.js';
import { initializeKeyboardShortcuts } from './managers/keyboardShortcuts.js';
import { deactivateHotkeyMode } from './managers/hotkeyManager.js';
import { closeCommandPalette } from './managers/commandPalette.js';
import { initializeSettingsDialog } from './ui/dialogs/settingsDialog.js';
import { initializeFontSettings } from './managers/fontSettingsManager.js';
import { initializeTheme } from './managers/themeManager.js';
import { initializeFullscreen } from './managers/fullscreenManager.js';
import { initializeExportDialog, showExportDialog } from './ui/dialogs/exportDialog.js';
import { initializeClusteringDialog, showClusteringDialog } from './ui/dialogs/clusteringDialog.js';
import { initializeSemanticMapDialog, showSemanticMapDialog } from './ui/dialogs/semanticMapDialog.js';
import { initializeI18n, translatePage } from './managers/i18nManager.js';
import { showConfirmDialog } from './utils/confirmDialog.js';

async function init() {
    // Initialize i18n first, before other components
    await initializeI18n();
    translatePage();
    
    // Listen for language changes and retranslate
    window.addEventListener('languageChanged', () => {
        translatePage();
    });
    const canvas = document.getElementById('graph-canvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    
    // Initialize graph with change tracking callbacks and selection change callback
    const graph = new Graph(canvas, {
        onNodeCreate: trackNodeCreate,
        onNodeUpdate: trackNodeUpdate,
        onNodeDelete: trackNodeDelete,
        onEdgeCreate: trackEdgeCreate,
        onEdgeUpdate: trackEdgeUpdate,
        onEdgeDelete: trackEdgeDelete,
        onSelectionChange: updateGraphInfo
    });
    
    // Store graph instance in state
    setGraph(graph);
    
    // Expose graph instance on window for layer management and other non-module scripts
    window.graph = graph;

    // Expose change tracking functions on window for non-module scripts (like ui-functions.js)
    window.trackNodeCreate = trackNodeCreate;
    window.trackNodeUpdate = trackNodeUpdate;
    window.trackNodeDelete = trackNodeDelete;
    window.trackEdgeCreate = trackEdgeCreate;
    window.trackEdgeUpdate = trackEdgeUpdate;
    window.trackEdgeDelete = trackEdgeDelete;
    window.trackViewStateUpdate = trackViewStateUpdate;
    window.trackFilterStateUpdate = trackFilterStateUpdate;
    
    // Expose constants on window for non-module scripts
    window.GRAPH_CONSTANTS = GRAPH_CONSTANTS;

    // Setup UI components
    setupEventListeners();
    setupContextMenu();
    setupDialogs();
    initSidebarResizer();
    
    // Setup search components
    setupSearchComponents();
    initializeSearchDialog();
    initializeEdgeSearchDialog();
    
    // Setup layer management
    initializeLayerManagement();
    initializeLayerDialog();
    
    // Initialize theme first (before fonts so fonts can override theme fonts if needed)
    initializeTheme();
    
    // Setup settings dialog
    initializeSettingsDialog();
    
    // Setup export dialog
    initializeExportDialog();
    
    // Setup clustering dialog
    initializeClusteringDialog();
    
    // Setup semantic map dialog
    initializeSemanticMapDialog();
    
    // Initialize and apply font settings (after theme so user fonts can override theme fonts)
    initializeFontSettings();
    
    // Setup global keyboard shortcuts (Alt+P for palette, Alt+H for hotkey mode)
    initializeKeyboardShortcuts();
    
    // Initialize fullscreen functionality
    initializeFullscreen();
    
    // Expose search dialog function globally
    window.showSearchDialog = showSearchDialog;
    
    // Expose filter state save function globally
    window.saveFilterStateToDb = saveFilterStateToDb;
    
    // Expose hotkey and command palette functions globally (for cross-module access)
    window.deactivateHotkeyMode = deactivateHotkeyMode;
    window.closeCommandPalette = closeCommandPalette;
    
    // Expose export dialog function globally
    window.showExportDialog = showExportDialog;
    
    // Expose clustering dialog function globally
    window.showClusteringDialog = showClusteringDialog;
    
    // Expose semantic map dialog function globally
    window.showSemanticMapDialog = showSemanticMapDialog;
    
    // Expose i18n functions globally
    window.translatePage = translatePage;
    
    // Expose toast and confirm dialog functions globally
    window.showToast = showToast;
    window.showConfirmDialog = showConfirmDialog;

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
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM already loaded
    init();
}
