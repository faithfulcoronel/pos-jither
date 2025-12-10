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
            .trim() || 'Others';

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

    return generatedName || 'Others';
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
            name: 'Others',
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
        employee_number: account.employee_number || null,
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

    // Apply category filter if selected
    const categoryFilter = document.getElementById('menuCategoryFilter');
    const selectedCategory = categoryFilter ? categoryFilter.value : '';

    if (products.length === 0) {
        container.innerHTML = '<p class="empty-state">No menu items available.</p>';
        return;
    }

    const grouped = products.reduce((accumulator, item, index) => {
        const categoryId = item.categoryId || FALLBACK_CATEGORY_ID;
        if (selectedCategory && categoryId !== selectedCategory) {
            return accumulator; // skip non-matching categories
        }
        if (!accumulator[categoryId]) {
            accumulator[categoryId] = [];
        }
        accumulator[categoryId].push({ item, index });
        return accumulator;
    }, {});

    container.innerHTML = '';

    const categoryIds = Object.keys(grouped);

    if (categoryIds.length === 0) {
        container.innerHTML = '<p class="empty-state">No menu items found for this category.</p>';
        return;
    }

    categoryIds.forEach(categoryId => {
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
            card.dataset.productId = item.id;
            const imagePath = item.image ? `images/${item.image}` : 'images/jowens.png';
            card.innerHTML = `
                <img src="${imagePath}" alt="${item.name}">
                <p>${item.name} - ₱${item.price}</p>
                <p class="menu-item-category">${getCategoryName(item.categoryId)}</p>
                <button onclick="openProductModal('edit', ${index})">Edit</button>
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
    const selectedCategory = categorySelect && categorySelect.value ? categorySelect.value : FALLBACK_CATEGORY_ID;

    if (!name || isNaN(price) || price < 0) {
        alert('Fill all fields correctly.');
        return;
    }

    // Check if file is selected
    const file = imageInput && imageInput.files && imageInput.files.length > 0 ? imageInput.files[0] : null;
    if (!file) {
        alert('Please select an image file.');
        return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        return;
    }

    try {
        // Upload the image first
        const formData = new FormData();
        formData.append('image', file);

        const uploadResponse = await fetch('php/upload_image.php', {
            method: 'POST',
            body: formData
        });

        if (!uploadResponse.ok) {
            throw new Error('Image upload failed.');
        }

        const uploadResult = await uploadResponse.json();
        if (!uploadResult.success) {
            throw new Error(uploadResult.message || 'Image upload failed.');
        }

        const imageFilename = uploadResult.filename;

        // Now create the product with the uploaded image filename
        await apiRequest('products', 'create', {
            name,
            price,
            image: imageFilename,
            categoryId: selectedCategory
        });

        if (nameInput) nameInput.value = '';
        if (priceInput) priceInput.value = '';
        if (imageInput) imageInput.value = '';
        if (categorySelect) categorySelect.value = selectedCategory;

        // Close modal if it exists
        closeProductModal();

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

    // Ask if user wants to upload a new image
    const uploadNewImage = confirm('Do you want to upload a new image? Click OK to upload, or Cancel to keep the current image.');

    let newImageFilename = item.image;

    if (uploadNewImage) {
        // Create a temporary file input for image upload
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';

        // Wait for file selection
        const fileSelected = await new Promise((resolve) => {
            fileInput.onchange = () => resolve(true);
            fileInput.oncancel = () => resolve(false);
            fileInput.click();
        });

        if (fileSelected && fileInput.files && fileInput.files.length > 0) {
            const file = fileInput.files[0];

            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select a valid image file.');
                return;
            }

            try {
                // Upload the image
                const formData = new FormData();
                formData.append('image', file);

                const uploadResponse = await fetch('php/upload_image.php', {
                    method: 'POST',
                    body: formData
                });

                if (!uploadResponse.ok) {
                    throw new Error('Image upload failed.');
                }

                const uploadResult = await uploadResponse.json();
                if (!uploadResult.success) {
                    throw new Error(uploadResult.message || 'Image upload failed.');
                }

                newImageFilename = uploadResult.filename;
            } catch (error) {
                alert('Image upload error: ' + error.message);
                return;
            }
        }
    }

    try {
        await apiRequest('products', 'update', {
            id: item.id,
            name: newName.trim(),
            price: newPrice,
            image: newImageFilename,
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

        // Reload all data to refresh inventory array globally
        await reloadData();
        displayInventory();

        // Update ingredient dropdown if it exists (in Add New Product modal)
        if (typeof initializeIngredientSelect === 'function') {
            initializeIngredientSelect();
        }
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

        // Reload all data to refresh inventory array globally
        await reloadData();
        displayInventory();

        // Update ingredient dropdown if it exists (in Add New Product modal)
        if (typeof initializeIngredientSelect === 'function') {
            initializeIngredientSelect();
        }
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

        // Reload all data to refresh inventory array globally
        await reloadData();
        displayInventory();

        // Update ingredient dropdown if it exists (in Add New Product modal)
        if (typeof initializeIngredientSelect === 'function') {
            initializeIngredientSelect();
        }
    } catch (error) {
        alert(error.message || 'Unable to remove the inventory item.');
    }
}
// Display staff table: Employee #, Name, Role/Position, Actions (Edit/Delete)
// NO Status, NO Time In/Out buttons
function displayStaff() {
    const tbody = document.querySelector('#staff tbody');
    if (!tbody) return;

    // Clear table completely
    tbody.innerHTML = '';

    // Show empty state if no staff
    if (staffAccounts.length === 0) {
        tbody.innerHTML = `
            <tr class="staff-empty-row">
                <td colspan="4">
                    <div class="staff-empty-state">
                        <div class="staff-empty-icon">👥</div>
                        <h3>No Staff Members Yet</h3>
                        <p>Click "Add New Staff" to create your first employee account</p>
                    </div>
                </td>
            </tr>`;
        return;
    }

    // Render each staff member with 4 columns: Employee #, Name, Role, Actions
    staffAccounts.forEach((staff, i) => {
        const employeeNumber = staff.employee_number || 'Not Assigned';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <span class="staff-employee-number">${employeeNumber}</span>
            </td>
            <td>
                <span class="staff-name">${staff.name}</span>
            </td>
            <td>
                <span class="staff-role">${staff.role}</span>
            </td>
            <td>
                <div class="staff-actions">
                    <button class="staff-btn-edit" onclick="editStaff(${i})" title="Edit Staff">
                        <span class="btn-icon">✏️</span> Edit
                    </button>
                    <button class="staff-btn-delete" onclick="deleteStaff(${i})" title="Delete Staff">
                        <span class="btn-icon">🗑️</span> Delete
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Update staff count
    updateStaffCounts();
}

function updateStaffCounts() {
    const totalCount = staffAccounts.length;
    const activeCount = staffAccounts.filter(s => s.status === 'Active').length;

    const totalCountEl = document.getElementById('total-staff-count');
    const activeCountEl = document.getElementById('active-staff-count');

    if (totalCountEl) totalCountEl.textContent = totalCount;
    if (activeCountEl) activeCountEl.textContent = activeCount;
}

async function addStaff() {
    const roleInput = document.getElementById('staffRole');
    const nameInput = document.getElementById('staffName');
    const employeeNumberInput = document.getElementById('staffEmployeeNumber');

    const role = roleInput ? roleInput.value.trim() : '';
    const name = nameInput ? nameInput.value.trim() : '';
    const employeeNumber = employeeNumberInput ? employeeNumberInput.value.trim().toUpperCase() : '';

    // Validation
    if (!role || !name || !employeeNumber) {
        alert('Please fill in all required fields (Role, Name, and Employee Number).');
        return;
    }

    // Validate employee number format (alphanumeric only)
    const employeeNumberPattern = /^[A-Z0-9]+$/;
    if (!employeeNumberPattern.test(employeeNumber)) {
        alert('Employee Number must contain only letters and numbers (e.g., EMP001).');
        return;
    }

    if (employeeNumber.length < 3) {
        alert('Employee Number must be at least 3 characters long.');
        return;
    }

    try {
        // Add staff member to the database
        console.log('Adding staff with data:', { role, name, employee_number: employeeNumber });
        const result = await apiRequest('staff-accounts', 'create', {
            role,
            name,
            employee_number: employeeNumber,
            status: 'Active'
        });
        console.log('Staff creation result:', result);

        // Also create employee record in time keeping system
        try {
            const response = await fetch('php/create-employee.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employee_number: employeeNumber,
                    full_name: name,
                    position: role,
                    department: 'Café Staff',
                    status: 'active'
                })
            });
            const data = await response.json();
            console.log('Employee created in timekeeping system:', data);
        } catch (timeError) {
            console.warn('Note: Could not create employee in timekeeping system:', timeError);
        }

        // Clear form
        if (roleInput) roleInput.value = '';
        if (nameInput) nameInput.value = '';
        if (employeeNumberInput) employeeNumberInput.value = '';

        // Hide form
        toggleForm('staffFormContainer');

        alert(`Staff member added successfully!\n\nEmployee Number: ${employeeNumber}\n\nThe employee can now use this number to clock in/out at the Time Keeping terminal.`);

        // Refresh staff list
        if (typeof reloadData === 'function') {
            await reloadData();
        }
        console.log('Staff accounts after reload:', staffAccounts);
        if (staffAccounts.length > 0) {
            console.log('Sample staff member:', JSON.stringify(staffAccounts[staffAccounts.length - 1], null, 2));
        }
        if (typeof displayStaff === 'function') {
            displayStaff();
        }
        if (typeof displayTimekeepingRecords === 'function') {
            displayTimekeepingRecords();
        }
    } catch (error) {
        alert(error.message || 'Unable to add the staff member. Please check if the Employee Number is already in use.');
    }
}

// Time In/Out functions removed - Use Time Keeping System instead
// Staff management now focuses only on employee data management
// Employees should use the Time Keeping terminal to clock in/out using their employee number

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

    if (id === 'home') {
        // Initialize Home Dashboard
        if (typeof initializeHomeDashboard === 'function') {
            initializeHomeDashboard();
        }
    }
    if (id === 'menu') displayMenuItems();
    if (id === 'inventory') {
        // Initialize Inventify Inventory System
        if (typeof initializeInventify === 'function') {
            initializeInventify();
        }
    }
    if (id === 'staff') {
        displayStaff();
        displayTimekeepingRecords();
    }
    if (id === 'sales') {
        // Load overall sales chart and sales table
        generateOverallSalesChart();
        loadSalesByDate();

        // Initialize Sales Analysis Dashboard with charts
        if (typeof initializeSalesDashboard === 'function') {
            initializeSalesDashboard();
        }
    }
    if (id === 'recipe-management') {
        // Initialize recipe management
        if (typeof showRecipeManagement === 'function') {
            showRecipeManagement();
        }
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

    // Validation
    if (!name) {
        alert('Please select a drink first.');
        return;
    }

    if (isNaN(qty)) {
        alert('Please enter a valid quantity.');
        return;
    }

    if (qty <= 0) {
        alert('Quantity must be a positive number (1 or greater).\nNegative quantities are not allowed.');
        return;
    }

    if (qty > 1000) {
        alert('Quantity is too large. Please enter a reasonable amount (maximum 1000).');
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
        reversedTransactions.forEach((transaction, index) => {
            const li = document.createElement('li');
            li.className = 'transaction-item';
            li.setAttribute('data-transaction-index', index);
            li.innerHTML = `
                <div class="transaction-info">
                    <strong>${transaction.reference || transaction.id}</strong>
                    <span class="transaction-date">${new Date(transaction.created_at).toLocaleString()}</span>
                    <span class="transaction-total">₱${parseFloat(transaction.total).toFixed(2)}</span>
                </div>
                <button class="print-transaction-btn" title="Print Receipt">
                    🖨️ Print
                </button>
            `;

            // Store transaction data for print function
            const printBtn = li.querySelector('.print-transaction-btn');
            printBtn.onclick = (e) => {
                e.stopPropagation();
                printTransactionReceipt(transaction);
            };

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

    // Calculate total
    let total = 0;

    currentOrder.forEach((item, index) => {
        const itemTotal = item.qty * item.price;
        total += itemTotal;

        const li = document.createElement('li');
        li.innerHTML = `
            <span>${item.qty}x ${item.name} - ₱${itemTotal.toFixed(2)}</span>
            <div>
                <button onclick="editOrderItem(${index})">Edit</button>
                <button onclick="removeOrderItem(${index})">Cancel</button>
            </div>
        `;
        orderList.appendChild(li);
    });

    // Update the total display
    const orderTotalElement = document.getElementById('orderTotal');
    if (orderTotalElement) {
        orderTotalElement.textContent = total.toFixed(2);
    }

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
    const receiptSubtotal = document.getElementById('receipt-subtotal');
    const receiptVatable = document.getElementById('receipt-vatable');
    const receiptVatExempt = document.getElementById('receipt-vat-exempt');
    const receiptVat = document.getElementById('receipt-vat');

    if (!receiptItems || !receiptTotalEl) return;

    // Reset and build receipt items
    receiptItems.innerHTML = '';
    let subtotal = 0;
    currentOrder.forEach(item => {
        const itemTotal = item.qty * item.price;
        subtotal += itemTotal;
        receiptItems.innerHTML += `
            <div class="receipt-item">
                <div class="receipt-item-name">${item.name}</div>
                <div class="receipt-item-details">
                    <span class="receipt-item-qty">${item.qty}x ₱${item.price.toFixed(2)}</span>
                    <span class="receipt-item-price">₱${itemTotal.toFixed(2)}</span>
                </div>
            </div>
        `;
    });

    // Apply discount if selected (from discount-vat-system.js)
    const discountRate = (typeof currentDiscount !== 'undefined' && currentDiscount.rate) ? currentDiscount.rate : 0;
    const discountLabel = (typeof currentDiscount !== 'undefined' && currentDiscount.label) ? currentDiscount.label : 'No Discount';
    const isVatExempt = (typeof currentDiscount !== 'undefined' && currentDiscount.isVatExempt) ? currentDiscount.isVatExempt : false;

    const discountAmount = (subtotal * discountRate) / 100;
    const afterDiscount = subtotal - discountAmount;

    // Calculate VAT based on discount type
    let vatableSales = 0;
    let vatExemptSales = 0;
    let vat = 0;
    const vatRate = 0.12;

    if (isVatExempt) {
        // Senior Citizen or PWD: VAT-exempt
        vatExemptSales = afterDiscount;
        vatableSales = 0;
        vat = 0;
    } else {
        // Regular or Athlete: 12% VAT (inclusive)
        vatableSales = afterDiscount / (1 + vatRate);
        vat = afterDiscount - vatableSales;
        vatExemptSales = 0;
    }

    // Show/hide discount on receipt
    const discountLine = document.getElementById('receipt-discount-line');
    const discountAmountEl = document.getElementById('receipt-discount');
    const discountTypeLine = document.getElementById('receipt-discount-type-line');
    const discountTypeEl = document.getElementById('receipt-discount-type');

    if (discountRate > 0) {
        if (discountLine) discountLine.style.display = 'flex';
        if (discountAmountEl) discountAmountEl.textContent = discountAmount.toFixed(2);
        if (discountTypeLine) discountTypeLine.style.display = 'block';
        if (discountTypeEl) discountTypeEl.textContent = discountLabel + ' (' + discountRate + '%)';
    } else {
        if (discountLine) discountLine.style.display = 'none';
        if (discountTypeLine) discountTypeLine.style.display = 'none';
    }

    // Update receipt display
    if (receiptSubtotal) receiptSubtotal.textContent = subtotal.toFixed(2);
    if (receiptVatable) receiptVatable.textContent = vatableSales.toFixed(2);
    if (receiptVatExempt) receiptVatExempt.textContent = vatExemptSales.toFixed(2);
    if (receiptVat) receiptVat.textContent = vat.toFixed(2);
    receiptTotalEl.textContent = afterDiscount.toFixed(2);

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
        const result = await apiRequest('sales-transactions', 'create', transactionData);

        // Clear the current order after successful save
        currentOrder = [];
        renderOrderList();

        // Refresh daily summary
        generateDailySummary().catch(error => {
            console.error('Failed to refresh daily summary:', error);
        });

        // Build success message
        let message = `Sale successfully recorded!\nOrder Number: ${receiptOrderNumber}\nTotal: ₱${receiptTotal.toFixed(2)}`;

        // Check for inventory warnings
        if (result.inventory_errors && result.inventory_errors.length > 0) {
            message += '\n\n⚠️ INVENTORY WARNINGS:';
            result.inventory_errors.forEach(error => {
                message += `\n• ${error.productName}:`;
                if (error.errors && error.errors.length > 0) {
                    error.errors.forEach(err => {
                        if (err.shortage !== undefined) {
                            message += `\n  - ${err.item}: Insufficient stock! (Short by ${err.shortage.toFixed(2)} ${err.unit || 'units'})`;
                        } else if (typeof err === 'string') {
                            message += `\n  - ${err}`;
                        }
                    });
                }
            });
        }

        // Check for low inventory after deductions
        if (result.inventory_deductions && result.inventory_deductions.length > 0) {
            const lowStockItems = [];
            result.inventory_deductions.forEach(deduction => {
                if (deduction.deductions && deduction.deductions.length > 0) {
                    deduction.deductions.forEach(item => {
                        // Alert if remaining quantity is less than 20% of what was deducted (arbitrary threshold)
                        const threshold = item.deducted * 5; // If less than 5x the deducted amount remains
                        if (item.newQty < threshold && item.newQty > 0) {
                            lowStockItems.push(`${item.item}: ${item.newQty.toFixed(2)} ${item.unit} remaining`);
                        } else if (item.newQty <= 0) {
                            lowStockItems.push(`${item.item}: DEPLETED!`);
                        }
                    });
                }
            });

            if (lowStockItems.length > 0) {
                message += '\n\n📦 LOW STOCK ALERT:';
                lowStockItems.forEach(item => {
                    message += `\n• ${item}`;
                });
            }
        }

        alert(message);

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

// ========== ENHANCED POS FEATURES ==========

// Product Search with Barcode Support
function searchProduct(event) {
    const searchInput = document.getElementById('product-search');
    if (!searchInput) return;

    const query = searchInput.value.toLowerCase().trim();

    // If Enter is pressed, try to find and add product
    if (event.key === 'Enter' && query) {
        const matchingProduct = products.find(p =>
            p.name.toLowerCase().includes(query) ||
            p.id.toLowerCase() === query ||
            (p.barcode && p.barcode === query)
        );

        if (matchingProduct) {
            selectDrink(matchingProduct);
            document.getElementById('drinkQty').value = 1;
            document.getElementById('drinkQty').focus();
            searchInput.value = '';
        } else {
            alert('Product not found: ' + query);
        }
    }

    // Filter menu gallery as user types
    if (query.length >= 2) {
        filterMenuGalleryBySearch(query);
    } else {
        displayMenuGallery(); // Show all if search is cleared
    }
}

function filterMenuGalleryBySearch(query) {
    const container = document.getElementById('menuItemsGallery');
    if (!container) return;

    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query)
    );

    container.innerHTML = '';
    if (filtered.length === 0) {
        container.innerHTML = '<p class="empty-state">No products found.</p>';
        return;
    }

    filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'menu-item';
        const imagePath = item.image ? `images/${item.image}` : 'images/jowens.png';
        card.innerHTML = `
            <img src="${imagePath}" alt="${item.name}">
            <p>${item.name}</p>
            <p>₱${item.price}</p>
        `;
        card.onclick = () => selectDrink(item);
        container.appendChild(card);
    });
}

// Enhanced Checkout with Payment Methods
function checkOut() {
    if (!currentOrder || currentOrder.length === 0) {
        alert('No items in the order. Please add items before checkout.');
        return;
    }

    // Calculate total
    const total = currentOrder.reduce((sum, item) => sum + (item.qty * item.price), 0);

    // Show payment method selection
    showPaymentModal(total);
}

function showPaymentModal(total) {
    const modal = document.createElement('div');
    modal.id = 'payment-modal';
    modal.className = 'payment-modal';
    modal.innerHTML = `
        <div class="payment-modal-content">
            <h2>Select Payment Method</h2>
            <p class="payment-total">Total Amount: ₱${total.toFixed(2)}</p>

            <div class="payment-methods">
                <button class="payment-btn cash-btn" onclick="processPayment('Cash', ${total})">
                    💵 Cash
                </button>
                <button class="payment-btn card-btn" onclick="processPayment('Card', ${total})">
                    💳 Card
                </button>
                <button class="payment-btn gcash-btn" onclick="processPayment('GCash', ${total})">
                    📱 GCash
                </button>
            </div>

            <button class="cancel-payment-btn" onclick="closePaymentModal()">Cancel</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    if (modal) {
        modal.remove();
    }
}

async function processPayment(paymentMethod, total) {
    closePaymentModal();

    let received = total;
    let change = 0;

    // For cash payment, show change calculator
    if (paymentMethod === 'Cash') {
        const amountReceived = prompt(`Total: ₱${total.toFixed(2)}\n\nEnter amount received:`, total.toFixed(2));
        if (amountReceived === null) return; // Cancelled

        received = parseFloat(amountReceived);
        if (isNaN(received) || received < total) {
            alert('Invalid amount or insufficient payment.');
            return;
        }

        change = received - total;
        alert(`Payment Method: ${paymentMethod}\nAmount Received: ₱${received.toFixed(2)}\nChange: ₱${change.toFixed(2)}`);
    } else {
        alert(`Processing ${paymentMethod} payment of ₱${total.toFixed(2)}...\nPayment confirmed!`);
    }

    // Show discount selection AFTER payment
    await showDiscountSelectionDialog();

    // Process the receipt and finalize sale
    await updateReceipt();

    // Print receipt option
    if (confirm('Payment successful!')) {
        printReceipt();
    }
}

// Show discount selection dialog after payment
function showDiscountSelectionDialog() {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content discount-modal">
                <div class="discount-modal-header">
                    <div class="discount-badge">%</div>
                    <div>
                        <p class="discount-eyebrow">Discount options</p>
                        <h2>Select Customer Discount Type</h2>
                    </div>
                    <button class="discount-close-btn" type="button" aria-label="Close discount selection">&times;</button>
                </div>

                <div class="discount-options">
                    <button class="discount-select-btn" data-type="none" data-rate="0" data-label="No Discount">
                        <div class="discount-option-icon">-</div>
                        <div class="discount-details">
                            <span class="discount-title">No Discount</span>
                            <span class="discount-subtitle">Charge regular price</span>
                        </div>
                        <span class="discount-rate-chip">0%</span>
                    </button>

                    <button class="discount-select-btn" data-type="senior" data-rate="20" data-label="Senior Citizen">
                        <div class="discount-option-icon">SC</div>
                        <div class="discount-details">
                            <span class="discount-title">Senior Citizen</span>
                            <span class="discount-subtitle">20% off and VAT exempt</span>
                        </div>
                        <span class="discount-rate-chip">20%</span>
                    </button>

                    <button class="discount-select-btn" data-type="pwd" data-rate="20" data-label="PWD">
                        <div class="discount-option-icon">PWD</div>
                        <div class="discount-details">
                            <span class="discount-title">Person with Disability</span>
                            <span class="discount-subtitle">20% off and VAT exempt</span>
                        </div>
                        <span class="discount-rate-chip">20%</span>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeModal = () => {
            document.body.removeChild(modal);
            resolve();
        };

        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });

        const closeButton = modal.querySelector('.discount-close-btn');
        if (closeButton) {
            closeButton.addEventListener('click', closeModal);
        }

        // Handle discount selection
        modal.querySelectorAll('.discount-select-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const type = this.dataset.type;
                const rate = parseInt(this.dataset.rate);
                const label = this.dataset.label || (this.querySelector('.discount-title')?.textContent || '').trim();

                // Apply discount
                if (typeof selectDiscountType === 'function') {
                    selectDiscountType(type, rate, label);
                }

                // Close modal
                closeModal();
            });
        });
    });
}

// Print Transaction Receipt from List
function printTransactionReceipt(transaction) {
    try {
        if (!transaction) {
            alert('Transaction data not available.');
            return;
        }

        const items = transaction.items || [];

        // Calculate totals
        let subtotal = parseFloat(transaction.total) || 0;
        const vatRate = 0.12;
        const vatableSales = subtotal / (1 + vatRate);
        const vat = subtotal - vatableSales;

        // Create PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [80, 200]
        });

        doc.setFont('courier', 'normal');
        let y = 10;
        const lineHeight = 5;
        const pageWidth = 80;

        // Header
        doc.setFontSize(12);
        doc.setFont('courier', 'bold');
        doc.text("Jowen's Kitchen & Cafe", pageWidth / 2, y, { align: 'center' });
        y += lineHeight;

        doc.setFontSize(8);
        doc.setFont('courier', 'normal');
        doc.text('Tax Invoice / Official Receipt', pageWidth / 2, y, { align: 'center' });
        y += lineHeight + 2;

        doc.text('================================', pageWidth / 2, y, { align: 'center' });
        y += lineHeight;

        // Receipt info
        doc.text(`Date: ${new Date(transaction.created_at).toLocaleString()}`, 5, y);
        y += lineHeight;
        doc.text(`Receipt #: ${transaction.reference}`, 5, y);
        y += lineHeight;
        doc.text(`Cashier: ${window.currentUsername || 'cashier'}`, 5, y);
        y += lineHeight;

        doc.text('================================', pageWidth / 2, y, { align: 'center' });
        y += lineHeight;

        // Items
        items.forEach(item => {
            // Handle both API formats (name/qty/price from get-daily, product_name/quantity/unit_price from create)
            const itemName = item.name || item.product_name || 'Item';
            const itemQty = item.qty || item.quantity || 0;
            const itemPrice = item.price || item.unit_price || 0;
            const itemTotal = itemQty * itemPrice;

            doc.text(itemName, 5, y);
            y += lineHeight;

            const qtyText = `  ${itemQty} x ${parseFloat(itemPrice).toFixed(2)}`;
            const totalText = `= ${itemTotal.toFixed(2)}`;
            doc.text(qtyText, 5, y);
            doc.text(totalText, 75, y, { align: 'right' });
            y += lineHeight;
        });

        doc.text('--------------------------------', pageWidth / 2, y, { align: 'center' });
        y += lineHeight;

        // Summary
        doc.text('Subtotal:', 5, y);
        doc.text(`${subtotal.toFixed(2)}`, 75, y, { align: 'right' });
        y += lineHeight;

        doc.text('================================', pageWidth / 2, y, { align: 'center' });
        y += lineHeight;
        doc.text('VAT Breakdown:', 5, y);
        y += lineHeight;

        doc.text('  Vatable Sales:', 5, y);
        doc.text(`${vatableSales.toFixed(2)}`, 75, y, { align: 'right' });
        y += lineHeight;

        doc.text('  VAT-Exempt Sales:', 5, y);
        doc.text('0.00', 75, y, { align: 'right' });
        y += lineHeight;

        doc.text('  VAT (12%):', 5, y);
        doc.text(`${vat.toFixed(2)}`, 75, y, { align: 'right' });
        y += lineHeight;

        doc.text('================================', pageWidth / 2, y, { align: 'center' });
        y += lineHeight;
        doc.setFont('courier', 'bold');
        doc.setFontSize(10);
        doc.text('TOTAL:', 5, y);
        doc.text(`${subtotal.toFixed(2)}`, 75, y, { align: 'right' });
        y += lineHeight + 2;

        // Footer
        doc.setFont('courier', 'normal');
        doc.setFontSize(8);
        doc.text('================================', pageWidth / 2, y, { align: 'center' });
        y += lineHeight;
        doc.text('Thank you for your purchase!', pageWidth / 2, y, { align: 'center' });
        y += lineHeight;
        doc.text('VAT Reg TIN: 123-456-789-000', pageWidth / 2, y, { align: 'center' });
        y += lineHeight;
        doc.text('Powered by Jowen\'s POS', pageWidth / 2, y, { align: 'center' });

        // Save PDF
        doc.save(`Receipt_${transaction.reference}_Reprint.pdf`);

    } catch (error) {
        console.error('Error printing transaction receipt:', error);
        alert('Failed to print receipt. Error: ' + error.message);
    }
}

// Return/Refund Process
function showReturnRefundDialog() {
    const orderNo = prompt('Enter Order Number for return/refund:');
    if (!orderNo) return;

    // Search for the transaction
    const transaction = salesTransactions.find(t => t.reference === orderNo);
    if (!transaction) {
        alert('Order not found. Please check the order number.');
        return;
    }

    const confirmRefund = confirm(
        `Order #${orderNo}\nTotal: ₱${transaction.total.toFixed(2)}\n\nProceed with refund?`
    );

    if (confirmRefund) {
        processRefund(transaction);
    }
}

async function processRefund(transaction) {
    const reason = prompt('Reason for refund:', 'Customer request');
    if (!reason) return;

    try {
        // Record the refund (you can add this to backend later)
        alert(`Refund processed for Order #${transaction.reference}\nAmount: ₱${transaction.total.toFixed(2)}\nReason: ${reason}`);

        // Optionally delete the transaction or mark it as refunded
        // await apiRequest('sales-transactions', 'refund', { id: transaction.id, reason });

        console.log('Refund processed:', transaction.reference);
    } catch (error) {
        alert('Failed to process refund: ' + error.message);
    }
}

// X-Read Report (Current shift/session sales without clearing)
async function generateXRead() {
    try {
        const response = await apiRequest('sales-transactions', 'get-daily', null, {
            method: 'GET',
            skipAutoApply: true
        });

        const transactions = response.data || [];

        if (transactions.length === 0) {
            alert('No transactions for today.');
            return;
        }

        const totalSales = transactions.reduce((sum, t) => sum + parseFloat(t.total), 0);
        const transactionCount = transactions.length;

        // Create X-Read report window
        const reportWindow = window.open('', '', 'width=400,height=600');
        reportWindow.document.write(`
            <html>
            <head>
                <title>X-Read Report</title>
                <style>
                    body {
                        font-family: 'Courier New', monospace;
                        padding: 20px;
                        max-width: 400px;
                    }
                    h2 {
                        text-align: center;
                        border-bottom: 2px solid #000;
                        padding-bottom: 10px;
                    }
                    .report-header {
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    .report-line {
                        display: flex;
                        justify-content: space-between;
                        margin: 5px 0;
                    }
                    .report-total {
                        border-top: 2px solid #000;
                        margin-top: 15px;
                        padding-top: 10px;
                        font-weight: bold;
                        font-size: 1.2em;
                    }
                    @media print {
                        body { margin: 0; padding: 10px; }
                    }
                </style>
            </head>
            <body>
                <div class="report-header">
                    <h2>X-READ REPORT</h2>
                    <p><strong>Jowen's Kitchen & Cafe</strong></p>
                    <p>Date: ${new Date().toLocaleDateString()}</p>
                    <p>Time: ${new Date().toLocaleTimeString()}</p>
                    <p>Cashier: ${currentUsername || 'N/A'}</p>
                </div>

                <div class="report-line">
                    <span>Transaction Count:</span>
                    <span>${transactionCount}</span>
                </div>

                <div class="report-line report-total">
                    <span>TOTAL SALES:</span>
                    <span>₱${totalSales.toFixed(2)}</span>
                </div>

                <div style="margin-top: 30px; text-align: center;">
                    <p>*** X-READ (Non-Reset Report) ***</p>
                    <p style="font-size: 0.9em;">This is an interim report.</p>
                    <p style="font-size: 0.9em;">Sales data is not cleared.</p>
                </div>

                <div style="margin-top: 20px; text-align: center;">
                    <button onclick="window.print()" style="padding: 10px 20px; font-size: 1em;">Print Report</button>
                </div>
            </body>
            </html>
        `);
        reportWindow.document.close();
    } catch (error) {
        alert('Failed to generate X-Read report: ' + error.message);
    }
}

// Z-Read Report (End of day sales - typically would clear/reset counters)
async function generateZRead() {
    const confirmZRead = confirm(
        'Z-READ REPORT\n\n' +
        'This will generate an end-of-day report.\n' +
        'In a production system, this would typically reset daily counters.\n\n' +
        'Continue?'
    );

    if (!confirmZRead) return;

    try {
        const response = await apiRequest('sales-transactions', 'get-daily', null, {
            method: 'GET',
            skipAutoApply: true
        });

        const transactions = response.data || [];

        if (transactions.length === 0) {
            alert('No transactions for today.');
            return;
        }

        const totalSales = transactions.reduce((sum, t) => sum + parseFloat(t.total), 0);
        const transactionCount = transactions.length;

        // Calculate payment method breakdown (if available)
        const cashSales = totalSales; // Placeholder - would need payment method tracking
        const cardSales = 0;
        const gcashSales = 0;

        // Create Z-Read report window
        const reportWindow = window.open('', '', 'width=400,height=700');
        reportWindow.document.write(`
            <html>
            <head>
                <title>Z-Read Report</title>
                <style>
                    body {
                        font-family: 'Courier New', monospace;
                        padding: 20px;
                        max-width: 400px;
                    }
                    h2 {
                        text-align: center;
                        border-bottom: 2px solid #000;
                        padding-bottom: 10px;
                    }
                    .report-header {
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    .report-section {
                        margin: 20px 0;
                        padding: 10px 0;
                        border-top: 1px dashed #000;
                    }
                    .report-line {
                        display: flex;
                        justify-content: space-between;
                        margin: 5px 0;
                    }
                    .report-total {
                        border-top: 2px solid #000;
                        margin-top: 15px;
                        padding-top: 10px;
                        font-weight: bold;
                        font-size: 1.3em;
                    }
                    @media print {
                        body { margin: 0; padding: 10px; }
                    }
                </style>
            </head>
            <body>
                <div class="report-header">
                    <h2>Z-READ REPORT</h2>
                    <p><strong>Jowen's Kitchen & Cafe</strong></p>
                    <p>Date: ${new Date().toLocaleDateString()}</p>
                    <p>Time: ${new Date().toLocaleTimeString()}</p>
                    <p>Cashier: ${currentUsername || 'N/A'}</p>
                </div>

                <div class="report-section">
                    <h3 style="margin: 10px 0;">TRANSACTION SUMMARY</h3>
                    <div class="report-line">
                        <span>Transaction Count:</span>
                        <span>${transactionCount}</span>
                    </div>
                    <div class="report-line">
                        <span>First Transaction:</span>
                        <span>${transactions[0].reference}</span>
                    </div>
                    <div class="report-line">
                        <span>Last Transaction:</span>
                        <span>${transactions[transactions.length - 1].reference}</span>
                    </div>
                </div>

                <div class="report-section">
                    <h3 style="margin: 10px 0;">PAYMENT BREAKDOWN</h3>
                    <div class="report-line">
                        <span>Cash Sales:</span>
                        <span>₱${cashSales.toFixed(2)}</span>
                    </div>
                    <div class="report-line">
                        <span>Card Sales:</span>
                        <span>₱${cardSales.toFixed(2)}</span>
                    </div>
                    <div class="report-line">
                        <span>GCash Sales:</span>
                        <span>₱${gcashSales.toFixed(2)}</span>
                    </div>
                </div>

                <div class="report-line report-total">
                    <span>GROSS SALES:</span>
                    <span>₱${totalSales.toFixed(2)}</span>
                </div>

                <div style="margin-top: 30px; text-align: center;">
                    <p>*** Z-READ (End of Day Report) ***</p>
                    <p style="font-size: 0.9em;">This is an official end-of-day report.</p>
                    <p style="font-size: 0.9em; color: #c00;">Keep this report for accounting purposes.</p>
                </div>

                <div style="margin-top: 20px; text-align: center;">
                    <button onclick="window.print()" style="padding: 10px 20px; font-size: 1em;">Print Report</button>
                </div>
            </body>
            </html>
        `);
        reportWindow.document.close();

        alert('Z-Read report generated successfully!\n\nNote: In a production system, daily counters would be reset after this report.');
    } catch (error) {
        alert('Failed to generate Z-Read report: ' + error.message);
    }
}

// Add to cashier navigation
function addReturnRefundButton() {
    const orderContent = document.getElementById('order-content');
    if (orderContent && !document.getElementById('refund-btn')) {
        const buttonDiv = document.createElement('div');
        buttonDiv.style.marginTop = '20px';
        buttonDiv.innerHTML = '<button id="refund-btn" onclick="showReturnRefundDialog()" style="background: #d94841;">🔄 Return/Refund</button>';
        orderContent.appendChild(buttonDiv);
    }
}

// ============================================================================
// REPORTING FUNCTIONS
// ============================================================================

function showReportTab(tabName, evt) {
    // Hide all report tabs
    document.querySelectorAll('.report-tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });

    // Remove active class from all tab buttons
    document.querySelectorAll('.report-tab').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    const targetTab = document.getElementById(tabName + '-tab');
    if (targetTab) {
        targetTab.classList.remove('hidden');
    }

    // Activate the clicked button
    if (evt && evt.target) {
        evt.target.classList.add('active');
    }

    // Auto-generate report on tab open
    switch(tabName) {
        case 'sales-report':
            generateSalesReport();
            break;
        case 'inventory-summary':
            generateInventorySummary();
            break;
        case 'item-velocity':
            generateItemVelocity();
            break;
        case 'stock-aging':
            generateStockAging();
            break;
        case 'purchase-history':
            generatePurchaseHistory();
            break;
        case 'profit-loss':
            generateProfitLoss();
            break;
        case 'shrinkage':
            generateShrinkageReport();
            break;
    }
}

async function generateSalesReport() {
    const period = document.getElementById('salesReportPeriod').value;
    const startDate = document.getElementById('salesStartDate').value;
    const endDate = document.getElementById('salesEndDate').value;

    try {
        const response = await fetch('php/reports.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'sales_report',
                period: period,
                start_date: startDate,
                end_date: endDate
            })
        });

        const data = await response.json();

        if (data.success) {
            // Update summary cards
            document.getElementById('totalRevenue').textContent = `₱${parseFloat(data.summary.total_revenue).toFixed(2)}`;
            document.getElementById('totalTransactions').textContent = data.summary.total_transactions;
            document.getElementById('avgTransaction').textContent = `₱${parseFloat(data.summary.avg_transaction).toFixed(2)}`;
            document.getElementById('totalDiscounts').textContent = `₱${parseFloat(data.summary.total_discounts).toFixed(2)}`;

            // Populate table
            const tbody = document.querySelector('#salesReportTable tbody');
            tbody.innerHTML = '';

            data.records.forEach(record => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${record.date}</td>
                    <td>${record.transactions}</td>
                    <td>₱${parseFloat(record.revenue).toFixed(2)}</td>
                    <td>₱${parseFloat(record.discounts).toFixed(2)}</td>
                    <td>₱${parseFloat(record.tax).toFixed(2)}</td>
                    <td>₱${parseFloat(record.net_revenue).toFixed(2)}</td>
                `;
            });

            // Draw chart if Chart.js is available
            if (typeof Chart !== 'undefined' && data.records.length > 0) {
                drawSalesChart(data.records);
            }
        }
    } catch (error) {
        console.error('Error generating sales report:', error);
        alert('Failed to generate sales report');
    }
}

function drawSalesChart(records) {
    const ctx = document.getElementById('salesReportChart');
    if (!ctx) return;

    // Destroy existing chart if exists
    if (window.salesChart) {
        window.salesChart.destroy();
    }

    window.salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: records.map(r => r.date),
            datasets: [{
                label: 'Revenue',
                data: records.map(r => parseFloat(r.revenue)),
                borderColor: 'rgb(194, 112, 61)',
                backgroundColor: 'rgba(194, 112, 61, 0.1)',
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₱' + value.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

async function generateInventorySummary() {
    try {
        const response = await fetch('php/reports.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'inventory_summary' })
        });

        const data = await response.json();

        if (data.success) {
            // Update summary cards
            document.getElementById('totalItems').textContent = data.summary.total_items;
            document.getElementById('lowStockItems').textContent = data.summary.low_stock_items;
            document.getElementById('outOfStockItems').textContent = data.summary.out_of_stock_items;
            document.getElementById('totalInventoryValue').textContent = `₱${parseFloat(data.summary.total_value).toFixed(2)}`;

            // Populate table
            const tbody = document.querySelector('#inventorySummaryTable tbody');
            tbody.innerHTML = '';

            data.items.forEach(item => {
                const row = tbody.insertRow();
                const statusClass = item.quantity <= 0 ? 'out-of-stock' :
                                   item.quantity <= item.min_stock ? 'low-stock' : 'in-stock';
                const statusText = item.quantity <= 0 ? 'Out of Stock' :
                                  item.quantity <= item.min_stock ? 'Low Stock' : 'In Stock';

                row.innerHTML = `
                    <td>${item.item}</td>
                    <td>${item.quantity}</td>
                    <td>${item.unit}</td>
                    <td>${item.min_stock}/${item.max_stock}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>₱${parseFloat(item.value || 0).toFixed(2)}</td>
                `;
            });
        }
    } catch (error) {
        console.error('Error generating inventory summary:', error);
        alert('Failed to generate inventory summary');
    }
}

async function generateItemVelocity() {
    const period = document.getElementById('velocityPeriod').value;

    try {
        const response = await fetch('php/reports.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'item_velocity',
                period: period
            })
        });

        const data = await response.json();

        if (data.success) {
            // Populate fast-moving table
            const fastTbody = document.querySelector('#fastMovingTable tbody');
            fastTbody.innerHTML = '';

            data.fast_moving.forEach(item => {
                const row = fastTbody.insertRow();
                row.innerHTML = `
                    <td>${item.product_name}</td>
                    <td>${item.total_sold}</td>
                    <td>₱${parseFloat(item.revenue).toFixed(2)}</td>
                    <td>${parseFloat(item.avg_daily_sales).toFixed(2)}</td>
                `;
            });

            // Populate slow-moving table
            const slowTbody = document.querySelector('#slowMovingTable tbody');
            slowTbody.innerHTML = '';

            data.slow_moving.forEach(item => {
                const row = slowTbody.insertRow();
                row.innerHTML = `
                    <td>${item.product_name}</td>
                    <td>${item.total_sold}</td>
                    <td>₱${parseFloat(item.revenue).toFixed(2)}</td>
                    <td>${parseFloat(item.avg_daily_sales).toFixed(2)}</td>
                `;
            });
        }
    } catch (error) {
        console.error('Error generating item velocity:', error);
        alert('Failed to generate item velocity report');
    }
}

async function generateStockAging() {
    try {
        const response = await fetch('php/reports.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'stock_aging' })
        });

        const data = await response.json();

        if (data.success) {
            // Update aging summary cards
            document.getElementById('fresh30').textContent = data.summary.fresh_0_30;
            document.getElementById('medium60').textContent = data.summary.medium_31_60;
            document.getElementById('old90').textContent = data.summary.old_61_90;
            document.getElementById('veryOld90').textContent = data.summary.very_old_90_plus;

            // Populate table
            const tbody = document.querySelector('#stockAgingTable tbody');
            tbody.innerHTML = '';

            data.batches.forEach(batch => {
                const row = tbody.insertRow();
                const ageClass = batch.age_days <= 30 ? 'fresh' :
                                batch.age_days <= 60 ? 'medium' :
                                batch.age_days <= 90 ? 'old' : 'very-old';

                row.innerHTML = `
                    <td>${batch.batch_number}</td>
                    <td>${batch.item_name}</td>
                    <td>${batch.quantity}</td>
                    <td>${batch.received_date}</td>
                    <td><span class="age-badge ${ageClass}">${batch.age_days} days</span></td>
                    <td>${batch.status}</td>
                    <td>${batch.expiry_date || 'N/A'}</td>
                `;
            });
        }
    } catch (error) {
        console.error('Error generating stock aging report:', error);
        alert('Failed to generate stock aging report');
    }
}

async function generatePurchaseHistory() {
    const period = document.getElementById('purchasePeriod').value;

    try {
        const response = await fetch('php/reports.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'purchase_history',
                period: period
            })
        });

        const data = await response.json();

        if (data.success) {
            // Update summary cards
            document.getElementById('totalPOs').textContent = data.summary.total_orders;
            document.getElementById('totalSpent').textContent = `₱${parseFloat(data.summary.total_spent).toFixed(2)}`;
            document.getElementById('pendingPOs').textContent = data.summary.pending_orders;

            // Populate table
            const tbody = document.querySelector('#purchaseHistoryTable tbody');
            tbody.innerHTML = '';

            data.orders.forEach(order => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${order.po_number}</td>
                    <td>${order.supplier_name}</td>
                    <td>${order.order_date}</td>
                    <td>${order.expected_delivery || 'N/A'}</td>
                    <td><span class="status-badge ${order.status}">${order.status}</span></td>
                    <td>₱${parseFloat(order.total_amount).toFixed(2)}</td>
                    <td>${order.item_count}</td>
                `;
            });
        }
    } catch (error) {
        console.error('Error generating purchase history:', error);
        alert('Failed to generate purchase history');
    }
}

async function generateProfitLoss() {
    const period = document.getElementById('plPeriod').value;
    const startDate = document.getElementById('plStartDate').value;
    const endDate = document.getElementById('plEndDate').value;

    try {
        const response = await fetch('php/reports.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'profit_loss',
                period: period,
                start_date: startDate,
                end_date: endDate
            })
        });

        const data = await response.json();

        if (data.success) {
            // Update summary cards
            document.getElementById('plRevenue').textContent = `₱${parseFloat(data.summary.revenue).toFixed(2)}`;
            document.getElementById('plCogs').textContent = `₱${parseFloat(data.summary.cogs).toFixed(2)}`;
            document.getElementById('plGrossProfit').textContent = `₱${parseFloat(data.summary.gross_profit).toFixed(2)}`;
            document.getElementById('plMargin').textContent = `${parseFloat(data.summary.margin).toFixed(2)}%`;

            // Populate table
            const tbody = document.querySelector('#profitLossTable tbody');
            tbody.innerHTML = '';

            data.records.forEach(record => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${record.period}</td>
                    <td>₱${parseFloat(record.revenue).toFixed(2)}</td>
                    <td>₱${parseFloat(record.cogs).toFixed(2)}</td>
                    <td>₱${parseFloat(record.gross_profit).toFixed(2)}</td>
                    <td>${parseFloat(record.margin).toFixed(2)}%</td>
                `;
            });

            // Draw chart
            if (typeof Chart !== 'undefined' && data.records.length > 0) {
                drawProfitLossChart(data.records);
            }
        }
    } catch (error) {
        console.error('Error generating profit & loss report:', error);
        alert('Failed to generate profit & loss report');
    }
}

function drawProfitLossChart(records) {
    const ctx = document.getElementById('profitLossChart');
    if (!ctx) return;

    // Destroy existing chart if exists
    if (window.plChart) {
        window.plChart.destroy();
    }

    window.plChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: records.map(r => r.period),
            datasets: [
                {
                    label: 'Revenue',
                    data: records.map(r => parseFloat(r.revenue)),
                    backgroundColor: 'rgba(76, 175, 80, 0.6)',
                    borderColor: 'rgb(76, 175, 80)',
                    borderWidth: 2
                },
                {
                    label: 'COGS',
                    data: records.map(r => parseFloat(r.cogs)),
                    backgroundColor: 'rgba(244, 67, 54, 0.6)',
                    borderColor: 'rgb(244, 67, 54)',
                    borderWidth: 2
                },
                {
                    label: 'Gross Profit',
                    data: records.map(r => parseFloat(r.gross_profit)),
                    backgroundColor: 'rgba(194, 112, 61, 0.6)',
                    borderColor: 'rgb(194, 112, 61)',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₱' + value.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

async function generateShrinkageReport() {
    const period = document.getElementById('shrinkagePeriod').value;

    try {
        const response = await fetch('php/reports.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'shrinkage',
                period: period
            })
        });

        const data = await response.json();

        if (data.success) {
            // Update summary cards
            document.getElementById('shrinkageValue').textContent = `₱${parseFloat(data.summary.total_value).toFixed(2)}`;
            document.getElementById('shrinkageItems').textContent = data.summary.items_affected;
            document.getElementById('shrinkageRate').textContent = `${parseFloat(data.summary.shrinkage_rate).toFixed(2)}%`;

            // Populate table
            const tbody = document.querySelector('#shrinkageTable tbody');
            tbody.innerHTML = '';

            data.items.forEach(item => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${item.item_name}</td>
                    <td>${item.expected_stock}</td>
                    <td>${item.actual_stock}</td>
                    <td class="shrinkage-diff">${item.difference}</td>
                    <td class="shrinkage-value">₱${parseFloat(item.value_loss).toFixed(2)}</td>
                    <td>${item.last_audit}</td>
                `;
            });
        }
    } catch (error) {
        console.error('Error generating shrinkage report:', error);
        alert('Failed to generate shrinkage report');
    }
}

function exportReport(reportType) {
    alert(`Exporting ${reportType} report to CSV... (Feature coming soon)`);
    // TODO: Implement CSV export functionality
}

// ============================================================================
// END REPORTING FUNCTIONS
// ============================================================================

// ============================================================================
// AUTOMATION & SMART FEATURES
// ============================================================================

let notificationCheckInterval = null;

/**
 * Initialize automation features
 */
function initAutomation() {
    // Check for low stock and notifications every 5 minutes
    checkLowStockAuto();
    notificationCheckInterval = setInterval(checkLowStockAuto, 5 * 60 * 1000);

    // Check for expiring items daily
    checkExpiringItems();
    setInterval(checkExpiringItems, 24 * 60 * 60 * 1000);

    // Load notifications immediately
    loadNotifications();
}

/**
 * Automatically check for low stock items
 */
async function checkLowStockAuto() {
    try {
        const response = await fetch('php/automation.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'check_low_stock' })
        });

        const data = await response.json();

        if (data.success && (data.low_stock_count > 0 || data.out_of_stock_count > 0)) {
            // Refresh notifications
            loadNotifications();

            // Show notification badge
            updateNotificationBadge(data.low_stock_count + data.out_of_stock_count);
        }
    } catch (error) {
        console.error('Error checking low stock:', error);
    }
}

/**
 * Check for expiring items
 */
async function checkExpiringItems() {
    try {
        const response = await fetch('php/automation.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get_expiring_items', days: 30 })
        });

        const data = await response.json();

        if (data.success && data.count > 0) {
            console.log(`Found ${data.count} items expiring in the next 30 days`);
            loadNotifications();
        }
    } catch (error) {
        console.error('Error checking expiring items:', error);
    }
}

/**
 * Load and display notifications
 */
async function loadNotifications() {
    try {
        const response = await fetch('php/automation.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get_notifications' })
        });

        const data = await response.json();

        if (data.success) {
            displayNotifications(data.notifications);
            updateNotificationBadge(data.count);
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

/**
 * Display notifications in UI
 */
function displayNotifications(notifications) {
    const banner = document.getElementById('inventory-alerts-banner');
    if (!banner) return;

    if (notifications.length === 0) {
        banner.classList.add('hidden');
        return;
    }

    banner.classList.remove('hidden');
    banner.innerHTML = '<h4>⚠️ Active Alerts</h4>';

    notifications.slice(0, 5).forEach(notif => {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert-item';

        const icon = notif.alert_type === 'out_of_stock' ? '🔴' :
                    notif.alert_type === 'low_stock' ? '🟡' :
                    notif.alert_type === 'expiring_soon' ? '⏰' : '⚠️';

        alertDiv.innerHTML = `
            <span class="alert-icon">${icon}</span>
            <span>${notif.alert_message}</span>
            <button onclick="dismissNotification(${notif.id})" style="margin-left: auto; padding: 4px 8px;">Dismiss</button>
        `;

        banner.appendChild(alertDiv);
    });

    if (notifications.length > 5) {
        const moreDiv = document.createElement('div');
        moreDiv.className = 'alert-item';
        moreDiv.innerHTML = `<span>... and ${notifications.length - 5} more alerts</span>`;
        banner.appendChild(moreDiv);
    }
}

/**
 * Update notification badge count
 */
function updateNotificationBadge(count) {
    let badge = document.getElementById('notification-badge');

    if (count > 0) {
        if (!badge) {
            // Create badge if it doesn't exist
            const inventoryLink = document.querySelector('a[onclick*="inventory"]');
            if (inventoryLink) {
                badge = document.createElement('span');
                badge.id = 'notification-badge';
                badge.className = 'notification-badge';
                inventoryLink.appendChild(badge);
            }
        }

        if (badge) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'inline-block';
        }
    } else if (badge) {
        badge.style.display = 'none';
    }
}

/**
 * Dismiss a notification
 */
async function dismissNotification(alertId) {
    try {
        const response = await fetch('php/automation.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'dismiss_notification',
                alert_id: alertId
            })
        });

        const data = await response.json();

        if (data.success) {
            loadNotifications();
        }
    } catch (error) {
        console.error('Error dismissing notification:', error);
    }
}

/**
 * Show reorder suggestions
 */
async function showReorderSuggestions() {
    try {
        const response = await fetch('php/automation.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get_reorder_suggestions' })
        });

        const data = await response.json();

        if (data.success) {
            displayReorderSuggestions(data.suggestions);
        }
    } catch (error) {
        console.error('Error getting reorder suggestions:', error);
        alert('Failed to load reorder suggestions');
    }
}

/**
 * Display reorder suggestions in a modal
 */
function displayReorderSuggestions(suggestions) {
    if (suggestions.length === 0) {
        alert('No reorder suggestions at this time. All items are adequately stocked.');
        return;
    }

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'reorder-modal';
    modal.innerHTML = `
        <div class="reorder-modal-content">
            <h2>🔄 Auto-Reorder Suggestions</h2>
            <p>Based on sales velocity and current stock levels</p>
            <div class="reorder-list">
                ${suggestions.map(item => `
                    <div class="reorder-item urgency-${item.urgency}">
                        <div class="reorder-header">
                            <span class="urgency-badge ${item.urgency_label.toLowerCase()}">${item.urgency_label}</span>
                            <strong>${item.item_name}</strong>
                        </div>
                        <div class="reorder-details">
                            <div>Current: ${item.current_stock} ${item.unit}</div>
                            <div>Suggested Order: <strong>${item.suggested_order_qty} ${item.unit}</strong></div>
                            <div>Daily Usage: ${item.avg_daily_usage} ${item.unit}/day</div>
                            <div>Days Until Stockout: ${item.days_until_stockout}</div>
                            <div>Supplier: ${item.supplier_name}</div>
                            <div class="reason">${item.reason}</div>
                        </div>
                        <input type="checkbox" class="reorder-checkbox" data-item-id="${item.item_id}"
                               data-qty="${item.suggested_order_qty}" data-supplier="${item.supplier_id}"
                               ${item.urgency >= 4 ? 'checked' : ''}>
                        <label>Include in auto-PO</label>
                    </div>
                `).join('')}
            </div>
            <div class="reorder-actions">
                <button onclick="createAutoReorderPO()" class="primary-btn">Create Purchase Order</button>
                <button onclick="closeReorderModal()" class="secondary-btn">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

/**
 * Create automatic purchase order from selected items
 */
async function createAutoReorderPO() {
    const checkboxes = document.querySelectorAll('.reorder-checkbox:checked');

    if (checkboxes.length === 0) {
        alert('Please select at least one item to reorder');
        return;
    }

    // Group items by supplier
    const supplierGroups = {};

    checkboxes.forEach(cb => {
        const supplierId = cb.dataset.supplier;
        if (!supplierGroups[supplierId]) {
            supplierGroups[supplierId] = [];
        }

        supplierGroups[supplierId].push({
            item_id: cb.dataset.itemId,
            quantity: parseFloat(cb.dataset.qty),
            unit_cost: 0 // Would need to fetch from supplier data
        });
    });

    // Create PO for each supplier
    for (const [supplierId, items] of Object.entries(supplierGroups)) {
        if (supplierId === 'null' || !supplierId) {
            alert('Some items do not have a supplier assigned. Please assign suppliers first.');
            continue;
        }

        try {
            const response = await fetch('php/automation.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create_auto_po',
                    supplier_id: supplierId,
                    items: items
                })
            });

            const data = await response.json();

            if (data.success) {
                alert(`Purchase Order ${data.po_number} created successfully!`);
            }
        } catch (error) {
            console.error('Error creating auto PO:', error);
            alert('Failed to create purchase order');
        }
    }

    closeReorderModal();
    loadNotifications();
}

function closeReorderModal() {
    const modal = document.querySelector('.reorder-modal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Backup database
 */
async function backupDatabase() {
    if (!confirm('Create a backup of the database? This may take a few moments.')) {
        return;
    }

    try {
        const response = await fetch('php/automation.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'backup_database' })
        });

        const data = await response.json();

        if (data.success) {
            alert(`Backup created successfully!\nFile: ${data.filename}\nSize: ${(data.size / 1024).toFixed(2)} KB`);
        } else {
            alert('Backup failed: ' + data.message);
        }
    } catch (error) {
        console.error('Error creating backup:', error);
        alert('Failed to create backup');
    }
}

// ============================================================================
// END AUTOMATION & SMART FEATURES
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    applyServerData(initialData);

    if (currentUserRole === 'manager') {
        showManagerContent('home');
        // Initialize automation features for manager
        initAutomation();
    } else if (currentUserRole === 'cashier') {
        showCashierContent('order');
        addReturnRefundButton();
    }
});

/* ========================================
   Enhanced Inventory Management
   ======================================== */

let inventoryViewMode = 'grid'; // 'grid' or 'table'
let currentInventoryData = [];
let currentQuickAdjustItem = null;

/**
 * Toggle between card grid and table view
 */
function toggleInventoryView() {
    const grid = document.getElementById('inventory-grid');
    const table = document.getElementById('inventory');
    const icon = document.getElementById('view-toggle-icon');
    const text = document.getElementById('view-toggle-text');

    if (inventoryViewMode === 'grid') {
        // Switch to table view
        inventoryViewMode = 'table';
        grid.classList.add('hidden');
        table.classList.remove('hidden');
        icon.textContent = '📊';
        text.textContent = 'Card View';
    } else {
        // Switch to grid view
        inventoryViewMode = 'grid';
        grid.classList.remove('hidden');
        table.classList.add('hidden');
        icon.textContent = '📋';
        text.textContent = 'Table View';
    }
}

/**
 * Render inventory in card grid format
 */
function renderInventoryGrid(items) {
    const grid = document.getElementById('inventory-grid');
    if (!grid) return;

    if (items.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: var(--text-secondary); grid-column: 1/-1;">No inventory items found.</p>';
        return;
    }

    grid.innerHTML = items.map(item => {
        const qty = parseFloat(item.quantity);
        const minStock = parseFloat(item.min_stock || 0);
        const maxStock = parseFloat(item.max_stock || 100);

        // Determine status
        let status, statusClass, stockPercentage;
        if (qty <= 0) {
            status = 'OUT';
            statusClass = 'critical';
            stockPercentage = 0;
        } else if (qty <= minStock) {
            status = 'LOW';
            statusClass = 'low';
            stockPercentage = (qty / maxStock) * 100;
        } else {
            status = 'GOOD';
            statusClass = 'good';
            stockPercentage = (qty / maxStock) * 100;
        }

        return `
            <div class="inventory-card">
                <div class="inventory-card-image">
                    ${item.image ? `<img src="${item.image}" alt="${item.item}">` : `<div class="placeholder-icon">📦</div>`}
                    <div class="inventory-card-status-badge status-badge ${statusClass}">${status}</div>
                </div>

                <div class="inventory-card-header">
                    <div class="inventory-card-title">${item.item}</div>
                    ${item.barcode ? `<span class="inventory-card-barcode">🔖 ${item.barcode}</span>` : ''}
                </div>

                <div class="inventory-card-quantity">
                    <div class="quantity-display">
                        <span class="quantity-value">${qty}</span>
                        <span class="quantity-unit">${item.unit}</span>
                    </div>

                    <div class="stock-level-bar">
                        <div class="stock-level-fill ${statusClass}" style="width: ${Math.min(stockPercentage, 100)}%"></div>
                    </div>
                    <div class="stock-level-text">
                        <span>Min: ${minStock}</span>
                        <span>Max: ${maxStock}</span>
                    </div>
                </div>

                <div class="inventory-card-actions">
                    <button class="quick-action-btn primary" onclick="openQuickAdjustModal(${item.id})">
                        ⚡ Quick Adjust
                    </button>
                    <button class="quick-action-btn" onclick="viewItemDetails(${item.id})">
                        📊 Details
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Filter and sort inventory
 */
function filterInventory() {
    const searchTerm = document.getElementById('inventory-search')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('inventory-status-filter')?.value || '';

    let filtered = currentInventoryData.filter(item => {
        const matchesSearch = item.item.toLowerCase().includes(searchTerm) ||
                            (item.barcode && item.barcode.toLowerCase().includes(searchTerm));

        if (!matchesSearch) return false;

        if (!statusFilter) return true;

        const qty = parseFloat(item.quantity);
        const minStock = parseFloat(item.min_stock || 0);

        if (statusFilter === 'critical' && qty <= 0) return true;
        if (statusFilter === 'low' && qty > 0 && qty <= minStock) return true;
        if (statusFilter === 'good' && qty > minStock) return true;

        return false;
    });

    if (inventoryViewMode === 'grid') {
        renderInventoryGrid(filtered);
    } else {
        // Update table (existing function should handle this)
        const tbody = document.querySelector('#inventory tbody');
        if (tbody) {
            renderInventoryTableRows(filtered);
        }
    }
}

/**
 * Sort inventory
 */
function sortInventory() {
    const sortBy = document.getElementById('inventory-sort')?.value || 'name';

    let sorted = [...currentInventoryData];

    switch (sortBy) {
        case 'name':
            sorted.sort((a, b) => a.item.localeCompare(b.item));
            break;
        case 'quantity-low':
            sorted.sort((a, b) => parseFloat(a.quantity) - parseFloat(b.quantity));
            break;
        case 'quantity-high':
            sorted.sort((a, b) => parseFloat(b.quantity) - parseFloat(a.quantity));
            break;
        case 'status':
            sorted.sort((a, b) => {
                const getStatusPriority = (item) => {
                    const qty = parseFloat(item.quantity);
                    const minStock = parseFloat(item.min_stock || 0);
                    if (qty <= 0) return 3; // Critical first
                    if (qty <= minStock) return 2; // Low second
                    return 1; // Good last
                };
                return getStatusPriority(b) - getStatusPriority(a);
            });
            break;
    }

    currentInventoryData = sorted;
    filterInventory();
}

/**
 * Render inventory table rows (helper function)
 */
function renderInventoryTableRows(items) {
    const tbody = document.querySelector('#inventory tbody');
    if (!tbody) return;

    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No inventory items found.</td></tr>';
        return;
    }

    tbody.innerHTML = items.map(item => {
        const qty = parseFloat(item.quantity);
        const minStock = parseFloat(item.min_stock || 0);

        let statusText, statusColor;
        if (qty <= 0) {
            statusText = '🔴 OUT';
            statusColor = '#d32f2f';
        } else if (qty <= minStock) {
            statusText = '🟡 LOW';
            statusColor = '#f57c00';
        } else {
            statusText = '🟢 GOOD';
            statusColor = '#388e3c';
        }

        return `
            <tr>
                <td>${item.item}${item.barcode ? ` <span style="color: #999; font-size: 0.85em;">(${item.barcode})</span>` : ''}</td>
                <td>${qty}</td>
                <td>${item.unit}</td>
                <td>${minStock} / ${item.max_stock || 'N/A'}</td>
                <td style="color: ${statusColor}; font-weight: 600;">${statusText}</td>
                <td>
                    <button onclick="openQuickAdjustModal(${item.id})">Quick Adjust</button>
                    <button onclick="viewItemDetails(${item.id})">Details</button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Export inventory to CSV
 */
function exportInventoryCSV() {
    if (currentInventoryData.length === 0) {
        alert('No inventory data to export.');
        return;
    }

    const headers = ['Item', 'Quantity', 'Unit', 'Min Stock', 'Max Stock', 'Reorder Level', 'Barcode', 'Status'];
    const rows = currentInventoryData.map(item => {
        const qty = parseFloat(item.quantity);
        const minStock = parseFloat(item.min_stock || 0);
        let status = qty <= 0 ? 'OUT OF STOCK' : (qty <= minStock ? 'LOW STOCK' : 'GOOD');

        return [
            item.item,
            item.quantity,
            item.unit,
            item.min_stock || '',
            item.max_stock || '',
            item.reorder_level || '',
            item.barcode || '',
            status
        ].map(field => `"${field}"`).join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

/* ========================================
   Barcode Scanner Functions
   ======================================== */

let barcodeStream = null;

/**
 * Show barcode scanner modal
 */
function showBarcodeScanModal() {
    const modal = document.getElementById('barcode-scan-modal');
    if (!modal) return;

    modal.classList.remove('hidden');

    // Try to start camera
    startBarcodeCamera();
}

/**
 * Close barcode scanner modal
 */
function closeBarcodeScanModal() {
    const modal = document.getElementById('barcode-scan-modal');
    if (!modal) return;

    modal.classList.add('hidden');

    // Stop camera
    stopBarcodeCamera();

    // Clear manual input
    const input = document.getElementById('manual-barcode-input');
    if (input) input.value = '';

    // Clear result
    const result = document.getElementById('barcode-result');
    if (result) {
        result.innerHTML = '';
        result.classList.add('hidden');
    }
}

/**
 * Start camera for barcode scanning
 */
async function startBarcodeCamera() {
    const video = document.getElementById('barcode-video');
    if (!video) return;

    try {
        barcodeStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        video.srcObject = barcodeStream;

        // Note: Actual barcode decoding would require a library like ZXing or QuaggaJS
        // For now, we'll just show the camera and rely on manual entry
        console.log('Camera started. For full barcode scanning, integrate a library like QuaggaJS or ZXing.');
    } catch (error) {
        console.error('Camera access denied:', error);
        alert('Camera access denied. Please use manual barcode entry or check your browser permissions.');
    }
}

/**
 * Stop camera
 */
function stopBarcodeCamera() {
    if (barcodeStream) {
        barcodeStream.getTracks().forEach(track => track.stop());
        barcodeStream = null;
    }

    const video = document.getElementById('barcode-video');
    if (video) video.srcObject = null;
}

/**
 * Search inventory by barcode
 */
async function searchByBarcode() {
    const input = document.getElementById('manual-barcode-input');
    const result = document.getElementById('barcode-result');

    if (!input || !result) return;

    const barcode = input.value.trim();
    if (!barcode) {
        alert('Please enter a barcode.');
        return;
    }

    // Search in current inventory data
    const item = currentInventoryData.find(i => i.barcode && i.barcode === barcode);

    if (item) {
        result.innerHTML = `
            <h4>✅ Item Found</h4>
            <p><strong>${item.item}</strong></p>
            <p>Current Stock: <strong>${item.quantity} ${item.unit}</strong></p>
            <p>Barcode: ${item.barcode}</p>
            <button class="btn-primary" onclick="openQuickAdjustModal(${item.id}); closeBarcodeScanModal();">
                Adjust Stock
            </button>
        `;
        result.classList.remove('hidden');
    } else {
        result.innerHTML = `
            <h4>❌ Not Found</h4>
            <p>No item found with barcode: <strong>${barcode}</strong></p>
            <p>Please check the barcode or add this item to inventory.</p>
        `;
        result.classList.remove('hidden');
    }
}

/* ========================================
   Quick Stock Adjustment Modal
   ======================================== */

/**
 * Open quick adjustment modal
 */
function openQuickAdjustModal(itemId) {
    const item = currentInventoryData.find(i => i.id === itemId);
    if (!item) {
        alert('Item not found.');
        return;
    }

    currentQuickAdjustItem = item;

    const modal = document.getElementById('quick-adjust-modal');
    const itemInfo = document.getElementById('quick-adjust-item-info');
    const qtyInput = document.getElementById('quick-adjust-qty');

    if (!modal || !itemInfo || !qtyInput) return;

    itemInfo.innerHTML = `
        <h4>${item.item}</h4>
        <div class="current-stock">Current: ${item.quantity} ${item.unit}</div>
    `;

    qtyInput.value = 0;
    document.getElementById('quick-adjust-reason').value = 'stock-in';
    document.getElementById('quick-adjust-notes').value = '';

    modal.classList.remove('hidden');
}

/**
 * Close quick adjustment modal
 */
function closeQuickAdjustModal() {
    const modal = document.getElementById('quick-adjust-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    currentQuickAdjustItem = null;
}

/**
 * Quick adjust by amount
 */
function quickAdjust(amount) {
    const input = document.getElementById('quick-adjust-qty');
    if (!input) return;

    const currentValue = parseFloat(input.value) || 0;
    input.value = currentValue + amount;
}

/**
 * Save quick adjustment
 */
async function saveQuickAdjustment() {
    if (!currentQuickAdjustItem) return;

    const qtyInput = document.getElementById('quick-adjust-qty');
    const reasonSelect = document.getElementById('quick-adjust-reason');
    const notesInput = document.getElementById('quick-adjust-notes');

    if (!qtyInput || !reasonSelect || !notesInput) return;

    const adjustment = parseFloat(qtyInput.value);
    if (adjustment === 0) {
        alert('Please enter an adjustment amount.');
        return;
    }

    const reason = reasonSelect.value;
    const notes = notesInput.value.trim();

    // Determine movement type based on reason
    let movementType = reason;
    let finalQty = adjustment;

    if (reason === 'stock-out' || reason === 'damaged') {
        finalQty = -Math.abs(adjustment);
    } else {
        finalQty = Math.abs(adjustment);
    }

    try {
        const response = await fetch('php/inventory.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'record_stock_movement',
                item_id: currentQuickAdjustItem.id,
                movement_type: movementType,
                quantity: finalQty,
                notes: notes || `Quick adjustment via ${reason}`
            })
        });

        const data = await response.json();

        if (data.success) {
            alert('Stock adjusted successfully!');
            closeQuickAdjustModal();
            loadInventory(); // Reload inventory
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error saving adjustment:', error);
        alert('Failed to save adjustment. Please try again.');
    }
}

/**
 * View item details (placeholder)
 */
function viewItemDetails(itemId) {
    const item = currentInventoryData.find(i => i.id === itemId);
    if (!item) return;

    alert(`Item Details:\n\nName: ${item.item}\nQuantity: ${item.quantity} ${item.unit}\nMin Stock: ${item.min_stock}\nMax Stock: ${item.max_stock}\nBarcode: ${item.barcode || 'N/A'}`);
    // In a real app, this would open a detailed modal with history, batches, etc.
}

/* ========================================
   Override loadInventory to support grid view
   ======================================== */

// Store original loadInventory function
const originalLoadInventory = loadInventory;

// Override loadInventory
window.loadInventory = async function() {
    try {
        const response = await fetch('php/inventory.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'fetch_inventory' })
        });

        const data = await response.json();

        if (data.success) {
            currentInventoryData = data.items || [];

            // Render based on current view mode
            if (inventoryViewMode === 'grid') {
                renderInventoryGrid(currentInventoryData);
            }

            // Also populate table for when user switches views
            const tbody = document.querySelector('#inventory tbody');
            if (tbody) {
                renderInventoryTableRows(currentInventoryData);
            }

            // Populate dropdowns
            populateInventoryDropdowns(currentInventoryData);
        }
    } catch (error) {
        console.error('Error loading inventory:', error);
    }
};

/**
 * Populate inventory dropdowns
 */
function populateInventoryDropdowns(items) {
    const selects = [
        document.getElementById('stockMovementItem'),
        document.getElementById('movementFilterItem')
    ];

    selects.forEach(select => {
        if (!select) return;

        const currentValue = select.value;
        select.innerHTML = '<option value="">Select Item</option>' +
            items.map(item => `<option value="${item.id}">${item.item}</option>`).join('');
        select.value = currentValue;
    });
}

// ============================================
// Product Modal Functions
// ============================================

var currentEditingProductIndex = null;

/**
 * Open product modal for add or edit mode
 * @param {string} mode - 'add' or 'edit'
 * @param {number} productIndex - Product index for edit mode
 */
function openProductModal(mode = 'add', productIndex = null) {
    console.log('openProductModal called with mode:', mode, 'productIndex:', productIndex);

    const modal = document.getElementById('productModalOverlay');
    const modalTitle = document.getElementById('productModalTitle');
    const saveBtn = document.getElementById('saveProductBtn');

    if (!modal) {
        console.error('Product modal overlay not found!');
        alert('Error: Modal not found. Please refresh the page.');
        return;
    }

    console.log('Modal found:', modal);

    // Reset current editing index
    if (typeof currentEditingProductIndex === 'undefined') {
        window.currentEditingProductIndex = null;
    } else {
        currentEditingProductIndex = null;
    }

    if (mode === 'edit' && productIndex !== null) {
        // Edit mode
        currentEditingProductIndex = productIndex;
        const product = products[productIndex];

        if (!product) {
            alert('Product not found');
            return;
        }

        // Update modal title and button
        modalTitle.textContent = 'Edit Product';
        saveBtn.textContent = 'Update Product';

        // Populate form with product data
        document.getElementById('newItemName').value = product.name || '';
        document.getElementById('newItemPrice').value = product.price || '';
        document.getElementById('newItemCategory').value = product.categoryId || '';

        // Load existing recipe ingredients for this product
        loadProductRecipeForEdit(product.id);

    } else {
        // Add mode
        modalTitle.textContent = 'Add New Product';
        saveBtn.textContent = 'Add Product';

        // Clear form
        clearProductForm();
    }

    // Initialize ingredient select and show modal
    if (typeof initializeIngredientSelect === 'function') {
        initializeIngredientSelect();
    }

    // Show modal with animation
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

/**
 * Close product modal
 */
function closeProductModal() {
    const modal = document.getElementById('productModalOverlay');
    if (modal) {
        modal.classList.remove('active');
    }
    document.body.style.overflow = ''; // Restore scrolling

    // Clear form and reset
    clearProductForm();
    currentEditingProductIndex = null;
}

/**
 * Close modal when clicking on overlay (not the modal itself)
 */
function closeProductModalOnOverlay(event) {
    if (event.target.id === 'productModalOverlay') {
        closeProductModal();
    }
}

// Add ESC key support to close modal
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modal = document.getElementById('productModalOverlay');
        if (modal && modal.classList.contains('active')) {
            closeProductModal();
        }
    }
});

/**
 * Clear product form fields
 */
function clearProductForm() {
    document.getElementById('newItemName').value = '';
    document.getElementById('newItemPrice').value = '';
    document.getElementById('newItemCategory').value = '';
    document.getElementById('newItemImage').value = '';

    // Clear ingredients - always use window object
    window.productIngredients = [];

    if (typeof displayIngredientsList === 'function') {
        displayIngredientsList();
    }

    if (typeof updateProfitabilityPreview === 'function') {
        updateProfitabilityPreview();
    }
}

/**
 * Load product recipe for editing
 */
async function loadProductRecipeForEdit(productId) {
    console.log('Loading recipe for product ID:', productId);

    try {
        // Fetch recipes for this product
        const recipeResponse = await fetch(`php/api.php?resource=recipes&action=get-by-product&product_id=${productId}`);
        const recipeData = await recipeResponse.json();

        console.log('Recipe data received:', recipeData);

        if (recipeData.success && recipeData.data && recipeData.data.recipes) {
            console.log('Recipes found:', recipeData.data.recipes.length);

            // Initialize productIngredients if it doesn't exist
            if (typeof window.productIngredients === 'undefined') {
                window.productIngredients = [];
            }

            // Clear existing ingredients
            window.productIngredients = [];

            // Convert recipe data to productIngredients format
            recipeData.data.recipes.forEach(recipe => {
                console.log('Adding recipe ingredient:', recipe);
                window.productIngredients.push({
                    inventoryItemId: recipe.inventoryItemId,
                    ingredientName: recipe.ingredientName,
                    quantity: parseFloat(recipe.quantity),
                    unit: recipe.unit,
                    costPerUnit: parseFloat(recipe.costPerUnit),
                    totalCost: parseFloat(recipe.ingredientCost)
                });
            });

            console.log('Total ingredients loaded:', window.productIngredients.length);

            // Update display
            if (typeof displayIngredientsList === 'function') {
                displayIngredientsList();
            }
            if (typeof updateProfitabilityPreview === 'function') {
                updateProfitabilityPreview();
            }
        } else {
            console.log('No recipes found or invalid response');
            // Still clear ingredients even if no recipes
            if (typeof window.productIngredients !== 'undefined') {
                window.productIngredients = [];
            }
            if (typeof displayIngredientsList === 'function') {
                displayIngredientsList();
            }
        }
    } catch (error) {
        console.error('Error loading product recipe:', error);
    }
}

/**
 * Save product (add or update)
 */
async function saveProduct() {
    if (currentEditingProductIndex !== null) {
        // Update existing product
        await updateProduct();
    } else {
        // Add new product
        await addMenuItem();
    }
}

/**
 * Update existing product
 */
async function updateProduct() {
    const product = products[currentEditingProductIndex];
    if (!product || !product.id) {
        alert('Unable to locate the selected product.');
        return;
    }

    const nameInput = document.getElementById('newItemName');
    const priceInput = document.getElementById('newItemPrice');
    const categorySelect = document.getElementById('newItemCategory');
    const imageInput = document.getElementById('newItemImage');

    const name = nameInput ? nameInput.value.trim() : '';
    const price = priceInput ? parseFloat(priceInput.value) : NaN;
    const categoryId = categorySelect && categorySelect.value ? categorySelect.value : FALLBACK_CATEGORY_ID;

    if (!name || isNaN(price) || price < 0) {
        alert('Please fill all fields correctly.');
        return;
    }

    try {
        let imageFilename = product.image;

        // Check if new image is selected
        const file = imageInput && imageInput.files && imageInput.files.length > 0 ? imageInput.files[0] : null;

        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select a valid image file.');
                return;
            }

            // Upload the image
            const formData = new FormData();
            formData.append('image', file);

            const uploadResponse = await fetch('php/upload_image.php', {
                method: 'POST',
                body: formData
            });

            if (!uploadResponse.ok) {
                throw new Error('Image upload failed.');
            }

            const uploadResult = await uploadResponse.json();
            if (!uploadResult.success) {
                throw new Error(uploadResult.message || 'Image upload failed.');
            }

            imageFilename = uploadResult.filename;
        }

        // Update product
        await apiRequest('products', 'update', {
            id: product.id,
            name,
            price,
            image: imageFilename,
            categoryId
        });

        // Delete all existing recipe ingredients for this product
        const recipeResponse = await fetch(`php/api.php?resource=recipes&action=get-by-product&product_id=${product.id}`);
        const recipeData = await recipeResponse.json();

        if (recipeData.success && recipeData.data.recipes) {
            for (const recipe of recipeData.data.recipes) {
                await fetch('php/api.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        resource: 'recipes',
                        action: 'delete-ingredient',
                        data: { recipe_id: recipe.id }
                    })
                });
            }
        }

        // Add new recipe ingredients
        if (typeof productIngredients !== 'undefined' && productIngredients.length > 0) {
            for (const ingredient of productIngredients) {
                await fetch('php/api.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        resource: 'recipes',
                        action: 'add-ingredient',
                        data: {
                            product_id: product.id,
                            inventory_item_id: ingredient.inventoryItemId,
                            quantity: ingredient.quantity,
                            unit: ingredient.unit,
                            notes: null
                        }
                    })
                });
            }

            // Update inventory item costs
            for (const ingredient of productIngredients) {
                await fetch('php/api.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        resource: 'inventory-cost',
                        action: 'update',
                        data: {
                            inventory_item_id: ingredient.inventoryItemId,
                            cost_per_unit: ingredient.costPerUnit
                        }
                    })
                });
            }
        }

        // Close modal and refresh
        closeProductModal();
        if (typeof reloadData === 'function') {
            await reloadData();
        }
        if (typeof displayMenuItems === 'function') {
            displayMenuItems();
        }
        if (typeof displayMenuGallery === 'function') {
            displayMenuGallery();
        }

        alert('Product updated successfully!');

    } catch (error) {
        console.error('Error updating product:', error);
        alert('Failed to update product: ' + error.message);
    }
}
