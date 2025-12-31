# Theme System Guide

This guide helps developers and contributors understand how to create new themes for the application. The theme system allows users to switch between different design styles (Neumorphism, Basic, and custom themes) without modifying the core codebase.

## Table of Contents

1. [Overview](#overview)
2. [Theme System Architecture](#theme-system-architecture)
3. [Creating a New Theme](#creating-a-new-theme)
4. [Theme Structure](#theme-structure)
5. [Adding Themes to the Application](#adding-themes-to-the-application)
6. [Best Practices](#best-practices)
7. [Examples](#examples)
8. [Testing Your Theme](#testing-your-theme)

---

## Overview

The application uses a **theme system** that allows users to switch between different design styles. Themes are defined as sets of CSS variables that override the base design tokens, making it easy to create new visual styles without modifying component code.

**Current Themes:**
- **Neumorphism** (default): Soft UI with dual shadows and cool grey palette
- **Basic**: Simple and clean theme with minimal styling

**Key Benefits:**
- Users can switch themes without restarting the application
- Themes persist across sessions (saved in localStorage)
- Easy to add new themes by defining CSS variable sets
- No component code changes needed when adding themes

---

## Theme System Architecture

### How Themes Work

```
Theme Manager (themeManager.js)
    ↓
Defines theme as CSS variable set
    ↓
Applies variables to :root element
    ↓
All components use CSS variables
    ↓
Theme change = instant visual update
```

### File Structure

```
public/
├── managers/
│   └── themeManager.js      ← **START HERE** - Theme definitions
├── css/
│   ├── variables.css        ← Base design tokens (Neumorphism defaults)
│   ├── base.css            ← Components using CSS variables
│   ├── components.css       ← Components using CSS variables
│   └── ...                 ← Other CSS modules using variables
└── ui/dialogs/
    └── settingsDialog.js    ← Theme selector UI
```

**Key Principle:** All components use CSS variables (e.g., `var(--background)`, `var(--shadow-extruded)`). Themes override these variables, so components automatically adapt to the selected theme.

---

## Creating a New Theme

### Step 1: Define Your Theme's Visual Style

Before creating a theme, decide on:
- **Color palette**: Background, foreground, accent colors
- **Shadow system**: Dual shadows (Neumorphism), simple shadows (Basic), or borders
- **Typography**: Font families for display and body text
- **Border radius**: Container, button, and inner element radii
- **Transitions**: Animation timings and easing functions

### Step 2: Create Theme Definition

**File:** `public/managers/themeManager.js`

Add your theme to the `THEMES` object:

```javascript
export const THEMES = {
    // ... existing themes ...
    
    yourThemeId: {
        name: 'Your Theme Name',
        description: 'Brief description of your theme',
        variables: {
            // Colors
            '--background': '#FFFFFF',
            '--foreground': '#1A1A1A',
            '--muted': '#6B7280',
            '--accent': '#0066FF',
            '--accent-light': '#3385FF',
            '--accent-secondary': '#10B981',
            '--success-color': '#10b981',
            '--error-color': '#ef4444',
            '--warning-color': '#f59e0b',
            
            // Shadow Colors
            '--shadow-light': 'rgba(0, 0, 0, 0.05)',
            '--shadow-light-hover': 'rgba(0, 0, 0, 0.08)',
            '--shadow-dark': 'rgba(0, 0, 0, 0.1)',
            '--shadow-dark-hover': 'rgba(0, 0, 0, 0.15)',
            
            // Typography
            '--font-display': "'Your Display Font', sans-serif",
            '--font-body': "'Your Body Font', sans-serif",
            
            // Radius
            '--radius-container': '8px',
            '--radius-button': '6px',
            '--radius-inner': '4px',
            
            // Transitions
            '--transition-fast': '200ms ease',
            '--transition-slow': '300ms ease',
            
            // Shadow Presets (required)
            '--shadow-extruded': '0 2px 8px var(--shadow-dark)',
            '--shadow-extruded-hover': '0 4px 12px var(--shadow-dark-hover)',
            '--shadow-extruded-small': '0 1px 4px var(--shadow-dark)',
            '--shadow-inset': 'inset 0 1px 2px var(--shadow-dark)',
            '--shadow-inset-deep': 'inset 0 2px 4px var(--shadow-dark-hover)',
            '--shadow-inset-small': 'inset 0 1px 1px var(--shadow-dark)'
        }
    }
};
```

### Step 3: Required CSS Variables

Every theme **must** define these CSS variables:

#### Colors (Required)
- `--background`: Base surface color
- `--foreground`: Primary text color
- `--muted`: Secondary/muted text color
- `--accent`: Primary accent color for interactive elements
- `--accent-light`: Lighter accent for hover states
- `--accent-secondary`: Secondary accent (e.g., success states)
- `--success-color`: Success state color
- `--error-color`: Error state color
- `--warning-color`: Warning state color

#### Shadow Colors (Required)
- `--shadow-light`: Light shadow color (RGBA)
- `--shadow-light-hover`: Light shadow color for hover states
- `--shadow-dark`: Dark shadow color (RGBA)
- `--shadow-dark-hover`: Dark shadow color for hover states

#### Shadow Presets (Required)
These are used throughout the application:
- `--shadow-extruded`: Standard raised element shadow
- `--shadow-extruded-hover`: Hover state shadow (enhanced)
- `--shadow-extruded-small`: Small element shadow
- `--shadow-inset`: Standard inset/pressed shadow
- `--shadow-inset-deep`: Deep inset shadow (for inputs, wells)
- `--shadow-inset-small`: Small inset shadow

#### Typography (Required)
- `--font-display`: Font family for headings
- `--font-body`: Font family for body text and UI elements

#### Radius (Required)
- `--radius-container`: Border radius for containers/cards (e.g., `32px`)
- `--radius-button`: Border radius for buttons/inputs (e.g., `16px`)
- `--radius-inner`: Border radius for inner elements/tags (e.g., `12px`)

#### Transitions (Required)
- `--transition-fast`: Fast transition timing (e.g., `300ms ease-out`)
- `--transition-slow`: Slow transition timing (e.g., `500ms ease-out`)

---

## Theme Structure

### Complete Theme Template

```javascript
yourThemeId: {
    name: 'Theme Display Name',
    description: 'One-line description shown in settings dialog',
    variables: {
        // === COLORS ===
        '--background': '#FFFFFF',
        '--foreground': '#1A1A1A',
        '--muted': '#6B7280',
        '--accent': '#0066FF',
        '--accent-light': '#3385FF',
        '--accent-secondary': '#10B981',
        '--success-color': '#10b981',
        '--error-color': '#ef4444',
        '--warning-color': '#f59e0b',
        
        // === SHADOW COLORS ===
        '--shadow-light': 'rgba(255, 255, 255, 0.5)',
        '--shadow-light-hover': 'rgba(255, 255, 255, 0.6)',
        '--shadow-dark': 'rgba(0, 0, 0, 0.1)',
        '--shadow-dark-hover': 'rgba(0, 0, 0, 0.15)',
        
        // === TYPOGRAPHY ===
        '--font-display': "'Font Name', sans-serif",
        '--font-body': "'Font Name', sans-serif",
        
        // === RADIUS ===
        '--radius-container': '8px',
        '--radius-button': '6px',
        '--radius-inner': '4px',
        
        // === TRANSITIONS ===
        '--transition-fast': '200ms ease',
        '--transition-slow': '300ms ease',
        
        // === SHADOW PRESETS ===
        '--shadow-extruded': '0 2px 8px var(--shadow-dark)',
        '--shadow-extruded-hover': '0 4px 12px var(--shadow-dark-hover)',
        '--shadow-extruded-small': '0 1px 4px var(--shadow-dark)',
        '--shadow-inset': 'inset 0 1px 2px var(--shadow-dark)',
        '--shadow-inset-deep': 'inset 0 2px 4px var(--shadow-dark-hover)',
        '--shadow-inset-small': 'inset 0 1px 1px var(--shadow-dark)'
    }
}
```

---

## Adding Themes to the Application

### Step 1: Add Theme to themeManager.js

1. Open `public/managers/themeManager.js`
2. Find the `THEMES` object
3. Add your theme definition:

```javascript
export const THEMES = {
    neumorphism: { /* ... */ },
    basic: { /* ... */ },
    yourThemeId: {
        name: 'Your Theme',
        description: 'Your theme description',
        variables: {
            // ... your CSS variables ...
        }
    }
};
```

### Step 2: Test Your Theme

1. Open the application
2. Go to Settings → Theme tab
3. Select your new theme
4. Click "Apply"
5. Verify all components render correctly

### Step 3: (Optional) Add Font Imports

If your theme uses custom fonts, add them to `public/css/fonts.css`:

```css
/* Your Theme Fonts */
@import url('https://fonts.googleapis.com/css2?family=YourFont:wght@400;500;600;700&display=swap');
```

And update `public/index.html` preconnect links if needed.

---

## Best Practices

### 1. Use RGBA for Shadows

✅ **Good:**
```javascript
'--shadow-dark': 'rgba(0, 0, 0, 0.1)',
```

❌ **Bad:**
```javascript
'--shadow-dark': '#000000',  // Opaque color doesn't blend well
```

### 2. Maintain Contrast Ratios

Ensure text is readable:
- **Primary text** (`--foreground` on `--background`): Minimum 4.5:1 (WCAG AA), prefer 7:1 (WCAG AAA)
- **Muted text** (`--muted` on `--background`): Minimum 4.5:1 (WCAG AA)

Use online contrast checkers to verify your color combinations.

### 3. Provide Fallback Fonts

Always include fallback fonts:
```javascript
'--font-body': "'Your Font', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
```

### 4. Test Shadow Presets

Make sure your shadow presets work for:
- **Extruded shadows**: Buttons, cards, containers (raised elements)
- **Inset shadows**: Inputs, pressed buttons, wells (recessed elements)
- **Hover states**: Enhanced shadows for interactive feedback

### 5. Keep Descriptions Concise

Theme descriptions should be one line and clearly describe the visual style:
- ✅ "Soft UI with dual shadows and depth illusion"
- ✅ "Simple and clean theme with minimal styling"
- ❌ "This theme uses a combination of colors and shadows to create a modern look that is both functional and aesthetically pleasing"

### 6. Use Consistent Naming

Theme IDs should be:
- Lowercase
- Descriptive (e.g., `dark`, `material`, `minimal`)
- No spaces or special characters (use hyphens: `dark-mode`)

---

## Examples

### Example 1: Dark Theme

```javascript
dark: {
    name: 'Dark',
    description: 'Dark mode theme with high contrast',
    variables: {
        // Colors - Dark palette
        '--background': '#1A1A1A',
        '--foreground': '#FFFFFF',
        '--muted': '#A0A0A0',
        '--accent': '#4A9EFF',
        '--accent-light': '#6BB0FF',
        '--accent-secondary': '#10B981',
        '--success-color': '#10b981',
        '--error-color': '#ef4444',
        '--warning-color': '#f59e0b',
        
        // Shadow Colors - Lighter shadows for dark background
        '--shadow-light': 'rgba(255, 255, 255, 0.1)',
        '--shadow-light-hover': 'rgba(255, 255, 255, 0.15)',
        '--shadow-dark': 'rgba(0, 0, 0, 0.3)',
        '--shadow-dark-hover': 'rgba(0, 0, 0, 0.5)',
        
        // Typography
        '--font-display': "'Inter', -apple-system, sans-serif",
        '--font-body': "'Inter', -apple-system, sans-serif",
        
        // Radius - Slightly smaller for modern look
        '--radius-container': '12px',
        '--radius-button': '8px',
        '--radius-inner': '6px',
        
        // Transitions
        '--transition-fast': '200ms ease',
        '--transition-slow': '300ms ease',
        
        // Shadow Presets
        '--shadow-extruded': '0 4px 12px var(--shadow-dark)',
        '--shadow-extruded-hover': '0 6px 16px var(--shadow-dark-hover)',
        '--shadow-extruded-small': '0 2px 6px var(--shadow-dark)',
        '--shadow-inset': 'inset 0 2px 4px var(--shadow-dark)',
        '--shadow-inset-deep': 'inset 0 4px 8px var(--shadow-dark-hover)',
        '--shadow-inset-small': 'inset 0 1px 2px var(--shadow-dark)'
    }
}
```

### Example 2: Material Design Theme

```javascript
material: {
    name: 'Material Design',
    description: 'Material Design 3 with elevation shadows',
    variables: {
        // Colors - Material Design palette
        '--background': '#FFFFFF',
        '--foreground': '#1C1B1F',
        '--muted': '#49454F',
        '--accent': '#6750A4',
        '--accent-light': '#7E6FA8',
        '--accent-secondary': '#0D7377',
        '--success-color': '#10b981',
        '--error-color': '#BA1A1A',
        '--warning-color': '#F57C00',
        
        // Shadow Colors - Material elevation
        '--shadow-light': 'rgba(0, 0, 0, 0.05)',
        '--shadow-light-hover': 'rgba(0, 0, 0, 0.08)',
        '--shadow-dark': 'rgba(0, 0, 0, 0.12)',
        '--shadow-dark-hover': 'rgba(0, 0, 0, 0.16)',
        
        // Typography
        '--font-display': "'Roboto', sans-serif",
        '--font-body': "'Roboto', sans-serif",
        
        // Radius - Material uses smaller radius
        '--radius-container': '12px',
        '--radius-button': '20px',  // Material uses pill-shaped buttons
        '--radius-inner': '8px',
        
        // Transitions
        '--transition-fast': '200ms cubic-bezier(0.4, 0, 0.2, 1)',
        '--transition-slow': '300ms cubic-bezier(0.4, 0, 0.2, 1)',
        
        // Shadow Presets - Material elevation
        '--shadow-extruded': '0 2px 4px var(--shadow-dark), 0 1px 2px var(--shadow-light)',
        '--shadow-extruded-hover': '0 4px 8px var(--shadow-dark-hover), 0 2px 4px var(--shadow-light-hover)',
        '--shadow-extruded-small': '0 1px 2px var(--shadow-dark)',
        '--shadow-inset': 'inset 0 1px 2px var(--shadow-dark)',
        '--shadow-inset-deep': 'inset 0 2px 4px var(--shadow-dark-hover)',
        '--shadow-inset-small': 'inset 0 1px 1px var(--shadow-dark)'
    }
}
```

### Example 3: Minimal Theme (Border-based)

```javascript
minimal: {
    name: 'Minimal',
    description: 'Clean theme with borders instead of shadows',
    variables: {
        // Colors
        '--background': '#FAFAFA',
        '--foreground': '#212121',
        '--muted': '#757575',
        '--accent': '#2196F3',
        '--accent-light': '#42A5F5',
        '--accent-secondary': '#4CAF50',
        '--success-color': '#4CAF50',
        '--error-color': '#F44336',
        '--warning-color': '#FF9800',
        
        // Shadow Colors - Minimal shadows (mostly for depth)
        '--shadow-light': 'rgba(0, 0, 0, 0.02)',
        '--shadow-light-hover': 'rgba(0, 0, 0, 0.04)',
        '--shadow-dark': 'rgba(0, 0, 0, 0.05)',
        '--shadow-dark-hover': 'rgba(0, 0, 0, 0.08)',
        
        // Typography
        '--font-display': "'Helvetica Neue', Helvetica, Arial, sans-serif",
        '--font-body': "'Helvetica Neue', Helvetica, Arial, sans-serif",
        
        // Radius - Sharp corners
        '--radius-container': '4px',
        '--radius-button': '4px',
        '--radius-inner': '2px',
        
        // Transitions - Fast and snappy
        '--transition-fast': '150ms ease',
        '--transition-slow': '250ms ease',
        
        // Shadow Presets - Very subtle
        '--shadow-extruded': '0 1px 3px var(--shadow-dark)',
        '--shadow-extruded-hover': '0 2px 6px var(--shadow-dark-hover)',
        '--shadow-extruded-small': '0 1px 2px var(--shadow-dark)',
        '--shadow-inset': 'inset 0 1px 1px var(--shadow-dark)',
        '--shadow-inset-deep': 'inset 0 1px 2px var(--shadow-dark-hover)',
        '--shadow-inset-small': 'inset 0 1px 1px var(--shadow-dark)'
    }
}
```

**Note:** For border-based themes, you may need to update component CSS to use borders. However, the shadow presets above will still work for subtle depth.

---

## Testing Your Theme

### Visual Testing Checklist

After creating your theme, test:

- [ ] **Colors**: All text is readable (check contrast ratios)
- [ ] **Buttons**: Hover, active, and disabled states work correctly
- [ ] **Inputs**: Focus states are visible and accessible
- [ ] **Dialogs**: All dialog types render correctly
- [ ] **Cards/Containers**: Shadows/borders look appropriate
- [ ] **Tooltips**: Readable and properly styled
- [ ] **Scrollbars**: Match theme aesthetic
- [ ] **Toast Notifications**: Colors and shadows work correctly

### Component Testing

Test these specific components:

1. **Toolbar**: Background, buttons, search input
2. **Sidebar**: Background, sections, filter controls
3. **Canvas Container**: Shadow/border, hover effects
4. **Dialogs**: All dialog types (settings, search, load, etc.)
5. **Buttons**: Primary, secondary, danger variants
6. **Inputs**: Text inputs, selects, sliders
7. **Popups**: Selection info popup, tooltips

### Accessibility Testing

- [ ] **Contrast**: Text meets WCAG AA standards (4.5:1 minimum)
- [ ] **Focus States**: All interactive elements have visible focus indicators
- [ ] **Touch Targets**: Buttons are at least 44px × 44px
- [ ] **Keyboard Navigation**: All elements are keyboard accessible

### Browser Testing

Test your theme in:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if possible)

---

## Troubleshooting

### Issue: Theme Not Appearing in Settings

**Solution:** 
1. Check that theme is added to `THEMES` object in `themeManager.js`
2. Verify theme ID doesn't have spaces or special characters
3. Check browser console for JavaScript errors

### Issue: Colors Not Applying

**Solution:**
1. Verify all required CSS variables are defined
2. Check that variable names match exactly (case-sensitive)
3. Ensure shadow presets reference shadow color variables correctly

### Issue: Shadows Look Wrong

**Solution:**
1. Check shadow color RGBA values (should have transparency)
2. Verify shadow presets use correct variable references
3. Test shadow presets individually in browser DevTools

### Issue: Fonts Not Loading

**Solution:**
1. Add font imports to `public/css/fonts.css`
2. Update preconnect links in `public/index.html` if using Google Fonts
3. Verify font names match exactly in theme variables

### Issue: Theme Persists After Reset

**Solution:**
1. Check `resetTheme()` function in `themeManager.js`
2. Verify localStorage is being cleared correctly
3. Check that default theme is being applied

---

## Advanced: Custom Theme Features

### Theme-Specific CSS Classes

If you need theme-specific styling beyond CSS variables, you can add CSS that targets the theme class:

```css
/* Theme-specific styles */
.theme-dark .special-element {
    /* Dark theme specific styles */
}

.theme-material .special-element {
    /* Material theme specific styles */
}
```

The theme manager automatically adds `theme-{themeId}` class to the body element.

### Conditional Theme Logic

For complex themes, you can add logic in `applyTheme()`:

```javascript
export function applyTheme(themeId) {
    const theme = THEMES[themeId];
    // ... apply variables ...
    
    // Theme-specific logic
    if (themeId === 'dark') {
        // Dark theme specific setup
    }
}
```

---

## Resources

- **Theme Manager:** `public/managers/themeManager.js`
- **Base Design Tokens:** `public/css/variables.css`
- **Component Styles:** `public/css/components.css`
- **Settings Dialog:** `public/ui/dialogs/settingsDialog.js`

---

## Questions?

If you have questions about creating themes:
1. Review existing themes in `themeManager.js` (Neumorphism, Basic)
2. Check component CSS to see which variables are used
3. Test your theme incrementally (start with colors, then shadows, then typography)
4. Use browser DevTools to inspect CSS variables in real-time

---

**Last Updated:** 2025-12-31  
**Version:** 2.0.0 (Updated for Theme System)
