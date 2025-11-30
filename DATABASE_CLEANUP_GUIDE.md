# Database Cleanup Guide
## Jowen's Kitchen & Cafe POS System

---

## 📋 Overview

This guide documents the database cleanup performed to optimize the POS system for small cafe operations. The cleanup removes unused tables and simplifies the database structure while maintaining all core functionality.

---

## 🎯 Cleanup Summary

### Before Cleanup: 19 Tables
The original schema included many advanced features not needed for a small cafe:
- Product variations system
- Discount/promotions system
- Supplier management
- Purchase order system
- Stock movement tracking
- Batch/lot tracking
- Inventory alerts
- Duplicate timekeeping tables

### After Cleanup: 9 Tables
Streamlined to include only essential features:
- Product & inventory management
- Staff & user accounts
- Time keeping system
- Sales transactions

---

## ❌ Tables Removed

### 1. **product_variations**
**Reason**: Not implemented in the system
**Impact**: None - feature was never used
**Alternative**: Can be added back if product size/temperature variations are needed

### 2. **discounts**
**Reason**: Discount feature not implemented
**Impact**: None - no discount functionality in current system
**Alternative**: Manual discount entry is still possible in sales transactions

### 3. **suppliers**
**Reason**: Only used in optional reports feature
**Impact**: Removes supplier management and purchase history reports
**Alternative**: Can manage suppliers in a separate spreadsheet if needed

### 4. **purchase_orders** & **purchase_order_items**
**Reason**: Purchase order system not actively used
**Impact**: Removes PO creation and tracking features
**Alternative**: Manual purchase tracking outside the system

### 5. **stock_movements**
**Reason**: Not used anywhere in the system
**Impact**: Removes audit trail for inventory changes
**Alternative**: Inventory changes can be logged manually

### 6. **inventory_batches**
**Reason**: Batch/lot tracking not needed for small cafe
**Impact**: Removes expiration date tracking and FIFO management
**Alternative**: Manual tracking of product expiration dates

### 7. **inventory_alerts**
**Reason**: Alert system not actively used
**Impact**: Removes automated low-stock notifications
**Alternative**: Manual monitoring of inventory levels

### 8. **timekeeping_records** (DUPLICATE)
**Reason**: Replaced by attendance_records table
**Impact**: None - modern time keeping system uses attendance_records
**Note**: This table was from the old system and is no longer used

### 9. **time_logs**
**Reason**: Audit trail feature not implemented
**Impact**: Removes detailed clock-in/out logging
**Alternative**: Attendance records still track time in/out

---

## ✅ Tables Retained (Core System)

### Product Management (3 tables)

#### 1. **product_categories**
- Purpose: Menu categories (Coffee, Pastries, etc.)
- Usage: Product organization and menu display
- Status: ✅ Active

#### 2. **products**
- Purpose: Individual menu items with pricing
- Usage: POS ordering system, sales transactions
- Status: ✅ Active

#### 3. **inventory_items**
- Purpose: Basic stock tracking (quantity, unit, reorder levels)
- Usage: Manager dashboard inventory management
- Status: ✅ Active

### Staff & User Management (3 tables)

#### 4. **staff_accounts**
- Purpose: Employee records with employee numbers
- Usage: Staff management dashboard
- Fields: id, role, name, employee_number, status, time_in, time_out
- Status: ✅ Active

#### 5. **users**
- Purpose: Login accounts for POS access
- Usage: Authentication (Manager, Cashier login)
- Status: ✅ Active

#### 6. **employees**
- Purpose: Time keeping employee records
- Usage: Time keeping terminal (clock in/out)
- Status: ✅ Active

### Time Keeping (1 table)

#### 7. **attendance_records**
- Purpose: Time in/out tracking with lock mechanism
- Usage: Employee attendance, hours worked calculation
- Features: Auto-calculates hours, prevents duplicate time-ins
- Status: ✅ Active

### Sales Transactions (2 tables)

#### 8. **sales_transactions**
- Purpose: Summary of completed sales
- Usage: Sales history, analytics, reports
- Status: ✅ Active

#### 9. **sales_transaction_items**
- Purpose: Line items for each sale
- Usage: Detailed sales records, product popularity tracking
- Status: ✅ Active

---

## 🔧 Fields Removed

### From **inventory_items**:
- ❌ `supplier_id` - Supplier reference no longer needed
- ❌ `barcode` - Barcode scanning not implemented

### Notes:
- Kept `track_inventory` and `inventory_item_id` in products table for future use
- All other essential fields retained

---

## 📝 How to Perform Cleanup

### Step 1: Backup Your Database
**CRITICAL: Always backup before running cleanup!**

```bash
# Windows (Command Prompt)
mysqldump -u root -p pos_jither > backup_before_cleanup.sql

# Or use phpMyAdmin Export feature
```

### Step 2: Run Cleanup Script

```bash
# Option A: Using MySQL command line
mysql -u root -p pos_jither < database/cleanup_database.sql

# Option B: Using phpMyAdmin
# 1. Open phpMyAdmin
# 2. Select pos_jither database
# 3. Go to SQL tab
# 4. Copy contents of cleanup_database.sql
# 5. Click "Go"
```

### Step 3: Verify Cleanup

Check that all unnecessary tables are removed:

```sql
SHOW TABLES FROM pos_jither;
```

Expected result: 9 tables
- attendance_records
- employees
- inventory_items
- product_categories
- products
- sales_transaction_items
- sales_transactions
- staff_accounts
- users

### Step 4: Update PHP Code

The following files have been updated to remove references to deleted tables:

✅ **php/data_functions.php**
- `fetchTimekeepingRecords()` now returns empty array
- `clockInStaffAccount()` no longer inserts into old table
- `clockOutStaffAccount()` no longer updates old table

✅ **php/reports.php**
- Advanced reports that used removed tables will return empty results
- Basic sales and inventory reports still work

✅ **php/automation.php**
- Features requiring removed tables will return errors
- Basic automation features still work

---

## 🚀 Alternative: Fresh Installation

If you prefer a fresh start with the clean schema:

### Option 1: Clean Schema (Recommended for New Installations)

```bash
# Drop existing database and create fresh
mysql -u root -p -e "DROP DATABASE IF EXISTS pos_jither;"
mysql -u root -p < database/schema_clean.sql
```

### Option 2: Keep Data and Cleanup

```bash
# Keep existing data, remove unused tables
mysql -u root -p pos_jither < database/cleanup_database.sql
```

---

## 📊 Database Size Comparison

### Before Cleanup:
- **Tables**: 19
- **Estimated Size**: ~5-10 MB (with sample data)
- **Complexity**: High (many unused tables)

### After Cleanup:
- **Tables**: 9 (53% reduction)
- **Estimated Size**: ~2-4 MB (with sample data)
- **Complexity**: Low (only essential tables)

---

## ⚠️ Important Notes

### What Still Works:
✅ Product catalog and categories
✅ Sales transactions and checkout
✅ Inventory tracking (basic)
✅ Staff management with employee numbers
✅ Time keeping system (modern)
✅ Manager and Cashier login
✅ Sales reports and analytics
✅ Manager dashboard

### What No Longer Works:
❌ Advanced inventory reports (batch aging, stock movement history)
❌ Purchase order creation and tracking
❌ Supplier management
❌ Automated low-stock alerts
❌ Discount code system (not implemented anyway)
❌ Product variations (not implemented anyway)

### Can Be Re-Added If Needed:
- Supplier management (if you grow to multiple suppliers)
- Purchase orders (if you need formal PO tracking)
- Batch tracking (if you need expiration date management)
- Inventory alerts (if you want automated notifications)

---

## 🔄 Reverting Changes

If you need to restore removed tables:

### Step 1: Restore from Backup
```bash
mysql -u root -p pos_jither < backup_before_cleanup.sql
```

### Step 2: Or Use Original Schema
```bash
mysql -u root -p pos_jither < database/schema.sql
```

---

## 📞 Troubleshooting

### Issue: "Table doesn't exist" errors after cleanup

**Solution**: Check which table is missing and verify if it's actually needed:

```sql
-- Check if table exists
SHOW TABLES LIKE 'table_name';

-- If needed, restore from backup or recreate
```

### Issue: Reports showing errors

**Solution**: Some advanced reports require removed tables. These features are optional:
- Inventory aging reports
- Purchase history reports
- Stock movement audit

Basic reports (sales, inventory summary) still work.

### Issue: Need to restore a specific table

**Solution**: Extract specific table from backup:

```bash
# Extract single table from backup
mysql -u root -p pos_jither < backup_table.sql
```

---

## 📄 Related Files

- [cleanup_database.sql](database/cleanup_database.sql) - Cleanup script
- [schema_clean.sql](database/schema_clean.sql) - Clean schema for fresh install
- [schema.sql](database/schema.sql) - Original schema (all tables)
- [migration_timekeeping_system.sql](database/migration_timekeeping_system.sql) - Modern time keeping system

---

## 🔄 Version History

**v2.0** (Current) - Database Cleanup
- Removed 10 unused/unnecessary tables
- Simplified to 9 core tables
- Updated PHP code to remove references
- Optimized for small cafe operations

**v1.0** - Original Schema
- 19 tables with many advanced features
- Designed for larger operations

---

*Last Updated: January 2025*
*System: Jowen's Kitchen & Cafe POS*
*Database: pos_jither (cleaned)*
