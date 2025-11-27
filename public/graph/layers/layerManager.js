/**
 * Layer Management Module
 * Handles layer-related operations: getting layers, filtering, renaming
 */

/**
 * Get all unique layers from nodes
 * @param {Array} nodes - Array of nodes
 * @returns {Array} Sorted array of unique layer names
 */
export function getAllLayers(nodes) {
  const layerSet = new Set();
  nodes.forEach((node) => {
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

/**
 * Rename a layer across all nodes
 * @param {Array} nodes - Array of nodes
 * @param {Set} activeLayers - Set of active layers
 * @param {string} oldName - Old layer name
 * @param {string} newName - New layer name
 * @param {Function} onNodeUpdate - Callback for node updates
 * @returns {Object} Result object with success status and message
 */
export function renameLayer(nodes, activeLayers, oldName, newName, onNodeUpdate) {
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
  const allLayers = getAllLayers(nodes);
  if (allLayers.includes(trimmedNewName) && trimmedNewName !== oldName) {
    return {
      success: false,
      message: `Layer "${trimmedNewName}" already exists`,
    };
  }

  // Rename layers in all nodes
  let renamedCount = 0;
  nodes.forEach((node) => {
    if (node.layers && Array.isArray(node.layers)) {
      const index = node.layers.indexOf(oldName);
      if (index !== -1) {
        node.layers[index] = trimmedNewName;
        renamedCount++;

        // Update node in database if callback exists
        if (onNodeUpdate) {
          onNodeUpdate(node);
        }
      }
    }
  });

  // Update active layers if old name was active
  if (activeLayers.has(oldName)) {
    activeLayers.delete(oldName);
    activeLayers.add(trimmedNewName);
  }

  return {
    success: true,
    message: `Renamed layer "${oldName}" to "${trimmedNewName}" in ${renamedCount} node(s)`,
  };
}

/**
 * Get layer usage statistics
 * @param {Array} nodes - Array of nodes
 * @param {string} layerName - Layer name to check
 * @returns {Object} Object with count and nodes array
 */
export function getLayerUsage(nodes, layerName) {
  const nodesWithLayer = nodes.filter((node) => {
    return (
      node.layers &&
      Array.isArray(node.layers) &&
      node.layers.includes(layerName)
    );
  });

  return {
    count: nodesWithLayer.length,
    nodes: nodesWithLayer,
  };
}

