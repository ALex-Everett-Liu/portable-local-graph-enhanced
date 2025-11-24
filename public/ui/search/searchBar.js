// Search Bar Module - Inline search functionality
import { getGraph } from '../../state/appState.js';

/**
 * Setup search components for inline search bar
 */
// Module-level flag to track if dropdown was manually closed
let dropdownManuallyClosed = false;

export function setupSearchComponents() {
    const nodeSearchInput = document.getElementById('node-search');
    const searchResults = document.getElementById('search-results');
    const clearSearchBtn = document.getElementById('clear-search-btn');

    // Node search functionality
    if (nodeSearchInput && searchResults) {
        nodeSearchInput.addEventListener('input', (e) => {
            const value = e.target.value;
            if (value.trim()) {
                dropdownManuallyClosed = false; // Reset flag when user types
                handleNodeSearch(value, searchResults, 'search');
            } else {
                searchResults.classList.add('hidden');
                clearNodeHighlighting();
            }
            // Show/hide clear button
            if (clearSearchBtn) {
                clearSearchBtn.style.display = value.trim() ? 'inline-block' : 'none';
            }
        });
        
        nodeSearchInput.addEventListener('keydown', (e) => handleSearchKeydown(e, searchResults, 'search'));
        
        // Show dropdown when input gains focus (if there's text)
        nodeSearchInput.addEventListener('focus', (e) => {
            dropdownManuallyClosed = false; // Reset flag on focus
            if (e.target.value.trim()) {
                const graph = getGraph();
                if (graph && graph.nodes) {
                    handleNodeSearch(e.target.value, searchResults, 'search');
                }
            }
        });
    }

    // Clear search
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering document click
            clearNodeSearch();
        });
        clearSearchBtn.style.display = 'none'; // Initially hidden
    }

    // Simple click-outside handler - just check if click is outside search-container
    // Since dropdown is inside search-container, clicking on it is still "inside"
    document.addEventListener('click', (e) => {
        const container = document.querySelector('.search-container');
        if (container && searchResults && !container.contains(e.target)) {
            // Click is outside the search container - hide dropdown
            if (!searchResults.classList.contains('hidden')) {
                searchResults.classList.add('hidden');
                dropdownManuallyClosed = true;
                clearNodeHighlighting();
                const graph = getGraph();
                if (graph && graph.nodes) {
                    updateSearchCount(0, graph.nodes.length);
                }
            }
        }
    });
}

/**
 * Handle node search input
 */
function handleNodeSearch(query, container, type) {
    if (!query.trim()) {
        container.classList.add('hidden');
        if (type === 'search') clearNodeHighlighting();
        return;
    }

    const graph = getGraph();
    if (!graph || !graph.nodes) {
        return;
    }

    const nodes = graph.nodes;
    const searchTerm = query.toLowerCase();

    const results = nodes.filter(node => 
        (node.label && node.label.toLowerCase().includes(searchTerm)) ||
        (node.chineseLabel && node.chineseLabel.toLowerCase().includes(searchTerm))
    ).slice(0, 20); // Limit to 20 results for performance

    renderSearchResults(results, container, type, query);

    if (type === 'search') {
        updateSearchCount(results.length, nodes.length);
        highlightSearchResults(results);
    }
}

/**
 * Render search results in dropdown
 */
function renderSearchResults(results, container, type, query) {
    container.innerHTML = '';

    if (results.length === 0) {
        container.innerHTML = '<div class="search-result">No nodes found</div>';
    } else {
        results.forEach((node, index) => {
            const resultDiv = document.createElement('div');
            resultDiv.className = 'search-result';
            resultDiv.dataset.nodeId = node.id;
            resultDiv.dataset.index = index;

            const labelMatch = highlightMatch(node.label || 'Unnamed Node', query);
            const chineseMatch = node.chineseLabel ? highlightMatch(node.chineseLabel, query) : '';

            resultDiv.innerHTML = `
                <div class="node-label">${labelMatch}</div>
                ${chineseMatch ? `<div class="node-chinese">${chineseMatch}</div>` : ''}
            `;

            resultDiv.addEventListener('click', () => {
                if (type === 'search') {
                    selectAndCenterNode(node.id);
                }
                container.classList.add('hidden');
                // Clear the input and hide clear button
                const nodeSearchInput = document.getElementById('node-search');
                if (nodeSearchInput) {
                    nodeSearchInput.value = '';
                    const clearSearchBtn = document.getElementById('clear-search-btn');
                    if (clearSearchBtn) {
                        clearSearchBtn.style.display = 'none';
                    }
                }
            });

            container.appendChild(resultDiv);
        });
    }

    container.classList.remove('hidden');
}

/**
 * Highlight search matches in text
 */
function highlightMatch(text, query) {
    if (!text) return '';
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return escapeHtml(text);

    const before = escapeHtml(text.substring(0, index));
    const match = escapeHtml(text.substring(index, index + query.length));
    const after = escapeHtml(text.substring(index + query.length));

    return `${before}<strong style="background: #fff3cd;">${match}</strong>${after}`;
}

/**
 * Handle search keydown events (arrow keys, enter, escape)
 */
function handleSearchKeydown(e, container, type) {
    if (container.classList.contains('hidden')) return;

    const results = container.querySelectorAll('.search-result');
    const active = container.querySelector('.search-result.active');

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (active) {
            active.classList.remove('active');
            const next = active.nextElementSibling;
            if (next) next.classList.add('active');
        } else {
            results[0]?.classList.add('active');
        }
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (active) {
            active.classList.remove('active');
            const prev = active.previousElementSibling;
            if (prev) prev.classList.add('active');
        } else {
            results[results.length - 1]?.classList.add('active');
        }
    } else if (e.key === 'Enter') {
        e.preventDefault();
        const activeResult = container.querySelector('.search-result.active') || results[0];
        if (activeResult) {
            const nodeId = activeResult.dataset.nodeId;
            if (type === 'search') {
                selectAndCenterNode(nodeId);
            }
            container.classList.add('hidden');
        }
    } else if (e.key === 'Escape') {
        container.classList.add('hidden');
    }
}

/**
 * Select and center node on the graph
 */
function selectAndCenterNode(nodeId) {
    const graph = getGraph();
    if (!graph) return;

    const node = graph.nodes.find(n => n.id == nodeId);
    if (!node) return;

    // Clear previous selections
    graph.selectedNode = null;
    graph.selectedEdge = null;

    // Select the node
    graph.selectedNode = node;

    // Center the view on the node
    const canvas = graph.canvas;
    graph.offset.x = -node.x * graph.scale + canvas.width / 2;
    graph.offset.y = -node.y * graph.scale + canvas.height / 2;

    graph.render();
    updateGraphInfo();

    // Show notification
    if (window.showNotification) {
        window.showNotification(`Selected: ${node.label || 'Unnamed Node'}`);
    }
}

/**
 * Highlight search results on the graph
 */
function highlightSearchResults(results) {
    const graph = getGraph();
    if (!graph) return;

    // Clear previous highlighting
    clearNodeHighlighting();

    // Add highlighting to found nodes
    const highlightedNodeIds = results.map(node => node.id);
    
    // Store highlighted nodes for renderer
    if (!graph.highlightedNodes) {
        graph.highlightedNodes = [];
    }
    graph.highlightedNodes = highlightedNodeIds;

    graph.render();
}

/**
 * Clear node highlighting
 */
function clearNodeHighlighting() {
    const graph = getGraph();
    if (!graph) return;

    if (graph.highlightedNodes) {
        graph.highlightedNodes = [];
    }
    
    if (graph.render) {
        graph.render();
    }
}

/**
 * Clear node search
 */
function clearNodeSearch() {
    const nodeSearchInput = document.getElementById('node-search');
    const searchResults = document.getElementById('search-results');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    
    dropdownManuallyClosed = true; // Mark as manually closed
    
    if (nodeSearchInput) {
        nodeSearchInput.value = '';
        nodeSearchInput.focus();
    }
    if (searchResults) {
        searchResults.classList.add('hidden');
    }
    if (clearSearchBtn) {
        clearSearchBtn.style.display = 'none';
    }
    
    clearNodeHighlighting();
    
    const graph = getGraph();
    if (graph && graph.nodes) {
        updateSearchCount(0, graph.nodes.length);
    }
}

/**
 * Update search count display
 */
function updateSearchCount(found, total) {
    const countElement = document.getElementById('search-count');
    const nodeSearchInput = document.getElementById('node-search');
    
    if (!countElement) return;

    if (found > 0) {
        countElement.textContent = `${found} of ${total} nodes`;
        countElement.style.color = '#28a745';
    } else if (nodeSearchInput && nodeSearchInput.value.trim()) {
        countElement.textContent = `No nodes found (${total} total)`;
        countElement.style.color = '#dc3545';
    } else {
        countElement.textContent = `${total} nodes`;
        countElement.style.color = '#666';
    }
}

/**
 * Update graph info display
 */
function updateGraphInfo() {
    const graph = getGraph();
    if (!graph) return;

    const nodeCountElement = document.getElementById('node-count');
    const edgeCountElement = document.getElementById('edge-count');

    if (nodeCountElement) {
        nodeCountElement.textContent = graph.nodes ? graph.nodes.length : 0;
    }
    if (edgeCountElement) {
        edgeCountElement.textContent = graph.edges ? graph.edges.length : 0;
    }
}

// Expose updateGraphInfo on window for use by other modules
if (typeof window !== 'undefined') {
    window.updateGraphInfo = updateGraphInfo;
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

