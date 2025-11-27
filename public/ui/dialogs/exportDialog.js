/**
 * Export Dialog
 * Handles exporting all database tables as JSON or CSV
 */

import { exportAllTables } from '../../services/databaseService.js';

/**
 * Show export dialog
 */
export function showExportDialog() {
    const dialog = document.getElementById('export-dialog');
    if (!dialog) return;
    
    // Reset format selection to JSON
    const jsonRadio = document.getElementById('export-format-json');
    if (jsonRadio) {
        jsonRadio.checked = true;
    }
    
    // Show dialog
    dialog.classList.remove('hidden');
}

/**
 * Close export dialog
 */
export function closeExportDialog() {
    const dialog = document.getElementById('export-dialog');
    if (!dialog) return;
    
    dialog.classList.add('hidden');
}

/**
 * Download file helper
 * @param {string|Blob} content - File content (string) or Blob object
 * @param {string} filename - Filename for download
 * @param {string} mimeType - MIME type
 */
function downloadFile(content, filename, mimeType) {
    // If content is already a Blob, use it directly; otherwise create a Blob
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Download CSV files as a ZIP archive
 */
async function downloadCSVFilesAsZip(csvData) {
    // Check if JSZip is available
    if (typeof JSZip === 'undefined') {
        console.error('JSZip library not loaded. Falling back to individual file downloads.');
        // Fallback to individual downloads if JSZip is not available
        downloadCSVFilesIndividually(csvData);
        return;
    }
    
    try {
        const zip = new JSZip();
        const tables = ['graph_nodes', 'graph_edges', 'graph_metadata', 'filter_state'];
        const timestamp = Date.now();
        
        // Add each CSV file to the ZIP
        for (const tableName of tables) {
            if (csvData[tableName] && csvData[tableName] !== '') {
                zip.file(`${tableName}.csv`, csvData[tableName]);
            }
        }
        
        // Add manifest file
        const manifest = {
            exportedAt: csvData.exportedAt || new Date().toISOString(),
            tables: tables.filter(t => csvData[t] && csvData[t] !== ''),
            format: 'csv'
        };
        zip.file('export-manifest.json', JSON.stringify(manifest, null, 2));
        
        // Generate ZIP file and download
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadFile(
            zipBlob,
            `graph-export-${timestamp}.zip`,
            'application/zip'
        );
    } catch (error) {
        console.error('Error creating ZIP file:', error);
        if (window.showNotification) {
            window.showNotification('Failed to create ZIP file. Downloading individual files instead.', 'error');
        }
        // Fallback to individual downloads
        downloadCSVFilesIndividually(csvData);
    }
}

/**
 * Fallback: Download CSV files individually (if ZIP fails)
 */
function downloadCSVFilesIndividually(csvData) {
    const tables = ['graph_nodes', 'graph_edges', 'graph_metadata', 'filter_state'];
    let delay = 0;
    
    for (const tableName of tables) {
        if (csvData[tableName] && csvData[tableName] !== '') {
            setTimeout(() => {
                downloadFile(
                    csvData[tableName],
                    `${tableName}-${Date.now()}.csv`,
                    'text/csv'
                );
            }, delay);
            delay += 300; // 300ms delay between downloads
        }
    }
    
    // Also download a manifest file with export info
    setTimeout(() => {
        const manifest = {
            exportedAt: csvData.exportedAt || new Date().toISOString(),
            tables: tables.filter(t => csvData[t] && csvData[t] !== ''),
            format: 'csv'
        };
        downloadFile(
            JSON.stringify(manifest, null, 2),
            `export-manifest-${Date.now()}.json`,
            'application/json'
        );
    }, delay);
}

/**
 * Handle export button click
 */
async function handleExport() {
    const jsonRadio = document.getElementById('export-format-json');
    const format = jsonRadio && jsonRadio.checked ? 'json' : 'csv';
    
    const exportBtn = document.getElementById('export-export-btn');
    if (exportBtn) {
        const originalText = exportBtn.innerHTML;
        exportBtn.disabled = true;
        exportBtn.innerHTML = '<span>Exporting...</span>';
        
        try {
            const data = await exportAllTables(format);
            
            if (format === 'json') {
                // Download single JSON file
                downloadFile(
                    JSON.stringify(data, null, 2),
                    `graph-export-${Date.now()}.json`,
                    'application/json'
                );
                
                if (window.showNotification) {
                    window.showNotification('Database exported successfully as JSON', 'success');
                }
            } else {
                // Download CSV files as ZIP
                await downloadCSVFilesAsZip(data);
                
                if (window.showNotification) {
                    window.showNotification('Database exported successfully as ZIP file', 'success');
                }
            }
            
            closeExportDialog();
        } catch (error) {
            console.error('Error exporting:', error);
            if (window.showNotification) {
                window.showNotification(`Export failed: ${error.message}`, 'error');
            }
        } finally {
            exportBtn.disabled = false;
            exportBtn.innerHTML = originalText;
            // Re-initialize icons
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons();
            }
        }
    }
}

/**
 * Initialize export dialog
 */
export function initializeExportDialog() {
    // Export button
    const exportBtn = document.getElementById('export-export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', handleExport);
    }
    
    // Cancel button
    const cancelBtn = document.getElementById('export-cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeExportDialog);
    }
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        const dialog = document.getElementById('export-dialog');
        if (e.key === 'Escape' && dialog && !dialog.classList.contains('hidden')) {
            closeExportDialog();
        }
    });
    
    // Format selection styling
    const formatRadios = document.querySelectorAll('input[name="export-format"]');
    formatRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            // Update label styling based on selection
            const jsonLabel = document.getElementById('export-format-json-label');
            const csvLabel = document.getElementById('export-format-csv-label');
            
            if (radio.value === 'json') {
                if (jsonLabel) jsonLabel.style.borderColor = '#007bff';
                if (csvLabel) csvLabel.style.borderColor = '#ddd';
            } else {
                if (jsonLabel) jsonLabel.style.borderColor = '#ddd';
                if (csvLabel) csvLabel.style.borderColor = '#007bff';
            }
        });
    });
    
    // Initialize initial styling
    const jsonLabel = document.getElementById('export-format-json-label');
    if (jsonLabel) jsonLabel.style.borderColor = '#007bff';
}

