<?php
/**
 * Setup Business Reports - Create Daily Summary Tables
 * Run this once to enable automatic daily summary system
 *
 * URL: http://localhost/pos-jither-main/setup_business_reports.php
 */

require_once __DIR__ . '/php/db_connect.php';

ini_set('display_errors', 1);
error_reporting(E_ALL);

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Setup Business Reports</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 700px;
            width: 100%;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 28px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
        }
        .status {
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
            font-weight: 500;
        }
        .status.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .status.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .status.info {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
        .icon {
            font-size: 24px;
            margin-right: 10px;
        }
        .details {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .details h3 {
            color: #333;
            margin-bottom: 15px;
        }
        .feature {
            padding: 8px 0;
            display: flex;
            align-items: center;
        }
        .feature-icon {
            margin-right: 10px;
        }
        .back-link {
            display: inline-block;
            margin-top: 30px;
            padding: 12px 24px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 500;
            transition: background 0.3s;
        }
        .back-link:hover {
            background: #5568d3;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Setup Business Reports</h1>
        <p class="subtitle">Creating daily summary and auto-reset system</p>

<?php
try {
    // Check if daily_business_reports table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'daily_business_reports'");
    $reportsTableExists = $stmt->rowCount() > 0;

    $stmt = $pdo->query("SHOW TABLES LIKE 'daily_item_sales'");
    $itemSalesTableExists = $stmt->rowCount() > 0;

    if ($reportsTableExists && $itemSalesTableExists) {
        echo '<div class="status info">';
        echo '<span class="icon">ℹ️</span>';
        echo 'Business Reports system is already set up!';
        echo '</div>';
    } else {
        // Create daily_business_reports table
        if (!$reportsTableExists) {
            echo '<div class="status info">';
            echo '<span class="icon">⚙️</span>';
            echo 'Creating daily_business_reports table...';
            echo '</div>';

            $pdo->exec("
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
                    INDEX idx_is_finalized (is_finalized)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");

            echo '<div class="status success">';
            echo '<span class="icon">✅</span>';
            echo 'daily_business_reports table created successfully!';
            echo '</div>';
        }

        // Create daily_item_sales table
        if (!$itemSalesTableExists) {
            echo '<div class="status info">';
            echo '<span class="icon">⚙️</span>';
            echo 'Creating daily_item_sales table...';
            echo '</div>';

            $pdo->exec("
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
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");

            echo '<div class="status success">';
            echo '<span class="icon">✅</span>';
            echo 'daily_item_sales table created successfully!';
            echo '</div>';
        }

        // Create view
        echo '<div class="status info">';
        echo '<span class="icon">⚙️</span>';
        echo 'Creating v_business_reports view...';
        echo '</div>';

        $pdo->exec("
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
            ORDER BY dbr.report_date DESC
        ");

        echo '<div class="status success">';
        echo '<span class="icon">✅</span>';
        echo 'v_business_reports view created successfully!';
        echo '</div>';

        echo '<div class="status success">';
        echo '<span class="icon">🎉</span>';
        echo '<strong>Business Reports system setup complete!</strong>';
        echo '</div>';
    }

    echo '<div class="details">';
    echo '<h3>📊 Daily Summary Features</h3>';
    echo '<div class="feature"><span class="feature-icon">🔄</span> <strong>Auto-Reset:</strong> Daily summary resets automatically at midnight</div>';
    echo '<div class="feature"><span class="feature-icon">💾</span> <strong>Auto-Save:</strong> Saves snapshot every hour and when day changes</div>';
    echo '<div class="feature"><span class="feature-icon">📈</span> <strong>X-Read Report:</strong> View current day sales (not finalized)</div>';
    echo '<div class="feature"><span class="feature-icon">🔒</span> <strong>Z-Read Report:</strong> End of day report (finalizes the day)</div>';
    echo '<div class="feature"><span class="feature-icon">📊</span> <strong>Historical Data:</strong> All reports saved for Sales Analysis Dashboard</div>';
    echo '</div>';

    echo '<div class="details">';
    echo '<h3>🚀 How It Works</h3>';
    echo '<div class="feature">1️⃣ System detects when date changes</div>';
    echo '<div class="feature">2️⃣ Previous day\'s data automatically saved to database</div>';
    echo '<div class="feature">3️⃣ Daily Summary page resets for new day</div>';
    echo '<div class="feature">4️⃣ Historical data available in Business Reports</div>';
    echo '<div class="feature">5️⃣ Auto-save runs every hour in background</div>';
    echo '</div>';

    echo '<div class="status info">';
    echo '<span class="icon">✨</span>';
    echo '<div>';
    echo '<strong>What\'s next?</strong><br>';
    echo '• Go to Manager Dashboard → Daily Summary<br>';
    echo '• Make some test sales transactions<br>';
    echo '• Click "X-Read Report" to see current day summary<br>';
    echo '• Click "Z-Read Report" at end of day to finalize<br>';
    echo '• View historical reports in Business Reports section';
    echo '</div>';
    echo '</div>';

} catch (Exception $e) {
    echo '<div class="status error">';
    echo '<span class="icon">❌</span>';
    echo '<strong>Error:</strong> ' . htmlspecialchars($e->getMessage());
    echo '</div>';
}
?>

        <a href="index.php" class="back-link">← Back to POS System</a>
    </div>
</body>
</html>
