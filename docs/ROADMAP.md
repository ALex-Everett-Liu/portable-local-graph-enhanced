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

### Graph Analysis Architecture Reorganization

**Status:** 📋 Planned  
**Priority:** Medium  
**Estimated Effort:** Medium

**Problem:**
Current graph analysis code structure is confusing with overlapping responsibilities and unclear naming:

1. **`public/utils/analysis/graph-analysis.js`** (GraphAnalysis class):
   - Low-level analysis engine/coordinator class
   - Wraps `CentralityCalculator`, `PathfindingEngine`, `ClusteringEngine`
   - Provides algorithm implementations
   - Located in `utils/analysis/` (utility/algorithm library)
   - Instantiated as `this.graphAnalysis` in Graph class

2. **`public/graph/analysis/graphAnalysisOperations.js`**:
   - Graph class operations module (similar to `nodeOperations.js`, `edgeOperations.js`)
   - Wraps GraphAnalysis with Graph-specific logic (filtering, updating nodes, rendering)
   - Located in `graph/analysis/` (part of Graph class modular structure)
   - Provides methods that delegate to GraphAnalysis instance

**Issues:**
- Both files have "analysis" in the name, causing confusion
- Both are in "analysis" directories with different purposes
- Inconsistent naming conventions (kebab-case vs camelCase)
- Unclear separation of concerns between algorithm library and Graph class operations
- The relationship between the two is not immediately obvious

**Current Structure:**
```
public/
├── utils/
│   └── analysis/
│       ├── graph-analysis.js          # GraphAnalysis class (algorithm library)
│       ├── centrality-calculator.js
│       ├── pathfinding-engine.js
│       └── clustering-engine.js
└── graph/
    └── analysis/
        └── graphAnalysisOperations.js  # Graph class operations wrapper
```

**Considerations:**
- Should `graphAnalysisOperations.js` be renamed to match other operation modules? (`analysisOperations.js`)
- Should the `graph/analysis/` directory be renamed to avoid confusion with `utils/analysis/`?
- Should GraphAnalysis operations be consolidated differently?
- Is the current separation of concerns appropriate, or should it be restructured?
- How can we make the relationship between these files clearer?

**Potential Solutions to Consider:**
1. **Rename approach**: Rename `graphAnalysisOperations.js` → `analysisOperations.js` to match naming pattern
2. **Directory reorganization**: Move or rename directories to clarify purpose
3. **Consolidation**: Merge some functionality if separation is unnecessary
4. **Documentation**: Add clear comments/docs explaining the relationship
5. **Hybrid**: Combination of above approaches

**Files Affected:**
- `public/utils/analysis/graph-analysis.js`
- `public/graph/analysis/graphAnalysisOperations.js`
- `public/graph.js` (imports)
- Any files that import or use these modules

**Related Files:**
- `public/graph/operations/nodeOperations.js` (naming pattern reference)
- `public/graph/operations/edgeOperations.js` (naming pattern reference)
- `docs/ARCHITECTURE.md` (should be updated after reorganization)

**Next Steps:**
1. Review current usage patterns of both files
2. Analyze dependencies and relationships
3. Propose concrete reorganization plan
4. Get feedback before implementing changes
5. Update documentation after reorganization

---

### Code Cleanup

**Status:** 📋 Planned  
**Priority:** Low  
**Estimated Effort:** Small

**Items:**
- Remove unused legacy code from `temp/` directory
- Consolidate duplicate layer parsing logic
- Improve error handling consistency
- Add more comprehensive unit tests

### Merge Dialog Conflict Resolution Simplification

**Status:** 📋 Planned  
**Priority:** Low  
**Estimated Effort:** Small

**Description:**
Evaluate whether conflict resolution UI in merge dialog is necessary. Since merge uses UUID-based comparison:
- Same UUID = same entity (duplicate) → skip by default
- Different UUID = different entity → add it

**Considerations:**
- Current implementation has three strategies: skip, replace, rename
- Most realistic use case: merging independent databases (no UUID conflicts)
- Need to survey actual use cases to determine if replace/rename options are needed
- Simplifying to "skip duplicates" would reduce UI complexity

**Files Affected:**
- `public/ui/dialogs/mergeDialog.js`
- `public/templates/dialogs/merge-dialog.html`
- `services/graphService.js` (mergeFromDatabase function)

**Next Steps:**
- Survey real-world merge scenarios and use cases
- Determine if conflict resolution options are actually needed
- Consider simplifying to default "skip duplicates" behavior

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

**Last Updated:** 2025-11-28  
**Version:** 0.4.1

