import { getGraph, setGraph, originalState, unsavedChanges } from '../state/appState.js';

const API_BASE = '/api/plugins/graph';

// ========== Database Operations ==========

export async function loadGraphFromDb() {
    try {
        const response = await fetch(API_BASE);
        if (!response.ok) {
            console.warn('Could not load graph data from database. Server may not be running.');
            return;
        }
        
        const data = await response.json();
        if (data.nodes && data.edges) {
            const graph = getGraph();
            if (!graph) return;
            
            // Convert database format to graph format
            const convertedData = {
                nodes: data.nodes.map(node => ({
                    ...node,
                    chineseLabel: node.chinese_label || node.chineseLabel || '',
                    category: node.category || null,
                    // Parse layers from comma-separated string back to array (matching legacy format)
                    layers: node.layers 
                        ? node.layers.split(",").map(l => l.trim()).filter(l => l)
                        : []
                })),
                edges: data.edges.map(edge => ({
                    id: edge.id,
                    from: edge.from_node_id,
                    to: edge.to_node_id,
                    weight: edge.weight,
                    category: edge.category || null
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
            
            // Store original view state
            originalState.viewState = {
                scale: convertedData.scale || 1,
                offset: {...(convertedData.offset || { x: 0, y: 0 })}
            };
            
            graph.importData(convertedData, true); // true = skip callbacks to avoid tracking
            console.log(`Loaded ${data.metadata.totalNodes} nodes and ${data.metadata.totalEdges} edges from database`);
            
            // Load and apply filter state if available
            // First, get all available layers from the current database
            const availableLayers = graph.getAllLayers();
            
            if (data.filterState && data.filterState.layerFilterEnabled) {
                // Filter activeLayers to only include layers that exist in current database
                const validActiveLayers = (data.filterState.activeLayers || []).filter(
                    layer => availableLayers.includes(layer)
                );
                
                graph.setLayerFilterMode(data.filterState.layerFilterMode);
                graph.setActiveLayers(validActiveLayers);
                
                // Store original filter state (only with valid layers)
                originalState.filterState = {
                    layerFilterEnabled: validActiveLayers.length > 0,
                    activeLayers: [...validActiveLayers],
                    layerFilterMode: data.filterState.layerFilterMode || 'include'
                };
                
                // Update sidebar radio buttons
                const sidebarRadio = document.querySelector(`input[name="layer-filter-mode"][value="${data.filterState.layerFilterMode}"]`);
                if (sidebarRadio) sidebarRadio.checked = true;
                
                // Update layer summary
                if (typeof window.updateLayerSummary === 'function') {
                    window.updateLayerSummary();
                }
                
                console.log(`Restored filter state: ${data.filterState.layerFilterMode} mode with ${validActiveLayers.length} active layer(s)`);
            } else {
                // Clear filter state if not found or disabled
                graph.clearLayerFilter();
                // Store original filter state as empty
                originalState.filterState = {
                    layerFilterEnabled: false,
                    activeLayers: [],
                    layerFilterMode: 'include'
                };
            }
            
            // Clear unsaved changes when loading fresh data
            unsavedChanges.nodes.clear();
            unsavedChanges.edges.clear();
            unsavedChanges.viewState = null;
            unsavedChanges.filterState = null;
            
            // Close and refresh layer dialog if it's open (to clear any cached layer state)
            const layerDialog = document.getElementById('layer-management-dialog');
            if (layerDialog && !layerDialog.classList.contains('hidden')) {
                // Close the dialog to force refresh on next open
                layerDialog.classList.add('hidden');
            }
            
            // Update layer summary to reflect new database
            if (typeof window.updateLayerSummary === 'function') {
                window.updateLayerSummary();
            }
        }
    } catch (error) {
        console.warn('Could not connect to graph database:', error.message);
    }
}

export async function saveNodeToDb(node) {
    try {
        const response = await fetch(`${API_BASE}/nodes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: node.id,
                x: node.x,
                y: node.y,
                label: node.label,
                chinese_label: (node.chineseLabel !== undefined) ? node.chineseLabel : (node.chinese_label || null),
                color: node.color,
                radius: node.radius,
                category: node.category || null,
                layers: node.layers || null,
            })
        });
        if (!response.ok) throw new Error('Failed to save node');
    } catch (error) {
        console.error('Error saving node to database:', error);
    }
}

export async function updateNodeInDb(node) {
    try {
        const response = await fetch(`${API_BASE}/nodes/${node.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                x: node.x,
                y: node.y,
                label: node.label,
                chinese_label: (node.chineseLabel !== undefined) ? node.chineseLabel : (node.chinese_label || null),
                color: node.color,
                radius: node.radius,
                category: node.category || null,
                layers: node.layers || null,
            })
        });
        if (!response.ok) throw new Error('Failed to update node');
    } catch (error) {
        console.error('Error updating node in database:', error);
    }
}

export async function deleteNodeFromDb(nodeId) {
    try {
        const response = await fetch(`${API_BASE}/nodes/${nodeId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete node');
    } catch (error) {
        console.error('Error deleting node from database:', error);
    }
}

export async function saveEdgeToDb(edge) {
    try {
        const response = await fetch(`${API_BASE}/edges`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: edge.id,
                from_node_id: edge.from,
                to_node_id: edge.to,
                weight: edge.weight,
                category: edge.category || null
            })
        });
        if (!response.ok) throw new Error('Failed to save edge');
    } catch (error) {
        console.error('Error saving edge to database:', error);
    }
}

export async function updateEdgeInDb(edge) {
    try {
        const response = await fetch(`${API_BASE}/edges/${edge.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                weight: edge.weight,
                category: edge.category || null
            })
        });
        if (!response.ok) throw new Error('Failed to update edge');
    } catch (error) {
        console.error('Error updating edge in database:', error);
    }
}

export async function deleteEdgeFromDb(edgeId) {
    try {
        const response = await fetch(`${API_BASE}/edges/${edgeId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete edge');
    } catch (error) {
        console.error('Error deleting edge from database:', error);
    }
}

export async function clearGraphInDb() {
    try {
        const response = await fetch(`${API_BASE}/clear`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to clear graph');
    } catch (error) {
        console.error('Error clearing graph in database:', error);
    }
}

export async function saveViewStateToDb() {
    const graph = getGraph();
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

export async function saveFilterStateToDb(filterState = null) {
    // If filterState is provided, use it; otherwise read from graph (for manual saves)
    let stateToSave;
    if (filterState) {
        stateToSave = filterState;
    } else {
        const graph = getGraph();
        if (!graph) return;
        
        stateToSave = {
            layerFilterEnabled: graph.activeLayers && graph.activeLayers.size > 0,
            activeLayers: graph.activeLayers ? Array.from(graph.activeLayers) : [],
            layerFilterMode: graph.getLayerFilterMode() || 'include'
        };
    }
    
    try {
        const response = await fetch(`${API_BASE}/filter-state`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(stateToSave)
        });
        if (!response.ok) throw new Error('Failed to save filter state');
    } catch (error) {
        console.error('Error saving filter state to database:', error);
        throw error; // Re-throw so saveAllChanges can handle it
    }
}

export async function loadDatabase(filePath) {
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
        
        // Reload graph data from new database
        await loadGraphFromDb();
        
        console.log(`Loaded database from: ${filePath}`);
    } catch (error) {
        console.error('Error loading database:', error);
        alert(`Failed to load database: ${error.message}`);
    }
}

export async function saveAsDatabase(filename) {
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

export async function fetchDatabases() {
    try {
        const response = await fetch(`${API_BASE}/databases`);
        if (!response.ok) throw new Error('Failed to fetch databases');
        
        const data = await response.json();
        return data.databases || [];
    } catch (error) {
        console.error('Error loading databases:', error);
        throw error;
    }
}

export async function mergeDatabase(sourceDbPath, conflictResolution = 'skip') {
    // Validate input
    if (!sourceDbPath || typeof sourceDbPath !== 'string' || sourceDbPath.trim() === '') {
        throw new Error('Source database path is required');
    }
    
    try {
        const response = await fetch(`${API_BASE}/merge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sourceDbPath: sourceDbPath.trim(),
                conflictResolution
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to merge database');
        }
        
        const result = await response.json();
        
        // Reload graph from database to show merged data
        await loadGraphFromDb();
        
        // Mark database as modified for save tracking
        // Note: After merge, we consider the database as modified
        // The user should save if they want to persist the merge
        
        return result.stats;
    } catch (error) {
        console.error('Error merging database:', error);
        throw error;
    }
}

