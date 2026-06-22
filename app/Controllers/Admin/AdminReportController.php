<?php
namespace App\Controllers\Admin;

use App\Services\ReportService;

class AdminReportController {
    private $service;

    public function __construct() {
        $this->service = new ReportService();
    }

    public function getKpiMetrics() {
        header('Content-Type: application/json');
        try {
            $metrics = $this->service->fetchGlobalReportingKpi();
            echo json_encode(['status' => 'success', 'data' => $metrics]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        exit();
    }

    public function getFilteredReportsApi() {
        header('Content-Type: application/json');
        try {
            $kataKunci = $_GET['q'] ?? '';
            $periode = $_GET['period'] ?? 'Semua';
            $jenisLaporan = $_GET['type'] ?? 'Semua';
            $startDate = $_GET['start_date'] ?? null;
            $endDate = $_GET['end_date'] ?? null;

            $data = $this->service->fetchFilteredReportsData($kataKunci, $periode, $jenisLaporan, $startDate, $endDate);
            echo json_encode(['status' => 'success', 'count' => count($data), 'data' => $data]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        exit();
    }

    public function getReportDetailDataApi() {
        header('Content-Type: application/json');
        try {
            $id = $_GET['id'] ?? null;
            if (!$id) throw new \Exception("ID Laporan penyewaan wajib dilampirkan.");

            $detailData = $this->service->getDetailedAuditRecord((int)$id);
            echo json_encode(['status' => 'success', 'data' => $detailData]);
        } catch (\Exception $e) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        exit();
    }

    public function logReportExportApi() {
        header('Content-Type: application/json');
        try {
            $inputData = json_decode(file_get_contents('php://input'), true);
            $exportType = $inputData['export_type'] ?? null;
            $filterPeriod = $inputData['filter_period'] ?? 'Semua';
            $filterType = $inputData['filter_type'] ?? 'Semua';
            $totalRecord = $inputData['total_record'] ?? 0;
            $userId = 1;

            $this->service->logExportAuditTrail($userId, $exportType, $filterPeriod, $filterType, (int)$totalRecord);
            echo json_encode(['status' => 'success', 'message' => 'Histori ekspor laporan tersimpan di MySQL.']);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        exit();
    }
}