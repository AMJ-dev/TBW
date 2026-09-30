<?php
    require_once dirname(__DIR__, 2)."/include/verify-user.php";
    try {

        if (isset($_POST["remove"]) && $_POST["remove"] === "1") {

            if (!empty($my_details->pics)) {
                $old_file = dirname(__DIR__, 3) . "/" . ltrim($my_details->pics, "/");

                if (is_file($old_file)) {
                    unlink($old_file);
                }
            }

            $stmt = $conn->prepare("
                UPDATE users
                SET pics = NULL,
                    updated_at = NOW()
                WHERE id = :user_id
                LIMIT 1
            ");

            $stmt->execute([
                ":user_id" => $my_details->id
            ]);

            echo json_encode([
                "error" => false,
                "data" => "Profile photo removed successfully.",
                "code" => [
                    "pics" => null
                ]
            ]);

            exit;
        }

        if (!isset($_FILES["avatar"])) {
            echo json_encode([
                "error" => true,
                "data" => "No profile photo was uploaded.",
                "code" => []
            ]);
            exit;
        }

        $upload = upload_files($_FILES["avatar"], $img_accept);

        if ($upload["error"]) {
            echo json_encode([
                "error" => true,
                "data" => $upload["data"],
                "code" => []
            ]);
            exit;
        }

        $new_path = $upload["data"];

        $stmt = $conn->prepare("
            UPDATE users
            SET pics = :pics,
                updated_at = NOW()
            WHERE id = :user_id
            LIMIT 1
        ");

        $stmt->execute([
            ":pics" => $new_path,
            ":user_id" => $my_details->id
        ]);

        if (!empty($my_details->pics)) {
            $old_file = dirname(__DIR__, 3) . "/" . ltrim($my_details->pics, "/");

            if (is_file($old_file) && $old_file !== dirname(__DIR__, 3) . "/" . $new_path) {
                unlink($old_file);
            }
        }

        echo json_encode([
            "error" => false,
            "data" => "Profile photo updated successfully.",
            "code" => [
                "pics" => $new_path
            ]
        ]);

    } catch (Throwable $e) {

        error_log("Profile avatar error: " . $e->getMessage());

        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => "An error occurred while updating your profile photo.",
            "code" => []
        ]);
    }