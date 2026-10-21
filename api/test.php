<?php
    phpinfo();
    /*
        require_once __DIR__ . "/include/conn.php";

        header("Content-Type: application/json; charset=utf-8");

        try {
            $conn->beginTransaction();

            $drivers = [
                ["name" => "Samuel Okafor", "phone" => "08031245061", "licence_number" => "RC12345678901", "licence_class" => "Class G - Heavy Goods", "licence_expiry" => "2027-10-31", "transporter" => "Northstar Haulage Ltd", "notes" => "Container and heavy goods transport."],
                ["name" => "Ibrahim Musa", "phone" => "08034567121", "licence_number" => "RC23456789012", "licence_class" => "Class G - Heavy Goods", "licence_expiry" => "2027-08-15", "transporter" => "Northstar Haulage Ltd", "notes" => "Long-distance cargo operations."],
                ["name" => "Chinedu Eze", "phone" => "08056781234", "licence_number" => "RC34567890123", "licence_class" => "Class G - Heavy Goods", "licence_expiry" => "2028-02-20", "transporter" => "Primeway Logistics Ltd", "notes" => "Inter-state freight transport."],
                ["name" => "Abubakar Sani", "phone" => "08067892345", "licence_number" => "RC45678901234", "licence_class" => "Class G - Heavy Goods", "licence_expiry" => "2027-12-10", "transporter" => "Arewa Freight Services", "notes" => "Container and flatbed operations."],
                ["name" => "Emeka Nwosu", "phone" => "08078903456", "licence_number" => "RC56789012345", "licence_class" => "Class G - Heavy Goods", "licence_expiry" => "2027-06-30", "transporter" => "Primeway Logistics Ltd", "notes" => "Long-haul freight driver."],
                ["name" => "Tunde Adeyemi", "phone" => "08089014567", "licence_number" => "RC67890123456", "licence_class" => "Class G - Heavy Goods", "licence_expiry" => "2028-04-18", "transporter" => "Lagos Cargo Movers Ltd", "notes" => "Regional freight operations."],
                ["name" => "Yusuf Abdullahi", "phone" => "08090125678", "licence_number" => "RC78901234567", "licence_class" => "Class G - Heavy Goods", "licence_expiry" => "2027-09-25", "transporter" => "Arewa Freight Services", "notes" => "Container terminal deliveries."],
                ["name" => "Ngozi Okeke", "phone" => "08021236789", "licence_number" => "RC89012345678", "licence_class" => "Class G - Heavy Goods", "licence_expiry" => "2028-01-12", "transporter" => "Eastern Corridor Transport", "notes" => "Commercial freight operations."],
                ["name" => "Bello Garba", "phone" => "08032347890", "licence_number" => "RC90123456789", "licence_class" => "Class G - Heavy Goods", "licence_expiry" => "2027-11-08", "transporter" => "Northern Star Carriers", "notes" => "Terminal container transfers."],
                ["name" => "Kelechi Obi", "phone" => "08043458901", "licence_number" => "RC11234567890", "licence_class" => "Class G - Heavy Goods", "licence_expiry" => "2028-05-22", "transporter" => "Eastern Corridor Transport", "notes" => "Commercial freight driver."],
                ["name" => "Amina Ibrahim", "phone" => "08034561278", "licence_number" => "RC22345678901", "licence_class" => "Class G - Heavy Goods", "licence_expiry" => "2028-11-20", "transporter" => "Northstar Haulage Ltd", "notes" => "Long-distance container transport."],
                ["name" => "Peter Chukwu", "phone" => "08061234578", "licence_number" => "RC33456789012", "licence_class" => "Class G - Heavy Goods", "licence_expiry" => "2029-02-15", "transporter" => "Primeway Logistics Ltd", "notes" => "Commercial freight operations."],
                ["name" => "Musa Danjuma", "phone" => "08072345689", "licence_number" => "RC44567890123", "licence_class" => "Class G - Heavy Goods", "licence_expiry" => "2028-08-30", "transporter" => "Arewa Freight Services", "notes" => "Container terminal deliveries."],
                ["name" => "Grace Ekanem", "phone" => "08083456790", "licence_number" => "RC55678901234", "licence_class" => "Class G - Heavy Goods", "licence_expiry" => "2029-04-12", "transporter" => "Eastern Corridor Transport", "notes" => "Regional cargo transportation."],
                ["name" => "Daniel Balogun", "phone" => "08094567812", "licence_number" => "RC66789012345", "licence_class" => "Class G - Heavy Goods", "licence_expiry" => "2028-12-05", "transporter" => "Lagos Cargo Movers Ltd", "notes" => "Heavy goods transportation."],
                ["name" => "Abdulrahman Bello", "phone" => "08025678934", "licence_number" => "RC77890123456", "licence_class" => "Class G - Heavy Goods", "licence_expiry" => "2029-06-18", "transporter" => "Northern Star Carriers", "notes" => "Inter-state cargo deliveries."],
                ["name" => "Victor Onoh", "phone" => "08036789145", "licence_number" => "RC88901234567", "licence_class" => "Class G - Heavy Goods", "licence_expiry" => "2028-09-14", "transporter" => "Primeway Logistics Ltd", "notes" => "Container and flatbed operations."],
                ["name" => "Fatima Sule", "phone" => "08047891256", "licence_number" => "RC99012345678", "licence_class" => "Class G - Heavy Goods", "licence_expiry" => "2029-03-22", "transporter" => "Northstar Haulage Ltd", "notes" => "Commercial vehicle operations."],
                ["name" => "Michael Adebayo", "phone" => "08058912367", "licence_number" => "RC10234567891", "licence_class" => "Class G - Heavy Goods", "licence_expiry" => "2028-07-11", "transporter" => "Lagos Cargo Movers Ltd", "notes" => "Terminal and warehouse transfers."],
                ["name" => "Josephine Nnamdi", "phone" => "08069123478", "licence_number" => "RC21345678902", "licence_class" => "Class G - Heavy Goods", "licence_expiry" => "2029-05-09", "transporter" => "Eastern Corridor Transport", "notes" => "Freight delivery operations."]
            ];

            $vehicles = [
                ["plate" => "KJA-482XY", "kind" => "Container", "make" => "Sinotruk", "model" => "Howo T7H", "year" => 2022, "capacity" => "40 tonnes", "owner" => "Northstar Haulage Ltd", "transporter" => "Northstar Haulage Ltd", "insurance_expiry" => "2027-05-27", "roadworthiness_expiry" => "2027-04-02", "notes" => "Heavy-duty container tractor unit."],
                ["plate" => "LND-284YX", "kind" => "Container", "make" => "MAN", "model" => "TGS 33.440", "year" => 2021, "capacity" => "40 tonnes", "owner" => "Primeway Logistics Ltd", "transporter" => "Primeway Logistics Ltd", "insurance_expiry" => "2027-08-20", "roadworthiness_expiry" => "2027-06-15", "notes" => "Container tractor unit."],
                ["plate" => "ABJ-615ZT", "kind" => "Flatbed", "make" => "Mercedes-Benz", "model" => "Actros 3345", "year" => 2020, "capacity" => "35 tonnes", "owner" => "Arewa Freight Services", "transporter" => "Arewa Freight Services", "insurance_expiry" => "2027-09-12", "roadworthiness_expiry" => "2027-07-20", "notes" => "Flatbed for industrial cargo."],
                ["plate" => "KAD-731WF", "kind" => "Tanker", "make" => "MAN", "model" => "TGS 26.400", "year" => 2022, "capacity" => "32000 litres", "owner" => "Northern Star Carriers", "transporter" => "Northern Star Carriers", "insurance_expiry" => "2027-12-18", "roadworthiness_expiry" => "2027-10-25", "notes" => "Tanker requiring cargo-specific authorization."],
                ["plate" => "ENU-492QK", "kind" => "Reefer", "make" => "Isuzu", "model" => "FVR 34", "year" => 2023, "capacity" => "18 tonnes", "owner" => "Eastern Corridor Transport", "transporter" => "Eastern Corridor Transport", "insurance_expiry" => "2028-02-14", "roadworthiness_expiry" => "2027-11-30", "notes" => "Refrigerated cargo truck."],
                ["plate" => "KAN-827LM", "kind" => "Box", "make" => "Mitsubishi Fuso", "model" => "Canter", "year" => 2021, "capacity" => "5 tonnes", "owner" => "Arewa Freight Services", "transporter" => "Arewa Freight Services", "insurance_expiry" => "2027-07-15", "roadworthiness_expiry" => "2027-05-19", "notes" => "Box truck for packaged freight."],
                ["plate" => "PHC-358RD", "kind" => "Container", "make" => "Volvo", "model" => "FM 440", "year" => 2022, "capacity" => "40 tonnes", "owner" => "Primeway Logistics Ltd", "transporter" => "Primeway Logistics Ltd", "insurance_expiry" => "2027-11-22", "roadworthiness_expiry" => "2027-09-30", "notes" => "Container truck."],
                ["plate" => "IBA-573NC", "kind" => "Flatbed", "make" => "DAF", "model" => "XF 480", "year" => 2020, "capacity" => "38 tonnes", "owner" => "Lagos Cargo Movers Ltd", "transporter" => "Lagos Cargo Movers Ltd", "insurance_expiry" => "2027-06-28", "roadworthiness_expiry" => "2027-05-10", "notes" => "Flatbed tractor for industrial cargo."],
                ["plate" => "OWR-641HP", "kind" => "Container", "make" => "Scania", "model" => "R450", "year" => 2023, "capacity" => "40 tonnes", "owner" => "Northstar Haulage Ltd", "transporter" => "Northstar Haulage Ltd", "insurance_expiry" => "2028-03-20", "roadworthiness_expiry" => "2028-01-15", "notes" => "High-capacity container truck."],
                ["plate" => "BEN-926KS", "kind" => "Reefer", "make" => "Hino", "model" => "500 Series", "year" => 2021, "capacity" => "15 tonnes", "owner" => "Eastern Corridor Transport", "transporter" => "Eastern Corridor Transport", "insurance_expiry" => "2027-10-10", "roadworthiness_expiry" => "2027-08-25", "notes" => "Refrigerated cargo vehicle."],
                ["plate" => "ABJ-741MK", "kind" => "Container", "make" => "Mercedes-Benz", "model" => "Actros 1845", "year" => 2023, "capacity" => "40 tonnes", "owner" => "Northstar Haulage Ltd", "transporter" => "Northstar Haulage Ltd", "insurance_expiry" => "2028-06-15", "roadworthiness_expiry" => "2028-04-20", "notes" => "Container tractor unit."],
                ["plate" => "KAN-562RT", "kind" => "Flatbed", "make" => "Volvo", "model" => "FH 460", "year" => 2022, "capacity" => "35 tonnes", "owner" => "Arewa Freight Services", "transporter" => "Arewa Freight Services", "insurance_expiry" => "2028-03-18", "roadworthiness_expiry" => "2028-01-25", "notes" => "Flatbed freight vehicle."],
                ["plate" => "PHC-819JL", "kind" => "Reefer", "make" => "Hino", "model" => "500 Series", "year" => 2024, "capacity" => "15 tonnes", "owner" => "Eastern Corridor Transport", "transporter" => "Eastern Corridor Transport", "insurance_expiry" => "2028-09-12", "roadworthiness_expiry" => "2028-07-16", "notes" => "Refrigerated transport vehicle."],
                ["plate" => "LAG-426NW", "kind" => "Box", "make" => "Isuzu", "model" => "NQR", "year" => 2022, "capacity" => "8 tonnes", "owner" => "Lagos Cargo Movers Ltd", "transporter" => "Lagos Cargo Movers Ltd", "insurance_expiry" => "2028-05-22", "roadworthiness_expiry" => "2028-03-30", "notes" => "Box truck for packaged cargo."],
                ["plate" => "ENU-753KD", "kind" => "Container", "make" => "Scania", "model" => "R450", "year" => 2023, "capacity" => "40 tonnes", "owner" => "Primeway Logistics Ltd", "transporter" => "Primeway Logistics Ltd", "insurance_expiry" => "2028-10-14", "roadworthiness_expiry" => "2028-08-21", "notes" => "Long-haul container truck."],
                ["plate" => "IBA-298QF", "kind" => "Flatbed", "make" => "DAF", "model" => "XF 480", "year" => 2021, "capacity" => "38 tonnes", "owner" => "Lagos Cargo Movers Ltd", "transporter" => "Lagos Cargo Movers Ltd", "insurance_expiry" => "2028-02-16", "roadworthiness_expiry" => "2027-12-20", "notes" => "Industrial cargo transport."],
                ["plate" => "KAD-634VP", "kind" => "Container", "make" => "Sinotruk", "model" => "Howo NX", "year" => 2024, "capacity" => "40 tonnes", "owner" => "Northern Star Carriers", "transporter" => "Northern Star Carriers", "insurance_expiry" => "2028-11-05", "roadworthiness_expiry" => "2028-09-12", "notes" => "Heavy-duty container truck."],
                ["plate" => "BEN-517GX", "kind" => "Tanker", "make" => "MAN", "model" => "TGS 26.400", "year" => 2022, "capacity" => "30000 litres", "owner" => "Northern Star Carriers", "transporter" => "Northern Star Carriers", "insurance_expiry" => "2028-07-25", "roadworthiness_expiry" => "2028-05-30", "notes" => "Tanker requiring cargo authorization."],
                ["plate" => "OWR-835TZ", "kind" => "Reefer", "make" => "Mitsubishi Fuso", "model" => "Fighter", "year" => 2023, "capacity" => "12 tonnes", "owner" => "Eastern Corridor Transport", "transporter" => "Eastern Corridor Transport", "insurance_expiry" => "2028-08-17", "roadworthiness_expiry" => "2028-06-22", "notes" => "Refrigerated goods transport."],
                ["plate" => "MAI-194RC", "kind" => "Container", "make" => "Volvo", "model" => "FM 440", "year" => 2022, "capacity" => "40 tonnes", "owner" => "Primeway Logistics Ltd", "transporter" => "Primeway Logistics Ltd", "insurance_expiry" => "2028-04-28", "roadworthiness_expiry" => "2028-02-14", "notes" => "Container haulage vehicle."]
            ];

            $driverIds = [];
            $vehicleIds = [];

            $findDriver = $conn->prepare(
                "SELECT id FROM gate_drivers WHERE licence_number = ? LIMIT 1"
            );

            $insertDriver = $conn->prepare(
                "INSERT INTO gate_drivers
                (id, name, phone, licence_number, licence_class, licence_expiry,
                assigned_vehicle, transporter, notes, status)
                VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, 'Approved')"
            );

            $updateDriver = $conn->prepare(
                "UPDATE gate_drivers
                SET name = ?, phone = ?, licence_class = ?, licence_expiry = ?,
                    transporter = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?"
            );

            foreach ($drivers as $driver) {
                $findDriver->execute([$driver["licence_number"]]);
                $existingId = $findDriver->fetchColumn();

                if ($existingId) {
                    $driverId = $existingId;
                    $updateDriver->execute([
                        $driver["name"],
                        $driver["phone"],
                        $driver["licence_class"],
                        $driver["licence_expiry"],
                        $driver["transporter"],
                        $driver["notes"],
                        $driverId
                    ]);
                } else {
                    $driverId = generateID();
                    $insertDriver->execute([
                        $driverId,
                        $driver["name"],
                        $driver["phone"],
                        $driver["licence_number"],
                        $driver["licence_class"],
                        $driver["licence_expiry"],
                        $driver["transporter"],
                        $driver["notes"]
                    ]);
                }

                $driverIds[$driver["licence_number"]] = $driverId;
            }

            $findVehicle = $conn->prepare(
                "SELECT id FROM gate_vehicles WHERE plate = ? LIMIT 1"
            );

            $insertVehicle = $conn->prepare(
                "INSERT INTO gate_vehicles
                (id, plate, kind, make, model, year, capacity, owner, transporter,
                insurance_expiry, roadworthiness_expiry, notes, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Approved')"
            );

            $updateVehicle = $conn->prepare(
                "UPDATE gate_vehicles
                SET kind = ?, make = ?, model = ?, year = ?, capacity = ?,
                    owner = ?, transporter = ?, insurance_expiry = ?,
                    roadworthiness_expiry = ?, notes = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?"
            );

            foreach ($vehicles as $vehicle) {
                $findVehicle->execute([$vehicle["plate"]]);
                $existingId = $findVehicle->fetchColumn();

                if ($existingId) {
                    $vehicleId = $existingId;
                    $updateVehicle->execute([
                        $vehicle["kind"],
                        $vehicle["make"],
                        $vehicle["model"],
                        $vehicle["year"],
                        $vehicle["capacity"],
                        $vehicle["owner"],
                        $vehicle["transporter"],
                        $vehicle["insurance_expiry"],
                        $vehicle["roadworthiness_expiry"],
                        $vehicle["notes"],
                        $vehicleId
                    ]);
                } else {
                    $vehicleId = generateID();
                    $insertVehicle->execute([
                        $vehicleId,
                        $vehicle["plate"],
                        $vehicle["kind"],
                        $vehicle["make"],
                        $vehicle["model"],
                        $vehicle["year"],
                        $vehicle["capacity"],
                        $vehicle["owner"],
                        $vehicle["transporter"],
                        $vehicle["insurance_expiry"],
                        $vehicle["roadworthiness_expiry"],
                        $vehicle["notes"]
                    ]);
                }

                $vehicleIds[$vehicle["plate"]] = $vehicleId;
            }

            $closeAssignments = $conn->prepare(
                "UPDATE gate_driver_vehicle_assignments
                SET unassigned_at = NOW()
                WHERE driver_id = ? AND unassigned_at IS NULL"
            );

            $findActiveAssignment = $conn->prepare(
                "SELECT id
                FROM gate_driver_vehicle_assignments
                WHERE driver_id = ? AND vehicle_id = ?
                AND unassigned_at IS NULL
                LIMIT 1"
            );

            $insertAssignment = $conn->prepare(
                "INSERT INTO gate_driver_vehicle_assignments
                (id, driver_id, vehicle_id, assigned_at)
                VALUES (?, ?, ?, NOW())"
            );

            $updateDriverVehicle = $conn->prepare(
                "UPDATE gate_drivers
                SET assigned_vehicle = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?"
            );

            $assignmentsCreated = 0;
            $driverEntries = array_values($drivers);
            $vehicleEntries = array_values($vehicles);
            $pairCount = min(count($driverEntries), count($vehicleEntries));

            for ($i = 0; $i < $pairCount; $i++) {
                $driverLicence = $driverEntries[$i]["licence_number"];
                $vehiclePlate = $vehicleEntries[$i]["plate"];

                $driverId = $driverIds[$driverLicence] ?? null;
                $vehicleId = $vehicleIds[$vehiclePlate] ?? null;

                if (!$driverId || !$vehicleId) {
                    continue;
                }

                $findActiveAssignment->execute([$driverId, $vehicleId]);

                if ($findActiveAssignment->fetchColumn()) {
                    $updateDriverVehicle->execute([$vehiclePlate, $driverId]);
                    continue;
                }

                $closeAssignments->execute([$driverId]);

                $insertAssignment->execute([
                    generateID(),
                    $driverId,
                    $vehicleId
                ]);

                $updateDriverVehicle->execute([$vehiclePlate, $driverId]);
                $assignmentsCreated++;
            }

            $conn->commit();

            echo json_encode([
                "error" => false,
                "data" => "Driver, vehicle, and assignment records processed successfully.",
                "code" => [
                    "drivers_processed" => count($drivers),
                    "vehicles_processed" => count($vehicles),
                    "assignments_created" => $assignmentsCreated
                ]
            ]);
        } catch (Throwable $e) {
            if ($conn->inTransaction()) {
                $conn->rollBack();
            }

            http_response_code(500);

            echo json_encode([
                "error" => true,
                "data" => "Could not seed driver and vehicle records.",
                "code" => $e->getMessage()
            ]);
        }
    */
