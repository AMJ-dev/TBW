<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    header("Content-Type: application/json; charset=UTF-8");

    try {
        $sql = "
            SELECT
                a.id,
                a.organisation_id,
                a.appointment_date,
                a.slot_time,
                a.status,
                a.created_by,
                o.organisation_name,
                o.contact_person,
                o.contact_email,
                o.contact_phone,
                v.plate AS vehicle_plate,
                v.plate AS vehicle_number,
                d.name AS driver_name,
                d.phone AS driver_phone,
                (
                    SELECT GROUP_CONCAT(
                        ac.container_no
                        ORDER BY ac.container_no
                        SEPARATOR ', '
                    )
                    FROM gate_appointment_containers ac
                    WHERE ac.appointment_id = a.id
                ) AS container_nos
            FROM gate_appointments a
            LEFT JOIN organisations o
                ON o.id = a.organisation_id
            LEFT JOIN gate_vehicles v
                ON v.id = a.vehicle_id
            LEFT JOIN gate_drivers d
                ON d.id = a.driver_id
            ORDER BY
                a.appointment_date DESC,
                a.slot_time DESC
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute();

        $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($appointments as &$appointment) {
            $appointment["appointment_time"] = $appointment["slot_time"];
            $appointment["container_nos"] = $appointment["container_nos"]
                ? explode(", ", $appointment["container_nos"])
                : [];
        }

        unset($appointment);

        echo json_encode([
            "error" => false,
            "data" => $appointments,
            "code" => null
        ]);
    } catch (PDOException $e) {
        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => "Could not load gate appointments.",
            "code" => $e->getMessage()
        ]);
    } catch (Throwable $e) {
        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => "Could not load gate appointments.",
            "code" => $e->getMessage()
        ]);
    }
