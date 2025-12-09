<?php
/**
 * Staff Timekeeping API
 * Handles fetching all employee attendance records for managers
 */

// Set timezone to Manila
date_default_timezone_set('Asia/Manila');

header('Content-Type: application/json');
error_reporting(0);
ini_set('display_errors', '0');

require_once __DIR__ . '/database.php';

try {
    $pdo = getDatabaseConnection();

    if (!$pdo) {
        echo json_encode(['success' => false, 'message' => 'Database connection not available']);
        exit;
    }

    $action = $_GET['action'] ?? '';

    switch ($action) {
        case 'get_all_records':
            getAllTimekeepingRecords($pdo);
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

/**
 * Get all employee timekeeping records based on period or specific date
 */
function getAllTimekeepingRecords($pdo) {
    $period = $_GET['period'] ?? 'today';
    $date = $_GET['date'] ?? null;

    try {
        $sql = "
            SELECT
                ar.date,
                ar.time_in,
                ar.time_out,
                ar.hours_worked,
                ar.status,
                e.full_name as employee_name,
                e.employee_number,
                e.position,
                e.department
            FROM attendance_records ar
            JOIN employees e ON ar.employee_id = e.id
        ";

        $params = [];

        // Filter by date or period
        if ($date) {
            // Specific date
            $sql .= " WHERE DATE(ar.date) = ?";
            $params[] = $date;
        } else {
            // Period filter
            switch ($period) {
                case 'today':
                    $sql .= " WHERE DATE(ar.date) = CURDATE()";
                    break;
                case 'week':
                    $sql .= " WHERE ar.date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
                    break;
                case 'month':
                    $sql .= " WHERE ar.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
                    break;
            }
        }

        $sql .= " ORDER BY ar.date DESC, ar.time_in DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'records' => $records,
            'count' => count($records)
        ]);

    } catch (PDOException $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    }
}
