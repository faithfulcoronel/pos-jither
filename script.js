const initialData = window.initialData || {};
const currentUserRole = window.currentUserRole || null;

const cloneArray = (data) => {
    if (!data) {
        return [];
    }
    const cloned = JSON.parse(JSON.stringify(data));
    return Array.isArray(cloned) ? cloned : [];
};

const FALLBACK_CATEGORY_ID = 'uncategorized';

let productCategories = [];
let products = [];
let inventory = [];
let staffAccounts = [];
let timekeepingRecords = [];
let completedTransactions = [];
let currentOrder = [];

function ensureCategoryExists(categoryId) {
    const normalizedId = categoryId || FALLBACK_CATEGORY_ID;
    if (!productCategories.some(category => category.id === normalizedId)) {
        const generatedName = normalizedId
            .split(/[-_]+/)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ')
            .trim() || 'Uncategorized';

        productCategories.push({
            id: normalizedId,
            name: generatedName,
            description: ''
        });
    }

    return normalizedId;
}

function getCategoryName(categoryId) {
    const normalizedId = categoryId || FALLBACK_CATEGORY_ID;
    const category = productCategories.find(item => item.id === normalizedId);
    if (category) {
        return category.name;
    }

    const generatedName = normalizedId
        .split(/[-_]+/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
        .trim();

    return generatedName || 'Uncategorized';
}

function hydrateState(data) {
    const dataset = data || {};

    const rawCategories = cloneArray(dataset.productCategories);
    productCategories = Array.isArray(rawCategories)
        ? rawCategories.filter(category => category && typeof category === 'object')
        : [];

    if (!productCategories.some(category => category.id === FALLBACK_CATEGORY_ID)) {
        productCategories.push({
            id: FALLBACK_CATEGORY_ID,
            name: 'Uncategorized',
            description: 'Items that are awaiting classification.'
        });
    }

    const rawProducts = Array.isArray(dataset.products) && dataset.products.length > 0
        ? dataset.products
        : dataset.menuItems;

    products = cloneArray(rawProducts).map((product, index) => ({
        id: product.id || `product-${index + 1}`,
        name: product.name || '',
        price: Number(product.price) || 0,
        image: product.image || '',
        categoryId: product.categoryId || FALLBACK_CATEGORY_ID,
        description: product.description || ''
    }));

    products.forEach(product => {
        ensureCategoryExists(product.categoryId);
    });

    inventory = cloneArray(dataset.inventory).map((item, index) => ({
        id: item.id ?? index + 1,
        item: item.item || '',
        qty: Number(item.qty ?? item.quantity ?? 0),
        unit: item.unit || ''
    }));

    staffAccounts = cloneArray(dataset.staffAccounts).map((account, index) => ({
        id: account.id ?? index + 1,
        role: account.role || '',
        name: account.name || '',
        status: account.status || 'Inactive',
        timeIn: account.timeIn || null,
        timeOut: account.timeOut || null
    }));

    timekeepingRecords = cloneArray(dataset.timekeepingRecords).map((record, index) => ({
        id: record.id ?? index + 1,
        name: record.name || '',
        role: record.role || '',
        timeIn: record.timeIn || null,
        timeOut: record.timeOut || null
    }));

    completedTransactions = cloneArray(dataset.completedTransactions).map((transaction, index) => ({
        id: transaction.id ?? index + 1,
        total: Number(transaction.total ?? 0),
        timestamp: transaction.timestamp || new Date().toISOString(),
        items: Array.isArray(transaction.items)
            ? transaction.items.map(item => ({
                name: item.name || '',
                qty: Number(item.qty ?? item.quantity ?? 0)
            }))
            : []
    }));
}

function applyServerData(data) {
    if (!data) {
        return;
    }

    hydrateState(data);
    refreshCategoryUI();
    displayMenuItems();
    displayMenuGallery();
    displayInventory();
    displayStaff();
    displayTimekeepingRecords();

    // Generate daily summary but don't let it block other UI updates
    generateDailySummary().catch(error => {
        console.error('Failed to generate daily summary:', error);
        // Silently fail - daily summary is non-critical for category management
    });

    renderOrderList();
}

function renderCategorySelectOptions(selectId, includeAllOption = false) {
    const select = document.getElementById(selectId);
    if (!select) {
        return;
    }

    const previousValue = select.value;
    select.innerHTML = '';

    if (includeAllOption) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'All Categories';
        select.appendChild(option);
    }

    const sortedCategories = [...productCategories].sort((a, b) => a.name.localeCompare(b.name));
    sortedCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        select.appendChild(option);
    });

    const hasPrevious = [...select.options].some(option => option.value === previousValue);
    if (hasPrevious) {
        select.value = previousValue;
    } else if (!includeAllOption && sortedCategories.length > 0) {
        select.value = sortedCategories[0].id;
    } else {
        select.value = '';
    }
}

function renderCategoryList() {
    const container = document.getElementById('categoryList');
    if (!container) {
        return;
    }

    if (productCategories.length === 0) {
        container.innerHTML = '<p class="empty-state">No categories available.</p>';
        return;
    }

    const sortedCategories = [...productCategories].sort((a, b) => a.name.localeCompare(b.name));
    container.innerHTML = sortedCategories
        .map(category => {
            // Don't show delete button for uncategorized category
            const deleteButton = category.id !== 'uncategorized'
                ? `<button class="category-delete-btn" onclick="deleteCategory('${category.id}')" title="Delete category">&times;</button>`
                : '';
            return `<span class="category-pill" data-category="${category.id}">
                ${category.name}
                ${deleteButton}
            </span>`;
        })
        .join('');
}

function refreshCategoryUI() {
    renderCategorySelectOptions('menuCategoryFilter', true);
    renderCategorySelectOptions('newItemCategory');
    renderCategorySelectOptions('cashierCategoryFilter', true);
    renderCategoryList();
}

function toggleForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.classList.toggle('hidden');
    }
}

function displayMenuItems() {
    const container = document.getElementById('menuItemsContainer');
    if (!container) {
        return;
    }

    if (products.length === 0) {
        container.innerHTML = '<p class="empty-state">No menu items available.</p>';
        return;
    }

    const grouped = products.reduce((accumulator, item, index) => {
        const categoryId = item.categoryId || FALLBACK_CATEGORY_ID;
        if (!accumulator[categoryId]) {
            accumulator[categoryId] = [];
        }
        accumulator[categoryId].push({ item, index });
        return accumulator;
    }, {});

    container.innerHTML = '';

    Object.keys(grouped).forEach(categoryId => {
        const section = document.createElement('div');
        section.className = 'menu-category';

        const title = document.createElement('h3');
        title.textContent = getCategoryName(categoryId);
        section.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'menu-grid';

        grouped[categoryId].forEach(({ item, index }) => {
            const card = document.createElement('div');
            card.className = 'menu-item';
            const imagePath = item.image ? `images/${item.image}` : 'images/jowens.png';
            card.innerHTML = `
                <img src="${imagePath}" alt="${item.name}">
                <p>${item.name} - ₱${item.price}</p>
                <p class="menu-item-category">${getCategoryName(item.categoryId)}</p>
                <button onclick="editMenuItem(${index})">Edit</button>
                <button onclick="deleteMenuItem(${index})">Delete</button>
            `;
            grid.appendChild(card);
        });

        section.appendChild(grid);
        container.appendChild(section);
    });
}
async function addProductCategory() {
    const nameInput = document.getElementById('newCategoryName');
    const descriptionInput = document.getElementById('newCategoryDescription');

    const name = nameInput ? nameInput.value.trim() : '';
    const description = descriptionInput ? descriptionInput.value.trim() : '';

    if (!name) {
        alert('Enter a category name.');
        return;
    }

    try {
        await apiRequest('product-categories', 'create', { name, description });
        if (nameInput) nameInput.value = '';
        if (descriptionInput) descriptionInput.value = '';
        // Success - UI will auto-refresh via applyServerData
        console.log('Category saved successfully:', name);
    } catch (error) {
        alert(error.message || 'Unable to save the category.');
    }
}

async function deleteCategory(categoryId) {
    if (!categoryId) {
        alert('Invalid category.');
        return;
    }

    // Find the category to get its name for the confirmation message
    const category = productCategories.find(cat => cat.id === categoryId);
    const categoryName = category ? category.name : categoryId;

    // Check if any products are using this category
    const productsInCategory = products.filter(product => product.categoryId === categoryId);

    if (productsInCategory.length > 0) {
        alert(`Cannot delete "${categoryName}" because it has ${productsInCategory.length} product(s) assigned to it.\n\nPlease reassign or delete those products first.`);
        return;
    }

    // Confirm deletion
    if (!confirm(`Are you sure you want to delete the category "${categoryName}"?\n\nThis action cannot be undone.`)) {
        return;
    }

    try {
        await apiRequest('product-categories', 'delete', { id: categoryId });
        // Success - UI will auto-refresh via applyServerData
        console.log('Category deleted successfully:', categoryName);
    } catch (error) {
        alert(error.message || 'Unable to delete the category.');
    }
}

async function addMenuItem() {
    const nameInput = document.getElementById('newItemName');
    const priceInput = document.getElementById('newItemPrice');
    const imageInput = document.getElementById('newItemImage');
    const categorySelect = document.getElementById('newItemCategory');

    const name = nameInput ? nameInput.value.trim() : '';
    const price = priceInput ? parseFloat(priceInput.value) : NaN;
    const image = imageInput ? imageInput.value.trim() : '';
    const selectedCategory = categorySelect && categorySelect.value ? categorySelect.value : FALLBACK_CATEGORY_ID;

    if (!name || isNaN(price) || price < 0 || !image) {
        alert('Fill all fields correctly.');
        return;
    }

    try {
        await apiRequest('products', 'create', {
            name,
            price,
            image,
            categoryId: selectedCategory
        });

        if (nameInput) nameInput.value = '';
        if (priceInput) priceInput.value = '';
        if (imageInput) imageInput.value = '';
        if (categorySelect) categorySelect.value = selectedCategory;

        displayMenuItems();
        displayMenuGallery();
    } catch (error) {
        alert(error.message || 'Unable to add the product.');
    }
}

async function editMenuItem(index) {
    const item = products[index];
    if (!item || !item.id) {
        alert('Unable to locate the selected product.');
        return;
    }

    const newName = prompt('Update name:', item.name);
    if (newName === null || newName.trim() === '') {
        alert('Invalid input. No changes were made.');
        return;
    }

    const priceInput = prompt('Update price:', item.price);
    const newPrice = priceInput === null ? NaN : parseFloat(priceInput);
    if (isNaN(newPrice) || newPrice < 0) {
        alert('Invalid price. No changes were made.');
        return;
    }

    const categoryChoices = productCategories
        .map(category => `${category.name} [${category.id}]`)
        .join(', ');
    const categoryPrompt = categoryChoices
        ? `Update category ID (${categoryChoices}):`
        : 'Update category ID:';
    const categoryInput = prompt(categoryPrompt, item.categoryId || FALLBACK_CATEGORY_ID);
    if (categoryInput === null) {
        alert('Invalid input. No changes were made.');
        return;
    }

    const newImage = prompt('Update image filename (e.g., espresso.jpeg):', item.image || '');
    if (newImage === null || newImage.trim() === '') {
        alert('Invalid input. No changes were made.');
        return;
    }

    try {
        await apiRequest('products', 'update', {
            id: item.id,
            name: newName.trim(),
            price: newPrice,
            image: newImage.trim(),
            categoryId: categoryInput.trim() || FALLBACK_CATEGORY_ID
        });

        displayMenuItems();
        displayMenuGallery();
    } catch (error) {
        alert(error.message || 'Unable to update the product.');
    }
}

async function deleteMenuItem(index) {
    const item = products[index];
    if (!item || !item.id) {
        alert('Unable to locate the selected product.');
        return;
    }

    if (!confirm('Delete this item?')) {
        return;
    }

    try {
        await apiRequest('products', 'delete', { id: item.id });
        displayMenuItems();
        displayMenuGallery();
    } catch (error) {
        alert(error.message || 'Unable to delete the product.');
    }
}

function displayInventory() {
    const tbody = document.querySelector('#inventory-content tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    inventory.forEach((inv, i) => {
        tbody.innerHTML += `
            <tr>
                <td>${inv.item}</td>
                <td>${inv.qty}</td>
                <td>${inv.unit}</td>
                <td>
                    <button onclick="editInventory(${i})">Edit</button>
                    <button onclick="deleteInventory(${i})">Delete</button>
                </td>
            </tr>`;
    });
}

async function addInventory() {
    const itemInput = document.getElementById('invItem');
    const qtyInput = document.getElementById('invQty');
    const unitInput = document.getElementById('invUnit');

    const item = itemInput ? itemInput.value.trim() : '';
    const qty = qtyInput ? parseFloat(qtyInput.value) : NaN;
    const unit = unitInput ? unitInput.value.trim() : '';

    if (!item || isNaN(qty) || unit === '') {
        alert('Enter item, quantity, and unit.');
        return;
    }

    try {
        await apiRequest('inventory', 'create', { item, qty, unit });
        if (itemInput) itemInput.value = '';
        if (qtyInput) qtyInput.value = '';
        if (unitInput) unitInput.value = '';
        displayInventory();
    } catch (error) {
        alert(error.message || 'Unable to add the inventory item.');
    }
}

async function editInventory(index) {
    const inv = inventory[index];
    if (!inv || !inv.id) {
        alert('Unable to locate the selected inventory item.');
        return;
    }

    const newItem = prompt('Update item name:', inv.item);
    if (newItem === null || newItem.trim() === '') {
        alert('Invalid input. No changes were made.');
        return;
    }

    const qtyInput = prompt('Update quantity:', inv.qty);
    const newQty = qtyInput === null ? NaN : parseFloat(qtyInput);
    if (isNaN(newQty)) {
        alert('Invalid quantity. No changes were made.');
        return;
    }

    const newUnit = prompt('Update unit:', inv.unit);
    if (newUnit === null || newUnit.trim() === '') {
        alert('Invalid input. No changes were made.');
        return;
    }

    try {
        await apiRequest('inventory', 'update', {
            id: inv.id,
            item: newItem.trim(),
            qty: newQty,
            unit: newUnit.trim()
        });
        displayInventory();
    } catch (error) {
        alert(error.message || 'Unable to update the inventory item.');
    }
}

async function deleteInventory(index) {
    const inv = inventory[index];
    if (!inv || !inv.id) {
        alert('Unable to locate the selected inventory item.');
        return;
    }

    if (!confirm('Remove this inventory item?')) {
        return;
    }

    try {
        await apiRequest('inventory', 'delete', { id: inv.id });
        displayInventory();
    } catch (error) {
        alert(error.message || 'Unable to remove the inventory item.');
    }
}
function displayStaff() {
    const tbody = document.querySelector('#staff-content tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    staffAccounts.forEach((staff, i) => {
        const timeInDisplay = staff.timeIn ? new Date(staff.timeIn).toLocaleString() : 'N/A';
        const timeOutDisplay = staff.timeOut ? new Date(staff.timeOut).toLocaleString() : 'N/A';

        let actionButtons = '';
        if (staff.status === 'Active') {
            actionButtons = `<button onclick="timeOut(${i})">Time Out</button>`;
        } else {
            actionButtons = `<button onclick="timeIn(${i})">Time In</button>`;
        }

        tbody.innerHTML += `
            <tr>
                <td>${staff.role}</td>
                <td>${staff.name}</td>
                <td>${timeInDisplay}</td>
                <td>${timeOutDisplay}</td>
                <td>${staff.status}</td>
                <td>
                    ${actionButtons}
                    <button onclick="editStaff(${i})">Edit</button>
                    <button onclick="deleteStaff(${i})">Delete</button>
                </td>
            </tr>`;
    });
}

async function addStaff() {
    const roleInput = document.getElementById('staffRole');
    const nameInput = document.getElementById('staffName');
    const usernameInput = document.getElementById('staffUsername');
    const passwordInput = document.getElementById('staffPassword');
    const passwordConfirmInput = document.getElementById('staffPasswordConfirm');

    const role = roleInput ? roleInput.value.trim() : '';
    const name = nameInput ? nameInput.value.trim() : '';
    const username = usernameInput ? usernameInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';
    const passwordConfirm = passwordConfirmInput ? passwordConfirmInput.value : '';

    // Validation
    if (!role || !name) {
        alert('Please fill in role and name.');
        return;
    }

    if (!username) {
        alert('Please provide a username for login.');
        return;
    }

    if (!password) {
        alert('Please provide a password.');
        return;
    }

    if (password.length < 4) {
        alert('Password must be at least 4 characters long.');
        return;
    }

    if (password !== passwordConfirm) {
        alert('Passwords do not match.');
        return;
    }

    try {
        await apiRequest('staff-accounts', 'create', {
            role,
            name,
            username,
            password
        });

        // Clear form
        if (roleInput) roleInput.value = '';
        if (nameInput) nameInput.value = '';
        if (usernameInput) usernameInput.value = '';
        if (passwordInput) passwordInput.value = '';
        if (passwordConfirmInput) passwordConfirmInput.value = '';

        // Hide form
        toggleForm('staffFormContainer');

        alert('Staff member and login credentials created successfully!');
    } catch (error) {
        alert(error.message || 'Unable to add the staff member.');
    }
}

async function timeIn(index) {
    const staff = staffAccounts[index];
    if (!staff || !staff.id) {
        alert('Unable to locate the selected staff member.');
        return;
    }

    try {
        await apiRequest('staff-accounts', 'time-in', { id: staff.id });
        // Success - UI will auto-refresh via applyServerData
        console.log(`${staff.name} has timed in.`);
    } catch (error) {
        alert(error.message || 'Unable to time in the staff member.');
    }
}

async function timeOut(index) {
    const staff = staffAccounts[index];
    if (!staff || !staff.id) {
        alert('Unable to locate the selected staff member.');
        return;
    }

    try {
        await apiRequest('staff-accounts', 'time-out', { id: staff.id });
        // Success - UI will auto-refresh via applyServerData
        console.log(`${staff.name} has timed out.`);
    } catch (error) {
        alert(error.message || 'Unable to time out the staff member.');
    }
}

function displayTimekeepingRecords() {
    const tbody = document.querySelector('#timekeepingRecordsTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    timekeepingRecords.forEach(record => {
        const timeIn = record.timeIn ? new Date(record.timeIn) : null;
        const timeOut = record.timeOut ? new Date(record.timeOut) : null;
        let hoursWorked = 'N/A';
        if (timeIn && timeOut) {
            const diffInMs = timeOut - timeIn;
            const diffInHours = diffInMs / (1000 * 60 * 60);
            hoursWorked = diffInHours.toFixed(2);
        }
        tbody.innerHTML += `
            <tr>
                <td>${record.name}</td>
                <td>${record.role}</td>
                <td>${timeIn ? timeIn.toLocaleString() : 'N/A'}</td>
                <td>${timeOut ? timeOut.toLocaleString() : 'N/A'}</td>
                <td>${hoursWorked}</td>
            </tr>`;
    });
}

async function editStaff(index) {
    const staff = staffAccounts[index];
    if (!staff || !staff.id) {
        alert('Unable to locate the selected staff member.');
        return;
    }

    const newRole = prompt('Update role:', staff.role);
    const newName = prompt('Update name:', staff.name);
    if (!newRole || !newName) {
        alert('Invalid input. No changes were made.');
        return;
    }

    try {
        await apiRequest('staff-accounts', 'update', {
            id: staff.id,
            role: newRole.trim(),
            name: newName.trim(),
            status: staff.status
        });
        displayStaff();
    } catch (error) {
        alert(error.message || 'Unable to update the staff member.');
    }
}

async function deleteStaff(index) {
    const staff = staffAccounts[index];
    if (!staff || !staff.id) {
        alert('Unable to locate the selected staff member.');
        return;
    }

    if (!confirm('Delete this staff member?')) {
        return;
    }

    try {
        await apiRequest('staff-accounts', 'delete', { id: staff.id });
        displayStaff();
    } catch (error) {
        alert(error.message || 'Unable to delete the staff member.');
    }
}
let salesChartInstance = null;

function renderSalesChart(labels, data) {
    const canvas = document.getElementById('salesChart');
    if (!canvas) {
        return;
    }

    const ctx = canvas.getContext('2d');

    if (salesChartInstance) {
        salesChartInstance.destroy();
    }

    salesChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Sales (₱)',
                data: data,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Date and Time'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Sales (₱)'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

async function loadSalesByDate() {
    const datePicker = document.getElementById('datePicker');
    const selectedDate = datePicker ? datePicker.value : '';

    const reportTableBody = document.querySelector('#dailySalesTable tbody');
    if (!reportTableBody) {
        return;
    }

    try {
        reportTableBody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';

        // Build URL with date parameter if date is selected
        let url = 'php/api.php?resource=sales-transactions&action=get-by-date';
        if (selectedDate) {
            url += `&date=${encodeURIComponent(selectedDate)}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to load sales data');
        }

        const transactions = result.data || [];
        displaySalesTable(transactions, selectedDate);

        // Update the chart based on the filtered data
        updateSalesChart(transactions, selectedDate);

    } catch (error) {
        console.error('Error loading sales:', error);
        reportTableBody.innerHTML = `<tr><td colspan="4" style="color: red;">Error: ${error.message}</td></tr>`;
    }
}

function displaySalesTable(transactions, filterDate) {
    const reportTableBody = document.querySelector('#dailySalesTable tbody');
    const dailySalesTotal = document.getElementById('dailySalesTotal');

    if (!reportTableBody) {
        return;
    }

    reportTableBody.innerHTML = '';
    let totalSales = 0;

    if (transactions.length === 0) {
        const message = filterDate
            ? `No sales found for ${filterDate}.`
            : 'No sales records found.';
        reportTableBody.innerHTML = `<tr><td colspan="4">${message}</td></tr>`;
    } else {
        transactions.forEach(transaction => {
            const createdAt = new Date(transaction.created_at);
            const dateStr = createdAt.toLocaleDateString();
            const timeStr = createdAt.toLocaleTimeString();
            const total = parseFloat(transaction.total);

            totalSales += total;

            reportTableBody.innerHTML += `
                <tr>
                    <td>${transaction.reference || transaction.id}</td>
                    <td>${dateStr}</td>
                    <td>${timeStr}</td>
                    <td>₱${total.toFixed(2)}</td>
                </tr>
            `;
        });
    }

    if (dailySalesTotal) {
        dailySalesTotal.textContent = totalSales.toFixed(2);
    }
}

function clearDateFilter() {
    const datePicker = document.getElementById('datePicker');
    if (datePicker) {
        datePicker.value = '';
    }
    loadSalesByDate();
}

async function generateOverallSalesChart() {
    const canvas = document.getElementById('salesChart');
    if (!canvas) {
        return;
    }

    try {
        // Fetch all transactions to generate the chart
        const response = await fetch('php/api.php?resource=sales-transactions&action=get-by-date', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to load sales data');
        }

        const transactions = result.data || [];

        // Group sales by date
        const salesByDate = {};
        transactions.forEach(transaction => {
            const date = new Date(transaction.created_at);
            const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            if (!salesByDate[dateKey]) {
                salesByDate[dateKey] = 0;
            }
            salesByDate[dateKey] += parseFloat(transaction.total);
        });

        // Sort dates chronologically
        const sortedDates = Object.keys(salesByDate).sort((a, b) => {
            return new Date(a) - new Date(b);
        });

        const salesData = sortedDates.map(date => salesByDate[date]);

        // Render the chart
        renderSalesChart(sortedDates, salesData);

    } catch (error) {
        console.error('Error generating sales chart:', error);
    }
}

function updateSalesChart(transactions, filterDate) {
    const canvas = document.getElementById('salesChart');
    if (!canvas) {
        return;
    }

    if (filterDate) {
        // For a specific date, show hourly breakdown
        const hourlySales = {};

        transactions.forEach(transaction => {
            const date = new Date(transaction.created_at);
            const hourKey = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

            if (!hourlySales[hourKey]) {
                hourlySales[hourKey] = 0;
            }
            hourlySales[hourKey] += parseFloat(transaction.total);
        });

        const sortedTimes = Object.keys(hourlySales).sort((a, b) => {
            const timeA = new Date('1970/01/01 ' + a);
            const timeB = new Date('1970/01/01 ' + b);
            return timeA - timeB;
        });

        const salesData = sortedTimes.map(time => hourlySales[time]);

        renderSalesChart(sortedTimes, salesData);
    } else {
        // For all dates, show daily breakdown
        const salesByDate = {};

        transactions.forEach(transaction => {
            const date = new Date(transaction.created_at);
            const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            if (!salesByDate[dateKey]) {
                salesByDate[dateKey] = 0;
            }
            salesByDate[dateKey] += parseFloat(transaction.total);
        });

        const sortedDates = Object.keys(salesByDate).sort((a, b) => {
            return new Date(a) - new Date(b);
        });

        const salesData = sortedDates.map(date => salesByDate[date]);

        renderSalesChart(sortedDates, salesData);
    }
}

function showManagerContent(id) {
    document.querySelectorAll('#manager-dashboard .content-section').forEach(section => {
        section.classList.add('hidden');
    });

    document.querySelectorAll('#manager-dashboard .sidebar a').forEach(item => {
        item.classList.remove('active');
    });

    const targetSection = document.getElementById(`${id}-content`);
    if (!targetSection) {
        return;
    }

    targetSection.classList.remove('hidden');

    const navLink = document.querySelector(`#manager-dashboard .sidebar a[onclick="showManagerContent('${id}')"]`);
    if (navLink) {
        navLink.classList.add('active');
    }

    if (id === 'menu') displayMenuItems();
    if (id === 'inventory') displayInventory();
    if (id === 'staff') {
        displayStaff();
        displayTimekeepingRecords();
    }
    if (id === 'sales') {
        // Load overall sales chart and sales table
        generateOverallSalesChart();
        loadSalesByDate();
    }
}

function displayMenuGallery() {
    const container = document.getElementById('menuItemsGallery');
    if (!container) {
        return;
    }

    const categorySelect = document.getElementById('cashierCategoryFilter');
    const selectedCategory = categorySelect ? categorySelect.value : '';
    const filteredProducts = selectedCategory
        ? products.filter(product => (product.categoryId || FALLBACK_CATEGORY_ID) === selectedCategory)
        : products;

    container.innerHTML = '';

    if (filteredProducts.length === 0) {
        container.innerHTML = '<p class="empty-state">No menu items available for this category.</p>';
        return;
    }

    filteredProducts.forEach(product => {
        const card = document.createElement('div');
        card.className = 'menu-item';
        card.addEventListener('click', () => selectDrink(product.id, product.name, product.price));

        const img = document.createElement('img');
        img.src = product.image ? `images/${product.image}` : 'images/jowens.png';
        img.alt = product.name;
        card.appendChild(img);

        const nameParagraph = document.createElement('p');
        nameParagraph.innerHTML = `${product.name}<br>₱${product.price}`;
        card.appendChild(nameParagraph);

        const categoryParagraph = document.createElement('p');
        categoryParagraph.className = 'menu-item-category';
        categoryParagraph.textContent = getCategoryName(product.categoryId);
        card.appendChild(categoryParagraph);

        container.appendChild(card);
    });
}

function showCashierContent(id) {
    document.querySelectorAll('#cashier-dashboard .content-section').forEach(section => {
        section.classList.add('hidden');
    });

    document.querySelectorAll('#cashier-dashboard .sidebar-item').forEach(item => {
        item.classList.remove('active');
    });

    const targetSection = document.getElementById(`${id}-content`);
    if (!targetSection) {
        return;
    }

    targetSection.classList.remove('hidden');

    const navLink = document.querySelector(`#cashier-dashboard .sidebar a[onclick="showCashierContent('${id}')"]`);
    if (navLink) {
        navLink.classList.add('active');
    }

    if (id === 'order') {
        displayMenuGallery();
        renderOrderList();
    } else if (id === 'transaction') {
        displayTransactionList();
    } else if (id === 'daily') {
        generateDailySummary();
    } else if (id === 'timeclock') {
        loadCashierTimeClockStatus();
        loadCashierAttendance();
    }
}

function selectDrink(productId, name, price) {
    const nameField = document.getElementById('drinkName');
    const priceField = document.getElementById('drinkPrice');
    const productIdField = document.getElementById('drinkProductId');

    if (nameField) {
        nameField.value = name;
    }
    if (priceField) {
        priceField.value = price;
    }
    // Store product ID in a hidden field or data attribute
    if (productIdField) {
        productIdField.value = productId;
    } else {
        // Create hidden field if it doesn't exist
        const hiddenField = document.createElement('input');
        hiddenField.type = 'hidden';
        hiddenField.id = 'drinkProductId';
        hiddenField.value = productId;
        nameField.parentNode.appendChild(hiddenField);
    }
    closeKeypad();
}

function addOrder() {
    const nameField = document.getElementById('drinkName');
    const qtyField = document.getElementById('drinkQty');
    const priceField = document.getElementById('drinkPrice');
    const productIdField = document.getElementById('drinkProductId');

    const name = nameField ? nameField.value : '';
    const qty = qtyField ? parseInt(qtyField.value, 10) : NaN;
    const price = priceField ? parseFloat(priceField.value) : NaN;
    const productId = productIdField ? productIdField.value : null;

    if (!name || isNaN(qty) || qty < 1) {
        alert('Select a drink and enter a valid quantity.');
        return;
    }

    const existingIndex = currentOrder.findIndex(item => item.name === name);
    if (existingIndex >= 0) {
        currentOrder[existingIndex].qty += qty;
    } else {
        currentOrder.push({
            product_id: productId,
            name,
            qty,
            price
        });
    }

    renderOrderList();
    resetOrderForm();
}

async function generateDailySummary() {
    const orderSummaryBody = document.querySelector('#daily-orders-summary tbody');
    const itemSummaryBody = document.querySelector('#daily-item-summary tbody');
    const dailySalesTotalEl = document.getElementById('dailySalesTotal');

    if (orderSummaryBody) orderSummaryBody.innerHTML = '';
    if (itemSummaryBody) itemSummaryBody.innerHTML = '';
    if (dailySalesTotalEl) dailySalesTotalEl.textContent = '0.00';

    try {
        // Fetch today's transactions from backend
        const response = await apiRequest('sales-transactions', 'get-daily', null, {
            method: 'GET',
            skipAutoApply: true
        });

        const todaysTransactions = response.data || [];

        if (todaysTransactions.length === 0) {
            if (orderSummaryBody)
                orderSummaryBody.innerHTML = '<tr><td colspan="3">No orders for today.</td></tr>';
            if (itemSummaryBody)
                itemSummaryBody.innerHTML = '<tr><td colspan="3">No items sold today.</td></tr>';
            return;
        }

        let totalRevenue = 0;
        const itemSales = {};

        // Build order summary
        todaysTransactions.forEach(transaction => {
            const items = transaction.items || [];
            const itemDetails = items.map(i => `${i.qty}x ${i.name}`).join(', ');

            orderSummaryBody.innerHTML += `
                <tr>
                    <td>#${transaction.reference || transaction.id}</td>
                    <td>${itemDetails}</td>
                    <td>₱${parseFloat(transaction.total).toFixed(2)}</td>
                </tr>
            `;

            totalRevenue += parseFloat(transaction.total);

            // Build per-item summary
            items.forEach(item => {
                const itemName = item.name;
                if (!itemSales[itemName]) {
                    itemSales[itemName] = { qty: 0, revenue: 0 };
                }
                itemSales[itemName].qty += Number(item.qty);
                itemSales[itemName].revenue += Number(item.qty) * Number(item.price);
            });
        });

        // Show total sales
        if (dailySalesTotalEl)
            dailySalesTotalEl.textContent = totalRevenue.toFixed(2);

        // Render item summary
        const sortedItems = Object.keys(itemSales).sort();
        if (sortedItems.length === 0) {
            itemSummaryBody.innerHTML = '<tr><td colspan="3">No items sold today.</td></tr>';
        } else {
            sortedItems.forEach(itemName => {
                const data = itemSales[itemName];
                itemSummaryBody.innerHTML += `
                    <tr>
                        <td>${itemName}</td>
                        <td>${data.qty}</td>
                        <td>₱${data.revenue.toFixed(2)}</td>
                    </tr>
                `;
            });
        }

    } catch (error) {
        console.error('Error generating daily summary:', error);
        if (orderSummaryBody)
            orderSummaryBody.innerHTML = '<tr><td colspan="3">Error loading data.</td></tr>';
        if (itemSummaryBody)
            itemSummaryBody.innerHTML = '<tr><td colspan="3">Error loading data.</td></tr>';
        // Don't show alert - this error is logged to console for debugging
    }
}

async function displayTransactionList() {
    const transactionList = document.getElementById('transactionList');
    if (!transactionList) {
        return;
    }

    try {
        // Fetch today's transactions
        const response = await apiRequest('sales-transactions', 'get-daily', null, {
            method: 'GET',
            skipAutoApply: true
        });

        const transactions = response.data || [];

        if (transactions.length === 0) {
            transactionList.innerHTML = '<li class="empty-state">No transactions found for today.</li>';
            // Clear receipt display
            clearReceiptDisplay();
            return;
        }

        // Reverse to show latest transaction first
        const reversedTransactions = [...transactions].reverse();

        // Display transactions as clickable list
        transactionList.innerHTML = '';
        reversedTransactions.forEach((transaction) => {
            const li = document.createElement('li');
            li.className = 'transaction-item';
            li.innerHTML = `
                <div class="transaction-info">
                    <strong>${transaction.reference || transaction.id}</strong>
                    <span class="transaction-date">${new Date(transaction.created_at).toLocaleString()}</span>
                    <span class="transaction-total">₱${parseFloat(transaction.total).toFixed(2)}</span>
                </div>
            `;
            li.onclick = (e) => displayReceiptForTransaction(transaction, e.currentTarget);
            transactionList.appendChild(li);
        });

        // Automatically display the most recent transaction (first in reversed list)
        if (reversedTransactions.length > 0) {
            const firstListItem = transactionList.querySelector('.transaction-item');
            displayReceiptForTransaction(reversedTransactions[0], firstListItem);
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
        transactionList.innerHTML = '<li class="error-state">Error loading transactions.</li>';
    }
}

function displayReceiptForTransaction(transaction, clickedElement) {
    const receiptOrderNumber = document.getElementById('receipt-ordernumber');
    const receiptItems = document.getElementById('receipt-items');
    const receiptTotal = document.getElementById('receipt-total');
    const receiptDate = document.getElementById('receipt-date');

    if (!receiptItems || !receiptTotal) {
        return;
    }

    // Update receipt header
    if (receiptOrderNumber) {
        receiptOrderNumber.textContent = transaction.reference || transaction.id;
    }
    if (receiptDate) {
        receiptDate.textContent = new Date(transaction.created_at).toLocaleString();
    }

    // Update receipt items
    receiptItems.innerHTML = '';
    const items = transaction.items || [];
    items.forEach(item => {
        const itemTotal = item.qty * item.price;
        receiptItems.innerHTML += `<p>${item.qty}x ${item.name} - ₱${itemTotal.toFixed(2)}</p>`;
    });

    // Update total
    receiptTotal.textContent = parseFloat(transaction.total).toFixed(2);

    // Highlight selected transaction
    document.querySelectorAll('.transaction-item').forEach(item => {
        item.classList.remove('selected');
    });
    if (clickedElement) {
        clickedElement.classList.add('selected');
    }
}

function clearReceiptDisplay() {
    const receiptOrderNumber = document.getElementById('receipt-ordernumber');
    const receiptItems = document.getElementById('receipt-items');
    const receiptTotal = document.getElementById('receipt-total');
    const receiptDate = document.getElementById('receipt-date');

    if (receiptOrderNumber) receiptOrderNumber.textContent = '';
    if (receiptItems) receiptItems.innerHTML = '';
    if (receiptTotal) receiptTotal.textContent = '0';
    if (receiptDate) receiptDate.textContent = '';
}


function renderOrderList() {
    const orderList = document.getElementById('orderList');
    if (!orderList) {
        return;
    }
    orderList.innerHTML = '';
    currentOrder.forEach((item, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${item.qty}x ${item.name} - ₱${item.qty * item.price}</span>
            <div>
                <button onclick="editOrderItem(${index})">Edit</button>
                <button onclick="removeOrderItem(${index})">Cancel</button>
            </div>
        `;
        orderList.appendChild(li);
    });
    //updateReceipt();
}

function checkOut(){
     updateReceipt();
}

function filterInventory() {
    const input = document.getElementById('inventory-search');
    if (!input) {
        return;
    }
    const filter = input.value.toLowerCase();
    const tableBody = document.querySelector('#inventory tbody');
    if (!tableBody) {
        return;
    }
    const rows = tableBody.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        const itemCell = rows[i].getElementsByTagName('td')[0];
        if (itemCell) {
            const itemText = itemCell.textContent || itemCell.innerText;
            if (itemText.toLowerCase().indexOf(filter) > -1) {
                rows[i].style.display = '';
            } else {
                rows[i].style.display = 'none';
            }
        }
    }
}

function resetOrderForm() {
    const nameField = document.getElementById('drinkName');
    const qtyField = document.getElementById('drinkQty');
    const priceField = document.getElementById('drinkPrice');
    if (nameField) nameField.value = '';
    if (qtyField) qtyField.value = 1;
    if (priceField) priceField.value = '';
}

function editOrderItem(index) {
    const newQty = parseInt(prompt(`Update quantity for ${currentOrder[index].name}:`, currentOrder[index].qty), 10);
    if (!isNaN(newQty) && newQty > 0) {
        currentOrder[index].qty = newQty;
        renderOrderList();
    }
}

function removeOrderItem(index) {
    if (confirm(`Cancel ${currentOrder[index].name}?`)) {
        currentOrder.splice(index, 1);
        renderOrderList();
    }
}

function clearOrder() {
    if (confirm('Clear all items from the order?')) {
        currentOrder = [];
        renderOrderList();
    }
}

async function updateReceipt() {
    const receiptOrderNumber = document.getElementById('receipt-ordernumber');
    const receiptItems = document.getElementById('receipt-items');
    const receiptTotalEl = document.getElementById('receipt-total');
    const receiptDate = document.getElementById('receipt-date');

    if (!receiptItems || !receiptTotalEl) return;

    // Reset and build receipt items
    receiptItems.innerHTML = '';
    let total = 0;
    currentOrder.forEach(item => {
        const itemTotal = item.qty * item.price;
        total += itemTotal;
        receiptItems.innerHTML += `<p>${item.qty}x ${item.name} - ₱${itemTotal.toFixed(2)}</p>`;
    });

    receiptTotalEl.textContent = total.toFixed(2);
    if (receiptDate) receiptDate.textContent = new Date().toLocaleString();

    // ONLY update the order number
    if (receiptOrderNumber) {
        try {
            const nextRef = await getNextReference();
            receiptOrderNumber.textContent = nextRef;
            // Only finalize sale after successfully getting order number
            await finalizeSale();
        } catch (error) {
            console.error('Error fetching next order number:', error);
            alert('Unable to generate order number. Please try again.\nError: ' + error.message);
            receiptOrderNumber.textContent = 'N/A';
            return; // Don't finalize sale if order number generation failed
        }
    }
}

async function getNextReference() {
    console.log('Fetching next reference number...');
    const response = await apiRequest('sales-transactions', 'get-next-reference', null, {
        method: 'GET',
        skipAutoApply: true
    });
    console.log('API Response:', response);
    const nextRef = response.data.next_reference;
    console.log('Next reference:', nextRef);
    return nextRef;
}

async function finalizeSale() {
    if (!currentOrder || currentOrder.length === 0) {
        alert('No items in the order. Please add items before checkout.');
        return;
    }

    const receiptOrderNumber = document.getElementById('receipt-ordernumber').textContent;
    const receiptTotal = parseFloat(document.getElementById('receipt-total').textContent);

    // Format items with correct field names for the API
    const formattedItems = currentOrder.map(item => ({
        product_id: item.product_id || null,
        product_name: item.name,
        quantity: item.qty,
        unit_price: item.price
    }));

    const transactionData = {
        reference: receiptOrderNumber,
        items: formattedItems,
        total: receiptTotal
    };

    try {
        // Save transaction via API
        await apiRequest('sales-transactions', 'create', transactionData);

        // Clear the current order after successful save
        currentOrder = [];
        renderOrderList();

        // Refresh daily summary
        generateDailySummary().catch(error => {
            console.error('Failed to refresh daily summary:', error);
        });

        alert(`Sale successfully recorded!\nOrder Number: ${receiptOrderNumber}\nTotal: ₱${receiptTotal.toFixed(2)}`);

        // Reset receipt display
        document.getElementById('receipt-items').innerHTML = '';
        document.getElementById('receipt-total').textContent = '0';
        document.getElementById('receipt-ordernumber').textContent = '';
    } catch (err) {
        alert(err.message || 'Unable to save sale.');
        console.error(err);
    }
}


function openKeypad() {
    const keypad = document.getElementById('keypad');
    if (keypad) {
        keypad.classList.remove('hidden');
    }
}

function closeKeypad() {
    const keypad = document.getElementById('keypad');
    if (keypad) {
        keypad.classList.add('hidden');
    }
}

function appendQty(value) {
    const qtyInput = document.getElementById('drinkQty');
    if (!qtyInput) {
        return;
    }
    const currentValue = qtyInput.value === '1' ? '' : qtyInput.value;
    qtyInput.value = currentValue + value;
}

function clearQty() {
    const qtyInput = document.getElementById('drinkQty');
    if (qtyInput) {
        qtyInput.value = '1';
    }
}

async function apiRequest(resource, action = null, data = null, options = {}) {
    const method = (options.method || 'POST').toUpperCase();
    let url = `php/api.php?resource=${encodeURIComponent(resource)}`;

    // Include action for GET requests
    if (method === 'GET' && action) {
        url += `&action=${encodeURIComponent(action)}`;
    }

    const fetchOptions = {
        method,
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin'
    };

    // Include body for non-GET requests
    if (method !== 'GET') {
        fetchOptions.headers['Content-Type'] = 'application/json';
        fetchOptions.body = JSON.stringify({ resource, action, data });
    }

    let response;
    try {
        response = await fetch(url, fetchOptions);
    } catch (networkError) {
        throw new Error('Network error: ' + networkError.message);
    }

    let payload;
    try {
        payload = await response.json();
    } catch (jsonError) {
        throw new Error('Invalid JSON response from server.');
    }

    if (!response.ok || !payload || payload.success !== true) {
        const message = payload && typeof payload.error === 'string'
            ? payload.error
            : `Unable to complete request (${response.status}).`;
        throw new Error(message);
    }

    // Only auto-apply server data for resources that are not "read-only"
    const skipAutoApply = options.skipAutoApply || ['sales-transactions'].includes(resource);
    if (payload.data && !skipAutoApply) {
        applyServerData(payload.data);
    }

    return payload;
}

async function reloadData() {
    return apiRequest('initial-data', null, null, { method: 'GET' });
}

function logout() {
    const logoutForm = document.querySelector('form.logout-form');
    if (logoutForm) {
        logoutForm.submit();
        return;
    }

    const form = document.createElement('form');
    form.method = 'post';
    form.innerHTML = '<input type="hidden" name="action" value="logout">';
    document.body.appendChild(form);
    form.submit();
}

// Cashier Time Clock Functions
async function loadCashierTimeClockStatus() {
    const statusDisplay = document.getElementById('currentTimeClockStatus');
    const timeInBtn = document.getElementById('timeInBtn');
    const timeOutBtn = document.getElementById('timeOutBtn');

    if (!statusDisplay) return;

    try {
        // Find current user's staff account by matching role
        // Cashier user logs in with role 'cashier', match to staff with role 'Cashier'
        const userRole = window.currentUserRole;
        const currentUser = staffAccounts.find(staff =>
            staff.role.toLowerCase() === userRole.toLowerCase()
        );

        if (!currentUser) {
            statusDisplay.innerHTML = '<p class="status-text">Staff account not found.</p>';
            return;
        }

        // Check if user is currently clocked in (status is "Active" when clocked in)
        const isClockedIn = currentUser.status === 'Active';

        if (isClockedIn) {
            const timeInAt = currentUser.timeIn ? new Date(currentUser.timeIn).toLocaleTimeString() : 'Unknown';
            statusDisplay.className = 'status-display status-clocked-in';
            statusDisplay.innerHTML = `<p class="status-text">✅ Clocked In at ${timeInAt}</p>`;

            if (timeInBtn) timeInBtn.disabled = true;
            if (timeOutBtn) timeOutBtn.disabled = false;
        } else {
            statusDisplay.className = 'status-display status-clocked-out';
            statusDisplay.innerHTML = '<p class="status-text">⏸️ Not Clocked In</p>';

            if (timeInBtn) timeInBtn.disabled = false;
            if (timeOutBtn) timeOutBtn.disabled = true;
        }
    } catch (error) {
        console.error('Error loading time clock status:', error);
        statusDisplay.innerHTML = '<p class="status-text">Error loading status</p>';
    }
}

async function loadCashierAttendance() {
    const tableBody = document.querySelector('#cashierAttendanceTable tbody');
    if (!tableBody) return;

    try {
        // Find current user's staff account by matching role
        const userRole = window.currentUserRole;
        const currentUser = staffAccounts.find(staff =>
            staff.role.toLowerCase() === userRole.toLowerCase()
        );

        if (!currentUser || !currentUser.id) {
            tableBody.innerHTML = '<tr><td colspan="4">Staff account not found.</td></tr>';
            return;
        }

        // Filter today's attendance records for this user by name and role
        const today = new Date().toDateString();
        const todayRecords = timekeepingRecords.filter(record => {
            if (!record.timeIn) return false;
            const recordDate = new Date(record.timeIn).toDateString();
            return record.name === currentUser.name &&
                   record.role === currentUser.role &&
                   recordDate === today;
        });

        if (todayRecords.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4">No attendance records for today.</td></tr>';
            return;
        }

        tableBody.innerHTML = '';
        todayRecords.forEach(record => {
            const date = record.timeIn ? new Date(record.timeIn).toLocaleDateString() : '-';
            const timeIn = record.timeIn ? new Date(record.timeIn).toLocaleTimeString() : '-';
            const timeOut = record.timeOut ? new Date(record.timeOut).toLocaleTimeString() : '-';

            // Calculate hours worked if both timeIn and timeOut exist
            let hoursWorked = '0.00';
            if (record.timeIn && record.timeOut) {
                const start = new Date(record.timeIn);
                const end = new Date(record.timeOut);
                const diffMs = end - start;
                hoursWorked = (diffMs / (1000 * 60 * 60)).toFixed(2);
            }

            tableBody.innerHTML += `
                <tr>
                    <td>${date}</td>
                    <td>${timeIn}</td>
                    <td>${timeOut}</td>
                    <td>${hoursWorked} hrs</td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error loading attendance:', error);
        tableBody.innerHTML = '<tr><td colspan="4">Error loading attendance records.</td></tr>';
    }
}

async function cashierTimeIn() {
    try {
        // Find current user's staff account by matching role
        const userRole = window.currentUserRole;
        const currentUser = staffAccounts.find(staff =>
            staff.role.toLowerCase() === userRole.toLowerCase()
        );

        if (!currentUser || !currentUser.id) {
            alert('Staff account not found.');
            return;
        }

        if (!confirm('Are you sure you want to clock in?')) {
            return;
        }

        await apiRequest('staff-accounts', 'time-in', { id: currentUser.id });

        alert('Successfully clocked in!');

        // Reload status and attendance after data refresh
        await loadCashierTimeClockStatus();
        await loadCashierAttendance();
    } catch (error) {
        alert(error.message || 'Unable to clock in. Please try again.');
        console.error(error);
    }
}

async function cashierTimeOut() {
    try {
        // Find current user's staff account by matching role
        const userRole = window.currentUserRole;
        const currentUser = staffAccounts.find(staff =>
            staff.role.toLowerCase() === userRole.toLowerCase()
        );

        if (!currentUser || !currentUser.id) {
            alert('Staff account not found.');
            return;
        }

        if (!confirm('Are you sure you want to clock out?')) {
            return;
        }

        await apiRequest('staff-accounts', 'time-out', { id: currentUser.id });

        alert('Successfully clocked out!');

        // Reload status and attendance after data refresh
        await loadCashierTimeClockStatus();
        await loadCashierAttendance();
    } catch (error) {
        alert(error.message || 'Unable to clock out. Please try again.');
        console.error(error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    applyServerData(initialData);

    if (currentUserRole === 'manager') {
        showManagerContent('home');
    } else if (currentUserRole === 'cashier') {
        showCashierContent('order');
    }
});
