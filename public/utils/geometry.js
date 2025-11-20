/**
 * Geometry utility functions for graph rendering
 */

/**
 * Calculate grid bounds for visible area
 * @param {number} left - Left boundary
 * @param {number} top - Top boundary
 * @param {number} right - Right boundary
 * @param {number} bottom - Bottom boundary
 * @param {number} gridSize - Grid cell size
 * @returns {{startX: number, endX: number, startY: number, endY: number}} Grid bounds
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
 * @param {number} offsetX - X offset
 * @param {number} offsetY - Y offset
 * @param {number} scale - Zoom scale
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @returns {{left: number, top: number, right: number, bottom: number}} Visible bounds
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
 * @param {number} screenX - Screen X coordinate
 * @param {number} screenY - Screen Y coordinate
 * @param {number} offsetX - X offset
 * @param {number} offsetY - Y offset
 * @param {number} scale - Zoom scale
 * @returns {{x: number, y: number}} World coordinates
 */
export function screenToWorld(screenX, screenY, offsetX, offsetY, scale) {
    return {
        x: (screenX - offsetX) / scale,
        y: (screenY - offsetY) / scale
    };
}

/**
 * Convert world coordinates to screen coordinates
 * @param {number} worldX - World X coordinate
 * @param {number} worldY - World Y coordinate
 * @param {number} offsetX - X offset
 * @param {number} offsetY - Y offset
 * @param {number} scale - Zoom scale
 * @returns {{x: number, y: number}} Screen coordinates
 */
export function worldToScreen(worldX, worldY, offsetX, offsetY, scale) {
    return {
        x: worldX * scale + offsetX,
        y: worldY * scale + offsetY
    };
}

