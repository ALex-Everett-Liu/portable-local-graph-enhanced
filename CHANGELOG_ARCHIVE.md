# Changelog Archive

This file contains archived changelog entries for older versions.
For recent changes, see [CHANGELOG.md](./CHANGELOG.md).

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

