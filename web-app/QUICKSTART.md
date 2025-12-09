# Quick Start Guide

## Running the Web App

1. **Install dependencies** (if not already done):
   ```bash
   cd web-app
   npm install
   ```

2. **Start the server**:
   ```bash
   npm start
   ```

3. **Open in browser**:
   - Navigate to `http://localhost:3000`
   - You should see the graph viewer interface

4. **Load a database file**:
   - Click the "📁 Load Database File" button
   - Select a `.db` file from your `data/` folder (e.g., `graph.db`)
   - The graph will render automatically

## Controls

- **Pan**: Click and drag with mouse
- **Zoom**: Scroll with mouse wheel
- **Reset View**: Click "Reset View" button

## Troubleshooting

- If SQL.js fails to load, check your internet connection (it loads from CDN)
- Make sure the database file is a valid SQLite database
- Check browser console for any error messages

## Testing with Sample Data

You can test with any `.db` file from the `data/` folder in the parent directory.

