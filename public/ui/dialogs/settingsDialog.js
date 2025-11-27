/**
 * Settings Dialog
 * Manages application settings including fonts
 */

import {
    loadFontSettings,
    saveFontSettings,
    applyFontSettings,
    resetFontSettings,
    DEFAULT_SETTINGS
} from '../../managers/fontSettingsManager.js';

let currentSettings = { ...DEFAULT_SETTINGS };
let originalSettings = { ...DEFAULT_SETTINGS };

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

    // Font selectors
    const uiFontSelect = document.getElementById("ui-font-family");
    const canvasFontSelect = document.getElementById("canvas-font-family");
    const canvasChineseFontSelect = document.getElementById("canvas-chinese-font-family");
    const canvasFontSizeSlider = document.getElementById("canvas-font-size");
    const canvasFontSizeValue = document.getElementById("canvas-font-size-value");

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

    // Update UI
    const uiFontSelect = document.getElementById("ui-font-family");
    const canvasFontSelect = document.getElementById("canvas-font-family");
    const canvasChineseFontSelect = document.getElementById("canvas-chinese-font-family");
    const canvasFontSizeSlider = document.getElementById("canvas-font-size");
    const canvasFontSizeValue = document.getElementById("canvas-font-size-value");

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
    loadCurrentSettings();
    
    dialog.classList.add("hidden");
}

/**
 * Apply settings
 */
function applySettings() {
    // Get current values from form
    const uiFontSelect = document.getElementById("ui-font-family");
    const canvasFontSelect = document.getElementById("canvas-font-family");
    const canvasChineseFontSelect = document.getElementById("canvas-chinese-font-family");
    const canvasFontSizeSlider = document.getElementById("canvas-font-size");

    currentSettings = {
        uiFontFamily: uiFontSelect ? uiFontSelect.value : currentSettings.uiFontFamily,
        canvasFontFamily: canvasFontSelect ? canvasFontSelect.value : currentSettings.canvasFontFamily,
        canvasChineseFontFamily: canvasChineseFontSelect ? canvasChineseFontSelect.value : currentSettings.canvasChineseFontFamily,
        canvasFontSize: canvasFontSizeSlider ? parseInt(canvasFontSizeSlider.value) : currentSettings.canvasFontSize
    };

    // Save and apply
    saveFontSettings(currentSettings);
    applyFontSettings(currentSettings);
    originalSettings = { ...currentSettings };

    // Close dialog
    closeSettingsDialog();
}

/**
 * Reset settings to defaults
 */
function resetSettings() {
    if (confirm("Reset all font settings to defaults? This cannot be undone.")) {
        currentSettings = resetFontSettings();
        originalSettings = { ...currentSettings };
        loadCurrentSettings();
    }
}

