# Synchronous Blocking Operations Report

## Overview

This report identifies all synchronous blocking operations (`alert()`, `confirm()`, `prompt()`) found in the codebase that can cause Windows focus bugs in Electron applications.

**⚠️ IMPORTANT:** The `web-app/` directory is a **standalone web application** (not Electron) that runs in browsers. While `alert()` calls there should still be replaced for better UX, they do **NOT** cause the critical Electron Windows focus bug.

**Total Issues Found:**
- **Electron App (`public/`)**: 20 `alert()` calls, 6 `confirm()` calls = **26 critical issues**
- **Web App (`web-app/`)**: 3 `alert()` calls = **3 non-critical issues** (UX improvement only)
- **`prompt()` calls**: 0 instances

---

## ⚠️ Electron-Specific Critical Files (Windows Focus Bug Risk)

### 1. `public/services/databaseService.js` (4 alert calls, 1 confirm call)

---

### 2. `public/ui/template.js` (2 alert calls)
**Lines:** 310, 330, 346, 372, 433, 439

**Issues:**
- Line 310: `alert(\`Failed to load database: ${error.message}\`);` - Error handling
- Line 330: `confirm(...)` - Database switch confirmation (CRITICAL - needs custom modal)
- Line 346: `alert(\`Failed to save database: ${error.message}\`);` - Error handling
- Line 372: `alert(\`Failed to create new database: ${error.message}\`);` - Error handling
- Line 433: `alert(...)` - Backup success message
- Line 439: `alert(\`Failed to backup database: ${error.message}\`);` - Error handling

**Recommendation:** 
- Alerts → `showToast(message, 'error'/'success', 5000)`
- Confirm → Custom modal dialog (critical action)

---

### 3. `public/ui/dialogs/semanticMapDialog.js` (1 alert call, 1 confirm call)
**Lines:** 13, 81

**Issues:**
- Line 13: `alert('Graph instance not available. Please wait for the application to load.');` - Warning
- Line 81: `alert('Failed to create template: ' + error.message);` - Error handling

**Recommendation:** Replace with `showToast(message, 'warning'/'error', 5000)`

---

### 4. `public/ui/dialogs/mergeDialog.js` (2 alert calls, 1 confirm call)
**Lines:** 601, 847

**Issues:**
- Line 601: `confirm('Are you sure you want to delete all embeddings? This cannot be undone.')` - CRITICAL confirmation
- Line 847: `alert(...)` - Popup blocked fallback message

**Recommendation:**
- Confirm → Custom modal dialog (destructive action)
- Alert → `showToast(message, 'warning', 5000)`

---

### 5. `public/ui/dialogs/edgeSearchDialog.js` (5 alert calls)
**Lines:** 12, 121, 154, 162

**Issues:**
- Line 12: `confirm(...)` - Unsaved changes warning (CRITICAL - needs custom modal)
- Line 121: `alert('Please select a source database file to merge.');` - Validation
- Line 154: `alert(\`Merge completed successfully!...\`);` - Success message
- Line 162: `alert(\`Failed to merge database: ${error.message}\`);` - Error handling

**Recommendation:**
- Confirm → Custom modal dialog
- Alerts → `showToast(message, 'warning'/'success'/'error', 5000)`

---

### 6. `public/ui/dialogs/searchDialog.js` (2 alert calls)
**Lines:** 352, 362, 375, 394, 409

**Issues:**
- Line 352: `alert('Please select both source and target nodes');` - Validation
- Line 362: `alert('Source and target nodes cannot be the same');` - Validation
- Line 375: `alert('Weight must be a positive number');` - Validation
- Line 394: `alert('One or both nodes not found');` - Error
- Line 409: `alert('An edge already exists between these nodes');` - Warning

**Note:** This file already has fallback logic using `window.showNotification`, but still falls back to `alert()`.

**Recommendation:** Remove `alert()` fallbacks, use only `showNotification` or `showToast`

---

### 7. `public/ui/dialogs/loadDialog.js` (2 alert calls, 1 confirm call)
**Lines:** 648, 690

**Issues:**
- Line 648: `alert(\`Node not found: ${nodeId}\`);` - Error
- Line 690: `alert(\`Node not found: ${nodeId}\`);` - Error

**Recommendation:** Replace with `showToast(message, 'error', 3000)`

---

### 8. `public/ui/dialogs/settingsDialog.js` (1 confirm call)
**Lines:** 15, 216, 228

**Issues:**
- Line 15: `confirm(...)` - Unsaved changes warning (CRITICAL - needs custom modal)
- Line 216: `alert(\`Please enter a page number between 1 and ${totalPages}\`);` - Validation
- Line 228: `alert('Please select a database file to load.');` - Validation

**Recommendation:**
- Confirm → Custom modal dialog
- Alerts → `showToast(message, 'warning', 3000)`

---

### 9. `public/ui/saveDiscardUI.js` (1 confirm call)

---

## 🌐 Web App Files (Non-Critical - UX Improvement Only)

**Note:** These files are in the `web-app/` directory, which is a standalone browser-based application (not Electron). While `alert()` should be replaced for better UX, these do **NOT** cause the critical Electron Windows focus bug.

### 1. `web-app/app.js` (3 alert calls)
**Lines:** 81, 194, 568

**Issues:**
- Line 81: `alert(\`Failed to load database: ${error.message}\`);` - Error handling
- Line 194: `alert(\`Failed to load JSON: ${error.message}\`);` - Error handling  
- Line 568: `alert(\`Failed to load sample graph: ${error.message}\`);` - Error handling

**Priority:** 🟢 **LOW** - UX improvement only (not Electron-related)

**Recommendation:** Replace with a browser-compatible notification system (could use `showNotification` or implement a simple toast system)
**Line:** 316

**Issues:**
- Line 316: `confirm(confirmMessage)` - Settings reset confirmation (CRITICAL - needs custom modal)

**Recommendation:** Replace with custom modal dialog

---

**Line:** 394

**Issues:**
- Line 394: `confirm('Clear all nodes and edges? This will delete all data from the database.')` - CRITICAL destructive action

**Recommendation:** Replace with custom modal dialog

---

## Implementation Status

### Current State
- ✅ `showNotification()` exists in `public/ui-functions.js` (supports 'success' and 'error' types)
- ❌ `showToast()` function does NOT exist (mentioned in guide but not implemented)
- ❌ Toast container HTML element does NOT exist
- ⚠️ Some files check for `window.showNotification` but still fall back to `alert()`

### Required Actions

1. **Implement `showToast()` function** (or enhance `showNotification()` to match guide specification)
   - Support types: 'success', 'error', 'warning', 'info'
   - Support custom duration
   - Auto-dismiss functionality
   - Stackable notifications

2. **Add toast container to HTML**
   - Add `<div id="toastContainer" class="toast-container"></div>` to main HTML
   - Add CSS styles for toast notifications

3. **Replace all `alert()` calls** with `showToast()`
   - Use appropriate types (error, warning, info, success)
   - Set appropriate durations (3000ms default, 5000ms for errors)

4. **Replace all `confirm()` calls** with custom modal dialogs
   - Critical actions require proper modal dialogs
   - Cannot use toasts for confirmations (per guide)

5. **Remove fallback `alert()` calls** in files that already check for `showNotification`

---

## Priority Classification

### 🔴 **CRITICAL** (Must fix immediately - causes Electron Windows focus bugs)
All `alert()`, `confirm()`, and `prompt()` calls in the **`public/` directory** (Electron app) are critical on Windows.

**Affected:** `public/` directory only (Electron renderer process)

### 🟡 **HIGH PRIORITY** (Confirmation dialogs)
These need custom modal implementations:
- Database switch confirmation (`databaseService.js:330`)
- Settings reset confirmation (`settingsDialog.js:316`)
- Clear graph confirmation (`saveDiscardUI.js:394`)
- Delete embeddings confirmation (`semanticMapDialog.js:601`)
- Unsaved changes warnings (`loadDialog.js:15`, `mergeDialog.js:12`)

### 🟢 **MEDIUM PRIORITY** (Simple notifications)
These can be replaced with `showToast()`:
- All error messages
- All success messages
- Validation warnings

---

## Migration Strategy

### Phase 1: Implement Toast System (Electron App Only)
1. Create `showToast()` function matching guide specification in `public/` directory
2. Add toast container to HTML templates (`public/index.html` or templates)
3. Add CSS styles for toast notifications
4. **Focus on Electron app (`public/`) first** - this is where the critical Windows focus bug occurs

### Phase 2: Replace Electron Alert Calls (CRITICAL)
1. Replace all `alert()` calls in `public/` directory with `showToast()`
2. Remove fallback `alert()` calls in files using `showNotification`
3. Test each replacement on Windows

### Phase 3: Implement Custom Modals (Electron App)
1. Create reusable confirmation modal component for Electron app
2. Replace all `confirm()` calls in `public/` directory with custom modals
3. Test critical actions on Windows

### Phase 4: Electron Testing (CRITICAL)
1. Test on Windows to verify no focus bugs
2. Test all error scenarios
3. Test all confirmation dialogs
4. Verify accessibility

### Phase 5: Web App Improvements (Optional - Low Priority)
1. Consider implementing a simple notification system for `web-app/`
2. Replace `alert()` calls in `web-app/app.js` for better UX
3. This is **not critical** - web app doesn't have Electron focus bug

---

## Files Summary

### Electron App (`public/` directory) - 🔴 CRITICAL

| File | alert() | confirm() | prompt() | Total |
|------|---------|-----------|----------|-------|
| `public/services/databaseService.js` | 4 | 1 | 0 | 5 |
| `public/ui/template.js` | 2 | 0 | 0 | 2 |
| `public/ui/dialogs/semanticMapDialog.js` | 1 | 1 | 0 | 2 |
| `public/ui/dialogs/mergeDialog.js` | 2 | 1 | 0 | 3 |
| `public/ui/dialogs/edgeSearchDialog.js` | 5 | 0 | 0 | 5 |
| `public/ui/dialogs/searchDialog.js` | 2 | 0 | 0 | 2 |
| `public/ui/dialogs/loadDialog.js` | 2 | 1 | 0 | 3 |
| `public/ui/dialogs/settingsDialog.js` | 0 | 1 | 0 | 1 |
| `public/ui/saveDiscardUI.js` | 0 | 1 | 0 | 1 |
| **ELECTRON TOTAL** | **20** | **6** | **0** | **26** |

### Web App (`web-app/` directory) - 🟢 LOW PRIORITY

| File | alert() | confirm() | prompt() | Total |
|------|---------|-----------|----------|-------|
| `web-app/app.js` | 3 | 0 | 0 | 3 |
| **WEB APP TOTAL** | **3** | **0** | **0** | **3** |

### Grand Total
- **Electron (Critical)**: 26 issues
- **Web App (Non-critical)**: 3 issues
- **Overall Total**: 29 issues

---

## Next Steps

1. ✅ Review this report
2. ⏳ Implement `showToast()` function (or enhance existing `showNotification()`)
3. ⏳ Add toast container HTML and CSS
4. ⏳ Replace `alert()` calls systematically
5. ⏳ Implement custom modal dialogs for `confirm()` calls
6. ⏳ Test on Windows
7. ⏳ Update documentation

---

**Generated:** $(date)
**Guide Reference:** `docs/TOAST_NOTIFICATIONS_GUIDE.md`

