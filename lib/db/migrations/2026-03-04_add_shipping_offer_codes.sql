-- Migration: Seed default shipping offer codes in settings table
-- Date: 2026-03-04

INSERT IGNORE INTO `settings` (`key`, `value`) VALUES
('shipping_offer_relay', '"MONR-CpourToi"'),
('shipping_offer_home_fr', '"POFR-ColissimoAccess"'),
('shipping_offer_home_international', '"POFR-ColissimoAccessInternational"');
