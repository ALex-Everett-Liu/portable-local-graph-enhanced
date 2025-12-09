// graphController.js - HTTP logic for Graph Plugin operations
const graphService = require("../services/graphService");
const { listDatabaseFiles, switchDatabase, getCurrentDatabasePath } = require("../src/graph-database");

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
 * Get current database file path
 * GET /api/plugins/graph/current-database
 */
exports.getCurrentDatabase = async (req, res) => {
  try {
    const dbPath = getCurrentDatabasePath();
    const path = require("path");
    const filename = path.basename(dbPath);
    
    res.json({ 
      success: true,
      filePath: dbPath,
      filename: filename
    });
  } catch (error) {
    console.error("Error getting current database:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Backup current database by copying the file directly
 * POST /api/plugins/graph/backup-database
 */
exports.backupDatabase = async (req, res) => {
  const path = require("path");
  const fs = require("fs").promises;
  const { ensureDatabaseDirectory, getCurrentDatabasePath } = require("../src/graph-database");
  
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

    // Get current database path
    const currentDbPath = getCurrentDatabasePath();
    
    // Ensure database directory exists and get its path
    const dbDir = await ensureDatabaseDirectory();
    const backupDbPath = path.join(dbDir, filename);

    // Check if file already exists
    try {
      await fs.access(backupDbPath);
      return res.status(400).json({ error: "File already exists. Please choose a different name." });
    } catch {
      // File doesn't exist, proceed
    }

    // Copy the entire database file directly (true backup - includes all tables)
    await fs.copyFile(currentDbPath, backupDbPath);

    res.json({ 
      success: true,
      message: "Database backed up successfully",
      filePath: backupDbPath,
      filename: filename
    });
  } catch (error) {
    console.error("Error backing up database:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Save current graph to a new database file
 * POST /api/plugins/graph/save-as
 */
exports.saveAs = async (req, res) => {
  const sqlite3 = require("sqlite3").verbose();
  const { open } = require("sqlite");
  const path = require("path");
  const fs = require("fs").promises;
  const { ensureDatabaseDirectory } = require("../src/graph-database");
  
  let newDb = null;
  
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

    // Export current graph data BEFORE switching databases
    const graphData = await graphService.exportGraphData(req.graphDb);

    // Ensure database directory exists and get its path
    const dbDir = await ensureDatabaseDirectory();
    const newDbPath = path.join(dbDir, filename);

    // Check if file already exists
    try {
      await fs.access(newDbPath);
      return res.status(400).json({ error: "File already exists. Please choose a different name." });
    } catch {
      // File doesn't exist, proceed
    }

    // Create a temporary connection to the new database WITHOUT switching the global manager
    // This ensures the original database remains active
    newDb = await open({
      filename: newDbPath,
      driver: sqlite3.Database,
    });

    // Initialize schema in the new database
    await initializeDatabaseSchema(newDb);

    // Import graph data to new database
    await graphService.importGraphData(newDb, graphData);

    // Close the temporary connection
    await newDb.close();
    newDb = null;

    res.json({ 
      success: true, 
      message: "Graph saved to new database file",
      filePath: newDbPath,
      filename: filename
    });
  } catch (error) {
    // Ensure we close the connection even if there's an error
    if (newDb) {
      try {
        await newDb.close();
      } catch (closeError) {
        console.error("Error closing new database connection:", closeError);
      }
    }
    console.error("Error saving as:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Create a new empty database file
 * POST /api/plugins/graph/new-database
 */
exports.createNewDatabase = async (req, res) => {
  const sqlite3 = require("sqlite3").verbose();
  const { open } = require("sqlite");
  const path = require("path");
  const fs = require("fs").promises;
  const { ensureDatabaseDirectory } = require("../src/graph-database");
  
  let newDb = null;
  
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

    // Ensure database directory exists and get its path
    const dbDir = await ensureDatabaseDirectory();
    const newDbPath = path.join(dbDir, filename);

    // Check if file already exists
    try {
      await fs.access(newDbPath);
      return res.status(400).json({ error: "File already exists. Please choose a different name." });
    } catch {
      // File doesn't exist, proceed
    }

    // Create a new empty database with schema initialized
    newDb = await open({
      filename: newDbPath,
      driver: sqlite3.Database,
    });

    // Initialize schema in the new database
    await initializeDatabaseSchema(newDb);

    // Close the connection
    await newDb.close();
    newDb = null;

    res.json({ 
      success: true,
      message: "New database file created",
      filePath: newDbPath,
      filename: filename
    });
  } catch (error) {
    // Ensure we close the connection even if there's an error
    if (newDb) {
      try {
        await newDb.close();
      } catch (closeError) {
        console.error("Error closing new database connection:", closeError);
      }
    }
    console.error("Error creating new database:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Initialize database schema for a given database connection
 * This is a helper function that doesn't rely on the global database manager
 */
async function initializeDatabaseSchema(db) {
  // Create graph_nodes table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS graph_nodes (
      id TEXT PRIMARY KEY,
      x REAL NOT NULL,
      y REAL NOT NULL,
      label TEXT NOT NULL,
      color TEXT DEFAULT '#3b82f6',
      radius REAL DEFAULT 20,
      created_at INTEGER,
      updated_at INTEGER
    )
  `);

  // Create graph_edges table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS graph_edges (
      id TEXT PRIMARY KEY,
      from_node_id TEXT NOT NULL,
      to_node_id TEXT NOT NULL,
      weight REAL DEFAULT 1.0,
      created_at INTEGER,
      updated_at INTEGER,
      FOREIGN KEY (from_node_id) REFERENCES graph_nodes (id) ON DELETE CASCADE,
      FOREIGN KEY (to_node_id) REFERENCES graph_nodes (id) ON DELETE CASCADE
    )
  `);

  // Create graph_metadata table for storing view state (scale, offset)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS graph_metadata (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      scale REAL DEFAULT 1.0,
      offset_x REAL DEFAULT 0,
      offset_y REAL DEFAULT 0,
      updated_at INTEGER
    )
  `);

  // Create indexes for better performance
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_graph_edges_from ON graph_edges(from_node_id);
    CREATE INDEX IF NOT EXISTS idx_graph_edges_to ON graph_edges(to_node_id);
  `);

  // Add sequence_id columns to graph_nodes and graph_edges tables
  try {
    await db.exec(`ALTER TABLE graph_nodes ADD COLUMN sequence_id INTEGER;`);
    await db.exec(
      `CREATE INDEX IF NOT EXISTS idx_graph_nodes_sequence_id ON graph_nodes(sequence_id);`,
    );
  } catch (error) {
    // Column or index already exists, ignore
  }

  try {
    await db.exec(`ALTER TABLE graph_edges ADD COLUMN sequence_id INTEGER;`);
    await db.exec(
      `CREATE INDEX IF NOT EXISTS idx_graph_edges_sequence_id ON graph_edges(sequence_id);`,
    );
  } catch (error) {
    // Column or index already exists, ignore
  }

  // Add chinese_label column to graph_nodes table
  try {
    await db.exec(`ALTER TABLE graph_nodes ADD COLUMN chinese_label TEXT;`);
  } catch (error) {
    // Column already exists, ignore
  }

  // Add category column to graph_nodes table
  try {
    await db.exec(`ALTER TABLE graph_nodes ADD COLUMN category TEXT;`);
  } catch (error) {
    // Column already exists, ignore
  }

  // Add category column to graph_edges table
  try {
    await db.exec(`ALTER TABLE graph_edges ADD COLUMN category TEXT;`);
  } catch (error) {
    // Column already exists, ignore
  }

  // Add layers column to graph_nodes table
  try {
    await db.exec(`ALTER TABLE graph_nodes ADD COLUMN layers TEXT;`);
  } catch (error) {
    // Column already exists, ignore
  }

  // Create filter_state table for storing layer filter state
  await db.exec(`
    CREATE TABLE IF NOT EXISTS filter_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      layer_filter_enabled INTEGER DEFAULT 0,
      layer_filter_active_layers TEXT DEFAULT '[]',
      layer_filter_mode TEXT DEFAULT 'include',
      updated_at INTEGER
    )
  `);

  // Create semantic_map_embeddings table for storing text embeddings
  await db.exec(`
    CREATE TABLE IF NOT EXISTS semantic_map_embeddings (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      title TEXT,
      embedding_model TEXT NOT NULL,
      embedding_data TEXT NOT NULL,
      x_2d REAL,
      y_2d REAL,
      created_at INTEGER,
      updated_at INTEGER
    )
  `);

  // Create index for better query performance
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_semantic_map_embeddings_model 
    ON semantic_map_embeddings(embedding_model);
  `);
}

/**
 * Export all database tables
 * GET /api/plugins/graph/export?format=json|csv
 */
exports.exportAllTables = async (req, res) => {
  try {
    const { format } = req.query; // 'json' or 'csv'
    
    if (!format || (format !== 'json' && format !== 'csv')) {
      return res.status(400).json({ error: "Format must be 'json' or 'csv'" });
    }
    
    const data = await graphService.exportAllTables(req.graphDb);
    
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="graph-export-${Date.now()}.json"`);
      res.json(data);
    } else if (format === 'csv') {
      // Convert to CSV format
      const csvData = convertToCSV(data);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="graph-export-${Date.now()}.json"`);
      // Return JSON with CSV strings for each table (client will create files)
      res.json(csvData);
    }
  } catch (error) {
    console.error("Error exporting tables:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Convert data to CSV format
 * Returns JSON object with CSV strings for each table
 */
function convertToCSV(data) {
  const csvFiles = {};
  
  // Convert each table to CSV
  for (const [tableName, rows] of Object.entries(data)) {
    if (tableName === 'exportedAt') {
      csvFiles[tableName] = data.exportedAt;
      continue;
    }
    
    if (!rows || rows.length === 0) {
      csvFiles[tableName] = '';
      continue;
    }
    
    // Get headers from first row
    const headers = Object.keys(rows[0]);
    const csvRows = [headers.join(',')];
    
    // Convert each row
    for (const row of rows) {
      const values = headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        // Escape commas and quotes in CSV
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      csvRows.push(values.join(','));
    }
    
    csvFiles[tableName] = csvRows.join('\n');
  }
  
  return csvFiles;
}

/**
 * Merge data from a source database into the current database
 * POST /api/plugins/graph/merge
 */
exports.mergeDatabase = async (req, res) => {
  try {
    const { sourceDbPath, conflictResolution } = req.body;
    
    if (!sourceDbPath) {
      return res.status(400).json({ error: "sourceDbPath is required" });
    }
    
    // Validate conflict resolution
    const validResolutions = ['skip', 'replace', 'rename'];
    const resolution = conflictResolution || 'skip';
    if (!validResolutions.includes(resolution)) {
      return res.status(400).json({ error: `conflictResolution must be one of: ${validResolutions.join(', ')}` });
    }
    
    // Validate source database file exists
    const fs = require("fs").promises;
    try {
      await fs.access(sourceDbPath);
    } catch {
      return res.status(400).json({ error: "Source database file not found" });
    }
    
    // Perform merge
    const stats = await graphService.mergeFromDatabase(req.graphDb, sourceDbPath, resolution);
    
    res.json({
      success: true,
      message: "Database merged successfully",
      stats
    });
  } catch (error) {
    console.error("Error merging database:", error);
    res.status(500).json({ error: error.message });
  }
};

