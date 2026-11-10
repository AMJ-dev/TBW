
<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

$organisation_id = $my_details->organisation_id ?? null;
$actor = $my_details->id ?? null;

$name = trim($_POST["name"] ?? "");
$phone = trim($_POST["phone"] ?? "");
$licence_number = trim($_POST["licence_number"] ?? "");
$licence_class = trim($_POST["licence_class"] ?? "");
$licence_expiry = trim($_POST["licence_expiry"] ?? "");
$assigned_vehicle = trim($_POST["assigned_vehicle"] ?? "");
$transporter = trim($_POST["transporter"] ?? "");
$notes = trim($_POST["notes"] ?? "");

if (!$organisation_id) {
    echo json_encode([
        "error" => true,
        "data" => "Organisation not found.",
        "code" => null
    ]);
    exit;
}

if ($name === "" || $phone === "" || $licence_number === "") {
    echo json_encode([
        "error" => true,
        "data" => "Name, phone, and licence number are required.",
        "code" => null
    ]);
    exit;
}

if ($licence_expiry !== "") {
    $date = DateTime::createFromFormat("!Y-m-d", $licence_expiry);

    if (!$date || $date->format("Y-m-d") !== $licence_expiry) {
        echo json_encode([
            "error" => true,
            "data" => "Invalid licence expiry date.",
            "code" => null
        ]);
        exit;
    }
}

$accepted = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp"
];

$licence_file = $_FILES["licence_document"] ?? null;

if (!$licence_file || $licence_file["error"] === UPLOAD_ERR_NO_FILE) {
    echo json_encode([
        "error" => true,
        "data" => "Driver licence document is required.",
        "code" => null
    ]);
    exit;
}

if ($licence_file["error"] !== UPLOAD_ERR_OK) {
    echo json_encode([
        "error" => true,
        "data" => "Could not upload driver licence.",
        "code" => null
    ]);
    exit;
}

if ($licence_file["size"] > 10 * 1024 * 1024) {
    echo json_encode([
        "error" => true,
        "data" => "Driver licence must not exceed 10MB.",
        "code" => null
    ]);
    exit;
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime_type = $finfo->file($licence_file["tmp_name"]);

if (!in_array($mime_type, $accepted, true)) {
    echo json_encode([
        "error" => true,
        "data" => "Only PDF, JPG, PNG, and WEBP files are allowed.",
        "code" => null
    ]);
    exit;
}

$licence_file["type"] = $mime_type;

$licence_document = null;
$uploaded_path = null;

try {
    $conn->beginTransaction();

    $stmt = $conn->prepare("
        SELECT id
        FROM gate_drivers
        WHERE licence_number = :licence_number
        AND organisation_id = :organisation_id
        LIMIT 1
        FOR UPDATE
    ");

    $stmt->execute([
        ":licence_number" => $licence_number,
        ":organisation_id" => $organisation_id
    ]);

    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        $conn->rollBack();

        echo json_encode([
            "error" => true,
            "data" => "This licence number is already registered.",
            "code" => null
        ]);
        exit;
    }

    $upload_result = upload_files($licence_file, $accepted);

    if ($upload_result["error"]) {
        $conn->rollBack();

        echo json_encode([
            "error" => true,
            "data" => $upload_result["data"],
            "code" => null
        ]);
        exit;
    }

    $licence_document = $upload_result["data"];
    $uploaded_path = dirname(__DIR__, 1) . "/" . $licence_document;

    $id = generateId();

    $stmt = $conn->prepare("
        INSERT INTO gate_drivers (
            id,
            organisation_id,
            name,
            phone,
            licence_number,
            licence_class,
            licence_expiry,
            assigned_vehicle,
            transporter,
            notes,
            licence_document,
            status,
            created_by,
            updated_by
        ) VALUES (
            :id,
            :organisation_id,
            :name,
            :phone,
            :licence_number,
            :licence_class,
            :licence_expiry,
            :assigned_vehicle,
            :transporter,
            :notes,
            :licence_document,
            :status,
            :created_by,
            :updated_by
        )
    ");

    $stmt->execute([
        ":id" => $id,
        ":organisation_id" => $organisation_id,
        ":name" => $name,
        ":phone" => $phone,
        ":licence_number" => $licence_number,
        ":licence_class" => $licence_class ?: null,
        ":licence_expiry" => $licence_expiry ?: null,
        ":assigned_vehicle" => $assigned_vehicle ?: null,
        ":transporter" => $transporter ?: null,
        ":notes" => $notes ?: null,
        ":licence_document" => $licence_document,
        ":status" => "Pending review",
        ":created_by" => $actor,
        ":updated_by" => $actor
    ]);

    $stmt = $conn->prepare("
        INSERT INTO gate_driver_action_logs (
            id,
            driver_id,
            action,
            new_status,
            actor_id
        ) VALUES (
            :id,
            :driver_id,
            :action,
            :new_status,
            :actor_id
        )
    ");

    $stmt->execute([
        ":id" => generateId(),
        ":driver_id" => $id,
        ":action" => "created",
        ":new_status" => "Pending review",
        ":actor_id" => $actor
    ]);

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => "Driver registered successfully.",
        "code" => [
            "id" => $id,
            "licence_document" => $licence_document,
            "status" => "Pending review"
        ]
    ]);
} catch (PDOException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    if ($uploaded_path && is_file($uploaded_path)) {
        unlink($uploaded_path);
    }

    $message = $e->getCode() === "23000"
        ? "This licence number is already registered."
        : "Could not save driver.";

    echo json_encode([
        "error" => true,
        "data" => $message,
        "code" => null
    ]);
} catch (Throwable $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    if ($uploaded_path && is_file($uploaded_path)) {
        unlink($uploaded_path);
    }

    echo json_encode([
        "error" => true,
        "data" => "Could not save driver.",
        "code" => null
    ]);
}
