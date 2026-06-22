<?php
namespace App\Controllers\Admin;
use App\Services\InventoryService;

class AdminInventoryController {
    private $inventoryService;

    public function __construct() {
        $this->inventoryService = new InventoryService();
    }

    // Endpoint GET /api/admin/inventory/kpi-metrics
    public function getKpiMetricsApi() {
        header('Content-Type: application/json');
        try {
            $data = $this->inventoryService->fetchKpiMetricsSummary();
            echo json_encode(['status' => 'success', 'data' => $data]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        exit();
    }
}