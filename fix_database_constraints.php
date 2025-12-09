<?php
/**
 * Fix Database Foreign Key Constraints
 * This script will fix the foreign key constraint issues
 *
 * URL: http://localhost/pos-jither-main/fix_database_constraints.php
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
    <title>Fix Database Constraints</title>
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
            align-items: flex-start;
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
            flex-shrink: 0;
        }
        .status-content {
            flex: 1;
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
        code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Fix Database Constraints</h1>
        <p class="subtitle">Resolving foreign key constraint issues</p>

<?php
try {
    $steps = [];

    // Step 1: Check if tables exist
    echo '<div class="status info">';
    echo '<span class="icon">🔍</span>';
    echo '<div class="status-content">Step 1: Checking existing tables...</div>';
    echo '</div>';

    $stmt = $pdo->query("SHOW TABLES");
    $existingTables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo '<div class="progress">';
    echo '<strong>Existing tables:</strong><br>';
    echo implode(', ', array_map('htmlspecialchars', $existingTables));
    echo '</div>';

    // Step 2: Drop attendance_records if it exists (to recreate without data issues)
    if (in_array('attendance_records', $existingTables)) {
        echo '<div class="status warning">';
        echo '<span class="icon">⚠️</span>';
        echo '<div class="status-content">Step 2: Dropping attendance_records table to fix constraints...</div>';
        echo '</div>';

        $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
        $pdo->exec("DROP TABLE IF EXISTS attendance_records");
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

        $steps[] = '✓ Dropped attendance_records table';
    }

    // Step 3: Ensure employees table exists
    echo '<div class="status info">';
    echo '<span class="icon">👥</span>';
    echo '<div class="status-content">Step 3: Creating/verifying employees table...</div>';
    echo '</div>';

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS employees (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            employee_number VARCHAR(20) NOT NULL UNIQUE,
            full_name VARCHAR(191) NOT NULL,
            position VARCHAR(100) DEFAULT NULL,
            department VARCHAR(100) DEFAULT NULL,
            status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
            date_hired DATE DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_employee_number (employee_number),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $steps[] = '✓ Employees table ready';

    // Step 4: Insert employees if not exist
    echo '<div class="status info">';
    echo '<span class="icon">📝</span>';
    echo '<div class="status-content">Step 4: Adding employee records...</div>';
    echo '</div>';

    $stmt = $pdo->query("SELECT COUNT(*) FROM employees");
    $empCount = $stmt->fetchColumn();

    if ($empCount == 0) {
        $pdo->exec("
            INSERT INTO employees (employee_number, full_name, position, department, status, date_hired) VALUES
                ('EMP001', 'Jowen', 'Manager', 'Management', 'active', '2024-01-01'),
                ('EMP002', 'Elsa', 'Cashier', 'Front of House', 'active', '2024-01-15'),
                ('EMP003', 'Maria Santos', 'Barista', 'Front of House', 'active', '2024-02-01'),
                ('EMP004', 'Juan Dela Cruz', 'Cashier', 'Front of House', 'active', '2024-02-15')
        ");
        $steps[] = '✓ Added 4 employee records';
    } else {
        $steps[] = '✓ Employees already exist (' . $empCount . ' records)';
    }

    // Step 5: Create attendance_records table
    echo '<div class="status info">';
    echo '<span class="icon">🕐</span>';
    echo '<div class="status-content">Step 5: Creating attendance_records table...</div>';
    echo '</div>';

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS attendance_records (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            employee_id INT UNSIGNED NOT NULL,
            employee_number VARCHAR(20) NOT NULL,
            date DATE NOT NULL,
            time_in DATETIME DEFAULT NULL,
            time_out DATETIME DEFAULT NULL,
            status ENUM('present', 'absent', 'late', 'half_day') DEFAULT 'present',
            hours_worked DECIMAL(5,2) DEFAULT 0.00,
            is_locked BOOLEAN DEFAULT FALSE COMMENT 'Prevents duplicate time-ins',
            notes TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
            UNIQUE KEY unique_employee_date (employee_id, date),
            INDEX idx_employee_id (employee_id),
            INDEX idx_date (date),
            INDEX idx_status (status),
            INDEX idx_locked (is_locked)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $steps[] = '✓ Attendance_records table created';

    // Step 6: Create stock_movements table
    echo '<div class="status info">';
    echo '<span class="icon">📦</span>';
    echo '<div class="status-content">Step 6: Creating stock_movements table...</div>';
    echo '</div>';

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS stock_movements (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            inventory_item_id INT UNSIGNED NOT NULL,
            movement_type ENUM('sale', 'purchase', 'adjustment', 'waste', 'transfer') NOT NULL DEFAULT 'sale',
            quantity DECIMAL(10, 4) NOT NULL COMMENT 'Negative for deductions, positive for additions',
            previous_quantity DECIMAL(10, 2) NOT NULL,
            new_quantity DECIMAL(10, 2) NOT NULL,
            reference_type VARCHAR(32) NULL COMMENT 'transaction, purchase_order, adjustment, etc',
            reference_id INT UNSIGNED NULL COMMENT 'ID of related record',
            notes TEXT NULL,
            created_by INT UNSIGNED NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_stock_movements_inventory FOREIGN KEY (inventory_item_id)
                REFERENCES inventory_items (id)
                ON DELETE CASCADE,
            INDEX idx_inventory_item_id (inventory_item_id),
            INDEX idx_movement_type (movement_type),
            INDEX idx_reference (reference_type, reference_id),
            INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $steps[] = '✓ Stock_movements table created';

    // Step 7: Create sales_transactions if not exists
    echo '<div class="status info">';
    echo '<span class="icon">💳</span>';
    echo '<div class="status-content">Step 7: Creating sales_transactions table...</div>';
    echo '</div>';

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS sales_transactions (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            reference VARCHAR(64) NOT NULL UNIQUE COMMENT 'Receipt number',
            subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
            discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
            tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
            total DECIMAL(10, 2) NOT NULL DEFAULT 0,
            payment_method VARCHAR(32) DEFAULT 'cash',
            amount_tendered DECIMAL(10, 2) NULL,
            change_amount DECIMAL(10, 2) NULL,
            cashier_id INT UNSIGNED NULL,
            terminal_id VARCHAR(32) NULL,
            occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_sales_transactions_cashier FOREIGN KEY (cashier_id)
                REFERENCES users (id)
                ON DELETE SET NULL,
            INDEX idx_occurred_at (occurred_at),
            INDEX idx_reference (reference)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $steps[] = '✓ Sales_transactions table created';

    // Step 8: Create sales_transaction_items if not exists
    echo '<div class="status info">';
    echo '<span class="icon">🛒</span>';
    echo '<div class="status-content">Step 8: Creating sales_transaction_items table...</div>';
    echo '</div>';

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS sales_transaction_items (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            transaction_id INT UNSIGNED NOT NULL,
            product_id VARCHAR(64) NULL,
            product_name VARCHAR(191) NOT NULL,
            quantity INT UNSIGNED NOT NULL DEFAULT 1,
            unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
            discount_amount DECIMAL(10, 2) DEFAULT 0,
            line_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
            variations TEXT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_sales_transaction_items_transaction FOREIGN KEY (transaction_id)
                REFERENCES sales_transactions (id)
                ON DELETE CASCADE,
            CONSTRAINT fk_sales_transaction_items_product FOREIGN KEY (product_id)
                REFERENCES products (id)
                ON DELETE SET NULL,
            INDEX idx_transaction_id (transaction_id),
            INDEX idx_product_id (product_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $steps[] = '✓ Sales_transaction_items table created';

    // Step 9: Create trigger for attendance hours calculation
    echo '<div class="status info">';
    echo '<span class="icon">⚡</span>';
    echo '<div class="status-content">Step 9: Creating attendance trigger...</div>';
    echo '</div>';

    $pdo->exec("DROP TRIGGER IF EXISTS calculate_hours_worked");
    $pdo->exec("
        CREATE TRIGGER calculate_hours_worked
        BEFORE UPDATE ON attendance_records
        FOR EACH ROW
        BEGIN
            IF NEW.time_in IS NOT NULL AND NEW.time_out IS NOT NULL THEN
                SET NEW.hours_worked = TIMESTAMPDIFF(MINUTE, NEW.time_in, NEW.time_out) / 60.0;

                IF NEW.hours_worked >= 8 THEN
                    SET NEW.status = 'present';
                ELSEIF NEW.hours_worked >= 4 THEN
                    SET NEW.status = 'half_day';
                ELSE
                    SET NEW.status = 'present';
                END IF;

                SET NEW.is_locked = TRUE;
            END IF;
        END
    ");

    $steps[] = '✓ Trigger created for attendance calculation';

    // Show final status
    echo '<div class="status success">';
    echo '<span class="icon">🎉</span>';
    echo '<div class="status-content"><strong>Success!</strong> All database issues have been fixed.</div>';
    echo '</div>';

    echo '<div class="progress">';
    echo '<strong>Steps Completed:</strong><br>';
    foreach ($steps as $step) {
        echo '<div class="progress-item">';
        echo '<span class="progress-icon">✅</span>';
        echo '<div>' . htmlspecialchars($step) . '</div>';
        echo '</div>';
    }
    echo '</div>';

    // Verify all tables
    $stmt = $pdo->query("SHOW TABLES");
    $allTables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo '<div class="status info">';
    echo '<span class="icon">📊</span>';
    echo '<div class="status-content">';
    echo '<strong>Database now has ' . count($allTables) . ' tables:</strong><br>';
    echo implode(', ', array_map('htmlspecialchars', $allTables));
    echo '</div>';
    echo '</div>';

    // Check employee count
    $stmt = $pdo->query("SELECT COUNT(*) FROM employees");
    $empCount = $stmt->fetchColumn();

    echo '<div class="status success">';
    echo '<span class="icon">👥</span>';
    echo '<div class="status-content">';
    echo '<strong>Employees ready:</strong> ' . $empCount . ' active employees in system<br>';
    echo 'Time Clock Terminal is now ready to use!';
    echo '</div>';
    echo '</div>';

    echo '<div class="status info">';
    echo '<span class="icon">ℹ️</span>';
    echo '<div class="status-content">';
    echo '<strong>Next Steps:</strong><br>';
    echo '1. Test the POS system cashier dashboard<br>';
    echo '2. Test Time Clock Terminal with employee numbers (EMP001-EMP004)<br>';
    echo '3. Make a test sale to verify inventory deduction<br>';
    echo '4. Check stock_movements table for audit trail';
    echo '</div>';
    echo '</div>';

} catch (Exception $e) {
    echo '<div class="status error">';
    echo '<span class="icon">❌</span>';
    echo '<div class="status-content"><strong>Error:</strong> ' . htmlspecialchars($e->getMessage()) . '</div>';
    echo '</div>';

    echo '<div class="progress">';
    echo '<h3>Error Details</h3>';
    echo '<pre>' . htmlspecialchars($e->getTraceAsString()) . '</pre>';
    echo '</div>';
}
?>

        <a href="index.php" class="back-link">← Back to POS System</a>
    </div>
</body>
</html>
