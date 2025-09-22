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

const rawProducts = Array.isArray(initialData.products) && initialData.products.length > 0
    ? initialData.products
    : initialData.menuItems;

let productCategories = cloneArray(initialData.productCategories);
let products = cloneArray(rawProducts);
let inventory = cloneArray(initialData.inventory);
let staffAccounts = cloneArray(initialData.staffAccounts);
let timekeepingRecords = cloneArray(initialData.timekeepingRecords);
let completedTransactions = cloneArray(initialData.completedTransactions);
let currentOrder = [];

if (!productCategories.some(category => category.id === FALLBACK_CATEGORY_ID)) {
    productCategories.push({
        id: FALLBACK_CATEGORY_ID,
        name: 'Uncategorized',
        description: 'Items that are awaiting classification.'
    });
}

products = products.map((product, index) => ({
    id: product.id || `product-${index + 1}`,
    name: product.name,
    price: Number(product.price) || 0,
    image: product.image || '',
    categoryId: product.categoryId || FALLBACK_CATEGORY_ID,
    description: product.description || ''
}));

products.forEach(product => {
    ensureCategoryExists(product.categoryId);
});

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

function generateSlug(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function generateCategoryId(name) {
    const baseSlug = generateSlug(name);
    if (!baseSlug) {
        return `category-${Date.now()}`;
    }

    let candidate = baseSlug;
    let counter = 1;
    while (productCategories.some(category => category.id === candidate)) {
        counter += 1;
        candidate = `${baseSlug}-${counter}`;
    }
    return candidate;
}

function generateProductId(name) {
    const baseSlug = generateSlug(name);
    if (!baseSlug) {
        return `product-${Date.now()}`;
    }

    let candidate = baseSlug;
    let counter = 1;
    while (products.some(product => product.id === candidate)) {
        counter += 1;
        candidate = `${baseSlug}-${counter}`;
    }
    return candidate;
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
        // Initialize Flatpickr for single date selection
        flatpickr("#datePicker", {
            mode: "single",
            dateFormat: "Y-m-d",
            onChange: function(selectedDates) {
                if (selectedDates.length > 0) {
                    generateDailySalesChart(selectedDates[0]);
                }
            }
        });
        // Initial chart state with no data
        renderSalesChart([], []);
    }
}


function displayMenuItems() {
    const container = document.getElementById('menuItemsContainer');
    if (!container) {
        return;
    }

    const filterSelect = document.getElementById('menuCategoryFilter');
    const selectedCategory = filterSelect ? filterSelect.value : '';
    const itemsWithIndex = products.map((item, index) => ({ item, index }));
    const filteredItems = selectedCategory
        ? itemsWithIndex.filter(entry => (entry.item.categoryId || FALLBACK_CATEGORY_ID) === selectedCategory)
        : itemsWithIndex;

    container.innerHTML = '';

    if (filteredItems.length === 0) {
        container.innerHTML = '<p class="empty-state">No products found for the selected category.</p>';
        return;
    }

    const grouped = filteredItems.reduce((acc, entry) => {
        const categoryId = entry.item.categoryId || FALLBACK_CATEGORY_ID;
        if (!acc[categoryId]) {
            acc[categoryId] = [];
        }
        acc[categoryId].push(entry);
        return acc;
    }, {});

    const sortedCategoryIds = Object.keys(grouped).sort((a, b) => getCategoryName(a).localeCompare(getCategoryName(b)));

    sortedCategoryIds.forEach(categoryId => {
        const section = document.createElement('section');
        section.className = 'menu-category-section';

        const title = document.createElement('h4');
        title.className = 'menu-category-title';
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

function addProductCategory() {
    const nameInput = document.getElementById('newCategoryName');
    const descriptionInput = document.getElementById('newCategoryDescription');

    const name = nameInput ? nameInput.value.trim() : '';
    const description = descriptionInput ? descriptionInput.value.trim() : '';

    if (!name) {
        alert('Enter a category name.');
        return;
    }

    const existingByName = productCategories.find(
        category => category.name.toLowerCase() === name.toLowerCase()
    );

    if (existingByName) {
        alert('A category with this name already exists.');
        return;
    }

    const id = generateCategoryId(name);
    productCategories.push({ id, name, description });

    if (nameInput) nameInput.value = '';
    if (descriptionInput) descriptionInput.value = '';

    refreshCategoryUI();
    displayMenuItems();
    displayMenuGallery();
}

function addMenuItem() {
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

    const productId = generateProductId(name);
    const categoryId = ensureCategoryExists(selectedCategory);

    products.push({
        id: productId,
        name,
        price,
        image,
        categoryId,
        description: ''
    });

    if (nameInput) nameInput.value = '';
    if (priceInput) priceInput.value = '';
    if (imageInput) imageInput.value = '';
    if (categorySelect) categorySelect.value = categoryId;

    refreshCategoryUI();
    displayMenuItems();
    displayMenuGallery();
}

function editMenuItem(index) {
    const item = products[index];
    if (!item) {
        return;
    }

    const newName = prompt('Update name:', item.name);
    const newPrice = parseFloat(prompt('Update price:', item.price));
    const categoryChoices = productCategories
        .map(category => `${category.name} [${category.id}]`)
        .join(', ');
    const categoryPrompt = categoryChoices
        ? `Update category ID (${categoryChoices}):`
        : 'Update category ID:';
    const newCategoryIdInput = prompt(categoryPrompt, item.categoryId || FALLBACK_CATEGORY_ID);
    const newImage = prompt('Update image filename (e.g., espresso.jpeg):', item.image);

    if (newName && !isNaN(newPrice) && newPrice >= 0 && newImage && newCategoryIdInput !== null) {
        const normalizedCategory = ensureCategoryExists(newCategoryIdInput.trim() || FALLBACK_CATEGORY_ID);
        products[index] = {
            ...item,
            name: newName.trim(),
            price: newPrice,
            image: newImage.trim(),
            categoryId: normalizedCategory
        };

        refreshCategoryUI();
        displayMenuItems();
        displayMenuGallery();
    } else {
        alert('Invalid input. No changes were made.');
    }
}

function deleteMenuItem(index) {
    if (confirm('Delete this item?')) {
        products.splice(index, 1);
        displayMenuItems();
        displayMenuGallery();
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

function addInventory() {
    const item = document.getElementById('invItem').value;
    const qty = parseInt(document.getElementById('invQty').value);
    const unit = document.getElementById('invUnit').value;

    if (!item || isNaN(qty)) return alert("Enter item and quantity.");
    inventory.push({ item, qty, unit });
    displayInventory();
}

function editInventory(index) {
    const inv = inventory[index];
    const newItem = prompt("Update item name:", inv.item);
    const newQty = parseInt(prompt("Update quantity:", inv.qty));
    const newUnit = prompt("Update unit:", inv.unit);

    if (newItem !== null && !isNaN(newQty) && newUnit !== null) {
        inventory[index].item = newItem;
        inventory[index].qty = newQty;
        inventory[index].unit = newUnit;
        displayInventory();
    } else {
        alert("Invalid input. No changes were made.");
    }
}

function deleteInventory(index) {
    if (confirm("Remove this inventory item?")) {
        inventory.splice(index, 1);
        displayInventory();
    }
}

function toggleForm(formId) {
    const form = document.getElementById(formId);
    form.classList.toggle('hidden');
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

function addStaff() {
    const role = document.getElementById('staffRole').value;
    const name = document.getElementById('staffName').value;
    if (!role || !name) return alert("Fill in role and name.");
    staffAccounts.push({ role, name, timeIn: null, timeOut: null, status: 'Inactive' });
    displayStaff();
}

function timeIn(index) {
    staffAccounts[index].timeIn = new Date();
    staffAccounts[index].status = 'Active';
    timekeepingRecords.push({
        name: staffAccounts[index].name,
        role: staffAccounts[index].role,
        timeIn: staffAccounts[index].timeIn,
        timeOut: null
    });
    displayStaff();
    displayTimekeepingRecords();
    alert(`${staffAccounts[index].name} has timed in.`);
}

function timeOut(index) {
    staffAccounts[index].timeOut = new Date();
    staffAccounts[index].status = 'Inactive';
    const lastRecordIndex = timekeepingRecords.findLastIndex(
        record => record.name === staffAccounts[index].name && record.timeOut === null
    );
    if (lastRecordIndex !== -1) {
        timekeepingRecords[lastRecordIndex].timeOut = staffAccounts[index].timeOut;
    }
    displayStaff();
    displayTimekeepingRecords();
    alert(`${staffAccounts[index].name} has timed out.`);
}

function displayTimekeepingRecords() {
    const tbody = document.querySelector('#timekeepingRecordsTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    timekeepingRecords.forEach(record => {
        const timeIn = new Date(record.timeIn);
        const timeOut = record.timeOut ? new Date(record.timeOut) : null;
        let hoursWorked = 'N/A';
        if (timeOut) {
            const diffInMs = timeOut - timeIn;
            const diffInHours = diffInMs / (1000 * 60 * 60);
            hoursWorked = diffInHours.toFixed(2);
        }
        tbody.innerHTML += `
            <tr>
                <td>${record.name}</td>
                <td>${record.role}</td>
                <td>${timeIn.toLocaleString()}</td>
                <td>${timeOut ? timeOut.toLocaleString() : 'N/A'}</td>
                <td>${hoursWorked}</td>
            </tr>`;
    });
}

function editStaff(index) {
    const staff = staffAccounts[index];
    const newRole = prompt("Update role:", staff.role);
    const newName = prompt("Update name:", staff.name);
    if (newRole && newName) {
        staffAccounts[index].role = newRole;
        staffAccounts[index].name = newName;
        displayStaff();
    } else {
        alert("Invalid input. No changes were made.");
    }
}

function deleteStaff(index) {
    if (confirm("Delete this staff member?")) {
        staffAccounts.splice(index, 1);
        displayStaff();
    }
}

let salesChartInstance = null;

function renderSalesChart(labels, data) {
    const ctx = document.getElementById('salesChart').getContext('2d');
    
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

// Binago ang function na ito para tumanggap ng isang petsa lang
function generateDailySalesChart(selectedDate) {
    const hourlySales = {};
    const filteredTransactions = completedTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.timestamp);
        return transactionDate.toDateString() === selectedDate.toDateString();
    });

    filteredTransactions.forEach(transaction => {
        const date = new Date(transaction.timestamp);
        // Format: "MM/DD/YYYY, HH:MM AM/PM"
        const key = date.toLocaleDateString('en-US') + ', ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

        if (!hourlySales[key]) {
            hourlySales[key] = 0;
        }
        hourlySales[key] += transaction.total;
    });

    // Sort ang mga keys (date and hour)
    const dates = Object.keys(hourlySales).sort((a, b) => new Date(a) - new Date(b));
    const salesData = dates.map(key => hourlySales[key]);
    
    // I-render ang chart
    renderSalesChart(dates, salesData);

    // I-update ang table
    const reportTableBody = document.querySelector('#dailySalesTable tbody');
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

    document.getElementById('dailySalesTotal').textContent = totalSales.toFixed(2);
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
    } else if (id === 'daily') { // Idagdag ang bagong kondisyon na ito
        generateDailySummary();
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

function selectDrink(name, price) {
    document.getElementById('drinkName').value = name;
    document.getElementById('drinkPrice').value = price;
    closeKeypad();
}

function addOrder() {
    const name = document.getElementById('drinkName').value;
    const qty = parseInt(document.getElementById('drinkQty').value);
    const price = parseFloat(document.getElementById('drinkPrice').value);

    if (!name || isNaN(qty) || qty < 1) return alert("Select a drink and enter a valid quantity.");

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
    today.setHours(0, 0, 0, 0); // Reset time to start of the day
    
    // Filter transactions for today
    const todaysTransactions = completedTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.timestamp);
        return transactionDate.toDateString() === today.toDateString();
    });

    // Populate the first table (Order Summary)
    const orderSummaryBody = document.querySelector('#daily-orders-summary tbody');
    const dailySalesTotalEl = document.getElementById('dailySalesTotal');
    orderSummaryBody.innerHTML = '';
    let totalRevenue = 0;

    if (todaysTransactions.length === 0) {
        orderSummaryBody.innerHTML = '<tr><td colspan="3">No orders for today.</td></tr>';
        dailySalesTotalEl.textContent = '0.00';
    } else {
        todaysTransactions.forEach(transaction => {
            let itemDetails = transaction.items.map(item => `${item.qty}x ${item.name}`).join(', ');
            orderSummaryBody.innerHTML += `
                <tr>
                    <td>#${transaction.id}</td>
                    <td>${itemDetails}</td>
                    <td>₱${transaction.total.toFixed(2)}</td>
                </tr>
            `;
            totalRevenue += transaction.total;
        });
        dailySalesTotalEl.textContent = totalRevenue.toFixed(2);
    }
    
    // Populate the second table (Item Sales Summary)
    const itemSummaryBody = document.querySelector('#daily-item-summary tbody');
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
    const filter = input.value.toLowerCase();
    const tableBody = document.querySelector('#inventory tbody');
    const rows = tableBody.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        const itemCell = rows[i].getElementsByTagName('td')[0];
        if (itemCell) {
            const itemText = itemCell.textContent || itemCell.innerText;
            if (itemText.toLowerCase().indexOf(filter) > -1) {
                rows[i].style.display = "";
            } else {
                rows[i].style.display = "none";
            }
        }
    }
}

function resetOrderForm() {
    document.getElementById('drinkName').value = '';
    document.getElementById('drinkQty').value = 1;
    document.getElementById('drinkPrice').value = '';
}

function editOrderItem(index) {
    const newQty = parseInt(prompt(`Update quantity for ${currentOrder[index].name}:`, currentOrder[index].qty));
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
    if (confirm("Clear all items from the order?")) {
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
    document.getElementById('receipt-date').textContent = new Date().toLocaleString();
}

function openKeypad() {
    document.getElementById("keypad").classList.remove("hidden");
}

function closeKeypad() {
    document.getElementById("keypad").classList.add("hidden");
}

function appendQty(value) {
    const qtyInput = document.getElementById("drinkQty");
    const currentValue = qtyInput.value === '1' ? '' : qtyInput.value;
    qtyInput.value = currentValue + value;
}

function clearQty() {
    document.getElementById("drinkQty").value = "1";
}

document.addEventListener('DOMContentLoaded', () => {
    refreshCategoryUI();

    if (currentUserRole === 'manager') {
        showManagerContent('home');
    } else if (currentUserRole === 'cashier') {
        showCashierContent('order');
    }
});
