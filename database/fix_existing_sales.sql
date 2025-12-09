-- =====================================================
-- Fix Existing Sales Records
-- Updates old sales records to have the proper format
-- for the View Sales dashboard
-- =====================================================

USE pos_jither;

-- Step 1: Update sales_transactions to fill in missing fields
UPDATE sales_transactions
SET
    subtotal = COALESCE(subtotal, total),
    discount_amount = COALESCE(discount_amount, 0),
    tax_amount = COALESCE(tax_amount, 0),
    payment_method = COALESCE(payment_method, 'cash'),
    amount_tendered = COALESCE(amount_tendered, total),
    change_amount = COALESCE(change_amount, 0)
WHERE subtotal IS NULL OR payment_method IS NULL;

-- Step 2: Update sales_transaction_items to calculate line_total
UPDATE sales_transaction_items
SET line_total = (quantity * unit_price) - COALESCE(discount_amount, 0)
WHERE line_total IS NULL OR line_total = 0;

-- Step 3: Ensure discount_amount defaults to 0
UPDATE sales_transaction_items
SET discount_amount = 0
WHERE discount_amount IS NULL;

-- Step 4: Verify the updates
SELECT
    COUNT(*) as total_transactions,
    SUM(CASE WHEN payment_method IS NOT NULL THEN 1 ELSE 0 END) as has_payment_method,
    SUM(CASE WHEN subtotal IS NOT NULL THEN 1 ELSE 0 END) as has_subtotal
FROM sales_transactions;

SELECT
    COUNT(*) as total_items,
    SUM(CASE WHEN line_total > 0 THEN 1 ELSE 0 END) as has_line_total,
    SUM(CASE WHEN discount_amount IS NOT NULL THEN 1 ELSE 0 END) as has_discount
FROM sales_transaction_items;

SELECT '✅ Existing sales records have been fixed!' as status;
