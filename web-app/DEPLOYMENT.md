# Deployment Guide for Vercel

This guide explains how to deploy the Graph Viewer Web App to Vercel.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup) (free tier is fine)
2. Vercel CLI installed (optional, for command-line deployment)
3. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Options

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Sign in or create an account

2. **Import Your Project**
   - Click "Add New..." → "Project"
   - Import your Git repository
   - Select the repository containing the `web-app` folder

3. **Configure Project Settings** ⚠️ **CRITICAL**
   - **Root Directory**: Set to `web-app` (MUST be set to web-app folder)
   - **Framework Preset**: Select "Other" or "Static Site"
   - **Build Command**: Leave empty or set to `echo 'No build needed'`
   - **Output Directory**: Leave empty (files are in root of web-app)
   - **Install Command**: Leave empty (no dependencies needed for static site)
   
   **Important**: If you don't set Root Directory to `web-app`, Vercel will try to build the Electron app and fail!

4. **Environment Variables**
   - None required for this app

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your app will be live at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Navigate to web-app directory**
   ```bash
   cd web-app
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Follow the prompts**
   - Link to existing project or create new one
   - Confirm settings
   - Deploy!

5. **For production deployment**
   ```bash
   vercel --prod
   ```

## Important Notes

### Database Files vs JSON Files

**On Vercel, you CANNOT upload `.db` files to the server.** However, users can still:

1. **Upload `.db` files via the file input** (client-side)
   - The file input works perfectly - users select files from their local computer
   - SQL.js processes the file entirely in the browser
   - No server-side file storage needed

2. **Use JSON export files instead** (recommended for sharing)
   - Export your database from the Electron app as JSON
   - Users can load the JSON file via the "Load JSON Export" button
   - JSON files are smaller and easier to share/host

### Converting Database to JSON

If you want to pre-load a database on Vercel:

1. **Export from Electron App**:
   - Open your Electron app
   - Go to sidebar → Database Operations → Export
   - Select "JSON" format
   - Download the JSON file

2. **Host the JSON file**:
   - Option A: Upload to a CDN (e.g., GitHub Releases, Cloudflare R2, etc.)
   - Option B: Include in the `web-app/public/` folder (if you create one)
   - Option C: Users upload it themselves via the file input

3. **Load in Web App**:
   - Users click "Load JSON Export"
   - Select the JSON file
   - Graph renders automatically

## Project Structure for Vercel

Vercel will serve these files:
```
web-app/
├── index.html          # Main HTML file
├── app.js              # Main application logic
├── graph-renderer.js   # Rendering engine
├── styles.css          # Styles
├── utils/              # Utility modules
├── package.json        # Dependencies (not needed for static)
└── vercel.json         # Vercel configuration
```

## Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## Environment Variables

Currently, no environment variables are needed. If you add features that require API keys or configuration, you can add them in:
- Vercel Dashboard → Project Settings → Environment Variables

## Troubleshooting

### ⚠️ Build Error: "electron-builder" or "sqlite3" native dependencies

**Problem**: Vercel is trying to build the Electron app instead of deploying the static web app.

**Solution**: 
1. Go to Vercel Dashboard → Your Project → Settings → General
2. Scroll to "Root Directory"
3. **Set Root Directory to `web-app`** (this is critical!)
4. Save and redeploy

**Why this happens**: Without setting Root Directory, Vercel uses the repository root which contains the Electron app's `package.json` with `electron-builder` build script.

### SQL.js Not Loading
- Check browser console for errors
- Ensure internet connection (SQL.js loads from CDN)
- Check that `index.html` has the correct SQL.js script tag

### Files Not Found (404)
- Ensure `vercel.json` is configured correctly
- Check that all file paths are relative (not absolute)
- Verify files are committed to Git
- Make sure Root Directory is set to `web-app`

### CORS Issues
- Vercel handles CORS automatically for static files
- If loading JSON from external source, ensure CORS headers are set

### Build Command Running Electron Builder
- Verify Root Directory is set to `web-app` in project settings
- Check that Build Command is empty or set to `echo 'No build needed'`
- Verify Install Command is empty (no dependencies needed)

## Performance Optimization

1. **CDN Caching**: Vercel automatically caches static assets
2. **SQL.js**: Already loaded from CDN (cached by browser)
3. **File Size**: Keep JSON exports reasonable (< 10MB recommended)

## Updating Your Deployment

Every time you push to your Git repository:
- Vercel automatically creates a new deployment
- Previous deployments remain available
- You can rollback if needed

## Example Workflow

1. **Development**:
   ```bash
   cd web-app
   npm start  # Test locally at localhost:3000
   ```

2. **Commit Changes**:
   ```bash
   git add .
   git commit -m "Update web app"
   git push
   ```

3. **Deploy**:
   - Vercel automatically deploys on push (if connected)
   - Or run `vercel --prod` manually

4. **Share**:
   - Share your Vercel URL: `https://your-project.vercel.app`
   - Users can upload `.db` or `.json` files to view graphs

## Support

For Vercel-specific issues, check:
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

