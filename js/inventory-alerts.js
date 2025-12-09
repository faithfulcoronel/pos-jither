/**
 * Inventory Alerts System
 * Monitors inventory levels and shows notifications when items are depleted or low
 */

let inventoryAlerts = [];
let alertCheckInterval = null;
let hasShownAlerts = false;

/**
 * Initialize inventory alerts system
 */
function initializeInventoryAlerts() {
    console.log('Initializing Inventory Alerts System...');

    // Check inventory on load
    checkInventoryLevels();

    // Check every 5 minutes
    alertCheckInterval = setInterval(checkInventoryLevels, 5 * 60 * 1000);

    // Check when switching to inventory page
    document.addEventListener('click', function(e) {
        if (e.target.closest('[onclick*="inventory"]') || e.target.closest('[onclick*="menu"]')) {
            setTimeout(checkInventoryLevels, 500);
        }
    });
}

/**
 * Check inventory levels and generate alerts
 */
async function checkInventoryLevels() {
    try {
        const response = await fetch('php/inventory-alerts-api.php?action=check_levels');
        const data = await response.json();

        if (data.success) {
            inventoryAlerts = data.alerts || [];

            if (inventoryAlerts.length > 0) {
                showInventoryAlertBadge(inventoryAlerts.length);

                // Show notification if not already shown in this session
                if (!hasShownAlerts) {
                    showInventoryNotification(inventoryAlerts);
                    hasShownAlerts = true;
                }

                // Update alerts panel
                updateAlertsPanel();
            } else {
                hideInventoryAlertBadge();
            }
        }
    } catch (error) {
        console.error('Error checking inventory levels:', error);
    }
}

/**
 * Show inventory alert badge
 */
function showInventoryAlertBadge(count) {
    // Add badge to inventory menu item
    const inventoryLinks = document.querySelectorAll('[onclick*="inventory"], [onclick*="menu"]');

    inventoryLinks.forEach(link => {
        // Remove existing badge
        const existingBadge = link.querySelector('.alert-badge');
        if (existingBadge) {
            existingBadge.remove();
        }

        // Add new badge
        const badge = document.createElement('span');
        badge.className = 'alert-badge';
        badge.textContent = count;
        badge.title = `${count} inventory alert${count > 1 ? 's' : ''}`;
        link.style.position = 'relative';
        link.appendChild(badge);
    });
}

/**
 * Hide inventory alert badge
 */
function hideInventoryAlertBadge() {
    const badges = document.querySelectorAll('.alert-badge');
    badges.forEach(badge => badge.remove());
}

/**
 * Show notification popup
 */
function showInventoryNotification(alerts) {
    const depleted = alerts.filter(a => a.status === 'depleted');
    const low = alerts.filter(a => a.status === 'low');

    let message = '⚠️ <strong>Inventory Alert!</strong><br><br>';

    if (depleted.length > 0) {
        message += `🔴 <strong>${depleted.length} item${depleted.length > 1 ? 's' : ''} depleted:</strong><br>`;
        depleted.slice(0, 3).forEach(item => {
            message += `• ${escapeHtml(item.item_name)}<br>`;
        });
        if (depleted.length > 3) {
            message += `• ... and ${depleted.length - 3} more<br>`;
        }
        message += '<br>';
    }

    if (low.length > 0) {
        message += `🟡 <strong>${low.length} item${low.length > 1 ? 's' : ''} running low:</strong><br>`;
        low.slice(0, 3).forEach(item => {
            message += `• ${escapeHtml(item.item_name)} (${item.current_quantity} ${item.unit})<br>`;
        });
        if (low.length > 3) {
            message += `• ... and ${low.length - 3} more<br>`;
        }
    }

    showInventoryAlert(message, alerts.length);
}

/**
 * Show alert modal
 */
function showInventoryAlert(message, totalAlerts) {
    const modal = document.createElement('div');
    modal.className = 'inventory-alert-modal';
    modal.innerHTML = `
        <div class="inventory-alert-content">
            <div class="inventory-alert-header">
                <h3>📦 Inventory Alerts</h3>
                <button class="inventory-alert-close" onclick="closeInventoryAlert()">&times;</button>
            </div>
            <div class="inventory-alert-body">
                ${message}
            </div>
            <div class="inventory-alert-footer">
                <button class="inventory-alert-btn primary" onclick="viewInventoryAlerts()">
                    View All Alerts (${totalAlerts})
                </button>
                <button class="inventory-alert-btn secondary" onclick="closeInventoryAlert()">
                    Dismiss
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Auto-dismiss after 15 seconds
    setTimeout(() => {
        closeInventoryAlert();
    }, 15000);
}

/**
 * Close alert modal
 */
function closeInventoryAlert() {
    const modal = document.querySelector('.inventory-alert-modal');
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
    }
}

/**
 * View all inventory alerts
 */
function viewInventoryAlerts() {
    closeInventoryAlert();

    // Switch to inventory/menu tab
    const inventoryTab = document.querySelector('[onclick*="inventory"]') ||
                         document.querySelector('[onclick*="menu"]');
    if (inventoryTab) {
        inventoryTab.click();
    }

    // Show alerts panel
    setTimeout(() => {
        showAlertsPanel();
    }, 500);
}

/**
 * Update alerts panel in inventory page
 */
function updateAlertsPanel() {
    let alertsContainer = document.getElementById('inventory-alerts-panel');

    if (!alertsContainer) {
        // Create alerts panel if it doesn't exist
        const inventoryContent = document.getElementById('menu-content') ||
                                 document.getElementById('inventory-content');

        if (!inventoryContent) return;

        alertsContainer = document.createElement('div');
        alertsContainer.id = 'inventory-alerts-panel';
        alertsContainer.className = 'inventory-alerts-panel';

        // Insert at the top of inventory content
        const firstChild = inventoryContent.firstElementChild;
        if (firstChild) {
            inventoryContent.insertBefore(alertsContainer, firstChild);
        } else {
            inventoryContent.appendChild(alertsContainer);
        }
    }

    if (inventoryAlerts.length === 0) {
        alertsContainer.style.display = 'none';
        return;
    }

    alertsContainer.style.display = 'block';

    const depleted = inventoryAlerts.filter(a => a.status === 'depleted');
    const low = inventoryAlerts.filter(a => a.status === 'low');

    let html = `
        <div class="alerts-panel-header">
            <h3>⚠️ Inventory Alerts (${inventoryAlerts.length})</h3>
            <button class="alerts-panel-close" onclick="hideAlertsPanel()">✕</button>
        </div>
        <div class="alerts-panel-body">
    `;

    if (depleted.length > 0) {
        html += `
            <div class="alert-section depleted">
                <h4>🔴 Depleted Items (${depleted.length})</h4>
                <div class="alert-items">
        `;

        depleted.forEach(item => {
            html += `
                <div class="alert-item">
                    <div class="alert-item-info">
                        <strong>${escapeHtml(item.item_name)}</strong>
                        <span class="alert-item-detail">Current: ${item.current_quantity} ${item.unit} | Min: ${item.min_quantity} ${item.unit}</span>
                    </div>
                    <button class="alert-item-action" onclick="quickRestock('${item.item_id}', '${escapeHtml(item.item_name)}')">
                        📦 Restock
                    </button>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    }

    if (low.length > 0) {
        html += `
            <div class="alert-section low">
                <h4>🟡 Low Stock Items (${low.length})</h4>
                <div class="alert-items">
        `;

        low.forEach(item => {
            html += `
                <div class="alert-item">
                    <div class="alert-item-info">
                        <strong>${escapeHtml(item.item_name)}</strong>
                        <span class="alert-item-detail">Current: ${item.current_quantity} ${item.unit} | Min: ${item.min_quantity} ${item.unit}</span>
                    </div>
                    <button class="alert-item-action" onclick="quickRestock('${item.item_id}', '${escapeHtml(item.item_name)}')">
                        📦 Restock
                    </button>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    }

    html += `
        </div>
    `;

    alertsContainer.innerHTML = html;
}

/**
 * Show alerts panel
 */
function showAlertsPanel() {
    const panel = document.getElementById('inventory-alerts-panel');
    if (panel) {
        panel.style.display = 'block';
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * Hide alerts panel
 */
function hideAlertsPanel() {
    const panel = document.getElementById('inventory-alerts-panel');
    if (panel) {
        panel.style.display = 'none';
    }
}

/**
 * Quick restock action
 */
function quickRestock(itemId, itemName) {
    const quantity = prompt(`How much ${itemName} do you want to add to stock?`, '10');

    if (quantity && !isNaN(quantity) && parseFloat(quantity) > 0) {
        restockItem(itemId, parseFloat(quantity));
    }
}

/**
 * Restock item
 */
async function restockItem(itemId, quantity) {
    try {
        const formData = new FormData();
        formData.append('action', 'restock');
        formData.append('item_id', itemId);
        formData.append('quantity', quantity);

        const response = await fetch('php/inventory-alerts-api.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ Item restocked successfully!');
            checkInventoryLevels();

            // Refresh inventory if available
            if (typeof loadInventoryItems === 'function') {
                loadInventoryItems();
            }
        } else {
            alert('❌ Failed to restock: ' + data.message);
        }
    } catch (error) {
        console.error('Error restocking item:', error);
        alert('❌ Error restocking item');
    }
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeInventoryAlerts();
});

// Export functions
window.closeInventoryAlert = closeInventoryAlert;
window.viewInventoryAlerts = viewInventoryAlerts;
window.hideAlertsPanel = hideAlertsPanel;
window.quickRestock = quickRestock;
