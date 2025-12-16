/**
 * Inventify-Style Inventory Management System
 * Clean, modern inventory tracking with auto-calculations
 */

// Global state
let inventifyData = {
    items: [],
    categories: [],
    movements: [],
    auditLogs: [],
    currentTab: 'stock',
    filters: {
        search: '',
        category: '',
        status: ''
    }
};

let inventoryCharts = {};

/**
 * Initialize Inventify Inventory System
 */
async function initializeInventify() {
    await inventifyLoadData();
    inventifyPopulateCategories();
    inventifyUpdateSummary();
    inventifyRenderStockTab();
    renderInventoryCharts();
}

/**
 * Load all inventory data
 */
async function inventifyLoadData() {
    try {
        // Load inventory items with cost data
        const itemsResponse = await fetch('php/api.php?resource=inventory-with-cost');
        const itemsResult = await itemsResponse.json();

        if (itemsResult.success) {
            inventifyData.items = (itemsResult.data.inventory || []).map((raw) => {
                // Normalize snake_case → camelCase so charts read correct values
                const qty = Number(raw.qty ?? raw.quantity ?? 0);
                const reorderLevel = Number(raw.reorderLevel ?? raw.reorder_level ?? 0);
                const maxStock = Number(raw.maxStock ?? raw.max_stock ?? 0);
                const costPerUnit = Number(raw.costPerUnit ?? raw.cost_per_unit ?? 0);
                const totalValue = Number(raw.totalValue ?? raw.total_value ?? (qty * costPerUnit));
                const categoryValue = raw.category || raw.category_name || raw.categoryId || raw.category_id || '';

                return {
                    ...raw,
                    qty,
                    reorderLevel,
                    maxStock,
                    costPerUnit,
                    totalValue,
                    unit: raw.unit || raw.uom || '',
                    category: typeof categoryValue === 'string' ? categoryValue : String(categoryValue || '')
                };
            });
        }

        // Load stock movements
        const movementsResponse = await fetch('php/api.php?resource=stock-movements&action=get-all');
        if (movementsResponse.ok) {
            const movementsResult = await movementsResponse.json();
            if (movementsResult.success) {
                inventifyData.movements = movementsResult.data || [];
            }
        }

        // Load categories
        const categoriesResponse = await fetch('php/api.php?resource=inventory-categories&action=get-all');
        if (categoriesResponse.ok) {
            const categoriesResult = await categoriesResponse.json();
            if (categoriesResult.success) {
                inventifyData.categories = categoriesResult.data || [];
            }
        }

        // Build audit logs from stock movements so the Audit tab is populated
        inventifyBuildAuditLogs();

    } catch (error) {
        console.error('Error loading Inventify data:', error);
    }
}

/**
 * Update summary cards
 */
function inventifyUpdateSummary() {
    // Use all items for headline metrics (not filtered list)
    const items = inventifyData.items || [];

    const totalItems = items.length;
    const totalValue = items.reduce((sum, item) => sum + (item.totalValue || 0), 0);
    const lowStock = items.filter(item => {
        const status = inventifyGetItemStatus(item);
        return status === 'low_stock' || status === 'below_reorder';
    }).length;
    const outOfStock = items.filter(item => inventifyGetItemStatus(item) === 'out_of_stock').length;

    document.getElementById('inventify-total-items').textContent = totalItems;
    document.getElementById('inventify-current-value').textContent = `₱${totalValue.toFixed(2)}`;
    document.getElementById('inventify-low-stock').textContent = lowStock;
    document.getElementById('inventify-out-of-stock').textContent = outOfStock;
}

/**
 * Populate category dropdowns
 */
function inventifyPopulateCategories() {
    const categoriesSet = new Set();
    const standardCategories = [
        'Coffee & Beverage Ingredients',
        'Milk & Dairy / Alternatives',
        'Food Ingredients',
        'Frozen & Refrigerated Items',
        'Packaging & Disposables',
        'Equipment & Machines',
        'Smallwares & Utensils',
        'Cleaning & Maintenance Supplies',
        'Retail Merchandise',
        'Safety & Miscellaneous'
    ];

    // Always seed with the standard categories so they're available even before data loads
    standardCategories.forEach(cat => categoriesSet.add(cat));

    // From API categories list
    (inventifyData.categories || []).forEach(cat => {
        if (cat && cat.name) categoriesSet.add(cat.name);
    });

    // From existing items
    inventifyData.items.forEach(item => {
        if (item.category) categoriesSet.add(item.category);
    });

    // Preserve the provided order, append any extras alphabetically
    const categories = [
        ...standardCategories,
        ...Array.from(categoriesSet).filter(cat => !standardCategories.includes(cat)).sort((a, b) => a.localeCompare(b))
    ].filter((cat, index, self) => self.indexOf(cat) === index);

    // Filter dropdown
    const filterSelect = document.getElementById('inventify-category-filter');
    filterSelect.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        filterSelect.appendChild(option);
    });

    // Form dropdown
    const formSelect = document.getElementById('inventify-item-category');
    formSelect.innerHTML = '<option value="">Select Category</option>';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        formSelect.appendChild(option);
    });
}

/**
 * Get filtered items based on current filters
 */
function inventifyGetFilteredItems() {
    let filtered = [...inventifyData.items];

    // Search filter
    if (inventifyData.filters.search) {
        const search = inventifyData.filters.search.toLowerCase();
        filtered = filtered.filter(item =>
            item.item.toLowerCase().includes(search) ||
            (item.sku && item.sku.toLowerCase().includes(search)) ||
            (item.category && item.category.toLowerCase().includes(search))
        );
    }

    // Category filter
    const categoryFilter = (inventifyData.filters.category || '').trim().toLowerCase();
    if (categoryFilter && categoryFilter !== 'all') {
        filtered = filtered.filter(item => (item.category || '').trim().toLowerCase() === categoryFilter);
    }

    // Status filter
    if (inventifyData.filters.status) {
        filtered = filtered.filter(item => {
            const status = inventifyGetItemStatus(item);
            return status === inventifyData.filters.status;
        });
    }

    return filtered;
}

/**
 * Get item status
 */
function inventifyGetItemStatus(item) {
    if (item.qty <= 0) return 'out_of_stock';
    const reorderLevel = item.reorderLevel || 0;
    if (reorderLevel > 0 && item.qty <= reorderLevel) return 'below_reorder';
    if (reorderLevel > 0 && item.qty <= (reorderLevel * 1.5)) return 'low_stock';
    return 'in_stock';
}

/**
 * Get status percentage based on item status
 * - Out of Stock: 0%
 * - Below Reorder: 1-33% (based on qty relative to reorder level)
 * - Low Stock: 34-66% (based on qty relative to optimal level)
 * - In Stock: 67-100% (based on qty relative to max stock)
 */
function inventifyGetStatusPercentage(item) {
    const status = inventifyGetItemStatus(item);
    const qty = item.qty || 0;
    const reorderLevel = item.reorderLevel || 0;
    const maxStock = item.maxStock || 0;

    // Out of stock = 0%
    if (status === 'out_of_stock' || qty <= 0) {
        return 0;
    }

    // Below reorder level = 1-33%
    if (status === 'below_reorder') {
        if (reorderLevel <= 0) return 15;
        const percentage = (qty / reorderLevel) * 33;
        return Math.round(Math.max(1, Math.min(percentage, 33)));
    }

    // Low stock = 34-66%
    if (status === 'low_stock') {
        const optimalLevel = reorderLevel * 1.5;
        if (optimalLevel <= 0) return 50;
        const percentage = 33 + ((qty - reorderLevel) / (optimalLevel - reorderLevel)) * 33;
        return Math.round(Math.max(34, Math.min(percentage, 66)));
    }

    // In stock = 67-100%
    if (maxStock > 0) {
        const optimalLevel = reorderLevel * 1.5;
        const percentage = 66 + ((qty - optimalLevel) / (maxStock - optimalLevel)) * 34;
        return Math.round(Math.max(67, Math.min(percentage, 100)));
    }

    // Default: if max stock not set, scale from reorder level
    const defaultMax = reorderLevel * 3;
    if (defaultMax > 0) {
        const percentage = (qty / defaultMax) * 100;
        return Math.round(Math.max(67, Math.min(percentage, 100)));
    }

    return 100;
}

/**
 * Switch tabs
 */
function inventifySwitchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.inventify-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');

    // Hide all tab contents
    document.querySelectorAll('.inventify-tab-content').forEach(content => {
        content.classList.add('hidden');
    });

    // Show selected tab
    document.getElementById(`inventify-${tabName}-tab`).classList.remove('hidden');

    inventifyData.currentTab = tabName;

    // Load tab data
    switch (tabName) {
        case 'stock':
            inventifyRenderStockTab();
            break;
        case 'cost':
            inventifyRenderCostTab();
            break;
        case 'activities':
            inventifyRenderActivitiesTab();
            break;
        case 'audit':
            inventifyRenderAuditTab();
            break;
    }
}

/**
 * Render Stock Tab
 */
function inventifyRenderStockTab() {
    const tbody = document.getElementById('inventify-stock-tbody');
    const items = inventifyGetFilteredItems();

    if (items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="inventify-empty">
                    <div class="inventify-empty-icon">📦</div>
                    <div class="inventify-empty-title">No items found</div>
                    <div class="inventify-empty-text">Add your first inventory item to get started</div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = items.map(item => {
        const status = inventifyGetItemStatus(item);
        const statusPercent = inventifyGetStatusPercentage(item);
        const statusLabels = {
            'in_stock': 'In Stock',
            'low_stock': 'Low Stock',
            'below_reorder': 'Below Reorder',
            'out_of_stock': 'Out of Stock'
        };

        return `
            <tr>
                <td><strong>#${item.id}</strong></td>
                <td><strong>${item.item}</strong></td>
                <td>${item.sku || '-'}</td>
                <td>${item.category || 'General'}</td>
                <td><strong>${item.qty} ${item.unit}</strong></td>
                <td>
                    <span class="inventify-status inventify-status-${status.replace('_', '-')}">
                        ${statusLabels[status]}
                    </span>
                </td>
                <td>
                    <div class="inventify-progress">
                        <div class="inventify-progress-bar ${statusPercent > 50 ? 'high' : statusPercent > 20 ? 'medium' : 'low'}"
                             style="width: ${Math.min(statusPercent, 100)}%">
                        </div>
                    </div>
                    <small style="color: var(--inventify-gray-500);">${statusPercent}%</small>
                </td>
                <td>${item.reorderLevel || 0} ${item.unit}</td>
                <td>${item.location || '-'}</td>
                <td>
                    <div class="inventify-actions">
                        <button class="inventify-icon-btn edit" onclick="inventifyEditItem(${item.id})" title="Edit">
                            ✏️
                        </button>
                        <button class="inventify-icon-btn delete" onclick="inventifyDeleteItem(${item.id})" title="Delete">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Render Cost Tab
 */
function inventifyRenderCostTab() {
    const tbody = document.getElementById('inventify-cost-tbody');
    const items = inventifyGetFilteredItems();

    tbody.innerHTML = items.map(item => `
        <tr>
            <td><strong>${item.item}</strong></td>
            <td>${item.unitSize || 1}</td>
            <td>${item.unit}</td>
            <td>₱${(item.costPerUnit * item.unitSize || 0).toFixed(2)}</td>
            <td>₱${(item.costPerUnit || 0).toFixed(4)}</td>
            <td>${item.qty} ${item.unit}</td>
            <td><strong>₱${(item.totalValue || 0).toFixed(2)}</strong></td>
            <td>
                <button class="inventify-icon-btn edit" onclick="inventifyEditItem(${item.id})">
                    ✏️
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Render Activities Tab
 */
function inventifyRenderActivitiesTab() {
    const container = document.getElementById('inventify-activities-container');
    const movements = inventifyData.movements.slice(0, 50); // Show last 50

    if (movements.length === 0) {
        container.innerHTML = `
            <div class="inventify-empty">
                <div class="inventify-empty-icon">📈</div>
                <div class="inventify-empty-title">No activities yet</div>
                <div class="inventify-empty-text">Stock movements will appear here</div>
            </div>
        `;
        return;
    }

    container.innerHTML = movements.map(movement => {
        const direction = movement.quantity > 0 ? 'inflow' : 'outflow';
        const icon = direction === 'inflow' ? '📥' : '📤';

        return `
            <div class="inventify-movement">
                <div class="inventify-movement-icon ${direction}">
                    ${icon}
                </div>
                <div class="inventify-movement-details">
                    <div class="inventify-movement-type">${movement.inventoryItemName || 'Item'}</div>
                    <div class="inventify-movement-info">
                        ${movement.movementType} • ${new Date(movement.createdAt).toLocaleString()}
                        ${movement.notes ? ` • ${movement.notes}` : ''}
                    </div>
                </div>
                <div class="inventify-movement-quantity ${direction}">
                    ${direction === 'inflow' ? '+' : '-'}${Math.abs(movement.quantity)}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Render Audit Tab
 */
function inventifyRenderAuditTab() {
    const tbody = document.getElementById('inventify-audit-tbody');
    if (!tbody) return;

    const logs = (inventifyData.auditLogs || []).slice(0, 100);

    if (logs.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="inventify-empty">
                    <div class="inventify-empty-icon">🔍</div>
                    <div class="inventify-empty-title">No audit entries yet</div>
                    <div class="inventify-empty-text">Inventory changes will appear here</div>
                </td>
            </tr>
        `;
        return;
    }

    const formatValue = (val) => {
        if (val === null || val === undefined || val === '') return '—';
        return typeof val === 'number' ? val : `${val}`;
    };

    tbody.innerHTML = logs.map(log => `
        <tr>
            <td>${new Date(log.timestamp).toLocaleString()}</td>
            <td>${log.item || 'Item'}</td>
            <td>${log.action}</td>
            <td>${log.field || 'quantity'}</td>
            <td>${formatValue(log.oldValue)}</td>
            <td>${formatValue(log.newValue)}</td>
            <td>${log.changedBy || 'System'}</td>
        </tr>
    `).join('');
}

/**
 * Search functionality
 */
function inventifySearch() {
    inventifyData.filters.search = document.getElementById('inventify-search-input').value;
    inventifyUpdateSummary();
    inventifyRenderCurrentTab();
}

/**
 * Filter by category
 */
function inventifyFilterByCategory() {
    const select = document.getElementById('inventify-category-filter');
    const value = select ? select.value.trim() : '';
    inventifyData.filters.category = value;
    if (select && !value) {
        // Normalize selection to the explicit "All Categories" option
        select.value = '';
    }
    inventifyUpdateSummary();
    inventifyRenderCurrentTab();
}

/**
 * Filter by status
 */
function inventifyFilterByStatus() {
    inventifyData.filters.status = document.getElementById('inventify-status-filter').value;
    inventifyUpdateSummary();
    inventifyRenderCurrentTab();
}

/**
 * Render current tab
 */
function inventifyRenderCurrentTab() {
    switch (inventifyData.currentTab) {
        case 'stock':
            inventifyRenderStockTab();
            break;
        case 'cost':
            inventifyRenderCostTab();
            break;
        case 'activities':
            inventifyRenderActivitiesTab();
            break;
        case 'audit':
            inventifyRenderAuditTab();
            break;
    }
}

/**
 * Show add modal
 */
function inventifyShowAddModal() {
    document.getElementById('inventify-modal-title').textContent = 'Add New Item';
    document.getElementById('inventify-item-id').value = '';
    document.getElementById('inventify-item-form').reset();
    document.getElementById('inventify-movement-history-section').classList.add('hidden');
    document.getElementById('inventify-item-modal').classList.remove('hidden');
}

/**
 * Show edit modal
 */
async function inventifyEditItem(itemId) {
    const item = inventifyData.items.find(i => i.id === itemId);
    if (!item) return;

    document.getElementById('inventify-modal-title').textContent = 'Edit Item';
    document.getElementById('inventify-item-id').value = item.id;
    document.getElementById('inventify-item-name').value = item.item;
    document.getElementById('inventify-item-category').value = item.category || '';
    document.getElementById('inventify-item-unit').value = item.unit;
    document.getElementById('inventify-item-unit-size').value = item.unitSize || 1;
    document.getElementById('inventify-item-cost').value = (item.costPerUnit * item.unitSize || 0).toFixed(2);
    document.getElementById('inventify-item-cost-per-unit').value = (item.costPerUnit || 0).toFixed(4);
    document.getElementById('inventify-item-sku').value = item.sku || '';
    document.getElementById('inventify-item-quantity').value = item.qty;
    document.getElementById('inventify-item-reorder').value = item.reorderLevel || 0;
    document.getElementById('inventify-item-max-stock').value = item.maxStock || 0;
    document.getElementById('inventify-item-location').value = item.location || '';
    document.getElementById('inventify-item-barcode').value = item.barcode || '';

    // Load movement history
    await inventifyLoadMovementHistory(itemId);

    document.getElementById('inventify-movement-history-section').classList.remove('hidden');
    document.getElementById('inventify-item-modal').classList.remove('hidden');
}

/**
 * Load movement history for item
 */
async function inventifyLoadMovementHistory(itemId) {
    const container = document.getElementById('inventify-movement-history');

    const itemMovements = inventifyData.movements
        .filter(m => m.inventoryItemId === itemId)
        .slice(0, 10); // Last 10 movements

    if (itemMovements.length === 0) {
        container.innerHTML = '<p style="color: var(--inventify-gray-500); text-align: center; padding: 20px;">No movements yet</p>';
        return;
    }

    container.innerHTML = itemMovements.map(movement => {
        const direction = movement.quantity > 0 ? 'inflow' : 'outflow';
        const icon = direction === 'inflow' ? '📥' : '📤';

        return `
            <div class="inventify-movement">
                <div class="inventify-movement-icon ${direction}">${icon}</div>
                <div class="inventify-movement-details">
                    <div class="inventify-movement-type">${movement.movementType}</div>
                    <div class="inventify-movement-info">
                        ${new Date(movement.createdAt).toLocaleString()}
                        ${movement.notes ? ` • ${movement.notes}` : ''}
                    </div>
                </div>
                <div class="inventify-movement-quantity ${direction}">
                    ${direction === 'inflow' ? '+' : ''}${movement.quantity}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Calculate cost per unit
 */
function inventifyCalculateCostPerUnit() {
    const unitSize = parseFloat(document.getElementById('inventify-item-unit-size').value) || 1;
    const cost = parseFloat(document.getElementById('inventify-item-cost').value) || 0;

    const costPerUnit = unitSize > 0 ? cost / unitSize : 0;
    document.getElementById('inventify-item-cost-per-unit').value = costPerUnit.toFixed(4);
}

/**
 * Save item
 */
async function inventifySaveItem() {
    const itemId = document.getElementById('inventify-item-id').value;
    const isEdit = itemId !== '';

    const formData = {
        item: document.getElementById('inventify-item-name').value,
        category: document.getElementById('inventify-item-category').value,
        unit: document.getElementById('inventify-item-unit').value,
        unit_size: parseFloat(document.getElementById('inventify-item-unit-size').value),
        purchase_cost: parseFloat(document.getElementById('inventify-item-cost').value),
        sku: document.getElementById('inventify-item-sku').value || null,
        quantity: parseFloat(document.getElementById('inventify-item-quantity').value),
        reorder_level: parseFloat(document.getElementById('inventify-item-reorder').value),
        max_stock: parseFloat(document.getElementById('inventify-item-max-stock').value) || null,
        location: document.getElementById('inventify-item-location').value || null,
        barcode: document.getElementById('inventify-item-barcode').value || null,
        notes: document.getElementById('inventify-item-notes').value || null
    };

    if (isEdit) {
        formData.id = parseInt(itemId);
    }

    try {
        const response = await fetch('php/api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                resource: 'inventory',
                action: isEdit ? 'update' : 'create',
                data: formData
            })
        });

        const result = await response.json();

        if (result.success) {
            alert(isEdit ? 'Item updated successfully!' : 'Item added successfully!');
            inventifyCloseModal();
            await inventifyLoadData();
            inventifyUpdateSummary();
            inventifyRenderCurrentTab();
        } else {
            alert('Error: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error saving item:', error);
        alert('Failed to save item');
    }
}

/**
 * Delete item
 */
async function inventifyDeleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch('php/api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                resource: 'inventory',
                action: 'delete',
                data: { id: itemId }
            })
        });

        const result = await response.json();

        if (result.success) {
            alert('Item deleted successfully!');
            await inventifyLoadData();
            inventifyUpdateSummary();
            inventifyRenderCurrentTab();
        } else {
            alert('Error: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        alert('Failed to delete item');
    }
}

/**
 * Close modal
 */
function inventifyCloseModal() {
    document.getElementById('inventify-item-modal').classList.add('hidden');
}

/**
 * Show bulk add modal
 */
function inventifyShowBulkAddModal() {
    document.getElementById('inventify-bulk-modal').classList.remove('hidden');
}

/**
 * Close bulk modal
 */
function inventifyCloseBulkModal() {
    document.getElementById('inventify-bulk-modal').classList.add('hidden');
}

/**
 * Bulk add items
 */
async function inventifyBulkAdd() {
    const csvData = document.getElementById('inventify-bulk-input').value.trim();

    if (!csvData) {
        alert('Please enter CSV data');
        return;
    }

    const lines = csvData.split('\n').filter(line => line.trim());
    const items = [];

    for (const line of lines) {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 8) {
            items.push({
                name: parts[0],
                category: parts[1],
                unit: parts[2],
                unit_size: parseFloat(parts[3]),
                purchase_cost: parseFloat(parts[4]),
                quantity: parseFloat(parts[5]),
                reorder_level: parseFloat(parts[6]),
                location: parts[7],
                sku: parts[8] || null
            });
        }
    }

    if (items.length === 0) {
        alert('No valid items found in CSV data');
        return;
    }

    try {
        for (const item of items) {
            await fetch('php/api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resource: 'inventory',
                    action: 'create',
                    data: {
                        item: item.name,
                        category: item.category,
                        unit: item.unit,
                        unit_size: item.unit_size,
                        purchase_cost: item.purchase_cost,
                        quantity: item.quantity,
                        reorder_level: item.reorder_level,
                        location: item.location,
                        sku: item.sku
                    }
                })
            });
        }

        alert(`Successfully added ${items.length} items!`);
        inventifyCloseBulkModal();
        document.getElementById('inventify-bulk-input').value = '';
        await inventifyLoadData();
        inventifyUpdateSummary();
        inventifyRenderCurrentTab();
    } catch (error) {
        console.error('Error bulk adding items:', error);
        alert('Failed to add items');
    }
}

/**
 * Export to CSV
 */
function inventifyExportCSV() {
    const items = inventifyGetFilteredItems();

    let csv = 'ID,Description,SKU,Category,Quantity,Unit,Status,Reorder Level,Location,Purchase Cost,Cost Per Unit,Total Value\n';

    items.forEach(item => {
        const status = inventifyGetItemStatus(item);
        const row = [
            item.id,
            `"${item.item}"`,
            item.sku || '',
            item.category || '',
            item.qty,
            item.unit,
            status,
            item.reorderLevel || 0,
            item.location || '',
            (item.costPerUnit * item.unitSize || 0).toFixed(2),
            (item.costPerUnit || 0).toFixed(4),
            (item.totalValue || 0).toFixed(2)
        ];
        csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

/**
 * Render all inventory charts
 */
function renderInventoryCharts() {
    renderInventoryStatusChart();
    renderInventoryValueChart();
    renderInventoryLevelsChart();
}

/**
 * Render Stock Status Distribution Chart
 */
function renderInventoryStatusChart() {
    const canvas = document.getElementById('inventory-status-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (inventoryCharts.status) {
        inventoryCharts.status.destroy();
    }

    // Count items by status
    let inStock = 0, lowStock = 0, belowReorder = 0, outOfStock = 0;

    inventifyData.items.forEach(item => {
        const status = inventifyGetItemStatus(item);
        if (status === 'in_stock') inStock++;
        else if (status === 'low_stock') lowStock++;
        else if (status === 'below_reorder') belowReorder++;
        else if (status === 'out_of_stock') outOfStock++;
    });

    inventoryCharts.status = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['In Stock', 'Low Stock', 'Below Reorder', 'Out of Stock'],
            datasets: [{
                data: [inStock, lowStock, belowReorder, outOfStock],
                backgroundColor: ['#10B981', '#F59E0B', '#EF4444', '#6B7280'],
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
                        padding: 12,
                        font: { size: 11, weight: '600' }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return context.label + ': ' + context.parsed + ' items (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

/**
 * Render Top Items by Value Chart
 */
function renderInventoryValueChart() {
    const canvas = document.getElementById('inventory-value-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (inventoryCharts.value) {
        inventoryCharts.value.destroy();
    }

    // Calculate value for each item and sort
    const itemsWithValue = inventifyData.items.map(item => ({
        name: item.item,
        value: (item.qty || 0) * (item.costPerUnit || 0)
    })).sort((a, b) => b.value - a.value).slice(0, 10);

    inventoryCharts.value = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: itemsWithValue.map(item => item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name),
            datasets: [{
                label: 'Total Value',
                data: itemsWithValue.map(item => item.value),
                backgroundColor: '#FF8C42',
                borderRadius: 6
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Value: ₱' + context.parsed.x.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { color: '#E5E7EB' },
                    ticks: {
                        callback: function(value) {
                            return '₱' + (value / 1000).toFixed(0) + 'K';
                        },
                        font: { size: 10 }
                    }
                },
                y: {
                    grid: { display: false },
                    ticks: { font: { size: 10 } }
                }
            }
        }
    });
}

/**
 * Render Stock Levels Overview Chart
 */
function renderInventoryLevelsChart() {
    const canvas = document.getElementById('inventory-levels-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (inventoryCharts.levels) {
        inventoryCharts.levels.destroy();
    }

    // Get top 15 items by quantity
    const topItems = inventifyData.items
        .sort((a, b) => (b.qty || 0) - (a.qty || 0))
        .slice(0, 15);

    inventoryCharts.levels = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topItems.map(item => item.item.length > 20 ? item.item.substring(0, 20) + '...' : item.item),
            datasets: [
                {
                    label: 'Current Stock',
                    data: topItems.map(item => item.qty || 0),
                    backgroundColor: '#FF8C42',
                    borderRadius: 4
                },
                {
                    label: 'Reorder Level',
                    data: topItems.map(item => item.reorderLevel || 0),
                    backgroundColor: '#EF4444',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: { size: 11, weight: '600' }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y + ' ' + (topItems[context.dataIndex].unit || 'units');
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#E5E7EB' },
                    ticks: { font: { size: 10 } }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { size: 9 },
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

/**
 * Build audit log entries using movement history as source
 */
function inventifyBuildAuditLogs() {
    const movements = inventifyData.movements || [];
    inventifyData.auditLogs = movements.map(m => {
        const qtyChange = Number(m.quantity || 0);
        const prevQty = Number(m.previousQuantity ?? m.previous_quantity ?? m.balance_before ?? NaN);
        const nextQty = Number(m.currentQuantity ?? m.current_quantity ?? (isNaN(prevQty) ? NaN : prevQty + qtyChange));

        return {
            timestamp: m.createdAt || m.created_at || new Date().toISOString(),
            item: m.inventoryItemName || m.item || (m.inventoryItemId ? `Item #${m.inventoryItemId}` : 'Item'),
            action: m.movementType || 'Stock Movement',
            field: m.fieldChanged || 'quantity',
            oldValue: isNaN(prevQty) ? '—' : prevQty,
            newValue: isNaN(nextQty) ? qtyChange : nextQty,
            changedBy: m.performedBy || m.user || m.staffName || m.staff || 'System'
        };
    });
}

/**
 * Push a single audit log entry and refresh the Audit tab if active
 */
function inventifyPushAuditLog(entry) {
    const log = {
        timestamp: entry.timestamp || new Date().toISOString(),
        item: entry.item || 'Item',
        action: entry.action || 'Update',
        field: entry.field || 'quantity',
        oldValue: entry.oldValue ?? '—',
        newValue: entry.newValue ?? '—',
        changedBy: entry.changedBy || window.currentUsername || 'System',
        notes: entry.notes || ''
    };

    inventifyData.auditLogs = [log, ...(inventifyData.auditLogs || [])].slice(0, 200);

    if (inventifyData.currentTab === 'audit') {
        inventifyRenderAuditTab();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize if on inventory page
    const inventifyContent = document.getElementById('inventify-inventory-content');
    if (inventifyContent && !inventifyContent.classList.contains('hidden')) {
        initializeInventify();
    }
});
