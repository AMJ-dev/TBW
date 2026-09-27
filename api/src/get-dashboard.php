<?php
require_once dirname(__DIR__, 1) . '/include/verify-user.php';
header('Content-Type: application/json');

try {
    // 1. Fetch counts for stats cards
    $counts = $conn->query("
        SELECT 
            (SELECT COUNT(*) FROM vehicles) AS totalVehicles,
            (SELECT COUNT(*) FROM brands) AS totalBrands,
            (SELECT COUNT(*) FROM faqs WHERE is_active = 1) AS totalFAQs,
            (SELECT COUNT(*) FROM news WHERE status = 'published') AS totalNews
    ")->fetch(PDO::FETCH_ASSOC);

    // 2. Fetch recent vehicles (last 5) with brand name
    $stmtVehicles = $conn->query("
        SELECT v.id, v.model, v.year, v.price_min, v.price_max, v.range_km, v.availability, b.name AS brand_name
        FROM vehicles v
        JOIN brands b ON b.id = v.brand_id
        ORDER BY v.created_at DESC
        LIMIT 5
    ");
    $vehicles = $stmtVehicles->fetchAll(PDO::FETCH_ASSOC);

    // 3. Batch fetch images for recent vehicles (fixes N+1)
    if (!empty($vehicles)) {
        $vehicleIds = array_column($vehicles, 'id');
        $placeholders = implode(',', array_fill(0, count($vehicleIds), '?'));
        
        $imgStmt = $conn->prepare("
            SELECT vehicle_id, image_url 
            FROM vehicle_images 
            WHERE vehicle_id IN ($placeholders) 
            ORDER BY sort_order ASC
        ");
        $imgStmt->execute($vehicleIds);
        
        $imagesMap = [];
        while ($img = $imgStmt->fetch(PDO::FETCH_ASSOC)) {
            $imagesMap[$img['vehicle_id']][] = $img['image_url'];
        }
        
        foreach ($vehicles as &$v) {
            $v['images'] = $imagesMap[$v['id']] ?? [];
            // Decode features JSON if needed by frontend
            if (isset($v['features'])) {
                $v['features'] = json_decode($v['features'], true) ?? [];
            }
        }
        unset($v);
    }

    // 4. Fetch recent activity logs (last 10)
    $stmtActivity = $conn->query("
        SELECT id, action, entity, entity_name, user_email, created_at
        FROM activity_logs
        ORDER BY created_at DESC
        LIMIT 10
    ");
    $recentActivity = $stmtActivity->fetchAll(PDO::FETCH_ASSOC);

    // 5. Fetch recent login logs (last 10)
    $stmtLogins = $conn->query("
        SELECT id, user_id, email, ip_address, os, browser, device_type, created_at
        FROM login_logs
        ORDER BY created_at DESC
        LIMIT 10
    ");
    $recentLogins = $stmtLogins->fetchAll(PDO::FETCH_ASSOC);

    // 6. Build and return response
    $data = [
        'totalVehicles'  => (int)($counts['totalVehicles'] ?? 0),
        'totalBrands'    => (int)($counts['totalBrands'] ?? 0),
        'totalFAQs'      => (int)($counts['totalFAQs'] ?? 0),
        'totalNews'      => (int)($counts['totalNews'] ?? 0),
        'recentVehicles' => $vehicles,
        'recentActivity' => $recentActivity,
        'recentLogins'   => $recentLogins
    ];

    echo json_encode(['error' => false, 'data' => $data]);

} catch (PDOException $e) {
    error_log("Dashboard fetch error: " . $e->getMessage());
    echo json_encode(['error' => true, 'message' => 'Failed to load dashboard data.']);
}