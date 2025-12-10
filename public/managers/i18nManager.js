/**
 * Internationalization (i18n) Manager
 * Handles language switching and translations
 */

const STORAGE_KEY = 'graphApp_language';
const DEFAULT_LANGUAGE = 'en';
const SUPPORTED_LANGUAGES = ['en', 'zh'];

let currentLanguage = DEFAULT_LANGUAGE;
let translations = {};

/**
 * Load translations for a given language
 * @param {string} lang - Language code (e.g., 'en', 'zh')
 * @returns {Promise<Object>} Translations object
 */
async function loadTranslations(lang) {
    try {
        const response = await fetch(`locales/${lang}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load translations for ${lang}`);
        }
        return await response.json();
    } catch (error) {
        console.warn(`Failed to load translations for ${lang}:`, error);
        // Fallback to English if available
        if (lang !== 'en') {
            try {
                const response = await fetch(`locales/en.json`);
                if (response.ok) {
                    return await response.json();
                }
            } catch (e) {
                console.error('Failed to load fallback translations:', e);
            }
        }
        return {};
    }
}

/**
 * Get current language
 * @returns {string} Current language code
 */
export function getCurrentLanguage() {
    return currentLanguage;
}

/**
 * Get supported languages
 * @returns {string[]} Array of supported language codes
 */
export function getSupportedLanguages() {
    return [...SUPPORTED_LANGUAGES];
}

/**
 * Load language preference from localStorage
 * @returns {string} Language code
 */
export function loadLanguage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
            return stored;
        }
    } catch (error) {
        console.warn('Failed to load language preference:', error);
    }
    return DEFAULT_LANGUAGE;
}

/**
 * Save language preference to localStorage
 * @param {string} lang - Language code
 */
export function saveLanguage(lang) {
    try {
        if (SUPPORTED_LANGUAGES.includes(lang)) {
            localStorage.setItem(STORAGE_KEY, lang);
        }
    } catch (error) {
        console.error('Failed to save language preference:', error);
    }
}

/**
 * Initialize i18n system
 * @returns {Promise<void>}
 */
export async function initializeI18n() {
    currentLanguage = loadLanguage();
    translations = await loadTranslations(currentLanguage);
    applyLanguageToDocument();
    return currentLanguage;
}

/**
 * Set language and reload translations
 * @param {string} lang - Language code
 * @returns {Promise<void>}
 */
export async function setLanguage(lang) {
    if (!SUPPORTED_LANGUAGES.includes(lang)) {
        console.warn(`Unsupported language: ${lang}`);
        return;
    }
    
    currentLanguage = lang;
    translations = await loadTranslations(lang);
    saveLanguage(lang);
    applyLanguageToDocument();
    
    // Trigger custom event for language change
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
}

/**
 * Get translation for a key
 * @param {string} key - Translation key (supports dot notation, e.g., 'settings.title')
 * @param {Object} params - Optional parameters for interpolation
 * @returns {string} Translated string
 */
export function t(key, params = {}) {
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
            value = value[k];
        } else {
            console.warn(`Translation key not found: ${key}`);
            return key; // Return key if translation not found
        }
    }
    
    if (typeof value !== 'string') {
        console.warn(`Translation value is not a string for key: ${key}`);
        return key;
    }
    
    // Simple parameter interpolation with pluralization support
    let result = value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        if (paramKey === 'plural' && params.count !== undefined) {
            // Handle pluralization: add 's' for English if count !== 1
            if (currentLanguage === 'en') {
                return params.count !== 1 ? 's' : '';
            } else if (currentLanguage === 'zh') {
                // Chinese doesn't use plural forms
                return '';
            }
            return params.count !== 1 ? 's' : '';
        }
        return params[paramKey] !== undefined ? params[paramKey] : match;
    });
    
    // Replace count placeholder
    result = result.replace(/\{\{count\}\}/g, params.count !== undefined ? params.count : '{{count}}');
    
    return result;
}

/**
 * Apply language attribute to document
 */
function applyLanguageToDocument() {
    document.documentElement.lang = currentLanguage;
    if (currentLanguage === 'zh') {
        document.documentElement.setAttribute('dir', 'ltr'); // Chinese uses LTR
    }
}

/**
 * Translate all elements with data-i18n attribute
 */
export function translatePage() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = t(key);
        
        if (element.tagName === 'INPUT' && element.type !== 'submit' && element.type !== 'button') {
            // For input elements, translate placeholder
            if (element.hasAttribute('data-i18n-placeholder')) {
                element.placeholder = translation;
            } else {
                element.placeholder = translation;
            }
        } else if (element.tagName === 'INPUT' && (element.type === 'submit' || element.type === 'button')) {
            element.value = translation;
        } else {
            element.textContent = translation;
        }
    });
    
    // Translate elements with data-i18n-html for HTML content
    const htmlElements = document.querySelectorAll('[data-i18n-html]');
    htmlElements.forEach(element => {
        const key = element.getAttribute('data-i18n-html');
        element.innerHTML = t(key);
    });
    
    // Translate title attributes
    const titleElements = document.querySelectorAll('[data-i18n-title]');
    titleElements.forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        element.title = t(key);
    });
}

/**
 * Get language display name
 * @param {string} lang - Language code
 * @returns {string} Display name
 */
export function getLanguageDisplayName(lang) {
    const names = {
        'en': 'English',
        'zh': '中文'
    };
    return names[lang] || lang;
}

