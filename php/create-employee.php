<?php
/**
 * Create Employee in Timekeeping System
 * This endpoint creates an employee record for time tracking
 */

header('Content-Type: application/json');

// Database connection
require_once __DIR__ . '/db.php';

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Get JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Validate required fields
$employeeNumber = $data['employee_number'] ?? '';
$fullName = $data['full_name'] ?? '';
$position = $data['position'] ?? '';
$department = $data['department'] ?? 'Café Staff';
$status = $data['status'] ?? 'active';

if (empty($employeeNumber) || empty($fullName)) {
    echo json_encode([
        'success' => false,
        'message' => 'Employee number and full name are required'
    ]);
    exit;
}

try {
    // Check if employee already exists
    $stmt = $pdo->prepare('SELECT id FROM employees WHERE employee_number = ?');
    $stmt->execute([$employeeNumber]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        echo json_encode([
            'success' => false,
            'message' => 'Employee number already exists'
        ]);
        exit;
    }

    // Insert new employee
    $stmt = $pdo->prepare('
        INSERT INTO employees (employee_number, full_name, position, department, status, date_hired)
        VALUES (?, ?, ?, ?, ?, CURDATE())
    ');

    $stmt->execute([
        $employeeNumber,
        $fullName,
        $position,
        $department,
        $status
    ]);

    $employeeId = $pdo->lastInsertId();

    echo json_encode([
        'success' => true,
        'message' => 'Employee created successfully',
        'employee_id' => $employeeId,
        'employee_number' => $employeeNumber,
        'full_name' => $fullName
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
