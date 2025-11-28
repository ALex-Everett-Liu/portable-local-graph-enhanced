// Command Palette - Searchable command interface
import { getCommands } from './hotkeyManager.js';

let commandPaletteActive = false;
let commandPaletteElement = null;
let searchInput = null;
let resultsContainer = null;
let filteredCommands = [];
let selectedIndex = 0;
let keyboardListener = null;

/**
 * Initialize command palette UI
 */
function initializePalette() {
    if (commandPaletteElement) return;
    
    // Create palette overlay
    commandPaletteElement = document.createElement('div');
    commandPaletteElement.id = 'command-palette';
    commandPaletteElement.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 600px;
        max-width: 90vw;
        background: rgba(255, 255, 255, 0.98);
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        z-index: 10001;
        display: none;
        flex-direction: column;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
    `;
    
    // Create search input
    searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Type to search commands...';
    searchInput.style.cssText = `
        padding: 16px 20px;
        border: none;
        border-bottom: 2px solid #e0e0e0;
        font-size: 16px;
        outline: none;
        background: transparent;
    `;
    
    // Create results container
    resultsContainer = document.createElement('div');
    resultsContainer.id = 'command-palette-results';
    resultsContainer.style.cssText = `
        max-height: 400px;
        overflow-y: auto;
        padding: 8px 0;
    `;
    
    // Create footer with hint
    const footer = document.createElement('div');
    footer.style.cssText = `
        padding: 12px 20px;
        border-top: 1px solid #e0e0e0;
        font-size: 12px;
        color: #666;
        display: flex;
        justify-content: space-between;
    `;
    footer.innerHTML = `
        <span>↑↓ Navigate • Enter Execute • Esc Close</span>
        <span id="command-palette-count">0 commands</span>
    `;
    
    commandPaletteElement.appendChild(searchInput);
    commandPaletteElement.appendChild(resultsContainer);
    commandPaletteElement.appendChild(footer);
    document.body.appendChild(commandPaletteElement);
    
    // Setup search input event listeners
    searchInput.addEventListener('input', handleSearchInput);
    searchInput.addEventListener('keydown', handleSearchKeydown);
}

/**
 * Filter commands based on search query
 */
function filterCommands(query) {
    const commands = getCommands();
    const lowerQuery = query.toLowerCase().trim();
    
    if (!lowerQuery) {
        // Show all commands grouped by category when no query
        return Object.entries(commands).map(([key, cmd]) => ({
            key,
            ...cmd,
            category: getCommandCategory(key)
        }));
    }
    
    // Filter commands that match query
    const matches = [];
    for (const [key, cmd] of Object.entries(commands)) {
        const description = cmd.description.toLowerCase();
        const keyLower = key.toLowerCase();
        
        // Match by description or key
        if (description.includes(lowerQuery) || keyLower.includes(lowerQuery)) {
            matches.push({
                key,
                ...cmd,
                category: getCommandCategory(key),
                matchScore: calculateMatchScore(key, cmd.description, lowerQuery)
            });
        }
    }
    
    // Sort by match score (better matches first)
    matches.sort((a, b) => {
        if (a.matchScore !== b.matchScore) {
            return b.matchScore - a.matchScore;
        }
        // Then by key length (shorter keys first)
        return a.key.length - b.key.length;
    });
    
    return matches;
}

/**
 * Calculate match score for sorting
 */
function calculateMatchScore(key, description, query) {
    let score = 0;
    const keyLower = key.toLowerCase();
    const descLower = description.toLowerCase();
    
    // Exact key match gets highest score
    if (keyLower === query) {
        score += 100;
    }
    // Key starts with query
    else if (keyLower.startsWith(query)) {
        score += 50;
    }
    // Key contains query
    else if (keyLower.includes(query)) {
        score += 25;
    }
    
    // Description starts with query
    if (descLower.startsWith(query)) {
        score += 30;
    }
    // Description contains query
    else if (descLower.includes(query)) {
        score += 10;
    }
    
    return score;
}

/**
 * Get category for a command
 */
function getCommandCategory(key) {
    if (['n', 'e', 's'].includes(key)) return 'Modes';
    if (key.startsWith('c') && ['cn', 'ce', 'ces'].includes(key)) return 'Create';
    if (key.startsWith('d') && ['dn', 'de'].includes(key)) return 'Delete';
    if (key.startsWith('e') && ['en', 'ee'].includes(key)) return 'Edit';
    if (key === 'ea') return 'Display Options';
    if (['fs', 'sv'].includes(key)) return 'View Operations';
    if (['md', 'ex'].includes(key)) return 'Database Operations';
    if (['ca', 'cl'].includes(key)) return 'Graph Analysis';
    if (key === 'ml') return 'Layer Management';
    if (key === 'nt') return 'Template Operations';
    if (key === 'st') return 'Settings';
    if (['f', 'l', 'w', 'c'].includes(key)) return 'Navigation';
    if (key === '?') return 'Help';
    return 'Other';
}

/**
 * Render filtered commands
 */
function renderCommands(commands) {
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = '';
    filteredCommands = commands;
    selectedIndex = 0;
    
    if (commands.length === 0) {
        const noResults = document.createElement('div');
        noResults.style.cssText = `
            padding: 40px 20px;
            text-align: center;
            color: #999;
            font-size: 14px;
        `;
        noResults.textContent = 'No commands found';
        resultsContainer.appendChild(noResults);
        updateCount(0);
        return;
    }
    
    // Group by category if no search query
    const hasQuery = searchInput.value.trim().length > 0;
    let groupedCommands = commands;
    
    if (!hasQuery) {
        // Group by category
        const grouped = {};
        for (const cmd of commands) {
            const cat = cmd.category || 'Other';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(cmd);
        }
        groupedCommands = Object.entries(grouped).map(([category, cmds]) => ({
            isCategory: true,
            category,
            commands: cmds
        }));
    }
    
    // Render commands
    let itemIndex = 0;
    for (const item of groupedCommands) {
        if (item.isCategory) {
            // Render category header
            const categoryHeader = document.createElement('div');
            categoryHeader.style.cssText = `
                padding: 8px 20px;
                font-size: 12px;
                font-weight: 600;
                color: #666;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                background: #f5f5f5;
                margin-top: 8px;
            `;
            categoryHeader.textContent = item.category;
            resultsContainer.appendChild(categoryHeader);
            
            // Render commands in category
            for (const cmd of item.commands) {
                renderCommandItem(cmd, itemIndex++);
            }
        } else {
            // Render single command
            renderCommandItem(item, itemIndex++);
        }
    }
    
    updateCount(commands.length);
    updateSelection();
}

/**
 * Render a single command item
 */
function renderCommandItem(cmd, index) {
    const item = document.createElement('div');
    item.className = 'command-item';
    item.dataset.index = index;
    item.style.cssText = `
        padding: 12px 20px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-left: 3px solid transparent;
        transition: all 0.15s;
    `;
    
    item.innerHTML = `
        <div style="flex: 1;">
            <div style="font-weight: 500; color: #333; margin-bottom: 4px;">
                ${escapeHtml(cmd.description)}
            </div>
            <div style="font-size: 12px; color: #999; font-family: monospace;">
                ${escapeHtml(cmd.key)}
            </div>
        </div>
    `;
    
    // Click handler
    item.addEventListener('click', () => {
        executeCommand(cmd);
    });
    
    // Mouse hover
    item.addEventListener('mouseenter', () => {
        selectedIndex = index;
        updateSelection();
    });
    
    resultsContainer.appendChild(item);
}

/**
 * Update selected item visual state
 */
function updateSelection() {
    const items = resultsContainer.querySelectorAll('.command-item');
    items.forEach((item, index) => {
        if (index === selectedIndex) {
            item.style.background = '#e3f2fd';
            item.style.borderLeftColor = '#2196f3';
            // Scroll into view
            item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else {
            item.style.background = 'transparent';
            item.style.borderLeftColor = 'transparent';
        }
    });
}

/**
 * Update command count
 */
function updateCount(count) {
    const countElement = document.getElementById('command-palette-count');
    if (countElement) {
        countElement.textContent = `${count} command${count !== 1 ? 's' : ''}`;
    }
}

/**
 * Handle search input
 */
function handleSearchInput(e) {
    const query = e.target.value;
    const filtered = filterCommands(query);
    renderCommands(filtered);
}

/**
 * Handle keyboard navigation in search
 */
function handleSearchKeydown(e) {
    if (!commandPaletteActive) return;
    
    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            if (selectedIndex < filteredCommands.length - 1) {
                selectedIndex++;
                updateSelection();
            }
            break;
            
        case 'ArrowUp':
            e.preventDefault();
            if (selectedIndex > 0) {
                selectedIndex--;
                updateSelection();
            }
            break;
            
        case 'Enter':
            e.preventDefault();
            if (filteredCommands.length > 0 && selectedIndex >= 0 && selectedIndex < filteredCommands.length) {
                executeCommand(filteredCommands[selectedIndex]);
            }
            break;
            
        case 'Escape':
            e.preventDefault();
            closeCommandPalette();
            break;
    }
}

/**
 * Execute a command
 */
function executeCommand(cmd) {
    try {
        cmd.action();
        closeCommandPalette();
    } catch (error) {
        console.error('Error executing command:', error);
        showNotification(`Error executing command: ${error.message}`, 'error');
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Show notification helper
 */
function showNotification(message, type = 'success') {
    if (window.showNotification) {
        const mappedType = type === 'info' ? 'success' : type;
        window.showNotification(message, mappedType);
    } else {
        console.log(`[${type}] ${message}`);
    }
}

/**
 * Show command palette
 */
export function showCommandPalette() {
    if (commandPaletteActive) return;
    
    // Close hotkey mode if active (avoid circular dependency by checking window)
    if (window.deactivateHotkeyMode) {
        window.deactivateHotkeyMode();
    }
    
    initializePalette();
    commandPaletteActive = true;
    
    // Show palette
    commandPaletteElement.style.display = 'flex';
    
    // Focus search input
    searchInput.value = '';
    searchInput.focus();
    
    // Load all commands
    const allCommands = filterCommands('');
    renderCommands(allCommands);
    
    // Add keyboard listener for global shortcuts
    keyboardListener = (e) => {
        // Close on Escape (if not typing in input)
        if (e.key === 'Escape' && document.activeElement !== searchInput) {
            closeCommandPalette();
        }
    };
    document.addEventListener('keydown', keyboardListener, true);
    
    // Close on click outside
    const clickOutsideHandler = (e) => {
        if (commandPaletteElement && !commandPaletteElement.contains(e.target)) {
            closeCommandPalette();
            document.removeEventListener('click', clickOutsideHandler, true);
        }
    };
    // Use setTimeout to avoid immediate close when opening
    setTimeout(() => {
        document.addEventListener('click', clickOutsideHandler, true);
    }, 100);
}

/**
 * Close command palette
 */
export function closeCommandPalette() {
    if (!commandPaletteActive) return;
    
    commandPaletteActive = false;
    
    if (commandPaletteElement) {
        commandPaletteElement.style.display = 'none';
    }
    
    if (keyboardListener) {
        document.removeEventListener('keydown', keyboardListener, true);
        keyboardListener = null;
    }
    
    // Clear search
    if (searchInput) {
        searchInput.value = '';
    }
}

/**
 * Toggle command palette
 */
export function toggleCommandPalette() {
    if (commandPaletteActive) {
        closeCommandPalette();
    } else {
        showCommandPalette();
    }
}

/**
 * Check if command palette is active
 */
export function isCommandPaletteActive() {
    return commandPaletteActive;
}

