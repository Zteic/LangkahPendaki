<?php
namespace App\Repositories;

use App\Config\Database;

class ReportRepository {
    private $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    /**
     * LANGKAH 1: Mengambil Ringkasan Agregasi Finansial Global dari MySQL
     * Menghitung total omset, jumlah pesanan, keunikan pelanggan, dan akumulasi denda.
     */
    public function getGlobalReportKpiMetrics() {
        $query = "SELECT 
                    (SELECT COALESCE(SUM(amount), 0) FROM `orders` WHERE `status` IN ('Pembayaran Diterima', 'Selesai', 'Siap Diambil')) as total_pendapatan,
                    COUNT(*) as total_penyewaan,
                    COUNT(DISTINCT `user_id`) as total_pelanggan,
                    (SELECT COALESCE(SUM(fine_amount), 0) FROM `orders` WHERE `status` = 'Selesai') as total_denda
                  FROM `orders` 
                  WHERE `status` IN ('Pembayaran Diterima', 'Selesai', 'Siap Diambil')";
                  
        $statement = $this->db->prepare($query);
        $statement->execute();
        return $statement->fetch(\PDO::FETCH_ASSOC);
    }

    /**
     * LANGKAH 2, 3 & 4: Query Pengambil Baris Data Audit Tabel Laporan Modern
     */
    public function getFilteredAndSearchedReports($kataKunci = '', $periode = 'Semua', $jenisLaporan = 'Semua', $startDate = null, $endDate = null) {
        $query = "SELECT 
                    o.id as order_id,
                    DATE_FORMAT(o.created_at, '%Y-%m-%d %H:%i') as tanggal,
                    o.invoice_number,
                    u.name as nama_pelanggan,
                    CASE 
                        WHEN o.fine_amount > 0 AND o.status = 'Selesai' THEN 'Denda'
                        WHEN o.status IN ('Pembayaran Diterima', 'Siap Diambil') THEN 'Penyewaan'
                        ELSE 'Pendapatan'
                    END as jenis_laporan,
                    COALESCE(o.amount, 150000) as total,
                    o.status
                  FROM `orders` o
                  LEFT JOIN `users` u ON o.user_id = u.id
                  WHERE 1=1";
                  
        $params = [];

        if (!empty($kataKunci)) {
            $query .= " AND (o.invoice_number LIKE :search 
                        OR o.id LIKE :search_id 
                        OR u.name LIKE :search)";
            $params['search'] = '%' . $kataKunci . '%';
            $params['search_id'] = is_numeric($kataKunci) ? (int)$kataKunci : 0;
        }

        if ($periode === 'Hari Ini') {
            $query .= " AND DATE(o.created_at) = '2026-06-14'";
        } elseif ($periode === 'Minggu Ini') {
            $query .= " AND o.created_at >= DATE_SUB('2026-06-14', INTERVAL 7 DAY)";
        } elseif ($periode === 'Bulan Ini') {
            $query .= " AND o.created_at >= DATE_SUB('2026-06-14', INTERVAL 30 DAY)";
        } elseif ($periode === 'Tahun Ini') {
            $query .= " AND YEAR(o.created_at) = 2026";
        } elseif ($periode === 'Custom Range' && !empty($startDate) && !empty($endDate)) {
            $query .= " AND DATE(o.created_at) BETWEEN :start_date AND :end_date";
            $params['start_date'] = $startDate;
            $params['end_date'] = $endDate;
        }

        if ($jenisLaporan !== 'Semua') {
            if ($jenisLaporan === 'Denda') {
                $query .= " AND o.status = 'Selesai' AND o.fine_amount > 0";
            } elseif ($jenisLaporan === 'Penyewaan') {
                $query .= " AND o.status IN ('Pembayaran Diterima', 'Siap Diambil')";
            } elseif ($jenisLaporan === 'Pendapatan') {
                $query .= " AND o.status = 'Selesai'";
            }
        }

        $query .= " ORDER BY o.id DESC";
        
        $statement = $this->db->prepare($query);
        $statement->execute($params);
        return $statement->fetchAll(\PDO::FETCH_ASSOC);
    }

    /**
     * LANGKAH 5: Mengambil Data Detail Transaksi Kolektif Laporan Khusus
     */
    public function getDeepReportDetailById($orderId) {
        $queryOrder = "SELECT 
                        o.id as order_id, o.invoice_number, o.created_at as tanggal_transaksi,
                        o.status as status_transaksi, o.payment_method,
                        COALESCE(o.amount, 0) as total_pembayaran, COALESCE(o.fine_amount, 0) as total_denda,
                        u.name as nama_pelanggan, u.email as email_pelanggan, u.phone as hp_pelanggan
                       FROM `orders` o
                       LEFT JOIN `users` u ON o.user_id = u.id
                       WHERE o.id = :order_id LIMIT 1";
                       
        $stmtOrder = $this->db->prepare($queryOrder);
        $stmtOrder->execute(['order_id' => $orderId]);
        $orderData = $stmtOrder->fetch(\PDO::FETCH_ASSOC);

        if (!$orderData) return null;

        $queryItems = "SELECT oi.quantity, p.name as nama_produk, p.price as harga_satuan, p.category as kategori_produk
                       FROM `order_items` oi
                       LEFT JOIN `products` p ON oi.product_id = p.id
                       WHERE oi.order_id = :order_id";
                       
        $stmtItems = $this->db->prepare($queryItems);
        $stmtItems->execute(['order_id' => $orderId]);
        $orderData['items_sewa'] = $stmtItems->fetchAll(\PDO::FETCH_ASSOC);

        return $orderData;
    }

    /**
     * LANGKAH 6: Mencatat Histori Ekspor Laporan Admin ke MySQL
     */
    public function logReportExportActivity($userId, $exportType, $filterPeriod, $filterType, $totalRecord) {
        $query = "INSERT INTO `report_exports` 
                    (`user_id`, `export_type`, `filter_period`, `filter_type`, `total_record`, `created_at`) 
                  VALUES 
                    (:user_id, :export_type, :filter_period, :filter_type, :total_record, CURRENT_TIMESTAMP)";
                    
        $statement = $this->db->prepare($query);
        return $statement->execute([
            'user_id'       => $userId,
            'export_type'   => $exportType,
            'filter_period' => $filterPeriod,
            'filter_type'   => $filterType,
            'total_record'  => $totalRecord
        ]);
    }
}