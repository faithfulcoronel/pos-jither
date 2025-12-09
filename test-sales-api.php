<?php
/**
 * Test Sales Analytics API
 * Quick diagnostic tool to check if API endpoints are working
 */

error_reporting(E_ALL);
ini_set('display_errors', '1');

require_once 'php/database.php';

echo "<h1>Sales Analytics API Test</h1>";
echo "<style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .test-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
    .success { background: #d4edda; border-color: #c3e6cb; }
    .error { background: #f8d7da; border-color: #f5c6cb; }
    .info { background: #d1ecf1; border-color: #bee5eb; }
    pre { background: #f8f9fa; padding: 10px; overflow-x: auto; }
</style>";

try {
    $pdo = getDatabaseConnection();

    if (!$pdo) {
        echo "<div class='test-section error'><h2>❌ Database Connection Failed</h2></div>";
        exit;
    }

    echo "<div class='test-section success'><h2>✅ Database Connected</h2></div>";

    // Test 1: Check if sales_transactions table exists and has data
    echo "<div class='test-section info'>";
    echo "<h2>Test 1: Sales Transactions</h2>";
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM sales_transactions");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "<p>Total transactions: <strong>" . $result['count'] . "</strong></p>";

    if ($result['count'] > 0) {
        $stmt = $pdo->query("SELECT * FROM sales_transactions LIMIT 5");
        $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo "<h3>Sample Transactions:</h3>";
        echo "<pre>" . print_r($transactions, true) . "</pre>";
    } else {
        echo "<p class='error'>⚠️ No transactions found! This is why charts are empty.</p>";
    }
    echo "</div>";

    // Test 2: Check products and categories
    echo "<div class='test-section info'>";
    echo "<h2>Test 2: Products & Categories</h2>";
    $stmt = $pdo->query("
        SELECT
            p.id,
            p.name,
            p.price,
            pc.name as category_name
        FROM products p
        LEFT JOIN product_categories pc ON p.category_id = pc.id
        LIMIT 5
    ");
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "<h3>Sample Products:</h3>";
    echo "<pre>" . print_r($products, true) . "</pre>";
    echo "</div>";

    // Test 3: Test API endpoints
    $startDate = date('Y-m-01');
    $endDate = date('Y-m-t');

    echo "<div class='test-section info'>";
    echo "<h2>Test 3: API Endpoints</h2>";
    echo "<p>Testing period: $startDate to $endDate</p>";

    // Test get_kpis
    echo "<h3>1. KPIs Endpoint</h3>";
    $url = "http://" . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']) . "/php/sales-analytics-api.php?action=get_kpis&start_date=$startDate&end_date=$endDate&date_range=month";
    echo "<p>URL: <code>$url</code></p>";
    $response = file_get_contents($url);
    $data = json_decode($response, true);
    echo "<pre>" . print_r($data, true) . "</pre>";

    // Test get_category_sales
    echo "<h3>2. Category Sales Endpoint</h3>";
    $url = "http://" . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']) . "/php/sales-analytics-api.php?action=get_category_sales&start_date=$startDate&end_date=$endDate";
    echo "<p>URL: <code>$url</code></p>";
    $response = file_get_contents($url);
    $data = json_decode($response, true);
    echo "<pre>" . print_r($data, true) . "</pre>";

    // Test get_product_range_analysis
    echo "<h3>3. Product Range Analysis Endpoint</h3>";
    $url = "http://" . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']) . "/php/sales-analytics-api.php?action=get_product_range_analysis&start_date=$startDate&end_date=$endDate";
    echo "<p>URL: <code>$url</code></p>";
    $response = file_get_contents($url);
    $data = json_decode($response, true);
    echo "<pre>" . print_r($data, true) . "</pre>";

    // Test get_best_sellers
    echo "<h3>4. Best Sellers Endpoint</h3>";
    $url = "http://" . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']) . "/php/sales-analytics-api.php?action=get_best_sellers&start_date=$startDate&end_date=$endDate";
    echo "<p>URL: <code>$url</code></p>";
    $response = file_get_contents($url);
    $data = json_decode($response, true);
    echo "<pre>" . print_r($data, true) . "</pre>";

    echo "</div>";

    // Test 4: Suggest solution
    echo "<div class='test-section info'>";
    echo "<h2>💡 Solution</h2>";

    $stmt = $pdo->query("SELECT COUNT(*) as count FROM sales_transactions");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($result['count'] == 0) {
        echo "<p><strong>The charts are empty because there are no sales transactions in the database.</strong></p>";
        echo "<p>To fix this, you need to:</p>";
        echo "<ol>";
        echo "<li>Import the COMPLETE_DATABASE.sql file which includes sample transactions</li>";
        echo "<li>Or make some sales through the Cashier Dashboard to generate real data</li>";
        echo "</ol>";
        echo "<p>Run this command in phpMyAdmin:</p>";
        echo "<pre>SOURCE " . __DIR__ . "/database/COMPLETE_DATABASE.sql;</pre>";
    } else {
        echo "<p><strong>Database has sales data. Charts should be working.</strong></p>";
        echo "<p>If charts are still empty, check:</p>";
        echo "<ol>";
        echo "<li>Browser console for JavaScript errors (F12)</li>";
        echo "<li>Network tab to see if API calls are succeeding</li>";
        echo "<li>Make sure Chart.js library is loaded</li>";
        echo "</ol>";
    }
    echo "</div>";

} catch (Exception $e) {
    echo "<div class='test-section error'>";
    echo "<h2>❌ Error</h2>";
    echo "<p>" . $e->getMessage() . "</p>";
    echo "</div>";
}
?>
