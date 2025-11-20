// Global state management
export let graph = null;
export let appMode = 'select';
export let contextMenu = null;
export const API_BASE = '/api/plugins/graph';

// Track unsaved changes
export const unsavedChanges = {
    nodes: new Map(), // nodeId -> {type: 'create'|'update'|'delete', data: {...}, originalData: {...}}
    edges: new Map()  // edgeId -> {type: 'create'|'update'|'delete', data: {...}, originalData: {...}}
};

// Store original state from database
export const originalState = {
    nodes: new Map(), // nodeId -> node data
    edges: new Map()  // edgeId -> edge data
};

// Setters/getters for controlled access
export function setGraph(newGraph) {
    graph = newGraph;
}

export function getGraph() {
    return graph;
}

export function setAppMode(mode) {
    appMode = mode;
    window.appMode = mode;
}

export function getAppMode() {
    return appMode;
}

export function setContextMenu(menu) {
    contextMenu = menu;
}

export function getContextMenu() {
    return contextMenu;
}

