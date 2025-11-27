/**
 * Visual style calculations for graph rendering
 */
import { GRAPH_CONSTANTS, WEIGHT_MAPPING } from './constants.js';
import { clamp } from './algorithms.js';

/**
 * Calculate edge line width based on weight (inverted correlation)
 */
export function getEdgeLineWidth(weight) {
  const clampedWeight = Math.max(WEIGHT_MAPPING.MIN_WEIGHT, Math.min(WEIGHT_MAPPING.MAX_WEIGHT, weight));
  const logWeight = WEIGHT_MAPPING.LOG_BASE(clampedWeight + 0.1) + WEIGHT_MAPPING.LOG_OFFSET;
  const normalized = Math.max(0, Math.min(1, (logWeight - WEIGHT_MAPPING.MIN_LOG_WEIGHT) / (WEIGHT_MAPPING.MAX_LOG_WEIGHT - WEIGHT_MAPPING.MIN_LOG_WEIGHT)));
  const invertedNormalized = 1 - normalized;
  const baseWidth = 0.63 + invertedNormalized * 9.4;
  return Math.max(0.63, Math.min(10, baseWidth));
}

/**
 * Calculate node radius based on zoom scale
 */
export function getScaledRadius(baseRadius, scale) {
  return baseRadius / scale;
}

/**
 * Calculate line width adjusted for zoom scale
 */
export function getScaledLineWidth(baseWidth, scale) {
  return Math.max(0.5, baseWidth / scale);
}

/**
 * Calculate text size adjusted for zoom scale
 */
export function getScaledTextSize(baseSize, scale) {
  return Math.max(8, baseSize / scale);
}

/**
 * Generate gradient for highlighted nodes
 */
export function createHighlightGradient(ctx, x, y, innerRadius, outerRadius) {
  const gradient = ctx.createRadialGradient(
    x, y, innerRadius,
    x, y, outerRadius
  );
  gradient.addColorStop(0, "rgba(255, 215, 0, 0.8)");
  gradient.addColorStop(0.4, "rgba(255, 215, 0, 0.4)");
  gradient.addColorStop(0.7, "rgba(255, 215, 0, 0.2)");
  gradient.addColorStop(1, "rgba(255, 215, 0, 0)");
  return gradient;
}

/**
 * Calculate pulsing radius for animated nodes
 */
export function getPulsingRadius(baseRadius, time) {
  const pulseScale = 1 + GRAPH_CONSTANTS.PULSE_AMPLITUDE * Math.sin(time * GRAPH_CONSTANTS.PULSE_FREQUENCY);
  return baseRadius * pulseScale;
}

/**
 * Truncate text to fit within maximum length
 */
export function truncateText(text, maxLength = GRAPH_CONSTANTS.MAX_LABEL_LENGTH) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

/**
 * Calculate text background dimensions
 */
export function getTextDimensions(ctx, text, fontSize) {
  const metrics = ctx.measureText(text);
  return {
    width: metrics.width,
    height: fontSize,
  };
}

/**
 * Determine if text background is needed
 */
export function needsTextBackground(textWidth, nodeRadius, threshold = 1.5) {
  return textWidth > nodeRadius * threshold;
}

/**
 * Get node color based on selection state
 */
export function getNodeColor(node, isSelected, isHighlighted) {
  if (isHighlighted) return node.color;
  if (isSelected) return GRAPH_CONSTANTS.SELECTED_NODE_COLOR;
  return node.color;
}

/**
 * Get node border color based on selection state
 */
export function getNodeBorderColor(node, isSelected, isHighlighted) {
  if (isHighlighted) return GRAPH_CONSTANTS.HIGHLIGHT_NODE_COLOR;
  if (isSelected) return GRAPH_CONSTANTS.SELECTED_NODE_BORDER;
  return GRAPH_CONSTANTS.DEFAULT_NODE_BORDER;
}

/**
 * Calculate appropriate font size for canvas
 */
export function getFontString(baseSize, scale, fontFamily = null) {
  const size = Math.max(8, baseSize / scale);
  const family = fontFamily || GRAPH_CONSTANTS.DEFAULT_FONT_FAMILY;
  return `${size}px ${family}`;
}

