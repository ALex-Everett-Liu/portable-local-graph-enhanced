import { unsavedChanges, originalState, getGraph } from '../state/appState.js';
import { updateSaveButtonVisibility } from '../ui/saveDiscardUI.js';

// ========== Change Tracking Functions ==========

export function trackNodeCreate(node) {
    // Track new node creation
    unsavedChanges.nodes.set(node.id, {
        type: 'create',
        data: {...node}
    });
    updateSaveButtonVisibility();
}

export function trackNodeUpdate(node) {
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

export function trackNodeDelete(nodeId) {
    const graph = getGraph();
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
    if (graph) {
        graph.edges.filter(e => e.from === nodeId || e.to === nodeId).forEach(edge => {
            trackEdgeDelete(edge.id);
        });
    }
    updateSaveButtonVisibility();
}

export function trackEdgeCreate(edge) {
    // Track new edge creation
    unsavedChanges.edges.set(edge.id, {
        type: 'create',
        data: {...edge}
    });
    updateSaveButtonVisibility();
}

export function trackEdgeUpdate(edge) {
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

export function trackEdgeDelete(edgeId) {
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

