/**
 * Mouse Handlers Module
 * Handles all mouse interactions: clicks, drags, panning, tooltips
 */

import { getNodeAt, getNodesAt } from "../operations/nodeOperations.js";
import { getEdgeAt, getEdgesAt } from "../operations/edgeOperations.js";
import { addNode } from "../operations/nodeOperations.js";
import { addEdge } from "../operations/edgeOperations.js";
import { getMousePos, updateTooltip } from "../utils/graphUtils.js";
import { GRAPH_CONSTANTS } from "../../utils/constants.js";

/**
 * Create mouse handlers bound to a graph instance
 * @param {Object} graph - Graph instance
 * @returns {Object} Object with handler functions
 */
export function createMouseHandlers(graph) {
  return {
    handleMouseDown: (e) => {
      if (e.button !== 0) return; // Only handle left mouse button

      const pos = getMousePos(graph.canvas, e, graph.offset, graph.scale);
      const now = Date.now();

      // Check if this is a repeat click at same location (for cycling)
      const isRepeatClick =
        graph.lastClickPos &&
        Math.abs(pos.x - graph.lastClickPos.x) < graph.clickPositionThreshold &&
        Math.abs(pos.y - graph.lastClickPos.y) < graph.clickPositionThreshold &&
        now - graph.lastClickTime < graph.clickTimeThreshold;

      if (window.appMode === "select") {
        // Check for modifier keys (Alt or Ctrl) - allows edge selection even when nodes overlap
        const modifierPressed = e.altKey || e.ctrlKey || e.metaKey;

        // Handle cycling through overlapping elements
        if (isRepeatClick && graph.overlapCandidates.length > 1) {
          // Cycle to next candidate
          graph.overlapIndex =
            (graph.overlapIndex + 1) % graph.overlapCandidates.length;
          const selected = graph.overlapCandidates[graph.overlapIndex];

          graph.selectedNode = selected.type === "node" ? selected.item : null;
          graph.selectedEdge = selected.type === "edge" ? selected.item : null;

          // Show visual feedback
          if (window.showNotification) {
            const label =
              selected.type === "node"
                ? selected.item.label || "Unnamed Node"
                : `Edge (${selected.item.weight || 1})`;
            window.showNotification(
              `${graph.overlapIndex + 1} of ${graph.overlapCandidates.length}: ${label}`,
              "success",
            );
          }

          // Trigger selection change callback
          if (graph.onSelectionChange) {
            graph.onSelectionChange();
          }

          graph.render();
          return;
        }

        // New click - find all candidates
        const nodes = getNodesAt(graph.nodes, pos.x, pos.y, graph.scale);
        // Check edges if modifier pressed OR if no nodes found (standard behavior)
        const edges =
          modifierPressed || nodes.length === 0
            ? getEdgesAt(graph.edges, graph.nodes, pos.x, pos.y)
            : [];

        // Build candidates list: nodes first (priority), then edges
        graph.overlapCandidates = [
          ...nodes.map((n) => ({ type: "node", item: n })),
          ...edges.map((e) => ({ type: "edge", item: e })),
        ];

        graph.overlapIndex = 0;
        graph.lastClickPos = pos;
        graph.lastClickTime = now;

        // Select first candidate
        if (graph.overlapCandidates.length > 0) {
          const selected = graph.overlapCandidates[0];
          graph.selectedNode = selected.type === "node" ? selected.item : null;
          graph.selectedEdge = selected.type === "edge" ? selected.item : null;

          // Show visual feedback if multiple candidates
          if (graph.overlapCandidates.length > 1 && window.showNotification) {
            const label =
              selected.type === "node"
                ? selected.item.label || "Unnamed Node"
                : `Edge (${selected.item.weight || 1})`;
            window.showNotification(
              `1 of ${graph.overlapCandidates.length}: ${label}. Click again to cycle.`,
              "success",
            );
          }

          // Trigger selection change callback
          if (graph.onSelectionChange) {
            graph.onSelectionChange();
          }

          // Start dragging if node selected
          if (graph.selectedNode) {
            graph.isDragging = true;
            graph.dragOffset.x = pos.x - graph.selectedNode.x;
            graph.dragOffset.y = pos.y - graph.selectedNode.y;
            // Store original position to detect if node actually moved
            graph.dragStartPosition = {
              x: graph.selectedNode.x,
              y: graph.selectedNode.y
            };
          }
        } else {
          // Clicked empty space - start panning
          graph.selectedNode = null;
          graph.selectedEdge = null;
          graph.overlapCandidates = [];
          graph.isPanning = true;
          graph.lastPanPoint = { x: e.clientX, y: e.clientY };

          // Trigger selection change callback
          if (graph.onSelectionChange) {
            graph.onSelectionChange();
          }
        }
      } else if (window.appMode === "node") {
        const node = getNodeAt(graph.nodes, pos.x, pos.y, graph.scale);
        if (!node) {
          addNode(
            graph.nodes,
            pos.x,
            pos.y,
            "Node",
            GRAPH_CONSTANTS.DEFAULT_NODE_COLOR,
            graph.callbacks.onNodeCreate
          );
          graph.render();
        }
      } else if (window.appMode === "edge") {
        const node = getNodeAt(graph.nodes, pos.x, pos.y, graph.scale);
        if (node) {
          if (!graph.tempEdgeStart) {
            graph.tempEdgeStart = node;
          } else {
            if (graph.tempEdgeStart !== node) {
              addEdge(
                graph.edges,
                graph.tempEdgeStart,
                node,
                1,
                graph.callbacks.onEdgeCreate
              );
              graph.render();
            }
            graph.tempEdgeStart = null;
          }
        }
      }

      graph.render();
    },

    handleMouseMove: (e) => {
      const pos = getMousePos(graph.canvas, e, graph.offset, graph.scale);

      if (graph.isDragging && graph.selectedNode) {
        // Drag node
        graph.selectedNode.x = pos.x - graph.dragOffset.x;
        graph.selectedNode.y = pos.y - graph.dragOffset.y;
        graph.render();
      } else if (graph.isPanning) {
        // Pan canvas
        const dx = e.clientX - graph.lastPanPoint.x;
        const dy = e.clientY - graph.lastPanPoint.y;
        graph.offset.x += dx;
        graph.offset.y += dy;
        graph.lastPanPoint = { x: e.clientX, y: e.clientY };
        graph.render();
      } else {
        // Show tooltip for node under cursor
        const node = getNodeAt(graph.nodes, pos.x, pos.y, graph.scale);
        if (node && node.label) {
          updateTooltip(graph.tooltip, node, e.clientX, e.clientY);
        } else {
          graph.tooltip.style.display = "none";
        }
      }
    },

    handleMouseUp: (e) => {
      if (graph.isDragging && graph.selectedNode) {
        // Only trigger callback if node actually moved
        if (graph.dragStartPosition) {
          const moved = 
            Math.abs(graph.selectedNode.x - graph.dragStartPosition.x) > 0.01 ||
            Math.abs(graph.selectedNode.y - graph.dragStartPosition.y) > 0.01;
          
          if (moved && graph.callbacks.onNodeUpdate) {
            graph.callbacks.onNodeUpdate(graph.selectedNode);
          }
        }
        graph.dragStartPosition = null;
      }
      graph.isDragging = false;
      graph.isPanning = false;
    },

    handleWheel: (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      graph.scale *= delta;
      graph.scale = Math.max(
        GRAPH_CONSTANTS.MIN_SCALE,
        Math.min(GRAPH_CONSTANTS.MAX_SCALE, graph.scale),
      );
      graph.render();
    },

    handleRightClick: (e) => {
      e.preventDefault();
      const pos = getMousePos(graph.canvas, e, graph.offset, graph.scale);

      const node = getNodeAt(graph.nodes, pos.x, pos.y, graph.scale);
      const edge = getEdgeAt(graph.edges, graph.nodes, pos.x, pos.y);

      if (node || edge) {
        graph.selectedNode = node;
        graph.selectedEdge = edge;

        // Trigger selection change callback
        if (graph.onSelectionChange) {
          graph.onSelectionChange();
        }

        graph.render();

        // Show dialog directly instead of context menu
        if (node && window.showNodeDialog) {
          window.showNodeDialog(node);
        } else if (edge && window.showEdgeDialog) {
          window.showEdgeDialog(edge);
        } else if (window.showContextMenu) {
          // Fallback to context menu if dialogs aren't available
          window.showContextMenu(e.clientX, e.clientY);
        }
      }
    }
  };
}

