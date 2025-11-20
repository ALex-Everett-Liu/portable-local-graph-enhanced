# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2025-01-XX

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
