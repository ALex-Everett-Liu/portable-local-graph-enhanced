import { saveAsDatabase, loadGraphFromDb } from '../../services/databaseService.js';
import { loadDatabase } from '../../services/databaseService.js';

export function showSaveAsDialog() {
    const dialog = document.getElementById('save-as-dialog');
    const filenameInput = document.getElementById('save-as-filename');
    
    if (!dialog || !filenameInput) return;
    
    // Clear previous input
    filenameInput.value = '';
    
    // Show dialog
    dialog.classList.remove('hidden');
    
    // Focus input
    setTimeout(() => filenameInput.focus(), 100);
}

export function handleSaveAsOK() {
    const filenameInput = document.getElementById('save-as-filename');
    if (!filenameInput) return;
    
    const filename = filenameInput.value.trim();
    
    if (!filename) {
        alert('Please enter a filename.');
        return;
    }
    
    // Ensure .db extension
    const finalFilename = filename.endsWith('.db') ? filename : `${filename}.db`;
    
    saveAsDatabase(finalFilename);
    hideSaveAsDialog();
}

export function handleSaveAsCancel() {
    hideSaveAsDialog();
}

export function hideSaveAsDialog() {
    const dialog = document.getElementById('save-as-dialog');
    if (dialog) {
        dialog.classList.add('hidden');
    }
}

