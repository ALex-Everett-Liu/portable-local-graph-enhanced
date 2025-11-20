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

export async function updateNodeInDb(node) {
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
                weight: edge.weight
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
                weight: edge.weight
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

