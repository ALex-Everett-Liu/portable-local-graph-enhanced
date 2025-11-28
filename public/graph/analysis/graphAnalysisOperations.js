/**
 * Graph Analysis Operations Module
 * Handles graph analysis operations: centrality calculations, clustering, and color visualization
 */

/**
 * Calculate centralities for all nodes
 * @param {Object} graph - Graph instance
 */
export function calculateCentralities(graph) {
  // Use filtered nodes/edges for analysis
  const filteredNodes = graph.getFilteredNodes();
  const filteredEdges = graph.getFilteredEdges();
  
  if (filteredNodes.length === 0) {
    return;
  }

  // Update graph analysis with filtered data
  graph.graphAnalysis.updateGraph(filteredNodes, filteredEdges);
  
  // Calculate centralities
  const centralities = graph.graphAnalysis.calculateCentralities();
  
  // Update nodes with centrality data (only for filtered nodes)
  filteredNodes.forEach(node => {
    if (!node.centrality) node.centrality = {};
    Object.keys(centralities).forEach(type => {
      node.centrality[type] = centralities[type][node.id];
    });
  });
  
  // Calculate rankings using filtered nodes
  calculateCentralityRankings(graph, filteredNodes);
}

/**
 * Calculate centrality rankings for all centrality types
 * @param {Object} graph - Graph instance
 * @param {Array} nodes - Nodes to rank (defaults to filtered nodes)
 */
export function calculateCentralityRankings(graph, nodes = null) {
  const nodesToRank = nodes || graph.getFilteredNodes();
  
  if (nodesToRank.length === 0) {
    graph.centralityRankings = null;
    return;
  }

  graph.centralityRankings = {};
  const centralityTypes = ['degree', 'betweenness', 'closeness', 'eigenvector', 'pagerank'];

  centralityTypes.forEach(type => {
    const values = nodesToRank.map(node => ({
      nodeId: node.id,
      value: parseFloat(node.centrality?.[type]) || 0
    }));

    values.sort((a, b) => b.value - a.value);

    const rankings = new Map();
    values.forEach((item, index) => {
      rankings.set(item.nodeId, index + 1);
    });

    graph.centralityRankings[type] = rankings;
  });
}

/**
 * Get centrality rank for a node
 * @param {Object} graph - Graph instance
 * @param {string} nodeId - Node ID
 * @param {string} centralityType - Type of centrality
 * @returns {number|null} Rank (1-based) or null if not available
 */
export function getCentralityRank(graph, nodeId, centralityType) {
  if (!graph.centralityRankings || !graph.centralityRankings[centralityType]) {
    return null;
  }
  return graph.centralityRankings[centralityType].get(nodeId) || null;
}

/**
 * Detect communities using Louvain algorithm
 * @param {Object} graph - Graph instance
 * @param {number} resolution - Resolution parameter (default: 1.0)
 * @returns {Object} Clustering result
 */
export function detectCommunitiesLouvain(graph, resolution = 1.0) {
  // Use filtered nodes/edges for clustering
  const filteredNodes = graph.getFilteredNodes();
  const filteredEdges = graph.getFilteredEdges();
  graph.graphAnalysis.updateGraph(filteredNodes, filteredEdges);
  return graph.graphAnalysis.detectCommunitiesLouvain(resolution);
}

/**
 * Detect communities using Label Propagation algorithm
 * @param {Object} graph - Graph instance
 * @param {number} maxIterations - Maximum iterations (default: 100)
 * @returns {Object} Clustering result
 */
export function detectCommunitiesLabelPropagation(graph, maxIterations = 100) {
  // Use filtered nodes/edges for clustering
  const filteredNodes = graph.getFilteredNodes();
  const filteredEdges = graph.getFilteredEdges();
  graph.graphAnalysis.updateGraph(filteredNodes, filteredEdges);
  return graph.graphAnalysis.detectCommunitiesLabelPropagation(maxIterations);
}

/**
 * Perform K-core decomposition
 * @param {Object} graph - Graph instance
 * @returns {Object} K-core result
 */
export function kCoreDecomposition(graph) {
  // Use filtered nodes/edges for clustering
  const filteredNodes = graph.getFilteredNodes();
  const filteredEdges = graph.getFilteredEdges();
  graph.graphAnalysis.updateGraph(filteredNodes, filteredEdges);
  return graph.graphAnalysis.kCoreDecomposition();
}

/**
 * Apply clustering colors to nodes
 * @param {Object} graph - Graph instance
 * @param {Object} communities - Community assignments {nodeId: communityId}
 * @param {boolean} preserveOriginalColors - Whether to save original colors
 */
export function applyClusteringColors(graph, communities, preserveOriginalColors = true) {
  if (!communities || Object.keys(communities).length === 0) {
    return;
  }

  // Generate distinct colors for communities
  const communityIds = [...new Set(Object.values(communities))];
  const colors = generateDistinctColors(communityIds.length);

  // Save original colors if needed
  if (preserveOriginalColors) {
    graph.nodes.forEach(node => {
      if (!node.originalColor) {
        node.originalColor = node.color;
      }
    });
  }

  // Apply colors based on community
  graph.nodes.forEach(node => {
    const communityId = communities[node.id];
    if (communityId !== undefined) {
      const colorIndex = communityIds.indexOf(communityId);
      node.color = colors[colorIndex % colors.length];
      node.community = communityId;
    }
  });

  graph.render();
}

/**
 * Restore original node colors
 * @param {Object} graph - Graph instance
 */
export function restoreOriginalColors(graph) {
  graph.nodes.forEach(node => {
    if (node.originalColor) {
      node.color = node.originalColor;
      delete node.originalColor;
    }
    delete node.community;
  });
  graph.render();
}

/**
 * Generate distinct colors for visualization
 * @param {number} count - Number of colors needed
 * @returns {Array<string>} Array of hex color codes
 */
export function generateDistinctColors(count) {
  const colors = [];
  const hueStep = 360 / count;

  for (let i = 0; i < count; i++) {
    const hue = (i * hueStep) % 360;
    // Use HSL to generate distinct colors with good saturation and lightness
    const saturation = 70 + (i % 3) * 10; // 70-90%
    const lightness = 50 + (Math.floor(i / 3) % 3) * 10; // 50-70%
    colors.push(hslToHex(hue, saturation, lightness));
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
export function hslToHex(h, s, l) {
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

