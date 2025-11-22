/**
 * UUID utility for generating UUIDv7 identifiers
 * Uses uuid package v10+ which supports UUIDv7
 */

let uuidv7Function = null;

// Preload UUID v7 module immediately
import('https://esm.sh/uuid@10.0.0')
    .then((uuidModule) => {
        uuidv7Function = uuidModule.v7;
    })
    .catch((error) => {
        console.error('Failed to load UUID v7 from CDN:', error);
        // Fallback to crypto.randomUUID() (v4)
        uuidv7Function = () => crypto.randomUUID();
    });

// Synchronous wrapper that uses cached function or falls back
export function generateUUID() {
    if (uuidv7Function) {
        return uuidv7Function();
    }
    // Fallback while loading (will use v4 temporarily)
    return crypto.randomUUID();
}

// Export default
export default generateUUID;

