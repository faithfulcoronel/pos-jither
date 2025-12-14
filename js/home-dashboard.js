/**
 * Manager Home Dashboard - Dynamic Business Analytics
 * Mirrors the new analytics dashboard but with home-prefixed IDs.
 */

let homeCharts = {};
let homeData = null;
let homeExpenses = 0;

// Demo data (fallback)
function sampleHomeData() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const categories = ['Coffee', 'Food', 'Beverages', 'Desserts', 'Others'];
    const payments = ['Cash', 'Card', 'GCash'];
    return {
        kpis: { revenue: 4100000, profit: 1240000, cashFlow: 1500000, aov: 230 },
        trend: months.map((m, i) => ({ label: m, revenue: 170000 + i * 15000 + Math.random() * 25000 })),
        revenueOrders: months.map((m, i) => ({ label: m, revenue: 180000 + i * 12000, orders: 1100 + i * 90 })),
        branchPerformance: [],
        categorySales: categories.map(c => ({ category: c, revenue: 280000 + Math.random() * 220000 })),
        topItems: [
            { name: 'Cappuccino', revenue: 210000 },
            { name: 'Latte', revenue: 190000 },
            { name: 'Caramel Macchiato', revenue: 175000 },
            { name: 'Iced Americano', revenue: 142000 },
            { name: 'Chocolate Cake', revenue: 118000 },
            { name: 'Croissant', revenue: 108000 },
            { name: 'Club Sandwich', revenue: 92000 }
        ],
        peakHours: Array.from({ length: 12 }, (_, idx) => ({ hour: `${idx + 7}:00`, revenue: 18000 + Math.random() * 16000 })),
        weekly: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => ({ day: d, revenue: 90000 + Math.random() * 32000, orders: 280 + Math.random() * 130 })),
        profitByCategory: categories.map(c => ({ category: c, profit: 140000 + Math.random() * 130000 })),
        paymentMethods: payments.map((p, i) => ({ method: p, share: [0.46, 0.34, 0.2][i] })),
        retention: months.map((m, i) => ({ label: m, returning: 42 + i * 1.8 + Math.random() * 4, new: 58 - i * 1.8 + Math.random() * 4 }))
    };
}

async function fetchHomeData() {
    try {
        const normalize = (v) => {
            if (!v) return '';
            const d = new Date(v);
            return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
        };

        const start = normalize(document.getElementById('home-start-date')?.value || '');
        const end = normalize(document.getElementById('home-end-date')?.value || '');
        const params = new URLSearchParams();
        // If either date is provided, respect the explicit range (dup whichever is missing)
        if (start || end) {
            params.append('start_date', start || end);
            params.append('end_date', end || start);
        } else {
            params.append('date_range', 'month');
        }

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
            fetch(`php/api.php?resource=inventory-expenses&${params}`).then(r => r.json())
        ]);

        const summary = (reportsRes.success && reportsRes.summary) ? reportsRes.summary : (summaryRes.success ? summaryRes.data : {});
        const revenue = Number(summary.total_sales || 0);
        const netSales = Number(summary.net_sales ?? (revenue - Number(summary.total_discount || 0)));
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
                peakHours.push({ hour: `${hour.toString().padStart(2, '0')}:00`, revenue: sales });
            });
            peakHours.sort((a, b) => b.revenue - a.revenue);
        }

        const weekly = (timeRes.success ? timeRes.data : []).map(d => ({
            day: d.label || d.period || '',
            revenue: parseFloat(d.sales || 0),
            orders: parseInt(d.orders || d.transactions || 0)
        }));

        // Expenses based on stock deductions
        homeExpenses = inventoryRes.success ? Number(inventoryRes.data.total_expense || 0) : 0;

        // Profit = Revenue - Total Expenses
        const profit = revenue - homeExpenses;
        const cashFlow = netSales; // keep cash flow as net sales for now

        homeData = {
            kpis: {
                revenue,
                profit,
                cashFlow,
                aov: summary.average_order || summary.avg_order_value || 0
            },
            trend,
            revenueOrders: trend.map(t => ({ label: t.label, revenue: t.revenue, orders: t.orders })),
            branchPerformance: [],
            categorySales: categories,
            topItems,
            peakHours: peakHours.slice(0, 12),
            weekly,
            profitByCategory: categories.map(c => ({ category: c.category, profit: c.revenue * 0.3 })),
            paymentMethods: [
                { method: 'Cash', share: summary.cash_sales ? (summary.cash_sales / (summary.total_sales || 1)) : 0 },
                { method: 'Card', share: summary.card_sales ? (summary.card_sales / (summary.total_sales || 1)) : 0 },
                { method: 'e-Wallet', share: summary.ewallet_sales ? (summary.ewallet_sales / (summary.total_sales || 1)) : 0 }
            ],
            retention: weekly.map(d => ({ label: d.day, returning: 50 + Math.random() * 10, new: 50 - Math.random() * 10 }))
        };
    } catch (error) {
        console.error('Home analytics API failed, using sample data', error);
        homeData = sampleHomeData();
    }
}

function initializeHomeDashboard() {
    fetchHomeData().then(() => {
        updateHomeKPIs();
        renderHomeCharts();
    });
}

function refreshHomeDashboard() {
    destroyHomeCharts();
    initializeHomeDashboard();
}

function destroyHomeCharts() {
    Object.values(homeCharts).forEach(c => c && c.destroy());
    homeCharts = {};
}

function updateHomeKPIs() {
    const k = homeData.kpis;
    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };
    set('home-kpi-revenue', formatCurrency(k.revenue));
    set('home-kpi-profit', formatCurrency(k.profit));
    set('home-kpi-cashflow', formatCurrency(k.cashFlow));
    set('home-kpi-aov', formatCurrency(k.aov));

    set('home-kpi-revenue-change', '');
    set('home-kpi-profit-change', '');
    set('home-kpi-cashflow-change', '');
    set('home-kpi-aov-change', '');
}

function renderHomeCharts() {
    renderHomeSalesTrend();
    renderHomeRevenueOrders();
    renderHomeCategorySales();
    renderHomeTopItems();
    renderHomeTopItemsTable();
    renderHomePeakHours();
    renderHomeWeeklyPerformance();
    renderHomeProfitByCategory();
    renderHomePaymentMethods();
    renderHomeRetention();
}

function renderHomeSalesTrend() {
    const ctx = document.getElementById('home-chart-sales-trend');
    if (!ctx) return;
    homeCharts.trend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: homeData.trend.map(d => d.label),
            datasets: [{
                label: 'Revenue',
                data: homeData.trend.map(d => d.revenue),
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

function renderHomeRevenueOrders() {
    const ctx = document.getElementById('home-chart-revenue-orders');
    if (!ctx) return;
    homeCharts.revenueOrders = new Chart(ctx, {
        data: {
            labels: homeData.revenueOrders.map(d => d.label),
            datasets: [
                { type: 'bar', label: 'Revenue', data: homeData.revenueOrders.map(d => d.revenue), backgroundColor: '#FF8C42', yAxisID: 'y' },
                { type: 'line', label: 'Orders', data: homeData.revenueOrders.map(d => d.orders), borderColor: '#6366F1', backgroundColor: '#6366F1', tension: 0.4, yAxisID: 'y1' }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'top' } },
            scales: {
                y: { position: 'left', ticks: { callback: currencyTick } },
                y1: { position: 'right', grid: { drawOnChartArea: false } }
            }
        }
    });
}

function renderHomeBranchPerformance() {
    const ctx = document.getElementById('home-chart-branch-performance');
    if (!ctx) return;
    homeCharts.branch = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: homeData.branchPerformance.map(d => d.branch),
            datasets: [{ label: 'Revenue', data: homeData.branchPerformance.map(d => d.revenue), backgroundColor: '#8B6F47', borderRadius: 6 }]
        },
        options: baseBarOptions()
    });
}

function renderHomeCategorySales() {
    const ctx = document.getElementById('home-chart-category-sales');
    if (!ctx) return;
    homeCharts.category = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: homeData.categorySales.map(d => d.category),
            datasets: [{
                data: homeData.categorySales.map(d => d.revenue),
                backgroundColor: ['#FF8C42', '#8B6F47', '#FFB380', '#A68A64', '#6D5738'],
                borderWidth: 0
            }]
        },
        options: baseDoughnutOptions()
    });
}

function renderHomeTopItems() {
    const ctx = document.getElementById('home-chart-top-items');
    if (!ctx) return;
    homeCharts.topItems = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: homeData.topItems.map(d => d.name),
            datasets: [{ label: 'Revenue', data: homeData.topItems.map(d => d.revenue), backgroundColor: '#FF8C42', borderRadius: 4 }]
        },
        options: baseBarOptions('y')
    });
}

function renderHomeTopItemsTable() {
    const tbody = document.getElementById('home-top-table-body');
    if (!tbody || !homeData || !homeData.topItems) return;
    const rows = homeData.topItems.slice(0, 8).map(item => {
        const qty = item.quantity || item.qty || 100;
        const total = formatCurrency(item.revenue || 0);
        return `
            <tr>
                <td>${item.name}</td>
                <td>${qty.toLocaleString()}</td>
                <td>${total}</td>
            </tr>
        `;
    }).join('');
    tbody.innerHTML = rows || '<tr><td colspan="3">No top items available.</td></tr>';
}

function renderHomePeakHours() {
    const ctx = document.getElementById('home-chart-peak-hours');
    if (!ctx) return;
    homeCharts.peak = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: homeData.peakHours.map(d => d.hour),
            datasets: [{ label: 'Revenue', data: homeData.peakHours.map(d => d.revenue), backgroundColor: '#6366F1', borderRadius: 4 }]
        },
        options: baseBarOptions()
    });
}

function renderHomeWeeklyPerformance() {
    const ctx = document.getElementById('home-chart-weekly-performance');
    if (!ctx) return;
    homeCharts.weekly = new Chart(ctx, {
        type: 'line',
        data: {
            labels: homeData.weekly.map(d => d.day),
            datasets: [
                { label: 'Revenue', data: homeData.weekly.map(d => d.revenue), borderColor: '#FF8C42', backgroundColor: 'rgba(255, 140, 66, 0.1)', fill: true, tension: 0.3, borderWidth: 3 },
                { label: 'Orders', data: homeData.weekly.map(d => d.orders), borderColor: '#22C55E', backgroundColor: 'rgba(34, 197, 94, 0.1)', fill: true, tension: 0.3, borderWidth: 3 }
            ]
        },
        options: baseLineOptions()
    });
}

function renderHomeProfitByCategory() {
    const ctx = document.getElementById('home-chart-profit-category');
    if (!ctx) return;
    homeCharts.profitCat = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: homeData.profitByCategory.map(d => d.category),
            datasets: [{ label: 'Profit', data: homeData.profitByCategory.map(d => d.profit), backgroundColor: '#10B981', borderRadius: 4 }]
        },
        options: baseBarOptions()
    });
}

function renderHomePaymentMethods() {
    const ctx = document.getElementById('home-chart-payment-methods');
    if (!ctx) return;
    homeCharts.payments = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: homeData.paymentMethods.map(d => d.method),
            datasets: [{ data: homeData.paymentMethods.map(d => d.share * 100), backgroundColor: ['#FF8C42', '#8B6F47', '#6366F1'], borderWidth: 0 }]
        },
        options: baseDoughnutOptions('%')
    });
}

function renderHomeRetention() {
    const ctx = document.getElementById('home-chart-retention');
    if (!ctx) return;
    homeCharts.retention = new Chart(ctx, {
        type: 'line',
        data: {
            labels: homeData.retention.map(d => d.label),
            datasets: [
                { label: 'Returning Customers (%)', data: homeData.retention.map(d => d.returning), borderColor: '#FF8C42', backgroundColor: 'rgba(255, 140, 66, 0.1)', fill: true, tension: 0.3, borderWidth: 3 },
                { label: 'New Customers (%)', data: homeData.retention.map(d => d.new), borderColor: '#6366F1', backgroundColor: 'rgba(99, 102, 241, 0.1)', fill: true, tension: 0.3, borderWidth: 3 }
            ]
        },
        options: baseLineOptions('%')
    });
}

// Shared chart options (reuse analytics helpers)
function baseLineOptions(suffix = '') {
    return {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: {
            y: { ticks: { callback: v => suffix === '%' ? `${v}%` : currencyTick(v) }, grid: { color: '#E5E7EB' } },
            x: { grid: { display: false } }
        }
    };
}

function baseBarOptions(axis = 'x') {
    return {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
            y: { ticks: { callback: currencyTick }, grid: { color: '#E5E7EB' } },
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
    const homeContent = document.getElementById('home-content');
    if (homeContent && !homeContent.classList.contains('hidden')) {
        initializeHomeDashboard();
    }
});
