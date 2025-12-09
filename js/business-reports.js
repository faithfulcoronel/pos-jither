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
        currentReportsFilter.fromDate = fromDateInput ? fromDateInput.value : null;
        currentReportsFilter.toDate = toDateInput ? toDateInput.value : null;
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
 * Update summary cards
 */
function updateReportsSummary(summary) {
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
 * Generate PDF report (placeholder)
 */
function generateReportPDF() {
    alert('PDF export functionality will be implemented soon!\n\nThis will export the current reports data to a PDF file.');
}

/**
 * Generate Excel report (placeholder)
 */
function generateReportExcel() {
    alert('Excel export functionality will be implemented soon!\n\nThis will export the current reports data to an Excel file.');
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

    const labels = businessReportsData.map(report => {
        const date = new Date(report.report_date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const salesData = businessReportsData.map(report => parseFloat(report.total_sales) || 0);

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
