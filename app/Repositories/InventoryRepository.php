<?php
namespace App\Repositories;
use App\Config\Database;

class InventoryRepository {
    private $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    /**
     * LANGKAH 1: Mengambil Data Ringkasan Agregasi KPI Global (Bahasa Indonesia)
     * Menggabungkan total produk dari tabel master dan sirkulasi status unit fisik.
     */
    public function getGlobalKpiMetricsData() {
        $query = "SELECT 
                    (SELECT SUM(stock) FROM `products`) as total_unit,
                    (SELECT COUNT(*) FROM `product_units` WHERE `status` = 'Available') as total_siap,
                    (SELECT COUNT(*) FROM `product_units` WHERE `status` = 'Rented') as total_disewa,
                    (SELECT COUNT(*) FROM `product_units` WHERE `status` = 'Maintenance') as total_perawatan,
                    (SELECT COUNT(*) FROM `product_units` WHERE `status` IN ('Lost', 'Damaged')) as total_rusak,
                    (SELECT COUNT(*) FROM `products` WHERE `stock` <= `minimum_stock`) as total_hampir_habis";
                  
        $statement = $this->db->prepare($query);
        $statement->execute();
        return $statement->fetch(\PDO::FETCH_ASSOC);
    }

    /**
     * LANGKAH 2 & 3: Mengambil Data Produk dengan Foto Utama untuk Kriteria Hybrid Card & Smart Search
     * Mendukung multi-filter asinkron gabungan (Kata Kunci, Kategori, Status ENUM).
     */
    public function getAdvancedFilteredInventory($kataKunci = '', $statusFilter = 'Semua', $kategoriFilter = 'Semua') {
        $query = "SELECT 
                    p.id as produk_id,
                    p.name as nama_produk,
                    c.name as nama_kategori,
                    p.price as harga_sewa,
                    p.stock as total_stok,
                    p.minimum_stock as batas_minimum,
                    pi.image_url as foto_unit,
                    pu.serial_number as nomor_serial,
                    pu.qr_code as kode_qr,
                    pu.status as status_unit,
                    pu.condition as kondisi_fisik
                  FROM `products` p
                  LEFT JOIN `categories` c ON p.category_id = c.id
                  LEFT JOIN `product_images` pi ON p.id = pi.product_id AND pi.is_primary = 1
                  LEFT JOIN `product_units` pu ON p.id = pu.product_id
                  WHERE 1=1";
        
        $params = [];

        if (!empty($kataKunci)) {
            $query .= " AND (p.name LIKE :search 
                        OR c.name LIKE :search 
                        OR pu.qr_code LIKE :search 
                        OR pu.serial_number LIKE :search)";
            $params['search'] = '%' . $kataKunci . '%';
        }

        if ($statusFilter !== 'Semua') {
            $query .= " AND pu.status = :status";
            $params['status'] = $statusFilter;
        }

        if ($kategoriFilter !== 'Semua') {
            $query .= " AND c.name = :category";
            $params['category'] = $kategoriFilter;
        }

        $query .= " ORDER BY p.id DESC";
        
        $statement = $this->db->prepare($query);
        $statement->execute($params);
        return $statement->fetchAll(\PDO::FETCH_ASSOC);
    }

    /**
     * LANGKAH 6: Memastikan dan Mengambil QR Code Unit Fisik Terkecil
     * Jika unit belum terdaftar (stok baru masuk), sitem akan otomatis meng-generate nomor serial dan QR Code baru.
     */
    public function ensureAndGetProductUnitQr($productId) {
        $checkQuery = "SELECT * FROM `product_units` WHERE `product_id` = :product_id LIMIT 1";
        $stmt = $this->db->prepare($checkQuery);
        $stmt->execute(['product_id' => $productId]);
        $unit = $stmt->fetch(\PDO::FETCH_ASSOC);

        if ($unit) {
            return $unit;
        }

        $productQuery = "SELECT name, slug FROM `products` WHERE `id` = :id";
        $pStmt = $this->db->prepare($productQuery);
        $pStmt->execute(['id' => $productId]);
        $product = $pStmt->fetch(\PDO::FETCH_ASSOC);

        $serialNumber = "SN-" . strtoupper(substr($product['slug'], 0, 3)) . "-" . str_pad($productId, 4, '0', STR_PAD_LEFT);
        $qrCodeData = "LangkahPendaki-Asset-ID-" . $productId . "-" . $serialNumber;
        
        $insertQuery = "INSERT INTO `product_units` 
                        (`product_id`, `qr_code`, `serial_number`, `status`, `condition`, `purchase_date`, `created_at`, `updated_at`) 
                        VALUES 
                        (:product_id, :qr_code, :serial_number, 'Available', 'Sangat Baik', '2026-06-14', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)";
        
        $iStmt = $this->db->prepare($insertQuery);
        $iStmt->execute([
            'product_id' => $productId,
            'qr_code' => $qrCodeData,
            'serial_number' => $serialNumber
        ]);

        $lastId = $this->db->lastInsertId();
        $fetchNew = "SELECT * FROM `product_units` WHERE `id` = :id";
        $fStmt = $this->db->prepare($fetchNew);
        $fStmt->execute(['id' => $lastId]);
        return $fStmt->fetch(\PDO::FETCH_ASSOC);
    }

    /**
     * LANGKAH 7: Mengupdate Data Master via Quick Inline Edit AJAX
     */
    public function updateProductInlineData($id, $nama, $harga, $minStok) {
        $query = "UPDATE `products` 
                  SET `name` = :name, 
                      `price` = :price, 
                      `minimum_stock` = :minimum_stock,
                      `updated_at` = CURRENT_TIMESTAMP 
                  WHERE `id` = :id";
                  
        $statement = $this->db->prepare($query);
        return $statement->execute([
            'id' => $id,
            'name' => $nama,
            'price' => $harga,
            'minimum_stock' => $minStok
        ]);
    }

    /**
     * LANGKAH 8: Mengambil Log Aktivitas Mutasi Sirkulasi Gudang Terbaru untuk Timeline
     */
    public function getLatestInventoryActivityLogs() {
        $query = "SELECT 
                    `activity_time` as jam_aktivitas,
                    `description` as deskripsi_log
                  FROM `activity_logs`
                  ORDER BY `id` DESC 
                  LIMIT 5";
                  
        $statement = $this->db->prepare($query);
        $statement->execute();
        return $statement->fetchAll(\PDO::FETCH_ASSOC);
    }

    /**
     * LANGKAH 9: Mengambil Statistik Aliran Stok 7 Hari Terakhir untuk Komponen Chart
     */
    public function getInventoryChartMovementData() {
        $query = "SELECT 
                    DATE(`created_at`) as tanggal,
                    COUNT(CASE WHEN `description` LIKE '%restock%' THEN 1 END) as jml_masuk,
                    COUNT(CASE WHEN `description` LIKE '%keluar%' OR `description` LIKE '%booking%' THEN 1 END) as jml_keluar,
                    COUNT(CASE WHEN `description` LIKE '%maintenance%' THEN 1 END) as jml_perawatan
                  FROM `activity_logs`
                  WHERE `created_at` >= DATE_SUB('2026-06-14', INTERVAL 7 DAY)
                  GROUP BY DATE(`created_at`)
                  ORDER BY DATE(`created_at`) ASC";
                  
        $statement = $this->db->prepare($query);
        $statement->execute();
        return $statement->fetchAll(\PDO::FETCH_ASSOC);
    }

    /**
     * LANGKAH 11: Menghapus Banyak Baris Produk Sekaligus (Batch Bulk Action)
     */
    public function deleteMultipleProductsBulk($arrayIds) {
        if (empty($arrayIds)) return false;
        
        $placeholders = implode(',', array_fill(0, count($arrayIds), '?'));
        $query = "DELETE FROM `products` WHERE `id` IN ($placeholders)";
        
        $statement = $this->db->prepare($query);
        return $statement->execute($arrayIds);
    }

    /**
     * LANGKAH 11: Menyesuaikan Tarif Sewa Banyak Produk Sekaligus (Batch Bulk Action)
     */
    public function updateMultiplePricesBulk($arrayIds, $kenaikanHarga) {
        if (empty($arrayIds)) return false;
        
        $placeholders = implode(',', array_fill(0, count($arrayIds), '?'));
        $query = "UPDATE `products` SET `price` = `price` + ? WHERE `id` IN ($placeholders)";
        
        $statement = $this->db->prepare($query);
        $arguments = array_merge([$kenaikanHarga], $arrayIds);
        return $statement->execute($arguments);
    }

    /**
     * LANGKAH 13: Mengambil Jejak Histori Terdalam untuk Modal Rincian Unit Aset
     */
    public function getDeepInventoryUnitDetails($productId) {
        $queryMaster = "SELECT 
                            p.id, p.name, p.price, p.stock, p.minimum_stock, c.name as category_name,
                            pu.serial_number, pu.qr_code, pu.condition, pu.status,
                            (SELECT COUNT(*) FROM `order_items` oi WHERE oi.product_id = p.id) as total_penyewaan
                        FROM `products` p
                        LEFT JOIN `categories` c ON p.category_id = c.id
                        LEFT JOIN `product_units` pu ON p.id = pu.product_id
                        WHERE p.id = :product_id LIMIT 1";
                        
        $stmtMaster = $this->db->prepare($queryMaster);
        $stmtMaster->execute(['product_id' => $productId]);
        $masterData = $stmtMaster->fetch(\PDO::FETCH_ASSOC);

        if (!$masterData) return null;

        $queryHistory = "SELECT activity, timestamp FROM `unit_histories` 
                         WHERE unit_id = (SELECT id FROM `product_units` WHERE product_id = :product_id LIMIT 1)
                         ORDER BY id DESC LIMIT 5";
                         
        $stmtHistory = $this->db->prepare($queryHistory);
        $stmtHistory->execute(['product_id' => $productId]);
        $masterData['timeline_unit'] = $stmtHistory->fetchAll(\PDO::FETCH_ASSOC);

        return $masterData;
    }
}