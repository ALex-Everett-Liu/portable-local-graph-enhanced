# Design System Migration Guide

This guide helps developers and contributors understand how to migrate from the Neumorphism (Soft UI) design system to a different design system or customize the existing one.

## Table of Contents

1. [Overview](#overview)
2. [Design System Architecture](#design-system-architecture)
3. [Design Tokens System](#design-tokens-system)
4. [Migration Steps](#migration-steps)
5. [File Structure](#file-structure)
6. [Key Components to Update](#key-components-to-update)
7. [Best Practices](#best-practices)
8. [Testing Checklist](#testing-checklist)

---

## Overview

The current design system is built on **Neumorphism (Soft UI)** principles, which uses:
- Cool grey monochromatic palette (`#E0E5EC` background)
- Dual opposing RGB shadows for depth
- No borders (shadows define edges)
- Soft rounded corners (32px containers, 16px buttons)
- Smooth transitions (300ms ease-out)

All design tokens are centralized in `public/css/variables.css`, making it easy to swap out the entire design system by updating a single file and related component styles.

---

## Design System Architecture

### Current Structure

```
public/
├── css/
│   ├── variables.css      ← **START HERE** - All design tokens
│   ├── fonts.css          ← Typography imports
│   ├── base.css           ← Base styles using tokens
│   ├── layout.css         ← Layout components using tokens
│   ├── components.css     ← UI components using tokens
│   ├── search.css         ← Search components using tokens
│   ├── dialogs.css        ← Dialog components using tokens
│   ├── popup.css          ← Popup components using tokens
│   ├── toast.css          ← Toast notifications using tokens
│   ├── confirm-dialog.css ← Confirmation dialogs using tokens
│   ├── connections.css    ← Connection components using tokens
│   ├── responsive.css     ← Responsive styles using tokens
│   └── semantic-map.css   ← Semantic map styles (minimal tokens)
└── styles.css             ← Main entry point (imports all modules)
```

### Design Token Flow

```
variables.css (tokens)
    ↓
All CSS modules import and use tokens
    ↓
Components inherit styling from tokens
```

**Key Principle:** All visual styling should reference CSS variables from `variables.css`. Hard-coded colors, shadows, or spacing values should be avoided.

---

## Design Tokens System

### Location: `public/css/variables.css`

This file contains all design tokens organized into categories:

#### 1. Colors
```css
--background: #E0E5EC;           /* Base surface color */
--foreground: #3D4852;           /* Primary text */
--muted: #6B7280;                /* Secondary text */
--accent: #7FC9FF;               /* Interactive elements */
--accent-light: #9DD5FF;         /* Hover states */
--accent-secondary: #38B2AC;      /* Success states */
--success-color: #10b981;
--error-color: #ef4444;
--warning-color: #f59e0b;
```

#### 2. Shadows
```css
--shadow-light: rgba(255, 255, 255, 0.5);
--shadow-light-hover: rgba(255, 255, 255, 0.6);
--shadow-dark: rgba(163, 177, 198, 0.6);
--shadow-dark-hover: rgba(163, 177, 198, 0.7);

/* Shadow Presets */
--shadow-extruded: 9px 9px 16px var(--shadow-dark), -9px -9px 16px var(--shadow-light);
--shadow-extruded-hover: 12px 12px 20px var(--shadow-dark-hover), -12px -12px 20px var(--shadow-light-hover);
--shadow-inset: inset 6px 6px 10px var(--shadow-dark), inset -6px -6px 10px var(--shadow-light);
--shadow-inset-deep: inset 10px 10px 20px var(--shadow-dark-hover), inset -10px -10px 20px var(--shadow-light-hover);
```

#### 3. Typography
```css
--font-display: 'Plus Jakarta Sans', -apple-system, sans-serif;
--font-body: 'DM Sans', -apple-system, sans-serif;
```

#### 4. Radius
```css
--radius-container: 32px;        /* Cards, sections */
--radius-button: 16px;           /* Buttons, inputs */
--radius-inner: 12px;            /* Inner elements, tags */
```

#### 5. Transitions
```css
--transition-fast: 300ms ease-out;
--transition-slow: 500ms ease-out;
```

---

## Migration Steps

### Step 1: Define Your New Design System

Before migrating, define your new design system's:
- Color palette (background, foreground, accent colors)
- Shadow system (or border system if not using shadows)
- Typography (font families, weights, sizes)
- Border radius values
- Transition timings and easing functions
- Spacing system (if different from current)

### Step 2: Update Design Tokens

**File:** `public/css/variables.css`

Replace all token values with your new design system values:

```css
:root {
    /* Your new color palette */
    --background: #FFFFFF;           /* Example: White background */
    --foreground: #1A1A1A;           /* Example: Dark text */
    --accent: #0066FF;                /* Example: Blue accent */
    
    /* Your new shadow system (or borders) */
    --shadow-extruded: 0 2px 8px rgba(0, 0, 0, 0.1);
    --shadow-inset: inset 0 1px 2px rgba(0, 0, 0, 0.05);
    
    /* Your new typography */
    --font-display: 'Inter', sans-serif;
    --font-body: 'Inter', sans-serif;
    
    /* Your new radius values */
    --radius-container: 8px;
    --radius-button: 4px;
    
    /* Your new transitions */
    --transition-fast: 200ms ease;
}
```

### Step 3: Update Font Imports

**File:** `public/css/fonts.css`

Replace Google Fonts imports with your font sources:

```css
/* Replace with your font imports */
@import url('https://fonts.googleapis.com/css2?family=YourFont:wght@400;500;600;700&display=swap');
```

**File:** `public/index.html`

Update preconnect links if using different font CDN:

```html
<link rel="preconnect" href="https://your-font-cdn.com" />
```

### Step 4: Update Component Styles

Review and update component-specific styles in these files:

#### High Priority (Most Visible Changes)
1. **`public/css/components.css`** - Buttons, inputs, dialogs
2. **`public/css/layout.css`** - Toolbar, sidebar, canvas container
3. **`public/css/base.css`** - Body background, typography

#### Medium Priority
4. **`public/css/dialogs.css`** - Dialog-specific styles
5. **`public/css/search.css`** - Search components
6. **`public/css/popup.css`** - Popup components

#### Low Priority (May Not Need Changes)
7. **`public/css/toast.css`** - Toast notifications
8. **`public/css/confirm-dialog.css`** - Confirmation dialogs
9. **`public/css/connections.css`** - Connection components
10. **`public/css/responsive.css`** - Responsive breakpoints

### Step 5: Handle Shadow-to-Border Migration

If your new design system uses borders instead of shadows:

**Before (Neumorphism):**
```css
.card {
    box-shadow: var(--shadow-extruded);
    border: none;
}
```

**After (Border-based):**
```css
.card {
    border: 1px solid var(--border-color);
    box-shadow: none; /* or minimal shadow */
}
```

**Search Pattern:** Use grep to find all `box-shadow` usages:
```bash
grep -r "box-shadow" public/css/
```

### Step 6: Update Scrollbar Styles

**File:** `public/css/responsive.css` and `public/css/dialogs.css`

Update scrollbar styling to match your design system:

```css
::-webkit-scrollbar-thumb {
    background: var(--your-scrollbar-color);
    border-radius: 5px;
}
```

---

## File Structure

### Critical Files (Must Update)

| File | Purpose | Priority |
|------|---------|----------|
| `public/css/variables.css` | All design tokens | **CRITICAL** |
| `public/css/fonts.css` | Font imports | **CRITICAL** |
| `public/css/base.css` | Base styles, body background | **HIGH** |
| `public/css/components.css` | Buttons, inputs, dialogs | **HIGH** |
| `public/css/layout.css` | Toolbar, sidebar, canvas | **HIGH** |

### Secondary Files (May Need Updates)

| File | Purpose | Priority |
|------|---------|----------|
| `public/css/dialogs.css` | Dialog-specific styles | **MEDIUM** |
| `public/css/search.css` | Search components | **MEDIUM** |
| `public/css/popup.css` | Popup components | **MEDIUM** |
| `public/css/toast.css` | Toast notifications | **LOW** |
| `public/css/confirm-dialog.css` | Confirmation dialogs | **LOW** |
| `public/css/connections.css` | Connection components | **LOW** |
| `public/css/responsive.css` | Responsive styles | **LOW** |

---

## Key Components to Update

### 1. Buttons

**Location:** `public/css/components.css` (`.tool-btn`, `.btn-primary`, `.btn-secondary`)

**Current Neumorphism Pattern:**
```css
.tool-btn {
    background-color: var(--background);
    box-shadow: var(--shadow-extruded-small);
    border-radius: var(--radius-button);
}

.tool-btn:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-extruded-hover);
}
```

**Update to your design system's button pattern.**

### 2. Inputs

**Location:** `public/css/components.css` (input, select, textarea)

**Current Neumorphism Pattern:**
```css
input {
    background-color: var(--background);
    box-shadow: var(--shadow-inset);
    border: none;
    border-radius: var(--radius-button);
}

input:focus {
    box-shadow: var(--shadow-inset-deep), 0 0 0 2px var(--accent);
}
```

**Update to your design system's input pattern (may use borders instead of inset shadows).**

### 3. Cards/Containers

**Location:** `public/css/layout.css` (`.canvas-container`, `.sidebar`)

**Current Neumorphism Pattern:**
```css
.canvas-container {
    background-color: var(--background);
    box-shadow: var(--shadow-extruded);
    border-radius: var(--radius-container);
}
```

**Update to your design system's container pattern.**

### 4. Dialogs

**Location:** `public/css/components.css` (`.dialog`)

**Current Neumorphism Pattern:**
```css
.dialog {
    background-color: var(--background);
    border-radius: var(--radius-container);
    box-shadow: 12px 12px 24px var(--shadow-dark-hover), -12px -12px 24px var(--shadow-light-hover);
}
```

**Update to your design system's modal/dialog pattern.**

---

## Best Practices

### 1. Always Use CSS Variables

✅ **Good:**
```css
.button {
    background-color: var(--accent);
    color: var(--foreground);
    border-radius: var(--radius-button);
}
```

❌ **Bad:**
```css
.button {
    background-color: #7FC9FF;  /* Hard-coded color */
    color: #3D4852;              /* Hard-coded color */
    border-radius: 16px;         /* Hard-coded radius */
}
```

### 2. Maintain Token Naming Convention

Keep consistent naming patterns:
- Colors: `--color-name` or `--background`, `--foreground`
- Shadows: `--shadow-variant` (e.g., `--shadow-extruded`, `--shadow-inset`)
- Radius: `--radius-element` (e.g., `--radius-button`, `--radius-container`)
- Transitions: `--transition-speed` (e.g., `--transition-fast`)

### 3. Document Your Changes

When adding new tokens, document them:
```css
/* Your Design System Name - Design Tokens */

:root {
    /* Colors - Your Color System */
    --background: #FFFFFF;  /* Base surface color */
    --foreground: #1A1A1A;  /* Primary text color */
    
    /* Shadows - Your Shadow System */
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);  /* Small shadow */
}
```

### 4. Test Across All Components

After migration, test:
- ✅ Buttons (hover, active, disabled states)
- ✅ Inputs (focus states, validation states)
- ✅ Dialogs (all dialog types)
- ✅ Tooltips and popups
- ✅ Scrollbars
- ✅ Responsive breakpoints

### 5. Maintain Accessibility

Ensure your new design system maintains:
- **Contrast ratios:** WCAG AA (4.5:1) minimum, AAA (7:1) preferred
- **Focus states:** Visible focus indicators on all interactive elements
- **Touch targets:** Minimum 44px × 44px for mobile

---

## Testing Checklist

After migrating to a new design system, verify:

### Visual Consistency
- [ ] All buttons use consistent styling
- [ ] All inputs use consistent styling
- [ ] All dialogs use consistent styling
- [ ] Color palette is consistent throughout
- [ ] Typography is consistent throughout
- [ ] Spacing is consistent throughout

### Interactive States
- [ ] Button hover states work correctly
- [ ] Button active/pressed states work correctly
- [ ] Button disabled states are visible
- [ ] Input focus states are visible
- [ ] Input validation states are styled
- [ ] Link hover states work correctly

### Components
- [ ] Toolbar renders correctly
- [ ] Sidebar renders correctly
- [ ] Canvas container renders correctly
- [ ] All dialogs render correctly
- [ ] Toast notifications render correctly
- [ ] Popups render correctly
- [ ] Search components render correctly

### Responsive Design
- [ ] Mobile breakpoints work correctly
- [ ] Tablet breakpoints work correctly
- [ ] Desktop layout is correct
- [ ] Touch targets are adequate (44px minimum)

### Accessibility
- [ ] Focus indicators are visible
- [ ] Color contrast meets WCAG AA standards
- [ ] Keyboard navigation works correctly
- [ ] Screen reader compatibility maintained

### Performance
- [ ] Fonts load correctly
- [ ] No layout shift on font load
- [ ] Transitions are smooth (60fps)
- [ ] No visual glitches during interactions

---

## Example: Migrating to Material Design

Here's a quick example of migrating to Material Design principles:

### Step 1: Update Variables

```css
:root {
    /* Material Design Colors */
    --background: #FFFFFF;
    --foreground: #212121;
    --accent: #1976D2;
    --accent-light: #42A5F5;
    
    /* Material Design Shadows */
    --shadow-1: 0 2px 4px rgba(0, 0, 0, 0.1);
    --shadow-2: 0 4px 8px rgba(0, 0, 0, 0.12);
    --shadow-3: 0 8px 16px rgba(0, 0, 0, 0.15);
    
    /* Material Design Radius */
    --radius-container: 4px;
    --radius-button: 4px;
    
    /* Material Design Typography */
    --font-display: 'Roboto', sans-serif;
    --font-body: 'Roboto', sans-serif;
}
```

### Step 2: Update Component Styles

Replace Neumorphism shadows with Material Design elevation:

```css
/* Before (Neumorphism) */
.card {
    box-shadow: var(--shadow-extruded);
}

/* After (Material Design) */
.card {
    box-shadow: var(--shadow-2);
    border-radius: var(--radius-container);
}
```

### Step 3: Update Buttons

```css
/* Material Design Button */
.button {
    background-color: var(--accent);
    color: white;
    box-shadow: var(--shadow-1);
    border-radius: var(--radius-button);
    transition: box-shadow var(--transition-fast);
}

.button:hover {
    box-shadow: var(--shadow-2);
}

.button:active {
    box-shadow: var(--shadow-1);
}
```

---

## Troubleshooting

### Issue: Styles Not Applying

**Solution:** Check that `variables.css` is imported first in `styles.css`:
```css
/* styles.css */
@import url('./css/variables.css');  /* Must be first */
@import url('./css/fonts.css');
/* ... */
```

### Issue: Hard-coded Values Override Tokens

**Solution:** Search for hard-coded values:
```bash
# Find hard-coded colors
grep -r "#[0-9A-Fa-f]\{6\}" public/css/

# Find hard-coded shadows
grep -r "box-shadow.*rgba" public/css/

# Find hard-coded radius
grep -r "border-radius.*px" public/css/
```

### Issue: Fonts Not Loading

**Solution:** 
1. Check `fonts.css` imports
2. Check `index.html` preconnect links
3. Verify font URLs are accessible
4. Check browser console for font loading errors

---

## Resources

- **Current Design System:** See `PLUGIN_DESIGN_SYSTEM_GUIDE.md` for Neumorphism details
- **Design Tokens:** `public/css/variables.css`
- **Component Examples:** `public/css/components.css`

---

## Questions?

If you have questions about migrating the design system:
1. Review the current implementation in `public/css/variables.css`
2. Check component examples in `public/css/components.css`
3. Test changes incrementally (one component at a time)
4. Maintain accessibility standards throughout migration

---

**Last Updated:** 2025-12-31  
**Version:** 1.0.0

