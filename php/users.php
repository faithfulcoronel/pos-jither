<?php

declare(strict_types=1);

require_once __DIR__ . '/database.php';

$pdo = getDatabaseConnection();
if ($pdo !== null) {
    try {
        $users = loadUsersFromDatabase($pdo);
        if ($users !== []) {
            return $users;
        }
    } catch (\Throwable $exception) {
        error_log('Unable to load users from the database: ' . $exception->getMessage());
    }
}

return [
    'manager' => [
        'role' => 'manager',
        'username' => 'manager',
        'password' => '1234',
    ],
    'cashier' => [
        'role' => 'cashier',
        'username' => 'cashier',
        'password' => '1234',
    ],
];

/**
 * @return array<string, array<string, ?string>>
 */
function loadUsersFromDatabase(\PDO $pdo): array
{
    $statement = $pdo->query('SELECT role, username, password_hash FROM users ORDER BY id');

    $users = [];
    foreach ($statement as $row) {
        $roleKey = (string)($row['role'] ?? '');
        if ($roleKey === '') {
            $roleKey = strtolower((string)($row['username'] ?? ''));
        }
        if ($roleKey === '') {
            continue;
        }

        $users[$roleKey] = [
            'role' => $roleKey,
            'username' => (string)($row['username'] ?? ''),
            'password_hash' => (string)($row['password_hash'] ?? ''),
            'password' => null,
        ];
    }

    return $users;
}
