<?php
    require_once __DIR__ . "/include/conn.php";

    try {
        $conn->beginTransaction();

        $lanes = [
            [
                "code" => "GIN-01",
                "name" => "Inbound Lane 1",
                "direction" => "IN",
                "gate_name" => "North Entry Gate",
                "description" => "Primary inbound lane for scheduled container trucks."
            ],
            [
                "code" => "GIN-02",
                "name" => "Inbound Lane 2",
                "direction" => "IN",
                "gate_name" => "North Entry Gate",
                "description" => "Inbound lane for general cargo and container deliveries."
            ],
            [
                "code" => "GIN-03",
                "name" => "Inbound Inspection Lane",
                "direction" => "IN",
                "gate_name" => "Inspection Entry Gate",
                "description" => "Inbound lane for trucks requiring additional entry inspection."
            ],
            [
                "code" => "GIN-04",
                "name" => "Inbound Priority Lane",
                "direction" => "IN",
                "gate_name" => "North Entry Gate",
                "description" => "Priority inbound lane for authorised operational movements."
            ],
            [
                "code" => "GOUT-01",
                "name" => "Outbound Lane 1",
                "direction" => "OUT",
                "gate_name" => "South Exit Gate",
                "description" => "Primary outbound lane for authorised cargo departures."
            ],
            [
                "code" => "GOUT-02",
                "name" => "Outbound Lane 2",
                "direction" => "OUT",
                "gate_name" => "South Exit Gate",
                "description" => "Outbound lane for released containers and cargo."
            ],
            [
                "code" => "GOUT-03",
                "name" => "Outbound Inspection Lane",
                "direction" => "OUT",
                "gate_name" => "Inspection Exit Gate",
                "description" => "Outbound lane for trucks requiring departure inspection."
            ],
            [
                "code" => "GOUT-04",
                "name" => "Outbound Priority Lane",
                "direction" => "OUT",
                "gate_name" => "South Exit Gate",
                "description" => "Priority outbound lane for authorised departures."
            ],
            [
                "code" => "GB-01",
                "name" => "Interchange Lane 1",
                "direction" => "BOTH",
                "gate_name" => "Central Gate",
                "description" => "Shared lane for approved inbound and outbound movements."
            ],
            [
                "code" => "GB-02",
                "name" => "Interchange Lane 2",
                "direction" => "BOTH",
                "gate_name" => "Central Gate",
                "description" => "Shared lane for overflow traffic and authorised movements."
            ]
        ];

        $check = $conn->prepare("
            SELECT id
            FROM gate_lanes
            WHERE code = ?
            LIMIT 1
        ");

        $insert = $conn->prepare("
            INSERT INTO gate_lanes (
                id,
                code,
                name,
                direction,
                gate_name,
                description,
                status,
                created_at,
                updated_at
            ) VALUES (
                ?, ?, ?, ?, ?, ?, 'ACTIVE', NOW(), NOW()
            )
        ");

        $inserted = 0;
        $skipped = 0;

        foreach ($lanes as $lane) {
            $check->execute([$lane["code"]]);

            if ($check->fetch(PDO::FETCH_ASSOC)) {
                $skipped++;
                continue;
            }

            $id = generateId();

            $insert->execute([
                $id,
                $lane["code"],
                $lane["name"],
                $lane["direction"],
                $lane["gate_name"],
                $lane["description"]
            ]);

            $inserted++;
        }

        $conn->commit();

        echo json_encode([
            "error" => false,
            "data" => [
                "message" => "Gate lanes seeded successfully.",
                "inserted" => $inserted,
                "skipped" => $skipped
            ],
            "code" => null
        ], JSON_PRETTY_PRINT);

    } catch (Throwable $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => "Could not seed gate lanes.",
            "code" => null
        ]);
    }