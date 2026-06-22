<?php
namespace App\Services;
use App\Repositories\InventoryRepository;

class InventoryService {
    private $inventoryRepository;

    public function __construct() {
        $this->inventoryRepository = new InventoryRepository();
    }

    public function fetchKpiMetricsSummary() {
        $metrics = $this->inventoryRepository->getGlobalKpiMetricsData();
        
        return [
            'total_unit' => (int)($metrics['total_unit'] ?? 0),
            'stok_siap' => (int)($metrics['total_siap'] ?? 0),
            'stok_disewa' => (int)($metrics['total_disewa'] ?? 0),
            'stok_perawatan' => (int)($metrics['total_perawatan'] ?? 0),
            'stok_hampir_habis' => (int)($metrics['total_hampir_habis'] ?? 0),
            'stok_rusak' => (int)($metrics['total_rusak'] ?? 0),
        ];
    }
}