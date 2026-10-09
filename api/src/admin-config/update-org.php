<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    $saved = [];
    $oldFiles = [];

    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        http_response_code(405);
        echo json_encode(["error" => true, "data" => "Method not allowed", "code" => null]);
        exit;
    }

    try {
        $q = $conn->prepare("SELECT role_key FROM roles WHERE id = :id AND scope = 'system' AND is_active = 1 LIMIT 1");
        $q->bindValue(":id", $my_details->system_role_id);
        $q->execute();
        $role = $q->fetch(PDO::FETCH_ASSOC);

        if (!$role || $role["role_key"] !== "system_admin") {
            http_response_code(403);
            echo json_encode(["error" => true, "data" => "Access denied", "code" => null]);
            exit;
        }

        $id = trim($_POST["organisation_id"] ?? $_GET["id"] ?? "");
        $legal = trim($_POST["legal_name"] ?? "");
        $type = trim($_POST["org_type"] ?? "terminal");
        $date = trim($_POST["date_of_incorporation"] ?? "");
        $email = trim($_POST["contact_email"] ?? "");
        $licences = json_decode($_POST["licences"] ?? "[]", true);

        if ($legal === "") {
            http_response_code(400);
            echo json_encode(["error" => true, "data" => "Legal name is required", "code" => null]);
            exit;
        }

        if (!in_array($type, ["terminal", "importer", "agent"], true)) {
            http_response_code(400);
            echo json_encode(["error" => true, "data" => "Invalid organisation type", "code" => null]);
            exit;
        }

        if ($email !== "" && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(["error" => true, "data" => "Contact email is not valid", "code" => null]);
            exit;
        }

        if ($date !== "" && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            http_response_code(400);
            echo json_encode(["error" => true, "data" => "Invalid date of incorporation", "code" => null]);
            exit;
        }

        if (!is_array($licences)) {
            http_response_code(400);
            echo json_encode(["error" => true, "data" => "Invalid licence data", "code" => null]);
            exit;
        }

        if ($id !== "") {
            $q = $conn->prepare("SELECT id FROM organisations WHERE id = :id LIMIT 1");
            $q->bindValue(":id", $id);
        } else {
            $q = $conn->prepare("SELECT id FROM organisations WHERE organisation_type = 'terminal' ORDER BY created_at ASC LIMIT 1");
        }

        $q->execute();
        $org = $q->fetch(PDO::FETCH_ASSOC);

        if (!$org) {
            http_response_code(404);
            echo json_encode(["error" => true, "data" => "Organisation not found", "code" => null]);
            exit;
        }

        $id = $org["id"];
        $slots = ["cac", "tin", "signatory_id", "directors_list", "utility_bill"];
        $licenceTypes = ["ncs_customs_agent", "nafdac", "son", "naqs", "soncap", "other"];
        $mimeTypes = ["application/pdf" => "pdf", "image/jpeg" => "jpg", "image/png" => "png", "image/webp" => "webp"];
        $pdfSlots = ["directors_list"];
        $uploads = [];

        foreach ($slots as $kind) {
            if (!isset($_FILES[$kind]) || $_FILES[$kind]["error"] === UPLOAD_ERR_NO_FILE) {
                continue;
            }

            $file = $_FILES[$kind];

            if ($file["error"] !== UPLOAD_ERR_OK || $file["size"] < 1 || $file["size"] > 5 * 1024 * 1024) {
                throw new RuntimeException("Invalid file for " . $kind);
            }

            $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file["tmp_name"]);

            if (!isset($mimeTypes[$mime]) || (in_array($kind, $pdfSlots, true) && $mime !== "application/pdf")) {
                throw new RuntimeException("Unsupported file type for " . $kind);
            }

            $uploads[] = [
                "kind" => $kind,
                "file" => $file,
                "mime" => $mime,
                "extension" => $mimeTypes[$mime]
            ];
        }

        foreach ($licences as $index => $licence) {
            $fileKey = "licence_file_" . $index;
            $idKey = "licence_id_" . $index;
            $file = $_FILES[$fileKey] ?? null;
            $licenceId = trim($_POST[$idKey] ?? "");

            if (!is_array($licence) || $licenceId === "" || $licenceId !== trim($licence["id"] ?? "")) {
                throw new RuntimeException("Invalid licence entry");
            }

            $licenceType = trim($licence["licence_type"] ?? "");
            $reference = trim($licence["licence_reference"] ?? "");

            if (!in_array($licenceType, $licenceTypes, true) || $reference === "") {
                throw new RuntimeException("Each licence needs a valid type and reference number");
            }

            if (!$file || $file["error"] !== UPLOAD_ERR_OK || $file["size"] < 1 || $file["size"] > 5 * 1024 * 1024) {
                throw new RuntimeException("Each new licence needs a valid file under 5MB");
            }

            $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file["tmp_name"]);

            if (!isset($mimeTypes[$mime])) {
                throw new RuntimeException("Unsupported licence file type");
            }

            $uploads[] = [
                "kind" => "licence",
                "file" => $file,
                "mime" => $mime,
                "extension" => $mimeTypes[$mime],
                "licence_type" => $licenceType,
                "licence_reference" => $reference,
                "licence_id" => $licenceId
            ];
        }

        $root = dirname(__DIR__, 2);
        $dir = $root . "/uploads";

        if (!is_dir($dir) && !mkdir($dir, 0750, true) && !is_dir($dir)) {
            throw new RuntimeException("Could not create upload directory");
        }

        foreach ($uploads as $index => $upload) {
            $name = bin2hex(random_bytes(24)) . "." . $upload["extension"];
            $path = $dir . "/" . $name;

            if (!move_uploaded_file($upload["file"]["tmp_name"], $path)) {
                throw new RuntimeException("Could not save uploaded file");
            }

            $saved[] = $path;
            $uploads[$index]["path"] = "uploads/" . $name;
        }

        $conn->beginTransaction();

        $q = $conn->prepare("UPDATE organisations SET organisation_name = :legal_name, trading_name = :trading_name, organisation_type = :org_type, rc_number = :rc_number, tin = :tin, date_of_incorporation = :date_of_incorporation, sector = :sector, registered_address = :registered_address, operating_address = :operating_address, website = :website, contact_email = :contact_email, contact_phone = :contact_phone, contact_person = :contact_person, contact_person_title = :contact_person_title, updated_at = NOW() WHERE id = :id");
        $q->bindValue(":legal_name", $legal);
        $q->bindValue(":trading_name", trim($_POST["trading_name"] ?? ""));
        $q->bindValue(":org_type", $type);
        $q->bindValue(":rc_number", trim($_POST["rc_number"] ?? ""));
        $q->bindValue(":tin", trim($_POST["tin"] ?? ""));
        $q->bindValue(":date_of_incorporation", $date === "" ? null : $date, $date === "" ? PDO::PARAM_NULL : PDO::PARAM_STR);
        $q->bindValue(":sector", trim($_POST["sector"] ?? ""));
        $q->bindValue(":registered_address", trim($_POST["registered_address"] ?? ""));
        $q->bindValue(":operating_address", trim($_POST["operating_address"] ?? ""));
        $q->bindValue(":website", trim($_POST["website"] ?? ""));
        $q->bindValue(":contact_email", $email);
        $q->bindValue(":contact_phone", trim($_POST["contact_phone"] ?? ""));
        $q->bindValue(":contact_person", trim($_POST["contact_person"] ?? ""));
        $q->bindValue(":contact_person_title", trim($_POST["contact_person_title"] ?? ""));
        $q->bindValue(":id", $id);
        $q->execute();

        foreach ($uploads as $upload) {
            $kind = $upload["kind"];
            $file = $upload["file"];

            if ($kind !== "licence") {
                $q = $conn->prepare("SELECT rd.id, rd.file_path FROM registration_documents rd LEFT JOIN organisation_document_reviews odr ON odr.registration_document_id = rd.id LEFT JOIN registration_requests rr ON rr.id = rd.registration_request_id LEFT JOIN users owner ON owner.id = rr.completed_user_id WHERE rd.document_type = :kind AND (odr.organisation_id = :review_org OR owner.organisation_id = :owner_org) LIMIT 1");
                $q->bindValue(":kind", $kind);
                $q->bindValue(":review_org", $id);
                $q->bindValue(":owner_org", $id);
                $q->execute();
                $existing = $q->fetch(PDO::FETCH_ASSOC);

                if ($existing) {
                    $oldFiles[] = $root . "/" . ltrim($existing["file_path"], "/");
                    $q = $conn->prepare("UPDATE registration_documents SET file_path = :path, original_name = :name, mime_type = :mime, file_size = :size, created_at = NOW() WHERE id = :id");
                    $q->bindValue(":path", $upload["path"]);
                    $q->bindValue(":name", basename($file["name"]));
                    $q->bindValue(":mime", $upload["mime"]);
                    $q->bindValue(":size", $file["size"], PDO::PARAM_INT);
                    $q->bindValue(":id", $existing["id"]);
                    $q->execute();

                    $q = $conn->prepare("UPDATE organisation_document_reviews SET status = 'pending', rejection_reason = NULL, reviewed_by = NULL, reviewed_at = NULL, updated_at = NOW() WHERE registration_document_id = :id");
                    $q->bindValue(":id", $existing["id"]);
                    $q->execute();

                    if ($q->rowCount() === 0) {
                        $q = $conn->prepare("SELECT id FROM organisation_document_reviews WHERE registration_document_id = :id LIMIT 1");
                        $q->bindValue(":id", $existing["id"]);
                        $q->execute();

                        if (!$q->fetch(PDO::FETCH_ASSOC)) {
                            $q = $conn->prepare("INSERT INTO organisation_document_reviews (id, registration_document_id, organisation_id, status) VALUES (:id, :doc_id, :org_id, 'pending')");
                            $q->bindValue(":id", generateId());
                            $q->bindValue(":doc_id", $existing["id"]);
                            $q->bindValue(":org_id", $id);
                            $q->execute();
                        }
                    }

                    continue;
                }
            }

            $docId = generateId();

            $q = $conn->prepare("INSERT INTO registration_documents (id, registration_request_id, document_type, licence_type, licence_reference, file_path, original_name, mime_type, file_size) VALUES (:id, NULL, :kind, :licence_type, :licence_reference, :path, :name, :mime, :size)");
            $q->bindValue(":id", $docId);
            $q->bindValue(":kind", $kind);
            $q->bindValue(":licence_type", $upload["licence_type"] ?? null);
            $q->bindValue(":licence_reference", $upload["licence_reference"] ?? null);
            $q->bindValue(":path", $upload["path"]);
            $q->bindValue(":name", basename($file["name"]));
            $q->bindValue(":mime", $upload["mime"]);
            $q->bindValue(":size", $file["size"], PDO::PARAM_INT);
            $q->execute();

            $q = $conn->prepare("INSERT INTO organisation_document_reviews (id, registration_document_id, organisation_id, status) VALUES (:id, :doc_id, :org_id, 'pending')");
            $q->bindValue(":id", generateId());
            $q->bindValue(":doc_id", $docId);
            $q->bindValue(":org_id", $id);
            $q->execute();
        }

        $q = $conn->prepare("INSERT INTO organisation_audit_logs (id, organisation_id, user_id, action, details, ip_address, user_agent) VALUES (:id, :org_id, :user_id, :action, :details, :ip, :agent)");
        $q->bindValue(":id", generateId());
        $q->bindValue(":org_id", $id);
        $q->bindValue(":user_id", $my_details->id);
        $q->bindValue(":action", "organisation.configuration_updated");
        $q->bindValue(":details", json_encode(["legal_name" => $legal, "uploaded_files" => count($uploads)], JSON_UNESCAPED_SLASHES));
        $q->bindValue(":ip", $_SERVER["REMOTE_ADDR"] ?? null);
        $q->bindValue(":agent", substr($_SERVER["HTTP_USER_AGENT"] ?? "", 0, 500));
        $q->execute();

        $conn->commit();

        foreach ($oldFiles as $path) {
            if (is_file($path)) {
                unlink($path);
            }
        }

        echo json_encode([
            "error" => false,
            "data" => "Organisation configuration saved",
            "code" => ["organisation_id" => $id]
        ]);
    } catch (Throwable $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        foreach ($saved as $path) {
            if (is_file($path)) {
                unlink($path);
            }
        }

        http_response_code(500);
        echo json_encode(["error" => true, "data" => $e->getMessage(), "code" => null]);
    }