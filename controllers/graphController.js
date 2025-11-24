// graphController.js - HTTP logic for Graph Plugin operations
const graphService = require("../services/graphService");
const { listDatabaseFiles, switchDatabase } = require("../src/graph-database");

/**
 * Get all graph data
 * GET /api/plugins/graph
 */
exports.getAllGraphData = async (req, res) => {
  try {
    const graphData = await graphService.getAllGraphData(req.graphDb);
    res.json(graphData);
  } catch (error) {
    console.error("Error fetching graph data:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Create a new node
 * POST /api/plugins/graph/nodes
 */
exports.createNode = async (req, res) => {
  try {
    const node = await graphService.createNode(req.graphDb, req.body);
    res.json(node);
  } catch (error) {
    console.error("Error creating node:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update a node
 * PUT /api/plugins/graph/nodes/:id
 */
exports.updateNode = async (req, res) => {
  try {
    const { id } = req.params;
    const node = await graphService.updateNode(req.graphDb, id, req.body);
    res.json(node);
  } catch (error) {
    console.error("Error updating node:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete a node
 * DELETE /api/plugins/graph/nodes/:id
 */
exports.deleteNode = async (req, res) => {
  try {
    const { id } = req.params;
    await graphService.deleteNode(req.graphDb, id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting node:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Create a new edge
 * POST /api/plugins/graph/edges
 */
exports.createEdge = async (req, res) => {
  try {
    const edge = await graphService.createEdge(req.graphDb, req.body);
    res.json(edge);
  } catch (error) {
    console.error("Error creating edge:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update an edge
 * PUT /api/plugins/graph/edges/:id
 */
exports.updateEdge = async (req, res) => {
  try {
    const { id } = req.params;
    const edge = await graphService.updateEdge(req.graphDb, id, req.body);
    res.json(edge);
  } catch (error) {
    console.error("Error updating edge:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete an edge
 * DELETE /api/plugins/graph/edges/:id
 */
exports.deleteEdge = async (req, res) => {
  try {
    const { id } = req.params;
    await graphService.deleteEdge(req.graphDb, id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting edge:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Clear all graph data
 * DELETE /api/plugins/graph/clear
 */
exports.clearAllData = async (req, res) => {
  try {
    await graphService.clearAllData(req.graphDb);
    res.json({ success: true });
  } catch (error) {
    console.error("Error clearing graph data:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Import graph data (bulk insert)
 * POST /api/plugins/graph/import
 */
exports.importGraphData = async (req, res) => {
  try {
    const imported = await graphService.importGraphData(req.graphDb, req.body);
    res.json({
      success: true,
      imported,
    });
  } catch (error) {
    console.error("Error importing graph data:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Save view state (scale and offset)
 * POST /api/plugins/graph/view-state
 */
exports.saveViewState = async (req, res) => {
  try {
    await graphService.saveViewState(req.graphDb, req.body);
    res.json({ success: true });
  } catch (error) {
    console.error("Error saving view state:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Save filter state (layer filters)
 * POST /api/plugins/graph/filter-state
 */
exports.saveFilterState = async (req, res) => {
  try {
    await graphService.saveFilterState(req.graphDb, req.body);
    res.json({ success: true });
  } catch (error) {
    console.error("Error saving filter state:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Load filter state (layer filters)
 * GET /api/plugins/graph/filter-state
 */
exports.loadFilterState = async (req, res) => {
  try {
    const filterState = await graphService.loadFilterState(req.graphDb);
    res.json({ filterState });
  } catch (error) {
    console.error("Error loading filter state:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * List available database files
 * GET /api/plugins/graph/databases
 */
exports.listDatabases = async (req, res) => {
  try {
    const databases = await listDatabaseFiles();
    res.json({ databases });
  } catch (error) {
    console.error("Error listing databases:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Switch to a different database file
 * POST /api/plugins/graph/switch-database
 */
exports.switchDatabase = async (req, res) => {
  try {
    const { filePath } = req.body;
    if (!filePath) {
      return res.status(400).json({ error: "filePath is required" });
    }
    
    await switchDatabase(filePath);
    
    res.json({ success: true, message: "Database switched successfully" });
  } catch (error) {
    console.error("Error switching database:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Save current graph to a new database file
 * POST /api/plugins/graph/save-as
 */
exports.saveAs = async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ error: "filename is required" });
    }

    // Validate filename
    if (!filename.endsWith('.db')) {
      return res.status(400).json({ error: "Filename must end with .db" });
    }

    // Validate filename doesn't contain path separators
    if (filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: "Filename cannot contain path separators" });
    }

    // Export current graph data
    const graphData = await graphService.exportGraphData(req.graphDb);

    // Create new database file path in the database directory
    const path = require("path");
    const { getDatabaseDirectory, ensureDatabaseDirectory } = require("../src/graph-database");
    
    // Ensure database directory exists and get its path
    const dbDir = await ensureDatabaseDirectory();
    const newDbPath = path.join(dbDir, filename);

    // Check if file already exists
    const fs = require("fs").promises;
    try {
      await fs.access(newDbPath);
      return res.status(400).json({ error: "File already exists. Please choose a different name." });
    } catch {
      // File doesn't exist, proceed
    }

    // Switch to new database (this will create it)
    await switchDatabase(newDbPath);

    // Import graph data to new database
    const newDb = await require("../src/graph-database").getGraphDb();
    await graphService.importGraphData(newDb, graphData);

    res.json({ 
      success: true, 
      message: "Graph saved to new database file",
      filePath: newDbPath,
      filename: filename
    });
  } catch (error) {
    console.error("Error saving as:", error);
    res.status(500).json({ error: error.message });
  }
};

