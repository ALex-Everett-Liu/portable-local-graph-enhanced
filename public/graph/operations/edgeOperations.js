/**
 * Edge Operations Module
 * Handles all edge-related operations: creation, deletion, selection, and queries
 */

import { generateUUID } from "../../utils/uuid.js";

/**
 * Create a new edge
 * @param {Array} edges - Array of edges
 * @param {Object} fromNode - Source node
 * @param {Object} toNode - Target node
 * @param {number} weight - Edge weight
 * @param {Function} onEdgeCreate - Callback for edge creation
 * @returns {Object} Created edge
 */
export function addEdge(edges, fromNode, toNode, weight, onEdgeCreate) {
  const edge = {
    id: generateUUID(),
    from: fromNode.id,
    to: toNode.id,
    weight: weight,
  };
  edges.push(edge);

  // Trigger callback for database persistence
  if (onEdgeCreate) {
    onEdgeCreate(edge);
  }

  return edge;
}

/**
 * Delete an edge
 * @param {Array} edges - Array of edges
 * @param {Object} edge - Edge to delete
 * @param {Function} onEdgeDelete - Callback for edge deletion
 * @returns {Array} Updated edges array
 */
export function deleteEdge(edges, edge, onEdgeDelete) {
  edges = edges.filter((e) => e.id !== edge.id);

  // Trigger callback for database persistence
  if (onEdgeDelete) {
    onEdgeDelete(edge.id);
  }

  return edges;
}

/**
 * Check if a point is on a line segment
 * @param {number} px - Point X coordinate
 * @param {number} py - Point Y coordinate
 * @param {number} x1 - Line start X
 * @param {number} y1 - Line start Y
 * @param {number} x2 - Line end X
 * @param {number} y2 - Line end Y
 * @param {number} threshold - Distance threshold in pixels
 * @returns {boolean} True if point is on line
 */
export function isPointOnLine(px, py, x1, y1, x2, y2, threshold) {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;

  if (lenSq === 0) return Math.sqrt(A * A + B * B) <= threshold;

  let param = dot / lenSq;
  param = Math.max(0, Math.min(1, param));

  const xx = x1 + param * C;
  const yy = y1 + param * D;
  const dx = px - xx;
  const dy = py - yy;

  return Math.sqrt(dx * dx + dy * dy) <= threshold;
}

/**
 * Get the edge at the given world coordinates
 * @param {Array} edges - Array of edges
 * @param {Array} nodes - Array of nodes
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @returns {Object|null} Edge at position or null
 */
export function getEdgeAt(edges, nodes, x, y) {
  const threshold = 8; // pixels for edge hit detection
  for (let edge of edges) {
    const fromNode = nodes.find((n) => n.id === edge.from);
    const toNode = nodes.find((n) => n.id === edge.to);
    if (
      fromNode &&
      toNode &&
      isPointOnLine(
        x,
        y,
        fromNode.x,
        fromNode.y,
        toNode.x,
        toNode.y,
        threshold,
      )
    ) {
      return edge;
    }
  }
  return null;
}

/**
 * Get all edges at the given position (for overlap detection)
 * @param {Array} edges - Array of edges
 * @param {Array} nodes - Array of nodes
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @returns {Array} Array of edges at the position
 */
export function getEdgesAt(edges, nodes, x, y) {
  const candidates = [];
  const threshold = 8; // pixels for edge hit detection

  for (let edge of edges) {
    const fromNode = nodes.find((n) => n.id === edge.from);
    const toNode = nodes.find((n) => n.id === edge.to);
    if (
      fromNode &&
      toNode &&
      isPointOnLine(
        x,
        y,
        fromNode.x,
        fromNode.y,
        toNode.x,
        toNode.y,
        threshold,
      )
    ) {
      candidates.push(edge);
    }
  }

  return candidates;
}

