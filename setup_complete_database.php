<?php
/**
 * Complete Database Setup
 * This will create ALL tables needed for the POS system
 *
 * URL: http://localhost/pos-jither-main/setup_complete_database.php
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
    <title>Complete Database Setup</title>
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
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 900px;
            margin: 0 auto;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 32px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 16px;
        }
        .status {
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 15px;
            font-weight: 500;
            display: flex;
            align-items: center;
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
        .status.warning {
            background: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
        }
        .icon {
            font-size: 24px;
            margin-right: 12px;
        }
        .progress {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .progress-item {
            padding: 10px 0;
            display: flex;
            align-items: center;
            border-bottom: 1px solid #e0e0e0;
        }
        .progress-item:last-child {
            border-bottom: none;
        }
        .progress-icon {
            margin-right: 10px;
            font-size: 20px;
        }
        .details {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            max-height: 400px;
            overflow-y: auto;
        }
        .table-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 10px;
            margin-top: 20px;
        }
        .table-item {
            background: white;
            padding: 12px;
            border-radius: 6px;
            border: 2px solid #667eea;
            font-weight: 500;
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
            margin-top: 10px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin: 30px 0;
        }
        .summary-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .summary-card .number {
            font-size: 36px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .summary-card .label {
            font-size: 14px;
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🗄️ Complete Database Setup</h1>
        <p class="subtitle">Setting up all tables for Jowen's Kitchen & Cafe POS System</p>

<?php
try {
    // Read SQL file
    $sqlFile = __DIR__ . '/database/COMPLETE_DATABASE.sql';

    if (!file_exists($sqlFile)) {
        throw new Exception("SQL file not found: {$sqlFile}");
    }

    echo '<div class="status info">';
    echo '<span class="icon">📂</span>';
    echo '<div>Reading SQL file: COMPLETE_DATABASE.sql</div>';
    echo '</div>';

    $sql = file_get_contents($sqlFile);

    // Parse SQL file and split by delimiter changes and statements
    $statements = [];
    $currentDelimiter = ';';
    $buffer = '';
    $inDelimiterBlock = false;

    $lines = explode("\n", $sql);

    foreach ($lines as $line) {
        $trimmedLine = trim($line);

        // Skip empty lines and comments
        if (empty($trimmedLine) || substr($trimmedLine, 0, 2) === '--') {
            continue;
        }

        // Check for DELIMITER command
        if (preg_match('/^DELIMITER\s+(.+)$/i', $trimmedLine, $matches)) {
            // Save current buffer if not empty
            if (!empty(trim($buffer))) {
                $statements[] = [
                    'sql' => trim($buffer),
                    'delimiter' => $currentDelimiter
                ];
                $buffer = '';
            }
            $currentDelimiter = trim($matches[1]);
            $inDelimiterBlock = ($currentDelimiter !== ';');
            continue;
        }

        $buffer .= $line . "\n";

        // Check if statement is complete
        if (!$inDelimiterBlock && substr(rtrim($line), -1) === $currentDelimiter) {
            $stmt = trim($buffer);
            if (!empty($stmt)) {
                $statements[] = [
                    'sql' => rtrim($stmt, $currentDelimiter),
                    'delimiter' => $currentDelimiter
                ];
            }
            $buffer = '';
        } elseif ($inDelimiterBlock && substr(rtrim($line), -strlen($currentDelimiter)) === $currentDelimiter) {
            $stmt = trim($buffer);
            if (!empty($stmt)) {
                $statements[] = [
                    'sql' => rtrim($stmt, $currentDelimiter),
                    'delimiter' => $currentDelimiter
                ];
            }
            $buffer = '';
        }
    }

    // Add any remaining buffer
    if (!empty(trim($buffer))) {
        $statements[] = [
            'sql' => trim($buffer),
            'delimiter' => $currentDelimiter
        ];
    }

    echo '<div class="status info">';
    echo '<span class="icon">📋</span>';
    echo '<div>Found ' . count($statements) . ' SQL statements to execute</div>';
    echo '</div>';

    echo '<div class="progress">';

    $executed = 0;
    $failed = 0;
    $skipped = 0;
    $errors = [];

    foreach ($statements as $index => $statement) {
        $stmt = $statement['sql'];

        // Skip USE database statements (we're already connected)
        if (preg_match('/^USE\s+/i', $stmt)) {
            $skipped++;
            continue;
        }

        // Skip DROP DATABASE
        if (preg_match('/^DROP\s+DATABASE/i', $stmt)) {
            echo '<div class="progress-item">';
            echo '<span class="progress-icon">⚠️</span>';
            echo '<div>Skipped: DROP DATABASE (preserving existing data)</div>';
            echo '</div>';
            $skipped++;
            continue;
        }

        // Skip CREATE DATABASE
        if (preg_match('/^CREATE\s+DATABASE/i', $stmt)) {
            echo '<div class="progress-item">';
            echo '<span class="progress-icon">⚠️</span>';
            echo '<div>Skipped: CREATE DATABASE (using existing database)</div>';
            echo '</div>';
            $skipped++;
            continue;
        }

        try {
            $pdo->exec($stmt);
            $executed++;

            // Show progress for important statements
            if (preg_match('/^CREATE\s+TABLE\s+(\w+)/i', $stmt, $matches)) {
                echo '<div class="progress-item">';
                echo '<span class="progress-icon">✅</span>';
                echo '<div>Created table: <strong>' . $matches[1] . '</strong></div>';
                echo '</div>';
            } elseif (preg_match('/^CREATE\s+.*VIEW\s+(\w+)/i', $stmt, $matches)) {
                echo '<div class="progress-item">';
                echo '<span class="progress-icon">👁️</span>';
                echo '<div>Created view: <strong>' . $matches[1] . '</strong></div>';
                echo '</div>';
            } elseif (preg_match('/^CREATE\s+TRIGGER\s+(\w+)/i', $stmt, $matches)) {
                echo '<div class="progress-item">';
                echo '<span class="progress-icon">⚡</span>';
                echo '<div>Created trigger: <strong>' . $matches[1] . '</strong></div>';
                echo '</div>';
            } elseif (preg_match('/^CREATE\s+PROCEDURE\s+(\w+)/i', $stmt, $matches)) {
                echo '<div class="progress-item">';
                echo '<span class="progress-icon">🔧</span>';
                echo '<div>Created procedure: <strong>' . $matches[1] . '</strong></div>';
                echo '</div>';
            } elseif (preg_match('/^INSERT\s+INTO\s+(\w+)/i', $stmt, $matches)) {
                // Only show first insert per table
                static $insertedTables = [];
                if (!in_array($matches[1], $insertedTables)) {
                    echo '<div class="progress-item">';
                    echo '<span class="progress-icon">📝</span>';
                    echo '<div>Inserted sample data: <strong>' . $matches[1] . '</strong></div>';
                    echo '</div>';
                    $insertedTables[] = $matches[1];
                }
            }

        } catch (Exception $e) {
            $failed++;
            $errors[] = [
                'statement' => substr($stmt, 0, 100) . '...',
                'error' => $e->getMessage()
            ];
        }
    }

    echo '</div>';

    // Show summary
    echo '<div class="summary">';
    echo '<div class="summary-card">';
    echo '<div class="number">' . $executed . '</div>';
    echo '<div class="label">Executed</div>';
    echo '</div>';
    echo '<div class="summary-card">';
    echo '<div class="number">' . $skipped . '</div>';
    echo '<div class="label">Skipped</div>';
    echo '</div>';
    echo '<div class="summary-card">';
    echo '<div class="number">' . $failed . '</div>';
    echo '<div class="label">Failed</div>';
    echo '</div>';
    echo '<div class="summary-card">';
    echo '<div class="number">' . count($statements) . '</div>';
    echo '<div class="label">Total</div>';
    echo '</div>';
    echo '</div>';

    if (!empty($errors)) {
        echo '<div class="status warning">';
        echo '<span class="icon">⚠️</span>';
        echo '<div><strong>' . count($errors) . ' statement(s) failed</strong> (this is usually okay if tables already exist)</div>';
        echo '</div>';

        echo '<div class="details">';
        echo '<strong>Errors (can be ignored if tables exist):</strong>';
        foreach (array_slice($errors, 0, 5) as $error) {
            echo '<pre>' . htmlspecialchars($error['error']) . '</pre>';
        }
        if (count($errors) > 5) {
            echo '<p><em>... and ' . (count($errors) - 5) . ' more errors</em></p>';
        }
        echo '</div>';
    }

    // Verify tables exist
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if (count($tables) > 0) {
        echo '<div class="status success">';
        echo '<span class="icon">🎉</span>';
        echo '<div><strong>Success!</strong> Database setup complete with ' . count($tables) . ' tables.</div>';
        echo '</div>';

        echo '<div class="progress">';
        echo '<strong>📊 Database Tables:</strong>';
        echo '<div class="table-list">';
        foreach ($tables as $table) {
            echo '<div class="table-item">✓ ' . htmlspecialchars($table) . '</div>';
        }
        echo '</div>';
        echo '</div>';

        // Show sample data counts
        echo '<div class="status info">';
        echo '<span class="icon">📈</span>';
        echo '<div><strong>Sample Data Loaded:</strong></div>';
        echo '</div>';

        echo '<div class="progress">';

        $dataCounts = [];
        $tablesToCheck = ['products', 'product_categories', 'inventory_items', 'product_recipes',
                          'staff_accounts', 'employees', 'users', 'sales_transactions'];

        foreach ($tablesToCheck as $table) {
            if (in_array($table, $tables)) {
                try {
                    $stmt = $pdo->query("SELECT COUNT(*) FROM `$table`");
                    $count = $stmt->fetchColumn();
                    if ($count > 0) {
                        echo '<div class="progress-item">';
                        echo '<span class="progress-icon">📦</span>';
                        echo '<div><strong>' . htmlspecialchars($table) . ':</strong> ' . $count . ' records</div>';
                        echo '</div>';
                    }
                } catch (Exception $e) {
                    // Skip if error
                }
            }
        }

        echo '</div>';

        echo '<div class="status success">';
        echo '<span class="icon">✨</span>';
        echo '<div>';
        echo '<strong>Your POS system is ready to use!</strong><br>';
        echo 'Login credentials:<br>';
        echo '• Manager: username=<code>manager</code>, password=<code>demo123</code><br>';
        echo '• Cashier: username=<code>cashier</code>, password=<code>demo123</code>';
        echo '</div>';
        echo '</div>';

    } else {
        throw new Exception("No tables were created. Please check the SQL file.");
    }

} catch (Exception $e) {
    echo '<div class="status error">';
    echo '<span class="icon">❌</span>';
    echo '<div><strong>Error:</strong> ' . htmlspecialchars($e->getMessage()) . '</div>';
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
