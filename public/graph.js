import { GraphRenderer } from "./graph-renderer.js";
import { getScaledRadius } from "./styles.js";
import { screenToWorld } from "./utils/geometry.js";
import { GRAPH_CONSTANTS } from "./utils/constants.js";
import { generateUUID } from "./utils/uuid.js";

class Graph {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.nodes = [];
    this.edges = [];
    this.selectedNode = null;
    this.selectedEdge = null;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.scale = 1;
    this.offset = { x: 0, y: 0 };
    this.isPanning = false;
    this.lastPanPoint = { x: 0, y: 0 };
    this.highlightedNodes = []; // For search highlighting

    // Layer management state
    this.activeLayers = new Set();
    this.layerFilterMode = "include"; // 'include' or 'exclude'

    // Overlap cycling state for smart selection
    this.overlapCandidates = [];
    this.overlapIndex = 0;
    this.lastClickPos = null;
    this.lastClickTime = 0;
    this.clickTimeThreshold = 1500; // ms
    this.clickPositionThreshold = 5; // pixels

    // Callbacks for database persistence and UI updates
    this.callbacks = callbacks;
    this.onSelectionChange = callbacks.onSelectionChange || null;

    // Initialize GraphRenderer - handles ALL rendering
    this.renderer = new GraphRenderer(canvas);

    this.setupCanvas();
    this.bindEvents();
  }

  setupCanvas() {
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
  }

  resizeCanvas() {
    const container = this.canvas.parentElement;
    let width, height;
    if (container) {
      width = container.clientWidth;
      height = container.clientHeight;
    } else {
      width = this.canvas.offsetWidth || 800;
      height = this.canvas.offsetHeight || 600;
    }
    this.canvas.width = width;
    this.canvas.height = height;
    // Notify renderer of resize
    this.renderer.resize(width, height);
    this.render();
  }

  bindEvents() {
    this.canvas.addEventListener("mousedown", (e) => this.handleMouseDown(e));
    this.canvas.addEventListener("mousemove", (e) => this.handleMouseMove(e));
    this.canvas.addEventListener("mouseup", (e) => this.handleMouseUp(e));
    this.canvas.addEventListener("wheel", (e) => this.handleWheel(e));
    this.canvas.addEventListener("contextmenu", (e) =>
      this.handleRightClick(e),
    );

    // Add tooltip element
    this.tooltip = document.createElement("div");
    this.tooltip.className = "graph-tooltip";
    this.tooltip.style.cssText =
      "position: absolute; display: none; background: rgba(0,0,0,0.8); color: white; padding: 8px 12px; border-radius: 4px; pointer-events: none; z-index: 1000; max-width: 300px; word-wrap: break-word;";
    document.body.appendChild(this.tooltip);
  }

  addNode(x, y, label = "Node", color = GRAPH_CONSTANTS.DEFAULT_NODE_COLOR) {
    const node = {
      id: generateUUID(),
      x: x,
      y: y,
      label: label,
      color: color,
      radius: GRAPH_CONSTANTS.DEFAULT_NODE_RADIUS,
    };
    this.nodes.push(node);
    this.render();

    // Trigger callback for database persistence
    if (this.callbacks.onNodeCreate) {
      this.callbacks.onNodeCreate(node);
    }

    return node;
  }

  addEdge(fromNode, toNode, weight = 1) {
    const edge = {
      id: generateUUID(),
      from: fromNode.id,
      to: toNode.id,
      weight: weight,
    };
    this.edges.push(edge);
    this.render();

    // Trigger callback for database persistence
    if (this.callbacks.onEdgeCreate) {
      this.callbacks.onEdgeCreate(edge);
    }

    return edge;
  }

  getMousePos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    // Use geometry utility for proper coordinate transformation
    const worldPos = screenToWorld(
      screenX,
      screenY,
      this.offset.x,
      this.offset.y,
      this.scale,
    );
    return worldPos;
  }

  getNodeAt(x, y) {
    // Select closest node (distance-based priority)
    let closestNode = null;
    let minDistance = Infinity;
    const hitRadiusPadding = 3; // Extra pixels for easier clicking

    // Check nodes in reverse order (topmost first, since nodes render last)
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i];
      const dx = x - node.x;
      const dy = y - node.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const hitRadius =
        getScaledRadius(node.radius, this.scale) + hitRadiusPadding;

      if (distance <= hitRadius && distance < minDistance) {
        minDistance = distance;
        closestNode = node;
      }
    }

    return closestNode;
  }

  /**
   * Get all nodes at the given position (for overlap detection)
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @returns {Array} Array of nodes sorted by distance (closest first)
   */
  getNodesAt(x, y) {
    const candidates = [];
    const hitRadiusPadding = 3;

    for (const node of this.nodes) {
      const dx = x - node.x;
      const dy = y - node.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const hitRadius =
        getScaledRadius(node.radius, this.scale) + hitRadiusPadding;

      if (distance <= hitRadius) {
        candidates.push({ node, distance });
      }
    }

    // Sort by distance (closest first)
    candidates.sort((a, b) => a.distance - b.distance);
    return candidates.map((c) => c.node);
  }

  getEdgeAt(x, y) {
    const threshold = 8; // pixels for edge hit detection
    for (let edge of this.edges) {
      const fromNode = this.nodes.find((n) => n.id === edge.from);
      const toNode = this.nodes.find((n) => n.id === edge.to);
      if (
        fromNode &&
        toNode &&
        this.isPointOnLine(
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
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @returns {Array} Array of edges at the position
   */
  getEdgesAt(x, y) {
    const candidates = [];
    const threshold = 8; // pixels for edge hit detection

    for (let edge of this.edges) {
      const fromNode = this.nodes.find((n) => n.id === edge.from);
      const toNode = this.nodes.find((n) => n.id === edge.to);
      if (
        fromNode &&
        toNode &&
        this.isPointOnLine(
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

  isPointOnLine(px, py, x1, y1, x2, y2, threshold) {
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

  deleteNode(node) {
    this.nodes = this.nodes.filter((n) => n.id !== node.id);
    this.edges = this.edges.filter(
      (e) => e.from !== node.id && e.to !== node.id,
    );
    this.render();

    // Trigger callback for database persistence
    if (this.callbacks.onNodeDelete) {
      this.callbacks.onNodeDelete(node.id);
    }
  }

  deleteEdge(edge) {
    this.edges = this.edges.filter((e) => e.id !== edge.id);
    this.render();

    // Trigger callback for database persistence
    if (this.callbacks.onEdgeDelete) {
      this.callbacks.onEdgeDelete(edge.id);
    }
  }

  render() {
    const viewState = {
      scale: this.scale,
      offset: this.offset,
    };

    const selectionState = {
      selectedNode: this.selectedNode,
      selectedEdge: this.selectedEdge,
      highlightedNodes: this.highlightedNodes || [],
    };

    const filterState = {
      layerFilterEnabled: this.activeLayers.size > 0,
      activeLayers: this.activeLayers,
      layerFilterMode: this.layerFilterMode,
    };

    // Use GraphRenderer for all rendering
    this.renderer.render(
      this.nodes,
      this.edges,
      viewState,
      selectionState,
      filterState,
    );
  }

  handleMouseDown(e) {
    if (e.button !== 0) return; // Only handle left mouse button

    const pos = this.getMousePos(e);
    const now = Date.now();

    // Check if this is a repeat click at same location (for cycling)
    const isRepeatClick =
      this.lastClickPos &&
      Math.abs(pos.x - this.lastClickPos.x) < this.clickPositionThreshold &&
      Math.abs(pos.y - this.lastClickPos.y) < this.clickPositionThreshold &&
      now - this.lastClickTime < this.clickTimeThreshold;

    if (window.appMode === "select") {
      // Check for modifier keys (Alt or Ctrl) - allows edge selection even when nodes overlap
      const modifierPressed = e.altKey || e.ctrlKey || e.metaKey;

      // Handle cycling through overlapping elements
      if (isRepeatClick && this.overlapCandidates.length > 1) {
        // Cycle to next candidate
        this.overlapIndex =
          (this.overlapIndex + 1) % this.overlapCandidates.length;
        const selected = this.overlapCandidates[this.overlapIndex];

        this.selectedNode = selected.type === "node" ? selected.item : null;
        this.selectedEdge = selected.type === "edge" ? selected.item : null;

        // Show visual feedback
        if (window.showNotification) {
          const label =
            selected.type === "node"
              ? selected.item.label || "Unnamed Node"
              : `Edge (${selected.item.weight || 1})`;
          window.showNotification(
            `${this.overlapIndex + 1} of ${this.overlapCandidates.length}: ${label}`,
            "success",
          );
        }

        // Trigger selection change callback
        if (this.onSelectionChange) {
          this.onSelectionChange();
        }

        this.render();
        return;
      }

      // New click - find all candidates
      const nodes = this.getNodesAt(pos.x, pos.y);
      // Check edges if modifier pressed OR if no nodes found (standard behavior)
      const edges =
        modifierPressed || nodes.length === 0
          ? this.getEdgesAt(pos.x, pos.y)
          : [];

      // Build candidates list: nodes first (priority), then edges
      this.overlapCandidates = [
        ...nodes.map((n) => ({ type: "node", item: n })),
        ...edges.map((e) => ({ type: "edge", item: e })),
      ];

      this.overlapIndex = 0;
      this.lastClickPos = pos;
      this.lastClickTime = now;

      // Select first candidate
      if (this.overlapCandidates.length > 0) {
        const selected = this.overlapCandidates[0];
        this.selectedNode = selected.type === "node" ? selected.item : null;
        this.selectedEdge = selected.type === "edge" ? selected.item : null;

        // Show visual feedback if multiple candidates
        if (this.overlapCandidates.length > 1 && window.showNotification) {
          const label =
            selected.type === "node"
              ? selected.item.label || "Unnamed Node"
              : `Edge (${selected.item.weight || 1})`;
          window.showNotification(
            `1 of ${this.overlapCandidates.length}: ${label}. Click again to cycle.`,
            "success",
          );
        }

        // Trigger selection change callback
        if (this.onSelectionChange) {
          this.onSelectionChange();
        }

        // Start dragging if node selected
        if (this.selectedNode) {
          this.isDragging = true;
          this.dragOffset.x = pos.x - this.selectedNode.x;
          this.dragOffset.y = pos.y - this.selectedNode.y;
        }
      } else {
        // Clicked empty space - start panning
        this.selectedNode = null;
        this.selectedEdge = null;
        this.overlapCandidates = [];
        this.isPanning = true;
        this.lastPanPoint = { x: e.clientX, y: e.clientY };

        // Trigger selection change callback
        if (this.onSelectionChange) {
          this.onSelectionChange();
        }
      }
    } else if (window.appMode === "node") {
      const node = this.getNodeAt(pos.x, pos.y);
      if (!node) {
        this.addNode(pos.x, pos.y);
      }
    } else if (window.appMode === "edge") {
      const node = this.getNodeAt(pos.x, pos.y);
      if (node) {
        if (!this.tempEdgeStart) {
          this.tempEdgeStart = node;
        } else {
          if (this.tempEdgeStart !== node) {
            this.addEdge(this.tempEdgeStart, node);
          }
          this.tempEdgeStart = null;
        }
      }
    }

    this.render();
  }

  handleMouseMove(e) {
    const pos = this.getMousePos(e);

    if (this.isDragging && this.selectedNode) {
      // Drag node
      this.selectedNode.x = pos.x - this.dragOffset.x;
      this.selectedNode.y = pos.y - this.dragOffset.y;
      this.render();
    } else if (this.isPanning) {
      // Pan canvas
      const dx = e.clientX - this.lastPanPoint.x;
      const dy = e.clientY - this.lastPanPoint.y;
      this.offset.x += dx;
      this.offset.y += dy;
      this.lastPanPoint = { x: e.clientX, y: e.clientY };
      this.render();
    } else {
      // Show tooltip for node under cursor
      const node = this.getNodeAt(pos.x, pos.y);
      if (node && node.label) {
        this.tooltip.textContent = node.label;
        this.tooltip.style.display = "block";
        this.tooltip.style.left = e.clientX + 10 + "px";
        this.tooltip.style.top = e.clientY + 10 + "px";
      } else {
        this.tooltip.style.display = "none";
      }
    }
  }

  handleMouseUp(e) {
    if (this.isDragging && this.selectedNode) {
      // Trigger callback for database persistence when dragging ends
      if (this.callbacks.onNodeUpdate) {
        this.callbacks.onNodeUpdate(this.selectedNode);
      }
    }
    this.isDragging = false;
    this.isPanning = false;
  }

  handleWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    this.scale *= delta;
    this.scale = Math.max(
      GRAPH_CONSTANTS.MIN_SCALE,
      Math.min(GRAPH_CONSTANTS.MAX_SCALE, this.scale),
    );
    this.render();
  }

  handleRightClick(e) {
    e.preventDefault();
    const pos = this.getMousePos(e);

    const node = this.getNodeAt(pos.x, pos.y);
    const edge = this.getEdgeAt(pos.x, pos.y);

    if (node || edge) {
      this.selectedNode = node;
      this.selectedEdge = edge;

      // Trigger selection change callback
      if (this.onSelectionChange) {
        this.onSelectionChange();
      }

      this.render();

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

  clear() {
    this.nodes = [];
    this.edges = [];
    this.selectedNode = null;
    this.selectedEdge = null;
    this.scale = 1;
    this.offset = { x: 0, y: 0 };
    // Reset overlap cycling state
    this.overlapCandidates = [];
    this.overlapIndex = 0;
    this.lastClickPos = null;
    this.lastClickTime = 0;
    this.render();
  }

  exportData() {
    return {
      nodes: this.nodes,
      edges: this.edges,
      scale: this.scale,
      offset: this.offset,
    };
  }

  importData(data, skipCallbacks = false) {
    this.nodes = data.nodes || [];
    this.edges = data.edges || [];
    this.selectedNode = null;
    this.selectedEdge = null;
    this.scale = data.scale || 1;
    this.offset = data.offset || { x: 0, y: 0 };
    this.render();

    // skipCallbacks is used when loading from database to avoid circular saves
    // It's not used when importing from file, which should trigger database import
  }

  // Layer management methods
  getAllLayers() {
    const layerSet = new Set();
    this.nodes.forEach((node) => {
      if (node.layers && Array.isArray(node.layers)) {
        node.layers.forEach((layer) => {
          if (layer && layer.trim()) {
            layerSet.add(layer.trim());
          }
        });
      }
    });
    return Array.from(layerSet).sort();
  }

  setActiveLayers(layers) {
    this.activeLayers = new Set(Array.isArray(layers) ? layers : []);
    this.render();
  }

  setLayerFilterMode(mode) {
    if (mode === "include" || mode === "exclude") {
      this.layerFilterMode = mode;
      this.render();
    }
  }

  getLayerFilterMode() {
    return this.layerFilterMode;
  }

  clearLayerFilter() {
    this.activeLayers.clear();
    this.render();
    return { success: true };
  }

  renameLayer(oldName, newName) {
    if (!oldName || !newName) {
      return { success: false, message: "Layer names cannot be empty" };
    }

    if (oldName === newName) {
      return {
        success: false,
        message: "Old and new layer names are identical",
      };
    }

    if (newName.includes(",")) {
      return { success: false, message: "Layer name cannot contain commas" };
    }

    const trimmedNewName = newName.trim();
    if (!trimmedNewName) {
      return { success: false, message: "Layer name cannot be empty" };
    }

    // Check if new name already exists
    const allLayers = this.getAllLayers();
    if (allLayers.includes(trimmedNewName) && trimmedNewName !== oldName) {
      return {
        success: false,
        message: `Layer "${trimmedNewName}" already exists`,
      };
    }

    // Rename layers in all nodes
    let renamedCount = 0;
    this.nodes.forEach((node) => {
      if (node.layers && Array.isArray(node.layers)) {
        const index = node.layers.indexOf(oldName);
        if (index !== -1) {
          node.layers[index] = trimmedNewName;
          renamedCount++;

          // Update node in database if callback exists
          if (this.callbacks.onNodeUpdate) {
            this.callbacks.onNodeUpdate(node);
          }
        }
      }
    });

    // Update active layers if old name was active
    if (this.activeLayers.has(oldName)) {
      this.activeLayers.delete(oldName);
      this.activeLayers.add(trimmedNewName);
    }

    this.render();

    return {
      success: true,
      message: `Renamed layer "${oldName}" to "${trimmedNewName}" in ${renamedCount} node(s)`,
    };
  }

  getLayerUsage(layerName) {
    const nodes = this.nodes.filter((node) => {
      return (
        node.layers &&
        Array.isArray(node.layers) &&
        node.layers.includes(layerName)
      );
    });

    return {
      count: nodes.length,
      nodes: nodes,
    };
  }

  /**
   * Get all connections for a node, categorized by direction
   * @param {string} nodeId - Node ID
   * @returns {Object} Object with incoming, outgoing, bidirectional, and all arrays
   */
  getNodeConnections(nodeId) {
    const incoming = [];
    const outgoing = [];
    const bidirectional = [];
    const all = [];

    // Find all edges connected to this node
    for (const edge of this.edges) {
      const isFrom = edge.from === nodeId;
      const isTo = edge.to === nodeId;

      if (isFrom && isTo) {
        // Bidirectional edge (self-loop)
        const node = this.nodes.find((n) => n.id === nodeId);
        if (node) {
          bidirectional.push({ node, edge });
          all.push({ node, edge, direction: 'bidirectional' });
        }
      } else if (isFrom) {
        // Outgoing edge
        const node = this.nodes.find((n) => n.id === edge.to);
        if (node) {
          outgoing.push({ node, edge });
          all.push({ node, edge, direction: 'outgoing' });
        }
      } else if (isTo) {
        // Incoming edge
        const node = this.nodes.find((n) => n.id === edge.from);
        if (node) {
          incoming.push({ node, edge });
          all.push({ node, edge, direction: 'incoming' });
        }
      }
    }

    // Check for bidirectional connections (two edges in opposite directions)
    const bidirectionalPairs = new Map();
    for (const conn of all) {
      const { node, edge, direction } = conn;
      const otherNodeId = node.id;
      // Skip self-loops (already handled)
      if (otherNodeId === nodeId) continue;
      
      const key = nodeId < otherNodeId ? `${nodeId}-${otherNodeId}` : `${otherNodeId}-${nodeId}`;
      
      if (!bidirectionalPairs.has(key)) {
        bidirectionalPairs.set(key, { from: null, to: null, fromIndex: -1, toIndex: -1 });
      }
      
      const pair = bidirectionalPairs.get(key);
      if (direction === 'outgoing') {
        pair.from = conn;
        pair.fromIndex = all.findIndex(c => c.edge.id === edge.id);
      } else if (direction === 'incoming') {
        pair.to = conn;
        pair.toIndex = all.findIndex(c => c.edge.id === edge.id);
      }
    }

    // Move true bidirectional pairs from incoming/outgoing to bidirectional
    // Process in reverse order to avoid index shifting issues
    const pairsToProcess = [];
    for (const [key, pair] of bidirectionalPairs.entries()) {
      if (pair.from && pair.to) {
        pairsToProcess.push({ pair, fromConn: pair.from, toConn: pair.to });
      }
    }

    // Sort by indices in descending order for safe removal
    pairsToProcess.sort((a, b) => {
      const maxA = Math.max(a.pair.fromIndex, a.pair.toIndex);
      const maxB = Math.max(b.pair.fromIndex, b.pair.toIndex);
      return maxB - maxA;
    });

    for (const { pair, fromConn, toConn } of pairsToProcess) {
      // Remove from incoming/outgoing arrays
      const incomingIndex = incoming.findIndex(c => c.edge.id === toConn.edge.id);
      const outgoingIndex = outgoing.findIndex(c => c.edge.id === fromConn.edge.id);
      
      if (incomingIndex !== -1) incoming.splice(incomingIndex, 1);
      if (outgoingIndex !== -1) outgoing.splice(outgoingIndex, 1);
      
      // Add to bidirectional array (use standard structure for consistency)
      bidirectional.push({
        node: fromConn.node,
        edge: fromConn.edge,
        reverseEdge: toConn.edge
      });
      
      // Update all array - mark outgoing as bidirectional and remove incoming duplicate
      const fromAllIndex = all.findIndex(c => c.edge.id === fromConn.edge.id);
      const toAllIndex = all.findIndex(c => c.edge.id === toConn.edge.id);
      if (fromAllIndex !== -1) {
        all[fromAllIndex].direction = 'bidirectional';
      }
      if (toAllIndex !== -1 && toAllIndex !== fromAllIndex) {
        all.splice(toAllIndex, 1); // Remove duplicate
      }
    }

    return {
      incoming,
      outgoing,
      bidirectional,
      all
    };
  }

  /**
   * Set highlighted nodes
   * @param {Array<string>} nodeIds - Array of node IDs to highlight
   */
  setHighlightedNodes(nodeIds) {
    this.highlightedNodes = Array.isArray(nodeIds) ? [...nodeIds] : [];
    this.render();
  }
}

// Export Graph class for use in modules
export { Graph };
