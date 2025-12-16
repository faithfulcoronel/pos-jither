<?php

declare(strict_types=1);

/**
 * Recipe Management Functions
 * Handles product recipes, ingredients, cost calculation, and profitability tracking
 */

// ============================================================================
// RECIPE CRUD OPERATIONS
// ============================================================================

/**
 * Fetch all recipes for a specific product
 * @return array<int, array<string, mixed>>
 */
function fetchProductRecipes(PDO $pdo, string $productId): array
{
    $statement = $pdo->prepare('
        SELECT
            pr.id,
            pr.product_id,
            pr.inventory_item_id,
            pr.quantity,
            pr.unit,
            pr.notes,
            ii.item as ingredient_name,
            ii.cost_per_unit,
            ii.quantity as available_quantity,
            ii.unit as inventory_unit,
            ROUND(pr.quantity * ii.cost_per_unit, 4) as ingredient_cost
        FROM product_recipes pr
        JOIN inventory_items ii ON pr.inventory_item_id = ii.id
        WHERE pr.product_id = ?
        ORDER BY ii.item
    ');
    $statement->execute([$productId]);

    $recipes = [];
    foreach ($statement as $row) {
        $recipes[] = [
            'id' => (int)$row['id'],
            'productId' => (string)$row['product_id'],
            'inventoryItemId' => (int)$row['inventory_item_id'],
            'ingredientName' => (string)$row['ingredient_name'],
            'quantity' => (float)$row['quantity'],
            'unit' => (string)$row['unit'],
            'costPerUnit' => (float)$row['cost_per_unit'],
            'ingredientCost' => (float)$row['ingredient_cost'],
            'availableQuantity' => (float)$row['available_quantity'],
            'inventoryUnit' => (string)$row['inventory_unit'],
            'notes' => $row['notes'] ? (string)$row['notes'] : '',
        ];
    }

    return $recipes;
}

/**
 * Fetch all recipes for all products
 * @return array<string, array<int, array<string, mixed>>>
 */
function fetchAllProductRecipes(PDO $pdo): array
{
    $statement = $pdo->query('
        SELECT
            pr.id,
            pr.product_id,
            pr.inventory_item_id,
            pr.quantity,
            pr.unit,
            pr.notes,
            p.name as product_name,
            ii.item as ingredient_name,
            ii.cost_per_unit,
            ii.quantity as available_quantity,
            ii.unit as inventory_unit,
            ROUND(pr.quantity * ii.cost_per_unit, 4) as ingredient_cost
        FROM product_recipes pr
        JOIN products p ON pr.product_id = p.id
        JOIN inventory_items ii ON pr.inventory_item_id = ii.id
        ORDER BY p.name, ii.item
    ');

    $recipesByProduct = [];
    foreach ($statement as $row) {
        $productId = (string)$row['product_id'];

        if (!isset($recipesByProduct[$productId])) {
            $recipesByProduct[$productId] = [];
        }

        $recipesByProduct[$productId][] = [
            'id' => (int)$row['id'],
            'productId' => $productId,
            'productName' => (string)$row['product_name'],
            'inventoryItemId' => (int)$row['inventory_item_id'],
            'ingredientName' => (string)$row['ingredient_name'],
            'quantity' => (float)$row['quantity'],
            'unit' => (string)$row['unit'],
            'costPerUnit' => (float)$row['cost_per_unit'],
            'ingredientCost' => (float)$row['ingredient_cost'],
            'availableQuantity' => (float)$row['available_quantity'],
            'inventoryUnit' => (string)$row['inventory_unit'],
            'notes' => $row['notes'] ? (string)$row['notes'] : '',
        ];
    }

    return $recipesByProduct;
}

/**
 * Add an ingredient to a product recipe
 */
function addRecipeIngredient(
    PDO $pdo,
    string $productId,
    int $inventoryItemId,
    float $quantity,
    string $unit,
    ?string $notes = null
): bool {
    try {
        // Check if product exists
        $stmt = $pdo->prepare('SELECT id FROM products WHERE id = ?');
        $stmt->execute([$productId]);
        if (!$stmt->fetch()) {
            throw new Exception("Product not found");
        }

        // Check if inventory item exists
        $stmt = $pdo->prepare('SELECT id FROM inventory_items WHERE id = ?');
        $stmt->execute([$inventoryItemId]);
        if (!$stmt->fetch()) {
            throw new Exception("Inventory item not found");
        }

        // Insert recipe ingredient (or update if exists)
        $statement = $pdo->prepare('
            INSERT INTO product_recipes (product_id, inventory_item_id, quantity, unit, notes)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                quantity = VALUES(quantity),
                unit = VALUES(unit),
                notes = VALUES(notes)
        ');

        $statement->execute([
            $productId,
            $inventoryItemId,
            $quantity,
            $unit,
            $notes
        ]);

        // Cost will be auto-updated by trigger
        return true;
    } catch (Exception $e) {
        error_log("Error adding recipe ingredient: " . $e->getMessage());
        throw $e;
    }
}

/**
 * Update a recipe ingredient
 */
function updateRecipeIngredient(
    PDO $pdo,
    int $recipeId,
    float $quantity,
    string $unit,
    ?string $notes = null
): bool {
    try {
        $statement = $pdo->prepare('
            UPDATE product_recipes
            SET quantity = ?, unit = ?, notes = ?
            WHERE id = ?
        ');

        $statement->execute([$quantity, $unit, $notes, $recipeId]);

        // Cost will be auto-updated by trigger
        return true;
    } catch (Exception $e) {
        error_log("Error updating recipe ingredient: " . $e->getMessage());
        return false;
    }
}

/**
 * Delete a recipe ingredient
 */
function deleteRecipeIngredient(PDO $pdo, int $recipeId): bool
{
    try {
        $statement = $pdo->prepare('DELETE FROM product_recipes WHERE id = ?');
        $statement->execute([$recipeId]);

        // Cost will be auto-updated by trigger
        return true;
    } catch (Exception $e) {
        error_log("Error deleting recipe ingredient: " . $e->getMessage());
        return false;
    }
}

/**
 * Delete all recipe ingredients for a product
 */
function deleteProductRecipe(PDO $pdo, string $productId): bool
{
    try {
        $statement = $pdo->prepare('DELETE FROM product_recipes WHERE product_id = ?');
        $statement->execute([$productId]);
        return true;
    } catch (Exception $e) {
        error_log("Error deleting product recipe: " . $e->getMessage());
        return false;
    }
}

// ============================================================================
// COST CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate product cost from recipe ingredients
 */
function calculateProductCost(PDO $pdo, string $productId): float
{
    $statement = $pdo->prepare('
        SELECT COALESCE(SUM(pr.quantity * ii.cost_per_unit), 0) as total_cost
        FROM product_recipes pr
        JOIN inventory_items ii ON pr.inventory_item_id = ii.id
        WHERE pr.product_id = ?
    ');
    $statement->execute([$productId]);
    $row = $statement->fetch();

    return (float)($row['total_cost'] ?? 0);
}

/**
 * Update product cost based on recipe (manual trigger)
 */
function updateProductCostFromRecipe(PDO $pdo, string $productId): bool
{
    try {
        $cost = calculateProductCost($pdo, $productId);

        $statement = $pdo->prepare('
            UPDATE products
            SET cost_price = ?
            WHERE id = ? AND auto_calculate_cost = TRUE
        ');
        $statement->execute([$cost, $productId]);

        return true;
    } catch (Exception $e) {
        error_log("Error updating product cost: " . $e->getMessage());
        return false;
    }
}

/**
 * Get product profitability data
 */
function getProductProfitability(PDO $pdo, string $productId): ?array
{
    $statement = $pdo->prepare('
        SELECT
            id,
            name,
            price as selling_price,
            cost_price,
            (price - cost_price) as gross_profit,
            CASE
                WHEN price > 0 THEN ROUND(((price - cost_price) / price) * 100, 2)
                ELSE 0
            END as profit_margin_percentage
        FROM products
        WHERE id = ?
    ');
    $statement->execute([$productId]);
    $row = $statement->fetch();

    if (!$row) {
        return null;
    }

    return [
        'id' => (string)$row['id'],
        'name' => (string)$row['name'],
        'sellingPrice' => (float)$row['selling_price'],
        'costPrice' => (float)$row['cost_price'],
        'grossProfit' => (float)$row['gross_profit'],
        'profitMarginPercentage' => (float)$row['profit_margin_percentage'],
    ];
}

/**
 * Get profitability data for all products
 * @return array<int, array<string, mixed>>
 */
function getAllProductsProfitability(PDO $pdo): array
{
    $statement = $pdo->query('
        SELECT
            p.id,
            p.name,
            p.price as selling_price,
            p.cost_price,
            (p.price - p.cost_price) as gross_profit,
            CASE
                WHEN p.price > 0 THEN ROUND(((p.price - p.cost_price) / p.price) * 100, 2)
                ELSE 0
            END as profit_margin_percentage,
            pc.name as category
        FROM products p
        LEFT JOIN product_categories pc ON p.category_id = pc.id
        ORDER BY profit_margin_percentage DESC
    ');

    $profitability = [];
    foreach ($statement as $row) {
        $profitability[] = [
            'id' => (string)$row['id'],
            'name' => (string)$row['name'],
            'category' => $row['category'] ? (string)$row['category'] : '',
            'sellingPrice' => (float)$row['selling_price'],
            'costPrice' => (float)$row['cost_price'],
            'grossProfit' => (float)$row['gross_profit'],
            'profitMarginPercentage' => (float)$row['profit_margin_percentage'],
        ];
    }

    return $profitability;
}

// ============================================================================
// INVENTORY DEDUCTION FUNCTIONS
// ============================================================================

/**
 * Deduct ingredients from inventory based on product sales
 */
function deductInventoryForSale(
    PDO $pdo,
    string $productId,
    int $quantity,
    int $transactionId
): array {
    $deductions = [];
    $errors = [];

    try {
        // Note: This function is called within an existing transaction from api.php
        // Do NOT start a new transaction here to avoid nested transaction issues

        // Get all recipe ingredients for the product
        $statement = $pdo->prepare('
            SELECT pr.inventory_item_id, pr.quantity, pr.unit, ii.item, ii.quantity as current_qty
            FROM product_recipes pr
            JOIN inventory_items ii ON pr.inventory_item_id = ii.id
            WHERE pr.product_id = ?
        ');
        $statement->execute([$productId]);
        $ingredients = $statement->fetchAll();

        // Log for debugging
        error_log("Deducting inventory for product: {$productId}, quantity: {$quantity}");
        error_log("Found " . count($ingredients) . " ingredients in recipe");

        foreach ($ingredients as $ingredient) {
            error_log("Processing ingredient: " . $ingredient['item'] . " - Required: " . ($ingredient['quantity'] * $quantity));
            $inventoryItemId = (int)$ingredient['inventory_item_id'];
            $requiredQty = (float)$ingredient['quantity'] * $quantity;
            $currentQty = (float)$ingredient['current_qty'];
            $newQty = $currentQty - $requiredQty;

            // Check if sufficient stock
            if ($newQty < 0) {
                error_log("WARNING: Insufficient stock for {$ingredient['item']} - Required: {$requiredQty}, Available: {$currentQty}");
                $errors[] = [
                    'item' => $ingredient['item'],
                    'required' => $requiredQty,
                    'available' => $currentQty,
                    'shortage' => abs($newQty),
                    'unit' => $ingredient['unit']
                ];
                // Still deduct available quantity (allow negative inventory)
                // This ensures the sale goes through but tracks the shortage
            }

            // Update inventory quantity (even if it goes negative)
            $updateStmt = $pdo->prepare('
                UPDATE inventory_items
                SET quantity = ?
                WHERE id = ?
            ');
            $updateStmt->execute([$newQty, $inventoryItemId]);
            error_log("Updated {$ingredient['item']}: {$currentQty} -> {$newQty}");

            // Log stock movement
            $logStmt = $pdo->prepare('
                INSERT INTO stock_movements (
                    inventory_item_id,
                    movement_type,
                    quantity,
                    previous_quantity,
                    new_quantity,
                    reference_type,
                    reference_id,
                    notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ');
            $logStmt->execute([
                $inventoryItemId,
                'sale',
                $requiredQty,
                $currentQty,
                $newQty,
                'sales_transaction',
                $transactionId,
                "Auto-deducted for product: {$productId} (qty: {$quantity})"
            ]);

            $deductions[] = [
                'inventoryItemId' => $inventoryItemId,
                'item' => $ingredient['item'],
                'deducted' => $requiredQty,
                'unit' => $ingredient['unit'],
                'previousQty' => $currentQty,
                'newQty' => $newQty
            ];
        }

        if (!empty($errors)) {
            // Return errors without rolling back - let the caller handle the transaction
            return [
                'success' => false,
                'errors' => $errors,
                'message' => 'Insufficient inventory for some ingredients'
            ];
        }

        return [
            'success' => true,
            'deductions' => $deductions
        ];
    } catch (Exception $e) {
        error_log("Error deducting inventory: " . $e->getMessage());
        return [
            'success' => false,
            'errors' => [$e->getMessage()]
        ];
    }
}

/**
 * Check if sufficient inventory exists to fulfill an order
 */
function checkInventoryAvailability(PDO $pdo, string $productId, int $quantity): array
{
    $statement = $pdo->prepare('
        SELECT
            ii.id,
            ii.item,
            pr.quantity as required_per_unit,
            pr.unit,
            ii.quantity as available,
            (pr.quantity * ?) as total_required,
            (ii.quantity - (pr.quantity * ?)) as remaining_after_sale
        FROM product_recipes pr
        JOIN inventory_items ii ON pr.inventory_item_id = ii.id
        WHERE pr.product_id = ?
    ');
    $statement->execute([$quantity, $quantity, $productId]);

    $availability = [];
    $allAvailable = true;

    foreach ($statement as $row) {
        $isAvailable = (float)$row['remaining_after_sale'] >= 0;
        if (!$isAvailable) {
            $allAvailable = false;
        }

        $availability[] = [
            'inventoryItemId' => (int)$row['id'],
            'item' => (string)$row['item'],
            'requiredPerUnit' => (float)$row['required_per_unit'],
            'totalRequired' => (float)$row['total_required'],
            'available' => (float)$row['available'],
            'remainingAfterSale' => (float)$row['remaining_after_sale'],
            'isAvailable' => $isAvailable,
            'unit' => (string)$row['unit']
        ];
    }

    return [
        'productId' => $productId,
        'quantity' => $quantity,
        'allIngredientsAvailable' => $allAvailable,
        'ingredients' => $availability
    ];
}

// ============================================================================
// INVENTORY ITEM COST FUNCTIONS
// ============================================================================

/**
 * Update inventory item cost per unit
 */
function updateInventoryItemCost(PDO $pdo, int $inventoryItemId, float $costPerUnit): bool
{
    try {
        $statement = $pdo->prepare('
            UPDATE inventory_items
            SET cost_per_unit = ?
            WHERE id = ?
        ');
        $statement->execute([$costPerUnit, $inventoryItemId]);

        // Update all products that use this ingredient
        $updateProducts = $pdo->prepare('
            SELECT DISTINCT product_id
            FROM product_recipes
            WHERE inventory_item_id = ?
        ');
        $updateProducts->execute([$inventoryItemId]);

        foreach ($updateProducts as $row) {
            updateProductCostFromRecipe($pdo, $row['product_id']);
        }

        return true;
    } catch (Exception $e) {
        error_log("Error updating inventory cost: " . $e->getMessage());
        return false;
    }
}

/**
 * Fetch inventory items with cost information
 * @return array<int, array<string, mixed>>
 */
function fetchInventoryItemsWithCost(PDO $pdo): array
{
    $selectCategory = ensureInventoryCategoryColumn($pdo) ? ', category' : '';
    $statement = $pdo->query("
        SELECT
            id,
            item,
            quantity,
            unit,
            cost_per_unit,
            min_stock,
            reorder_level,
            ROUND(quantity * cost_per_unit, 2) as total_value
            {$selectCategory}
        FROM inventory_items
        ORDER BY item
    ");

    $inventory = [];
    foreach ($statement as $row) {
        $inventory[] = [
            'id' => (int)$row['id'],
            'item' => (string)$row['item'],
            'qty' => (float)$row['quantity'],
            'unit' => (string)$row['unit'],
            'costPerUnit' => (float)$row['cost_per_unit'],
            'minStock' => (float)$row['min_stock'],
            'reorderLevel' => (float)$row['reorder_level'],
            'totalValue' => (float)$row['total_value'],
            'category' => isset($row['category']) ? (string)$row['category'] : '',
        ];
    }

    return $inventory;
}

/**
 * Calculate inventory expenses based on stock deductions within a date range
 *
 * Expenses are computed from outbound movements (sales/adjustments/waste/transfer),
 * multiplying deducted quantity by the item's cost per unit.
 */
function calculateInventoryExpenses(PDO $pdo, ?string $startDate = null, ?string $endDate = null, int $days = 30): float
{
    $where = [];
    $params = [];

    if ($startDate && $endDate) {
        $where[] = 'DATE(sm.created_at) BETWEEN ? AND ?';
        $params[] = $startDate;
        $params[] = $endDate;
    } else {
        $where[] = 'sm.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)';
        $params[] = max(1, $days);
    }

    // Outbound movements only
    $where[] = "sm.movement_type IN ('sale', 'adjustment', 'waste', 'transfer')";

    $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    $sql = "
        SELECT
            SUM(
                (
                    CASE
                        WHEN sm.previous_quantity IS NOT NULL
                             AND sm.new_quantity IS NOT NULL
                             AND sm.new_quantity < sm.previous_quantity
                        THEN sm.previous_quantity - sm.new_quantity
                        WHEN sm.quantity IS NOT NULL AND sm.quantity > 0
                        THEN sm.quantity
                        ELSE 0
                    END
                ) * COALESCE(ii.cost_per_unit, 0)
            ) AS total_expense
        FROM stock_movements sm
        JOIN inventory_items ii ON ii.id = sm.inventory_item_id
        $whereClause
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    return (float)($row['total_expense'] ?? 0);
}

/**
 * Fetch recent stock movements with signed quantity change
 *
 * @return array<int, array<string, mixed>>
 */
function fetchStockMovements(PDO $pdo, int $limit = 200): array
{
    // Keep sensible bounds to avoid returning an excessive payload
    $limit = max(1, min($limit, 500));

    $statement = $pdo->prepare('
        SELECT
            sm.id,
            sm.inventory_item_id,
            ii.item AS inventory_item_name,
            ii.unit AS inventory_unit,
            sm.movement_type,
            sm.quantity,
            sm.previous_quantity,
            sm.new_quantity,
            sm.reference_type,
            sm.reference_id,
            sm.notes,
            sm.created_by,
            sm.created_at
        FROM stock_movements sm
        LEFT JOIN inventory_items ii ON sm.inventory_item_id = ii.id
        ORDER BY sm.created_at DESC, sm.id DESC
        LIMIT :limit
    ');
    $statement->bindValue(':limit', $limit, PDO::PARAM_INT);
    $statement->execute();

    $rows = $statement->fetchAll(PDO::FETCH_ASSOC);
    $movements = [];

    foreach ($rows as $row) {
        $previousQty = isset($row['previous_quantity']) && is_numeric($row['previous_quantity'])
            ? (float)$row['previous_quantity']
            : null;
        $newQty = isset($row['new_quantity']) && is_numeric($row['new_quantity'])
            ? (float)$row['new_quantity']
            : null;
        $loggedQty = isset($row['quantity']) && is_numeric($row['quantity'])
            ? (float)$row['quantity']
            : 0.0;

        // Prefer the actual delta between the before/after quantities so outflows show as negative
        $netChange = ($previousQty !== null && $newQty !== null)
            ? $newQty - $previousQty
            : $loggedQty;

        $movements[] = [
            'id' => isset($row['id']) ? (int)$row['id'] : null,
            'inventoryItemId' => isset($row['inventory_item_id']) ? (int)$row['inventory_item_id'] : null,
            'inventoryItemName' => $row['inventory_item_name'] ?? 'Item',
            'unit' => $row['inventory_unit'] ?? '',
            'movementType' => $row['movement_type'] ?? 'adjustment',
            'quantity' => $netChange,
            'absoluteQuantity' => $loggedQty,
            'previousQuantity' => $previousQty ?? 0.0,
            'currentQuantity' => $newQty ?? ($previousQty !== null ? $previousQty + $loggedQty : $loggedQty),
            'referenceType' => $row['reference_type'] ?? '',
            'referenceId' => isset($row['reference_id']) ? (int)$row['reference_id'] : null,
            'notes' => $row['notes'] ?? '',
            'createdBy' => isset($row['created_by']) ? (int)$row['created_by'] : null,
            'createdAt' => $row['created_at'] ?? null,
            'direction' => $netChange >= 0 ? 'inflow' : 'outflow',
        ];
    }

    return $movements;
}

// ============================================================================
// ENHANCED PRODUCT FETCH WITH COST DATA
// ============================================================================

/**
 * Fetch products with cost and profitability data
 * @return array<int, array<string, mixed>>
 */
function fetchProductsWithProfitability(PDO $pdo): array
{
    $statement = $pdo->query('
        SELECT
            p.id,
            p.name,
            p.price,
            p.category_id,
            p.image,
            p.description,
            p.cost_price,
            p.auto_calculate_cost,
            (p.price - p.cost_price) as gross_profit,
            CASE
                WHEN p.price > 0 THEN ROUND(((p.price - p.cost_price) / p.price) * 100, 2)
                ELSE 0
            END as profit_margin_percentage
        FROM products p
        ORDER BY p.name
    ');

    $products = [];
    foreach ($statement as $row) {
        $products[] = [
            'id' => (string)$row['id'],
            'name' => (string)$row['name'],
            'price' => (float)$row['price'],
            'categoryId' => (string)($row['category_id'] ?? ''),
            'image' => $row['image'] ? (string)$row['image'] : '',
            'description' => $row['description'] ? (string)$row['description'] : '',
            'costPrice' => (float)$row['cost_price'],
            'autoCalculateCost' => (bool)$row['auto_calculate_cost'],
            'grossProfit' => (float)$row['gross_profit'],
            'profitMarginPercentage' => (float)$row['profit_margin_percentage']
        ];
    }

    return $products;
}
