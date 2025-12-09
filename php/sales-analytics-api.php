<?php
/**
 * Sales Analytics API
 * Provides real-time sales data for the Sales Analysis Dashboard
 */

// Set timezone to Manila
date_default_timezone_set('Asia/Manila');

header('Content-Type: application/json');
error_reporting(0);
ini_set('display_errors', '0');

require_once __DIR__ . '/database.php';

try {
    $pdo = getDatabaseConnection();

    if (!$pdo) {
        echo json_encode(['success' => false, 'message' => 'Database connection not available']);
        exit;
    }

    $action = $_GET['action'] ?? '';

    // Support new date-based parameters
    $startDate = $_GET['start_date'] ?? date('Y-m-01');
    $endDate = $_GET['end_date'] ?? date('Y-m-t');
    $dateRange = $_GET['date_range'] ?? 'month';

    // Legacy support for old parameters
    $period = $_GET['period'] ?? $dateRange;
    $year = $_GET['year'] ?? date('Y');
    $month = $_GET['month'] ?? date('n');
    $quarter = $_GET['quarter'] ?? ceil(date('n') / 3);

    switch ($action) {
        case 'get_kpis':
            getKPIs($pdo, $startDate, $endDate, $dateRange);
            break;

        case 'get_sales_trend':
            getSalesTrend($pdo, $startDate, $endDate, $dateRange);
            break;

        case 'get_category_sales':
            getCategorySales($pdo, $startDate, $endDate);
            break;

        case 'get_quarterly_sales':
            getQuarterlySales($pdo, $year);
            break;

        case 'get_weekday_sales':
            getWeekdaySales($pdo, $startDate, $endDate);
            break;

        case 'get_best_sellers':
            getBestSellers($pdo, $startDate, $endDate);
            break;

        case 'get_heatmap':
            getHeatmapData($pdo, $startDate, $endDate);
            break;

        case 'get_product_range_analysis':
            getProductRangeAnalysis($pdo, $startDate, $endDate);
            break;

        case 'get_time_period_comparison':
            getTimePeriodComparison($pdo, $startDate, $endDate, $dateRange);
            break;

        case 'get_inventory_impact':
            getInventoryImpact($pdo, $startDate, $endDate);
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

/**
 * Get date range based on period
 */
function getDateRange($period, $year, $month, $quarter) {
    $startDate = '';
    $endDate = '';

    switch ($period) {
        case 'daily':
            $startDate = date('Y-m-d');
            $endDate = date('Y-m-d');
            break;

        case 'weekly':
            $startDate = date('Y-m-d', strtotime('monday this week'));
            $endDate = date('Y-m-d', strtotime('sunday this week'));
            break;

        case 'monthly':
            $startDate = "$year-" . str_pad($month, 2, '0', STR_PAD_LEFT) . "-01";
            $endDate = date('Y-m-t', strtotime($startDate));
            break;

        case 'quarterly':
            $startMonth = ($quarter - 1) * 3 + 1;
            $endMonth = $startMonth + 2;
            $startDate = "$year-" . str_pad($startMonth, 2, '0', STR_PAD_LEFT) . "-01";
            $endDate = date('Y-m-t', strtotime("$year-" . str_pad($endMonth, 2, '0', STR_PAD_LEFT) . "-01"));
            break;

        case 'yearly':
            $startDate = "$year-01-01";
            $endDate = "$year-12-31";
            break;

        default:
            $startDate = date('Y-m-01');
            $endDate = date('Y-m-t');
    }

    return ['start' => $startDate, 'end' => $endDate];
}

/**
 * Get previous period date range for comparison
 */
function getPreviousDateRange($period, $year, $month, $quarter) {
    switch ($period) {
        case 'daily':
            $prevDate = date('Y-m-d', strtotime('-1 day'));
            return ['start' => $prevDate, 'end' => $prevDate];

        case 'weekly':
            $start = date('Y-m-d', strtotime('monday last week'));
            $end = date('Y-m-d', strtotime('sunday last week'));
            return ['start' => $start, 'end' => $end];

        case 'monthly':
            $prevMonth = $month - 1;
            $prevYear = $year;
            if ($prevMonth < 1) {
                $prevMonth = 12;
                $prevYear--;
            }
            $start = "$prevYear-" . str_pad($prevMonth, 2, '0', STR_PAD_LEFT) . "-01";
            $end = date('Y-m-t', strtotime($start));
            return ['start' => $start, 'end' => $end];

        case 'quarterly':
            $prevQuarter = $quarter - 1;
            $prevYear = $year;
            if ($prevQuarter < 1) {
                $prevQuarter = 4;
                $prevYear--;
            }
            $startMonth = ($prevQuarter - 1) * 3 + 1;
            $endMonth = $startMonth + 2;
            $start = "$prevYear-" . str_pad($startMonth, 2, '0', STR_PAD_LEFT) . "-01";
            $end = date('Y-m-t', strtotime("$prevYear-" . str_pad($endMonth, 2, '0', STR_PAD_LEFT) . "-01"));
            return ['start' => $start, 'end' => $end];

        case 'yearly':
            $prevYear = $year - 1;
            return ['start' => "$prevYear-01-01", 'end' => "$prevYear-12-31"];

        default:
            $start = date('Y-m-01', strtotime('-1 month'));
            $end = date('Y-m-t', strtotime('-1 month'));
            return ['start' => $start, 'end' => $end];
    }
}

/**
 * Get KPIs (Key Performance Indicators)
 */
function getKPIs($pdo, $startDate, $endDate, $dateRange) {
    // Calculate previous period
    $start = new DateTime($startDate);
    $end = new DateTime($endDate);
    $diff = $start->diff($end)->days + 1;

    $prevEnd = clone $start;
    $prevEnd->modify('-1 day');
    $prevStart = clone $prevEnd;
    $prevStart->modify('-' . ($diff - 1) . ' days');

    // Current period KPIs
    $stmt = $pdo->prepare("
        SELECT
            COUNT(*) as total_orders,
            COALESCE(SUM(total), 0) as total_sales,
            COALESCE(SUM(sti.quantity), 0) as quantity_sold,
            COALESCE(AVG(total), 0) as avg_order_value
        FROM sales_transactions st
        LEFT JOIN sales_transaction_items sti ON st.id = sti.transaction_id
        WHERE DATE(st.occurred_at) BETWEEN ? AND ?
    ");
    $stmt->execute([$startDate, $endDate]);
    $current = $stmt->fetch(PDO::FETCH_ASSOC);

    // Previous period KPIs for comparison
    $stmt->execute([$prevStart->format('Y-m-d'), $prevEnd->format('Y-m-d')]);
    $previous = $stmt->fetch(PDO::FETCH_ASSOC);

    // Calculate percentage changes
    $salesChange = $previous['total_sales'] > 0
        ? (($current['total_sales'] - $previous['total_sales']) / $previous['total_sales']) * 100
        : 0;

    $ordersChange = $previous['total_orders'] > 0
        ? (($current['total_orders'] - $previous['total_orders']) / $previous['total_orders']) * 100
        : 0;

    $quantityChange = $previous['quantity_sold'] > 0
        ? (($current['quantity_sold'] - $previous['quantity_sold']) / $previous['quantity_sold']) * 100
        : 0;

    echo json_encode([
        'success' => true,
        'kpis' => [
            'total_sales' => floatval($current['total_sales']),
            'sales_change' => round($salesChange, 1),
            'total_orders' => intval($current['total_orders']),
            'orders_change' => round($ordersChange, 1),
            'quantity_sold' => intval($current['quantity_sold']),
            'quantity_change' => round($quantityChange, 1),
            'avg_order_value' => floatval($current['avg_order_value'])
        ]
    ]);
}

/**
 * Get Sales Trend Over Time
 */
function getSalesTrend($pdo, $startDate, $endDate, $dateRange) {
    $groupBy = '';
    switch ($dateRange) {
        case 'day':
            $groupBy = "DATE_FORMAT(occurred_at, '%Y-%m-%d %H:00:00')";
            break;
        case 'week':
        case 'month':
            $groupBy = "DATE(occurred_at)";
            break;
        case 'quarter':
        case 'year':
            $groupBy = "DATE_FORMAT(occurred_at, '%Y-%m')";
            break;
    }

    $stmt = $pdo->prepare("
        SELECT
            $groupBy as period,
            COALESCE(SUM(total), 0) as sales,
            COUNT(*) as orders
        FROM sales_transactions
        WHERE DATE(occurred_at) BETWEEN ? AND ?
        GROUP BY period
        ORDER BY period ASC
    ");
    $stmt->execute([$startDate, $endDate]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $data
    ]);
}

/**
 * Get Sales by Category
 */
function getCategorySales($pdo, $startDate, $endDate) {
    $stmt = $pdo->prepare("
        SELECT
            COALESCE(pc.name, 'Uncategorized') as category,
            COALESCE(SUM(sti.line_total), 0) as sales,
            SUM(sti.quantity) as quantity
        FROM sales_transaction_items sti
        JOIN sales_transactions st ON sti.transaction_id = st.id
        LEFT JOIN products p ON sti.product_id = p.id
        LEFT JOIN product_categories pc ON p.category_id = pc.id
        WHERE DATE(st.occurred_at) BETWEEN ? AND ?
        GROUP BY pc.name
        ORDER BY sales DESC
    ");
    $stmt->execute([$startDate, $endDate]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $data
    ]);
}

/**
 * Get Quarterly Sales
 */
function getQuarterlySales($pdo, $year) {
    $stmt = $pdo->prepare("
        SELECT
            QUARTER(occurred_at) as quarter,
            COALESCE(SUM(total), 0) as sales,
            COUNT(*) as orders
        FROM sales_transactions
        WHERE YEAR(occurred_at) = ?
        GROUP BY quarter
        ORDER BY quarter ASC
    ");
    $stmt->execute([$year]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $data
    ]);
}

/**
 * Get Weekday vs Weekend Sales
 */
function getWeekdaySales($pdo, $startDate, $endDate) {
    $stmt = $pdo->prepare("
        SELECT
            CASE
                WHEN DAYOFWEEK(occurred_at) IN (1, 7) THEN 'Weekend'
                ELSE 'Weekday'
            END as period_type,
            COALESCE(SUM(total), 0) as sales,
            COUNT(*) as orders
        FROM sales_transactions
        WHERE DATE(occurred_at) BETWEEN ? AND ?
        GROUP BY period_type
    ");
    $stmt->execute([$startDate, $endDate]);
    $rawData = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format for frontend
    $weekdayData = ['sales' => 0, 'orders' => 0, 'avgOrder' => 0];
    $weekendData = ['sales' => 0, 'orders' => 0, 'avgOrder' => 0];

    foreach ($rawData as $row) {
        if ($row['period_type'] === 'Weekday') {
            $weekdayData['sales'] = floatval($row['sales']);
            $weekdayData['orders'] = intval($row['orders']);
            $weekdayData['avgOrder'] = $weekdayData['orders'] > 0 ? $weekdayData['sales'] / $weekdayData['orders'] : 0;
        } else {
            $weekendData['sales'] = floatval($row['sales']);
            $weekendData['orders'] = intval($row['orders']);
            $weekendData['avgOrder'] = $weekendData['orders'] > 0 ? $weekendData['sales'] / $weekendData['orders'] : 0;
        }
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'weekday' => $weekdayData,
            'weekend' => $weekendData
        ]
    ]);
}

/**
 * Get Best Sellers
 */
function getBestSellers($pdo, $startDate, $endDate) {
    $stmt = $pdo->prepare("
        SELECT
            sti.product_id,
            sti.product_name,
            COALESCE(pc.name, 'Uncategorized') as category,
            SUM(sti.quantity) as quantity_sold,
            COALESCE(SUM(sti.line_total), 0) as revenue
        FROM sales_transaction_items sti
        JOIN sales_transactions st ON sti.transaction_id = st.id
        LEFT JOIN products p ON sti.product_id = p.id
        LEFT JOIN product_categories pc ON p.category_id = pc.id
        WHERE DATE(st.occurred_at) BETWEEN ? AND ?
        GROUP BY sti.product_id, sti.product_name, pc.name
        ORDER BY revenue DESC
        LIMIT 10
    ");
    $stmt->execute([$startDate, $endDate]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $data
    ]);
}

/**
 * Get Heatmap Data (Sales by Hour and Day)
 */
function getHeatmapData($pdo, $startDate, $endDate) {
    $stmt = $pdo->prepare("
        SELECT
            DAYOFWEEK(occurred_at) as day_of_week,
            HOUR(occurred_at) as hour,
            COALESCE(SUM(total), 0) as sales,
            COUNT(*) as orders
        FROM sales_transactions
        WHERE DATE(occurred_at) BETWEEN ? AND ?
        GROUP BY day_of_week, hour
        ORDER BY day_of_week, hour
    ");
    $stmt->execute([$startDate, $endDate]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $data
    ]);
}

/**
 * Get Product Range Analysis (Price ranges and performance)
 */
function getProductRangeAnalysis($pdo, $startDate, $endDate) {
    // Get products grouped by price range
    $stmt = $pdo->prepare("
        SELECT
            CASE
                WHEN p.price < 50 THEN 'Budget (₱0-₱49)'
                WHEN p.price >= 50 AND p.price < 100 THEN 'Economy (₱50-₱99)'
                WHEN p.price >= 100 AND p.price < 150 THEN 'Standard (₱100-₱149)'
                WHEN p.price >= 150 AND p.price < 200 THEN 'Premium (₱150-₱199)'
                ELSE 'Luxury (₱200+)'
            END as price_range,
            COUNT(DISTINCT sti.product_id) as product_count,
            SUM(sti.quantity) as total_quantity,
            COALESCE(SUM(sti.line_total), 0) as total_revenue,
            ROUND(AVG(p.price), 2) as avg_price
        FROM sales_transaction_items sti
        JOIN sales_transactions st ON sti.transaction_id = st.id
        LEFT JOIN products p ON sti.product_id = p.id
        WHERE DATE(st.occurred_at) BETWEEN ? AND ?
        GROUP BY price_range
        ORDER BY
            CASE price_range
                WHEN 'Budget (₱0-₱49)' THEN 1
                WHEN 'Economy (₱50-₱99)' THEN 2
                WHEN 'Standard (₱100-₱149)' THEN 3
                WHEN 'Premium (₱150-₱199)' THEN 4
                WHEN 'Luxury (₱200+)' THEN 5
            END
    ");
    $stmt->execute([$startDate, $endDate]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $data
    ]);
}

/**
 * Get Time Period Comparison (Daily, Weekly, Monthly breakdown)
 */
function getTimePeriodComparison($pdo, $startDate, $endDate, $dateRange) {
    $groupBy = '';
    $labelFormat = '';

    switch ($dateRange) {
        case 'day':
            // Hourly breakdown for single day
            $groupBy = "HOUR(occurred_at)";
            $labelFormat = "CONCAT(HOUR(occurred_at), ':00')";
            break;
        case 'week':
            // Daily breakdown for week
            $groupBy = "DATE(occurred_at)";
            $labelFormat = "DATE_FORMAT(occurred_at, '%a, %b %d')";
            break;
        case 'month':
            // Daily breakdown for month
            $groupBy = "DATE(occurred_at)";
            $labelFormat = "DATE_FORMAT(occurred_at, '%b %d')";
            break;
        case 'quarter':
            // Weekly breakdown for quarter
            $groupBy = "YEARWEEK(occurred_at, 1)";
            $labelFormat = "CONCAT('Week ', WEEK(occurred_at, 1))";
            break;
        case 'year':
            // Monthly breakdown for year
            $groupBy = "DATE_FORMAT(occurred_at, '%Y-%m')";
            $labelFormat = "DATE_FORMAT(occurred_at, '%b %Y')";
            break;
        default:
            $groupBy = "DATE(occurred_at)";
            $labelFormat = "DATE_FORMAT(occurred_at, '%b %d')";
    }

    $stmt = $pdo->prepare("
        SELECT
            $groupBy as period,
            $labelFormat as label,
            DATE(occurred_at) as date,
            COALESCE(SUM(total), 0) as sales,
            COUNT(*) as transactions,
            COUNT(DISTINCT st.id) as orders,
            COALESCE(AVG(total), 0) as avg_order_value,
            COALESCE(SUM(sti.quantity), 0) as items_sold
        FROM sales_transactions st
        LEFT JOIN sales_transaction_items sti ON st.id = sti.transaction_id
        WHERE DATE(st.occurred_at) BETWEEN ? AND ?
        GROUP BY period, label, date
        ORDER BY period ASC
    ");
    $stmt->execute([$startDate, $endDate]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'period_type' => $dateRange,
        'data' => $data
    ]);
}

/**
 * Get Inventory Impact from Sales
 * Shows how sales are affecting inventory levels
 */
function getInventoryImpact($pdo, $startDate, $endDate) {
    // Get products with their current inventory status and sales impact
    $stmt = $pdo->prepare("
        SELECT
            ii.id,
            ii.item as inventory_item,
            ii.quantity as current_quantity,
            ii.unit,
            ii.min_stock,
            ii.reorder_level,
            ii.max_stock,
            COALESCE(ii.cost_per_unit, 0) as cost_per_unit,
            COALESCE(ii.quantity * ii.cost_per_unit, 0) as current_value,

            -- Calculate total deducted from sales in period
            COALESCE(SUM(ABS(sm.quantity)), 0) as total_deducted,

            -- Calculate stock status
            CASE
                WHEN ii.quantity <= 0 THEN 'out_of_stock'
                WHEN ii.quantity <= ii.min_stock THEN 'below_reorder'
                WHEN ii.quantity <= ii.reorder_level THEN 'low_stock'
                ELSE 'in_stock'
            END as stock_status,

            -- Calculate percentage remaining
            CASE
                WHEN ii.max_stock > 0 THEN ROUND((ii.quantity / ii.max_stock) * 100, 1)
                ELSE 100
            END as stock_percentage,

            -- Count affected products
            COUNT(DISTINCT sm.reference_id) as sales_count

        FROM inventory_items ii
        LEFT JOIN stock_movements sm ON ii.id = sm.inventory_item_id
            AND sm.movement_type = 'sale'
            AND DATE(sm.created_at) BETWEEN ? AND ?
        GROUP BY ii.id, ii.item, ii.quantity, ii.unit, ii.min_stock,
                 ii.reorder_level, ii.max_stock, ii.cost_per_unit
        HAVING total_deducted > 0 OR current_quantity < reorder_level
        ORDER BY total_deducted DESC, current_quantity ASC
        LIMIT 20
    ");
    $stmt->execute([$startDate, $endDate]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get summary statistics
    $summaryStmt = $pdo->prepare("
        SELECT
            COUNT(DISTINCT ii.id) as total_items_affected,
            SUM(CASE WHEN ii.quantity <= 0 THEN 1 ELSE 0 END) as out_of_stock_count,
            SUM(CASE WHEN ii.quantity > 0 AND ii.quantity <= ii.min_stock THEN 1 ELSE 0 END) as below_reorder_count,
            SUM(CASE WHEN ii.quantity > ii.min_stock AND ii.quantity <= ii.reorder_level THEN 1 ELSE 0 END) as low_stock_count,
            SUM(CASE WHEN ii.quantity > ii.reorder_level THEN 1 ELSE 0 END) as in_stock_count,
            SUM(ii.quantity * ii.cost_per_unit) as total_inventory_value
        FROM inventory_items ii
        WHERE EXISTS (
            SELECT 1 FROM stock_movements sm
            WHERE sm.inventory_item_id = ii.id
            AND sm.movement_type = 'sale'
            AND DATE(sm.created_at) BETWEEN ? AND ?
        )
    ");
    $summaryStmt->execute([$startDate, $endDate]);
    $summary = $summaryStmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $data,
        'summary' => $summary
    ]);
}
