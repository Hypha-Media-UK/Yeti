# Styling Consistency Guide

## Overview

This document outlines the consistent approach to styling across the Staff Rota Application, ensuring maintainability and preventing specificity conflicts.

## CSS Architecture

### Global Styles (`frontend/src/assets/styles/`)

1. **`reset.css`** - Browser normalization
2. **`variables.css`** - Design tokens (colors, spacing, typography)
3. **`main.css`** - Global component styles using CSS layers

### CSS Layers

```css
@layer base, components, utilities;
```

- **Base**: Typography, body styles, focus states
- **Components**: Reusable UI components (buttons, cards, badges, forms)
- **Utilities**: Functional helpers (spacing, flexbox, text alignment)

## Button Styling - The Correct Approach

### The Problem with Vue Scoped Styles

Vue's scoped styles add unique data attributes (like `data-v-abc123`) to elements, which prevents global styles from applying properly. This means global `.btn` classes won't work inside components with `<style scoped>`.

### ✅ The Solution: Unscoped Style Blocks with Scoped Selectors

Each component that uses buttons needs:

1. **A wrapper element with a unique class** in the template
2. **An unscoped `<style>` block** with scoped selectors

**Example:**

```vue
<template>
  <form class="service-form">
    <button class="btn btn-primary">Save</button>
    <button class="btn btn-secondary">Cancel</button>
  </form>
</template>

<style scoped>
/* Component-specific scoped styles */
.form-group {
  /* ... */
}
</style>

<!-- Unscoped button styles with scoped selector -->
<style>
.service-form .btn {
  display: inline-flex;
  align-items: center;
  /* ... all button base styles ... */
}

.service-form .btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.service-form .btn-secondary {
  background-color: transparent;
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}
</style>
```

### Why This Works

- The **unscoped `<style>` block** allows styles to apply without Vue's data attributes
- The **scoped selector** (`.service-form .btn`) ensures styles only apply to buttons within that component
- This gives us the benefits of both global and scoped styles

### Global Button Classes

Defined in `frontend/src/assets/styles/main.css`:

| Class | Purpose | Background | Text Color |
|-------|---------|------------|------------|
| `.btn` | Base button | - | - |
| `.btn-primary` | Primary actions | `--color-primary` (#0066CC) | white |
| `.btn-secondary` | Secondary actions | transparent | `--color-text-primary` |
| `.btn-destructive` | Destructive actions | `--color-error` (#DC2626) | white |

### Component-Specific Button Variants

If a component needs a **unique** button style not in the global set, define it in the component's scoped styles with a **specific class name**:

```vue
<style scoped>
/* ✅ Component-specific button variant */
.btn-icon {
  background: none;
  border: none;
  padding: var(--spacing-1);
  /* ... */
}

.btn-sm {
  padding: var(--spacing-1) var(--spacing-2);
  font-size: var(--font-size-body-sm);
}
</style>
```

**Example:** `BuildingModal.vue` has `.btn-icon` and `.btn-sm` which are specific to that component.

## Form Styling

### Global Form Classes

Use these classes from `main.css`:

- `.input` - Text inputs
- `.select` - Dropdowns
- `.label` - Form labels

### Component-Specific Form Styles

Each form component can define its own layout styles in scoped CSS:

```vue
<style scoped>
.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.form-label {
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.form-input {
  padding: var(--spacing-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-input);
  /* ... */
}
</style>
```

## Components Using This Pattern

The following components use unscoped style blocks with scoped selectors:

1. ✅ **BuildingModal.vue** - Wrapper: `.building-modal`, includes `.btn-icon` and `.btn-sm` variants, footer with Update Building button
2. ✅ **ConfirmDialog.vue** - Wrapper: `.confirm-dialog`, includes `.btn-destructive`
3. ✅ **StaffForm.vue** - Wrapper: `.staff-form`
4. ✅ **ServiceModal.vue** - Wrapper: `.service-form`
5. ✅ **ConfigView.vue** - Wrapper: `.config-view`

### Template Structure

Each component wraps its content in a div/form with the scoped class:

```vue
<!-- BuildingModal.vue -->
<BaseModal>
  <div class="building-modal">
    <!-- content with buttons -->
  </div>
</BaseModal>

<!-- ServiceModal.vue -->
<BaseModal>
  <form class="service-form">
    <!-- content with buttons -->
  </form>
</BaseModal>
```

## Best Practices

### 1. Check Global Styles First

Before adding styles to a component, check if a global class exists in `main.css`.

### 2. Use Design Tokens

Always use CSS variables from `variables.css`:

```css
/* ✅ Good */
color: var(--color-primary);
padding: var(--spacing-2);
border-radius: var(--radius-button);

/* ❌ Bad */
color: #0066CC;
padding: 16px;
border-radius: 8px;
```

### 3. Scoped Styles for Layout Only

Use `<style scoped>` for:
- Component-specific layout
- Grid/flexbox arrangements
- Component-unique variants

### 4. Avoid !important

Never use `!important` to override styles. If you need to override, the architecture needs fixing.

### 5. Naming Conventions

- **Global classes**: Generic names (`.btn`, `.card`, `.badge`)
- **Component-specific classes**: Descriptive names (`.staff-grid`, `.building-card-header`)
- **Utility classes**: Functional names (`.mt-2`, `.flex`, `.text-center`)

## Testing Checklist

When adding or modifying styles:

- [ ] Check if global class exists
- [ ] Verify no duplicate styles in scoped blocks
- [ ] Test in all relevant components
- [ ] Check browser dev tools for specificity conflicts
- [ ] Verify hover/focus/disabled states work correctly

## Common Pitfalls

### Pitfall 1: Scoped Style Specificity

```vue
<!-- ❌ This won't work as expected -->
<style scoped>
.btn {
  /* This has higher specificity than global .btn due to Vue's data attributes */
}
</style>
```

**Solution:** Don't redefine global classes in scoped styles.

### Pitfall 2: Inconsistent Button Variants

```vue
<!-- ❌ Don't create custom button variants -->
<button class="btn btn-custom">Action</button>

<style scoped>
.btn-custom {
  background: purple;
}
</style>
```

**Solution:** Use existing global variants or propose adding a new global variant if needed frequently.

### Pitfall 3: Hardcoded Values

```css
/* ❌ Bad */
padding: 16px;
color: #0066CC;

/* ✅ Good */
padding: var(--spacing-2);
color: var(--color-primary);
```

## Future Improvements

Consider these enhancements:

1. **Component Library**: Extract common components (buttons, inputs) into a dedicated library
2. **Storybook**: Document all global styles and components visually
3. **CSS-in-JS**: Consider migrating to a CSS-in-JS solution for better type safety
4. **Design System Package**: Create a separate npm package for the design system

## Questions?

If you're unsure whether to use global or scoped styles, ask:

1. Will this style be used in multiple components? → **Global**
2. Is this a variant of an existing global component? → **Global**
3. Is this specific to one component's layout? → **Scoped**
4. Is this a one-off unique style? → **Scoped**

---

**Last Updated:** 2025-10-26  
**Maintained By:** Development Team

