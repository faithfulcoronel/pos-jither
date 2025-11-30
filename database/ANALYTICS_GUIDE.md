# 📊 Daily Sales Analytics Guide
## Complete Chart & Graph System for Your POS

---

## 🎯 Overview

Your POS system now has **complete daily sales analytics** with 9 views, 7 procedures, and 1 function to power all your charts and graphs!

---

## 📈 Available Charts & Graphs

### **1. Daily Sales Line Chart**
Shows revenue trends over time

**SQL Query:**
```sql
-- Get last 30 days
CALL get_daily_sales_chart(DATE_SUB(CURDATE(), INTERVAL 30 DAY), CURDATE());
```

**Returns:**
- Date
- Revenue
- Transactions
- Average Value

**Use for:** Dashboard main chart, trend analysis

---

### **2. Top Products Pie Chart**
Shows product sales distribution for a specific day

**SQL Query:**
```sql
-- Get top 5 products for today
CALL get_top_products_chart(CURDATE(), 5);
```

**Returns:**
- Product Name (label)
- Revenue (value)
- Percentage

**Use for:** Product performance, menu optimization

---

### **3. Hourly Sales Bar Chart**
Shows peak hours and sales distribution throughout the day

**SQL Query:**
```sql
-- Get hourly breakdown for today
CALL get_hourly_sales_chart(CURDATE());
```

**Returns:**
- Hour (0-23)
- Transaction Count
- Revenue
- Average Transaction Value

**Use for:** Staffing decisions, peak hour identification

---

### **4. Category Sales Comparison**
Compare sales across product categories

**SQL Query:**
```sql
-- Compare categories for last 7 days
CALL get_category_sales_chart(DATE_SUB(CURDATE(), INTERVAL 7 DAY), CURDATE());
```

**Returns:**
- Category Name
- Total Revenue
- Items Sold
- Average Price

**Use for:** Category performance, inventory planning

---

### **5. Product Trends Multi-Line Chart**
Track multiple products over time

**SQL Query:**
```sql
-- Track top 5 products over 14 days
CALL get_product_trends_chart(DATE_SUB(CURDATE(), INTERVAL 14 DAY), CURDATE(), 5);
```

**Returns:**
- Date
- Product Name
- Revenue
- Quantity Sold

**Use for:** Product comparison, seasonal trends

---

### **6. Sales Comparison Cards**
Compare today vs yesterday, this week vs last week

**SQL Query:**
```sql
CALL get_sales_comparison();
```

**Returns:**
- Today, Yesterday, This Week, Last Week, This Month, Last Month
- Revenue, Transactions, Average Value for each

**Use for:** KPI cards, growth indicators

---

### **7. Dashboard Summary KPIs**
Complete dashboard overview with all key metrics

**SQL Query:**
```sql
CALL get_dashboard_summary();
```

**Returns:**
- Today's revenue, transactions, avg value
- Yesterday's comparison
- Week/Month totals
- Active employees, clocked-in staff
- Low stock alerts
- Total products

**Use for:** Main dashboard, manager overview

---

## 📊 Available Views (Direct Queries)

### **v_daily_sales_summary**
Complete daily sales data
```sql
SELECT * FROM v_daily_sales_summary
WHERE sale_date BETWEEN '2025-01-01' AND '2025-01-31'
ORDER BY sale_date ASC;
```

### **v_top_products_daily**
Best-selling products by day
```sql
SELECT * FROM v_top_products_daily
WHERE sale_date = CURDATE()
ORDER BY revenue DESC
LIMIT 10;
```

### **v_hourly_sales_distribution**
Sales by hour
```sql
SELECT * FROM v_hourly_sales_distribution
WHERE sale_date = CURDATE()
ORDER BY sale_hour ASC;
```

### **v_daily_category_sales**
Category performance
```sql
SELECT
    category_name,
    SUM(category_revenue) AS total_revenue,
    SUM(items_sold) AS total_items
FROM v_daily_category_sales
WHERE sale_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
GROUP BY category_name
ORDER BY total_revenue DESC;
```

### **v_weekly_sales_comparison**
Weekly summaries
```sql
SELECT * FROM v_weekly_sales_comparison
ORDER BY week_number DESC
LIMIT 12;
```

### **v_monthly_sales_comparison**
Monthly summaries
```sql
SELECT * FROM v_monthly_sales_comparison
ORDER BY month DESC
LIMIT 12;
```

### **v_sales_trends**
7-day and 30-day rolling averages
```sql
SELECT * FROM v_sales_trends
ORDER BY sale_date DESC
LIMIT 30;
```

### **v_daily_payment_methods**
Payment method distribution
```sql
SELECT * FROM v_daily_payment_methods
WHERE sale_date = CURDATE();
```

### **v_daily_product_sales**
Detailed product sales with profit
```sql
SELECT
    product_name,
    SUM(total_quantity_sold) AS qty,
    SUM(total_revenue) AS revenue,
    SUM(total_profit) AS profit
FROM v_daily_product_sales
WHERE sale_date = CURDATE()
GROUP BY product_name
ORDER BY revenue DESC;
```

---

## 🛠️ How to Implement in Your App

### **Example 1: Dashboard Line Chart (Chart.js)**

**PHP Code:**
```php
<?php
// Get data for chart
$stmt = $pdo->query("CALL get_daily_sales_chart(DATE_SUB(CURDATE(), INTERVAL 30 DAY), CURDATE())");
$salesData = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Prepare for JavaScript
$dates = [];
$revenues = [];
foreach ($salesData as $row) {
    $dates[] = $row['date'];
    $revenues[] = $row['revenue'];
}
?>

<script>
const ctx = document.getElementById('salesChart').getContext('2d');
const chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: <?php echo json_encode($dates); ?>,
        datasets: [{
            label: 'Daily Revenue',
            data: <?php echo json_encode($revenues); ?>,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }]
    }
});
</script>
```

---

### **Example 2: Top Products Pie Chart**

**PHP Code:**
```php
<?php
$stmt = $pdo->query("CALL get_top_products_chart(CURDATE(), 5)");
$products = $stmt->fetchAll(PDO::FETCH_ASSOC);

$labels = [];
$values = [];
foreach ($products as $row) {
    $labels[] = $row['label'];
    $values[] = $row['value'];
}
?>

<script>
const pieCtx = document.getElementById('productsChart').getContext('2d');
const pieChart = new Chart(pieCtx, {
    type: 'pie',
    data: {
        labels: <?php echo json_encode($labels); ?>,
        datasets: [{
            data: <?php echo json_encode($values); ?>,
            backgroundColor: [
                '#FF6384',
                '#36A2EB',
                '#FFCE56',
                '#4BC0C0',
                '#9966FF'
            ]
        }]
    }
});
</script>
```

---

### **Example 3: Hourly Bar Chart**

**PHP Code:**
```php
<?php
$stmt = $pdo->query("CALL get_hourly_sales_chart(CURDATE())");
$hourlyData = $stmt->fetchAll(PDO::FETCH_ASSOC);

$hours = [];
$transactions = [];
foreach ($hourlyData as $row) {
    $hours[] = $row['hour'] . ':00';
    $transactions[] = $row['transactions'];
}
?>

<script>
const barCtx = document.getElementById('hourlyChart').getContext('2d');
const barChart = new Chart(barCtx, {
    type: 'bar',
    data: {
        labels: <?php echo json_encode($hours); ?>,
        datasets: [{
            label: 'Transactions per Hour',
            data: <?php echo json_encode($transactions); ?>,
            backgroundColor: 'rgba(54, 162, 235, 0.5)'
        }]
    }
});
</script>
```

---

### **Example 4: KPI Cards**

**PHP Code:**
```php
<?php
$stmt = $pdo->query("CALL get_dashboard_summary()");
$summary = $stmt->fetch(PDO::FETCH_ASSOC);

$todayRevenue = $summary['today_revenue'];
$yesterdayRevenue = $summary['yesterday_revenue'];

// Calculate growth
$stmt = $pdo->query("SELECT calculate_growth_percentage($todayRevenue, $yesterdayRevenue) AS growth");
$growth = $stmt->fetch(PDO::FETCH_ASSOC)['growth'];
?>

<div class="kpi-card">
    <h3>Today's Revenue</h3>
    <p class="revenue">₱<?php echo number_format($todayRevenue, 2); ?></p>
    <p class="growth <?php echo $growth >= 0 ? 'positive' : 'negative'; ?>">
        <?php echo number_format($growth, 1); ?>% vs Yesterday
    </p>
</div>
```

---

## 📅 Sample Usage Scenarios

### **Manager Dashboard:**
```sql
-- Get today's summary
CALL get_dashboard_summary();

-- Get today's top products
CALL get_top_products_chart(CURDATE(), 10);

-- Get hourly performance
CALL get_hourly_sales_chart(CURDATE());
```

### **Weekly Report:**
```sql
-- Last 7 days trend
CALL get_daily_sales_chart(DATE_SUB(CURDATE(), INTERVAL 7 DAY), CURDATE());

-- Category comparison
CALL get_category_sales_chart(DATE_SUB(CURDATE(), INTERVAL 7 DAY), CURDATE());

-- Product trends
CALL get_product_trends_chart(DATE_SUB(CURDATE(), INTERVAL 7 DAY), CURDATE(), 5);
```

### **Monthly Analysis:**
```sql
-- Monthly summary
SELECT * FROM v_monthly_sales_comparison
WHERE month = DATE_FORMAT(CURDATE(), '%Y-%m');

-- Weekly breakdown
SELECT * FROM v_weekly_sales_comparison
WHERE week_start >= DATE_SUB(CURDATE(), INTERVAL 30 DAY);
```

---

## 🚀 Setup Instructions

### **Step 1: Run the Analytics SQL**
```bash
mysql -u root -p pos_jither < database/ADD_DAILY_ANALYTICS.sql
```

### **Step 2: Verify Views Created**
```sql
SHOW FULL TABLES WHERE Table_type = 'VIEW';
```

Should show 9 views:
- v_daily_sales_summary
- v_daily_product_sales
- v_hourly_sales_distribution
- v_top_products_daily
- v_daily_category_sales
- v_daily_payment_methods
- v_weekly_sales_comparison
- v_monthly_sales_comparison
- v_sales_trends

### **Step 3: Verify Procedures Created**
```sql
SHOW PROCEDURE STATUS WHERE Db = 'pos_jither';
```

Should show 7 procedures:
- get_daily_sales_chart
- get_top_products_chart
- get_hourly_sales_chart
- get_category_sales_chart
- get_product_trends_chart
- get_sales_comparison
- get_dashboard_summary

### **Step 4: Test the Data**
```sql
-- Test dashboard
CALL get_dashboard_summary();

-- Test daily sales
CALL get_daily_sales_chart(DATE_SUB(CURDATE(), INTERVAL 7 DAY), CURDATE());
```

---

## 📊 Chart Types Recommended

| Chart Type | Best For | SQL Procedure |
|------------|----------|---------------|
| **Line Chart** | Sales trends over time | `get_daily_sales_chart()` |
| **Pie Chart** | Product distribution | `get_top_products_chart()` |
| **Bar Chart** | Hourly comparison | `get_hourly_sales_chart()` |
| **Horizontal Bar** | Category comparison | `get_category_sales_chart()` |
| **Multi-Line** | Product trends | `get_product_trends_chart()` |
| **KPI Cards** | Summary metrics | `get_dashboard_summary()` |
| **Donut Chart** | Payment methods | `v_daily_payment_methods` |

---

## 💡 Growth Calculation

Use the built-in function:
```sql
SELECT calculate_growth_percentage(1500, 1200) AS growth;
-- Returns: 25.00 (25% growth)

SELECT calculate_growth_percentage(1000, 1200) AS growth;
-- Returns: -16.67 (16.67% decline)
```

---

## 🎨 Frontend Integration

Your analytics are ready for:
- ✅ Chart.js
- ✅ ApexCharts
- ✅ Google Charts
- ✅ D3.js
- ✅ Any JavaScript charting library

All data is returned in JSON-friendly format!

---

## 📝 Sample Data Included

The system includes sample sales for the last 7 days to demonstrate charts immediately!

---

*All charts and graphs are now functional based on daily sales data!* 📊
