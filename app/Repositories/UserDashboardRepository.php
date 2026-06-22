<?php
namespace App\Repositories;

use App\Config\Database;

class UserDashboardRepository {
    private $db;

    public function __construct() {
        // Mengambil koneksi database transaksional MySQL proyek LangkahPendaki
        $this->db = Database::getConnection();
    }

    /**
     * LANGKAH 1: Mengambil Data Profil Akun & Agregasi Historis User dari MySQL
     * Menghitung total volume trip sewa yang berstatus sukses (lunas/selesai).
     */
    public function getUserPersonalHeroData($userId) {
        $query = "SELECT 
                    u.id AS user_id,
                    u.nama_lengkap AS nama_user,
                    u.surel AS email,
                    u.tingkat_keanggotaan AS membership_level,
                    COALESCE(u.jalur_foto_profil, '') AS avatar_path,
                    COALESCE(u.poin_hadiah, 0) AS reward_points,
                    u.status_akun AS status_akun,
                    COUNT(CASE WHEN o.status_operasional IN ('Pembayaran Diterima', 'Selesai', 'Siap Diambil') THEN 1 END) AS total_penyewaan
                  FROM `pengguna` u
                  LEFT JOIN `pesanan_induk` o ON u.id = o.pengguna_id
                  WHERE u.id = :user_id
                  GROUP BY u.id";
                  
        $statement = $this->db->prepare($query);
        $statement->execute(['user_id' => $userId]);
        return $statement->fetch(\PDO::FETCH_ASSOC);
    }

    /**
     * LANGKAH 2: Mengambil Agregasi Finansial & Volume Aktivitas Penyewa dari MySQL
     * Menghitung kuantitas pesanan aktif berjalan, rekap total pengeluaran, dan total trip selesai.
     */
    public function getUserActivitySummaryMetrics($userId) {
        $query = "SELECT 
                    COUNT(CASE WHEN `status_operasional` IN ('Pembayaran Diterima', 'Siap Diambil', 'Menunggu Verifikasi') THEN 1 END) AS pesanan_aktif,
                    COALESCE(SUM(CASE WHEN `status_operasional` IN ('Pembayaran Diterima', 'Selesai', 'Siap Diambil') THEN `total_nilai_buku` ELSE 0 END), 0) AS total_pengeluaran,
                    COUNT(CASE WHEN `status_operasional` = 'Selesai' THEN 1 END) AS total_penyewaan,
                    (SELECT COALESCE(`poin_hadiah`, 0) FROM `pengguna` WHERE `id` = :user_id) AS poin_reward
                  FROM `pesanan_induk`
                  WHERE `pengguna_id` = :user_id";
                  
        $statement = $this->db->prepare($query);
        $statement->execute(['user_id' => $userId]);
        return $statement->fetch(\PDO::FETCH_ASSOC);
    }

    /**
     * LANGKAH 3: Mengambil Status Pelacakan Order Aktif Terakhir Milik User dari MySQL
     * Digunakan untuk memetakan level penanda sorot (highlight glow) pada progress bar linimasa sewa.
     */
    public function getLatestActiveUserOrderTrack($userId) {
        $query = "SELECT 
                    `id` AS order_id,
                    `nomor_faktur` AS invoice_number,
                    `status_operasional` AS status_transaksi,
                    `created_at`
                  FROM `pesanan_induk`
                  WHERE `pengguna_id` = :user_id
                  ORDER BY `id` DESC LIMIT 1";
                  
        $statement = $this->db->prepare($query);
        $statement->execute(['user_id' => $userId]);
        return $statement->fetch(\PDO::FETCH_ASSOC);
    }

    /**
     * LANGKAH 4: Mengambil Data Ringkasan Keranjang Belanja Pengguna dari MySQL
     * Menghitung subtotal tarif harian, ragam produk sewa, dan kuantitas unit fisik.
     */
    public function getUserMiniCartSummaryMetrics($userId) {
        $query = "SELECT 
                    COUNT(c.id) AS total_ragam_item,
                    COALESCE(SUM(c.kuantitas_item), 0) AS total_volume_unit,
                    COALESCE(SUM(c.kuantitas_item * p.harga_sewa_per_hari), 0) AS subtotal_tarif_harian
                  FROM `keranjang_belanja` c
                  LEFT JOIN `produk` p ON c.produk_id = p.id
                  WHERE c.pengguna_id = :user_id";
                  
        $statement = $this->db->prepare($query);
        $statement->execute(['user_id' => $userId]);
        return $statement->fetch(\PDO::FETCH_ASSOC);
    }

    /**
     * LANGKAH 5: Mengambil Detail Tagihan Invoice Belum Bayar dari MySQL
     * Menyuplai data rekening Virtual Account, nominal tagihan, dan datetime jatuh tempo countdown.
     */
    public function getUserActiveBillingDetails($userId) {
        $query = "SELECT 
                    `id` AS order_id,
                    `nomor_faktur` AS invoice_number,
                    COALESCE(`total_nilai_buku`, 0) AS subtotal_tagihan,
                    `status_operasional` AS status_transaksi,
                    `metode_pembayaran` AS payment_method,
                    `nomor_akun_virtual` AS va_number,
                    `tautan_qris` AS qris_path,
                    `batas_waktu_pembayaran` AS payment_due
                  FROM `pesanan_induk`
                  WHERE `pengguna_id` = :user_id 
                    AND `status_operasional` = 'Menunggu Pembayaran'
                  ORDER BY `id` DESC LIMIT 1";
                  
        $statement = $this->db->prepare($query);
        $statement->execute(['user_id' => $userId]);
        return $statement->fetch(\PDO::FETCH_ASSOC);
    }

    /**
     * LANGKAH 6: Memperbarui Jalur Dokumen Bukti Pembayaran ke Basis Data MySQL
     * Otomatis mengalihkan status pesanan menjadi antrean tinjau 'Menunggu Verifikasi'.
     */
    public function updatePaymentProofPath($orderId, $proofPath) {
        $query = "UPDATE `pesanan_induk` 
                  SET `jalur_bukti_transfer` = :proof_path,
                      `status_operasional`   = 'Menunggu Verifikasi',
                      `updated_at`           = CURRENT_TIMESTAMP
                  WHERE `id` = :order_id";
                  
        $statement = $this->db->prepare($query);
        return $statement->execute([
            'proof_path' => $proofPath,
            'order_id'   => $orderId
        ]);
    }

    /**
     * LANGKAH 7: Memeriksa Validitas Kode Voucher di Database MySQL
     * Memastikan status kupon aktif, kuota > 0, dan tanggal server hari ini belum kedaluwarsa.
     */
    public function getActiveVoucherByCode($code) {
        $query = "SELECT 
                    `id` AS voucher_id,
                    `kode_voucher` AS code,
                    `tipe_potongan` AS discount_type,
                    `nilai_potongan` AS discount_value,
                    `minimal_transaksi` AS min_transaction
                  FROM `voucher_diskon`
                  WHERE BINARY `kode_voucher` = :code 
                    AND `status_kupon` = 'Aktif'
                    AND `kuota_klaim` > 0
                    AND `tanggal_kadaluwarsa` >= NOW()
                  LIMIT 1";
                  
        $statement = $this->db->prepare($query);
        $statement->execute(['code' => $code]);
        return $statement->fetch(\PDO::FETCH_ASSOC);
    }

    /**
     * LANGKAH 8: Mengambil Riwayat Penyewaan Komposit Milik User dari MySQL
     * Mendukung multi-tab status filter (Berjalan, Selesai, Batal) dan pencarian nomor invoice.
     */
    public function getUserHistoryLogCards($userId, $statusFilter = 'Semua', $searchInvoice = '') {
        $query = "SELECT 
                    o.id AS order_id,
                    o.nomor_faktur AS invoice_number,
                    DATE_FORMAT(o.created_at, '%d %b %Y') AS tanggal_sewa,
                    o.status_operasional AS status_transaksi,
                    COALESCE(o.total_nilai_buku, 0) AS total_pembayaran,
                    (SELECT p.nama_alat FROM `pesanan_rincian_item` oi 
                     LEFT JOIN `produk` p ON oi.produk_id = p.id 
                     WHERE oi.pesanan_id = o.id LIMIT 1) AS nama_produk_sampul,
                    (SELECT p.tautan_gambar FROM `pesanan_rincian_item` oi 
                     LEFT JOIN `produk` p ON oi.produk_id = p.id 
                     WHERE oi.pesanan_id = o.id LIMIT 1) AS foto_produk_sampul,
                    (SELECT COUNT(*) FROM `pesanan_rincian_item` WHERE pesanan_id = o.id) AS total_ragam_item
                  FROM `pesanan_induk` o
                  WHERE o.pengguna_id = :user_id";
                  
        $params = ['user_id' => $userId];

        if ($statusFilter !== 'Semua') {
            if ($statusFilter === 'Berjalan') {
                $query .= " AND o.status_operasional IN ('Pembayaran Diterima', 'Siap Diambil', 'Menunggu Verifikasi')";
            } elseif ($statusFilter === 'Selesai') {
                $query .= " AND o.status_operasional = 'Selesai'";
            } elseif ($statusFilter === 'Dibatalkan') {
                $query .= " AND o.status_operasional = 'Dibatalkan'";
            }
        }

        if (!empty($searchInvoice)) {
            $query .= " AND o.nomor_faktur LIKE :invoice_search";
            $params['invoice_search'] = '%' . $searchInvoice . '%';
        }

        $query .= " ORDER BY o.id DESC";
        
        $statement = $this->db->prepare($query);
        $statement->execute($params);
        return $statement->fetchAll(\PDO::FETCH_ASSOC);
    }

    /**
     * LANGKAH 9: Mengambil Detail Komposit Transaksi Riwayat untuk Jendela Modal
     * Menggabungkan manifes data kuantitas item dan menghitung kalkulasi durasi hari rental.
     */
    public function getSpecificUserHistoryDetailData($userId, $orderId) {
        $queryOrder = "SELECT 
                        o.id AS order_id,
                        o.nomor_faktur AS invoice_number,
                        DATE_FORMAT(o.created_at, '%Y-%m-%d %H:%i') AS tanggal_full,
                        o.status_operasional AS status_transaksi,
                        o.metode_pembayaran AS payment_method,
                        COALESCE(o.total_nilai_buku, 0) AS subtotal_nilai_buku,
                        COALESCE(o.total_denda_berjalan, 0) AS denda_berjalan,
                        o.jalur_bukti_transfer AS payment_proof_path,
                        DATEDIFF(o.tanggal_tenggat_kembali, o.tanggal_mulai_sewa) AS durasi_hari
                       FROM `pesanan_induk` o
                       WHERE o.pengguna_id = :user_id AND o.id = :order_id LIMIT 1";
                       
        $statementOrder = $this->db->prepare($queryOrder);
        $statementOrder->execute(['user_id' => $userId, 'order_id' => $orderId]);
        $orderInfo = $statementOrder->fetch(\PDO::FETCH_ASSOC);

        if (!$orderInfo) return null;

        $queryItems = "SELECT 
                        oi.kuantitas_item AS quantity,
                        p.nama_alat AS nama_produk,
                        p.harga_sewa_per_hari AS harga_normal
                       FROM `pesanan_rincian_item` oi
                       LEFT JOIN `produk` p ON oi.produk_id = p.id
                       WHERE oi.pesanan_id = :order_id";
                       
        $statementItems = $this->db->prepare($queryItems);
        $statementItems->execute(['order_id' => $orderId]);
        $orderInfo['manifest_items'] = $statementItems->fetchAll(\PDO::FETCH_ASSOC);

        return $orderInfo;
    }

    /**
     * LANGKAH 11: Mengambil Daftar Pemberitahuan Stream Terbaru Milik User dari MySQL
     * Menampilkan maksimal 5 snapshot log mutasi status persewaan terbaru.
     */
    public function getUserLiveNotificationsStream($userId) {
        $query = "SELECT 
                    `id` AS notif_id,
                    `judul_pesan` AS title,
                    `isi_berita` AS message,
                    `kategori_notif` AS type,
                    `status_baca` AS is_read,
                    DATE_FORMAT(`created_at`, '%H:%i') AS waktu_notif
                  FROM `notifikasi_pengguna`
                  WHERE `pengguna_id` = :user_id
                  ORDER BY `id` DESC LIMIT 5";
                  
        $statement = $this->db->prepare($query);
        $statement->execute(['user_id' => $userId]);
        return $statement->fetchAll(\PDO::FETCH_ASSOC);
    }
}