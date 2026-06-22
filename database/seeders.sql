-- DUMP DATA AWAL INTEGRASI KATALOG UNGGULAN PRODUK --

INSERT INTO `categories` (`id`, `name`, `slug`) VALUES
(1, 'Tenda', 'tenda-camping'),
(2, 'Carrier', 'tas-carrier-gunung'),
(3, 'Gear', 'peripherals-mendaki');

INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `stock`, `weight`) VALUES
-- Kategori Tenda --
(1, 1, 'Tenda Great Outdoor Borneo 4 Pro All Black', 'tenda-go-borneo-4pro', 'Kapasitas nyaman untuk 4-5 orang dengan material kain ripstop poliester tahan terpaan badai ekstrem tingkat tinggi.', 75000.00, 12, 4300),
(2, 1, 'Tenda Bigadventure Rinjani 2P Light', 'tenda-bigadventure-rinjani-2p', 'Tenda ultra-lightweight khusus pendakian cepat berkapasitas 2 orang dengan ketahanan air PU 4000mm.', 125000.00, 8, 2100),

-- Kategori Carrier --
(3, 2, 'Tas Carrier Kilimanjaro Alpha Backpack 50L', 'carrier-kilimanjaro-alpha-50l', 'Dilengkapi sistem sirkulasi udara Air Backsystem premium dengan balutan material Nylon Dolby anti gores batu cadas.', 50000.00, 15, 1400),
(4, 2, 'Tas Carrier Rei Toba 60L Trekking Series', 'carrier-rei-toba-60l', 'Tas carrier kapasitas besar dengan kerangka frame support kokoh, ideal untuk pendakian ekspedisi panjang di atas 3 hari.', 65000.00, 20, 1850),

-- Kategori Gear Peripherals --
(5, 3, 'Matras Lipat Outfrai 3 Layer Thermal Insulation', 'matras-lipat-outfrai-3layer', 'Matras lipat dengan lapisan perak thermal penahan dingin tanah basah gunung yang sangat empuk dan nyaman.', 30000.00, 40, 400),
(6, 3, 'Headlamp LED TaffLED Multifunction Outdoor 3xAAA', 'headlamp-led-taffled-multifungsi', 'Senter kepala LED super terang anti air IPX6 dengan berbagai mode pencahayaan untuk memandu jalur malam hari.', 25000.00, 50, 150);

INSERT INTO `product_images` (`product_id`, `image_url`, `is_primary`) VALUES
(1, 'images/Tenda/4.jpg', 1),
(2, 'images/Tenda/2.jpg', 1),
(3, 'images/Carrier/10020.jpg', 1),
(4, 'images/Carrier/10049.jpg', 1),
(5, 'images/Pheriperals/h.jpg', 1),
(6, 'images/Pheriperals/m.jpg', 1);