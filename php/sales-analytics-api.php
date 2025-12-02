<?php
/**
 * Sales Analytics API
 * Provides real-time sales data for the Sales Analysis Dashboard
 */

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
    $period = $_GET['period'] ?? 'monthly';
    $year = $_GET['year'] ?? date('Y');
    $month = $_GET['month'] ?? date('n');
    $quarter = $_GET['quarter'] ?? ceil(date('n') / 3);

    switch ($action) {
        case 'get_kpis':
            getKPIs($pdo, $period, $year, $month, $quarter);
            break;

        case 'get_sales_trend':
            getSalesTrend($pdo, $period, $year, $month, $quarter);
            break;

        case 'get_category_sales':
            getCategorySales($pdo, $period, $year, $month, $quarter);
            break;

        case 'get_quarterly_sales':
            getQuarterlySales($pdo, $year);
            break;

        case 'get_weekday_sales':
            getWeekdaySales($pdo, $period, $year, $month, $quarter);
            break;

        case 'get_best_sellers':
            getBestSellers($pdo, $period, $year, $month, $quarter);
            break;

        case 'get_heatmap':
            getHeatmapData($pdo, $period, $year, $month, $quarter);
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
function getKPIs($pdo, $period, $year, $month, $quarter) {
    $dateRange = getDateRange($period, $year, $month, $quarter);
    $prevRange = getPreviousDateRange($period, $year, $month, $quarter);

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
    $stmt->execute([$dateRange['start'], $dateRange['end']]);
    $current = $stmt->fetch(PDO::FETCH_ASSOC);

    // Previous period KPIs for comparison
    $stmt->execute([$prevRange['start'], $prevRange['end']]);
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
function getSalesTrend($pdo, $period, $year, $month, $quarter) {
    $dateRange = getDateRange($period, $year, $month, $quarter);

    $groupBy = '';
    switch ($period) {
        case 'daily':
        case 'weekly':
            $groupBy = "DATE_FORMAT(occurred_at, '%Y-%m-%d %H:00:00')";
            break;
        case 'monthly':
            $groupBy = "DATE(occurred_at)";
            break;
        case 'quarterly':
        case 'yearly':
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
    $stmt->execute([$dateRange['start'], $dateRange['end']]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $data
    ]);
}

/**
 * Get Sales by Category
 */
function getCategorySales($pdo, $period, $year, $month, $quarter) {
    $dateRange = getDateRange($period, $year, $month, $quarter);

    $stmt = $pdo->prepare("
        SELECT
            COALESCE(p.category, 'Uncategorized') as category,
            COALESCE(SUM(sti.subtotal), 0) as sales,
            SUM(sti.quantity) as quantity
        FROM sales_transaction_items sti
        JOIN sales_transactions st ON sti.transaction_id = st.id
        LEFT JOIN products p ON sti.product_id = p.id
        WHERE DATE(st.occurred_at) BETWEEN ? AND ?
        GROUP BY category
        ORDER BY sales DESC
    ");
    $stmt->execute([$dateRange['start'], $dateRange['end']]);
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
function getWeekdaySales($pdo, $period, $year, $month, $quarter) {
    $dateRange = getDateRange($period, $year, $month, $quarter);

    $stmt = $pdo->prepare("
        SELECT
            DAYNAME(occurred_at) as day_name,
            DAYOFWEEK(occurred_at) as day_number,
            COALESCE(SUM(total), 0) as sales,
            COUNT(*) as orders
        FROM sales_transactions
        WHERE DATE(occurred_at) BETWEEN ? AND ?
        GROUP BY day_name, day_number
        ORDER BY day_number ASC
    ");
    $stmt->execute([$dateRange['start'], $dateRange['end']]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $data
    ]);
}

/**
 * Get Best Sellers
 */
function getBestSellers($pdo, $period, $year, $month, $quarter) {
    $dateRange = getDateRange($period, $year, $month, $quarter);

    $stmt = $pdo->prepare("
        SELECT
            sti.product_id,
            sti.product_name,
            COALESCE(p.category, 'Uncategorized') as category,
            SUM(sti.quantity) as quantity_sold,
            COALESCE(SUM(sti.subtotal), 0) as revenue
        FROM sales_transaction_items sti
        JOIN sales_transactions st ON sti.transaction_id = st.id
        LEFT JOIN products p ON sti.product_id = p.id
        WHERE DATE(st.occurred_at) BETWEEN ? AND ?
        GROUP BY sti.product_id, sti.product_name, category
        ORDER BY revenue DESC
        LIMIT 10
    ");
    $stmt->execute([$dateRange['start'], $dateRange['end']]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $data
    ]);
}

/**
 * Get Heatmap Data (Sales by Hour and Day)
 */
function getHeatmapData($pdo, $period, $year, $month, $quarter) {
    $dateRange = getDateRange($period, $year, $month, $quarter);

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
    $stmt->execute([$dateRange['start'], $dateRange['end']]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $data
    ]);
}
