<?php
require_once __DIR__ . '/database.php';

$pdo = getDatabaseConnection();
if (!$pdo) {
    die("Database connection failed\n");
}

try {
    // Drop the foreign key constraint
    echo "Attempting to drop foreign key constraint...\n";
    $pdo->exec("ALTER TABLE attendance_records DROP FOREIGN KEY attendance_records_ibfk_1");
    echo "Successfully dropped foreign key constraint!\n";

    // Optionally, add a new foreign key to staff_accounts if needed
    echo "\nAttempting to add new foreign key to staff_accounts...\n";
    $pdo->exec("ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_staff_fk FOREIGN KEY (employee_id) REFERENCES staff_accounts(id) ON DELETE CASCADE");
    echo "Successfully added new foreign key constraint to staff_accounts!\n";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
