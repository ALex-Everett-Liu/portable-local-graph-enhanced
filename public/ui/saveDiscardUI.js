import { unsavedChanges, originalState, getGraph } from '../state/appState.js';
import { 
    saveNodeToDb, 
    updateNodeInDb, 
    deleteNodeFromDb, 
    saveEdgeToDb, 
    updateEdgeInDb, 
    deleteEdgeFromDb,
    saveViewStateToDb,
    saveFilterStateToDb,
    clearGraphInDb
} from '../services/databaseService.js';
import { triggerCanvasResize } from './sidebarResizer.js';

// ========== Save/Discard Functions ==========

export function updateSaveButtonVisibility() {
    const saveButton = document.getElementById('save-changes');
    const discardButton = document.getElementById('discard-changes');
    
    const hasNodeEdgeChanges = unsavedChanges.nodes.size > 0 || unsavedChanges.edges.size > 0;
    const hasFilterStateChanges = unsavedChanges.filterState !== null;
    const hasChanges = hasNodeEdgeChanges || hasFilterStateChanges;
    
    // Count changes (excluding viewState - it's saved separately)
    let totalChanges = unsavedChanges.nodes.size + unsavedChanges.edges.size;
    if (hasFilterStateChanges) totalChanges += 1;
    
    if (saveButton) {
        if (hasChanges) {
            // Preserve icon structure, only update text span
            const textSpan = saveButton.querySelector('span');
            if (textSpan) {
                textSpan.textContent = `Save Changes (${totalChanges})`;
            } else {
                saveButton.innerHTML = `<i data-lucide="save" class="icon"></i><span>Save Changes (${totalChanges})</span>`;
                if (window.lucide && typeof window.lucide.createIcons === 'function') {
                    lucide.createIcons();
                }
            }
            saveButton.style.display = 'block';
            saveButton.classList.add('has-unsaved');
            // Re-initialize Lucide icons when button becomes visible
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                lucide.createIcons();
            }
            // Trigger canvas resize to fix distortion when toolbar height changes
            triggerCanvasResize();
        } else {
            // Preserve icon structure, only update text span
            const textSpan = saveButton.querySelector('span');
            if (textSpan) {
                textSpan.textContent = 'Save Changes';
            } else {
                saveButton.innerHTML = `<i data-lucide="save" class="icon"></i><span>Save Changes</span>`;
                if (window.lucide && typeof window.lucide.createIcons === 'function') {
                    lucide.createIcons();
                }
            }
            saveButton.style.display = 'none';
            saveButton.classList.remove('has-unsaved');
            // Trigger canvas resize to fix distortion when toolbar height changes
            triggerCanvasResize();
        }
    }
    
    if (discardButton) {
        if (hasChanges) {
            // Preserve icon structure, only update text span
            const textSpan = discardButton.querySelector('span');
            if (textSpan) {
                textSpan.textContent = `Discard Changes (${totalChanges})`;
            } else {
                discardButton.innerHTML = `<i data-lucide="undo-2" class="icon"></i><span>Discard Changes (${totalChanges})</span>`;
                if (window.lucide && typeof window.lucide.createIcons === 'function') {
                    lucide.createIcons();
                }
            }
            discardButton.style.display = 'block';
            discardButton.classList.add('has-unsaved');
            // Re-initialize Lucide icons when button becomes visible
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                lucide.createIcons();
            }
            // Trigger canvas resize to fix distortion when toolbar height changes
            triggerCanvasResize();
        } else {
            // Preserve icon structure, only update text span
            const textSpan = discardButton.querySelector('span');
            if (textSpan) {
                textSpan.textContent = 'Discard';
            } else {
                discardButton.innerHTML = `<i data-lucide="undo-2" class="icon"></i><span>Discard</span>`;
                if (window.lucide && typeof window.lucide.createIcons === 'function') {
                    lucide.createIcons();
                }
            }
            discardButton.style.display = 'none';
            discardButton.classList.remove('has-unsaved');
            // Trigger canvas resize to fix distortion when toolbar height changes
            triggerCanvasResize();
        }
    }
}

export async function saveAllChanges() {
    // Check for all types of changes (nodes, edges, filterState)
    const hasNodeEdgeChanges = unsavedChanges.nodes.size > 0 || unsavedChanges.edges.size > 0;
    const hasFilterStateChanges = unsavedChanges.filterState !== null;
    const totalChanges = unsavedChanges.nodes.size + unsavedChanges.edges.size + (hasFilterStateChanges ? 1 : 0);
    
    if (totalChanges === 0) {
        const saveButton = document.getElementById('save-changes');
        if (saveButton) {
            const textSpan = saveButton.querySelector('span');
            const originalText = textSpan ? textSpan.textContent : 'Save Changes';
            if (textSpan) {
                textSpan.textContent = 'No changes to save';
            } else {
                saveButton.textContent = 'No changes to save';
            }
            setTimeout(() => {
                if (textSpan) {
                    textSpan.textContent = originalText;
                } else {
                    saveButton.textContent = originalText;
                }
            }, 1500);
        }
        return;
    }

    const saveButton = document.getElementById('save-changes');
    const textSpan = saveButton ? saveButton.querySelector('span') : null;
    const originalText = textSpan ? textSpan.textContent : (saveButton ? saveButton.textContent : 'Save Changes');
    
    if (saveButton) {
        if (textSpan) {
            textSpan.textContent = 'Saving...';
        } else {
            saveButton.textContent = 'Saving...';
        }
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

        // Save filter state if changed
        if (unsavedChanges.filterState) {
            // Use the tracked filter state instead of reading from graph
            await saveFilterStateToDb(unsavedChanges.filterState);
            // Update original state
            originalState.filterState = {...unsavedChanges.filterState};
        }

        // Clear unsaved changes (excluding viewState - it's saved separately)
        let savedCount = unsavedChanges.nodes.size + unsavedChanges.edges.size;
        if (unsavedChanges.filterState) savedCount += 1;
        
        unsavedChanges.nodes.clear();
        unsavedChanges.edges.clear();
        unsavedChanges.filterState = null;
        updateSaveButtonVisibility();

        if (saveButton) {
            const textSpan = saveButton.querySelector('span');
            if (textSpan) {
                textSpan.textContent = `Saved ${savedCount} change${savedCount !== 1 ? 's' : ''}!`;
            } else {
                saveButton.textContent = `Saved ${savedCount} change${savedCount !== 1 ? 's' : ''}!`;
            }
            setTimeout(() => {
                if (textSpan) {
                    textSpan.textContent = originalText;
                } else {
                    saveButton.textContent = originalText;
                }
                saveButton.disabled = false;
                updateSaveButtonVisibility();
            }, 2000);
        }

        console.log(`Saved ${savedCount} changes`);
    } catch (error) {
        console.error('Error saving changes:', error);
        if (saveButton) {
            const textSpan = saveButton.querySelector('span');
            if (textSpan) {
                textSpan.textContent = 'Error!';
            } else {
                saveButton.textContent = 'Error!';
            }
            setTimeout(() => {
                if (textSpan) {
                    textSpan.textContent = originalText;
                } else {
                    saveButton.textContent = originalText;
                }
                saveButton.disabled = false;
            }, 2000);
        }
    }
}

export function discardAllChanges() {
    const graph = getGraph();
    if (!graph) return;
    
    const hasNodeEdgeChanges = unsavedChanges.nodes.size > 0 || unsavedChanges.edges.size > 0;
    const hasFilterStateChanges = unsavedChanges.filterState !== null;
    let totalChanges = unsavedChanges.nodes.size + unsavedChanges.edges.size;
    if (hasFilterStateChanges) totalChanges += 1;
    
    if (totalChanges === 0) {
        const discardButton = document.getElementById('discard-changes');
        if (discardButton) {
            const textSpan = discardButton.querySelector('span');
            const originalText = textSpan ? textSpan.textContent : 'Discard';
            if (textSpan) {
                textSpan.textContent = 'No changes to discard';
            } else {
                discardButton.textContent = 'No changes to discard';
            }
            setTimeout(() => {
                if (textSpan) {
                    textSpan.textContent = originalText;
                } else {
                    discardButton.textContent = originalText;
                }
            }, 1500);
        }
        return;
    }

    const discardButton = document.getElementById('discard-changes');
    const textSpan = discardButton ? discardButton.querySelector('span') : null;
    const originalText = textSpan ? textSpan.textContent : (discardButton ? discardButton.textContent : 'Discard');
    
    if (discardButton) {
        if (textSpan) {
            textSpan.textContent = 'Discarding...';
        } else {
            discardButton.textContent = 'Discarding...';
        }
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

        // Restore filter state if changed
        if (unsavedChanges.filterState && originalState.filterState) {
            const filterState = originalState.filterState;
            graph.activeLayers = new Set(filterState.activeLayers || []);
            graph.setLayerFilterMode(filterState.layerFilterMode || 'include');
            
            // Update sidebar radio buttons
            const sidebarRadio = document.querySelector(
                `input[name="layer-filter-mode"][value="${filterState.layerFilterMode || 'include'}"]`
            );
            if (sidebarRadio) sidebarRadio.checked = true;
            
            // Update layer summary
            if (typeof window.updateLayerSummary === 'function') {
                window.updateLayerSummary();
            }
        }

        // Clear unsaved changes (excluding viewState - it's saved separately)
        let discardedCount = unsavedChanges.nodes.size + unsavedChanges.edges.size;
        if (unsavedChanges.filterState) discardedCount += 1;
        
        unsavedChanges.nodes.clear();
        unsavedChanges.edges.clear();
        unsavedChanges.filterState = null;
        
        // Re-render graph
        graph.render();
        updateSaveButtonVisibility();

        if (discardButton) {
            const textSpan = discardButton.querySelector('span');
            if (textSpan) {
                textSpan.textContent = `Discarded ${discardedCount} change${discardedCount !== 1 ? 's' : ''}!`;
            } else {
                discardButton.textContent = `Discarded ${discardedCount} change${discardedCount !== 1 ? 's' : ''}!`;
            }
            setTimeout(() => {
                if (textSpan) {
                    textSpan.textContent = originalText;
                } else {
                    discardButton.textContent = originalText;
                }
                discardButton.disabled = false;
            }, 2000);
        }

        console.log(`Discarded ${discardedCount} changes`);
    } catch (error) {
        console.error('Error discarding changes:', error);
        if (discardButton) {
            const textSpan = discardButton.querySelector('span');
            if (textSpan) {
                textSpan.textContent = 'Error!';
            } else {
                discardButton.textContent = 'Error!';
            }
            setTimeout(() => {
                if (textSpan) {
                    textSpan.textContent = originalText;
                } else {
                    discardButton.textContent = originalText;
                }
                discardButton.disabled = false;
            }, 2000);
        }
    }
}

// Export clear function for use in event listeners
export async function clearGraph() {
    // Use window.showConfirmDialog if available (exposed globally), otherwise import
    const confirmFn = window.showConfirmDialog || (await import('../utils/confirmDialog.js')).showConfirmDialog;
    const confirmed = await confirmFn(
        'Clear all nodes and edges? This will delete all data from the database.',
        'danger',
        'Clear',
        'Cancel'
    );
    if (confirmed) {
        await clearGraphInDb();
        const graph = getGraph();
        if (graph) {
            graph.clear();
        }
        // Clear unsaved changes tracking
        unsavedChanges.nodes.clear();
        unsavedChanges.edges.clear();
        unsavedChanges.filterState = null;
        originalState.nodes.clear();
        originalState.edges.clear();
        originalState.filterState = null;
        updateSaveButtonVisibility();
    }
}

