# Jowen's Kitchen & Cafe - Complete Design System

## 📋 Table of Contents
1. [Brand Identity](#brand-identity)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Components](#components)
6. [Patterns & Textures](#patterns--textures)
7. [Animations & Transitions](#animations--transitions)
8. [Iconography](#iconography)
9. [Shadows & Elevation](#shadows--elevation)
10. [Responsive Design](#responsive-design)
11. [Accessibility](#accessibility)

---

## 🎨 Brand Identity

### Brand Essence
**Jowen's Kitchen & Cafe** embodies:
- **Premium Quality**: High-end artisan coffee shop experience
- **Warmth & Comfort**: Cozy, inviting atmosphere
- **Professional Excellence**: Sophisticated yet approachable
- **Modern Tradition**: Contemporary design with classic elegance

### Brand Personality
- Sophisticated
- Warm
- Professional
- Artisanal
- Welcoming
- Detail-oriented

---

## 🌈 Color System

### Primary Coffee Palette

#### Dark Tones (Foundation)
```css
--coffee-espresso: #3E2723      /* Primary dark - Headers, text */
--coffee-dark-roast: #4E342E    /* Secondary dark - Gradients */
--coffee-medium-roast: #5D4037  /* Medium - Accents, borders */
```

#### Warm Tones (Accents)
```css
--coffee-caramel: #A1887F       /* Warm neutral - Placeholders */
--coffee-latte: #BCAAA4         /* Light neutral - Borders */
--coffee-cream: #EFEBE9         /* Background tint */
--coffee-foam: #FAFAFA          /* Pure light background */
```

#### Metallic Accents (Premium)
```css
--coffee-gold: #D4A574          /* Primary accent - Focus, highlights */
--coffee-copper: #B87333        /* Secondary accent - Borders */
--coffee-amber: #FFB74D         /* Tertiary accent - Special states */
```

### Functional Colors

#### Status Colors
```css
--success: #66BB6A              /* Time in, positive actions */
--success-light: #E8F5E9        /* Success backgrounds */
--danger: #EF5350               /* Time out, errors */
--danger-light: #FFEBEE         /* Error backgrounds */
--warning: #FFA726              /* Warnings, alerts */
--warning-light: #FFF3E0        /* Warning backgrounds */
--info: #42A5F5                 /* Information */
--info-light: #E3F2FD           /* Info backgrounds */
```

#### Neutral Grayscale
```css
--gray-50: #FAFAFA
--gray-100: #F5F5F5
--gray-200: #EEEEEE
--gray-300: #E0E0E0
--gray-400: #BDBDBD
--gray-500: #9E9E9E
--gray-600: #757575
--gray-700: #616161
--gray-800: #424242
--gray-900: #212121
```

### Color Usage Guidelines

**Background Hierarchy:**
1. **Primary Background**: Dark espresso gradients (Time Keeping page)
2. **Panel Background**: White to cream gradients (Content cards)
3. **Neutral Background**: Gray-50 to Gray-100 (Dashboard areas)

**Text Hierarchy:**
1. **Primary Text**: Coffee-Espresso (#3E2723)
2. **Secondary Text**: Coffee-Medium-Roast (#5D4037)
3. **Tertiary Text**: Coffee-Caramel (#A1887F)
4. **Light Text**: Coffee-Cream (#EFEBE9) - on dark backgrounds

**Interactive States:**
- **Default**: White or Coffee-Cream
- **Hover**: Coffee-Gold (#D4A574) accents
- **Active**: Coffee-Espresso (#3E2723)
- **Focus**: Coffee-Gold (#D4A574) with glow
- **Disabled**: Gray-300 (#E0E0E0)

---

## ✍️ Typography

### Font Families

#### Serif (Elegant Headlines)
```css
font-family: 'Cormorant Garamond', Georgia, serif;
```
**Use for:**
- Page titles
- Time displays
- Data values
- Elegant headings
- Logo text

**Weights:** 300 (Light), 400 (Regular), 500 (Medium), 600 (Semi-Bold), 700 (Bold)

#### Sans-Serif (Clean Body Text)
```css
font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```
**Use for:**
- Body text
- Labels
- Buttons
- Forms
- Navigation
- UI elements

**Weights:** 300 (Light), 400 (Regular), 500 (Medium), 600 (Semi-Bold), 700 (Bold)

### Type Scale

#### Headings
```css
h1: 36px / 600 weight / -0.5px letter-spacing (Cormorant)
h2: 28px / 600 weight / -0.5px letter-spacing (Cormorant)
h3: 24px / 600 weight / normal letter-spacing (Montserrat)
h4: 20px / 600 weight / normal letter-spacing (Montserrat)
h5: 18px / 600 weight / normal letter-spacing (Montserrat)
h6: 16px / 600 weight / normal letter-spacing (Montserrat)
```

#### Body Text
```css
Large: 16px / 500 weight / 0.5px letter-spacing
Base: 14px / 400 weight / normal letter-spacing
Small: 13px / 400 weight / normal letter-spacing
Tiny: 12px / 600 weight / 1.2px letter-spacing (uppercase labels)
Micro: 11px / 700 weight / 1.5px letter-spacing (uppercase buttons)
```

#### Display Text
```css
Time Display: 52px / 300 weight / 3px letter-spacing (Cormorant)
Large Numbers: 32px / 300 weight / normal letter-spacing (Cormorant)
Input Text: 26px / 500 weight / 3px letter-spacing (Cormorant)
```

### Typography Rules

1. **Line Height:**
   - Headings: 1.2
   - Body text: 1.5
   - Buttons/Labels: 1.0

2. **Letter Spacing:**
   - Uppercase labels: 1.2px - 1.5px
   - Normal text: default
   - Large displays: 2px - 3px

3. **Text Transform:**
   - Buttons: uppercase
   - Labels: uppercase
   - Headers: sentence case
   - Body: sentence case

---

## 📐 Spacing & Layout

### Spacing Scale (8px base)
```css
--space-xs: 4px      /* Tight spacing */
--space-sm: 8px      /* Small gaps */
--space-md: 16px     /* Default spacing */
--space-lg: 24px     /* Section spacing */
--space-xl: 32px     /* Large sections */
--space-2xl: 40px    /* Panel padding */
--space-3xl: 48px    /* Page margins */
```

### Layout Grid

#### Time Keeping System
- **Container Max-Width**: 1400px
- **Grid Columns**: 2 columns (1fr 1fr)
- **Gap**: 30px
- **Panel Padding**: 40px
- **Border Radius**: 20px (panels), 12px (components)

#### Sales Dashboard
- **Container**: Full width with 30px padding
- **Chart Grid**: 12-column system
- **Card Spacing**: 20px gaps
- **Card Padding**: 24px

#### Manager Dashboard
- **Sidebar Width**: 250px (fixed)
- **Content Area**: calc(100vw - 250px)
- **Content Padding**: 30px

### Responsive Breakpoints
```css
/* Desktop */
@media (min-width: 1025px) { /* Default styles */ }

/* Tablet */
@media (max-width: 1024px) {
    /* Single column layout */
    /* Reduced padding */
}

/* Mobile */
@media (max-width: 768px) {
    /* Stack all elements */
    /* Smaller fonts */
    /* Touch-friendly targets (min 44px) */
}

/* Small Mobile */
@media (max-width: 480px) {
    /* Minimal padding */
    /* Compressed layouts */
}
```

---

## 🧩 Components

### Buttons

#### Primary Button (Time In)
```css
Background: linear-gradient(135deg, #66BB6A 0%, #4CAF50 100%)
Border-bottom: 3px solid #388E3C
Color: white
Padding: 22px 20px
Border-radius: 12px
Font: 16px / 600 / uppercase / 1px letter-spacing
```

#### Danger Button (Time Out)
```css
Background: linear-gradient(135deg, #EF5350 0%, #E53935 100%)
Border-bottom: 3px solid #C62828
Color: white
Padding: 22px 20px
Border-radius: 12px
```

#### Secondary Button (Filters)
```css
Background: white
Border: 2px solid #BCAAA4
Color: #4E342E
Padding: 12px 16px
Border-radius: 10px
```

#### Manager Login Button
```css
Background: linear-gradient(135deg, white 0%, #EFEBE9 100%)
Border: 2px solid #D4A574
Color: #3E2723
Padding: 20px 45px
Border-radius: 50px
Font: 16px / 700 / uppercase / 1.5px letter-spacing
```

**Button States:**
- **Hover**: translateY(-3px) + shadow-lg
- **Active**: translateY(-1px)
- **Disabled**: opacity 0.5 + no transforms
- **Focus**: 3px gold outline with offset

### Form Inputs

#### Text Input
```css
Padding: 18px 24px
Font: 26px / 500 / 3px letter-spacing (Cormorant)
Border: 2px solid #BCAAA4
Border-radius: 12px
Background: white
Box-shadow: inset 0 2px 4px rgba(62, 39, 35, 0.06)

/* Focus State */
Border-color: #D4A574
Box-shadow: 0 0 0 4px rgba(212, 165, 116, 0.15)
```

#### Select / Dropdown
```css
Padding: 8px 14px
Font: 13px / 400
Border: 1px solid #E9ECEF
Border-radius: 4px
Background: white
```

#### Labels
```css
Font: 12px / 600 / uppercase / 1.2px letter-spacing (Montserrat)
Color: #4E342E
Margin-bottom: 10px
```

### Cards & Panels

#### Main Panel
```css
Background: linear-gradient(135deg, white 0%, #EFEBE9 100%)
Border-radius: 20px
Padding: 40px
Border: 1px solid rgba(212, 165, 116, 0.1)
Border-left: 4px solid #D4A574 (or #B87333)
Box-shadow: 0 16px 48px rgba(62, 39, 35, 0.20)
```

#### KPI Card
```css
Background: white
Border-radius: 8px
Padding: 24px
Border-left: 4px solid (color)
Box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1)
```

#### Chart Card
```css
Background: white
Border-radius: 8px
Padding: 24px
Box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1)
```

### Tables

#### Header Row
```css
Background: linear-gradient(135deg, #3E2723, #4E342E)
Color: #EFEBE9
Padding: 14px 16px
Font: 11px / 700 / uppercase / 1.2px letter-spacing
Border-bottom: 2px solid #D4A574
Border-radius: 10px (first/last child)
```

#### Body Rows
```css
Background: white
Padding: 16px
Font: 14px / normal
Border-bottom: 1px solid #EFEBE9

/* Hover */
Background: #EFEBE9
Box-shadow: 0 2px 4px rgba(62, 39, 35, 0.08)
```

### Badges

#### Status Badges
```css
Display: inline-flex
Padding: 6px 14px
Border-radius: 20px
Font: 11px / 700 / uppercase / 0.5px letter-spacing
Box-shadow: 0 2px 4px rgba(62, 39, 35, 0.08)

/* Variants */
Present: linear-gradient(135deg, #E8F5E9, #C8E6C9) + #2E7D32 text
Absent: linear-gradient(135deg, #FFEBEE, #FFCDD2) + #C62828 text
Late: linear-gradient(135deg, #FFF3E0, #FFE0B2) + #E65100 text
```

### Alerts

#### Success Alert
```css
Background: linear-gradient(135deg, #E8F5E9, #C8E6C9)
Color: #1B5E20
Border-left: 4px solid #4CAF50
Padding: 18px 24px
Border-radius: 12px
Box-shadow: 0 4px 8px rgba(62, 39, 35, 0.12)
```

#### Error Alert
```css
Background: linear-gradient(135deg, #FFEBEE, #FFCDD2)
Color: #B71C1C
Border-left: 4px solid #F44336
```

---

## 🎭 Patterns & Textures

### Coffee Bean Pattern
```svg
<svg width="100" height="100" viewBox="0 0 100 100">
  <g fill="rgba(255,255,255,0.015)">
    <circle cx="20" cy="20" r="3"/>
    <circle cx="60" cy="40" r="2"/>
    <ellipse cx="70" cy="20" rx="4" ry="8" transform="rotate(45 70 20)"/>
  </g>
</svg>
```

**Usage:** Background overlay on time keeping page

### Paper Texture
```svg
<svg width="200" height="200">
  <filter id="noise">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4"/>
    <feColorMatrix type="saturate" values="0"/>
  </filter>
  <rect width="200" height="200" filter="url(#noise)" opacity="0.03"/>
</svg>
```

**Usage:** Subtle texture on panels and cards

### Gradient Overlays
```css
/* Warm ambient glow */
radial-gradient(circle at top right, rgba(212, 165, 116, 0.08) 0%, transparent 70%)

/* Soft spotlight */
radial-gradient(circle at 20% 30%, rgba(212, 165, 116, 0.03) 0%, transparent 50%)
```

---

## ✨ Animations & Transitions

### Timing Functions
```css
--transition-fast: 0.15s ease
--transition-base: 0.3s ease
--transition-slow: 0.5s ease
--easing-smooth: cubic-bezier(0.4, 0, 0.2, 1)
```

### Common Animations

#### Fade In Up (Page Load)
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
animation: fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1);
```

#### Slide Down (Alerts)
```css
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
animation: slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1);
```

#### Pulse (Logo)
```css
@keyframes pulse {
  0%, 100% {
    box-shadow: 0 8px 24px rgba(62, 39, 35, 0.16), 0 0 0 8px rgba(212, 165, 116, 0.1);
  }
  50% {
    box-shadow: 0 8px 24px rgba(62, 39, 35, 0.16), 0 0 0 12px rgba(212, 165, 116, 0.15);
  }
}
animation: pulse 2s ease-in-out infinite;
```

#### Shimmer (Time Display)
```css
@keyframes shimmer {
  0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
  100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
}
animation: shimmer 3s linear infinite;
```

#### Spin (Loading)
```css
@keyframes spin {
  to { transform: rotate(360deg); }
}
animation: spin 0.8s linear infinite;
```

#### Button Ripple
```css
.button::before {
  content: '';
  position: absolute;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 0;
  height: 0;
  transition: width 0.6s, height 0.6s;
}
.button:hover::before {
  width: 300px;
  height: 300px;
}
```

### Hover Effects

**Cards:**
```css
transform: translateY(-2px);
box-shadow: 0 10px 15px -3px rgba(62, 39, 35, 0.1);
transition: all 0.3s ease;
```

**Buttons:**
```css
transform: translateY(-3px);
box-shadow: 0 8px 24px rgba(62, 39, 35, 0.16);
transition: all 0.3s ease;
```

**Table Rows:**
```css
background: #EFEBE9;
box-shadow: 0 2px 4px rgba(62, 39, 35, 0.08);
transition: all 0.15s ease;
```

---

## 🎯 Iconography

### Icon Style
- **Type**: Unicode emoji or Font Awesome
- **Size Range**: 24px - 52px
- **Color**: Inherit from parent or use filter: drop-shadow()
- **Alignment**: Centered with flexbox

### Common Icons
```
Time: 🕐 ☕
Success: ✓ ✅
Error: ✕ ❌
Warning: ⚠️
Info: ℹ️
Money: 💰 ₱
Orders: 📦
Analytics: 📊 📈
Calendar: 📅
Location: 📍
User: 👤
Lock: 🔐
Search: 🔍
Filter: 🔽
Menu: ☰
```

### Icon Usage
```css
.icon {
  font-size: 36px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  margin: 0 auto;
}
```

---

## 🌑 Shadows & Elevation

### Shadow Scale
```css
/* Subtle */
--shadow-sm: 0 2px 4px rgba(62, 39, 35, 0.08);

/* Default */
--shadow-md: 0 4px 8px rgba(62, 39, 35, 0.12);

/* Elevated */
--shadow-lg: 0 8px 24px rgba(62, 39, 35, 0.16);

/* Floating */
--shadow-xl: 0 16px 48px rgba(62, 39, 35, 0.20);

/* Inset */
--shadow-inner: inset 0 2px 4px rgba(62, 39, 35, 0.06);
```

### Elevation Hierarchy
1. **Level 0** (Base): No shadow - Background elements
2. **Level 1** (Raised): shadow-sm - Cards at rest
3. **Level 2** (Elevated): shadow-md - Hover states
4. **Level 3** (Floating): shadow-lg - Active modals
5. **Level 4** (Top): shadow-xl - Dropdowns, popovers

### Text Shadows
```css
/* Subtle depth */
text-shadow: 0 2px 4px rgba(62, 39, 35, 0.05);

/* Display text */
text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
```

---

## 📱 Responsive Design

### Mobile-First Approach
Start with mobile design, enhance for larger screens.

### Touch Targets
- **Minimum Size**: 44px × 44px
- **Recommended**: 48px × 48px
- **Spacing**: 8px minimum between targets

### Font Size Adjustments
```css
/* Desktop */
h1: 36px
body: 14px
button: 16px

/* Tablet (≤1024px) */
h1: 28px
body: 14px
button: 14px

/* Mobile (≤768px) */
h1: 24px
body: 13px
button: 14px

/* Small Mobile (≤480px) */
h1: 20px
body: 12px
button: 13px
```

### Layout Adaptations

**Desktop (>1024px):**
- Two-column layouts
- Sidebar navigation
- Hover interactions

**Tablet (≤1024px):**
- Single column layouts
- Collapsible navigation
- Larger touch targets

**Mobile (≤768px):**
- Stacked elements
- Bottom navigation
- Full-width buttons
- Simplified tables

---

## ♿ Accessibility

### Color Contrast
- **Normal Text**: 4.5:1 minimum
- **Large Text (18px+)**: 3:1 minimum
- **Interactive Elements**: 3:1 minimum

### Focus Indicators
```css
:focus-visible {
  outline: 3px solid #D4A574;
  outline-offset: 3px;
}
```

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Logical tab order
- Skip links for main content
- Escape to close modals

### Screen Readers
- Semantic HTML (header, nav, main, footer, article)
- ARIA labels where needed
- Alt text for images
- Descriptive link text

### Motion Sensitivity
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 📄 Component Checklist

When creating a new component, ensure:

- [ ] Uses defined color variables
- [ ] Follows typography scale
- [ ] Implements proper spacing
- [ ] Includes all interactive states (hover, active, focus, disabled)
- [ ] Has appropriate shadows
- [ ] Includes smooth transitions
- [ ] Is mobile responsive
- [ ] Meets accessibility standards
- [ ] Uses semantic HTML
- [ ] Maintains brand consistency

---

## 🎨 Design Principles

### 1. Consistency
Use the same patterns, colors, and spacing throughout the application.

### 2. Hierarchy
Guide users through clear visual hierarchy using size, color, and spacing.

### 3. Simplicity
Keep interfaces clean and uncluttered. Remove unnecessary elements.

### 4. Feedback
Provide immediate visual feedback for all user interactions.

### 5. Accessibility
Design for all users, including those with disabilities.

### 6. Performance
Optimize for fast load times and smooth animations.

### 7. Brand Alignment
Every element should reinforce the premium coffee shop brand.

---

## 📦 Implementation Files

### CSS Architecture
```
css/
├── timekeeping.css          # Time keeping system styles
├── sales-dashboard.css      # Sales analytics styles
├── analytics-dashboard.css  # Home dashboard styles
├── inventify-theme.css      # Inventory styles
├── recipe-form-styles.css   # Recipe management styles
└── style.css                # Base global styles
```

### JavaScript Modules
```
js/
├── timekeeping.js           # Time keeping functionality
├── sales-dashboard.js       # Sales charts & data
├── home-dashboard.js        # Home analytics
├── inventify-inventory.js   # Inventory management
├── recipe-management.js     # Recipe features
└── script.js                # Core application logic
```

---

## 🚀 Quick Reference

### Most Used Colors
```
Primary: #3E2723 (Coffee Espresso)
Accent: #D4A574 (Coffee Gold)
Background: #EFEBE9 (Coffee Cream)
Success: #66BB6A
Danger: #EF5350
```

### Common Spacing
```
Component gap: 16px
Section gap: 24px
Panel padding: 40px
Card padding: 24px
```

### Border Radius
```
Small: 8px
Medium: 12px
Large: 16px
Panel: 20px
Pill: 50px
```

### Most Used Fonts
```
Headings: 'Cormorant Garamond', serif
Body: 'Montserrat', sans-serif
```

---

**Last Updated:** 2025
**Version:** 1.0
**Status:** Production Ready ✅
