-- Migration: Add composite indexes for subscription product lookup and order payment+date queries
-- Date: 2026-03-01

-- Index for findActiveSubscriptionProduct: WHERE is_active = 1 AND (is_deleted = 0 OR is_deleted IS NULL)
ALTER TABLE `products`
  ADD INDEX `idx_products_active_deleted` (`is_active`, `is_deleted`);

-- Index for getDailySales / sumTotal: WHERE payment_status = 'captured' AND createdAt >= ...
ALTER TABLE `orders`
  ADD INDEX `idx_orders_payment_created` (`payment_status`, `createdAt`);
