// Global Keyboard Shortcuts Manager
import { toggleHotkeyMode, isHotkeyModeActive } from './hotkeyManager.js';
import { toggleCommandPalette, isCommandPaletteActive } from './commandPalette.js';

let shortcutsInitialized = false;

/**
 * Initialize global keyboard shortcuts
 */
export function initializeKeyboardShortcuts() {
    if (shortcutsInitialized) return;
    
    shortcutsInitialized = true;
    
    document.addEventListener('keydown', (e) => {
        // Alt+P - Toggle command palette
        if (e.altKey && e.key.toLowerCase() === 'p' && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
            // Don't trigger if typing in input fields (unless command palette is already open)
            const activeElement = document.activeElement;
            const isInput = activeElement && (
                activeElement.tagName === 'INPUT' || 
                activeElement.tagName === 'TEXTAREA'
            );
            
            // Allow Alt+P even from inputs if palette is already open (to close it)
            if (!isInput || isCommandPaletteActive()) {
                e.preventDefault();
                toggleCommandPalette();
            }
            return;
        }
        
        // Alt+H - Toggle hotkey mode
        if (e.altKey && e.key.toLowerCase() === 'h' && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
            // Don't trigger if typing in input fields (unless hotkey mode is already active)
            const activeElement = document.activeElement;
            const isInput = activeElement && (
                activeElement.tagName === 'INPUT' || 
                activeElement.tagName === 'TEXTAREA'
            );
            
            // Allow Alt+H even from inputs if hotkey mode is already active (to close it)
            if (!isInput || isHotkeyModeActive()) {
                e.preventDefault();
                toggleHotkeyMode();
            }
            return;
        }
    }, true); // Use capture phase for global shortcuts
}

