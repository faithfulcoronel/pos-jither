<?php

declare(strict_types=1);

require_once __DIR__ . '/database.php';
require_once __DIR__ . '/data_functions.php';

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
    'Others',
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
            ['id' => 1, 'item' => 'Coffee Beans', 'qty' => 10, 'unit' => 'kg'],
            ['id' => 2, 'item' => 'Milk', 'qty' => 25, 'unit' => 'L'],
            ['id' => 3, 'item' => 'Cups', 'qty' => 300, 'unit' => 'pcs'],
        ],
        'staffAccounts' => [
            ['id' => 1, 'role' => 'Manager', 'name' => 'Jowen', 'status' => 'Inactive', 'timeIn' => null, 'timeOut' => null],
            ['id' => 2, 'role' => 'Cashier', 'name' => 'Elsa', 'status' => 'Inactive', 'timeIn' => null, 'timeOut' => null],
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
