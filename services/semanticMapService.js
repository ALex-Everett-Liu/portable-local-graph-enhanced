// semanticMapService.js - Business logic for Semantic Map operations
const { v7: uuidv7 } = require("uuid");
const https = require("https");
const http = require("http");

/**
 * Get all embeddings
 * @param {Object} graphDb - Database connection
 * @param {string} model - Optional filter by embedding model
 * @returns {Promise<Array>} Array of embeddings
 */
async function getAllEmbeddings(graphDb, model = null) {
  let query = "SELECT * FROM semantic_map_embeddings";
  const params = [];
  
  if (model) {
    query += " WHERE embedding_model = ?";
    params.push(model);
  }
  
  query += " ORDER BY created_at DESC";
  
  return await graphDb.all(query, params);
}

/**
 * Get a single embedding by ID
 * @param {Object} graphDb - Database connection
 * @param {string} id - Embedding ID
 * @returns {Promise<Object|null>} Embedding object or null
 */
async function getEmbeddingById(graphDb, id) {
  return await graphDb.get(
    "SELECT * FROM semantic_map_embeddings WHERE id = ?",
    [id]
  );
}

/**
 * Create a new embedding
 * @param {Object} graphDb - Database connection
 * @param {Object} embeddingData - Embedding data
 * @returns {Promise<Object>} Created embedding
 */
async function createEmbedding(graphDb, embeddingData) {
  const id = uuidv7();
  const now = Date.now();
  
  const {
    text,
    title,
    embeddingModel,
    embeddingData: embedding,
    x2d = null,
    y2d = null,
  } = embeddingData;

  await graphDb.run(
    `INSERT INTO semantic_map_embeddings 
     (id, text, title, embedding_model, embedding_data, x_2d, y_2d, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      text,
      title || null,
      embeddingModel,
      JSON.stringify(embedding),
      x2d,
      y2d,
      now,
      now,
    ]
  );

  return await getEmbeddingById(graphDb, id);
}

/**
 * Update embedding 2D coordinates (after dimensionality reduction)
 * @param {Object} graphDb - Database connection
 * @param {string} id - Embedding ID
 * @param {number} x2d - X coordinate in 2D space
 * @param {number} y2d - Y coordinate in 2D space
 * @returns {Promise<Object>} Updated embedding
 */
async function updateEmbedding2D(graphDb, id, x2d, y2d) {
  const now = Date.now();
  
  await graphDb.run(
    `UPDATE semantic_map_embeddings 
     SET x_2d = ?, y_2d = ?, updated_at = ?
     WHERE id = ?`,
    [x2d, y2d, now, id]
  );

  return await getEmbeddingById(graphDb, id);
}

/**
 * Update multiple embeddings' 2D coordinates (batch update)
 * @param {Object} graphDb - Database connection
 * @param {Array} coordinates - Array of {id, x2d, y2d} objects
 * @returns {Promise<boolean>} Success status
 */
async function updateEmbeddings2DBatch(graphDb, coordinates) {
  const now = Date.now();
  
  await graphDb.run("BEGIN TRANSACTION");
  
  try {
    for (const coord of coordinates) {
      await graphDb.run(
        `UPDATE semantic_map_embeddings 
         SET x_2d = ?, y_2d = ?, updated_at = ?
         WHERE id = ?`,
        [coord.x2d, coord.y2d, now, coord.id]
      );
    }
    
    await graphDb.run("COMMIT");
    return true;
  } catch (error) {
    await graphDb.run("ROLLBACK");
    throw error;
  }
}

/**
 * Delete an embedding
 * @param {Object} graphDb - Database connection
 * @param {string} id - Embedding ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteEmbedding(graphDb, id) {
  const result = await graphDb.run(
    "DELETE FROM semantic_map_embeddings WHERE id = ?",
    [id]
  );
  
  return result.changes > 0;
}

/**
 * Delete all embeddings
 * @param {Object} graphDb - Database connection
 * @returns {Promise<boolean>} Success status
 */
async function deleteAllEmbeddings(graphDb) {
  await graphDb.run("DELETE FROM semantic_map_embeddings");
  return true;
}

/**
 * Generate embedding using OpenAI API
 * @param {string} text - Text to embed
 * @param {string} apiKey - OpenAI API key
 * @param {string} model - Model name (default: text-embedding-3-small)
 * @returns {Promise<Array>} Embedding vector
 */
async function generateEmbeddingOpenAI(text, apiKey, model = "text-embedding-3-small") {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      input: text,
      model: model,
    });

    const options = {
      hostname: "api.openai.com",
      path: "/v1/embeddings",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "Content-Length": data.length,
      },
    };

    const req = https.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        try {
          const parsed = JSON.parse(responseData);
          if (parsed.error) {
            reject(new Error(parsed.error.message || "OpenAI API error"));
          } else if (parsed.data && parsed.data[0] && parsed.data[0].embedding) {
            resolve(parsed.data[0].embedding);
          } else {
            reject(new Error("Invalid response from OpenAI API"));
          }
        } catch (error) {
          reject(new Error(`Failed to parse OpenAI response: ${error.message}`));
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Generate embedding using OpenRouter API
 * @param {string} text - Text to embed
 * @param {string} apiKey - OpenRouter API key
 * @param {string} model - Model name (default: BAAI/bge-m3)
 * @returns {Promise<Array>} Embedding vector
 */
async function generateEmbeddingOpenRouter(text, apiKey, model = "BAAI/bge-m3") {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      input: text,
      model: model,
    });

    const options = {
      hostname: "openrouter.ai",
      path: "/api/v1/embeddings",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "http://localhost:6825",
        "X-Title": "Graph App Semantic Map",
        "Content-Length": data.length,
      },
    };

    const req = https.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        try {
          const parsed = JSON.parse(responseData);
          if (parsed.error) {
            reject(new Error(parsed.error.message || "OpenRouter API error"));
          } else if (parsed.data && parsed.data[0] && parsed.data[0].embedding) {
            resolve(parsed.data[0].embedding);
          } else {
            reject(new Error("Invalid response from OpenRouter API"));
          }
        } catch (error) {
          reject(new Error(`Failed to parse OpenRouter response: ${error.message}`));
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Generate embedding using SiliconFlow API (BAAI/bge-m3)
 * @param {string} text - Text to embed
 * @param {string} apiKey - SiliconFlow API key
 * @param {string} model - Model name (default: BAAI/bge-m3)
 * @returns {Promise<Array>} Embedding vector
 */
async function generateEmbeddingSiliconFlow(text, apiKey, model = "BAAI/bge-m3") {
  return new Promise((resolve, reject) => {
    // Validate input
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      reject(new Error("Input text must be a non-empty string"));
      return;
    }
    
    // Validate model name
    const validModels = [
      "BAAI/bge-large-zh-v1.5",
      "BAAI/bge-large-en-v1.5",
      "netease-youdao/bce-embedding-base_v1",
      "BAAI/bge-m3",
      "Pro/BAAI/bge-m3",
      "Qwen/Qwen3-Embedding-8B",
      "Qwen/Qwen3-Embedding-4B",
      "Qwen/Qwen3-Embedding-0.6B"
    ];
    
    if (!validModels.includes(model)) {
      console.warn(`[SiliconFlow] Model ${model} not in validated list, but proceeding anyway`);
    }
    
    // SiliconFlow API expects: { model: "...", input: "..." or ["..."] }
    // According to docs, input can be string or array of strings
    // Some examples show array format, so let's try array format first
    const trimmedText = text.trim();
    const requestBody = {
      model: model,
      input: [trimmedText], // Use array format as shown in some examples
    };
    
    const data = JSON.stringify(requestBody);
    
    console.log(`[SiliconFlow] Request: POST https://api.siliconflow.cn/v1/embeddings`);
    console.log(`[SiliconFlow] Model: ${model}`);
    console.log(`[SiliconFlow] Input: "${trimmedText.substring(0, 100)}${trimmedText.length > 100 ? '...' : ''}"`);
    console.log(`[SiliconFlow] Request body: ${data}`);

    const options = {
      hostname: "api.siliconflow.cn",
      path: "/v1/embeddings",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "Content-Length": Buffer.byteLength(data, 'utf8'), // Use byte length, not string length
      },
    };
    
    console.log(`[SiliconFlow] Headers:`, JSON.stringify(options.headers, null, 2).replace(apiKey, '***REDACTED***'));

    const req = https.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        try {
          console.log(`[SiliconFlow] Response status: ${res.statusCode}`);
          console.log(`[SiliconFlow] Response length: ${responseData.length} bytes`);
          
          // Check HTTP status code
          if (res.statusCode < 200 || res.statusCode >= 300) {
            let errorMessage = `SiliconFlow API returned status ${res.statusCode}`;
            console.error(`[SiliconFlow] Error response: ${responseData.substring(0, 500)}`);
            try {
              const errorData = JSON.parse(responseData);
              if (errorData.error) {
                errorMessage = errorData.error.message || errorData.error || errorMessage;
              } else if (errorData.message) {
                errorMessage = errorData.message;
              }
            } catch (e) {
              // If we can't parse error, use raw response
              errorMessage = responseData || errorMessage;
            }
            reject(new Error(errorMessage));
            return;
          }

          const parsed = JSON.parse(responseData);
          
          // Check for API-level errors
          if (parsed.error) {
            reject(new Error(parsed.error.message || parsed.error || "SiliconFlow API error"));
            return;
          }
          
          // Parse response according to SiliconFlow API format
          // Response format: { model: "...", data: [{ object: "embedding", embedding: [...], index: 0 }] }
          if (parsed.data && Array.isArray(parsed.data) && parsed.data.length > 0) {
            // When input is an array, response.data is an array with one item per input
            // Since we send a single item array, we get back a single item
            const embeddingData = parsed.data[0];
            if (embeddingData && embeddingData.embedding && Array.isArray(embeddingData.embedding)) {
              console.log(`[SiliconFlow] Successfully generated embedding with ${embeddingData.embedding.length} dimensions`);
              resolve(embeddingData.embedding);
            } else {
              console.error(`[SiliconFlow] Invalid response format:`, JSON.stringify(parsed.data[0]).substring(0, 200));
              reject(new Error("Invalid response format: missing embedding array"));
            }
          } else {
            console.error(`[SiliconFlow] Invalid response structure:`, JSON.stringify(parsed).substring(0, 500));
            reject(new Error(`Invalid response from SiliconFlow API: ${JSON.stringify(parsed).substring(0, 200)}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse SiliconFlow response: ${error.message}. Response: ${responseData.substring(0, 200)}`));
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Generate embedding based on provider
 * @param {string} text - Text to embed
 * @param {string} provider - Provider name (openai, openrouter, siliconflow)
 * @param {string} apiKey - API key
 * @param {string} model - Model name
 * @returns {Promise<Array>} Embedding vector
 */
async function generateEmbedding(text, provider, apiKey, model) {
  switch (provider.toLowerCase()) {
    case "openai":
      return await generateEmbeddingOpenAI(text, apiKey, model);
    case "openrouter":
      return await generateEmbeddingOpenRouter(text, apiKey, model);
    case "siliconflow":
      return await generateEmbeddingSiliconFlow(text, apiKey, model);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * Calculate cosine similarity between two vectors
 * @param {Array<number>} vecA - First vector
 * @param {Array<number>} vecB - Second vector
 * @returns {number} Cosine similarity score (0 to 1)
 */
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Perform semantic search on embeddings
 * @param {Object} graphDb - Database connection
 * @param {string} queryText - Text to search for
 * @param {string} provider - Provider name (openai, openrouter, siliconflow)
 * @param {string} apiKey - API key
 * @param {string} model - Model name
 * @param {number} limit - Maximum number of results (default: 10)
 * @returns {Promise<Array>} Array of results with similarity scores, sorted by score descending
 */
async function semanticSearch(graphDb, queryText, provider, apiKey, model, limit = 10) {
  // Generate embedding for query text
  const queryEmbedding = await generateEmbedding(queryText, provider, apiKey, model);

  // Get all embeddings from database
  const allEmbeddings = await getAllEmbeddings(graphDb);

  if (allEmbeddings.length === 0) {
    return [];
  }

  // Calculate similarity scores
  const results = allEmbeddings.map(embedding => {
    try {
      const storedEmbedding = JSON.parse(embedding.embedding_data);
      const similarity = cosineSimilarity(queryEmbedding, storedEmbedding);

      return {
        id: embedding.id,
        text: embedding.text,
        title: embedding.title,
        embeddingModel: embedding.embedding_model,
        similarity: similarity,
        x2d: embedding.x_2d,
        y2d: embedding.y_2d,
        createdAt: embedding.created_at,
      };
    } catch (error) {
      console.error(`Error parsing embedding ${embedding.id}:`, error);
      return null;
    }
  }).filter(result => result !== null); // Remove any failed parsing results

  // Sort by similarity (descending) and return top N
  results.sort((a, b) => b.similarity - a.similarity);
  return results.slice(0, limit);
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
  generateEmbeddingOpenAI,
  generateEmbeddingOpenRouter,
  generateEmbeddingSiliconFlow,
  semanticSearch,
  cosineSimilarity,
};

