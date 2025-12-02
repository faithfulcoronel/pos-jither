<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Activate Employees - Time Clock Setup</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 600px;
            width: 100%;
            padding: 40px;
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
        .success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .success h2 {
            color: #155724;
            margin-bottom: 10px;
            font-size: 20px;
        }
        .success p {
            color: #155724;
            line-height: 1.6;
        }
        .error {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .error h2 {
            color: #721c24;
            margin-bottom: 10px;
            font-size: 20px;
        }
        .error p {
            color: #721c24;
            line-height: 1.6;
        }
        .employee-list {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin-top: 20px;
        }
        .employee-list h3 {
            color: #333;
            margin-bottom: 15px;
            font-size: 18px;
        }
        .employee {
            background: white;
            border-left: 4px solid #28a745;
            padding: 12px 16px;
            margin-bottom: 10px;
            border-radius: 4px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .employee-info {
            flex: 1;
        }
        .employee-number {
            font-weight: 600;
            color: #333;
            font-family: 'Courier New', monospace;
        }
        .employee-name {
            color: #666;
            font-size: 14px;
        }
        .employee-status {
            background: #28a745;
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
        .back-btn {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            margin-top: 20px;
            transition: background 0.3s;
        }
        .back-btn:hover {
            background: #5568d3;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Employee Activation</h1>
        <p class="subtitle">Time Clock Terminal Setup</p>

        <?php
        require_once __DIR__ . '/php/database.php';

        try {
            $pdo = getDatabaseConnection();

            if (!$pdo) {
                echo '<div class="error">';
                echo '<h2>❌ Database Connection Error</h2>';
                echo '<p>Database connection not available. Please check your database configuration in the .env file.</p>';
                echo '</div>';
            } else {
                // Activate sample employees
                $stmt = $pdo->prepare("
                    UPDATE staff_accounts
                    SET status = 'Active'
                    WHERE employee_number IN ('EMP001', 'EMP002', 'EMP003', 'EMP004')
                ");

                $stmt->execute();
                $updatedCount = $stmt->rowCount();

                echo '<div class="success">';
                echo '<h2>✅ Success!</h2>';
                echo "<p>Successfully activated <strong>$updatedCount employee(s)</strong> for the Time Clock Terminal.</p>";
                echo '</div>';

                // Show activated employees
                $stmt = $pdo->query("
                    SELECT employee_number, name, role, status
                    FROM staff_accounts
                    WHERE employee_number IN ('EMP001', 'EMP002', 'EMP003', 'EMP004')
                    ORDER BY employee_number
                ");

                $employees = $stmt->fetchAll(PDO::FETCH_ASSOC);

                if (count($employees) > 0) {
                    echo '<div class="employee-list">';
                    echo '<h3>📋 Active Employees</h3>';

                    foreach ($employees as $employee) {
                        $statusClass = $employee['status'] === 'Active' ? 'employee-status' : '';
                        echo '<div class="employee">';
                        echo '<div class="employee-info">';
                        echo '<div class="employee-number">' . htmlspecialchars($employee['employee_number']) . '</div>';
                        echo '<div class="employee-name">' . htmlspecialchars($employee['name']) . ' - ' . htmlspecialchars($employee['role']) . '</div>';
                        echo '</div>';
                        echo '<span class="' . $statusClass . '">' . htmlspecialchars($employee['status']) . '</span>';
                        echo '</div>';
                    }

                    echo '</div>';
                }

                echo '<div style="margin-top: 20px; padding: 15px; background: #e7f3ff; border-radius: 8px; border-left: 4px solid #2196F3;">';
                echo '<p style="color: #0c5460; margin-bottom: 8px;"><strong>✓ Setup Complete!</strong></p>';
                echo '<p style="color: #0c5460; font-size: 14px;">Employees can now use the Time Clock Terminal with these employee numbers:</p>';
                echo '<p style="color: #0c5460; font-size: 14px; font-family: monospace; margin-top: 8px;">EMP001, EMP002, EMP003, EMP004</p>';
                echo '</div>';
            }

        } catch (PDOException $e) {
            echo '<div class="error">';
            echo '<h2>❌ Database Error</h2>';
            echo '<p>' . htmlspecialchars($e->getMessage()) . '</p>';
            echo '</div>';
        }
        ?>

        <a href="index.php" class="back-btn">← Back to Time Clock Terminal</a>
    </div>
</body>
</html>
