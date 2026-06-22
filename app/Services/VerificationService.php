<?php
namespace App\Services;

use App\Repositories\VerificationRepository;

class VerificationService {
    private $repository;

    public function __construct() {
        $this->repository = new VerificationRepository();
    }

    /**
     * LANGKAH 1: Mengambil Data Ringkasan Agregasi KPI Global Risk & Verification
     * Memformat hasil hitungan mentah dari database menjadi integer yang siap dikonsumsi oleh frontend.
     */
    public function fetchKpiSummary() {
        $data = $this->repository->getVerificationKpiMetrics();
        return [
            'pending_review'      => (int)($data['pending_review'] ?? 0),
            'approved'            => (int)($data['approved_count'] ?? 0),
            'rejected'            => (int)($data['rejected_count'] ?? 0),
            'upload_hari_ini'     => (int)($data['upload_hari_ini'] ?? 0),
            'perlu_review_manual' => (int)($data['perlu_review_manual'] ?? 0)
        ];
    }

    /**
     * LANGKAH 2 & 3: Filter dan Pencarian Cerdas Multi-Variabel
     */
    public function getFilteredVerificationsList($kataKunci = '', $statusFilter = 'Semua', $waktuFilter = 'Semua') {
        return $this->repository->searchRiskVerifications($kataKunci, $statusFilter, $waktuFilter);
    }

    /**
     * LANGKAH 5: Membaca Jalur Direktori Gambar Lampiran Berkas
     */
    public function getAttachmentPaths($verificationId) {
        $paths = $this->repository->getVerificationAttachmentPaths($verificationId);
        if (!$paths) {
            throw new \Exception("Lampiran berkas tidak ditemukan di database.");
        }
        return $paths;
    }

    /**
     * LANGKAH 6: Memproses Penyimpanan Bendera Checklist Evaluasi Kelayakan Berkas
     */
    public function saveChecklistFlags($id, $flags) {
        if (empty($id)) {
            throw new \Exception("ID Verifikasi wajib dilampirkan untuk menyimpan checklist.");
        }
        return $this->repository->updateVerificationChecklistFlags($id, $flags);
    }

    /**
     * LANGKAH 7: Memproses Penyimpanan Catatan Reviewer Administratif
     */
    public function saveAdminNote($id, $catatan) {
        if (empty($id)) {
            throw new \Exception("ID Verifikasi wajib dilampirkan untuk menyimpan catatan.");
        }
        return $this->repository->updateVerificationAdminNote($id, $catatan);
    }

    /**
     * LANGKAH 8: Memproses Alur Kerja (Workflow) Otorisasi Individu
     * Memvalidasi aturan bisnis: Jika status ditolak (rejected), catatan alasan wajib terisi penuh.
     */
    public function processSingleWorkflowAction($verifId, $adminId, $targetStatus, $catatanAdmin = '') {
        if (empty($verifId) || empty($targetStatus)) {
            throw new \Exception("Parameter pemrosesan workflow individu tidak lengkap.");
        }

        $targetStatus = strtolower($targetStatus);
        if ($targetStatus === 'rejected' && empty(trim($catatanAdmin))) {
            throw new \Exception("Aturan Sistem: Alasan penolakan (catatan) wajib diisi jika Anda menolak berkas.");
        }

        return $this->repository->executeVerificationWorkflowTransaction($verifId, $adminId, $targetStatus, $catatanAdmin);
    }

    /**
     * LANGKAH 9: Memproses Unggah Ulang Berkas dari Sisi Customer & Membuat Histori Versi Baru
     */
    public function processCustomerDocumentReupload($verifId, $newKtp, $newSelfie, $newSupport) {
        if (empty($verifId) || empty($newKtp) || empty($newSelfie)) {
            throw new \Exception("Gagal unggah ulang: Berkas KTP dan Selfie wajib dilampirkan.");
        }
        return $this->repository->processCustomerReuploadTransaction($verifId, $newKtp, $newSelfie, $newSupport);
    }

    public function getDocumentVersionsList($verifId) {
        if (empty($verifId)) {
            throw new \Exception("ID Verifikasi tidak valid.");
        }
        return $this->repository->getVerificationVersionHistory($verifId);
    }

    /**
     * LANGKAH 10: Membaca Rantai Kronologis Histori Log Verifikasi Dokumen Individual
     */
    public function getTimelineLogsStream($verificationId) {
        if (empty($verificationId)) {
            throw new \Exception("ID parameter verifikasi tidak valid.");
        }
        return $this->repository->getVerificationTimelineLogs($verificationId);
    }

    /**
     * LANGKAH 11: Memproses Integrasi dan Penyimpanan Penyesuaian Kolom OCR Teks
     */
    public function saveOcrComparativeFields($id, $ocrName, $ocrNik, $ocrAddress, $ocrBirth) {
        if (empty($id)) {
            throw new \Exception("ID Verifikasi tidak ditemukan.");
        }
        return $this->repository->updateOcrExtractedFields($id, $ocrName, $ocrNik, $ocrAddress, $ocrBirth);
    }

    /**
     * LANGKAH 12: Memeriksa Status Duplikasi NIK KTP Lintas Akun di Basis Data MySQL
     */
    public function checkAndFlagNikDuplication($verifId, $nik, $userId) {
        if (empty($verifId) || empty($nik) || empty($userId)) {
            throw new \Exception("Parameter deteksi duplikasi fraud inkomplit.");
        }

        // Panggil pencarian fraud ke repositori database
        $isDuplicateDetected = $this->repository->checkNikDuplicationFraud($verifId, $nik, $userId);
        
        // Perbarui status bendera 'duplicate_detected' secara sinkron ke MySQL
        $this->repository->flagVerificationAsDuplicate($verifId, $isDuplicateDetected);

        return [
            'duplicate_detected' => $isDuplicateDetected,
            'message' => $isDuplicateDetected ? 'Peringatan Bahaya: NIK terdeteksi telah disetujui pada akun pendaki lain!' : 'NIK KTP aman.'
        ];
    }

    /**
     * LANGKAH 13: Membaca Aliran Data Log Audit Aktivitas Ranger Secara Global
     */
    public function getGlobalAuditLogsTrail() {
        return $this->repository->getGlobalVerificationActivityLogs();
    }

    /**
     * LANGKAH 15: Memproses Alur Kerja Otorisasi Massal (Bulk Action) Terproteksi Database Transaction
     */
    public function processBulkWorkflowAction($arrayIds, $adminId, $targetStatus, $catatanMassal = '') {
        if (empty($arrayIds) || !is_array($arrayIds)) {
            throw new \Exception("Daftar koleksi ID verifikasi massal tidak valid.");
        }

        if (empty($targetStatus)) {
            throw new \Exception("Aksi target status massal wajib didefinisikan.");
        }

        $targetStatus = strtolower($targetStatus);
        if ($targetStatus === 'rejected' && empty(trim($catatanMassal))) {
            throw new \Exception("Aturan Sistem: Catatan alasan penolakan massal wajib diisi.");
        }

        return $this->repository->executeBulkVerificationWorkflow($arrayIds, $adminId, $targetStatus, $catatanMassal);
    }
}