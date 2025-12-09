# Sales Dashboard Charts Troubleshooting Guide

## Problem: Charts Showing Empty/Blank

If you're seeing empty chart containers like in your screenshot, follow these steps:

## Step 1: Check if Database Has Sales Data

### Option A: Run the Test Script
1. Open your browser and go to: `http://localhost/pos-jither-main/test-sales-api.php`
2. This will show you:
   - Database connection status
   - Number of sales transactions
   - Sample data from database
   - API endpoint responses
   - Recommended solutions

### Option B: Check Manually in phpMyAdmin
1. Open phpMyAdmin
2. Select `pos_jither` database
3. Click on `sales_transactions` table
4. Check if there are any rows

**If there are NO rows:** This is your problem! The charts are empty because there's no data.

## Step 2: Fix - Add Sample Data to Database

### Method 1: Import Complete Database (Recommended)
1. Open phpMyAdmin
2. Select `pos_jither` database (or create it if it doesn't exist)
3. Click "Import" tab
4. Click "Choose File"
5. Select: `c:\Download\htdocs\pos-jither-main\database\COMPLETE_DATABASE.sql`
6. Click "Go" at the bottom
7. Wait for success message

This will create/recreate all tables with sample data including:
- 6 sample sales transactions
- 6 products (Espresso, Cappuccino, Latte, Mocha, Americano, Caramel Macchiato)
- Product categories
- Sample employees

### Method 2: Make Real Sales
1. Go to Cashier Dashboard
2. Add products to cart
3. Complete some sales transactions
4. Then go back to Manager Dashboard > View Sales

## Step 3: Verify Charts Are Loading

1. Open Manager Dashboard
2. Click "View Sales"
3. Open Browser Console (Press F12)
4. Look for:
   ```
   Sales data loaded: {kpis: {...}, trend: [...], categories: [...]}
   ```

5. Check if you see any errors in red

### Common Errors and Solutions:

**Error: "Failed to fetch"**
- **Cause:** API file not found or PHP error
- **Fix:** Check `php/sales-analytics-api.php` exists

**Error: "Chart is not defined"**
- **Cause:** Chart.js library not loaded
- **Fix:** Check internet connection (loads from CDN)

**Error: "Cannot read property 'map' of undefined"**
- **Cause:** API returning unexpected data structure
- **Fix:** Check browser Network tab, look at API responses

## Step 4: Check API Responses

1. Press F12 to open Developer Tools
2. Go to "Network" tab
3. Reload the View Sales page
4. Look for requests to `sales-analytics-api.php`
5. Click on each one and check "Response" tab

You should see JSON like:
```json
{
  "success": true,
  "data": [...]
}
```

**If you see `"data": []`** → No data in database for selected date range

## Step 5: Verify Date Range

The dashboard filters by date range. Make sure:
1. Your sample data dates match the selected period
2. Try selecting "This Month" or "This Year"
3. Check the sample data dates in COMPLETE_DATABASE.sql (set to 2025-01-20)

If today is not in January 2025, you may need to update the sample data dates:

```sql
UPDATE sales_transactions
SET occurred_at = CURDATE()
WHERE id BETWEEN 1 AND 5;
```

## Chart Types Implemented

### 1. Sales Trends Over Time (Line Chart)
- **Shows:** Sales revenue + Order count over time
- **Data Source:** `get_time_period_comparison` API
- **Periods:** Hourly, Daily, Weekly, Monthly

### 2. Sales by Product Category (Donut Chart)
- **Shows:** Revenue distribution by category
- **Data Source:** `get_category_sales` API
- **Categories:** Coffee Classics, Signature Espresso, etc.

### 3. Weekday vs Weekend (Bar Chart)
- **Shows:** Sales comparison
- **Data Source:** `get_weekday_sales` API

### 4. Product Range Analysis (Donut Chart)
- **Shows:** Sales by price range
- **Data Source:** `get_product_range_analysis` API
- **Ranges:** Budget, Economy, Standard, Premium, Luxury

### 5. Quarterly Sales (Bar Chart)
- **Shows:** Q1, Q2, Q3, Q4 performance
- **Data Source:** `get_quarterly_sales` API

### 6. Top 10 Best Sellers (Table)
- **Shows:** Top products by revenue
- **Data Source:** `get_best_sellers` API

### 7. Sales Heatmap by Day & Hour
- **Shows:** Peak hours visualization
- **Data Source:** `get_heatmap` API

## Quick Fix Checklist

- [ ] Database connection working
- [ ] `sales_transactions` table has data
- [ ] Sample data dates are recent (within last month)
- [ ] Browser console shows "Sales data loaded"
- [ ] No red errors in console
- [ ] Chart.js library loaded (check Network tab)
- [ ] API endpoints returning `"success": true`
- [ ] Selected date range includes your data

## Still Not Working?

Run this SQL to check your data:

```sql
-- Check transactions
SELECT COUNT(*) as total_transactions FROM sales_transactions;

-- Check date range
SELECT
    MIN(occurred_at) as earliest_sale,
    MAX(occurred_at) as latest_sale,
    COUNT(*) as count
FROM sales_transactions;

-- Check categories
SELECT
    pc.name,
    COUNT(DISTINCT p.id) as products
FROM products p
LEFT JOIN product_categories pc ON p.category_id = pc.id
GROUP BY pc.name;

-- Check today's sales
SELECT COUNT(*) as todays_sales
FROM sales_transactions
WHERE DATE(occurred_at) = CURDATE();
```

## Contact

If issues persist:
1. Check `test-sales-api.php` output
2. Check browser console errors
3. Verify PHP version (need PHP 7.4+)
4. Check MySQL version (need 5.7+)
