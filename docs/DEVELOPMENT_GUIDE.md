# Development Guide

This guide contains development principles, UI/UX guidelines, and best practices for contributors working on this project.

## Table of Contents

- [UI/UX Guidelines](#uiux-guidelines)
  - [Pagination Controls](#pagination-controls)
- [Code Style](#code-style)
- [Module Organization](#module-organization)

## UI/UX Guidelines

### Pagination Controls

**Principle:** Pagination controls must always include a page number input area to allow users to navigate directly to any page.

#### Design Requirements

1. **Page Number Input Required**
   - All pagination controls MUST include an input field where users can type a page number
   - The input should accept numeric values and validate against the total page count
   - Pressing Enter should navigate to the specified page

2. **Previous/Next Buttons (Optional)**
   - Previous/Next buttons are acceptable as supplementary navigation
   - However, they should NOT be the only navigation method
   - The page number input is the primary navigation method

3. **Go Button (Optional)**
   - A "Go" button next to the input is acceptable as an alternative to pressing Enter
   - Provides visual feedback and accessibility option
   - Should trigger the same navigation as Enter key

4. **Page Information Display**
   - Always show current page and total pages (e.g., "Page 1 of 5")
   - Display should be clear and visible
   - May include additional context like total items (e.g., "Page 1 of 5 (50 total)")

#### Example Implementations

**Simple Implementation** (like searchDialog.js):
```html
<div id="pagination-controls" style="display: flex; justify-content: center; gap: 8px;">
    <span id="page-info">Page 1 of 5</span>
    <input
        type="number"
        id="page-input"
        min="1"
        max="5"
        placeholder="Page"
        style="width: 60px; padding: 4px 8px;"
    />
</div>
```

**Complete Implementation** (like loadDialog.js):
```html
<div id="pagination-controls">
    <button id="pagination-prev">← Prev</button>
    <span id="pagination-info">Page 1 of 5</span>
    <span>Go to page:</span>
    <input
        type="number"
        id="pagination-input"
        min="1"
        max="5"
        value="1"
    />
    <span id="pagination-total">of 5</span>
    <button id="pagination-go">Go</button>
    <button id="pagination-next">Next →</button>
</div>
```

**JavaScript Pattern:**
```javascript
// Handle Enter key to navigate
pageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        handlePaginationInput();
    }
});

// Optional: Handle Go button click
goButton.addEventListener('click', handlePaginationInput);

function handlePaginationInput() {
    const pageNum = parseInt(pageInput.value);
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Validate input
    if (isNaN(pageNum) || pageNum < 1) {
        pageInput.value = currentPage;
        return;
    }

    if (pageNum > totalPages) {
        pageInput.value = totalPages;
        currentPage = totalPages;
    } else {
        currentPage = pageNum;
    }

    // Update display and navigate
    renderPage();
    updatePaginationControls();
}
```

#### Rationale

- **User Choice:** Users should be able to jump directly to any page, not just navigate sequentially
- **Efficiency:** For large result sets (e.g., 100+ pages), sequential navigation is impractical
- **Accessibility:** Direct navigation is more accessible than multiple button clicks
- **Consistency:** This pattern should be applied consistently across all paginated interfaces

#### Current Implementations

This principle is implemented in:

1. **`public/ui/dialogs/searchDialog.js`** - Search results pagination
   - Simple implementation: Page info + page input
   - Enter key navigation
   - No Previous/Next buttons (minimalist approach)

2. **`public/ui/dialogs/loadDialog.js`** - Database list pagination
   - Complete implementation: Page info + page input + Go button + Previous/Next buttons
   - Enter key OR Go button navigation
   - Includes "Go to page:" label for clarity
   - Provides multiple navigation methods for better UX

**Implementation Variations:**

Both implementations are valid. Choose based on context:
- **Simple pagination** (searchDialog.js): When space is limited or navigation is secondary
- **Complete pagination** (loadDialog.js): When pagination is a primary feature or for better accessibility

When adding new pagination features, follow one of these patterns.

---

## Code Style

### Module Organization

- Use ES6 modules (`import`/`export`)
- Keep modules focused on a single responsibility
- Place UI components in `public/ui/`
- Place business logic in `public/managers/` or `public/services/`
- Place utilities in `public/utils/`

### Naming Conventions

- Use camelCase for variables and functions
- Use PascalCase for classes
- Use descriptive names that indicate purpose
- Prefix event handlers with `handle` (e.g., `handleSearchInput`)

### Error Handling

- Always validate user input
- Provide clear error messages
- Log errors to console for debugging
- Handle edge cases gracefully

---

## Module Organization

### Frontend Structure

```
public/
├── ui/                    # UI components and dialogs
│   └── dialogs/          # Dialog components
├── managers/             # Business logic managers
├── services/             # API communication layer
├── state/                # State management
└── utils/                # Utility functions
```

### Adding New Features

1. **UI Components:** Add to `public/ui/` or appropriate subdirectory
2. **Business Logic:** Add to `public/managers/` or `public/services/`
3. **State Management:** Update `public/state/appState.js` if needed
4. **Documentation:** Update relevant docs in `docs/`

---

## Additional Notes

### Pagination Implementation Details

The `loadDialog.js` implementation includes additional features that can be considered:
- **Input validation on blur**: Resets invalid input to current page
- **Visual feedback**: Button states change based on current page position
- **Accessibility**: Multiple navigation methods (keyboard Enter, button click, Previous/Next)
- **User guidance**: "Go to page:" label helps clarify the input purpose

These enhancements improve usability but are not strictly required by the core principle.

---

**Last Updated:** 2025-11-23
**Version:** 0.2.0
