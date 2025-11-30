# Recipe & Profitability Management System

## Overview

This system adds comprehensive recipe management, cost tracking, inventory auto-deduction, and profitability analysis to the POS system. Every product can now have a detailed recipe with ingredients, automatic cost calculation, and profit margin tracking.

## Features Implemented

### 1. **Product Recipe Management**
- Add multiple ingredients to each product
- Specify quantity and unit of measurement for each ingredient
- Support for various units: grams (g), milliliters (ml), pieces (pcs), etc.
- Optional notes for each ingredient
- Auto-calculation of product cost based on recipe

### 2. **Inventory Cost Tracking**
- Set cost per unit for each inventory item
- Track total inventory value
- Automatic product cost recalculation when ingredient costs change

### 3. **Automatic Inventory Deduction**
- Ingredients automatically deducted from inventory when products are sold
- Complete audit trail via stock_movements table
- Transaction reference tracking for all deductions
- Error handling for insufficient inventory

### 4. **Profitability Analysis**
- Real-time profit calculation for each product
- Displays:
  - Selling Price
  - Cost Price (from recipe)
  - Gross Profit (Selling - Cost)
  - Profit Margin % ((Profit / Selling) × 100)
- Profitability status indicators (Excellent/Good/Low/Loss)

### 5. **Comprehensive UI**
Three-tab interface in Manager Dashboard:
- **Product Recipes**: Add/edit/delete ingredients for products
- **Profitability Analysis**: View all products' profitability metrics
- **Inventory Costs**: Set and update ingredient costs

## Installation & Setup

### Step 1: Run Database Migration

Execute the migration file to create the necessary tables and sample data:

```bash
mysql -u root -p pos_jither < database/migration_add_recipes.sql
```

Or using phpMyAdmin:
1. Open phpMyAdmin
2. Select the `pos_jither` database
3. Go to SQL tab
4. Copy and paste contents of `migration_add_recipes.sql`
5. Click "Go" to execute

### Step 2: Verify Installation

The migration will create:
- `product_recipes` table
- `cost_price` and `auto_calculate_cost` columns in `products` table
- `cost_per_unit` column in `inventory_items` table
- Views: `product_profitability` and `product_recipe_details`
- Stored procedures for cost calculation and inventory deduction
- Database triggers for automatic cost updates

### Step 3: Sample Data

The migration includes sample data:
- Updated inventory items with costs:
  - Coffee Beans: ₱0.50/g
  - Milk: ₱0.08/ml
  - Cups: ₱5.00/pcs
  - Chocolate Syrup: ₱0.12/ml
  - Whipped Cream: ₱0.15/ml
  - Sugar: ₱0.02/g
  - Ice: ₱0.001/g

- Sample recipes for existing products:
  - **Espresso**: 18g Coffee Beans + 1 Cup = ₱14.00 cost
  - **Cappuccino**: 18g Coffee + 150ml Milk + 1 Cup = ₱26.00 cost
  - **Latte**: 18g Coffee + 200ml Milk + 1 Cup = ₱30.00 cost
  - **Mocha**: 18g Coffee + 180ml Milk + 30ml Chocolate + 20ml Cream + 1 Cup = ₱35.00 cost

## Usage Guide

### Adding a Recipe to a Product

1. Log in as Manager
2. Click "Recipe & Costs" in sidebar
3. Select a product from dropdown
4. In the "Add Ingredient" form:
   - Select an ingredient from inventory
   - Enter quantity (e.g., 18 for 18 grams)
   - Enter unit (g, ml, pcs, etc.)
   - Add optional notes
   - Click "Add"
5. The cost and profitability will update automatically

### Viewing Profitability

**For a Single Product:**
- Select product in "Product Recipes" tab
- View the profitability cards showing:
  - Selling Price
  - Cost Price
  - Gross Profit
  - Profit Margin %

**For All Products:**
- Click "Profitability Analysis" tab
- View table with all products sorted by profit margin
- Color-coded status indicators:
  - 🟢 Excellent (>50% margin)
  - 🟡 Good (30-50% margin)
  - 🟠 Low (0-30% margin)
  - 🔴 Loss (<0% margin)

### Setting Inventory Costs

1. Click "Inventory Costs" tab
2. Each inventory item shows:
   - Current stock
   - Total inventory value
   - Cost per unit input field
3. Update cost and click "Update"
4. All products using that ingredient will automatically recalculate their costs

### Automatic Inventory Deduction

When a sale is completed:
1. System checks if product has a recipe
2. For each ingredient in the recipe:
   - Calculates required quantity (ingredient qty × product qty sold)
   - Deducts from inventory
   - Logs in `stock_movements` table
3. If insufficient inventory:
   - Sale still completes
   - Error logged for manager review
   - Low stock alert generated

## Database Schema

### New Tables

#### `product_recipes`
```sql
- id (INT, PRIMARY KEY)
- product_id (VARCHAR, FK to products)
- inventory_item_id (INT, FK to inventory_items)
- quantity (DECIMAL) - Amount needed per product unit
- unit (VARCHAR) - Unit of measurement
- notes (TEXT) - Optional notes
- created_at, updated_at
```

### Modified Tables

#### `products`
```sql
+ cost_price (DECIMAL) - Total cost from recipe
+ auto_calculate_cost (BOOLEAN) - Enable/disable auto-calc
```

#### `inventory_items`
```sql
+ cost_per_unit (DECIMAL) - Cost per single unit
```

## API Endpoints

### Recipe Management

**Get Product Recipes**
```
GET /php/api.php?resource=recipes&action=get-by-product&product_id=cappuccino
```

**Get All Recipes**
```
GET /php/api.php?resource=recipes&action=get-all
```

**Add Ingredient**
```
POST /php/api.php
{
  "resource": "recipes",
  "action": "add-ingredient",
  "data": {
    "product_id": "cappuccino",
    "inventory_item_id": 1,
    "quantity": 18,
    "unit": "g",
    "notes": "Double shot espresso"
  }
}
```

**Update Ingredient**
```
POST /php/api.php
{
  "resource": "recipes",
  "action": "update-ingredient",
  "data": {
    "recipe_id": 1,
    "quantity": 20,
    "unit": "g",
    "notes": "Updated"
  }
}
```

**Delete Ingredient**
```
POST /php/api.php
{
  "resource": "recipes",
  "action": "delete-ingredient",
  "data": {
    "recipe_id": 1
  }
}
```

### Profitability

**Get Product Profitability**
```
GET /php/api.php?resource=profitability&action=get-by-product&product_id=cappuccino
```

**Get All Products Profitability**
```
GET /php/api.php?resource=profitability&action=get-all
```

### Inventory Costs

**Get Inventory with Costs**
```
GET /php/api.php?resource=inventory-with-cost
```

**Update Inventory Cost**
```
POST /php/api.php
{
  "resource": "inventory-cost",
  "action": "update",
  "data": {
    "inventory_item_id": 1,
    "cost_per_unit": 0.55
  }
}
```

### Check Availability

**Check if Sufficient Ingredients Available**
```
GET /php/api.php?resource=recipes&action=check-availability&product_id=cappuccino&quantity=5
```

## Business Benefits

### 1. **Accurate Cost Tracking**
- Know the exact cost to make each product
- Identify products with low or negative margins
- Make informed pricing decisions

### 2. **Inventory Management**
- Automatic deduction prevents overselling
- Real-time inventory updates
- Stock movement audit trail

### 3. **Profitability Analysis**
- Identify most and least profitable products
- Optimize menu based on profit margins
- Track profit trends over time

### 4. **Recipe Standardization**
- Consistent product quality
- Accurate portion control
- Training tool for new staff

### 5. **Financial Reporting**
- Calculate true COGS (Cost of Goods Sold)
- Accurate profit/loss statements
- Better budgeting and forecasting

## Example Calculations

### Cappuccino Profitability

**Recipe:**
- 18g Coffee Beans @ ₱0.50/g = ₱9.00
- 150ml Milk @ ₱0.08/ml = ₱12.00
- 1 Cup @ ₱5.00/pcs = ₱5.00
- **Total Cost:** ₱26.00

**Pricing:**
- Selling Price: ₱120.00
- Cost Price: ₱26.00
- **Gross Profit:** ₱94.00
- **Profit Margin:** 78.33%

**Inventory Deduction (2 units sold):**
- Coffee Beans: -36g
- Milk: -300ml
- Cups: -2pcs

## Troubleshooting

### Issue: Cost not updating automatically

**Solution:**
1. Check `auto_calculate_cost` is TRUE for the product
2. Verify recipe ingredients exist
3. Check database triggers are active:
   ```sql
   SHOW TRIGGERS LIKE 'product_recipes';
   ```

### Issue: Inventory not deducting on sale

**Solution:**
1. Verify product has a recipe (check `product_recipes` table)
2. Check transaction created successfully
3. Review `stock_movements` table for deduction logs
4. Check PHP error logs for any exceptions

### Issue: Profitability shows 0%

**Solution:**
1. Ensure product has a recipe with ingredients
2. Verify inventory items have `cost_per_unit` set
3. Recalculate costs:
   ```sql
   CALL calculate_product_cost('product_id');
   ```

## Future Enhancements

Potential features for future development:
- Recipe versioning and history
- Batch recipe updates
- Recipe import/export (CSV, JSON)
- Suggested selling price based on desired margin
- Ingredient substitution suggestions
- Multi-unit conversions (kg ↔ g, L ↔ ml)
- Recipe costing scenarios ("what-if" analysis)
- Waste tracking and shrinkage analysis

## Files Modified/Created

### Created:
- `database/migration_add_recipes.sql` - Database schema migration
- `php/recipe_functions.php` - Backend business logic
- `components/recipe-manager.html` - Frontend UI component
- `RECIPE_SYSTEM_README.md` - This documentation

### Modified:
- `php/api.php` - Added recipe/profitability API endpoints
- `php/api.php` - Added auto-deduction in sales transaction creation
- `index.php` - Added Recipe & Costs navigation and component include
- `script.js` - Added recipe management initialization
- `components/manager-dashboard.html` - Added navigation link

## Support

For issues or questions:
1. Check this documentation first
2. Review database schema in `migration_add_recipes.sql`
3. Check PHP error logs: `php/error.log` or server error logs
4. Inspect browser console for JavaScript errors

## Version

- **Version:** 1.0
- **Date:** 2025-01-21
- **Compatibility:** POS Jither v1.0+
- **PHP Version:** 8.0+
- **MySQL Version:** 5.7+

---

**Happy Recipe Management!** 🎉
