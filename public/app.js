let graph;
let appMode = 'select';
let contextMenu = null;
// Use relative path to main server API
const API_BASE = '/api/plugins/graph';

// Track unsaved changes
let unsavedChanges = {
    nodes: new Map(), // nodeId -> {type: 'create'|'update'|'delete', data: {...}, originalData: {...}}
    edges: new Map()  // edgeId -> {type: 'create'|'update'|'delete', data: {...}, originalData: {...}}
};

// Store original state from database
let originalState = {
    nodes: new Map(), // nodeId -> node data
    edges: new Map()  // edgeId -> edge data
};

function init() {
    const canvas = document.getElementById('graph-canvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    // Remove automatic saving - track changes instead
    graph = new Graph(canvas, {
        onNodeCreate: trackNodeCreate,
        onNodeUpdate: trackNodeUpdate,
        onNodeDelete: trackNodeDelete,
        onEdgeCreate: trackEdgeCreate,
        onEdgeUpdate: trackEdgeUpdate,
        onEdgeDelete: trackEdgeDelete
    });

    setupEventListeners();
    setupContextMenu();
    setupDialogs();

    // Set initial mode - match HTML default (node-mode is active)
    setMode('node');
    
    // Load existing graph data from database
    loadGraphFromDb();
    
    // Initialize save/discard button visibility
    updateSaveButtonVisibility();
    
    // Monitor scale and offset changes and save them
    setupViewStateSaving();
}

function setupViewStateSaving() {
    if (!graph) return;
    
    // Save view state when scale or offset changes
    // We'll intercept the render calls or use a proxy
    // For now, we'll save on pan/zoom end
    const originalRender = graph.render.bind(graph);
    let lastScale = graph.scale;
    let lastOffset = { ...graph.offset };
    
    graph.render = function() {
        originalRender();
        
        // Check if scale or offset changed
        const scaleChanged = Math.abs(graph.scale - lastScale) > 0.001;
        const offsetChanged = Math.abs(graph.offset.x - lastOffset.x) > 0.1 || 
                             Math.abs(graph.offset.y - lastOffset.y) > 0.1;
        
        if (scaleChanged || offsetChanged) {
            lastScale = graph.scale;
            lastOffset = { ...graph.offset };
            debouncedSaveViewState();
        }
    };
}

function setupEventListeners() {
    // Mode buttons
    document.getElementById('select-mode').addEventListener('click', () => setMode('select'));
    document.getElementById('node-mode').addEventListener('click', () => setMode('node'));
    document.getElementById('edge-mode').addEventListener('click', () => setMode('edge'));

    // Load button
    document.getElementById('load-btn').addEventListener('click', () => showLoadDialog());

    // Save As button
    document.getElementById('save-as-btn').addEventListener('click', () => showSaveAsDialog());

    // Action buttons
    document.getElementById('clear-btn').addEventListener('click', async () => {
        if (confirm('Clear all nodes and edges? This will delete all data from the database.')) {
            await clearGraphInDb();
            graph.clear();
            // Clear unsaved changes tracking
            unsavedChanges.nodes.clear();
            unsavedChanges.edges.clear();
            originalState.nodes.clear();
            originalState.edges.clear();
            updateSaveButtonVisibility();
        }
    });

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
}

function setupContextMenu() {
    contextMenu = document.getElementById('context-menu');
    if (!contextMenu) {
        // Context menu doesn't exist in new HTML - that's okay, we'll use right-click to show dialogs directly
        return;
    }

    document.querySelectorAll('.context-menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            handleContextMenuAction(action);
            hideContextMenu();
        });
    });
}

function setupDialogs() {
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
}

function setMode(mode) {
    appMode = mode;
    window.appMode = mode;

    // Update button states
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    const modeBtn = document.getElementById(mode + '-mode');
    if (modeBtn) {
        modeBtn.classList.add('active');
    }

    // Update cursor
    const canvas = document.getElementById('graph-canvas');
    if (canvas) {
        canvas.style.cursor = mode === 'select' ? 'default' : 'crosshair';
    }

    // Reset edge creation state
    if (graph) {
        graph.tempEdgeStart = null;
    }
}

function showContextMenu(x, y) {
    contextMenu.style.display = 'block';
    contextMenu.style.left = x + 'px';
    contextMenu.style.top = y + 'px';
}

function hideContextMenu() {
    if (contextMenu) {
        contextMenu.style.display = 'none';
    }
}

// Make showContextMenu available globally
window.showContextMenu = showContextMenu;

function handleContextMenuAction(action) {
    if (action === 'edit') {
        if (graph.selectedNode) {
            openNodeDialog();
        } else if (graph.selectedEdge) {
            openEdgeDialog();
        }
    } else if (action === 'delete') {
        if (graph.selectedNode) {
            graph.deleteNode(graph.selectedNode);
        } else if (graph.selectedEdge) {
            graph.deleteEdge(graph.selectedEdge);
        }
    }
}

function openNodeDialog() {
    if (!graph.selectedNode) return;
    // Use the ui-functions.js showNodeDialog
    if (window.showNodeDialog) {
        window.showNodeDialog(graph.selectedNode);
    }
}

function openEdgeDialog() {
    if (!graph.selectedEdge) return;
    // Use the ui-functions.js showEdgeDialog
    if (window.showEdgeDialog) {
        window.showEdgeDialog(graph.selectedEdge);
    }
}

// ========== Database Operations ==========

async function loadGraphFromDb() {
    try {
        const response = await fetch(API_BASE);
        if (!response.ok) {
            console.warn('Could not load graph data from database. Server may not be running.');
            return;
        }
        
        const data = await response.json();
        if (data.nodes && data.edges) {
            // Convert database format to graph format
            const convertedData = {
                nodes: data.nodes.map(node => ({...node})),
                edges: data.edges.map(edge => ({
                    id: edge.id,
                    from: edge.from_node_id,
                    to: edge.to_node_id,
                    weight: edge.weight
                })),
                scale: data.scale || 1,
                offset: data.offset || { x: 0, y: 0 }
            };
            
            // Store original state (in graph format)
            originalState.nodes.clear();
            originalState.edges.clear();
            convertedData.nodes.forEach(node => {
                originalState.nodes.set(node.id, {...node});
            });
            convertedData.edges.forEach(edge => {
                originalState.edges.set(edge.id, {...edge});
            });
            
            graph.importData(convertedData, true); // true = skip callbacks to avoid tracking
            console.log(`Loaded ${data.metadata.totalNodes} nodes and ${data.metadata.totalEdges} edges from database`);
            
            // Clear unsaved changes when loading fresh data
            unsavedChanges.nodes.clear();
            unsavedChanges.edges.clear();
            updateSaveButtonVisibility();
        }
    } catch (error) {
        console.warn('Could not connect to graph database:', error.message);
    }
}

async function saveNodeToDb(node) {
    try {
        const response = await fetch(`${API_BASE}/nodes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: node.id,
                x: node.x,
                y: node.y,
                label: node.label,
                color: node.color,
                radius: node.radius,
                full_content: node.fullContent || node.label
            })
        });
        if (!response.ok) throw new Error('Failed to save node');
    } catch (error) {
        console.error('Error saving node to database:', error);
    }
}

async function updateNodeInDb(node) {
    try {
        const response = await fetch(`${API_BASE}/nodes/${node.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                x: node.x,
                y: node.y,
                label: node.label,
                color: node.color,
                radius: node.radius,
                full_content: node.fullContent || node.label
            })
        });
        if (!response.ok) throw new Error('Failed to update node');
    } catch (error) {
        console.error('Error updating node in database:', error);
    }
}

async function deleteNodeFromDb(nodeId) {
    try {
        const response = await fetch(`${API_BASE}/nodes/${nodeId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete node');
    } catch (error) {
        console.error('Error deleting node from database:', error);
    }
}

async function saveEdgeToDb(edge) {
    try {
        const response = await fetch(`${API_BASE}/edges`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: edge.id,
                from_node_id: edge.from,
                to_node_id: edge.to,
                weight: edge.weight
            })
        });
        if (!response.ok) throw new Error('Failed to save edge');
    } catch (error) {
        console.error('Error saving edge to database:', error);
    }
}

async function updateEdgeInDb(edge) {
    try {
        const response = await fetch(`${API_BASE}/edges/${edge.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                weight: edge.weight
            })
        });
        if (!response.ok) throw new Error('Failed to update edge');
    } catch (error) {
        console.error('Error updating edge in database:', error);
    }
}

async function deleteEdgeFromDb(edgeId) {
    try {
        const response = await fetch(`${API_BASE}/edges/${edgeId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete edge');
    } catch (error) {
        console.error('Error deleting edge from database:', error);
    }
}

async function clearGraphInDb() {
    try {
        const response = await fetch(`${API_BASE}/clear`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to clear graph');
    } catch (error) {
        console.error('Error clearing graph in database:', error);
    }
}

async function saveViewStateToDb() {
    if (!graph) return;
    
    try {
        const exportData = graph.exportData();
        const response = await fetch(`${API_BASE}/view-state`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                scale: exportData.scale,
                offset: exportData.offset
            })
        });
        if (!response.ok) throw new Error('Failed to save view state');
    } catch (error) {
        console.error('Error saving view state to database:', error);
    }
}

// Debounce function for view state saving
let viewStateSaveTimeout = null;
function debouncedSaveViewState() {
    if (viewStateSaveTimeout) {
        clearTimeout(viewStateSaveTimeout);
    }
    viewStateSaveTimeout = setTimeout(() => {
        saveViewStateToDb();
    }, 500); // Save after 500ms of no changes
}

// ========== Change Tracking Functions ==========

function trackNodeCreate(node) {
    // Track new node creation
    unsavedChanges.nodes.set(node.id, {
        type: 'create',
        data: {...node}
    });
    updateSaveButtonVisibility();
}

function trackNodeUpdate(node) {
    const original = originalState.nodes.get(node.id);
    if (original) {
        // Track update to existing node
        unsavedChanges.nodes.set(node.id, {
            type: 'update',
            data: {...node},
            originalData: {...original}
        });
    } else {
        // Node doesn't exist in original state, treat as create
        unsavedChanges.nodes.set(node.id, {
            type: 'create',
            data: {...node}
        });
    }
    updateSaveButtonVisibility();
}

function trackNodeDelete(nodeId) {
    const original = originalState.nodes.get(nodeId);
    if (original) {
        // Track deletion of existing node
        unsavedChanges.nodes.set(nodeId, {
            type: 'delete',
            data: null,
            originalData: {...original}
        });
    } else {
        // Node was created but not saved, just remove from unsaved creates
        unsavedChanges.nodes.delete(nodeId);
    }
    // Also remove any edges connected to this node
    graph.edges.filter(e => e.from === nodeId || e.to === nodeId).forEach(edge => {
        trackEdgeDelete(edge.id);
    });
    updateSaveButtonVisibility();
}

function trackEdgeCreate(edge) {
    // Track new edge creation
    unsavedChanges.edges.set(edge.id, {
        type: 'create',
        data: {...edge}
    });
    updateSaveButtonVisibility();
}

function trackEdgeUpdate(edge) {
    const original = originalState.edges.get(edge.id);
    if (original) {
        // Track update to existing edge
        unsavedChanges.edges.set(edge.id, {
            type: 'update',
            data: {...edge},
            originalData: {...original}
        });
    } else {
        // Edge doesn't exist in original state, treat as create
        unsavedChanges.edges.set(edge.id, {
            type: 'create',
            data: {...edge}
        });
    }
    updateSaveButtonVisibility();
}

function trackEdgeDelete(edgeId) {
    const original = originalState.edges.get(edgeId);
    if (original) {
        // Track deletion of existing edge
        unsavedChanges.edges.set(edgeId, {
            type: 'delete',
            data: null,
            originalData: {...original}
        });
    } else {
        // Edge was created but not saved, just remove from unsaved creates
        unsavedChanges.edges.delete(edgeId);
    }
    updateSaveButtonVisibility();
}

// ========== Save/Discard Functions ==========

function updateSaveButtonVisibility() {
    const saveButton = document.getElementById('save-changes');
    const discardButton = document.getElementById('discard-changes');
    
    const hasChanges = unsavedChanges.nodes.size > 0 || unsavedChanges.edges.size > 0;
    const totalChanges = unsavedChanges.nodes.size + unsavedChanges.edges.size;
    
    if (saveButton) {
        if (hasChanges) {
            saveButton.textContent = `Save Changes (${totalChanges})`;
            saveButton.style.display = 'block';
            saveButton.classList.add('has-unsaved');
        } else {
            saveButton.textContent = 'Save Changes';
            saveButton.style.display = 'none';
            saveButton.classList.remove('has-unsaved');
        }
    }
    
    if (discardButton) {
        if (hasChanges) {
            discardButton.textContent = `Discard Changes (${totalChanges})`;
            discardButton.style.display = 'block';
            discardButton.classList.add('has-unsaved');
        } else {
            discardButton.textContent = 'Discard Changes';
            discardButton.style.display = 'none';
            discardButton.classList.remove('has-unsaved');
        }
    }
}

async function saveAllChanges() {
    const totalChanges = unsavedChanges.nodes.size + unsavedChanges.edges.size;
    if (totalChanges === 0) {
        const saveButton = document.getElementById('save-changes');
        if (saveButton) {
            const originalText = saveButton.textContent;
            saveButton.textContent = 'No changes to save';
            setTimeout(() => {
                saveButton.textContent = originalText;
            }, 1500);
        }
        return;
    }

    const saveButton = document.getElementById('save-changes');
    const originalText = saveButton ? saveButton.textContent : 'Save Changes';
    
    if (saveButton) {
        saveButton.textContent = 'Saving...';
        saveButton.disabled = true;
    }

    try {
        // Process node changes
        for (const [nodeId, change] of unsavedChanges.nodes.entries()) {
            if (change.type === 'create') {
                await saveNodeToDb(change.data);
                // Add to original state
                originalState.nodes.set(nodeId, {...change.data});
            } else if (change.type === 'update') {
                await updateNodeInDb(change.data);
                // Update original state
                originalState.nodes.set(nodeId, {...change.data});
            } else if (change.type === 'delete') {
                await deleteNodeFromDb(nodeId);
                // Remove from original state
                originalState.nodes.delete(nodeId);
            }
        }

        // Process edge changes
        for (const [edgeId, change] of unsavedChanges.edges.entries()) {
            if (change.type === 'create') {
                await saveEdgeToDb(change.data);
                // Add to original state
                originalState.edges.set(edgeId, {...change.data});
            } else if (change.type === 'update') {
                await updateEdgeInDb(change.data);
                // Update original state
                originalState.edges.set(edgeId, {...change.data});
            } else if (change.type === 'delete') {
                await deleteEdgeFromDb(edgeId);
                // Remove from original state
                originalState.edges.delete(edgeId);
            }
        }

        // Save view state (scale and offset)
        await saveViewStateToDb();

        // Clear unsaved changes
        const savedCount = unsavedChanges.nodes.size + unsavedChanges.edges.size;
        unsavedChanges.nodes.clear();
        unsavedChanges.edges.clear();
        updateSaveButtonVisibility();

        if (saveButton) {
            saveButton.textContent = `Saved ${savedCount} change${savedCount !== 1 ? 's' : ''}!`;
            setTimeout(() => {
                saveButton.textContent = originalText;
                saveButton.disabled = false;
                updateSaveButtonVisibility();
            }, 2000);
        }

        console.log(`Saved ${savedCount} changes`);
    } catch (error) {
        console.error('Error saving changes:', error);
        if (saveButton) {
            saveButton.textContent = 'Error!';
            setTimeout(() => {
                saveButton.textContent = originalText;
                saveButton.disabled = false;
            }, 2000);
        }
    }
}

function discardAllChanges() {
    const totalChanges = unsavedChanges.nodes.size + unsavedChanges.edges.size;
    if (totalChanges === 0) {
        const discardButton = document.getElementById('discard-changes');
        if (discardButton) {
            const originalText = discardButton.textContent;
            discardButton.textContent = 'No changes to discard';
            setTimeout(() => {
                discardButton.textContent = originalText;
            }, 1500);
        }
        return;
    }

    const discardButton = document.getElementById('discard-changes');
    const originalText = discardButton ? discardButton.textContent : 'Discard Changes';
    
    if (discardButton) {
        discardButton.textContent = 'Discarding...';
        discardButton.disabled = true;
    }

    try {
        // Restore nodes first (edges depend on nodes)
        for (const [nodeId, change] of unsavedChanges.nodes.entries()) {
            if (change.type === 'create') {
                // Remove newly created node
                graph.nodes = graph.nodes.filter(n => n.id !== nodeId);
            } else if (change.type === 'update' && change.originalData) {
                // Restore original node data
                const node = graph.nodes.find(n => n.id === nodeId);
                if (node) {
                    Object.assign(node, change.originalData);
                }
            } else if (change.type === 'delete' && change.originalData) {
                // Restore deleted node
                graph.nodes.push({...change.originalData});
            }
        }

        // Restore edges (after nodes are restored)
        for (const [edgeId, change] of unsavedChanges.edges.entries()) {
            if (change.type === 'create') {
                // Remove newly created edge
                graph.edges = graph.edges.filter(e => e.id !== edgeId);
            } else if (change.type === 'update' && change.originalData) {
                // Restore original edge data
                const edge = graph.edges.find(e => e.id === edgeId);
                if (edge) {
                    // Restore edge properties, maintaining node references
                    edge.weight = change.originalData.weight;
                    // Note: from and to should remain the same (node references)
                }
            } else if (change.type === 'delete' && change.originalData) {
                // Restore deleted edge - check if both nodes exist
                const fromNodeExists = graph.nodes.some(n => n.id === change.originalData.from);
                const toNodeExists = graph.nodes.some(n => n.id === change.originalData.to);
                if (fromNodeExists && toNodeExists) {
                    graph.edges.push({...change.originalData});
                }
            }
        }

        // Clear unsaved changes
        const discardedCount = unsavedChanges.nodes.size + unsavedChanges.edges.size;
        unsavedChanges.nodes.clear();
        unsavedChanges.edges.clear();
        
        // Re-render graph
        graph.render();
        updateSaveButtonVisibility();

        if (discardButton) {
            discardButton.textContent = `Discarded ${discardedCount} change${discardedCount !== 1 ? 's' : ''}!`;
            setTimeout(() => {
                discardButton.textContent = originalText;
                discardButton.disabled = false;
            }, 2000);
        }

        console.log(`Discarded ${discardedCount} changes`);
    } catch (error) {
        console.error('Error discarding changes:', error);
        if (discardButton) {
            discardButton.textContent = 'Error!';
            setTimeout(() => {
                discardButton.textContent = originalText;
                discardButton.disabled = false;
            }, 2000);
        }
    }
}

// ========== Load Database Functions ==========

let selectedDatabasePath = null;
let allDatabases = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 10;

async function showLoadDialog() {
    // Check for unsaved changes
    const hasUnsavedChanges = unsavedChanges.nodes.size > 0 || unsavedChanges.edges.size > 0;
    
    if (hasUnsavedChanges) {
        const proceed = confirm(
            `You have ${unsavedChanges.nodes.size + unsavedChanges.edges.size} unsaved change(s). ` +
            `Loading a new database will discard these changes. Continue?`
        );
        if (!proceed) {
            return;
        }
    }

    const dialog = document.getElementById('load-dialog');
    const databaseList = document.getElementById('database-list');
    const pagination = document.getElementById('database-pagination');
    
    if (!dialog || !databaseList || !pagination) return;
    
    // Show dialog
    dialog.classList.remove('hidden');
    
    // Load database list
    databaseList.innerHTML = '<p style="text-align: center; color: #999;">Loading databases...</p>';
    pagination.style.display = 'none';
    selectedDatabasePath = null;
    currentPage = 1;
    
    try {
        const response = await fetch(`${API_BASE}/databases`);
        if (!response.ok) throw new Error('Failed to fetch databases');
        
        const data = await response.json();
        allDatabases = data.databases || [];
        
        if (allDatabases.length === 0) {
            databaseList.innerHTML = '<p style="text-align: center; color: #999;">No database files found.</p>';
            pagination.style.display = 'none';
            return;
        }
        
        // Render first page
        renderDatabasePage();
    } catch (error) {
        console.error('Error loading databases:', error);
        databaseList.innerHTML = `<p style="text-align: center; color: #f44336;">Error: ${error.message}</p>`;
        pagination.style.display = 'none';
    }
}

function renderDatabasePage() {
    const databaseList = document.getElementById('database-list');
    const pagination = document.getElementById('database-pagination');
    const paginationInfo = document.getElementById('pagination-info');
    const prevBtn = document.getElementById('pagination-prev');
    const nextBtn = document.getElementById('pagination-next');
    
    if (!databaseList || !pagination || !paginationInfo || !prevBtn || !nextBtn) return;
    
    const totalPages = Math.ceil(allDatabases.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, allDatabases.length);
    const pageDatabases = allDatabases.slice(startIndex, endIndex);
    
    // Render database list for current page
    databaseList.innerHTML = '';
    pageDatabases.forEach(db => {
        const item = document.createElement('div');
        item.className = 'database-item';
        item.style.cssText = 'padding: 8px; margin: 4px 0; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; background: #f9f9f9;';
        item.innerHTML = `<strong>${db.name}</strong><br><small style="color: #666;">${db.path}</small>`;
        
        // Check if this item is selected
        if (selectedDatabasePath === db.path) {
            item.style.background = '#e3f2fd';
            item.style.borderColor = '#2196f3';
        }
        
        item.addEventListener('click', () => {
            // Remove previous selection
            document.querySelectorAll('.database-item').forEach(el => {
                el.style.background = '#f9f9f9';
                el.style.borderColor = '#ddd';
            });
            
            // Highlight selected
            item.style.background = '#e3f2fd';
            item.style.borderColor = '#2196f3';
            selectedDatabasePath = db.path;
        });
        
        item.addEventListener('mouseenter', () => {
            if (selectedDatabasePath !== db.path) {
                item.style.background = '#f0f0f0';
            }
        });
        
        item.addEventListener('mouseleave', () => {
            if (selectedDatabasePath !== db.path) {
                item.style.background = '#f9f9f9';
            }
        });
        
        databaseList.appendChild(item);
    });
    
    // Update pagination controls
    if (totalPages > 1) {
        pagination.style.display = 'block';
        paginationInfo.textContent = `Page ${currentPage} of ${totalPages} (${allDatabases.length} total)`;
        
        // Update prev button
        prevBtn.disabled = currentPage === 1;
        if (currentPage === 1) {
            prevBtn.style.opacity = '0.5';
            prevBtn.style.cursor = 'not-allowed';
            prevBtn.style.background = '#f0f0f0';
        } else {
            prevBtn.style.opacity = '1';
            prevBtn.style.cursor = 'pointer';
            prevBtn.style.background = '#f9f9f9';
            prevBtn.onmouseenter = () => { prevBtn.style.background = '#e9e9e9'; };
            prevBtn.onmouseleave = () => { prevBtn.style.background = '#f9f9f9'; };
        }
        
        // Update next button
        nextBtn.disabled = currentPage === totalPages;
        if (currentPage === totalPages) {
            nextBtn.style.opacity = '0.5';
            nextBtn.style.cursor = 'not-allowed';
            nextBtn.style.background = '#f0f0f0';
        } else {
            nextBtn.style.opacity = '1';
            nextBtn.style.cursor = 'pointer';
            nextBtn.style.background = '#f9f9f9';
            nextBtn.onmouseenter = () => { nextBtn.style.background = '#e9e9e9'; };
            nextBtn.onmouseleave = () => { nextBtn.style.background = '#f9f9f9'; };
        }
    } else {
        pagination.style.display = 'none';
    }
}

function setupPaginationListeners() {
    const prevBtn = document.getElementById('pagination-prev');
    const nextBtn = document.getElementById('pagination-next');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderDatabasePage();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(allDatabases.length / ITEMS_PER_PAGE);
            if (currentPage < totalPages) {
                currentPage++;
                renderDatabasePage();
            }
        });
    }
}

function handleLoadOK() {
    if (!selectedDatabasePath) {
        alert('Please select a database file to load.');
        return;
    }
    
    loadDatabase(selectedDatabasePath);
    hideLoadDialog();
}

function handleLoadCancel() {
    hideLoadDialog();
}

function hideLoadDialog() {
    const dialog = document.getElementById('load-dialog');
    if (dialog) {
        dialog.classList.add('hidden');
    }
    selectedDatabasePath = null;
    allDatabases = [];
    currentPage = 1;
}

async function loadDatabase(filePath) {
    try {
        // Switch database on server
        const switchResponse = await fetch(`${API_BASE}/switch-database`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath })
        });
        
        if (!switchResponse.ok) {
            throw new Error('Failed to switch database');
        }
        
        // Clear unsaved changes
        unsavedChanges.nodes.clear();
        unsavedChanges.edges.clear();
        updateSaveButtonVisibility();
        
        // Reload graph data from new database
        await loadGraphFromDb();
        
        console.log(`Loaded database from: ${filePath}`);
    } catch (error) {
        console.error('Error loading database:', error);
        alert(`Failed to load database: ${error.message}`);
    }
}

// ========== Save As Functions ==========

function showSaveAsDialog() {
    const dialog = document.getElementById('save-as-dialog');
    const filenameInput = document.getElementById('save-as-filename');
    
    if (!dialog || !filenameInput) return;
    
    // Clear previous input
    filenameInput.value = '';
    
    // Show dialog
    dialog.classList.remove('hidden');
    
    // Focus input
    setTimeout(() => filenameInput.focus(), 100);
}

function handleSaveAsOK() {
    const filenameInput = document.getElementById('save-as-filename');
    if (!filenameInput) return;
    
    const filename = filenameInput.value.trim();
    
    if (!filename) {
        alert('Please enter a filename.');
        return;
    }
    
    // Ensure .db extension
    const finalFilename = filename.endsWith('.db') ? filename : `${filename}.db`;
    
    saveAsDatabase(finalFilename);
    hideSaveAsDialog();
}

function handleSaveAsCancel() {
    hideSaveAsDialog();
}

function hideSaveAsDialog() {
    const dialog = document.getElementById('save-as-dialog');
    if (dialog) {
        dialog.classList.add('hidden');
    }
}

async function saveAsDatabase(filename) {
    try {
        const response = await fetch(`${API_BASE}/save-as`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to save database');
        }
        
        const result = await response.json();
        
        // Ask if user wants to switch to the new database
        const switchToNew = confirm(
            `Graph saved successfully to "${filename}".\n\n` +
            `Would you like to switch to the new database file?`
        );
        
        if (switchToNew) {
            // Switch to new database
            await loadDatabase(result.filePath);
        } else {
            // Just reload current database to refresh state
            await loadGraphFromDb();
        }
        
        console.log(`Saved graph to: ${filename}`);
    } catch (error) {
        console.error('Error saving database:', error);
        alert(`Failed to save database: ${error.message}`);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', init);

