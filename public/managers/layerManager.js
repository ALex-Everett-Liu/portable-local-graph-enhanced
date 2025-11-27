// Layer management functionality

// Update layer summary
export function updateLayerSummary() {
    const layerSummary = document.getElementById('layer-summary');
    if (!layerSummary || typeof window.graph === 'undefined') return;
    
    const graph = window.graph;
    const allLayers = graph.getAllLayers();
    const activeCount = graph.activeLayers ? graph.activeLayers.size : 0;
    
    if (allLayers.length === 0) {
        layerSummary.textContent = 'No layers defined';
    } else if (activeCount === 0) {
        layerSummary.textContent = `${allLayers.length} layers defined (none selected)`;
    } else {
        const modeText = graph.getLayerFilterMode() === 'include' ? 'showing' : 'excluding';
        layerSummary.textContent = `${allLayers.length} layers defined (${activeCount} ${modeText})`;
    }
}

// Initialize layer management
export function initializeLayerManagement() {
    // Add event listeners for mode radio buttons in sidebar
    const modeRadios = document.querySelectorAll('input[name="layer-filter-mode"]');
    modeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked && window.graph) {
                window.graph.setLayerFilterMode(this.value);
                updateLayerSummary();
                
                // Track filter state changes instead of saving immediately
                if (typeof window.trackFilterStateUpdate === 'function') {
                    const filterState = {
                        layerFilterEnabled: window.graph.activeLayers && window.graph.activeLayers.size > 0,
                        activeLayers: window.graph.activeLayers ? Array.from(window.graph.activeLayers) : [],
                        layerFilterMode: this.value
                    };
                    window.trackFilterStateUpdate(filterState);
                }
                
                // Apply current filter with new mode
                if (window.graph.activeLayers && window.graph.activeLayers.size > 0) {
                    const modeText = this.value === 'include' ? 'Showing' : 'Excluding';
                    const layers = Array.from(window.graph.activeLayers);
                    if (typeof showNotification === 'function') {
                        showNotification(`${modeText} ${layers.length} layer(s): ${layers.join(', ')}`);
                    }
                }
            }
        });
    });

    // Initialize layer summary when graph is ready
    const checkGraph = () => {
        if (typeof window.graph !== 'undefined') {
            updateLayerSummary();
        } else {
            setTimeout(checkGraph, 100);
        }
    };
    checkGraph();
}

// Export for global access
if (typeof window !== 'undefined') {
    window.updateLayerSummary = updateLayerSummary;
}

