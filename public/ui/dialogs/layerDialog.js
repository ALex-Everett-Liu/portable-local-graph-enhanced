// Layer management dialog functionality

let layerDialogState = {
  layers: [],
  selectedLayers: new Set(),
  searchTerm: "",
  filterMode: "include",
  currentPage: 1,
  itemsPerPage: 15,
};

// Layer renaming dialog state
let layerRenameState = {
  currentLayer: "",
  newLayerName: "",
};

// Initialize layer dialog when DOM is ready
export function initializeLayerDialog() {
  // Wait for graph to be available
  const checkGraph = () => {
    if (typeof window.graph !== "undefined") {
      setupLayerDialogEvents();
    } else {
      setTimeout(checkGraph, 100);
    }
  };
  checkGraph();
}

function setupLayerDialogEvents() {
  // Open layer dialog
  const manageLayersBtn = document.getElementById("manage-layers-btn");
  if (manageLayersBtn) {
    manageLayersBtn.addEventListener("click", openLayerDialog);
  }

  // Dialog buttons
  const applyBtn = document.getElementById("apply-layers-btn");
  const cancelBtn = document.getElementById("cancel-layers-btn");
  const resetBtn = document.getElementById("reset-layers-btn");
  const saveViewBtn = document.getElementById("save-layer-view-btn");
  const selectAllBtn = document.getElementById("select-all-layers-btn");
  const selectNoneBtn = document.getElementById("select-none-layers-btn");
  const invertBtn = document.getElementById("invert-selection-btn");
  const searchInput = document.getElementById("layer-search-input");

  // Pagination controls
  const paginationPrevBtn = document.getElementById("layer-pagination-prev");
  const paginationNextBtn = document.getElementById("layer-pagination-next");
  const paginationInput = document.getElementById("layer-pagination-input");
  const paginationGoBtn = document.getElementById("layer-pagination-go");

  if (applyBtn) applyBtn.addEventListener("click", applyLayerDialogSelection);
  if (cancelBtn) cancelBtn.addEventListener("click", closeLayerDialog);
  if (resetBtn) resetBtn.addEventListener("click", resetLayerDialog);
  if (saveViewBtn) saveViewBtn.addEventListener("click", saveLayerView);
  if (selectAllBtn) selectAllBtn.addEventListener("click", selectAllLayers);
  if (selectNoneBtn) selectNoneBtn.addEventListener("click", selectNoneLayers);
  if (invertBtn) invertBtn.addEventListener("click", invertLayerSelection);
  if (searchInput) searchInput.addEventListener("input", handleLayerSearch);

  // Pagination event listeners
  if (paginationPrevBtn)
    paginationPrevBtn.addEventListener("click", handleLayerPaginationPrev);
  if (paginationNextBtn)
    paginationNextBtn.addEventListener("click", handleLayerPaginationNext);
  if (paginationGoBtn)
    paginationGoBtn.addEventListener("click", handleLayerPaginationInput);
  if (paginationInput) {
    paginationInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        handleLayerPaginationInput();
      }
    });
    paginationInput.addEventListener("blur", () => {
      // Reset to current page if invalid input on blur
      const totalPages = getTotalPages();
      if (totalPages > 0) {
        paginationInput.value = layerDialogState.currentPage;
      }
    });
  }

  // Mode radio buttons
  const modeRadios = document.querySelectorAll(
    'input[name="dialog-layer-filter-mode"]',
  );
  modeRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      layerDialogState.filterMode = e.target.value;
    });
  });

  // Close dialog with Escape key
  document.addEventListener("keydown", (e) => {
    const layerDialog = document.getElementById("layer-management-dialog");
    const renameDialog = document.getElementById("layer-rename-dialog");

    if (e.key === "Escape") {
      if (renameDialog && !renameDialog.classList.contains("hidden")) {
        closeLayerRenameDialog();
      } else if (layerDialog && !layerDialog.classList.contains("hidden")) {
        closeLayerDialog();
      }
    }
  });

  // Add event listeners for layer rename dialog
  const renameApplyBtn = document.getElementById("rename-apply-btn");
  const renameCancelBtn = document.getElementById("rename-cancel-btn");
  const renameNewLayer = document.getElementById("rename-new-layer");

  if (renameApplyBtn)
    renameApplyBtn.addEventListener("click", applyLayerRename);
  if (renameCancelBtn)
    renameCancelBtn.addEventListener("click", closeLayerRenameDialog);
  if (renameNewLayer) {
    renameNewLayer.addEventListener("keydown", handleLayerRenameKeydown);
  }
}

export function openLayerDialog() {
  const dialog = document.getElementById("layer-management-dialog");
  if (!dialog || !window.graph) return;

  // Initialize state from current graph
  layerDialogState.layers = window.graph.getAllLayers();
  layerDialogState.selectedLayers = new Set(window.graph.activeLayers || []);
  layerDialogState.filterMode = window.graph.getLayerFilterMode() || "include";
  layerDialogState.searchTerm = "";
  layerDialogState.currentPage = 1; // Reset to first page

  // Reset search input
  const searchInput = document.getElementById("layer-search-input");
  if (searchInput) searchInput.value = "";

  // Set current mode in dialog
  const modeRadio = document.querySelector(
    `input[name="dialog-layer-filter-mode"][value="${layerDialogState.filterMode}"]`,
  );
  if (modeRadio) modeRadio.checked = true;

  // Render layers
  renderLayerGrid();
  updateLayerStats();
  updateLayerPaginationControls();

  // Show dialog
  dialog.classList.remove("hidden");
}

export function closeLayerDialog() {
  const dialog = document.getElementById("layer-management-dialog");
  if (dialog) dialog.classList.add("hidden");
}

// Save layer view configuration
function saveLayerView() {
  const selectedLayers = Array.from(layerDialogState.selectedLayers);
  const mode = layerDialogState.filterMode;

  if (selectedLayers.length === 0) {
    if (typeof showNotification === "function") {
      showNotification(
        "Please select at least one layer before saving",
        "error",
      );
    }
    return;
  }

  const defaultName = `${selectedLayers.length} layer(s) (${mode})`;

  const config = {
    id: "layer-view-" + Date.now(),
    name: defaultName,
    customName: defaultName,
    selectedLayers: [...selectedLayers],
    filterMode: mode,
    timestamp: new Date().toISOString(),
    description: `${selectedLayers.join(", ")} - ${mode} mode`,
  };

  // Load existing layer views or initialize array
  let layerViews = [];
  try {
    const saved = localStorage.getItem("graphLayerViews");
    if (saved) {
      layerViews = JSON.parse(saved);
    }
  } catch (error) {
    console.error("Error loading layer views:", error);
  }

  layerViews.push(config);

  // Keep only the 10 most recent configurations
  if (layerViews.length > 10) {
    layerViews = layerViews.slice(-10);
  }

  // Save to localStorage
  try {
    localStorage.setItem("graphLayerViews", JSON.stringify(layerViews));
    if (typeof showNotification === "function") {
      showNotification("Layer view saved successfully");
    }
  } catch (error) {
    console.error("Error saving layer view:", error);
    if (typeof showNotification === "function") {
      showNotification("Error saving layer view", "error");
    }
  }
}

// Load layer view configuration
export function loadLayerView(viewId) {
  let layerViews = [];
  try {
    const saved = localStorage.getItem("graphLayerViews");
    if (saved) {
      layerViews = JSON.parse(saved);
    }
  } catch (error) {
    console.error("Error loading layer views:", error);
    return;
  }

  const view = layerViews.find((v) => v.id === viewId);
  if (!view) {
    if (typeof showNotification === "function") {
      showNotification("Layer view not found", "error");
    }
    return;
  }

  if (!window.graph) return;

  // Apply the saved configuration directly to the graph
  window.graph.setLayerFilterMode(view.filterMode);
  window.graph.setActiveLayers(view.selectedLayers);

  // Update sidebar radio buttons
  const sidebarRadio = document.querySelector(
    `input[name="layer-filter-mode"][value="${view.filterMode}"]`,
  );
  if (sidebarRadio) sidebarRadio.checked = true;

  // Update UI elements
  if (typeof window.updateLayerSummary === "function")
    window.updateLayerSummary();
  if (typeof window.updateGraphInfo === "function") window.updateGraphInfo();

  // Show notification with actual effect
  const modeText = view.filterMode === "include" ? "Showing" : "Excluding";
  if (typeof showNotification === "function") {
    showNotification(
      `${modeText} ${view.selectedLayers.length} layer(s): ${view.selectedLayers.join(", ")}`,
    );
  }
}

function renderLayerGrid() {
  const layerGrid = document.getElementById("layer-grid");
  if (!layerGrid) return;

  const filteredLayers = layerDialogState.layers.filter((layer) =>
    layer.toLowerCase().includes(layerDialogState.searchTerm.toLowerCase()),
  );

  if (filteredLayers.length === 0) {
    layerGrid.innerHTML = `
            <div style="text-align: center; color: #666; padding: 20px;">
                ${layerDialogState.layers.length === 0 ? "No layers defined" : "No layers match your search"}
            </div>
        `;
    updateLayerPaginationControls();
    return;
  }

  // Calculate pagination
  const totalPages = Math.ceil(
    filteredLayers.length / layerDialogState.itemsPerPage,
  );
  const startIndex =
    (layerDialogState.currentPage - 1) * layerDialogState.itemsPerPage;
  const endIndex = startIndex + layerDialogState.itemsPerPage;
  const paginatedLayers = filteredLayers.slice(startIndex, endIndex);

  // Ensure current page is valid
  if (layerDialogState.currentPage > totalPages && totalPages > 0) {
    layerDialogState.currentPage = totalPages;
    return renderLayerGrid(); // Re-render with corrected page
  }

  // Create grid layout for better organization
  const gridContainer = document.createElement("div");
  gridContainer.style.display = "grid";
  gridContainer.style.gridTemplateColumns =
    "repeat(auto-fill, minmax(220px, 1fr))";
  gridContainer.style.gap = "8px";

  paginatedLayers.forEach((layer) => {
    const layerItem = createLayerItemWithRename(layer);
    gridContainer.appendChild(layerItem);
  });

  layerGrid.innerHTML = "";
  layerGrid.appendChild(gridContainer);

  // Update pagination controls
  updateLayerPaginationControls();
}

function createLayerItemWithRename(layer) {
  const container = document.createElement("div");
  const isSelected = layerDialogState.selectedLayers.has(layer);

  container.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
        background: ${isSelected ? "#e3f2fd" : "white"};
        border-color: ${isSelected ? "#2196f3" : "#ddd"};
    `;

  const label = document.createElement("label");
  label.style.cssText =
    "display: flex; align-items: center; cursor: pointer; font-size: 13px; flex: 1;";
  label.innerHTML = `
        <input type="checkbox"
               ${isSelected ? "checked" : ""}
               style="margin-right: 8px;"
               data-layer="${layer}">
        ${layer}
    `;

  const renameBtn = document.createElement("button");
  renameBtn.innerHTML = "✏️";
  renameBtn.title = "Rename layer";
  renameBtn.style.cssText = `
        background: none;
        border: none;
        cursor: pointer;
        font-size: 12px;
        padding: 2px 4px;
        border-radius: 2px;
        opacity: 0.7;
        transition: opacity 0.2s;
    `;
  renameBtn.onmouseover = () => (renameBtn.style.opacity = "1");
  renameBtn.onmouseout = () => (renameBtn.style.opacity = "0.7");
  renameBtn.onclick = (e) => {
    e.stopPropagation();
    openLayerRenameDialog(layer);
  };

  container.appendChild(label);
  container.appendChild(renameBtn);

  // Click on container to toggle checkbox
  container.addEventListener("click", (e) => {
    if (e.target.type !== "checkbox" && e.target !== renameBtn) {
      const checkbox = label.querySelector('input[type="checkbox"]');
      checkbox.checked = !checkbox.checked;
      toggleLayerInDialog(layer, checkbox.checked);
    }
  });

  // Checkbox change handler
  const checkbox = label.querySelector('input[type="checkbox"]');
  checkbox.addEventListener("change", (e) => {
    toggleLayerInDialog(layer, e.target.checked);
  });

  return container;
}

function toggleLayerInDialog(layer, isSelected) {
  if (isSelected) {
    layerDialogState.selectedLayers.add(layer);
  } else {
    layerDialogState.selectedLayers.delete(layer);
  }
  updateLayerStats();

  // Update visual state
  const checkboxes = document.querySelectorAll(`input[data-layer="${layer}"]`);
  checkboxes.forEach((cb) => {
    const item = cb.closest("div");
    if (item) {
      item.style.background = isSelected ? "#e3f2fd" : "white";
      item.style.borderColor = isSelected ? "#2196f3" : "#ddd";
    }
  });
}

function handleLayerSearch(e) {
  layerDialogState.searchTerm = e.target.value;
  layerDialogState.currentPage = 1; // Reset to first page on search
  renderLayerGrid();
}

function selectAllLayers() {
  layerDialogState.selectedLayers = new Set(layerDialogState.layers);
  renderLayerGrid();
  updateLayerStats();
}

function selectNoneLayers() {
  layerDialogState.selectedLayers.clear();
  renderLayerGrid();
  updateLayerStats();
}

function invertLayerSelection() {
  const newSelection = new Set();
  layerDialogState.layers.forEach((layer) => {
    if (!layerDialogState.selectedLayers.has(layer)) {
      newSelection.add(layer);
    }
  });
  layerDialogState.selectedLayers = newSelection;
  renderLayerGrid();
  updateLayerStats();
}

function updateLayerStats() {
  const totalCount = layerDialogState.layers.length;
  const selectedCount = layerDialogState.selectedLayers.size;

  const totalCountEl = document.getElementById("total-layers-count");
  const selectedCountEl = document.getElementById("selected-layers-count");

  if (totalCountEl) totalCountEl.textContent = totalCount;
  if (selectedCountEl) selectedCountEl.textContent = selectedCount;

  // Update sidebar summary
  if (typeof window.updateLayerSummary === "function") {
    window.updateLayerSummary();
  }
}

function applyLayerDialogSelection() {
  if (!window.graph) return;

  const selectedLayers = Array.from(layerDialogState.selectedLayers);
  const mode = layerDialogState.filterMode;

  // Apply to graph
  window.graph.setLayerFilterMode(mode);
  window.graph.setActiveLayers(selectedLayers);

  // Update sidebar radio buttons
  const sidebarRadio = document.querySelector(
    `input[name="layer-filter-mode"][value="${mode}"]`,
  );
  if (sidebarRadio) sidebarRadio.checked = true;

  // Track filter state changes instead of saving immediately
  if (typeof window.trackFilterStateUpdate === "function") {
    const filterState = {
      layerFilterEnabled: selectedLayers.length > 0,
      activeLayers: selectedLayers,
      layerFilterMode: mode
    };
    window.trackFilterStateUpdate(filterState);
  }

  // Close dialog
  closeLayerDialog();

  // Update UI
  if (typeof window.updateLayerSummary === "function")
    window.updateLayerSummary();
  if (typeof window.updateGraphInfo === "function") window.updateGraphInfo();

  // Show notification
  if (selectedLayers.length > 0) {
    const modeText = mode === "include" ? "Showing" : "Excluding";
    if (typeof showNotification === "function") {
      showNotification(
        `${modeText} ${selectedLayers.length} layer(s): ${selectedLayers.join(", ")}`,
      );
    }
  } else {
    if (typeof showNotification === "function") {
      showNotification("Showing all layers");
    }
  }
}

function resetLayerDialog() {
  layerDialogState.selectedLayers.clear();
  renderLayerGrid();
  updateLayerStats();
}

// Layer renaming functionality
export function openLayerRenameDialog(layerName) {
  const dialog = document.getElementById("layer-rename-dialog");
  const oldNameInput = document.getElementById("rename-old-layer");
  const newNameInput = document.getElementById("rename-new-layer");

  if (!dialog || !oldNameInput || !newNameInput || !window.graph) return;

  layerRenameState.currentLayer = layerName;
  oldNameInput.value = layerName;
  newNameInput.value = layerName;
  newNameInput.focus();
  newNameInput.select();

  // Update usage info
  const usage = window.graph.getLayerUsage(layerName);
  const usageInfo = document.getElementById("rename-usage-info");
  if (usageInfo) {
    usageInfo.textContent = `This layer is used by ${usage.count} node(s)`;
  }

  // Clear error
  const errorDiv = document.getElementById("rename-error");
  if (errorDiv) {
    errorDiv.style.display = "none";
  }

  dialog.classList.remove("hidden");
}

function closeLayerRenameDialog() {
  const dialog = document.getElementById("layer-rename-dialog");
  if (dialog) dialog.classList.add("hidden");
  layerRenameState.currentLayer = "";
  layerRenameState.newLayerName = "";
}

function applyLayerRename() {
  if (!window.graph) return;

  const oldNameInput = document.getElementById("rename-old-layer");
  const newNameInput = document.getElementById("rename-new-layer");

  if (!oldNameInput || !newNameInput) return;

  const oldName = oldNameInput.value.trim();
  const newName = newNameInput.value.trim();

  if (!oldName || !newName) {
    showRenameError("Please enter both old and new layer names");
    return;
  }

  if (oldName === newName) {
    showRenameError("Old and new layer names are identical");
    return;
  }

  // Validate new layer name
  if (newName.includes(",")) {
    showRenameError("Layer name cannot contain commas");
    return;
  }

  if (newName.trim().length === 0) {
    showRenameError("Layer name cannot be empty");
    return;
  }

  const result = window.graph.renameLayer(oldName, newName);

  if (result.success) {
    if (typeof showNotification === "function") {
      showNotification(result.message);
    }
    closeLayerRenameDialog();

    // Refresh layer dialog if open
    const layerDialog = document.getElementById("layer-management-dialog");
    if (layerDialog && !layerDialog.classList.contains("hidden")) {
      openLayerDialog(); // Refresh the dialog
    }

    if (typeof window.updateLayerSummary === "function") {
      window.updateLayerSummary();
    }
  } else {
    showRenameError(result.message);
  }
}

function showRenameError(message) {
  const errorDiv = document.getElementById("rename-error");
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = "block";

    setTimeout(() => {
      errorDiv.style.display = "none";
    }, 3000);
  }
}

function handleLayerRenameKeydown(e) {
  if (e.key === "Enter") {
    applyLayerRename();
  } else if (e.key === "Escape") {
    closeLayerRenameDialog();
  }
}

// Pagination helper functions
function getTotalPages() {
  const filteredLayers = layerDialogState.layers.filter((layer) =>
    layer.toLowerCase().includes(layerDialogState.searchTerm.toLowerCase()),
  );
  return Math.ceil(filteredLayers.length / layerDialogState.itemsPerPage);
}

function updateLayerPaginationControls() {
  const paginationContainer = document.getElementById("layer-pagination");
  if (!paginationContainer) return;

  const totalPages = getTotalPages();
  const currentPage = layerDialogState.currentPage;

  if (totalPages <= 1) {
    paginationContainer.style.display = "none";
    return;
  }

  paginationContainer.style.display = "flex";

  const pageInfo = document.getElementById("layer-pagination-info");
  const pageInput = document.getElementById("layer-pagination-input");
  const prevBtn = document.getElementById("layer-pagination-prev");
  const nextBtn = document.getElementById("layer-pagination-next");

  if (pageInfo) {
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  }

  if (pageInput) {
    pageInput.value = currentPage;
    pageInput.max = totalPages;
    pageInput.setAttribute("max", totalPages);
  }

  // Update Previous button
  if (prevBtn) {
    prevBtn.disabled = currentPage === 1;
    if (currentPage === 1) {
      prevBtn.style.opacity = "0.5";
      prevBtn.style.cursor = "not-allowed";
    } else {
      prevBtn.style.opacity = "1";
      prevBtn.style.cursor = "pointer";
    }
  }

  // Update Next button
  if (nextBtn) {
    nextBtn.disabled = currentPage >= totalPages;
    if (currentPage >= totalPages) {
      nextBtn.style.opacity = "0.5";
      nextBtn.style.cursor = "not-allowed";
    } else {
      nextBtn.style.opacity = "1";
      nextBtn.style.cursor = "pointer";
    }
  }
}

function handleLayerPaginationInput() {
  const pageInput = document.getElementById("layer-pagination-input");
  if (!pageInput) return;

  const inputValue = parseInt(pageInput.value);
  const totalPages = getTotalPages();

  // Validate input
  if (isNaN(inputValue) || inputValue < 1) {
    pageInput.value = layerDialogState.currentPage;
    return;
  }

  if (inputValue > totalPages) {
    pageInput.value = totalPages;
    layerDialogState.currentPage = totalPages;
  } else {
    layerDialogState.currentPage = inputValue;
  }

  renderLayerGrid();

  // Scroll grid to top
  const layerGrid = document.getElementById("layer-grid");
  if (layerGrid) {
    layerGrid.scrollTop = 0;
  }
}

function handleLayerPaginationPrev() {
  if (layerDialogState.currentPage > 1) {
    layerDialogState.currentPage--;
    renderLayerGrid();

    // Scroll grid to top
    const layerGrid = document.getElementById("layer-grid");
    if (layerGrid) {
      layerGrid.scrollTop = 0;
    }
  }
}

function handleLayerPaginationNext() {
  const totalPages = getTotalPages();
  if (layerDialogState.currentPage < totalPages) {
    layerDialogState.currentPage++;
    renderLayerGrid();

    // Scroll grid to top
    const layerGrid = document.getElementById("layer-grid");
    if (layerGrid) {
      layerGrid.scrollTop = 0;
    }
  }
}

// Export functions for global access
if (typeof window !== "undefined") {
  window.openLayerDialog = openLayerDialog;
  window.closeLayerDialog = closeLayerDialog;
  window.openLayerRenameDialog = openLayerRenameDialog;
  window.loadLayerView = loadLayerView;
}
