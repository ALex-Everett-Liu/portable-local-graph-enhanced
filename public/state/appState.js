// Global state management
export let graph = null;
export let appMode = 'select';
export let contextMenu = null;
export const API_BASE = '/api/plugins/graph';

// Track unsaved changes
export const unsavedChanges = {
    nodes: new Map(), // nodeId -> {type: 'create'|'update'|'delete', data: {...}, originalData: {...}}
    edges: new Map(), // edgeId -> {type: 'create'|'update'|'delete', data: {...}, originalData: {...}}
    viewState: null,  // {scale, offset} or null if no changes
    filterState: null  // {layerFilterEnabled, activeLayers, layerFilterMode} or null if no changes
};

// Store original state from database
export const originalState = {
    nodes: new Map(), // nodeId -> node data
    edges: new Map(), // edgeId -> edge data
    viewState: null,  // {scale, offset} from database
    filterState: null // {layerFilterEnabled, activeLayers, layerFilterMode} from database
};

// Setters/getters for controlled access
export function setGraph(newGraph) {
    graph = newGraph;
    // Expose graph on window for non-module scripts (like ui-functions.js)
    window.graph = newGraph;
}

export function getGraph() {
    return graph;
}

// Expose getGraph on window for non-module scripts (like ui-functions.js)
// This needs to be available immediately, not just when graph is set
if (typeof window !== 'undefined') {
    window.getGraph = getGraph;
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

