<?php
/**
 * Setup Discount System - Add discount fields to database
 * Run this once to add discount_type and VAT fields
 *
 * URL: http://localhost/pos-jither-main/setup_discount_system.php
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
    <title>Setup Discount System</title>
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
        .field {
            padding: 8px 0;
            display: flex;
            align-items: center;
        }
        .field-icon {
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
        <h1>💳 Setup Discount System</h1>
        <p class="subtitle">Adding discount type and VAT fields to your database</p>

<?php
try {
    // Check if discount_type column already exists
    $stmt = $pdo->query("SHOW COLUMNS FROM sales_transactions LIKE 'discount_type'");
    $discountTypeExists = $stmt->rowCount() > 0;

    $stmt = $pdo->query("SHOW COLUMNS FROM sales_transactions LIKE 'vat_amount'");
    $vatFieldsExist = $stmt->rowCount() > 0;

    if ($discountTypeExists && $vatFieldsExist) {
        echo '<div class="status info">';
        echo '<span class="icon">ℹ️</span>';
        echo 'Discount system is already set up! All required fields exist.';
        echo '</div>';
    } else {
        // Add discount_type column
        if (!$discountTypeExists) {
            echo '<div class="status info">';
            echo '<span class="icon">⚙️</span>';
            echo 'Adding discount_type column...';
            echo '</div>';

            $pdo->exec("
                ALTER TABLE sales_transactions
                ADD COLUMN discount_type VARCHAR(50) NULL COMMENT 'Type of discount: Senior Citizen, PWD, Regular Customer, etc.' AFTER discount_amount
            ");

            echo '<div class="status success">';
            echo '<span class="icon">✅</span>';
            echo 'discount_type column added successfully!';
            echo '</div>';
        }

        // Add VAT fields
        if (!$vatFieldsExist) {
            echo '<div class="status info">';
            echo '<span class="icon">⚙️</span>';
            echo 'Adding VAT calculation fields...';
            echo '</div>';

            $pdo->exec("
                ALTER TABLE sales_transactions
                ADD COLUMN vat_exempt_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 COMMENT 'Amount exempt from VAT' AFTER tax_amount,
                ADD COLUMN vatable_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 COMMENT 'Amount subject to VAT' AFTER vat_exempt_amount,
                ADD COLUMN vat_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 COMMENT '12% VAT amount' AFTER vatable_amount
            ");

            echo '<div class="status success">';
            echo '<span class="icon">✅</span>';
            echo 'VAT fields added successfully!';
            echo '</div>';
        }

        echo '<div class="status success">';
        echo '<span class="icon">🎉</span>';
        echo '<strong>Discount system setup complete!</strong>';
        echo '</div>';
    }

    // Show current structure
    $stmt = $pdo->query("DESCRIBE sales_transactions");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo '<div class="details">';
    echo '<h3>📊 sales_transactions Table Structure</h3>';

    $discountFields = ['discount_amount', 'discount_type', 'tax_amount', 'vat_exempt_amount', 'vatable_amount', 'vat_amount'];

    foreach ($columns as $col) {
        if (in_array($col['Field'], $discountFields)) {
            echo '<div class="field">';
            echo '<span class="field-icon">✓</span>';
            echo '<strong>' . htmlspecialchars($col['Field']) . '</strong>: ' . htmlspecialchars($col['Type']);
            echo '</div>';
        }
    }

    echo '</div>';

    echo '<div class="details">';
    echo '<h3>🏷️ Available Discount Types</h3>';
    echo '<div class="field"><span class="field-icon">👵</span> <strong>Senior Citizen:</strong> 20% discount + VAT exempt</div>';
    echo '<div class="field"><span class="field-icon">♿</span> <strong>PWD:</strong> 20% discount + VAT exempt</div>';
    echo '<div class="field"><span class="field-icon">👤</span> <strong>No Discount:</strong> Regular price with 12% VAT</div>';
    echo '</div>';

    echo '<div class="status info">';
    echo '<span class="icon">✨</span>';
    echo '<div>';
    echo '<strong>What\'s next?</strong><br>';
    echo '• Go to Cashier Dashboard<br>';
    echo '• Select a discount type before checkout<br>';
    echo '• Discount will automatically apply<br>';
    echo '• Receipt will show discount details';
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
