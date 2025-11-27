# Architecture Documentation

## Overview

Graph App is a **local-first desktop application** built with Electron, designed to work completely offline without any internet connection. It provides an interactive graph visualization interface with persistent local storage using SQLite.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Application                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  Main Process    │         │ Renderer Process │          │
│  │  (main.js)       │         │  (BrowserWindow) │          │
│  │                  │         │                  │          │
│  │  • App lifecycle │◄──────►│  • UI Rendering  │          │
│  │  • Window mgmt   │         │  • User Input    │          │
│  │  • Server start  │         │  • Canvas        │          │
│  └──────────────────┘         └────────┬─────────┘          │
│           │                            │                    │
│           │                            │ HTTP (localhost)   │
│           │                            │                    │
│           ▼                           ▼                    │
│  ┌──────────────────────────────────────────────┐           │
│  │         Express Server (server.js)           │           │
│  │         Running on localhost:6825            │           │
│  │                                              │           │
│  │  ┌──────────────┐  ┌──────────────────┐      │           │
│  │  │   Routes     │  │   Controllers    │      │           │
│  │  │ (graphRoutes)│─►│(graphController) │      │           │
│  │  └──────────────┘  └────────┬─────────┘      │           │
│  │                             │                │           │
│  │                             ▼               │           │
│  │                    ┌──────────────┐          │           │
│  │                    │   Services   │          │           │
│  │                    │(graphService)│          │           │
│  │                    └──────┬───────┘          │           │
│  └───────────────────────────┼───────────────── ┘           │
│                              │                              │
│                              ▼                             │
│                    ┌──────────────────┐                     │
│                    │  SQLite Database │                     │
│                    │   (data/*.db)    │                     │
│                    └──────────────────┘                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Core Technologies
- **Electron** (v22.0.0) - Desktop application framework
- **Express** (v4.18.2) - Local HTTP server for API
- **SQLite** (v4.1.2, sqlite3 v5.1.4) - Local file-based database
- **Node.js** - Runtime environment

### Frontend Technologies
- **Vanilla JavaScript** (ES6 Modules) - No framework dependencies
- **HTML5 Canvas** - Graph rendering
- **CSS3** - Styling

### Key Dependencies
- **uuid** (v10.0.0) - UUIDv7 generation for time-ordered identifiers
- **cors** (v2.8.5) - CORS middleware (for local development)

## Architecture Layers

### 1. Main Process (`main.js`)

**Responsibilities:**
- Application lifecycle management
- BrowserWindow creation and management
- Express server initialization
- DevTools configuration

**Key Features:**
- `nodeIntegration: true` - Allows Node.js APIs in renderer
- `contextIsolation: false` - Enables direct Node.js access
- Loads `http://localhost:6825` (local Express server)

### 2. Renderer Process (Frontend)

**Entry Point:** `public/index.html`

**Module Structure:**
```
public/
├── app.js                    # Main orchestrator
├── graph.js                  # Graph data model & event handling
├── graph-renderer.js         # Canvas rendering engine
├── state/
│   └── appState.js          # Global state management
├── services/
│   └── databaseService.js   # API communication layer
├── managers/
│   ├── changeTracker.js     # Change tracking logic
│   ├── viewStateManager.js  # View state persistence
│   └── modeManager.js       # Mode switching
├── ui/
│   ├── eventListeners.js    # Event binding
│   ├── contextMenu.js       # Context menu
│   ├── saveDiscardUI.js     # Save/discard UI
│   ├── sidebarResizer.js    # Sidebar resizing
│   └── dialogs/
│       ├── loadDialog.js    # Load database dialog
│       └── saveAsDialog.js  # Save As dialog
├── utils/
│   ├── constants.js         # Application constants
│   ├── geometry.js          # Coordinate transformations
│   ├── algorithms.js        # Graph algorithms
│   └── uuid.js              # UUID generation utility
├── styles.js                # Style calculations
└── ui-functions.js          # Legacy UI functions (non-module)
```

### 3. Backend (Express Server)

**Entry Point:** `server.js`

**Structure:**
```
server.js                    # Server initialization
├── routes/
│   └── graphRoutes.js      # Route definitions
├── controllers/
│   └── graphController.js  # HTTP request handlers
├── services/
│   └── graphService.js     # Business logic
└── src/
    └── graph-database.js   # Database connection & initialization
```

## Component Responsibilities

### Frontend Components

#### `app.js` - Application Orchestrator
- Initializes Graph instance
- Sets up event listeners and dialogs
- Coordinates module initialization
- Loads initial data from database

#### `graph.js` - Graph Data Model
- Manages nodes and edges arrays
- Handles user interactions (click, drag, pan, zoom)
- Delegates rendering to GraphRenderer
- Triggers callbacks for database persistence

#### `graph-renderer.js` - Rendering Engine
- **Single Responsibility:** All visual rendering
- Canvas operations (drawing nodes, edges, grid, labels)
- Handles view transformations (scale, offset)
- Visual feedback (selection, highlighting)

#### `state/appState.js` - State Management
- Global application state
- Graph instance storage
- Unsaved changes tracking
- Original state for comparison

#### `services/databaseService.js` - API Layer
- All HTTP requests to Express server
- Data format conversion (frontend ↔ backend)
- Error handling for network operations

#### `managers/changeTracker.js` - Change Tracking
- Tracks create/update/delete operations
- Maintains unsaved changes state
- Enables save/discard functionality

### Backend Components

#### `server.js` - Server Initialization
- Express app setup
- Middleware configuration (CORS, JSON parsing)
- Static file serving (`public/` directory)
- Database initialization
- Route registration

#### `routes/graphRoutes.js` - Route Definitions
- RESTful API endpoints
- Request parameter parsing
- Response formatting

#### `controllers/graphController.js` - Request Handlers
- HTTP request/response handling
- Error handling
- Delegates to services

#### `services/graphService.js` - Business Logic
- Database operations (CRUD)
- UUID generation (v7)
- Data validation
- View state management

#### `src/graph-database.js` - Database Layer
- SQLite connection management
- Schema initialization
- Database file switching
- Sequence ID management

## Data Flow

### Creating a Node

```
User Click
  ↓
graph.js (addNode)
  ↓
generateUUID() → uuid.js → require('uuid') → UUIDv7
  ↓
graph.nodes.push(node)
  ↓
graph.render() → GraphRenderer.render()
  ↓
Callback: trackNodeCreate() → changeTracker.js
  ↓
Callback: saveNodeToDb() → databaseService.js
  ↓
fetch('/api/plugins/graph/nodes') → Express Server
  ↓
graphRoutes.js → graphController.js
  ↓
graphService.createNode() → SQLite INSERT
  ↓
Response → Frontend
```

### Loading Graph Data

```
App Start
  ↓
app.js → loadGraphFromDb()
  ↓
databaseService.js → fetch('/api/plugins/graph')
  ↓
Express Server → graphService.getAllGraphData()
  ↓
SQLite SELECT → Database
  ↓
Response (nodes, edges, scale, offset)
  ↓
graph.importData() → Graph instance
  ↓
GraphRenderer.render() → Canvas display
```

## Offline Compatibility

### ✅ **Fully Offline-Capable Architecture**

The application is designed to work **completely offline** without any internet connection. All dependencies are local:

#### 1. **No CDN Dependencies**
- ✅ All JavaScript modules are local files
- ✅ UUID generation uses local `node_modules/uuid` package via `require()`
- ✅ No external stylesheets or scripts
- ✅ No dynamic imports from CDN

#### 2. **Local Server Architecture**
- ✅ Express server runs locally on `localhost:6825`
- ✅ All API calls use relative URLs (`/api/plugins/graph`)
- ✅ Server and client bundled in same Electron app
- ✅ No external API dependencies

#### 3. **Local Database Storage**
- ✅ SQLite database files stored in `data/` directory
- ✅ File-based storage (no network database)
- ✅ Database files created automatically
- ✅ No remote database connections

#### 4. **Local Resource Loading**
- ✅ All HTML, CSS, JavaScript files served from `public/` directory
- ✅ Static file serving via Express
- ✅ No external resource loading

#### 5. **Node.js Integration**
- ✅ Electron `nodeIntegration: true` enables direct Node.js access
- ✅ `require()` available in renderer process
- ✅ Direct access to `node_modules` packages
- ✅ No need for bundlers or CDN fallbacks

### Offline Architecture Pattern

```
┌─────────────────────────────────────────┐
│         Electron App (Bundled)          │
│                                         │
│  ┌──────────────┐  ┌──────────────┐     │
│  │   Renderer   │  │   Express    │     │
│  │   Process    │◄─┤   Server     │     │
│  │              │  │ (localhost)   │    │
│  │ • Local HTML │  │ • Local API  │     │
│  │ • Local JS   │  │ • No network │     │
│  │ • require()  │  │              │     │
│  └──────┬───────┘  └──────┬───────┘     │
│         │                 │             │
│         └────────┬────────┘             │
│                  │                      │
│                  ▼                     │
│         ┌─────────────────┐             │
│         │  SQLite Files   │             │
│         │   (data/*.db)   │             │
│         └─────────────────┘             │
│                                         │
│  All resources are local -              │
│  No internet connection required        │
└─────────────────────────────────────────┘
```

### Verification Checklist

- ✅ No `https://` or `http://` imports in code (except localhost)
- ✅ No CDN URLs (`esm.sh`, `unpkg`, `cdnjs`, etc.)
- ✅ All `fetch()` calls use relative URLs
- ✅ UUID generation uses local `require('uuid')`
- ✅ Database is file-based SQLite
- ✅ All assets served from `public/` directory
- ✅ Express server runs locally (not deployed)

## Key Design Decisions

### 1. **Separation of Concerns**
- **Graph** class: Data management and event handling
- **GraphRenderer** class: Pure rendering logic
- **Services**: API communication layer
- **Managers**: Business logic (change tracking, view state)

### 2. **Modular Architecture**
- ES6 modules for better code organization
- Single responsibility principle
- Clear module boundaries
- Easy to test and maintain

### 3. **Local-First Design**
- All dependencies bundled locally
- No external network requirements
- Works completely offline
- Portable and self-contained

### 4. **UUIDv7 for Performance**
- Time-ordered identifiers improve database index locality
- Better insert performance in SQLite
- Natural chronological sorting
- Generated locally (no network calls)

### 5. **Change Tracking System**
- Tracks unsaved changes separately
- Enables save/discard functionality
- Prevents accidental data loss
- Clear visual feedback

### 6. **View State Persistence**
- Canvas scale and offset saved to database
- Restores zoom/pan state on load
- Debounced saving for performance
- Independent of graph data

## Communication Patterns

### Frontend ↔ Backend

**Protocol:** HTTP REST API over localhost

**Base URL:** `http://localhost:6825/api/plugins/graph`

**Request/Response Format:** JSON

**Error Handling:**
- Frontend catches fetch errors gracefully
- Backend returns error objects with messages
- Console logging for debugging

### State Management

**Pattern:** Centralized state with getters/setters

**Location:** `state/appState.js`

**State Objects:**
- `graph` - Graph instance
- `appMode` - Current interaction mode
- `unsavedChanges` - Map of unsaved modifications
- `originalState` - Baseline for comparison

## File Organization

### Root Level
```
├── main.js              # Electron main process
├── server.js            # Express server entry point
├── package.json         # Dependencies and scripts
└── data/                # SQLite database files
```

### Backend (`/`)
```
├── src/
│   └── graph-database.js    # Database connection & schema
├── routes/
│   └── graphRoutes.js       # Express routes
├── controllers/
│   └── graphController.js   # HTTP handlers
└── services/
    └── graphService.js      # Business logic
```

### Frontend (`/public`)
```
├── index.html               # Main HTML file
├── app.js                   # Application orchestrator
├── graph.js                 # Graph data model
├── graph-renderer.js        # Rendering engine
├── styles.css               # Stylesheet
├── styles.js                # Style calculations
├── ui-functions.js          # Legacy UI functions
├── state/                   # State management
├── services/                # API layer
├── managers/                # Business logic managers
├── ui/                      # UI components
└── utils/                   # Utility functions
```

## Database Schema

### Tables

**`graph_nodes`**
- `id` (TEXT PRIMARY KEY) - UUIDv7 identifier
- `x`, `y` (REAL) - Position coordinates
- `label` (TEXT) - Node label
- `chinese_label` (TEXT) - Chinese label (optional)
- `color` (TEXT) - Hex color code
- `radius` (REAL) - Node radius
- `category` (TEXT) - Category (optional)
- `sequence_id` (INTEGER) - Creation order
- `created_at`, `updated_at` (INTEGER) - Timestamps

**`graph_edges`**
- `id` (TEXT PRIMARY KEY) - UUIDv7 identifier
- `from_node_id` (TEXT) - Source node ID
- `to_node_id` (TEXT) - Target node ID
- `weight` (REAL) - Edge weight
- `category` (TEXT) - Category (optional)
- `sequence_id` (INTEGER) - Creation order
- `created_at`, `updated_at` (INTEGER) - Timestamps

**`graph_metadata`**
- `id` (INTEGER PRIMARY KEY) - Always 1
- `scale` (REAL) - Canvas zoom level
- `offset_x`, `offset_y` (REAL) - Canvas pan offset
- `updated_at` (INTEGER) - Timestamp

## Performance Considerations

### 1. **Rendering Optimization**
- Single rendering engine (GraphRenderer)
- Efficient canvas operations
- Debounced view state saving
- Scaled radius calculations for hit detection

### 2. **Database Optimization**
- UUIDv7 for better index locality
- Sequence IDs for ordering
- Prepared statements for bulk operations
- Indexed primary keys

### 3. **Memory Management**
- Map-based change tracking (efficient lookups)
- Clear separation of data and rendering
- No unnecessary object creation

## Security Considerations

### 1. **Local-Only Access**
- Express server binds to localhost only
- No external network exposure
- No authentication needed (local app)

### 2. **Input Validation**
- Backend validates all inputs
- SQL parameterization prevents injection
- Type checking in services

### 3. **File System Access**
- Database files in controlled directory
- Environment variable for custom paths
- Automatic directory creation

## Development Workflow

### Starting Development
```bash
npm start
```
1. Starts Express server on port 6825
2. Launches Electron window
3. Opens DevTools automatically

### Building for Distribution
```bash
npm run build
```
1. Bundles all dependencies
2. Creates distributable package
3. Includes all local resources

## Future Considerations

### Potential Enhancements
- [ ] Export/import graph data (JSON format)
- [ ] Graph algorithms (shortest path, etc.)
- [ ] Multiple graph views
- [ ] Undo/redo functionality
- [ ] Graph templates
- [ ] Search and filter capabilities

### Architecture Scalability
- Modular design supports feature additions
- Clear separation allows independent development
- State management can be enhanced
- Rendering engine can be optimized further

## Related Documentation

- **[Development Guide](DEVELOPMENT_GUIDE.md)** - UI/UX guidelines, code style, and development best practices
- **[Refactoring Guide](REFACTORING.md)** - Refactoring patterns and migration strategies

---

**Last Updated:** 2025-11-22
**Version:** 0.1.10
