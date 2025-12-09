<?php
/**
 * Sync Staff Accounts to Employees Table
 * This will copy all staff from staff_accounts to employees table
 *
 * URL: http://localhost/pos-jither-main/sync_staff_to_employees.php
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
    <title>Sync Staff to Employees</title>
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
        .staff-list {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .staff-item {
            padding: 12px;
            background: white;
            margin-bottom: 10px;
            border-radius: 6px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .staff-item:last-child {
            margin-bottom: 0;
        }
        .staff-info {
            flex: 1;
        }
        .staff-name {
            font-weight: 600;
            color: #333;
        }
        .staff-role {
            color: #666;
            font-size: 14px;
        }
        .staff-number {
            color: #667eea;
            font-weight: 500;
            font-family: monospace;
        }
        .staff-status {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
        .staff-status.active {
            background: #d4edda;
            color: #155724;
        }
        .staff-status.inactive {
            background: #f8d7da;
            color: #721c24;
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
        <h1>🔄 Sync Staff to Employees</h1>
        <p class="subtitle">Synchronizing staff accounts to employees table for time keeping</p>

<?php
try {
    // Get all staff with employee numbers
    $stmt = $pdo->query("
        SELECT id, role, name, employee_number, status
        FROM staff_accounts
        WHERE employee_number IS NOT NULL AND employee_number != ''
        ORDER BY id
    ");
    $staffList = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($staffList)) {
        echo '<div class="status info">';
        echo '<span class="icon">ℹ️</span>';
        echo 'No staff members with employee numbers found.';
        echo '</div>';
    } else {
        echo '<div class="status info">';
        echo '<span class="icon">👥</span>';
        echo 'Found ' . count($staffList) . ' staff member(s) with employee numbers';
        echo '</div>';

        $synced = 0;
        $skipped = 0;
        $created = 0;
        $updated = 0;

        echo '<div class="staff-list">';

        foreach ($staffList as $staff) {
            // Check if employee exists
            $checkStmt = $pdo->prepare("SELECT id, status FROM employees WHERE employee_number = ?");
            $checkStmt->execute([$staff['employee_number']]);
            $employee = $checkStmt->fetch(PDO::FETCH_ASSOC);

            // Convert status
            $empStatus = ($staff['status'] === 'Active') ? 'active' : 'inactive';

            if ($employee) {
                // Update existing
                $updateStmt = $pdo->prepare("
                    UPDATE employees
                    SET full_name = ?, position = ?, status = ?
                    WHERE employee_number = ?
                ");
                $updateStmt->execute([
                    $staff['name'],
                    $staff['role'],
                    $empStatus,
                    $staff['employee_number']
                ]);
                $updated++;
                $action = '✅ Updated';
            } else {
                // Create new
                $insertStmt = $pdo->prepare("
                    INSERT INTO employees (employee_number, full_name, position, department, status, date_hired)
                    VALUES (?, ?, ?, ?, ?, ?)
                ");
                $insertStmt->execute([
                    $staff['employee_number'],
                    $staff['name'],
                    $staff['role'],
                    'Front of House',
                    $empStatus,
                    date('Y-m-d')
                ]);
                $created++;
                $action = '✨ Created';
            }

            echo '<div class="staff-item">';
            echo '<div class="staff-info">';
            echo '<div class="staff-name">' . htmlspecialchars($staff['name']) . '</div>';
            echo '<div class="staff-role">' . htmlspecialchars($staff['role']) . ' • ' . htmlspecialchars($staff['employee_number']) . '</div>';
            echo '</div>';
            echo '<span class="staff-status ' . strtolower($staff['status']) . '">' . $action . '</span>';
            echo '</div>';

            $synced++;
        }

        echo '</div>';

        echo '<div class="status success">';
        echo '<span class="icon">🎉</span>';
        echo '<strong>Sync Complete!</strong><br>';
        echo '• Created: ' . $created . ' new employee(s)<br>';
        echo '• Updated: ' . $updated . ' existing employee(s)<br>';
        echo '• Total synced: ' . $synced . ' staff member(s)';
        echo '</div>';

        echo '<div class="status info">';
        echo '<span class="icon">✅</span>';
        echo '<strong>What This Means:</strong><br>';
        echo '• All staff can now use the Time Clock Terminal<br>';
        echo '• Future staff additions will automatically sync<br>';
        echo '• Time keeping records will be properly tracked';
        echo '</div>';
    }

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
