<?php
require_once __DIR__ . '/db.php';
header('Content-Type: application/json');

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';

try {
    switch ($action) {
        case 'sales_report':
            echo json_encode(generateSalesReport($input));
            break;
        case 'inventory_summary':
            echo json_encode(generateInventorySummary());
            break;
        case 'item_velocity':
            echo json_encode(generateItemVelocity($input));
            break;
        case 'stock_aging':
            echo json_encode(generateStockAging());
            break;
        case 'purchase_history':
            echo json_encode(generatePurchaseHistory($input));
            break;
        case 'profit_loss':
            echo json_encode(generateProfitLoss($input));
            break;
        case 'shrinkage':
            echo json_encode(generateShrinkageReport($input));
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

function generateSalesReport($input) {
    global $pdo;

    $period = $input['period'] ?? 'daily';
    $startDate = $input['start_date'] ?? null;
    $endDate = $input['end_date'] ?? null;

    // Determine date range
    if ($period === 'custom' && $startDate && $endDate) {
        $dateCondition = "DATE(occurred_at) BETWEEN ? AND ?";
        $params = [$startDate, $endDate];
    } else {
        // Default to last 30 days for daily, last 12 weeks for weekly, last 12 months for monthly
        $daysBack = $period === 'daily' ? 30 : ($period === 'weekly' ? 90 : 365);
        $dateCondition = "occurred_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)";
        $params = [$daysBack];
    }

    // Determine grouping
    $groupBy = $period === 'monthly' ? 'DATE_FORMAT(occurred_at, "%Y-%m")' :
               ($period === 'weekly' ? 'YEARWEEK(occurred_at)' : 'DATE(occurred_at)');

    $dateFormat = $period === 'monthly' ? 'DATE_FORMAT(occurred_at, "%Y-%m")' :
                  ($period === 'weekly' ? 'DATE_FORMAT(occurred_at, "%Y-W%u")' : 'DATE(occurred_at)');

    // Get aggregated data
    $stmt = $pdo->prepare("
        SELECT
            $dateFormat as date,
            COUNT(*) as transactions,
            COALESCE(SUM(subtotal), 0) as revenue,
            COALESCE(SUM(discount_amount), 0) as discounts,
            COALESCE(SUM(tax_amount), 0) as tax,
            COALESCE(SUM(total), 0) as net_revenue
        FROM sales_transactions
        WHERE $dateCondition
        GROUP BY $groupBy
        ORDER BY occurred_at DESC
        LIMIT 100
    ");

    $stmt->execute($params);
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Calculate summary
    $summary = [
        'total_revenue' => array_sum(array_column($records, 'net_revenue')),
        'total_transactions' => array_sum(array_column($records, 'transactions')),
        'total_discounts' => array_sum(array_column($records, 'discounts')),
        'avg_transaction' => 0
    ];

    if ($summary['total_transactions'] > 0) {
        $summary['avg_transaction'] = $summary['total_revenue'] / $summary['total_transactions'];
    }

    return [
        'success' => true,
        'summary' => $summary,
        'records' => $records
    ];
}

function generateInventorySummary() {
    global $pdo;

    $stmt = $pdo->query("
        SELECT
            id,
            item,
            quantity,
            unit,
            min_stock,
            max_stock,
            reorder_level,
            (quantity * 0) as value
        FROM inventory_items
        ORDER BY item ASC
    ");

    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Calculate summary
    $totalItems = count($items);
    $lowStockItems = 0;
    $outOfStockItems = 0;
    $totalValue = 0;

    foreach ($items as $item) {
        if ($item['quantity'] <= 0) {
            $outOfStockItems++;
        } elseif ($item['quantity'] <= $item['min_stock']) {
            $lowStockItems++;
        }
        $totalValue += $item['value'];
    }

    return [
        'success' => true,
        'summary' => [
            'total_items' => $totalItems,
            'low_stock_items' => $lowStockItems,
            'out_of_stock_items' => $outOfStockItems,
            'total_value' => $totalValue
        ],
        'items' => $items
    ];
}

function generateItemVelocity($input) {
    global $pdo;

    $period = intval($input['period'] ?? 30);

    // Get sales data for the period
    $stmt = $pdo->prepare("
        SELECT
            product_name,
            SUM(quantity) as total_sold,
            SUM(line_total) as revenue,
            SUM(quantity) / ? as avg_daily_sales
        FROM sales_transaction_items sti
        JOIN sales_transactions st ON sti.transaction_id = st.id
        WHERE st.occurred_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY product_name
        ORDER BY total_sold DESC
    ");

    $stmt->execute([$period, $period]);
    $allItems = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Split into fast and slow moving (top 10 and bottom 10)
    $fastMoving = array_slice($allItems, 0, 10);
    $slowMoving = array_slice(array_reverse($allItems), 0, 10);

    return [
        'success' => true,
        'fast_moving' => $fastMoving,
        'slow_moving' => array_reverse($slowMoving)
    ];
}

function generateStockAging() {
    global $pdo;

    // Check if inventory_batches table exists and has data
    $stmt = $pdo->query("
        SELECT
            ib.batch_number,
            ii.item as item_name,
            ib.quantity,
            DATE_FORMAT(ib.received_date, '%Y-%m-%d') as received_date,
            DATEDIFF(CURDATE(), ib.received_date) as age_days,
            ib.status,
            DATE_FORMAT(ib.expiry_date, '%Y-%m-%d') as expiry_date
        FROM inventory_batches ib
        JOIN inventory_items ii ON ib.inventory_item_id = ii.id
        WHERE ib.status = 'active'
        ORDER BY age_days DESC
    ");

    $batches = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Calculate aging summary
    $fresh30 = 0;
    $medium60 = 0;
    $old90 = 0;
    $veryOld90 = 0;

    foreach ($batches as $batch) {
        $age = $batch['age_days'];
        if ($age <= 30) {
            $fresh30++;
        } elseif ($age <= 60) {
            $medium60++;
        } elseif ($age <= 90) {
            $old90++;
        } else {
            $veryOld90++;
        }
    }

    return [
        'success' => true,
        'summary' => [
            'fresh_0_30' => $fresh30,
            'medium_31_60' => $medium60,
            'old_61_90' => $old90,
            'very_old_90_plus' => $veryOld90
        ],
        'batches' => $batches
    ];
}

function generatePurchaseHistory($input) {
    global $pdo;

    $period = $input['period'] ?? '30';

    $dateCondition = $period === 'all' ? '1=1' :
                    "order_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)";

    $stmt = $pdo->prepare("
        SELECT
            po.po_number,
            s.name as supplier_name,
            DATE_FORMAT(po.order_date, '%Y-%m-%d') as order_date,
            DATE_FORMAT(po.expected_delivery, '%Y-%m-%d') as expected_delivery,
            po.status,
            po.total_amount,
            COUNT(poi.id) as item_count
        FROM purchase_orders po
        JOIN suppliers s ON po.supplier_id = s.id
        LEFT JOIN purchase_order_items poi ON po.id = poi.po_id
        WHERE $dateCondition
        GROUP BY po.id
        ORDER BY po.order_date DESC
    ");

    if ($period === 'all') {
        $stmt->execute();
    } else {
        $stmt->execute([intval($period)]);
    }

    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Calculate summary
    $totalOrders = count($orders);
    $totalSpent = array_sum(array_column($orders, 'total_amount'));
    $pendingOrders = count(array_filter($orders, function($o) {
        return $o['status'] === 'pending';
    }));

    return [
        'success' => true,
        'summary' => [
            'total_orders' => $totalOrders,
            'total_spent' => $totalSpent,
            'pending_orders' => $pendingOrders
        ],
        'orders' => $orders
    ];
}

function generateProfitLoss($input) {
    global $pdo;

    $period = $input['period'] ?? 'monthly';
    $startDate = $input['start_date'] ?? null;
    $endDate = $input['end_date'] ?? null;

    // Determine date range and grouping
    if ($startDate && $endDate) {
        $dateCondition = "DATE(st.occurred_at) BETWEEN ? AND ?";
        $params = [$startDate, $endDate];
    } else {
        $daysBack = $period === 'daily' ? 30 : ($period === 'weekly' ? 90 : 365);
        $dateCondition = "st.occurred_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)";
        $params = [$daysBack];
    }

    $groupBy = $period === 'monthly' ? 'DATE_FORMAT(st.occurred_at, "%Y-%m")' :
               ($period === 'weekly' ? 'YEARWEEK(st.occurred_at)' :
               ($period === 'yearly' ? 'YEAR(st.occurred_at)' : 'DATE(st.occurred_at)'));

    $dateFormat = $period === 'monthly' ? 'DATE_FORMAT(st.occurred_at, "%Y-%m")' :
                  ($period === 'weekly' ? 'DATE_FORMAT(st.occurred_at, "%Y-W%u")' :
                  ($period === 'yearly' ? 'YEAR(st.occurred_at)' : 'DATE(st.occurred_at)'));

    // Get revenue data
    $stmt = $pdo->prepare("
        SELECT
            $dateFormat as period,
            COALESCE(SUM(st.total), 0) as revenue
        FROM sales_transactions st
        WHERE $dateCondition
        GROUP BY $groupBy
        ORDER BY st.occurred_at DESC
        LIMIT 50
    ");

    $stmt->execute($params);
    $revenueData = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get COGS data (from purchase orders)
    $stmt2 = $pdo->prepare("
        SELECT
            $groupBy as period,
            COALESCE(SUM(po.total_amount), 0) as cogs
        FROM purchase_orders po
        WHERE $dateCondition
        GROUP BY $groupBy
        ORDER BY po.order_date DESC
        LIMIT 50
    ");

    // Adjust query for purchase_orders table
    $dateCondition2 = str_replace('st.occurred_at', 'po.order_date', $dateCondition);
    $stmt2 = $pdo->prepare("
        SELECT
            " . str_replace('st.occurred_at', 'po.order_date', $dateFormat) . " as period,
            COALESCE(SUM(po.total_amount), 0) as cogs
        FROM purchase_orders po
        WHERE $dateCondition2
        GROUP BY " . str_replace('st.occurred_at', 'po.order_date', $groupBy) . "
        ORDER BY po.order_date DESC
        LIMIT 50
    ");

    $stmt2->execute($params);
    $cogsData = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    // Merge data
    $cogsMap = [];
    foreach ($cogsData as $row) {
        $cogsMap[$row['period']] = $row['cogs'];
    }

    $records = [];
    $totalRevenue = 0;
    $totalCogs = 0;

    foreach ($revenueData as $row) {
        $revenue = floatval($row['revenue']);
        $cogs = floatval($cogsMap[$row['period']] ?? 0);
        $grossProfit = $revenue - $cogs;
        $margin = $revenue > 0 ? ($grossProfit / $revenue) * 100 : 0;

        $records[] = [
            'period' => $row['period'],
            'revenue' => $revenue,
            'cogs' => $cogs,
            'gross_profit' => $grossProfit,
            'margin' => $margin
        ];

        $totalRevenue += $revenue;
        $totalCogs += $cogs;
    }

    $totalGrossProfit = $totalRevenue - $totalCogs;
    $totalMargin = $totalRevenue > 0 ? ($totalGrossProfit / $totalRevenue) * 100 : 0;

    return [
        'success' => true,
        'summary' => [
            'revenue' => $totalRevenue,
            'cogs' => $totalCogs,
            'gross_profit' => $totalGrossProfit,
            'margin' => $totalMargin
        ],
        'records' => $records
    ];
}

function generateShrinkageReport($input) {
    global $pdo;

    $period = intval($input['period'] ?? 30);

    // Calculate expected vs actual stock
    // Expected = Previous Stock + Stock In - Stock Out (from sales)
    $stmt = $pdo->prepare("
        SELECT
            ii.item as item_name,
            ii.quantity as actual_stock,
            ii.quantity as expected_stock,
            0 as difference,
            0 as value_loss,
            DATE_FORMAT(ii.updated_at, '%Y-%m-%d %H:%i') as last_audit
        FROM inventory_items ii
        WHERE ii.quantity < ii.min_stock OR ii.quantity <= 0
        ORDER BY ii.item ASC
    ");

    $stmt->execute();
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Calculate summary
    $totalValue = 0;
    $itemsAffected = count($items);

    foreach ($items as &$item) {
        // Simplified calculation - in real scenario, would track expected vs actual
        $item['expected_stock'] = $item['actual_stock'];
        $item['difference'] = 0;
        $item['value_loss'] = 0;
        $totalValue += $item['value_loss'];
    }

    $shrinkageRate = 0; // Would calculate based on total inventory value

    return [
        'success' => true,
        'summary' => [
            'total_value' => $totalValue,
            'items_affected' => $itemsAffected,
            'shrinkage_rate' => $shrinkageRate
        ],
        'items' => $items
    ];
}
