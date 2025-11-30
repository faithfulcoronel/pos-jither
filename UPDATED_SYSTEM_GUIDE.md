# Product Recipe & Profitability System - Updated Guide

## 🎉 What's New

The recipe and profitability management system has been **integrated directly into the Menu section**! Now when you add a new product, you can immediately add its recipe, ingredients, costs, and see real-time profitability calculations.

## ✨ Key Features

### 1. **Integrated Product Creation**
When adding a new product in the Menu section, you can now:
- ✅ Set product name, category, and selling price
- ✅ Add recipe ingredients with quantities and units
- ✅ Set cost per unit for each ingredient
- ✅ See **real-time profitability calculations** as you build the recipe
- ✅ View cost price, gross profit, and profit margin before saving

### 2. **Real-Time Profitability Preview**
As you add ingredients and set the selling price, the form automatically shows:
- **Total Cost**: Sum of all ingredient costs
- **Selling Price**: Your set price
- **Gross Profit**: Selling price minus cost
- **Profit Margin %**: Percentage of profit

### 3. **Profitability Display on Menu Items**
Each product in the menu now shows:
- Cost price
- Gross profit
- Profit margin percentage with color-coded badges:
  - 🟢 **Excellent** (>50% margin)
  - 🟡 **Good** (30-50% margin)
  - 🟠 **Low** (0-30% margin)
  - 🔴 **Loss** (<0% margin)

### 4. **Automatic Inventory Deduction**
When products are sold:
- Ingredients automatically deducted from inventory
- Complete audit trail in stock_movements table
- Error handling for insufficient stock

## 📋 How to Use

### Adding a New Product with Recipe

1. **Navigate to Menu**
   - Login as Manager
   - Click "Menu" in the sidebar

2. **Open Add Product Form**
   - Click "Add New Product" button

3. **Fill Product Information**
   - Product Name (e.g., "Cappuccino")
   - Select Category (e.g., "Coffee Classics")
   - Selling Price (e.g., 120.00)
   - Upload Image (optional)

4. **Add Recipe Ingredients**
   - Select ingredient from dropdown
   - Enter quantity (e.g., 18)
   - Enter unit (automatically filled, but can edit - e.g., "g", "ml", "pcs")
   - Cost per unit (automatically filled from inventory)
   - Click "+ Add Ingredient"
   - Repeat for all ingredients

5. **Review Profitability**
   - Check the auto-calculated profitability section
   - Ensure your margin is profitable
   - Adjust price or ingredients if needed

6. **Save Product**
   - Click "Add Product"
   - Product, recipe, and costs are all saved together!

### Example: Creating a Cappuccino

```
Product Information:
- Name: Cappuccino
- Category: Signature Espresso
- Selling Price: ₱120.00
- Image: cappuccino.jpeg

Recipe/Ingredients:
1. Coffee Beans: 18g @ ₱0.50/g = ₱9.00
2. Milk: 150ml @ ₱0.08/ml = ₱12.00
3. Cups: 1pcs @ ₱5.00/pcs = ₱5.00

Profitability (Auto-calculated):
- Total Cost: ₱26.00
- Selling Price: ₱120.00
- Gross Profit: ₱94.00
- Profit Margin: 78.33% 🟢 Excellent
```

## 🗄️ Database Setup

### One-Time Installation

Run the migration to set up the database:

```bash
mysql -u root -p pos_jither < database/migration_add_recipes.sql
```

This creates:
- `product_recipes` table for storing recipes
- Cost tracking columns in `products` table
- `cost_per_unit` column in `inventory_items` table
- Automatic triggers for cost updates
- Sample data for testing

## 💡 Tips & Best Practices

### 1. **Set Inventory Costs First**
Before adding products:
- Go to Inventory section
- Ensure all items have a cost_per_unit value
- This will auto-fill when adding ingredients

### 2. **Use Consistent Units**
- Use **grams** (g) for solids, not kg
- Use **milliliters** (ml) for liquids, not L
- Use **pieces** (pcs) for countable items
- This ensures accurate calculations

### 3. **Target Profit Margins**
Industry standards for cafes:
- **Food**: 60-70% margin
- **Coffee**: 70-80% margin
- **Retail goods**: 40-50% margin

Use the preview to adjust prices accordingly.

### 4. **Review Profitability Regularly**
- Check menu items weekly
- Look for low-margin products (🟠 or 🔴)
- Consider price adjustments or cost reductions

## 📊 What Happens When You Sell

### Automatic Process:

1. **Customer orders 2× Cappuccino**
2. System creates sales transaction
3. **Inventory auto-deducts:**
   - Coffee Beans: -36g (18g × 2)
   - Milk: -300ml (150ml × 2)
   - Cups: -2pcs (1 × 2)
4. **Stock movements logged** with transaction reference
5. **Low stock alerts** generated if needed

## 🔧 Technical Details

### Files Created/Modified

**Created:**
- `database/migration_add_recipes.sql` - Database schema
- `php/recipe_functions.php` - Backend logic
- `js/recipe-management.js` - Frontend functionality
- `css/recipe-form-styles.css` - Styling
- `UPDATED_SYSTEM_GUIDE.md` - This file

**Modified:**
- `index.php` - Enhanced menu form, removed separate Recipe & Costs section
- `php/api.php` - Added recipe/profitability API endpoints, auto-deduction
- `script.js` - Added recipe management initialization

### API Endpoints Available

**Recipe Management:**
```
GET  /php/api.php?resource=recipes&action=get-by-product&product_id={id}
POST /php/api.php (resource: recipes, action: add-ingredient)
POST /php/api.php (resource: recipes, action: delete-ingredient)
```

**Profitability:**
```
GET /php/api.php?resource=profitability&action=get-all
GET /php/api.php?resource=profitability&action=get-by-product&product_id={id}
```

**Inventory Costs:**
```
GET /php/api.php?resource=inventory-with-cost
POST /php/api.php (resource: inventory-cost, action: update)
```

## 🎨 UI Features

### Form Sections:
1. **Product Information** - Basic details
2. **Recipe/Ingredients** - Interactive ingredient list
3. **Profitability Preview** - Real-time calculations

### Visual Feedback:
- ✅ Ingredient cards with remove buttons
- ✅ Color-coded profitability (green for profit, red for loss)
- ✅ Empty state messages
- ✅ Auto-filled values based on inventory

### Responsive Design:
- Mobile-friendly layout
- Touch-optimized buttons
- Collapsible form sections

## 🚀 Quick Start Checklist

- [ ] Run database migration (`migration_add_recipes.sql`)
- [ ] Set cost_per_unit for all inventory items
- [ ] Test by adding a sample product with recipe
- [ ] Verify profitability shows correctly
- [ ] Make a test sale to verify inventory deduction
- [ ] Check stock_movements table for audit trail

## ❓ FAQ

**Q: Can I add a product without a recipe?**
A: Yes! Just skip the ingredients section and save the product. Cost will be ₱0.00.

**Q: Can I edit a recipe after creating the product?**
A: Currently, recipes are set during product creation. To modify, you'll need to use the API endpoints or database directly. A future update will add edit functionality to the UI.

**Q: What if I don't know the ingredient cost?**
A: You can enter an estimated cost, then update it later in the Inventory section. All products using that ingredient will auto-update.

**Q: Does this work with existing products?**
A: Yes! You can add recipes to existing products using the API, and costs will calculate automatically.

**Q: Can I export profitability reports?**
A: Use the profitability API endpoint and process the JSON data. CSV export will be added in a future update.

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review `RECIPE_SYSTEM_README.md` for detailed technical info
3. Inspect browser console for JavaScript errors
4. Check PHP error logs for backend issues
5. Verify database schema with `migration_add_recipes.sql`

## 🎯 What's Changed from Previous Version

### Removed:
- ❌ Separate "Recipe & Costs" navigation menu
- ❌ Standalone recipe management page
- ❌ Recipe manager component (components/recipe-manager.html)

### Integrated:
- ✅ Recipe form now part of "Add New Product" in Menu section
- ✅ Profitability displayed directly on menu item cards
- ✅ All recipe management during product creation
- ✅ Simplified, streamlined user experience

### Benefits:
- 🎯 Fewer clicks - everything in one place
- 🎯 Better workflow - add recipe while creating product
- 🎯 Immediate feedback - see profitability before saving
- 🎯 Cleaner interface - no duplicate navigation items

---

**Version:** 2.0 (Integrated)
**Date:** 2025-01-21
**Status:** Production Ready ✅
