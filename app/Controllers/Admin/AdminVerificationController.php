<?php
namespace App\Controllers\Admin;

use App\Services\VerificationService;

class AdminVerificationController {
    private $service;

    public function __construct() {
        // Inisialisasi dependensi lapisan logika bisnis secara mandiri
        $this->service = new VerificationService();
    }

    /**
     * LANGKAH 1: Endpoint API Ambil Ringkasan Metrik Agregasi KPI Global
     * GET /api/admin/verification/kpi-metrics
     */
    public function getKpiMetrics() {
        header('Content-Type: application/json');
        try {
            $metrics = $this->service->fetchKpiSummary();
            echo json_encode([
                'status' => 'success',
                'data' => $metrics
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
     * LANGKAH 2 & 3: Endpoint API Pencarian Cerdas & Filter Kombinatorial Berbasis AJAX
     * GET /api/admin/verification/search?q=rivaldi&status=pending&time=Hari+Ini
     */
    public function searchVerificationApi() {
        header('Content-Type: application/json');
        try {
            $kataKunci = $_GET['q'] ?? '';
            $status = $_GET['status'] ?? 'Semua';
            $waktu = $_GET['time'] ?? 'Semua';
            
            $hasilQuery = $this->service->getFilteredVerificationsList($kataKunci, $status, $waktu);
            
            echo json_encode([
                'status' => 'success', 
                'count' => count($hasilQuery),
                'data' => $hasilQuery
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
     * LANGKAH 5: Endpoint API Membaca Jalur Direktori Gambar File Path Lampiran Dokumen
     * GET /api/admin/verification/attachments?id=1
     */
    public function getAttachmentPathsApi() {
        header('Content-Type: application/json');
        try {
            $id = $_GET['id'] ?? null;
            if (!$id) {
                throw new \Exception("Parameter ID Verifikasi berkas wajib dilampirkan.");
            }

            $paths = $this->service->getAttachmentPaths((int)$id);
            echo json_encode([
                'status' => 'success',
                'data' => $paths
            ]);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => $e->getMessage()
            ]);
        }
        exit();
    }

    /**
     * LANGKAH 6: Endpoint API Sinkronisasi Status Centang Parameter Checklist Kelayakan Berkas
     * POST /api/admin/verification/save-checklist
     */
    public function saveChecklistStateApi() {
        header('Content-Type: application/json');
        try {
            $inputData = json_decode(file_get_contents('php://input'), true);
            $id = $inputData['id'] ?? null;
            $flags = $inputData['flags'] ?? null;

            if (!$id || !$flags) {
                throw new \Exception("ID Verifikasi dan data parameter checklist wajib disertakan.");
            }

            $success = $this->service->saveChecklistFlags((int)$id, $flags);

            if ($success) {
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Checklist parameter berhasil disinkronkan ke MySQL.'
                ]);
            } else {
                throw new \Exception("Gagal memperbarui status checklist di database.");
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
     * LANGKAH 7: Endpoint API Simpan Catatan Reviewer Administratif Khusus Admin
     * POST /api/admin/verification/save-note
     */
    public function saveAdminNoteApi() {
        header('Content-Type: application/json');
        try {
            $inputData = json_decode(file_get_contents('php://input'), true);
            $id = $inputData['id'] ?? null;
            $catatan = $inputData['note'] ?? '';

            if (!$id) {
                throw new \Exception("ID Verifikasi dokumen tidak valid.");
            }

            $success = $this->service->saveAdminNote((int)$id, $catatan);

            if ($success) {
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Catatan evaluasi admin berhasil diamankan ke MySQL.'
                ]);
            } else {
                throw new \Exception("Gagal memperbarui catatan admin di database.");
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
     * LANGKAH 8: Endpoint API Otorisasi Alur Kerja Pemrosesan Dokumen Individu (Approve / Reject)
     * POST /api/admin/verification/process-workflow
     */
    public function processWorkflowActionApi() {
        header('Content-Type: application/json');
        try {
            $inputData = json_decode(file_get_contents('php://input'), true);
            
            $verifId = $inputData['id'] ?? null;
            $statusAction = $inputData['status'] ?? null;
            $adminNote = $inputData['note'] ?? '';
            $adminId = 1; // Mengambil data static Session Super Admin yang bertugas (Zteic Ranger)

            if (!$verifId || !$statusAction) {
                throw new \Exception("Parameter workflow kontrol tidak komplit.");
            }

            $success = $this->service->processSingleWorkflowAction((int)$verifId, $adminId, $statusAction, $adminNote);

            if ($success) {
                echo json_encode([
                    'status' => 'success', 
                    'message' => 'Workflow berhasil dikomit. Status berkas dan pesanan ter-update otomatis di MySQL.'
                ]);
            } else {
                throw new \Exception("Gagal menyelesaikan alur transaksi basis data.");
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
     * LANGKAH 9: Endpoint API Ambil Riwayat Histori Dokumen Lawas (Versioning List)
     * GET /api/admin/verification/versions?id=1
     */
    public function getVersionHistoryListApi() {
        header('Content-Type: application/json');
        try {
            $id = $_GET['id'] ?? null;
            if (!$id) {
                throw new \Exception("ID Verifikasi dokumen tidak boleh kosong.");
            }

            $versions = $this->service->getDocumentVersionsList((int)$id);
            echo json_encode([
                'status' => 'success',
                'data' => $versions
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
     * LANGKAH 10: Endpoint API Mengambil Aliran Jejak Log Kronologis Modul Individual
     * GET /api/admin/verification/timeline?id=1
     */
    public function getTimelineLogsApi() {
        header('Content-Type: application/json');
        try {
            $id = $_GET['id'] ?? null;
            if (!$id) {
                throw new \Exception("ID parameter verifikasi tidak terdeteksi.");
            }

            $timelineData = $this->service->getTimelineLogsStream((int)$id);
            echo json_encode([
                'status' => 'success',
                'data' => $timelineData
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
     * LANGKAH 11: Endpoint API Simpan Penyesuaian Kolom Pindaian Komparasi Teks Hasil AI OCR
     * POST /api/admin/verification/update-ocr-fields
     */
    public function saveOcrFieldsDataApi() {
        header('Content-Type: application/json');
        try {
            $inputData = json_decode(file_get_contents('php://input'), true);
            
            $id = $inputData['id'] ?? null;
            $ocrName = $inputData['ocr_name'] ?? '';
            $ocrNik = $inputData['ocr_nik'] ?? '';
            $ocrAddress = $inputData['ocr_address'] ?? '';
            $ocrBirth = $inputData['ocr_birth'] ?? '';

            if (!$id) {
                throw new \Exception("ID Verifikasi dokumen wajib disertakan.");
            }

            $success = $this->service->saveOcrComparativeFields((int)$id, $ocrName, $ocrNik, $ocrAddress, $ocrBirth);

            if ($success) {
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Hasil ekstraksi data komparasi OCR berhasil dikomit ke MySQL.'
                ]);
            } else {
                throw new \Exception("Gagal memperbarui field OCR.");
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
     * LANGKAH 12: Endpoint API Pemindai Sistem Keamanan Deteksi Duplikasi Nomor NIK KTP
     * GET /api/admin/verification/check-duplicate?id=1&nik=3216012408980002&user_id=2
     */
    public function checkNikDuplicationApi() {
        header('Content-Type: application/json');
        try {
            $verifId = $_GET['id'] ?? null;
            $nik = $_GET['nik'] ?? null;
            $userId = $_GET['user_id'] ?? null;

            if (!$verifId || !$nik || !$userId) {
                throw new \Exception("Parameter pengecekan enkripsi NIK fraud tidak lengkap.");
            }

            $fraudScanResult = $this->service->checkAndFlagNikDuplication((int)$verifId, $nik, (int)$userId);
            
            echo json_encode([
                'status' => 'success',
                'duplicate_detected' => $fraudScanResult['duplicate_detected'],
                'message' => $fraudScanResult['message']
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
     * LANGKAH 13: Endpoint API Mengambil Aliran Papan Log Audit Aktivitas Ranger Secara Global
     * GET /api/admin/verification/audit-logs
     */
    public function getGlobalAuditLogsApi() {
        header('Content-Type: application/json');
        try {
            $auditLogs = $this->service->getGlobalAuditLogsTrail();
            echo json_encode([
                'status' => 'success',
                'count' => count($auditLogs),
                'data' => $auditLogs
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
     * LANGKAH 15: Endpoint API Eksekusi Batch Otorisasi Massal (Bulk Action) Terproteksi
     * POST /api/admin/verification/process-bulk-workflow
     */
    public function processBulkWorkflowApi() {
        header('Content-Type: application/json');
        try {
            $inputData = json_decode(file_get_contents('php://input'), true);
            
            $arrayIds = $inputData['ids'] ?? [];
            $statusAction = $inputData['status'] ?? null;
            $adminNote = $inputData['note'] ?? '';
            $adminId = 1; // ID Ranger Admin penanggung jawab aksi massal

            if (empty($arrayIds) || !$statusAction) {
                throw new \Exception("Daftar koleksi ID dan status tindakan massal wajib disertakan.");
            }

            $success = $this->service->processBulkWorkflowAction($arrayIds, $adminId, $statusAction, $adminNote);

            if ($success) {
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Batch transaksi massal berhasil dijalankan. ' . count($arrayIds) . ' data ter-update serentak di MySQL.'
                ]);
            } else {
                throw new \Exception("Gagal menjalankan batch proses transaksi massal.");
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
}