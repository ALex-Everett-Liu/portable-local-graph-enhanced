// Node Search Dialog Module
import { getGraph } from '../../state/appState.js';

// Pagination configuration
const RESULTS_PER_PAGE = 20;

// Search dialog state
let searchDialogState = {
    selectedNode: null,
    searchResults: [], // All matching results
    searchTerm: '',
    highlightedIndex: -1,
    currentPage: 1,
    totalResults: 0
};

/**
 * Initialize search dialog when DOM is ready
 */
export function initializeSearchDialog() {
    // Add event listeners for search dialog
    const searchInput = document.getElementById('dialog-node-search');
    const clearBtn = document.getElementById('dialog-clear-search-btn');
    const selectBtn = document.getElementById('dialog-select-node-btn');
    const navigateBtn = document.getElementById('dialog-search-navigate');
    const cancelBtn = document.getElementById('dialog-search-cancel');

    if (searchInput) {
        searchInput.addEventListener('input', handleDialogSearch);
        searchInput.addEventListener('keydown', handleDialogSearchKeydown);
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', clearDialogSearch);
    }

    if (selectBtn) {
        selectBtn.addEventListener('click', selectDialogNode);
    }

    if (navigateBtn) {
        navigateBtn.addEventListener('click', navigateToSelectedNode);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeSearchDialog);
    }

    // Pagination input
    const paginationInput = document.getElementById('dialog-pagination-input');
    if (paginationInput) {
        paginationInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handlePaginationInput();
            }
        });
    }

    // Close dialog with Escape key
    document.addEventListener('keydown', (e) => {
        const searchDialog = document.getElementById('node-search-dialog');
        if (e.key === 'Escape' && searchDialog && !searchDialog.classList.contains('hidden')) {
            closeSearchDialog();
        }
    });
}

/**
 * Show search dialog
 */
export function showSearchDialog() {
    const dialog = document.getElementById('node-search-dialog');
    if (!dialog) {
        console.error('Search dialog not found');
        return;
    }

    // Reset state
    searchDialogState = {
        selectedNode: null,
        searchResults: [],
        searchTerm: '',
        highlightedIndex: -1,
        currentPage: 1,
        totalResults: 0
    };

    // Clear previous search
    const searchInput = document.getElementById('dialog-node-search');
    const searchResults = document.getElementById('dialog-search-results');
    const searchResultsList = document.getElementById('search-results-list');
    const selectedNodeInfo = document.getElementById('selected-node-info');

    if (searchInput) searchInput.value = '';
    if (searchResults) searchResults.classList.add('hidden');
    if (searchResultsList) {
        searchResultsList.innerHTML = '<p style="text-align: center; color: #666; font-size: 12px; margin: 20px 0;">Start typing to search for nodes...</p>';
    }
    if (selectedNodeInfo) selectedNodeInfo.style.display = 'none';

    // Reset pagination
    updatePaginationControls();
    updateDialogButtons();

    // Show dialog
    dialog.classList.remove('hidden');

    // Focus search input
    if (searchInput) {
        searchInput.focus();
    }
}

/**
 * Close search dialog
 */
export function closeSearchDialog() {
    const dialog = document.getElementById('node-search-dialog');
    if (dialog) {
        dialog.classList.add('hidden');
    }
}

/**
 * Handle search input
 */
function handleDialogSearch(e) {
    const searchTerm = e.target.value.trim();
    searchDialogState.searchTerm = searchTerm;
    searchDialogState.highlightedIndex = -1;

    if (searchTerm.length === 0) {
        clearDialogSearchResults();
        return;
    }

    performDialogSearch(searchTerm);
}

/**
 * Perform the actual search
 */
function performDialogSearch(searchTerm) {
    const graph = getGraph();
    if (!graph || !graph.nodes) {
        console.error('Graph not available for search');
        return;
    }

    // Get all matching results (no limit)
    const allResults = graph.nodes.filter(node => {
        const label = (node.label || '').toLowerCase();
        const chineseLabel = (node.chineseLabel || '').toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        return label.includes(searchLower) || chineseLabel.includes(searchLower);
    });

    // Store all results and reset to first page
    searchDialogState.searchResults = allResults;
    searchDialogState.totalResults = allResults.length;
    searchDialogState.currentPage = 1;
    searchDialogState.highlightedIndex = -1;

    // Update display with paginated results
    updateDialogSearchResults();
    updateDialogSearchCount(allResults.length);
    updatePaginationControls();
}

/**
 * Get paginated results for current page
 */
function getPaginatedResults() {
    const startIndex = (searchDialogState.currentPage - 1) * RESULTS_PER_PAGE;
    const endIndex = startIndex + RESULTS_PER_PAGE;
    return searchDialogState.searchResults.slice(startIndex, endIndex);
}

/**
 * Get absolute index in all results from page-relative index
 */
function getAbsoluteIndex(pageRelativeIndex) {
    return (searchDialogState.currentPage - 1) * RESULTS_PER_PAGE + pageRelativeIndex;
}

/**
 * Update search results display
 */
function updateDialogSearchResults() {
    const searchResultsList = document.getElementById('search-results-list');
    const searchDropdown = document.getElementById('dialog-search-results');

    if (!searchResultsList) return;

    const allResults = searchDialogState.searchResults;
    
    if (allResults.length === 0) {
        searchResultsList.innerHTML = '<p style="text-align: center; color: #666; font-size: 12px; margin: 20px 0;">No nodes found matching your search.</p>';
        if (searchDropdown) searchDropdown.classList.add('hidden');
        return;
    }

    // Get paginated results for current page
    const paginatedResults = getPaginatedResults();

    // Build results list
    let html = '';
    paginatedResults.forEach((node, pageIndex) => {
        const absoluteIndex = getAbsoluteIndex(pageIndex);
        const isSelected = searchDialogState.selectedNode && searchDialogState.selectedNode.id === node.id;
        const isHighlighted = searchDialogState.highlightedIndex === absoluteIndex;

        html += `
            <div class="search-result-item"
                 data-node-id="${node.id}"
                 data-absolute-index="${absoluteIndex}"
                 style="padding: 8px; margin: 2px 0; border-radius: 4px; cursor: pointer;
                        background: ${isSelected ? '#e3f2fd' : (isHighlighted ? '#f5f5f5' : 'white')};
                        border: 1px solid ${isSelected ? '#2196f3' : '#eee'};"
                 onmouseenter="highlightDialogSearchResult(${absoluteIndex})">
                <div style="font-weight: bold; font-size: 13px;">${escapeHtml(node.label || 'Unnamed Node')}</div>
                <div style="font-size: 11px; color: #666;">
                    ID: ${node.id} | Position: (${Math.round(node.x)}, ${Math.round(node.y)})
                </div>
                ${node.category ? `<div style="font-size: 10px; color: #888; margin-top: 2px;">Category: ${escapeHtml(node.category)}</div>` : ''}
                ${node.chineseLabel ? `<div style="font-size: 11px; color: #666; margin-top: 2px;">中文: ${escapeHtml(node.chineseLabel)}</div>` : ''}
            </div>
        `;
    });

    searchResultsList.innerHTML = html;

    // Add click handlers
    searchResultsList.querySelectorAll('.search-result-item').forEach((item) => {
        const absoluteIndex = parseInt(item.getAttribute('data-absolute-index'));
        item.addEventListener('click', () => selectDialogSearchResult(absoluteIndex));
    });

    // Update dropdown (limit to first 20 for dropdown)
    if (searchDropdown) {
        const dropdownResults = allResults.slice(0, 20);
        searchDropdown.innerHTML = dropdownResults.map(node => `
            <div class="search-dropdown-item" data-node-id="${node.id}" style="padding: 4px 8px; cursor: pointer;">
                ${escapeHtml(node.label || 'Unnamed Node')}
            </div>
        `).join('');
        searchDropdown.classList.remove('hidden');
    }
}

/**
 * Update search count
 */
function updateDialogSearchCount(count) {
    const countElement = document.getElementById('dialog-search-count');
    if (countElement) {
        const totalPages = Math.ceil(count / RESULTS_PER_PAGE);
        if (count === 0) {
            countElement.textContent = 'No results';
        } else if (totalPages > 1) {
            const startIndex = (searchDialogState.currentPage - 1) * RESULTS_PER_PAGE + 1;
            const endIndex = Math.min(searchDialogState.currentPage * RESULTS_PER_PAGE, count);
            countElement.textContent = `Showing ${startIndex}-${endIndex} of ${count} node${count !== 1 ? 's' : ''} (Page ${searchDialogState.currentPage}/${totalPages})`;
        } else {
            countElement.textContent = `${count} node${count !== 1 ? 's' : ''} found`;
        }
    }
}

/**
 * Handle search keydown for navigation
 */
function handleDialogSearchKeydown(e) {
    const results = searchDialogState.searchResults;
    if (results.length === 0) return;

    const paginatedResults = getPaginatedResults();
    const startIndex = (searchDialogState.currentPage - 1) * RESULTS_PER_PAGE;
    const endIndex = startIndex + paginatedResults.length - 1;

    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            if (searchDialogState.highlightedIndex < endIndex) {
                // Move down within current page
                searchDialogState.highlightedIndex = Math.min(searchDialogState.highlightedIndex + 1, endIndex);
                updateDialogSearchResults();
            } else if (searchDialogState.currentPage < Math.ceil(results.length / RESULTS_PER_PAGE)) {
                // Move to next page
                searchDialogState.currentPage++;
                searchDialogState.highlightedIndex = startIndex + RESULTS_PER_PAGE;
                updateDialogSearchResults();
                updatePaginationControls();
            }
            break;
        case 'ArrowUp':
            e.preventDefault();
            if (searchDialogState.highlightedIndex > startIndex) {
                // Move up within current page
                searchDialogState.highlightedIndex = Math.max(searchDialogState.highlightedIndex - 1, startIndex);
                updateDialogSearchResults();
            } else if (searchDialogState.currentPage > 1) {
                // Move to previous page
                searchDialogState.currentPage--;
                const newStartIndex = (searchDialogState.currentPage - 1) * RESULTS_PER_PAGE;
                searchDialogState.highlightedIndex = newStartIndex + RESULTS_PER_PAGE - 1;
                updateDialogSearchResults();
                updatePaginationControls();
            }
            break;
        case 'Enter':
            e.preventDefault();
            if (searchDialogState.highlightedIndex >= 0) {
                selectDialogSearchResult(searchDialogState.highlightedIndex);
            } else if (searchDialogState.selectedNode) {
                navigateToSelectedNode();
            }
            break;
    }
}

/**
 * Highlight a search result (exposed for inline handlers)
 */
window.highlightDialogSearchResult = function(absoluteIndex) {
    searchDialogState.highlightedIndex = absoluteIndex;
    
    // Navigate to the page containing this result if needed
    const targetPage = Math.floor(absoluteIndex / RESULTS_PER_PAGE) + 1;
    if (targetPage !== searchDialogState.currentPage) {
        searchDialogState.currentPage = targetPage;
        updatePaginationControls();
    }
    
    updateDialogSearchResults();
};

/**
 * Select a search result
 */
function selectDialogSearchResult(absoluteIndex) {
    const results = searchDialogState.searchResults;
    if (absoluteIndex < 0 || absoluteIndex >= results.length) return;

    searchDialogState.selectedNode = results[absoluteIndex];
    searchDialogState.highlightedIndex = absoluteIndex;

    // Navigate to the page containing this result if needed
    const targetPage = Math.floor(absoluteIndex / RESULTS_PER_PAGE) + 1;
    if (targetPage !== searchDialogState.currentPage) {
        searchDialogState.currentPage = targetPage;
        updatePaginationControls();
    }

    updateDialogSearchResults();
    updateSelectedNodeInfo(results[absoluteIndex]);
    updateDialogButtons();
}

/**
 * Update selected node info display
 */
function updateSelectedNodeInfo(node) {
    const selectedNodeInfo = document.getElementById('selected-node-info');
    const selectedNodeDetails = document.getElementById('selected-node-details');

    if (!selectedNodeInfo || !selectedNodeDetails) return;

    selectedNodeInfo.style.display = 'block';
    selectedNodeDetails.innerHTML = `
        <div><strong>Name:</strong> ${escapeHtml(node.label || 'Unnamed Node')}</div>
        <div><strong>ID:</strong> ${node.id}</div>
        <div><strong>Position:</strong> (${Math.round(node.x)}, ${Math.round(node.y)})</div>
        ${node.category ? `<div><strong>Category:</strong> ${escapeHtml(node.category)}</div>` : ''}
        ${node.chineseLabel ? `<div><strong>Chinese Label:</strong> ${escapeHtml(node.chineseLabel)}</div>` : ''}
        ${node.color ? `<div><strong>Color:</strong> <span style="display: inline-block; width: 12px; height: 12px; background: ${node.color}; border-radius: 2px; vertical-align: middle; margin-right: 4px;"></span>${node.color}</div>` : ''}
        ${node.radius ? `<div><strong>Size:</strong> ${node.radius}px</div>` : ''}
    `;
}

/**
 * Clear search
 */
function clearDialogSearch() {
    const searchInput = document.getElementById('dialog-node-search');
    if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
    }

    searchDialogState.searchTerm = '';
    searchDialogState.searchResults = [];
    searchDialogState.selectedNode = null;
    searchDialogState.highlightedIndex = -1;
    searchDialogState.currentPage = 1;
    searchDialogState.totalResults = 0;

    clearDialogSearchResults();
    updatePaginationControls();
    updateDialogButtons();
}

/**
 * Clear search results
 */
function clearDialogSearchResults() {
    const searchResultsList = document.getElementById('search-results-list');
    const searchDropdown = document.getElementById('dialog-search-results');
    const selectedNodeInfo = document.getElementById('selected-node-info');

    if (searchResultsList) {
        searchResultsList.innerHTML = '<p style="text-align: center; color: #666; font-size: 12px; margin: 20px 0;">Start typing to search for nodes...</p>';
    }
    if (searchDropdown) {
        searchDropdown.classList.add('hidden');
    }
    if (selectedNodeInfo) {
        selectedNodeInfo.style.display = 'none';
    }

    updateDialogSearchCount(0);
    updatePaginationControls();
}

/**
 * Update pagination controls
 */
function updatePaginationControls() {
    const paginationContainer = document.getElementById('dialog-pagination');
    if (!paginationContainer) return;

    const totalResults = searchDialogState.totalResults;
    const totalPages = Math.ceil(totalResults / RESULTS_PER_PAGE);
    const currentPage = searchDialogState.currentPage;

    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }

    paginationContainer.style.display = 'flex';

    const pageInfo = document.getElementById('dialog-pagination-info');
    const pageInput = document.getElementById('dialog-pagination-input');

    if (pageInfo) {
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    }
    
    if (pageInput) {
        pageInput.value = currentPage;
        pageInput.max = totalPages;
        pageInput.setAttribute('max', totalPages);
    }
}

/**
 * Handle pagination input - navigate to specified page
 */
function handlePaginationInput() {
    const pageInput = document.getElementById('dialog-pagination-input');
    if (!pageInput) return;

    const inputValue = parseInt(pageInput.value);
    const totalPages = Math.ceil(searchDialogState.totalResults / RESULTS_PER_PAGE);

    // Validate input
    if (isNaN(inputValue) || inputValue < 1) {
        pageInput.value = searchDialogState.currentPage;
        return;
    }

    if (inputValue > totalPages) {
        pageInput.value = totalPages;
        searchDialogState.currentPage = totalPages;
    } else {
        searchDialogState.currentPage = inputValue;
    }

    searchDialogState.highlightedIndex = -1;
    updateDialogSearchResults();
    updatePaginationControls();
    updateDialogSearchCount(searchDialogState.totalResults);

    // Scroll results to top
    const searchResultsList = document.getElementById('search-results-list');
    if (searchResultsList) {
        searchResultsList.scrollTop = 0;
    }

    // Focus back on search input for better UX
    const searchInput = document.getElementById('dialog-node-search');
    if (searchInput) {
        searchInput.focus();
    }
}

/**
 * Select the current node
 */
function selectDialogNode() {
    if (!searchDialogState.selectedNode) return;

    const graph = getGraph();
    if (!graph) return;

    // Select the node in the graph
    graph.selectedNode = searchDialogState.selectedNode;
    graph.selectedEdge = null;
    
    if (graph.render) {
        graph.render();
    }

    closeSearchDialog();
    
    if (window.showNotification) {
        window.showNotification(`Selected node: ${searchDialogState.selectedNode.label || 'Unnamed Node'}`);
    }
}

/**
 * Navigate to selected node
 */
function navigateToSelectedNode() {
    if (!searchDialogState.selectedNode) return;

    const graph = getGraph();
    if (!graph) return;

    const node = searchDialogState.selectedNode;

    // Center the view on the node
    const canvas = graph.canvas;
    if (canvas) {
        graph.offset.x = -node.x * graph.scale + canvas.width / 2;
        graph.offset.y = -node.y * graph.scale + canvas.height / 2;
    }

    // Select the node
    graph.selectedNode = node;
    graph.selectedEdge = null;

    if (graph.render) {
        graph.render();
    }

    closeSearchDialog();
    
    if (window.showNotification) {
        window.showNotification(`Navigated to node: ${node.label || 'Unnamed Node'}`);
    }
}

/**
 * Update dialog button states
 */
function updateDialogButtons() {
    const hasSelection = searchDialogState.selectedNode !== null;

    const selectBtn = document.getElementById('dialog-select-node-btn');
    const navigateBtn = document.getElementById('dialog-search-navigate');

    if (selectBtn) {
        selectBtn.disabled = !hasSelection;
    }
    if (navigateBtn) {
        navigateBtn.disabled = !hasSelection;
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

