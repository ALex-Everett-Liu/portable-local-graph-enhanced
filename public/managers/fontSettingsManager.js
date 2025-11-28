/**
 * Font Settings Manager
 * Handles font preference persistence and application
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
 */
export function applyUIFont(fontFamily) {
    document.body.style.fontFamily = fontFamily;
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
 */
export function applyFontSettings(settings) {
    applyUIFont(settings.uiFontFamily);
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
 */
export function initializeFontSettings() {
    const settings = loadFontSettings();
    applyFontSettings(settings);
    return settings;
}

/**
 * Reset font settings to defaults
 */
export function resetFontSettings() {
    localStorage.removeItem(STORAGE_KEY);
    applyFontSettings(DEFAULT_SETTINGS);
    return { ...DEFAULT_SETTINGS };
}

