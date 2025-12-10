# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Note:** For versions prior to 0.2.0, see [CHANGELOG_ARCHIVE.md](docs/CHANGELOG_ARCHIVE.md)

## [0.4.8] - 2025-12-10

### Added
- Sample graph gallery dialog - browse and load from multiple pre-prepared sample graphs
- "📚 Sample Gallery" button in toolbar - opens modal dialog with available sample graphs
- Sample graph cards with metadata display - shows title, description, node/edge counts, and category
- Easy configuration system - `SAMPLE_GRAPHS` array for adding new sample graphs
- Graph Theory sample graph - comprehensive 20-node, 33-edge sample covering fundamental graph theory concepts
- Sample graphs automatically grouped by category in gallery
- Gallery modal with backdrop blur and responsive grid layout
- "✨ Load Sample Graph" button - quick access to default sample graph

### Changed
- Sample graph loading refactored to support multiple sample files
- Gallery automatically populates from `SAMPLE_GRAPHS` configuration array

### Fixed
- Fixed load dialog becoming too tall when many databases are listed - dialog now has max-height constraint (85vh) with scrollable content area
- Fixed load dialog buttons becoming inaccessible when content expands - buttons now remain fixed at bottom of dialog
- Fixed node search dialog becoming too tall when many search results are displayed - dialog now has max-height constraint (85vh) with scrollable content area
- Fixed node search dialog buttons becoming inaccessible when results expand - buttons now remain fixed at bottom of dialog
- Fixed merge dialog becoming too tall when many databases are listed - dialog now has max-height constraint (85vh) with scrollable content area
- Fixed merge dialog buttons becoming inaccessible when content expands - buttons now remain fixed at bottom of dialog
- Fixed layer management dialog becoming too tall when many layers are displayed - dialog now has max-height constraint (85vh) with scrollable content area
- Fixed layer management dialog buttons becoming inaccessible when content expands - buttons now remain fixed at bottom of dialog
- Fixed clustering dialog becoming too tall when results are displayed - dialog now has max-height constraint (85vh) with scrollable content area
- Fixed clustering dialog buttons becoming inaccessible when results expand - buttons now remain fixed at bottom of dialog
- Fixed canvas distortion (compression/stretching) when toolbar height changes - canvas now properly resizes when save/discard buttons appear or disappear

### Technical Details
- Sample gallery modal uses same styling pattern as selection popup for consistency
- Gallery closes via X button, backdrop click, or ESC key
- Sample graphs stored in `web-app/samples/` directory
- Configuration array supports: id, filename, title, description, category, nodeCount, edgeCount
- Graph Theory sample includes: core concepts, fundamental elements, structures, properties, graph types, and algorithms
- Sample graphs use color-coded categories and meaningful edge relationships
- Gallery grid uses responsive CSS Grid with auto-fill layout
- Sample cards show hover effects and click-to-load functionality
- Canvas resize triggered via Graph's `resizeCanvas()` method when toolbar height changes to maintain proper aspect ratio

## [0.4.7] - 2025-12-09

### Added
- Selection info popup for web app - displays detailed node information when clicking on nodes
- Node click detection with world coordinate conversion - accurate hit detection at any zoom level
- Popup positioning logic - automatically positions near click location while staying within viewport
- Close popup functionality - ESC key, close button, or click outside to dismiss
- Node selection highlighting - selected nodes are visually highlighted on canvas
- JSON file import support - load graph data from JSON export files (alternative to .db files)
- Vercel deployment configuration - vercel.json with proper static site settings

### Changed
- Updated pan/zoom interaction - clicking nodes shows popup instead of starting pan
- Improved click handling - distinguishes between node clicks and empty space clicks
- Enhanced reset view - clears selection and hides popup when resetting view

### Fixed
- Fixed Vercel deployment errors - removed invalid regex patterns in vercel.json headers
- Fixed build configuration - added empty build/install commands to prevent Electron app build attempts
- Fixed deployment documentation - added Root Directory requirement and troubleshooting guide
- **CRITICAL FIX:** Fixed database backup losing filter_state data - backup now uses direct file copy instead of export/import
- Fixed backup performance - backup now completes instantly (milliseconds) instead of taking 3-5 seconds

### Technical Details
- Popup displays: English/Chinese labels, position, color, size, category, layers, timestamps
- Node hit detection uses scaled radius calculation for accurate selection at different zoom levels
- Screen-to-world coordinate conversion ensures correct node detection regardless of pan/zoom state
- Popup automatically adjusts position to stay within viewport boundaries
- Selection state managed separately from pan state for better UX
- Backup now uses `fs.copyFile()` for direct database file copy - preserves ALL tables including filter_state
- New backup endpoint `POST /api/plugins/graph/backup-database` replaces slow export/import approach
- Backup performance improved from 3-5 seconds to milliseconds by copying file directly

## [0.4.6] - 2025-11-28

### Added
- Minimal web app for viewing graph data (`web-app/` directory) - standalone web application for exploring graph visualizations in browser
- SQLite WASM integration using sql.js - read database files directly in browser without backend server
- Read-only graph viewer with canvas rendering - visualize nodes and edges from SQLite database files
- Pan and zoom functionality - mouse drag to pan, mouse wheel to zoom (0.1x to 5x range)
- File input interface - load `.db` files from local file system
- Reset view button - restore default zoom and pan position
- Graph renderer module adapted for web - read-only version of GraphRenderer class
- Utility modules for web app - constants, geometry, algorithms, and styles utilities
- Express server for local hosting - simple HTTP server for development (port 3000)
- Comprehensive documentation - README.md and QUICKSTART.md for web app usage

### Changed
- N/A (new feature branch)

### Technical Details
- Web app uses SQL.js (SQLite compiled to WebAssembly) for client-side database reading
- All processing happens in browser - no backend database required for viewing
- Compatible with same database schema as Electron desktop app
- Canvas rendering uses HTML5 Canvas API with proper coordinate transformations
- View state (scale, offset) loaded from `graph_metadata` table if available
- Database files loaded entirely into memory for processing
- Ready for deployment to static hosting platforms (Vercel, Netlify, etc.)
- SQL.js loaded from CDN with fallback error handling

## [0.4.5] - 2025-12-09

### Fixed
- **CRITICAL BUG FIX:** Fixed "New Template" button causing permanent data loss - button now creates a new database file instead of deleting all data from current database
- Fixed template functionality to properly create new database files with unique timestamp-based filenames
- Removed dangerous data deletion warnings - button now safely creates new workspace without affecting existing data

### Changed
- "New Template" button now creates a new empty database file and switches to it, preserving all existing databases
- Template now includes 2 nodes and 1 edge as a proper sample template (instead of just 1 node)
- Updated button text and description to reflect safe behavior - removed misleading warnings about data deletion
- Template creates database files with format `graph-YYYY-MM-DDTHH-MM-SS.db` for easy identification
- Removed "Save As" button and dialog - replaced with "Backup Database" button for simpler workflow
- Hotkey `w` now triggers database backup instead of Save As dialog
- Command palette updated - backup command moved to "Database Operations" category

### Added
- New API endpoint `POST /api/plugins/graph/new-database` for creating empty database files
- `createNewDatabase()` function in `databaseService.js` for safe database file creation
- Template now initializes with 2 connected nodes positioned horizontally as a working example
- Database backup functionality - "Backup Database" button in sidebar for quick timestamped backups
- New API endpoint `GET /api/plugins/graph/current-database` to get current database file information
- `backupCurrentDatabase()` function that creates backups with format `{name}-backup-{timestamp}.db`

### Technical Details
- New template functionality creates a fresh database file instead of clearing current database
- Database switching properly implemented to preserve all existing database files
- Template includes proper sample data (2 nodes, 1 edge) to demonstrate graph functionality
- Original database files remain completely untouched when creating new templates
- All database operations now use proper file creation instead of data deletion
- Backup feature uses saveAs API internally to create timestamped copies without switching databases
- Backup filenames automatically generated from current database name with ISO timestamp format
- Save As functionality removed from UI - users can rename backup files manually if needed
- Simplified workflow: Backup Database button provides one-click timestamped backups

## [0.4.4] - 2025-12-03

### Added
- Semantic search functionality for semantic map embeddings - search embeddings by semantic similarity
- Cosine similarity calculation for comparing query embeddings with stored embeddings
- Semantic search API endpoint (`POST /api/plugins/semantic-map/search`) - returns top 10 most similar embeddings
- Search input field and button in semantic map dialog for querying embeddings
- Search results window displaying top 10 results with similarity scores (as percentages)
- Results window shows: similarity scores, titles, text content, embedding model, 2D coordinates (if available), and IDs
- Enter key support for triggering semantic search from input field
- HTML escaping in results window to prevent XSS vulnerabilities

### Changed
- Semantic map dialog now includes semantic search section with dedicated input and search button

### Technical Details
- Cosine similarity calculated using dot product and vector norms for accurate semantic matching
- Search uses same provider/model settings as embedding generation for consistency
- Results sorted by similarity score (descending) and limited to top 10 by default (configurable up to 100)
- Results displayed in new popup window with clean, formatted UI
- Search function (`semanticSearch`) in `semanticMapService.js` handles embedding generation and similarity calculation
- Controller endpoint validates input and handles errors gracefully
- Results window uses inline HTML/CSS for standalone display without external dependencies

## [0.4.3] - 2025-12-03

### Added
- Semantic Map module - visualize semantic relationships using text embeddings
- Embedding generation support for multiple providers: OpenAI, OpenRouter, and SiliconFlow (BAAI/bge-m3)
- Semantic map database table (`semantic_map_embeddings`) for storing embeddings with 2D coordinates
- Plotly.js integration for interactive 2D scatter plot visualization of embeddings
- Fullscreen mode for semantic map with drag/zoom/pan interactions
- Dimensionality reduction (simplified PCA-like projection) for visualizing high-dimensional embeddings in 2D
- "Load from Graph Nodes" feature - automatically generate embeddings for all graph nodes
- Semantic Map button in sidebar under "Graph Analysis" section
- Backend API endpoints (`/api/plugins/semantic-map/embeddings`) for CRUD operations on embeddings
- Embedding generation API endpoint with support for multiple providers and models
- Batch 2D coordinate updates for efficient dimensionality reduction application
- Semantic map dialog with controls panel and visualization area
- Model selection dropdowns that update based on selected provider
- Status display showing current operation progress and results

### Changed
- Semantic map fullscreen mode hides left control panel for immersive viewing experience
- Plotly visualization configured with enhanced interactions: drag to pan, scroll to zoom, double-click to reset

### Fixed
- Fixed SiliconFlow API integration - corrected input format to use array format as required by API
- Fixed fullscreen CSS specificity issues - added `!important` flags to override inline styles
- Fixed dialog centering transform interfering with fullscreen positioning
- Improved error handling and logging for embedding generation API calls

### Technical Details
- Database schema includes `semantic_map_embeddings` table with fields: id, text, title, embedding_model, embedding_data (JSON), x_2d, y_2d, timestamps
- Backend service (`services/semanticMapService.js`) handles embedding generation via HTTPS requests to provider APIs
- Frontend module (`public/ui/dialogs/semanticMapDialog.js`) manages UI interactions and Plotly visualization
- Embedding data stored as JSON strings in database, parsed on load for visualization
- Dimensionality reduction uses simplified PCA-like projection (first two normalized dimensions) - can be enhanced with proper UMAP/t-SNE libraries
- Fullscreen mode follows same pattern as canvas fullscreen (`fullscreenManager.js`) for consistency
- Plotly.js loaded dynamically from CDN with fallback handling
- API key input uses password type for security
- Status messages provide real-time feedback during embedding generation and reduction operations
- ESC key support to exit fullscreen mode
- Semantic map fullscreen hides toolbar, sidebar, and canvas container for focused viewing

## [0.4.2] - 2025-11-28

### Added
- Path-based node connections feature - find nodes within depth/distance constraints using shortest paths
- Depth constraint filtering - filter nodes by maximum number of hops (edges) through shortest path
- Distance constraint filtering - filter nodes by maximum sum of edge weights through shortest path
- AND/OR condition support - combine depth and distance constraints with AND (both must be satisfied) or OR (either can be satisfied) logic
- Path-based filtering UI in node connections dialog - input fields for max depth, max distance, and condition selector
- Results display in new window/tab - path-based connection results shown in formatted table with comprehensive information
- Results table columns: Node Label, Coordinates (X, Y), Radius, Depth (Hops), Distance (Weight Sum), and Path
- CSV export functionality for path-based connection results
- `getNodesWithinConstraints()` function in nodeConnections module - calculates shortest paths and filters by constraints
- Graph class method `getNodesWithinConstraints()` - automatically uses filtered nodes/edges when layer filters are active
- Selection info font size control - adjustable font size slider (10-20px, default: 13px) for selection info display in sidebar and popup

### Changed
- Node connections dialog restructured with flexbox layout - content wrapped in scrollable container while buttons remain fixed at bottom
- Dialog max-height set to 85vh with custom scrollbar styling for better UX
- Path-based results table displays node coordinates and radius instead of Node ID for better readability
- CSV export includes coordinates and radius instead of Node ID
- Refactored node connections functionality into separate module (`public/ui/dialogs/nodeConnectionsDialog.js`) - improved code organization and maintainability
- Reduced `ui-functions.js` from 1056 to 429 lines (59% reduction) by extracting connection-related functions
- Updated `ui-functions.js` to ES module format for better module system integration

### Fixed
- Fixed node-connections-dialog becoming too tall when node has many connections - dialog now has max-height constraint with scrollable content area
- Fixed connection list buttons becoming inaccessible when many connections are displayed - buttons now remain fixed at bottom of dialog
- Fixed settings dialog becoming too tall when adding new font settings - dialog now has max-height constraint (85vh) with scrollable content area
- Fixed settings dialog buttons becoming inaccessible when content expands - buttons now remain fixed at bottom of dialog
- Fixed node deletion not working - handleNodeDelete was passing nodeId instead of node object to graph.deleteNode()
- Fixed edge deletion not working - handleWeightDelete was passing edgeId instead of edge object to graph.deleteEdge()

### Technical Details
- Path calculation uses Dijkstra's algorithm to find shortest paths to all nodes
- Algorithm tracks both depth (number of hops) and distance (sum of edge weights) simultaneously
- Graph treated as undirected for path calculation - edges can be traversed in either direction
- Filtered nodes/edges automatically used when layer filters are active
- Results sorted by distance, then by depth for consistent ordering
- Path reconstruction includes full node sequence from start node to target node
- Dialog follows same flexbox pattern as edge search dialog for consistency
- Custom scrollbar styling matches edge dialog for unified UX
- Node connections module follows same pattern as other dialog modules (edgeSearchDialog.js) for consistency
- Functions exported as ES modules and also exposed on window for backward compatibility
- Euclidean distance calculation added to results table for comparing graph-theoretic vs geometric distances
- Selection info font size setting stored in localStorage and applied to both sidebar and fullscreen popup versions
- Settings dialog restructured with flexbox layout - content wrapped in scrollable container (`settings-dialog-body`) while buttons remain fixed at bottom
- Settings dialog max-height set to 85vh with custom scrollbar styling matching other dialogs for consistent UX

## [0.4.1] - 2025-11-28

### Added
- Graph clustering and community detection functionality
- Clustering algorithms: Louvain (modularity optimization), Label Propagation, K-core decomposition, and Connected Components clustering
- Clustering dialog UI with algorithm selection and parameter configuration
- Visual community coloring - nodes colored by community/cluster assignment
- Community information display in node selection info panel
- Clustering results statistics display (modularity scores, community counts, core distributions)
- Color restoration functionality - restore original node colors after clustering visualization
- Clustering engine module (`public/utils/analysis/clustering-engine.js`) with multiple algorithms
- Graph Clustering button in sidebar under "Graph Analysis" section

### Changed
- Graph class enhanced with clustering methods and color visualization support
- Selection info panel now displays community/cluster information for selected nodes
- GraphAnalysis module integrated with ClusteringEngine for community detection

### Fixed
- Fixed Graph Info section showing total node/edge counts instead of filtered counts when layers are filtered
- Fixed graph analysis (centralities and clustering) using all nodes/edges instead of filtered nodes/edges
- Fixed tooltips appearing for filtered-out (hidden) nodes when hovering over canvas
- Fixed mouse interactions (clicking, edge creation) working on filtered-out nodes

### Technical Details
- Louvain algorithm implements modularity optimization with configurable resolution parameter
- Label Propagation algorithm supports weighted graphs with configurable max iterations
- K-core decomposition identifies core/periphery structure with core number assignments
- Distinct color generation algorithm creates visually distinct colors for communities
- Original node colors preserved when applying clustering colors for easy restoration
- Clustering results cached for performance optimization
- All clustering algorithms support weighted graphs
- Clustering dialog follows existing dialog patterns and integrates with current architecture

## [0.4.0] - 2025-11-28

### Added
- Graph Analysis Module - comprehensive graph analysis and centrality calculation functionality
- Centrality calculation algorithms: degree, betweenness, closeness, eigenvector, and PageRank centrality measures
- Per-component centrality calculation for disconnected graphs - each connected component analyzed independently
- Centrality analysis display in node selection info panel - shows all 5 centrality measures with rankings
- Visual ranking indicators: 🔥 Top 10%, ⭐ Top 25%, 👍 Top 50%, ⚪ Others
- Calculate Centralities button in sidebar under "Graph Analysis" section
- Graph analysis modules (`public/utils/analysis/`):
  - `graph-analysis.js` - Main analysis coordinator with caching support
  - `centrality-calculator.js` - Centrality measure calculations
  - `pathfinding-engine.js` - Pathfinding and graph traversal algorithms
- Graph analysis algorithms added to `algorithms.js`: Dijkstra's algorithm, BFS, connected components detection
- Centrality rankings system - tracks and displays node rankings for each centrality type
- Automatic analysis updates when graph structure changes (nodes/edges added/removed)

### Changed
- Updated `algorithms.js` to include graph analysis algorithms (dijkstra, bfs, getConnectedComponents, calculateGraphDensity)
- Graph class now includes GraphAnalysis instance for centralized analysis operations
- Selection info panel enhanced to display comprehensive centrality analysis when node is selected
- Calculate Centralities button moved from toolbar to sidebar for better organization

### Technical Details
- GraphAnalysis module provides unified interface for all graph analysis operations
- Centrality calculations support weighted graphs with per-component normalization
- Caching system with 5-second timeout for performance optimization
- Rankings calculated and cached for efficient display in selection panel
- Analysis modules handle both edge formats (`from/to` and `from_node_id/to_node_id`) for compatibility
- Centrality values normalized to [0,1] range within each connected component
- PageRank uses damping factor (0.85) and convergence threshold (1e-6) from constants
- Eigenvector centrality uses power iteration with max 100 iterations
- Betweenness centrality uses Brandes algorithm for efficient calculation
- All analysis operations integrated with existing graph state management

## [0.3.6] - 2025-11-27

### Added
- Database export functionality - export all 4 database tables (graph_nodes, graph_edges, graph_metadata, filter_state) as JSON or CSV
- Export dialog with format selection (JSON/CSV) accessible from sidebar "Database Operations" section
- JSON export - single file containing all tables with proper structure
- CSV export - ZIP file containing separate CSV files for each table plus export manifest
- JSZip library integration for creating ZIP archives (CSV exports bundled into single ZIP file)
- Export hotkey command: `ex` (export database) - added to hotkey manager and command palette
- Export button in sidebar under "Database Operations" section

### Changed
- CSV export now downloads single ZIP file instead of multiple individual files (prevents multiple download popups)
- Export dialog follows existing dialog patterns and integrates with current architecture

### Fixed
- Fixed edge search dialog becoming too tall when searching for source/target nodes - dialog now has max-height constraint with scrollable content area
- Fixed "Create Edge" and "Cancel" buttons becoming inaccessible when dropdowns expand - buttons now remain fixed at bottom of dialog

### Technical Details
- Export API endpoint: `GET /api/plugins/graph/export?format=json|csv`
- Backend export function (`services/graphService.js`) fetches all 4 tables from database
- CSV conversion handles proper escaping (commas, quotes, newlines) for valid CSV format
- ZIP file creation uses JSZip library (loaded via CDN) for client-side ZIP generation
- Fallback mechanism: if JSZip fails to load, CSV export falls back to individual file downloads
- Export manifest included in CSV ZIP with export metadata (timestamp, tables list, format)
- Export command (`ex`) categorized under "Database Operations" in hotkey system and command palette
- Edge search dialog restructured with flexbox layout - form fields wrapped in scrollable container (`edge-dialog-body`) while buttons remain fixed at bottom
- Dialog max-height set to 85vh with custom scrollbar styling for better UX
- Dropdowns maintain their own max-height (200px) and scroll independently within scrollable content area

## [0.3.5] - 2025-11-27

### Added
- Fullscreen canvas mode - immersive view without sidebar and toolbar interference
- Fullscreen toggle button in sidebar under "View" section
- Exit fullscreen button in top-right corner when in fullscreen mode
- Selection info popup window - appears when clicking nodes in fullscreen mode
- Popup displays comprehensive node details (English/Chinese labels, position, color, size, category, layers, timestamps)
- ESC key support - closes popup first, then exits fullscreen on second press
- Click-outside-to-close functionality for selection popup
- Popup positioning logic - automatically positions near click location while staying within viewport
- Fullscreen mode integration with node selection and overlap cycling
- New hotkey commands: `ea` (show edge arrows), `fs` (fullscreen canvas), `sv` (save view), `md` (merge database), `ml` (manage layers), `nt` (new graph template), `st` (open settings)
- Command palette updated with new command categories: Display Options, View Operations, Database Operations, Layer Management, Template Operations, Settings

### Changed
- Updated sidebar to include "View" section with fullscreen button
- Canvas container now supports fullscreen CSS class for immersive viewing
- Selection info popup replaces sidebar selection-info section when in fullscreen mode

### Technical Details
- Fullscreen manager module (`public/managers/fullscreenManager.js`) handles fullscreen state and popup display
- Canvas automatically resizes to fill viewport when entering/exiting fullscreen
- Popup content matches sidebar selection-info format for consistency
- Mouse handlers updated to show popup on node clicks in fullscreen mode
- Popup updates when cycling through overlapping nodes
- Popup closes when clicking empty canvas space or deselecting nodes
- Fullscreen state tracked internally to prevent popup display in normal mode
- Exit button uses Lucide icons with emoji fallback for offline support
- Hotkey manager (`public/managers/hotkeyManager.js`) updated with 7 new commands and proper async error handling
- Command palette (`public/managers/commandPalette.js`) automatically picks up new commands via `getCommands()` export
- New commands integrated with existing hotkey system and help overlay categories

## [0.3.4] - 2025-11-27

### Changed
- **Major Refactoring:** Split `index.html` (1812 lines) into modular template system
- **Major Refactoring:** Split `graph.js` (869 lines) into focused module structure
- Reduced `index.html` from 1812 lines to ~150 lines by extracting templates
- Reduced `graph.js` from 869 lines to ~280 lines by extracting specialized modules
- Updated `ARCHITECTURE.md` with comprehensive documentation of new modular structure

### Added
- Template loading system (`public/utils/templateLoader.js`) - dynamic HTML template loading via fetch()
- Template directory structure (`public/templates/`) with component templates:
  - `toolbar.html` - Toolbar component
  - `sidebar.html` - Sidebar component
  - `dialogs/` - 11 dialog templates (weight, node, load, save-as, search, connections, edge-search, merge, layer-management, layer-rename, settings)
- Graph module structure (`public/graph/`) with specialized modules:
  - `operations/nodeOperations.js` - Node CRUD operations (~100 lines)
  - `operations/edgeOperations.js` - Edge CRUD operations (~120 lines)
  - `handlers/mouseHandlers.js` - Mouse interaction handlers (~260 lines)
  - `layers/layerManager.js` - Layer management operations (~80 lines)
  - `connections/nodeConnections.js` - Node connection queries (~150 lines)
  - `utils/graphUtils.js` - Utility functions (~70 lines)
- Template loading supports both 'replace' and 'append' modes for flexible DOM injection
- Parallel template loading via Promise.all() for better performance

### Technical Details
- Templates load dynamically on page initialization via `templateLoader.js`
- Graph class now acts as orchestrator, delegating to specialized modules
- All modules maintain single responsibility principle
- 100% backward compatible - same public API, no breaking changes
- Improved maintainability: each component in separate file
- Better testability: modules can be tested independently
- Enhanced code organization: clear separation of concerns
- Templates cached in DOM after initial load for performance

## [0.3.3] - 2025-11-27

### Added
- Lucide icons integration - replaced emoji icons with professional SVG icons from Lucide icon library
- Offline fallback system for icons - three-tier fallback (local file → CDN → emojis) ensures icons work offline
- Settings dialog accessible from sidebar - comprehensive settings interface with tabbed navigation
- Fonts tab in settings dialog - allows users to customize fonts for UI and canvas rendering
- Font settings persistence - font preferences saved to localStorage and restored on app load
- UI font customization - change font family for interface elements (toolbar, dialogs, sidebar)
- Canvas label font customization - separate settings for English and Chinese labels on graph nodes
- Canvas font size control - adjustable font size slider (8-24px) for canvas labels
- Live font previews - real-time preview of selected fonts in settings dialog
- LXGW Bright font integration - added professional bilingual font (English + Chinese) from [LXGW Bright project](https://github.com/lxgw/LxgwBright)
- @font-face declarations for LXGW Bright - supports Light (300), Regular (400), Medium (500) weights with italic variants
- Font files stored in `public/fonts/` directory for local font loading
- Reset to defaults functionality - restore all font settings to original values

### Changed
- Replaced emoji icons with Lucide SVG icons throughout the UI for better consistency and professional appearance
- Updated settings dialog to include LXGW Bright in all font selectors (UI, Canvas English, Canvas Chinese)
- Enhanced font preview texts to show both English and Chinese characters for better font evaluation

### Technical Details
- Save/Discard button text updates now preserve icon structure by updating only span elements instead of replacing entire innerHTML
- Lucide icons re-initialized when Save/Discard buttons become visible to ensure icons render correctly
- Font settings stored in localStorage with key `graphApp_fontSettings`
- Font settings manager (`public/managers/fontSettingsManager.js`) handles persistence and application
- Settings dialog module (`public/ui/dialogs/settingsDialog.js`) manages UI interactions
- Font constants updated to support dynamic font changes (`DEFAULT_CHINESE_FONT_FAMILY`)
- Font changes trigger immediate graph redraw for canvas labels
- LXGW Bright font files (6 variants) copied to `public/fonts/` directory
- Font-face declarations use `font-display: swap` for optimal loading performance

## [0.3.2] - 2025-11-27

### Added
- Manual view state save button in sidebar - save current zoom and pan position on demand
- Change tracking for filter state (layer filters) - filter state changes are now tracked and can be saved/discarded with other changes
- New Graph Template button in sidebar - start fresh with a template graph containing 1 centered node and scale set to 2
- Template functionality (`public/ui/template.js`) - safer alternative to Clear button that creates a starting point instead of empty canvas

### Changed
- Removed automatic view state tracking - pan/zoom no longer triggers change tracking
- Toolbar Save/Discard buttons now focus on main content changes (nodes, edges, filterState) only
- View state is now saved separately via sidebar button instead of being tracked automatically
- Filter state changes are now tracked and included in Save/Discard operations
- Fixed node selection triggering change tracking - Save/Discard buttons only appear when nodes are actually moved, not just selected

### Fixed
- Fixed Save/Discard buttons appearing when clicking/right-clicking nodes without dragging them
- Fixed change tracking being triggered on node selection instead of only on actual position changes
- Fixed filterState changes not being saved properly - Save button now correctly detects and saves filterState changes
- Fixed layer dialog showing layers from other database files - layers are now properly filtered to only show layers from current database
- Fixed activeLayers persisting across database switches - activeLayers are now cleared and filtered when switching databases
- Fixed Lucide icons not displaying on Save/Discard buttons - icons now preserved when buttons are shown/hidden and text is updated

### Technical Details
- View state tracking removed from viewStateManager.js - no longer automatically tracks pan/zoom changes
- Filter state tracking added to changeTracker.js - filter state changes are tracked alongside nodes/edges
- Sidebar "Save View" button saves view state directly to database without change tracking
- Node drag detection improved - only tracks changes when node position actually changes (threshold: 0.01px)
- Toolbar Save/Discard buttons exclude viewState from change count and operations
- saveAllChanges() now properly checks for filterState changes in early return validation
- saveFilterStateToDb() accepts tracked filterState parameter to ensure correct data is saved
- importData() clears activeLayers to prevent stale layers from previous databases
- Database loading filters activeLayers to only include layers that exist in current database
- Layer dialog automatically closes when switching databases to force refresh on next open

## [0.3.1] - 2025-11-26

### Added
- Command palette feature - searchable command interface accessible via `Alt+P` keyboard shortcut
- Real-time command search with fuzzy matching by command name or key sequence
- Keyboard navigation in command palette: Arrow keys to navigate, Enter to execute, Escape to close
- Command grouping by category (Modes, Create, Delete, Edit, Navigation, Help) when no search query
- Match scoring algorithm for intelligent search result ordering
- Visual command display showing command key and description
- Click-outside-to-close functionality for command palette
- Global keyboard shortcuts: `Alt+P` for command palette, `Alt+H` for hotkey mode
- `public/managers/commandPalette.js` - Complete command palette module
- `public/managers/keyboardShortcuts.js` - Global keyboard shortcut manager
- Command palette and hotkey mode integration - automatically close each other when one opens
- Enhanced node tooltip - displays English label, Chinese label, category, and layers information on hover

### Changed
- Updated hotkey manager to export `getCommands()` function for command palette reuse
- Updated app initialization to include keyboard shortcuts setup
- Command palette reuses command definitions from hotkey manager for consistency
- Moved search-container toolbar section to leftmost position (before node-mode button) for better accessibility
- Updated USER_GUIDE.md with comprehensive documentation for command palette and hotkey mode features
- Updated README.md to include command palette and hotkey mode in features list and quick actions

### Technical Details
- Command palette uses overlay UI with search input and scrollable results list
- Search algorithm matches by command key or description with scoring for relevance
- Keyboard shortcuts use capture phase event listeners for global accessibility
- Circular dependency avoided by exposing functions on window object
- Command palette respects input fields - shortcuts don't trigger when typing in inputs
- Results container supports up to 400px height with scrollable overflow
- Selected command highlighted with blue background and left border indicator
- Command count displayed in footer with real-time updates

## [0.3.0] - 2025-11-26

### Added
- Vim-like hotkey manager with multi-character sequence support - activate hotkey mode to execute commands via keyboard shortcuts
- Hotkey mode button in toolbar - click to activate/deactivate hotkey mode
- Multi-character command sequences: `cn` (create node), `dn` (delete node), `en` (edit node), `ce` (create edge), `de` (delete edge), `ee` (edit edge), `ces` (create edge via search)
- Single-character mode shortcuts: `n` (node mode), `e` (edge mode), `s` (select mode)
- Navigation shortcuts: `f` (find/search), `l` (load), `w` (write/save), `c` (clear)
- Count prefix support: `3n` (create 3 nodes), `2dn` (delete 2 nodes) - numeric prefixes before commands
- Sequence timeout handling: 2-second timeout (like vim's `timeoutlen`) - resets sequence after inactivity
- Visual sequence display: shows `:sequence` at bottom of screen when typing commands
- Help overlay: press `?` in hotkey mode to see all available commands with descriptions
- Command validation: shows error notifications for invalid sequences
- Input field protection: hotkey mode doesn't interfere when typing in input fields
- `public/managers/hotkeyManager.js` - Complete hotkey management module with vim-like behavior

### Changed
- Updated toolbar to include hotkey mode button after mode selection buttons
- Hotkey mode integrates with existing mode system and command structure

### Fixed
- Fixed hotkey mode conflict where single-character commands (like `c`) executed immediately, preventing multi-character sequences (like `cn`, `ce`, `ces`) from being typed
- Hotkey manager now checks for longer sequence matches before executing shorter commands
- Commands with longer sequence variants now wait for timeout or next keypress before executing

### Technical Details
- Hotkey mode uses global keydown listener with capture phase for reliable event handling
- Sequence buffer tracks multi-character commands with timeout reset mechanism
- Command parsing extracts numeric prefixes and command sequences (e.g., "3n" → count: 3, command: "n")
- Partial match detection for autocomplete (shows possible completions)
- Maximum sequence length limit (10 characters) prevents infinite sequences
- Escape key always exits hotkey mode regardless of current state
- Visual feedback uses fixed-position overlay with monospace font and green terminal-style colors
- Help overlay displays commands grouped by category (Modes, Node Operations, Edge Operations, Navigation, Help)
- Commands execute immediately on exact match, or wait for timeout/next key on partial match
- Module exports: `activateHotkeyMode()`, `deactivateHotkeyMode()`, `toggleHotkeyMode()`, `isHotkeyModeActive()`

## [0.2.8] - 2025-11-26

### Added
- Database merge feature - merge data from another database file into the current database
- Merge dialog in sidebar with database selection and conflict resolution options
- Three conflict resolution strategies: Skip Conflicts (default), Replace Conflicts, Rename Conflicts
- Detailed merge statistics showing nodes/edges added, skipped, and renamed
- `POST /api/plugins/graph/merge` API endpoint for database merging
- `mergeFromDatabase()` service function with transaction support and conflict detection
- Node ID mapping system for tracking renamed nodes during merge
- Edge reference updates when nodes are renamed during merge
- Merge button in sidebar under "Database Operations" section
- Visual feedback for selected source database in merge dialog
- Merge button disabled state until database is selected

### Changed
- Updated sidebar to include "Database Operations" section before "Layer Management"
- Merge dialog follows existing dialog patterns and integrates with current architecture
- Updated README.md with expanded features list and improved organization
- Created comprehensive User Guide documentation (`docs/USER_GUIDE.md`)
- Created CHANGELOG archive system (`CHANGELOG_ARCHIVE.md`) for managing long changelog history

### Fixed
- Fixed merge dialog path storage issue - path now properly stored before dialog closes
- Fixed merge validation to prevent empty path errors
- Improved error handling with better validation and user feedback

### Technical Details
- Merge process uses database transactions for data integrity
- Nodes processed before edges to maintain reference integrity
- Conflict detection uses ID-based comparison for fast lookup
- Rename strategy generates new UUIDs and updates edge references automatically
- Replace strategy deletes existing items before inserting new ones
- Skip strategy preserves existing data and ignores conflicting items
- Merge statistics tracked: nodesAdded, nodesSkipped, nodesRenamed, edgesAdded, edgesSkipped, edgesRenamed
- Source database connection properly closed after merge completion
- Graph automatically reloaded after successful merge to display merged data

## [0.2.7] - 2025-11-26

### Added
- "Create Edge via Search" feature - connect distant nodes without manual navigation or zooming
- Edge search dialog with two search inputs (Source Node and Target Node)
- Node search functionality in edge dialog - search by English or Chinese labels
- Dropdown search results with keyboard navigation (Arrow keys, Enter, Escape)
- Weight input field for edge creation (default: 1)
- Category input field for edge creation (optional)
- Visual feedback showing selected source and target nodes
- Validation preventing self-loops and duplicate edges
- Bidirectional edge detection to prevent creating duplicate connections
- Success notifications when edges are created
- `public/ui/dialogs/edgeSearchDialog.js` - Edge search dialog module
- Sidebar button "Create Edge" for quick access to edge creation dialog

### Changed
- Updated sidebar to include "Create Edge" section with button and description
- Edge creation now supports category assignment during creation

### Technical Details
- Search results limited to 20 items per dropdown for performance
- Keyboard navigation supports ArrowDown/ArrowUp for result navigation, Enter for selection, Escape to close dropdowns
- Edge validation checks for existing edges in both directions (from→to and to→from)
- Change tracking integrated - edge creation properly tracked for save/discard functionality
- Dialog follows existing code patterns and integrates with current architecture
- Category support added after edge creation via `graph.addEdge()` method

## [0.2.6] - 2025-11-26

### Added
- Particle-based flow effect for edge direction visualization - animated particles flow along edges showing direction
- Flow animation system using `requestAnimationFrame` for smooth 60fps animation
- `renderEdgeFlow()` method in GraphRenderer - renders animated particles with glow effect along edges
- Animation loop management (`startFlowAnimation()`, `stopFlowAnimation()`, `animateFlow()`) for efficient rendering
- Event listener for "Show Edge Arrows" checkbox - enables/disables flow effect
- Flow particles with radial gradient glow effect for better visibility
- Particle animation parameters: 3 particles per edge, configurable speed and spacing

### Changed
- Updated "Show Edge Arrows" checkbox functionality - now shows animated flow particles instead of static arrows
- Updated `renderEdge()` method to use flow effect when enabled
- Flow effect replaces static arrow rendering for better direction visualization

### Fixed
- Fixed "Show Edge Arrows" checkbox not working - added missing event listener to update `window.appState.showEdgeArrows`
- Fixed checkbox state not being initialized on page load

### Technical Details
- Flow particles move from source node to target node, cycling continuously
- Particles use radial gradient for glow effect (bright center fading to transparent)
- Animation time tracked in seconds, particles positioned using phase calculations
- Particle size scales with zoom level for consistent visual appearance
- Animation loop only runs when flow effect is enabled (performance optimization)
- Particles positioned away from node boundaries to avoid overlap
- Flow speed: 0.4 cycles per second, particle spacing: 0.3 (configurable)
- Color: `#4A90E2` (blue) with transparency gradient

## [0.2.5] - 2025-11-26

### Added
- "View All Connections" feature in Edit Node dialog - shows all connections for a node in categorized sections
- Connections dialog displaying incoming, outgoing, and bidirectional connections
- "Highlight All Connections" button - highlights all connected nodes plus the current node on canvas
- Individual connection highlighting - click any connection item to highlight that specific node pair
- "Focus on Node" button in connections dialog - centers view on the selected node
- `getNodeConnections(nodeId)` method in Graph class - returns categorized connections (incoming, outgoing, bidirectional, all)
- `setHighlightedNodes(nodeIds)` method in Graph class - sets and highlights nodes on canvas
- Color-coded connection direction indicators (red for incoming, blue for outgoing, green for bidirectional)
- Connection count display showing total number of connections
- Connections button in Edit Node dialog for quick access

### Changed
- Updated Edit Node dialog to include Connections button
- Updated connections dialog to show node labels (English and Chinese), edge weights, and categories

### Technical Details
- Connections categorized by direction: incoming (edges pointing to node), outgoing (edges from node), bidirectional (pairs of edges in opposite directions or self-loops)
- Bidirectional detection identifies pairs of edges between same nodes in opposite directions
- Connection items are clickable for individual highlighting
- Dialog integrates with existing graph highlighting system (`highlightedNodes` array)
- Uses existing `focusOnNode` pattern for centering view on selected node
- Event listeners wired up in `setupDialogs()` function
- Functions exposed on window object for compatibility with non-module scripts

## [0.2.4] - 2025-11-24

### Added
- Smart node and edge selection with distance-based priority - selects closest node to click point
- Overlap detection system - detects all overlapping nodes and edges at click position
- Cycling through overlapping elements - click same position multiple times to cycle through candidates
- Modifier key support (Alt/Ctrl/Cmd) - hold modifier while clicking to select edges even when nodes overlap
- Visual feedback for overlapping elements - shows notification with current position in cycle (e.g., "1 of 3: Node Name")
- Selection info sidebar display - shows detailed node/edge information when selected
- `getNodesAt()` and `getEdgesAt()` methods for finding all overlapping candidates
- `onSelectionChange` callback system for updating UI when selection changes

### Changed
- Updated `getNodeAt()` to select closest node by distance instead of first match in array order
- Updated `getNodeAt()` to check nodes in reverse order (topmost first, matching visual z-order)
- Updated `handleMouseDown()` to implement smart selection with overlap cycling
- Updated `updateGraphInfo()` to call `updateSelectionInfo()` for sidebar updates
- Selection now triggers automatic sidebar updates via callback chain

### Fixed
- Fixed selection-info sidebar not displaying node/edge details when selecting elements
- Fixed selection info not updating when cycling through overlapping elements
- Fixed selection info not clearing when clicking empty space

### Technical Details
- Overlap cycling tracks candidates and current index with time/position thresholds (500ms, 5px)
- Distance-based selection uses scaled radius + 3px padding for easier clicking
- Selection info displays: English/Chinese labels, position, color, size, category, layers, timestamps
- Edge selection info displays: From/To nodes, weight, category
- Callback system: `onSelectionChange` → `updateGraphInfo()` → `updateSelectionInfo()`
- Compatible with legacy selection behavior while adding smart features

## [0.2.3] - 2025-11-25

### Added
- Layer filter state persistence per database - active layers and filter mode are now saved and restored
- `filter_state` database table for storing layer filter configuration per database file
- API endpoints for saving/loading filter state (`POST /filter-state`, `GET /filter-state`)
- Automatic filter state restoration when loading a database
- Pagination support for layer management dialog (15 items per page)
- Page number input field for direct navigation to any page in layer dialog
- Previous/Next buttons and Go button for layer dialog pagination

### Changed
- Updated `getAllGraphData()` to include filter state in response
- Updated layer dialog to save filter state when applying layer filters
- Updated sidebar mode radio buttons to save filter state when changed

### Fixed
- Fixed edges still rendering when connected nodes are filtered out by layer filter
- Fixed layer filter state not persisting across database switches
- Fixed layer filter state being lost when closing and reopening a database file

### Technical Details
- Filter state stored in `filter_state` table with single-row constraint (id = 1)
- Filter state includes: `layer_filter_enabled`, `layer_filter_active_layers` (JSON array), `layer_filter_mode`
- Edges are now filtered based on visible nodes - only edges connecting visible nodes are rendered
- Filter state automatically applied when database is loaded
- Compatible with legacy `filter_state` table format from `sqlite-manager.js`

## [0.2.2] - 2025-11-24

### Added
- Layer persistence to database - node layers are now saved and restored from database
- Database migration for `layers` column in `graph_nodes` table
- Layer management functionality with dialog interface
- Layer filtering with include/exclude modes
- Layer renaming functionality across all nodes
- Layer view saving/loading (localStorage) for quick access to layer configurations
- Layer summary display in sidebar showing layer count and filter status

### Changed
- Updated `graphService.js` to handle layers in create/update/import operations
- Updated `databaseService.js` to send/receive layers in all node operations
- Layers stored as comma-separated string in database (matching legacy format)
- Layers parsed from comma-separated string to array on load

### Fixed
- Fixed layers not persisting across page refreshes
- Fixed layers being lost when switching databases
- Fixed layers not being saved when nodes are created/updated

### Technical Details
- Layer storage format: `["layer1", "layer2"]` → `"layer1,layer2"` (comma-separated)
- Layer parsing: `"layer1,layer2"` → `["layer1", "layer2"]` (on load)
- Database schema migration adds `layers TEXT` column to existing databases
- Layer management UI integrated with existing graph instance
- Compatible with legacy database format from `sqlite-manager.js`

## [0.2.1] - 2025-11-23

### Added
- Pagination support for search dialog results (20 items per page)
- Page number input field for direct navigation to any page
- Previous/Next buttons for sequential pagination navigation
- Go button as alternative to Enter key for page navigation
- Development guide (`docs/DEVELOPMENT_GUIDE.md`) with UI/UX guidelines
- Pagination design principle: all pagination controls must include page number input

### Changed
- Search dialog now handles thousands of results efficiently with pagination
- Updated search dialog pagination to match load dialog pattern (complete implementation)
- Search count display now shows range and page info (e.g., "Showing 1-20 of 150 nodes (Page 1/8)")

### Fixed
- Fixed search dialog result items not being clickable (optimized hover handler to avoid rebuilding HTML)
- Fixed click handlers being lost due to HTML rebuild on every hover event
- Fixed child element clicks not registering on parent container

### Technical Details
- Pagination uses `RESULTS_PER_PAGE = 20` constant for consistent page size
- Event delegation used for reliable click handling on dynamically generated items
- Hover handler optimized to only rebuild HTML when changing pages, not on every hover
- Multiple click handlers (event delegation + inline onclick + onmousedown) for redundancy
- Child elements use `pointer-events: none` to ensure clicks register on parent
- Comprehensive debugging documentation in `docs/DEBUGGING_LESSON_SEARCH_DIALOG_CLICKS.md`

## [0.2.0] - 2025-11-23

### Added
- Node search functionality with inline search bar in toolbar
- Search dialog for advanced node search and navigation
- Real-time node filtering as user types
- Keyboard navigation support (arrow keys, Enter, Escape) in search results
- Visual highlighting of search results on the graph canvas
- Search count display showing number of matching nodes
- Support for searching by both English and Chinese labels
- `public/ui/search/searchBar.js` - Inline search bar module
- `public/ui/dialogs/searchDialog.js` - Search dialog module

### Changed
- Updated toolbar to include search input and search dialog button
- Updated sidebar to display search count in graph info section
- Simplified search dropdown implementation to match legacy code patterns

### Fixed
- Fixed search dropdown not closing when clicking outside (simplified to use DOM containment)
- Removed overcomplicated event handling in favor of simple `.contains()` check
- Fixed HTML structure to properly nest dropdown inside `.search-container`

### Technical Details
- Search uses simple DOM containment (`container.contains(e.target)`) for click-outside detection
- Dropdown positioned absolutely relative to `.search-container` parent
- Search results limited to 20 items for performance
- Graph highlighting integrated with existing `highlightedNodes` system
- Comprehensive debugging documentation in `docs/DEBUGGING_LESSON_SEARCH_DROPDOWN.md`
