<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    $document_id = $_GET['document_id'] ?? '';
    $organisation_id = $_GET['id'] ?? '';

    if (empty($organisation_id) || empty($document_id)) {
        http_response_code(400);

        echo json_encode([
            "error" => true,
            "data" => "Invalid ID",
            "code" => null
        ]);

        exit;
    }

    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        http_response_code(405);

        echo json_encode([
            "error" => true,
            "data" => "Method not allowed",
            "code" => null
        ]);

        exit;
    }

    try {
        $stmt = $conn->prepare("
            SELECT
                rd.id,
                rd.original_name,
                rd.document_type
            FROM registration_documents rd
            INNER JOIN registration_requests rr
                ON rr.id = rd.registration_request_id
            INNER JOIN organisations o
                ON o.organisation_name = rr.organisation_name
            WHERE rd.id = :document_id
            AND o.id = :organisation_id
            LIMIT 1
        ");

        $stmt->execute([
            ":document_id" => $document_id,
            ":organisation_id" => $organisation_id
        ]);

        $document = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$document) {
            http_response_code(404);

            echo json_encode([
                "error" => true,
                "data" => "Document not found",
                "code" => null
            ]);

            exit;
        }

        echo json_encode([
            "error" => false,
            "data" => "Document approved",
            "code" => [
                "id" => $document_id,
                "status" => "approved"
            ]
        ]);
    } catch (Throwable $e) {
        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => $e->getMessage(),
            "code" => null
        ]);
    }