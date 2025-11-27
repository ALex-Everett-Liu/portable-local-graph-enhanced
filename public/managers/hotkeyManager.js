// Hotkey Manager - Vim-like multi-character sequence support
import { setMode } from './modeManager.js';
import { getGraph } from '../state/appState.js';
import { showLoadDialog } from '../ui/dialogs/loadDialog.js';
import { showSearchDialog } from '../ui/dialogs/searchDialog.js';
import { showSaveAsDialog } from '../ui/dialogs/saveAsDialog.js';
import { showEdgeSearchDialog } from '../ui/dialogs/edgeSearchDialog.js';
import { clearGraph } from '../ui/saveDiscardUI.js';
import { toggleFullscreen } from './fullscreenManager.js';
import { saveViewStateToDb } from '../services/databaseService.js';
import { showMergeDialog } from '../ui/dialogs/mergeDialog.js';
import { openLayerDialog } from '../ui/dialogs/layerDialog.js';
import { createNewGraphTemplate } from '../ui/template.js';
import { openSettingsDialog } from '../ui/dialogs/settingsDialog.js';
import { showExportDialog } from '../ui/dialogs/exportDialog.js';

let hotkeyModeActive = false;
let sequenceBuffer = '';
let sequenceTimeout = null;
let hotkeyModeListener = null;

// Configuration
const SEQUENCE_TIMEOUT = 2000; // 2 seconds like vim's timeoutlen
const MAX_SEQUENCE_LENGTH = 10; // Prevent infinite sequences

/**
 * Command definitions with sequences
 * Format: 'sequence': { action: function, description: string, requiresCount: boolean }
 */
const COMMANDS = {
    // Single character - modes
    'n': { 
        action: () => setMode('node'), 
        description: 'Node mode',
        requiresCount: false 
    },
    'e': { 
        action: () => setMode('edge'), 
        description: 'Edge mode',
        requiresCount: false 
    },
    's': { 
        action: () => setMode('select'), 
        description: 'Select mode',
        requiresCount: false 
    },
    
    // Multi-character sequences - node operations
    'cn': { 
        action: (count = 1) => {
            setMode('node');
            // Store count for next node creation (if needed in future)
            window.hotkeyNodeCount = count;
        }, 
        description: 'Create node(s)',
        requiresCount: true 
    },
    'dn': { 
        action: (count = 1) => {
            const graph = getGraph();
            if (!graph || !graph.selectedNode) {
                showNotification('No node selected', 'error');
                return;
            }
            // Delete selected node
            const nodeToDelete = graph.selectedNode;
            graph.deleteNode(nodeToDelete);
            // Note: For count > 1, would need to select next node, but that's complex
            // For now, just delete the selected node
        }, 
        description: 'Delete node',
        requiresCount: false 
    },
    'en': { 
        action: () => {
            const graph = getGraph();
            if (!graph || !graph.selectedNode) {
                showNotification('No node selected', 'error');
                return;
            }
            // Open edit dialog
            if (window.showNodeDialog) {
                window.showNodeDialog(graph.selectedNode);
            }
        }, 
        description: 'Edit node',
        requiresCount: false 
    },
    
    // Multi-character sequences - edge operations
    'ce': { 
        action: () => setMode('edge'), 
        description: 'Create edge',
        requiresCount: false 
    },
    'de': { 
        action: () => {
            const graph = getGraph();
            if (!graph || !graph.selectedEdge) {
                showNotification('No edge selected', 'error');
                return;
            }
            const edgeToDelete = graph.selectedEdge;
            graph.deleteEdge(edgeToDelete);
        }, 
        description: 'Delete edge',
        requiresCount: false 
    },
    'ee': { 
        action: () => {
            const graph = getGraph();
            if (!graph || !graph.selectedEdge) {
                showNotification('No edge selected', 'error');
                return;
            }
            if (window.showEdgeDialog) {
                window.showEdgeDialog(graph.selectedEdge);
            }
        }, 
        description: 'Edit edge',
        requiresCount: false 
    },
    
    // Edge creation via search
    'ces': { 
        action: () => showEdgeSearchDialog(), 
        description: 'Create edge via search',
        requiresCount: false 
    },
    
    // Navigation and dialogs
    'f': { 
        action: () => showSearchDialog(), 
        description: 'Find/Search',
        requiresCount: false 
    },
    'l': { 
        action: () => showLoadDialog(), 
        description: 'Load database',
        requiresCount: false 
    },
    'w': { 
        action: () => showSaveAsDialog(), 
        description: 'Write/Save As',
        requiresCount: false 
    },
    'c': { 
        action: () => clearGraph(), 
        description: 'Clear graph',
        requiresCount: false 
    },
    
    // Display options
    'ea': { 
        action: () => {
            // Toggle show edge arrows checkbox
            const checkbox = document.getElementById('show-edge-arrows');
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
                // Trigger change event to update state
                checkbox.dispatchEvent(new Event('change'));
            }
        }, 
        description: 'Show edge arrows',
        requiresCount: false 
    },
    
    // View operations
    'fs': { 
        action: () => toggleFullscreen(), 
        description: 'Fullscreen canvas',
        requiresCount: false 
    },
    'sv': { 
        action: async () => {
            try {
                await saveViewStateToDb();
                showNotification('View state saved', 'success');
            } catch (error) {
                showNotification('Failed to save view state', 'error');
            }
        }, 
        description: 'Save view',
        requiresCount: false 
    },
    
    // Database operations
    'md': { 
        action: () => showMergeDialog(), 
        description: 'Merge database',
        requiresCount: false 
    },
    'ex': { 
        action: () => showExportDialog(), 
        description: 'Export database',
        requiresCount: false 
    },
    
    // Layer management
    'ml': { 
        action: () => openLayerDialog(), 
        description: 'Manage layers',
        requiresCount: false 
    },
    
    // Template operations
    'nt': { 
        action: async () => {
            try {
                await createNewGraphTemplate();
                showNotification('New graph template created', 'success');
            } catch (error) {
                showNotification('Failed to create template', 'error');
            }
        }, 
        description: 'New graph template',
        requiresCount: false 
    },
    
    // Settings
    'st': { 
        action: () => openSettingsDialog(), 
        description: 'Open settings',
        requiresCount: false 
    },
    
    // Help
    '?': { 
        action: () => showHelpOverlay(), 
        description: 'Show help',
        requiresCount: false 
    },
};

/**
 * Find all commands that match the current sequence (for autocomplete)
 */
function findMatchingCommands(sequence) {
    const matches = [];
    for (const [cmd, def] of Object.entries(COMMANDS)) {
        if (cmd.startsWith(sequence)) {
            matches.push({ command: cmd, ...def });
        }
    }
    return matches;
}

/**
 * Parse sequence: extract count and command
 * Examples: "3n" -> {count: 3, cmd: "n"}, "dn" -> {count: 1, cmd: "dn"}
 */
function parseSequence(seq) {
    // Extract numeric prefix
    const match = seq.match(/^(\d+)?(.+)$/);
    if (!match) return { count: 1, command: seq };
    
    const count = match[1] ? parseInt(match[1], 10) : 1;
    const command = match[2];
    
    return { count, command };
}

/**
 * Execute a command with optional count
 */
function executeCommand(command, count = 1) {
    const cmd = COMMANDS[command];
    if (!cmd) {
        showNotification(`Unknown command: ${command}`, 'error');
        return false;
    }
    
    try {
        cmd.action(count);
        return true;
    } catch (error) {
        console.error('Error executing command:', error);
        showNotification(`Error: ${error.message}`, 'error');
        return false;
    }
}

/**
 * Reset sequence buffer and timeout
 */
function resetSequence() {
    sequenceBuffer = '';
    if (sequenceTimeout) {
        clearTimeout(sequenceTimeout);
        sequenceTimeout = null;
    }
    updateSequenceDisplay();
}

/**
 * Handle key press in hotkey mode
 */
function handleHotkeyKeydown(e) {
    // Always allow Escape to exit
    if (e.key === 'Escape') {
        e.preventDefault();
        deactivateHotkeyMode();
        return;
    }
    
    // Ignore modifier keys alone
    if (e.ctrlKey || e.altKey || e.metaKey) {
        // But allow Ctrl+K to toggle (if we want that feature)
        return;
    }
    
    // Ignore if typing in an input field (unless Escape)
    const activeElement = document.activeElement;
    if (activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA'
    )) {
        // Allow Escape to exit even from inputs
        if (e.key === 'Escape') {
            e.preventDefault();
            deactivateHotkeyMode();
        }
        return;
    }
    
    e.preventDefault();
    
    const key = e.key.toLowerCase();
    
    // Handle numeric keys for counts
    if (/^\d$/.test(key)) {
        sequenceBuffer += key;
        updateSequenceDisplay();
        resetSequenceTimeout();
        return;
    }
    
    // Add key to sequence
    sequenceBuffer += key;
    
    // Prevent infinite sequences
    if (sequenceBuffer.length > MAX_SEQUENCE_LENGTH) {
        showNotification('Sequence too long', 'error');
        resetSequence();
        return;
    }
    
    updateSequenceDisplay();
    
    // Parse sequence to extract count and command
    const parsed = parseSequence(sequenceBuffer);
    const exactMatch = COMMANDS[parsed.command];
    
    // Check for partial matches using the command part (without numeric prefix)
    // This allows sequences like "3c" to still check for "cn", "ce", "ces"
    const partialMatches = findMatchingCommands(parsed.command);
    
    // Filter out the exact match from partial matches to find longer sequences
    const longerMatches = partialMatches.filter(m => m.command.length > parsed.command.length);
    
    if (exactMatch) {
        // Exact match found - but check if there are longer sequences possible
        if (longerMatches.length > 0) {
            // There are longer sequences possible (e.g., 'c' matches, but 'cn', 'ce', 'ces' also match)
            // Wait for more input or timeout before executing
            resetSequenceTimeout();
        } else {
            // No longer sequences possible - execute immediately
            executeCommand(parsed.command, parsed.count);
            resetSequence();
            
            // Optionally exit hotkey mode after command
            // Uncomment if you want auto-exit:
            // deactivateHotkeyMode();
        }
    } else {
        // No exact match - check for partial matches
        if (partialMatches.length === 0) {
            // No matches - invalid sequence
            showNotification(`Unknown sequence: ${sequenceBuffer}`, 'error');
            resetSequence();
        } else {
            // Partial matches exist - wait for more input or timeout
            resetSequenceTimeout();
        }
    }
}

/**
 * Show partial matches for autocomplete (optional enhancement)
 */
function showPartialMatches(matches) {
    const matchesText = matches
        .slice(0, 5) // Limit to 5 matches
        .map(m => `${m.command} - ${m.description}`)
        .join(', ');
    
    updateSequenceDisplay(`Possible: ${matchesText}`);
}

/**
 * Reset sequence timeout
 */
function resetSequenceTimeout() {
    if (sequenceTimeout) {
        clearTimeout(sequenceTimeout);
    }
    
    sequenceTimeout = setTimeout(() => {
        // Timeout - check if we have a valid command
        const parsed = parseSequence(sequenceBuffer);
        const cmd = COMMANDS[parsed.command];
        
        if (cmd) {
            executeCommand(parsed.command, parsed.count);
        } else if (sequenceBuffer.length > 0) {
            showNotification(`Sequence timeout: ${sequenceBuffer}`, 'error');
        }
        
        resetSequence();
    }, SEQUENCE_TIMEOUT);
}

/**
 * Update visual display of current sequence
 */
function updateSequenceDisplay(overrideText = null) {
    const display = document.getElementById('hotkey-sequence-display');
    if (!display) return;
    
    const text = overrideText || sequenceBuffer || '';
    display.textContent = text ? `:${text}` : '';
    display.style.display = text ? 'block' : 'none';
}

/**
 * Show help overlay with all available commands
 */
function showHelpOverlay() {
    // Create or show help overlay
    let overlay = document.getElementById('hotkey-help-overlay');
    
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'hotkey-help-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            color: #0f0;
            padding: 24px;
            border-radius: 8px;
            z-index: 10000;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            font-family: 'Courier New', monospace;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            border: 2px solid #0f0;
        `;
        document.body.appendChild(overlay);
    }
    
    // Group commands by category
    const categories = {
        'Modes': ['n', 'e', 's'],
        'Node Operations': ['cn', 'dn', 'en'],
        'Edge Operations': ['ce', 'de', 'ee', 'ces'],
        'Display Options': ['ea'],
        'View Operations': ['fs', 'sv'],
        'Database Operations': ['md', 'ex'],
        'Layer Management': ['ml'],
        'Template Operations': ['nt'],
        'Settings': ['st'],
        'Navigation': ['f', 'l', 'w', 'c'],
        'Help': ['?']
    };
    
    let html = '<h3 style="margin-top: 0; color: #0f0; border-bottom: 1px solid #0f0; padding-bottom: 8px;">Hotkey Commands</h3>';
    html += '<p style="color: #aaa; margin-top: 8px;">Press <kbd style="background: #333; padding: 2px 6px; border-radius: 3px;">Esc</kbd> to exit hotkey mode</p><hr style="border-color: #333;">';
    
    for (const [category, commands] of Object.entries(categories)) {
        html += `<h4 style="color: #0f0; margin-top: 16px;">${category}</h4><ul style="list-style: none; padding-left: 0;">`;
        for (const cmd of commands) {
            const def = COMMANDS[cmd];
            if (def) {
                html += `<li style="margin: 8px 0;"><code style="background: #1a1a1a; padding: 4px 8px; border-radius: 3px; color: #0f0; font-size: 14px;">${cmd}</code> <span style="color: #aaa; margin-left: 12px;">- ${def.description}</span></li>`;
            }
        }
        html += '</ul>';
    }
    
    html += '<hr style="border-color: #333; margin-top: 20px;">';
    html += '<p style="color: #aaa; font-size: 12px;"><em>You can prefix commands with numbers, e.g., "3n" creates 3 nodes</em></p>';
    html += '<button onclick="document.getElementById(\'hotkey-help-overlay\').style.display=\'none\'" style="margin-top: 16px; padding: 8px 16px; background: #0f0; color: #000; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Close</button>';
    
    overlay.innerHTML = html;
    overlay.style.display = 'block';
    
    // Close on Escape
    const closeHandler = (e) => {
        if (e.key === 'Escape') {
            overlay.style.display = 'none';
            document.removeEventListener('keydown', closeHandler);
        }
    };
    document.addEventListener('keydown', closeHandler);
}

/**
 * Show notification (helper function)
 */
function showNotification(message, type = 'success') {
    if (window.showNotification) {
        // Map 'info' to 'success' since showNotification only supports 'success' and 'error'
        const mappedType = type === 'info' ? 'success' : type;
        window.showNotification(message, mappedType);
    } else {
        console.log(`[${type}] ${message}`);
    }
}

/**
 * Activate hotkey mode
 */
export function activateHotkeyMode() {
    if (hotkeyModeActive) return;
    
    // Close command palette if active (avoid circular dependency by checking window)
    if (window.closeCommandPalette) {
        window.closeCommandPalette();
    }
    
    hotkeyModeActive = true;
    resetSequence();
    updateUI();
    
    // Add global keydown listener with capture phase
    hotkeyModeListener = handleHotkeyKeydown;
    document.addEventListener('keydown', hotkeyModeListener, true);
    
    showNotification('Hotkey mode active - Type commands (press ? for help, Esc to exit)', 'success');
}

/**
 * Deactivate hotkey mode
 */
export function deactivateHotkeyMode() {
    if (!hotkeyModeActive) return;
    
    hotkeyModeActive = false;
    resetSequence();
    updateUI();
    
    if (hotkeyModeListener) {
        document.removeEventListener('keydown', hotkeyModeListener, true);
        hotkeyModeListener = null;
    }
    
    showNotification('Hotkey mode deactivated', 'success');
}

/**
 * Toggle hotkey mode
 */
export function toggleHotkeyMode() {
    if (hotkeyModeActive) {
        deactivateHotkeyMode();
    } else {
        activateHotkeyMode();
    }
}

/**
 * Update UI indicators
 */
function updateUI() {
    const button = document.getElementById('hotkey-mode-btn');
    if (button) {
        button.classList.toggle('active', hotkeyModeActive);
    }
    
    // Create or update sequence display
    let display = document.getElementById('hotkey-sequence-display');
    if (!display) {
        display = document.createElement('div');
        display.id = 'hotkey-sequence-display';
        display.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            color: #0f0;
            padding: 10px 20px;
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            font-size: 20px;
            font-weight: bold;
            z-index: 9999;
            display: none;
            pointer-events: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            border: 2px solid #0f0;
        `;
        document.body.appendChild(display);
    }
    
    if (!hotkeyModeActive) {
        display.style.display = 'none';
    }
}

/**
 * Check if hotkey mode is active
 */
export function isHotkeyModeActive() {
    return hotkeyModeActive;
}

/**
 * Get current sequence (for debugging)
 */
export function getCurrentSequence() {
    return sequenceBuffer;
}

/**
 * Export commands for use by other modules (e.g., command palette)
 */
export function getCommands() {
    return COMMANDS;
}

