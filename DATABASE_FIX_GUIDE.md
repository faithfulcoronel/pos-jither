# Database Fix Guide
## Fixing All Database Errors - Jowen's Kitchen POS

---

## 🔥 Quick Fix

If you're experiencing database errors, follow these steps:

### Step 1: Backup Your Database First!
```bash
mysqldump -u root -p pos_jither > backup_current.sql
```

### Step 2: Choose Your Fix Method

#### **Option A: Simple Cleanup (Recommended)**
Removes unused tables only, keeps all your data:

```bash
mysql -u root -p pos_jither < database/cleanup_database_simple.sql
```

#### **Option B: Fresh Start**
Complete fresh installation (loses existing data):

```bash
mysql -u root -p -e "DROP DATABASE IF EXISTS pos_jither;"
mysql -u root -p < database/schema_clean.sql
```

#### **Option C: Add Employee Number Field**
If you just need to add employee_number to staff_accounts:

```bash
mysql -u root -p pos_jither < database/migration_add_employee_number.sql
```

---

## 🐛 Common Errors and Fixes

### Error 1: "Table doesn't exist"

**Symptoms:**
```
ERROR 1146 (42S02): Table 'pos_jither.timekeeping_records' doesn't exist
```

**Cause:** Old table reference in code

**Fix:**
1. The old `timekeeping_records` table has been removed
2. System now uses `attendance_records` (modern system)
3. Files already updated: `php/data_functions.php` returns empty array

**No action needed** - this is expected behavior after cleanup.

---

### Error 2: "Column doesn't exist: employee_number"

**Symptoms:**
```
ERROR 1054 (42S22): Unknown column 'employee_number' in 'field list'
```

**Cause:** Missing employee_number field in staff_accounts table

**Fix:**
```bash
mysql -u root -p pos_jither < database/migration_add_employee_number.sql
```

Or manually:
```sql
USE pos_jither;
ALTER TABLE staff_accounts ADD COLUMN employee_number VARCHAR(20) NULL AFTER name;
ALTER TABLE staff_accounts ADD UNIQUE KEY employee_number (employee_number);
UPDATE staff_accounts SET employee_number = CONCAT('EMP', LPAD(id, 3, '0')) WHERE employee_number IS NULL;
```

---

### Error 3: "Duplicate column name" or "IF NOT EXISTS" syntax error

**Symptoms:**
```
ERROR 1060 (42S21): Duplicate column name 'employee_number'
ERROR 1064 (42000): You have an error in your SQL syntax near 'IF NOT EXISTS'
```

**Cause:** MySQL version doesn't support `IF NOT EXISTS` for columns (requires MySQL 8.0.13+)

**Fix:** Use the updated migration files:
- ✅ [migration_add_employee_number.sql](database/migration_add_employee_number.sql) - Now uses dynamic SQL
- ✅ [cleanup_database_simple.sql](database/cleanup_database_simple.sql) - No conditional column drops

---

### Error 4: Foreign Key Constraint Errors

**Symptoms:**
```
ERROR 1451 (23000): Cannot delete or update a parent row: a foreign key constraint fails
```

**Cause:** Trying to delete tables with foreign key relationships

**Fix:** The cleanup scripts now properly handle this:
```sql
SET FOREIGN_KEY_CHECKS = 0;
-- Drop tables
SET FOREIGN_KEY_CHECKS = 1;
```

---

### Error 5: "Access denied" errors

**Symptoms:**
```
ERROR 1045 (28000): Access denied for user 'root'@'localhost'
```

**Cause:** Incorrect database credentials

**Fix:** Check your credentials in `php/db.php`:
```php
$host = 'localhost';
$database = 'pos_jither';
$username = 'root';  // Your MySQL username
$password = '';      // Your MySQL password
```

---

## 📊 Database Structure After Fix

### Correct Table List (9 tables):
```
+-------------------------+
| Tables_in_pos_jither   |
+-------------------------+
| attendance_records      |
| employees              |
| inventory_items        |
| product_categories     |
| products               |
| sales_transaction_items|
| sales_transactions     |
| staff_accounts         |
| users                  |
+-------------------------+
```

### Verify Your Database:
```sql
USE pos_jither;
SHOW TABLES;
```

You should see exactly 9 tables above.

---

## 🔍 Detailed Verification Steps

### Step 1: Check Tables Exist
```sql
USE pos_jither;

-- Should return 9
SELECT COUNT(*) as table_count FROM information_schema.tables
WHERE table_schema = 'pos_jither';

-- Should list 9 tables
SHOW TABLES;
```

### Step 2: Check staff_accounts Structure
```sql
DESCRIBE staff_accounts;
```

Expected columns:
- ✅ id
- ✅ role
- ✅ name
- ✅ employee_number (VARCHAR 20, UNIQUE)
- ✅ status
- ✅ time_in
- ✅ time_out
- ✅ created_at

### Step 3: Check employees Table (Timekeeping)
```sql
DESCRIBE employees;
SELECT * FROM employees LIMIT 5;
```

Expected columns:
- ✅ id
- ✅ employee_number (VARCHAR 20, UNIQUE)
- ✅ full_name
- ✅ position
- ✅ department
- ✅ status
- ✅ date_hired
- ✅ created_at
- ✅ updated_at

### Step 4: Check attendance_records Table
```sql
DESCRIBE attendance_records;
SELECT * FROM attendance_records LIMIT 5;
```

Expected columns:
- ✅ id
- ✅ employee_id (FK to employees)
- ✅ employee_number
- ✅ date
- ✅ time_in
- ✅ time_out
- ✅ status
- ✅ hours_worked
- ✅ is_locked
- ✅ notes
- ✅ created_at
- ✅ updated_at

### Step 5: Test Staff Creation
```sql
-- Insert test staff
INSERT INTO staff_accounts (role, name, employee_number, status)
VALUES ('Cashier', 'Test Employee', 'EMP999', 'Inactive');

-- Insert corresponding employee
INSERT INTO employees (employee_number, full_name, position, status, date_hired)
VALUES ('EMP999', 'Test Employee', 'Cashier', 'active', CURDATE());

-- Verify
SELECT * FROM staff_accounts WHERE employee_number = 'EMP999';
SELECT * FROM employees WHERE employee_number = 'EMP999';

-- Clean up test data
DELETE FROM staff_accounts WHERE employee_number = 'EMP999';
DELETE FROM employees WHERE employee_number = 'EMP999';
```

---

## 🛠️ Manual Fix Procedures

### If Automated Scripts Fail:

#### 1. Remove Old Tables Manually
```sql
USE pos_jither;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS product_variations;
DROP TABLE IF EXISTS discounts;
DROP TABLE IF EXISTS inventory_alerts;
DROP TABLE IF EXISTS inventory_batches;
DROP TABLE IF EXISTS stock_movements;
DROP TABLE IF EXISTS purchase_order_items;
DROP TABLE IF EXISTS purchase_orders;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS timekeeping_records;
DROP TABLE IF EXISTS time_logs;

SET FOREIGN_KEY_CHECKS = 1;
```

#### 2. Add Employee Number Field Manually
```sql
USE pos_jither;

-- Check if column exists
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'pos_jither'
AND TABLE_NAME = 'staff_accounts'
AND COLUMN_NAME = 'employee_number';

-- If not exists, add it
ALTER TABLE staff_accounts
ADD COLUMN employee_number VARCHAR(20) NULL AFTER name;

-- Add unique constraint
ALTER TABLE staff_accounts
ADD UNIQUE KEY employee_number (employee_number);

-- Add index
CREATE INDEX idx_employee_number ON staff_accounts(employee_number);

-- Generate employee numbers for existing staff
UPDATE staff_accounts
SET employee_number = CONCAT('EMP', LPAD(id, 3, '0'))
WHERE employee_number IS NULL OR employee_number = '';
```

#### 3. Verify Timekeeping Tables
```sql
USE pos_jither;

-- Check employees table exists
SELECT COUNT(*) FROM employees;

-- Check attendance_records table exists
SELECT COUNT(*) FROM attendance_records;

-- Check trigger exists
SHOW TRIGGERS LIKE 'attendance_records';
```

---

## 🔧 PHP Code Fixes Applied

### File: php/data_functions.php

**Fixed Functions:**

1. **loadDataFromDatabase()** - Line 15
   ```php
   'timekeepingRecords' => [], // Old table removed
   ```

2. **fetchTimekeepingRecords()** - Lines 108-113
   ```php
   // @deprecated Old table removed
   function fetchTimekeepingRecords(PDO $pdo): array {
       return [];
   }
   ```

3. **clockInStaffAccount()** - Line 634
   ```php
   // Old timekeeping_records table removed - now using attendance_records
   ```

4. **clockOutStaffAccount()** - Line 673
   ```php
   // Old timekeeping_records table removed - now using attendance_records
   ```

**No changes needed in:**
- ✅ php/timekeeping-api.php (uses attendance_records correctly)
- ✅ php/create-employee.php (creates employees correctly)
- ✅ php/api.php (handles staff_accounts correctly)

---

## 📝 Testing Checklist

After running fixes, test these features:

### ✅ Product Management
- [ ] View products in POS
- [ ] Add new product
- [ ] Edit product
- [ ] Delete product

### ✅ Staff Management
- [ ] View staff list
- [ ] Add new staff with employee number
- [ ] Edit staff
- [ ] Delete staff

### ✅ Time Keeping
- [ ] Enter employee number
- [ ] Clock in (TIME IN button)
- [ ] Clock out (TIME OUT button)
- [ ] Verify hours calculated
- [ ] Test lock mechanism (can't clock in twice same day)

### ✅ Sales
- [ ] Create sale transaction
- [ ] View sales history
- [ ] Generate sales report

### ✅ Inventory
- [ ] View inventory items
- [ ] Add inventory item
- [ ] Update quantity
- [ ] Delete item

---

## 🚨 Emergency Recovery

If something goes wrong:

### Restore from Backup
```bash
mysql -u root -p pos_jither < backup_current.sql
```

### Start Fresh
```bash
# Complete wipe and reinstall
mysql -u root -p -e "DROP DATABASE IF EXISTS pos_jither;"
mysql -u root -p < database/schema_clean.sql
```

---

## 📞 Getting Help

### Check Database Status
```bash
mysql -u root -p pos_jither -e "
SELECT
    'Tables' as type,
    COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'pos_jither'
UNION ALL
SELECT
    'Expected',
    9;
"
```

### Export Current State
```bash
mysqldump -u root -p pos_jither --no-data > current_structure.sql
```

### Check Error Logs
- **MySQL Error Log:** Usually in `/var/log/mysql/error.log` (Linux) or check XAMPP logs (Windows)
- **PHP Error Log:** Check `php_error.log` or XAMPP error logs

---

## 📄 Related Files

- [cleanup_database_simple.sql](database/cleanup_database_simple.sql) - Simple cleanup (recommended)
- [cleanup_database.sql](database/cleanup_database.sql) - Advanced cleanup with column removal
- [schema_clean.sql](database/schema_clean.sql) - Fresh installation schema
- [migration_add_employee_number.sql](database/migration_add_employee_number.sql) - Add employee number field
- [DATABASE_CLEANUP_GUIDE.md](DATABASE_CLEANUP_GUIDE.md) - Detailed cleanup documentation

---

*Last Updated: January 2025*
*System: Jowen's Kitchen & Cafe POS*
*All database errors should now be resolved*
