<?php

// Helper script to re-activate EMP001 across employees and staff_accounts tables.
// Run once via browser or CLI: php php/reactivate_emp001.php

declare(strict_types=1);

require __DIR__ . '/database.php';

$pdo = getDatabaseConnection();
if (!$pdo) {
    exit("Unable to connect to the database.\n");
}

$pdo->beginTransaction();

$updatedEmployees = 0;
$updatedStaff = 0;
$insertedEmployee = false;

try {
    // Ensure employees entry exists and is active
    $stmt = $pdo->prepare('SELECT id FROM employees WHERE employee_number = ?');
    $stmt->execute(['EMP001']);
    $employee = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($employee) {
        $update = $pdo->prepare('UPDATE employees SET status = ? WHERE employee_number = ?');
        $update->execute(['active', 'EMP001']);
        $updatedEmployees = $update->rowCount();
    } else {
        $insert = $pdo->prepare('
            INSERT INTO employees (employee_number, full_name, role, department, status, date_hired)
            VALUES (?, ?, ?, ?, ?, CURDATE())
        ');
        $insert->execute(['EMP001', 'Jowen', 'Manager', 'Management', 'active']);
        $insertedEmployee = true;
    }

    // Ensure staff_accounts entry is active
    $stmt = $pdo->prepare('SELECT id FROM staff_accounts WHERE employee_number = ?');
    $stmt->execute(['EMP001']);
    $staff = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($staff) {
        $update = $pdo->prepare('UPDATE staff_accounts SET status = ? WHERE employee_number = ?');
        $update->execute(['Active', 'EMP001']);
        $updatedStaff = $update->rowCount();
    }

    $pdo->commit();

    $messages = [];
    if ($insertedEmployee) {
        $messages[] = 'Inserted EMP001 into employees (active).';
    } elseif ($updatedEmployees > 0) {
        $messages[] = 'Updated EMP001 status to active in employees.';
    } else {
        $messages[] = 'EMP001 already active in employees.';
    }

    if ($updatedStaff > 0) {
        $messages[] = 'Updated EMP001 status to Active in staff_accounts.';
    } else {
        $messages[] = 'EMP001 already Active in staff_accounts (or not found).';
    }

    echo implode("\n", $messages) . "\n";
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    exit("Failed to reactivate EMP001: " . $e->getMessage() . "\n");
}
