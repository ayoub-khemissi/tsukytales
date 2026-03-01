-- Remove is_subscription column from products table
-- All products are now available for subscription (except preorders by business rule)
ALTER TABLE `products` DROP COLUMN `is_subscription`;
