<?php
/**
 * Create stock_movements table
 * Run this file once to add the missing table to your database
 *
 * URL: http://localhost/pos-jither-main/create_stock_movements_table.php
 */

require_once __DIR__ . '/php/db_connect.php';

// Set error display
ini_set('display_errors', 1);
error_reporting(E_ALL);

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Create Stock Movements Table</title>
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
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
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
            margin-bottom: 20px;
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
            margin-top: 20px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
        }
        .details h3 {
            color: #333;
            margin-bottom: 15px;
            font-size: 16px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }
        .field {
            display: flex;
            padding: 8px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        .field:last-child {
            border-bottom: none;
        }
        .field-name {
            flex: 0 0 180px;
            font-weight: 600;
            color: #555;
        }
        .field-value {
            flex: 1;
            color: #333;
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
        pre {
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 15px;
            border-radius: 6px;
            overflow-x: auto;
            font-size: 12px;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Create Stock Movements Table</h1>
        <p class="subtitle">This will add the missing stock_movements table to track inventory changes</p>

<?php
try {
    // Read SQL file
    $sqlFile = __DIR__ . '/database/create_stock_movements.sql';

    if (!file_exists($sqlFile)) {
        throw new Exception("SQL file not found: {$sqlFile}");
    }

    $sql = file_get_contents($sqlFile);

    // Split SQL statements (simple split by semicolon)
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        function($stmt) {
            return !empty($stmt) &&
                   !preg_match('/^--/', $stmt) &&
                   !preg_match('/^USE/', $stmt);
        }
    );

    echo '<div class="status info">';
    echo '<span class="icon">ℹ️</span>';
    echo 'Executing SQL statements...';
    echo '</div>';

    $pdo->beginTransaction();

    $results = [];
    foreach ($statements as $statement) {
        if (trim($statement)) {
            $stmt = $pdo->prepare($statement);
            $stmt->execute();

            // Try to fetch results if any
            try {
                $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
                if (!empty($result)) {
                    $results[] = $result;
                }
            } catch (Exception $e) {
                // No results, that's okay
            }
        }
    }

    $pdo->commit();

    echo '<div class="status success">';
    echo '<span class="icon">✅</span>';
    echo '<strong>Success!</strong> The stock_movements table has been created successfully.';
    echo '</div>';

    // Verify table exists and show structure
    $stmt = $pdo->query("DESCRIBE stock_movements");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo '<div class="details">';
    echo '<h3>Table Structure: stock_movements</h3>';

    foreach ($columns as $col) {
        echo '<div class="field">';
        echo '<div class="field-name">' . htmlspecialchars($col['Field']) . '</div>';
        echo '<div class="field-value">' . htmlspecialchars($col['Type']) . '</div>';
        echo '</div>';
    }

    echo '</div>';

    // Show what this table does
    echo '<div class="status info" style="margin-top: 20px;">';
    echo '<span class="icon">📋</span>';
    echo '<strong>What this table does:</strong><br>';
    echo '• Tracks all inventory movements (sales, purchases, adjustments)<br>';
    echo '• Records quantity changes with before/after values<br>';
    echo '• Links to transactions for audit trail<br>';
    echo '• Helps identify inventory discrepancies';
    echo '</div>';

    echo '<div class="status success" style="margin-top: 20px;">';
    echo '<span class="icon">🎉</span>';
    echo '<strong>Next step:</strong> Your inventory deductions should now work without errors!';
    echo '</div>';

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    echo '<div class="status error">';
    echo '<span class="icon">❌</span>';
    echo '<strong>Error:</strong> ' . htmlspecialchars($e->getMessage());
    echo '</div>';

    echo '<div class="details">';
    echo '<h3>Error Details</h3>';
    echo '<pre>' . htmlspecialchars($e->getTraceAsString()) . '</pre>';
    echo '</div>';
}
?>

        <a href="index.php" class="back-link">← Back to POS System</a>
    </div>
</body>
</html>
