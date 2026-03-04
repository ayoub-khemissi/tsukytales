-- Migration: Seed default shipping offer codes in settings table
-- Date: 2026-03-04

-- Remove old key (renamed to relay_fr/relay_eu)
DELETE FROM `settings` WHERE `key` = 'shipping_offer_relay';

INSERT IGNORE INTO `settings` (`key`, `value`) VALUES
('shipping_offer_relay_fr', '"MONR-CpourToi"'),
('shipping_offer_relay_eu', '"MONR-CpourToiEurope"'),
('shipping_offer_home_fr', '"POFR-ColissimoAccess"'),
('shipping_offer_home_international', '"POFR-ColissimoAccessInternational"');
