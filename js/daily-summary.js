/**
 * Daily Summary Manager
 * Handles automatic daily snapshots and report generation
 */

// Check if we need to save yesterday's data
function checkAndSavePreviousDay() {
    const lastSavedDate = localStorage.getItem('lastDailySummaryDate');
    const today = new Date().toISOString().split('T')[0];

    if (lastSavedDate && lastSavedDate !== today) {
        // New day detected - save yesterday's summary
        console.log('New day detected. Saving summary for:', lastSavedDate);
        saveDailySnapshot(lastSavedDate);
    }

    // Update last saved date
    localStorage.setItem('lastDailySummaryDate', today);
}

// Save daily snapshot to database
async function saveDailySnapshot(date) {
    try {
        const formData = new FormData();
        formData.append('action', 'save_daily_snapshot');
        formData.append('date', date);

        const response = await fetch('php/daily-summary-api.php', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            console.log('Daily snapshot saved:', result.date);
        } else {
            console.error('Failed to save daily snapshot:', result.message);
        }
    } catch (error) {
        console.error('Error saving daily snapshot:', error);
    }
}

// Get today's summary
async function getTodaySummary() {
    try {
        const response = await fetch('php/daily-summary-api.php?action=get_today_summary');
        const result = await response.json();

        if (result.success) {
            updateDailySummaryDisplay(result);
        }
    } catch (error) {
        console.error('Error fetching today summary:', error);
    }
}

// Update the daily summary display
function updateDailySummaryDisplay(data) {
    const summary = data.summary;
    const itemSales = data.item_sales;

    // Update total sales
    const totalSalesEl = document.getElementById('dailySalesTotal');
    if (totalSalesEl) {
        totalSalesEl.textContent = parseFloat(summary.total_sales || 0).toFixed(2);
    }

    // Update orders table
    const ordersTable = document.getElementById('daily-orders-summary');
    if (ordersTable) {
        const tbody = ordersTable.querySelector('tbody');
        if (summary.transaction_count > 0) {
            // Fetch individual transactions for display
            fetchTodayTransactions(tbody);
        } else {
            tbody.innerHTML = '<tr><td colspan="3">No orders for today.</td></tr>';
        }
    }

    // Update items table
    const itemsTable = document.getElementById('daily-item-summary');
    if (itemsTable) {
        const tbody = itemsTable.querySelector('tbody');
        if (itemSales && itemSales.length > 0) {
            tbody.innerHTML = itemSales.map(item => `
                <tr>
                    <td>${escapeHtml(item.product_name)}</td>
                    <td>${item.quantity_sold}</td>
                    <td>₱${parseFloat(item.total_revenue).toFixed(2)}</td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="3">No items sold today.</td></tr>';
        }
    }
}

// Fetch today's transactions for display
async function fetchTodayTransactions(tbody) {
    try {
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`php/api.php?resource=sales-transactions&action=list&date=${today}`);
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            tbody.innerHTML = result.data.map(tx => `
                <tr>
                    <td>${escapeHtml(tx.reference)}</td>
                    <td>${tx.items ? tx.items.length : 0}</td>
                    <td>₱${parseFloat(tx.total).toFixed(2)}</td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="3">No orders for today.</td></tr>';
        }
    } catch (error) {
        console.error('Error fetching transactions:', error);
        tbody.innerHTML = '<tr><td colspan="3">Error loading orders.</td></tr>';
    }
}

// Generate X-Read report
async function generateXRead() {
    try {
        const response = await fetch('php/daily-summary-api.php?action=generate_xread');
        const result = await response.json();

        if (result.success) {
            displayReportDialog('X-Read Report', result);
        } else {
            alert('Error generating X-Read: ' + result.message);
        }
    } catch (error) {
        console.error('Error generating X-Read:', error);
        alert('Failed to generate X-Read report');
    }
}

// Generate Z-Read report
async function generateZRead() {
    if (!confirm('Generate Z-Read and finalize today\'s sales?\n\nThis action cannot be undone. The daily report will be saved permanently.')) {
        return;
    }

    try {
        const response = await fetch('php/daily-summary-api.php?action=generate_zread', {
            method: 'POST'
        });
        const result = await response.json();

        if (result.success) {
            displayReportDialog('Z-Read Report (Finalized)', result);
            alert('Z-Read generated successfully!\n\nDaily report has been finalized and saved.');
        } else {
            alert('Error generating Z-Read: ' + result.message);
        }
    } catch (error) {
        console.error('Error generating Z-Read:', error);
        alert('Failed to generate Z-Read report');
    }
}

// Display report dialog
function displayReportDialog(title, data) {
    const summary = data.summary;
    const itemSales = data.item_sales || [];

    const reportHTML = `
        <div style="max-width: 600px; padding: 20px;">
            <h2 style="text-align: center; margin-bottom: 20px;">${title}</h2>
            <p style="text-align: center; color: #666;">Date: ${data.date}</p>

            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3>📊 Sales Summary</h3>
                <table style="width: 100%; margin-top: 10px;">
                    <tr><td>Total Transactions:</td><td style="text-align: right;"><strong>${summary.transaction_count}</strong></td></tr>
                    <tr><td>Total Items Sold:</td><td style="text-align: right;"><strong>${summary.total_items_sold}</strong></td></tr>
                    <tr><td>Total Sales:</td><td style="text-align: right;"><strong>₱${parseFloat(summary.total_sales || 0).toFixed(2)}</strong></td></tr>
                    <tr><td>Total Discount:</td><td style="text-align: right;">-₱${parseFloat(summary.total_discount || 0).toFixed(2)}</td></tr>
                    <tr><td>Total VAT:</td><td style="text-align: right;">₱${parseFloat(summary.total_vat || 0).toFixed(2)}</td></tr>
                    <tr><td>Average Transaction:</td><td style="text-align: right;">₱${parseFloat(summary.average_transaction || 0).toFixed(2)}</td></tr>
                </table>
            </div>

            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3>💳 Payment Methods</h3>
                <table style="width: 100%; margin-top: 10px;">
                    <tr><td>Cash:</td><td style="text-align: right;">₱${parseFloat(summary.cash_sales || 0).toFixed(2)}</td></tr>
                    <tr><td>Card:</td><td style="text-align: right;">₱${parseFloat(summary.card_sales || 0).toFixed(2)}</td></tr>
                    <tr><td>GCash:</td><td style="text-align: right;">₱${parseFloat(summary.gcash_sales || 0).toFixed(2)}</td></tr>
                </table>
            </div>

            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3>🕐 Operating Hours</h3>
                <table style="width: 100%; margin-top: 10px;">
                    <tr><td>First Sale:</td><td style="text-align: right;">${summary.opening_time || 'N/A'}</td></tr>
                    <tr><td>Last Sale:</td><td style="text-align: right;">${summary.closing_time || 'N/A'}</td></tr>
                </table>
            </div>

            <button onclick="window.print()" style="width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; margin-top: 20px;">
                Print Report
            </button>
        </div>
    `;

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px;">
            ${reportHTML}
            <button onclick="this.closest('.modal-overlay').remove()" style="width: 100%; padding: 12px; background: #6c757d; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; margin-top: 10px;">
                Close
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Auto-save every hour
setInterval(() => {
    const today = new Date().toISOString().split('T')[0];
    saveDailySnapshot(today);
}, 60 * 60 * 1000); // Every hour

// Check on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAndSavePreviousDay();

    // Refresh summary if on daily summary page
    if (document.getElementById('daily-content')) {
        getTodaySummary();
    }
});

// Export functions for global use
window.generateXRead = generateXRead;
window.generateZRead = generateZRead;
window.getTodaySummary = getTodaySummary;
