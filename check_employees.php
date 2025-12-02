<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Employee Status Check</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 1000px;
            margin: 0 auto;
            padding: 30px;
        }
        h1 { color: #333; margin-bottom: 20px; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background: #f8f9fa;
            font-weight: 600;
            color: #333;
        }
        .status-active {
            background: #28a745;
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            display: inline-block;
        }
        .status-inactive {
            background: #dc3545;
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            display: inline-block;
        }
        .back-btn {
            display: inline-block;
            background: #007bff;
            color: white;
            padding: 10px 20px;
            border-radius: 6px;
            text-decoration: none;
            margin-top: 20px;
        }
        .back-btn:hover {
            background: #0056b3;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📋 Employee Status Check</h1>

        <?php
        require_once __DIR__ . '/php/database.php';

        try {
            $pdo = getDatabaseConnection();

            if (!$pdo) {
                echo '<p style="color: #dc3545;">Database connection not available.</p>';
            } else {
                // Get ALL employees from staff_accounts
                $stmt = $pdo->query("
                    SELECT id, employee_number, name, role, status, created_at
                    FROM staff_accounts
                    ORDER BY employee_number
                ");

                $employees = $stmt->fetchAll(PDO::FETCH_ASSOC);

                if (count($employees) > 0) {
                    echo '<p>Found ' . count($employees) . ' employee(s) in the database:</p>';
                    echo '<table>';
                    echo '<thead><tr>';
                    echo '<th>ID</th>';
                    echo '<th>Employee Number</th>';
                    echo '<th>Name</th>';
                    echo '<th>Role</th>';
                    echo '<th>Status</th>';
                    echo '<th>Created</th>';
                    echo '</tr></thead>';
                    echo '<tbody>';

                    foreach ($employees as $emp) {
                        $statusClass = $emp['status'] === 'Active' ? 'status-active' : 'status-inactive';
                        echo '<tr>';
                        echo '<td>' . htmlspecialchars($emp['id']) . '</td>';
                        echo '<td><strong>' . htmlspecialchars($emp['employee_number'] ?? 'NULL') . '</strong></td>';
                        echo '<td>' . htmlspecialchars($emp['name']) . '</td>';
                        echo '<td>' . htmlspecialchars($emp['role']) . '</td>';
                        echo '<td><span class="' . $statusClass . '">' . htmlspecialchars($emp['status']) . '</span></td>';
                        echo '<td>' . htmlspecialchars($emp['created_at']) . '</td>';
                        echo '</tr>';
                    }

                    echo '</tbody></table>';
                } else {
                    echo '<p style="color: #dc3545;">No employees found in staff_accounts table.</p>';
                }

                // Also check if there's an employees table
                echo '<h2 style="margin-top: 30px;">Checking for additional employee tables...</h2>';

                $tables = $pdo->query("SHOW TABLES LIKE '%employ%'")->fetchAll(PDO::FETCH_COLUMN);

                if (count($tables) > 0) {
                    echo '<p>Found tables: ' . implode(', ', $tables) . '</p>';

                    foreach ($tables as $table) {
                        if ($table !== 'staff_accounts') {
                            echo '<h3>' . htmlspecialchars($table) . '</h3>';
                            $stmt = $pdo->query("SELECT * FROM `$table` LIMIT 10");
                            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

                            if (count($rows) > 0) {
                                echo '<table>';
                                echo '<thead><tr>';
                                foreach (array_keys($rows[0]) as $col) {
                                    echo '<th>' . htmlspecialchars($col) . '</th>';
                                }
                                echo '</tr></thead>';
                                echo '<tbody>';
                                foreach ($rows as $row) {
                                    echo '<tr>';
                                    foreach ($row as $val) {
                                        echo '<td>' . htmlspecialchars($val ?? 'NULL') . '</td>';
                                    }
                                    echo '</tr>';
                                }
                                echo '</tbody></table>';
                            } else {
                                echo '<p>Table is empty.</p>';
                            }
                        }
                    }
                }
            }

        } catch (PDOException $e) {
            echo '<p style="color: #dc3545;">Database Error: ' . htmlspecialchars($e->getMessage()) . '</p>';
        }
        ?>

        <a href="index.php" class="back-btn">← Back</a>
    </div>
</body>
</html>
