/**
 * Theme Manager
 * Handles theme switching and persistence
 * 
 * Themes:
 * - neumorphism: Neumorphism (Soft UI) design system with dual shadows
 * - basic: Simple, clean theme with minimal styling
 * - organic: Organic/Natural theme with earth-drawn palette and soft shadows
 */

const STORAGE_KEY = 'graphApp_theme';
export const DEFAULT_THEME = 'neumorphism';

/**
 * Theme Definitions
 * Each theme defines CSS variables that override the base design tokens
 */
export const THEMES = {
    neumorphism: {
        name: 'Neumorphism',
        description: 'Soft UI with dual shadows and depth illusion',
        variables: {
            // Colors - Cool Monochromatic Palette
            '--background': '#E0E5EC',
            '--foreground': '#3D4852',
            '--muted': '#6B7280',
            '--accent': '#7FC9FF',
            '--accent-light': '#9DD5FF',
            '--accent-secondary': '#38B2AC',
            '--success-color': '#10b981',
            '--error-color': '#ef4444',
            '--warning-color': '#f59e0b',
            
            // Shadow Colors - RGBA for Smoothness
            '--shadow-light': 'rgba(255, 255, 255, 0.5)',
            '--shadow-light-hover': 'rgba(255, 255, 255, 0.6)',
            '--shadow-dark': 'rgba(163, 177, 198, 0.6)',
            '--shadow-dark-hover': 'rgba(163, 177, 198, 0.7)',
            
            // Typography
            '--font-display': "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
            '--font-body': "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
            
            // Radius
            '--radius-container': '32px',
            '--radius-button': '16px',
            '--radius-inner': '12px',
            
            // Transitions
            '--transition-fast': '300ms ease-out',
            '--transition-slow': '500ms ease-out',
            
            // Shadow Presets
            '--shadow-extruded': '9px 9px 16px var(--shadow-dark), -9px -9px 16px var(--shadow-light)',
            '--shadow-extruded-hover': '12px 12px 20px var(--shadow-dark-hover), -12px -12px 20px var(--shadow-light-hover)',
            '--shadow-extruded-small': '5px 5px 10px var(--shadow-dark), -5px -5px 10px var(--shadow-light)',
            '--shadow-inset': 'inset 6px 6px 10px var(--shadow-dark), inset -6px -6px 10px var(--shadow-light)',
            '--shadow-inset-deep': 'inset 10px 10px 20px var(--shadow-dark-hover), inset -10px -10px 20px var(--shadow-light-hover)',
            '--shadow-inset-small': 'inset 3px 3px 6px var(--shadow-dark), inset -3px -3px 6px var(--shadow-light)'
        }
    },
    
    basic: {
        name: 'Basic',
        description: 'Simple and clean theme with minimal styling',
        variables: {
            // Colors - Light theme
            '--background': '#FFFFFF',
            '--foreground': '#1A1A1A',
            '--muted': '#6B7280',
            '--accent': '#0066FF',
            '--accent-light': '#3385FF',
            '--accent-secondary': '#10B981',
            '--success-color': '#10b981',
            '--error-color': '#ef4444',
            '--warning-color': '#f59e0b',
            
            // Shadow Colors - Simple shadows
            '--shadow-light': 'rgba(0, 0, 0, 0.05)',
            '--shadow-light-hover': 'rgba(0, 0, 0, 0.08)',
            '--shadow-dark': 'rgba(0, 0, 0, 0.1)',
            '--shadow-dark-hover': 'rgba(0, 0, 0, 0.15)',
            
            // Typography - System fonts
            '--font-display': "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
            '--font-body': "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
            
            // Radius - Smaller, more standard
            '--radius-container': '8px',
            '--radius-button': '6px',
            '--radius-inner': '4px',
            
            // Transitions - Faster
            '--transition-fast': '200ms ease',
            '--transition-slow': '300ms ease',
            
            // Shadow Presets - Simple box shadows
            '--shadow-extruded': '0 2px 8px var(--shadow-dark)',
            '--shadow-extruded-hover': '0 4px 12px var(--shadow-dark-hover)',
            '--shadow-extruded-small': '0 1px 4px var(--shadow-dark)',
            '--shadow-inset': 'inset 0 1px 2px var(--shadow-dark)',
            '--shadow-inset-deep': 'inset 0 2px 4px var(--shadow-dark-hover)',
            '--shadow-inset-small': 'inset 0 1px 1px var(--shadow-dark)'
        }
    },
    
    organic: {
        name: 'Organic',
        description: 'Warm, natural theme with earth-drawn palette and soft shadows',
        variables: {
            // Colors - Earth-drawn palette (forest floor, clay, unbleached paper)
            '--background': '#FDFCF8',           // Off-white, Rice Paper
            '--foreground': '#2C2C24',           // Deep Loam / Charcoal
            '--muted': '#78786C',                // Dried Grass
            '--accent': '#5D7052',               // Moss Green (primary)
            '--accent-light': '#6B7F60',         // Lighter moss green for hover
            '--accent-secondary': '#C18C5D',     // Terracotta / Clay
            '--success-color': '#5D7052',        // Moss green for success
            '--error-color': '#A85448',          // Burnt Sienna
            '--warning-color': '#C18C5D',        // Terracotta for warnings
            
            // Shadow Colors - Soft, colored shadows (moss and clay tinted)
            '--shadow-light': 'rgba(93, 112, 82, 0.08)',      // Moss-tinted light shadow
            '--shadow-light-hover': 'rgba(93, 112, 82, 0.12)', // Moss-tinted hover
            '--shadow-dark': 'rgba(93, 112, 82, 0.15)',       // Moss-tinted dark shadow
            '--shadow-dark-hover': 'rgba(193, 140, 93, 0.2)',  // Clay-tinted hover shadow
            
            // Typography - Fraunces for headings, Nunito for body
            '--font-display': "'Fraunces', Georgia, serif",
            '--font-body': "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            
            // Radius - Organic, generous curves
            '--radius-container': '24px',        // rounded-3xl (cards, containers)
            '--radius-button': '9999px',         // Fully rounded pills
            '--radius-inner': '12px',            // Inner elements
            
            // Transitions - Natural, gentle motion
            '--transition-fast': '300ms ease-out',
            '--transition-slow': '500ms ease-out',
            
            // Shadow Presets - Soft, diffused, colored shadows
            '--shadow-extruded': '0 4px 20px -2px rgba(93, 112, 82, 0.15)',           // Moss-tinted soft shadow
            '--shadow-extruded-hover': '0 6px 24px -4px rgba(93, 112, 82, 0.25)',    // Enhanced moss shadow
            '--shadow-extruded-small': '0 2px 10px -1px rgba(93, 112, 82, 0.12)',    // Small moss shadow
            '--shadow-inset': 'inset 0 2px 4px rgba(93, 112, 82, 0.1)',               // Soft inset shadow
            '--shadow-inset-deep': 'inset 0 4px 8px rgba(93, 112, 82, 0.15)',         // Deep inset shadow
            '--shadow-inset-small': 'inset 0 1px 2px rgba(93, 112, 82, 0.08)'        // Small inset shadow
        }
    }
};

/**
 * Load theme from localStorage
 * @returns {string} Theme ID
 */
export function loadTheme() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && THEMES[stored]) {
            return stored;
        }
    } catch (error) {
        console.warn('Failed to load theme:', error);
    }
    return DEFAULT_THEME;
}

/**
 * Save theme to localStorage
 * @param {string} themeId - Theme ID
 */
export function saveTheme(themeId) {
    try {
        if (!THEMES[themeId]) {
            console.warn(`Invalid theme ID: ${themeId}`);
            return;
        }
        localStorage.setItem(STORAGE_KEY, themeId);
    } catch (error) {
        console.error('Failed to save theme:', error);
    }
}

/**
 * Apply theme to the document
 * @param {string} themeId - Theme ID
 */
export function applyTheme(themeId) {
    const theme = THEMES[themeId];
    if (!theme) {
        console.warn(`Theme not found: ${themeId}`);
        return;
    }
    
    // Apply all CSS variables from theme
    const root = document.documentElement;
    Object.entries(theme.variables).forEach(([property, value]) => {
        root.style.setProperty(property, value);
    });
    
    // Add theme class to body for theme-specific styling if needed
    document.body.className = document.body.className
        .split(' ')
        .filter(cls => !cls.startsWith('theme-'))
        .join(' ') + ` theme-${themeId}`;
    
    // Save theme preference
    saveTheme(themeId);
}

/**
 * Get current theme
 * @returns {string} Current theme ID
 */
export function getCurrentTheme() {
    return loadTheme();
}

/**
 * Get theme info
 * @param {string} themeId - Theme ID
 * @returns {Object|null} Theme info object
 */
export function getThemeInfo(themeId) {
    return THEMES[themeId] || null;
}

/**
 * Get all available themes
 * @returns {Object} All themes
 */
export function getAllThemes() {
    return THEMES;
}

/**
 * Initialize theme on app load
 */
export function initializeTheme() {
    const themeId = loadTheme();
    applyTheme(themeId);
    return themeId;
}

/**
 * Reset theme to default
 */
export function resetTheme() {
    localStorage.removeItem(STORAGE_KEY);
    applyTheme(DEFAULT_THEME);
    return DEFAULT_THEME;
}

