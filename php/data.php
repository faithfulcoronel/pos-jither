<?php
return [
    'menuItems' => [
        ['name' => 'Espresso', 'price' => 80, 'image' => 'espresso.jpeg'],
        ['name' => 'Cappuccino', 'price' => 120, 'image' => 'cappuccino.jpeg'],
        ['name' => 'Latte', 'price' => 110, 'image' => 'latte.jpeg'],
        ['name' => 'Mocha', 'price' => 130, 'image' => 'mocha.jpeg'],
    ],
    'inventory' => [
        ['item' => 'Coffee Beans', 'qty' => 10, 'unit' => 'kg'],
        ['item' => 'Milk', 'qty' => 25, 'unit' => 'L'],
        ['item' => 'Cups', 'qty' => 300, 'unit' => 'pcs'],
    ],
    'staffAccounts' => [
        ['role' => 'Manager', 'name' => 'Jowen', 'status' => 'Inactive', 'timeIn' => null, 'timeOut' => null],
        ['role' => 'Cashier', 'name' => 'Elsa', 'status' => 'Inactive', 'timeIn' => null, 'timeOut' => null],
    ],
    'timekeepingRecords' => [],
    'completedTransactions' => [
        ['id' => 101, 'total' => 360, 'timestamp' => '2025-09-19T10:00:00Z', 'items' => [['name' => 'Cappuccino', 'qty' => 2]]],
        ['id' => 102, 'total' => 240, 'timestamp' => '2025-09-19T11:30:00Z', 'items' => [
            ['name' => 'Latte', 'qty' => 1],
            ['name' => 'Espresso', 'qty' => 1],
        ]],
        ['id' => 103, 'total' => 110, 'timestamp' => '2025-09-19T14:00:00Z', 'items' => [['name' => 'Mocha', 'qty' => 1]]],
        ['id' => 104, 'total' => 120, 'timestamp' => '2025-09-19T15:00:00Z', 'items' => [['name' => 'Cappuccino', 'qty' => 1]]],
        ['id' => 105, 'total' => 260, 'timestamp' => '2025-09-19T16:30:00Z', 'items' => [['name' => 'Mocha', 'qty' => 2]]],
    ],
];
