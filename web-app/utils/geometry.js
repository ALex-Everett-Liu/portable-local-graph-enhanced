/**
 * Geometry utility functions for graph rendering
 */

/**
 * Calculate grid bounds for visible area
 */
export function calculateGridBounds(left, top, right, bottom, gridSize) {
    return {
        startX: Math.floor(left / gridSize) * gridSize,
        endX: Math.ceil(right / gridSize) * gridSize,
        startY: Math.floor(top / gridSize) * gridSize,
        endY: Math.ceil(bottom / gridSize) * gridSize
    };
}

/**
 * Get visible bounds in world coordinates
 */
export function getVisibleBounds(offsetX, offsetY, scale, canvasWidth, canvasHeight) {
    return {
        left: -offsetX / scale,
        top: -offsetY / scale,
        right: (-offsetX + canvasWidth) / scale,
        bottom: (-offsetY + canvasHeight) / scale
    };
}

/**
 * Convert screen coordinates to world coordinates
 */
export function screenToWorld(screenX, screenY, offsetX, offsetY, scale) {
    return {
        x: (screenX - offsetX) / scale,
        y: (screenY - offsetY) / scale
    };
}

/**
 * Convert world coordinates to screen coordinates
 */
export function worldToScreen(worldX, worldY, offsetX, offsetY, scale) {
    return {
        x: worldX * scale + offsetX,
        y: worldY * scale + offsetY
    };
}

