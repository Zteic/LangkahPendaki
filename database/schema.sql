-- SUPLЕMEN EKSTENSI TABEL PREMIUM (CONFORMS TO 3NF) --
-- Eksekusi kode SQL ini di bawah file schema.sql asli Anda --

-- 1. Tabel Log Pencarian Pintar (Instant History Search)
CREATE TABLE `search_histories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `keyword` VARCHAR(150) NOT NULL,
  `searched_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. Tabel Wishlist / Favorit Alat Gunung (Micro-Interactions)
CREATE TABLE `wishlists` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_user_wishlist` (`user_id`, `product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 3. Tabel Kupon Potongan Diskon Dinamis (Checkout Layer)
CREATE TABLE `coupons` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `discount_type` ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
  `discount_value` DECIMAL(10,2) NOT NULL,
  `max_discount` DECIMAL(10,2) DEFAULT NULL,
  `min_order_amount` DECIMAL(10,2) DEFAULT 0.00,
  `expired_at` DATE NOT NULL,
  `is_active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 4. Tabel Log Kalkulasi Denda Keterlambatan Pengembalian Alat
CREATE TABLE `rental_late_fees` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL UNIQUE,
  `late_days` INT NOT NULL DEFAULT 0,
  `fee_per_day` DECIMAL(10,2) NOT NULL,
  `total_late_fee` DECIMAL(10,2) NOT NULL,
  `is_paid` TINYINT(1) DEFAULT 0,
  FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;