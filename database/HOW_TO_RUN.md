# 🚀 How to Run Your Complete Database

## **COMPLETE_DATABASE.sql** - Everything You Need!

This single file creates your entire POS system database.

---

## ⚡ Quick Start (ONE COMMAND!)

Open Command Prompt and run:

```bash
cd c:\Download\htdocs\pos-jither-main
mysql -u root -p < database/COMPLETE_DATABASE.sql
```

**Enter your MySQL password when prompted.**

✅ **Done!** Your complete database is ready to use!

---

## 📊 What Gets Created

### **10 Core Tables:**
1. **product_categories** - Coffee, Pastries, etc.
2. **products** - Menu items with prices & costs
3. **inventory_items** - Stock with cost tracking
4. **product_recipes** - Ingredients per product
5. **staff_accounts** - Employee management
6. **users** - Login accounts
7. **employees** - Time keeping records
8. **attendance_records** - Clock in/out tracking
9. **sales_transactions** - Sales summary
10. **sales_transaction_items** - Sales line items

### **3 Reporting Views:**
- **product_profitability** - Profit margins
- **product_recipe_details** - Recipe costs
- **v_attendance_summary** - Employee attendance

### **4 Smart Triggers:**
- Auto-calculate hours worked
- Auto-update product costs from recipes
- Lock attendance after time out

### **2 Stored Procedures:**
- `calculate_product_cost()` - Recalculate costs
- `deduct_inventory_for_sale()` - Auto-deduct stock

### **Sample Data Included:**
- ✅ 6 Products (Espresso, Cappuccino, Latte, Mocha, Americano, Caramel Macchiato)
- ✅ 9 Inventory Items with costs
- ✅ Complete recipes for all products
- ✅ 4 Staff members (Jowen, Elsa, Maria, Juan)
- ✅ 2 Login accounts (manager, cashier)
- ✅ Sample sales data

---

## 🎯 Login Credentials

**Manager Account:**
- Username: `manager`
- Password: `demo123`

**Cashier Account:**
- Username: `cashier`
- Password: `demo123`

---

## 👥 Staff Employee Numbers

Use these to clock in/out at Time Keeping terminal:

- **EMP001** - Jowen (Manager)
- **EMP002** - Elsa (Cashier)
- **EMP003** - Maria Santos (Barista)
- **EMP004** - Juan Dela Cruz (Cashier)

---

## ✅ Verify Installation

After running the SQL file, check if everything works:

```sql
-- Connect to database
mysql -u root -p

-- Use the database
USE pos_jither;

-- Check tables (should show 10)
SHOW TABLES;

-- View products
SELECT * FROM products;

-- View profit margins
SELECT * FROM product_profitability;

-- View staff
SELECT * FROM staff_accounts;

-- View employees
SELECT * FROM employees;

-- Exit
exit;
```

---

## 💡 Database Features

### **Cost Tracking:**
- Each product knows its cost and profit margin
- Costs auto-calculate from recipes
- View profitability: `SELECT * FROM product_profitability;`

### **Recipe System:**
- Products linked to ingredients
- Auto-deduct inventory on sale
- Track ingredient costs

### **Time Keeping:**
- Employee clock in/out
- Auto-calculate hours worked
- Lock prevents duplicate time-ins
- Status: present, half_day, late, absent

### **Sales Tracking:**
- Complete transaction history
- Product sales analysis
- Revenue reports

---

## 🔄 If You Need to Reset

To completely wipe and recreate:

```bash
mysql -u root -p < database/COMPLETE_DATABASE.sql
```

The script automatically drops and recreates everything!

---

## 📱 What Works After Setup

### **POS Features:**
- ✅ Product catalog with 6 items
- ✅ Inventory management
- ✅ Sales transactions
- ✅ Receipt printing
- ✅ Cash calculations

### **Staff Management:**
- ✅ Add/edit/delete staff
- ✅ Employee number system (EMP001, EMP002, etc.)
- ✅ Role assignment

### **Time Keeping:**
- ✅ Employee clock in/out
- ✅ Hours calculation
- ✅ Daily lock mechanism
- ✅ Attendance reports

### **Reports & Analytics:**
- ✅ Sales by product
- ✅ Profit margins
- ✅ Inventory levels
- ✅ Staff attendance
- ✅ Cost analysis

---

## 🛠️ Troubleshooting

### Error: "Access denied"
```bash
# Check your MySQL username and password
mysql -u root -p
```

### Error: "Database exists"
**It's OK!** The script drops and recreates it.

### Check database exists:
```sql
SHOW DATABASES LIKE 'pos_jither';
```

### Check table count:
```sql
USE pos_jither;
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'pos_jither';
-- Should return: 10
```

---

## 📊 Sample Profit Margins

After setup, you'll see:

| Product | Cost | Price | Profit | Margin |
|---------|------|-------|--------|--------|
| Espresso | ₱14.00 | ₱80.00 | ₱66.00 | 82.5% |
| Cappuccino | ₱26.00 | ₱120.00 | ₱94.00 | 78.3% |
| Latte | ₱30.00 | ₱110.00 | ₱80.00 | 72.7% |
| Mocha | ₱35.00 | ₱130.00 | ₱95.00 | 73.1% |
| Americano | ₱15.00 | ₱90.00 | ₱75.00 | 83.3% |
| Caramel Macchiato | ₱38.00 | ₱140.00 | ₱102.00 | 72.9% |

---

## 🎉 You're All Set!

Your complete POS database is ready!

**Next Steps:**
1. Open your browser: `http://localhost/pos-jither-main`
2. Login as manager (username: manager, password: demo123)
3. Start using your POS system!

---

*Database: pos_jither*
*Compatible with: MySQL 5.7+, MariaDB 10.2+*
*No errors, no transactions issues, ready to run!*
