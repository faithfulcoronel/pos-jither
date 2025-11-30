# 🚀 Quick Start - Analytics System

## ⚡ 2-Step Setup

### **Step 1: Create Complete Database**
```bash
mysql -u root -p < database/COMPLETE_DATABASE.sql
```

### **Step 2: Add Analytics System**
```bash
mysql -u root -p pos_jither < database/ADD_DAILY_ANALYTICS.sql
```

✅ **Done!** Your analytics system is ready!

---

## 📊 Quick Test - See Your Charts Data

### **Test 1: Dashboard Summary**
```sql
USE pos_jither;
CALL get_dashboard_summary();
```

**Returns:** Today's revenue, transactions, employee count, etc.

---

### **Test 2: Daily Sales Chart (Last 7 Days)**
```sql
CALL get_daily_sales_chart(DATE_SUB(CURDATE(), INTERVAL 7 DAY), CURDATE());
```

**Returns:** Date, Revenue, Transactions (for line chart)

---

### **Test 3: Top Products Today**
```sql
CALL get_top_products_chart(CURDATE(), 5);
```

**Returns:** Product name, Revenue, Percentage (for pie chart)

---

### **Test 4: Hourly Sales**
```sql
CALL get_hourly_sales_chart(CURDATE());
```

**Returns:** Hour, Transactions, Revenue (for bar chart)

---

## 📈 Most Common Queries

### **Today vs Yesterday:**
```sql
SELECT * FROM v_daily_sales_summary
WHERE sale_date IN (CURDATE(), DATE_SUB(CURDATE(), INTERVAL 1 DAY))
ORDER BY sale_date DESC;
```

### **This Week's Sales:**
```sql
SELECT * FROM v_weekly_sales_comparison
WHERE week_number = YEARWEEK(CURDATE(), 1);
```

### **Top 5 Products All Time:**
```sql
SELECT
    product_name,
    SUM(total_revenue) AS total_revenue,
    SUM(total_quantity_sold) AS total_sold
FROM v_daily_product_sales
GROUP BY product_name
ORDER BY total_revenue DESC
LIMIT 5;
```

### **Sales by Category:**
```sql
SELECT
    category_name,
    SUM(category_revenue) AS revenue,
    SUM(items_sold) AS items
FROM v_daily_category_sales
WHERE sale_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY category_name
ORDER BY revenue DESC;
```

---

## 🎯 What You Can Build

With these analytics, you can create:

✅ **Dashboard with KPIs** (Revenue, Transactions, Growth %)
✅ **Sales Trend Line Chart** (Daily/Weekly/Monthly)
✅ **Product Performance Pie Chart**
✅ **Hourly Sales Bar Chart** (Peak hours)
✅ **Category Comparison**
✅ **Employee Performance**
✅ **Inventory Status**
✅ **Payment Method Distribution**

---

## 📊 Sample Data Included

The system includes sales for the **last 7 days** so you can see charts immediately!

- 24 transactions
- 6 different products
- 3 payment methods (cash, card, gcash)
- Multiple hours throughout the day

---

## 🔥 Pro Tips

1. **Run analytics on yesterday's data** (today might be incomplete):
   ```sql
   CALL get_top_products_chart(DATE_SUB(CURDATE(), INTERVAL 1 DAY), 10);
   ```

2. **Compare this month vs last month:**
   ```sql
   SELECT * FROM v_monthly_sales_comparison LIMIT 2;
   ```

3. **Find peak hours:**
   ```sql
   SELECT sale_hour, SUM(hourly_revenue) AS revenue
   FROM v_hourly_sales_distribution
   GROUP BY sale_hour
   ORDER BY revenue DESC;
   ```

---

**Your analytics system is fully functional!** 🎉

See [ANALYTICS_GUIDE.md](ANALYTICS_GUIDE.md) for complete documentation.
