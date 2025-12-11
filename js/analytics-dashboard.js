/**
 * Business Analytics Dashboard (dynamic filters + charts)
 * Replace sample data with API calls when available.
 */

let charts = {};
let analyticsData = null;
let analyticsExpenses = 0;

const randomSeries = (len, min = 1000, max = 8000) =>
    Array.from({ length: len }, () => Math.floor(Math.random() * (max - min + 1) + min));

function sampleAnalyticsData() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const categories = ['Coffee', 'Food', 'Beverages', 'Desserts', 'Others'];
    const paymentLabels = ['Cash', 'Card', 'GCash'];
    return {
        kpis: { revenue: 4200000, profit: 1280000, orders: 18500, aov: 226 },
        trend: months.map((m, i) => ({ label: m, revenue: 180000 + i * 12000 + Math.random() * 30000 })),
        revenueOrders: months.map((m, i) => ({ label: m, revenue: 180000 + i * 15000, orders: 1200 + i * 80 })),
        branchPerformance: [],
        categorySales: categories.map(c => ({ category: c, revenue: 300000 + Math.random() * 200000 })),
        topItems: [
            { name: 'Cappuccino', revenue: 220000 },
            { name: 'Latte', revenue: 195000 },
            { name: 'Caramel Macchiato', revenue: 180000 },
            { name: 'Iced Americano', revenue: 150000 },
            { name: 'Chocolate Cake', revenue: 120000 },
            { name: 'Croissant', revenue: 110000 },
            { name: 'Club Sandwich', revenue: 90000 }
        ],
        peakHours: Array.from({ length: 12 }, (_, idx) => ({ hour: `${idx + 7}:00`, revenue: 20000 + Math.random() * 15000 })),
        weekly: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => ({ day: d, revenue: 100000 + Math.random() * 30000, orders: 300 + Math.random() * 120 })),
        profitByCategory: categories.map(c => ({ category: c, profit: 150000 + Math.random() * 120000 })),
        paymentMethods: paymentLabels.map((p, i) => ({ method: p, share: [0.45, 0.35, 0.2][i] })),
        retention: months.map((m, i) => ({ label: m, returning: 40 + i * 2 + Math.random() * 5, new: 60 - i * 2 + Math.random() * 5 }))
    };
}

async function fetchAnalyticsData() {
    try {
        // Normalize and prefer explicit date range from calendar inputs
        const normalize = (v) => {
            if (!v) return '';
            const d = new Date(v);
            return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
        };
        const start = normalize(document.getElementById('analytics-start-date')?.value || '');
        const end = normalize(document.getElementById('analytics-end-date')?.value || '');
        const dateRangeParam = (start || end) ? 'custom' : 'month';
        const params = new URLSearchParams();
        if (start) params.append('start_date', start);
        if (end) params.append('end_date', end);
        params.append('date_range', dateRangeParam);

        const [
            summaryRes,
            trendRes,
            categoryRes,
            bestRes,
            heatmapRes,
            timeRes,
            reportsRes,
            inventoryRes
        ] = await Promise.all([
            fetch(`php/sales-analytics-api.php?action=get_sales_summary&${params}`).then(r => r.json()),
            fetch(`php/sales-analytics-api.php?action=get_sales_trend&${params}`).then(r => r.json()),
            fetch(`php/sales-analytics-api.php?action=get_category_sales&${params}`).then(r => r.json()),
            fetch(`php/sales-analytics-api.php?action=get_best_sellers&${params}`).then(r => r.json()),
            fetch(`php/sales-analytics-api.php?action=get_heatmap&${params}`).then(r => r.json()),
            fetch(`php/sales-analytics-api.php?action=get_time_period_comparison&${params}`).then(r => r.json()),
            fetch(`php/business-reports-api.php?action=get_reports&${params}`).then(r => r.json()),
            fetch('php/api.php?resource=inventory-with-cost').then(r => r.json())
        ]);

        // Prefer business reports summary (daily snapshots) if available; otherwise fall back to live sales summary
        const summary = (reportsRes.success && reportsRes.summary) ? reportsRes.summary : (summaryRes.success ? summaryRes.data : {});
        const trend = (trendRes.success ? trendRes.data : []).map(t => ({
            label: t.period || t.label || t.date || '',
            revenue: parseFloat(t.sales || 0),
            orders: parseInt(t.orders || t.transactions || 0)
        }));
        const categories = (categoryRes.success ? categoryRes.data : []).map(c => ({
            category: c.category || 'Uncategorized',
            revenue: parseFloat(c.sales || 0)
        }));
        const topItems = (bestRes.success ? bestRes.data : []).map(i => ({
            name: i.product_name || i.product || 'Item',
            revenue: parseFloat(i.revenue || 0)
        })).slice(0, 10);

        const peakHours = [];
        if (heatmapRes.success) {
            (heatmapRes.data || []).forEach(row => {
                const hour = parseInt(row.hour);
                const sales = parseFloat(row.sales || 0);
                const label = `${hour.toString().padStart(2, '0')}:00`;
                peakHours.push({ hour: label, revenue: sales });
            });
            peakHours.sort((a, b) => b.revenue - a.revenue);
        }

        const weekly = (timeRes.success ? timeRes.data : []).map(d => ({
            day: d.label || d.period || '',
            revenue: parseFloat(d.sales || 0),
            orders: parseInt(d.orders || d.transactions || 0)
        }));

        // Expenses from inventory
        analyticsExpenses = 0;
        if (inventoryRes.success) {
            const items = inventoryRes.data.inventory || [];
            analyticsExpenses = items.reduce((sum, item) => {
                const qty = Number(item.qty ?? item.quantity ?? 0);
                const cost = Number(item.costPerUnit ?? item.cost_per_unit ?? 0);
                return sum + qty * cost;
            }, 0);
        }

        const cashSales = Number(summary.cash_sales || 0);
        const cardSales = Number(summary.card_sales || 0);
        const gcashSales = Number(summary.gcash_sales || summary.ewallet_sales || 0);
        const paymentTotalFromSummary = Number(summary.total_sales || 0);
        const fallbackPaymentTotal = cashSales + cardSales + gcashSales;
        const paymentTotal = paymentTotalFromSummary > 0 ? paymentTotalFromSummary : fallbackPaymentTotal;
        const paymentDenominator = paymentTotal > 0 ? paymentTotal : 1;

        analyticsData = {
            kpis: {
                revenue: summary.total_sales || 0,
                profit: analyticsExpenses - (summary.total_sales || 0), // Expenses - Revenue = Profit (per user)
                orders: summary.total_transactions || 0,
                aov: summary.average_order || summary.avg_order_value || 0
            },
            trend,
            revenueOrders: trend.map(t => ({ label: t.label, revenue: t.revenue, orders: t.orders })),
            branchPerformance: [], // no branch data available from current API
            categorySales: categories,
            topItems,
            peakHours: peakHours.slice(0, 12),
            weekly,
            profitByCategory: categories.map(c => ({ category: c.category, profit: c.revenue * 0.3 })),
            paymentMethods: [
                { method: 'Cash', share: paymentTotal > 0 ? (cashSales / paymentDenominator) : 0 },
                { method: 'Card', share: paymentTotal > 0 ? (cardSales / paymentDenominator) : 0 },
                { method: 'GCash', share: paymentTotal > 0 ? (gcashSales / paymentDenominator) : 0 }
            ],
            retention: weekly.map(d => ({ label: d.day, returning: 50 + Math.random() * 10, new: 50 - Math.random() * 10 }))
        };
    } catch (error) {
        console.error('Analytics API failed, using sample data', error);
        analyticsData = sampleAnalyticsData();
    }
}

function initializeAnalyticsDashboard() {
    // If no dates are selected, default to the last 7 days so charts (including Sales Trend) honor a real range
    const startInput = document.getElementById('analytics-start-date');
    const endInput = document.getElementById('analytics-end-date');
    if (startInput && endInput && !startInput.value && !endInput.value) {
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 6);
        const toISO = d => d.toISOString().split('T')[0];
        startInput.value = toISO(sevenDaysAgo);
        endInput.value = toISO(today);
    }

    fetchAnalyticsData().then(() => {
        updateKPIValues();
        renderCharts();
    });
}

function refreshAnalyticsDashboard() {
    destroyAllCharts();
    initializeAnalyticsDashboard();
}

function destroyAllCharts() {
    Object.values(charts).forEach(chart => chart && chart.destroy());
    charts = {};
}

function updateKPIValues() {
    const k = analyticsData.kpis;
    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };
    set('kpi-revenue', formatCurrency(k.revenue));
    set('kpi-profit', formatCurrency(k.profit));
    set('kpi-orders', k.orders.toLocaleString());
    set('kpi-aov', formatCurrency(k.aov));

    // Change indicators are placeholders until period-over-period data is provided
    set('kpi-revenue-change', '');
    set('kpi-profit-change', '');
    set('kpi-orders-change', '');
    set('kpi-aov-change', '');
}

function renderCharts() {
    renderSalesTrend();
    renderRevenueOrders();
    renderCategorySales();
    renderTopItems();
    renderPeakHours();
    renderWeeklyPerformance();
    renderProfitByCategory();
    renderPaymentMethods();
    renderRetention();
}

function renderSalesTrend() {
    const ctx = document.getElementById('chart-sales-trend');
    if (!ctx) return;
    charts.salesTrend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: analyticsData.trend.map(d => d.label),
            datasets: [{
                label: 'Revenue',
                data: analyticsData.trend.map(d => d.revenue),
                borderColor: '#FF8C42',
                backgroundColor: 'rgba(255, 140, 66, 0.15)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 4
            }]
        },
        options: baseLineOptions()
    });
}

function renderRevenueOrders() {
    const ctx = document.getElementById('chart-revenue-orders');
    if (!ctx) return;
    charts.revenueOrders = new Chart(ctx, {
        data: {
            labels: analyticsData.revenueOrders.map(d => d.label),
            datasets: [
                {
                    type: 'bar',
                    label: 'Revenue',
                    data: analyticsData.revenueOrders.map(d => d.revenue),
                    backgroundColor: '#FF8C42',
                    yAxisID: 'y'
                },
                {
                    type: 'line',
                    label: 'Orders',
                    data: analyticsData.revenueOrders.map(d => d.orders),
                    borderColor: '#6366F1',
                    backgroundColor: '#6366F1',
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'top' } },
            scales: {
                y: { position: 'left', ticks: { callback: v => currencyTick(v) } },
                y1: { position: 'right', grid: { drawOnChartArea: false } }
            }
        }
    });
}

function renderBranchPerformance() {
    const ctx = document.getElementById('chart-branch-performance');
    if (!ctx) return;
    charts.branch = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: analyticsData.branchPerformance.map(d => d.branch),
            datasets: [{
                label: 'Revenue',
                data: analyticsData.branchPerformance.map(d => d.revenue),
                backgroundColor: '#8B6F47',
                borderRadius: 6
            }]
        },
        options: baseBarOptions()
    });
}

function renderCategorySales() {
    const ctx = document.getElementById('chart-category-sales');
    if (!ctx) return;
    charts.category = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: analyticsData.categorySales.map(d => d.category),
            datasets: [{
                data: analyticsData.categorySales.map(d => d.revenue),
                backgroundColor: ['#FF8C42', '#8B6F47', '#FFB380', '#A68A64', '#6D5738'],
                borderWidth: 0
            }]
        },
        options: baseDoughnutOptions()
    });
}

function renderTopItems() {
    const ctx = document.getElementById('chart-top-items');
    if (!ctx) return;
    charts.topItems = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: analyticsData.topItems.map(d => d.name),
            datasets: [{
                label: 'Revenue',
                data: analyticsData.topItems.map(d => d.revenue),
                backgroundColor: '#FF8C42',
                borderRadius: 4
            }]
        },
        options: baseBarOptions('y')
    });
}

function renderPeakHours() {
    const ctx = document.getElementById('chart-peak-hours');
    if (!ctx) return;
    charts.peakHours = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: analyticsData.peakHours.map(d => d.hour),
            datasets: [{
                label: 'Revenue',
                data: analyticsData.peakHours.map(d => d.revenue),
                backgroundColor: '#6366F1',
                borderRadius: 4
            }]
        },
        options: baseBarOptions()
    });
}

function renderWeeklyPerformance() {
    const ctx = document.getElementById('chart-weekly-performance');
    if (!ctx) return;
    charts.weekly = new Chart(ctx, {
        type: 'line',
        data: {
            labels: analyticsData.weekly.map(d => d.day),
            datasets: [
                {
                    label: 'Revenue',
                    data: analyticsData.weekly.map(d => d.revenue),
                    borderColor: '#FF8C42',
                    backgroundColor: 'rgba(255, 140, 66, 0.1)',
                    tension: 0.3,
                    fill: true,
                    borderWidth: 3
                },
                {
                    label: 'Orders',
                    data: analyticsData.weekly.map(d => d.orders),
                    borderColor: '#22C55E',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.3,
                    fill: true,
                    borderWidth: 3
                }
            ]
        },
        options: baseLineOptions()
    });
}

function renderProfitByCategory() {
    const ctx = document.getElementById('chart-profit-category');
    if (!ctx) return;
    charts.profitCat = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: analyticsData.profitByCategory.map(d => d.category),
            datasets: [{
                label: 'Profit',
                data: analyticsData.profitByCategory.map(d => d.profit),
                backgroundColor: '#10B981',
                borderRadius: 4
            }]
        },
        options: baseBarOptions()
    });
}

function renderPaymentMethods() {
    const ctx = document.getElementById('chart-payment-methods');
    if (!ctx) return;
    charts.payment = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: analyticsData.paymentMethods.map(d => d.method),
            datasets: [{
                data: analyticsData.paymentMethods.map(d => d.share * 100),
                backgroundColor: ['#FF8C42', '#8B6F47', '#6366F1'],
                borderWidth: 0
            }]
        },
        options: baseDoughnutOptions('%')
    });
}

function renderRetention() {
    const ctx = document.getElementById('chart-retention');
    if (!ctx) return;
    charts.retention = new Chart(ctx, {
        type: 'line',
        data: {
            labels: analyticsData.retention.map(d => d.label),
            datasets: [
                {
                    label: 'Returning Customers (%)',
                    data: analyticsData.retention.map(d => d.returning),
                    borderColor: '#FF8C42',
                    backgroundColor: 'rgba(255, 140, 66, 0.1)',
                    tension: 0.3,
                    fill: true,
                    borderWidth: 3
                },
                {
                    label: 'New Customers (%)',
                    data: analyticsData.retention.map(d => d.new),
                    borderColor: '#6366F1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.3,
                    fill: true,
                    borderWidth: 3
                }
            ]
        },
        options: baseLineOptions('%')
    });
}

// Shared chart option helpers
function baseLineOptions(suffix = '') {
    return {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: {
            y: {
                ticks: { callback: v => suffix === '%' ? `${v}%` : currencyTick(v) },
                grid: { color: '#E5E7EB' }
            },
            x: { grid: { display: false } }
        }
    };
}

function baseBarOptions(axis = 'x') {
    return {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
            y: { ticks: { callback: v => currencyTick(v) }, grid: { color: '#E5E7EB' } },
            x: { grid: { display: false } }
        },
        indexAxis: axis === 'y' ? 'y' : 'x'
    };
}

function baseDoughnutOptions(format = 'currency') {
    return {
        responsive: true,
        plugins: {
            legend: { position: 'bottom' },
            tooltip: {
                callbacks: {
                    label: context => {
                        const label = context.label || '';
                        const value = context.parsed;
                        return format === '%' ? `${label}: ${value.toFixed(1)}%` : `${label}: ${formatCurrency(value)}`;
                    }
                }
            }
        },
        cutout: '60%'
    };
}

function currencyTick(value) {
    return '₱' + value.toLocaleString('en-PH', { maximumFractionDigits: 0 });
}

function formatCurrency(value) {
    return '₱' + Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 0 });
}

// Auto-init when visible
document.addEventListener('DOMContentLoaded', () => {
    const analyticsDashboard = document.getElementById('analytics-dashboard-content');
    if (analyticsDashboard && !analyticsDashboard.classList.contains('hidden')) {
        initializeAnalyticsDashboard();
    }
});
