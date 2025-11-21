import { unsavedChanges, originalState, getGraph } from '../state/appState.js';
import { 
    saveNodeToDb, 
    updateNodeInDb, 
    deleteNodeFromDb, 
    saveEdgeToDb, 
    updateEdgeInDb, 
    deleteEdgeFromDb,
    saveViewStateToDb,
    clearGraphInDb
} from '../services/databaseService.js';

// ========== Save/Discard Functions ==========

export function updateSaveButtonVisibility() {
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

export async function saveAllChanges() {
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

export function discardAllChanges() {
    const graph = getGraph();
    if (!graph) return;
    
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
                    edge.category = change.originalData.category || null;
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

// Export clear function for use in event listeners
export async function clearGraph() {
    if (confirm('Clear all nodes and edges? This will delete all data from the database.')) {
        await clearGraphInDb();
        const graph = getGraph();
        if (graph) {
            graph.clear();
        }
        // Clear unsaved changes tracking
        unsavedChanges.nodes.clear();
        unsavedChanges.edges.clear();
        originalState.nodes.clear();
        originalState.edges.clear();
        updateSaveButtonVisibility();
    }
}

