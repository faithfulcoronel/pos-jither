<?php

declare(strict_types=1);

require_once __DIR__ . '/database.php';

$pdo = getDatabaseConnection();
if ($pdo !== null) {
    try {
        $databaseData = loadDataFromDatabase($pdo);
        if (!empty($databaseData['productCategories']) || !empty($databaseData['products'])) {
            return $databaseData;
        }
    } catch (\Throwable $exception) {
        error_log('Unable to load demo data from the database: ' . $exception->getMessage());
    }
}

require_once __DIR__ . '/models/ProductCatalog.php';

$catalog = new ProductCatalog();

$catalog->addCategory(new ProductCategory(
    'coffee-classics',
    'Coffee Classics',
    'Traditional espresso beverages prepared with freshly ground beans.'
));
$catalog->addCategory(new ProductCategory(
    'signature-espresso',
    'Signature Espresso Creations',
    'Creamy espresso drinks finished with silky steamed milk.'
));
$catalog->addCategory(new ProductCategory(
    'iced-favorites',
    'Iced Favorites',
    'Chilled beverages perfect for warm afternoons.'
));
$catalog->addCategory(new ProductCategory(
    'non-coffee',
    'Non-Coffee & Tea',
    'Comforting alternatives for non-coffee drinkers.'
));
$catalog->addCategory(new ProductCategory(
    'uncategorized',
    'Uncategorized',
    'Items that are awaiting classification.'
));

$catalog->addProduct(new Product(
    'espresso',
    'Espresso',
    80.0,
    'coffee-classics',
    'espresso.jpeg',
    'A bold single shot of our house espresso.'
));
$catalog->addProduct(new Product(
    'cappuccino',
    'Cappuccino',
    120.0,
    'signature-espresso',
    'cappuccino.jpeg',
    'Espresso topped with velvety steamed milk foam.'
));
$catalog->addProduct(new Product(
    'latte',
    'Latte',
    110.0,
    'signature-espresso',
    'latte.jpeg',
    'Silky espresso balanced with lightly textured milk.'
));
$catalog->addProduct(new Product(
    'mocha',
    'Mocha',
    130.0,
    'iced-favorites',
    'mocha.jpeg',
    'Chocolate-infused espresso finished with whipped cream.'
));

return array_merge(
    $catalog->toArray(),
    [
        'inventory' => [
            ['item' => 'Coffee Beans', 'qty' => 10, 'unit' => 'kg'],
            ['item' => 'Milk', 'qty' => 25, 'unit' => 'L'],
            ['item' => 'Cups', 'qty' => 300, 'unit' => 'pcs'],
        ],
        'staffAccounts' => [
            ['role' => 'Manager', 'name' => 'Jowen', 'status' => 'Inactive', 'timeIn' => null, 'timeOut' => null],
            ['role' => 'Cashier', 'name' => 'Elsa', 'status' => 'Inactive', 'timeIn' => null, 'timeOut' => null],
        ],
        'timekeepingRecords' => [],
        'completedTransactions' => [
            ['id' => 101, 'total' => 360, 'timestamp' => '2025-09-19T10:00:00Z', 'items' => [['name' => 'Cappuccino', 'qty' => 2]]],
            ['id' => 102, 'total' => 240, 'timestamp' => '2025-09-19T11:30:00Z', 'items' => [
                ['name' => 'Latte', 'qty' => 1],
                ['name' => 'Espresso', 'qty' => 1],
            ]],
            ['id' => 103, 'total' => 110, 'timestamp' => '2025-09-19T14:00:00Z', 'items' => [['name' => 'Mocha', 'qty' => 1]]],
            ['id' => 104, 'total' => 120, 'timestamp' => '2025-09-19T15:00:00Z', 'items' => [['name' => 'Cappuccino', 'qty' => 1]]],
            ['id' => 105, 'total' => 260, 'timestamp' => '2025-09-19T16:30:00Z', 'items' => [['name' => 'Mocha', 'qty' => 2]]],
        ],
    ]
);

/**
 * @return array<string, mixed>
 */
function loadDataFromDatabase(\PDO $pdo): array
{
    return [
        'productCategories' => fetchProductCategories($pdo),
        'products' => fetchProducts($pdo),
        'inventory' => fetchInventoryItems($pdo),
        'staffAccounts' => fetchStaffAccounts($pdo),
        'timekeepingRecords' => fetchTimekeepingRecords($pdo),
        'completedTransactions' => fetchCompletedTransactions($pdo),
    ];
}

/**
 * @return array<int, array<string, mixed>>
 */
function fetchProductCategories(\PDO $pdo): array
{
    $statement = $pdo->query('SELECT id, name, description FROM product_categories ORDER BY name');

    $categories = [];
    foreach ($statement as $row) {
        $categories[] = [
            'id' => (string)($row['id'] ?? ''),
            'name' => (string)($row['name'] ?? ''),
            'description' => (string)($row['description'] ?? ''),
        ];
    }

    return $categories;
}

/**
 * @return array<int, array<string, mixed>>
 */
function fetchProducts(\PDO $pdo): array
{
    $statement = $pdo->query('SELECT id, name, price, category_id, image, description FROM products ORDER BY name');

    $products = [];
    foreach ($statement as $row) {
        $products[] = [
            'id' => (string)($row['id'] ?? ''),
            'name' => (string)($row['name'] ?? ''),
            'price' => (float)($row['price'] ?? 0),
            'categoryId' => (string)($row['category_id'] ?? 'uncategorized'),
            'image' => (string)($row['image'] ?? ''),
            'description' => (string)($row['description'] ?? ''),
        ];
    }

    return $products;
}

/**
 * @return array<int, array<string, mixed>>
 */
function fetchInventoryItems(\PDO $pdo): array
{
    $statement = $pdo->query('SELECT item, quantity, unit FROM inventory_items ORDER BY item');

    $inventory = [];
    foreach ($statement as $row) {
        $quantity = $row['quantity'];
        $inventory[] = [
            'item' => (string)($row['item'] ?? ''),
            'qty' => is_numeric($quantity) ? (float)$quantity : 0,
            'unit' => (string)($row['unit'] ?? ''),
        ];
    }

    return $inventory;
}

/**
 * @return array<int, array<string, mixed>>
 */
function fetchStaffAccounts(\PDO $pdo): array
{
    $statement = $pdo->query('SELECT role, name, status, time_in, time_out FROM staff_accounts ORDER BY id');

    $staff = [];
    foreach ($statement as $row) {
        $staff[] = [
            'role' => (string)($row['role'] ?? ''),
            'name' => (string)($row['name'] ?? ''),
            'status' => (string)($row['status'] ?? 'Inactive'),
            'timeIn' => formatDateTime($row['time_in'] ?? null),
            'timeOut' => formatDateTime($row['time_out'] ?? null),
        ];
    }

    return $staff;
}

/**
 * @return array<int, array<string, mixed>>
 */
function fetchTimekeepingRecords(\PDO $pdo): array
{
    $statement = $pdo->query('SELECT staff_name, role, time_in, time_out FROM timekeeping_records ORDER BY time_in DESC');

    $records = [];
    foreach ($statement as $row) {
        $records[] = [
            'name' => (string)($row['staff_name'] ?? ''),
            'role' => (string)($row['role'] ?? ''),
            'timeIn' => formatDateTime($row['time_in'] ?? null),
            'timeOut' => formatDateTime($row['time_out'] ?? null),
        ];
    }

    return $records;
}

/**
 * @return array<int, array<string, mixed>>
 */
function fetchCompletedTransactions(\PDO $pdo): array
{
    $statement = $pdo->query('SELECT id, reference, total, occurred_at FROM sales_transactions ORDER BY occurred_at DESC');
    $itemsStatement = $pdo->prepare('SELECT product_name, quantity FROM sales_transaction_items WHERE transaction_id = :transaction ORDER BY id');

    $transactions = [];
    foreach ($statement as $row) {
        $transactionId = (int)($row['id'] ?? 0);
        $itemsStatement->execute(['transaction' => $transactionId]);

        $items = [];
        foreach ($itemsStatement->fetchAll() as $itemRow) {
            $items[] = [
                'name' => (string)($itemRow['product_name'] ?? ''),
                'qty' => (int)($itemRow['quantity'] ?? 0),
            ];
        }

        $timestamp = formatDateTime($row['occurred_at'] ?? null);
        if ($timestamp === null) {
            $timestamp = (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM);
        }

        $transactions[] = [
            'id' => normalizeTransactionReference($row['reference'] ?? '', $transactionId),
            'total' => (float)($row['total'] ?? 0),
            'timestamp' => $timestamp,
            'items' => $items,
        ];
    }

    return $transactions;
}

/**
 * @return int|string
 */
function normalizeTransactionReference(string $reference, int $fallback): int|string
{
    $trimmed = trim($reference);
    if ($trimmed === '') {
        return $fallback;
    }

    return ctype_digit($trimmed) ? (int)$trimmed : $trimmed;
}

function formatDateTime(?string $value): ?string
{
    if ($value === null || $value === '') {
        return null;
    }

    try {
        return (new \DateTimeImmutable($value))->format(\DateTimeInterface::ATOM);
    } catch (\Exception $exception) {
        return null;
    }
}
