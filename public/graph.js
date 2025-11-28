/**
 * Graph Class - Main orchestrator for graph operations
 * Delegates to specialized modules for operations, handlers, and utilities
 */

import { GraphRenderer } from "./graph-renderer.js";
import { GRAPH_CONSTANTS } from "./utils/constants.js";
import { addNode, deleteNode, getNodeAt, getNodesAt } from "./graph/operations/nodeOperations.js";
import { addEdge, deleteEdge, getEdgeAt, getEdgesAt } from "./graph/operations/edgeOperations.js";
import { createMouseHandlers } from "./graph/handlers/mouseHandlers.js";
import { getAllLayers, renameLayer, getLayerUsage } from "./graph/layers/layerManager.js";
import { getNodeConnections } from "./graph/connections/nodeConnections.js";
import { GraphAnalysis } from "./utils/analysis/graph-analysis.js";

class Graph {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.nodes = [];
    this.edges = [];
    this.selectedNode = null;
    this.selectedEdge = null;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.dragStartPosition = null; // Track original position when drag starts
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

    // Initialize GraphAnalysis for centrality calculations
    this.graphAnalysis = new GraphAnalysis(this.nodes, this.edges);
    this.centralityRankings = null; // Cache for centrality rankings

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
    // Add tooltip element first (needed by handlers)
    this.tooltip = document.createElement("div");
    this.tooltip.className = "tooltip";
    this.tooltip.style.cssText =
      "position: absolute; display: none; background: rgba(0,0,0,0.8); color: white; padding: 8px 12px; border-radius: 4px; pointer-events: none; z-index: 1000; max-width: 300px; word-wrap: break-word; line-height: 1.4; font-size: 12px;";
    document.body.appendChild(this.tooltip);

    // Create mouse handlers bound to this graph instance
    const handlers = createMouseHandlers(this);
    
    this.canvas.addEventListener("mousedown", handlers.handleMouseDown);
    this.canvas.addEventListener("mousemove", handlers.handleMouseMove);
    this.canvas.addEventListener("mouseup", handlers.handleMouseUp);
    this.canvas.addEventListener("wheel", handlers.handleWheel);
    this.canvas.addEventListener("contextmenu", handlers.handleRightClick);
  }

  // Node operations - delegate to nodeOperations module
  addNode(x, y, label = "Node", color = GRAPH_CONSTANTS.DEFAULT_NODE_COLOR) {
    const node = addNode(
      this.nodes,
      x,
      y,
      label,
      color,
      this.callbacks.onNodeCreate
    );
    this.render();
    return node;
  }

  deleteNode(node) {
    const result = deleteNode(
      this.nodes,
      this.edges,
      node,
      this.callbacks.onNodeDelete
    );
    this.nodes = result.nodes;
    this.edges = result.edges;
    // Update graph analysis
    this.graphAnalysis.updateGraph(this.nodes, this.edges);
    this.centralityRankings = null;
    this.render();
  }

  getNodeAt(x, y) {
    return getNodeAt(this.nodes, x, y, this.scale);
  }

  getNodesAt(x, y) {
    return getNodesAt(this.nodes, x, y, this.scale);
  }

  // Edge operations - delegate to edgeOperations module
  addEdge(fromNode, toNode, weight = 1) {
    const edge = addEdge(
      this.edges,
      fromNode,
      toNode,
      weight,
      this.callbacks.onEdgeCreate
    );
    this.render();
    return edge;
  }

  deleteEdge(edge) {
    this.edges = deleteEdge(
      this.edges,
      edge,
      this.callbacks.onEdgeDelete
    );
    // Update graph analysis
    this.graphAnalysis.updateGraph(this.nodes, this.edges);
    this.centralityRankings = null;
    this.render();
  }

  getEdgeAt(x, y) {
    return getEdgeAt(this.edges, this.nodes, x, y);
  }

  getEdgesAt(x, y) {
    return getEdgesAt(this.edges, this.nodes, x, y);
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
    // Clear analysis
    this.graphAnalysis.updateGraph(this.nodes, this.edges);
    this.centralityRankings = null;
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
    
    // Clear active layers when importing new data - they will be restored from filterState if available
    // This ensures we don't have stale layers from previous database
    this.activeLayers = new Set();
    
    // Update graph analysis with new data
    this.graphAnalysis.updateGraph(this.nodes, this.edges);
    this.centralityRankings = null; // Clear rankings cache
    
    this.render();

    // skipCallbacks is used when loading from database to avoid circular saves
    // It's not used when importing from file, which should trigger database import
  }

  // Layer management methods - delegate to layerManager module
  getAllLayers() {
    return getAllLayers(this.nodes);
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
    const result = renameLayer(
      this.nodes,
      this.activeLayers,
      oldName,
      newName,
      this.callbacks.onNodeUpdate
    );
    if (result.success) {
      this.render();
    }
    return result;
  }

  getLayerUsage(layerName) {
    return getLayerUsage(this.nodes, layerName);
  }

  // Node connections - delegate to nodeConnections module
  getNodeConnections(nodeId) {
    return getNodeConnections(nodeId, this.nodes, this.edges);
  }

  /**
   * Set highlighted nodes
   * @param {Array<string>} nodeIds - Array of node IDs to highlight
   */
  setHighlightedNodes(nodeIds) {
    this.highlightedNodes = Array.isArray(nodeIds) ? [...nodeIds] : [];
    this.render();
  }

  // Graph Analysis methods
  /**
   * Calculate centralities for all nodes
   */
  calculateCentralities() {
    if (this.nodes.length === 0) {
      return;
    }

    // Update graph analysis with current data
    this.graphAnalysis.updateGraph(this.nodes, this.edges);
    
    // Calculate centralities
    const centralities = this.graphAnalysis.calculateCentralities();
    
    // Update nodes with centrality data
    this.nodes.forEach(node => {
      if (!node.centrality) node.centrality = {};
      Object.keys(centralities).forEach(type => {
        node.centrality[type] = centralities[type][node.id];
      });
    });
    
    // Calculate rankings
    this.calculateCentralityRankings();
  }

  /**
   * Calculate centrality rankings for all centrality types
   */
  calculateCentralityRankings() {
    if (this.nodes.length === 0) {
      this.centralityRankings = null;
      return;
    }

    this.centralityRankings = {};
    const centralityTypes = ['degree', 'betweenness', 'closeness', 'eigenvector', 'pagerank'];

    centralityTypes.forEach(type => {
      const values = this.nodes.map(node => ({
        nodeId: node.id,
        value: parseFloat(node.centrality?.[type]) || 0
      }));

      values.sort((a, b) => b.value - a.value);

      const rankings = new Map();
      values.forEach((item, index) => {
        rankings.set(item.nodeId, index + 1);
      });

      this.centralityRankings[type] = rankings;
    });
  }

  /**
   * Get centrality rank for a node
   * @param {string} nodeId - Node ID
   * @param {string} centralityType - Type of centrality
   * @returns {number|null} Rank (1-based) or null if not available
   */
  getCentralityRank(nodeId, centralityType) {
    if (!this.centralityRankings || !this.centralityRankings[centralityType]) {
      return null;
    }
    return this.centralityRankings[centralityType].get(nodeId) || null;
  }

  // Clustering methods
  /**
   * Detect communities using Louvain algorithm
   * @param {number} resolution - Resolution parameter (default: 1.0)
   * @returns {Object} Clustering result
   */
  detectCommunitiesLouvain(resolution = 1.0) {
    return this.graphAnalysis.detectCommunitiesLouvain(resolution);
  }

  /**
   * Detect communities using Label Propagation algorithm
   * @param {number} maxIterations - Maximum iterations (default: 100)
   * @returns {Object} Clustering result
   */
  detectCommunitiesLabelPropagation(maxIterations = 100) {
    return this.graphAnalysis.detectCommunitiesLabelPropagation(maxIterations);
  }

  /**
   * Perform K-core decomposition
   * @returns {Object} K-core result
   */
  kCoreDecomposition() {
    return this.graphAnalysis.kCoreDecomposition();
  }

  /**
   * Apply clustering colors to nodes
   * @param {Object} communities - Community assignments {nodeId: communityId}
   * @param {boolean} preserveOriginalColors - Whether to save original colors
   */
  applyClusteringColors(communities, preserveOriginalColors = true) {
    if (!communities || Object.keys(communities).length === 0) {
      return;
    }

    // Generate distinct colors for communities
    const communityIds = [...new Set(Object.values(communities))];
    const colors = this.generateDistinctColors(communityIds.length);

    // Save original colors if needed
    if (preserveOriginalColors) {
      this.nodes.forEach(node => {
        if (!node.originalColor) {
          node.originalColor = node.color;
        }
      });
    }

    // Apply colors based on community
    this.nodes.forEach(node => {
      const communityId = communities[node.id];
      if (communityId !== undefined) {
        const colorIndex = communityIds.indexOf(communityId);
        node.color = colors[colorIndex % colors.length];
        node.community = communityId;
      }
    });

    this.render();
  }

  /**
   * Restore original node colors
   */
  restoreOriginalColors() {
    this.nodes.forEach(node => {
      if (node.originalColor) {
        node.color = node.originalColor;
        delete node.originalColor;
      }
      delete node.community;
    });
    this.render();
  }

  /**
   * Generate distinct colors for visualization
   * @param {number} count - Number of colors needed
   * @returns {Array<string>} Array of hex color codes
   */
  generateDistinctColors(count) {
    const colors = [];
    const hueStep = 360 / count;

    for (let i = 0; i < count; i++) {
      const hue = (i * hueStep) % 360;
      // Use HSL to generate distinct colors with good saturation and lightness
      const saturation = 70 + (i % 3) * 10; // 70-90%
      const lightness = 50 + (Math.floor(i / 3) % 3) * 10; // 50-70%
      colors.push(this.hslToHex(hue, saturation, lightness));
    }

    return colors;
  }

  /**
   * Convert HSL to hex color
   * @param {number} h - Hue (0-360)
   * @param {number} s - Saturation (0-100)
   * @param {number} l - Lightness (0-100)
   * @returns {string} Hex color code
   */
  hslToHex(h, s, l) {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }
}

// Export Graph class for use in modules
export { Graph };
