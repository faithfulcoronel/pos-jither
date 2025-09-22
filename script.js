const users = {
    manager: { username: 'manager', password: '1234' },
    cashier: { username: 'cashier', password: '1234' }
};

let menuItems = [
    { name: 'Espresso', price: 80, image: 'espresso.jpeg' },
    { name: 'Cappuccino', price: 120, image: 'cappuccino.jpeg' },
    { name: 'Latte', price: 110, image: 'latte.jpeg' },
    { name: 'Mocha', price: 130, image: 'mocha.jpeg' }
];

let inventory = [
    { item: 'Coffee Beans', qty: 10, unit: 'kg' },
    { item: 'Milk', qty: 25, unit: 'L' },
    { item: 'Cups', qty: 300, unit: 'pcs' }
];

let staffAccounts = [
    { role: 'Manager', name: 'Jowen', status: 'Inactive', timeIn: null, timeOut: null },
    { role: 'Cashier', name: 'Elsa', status: 'Inactive', timeIn: null, timeOut: null }
];
let timekeepingRecords = [];

// Sample data with item details
let completedTransactions = [
    { id: 101, total: 360, timestamp: '2025-09-19T10:00:00Z', items: [{name: 'Cappuccino', qty: 2}] },
    { id: 102, total: 240, timestamp: '2025-09-19T11:30:00Z', items: [{name: 'Latte', qty: 1}, {name: 'Espresso', qty: 1}] },
    { id: 103, total: 110, timestamp: '2025-09-19T14:00:00Z', items: [{name: 'Mocha', qty: 1}] },
    { id: 104, total: 120, timestamp: '2025-09-19T15:00:00Z', items: [{name: 'Cappuccino', qty: 1}] },
    { id: 105, total: 260, timestamp: '2025-09-19T16:30:00Z', items: [{name: 'Mocha', qty: 2}] },
];

let currentOrder = [];

// Login/Logout Functions
function login() {
    const username = document.getElementById('username').value.toLowerCase();
    const password = document.getElementById('password').value;

    document.body.classList.remove('manager-mode', 'cashier-mode');

    if (username === 'manager' && password === '1234') {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('manager-dashboard').classList.remove('hidden');
        document.body.classList.add('manager-mode');
        showManagerContent('home');
    } else if (username === 'cashier' && password === '1234') {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('cashier-dashboard').classList.remove('hidden');
        document.body.classList.add('cashier-mode');
        showCashierContent('order');
    } else {
        alert('Invalid username or password');
    }
}

function logout() {
    document.getElementById('manager-dashboard').classList.add('hidden');
    document.getElementById('cashier-dashboard').classList.add('hidden');
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.body.classList.remove('manager-mode', 'cashier-mode');
    currentOrder = [];
}

function showManagerContent(id) {
    document.querySelectorAll('#manager-dashboard .content-section').forEach(section => {
        section.classList.add('hidden');
    });

    document.querySelectorAll('#manager-dashboard .sidebar a').forEach(item => {
        item.classList.remove('active');
    });

    document.getElementById(id + '-content').classList.remove('hidden');
    document.querySelector(`#manager-dashboard .sidebar a[onclick="showManagerContent('${id}')"]`).classList.add('active');

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
    if (!container) return;
    container.innerHTML = '';
    menuItems.forEach((item, index) => {
        container.innerHTML += `
            <div class="menu-item">
                <img src="images/${item.image}" alt="${item.name}">
                <p>${item.name} - ₱${item.price}</p>
                <button onclick="editMenuItem(${index})">Edit</button>
                <button onclick="deleteMenuItem(${index})">Delete</button>
            </div>`;
    });
}

function addMenuItem() {
    const name = document.getElementById('newItemName').value;
    const price = parseFloat(document.getElementById('newItemPrice').value);
    const image = document.getElementById('newItemImage').value;

    if (!name || isNaN(price)) return alert("Fill all fields correctly.");
    menuItems.push({ name, price, image });
    displayMenuItems();
}

function editMenuItem(index) {
    const item = menuItems[index];
    const newName = prompt("Update name:", item.name);
    const newPrice = parseFloat(prompt("Update price:", item.price));
    const newImage = prompt("Update image path (e.g., images/drink.jpg):", item.image);

    if (newName && !isNaN(newPrice) && newImage) {
        menuItems[index].name = newName;
        menuItems[index].price = newPrice;
        menuItems[index].image = newImage;
        displayMenuItems();
    } else {
        alert("Invalid input. No changes were made.");
    }
}

function deleteMenuItem(index) {
    if (confirm("Delete this item?")) {
        menuItems.splice(index, 1);
        displayMenuItems();
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

    document.getElementById(id + '-content').classList.remove('hidden');
    document.querySelector(`#cashier-dashboard .sidebar a[onclick="showCashierContent('${id}')"]`).classList.add('active');

    if (id === 'order') {
        displayMenuGallery();
        renderOrderList();
    } else if (id === 'daily') { // Idagdag ang bagong kondisyon na ito
        generateDailySummary();
    }
    
}

function displayMenuGallery() {
    const container = document.getElementById('menuItemsGallery');
    if (!container) return;
    container.innerHTML = '';
    menuItems.forEach(item => {
        container.innerHTML += `
            <div class="menu-item" onclick="selectDrink('${item.name}', ${item.price})">
                <img src="images/${item.image}" alt="${item.name}">
                <p>${item.name}<br>₱${item.price}</p>
            </div>`;
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
            const menuItem = menuItems.find(m => m.name === item.name);
            const itemPrice = menuItem ? menuItem.price : 0;
            
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
    showManagerContent('home');
});
