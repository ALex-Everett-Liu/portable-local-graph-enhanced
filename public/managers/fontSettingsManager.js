/**
 * Font Settings Manager
 * Handles font preference persistence and application
 * 
 * Design System Integration:
 * - CSS variables (--font-body, --font-display) are defined in variables.css with Neumorphism defaults
 * - User font preferences override CSS variables when saved
 * - On initialization: Only overrides CSS variables if user has saved custom preferences
 * - On reset: Removes CSS variable overrides to restore Neumorphism defaults
 * - This allows the design system to work by default while respecting user customization
 */

const STORAGE_KEY = 'graphApp_fontSettings';
export const DEFAULT_SETTINGS = {
    uiFontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
    canvasFontFamily: "Arial",
    canvasChineseFontFamily: "Arial",
    canvasFontSize: 14,
    selectionInfoFontSize: 13
};

/**
 * Load font settings from localStorage
 * @returns {Object} Font settings object
 */
export function loadFontSettings() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const settings = JSON.parse(stored);
            // Merge with defaults to handle missing properties
            return { ...DEFAULT_SETTINGS, ...settings };
        }
    } catch (error) {
        console.warn('Failed to load font settings:', error);
    }
    return { ...DEFAULT_SETTINGS };
}

/**
 * Save font settings to localStorage
 * @param {Object} settings - Font settings object
 */
export function saveFontSettings(settings) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error('Failed to save font settings:', error);
    }
}

/**
 * Apply UI font to the document
 * @param {string} fontFamily - Font family string
 * @param {boolean} overrideCSSVariables - Whether to override CSS variables (default: true)
 */
export function applyUIFont(fontFamily, overrideCSSVariables = true) {
    // Apply to body element (for backward compatibility)
    document.body.style.fontFamily = fontFamily;
    
    // Update CSS variables so design system respects user preferences
    // This ensures all components using --font-body and --font-display use the user's font
    // Only override if explicitly requested (when user has custom preferences)
    if (overrideCSSVariables) {
        document.documentElement.style.setProperty('--font-body', fontFamily);
        document.documentElement.style.setProperty('--font-display', fontFamily);
    }
}

/**
 * Update canvas font constant
 * @param {string} fontFamily - Font family string
 */
export function updateCanvasFont(fontFamily) {
    if (window.GRAPH_CONSTANTS) {
        window.GRAPH_CONSTANTS.DEFAULT_FONT_FAMILY = fontFamily;
    }
}

/**
 * Update canvas Chinese font constant
 * @param {string} fontFamily - Font family string
 */
export function updateCanvasChineseFont(fontFamily) {
    if (window.GRAPH_CONSTANTS) {
        window.GRAPH_CONSTANTS.DEFAULT_CHINESE_FONT_FAMILY = fontFamily;
    }
}

/**
 * Update canvas font size constant
 * @param {number} fontSize - Font size in pixels
 */
export function updateCanvasFontSize(fontSize) {
    if (window.GRAPH_CONSTANTS) {
        window.GRAPH_CONSTANTS.DEFAULT_FONT_SIZE = fontSize;
    }
}

/**
 * Update selection info font size
 * @param {number} fontSize - Font size in pixels
 */
export function updateSelectionInfoFontSize(fontSize) {
    // Store in a global variable for access by other modules
    if (!window.GRAPH_CONSTANTS) {
        window.GRAPH_CONSTANTS = {};
    }
    window.GRAPH_CONSTANTS.SELECTION_INFO_FONT_SIZE = fontSize;
    
    // Trigger update of selection info display if it exists
    if (window.updateGraphInfo && typeof window.updateGraphInfo === 'function') {
        window.updateGraphInfo();
    }
}

/**
 * Apply all font settings
 * @param {Object} settings - Font settings object
 * @param {boolean} overrideCSSVariables - Whether to override CSS variables (default: true)
 */
export function applyFontSettings(settings, overrideCSSVariables = true) {
    applyUIFont(settings.uiFontFamily, overrideCSSVariables);
    updateCanvasFont(settings.canvasFontFamily);
    updateCanvasChineseFont(settings.canvasChineseFontFamily);
    updateCanvasFontSize(settings.canvasFontSize);
    updateSelectionInfoFontSize(settings.selectionInfoFontSize || DEFAULT_SETTINGS.selectionInfoFontSize);
    
    // Trigger graph redraw if available
    if (window.graph && typeof window.graph.render === 'function') {
        // Use setTimeout to ensure DOM updates are complete
        setTimeout(() => {
            window.graph.render();
        }, 0);
    }
}

/**
 * Initialize font settings on app load
 * Only overrides CSS variables if user has saved custom preferences
 */
export function initializeFontSettings() {
    const settings = loadFontSettings();
    
    // Check if user has saved custom preferences
    const hasCustomPreferences = (() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored !== null;
        } catch (error) {
            return false;
        }
    })();
    
    // Only override CSS variables if user has custom preferences
    // Otherwise, let CSS defaults from variables.css (Neumorphism fonts) take effect
    applyFontSettings(settings, hasCustomPreferences);
    
    return settings;
}

/**
 * Reset font settings to defaults
 * Restores CSS variables to Neumorphism design system defaults
 */
export function resetFontSettings() {
    localStorage.removeItem(STORAGE_KEY);
    
    // Restore CSS variables to Neumorphism design system defaults
    // Remove inline style overrides so CSS defaults from variables.css take effect
    document.documentElement.style.removeProperty('--font-body');
    document.documentElement.style.removeProperty('--font-display');
    
    // Apply default settings (for canvas fonts, etc.)
    applyFontSettings(DEFAULT_SETTINGS);
    
    return { ...DEFAULT_SETTINGS };
}

