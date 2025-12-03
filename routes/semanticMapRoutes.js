// semanticMapRoutes.js - Routes for Semantic Map API operations
const express = require("express");
const semanticMapController = require("../controllers/semanticMapController");
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

// Get all embeddings
router.get("/embeddings", semanticMapController.getAllEmbeddings);

// Get a single embedding by ID
router.get("/embeddings/:id", semanticMapController.getEmbeddingById);

// Create a new embedding
router.post("/embeddings", semanticMapController.createEmbedding);

// Update embedding 2D coordinates
router.put("/embeddings/:id/2d", semanticMapController.updateEmbedding2D);

// Batch update embeddings' 2D coordinates
router.put("/embeddings/2d/batch", semanticMapController.updateEmbeddings2DBatch);

// Delete an embedding
router.delete("/embeddings/:id", semanticMapController.deleteEmbedding);

// Delete all embeddings
router.delete("/embeddings", semanticMapController.deleteAllEmbeddings);

// Generate embedding from text
router.post("/embeddings/generate", semanticMapController.generateEmbedding);

module.exports = router;

