<?php
require_once dirname(__DIR__, 1) . '/include/conn.php';
header('Content-Type: application/json');

try {
    // 1. Fetch partner brands (all active brands)
    $stmtBrands = $conn->query("
        SELECT id, name, country, logo 
        FROM brands 
        ORDER BY name ASC
    ");
    $partnerBrands = $stmtBrands->fetchAll(PDO::FETCH_ASSOC);

    // 2. Fetch featured vehicles (LIMIT 8) with brand name
    $stmtVehicles = $conn->prepare("
        SELECT v.id, v.model, v.price_min, v.price_max, v.range_km, v.acceleration, b.name AS brand_name
        FROM vehicles v
        JOIN brands b ON b.id = v.brand_id
        WHERE v.featured = 1
        ORDER BY v.created_at DESC
        LIMIT 8
    ");
    $stmtVehicles->execute();
    $vehicles = $stmtVehicles->fetchAll(PDO::FETCH_ASSOC);

    // 3. Fallback: If no featured vehicles, get random vehicles
    if (empty($vehicles)) {
        $stmtRandom = $conn->query("
            SELECT v.id, v.model, v.price_min, v.price_max, v.range_km, v.acceleration, b.name AS brand_name
            FROM vehicles v
            JOIN brands b ON b.id = v.brand_id
            ORDER BY RAND()
            LIMIT 8
        ");
        $vehicles = $stmtRandom->fetchAll(PDO::FETCH_ASSOC);
    }

    // 4. Batch fetch images for vehicles (fixes N+1)
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
            if (!isset($imagesMap[$img['vehicle_id']])) {
                $imagesMap[$img['vehicle_id']] = $img['image_url']; // Only first image for cards
            }
        }
        
        foreach ($vehicles as &$v) {
            $v['image'] = $imagesMap[$v['id']] ?? '/placeholder-vehicle.jpg';
            // Format price range
            if ($v['price_min'] && $v['price_max']) {
                $v['price'] = '₦' . number_format($v['price_min']) . ' - ₦' . number_format($v['price_max']);
            } elseif ($v['price_min']) {
                $v['price'] = 'From ₦' . number_format($v['price_min']);
            } else {
                $v['price'] = 'Contact for Price';
            }
            // Map fields to frontend expected keys
            $v['brand'] = $v['brand_name'];
            $v['range'] = $v['range_km'] . ' km';
            unset($v['brand_name'], $v['price_min'], $v['price_max'], $v['range_km']);
        }
        unset($v);
    }

    // 5. Fetch published news articles (LIMIT 3)
    $stmtNews = $conn->query("
        SELECT id, title, excerpt, category, read_time, image_url, created_at
        FROM news 
        WHERE status = 'published'
        ORDER BY created_at DESC
        LIMIT 3
    ");
    $newsRaw = $stmtNews->fetchAll(PDO::FETCH_ASSOC);
    
    $newsArticles = [];
    foreach ($newsRaw as $n) {
        $date = new DateTime($n['created_at']);
        $newsArticles[] = [
            'id' => $n['id'],
            'title' => $n['title'],
            'excerpt' => $n['excerpt'],
            'category' => $n['category'],
            'date' => $date->format('M d, Y'),
            'readTime' => $n['read_time'] ?? '5 min read',
            'image' => $n['image_url'] ?? '/placeholder-news.jpg'
        ];
    }

    // 6. Fetch active FAQs (LIMIT 4)
    $stmtFAQs = $conn->query("
        SELECT id, question, answer 
        FROM faqs 
        WHERE is_active = 1 
        ORDER BY id ASC 
        LIMIT 4
    ");
    $faqItems = $stmtFAQs->fetchAll(PDO::FETCH_ASSOC);

    // 7. Static stats data
    $stats = [
        ['value' => '250+', 'label' => 'Happy Customers', 'icon' => 'Users', 'trend' => '+12% this month'],
        ['value' => '50+', 'label' => 'Vehicles Imported', 'icon' => 'Car', 'trend' => 'Growing weekly'],
        ['value' => '5', 'label' => 'Partner Brands', 'icon' => 'Globe', 'trend' => 'Expanding'],
        ['value' => '98%', 'label' => 'Satisfaction Rate', 'icon' => 'ThumbsUp', 'trend' => 'Top rated'],
        ['value' => '1,100km', 'label' => 'Max Range', 'icon' => 'Battery', 'trend' => 'Industry leading']
    ];

    // 8. Static benefits data
    $benefits = [
        [
            'icon' => 'Shield',
            'title' => 'Certified Imports',
            'desc' => 'Every vehicle undergoes rigorous inspection before delivery',
            'gradient' => 'from-emerald-500 to-green-500'
        ],
        [
            'icon' => 'HeadphonesIcon',
            'title' => '24/7 Support',
            'desc' => 'Dedicated customer service team always ready to help',
            'gradient' => 'from-blue-500 to-cyan-500'
        ],
        [
            'icon' => 'Wrench',
            'title' => 'Full Warranty',
            'desc' => 'Comprehensive coverage including battery and powertrain',
            'gradient' => 'from-purple-500 to-indigo-500'
        ],
        [
            'icon' => 'Truck',
            'title' => 'Doorstep Delivery',
            'desc' => 'We deliver your EV anywhere in Nigeria, fully charged',
            'gradient' => 'from-orange-500 to-red-500'
        ]
    ];

    // 9. Static testimonials data
    $testimonials = [
        [
            'name' => 'Chioma Adebayo',
            'role' => 'Lagos Business Owner',
            'content' => 'The BYD Atto 3 I imported has saved me over ₦200k monthly on fuel. The team handled everything seamlessly.',
            'rating' => 5
        ],
        [
            'name' => 'Ibrahim Musa',
            'role' => 'Abuja Tech Executive',
            'content' => 'Professional service from consultation to delivery. My Tesla Model Y arrived in perfect condition.',
            'rating' => 5
        ],
        [
            'name' => 'Grace Okonkwo',
            'role' => 'Port Harcourt Doctor',
            'content' => 'Best decision for my daily commute. Zero emissions, zero regrets. Highly recommend EVCARSNG!',
            'rating' => 5
        ]
    ];

    // 10. Build and return response
    $data = [
        'partnerBrands'   => $partnerBrands,
        'featuredVehicles'=> $vehicles,
        'newsArticles'    => $newsArticles,
        'faqItems'        => $faqItems,
        'stats'           => $stats,
        'benefits'        => $benefits,
        'testimonials'    => $testimonials
    ];

    echo json_encode(['error' => false, 'data' => $data]);

} catch (PDOException $e) {
    error_log("Home page data fetch error: " . $e->getMessage());
    echo json_encode(['error' => true, 'message' => 'Failed to load home page data.']);
}