/**
 * Coffee Shop Business Analytics Dashboard
 * Handles all chart rendering and data visualization
 */

// Global chart instances
let chartSalesByRegion = null;
let chartActualVsPlan = null;
let chartMarginRevenue = null;
let chartMarginProfit = null;
let chartSalesProfitRegion = null;

// Sample data structure (replace with actual API calls)
const analyticsData = {
    salesByRegion: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
            {
                label: 'North',
                data: [45000, 52000, 48000, 61000, 55000, 67000, 71000, 69000, 73000, 78000, 82000, 95000],
                backgroundColor: '#FF8C42'
            },
            {
                label: 'South',
                data: [38000, 42000, 45000, 49000, 52000, 58000, 62000, 64000, 68000, 71000, 75000, 82000],
                backgroundColor: '#8B6F47'
            },
            {
                label: 'East',
                data: [32000, 35000, 38000, 42000, 45000, 49000, 53000, 56000, 59000, 63000, 67000, 74000],
                backgroundColor: '#FFB380'
            },
            {
                label: 'West',
                data: [28000, 31000, 34000, 37000, 40000, 44000, 47000, 50000, 53000, 57000, 61000, 68000],
                backgroundColor: '#A68A64'
            },
            {
                label: 'Central',
                data: [41000, 44000, 47000, 51000, 54000, 59000, 63000, 66000, 70000, 74000, 78000, 86000],
                backgroundColor: '#6D5738'
            }
        ]
    },

    actualVsPlan: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        plan: [180000, 190000, 200000, 210000, 220000, 235000, 250000, 260000, 275000, 290000, 305000, 330000],
        actual: [184000, 204000, 212000, 240000, 246000, 277000, 296000, 305000, 323000, 343000, 363000, 405000]
    },

    marginByCategory: {
        revenue: {
            labels: ['Coffee', 'Pastries', 'Sandwiches', 'Beverages', 'Others'],
            data: [450000, 280000, 320000, 180000, 120000],
            backgroundColor: ['#FF8C42', '#8B6F47', '#FFB380', '#A68A64', '#6D5738']
        },
        profit: {
            labels: ['Coffee', 'Pastries', 'Sandwiches', 'Beverages', 'Others'],
            data: [315000, 168000, 192000, 108000, 72000],
            backgroundColor: ['#FF8C42', '#8B6F47', '#FFB380', '#A68A64', '#6D5738']
        }
    },

    salesProfitByRegion: {
        labels: ['North', 'South', 'East', 'West', 'Central'],
        sales: [796000, 706000, 618000, 550000, 728000],
        profit: [557200, 494200, 432600, 385000, 509600]
    },

    crosstabData: [
        { category: 'Coffee', north: 180000, south: 165000, east: 142000, west: 128000, central: 175000 },
        { category: 'Pastries', north: 95000, south: 88000, east: 76000, west: 69000, central: 92000 },
        { category: 'Sandwiches', north: 112000, south: 102000, east: 89000, west: 81000, central: 106000 },
        { category: 'Beverages', north: 68000, south: 61000, east: 53000, west: 48000, central: 64000 },
        { category: 'Others', north: 52000, south: 47000, east: 41000, west: 37000, central: 49000 }
    ],

    varianceData: [
        { month: 'Jan', plan: 180000, actual: 184000, profit: 128800 },
        { month: 'Feb', plan: 190000, actual: 204000, profit: 142800 },
        { month: 'Mar', plan: 200000, actual: 212000, profit: 148400 },
        { month: 'Apr', plan: 210000, actual: 240000, profit: 168000 },
        { month: 'May', plan: 220000, actual: 246000, profit: 172200 },
        { month: 'Jun', plan: 235000, actual: 277000, profit: 193900 },
        { month: 'Jul', plan: 250000, actual: 296000, profit: 207200 },
        { month: 'Aug', plan: 260000, actual: 305000, profit: 213500 },
        { month: 'Sep', plan: 275000, actual: 323000, profit: 226100 },
        { month: 'Oct', plan: 290000, actual: 343000, profit: 240100 },
        { month: 'Nov', plan: 305000, actual: 363000, profit: 254100 },
        { month: 'Dec', plan: 330000, actual: 405000, profit: 283500 }
    ]
};

/**
 * Initialize Analytics Dashboard
 */
function initializeAnalyticsDashboard() {
    console.log('Initializing Analytics Dashboard...');

    // Update KPIs
    updateKPIs();

    // Render all charts
    renderSalesByRegionChart();
    renderActualVsPlanChart();
    renderMarginCharts();
    renderSalesProfitRegionChart();

    // Render tables
    renderCrosstabTable();
    renderVarianceTable();

    console.log('Analytics Dashboard initialized successfully');
}

/**
 * Update KPI Cards
 */
function updateKPIs() {
    // Calculate totals
    const totalRevenue = analyticsData.varianceData.reduce((sum, item) => sum + item.actual, 0);
    const totalProfit = analyticsData.varianceData.reduce((sum, item) => sum + item.profit, 0);
    const avgMargin = (totalProfit / totalRevenue * 100).toFixed(1);
    const totalOrders = 12850; // Sample data

    // Update KPI values
    document.getElementById('kpi-revenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('kpi-profit').textContent = formatCurrency(totalProfit);
    document.getElementById('kpi-margin').textContent = avgMargin + '%';
    document.getElementById('kpi-orders').textContent = totalOrders.toLocaleString();

    // Update changes (sample comparison with previous period)
    updateKPIChange('kpi-revenue-change', 15.2, true);
    updateKPIChange('kpi-profit-change', 18.5, true);
    updateKPIChange('kpi-margin-change', 2.1, true);
    updateKPIChange('kpi-orders-change', 12.8, true);
}

/**
 * Update KPI Change Indicator
 */
function updateKPIChange(elementId, percent, isPositive) {
    const element = document.getElementById(elementId);
    const arrow = isPositive ? '↑' : '↓';
    const className = isPositive ? 'up' : 'down';

    element.className = `kpi-change ${className}`;
    element.innerHTML = `<span>${arrow}</span> <span>${Math.abs(percent).toFixed(1)}%</span> vs last period`;
}

/**
 * Render Yearly Sales by Region (Stacked Bar Chart)
 */
function renderSalesByRegionChart() {
    const ctx = document.getElementById('chart-sales-by-region');
    if (!ctx) return;

    // Destroy existing chart
    if (chartSalesByRegion) {
        chartSalesByRegion.destroy();
    }

    chartSalesByRegion = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: analyticsData.salesByRegion.labels,
            datasets: analyticsData.salesByRegion.datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.5,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        padding: 15,
                        font: { size: 11, weight: '600' },
                        color: '#616161'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 13, weight: '600' },
                    bodyFont: { size: 12 },
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: { display: false },
                    ticks: { font: { size: 11 }, color: '#757575' }
                },
                y: {
                    stacked: true,
                    grid: { color: '#EEEEEE', drawBorder: false },
                    ticks: {
                        font: { size: 11 },
                        color: '#757575',
                        callback: function(value) {
                            return '₱' + (value / 1000) + 'K';
                        }
                    }
                }
            }
        }
    });
}

/**
 * Render Actual vs Plan (Line Chart)
 */
function renderActualVsPlanChart() {
    const ctx = document.getElementById('chart-actual-vs-plan');
    if (!ctx) return;

    if (chartActualVsPlan) {
        chartActualVsPlan.destroy();
    }

    chartActualVsPlan = new Chart(ctx, {
        type: 'line',
        data: {
            labels: analyticsData.actualVsPlan.labels,
            datasets: [
                {
                    label: 'Plan',
                    data: analyticsData.actualVsPlan.plan,
                    borderColor: '#BDBDBD',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 4,
                    pointBackgroundColor: '#BDBDBD',
                    tension: 0.4
                },
                {
                    label: 'Actual',
                    data: analyticsData.actualVsPlan.actual,
                    borderColor: '#FF8C42',
                    backgroundColor: 'rgba(255, 140, 66, 0.1)',
                    borderWidth: 3,
                    pointRadius: 5,
                    pointBackgroundColor: '#FF8C42',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.5,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        padding: 15,
                        font: { size: 11, weight: '600' },
                        color: '#616161'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 13, weight: '600' },
                    bodyFont: { size: 12 },
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 11 }, color: '#757575' }
                },
                y: {
                    grid: { color: '#EEEEEE', drawBorder: false },
                    ticks: {
                        font: { size: 11 },
                        color: '#757575',
                        callback: function(value) {
                            return '₱' + (value / 1000) + 'K';
                        }
                    }
                }
            }
        }
    });
}

/**
 * Render Gross Margin Donut Charts
 */
function renderMarginCharts() {
    // Revenue Donut
    const ctxRevenue = document.getElementById('chart-margin-revenue');
    if (ctxRevenue) {
        if (chartMarginRevenue) chartMarginRevenue.destroy();

        chartMarginRevenue = new Chart(ctxRevenue, {
            type: 'doughnut',
            data: {
                labels: analyticsData.marginByCategory.revenue.labels,
                datasets: [{
                    data: analyticsData.marginByCategory.revenue.data,
                    backgroundColor: analyticsData.marginByCategory.revenue.backgroundColor,
                    borderWidth: 0
                }]
            },
            options: getDoughnutOptions()
        });
    }

    // Profit Donut
    const ctxProfit = document.getElementById('chart-margin-profit');
    if (ctxProfit) {
        if (chartMarginProfit) chartMarginProfit.destroy();

        chartMarginProfit = new Chart(ctxProfit, {
            type: 'doughnut',
            data: {
                labels: analyticsData.marginByCategory.profit.labels,
                datasets: [{
                    data: analyticsData.marginByCategory.profit.data,
                    backgroundColor: analyticsData.marginByCategory.profit.backgroundColor,
                    borderWidth: 0
                }]
            },
            options: getDoughnutOptions()
        });
    }
}

/**
 * Get Doughnut Chart Options
 */
function getDoughnutOptions() {
    return {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                display: true,
                position: 'bottom',
                labels: {
                    boxWidth: 12,
                    padding: 10,
                    font: { size: 10, weight: '500' },
                    color: '#616161'
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleFont: { size: 13, weight: '600' },
                bodyFont: { size: 12 },
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = formatCurrency(context.parsed);
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((context.parsed / total) * 100).toFixed(1);
                        return label + ': ' + value + ' (' + percentage + '%)';
                    }
                }
            }
        },
        cutout: '65%'
    };
}

/**
 * Render Sales & Profit by Region (Horizontal Stacked Bar)
 */
function renderSalesProfitRegionChart() {
    const ctx = document.getElementById('chart-sales-profit-region');
    if (!ctx) return;

    if (chartSalesProfitRegion) {
        chartSalesProfitRegion.destroy();
    }

    chartSalesProfitRegion = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: analyticsData.salesProfitByRegion.labels,
            datasets: [
                {
                    label: 'Sales',
                    data: analyticsData.salesProfitByRegion.sales,
                    backgroundColor: '#FF8C42'
                },
                {
                    label: 'Profit',
                    data: analyticsData.salesProfitByRegion.profit,
                    backgroundColor: '#8B6F47'
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.2,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        padding: 15,
                        font: { size: 11, weight: '600' },
                        color: '#616161'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 13, weight: '600' },
                    bodyFont: { size: 12 },
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.x);
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: false,
                    grid: { color: '#EEEEEE', drawBorder: false },
                    ticks: {
                        font: { size: 11 },
                        color: '#757575',
                        callback: function(value) {
                            return '₱' + (value / 1000) + 'K';
                        }
                    }
                },
                y: {
                    stacked: false,
                    grid: { display: false },
                    ticks: { font: { size: 11 }, color: '#757575' }
                }
            }
        }
    });
}

/**
 * Render Crosstab Table
 */
function renderCrosstabTable() {
    const tbody = document.getElementById('tbody-crosstab');
    if (!tbody) return;

    let html = '';
    let totals = { north: 0, south: 0, east: 0, west: 0, central: 0 };

    analyticsData.crosstabData.forEach(row => {
        const rowTotal = row.north + row.south + row.east + row.west + row.central;

        totals.north += row.north;
        totals.south += row.south;
        totals.east += row.east;
        totals.west += row.west;
        totals.central += row.central;

        html += `
            <tr>
                <td><strong>${row.category}</strong></td>
                <td class="cell-currency">${formatCurrency(row.north)}</td>
                <td class="cell-currency">${formatCurrency(row.south)}</td>
                <td class="cell-currency">${formatCurrency(row.east)}</td>
                <td class="cell-currency">${formatCurrency(row.west)}</td>
                <td class="cell-currency">${formatCurrency(row.central)}</td>
                <td class="cell-currency"><strong>${formatCurrency(rowTotal)}</strong></td>
            </tr>
        `;
    });

    // Add totals row
    const grandTotal = totals.north + totals.south + totals.east + totals.west + totals.central;
    html += `
        <tr class="cell-total">
            <td><strong>Total</strong></td>
            <td class="cell-currency"><strong>${formatCurrency(totals.north)}</strong></td>
            <td class="cell-currency"><strong>${formatCurrency(totals.south)}</strong></td>
            <td class="cell-currency"><strong>${formatCurrency(totals.east)}</strong></td>
            <td class="cell-currency"><strong>${formatCurrency(totals.west)}</strong></td>
            <td class="cell-currency"><strong>${formatCurrency(totals.central)}</strong></td>
            <td class="cell-currency"><strong>${formatCurrency(grandTotal)}</strong></td>
        </tr>
    `;

    tbody.innerHTML = html;
}

/**
 * Render Variance Table
 */
function renderVarianceTable() {
    const tbody = document.getElementById('tbody-variance');
    if (!tbody) return;

    let html = '';
    let totals = { plan: 0, actual: 0, variance: 0, profit: 0 };

    analyticsData.varianceData.forEach(row => {
        const variance = row.actual - row.plan;
        const variancePercent = (variance / row.plan * 100);

        totals.plan += row.plan;
        totals.actual += row.actual;
        totals.variance += variance;
        totals.profit += row.profit;

        const varianceClass = variance >= 0 ? 'positive' : 'negative';
        const varianceBadge = variance >= 0 ? 'positive' : 'negative';

        html += `
            <tr>
                <td><strong>${row.month}</strong></td>
                <td class="cell-currency">${formatCurrency(row.plan)}</td>
                <td class="cell-currency">${formatCurrency(row.actual)}</td>
                <td class="cell-currency cell-${varianceClass}">${formatCurrency(variance)}</td>
                <td class="cell-percent">
                    <span class="variance-badge ${varianceBadge}">
                        ${variancePercent >= 0 ? '+' : ''}${variancePercent.toFixed(1)}%
                    </span>
                </td>
                <td class="cell-currency">${formatCurrency(row.profit)}</td>
            </tr>
        `;
    });

    // Add totals row
    const totalVariancePercent = (totals.variance / totals.plan * 100);
    const totalVarianceClass = totals.variance >= 0 ? 'positive' : 'negative';
    const totalVarianceBadge = totals.variance >= 0 ? 'positive' : 'negative';

    html += `
        <tr class="cell-total">
            <td><strong>Total</strong></td>
            <td class="cell-currency"><strong>${formatCurrency(totals.plan)}</strong></td>
            <td class="cell-currency"><strong>${formatCurrency(totals.actual)}</strong></td>
            <td class="cell-currency cell-${totalVarianceClass}"><strong>${formatCurrency(totals.variance)}</strong></td>
            <td class="cell-percent">
                <span class="variance-badge ${totalVarianceBadge}">
                    <strong>${totalVariancePercent >= 0 ? '+' : ''}${totalVariancePercent.toFixed(1)}%</strong>
                </span>
            </td>
            <td class="cell-currency"><strong>${formatCurrency(totals.profit)}</strong></td>
        </tr>
    `;

    tbody.innerHTML = html;
}

/**
 * Refresh Dashboard
 */
function refreshAnalyticsDashboard() {
    console.log('Refreshing Analytics Dashboard...');

    // In a real implementation, fetch new data based on filters
    const year = document.getElementById('analytics-year-filter').value;
    const quarter = document.getElementById('analytics-quarter-filter').value;
    const region = document.getElementById('analytics-region-filter').value;

    console.log(`Filters: Year=${year}, Quarter=${quarter}, Region=${region}`);

    // Re-initialize with filtered data
    initializeAnalyticsDashboard();
}

/**
 * Export Table to CSV
 */
function exportTableToCSV(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    let csv = [];
    const rows = table.querySelectorAll('tr');

    rows.forEach(row => {
        const cols = row.querySelectorAll('td, th');
        const csvRow = [];
        cols.forEach(col => {
            // Remove HTML tags and get text content
            let text = col.textContent.trim();
            // Escape quotes
            text = text.replace(/"/g, '""');
            csvRow.push('"' + text + '"');
        });
        csv.push(csvRow.join(','));
    });

    // Download CSV
    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = tableId + '_' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

/**
 * Format Currency
 */
function formatCurrency(value) {
    return '₱' + value.toLocaleString('en-PH', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

/**
 * Auto-initialize when script loads (if on analytics dashboard)
 */
document.addEventListener('DOMContentLoaded', function() {
    // Check if analytics dashboard is visible
    const analyticsDashboard = document.getElementById('analytics-dashboard-content');
    if (analyticsDashboard && !analyticsDashboard.classList.contains('hidden')) {
        initializeAnalyticsDashboard();
    }
});
