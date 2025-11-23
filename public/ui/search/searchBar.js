// Search Bar Module - Inline search functionality
import { getGraph } from '../../state/appState.js';

/**
 * Setup search components for inline search bar
 */
export function setupSearchComponents() {
    console.log('=== Setting up search components ===');
    const nodeSearchInput = document.getElementById('node-search');
    const searchResults = document.getElementById('search-results');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const searchContainer = document.querySelector('.search-container');
    
    console.log('Node search input found:', !!nodeSearchInput);
    console.log('Search results found:', !!searchResults);
    console.log('Clear search button found:', !!clearSearchBtn);
    console.log('Search container found:', !!searchContainer);
    
    if (searchResults) {
        console.log('Search results element:', searchResults);
        console.log('Search results parent:', searchResults.parentElement);
    }

    // Node search functionality
    if (nodeSearchInput && searchResults) {
        nodeSearchInput.addEventListener('input', (e) => {
            const value = e.target.value;
            handleNodeSearch(value, searchResults, 'search');
            // Show/hide clear button
            if (clearSearchBtn) {
                clearSearchBtn.style.display = value.trim() ? 'inline-block' : 'none';
            }
        });
        
        nodeSearchInput.addEventListener('keydown', (e) => handleSearchKeydown(e, searchResults, 'search'));
        
        // Show dropdown when input gains focus (if there's text)
        nodeSearchInput.addEventListener('focus', (e) => {
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

    // Prevent clicks on search results from reaching canvas
    if (searchResults) {
        searchResults.addEventListener('mousedown', (e) => {
            console.log('Search results container mousedown');
            e.stopPropagation();
        });
        searchResults.addEventListener('click', (e) => {
            console.log('Search results container click');
            e.stopPropagation();
        });
    }
    
    // Close dropdowns when clicking outside the search container
    // Use a single handler that checks all related elements
    const handleDocumentClick = (e) => {
        console.log('=== Document Click Handler ===');
        console.log('Click target:', e.target);
        console.log('Click target tagName:', e.target.tagName);
        console.log('Click target className:', e.target.className);
        console.log('Click target id:', e.target.id);
        
        // Get all search-related elements
        const searchInput = document.getElementById('node-search');
        const results = document.getElementById('search-results');
        const clearBtn = document.getElementById('clear-search-btn');
        const container = document.querySelector('.search-container');
        
        console.log('Search input found:', !!searchInput);
        console.log('Results found:', !!results);
        console.log('Clear button found:', !!clearBtn);
        console.log('Container found:', !!container);
        
        if (results) {
            console.log('Results is hidden:', results.classList.contains('hidden'));
        }
        
        // Check if the click target is any of our search elements or their children
        const clickedOnInput = searchInput && (searchInput === e.target || searchInput.contains(e.target));
        const clickedOnResults = results && (results === e.target || results.contains(e.target));
        const clickedOnClearBtn = clearBtn && (clearBtn === e.target || clearBtn.contains(e.target));
        const clickedOnContainer = container && (container === e.target || container.contains(e.target));
        
        const isSearchElement = clickedOnInput || clickedOnResults || clickedOnClearBtn || clickedOnContainer;
        
        console.log('Clicked on input:', clickedOnInput);
        console.log('Clicked on results:', clickedOnResults);
        console.log('Clicked on clear button:', clickedOnClearBtn);
        console.log('Clicked on container:', clickedOnContainer);
        console.log('Is search element:', isSearchElement);
        
        // If click is outside all search elements, hide the dropdown
        if (!isSearchElement && results && !results.classList.contains('hidden')) {
            console.log('Hiding dropdown - click was outside search elements');
            results.classList.add('hidden');
        } else if (isSearchElement) {
            console.log('Keeping dropdown visible - click was inside search elements');
        } else {
            console.log('Dropdown already hidden or results not found');
        }
        console.log('=== End Document Click Handler ===\n');
    };
    
    // Add click listener - use capture phase to catch events early
    document.addEventListener('click', handleDocumentClick, true);
    console.log('Document click listener added for search dropdown (capture phase)');
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

            resultDiv.addEventListener('click', (e) => {
                console.log('Search result clicked:', node.id, node.label);
                e.preventDefault();
                e.stopPropagation(); // Prevent document click handler from firing
                e.stopImmediatePropagation(); // Stop all other handlers
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
                return false; // Additional prevention
            });
            
            // Also prevent mousedown from propagating
            resultDiv.addEventListener('mousedown', (e) => {
                console.log('Search result mousedown:', node.id);
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return false;
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

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

