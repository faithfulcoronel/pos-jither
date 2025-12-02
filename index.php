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
$currentUsername = $_SESSION['username'] ?? '';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Jowen's Kitchen & Cafe POS</title>
    <link rel="stylesheet" href="style.css" />
    <link rel="stylesheet" href="css/recipe-form-styles.css" />
    <link rel="stylesheet" href="css/inventify-theme.css" />
    <link rel="stylesheet" href="css/analytics-dashboard.css" />
    <link rel="stylesheet" href="css/sales-dashboard.css" />
    <link rel="stylesheet" href="css/staff-dashboard.css" />
    <link rel="stylesheet" href="css/timekeeping.css" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css" />
    <script src="https://cdn.jsdelivr.net/npm/chart.js" defer></script>
    <script src="https://cdn.jsdelivr.net/npm/flatpickr" defer></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" defer></script>
</head>
<body class="<?= $currentRole ? htmlspecialchars($currentRole) . '-mode' : '' ?>">
    <div class="app" id="app-root">
        <?php
        // Determine which page to show
        $showLogin = isset($_GET['login']) || isset($_POST['action']);
        ?>

        <?php if (!$currentRole && !$showLogin): ?>
            <!-- Modern POS-Style Time Keeping System -->
            <section id="timekeeping-section" class="full-screen-section timekeeping-page">
                <!-- POS Header Bar -->
                <div class="pos-header">
                    <div class="pos-header-content">
                        <div class="pos-brand">
                            <div class="pos-logo">☕</div>
                            <div class="pos-brand-text">
                                <h1>Employee Time Keeping</h1>
                                <p>Jowen's Kitchen & Cafe</p>
                            </div>
                        </div>
                        <div class="pos-header-time">
                            <div class="pos-time-label">Current Time</div>
                            <div class="pos-current-time" id="current-time">00:00:00</div>
                        </div>
                    </div>
                </div>

                <div class="tk-container">
                    <!-- Left Panel: Clock In/Out Terminal -->
                    <div class="tk-panel-left">
                        <!-- Terminal Header -->
                        <div class="tk-header">
                            <div class="tk-logo">⏱️</div>
                            <h1 class="tk-title">Time Clock Terminal</h1>
                            <p class="tk-subtitle">Clock In & Clock Out</p>
                        </div>

                        <!-- Alert Messages -->
                        <div class="tk-alert tk-alert-success" id="success-alert">
                            <span class="tk-alert-icon">✓</span>
                            <span id="success-message"></span>
                        </div>

                        <div class="tk-alert tk-alert-error" id="error-alert">
                            <span class="tk-alert-icon">✕</span>
                            <span id="error-message"></span>
                        </div>

                        <div class="tk-alert tk-alert-warning" id="warning-alert" style="display: none;">
                            <span class="tk-alert-icon">⚠️</span>
                            <span id="warning-message"></span>
                        </div>

                        <!-- Employee Input Form -->
                        <form class="tk-form" id="timekeeping-form" onsubmit="return false;">
                            <div class="tk-form-group">
                                <label class="tk-label" for="employee-number">
                                    <span class="tk-label-icon">👤</span>
                                    Employee Number
                                </label>
                                <input
                                    type="text"
                                    id="employee-number"
                                    class="tk-input"
                                    placeholder="EMP001"
                                    autocomplete="off"
                                    maxlength="20"
                                    required
                                />
                                <div class="tk-input-hint">Enter your employee ID to clock in/out</div>
                            </div>

                            <!-- Action Buttons -->
                            <div class="tk-actions">
                                <button type="button" class="tk-btn tk-btn-time-in" id="time-in-btn" onclick="handleTimeIn()">
                                    <span class="tk-btn-icon">☀️</span>
                                    <span class="tk-btn-text">
                                        <strong>TIME IN</strong>
                                        <small>Start Your Shift</small>
                                    </span>
                                </button>
                                <button type="button" class="tk-btn tk-btn-time-out" id="time-out-btn" onclick="handleTimeOut()">
                                    <span class="tk-btn-icon">🌙</span>
                                    <span class="tk-btn-text">
                                        <strong>TIME OUT</strong>
                                        <small>End Your Shift</small>
                                    </span>
                                </button>
                            </div>
                        </form>

                        <!-- Status Display Card -->
                        <div class="tk-status" id="employee-status" style="display: none;">
                            <div class="tk-status-header">
                                <span class="tk-status-icon">👤</span>
                                <h3 class="tk-status-name" id="status-employee">Welcome</h3>
                            </div>
                            <div class="tk-status-grid">
                                <div class="tk-status-item">
                                    <span class="tk-status-label">Time In</span>
                                    <span class="tk-status-value tk-time-in" id="status-time-in">-</span>
                                </div>
                                <div class="tk-status-item">
                                    <span class="tk-status-label">Time Out</span>
                                    <span class="tk-status-value tk-time-out" id="status-time-out">-</span>
                                </div>
                                <div class="tk-status-item">
                                    <span class="tk-status-label">Hours Worked</span>
                                    <span class="tk-status-value tk-hours" id="status-hours">-</span>
                                </div>
                                <div class="tk-status-item">
                                    <span class="tk-status-label">Status</span>
                                    <span class="tk-status-value" id="status-badge">-</span>
                                </div>
                            </div>
                        </div>

                        <!-- Quick Tips -->
                        <div class="tk-tips">
                            <h4 class="tk-tips-title">Quick Tips</h4>
                            <div class="tk-tip-item">
                                <span class="tk-tip-icon">💡</span>
                                <span class="tk-tip-text">Enter your employee number to get started</span>
                            </div>
                            <div class="tk-tip-item">
                                <span class="tk-tip-icon">⏰</span>
                                <span class="tk-tip-text">Clock in when you arrive, clock out when leaving</span>
                            </div>
                            <div class="tk-tip-item">
                                <span class="tk-tip-icon">📊</span>
                                <span class="tk-tip-text">View your attendance history on the right panel</span>
                            </div>
                        </div>
                    </div>

                    <!-- Right Panel: Attendance History -->
                    <div class="tk-panel-right">
                        <div class="tk-history-header">
                            <div class="tk-history-title-wrapper">
                                <span class="tk-history-icon">📊</span>
                                <h2 class="tk-history-title">Your Attendance</h2>
                            </div>
                            <p class="tk-history-subtitle">View your time records and work hours</p>
                        </div>

                        <!-- Period Filters -->
                        <div class="tk-filters">
                            <button class="tk-filter-btn active" onclick="filterAttendance('weekly')" data-filter="weekly">
                                <span class="tk-filter-icon">📆</span>
                                <span>Weekly</span>
                            </button>
                            <button class="tk-filter-btn" onclick="filterAttendance('semi-monthly')" data-filter="semi-monthly">
                                <span class="tk-filter-icon">📋</span>
                                <span>Semi-Month</span>
                            </button>
                            <button class="tk-filter-btn" onclick="filterAttendance('monthly')" data-filter="monthly">
                                <span class="tk-filter-icon">📊</span>
                                <span>Monthly</span>
                            </button>
                            <button class="tk-filter-btn" onclick="filterAttendance('yearly')" data-filter="yearly">
                                <span class="tk-filter-icon">📈</span>
                                <span>Yearly</span>
                            </button>
                        </div>

                        <!-- Attendance Table -->
                        <div class="tk-history" id="attendance-history">
                            <table class="tk-table" id="attendance-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>👤 Employee #</th>
                                        <th>⏰ Time In</th>
                                        <th>🏁 Time Out</th>
                                        <th>⏱️ Hours</th>
                                        <th>📊 Status</th>
                                    </tr>
                                </thead>
                                <tbody id="attendance-tbody">
                                    <tr>
                                        <td colspan="6" class="tk-empty">
                                            <div class="tk-empty-icon">☕</div>
                                            <div class="tk-empty-title">No Records Yet</div>
                                            <div class="tk-empty-text">Enter your employee number to view your attendance history</div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Summary Stats -->
                        <div class="tk-summary" id="attendance-summary" style="display: none;">
                            <div class="tk-summary-item">
                                <span class="tk-summary-icon">✓</span>
                                <span class="tk-summary-value" id="summary-present">0</span>
                                <span class="tk-summary-label">Present Days</span>
                            </div>
                            <div class="tk-summary-item">
                                <span class="tk-summary-icon">⏱️</span>
                                <span class="tk-summary-value" id="summary-hours">0</span>
                                <span class="tk-summary-label">Total Hours</span>
                            </div>
                            <div class="tk-summary-item">
                                <span class="tk-summary-icon">✕</span>
                                <span class="tk-summary-value" id="summary-absent">0</span>
                                <span class="tk-summary-label">Absent Days</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Manager Login Button (Floating Bottom) -->
            <div class="tk-bottom-button">
                <a href="?login=1" class="tk-manager-login-btn">
                    <span class="tk-btn-icon">🔐</span>
                    <span class="tk-manager-text">
                        <strong>Manager / Cashier Login</strong>
                        <small>Access full system features</small>
                    </span>
                </a>
            </div>
        <?php endif; ?>

        <?php if (!$currentRole && $showLogin): ?>
            <section id="login-section" class="full-screen-section">
                <div class="login-container">
                    <a href="index.php" class="back-arrow" title="Back to Time Clock Terminal">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                    </a>
                    <div class="login-logo">
                        <img src="images/jowens.png" alt="Jowen's Kitchen & Cafe Logo">
                    </div>
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
                            <a href="#" class="sidebar-item" onclick="showManagerContent('reports')">Reports</a>
                        </nav>
                        <form method="post" class="logout-form">
                            <input type="hidden" name="action" value="logout" />
                            <button type="submit" class="logout-btn">Log out</button>
                        </form>
                    </aside>
                    <main id="manager-main-content" class="main-content">
                        <!-- Business Analytics Dashboard for Manager Home -->
                        <div id="home-content" class="content-section">
                            <div class="analytics-dashboard">

                                <!-- Dashboard Header -->
                                <div class="analytics-header">
                                    <h1>Business Analytics Dashboard</h1>
                                    <p class="subtitle">Coffee Shop Performance & Insights</p>
                                </div>

                                <!-- Filters -->
                                <div class="analytics-filters">
                                    <div class="filter-group">
                                        <label>Year</label>
                                        <select id="home-year-filter" class="filter-select" onchange="refreshHomeDashboard()">
                                            <option value="2024">2024</option>
                                            <option value="2023">2023</option>
                                            <option value="2022">2022</option>
                                        </select>
                                    </div>
                                    <div class="filter-group">
                                        <label>Quarter</label>
                                        <select id="home-quarter-filter" class="filter-select" onchange="refreshHomeDashboard()">
                                            <option value="all">All Quarters</option>
                                            <option value="Q1">Q1 (Jan-Mar)</option>
                                            <option value="Q2">Q2 (Apr-Jun)</option>
                                            <option value="Q3">Q3 (Jul-Sep)</option>
                                            <option value="Q4">Q4 (Oct-Dec)</option>
                                        </select>
                                    </div>
                                    <div class="filter-group">
                                        <label>Region</label>
                                        <select id="home-region-filter" class="filter-select" onchange="refreshHomeDashboard()">
                                            <option value="all">All Regions</option>
                                            <option value="north">North</option>
                                            <option value="south">South</option>
                                            <option value="east">East</option>
                                            <option value="west">West</option>
                                            <option value="central">Central</option>
                                        </select>
                                    </div>
                                    <button class="refresh-btn" onclick="refreshHomeDashboard()">
                                        🔄 Refresh Data
                                    </button>
                                </div>

                                <!-- KPI Cards -->
                                <div class="kpi-cards">
                                    <div class="kpi-card">
                                        <div class="kpi-label">Total Revenue</div>
                                        <div class="kpi-value" id="home-kpi-revenue">₱0.00</div>
                                        <div class="kpi-change up" id="home-kpi-revenue-change">
                                            <span>↑</span> <span>0%</span> vs last period
                                        </div>
                                    </div>
                                    <div class="kpi-card">
                                        <div class="kpi-label">Gross Profit</div>
                                        <div class="kpi-value" id="home-kpi-profit">₱0.00</div>
                                        <div class="kpi-change up" id="home-kpi-profit-change">
                                            <span>↑</span> <span>0%</span> vs last period
                                        </div>
                                    </div>
                                    <div class="kpi-card">
                                        <div class="kpi-label">Avg Margin</div>
                                        <div class="kpi-value" id="home-kpi-margin">0%</div>
                                        <div class="kpi-change up" id="home-kpi-margin-change">
                                            <span>↑</span> <span>0%</span> vs last period
                                        </div>
                                    </div>
                                    <div class="kpi-card">
                                        <div class="kpi-label">Total Orders</div>
                                        <div class="kpi-value" id="home-kpi-orders">0</div>
                                        <div class="kpi-change up" id="home-kpi-orders-change">
                                            <span>↑</span> <span>0%</span> vs last period
                                        </div>
                                    </div>
                                </div>

                                <!-- Charts Grid -->
                                <div class="analytics-grid">

                                    <!-- Yearly Sales by Region (Stacked Bar) -->
                                    <div class="chart-card span-8">
                                        <div class="chart-card-header">
                                            <h3 class="chart-card-title">Yearly Sales by Region</h3>
                                            <span class="chart-card-icon">📊</span>
                                        </div>
                                        <div class="chart-card-body">
                                            <canvas id="home-chart-sales-by-region"></canvas>
                                        </div>
                                    </div>

                                    <!-- Gross Margin by Category (Donut Charts) -->
                                    <div class="chart-card span-4">
                                        <div class="chart-card-header">
                                            <h3 class="chart-card-title">Gross Margin by Category</h3>
                                            <span class="chart-card-icon">🍩</span>
                                        </div>
                                        <div class="chart-card-body">
                                            <div class="donut-charts-container">
                                                <div class="donut-chart-wrapper">
                                                    <div class="donut-chart-title">Revenue</div>
                                                    <canvas id="home-chart-margin-revenue" class="donut-chart-canvas"></canvas>
                                                </div>
                                                <div class="donut-chart-wrapper">
                                                    <div class="donut-chart-title">Profit</div>
                                                    <canvas id="home-chart-margin-profit" class="donut-chart-canvas"></canvas>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Actual vs Plan by Sales Month (Line Chart) -->
                                    <div class="chart-card span-8">
                                        <div class="chart-card-header">
                                            <h3 class="chart-card-title">Actual vs Plan by Sales Month</h3>
                                            <span class="chart-card-icon">📈</span>
                                        </div>
                                        <div class="chart-card-body">
                                            <canvas id="home-chart-actual-vs-plan"></canvas>
                                        </div>
                                    </div>

                                    <!-- Sales & Profit by Region (Horizontal Stacked Bar) -->
                                    <div class="chart-card span-4">
                                        <div class="chart-card-header">
                                            <h3 class="chart-card-title">Sales & Profit by Region</h3>
                                            <span class="chart-card-icon">🌍</span>
                                        </div>
                                        <div class="chart-card-body">
                                            <canvas id="home-chart-sales-profit-region"></canvas>
                                        </div>
                                    </div>

                                    <!-- Sales Crosstab by Category and Region (Table) -->
                                    <div class="chart-card span-6">
                                        <div class="chart-card-header">
                                            <h3 class="chart-card-title">Sales Crosstab by Category & Region</h3>
                                            <span class="chart-card-icon">📋</span>
                                        </div>
                                        <div class="chart-card-body" style="overflow-x: auto;">
                                            <table class="analytics-table" id="home-table-crosstab">
                                                <thead>
                                                    <tr>
                                                        <th>Category</th>
                                                        <th class="cell-number">North</th>
                                                        <th class="cell-number">South</th>
                                                        <th class="cell-number">East</th>
                                                        <th class="cell-number">West</th>
                                                        <th class="cell-number">Central</th>
                                                        <th class="cell-number">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody id="home-tbody-crosstab">
                                                    <tr>
                                                        <td colspan="7" class="chart-loading">
                                                            <div class="chart-loading-spinner"></div>
                                                            Loading data...
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <!-- Actual Sales vs Plan Sales (Table) -->
                                    <div class="chart-card span-6">
                                        <div class="chart-card-header">
                                            <h3 class="chart-card-title">Actual Sales vs Plan Sales</h3>
                                            <div style="display: flex; gap: 8px;">
                                                <button class="export-btn" onclick="exportTableToCSV('home-table-variance')">
                                                    📥 Export
                                                </button>
                                                <span class="chart-card-icon">💰</span>
                                            </div>
                                        </div>
                                        <div class="chart-card-body" style="overflow-x: auto;">
                                            <table class="analytics-table" id="home-table-variance">
                                                <thead>
                                                    <tr>
                                                        <th>Month</th>
                                                        <th class="cell-currency">Plan</th>
                                                        <th class="cell-currency">Actual</th>
                                                        <th class="cell-currency">Variance</th>
                                                        <th class="cell-percent">%</th>
                                                        <th class="cell-currency">Profit</th>
                                                    </tr>
                                                </thead>
                                                <tbody id="home-tbody-variance">
                                                    <tr>
                                                        <td colspan="6" class="chart-loading">
                                                            <div class="chart-loading-spinner"></div>
                                                            Loading data...
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                </div>

                            </div>
                        </div>

                        <div id="menu-content" class="content-section hidden">
                            <div class="dashboard-header"><h1>Menu Items</h1></div>
                            <h3>Menu Management</h3>
                            <div class="menu-actions">
                                <button onclick="openProductModal('add')">Add New Product</button>
                                <button onclick="toggleForm('categoryFormContainer')">Add New Category</button>
                            </div>
                            <div class="menu-filter">
                                <label for="menuCategoryFilter">Filter by Category:</label>
                                <select id="menuCategoryFilter" onchange="displayMenuItems()"></select>
                            </div>
                            <div id="categoryFormContainer" class="menu-form hidden">
                                <input type="text" id="newCategoryName" placeholder="Category Name">
                                <input type="text" id="newCategoryDescription" placeholder="Description (optional)">
                                <button onclick="addProductCategory()">Save Category</button>
                            </div>
                            <div id="categoryList" class="category-list"></div>
                            <div id="menuItemsContainer" class="menu-category-container"></div>
                        </div>

                        <!-- Inventify-Style Inventory Management -->
                        <div id="inventory-content" class="content-section hidden">
                            <div class="inventify-container">
                                <!-- Header -->
                                <div class="inventify-header">
                                    <h1 class="inventify-title">📦 Inventory Management</h1>
                                    <p class="inventify-subtitle">Track, manage, and optimize your stock levels</p>
                                </div>

                                <!-- Summary Cards -->
                                <div class="inventify-summary">
                                    <div class="inventify-summary-card">
                                        <div class="inventify-summary-label">
                                            <span class="inventify-summary-icon">📊</span>
                                            Total Items
                                        </div>
                                        <div class="inventify-summary-value" id="inventify-total-items">0</div>
                                    </div>
                                    <div class="inventify-summary-card">
                                        <div class="inventify-summary-label">
                                            <span class="inventify-summary-icon">💰</span>
                                            Current Value
                                        </div>
                                        <div class="inventify-summary-value" id="inventify-current-value">₱0.00</div>
                                    </div>
                                    <div class="inventify-summary-card">
                                        <div class="inventify-summary-label">
                                            <span class="inventify-summary-icon">⚠️</span>
                                            Low Stock Items
                                        </div>
                                        <div class="inventify-summary-value" id="inventify-low-stock">0</div>
                                    </div>
                                    <div class="inventify-summary-card">
                                        <div class="inventify-summary-label">
                                            <span class="inventify-summary-icon">🔴</span>
                                            Out of Stock
                                        </div>
                                        <div class="inventify-summary-value" id="inventify-out-of-stock">0</div>
                                    </div>
                                </div>

                                <!-- Toolbar -->
                                <div class="inventify-toolbar">
                                    <div class="inventify-search">
                                        <span class="inventify-search-icon">🔍</span>
                                        <input type="text" id="inventify-search-input" placeholder="Search items by name, SKU, or category..." onkeyup="inventifySearch()">
                                    </div>
                                    <select id="inventify-category-filter" class="inventify-form-select" style="width: auto; min-width: 150px;" onchange="inventifyFilterByCategory()">
                                        <option value="">All Categories</option>
                                    </select>
                                    <select id="inventify-status-filter" class="inventify-form-select" style="width: auto; min-width: 150px;" onchange="inventifyFilterByStatus()">
                                        <option value="">All Status</option>
                                        <option value="in_stock">In Stock</option>
                                        <option value="low_stock">Low Stock</option>
                                        <option value="below_reorder">Below Reorder</option>
                                        <option value="out_of_stock">Out of Stock</option>
                                    </select>
                                    <button class="inventify-btn inventify-btn-primary" onclick="inventifyShowAddModal()">
                                        ➕ Add Item
                                    </button>
                                    <button class="inventify-btn inventify-btn-secondary" onclick="inventifyShowBulkAddModal()">
                                        📋 Bulk Add
                                    </button>
                                    <button class="inventify-btn inventify-btn-secondary" onclick="inventifyExportCSV()">
                                        📥 Export
                                    </button>
                                </div>

                                <!-- Tabs -->
                                <div class="inventify-tabs">
                                    <button class="inventify-tab active" onclick="inventifySwitchTab('stock')">📦 Stock</button>
                                    <button class="inventify-tab" onclick="inventifySwitchTab('cost')">💵 Cost</button>
                                    <button class="inventify-tab" onclick="inventifySwitchTab('activities')">📈 Activities</button>
                                    <button class="inventify-tab" onclick="inventifySwitchTab('audit')">🔍 Audit Logs</button>
                                </div>

                                <!-- Tab Content -->
                                <div class="inventify-table-container">
                                    <!-- Stock Tab -->
                                    <div id="inventify-stock-tab" class="inventify-tab-content">
                                        <table class="inventify-table">
                                            <thead>
                                                <tr>
                                                    <th>ID</th>
                                                    <th>Description</th>
                                                    <th>SKU</th>
                                                    <th>Category</th>
                                                    <th>Available Qty</th>
                                                    <th>Status</th>
                                                    <th>Status (%)</th>
                                                    <th>Reorder Level</th>
                                                    <th>Location</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody id="inventify-stock-tbody">
                                                <!-- Populated by JavaScript -->
                                            </tbody>
                                        </table>
                                    </div>

                                    <!-- Cost Tab -->
                                    <div id="inventify-cost-tab" class="inventify-tab-content hidden">
                                        <table class="inventify-table">
                                            <thead>
                                                <tr>
                                                    <th>Description</th>
                                                    <th>Unit Size</th>
                                                    <th>Unit</th>
                                                    <th>Purchase Cost</th>
                                                    <th>Cost/Unit</th>
                                                    <th>Available Qty</th>
                                                    <th>Total Value</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody id="inventify-cost-tbody">
                                                <!-- Populated by JavaScript -->
                                            </tbody>
                                        </table>
                                    </div>

                                    <!-- Activities Tab -->
                                    <div id="inventify-activities-tab" class="inventify-tab-content hidden">
                                        <div id="inventify-activities-container">
                                            <!-- Populated by JavaScript -->
                                        </div>
                                    </div>

                                    <!-- Audit Logs Tab -->
                                    <div id="inventify-audit-tab" class="inventify-tab-content hidden">
                                        <table class="inventify-table">
                                            <thead>
                                                <tr>
                                                    <th>Timestamp</th>
                                                    <th>Item</th>
                                                    <th>Action</th>
                                                    <th>Field Changed</th>
                                                    <th>Old Value</th>
                                                    <th>New Value</th>
                                                    <th>Changed By</th>
                                                </tr>
                                            </thead>
                                            <tbody id="inventify-audit-tbody">
                                                <!-- Populated by JavaScript -->
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <!-- Add/Edit Item Modal -->
                            <div id="inventify-item-modal" class="inventify-modal hidden">
                                <div class="inventify-modal-content">
                                    <div class="inventify-modal-header">
                                        <h2 class="inventify-modal-title" id="inventify-modal-title">Add New Item</h2>
                                        <button class="inventify-icon-btn delete" onclick="inventifyCloseModal()">✕</button>
                                    </div>
                                    <div class="inventify-modal-body">
                                        <form id="inventify-item-form" class="inventify-form">
                                            <input type="hidden" id="inventify-item-id">

                                            <div class="inventify-form-grid">
                                                <div class="inventify-form-group">
                                                    <label class="inventify-form-label">Item Name *</label>
                                                    <input type="text" id="inventify-item-name" class="inventify-form-input" required placeholder="e.g., Coffee Beans">
                                                </div>

                                                <div class="inventify-form-group">
                                                    <label class="inventify-form-label">Category *</label>
                                                    <select id="inventify-item-category" class="inventify-form-select" required>
                                                        <option value="">Select Category</option>
                                                    </select>
                                                </div>

                                                <div class="inventify-form-group">
                                                    <label class="inventify-form-label">Unit of Measurement *</label>
                                                    <select id="inventify-item-unit" class="inventify-form-select" required>
                                                        <option value="g">Grams (g)</option>
                                                        <option value="ml">Milliliters (ml)</option>
                                                        <option value="pcs">Pieces (pcs)</option>
                                                        <option value="kg">Kilograms (kg)</option>
                                                        <option value="L">Liters (L)</option>
                                                        <option value="oz">Ounces (oz)</option>
                                                    </select>
                                                </div>

                                                <div class="inventify-form-group">
                                                    <label class="inventify-form-label">Unit Size *</label>
                                                    <input type="number" id="inventify-item-unit-size" class="inventify-form-input" step="0.01" min="0" required placeholder="e.g., 1000" onchange="inventifyCalculateCostPerUnit()">
                                                    <div class="inventify-form-helper">Size of one unit (e.g., 1000 for 1kg bag)</div>
                                                </div>

                                                <div class="inventify-form-group">
                                                    <label class="inventify-form-label">Purchase Cost *</label>
                                                    <input type="number" id="inventify-item-cost" class="inventify-form-input" step="0.01" min="0" required placeholder="e.g., 500" onchange="inventifyCalculateCostPerUnit()">
                                                    <div class="inventify-form-helper">Cost to buy one full unit</div>
                                                </div>

                                                <div class="inventify-form-group">
                                                    <label class="inventify-form-label">Cost per Unit (Auto)</label>
                                                    <input type="number" id="inventify-item-cost-per-unit" class="inventify-form-input" step="0.0001" readonly>
                                                    <div class="inventify-form-helper">Auto-calculated: cost ÷ unit_size</div>
                                                </div>

                                                <div class="inventify-form-group">
                                                    <label class="inventify-form-label">SKU / Barcode</label>
                                                    <input type="text" id="inventify-item-sku" class="inventify-form-input" placeholder="e.g., SKU-001">
                                                </div>

                                                <div class="inventify-form-group">
                                                    <label class="inventify-form-label">Initial Quantity *</label>
                                                    <input type="number" id="inventify-item-quantity" class="inventify-form-input" step="0.01" min="0" required placeholder="e.g., 5000">
                                                </div>

                                                <div class="inventify-form-group">
                                                    <label class="inventify-form-label">Reorder Level *</label>
                                                    <input type="number" id="inventify-item-reorder" class="inventify-form-input" step="0.01" min="0" required placeholder="e.g., 1000">
                                                    <div class="inventify-form-helper">Alert when stock falls below this</div>
                                                </div>

                                                <div class="inventify-form-group">
                                                    <label class="inventify-form-label">Max Stock</label>
                                                    <input type="number" id="inventify-item-max-stock" class="inventify-form-input" step="0.01" min="0" placeholder="e.g., 10000">
                                                </div>

                                                <div class="inventify-form-group">
                                                    <label class="inventify-form-label">Location</label>
                                                    <input type="text" id="inventify-item-location" class="inventify-form-input" placeholder="e.g., Storage Room A">
                                                </div>

                                                <div class="inventify-form-group">
                                                    <label class="inventify-form-label">Barcode</label>
                                                    <input type="text" id="inventify-item-barcode" class="inventify-form-input" placeholder="e.g., 1234567890">
                                                </div>
                                            </div>

                                            <div class="inventify-form-group">
                                                <label class="inventify-form-label">Notes</label>
                                                <textarea id="inventify-item-notes" class="inventify-form-textarea" rows="3" placeholder="Additional notes about this item..."></textarea>
                                            </div>

                                            <!-- Movement History (Edit Mode Only) -->
                                            <div id="inventify-movement-history-section" class="hidden" style="margin-top: 30px;">
                                                <h3 style="margin-bottom: 16px; color: var(--inventify-gray-900);">📊 Quantity Movement History</h3>
                                                <div id="inventify-movement-history">
                                                    <!-- Populated by JavaScript -->
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                    <div class="inventify-modal-footer">
                                        <button type="button" class="inventify-btn inventify-btn-secondary" onclick="inventifyCloseModal()">Cancel</button>
                                        <button type="button" class="inventify-btn inventify-btn-primary" onclick="inventifySaveItem()">Save Item</button>
                                    </div>
                                </div>
                            </div>

                            <!-- Bulk Add Modal -->
                            <div id="inventify-bulk-modal" class="inventify-modal hidden">
                                <div class="inventify-modal-content">
                                    <div class="inventify-modal-header">
                                        <h2 class="inventify-modal-title">📋 Bulk Add Items</h2>
                                        <button class="inventify-icon-btn delete" onclick="inventifyCloseBulkModal()">✕</button>
                                    </div>
                                    <div class="inventify-modal-body">
                                        <p style="margin-bottom: 16px; color: var(--inventify-gray-600);">
                                            Paste CSV data (Name, Category, Unit, Unit Size, Cost, Quantity, Reorder Level, Location, SKU)
                                        </p>
                                        <textarea id="inventify-bulk-input" class="inventify-form-textarea" rows="10" placeholder="Coffee Beans,Raw Materials,g,1000,500,5000,1000,Storage Room A,SKU-001&#10;Milk,Beverages,ml,1000,80,25000,5000,Refrigerator,SKU-002"></textarea>
                                        <div class="inventify-form-helper" style="margin-top: 8px;">
                                            Format: Name, Category, Unit, Unit Size, Purchase Cost, Quantity, Reorder Level, Location, SKU
                                        </div>
                                    </div>
                                    <div class="inventify-modal-footer">
                                        <button type="button" class="inventify-btn inventify-btn-secondary" onclick="inventifyCloseBulkModal()">Cancel</button>
                                        <button type="button" class="inventify-btn inventify-btn-primary" onclick="inventifyBulkAdd()">Add Items</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div id="reports-content" class="content-section hidden">
                            <div class="dashboard-header"><h1>Business Reports</h1></div>

                            <!-- Reports Tabs -->
                            <div class="reports-tabs">
                                <button class="report-tab active" onclick="showReportTab('sales-report', event)">📊 Sales Reports</button>
                                <button class="report-tab" onclick="showReportTab('inventory-summary', event)">📦 Inventory Summary</button>
                                <button class="report-tab" onclick="showReportTab('item-velocity', event)">🔥 Item Velocity</button>
                                <button class="report-tab" onclick="showReportTab('stock-aging', event)">⏰ Stock Aging</button>
                                <button class="report-tab" onclick="showReportTab('purchase-history', event)">🛒 Purchase History</button>
                                <button class="report-tab" onclick="showReportTab('profit-loss', event)">💰 Profit & Loss</button>
                                <button class="report-tab" onclick="showReportTab('shrinkage', event)">⚠️ Shrinkage</button>
                            </div>

                            <!-- Sales Reports Tab -->
                            <div id="sales-report-tab" class="report-tab-content">
                                <h3>📊 Sales Reports</h3>
                                <div class="report-controls">
                                    <label>Report Period:</label>
                                    <select id="salesReportPeriod" onchange="generateSalesReport()">
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="custom">Custom Range</option>
                                    </select>
                                    <input type="date" id="salesStartDate" onchange="generateSalesReport()">
                                    <input type="date" id="salesEndDate" onchange="generateSalesReport()">
                                    <button onclick="generateSalesReport()">Generate Report</button>
                                    <button onclick="exportReport('sales')">Export CSV</button>
                                </div>
                                <div id="sales-report-summary" class="report-summary-cards">
                                    <div class="summary-card">
                                        <div class="card-label">Total Revenue</div>
                                        <div class="card-value" id="totalRevenue">₱0.00</div>
                                    </div>
                                    <div class="summary-card">
                                        <div class="card-label">Total Transactions</div>
                                        <div class="card-value" id="totalTransactions">0</div>
                                    </div>
                                    <div class="summary-card">
                                        <div class="card-label">Average Transaction</div>
                                        <div class="card-value" id="avgTransaction">₱0.00</div>
                                    </div>
                                    <div class="summary-card">
                                        <div class="card-label">Total Discounts</div>
                                        <div class="card-value" id="totalDiscounts">₱0.00</div>
                                    </div>
                                </div>
                                <canvas id="salesReportChart" style="max-height: 300px;"></canvas>
                                <table id="salesReportTable" class="summary-table">
                                    <thead>
                                        <tr><th>Date</th><th>Transactions</th><th>Revenue</th><th>Discounts</th><th>Tax</th><th>Net Revenue</th></tr>
                                    </thead>
                                    <tbody></tbody>
                                </table>
                            </div>

                            <!-- Inventory Summary Tab -->
                            <div id="inventory-summary-tab" class="report-tab-content hidden">
                                <h3>📦 Inventory Summary</h3>
                                <div class="report-controls">
                                    <button onclick="generateInventorySummary()">Refresh Summary</button>
                                    <button onclick="exportReport('inventory')">Export CSV</button>
                                </div>
                                <div id="inventory-summary-cards" class="report-summary-cards">
                                    <div class="summary-card">
                                        <div class="card-label">Total Items</div>
                                        <div class="card-value" id="totalItems">0</div>
                                    </div>
                                    <div class="summary-card">
                                        <div class="card-label">Low Stock Items</div>
                                        <div class="card-value warning" id="lowStockItems">0</div>
                                    </div>
                                    <div class="summary-card">
                                        <div class="card-label">Out of Stock</div>
                                        <div class="card-value danger" id="outOfStockItems">0</div>
                                    </div>
                                    <div class="summary-card">
                                        <div class="card-label">Total Inventory Value</div>
                                        <div class="card-value" id="totalInventoryValue">₱0.00</div>
                                    </div>
                                </div>
                                <table id="inventorySummaryTable" class="summary-table">
                                    <thead>
                                        <tr><th>Item</th><th>Current Stock</th><th>Unit</th><th>Min/Max</th><th>Status</th><th>Value</th></tr>
                                    </thead>
                                    <tbody></tbody>
                                </table>
                            </div>

                            <!-- Item Velocity Tab -->
                            <div id="item-velocity-tab" class="report-tab-content hidden">
                                <h3>🔥 Fast-Moving & Slow-Moving Items</h3>
                                <div class="report-controls">
                                    <label>Analysis Period:</label>
                                    <select id="velocityPeriod" onchange="generateItemVelocity()">
                                        <option value="7">Last 7 Days</option>
                                        <option value="30" selected>Last 30 Days</option>
                                        <option value="90">Last 90 Days</option>
                                    </select>
                                    <button onclick="generateItemVelocity()">Analyze</button>
                                    <button onclick="exportReport('velocity')">Export CSV</button>
                                </div>
                                <div class="velocity-sections">
                                    <div class="velocity-section">
                                        <h4>🔥 Fast-Moving Items</h4>
                                        <table id="fastMovingTable" class="summary-table">
                                            <thead>
                                                <tr><th>Product</th><th>Total Sold</th><th>Revenue</th><th>Avg Daily Sales</th></tr>
                                            </thead>
                                            <tbody></tbody>
                                        </table>
                                    </div>
                                    <div class="velocity-section">
                                        <h4>🐌 Slow-Moving Items</h4>
                                        <table id="slowMovingTable" class="summary-table">
                                            <thead>
                                                <tr><th>Product</th><th>Total Sold</th><th>Revenue</th><th>Avg Daily Sales</th></tr>
                                            </thead>
                                            <tbody></tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <!-- Stock Aging Tab -->
                            <div id="stock-aging-tab" class="report-tab-content hidden">
                                <h3>⏰ Stock Aging Report</h3>
                                <div class="report-controls">
                                    <button onclick="generateStockAging()">Generate Report</button>
                                    <button onclick="exportReport('aging')">Export CSV</button>
                                </div>
                                <div class="aging-summary">
                                    <div class="summary-card">
                                        <div class="card-label">Fresh (0-30 days)</div>
                                        <div class="card-value" id="fresh30">0</div>
                                    </div>
                                    <div class="summary-card">
                                        <div class="card-label">Medium (31-60 days)</div>
                                        <div class="card-value warning" id="medium60">0</div>
                                    </div>
                                    <div class="summary-card">
                                        <div class="card-label">Old (61-90 days)</div>
                                        <div class="card-value danger" id="old90">0</div>
                                    </div>
                                    <div class="summary-card">
                                        <div class="card-label">Very Old (90+ days)</div>
                                        <div class="card-value danger" id="veryOld90">0</div>
                                    </div>
                                </div>
                                <table id="stockAgingTable" class="summary-table">
                                    <thead>
                                        <tr><th>Batch #</th><th>Item</th><th>Quantity</th><th>Received Date</th><th>Age (Days)</th><th>Status</th><th>Expiry</th></tr>
                                    </thead>
                                    <tbody></tbody>
                                </table>
                            </div>

                            <!-- Purchase History Tab -->
                            <div id="purchase-history-tab" class="report-tab-content hidden">
                                <h3>🛒 Purchase History</h3>
                                <div class="report-controls">
                                    <label>Period:</label>
                                    <select id="purchasePeriod" onchange="generatePurchaseHistory()">
                                        <option value="30">Last 30 Days</option>
                                        <option value="60">Last 60 Days</option>
                                        <option value="90">Last 90 Days</option>
                                        <option value="all">All Time</option>
                                    </select>
                                    <button onclick="generatePurchaseHistory()">Generate</button>
                                    <button onclick="exportReport('purchase')">Export CSV</button>
                                </div>
                                <div class="report-summary-cards">
                                    <div class="summary-card">
                                        <div class="card-label">Total Orders</div>
                                        <div class="card-value" id="totalPOs">0</div>
                                    </div>
                                    <div class="summary-card">
                                        <div class="card-label">Total Spent</div>
                                        <div class="card-value" id="totalSpent">₱0.00</div>
                                    </div>
                                    <div class="summary-card">
                                        <div class="card-label">Pending Orders</div>
                                        <div class="card-value warning" id="pendingPOs">0</div>
                                    </div>
                                </div>
                                <table id="purchaseHistoryTable" class="summary-table">
                                    <thead>
                                        <tr><th>PO #</th><th>Supplier</th><th>Order Date</th><th>Expected</th><th>Status</th><th>Amount</th><th>Items</th></tr>
                                    </thead>
                                    <tbody></tbody>
                                </table>
                            </div>

                            <!-- Profit & Loss Tab -->
                            <div id="profit-loss-tab" class="report-tab-content hidden">
                                <h3>💰 Profit & Loss Estimation</h3>
                                <div class="report-controls">
                                    <label>Report Period:</label>
                                    <select id="plPeriod" onchange="generateProfitLoss()">
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly" selected>Monthly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                    <input type="date" id="plStartDate" onchange="generateProfitLoss()">
                                    <input type="date" id="plEndDate" onchange="generateProfitLoss()">
                                    <button onclick="generateProfitLoss()">Generate</button>
                                    <button onclick="exportReport('profitloss')">Export CSV</button>
                                </div>
                                <div class="report-summary-cards">
                                    <div class="summary-card">
                                        <div class="card-label">Total Revenue</div>
                                        <div class="card-value" id="plRevenue">₱0.00</div>
                                    </div>
                                    <div class="summary-card">
                                        <div class="card-label">Cost of Goods</div>
                                        <div class="card-value" id="plCogs">₱0.00</div>
                                    </div>
                                    <div class="summary-card">
                                        <div class="card-label">Gross Profit</div>
                                        <div class="card-value success" id="plGrossProfit">₱0.00</div>
                                    </div>
                                    <div class="summary-card">
                                        <div class="card-label">Profit Margin</div>
                                        <div class="card-value success" id="plMargin">0%</div>
                                    </div>
                                </div>
                                <canvas id="profitLossChart" style="max-height: 300px;"></canvas>
                                <table id="profitLossTable" class="summary-table">
                                    <thead>
                                        <tr><th>Period</th><th>Revenue</th><th>COGS</th><th>Gross Profit</th><th>Margin %</th></tr>
                                    </thead>
                                    <tbody></tbody>
                                </table>
                            </div>

                            <!-- Shrinkage Tab -->
                            <div id="shrinkage-tab" class="report-tab-content hidden">
                                <h3>⚠️ Shrinkage & Discrepancy Report</h3>
                                <div class="report-controls">
                                    <label>Period:</label>
                                    <select id="shrinkagePeriod" onchange="generateShrinkageReport()">
                                        <option value="30">Last 30 Days</option>
                                        <option value="60">Last 60 Days</option>
                                        <option value="90">Last 90 Days</option>
                                    </select>
                                    <button onclick="generateShrinkageReport()">Analyze</button>
                                    <button onclick="exportReport('shrinkage')">Export CSV</button>
                                </div>
                                <div class="report-summary-cards">
                                    <div class="summary-card">
                                        <div class="card-label">Total Shrinkage Value</div>
                                        <div class="card-value danger" id="shrinkageValue">₱0.00</div>
                                    </div>
                                    <div class="summary-card">
                                        <div class="card-label">Items Affected</div>
                                        <div class="card-value" id="shrinkageItems">0</div>
                                    </div>
                                    <div class="summary-card">
                                        <div class="card-label">Shrinkage Rate</div>
                                        <div class="card-value warning" id="shrinkageRate">0%</div>
                                    </div>
                                </div>
                                <p class="report-note">⚠️ Shrinkage = Expected Stock - Actual Stock (due to theft, damage, waste, or errors)</p>
                                <table id="shrinkageTable" class="summary-table">
                                    <thead>
                                        <tr><th>Item</th><th>Expected Stock</th><th>Actual Stock</th><th>Difference</th><th>Value Loss</th><th>Last Audit</th></tr>
                                    </thead>
                                    <tbody></tbody>
                                </table>
                            </div>
                        </div>

                        <div id="staff-content" class="content-section hidden">
                            <!-- Modern Staff Management Dashboard -->
                            <div class="staff-dashboard">
                                <!-- Header -->
                                <div class="staff-header">
                                    <div class="staff-header-content">
                                        <div>
                                            <h1 class="staff-title">Staff Management</h1>
                                            <p class="staff-subtitle">Manage employee accounts and time records</p>
                                        </div>
                                        <button class="staff-add-btn" onclick="toggleForm('staffFormContainer')">
                                            <span>➕</span>
                                            <span>Add New Staff</span>
                                        </button>
                                    </div>
                                </div>

                                <!-- Add Staff Form -->
                                <div id="staffFormContainer" class="staff-form-container hidden">
                                    <div class="staff-form-card">
                                        <div class="staff-form-header">
                                            <h3>➕ Add New Staff Member</h3>
                                            <button class="staff-form-close" onclick="toggleForm('staffFormContainer')">✕</button>
                                        </div>
                                        <div class="staff-form-body">
                                            <div class="staff-form-grid staff-form-simple">
                                                <div class="staff-form-group">
                                                    <label class="staff-label">
                                                        <span class="staff-label-icon">👤</span>
                                                        Full Name
                                                    </label>
                                                    <input type="text" id="staffName" class="staff-input" placeholder="Name" required>
                                                    <div class="staff-input-hint">Employee's complete name</div>
                                                </div>

                                                <div class="staff-form-group">
                                                    <label class="staff-label">
                                                        <span class="staff-label-icon">💼</span>
                                                        Role / Position
                                                    </label>
                                                    <select id="staffRole" class="staff-input" required>
                                                        <option value="">Select Role</option>
                                                        <option value="Cashier">Cashier</option>
                                                        <option value="Barista">Barista</option>
                                                        <option value="Server">Server</option>
                                                        <option value="Kitchen Staff">Kitchen Staff</option>
                                                        <option value="Supervisor">Supervisor</option>
                                                        <option value="Manager">Manager</option>
                                                    </select>
                                                    <div class="staff-input-hint">Job position in the café</div>
                                                </div>

                                                <div class="staff-form-group staff-form-emp-number">
                                                    <label class="staff-label">
                                                        <span class="staff-label-icon">🔢</span>
                                                        Employee Number
                                                    </label>
                                                    <input type="text" id="staffEmployeeNumber" class="staff-input staff-input-large" placeholder="EMP001" required maxlength="20" pattern="[A-Za-z0-9]+">
                                                    <div class="staff-input-hint staff-hint-important">
                                                        <span class="hint-icon">💡</span>
                                                        <span>This unique ID will be used for employee time tracking (e.g., EMP001, EMP002)</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div class="staff-form-actions">
                                                <button class="staff-btn staff-btn-primary" onclick="addStaff()">
                                                    <span>➕</span>
                                                    <span>Add Staff Member</span>
                                                </button>
                                                <button class="staff-btn staff-btn-secondary" onclick="toggleForm('staffFormContainer')">
                                                    <span>✕</span>
                                                    <span>Cancel</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Staff Accounts Section -->
                                <div class="staff-section">
                                    <div class="staff-section-header">
                                        <h2 class="staff-section-title">
                                            <span class="staff-section-icon">👥</span>
                                            Active Staff Accounts
                                        </h2>
                                        <div class="staff-stats">
                                            <div class="staff-stat-badge staff-stat-total">
                                                <span class="staff-stat-value" id="total-staff-count">0</span>
                                                <span class="staff-stat-label">Total Staff</span>
                                            </div>
                                            <div class="staff-stat-badge staff-stat-active">
                                                <span class="staff-stat-value" id="active-staff-count">0</span>
                                                <span class="staff-stat-label">Clocked In Today</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="staff-table-container">
                                        <table id="staff" class="staff-table">
                                            <thead>
                                                <tr>
                                                    <th><span class="th-icon">🔢</span> Employee #</th>
                                                    <th><span class="th-icon">👤</span> Name</th>
                                                    <th><span class="th-icon">💼</span> Role / Position</th>
                                                    <th><span class="th-icon">⚙️</span> Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr class="staff-empty-row">
                                                    <td colspan="4">
                                                        <div class="staff-empty-state">
                                                            <div class="staff-empty-icon">👥</div>
                                                            <h3>No Staff Members Yet</h3>
                                                            <p>Click "Add New Staff" to create your first employee account</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <!-- Timekeeping Records Section -->
                                <div class="staff-section">
                                    <div class="staff-section-header">
                                        <h2 class="staff-section-title">
                                            <span class="staff-section-icon">🕒</span>
                                            Today's Timekeeping Records
                                        </h2>
                                        <div class="staff-filter-buttons">
                                            <button class="staff-filter-btn active" onclick="filterTimekeeping('today')">Today</button>
                                            <button class="staff-filter-btn" onclick="filterTimekeeping('week')">This Week</button>
                                            <button class="staff-filter-btn" onclick="filterTimekeeping('month')">This Month</button>
                                        </div>
                                    </div>

                                    <div class="staff-table-container">
                                        <table id="timekeepingRecordsTable" class="staff-table">
                                            <thead>
                                                <tr>
                                                    <th><span class="th-icon">📅</span> Date</th>
                                                    <th><span class="th-icon">👤</span> Name</th>
                                                    <th><span class="th-icon">💼</span> Role</th>
                                                    <th><span class="th-icon">⏰</span> Time In</th>
                                                    <th><span class="th-icon">🏁</span> Time Out</th>
                                                    <th><span class="th-icon">⏱️</span> Hours Worked</th>
                                                    <th><span class="th-icon">📊</span> Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr class="staff-empty-row">
                                                    <td colspan="7">
                                                        <div class="staff-empty-state">
                                                            <div class="staff-empty-icon">🕒</div>
                                                            <h3>No Records Today</h3>
                                                            <p>Employee time records will appear here once they clock in</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div id="sales-content" class="content-section hidden">
                            <!-- Modern Sales Dashboard -->
                            <div class="sales-dashboard">
                                <!-- Header -->
                                <div class="sales-header">
                                    <h1 class="sales-title"><strong>Sales Analysis</strong> Dashboard</h1>

                                    <!-- Filters -->
                                    <div class="sales-filters">
                                        <div class="sales-filter-group">
                                            <label class="sales-filter-label">Period</label>
                                            <select id="sales-period-filter" class="sales-filter-select">
                                                <option value="daily">Daily</option>
                                                <option value="weekly">Weekly</option>
                                                <option value="monthly" selected>Monthly</option>
                                                <option value="quarterly">Quarterly</option>
                                                <option value="yearly">Yearly</option>
                                            </select>
                                        </div>

                                        <div class="sales-filter-group">
                                            <label class="sales-filter-label">Year</label>
                                            <select id="sales-year-filter" class="sales-filter-select">
                                                <option value="2023">2023</option>
                                                <option value="2024">2024</option>
                                                <option value="2025" selected>2025</option>
                                            </select>
                                        </div>

                                        <div class="sales-filter-group">
                                            <label class="sales-filter-label">Month</label>
                                            <select id="sales-month-filter" class="sales-filter-select">
                                                <option value="1">January</option>
                                                <option value="2">February</option>
                                                <option value="3">March</option>
                                                <option value="4">April</option>
                                                <option value="5">May</option>
                                                <option value="6">June</option>
                                                <option value="7">July</option>
                                                <option value="8">August</option>
                                                <option value="9">September</option>
                                                <option value="10">October</option>
                                                <option value="11">November</option>
                                                <option value="12">December</option>
                                            </select>
                                        </div>

                                        <div class="sales-filter-group">
                                            <label class="sales-filter-label">Quarter</label>
                                            <select id="sales-quarter-filter" class="sales-filter-select">
                                                <option value="1">Q1</option>
                                                <option value="2">Q2</option>
                                                <option value="3">Q3</option>
                                                <option value="4">Q4</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <!-- KPI Cards -->
                                <div class="sales-kpi-grid">
                                    <div class="sales-kpi-card">
                                        <div class="sales-kpi-header">
                                            <span class="sales-kpi-title">Total Sales</span>
                                            <span class="sales-kpi-icon">💰</span>
                                        </div>
                                        <h2 class="sales-kpi-value" id="total-sales-value">₱0</h2>
                                        <div class="sales-kpi-change positive" id="total-sales-change">
                                            <span>↑ 0% vs last period</span>
                                        </div>
                                    </div>

                                    <div class="sales-kpi-card success">
                                        <div class="sales-kpi-header">
                                            <span class="sales-kpi-title">Total Orders</span>
                                            <span class="sales-kpi-icon">📦</span>
                                        </div>
                                        <h2 class="sales-kpi-value" id="total-orders-value">0</h2>
                                        <div class="sales-kpi-change positive" id="total-orders-change">
                                            <span>↑ 0% vs last period</span>
                                        </div>
                                    </div>

                                    <div class="sales-kpi-card info">
                                        <div class="sales-kpi-header">
                                            <span class="sales-kpi-title">Quantity Sold</span>
                                            <span class="sales-kpi-icon">📊</span>
                                        </div>
                                        <h2 class="sales-kpi-value" id="quantity-sold-value">0</h2>
                                        <div class="sales-kpi-change positive" id="quantity-sold-change">
                                            <span>↑ 0% vs last period</span>
                                        </div>
                                    </div>

                                    <div class="sales-kpi-card warning">
                                        <div class="sales-kpi-header">
                                            <span class="sales-kpi-title">Avg Order Value</span>
                                            <span class="sales-kpi-icon">🎯</span>
                                        </div>
                                        <h2 class="sales-kpi-value" id="avg-order-value-value">₱0</h2>
                                        <div class="sales-kpi-change neutral" id="avg-order-value-change">
                                            <span>Average per transaction</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Charts Grid Row 1 -->
                                <div class="sales-chart-grid">
                                    <!-- Sales Trends Over Time -->
                                    <div class="sales-chart-card span-8">
                                        <div class="sales-chart-header">
                                            <div>
                                                <h3 class="sales-chart-title">Sales Trends Over Time</h3>
                                                <p class="sales-chart-subtitle">Actual vs Planned Sales</p>
                                            </div>
                                        </div>
                                        <div class="sales-chart-container">
                                            <canvas id="sales-trend-chart"></canvas>
                                        </div>
                                    </div>

                                    <!-- Quarterly Performance -->
                                    <div class="sales-chart-card span-4">
                                        <div class="sales-chart-header">
                                            <div>
                                                <h3 class="sales-chart-title">Quarterly Sales</h3>
                                                <p class="sales-chart-subtitle">Year 2025 Performance</p>
                                            </div>
                                        </div>
                                        <div class="sales-chart-container">
                                            <canvas id="quarterly-chart"></canvas>
                                        </div>
                                    </div>
                                </div>

                                <!-- Charts Grid Row 2 -->
                                <div class="sales-chart-grid">
                                    <!-- Sales by Category -->
                                    <div class="sales-chart-card span-4">
                                        <div class="sales-chart-header">
                                            <div>
                                                <h3 class="sales-chart-title">Sales by Product Category</h3>
                                                <p class="sales-chart-subtitle">Revenue Distribution</p>
                                            </div>
                                        </div>
                                        <div class="sales-chart-container">
                                            <canvas id="category-chart"></canvas>
                                        </div>
                                    </div>

                                    <!-- Weekday vs Weekend -->
                                    <div class="sales-chart-card span-4">
                                        <div class="sales-chart-header">
                                            <div>
                                                <h3 class="sales-chart-title">Weekday vs Weekend</h3>
                                                <p class="sales-chart-subtitle">Sales Comparison</p>
                                            </div>
                                        </div>
                                        <div class="sales-chart-container">
                                            <canvas id="weekday-weekend-chart"></canvas>
                                        </div>
                                    </div>

                                    <!-- Sales by Location -->
                                    <div class="sales-chart-card span-4">
                                        <div class="sales-chart-header">
                                            <div>
                                                <h3 class="sales-chart-title">Sales & Profit by Location</h3>
                                                <p class="sales-chart-subtitle">Store Performance</p>
                                            </div>
                                        </div>
                                        <div class="sales-chart-container">
                                            <canvas id="location-chart"></canvas>
                                        </div>
                                    </div>
                                </div>

                                <!-- Charts Grid Row 3 -->
                                <div class="sales-chart-grid">
                                    <!-- Best Sellers Table -->
                                    <div class="sales-chart-card span-6">
                                        <div class="sales-chart-header">
                                            <div>
                                                <h3 class="sales-chart-title">Top 10 Best Sellers</h3>
                                                <p class="sales-chart-subtitle">Ranked by Revenue</p>
                                            </div>
                                        </div>
                                        <div class="sales-table-container">
                                            <table class="sales-table">
                                                <thead>
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Product</th>
                                                        <th>Category</th>
                                                        <th>Qty</th>
                                                        <th>Revenue</th>
                                                    </tr>
                                                </thead>
                                                <tbody id="best-sellers-tbody">
                                                    <tr>
                                                        <td colspan="5" class="sales-empty">
                                                            <div class="sales-empty-icon">📊</div>
                                                            <div class="sales-empty-text">Loading data...</div>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <!-- Heatmap -->
                                    <div class="sales-chart-card span-6">
                                        <div class="sales-chart-header">
                                            <div>
                                                <h3 class="sales-chart-title">Sales Heatmap by Day & Hour</h3>
                                                <p class="sales-chart-subtitle">Peak hours visualization</p>
                                            </div>
                                        </div>
                                        <div id="heatmap-container" style="padding-top: 20px;">
                                            <div class="sales-empty">
                                                <div class="sales-empty-icon">🔥</div>
                                                <div class="sales-empty-text">Loading heatmap...</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
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

                    <!-- Product Form Modal -->
                    <div id="productModalOverlay" class="product-modal-overlay" onclick="closeProductModalOnOverlay(event)">
                        <div class="product-modal" onclick="event.stopPropagation()">
                            <div class="product-modal-header">
                                <h2 id="productModalTitle">Add New Product</h2>
                                <button class="product-modal-close" onclick="closeProductModal()">&times;</button>
                            </div>
                            <div class="product-modal-body">
                                <div id="menuFormContainer" class="menu-form">
                                    <div class="menu-form-layout">
                                        <!-- Left Column: Product Info & Recipe -->
                                        <div class="menu-form-left">
                                            <h4>📝 Product Information</h4>
                                            <div class="form-grid">
                                                <input type="text" id="newItemName" placeholder="Product Name *" required>
                                                <select id="newItemCategory" required>
                                                    <option value="">Select Category *</option>
                                                </select>
                                                <input type="number" id="newItemPrice" placeholder="Selling Price *" step="0.01" min="0" required>
                                                <input type="file" id="newItemImage" accept="image/*">
                                            </div>

                                            <h4>🧾 Recipe / Ingredients</h4>
                                            <div id="recipeIngredientsContainer" class="recipe-ingredients-section">
                                                <div class="ingredients-list" id="ingredientsList">
                                                    <p class="ingredients-empty">No ingredients added yet. Add ingredients using the form below.</p>
                                                </div>
                                                <div class="add-ingredient-form">
                                                    <select id="ingredientSelect">
                                                        <option value="">-- Select Ingredient --</option>
                                                    </select>
                                                    <input type="number" id="ingredientQuantity" placeholder="Qty" step="0.01" min="0">
                                                    <input type="text" id="ingredientUnit" placeholder="Unit (g, ml, pcs)">
                                                    <input type="number" id="ingredientCost" placeholder="Cost/Unit" step="0.0001" min="0">
                                                    <button type="button" onclick="addIngredientToProduct()" class="btn-add-ingredient">+ Add Ingredient</button>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Right Column: Cost & Profitability -->
                                        <div class="menu-form-right">
                                            <h4>💰 Cost & Profitability (Auto-calculated)</h4>
                                            <div class="profitability-preview">
                                                <div class="profit-row">
                                                    <label>Total Cost:</label>
                                                    <span id="previewCost" class="profit-value">₱0.00</span>
                                                </div>
                                                <div class="profit-row">
                                                    <label>Selling Price:</label>
                                                    <span id="previewPrice" class="profit-value">₱0.00</span>
                                                </div>
                                                <div class="profit-row">
                                                    <label>Gross Profit:</label>
                                                    <span id="previewProfit" class="profit-value">₱0.00</span>
                                                </div>
                                                <div class="profit-row">
                                                    <label>Profit Margin:</label>
                                                    <span id="previewMargin" class="profit-value">0%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="form-actions">
                                        <button onclick="saveProduct()" class="btn-primary" id="saveProductBtn">Add Product</button>
                                        <button onclick="closeProductModal()" class="btn-secondary">Cancel</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
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
                            <div class="search-bar-container">
                                <input type="text" id="product-search" placeholder="Search product by name or scan barcode..." onkeyup="searchProduct(event)">
                            </div>
                            <div class="order-form">
                                <label>Drink:<input type="text" id="drinkName" placeholder="Select a drink" readonly /></label>
                                <label>Qty:</label>
                                <input type="number" id="drinkQty" placeholder="0" min="1" step="1" />
                                <input type="hidden" id="drinkPrice" />
                                <input type="hidden" id="drinkProductId" />
                                <button onclick="addOrder()">Add Order</button>
                                <button onclick="clearOrder()">Clear All</button>
                                <button onclick="checkOut()">Checkout</button>
                            </div>
                            <ul id="orderList" class="order-list"></ul>

                            <!-- Discount Type Selection -->
                            <div class="discount-selector-container">
                                <h4 class="discount-section-title">💳 Customer Discount Type</h4>
                                <div class="discount-buttons-grid">
                                    <button class="discount-btn active" data-type="none" data-rate="0" onclick="selectDiscountType('none', 0, 'No Discount')">
                                        <span class="discount-icon">⚪</span>
                                        <span class="discount-name">No Discount</span>
                                        <span class="discount-rate">0%</span>
                                    </button>
                                    <button class="discount-btn" data-type="senior" data-rate="20" onclick="selectDiscountType('senior', 20, 'Senior Citizen')">
                                        <span class="discount-icon">👴</span>
                                        <span class="discount-name">Senior Citizen</span>
                                        <span class="discount-rate">20%</span>
                                    </button>
                                    <button class="discount-btn" data-type="pwd" data-rate="20" onclick="selectDiscountType('pwd', 20, 'PWD')">
                                        <span class="discount-icon">♿</span>
                                        <span class="discount-name">PWD</span>
                                        <span class="discount-rate">20%</span>
                                    </button>
                                    <button class="discount-btn" data-type="athlete" data-rate="20" onclick="selectDiscountType('athlete', 20, 'National Athlete')">
                                        <span class="discount-icon">🏅</span>
                                        <span class="discount-name">Athlete</span>
                                        <span class="discount-rate">20%</span>
                                    </button>
                                </div>
                            </div>

                            <!-- Order Summary with VAT Breakdown -->
                            <div class="order-summary-box">
                                <div class="summary-line-divider"></div>
                                <div class="summary-line total-line">
                                    <span class="order-total-label">TOTAL:</span>
                                    <span class="order-total-amount">₱<span id="orderTotal">0.00</span></span>
                                </div>
                            </div>
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
                                        <div class="receipt-header">
                                            <h4>Jowen's Kitchen & Cafe</h4>
                                            <p class="receipt-subtitle">Tax Invoice / Official Receipt</p>
                                        </div>
                                        <div class="receipt-divider">════════════════════════════════</div>
                                        <p class="receipt-info">Date: <span id="receipt-date"></span></p>
                                        <p class="receipt-info">Receipt #: <span id="receipt-ordernumber"></span></p>
                                        <p class="receipt-info">Cashier: <span id="receipt-cashier"><?= htmlspecialchars($currentUsername) ?></span></p>
                                        <p class="receipt-info" id="receipt-discount-type-line" style="display: none;">Customer Type: <span id="receipt-discount-type" class="receipt-highlight"></span></p>
                                        <div class="receipt-divider">════════════════════════════════</div>

                                        <div id="receipt-items"></div>

                                        <div class="receipt-divider">────────────────────────────────</div>
                                        <div class="receipt-summary">
                                            <div class="receipt-line">
                                                <span>Subtotal:</span>
                                                <span>₱<span id="receipt-subtotal">0.00</span></span>
                                            </div>
                                            <div class="receipt-line" id="receipt-discount-line" style="display: none;">
                                                <span>Discount (<span id="receipt-discount-label"></span>):</span>
                                                <span class="discount-text">-₱<span id="receipt-discount">0.00</span></span>
                                            </div>
                                        </div>
                                        <div class="receipt-divider">────────────────────────────────</div>

                                        <div class="receipt-vat-breakdown">
                                            <p class="vat-breakdown-title">VAT Breakdown:</p>
                                            <div class="receipt-line vat-line">
                                                <span>  Vatable Sales:</span>
                                                <span>₱<span id="receipt-vatable">0.00</span></span>
                                            </div>
                                            <div class="receipt-line vat-line">
                                                <span>  VAT-Exempt Sales:</span>
                                                <span>₱<span id="receipt-vat-exempt">0.00</span></span>
                                            </div>
                                            <div class="receipt-line vat-line">
                                                <span>  VAT (12%):</span>
                                                <span>₱<span id="receipt-vat">0.00</span></span>
                                            </div>
                                        </div>

                                        <div class="receipt-divider">────────────────────────────────</div>
                                        <div class="receipt-total-line">
                                            <span class="receipt-total-label">TOTAL:</span>
                                            <span class="receipt-total-amount">₱<span id="receipt-total">0.00</span></span>
                                        </div>
                                        <div class="receipt-divider">════════════════════════════════</div>

                                        <div class="receipt-payment" id="receipt-payment-section" style="display: none;">
                                            <div class="receipt-line">
                                                <span>Payment:</span>
                                                <span id="receipt-payment-method">Cash</span>
                                            </div>
                                            <div class="receipt-line">
                                                <span>Tendered:</span>
                                                <span>₱<span id="receipt-tendered">0.00</span></span>
                                            </div>
                                            <div class="receipt-line">
                                                <span>Change:</span>
                                                <span>₱<span id="receipt-change">0.00</span></span>
                                            </div>
                                        </div>

                                        <div class="receipt-divider">════════════════════════════════</div>
                                        <div class="receipt-footer">
                                            <p>Thank you for your purchase!</p>
                                            <p class="receipt-tin">VAT Reg TIN: 123-456-789-000</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div id="daily-content" class="content-section hidden">
                            <div class="dashboard-header">
                                <h1>Daily Summary</h1>
                                <div class="report-buttons">
                                    <button onclick="generateXRead()">📄 X-Read Report</button>
                                    <button onclick="generateZRead()">📊 Z-Read Report</button>
                                </div>
                            </div>
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

                    </main>
                </div>
            </section>
        <?php endif; ?>
    </div>

    <!-- Barcode Scanner Modal -->
    <div id="barcode-scan-modal" class="modal-overlay hidden">
        <div class="modal-content barcode-modal">
            <div class="modal-header">
                <h3>📷 Scan Barcode</h3>
                <button onclick="closeBarcodeScanModal()" class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="barcode-scanner-container">
                    <video id="barcode-video" width="100%" autoplay></video>
                    <canvas id="barcode-canvas" class="hidden"></canvas>
                </div>
                <div class="barcode-manual-entry">
                    <p>Or enter barcode manually:</p>
                    <input type="text" id="manual-barcode-input" placeholder="Enter barcode number" onkeypress="if(event.key==='Enter') searchByBarcode()">
                    <button onclick="searchByBarcode()" class="btn-primary">Search</button>
                </div>
                <div id="barcode-result" class="barcode-result hidden"></div>
            </div>
        </div>
    </div>

    <!-- Quick Stock Adjustment Modal -->
    <div id="quick-adjust-modal" class="modal-overlay hidden">
        <div class="modal-content quick-adjust-modal">
            <div class="modal-header">
                <h3>⚡ Quick Stock Adjustment</h3>
                <button onclick="closeQuickAdjustModal()" class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div id="quick-adjust-item-info" class="item-info-display"></div>
                <div class="adjustment-controls">
                    <button onclick="quickAdjust(-10)" class="adjust-btn large-decrease">-10</button>
                    <button onclick="quickAdjust(-1)" class="adjust-btn decrease">-1</button>
                    <input type="number" id="quick-adjust-qty" class="adjust-input" value="0" step="0.01">
                    <button onclick="quickAdjust(1)" class="adjust-btn increase">+1</button>
                    <button onclick="quickAdjust(10)" class="adjust-btn large-increase">+10</button>
                </div>
                <div class="adjustment-type">
                    <label>Reason:</label>
                    <select id="quick-adjust-reason">
                        <option value="stock-in">Stock In</option>
                        <option value="stock-out">Stock Out</option>
                        <option value="adjustment">Adjustment</option>
                        <option value="damaged">Damaged/Spoiled</option>
                        <option value="return">Return</option>
                    </select>
                </div>
                <textarea id="quick-adjust-notes" placeholder="Additional notes (optional)"></textarea>
                <div class="modal-actions">
                    <button onclick="saveQuickAdjustment()" class="btn-primary">Save Changes</button>
                    <button onclick="closeQuickAdjustModal()" class="btn-secondary">Cancel</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        window.initialData = <?= json_encode($initialData, JSON_UNESCAPED_UNICODE) ?>;
        window.currentUserRole = <?= json_encode($currentRole) ?>;
        window.currentUsername = <?= json_encode($_SESSION['username'] ?? '') ?>;
    </script>
    <script defer src="script.js?v=3.0"></script>
    <script defer src="js/discount-vat-system.js"></script>
    <script defer src="js/recipe-management.js"></script>
    <script defer src="js/inventify-inventory.js"></script>
    <script defer src="js/home-dashboard.js"></script>
    <script defer src="js/sales-dashboard.js"></script>
    <script defer src="js/timekeeping.js"></script>
</body>
</html>
