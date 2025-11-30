# 🎨 Design System - Quick Reference Guide

## Color Palette at a Glance

### Coffee Tones
```
🟤 #3E2723  Coffee Espresso     (Primary dark)
🟤 #4E342E  Coffee Dark Roast   (Secondary dark)
🟤 #5D4037  Coffee Medium Roast (Accent dark)
🟫 #A1887F  Coffee Caramel      (Warm neutral)
🟫 #BCAAA4  Coffee Latte        (Light neutral)
⬜ #EFEBE9  Coffee Cream        (Background)
⬜ #FAFAFA  Coffee Foam         (Pure white)
🟨 #D4A574  Coffee Gold         (Premium accent)
🟨 #B87333  Coffee Copper       (Secondary accent)
```

### Functional Colors
```
🟢 #66BB6A  Success
🔴 #EF5350  Danger
🟠 #FFA726  Warning
🔵 #42A5F5  Info
```

---

## Typography Quick Copy

### Headings
```css
/* H1 - Page Titles */
font: 600 36px/1.2 'Cormorant Garamond', serif;
color: #3E2723;
letter-spacing: -0.5px;

/* H2 - Section Titles */
font: 600 28px/1.2 'Cormorant Garamond', serif;
color: #3E2723;

/* H3 - Component Titles */
font: 600 24px/1.2 'Montserrat', sans-serif;
color: #3E2723;
```

### Body Text
```css
/* Large Body */
font: 500 16px/1.5 'Montserrat', sans-serif;
letter-spacing: 0.5px;

/* Base Body */
font: 400 14px/1.5 'Montserrat', sans-serif;

/* Labels (uppercase) */
font: 600 12px/1 'Montserrat', sans-serif;
text-transform: uppercase;
letter-spacing: 1.2px;
```

### Display Text
```css
/* Time Display */
font: 300 52px/1 'Cormorant Garamond', serif;
letter-spacing: 3px;

/* Large Numbers */
font: 300 32px/1 'Cormorant Garamond', serif;
```

---

## Spacing Scale
```
4px   = xs    (Tight)
8px   = sm    (Small)
16px  = md    (Default)
24px  = lg    (Section)
32px  = xl    (Large)
40px  = 2xl   (Panel)
48px  = 3xl   (Page)
```

---

## Shadow Levels
```css
/* Level 1 - Subtle */
box-shadow: 0 2px 4px rgba(62, 39, 35, 0.08);

/* Level 2 - Default */
box-shadow: 0 4px 8px rgba(62, 39, 35, 0.12);

/* Level 3 - Elevated */
box-shadow: 0 8px 24px rgba(62, 39, 35, 0.16);

/* Level 4 - Floating */
box-shadow: 0 16px 48px rgba(62, 39, 35, 0.20);

/* Inset */
box-shadow: inset 0 2px 4px rgba(62, 39, 35, 0.06);
```

---

## Border Radius
```
8px   = Small (Badges, small cards)
12px  = Medium (Buttons, inputs)
16px  = Large (Modals)
20px  = Panels (Main containers)
50px  = Pills (Round buttons)
```

---

## Common Button Styles

### Primary (Success)
```css
background: linear-gradient(135deg, #66BB6A 0%, #4CAF50 100%);
color: white;
padding: 22px 20px;
border-radius: 12px;
border-bottom: 3px solid #388E3C;
font: 600 16px 'Montserrat';
text-transform: uppercase;
letter-spacing: 1px;
```

### Danger
```css
background: linear-gradient(135deg, #EF5350 0%, #E53935 100%);
color: white;
border-bottom: 3px solid #C62828;
```

### Secondary
```css
background: white;
color: #4E342E;
border: 2px solid #BCAAA4;
padding: 12px 16px;
border-radius: 10px;
```

---

## Input Field Template
```css
.input {
  width: 100%;
  padding: 18px 24px;
  font: 500 26px 'Cormorant Garamond';
  letter-spacing: 3px;
  text-align: center;
  border: 2px solid #BCAAA4;
  border-radius: 12px;
  background: white;
  color: #3E2723;
  box-shadow: inset 0 2px 4px rgba(62, 39, 35, 0.06);
}

.input:focus {
  border-color: #D4A574;
  box-shadow: 0 0 0 4px rgba(212, 165, 116, 0.15);
  outline: none;
}
```

---

## Card Template
```css
.card {
  background: linear-gradient(135deg, white 0%, #EFEBE9 100%);
  border-radius: 20px;
  padding: 40px;
  border: 1px solid rgba(212, 165, 116, 0.1);
  border-left: 4px solid #D4A574;
  box-shadow: 0 16px 48px rgba(62, 39, 35, 0.20);
}
```

---

## Table Template
```css
/* Header */
thead {
  background: linear-gradient(135deg, #3E2723, #4E342E);
  color: #EFEBE9;
}

th {
  padding: 14px 16px;
  font: 700 11px 'Montserrat';
  text-transform: uppercase;
  letter-spacing: 1.2px;
  border-bottom: 2px solid #D4A574;
}

/* Body */
td {
  padding: 16px;
  font: 400 14px 'Montserrat';
  color: #3E2723;
  background: white;
  border-bottom: 1px solid #EFEBE9;
}

tr:hover {
  background: #EFEBE9;
  box-shadow: 0 2px 4px rgba(62, 39, 35, 0.08);
}
```

---

## Badge Template
```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 20px;
  font: 700 11px 'Montserrat';
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 4px rgba(62, 39, 35, 0.08);
}

/* Success */
background: linear-gradient(135deg, #E8F5E9, #C8E6C9);
color: #2E7D32;
border: 1px solid #81C784;

/* Danger */
background: linear-gradient(135deg, #FFEBEE, #FFCDD2);
color: #C62828;
border: 1px solid #E57373;
```

---

## Common Animations

### Fade In Up
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

.element {
  animation: fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Button Hover
```css
.button {
  transition: all 0.3s ease;
}

.button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(62, 39, 35, 0.16);
}
```

---

## Responsive Breakpoints
```css
/* Desktop - Default */
@media (min-width: 1025px) { }

/* Tablet */
@media (max-width: 1024px) {
  /* Single column */
  grid-template-columns: 1fr;
}

/* Mobile */
@media (max-width: 768px) {
  /* Stack all */
  padding: 20px 15px;
  font-size: 14px;
}

/* Small Mobile */
@media (max-width: 480px) {
  /* Minimal */
  padding: 15px 10px;
  font-size: 12px;
}
```

---

## Focus State (Accessibility)
```css
:focus-visible {
  outline: 3px solid #D4A574;
  outline-offset: 3px;
}
```

---

## Custom Scrollbar
```css
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #EFEBE9;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: #A1887F;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: #B87333;
}
```

---

## Copy-Paste Gradients

### Background Gradients
```css
/* Dark Coffee */
background: linear-gradient(135deg, #3E2723 0%, #4E342E 50%, #5D4037 100%);

/* Light Panel */
background: linear-gradient(135deg, #FFFFFF 0%, #EFEBE9 100%);

/* Time Display */
background: linear-gradient(135deg, #3E2723 0%, #4E342E 100%);
```

### Button Gradients
```css
/* Success */
background: linear-gradient(135deg, #66BB6A 0%, #4CAF50 100%);

/* Danger */
background: linear-gradient(135deg, #EF5350 0%, #E53935 100%);
```

---

## Common Icons (Unicode)
```
☕ Coffee
🕐 Clock
✓  Check / Success
✕  Close / Error
⚠️  Warning
ℹ️  Info
💰 Money
📦 Package / Order
📊 Chart / Analytics
📅 Calendar
📍 Location
👤 User
🔐 Lock / Security
🔍 Search
⬆️ Up Arrow
⬇️ Down Arrow
```

---

## Color Contrast Checker

### Text on Dark Coffee (#3E2723)
✅ White (#FFFFFF) - WCAG AAA
✅ Coffee Cream (#EFEBE9) - WCAG AA
✅ Coffee Gold (#D4A574) - WCAG AA
❌ Coffee Caramel (#A1887F) - Fails WCAG

### Text on White
✅ Coffee Espresso (#3E2723) - WCAG AAA
✅ Coffee Dark Roast (#4E342E) - WCAG AAA
✅ Coffee Medium Roast (#5D4037) - WCAG AA
⚠️ Coffee Caramel (#A1887F) - WCAG AA (large text only)

---

## Component States Reference

### Button States
```
Default:  background + shadow-md
Hover:    transform: translateY(-3px) + shadow-lg
Active:   transform: translateY(-1px)
Focus:    outline: 3px solid gold + offset 3px
Disabled: opacity: 0.5 + pointer-events: none
```

### Input States
```
Default:  border: 2px solid latte
Focus:    border: gold + glow
Error:    border: danger + red glow
Success:  border: success + green glow
Disabled: background: gray-100 + opacity: 0.6
```

### Card States
```
Default:  shadow-xl
Hover:    translateY(-2px) + shadow-xl
Active:   Current state maintained
```

---

## Grid System Quick Reference

### Time Keeping
```css
.container {
  max-width: 1400px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}
```

### Dashboard (12-column)
```css
.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 20px;
}

.span-4 { grid-column: span 4; }
.span-6 { grid-column: span 6; }
.span-8 { grid-column: span 8; }
.span-12 { grid-column: span 12; }
```

---

## Useful CSS Variables
```css
:root {
  /* Colors */
  --coffee-espresso: #3E2723;
  --coffee-gold: #D4A574;
  --coffee-cream: #EFEBE9;

  /* Shadows */
  --shadow-md: 0 4px 8px rgba(62, 39, 35, 0.12);
  --shadow-lg: 0 8px 24px rgba(62, 39, 35, 0.16);

  /* Transitions */
  --transition-base: 0.3s ease;

  /* Spacing */
  --space-md: 16px;
  --space-lg: 24px;
}
```

---

## Design Checklist

Before launching a component:

- [ ] Uses coffee color palette
- [ ] Typography matches scale
- [ ] Spacing uses 8px grid
- [ ] Has all interactive states
- [ ] Smooth transitions added
- [ ] Shadow depth appropriate
- [ ] Mobile responsive
- [ ] Keyboard accessible
- [ ] Focus indicators visible
- [ ] Color contrast WCAG AA+
- [ ] Consistent with brand

---

**Quick Tip:** When in doubt, reference the full [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) for detailed specifications.

**Version:** 1.0 | **Last Updated:** 2025
