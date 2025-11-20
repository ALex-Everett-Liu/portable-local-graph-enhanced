import { unsavedChanges } from '../../state/appState.js';
import { fetchDatabases, loadDatabase } from '../../services/databaseService.js';
import { updateSaveButtonVisibility } from '../saveDiscardUI.js';

let selectedDatabasePath = null;
let allDatabases = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 10;

export async function showLoadDialog() {
    // Check for unsaved changes
    const hasUnsavedChanges = unsavedChanges.nodes.size > 0 || unsavedChanges.edges.size > 0;
    
    if (hasUnsavedChanges) {
        const proceed = confirm(
            `You have ${unsavedChanges.nodes.size + unsavedChanges.edges.size} unsaved change(s). ` +
            `Loading a new database will discard these changes. Continue?`
        );
        if (!proceed) {
            return;
        }
    }

    const dialog = document.getElementById('load-dialog');
    const databaseList = document.getElementById('database-list');
    const pagination = document.getElementById('database-pagination');
    
    if (!dialog || !databaseList || !pagination) return;
    
    // Show dialog
    dialog.classList.remove('hidden');
    
    // Load database list
    databaseList.innerHTML = '<p style="text-align: center; color: #999;">Loading databases...</p>';
    pagination.style.display = 'none';
    selectedDatabasePath = null;
    currentPage = 1;
    
    try {
        allDatabases = await fetchDatabases();
        
        if (allDatabases.length === 0) {
            databaseList.innerHTML = '<p style="text-align: center; color: #999;">No database files found.</p>';
            pagination.style.display = 'none';
            return;
        }
        
        // Render first page
        renderDatabasePage();
    } catch (error) {
        console.error('Error loading databases:', error);
        databaseList.innerHTML = `<p style="text-align: center; color: #f44336;">Error: ${error.message}</p>`;
        pagination.style.display = 'none';
    }
}

function renderDatabasePage() {
    const databaseList = document.getElementById('database-list');
    const pagination = document.getElementById('database-pagination');
    const paginationInfo = document.getElementById('pagination-info');
    const paginationInput = document.getElementById('pagination-input');
    const paginationTotal = document.getElementById('pagination-total');
    const paginationGo = document.getElementById('pagination-go');
    const prevBtn = document.getElementById('pagination-prev');
    const nextBtn = document.getElementById('pagination-next');
    
    if (!databaseList || !pagination || !paginationInfo || !prevBtn || !nextBtn || !paginationInput || !paginationTotal || !paginationGo) return;
    
    const totalPages = Math.ceil(allDatabases.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, allDatabases.length);
    const pageDatabases = allDatabases.slice(startIndex, endIndex);
    
    // Render database list for current page
    databaseList.innerHTML = '';
    pageDatabases.forEach(db => {
        const item = document.createElement('div');
        item.className = 'database-item';
        item.style.cssText = 'padding: 8px; margin: 4px 0; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; background: #f9f9f9;';
        item.innerHTML = `<strong>${db.name}</strong><br><small style="color: #666;">${db.path}</small>`;
        
        // Check if this item is selected
        if (selectedDatabasePath === db.path) {
            item.style.background = '#e3f2fd';
            item.style.borderColor = '#2196f3';
        }
        
        item.addEventListener('click', () => {
            // Remove previous selection
            document.querySelectorAll('.database-item').forEach(el => {
                el.style.background = '#f9f9f9';
                el.style.borderColor = '#ddd';
            });
            
            // Highlight selected
            item.style.background = '#e3f2fd';
            item.style.borderColor = '#2196f3';
            selectedDatabasePath = db.path;
        });
        
        item.addEventListener('mouseenter', () => {
            if (selectedDatabasePath !== db.path) {
                item.style.background = '#f0f0f0';
            }
        });
        
        item.addEventListener('mouseleave', () => {
            if (selectedDatabasePath !== db.path) {
                item.style.background = '#f9f9f9';
            }
        });
        
        databaseList.appendChild(item);
    });
    
    // Update pagination controls
    if (totalPages > 1) {
        pagination.style.display = 'block';
        paginationInfo.textContent = `Page ${currentPage} of ${totalPages} (${allDatabases.length} total)`;
        
        // Update page input
        paginationInput.value = currentPage;
        paginationInput.max = totalPages;
        paginationTotal.textContent = `of ${totalPages}`;
        
        // Update prev button
        prevBtn.disabled = currentPage === 1;
        if (currentPage === 1) {
            prevBtn.style.opacity = '0.5';
            prevBtn.style.cursor = 'not-allowed';
            prevBtn.style.background = '#f0f0f0';
        } else {
            prevBtn.style.opacity = '1';
            prevBtn.style.cursor = 'pointer';
            prevBtn.style.background = '#f9f9f9';
            prevBtn.onmouseenter = () => { prevBtn.style.background = '#e9e9e9'; };
            prevBtn.onmouseleave = () => { prevBtn.style.background = '#f9f9f9'; };
        }
        
        // Update next button
        nextBtn.disabled = currentPage === totalPages;
        if (currentPage === totalPages) {
            nextBtn.style.opacity = '0.5';
            nextBtn.style.cursor = 'not-allowed';
            nextBtn.style.background = '#f0f0f0';
        } else {
            nextBtn.style.opacity = '1';
            nextBtn.style.cursor = 'pointer';
            nextBtn.style.background = '#f9f9f9';
            nextBtn.onmouseenter = () => { nextBtn.style.background = '#e9e9e9'; };
            nextBtn.onmouseleave = () => { nextBtn.style.background = '#f9f9f9'; };
        }
    } else {
        pagination.style.display = 'none';
    }
}

export function setupPaginationListeners() {
    const prevBtn = document.getElementById('pagination-prev');
    const nextBtn = document.getElementById('pagination-next');
    const paginationInput = document.getElementById('pagination-input');
    const paginationGo = document.getElementById('pagination-go');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderDatabasePage();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(allDatabases.length / ITEMS_PER_PAGE);
            if (currentPage < totalPages) {
                currentPage++;
                renderDatabasePage();
            }
        });
    }
    
    // Handle page input - go to page on Enter key or Go button
    if (paginationInput) {
        paginationInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                goToPage();
            }
        });
        
        paginationInput.addEventListener('blur', () => {
            // Reset to current page if invalid input on blur
            paginationInput.value = currentPage;
        });
    }
    
    if (paginationGo) {
        paginationGo.addEventListener('click', goToPage);
        
        // Add hover effect
        paginationGo.onmouseenter = () => { paginationGo.style.background = '#e9e9e9'; };
        paginationGo.onmouseleave = () => { paginationGo.style.background = '#f9f9f9'; };
    }
}

function goToPage() {
    const paginationInput = document.getElementById('pagination-input');
    if (!paginationInput) return;
    
    const totalPages = Math.ceil(allDatabases.length / ITEMS_PER_PAGE);
    const requestedPage = parseInt(paginationInput.value, 10);
    
    if (isNaN(requestedPage) || requestedPage < 1 || requestedPage > totalPages) {
        // Invalid page number - reset to current page
        paginationInput.value = currentPage;
        alert(`Please enter a page number between 1 and ${totalPages}`);
        return;
    }
    
    if (requestedPage !== currentPage) {
        currentPage = requestedPage;
        renderDatabasePage();
    }
}

export async function handleLoadOK() {
    if (!selectedDatabasePath) {
        alert('Please select a database file to load.');
        return;
    }
    
    await loadDatabase(selectedDatabasePath);
    updateSaveButtonVisibility();
    hideLoadDialog();
}

export function handleLoadCancel() {
    hideLoadDialog();
}

export function hideLoadDialog() {
    const dialog = document.getElementById('load-dialog');
    if (dialog) {
        dialog.classList.add('hidden');
    }
    selectedDatabasePath = null;
    allDatabases = [];
    currentPage = 1;
}

