/**
 * Staff Management - Timekeeping Records Viewer
 * Allows managers to view all employee attendance records by date
 */

let currentTimekeepingFilter = 'today';
let selectedTimekeepingDate = null;

/**
 * Initialize timekeeping date picker with today's date
 */
function initializeStaffTimekeeping() {
    const datePicker = document.getElementById('timekeeping-date-picker');
    if (datePicker) {
        const today = new Date();
        datePicker.value = today.toISOString().split('T')[0];
        datePicker.max = today.toISOString().split('T')[0]; // Prevent future dates
    }

    // Load today's records by default
    filterTimekeeping('today');
}

/**
 * Filter timekeeping records by predefined periods
 */
function filterTimekeeping(period) {
    currentTimekeepingFilter = period;
    selectedTimekeepingDate = null;

    // Update active filter button
    document.querySelectorAll('.staff-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Reset date picker
    const datePicker = document.getElementById('timekeeping-date-picker');
    if (datePicker && period === 'today') {
        const today = new Date();
        datePicker.value = today.toISOString().split('T')[0];
    }

    // Update title
    updateTimekeepingTitle(period);

    // Load records
    loadTimekeepingRecords(period, null);
}

/**
 * Load timekeeping records by selected date from calendar
 */
function loadTimekeepingByDate() {
    const datePicker = document.getElementById('timekeeping-date-picker');
    if (!datePicker || !datePicker.value) return;

    selectedTimekeepingDate = datePicker.value;
    currentTimekeepingFilter = 'custom';

    // Deactivate all filter buttons
    document.querySelectorAll('.staff-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Update title with selected date
    const date = new Date(selectedTimekeepingDate);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);

    const titleElement = document.getElementById('timekeeping-title');
    if (titleElement) {
        titleElement.textContent = `Timekeeping Records - ${formattedDate}`;
    }

    // Load records for specific date
    loadTimekeepingRecords('custom', selectedTimekeepingDate);
}

/**
 * Update timekeeping title based on filter
 */
function updateTimekeepingTitle(period) {
    const titleElement = document.getElementById('timekeeping-title');
    if (!titleElement) return;

    const titles = {
        'today': "Today's Timekeeping Records",
        'week': "This Week's Timekeeping Records",
        'month': "This Month's Timekeeping Records"
    };

    titleElement.textContent = titles[period] || "Timekeeping Records";
}

/**
 * Load timekeeping records from database
 */
async function loadTimekeepingRecords(period, date = null) {
    try {
        showTimekeepingLoading();

        // Build API URL
        let url = 'php/staff-timekeeping-api.php?action=get_all_records';

        if (date) {
            url += `&date=${date}`;
        } else {
            url += `&period=${period}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            renderTimekeepingRecords(data.records || []);
        } else {
            console.error('Failed to load timekeeping records:', data.message);
            showTimekeepingError(data.message);
        }
    } catch (error) {
        console.error('Error loading timekeeping records:', error);
        showTimekeepingError('Failed to load records');
    }
}

/**
 * Render timekeeping records in table
 */
function renderTimekeepingRecords(records) {
    const tbody = document.querySelector('#timekeepingRecordsTable tbody');
    if (!tbody) return;

    if (records.length === 0) {
        tbody.innerHTML = `
            <tr class="staff-empty-row">
                <td colspan="7">
                    <div class="staff-empty-state">
                        <div class="staff-empty-icon">🕒</div>
                        <h3>No Records Found</h3>
                        <p>No employee time records for this period</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    records.forEach(record => {
        const statusBadge = getStaffStatusBadge(record.status);
        html += `
            <tr>
                <td>${formatStaffDate(record.date)}</td>
                <td><strong>${escapeHtml(record.employee_name || '-')}</strong></td>
                <td>${escapeHtml(record.position || '-')}</td>
                <td><span class="time-badge">${formatStaffTime(record.time_in)}</span></td>
                <td><span class="time-badge">${formatStaffTime(record.time_out)}</span></td>
                <td><strong>${formatHours(record.hours_worked)}</strong></td>
                <td>${statusBadge}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

/**
 * Get status badge HTML
 */
function getStaffStatusBadge(status) {
    const badges = {
        'present': '<span class="staff-badge staff-badge-success">✓ Present</span>',
        'late': '<span class="staff-badge staff-badge-warning">⏰ Late</span>',
        'absent': '<span class="staff-badge staff-badge-danger">✕ Absent</span>',
        'half_day': '<span class="staff-badge staff-badge-info">◐ Half Day</span>',
        'on_time': '<span class="staff-badge staff-badge-success">✓ On Time</span>',
        'ongoing': '<span class="staff-badge staff-badge-info">⏳ Ongoing</span>'
    };
    return badges[status] || `<span class="staff-badge">${escapeHtml(status)}</span>`;
}

/**
 * Format date for display
 */
function formatStaffDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const options = { month: 'short', day: 'numeric', year: 'numeric', weekday: 'short' };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Format time for display
 */
function formatStaffTime(datetimeString) {
    if (!datetimeString || datetimeString === '-') return '<span style="color: #9CA3AF;">-</span>';

    const date = new Date(datetimeString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    const hour12 = date.getHours() % 12 || 12;

    return `${hour12}:${minutes} ${ampm}`;
}

/**
 * Format hours worked
 */
function formatHours(hours) {
    if (!hours || hours === 0 || hours === '0') return '<span style="color: #9CA3AF;">-</span>';
    return `${parseFloat(hours).toFixed(2)} hrs`;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Show loading state
 */
function showTimekeepingLoading() {
    const tbody = document.querySelector('#timekeepingRecordsTable tbody');
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align: center; padding: 40px;">
                <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #FF8C42; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <p style="margin-top: 16px; color: #6B7280; font-weight: 500;">Loading records...</p>
            </td>
        </tr>
    `;
}

/**
 * Show error message
 */
function showTimekeepingError(message) {
    const tbody = document.querySelector('#timekeepingRecordsTable tbody');
    if (!tbody) return;

    tbody.innerHTML = `
        <tr class="staff-empty-row">
            <td colspan="7">
                <div class="staff-empty-state">
                    <div class="staff-empty-icon" style="color: #EF4444;">⚠️</div>
                    <h3>Error Loading Records</h3>
                    <p>${escapeHtml(message)}</p>
                </div>
            </td>
        </tr>
    `;
}

// Auto-initialize when in staff management section
document.addEventListener('DOMContentLoaded', function() {
    const staffContent = document.getElementById('staff-content');
    if (staffContent) {
        initializeStaffTimekeeping();
    }
});

// Also initialize when switching to staff tab
document.addEventListener('click', function(e) {
    if (e.target.closest('[onclick*="staff"]')) {
        setTimeout(initializeStaffTimekeeping, 100);
    }
});
