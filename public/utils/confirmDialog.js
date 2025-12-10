/**
 * Custom Confirmation Dialog
 * Replaces confirm() to avoid Electron Windows focus bugs
 * 
 * Usage:
 *   const confirmed = await showConfirmDialog('Are you sure?', 'warning');
 *   if (confirmed) { ... }
 */

/**
 * Show a confirmation dialog
 * @param {string} message - The message to display
 * @param {string} type - Type: 'warning', 'danger', 'info' (default: 'warning')
 * @param {string} confirmText - Text for confirm button (default: 'OK')
 * @param {string} cancelText - Text for cancel button (default: 'Cancel')
 * @returns {Promise<boolean>} - true if confirmed, false if cancelled
 */
export function showConfirmDialog(message, type = 'warning', confirmText = 'OK', cancelText = 'Cancel') {
    return new Promise((resolve) => {
        // Create modal backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'confirm-dialog-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s ease-out;
        `;

        // Create dialog
        const dialog = document.createElement('div');
        dialog.className = `confirm-dialog confirm-dialog-${type}`;
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-labelledby', 'confirm-dialog-title');
        
        const iconMap = {
            warning: '⚠',
            danger: '✕',
            info: 'ℹ'
        };
        const icon = iconMap[type] || iconMap.warning;
        
        const colorMap = {
            warning: '#ffc107',
            danger: '#dc3545',
            info: '#17a2b8'
        };
        const color = colorMap[type] || colorMap.warning;

        dialog.innerHTML = `
            <div class="confirm-dialog-header">
                <span class="confirm-dialog-icon" style="color: ${color};">${icon}</span>
                <h3 id="confirm-dialog-title" class="confirm-dialog-title">Confirm Action</h3>
            </div>
            <div class="confirm-dialog-body">
                <p class="confirm-dialog-message">${escapeHtml(message)}</p>
            </div>
            <div class="confirm-dialog-footer">
                <button class="confirm-dialog-btn confirm-dialog-btn-cancel" data-action="cancel">
                    ${escapeHtml(cancelText)}
                </button>
                <button class="confirm-dialog-btn confirm-dialog-btn-confirm confirm-dialog-btn-${type}" data-action="confirm">
                    ${escapeHtml(confirmText)}
                </button>
            </div>
        `;

        backdrop.appendChild(dialog);
        document.body.appendChild(backdrop);

        // Focus management
        const confirmBtn = dialog.querySelector('[data-action="confirm"]');
        const cancelBtn = dialog.querySelector('[data-action="cancel"]');
        confirmBtn.focus();

        // Handle button clicks
        const handleConfirm = () => {
            cleanup();
            resolve(true);
        };

        const handleCancel = () => {
            cleanup();
            resolve(false);
        };

        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);

        // Handle keyboard
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                handleCancel();
            } else if (e.key === 'Enter' && document.activeElement === confirmBtn) {
                handleConfirm();
            }
        };
        document.addEventListener('keydown', handleKeyDown);

        // Handle backdrop click
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                handleCancel();
            }
        });

        // Cleanup function
        function cleanup() {
            backdrop.style.animation = 'fadeOut 0.2s ease-out';
            dialog.style.animation = 'slideOut 0.2s ease-out';
            setTimeout(() => {
                if (backdrop.parentElement) {
                    backdrop.remove();
                }
                document.removeEventListener('keydown', handleKeyDown);
            }, 200);
        }
    });
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
    window.showConfirmDialog = showConfirmDialog;
}

