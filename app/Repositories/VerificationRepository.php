<?php
namespace App\Repositories;

use App\Config\Database;

class VerificationRepository {
    private $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    /**
     * LANGKAH 1: Mengambil Data Ringkasan Agregasi KPI Global Risk & Verification
     * Melakukan kueri tunggal (single-pass query) untuk menghitung metrik status dan batas waktu.
     */
    public function getVerificationKpiMetrics() {
        $query = "SELECT 
                    COUNT(CASE WHEN `status` = 'pending' THEN 1 END) as pending_review,
                    COUNT(CASE WHEN `status` = 'approved' THEN 1 END) as approved_count,
                    COUNT(CASE WHEN `status` = 'rejected' THEN 1 END) as rejected_count,
                    COUNT(CASE WHEN DATE(`created_at`) = '2026-06-14' THEN 1 END) as upload_hari_ini,
                    COUNT(CASE WHEN `status` = 'pending' AND (`check_photo_clear` = 0 OR `duplicate_detected` = 1) THEN 1 END) as perlu_review_manual
                  FROM `document_verifications`";
                  
        $statement = $this->db->prepare($query);
        $statement->execute();
        return $statement->fetch(\PDO::FETCH_ASSOC);
    }

    /**
     * LANGKAH 2 & 3: Pencarian Cerdas Terintegrasi Filter Status & Rentang Waktu MySQL
     * Menyaring rekaman data berdasarkan 6 indikator entitas relasional dan rentang waktu kalender.
     */
    public function searchRiskVerifications($kataKunci = '', $statusFilter = 'Semua', $waktuFilter = 'Semua') {
        $query = "SELECT 
                    dv.id,
                    dv.user_id,
                    dv.order_id,
                    dv.nik,
                    dv.full_name as nama_dokumen,
                    dv.status,
                    dv.created_at,
                    dv.check_photo_clear,
                    dv.check_name_match,
                    dv.check_nik_readable,
                    dv.check_not_blur,
                    dv.check_not_cut,
                    dv.check_not_expired,
                    u.name as nama_user,
                    u.email as email_user,
                    u.phone as hp_user,
                    o.invoice_number as nomor_invoice,
                    (dv.check_photo_clear + dv.check_name_match + dv.check_nik_readable + 
                     dv.check_not_blur + dv.check_not_cut + dv.check_not_expired) as total_checklist_passed
                  FROM `document_verifications` dv
                  LEFT JOIN `users` u ON dv.user_id = u.id
                  LEFT JOIN `orders` o ON dv.order_id = o.id
                  WHERE 1=1";
                  
        $params = [];

        // Filter Kata Kunci Berdasarkan 6 Parameter (Langkah 2)
        if (!empty($kataKunci)) {
            $query .= " AND (u.name LIKE :search 
                        OR u.email LIKE :search 
                        OR u.phone LIKE :search 
                        OR dv.nik LIKE :search 
                        OR o.invoice_number LIKE :search 
                        OR dv.user_id = :direct_id)";
            $params['search'] = '%' . $kataKunci . '%';
            $params['direct_id'] = is_numeric($kataKunci) ? (int)$kataKunci : 0;
        }

        // Filter Status ENUM (Langkah 3)
        if ($statusFilter !== 'Semua') {
            $query .= " AND dv.status = :status";
            $params['status'] = strtolower($statusFilter);
        }

        // Filter Jangka Waktu Tanggal (Langkah 3)
        if ($waktuFilter === 'Hari Ini') {
            $query .= " AND DATE(dv.created_at) = '2026-06-14'";
        } elseif ($waktuFilter === 'Minggu Ini') {
            $query .= " AND dv.created_at >= DATE_SUB('2026-06-14', INTERVAL 7 DAY)";
        } elseif ($waktuFilter === 'Bulan Ini') {
            $query .= " AND dv.created_at >= DATE_SUB('2026-06-14', INTERVAL 30 DAY)";
        }

        $query .= " ORDER BY dv.id DESC";
        
        $statement = $this->db->prepare($query);
        $statement->execute($params);
        return $statement->fetchAll(\PDO::FETCH_ASSOC);
    }

    /**
     * LANGKAH 5: Mengambil Jalur Direktori Gambar Lampiran Dokumen untuk Fullscreen Viewer
     */
    public function getVerificationAttachmentPaths($verificationId) {
        $query = "SELECT 
                    `id`,
                    `user_id`,
                    `ktp_path`,
                    `selfie_ktp_path`,
                    `support_document_path`
                  FROM `document_verifications` 
                  WHERE `id` = :id LIMIT 1";
                  
        $statement = $this->db->prepare($query);
        $statement->execute(['id' => $verificationId]);
        return $statement->fetch(\PDO::FETCH_ASSOC);
    }

    /**
     * LANGKAH 6: Simpan Mutasi Checklist Evaluasi Admin ke MySQL
     */
    public function updateVerificationChecklistFlags($id, $flags) {
        $query = "UPDATE `document_verifications` 
                  SET `check_photo_clear`  = :photo,
                      `check_name_match`   = :name,
                      `check_nik_readable` = :nik,
                      `check_not_blur`     = :blur,
                      `check_not_cut`      = :cut,
                      `check_not_expired`  = :expired,
                      `updated_at`         = CURRENT_TIMESTAMP
                  WHERE `id` = :id";
                  
        $statement = $this->db->prepare($query);
        return $statement->execute([
            'id'      => $id,
            'photo'   => $flags['photo'] ? 1 : 0,
            'name'    => $flags['name'] ? 1 : 0,
            'nik'     => $flags['nik'] ? 1 : 0,
            'blur'    => $flags['blur'] ? 1 : 0,
            'cut'     => $flags['cut'] ? 1 : 0,
            'expired' => $flags['expired'] ? 1 : 0
        ]);
    }

    /**
     * LANGKAH 7: Simpan Catatan Evaluasi Administratif Admin ke MySQL
     */
    public function updateVerificationAdminNote($id, $catatan) {
        $query = "UPDATE `document_verifications` 
                  SET `admin_note` = :admin_note,
                      `updated_at` = CURRENT_TIMESTAMP
                  WHERE `id` = :id";
                  
        $statement = $this->db->prepare($query);
        return $statement->execute([
            'id'         => $id,
            'admin_note' => $catatan
        ]);
    }

    /**
     * LANGKAH 8: Eksekusi Workflow Persetujuan Dokumen & Mutasi Pesanan Terpadu
     * Mengamankan status relasional multitable menggunakan Database Transaction.
     */
    public function executeVerificationWorkflowTransaction($verifId, $adminId, $targetStatus, $catatanAdmin = '') {
        try {
            $this->db->beginTransaction();

            $fetchQuery = "SELECT `order_id` FROM `document_verifications` WHERE `id` = :id LIMIT 1";
            $stmtFetch = $this->db->prepare($fetchQuery);
            $stmtFetch->execute(['id' => $verifId]);
            $verifData = $stmtFetch->fetch(\PDO::FETCH_ASSOC);

            if (!$verifData) {
                throw new \Exception("Record identitas data verifikasi tidak valid.");
            }

            $orderId = $verifData['order_id'];

            $verifUpdateQuery = "UPDATE `document_verifications` 
                                 SET `status`      = :status, 
                                     `admin_note`  = :note, 
                                     `verified_by` = :admin_id, 
                                     `verified_at` = CURRENT_TIMESTAMP,
                                     `updated_at`  = CURRENT_TIMESTAMP
                                 WHERE `id` = :id";
                                 
            $stmtVerif = $this->db->prepare($verifUpdateQuery);
            $stmtVerif->execute([
                'id'       => $verifId,
                'status'   => $targetStatus,
                'note'     => $catatanAdmin,
                'admin_id' => $adminId
            ]);

            if ($orderId) {
                $orderStatusMapped = ($targetStatus === 'approved') ? 'Siap Diambil' : 'Upload Ulang';
                
                $orderUpdateQuery = "UPDATE `orders` 
                                     SET `status`     = :order_status, 
                                         `updated_at` = CURRENT_TIMESTAMP 
                                     WHERE `id`       = :order_id";
                                     
                $stmtOrder = $this->db->prepare($orderUpdateQuery);
                $stmtOrder->execute([
                    'order_status' => $orderStatusMapped,
                    'order_id'     => $orderId
                ]);
            }

            $logQuery = "INSERT INTO `verification_logs` (`verification_id`, `admin_id`, `action`, `note`, `created_at`) 
                         VALUES (:verif_id, :admin_id, :action, :log_note, CURRENT_TIMESTAMP)";
            $stmtLog = $this->db->prepare($logQuery);
            $stmtLog->execute([
                'verif_id' => $verifId,
                'admin_id' => $adminId,
                'action'   => strtoupper($targetStatus),
                'log_note' => "Workflow eksekusi mandiri diproses dengan catatan: " . $catatanAdmin
            ]);

            $this->db->commit();
            return true;
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * LANGKAH 9: Menyimpan Dokumen Baru dari Customer & Mengarsipkan Dokumen Lama (Versioning)
     */
    public function processCustomerReuploadTransaction($verifId, $newKtpPath, $newSelfiePath, $newSupportPath) {
        try {
            $this->db->beginTransaction();

            $fetchOldQuery = "SELECT `ktp_path`, `selfie_ktp_path`, `support_document_path` 
                              FROM `document_verifications` WHERE `id` = :id LIMIT 1";
            $stmtOld = $this->db->prepare($fetchOldQuery);
            $stmtOld->execute(['id' => $verifId]);
            $oldData = $stmtOld->fetch(\PDO::FETCH_ASSOC);

            if ($oldData) {
                $countVersionQuery = "SELECT COUNT(*) as total_version FROM `verification_reuploads` WHERE `verification_id` = :id";
                $stmtCount = $this->db->prepare($countVersionQuery);
                $stmtCount->execute(['id' => $verifId]);
                $versionRes = $stmtCount->fetch(\PDO::FETCH_ASSOC);
                $nextVersionNumber = ((int)$versionRes['total_version']) + 1;

                $insertArchiveQuery = "INSERT INTO `verification_reuploads` 
                                       (`verification_id`, `version_number`, `ktp_path`, `selfie_path`, `uploaded_at`) 
                                       VALUES 
                                       (:verif_id, :v_num, :old_ktp, :old_selfie, CURRENT_TIMESTAMP)";
                $stmtArchive = $this->db->prepare($insertArchiveQuery);
                $stmtArchive->execute([
                    'verif_id'   => $verifId,
                    'v_num'      => $nextVersionNumber,
                    'old_ktp'    => $oldData['ktp_path'],
                    'old_selfie' => $oldData['selfie_ktp_path']
                ]);
            }

            $updateMainQuery = "UPDATE `document_verifications` 
                                SET `ktp_path` = :new_ktp,
                                    `selfie_ktp_path` = :new_selfie,
                                    `support_document_path` = :new_support,
                                    `status` = 'pending',
                                    `check_photo_clear` = 0,
                                    `check_name_match` = 0,
                                    `check_nik_readable` = 0,
                                    `check_not_blur` = 0,
                                    `check_not_cut` = 0,
                                    `check_not_expired` = 0,
                                    `updated_at` = CURRENT_TIMESTAMP
                                WHERE `id` = :id";
            
            $stmtUpdate = $this->db->prepare($updateMainQuery);
            $stmtUpdate->execute([
                'id'          => $verifId,
                'new_ktp'     => $newKtpPath,
                'new_selfie'  => $newSelfiePath,
                'new_support' => $newSupportPath
            ]);

            $this->db->commit();
            return true;
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function getVerificationVersionHistory($verifId) {
        $query = "SELECT `version_number`, `ktp_path`, `selfie_path`, `uploaded_at` 
                  FROM `verification_reuploads` 
                  WHERE `verification_id` = :verif_id 
                  ORDER BY `version_number` DESC";
        $statement = $this->db->prepare($query);
        $statement->execute(['verif_id' => $verifId]);
        return $statement->fetchAll(\PDO::FETCH_ASSOC);
    }

    /**
     * LANGKAH 10: Mengambil Rantai Jejak Kronologis Histori Verifikasi Dokumen Individual
     */
    public function getVerificationTimelineLogs($verificationId) {
        $query = "SELECT 
                    vl.id, vl.action, vl.note, vl.created_at, u.name as nama_admin
                  FROM `verification_logs` vl
                  LEFT JOIN `users` u ON vl.admin_id = u.id
                  WHERE vl.verification_id = :verif_id
                  ORDER BY vl.id ASC";
                  
        $statement = $this->db->prepare($query);
        $statement->execute(['verif_id' => $verificationId]);
        return $statement->fetchAll(\PDO::FETCH_ASSOC);
    }

    /**
     * LANGKAH 11: Simpan Hasil Koreksi / Penyesuaian Komparasi Data OCR ke Database MySQL
     */
    public function updateOcrExtractedFields($id, $ocrName, $ocrNik, $ocrAddress, $ocrBirth) {
        $query = "UPDATE `document_verifications` 
                  SET `ocr_name`    = :ocr_name,
                      `ocr_nik`     = :ocr_nik,
                      `ocr_address` = :ocr_address,
                      `ocr_birth`   = :ocr_birth,
                      `updated_at`  = CURRENT_TIMESTAMP
                  WHERE `id` = :id";
                  
        $statement = $this->db->prepare($query);
        return $statement->execute([
            'id'          => $id,
            'ocr_name'    => $ocrName,
            'ocr_nik'     => $ocrNik,
            'ocr_address' => $ocrAddress,
            'ocr_birth'   => $ocrBirth
        ]);
    }

    /**
     * LANGKAH 12: Periksa Apakah NIK Sudah Digunakan Oleh Akun Lain di MySQL
     */
    public function checkNikDuplicationFraud($currentVerifId, $nik, $currentUserId) {
        $query = "SELECT COUNT(*) as duplicate_count 
                  FROM `document_verifications` 
                  WHERE `nik` = :nik 
                    AND `user_id` != :user_id 
                    AND `id` != :verif_id
                    AND `status` = 'approved'";
                    
        $statement = $this->db->prepare($query);
        $statement->execute([
            'nik'      => $nik,
            'user_id'  => $currentUserId,
            'verif_id' => $currentVerifId
        ]);
        $result = $statement->fetch(\PDO::FETCH_ASSOC);
        return ((int)$result['duplicate_count'] > 0);
    }

    public function flagVerificationAsDuplicate($verifId, $isDuplicate) {
        $query = "UPDATE `document_verifications` 
                  SET `duplicate_detected` = :duplicate_flag,
                      `updated_at`         = CURRENT_TIMESTAMP
                  WHERE `id` = :id";
        $statement = $this->db->prepare($query);
        return $statement->execute([
            'id'             => $verifId,
            'duplicate_flag' => $isDuplicate ? 1 : 0
        ]);
    }

    /**
     * LANGKAH 13: Mengambil Seluruh Log Aktivitas Verifikasi Global Untuk Audit Trail Board
     */
    public function getGlobalVerificationActivityLogs() {
        $query = "SELECT 
                    vl.id, vl.action, vl.note, vl.created_at,
                    u.name as nama_admin, u.email as email_admin,
                    dv.full_name as nama_pendaki, dv.id as verif_id
                  FROM `verification_logs` vl
                  LEFT JOIN `users` u ON vl.admin_id = u.id
                  LEFT JOIN `document_verifications` dv ON vl.verification_id = dv.id
                  ORDER BY vl.id DESC 
                  LIMIT 15";
                  
        $statement = $this->db->prepare($query);
        $statement->execute();
        return $statement->fetchAll(\PDO::FETCH_ASSOC);
    }

    /**
     * LANGKAH 15: Eksekusi Batch Otorisasi Massal Terproteksi Database Transaction
     */
    public function executeBulkVerificationWorkflow($arrayIds, $adminId, $targetStatus, $catatanMassal = '') {
        if (empty($arrayIds)) return false;

        try {
            $this->db->beginTransaction();
            $placeholders = implode(',', array_fill(0, count($arrayIds), '?'));

            $fetchQuery = "SELECT `order_id` FROM `document_verifications` WHERE `id` IN ($placeholders)";
            $stmtFetch = $this->db->prepare($fetchQuery);
            $stmtFetch->execute($arrayIds);
            $orders = $stmtFetch->fetchAll(\PDO::FETCH_COLUMN);

            $verifQuery = "UPDATE `document_verifications` 
                           SET `status`      = ?, 
                               `admin_note`  = ?, 
                               `verified_by` = ?, 
                               `verified_at` = CURRENT_TIMESTAMP,
                               `updated_at`  = CURRENT_TIMESTAMP
                           WHERE `id` IN ($placeholders)";
            
            $stmtVerif = $this->db->prepare($verifQuery);
            $verifParams = array_merge([$targetStatus, $catatanMassal, $adminId], $arrayIds);
            $stmtVerif->execute($verifParams);

            if (!empty($orders)) {
                $orderStatusMapped = ($targetStatus === 'approved') ? 'Siap Diambil' : 'Upload Ulang';
                $orderPlaceholders = implode(',', array_fill(0, count($orders), '?'));
                
                $orderQuery = "UPDATE `orders` 
                               SET `status`     = ?, 
                                   `updated_at` = CURRENT_TIMESTAMP 
                               WHERE `id` IN ($orderPlaceholders)";
                               
                $stmtOrder = $this->db->prepare($orderQuery);
                $orderParams = array_merge([$orderStatusMapped], $orders);
                $stmtOrder->execute($orderParams);
            }

            foreach ($arrayIds as $id) {
                $logQuery = "INSERT INTO `verification_logs` (`verification_id`, `admin_id`, `action`, `note`, `created_at`) 
                             VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)";
                $stmtLog = $this->db->prepare($logQuery);
                $stmtLog->execute([$id, $adminId, 'BULK_' . strtoupper($targetStatus), "Eksekusi massal diproses: " . $catatanMassal]);
            }

            $this->db->commit();
            return true;
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}