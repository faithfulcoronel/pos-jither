# Stock Movements Table - Missing Table Fix

## Problem
When processing a sale with product recipes, the system tried to log inventory movements to the `stock_movements` table, but this table didn't exist in the database, causing this error:

```
SQLSTATE[42S02]: Base table or view not found: 1146 Table 'pos_jither.stock_movements' doesn't exist
```

## Solution
The `stock_movements` table has been added to track all inventory changes (sales, purchases, adjustments, etc.). This table provides an audit trail for inventory management.

## How to Fix

### Method 1: Run the Web Script (Easiest)
1. Open your browser and go to: `http://localhost/pos-jither-main/create_stock_movements_table.php`
2. The script will automatically create the table and show you the structure
3. You'll see a success message when complete

### Method 2: Run SQL File Manually
1. Open phpMyAdmin or MySQL command line
2. Select the `pos_jither` database
3. Run the SQL file: `database/create_stock_movements.sql`

### Method 3: Fresh Database Install
If you want to start fresh with all tables:
1. Run `database/COMPLETE_DATABASE.sql` (this now includes stock_movements)
2. This will drop and recreate the entire database with all 11 tables

## What This Table Does

The `stock_movements` table tracks:
- **Sales**: When inventory is deducted after a transaction
- **Purchases**: When new stock is added
- **Adjustments**: Manual inventory corrections
- **Waste**: Items that are damaged or expired
- **Transfer**: Moving items between locations

### Table Structure
```sql
stock_movements (
    id                  - Auto-increment primary key
    inventory_item_id   - References inventory_items table
    movement_type       - Type: sale, purchase, adjustment, waste, transfer
    quantity            - Amount changed (negative for deductions)
    previous_quantity   - Quantity before change
    new_quantity        - Quantity after change
    reference_type      - What triggered this (e.g., "transaction")
    reference_id        - ID of the transaction or related record
    notes               - Additional information
    created_by          - User who made the change
    created_at          - Timestamp of change
)
```

## Benefits

1. **Audit Trail**: See exactly when and why inventory changed
2. **Debugging**: Identify when items were deducted or added
3. **Reconciliation**: Match physical inventory with system records
4. **Compliance**: Track all inventory movements for accounting
5. **Analytics**: Analyze consumption patterns and waste

## Example Usage

When a Cappuccino is sold:
```
Product: Cappuccino (1x)
Ingredients deducted:
- Coffee Beans: 18g
- Milk: 150ml
- Cups: 1 pcs

Stock Movements Logged:
1. Coffee Beans: 10000g → 9982g (transaction #123)
2. Milk: 25000ml → 24850ml (transaction #123)
3. Cups: 300 → 299 (transaction #123)
```

## Verification

After creating the table, test it by:
1. Go to POS Cashier Dashboard
2. Add a drink to cart (e.g., Cappuccino)
3. Complete the checkout
4. Check inventory - quantities should be reduced
5. Check `stock_movements` table - you should see entries for each ingredient

```sql
-- View recent stock movements
SELECT
    sm.id,
    ii.item,
    sm.movement_type,
    sm.quantity,
    sm.previous_quantity,
    sm.new_quantity,
    sm.reference_type,
    sm.reference_id,
    sm.created_at
FROM stock_movements sm
JOIN inventory_items ii ON sm.inventory_item_id = ii.id
ORDER BY sm.created_at DESC
LIMIT 20;
```

## Related Files

- **Database Schema**: `database/COMPLETE_DATABASE.sql` (updated with stock_movements)
- **SQL Script**: `database/create_stock_movements.sql`
- **Web Installer**: `create_stock_movements_table.php`
- **Recipe Functions**: `php/recipe_functions.php` (logs movements at lines 407-419)

## Notes

- This table is created automatically if you run `COMPLETE_DATABASE.sql`
- If you already have data, use the web script or SQL file to add just this table
- The table uses foreign keys, so it will cascade delete when inventory items are deleted
- Movement logging happens in `php/recipe_functions.php` after inventory is deducted

## Troubleshooting

**Error: "Foreign key constraint fails"**
- Make sure the `inventory_items` table exists first
- Check that your database supports InnoDB engine

**Error: "Table already exists"**
- The table has already been created
- Your inventory deductions should now work

**Still getting errors?**
1. Check PHP error logs: `php/error.log`
2. Verify database connection: `php/db_connect.php`
3. Make sure all ingredients exist in `inventory_items` table
4. Check that products have recipes in `product_recipes` table
