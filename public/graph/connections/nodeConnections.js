/**
 * Node Connections Module
 * Handles querying and categorizing node connections
 */

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

