/**
 * Toast Notification System
 * Replaces alert(), confirm(), and prompt() to avoid Electron Windows focus bugs
 * 
 * Usage:
 *   showToast('Message', 'success', 3000);
 *   showToast('Error occurred', 'error', 5000);
 *   showToast('Warning', 'warning', 4000);
 *   showToast('Info', 'info');
 */

/**
 * Get icon class for toast type
 */
function getToastIcon(type) {
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    return icons[type] || icons.info;
}

/**
 * Get background color for toast type
 */
function getToastColor(type) {
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    return colors[type] || colors.info;
}

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - Type: 'success', 'error', 'warning', 'info' (default: 'info')
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
export function showToast(message, type = 'info', duration = 3000) {
    // Ensure toast container exists
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    
    const icon = getToastIcon(type);
    const color = getToastColor(type);
    
    toast.innerHTML = `
        <span class="toast-icon" style="color: ${color};">${icon}</span>
        <span class="toast-message">${escapeHtml(message)}</span>
        <button class="toast-close" aria-label="Close notification" onclick="this.parentElement.remove()">
            <span aria-hidden="true">×</span>
        </button>
    `;
    
    // Add to container
    container.appendChild(toast);
    
    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('toast-visible');
    });
    
    // Auto-remove after duration
    const timeoutId = setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.remove('toast-visible');
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300); // Match CSS transition duration
        }
    }, duration);
    
    // Clear timeout if manually closed
    toast.querySelector('.toast-close').addEventListener('click', () => {
        clearTimeout(timeoutId);
    });
    
    return toast;
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

/**
 * Expose on window for backward compatibility and non-module scripts
 */
if (typeof window !== 'undefined') {
    window.showToast = showToast;
}

