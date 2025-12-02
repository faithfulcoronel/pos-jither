<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fix EMP002</title>
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
        h1 { color: #333; margin-bottom: 20px; }
        .info {
            background: #e7f3ff;
            border: 1px solid #b3d9ff;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            color: #004085;
        }
        .success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            color: #155724;
        }
        .error {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            color: #721c24;
        }
        pre {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
            font-size: 12px;
        }
        .back-btn {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Fix EMP002 Employee</h1>

        <?php
        require_once __DIR__ . '/php/database.php';

        try {
            $pdo = getDatabaseConnection();

            if (!$pdo) {
                echo '<div class="error">Database connection not available.</div>';
            } else {
                echo '<div class="info"><strong>Step 1:</strong> Checking EMP002 status...</div>';

                // Check current status of EMP002
                $stmt = $pdo->prepare("SELECT * FROM staff_accounts WHERE employee_number = ?");
                $stmt->execute(['EMP002']);
                $emp002 = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($emp002) {
                    echo '<div class="info">';
                    echo '<strong>Found EMP002:</strong><br>';
                    echo '<pre>' . print_r($emp002, true) . '</pre>';
                    echo '</div>';

                    // Update status to Active
                    echo '<div class="info"><strong>Step 2:</strong> Setting status to Active...</div>';

                    $updateStmt = $pdo->prepare("
                        UPDATE staff_accounts
                        SET status = 'Active'
                        WHERE employee_number = 'EMP002'
                    ");
                    $updateStmt->execute();

                    // Verify update
                    $stmt->execute(['EMP002']);
                    $emp002Updated = $stmt->fetch(PDO::FETCH_ASSOC);

                    echo '<div class="success">';
                    echo '<strong>✓ EMP002 has been updated!</strong><br>';
                    echo 'New status: <strong>' . htmlspecialchars($emp002Updated['status']) . '</strong>';
                    echo '</div>';

                    // Also activate all other employees
                    echo '<div class="info"><strong>Step 3:</strong> Ensuring all test employees are active...</div>';

                    $activateAll = $pdo->prepare("
                        UPDATE staff_accounts
                        SET status = 'Active'
                        WHERE employee_number IN ('EMP001', 'EMP002', 'EMP003', 'EMP004')
                    ");
                    $activateAll->execute();

                    // Show all employees
                    $allEmps = $pdo->query("
                        SELECT employee_number, name, role, status
                        FROM staff_accounts
                        WHERE employee_number IN ('EMP001', 'EMP002', 'EMP003', 'EMP004')
                        ORDER BY employee_number
                    ")->fetchAll(PDO::FETCH_ASSOC);

                    echo '<div class="success">';
                    echo '<strong>All Test Employees:</strong><br><br>';
                    foreach ($allEmps as $emp) {
                        echo htmlspecialchars($emp['employee_number']) . ' - ';
                        echo htmlspecialchars($emp['name']) . ' (' . htmlspecialchars($emp['role']) . ') - ';
                        echo '<strong>' . htmlspecialchars($emp['status']) . '</strong><br>';
                    }
                    echo '</div>';

                } else {
                    echo '<div class="error">';
                    echo '<strong>EMP002 not found in database!</strong><br>';
                    echo 'Creating EMP002 employee...';
                    echo '</div>';

                    // Insert EMP002
                    $insertStmt = $pdo->prepare("
                        INSERT INTO staff_accounts (role, name, employee_number, status)
                        VALUES ('Cashier', 'Elsa', 'EMP002', 'Active')
                    ");
                    $insertStmt->execute();

                    echo '<div class="success">';
                    echo '<strong>✓ EMP002 has been created and activated!</strong>';
                    echo '</div>';
                }
            }

        } catch (PDOException $e) {
            echo '<div class="error">';
            echo '<strong>Database Error:</strong><br>';
            echo htmlspecialchars($e->getMessage());
            echo '</div>';
        }
        ?>

        <a href="index.php" class="back-btn">← Back to Time Clock Terminal</a>
    </div>
</body>
</html>
