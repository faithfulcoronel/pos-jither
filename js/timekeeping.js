/**
 * Modern Time Keeping System - JavaScript
 * Handles employee clock in/out, attendance tracking, and history
 */

let currentEmployee = null;
let currentPeriodFilter = 'weekly';
let attendanceHistory = [];

/**
 * Initialize Time Keeping System
 */
function initializeTimekeeping() {
    console.log('Initializing Time Keeping System...');

    // Start clock
    updateClock();
    setInterval(updateClock, 1000);

    // Load employee number from localStorage if exists
    const savedEmployeeNumber = localStorage.getItem('tk_employee_number');
    if (savedEmployeeNumber) {
        document.getElementById('employee-number').value = savedEmployeeNumber;
        checkEmployeeStatus(savedEmployeeNumber);
    }

    // Listen for employee number input
    const employeeInput = document.getElementById('employee-number');
    employeeInput.addEventListener('blur', function() {
        const empNum = this.value.trim();
        if (empNum) {
            checkEmployeeStatus(empNum);
        }
    });

    employeeInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const empNum = this.value.trim();
            if (empNum) {
                checkEmployeeStatus(empNum);
            }
        }
    });
}

/**
 * Update Clock Display - POS Style
 */
function updateClock() {
    const now = new Date();

    // Format time (HH:MM:SS)
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;

    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        timeElement.textContent = timeString;
    }
}

/**
 * Show Toast Notification (POS-style)
 */
function showToast(message, type = 'success') {
    // Remove existing toasts
    const existingToast = document.querySelector('.tk-toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `tk-toast tk-toast-${type}`;
    toast.innerHTML = `
        <span style="font-size: 24px;">${type === 'success' ? '✓' : '✕'}</span>
        <span style="font-weight: 600;">${message}</span>
    `;

    document.body.appendChild(toast);

    // Auto-remove after 4 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

/**
 * Add button ripple effect for touch feedback
 */
function addButtonRipple(button, event) {
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        top: ${y}px;
        left: ${x}px;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
    `;

    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
}

/**
 * Check Employee Status
 */
async function checkEmployeeStatus(employeeNumber) {
    try {
        const response = await fetch(`php/timekeeping-api.php?action=check_status&employee_number=${encodeURIComponent(employeeNumber)}`);
        const data = await response.json();

        if (data.success) {
            currentEmployee = data.employee;
            updateEmployeeStatus(data.status);
            loadAttendanceHistory(employeeNumber);

            // Save to localStorage
            localStorage.setItem('tk_employee_number', employeeNumber);
        } else {
            showError(data.message || 'Employee not found');
            resetEmployeeStatus();
            currentEmployee = null;
        }
    } catch (error) {
        console.error('Error checking status:', error);
        showError('Failed to check employee status');
    }
}

/**
 * Update Employee Status Display
 */
function updateEmployeeStatus(status) {
    const statusDiv = document.getElementById('employee-status');
    const timeInBtn = document.getElementById('time-in-btn');
    const timeOutBtn = document.getElementById('time-out-btn');

    // Update status display
    document.getElementById('status-employee').textContent = currentEmployee.full_name;
    document.getElementById('status-time-in').textContent = status.time_in || '-';
    document.getElementById('status-time-out').textContent = status.time_out || '-';
    document.getElementById('status-hours').textContent = status.hours_worked || '-';

    statusDiv.classList.add('active');

    // Update button states
    if (status.is_locked) {
        // Locked after time out
        timeInBtn.disabled = true;
        timeOutBtn.disabled = true;
        showWarning('You have completed your shift for today. See you tomorrow!');
    } else if (status.time_in && !status.time_out) {
        // Clocked in, can clock out
        timeInBtn.disabled = true;
        timeOutBtn.disabled = false;
    } else if (!status.time_in) {
        // Not yet clocked in
        timeInBtn.disabled = false;
        timeOutBtn.disabled = true;
    } else {
        // Already clocked out
        timeInBtn.disabled = true;
        timeOutBtn.disabled = true;
    }
}

/**
 * Reset Employee Status Display
 */
function resetEmployeeStatus() {
    const statusDiv = document.getElementById('employee-status');
    statusDiv.classList.remove('active');

    document.getElementById('status-employee').textContent = '-';
    document.getElementById('status-time-in').textContent = '-';
    document.getElementById('status-time-out').textContent = '-';
    document.getElementById('status-hours').textContent = '-';

    document.getElementById('time-in-btn').disabled = false;
    document.getElementById('time-out-btn').disabled = true;

    // Clear attendance history
    const tbody = document.getElementById('attendance-tbody');
    tbody.innerHTML = `
        <tr>
            <td colspan="5" class="tk-empty">
                <div class="tk-empty-icon">📋</div>
                <div class="tk-empty-text">Enter your employee number to view attendance</div>
            </td>
        </tr>
    `;
}

/**
 * Handle Time In
 */
async function handleTimeIn() {
    const employeeNumber = document.getElementById('employee-number').value.trim();

    if (!employeeNumber) {
        showError('Please enter your employee number');
        return;
    }

    if (!currentEmployee) {
        showError('Employee not found. Please check your employee number.');
        return;
    }

    const timeInBtn = document.getElementById('time-in-btn');
    const originalText = timeInBtn.innerHTML;
    timeInBtn.disabled = true;
    timeInBtn.innerHTML = '<span class="tk-loading"></span> Processing...';

    try {
        const response = await fetch('php/timekeeping-api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'time_in',
                employee_number: employeeNumber
            })
        });

        const data = await response.json();

        if (data.success) {
            showSuccess(`Time In Successful! Welcome, ${currentEmployee.full_name}!`);
            checkEmployeeStatus(employeeNumber);
        } else {
            showError(data.message || 'Failed to time in');
            timeInBtn.disabled = false;
        }
    } catch (error) {
        console.error('Error during time in:', error);
        showError('Failed to record time in');
        timeInBtn.disabled = false;
    } finally {
        timeInBtn.innerHTML = originalText;
    }
}

/**
 * Handle Time Out
 */
async function handleTimeOut() {
    const employeeNumber = document.getElementById('employee-number').value.trim();

    if (!employeeNumber) {
        showError('Please enter your employee number');
        return;
    }

    if (!currentEmployee) {
        showError('Employee not found. Please check your employee number.');
        return;
    }

    const timeOutBtn = document.getElementById('time-out-btn');
    const originalText = timeOutBtn.innerHTML;
    timeOutBtn.disabled = true;
    timeOutBtn.innerHTML = '<span class="tk-loading"></span> Processing...';

    try {
        const response = await fetch('php/timekeeping-api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'time_out',
                employee_number: employeeNumber
            })
        });

        const data = await response.json();

        if (data.success) {
            showSuccess(`Time Out Successful! Thank you, ${currentEmployee.full_name}! Hours worked: ${data.hours_worked}`);
            checkEmployeeStatus(employeeNumber);
        } else {
            showError(data.message || 'Failed to time out');
            timeOutBtn.disabled = false;
        }
    } catch (error) {
        console.error('Error during time out:', error);
        showError('Failed to record time out');
        timeOutBtn.disabled = false;
    } finally {
        timeOutBtn.innerHTML = originalText;
    }
}

/**
 * Load Attendance History
 */
async function loadAttendanceHistory(employeeNumber) {
    try {
        const response = await fetch(`php/timekeeping-api.php?action=get_history&employee_number=${encodeURIComponent(employeeNumber)}&period=${currentPeriodFilter}`);
        const data = await response.json();

        if (data.success) {
            attendanceHistory = data.records || [];
            renderAttendanceHistory();
        } else {
            console.error('Failed to load attendance history:', data.message);
        }
    } catch (error) {
        console.error('Error loading attendance history:', error);
    }
}

/**
 * Render Attendance History Table
 */
function renderAttendanceHistory() {
    const tbody = document.getElementById('attendance-tbody');

    if (attendanceHistory.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="tk-empty">
                    <div class="tk-empty-icon">📭</div>
                    <div class="tk-empty-text">No attendance records for this period</div>
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    attendanceHistory.forEach(record => {
        const statusBadge = getStatusBadge(record.status);
        const timeIn = record.time_in ? formatTime(record.time_in) : '-';
        const timeOut = record.time_out ? formatTime(record.time_out) : '-';
        const hours = record.hours_worked ? parseFloat(record.hours_worked).toFixed(2) + ' hrs' : '-';

        html += `
            <tr>
                <td>${formatDate(record.date)}</td>
                <td>${timeIn}</td>
                <td>${timeOut}</td>
                <td>${hours}</td>
                <td>${statusBadge}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

/**
 * Filter Attendance by Period
 */
function filterAttendance(period) {
    currentPeriodFilter = period;

    // Update active filter button
    document.querySelectorAll('.tk-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Reload history with new filter
    const employeeNumber = document.getElementById('employee-number').value.trim();
    if (employeeNumber && currentEmployee) {
        loadAttendanceHistory(employeeNumber);
    }
}

/**
 * Get Status Badge HTML
 */
function getStatusBadge(status) {
    const badges = {
        'present': '<span class="tk-badge tk-badge-present">✓ Present</span>',
        'absent': '<span class="tk-badge tk-badge-absent">✕ Absent</span>',
        'late': '<span class="tk-badge tk-badge-late">⏰ Late</span>',
        'half_day': '<span class="tk-badge tk-badge-half-day">◐ Half Day</span>'
    };
    return badges[status] || status;
}

/**
 * Format Date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Format Time
 */
function formatTime(datetimeString) {
    if (!datetimeString) return '-';

    const date = new Date(datetimeString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Show Success Alert
 */
function showSuccess(message) {
    hideAllAlerts();
    const alert = document.getElementById('success-alert');
    document.getElementById('success-message').textContent = message;
    alert.classList.add('show');

    setTimeout(() => {
        alert.classList.remove('show');
    }, 5000);
}

/**
 * Show Error Alert
 */
function showError(message) {
    hideAllAlerts();
    const alert = document.getElementById('error-alert');
    document.getElementById('error-message').textContent = message;
    alert.classList.add('show');

    setTimeout(() => {
        alert.classList.remove('show');
    }, 5000);
}

/**
 * Show Warning Alert
 */
function showWarning(message) {
    // For now, use error alert with different icon
    showError(message);
}

/**
 * Hide All Alerts
 */
function hideAllAlerts() {
    document.querySelectorAll('.tk-alert').forEach(alert => {
        alert.classList.remove('show');
    });
}

/**
 * Auto-initialize when page loads
 */
document.addEventListener('DOMContentLoaded', function() {
    const timekeepingSection = document.getElementById('timekeeping-section');
    if (timekeepingSection) {
        initializeTimekeeping();
    }
});
