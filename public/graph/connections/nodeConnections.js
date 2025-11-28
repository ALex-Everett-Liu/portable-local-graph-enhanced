/**
 * Node Connections Module
 * Handles querying and categorizing node connections
 */

/**
 * Calculate shortest paths to all nodes and filter by depth/distance constraints
 * @param {string} startNodeId - Starting node ID
 * @param {Array} nodes - Array of all nodes
 * @param {Array} edges - Array of all edges
 * @param {Object} options - Filter options
 * @param {number|null} options.maxDepth - Maximum depth (hops) allowed
 * @param {number|null} options.maxDistance - Maximum distance (sum of edge weights) allowed
 * @param {string} options.condition - 'AND' or 'OR' condition for depth/distance
 * @returns {Array} Array of nodes with path information that meet the criteria
 */
export function getNodesWithinConstraints(startNodeId, nodes, edges, options = {}) {
  const { maxDepth = null, maxDistance = null, condition = 'AND' } = options;
  
  // If no constraints, return empty array
  if (maxDepth === null && maxDistance === null) {
    return [];
  }

  // Build edge map for efficient lookup
  const edgeMap = new Map();
  nodes.forEach(node => {
    edgeMap.set(node.id, []);
  });

  edges.forEach(edge => {
    const fromId = edge.from || edge.from_node_id;
    const toId = edge.to || edge.to_node_id;
    const weight = edge.weight || 1;
    
    // Only add edges if both nodes exist in the filtered nodes
    if (edgeMap.has(fromId) && edgeMap.has(toId)) {
      edgeMap.get(fromId).push({ to: toId, weight, edge });
      // Add reverse direction for undirected graph traversal
      if (fromId !== toId) {
        edgeMap.get(toId).push({ to: fromId, weight, edge });
      }
    }
  });

  // Dijkstra-like algorithm tracking both depth and distance
  const distances = new Map(); // Total weight distance
  const depths = new Map(); // Number of hops
  const previous = new Map(); // For path reconstruction
  const visited = new Set();
  const queue = [];

  // Initialize
  nodes.forEach(node => {
    if (node.id === startNodeId) {
      distances.set(node.id, 0);
      depths.set(node.id, 0);
    } else {
      distances.set(node.id, Infinity);
      depths.set(node.id, Infinity);
    }
    previous.set(node.id, null);
  });

  queue.push({ nodeId: startNodeId, distance: 0, depth: 0 });

  while (queue.length > 0) {
    queue.sort((a, b) => a.distance - b.distance);
    const current = queue.shift();

    if (visited.has(current.nodeId)) continue;
    visited.add(current.nodeId);

    const connections = edgeMap.get(current.nodeId) || [];
    connections.forEach(conn => {
      if (visited.has(conn.to)) return;

      const newDistance = current.distance + conn.weight;
      const newDepth = current.depth + 1;

      // Check if this path is better (shorter distance)
      if (newDistance < distances.get(conn.to)) {
        distances.set(conn.to, newDistance);
        depths.set(conn.to, newDepth);
        previous.set(conn.to, { 
          node: current.nodeId, 
          edge: conn.edge,
          distance: newDistance,
          depth: newDepth
        });
        queue.push({ nodeId: conn.to, distance: newDistance, depth: newDepth });
      }
    });
  }

  // Filter nodes based on constraints
  const results = [];
  const startNode = nodes.find(n => n.id === startNodeId);
  if (!startNode) return results;

  nodes.forEach(node => {
    if (node.id === startNodeId) return; // Skip start node

    const distance = distances.get(node.id);
    const depth = depths.get(node.id);

    if (distance === Infinity || depth === Infinity) return; // Unreachable

    // Check constraints
    let meetsCriteria = false;
    if (condition === 'AND') {
      // Both constraints must be satisfied (if specified)
      const depthOK = maxDepth === null || depth <= maxDepth;
      const distanceOK = maxDistance === null || distance <= maxDistance;
      meetsCriteria = depthOK && distanceOK;
    } else { // OR
      // At least one constraint must be satisfied (if specified)
      const depthOK = maxDepth === null || depth <= maxDepth;
      const distanceOK = maxDistance === null || distance <= maxDistance;
      meetsCriteria = depthOK || distanceOK;
    }

    if (meetsCriteria) {
      // Reconstruct path
      const path = [];
      const pathEdges = [];
      let current = node.id;

      while (current !== startNodeId && previous.get(current)) {
        path.unshift(current);
        const prev = previous.get(current);
        if (prev.edge) {
          pathEdges.unshift(prev.edge);
        }
        current = prev.node;
      }
      path.unshift(startNodeId);

      results.push({
        node,
        distance,
        depth,
        path,
        pathEdges
      });
    }
  });

  // Sort by distance, then by depth
  results.sort((a, b) => {
    if (a.distance !== b.distance) {
      return a.distance - b.distance;
    }
    return a.depth - b.depth;
  });

  return results;
}

/**
 * Get all connections for a node, categorized by direction
 * @param {string} nodeId - Node ID
 * @param {Array} nodes - Array of all nodes
 * @param {Array} edges - Array of all edges
 * @returns {Object} Object with incoming, outgoing, bidirectional, and all arrays
 */
export function getNodeConnections(nodeId, nodes, edges) {
  const incoming = [];
  const outgoing = [];
  const bidirectional = [];
  const all = [];

  // Find all edges connected to this node
  for (const edge of edges) {
    const isFrom = edge.from === nodeId;
    const isTo = edge.to === nodeId;

    if (isFrom && isTo) {
      // Bidirectional edge (self-loop)
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        bidirectional.push({ node, edge });
        all.push({ node, edge, direction: 'bidirectional' });
      }
    } else if (isFrom) {
      // Outgoing edge
      const node = nodes.find((n) => n.id === edge.to);
      if (node) {
        outgoing.push({ node, edge });
        all.push({ node, edge, direction: 'outgoing' });
      }
    } else if (isTo) {
      // Incoming edge
      const node = nodes.find((n) => n.id === edge.from);
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

