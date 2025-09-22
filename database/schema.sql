-- MySQL schema for the Jowen's Kitchen & Cafe POS demo
-- Run this file with a user that can create databases, e.g.:
--   mysql -u root -p < database/schema.sql

CREATE DATABASE IF NOT EXISTS pos_jither
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
USE pos_jither;

-- Store the high level menu groupings shown in the UI.
CREATE TABLE IF NOT EXISTS product_categories (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    name VARCHAR(191) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Individual menu items that can be ordered.
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    category_id VARCHAR(64) NULL,
    name VARCHAR(191) NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    image VARCHAR(191) NULL,
    description TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_category FOREIGN KEY (category_id)
        REFERENCES product_categories (id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inventory tracking used on the manager dashboard.
CREATE TABLE IF NOT EXISTS inventory_items (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    item VARCHAR(191) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
    unit VARCHAR(32) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Staff accounts shown in the staff management view.
CREATE TABLE IF NOT EXISTS staff_accounts (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    role VARCHAR(64) NOT NULL,
    name VARCHAR(191) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Inactive',
    time_in DATETIME NULL,
    time_out DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional timekeeping history entries.
CREATE TABLE IF NOT EXISTS timekeeping_records (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    staff_name VARCHAR(191) NOT NULL,
    role VARCHAR(64) NOT NULL,
    time_in DATETIME NOT NULL,
    time_out DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Summary of completed sales transactions.
CREATE TABLE IF NOT EXISTS sales_transactions (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    reference VARCHAR(64) NOT NULL UNIQUE,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Line items associated with each transaction.
CREATE TABLE IF NOT EXISTS sales_transaction_items (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT UNSIGNED NOT NULL,
    product_id VARCHAR(64) NULL,
    product_name VARCHAR(191) NOT NULL,
    quantity INT UNSIGNED NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sales_transaction_items_transaction FOREIGN KEY (transaction_id)
        REFERENCES sales_transactions (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_sales_transaction_items_product FOREIGN KEY (product_id)
        REFERENCES products (id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Application users that can log in to the POS.
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    role VARCHAR(64) NOT NULL UNIQUE,
    username VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Seed data to mirror the existing in-memory demo content.
-- ---------------------------------------------------------------------------

INSERT INTO product_categories (id, name, description) VALUES
    ('coffee-classics', 'Coffee Classics', 'Traditional espresso beverages prepared with freshly ground beans.'),
    ('signature-espresso', 'Signature Espresso Creations', 'Creamy espresso drinks finished with silky steamed milk.'),
    ('iced-favorites', 'Iced Favorites', 'Chilled beverages perfect for warm afternoons.'),
    ('non-coffee', 'Non-Coffee & Tea', 'Comforting alternatives for non-coffee drinkers.'),
    ('uncategorized', 'Uncategorized', 'Items that are awaiting classification.')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description);

INSERT INTO products (id, category_id, name, price, image, description) VALUES
    ('espresso', 'coffee-classics', 'Espresso', 80.00, 'espresso.jpeg', 'A bold single shot of our house espresso.'),
    ('cappuccino', 'signature-espresso', 'Cappuccino', 120.00, 'cappuccino.jpeg', 'Espresso topped with velvety steamed milk foam.'),
    ('latte', 'signature-espresso', 'Latte', 110.00, 'latte.jpeg', 'Silky espresso balanced with lightly textured milk.'),
    ('mocha', 'iced-favorites', 'Mocha', 130.00, 'mocha.jpeg', 'Chocolate-infused espresso finished with whipped cream.')
ON DUPLICATE KEY UPDATE
    category_id = VALUES(category_id),
    name = VALUES(name),
    price = VALUES(price),
    image = VALUES(image),
    description = VALUES(description);

INSERT INTO inventory_items (item, quantity, unit) VALUES
    ('Coffee Beans', 10, 'kg'),
    ('Milk', 25, 'L'),
    ('Cups', 300, 'pcs')
ON DUPLICATE KEY UPDATE
    quantity = VALUES(quantity),
    unit = VALUES(unit);

INSERT INTO staff_accounts (id, role, name, status, time_in, time_out) VALUES
    (1, 'Manager', 'Jowen', 'Inactive', NULL, NULL),
    (2, 'Cashier', 'Elsa', 'Inactive', NULL, NULL)
ON DUPLICATE KEY UPDATE
    role = VALUES(role),
    name = VALUES(name),
    status = VALUES(status),
    time_in = VALUES(time_in),
    time_out = VALUES(time_out);
ALTER TABLE staff_accounts AUTO_INCREMENT = 3;

INSERT INTO sales_transactions (id, reference, total, occurred_at) VALUES
    (1, '101', 360.00, '2025-09-19 10:00:00'),
    (2, '102', 240.00, '2025-09-19 11:30:00'),
    (3, '103', 110.00, '2025-09-19 14:00:00'),
    (4, '104', 120.00, '2025-09-19 15:00:00'),
    (5, '105', 260.00, '2025-09-19 16:30:00')
ON DUPLICATE KEY UPDATE
    total = VALUES(total),
    occurred_at = VALUES(occurred_at);
ALTER TABLE sales_transactions AUTO_INCREMENT = 6;

INSERT INTO sales_transaction_items (transaction_id, product_id, product_name, quantity, unit_price) VALUES
    (1, 'cappuccino', 'Cappuccino', 2, 120.00),
    (2, 'latte', 'Latte', 1, 110.00),
    (2, 'espresso', 'Espresso', 1, 80.00),
    (3, 'mocha', 'Mocha', 1, 130.00),
    (4, 'cappuccino', 'Cappuccino', 1, 120.00),
    (5, 'mocha', 'Mocha', 2, 130.00)
ON DUPLICATE KEY UPDATE
    product_id = VALUES(product_id),
    product_name = VALUES(product_name),
    quantity = VALUES(quantity),
    unit_price = VALUES(unit_price);

INSERT INTO users (id, role, username, password_hash) VALUES
    (1, 'manager', 'manager', '$2y$12$3nfUZa978ubbF.LAMSwsLuQMRGj/mK/ZQV408hETndcBjDwdJHgt2'),
    (2, 'cashier', 'cashier', '$2y$12$3nfUZa978ubbF.LAMSwsLuQMRGj/mK/ZQV408hETndcBjDwdJHgt2')
ON DUPLICATE KEY UPDATE
    role = VALUES(role),
    username = VALUES(username),
    password_hash = VALUES(password_hash);
ALTER TABLE users AUTO_INCREMENT = 3;
