import { setMode } from "../managers/modeManager.js";
import { toggleHotkeyMode } from "../managers/hotkeyManager.js";
import {
  showLoadDialog,
  setupPaginationListeners,
  handleLoadOK,
  handleLoadCancel,
} from "./dialogs/loadDialog.js";
import {
  showSaveAsDialog,
  handleSaveAsOK,
  handleSaveAsCancel,
} from "./dialogs/saveAsDialog.js";
import {
  showMergeDialog,
  handleMergeOK,
  handleMergeCancel,
} from "./dialogs/mergeDialog.js";
import {
  saveAllChanges,
  discardAllChanges,
  clearGraph,
} from "./saveDiscardUI.js";
import { hideContextMenu } from "./contextMenu.js";
import { showSearchDialog } from "./dialogs/searchDialog.js";
import { showEdgeSearchDialog } from "./dialogs/edgeSearchDialog.js";
import { saveViewStateToDb } from "../services/databaseService.js";
import { getGraph } from "../state/appState.js";
import { createNewGraphTemplate } from "./template.js";
import { updateGraphInfo } from "./search/searchBar.js";

export function setupEventListeners() {
  // Mode buttons
  document
    .getElementById("select-mode")
    .addEventListener("click", () => setMode("select"));
  document
    .getElementById("node-mode")
    .addEventListener("click", () => setMode("node"));
  document
    .getElementById("edge-mode")
    .addEventListener("click", () => setMode("edge"));

  // Hotkey mode button
  const hotkeyModeBtn = document.getElementById("hotkey-mode-btn");
  if (hotkeyModeBtn) {
    hotkeyModeBtn.addEventListener("click", () => toggleHotkeyMode());
  }

  // Load button
  document
    .getElementById("load-btn")
    .addEventListener("click", () => showLoadDialog());

  // Save As button
  document
    .getElementById("save-as-btn")
    .addEventListener("click", () => showSaveAsDialog());

  // Action buttons
  document.getElementById("clear-btn").addEventListener("click", clearGraph);

  // Search dialog button
  const searchDialogBtn = document.getElementById("search-dialog-btn");
  if (searchDialogBtn) {
    searchDialogBtn.addEventListener("click", () => showSearchDialog());
  }

  // Create Edge via Search button
  const createEdgeSearchBtn = document.getElementById("create-edge-search-btn");
  if (createEdgeSearchBtn) {
    createEdgeSearchBtn.addEventListener("click", () => showEdgeSearchDialog());
  }

  // Merge Database button
  const mergeDbBtn = document.getElementById("merge-db-btn");
  if (mergeDbBtn) {
    mergeDbBtn.addEventListener("click", () => showMergeDialog());
  }

  // Export Database button
  const exportDbBtn = document.getElementById("export-db-btn");
  if (exportDbBtn) {
    exportDbBtn.addEventListener("click", () => {
      if (window.showExportDialog) {
        window.showExportDialog();
      }
    });
  }

  // Calculate Centralities button
  const calculateCentralitiesBtn = document.getElementById(
    "calculate-centralities-btn",
  );
  if (calculateCentralitiesBtn) {
    calculateCentralitiesBtn.addEventListener("click", () => {
      calculateCentralities();
    });
  }
}

/**
 * Calculate centralities for all nodes
 */
function calculateCentralities() {
  const graph = getGraph();
  if (!graph || graph.nodes.length === 0) {
    if (window.showNotification) {
      window.showNotification("No nodes to analyze", "error");
    }
    return;
  }

  // Show loading state
  const btn = document.getElementById("calculate-centralities-btn");
  const originalText = btn ? btn.innerHTML : "";
  if (btn) {
    btn.disabled = true;
    btn.innerHTML =
      '<i data-lucide="loader-2" class="icon"></i><span>Calculating...</span>';
    // Reinitialize lucide icons for the spinner
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // Use setTimeout to allow UI to update before heavy computation
  setTimeout(() => {
    try {
      graph.calculateCentralities();

      // Update selection info to show centrality data
      updateGraphInfo();

      if (window.showNotification) {
        window.showNotification(
          `Centralities calculated for ${graph.nodes.length} nodes`,
        );
      }
    } catch (error) {
      console.error("Error calculating centralities:", error);
      if (window.showNotification) {
        window.showNotification("Error calculating centralities", "error");
      }
    } finally {
      // Restore button state
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalText;
        // Reinitialize lucide icons
        if (window.lucide) {
          window.lucide.createIcons();
        }
      }
    }
  }, 10);
}

// Export for use in other modules
export { calculateCentralities };

// Expose on window for backward compatibility
if (typeof window !== "undefined") {
  window.calculateCentralities = calculateCentralities;
}

// New Graph Template button
const newTemplateBtn = document.getElementById("new-template-btn");
if (newTemplateBtn) {
  newTemplateBtn.addEventListener("click", () => createNewGraphTemplate());
}

// Save View State button
const saveViewStateBtn = document.getElementById("save-view-state-btn");
if (saveViewStateBtn) {
  saveViewStateBtn.addEventListener("click", async () => {
    const graph = getGraph();
    if (!graph) return;

    const originalText = saveViewStateBtn.textContent;
    saveViewStateBtn.textContent = "Saving...";
    saveViewStateBtn.disabled = true;

    try {
      await saveViewStateToDb();
      saveViewStateBtn.textContent = "Saved!";
      setTimeout(() => {
        saveViewStateBtn.textContent = originalText;
        saveViewStateBtn.disabled = false;
      }, 1500);
    } catch (error) {
      console.error("Error saving view state:", error);
      saveViewStateBtn.textContent = "Error!";
      setTimeout(() => {
        saveViewStateBtn.textContent = originalText;
        saveViewStateBtn.disabled = false;
      }, 2000);
    }
  });
}

// Save/Discard buttons
const saveChangesButton = document.getElementById("save-changes");
if (saveChangesButton) {
  saveChangesButton.addEventListener("click", saveAllChanges);
}

const discardChangesButton = document.getElementById("discard-changes");
if (discardChangesButton) {
  discardChangesButton.addEventListener("click", discardAllChanges);
}

// Hide context menu when clicking elsewhere
document.addEventListener("click", () => {
  hideContextMenu();
});

// Show Edge Arrows (Flow Effect) checkbox
const showEdgeArrowsCheckbox = document.getElementById("show-edge-arrows");
if (showEdgeArrowsCheckbox) {
  // Initialize appState if it doesn't exist
  if (!window.appState) {
    window.appState = { showEdgeArrows: false };
  }

  // Set initial checkbox state
  showEdgeArrowsCheckbox.checked = window.appState.showEdgeArrows || false;

  // Listen for changes
  showEdgeArrowsCheckbox.addEventListener("change", (e) => {
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

export function setupDialogs() {
  // Node dialog - use ui-functions.js handlers
  const nodeOk = document.getElementById("node-ok");
  if (nodeOk) {
    nodeOk.addEventListener("click", handleNodeOK);
  }
  const nodeCancel = document.getElementById("node-cancel");
  if (nodeCancel) {
    nodeCancel.addEventListener("click", handleNodeCancel);
  }
  const nodeDelete = document.getElementById("node-delete");
  if (nodeDelete) {
    nodeDelete.addEventListener("click", handleNodeDelete);
  }

  // Edge/Weight dialog - use ui-functions.js handlers
  const weightOk = document.getElementById("weight-ok");
  if (weightOk) {
    weightOk.addEventListener("click", handleWeightOK);
  }
  const weightCancel = document.getElementById("weight-cancel");
  if (weightCancel) {
    weightCancel.addEventListener("click", handleWeightCancel);
  }
  const weightDelete = document.getElementById("weight-delete");
  if (weightDelete) {
    weightDelete.addEventListener("click", handleWeightDelete);
  }
  const reverseEdgeBtn = document.getElementById("reverse-edge-btn");
  if (reverseEdgeBtn) {
    reverseEdgeBtn.addEventListener("click", handleReverseEdgeDirection);
  }

  // Load dialog handlers
  const loadOk = document.getElementById("load-ok");
  if (loadOk) {
    loadOk.addEventListener("click", handleLoadOK);
  }
  const loadCancel = document.getElementById("load-cancel");
  if (loadCancel) {
    loadCancel.addEventListener("click", handleLoadCancel);
  }

  // Save As dialog handlers
  const saveAsOk = document.getElementById("save-as-ok");
  if (saveAsOk) {
    saveAsOk.addEventListener("click", handleSaveAsOK);
  }
  const saveAsCancel = document.getElementById("save-as-cancel");
  if (saveAsCancel) {
    saveAsCancel.addEventListener("click", handleSaveAsCancel);
  }

  // Allow Enter key to submit Save As dialog
  const saveAsFilename = document.getElementById("save-as-filename");
  if (saveAsFilename) {
    saveAsFilename.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleSaveAsOK();
      }
    });
  }

  // Setup pagination listeners
  setupPaginationListeners();

  // Merge dialog handlers
  const mergeOk = document.getElementById("merge-ok");
  if (mergeOk) {
    mergeOk.addEventListener("click", handleMergeOK);
  }
  const mergeCancel = document.getElementById("merge-cancel");
  if (mergeCancel) {
    mergeCancel.addEventListener("click", handleMergeCancel);
  }

  // Connections dialog handlers
  const nodeConnectionsBtn = document.getElementById("node-connections-btn");
  if (nodeConnectionsBtn) {
    nodeConnectionsBtn.addEventListener("click", () => {
      const node = window.currentEditingNode;
      if (node && window.showNodeConnections) {
        window.showNodeConnections(node.id);
      }
    });
  }

  const connectionsHighlightAllBtn = document.getElementById(
    "connections-highlight-all-btn",
  );
  if (connectionsHighlightAllBtn) {
    connectionsHighlightAllBtn.addEventListener("click", () => {
      if (window.highlightAllConnections) {
        window.highlightAllConnections();
      }
    });
  }

  const connectionsFocusBtn = document.getElementById("connections-focus-btn");
  if (connectionsFocusBtn) {
    connectionsFocusBtn.addEventListener("click", () => {
      if (window.focusOnConnectionsNode) {
        window.focusOnConnectionsNode();
      }
    });
  }

  const connectionsCloseBtn = document.getElementById("connections-close-btn");
  if (connectionsCloseBtn) {
    connectionsCloseBtn.addEventListener("click", () => {
      if (window.closeConnectionsDialog) {
        window.closeConnectionsDialog();
      }
    });
  }
}
