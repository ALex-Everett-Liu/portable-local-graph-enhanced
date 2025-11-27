import { getGraph } from '../state/appState.js';
import { trackViewStateUpdate } from './changeTracker.js';

// Debounce function for view state tracking
let viewStateTrackTimeout = null;

function debouncedTrackViewState() {
    if (viewStateTrackTimeout) {
        clearTimeout(viewStateTrackTimeout);
    }
    viewStateTrackTimeout = setTimeout(() => {
        const graph = getGraph();
        if (graph) {
            trackViewStateUpdate({
                scale: graph.scale,
                offset: {...graph.offset}
            });
        }
    }, 500); // Track after 500ms of no changes
}

export function setupViewStateSaving() {
    const graph = getGraph();
    if (!graph) return;
    
    // Track view state changes when scale or offset changes
    // We'll intercept the render calls or use a proxy
    // For now, we'll track on pan/zoom end
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
            debouncedTrackViewState();
        }
    };
}

