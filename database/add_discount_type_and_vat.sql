-- ====================================================================
-- Add Discount Type and VAT Calculation Fields
-- ====================================================================
-- This migration adds discount_type field to track customer discount categories
-- and enhances VAT calculation for Philippine tax requirements
-- ====================================================================

USE pos_jither;

-- Add discount_type to sales_transactions table
ALTER TABLE sales_transactions
ADD COLUMN discount_type VARCHAR(50) NULL COMMENT 'Type of discount: Senior Citizen, PWD, Regular Customer, etc.' AFTER discount_amount;

-- Add VAT fields for detailed tax breakdown
ALTER TABLE sales_transactions
ADD COLUMN vat_exempt_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 COMMENT 'Amount exempt from VAT' AFTER tax_amount,
ADD COLUMN vatable_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 COMMENT 'Amount subject to VAT' AFTER vat_exempt_amount,
ADD COLUMN vat_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 COMMENT '12% VAT amount' AFTER vatable_amount;

-- Update existing records to calculate VAT (assuming 12% VAT is already included in prices)
-- Philippine VAT calculation: VAT = (Total / 1.12) * 0.12
UPDATE sales_transactions
SET
    vatable_amount = ROUND((total - discount_amount) / 1.12, 2),
    vat_amount = ROUND(((total - discount_amount) / 1.12) * 0.12, 2)
WHERE tax_amount > 0;

-- Create view for discount statistics
CREATE OR REPLACE VIEW v_discount_statistics AS
SELECT
    DATE(occurred_at) AS sale_date,
    discount_type,
    COUNT(*) AS transaction_count,
    SUM(discount_amount) AS total_discount_amount,
    SUM(subtotal) AS total_subtotal,
    SUM(total) AS total_sales,
    AVG(discount_amount) AS avg_discount_amount,
    ROUND((SUM(discount_amount) / SUM(subtotal)) * 100, 2) AS discount_percentage
FROM sales_transactions
WHERE discount_type IS NOT NULL
GROUP BY DATE(occurred_at), discount_type
ORDER BY sale_date DESC, total_discount_amount DESC;

-- ====================================================================
-- Philippine Discount Rates (As of 2025)
-- ====================================================================
-- Senior Citizen (60+): 20% discount + VAT exempt
-- PWD (Person with Disability): 20% discount + VAT exempt
-- Athlete (National Athletes): 20% discount
-- Solo Parent: Based on local ordinance (usually 5-10%)
-- ====================================================================

COMMIT;

SELECT 'Migration completed successfully!' AS Status;
