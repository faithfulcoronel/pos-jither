<?php
session_start();

$users = require __DIR__ . '/php/users.php';
$initialData = require __DIR__ . '/php/data.php';

$errors = [];
$submittedUsername = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'login') {
        $submittedUsername = trim($_POST['username'] ?? '');
        $normalizedUsername = strtolower($submittedUsername);
        $password = $_POST['password'] ?? '';

        $authenticatedRole = null;
        foreach ($users as $role => $credentials) {
            $storedUsername = strtolower((string)($credentials['username'] ?? ''));
            if ($storedUsername === '' || $normalizedUsername !== $storedUsername) {
                continue;
            }

            $isValidPassword = false;
            $storedHash = $credentials['password_hash'] ?? null;
            if (is_string($storedHash) && $storedHash !== '') {
                $isValidPassword = password_verify($password, $storedHash);
            } else {
                $storedPassword = $credentials['password'] ?? null;
                if (is_string($storedPassword) && $storedPassword !== '') {
                    $isValidPassword = hash_equals($storedPassword, (string)$password);
                }
            }

            if ($isValidPassword) {
                $authenticatedRole = $credentials['role'] ?? $role;
                $authenticatedUsername = $credentials['username'] ?? '';
                break;
            }
        }

        if ($authenticatedRole) {
            $_SESSION['role'] = $authenticatedRole;
            $_SESSION['username'] = $authenticatedUsername ?? '';
            header('Location: index.php');
            exit;
        } else {
            $errors[] = 'Invalid username or password. Please try again.';
        }
    } elseif ($action === 'logout') {
        session_unset();
        session_destroy();
        header('Location: index.php');
        exit;
    }
}

$currentRole = $_SESSION['role'] ?? null;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Jowen's Kitchen & Cafe POS</title>
    <link rel="stylesheet" href="style.css" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css" />
    <script src="https://cdn.jsdelivr.net/npm/chart.js" defer></script>
    <script src="https://cdn.jsdelivr.net/npm/flatpickr" defer></script>
</head>
<body class="<?= $currentRole ? htmlspecialchars($currentRole) . '-mode' : '' ?>">
    <div class="app" id="app-root">
        <?php if (!$currentRole): ?>
            <section id="login-section" class="full-screen-section">
                <div class="login-container">
                    <h2>Log in</h2>
                    <?php if ($errors): ?>
                        <div class="error-message" role="alert">
                            <?= htmlspecialchars($errors[0]) ?>
                        </div>
                    <?php endif; ?>
                    <form method="post" class="login-form">
                        <input type="hidden" name="action" value="login" />
                        <input type="text" id="username" name="username" placeholder="Username" value="<?= htmlspecialchars($submittedUsername) ?>" required />
                        <input type="password" id="password" name="password" placeholder="Password" required />
                        <button type="submit" id="loginBtn">Log in</button>
                    </form>
                </div>
            </section>
        <?php endif; ?>

        <?php if ($currentRole === 'manager'): ?>
            <section id="manager-dashboard" class="dashboard-section full-screen-section">
                <div class="dashboard-container">
                    <aside class="sidebar">
                        <div class="sidebar-logo">
                            <img src="images/jowens.png" alt="Jowen's Kitchen & Cafe Logo">
                        </div>
                        <nav>
                            <a href="#" class="sidebar-item active" onclick="showManagerContent('home')">Home</a>
                            <a href="#" class="sidebar-item" onclick="showManagerContent('menu')">Menu</a>
                            <a href="#" class="sidebar-item" onclick="showManagerContent('inventory')">Inventory</a>
                            <a href="#" class="sidebar-item" onclick="showManagerContent('staff')">Staff</a>
                            <a href="#" class="sidebar-item" onclick="showManagerContent('sales')">View Sales</a>
                            <a href="#" class="sidebar-item" onclick="showManagerContent('report')">Business Report</a>
                        </nav>
                        <form method="post" class="logout-form">
                            <input type="hidden" name="action" value="logout" />
                            <button type="submit" class="logout-btn">Log out</button>
                        </form>
                    </aside>
                    <main id="manager-main-content" class="main-content">
                        <div id="home-content" class="content-section">
                            <div class="dashboard-header"><h1>Manager Dashboard</h1></div>
                            <div class="welcome-box"><p>Welcome, Manager</p></div>
                        </div>

                        <div id="menu-content" class="content-section hidden">
                            <div class="dashboard-header"><h1>Menu Items</h1></div>
                            <h3>Menu Management</h3>
                            <div class="menu-actions">
                                <button onclick="toggleForm('menuFormContainer')">Add New Product</button>
                                <button onclick="toggleForm('categoryFormContainer')">Add New Category</button>
                            </div>
                            <div class="menu-filter">
                                <label for="menuCategoryFilter">Filter by Category:</label>
                                <select id="menuCategoryFilter" onchange="displayMenuItems()"></select>
                            </div>
                            <div id="menuFormContainer" class="menu-form hidden">
                                <input type="text" id="newItemName" placeholder="Product Name">
                                <input type="number" id="newItemPrice" placeholder="Price">
                                <input type="text" id="newItemImage" placeholder="Image filename (e.g. espresso.jpeg)">
                                <select id="newItemCategory"></select>
                                <button onclick="addMenuItem()">Add Product</button>
                            </div>
                            <div id="categoryFormContainer" class="menu-form hidden">
                                <input type="text" id="newCategoryName" placeholder="Category Name">
                                <input type="text" id="newCategoryDescription" placeholder="Description (optional)">
                                <button onclick="addProductCategory()">Save Category</button>
                            </div>
                            <div id="categoryList" class="category-list"></div>
                            <div id="menuItemsContainer" class="menu-category-container"></div>
                        </div>

                        <div id="inventory-content" class="content-section hidden">
                            <div class="dashboard-header"><h1>Inventory</h1></div>
                            <h3>📦 Inventory Management</h3>
                            <button onclick="toggleForm('inventoryFormContainer')">Add New Inventory</button>
                            <div id="inventoryFormContainer" class="inventory-form hidden">
                                <input type="text" id="invItem" placeholder="Item name">
                                <input type="number" id="invQty" placeholder="Quantity">
                                <input type="text" id="invUnit" placeholder="Unit (kg, pcs, L)">
                                <button onclick="addInventory()">Add Inventory</button>
                            </div>
                            <div class="search-bar-container">
                                <input type="text" id="inventory-search" placeholder="Search for an item..." onkeyup="filterInventory()">
                            </div>
                            <table id="inventory" class="summary-table">
                                <thead>
                                    <tr><th>Item</th><th>Quantity</th><th>Unit</th><th>Actions</th></tr>
                                </thead>
                                <tbody></tbody>
                            </table>
                        </div>

                        <div id="staff-content" class="content-section hidden">
                            <div class="dashboard-header"><h1>Staff Accounts</h1></div>
                            <h3>👥 Staff Accounts</h3>
                            <button onclick="toggleForm('staffFormContainer')">Add New Staff</button>
                            <div id="staffFormContainer" class="staff-form hidden">
                                <input type="text" id="staffRole" placeholder="Role (e.g. Cashier)" required>
                                <input type="text" id="staffName" placeholder="Full Name" required>
                                <input type="text" id="staffUsername" placeholder="Username for login" required>
                                <input type="password" id="staffPassword" placeholder="Password" required>
                                <input type="password" id="staffPasswordConfirm" placeholder="Confirm Password" required>
                                <button onclick="addStaff()">Add Staff</button>
                                <button onclick="toggleForm('staffFormContainer')" style="background: #888;">Cancel</button>
                            </div>
                            <table id="staff" class="summary-table">
                                <thead>
                                    <tr><th>Role</th><th>Name</th><th>Time In</th><th>Time Out</th><th>Status</th><th>Actions</th></tr>
                                </thead>
                                <tbody></tbody>
                            </table>
                            <br>
                            <div class="dashboard-header"><h3>🕒 Timekeeping Records</h3></div>
                            <table id="timekeepingRecordsTable" class="summary-table">
                                <thead>
                                    <tr><th>Name</th><th>Role</th><th>Time In</th><th>Time Out</th><th>Hours Worked</th></tr>
                                </thead>
                                <tbody></tbody>
                            </table>
                        </div>

                        <div id="sales-content" class="content-section hidden">
                            <div class="dashboard-header"><h1>Sales History</h1></div>
                            <h3>📈 Overall Sales Report</h3>
                            <canvas id="salesChart"></canvas>
                            <br>
                            <div class="dashboard-header"><h3>📅 Daily Sales Calendar</h3></div>
                            <div class="report-controls">
                                <label for="datePicker">Select Date:</label>
                                <input type="date" id="datePicker" onchange="loadSalesByDate()">
                                <button onclick="clearDateFilter()">Show All</button>
                            </div>
                            <table id="dailySalesTable" class="summary-table">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Date</th>
                                        <th>Time</th>
                                        <th>Total (₱)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td colspan="4">Loading sales data...</td></tr>
                                </tbody>
                            </table>
                            <div class="total-sales" style="text-align: right; font-size: 1.2em; font-weight: bold; margin-top: 10px;">
                                Total Sales: ₱<span id="dailySalesTotal">0.00</span>
                            </div>
                        </div>

                        <div id="report-content" class="content-section hidden">
                            <div class="dashboard-header"><h1>Business Report</h1></div>
                            <h3>📊 Monthly Report</h3>
                            <table class="summary-table">
                                <thead>
                                    <tr><th>Month</th><th>Revenue (₱)</th><th>Expenses (₱)</th><th>Profit (₱)</th></tr>
                                </thead>
                                <tbody>
                                    <tr><td>May 2024</td><td>96,000</td><td>45,000</td><td>51,000</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </main>
                </div>
            </section>
        <?php endif; ?>

        <?php if ($currentRole === 'cashier'): ?>
            <section id="cashier-dashboard" class="dashboard-section full-screen-section">
                <div class="dashboard-container">
                    <aside class="sidebar">
                        <div class="sidebar-logo">
                            <img src="images/jowens.png" alt="Jowen's Kitchen & Cafe Logo">
                        </div>
                        <nav>
                            <a href="#" class="sidebar-item active" onclick="showCashierContent('order')">Take Order</a>
                            <a href="#" class="sidebar-item" onclick="showCashierContent('transaction')">Transactions</a>
                            <a href="#" class="sidebar-item" onclick="showCashierContent('daily')">Daily Summary</a>
                            <a href="#" class="sidebar-item" onclick="showCashierContent('timeclock')">Time Clock</a>
                        </nav>
                        <form method="post" class="logout-form">
                            <input type="hidden" name="action" value="logout" />
                            <button type="submit" class="logout-btn">Log out</button>
                        </form>
                    </aside>
                    <main id="cashier-main-content" class="main-content">
                        <div id="order-content" class="content-section">
                            <div class="dashboard-header"><h1>Take Order</h1></div>
                            <h3>New Order</h3>
                            <div class="order-form">
                                <label>Drink:<input type="text" id="drinkName" placeholder="Select a drink" readonly /></label>
                                <label>Qty:</label>
                                <input type="number" id="drinkQty" placeholder="0" />
                                <input type="hidden" id="drinkPrice" />
                                <button onclick="addOrder()">Add Order</button>
                                <button onclick="clearOrder()">Clear All</button>
                                <button onclick="checkOut()">Checkout</button>
                            </div>
                            <ul id="orderList" class="order-list"></ul>
                            <div class="menu-filter">
                                <label for="cashierCategoryFilter">Browse by Category:</label>
                                <select id="cashierCategoryFilter" onchange="displayMenuGallery()"></select>
                            </div>
                            <div class="menu-grid" id="menuItemsGallery"></div>
                        </div>

                        <div id="transaction-content" class="content-section hidden">
                            <div class="dashboard-header"><h1>Transactions</h1></div>
                            <h3>🧾 Receipt Transactions</h3>
                            <div class="transaction-layout">
                                <div class="transaction-list-panel">
                                    <ul id="transactionList"></ul>
                                </div>
                                <div class="receipt-panel">
                                    <div id="receipt" class="receipt">
                                        <h4>Jowen's Kitchen & Cafe</h4>
                                        <p>Date: <span id="receipt-date"></span></p>
                                        <p>Order Number: <span id="receipt-ordernumber"></span></p>
                                        <div id="receipt-items"></div>
                                        <p class="receipt-total">Total: ₱<span id="receipt-total">0</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div id="daily-content" class="content-section hidden">
                            <div class="dashboard-header"><h1>Daily Summary</h1></div>
                            <h3>📅 Daily Summary</h3>
                            <table id="daily-orders-summary" class="summary-table">
                                <thead>
                                    <tr><th>Order No</th><th>Items</th><th>Total (₱)</th></tr>
                                </thead>
                                <tbody>
                                    <tr><td colspan="3">No orders for today.</td></tr>
                                </tbody>
                            </table>
                            <div style="font-size: 1.2em; font-weight: bold; text-align: right; margin-top: 10px;">
                                Total Sales: ₱<span id="dailySalesTotal">0.00</span>
                            </div>
                            <br>
                            <h3>📈 Item Sales Summary</h3>
                            <table id="daily-item-summary" class="summary-table">
                                <thead>
                                    <tr><th>Item</th><th>Qty Sold</th><th>Total Revenue (₱)</th></tr>
                                </thead>
                                <tbody>
                                    <tr><td colspan="3">No items sold today.</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <div id="timeclock-content" class="content-section hidden">
                            <div class="dashboard-header"><h1>Time Clock</h1></div>
                            <div class="timeclock-panel">
                                <div class="timeclock-status">
                                    <h3>⏰ Current Status</h3>
                                    <div id="currentTimeClockStatus" class="status-display">
                                        <p class="status-text">Loading...</p>
                                    </div>
                                </div>
                                <div class="timeclock-actions">
                                    <button id="timeInBtn" onclick="cashierTimeIn()" class="timeclock-btn time-in-btn">
                                        ⏱️ Time In
                                    </button>
                                    <button id="timeOutBtn" onclick="cashierTimeOut()" class="timeclock-btn time-out-btn">
                                        ⏹️ Time Out
                                    </button>
                                </div>
                            </div>
                            <h3>📋 My Attendance History (Today)</h3>
                            <table id="cashierAttendanceTable" class="summary-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Time In</th>
                                        <th>Time Out</th>
                                        <th>Hours Worked</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td colspan="4">Loading attendance records...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </main>
                </div>
            </section>
        <?php endif; ?>
    </div>

    <script>
        window.initialData = <?= json_encode($initialData, JSON_UNESCAPED_UNICODE) ?>;
        window.currentUserRole = <?= json_encode($currentRole) ?>;
        window.currentUsername = <?= json_encode($_SESSION['username'] ?? '') ?>;
    </script>
    <script defer src="script.js"></script>
</body>
</html>
