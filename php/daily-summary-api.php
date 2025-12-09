<?php
/**
 * Daily Summary API
 * Handles daily sales snapshots, X-Read, Z-Read reports
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

    $action = $_GET['action'] ?? $_POST['action'] ?? '';

    switch ($action) {
        case 'get_today_summary':
            getTodaySummary($pdo);
            break;

        case 'save_daily_snapshot':
            saveDailySnapshot($pdo);
            break;

        case 'generate_xread':
            generateXRead($pdo);
            break;

        case 'generate_zread':
            generateZRead($pdo);
            break;

        case 'get_reports_history':
            getReportsHistory($pdo);
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

/**
 * Get today's sales summary (real-time)
 */
function getTodaySummary($pdo) {
    $today = date('Y-m-d');

    // Get today's transactions
    $stmt = $pdo->prepare("
        SELECT
            COUNT(*) as transaction_count,
            COALESCE(SUM(total), 0) as total_sales,
            COALESCE(SUM(discount_amount), 0) as total_discount,
            COALESCE(SUM(tax_amount), 0) as total_vat,
            COALESCE(AVG(total), 0) as average_transaction,
            COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END), 0) as cash_sales,
            COALESCE(SUM(CASE WHEN payment_method = 'card' THEN total ELSE 0 END), 0) as card_sales,
            COALESCE(SUM(CASE WHEN payment_method = 'gcash' THEN total ELSE 0 END), 0) as gcash_sales,
            MIN(occurred_at) as opening_time,
            MAX(occurred_at) as closing_time
        FROM sales_transactions
        WHERE DATE(occurred_at) = ?
    ");
    $stmt->execute([$today]);
    $summary = $stmt->fetch(PDO::FETCH_ASSOC);

    // Get item sales
    $stmt = $pdo->prepare("
        SELECT
            sti.product_name,
            COALESCE(pc.name, 'Uncategorized') as category_name,
            SUM(sti.quantity) as quantity_sold,
            SUM(sti.line_total) as total_revenue,
            AVG(sti.unit_price) as average_price
        FROM sales_transaction_items sti
        JOIN sales_transactions st ON sti.transaction_id = st.id
        LEFT JOIN products p ON sti.product_id = p.id
        LEFT JOIN product_categories pc ON p.category_id = pc.id
        WHERE DATE(st.occurred_at) = ?
        GROUP BY sti.product_name, pc.name
        ORDER BY total_revenue DESC
    ");
    $stmt->execute([$today]);
    $itemSales = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Total items sold
    $totalItems = array_sum(array_column($itemSales, 'quantity_sold'));

    echo json_encode([
        'success' => true,
        'date' => $today,
        'summary' => array_merge($summary, ['total_items_sold' => $totalItems]),
        'item_sales' => $itemSales
    ]);
}

/**
 * Save daily snapshot (called automatically at end of day)
 */
function saveDailySnapshot($pdo) {
    $date = $_POST['date'] ?? date('Y-m-d');
    $cashierId = $_POST['cashier_id'] ?? null;

    try {
        $pdo->beginTransaction();

        // Get today's summary
        $stmt = $pdo->prepare("
            SELECT
                COUNT(*) as transaction_count,
                COALESCE(SUM(total), 0) as total_sales,
                COALESCE(SUM(discount_amount), 0) as total_discount,
                COALESCE(SUM(tax_amount), 0) as total_vat,
                COALESCE(AVG(total), 0) as average_transaction,
                COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END), 0) as cash_sales,
                COALESCE(SUM(CASE WHEN payment_method = 'card' THEN total ELSE 0 END), 0) as card_sales,
                COALESCE(SUM(CASE WHEN payment_method = 'gcash' THEN total ELSE 0 END), 0) as gcash_sales,
                MIN(occurred_at) as opening_time,
                MAX(occurred_at) as closing_time
            FROM sales_transactions
            WHERE DATE(occurred_at) = ?
        ");
        $stmt->execute([$date]);
        $summary = $stmt->fetch(PDO::FETCH_ASSOC);

        // Get total items sold
        $stmt = $pdo->prepare("
            SELECT SUM(sti.quantity) as total_items
            FROM sales_transaction_items sti
            JOIN sales_transactions st ON sti.transaction_id = st.id
            WHERE DATE(st.occurred_at) = ?
        ");
        $stmt->execute([$date]);
        $itemsData = $stmt->fetch(PDO::FETCH_ASSOC);
        $totalItems = $itemsData['total_items'] ?? 0;

        // Insert or update daily report
        $stmt = $pdo->prepare("
            INSERT INTO daily_business_reports (
                report_date, total_sales, total_transactions, total_items_sold,
                average_transaction, total_discount, total_vat,
                cash_sales, card_sales, gcash_sales,
                opening_time, closing_time, cashier_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                total_sales = VALUES(total_sales),
                total_transactions = VALUES(total_transactions),
                total_items_sold = VALUES(total_items_sold),
                average_transaction = VALUES(average_transaction),
                total_discount = VALUES(total_discount),
                total_vat = VALUES(total_vat),
                cash_sales = VALUES(cash_sales),
                card_sales = VALUES(card_sales),
                gcash_sales = VALUES(gcash_sales),
                closing_time = VALUES(closing_time)
        ");

        $stmt->execute([
            $date,
            $summary['total_sales'],
            $summary['transaction_count'],
            $totalItems,
            $summary['average_transaction'],
            $summary['total_discount'],
            $summary['total_vat'],
            $summary['cash_sales'],
            $summary['card_sales'],
            $summary['gcash_sales'],
            $summary['opening_time'],
            $summary['closing_time'],
            $cashierId
        ]);

        // Save item sales
        $stmt = $pdo->prepare("
            SELECT
                sti.product_id,
                sti.product_name,
                COALESCE(pc.name, 'Uncategorized') as category_name,
                SUM(sti.quantity) as quantity_sold,
                SUM(sti.line_total) as total_revenue,
                AVG(sti.unit_price) as average_price
            FROM sales_transaction_items sti
            JOIN sales_transactions st ON sti.transaction_id = st.id
            LEFT JOIN products p ON sti.product_id = p.id
            LEFT JOIN product_categories pc ON p.category_id = pc.id
            WHERE DATE(st.occurred_at) = ?
            GROUP BY sti.product_id, sti.product_name, pc.name
        ");
        $stmt->execute([$date]);
        $itemSales = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Insert item sales
        $stmt = $pdo->prepare("
            INSERT INTO daily_item_sales (
                report_date, product_id, product_name, category_name,
                quantity_sold, total_revenue, average_price
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                quantity_sold = VALUES(quantity_sold),
                total_revenue = VALUES(total_revenue),
                average_price = VALUES(average_price)
        ");

        foreach ($itemSales as $item) {
            $stmt->execute([
                $date,
                $item['product_id'],
                $item['product_name'],
                $item['category_name'],
                $item['quantity_sold'],
                $item['total_revenue'],
                $item['average_price']
            ]);
        }

        $pdo->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Daily snapshot saved successfully',
            'date' => $date
        ]);

    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

/**
 * Generate X-Read (current day report, no finalization)
 */
function generateXRead($pdo) {
    getTodaySummary($pdo);
}

/**
 * Generate Z-Read (end of day report, finalizes the day)
 */
function generateZRead($pdo) {
    $today = date('Y-m-d');

    try {
        $pdo->beginTransaction();

        // Save daily snapshot first
        $_POST['date'] = $today;
        saveDailySnapshot($pdo);

        // Mark as finalized
        $stmt = $pdo->prepare("
            UPDATE daily_business_reports
            SET is_finalized = TRUE
            WHERE report_date = ?
        ");
        $stmt->execute([$today]);

        $pdo->commit();

        // Return the report
        getTodaySummary($pdo);

    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

/**
 * Get reports history
 */
function getReportsHistory($pdo) {
    $limit = $_GET['limit'] ?? 30;
    $offset = $_GET['offset'] ?? 0;

    $stmt = $pdo->prepare("
        SELECT * FROM v_business_reports
        LIMIT ? OFFSET ?
    ");
    $stmt->execute([(int)$limit, (int)$offset]);
    $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'reports' => $reports
    ]);
}
