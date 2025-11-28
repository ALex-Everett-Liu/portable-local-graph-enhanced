/**
 * Fullscreen Manager
 * Handles fullscreen mode for canvas container
 */

let isFullscreen = false;

/**
 * Toggle fullscreen mode
 */
export function toggleFullscreen() {
    const canvasContainer = document.querySelector('.canvas-container');
    const body = document.body;
    
    if (!canvasContainer) return;
    
    isFullscreen = !isFullscreen;
    
    if (isFullscreen) {
        enterFullscreen(canvasContainer, body);
    } else {
        exitFullscreen(canvasContainer, body);
    }
}

/**
 * Enter fullscreen mode
 */
function enterFullscreen(canvasContainer, body) {
    canvasContainer.classList.add('fullscreen');
    body.classList.add('fullscreen-mode');
    
    // Resize canvas to fill fullscreen
    const graph = window.graph;
    if (graph) {
        setTimeout(() => {
            graph.resizeCanvas();
        }, 100);
    }
    
    // Update button icon
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (fullscreenBtn) {
        const icon = fullscreenBtn.querySelector('[data-lucide]');
        if (icon) {
            icon.setAttribute('data-lucide', 'minimize-2');
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons();
            }
        }
    }
}

/**
 * Exit fullscreen mode
 */
function exitFullscreen(canvasContainer, body) {
    canvasContainer.classList.remove('fullscreen');
    body.classList.remove('fullscreen-mode');
    
    // Resize canvas back to normal
    const graph = window.graph;
    if (graph) {
        setTimeout(() => {
            graph.resizeCanvas();
        }, 100);
    }
    
    // Update button icon
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (fullscreenBtn) {
        const icon = fullscreenBtn.querySelector('[data-lucide]');
        if (icon) {
            icon.setAttribute('data-lucide', 'maximize-2');
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons();
            }
        }
    }
    
    // Hide popup when exiting fullscreen
    hideSelectionInfoPopup();
}

/**
 * Check if currently in fullscreen mode
 */
export function isInFullscreen() {
    return isFullscreen;
}

/**
 * Initialize fullscreen functionality
 */
export function initializeFullscreen() {
    // Fullscreen button in sidebar
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
    }
    
    // Exit fullscreen button
    const exitBtn = document.getElementById('fullscreen-exit-btn');
    if (exitBtn) {
        exitBtn.addEventListener('click', toggleFullscreen);
    }
    
    // Close popup button
    const popupCloseBtn = document.getElementById('selection-info-popup-close');
    if (popupCloseBtn) {
        popupCloseBtn.addEventListener('click', hideSelectionInfoPopup);
    }
    
    // Hide popup when clicking outside of it (but not on canvas)
    // Canvas click handlers manage popup visibility for canvas clicks
    document.addEventListener('click', (e) => {
        if (isFullscreen) {
            const popup = document.getElementById('selection-info-popup');
            if (popup && popup.classList.contains('visible')) {
                // Check if click is outside popup
                if (!popup.contains(e.target) && e.target.id !== 'fullscreen-exit-btn') {
                    // Don't hide if clicking on canvas or canvas container - canvas handlers will manage popup visibility
                    const canvas = document.getElementById('graph-canvas');
                    const canvasContainer = document.querySelector('.canvas-container');
                    const isCanvasClick = (canvas && (canvas === e.target || canvas.contains(e.target))) ||
                                         (canvasContainer && (canvasContainer === e.target || canvasContainer.contains(e.target)));
                    
                    if (!isCanvasClick) {
                        hideSelectionInfoPopup();
                    }
                }
            }
        }
    });
    
    // ESC key to exit fullscreen
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isFullscreen) {
            // If popup is visible, close it first
            const popup = document.getElementById('selection-info-popup');
            if (popup && popup.classList.contains('visible')) {
                hideSelectionInfoPopup();
            } else {
                toggleFullscreen();
            }
        }
    });
}

/**
 * Show selection info popup
 */
export function showSelectionInfoPopup(node, x, y) {
    if (!isFullscreen) return;
    
    const popup = document.getElementById('selection-info-popup');
    const popupContent = document.getElementById('selection-info-popup-content');
    
    if (!popup || !popupContent) return;
    
    // Get selection info HTML (reuse the same function logic)
    const graph = window.graph;
    if (!graph) return;
    
    if (node) {
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
        
        const escapeHtml = (text) => {
            if (!text) return "";
            const div = document.createElement("div");
            div.textContent = text;
            return div.innerHTML;
        };
        
        const createdAt = formatTimestamp(node.created_at || node.createdAt);
        const modifiedAt = formatTimestamp(node.updated_at || node.updatedAt || node.modifiedAt);
        
        // Get font size from settings
        const fontSize = (window.GRAPH_CONSTANTS && window.GRAPH_CONSTANTS.SELECTION_INFO_FONT_SIZE) || 13;
        
        popupContent.innerHTML = `
            <div style="font-size: ${fontSize}px; line-height: 1.6;"><strong>English:</strong> ${escapeHtml(node.label || 'Unnamed Node')}</div>
            ${node.chineseLabel ? `<div style="font-size: ${fontSize}px; line-height: 1.6;"><strong>中文:</strong> ${escapeHtml(node.chineseLabel)}</div>` : ''}
            <div style="font-size: ${fontSize}px; line-height: 1.6;"><strong>Position:</strong> (${Math.round(node.x)}, ${Math.round(node.y)})</div>
            <div style="font-size: ${fontSize}px; line-height: 1.6;"><strong>Color:</strong> <span style="display: inline-block; width: 14px; height: 14px; background: ${node.color || '#3b82f6'}; border: 1px solid #ccc; border-radius: 2px; vertical-align: middle; margin-right: 4px;"></span>${node.color || '#3b82f6'}</div>
            <div style="font-size: ${fontSize}px; line-height: 1.6;"><strong>Size:</strong> ${node.radius || 20}px</div>
            ${node.category ? `<div style="font-size: ${fontSize}px; line-height: 1.6;"><strong>Category:</strong> ${escapeHtml(node.category)}</div>` : ''}
            <div style="font-size: ${fontSize}px; line-height: 1.6;"><strong>Layers:</strong> ${escapeHtml(layers)}</div>
            <div style="font-size: ${fontSize}px; line-height: 1.6;"><strong>Created:</strong> ${createdAt}</div>
            <div style="font-size: ${fontSize}px; line-height: 1.6;"><strong>Modified:</strong> ${modifiedAt}</div>
        `;
        
        // Also update popup container font size
        popup.style.fontSize = fontSize + 'px';
    } else {
        popupContent.innerHTML = '<p>Nothing selected</p>';
    }
    
    // Position popup near click position, but keep it within viewport
    const popupWidth = 300;
    const popupHeight = 200;
    const padding = 20;
    
    let popupX = x + 20;
    let popupY = y + 20;
    
    // Adjust if popup would go off screen
    if (popupX + popupWidth > window.innerWidth) {
        popupX = x - popupWidth - 20;
    }
    if (popupY + popupHeight > window.innerHeight) {
        popupY = y - popupHeight - 20;
    }
    
    // Ensure popup stays within viewport
    popupX = Math.max(padding, Math.min(popupX, window.innerWidth - popupWidth - padding));
    popupY = Math.max(padding, Math.min(popupY, window.innerHeight - popupHeight - padding));
    
    popup.style.left = popupX + 'px';
    popup.style.top = popupY + 'px';
    popup.classList.add('visible');
}

/**
 * Hide selection info popup
 */
export function hideSelectionInfoPopup() {
    const popup = document.getElementById('selection-info-popup');
    if (popup) {
        popup.classList.remove('visible');
    }
}

