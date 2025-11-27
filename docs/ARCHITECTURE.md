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
│  │  • App lifecycle │◄──────► │  • UI Rendering  │          │
│  │  • Window mgmt   │         │  • User Input    │          │
│  │  • Server start  │         │  • Canvas        │          │
│  └──────────────────┘         └────────┬─────────┘          │
│           │                            │                    │
│           │                            │ HTTP (localhost)   │
│           │                            │                    │
│           ▼                            ▼                    │
│  ┌──────────────────────────────────────────────┐           │
│  │         Express Server (server.js)           │           │
│  │         Running on localhost:6825            │           │
│  │                                              │           │
│  │  ┌──────────────┐  ┌──────────────────┐      │           │
│  │  │   Routes     │  │   Controllers    │      │           │
│  │  │ (graphRoutes)│─►│(graphController) │      │           │
│  │  └──────────────┘  └────────┬─────────┘      │           │
│  │                             │                │           │
│  │                             ▼                │           │
│  │                    ┌──────────────┐          │           │
│  │                    │   Services   │          │           │
│  │                    │(graphService)│          │           │
│  │                    └──────┬───────┘          │           │
│  └───────────────────────────┼───────────────── ┘           │
│                              │                              │
│                              ▼                              │
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
├── index.html               # Main HTML skeleton (minimal, loads templates)
├── app.js                   # Main orchestrator
├── graph.js                 # Graph class (orchestrator, delegates to modules)
├── graph-renderer.js        # Canvas rendering engine
├── templates/               # HTML template fragments
│   ├── toolbar.html         # Toolbar component
│   ├── sidebar.html         # Sidebar component
│   └── dialogs/             # Dialog templates
│       ├── weight-dialog.html
│       ├── node-dialog.html
│       ├── load-dialog.html
│       ├── save-as-dialog.html
│       ├── node-search-dialog.html
│       ├── node-connections-dialog.html
│       ├── edge-search-dialog.html
│       ├── merge-dialog.html
│       ├── layer-management-dialog.html
│       ├── layer-rename-dialog.html
│       └── settings-dialog.html
├── graph/                   # Graph module structure
│   ├── operations/          # Node and edge operations
│   │   ├── nodeOperations.js    # Node CRUD and queries
│   │   └── edgeOperations.js    # Edge CRUD and queries
│   ├── handlers/           # Event handlers
│   │   └── mouseHandlers.js     # Mouse interaction handlers
│   ├── layers/             # Layer management
│   │   └── layerManager.js      # Layer operations
│   ├── connections/         # Node connections
│   │   └── nodeConnections.js   # Connection queries
│   └── utils/              # Graph utilities
│       └── graphUtils.js        # Tooltip, coordinate utils
├── state/
│   └── appState.js         # Global state management
├── services/
│   └── databaseService.js  # API communication layer
├── managers/
│   ├── changeTracker.js    # Change tracking logic
│   ├── viewStateManager.js # View state persistence
│   └── modeManager.js      # Mode switching
├── ui/
│   ├── eventListeners.js   # Event binding
│   ├── contextMenu.js      # Context menu
│   ├── saveDiscardUI.js    # Save/discard UI
│   ├── sidebarResizer.js   # Sidebar resizing
│   └── dialogs/
│       ├── loadDialog.js   # Load database dialog
│       └── saveAsDialog.js # Save As dialog
├── utils/
│   ├── constants.js        # Application constants
│   ├── geometry.js         # Coordinate transformations
│   ├── algorithms.js       # Graph algorithms
│   ├── uuid.js             # UUID generation utility
│   └── templateLoader.js   # Template loading system
├── styles.js               # Style calculations
└── ui-functions.js         # Legacy UI functions (non-module)
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

#### `index.html` - HTML Skeleton
- Minimal HTML structure (~150 lines)
- Loads templates dynamically via `utils/templateLoader.js`
- Contains only essential structure and script tags
- Templates loaded in parallel on page initialization

#### `utils/templateLoader.js` - Template Loading System
- Loads HTML template fragments via `fetch()`
- Injects templates into DOM at specified targets
- Supports both 'replace' and 'append' modes
- Handles template loading errors gracefully
- Enables modular HTML organization

#### `graph.js` - Graph Data Model (Orchestrator)
- Main Graph class that coordinates all graph operations
- Manages nodes and edges arrays
- Delegates operations to specialized modules:
  - **`graph/operations/`** - Node and edge CRUD operations
  - **`graph/handlers/`** - Mouse and interaction event handlers
  - **`graph/layers/`** - Layer management operations
  - **`graph/connections/`** - Node connection queries
  - **`graph/utils/`** - Utility functions (tooltips, coordinates)
- Delegates rendering to GraphRenderer
- Triggers callbacks for database persistence
- **Modular Design:** Reduced from 869 lines to ~280 lines by extracting specialized modules

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
│  │              │  │ (localhost)  │     │
│  │ • Local HTML │  │ • Local API  │     │
│  │ • Local JS   │  │ • No network │     │
│  │ • require()  │  │              │     │
│  └──────┬───────┘  └──────┬───────┘     │
│         │                 │             │
│         └────────┬────────┘             │
│                  │                      │
│                  ▼                      │
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
- **Graph** class: Orchestrator that delegates to specialized modules
- **Graph Modules**: Focused modules for operations, handlers, layers, connections
- **GraphRenderer** class: Pure rendering logic
- **Template System**: HTML templates loaded dynamically, reducing main HTML file size
- **Services**: API communication layer
- **Managers**: Business logic (change tracking, view state)

### 2. **Modular Architecture**
- ES6 modules for better code organization
- Single responsibility principle
- Clear module boundaries
- Easy to test and maintain
- **Template System:** HTML templates loaded dynamically via `templateLoader.js`
- **Graph Module Structure:** Graph operations split into focused modules:
  - Operations (node/edge CRUD)
  - Handlers (mouse interactions)
  - Layers (layer management)
  - Connections (node connection queries)
  - Utils (helper functions)

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
├── index.html               # Main HTML skeleton (loads templates dynamically)
├── app.js                   # Application orchestrator
├── graph.js                 # Graph class (orchestrator)
├── graph-renderer.js        # Rendering engine
├── templates/               # HTML template fragments
│   ├── toolbar.html
│   ├── sidebar.html
│   └── dialogs/            # Dialog templates
├── graph/                  # Graph module structure
│   ├── operations/         # Node/edge operations
│   ├── handlers/           # Event handlers
│   ├── layers/             # Layer management
│   ├── connections/        # Connection queries
│   └── utils/              # Graph utilities
├── styles.css               # Stylesheet
├── styles.js                # Style calculations
├── ui-functions.js          # Legacy UI functions
├── state/                   # State management
├── services/                # API layer
├── managers/                # Business logic managers
├── ui/                      # UI components
└── utils/                   # Utility functions (includes templateLoader)
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

## Template System Architecture

### Overview
The application uses a dynamic template loading system to keep the main HTML file manageable. Instead of having all HTML in one large file, templates are split into focused component files.

### Template Structure
```
templates/
├── toolbar.html              # Toolbar with search, mode buttons, file operations
├── sidebar.html              # Sidebar with graph info, instructions, controls
└── dialogs/                  # Dialog templates
    ├── weight-dialog.html
    ├── node-dialog.html
    ├── load-dialog.html
    ├── save-as-dialog.html
    ├── node-search-dialog.html
    ├── node-connections-dialog.html
    ├── edge-search-dialog.html
    ├── merge-dialog.html
    ├── layer-management-dialog.html
    ├── layer-rename-dialog.html
    └── settings-dialog.html
```

### Template Loading Flow
```
Page Load
  ↓
index.html (skeleton)
  ↓
templateLoader.js (initializeTemplates)
  ↓
Parallel fetch() requests for all templates
  ↓
Templates injected into DOM at target selectors
  ↓
Application initialization continues
```

### Benefits
- **Maintainability:** Each component in its own file
- **Organization:** Clear separation of concerns
- **Reusability:** Templates can be reused or modified independently
- **Performance:** Templates load in parallel
- **Fallback:** If loading fails, app can still function (templates could be inline as fallback)

## Graph Module Architecture

### Overview
The Graph class has been refactored into a modular structure, with specialized modules handling different aspects of graph operations.

### Module Structure
```
graph/
├── operations/
│   ├── nodeOperations.js     # Node CRUD: addNode, deleteNode, getNodeAt, getNodesAt
│   └── edgeOperations.js     # Edge CRUD: addEdge, deleteEdge, getEdgeAt, getEdgesAt, isPointOnLine
├── handlers/
│   └── mouseHandlers.js      # Mouse interactions: clicks, drags, panning, tooltips
├── layers/
│   └── layerManager.js       # Layer operations: getAllLayers, renameLayer, getLayerUsage
├── connections/
│   └── nodeConnections.js    # Connection queries: getNodeConnections (categorizes by direction)
└── utils/
    └── graphUtils.js         # Utilities: escapeHtml, updateTooltip, getMousePos
```

### Graph Class Responsibilities
The main `graph.js` file (now ~280 lines) acts as an orchestrator:
- Maintains graph state (nodes, edges, selection, view state)
- Delegates operations to specialized modules
- Coordinates rendering via GraphRenderer
- Manages callbacks for database persistence
- Provides public API (backward compatible)

### Module Responsibilities

#### `graph/operations/nodeOperations.js`
- Node creation and deletion
- Node selection queries (single and multiple)
- Hit detection for nodes

#### `graph/operations/edgeOperations.js`
- Edge creation and deletion
- Edge selection queries
- Point-on-line geometry calculations

#### `graph/handlers/mouseHandlers.js`
- Factory function creates handlers bound to graph instance
- Handles all mouse events (down, move, up, wheel, right-click)
- Mode-specific behavior (select, node, edge)
- Overlap cycling for smart selection
- Tooltip management

#### `graph/layers/layerManager.js`
- Layer extraction from nodes
- Layer renaming across all nodes
- Layer usage statistics

#### `graph/connections/nodeConnections.js`
- Complex connection categorization
- Handles incoming, outgoing, bidirectional connections
- Detects bidirectional pairs (two edges in opposite directions)

#### `graph/utils/graphUtils.js`
- HTML escaping for XSS prevention
- Tooltip content generation
- Coordinate transformations (screen to world)

### Benefits
- **Single Responsibility:** Each module has one clear purpose
- **Testability:** Modules can be tested independently
- **Maintainability:** Smaller, focused files are easier to understand
- **Reusability:** Operations can be reused across codebase
- **Backward Compatibility:** Same public API, no breaking changes

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

### 4. **Template Loading**
- Parallel template loading via Promise.all()
- Templates cached in DOM after initial load
- Minimal main HTML file reduces initial parse time

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

## Recent Refactoring

### Template System (2025-11-27)
- **Problem:** `index.html` was 1812 lines, difficult to maintain
- **Solution:** Split into modular template files
- **Implementation:**
  - Created `templates/` directory with component templates
  - Created `utils/templateLoader.js` for dynamic template loading
  - Reduced `index.html` from 1812 lines to ~150 lines
  - Templates load in parallel on page initialization
- **Benefits:**
  - Better maintainability (each component in separate file)
  - Improved organization
  - Easier to modify individual components
  - Templates can be reused or modified independently

### Graph Module Refactoring (2025-11-27)
- **Problem:** `graph.js` was 869 lines, mixing multiple responsibilities
- **Solution:** Split into focused modules by responsibility
- **Implementation:**
  - **`graph/operations/`** - Node and edge CRUD operations (~220 lines total)
  - **`graph/handlers/`** - Mouse interaction handlers (~260 lines)
  - **`graph/layers/`** - Layer management operations (~80 lines)
  - **`graph/connections/`** - Node connection queries (~150 lines)
  - **`graph/utils/`** - Utility functions (~70 lines)
  - Reduced main `graph.js` from 869 lines to ~280 lines
- **Benefits:**
  - Single responsibility per module
  - Easier to test individual components
  - Better code organization
  - Improved maintainability
  - 100% backward compatible (same public API)

---

**Last Updated:** 2025-11-27
**Version:** 0.1.10
