# Analytics Dashboard - Visual Layout Guide

This document describes the visual appearance and layout of the Business Analytics Dashboard.

---

## Dashboard Layout Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  📊 Business Analytics Dashboard                                    │
│  Coffee Shop Performance & Insights                                 │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Year: [2024 ▼]  Quarter: [All Quarters ▼]  Region: [All ▼] 🔄     │
└─────────────────────────────────────────────────────────────────────┘

┌──────────┬──────────┬──────────┬──────────┐
│ 📊 TOTAL │ 💰 GROSS │ 📈 AVG   │ 📦 TOTAL │
│ REVENUE  │ PROFIT   │ MARGIN   │ ORDERS   │
│          │          │          │          │
│ ₱3.80M   │ ₱2.58M   │  68.0%   │ 12,850   │
│ ↑ 15.2%  │ ↑ 18.5%  │ ↑ 2.1%   │ ↑ 12.8%  │
└──────────┴──────────┴──────────┴──────────┘

┌───────────────────────────┬─────────────────┐
│ 📊 Yearly Sales by Region │ 🍩 Gross Margin │
│                           │                 │
│  [Stacked Bar Chart]      │  ┌─────┬──────┐ │
│   12 months × 5 regions   │  │ Rev │ Prof │ │
│                           │  │  🍩 │  🍩  │ │
│                           │  └─────┴──────┘ │
└───────────────────────────┴─────────────────┘

┌───────────────────────────┬─────────────────┐
│ 📈 Actual vs Plan         │ 🌍 Sales & Prof │
│                           │                 │
│  [Line Chart]             │  [Horizontal    │
│   Plan (dashed)           │   Stacked Bars] │
│   Actual (solid)          │                 │
│                           │   5 regions     │
└───────────────────────────┴─────────────────┘

┌──────────────────────────┬───────────────────┐
│ 📋 Sales Crosstab        │ 💰 Actual vs Plan │
│                          │                   │
│  [Table: Category×Region]│  [Variance Table] │
│                          │                   │
│  Categories:             │  Monthly:         │
│  - Coffee                │  - Plan           │
│  - Pastries              │  - Actual         │
│  - Sandwiches            │  - Variance       │
│  - Beverages             │  - % Change       │
│  - Others                │  - Profit         │
│                          │                   │
│  Total row included      │  📥 Export CSV    │
└──────────────────────────┴───────────────────┘
```

---

## Color Scheme Visualization

### Primary Colors

**Orange Gradient:**
```
█ #FF8C42  Primary Orange (Charts, buttons)
█ #FFB380  Light Orange (Secondary elements)
█ #E67A30  Dark Orange (Hover states)
```

**Brown Gradient:**
```
█ #8B6F47  Coffee Brown (Secondary charts)
█ #A68A64  Light Brown (Tertiary elements)
█ #6D5738  Dark Brown (Dark accents)
```

### Background Colors

```
█ #FFFFFF  White (Cards, clean backgrounds)
█ #FAFAFA  Off-white (Page background)
█ #F9F9F9  Light gray (Hover states)
```

### Status Colors

```
█ #4CAF50  Green (Positive variance, up arrows)
█ #F44336  Red (Negative variance, down arrows)
```

---

## KPI Cards Design

```
┌────────────────────────────┐
│  📊 TOTAL ITEMS           │  ← Small uppercase label
│                            │
│        ₱3,798,000         │  ← Large value (32px)
│                            │
│  ↑ 15.2% vs last period   │  ← Trend indicator
└────────────────────────────┘
 ↑ Orange left border (4px)
```

**Features:**
- White background
- 4px orange left border
- Box shadow on hover
- Slight lift on hover (translateY)
- Green for positive, red for negative trends

---

## Stacked Bar Chart (Sales by Region)

```
       North South East West Central

Dec    ████████████████████████████  ← Tallest
Nov    █████████████████████████
Oct    ████████████████████
Sep    ███████████████████
Aug    ██████████████████
Jul    █████████████████
Jun    ████████████████
May    ███████████████
Apr    ██████████████
Mar    █████████████
Feb    ████████████
Jan    ███████████         ← Shortest

Legend: █ North  █ South  █ East  █ West  █ Central
```

**Visual Properties:**
- Horizontal bars
- 5 colors (one per region)
- Stacked to show total
- Light gray grid lines
- Hover tooltips with currency
- 12 bars (one per month)

---

## Line Chart (Actual vs Plan)

```
₱450K ┤                                    ●  ← Actual (solid orange)
      │                              ●    ╱
₱400K ┤                        ●    ╱   ╱
      │                  ●    ╱    ╱   ╱
₱350K ┤            ●    ╱    ╱    ╱   ╱
      │      ●    ╱    ╱    ╱    ╱   ╱
₱300K ┤●    ╱    ╱    ╱    ╱    ╱   ╱
      │    ╱    ╱    ╱    ╱    ╱   ╱
₱250K ┤  ╱    ╱    ╱    ╱    ╱   ╱  Plan (dashed gray)
      │ ╱    ╱    ╱    ╱    ╱   ╱
      └───────────────────────────────
       J  F  M  A  M  J  J  A  S  O  N  D
```

**Visual Properties:**
- Two lines
- Plan: Dashed gray line
- Actual: Solid orange line with fill
- Larger orange points
- Smooth curves (tension: 0.4)
- Shaded area under actual

---

## Donut Charts (Margin by Category)

```
    REVENUE                    PROFIT

      Coffee                    Coffee
     ╱──────╲                  ╱──────╲
    │  🍩    │                │  🍩    │
     ╲──────╱                  ╲──────╱

Legend:                      Legend:
█ Coffee    35%             █ Coffee    37%
█ Pastries  22%             █ Pastries  20%
█ Sandwiches 25%            █ Sandwiches 23%
█ Beverages  14%            █ Beverages  13%
█ Others      4%            █ Others      7%
```

**Visual Properties:**
- Two donuts side-by-side
- 65% cutout (thick ring)
- 5 segments each
- Same color scheme
- Bottom legend
- Hover shows value + percentage

---

## Horizontal Bar Chart (Sales & Profit by Region)

```
         Sales          Profit

North   ██████████████  ████████  ← Longest
South   ████████████    ██████
East    ██████████      █████
West    ████████        ████
Central ███████████     ███████

        0K   200K  400K  600K  800K
```

**Visual Properties:**
- Horizontal orientation
- Grouped bars (Sales & Profit)
- Orange for Sales
- Brown for Profit
- Grid lines
- Currency axis

---

## Crosstab Table

```
┌────────────┬────────┬────────┬────────┬────────┬────────┬─────────┐
│ Category   │  North │  South │   East │   West │Central │   Total │
├────────────┼────────┼────────┼────────┼────────┼────────┼─────────┤
│ Coffee     │180,000 │165,000 │142,000 │128,000 │175,000 │ 790,000 │
│ Pastries   │ 95,000 │ 88,000 │ 76,000 │ 69,000 │ 92,000 │ 420,000 │
│ Sandwiches │112,000 │102,000 │ 89,000 │ 81,000 │106,000 │ 490,000 │
│ Beverages  │ 68,000 │ 61,000 │ 53,000 │ 48,000 │ 64,000 │ 294,000 │
│ Others     │ 52,000 │ 47,000 │ 41,000 │ 37,000 │ 49,000 │ 226,000 │
├────────────┼────────┼────────┼────────┼────────┼────────┼─────────┤
│ Total      │507,000 │463,000 │401,000 │363,000 │486,000 │2,220,000│
└────────────┴────────┴────────┴────────┴────────┴────────┴─────────┘
```

**Visual Properties:**
- Clean table design
- Gray header row
- Alternating row hover
- Right-aligned numbers
- Bold totals row
- Light gray borders

---

## Variance Table

```
┌───────┬────────┬────────┬─────────┬──────────┬─────────┐
│ Month │   Plan │ Actual │ Variance│    %     │  Profit │
├───────┼────────┼────────┼─────────┼──────────┼─────────┤
│ Jan   │180,000 │184,000 │  +4,000 │  +2.2%  │ 128,800 │
│ Feb   │190,000 │204,000 │ +14,000 │  +7.4%  │ 142,800 │
│ Mar   │200,000 │212,000 │ +12,000 │  +6.0%  │ 148,400 │
│ Apr   │210,000 │240,000 │ +30,000 │ +14.3%  │ 168,000 │
│ May   │220,000 │246,000 │ +26,000 │ +11.8%  │ 172,200 │
│ Jun   │235,000 │277,000 │ +42,000 │ +17.9%  │ 193,900 │
│ Jul   │250,000 │296,000 │ +46,000 │ +18.4%  │ 207,200 │
│ Aug   │260,000 │305,000 │ +45,000 │ +17.3%  │ 213,500 │
│ Sep   │275,000 │323,000 │ +48,000 │ +17.5%  │ 226,100 │
│ Oct   │290,000 │343,000 │ +53,000 │ +18.3%  │ 240,100 │
│ Nov   │305,000 │363,000 │ +58,000 │ +19.0%  │ 254,100 │
│ Dec   │330,000 │405,000 │ +75,000 │ +22.7%  │ 283,500 │
├───────┼────────┼────────┼─────────┼──────────┼─────────┤
│ Total │2945000 │3798000 │+853,000 │ +29.0%  │2,578,600│
└───────┴────────┴────────┴─────────┴──────────┴─────────┘

Legend: Green numbers/badges = Above plan
        Red numbers/badges = Below plan
```

**Visual Properties:**
- Monospace font for numbers
- Color-coded variance column
- Badge styling on percentages
- Export button in header
- Bold totals row

---

## Filter Bar

```
┌─────────────────────────────────────────────────────────────┐
│  Year:  [  2024  ▼]   Quarter:  [ All Quarters ▼]          │
│                                                              │
│  Region: [ All Regions ▼]          [ 🔄 Refresh Data ]     │
└─────────────────────────────────────────────────────────────┘
```

**Visual Properties:**
- White card background
- Rounded corners
- Dropdowns with arrows
- Orange refresh button
- Responsive wrapping

---

## Responsive Breakpoints

### Desktop (> 1200px)
```
┌────────────────────────────────────┐
│  [KPI] [KPI] [KPI] [KPI]          │
│  [Chart──────────] [Chart──]      │
│  [Chart──────────] [Chart──]      │
│  [Table────────]   [Table────]    │
└────────────────────────────────────┘
```

### Tablet (768px - 1200px)
```
┌────────────────────────────┐
│  [KPI] [KPI]              │
│  [KPI] [KPI]              │
│  [Chart────────────────]  │
│  [Chart────────────────]  │
│  [Chart────────────────]  │
│  [Chart────────────────]  │
│  [Table──────────────]    │
│  [Table──────────────]    │
└────────────────────────────┘
```

### Mobile (< 768px)
```
┌──────────────────┐
│  [KPI]          │
│  [KPI]          │
│  [KPI]          │
│  [KPI]          │
│  [Chart───────] │
│  [Chart───────] │
│  [Chart───────] │
│  [Chart───────] │
│  [Chart───────] │
│  [Table──────>] │ ← Scroll
│  [Table──────>] │ ← Scroll
└──────────────────┘
```

---

## Typography Scale

```
Dashboard Title:     32px, Light (300)
Card Titles:         16px, Semi-bold (600)
Chart Labels:        11px, Regular
Table Headers:       11px, Bold (700), Uppercase
Table Data:          14px, Regular (400)
KPI Values:          32px, Light (300)
KPI Labels:          12px, Semi-bold (600), Uppercase
Filter Labels:       12px, Semi-bold (600), Uppercase
```

---

## Spacing & Shadows

### Card Spacing
```
Padding:     24px
Margin:      24px between cards
Border:      None
Radius:      12px
Shadow:      0 2px 8px rgba(0,0,0,0.06)
Hover:       0 4px 12px rgba(0,0,0,0.1)
```

### Grid Gaps
```
Main Grid:   24px
KPI Cards:   20px
Form Grid:   20px
```

---

## Interactive States

### Buttons
```
Normal:  Orange background, white text
Hover:   Darker orange, slight shadow lift
Active:  Even darker, pressed effect
```

### Chart Points
```
Normal:  5px radius, solid color
Hover:   8px radius, tooltip appears
Active:  Highlighted, tooltip sticky
```

### Table Rows
```
Normal:  White background
Hover:   Light gray background (#F9F9F9)
Active:  Slightly darker gray
```

### Cards
```
Normal:  Shadow: 0 2px 8px rgba(0,0,0,0.06)
Hover:   Shadow: 0 4px 12px rgba(0,0,0,0.1)
         Transform: translateY(-2px)
```

---

## Export & Print

### CSV Export
```
Button: [ 📥 Export ]
Action: Downloads: table-variance_2024-01-21.csv
Format: Standard CSV with headers
```

### Print Layout
```
Removes: Filters, buttons
Keeps:   Headers, charts, tables
Format:  Optimized for A4/Letter paper
Breaks:  Avoids breaking cards
```

---

## Accessibility

### Color Contrast
```
Text on White:      #424242 (8.5:1)
Labels:            #616161 (7:1)
Subtle Text:       #757575 (5:1)
```

### Keyboard Navigation
```
Tab:      Focus visible on all interactive elements
Enter:    Activates buttons and filters
Arrows:   Navigate dropdowns
Esc:      Closes dropdowns
```

---

## Animation & Transitions

### Chart Animations
```
Initial Load:  Fade in + scale (800ms)
Data Update:   Smooth transition (400ms)
Hover:         Instant (0ms)
```

### Card Animations
```
Hover:  Transform + shadow (300ms ease)
Click:  Ripple effect (200ms)
```

### Loading States
```
Spinner:  Rotating circle (1s linear infinite)
Fade:     Opacity transition (300ms)
```

---

## Summary

The dashboard features a **clean, professional executive layout** with:

✅ **Minimal white backgrounds** for clarity
✅ **Soft orange and brown accents** for coffee shop branding
✅ **Light gray grid lines** for subtle structure
✅ **Thin elegant typography** for modern look
✅ **Balanced composition** like PowerPoint slides
✅ **Interactive charts** with Chart.js
✅ **Responsive design** for all devices
✅ **Professional color coding** (green/red for performance)

**Everything is production-ready and looks professional!** 🎨📊
