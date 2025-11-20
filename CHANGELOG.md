# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.5] - 2025-11-20

### Changed
- Refactored `app.js` (1,133 lines) into modular architecture with 12 focused modules
- Split application into separate concerns: state management, services, managers, and UI components
- Migrated to ES6 modules (`import`/`export`) for better code organization
- Updated `index.html` to use ES6 module syntax (`type="module"`)

### Added
- `state/appState.js` - Centralized global state management
- `services/databaseService.js` - All database API operations
- `managers/changeTracker.js` - Change tracking logic
- `managers/viewStateManager.js` - View state saving functionality
- `managers/modeManager.js` - Application mode switching
- `ui/eventListeners.js` - Event listener setup
- `ui/contextMenu.js` - Context menu handling
- `ui/saveDiscardUI.js` - Save/discard functionality
- `ui/dialogs/loadDialog.js` - Load database dialog with pagination
- `ui/dialogs/saveAsDialog.js` - Save As dialog functionality
- Refactored `app.js` to be a thin orchestrator (~58 lines)

### Technical Details
- Improved separation of concerns with single responsibility principle
- Eliminated circular dependencies between modules
- Better maintainability and testability with modular structure
- Easier to scale and add new features without bloating existing files
- All existing functionality preserved with improved code organization

## [0.1.4] - 2025-11-20

### Added
- Configurable database directory - database files now stored in `data/` directory by default
- Environment variable support (`GRAPH_DB_DIR`) for custom database directory location
- Automatic database directory creation if it doesn't exist
- Pagination for Load Database dialog - shows 10 databases per page when there are many files
- Pagination controls with Previous/Next buttons and page information
- Improved database file management with better organization

### Changed
- Database files moved from `src/` directory to `data/` directory at project root
- Load Database dialog now supports pagination for better UX with many database files
- Updated `.gitignore` to exclude `data/` directory
- Updated documentation to reflect new database directory structure

### Technical Details
- Database directory defaults to `data/` but can be configured via `GRAPH_DB_DIR` environment variable
- Pagination shows 10 items per page (configurable via `ITEMS_PER_PAGE` constant)
- Database directory is automatically created on first use
- Pagination controls only appear when there are more than 10 database files
- Selection state persists across pagination pages

## [0.1.3] - 2025-11-20

### Added
- Load button to switch between different database files
- Save As functionality to clone current workspace to a new database file
- Database file selection dialog showing all available `.db` files in src directory
- Database switching API endpoints (`GET /databases`, `POST /switch-database`)
- Save As API endpoint (`POST /save-as`) for creating new database files
- DatabaseManager class for managing database connections and switching
- Warning dialog when loading database with unsaved changes
- Option to switch to newly saved database after Save As operation

### Changed
- Refactored database module to support multiple database files
- Database connection now managed through singleton DatabaseManager instance
- Load operation now clears unsaved changes before switching databases

### Technical Details
- DatabaseManager class handles connection lifecycle and file switching
- Database files are stored in `data/` directory (configurable via `GRAPH_DB_DIR` environment variable)
- Save As creates new database files with full graph data (nodes, edges, view state)
- File validation prevents overwriting existing databases and ensures `.db` extension
- Database switching automatically reinitializes schema in new database files

## [0.1.2] - 2025-11-20

### Added
- Canvas panning (dragging) in select mode - click and drag empty space to pan the canvas
- Zoom support with mouse wheel - scroll to zoom in/out (0.1x to 5x range)
- View state persistence - canvas scale and offset are saved and restored between sessions
- `graph_metadata` database table for storing view state (scale, offset)
- `/api/plugins/graph/view-state` endpoint for saving view state independently
- Automatic view state saving with debouncing (saves after 500ms of inactivity)
- Mouse coordinate transformation to account for scale and offset

### Changed
- Updated Graph class to use `scale` instead of `zoom` for consistency
- Mouse coordinate calculations now account for canvas transformations
- Rendering now applies scale and offset transformations before drawing
- Graph export/import now includes scale and offset data

### Technical Details
- Canvas transformations applied via `ctx.translate()` and `ctx.scale()`
- Panning state tracked with `isPanning` flag and `lastPanPoint` coordinates
- View state saved to `graph_metadata` table with single-row constraint (id = 1)
- Debounced view state saving prevents excessive database writes during pan/zoom operations

## [0.1.1] - 2025-11-20

### Added
- Modern UI redesign matching legacy code structure
- Enhanced toolbar with organized sections and icons
- Sidebar panel with graph info, selection info, and display options
- Advanced node editing dialog with Chinese labels, categories, layers, and size controls
- Enhanced edge editing dialog with category support and reverse direction feature
- GraphRenderer class for modular canvas rendering
- Utility modules: constants.js, geometry.js, algorithms.js
- Styles.js module for visual style calculations
- Support for edge arrows display toggle
- Node layers and categories support
- Improved dialog system with better UX

### Changed
- Migrated from inline styles to external CSS file (styles.css)
- Updated canvas ID from 'canvas' to 'graph-canvas' for consistency
- Refactored dialog handling to use modular UI functions
- Improved canvas sizing to properly fill container
- Enhanced right-click behavior to show dialogs directly
- Updated button styling and layout to match modern design

### Fixed
- Fixed canvas element not found error (canvas ID mismatch)
- Fixed dialog button references (node-ok, weight-ok instead of node-save, edge-save)
- Fixed context menu handling for new HTML structure
- Fixed canvas cursor updates for different modes

### Technical Details
- Modular architecture with separated concerns (rendering, styles, UI functions)
- ES6 module imports for better code organization
- Improved error handling for missing DOM elements
- Better separation between UI logic and graph logic

## [0.1.0] - 2025-11-19

### Added
- Initial release as standalone desktop application
- Graph visualization with interactive canvas
- Node creation, editing, and deletion
- Edge creation, editing, and deletion
- Three interaction modes: Select, Add Node, Add Edge
- Context menu for editing nodes and edges
- Change tracking system with save/discard functionality
- SQLite database for persistent storage
- Express API server for backend operations
- Electron desktop application wrapper
- Tooltip display for node full content
- Visual feedback for selected nodes and edges
- Weighted edges with visual representation
- Color customization for nodes
- Clear all functionality
- Database initialization and sequence ID management
- Import/export functionality via API

### Technical Details
- Built with Electron for cross-platform desktop support
- Express.js backend server running on port 3004
- SQLite database with graph_nodes and graph_edges tables
- Canvas-based rendering for graph visualization
- RESTful API endpoints for all graph operations

[0.1.0]: https://github.com/yourusername/graph-app/releases/tag/v0.1.0
