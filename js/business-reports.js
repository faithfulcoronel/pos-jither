/**
 * Business Reports Dashboard JavaScript
 * Handles loading and displaying historical business reports
 */

let businessReportsData = [];
let businessReportsCharts = {};
let currentReportsFilter = {
    period: 30,
    fromDate: null,
    toDate: null,
    status: 'all'
};
let detailedInsights = {
    salesSummary: null,
    todaySummary: null
};
let currentExpenses = 0;
let currentSummary = {};

function normalizeDateInput(value) {
    if (!value) return null;
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) return null;
    return parsed.toISOString().split('T')[0];
}

/**
 * Initialize Business Reports Dashboard
 */
function initializeBusinessReports() {
    console.log('Initializing Business Reports Dashboard...');

    // Set default dates
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const toDateInput = document.getElementById('reports-to-date');
    const fromDateInput = document.getElementById('reports-from-date');

    if (toDateInput) {
        toDateInput.value = today.toISOString().split('T')[0];
        toDateInput.max = today.toISOString().split('T')[0];
    }

    if (fromDateInput) {
        fromDateInput.value = thirtyDaysAgo.toISOString().split('T')[0];
        fromDateInput.max = today.toISOString().split('T')[0];
    }

    // Load reports
    loadBusinessReports();
}

/**
 * Load business reports from database
 */
async function loadBusinessReports() {
    try {
        showReportsLoading();

        // Get filter values
        const periodSelect = document.getElementById('reports-period-filter');
        const fromDateInput = document.getElementById('reports-from-date');
        const toDateInput = document.getElementById('reports-to-date');
        const statusSelect = document.getElementById('reports-status-filter');

        currentReportsFilter.period = periodSelect ? parseInt(periodSelect.value) : 30;

        const normalizedFrom = normalizeDateInput(fromDateInput ? fromDateInput.value : null);
        const normalizedTo = normalizeDateInput(toDateInput ? toDateInput.value : null);

        // Update inputs to normalized format to ensure API receives yyyy-mm-dd
        if (fromDateInput && normalizedFrom) fromDateInput.value = normalizedFrom;
        if (toDateInput && normalizedTo) toDateInput.value = normalizedTo;

        // If both dates are set and reversed, swap them
        if (normalizedFrom && normalizedTo && new Date(normalizedFrom) > new Date(normalizedTo)) {
            currentReportsFilter.fromDate = normalizedTo;
            currentReportsFilter.toDate = normalizedFrom;
            if (fromDateInput) fromDateInput.value = currentReportsFilter.fromDate;
            if (toDateInput) toDateInput.value = currentReportsFilter.toDate;
        } else {
            currentReportsFilter.fromDate = normalizedFrom;
            currentReportsFilter.toDate = normalizedTo;
        }

        currentReportsFilter.status = statusSelect ? statusSelect.value : 'all';

        // Build query parameters
        const params = new URLSearchParams();

        if (currentReportsFilter.fromDate && currentReportsFilter.toDate) {
            params.append('from_date', currentReportsFilter.fromDate);
            params.append('to_date', currentReportsFilter.toDate);
        } else {
            params.append('days', currentReportsFilter.period);
        }

        if (currentReportsFilter.status !== 'all') {
            params.append('status', currentReportsFilter.status);
        }

        // Fetch data
        const response = await fetch(`php/business-reports-api.php?action=get_reports&${params}`);
        const data = await response.json();

        if (data.success) {
            businessReportsData = data.reports || [];
            updateReportsSummary(data.summary || {});
            renderReportsTable();
            renderBusinessReportsCharts();
            await loadDetailedInsights();
            await loadInventoryExpensesAndProfit();
        } else {
            console.error('Failed to load business reports:', data.message);
            showReportsError(data.message);
        }
    } catch (error) {
        console.error('Error loading business reports:', error);
        showReportsError('Failed to load reports');
    }
}

/**
 * Load detailed insights from sales (View Sales) and daily summary
 */
async function loadDetailedInsights() {
    try {
        const start = currentReportsFilter.fromDate;
        const end = currentReportsFilter.toDate;

        const params = new URLSearchParams();
        if (start && end) {
            params.append('start_date', start);
            params.append('end_date', end);
        }

        const salesSummaryPromise = fetch(`php/sales-analytics-api.php?action=get_sales_summary&${params}`).then(r => r.json());
        const todaySummaryPromise = fetch('php/daily-summary-api.php?action=get_today_summary').then(r => r.json());

        const [salesSummary, todaySummary] = await Promise.all([salesSummaryPromise, todaySummaryPromise]);
        detailedInsights.salesSummary = salesSummary.success ? salesSummary.data : null;
        detailedInsights.todaySummary = todaySummary.success ? todaySummary.summary : null;

        renderDetailedReportNarrative();
    } catch (error) {
        console.error('Error loading detailed insights:', error);
        document.getElementById('reports-detailed-text').textContent = 'Unable to load detailed report.';
    }
}

/**
 * Render narrative report
 */
function renderDetailedReportNarrative() {
    const container = document.getElementById('reports-detailed-text');
    if (!container) return;

    const s = detailedInsights.salesSummary || {};
    const d = detailedInsights.todaySummary || {};
    const expenses = currentExpenses || 0;
    const profit = expenses - (s.total_sales || 0);

    const sections = [
        `Executive Summary\nRevenue ${formatCurrency(s.total_sales || 0)}; Net Sales ${formatCurrency(s.net_sales || s.total_sales || 0)}; Orders ${formatNumber(s.total_transactions || 0)}; AOV ${formatCurrency(s.avg_order_value || 0)}; Profit ${formatCurrency(profit)}.`,
        `Sales Trends\nPeriod revenue: ${formatCurrency(s.total_sales || 0)}. Orders: ${formatNumber(s.total_transactions || 0)}.`,
        `Product Performance\nTop categories and best sellers available in View Sales. Discounts applied: ${formatCurrency((s.total_sales || 0) - (s.net_sales || s.total_sales || 0))}.`,
        `Time-Based Analysis\nDaily summary today: sales ${formatCurrency(d.total_sales || 0)}, transactions ${formatNumber(d.transaction_count || 0)}, first sale ${d.opening_time || 'N/A'}, last sale ${d.closing_time || 'N/A'}.`,
        `Financial Metrics\nGross sales ${formatCurrency(s.total_sales || 0)}, net ${formatCurrency(s.net_sales || s.total_sales || 0)}, discounts ${formatCurrency(s.total_discount || 0)}, expenses (inventory) ${formatCurrency(expenses)}, profit ${formatCurrency(profit)}.`,
        `Payment Methods\nCash ${formatCurrency(s.cash_sales || 0)}, Card ${formatCurrency(s.card_sales || 0)}, e-Wallet ${formatCurrency(s.ewallet_sales || 0)}.`,
        `Customer Insights\nRetention and repeat behavior available via View Sales time-period comparison.`,
        `Inventory Status\nInventory value used as expenses: ${formatCurrency(expenses)}. Check Inventory module for low/out-of-stock items.`,
        `Staff Performance\nLink receipts/discounts to cashier/timekeeping logs for accountability.`,
        `Shift Reports\nX-Read/Z-Read available in Daily Summary; align filters here for consistent periods.`
    ];

    container.textContent = sections.join('\n\n');
}

/**
 * Update summary cards
 */
function updateReportsSummary(summary) {
    currentSummary = summary || {};
    document.getElementById('reports-total-sales').textContent = formatCurrency(summary.total_sales || 0);
    document.getElementById('reports-total-transactions').textContent = formatNumber(summary.total_transactions || 0);
    document.getElementById('reports-total-items').textContent = formatNumber(summary.total_items || 0);
    document.getElementById('reports-avg-order').textContent = formatCurrency(summary.average_order || 0);

    // Update change indicators (you can calculate this based on previous period)
    const salesChange = summary.sales_change || 0;
    const transactionsChange = summary.transactions_change || 0;
    const itemsChange = summary.items_change || 0;
    const avgChange = summary.avg_change || 0;

    updateChangeIndicator('reports-sales-change', salesChange);
    updateChangeIndicator('reports-transactions-change', transactionsChange);
    updateChangeIndicator('reports-items-change', itemsChange);
    updateChangeIndicator('reports-avg-change', avgChange);

    // Expenses and profit are handled after inventory fetch
    const expensesEl = document.getElementById('reports-total-expenses');
    const profitEl = document.getElementById('reports-total-profit');
    if (expensesEl) expensesEl.textContent = formatCurrency(currentExpenses);
    if (profitEl) profitEl.textContent = formatCurrency(currentExpenses - (summary.total_sales || 0));
}

/**
 * Update change indicator
 */
function updateChangeIndicator(elementId, changePercent) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const isPositive = changePercent >= 0;
    element.className = `reports-card-change ${isPositive ? 'positive' : 'negative'}`;
    element.textContent = `${isPositive ? '↑' : '↓'} ${Math.abs(changePercent).toFixed(1)}%`;
}

/**
 * Render reports table
 */
function renderReportsTable() {
    const tbody = document.querySelector('#businessReportsTable tbody');
    if (!tbody) return;

    if (businessReportsData.length === 0) {
        tbody.innerHTML = `
            <tr class="reports-empty-row">
                <td colspan="9">
                    <div class="reports-empty-state">
                        <div class="reports-empty-icon">📊</div>
                        <h3>No Reports Found</h3>
                        <p>No business reports available for the selected period</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    businessReportsData.forEach(report => {
        const statusBadge = report.is_finalized
            ? '<span class="reports-badge reports-badge-finalized">🔒 Finalized</span>'
            : '<span class="reports-badge reports-badge-open">📖 Open</span>';

        const cardGcash = parseFloat(report.card_sales || 0) + parseFloat(report.gcash_sales || 0);

        html += `
            <tr>
                <td><strong>${formatReportDate(report.report_date)}</strong></td>
                <td><strong>${formatCurrency(report.total_sales)}</strong></td>
                <td>${formatNumber(report.total_transactions)}</td>
                <td>${formatNumber(report.total_items_sold)}</td>
                <td>${formatCurrency(report.average_transaction)}</td>
                <td>${formatCurrency(report.cash_sales)}</td>
                <td>${formatCurrency(cardGcash)}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="reports-action-btn" onclick="viewReportDetails('${report.report_date}')">
                        👁️ View
                    </button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

/**
 * Export detailed narrative text
 */
function downloadDetailedReport() {
    const textEl = document.getElementById('reports-detailed-text');
    if (!textEl) return;
    const blob = new Blob([textEl.textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business_report_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Fetch inventory and compute expenses + profit
 */
async function loadInventoryExpensesAndProfit() {
    try {
        const response = await fetch('php/api.php?resource=inventory-with-cost');
        const result = await response.json();
        if (result.success) {
            const items = result.data.inventory || [];
            currentExpenses = items.reduce((sum, item) => {
                const qty = Number(item.qty ?? item.quantity ?? 0);
                const cost = Number(item.costPerUnit ?? item.cost_per_unit ?? 0);
                return sum + qty * cost;
            }, 0);
        } else {
            currentExpenses = 0;
        }
    } catch (error) {
        console.error('Error loading inventory expenses:', error);
        currentExpenses = 0;
    }

    const expensesEl = document.getElementById('reports-total-expenses');
    const profitEl = document.getElementById('reports-total-profit');
    const totalSales = currentSummary.total_sales || (businessReportsData || []).reduce((sum, r) => sum + (parseFloat(r.total_sales) || 0), 0);
    const profit = currentExpenses - totalSales;
    if (expensesEl) expensesEl.textContent = formatCurrency(currentExpenses);
    if (profitEl) profitEl.textContent = formatCurrency(profit);
}

/**
 * View report details
 */
function viewReportDetails(date) {
    const report = businessReportsData.find(r => r.report_date === date);
    if (!report) return;

    const cardGcash = parseFloat(report.card_sales || 0) + parseFloat(report.gcash_sales || 0);

    const reportHTML = `
        <div style="max-width: 700px; padding: 30px;">
            <h2 style="text-align: center; margin-bottom: 10px; color: #667eea;">Daily Business Report</h2>
            <p style="text-align: center; color: #666; margin-bottom: 30px;">
                <strong>${formatReportDate(report.report_date)}</strong>
                ${report.is_finalized ? '<span style="color: #10B981; margin-left: 10px;">🔒 Finalized (Z-Read)</span>' : '<span style="color: #3B82F6; margin-left: 10px;">📖 Open (X-Read)</span>'}
            </p>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <h3 style="margin-bottom: 15px; color: #374151;">📊 Sales Summary</h3>
                <table style="width: 100%;">
                    <tr><td>Total Sales:</td><td style="text-align: right;"><strong>${formatCurrency(report.total_sales)}</strong></td></tr>
                    <tr><td>Total Transactions:</td><td style="text-align: right;"><strong>${formatNumber(report.total_transactions)}</strong></td></tr>
                    <tr><td>Total Items Sold:</td><td style="text-align: right;"><strong>${formatNumber(report.total_items_sold)}</strong></td></tr>
                    <tr><td>Average Transaction:</td><td style="text-align: right;">${formatCurrency(report.average_transaction)}</td></tr>
                    <tr><td>Total Discount:</td><td style="text-align: right; color: #EF4444;">-${formatCurrency(report.total_discount)}</td></tr>
                    <tr><td>Total VAT:</td><td style="text-align: right;">${formatCurrency(report.total_vat)}</td></tr>
                </table>
            </div>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <h3 style="margin-bottom: 15px; color: #374151;">💳 Payment Methods</h3>
                <table style="width: 100%;">
                    <tr><td>Cash:</td><td style="text-align: right;">${formatCurrency(report.cash_sales)}</td></tr>
                    <tr><td>Card:</td><td style="text-align: right;">${formatCurrency(report.card_sales)}</td></tr>
                    <tr><td>GCash:</td><td style="text-align: right;">${formatCurrency(report.gcash_sales)}</td></tr>
                </table>
            </div>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 12px;">
                <h3 style="margin-bottom: 15px; color: #374151;">🕐 Operating Hours</h3>
                <table style="width: 100%;">
                    <tr><td>Opening (First Sale):</td><td style="text-align: right;">${formatDateTime(report.opening_time)}</td></tr>
                    <tr><td>Closing (Last Sale):</td><td style="text-align: right;">${formatDateTime(report.closing_time)}</td></tr>
                </table>
            </div>

            <button onclick="closeReportModal()" style="width: 100%; padding: 14px; background: #667eea; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; margin-top: 20px; font-size: 16px;">
                Close
            </button>
        </div>
    `;

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'report-detail-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `<div class="modal-content">${reportHTML}</div>`;
    document.body.appendChild(modal);
}

/**
 * Close report modal
 */
function closeReportModal() {
    const modal = document.getElementById('report-detail-modal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Generate PDF report (simple printable view)
 * Builds a lightweight HTML table and opens the browser print-to-PDF dialog.
 */
function generateReportPDF() {
    if (!businessReportsData || businessReportsData.length === 0) {
        alert('No report data to export.');
        return;
    }

    const rows = businessReportsData.map(r => `
        <tr>
            <td>${formatReportDate(r.report_date)}</td>
            <td>${formatCurrency(r.total_sales)}</td>
            <td>${formatNumber(r.total_transactions)}</td>
            <td>${formatNumber(r.total_items_sold)}</td>
            <td>${formatCurrency(r.average_transaction)}</td>
            <td>${formatCurrency(r.cash_sales)}</td>
            <td>${formatCurrency((parseFloat(r.card_sales || 0) + parseFloat(r.gcash_sales || 0)))}</td>
            <td>${r.is_finalized ? 'Finalized' : 'Open'}</td>
        </tr>
    `).join('');

    const html = `
        <html>
        <head>
            <title>Business Reports</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
                h1 { margin-bottom: 8px; }
                h2 { margin: 4px 0 16px; font-size: 14px; color: #6B7280; }
                table { width: 100%; border-collapse: collapse; margin-top: 12px; }
                th, td { border: 1px solid #E5E7EB; padding: 8px; font-size: 12px; text-align: left; }
                th { background: #F3F4F6; }
            </style>
        </head>
        <body>
            <h1>Business Reports</h1>
            <h2>Exported on ${new Date().toLocaleString()}</h2>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Total Sales</th>
                        <th>Transactions</th>
                        <th>Items Sold</th>
                        <th>Avg Transaction</th>
                        <th>Cash</th>
                        <th>Card/GCash</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </body>
        </html>
    `;

    const win = window.open('', '_blank');
    if (win) {
        win.document.write(html);
        win.document.close();
        win.focus();
        win.print();
    } else {
        alert('Pop-up blocked. Please allow pop-ups to export PDF.');
    }
}

/**
 * Generate Excel/CSV export of report data
 */
function generateReportExcel() {
    if (!businessReportsData || businessReportsData.length === 0) {
        alert('No report data to export.');
        return;
    }

    const headers = [
        'Date',
        'Total Sales',
        'Transactions',
        'Items Sold',
        'Avg Transaction',
        'Cash',
        'Card/GCash',
        'Status'
    ];

    const rows = businessReportsData.map(r => ([
        formatReportDate(r.report_date),
        (r.total_sales || 0),
        (r.total_transactions || 0),
        (r.total_items_sold || 0),
        (r.average_transaction || 0),
        (r.cash_sales || 0),
        ((parseFloat(r.card_sales || 0) + parseFloat(r.gcash_sales || 0)) || 0),
        r.is_finalized ? 'Finalized' : 'Open'
    ]));

    const csv = [headers.join(',')]
        .concat(rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')))
        .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `business_reports_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Show loading state
 */
function showReportsLoading() {
    const tbody = document.querySelector('#businessReportsTable tbody');
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="9" style="text-align: center; padding: 60px;">
                <div class="reports-loading"></div>
                <p style="margin-top: 20px; color: #6B7280; font-weight: 500;">Loading reports...</p>
            </td>
        </tr>
    `;
}

/**
 * Show error message
 */
function showReportsError(message) {
    const tbody = document.querySelector('#businessReportsTable tbody');
    if (!tbody) return;

    tbody.innerHTML = `
        <tr class="reports-empty-row">
            <td colspan="9">
                <div class="reports-empty-state">
                    <div class="reports-empty-icon" style="color: #EF4444;">⚠️</div>
                    <h3>Error Loading Reports</h3>
                    <p>${escapeHtml(message)}</p>
                </div>
            </td>
        </tr>
    `;
}

/**
 * Format currency
 */
function formatCurrency(amount) {
    return '₱' + parseFloat(amount || 0).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * Format number
 */
function formatNumber(num) {
    return parseInt(num || 0).toLocaleString('en-PH');
}

/**
 * Format report date
 */
function formatReportDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Format date time
 */
function formatDateTime(datetimeString) {
    if (!datetimeString || datetimeString === '-') return '-';
    const date = new Date(datetimeString);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Render all charts for Business Reports
 */
function renderBusinessReportsCharts() {
    renderSalesTrendChart();
    renderPaymentMethodsChart();
    renderTransactionsChart();
    renderAverageOrderValueChart();
}

/**
 * Render Sales Trend Chart
 */
function renderSalesTrendChart() {
    const canvas = document.getElementById('business-reports-trend-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (businessReportsCharts.trend) {
        businessReportsCharts.trend.destroy();
    }

    const sorted = [...businessReportsData].sort((a, b) => new Date(a.report_date) - new Date(b.report_date));

    const labels = sorted.map(report => {
        const date = new Date(report.report_date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const salesData = sorted.map(report => parseFloat(report.total_sales) || 0);

    businessReportsCharts.trend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Sales',
                data: salesData,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
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
                    grid: { color: '#E9ECEF' },
                    ticks: {
                        callback: function(value) {
                            return '₱' + (value / 1000).toFixed(0) + 'K';
                        }
                    }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

/**
 * Render Payment Methods Chart
 */
function renderPaymentMethodsChart() {
    const canvas = document.getElementById('business-reports-payment-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (businessReportsCharts.payment) {
        businessReportsCharts.payment.destroy();
    }

    // Aggregate payment methods
    let cashTotal = 0;
    let cardTotal = 0;
    let gcashTotal = 0;

    businessReportsData.forEach(report => {
        cashTotal += parseFloat(report.cash_sales) || 0;
        cardTotal += parseFloat(report.card_sales) || 0;
        gcashTotal += parseFloat(report.gcash_sales) || 0;
    });

    businessReportsCharts.payment = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Cash', 'Card', 'GCash'],
            datasets: [{
                data: [cashTotal, cardTotal, gcashTotal],
                backgroundColor: ['#667eea', '#f093fb', '#4facfe'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: { size: 12, weight: '600' }
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
 * Render Transactions Volume Chart
 */
function renderTransactionsChart() {
    const canvas = document.getElementById('business-reports-transactions-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (businessReportsCharts.transactions) {
        businessReportsCharts.transactions.destroy();
    }

    const labels = businessReportsData.map(report => {
        const date = new Date(report.report_date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const transactionsData = businessReportsData.map(report => parseInt(report.total_transactions) || 0);

    businessReportsCharts.transactions = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Transactions',
                data: transactionsData,
                backgroundColor: '#f093fb',
                borderRadius: 6,
                barThickness: 30
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
                            return 'Transactions: ' + context.parsed.y;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#E9ECEF' },
                    ticks: {
                        stepSize: 10
                    }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

/**
 * Render Average Order Value Chart
 */
function renderAverageOrderValueChart() {
    const canvas = document.getElementById('business-reports-aov-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (businessReportsCharts.aov) {
        businessReportsCharts.aov.destroy();
    }

    const labels = businessReportsData.map(report => {
        const date = new Date(report.report_date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const aovData = businessReportsData.map(report => {
        const sales = parseFloat(report.total_sales) || 0;
        const transactions = parseInt(report.total_transactions) || 1;
        return transactions > 0 ? sales / transactions : 0;
    });

    businessReportsCharts.aov = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Avg Order Value',
                data: aovData,
                backgroundColor: '#4facfe',
                borderRadius: 6,
                barThickness: 30
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
                            return 'Avg Order: ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#E9ECEF' },
                    ticks: {
                        callback: function(value) {
                            return '₱' + value.toFixed(0);
                        }
                    }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

// Auto-initialize when in business reports section
document.addEventListener('DOMContentLoaded', function() {
    const reportContent = document.getElementById('report-content');
    if (reportContent && !reportContent.classList.contains('hidden')) {
        initializeBusinessReports();
    }
});

// Also initialize when switching to reports tab
document.addEventListener('click', function(e) {
    if (e.target.closest('[onclick*="report"]')) {
        setTimeout(initializeBusinessReports, 100);
    }
});
