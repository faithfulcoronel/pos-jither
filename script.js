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
    generateDailySummary();
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
        .map(category => `<span class="category-pill" data-category="${category.id}">${category.name}</span>`)
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
        alert('Category saved successfully.');
    } catch (error) {
        alert(error.message || 'Unable to save the category.');
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
    const role = roleInput ? roleInput.value.trim() : '';
    const name = nameInput ? nameInput.value.trim() : '';

    if (!role || !name) {
        alert('Fill in role and name.');
        return;
    }

    try {
        await apiRequest('staff-accounts', 'create', { role, name });
        if (roleInput) roleInput.value = '';
        if (nameInput) nameInput.value = '';
        displayStaff();
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
        alert(`${staff.name} has timed in.`);
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
        alert(`${staff.name} has timed out.`);
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

function generateDailySalesChart(selectedDate) {
    const hourlySales = {};
    const filteredTransactions = completedTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.timestamp);
        return transactionDate.toDateString() === selectedDate.toDateString();
    });

    filteredTransactions.forEach(transaction => {
        const date = new Date(transaction.timestamp);
        const key = date.toLocaleDateString('en-US') + ', ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

        if (!hourlySales[key]) {
            hourlySales[key] = 0;
        }
        hourlySales[key] += transaction.total;
    });

    const dates = Object.keys(hourlySales).sort((a, b) => new Date(a) - new Date(b));
    const salesData = dates.map(key => hourlySales[key]);

    renderSalesChart(dates, salesData);

    const reportTableBody = document.querySelector('#dailySalesTable tbody');
    if (!reportTableBody) {
        return;
    }
    reportTableBody.innerHTML = '';
    let totalSales = 0;

    if (filteredTransactions.length === 0) {
        reportTableBody.innerHTML = `<tr><td colspan="3">No sales found for ${selectedDate.toDateString()}.</td></tr>`;
    } else {
        filteredTransactions.forEach(record => {
            totalSales += record.total;
            reportTableBody.innerHTML += `
                <tr>
                    <td>${record.id}</td>
                    <td>${new Date(record.timestamp).toLocaleTimeString()}</td>
                    <td>₱${record.total.toFixed(2)}</td>
                </tr>
            `;
        });
    }

    const dailySalesTotal = document.getElementById('dailySalesTotal');
    if (dailySalesTotal) {
        dailySalesTotal.textContent = totalSales.toFixed(2);
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
        const today = new Date();
        generateDailySalesChart(today);
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
        card.addEventListener('click', () => selectDrink(product.name, product.price));

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
    } else if (id === 'daily') {
        generateDailySummary();
    }
}

function selectDrink(name, price) {
    const nameField = document.getElementById('drinkName');
    const priceField = document.getElementById('drinkPrice');
    if (nameField) {
        nameField.value = name;
    }
    if (priceField) {
        priceField.value = price;
    }
    closeKeypad();
}

function addOrder() {
    const nameField = document.getElementById('drinkName');
    const qtyField = document.getElementById('drinkQty');
    const priceField = document.getElementById('drinkPrice');

    const name = nameField ? nameField.value : '';
    const qty = qtyField ? parseInt(qtyField.value, 10) : NaN;
    const price = priceField ? parseFloat(priceField.value) : NaN;

    if (!name || isNaN(qty) || qty < 1) {
        alert('Select a drink and enter a valid quantity.');
        return;
    }

    const existingIndex = currentOrder.findIndex(item => item.name === name);
    if (existingIndex >= 0) {
        currentOrder[existingIndex].qty += qty;
    } else {
        currentOrder.push({ name, qty, price });
    }

    renderOrderList();
    resetOrderForm();
}

function generateDailySummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysTransactions = completedTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.timestamp);
        return transactionDate.toDateString() === today.toDateString();
    });

    const orderSummaryBody = document.querySelector('#daily-orders-summary tbody');
    const dailySalesTotalEl = document.getElementById('dailySalesTotal');
    if (orderSummaryBody) {
        orderSummaryBody.innerHTML = '';
    }
    let totalRevenue = 0;

    if (orderSummaryBody) {
        if (todaysTransactions.length === 0) {
            orderSummaryBody.innerHTML = '<tr><td colspan="3">No orders for today.</td></tr>';
            if (dailySalesTotalEl) {
                dailySalesTotalEl.textContent = '0.00';
            }
        } else {
            todaysTransactions.forEach(transaction => {
                const itemDetails = transaction.items.map(item => `${item.qty}x ${item.name}`).join(', ');
                orderSummaryBody.innerHTML += `
                    <tr>
                        <td>#${transaction.id}</td>
                        <td>${itemDetails}</td>
                        <td>₱${transaction.total.toFixed(2)}</td>
                    </tr>
                `;
                totalRevenue += transaction.total;
            });
            if (dailySalesTotalEl) {
                dailySalesTotalEl.textContent = totalRevenue.toFixed(2);
            }
        }
    }

    const itemSummaryBody = document.querySelector('#daily-item-summary tbody');
    if (!itemSummaryBody) {
        return;
    }

    const itemSales = {};

    todaysTransactions.forEach(transaction => {
        transaction.items.forEach(item => {
            const product = products.find(m => m.name === item.name);
            const itemPrice = product ? product.price : 0;

            if (!itemSales[item.name]) {
                itemSales[item.name] = { qty: 0, revenue: 0 };
            }
            itemSales[item.name].qty += item.qty;
            itemSales[item.name].revenue += item.qty * itemPrice;
        });
    });

    itemSummaryBody.innerHTML = '';
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

function updateReceipt() {
    const receiptItems = document.getElementById('receipt-items');
    const receiptTotalEl = document.getElementById('receipt-total');
    if (!receiptItems || !receiptTotalEl) return;
    receiptItems.innerHTML = '';
    let total = 0;

    currentOrder.forEach(item => {
        const itemTotal = item.qty * item.price;
        total += itemTotal;
        receiptItems.innerHTML += `<p>${item.qty}x ${item.name} - ₱${itemTotal}</p>`;
    });

    receiptTotalEl.textContent = total.toFixed(2);
    const receiptDate = document.getElementById('receipt-date');
    if (receiptDate) {
        receiptDate.textContent = new Date().toLocaleString();
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
    const method = options.method || 'POST';
    let url = `php/api.php?resource=${encodeURIComponent(resource)}`;

    const fetchOptions = {
        method,
        headers: {
            'Accept': 'application/json'
        },
        credentials: 'same-origin'
    };

    if (method === 'GET') {
        if (action) {
            url += `&action=${encodeURIComponent(action)}`;
        }
    } else {
        fetchOptions.headers['Content-Type'] = 'application/json';
        fetchOptions.body = JSON.stringify({ resource, action, data });
    }

    const response = await fetch(url, fetchOptions);
    let payload = null;
    try {
        payload = await response.json();
    } catch (error) {
        payload = null;
    }

    if (!response.ok || !payload || payload.success !== true) {
        const message = payload && typeof payload.error === 'string'
            ? payload.error
            : `Unable to complete request (${response.status}).`;
        throw new Error(message);
    }

    if (payload.data) {
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

document.addEventListener('DOMContentLoaded', () => {
    applyServerData(initialData);

    if (currentUserRole === 'manager') {
        showManagerContent('home');
    } else if (currentUserRole === 'cashier') {
        showCashierContent('order');
    }
});
