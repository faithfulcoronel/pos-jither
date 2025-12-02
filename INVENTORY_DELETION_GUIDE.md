# Inventory Item Deletion - Error and Solutions

## Common Error

```
Error: Cannot delete or update a parent row: a foreign key constraint fails
(`pos_jither`.`product_recipes`, CONSTRAINT `fk_recipe_inventory`
FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items` (`id`))
```

## What This Means

This error occurs when you try to delete an inventory item that is currently being used as an ingredient in one or more product recipes. The database prevents deletion to protect data integrity and ensure your recipes remain valid.

## Why This Protection Exists

The foreign key constraint ensures that:
1. ✅ Product recipes always reference valid ingredients
2. ✅ You can't accidentally break recipes by deleting ingredients
3. ✅ Historical data remains accurate and traceable
4. ✅ Inventory deductions continue to work properly

## Solutions

### Solution 1: Remove from Recipes First (Recommended)

Before deleting an inventory item, remove it from all product recipes:

**Steps:**
1. Go to **Manager Dashboard → Menu Items**
2. For each product using this ingredient:
   - Click on the product
   - Scroll to "Recipe & Ingredients" section
   - Find the ingredient you want to delete
   - Click the **Delete/Remove** button next to it
3. After removing from all recipes, you can delete the inventory item

**Example:**
```
You want to delete: "Vanilla Syrup"

1. Find products using Vanilla Syrup:
   - Caramel Macchiato (uses 20ml)
   - Vanilla Latte (uses 15ml)

2. Edit each recipe:
   - Remove Vanilla Syrup from Caramel Macchiato recipe
   - Remove Vanilla Syrup from Vanilla Latte recipe

3. Now you can delete "Vanilla Syrup" from inventory
```

### Solution 2: Replace the Ingredient

If you're switching to a different ingredient, update the recipes instead:

**Steps:**
1. Add the new inventory item (if not already added)
2. Go to **Manager Dashboard → Menu Items**
3. For each product:
   - Edit the recipe
   - Remove the old ingredient
   - Add the new ingredient with correct quantity
4. Delete the old inventory item

**Example:**
```
Switching from "Whole Milk" to "Oat Milk":

1. Add "Oat Milk" to inventory
2. Update recipes:
   - Cappuccino: Replace Whole Milk (150ml) with Oat Milk (150ml)
   - Latte: Replace Whole Milk (200ml) with Oat Milk (200ml)
3. Delete "Whole Milk" from inventory
```

### Solution 3: Set Quantity to Zero (Keep Item)

If you don't want to delete the item completely, just mark it as out of stock:

**Steps:**
1. Go to **Manager Dashboard → Inventory Management**
2. Find the item
3. Click **Quick Adjust** or **Edit**
4. Set quantity to **0**
5. Add note: "Discontinued" or "No longer used"

**Benefits:**
- ✅ Preserves recipe integrity
- ✅ Maintains historical data
- ✅ Can reactivate later if needed
- ✅ Shows in reports as "out of stock"

### Solution 4: Archive/Disable Feature (Future Enhancement)

> **Note**: This feature is not yet implemented but could be added

Instead of deleting, mark items as "archived" or "inactive":
- Item remains in database
- Not shown in active inventory lists
- Recipes remain intact
- Historical data preserved

## Prevention: Before Deleting

The system now provides helpful error messages when deletion is blocked:

### Error Message 1: Used in Recipes
```
Cannot delete this inventory item because it is used in the recipe for:
Cappuccino, Latte, Mocha.

Please remove it from all product recipes first, or edit the recipes
to use a different ingredient.
```

**Action**: Follow Solution 1 or 2 above

### Error Message 2: Has Stock Movement History
```
Cannot delete this inventory item because it has stock movement history.
This ensures data integrity for your inventory records.

Consider setting the quantity to 0 instead of deleting.
```

**Action**: Follow Solution 3 above

## Checking Which Products Use an Ingredient

To find which products use a specific inventory item:

**Method 1: Database Query**
```sql
SELECT p.name as product_name, pr.quantity, pr.unit
FROM product_recipes pr
JOIN products p ON pr.product_id = p.id
WHERE pr.inventory_item_id = (
    SELECT id FROM inventory_items WHERE item = 'Coffee Beans'
)
```

**Method 2: Manager Dashboard**
1. Go to each product in Menu Items
2. Check the "Recipe & Ingredients" section
3. Look for the ingredient you're investigating

## Safe Deletion Checklist

Before deleting an inventory item, verify:

- [ ] Item is not used in any product recipes
- [ ] Item has no stock movement history, OR
- [ ] You're okay losing the historical data
- [ ] You have a backup of the database (optional but recommended)
- [ ] All affected recipes have been updated with alternative ingredients

## Example Workflow: Deleting "Chocolate Syrup"

**1. Check Usage**
- Mocha uses 30ml Chocolate Syrup
- Hot Chocolate uses 50ml Chocolate Syrup

**2. Decide on Action**
- Option A: Remove from recipes (discontinue chocolate drinks)
- Option B: Replace with "Dark Chocolate Sauce"
- Option C: Set quantity to 0 (keep recipes, mark out of stock)

**3. Execute (Option B - Replace)**
```
Step 1: Add "Dark Chocolate Sauce" to inventory
Step 2: Update Mocha recipe:
  - Remove: Chocolate Syrup (30ml)
  - Add: Dark Chocolate Sauce (30ml)
Step 3: Update Hot Chocolate recipe:
  - Remove: Chocolate Syrup (50ml)
  - Add: Dark Chocolate Sauce (50ml)
Step 4: Delete "Chocolate Syrup" from inventory ✅
```

## Database Relationship

Understanding the constraint:

```
inventory_items (parent)
    ↓
    id (primary key)
    ↓
product_recipes (child)
    ↓
    inventory_item_id (foreign key)
```

**Rule**: You cannot delete a parent row if child rows reference it.

**Protection Type**: `ON DELETE RESTRICT`
- Prevents accidental deletion
- Preserves data integrity
- Forces intentional cleanup

## Technical Details

**Files Modified:**
- [php/data_functions.php](php/data_functions.php#L480-L527) - Enhanced deletion with dependency checks

**Database Tables:**
- `inventory_items` - Parent table (ingredients)
- `product_recipes` - Child table (recipe ingredients)
- `stock_movements` - Audit trail (inventory history)

**Foreign Key Constraint:**
```sql
CONSTRAINT `fk_recipe_inventory`
FOREIGN KEY (`inventory_item_id`)
REFERENCES `inventory_items` (`id`)
ON DELETE RESTRICT
```

## Summary

✅ **The error is a feature, not a bug** - it protects your data
✅ **Three main solutions**: Remove from recipes, replace ingredient, or set to zero
✅ **Enhanced error messages** now tell you which products are affected
✅ **Data integrity** is maintained throughout the system

When you see this error, it's the database protecting you from breaking your product recipes. Follow the solutions above to safely manage your inventory items.
