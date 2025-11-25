// Edge Search Dialog Module - Create Edge via Search
import { getGraph } from '../../state/appState.js';

// Maximum number of search results to display
const MAX_RESULTS = 20;

// Edge search dialog state
let edgeSearchState = {
    sourceNodeId: null,
    sourceNodeLabel: null,
    targetNodeId: null,
    targetNodeLabel: null,
    sourceSearchResults: [],
    targetSearchResults: [],
    sourceHighlightedIndex: -1,
    targetHighlightedIndex: -1,
    activeSearchType: null // 'source' or 'target'
};

/**
 * Initialize edge search dialog when DOM is ready
 */
export function initializeEdgeSearchDialog() {
    // Add event listeners for edge search dialog
    const sourceInput = document.getElementById('edge-source-search');
    const targetInput = document.getElementById('edge-target-search');
    const okBtn = document.getElementById('edge-search-ok');
    const cancelBtn = document.getElementById('edge-search-cancel');

    if (sourceInput) {
        sourceInput.addEventListener('input', (e) => handleEdgeNodeSearch(e.target.value, 'source'));
        sourceInput.addEventListener('keydown', (e) => handleEdgeSearchKeydown(e, 'source'));
        sourceInput.addEventListener('focus', () => {
            edgeSearchState.activeSearchType = 'source';
            if (sourceInput.value.trim()) {
                handleEdgeNodeSearch(sourceInput.value, 'source');
            }
        });
    }

    if (targetInput) {
        targetInput.addEventListener('input', (e) => handleEdgeNodeSearch(e.target.value, 'target'));
        targetInput.addEventListener('keydown', (e) => handleEdgeSearchKeydown(e, 'target'));
        targetInput.addEventListener('focus', () => {
            edgeSearchState.activeSearchType = 'target';
            if (targetInput.value.trim()) {
                handleEdgeNodeSearch(targetInput.value, 'target');
            }
        });
    }

    if (okBtn) {
        okBtn.addEventListener('click', handleEdgeSearchOK);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeEdgeSearchDialog);
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        const sourceDropdown = document.getElementById('edge-source-results');
        const targetDropdown = document.getElementById('edge-target-results');
        const sourceInput = document.getElementById('edge-source-search');
        const targetInput = document.getElementById('edge-target-search');

        if (sourceDropdown && !sourceDropdown.contains(e.target) && 
            sourceInput && !sourceInput.contains(e.target)) {
            sourceDropdown.classList.add('hidden');
        }

        if (targetDropdown && !targetDropdown.contains(e.target) && 
            targetInput && !targetInput.contains(e.target)) {
            targetDropdown.classList.add('hidden');
        }
    });

    // Close dialog with Escape key
    document.addEventListener('keydown', (e) => {
        const dialog = document.getElementById('edge-search-dialog');
        if (e.key === 'Escape' && dialog && !dialog.classList.contains('hidden')) {
            closeEdgeSearchDialog();
        }
    });
}

/**
 * Show edge search dialog
 */
export function showEdgeSearchDialog() {
    const dialog = document.getElementById('edge-search-dialog');
    if (!dialog) {
        console.error('Edge search dialog not found');
        return;
    }

    // Reset state
    edgeSearchState = {
        sourceNodeId: null,
        sourceNodeLabel: null,
        targetNodeId: null,
        targetNodeLabel: null,
        sourceSearchResults: [],
        targetSearchResults: [],
        sourceHighlightedIndex: -1,
        targetHighlightedIndex: -1,
        activeSearchType: null
    };

    // Clear all fields
    const sourceInput = document.getElementById('edge-source-search');
    const targetInput = document.getElementById('edge-target-search');
    const weightInput = document.getElementById('edge-weight-input');
    const categoryInput = document.getElementById('edge-category-input');
    const sourceSelected = document.getElementById('edge-source-selected');
    const targetSelected = document.getElementById('edge-target-selected');
    const sourceDropdown = document.getElementById('edge-source-results');
    const targetDropdown = document.getElementById('edge-target-results');

    if (sourceInput) sourceInput.value = '';
    if (targetInput) targetInput.value = '';
    if (weightInput) weightInput.value = '1';
    if (categoryInput) categoryInput.value = '';
    if (sourceSelected) sourceSelected.textContent = '';
    if (targetSelected) targetSelected.textContent = '';
    if (sourceDropdown) {
        sourceDropdown.innerHTML = '';
        sourceDropdown.classList.add('hidden');
    }
    if (targetDropdown) {
        targetDropdown.innerHTML = '';
        targetDropdown.classList.add('hidden');
    }

    // Update button state
    updateEdgeSearchButtons();

    // Show dialog
    dialog.classList.remove('hidden');

    // Focus source input
    if (sourceInput) {
        sourceInput.focus();
    }
}

/**
 * Close edge search dialog
 */
export function closeEdgeSearchDialog() {
    const dialog = document.getElementById('edge-search-dialog');
    if (dialog) {
        dialog.classList.add('hidden');
    }
}

/**
 * Handle node search for edge creation
 */
function handleEdgeNodeSearch(query, type) {
    const graph = getGraph();
    if (!graph || !graph.nodes) {
        console.error('Graph not available for search');
        return;
    }

    const searchTerm = query.trim().toLowerCase();
    if (searchTerm.length === 0) {
        const dropdown = document.getElementById(`edge-${type}-results`);
        const selectedDiv = document.getElementById(`edge-${type}-selected`);
        if (dropdown) {
            dropdown.innerHTML = '';
            dropdown.classList.add('hidden');
        }
        // Clear selection if input is cleared
        if (selectedDiv && edgeSearchState[`${type}NodeId`]) {
            edgeSearchState[`${type}NodeId`] = null;
            edgeSearchState[`${type}NodeLabel`] = null;
            selectedDiv.textContent = '';
            selectedDiv.style.color = '#666';
            selectedDiv.style.fontWeight = 'normal';
            updateEdgeSearchButtons();
        }
        edgeSearchState[`${type}SearchResults`] = [];
        edgeSearchState[`${type}HighlightedIndex`] = -1;
        return;
    }

    // Filter nodes by label (English or Chinese)
    const results = graph.nodes.filter(node => {
        const label = (node.label || '').toLowerCase();
        const chineseLabel = (node.chineseLabel || '').toLowerCase();
        return label.includes(searchTerm) || chineseLabel.includes(searchTerm);
    }).slice(0, MAX_RESULTS);

    // Store results
    edgeSearchState[`${type}SearchResults`] = results;
    edgeSearchState[`${type}HighlightedIndex`] = -1;

    // Render results
    renderEdgeSearchResults(results, type);
}

/**
 * Render search results in dropdown
 */
function renderEdgeSearchResults(results, type) {
    const dropdown = document.getElementById(`edge-${type}-results`);
    if (!dropdown) return;

    if (results.length === 0) {
        dropdown.innerHTML = '<div style="padding: 8px; color: #666; font-size: 12px;">No nodes found</div>';
        dropdown.classList.remove('hidden');
        return;
    }

    let html = '';
    results.forEach((node, index) => {
        const isHighlighted = edgeSearchState[`${type}HighlightedIndex`] === index;
        const label = escapeHtml(node.label || 'Unnamed Node');
        const chineseLabel = node.chineseLabel ? escapeHtml(node.chineseLabel) : '';
        
        html += `
            <div class="edge-search-result-item"
                 data-node-id="${node.id}"
                 data-index="${index}"
                 style="padding: 8px; cursor: pointer; user-select: none;
                        background: ${isHighlighted ? '#f5f5f5' : 'white'};
                        border-bottom: 1px solid #eee;"
                 onmouseenter="highlightEdgeSearchResult(${index}, '${type}')"
                 onclick="selectEdgeNode('${node.id}', '${escapeHtml(node.label || 'Unnamed Node')}', '${type}')">
                <div style="font-weight: bold; font-size: 13px;">${label}</div>
                ${chineseLabel ? `<div style="font-size: 11px; color: #666; margin-top: 2px;">中文: ${chineseLabel}</div>` : ''}
            </div>
        `;
    });

    dropdown.innerHTML = html;
    dropdown.classList.remove('hidden');
}

/**
 * Highlight a search result (exposed for inline handlers)
 */
window.highlightEdgeSearchResult = function(index, type) {
    edgeSearchState[`${type}HighlightedIndex`] = index;
    const results = edgeSearchState[`${type}SearchResults`];
    if (results && results.length > 0) {
        renderEdgeSearchResults(results, type);
    }
};

/**
 * Select a node for edge creation (exposed for inline handlers)
 */
window.selectEdgeNode = function(nodeId, label, type) {
    const graph = getGraph();
    if (!graph) {
        console.error('Graph not available');
        return;
    }

    const node = graph.nodes.find(n => n.id === nodeId);
    if (!node) {
        console.error('Node not found:', nodeId);
        return;
    }

    // Store selected node
    edgeSearchState[`${type}NodeId`] = nodeId;
    edgeSearchState[`${type}NodeLabel`] = label;

    // Update UI
    const selectedDiv = document.getElementById(`edge-${type}-selected`);
    const input = document.getElementById(`edge-${type}-search`);
    const dropdown = document.getElementById(`edge-${type}-results`);

    if (selectedDiv) {
        selectedDiv.textContent = `Selected: ${label}`;
        selectedDiv.style.color = '#2196f3';
        selectedDiv.style.fontWeight = '600';
    }

    if (input) {
        input.value = label;
    }

    if (dropdown) {
        dropdown.classList.add('hidden');
    }

    // Update button state
    updateEdgeSearchButtons();
};

/**
 * Handle keyboard navigation in search inputs
 */
function handleEdgeSearchKeydown(e, type) {
    const results = edgeSearchState[`${type}SearchResults`];
    if (results.length === 0) return;

    const highlightedIndex = edgeSearchState[`${type}HighlightedIndex`];

    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            if (highlightedIndex < results.length - 1) {
                edgeSearchState[`${type}HighlightedIndex`] = highlightedIndex + 1;
                renderEdgeSearchResults(results, type);
            }
            break;
        case 'ArrowUp':
            e.preventDefault();
            if (highlightedIndex > 0) {
                edgeSearchState[`${type}HighlightedIndex`] = highlightedIndex - 1;
                renderEdgeSearchResults(results, type);
            }
            break;
        case 'Enter':
            e.preventDefault();
            if (highlightedIndex >= 0 && highlightedIndex < results.length) {
                const node = results[highlightedIndex];
                selectEdgeNode(node.id, node.label || 'Unnamed Node', type);
            }
            break;
        case 'Escape':
            e.preventDefault();
            const dropdown = document.getElementById(`edge-${type}-results`);
            if (dropdown) {
                dropdown.classList.add('hidden');
            }
            break;
    }
}

/**
 * Handle OK button click - create the edge
 */
function handleEdgeSearchOK() {
    const graph = getGraph();
    if (!graph) {
        console.error('Graph not available');
        return;
    }

    // Validate both nodes are selected
    if (!edgeSearchState.sourceNodeId || !edgeSearchState.targetNodeId) {
        if (window.showNotification) {
            window.showNotification('Please select both source and target nodes', 'error');
        } else {
            alert('Please select both source and target nodes');
        }
        return;
    }

    // Prevent self-loops
    if (edgeSearchState.sourceNodeId === edgeSearchState.targetNodeId) {
        if (window.showNotification) {
            window.showNotification('Source and target nodes cannot be the same', 'error');
        } else {
            alert('Source and target nodes cannot be the same');
        }
        return;
    }

    // Get weight and validate
    const weightInput = document.getElementById('edge-weight-input');
    const weight = parseFloat(weightInput ? weightInput.value : '1');
    
    if (isNaN(weight) || weight <= 0) {
        if (window.showNotification) {
            window.showNotification('Weight must be a positive number', 'error');
        } else {
            alert('Weight must be a positive number');
        }
        return;
    }

    // Get category (optional)
    const categoryInput = document.getElementById('edge-category-input');
    const category = categoryInput ? categoryInput.value.trim() : '';
    const finalCategory = category || null;

    // Find nodes
    const sourceNode = graph.nodes.find(n => n.id === edgeSearchState.sourceNodeId);
    const targetNode = graph.nodes.find(n => n.id === edgeSearchState.targetNodeId);

    if (!sourceNode || !targetNode) {
        console.error('Source or target node not found');
        if (window.showNotification) {
            window.showNotification('One or both nodes not found', 'error');
        } else {
            alert('One or both nodes not found');
        }
        return;
    }

    // Check for existing edge (bidirectional check)
    const existingEdge = graph.edges.find(e => 
        (e.from === edgeSearchState.sourceNodeId && e.to === edgeSearchState.targetNodeId) ||
        (e.from === edgeSearchState.targetNodeId && e.to === edgeSearchState.sourceNodeId)
    );

    if (existingEdge) {
        if (window.showNotification) {
            window.showNotification('An edge already exists between these nodes', 'error');
        } else {
            alert('An edge already exists between these nodes');
        }
        return;
    }

    // Save state for undo/redo (if needed)
    // Note: The graph's addEdge method will trigger the onEdgeCreate callback
    // which tracks changes via trackEdgeCreate

    // Create edge via graph.addEdge()
    const edge = graph.addEdge(sourceNode, targetNode, weight);
    
    // Set category if provided (addEdge doesn't support category directly)
    // Note: The edge was already tracked as create by addEdge's callback
    // We just need to update the edge object with category
    if (finalCategory) {
        edge.category = finalCategory;
        // Update the change tracking to include category
        // Since the edge was just created, trackEdgeUpdate will treat it as create
        // which is fine - it will update the tracked data with the category
        if (window.trackEdgeUpdate) {
            window.trackEdgeUpdate(edge);
        }
    }

    // Show success notification
    if (window.showNotification) {
        window.showNotification(
            `Edge created: ${edgeSearchState.sourceNodeLabel} → ${edgeSearchState.targetNodeLabel}`,
            'success'
        );
    }

    // Close dialog
    closeEdgeSearchDialog();
}

/**
 * Update button states based on selections
 */
function updateEdgeSearchButtons() {
    const okBtn = document.getElementById('edge-search-ok');
    if (okBtn) {
        const hasBothNodes = edgeSearchState.sourceNodeId && edgeSearchState.targetNodeId;
        okBtn.disabled = !hasBothNodes;
        if (hasBothNodes) {
            okBtn.style.opacity = '1';
            okBtn.style.cursor = 'pointer';
        } else {
            okBtn.style.opacity = '0.5';
            okBtn.style.cursor = 'not-allowed';
        }
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

