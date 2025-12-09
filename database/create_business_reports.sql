-- =====================================================
-- BUSINESS REPORTS TABLE
-- Stores daily, weekly, monthly sales summaries
-- =====================================================

USE pos_jither;

-- Daily Business Reports Table
CREATE TABLE IF NOT EXISTS daily_business_reports (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    report_date DATE NOT NULL UNIQUE,
    total_sales DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_transactions INT UNSIGNED NOT NULL DEFAULT 0,
    total_items_sold INT UNSIGNED NOT NULL DEFAULT 0,
    average_transaction DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_discount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_vat DECIMAL(10, 2) NOT NULL DEFAULT 0,
    cash_sales DECIMAL(10, 2) NOT NULL DEFAULT 0,
    card_sales DECIMAL(10, 2) NOT NULL DEFAULT 0,
    gcash_sales DECIMAL(10, 2) NOT NULL DEFAULT 0,
    opening_time DATETIME NULL,
    closing_time DATETIME NULL,
    cashier_id INT UNSIGNED NULL,
    terminal_id VARCHAR(32) NULL,
    notes TEXT NULL,
    is_finalized BOOLEAN DEFAULT FALSE COMMENT 'Z-Read done',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_report_date (report_date),
    INDEX idx_is_finalized (is_finalized),
    CONSTRAINT fk_daily_reports_cashier FOREIGN KEY (cashier_id)
        REFERENCES users (id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Daily Item Sales Report
CREATE TABLE IF NOT EXISTS daily_item_sales (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    report_date DATE NOT NULL,
    product_id VARCHAR(64) NOT NULL,
    product_name VARCHAR(191) NOT NULL,
    category_name VARCHAR(191) NULL,
    quantity_sold INT UNSIGNED NOT NULL DEFAULT 0,
    total_revenue DECIMAL(10, 2) NOT NULL DEFAULT 0,
    average_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_date_product (report_date, product_id),
    INDEX idx_report_date (report_date),
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- View for Business Reports Dashboard
CREATE OR REPLACE VIEW v_business_reports AS
SELECT
    dbr.report_date,
    dbr.total_sales,
    dbr.total_transactions,
    dbr.total_items_sold,
    dbr.average_transaction,
    dbr.total_discount,
    dbr.total_vat,
    dbr.cash_sales,
    dbr.card_sales,
    dbr.gcash_sales,
    dbr.opening_time,
    dbr.closing_time,
    dbr.is_finalized,
    CASE
        WHEN dbr.is_finalized = TRUE THEN 'Finalized (Z-Read)'
        ELSE 'Open (X-Read)'
    END AS report_status,
    u.username AS cashier_name
FROM daily_business_reports dbr
LEFT JOIN users u ON dbr.cashier_id = u.id
ORDER BY dbr.report_date DESC;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT '✅ Business Reports tables created successfully!' AS status;
SELECT 'Tables: daily_business_reports, daily_item_sales' AS info;
SELECT 'View: v_business_reports' AS view_info;
