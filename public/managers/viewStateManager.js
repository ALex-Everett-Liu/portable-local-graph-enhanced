import { getGraph } from '../state/appState.js';
import { saveViewStateToDb } from '../services/databaseService.js';

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

export function setupViewStateSaving() {
    const graph = getGraph();
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

