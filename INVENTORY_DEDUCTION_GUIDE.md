# Inventory Deduction System - How It Works

## Overview

The inventory deduction system **automatically reduces ingredient quantities** based on product recipes **AFTER checkout is completed**.

## When Does Inventory Deduct?

### ✅ AFTER Checkout (Payment Confirmed)
Inventory is deducted **only when**:
1. Customer order is complete
2. Payment is received (cash/card)
3. Cashier clicks "Confirm Payment" button
4. Sale transaction is successfully saved to database

### ❌ NOT During Order Taking
Inventory is **NOT** deducted when:
- Adding items to the cart
- Viewing items in the order
- Calculating totals
- Before payment is confirmed

## Step-by-Step Flow

### 1. **Order Taking** (No Inventory Change)
```
Cashier adds items to cart:
- 1x Cappuccino
- 1x Latte
- 2x Croissant
```
**Inventory Status**: No changes yet ✋

### 2. **Checkout Screen** (No Inventory Change)
```
Shows total, VAT breakdown, payment method
User enters amount tendered
```
**Inventory Status**: Still no changes ✋

### 3. **Payment Confirmed** (Inventory Deduction Happens!)
```
Cashier clicks "Confirm Payment"
↓
Transaction saved to database
↓
System checks each item for recipes
↓
Inventory deducted automatically
```
**Inventory Status**: Ingredients reduced! ✅

## Example: Selling 1 Cappuccino

**Before Checkout:**
```
Coffee Beans: 5000g
Milk: 10000ml
Cups: 500 pcs
```

**Customer Orders:**
- 1x Cappuccino (₱150)

**During Order Taking:**
```
Coffee Beans: 5000g  (no change)
Milk: 10000ml        (no change)
Cups: 500 pcs        (no change)
```

**After Payment Confirmed:**
```
Coffee Beans: 4982g  (-18g per recipe)
Milk: 9850ml         (-150ml per recipe)
Cups: 499 pcs        (-1 cup per recipe)
```

**Receipt Generated:**
```
JOWEN'S KITCHEN & CAFE
======================
Cappuccino      ₱150.00
----------------------
SUBTOTAL        ₱150.00
VAT (12%)        ₱16.07
----------------------
TOTAL           ₱150.00
```

## What Gets Deducted?

The system uses the **product_recipes** table to determine what ingredients to deduct:

| Product | Ingredients Deducted Per Item |
|---------|------------------------------|
| Espresso | 18g Coffee Beans, 1 Cup |
| Cappuccino | 18g Coffee Beans, 150ml Milk, 1 Cup |
| Latte | 18g Coffee Beans, 200ml Milk, 1 Cup |
| Mocha | 18g Coffee Beans, 180ml Milk, 30ml Chocolate Syrup, 20ml Whipped Cream, 1 Cup |
| Americano | 18g Coffee Beans, 1 Cup |
| Caramel Macchiato | 18g Coffee Beans, 200ml Milk, 20ml Vanilla Syrup, 15ml Caramel Syrup, 1 Cup |

## Inventory Warnings

### Low Stock Warning
If an ingredient is running low **but still available**, the cashier sees:
```
⚠️ INVENTORY WARNINGS:
Coffee Beans is running low
- Required: 18g
- Available: 50g
- Remaining after sale: 32g
```
**Sale completes successfully** ✅

### Insufficient Stock Error
If an ingredient **doesn't have enough quantity**, the cashier sees:
```
⚠️ INVENTORY WARNINGS:
Milk has insufficient stock
- Required: 150ml
- Available: 100ml
- Short by: 50ml
```
**Sale still completes**, but warning is shown ⚠️

> **Note**: Sales are not blocked by insufficient inventory. The system logs the shortage and displays warnings to inform staff.

## Stock Movement Tracking

Every deduction is logged in the `stock_movements` table:

| Field | Value |
|-------|-------|
| inventory_item_id | 1 (Coffee Beans) |
| movement_type | 'sale' |
| quantity | 18 |
| previous_quantity | 5000 |
| new_quantity | 4982 |
| reference_type | 'sales_transaction' |
| reference_id | 12345 (transaction ID) |
| notes | "Auto-deducted for product: cappuccino (qty: 1)" |

## Viewing Inventory Changes

### 1. Inventory Dashboard
Navigate to: **Manager Dashboard → Inventory Management**
- View current stock levels
- See all inventory items
- Track low stock items

### 2. Stock Movements Log
Navigate to: **Manager Dashboard → Inventory → Stock Movements**
- See all deductions with timestamps
- Filter by date, item, or movement type
- View reference to original sale transaction

### 3. Sales Analysis
Navigate to: **Manager Dashboard → Sales Analysis**
- View products sold
- See quantities and revenue
- Understand which products use most ingredients

## Adding Recipes for Products

If a product doesn't have a recipe, no inventory is deducted. To add a recipe:

1. Go to **Manager Dashboard → Menu Items**
2. Click on the product
3. Scroll to "Recipe & Ingredients" section
4. Click "Add Ingredient"
5. Select inventory item, enter quantity and unit
6. Save

**Example Recipe for Iced Coffee:**
```
Inventory Item    | Quantity | Unit
------------------+----------+------
Coffee Beans      | 18       | g
Ice               | 200      | g
Cups              | 1        | pcs
```

## Technical Details

**Files Involved:**
- [php/api.php](php/api.php#L333-L355) - Calls deduction after sale
- [php/recipe_functions.php](php/recipe_functions.php#L358-L451) - Performs deduction logic
- [script.js](script.js#L1647-L1687) - Shows inventory warnings to cashier

**Database Tables:**
- `products` - Product definitions
- `product_recipes` - Recipe ingredients with quantities
- `inventory_items` - Raw materials/ingredients stock
- `stock_movements` - Log of all inventory changes
- `sales_transactions` - Completed sales
- `sales_transaction_items` - Individual items in each sale

## Benefits

✅ **Automatic** - No manual inventory updates needed
✅ **Accurate** - Based on exact recipes
✅ **Traceable** - Every deduction is logged
✅ **Real-time** - Inventory updates immediately after sale
✅ **Warning System** - Alerts when stock is low
✅ **Reversible** - Can track and audit all movements

## Summary

**Inventory deduction happens AFTER checkout** when payment is confirmed and the sale is finalized. The system automatically calculates ingredient usage based on product recipes and updates inventory quantities in real-time. All changes are logged for tracking and auditing purposes.
