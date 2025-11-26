# Graph App

An independent desktop application for creating and visualizing graph networks. This is a standalone version of the Graph Plugin extracted from the Luhmann Roam project.

## Features

### Core Features
- **Node Creation**: Click to add nodes to the graph
- **Edge Creation**: Connect nodes by clicking on two nodes or via search dialog
- **Interactive Editing**: Drag nodes, edit properties via context menu
- **Persistent Storage**: All data is saved to a local SQLite database
- **Change Tracking**: Track unsaved changes with save/discard functionality
- **Visual Feedback**: Color-coded nodes, weighted edges, tooltips

### Advanced Features
- **Search & Navigation**: Inline search bar and advanced search dialog with keyboard navigation
- **Layer Management**: Organize nodes into layers with filtering and persistence
- **Smart Selection**: Overlap detection and cycling through overlapping elements
- **View Connections**: See all connections for any node with categorized display
- **Edge Flow Visualization**: Animated particles showing edge direction
- **Database Operations**: Load, save, merge databases with conflict resolution
- **Canvas Navigation**: Pan and zoom with view state persistence
- **Bilingual Support**: English and Chinese labels for nodes
- **Categories**: Tag nodes and edges with categories for organization

> 📖 **For detailed usage instructions, see the [User Guide](docs/USER_GUIDE.md)**

## Installation

1. Install dependencies:
```bash
npm install
```

## Running the App

### Development Mode
```bash
npm start
```

This will:
- Start the Express server on port 3004
- Launch the Electron desktop app
- Open DevTools automatically

### Build for Distribution
```bash
npm run build
```

This creates a distributable package using electron-builder.

## Project Structure

```
graph-app/
├── main.js              # Electron main process
├── server.js            # Express server for API
├── package.json         # Dependencies and scripts
├── public/              # Frontend files
│   ├── index.html       # Main HTML file
│   ├── app.js           # Application logic
│   └── graph.js         # Graph visualization class
├── data/                # Database files (created automatically)
│   └── graph.db         # Main database file
├── src/                 # Backend source files
│   └── graph-database.js # Database initialization
├── controllers/         # HTTP request handlers
│   └── graphController.js
├── routes/              # Express routes
│   └── graphRoutes.js
└── services/            # Business logic
    └── graphService.js
```

## Quick Start

### Basic Usage

1. **Select Mode** (default): Click and drag nodes, select edges
2. **Add Node Mode**: Click anywhere to add a new node
3. **Add Edge Mode**: Click on two nodes to connect them

### Quick Actions

- **Right-click** on a node or edge to open context menu for editing/deleting
- **Search**: Use the search bar in toolbar to find nodes quickly
- **Save Changes**: Click "Save Changes" button in sidebar to persist modifications
- **Pan & Zoom**: Drag empty canvas to pan, scroll wheel to zoom

### Documentation

- **[User Guide](docs/USER_GUIDE.md)**: Complete step-by-step guide for all features
- **[Architecture](docs/ARCHITECTURE.md)**: Technical architecture documentation
- **[Development Guide](docs/DEVELOPMENT_GUIDE.md)**: Guidelines for contributors

## Database

The app uses SQLite database files stored in the `data/` directory (created automatically at project root). By default, the main database file is `data/graph.db`.

### Database Directory Configuration

- **Default location**: `data/` directory at project root
- **Custom location**: Set `GRAPH_DB_DIR` environment variable to specify a custom directory
  ```bash
  # Example: Use custom directory
  export GRAPH_DB_DIR=/path/to/custom/directory
  npm start
  ```

### Database Files

All database files (`.db`) are stored in the configured directory:
- Main database: `graph.db`
- Additional databases: Created via "Save As" functionality
- Database files are automatically created if the directory doesn't exist

### Database Schema

The database stores:
- Nodes: position, label, color, radius, full content, layers, categories
- Edges: connections between nodes with weights and categories
- View state: canvas scale and offset (pan/zoom state)
- Sequence IDs: for maintaining creation order

## API Endpoints

All endpoints are prefixed with `/api/plugins/graph`:

### Graph Data
- `GET /` - Get all graph data
- `POST /import` - Import graph data (bulk)
- `DELETE /clear` - Clear all data

### Nodes
- `POST /nodes` - Create a node
- `PUT /nodes/:id` - Update a node
- `DELETE /nodes/:id` - Delete a node

### Edges
- `POST /edges` - Create an edge
- `PUT /edges/:id` - Update an edge
- `DELETE /edges/:id` - Delete an edge

### Database Operations
- `GET /databases` - List all database files
- `POST /switch-database` - Switch to a different database
- `POST /save-as` - Save current graph to a new database file
- `POST /merge` - Merge data from another database

### View State
- `GET /view-state` - Get canvas view state (scale, offset)
- `POST /view-state` - Save canvas view state

### Filter State
- `GET /filter-state` - Get layer filter state
- `POST /filter-state` - Save layer filter state

## Development

The app runs a local Express server on port 3004. The Electron app loads `http://localhost:3004` in its window.

## License

Same as the parent Luhmann Roam project.

