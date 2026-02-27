-- Tsuky Tales — MySQL 8 Schema
-- Run with: mysql -u root -p tsukytales < lib/db/schema.sql

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ============================================================
-- Admins
-- ============================================================
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Customers
-- ============================================================
CREATE TABLE IF NOT EXISTS `customers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `first_name` VARCHAR(255) DEFAULT NULL,
  `last_name` VARCHAR(255) DEFAULT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `has_account` TINYINT(1) NOT NULL DEFAULT 1,
  `metadata` JSON DEFAULT NULL COMMENT 'Données flexibles: stripe_customer_id, address, zip_code, city, phone',
  `subscription_schedule_id` VARCHAR(255) AS (JSON_UNQUOTE(JSON_EXTRACT(`metadata`, '$.subscription_schedule_id'))) STORED,
  `stripe_customer_id` VARCHAR(255) AS (JSON_UNQUOTE(JSON_EXTRACT(`metadata`, '$.stripe_customer_id'))) STORED,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_customers_subscription` (`subscription_schedule_id`),
  INDEX `idx_customers_stripe` (`stripe_customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Products
-- ============================================================
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `description` TEXT DEFAULT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `stock` INT NOT NULL DEFAULT 0,
  `image` VARCHAR(500) DEFAULT NULL,
  `is_preorder` TINYINT(1) NOT NULL DEFAULT 0,
  `weight` DECIMAL(6,2) NOT NULL DEFAULT 1.00,
  `length` DECIMAL(6,2) NOT NULL DEFAULT 21.00,
  `width` DECIMAL(6,2) NOT NULL DEFAULT 15.00,
  `height` DECIMAL(6,2) NOT NULL DEFAULT 3.00,
  `is_subscription` TINYINT(1) NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 0,
  `subscription_price` DECIMAL(10,2) DEFAULT NULL,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,

  `images` JSON DEFAULT NULL,
  `translations` JSON DEFAULT NULL COMMENT '{ "en": { "name": "...", "description": "..." }, "es": { ... }, ... }',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_products_preorder` (`is_preorder`),
  INDEX `idx_products_active` (`is_active`),
  INDEX `idx_products_deleted` (`is_deleted`),
  FULLTEXT INDEX `idx_products_search` (`name`, `description`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Product Variants
-- ============================================================
CREATE TABLE IF NOT EXISTS `product_variants` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `sku` VARCHAR(255) DEFAULT NULL UNIQUE,
  `inventory_quantity` INT NOT NULL DEFAULT 0,
  `price` DECIMAL(10,2) NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_variant_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Orders
-- ============================================================
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `display_id` INT DEFAULT NULL,
  `cart_id` VARCHAR(36) DEFAULT NULL,
  `customer_id` INT DEFAULT NULL,
  `email` VARCHAR(255) NOT NULL,
  `billing_address` JSON DEFAULT NULL,
  `shipping_address` JSON DEFAULT NULL,
  `items` JSON DEFAULT NULL,
  `status` ENUM('pending','completed','archived','canceled','requires_action') NOT NULL DEFAULT 'pending',
  `fulfillment_status` ENUM('not_fulfilled','partially_fulfilled','fulfilled','partially_shipped','shipped','delivered','partially_returned','returned','canceled','requires_action') NOT NULL DEFAULT 'not_fulfilled',
  `payment_status` ENUM('not_paid','awaiting','captured','partially_refunded','refunded','canceled','requires_action') NOT NULL DEFAULT 'not_paid',
  `total` DECIMAL(10,2) NOT NULL,
  `currency_code` VARCHAR(3) NOT NULL DEFAULT 'eur',
  `metadata` JSON DEFAULT NULL,

  -- Generated columns for fast JSON lookups (avoid full table scans on webhooks)
  `stripe_invoice_id` VARCHAR(255) AS (JSON_UNQUOTE(JSON_EXTRACT(`metadata`, '$.stripe_invoice_id'))) STORED,
  `payment_intent_id` VARCHAR(255) AS (JSON_UNQUOTE(JSON_EXTRACT(`metadata`, '$.payment_intent_id'))) STORED,
  `shipping_order_id` VARCHAR(255) AS (JSON_UNQUOTE(JSON_EXTRACT(`metadata`, '$.shipping_order_id'))) STORED,
  `tracking_number` VARCHAR(255) AS (JSON_UNQUOTE(JSON_EXTRACT(`metadata`, '$.tracking_number'))) STORED,
  `is_subscription_order` TINYINT(1) AS (CASE WHEN JSON_EXTRACT(`metadata`, '$.subscription') = true THEN 1 ELSE 0 END) STORED,

  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_orders_customer` (`customer_id`),
  INDEX `idx_orders_email` (`email`),
  INDEX `idx_orders_status_created` (`status`, `createdAt` DESC),
  INDEX `idx_orders_payment_status` (`payment_status`),
  INDEX `idx_orders_fulfillment_status` (`fulfillment_status`),
  INDEX `idx_orders_stripe_invoice` (`stripe_invoice_id`),
  INDEX `idx_orders_payment_intent` (`payment_intent_id`),
  INDEX `idx_orders_shipping_order` (`shipping_order_id`),
  INDEX `idx_orders_tracking` (`tracking_number`),
  INDEX `idx_orders_subscription` (`is_subscription_order`),
  CONSTRAINT `fk_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Carts
-- ============================================================
CREATE TABLE IF NOT EXISTS `carts` (
  `id` VARCHAR(36) PRIMARY KEY,
  `customer_id` INT DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `items` JSON DEFAULT ('[]'),
  `context` JSON DEFAULT ('{}'),
  `completed_at` DATETIME DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_carts_customer_completed` (`customer_id`, `completed_at`),
  CONSTRAINT `fk_carts_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FK deferred: orders → carts (carts defined after orders)
ALTER TABLE `orders` ADD CONSTRAINT `fk_orders_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- Discounts
-- ============================================================
CREATE TABLE IF NOT EXISTS `discounts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(255) NOT NULL UNIQUE,
  `is_dynamic` TINYINT(1) NOT NULL DEFAULT 0,
  `rule` JSON NOT NULL COMMENT '{ type: "percentage"|"fixed", value: number }',
  `is_disabled` TINYINT(1) NOT NULL DEFAULT 0,
  `starts_at` DATETIME DEFAULT NULL,
  `ends_at` DATETIME DEFAULT NULL,
  `usage_limit` INT DEFAULT NULL,
  `usage_count` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Addresses
-- ============================================================
CREATE TABLE IF NOT EXISTS `addresses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT NOT NULL,
  `label` VARCHAR(255) NOT NULL COMMENT 'Ex: Maison, Travail',
  `first_name` VARCHAR(255) NOT NULL,
  `last_name` VARCHAR(255) NOT NULL,
  `street` VARCHAR(500) NOT NULL,
  `street_complement` VARCHAR(500) DEFAULT NULL,
  `zip_code` VARCHAR(10) NOT NULL,
  `city` VARCHAR(255) NOT NULL,
  `country` VARCHAR(2) NOT NULL DEFAULT 'FR' COMMENT 'ISO 3166-1 alpha-2',
  `phone` VARCHAR(20) DEFAULT NULL,
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_addresses_customer` (`customer_id`),
  INDEX `idx_addresses_customer_default` (`customer_id`, `is_default`),
  CONSTRAINT `fk_address_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- NextAuth — Accounts
-- ============================================================
CREATE TABLE IF NOT EXISTS `accounts` (
  `id` VARCHAR(255) PRIMARY KEY,
  `userId` INT NOT NULL,
  `type` VARCHAR(255) NOT NULL,
  `provider` VARCHAR(255) NOT NULL,
  `providerAccountId` VARCHAR(255) NOT NULL,
  `refresh_token` TEXT DEFAULT NULL,
  `access_token` TEXT DEFAULT NULL,
  `expires_at` INT DEFAULT NULL,
  `token_type` VARCHAR(255) DEFAULT NULL,
  `scope` VARCHAR(255) DEFAULT NULL,
  `id_token` TEXT DEFAULT NULL,
  `session_state` VARCHAR(255) DEFAULT NULL,
  UNIQUE KEY `uk_accounts_provider` (`provider`, `providerAccountId`),
  CONSTRAINT `fk_account_customer` FOREIGN KEY (`userId`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- NextAuth — Sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` VARCHAR(255) PRIMARY KEY,
  `sessionToken` VARCHAR(255) NOT NULL UNIQUE,
  `userId` INT NOT NULL,
  `expires` DATETIME NOT NULL,
  CONSTRAINT `fk_session_customer` FOREIGN KEY (`userId`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- NextAuth — Verification Tokens
-- ============================================================
CREATE TABLE IF NOT EXISTS `verification_tokens` (
  `identifier` VARCHAR(255) NOT NULL,
  `token` VARCHAR(255) NOT NULL UNIQUE,
  `expires` DATETIME NOT NULL,
  PRIMARY KEY (`identifier`, `token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Contact Messages
-- ============================================================
CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `subject` VARCHAR(500) NOT NULL,
  `message` TEXT NOT NULL,
  `status` ENUM('unread','read','replied') NOT NULL DEFAULT 'unread',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_contact_status` (`status`),
  INDEX `idx_contact_created` (`createdAt`),
  INDEX `idx_contact_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Settings (key-value store for configurable parameters)
-- ============================================================
CREATE TABLE IF NOT EXISTS `settings` (
  `key` VARCHAR(255) PRIMARY KEY,
  `value` JSON NOT NULL,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Seed: Default shipping rates
-- ============================================================
INSERT IGNORE INTO `settings` (`key`, `value`) VALUES
('shipping_rates_relay_fr',  '[{"maxWeight":0.5,"price":3.9},{"maxWeight":1,"price":4.5},{"maxWeight":3,"price":5.5},{"maxWeight":5,"price":6.9},{"maxWeight":10,"price":8.9}]'),
('shipping_rates_relay_eu',  '[{"maxWeight":0.5,"price":6.9},{"maxWeight":1,"price":7.9},{"maxWeight":3,"price":9.9},{"maxWeight":5,"price":12.9},{"maxWeight":10,"price":16.9}]'),
('shipping_rates_home_fr',   '[{"maxWeight":0.5,"price":5.9},{"maxWeight":1,"price":6.9},{"maxWeight":2,"price":7.9},{"maxWeight":5,"price":9.9},{"maxWeight":10,"price":13.9}]'),
('shipping_rates_home_eu1',  '[{"maxWeight":0.5,"price":9.9},{"maxWeight":1,"price":12.9},{"maxWeight":2,"price":15.9},{"maxWeight":5,"price":19.9},{"maxWeight":10,"price":26.9}]'),
('shipping_rates_home_eu2',  '[{"maxWeight":0.5,"price":12.9},{"maxWeight":1,"price":15.9},{"maxWeight":2,"price":19.9},{"maxWeight":5,"price":25.9},{"maxWeight":10,"price":34.9}]'),
('shipping_rates_home_om',   '[{"maxWeight":0.5,"price":9.9},{"maxWeight":1,"price":14.9},{"maxWeight":2,"price":19.9},{"maxWeight":5,"price":29.9},{"maxWeight":10,"price":44.9}]'),
('shipping_rates_home_world','[{"maxWeight":0.5,"price":16.9},{"maxWeight":1,"price":22.9},{"maxWeight":2,"price":29.9},{"maxWeight":5,"price":42.9},{"maxWeight":10,"price":59.9}]'),
('subscription_dates', '["2026-04-01","2026-07-01","2026-10-01","2027-01-01"]');

-- ============================================================
-- Seed: Default admin (password: admin)
-- ============================================================
INSERT IGNORE INTO `admins` (`username`, `password`)
VALUES ('admin', '$2b$12$qwjjzse4R/9phbLdOepc1eTC329BnDsqBvdWNqqrjOOuX7/rbN6Ai');
