# 💳 Discount & VAT System Guide
## Philippine Tax-Compliant POS System

---

## 🎯 Overview

Your POS system now includes:
- ✅ **Preset Discount Types** (Senior Citizen, PWD, etc.)
- ✅ **Automatic Discount Calculation** (20% for SC/PWD)
- ✅ **VAT Calculation** (12% Philippine VAT)
- ✅ **VAT-Exempt Transactions** (for SC/PWD)
- ✅ **Receipt Display** showing all discount and tax details

---

## 📊 Database Structure

### **sales_transactions Table - New Fields**

```sql
discount_type VARCHAR(50)         -- Type: 'Senior Citizen', 'PWD', 'Regular', etc.
vat_exempt_amount DECIMAL(10,2)   -- Amount exempt from VAT
vatable_amount DECIMAL(10,2)      -- Amount subject to 12% VAT
vat_amount DECIMAL(10,2)          -- Actual 12% VAT amount
```

---

## 🏷️ Discount Types & Rates

### **1. Senior Citizen (60 years old and above)**
- **Discount:** 20%
- **VAT:** Exempt
- **Required:** Valid Senior Citizen ID

### **2. PWD (Person with Disability)**
- **Discount:** 20%
- **VAT:** Exempt
- **Required:** Valid PWD ID

### **3. National Athlete**
- **Discount:** 20%
- **VAT:** Not exempt
- **Required:** Athlete ID

### **4. Regular Customer**
- **Discount:** 0%
- **VAT:** 12% (standard)

---

## 🧮 Calculation Examples

### **Example 1: Senior Citizen Purchase**

```
Items Total:        ₱1,000.00
Senior Discount:    -₱200.00  (20%)
──────────────────────────────
Subtotal:           ₱800.00
VAT (12%):          ₱0.00     (VAT-EXEMPT)
──────────────────────────────
TOTAL:              ₱800.00

Discount Type: Senior Citizen
```

### **Example 2: PWD Purchase**

```
Items Total:        ₱500.00
PWD Discount:       -₱100.00  (20%)
──────────────────────────────
Subtotal:           ₱400.00
VAT (12%):          ₱0.00     (VAT-EXEMPT)
──────────────────────────────
TOTAL:              ₱400.00

Discount Type: PWD
```

### **Example 3: Regular Customer (with VAT)**

```
Items Total:        ₱1,000.00
Discount:           ₱0.00
──────────────────────────────
Subtotal:           ₱1,000.00
Vatable Sales:      ₱892.86   (1000 / 1.12)
VAT (12%):          ₱107.14   (892.86 × 0.12)
──────────────────────────────
TOTAL:              ₱1,000.00

Discount Type: Regular
```

---

## 🎨 UI/UX Flow

### **Cashier Workflow:**

1. **Scan/Add Items** to cart
2. **Click "Discount" button**
3. **Select Discount Type:**
   ```
   ┌────────────────────────────┐
   │   Select Discount Type     │
   ├────────────────────────────┤
   │ ⚪ No Discount             │
   │ ⚪ Senior Citizen (20%)    │
   │ ⚪ PWD (20%)               │
   │ ⚪ National Athlete (20%)  │
   └────────────────────────────┘
   ```
4. **Automatic Calculation:**
   - Discount amount calculated instantly
   - VAT exemption applied if eligible
   - Totals updated in real-time

5. **Receipt Shows:**
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━
   Subtotal:        ₱1,000.00
   SC Discount:       -₱200.00
   ━━━━━━━━━━━━━━━━━━━━━━━━━━
   Vatable Sales:       ₱0.00
   VAT-Exempt:        ₱800.00
   VAT (12%):           ₱0.00
   ━━━━━━━━━━━━━━━━━━━━━━━━━━
   TOTAL:             ₱800.00

   Discount: Senior Citizen
   ```

---

## 📝 Receipt Template

### **With Senior Citizen Discount:**

```
════════════════════════════════
   JOWEN'S KITCHEN & CAFE
     Tax Invoice / Receipt
════════════════════════════════
Date: 11/26/2025 10:30 AM
Receipt #: RCP-20251126-001

Cashier: Elsa
Customer Type: SENIOR CITIZEN
════════════════════════════════

ITEMS:
Espresso (Hot)    ₱120.00 × 2  ₱240.00
Cappuccino        ₱150.00 × 1  ₱150.00
Croissant         ₱ 80.00 × 3  ₱240.00

────────────────────────────────
Subtotal:                 ₱630.00
SC Discount (20%):       -₱126.00
────────────────────────────────
                         ₱504.00

VAT Breakdown:
  Vatable Sales:           ₱0.00
  VAT-Exempt Sales:      ₱504.00
  VAT (12%):               ₱0.00
────────────────────────────────
TOTAL:                   ₱504.00
════════════════════════════════

Payment: Cash
Tendered:                ₱600.00
Change:                   ₱96.00

════════════════════════════════
Thank you for your purchase!
  VAT Reg TIN: 123-456-789-000
════════════════════════════════
```

### **Without Discount (Regular):**

```
════════════════════════════════
   JOWEN'S KITCHEN & CAFE
     Tax Invoice / Receipt
════════════════════════════════
Date: 11/26/2025 10:30 AM
Receipt #: RCP-20251126-002

Cashier: Elsa
════════════════════════════════

ITEMS:
Espresso (Hot)    ₱120.00 × 2  ₱240.00
Cappuccino        ₱150.00 × 1  ₱150.00

────────────────────────────────
Subtotal:                 ₱390.00

VAT Breakdown:
  Vatable Sales:         ₱348.21
  VAT (12%):              ₱41.79
────────────────────────────────
TOTAL:                   ₱390.00
════════════════════════════════

Payment: Cash
Tendered:                ₱400.00
Change:                   ₱10.00

════════════════════════════════
Thank you for your purchase!
  VAT Reg TIN: 123-456-789-000
════════════════════════════════
```

---

## 🔧 Implementation Steps

### **Step 1: Run the Migration**

```bash
mysql -u root -p pos_jither < database/add_discount_type_and_vat.sql
```

### **Step 2: Test the System**

1. Go to Cashier POS
2. Add items to cart
3. Click "Discount" button
4. Select "Senior Citizen"
5. Verify:
   - 20% discount applied
   - VAT shows ₱0.00
   - Receipt shows "Senior Citizen" discount

---

## 📊 Reports & Analytics

### **Query: Daily Discount Summary**

```sql
SELECT * FROM v_discount_statistics
WHERE sale_date = CURDATE();
```

**Returns:**
- Transactions per discount type
- Total discount amounts
- Discount percentages

### **Query: VAT Summary**

```sql
SELECT
    DATE(occurred_at) AS date,
    SUM(vatable_amount) AS total_vatable,
    SUM(vat_exempt_amount) AS total_exempt,
    SUM(vat_amount) AS total_vat,
    SUM(total) AS gross_sales
FROM sales_transactions
WHERE DATE(occurred_at) = CURDATE()
GROUP BY DATE(occurred_at);
```

---

## ⚖️ Legal Compliance (Philippines)

### **BIR Requirements:**

✅ **Senior Citizen Act** (RA 9994, RA 9257)
- 20% discount
- VAT-exempt
- Must present valid ID

✅ **PWD Act** (RA 10754, RA 7277)
- 20% discount
- VAT-exempt
- Must present valid PWD ID

✅ **VAT Reporting**
- Separate vatable and VAT-exempt sales
- 12% VAT clearly shown on receipts
- Proper TIN display

---

## 🎯 Quick Reference

| Discount Type | Rate | VAT | ID Required |
|---------------|------|-----|-------------|
| Senior Citizen | 20% | Exempt | Yes |
| PWD | 20% | Exempt | Yes |
| National Athlete | 20% | 12% | Yes |
| Regular | 0% | 12% | No |

---

**System is now fully compliant with Philippine tax laws!** 🇵🇭
