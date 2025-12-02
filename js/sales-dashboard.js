/**
 * Modern Sales Dashboard JavaScript
 * Power BI-inspired Sales Analysis for Coffee Shop
 */

let salesCharts = {};
let salesData = {};
let currentFilters = {
    period: 'monthly',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    quarter: Math.floor(new Date().getMonth() / 3) + 1
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
    // Period filter
    const periodFilter = document.getElementById('sales-period-filter');
    if (periodFilter) {
        periodFilter.addEventListener('change', function() {
            currentFilters.period = this.value;
            loadSalesData();
        });
    }

    // Year filter
    const yearFilter = document.getElementById('sales-year-filter');
    if (yearFilter) {
        yearFilter.addEventListener('change', function() {
            currentFilters.year = parseInt(this.value);
            loadSalesData();
        });
    }

    // Month filter
    const monthFilter = document.getElementById('sales-month-filter');
    if (monthFilter) {
        monthFilter.addEventListener('change', function() {
            currentFilters.month = parseInt(this.value);
            loadSalesData();
        });
    }

    // Quarter filter
    const quarterFilter = document.getElementById('sales-quarter-filter');
    if (quarterFilter) {
        quarterFilter.addEventListener('change', function() {
            currentFilters.quarter = parseInt(this.value);
            loadSalesData();
        });
    }
}

/**
 * Load Sales Data
 */
async function loadSalesData() {
    try {
        showSalesLoading();

        // Fetch real data from API
        const params = new URLSearchParams({
            period: currentFilters.period,
            year: currentFilters.year,
            month: currentFilters.month,
            quarter: currentFilters.quarter
        });

        // Fetch all data in parallel
        const [kpis, trend, categories, quarterly, weekday, bestSellers, heatmap] = await Promise.all([
            fetch(`php/sales-analytics-api.php?action=get_kpis&${params}`).then(r => r.json()),
            fetch(`php/sales-analytics-api.php?action=get_sales_trend&${params}`).then(r => r.json()),
            fetch(`php/sales-analytics-api.php?action=get_category_sales&${params}`).then(r => r.json()),
            fetch(`php/sales-analytics-api.php?action=get_quarterly_sales&${params}`).then(r => r.json()),
            fetch(`php/sales-analytics-api.php?action=get_weekday_sales&${params}`).then(r => r.json()),
            fetch(`php/sales-analytics-api.php?action=get_best_sellers&${params}`).then(r => r.json()),
            fetch(`php/sales-analytics-api.php?action=get_heatmap&${params}`).then(r => r.json())
        ]);

        // Store data
        salesData = {
            kpis: kpis.success ? kpis.kpis : {},
            trend: trend.success ? trend.data : [],
            categories: categories.success ? categories.data : [],
            quarterly: quarterly.success ? quarterly.data : [],
            weekday: weekday.success ? weekday.data : [],
            bestSellers: bestSellers.success ? bestSellers.data : [],
            heatmap: heatmap.success ? heatmap.data : []
        };

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
}

/**
 * Sales Trend Over Time Chart
 */
function renderSalesTrendChart() {
    const canvas = document.getElementById('sales-trend-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (salesCharts.trend) {
        salesCharts.trend.destroy();
    }

    const data = salesData.trend || [];

    // Format labels based on period type
    const labels = data.map(d => {
        if (d.period.includes(':')) {
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

    salesCharts.trend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Actual Sales',
                    data: data.map(d => parseFloat(d.sales) || 0),
                    borderColor: '#FF8C42',
                    backgroundColor: 'rgba(255, 140, 66, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#FF8C42'
                }
            ]
        },
        options: {
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
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
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
                    ticks: { font: { size: 10 } }
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
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (salesCharts.category) {
        salesCharts.category.destroy();
    }

    const data = salesData.categories || [];

    salesCharts.category = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(d => d.category),
            datasets: [{
                data: data.map(d => d.sales),
                backgroundColor: [
                    '#FF8C42',
                    '#8B6F47',
                    '#D4A574',
                    '#FFC107',
                    '#28A745'
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
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
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
        container.innerHTML = '<div class="sales-loading"><div class="sales-spinner"></div></div>';
    });
}

function hideSalesLoading() {
    // Loading is automatically hidden when charts render
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
