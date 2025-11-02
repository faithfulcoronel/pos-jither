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
            switch ($resource) {
                case 'initial-data':
                    $data = loadDataFromDatabase($pdo);
                    sendSuccess($data);
                    break;

                case 'sales-transactions':
                    if ($action === 'get-daily') {
                        try {
                            $stmt = $pdo->prepare("
                                SELECT id, reference, total, created_at
                                FROM sales_transactions
                                WHERE DATE(created_at) = CURDATE()
                                ORDER BY created_at ASC
                            ");
                            $stmt->execute();
                            $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

                            $counter = 1; // start order number

                            foreach ($transactions as &$tx) {
                                // Assign formatted Order No (like #001, #002, etc.)
                                $tx['order_no'] = '#' . str_pad((string)$counter++, 3, '0', STR_PAD_LEFT);

                                $itemStmt = $pdo->prepare("
                                    SELECT
                                        product_name AS name,
                                        quantity AS qty,
                                        unit_price AS price,
                                        (quantity * unit_price) AS subtotal
                                    FROM sales_transaction_items
                                    WHERE transaction_id = ?
                                ");
                                $itemStmt->execute([$tx['id']]);
                                $items = $itemStmt->fetchAll(PDO::FETCH_ASSOC);

                                // Format items properly
                                $tx['items'] = array_map(function ($item) {
                                    return [
                                        'name' => $item['name'] ?? 'Unknown Item',
                                        'qty' => (int)($item['qty'] ?? 0),
                                        'price' => (float)($item['price'] ?? 0),
                                        'subtotal' => (float)($item['subtotal'] ?? 0),
                                    ];
                                }, $items);

                                // Add readable item summary (for frontend display)
                                $tx['item_summary'] = !empty($tx['items'])
                                    ? implode(', ', array_map(fn($i) => "{$i['qty']}x {$i['name']}", $tx['items']))
                                    : 'No items';
                            }

                            sendSuccess($transactions);
                        } catch (Exception $e) {
                            sendError($e->getMessage(), 500);
                        }
                    } elseif ($action === 'get-by-date') {
                        try {
                            // Get optional date filter from query parameter
                            $filterDate = isset($_GET['date']) ? trim($_GET['date']) : '';

                            if (!empty($filterDate)) {
                                // Validate date format (YYYY-MM-DD)
                                if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $filterDate)) {
                                    sendError('Invalid date format. Use YYYY-MM-DD.', 400);
                                }

                                // Fetch transactions for specific date
                                $stmt = $pdo->prepare("
                                    SELECT id, reference, total, created_at
                                    FROM sales_transactions
                                    WHERE DATE(created_at) = :filter_date
                                    ORDER BY created_at DESC
                                ");
                                $stmt->execute(['filter_date' => $filterDate]);
                            } else {
                                // Fetch all transactions
                                $stmt = $pdo->prepare("
                                    SELECT id, reference, total, created_at
                                    FROM sales_transactions
                                    ORDER BY created_at DESC
                                ");
                                $stmt->execute();
                            }

                            $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
                            sendSuccess($transactions);
                        } catch (Exception $e) {
                            sendError($e->getMessage(), 500);
                        }
                    } elseif ($action === 'get-next-reference') {
                        try {
                            // Get today's transaction count to generate next reference
                            $today = date('Ymd');
                            $stmt = $pdo->prepare("SELECT COUNT(*) FROM sales_transactions WHERE DATE(created_at) = CURDATE()");
                            $stmt->execute();
                            $countToday = (int)$stmt->fetchColumn() + 1;
                            $nextReference = sprintf('TXN%s-%04d', $today, $countToday);

                            sendSuccess(['next_reference' => $nextReference]);
                        } catch (Exception $e) {
                            sendError($e->getMessage(), 500);
                        }
                    } else {
                        sendError('Unsupported action for sales-transactions.', 400);
                    }
                    break;

                default:
                    throw new InvalidArgumentException('Unsupported GET resource.');
            }
            break;

        case 'POST':
            handlePostRequest($pdo, $resource, $action, $input['data'] ?? []);
            break;

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

    // Flag to determine if we should return full refreshed data
    $shouldRefreshData = true;

    switch ($resource) {
        case 'product-categories':
            if ($action === 'create') {
                createProductCategory($pdo, $data);
            } elseif ($action === 'delete') {
                deleteProductCategory($pdo, $data);
            } else {
                throw new InvalidArgumentException('Unsupported action for product categories.');
            }
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


        case 'sales-transactions':
            // Sales transactions handle their own response and don't need refresh
            $shouldRefreshData = false;

            if ($action === 'create') {
                try {
                    $pdo->beginTransaction();

                    // Auto-generate unique reference if missing or duplicate
                    $reference = $data['reference'] ?? '';
                    if (empty($reference) || strtoupper(trim($reference)) === 'N/A') {
                        $today = date('Ymd');
                        $stmt = $pdo->prepare("SELECT COUNT(*) FROM sales_transactions WHERE DATE(created_at) = CURDATE()");
                        $stmt->execute();
                        $countToday = (int)$stmt->fetchColumn() + 1;
                        $reference = sprintf('TXN%s-%04d', $today, $countToday);
                    }

                    // Insert into sales_transactions
                    $stmt = $pdo->prepare("
                        INSERT INTO sales_transactions (reference, total, created_at, occurred_at)
                        VALUES (?, ?, NOW(), NOW())
                    ");
                    $stmt->execute([
                        $reference,
                        $data['total'] ?? 0
                    ]);
                    $transactionId = $pdo->lastInsertId();

                    // Insert each item
                    if (!empty($data['items'])) {
                        $itemStmt = $pdo->prepare("
                            INSERT INTO sales_transaction_items (transaction_id, product_id, product_name, quantity, unit_price, created_at)
                            VALUES (?, ?, ?, ?, ?, NOW())
                        ");
                        foreach ($data['items'] as $item) {
                            $itemStmt->execute([
                                $transactionId,
                                $item['product_id'] ?? null,
                                $item['product_name'] ?? '',
                                $item['quantity'] ?? 0,
                                $item['unit_price'] ?? 0
                            ]);
                        }
                    }

                    $pdo->commit();
                    sendSuccess([
                        'transaction_id' => $transactionId,
                        'reference' => $reference
                    ]);
                } catch (Exception $e) {
                    $pdo->rollBack();
                    sendError('Failed to save transaction: ' . $e->getMessage(), 500);
                }
            } else {
                sendError('Unsupported action for sales-transactions.', 400);
            }
            break;

        default:
            throw new InvalidArgumentException('Unsupported resource.');
    }

    // Universal data refresh: Return full dataset for all resources (except special cases)
    if ($shouldRefreshData) {
        $refreshedData = loadDataFromDatabase($pdo);
        sendSuccess($refreshedData);
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
?>
