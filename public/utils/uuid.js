/**
 * UUID utility for generating UUIDv7 identifiers
 * Uses local uuid package v10+ from node_modules (works offline)
 * Electron with nodeIntegration: true allows direct require() access
 */

let uuidv7Function = null;

// Use Node.js require to access local uuid package (works offline)
if (typeof require !== 'undefined') {
    try {
        const uuid = require('uuid');
        uuidv7Function = uuid.v7;
    } catch (error) {
        console.error('Failed to load uuid package from node_modules:', error);
        // Fallback to crypto.randomUUID() (v4) if require fails
        uuidv7Function = () => crypto.randomUUID();
    }
} else {
    // Fallback if require is not available (shouldn't happen in Electron)
    console.warn('require() not available, falling back to crypto.randomUUID() (v4)');
    uuidv7Function = () => crypto.randomUUID();
}

// Export function that generates UUIDv7
export function generateUUID() {
    return uuidv7Function();
}

// Export default
export default generateUUID;

