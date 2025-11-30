# Inventify-Style Inventory Management System

## 🎨 Overview

A modern, clean inventory management system inspired by Inventify's green/white design. Features comprehensive stock tracking, automatic calculations, and beautiful UI.

## ✨ Key Features

### 1. **Clean Modern UI**
- ✅ Green and white color scheme
- ✅ Card-based summary dashboard
- ✅ Responsive design
- ✅ Smooth animations and transitions

### 2. **Inventory List View**
Displays:
- ID
- Description (Item Name)
- SKU / Barcode
- Category
- Available Quantity
- Status with color-coded badges
- Status Percentage (visual progress bar)
- Reorder Level
- Location
- Action buttons (Edit/Delete)

### 3. **Multiple Tabs**
- **📦 Stock**: Main inventory list with all items
- **💵 Cost**: Cost analysis and pricing view
- **📈 Activities**: Stock movement history (inflows/outflows)
- **🔍 Audit Logs**: Complete audit trail (coming soon)

### 4. **Advanced Item Management**
Fields when adding/editing items:
- Item Name *
- Category * (Beverages, Food, Supplies, Raw Materials, Equipment, General)
- Unit of Measurement * (g, ml, pcs, kg, L, oz)
- Unit Size * (e.g., 1000 for 1kg bag)
- Purchase Cost * (cost to buy one full unit)
- **Cost per Unit** (AUTO-CALCULATED: cost ÷ unit_size)
- SKU / Barcode
- Initial Quantity *
- Reorder Level *
- Max Stock
- Location (storage location)
- Barcode
- Notes

### 5. **Automatic Calculations**

**Cost Per Unit Formula:**
```
cost_per_unit = purchase_cost / unit_size
```

**Example:**
```
Purchase Cost: ₱500 (for 1kg bag)
Unit Size: 1000g
Cost Per Unit: ₱500 / 1000 = ₱0.50 per gram
```

**Total Value:**
```
total_value = available_quantity × cost_per_unit
```

**Status Calculation:**
```
if quantity <= 0: Out of Stock
else if quantity <= reorder_level: Below Reorder Level
else if quantity <= (reorder_level × 1.5): Low Stock
else: In Stock
```

**Status Percentage:**
```
status_percentage = (quantity / max_stock) × 100
```

### 6. **Stock Status Types**

| Status | Color | Condition |
|--------|-------|-----------|
| 🟢 **In Stock** | Green | quantity > reorder_level × 1.5 |
| 🟡 **Low Stock** | Yellow | quantity ≤ reorder_level × 1.5 |
| 🟠 **Below Reorder** | Orange | quantity ≤ reorder_level |
| 🔴 **Out of Stock** | Red | quantity ≤ 0 |

### 7. **Summary Dashboard**

Top cards showing:
- 📊 **Total Items**: Count of all inventory items
- 💰 **Current Value**: Total inventory value (₱)
- ⚠️ **Low Stock Items**: Items needing attention
- 🔴 **Out of Stock**: Items that need immediate restocking

### 8. **Search & Filters**
- 🔍 Search by name, SKU, or category
- Filter by category dropdown
- Filter by status dropdown
- Export to CSV

### 9. **Movement History**
When editing an item, view:
- Inflow movements (📥 purchases, adjustments in)
- Outflow movements (📤 sales, adjustments out)
- Timestamp and notes for each movement

### 10. **Bulk Add Feature**
CSV format:
```
Name, Category, Unit, Unit Size, Cost, Quantity, Reorder Level, Location, SKU
Coffee Beans,Raw Materials,g,1000,500,5000,1000,Storage Room A,SKU-001
Milk,Beverages,ml,1000,80,25000,5000,Refrigerator,SKU-002
```

## 📂 Installation

### Step 1: Run Database Migration

```bash
mysql -u root -p pos_jither < database/migration_inventify_inventory.sql
```

This creates:
- New columns in `inventory_items` table
- `inventory_audit_logs` table
- `inventory_categories` table
- Views for list and movements
- Triggers for auto-calculations
- Stored procedures

### Step 2: Link Files in index.php

Add to `<head>`:
```html
<link rel="stylesheet" href="css/inventify-theme.css" />
```

Replace old inventory section with:
```php
<?php include __DIR__ . '/components/inventify-inventory.html'; ?>
```

Add before `</body>`:
```html
<script src="js/inventify-inventory.js"></script>
```

### Step 3: Update Navigation

Change showManagerContent() to call:
```javascript
if (id === 'inventory') {
    initializeInventify();
}
```

## 🎯 Usage Guide

### Adding a New Item

1. Click **"➕ Add Item"** button
2. Fill in required fields (marked with *)
3. Enter **Unit Size** and **Purchase Cost**
4. **Cost Per Unit** automatically calculates
5. Set **Initial Quantity** and **Reorder Level**
6. Add optional: Location, SKU, Barcode, Notes
7. Click **"Save Item"**

### Example: Coffee Beans

```
Item Name: Coffee Beans
Category: Raw Materials
Unit: g (grams)
Unit Size: 1000 (1kg bag)
Purchase Cost: ₱500
→ Cost Per Unit: ₱0.50/g (auto-calculated)
Initial Quantity: 5000g
Reorder Level: 1000g
Location: Storage Room A
SKU: SKU-001
```

### Editing an Item

1. Click **✏️ Edit** button on any item
2. Modify fields as needed
3. View **Movement History** at the bottom
4. Click **"Save Item"**

### Viewing Stock Status

Items show:
- **Progress Bar**: Visual representation of stock level
- **Status Badge**: Color-coded status label
- **Percentage**: Numeric status percentage

### Filtering & Searching

1. **Search Bar**: Type name, SKU, or category
2. **Category Filter**: Select specific category
3. **Status Filter**: Filter by stock status
4. Filters work together (AND logic)

### Exporting Data

1. Apply desired filters
2. Click **"📥 Export"** button
3. CSV file downloads with filtered data

### Bulk Adding Items

1. Click **"📋 Bulk Add"** button
2. Paste CSV data (comma-separated)
3. Format: Name,Category,Unit,UnitSize,Cost,Qty,Reorder,Location,SKU
4. Click **"Add Items"**

## 🔧 API Integration

### Auto-Update on Checkout

The system integrates with POS checkout to automatically deduct stock when products are sold. This was already implemented in the recipe system.

When a product is sold:
```
1. Sale transaction created
2. Recipe ingredients identified
3. For each ingredient:
   - Deduct quantity from inventory
   - Log stock movement
   - Update item status
   - Check reorder level
4. Generate alerts if needed
```

### Backend API Endpoints

**Get Inventory with Costs:**
```
GET /php/api.php?resource=inventory-with-cost
```

**Create Item:**
```
POST /php/api.php
{
  "resource": "inventory",
  "action": "create",
  "data": {
    "item": "Coffee Beans",
    "category": "Raw Materials",
    "unit": "g",
    "unit_size": 1000,
    "purchase_cost": 500,
    "quantity": 5000,
    "reorder_level": 1000,
    "location": "Storage Room A",
    "sku": "SKU-001"
  }
}
```

**Update Item:**
```
POST /php/api.php
{
  "resource": "inventory",
  "action": "update",
  "data": {
    "id": 1,
    "item": "Updated Name",
    ...
  }
}
```

**Delete Item:**
```
POST /php/api.php
{
  "resource": "inventory",
  "action": "delete",
  "data": { "id": 1 }
}
```

## 🎨 Design System

### Colors

```css
Primary Green: #10B981
Primary Dark: #059669
Primary Light: #D1FAE5
Secondary Blue: #3B82F6
Danger Red: #EF4444
Warning Orange: #F59E0B
Background: #F9FAFB
White: #FFFFFF
```

### Typography

- Titles: 28px, Bold (700)
- Headers: 20px, Bold (700)
- Labels: 14px, Semi-Bold (600)
- Body: 14px, Regular (400)
- Small: 12px, Regular (400)

### Spacing

- Cards: 24px padding
- Grid Gap: 16px
- Button Padding: 12px 24px
- Input Padding: 12px 16px

## 📊 Database Schema

### New/Updated Columns in `inventory_items`

```sql
category VARCHAR(64) - Item category
unit_size DECIMAL(10,2) - Size of one unit
purchase_cost DECIMAL(10,2) - Cost to buy full unit
cost_per_unit DECIMAL(10,4) - AUTO: purchase_cost / unit_size
sku VARCHAR(64) - Stock Keeping Unit
location VARCHAR(191) - Storage location
status VARCHAR(32) - Current stock status
last_restocked DATETIME - Last restock date
notes TEXT - Additional notes
```

### Automatic Triggers

**Before Insert/Update:**
- Calculate `cost_per_unit` from `purchase_cost` and `unit_size`
- Set `status` based on `quantity` and `reorder_level`
- Update `last_restocked` when quantity increases

## 🚀 Benefits

1. **Clean Interface** - Easy to use, modern design
2. **Auto-Calculations** - No manual math needed
3. **Real-Time Status** - Visual indicators for stock levels
4. **Complete Tracking** - Movement history and audit logs
5. **Smart Alerts** - Automatic reorder notifications
6. **Flexible Units** - Support for any measurement type
7. **Export Ready** - CSV export for external analysis
8. **Mobile Responsive** - Works on all devices

## 📱 Responsive Design

The system adapts to different screen sizes:
- **Desktop**: Full grid layout with all columns
- **Tablet**: Adjusted columns, stacked filters
- **Mobile**: Single column, touch-optimized buttons

## 🔔 Reorder Notifications

System automatically triggers alerts when:
```
quantity <= reorder_level
```

Alerts appear in:
- Dashboard summary (⚠️ Low Stock Items count)
- Item status badges (🟠 Below Reorder Level)
- Status filters (filter by "below_reorder")

## 📈 Future Enhancements

Planned features:
- ✅ Complete audit log implementation
- ✅ Barcode scanning integration
- ✅ Multi-location support
- ✅ Batch/lot tracking
- ✅ Expiry date management
- ✅ Supplier integration
- ✅ Auto-purchase orders
- ✅ Advanced analytics

## 🆘 Troubleshooting

**Cost per unit not calculating:**
- Ensure `unit_size` > 0
- Check database triggers are active
- Verify `purchase_cost` is set

**Status not updating:**
- Check `reorder_level` is set
- Verify `max_stock` for percentage calculation
- Review trigger logic

**Items not showing:**
- Check database migration ran successfully
- Verify API endpoint returns data
- Check browser console for errors

## 📚 Files Structure

```
├── database/
│   └── migration_inventify_inventory.sql
├── css/
│   └── inventify-theme.css
├── js/
│   └── inventify-inventory.js
├── components/
│   └── inventify-inventory.html
└── INVENTIFY_SYSTEM_GUIDE.md
```

---

**Version:** 1.0
**Date:** 2025-01-21
**Status:** Ready for Production ✅
