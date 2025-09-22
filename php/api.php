<?php

declare(strict_types=1);

session_start();

header('Content-Type: application/json');

require_once __DIR__ . '/database.php';
require_once __DIR__ . '/data_functions.php';

$pdo = getDatabaseConnection();
if ($pdo === null) {
    sendError('Database connection is not configured.', 503);
}

if (!isset($_SESSION['role'])) {
    sendError('Authentication is required.', 403);
}

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$input = [];

if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
    $rawBody = file_get_contents('php://input');
    if ($rawBody !== false && $rawBody !== '') {
        $decoded = json_decode($rawBody, true);
        if (!is_array($decoded)) {
            sendError('Invalid JSON payload.', 400);
        }

        $input = $decoded;
    }
}

$resource = (string)($_GET['resource'] ?? ($input['resource'] ?? ''));
$action = (string)($_GET['action'] ?? ($input['action'] ?? ''));

try {
    switch ($method) {
        case 'GET':
            if ($resource === 'initial-data') {
                $data = loadDataFromDatabase($pdo);
                sendSuccess($data);
            }

            throw new InvalidArgumentException('Unsupported GET resource.');

        case 'POST':
            handlePostRequest($pdo, $resource, $action, $input['data'] ?? []);
            $data = loadDataFromDatabase($pdo);
            sendSuccess($data);

        default:
            throw new InvalidArgumentException('Unsupported request method.');
    }
} catch (InvalidArgumentException $exception) {
    sendError($exception->getMessage(), 400);
} catch (RuntimeException $exception) {
    sendError($exception->getMessage(), 404);
} catch (Throwable $exception) {
    error_log('API error: ' . $exception->getMessage());
    sendError('An unexpected error occurred.', 500);
}

function handlePostRequest(PDO $pdo, string $resource, string $action, $data): void
{
    if (!is_array($data)) {
        $data = [];
    }

    switch ($resource) {
        case 'product-categories':
            if ($action !== 'create') {
                throw new InvalidArgumentException('Unsupported action for product categories.');
            }
            createProductCategory($pdo, $data);
            break;

        case 'products':
            if ($action === 'create') {
                createProduct($pdo, $data);
            } elseif ($action === 'update') {
                updateProduct($pdo, $data);
            } elseif ($action === 'delete') {
                deleteProduct($pdo, $data);
            } else {
                throw new InvalidArgumentException('Unsupported action for products.');
            }
            break;

        case 'inventory':
            if ($action === 'create') {
                createInventoryItem($pdo, $data);
            } elseif ($action === 'update') {
                updateInventoryItem($pdo, $data);
            } elseif ($action === 'delete') {
                deleteInventoryItem($pdo, $data);
            } else {
                throw new InvalidArgumentException('Unsupported action for inventory items.');
            }
            break;

        case 'staff-accounts':
            if ($action === 'create') {
                createStaffAccount($pdo, $data);
            } elseif ($action === 'update') {
                updateStaffAccount($pdo, $data);
            } elseif ($action === 'delete') {
                deleteStaffAccount($pdo, $data);
            } elseif ($action === 'time-in') {
                clockInStaffAccount($pdo, $data);
            } elseif ($action === 'time-out') {
                clockOutStaffAccount($pdo, $data);
            } else {
                throw new InvalidArgumentException('Unsupported action for staff accounts.');
            }
            break;

        default:
            throw new InvalidArgumentException('Unsupported resource.');
    }
}

function sendSuccess(array $data): void
{
    echo json_encode([
        'success' => true,
        'data' => $data,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function sendError(string $message, int $status): void
{
    http_response_code($status);
    echo json_encode([
        'success' => false,
        'error' => $message,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
