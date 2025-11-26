// graphRoutes.js - Routes for Graph Plugin API operations
const express = require("express");
const graphController = require("../controllers/graphController");
const { getGraphDb } = require("../src/graph-database");

const router = express.Router();

// Middleware to attach graph database to requests
router.use(async (req, res, next) => {
  try {
    req.graphDb = await getGraphDb();
    next();
  } catch (error) {
    console.error("Error attaching graph database:", error);
    res.status(500).json({ error: "Graph database connection error" });
  }
});

// Get all graph data
router.get("/", graphController.getAllGraphData);

// Create a new node
router.post("/nodes", graphController.createNode);

// Update a node
router.put("/nodes/:id", graphController.updateNode);

// Delete a node
router.delete("/nodes/:id", graphController.deleteNode);

// Create a new edge
router.post("/edges", graphController.createEdge);

// Update an edge
router.put("/edges/:id", graphController.updateEdge);

// Delete an edge
router.delete("/edges/:id", graphController.deleteEdge);

// Clear all graph data
router.delete("/clear", graphController.clearAllData);

// Import graph data (bulk insert)
router.post("/import", graphController.importGraphData);

// Save view state (scale and offset)
router.post("/view-state", graphController.saveViewState);

// Save filter state (layer filters)
router.post("/filter-state", graphController.saveFilterState);

// Load filter state (layer filters)
router.get("/filter-state", graphController.loadFilterState);

// List available database files
router.get("/databases", graphController.listDatabases);

// Switch to a different database file
router.post("/switch-database", graphController.switchDatabase);

// Save current graph to a new database file
router.post("/save-as", graphController.saveAs);

// Merge data from a source database into the current database
router.post("/merge", graphController.mergeDatabase);

module.exports = router;

