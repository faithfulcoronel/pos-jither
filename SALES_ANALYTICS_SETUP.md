# Sales Analytics Dashboard - Database Integration

## Overview

The Sales Analysis Dashboard has been updated to use **real sales data from your database** instead of sample/mock data.

## What Was Changed

### 1. New API Endpoint
Created [php/sales-analytics-api.php](php/sales-analytics-api.php) that provides the following endpoints:

- **`get_kpis`** - Total sales, orders, quantity sold, average order value with period-over-period comparison
- **`get_sales_trend`** - Sales trends over time (hourly, daily, monthly based on selected period)
- **`get_category_sales`** - Sales breakdown by product category
- **`get_quarterly_sales`** - Quarterly performance data
- **`get_weekday_sales`** - Sales by day of week
- **`get_best_sellers`** - Top 10 best-selling products
- **`get_heatmap`** - Sales heatmap by hour and day of week

### 2. Updated JavaScript
Modified [js/sales-dashboard.js](js/sales-dashboard.js) to:

- Fetch real data from the API instead of generating sample data
- Update all charts to use the actual database structure
- Handle empty data scenarios gracefully
- Support all filter options (daily, weekly, monthly, quarterly, yearly)

## Features

### KPI Cards
- **Total Sales** - Sum of all transactions with percentage change
- **Total Orders** - Count of transactions with percentage change
- **Quantity Sold** - Total items sold with percentage change
- **Average Order Value** - Average transaction amount

### Charts & Visualizations

1. **Sales Trends Over Time**
   - Line chart showing sales over the selected period
   - Adapts to daily (hourly), weekly (daily), monthly (daily), quarterly (monthly), yearly (monthly)

2. **Quarterly Sales**
   - Bar chart showing Q1-Q4 performance for selected year

3. **Sales by Product Category**
   - Donut chart showing revenue distribution by category
   - Pulls from the `products` table category field

4. **Best Sellers Table**
   - Top 10 products ranked by revenue
   - Shows product name, category, quantity sold, and revenue
   - Visual bar chart for easy comparison

5. **Sales Heatmap**
   - Visualizes sales intensity by day of week and hour
   - Helps identify peak business hours

## Filters

- **Period**: Daily, Weekly, Monthly, Quarterly, Yearly
- **Year**: 2023, 2024, 2025
- **Month**: January - December
- **Quarter**: Q1 - Q4

The dashboard automatically refreshes when filters are changed.

## Data Sources

The API queries these database tables:

- `sales_transactions` - Main transaction data (total, date, cashier, etc.)
- `sales_transaction_items` - Individual line items (product, quantity, price)
- `products` - Product information (name, category)

## How It Works

1. When you navigate to **Sales Analysis** in the Manager Dashboard:
   - JavaScript calls the PHP API with current filter settings
   - API queries the database and returns JSON data
   - Charts and tables are rendered with real data

2. **Period Comparison**:
   - Each KPI shows percentage change vs. previous period
   - Daily compares to yesterday
   - Weekly compares to last week
   - Monthly compares to last month
   - Quarterly compares to previous quarter
   - Yearly compares to previous year

## Empty Data Handling

If there's no sales data in the database:
- KPIs will show ₱0 with 0% change
- Charts will be empty
- Best sellers table will show "No sales data available"
- Heatmap will be blank

## Performance

- All API calls are made in **parallel** for fast loading
- Uses indexed database queries for optimal performance
- Leverages MySQL aggregate functions (SUM, COUNT, AVG)
- Caches Chart.js instances to avoid memory leaks

## Testing

To test with sample data:
1. Make some sales transactions through the cashier interface
2. Navigate to Manager Dashboard → Sales Analysis
3. Adjust filters to see different views of your data

## Technical Details

**Date Range Logic:**
- Daily: Current day only
- Weekly: Monday - Sunday of current week
- Monthly: Full month of selected month/year
- Quarterly: 3-month period for selected quarter/year
- Yearly: Full year

**Chart Library:** Chart.js v4.x
**API Response Format:** JSON
**Database:** MySQL/MariaDB with PDO
