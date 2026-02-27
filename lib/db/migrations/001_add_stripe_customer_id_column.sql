-- Add generated column for fast stripe_customer_id lookups (avoids full table scan)
ALTER TABLE `customers`
  ADD COLUMN `stripe_customer_id` VARCHAR(255)
    AS (JSON_UNQUOTE(JSON_EXTRACT(`metadata`, '$.stripe_customer_id'))) STORED
    AFTER `subscription_schedule_id`,
  ADD INDEX `idx_customers_stripe` (`stripe_customer_id`);
