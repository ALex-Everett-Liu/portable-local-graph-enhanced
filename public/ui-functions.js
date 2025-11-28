// UI Functions Module

// Helper function to validate hex color
function isValidHex(hex) {
  return /^#[0-9A-F]{6}$/i.test(hex);
}

// Convert hex to RGB
function hexToRgb(hex) {
  if (!isValidHex(hex)) return null;
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// Convert RGB to hex
function rgbToHex(r, g, b) {
  return (
    "#" +
    ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
  );
}

// Show node dialog
function showNodeDialog(node) {
  const dialog = document.getElementById("node-dialog");
  const labelInput = document.getElementById("node-label");
  const chineseInput = document.getElementById("node-chinese");
  const colorInput = document.getElementById("node-color");
  const hexInput = document.getElementById("node-color-hex");
  const xInput = document.getElementById("node-x");
  const yInput = document.getElementById("node-y");
  const categoryInput = document.getElementById("node-category");
  const sizeInput = document.getElementById("node-size");
  const sizeDisplay = document.getElementById("size-display");
  const layersInput = document.getElementById("node-layers");

  // Clear form fields for new nodes, populate for existing nodes
  const graph = window.graph || window.getGraph?.();
  const isExistingNode =
    node.id &&
    graph &&
    graph.nodes &&
    graph.nodes.find((n) => n.id === node.id);
  if (isExistingNode) {
    // Existing node - populate with current values
    labelInput.value = node.label || "";
    chineseInput.value = node.chineseLabel || "";
    const defaultColor =
      (window.GRAPH_CONSTANTS && window.GRAPH_CONSTANTS.DEFAULT_NODE_COLOR) ||
      "#507F80";
    colorInput.value = node.color || defaultColor;
    hexInput.value = node.color || defaultColor;
    xInput.value = Math.round(node.x) || 0;
    yInput.value = Math.round(node.y) || 0;
    categoryInput.value = node.category || "";
    const defaultRadius =
      (window.GRAPH_CONSTANTS && window.GRAPH_CONSTANTS.DEFAULT_NODE_RADIUS) ||
      20;
    sizeInput.value = node.radius || defaultRadius;
    sizeDisplay.textContent = node.radius || defaultRadius;
    layersInput.value = (node.layers || []).join(", ");
  } else {
    // New node - clear all fields
    labelInput.value = "";
    chineseInput.value = "";
    const defaultColor =
      (window.GRAPH_CONSTANTS && window.GRAPH_CONSTANTS.DEFAULT_NODE_COLOR) ||
      "#507F80";
    colorInput.value = defaultColor;
    hexInput.value = defaultColor;
    xInput.value = "";
    yInput.value = "";
    categoryInput.value = "";
    const defaultRadius =
      (window.GRAPH_CONSTANTS && window.GRAPH_CONSTANTS.DEFAULT_NODE_RADIUS) ||
      20;
    sizeInput.value = defaultRadius;
    sizeDisplay.textContent = defaultRadius;
    layersInput.value = "";
  }

  // Update size display when slider changes
  sizeInput.oninput = () => {
    sizeDisplay.textContent = sizeInput.value;
  };

  // Sync color picker with hex input
  colorInput.oninput = () => {
    hexInput.value = colorInput.value;
  };

  // Sync hex input with color picker
  hexInput.oninput = () => {
    if (isValidHex(hexInput.value)) {
      colorInput.value = hexInput.value;
    }
  };

  // Validate hex on blur
  hexInput.onblur = () => {
    if (!isValidHex(hexInput.value) && hexInput.value !== "") {
      showNotification(
        "Invalid hex color format. Use #RRGGBB format.",
        "error",
      );
      hexInput.value = colorInput.value; // Reset to current color
    }
  };

  dialog.dataset.nodeId = node.id;

  // Store current node for connections button
  window.currentEditingNode = node;

  dialog.classList.remove("hidden");
}

// Show edge dialog
function showEdgeDialog(edge) {
  const dialog = document.getElementById("weight-dialog");
  const weightInput = document.getElementById("weight-input");
  const categoryInput = document.getElementById("edge-category");

  weightInput.value = edge.weight;
  categoryInput.value = edge.category || "";
  dialog.dataset.edgeId = edge.id;
  dialog.classList.remove("hidden");
}

// Handle node OK
function handleNodeOK() {
  const dialog = document.getElementById("node-dialog");
  const nodeId = dialog.dataset.nodeId;
  const label = document.getElementById("node-label").value;
  const chineseLabel = document.getElementById("node-chinese").value;
  const color = document.getElementById("node-color").value;
  const x = parseFloat(document.getElementById("node-x").value);
  const y = parseFloat(document.getElementById("node-y").value);
  const category = document.getElementById("node-category").value;
  const radius = parseInt(document.getElementById("node-size").value);
  const layersInput = document.getElementById("node-layers").value;

  // Validate hex color if user entered one
  const hexInput = document.getElementById("node-color-hex");
  if (!isValidHex(hexInput.value) && hexInput.value !== "") {
    showNotification(
      "Invalid hex color format. Please use #RRGGBB format.",
      "error",
    );
    return;
  }

  // Validate position inputs
  if (isNaN(x) || isNaN(y)) {
    showNotification(
      "Please enter valid numeric coordinates for X and Y.",
      "error",
    );
    return;
  }

  const graph = window.graph || window.getGraph?.();
  if (!graph) {
    console.error("Graph instance not available");
    return;
  }

  const node = graph.nodes.find((n) => n.id == nodeId);
  if (node) {
    if (window.saveState) window.saveState();

    // Update node properties
    node.label = label;
    node.chineseLabel = chineseLabel || "";
    node.color = color;
    node.x = x;
    node.y = y;
    node.category = category || null;
    node.radius = Math.max(1, Math.min(100, radius));

    // Parse layers from comma-separated input
    if (layersInput.trim()) {
      node.layers = layersInput
        .split(",")
        .map((l) => l.trim())
        .filter((l) => l);
    } else {
      node.layers = [];
    }

    // Track the change for save button visibility
    if (window.trackNodeUpdate) {
      window.trackNodeUpdate(node);
    }

    if (graph.render) graph.render();
    if (window.appState) window.appState.isModified = true;
    
    // Update layer summary if layers were changed
    if (typeof window.updateLayerSummary === 'function') {
      window.updateLayerSummary();
    }
  }

  dialog.classList.add("hidden");
}

// Handle node cancel
function handleNodeCancel() {
  const dialog = document.getElementById("node-dialog");
  // Clear form fields to prevent persistence
  document.getElementById("node-label").value = "";
  document.getElementById("node-chinese").value = "";
  document.getElementById("node-color").value = "#507F80";
  document.getElementById("node-color-hex").value = "#507F80";
  document.getElementById("node-x").value = "";
  document.getElementById("node-y").value = "";
  document.getElementById("node-category").value = "";
  document.getElementById("node-layers").value = "";
  document.getElementById("node-size").value = "20";
  dialog.classList.add("hidden");
}

// Handle node delete
function handleNodeDelete() {
  const dialog = document.getElementById("node-dialog");
  const nodeId = dialog.dataset.nodeId;
  const graph = window.graph || window.getGraph?.();

  if (!graph) {
    console.error("Graph instance not available");
    return;
  }

  if (window.saveState) window.saveState();
  if (graph.deleteNode) graph.deleteNode(nodeId);
  if (window.updateGraphInfo) window.updateGraphInfo();
  if (window.appState) window.appState.isModified = true;
  
  // Update layer summary when node is deleted
  if (typeof window.updateLayerSummary === 'function') {
    window.updateLayerSummary();
  }

  dialog.classList.add("hidden");
}

// Handle weight OK
function handleWeightOK() {
  const dialog = document.getElementById("weight-dialog");
  const edgeId = dialog.dataset.edgeId;
  const weight = parseFloat(document.getElementById("weight-input").value);
  const category = document.getElementById("edge-category").value;
  const graph = window.graph || window.getGraph?.();

  if (!graph) {
    console.error("Graph instance not available");
    dialog.classList.add("hidden");
    return;
  }

  if (!isNaN(weight)) {
    const edge = graph.edges.find((e) => e.id == edgeId);
    if (edge) {
      if (window.saveState) window.saveState();

      // Update edge properties
      edge.weight = weight;
      edge.category = category || null;

      // Track the change for save button visibility
      if (window.trackEdgeUpdate) {
        window.trackEdgeUpdate(edge);
      }

      if (graph.render) graph.render();
      if (window.appState) window.appState.isModified = true;
    }
  }

  dialog.classList.add("hidden");
}

// Handle reverse edge direction
function handleReverseEdgeDirection() {
  const dialog = document.getElementById("weight-dialog");
  const edgeId = dialog.dataset.edgeId;
  const graph = window.graph || window.getGraph?.();

  if (!graph) {
    console.error("Graph instance not available");
    return;
  }

  const edge = graph.edges.find((e) => e.id == edgeId);
  if (edge) {
    if (window.saveState) window.saveState();
    // Swap source and target nodes
    [edge.from, edge.to] = [edge.to, edge.from];

    // Track the change for save button visibility
    if (window.trackEdgeUpdate) {
      window.trackEdgeUpdate(edge);
    }

    if (graph.render) graph.render();
    if (window.appState) window.appState.isModified = true;

    // Show notification with node labels
    const sourceNode = graph.nodes.find((n) => n.id === edge.from);
    const targetNode = graph.nodes.find((n) => n.id === edge.to);
    if (sourceNode && targetNode) {
      showNotification(
        `Edge direction reversed: ${targetNode.label} → ${sourceNode.label}`,
      );
    } else {
      showNotification("Edge direction reversed");
    }
  }
}

// Handle weight cancel
function handleWeightCancel() {
  document.getElementById("weight-dialog").classList.add("hidden");
}

// Handle weight delete
function handleWeightDelete() {
  const dialog = document.getElementById("weight-dialog");
  const edgeId = dialog.dataset.edgeId;
  const graph = window.graph || window.getGraph?.();

  if (!graph) {
    console.error("Graph instance not available");
    dialog.classList.add("hidden");
    return;
  }

  if (edgeId) {
    if (window.saveState) window.saveState();
    if (graph.deleteEdge) graph.deleteEdge(edgeId);
    if (graph.render) graph.render();
    if (window.appState) window.appState.isModified = true;
  }

  dialog.classList.add("hidden");
}

// Show notification
function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        ${type === "success" ? "background: #28a745;" : "background: #dc3545;"}
    `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Store current connections node for highlighting
let currentConnectionsNode = null;

// Show node connections dialog
function showNodeConnections(nodeId) {
  const graph = window.graph || window.getGraph?.();
  if (!graph) {
    console.error("Graph instance not available");
    return;
  }

  const node = graph.nodes.find((n) => n.id === nodeId);
  if (!node) {
    console.error("Node not found:", nodeId);
    return;
  }

  currentConnectionsNode = node;
  const connections = graph.getNodeConnections(nodeId);

  // Update dialog title
  const titleElement = document.getElementById("connections-dialog-title");
  if (titleElement) {
    const nodeLabel = node.label || node.chineseLabel || "Unnamed Node";
    titleElement.textContent = `Connections: ${nodeLabel}`;
  }

  // Update connection count
  const countElement = document.getElementById("connections-total-count");
  if (countElement) {
    countElement.textContent = connections.all.length;
  }

  // Render connections
  renderConnections(connections, node);

  // Show dialog
  const dialog = document.getElementById("node-connections-dialog");
  if (dialog) {
    dialog.classList.remove("hidden");
  }

  // Close the Edit Node dialog
  const nodeDialog = document.getElementById("node-dialog");
  if (nodeDialog) {
    nodeDialog.classList.add("hidden");
  }
}

// Render connections in the dialog
function renderConnections(connections, node) {
  const listElement = document.getElementById("connections-list");
  if (!listElement) return;

  // Clear existing content
  listElement.innerHTML = "";

  if (connections.all.length === 0) {
    listElement.innerHTML = '<div class="empty-connections">No connections found</div>';
    return;
  }

  // Helper function to escape HTML
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Helper function to create connection item HTML
  function createConnectionItem(conn, direction) {
    const connNode = conn.node;
    const edge = conn.edge;
    const nodeLabel = escapeHtml(connNode.label || "Unnamed Node");
    const nodeChinese = connNode.chineseLabel ? ` (${escapeHtml(connNode.chineseLabel)})` : "";
    const weight = edge.weight || 1;
    const category = edge.category ? ` [${escapeHtml(edge.category)}]` : "";
    
    let directionClass = "";
    let directionText = "";
    if (direction === "incoming") {
      directionClass = "direction-incoming";
      directionText = "← Incoming";
    } else if (direction === "outgoing") {
      directionClass = "direction-outgoing";
      directionText = "Outgoing →";
    } else {
      directionClass = "direction-bidirectional";
      directionText = "↔ Bidirectional";
    }

    const item = document.createElement("div");
    item.className = "connection-item";
    item.style.cssText = `
      padding: 10px;
      margin-bottom: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    `;
    item.onmouseover = () => {
      item.style.backgroundColor = "#f5f5f5";
    };
    item.onmouseout = () => {
      item.style.backgroundColor = "";
    };
    item.onclick = () => {
      // Highlight this specific connection
      highlightConnection(connNode.id, node.id);
    };

    item.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="flex: 1;">
          <div style="font-weight: 500; font-size: 13px; margin-bottom: 4px;">
            ${nodeLabel}${nodeChinese}
          </div>
          <div style="font-size: 11px; color: #666;">
            Weight: ${weight}${category}
          </div>
        </div>
        <div class="connection-direction ${directionClass}" style="margin-left: 12px;">
          ${directionText}
        </div>
      </div>
    `;

    return item;
  }

  // Render bidirectional connections
  if (connections.bidirectional.length > 0) {
    const section = document.createElement("div");
    section.style.marginBottom = "16px";
    
    const sectionTitle = document.createElement("div");
    sectionTitle.className = "connection-direction direction-bidirectional";
    sectionTitle.style.cssText = "font-weight: 600; margin-bottom: 8px; font-size: 12px;";
    sectionTitle.textContent = `Bidirectional (${connections.bidirectional.length})`;
    section.appendChild(sectionTitle);

    connections.bidirectional.forEach((conn) => {
      section.appendChild(createConnectionItem(conn, "bidirectional"));
    });

    listElement.appendChild(section);
  }

  // Render incoming connections
  if (connections.incoming.length > 0) {
    const section = document.createElement("div");
    section.style.marginBottom = "16px";
    
    const sectionTitle = document.createElement("div");
    sectionTitle.className = "connection-direction direction-incoming";
    sectionTitle.style.cssText = "font-weight: 600; margin-bottom: 8px; font-size: 12px;";
    sectionTitle.textContent = `Incoming (${connections.incoming.length})`;
    section.appendChild(sectionTitle);

    connections.incoming.forEach((conn) => {
      section.appendChild(createConnectionItem(conn, "incoming"));
    });

    listElement.appendChild(section);
  }

  // Render outgoing connections
  if (connections.outgoing.length > 0) {
    const section = document.createElement("div");
    section.style.marginBottom = "16px";
    
    const sectionTitle = document.createElement("div");
    sectionTitle.className = "connection-direction direction-outgoing";
    sectionTitle.style.cssText = "font-weight: 600; margin-bottom: 8px; font-size: 12px;";
    sectionTitle.textContent = `Outgoing (${connections.outgoing.length})`;
    section.appendChild(sectionTitle);

    connections.outgoing.forEach((conn) => {
      section.appendChild(createConnectionItem(conn, "outgoing"));
    });

    listElement.appendChild(section);
  }
}

// Highlight a specific connection (node pair)
function highlightConnection(nodeId1, nodeId2) {
  const graph = window.graph || window.getGraph?.();
  if (!graph) return;

  graph.setHighlightedNodes([nodeId1, nodeId2]);
}

// Highlight all connections
function highlightAllConnections() {
  if (!currentConnectionsNode) {
    console.warn("No node selected for connections");
    return;
  }

  const graph = window.graph || window.getGraph?.();
  if (!graph) {
    console.error("Graph instance not available");
    return;
  }

  const connections = graph.getNodeConnections(currentConnectionsNode.id);
  
  // Get all connected node IDs
  const nodeIdsToHighlight = connections.all.map((conn) => conn.node.id);
  nodeIdsToHighlight.push(currentConnectionsNode.id);

  // Set highlighted nodes
  graph.setHighlightedNodes(nodeIdsToHighlight);
}

// Focus on the current connections node
function focusOnConnectionsNode() {
  if (!currentConnectionsNode) {
    console.warn("No node selected for connections");
    return;
  }

  const graph = window.graph || window.getGraph?.();
  if (!graph) {
    console.error("Graph instance not available");
    return;
  }

  const node = graph.nodes.find((n) => n.id === currentConnectionsNode.id);
  if (!node) {
    console.error("Node not found:", currentConnectionsNode.id);
    return;
  }

  // Center the view on the node
  const canvas = graph.canvas;
  if (!canvas) {
    console.error("Canvas not available");
    return;
  }

  graph.offset.x = -node.x * graph.scale + canvas.width / 2;
  graph.offset.y = -node.y * graph.scale + canvas.height / 2;

  // Select the node
  graph.selectedNode = node;
  graph.selectedEdge = null;

  if (graph.render) {
    graph.render();
  }

  if (window.showNotification) {
    const nodeLabel = node.label || node.chineseLabel || "Unnamed Node";
    window.showNotification(`Focused on: ${nodeLabel}`);
  }
}

// Close connections dialog
function closeConnectionsDialog() {
  const dialog = document.getElementById("node-connections-dialog");
  if (dialog) {
    dialog.classList.add("hidden");
  }
  currentConnectionsNode = null;
}

// Calculate and display nodes within depth/distance constraints
function calculatePathBasedConnections() {
  if (!currentConnectionsNode) {
    console.warn("No node selected for connections");
    return;
  }

  const graph = window.graph || window.getGraph?.();
  if (!graph) {
    console.error("Graph instance not available");
    return;
  }

  // Get filter inputs
  const maxDepthInput = document.getElementById("connections-max-depth");
  const maxDistanceInput = document.getElementById("connections-max-distance");
  const conditionSelect = document.getElementById("connections-condition");

  const maxDepth = maxDepthInput.value ? parseInt(maxDepthInput.value, 10) : null;
  const maxDistance = maxDistanceInput.value ? parseFloat(maxDistanceInput.value) : null;
  const condition = conditionSelect.value || 'AND';

  // Validate inputs
  if (maxDepth === null && maxDistance === null) {
    if (window.showNotification) {
      window.showNotification("Please specify at least one constraint (Max Depth or Max Distance)", "error");
    }
    return;
  }

  if (maxDepth !== null && (maxDepth < 1 || !Number.isInteger(maxDepth))) {
    if (window.showNotification) {
      window.showNotification("Max Depth must be a positive integer", "error");
    }
    return;
  }

  if (maxDistance !== null && maxDistance < 0) {
    if (window.showNotification) {
      window.showNotification("Max Distance must be non-negative", "error");
    }
    return;
  }

  // Use the Graph method which handles filtered nodes/edges automatically
  if (!graph.getNodesWithinConstraints) {
    console.error("getNodesWithinConstraints method not available on graph");
    if (window.showNotification) {
      window.showNotification("Error: Graph method not available", "error");
    }
    return;
  }

  try {
    // Calculate results using Graph method (handles filtered nodes/edges)
    const results = graph.getNodesWithinConstraints(
      currentConnectionsNode.id,
      { maxDepth, maxDistance, condition }
    );

    // Display results in new window/tab
    displayPathResults(results, currentConnectionsNode, { maxDepth, maxDistance, condition });
  } catch (error) {
    console.error("Error calculating paths:", error);
    if (window.showNotification) {
      window.showNotification("Error calculating paths: " + error.message, "error");
    }
  }
}

// Display path results in a new window/tab
function displayPathResults(results, startNode, options) {
  const { maxDepth, maxDistance, condition } = options;
  
  // Create new window
  const newWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes');
  if (!newWindow) {
    if (window.showNotification) {
      window.showNotification("Please allow popups to view results", "error");
    }
    return;
  }

  const nodeLabel = startNode.label || startNode.chineseLabel || "Unnamed Node";
  const nodeId = startNode.id;

  // Escape HTML for safe insertion
  const escapedNodeLabel = escapeHtml(nodeLabel);
  const escapedNodeId = escapeHtml(nodeId);
  
  // Get graph instance to look up node labels for path display
  const graph = window.graph || window.getGraph?.();
  const allNodes = graph ? (graph.getFilteredNodes ? graph.getFilteredNodes() : graph.nodes) : [];
  const nodeMap = new Map(allNodes.map(n => [n.id, n]));

  // Calculate start node coordinates for Euclidean distance calculation
  const startX = typeof startNode.x === 'number' ? startNode.x : 0;
  const startY = typeof startNode.y === 'number' ? startNode.y : 0;

  // Pre-calculate Euclidean distances for all results (needed for CSV export)
  const resultsWithEuclidean = results.map(result => {
    let euclideanDistance = 'N/A';
    if (typeof result.node.x === 'number' && typeof result.node.y === 'number') {
      const dx = result.node.x - startX;
      const dy = result.node.y - startY;
      euclideanDistance = Math.sqrt(dx * dx + dy * dy).toFixed(2);
    }
    return {
      ...result,
      euclideanDistance
    };
  });

  // Build HTML content
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Path-Based Connections: ${escapedNodeLabel}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 24px;
            color: #333;
        }
        .header-info {
            color: #666;
            font-size: 14px;
            margin-bottom: 8px;
        }
        .summary {
            background: #e3f2fd;
            padding: 12px;
            border-radius: 4px;
            margin-top: 12px;
            font-size: 14px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        thead {
            background: #2196F3;
            color: white;
        }
        th {
            padding: 12px;
            text-align: left;
            font-weight: 600;
            font-size: 13px;
        }
        td {
            padding: 10px 12px;
            border-bottom: 1px solid #eee;
            font-size: 13px;
        }
        tbody tr:hover {
            background: #f5f5f5;
        }
        tbody tr:last-child td {
            border-bottom: none;
        }
        .path-cell {
            max-width: 400px;
            word-break: break-all;
            font-family: monospace;
            font-size: 11px;
            color: #555;
        }
        .node-label {
            font-weight: 500;
            color: #2196F3;
        }
        .chinese-label {
            color: #666;
            font-size: 12px;
        }
        .no-results {
            text-align: center;
            padding: 40px;
            color: #999;
            font-size: 16px;
        }
        .export-btn {
            margin-top: 20px;
            padding: 10px 20px;
            background: #2196F3;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        .export-btn:hover {
            background: #1976D2;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Path-Based Connections: ${escapedNodeLabel}</h1>
        <div class="header-info">Node ID: <code>${escapedNodeId}</code></div>
        <div class="header-info">Max Depth: ${maxDepth === null ? 'No limit' : maxDepth}</div>
        <div class="header-info">Max Distance: ${maxDistance === null ? 'No limit' : maxDistance}</div>
        <div class="header-info">Condition: ${condition}</div>
        <div class="summary">
            Found <strong>${results.length}</strong> node(s) within the specified constraints.
        </div>
    </div>`;

  if (results.length === 0) {
    html += `<div class="no-results">No nodes found within the specified constraints.</div>`;
  } else {
    html += `<table>
        <thead>
            <tr>
                <th>#</th>
                <th>Node Label</th>
                <th>Coordinates (X, Y)</th>
                <th>Radius</th>
                <th>Depth (Hops)</th>
                <th>Distance (Weight Sum)</th>
                <th>Euclidean Distance</th>
                <th>Path</th>
            </tr>
        </thead>
        <tbody>`;

    resultsWithEuclidean.forEach((result, index) => {
      const node = result.node;
      const nodeLabel = escapeHtml(node.label || "Unnamed Node");
      const chineseLabel = node.chineseLabel ? ` (${escapeHtml(node.chineseLabel)})` : "";
      const x = typeof node.x === 'number' ? Math.round(node.x) : 'N/A';
      const y = typeof node.y === 'number' ? Math.round(node.y) : 'N/A';
      const radius = typeof node.radius === 'number' ? node.radius : 'N/A';
      const euclideanDistance = result.euclideanDistance;
      
      const pathStr = result.path.map(id => {
        if (id === startNode.id) {
          return startNode.label || startNode.chineseLabel || id;
        }
        const pathNode = nodeMap.get(id);
        if (pathNode) {
          return pathNode.label || pathNode.chineseLabel || id;
        }
        return id;
      }).join(' → ');

      html += `<tr>
          <td>${index + 1}</td>
          <td>
              <span class="node-label">${nodeLabel}</span>
              ${chineseLabel ? `<span class="chinese-label">${chineseLabel}</span>` : ''}
          </td>
          <td>(${x}, ${y})</td>
          <td>${radius}</td>
          <td>${result.depth}</td>
          <td>${result.distance.toFixed(2)}</td>
          <td>${euclideanDistance}</td>
          <td class="path-cell">${escapeHtml(pathStr)}</td>
      </tr>`;
    });

    html += `</tbody></table>`;
  }

  html += `
    <button class="export-btn" onclick="exportToCSV()">Export to CSV</button>
    <script>
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        function exportToCSV() {
            const data = ${JSON.stringify(resultsWithEuclidean.map((r, i) => {
                const x = typeof r.node.x === 'number' ? Math.round(r.node.x) : 'N/A';
                const y = typeof r.node.y === 'number' ? Math.round(r.node.y) : 'N/A';
                const radius = typeof r.node.radius === 'number' ? r.node.radius : 'N/A';
                
                return {
                    index: i + 1,
                    nodeLabel: r.node.label || 'Unnamed Node',
                    chineseLabel: r.node.chineseLabel || '',
                    x: x,
                    y: y,
                    radius: radius,
                    depth: r.depth,
                    distance: r.distance.toFixed(2),
                    euclideanDistance: r.euclideanDistance,
                    path: r.path.join(' → ')
                };
            }))};
            
            const headers = ['#', 'Node Label', 'Chinese Label', 'X', 'Y', 'Radius', 'Depth', 'Distance (Weight Sum)', 'Euclidean Distance', 'Path'];
            const csv = [
                headers.join(','),
                ...data.map(row => [
                    row.index,
                    '"' + (row.nodeLabel || '').replace(/"/g, '""') + '"',
                    '"' + (row.chineseLabel || '').replace(/"/g, '""') + '"',
                    row.x,
                    row.y,
                    row.radius,
                    row.depth,
                    row.distance,
                    row.euclideanDistance,
                    '"' + row.path.replace(/"/g, '""') + '"'
                ].join(','))
            ].join('\\n');
            
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'path_connections_${escapedNodeId}.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    </script>
</body>
</html>`;

  newWindow.document.write(html);
  newWindow.document.close();

  if (window.showNotification) {
    window.showNotification(`Found ${results.length} node(s) within constraints. Results opened in new window.`);
  }
}

// Helper function to escape HTML
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Export for module system
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    showNodeDialog,
    showEdgeDialog,
    handleNodeOK,
    handleNodeCancel,
    handleNodeDelete,
    handleWeightOK,
    handleWeightCancel,
    handleWeightDelete,
    handleReverseEdgeDirection,
    showNotification,
    isValidHex,
    hexToRgb,
    rgbToHex,
    showNodeConnections,
    highlightAllConnections,
    focusOnConnectionsNode,
    closeConnectionsDialog,
    calculatePathBasedConnections,
    displayPathResults,
  };
} else {
  Object.assign(window, {
    showNodeDialog,
    showEdgeDialog,
    handleNodeOK,
    handleNodeCancel,
    handleNodeDelete,
    handleWeightOK,
    handleWeightCancel,
    handleWeightDelete,
    handleReverseEdgeDirection,
    showNotification,
    isValidHex,
    hexToRgb,
    rgbToHex,
    showNodeConnections,
    highlightAllConnections,
    focusOnConnectionsNode,
    closeConnectionsDialog,
    calculatePathBasedConnections,
    displayPathResults,
  });
}
