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

    // Use filtered nodes/edges if filtering is active, otherwise use all
    const filteredNodes = graph.getFilteredNodes ? graph.getFilteredNodes() : graph.nodes;
    const filteredEdges = graph.getFilteredEdges ? graph.getFilteredEdges() : graph.edges;

    if (nodeCountElement) {
        nodeCountElement.textContent = filteredNodes ? filteredNodes.length : 0;
    }
    if (edgeCountElement) {
        edgeCountElement.textContent = filteredEdges ? filteredEdges.length : 0;
    }
    
    // Update selection info
    updateSelectionInfo();
}

/**
 * Update the selection-info sidebar with selected node or edge details
 */
function updateSelectionInfo() {
    const graph = getGraph();
    if (!graph) return;
    
    const selectionInfoElement = document.getElementById('selection-info');
    if (!selectionInfoElement) return;
    
    if (graph.selectedNode) {
        const node = graph.selectedNode;
        const layers = node.layers && Array.isArray(node.layers) && node.layers.length > 0
            ? node.layers.join(', ')
            : 'None';
        
        // Format timestamps
        const formatTimestamp = (timestamp) => {
            if (!timestamp) return 'N/A';
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return 'N/A';
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
        };
        
        const createdAt = formatTimestamp(node.created_at || node.createdAt);
        const modifiedAt = formatTimestamp(node.updated_at || node.updatedAt || node.modifiedAt);
        
        // Centrality display
        let centralityDisplay = '';
        if (node.centrality) {
            // Get rankings for each centrality type
            const degreeRank = graph.getCentralityRank(node.id, 'degree');
            const betweennessRank = graph.getCentralityRank(node.id, 'betweenness');
            const closenessRank = graph.getCentralityRank(node.id, 'closeness');
            const eigenvectorRank = graph.getCentralityRank(node.id, 'eigenvector');
            const pagerankRank = graph.getCentralityRank(node.id, 'pagerank');

            // Helper function to get rank color and indicator
            function getRankIndicator(rank, total) {
                if (!rank || !total) return { color: '#666', indicator: '' };
                const ratio = rank / total;
                let color, indicator;
                if (ratio <= 0.1) { color = '#28a745'; indicator = '🔥'; } // Top 10%
                else if (ratio <= 0.25) { color = '#ffc107'; indicator = '⭐'; } // Top 25%
                else if (ratio <= 0.5) { color = '#17a2b8'; indicator = '👍'; } // Top 50%
                else { color = '#6c757d'; indicator = '⚪'; } // Bottom 50%
                return { color, indicator };
            }

            // Use filtered nodes for rank indicators and display count
            const filteredNodes = graph.getFilteredNodes ? graph.getFilteredNodes() : graph.nodes;
            const filteredNodeCount = filteredNodes.length;

            const degreeIndicator = getRankIndicator(degreeRank, filteredNodeCount);
            const betweennessIndicator = getRankIndicator(betweennessRank, filteredNodeCount);
            const closenessIndicator = getRankIndicator(closenessRank, filteredNodeCount);
            const eigenvectorIndicator = getRankIndicator(eigenvectorRank, filteredNodeCount);
            const pagerankIndicator = getRankIndicator(pagerankRank, filteredNodeCount);

            centralityDisplay = `
                <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #ddd;">
                    <p style="font-weight: bold; margin-bottom: 6px; font-size: 12px; color: #495057;">
                        📊 Centrality Analysis (${filteredNodeCount} nodes total)
                    </p>
                    <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
                        <tr style="border-bottom: 1px solid #f0f0f0;">
                            <td style="padding: 2px 0; font-weight: 600;">Degree</td>
                            <td style="padding: 2px 0; text-align: right; font-family: monospace; color: #007bff;">${node.centrality.degree || 'N/A'}</td>
                            <td style="padding: 2px 0; text-align: right; font-size: 10px; color: ${degreeIndicator.color};">
                                ${degreeIndicator.indicator} ${degreeRank ? `#${degreeRank}` : 'N/A'}
                            </td>
                        </tr>
                        <tr style="border-bottom: 1px solid #f0f0f0;">
                            <td style="padding: 2px 0; font-weight: 600;">Betweenness</td>
                            <td style="padding: 2px 0; text-align: right; font-family: monospace; color: #007bff;">${node.centrality.betweenness || 'N/A'}</td>
                            <td style="padding: 2px 0; text-align: right; font-size: 10px; color: ${betweennessIndicator.color};">
                                ${betweennessIndicator.indicator} ${betweennessRank ? `#${betweennessRank}` : 'N/A'}
                            </td>
                        </tr>
                        <tr style="border-bottom: 1px solid #f0f0f0;">
                            <td style="padding: 2px 0; font-weight: 600;">Closeness</td>
                            <td style="padding: 2px 0; text-align: right; font-family: monospace; color: #007bff;">${node.centrality.closeness || 'N/A'}</td>
                            <td style="padding: 2px 0; text-align: right; font-size: 10px; color: ${closenessIndicator.color};">
                                ${closenessIndicator.indicator} ${closenessRank ? `#${closenessRank}` : 'N/A'}
                            </td>
                        </tr>
                        <tr style="border-bottom: 1px solid #f0f0f0;">
                            <td style="padding: 2px 0; font-weight: 600;">Eigenvector</td>
                            <td style="padding: 2px 0; text-align: right; font-family: monospace; color: #007bff;">${node.centrality.eigenvector || 'N/A'}</td>
                            <td style="padding: 2px 0; text-align: right; font-size: 10px; color: ${eigenvectorIndicator.color};">
                                ${eigenvectorIndicator.indicator} ${eigenvectorRank ? `#${eigenvectorRank}` : 'N/A'}
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 2px 0; font-weight: 600;">PageRank</td>
                            <td style="padding: 2px 0; text-align: right; font-family: monospace; color: #007bff;">${node.centrality.pagerank || 'N/A'}</td>
                            <td style="padding: 2px 0; text-align: right; font-size: 10px; color: ${pagerankIndicator.color};">
                                ${pagerankIndicator.indicator} ${pagerankRank ? `#${pagerankRank}` : 'N/A'}
                            </td>
                        </tr>
                    </table>
                    <div style="margin-top: 6px; font-size: 9px; color: #666; text-align: center;">
                        🔥 Top 10% ⭐ Top 25% 👍 Top 50% ⚪ Others
                    </div>
                </div>
            `;
        }
        
        // Get font size from settings
        const fontSize = (window.GRAPH_CONSTANTS && window.GRAPH_CONSTANTS.SELECTION_INFO_FONT_SIZE) || 13;
        
        selectionInfoElement.innerHTML = `
            <div style="font-size: ${fontSize}px; line-height: 1.6;">
                <div><strong>English:</strong> ${escapeHtml(node.label || 'Unnamed Node')}</div>
                ${node.chineseLabel ? `<div><strong>中文:</strong> ${escapeHtml(node.chineseLabel)}</div>` : ''}
                <div><strong>Position:</strong> (${Math.round(node.x)}, ${Math.round(node.y)})</div>
                <div><strong>Color:</strong> <span style="display: inline-block; width: 14px; height: 14px; background: ${node.color || '#3b82f6'}; border: 1px solid #ccc; border-radius: 2px; vertical-align: middle; margin-right: 4px;"></span>${node.color || '#3b82f6'}</div>
                <div><strong>Size:</strong> ${node.radius || 20}px</div>
                ${node.category ? `<div><strong>Category:</strong> ${escapeHtml(node.category)}</div>` : ''}
                <div><strong>Layers:</strong> ${escapeHtml(layers)}</div>
                ${node.community ? `<div><strong>Community:</strong> ${escapeHtml(node.community)}</div>` : ''}
                <div><strong>Created:</strong> ${createdAt}</div>
                <div><strong>Modified:</strong> ${modifiedAt}</div>
                ${centralityDisplay}
            </div>
        `;
    } else if (graph.selectedEdge) {
        const edge = graph.selectedEdge;
        const fromNode = graph.nodes.find(n => n.id === edge.from);
        const toNode = graph.nodes.find(n => n.id === edge.to);
        const fromLabel = fromNode ? (fromNode.label || 'Unnamed Node') : 'Unknown';
        const toLabel = toNode ? (toNode.label || 'Unnamed Node') : 'Unknown';
        
        // Get font size from settings
        const fontSize = (window.GRAPH_CONSTANTS && window.GRAPH_CONSTANTS.SELECTION_INFO_FONT_SIZE) || 13;
        
        selectionInfoElement.innerHTML = `
            <div style="font-size: ${fontSize}px; line-height: 1.6;">
                <div><strong>From:</strong> ${escapeHtml(fromLabel)}</div>
                <div><strong>To:</strong> ${escapeHtml(toLabel)}</div>
                <div><strong>Weight:</strong> ${edge.weight || 1}</div>
                ${edge.category ? `<div><strong>Category:</strong> ${escapeHtml(edge.category)}</div>` : ''}
            </div>
        `;
    } else {
        selectionInfoElement.innerHTML = '<p>Nothing selected</p>';
    }
}

// Expose updateGraphInfo on window for use by other modules
if (typeof window !== 'undefined') {
    window.updateGraphInfo = updateGraphInfo;
}

// Export for module imports
export { updateGraphInfo };

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

