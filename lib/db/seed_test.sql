-- Tsuky Tales — Test Seed Data
-- Run with: mysql -u root tsukytales < lib/db/seed_test.sql
-- All customer passwords: Test1234!
-- Admin password: admin (already in schema.sql)

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET @now = NOW();

-- ============================================================
-- Customers (password = bcrypt hash of "Test1234!")
-- ============================================================
SET @pwd = '$2b$10$OQFg4U4mulizO6vwiiSJ8eMIZ7SKWDFKD1M6QP.MPgr.voygSK7Ou';

INSERT INTO `customers` (`id`, `first_name`, `last_name`, `email`, `password`, `has_account`, `metadata`, `preferences`, `createdAt`) VALUES
(1, 'Marie', 'Dupont', 'marie.dupont@test.com', @pwd, 1,
  JSON_OBJECT(
    'stripe_customer_id', 'cus_test_marie_001',
    'address', '12 Rue de Rivoli',
    'zip_code', '75001',
    'city', 'Paris',
    'phone', '+33612345678'
  ),
  JSON_OBJECT(
    'literary_genres', JSON_ARRAY('fantasy', 'conte', 'jeunesse'),
    'favorite_authors', JSON_ARRAY('Miyazaki', 'Saint-Exupery'),
    'reading_pace', 'normal'
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
  JSON_OBJECT(
    'literary_genres', JSON_ARRAY('aventure', 'science-fiction'),
    'favorite_authors', JSON_ARRAY('Tolkien'),
    'reading_pace', 'rapide'
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
  JSON_OBJECT(
    'literary_genres', JSON_ARRAY('romance', 'fantasy', 'poesie'),
    'favorite_authors', JSON_ARRAY('Rowling', 'Laclos'),
    'reading_pace', 'lent'
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
  NULL,
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
  JSON_OBJECT(
    'literary_genres', JSON_ARRAY('conte', 'jeunesse', 'fantasy'),
    'favorite_authors', JSON_ARRAY('Miyazaki', 'Ende'),
    'reading_pace', 'normal'
  ),
  DATE_SUB(@now, INTERVAL 10 MONTH)
),
(6, 'Antoine', 'Petit', 'antoine.petit@test.com', @pwd, 0,
  NULL, NULL,
  DATE_SUB(@now, INTERVAL 1 MONTH)
);

-- ============================================================
-- Addresses
-- ============================================================
INSERT INTO `addresses` (`customer_id`, `label`, `first_name`, `last_name`, `street`, `street_complement`, `zip_code`, `city`, `country`, `phone`, `is_default`) VALUES
-- Marie: 2 addresses
(1, 'Maison',   'Marie', 'Dupont', '12 Rue de Rivoli', NULL, '75001', 'Paris', 'FR', '+33612345678', 1),
(1, 'Travail',  'Marie', 'Dupont', '45 Avenue de l''Opera', '3eme etage', '75002', 'Paris', 'FR', '+33612345678', 0),
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
INSERT INTO `products` (`id`, `name`, `slug`, `description`, `price`, `stock`, `image`, `is_preorder`, `weight`, `length`, `width`, `height`, `is_subscription`, `subscription_price`, `subscription_dates`, `createdAt`) VALUES
-- Regular illustrated books
(1,
  'Le Voyage de Tsuky',
  'le-voyage-de-tsuky',
  'Plongez dans l''univers poetique de Tsuky, un petit renard curieux qui part a la decouverte du monde. Un livre illustre de 48 pages en couleur, relie avec soin.',
  24.90, 50,
  'assets/img/products/voyage-de-tsuky.jpg',
  0, 0.45, 25.00, 18.00, 1.50,
  0, NULL, NULL,
  DATE_SUB(@now, INTERVAL 12 MONTH)
),
(2,
  'Les Contes de la Foret Enchantee',
  'contes-foret-enchantee',
  'Recueil de cinq contes illustres mettant en scene les creatures magiques de la Foret Enchantee. Illustrations originales a l''aquarelle.',
  29.90, 35,
  'assets/img/products/foret-enchantee.jpg',
  0, 0.55, 25.00, 18.00, 2.00,
  0, NULL, NULL,
  DATE_SUB(@now, INTERVAL 9 MONTH)
),
(3,
  'Lumiere d''Etoiles',
  'lumiere-etoiles',
  'L''histoire de Hana, une petite fille qui apprend a apprivoiser la nuit. Un conte delicat accompagne d''illustrations en clair-obscur.',
  22.90, 20,
  'assets/img/products/lumiere-etoiles.jpg',
  0, 0.40, 24.00, 17.00, 1.20,
  0, NULL, NULL,
  DATE_SUB(@now, INTERVAL 5 MONTH)
),
(4,
  'Le Secret du Jardin Celeste',
  'secret-jardin-celeste',
  'Quand Mei decouvre un jardin cache dans les nuages, elle y rencontre des fleurs qui racontent des histoires. Album grand format, couverture rigide.',
  34.90, 15,
  'assets/img/products/jardin-celeste.jpg',
  0, 0.70, 30.00, 22.00, 1.80,
  0, NULL, NULL,
  DATE_SUB(@now, INTERVAL 3 MONTH)
),
-- Preorder
(5,
  'L''Oiseau de Papier',
  'oiseau-de-papier',
  'Le prochain album de Tsuky Tales ! Un conte sur la fragilite et la beaute des reves. Sortie prevue printemps 2026. Edition limitee avec ex-libris signe.',
  27.90, 0,
  'assets/img/products/oiseau-papier.jpg',
  1, 0.50, 25.00, 18.00, 1.50,
  0, NULL, NULL,
  DATE_SUB(@now, INTERVAL 1 MONTH)
),
-- Subscription box
(6,
  'Box Litteraire Tsuky Tales',
  'box-litteraire-tsuky',
  'Chaque trimestre, recevez une box contenant un livre illustre inedit, une carte postale d''art, un marque-page et des surprises. Livraison incluse.',
  39.90, 100,
  'assets/img/products/box-litteraire.jpg',
  0, 1.00, 30.00, 22.00, 8.00,
  1, 34.90,
  JSON_ARRAY('2026-03-15', '2026-06-15', '2026-09-15', '2026-12-15'),
  DATE_SUB(@now, INTERVAL 11 MONTH)
),
-- Accessory / small item
(7,
  'Lot de 5 Cartes Postales Illustrees',
  'cartes-postales-illustrees',
  'Cinq cartes postales reproduisant les illustrations iconiques de l''univers Tsuky Tales. Papier 300g, format A6.',
  12.90, 80,
  'assets/img/products/cartes-postales.jpg',
  0, 0.10, 15.00, 11.00, 0.50,
  0, NULL, NULL,
  DATE_SUB(@now, INTERVAL 7 MONTH)
),
(8,
  'Affiche Le Voyage de Tsuky — A3',
  'affiche-voyage-tsuky-a3',
  'Reproduction d''art en edition limitee. Impression giclée sur papier fine art 250g, format A3 (29.7 x 42 cm).',
  19.90, 40,
  'assets/img/products/affiche-tsuky-a3.jpg',
  0, 0.15, 42.00, 30.00, 2.00,
  0, NULL, NULL,
  DATE_SUB(@now, INTERVAL 6 MONTH)
);

-- ============================================================
-- Product Variants
-- ============================================================
INSERT INTO `product_variants` (`id`, `product_id`, `title`, `sku`, `inventory_quantity`, `price`) VALUES
-- Le Voyage de Tsuky
(1, 1, 'Edition Standard', 'TSUKY-VOY-STD', 40, 24.90),
(2, 1, 'Edition Collector', 'TSUKY-VOY-COL', 10, 34.90),
-- Les Contes de la Foret Enchantee
(3, 2, 'Edition Standard', 'TSUKY-FOR-STD', 30, 29.90),
(4, 2, 'Edition Numerotee', 'TSUKY-FOR-NUM', 5, 44.90),
-- Lumiere d'Etoiles
(5, 3, 'Edition Standard', 'TSUKY-LUM-STD', 20, 22.90),
-- Le Secret du Jardin Celeste
(6, 4, 'Edition Standard', 'TSUKY-JAR-STD', 12, 34.90),
(7, 4, 'Edition Prestige', 'TSUKY-JAR-PRE', 3, 54.90),
-- L'Oiseau de Papier (preorder)
(8, 5, 'Edition Standard', 'TSUKY-OIS-STD', 0, 27.90),
(9, 5, 'Edition Limitee Signee', 'TSUKY-OIS-LIM', 0, 39.90),
-- Box Litteraire
(10, 6, 'Abonnement Trimestriel', 'TSUKY-BOX-TRI', 100, 39.90),
-- Cartes Postales
(11, 7, 'Lot de 5', 'TSUKY-CP-5', 80, 12.90),
-- Affiche
(12, 8, 'A3 — Sans cadre', 'TSUKY-AFF-A3', 40, 19.90);

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

-- Order 1: Marie — completed, delivered
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
    JSON_OBJECT('product_id', 1, 'variant_id', 1, 'name', 'Le Voyage de Tsuky — Edition Standard', 'quantity', 1, 'price', 24.90, 'unit_price', 24.90, 'weight', 0.45, 'length', 25, 'width', 18, 'height', 1.5),
    JSON_OBJECT('product_id', 2, 'variant_id', 3, 'name', 'Les Contes de la Foret Enchantee — Edition Standard', 'quantity', 1, 'price', 29.90, 'unit_price', 29.90, 'weight', 0.55, 'length', 25, 'width', 18, 'height', 2)
  ),
  JSON_OBJECT(
    'payment_intent_id', 'pi_test_001',
    'shipping_method', 'home',
    'shipping_cost', 4.90,
    'tracking_number', 'FR123456789',
    'total_weight', 1.00,
    'discount_code', 'BIENVENUE10',
    'discount_amount', 5.48
  ),
  DATE_SUB(@now, INTERVAL 5 MONTH)
);

-- Order 2: Lucas — completed, shipped (in transit)
INSERT INTO `orders` (`id`, `display_id`, `customer_id`, `email`, `status`, `fulfillment_status`, `payment_status`, `total`, `currency_code`, `billing_address`, `shipping_address`, `items`, `metadata`, `createdAt`) VALUES
(2, 1002, 2, 'lucas.martin@test.com',
  'completed', 'shipped', 'captured', 39.80, 'eur',
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
    JSON_OBJECT('product_id', 4, 'variant_id', 6, 'name', 'Le Secret du Jardin Celeste — Edition Standard', 'quantity', 1, 'price', 34.90, 'unit_price', 34.90, 'weight', 0.70, 'length', 30, 'width', 22, 'height', 1.8)
  ),
  JSON_OBJECT(
    'payment_intent_id', 'pi_test_002',
    'shipping_method', 'relay',
    'shipping_cost', 4.90,
    'tracking_number', 'FR987654321',
    'shipping_order_id', 'boxtal_test_002',
    'total_weight', 0.70
  ),
  DATE_SUB(@now, INTERVAL 3 DAY)
);

-- Order 3: Emma — pending payment
INSERT INTO `orders` (`id`, `display_id`, `customer_id`, `email`, `status`, `fulfillment_status`, `payment_status`, `total`, `currency_code`, `billing_address`, `shipping_address`, `items`, `metadata`, `createdAt`) VALUES
(3, 1003, 3, 'emma.bernard@test.com',
  'pending', 'not_fulfilled', 'awaiting', 22.90, 'eur',
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
    JSON_OBJECT('product_id', 3, 'variant_id', 5, 'name', 'Lumiere d''Etoiles — Edition Standard', 'quantity', 1, 'price', 22.90, 'unit_price', 22.90, 'weight', 0.40, 'length', 24, 'width', 17, 'height', 1.2)
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
  'completed', 'delivered', 'captured', 47.70, 'eur',
  JSON_OBJECT(
    'first_name', 'Marie', 'last_name', 'Dupont',
    'street', '45 Avenue de l''Opera', 'street_complement', '3eme etage',
    'zip_code', '75002', 'city', 'Paris', 'country', 'FR', 'phone', '+33612345678'
  ),
  JSON_OBJECT(
    'first_name', 'Marie', 'last_name', 'Dupont',
    'street', '45 Avenue de l''Opera', 'street_complement', '3eme etage',
    'zip_code', '75002', 'city', 'Paris', 'country', 'FR', 'phone', '+33612345678'
  ),
  JSON_ARRAY(
    JSON_OBJECT('product_id', 4, 'variant_id', 7, 'name', 'Le Secret du Jardin Celeste — Edition Prestige', 'quantity', 1, 'price', 54.90, 'unit_price', 54.90, 'weight', 0.70, 'length', 30, 'width', 22, 'height', 1.8)
  ),
  JSON_OBJECT(
    'payment_intent_id', 'pi_test_004',
    'shipping_method', 'home',
    'shipping_cost', 4.90,
    'tracking_number', 'FR111222333',
    'discount_code', 'NOEL2025',
    'discount_amount', 8.24,
    'notes', 'Cadeau — merci d''emballer soigneusement'
  ),
  DATE_SUB(@now, INTERVAL 2 MONTH)
);

-- Order 5: Chloe — subscription order
INSERT INTO `orders` (`id`, `display_id`, `customer_id`, `email`, `status`, `fulfillment_status`, `payment_status`, `total`, `currency_code`, `billing_address`, `shipping_address`, `items`, `metadata`, `createdAt`) VALUES
(5, 1005, 5, 'chloe.moreau@test.com',
  'completed', 'fulfilled', 'captured', 34.90, 'eur',
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
    JSON_OBJECT('product_id', 6, 'variant_id', 10, 'name', 'Box Litteraire Tsuky Tales — Abonnement Trimestriel', 'quantity', 1, 'price', 34.90, 'unit_price', 34.90, 'weight', 1.00, 'length', 30, 'width', 22, 'height', 8)
  ),
  JSON_OBJECT(
    'payment_method', 'subscription',
    'shipping_method', 'home',
    'shipping_cost', 0,
    'shipping_country', 'FR',
    'stripe_invoice_id', 'in_test_chloe_001',
    'stripe_subscription_id', 'sub_test_chloe_001',
    'subscription', TRUE,
    'tracking_number', 'FR444555666'
  ),
  DATE_SUB(@now, INTERVAL 45 DAY)
);

-- Order 6: Thomas — canceled, refunded
INSERT INTO `orders` (`id`, `display_id`, `customer_id`, `email`, `status`, `fulfillment_status`, `payment_status`, `total`, `currency_code`, `billing_address`, `shipping_address`, `items`, `metadata`, `createdAt`) VALUES
(6, 1006, 4, 'thomas.leroy@test.com',
  'canceled', 'canceled', 'refunded', 12.90, 'eur',
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
    JSON_OBJECT('product_id', 7, 'variant_id', 11, 'name', 'Lot de 5 Cartes Postales Illustrees', 'quantity', 1, 'price', 12.90, 'unit_price', 12.90, 'weight', 0.10, 'length', 15, 'width', 11, 'height', 0.5)
  ),
  JSON_OBJECT(
    'payment_intent_id', 'pi_test_006',
    'shipping_method', 'home',
    'shipping_cost', 0,
    'notes', 'Client a demande annulation avant expedition'
  ),
  DATE_SUB(@now, INTERVAL 2 WEEK)
);

-- Order 7: Emma — subscription order, delivered
INSERT INTO `orders` (`id`, `display_id`, `customer_id`, `email`, `status`, `fulfillment_status`, `payment_status`, `total`, `currency_code`, `billing_address`, `shipping_address`, `items`, `metadata`, `createdAt`) VALUES
(7, 1007, 3, 'emma.bernard@test.com',
  'completed', 'delivered', 'captured', 34.90, 'eur',
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
    JSON_OBJECT('product_id', 6, 'variant_id', 10, 'name', 'Box Litteraire Tsuky Tales — Abonnement Trimestriel', 'quantity', 1, 'price', 34.90, 'unit_price', 34.90, 'weight', 1.00, 'length', 30, 'width', 22, 'height', 8)
  ),
  JSON_OBJECT(
    'payment_method', 'subscription',
    'shipping_method', 'home',
    'shipping_cost', 0,
    'stripe_invoice_id', 'in_test_emma_001',
    'stripe_subscription_id', 'sub_test_emma_001',
    'subscription', TRUE,
    'tracking_number', 'FR777888999'
  ),
  DATE_SUB(@now, INTERVAL 3 MONTH)
);

-- Order 8: Lucas — completed, delivered (big order with multiple items)
INSERT INTO `orders` (`id`, `display_id`, `customer_id`, `email`, `status`, `fulfillment_status`, `payment_status`, `total`, `currency_code`, `billing_address`, `shipping_address`, `items`, `metadata`, `createdAt`) VALUES
(8, 1008, 2, 'lucas.martin@test.com',
  'completed', 'delivered', 'captured', 82.60, 'eur',
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
    JSON_OBJECT('product_id', 1, 'variant_id', 2, 'name', 'Le Voyage de Tsuky — Edition Collector', 'quantity', 1, 'price', 34.90, 'unit_price', 34.90, 'weight', 0.45, 'length', 25, 'width', 18, 'height', 1.5),
    JSON_OBJECT('product_id', 3, 'variant_id', 5, 'name', 'Lumiere d''Etoiles — Edition Standard', 'quantity', 1, 'price', 22.90, 'unit_price', 22.90, 'weight', 0.40, 'length', 24, 'width', 17, 'height', 1.2),
    JSON_OBJECT('product_id', 8, 'variant_id', 12, 'name', 'Affiche Le Voyage de Tsuky — A3', 'quantity', 1, 'price', 19.90, 'unit_price', 19.90, 'weight', 0.15, 'length', 42, 'width', 30, 'height', 2)
  ),
  JSON_OBJECT(
    'payment_intent_id', 'pi_test_008',
    'shipping_method', 'home',
    'shipping_cost', 4.90,
    'tracking_number', 'FR000111222',
    'total_weight', 1.00
  ),
  DATE_SUB(@now, INTERVAL 6 WEEK)
);

-- Order 9: Guest order (no customer_id) — partially refunded
INSERT INTO `orders` (`id`, `display_id`, `customer_id`, `email`, `status`, `fulfillment_status`, `payment_status`, `total`, `currency_code`, `billing_address`, `shipping_address`, `items`, `metadata`, `createdAt`) VALUES
(9, 1009, NULL, 'guest.buyer@example.com',
  'completed', 'delivered', 'partially_refunded', 49.80, 'eur',
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
    JSON_OBJECT('product_id', 2, 'variant_id', 3, 'name', 'Les Contes de la Foret Enchantee — Edition Standard', 'quantity', 1, 'price', 29.90, 'unit_price', 29.90, 'weight', 0.55, 'length', 25, 'width', 18, 'height', 2),
    JSON_OBJECT('product_id', 8, 'variant_id', 12, 'name', 'Affiche Le Voyage de Tsuky — A3', 'quantity', 1, 'price', 19.90, 'unit_price', 19.90, 'weight', 0.15, 'length', 42, 'width', 30, 'height', 2)
  ),
  JSON_OBJECT(
    'payment_intent_id', 'pi_test_009',
    'shipping_method', 'home',
    'shipping_cost', 4.90,
    'tracking_number', 'FR333444555',
    'notes', 'Affiche arrivee abimee — remboursement partiel de 19.90 EUR'
  ),
  DATE_SUB(@now, INTERVAL 1 MONTH)
);

-- Order 10: Thomas — preorder, pending fulfillment
INSERT INTO `orders` (`id`, `display_id`, `customer_id`, `email`, `status`, `fulfillment_status`, `payment_status`, `total`, `currency_code`, `billing_address`, `shipping_address`, `items`, `metadata`, `createdAt`) VALUES
(10, 1010, 4, 'thomas.leroy@test.com',
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
    JSON_OBJECT('product_id', 5, 'variant_id', 9, 'name', 'L''Oiseau de Papier — Edition Limitee Signee', 'quantity', 1, 'price', 39.90, 'unit_price', 39.90, 'weight', 0.50, 'length', 25, 'width', 18, 'height', 1.5)
  ),
  JSON_OBJECT(
    'payment_intent_id', 'pi_test_010',
    'shipping_method', 'home',
    'shipping_cost', 4.90,
    'notes', 'Precommande — expedition prevue mars 2026'
  ),
  DATE_SUB(@now, INTERVAL 5 DAY)
);

-- ============================================================
-- Carts
-- ============================================================
INSERT INTO `carts` (`id`, `customer_id`, `email`, `items`, `context`, `completed_at`, `createdAt`) VALUES
-- Active cart: Chloe browsing
('cart-test-001', 5, 'chloe.moreau@test.com',
  JSON_ARRAY(
    JSON_OBJECT('variant_id', 5, 'quantity', 1),
    JSON_OBJECT('variant_id', 11, 'quantity', 2)
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
    JSON_OBJECT('variant_id', 12, 'quantity', 1)
  ),
  JSON_OBJECT(
    'discount_code', 'BIENVENUE10',
    'discount_amount', 5.48,
    'discount_rule', JSON_OBJECT('type', 'percentage', 'value', 10)
  ),
  NULL,
  DATE_SUB(@now, INTERVAL 15 MINUTE)
),
-- Completed cart (Marie's old order)
('cart-test-004', 1, 'marie.dupont@test.com',
  JSON_ARRAY(
    JSON_OBJECT('variant_id', 1, 'quantity', 1),
    JSON_OBJECT('variant_id', 3, 'quantity', 1)
  ),
  JSON_OBJECT('discount_code', 'BIENVENUE10', 'discount_amount', 5.48),
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
