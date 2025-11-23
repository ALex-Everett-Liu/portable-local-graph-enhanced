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

3. **Page Information Display**
   - Always show current page and total pages (e.g., "Page 1 of 5")
   - Display should be clear and visible

#### Example Implementation

```html
<div id="pagination-controls">
    <span id="page-info">Page 1 of 5</span>
    <input 
        type="number" 
        id="page-input" 
        min="1" 
        max="5"
        placeholder="Page"
    />
</div>
```

```javascript
// Handle Enter key to navigate
pageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const pageNum = parseInt(pageInput.value);
        if (pageNum >= 1 && pageNum <= totalPages) {
            navigateToPage(pageNum);
        }
    }
});
```

#### Rationale

- **User Choice:** Users should be able to jump directly to any page, not just navigate sequentially
- **Efficiency:** For large result sets (e.g., 100+ pages), sequential navigation is impractical
- **Accessibility:** Direct navigation is more accessible than multiple button clicks
- **Consistency:** This pattern should be applied consistently across all paginated interfaces

#### Current Implementation

This principle is implemented in:
- `public/ui/dialogs/searchDialog.js` - Search results pagination

When adding new pagination features, follow this pattern.

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

**Last Updated:** 2025-01-XX
**Version:** 0.1.10

