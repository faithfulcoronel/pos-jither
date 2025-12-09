<!DOCTYPE html>
<html>
<head>
    <title>Test Timekeeping Records</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .result { background: #f0f0f0; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .error { background: #fee; color: #c00; }
        .success { background: #efe; color: #060; }
    </style>
</head>
<body>
    <h1>Timekeeping System Diagnostic</h1>

    <?php
    require_once __DIR__ . '/php/database.php';

    echo "<h2>1. Database Connection Test</h2>";
    try {
        $pdo = getDatabaseConnection();
        if ($pdo) {
            echo "<div class='result success'>✓ Database connected successfully</div>";
        } else {
            echo "<div class='result error'>✗ Database connection failed</div>";
            exit;
        }
    } catch (Exception $e) {
        echo "<div class='result error'>✗ Database error: " . $e->getMessage() . "</div>";
        exit;
    }

    echo "<h2>2. Check attendance_records Table</h2>";
    try {
        $stmt = $pdo->query("SHOW TABLES LIKE 'attendance_records'");
        $tableExists = $stmt->rowCount() > 0;

        if ($tableExists) {
            echo "<div class='result success'>✓ attendance_records table exists</div>";

            // Check records count
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM attendance_records");
            $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            echo "<div class='result'>Total records in attendance_records: <strong>$count</strong></div>";

            // Check today's records
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM attendance_records WHERE DATE(date) = CURDATE()");
            $todayCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            echo "<div class='result'>Today's records: <strong>$todayCount</strong></div>";

        } else {
            echo "<div class='result error'>✗ attendance_records table does NOT exist</div>";
            echo "<div class='result'>Creating attendance_records table...</div>";

            $createTable = "
            CREATE TABLE IF NOT EXISTS attendance_records (
                id INT PRIMARY KEY AUTO_INCREMENT,
                employee_id INT NOT NULL,
                date DATE NOT NULL,
                time_in DATETIME DEFAULT NULL,
                time_out DATETIME DEFAULT NULL,
                hours_worked DECIMAL(5,2) DEFAULT 0,
                status VARCHAR(20) DEFAULT 'present',
                notes TEXT,
                is_locked BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
                UNIQUE KEY unique_employee_date (employee_id, date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

            try {
                $pdo->exec($createTable);
                echo "<div class='result success'>✓ attendance_records table created successfully!</div>";
            } catch (PDOException $e) {
                echo "<div class='result error'>✗ Failed to create table: " . $e->getMessage() . "</div>";
            }
        }
    } catch (PDOException $e) {
        echo "<div class='result error'>✗ Error checking table: " . $e->getMessage() . "</div>";
    }

    echo "<h2>3. Check employees Table</h2>";
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM employees WHERE status = 'active'");
        $empCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        echo "<div class='result'>Active employees: <strong>$empCount</strong></div>";

        if ($empCount > 0) {
            $stmt = $pdo->query("SELECT id, employee_number, full_name, position FROM employees WHERE status = 'active' LIMIT 5");
            $employees = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo "<div class='result'><strong>Sample employees:</strong><ul>";
            foreach ($employees as $emp) {
                echo "<li>{$emp['full_name']} (#{$emp['employee_number']}) - {$emp['position']}</li>";
            }
            echo "</ul></div>";
        }
    } catch (PDOException $e) {
        echo "<div class='result error'>✗ Error checking employees: " . $e->getMessage() . "</div>";
    }

    echo "<h2>4. Test API Endpoint</h2>";
    echo "<div class='result'>";
    echo "<a href='php/staff-timekeeping-api.php?action=get_all_records&period=today' target='_blank'>
            Test API: Get Today's Records
          </a>";
    echo "</div>";

    echo "<h2>5. Sample Attendance Records</h2>";
    try {
        $stmt = $pdo->query("
            SELECT
                ar.date,
                ar.time_in,
                ar.time_out,
                ar.hours_worked,
                ar.status,
                e.full_name,
                e.employee_number,
                e.position
            FROM attendance_records ar
            JOIN employees e ON ar.employee_id = e.id
            ORDER BY ar.date DESC, ar.time_in DESC
            LIMIT 10
        ");
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (count($records) > 0) {
            echo "<div class='result success'>Found " . count($records) . " recent records:</div>";
            echo "<table border='1' cellpadding='8' style='border-collapse: collapse; width: 100%;'>";
            echo "<tr>
                    <th>Date</th>
                    <th>Employee</th>
                    <th>Position</th>
                    <th>Time In</th>
                    <th>Time Out</th>
                    <th>Hours</th>
                    <th>Status</th>
                  </tr>";

            foreach ($records as $record) {
                echo "<tr>";
                echo "<td>" . $record['date'] . "</td>";
                echo "<td>" . $record['full_name'] . " (#{$record['employee_number']})</td>";
                echo "<td>" . $record['position'] . "</td>";
                echo "<td>" . ($record['time_in'] ?? '-') . "</td>";
                echo "<td>" . ($record['time_out'] ?? '-') . "</td>";
                echo "<td>" . ($record['hours_worked'] ?? '0') . " hrs</td>";
                echo "<td>" . $record['status'] . "</td>";
                echo "</tr>";
            }
            echo "</table>";
        } else {
            echo "<div class='result'>No attendance records found yet. Clock in/out using the Time Clock Terminal to create records.</div>";
        }
    } catch (PDOException $e) {
        echo "<div class='result error'>✗ Error fetching records: " . $e->getMessage() . "</div>";
    }
    ?>

    <hr>
    <h2>Instructions</h2>
    <ol>
        <li>If the attendance_records table didn't exist, it has now been created</li>
        <li>Go to the Time Clock Terminal and have an employee clock in</li>
        <li>Then go to Manager Dashboard → Staff & Timekeeping</li>
        <li>The records should now appear in "Today's Timekeeping Records"</li>
    </ol>

    <p><a href="index.php">← Back to POS System</a></p>
</body>
</html>
