<?php
/**
 * Business Reports API
 * Handles fetching historical business reports
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

    switch ($action) {
        case 'get_reports':
            getBusinessReports($pdo);
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

/**
 * Get business reports with optional filters
 */
function getBusinessReports($pdo) {
    try {
        $fromDate = $_GET['from_date'] ?? null;
        $toDate = $_GET['to_date'] ?? null;
        $days = $_GET['days'] ?? 30;
        $status = $_GET['status'] ?? 'all';

        // Build WHERE clause
        $whereConditions = [];
        $params = [];

        if ($fromDate && $toDate) {
            $whereConditions[] = "report_date BETWEEN ? AND ?";
            $params[] = $fromDate;
            $params[] = $toDate;
        } else {
            $whereConditions[] = "report_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)";
            $params[] = (int)$days;
        }

        if ($status === 'finalized') {
            $whereConditions[] = "is_finalized = TRUE";
        } elseif ($status === 'open') {
            $whereConditions[] = "is_finalized = FALSE";
        }

        $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';

        // Fetch reports
        $sql = "
            SELECT
                report_date,
                total_sales,
                total_transactions,
                total_items_sold,
                average_transaction,
                total_discount,
                total_vat,
                cash_sales,
                card_sales,
                gcash_sales,
                opening_time,
                closing_time,
                is_finalized
            FROM daily_business_reports
            $whereClause
            ORDER BY report_date DESC
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Calculate summary
        $summary = [
            'total_sales' => 0,
            'total_transactions' => 0,
            'total_items' => 0,
            'average_order' => 0,
            'sales_change' => 0,
            'transactions_change' => 0,
            'items_change' => 0,
            'avg_change' => 0
        ];

        foreach ($reports as $report) {
            $summary['total_sales'] += floatval($report['total_sales']);
            $summary['total_transactions'] += intval($report['total_transactions']);
            $summary['total_items'] += intval($report['total_items_sold']);
        }

        if ($summary['total_transactions'] > 0) {
            $summary['average_order'] = $summary['total_sales'] / $summary['total_transactions'];
        }

        // Calculate change percentages (compare with previous period)
        $previousPeriodSummary = getPreviousPeriodSummary($pdo, $fromDate, $toDate, $days);

        if ($previousPeriodSummary['total_sales'] > 0) {
            $summary['sales_change'] = (($summary['total_sales'] - $previousPeriodSummary['total_sales']) / $previousPeriodSummary['total_sales']) * 100;
        }

        if ($previousPeriodSummary['total_transactions'] > 0) {
            $summary['transactions_change'] = (($summary['total_transactions'] - $previousPeriodSummary['total_transactions']) / $previousPeriodSummary['total_transactions']) * 100;
        }

        if ($previousPeriodSummary['total_items'] > 0) {
            $summary['items_change'] = (($summary['total_items'] - $previousPeriodSummary['total_items']) / $previousPeriodSummary['total_items']) * 100;
        }

        if ($previousPeriodSummary['average_order'] > 0) {
            $summary['avg_change'] = (($summary['average_order'] - $previousPeriodSummary['average_order']) / $previousPeriodSummary['average_order']) * 100;
        }

        echo json_encode([
            'success' => true,
            'reports' => $reports,
            'summary' => $summary,
            'count' => count($reports)
        ]);

    } catch (PDOException $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    }
}

/**
 * Get previous period summary for comparison
 */
function getPreviousPeriodSummary($pdo, $fromDate, $toDate, $days) {
    try {
        $whereClause = '';
        $params = [];

        if ($fromDate && $toDate) {
            // Calculate previous period
            $from = new DateTime($fromDate);
            $to = new DateTime($toDate);
            $interval = $from->diff($to)->days;

            $prevFrom = clone $from;
            $prevFrom->modify("-{$interval} days");
            $prevTo = clone $from;
            $prevTo->modify("-1 day");

            $whereClause = "WHERE report_date BETWEEN ? AND ?";
            $params[] = $prevFrom->format('Y-m-d');
            $params[] = $prevTo->format('Y-m-d');
        } else {
            $whereClause = "WHERE report_date >= DATE_SUB(DATE_SUB(CURDATE(), INTERVAL ? DAY), INTERVAL ? DAY)
                           AND report_date < DATE_SUB(CURDATE(), INTERVAL ? DAY)";
            $params[] = (int)$days;
            $params[] = (int)$days;
            $params[] = (int)$days;
        }

        $sql = "
            SELECT
                COALESCE(SUM(total_sales), 0) as total_sales,
                COALESCE(SUM(total_transactions), 0) as total_transactions,
                COALESCE(SUM(total_items_sold), 0) as total_items,
                COALESCE(AVG(average_transaction), 0) as average_order
            FROM daily_business_reports
            $whereClause
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetch(PDO::FETCH_ASSOC);

    } catch (PDOException $e) {
        return [
            'total_sales' => 0,
            'total_transactions' => 0,
            'total_items' => 0,
            'average_order' => 0
        ];
    }
}
