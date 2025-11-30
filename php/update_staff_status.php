<?php
require_once __DIR__ . '/database.php';

$pdo = getDatabaseConnection();
if (!$pdo) {
    die("Database connection failed\n");
}

try {
    $stmt = $pdo->prepare("UPDATE staff_accounts SET status = 'Active' WHERE status = 'Inactive' OR status IS NULL");
    $stmt->execute();
    $count = $stmt->rowCount();
    echo "Successfully updated $count staff member(s) to Active status\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
