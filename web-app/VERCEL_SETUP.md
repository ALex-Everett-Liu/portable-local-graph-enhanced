# Quick Vercel Setup Guide

## ⚠️ CRITICAL: Root Directory Setting

**You MUST set the Root Directory to `web-app` in Vercel settings, otherwise it will try to build the Electron app and fail!**

## Step-by-Step Setup

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Sign in

2. **Import Project**
   - Click "Add New..." → "Project"
   - Import: `ALex-Everett-Liu/portable-local-graph-enhanced`
   - Select branch: `feature/web-app-viewer` (or `main` after merge)

3. **Configure Settings** (BEFORE clicking Deploy!)
   - Click "Configure Project" or "Edit" button
   - **Root Directory**: Click "Edit" → Enter `web-app` → Save
   - **Framework Preset**: "Other"
   - **Build Command**: Leave empty (or `echo 'No build needed'`)
   - **Output Directory**: Leave empty
   - **Install Command**: Leave empty

4. **Deploy**
   - Click "Deploy"
   - Should complete in ~10 seconds (no build needed)

## Verify Settings

After deployment, check:
- Settings → General → Root Directory = `web-app`
- Settings → Build & Development Settings:
  - Build Command = empty or `echo 'No build needed'`
  - Output Directory = empty
  - Install Command = empty

## If Build Still Fails

1. Delete the deployment
2. Go to Settings → General
3. Verify Root Directory = `web-app`
4. Save settings
5. Create new deployment

## Expected Build Log

✅ **Correct build log** (should see):
```
Cloning repository...
Installing dependencies... (skipped or very fast)
Building... (skipped or echo command)
Deploying...
```

❌ **Wrong build log** (if Root Directory not set):
```
Running "npm run build"
electron-builder...
sqlite3 native dependencies...
ERROR: ModuleNotFoundError
```

If you see electron-builder or sqlite3 errors, Root Directory is NOT set correctly!

