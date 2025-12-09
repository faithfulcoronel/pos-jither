# Cashier Dashboard → View Sales Integration Guide

## How It Works

Every sale made through the **Cashier Dashboard** is automatically saved to the database and immediately becomes available in the **Manager Dashboard > View Sales** section with beautiful charts and analytics.

## Data Flow

```
Cashier Makes Sale
      ↓
Sales saved to sales_transactions & sales_transaction_items tables
      ↓
View Sales Dashboard queries this data
      ↓
Charts automatically display sales analytics
```

## What Was Fixed

### ✅ Cashier API Updates ([php/api.php](c:\Download\htdocs\pos-jither-main\php\api.php))

**Before:** Cashier only saved basic data (reference, total)
**After:** Now saves complete transaction information:

- ✅ `subtotal` - Total before discounts/tax
- ✅ `discount_amount` - Total discounts applied
- ✅ `tax_amount` - Tax amount
- ✅ `total` - Final total
- ✅ `payment_method` - cash, card, etc.
- ✅ `amount_tendered` - Amount customer paid
- ✅ `change_amount` - Change returned
- ✅ `occurred_at` - When sale happened

**For each item:**
- ✅ `product_id` - Which product
- ✅ `product_name` - Product name
- ✅ `quantity` - How many sold
- ✅ `unit_price` - Price per item
- ✅ `discount_amount` - Discount on this item
- ✅ `line_total` - Total for this line (qty × price - discount)

### ✅ View Sales Dashboard Features

The dashboard now shows real-time analytics from cashier sales:

1. **📈 Sales Trends Over Time** (Line Chart with dual axis)
   - Shows sales revenue AND order count
   - Adapts to time period (hourly, daily, weekly, monthly, quarterly, yearly)

2. **🍩 Sales by Product Category** (Donut Chart)
   - Revenue distribution across categories (Coffee, Pastries, etc.)
   - Shows percentages and amounts

3. **📊 Weekday vs Weekend** (Bar Chart)
   - Compares weekday vs weekend performance

4. **🎯 Product Range Analysis** (Donut Chart)
   - Groups products by price range:
     - Budget (₱0-₱49)
     - Economy (₱50-₱99)
     - Standard (₱100-₱149)
     - Premium (₱150-₱199)
     - Luxury (₱200+)

5. **📊 Quarterly Sales** (Bar Chart)
   - Q1, Q2, Q3, Q4 performance

6. **🏆 Top 10 Best Sellers** (Table with bars)
   - Shows top products by revenue
   - Includes category, quantity, and revenue

7. **🔥 Sales Heatmap** (Day × Hour)
   - Shows peak selling hours
   - Visualizes busy times

## Testing the Integration

### Step 1: Fix Existing Sales (If Any)

If you have old sales from before this update, run this in phpMyAdmin:

```sql
SOURCE c:\Download\htdocs\pos-jither-main\database\fix_existing_sales.sql
```

This will update old records to have the proper format.

### Step 2: Make a Test Sale

1. Open **Cashier Dashboard**
2. Add some products to cart (e.g., 2× Cappuccino, 1× Latte)
3. Click "Complete Sale"
4. Process payment

### Step 3: View the Results

1. Go to **Manager Dashboard**
2. Click **"View Sales"**
3. Make sure date range includes today:
   - Try "Today" filter
   - Or "This Week"
   - Or "This Month"

### Step 4: Verify Charts Display

You should see:
- ✅ KPI cards showing: Total Sales, Total Orders, Quantity Sold, Avg Order Value
- ✅ Sales Trends chart with your sale
- ✅ Category chart showing the categories of products you sold
- ✅ Product Range chart showing which price range generated revenue
- ✅ Best Sellers table with the products you sold
- ✅ All charts updating in real-time

## Time Period Filters

### Single Day View
- **Filter:** Select today's date + "Single Day"
- **Chart Shows:** Hour-by-hour sales (0:00, 1:00, 2:00...)
- **Use Case:** "What time are we busiest today?"

### Week View
- **Filter:** Select this week + "Week"
- **Chart Shows:** Daily sales for 7 days
- **Use Case:** "Which day of the week sells the most?"

### Month View (Default)
- **Filter:** Select current month + "Month"
- **Chart Shows:** Daily sales for the entire month
- **Use Case:** "Track month-to-date performance"

### Quarter View
- **Filter:** Select quarter + "Quarter"
- **Chart Shows:** Weekly breakdown for 13 weeks
- **Use Case:** "Quarterly business review"

### Year View
- **Filter:** Select year + "Year"
- **Chart Shows:** Monthly breakdown for 12 months
- **Use Case:** "Annual performance analysis"

## Quick Filters

Click these for instant date selection:
- **Today** - See today's sales by hour
- **Yesterday** - Compare to previous day
- **This Week** - Week-to-date performance
- **Last Week** - Compare to last week
- **This Month** - Month-to-date performance (default)
- **Last Month** - Previous month comparison
- **This Quarter** - Quarter-to-date
- **This Year** - Year-to-date

## Data That Powers the Charts

All charts pull from these database tables:

```sql
-- Main transaction table
sales_transactions (
    id, reference, subtotal, discount_amount, tax_amount, total,
    payment_method, amount_tendered, change_amount, occurred_at
)

-- Items in each transaction
sales_transaction_items (
    id, transaction_id, product_id, product_name, quantity,
    unit_price, discount_amount, line_total
)

-- Product details
products (
    id, category_id, name, price, cost_price
)

-- Product categories
product_categories (
    id, name, description
)
```

## API Endpoints

The View Sales dashboard calls these endpoints:

1. `get_kpis` - Top summary cards
2. `get_sales_trend` - Legacy sales trend
3. `get_time_period_comparison` - New smart time-period breakdown
4. `get_category_sales` - Sales by category
5. `get_product_range_analysis` - Sales by price range
6. `get_quarterly_sales` - Q1-Q4 breakdown
7. `get_weekday_sales` - Weekday vs weekend
8. `get_best_sellers` - Top 10 products
9. `get_heatmap` - Hour × day visualization

All endpoints accept:
- `start_date` - Filter start (YYYY-MM-DD)
- `end_date` - Filter end (YYYY-MM-DD)
- `date_range` - Period type (day/week/month/quarter/year)

## Troubleshooting

### Charts are empty
- **Check:** Did you select the correct date range?
- **Fix:** Try "This Month" or "This Year" to see all data

### Categories not showing
- **Check:** Do your products have categories assigned?
- **Fix:** In Product Management, assign each product to a category

### Best sellers table empty
- **Check:** Have any sales been made?
- **Fix:** Make a test sale through cashier

### Charts not updating
- **Check:** Browser console for errors (F12)
- **Fix:** Hard refresh page (Ctrl+Shift+R)

### Wrong date format
- **Check:** Database date format
- **Fix:** Dates should be `YYYY-MM-DD HH:MM:SS` format

## Real-Time Updates

- ✅ Sales appear in View Sales **immediately** after cashier completes transaction
- ✅ No need to refresh - just switch to View Sales page
- ✅ All charts recalculate automatically based on selected date range
- ✅ KPIs show comparison vs previous period

## Performance Tips

1. Use appropriate date ranges:
   - **Today:** Fast, hourly breakdown
   - **This Week:** Fast, daily breakdown
   - **This Month:** Medium, daily breakdown
   - **This Year:** Slower, monthly breakdown

2. Large datasets (1000+ transactions):
   - Charts may take 2-3 seconds to load
   - This is normal
   - Consider using quarter/year view for overview

3. Best sellers limited to top 10:
   - Shows highest revenue products
   - Refreshes with each date range change

## Business Insights You Can Get

### Daily Operations
- "What time do we sell the most coffee?"
- "How many transactions did we have today?"
- "What's our average order value?"

### Weekly Planning
- "Which day is busiest?"
- "Weekend vs weekday performance?"
- "Best sellers this week?"

### Monthly Analysis
- "Are we hitting monthly targets?"
- "Which category generates most revenue?"
- "What's the trend - growing or declining?"

### Quarterly Reviews
- "Q1 vs Q2 vs Q3 vs Q4 performance?"
- "Which weeks were strongest?"
- "Seasonal patterns?"

### Annual Planning
- "Year-over-year growth?"
- "Which months are strongest?"
- "Product mix optimization?"

## Success!

If you can make a sale in Cashier Dashboard and see it appear in View Sales with charts, **everything is working perfectly!** 🎉

The system is now fully integrated:
- Cashier → Database → View Sales Analytics
- Real-time data flow
- Beautiful visualizations
- Actionable business insights
