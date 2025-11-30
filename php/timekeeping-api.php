<?php
/**
 * Time Keeping System API
 * Handles employee clock in/out and attendance tracking
 */

// Prevent any output before JSON response
error_reporting(0);
ini_set('display_errors', '0');

header('Content-Type: application/json');

// Database connection
try {
    require_once __DIR__ . '/database.php';
    $pdo = getDatabaseConnection();
    if (!$pdo) {
        echo json_encode(['success' => false, 'message' => 'Database connection not available']);
        exit;
    }
} catch (Throwable $e) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

// Handle GET requests
if ($method === 'GET') {
    $action = $_GET['action'] ?? '';

    switch ($action) {
        case 'check_status':
            checkEmployeeStatus($pdo);
            break;

        case 'get_history':
            getAttendanceHistory($pdo);
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
    exit;
}

// Handle POST requests
if ($method === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    $action = $data['action'] ?? '';

    switch ($action) {
        case 'time_in':
            handleTimeIn($pdo, $data);
            break;

        case 'time_out':
            handleTimeOut($pdo, $data);
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
    exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid request method']);

/**
 * Check Employee Status
 */
function checkEmployeeStatus($pdo) {
    $employeeNumber = $_GET['employee_number'] ?? '';

    if (empty($employeeNumber)) {
        echo json_encode(['success' => false, 'message' => 'Employee number is required']);
        return;
    }

    try {
        // Get employee details from staff_accounts
        $stmt = $pdo->prepare('SELECT * FROM staff_accounts WHERE employee_number = ? AND status = ?');
        $stmt->execute([$employeeNumber, 'Active']);
        $employee = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$employee) {
            echo json_encode(['success' => false, 'message' => 'Employee not found or inactive']);
            return;
        }

        // Get today's attendance record
        $today = date('Y-m-d');

        $status = [
            'time_in' => null,
            'time_out' => null,
            'hours_worked' => null,
            'is_locked' => false
        ];

        // Try to get attendance record, but don't fail if table doesn't exist
        try {
            $stmt = $pdo->prepare('
                SELECT *
                FROM attendance_records
                WHERE employee_id = ? AND date = ?
            ');
            $stmt->execute([$employee['id'], $today]);
            $attendance = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($attendance) {
                $status['time_in'] = $attendance['time_in'] ? date('h:i A', strtotime($attendance['time_in'])) : null;
                $status['time_out'] = $attendance['time_out'] ? date('h:i A', strtotime($attendance['time_out'])) : null;
                $status['hours_worked'] = $attendance['hours_worked'] ? number_format($attendance['hours_worked'], 2) . ' hrs' : null;
                $status['is_locked'] = (bool)($attendance['is_locked'] ?? 0);
            }
        } catch (PDOException $attendanceError) {
            // Attendance records table might not exist yet - that's okay
            // Status will just show default null values
        }

        echo json_encode([
            'success' => true,
            'employee' => $employee,
            'status' => $status
        ]);

    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

/**
 * Handle Time In
 */
function handleTimeIn($pdo, $data) {
    $employeeNumber = $data['employee_number'] ?? '';

    if (empty($employeeNumber)) {
        echo json_encode(['success' => false, 'message' => 'Employee number is required']);
        return;
    }

    try {
        $pdo->beginTransaction();

        // Get employee from staff_accounts
        $stmt = $pdo->prepare('SELECT * FROM staff_accounts WHERE employee_number = ? AND status = ?');
        $stmt->execute([$employeeNumber, 'Active']);
        $employee = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$employee) {
            $pdo->rollBack();
            echo json_encode(['success' => false, 'message' => 'Employee not found']);
            return;
        }

        $today = date('Y-m-d');
        $now = date('Y-m-d H:i:s');

        // Check if already timed in today
        $stmt = $pdo->prepare('SELECT * FROM attendance_records WHERE employee_id = ? AND date = ?');
        $stmt->execute([$employee['id'], $today]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            if ($existing['time_in']) {
                $pdo->rollBack();
                echo json_encode(['success' => false, 'message' => 'You have already timed in today']);
                return;
            }
        }

        // Create or update attendance record
        if ($existing) {
            $stmt = $pdo->prepare('
                UPDATE attendance_records
                SET time_in = ?, status = ?
                WHERE id = ?
            ');
            $stmt->execute([$now, 'present', $existing['id']]);
            $recordId = $existing['id'];
        } else {
            $stmt = $pdo->prepare('
                INSERT INTO attendance_records (employee_id, employee_number, date, time_in, status)
                VALUES (?, ?, ?, ?, ?)
            ');
            $stmt->execute([$employee['id'], $employeeNumber, $today, $now, 'present']);
            $recordId = $pdo->lastInsertId();
        }

        // Log the time in
        $stmt = $pdo->prepare('
            INSERT INTO time_logs (attendance_record_id, employee_id, action, timestamp, ip_address)
            VALUES (?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $recordId,
            $employee['id'],
            'time_in',
            $now,
            $_SERVER['REMOTE_ADDR'] ?? null
        ]);

        $pdo->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Time in successful',
            'employee_name' => $employee['name'],
            'time_in' => date('h:i A', strtotime($now))
        ]);

    } catch (PDOException $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

/**
 * Handle Time Out
 */
function handleTimeOut($pdo, $data) {
    $employeeNumber = $data['employee_number'] ?? '';

    if (empty($employeeNumber)) {
        echo json_encode(['success' => false, 'message' => 'Employee number is required']);
        return;
    }

    try {
        $pdo->beginTransaction();

        // Get employee from staff_accounts
        $stmt = $pdo->prepare('SELECT * FROM staff_accounts WHERE employee_number = ? AND status = ?');
        $stmt->execute([$employeeNumber, 'Active']);
        $employee = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$employee) {
            $pdo->rollBack();
            echo json_encode(['success' => false, 'message' => 'Employee not found']);
            return;
        }

        $today = date('Y-m-d');
        $now = date('Y-m-d H:i:s');

        // Get today's attendance record
        $stmt = $pdo->prepare('SELECT * FROM attendance_records WHERE employee_id = ? AND date = ?');
        $stmt->execute([$employee['id'], $today]);
        $attendance = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$attendance) {
            $pdo->rollBack();
            echo json_encode(['success' => false, 'message' => 'You must time in first']);
            return;
        }

        if (!$attendance['time_in']) {
            $pdo->rollBack();
            echo json_encode(['success' => false, 'message' => 'You must time in first']);
            return;
        }

        if ($attendance['time_out']) {
            $pdo->rollBack();
            echo json_encode(['success' => false, 'message' => 'You have already timed out today']);
            return;
        }

        if ($attendance['is_locked']) {
            $pdo->rollBack();
            echo json_encode(['success' => false, 'message' => 'Your attendance for today is already locked']);
            return;
        }

        // Update attendance record with time out
        // The trigger will calculate hours_worked and lock the record
        $stmt = $pdo->prepare('
            UPDATE attendance_records
            SET time_out = ?
            WHERE id = ?
        ');
        $stmt->execute([$now, $attendance['id']]);

        // Get updated record to get hours worked
        $stmt = $pdo->prepare('SELECT hours_worked FROM attendance_records WHERE id = ?');
        $stmt->execute([$attendance['id']]);
        $updated = $stmt->fetch(PDO::FETCH_ASSOC);

        // Log the time out
        $stmt = $pdo->prepare('
            INSERT INTO time_logs (attendance_record_id, employee_id, action, timestamp, ip_address)
            VALUES (?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $attendance['id'],
            $employee['id'],
            'time_out',
            $now,
            $_SERVER['REMOTE_ADDR'] ?? null
        ]);

        $pdo->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Time out successful',
            'employee_name' => $employee['name'],
            'time_out' => date('h:i A', strtotime($now)),
            'hours_worked' => number_format($updated['hours_worked'], 2) . ' hours'
        ]);

    } catch (PDOException $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

/**
 * Get Attendance History
 */
function getAttendanceHistory($pdo) {
    $employeeNumber = $_GET['employee_number'] ?? '';
    $period = $_GET['period'] ?? 'weekly';

    if (empty($employeeNumber)) {
        echo json_encode(['success' => false, 'message' => 'Employee number is required']);
        return;
    }

    try {
        // Get employee from staff_accounts
        $stmt = $pdo->prepare('SELECT id FROM staff_accounts WHERE employee_number = ?');
        $stmt->execute([$employeeNumber]);
        $employee = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$employee) {
            echo json_encode(['success' => false, 'message' => 'Employee not found']);
            return;
        }

        // Determine date range based on period
        $dateCondition = '';
        switch ($period) {
            case 'weekly':
                $dateCondition = 'AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
                break;
            case 'semi-monthly':
                $dateCondition = 'AND date >= DATE_SUB(CURDATE(), INTERVAL 15 DAY)';
                break;
            case 'monthly':
                $dateCondition = 'AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
                break;
            case 'yearly':
                $dateCondition = 'AND date >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)';
                break;
        }

        // Get attendance records
        $stmt = $pdo->prepare("
            SELECT date, time_in, time_out, hours_worked, status
            FROM attendance_records
            WHERE employee_id = ? $dateCondition
            ORDER BY date DESC
            LIMIT 100
        ");
        $stmt->execute([$employee['id']]);
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'records' => $records,
            'period' => $period
        ]);

    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}
