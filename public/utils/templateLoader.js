/**
 * Template Loader Utility
 * Loads HTML templates from separate files and injects them into the DOM
 */

/**
 * Load a template file and inject it into a target element
 * @param {string} templatePath - Path to the template file
 * @param {string} targetSelector - CSS selector for the target element
 * @param {string} mode - 'replace' to replace innerHTML, 'append' to append (default: 'replace')
 * @returns {Promise<void>}
 */
export async function loadTemplate(templatePath, targetSelector, mode = 'replace') {
    try {
        const response = await fetch(templatePath);
        if (!response.ok) {
            throw new Error(`Failed to load template: ${templatePath} (${response.status})`);
        }
        const html = await response.text();
        const target = document.querySelector(targetSelector);
        if (!target) {
            throw new Error(`Target element not found: ${targetSelector}`);
        }
        
        if (mode === 'append') {
            target.insertAdjacentHTML('beforeend', html);
        } else {
            target.innerHTML = html;
        }
    } catch (error) {
        console.error(`Error loading template ${templatePath}:`, error);
        throw error;
    }
}

/**
 * Load multiple templates in parallel
 * @param {Array<{path: string, target: string, mode?: string}>} templates - Array of template configs
 * @returns {Promise<void>}
 */
export async function loadTemplates(templates) {
    const promises = templates.map(({ path, target, mode = 'replace' }) => 
        loadTemplate(path, target, mode)
    );
    await Promise.all(promises);
}

/**
 * Initialize all templates on page load
 */
export async function initializeTemplates() {
    const templates = [
        { path: 'templates/toolbar.html', target: '.toolbar', mode: 'replace' },
        { path: 'templates/sidebar.html', target: '.main-content', mode: 'append' },
        { path: 'templates/dialogs/weight-dialog.html', target: '.canvas-container', mode: 'append' },
        { path: 'templates/dialogs/node-dialog.html', target: '.canvas-container', mode: 'append' },
        { path: 'templates/dialogs/load-dialog.html', target: '.canvas-container', mode: 'append' },
        { path: 'templates/dialogs/save-as-dialog.html', target: '.canvas-container', mode: 'append' },
        { path: 'templates/dialogs/node-search-dialog.html', target: '.canvas-container', mode: 'append' },
        { path: 'templates/dialogs/node-connections-dialog.html', target: '.canvas-container', mode: 'append' },
        { path: 'templates/dialogs/edge-search-dialog.html', target: '.canvas-container', mode: 'append' },
        { path: 'templates/dialogs/merge-dialog.html', target: '.canvas-container', mode: 'append' },
        { path: 'templates/dialogs/export-dialog.html', target: '.canvas-container', mode: 'append' },
        { path: 'templates/dialogs/layer-management-dialog.html', target: 'body', mode: 'append' },
        { path: 'templates/dialogs/layer-rename-dialog.html', target: 'body', mode: 'append' },
        { path: 'templates/dialogs/settings-dialog.html', target: 'body', mode: 'append' },
        { path: 'templates/dialogs/clustering-dialog.html', target: 'body', mode: 'append' },
    ];

    try {
        await loadTemplates(templates);
        console.log('All templates loaded successfully');
    } catch (error) {
        console.error('Error loading templates:', error);
        // Fallback: templates might already be in HTML if fetch fails
    }
}

