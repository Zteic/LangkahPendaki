<?php
namespace App\Services;

use App\Repositories\ReportRepository;

class ReportService {
    private $repository;

    public function __construct() {
        $this->repository = new ReportRepository();
    }

    public function fetchGlobalReportingKpi() {
        $data = $this->repository->getGlobalReportKpiMetrics();
        return [
            'total_pendapatan' => (float)($data['total_pendapatan'] ?? 0),
            'total_penyewaan'   => (int)($data['total_penyewaan'] ?? 0),
            'total_pelanggan'   => (int)($data['total_pelanggan'] ?? 0),
            'total_denda'       => (float)($data['total_denda'] ?? 0)
        ];
    }

    public function fetchFilteredReportsData($kataKunci, $periode, $jenisLaporan, $startDate = null, $endDate = null) {
        return $this->repository->getFilteredAndSearchedReports($kataKunci, $periode, $jenisLaporan, $startDate, $endDate);
    }

    public function getDetailedAuditRecord($orderId) {
        return $this->repository->getDeepReportDetailById($orderId);
    }

    public function logExportAuditTrail($userId, $exportType, $period, $type, $count) {
        return $this->repository->logReportExportActivity($userId, $exportType, $period, $type, $count);
    }
}