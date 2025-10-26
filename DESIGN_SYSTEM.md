# Design System Documentation

## Overview

This is a **custom design system** (not Material Design 3 Expressive) focused on creating a professional, data-focused interface with clarity and calm.

### Visual Language

**Aesthetic:** Bright, open, minimal, and highly legible  
**Tone:** Professional, confident, and data-focused  
**Philosophy:** No visual clutter; every element has intent

---

## 1. Colour System

All colors meet WCAG AA contrast requirements (4.5:1 minimum).

### Primary Colors
| Role | Token | Value | Usage |
|------|-------|-------|-------|
| Primary | `--color-primary` | `#0066CC` | Buttons, highlights, links |
| Primary Hover | `--color-primary-hover` | `#004C99` | Hover states |

### Backgrounds & Surfaces
| Role | Token | Value | Usage |
|------|-------|-------|-------|
| Background | `--color-bg` | `#F9FAFB` | App canvas (light neutral) |
| Surface | `--color-surface` | `#FFFFFF` | Card backgrounds |

### Borders
| Role | Token | Value | Usage |
|------|-------|-------|-------|
| Border | `--color-border` | `#E5E7EB` | Light divider lines |

### Text
| Role | Token | Value | Usage |
|------|-------|-------|-------|
| Text Primary | `--color-text-primary` | `#111827` | Main content text |
| Text Secondary | `--color-text-secondary` | `#6B7280` | Muted text |

### States
| Role | Token | Value | Usage |
|------|-------|-------|-------|
| Success | `--color-success` | `#16A34A` | Confirmed state |
| Warning | `--color-warning` | `#F59E0B` | Pending state |
| Error | `--color-error` | `#DC2626` | Critical state |

### Shift-Specific Colors
| Role | Token | Value |
|------|-------|-------|
| Day Shift | `--color-day-shift` | `#0066CC` |
| Day Shift Light | `--color-day-shift-light` | `#EFF6FF` |
| Night Shift | `--color-night-shift` | `#7C3AED` |
| Night Shift Light | `--color-night-shift-light` | `#F5F3FF` |

### Badge Colors
| Role | Token | Background | Text |
|------|-------|------------|------|
| Regular | `--color-badge-regular` | `#F3F4F6` | `#6B7280` |
| Relief | `--color-badge-relief` | `#EFF6FF` | `#0066CC` |
| Supervisor | `--color-badge-supervisor` | `#FEF3C7` | `#F59E0B` |

---

## 2. Typography

### Font Families
- **UI Text:** Inter (fallback: system fonts)
- **Monospace Data:** JetBrains Mono, SF Mono

### Font Sizes
| Usage | Token | Size | Weight |
|-------|-------|------|--------|
| Headline | `--font-size-headline` | 24px | 600 |
| Section Title | `--font-size-section` | 18px | 600 |
| Body Text | `--font-size-body` | 16px | 400 |
| Body Small | `--font-size-body-sm` | 14px | 400 |
| Secondary Text | `--font-size-secondary` | 13px | 400/500 |
| Monospace Data | `--font-size-mono` | 13px | 400 |

### Line Heights
- **Tight:** 1.4 (headings)
- **Normal:** 1.5 (body text)
- **Relaxed:** 1.6 (long-form content)

### Letter Spacing
- **Tight:** -0.01em (headings)
- **Normal:** 0 (body text)

---

## 3. Layout & Spacing

### Base Spacing Unit
**8px** - All spacing is a multiple of 8px

| Token | Value | Pixels |
|-------|-------|--------|
| `--spacing-1` | 0.5rem | 8px |
| `--spacing-2` | 1rem | 16px |
| `--spacing-3` | 1.5rem | 24px |
| `--spacing-4` | 2rem | 32px |
| `--spacing-5` | 2.5rem | 40px |
| `--spacing-6` | 3rem | 48px |
| `--spacing-8` | 4rem | 64px |

### Container Widths
| Breakpoint | Max Width |
|------------|-----------|
| Mobile | 100% (full width) |
| Tablet | 960px |
| Desktop | 1280px (content centered) |

### Grid System
- **Columns:** 12-column flexible grid
- **Gutters:** 24px (`--grid-gutter`)

### Header
- **Height:** 64px (`--header-height`)

---

## 4. Border Radius

| Element | Token | Value |
|---------|-------|-------|
| Buttons, Inputs | `--radius-button` | 8px |
| Cards, Modals | `--radius-card` | 16px |
| Badges (pill) | `--radius-badge` | 12px |

---

## 5. Elevation (Shadows)

| Level | Token | Value |
|-------|-------|-------|
| Low | `--shadow-low` | `0 1px 3px rgba(0,0,0,0.05)` |
| Medium | `--shadow-medium` | `0 4px 8px rgba(0,0,0,0.08)` |
| Header | `--shadow-header` | `0 1px 3px rgba(0,0,0,0.05)` |

---

## 6. Transitions

### Easing
**Material Standard:** `cubic-bezier(0.4, 0, 0.2, 1)`

| Type | Token | Duration |
|------|-------|----------|
| Enter | `--transition-enter` | 150ms |
| Exit | `--transition-exit` | 100ms |

---

## 7. Responsive Breakpoints

| Breakpoint | Width | Layout Behavior |
|------------|-------|-----------------|
| Mobile | ≤ 600px | Single column; navigation collapses |
| Tablet | 601–960px | Two-column grid; cards stack smartly |
| Desktop | ≥ 961px | Full 12-column layout; Day/Night side-by-side |

---

## 8. Components

### Buttons
- **Primary:** Solid blue (`--color-primary`)
- **Secondary:** Outline or ghost, grey border
- **Destructive:** Solid red (`--color-error`)
- **Hover:** Background darkens ~10%, adds shadow
- **Active:** Slight shadow reduction
- **Disabled:** 60% opacity

### Cards
- White surface (`--color-surface`)
- Soft shadow (`--shadow-medium`)
- Rounded corners (16px)
- Consistent padding (24px)

### Badges
- Rounded pill shape (height ~20px)
- Compact padding
- Used for shift type, role, or status indicators

### Forms
- Inputs: 8px border radius, 1px border
- Focus: Primary color outline
- Disabled: 60% opacity, grey background

---

## 9. Accessibility

✅ All color contrast ≥ 4.5:1 (WCAG AA)  
✅ Support for `prefers-reduced-motion`  
✅ Focus visible on all interactive elements (2px outline)  
✅ Semantic HTML with ARIA roles  
✅ Keyboard navigation support  

---

## 10. UX Tone & Content Style

**Voice:** Clear, efficient, neutral — like a professional control panel

**Labels:** Short and functional
- "Day Shift"
- "View Rota"
- "Add Assignment"

**Empty States:** Softly instructive
- "No shifts scheduled for this date."

**Error States:** Polite and human
- "Couldn't load shifts. Try again?"

---

## 11. Implementation

### CSS Architecture
- **Reset:** Normalize browser defaults
- **Variables:** Design tokens in `variables.css`
- **Layers:** Base → Components → Utilities
- **Methodology:** Functional CSS with semantic components

### File Structure
```
frontend/src/assets/styles/
├── reset.css          # Browser normalization
├── variables.css      # Design tokens
└── main.css           # Component styles
```

### Usage Example
```html
<button class="btn btn-primary">
  Add Assignment
</button>

<div class="card">
  <div class="card-header">
    <h2 class="card-title">Day Shift</h2>
  </div>
  <div class="card-content">
    <!-- Content here -->
  </div>
</div>

<span class="badge badge-supervisor">Supervisor</span>
```

---

## 12. Performance Targets

- **TTI (Time to Interactive):** ≤ 1s on modern desktop
- **Image Assets:** Compressed, SVG icons preferred
- **Lazy Loading:** Rota data for week navigation
- **Font Loading:** System fonts with Inter as progressive enhancement

---

## Notes

This design system is **NOT** Material Design 3 Expressive. It's a custom system designed specifically for the Staff Rota Application with a focus on:

1. **Clarity over decoration**
2. **Data-focused presentation**
3. **Professional aesthetic**
4. **Minimal visual noise**
5. **Intentional design decisions**

Every color, spacing value, and component has been chosen to support the primary goal: **helping users quickly understand staff scheduling at a glance**.

