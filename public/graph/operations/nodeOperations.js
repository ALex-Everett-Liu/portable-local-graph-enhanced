/**
 * Node Operations Module
 * Handles all node-related operations: creation, deletion, selection, and queries
 */

import { GRAPH_CONSTANTS } from "../../utils/constants.js";
import { generateUUID } from "../../utils/uuid.js";
import { getScaledRadius } from "../../styles.js";

/**
 * Create a new node
 * @param {Array} nodes - Array of nodes
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {string} label - Node label
 * @param {string} color - Node color
 * @param {Function} onNodeCreate - Callback for node creation
 * @returns {Object} Created node
 */
export function addNode(nodes, x, y, label, color, onNodeCreate) {
  const node = {
    id: generateUUID(),
    x: x,
    y: y,
    label: label,
    color: color,
    radius: GRAPH_CONSTANTS.DEFAULT_NODE_RADIUS,
  };
  nodes.push(node);

  // Trigger callback for database persistence
  if (onNodeCreate) {
    onNodeCreate(node);
  }

  return node;
}

/**
 * Delete a node and all connected edges
 * @param {Array} nodes - Array of nodes
 * @param {Array} edges - Array of edges
 * @param {Object} node - Node to delete
 * @param {Function} onNodeDelete - Callback for node deletion
 */
export function deleteNode(nodes, edges, node, onNodeDelete) {
  nodes = nodes.filter((n) => n.id !== node.id);
  edges = edges.filter(
    (e) => e.from !== node.id && e.to !== node.id,
  );

  // Trigger callback for database persistence
  if (onNodeDelete) {
    onNodeDelete(node.id);
  }

  return { nodes, edges };
}

/**
 * Get the node at the given world coordinates
 * @param {Array} nodes - Array of nodes
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {number} scale - Current scale
 * @returns {Object|null} Node at position or null
 */
export function getNodeAt(nodes, x, y, scale) {
  let closestNode = null;
  let minDistance = Infinity;
  const hitRadiusPadding = 3; // Extra pixels for easier clicking

  // Check nodes in reverse order (topmost first, since nodes render last)
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    const dx = x - node.x;
    const dy = y - node.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const hitRadius =
      getScaledRadius(node.radius, scale) + hitRadiusPadding;

    if (distance <= hitRadius && distance < minDistance) {
      minDistance = distance;
      closestNode = node;
    }
  }

  return closestNode;
}

/**
 * Get all nodes at the given position (for overlap detection)
 * @param {Array} nodes - Array of nodes
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {number} scale - Current scale
 * @returns {Array} Array of nodes sorted by distance (closest first)
 */
export function getNodesAt(nodes, x, y, scale) {
  const candidates = [];
  const hitRadiusPadding = 3;

  for (const node of nodes) {
    const dx = x - node.x;
    const dy = y - node.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const hitRadius =
      getScaledRadius(node.radius, scale) + hitRadiusPadding;

    if (distance <= hitRadius) {
      candidates.push({ node, distance });
    }
  }

  // Sort by distance (closest first)
  candidates.sort((a, b) => a.distance - b.distance);
  return candidates.map((c) => c.node);
}

