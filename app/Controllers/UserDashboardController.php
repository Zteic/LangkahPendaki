<?php
namespace App\Controllers;

use App\Repositories\UserDashboardRepository;

class UserDashboardController {
    private $repository;

    public function __construct() {
        // Inisialisasi dependensi lapisan akses data MySQL secara mandiri
        $this->repository = new UserDashboardRepository();
    }

    /**
     * LANGKAH 1: Endpoint API Ambil Ringkasan Informasi Profil & Hero Metrics Pengguna
     * GET /api/user/dashboard/hero-metrics
     */
    public function getUserHeroMetricsApi() {
        header('Content-Type: application/json');
        try {
            // Memastikan ketersediaan session login aktif sebelum mengakses data finansial
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            
            // Mengambil User ID dari Session Login Aktif (Fallback ID: 2 - Akun Demo Rivaldi)
            $userId = $_SESSION['user_id'] ?? 2; 

            $data = $this->repository->getUserPersonalHeroData($userId);
            
            if (!$data) {
                throw new \Exception("Data profil pengguna tidak ditemukan di MySQL.");
            }

            echo json_encode([
                'status' => 'success',
                'data' => $data
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'message' => $e->getMessage()
            ]);
        }
        exit();
    }

    /**
     * LANGKAH 2: Endpoint API Ambil Ringkasan Metrik Akumulasi Aktivitas Finansial & Volume Sewa
     * GET /api/user/dashboard/activity-summary
     */
    public function getUserActivitySummaryApi() {
        header('Content-Type: application/json');
        try {
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            $userId = $_SESSION['user_id'] ?? 2; 

            $summaryData = $this->repository->getUserActivitySummaryMetrics($userId);

            echo json_encode([
                'status' => 'success',
                'data' => [
                    'pesanan_aktif'     => (int)($summaryData['pesanan_aktif'] ?? 0),
                    'total_pengeluaran' => (float)($summaryData['total_pengeluaran'] ?? 0),
                    'total_penyewaan'   => (int)($summaryData['total_penyewaan'] ?? 0),
                    'poin_reward'       => (int)($summaryData['poin_reward'] ?? 0)
                ]
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'message' => $e->getMessage()
            ]);
        }
        exit();
    }

    /**
     * LANGKAH 3: Endpoint API Ambil Status Pelacakan Transaksi Lapangan Terakhir (Live Progress)
     * GET /api/user/dashboard/order-progress
     */
    public function getUserLatestOrderProgressApi() {
        header('Content-Type: application/json');
        try {
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            $userId = $_SESSION['user_id'] ?? 2; 

            $orderRow = $this->repository->getLatestActiveUserOrderTrack($userId);

            if (!$orderRow) {
                echo json_encode([
                    'status' => 'success',
                    'has_order' => false,
                    'data' => null
                ]);
                exit();
            }

            echo json_encode([
                'status' => 'success',
                'has_order' => true,
                'data' => [
                    'order_id'       => (int)$orderRow['order_id'],
                    'invoice_number' => $orderRow['invoice_number'],
                    'status_raw'     => $orderRow['status_transaksi'],
                    'created_at'     => $orderRow['created_at']
                ]
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'message' => $e->getMessage()
            ]);
        }
        exit();
    }

    /**
     * LANGKAH 4: Endpoint API Ambil Ringkasan Kuantitas Volume & Tarif Harian Manifes Keranjang Belanja
     * GET /api/user/dashboard/mini-cart
     */
    public function getUserMiniCartSummaryApi() {
        header('Content-Type: application/json');
        try {
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            $userId = $_SESSION['user_id'] ?? 2; 

            $cartData = $this->repository->getUserMiniCartSummaryMetrics($userId);

            echo json_encode([
                'status' => 'success',
                'data' => [
                    'ragam_item'    => (int)($cartData['total_ragam_item'] ?? 0),
                    'volume_unit'   => (int)($cartData['total_volume_unit'] ?? 0),
                    'subtotal_sewa' => (float)($cartData['subtotal_tarif_harian'] ?? 0)
                ]
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'message' => $e->getMessage()
            ]);
        }
        exit();
    }

    /**
     * LANGKAH 5: Endpoint API Ambil Detail Tagihan Rekening VA & Batas Jatuh Tempo Countdown
     * GET /api/user/dashboard/active-billing
     */
    public function getUserActiveBillingApi() {
        header('Content-Type: application/json');
        try {
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            $userId = $_SESSION['user_id'] ?? 2; 

            $billing = $this->repository->getUserActiveBillingDetails($userId);

            if (!$billing) {
                echo json_encode([
                    'status' => 'success',
                    'has_billing' => false,
                    'data' => null
                ]);
                exit();
            }

            echo json_encode([
                'status' => 'success',
                'has_billing' => true,
                'data' => [
                    'order_id'       => (int)$billing['order_id'],
                    'invoice_number' => $billing['invoice_number'],
                    'total_tagihan'  => (float)$billing['subtotal_tagihan'],
                    'status_raw'     => $billing['status_transaksi'],
                    'method'         => $billing['payment_method'],
                    'va_number'      => $billing['va_number'],
                    'qris_url'       => $billing['qris_path'],
                    'due_timestamp'  => $billing['payment_due']
                ]
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'message' => $e->getMessage()
            ]);
        }
        exit();
    }

    /**
     * LANGKAH 6: Endpoint API Ambil Aliran Payload Base64 Bukti Konfirmasi Transfer Pembayaran
     * POST /api/user/dashboard/upload-proof
     */
    public function uploadPaymentProofApi() {
        header('Content-Type: application/json');
        try {
            $inputData = json_decode(file_get_contents('php://input'), true);
            
            $orderId = $inputData['order_id'] ?? null;
            $imageDataFileStream = $inputData['image_base64'] ?? null;

            if (!$orderId || !$imageDataFileStream) {
                throw new \Exception("Parameter unggah dokumen bukti transfer tidak lengkap.");
            }

            if (strpos($imageDataFileStream, 'data:image') === false) {
                throw new \Exception("Format ekstensi file tidak didukung. Wajib JPG, JPEG, atau PNG.");
            }

            $success = $this->repository->updatePaymentProofPath((int)$orderId, $imageDataFileStream);

            if ($success) {
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Bukti konfirmasi transfer sukses diunggah. State pesanan dialihkan ke antrean verifikasi MySQL.'
                ]);
            } else {
                throw new \Exception("Gagal memperbarui data baris pesanan di database.");
            }
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'message' => $e->getMessage()
            ]);
        }
        exit();
    }

    /**
     * LANGKAH 7: Endpoint API Validasi Kualifikasi Kupon Klaim Diskon Potongan Harga Harian
     * POST /api/user/dashboard/validate-voucher
     */
    public function validateVoucherCodeApi() {
        header('Content-Type: application/json');
        try {
            $inputData = json_decode(file_get_contents('php://input'), true);
            $code = $inputData['voucher_code'] ?? '';
            $currentSubtotal = (float)($inputData['subtotal_sewa'] ?? 0);

            if (empty($code)) {
                throw new \Exception("Kode voucher tidak boleh kosong.");
            }

            $voucher = $this->repository->getActiveVoucherByCode($code);

            if (!$voucher) {
                echo json_encode([
                    'status' => 'invalid',
                    'message' => 'Kode voucher tidak ditemukan atau sudah kedaluwarsa.'
                ]);
                exit();
            }

            if ($currentSubtotal < (float)$voucher['min_transaction']) {
                echo json_encode([
                    'status' => 'invalid',
                    'message' => 'Minimal transaksi untuk menggunakan voucher ini adalah Rp ' . number_format($voucher['min_transaction'], 0, ',', '.')
                ]);
                exit();
            }

            $potongan = (float)$voucher['discount_value'];
            if ($voucher['discount_type'] === 'persentase') {
                $potongan = $currentSubtotal * ($potongan / 100);
            }

            $totalAkhir = max(0, $currentSubtotal - $potongan);

            echo json_encode([
                'status' => 'valid',
                'message' => 'Selamat! Voucher berhasil diterapkan.',
                'data' => [
                    'potongan_harga' => $potongan,
                    'total_setelah_diskon' => $totalAkhir
                ]
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'message' => $e->getMessage()
            ]);
        }
        exit();
    }

    /**
     * LANGKAH 8: Endpoint API Ambil Daftar Koleksi Matriks Kartu Riwayat Log Transaksi Menggunakan AJAX
     * GET /api/user/dashboard/history-cards
     */
    public function getUserHistoryCardsApi() {
        header('Content-Type: application/json');
        try {
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            $userId = $_SESSION['user_id'] ?? 2; 
            $statusFilter = $_GET['status'] ?? 'Semua';
            $searchKeyword = $_GET['q'] ?? '';

            $cardsData = $this->repository->getUserHistoryLogCards($userId, $statusFilter, $searchKeyword);

            echo json_encode([
                'status' => 'success',
                'count' => count($cardsData),
                'data' => $cardsData
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'message' => $e->getMessage()
            ]);
        }
        exit();
    }

    /**
     * LANGKAH 9: Endpoint API Ambil Detail Spesifik Riwayat Manifes Barang Sewa Untuk Jendela Modal
     * GET /api/user/dashboard/history-detail
     */
    public function getUserHistoryDetailDataWindowApi() {
        header('Content-Type: application/json');
        try {
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            $userId = $_SESSION['user_id'] ?? 2; 
            $orderId = $_GET['id'] ?? null;

            if (!$orderId) {
                throw new \Exception("Parameter Transaksi ID wajib dilampirkan.");
            }

            $dataResult = $this->repository->getSpecificUserHistoryDetailData($userId, (int)$orderId);

            if (!$dataResult) {
                throw new \Exception("Arsip rekap detail riwayat transaksi tidak ditemukan di MySQL.");
            }

            echo json_encode([
                'status' => 'success',
                'data' => $dataResult
            ]);
        } catch (\Exception $e) {
            http_response_code(404);
            echo json_encode([
                'status' => 'error',
                'message' => $e->getMessage()
            ]);
        }
        exit();
    }

    /**
     * LANGKAH 11: Endpoint API Ambil Aliran Papan Log Notifikasi Center Ringan Secara Realtime
     * GET /api/user/dashboard/notifications
     */
    public function getUserLiveNotificationsApi() {
        header('Content-Type: application/json');
        try {
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            $userId = $_SESSION['user_id'] ?? 2; 

            $notificationsList = $this->repository->getUserLiveNotificationsStream($userId);

            $unreadCount = 0;
            foreach ($notificationsList as $n) {
                if ((int)$n['is_read'] === 0) {
                    $unreadCount++;
                }
            }

            echo json_encode([
                'status' => 'success',
                'unread_count' => $unreadCount,
                'data' => $notificationsList
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'message' => $e->getMessage()
            ]);
        }
        exit();
    }
}