/**
 * Graph Utility Functions
 * Helper functions for tooltip, HTML escaping, and coordinate transformations
 */

import { screenToWorld } from "../../utils/geometry.js";

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
export function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Update tooltip content with node information
 * @param {HTMLElement} tooltip - Tooltip DOM element
 * @param {Object} node - Node object
 * @param {number} x - Mouse X position (screen coordinates)
 * @param {number} y - Mouse Y position (screen coordinates)
 */
export function updateTooltip(tooltip, node, x, y) {
  const parts = [];
  
  // English label (always show)
  parts.push(`<div><strong>${escapeHtml(node.label || "Unnamed Node")}</strong></div>`);
  
  // Chinese label (if exists)
  if (node.chineseLabel) {
    parts.push(`<div style="margin-top: 4px; color: rgba(255,255,255,0.9);">中文: ${escapeHtml(node.chineseLabel)}</div>`);
  }
  
  // Category (if exists)
  if (node.category) {
    parts.push(`<div style="margin-top: 4px; color: rgba(255,255,255,0.85);">Category: ${escapeHtml(node.category)}</div>`);
  }
  
  // Layers (if exists)
  const layers = node.layers && Array.isArray(node.layers) && node.layers.length > 0
    ? node.layers.join(", ")
    : (typeof node.layers === "string" && node.layers.trim() ? node.layers : null);
  
  if (layers) {
    parts.push(`<div style="margin-top: 4px; color: rgba(255,255,255,0.85);">Layers: ${escapeHtml(layers)}</div>`);
  }
  
  tooltip.innerHTML = parts.join("");
  tooltip.style.display = "block";
  tooltip.style.left = x + 10 + "px";
  tooltip.style.top = y + 10 + "px";
}

/**
 * Get mouse position in world coordinates
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {MouseEvent} e - Mouse event
 * @param {Object} offset - Current offset {x, y}
 * @param {number} scale - Current scale
 * @returns {Object} World coordinates {x, y}
 */
export function getMousePos(canvas, e, offset, scale) {
  const rect = canvas.getBoundingClientRect();
  const screenX = e.clientX - rect.left;
  const screenY = e.clientY - rect.top;
  // Use geometry utility for proper coordinate transformation
  const worldPos = screenToWorld(
    screenX,
    screenY,
    offset.x,
    offset.y,
    scale,
  );
  return worldPos;
}

