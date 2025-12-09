-- =====================================================
-- STOCK MOVEMENTS TABLE
-- Tracks all inventory changes for audit trail
-- =====================================================

USE pos_jither;

-- Create stock_movements table
CREATE TABLE IF NOT EXISTS stock_movements (
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

-- Show success message
SELECT '✅ stock_movements table created successfully!' AS status;
SELECT 'This table will now track all inventory deductions and additions.' AS info;

-- Show table structure
DESCRIBE stock_movements;
