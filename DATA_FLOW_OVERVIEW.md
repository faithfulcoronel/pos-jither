# POS System Data Flow Overview

## System Architecture: Cashier → View Sales → Business Reports → Business Analytics

This document explains how daily sales records flow through your POS system.

---

## Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     CASHIER DASHBOARD                           │
│  Employee makes sales transactions throughout the day          │
│  - Add products to cart                                        │
│  - Apply discounts                                             │
│  - Process payment (cash/card)                                 │
│  - Complete sale                                               │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ Saves to Database
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE                                 │
│  Tables:                                                        │
│  • sales_transactions (reference, total, payment_method, etc)  │
│  • sales_transaction_items (products, quantities, prices)      │
│  • stock_movements (inventory deductions)                      │
└─────────────┬───────────────┬───────────────┬───────────────────┘
              │               │               │
              │               │               │
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────┐
│   VIEW SALES    │ │ BUSINESS REPORTS│ │ BUSINESS ANALYTICS  │
│   DASHBOARD     │ │                 │ │     DASHBOARD       │
│                 │ │                 │ │                     │
│ Real-time sales │ │ Historical data │ │ All sales info &    │
│ analytics with  │ │ & performance   │ │ comprehensive       │
│ charts:         │ │ metrics:        │ │ insights:           │
│                 │ │                 │ │                     │
│ • KPI Cards     │ │ • Daily summaries│ │ • Revenue trends   │
│ • Sales Trends  │ │ • Weekly reports │ │ • Product performance│
│ • Categories    │ │ • Monthly stats  │ │ • Category analysis│
│ • Best Sellers  │ │ • Export PDF/Excel│ │ • Peak hours      │
│ • Heatmap       │ │ • Period comparison│ │ • Growth metrics │
│ • Product Range │ │                 │ │ • Visual charts    │
└─────────────────┘ └─────────────────┘ └─────────────────────┘
```

---

## 1. Source: Cashier Dashboard

**Location:** Manager Dashboard → Sidebar (Not visible, but processes sales)

**What happens:**
1. Cashier adds products to cart
2. Applies discounts (if any)
3. Customer pays (cash or card)
4. Cashier clicks "Complete Sale"

**Data saved to database:**
```php
sales_transactions:
- reference (unique transaction ID)
- subtotal (before discounts/tax)
- discount_amount
- tax_amount
- total (final amount)
- payment_method (cash/card)
- amount_tendered (what customer paid)
- change_amount (change returned)
- occurred_at (timestamp)

sales_transaction_items:
- transaction_id (FK to sales_transactions)
- product_id
- product_name
- quantity
- unit_price
- discount_amount
- line_total (qty × price - discount)
```

**API Used:** [php/api.php](php/api.php) - `process_sale` action

---

## 2. Destination 1: View Sales Dashboard

**Location:** Manager Dashboard → "View Sales" tab

**Purpose:** Real-time sales analytics and visualization

**Data Source:** Queries `sales_transactions` and `sales_transaction_items` tables

**Features:**

### A. KPI Cards (Top Summary)
- **Total Sales** - Sum of all sales in period
- **Total Orders** - Count of transactions
- **Quantity Sold** - Total items sold
- **Avg Order Value** - Average transaction amount

### B. Sales Trends Over Time (Line Chart with Dual Axis)
- **Revenue Line** - Sales amount over time
- **Order Count Line** - Number of orders over time
- **Dynamic Grouping:**
  - Single Day → Hourly (0:00, 1:00, 2:00...)
  - Week → Daily (Mon, Tue, Wed...)
  - Month → Daily (Jan 1, Jan 2...)
  - Quarter → Weekly (Week 1, Week 2...)
  - Year → Monthly (Jan, Feb, Mar...)

### C. Sales by Product Category (Donut Chart)
- Shows revenue distribution across categories
- Coffee Classics, Signature Espresso, Pastries, etc.

### D. Weekday vs Weekend (Bar Chart)
- Compares weekday performance vs weekend
- Helps identify best days

### E. Product Range Analysis (Donut Chart)
- Groups products by price:
  - Budget (₱0-₱49)
  - Economy (₱50-₱99)
  - Standard (₱100-₱149)
  - Premium (₱150-₱199)
  - Luxury (₱200+)

### F. Quarterly Sales (Bar Chart)
- Q1, Q2, Q3, Q4 comparison
- Year-over-year performance

### G. Top 10 Best Sellers (Table)
- Products ranked by revenue
- Shows category, quantity, revenue

### H. Sales Heatmap (Day × Hour)
- Visualizes peak selling hours
- Shows which day/time combinations are busiest

**Filter Options:**
- Quick filters: Today, Yesterday, This Week, Last Week, This Month, Last Month, This Quarter, This Year
- Custom date range
- Period type: Day, Week, Month, Quarter, Year

**API Used:** [php/sales-analytics-api.php](php/sales-analytics-api.php)
- `get_kpis`
- `get_sales_trend`
- `get_time_period_comparison`
- `get_category_sales`
- `get_product_range_analysis`
- `get_quarterly_sales`
- `get_weekday_sales`
- `get_best_sellers`
- `get_heatmap`

---

## 3. Destination 2: Business Reports

**Location:** Manager Dashboard → "Business Reports" tab

**Purpose:** Historical data and exportable reports

**Data Source:** Same database tables (`sales_transactions`, `sales_transaction_items`)

**Features:**

### Report Types:
1. **Daily Sales Summary**
   - Total sales per day
   - Number of transactions
   - Average order value
   - Top-selling products

2. **Weekly Performance**
   - Week-over-week comparison
   - Growth percentages
   - Best performing days

3. **Monthly Reports**
   - Month-to-date performance
   - Monthly trends
   - Category breakdown

4. **Period Comparison**
   - Compare any two time periods
   - Year-over-year analysis
   - Identify growth/decline

### Export Options:
- **PDF Export** - Professional formatted reports
- **Excel Export** - Detailed spreadsheets with raw data

**Filters:**
- Last 7 Days
- Last 30 Days
- Last 90 Days
- This Year
- Custom date range

**API Used:** [php/business-reports-api.php](php/business-reports-api.php) (if exists)

---

## 4. Destination 3: Business Analytics Dashboard

**Location:** Manager Dashboard → Home (Default view)

**Purpose:** Comprehensive overview of all sales information and insights

**Data Source:** Aggregates all data from `sales_transactions` and related tables

**Features:**

### Comprehensive Insights:
1. **Revenue Trends**
   - Historical revenue tracking
   - Growth patterns
   - Seasonal analysis

2. **Product Performance**
   - Which products sell best
   - Product category analysis
   - Revenue per product

3. **Category Analysis**
   - Revenue by category
   - Category trends over time
   - Category growth rates

4. **Peak Hours Analysis**
   - Busiest times of day
   - Staff scheduling insights
   - Inventory planning

5. **Growth Metrics**
   - Period-over-period growth
   - Year-over-year comparison
   - Trend predictions

6. **Visual Charts & Graphs**
   - Interactive visualizations
   - Multiple chart types
   - Exportable data

**API Used:** [php/analytics-api.php](php/analytics-api.php) or uses sales-analytics-api.php endpoints

---

## Database Schema (Sales Data)

### sales_transactions
```sql
CREATE TABLE sales_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reference VARCHAR(50) UNIQUE,
    subtotal DECIMAL(10,2),
    discount_amount DECIMAL(10,2),
    tax_amount DECIMAL(10,2),
    total DECIMAL(10,2),
    payment_method VARCHAR(20),
    amount_tendered DECIMAL(10,2),
    change_amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    occurred_at TIMESTAMP
);
```

### sales_transaction_items
```sql
CREATE TABLE sales_transaction_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_id INT,
    product_id INT,
    product_name VARCHAR(255),
    quantity DECIMAL(10,2),
    unit_price DECIMAL(10,2),
    discount_amount DECIMAL(10,2),
    line_total DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES sales_transactions(id)
);
```

---

## Data Flow Example: Coffee Sale

### Step 1: Cashier Makes Sale
```
Customer orders:
- 2× Cappuccino @ ₱120 each = ₱240
- 1× Latte @ ₱110 = ₱110
Subtotal: ₱350
Discount: ₱0
Tax: ₱0
Total: ₱350
Payment: Cash ₱500
Change: ₱150
```

### Step 2: Saved to Database
```sql
-- sales_transactions
INSERT INTO sales_transactions VALUES (
    reference: 'TXN-20250109-001',
    subtotal: 350.00,
    discount_amount: 0.00,
    tax_amount: 0.00,
    total: 350.00,
    payment_method: 'cash',
    amount_tendered: 500.00,
    change_amount: 150.00,
    occurred_at: '2025-01-09 14:30:00'
);

-- sales_transaction_items
INSERT INTO sales_transaction_items VALUES (
    product_id: 2,
    product_name: 'Cappuccino',
    quantity: 2,
    unit_price: 120.00,
    line_total: 240.00
);

INSERT INTO sales_transaction_items VALUES (
    product_id: 3,
    product_name: 'Latte',
    quantity: 1,
    unit_price: 110.00,
    line_total: 110.00
);
```

### Step 3: Visible in View Sales
- **KPI Cards:**
  - Total Sales increases by ₱350
  - Total Orders increases by 1
  - Quantity Sold increases by 3

- **Sales Trend Chart:**
  - Bar/line shows ₱350 at 2:00 PM (14:00)

- **Category Sales:**
  - "Coffee Classics" category revenue increases

- **Best Sellers Table:**
  - Cappuccino: +₱240 revenue, +2 quantity
  - Latte: +₱110 revenue, +1 quantity

- **Heatmap:**
  - Thursday 14:00 cell shows activity

### Step 4: Visible in Business Reports
- **Daily Summary:** Jan 9, 2025 shows ₱350 sales
- **Weekly Report:** Current week total increases
- **Monthly Report:** January 2025 total increases

### Step 5: Visible in Business Analytics Dashboard
- **Revenue Trends:** Upward trend if sales are growing
- **Product Performance:** Cappuccino and Latte ranked
- **Category Analysis:** Coffee category performance shown
- **Peak Hours:** 14:00 (2 PM) highlighted as active time

---

## Key Benefits of This Data Flow

### 1. Single Source of Truth
- All three dashboards pull from the same database
- Consistent data across all reports
- No data duplication or sync issues

### 2. Real-Time Updates
- Sales appear immediately in View Sales
- No delay or refresh needed
- Live data for decision making

### 3. Historical Tracking
- All sales permanently stored
- Business Reports show trends over time
- Analytics Dashboard provides long-term insights

### 4. Multiple Views of Same Data
- **View Sales** → Operational view (daily management)
- **Business Reports** → Formal reports (monthly reviews)
- **Business Analytics** → Strategic view (business planning)

### 5. Comprehensive Coverage
- **What happened?** → Business Reports
- **Why did it happen?** → Business Analytics
- **What's happening now?** → View Sales

---

## API Endpoints Summary

All sales data flows through these API endpoints:

| Endpoint | Purpose | Used By |
|----------|---------|---------|
| `php/api.php?action=process_sale` | Save cashier sales | Cashier |
| `php/sales-analytics-api.php?action=get_kpis` | KPI metrics | View Sales |
| `php/sales-analytics-api.php?action=get_sales_trend` | Sales over time | View Sales |
| `php/sales-analytics-api.php?action=get_time_period_comparison` | Dynamic period grouping | View Sales |
| `php/sales-analytics-api.php?action=get_category_sales` | Category breakdown | View Sales, Analytics |
| `php/sales-analytics-api.php?action=get_product_range_analysis` | Price range analysis | View Sales |
| `php/sales-analytics-api.php?action=get_quarterly_sales` | Q1-Q4 comparison | View Sales |
| `php/sales-analytics-api.php?action=get_weekday_sales` | Weekday vs weekend | View Sales |
| `php/sales-analytics-api.php?action=get_best_sellers` | Top products | View Sales, Reports |
| `php/sales-analytics-api.php?action=get_heatmap` | Hour × Day visualization | View Sales |

---

## File References

### Frontend (HTML/JS)
- [index.php](index.php) - Main dashboard container
  - Line 356-365: Business Analytics Dashboard
  - Line 1284-1453: View Sales Dashboard
  - Line 1457+: Business Reports

- [js/sales-dashboard.js](js/sales-dashboard.js) - View Sales charts and logic
- [js/business-reports.js](js/business-reports.js) - Reports generation (if exists)
- [js/analytics-dashboard.js](js/analytics-dashboard.js) - Analytics charts (if exists)

### Backend (PHP)
- [php/api.php](php/api.php) - Cashier sales processing
- [php/sales-analytics-api.php](php/sales-analytics-api.php) - Sales data retrieval

### Styling (CSS)
- [css/sales-dashboard.css](css/sales-dashboard.css) - View Sales styling
- [css/business-reports.css](css/business-reports.css) - Reports styling
- [css/analytics-dashboard.css](css/analytics-dashboard.css) - Analytics styling
- [css/unified-layout.css](css/unified-layout.css) - Shared layout system

---

## Summary

**Data Flow Path:**
```
Cashier Sale → Database → View Sales + Business Reports + Business Analytics
```

**Purpose of Each Dashboard:**

1. **View Sales** - Real-time operational analytics
   - What's happening right now
   - Today's performance
   - Quick insights for daily management

2. **Business Reports** - Historical documentation
   - What happened in the past
   - Formal reporting
   - Exportable for stakeholders

3. **Business Analytics** - Strategic insights
   - Long-term trends
   - Business intelligence
   - Decision-making support

All three dashboards show the **same sales data** but present it in different ways for different purposes!
