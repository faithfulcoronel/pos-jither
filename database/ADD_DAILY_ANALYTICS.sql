-- =====================================================
-- DAILY SALES ANALYTICS ENHANCEMENT
-- Add views and procedures for daily sales graphs/charts
-- =====================================================

USE pos_jither;

-- =====================================================
-- VIEWS FOR DAILY SALES ANALYTICS
-- =====================================================

-- Daily Sales Summary (for line charts)
CREATE OR REPLACE VIEW v_daily_sales_summary AS
SELECT
    DATE(occurred_at) AS sale_date,
    COUNT(DISTINCT id) AS total_transactions,
    SUM(subtotal) AS gross_sales,
    SUM(discount_amount) AS total_discounts,
    SUM(tax_amount) AS total_tax,
    SUM(total) AS net_sales,
    AVG(total) AS avg_transaction_value,
    MIN(total) AS min_transaction,
    MAX(total) AS max_transaction
FROM sales_transactions
GROUP BY DATE(occurred_at)
ORDER BY sale_date DESC;

-- Daily Product Sales (for product performance charts)
CREATE OR REPLACE VIEW v_daily_product_sales AS
SELECT
    DATE(st.occurred_at) AS sale_date,
    sti.product_id,
    sti.product_name,
    COUNT(*) AS times_ordered,
    SUM(sti.quantity) AS total_quantity_sold,
    SUM(sti.line_total) AS total_revenue,
    AVG(sti.unit_price) AS avg_price,
    p.cost_price,
    (SUM(sti.line_total) - (SUM(sti.quantity) * p.cost_price)) AS total_profit
FROM sales_transaction_items sti
JOIN sales_transactions st ON sti.transaction_id = st.id
LEFT JOIN products p ON sti.product_id = p.id
GROUP BY DATE(st.occurred_at), sti.product_id, sti.product_name, p.cost_price
ORDER BY sale_date DESC, total_revenue DESC;

-- Hourly Sales Distribution (for peak hours chart)
CREATE OR REPLACE VIEW v_hourly_sales_distribution AS
SELECT
    DATE(occurred_at) AS sale_date,
    HOUR(occurred_at) AS sale_hour,
    COUNT(*) AS transaction_count,
    SUM(total) AS hourly_revenue,
    AVG(total) AS avg_transaction
FROM sales_transactions
GROUP BY DATE(occurred_at), HOUR(occurred_at)
ORDER BY sale_date DESC, sale_hour ASC;

-- Top Products by Day (for pie charts)
CREATE OR REPLACE VIEW v_top_products_daily AS
SELECT
    DATE(st.occurred_at) AS sale_date,
    sti.product_name,
    SUM(sti.quantity) AS total_sold,
    SUM(sti.line_total) AS revenue,
    COUNT(DISTINCT st.id) AS order_count,
    ROUND((SUM(sti.line_total) /
           (SELECT SUM(total)
            FROM sales_transactions
            WHERE DATE(occurred_at) = DATE(st.occurred_at))) * 100, 2
    ) AS revenue_percentage
FROM sales_transaction_items sti
JOIN sales_transactions st ON sti.transaction_id = st.id
GROUP BY DATE(st.occurred_at), sti.product_name
ORDER BY sale_date DESC, revenue DESC;

-- Category Sales by Day (for category comparison)
CREATE OR REPLACE VIEW v_daily_category_sales AS
SELECT
    DATE(st.occurred_at) AS sale_date,
    pc.name AS category_name,
    COUNT(DISTINCT st.id) AS transaction_count,
    SUM(sti.quantity) AS items_sold,
    SUM(sti.line_total) AS category_revenue,
    AVG(sti.unit_price) AS avg_item_price
FROM sales_transaction_items sti
JOIN sales_transactions st ON sti.transaction_id = st.id
LEFT JOIN products p ON sti.product_id = p.id
LEFT JOIN product_categories pc ON p.category_id = pc.id
GROUP BY DATE(st.occurred_at), pc.name
ORDER BY sale_date DESC, category_revenue DESC;

-- Payment Method Distribution (for payment method chart)
CREATE OR REPLACE VIEW v_daily_payment_methods AS
SELECT
    DATE(occurred_at) AS sale_date,
    payment_method,
    COUNT(*) AS transaction_count,
    SUM(total) AS total_amount,
    ROUND((COUNT(*) /
           (SELECT COUNT(*)
            FROM sales_transactions
            WHERE DATE(occurred_at) = DATE(sales_transactions.occurred_at))) * 100, 2
    ) AS transaction_percentage
FROM sales_transactions
GROUP BY DATE(occurred_at), payment_method
ORDER BY sale_date DESC, total_amount DESC;

-- Weekly Sales Comparison
CREATE OR REPLACE VIEW v_weekly_sales_comparison AS
SELECT
    YEARWEEK(occurred_at, 1) AS week_number,
    MIN(DATE(occurred_at)) AS week_start,
    MAX(DATE(occurred_at)) AS week_end,
    COUNT(DISTINCT DATE(occurred_at)) AS days_with_sales,
    COUNT(*) AS total_transactions,
    SUM(total) AS weekly_revenue,
    AVG(total) AS avg_daily_revenue,
    MAX(total) AS peak_transaction
FROM sales_transactions
GROUP BY YEARWEEK(occurred_at, 1)
ORDER BY week_number DESC;

-- Monthly Sales Comparison
CREATE OR REPLACE VIEW v_monthly_sales_comparison AS
SELECT
    DATE_FORMAT(occurred_at, '%Y-%m') AS month,
    COUNT(DISTINCT DATE(occurred_at)) AS days_with_sales,
    COUNT(*) AS total_transactions,
    SUM(total) AS monthly_revenue,
    AVG(total) AS avg_daily_revenue,
    MIN(total) AS min_transaction,
    MAX(total) AS max_transaction
FROM sales_transactions
GROUP BY DATE_FORMAT(occurred_at, '%Y-%m')
ORDER BY month DESC;

-- Sales Trends (7-day, 30-day comparison)
CREATE OR REPLACE VIEW v_sales_trends AS
SELECT
    DATE(occurred_at) AS sale_date,
    SUM(total) AS daily_revenue,
    COUNT(*) AS daily_transactions,
    AVG(SUM(total)) OVER (ORDER BY DATE(occurred_at) ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS avg_7day_revenue,
    AVG(SUM(total)) OVER (ORDER BY DATE(occurred_at) ROWS BETWEEN 29 PRECEDING AND CURRENT ROW) AS avg_30day_revenue,
    SUM(SUM(total)) OVER (ORDER BY DATE(occurred_at) ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS rolling_7day_total,
    SUM(SUM(total)) OVER (ORDER BY DATE(occurred_at) ROWS BETWEEN 29 PRECEDING AND CURRENT ROW) AS rolling_30day_total
FROM sales_transactions
GROUP BY DATE(occurred_at)
ORDER BY sale_date DESC;

-- =====================================================
-- STORED PROCEDURES FOR CHART DATA
-- =====================================================

DELIMITER $$

-- Get daily sales for date range (for line chart)
DROP PROCEDURE IF EXISTS get_daily_sales_chart$$
CREATE PROCEDURE get_daily_sales_chart(
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    SELECT
        sale_date AS date,
        net_sales AS revenue,
        total_transactions AS transactions,
        avg_transaction_value AS avg_value
    FROM v_daily_sales_summary
    WHERE sale_date BETWEEN p_start_date AND p_end_date
    ORDER BY sale_date ASC;
END$$

-- Get top products for specific date (for pie chart)
DROP PROCEDURE IF EXISTS get_top_products_chart$$
CREATE PROCEDURE get_top_products_chart(
    IN p_date DATE,
    IN p_limit INT
)
BEGIN
    SELECT
        product_name AS label,
        revenue AS value,
        revenue_percentage AS percentage
    FROM v_top_products_daily
    WHERE sale_date = p_date
    ORDER BY revenue DESC
    LIMIT p_limit;
END$$

-- Get hourly distribution for date (for bar chart)
DROP PROCEDURE IF EXISTS get_hourly_sales_chart$$
CREATE PROCEDURE get_hourly_sales_chart(
    IN p_date DATE
)
BEGIN
    SELECT
        sale_hour AS hour,
        transaction_count AS transactions,
        hourly_revenue AS revenue,
        avg_transaction AS avg_value
    FROM v_hourly_sales_distribution
    WHERE sale_date = p_date
    ORDER BY sale_hour ASC;
END$$

-- Get category comparison (for horizontal bar chart)
DROP PROCEDURE IF EXISTS get_category_sales_chart$$
CREATE PROCEDURE get_category_sales_chart(
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    SELECT
        category_name AS category,
        SUM(category_revenue) AS total_revenue,
        SUM(items_sold) AS total_items,
        AVG(avg_item_price) AS avg_price
    FROM v_daily_category_sales
    WHERE sale_date BETWEEN p_start_date AND p_end_date
    GROUP BY category_name
    ORDER BY total_revenue DESC;
END$$

-- Get product performance over time (for multi-line chart)
DROP PROCEDURE IF EXISTS get_product_trends_chart$$
CREATE PROCEDURE get_product_trends_chart(
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_limit INT
)
BEGIN
    -- Get top products first
    WITH top_products AS (
        SELECT product_name
        FROM v_daily_product_sales
        WHERE sale_date BETWEEN p_start_date AND p_end_date
        GROUP BY product_name
        ORDER BY SUM(total_revenue) DESC
        LIMIT p_limit
    )
    SELECT
        dps.sale_date AS date,
        dps.product_name,
        dps.total_revenue AS revenue,
        dps.total_quantity_sold AS quantity
    FROM v_daily_product_sales dps
    WHERE dps.sale_date BETWEEN p_start_date AND p_end_date
      AND dps.product_name IN (SELECT product_name FROM top_products)
    ORDER BY dps.sale_date ASC, dps.total_revenue DESC;
END$$

-- Get sales comparison (today vs yesterday, this week vs last week)
DROP PROCEDURE IF EXISTS get_sales_comparison$$
CREATE PROCEDURE get_sales_comparison()
BEGIN
    SELECT
        'Today' AS period,
        COALESCE(SUM(total), 0) AS revenue,
        COALESCE(COUNT(*), 0) AS transactions,
        COALESCE(AVG(total), 0) AS avg_value
    FROM sales_transactions
    WHERE DATE(occurred_at) = CURDATE()

    UNION ALL

    SELECT
        'Yesterday' AS period,
        COALESCE(SUM(total), 0) AS revenue,
        COALESCE(COUNT(*), 0) AS transactions,
        COALESCE(AVG(total), 0) AS avg_value
    FROM sales_transactions
    WHERE DATE(occurred_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)

    UNION ALL

    SELECT
        'This Week' AS period,
        COALESCE(SUM(total), 0) AS revenue,
        COALESCE(COUNT(*), 0) AS transactions,
        COALESCE(AVG(total), 0) AS avg_value
    FROM sales_transactions
    WHERE YEARWEEK(occurred_at, 1) = YEARWEEK(CURDATE(), 1)

    UNION ALL

    SELECT
        'Last Week' AS period,
        COALESCE(SUM(total), 0) AS revenue,
        COALESCE(COUNT(*), 0) AS transactions,
        COALESCE(AVG(total), 0) AS avg_value
    FROM sales_transactions
    WHERE YEARWEEK(occurred_at, 1) = YEARWEEK(DATE_SUB(CURDATE(), INTERVAL 1 WEEK), 1)

    UNION ALL

    SELECT
        'This Month' AS period,
        COALESCE(SUM(total), 0) AS revenue,
        COALESCE(COUNT(*), 0) AS transactions,
        COALESCE(AVG(total), 0) AS avg_value
    FROM sales_transactions
    WHERE DATE_FORMAT(occurred_at, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')

    UNION ALL

    SELECT
        'Last Month' AS period,
        COALESCE(SUM(total), 0) AS revenue,
        COALESCE(COUNT(*), 0) AS transactions,
        COALESCE(AVG(total), 0) AS avg_value
    FROM sales_transactions
    WHERE DATE_FORMAT(occurred_at, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m');
END$$

-- Get dashboard summary with KPIs
DROP PROCEDURE IF EXISTS get_dashboard_summary$$
CREATE PROCEDURE get_dashboard_summary()
BEGIN
    -- Today's summary
    SELECT
        COALESCE(SUM(total), 0) AS today_revenue,
        COALESCE(COUNT(*), 0) AS today_transactions,
        COALESCE(AVG(total), 0) AS today_avg_transaction,

        (SELECT COALESCE(SUM(total), 0)
         FROM sales_transactions
         WHERE DATE(occurred_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)) AS yesterday_revenue,

        (SELECT COALESCE(COUNT(*), 0)
         FROM sales_transactions
         WHERE DATE(occurred_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)) AS yesterday_transactions,

        (SELECT COALESCE(SUM(total), 0)
         FROM sales_transactions
         WHERE YEARWEEK(occurred_at, 1) = YEARWEEK(CURDATE(), 1)) AS week_revenue,

        (SELECT COALESCE(SUM(total), 0)
         FROM sales_transactions
         WHERE DATE_FORMAT(occurred_at, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')) AS month_revenue,

        (SELECT COUNT(*)
         FROM employees
         WHERE status = 'active') AS active_employees,

        (SELECT COUNT(*)
         FROM attendance_records
         WHERE date = CURDATE() AND time_in IS NOT NULL) AS employees_clocked_in,

        (SELECT COUNT(*)
         FROM inventory_items
         WHERE quantity <= min_stock) AS low_stock_items,

        (SELECT COUNT(*)
         FROM products) AS total_products
    FROM sales_transactions
    WHERE DATE(occurred_at) = CURDATE();
END$$

DELIMITER ;

-- =====================================================
-- SAMPLE FUNCTION: Calculate Growth Percentage
-- =====================================================

DELIMITER $$

DROP FUNCTION IF EXISTS calculate_growth_percentage$$
CREATE FUNCTION calculate_growth_percentage(
    current_value DECIMAL(10,2),
    previous_value DECIMAL(10,2)
)
RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
    DECLARE growth DECIMAL(10,2);

    IF previous_value = 0 THEN
        RETURN 100.00;
    END IF;

    SET growth = ((current_value - previous_value) / previous_value) * 100;
    RETURN ROUND(growth, 2);
END$$

DELIMITER ;

-- =====================================================
-- INSERT MORE SAMPLE DATA FOR BETTER CHARTS
-- =====================================================

-- Add sales for the last 30 days
INSERT INTO sales_transactions (reference, subtotal, total, payment_method, occurred_at) VALUES
    ('106', 240.00, 240.00, 'cash', DATE_SUB(CURDATE(), INTERVAL 1 DAY) + INTERVAL 9 HOUR),
    ('107', 350.00, 350.00, 'card', DATE_SUB(CURDATE(), INTERVAL 1 DAY) + INTERVAL 10 HOUR),
    ('108', 180.00, 180.00, 'cash', DATE_SUB(CURDATE(), INTERVAL 1 DAY) + INTERVAL 14 HOUR),
    ('109', 420.00, 420.00, 'gcash', DATE_SUB(CURDATE(), INTERVAL 1 DAY) + INTERVAL 16 HOUR),

    ('110', 280.00, 280.00, 'cash', DATE_SUB(CURDATE(), INTERVAL 2 DAY) + INTERVAL 8 HOUR),
    ('111', 390.00, 390.00, 'card', DATE_SUB(CURDATE(), INTERVAL 2 DAY) + INTERVAL 11 HOUR),
    ('112', 220.00, 220.00, 'cash', DATE_SUB(CURDATE(), INTERVAL 2 DAY) + INTERVAL 15 HOUR),

    ('113', 310.00, 310.00, 'cash', DATE_SUB(CURDATE(), INTERVAL 3 DAY) + INTERVAL 9 HOUR),
    ('114', 260.00, 260.00, 'card', DATE_SUB(CURDATE(), INTERVAL 3 DAY) + INTERVAL 13 HOUR),
    ('115', 180.00, 180.00, 'gcash', DATE_SUB(CURDATE(), INTERVAL 3 DAY) + INTERVAL 17 HOUR),

    ('116', 450.00, 450.00, 'cash', DATE_SUB(CURDATE(), INTERVAL 4 DAY) + INTERVAL 10 HOUR),
    ('117', 320.00, 320.00, 'card', DATE_SUB(CURDATE(), INTERVAL 4 DAY) + INTERVAL 14 HOUR),

    ('118', 290.00, 290.00, 'cash', DATE_SUB(CURDATE(), INTERVAL 5 DAY) + INTERVAL 9 HOUR),
    ('119', 380.00, 380.00, 'cash', DATE_SUB(CURDATE(), INTERVAL 5 DAY) + INTERVAL 12 HOUR),
    ('120', 240.00, 240.00, 'card', DATE_SUB(CURDATE(), INTERVAL 5 DAY) + INTERVAL 16 HOUR),

    ('121', 360.00, 360.00, 'cash', DATE_SUB(CURDATE(), INTERVAL 6 DAY) + INTERVAL 10 HOUR),
    ('122', 270.00, 270.00, 'gcash', DATE_SUB(CURDATE(), INTERVAL 6 DAY) + INTERVAL 15 HOUR),

    ('123', 410.00, 410.00, 'cash', DATE_SUB(CURDATE(), INTERVAL 7 DAY) + INTERVAL 11 HOUR),
    ('124', 330.00, 330.00, 'card', DATE_SUB(CURDATE(), INTERVAL 7 DAY) + INTERVAL 14 HOUR);

-- Add corresponding transaction items
INSERT INTO sales_transaction_items (transaction_id, product_id, product_name, quantity, unit_price, line_total) VALUES
    -- Day -1
    ((SELECT id FROM sales_transactions WHERE reference = '106'), 'latte', 'Latte', 2, 110.00, 220.00),
    ((SELECT id FROM sales_transactions WHERE reference = '107'), 'cappuccino', 'Cappuccino', 2, 120.00, 240.00),
    ((SELECT id FROM sales_transactions WHERE reference = '107'), 'espresso', 'Espresso', 1, 80.00, 80.00),
    ((SELECT id FROM sales_transactions WHERE reference = '108'), 'mocha', 'Mocha', 1, 130.00, 130.00),
    ((SELECT id FROM sales_transactions WHERE reference = '109'), 'caramel-macchiato', 'Caramel Macchiato', 3, 140.00, 420.00),

    -- Day -2
    ((SELECT id FROM sales_transactions WHERE reference = '110'), 'latte', 'Latte', 2, 110.00, 220.00),
    ((SELECT id FROM sales_transactions WHERE reference = '111'), 'cappuccino', 'Cappuccino', 3, 120.00, 360.00),
    ((SELECT id FROM sales_transactions WHERE reference = '112'), 'americano', 'Americano', 2, 90.00, 180.00),

    -- Day -3
    ((SELECT id FROM sales_transactions WHERE reference = '113'), 'mocha', 'Mocha', 2, 130.00, 260.00),
    ((SELECT id FROM sales_transactions WHERE reference = '114'), 'latte', 'Latte', 2, 110.00, 220.00),
    ((SELECT id FROM sales_transactions WHERE reference = '115'), 'cappuccino', 'Cappuccino', 1, 120.00, 120.00),

    -- Continue pattern...
    ((SELECT id FROM sales_transactions WHERE reference = '116'), 'caramel-macchiato', 'Caramel Macchiato', 3, 140.00, 420.00),
    ((SELECT id FROM sales_transactions WHERE reference = '117'), 'cappuccino', 'Cappuccino', 2, 120.00, 240.00),
    ((SELECT id FROM sales_transactions WHERE reference = '118'), 'latte', 'Latte', 2, 110.00, 220.00),
    ((SELECT id FROM sales_transactions WHERE reference = '119'), 'mocha', 'Mocha', 2, 130.00, 260.00),
    ((SELECT id FROM sales_transactions WHERE reference = '120'), 'cappuccino', 'Cappuccino', 2, 120.00, 240.00),
    ((SELECT id FROM sales_transactions WHERE reference = '121'), 'caramel-macchiato', 'Caramel Macchiato', 2, 140.00, 280.00),
    ((SELECT id FROM sales_transactions WHERE reference = '122'), 'latte', 'Latte', 2, 110.00, 220.00),
    ((SELECT id FROM sales_transactions WHERE reference = '123'), 'cappuccino', 'Cappuccino', 3, 120.00, 360.00),
    ((SELECT id FROM sales_transactions WHERE reference = '124'), 'mocha', 'Mocha', 2, 130.00, 260.00);

-- =====================================================
-- ANALYTICS ENHANCEMENT COMPLETE!
-- =====================================================

SELECT '✅ Daily Analytics Views and Procedures Created!' AS status;
SELECT '9 Views | 7 Procedures | 1 Function' AS components;
SELECT 'Sample data added for last 7 days' AS data_info;

-- Test the views
SELECT '=== DAILY SALES SUMMARY (Last 7 Days) ===' AS test;
SELECT * FROM v_daily_sales_summary LIMIT 7;

SELECT '=== TOP PRODUCTS TODAY ===' AS test;
SELECT * FROM v_top_products_daily WHERE sale_date = CURDATE() LIMIT 5;

-- Test procedures
SELECT '=== DASHBOARD SUMMARY ===' AS test;
CALL get_dashboard_summary();
