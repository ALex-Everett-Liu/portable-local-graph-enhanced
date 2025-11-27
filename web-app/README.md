# Graph Viewer Web App

A minimal web application for viewing graph data from SQLite database files. This is a read-only viewer that allows you to explore graph visualizations in your browser.

## Features

- 📁 Load SQLite database files (.db)
- 🎨 Visualize nodes and edges on canvas
- 🔍 Pan and zoom functionality
- 📊 Read-only exploration (no editing capabilities)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Navigate to the web-app directory:
```bash
cd web-app
```

2. Install dependencies:
```bash
npm install
```

### Running Locally

Start the development server:
```bash
npm start
```

The app will be available at `http://localhost:3000`

### Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Click "📁 Load Database File" button
3. Select a `.db` file from your local file system
4. The graph will be rendered on the canvas
5. Use mouse drag to pan
6. Use mouse wheel to zoom in/out
7. Click "Reset View" to return to default zoom/pan

## Technical Details

- **SQLite WASM**: Uses sql.js (SQLite compiled to WebAssembly) to read database files directly in the browser
- **Canvas Rendering**: Uses HTML5 Canvas for graph visualization
- **No Backend Required**: All processing happens in the browser (client-side only)

## Future Development

This minimal version can be extended with:
- Export to JSON/CSV
- Search functionality
- Filter by layers/categories
- Deploy to Vercel or other hosting platforms

## Notes

- The app reads the same database schema as the Electron desktop app
- Only read operations are supported (no editing)
- Database files are loaded entirely into memory

