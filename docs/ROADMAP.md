# Roadmap & Future Improvements

This document tracks planned features, improvements, and technical debt items for future implementation.

## Table of Contents

- [Layer Management](#layer-management)
- [UI/UX Improvements](#uiux-improvements)
- [Performance Optimizations](#performance-optimizations)
- [Technical Debt](#technical-debt)
- [Feature Requests](#feature-requests)

---

## Layer Management

### Layer Input Normalization

**Status:** 📋 Planned  
**Priority:** Low  
**Estimated Effort:** Small

**Description:**
Normalize layer input to treat variations as equivalent:
- `layer1, layer2` → `["layer1", "layer2"]` (sorted)
- `layer2, layer1` → `["layer1", "layer2"]` (sorted)
- `layer1,layer2` → `["layer1", "layer2"]` (sorted)
- `layer2,layer1` → `["layer1", "layer2"]` (sorted)

**Rationale:**
- Order doesn't affect functionality (filtering uses `.some()`)
- Provides consistent display across nodes
- Easier comparison/debugging
- Cleaner database storage (same logical data stored consistently)
- Better UX (users see predictable ordering)

**Implementation Notes:**
- Sort layers alphabetically after parsing
- Remove duplicates
- Store in consistent order
- Update parsing in `public/ui-functions.js` (line 189-192)
- Update database loading in `public/services/databaseService.js` (line 28)
- Consider case-insensitive sorting for better consistency

**Files to Modify:**
- `public/ui-functions.js` - Layer input parsing
- `public/services/databaseService.js` - Database layer parsing
- `services/graphService.js` - Backend layer handling (if needed)

**Considerations:**
- Performance impact is minimal (sorting small arrays)
- Users lose control over display order (may be desired)
- Need to ensure rename functionality still works correctly

---

## UI/UX Improvements

### Enhanced Layer Dialog Features

**Status:** 📋 Planned  
**Priority:** Medium  
**Estimated Effort:** Medium

**Potential Features:**
- Layer color coding/visual indicators
- Layer usage statistics (how many nodes per layer)
- Bulk layer operations (assign layer to multiple selected nodes)
- Layer templates/presets
- Export/import layer configurations

### Improved Search Functionality

**Status:** 📋 Planned  
**Priority:** Low  
**Estimated Effort:** Medium

**Potential Features:**
- Advanced search filters (by layer, category, etc.)
- Search history
- Saved search queries
- Search result highlighting improvements

---

## Performance Optimizations

### Database Query Optimization

**Status:** 📋 Planned  
**Priority:** Low  
**Estimated Effort:** Medium

**Potential Improvements:**
- Add indexes for frequently queried fields
- Optimize layer filtering queries
- Batch operations for bulk updates

### Rendering Performance

**Status:** 📋 Planned  
**Priority:** Low  
**Estimated Effort:** Medium

**Potential Improvements:**
- Virtual scrolling for large node lists
- Canvas rendering optimizations
- Debounce/throttle expensive operations

---

## Technical Debt

### Code Cleanup

**Status:** 📋 Planned  
**Priority:** Low  
**Estimated Effort:** Small

**Items:**
- Remove unused legacy code from `temp/` directory
- Consolidate duplicate layer parsing logic
- Improve error handling consistency
- Add more comprehensive unit tests

### Documentation

**Status:** 📋 Planned  
**Priority:** Low  
**Estimated Effort:** Small

**Items:**
- Add JSDoc comments to all public functions
- Document layer management API
- Create user guide for layer features
- Add architecture diagrams

---

## Feature Requests

### Layer Hierarchy/Grouping

**Status:** 💡 Idea  
**Priority:** Low  
**Estimated Effort:** Large

**Description:**
Support hierarchical layers or layer groups (e.g., "parent/child" relationships)

### Layer Permissions/Visibility

**Status:** 💡 Idea  
**Priority:** Low  
**Estimated Effort:** Medium

**Description:**
Control which layers are visible/editable per user or context

### Layer Annotations

**Status:** 💡 Idea  
**Priority:** Low  
**Estimated Effort:** Medium

**Description:**
Add notes/descriptions to layers for documentation purposes

---

## Status Legend

- 📋 **Planned** - Feature is planned but not yet started
- 🚧 **In Progress** - Feature is currently being worked on
- ✅ **Completed** - Feature has been implemented
- 💡 **Idea** - Feature is under consideration, not yet planned
- ⏸️ **On Hold** - Feature is temporarily paused
- ❌ **Cancelled** - Feature has been cancelled

## Priority Legend

- **Critical** - Must be done soon, blocking other work
- **High** - Important, should be done in near future
- **Medium** - Nice to have, can be done when time permits
- **Low** - Optional, can be done if resources allow

---

**Last Updated:** 2025-11-24  
**Version:** 0.2.2

