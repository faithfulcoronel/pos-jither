-- =====================================================
-- JOWEN'S KITCHEN & CAFE - COMPLETE POS DATABASE
-- Based on your actual system requirements
-- =====================================================
-- This is the FINAL, COMPLETE database for your POS system
-- Includes ALL features used in your application
-- =====================================================

-- Drop and recreate database
DROP DATABASE IF EXISTS pos_jither;
CREATE DATABASE pos_jither
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE pos_jither;

-- Ensure proper settings
SET autocommit = 1;
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- PRODUCT MANAGEMENT TABLES
-- =====================================================

-- Product Categories (Coffee, Pastries, etc.)
CREATE TABLE product_categories (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    name VARCHAR(191) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products (Menu Items)
CREATE TABLE products (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    category_id VARCHAR(64) NULL,
    name VARCHAR(191) NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    cost_price DECIMAL(10, 2) NOT NULL DEFAULT 0 COMMENT 'Total cost to make this product',
    image VARCHAR(191) NULL,
    description TEXT NULL,
    inventory_item_id INT UNSIGNED NULL,
    track_inventory BOOLEAN DEFAULT FALSE,
    auto_calculate_cost BOOLEAN DEFAULT TRUE COMMENT 'Auto-calculate cost from recipe',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_category FOREIGN KEY (category_id)
        REFERENCES product_categories (id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INVENTORY MANAGEMENT TABLES
-- =====================================================

-- Inventory Items (Stock Tracking)
CREATE TABLE inventory_items (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    item VARCHAR(191) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
    unit VARCHAR(32) NOT NULL COMMENT 'kg, L, pcs, g, ml, bottles',
    cost_per_unit DECIMAL(10, 4) NOT NULL DEFAULT 0 COMMENT 'Cost per single unit',
    min_stock DECIMAL(10, 2) DEFAULT 10,
    max_stock DECIMAL(10, 2) DEFAULT 1000,
    reorder_level DECIMAL(10, 2) DEFAULT 20,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product Recipes (Ingredients per product)
CREATE TABLE product_recipes (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    product_id VARCHAR(64) NOT NULL,
    inventory_item_id INT UNSIGNED NOT NULL,
    quantity DECIMAL(10, 4) NOT NULL COMMENT 'Amount of ingredient needed',
    unit VARCHAR(32) NOT NULL COMMENT 'g, ml, pcs, etc',
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_recipe_product FOREIGN KEY (product_id)
        REFERENCES products (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_recipe_inventory FOREIGN KEY (inventory_item_id)
        REFERENCES inventory_items (id)
        ON DELETE RESTRICT,
    UNIQUE KEY unique_product_ingredient (product_id, inventory_item_id),
    INDEX idx_product_id (product_id),
    INDEX idx_inventory_item_id (inventory_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stock Movements (Inventory Audit Trail)
CREATE TABLE stock_movements (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    inventory_item_id INT UNSIGNED NOT NULL,
    movement_type ENUM('sale', 'purchase', 'adjustment', 'waste', 'transfer') NOT NULL DEFAULT 'sale',
    quantity DECIMAL(10, 4) NOT NULL COMMENT 'Negative for deductions, positive for additions',
    previous_quantity DECIMAL(10, 2) NOT NULL,
    new_quantity DECIMAL(10, 2) NOT NULL,
    reference_type VARCHAR(32) NULL COMMENT 'transaction, purchase_order, adjustment, etc',
    reference_id INT UNSIGNED NULL COMMENT 'ID of related record',
    notes TEXT NULL,
    created_by INT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_stock_movements_inventory FOREIGN KEY (inventory_item_id)
        REFERENCES inventory_items (id)
        ON DELETE CASCADE,
    INDEX idx_inventory_item_id (inventory_item_id),
    INDEX idx_movement_type (movement_type),
    INDEX idx_reference (reference_type, reference_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- STAFF & USER MANAGEMENT TABLES
-- =====================================================

-- Staff Accounts (Employee Management)
CREATE TABLE staff_accounts (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    role VARCHAR(64) NOT NULL COMMENT 'Manager, Cashier, Barista, etc',
    name VARCHAR(191) NOT NULL,
    employee_number VARCHAR(20) NULL UNIQUE COMMENT 'EMP001, EMP002, etc',
    status VARCHAR(32) NOT NULL DEFAULT 'Inactive',
    time_in DATETIME NULL,
    time_out DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_employee_number (employee_number),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users (Login Accounts)
CREATE TABLE users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    role VARCHAR(64) NOT NULL UNIQUE COMMENT 'manager, cashier',
    username VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TIME KEEPING SYSTEM TABLES
-- =====================================================

-- Employees (Time Keeping Records)
CREATE TABLE employees (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    employee_number VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(191) NOT NULL,
    position VARCHAR(100) DEFAULT NULL,
    department VARCHAR(100) DEFAULT NULL,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    date_hired DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_employee_number (employee_number),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Attendance Records (Time In/Out with Lock)
CREATE TABLE attendance_records (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    employee_id INT UNSIGNED NOT NULL,
    employee_number VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    time_in DATETIME DEFAULT NULL,
    time_out DATETIME DEFAULT NULL,
    status ENUM('present', 'absent', 'late', 'half_day') DEFAULT 'present',
    hours_worked DECIMAL(5,2) DEFAULT 0.00,
    is_locked BOOLEAN DEFAULT FALSE COMMENT 'Prevents duplicate time-ins',
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE KEY unique_employee_date (employee_id, date),
    INDEX idx_employee_id (employee_id),
    INDEX idx_date (date),
    INDEX idx_status (status),
    INDEX idx_locked (is_locked)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SALES TRANSACTION TABLES
-- =====================================================

-- Sales Transactions (Completed Sales)
CREATE TABLE sales_transactions (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    reference VARCHAR(64) NOT NULL UNIQUE COMMENT 'Receipt number',
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(32) DEFAULT 'cash',
    amount_tendered DECIMAL(10, 2) NULL,
    change_amount DECIMAL(10, 2) NULL,
    cashier_id INT UNSIGNED NULL,
    terminal_id VARCHAR(32) NULL,
    occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sales_transactions_cashier FOREIGN KEY (cashier_id)
        REFERENCES users (id)
        ON DELETE SET NULL,
    INDEX idx_occurred_at (occurred_at),
    INDEX idx_reference (reference)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sales Transaction Items (Line Items)
CREATE TABLE sales_transaction_items (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT UNSIGNED NOT NULL,
    product_id VARCHAR(64) NULL,
    product_name VARCHAR(191) NOT NULL,
    quantity INT UNSIGNED NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    line_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    variations TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sales_transaction_items_transaction FOREIGN KEY (transaction_id)
        REFERENCES sales_transactions (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_sales_transaction_items_product FOREIGN KEY (product_id)
        REFERENCES products (id)
        ON DELETE SET NULL,
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- Product Profitability View
CREATE OR REPLACE VIEW product_profitability AS
SELECT
    p.id,
    p.name,
    p.price AS selling_price,
    p.cost_price,
    (p.price - p.cost_price) AS gross_profit,
    CASE
        WHEN p.price > 0 THEN ROUND(((p.price - p.cost_price) / p.price) * 100, 2)
        ELSE 0
    END AS profit_margin_percentage,
    pc.name AS category,
    p.created_at
FROM products p
LEFT JOIN product_categories pc ON p.category_id = pc.id;

-- Product Recipe Details View
CREATE OR REPLACE VIEW product_recipe_details AS
SELECT
    pr.id AS recipe_id,
    pr.product_id,
    p.name AS product_name,
    pr.inventory_item_id,
    ii.item AS ingredient_name,
    pr.quantity AS required_quantity,
    pr.unit,
    ii.cost_per_unit,
    ROUND(pr.quantity * ii.cost_per_unit, 4) AS ingredient_cost,
    ii.quantity AS available_quantity,
    ii.unit AS inventory_unit,
    pr.notes
FROM product_recipes pr
JOIN products p ON pr.product_id = p.id
JOIN inventory_items ii ON pr.inventory_item_id = ii.id;

-- Attendance Summary View
CREATE OR REPLACE VIEW v_attendance_summary AS
SELECT
    e.id AS employee_id,
    e.employee_number,
    e.full_name,
    e.position,
    e.department,
    ar.date,
    ar.time_in,
    ar.time_out,
    ar.status,
    ar.hours_worked,
    ar.is_locked,
    ar.notes,
    CASE
        WHEN ar.time_in IS NULL THEN 'Not Yet Clocked In'
        WHEN ar.time_out IS NULL THEN 'Clocked In'
        ELSE 'Completed'
    END AS day_status
FROM employees e
LEFT JOIN attendance_records ar ON e.id = ar.employee_id
WHERE e.status = 'active'
ORDER BY ar.date DESC, e.full_name ASC;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-calculate hours worked on time out
DELIMITER $$

DROP TRIGGER IF EXISTS calculate_hours_worked$$
CREATE TRIGGER calculate_hours_worked
BEFORE UPDATE ON attendance_records
FOR EACH ROW
BEGIN
    IF NEW.time_in IS NOT NULL AND NEW.time_out IS NOT NULL THEN
        SET NEW.hours_worked = TIMESTAMPDIFF(MINUTE, NEW.time_in, NEW.time_out) / 60.0;

        IF NEW.hours_worked >= 8 THEN
            SET NEW.status = 'present';
        ELSEIF NEW.hours_worked >= 4 THEN
            SET NEW.status = 'half_day';
        ELSE
            SET NEW.status = 'present';
        END IF;

        SET NEW.is_locked = TRUE;
    END IF;
END$$

-- Auto-update product cost when recipe changes
DROP TRIGGER IF EXISTS after_recipe_insert$$
CREATE TRIGGER after_recipe_insert
AFTER INSERT ON product_recipes
FOR EACH ROW
BEGIN
    DECLARE total_cost DECIMAL(10, 2);

    SELECT COALESCE(SUM(pr.quantity * ii.cost_per_unit), 0)
    INTO total_cost
    FROM product_recipes pr
    JOIN inventory_items ii ON pr.inventory_item_id = ii.id
    WHERE pr.product_id = NEW.product_id;

    UPDATE products
    SET cost_price = total_cost
    WHERE id = NEW.product_id AND auto_calculate_cost = TRUE;
END$$

DROP TRIGGER IF EXISTS after_recipe_update$$
CREATE TRIGGER after_recipe_update
AFTER UPDATE ON product_recipes
FOR EACH ROW
BEGIN
    DECLARE total_cost DECIMAL(10, 2);

    SELECT COALESCE(SUM(pr.quantity * ii.cost_per_unit), 0)
    INTO total_cost
    FROM product_recipes pr
    JOIN inventory_items ii ON pr.inventory_item_id = ii.id
    WHERE pr.product_id = NEW.product_id;

    UPDATE products
    SET cost_price = total_cost
    WHERE id = NEW.product_id AND auto_calculate_cost = TRUE;
END$$

DROP TRIGGER IF EXISTS after_recipe_delete$$
CREATE TRIGGER after_recipe_delete
AFTER DELETE ON product_recipes
FOR EACH ROW
BEGIN
    DECLARE total_cost DECIMAL(10, 2);

    SELECT COALESCE(SUM(pr.quantity * ii.cost_per_unit), 0)
    INTO total_cost
    FROM product_recipes pr
    JOIN inventory_items ii ON pr.inventory_item_id = ii.id
    WHERE pr.product_id = OLD.product_id;

    UPDATE products
    SET cost_price = total_cost
    WHERE id = OLD.product_id AND auto_calculate_cost = TRUE;
END$$

DELIMITER ;

-- =====================================================
-- STORED PROCEDURES
-- =====================================================

DELIMITER $$

-- Calculate product cost from recipe
DROP PROCEDURE IF EXISTS calculate_product_cost$$
CREATE PROCEDURE calculate_product_cost(IN p_product_id VARCHAR(64))
BEGIN
    DECLARE total_cost DECIMAL(10, 2);

    SELECT COALESCE(SUM(pr.quantity * ii.cost_per_unit), 0)
    INTO total_cost
    FROM product_recipes pr
    JOIN inventory_items ii ON pr.inventory_item_id = ii.id
    WHERE pr.product_id = p_product_id;

    UPDATE products
    SET cost_price = total_cost
    WHERE id = p_product_id AND auto_calculate_cost = TRUE;

    SELECT total_cost AS calculated_cost;
END$$

-- Deduct inventory when product is sold
DROP PROCEDURE IF EXISTS deduct_inventory_for_sale$$
CREATE PROCEDURE deduct_inventory_for_sale(
    IN p_product_id VARCHAR(64),
    IN p_quantity INT,
    IN p_transaction_id INT UNSIGNED
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_inventory_item_id INT UNSIGNED;
    DECLARE v_required_qty DECIMAL(10, 4);
    DECLARE v_current_qty DECIMAL(10, 2);
    DECLARE v_new_qty DECIMAL(10, 2);

    DECLARE ingredient_cursor CURSOR FOR
        SELECT inventory_item_id, quantity
        FROM product_recipes
        WHERE product_id = p_product_id;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN ingredient_cursor;

    ingredient_loop: LOOP
        FETCH ingredient_cursor INTO v_inventory_item_id, v_required_qty;

        IF done THEN
            LEAVE ingredient_loop;
        END IF;

        SELECT quantity INTO v_current_qty
        FROM inventory_items
        WHERE id = v_inventory_item_id;

        SET v_new_qty = v_current_qty - (v_required_qty * p_quantity);

        UPDATE inventory_items
        SET quantity = v_new_qty
        WHERE id = v_inventory_item_id;
    END LOOP;

    CLOSE ingredient_cursor;
END$$

DELIMITER ;

-- =====================================================
-- SAMPLE DATA - JOWEN'S KITCHEN & CAFE
-- =====================================================

-- Product Categories
INSERT INTO product_categories (id, name, description) VALUES
    ('coffee-classics', 'Coffee Classics', 'Traditional espresso beverages prepared with freshly ground beans'),
    ('signature-espresso', 'Signature Espresso Creations', 'Creamy espresso drinks finished with silky steamed milk'),
    ('iced-favorites', 'Iced Favorites', 'Chilled beverages perfect for warm afternoons'),
    ('non-coffee', 'Non-Coffee & Tea', 'Comforting alternatives for non-coffee drinkers'),
    ('pastries', 'Pastries & Snacks', 'Fresh baked goods and light snacks'),
    ('uncategorized', 'Others', 'Items awaiting classification');

-- Products with Pricing
INSERT INTO products (id, category_id, name, price, cost_price, image, description) VALUES
    ('espresso', 'coffee-classics', 'Espresso', 80.00, 14.00, 'espresso.jpeg', 'A bold single shot of our house espresso'),
    ('cappuccino', 'signature-espresso', 'Cappuccino', 120.00, 26.00, 'cappuccino.jpeg', 'Espresso topped with velvety steamed milk foam'),
    ('latte', 'signature-espresso', 'Latte', 110.00, 30.00, 'latte.jpeg', 'Silky espresso balanced with lightly textured milk'),
    ('mocha', 'iced-favorites', 'Mocha', 130.00, 35.00, 'mocha.jpeg', 'Chocolate-infused espresso finished with whipped cream'),
    ('americano', 'coffee-classics', 'Americano', 90.00, 15.00, 'americano.jpeg', 'Espresso with hot water'),
    ('caramel-macchiato', 'signature-espresso', 'Caramel Macchiato', 140.00, 38.00, 'macchiato.jpeg', 'Espresso with vanilla and caramel');

-- Inventory Items with Costs
INSERT INTO inventory_items (item, quantity, unit, cost_per_unit, min_stock, max_stock, reorder_level) VALUES
    ('Coffee Beans', 10000, 'g', 0.50, 5000, 50000, 10000),
    ('Milk', 25000, 'ml', 0.08, 10000, 100000, 20000),
    ('Cups', 300, 'pcs', 5.00, 50, 500, 100),
    ('Sugar', 15000, 'g', 0.02, 5000, 30000, 10000),
    ('Chocolate Syrup', 5000, 'ml', 0.12, 500, 10000, 1000),
    ('Whipped Cream', 2000, 'ml', 0.15, 200, 5000, 500),
    ('Caramel Syrup', 3000, 'ml', 0.10, 300, 5000, 600),
    ('Vanilla Syrup', 3000, 'ml', 0.10, 300, 5000, 600),
    ('Ice', 50000, 'g', 0.001, 5000, 100000, 10000);

-- Product Recipes
-- Espresso: 18g coffee + 1 cup
INSERT INTO product_recipes (product_id, inventory_item_id, quantity, unit, notes) VALUES
    ('espresso', (SELECT id FROM inventory_items WHERE item = 'Coffee Beans'), 18, 'g', 'Double shot espresso'),
    ('espresso', (SELECT id FROM inventory_items WHERE item = 'Cups'), 1, 'pcs', 'Espresso cup');

-- Cappuccino: 18g coffee + 150ml milk + 1 cup
INSERT INTO product_recipes (product_id, inventory_item_id, quantity, unit, notes) VALUES
    ('cappuccino', (SELECT id FROM inventory_items WHERE item = 'Coffee Beans'), 18, 'g', 'Double shot espresso'),
    ('cappuccino', (SELECT id FROM inventory_items WHERE item = 'Milk'), 150, 'ml', 'Steamed milk'),
    ('cappuccino', (SELECT id FROM inventory_items WHERE item = 'Cups'), 1, 'pcs', 'Regular cup');

-- Latte: 18g coffee + 200ml milk + 1 cup
INSERT INTO product_recipes (product_id, inventory_item_id, quantity, unit, notes) VALUES
    ('latte', (SELECT id FROM inventory_items WHERE item = 'Coffee Beans'), 18, 'g', 'Double shot espresso'),
    ('latte', (SELECT id FROM inventory_items WHERE item = 'Milk'), 200, 'ml', 'More milk than cappuccino'),
    ('latte', (SELECT id FROM inventory_items WHERE item = 'Cups'), 1, 'pcs', 'Regular cup');

-- Mocha: 18g coffee + 180ml milk + 30ml chocolate + 20ml cream + 1 cup
INSERT INTO product_recipes (product_id, inventory_item_id, quantity, unit, notes) VALUES
    ('mocha', (SELECT id FROM inventory_items WHERE item = 'Coffee Beans'), 18, 'g', 'Double shot espresso'),
    ('mocha', (SELECT id FROM inventory_items WHERE item = 'Milk'), 180, 'ml', 'Steamed milk'),
    ('mocha', (SELECT id FROM inventory_items WHERE item = 'Chocolate Syrup'), 30, 'ml', 'Chocolate flavor'),
    ('mocha', (SELECT id FROM inventory_items WHERE item = 'Whipped Cream'), 20, 'ml', 'Topping'),
    ('mocha', (SELECT id FROM inventory_items WHERE item = 'Cups'), 1, 'pcs', 'Regular cup');

-- Americano: 18g coffee + 1 cup
INSERT INTO product_recipes (product_id, inventory_item_id, quantity, unit, notes) VALUES
    ('americano', (SELECT id FROM inventory_items WHERE item = 'Coffee Beans'), 18, 'g', 'Double shot espresso'),
    ('americano', (SELECT id FROM inventory_items WHERE item = 'Cups'), 1, 'pcs', 'Regular cup');

-- Caramel Macchiato: 18g coffee + 200ml milk + 20ml vanilla + 15ml caramel + 1 cup
INSERT INTO product_recipes (product_id, inventory_item_id, quantity, unit, notes) VALUES
    ('caramel-macchiato', (SELECT id FROM inventory_items WHERE item = 'Coffee Beans'), 18, 'g', 'Double shot espresso'),
    ('caramel-macchiato', (SELECT id FROM inventory_items WHERE item = 'Milk'), 200, 'ml', 'Steamed milk'),
    ('caramel-macchiato', (SELECT id FROM inventory_items WHERE item = 'Vanilla Syrup'), 20, 'ml', 'Vanilla flavor'),
    ('caramel-macchiato', (SELECT id FROM inventory_items WHERE item = 'Caramel Syrup'), 15, 'ml', 'Caramel drizzle'),
    ('caramel-macchiato', (SELECT id FROM inventory_items WHERE item = 'Cups'), 1, 'pcs', 'Regular cup');

-- Staff Accounts
INSERT INTO staff_accounts (id, role, name, employee_number, status) VALUES
    (1, 'Manager', 'Jowen', 'EMP001', 'Inactive'),
    (2, 'Cashier', 'Elsa', 'EMP002', 'Inactive'),
    (3, 'Barista', 'Maria Santos', 'EMP003', 'Inactive'),
    (4, 'Cashier', 'Juan Dela Cruz', 'EMP004', 'Inactive');

ALTER TABLE staff_accounts AUTO_INCREMENT = 5;

-- Employees (Time Keeping)
INSERT INTO employees (employee_number, full_name, position, department, status, date_hired) VALUES
    ('EMP001', 'Jowen', 'Manager', 'Management', 'active', '2024-01-01'),
    ('EMP002', 'Elsa', 'Cashier', 'Front of House', 'active', '2024-01-15'),
    ('EMP003', 'Maria Santos', 'Barista', 'Front of House', 'active', '2024-02-01'),
    ('EMP004', 'Juan Dela Cruz', 'Cashier', 'Front of House', 'active', '2024-02-15');

-- Sales Transactions (Sample)
INSERT INTO sales_transactions (id, reference, subtotal, total, occurred_at) VALUES
    (1, '101', 360.00, 360.00, '2025-01-20 10:00:00'),
    (2, '102', 240.00, 240.00, '2025-01-20 11:30:00'),
    (3, '103', 110.00, 110.00, '2025-01-20 14:00:00'),
    (4, '104', 120.00, 120.00, '2025-01-20 15:00:00'),
    (5, '105', 260.00, 260.00, '2025-01-20 16:30:00');

ALTER TABLE sales_transactions AUTO_INCREMENT = 6;

-- Sales Transaction Items
INSERT INTO sales_transaction_items (transaction_id, product_id, product_name, quantity, unit_price, line_total) VALUES
    (1, 'cappuccino', 'Cappuccino', 3, 120.00, 360.00),
    (2, 'latte', 'Latte', 1, 110.00, 110.00),
    (2, 'mocha', 'Mocha', 1, 130.00, 130.00),
    (3, 'latte', 'Latte', 1, 110.00, 110.00),
    (4, 'cappuccino', 'Cappuccino', 1, 120.00, 120.00),
    (5, 'mocha', 'Mocha', 2, 130.00, 260.00);

-- User Accounts (Login)
-- Password: demo123
INSERT INTO users (id, role, username, password_hash) VALUES
    (1, 'manager', 'manager', '$2y$12$3nfUZa978ubbF.LAMSwsLuQMRGj/mK/ZQV408hETndcBjDwdJHgt2'),
    (2, 'cashier', 'cashier', '$2y$12$3nfUZa978ubbF.LAMSwsLuQMRGj/mK/ZQV408hETndcBjDwdJHgt2');

ALTER TABLE users AUTO_INCREMENT = 3;

-- =====================================================
-- DATABASE SETUP COMPLETE!
-- =====================================================

SELECT '✅ COMPLETE DATABASE CREATED SUCCESSFULLY!' AS status;
SELECT 'Database: pos_jither' AS info;
SELECT '11 Tables | 3 Views | 4 Triggers | 2 Procedures' AS components;

-- Show tables
SHOW TABLES;

-- Show profitability summary
SELECT
    name AS Product,
    CONCAT('₱', FORMAT(cost_price, 2)) AS Cost,
    CONCAT('₱', FORMAT(price, 2)) AS Price,
    CONCAT('₱', FORMAT(price - cost_price, 2)) AS Profit,
    CONCAT(ROUND(((price - cost_price) / price) * 100, 1), '%') AS Margin
FROM products
ORDER BY (price - cost_price) DESC;
