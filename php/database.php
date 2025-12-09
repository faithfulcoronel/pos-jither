<?php

declare(strict_types=1);

/**
 * Attempt to open a PDO connection to the configured MySQL database.
 *
 * The connection details can be provided using either a full DSN via
 * `DB_DSN`, a DATABASE_URL style string (e.g. mysql://user:pass@host/db),
 * or individual DB_HOST/DB_NAME/DB_USER variables. If no usable
 * configuration is present the function returns null so that the rest of the
 * application can fall back to the bundled in-memory demo data.
 */
function getDatabaseConnection(): ?\PDO
{
    static $connectionAttempted = false;
    static $pdo = null;

    if ($connectionAttempted) {
        return $pdo;
    }

    $connectionAttempted = true;

    if (!class_exists('\PDO')) {
        return null;
    }

    $dsn = getenv('DB_DSN') ?: '';
    $username = getenv('DB_USER') ?: '';
    $password = getenv('DB_PASSWORD') ?: '';

    if ($dsn === '') {
        $databaseUrl = getenv('DATABASE_URL') ?: '';
        if ($databaseUrl !== '') {
            $parsed = parse_url($databaseUrl);
            if ($parsed !== false && isset($parsed['scheme']) && in_array($parsed['scheme'], ['mysql', 'mariadb'], true)) {
                $host = $parsed['host'] ?? '127.0.0.1';
                $port = (string)($parsed['port'] ?? '3306');
                $username = $parsed['user'] ?? $username;
                $password = $parsed['pass'] ?? $password;
                $path = $parsed['path'] ?? '';
                $dbName = $path !== '' ? ltrim($path, '/') : '';
                $charset = getenv('DB_CHARSET') ?: 'utf8mb4';

                if ($dbName !== '') {
                    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=%s', $host, $port, $dbName, $charset);
                }
            }
        }
    }

    if ($dsn === '') {
        $host = getenv('DB_HOST') ?: '';
        $dbName = getenv('DB_NAME') ?: '';
        if ($host === '' || $dbName === '') {
            return null;
        }

        $port = getenv('DB_PORT') ?: '3306';
        $charset = getenv('DB_CHARSET') ?: 'utf8mb4';
        $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=%s', $host, $port, $dbName, $charset);
    }

    try {
        $pdo = new \PDO($dsn, $username, $password, [
            \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
            \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
        ]);

        // Set timezone to Manila (Asia/Manila) for PHP and MySQL
        date_default_timezone_set('Asia/Manila');
        $pdo->exec("SET time_zone = '+08:00'");
    } catch (\PDOException $exception) {
        error_log('Unable to connect to the MySQL database: ' . $exception->getMessage());
        $pdo = null;
    }

    return $pdo;
}
