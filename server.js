const express = require("express");
const cors = require("cors");
const path = require("path");
const {
  getGraphDb,
  initializeGraphDatabase,
  populateGraphSequenceIds,
} = require("./src/graph-database");
const graphRoutes = require("./routes/graphRoutes");

const app = express();
const PORT = process.env.PORT || 6825;

// Middleware
app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "public")));

// Initialize graph database
initializeGraphDatabase()
  .then(() => {
    console.log("Graph database initialized");
    return populateGraphSequenceIds();
  })
  .then((result) => {
    console.log("Graph sequence IDs populated:", result);
  })
  .catch((err) => {
    console.error("Error initializing graph database:", err);
  });

// Graph plugin routes
app.use("/api/plugins/graph", graphRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Graph App server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});

module.exports = app;
