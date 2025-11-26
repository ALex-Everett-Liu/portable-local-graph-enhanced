import { fetchDatabases, mergeDatabase } from '../../services/databaseService.js';
import { unsavedChanges } from '../../state/appState.js';

let selectedDatabasePath = null;
let allDatabases = [];

export async function showMergeDialog() {
    // Check for unsaved changes
    const hasUnsavedChanges = unsavedChanges.nodes.size > 0 || unsavedChanges.edges.size > 0;
    
    if (hasUnsavedChanges) {
        const proceed = confirm(
            `You have ${unsavedChanges.nodes.size + unsavedChanges.edges.size} unsaved change(s). ` +
            `Merging a database will save these changes first. Continue?`
        );
        if (!proceed) {
            return;
        }
    }

    const dialog = document.getElementById('merge-dialog');
    const databaseList = document.getElementById('merge-database-list');
    
    if (!dialog || !databaseList) return;
    
    // Show dialog
    dialog.classList.remove('hidden');
    
    // Load database list
    databaseList.innerHTML = '<p style="text-align: center; color: #999; font-size: 12px;">Loading databases...</p>';
    selectedDatabasePath = null;
    
    try {
        allDatabases = await fetchDatabases();
        
        if (allDatabases.length === 0) {
            databaseList.innerHTML = '<p style="text-align: center; color: #999; font-size: 12px;">No database files found.</p>';
            return;
        }
        
        // Render database list
        renderDatabaseList();
    } catch (error) {
        console.error('Error loading databases:', error);
        databaseList.innerHTML = `<p style="text-align: center; color: #f44336; font-size: 12px;">Error: ${error.message}</p>`;
    }
}

function renderDatabaseList() {
    const databaseList = document.getElementById('merge-database-list');
    if (!databaseList) return;
    
    databaseList.innerHTML = '';
    
    allDatabases.forEach(db => {
        const item = document.createElement('div');
        item.className = 'merge-database-item';
        item.style.cssText = 'padding: 8px; margin: 4px 0; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; background: #f9f9f9; transition: all 0.2s;';
        item.innerHTML = `<strong>${db.name}</strong><br><small style="color: #666;">${db.path}</small>`;
        
        // Check if this item is selected
        if (selectedDatabasePath === db.path) {
            item.style.background = '#e3f2fd';
            item.style.borderColor = '#2196f3';
        }
        
        item.addEventListener('click', () => {
            // Remove previous selection
            document.querySelectorAll('.merge-database-item').forEach(el => {
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
}

export async function handleMergeOK() {
    if (!selectedDatabasePath) {
        alert('Please select a source database file to merge.');
        return;
    }
    
    // Get conflict resolution strategy
    const resolutionRadio = document.querySelector('input[name="merge-conflict-resolution"]:checked');
    const conflictResolution = resolutionRadio ? resolutionRadio.value : 'skip';
    
    // Hide dialog first
    hideMergeDialog();
    
    // Show loading indicator
    const loadingMsg = document.createElement('div');
    loadingMsg.id = 'merge-loading-msg';
    loadingMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 10000;';
    loadingMsg.innerHTML = '<p style="margin: 0; font-size: 14px;">Merging database... Please wait.</p>';
    document.body.appendChild(loadingMsg);
    
    try {
        const result = await mergeDatabase(selectedDatabasePath, conflictResolution);
        
        // Remove loading indicator
        document.body.removeChild(loadingMsg);
        
        // Show success message with statistics
        const stats = [
            `Nodes: ${result.nodesAdded} added, ${result.nodesSkipped} skipped, ${result.nodesRenamed} renamed`,
            `Edges: ${result.edgesAdded} added, ${result.edgesSkipped} skipped, ${result.edgesRenamed} renamed`
        ].join('\n');
        
        alert(`Merge completed successfully!\n\n${stats}`);
    } catch (error) {
        // Remove loading indicator
        if (document.getElementById('merge-loading-msg')) {
            document.body.removeChild(document.getElementById('merge-loading-msg'));
        }
        
        console.error('Error merging database:', error);
        alert(`Failed to merge database: ${error.message}`);
    }
}

export function handleMergeCancel() {
    hideMergeDialog();
}

export function hideMergeDialog() {
    const dialog = document.getElementById('merge-dialog');
    if (dialog) {
        dialog.classList.add('hidden');
    }
    selectedDatabasePath = null;
    allDatabases = [];
}

