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
import { getNodeConnections, getNodesWithinConstraints } from "./graph/connections/nodeConnections.js";
import { GraphAnalysis } from "./utils/analysis/graph-analysis.js";
import {
  calculateCentralities as calcCentralities,
  calculateCentralityRankings as calcCentralityRankings,
  getCentralityRank as getCentralityRankForNode,
  detectCommunitiesLouvain as detectLouvain,
  detectCommunitiesLabelPropagation as detectLabelProp,
  kCoreDecomposition as kCore,
  applyClusteringColors as applyClustering,
  restoreOriginalColors as restoreColors
} from "./graph/analysis/graphAnalysisOperations.js";

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
    // Update graph info when filter changes
    if (typeof window.updateGraphInfo === 'function') {
      window.updateGraphInfo();
    }
  }

  setLayerFilterMode(mode) {
    if (mode === "include" || mode === "exclude") {
      this.layerFilterMode = mode;
      this.render();
      // Update graph info when filter changes
      if (typeof window.updateGraphInfo === 'function') {
        window.updateGraphInfo();
      }
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

  /**
   * Get filtered nodes based on current layer filter state
   * @returns {Array} Filtered nodes
   */
  getFilteredNodes() {
    const filterState = {
      layerFilterEnabled: this.activeLayers.size > 0,
      activeLayers: this.activeLayers,
      layerFilterMode: this.layerFilterMode,
    };
    return this.renderer.filterNodes(this.nodes, filterState);
  }

  /**
   * Get filtered edges based on current layer filter state
   * Only includes edges where both connected nodes are visible
   * @returns {Array} Filtered edges
   */
  getFilteredEdges() {
    const filteredNodes = this.getFilteredNodes();
    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    
    return this.edges.filter(edge => {
      const fromId = edge.from || edge.from_node_id;
      const toId = edge.to || edge.to_node_id;
      return filteredNodeIds.has(fromId) && filteredNodeIds.has(toId);
    });
  }

  // Node connections - delegate to nodeConnections module
  getNodeConnections(nodeId) {
    return getNodeConnections(nodeId, this.nodes, this.edges);
  }

  /**
   * Get nodes within depth/distance constraints using shortest paths
   * @param {string} nodeId - Starting node ID
   * @param {Object} options - Filter options
   * @param {number|null} options.maxDepth - Maximum depth (hops) allowed
   * @param {number|null} options.maxDistance - Maximum distance (sum of edge weights) allowed
   * @param {string} options.condition - 'AND' or 'OR' condition for depth/distance
   * @returns {Array} Array of nodes with path information that meet the criteria
   */
  getNodesWithinConstraints(nodeId, options = {}) {
    // Use filtered nodes/edges if filter is active
    const nodes = this.getFilteredNodes();
    const edges = this.getFilteredEdges();
    return getNodesWithinConstraints(nodeId, nodes, edges, options);
  }

  /**
   * Set highlighted nodes
   * @param {Array<string>} nodeIds - Array of node IDs to highlight
   */
  setHighlightedNodes(nodeIds) {
    this.highlightedNodes = Array.isArray(nodeIds) ? [...nodeIds] : [];
    this.render();
  }

  // Graph Analysis methods - delegate to graphAnalysisOperations module
  /**
   * Calculate centralities for all nodes
   */
  calculateCentralities() {
    return calcCentralities(this);
  }

  /**
   * Calculate centrality rankings for all centrality types
   * @param {Array} nodes - Nodes to rank (defaults to filtered nodes)
   */
  calculateCentralityRankings(nodes = null) {
    return calcCentralityRankings(this, nodes);
  }

  /**
   * Get centrality rank for a node
   * @param {string} nodeId - Node ID
   * @param {string} centralityType - Type of centrality
   * @returns {number|null} Rank (1-based) or null if not available
   */
  getCentralityRank(nodeId, centralityType) {
    return getCentralityRankForNode(this, nodeId, centralityType);
  }

  // Clustering methods - delegate to graphAnalysisOperations module
  /**
   * Detect communities using Louvain algorithm
   * @param {number} resolution - Resolution parameter (default: 1.0)
   * @returns {Object} Clustering result
   */
  detectCommunitiesLouvain(resolution = 1.0) {
    return detectLouvain(this, resolution);
  }

  /**
   * Detect communities using Label Propagation algorithm
   * @param {number} maxIterations - Maximum iterations (default: 100)
   * @returns {Object} Clustering result
   */
  detectCommunitiesLabelPropagation(maxIterations = 100) {
    return detectLabelProp(this, maxIterations);
  }

  /**
   * Perform K-core decomposition
   * @returns {Object} K-core result
   */
  kCoreDecomposition() {
    return kCore(this);
  }

  /**
   * Apply clustering colors to nodes
   * @param {Object} communities - Community assignments {nodeId: communityId}
   * @param {boolean} preserveOriginalColors - Whether to save original colors
   */
  applyClusteringColors(communities, preserveOriginalColors = true) {
    return applyClustering(this, communities, preserveOriginalColors);
  }

  /**
   * Restore original node colors
   */
  restoreOriginalColors() {
    return restoreColors(this);
  }
}

// Export Graph class for use in modules
export { Graph };
