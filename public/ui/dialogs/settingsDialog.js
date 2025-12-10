/**
 * Settings Dialog
 * Manages application settings including fonts and language
 */

import {
    loadFontSettings,
    saveFontSettings,
    applyFontSettings,
    resetFontSettings,
    DEFAULT_SETTINGS
} from '../../managers/fontSettingsManager.js';
import {
    getCurrentLanguage,
    setLanguage,
    getSupportedLanguages,
    getLanguageDisplayName,
    translatePage,
    t
} from '../../managers/i18nManager.js';

let currentSettings = { ...DEFAULT_SETTINGS };
let originalSettings = { ...DEFAULT_SETTINGS };
let currentLanguage = 'en';
let originalLanguage = 'en';

/**
 * Initialize settings dialog
 */
export function initializeSettingsDialog() {
    // Wait for graph to be available
    const checkGraph = () => {
        if (typeof window.graph !== "undefined") {
            setupSettingsDialogEvents();
            loadCurrentSettings();
        } else {
            setTimeout(checkGraph, 100);
        }
    };
    checkGraph();
}

/**
 * Setup event listeners for settings dialog
 */
function setupSettingsDialogEvents() {
    // Open settings dialog
    const settingsBtn = document.getElementById("settings-btn");
    if (settingsBtn) {
        settingsBtn.addEventListener("click", openSettingsDialog);
    }

    // Tab switching
    const fontsTab = document.getElementById("settings-tab-fonts");
    if (fontsTab) {
        fontsTab.addEventListener("click", () => switchTab("fonts"));
    }
    
    const languageTab = document.getElementById("settings-tab-language");
    if (languageTab) {
        languageTab.addEventListener("click", () => switchTab("language"));
    }
    
    // Language selector
    const languageSelect = document.getElementById("language-select");
    if (languageSelect) {
        languageSelect.addEventListener("change", (e) => {
            currentLanguage = e.target.value;
        });
    }

    // Font selectors
    const uiFontSelect = document.getElementById("ui-font-family");
    const canvasFontSelect = document.getElementById("canvas-font-family");
    const canvasChineseFontSelect = document.getElementById("canvas-chinese-font-family");
    const canvasFontSizeSlider = document.getElementById("canvas-font-size");
    const canvasFontSizeValue = document.getElementById("canvas-font-size-value");
    const selectionInfoFontSizeSlider = document.getElementById("selection-info-font-size");
    const selectionInfoFontSizeValue = document.getElementById("selection-info-font-size-value");

    if (uiFontSelect) {
        uiFontSelect.addEventListener("change", updateUIFontPreview);
    }
    if (canvasFontSelect) {
        canvasFontSelect.addEventListener("change", updateCanvasFontPreview);
    }
    if (canvasChineseFontSelect) {
        canvasChineseFontSelect.addEventListener("change", updateChineseFontPreview);
    }
    if (canvasFontSizeSlider && canvasFontSizeValue) {
        canvasFontSizeSlider.addEventListener("input", (e) => {
            canvasFontSizeValue.textContent = `${e.target.value}px`;
        });
    }
    if (selectionInfoFontSizeSlider && selectionInfoFontSizeValue) {
        selectionInfoFontSizeSlider.addEventListener("input", (e) => {
            selectionInfoFontSizeValue.textContent = `${e.target.value}px`;
        });
    }

    // Dialog buttons
    const applyBtn = document.getElementById("settings-apply-btn");
    const cancelBtn = document.getElementById("settings-cancel-btn");
    const resetBtn = document.getElementById("settings-reset-btn");

    if (applyBtn) {
        applyBtn.addEventListener("click", applySettings);
    }
    if (cancelBtn) {
        cancelBtn.addEventListener("click", closeSettingsDialog);
    }
    if (resetBtn) {
        resetBtn.addEventListener("click", resetSettings);
    }

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
        const dialog = document.getElementById("settings-dialog");
        if (e.key === "Escape" && dialog && !dialog.classList.contains("hidden")) {
            closeSettingsDialog();
        }
    });
}

/**
 * Load current settings into dialog
 */
function loadCurrentSettings() {
    currentSettings = loadFontSettings();
    originalSettings = { ...currentSettings };
    
    // Load current language
    currentLanguage = getCurrentLanguage();
    originalLanguage = currentLanguage;

    // Update UI
    const uiFontSelect = document.getElementById("ui-font-family");
    const canvasFontSelect = document.getElementById("canvas-font-family");
    const canvasChineseFontSelect = document.getElementById("canvas-chinese-font-family");
    const canvasFontSizeSlider = document.getElementById("canvas-font-size");
    const canvasFontSizeValue = document.getElementById("canvas-font-size-value");
    const selectionInfoFontSizeSlider = document.getElementById("selection-info-font-size");
    const selectionInfoFontSizeValue = document.getElementById("selection-info-font-size-value");
    const languageSelect = document.getElementById("language-select");

    if (uiFontSelect) {
        uiFontSelect.value = currentSettings.uiFontFamily;
        updateUIFontPreview();
    }
    if (canvasFontSelect) {
        canvasFontSelect.value = currentSettings.canvasFontFamily;
        updateCanvasFontPreview();
    }
    if (canvasChineseFontSelect) {
        canvasChineseFontSelect.value = currentSettings.canvasChineseFontFamily;
        updateChineseFontPreview();
    }
    if (canvasFontSizeSlider && canvasFontSizeValue) {
        canvasFontSizeSlider.value = currentSettings.canvasFontSize;
        canvasFontSizeValue.textContent = `${currentSettings.canvasFontSize}px`;
    }
    if (selectionInfoFontSizeSlider && selectionInfoFontSizeValue) {
        selectionInfoFontSizeSlider.value = currentSettings.selectionInfoFontSize || 13;
        selectionInfoFontSizeValue.textContent = `${currentSettings.selectionInfoFontSize || 13}px`;
    }
    if (languageSelect) {
        languageSelect.value = currentLanguage;
    }
    
    // Translate dialog content
    translatePage();
}

/**
 * Update UI font preview
 */
function updateUIFontPreview() {
    const select = document.getElementById("ui-font-family");
    const preview = document.getElementById("ui-font-preview");
    if (select && preview) {
        preview.style.fontFamily = select.value;
        currentSettings.uiFontFamily = select.value;
    }
}

/**
 * Update canvas font preview
 */
function updateCanvasFontPreview() {
    const select = document.getElementById("canvas-font-family");
    const preview = document.getElementById("canvas-font-preview");
    if (select && preview) {
        preview.style.fontFamily = select.value;
        currentSettings.canvasFontFamily = select.value;
    }
}

/**
 * Update Chinese font preview
 */
function updateChineseFontPreview() {
    const select = document.getElementById("canvas-chinese-font-family");
    const preview = document.getElementById("canvas-chinese-font-preview");
    if (select && preview) {
        preview.style.fontFamily = select.value;
        currentSettings.canvasChineseFontFamily = select.value;
    }
}

/**
 * Switch tab
 * @param {string} tabName - Name of tab to switch to
 */
function switchTab(tabName) {
    // Update tab buttons
    const tabs = document.querySelectorAll(".settings-tab");
    tabs.forEach(tab => {
        tab.classList.remove("active");
        tab.style.borderBottom = "none";
    });
    
    const activeTab = document.getElementById(`settings-tab-${tabName}`);
    if (activeTab) {
        activeTab.classList.add("active");
        activeTab.style.borderBottom = "2px solid #007bff";
    }

    // Update tab content
    const contents = document.querySelectorAll(".settings-tab-content");
    contents.forEach(content => {
        content.style.display = "none";
    });
    
    const activeContent = document.getElementById(`settings-content-${tabName}`);
    if (activeContent) {
        activeContent.style.display = "block";
    }
    
    // Translate content when switching tabs
    translatePage();
}

/**
 * Open settings dialog
 */
export function openSettingsDialog() {
    const dialog = document.getElementById("settings-dialog");
    if (!dialog) return;

    loadCurrentSettings();
    dialog.classList.remove("hidden");
    
    // Set initial tab
    switchTab("fonts");
}

/**
 * Close settings dialog
 */
export function closeSettingsDialog() {
    const dialog = document.getElementById("settings-dialog");
    if (!dialog) return;

    // Revert to original settings
    currentSettings = { ...originalSettings };
    currentLanguage = originalLanguage;
    loadCurrentSettings();
    
    dialog.classList.add("hidden");
}

/**
 * Apply settings
 */
async function applySettings() {
    // Get current values from form
    const uiFontSelect = document.getElementById("ui-font-family");
    const canvasFontSelect = document.getElementById("canvas-font-family");
    const canvasChineseFontSelect = document.getElementById("canvas-chinese-font-family");
    const canvasFontSizeSlider = document.getElementById("canvas-font-size");
    const selectionInfoFontSizeSlider = document.getElementById("selection-info-font-size");
    const languageSelect = document.getElementById("language-select");

    currentSettings = {
        uiFontFamily: uiFontSelect ? uiFontSelect.value : currentSettings.uiFontFamily,
        canvasFontFamily: canvasFontSelect ? canvasFontSelect.value : currentSettings.canvasFontFamily,
        canvasChineseFontFamily: canvasChineseFontSelect ? canvasChineseFontSelect.value : currentSettings.canvasChineseFontFamily,
        canvasFontSize: canvasFontSizeSlider ? parseInt(canvasFontSizeSlider.value) : currentSettings.canvasFontSize,
        selectionInfoFontSize: selectionInfoFontSizeSlider ? parseInt(selectionInfoFontSizeSlider.value) : (currentSettings.selectionInfoFontSize || 13)
    };

    // Save and apply font settings
    saveFontSettings(currentSettings);
    applyFontSettings(currentSettings);
    originalSettings = { ...currentSettings };

    // Apply language change if different
    const selectedLanguage = languageSelect ? languageSelect.value : currentLanguage;
    if (selectedLanguage !== originalLanguage) {
        await setLanguage(selectedLanguage);
        originalLanguage = selectedLanguage;
        currentLanguage = selectedLanguage;
        // Translate the entire page after language change
        translatePage();
    }

    // Close dialog
    closeSettingsDialog();
}

/**
 * Reset settings to defaults
 */
async function resetSettings() {
    // Use window.showConfirmDialog if available (exposed globally), otherwise import
    const confirmFn = window.showConfirmDialog || (await import('../../utils/confirmDialog.js')).showConfirmDialog;
    const confirmMessage = t('settings.resetConfirm');
    const confirmed = await confirmFn(confirmMessage, 'warning', 'Reset', 'Cancel');
    if (confirmed) {
        currentSettings = resetFontSettings();
        originalSettings = { ...currentSettings };
        // Reset language to default (English)
        currentLanguage = 'en';
        originalLanguage = 'en';
        const languageSelect = document.getElementById("language-select");
        if (languageSelect) {
            languageSelect.value = 'en';
        }
        loadCurrentSettings();
    }
}

