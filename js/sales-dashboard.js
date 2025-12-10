/**
 * Modern Sales Dashboard JavaScript
 * Power BI-inspired Sales Analysis for Coffee Shop
 */

let salesCharts = {};
let salesData = {};
let currentFilters = {
    selectedDate: new Date(),
    dateRange: 'month', // day, week, month, quarter, year
    startDate: null,
    endDate: null
};

/**
 * Initialize Sales Dashboard
 */
function initializeSalesDashboard() {
    console.log('Initializing Sales Dashboard...');
    loadSalesData();
    setupEventListeners();
}

/**
 * Setup Event Listeners
 */
function setupEventListeners() {
    // Initialize date picker with current date
    const datePicker = document.getElementById('sales-date-filter');
    if (datePicker) {
        const today = new Date();
        datePicker.value = today.toISOString().split('T')[0];
        currentFilters.selectedDate = today;

        // Apply "This Month" as default
        applyQuickFilter('this-month');
    }
}

/**
 * Update filters when date is selected from calendar
 */
function updateFiltersFromDate() {
    const datePicker = document.getElementById('sales-date-filter');
    const rangeFilter = document.getElementById('sales-range-filter');

    if (datePicker && datePicker.value) {
        currentFilters.selectedDate = new Date(datePicker.value);
        currentFilters.dateRange = rangeFilter ? rangeFilter.value : 'month';

        // Calculate date range based on selected date and range type
        calculateDateRange();

        // Reset quick select to custom
        const quickFilter = document.getElementById('sales-quick-filter');
        if (quickFilter) {
            quickFilter.value = '';
        }

        loadSalesData();
    }
}

/**
 * Update date range type (day, week, month, quarter, year)
 */
function updateDateRange() {
    const rangeFilter = document.getElementById('sales-range-filter');
    if (rangeFilter) {
        currentFilters.dateRange = rangeFilter.value;
        calculateDateRange();
        loadSalesData();
    }
}

/**
 * Apply quick filter shortcuts
 */
function applyQuickFilter(value) {
    const quickFilter = document.getElementById('sales-quick-filter');
    const datePicker = document.getElementById('sales-date-filter');
    const rangeFilter = document.getElementById('sales-range-filter');

    // If called with parameter, use it; otherwise get from dropdown
    const filterValue = value || (quickFilter ? quickFilter.value : 'this-month');

    if (!filterValue) return;

    const today = new Date();
    let targetDate = new Date();
    let range = 'month';

    switch(filterValue) {
        case 'today':
            targetDate = today;
            range = 'day';
            break;
        case 'yesterday':
            targetDate = new Date(today);
            targetDate.setDate(today.getDate() - 1);
            range = 'day';
            break;
        case 'this-week':
            targetDate = today;
            range = 'week';
            break;
        case 'last-week':
            targetDate = new Date(today);
            targetDate.setDate(today.getDate() - 7);
            range = 'week';
            break;
        case 'this-month':
            targetDate = today;
            range = 'month';
            break;
        case 'last-month':
            targetDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            range = 'month';
            break;
        case 'this-quarter':
            targetDate = today;
            range = 'quarter';
            break;
        case 'this-year':
            targetDate = today;
            range = 'year';
            break;
    }

    // Update UI
    if (datePicker) {
        datePicker.value = targetDate.toISOString().split('T')[0];
    }
    if (rangeFilter) {
        rangeFilter.value = range;
    }

    // Update filters and reload
    currentFilters.selectedDate = targetDate;
    currentFilters.dateRange = range;
    calculateDateRange();
    loadSalesData();
}

/**
 * Calculate start and end dates based on selected date and range
 */
function calculateDateRange() {
    const date = currentFilters.selectedDate;
    const range = currentFilters.dateRange;

    let startDate, endDate;

    switch(range) {
        case 'day':
            startDate = new Date(date);
            endDate = new Date(date);
            break;

        case 'week':
            // Start from Monday
            startDate = new Date(date);
            const day = startDate.getDay();
            const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
            startDate.setDate(diff);
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            break;

        case 'month':
            startDate = new Date(date.getFullYear(), date.getMonth(), 1);
            endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            break;

        case 'quarter':
            const quarter = Math.floor(date.getMonth() / 3);
            startDate = new Date(date.getFullYear(), quarter * 3, 1);
            endDate = new Date(date.getFullYear(), quarter * 3 + 3, 0);
            break;

        case 'year':
            startDate = new Date(date.getFullYear(), 0, 1);
            endDate = new Date(date.getFullYear(), 11, 31);
            break;
    }

    currentFilters.startDate = startDate;
    currentFilters.endDate = endDate;
}

/**
 * Load Sales Data
 */
async function loadSalesData() {
    try {
        showSalesLoading();

        // Calculate date range if not already done
        if (!currentFilters.startDate || !currentFilters.endDate) {
            calculateDateRange();
        }

        // Format dates for API
        const formatDate = (date) => {
            return date.toISOString().split('T')[0];
        };

        // Fetch real data from API with date range
        const params = new URLSearchParams({
            start_date: formatDate(currentFilters.startDate),
            end_date: formatDate(currentFilters.endDate),
            date_range: currentFilters.dateRange
        });

        // Fetch all data in parallel
        const [kpis, trend, categories, quarterly, weekday, bestSellers, heatmap, productRange, timePeriod, summary] = await Promise.all([
            fetch(`php/sales-analytics-api.php?action=get_kpis&${params}`).then(r => r.json()),
            fetch(`php/sales-analytics-api.php?action=get_sales_trend&${params}`).then(r => r.json()),
            fetch(`php/sales-analytics-api.php?action=get_category_sales&${params}`).then(r => r.json()),
            fetch(`php/sales-analytics-api.php?action=get_quarterly_sales&${params}`).then(r => r.json()),
            fetch(`php/sales-analytics-api.php?action=get_weekday_sales&${params}`).then(r => r.json()),
            fetch(`php/sales-analytics-api.php?action=get_best_sellers&${params}`).then(r => r.json()),
            fetch(`php/sales-analytics-api.php?action=get_heatmap&${params}`).then(r => r.json()),
            fetch(`php/sales-analytics-api.php?action=get_product_range_analysis&${params}`).then(r => r.json()),
            fetch(`php/sales-analytics-api.php?action=get_time_period_comparison&${params}`).then(r => r.json()),
            fetch(`php/sales-analytics-api.php?action=get_sales_summary&${params}`).then(r => r.json())
        ]);

        // Store data
        salesData = {
            kpis: kpis.success ? kpis.kpis : {},
            trend: trend.success ? trend.data : [],
            categories: categories.success ? categories.data : [],
            quarterly: quarterly.success ? quarterly.data : [],
            weekdayWeekend: weekday.success ? weekday.data : { weekday: { sales: 0, orders: 0 }, weekend: { sales: 0, orders: 0 } },
            locationBreakdown: [{ location: 'Main Store', sales: 0, profit: 0 }],
            bestSellers: bestSellers.success ? bestSellers.data : [],
            heatmap: heatmap.success ? heatmap.data : [],
            productRange: productRange.success ? productRange.data : [],
            timePeriod: timePeriod.success ? timePeriod.data : [],
            periodType: timePeriod.success ? timePeriod.period_type : 'month',
            summary: summary.success ? summary.data : null
        };

        console.log('Sales data loaded:', salesData);

        renderSalesSummary();
        updateKPIs();
        renderAllCharts();
        renderBestSellersTable();
        renderHeatmap();

        hideSalesLoading();
    } catch (error) {
        console.error('Error loading sales data:', error);
        hideSalesLoading();
        showError('Failed to load sales data. Please try again.');
    }
}

/**
 * Generate Sample Sales Data
 */
function generateSampleSalesData() {
    const categories = ['Coffee', 'Pastries', 'Sandwiches', 'Beverages', 'Desserts'];
    const locations = ['Main Store', 'Branch A', 'Branch B', 'Branch C'];
    const products = [
        'Americano', 'Cappuccino', 'Latte', 'Mocha', 'Espresso',
        'Croissant', 'Muffin', 'Danish', 'Bagel',
        'Club Sandwich', 'BLT', 'Tuna Sandwich',
        'Iced Tea', 'Smoothie', 'Frappe',
        'Cheesecake', 'Brownie', 'Cookie'
    ];

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    return {
        totalSales: 1847250,
        totalOrders: 3542,
        quantitySold: 8934,
        averageOrderValue: 521.50,

        monthlyTrend: generateMonthlyTrend(),
        quarterlyData: generateQuarterlyData(),
        categoryBreakdown: generateCategoryData(categories),
        locationBreakdown: generateLocationData(locations),
        weekdayWeekend: generateWeekdayWeekendData(),
        bestSellers: generateBestSellers(products),
        heatmapData: generateHeatmapData(days),

        previousPeriodSales: 1654320,
        previousPeriodOrders: 3201,
        previousPeriodQuantity: 7892
    };
}

function generateMonthlyTrend() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month, index) => ({
        month,
        actual: Math.floor(Math.random() * 100000) + 120000,
        plan: 150000 + (index * 5000),
        year: currentFilters.year
    }));
}

function generateQuarterlyData() {
    return [
        { quarter: 'Q1', sales: 450000, orders: 2800, avgOrder: 160.71 },
        { quarter: 'Q2', sales: 520000, orders: 3100, avgOrder: 167.74 },
        { quarter: 'Q3', sales: 480000, orders: 2950, avgOrder: 162.71 },
        { quarter: 'Q4', sales: 397250, orders: 2692, avgOrder: 147.58 }
    ];
}

function generateCategoryData(categories) {
    return categories.map(cat => ({
        category: cat,
        sales: Math.floor(Math.random() * 400000) + 200000,
        quantity: Math.floor(Math.random() * 2000) + 1000,
        margin: Math.floor(Math.random() * 30) + 40
    }));
}

function generateLocationData(locations) {
    return locations.map(loc => ({
        location: loc,
        sales: Math.floor(Math.random() * 500000) + 300000,
        profit: Math.floor(Math.random() * 150000) + 100000
    }));
}

function generateWeekdayWeekendData() {
    return {
        weekday: {
            sales: 1200000,
            orders: 2400,
            avgOrder: 500
        },
        weekend: {
            sales: 647250,
            orders: 1142,
            avgOrder: 567
        }
    };
}

function generateBestSellers(products) {
    return products.map((product, index) => ({
        rank: index + 1,
        product,
        category: index < 5 ? 'Coffee' : index < 9 ? 'Pastries' : index < 12 ? 'Sandwiches' : index < 15 ? 'Beverages' : 'Desserts',
        quantity: Math.floor(Math.random() * 500) + 200,
        revenue: Math.floor(Math.random() * 50000) + 20000
    })).sort((a, b) => b.revenue - a.revenue);
}

function generateHeatmapData(days) {
    const heatmap = {};
    days.forEach(day => {
        heatmap[day] = [];
        for (let hour = 0; hour < 24; hour++) {
            const isBusinessHour = hour >= 7 && hour <= 20;
            const isPeakHour = (hour >= 8 && hour <= 10) || (hour >= 12 && hour <= 14) || (hour >= 16 && hour <= 18);
            let sales = 0;

            if (isBusinessHour) {
                sales = isPeakHour ? Math.floor(Math.random() * 30000) + 20000 : Math.floor(Math.random() * 15000) + 5000;
            }

            heatmap[day].push(sales);
        }
    });
    return heatmap;
}

/**
 * Update KPI Cards
 */
function updateKPIs() {
    const kpis = salesData.kpis || {};

    // Total Sales
    updateKPI('total-sales', formatCurrency(kpis.total_sales || 0), kpis.sales_change || 0, kpis.sales_change > 0);

    // Total Orders
    updateKPI('total-orders', formatNumber(kpis.total_orders || 0), kpis.orders_change || 0, kpis.orders_change > 0);

    // Quantity Sold
    updateKPI('quantity-sold', formatNumber(kpis.quantity_sold || 0), kpis.quantity_change || 0, kpis.quantity_change > 0);

    // Average Order Value
    updateKPI('avg-order-value', formatCurrency(kpis.avg_order_value || 0), null, null);
}

function updateKPI(id, value, change, isPositive) {
    const valueEl = document.getElementById(`${id}-value`);
    const changeEl = document.getElementById(`${id}-change`);

    if (valueEl) valueEl.textContent = value;

    if (changeEl && change !== null) {
        const arrow = isPositive ? '↑' : '↓';
        changeEl.textContent = `${arrow} ${Math.abs(change)}% vs last period`;
        changeEl.className = `sales-kpi-change ${isPositive ? 'positive' : 'negative'}`;
    }
}

/**
 * Render All Charts
 */
function renderAllCharts() {
    renderSalesTrendChart();
    renderCategoryChart();
    renderLocationChart();
    renderWeekdayWeekendChart();
    renderQuarterlyChart();
    renderProductRangeChart();
}

/**
 * Sales Trend Over Time Chart
 */
function renderSalesTrendChart() {
    const canvas = document.getElementById('sales-trend-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const container = canvas.closest('.sales-chart-container');

    if (salesCharts.trend) {
        salesCharts.trend.destroy();
    }

    // Use time period data if available, otherwise fall back to trend data
    const data = (salesData.timePeriod && salesData.timePeriod.length > 0) ? salesData.timePeriod : salesData.trend;

    if (!data || data.length === 0) {
        if (container) {
            container.innerHTML = '<div class="sales-empty"><div class="sales-empty-icon">📉</div><div class="sales-empty-title">No sales data found</div><div class="sales-empty-text">Make a sale to see the trend.</div></div>';
        }
        return;
    } else if (container && container.querySelector('.sales-empty')) {
        container.innerHTML = '<canvas id="sales-trend-chart"></canvas>';
        return renderSalesTrendChart();
    }

    // Format labels based on period type
    const labels = data.map(d => {
        if (d.label) {
            return d.label;
        } else if (d.period.includes(':')) {
            // Hour format (2025-01-01 14:00:00)
            return new Date(d.period).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
        } else if (d.period.length === 10) {
            // Date format (2025-01-01)
            return new Date(d.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else {
            // Month format (2025-01)
            const [year, month] = d.period.split('-');
            return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short' });
        }
    });

    const salesValues = data.map(d => parseFloat(d.sales) || 0);
    const ordersData = data.map(d => parseInt(d.orders || d.transactions) || 0);

    salesCharts.trend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Sales Revenue',
                    data: salesValues,
                    borderColor: '#FF8C42',
                    backgroundColor: 'rgba(255, 140, 66, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#FF8C42',
                    yAxisID: 'y'
                },
                {
                    label: 'Number of Orders',
                    data: ordersData,
                    borderColor: '#8B6F47',
                    backgroundColor: 'rgba(139, 111, 71, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#8B6F47',
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: { size: 11, weight: '600' }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (context.datasetIndex === 0) {
                                return 'Sales: ' + formatCurrency(context.parsed.y);
                            } else {
                                return 'Orders: ' + context.parsed.y;
                            }
                        }
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    grid: { color: '#E9ECEF', drawBorder: false },
                    ticks: {
                        callback: function(value) {
                            return '₱' + (value >= 1000 ? (value / 1000).toFixed(1) + 'K' : value);
                        },
                        font: { size: 10 }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    grid: { display: false },
                    ticks: {
                        callback: function(value) {
                            return value + ' orders';
                        },
                        font: { size: 10 }
                    }
                },
                x: {
                    grid: { display: false, drawBorder: false },
                    ticks: {
                        font: { size: 10 },
                        maxRotation: 45,
                        minRotation: 0
                    }
                }
            }
        }
    });
}

/**
 * Sales by Category Chart (Donut)
 */
function renderCategoryChart() {
    const canvas = document.getElementById('category-chart');
    if (!canvas) {
        console.warn('Category chart canvas not found');
        return;
    }

    const ctx = canvas.getContext('2d');

    if (salesCharts.category) {
        salesCharts.category.destroy();
    }

    const data = salesData.categories || [];

    console.log('Category data:', data);

    if (data.length === 0) {
        // Show "No Data" message
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '14px Arial';
        ctx.fillStyle = '#999';
        ctx.textAlign = 'center';
        ctx.fillText('No sales data available', canvas.width / 2, canvas.height / 2);
        return;
    }

    salesCharts.category = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(d => d.category || 'Uncategorized'),
            datasets: [{
                data: data.map(d => parseFloat(d.sales) || 0),
                backgroundColor: [
                    '#FF8C42',
                    '#8B6F47',
                    '#D4A574',
                    '#FFC107',
                    '#28A745',
                    '#6366F1'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: { size: 11, weight: '600' }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                            return context.label + ': ' + formatCurrency(context.parsed) + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

/**
 * Sales by Location Chart (Horizontal Bar)
 */
function renderLocationChart() {
    const canvas = document.getElementById('location-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (salesCharts.location) {
        salesCharts.location.destroy();
    }

    const data = salesData.locationBreakdown;

    salesCharts.location = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.location),
            datasets: [
                {
                    label: 'Sales',
                    data: data.map(d => d.sales),
                    backgroundColor: '#FF8C42',
                    borderRadius: 4
                },
                {
                    label: 'Profit',
                    data: data.map(d => d.profit),
                    backgroundColor: '#8B6F47',
                    borderRadius: 4
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: { size: 11, weight: '600' }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.x);
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { color: '#E9ECEF', drawBorder: false },
                    ticks: {
                        callback: function(value) {
                            return '₱' + (value / 1000) + 'K';
                        },
                        font: { size: 10 }
                    }
                },
                y: {
                    grid: { display: false, drawBorder: false },
                    ticks: { font: { size: 11 } }
                }
            }
        }
    });
}

/**
 * Weekday vs Weekend Chart (Bar)
 */
function renderWeekdayWeekendChart() {
    const canvas = document.getElementById('weekday-weekend-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (salesCharts.weekdayWeekend) {
        salesCharts.weekdayWeekend.destroy();
    }

    const data = salesData.weekdayWeekend;

    salesCharts.weekdayWeekend = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Weekday', 'Weekend'],
            datasets: [{
                label: 'Sales',
                data: [data.weekday.sales, data.weekend.sales],
                backgroundColor: ['#FF8C42', '#8B6F47'],
                borderRadius: 6,
                barThickness: 60
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Sales: ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#E9ECEF', drawBorder: false },
                    ticks: {
                        callback: function(value) {
                            return '₱' + (value / 1000) + 'K';
                        },
                        font: { size: 10 }
                    }
                },
                x: {
                    grid: { display: false, drawBorder: false },
                    ticks: { font: { size: 12, weight: '600' } }
                }
            }
        }
    });
}

/**
 * Quarterly Sales Chart
 */
function renderQuarterlyChart() {
    const canvas = document.getElementById('quarterly-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (salesCharts.quarterly) {
        salesCharts.quarterly.destroy();
    }

    const data = salesData.quarterly || [];

    salesCharts.quarterly = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => 'Q' + d.quarter),
            datasets: [{
                label: 'Quarterly Sales',
                data: data.map(d => parseFloat(d.sales) || 0),
                backgroundColor: '#FF8C42',
                borderRadius: 6,
                barThickness: 50
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Sales: ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#E9ECEF', drawBorder: false },
                    ticks: {
                        callback: function(value) {
                            return '₱' + (value / 1000) + 'K';
                        },
                        font: { size: 10 }
                    }
                },
                x: {
                    grid: { display: false, drawBorder: false },
                    ticks: { font: { size: 11, weight: '600' } }
                }
            }
        }
    });
}

/**
 * Product Range Analysis Chart (Donut Chart for Price Ranges)
 */
function renderProductRangeChart() {
    const canvas = document.getElementById('location-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (salesCharts.location) {
        salesCharts.location.destroy();
    }

    const data = salesData.productRange || [];

    if (data.length === 0) {
        // Fallback to location chart if no product range data
        renderLocationChart();
        return;
    }

    salesCharts.location = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(d => d.price_range),
            datasets: [{
                data: data.map(d => parseFloat(d.total_revenue) || 0),
                backgroundColor: [
                    '#10B981', // Green for Budget
                    '#3B82F6', // Blue for Economy
                    '#FF8C42', // Orange for Standard
                    '#8B6F47', // Brown for Premium
                    '#EF4444'  // Red for Luxury
                ],
                borderWidth: 3,
                borderColor: '#fff',
                hoverBorderWidth: 4,
                hoverBorderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        usePointStyle: true,
                        padding: 12,
                        font: { size: 11, weight: '600' },
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const value = data.datasets[0].data[i];
                                    const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return {
                                        text: `${label} (${percentage}%)`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        hidden: false,
                                        index: i
                                    };
                                });
                            }
                            return [];
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);

                            // Get additional data
                            const rangeData = salesData.productRange[context.dataIndex];
                            const products = rangeData ? rangeData.product_count : 0;
                            const qty = rangeData ? rangeData.total_quantity : 0;

                            return [
                                `${label}`,
                                `Revenue: ${formatCurrency(value)}`,
                                `Products: ${products}`,
                                `Quantity: ${qty}`,
                                `Share: ${percentage}%`
                            ];
                        }
                    }
                }
            }
        }
    });
}

/**
 * Render Best Sellers Table
 */
function renderBestSellersTable() {
    const tbody = document.getElementById('best-sellers-tbody');
    if (!tbody) return;

    const bestSellers = (salesData.bestSellers || []).slice(0, 10);

    if (bestSellers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #999;">No sales data available</td></tr>';
        return;
    }

    const maxRevenue = Math.max(...bestSellers.map(item => parseFloat(item.revenue) || 0));

    tbody.innerHTML = bestSellers.map((item, index) => `
        <tr>
            <td class="sales-table-rank">${index + 1}</td>
            <td>${item.product_name || 'Unknown'}</td>
            <td>${item.category || 'Uncategorized'}</td>
            <td>${formatNumber(item.quantity_sold || 0)}</td>
            <td>
                <div class="sales-table-bar">
                    <div class="sales-table-bar-bg">
                        <div class="sales-table-bar-fill" style="width: ${maxRevenue > 0 ? (parseFloat(item.revenue) / maxRevenue * 100) : 0}%"></div>
                    </div>
                    <div class="sales-table-value">${formatCurrency(parseFloat(item.revenue) || 0)}</div>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Render high-level sales summary (gross/net/payments)
 */
function renderSalesSummary() {
    const summary = salesData.summary || {};
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    setText('sales-gross-value', formatCurrency(summary.total_sales || 0));
    setText('sales-net-value', formatCurrency(summary.net_sales || 0));
    setText('sales-transactions-value', formatNumber(summary.total_transactions || 0));
    setText('sales-avg-value', formatCurrency(summary.avg_order_value || 0));
    setText('sales-cash-value', formatCurrency(summary.cash_sales || 0));
    setText('sales-card-value', formatCurrency(summary.card_sales || 0));
    setText('sales-ewallet-value', formatCurrency(summary.ewallet_sales || 0));
}

/**
 * Render Heatmap
 */
function renderHeatmap() {
    const container = document.getElementById('heatmap-container');
    if (!container) return;

    const rawData = salesData.heatmap || [];

    // Convert API data to heatmap format
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Initialize heatmap data structure
    const heatmapData = {};
    dayNames.forEach(day => {
        heatmapData[day] = Array(24).fill(0);
    });

    // Fill with actual data
    rawData.forEach(item => {
        const dayIndex = parseInt(item.day_of_week) - 1; // MySQL DAYOFWEEK returns 1-7 (Sunday = 1)
        const hourIndex = parseInt(item.hour);
        const sales = parseFloat(item.sales) || 0;

        if (dayIndex >= 0 && dayIndex < 7 && hourIndex >= 0 && hourIndex < 24) {
            heatmapData[dayNames[dayIndex]][hourIndex] = sales;
        }
    });

    // Find max sales for normalization
    let maxSales = 0;
    Object.values(heatmapData).forEach(dayData => {
        const dayMax = Math.max(...dayData);
        if (dayMax > maxSales) maxSales = dayMax;
    });

    // Build heatmap HTML
    let html = '<div class="sales-heatmap">';

    // Header row (hours)
    html += '<div class="sales-heatmap-label"></div>';
    hours.forEach(hour => {
        html += `<div class="sales-heatmap-cell header">${hour}</div>`;
    });

    // Data rows
    dayNames.forEach(day => {
        html += `<div class="sales-heatmap-label">${day.substring(0, 3)}</div>`;
        heatmapData[day].forEach((sales, hourIndex) => {
            const level = sales === 0 ? 0 : Math.min(5, Math.ceil((sales / maxSales) * 5));
            const tooltip = `${day} ${hourIndex}:00 - ${formatCurrency(sales)}`;
            html += `<div class="sales-heatmap-cell level-${level}" title="${tooltip}"></div>`;
        });
    });

    html += '</div>';

    // Add legend
    html += `
        <div class="sales-heatmap-legend">
            <span>Less</span>
            <div class="sales-heatmap-legend-scale">
                ${[0, 1, 2, 3, 4, 5].map(level =>
                    `<div class="sales-heatmap-legend-box level-${level}"></div>`
                ).join('')}
            </div>
            <span>More</span>
        </div>
    `;

    container.innerHTML = html;
}

/**
 * Utility Functions
 */
function formatCurrency(value) {
    return '₱' + value.toLocaleString('en-PH', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

function formatNumber(value) {
    return value.toLocaleString('en-PH');
}

function showSalesLoading() {
    const containers = document.querySelectorAll('.sales-chart-container');
    containers.forEach(container => {
        container.classList.add('sales-loading-wrapper');

        let overlay = container.querySelector('.sales-loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'sales-loading-overlay';
            overlay.innerHTML = `
                <div class="sales-loading">
                    <div class="sales-spinner"></div>
                    <div class="sales-loading-text">Loading sales data...</div>
                </div>
            `;
            container.appendChild(overlay);
        }

        overlay.style.display = 'flex';
    });
}

function hideSalesLoading() {
    document.querySelectorAll('.sales-loading-overlay').forEach(overlay => {
        overlay.remove();
    });

    document.querySelectorAll('.sales-loading-wrapper').forEach(container => {
        container.classList.remove('sales-loading-wrapper');
    });
}

function showError(message) {
    console.error('Sales Dashboard Error:', message);
    // You can add a visual error notification here if needed
}

/**
 * Auto-initialize when sales content is visible
 */
document.addEventListener('DOMContentLoaded', function() {
    const salesContent = document.getElementById('sales-content');

    if (salesContent && !salesContent.classList.contains('hidden')) {
        const checkChartAndInit = setInterval(function() {
            if (typeof Chart !== 'undefined') {
                clearInterval(checkChartAndInit);
                console.log('Auto-initializing sales dashboard...');
                initializeSalesDashboard();
            }
        }, 100);

        setTimeout(function() {
            clearInterval(checkChartAndInit);
        }, 5000);
    }
});
