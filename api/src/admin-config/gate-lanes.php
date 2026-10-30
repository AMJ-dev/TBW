<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        if (!in_array($_SERVER["REQUEST_METHOD"], ["GET", "POST"], true)) {
            echo json_encode([
                "error" => true,
                "data" => "Method not allowed.",
                "code" => null
            ]);
            exit;
        }

        $where = strtolower(trim((string) ($_POST["where"] ?? "")));

        if (!in_array($where, ["", "in", "out"], true)) {
            echo json_encode([
                "error" => true,
                "data" => "Invalid gate direction. Use 'in' or 'out'.",
                "code" => null
            ]);
            exit;
        }

        $sql = "
            SELECT
                id,
                code,
                name,
                direction,
                gate_name,
                description,
                status,
                change_reason,
                created_at,
                updated_at
            FROM gate_lanes
        ";

        if ($where !== "") {
            $direction = strtoupper($where);

            $sql .= "
                WHERE direction IN (:direction, :both)
                AND status = :status
            ";
        }

        $sql .= " ORDER BY created_at DESC";

        $stmt = $conn->prepare($sql);

        if ($where !== "") {
            $stmt->bindValue(":direction", $direction, PDO::PARAM_STR);
            $stmt->bindValue(":both", "BOTH", PDO::PARAM_STR);
            $stmt->bindValue(":status", "active", PDO::PARAM_STR);
        }

        $stmt->execute();
        $lanes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "error" => false,
            "data" => [
                "gate_lanes" => $lanes
            ],
            "code" => [
                "gate_lanes" => $lanes
            ]
        ]);
    } catch (Throwable $e) {
        echo json_encode([
            "error" => true,
            "data" => "Could not load gate lane configuration.",
            "code" => null
        ]);
    }