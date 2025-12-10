/**
 * Sidebar Resizer Module
 * 
 * Handles the resizable functionality for the sidebar element.
 * Allows users to drag the resize handle to adjust sidebar width,
 * with persistence to localStorage.
 */

import { getGraph } from '../state/appState.js';

/**
 * Throttle function to limit how often resize is called
 */
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Trigger canvas resize to fix distortion when sidebar changes
 * Exported for use in other modules (e.g., when toolbar height changes)
 */
export const triggerCanvasResize = throttle(() => {
    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
        const graph = getGraph();
        if (graph && typeof graph.resizeCanvas === 'function') {
            graph.resizeCanvas();
        }
    });
}, 16); // ~60fps throttle

/**
 * Initialize the resizable sidebar functionality
 * @param {string} sidebarId - ID of the sidebar element (default: 'local-graph-sidebar')
 * @param {string} resizeHandleId - ID of the resize handle element (default: 'local-graph-resize-handle')
 */
export function initSidebarResizer(sidebarId = 'local-graph-sidebar', resizeHandleId = 'local-graph-resize-handle') {
    const sidebar = document.getElementById(sidebarId);
    const resizeHandle = document.getElementById(resizeHandleId);
    
    if (!sidebar || !resizeHandle) {
        console.warn('Sidebar or resize handle not found. Resize functionality disabled.');
        return;
    }
    
    let isResizing = false;
    let startX = 0;
    let startWidth = 0;
    
    // Load saved width from localStorage
    const savedWidth = localStorage.getItem('sidebarWidth');
    if (savedWidth) {
        const width = parseInt(savedWidth, 10);
        const minWidth = parseInt(getComputedStyle(sidebar).minWidth, 10) || 200;
        const maxWidth = window.innerWidth * 0.6;
        
        // Ensure saved width is within valid bounds
        if (width >= minWidth && width <= maxWidth) {
            sidebar.style.width = width + 'px';
            // Trigger canvas resize after loading saved width
            // Use setTimeout to ensure graph is initialized
            setTimeout(() => triggerCanvasResize(), 100);
        }
    }
    
    // Mouse down on resize handle
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isResizing = true;
        startX = e.clientX;
        startWidth = sidebar.offsetWidth;
        document.body.classList.add('local-graph-resizing');
    });
    
    // Mouse move to resize
    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        
        const deltaX = startX - e.clientX; // Inverted because sidebar is on the right
        const newWidth = startWidth + deltaX;
        const minWidth = parseInt(getComputedStyle(sidebar).minWidth, 10) || 200;
        const maxWidth = window.innerWidth * 0.6;
        
        // Constrain width between min and max
        const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
        sidebar.style.width = constrainedWidth + 'px';
        
        // Trigger canvas resize to prevent distortion
        triggerCanvasResize();
    });
    
    // Mouse up to stop resizing
    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.classList.remove('local-graph-resizing');
            
            // Save width to localStorage
            localStorage.setItem('sidebarWidth', sidebar.offsetWidth.toString());
            
            // Final canvas resize to ensure correct dimensions
            triggerCanvasResize();
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        const currentWidth = sidebar.offsetWidth;
        const maxWidth = window.innerWidth * 0.6;
        
        if (currentWidth > maxWidth) {
            sidebar.style.width = maxWidth + 'px';
            localStorage.setItem('sidebarWidth', maxWidth.toString());
        }
        
        // Canvas resize is already handled by Graph's window resize listener
        // but we trigger it here too in case sidebar width changed
        triggerCanvasResize();
    });
}

