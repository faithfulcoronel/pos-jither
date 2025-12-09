<!DOCTYPE html>
<html>
<head>
    <title>Test Sales Data - View Sales Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
        h1 { color: #8B6F47; }
        h2 { color: #FF8C42; margin-top: 30px; }
        .result { background: #f0f0f0; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .error { background: #fee; color: #c00; }
        .success { background: #efe; color: #060; }
        .warning { background: #ffd; color: #990; }
        .info { background: #def; color: #036; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border: 1px solid #ddd; }
        th { background: #8B6F47; color: white; }
        .btn { display: inline-block; padding: 12px 24px; background: #FF8C42; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; font-weight: bold; border: none; cursor: pointer; }
        .btn:hover { background: #E67A30; }
        .btn-danger { background: #EF4444; }
        .btn-danger:hover { background: #DC2626; }
    </style>
</head>
<body>
<div class="container">
    <h1>📊 Sales Data Diagnostic & Setup</h1>
    <p>This page checks if your View Sales dashboard has data and can generate sample sales data for testing.</p>

    <?php
    require_once __DIR__ . '/php/database.php';

    echo "<h2>1. Database Connection</h2>";
    try {
        $pdo = getDatabaseConnection();
        if ($pdo) {
            echo "<div class='result success'>✓ Database connected successfully</div>";
        } else {
            echo "<div class='result error'>✗ Database connection failed</div>";
            exit;
        }
    } catch (Exception $e) {
        echo "<div class='result error'>✗ Database error: " . $e->getMessage() . "</div>";
        exit;
    }

    // Check sales_transactions table
    echo "<h2>2. Sales Transactions Table</h2>";
    try {
        $stmt = $pdo->query("SHOW TABLES LIKE 'sales_transactions'");
        $tableExists = $stmt->rowCount() > 0;

        if ($tableExists) {
            echo "<div class='result success'>✓ sales_transactions table exists</div>";

            // Count total transactions
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM sales_transactions");
            $totalCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            echo "<div class='result'>Total sales transactions: <strong>$totalCount</strong></div>";

            // Count today's transactions
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM sales_transactions WHERE DATE(occurred_at) = CURDATE()");
            $todayCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            echo "<div class='result'>Today's sales: <strong>$todayCount</strong></div>";

            // Count this month's transactions
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM sales_transactions WHERE MONTH(occurred_at) = MONTH(CURDATE()) AND YEAR(occurred_at) = YEAR(CURDATE())");
            $monthCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            echo "<div class='result'>This month's sales: <strong>$monthCount</strong></div>";

            // Total revenue
            $stmt = $pdo->query("SELECT COALESCE(SUM(total), 0) as revenue FROM sales_transactions WHERE MONTH(occurred_at) = MONTH(CURDATE()) AND YEAR(occurred_at) = YEAR(CURDATE())");
            $revenue = $stmt->fetch(PDO::FETCH_ASSOC)['revenue'];
            echo "<div class='result'>This month's revenue: <strong>₱" . number_format($revenue, 2) . "</strong></div>";

        } else {
            echo "<div class='result error'>✗ sales_transactions table does NOT exist</div>";
            echo "<div class='result warning'>Please run the database setup SQL file first.</div>";
        }
    } catch (PDOException $e) {
        echo "<div class='result error'>✗ Error checking table: " . $e->getMessage() . "</div>";
    }

    // Check sales_transaction_items table
    echo "<h2>3. Sales Transaction Items Table</h2>";
    try {
        $stmt = $pdo->query("SHOW TABLES LIKE 'sales_transaction_items'");
        $itemsTableExists = $stmt->rowCount() > 0;

        if ($itemsTableExists) {
            echo "<div class='result success'>✓ sales_transaction_items table exists</div>";

            $stmt = $pdo->query("SELECT COUNT(*) as count FROM sales_transaction_items");
            $itemsCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            echo "<div class='result'>Total items sold: <strong>$itemsCount</strong></div>";
        } else {
            echo "<div class='result error'>✗ sales_transaction_items table does NOT exist</div>";
        }
    } catch (PDOException $e) {
        echo "<div class='result error'>✗ Error: " . $e->getMessage() . "</div>";
    }

    // Check products table
    echo "<h2>4. Products Table</h2>";
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM products WHERE status = 'active'");
        $productsCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        echo "<div class='result'>Active products: <strong>$productsCount</strong></div>";

        if ($productsCount > 0) {
            $stmt = $pdo->query("SELECT id, name, price FROM products WHERE status = 'active' LIMIT 5");
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo "<div class='result info'><strong>Sample products:</strong><ul>";
            foreach ($products as $product) {
                echo "<li>{$product['name']} - ₱" . number_format($product['price'], 2) . "</li>";
            }
            echo "</ul></div>";
        } else {
            echo "<div class='result warning'>⚠️ No active products found. Add products first!</div>";
        }
    } catch (PDOException $e) {
        echo "<div class='result error'>✗ Error: " . $e->getMessage() . "</div>";
    }

    // Check product categories
    echo "<h2>5. Product Categories</h2>";
    try {
        $stmt = $pdo->query("SELECT id, name FROM product_categories");
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $catCount = count($categories);

        echo "<div class='result'>Product categories: <strong>$catCount</strong></div>";

        if ($catCount > 0) {
            echo "<div class='result info'><strong>Categories:</strong><ul>";
            foreach ($categories as $cat) {
                echo "<li>{$cat['name']}</li>";
            }
            echo "</ul></div>";
        }
    } catch (PDOException $e) {
        echo "<div class='result error'>✗ Error: " . $e->getMessage() . "</div>";
    }

    // Recent sales
    echo "<h2>6. Recent Sales Transactions</h2>";
    try {
        $stmt = $pdo->query("
            SELECT
                reference,
                total,
                payment_method,
                occurred_at
            FROM sales_transactions
            ORDER BY occurred_at DESC
            LIMIT 10
        ");
        $recentSales = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (count($recentSales) > 0) {
            echo "<div class='result success'>Found " . count($recentSales) . " recent sales:</div>";
            echo "<table>";
            echo "<tr><th>Reference</th><th>Total</th><th>Payment</th><th>Date/Time</th></tr>";
            foreach ($recentSales as $sale) {
                echo "<tr>";
                echo "<td>{$sale['reference']}</td>";
                echo "<td>₱" . number_format($sale['total'], 2) . "</td>";
                echo "<td>" . ucfirst($sale['payment_method']) . "</td>";
                echo "<td>{$sale['occurred_at']}</td>";
                echo "</tr>";
            }
            echo "</table>";
        } else {
            echo "<div class='result warning'>⚠️ No sales transactions found in database</div>";
            echo "<div class='result info'>📋 You can generate sample data below to test the View Sales dashboard</div>";
        }
    } catch (PDOException $e) {
        echo "<div class='result error'>✗ Error: " . $e->getMessage() . "</div>";
    }

    // Action buttons
    echo "<h2>7. Actions</h2>";

    // Handle form submission to generate sample data
    if (isset($_POST['generate_sample_data'])) {
        echo "<div class='result info'>🔄 Generating sample sales data...</div>";

        try {
            $pdo->beginTransaction();

            // Get active products
            $stmt = $pdo->query("SELECT id, name, price FROM products WHERE status = 'active' LIMIT 10");
            $availableProducts = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (count($availableProducts) === 0) {
                throw new Exception("No active products found. Please add products first.");
            }

            $salesGenerated = 0;
            $startDate = new DateTime('2025-12-01'); // Start of December
            $endDate = new DateTime('2025-12-09');   // Today

            // Generate sales for each day
            $currentDate = clone $startDate;
            while ($currentDate <= $endDate) {
                // Generate 5-15 sales per day
                $salesPerDay = rand(5, 15);

                for ($i = 0; $i < $salesPerDay; $i++) {
                    // Random time during business hours (8 AM - 8 PM)
                    $hour = rand(8, 20);
                    $minute = rand(0, 59);
                    $second = rand(0, 59);

                    $saleTime = clone $currentDate;
                    $saleTime->setTime($hour, $minute, $second);

                    // Generate transaction
                    $reference = 'TXN-' . $saleTime->format('Ymd') . '-' . str_pad($i + 1, 3, '0', STR_PAD_LEFT);

                    // Random 1-4 items per transaction
                    $itemCount = rand(1, 4);
                    $subtotal = 0;
                    $items = [];

                    for ($j = 0; $j < $itemCount; $j++) {
                        $product = $availableProducts[array_rand($availableProducts)];
                        $quantity = rand(1, 3);
                        $lineTotal = $product['price'] * $quantity;
                        $subtotal += $lineTotal;

                        $items[] = [
                            'product_id' => $product['id'],
                            'product_name' => $product['name'],
                            'quantity' => $quantity,
                            'unit_price' => $product['price'],
                            'line_total' => $lineTotal
                        ];
                    }

                    $discountAmount = 0;
                    $taxAmount = 0;
                    $total = $subtotal - $discountAmount + $taxAmount;
                    $amountTendered = ceil($total / 10) * 10; // Round up to nearest 10
                    $changeAmount = $amountTendered - $total;
                    $paymentMethod = rand(0, 1) ? 'cash' : 'card';

                    // Insert transaction
                    $stmt = $pdo->prepare("
                        INSERT INTO sales_transactions (
                            reference, subtotal, discount_amount, tax_amount, total,
                            payment_method, amount_tendered, change_amount,
                            created_at, occurred_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
                    ");

                    $stmt->execute([
                        $reference,
                        $subtotal,
                        $discountAmount,
                        $taxAmount,
                        $total,
                        $paymentMethod,
                        $amountTendered,
                        $changeAmount,
                        $saleTime->format('Y-m-d H:i:s')
                    ]);

                    $transactionId = $pdo->lastInsertId();

                    // Insert transaction items
                    $itemStmt = $pdo->prepare("
                        INSERT INTO sales_transaction_items (
                            transaction_id, product_id, product_name, quantity,
                            unit_price, discount_amount, line_total, created_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                    ");

                    foreach ($items as $item) {
                        $itemStmt->execute([
                            $transactionId,
                            $item['product_id'],
                            $item['product_name'],
                            $item['quantity'],
                            $item['unit_price'],
                            0,
                            $item['line_total']
                        ]);
                    }

                    $salesGenerated++;
                }

                $currentDate->modify('+1 day');
            }

            $pdo->commit();

            echo "<div class='result success'>✅ Successfully generated <strong>$salesGenerated</strong> sample sales transactions!</div>";
            echo "<div class='result info'>📊 You can now view the data in Manager Dashboard → View Sales</div>";
            echo "<script>setTimeout(function(){ window.location.reload(); }, 2000);</script>";

        } catch (Exception $e) {
            $pdo->rollBack();
            echo "<div class='result error'>❌ Error generating data: " . $e->getMessage() . "</div>";
        }
    }

    // Handle delete all data
    if (isset($_POST['delete_all_data'])) {
        echo "<div class='result warning'>🗑️ Deleting all sales data...</div>";

        try {
            $pdo->beginTransaction();

            $pdo->exec("DELETE FROM sales_transaction_items");
            $pdo->exec("DELETE FROM sales_transactions");

            $pdo->commit();

            echo "<div class='result success'>✅ All sales data deleted successfully</div>";
            echo "<script>setTimeout(function(){ window.location.reload(); }, 1500);</script>";

        } catch (Exception $e) {
            $pdo->rollBack();
            echo "<div class='result error'>❌ Error deleting data: " . $e->getMessage() . "</div>";
        }
    }
    ?>

    <form method="POST" style="display: inline;" onsubmit="return confirm('Generate sample sales data for December 1-9, 2025?');">
        <button type="submit" name="generate_sample_data" class="btn">
            📊 Generate Sample Sales Data
        </button>
    </form>

    <form method="POST" style="display: inline;" onsubmit="return confirm('Are you sure you want to DELETE ALL sales data? This cannot be undone!');">
        <button type="submit" name="delete_all_data" class="btn btn-danger">
            🗑️ Delete All Sales Data
        </button>
    </form>

    <hr style="margin: 30px 0;">

    <h2>8. Test API Endpoints</h2>
    <div class="result info">
        <strong>Test these API endpoints to verify data is being returned:</strong>
        <ul>
            <li><a href="php/sales-analytics-api.php?action=get_kpis&start_date=2025-12-01&end_date=2025-12-09&date_range=month" target="_blank">KPIs</a></li>
            <li><a href="php/sales-analytics-api.php?action=get_time_period_comparison&start_date=2025-12-01&end_date=2025-12-09&date_range=month" target="_blank">Time Period Comparison</a></li>
            <li><a href="php/sales-analytics-api.php?action=get_category_sales&start_date=2025-12-01&end_date=2025-12-09" target="_blank">Category Sales</a></li>
            <li><a href="php/sales-analytics-api.php?action=get_best_sellers&start_date=2025-12-01&end_date=2025-12-09" target="_blank">Best Sellers</a></li>
        </ul>
    </div>

    <h2>9. Next Steps</h2>
    <div class="result info">
        <ol>
            <li>If you have no sales data, click "Generate Sample Sales Data" above</li>
            <li>Go to <strong>Manager Dashboard → View Sales</strong></li>
            <li>Select date range: <strong>December 1 - December 9, 2025</strong></li>
            <li>Charts should now display with data!</li>
            <li>Make real sales through the Cashier to see live data</li>
        </ol>
    </div>

    <p><a href="index.php" class="btn">← Back to POS System</a></p>

</div>
</body>
</html>
