// semanticMapController.js - HTTP request handlers for Semantic Map operations
const semanticMapService = require("../services/semanticMapService");

/**
 * Get all embeddings
 */
async function getAllEmbeddings(req, res) {
  try {
    const { model } = req.query;
    const embeddings = await semanticMapService.getAllEmbeddings(req.graphDb, model);
    res.json({ embeddings });
  } catch (error) {
    console.error("Error getting embeddings:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get a single embedding by ID
 */
async function getEmbeddingById(req, res) {
  try {
    const { id } = req.params;
    const embedding = await semanticMapService.getEmbeddingById(req.graphDb, id);
    
    if (!embedding) {
      return res.status(404).json({ error: "Embedding not found" });
    }
    
    res.json({ embedding });
  } catch (error) {
    console.error("Error getting embedding:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Create a new embedding
 */
async function createEmbedding(req, res) {
  try {
    const { text, title, embeddingModel, embeddingData, x2d, y2d } = req.body;
    
    if (!text || !embeddingModel || !embeddingData) {
      return res.status(400).json({ 
        error: "Missing required fields: text, embeddingModel, embeddingData" 
      });
    }
    
    const embedding = await semanticMapService.createEmbedding(req.graphDb, {
      text,
      title,
      embeddingModel,
      embeddingData,
      x2d,
      y2d,
    });
    
    res.status(201).json({ embedding });
  } catch (error) {
    console.error("Error creating embedding:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Update embedding 2D coordinates
 */
async function updateEmbedding2D(req, res) {
  try {
    const { id } = req.params;
    const { x2d, y2d } = req.body;
    
    if (x2d === undefined || y2d === undefined) {
      return res.status(400).json({ 
        error: "Missing required fields: x2d, y2d" 
      });
    }
    
    const embedding = await semanticMapService.updateEmbedding2D(
      req.graphDb,
      id,
      x2d,
      y2d
    );
    
    if (!embedding) {
      return res.status(404).json({ error: "Embedding not found" });
    }
    
    res.json({ embedding });
  } catch (error) {
    console.error("Error updating embedding 2D:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Batch update embeddings' 2D coordinates
 */
async function updateEmbeddings2DBatch(req, res) {
  try {
    const { coordinates } = req.body;
    
    if (!Array.isArray(coordinates) || coordinates.length === 0) {
      return res.status(400).json({ 
        error: "coordinates must be a non-empty array" 
      });
    }
    
    // Validate each coordinate object
    for (const coord of coordinates) {
      if (!coord.id || coord.x2d === undefined || coord.y2d === undefined) {
        return res.status(400).json({ 
          error: "Each coordinate must have id, x2d, and y2d" 
        });
      }
    }
    
    await semanticMapService.updateEmbeddings2DBatch(req.graphDb, coordinates);
    res.json({ success: true, updated: coordinates.length });
  } catch (error) {
    console.error("Error batch updating embeddings 2D:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Delete an embedding
 */
async function deleteEmbedding(req, res) {
  try {
    const { id } = req.params;
    const deleted = await semanticMapService.deleteEmbedding(req.graphDb, id);
    
    if (!deleted) {
      return res.status(404).json({ error: "Embedding not found" });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting embedding:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Delete all embeddings
 */
async function deleteAllEmbeddings(req, res) {
  try {
    await semanticMapService.deleteAllEmbeddings(req.graphDb);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting all embeddings:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Generate embedding from text
 */
async function generateEmbedding(req, res) {
  try {
    const { text, provider, apiKey, model } = req.body;
    
    if (!text || !provider || !apiKey) {
      return res.status(400).json({ 
        error: "Missing required fields: text, provider, apiKey" 
      });
    }
    
    const embedding = await semanticMapService.generateEmbedding(
      text,
      provider,
      apiKey,
      model
    );
    
    res.json({ embedding });
  } catch (error) {
    console.error("Error generating embedding:", error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getAllEmbeddings,
  getEmbeddingById,
  createEmbedding,
  updateEmbedding2D,
  updateEmbeddings2DBatch,
  deleteEmbedding,
  deleteAllEmbeddings,
  generateEmbedding,
};

