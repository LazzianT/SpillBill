-- SpillBill MySQL 8.4 schema
-- Run against the selected database (for example: twizzi).
-- No DROP/CREATE DATABASE statements: safe to review before applying.

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = 'utf8mb4_unicode_ci';
SET time_zone = '+00:00';

CREATE TABLE users (
    id CHAR(36) NOT NULL,
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('MARKETING', 'ACCOUNTING') NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    retention_expires_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_username (username),
    KEY idx_users_active_role (active, role)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE customers (
    id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_info VARCHAR(500) NULL,
    archived_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    retention_expires_at DATETIME NULL,
    PRIMARY KEY (id),
    KEY idx_customers_name (name),
    KEY idx_customers_archived_at (archived_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE products (
    id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    archived_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT chk_products_unit_price CHECK (unit_price >= 0),
    KEY idx_products_name_active (name, active),
    KEY idx_products_archived_at (archived_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE sales_orders (
    id CHAR(36) NOT NULL,
    order_number VARCHAR(50) NOT NULL,
    customer_id CHAR(36) NOT NULL,
    created_by_user_id CHAR(36) NOT NULL,
    order_date DATE NOT NULL,
    status ENUM('DRAFT', 'INVOICED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    archived_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_sales_orders_order_number (order_number),
    KEY idx_sales_orders_customer_status (customer_id, status),
    KEY idx_sales_orders_created_by (created_by_user_id),
    KEY idx_sales_orders_order_date (order_date),
    CONSTRAINT fk_sales_orders_customer
        FOREIGN KEY (customer_id) REFERENCES customers (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_sales_orders_created_by
        FOREIGN KEY (created_by_user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE sales_order_items (
    id CHAR(36) NOT NULL,
    sales_order_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(15, 2) NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    line_total DECIMAL(20, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_sales_order_items_order_product (sales_order_id, product_id),
    KEY idx_sales_order_items_product (product_id),
    CONSTRAINT chk_sales_order_items_quantity CHECK (quantity > 0),
    CONSTRAINT chk_sales_order_items_unit_price CHECK (unit_price >= 0),
    CONSTRAINT fk_sales_order_items_order
        FOREIGN KEY (sales_order_id) REFERENCES sales_orders (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_sales_order_items_product
        FOREIGN KEY (product_id) REFERENCES products (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE invoice_headers (
    id CHAR(36) NOT NULL,
    invoice_number VARCHAR(50) NOT NULL,
    sales_order_id CHAR(36) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status ENUM('UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE') NOT NULL DEFAULT 'UNPAID',
    first_successful_payment_at DATETIME NULL,
    archived_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    retention_expires_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_invoice_headers_number (invoice_number),
    UNIQUE KEY uq_invoice_headers_sales_order (sales_order_id),
    KEY idx_invoice_headers_due_date_status (due_date, status),
    CONSTRAINT chk_invoice_headers_due_date CHECK (due_date >= invoice_date),
    CONSTRAINT fk_invoice_headers_sales_order
        FOREIGN KEY (sales_order_id) REFERENCES sales_orders (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE invoice_details (
    id CHAR(36) NOT NULL,
    invoice_id CHAR(36) NOT NULL,
    sales_order_item_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(15, 2) NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    line_total DECIMAL(20, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_invoice_details_invoice_item (invoice_id, sales_order_item_id),
    KEY idx_invoice_details_order_item (sales_order_item_id),
    KEY idx_invoice_details_product (product_id),
    CONSTRAINT chk_invoice_details_quantity CHECK (quantity > 0),
    CONSTRAINT chk_invoice_details_unit_price CHECK (unit_price >= 0),
    CONSTRAINT fk_invoice_details_invoice
        FOREIGN KEY (invoice_id) REFERENCES invoice_headers (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_invoice_details_order_item
        FOREIGN KEY (sales_order_item_id) REFERENCES sales_order_items (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_invoice_details_product
        FOREIGN KEY (product_id) REFERENCES products (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE payments (
    id CHAR(36) NOT NULL,
    payment_number VARCHAR(50) NOT NULL,
    invoice_id CHAR(36) NOT NULL,
    payment_date DATETIME NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    method ENUM('BANK_TRANSFER', 'EWALLET', 'CASH', 'OTHER') NOT NULL,
    status ENUM('SUCCESS', 'VOID') NOT NULL DEFAULT 'SUCCESS',
    reference VARCHAR(255) NULL,
    voided_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    retention_expires_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_payments_number (payment_number),
    KEY idx_payments_invoice_status (invoice_id, status),
    KEY idx_payments_payment_date (payment_date),
    CONSTRAINT chk_payments_amount CHECK (amount > 0),
    CONSTRAINT fk_payments_invoice
        FOREIGN KEY (invoice_id) REFERENCES invoice_headers (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE histories (
    id CHAR(36) NOT NULL,
    actor_user_id CHAR(36) NULL,
    action ENUM('CREATE', 'UPDATE', 'DELETE', 'RECORD_PAYMENT', 'VOID_PAYMENT', 'ARCHIVE') NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id CHAR(36) NOT NULL,
    occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description VARCHAR(500) NOT NULL,
    retention_expires_at DATETIME NULL,
    PRIMARY KEY (id),
    KEY idx_histories_actor_occurred (actor_user_id, occurred_at),
    KEY idx_histories_entity (entity_type, entity_id),
    KEY idx_histories_retention (retention_expires_at),
    CONSTRAINT fk_histories_actor
        FOREIGN KEY (actor_user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE OR REPLACE VIEW sales_order_summary AS
SELECT
    so.id,
    so.order_number,
    so.customer_id,
    so.created_by_user_id,
    so.order_date,
    so.status,
    COALESCE(SUM(soi.line_total), 0.00) AS total
FROM sales_orders AS so
LEFT JOIN sales_order_items AS soi ON soi.sales_order_id = so.id
GROUP BY
    so.id,
    so.order_number,
    so.customer_id,
    so.created_by_user_id,
    so.order_date,
    so.status;

CREATE OR REPLACE VIEW invoice_summary AS
SELECT
    ih.id,
    ih.invoice_number,
    ih.sales_order_id,
    ih.invoice_date,
    ih.due_date,
    COALESCE(detail_totals.total, 0.00) AS total,
    COALESCE(payment_totals.paid, 0.00) AS paid,
    COALESCE(detail_totals.total, 0.00) - COALESCE(payment_totals.paid, 0.00) AS remaining,
    CASE
        WHEN COALESCE(detail_totals.total, 0.00) <= COALESCE(payment_totals.paid, 0.00) THEN 'PAID'
        WHEN COALESCE(payment_totals.paid, 0.00) > 0 THEN 'PARTIALLY_PAID'
        WHEN ih.due_date < UTC_DATE() THEN 'OVERDUE'
        ELSE 'UNPAID'
    END AS status,
    ih.archived_at,
    ih.first_successful_payment_at
FROM invoice_headers AS ih
LEFT JOIN (
    SELECT invoice_id, SUM(line_total) AS total
    FROM invoice_details
    GROUP BY invoice_id
) AS detail_totals ON detail_totals.invoice_id = ih.id
LEFT JOIN (
    SELECT invoice_id, SUM(amount) AS paid
    FROM payments
    WHERE status = 'SUCCESS'
    GROUP BY invoice_id
) AS payment_totals ON payment_totals.invoice_id = ih.id;

DELIMITER $$

CREATE TRIGGER trg_sales_orders_before_update
BEFORE UPDATE ON sales_orders
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1 FROM invoice_headers WHERE sales_order_id = OLD.id
    ) THEN
        IF NOT (
            OLD.status = 'DRAFT'
            AND NEW.status = 'INVOICED'
            AND NEW.id = OLD.id
            AND NEW.order_number = OLD.order_number
            AND NEW.customer_id = OLD.customer_id
            AND NEW.created_by_user_id = OLD.created_by_user_id
            AND NEW.order_date = OLD.order_date
            AND (NEW.archived_at <=> OLD.archived_at)
        ) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Sales order is locked after invoicing';
        END IF;
    ELSEIF NOT (
        (OLD.status = NEW.status)
        OR (OLD.status = 'DRAFT' AND NEW.status IN ('INVOICED', 'CANCELLED'))
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid sales order status transition';
    END IF;
END$$

CREATE TRIGGER trg_sales_order_items_before_update
BEFORE UPDATE ON sales_order_items
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1
        FROM invoice_headers AS ih
        JOIN sales_orders AS so ON so.id = ih.sales_order_id
        WHERE so.id = OLD.sales_order_id
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Sales order item is locked after invoicing';
    END IF;
END$$

CREATE TRIGGER trg_sales_order_items_before_delete
BEFORE DELETE ON sales_order_items
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1
        FROM invoice_headers AS ih
        JOIN sales_orders AS so ON so.id = ih.sales_order_id
        WHERE so.id = OLD.sales_order_id
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Sales order item is locked after invoicing';
    END IF;
END$$

CREATE TRIGGER trg_invoice_headers_before_insert
BEFORE INSERT ON invoice_headers
FOR EACH ROW
BEGIN
    DECLARE order_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE item_count INT;

    SELECT status INTO order_status
    FROM sales_orders
    WHERE id = NEW.sales_order_id;

    IF order_status IS NULL OR order_status <> 'DRAFT' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only draft sales orders can be invoiced';
    END IF;

    SELECT COUNT(*) INTO item_count
    FROM sales_order_items
    WHERE sales_order_id = NEW.sales_order_id;

    IF item_count = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Sales order must contain at least one item';
    END IF;
END$$

CREATE TRIGGER trg_invoice_headers_after_insert
AFTER INSERT ON invoice_headers
FOR EACH ROW
BEGIN
    UPDATE sales_orders
    SET status = 'INVOICED'
    WHERE id = NEW.sales_order_id;
END$$

CREATE TRIGGER trg_invoice_headers_before_update
BEFORE UPDATE ON invoice_headers
FOR EACH ROW
BEGIN
    IF OLD.first_successful_payment_at IS NOT NULL
       AND NOT (
           NEW.id = OLD.id
           AND NEW.invoice_number = OLD.invoice_number
           AND NEW.sales_order_id = OLD.sales_order_id
           AND NEW.invoice_date = OLD.invoice_date
           AND NEW.due_date = OLD.due_date
           AND NEW.status = OLD.status
           AND NEW.archived_at <=> OLD.archived_at
           AND NEW.first_successful_payment_at <=> OLD.first_successful_payment_at
       ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invoice is locked after first successful payment';
    END IF;

    IF NEW.archived_at IS NOT NULL AND EXISTS (
        SELECT 1
        FROM invoice_summary
        WHERE id = OLD.id AND status = 'PAID'
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Paid invoice cannot be archived';
    END IF;
END$$

CREATE TRIGGER trg_invoice_details_before_insert
BEFORE INSERT ON invoice_details
FOR EACH ROW
BEGIN
    DECLARE header_order_id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

    SELECT sales_order_id INTO header_order_id
    FROM invoice_headers
    WHERE id = NEW.invoice_id;

    IF NOT EXISTS (
        SELECT 1
        FROM sales_order_items
        WHERE id = NEW.sales_order_item_id
          AND sales_order_id = header_order_id
          AND product_id = NEW.product_id
          AND NEW.quantity <= quantity
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invoice detail does not match sales order item';
    END IF;
END$$

CREATE TRIGGER trg_invoice_details_before_update
BEFORE UPDATE ON invoice_details
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1 FROM invoice_headers
        WHERE id = OLD.invoice_id AND first_successful_payment_at IS NOT NULL
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invoice detail is locked after first successful payment';
    END IF;
END$$

CREATE TRIGGER trg_invoice_details_before_delete
BEFORE DELETE ON invoice_details
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1 FROM invoice_headers
        WHERE id = OLD.invoice_id AND first_successful_payment_at IS NOT NULL
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invoice detail is locked after first successful payment';
    END IF;
END$$

CREATE TRIGGER trg_payments_before_insert
BEFORE INSERT ON payments
FOR EACH ROW
BEGIN
    DECLARE invoice_total DECIMAL(20, 2);
    DECLARE paid_total DECIMAL(20, 2);

    SELECT total INTO invoice_total
    FROM (
        SELECT COALESCE(SUM(line_total), 0.00) AS total
        FROM invoice_details
        WHERE invoice_id = NEW.invoice_id
    ) AS totals;

    SELECT COALESCE(SUM(amount), 0.00) INTO paid_total
    FROM payments
    WHERE invoice_id = NEW.invoice_id AND status = 'SUCCESS';

    IF NEW.status = 'SUCCESS' AND paid_total + NEW.amount > invoice_total THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Payment exceeds invoice outstanding amount';
    END IF;
END$$

CREATE TRIGGER trg_payments_after_insert
AFTER INSERT ON payments
FOR EACH ROW
BEGIN
    IF NEW.status = 'SUCCESS' THEN
        UPDATE invoice_headers
        SET first_successful_payment_at = COALESCE(first_successful_payment_at, NEW.payment_date)
        WHERE id = NEW.invoice_id;
    END IF;
END$$

CREATE TRIGGER trg_payments_before_update
BEFORE UPDATE ON payments
FOR EACH ROW
BEGIN
    IF OLD.status = 'VOID' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Void payment cannot be changed';
    END IF;

    IF NOT (OLD.status = 'SUCCESS' AND NEW.status = 'VOID') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Payment can only transition from SUCCESS to VOID';
    END IF;

    IF NOT (
        NEW.id = OLD.id
        AND NEW.payment_number = OLD.payment_number
        AND NEW.invoice_id = OLD.invoice_id
        AND NEW.payment_date = OLD.payment_date
        AND NEW.amount = OLD.amount
        AND NEW.method = OLD.method
        AND NEW.reference <=> OLD.reference
        AND NEW.voided_at IS NOT NULL
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only payment status can be changed to VOID';
    END IF;
END$$

CREATE TRIGGER trg_payments_before_delete
BEFORE DELETE ON payments
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Payments cannot be deleted; void the payment instead';
END$$

DELIMITER ;
