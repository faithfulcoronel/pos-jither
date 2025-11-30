# Quick Start Guide - Recipe & Profitability System

## 🚀 Getting Started in 5 Minutes

### Step 1: Install the Database Schema (1 minute)

Open your MySQL client and run:

```bash
mysql -u root -p pos_jither < database/migration_add_recipes.sql
```

Or in phpMyAdmin:
1. Select `pos_jither` database
2. Go to "SQL" tab
3. Copy contents from `database/migration_add_recipes.sql`
4. Click "Go"

✅ You should see: "Recipe and cost tracking system migration completed successfully!"

### Step 2: Access the System (30 seconds)

1. Open your POS system in browser
2. Log in as **Manager** (username: `manager`, password: `1234`)
3. Click **"Recipe & Costs"** in the left sidebar

### Step 3: Try It Out! (3 minutes)

#### Add a Recipe to a Product

1. **Select Product**: Choose "Cappuccino" from the dropdown
2. **View Current Data**:
   - Selling Price: ₱120.00
   - Cost Price: ₱26.00 (already calculated from sample data)
   - Gross Profit: ₱94.00
   - Profit Margin: 78.33% 🟢

3. **Add Another Ingredient** (optional):
   - Select "Sugar" from ingredient dropdown
   - Quantity: `5`
   - Unit: `g`
   - Click "Add"
   - Watch the cost automatically recalculate!

#### View All Product Profitability

1. Click the **"Profitability Analysis"** tab
2. See all products with their profit margins
3. Products are sorted by profitability
4. Look for status indicators:
   - 🟢 Excellent (>50% margin)
   - 🟡 Good (30-50%)
   - 🟠 Low (0-30%)
   - 🔴 Loss (<0%)

#### Update Ingredient Costs

1. Click the **"Inventory Costs"** tab
2. Find "Coffee Beans"
3. Change cost from `0.50` to `0.60`
4. Click "Update"
5. 🎉 All products using coffee beans will automatically recalculate!

### Step 4: Test Automatic Inventory Deduction (1 minute)

1. Go to **Cashier Dashboard** (or switch to cashier role)
2. Create a test order:
   - Add 2× Cappuccino (₱240.00)
   - Complete the sale
3. Go back to **Manager Dashboard**
4. Check **Inventory**:
   - Coffee Beans: Reduced by 36g (18g × 2)
   - Milk: Reduced by 300ml (150ml × 2)
   - Cups: Reduced by 2pcs (1 × 2)

✅ **Automatic deduction works!**

## 📊 Sample Data Included

The migration includes sample recipes for 4 products:

| Product | Ingredients | Cost | Price | Margin |
|---------|------------|------|-------|--------|
| **Espresso** | 18g Coffee + Cup | ₱14.00 | ₱80.00 | 82.50% |
| **Cappuccino** | 18g Coffee + 150ml Milk + Cup | ₱26.00 | ₱120.00 | 78.33% |
| **Latte** | 18g Coffee + 200ml Milk + Cup | ₱30.00 | ₱110.00 | 72.73% |
| **Mocha** | 18g Coffee + 180ml Milk + 30ml Chocolate + 20ml Cream + Cup | ₱35.00 | ₱130.00 | 73.08% |

## 💡 Common Tasks

### Create a Recipe for a New Product

1. First, create the product in **Menu** section
2. Go to **Recipe & Costs**
3. Select your new product
4. Add ingredients one by one:
   - Select ingredient
   - Enter quantity
   - Enter unit (g, ml, pcs, etc.)
   - Click "Add"
5. Cost and profitability auto-calculate!

### Set Pricing Based on Desired Margin

Want 60% profit margin? Use this formula:

```
Selling Price = Cost Price ÷ (1 - Desired Margin)

Example:
- Cost: ₱30.00
- Desired Margin: 60% (0.60)
- Selling Price = 30 ÷ (1 - 0.60) = 30 ÷ 0.40 = ₱75.00
```

### Check Ingredient Availability Before Sale

In **Recipe & Costs** → Use the availability checker:
- Product: Cappuccino
- Quantity: 10
- System shows if enough ingredients available

## 🎯 Key Features

✅ **Automatic Cost Calculation** - No manual math needed
✅ **Real-time Profitability** - Know your margins instantly
✅ **Auto Inventory Deduction** - Never oversell ingredients
✅ **Audit Trail** - Track every ingredient movement
✅ **Beautiful UI** - Easy to use, professional design

## ⚠️ Important Notes

1. **Set Inventory Costs First**: Before adding recipes, make sure all inventory items have a `cost_per_unit` value
2. **Units Matter**: Use consistent units (g, ml, pcs) - don't mix kg and g
3. **Stock Movements**: All deductions are logged in `stock_movements` table for auditing
4. **Auto-Calculate**: Products with `auto_calculate_cost = TRUE` will update automatically when ingredient costs change

## 🆘 Need Help?

- **Full Documentation**: See `RECIPE_SYSTEM_README.md`
- **Database Schema**: Check `database/migration_add_recipes.sql`
- **API Reference**: See "API Endpoints" section in main README

## 🎉 You're Ready!

That's it! You now have:
- ✅ Recipe management for all products
- ✅ Automatic cost tracking
- ✅ Profitability analysis
- ✅ Inventory auto-deduction
- ✅ Beautiful reporting interface

**Start adding recipes and optimize your product profitability!** 📈
