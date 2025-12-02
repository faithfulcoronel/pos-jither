<?php
require_once __DIR__ . '/db.php';
header('Content-Type: application/json');

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';

try {
    switch ($action) {
        case 'check_low_stock':
            echo json_encode(checkLowStock());
            break;
        case 'get_reorder_suggestions':
            echo json_encode(getReorderSuggestions());
            break;
        case 'create_auto_po':
            echo json_encode(createAutoPurchaseOrder($input));
            break;
        case 'backup_database':
            echo json_encode(backupDatabase());
            break;
        case 'get_notifications':
            echo json_encode(getNotifications());
            break;
        case 'dismiss_notification':
            echo json_encode(dismissNotification($input));
            break;
        case 'get_expiring_items':
            echo json_encode(getExpiringItems($input));
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

/**
 * Check for low stock items and create alerts
 */
function checkLowStock() {
    global $pdo;

    // Find items below reorder level
    $stmt = $pdo->query("
        SELECT
            id,
            item,
            quantity,
            unit,
            min_stock,
            reorder_level,
            supplier_id
        FROM inventory_items
        WHERE quantity <= reorder_level
        AND quantity > 0
        ORDER BY (quantity / reorder_level) ASC
    ");

    $lowStockItems = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Find out of stock items
    $stmt = $pdo->query("
        SELECT
            id,
            item,
            quantity,
            unit,
            min_stock,
            reorder_level,
            supplier_id
        FROM inventory_items
        WHERE quantity <= 0
    ");

    $outOfStockItems = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Create alerts for items that don't already have unresolved alerts
    foreach (array_merge($lowStockItems, $outOfStockItems) as $item) {
        $alertType = $item['quantity'] <= 0 ? 'out_of_stock' : 'low_stock';
        $message = $item['quantity'] <= 0
            ? "Item '{$item['item']}' is OUT OF STOCK"
            : "Item '{$item['item']}' is running low ({$item['quantity']} {$item['unit']} remaining, reorder at {$item['reorder_level']})";

        // Check if alert already exists
        $checkStmt = $pdo->prepare("
            SELECT id FROM inventory_alerts
            WHERE inventory_item_id = ?
            AND alert_type = ?
            AND is_resolved = FALSE
            AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        ");
        $checkStmt->execute([$item['id'], $alertType]);

        if (!$checkStmt->fetch()) {
            // Create new alert
            $insertStmt = $pdo->prepare("
                INSERT INTO inventory_alerts
                (inventory_item_id, alert_type, alert_message)
                VALUES (?, ?, ?)
            ");
            $insertStmt->execute([$item['id'], $alertType, $message]);
        }
    }

    return [
        'success' => true,
        'low_stock_count' => count($lowStockItems),
        'out_of_stock_count' => count($outOfStockItems),
        'low_stock_items' => $lowStockItems,
        'out_of_stock_items' => $outOfStockItems
    ];
}

/**
 * Generate intelligent reorder suggestions based on sales velocity
 */
function getReorderSuggestions() {
    global $pdo;

    // Get items that need reordering with sales velocity analysis
    $stmt = $pdo->query("
        SELECT
            ii.id,
            ii.item,
            ii.quantity as current_stock,
            ii.unit,
            ii.min_stock,
            ii.max_stock,
            ii.reorder_level,
            ii.supplier_id,
            s.name as supplier_name,
            COALESCE(sales.avg_daily_usage, 0) as avg_daily_usage,
            COALESCE(sales.last_30_days_usage, 0) as total_usage_30_days
        FROM inventory_items ii
        LEFT JOIN suppliers s ON ii.supplier_id = s.id
        LEFT JOIN (
            SELECT
                p.inventory_item_id,
                SUM(sti.quantity) / 30 as avg_daily_usage,
                SUM(sti.quantity) as last_30_days_usage
            FROM sales_transaction_items sti
            JOIN sales_transactions st ON sti.transaction_id = st.id
            JOIN products p ON sti.product_id = p.id
            WHERE st.occurred_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            AND p.inventory_item_id IS NOT NULL
            GROUP BY p.inventory_item_id
        ) sales ON ii.id = sales.inventory_item_id
        WHERE ii.quantity <= ii.reorder_level
    ");

    $suggestions = [];
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($items as $item) {
        $avgDailyUsage = floatval($item['avg_daily_usage']);
        $currentStock = floatval($item['current_stock']);
        $maxStock = floatval($item['max_stock']);

        // Calculate days until stockout
        $daysUntilStockout = $avgDailyUsage > 0 ? $currentStock / $avgDailyUsage : 999;

        // Calculate suggested order quantity
        // Formula: (Max Stock - Current Stock) + (7 days buffer * avg daily usage)
        $bufferDays = 7;
        $suggestedQty = max(
            ($maxStock - $currentStock),
            ($bufferDays * $avgDailyUsage)
        );

        // Round up to nearest 10
        $suggestedQty = ceil($suggestedQty / 10) * 10;

        // Calculate urgency (1-5, 5 being most urgent)
        if ($currentStock <= 0) {
            $urgency = 5;
            $urgencyLabel = 'CRITICAL';
        } elseif ($daysUntilStockout <= 2) {
            $urgency = 4;
            $urgencyLabel = 'URGENT';
        } elseif ($daysUntilStockout <= 5) {
            $urgency = 3;
            $urgencyLabel = 'HIGH';
        } elseif ($daysUntilStockout <= 10) {
            $urgency = 2;
            $urgencyLabel = 'MEDIUM';
        } else {
            $urgency = 1;
            $urgencyLabel = 'LOW';
        }

        $suggestions[] = [
            'item_id' => $item['id'],
            'item_name' => $item['item'],
            'current_stock' => $currentStock,
            'unit' => $item['unit'],
            'suggested_order_qty' => $suggestedQty,
            'avg_daily_usage' => round($avgDailyUsage, 2),
            'days_until_stockout' => round($daysUntilStockout, 1),
            'urgency' => $urgency,
            'urgency_label' => $urgencyLabel,
            'supplier_id' => $item['supplier_id'],
            'supplier_name' => $item['supplier_name'] ?? 'No supplier assigned',
            'estimated_cost' => 0, // Would need unit cost data
            'reason' => generateReorderReason($item, $daysUntilStockout, $avgDailyUsage)
        ];
    }

    // Sort by urgency (highest first)
    usort($suggestions, function($a, $b) {
        return $b['urgency'] - $a['urgency'];
    });

    return [
        'success' => true,
        'suggestions' => $suggestions,
        'total_items' => count($suggestions)
    ];
}

function generateReorderReason($item, $daysUntilStockout, $avgDailyUsage) {
    if ($item['quantity'] <= 0) {
        return "OUT OF STOCK - Immediate reorder required";
    } elseif ($daysUntilStockout <= 2) {
        return "Stock will run out in " . round($daysUntilStockout, 1) . " days";
    } elseif ($avgDailyUsage > 0) {
        return "Usage rate: " . round($avgDailyUsage, 2) . " {$item['unit']}/day. Reorder to maintain buffer.";
    } else {
        return "Below reorder level of {$item['reorder_level']} {$item['unit']}";
    }
}

/**
 * Automatically create purchase order from reorder suggestions
 */
function createAutoPurchaseOrder($input) {
    global $pdo;

    $items = $input['items'] ?? [];
    $supplierId = $input['supplier_id'] ?? null;

    if (empty($items) || !$supplierId) {
        return ['success' => false, 'message' => 'Missing items or supplier'];
    }

    try {
        $pdo->beginTransaction();

        // Generate PO number
        $poNumber = 'PO-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));

        // Create purchase order
        $stmt = $pdo->prepare("
            INSERT INTO purchase_orders
            (po_number, supplier_id, order_date, expected_delivery, status, total_amount, notes)
            VALUES (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'pending', 0, ?)
        ");

        $notes = 'Auto-generated reorder based on stock levels and sales velocity';
        $stmt->execute([$poNumber, $supplierId, $notes]);
        $poId = $pdo->lastInsertId();

        $totalAmount = 0;

        // Add items to PO
        foreach ($items as $item) {
            $itemId = $item['item_id'];
            $quantity = $item['quantity'];
            $unitCost = $item['unit_cost'] ?? 0;
            $totalCost = $quantity * $unitCost;
            $totalAmount += $totalCost;

            $stmt = $pdo->prepare("
                INSERT INTO purchase_order_items
                (po_id, inventory_item_id, quantity, unit_cost, total_cost)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([$poId, $itemId, $quantity, $unitCost, $totalCost]);
        }

        // Update PO total
        $stmt = $pdo->prepare("UPDATE purchase_orders SET total_amount = ? WHERE id = ?");
        $stmt->execute([$totalAmount, $poId]);

        $pdo->commit();

        return [
            'success' => true,
            'po_number' => $poNumber,
            'po_id' => $poId,
            'total_amount' => $totalAmount,
            'message' => 'Purchase order created successfully'
        ];
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

/**
 * Backup database to SQL file
 */
function backupDatabase() {
    global $pdo;

    try {
        $backupDir = __DIR__ . '/../backups';

        // Create backups directory if it doesn't exist
        if (!is_dir($backupDir)) {
            mkdir($backupDir, 0755, true);
        }

        $filename = 'backup_' . date('Y-m-d_His') . '.sql';
        $filepath = $backupDir . '/' . $filename;

        // Get database name from connection
        $dbName = $pdo->query('SELECT DATABASE()')->fetchColumn();

        // Get all tables
        $tables = [];
        $result = $pdo->query('SHOW TABLES');
        while ($row = $result->fetch(PDO::FETCH_NUM)) {
            $tables[] = $row[0];
        }

        $output = "-- Database Backup\n";
        $output .= "-- Generated: " . date('Y-m-d H:i:s') . "\n";
        $output .= "-- Database: $dbName\n\n";
        $output .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

        // Loop through tables
        foreach ($tables as $table) {
            // Get CREATE TABLE statement
            $createTable = $pdo->query("SHOW CREATE TABLE `$table`")->fetch(PDO::FETCH_ASSOC);
            $output .= "\n-- Table: $table\n";
            $output .= "DROP TABLE IF EXISTS `$table`;\n";
            $output .= $createTable['Create Table'] . ";\n\n";

            // Get table data
            $rows = $pdo->query("SELECT * FROM `$table`")->fetchAll(PDO::FETCH_ASSOC);

            if (!empty($rows)) {
                $output .= "-- Data for table $table\n";

                foreach ($rows as $row) {
                    $values = array_map(function($value) use ($pdo) {
                        return $value === null ? 'NULL' : $pdo->quote($value);
                    }, array_values($row));

                    $output .= "INSERT INTO `$table` VALUES (" . implode(', ', $values) . ");\n";
                }
                $output .= "\n";
            }
        }

        $output .= "SET FOREIGN_KEY_CHECKS=1;\n";

        // Write to file
        file_put_contents($filepath, $output);

        // Delete old backups (keep last 10)
        $files = glob($backupDir . '/backup_*.sql');
        if (count($files) > 10) {
            usort($files, function($a, $b) {
                return filemtime($a) - filemtime($b);
            });
            foreach (array_slice($files, 0, count($files) - 10) as $oldFile) {
                unlink($oldFile);
            }
        }

        return [
            'success' => true,
            'filename' => $filename,
            'filepath' => $filepath,
            'size' => filesize($filepath),
            'message' => 'Database backup created successfully'
        ];
    } catch (Exception $e) {
        return [
            'success' => false,
            'message' => 'Backup failed: ' . $e->getMessage()
        ];
    }
}

/**
 * Get all active notifications
 */
function getNotifications() {
    global $pdo;

    // Get inventory alerts
    $stmt = $pdo->query("
        SELECT
            ia.id,
            ia.alert_type,
            ia.alert_message,
            ia.created_at,
            ii.item as item_name
        FROM inventory_alerts ia
        JOIN inventory_items ii ON ia.inventory_item_id = ii.id
        WHERE ia.is_resolved = FALSE
        ORDER BY
            CASE ia.alert_type
                WHEN 'out_of_stock' THEN 1
                WHEN 'low_stock' THEN 2
                WHEN 'expiring_soon' THEN 3
                ELSE 4
            END,
            ia.created_at DESC
        LIMIT 50
    ");

    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    return [
        'success' => true,
        'notifications' => $notifications,
        'count' => count($notifications)
    ];
}

/**
 * Dismiss a notification
 */
function dismissNotification($input) {
    global $pdo;

    $alertId = $input['alert_id'] ?? null;

    if (!$alertId) {
        return ['success' => false, 'message' => 'Alert ID required'];
    }

    $stmt = $pdo->prepare("
        UPDATE inventory_alerts
        SET is_resolved = TRUE, resolved_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$alertId]);

    return [
        'success' => true,
        'message' => 'Notification dismissed'
    ];
}

/**
 * Get items expiring soon
 */
function getExpiringItems($input) {
    global $pdo;

    $daysAhead = intval($input['days'] ?? 30);

    $stmt = $pdo->prepare("
        SELECT
            ib.id,
            ib.batch_number,
            ii.item as item_name,
            ib.quantity,
            ii.unit,
            ib.expiry_date,
            DATEDIFF(ib.expiry_date, CURDATE()) as days_until_expiry
        FROM inventory_batches ib
        JOIN inventory_items ii ON ib.inventory_item_id = ii.id
        WHERE ib.expiry_date IS NOT NULL
        AND ib.expiry_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
        AND ib.status = 'active'
        AND ib.quantity > 0
        ORDER BY ib.expiry_date ASC
    ");

    $stmt->execute([$daysAhead]);
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Create alerts for items expiring in 7 days or less
    foreach ($items as $item) {
        if ($item['days_until_expiry'] <= 7) {
            $message = "Batch '{$item['batch_number']}' of '{$item['item_name']}' expires in {$item['days_until_expiry']} days";

            // Check if alert exists
            $checkStmt = $pdo->prepare("
                SELECT id FROM inventory_alerts
                WHERE alert_type = 'expiring_soon'
                AND alert_message LIKE ?
                AND is_resolved = FALSE
                AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ");
            $checkStmt->execute(["%{$item['batch_number']}%"]);

            if (!$checkStmt->fetch()) {
                $insertStmt = $pdo->prepare("
                    INSERT INTO inventory_alerts
                    (inventory_item_id, alert_type, alert_message)
                    SELECT inventory_item_id, 'expiring_soon', ?
                    FROM inventory_batches
                    WHERE id = ?
                ");
                $insertStmt->execute([$message, $item['id']]);
            }
        }
    }

    return [
        'success' => true,
        'expiring_items' => $items,
        'count' => count($items)
    ];
}
