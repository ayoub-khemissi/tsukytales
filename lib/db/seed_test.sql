-- Tsuky Tales — Test Seed Data
-- Run with: mysql -u root --default-character-set=utf8mb4 tsukytales < lib/db/seed_test.sql
-- All customer passwords: Test1234!
-- Admin password: admin (already in schema.sql)

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET @now = NOW();

-- ============================================================
-- Truncate all tables (order matters for foreign keys)
-- ============================================================
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `contact_messages`;
TRUNCATE TABLE `carts`;
TRUNCATE TABLE `orders`;
TRUNCATE TABLE `product_variants`;
TRUNCATE TABLE `products`;
TRUNCATE TABLE `addresses`;
TRUNCATE TABLE `accounts`;
TRUNCATE TABLE `sessions`;
TRUNCATE TABLE `verification_tokens`;
TRUNCATE TABLE `customers`;
TRUNCATE TABLE `discounts`;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Customers (password = bcrypt hash of "Test1234!")
-- ============================================================
SET @pwd = '$2b$10$OQFg4U4mulizO6vwiiSJ8eMIZ7SKWDFKD1M6QP.MPgr.voygSK7Ou';

INSERT INTO `customers` (`id`, `first_name`, `last_name`, `email`, `password`, `has_account`, `metadata`, `createdAt`) VALUES
(1, 'Marie', 'Dupont', 'marie.dupont@test.com', @pwd, 1,
  JSON_OBJECT(
    'stripe_customer_id', 'cus_test_marie_001',
    'subscription_schedule_id', 'sub_sched_test_marie',
    'address', '12 Rue de Rivoli',
    'zip_code', '75001',
    'city', 'Paris',
    'phone', '+33612345678'
  ),
  DATE_SUB(@now, INTERVAL 6 MONTH)
),
(2, 'Lucas', 'Martin', 'lucas.martin@test.com', @pwd, 1,
  JSON_OBJECT(
    'stripe_customer_id', 'cus_test_lucas_002',
    'address', '8 Avenue Jean Jaures',
    'zip_code', '69007',
    'city', 'Lyon',
    'phone', '+33698765432'
  ),
  DATE_SUB(@now, INTERVAL 4 MONTH)
),
(3, 'Emma', 'Bernard', 'emma.bernard@test.com', @pwd, 1,
  JSON_OBJECT(
    'stripe_customer_id', 'cus_test_emma_003',
    'subscription_schedule_id', 'sub_sched_test_emma',
    'address', '25 Boulevard Gambetta',
    'zip_code', '34000',
    'city', 'Montpellier',
    'phone', '+33611223344'
  ),
  DATE_SUB(@now, INTERVAL 8 MONTH)
),
(4, 'Thomas', 'Leroy', 'thomas.leroy@test.com', @pwd, 1,
  JSON_OBJECT(
    'stripe_customer_id', 'cus_test_thomas_004',
    'address', '3 Place Bellecour',
    'zip_code', '69002',
    'city', 'Lyon',
    'phone', '+33677889900'
  ),
  DATE_SUB(@now, INTERVAL 2 MONTH)
),
(5, 'Chloe', 'Moreau', 'chloe.moreau@test.com', @pwd, 1,
  JSON_OBJECT(
    'stripe_customer_id', 'cus_test_chloe_005',
    'subscription_schedule_id', 'sub_sched_test_chloe',
    'address', '14 Rue Sainte-Catherine',
    'zip_code', '33000',
    'city', 'Bordeaux',
    'phone', '+33655443322'
  ),
  DATE_SUB(@now, INTERVAL 10 MONTH)
),
(6, 'Antoine', 'Petit', 'antoine.petit@test.com', @pwd, 0,
  NULL,
  DATE_SUB(@now, INTERVAL 1 MONTH)
);

-- ============================================================
-- Addresses
-- ============================================================
INSERT INTO `addresses` (`customer_id`, `label`, `first_name`, `last_name`, `street`, `street_complement`, `zip_code`, `city`, `country`, `phone`, `is_default`) VALUES
-- Marie: 2 addresses
(1, 'Maison',   'Marie', 'Dupont', '12 Rue de Rivoli', NULL, '75001', 'Paris', 'FR', '+33612345678', 1),
(1, 'Travail',  'Marie', 'Dupont', '45 Avenue de l''Opéra', '3ème étage', '75002', 'Paris', 'FR', '+33612345678', 0),
-- Lucas
(2, 'Maison',   'Lucas', 'Martin', '8 Avenue Jean Jaures', 'Bat B', '69007', 'Lyon', 'FR', '+33698765432', 1),
-- Emma
(3, 'Maison',   'Emma', 'Bernard', '25 Boulevard Gambetta', NULL, '34000', 'Montpellier', 'FR', '+33611223344', 1),
(3, 'Parents',  'Emma', 'Bernard', '7 Rue des Lilas', NULL, '34070', 'Montpellier', 'FR', '+33611223344', 0),
-- Thomas
(4, 'Maison',   'Thomas', 'Leroy', '3 Place Bellecour', 'Apt 12', '69002', 'Lyon', 'FR', '+33677889900', 1),
-- Chloe
(5, 'Maison',   'Chloe', 'Moreau', '14 Rue Sainte-Catherine', NULL, '33000', 'Bordeaux', 'FR', '+33655443322', 1);

-- ============================================================
-- Products
-- ============================================================
INSERT INTO `products` (`id`, `name`, `slug`, `description`, `price`, `stock`, `image`, `is_preorder`, `weight`, `length`, `width`, `height`, `is_subscription`, `is_active`, `subscription_price`, `images`, `translations`, `createdAt`) VALUES
-- Active product: subscription + preorder (to test Case B layout)
-- Toggle is_preorder to 0 in admin to test Case A
(1,
  'Le Voyage de Tsuky',
  'le-voyage-de-tsuky',
  'Plongez dans l''univers poétique de Tsuky, un petit renard curieux qui part à la découverte du monde. Un livre illustré de 48 pages en couleur, relié avec soin.',
  27.90, 8,
  'assets/uploads/img/products/voyage-de-tsuky.jpg',
  1, 0.45, 25.00, 18.00, 1.50,
  1, 1, 24.90,
  JSON_ARRAY('assets/uploads/img/products/voyage-de-tsuky.jpg', 'assets/uploads/img/products/voyage-de-tsuky-2.jpg', 'assets/uploads/img/products/voyage-de-tsuky-3.jpg'),
  JSON_OBJECT(
    'en', JSON_OBJECT('name', 'Tsuky''s Journey', 'description', 'Dive into the poetic world of Tsuky, a curious little fox who sets off to discover the world. A 48-page full-colour illustrated book, carefully bound.'),
    'es', JSON_OBJECT('name', 'El Viaje de Tsuky', 'description', 'Sumérgete en el universo poético de Tsuky, un pequeño zorro curioso que parte a descubrir el mundo. Un libro ilustrado de 48 páginas a color, encuadernado con esmero.'),
    'de', JSON_OBJECT('name', 'Tsukys Reise', 'description', 'Tauchen Sie ein in die poetische Welt von Tsuky, einem neugierigen kleinen Fuchs, der die Welt entdecken will. Ein 48-seitiges, farbig illustriertes und sorgfältig gebundenes Buch.'),
    'it', JSON_OBJECT('name', 'Il Viaggio di Tsuky', 'description', 'Immergetevi nell''universo poetico di Tsuky, una piccola volpe curiosa che parte alla scoperta del mondo. Un libro illustrato di 48 pagine a colori, rilegato con cura.')
  ),
  DATE_SUB(@now, INTERVAL 12 MONTH)
),
-- Preorder (with stock)
(2,
  'L''Oiseau de Papier',
  'oiseau-de-papier',
  'Le prochain album de Tsuky Tales ! Un conte sur la fragilité et la beauté des rêves. Sortie prévue printemps 2026. Édition limitée avec ex-libris signé.',
  27.90, 30,
  'assets/uploads/img/products/oiseau-papier.jpg',
  1, 0.50, 25.00, 18.00, 1.50,
  0, 0, NULL,
  JSON_ARRAY('assets/uploads/img/products/oiseau-papier.jpg', 'assets/uploads/img/products/oiseau-papier-2.jpg'),
  JSON_OBJECT(
    'en', JSON_OBJECT('name', 'The Paper Bird', 'description', 'The next Tsuky Tales album! A tale about the fragility and beauty of dreams. Release planned spring 2026. Limited edition with signed bookplate.'),
    'es', JSON_OBJECT('name', 'El Pájaro de Papel', 'description', 'El próximo álbum de Tsuky Tales. Un cuento sobre la fragilidad y la belleza de los sueños. Lanzamiento previsto primavera 2026. Edición limitada con ex-libris firmado.'),
    'de', JSON_OBJECT('name', 'Der Papiervogel', 'description', 'Das nächste Album von Tsuky Tales! Eine Geschichte über die Zerbrechlichkeit und Schönheit der Träume. Erscheinung Frühjahr 2026. Limitierte Ausgabe mit signiertem Exlibris.'),
    'it', JSON_OBJECT('name', 'L''Uccello di Carta', 'description', 'Il prossimo album di Tsuky Tales! Un racconto sulla fragilità e la bellezza dei sogni. Uscita prevista primavera 2026. Edizione limitata con ex-libris firmato.')
  ),
  DATE_SUB(@now, INTERVAL 1 MONTH)
);

-- ============================================================
-- Product Variants
-- ============================================================
INSERT INTO `product_variants` (`id`, `product_id`, `title`, `sku`, `inventory_quantity`, `price`) VALUES
-- Le Voyage de Tsuky
(1, 1, 'Édition Standard', 'TSUKY-VOY-STD', 40, 24.90),
(2, 1, 'Édition Collector', 'TSUKY-VOY-COL', 10, 34.90),
-- L'Oiseau de Papier (preorder)
(3, 2, 'Édition Standard', 'TSUKY-OIS-STD', 20, 27.90),
(4, 2, 'Édition Limitée Signée', 'TSUKY-OIS-LIM', 10, 39.90);

-- ============================================================
-- Discounts
-- ============================================================
INSERT INTO `discounts` (`id`, `code`, `is_dynamic`, `rule`, `is_disabled`, `starts_at`, `ends_at`, `usage_limit`, `usage_count`) VALUES
-- Active percentage discount
(1, 'BIENVENUE10', 0,
  JSON_OBJECT('type', 'percentage', 'value', 10),
  0, DATE_SUB(@now, INTERVAL 3 MONTH), DATE_ADD(@now, INTERVAL 3 MONTH),
  100, 12
),
-- Active fixed discount
(2, 'PRINTEMPS5', 0,
  JSON_OBJECT('type', 'fixed', 'value', 5.00),
  0, DATE_SUB(@now, INTERVAL 1 MONTH), DATE_ADD(@now, INTERVAL 2 MONTH),
  50, 3
),
-- Expired discount
(3, 'NOEL2025', 0,
  JSON_OBJECT('type', 'percentage', 'value', 15),
  0, '2025-12-01 00:00:00', '2025-12-31 23:59:59',
  NULL, 27
),
-- Disabled discount
(4, 'TESTOFF', 0,
  JSON_OBJECT('type', 'percentage', 'value', 50),
  1, NULL, NULL,
  NULL, 0
),
-- Unlimited no-expiry discount
(5, 'TSUKYFAN', 0,
  JSON_OBJECT('type', 'fixed', 'value', 3.00),
  0, NULL, NULL,
  NULL, 45
),
-- Usage limit reached
(6, 'FLASH20', 0,
  JSON_OBJECT('type', 'percentage', 'value', 20),
  0, DATE_SUB(@now, INTERVAL 2 WEEK), DATE_ADD(@now, INTERVAL 1 MONTH),
  5, 5
);

-- ============================================================
-- Orders
-- ============================================================

-- Order 1: Marie — completed, delivered (2 items)
INSERT INTO `orders` (`id`, `display_id`, `customer_id`, `email`, `status`, `fulfillment_status`, `payment_status`, `total`, `currency_code`, `billing_address`, `shipping_address`, `items`, `metadata`, `createdAt`) VALUES
(1, 1001, 1, 'marie.dupont@test.com',
  'completed', 'delivered', 'captured', 54.80, 'eur',
  JSON_OBJECT(
    'first_name', 'Marie', 'last_name', 'Dupont',
    'street', '12 Rue de Rivoli', 'zip_code', '75001',
    'city', 'Paris', 'country', 'FR', 'phone', '+33612345678'
  ),
  JSON_OBJECT(
    'first_name', 'Marie', 'last_name', 'Dupont',
    'street', '12 Rue de Rivoli', 'zip_code', '75001',
    'city', 'Paris', 'country', 'FR', 'phone', '+33612345678'
  ),
  JSON_ARRAY(
    JSON_OBJECT('product_id', 1, 'variant_id', 1, 'name', 'Le Voyage de Tsuky — Édition Standard', 'quantity', 1, 'price', 24.90, 'unit_price', 24.90, 'weight', 0.45, 'length', 25, 'width', 18, 'height', 1.5),
    JSON_OBJECT('product_id', 1, 'variant_id', 2, 'name', 'Le Voyage de Tsuky — Édition Collector', 'quantity', 1, 'price', 34.90, 'unit_price', 34.90, 'weight', 0.45, 'length', 25, 'width', 18, 'height', 1.5)
  ),
  JSON_OBJECT(
    'payment_intent_id', 'pi_test_001',
    'shipping_method', 'home',
    'shipping_cost', 4.90,
    'tracking_number', 'FR123456789',
    'total_weight', 0.90,
    'discount_code', 'BIENVENUE10',
    'discount_amount', 5.98
  ),
  DATE_SUB(@now, INTERVAL 5 MONTH)
);

-- Order 2: Lucas — completed, shipped (in transit)
INSERT INTO `orders` (`id`, `display_id`, `customer_id`, `email`, `status`, `fulfillment_status`, `payment_status`, `total`, `currency_code`, `billing_address`, `shipping_address`, `items`, `metadata`, `createdAt`) VALUES
(2, 1002, 2, 'lucas.martin@test.com',
  'completed', 'shipped', 'captured', 29.80, 'eur',
  JSON_OBJECT(
    'first_name', 'Lucas', 'last_name', 'Martin',
    'street', '8 Avenue Jean Jaures', 'street_complement', 'Bat B',
    'zip_code', '69007', 'city', 'Lyon', 'country', 'FR', 'phone', '+33698765432'
  ),
  JSON_OBJECT(
    'first_name', 'Lucas', 'last_name', 'Martin',
    'street', '8 Avenue Jean Jaures', 'street_complement', 'Bat B',
    'zip_code', '69007', 'city', 'Lyon', 'country', 'FR', 'phone', '+33698765432'
  ),
  JSON_ARRAY(
    JSON_OBJECT('product_id', 1, 'variant_id', 1, 'name', 'Le Voyage de Tsuky — Édition Standard', 'quantity', 1, 'price', 24.90, 'unit_price', 24.90, 'weight', 0.45, 'length', 25, 'width', 18, 'height', 1.5)
  ),
  JSON_OBJECT(
    'payment_intent_id', 'pi_test_002',
    'shipping_method', 'relay',
    'shipping_cost', 4.90,
    'tracking_number', 'FR987654321',
    'shipping_order_id', 'boxtal_test_002',
    'total_weight', 0.45
  ),
  DATE_SUB(@now, INTERVAL 3 DAY)
);

-- Order 3: Emma — pending payment
INSERT INTO `orders` (`id`, `display_id`, `customer_id`, `email`, `status`, `fulfillment_status`, `payment_status`, `total`, `currency_code`, `billing_address`, `shipping_address`, `items`, `metadata`, `createdAt`) VALUES
(3, 1003, 3, 'emma.bernard@test.com',
  'pending', 'not_fulfilled', 'awaiting', 27.90, 'eur',
  JSON_OBJECT(
    'first_name', 'Emma', 'last_name', 'Bernard',
    'street', '25 Boulevard Gambetta', 'zip_code', '34000',
    'city', 'Montpellier', 'country', 'FR', 'phone', '+33611223344'
  ),
  JSON_OBJECT(
    'first_name', 'Emma', 'last_name', 'Bernard',
    'street', '25 Boulevard Gambetta', 'zip_code', '34000',
    'city', 'Montpellier', 'country', 'FR', 'phone', '+33611223344'
  ),
  JSON_ARRAY(
    JSON_OBJECT('product_id', 2, 'variant_id', 3, 'name', 'L''Oiseau de Papier — Édition Standard', 'quantity', 1, 'price', 27.90, 'unit_price', 27.90, 'weight', 0.50, 'length', 25, 'width', 18, 'height', 1.5)
  ),
  JSON_OBJECT(
    'payment_intent_id', 'pi_test_003',
    'shipping_method', 'home',
    'shipping_cost', 0
  ),
  DATE_SUB(@now, INTERVAL 1 HOUR)
);

-- Order 4: Marie — completed, delivered (old order with discount)
INSERT INTO `orders` (`id`, `display_id`, `customer_id`, `email`, `status`, `fulfillment_status`, `payment_status`, `total`, `currency_code`, `billing_address`, `shipping_address`, `items`, `metadata`, `createdAt`) VALUES
(4, 1004, 1, 'marie.dupont@test.com',
  'completed', 'delivered', 'captured', 38.81, 'eur',
  JSON_OBJECT(
    'first_name', 'Marie', 'last_name', 'Dupont',
    'street', '45 Avenue de l''Opéra', 'street_complement', '3ème étage',
    'zip_code', '75002', 'city', 'Paris', 'country', 'FR', 'phone', '+33612345678'
  ),
  JSON_OBJECT(
    'first_name', 'Marie', 'last_name', 'Dupont',
    'street', '45 Avenue de l''Opéra', 'street_complement', '3ème étage',
    'zip_code', '75002', 'city', 'Paris', 'country', 'FR', 'phone', '+33612345678'
  ),
  JSON_ARRAY(
    JSON_OBJECT('product_id', 2, 'variant_id', 4, 'name', 'L''Oiseau de Papier — Édition Limitée Signée', 'quantity', 1, 'price', 39.90, 'unit_price', 39.90, 'weight', 0.50, 'length', 25, 'width', 18, 'height', 1.5)
  ),
  JSON_OBJECT(
    'payment_intent_id', 'pi_test_004',
    'shipping_method', 'home',
    'shipping_cost', 4.90,
    'tracking_number', 'FR111222333',
    'discount_code', 'NOEL2025',
    'discount_amount', 5.99,
    'notes', 'Cadeau — merci d''emballer soigneusement'
  ),
  DATE_SUB(@now, INTERVAL 2 MONTH)
);

-- Order 5: Thomas — canceled, refunded
INSERT INTO `orders` (`id`, `display_id`, `customer_id`, `email`, `status`, `fulfillment_status`, `payment_status`, `total`, `currency_code`, `billing_address`, `shipping_address`, `items`, `metadata`, `createdAt`) VALUES
(5, 1005, 4, 'thomas.leroy@test.com',
  'canceled', 'canceled', 'refunded', 24.90, 'eur',
  JSON_OBJECT(
    'first_name', 'Thomas', 'last_name', 'Leroy',
    'street', '3 Place Bellecour', 'street_complement', 'Apt 12',
    'zip_code', '69002', 'city', 'Lyon', 'country', 'FR', 'phone', '+33677889900'
  ),
  JSON_OBJECT(
    'first_name', 'Thomas', 'last_name', 'Leroy',
    'street', '3 Place Bellecour', 'street_complement', 'Apt 12',
    'zip_code', '69002', 'city', 'Lyon', 'country', 'FR', 'phone', '+33677889900'
  ),
  JSON_ARRAY(
    JSON_OBJECT('product_id', 1, 'variant_id', 1, 'name', 'Le Voyage de Tsuky — Édition Standard', 'quantity', 1, 'price', 24.90, 'unit_price', 24.90, 'weight', 0.45, 'length', 25, 'width', 18, 'height', 1.5)
  ),
  JSON_OBJECT(
    'payment_intent_id', 'pi_test_005',
    'shipping_method', 'home',
    'shipping_cost', 0,
    'notes', 'Client a demandé annulation avant expédition'
  ),
  DATE_SUB(@now, INTERVAL 2 WEEK)
);

-- Order 6: Chloe — completed, delivered
INSERT INTO `orders` (`id`, `display_id`, `customer_id`, `email`, `status`, `fulfillment_status`, `payment_status`, `total`, `currency_code`, `billing_address`, `shipping_address`, `items`, `metadata`, `createdAt`) VALUES
(6, 1006, 5, 'chloe.moreau@test.com',
  'completed', 'delivered', 'captured', 64.80, 'eur',
  JSON_OBJECT(
    'first_name', 'Chloe', 'last_name', 'Moreau',
    'street', '14 Rue Sainte-Catherine', 'zip_code', '33000',
    'city', 'Bordeaux', 'country', 'FR', 'phone', '+33655443322'
  ),
  JSON_OBJECT(
    'first_name', 'Chloe', 'last_name', 'Moreau',
    'street', '14 Rue Sainte-Catherine', 'zip_code', '33000',
    'city', 'Bordeaux', 'country', 'FR', 'phone', '+33655443322'
  ),
  JSON_ARRAY(
    JSON_OBJECT('product_id', 1, 'variant_id', 2, 'name', 'Le Voyage de Tsuky — Édition Collector', 'quantity', 1, 'price', 34.90, 'unit_price', 34.90, 'weight', 0.45, 'length', 25, 'width', 18, 'height', 1.5),
    JSON_OBJECT('product_id', 2, 'variant_id', 3, 'name', 'L''Oiseau de Papier — Édition Standard', 'quantity', 1, 'price', 27.90, 'unit_price', 27.90, 'weight', 0.50, 'length', 25, 'width', 18, 'height', 1.5)
  ),
  JSON_OBJECT(
    'payment_intent_id', 'pi_test_006',
    'shipping_method', 'home',
    'shipping_cost', 4.90,
    'tracking_number', 'FR444555666',
    'total_weight', 0.95
  ),
  DATE_SUB(@now, INTERVAL 45 DAY)
);

-- Order 7: Guest order (no customer_id) — partially refunded
INSERT INTO `orders` (`id`, `display_id`, `customer_id`, `email`, `status`, `fulfillment_status`, `payment_status`, `total`, `currency_code`, `billing_address`, `shipping_address`, `items`, `metadata`, `createdAt`) VALUES
(7, 1007, NULL, 'guest.buyer@example.com',
  'completed', 'delivered', 'partially_refunded', 29.80, 'eur',
  JSON_OBJECT(
    'first_name', 'Sophie', 'last_name', 'Durand',
    'street', '99 Rue du Faubourg Saint-Antoine', 'zip_code', '75011',
    'city', 'Paris', 'country', 'FR', 'phone', '+33699887766'
  ),
  JSON_OBJECT(
    'first_name', 'Sophie', 'last_name', 'Durand',
    'street', '99 Rue du Faubourg Saint-Antoine', 'zip_code', '75011',
    'city', 'Paris', 'country', 'FR', 'phone', '+33699887766'
  ),
  JSON_ARRAY(
    JSON_OBJECT('product_id', 1, 'variant_id', 1, 'name', 'Le Voyage de Tsuky — Édition Standard', 'quantity', 1, 'price', 24.90, 'unit_price', 24.90, 'weight', 0.45, 'length', 25, 'width', 18, 'height', 1.5)
  ),
  JSON_OBJECT(
    'payment_intent_id', 'pi_test_007',
    'shipping_method', 'home',
    'shipping_cost', 4.90,
    'tracking_number', 'FR333444555',
    'notes', 'Livre arrivé abîmé — remboursement partiel de 12.00 EUR'
  ),
  DATE_SUB(@now, INTERVAL 1 MONTH)
);

-- Order 8: Thomas — preorder, pending fulfillment
INSERT INTO `orders` (`id`, `display_id`, `customer_id`, `email`, `status`, `fulfillment_status`, `payment_status`, `total`, `currency_code`, `billing_address`, `shipping_address`, `items`, `metadata`, `createdAt`) VALUES
(8, 1008, 4, 'thomas.leroy@test.com',
  'pending', 'not_fulfilled', 'captured', 44.80, 'eur',
  JSON_OBJECT(
    'first_name', 'Thomas', 'last_name', 'Leroy',
    'street', '3 Place Bellecour', 'street_complement', 'Apt 12',
    'zip_code', '69002', 'city', 'Lyon', 'country', 'FR', 'phone', '+33677889900'
  ),
  JSON_OBJECT(
    'first_name', 'Thomas', 'last_name', 'Leroy',
    'street', '3 Place Bellecour', 'street_complement', 'Apt 12',
    'zip_code', '69002', 'city', 'Lyon', 'country', 'FR', 'phone', '+33677889900'
  ),
  JSON_ARRAY(
    JSON_OBJECT('product_id', 2, 'variant_id', 4, 'name', 'L''Oiseau de Papier — Édition Limitée Signée', 'quantity', 1, 'price', 39.90, 'unit_price', 39.90, 'weight', 0.50, 'length', 25, 'width', 18, 'height', 1.5)
  ),
  JSON_OBJECT(
    'payment_intent_id', 'pi_test_008',
    'shipping_method', 'home',
    'shipping_cost', 4.90,
    'notes', 'Précommande — expédition prévue mars 2026'
  ),
  DATE_SUB(@now, INTERVAL 5 DAY)
);

-- Order 9: Marie — subscription order, delivered
INSERT INTO `orders` (`id`, `display_id`, `customer_id`, `email`, `status`, `fulfillment_status`, `payment_status`, `total`, `currency_code`, `billing_address`, `shipping_address`, `items`, `metadata`, `createdAt`) VALUES
(9, 1009, 1, 'marie.dupont@test.com',
  'completed', 'delivered', 'captured', 29.80, 'eur',
  JSON_OBJECT(
    'first_name', 'Marie', 'last_name', 'Dupont',
    'street', '12 Rue de Rivoli', 'zip_code', '75001',
    'city', 'Paris', 'country', 'FR', 'phone', '+33612345678'
  ),
  JSON_OBJECT(
    'first_name', 'Marie', 'last_name', 'Dupont',
    'street', '12 Rue de Rivoli', 'zip_code', '75001',
    'city', 'Paris', 'country', 'FR', 'phone', '+33612345678'
  ),
  JSON_ARRAY(
    JSON_OBJECT('product_id', 1, 'variant_id', 1, 'name', 'Le Voyage de Tsuky — Édition Standard', 'quantity', 1, 'price', 24.90, 'unit_price', 24.90, 'weight', 0.45, 'length', 25, 'width', 18, 'height', 1.5)
  ),
  JSON_OBJECT(
    'payment_intent_id', 'pi_test_009',
    'stripe_subscription_id', 'sub_test_marie_001',
    'subscription', true,
    'shipping_method', 'home',
    'shipping_cost', 4.90,
    'tracking_number', 'FR777888999',
    'total_weight', 0.45
  ),
  DATE_SUB(@now, INTERVAL 3 MONTH)
);

-- ============================================================
-- Carts
-- ============================================================
INSERT INTO `carts` (`id`, `customer_id`, `email`, `items`, `context`, `completed_at`, `createdAt`) VALUES
-- Active cart: Chloe browsing
('cart-test-001', 5, 'chloe.moreau@test.com',
  JSON_ARRAY(
    JSON_OBJECT('variant_id', 1, 'quantity', 1),
    JSON_OBJECT('variant_id', 3, 'quantity', 2)
  ),
  JSON_OBJECT(),
  NULL,
  DATE_SUB(@now, INTERVAL 2 HOUR)
),
-- Active cart: anonymous visitor
('cart-test-002', NULL, NULL,
  JSON_ARRAY(
    JSON_OBJECT('variant_id', 1, 'quantity', 1)
  ),
  JSON_OBJECT(),
  NULL,
  DATE_SUB(@now, INTERVAL 30 MINUTE)
),
-- Active cart with discount applied
('cart-test-003', 4, 'thomas.leroy@test.com',
  JSON_ARRAY(
    JSON_OBJECT('variant_id', 2, 'quantity', 1),
    JSON_OBJECT('variant_id', 4, 'quantity', 1)
  ),
  JSON_OBJECT(
    'discount_code', 'BIENVENUE10',
    'discount_amount', 7.48,
    'discount_rule', JSON_OBJECT('type', 'percentage', 'value', 10)
  ),
  NULL,
  DATE_SUB(@now, INTERVAL 15 MINUTE)
),
-- Completed cart (Marie's old order)
('cart-test-004', 1, 'marie.dupont@test.com',
  JSON_ARRAY(
    JSON_OBJECT('variant_id', 1, 'quantity', 1),
    JSON_OBJECT('variant_id', 2, 'quantity', 1)
  ),
  JSON_OBJECT('discount_code', 'BIENVENUE10', 'discount_amount', 5.98),
  DATE_SUB(@now, INTERVAL 5 MONTH),
  DATE_SUB(@now, INTERVAL 5 MONTH)
);

-- ============================================================
-- Contact Messages
-- ============================================================
INSERT INTO `contact_messages` (`name`, `email`, `subject`, `message`, `status`, `createdAt`) VALUES
('Marie Dupont', 'marie.dupont@test.com',
  'Question sur ma commande TSK-1001',
  'Bonjour,\n\nJe souhaiterais savoir si ma commande TSK-1001 a bien été expédiée. Je n''ai pas encore reçu de numéro de suivi.\n\nMerci d''avance,\nMarie',
  'replied', DATE_SUB(@now, INTERVAL 4 MONTH)
),
('Lucas Martin', 'lucas.martin@test.com',
  'Disponibilité édition collector',
  'Bonjour,\n\nJ''aimerais savoir si l''édition collector du Voyage de Tsuky sera de nouveau disponible prochainement ?\n\nCordialement,\nLucas',
  'read', DATE_SUB(@now, INTERVAL 2 MONTH)
),
('Sophie Durand', 'sophie.durand@example.com',
  'Partenariat librairie indépendante',
  'Bonjour l''équipe Tsuky Tales,\n\nJe suis gérante d''une librairie indépendante à Toulouse et je serais intéressée par la vente de vos ouvrages dans ma boutique.\n\nPourriez-vous me communiquer vos conditions de distribution ?\n\nCordialement,\nSophie Durand\nLibrairie Les Mots Enchantés',
  'unread', DATE_SUB(@now, INTERVAL 3 DAY)
),
('Antoine Petit', 'antoine.petit@test.com',
  'Problème avec le paiement',
  'Bonjour,\n\nJ''ai essayé de passer une commande mais le paiement a été refusé alors que ma carte fonctionne très bien par ailleurs. Pouvez-vous m''aider ?\n\nMerci,\nAntoine',
  'unread', DATE_SUB(@now, INTERVAL 1 DAY)
),
('Emma Bernard', 'emma.bernard@test.com',
  'Résiliation abonnement box littéraire',
  'Bonjour,\n\nJe souhaiterais résilier mon abonnement à la box littéraire à partir du prochain trimestre. Pourriez-vous me confirmer la procédure ?\n\nMerci,\nEmma',
  'read', DATE_SUB(@now, INTERVAL 1 MONTH)
);

-- ============================================================
-- Settings
-- ============================================================
INSERT INTO `settings` (`key`, `value`) VALUES
('subscription_dates', '["2026-04-01","2026-07-01","2026-10-01","2027-01-01"]')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);
