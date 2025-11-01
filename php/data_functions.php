<?php

declare(strict_types=1);

/**
 * @return array<string, mixed>
 */
function loadDataFromDatabase(PDO $pdo): array
{
    return [
        'productCategories' => fetchProductCategories($pdo),
        'products' => fetchProducts($pdo),
        'inventory' => fetchInventoryItems($pdo),
        'staffAccounts' => fetchStaffAccounts($pdo),
        'timekeepingRecords' => fetchTimekeepingRecords($pdo),
        'completedTransactions' => fetchCompletedTransactions($pdo)
    ];
}

/**
 * @return array<int, array<string, mixed>>
 */
function fetchProductCategories(PDO $pdo): array
{
    $statement = $pdo->query('SELECT id, name, description FROM product_categories ORDER BY name');

    $categories = [];
    foreach ($statement as $row) {
        $categories[] = [
            'id' => (string)($row['id'] ?? ''),
            'name' => (string)($row['name'] ?? ''),
            'description' => isset($row['description']) ? (string)$row['description'] : '',
        ];
    }

    return $categories;
}

/**
 * @return array<int, array<string, mixed>>
 */
function fetchProducts(PDO $pdo): array
{
    $statement = $pdo->query('SELECT id, name, price, category_id, image, description FROM products ORDER BY name');

    $products = [];
    foreach ($statement as $row) {
        $products[] = [
            'id' => (string)($row['id'] ?? ''),
            'name' => (string)($row['name'] ?? ''),
            'price' => isset($row['price']) ? (float)$row['price'] : 0.0,
            'categoryId' => (string)($row['category_id'] ?? ''),
            'image' => isset($row['image']) ? (string)$row['image'] : '',
            'description' => isset($row['description']) ? (string)$row['description'] : '',
        ];
    }

    return $products;
}

/**
 * @return array<int, array<string, mixed>>
 */
function fetchInventoryItems(PDO $pdo): array
{
    $statement = $pdo->query('SELECT id, item, quantity, unit FROM inventory_items ORDER BY item');

    $inventory = [];
    foreach ($statement as $row) {
        $quantity = $row['quantity'] ?? 0;
        $inventory[] = [
            'id' => isset($row['id']) ? (int)$row['id'] : null,
            'item' => (string)($row['item'] ?? ''),
            'qty' => is_numeric($quantity) ? (float)$quantity : 0.0,
            'unit' => (string)($row['unit'] ?? ''),
        ];
    }

    return $inventory;
}

/**
 * @return array<int, array<string, mixed>>
 */
function fetchStaffAccounts(PDO $pdo): array
{
    $statement = $pdo->query('SELECT id, role, name, status, time_in, time_out FROM staff_accounts ORDER BY id');

    $staff = [];
    foreach ($statement as $row) {
        $staff[] = [
            'id' => isset($row['id']) ? (int)$row['id'] : null,
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
function fetchTimekeepingRecords(PDO $pdo): array
{
    $statement = $pdo->query('SELECT id, staff_name, role, time_in, time_out FROM timekeeping_records ORDER BY time_in DESC');

    $records = [];
    foreach ($statement as $row) {
        $records[] = [
            'id' => isset($row['id']) ? (int)$row['id'] : null,
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
function fetchCompletedTransactions(PDO $pdo): array
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
                'qty' => isset($itemRow['quantity']) ? (int)$itemRow['quantity'] : 0,
            ];
        }

        $timestamp = formatDateTime($row['occurred_at'] ?? null);
        if ($timestamp === null) {
            $timestamp = (new DateTimeImmutable())->format(DateTimeImmutable::ATOM);
        }

        $transactions[] = [
            'id' => normalizeTransactionReference($row['reference'] ?? '', $transactionId),
            'total' => isset($row['total']) ? (float)$row['total'] : 0.0,
            'timestamp' => $timestamp,
            'items' => $items,
        ];
    }

    return $transactions;
}

/**
 * @return int|string
 */
function normalizeTransactionReference(string $reference, int $fallback)
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
        return (new DateTimeImmutable($value))->format(DateTimeImmutable::ATOM);
    } catch (Throwable $exception) {
        return null;
    }
}
function slugify(string $text, string $fallbackPrefix): string
{
    $slug = strtolower(trim($text));
    $slug = preg_replace('/[^a-z0-9]+/i', '-', $slug) ?? '';
    $slug = trim($slug, '-');

    if ($slug !== '') {
        return $slug;
    }

    try {
        return sprintf('%s-%s', $fallbackPrefix, bin2hex(random_bytes(4)));
    } catch (Throwable $exception) {
        return sprintf('%s-%s', $fallbackPrefix, uniqid('', true));
    }
}

function generateUniqueCategoryId(PDO $pdo, string $name): string
{
    $baseSlug = slugify($name, 'category');
    $candidate = $baseSlug;
    $statement = $pdo->prepare('SELECT COUNT(*) FROM product_categories WHERE id = :id');
    $counter = 1;

    while (true) {
        $statement->execute(['id' => $candidate]);
        if ((int)$statement->fetchColumn() === 0) {
            return $candidate;
        }

        $counter += 1;
        $candidate = sprintf('%s-%d', $baseSlug, $counter);
    }
}

function generateUniqueProductId(PDO $pdo, string $name): string
{
    $baseSlug = slugify($name, 'product');
    $candidate = $baseSlug;
    $statement = $pdo->prepare('SELECT COUNT(*) FROM products WHERE id = :id');
    $counter = 1;

    while (true) {
        $statement->execute(['id' => $candidate]);
        if ((int)$statement->fetchColumn() === 0) {
            return $candidate;
        }

        $counter += 1;
        $candidate = sprintf('%s-%d', $baseSlug, $counter);
    }
}

function createProductCategory(PDO $pdo, array $payload): void
{
    $name = trim((string)($payload['name'] ?? ''));
    if ($name === '') {
        throw new InvalidArgumentException('Category name is required.');
    }

    $description = trim((string)($payload['description'] ?? ''));

    $duplicateCheck = $pdo->prepare('SELECT id FROM product_categories WHERE LOWER(name) = LOWER(:name) LIMIT 1');
    $duplicateCheck->execute(['name' => $name]);
    if ($duplicateCheck->fetchColumn()) {
        throw new RuntimeException('A category with this name already exists.');
    }

    $id = trim((string)($payload['id'] ?? ''));
    if ($id === '') {
        $id = generateUniqueCategoryId($pdo, $name);
    }

    $statement = $pdo->prepare('INSERT INTO product_categories (id, name, description) VALUES (:id, :name, :description)');
    $statement->execute([
        'id' => $id,
        'name' => $name,
        'description' => $description !== '' ? $description : null,
    ]);
}

function createProduct(PDO $pdo, array $payload): void
{
    $name = trim((string)($payload['name'] ?? ''));
    if ($name === '') {
        throw new InvalidArgumentException('Product name is required.');
    }

    $priceValue = $payload['price'] ?? null;
    if (!is_numeric($priceValue)) {
        throw new InvalidArgumentException('Product price must be a valid number.');
    }

    $price = (float)$priceValue;
    if ($price < 0) {
        throw new InvalidArgumentException('Product price must be zero or greater.');
    }

    $categoryId = trim((string)($payload['categoryId'] ?? ''));
    $image = trim((string)($payload['image'] ?? ''));
    $description = isset($payload['description']) ? trim((string)$payload['description']) : '';

    if ($categoryId !== '') {
        $categoryStatement = $pdo->prepare('SELECT COUNT(*) FROM product_categories WHERE id = :id');
        $categoryStatement->execute(['id' => $categoryId]);
        if ((int)$categoryStatement->fetchColumn() === 0) {
            $categoryId = null;
        }
    } else {
        $categoryId = null;
    }

    $id = trim((string)($payload['id'] ?? ''));
    if ($id === '') {
        $id = generateUniqueProductId($pdo, $name);
    }

    $statement = $pdo->prepare('INSERT INTO products (id, category_id, name, price, image, description) VALUES (:id, :category, :name, :price, :image, :description)');
    $statement->execute([
        'id' => $id,
        'category' => $categoryId,
        'name' => $name,
        'price' => $price,
        'image' => $image !== '' ? $image : null,
        'description' => $description !== '' ? $description : null,
    ]);
}

function updateProduct(PDO $pdo, array $payload): void
{
    $id = trim((string)($payload['id'] ?? ''));
    if ($id === '') {
        throw new InvalidArgumentException('Product ID is required.');
    }

    $name = trim((string)($payload['name'] ?? ''));
    if ($name === '') {
        throw new InvalidArgumentException('Product name is required.');
    }

    $priceValue = $payload['price'] ?? null;
    if (!is_numeric($priceValue)) {
        throw new InvalidArgumentException('Product price must be a valid number.');
    }

    $price = (float)$priceValue;
    if ($price < 0) {
        throw new InvalidArgumentException('Product price must be zero or greater.');
    }

    $categoryId = trim((string)($payload['categoryId'] ?? ''));
    $image = trim((string)($payload['image'] ?? ''));
    $description = isset($payload['description']) ? trim((string)$payload['description']) : '';

    if ($categoryId !== '') {
        $categoryStatement = $pdo->prepare('SELECT COUNT(*) FROM product_categories WHERE id = :id');
        $categoryStatement->execute(['id' => $categoryId]);
        if ((int)$categoryStatement->fetchColumn() === 0) {
            $categoryId = null;
        }
    } else {
        $categoryId = null;
    }

    $statement = $pdo->prepare('UPDATE products SET name = :name, price = :price, category_id = :category, image = :image, description = :description WHERE id = :id');
    $statement->execute([
        'id' => $id,
        'name' => $name,
        'price' => $price,
        'category' => $categoryId,
        'image' => $image !== '' ? $image : null,
        'description' => $description !== '' ? $description : null,
    ]);

    if ($statement->rowCount() === 0) {
        $existsStatement = $pdo->prepare('SELECT COUNT(*) FROM products WHERE id = :id');
        $existsStatement->execute(['id' => $id]);
        if ((int)$existsStatement->fetchColumn() === 0) {
            throw new RuntimeException('Product not found.');
        }
    }
}

function deleteProduct(PDO $pdo, array $payload): void
{
    $id = trim((string)($payload['id'] ?? ''));
    if ($id === '') {
        throw new InvalidArgumentException('Product ID is required.');
    }

    $statement = $pdo->prepare('DELETE FROM products WHERE id = :id');
    $statement->execute(['id' => $id]);

    if ($statement->rowCount() === 0) {
        throw new RuntimeException('Product not found.');
    }
}
function createInventoryItem(PDO $pdo, array $payload): void
{
    $item = trim((string)($payload['item'] ?? ''));
    if ($item === '') {
        throw new InvalidArgumentException('Inventory item name is required.');
    }

    $quantityValue = $payload['qty'] ?? ($payload['quantity'] ?? null);
    if (!is_numeric($quantityValue)) {
        throw new InvalidArgumentException('Inventory quantity must be numeric.');
    }

    $quantity = (float)$quantityValue;

    $unit = trim((string)($payload['unit'] ?? ''));
    if ($unit === '') {
        throw new InvalidArgumentException('Inventory unit is required.');
    }

    $statement = $pdo->prepare('INSERT INTO inventory_items (item, quantity, unit) VALUES (:item, :quantity, :unit)');
    $statement->execute([
        'item' => $item,
        'quantity' => $quantity,
        'unit' => $unit,
    ]);
}

function updateInventoryItem(PDO $pdo, array $payload): void
{
    $id = (int)($payload['id'] ?? 0);
    if ($id <= 0) {
        throw new InvalidArgumentException('Inventory item ID is required.');
    }

    $item = trim((string)($payload['item'] ?? ''));
    if ($item === '') {
        throw new InvalidArgumentException('Inventory item name is required.');
    }

    $quantityValue = $payload['qty'] ?? ($payload['quantity'] ?? null);
    if (!is_numeric($quantityValue)) {
        throw new InvalidArgumentException('Inventory quantity must be numeric.');
    }

    $quantity = (float)$quantityValue;

    $unit = trim((string)($payload['unit'] ?? ''));
    if ($unit === '') {
        throw new InvalidArgumentException('Inventory unit is required.');
    }

    $statement = $pdo->prepare('UPDATE inventory_items SET item = :item, quantity = :quantity, unit = :unit WHERE id = :id');
    $statement->execute([
        'id' => $id,
        'item' => $item,
        'quantity' => $quantity,
        'unit' => $unit,
    ]);

    if ($statement->rowCount() === 0) {
        $existsStatement = $pdo->prepare('SELECT COUNT(*) FROM inventory_items WHERE id = :id');
        $existsStatement->execute(['id' => $id]);
        if ((int)$existsStatement->fetchColumn() === 0) {
            throw new RuntimeException('Inventory item not found.');
        }
    }
}

function deleteInventoryItem(PDO $pdo, array $payload): void
{
    $id = (int)($payload['id'] ?? 0);
    if ($id <= 0) {
        throw new InvalidArgumentException('Inventory item ID is required.');
    }

    $statement = $pdo->prepare('DELETE FROM inventory_items WHERE id = :id');
    $statement->execute(['id' => $id]);

    if ($statement->rowCount() === 0) {
        throw new RuntimeException('Inventory item not found.');
    }
}
function normalizeStaffStatus(string $status): string
{
    $normalized = strtolower(trim($status));
    return $normalized === 'active' ? 'Active' : 'Inactive';
}

function createStaffAccount(PDO $pdo, array $payload): void
{
    $role = trim((string)($payload['role'] ?? ''));
    $name = trim((string)($payload['name'] ?? ''));

    if ($role === '' || $name === '') {
        throw new InvalidArgumentException('Staff role and name are required.');
    }

    $status = normalizeStaffStatus((string)($payload['status'] ?? 'Inactive'));

    $statement = $pdo->prepare('INSERT INTO staff_accounts (role, name, status, time_in, time_out) VALUES (:role, :name, :status, NULL, NULL)');
    $statement->execute([
        'role' => $role,
        'name' => $name,
        'status' => $status,
    ]);
}

function updateStaffAccount(PDO $pdo, array $payload): void
{
    $id = (int)($payload['id'] ?? 0);
    if ($id <= 0) {
        throw new InvalidArgumentException('Staff account ID is required.');
    }

    $role = trim((string)($payload['role'] ?? ''));
    $name = trim((string)($payload['name'] ?? ''));
    if ($role === '' || $name === '') {
        throw new InvalidArgumentException('Staff role and name are required.');
    }

    $status = normalizeStaffStatus((string)($payload['status'] ?? 'Inactive'));

    $statement = $pdo->prepare('UPDATE staff_accounts SET role = :role, name = :name, status = :status WHERE id = :id');
    $statement->execute([
        'id' => $id,
        'role' => $role,
        'name' => $name,
        'status' => $status,
    ]);

    if ($statement->rowCount() === 0) {
        $existsStatement = $pdo->prepare('SELECT COUNT(*) FROM staff_accounts WHERE id = :id');
        $existsStatement->execute(['id' => $id]);
        if ((int)$existsStatement->fetchColumn() === 0) {
            throw new RuntimeException('Staff account not found.');
        }
    }
}

function deleteStaffAccount(PDO $pdo, array $payload): void
{
    $id = (int)($payload['id'] ?? 0);
    if ($id <= 0) {
        throw new InvalidArgumentException('Staff account ID is required.');
    }

    $statement = $pdo->prepare('DELETE FROM staff_accounts WHERE id = :id');
    $statement->execute(['id' => $id]);

    if ($statement->rowCount() === 0) {
        throw new RuntimeException('Staff account not found.');
    }
}

function clockInStaffAccount(PDO $pdo, array $payload): void
{
    $id = (int)($payload['id'] ?? 0);
    if ($id <= 0) {
        throw new InvalidArgumentException('Staff account ID is required.');
    }

    $pdo->beginTransaction();

    try {
        $staffStatement = $pdo->prepare('SELECT name, role FROM staff_accounts WHERE id = :id FOR UPDATE');
        $staffStatement->execute(['id' => $id]);
        $staff = $staffStatement->fetch();
        if (!$staff) {
            throw new RuntimeException('Staff account not found.');
        }

        $now = (new DateTimeImmutable())->format('Y-m-d H:i:s');

        $update = $pdo->prepare('UPDATE staff_accounts SET status = "Active", time_in = :timeIn, time_out = NULL WHERE id = :id');
        $update->execute([
            'id' => $id,
            'timeIn' => $now,
        ]);

        $insert = $pdo->prepare('INSERT INTO timekeeping_records (staff_name, role, time_in, time_out) VALUES (:name, :role, :timeIn, NULL)');
        $insert->execute([
            'name' => (string)$staff['name'],
            'role' => (string)$staff['role'],
            'timeIn' => $now,
        ]);

        $pdo->commit();
    } catch (Throwable $exception) {
        $pdo->rollBack();
        throw $exception;
    }
}

function clockOutStaffAccount(PDO $pdo, array $payload): void
{
    $id = (int)($payload['id'] ?? 0);
    if ($id <= 0) {
        throw new InvalidArgumentException('Staff account ID is required.');
    }

    $pdo->beginTransaction();

    try {
        $staffStatement = $pdo->prepare('SELECT name, role FROM staff_accounts WHERE id = :id FOR UPDATE');
        $staffStatement->execute(['id' => $id]);
        $staff = $staffStatement->fetch();
        if (!$staff) {
            throw new RuntimeException('Staff account not found.');
        }

        $now = (new DateTimeImmutable())->format('Y-m-d H:i:s');

        $update = $pdo->prepare('UPDATE staff_accounts SET status = "Inactive", time_out = :timeOut WHERE id = :id');
        $update->execute([
            'id' => $id,
            'timeOut' => $now,
        ]);

        $recordUpdate = $pdo->prepare('UPDATE timekeeping_records SET time_out = :timeOut WHERE staff_name = :name AND role = :role AND time_out IS NULL ORDER BY time_in DESC LIMIT 1');
        $recordUpdate->execute([
            'timeOut' => $now,
            'name' => (string)$staff['name'],
            'role' => (string)$staff['role'],
        ]);

        $pdo->commit();
    } catch (Throwable $exception) {
        $pdo->rollBack();
        throw $exception;
    }
}

function getNextTransactionReference(PDO $pdo): string
{
    $stmt = $pdo->query("
        SELECT LPAD(CAST(COALESCE(MAX(CAST(reference AS UNSIGNED)), 100) + 1 AS CHAR), 3, '0') AS next_reference
        FROM sales_transactions
    ");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row['next_reference'] ?? '101';
}

function createSalesTransaction(PDO $pdo, array $data): void
{
    if (empty($data['reference']) || !isset($data['total']) || empty($data['occurred_at'])) {
        throw new InvalidArgumentException('Missing required sales transaction data.');
    }

    $sql = "INSERT INTO sales_transactions (reference, total, occurred_at, created_at) 
            VALUES (:reference, :total, :occurred_at, NOW())";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':reference' => $data['reference'],
        ':total' => $data['total'],
        ':occurred_at' => $data['occurred_at']
    ]);
}
