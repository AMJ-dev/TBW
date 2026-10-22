<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";
    
    if (
        !isset($_FILES['file']) ||
        !is_array($_FILES['file']) ||
        (int)($_FILES['file']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK
    ) {
        echo json_encode(['error' => true, 'data' => 'Choose a manifest file to upload.', 'code' => null]);
        exit;
    }

    $source = strtoupper(trim((string)($_POST['source'] ?? '')));

    $allowed_source = ['EDI', 'CSV', 'XLSX'];

    $extensions = [
        'EDI' => ['edi', 'txt'],
        'CSV' => ['csv'],
        'XLSX' => ['xlsx', 'xls']
    ];

    $mimeTypes = [
        'EDI' => ['text/plain', 'application/octet-stream'],
        'CSV' => ['text/csv', 'text/plain', 'application/csv', 'application/vnd.ms-excel', 'application/octet-stream'],
        'XLSX' => ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'application/octet-stream']
    ];

    if (!in_array($source, $allowed_source, true)) {
        echo json_encode(['error' => true, 'data' => 'Choose EDI, CSV or XLSX as the intake source.', 'code' => null]);
        exit;
    }

    $tmpName = (string)($_FILES['file']['tmp_name'] ?? '');

    if ($tmpName === '' || !is_uploaded_file($tmpName)) {
        echo json_encode(['error' => true, 'data' => 'The uploaded file is invalid.', 'code' => null]);
        exit;
    }

    $originalName = basename((string)($_FILES['file']['name'] ?? 'manifest'));
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $fileSize = (int)($_FILES['file']['size'] ?? 0);

    if (!in_array($extension, $extensions[$source], true)) {
        echo json_encode(['error' => true, 'data' => 'The uploaded file extension does not match the selected source.', 'code' => null]);
        exit;
    }

    if ($fileSize < 1 || $fileSize > 15728640) {
        echo json_encode(['error' => true, 'data' => 'File must be no larger than 15 MB and cannot be empty.', 'code' => null]);
        exit;
    }

    try {
        if (!class_exists('finfo')) {
            echo json_encode(['error' => true, 'data' => 'File MIME detection is unavailable on this server.', 'code' => null]);
            exit;
        }

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($tmpName);

        if (!is_string($mime) || !in_array($mime, $mimeTypes[$source], true)) {
            echo json_encode(['error' => true, 'data' => 'The uploaded file type is not supported for the selected source.', 'code' => null]);
            exit;
        }

        if ($source === 'XLSX' && $extension === 'xlsx') {
            if (!class_exists('ZipArchive')) {
                echo json_encode(['error' => true, 'data' => 'XLSX validation is unavailable on this server.', 'code' => null]);
                exit;
            }

            $zip = new ZipArchive();
            $opened = $zip->open($tmpName);

            if ($opened !== true) {
                echo json_encode(['error' => true, 'data' => 'The XLSX file is invalid or corrupted.', 'code' => null]);
                exit;
            }

            $validXlsx = $zip->locateName('[Content_Types].xml') !== false
                && $zip->locateName('xl/workbook.xml') !== false;

            $zip->close();

            if (!$validXlsx) {
                echo json_encode(['error' => true, 'data' => 'The uploaded file is not a valid XLSX workbook.', 'code' => null]);
                exit;
            }
        }

        $uploadFile = $_FILES['file'];
    $uploadFile['type'] = $extension;
    $uploaded = upload_files($uploadFile, $extensions[$source]);

        if (!is_array($uploaded) || !empty($uploaded['error'])) {
            echo json_encode([
                'error' => true,
                'data' => is_array($uploaded)
                    ? (string)($uploaded['data'] ?? 'Unable to upload file.')
                    : 'Unable to upload file.',
                'code' => null
            ]);
            exit;
        }

        $filePath = (string)($uploaded['data'] ?? '');

        if ($filePath === '') {
            echo json_encode(['error' => true, 'data' => 'Upload helper did not return a file path.', 'code' => null]);
            exit;
        }

        $fullPath = $filePath;

        if (!is_file($fullPath)) {
            $candidate = dirname(__DIR__, 2) . '/' . ltrim($filePath, '/\\');

            if (is_file($candidate)) {
                $fullPath = $candidate;
            }
        }

        $parsed = [];

        $aliases = [
            'manifest_ref' => ['manifest_ref', 'manifest_reference', 'manifestref'],
            'bl' => ['bl', 'bill_of_lading', 'bill_of_lading_number'],
            'vessel' => ['vessel', 'vessel_name'],
            'shipping_line' => ['shipping_line', 'shippingline', 'carrier'],
            'origin_port' => ['origin_port', 'origin'],
            'eta' => ['eta', 'expected_arrival'],
            'containers' => ['containers', 'container_count'],
            'packages' => ['packages', 'package_count'],
            'gross_weight' => ['gross_weight', 'weight'],
            'consignee' => ['consignee', 'consignee_name']
        ];

        if (is_file($fullPath) && $source === 'CSV') {
            $stream = fopen($fullPath, 'r');

            if ($stream !== false) {
                $headers = fgetcsv($stream);

                if (is_array($headers)) {
                    $headers = array_map(
                        static function ($value) {
                            return trim(
                                strtolower(
                                    preg_replace('/[^a-z0-9]+/i', '_', trim((string)$value))
                                ),
                                '_'
                            );
                        },
                        $headers
                    );

                    $first = fgetcsv($stream);

                    if (is_array($first)) {
                        $rowValues = array_slice(
                            array_pad($first, count($headers), ''),
                            0,
                            count($headers)
                        );

                        $row = array_combine($headers, $rowValues);

                        if (is_array($row)) {
                            foreach ($aliases as $target => $keys) {
                                foreach ($keys as $key) {
                                    if (isset($row[$key]) && trim((string)$row[$key]) !== '') {
                                        $parsed[$target] = trim((string)$row[$key]);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }

                fclose($stream);
            }
        } elseif (is_file($fullPath) && $source === 'EDI') {
            $content = file_get_contents($fullPath);

            if ($content !== false) {
                $patterns = [
                    'manifest_ref' => '/(?:MANIFEST(?:_REFERENCE)?|MANIFESTREF)\s*[:=]\s*([^\r\n]+)/i',
                    'bl' => '/(?:BILL_OF_LADING|BOL|BL)\s*[:=]\s*([^\r\n]+)/i',
                    'vessel' => '/VESSEL(?:_NAME)?\s*[:=]\s*([^\r\n]+)/i',
                    'shipping_line' => '/(?:SHIPPING_LINE|CARRIER)\s*[:=]\s*([^\r\n]+)/i',
                    'origin_port' => '/ORIGIN_PORT\s*[:=]\s*([^\r\n]+)/i',
                    'eta' => '/ETA\s*[:=]\s*([^\r\n]+)/i',
                    'containers' => '/CONTAINERS?\s*[:=]\s*(\d+)/i',
                    'packages' => '/PACKAGES?\s*[:=]\s*(\d+)/i',
                    'gross_weight' => '/GROSS_WEIGHT\s*[:=]\s*([^\r\n]+)/i',
                    'consignee' => '/CONSIGNEE\s*[:=]\s*([^\r\n]+)/i'
                ];

                foreach ($patterns as $key => $pattern) {
                    if (preg_match($pattern, $content, $match)) {
                        $parsed[$key] = trim($match[1]);
                    }
                }
            }
        } elseif (
            is_file($fullPath) &&
            $source === 'XLSX' &&
            class_exists('PhpOffice\\PhpSpreadsheet\\IOFactory')
        ) {
            $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($fullPath);

            try {
                $sheet = $spreadsheet->getActiveSheet();
                $rows = $sheet->toArray(null, true, true, false);

                if (count($rows) > 1 && is_array($rows[0])) {
                    $headers = array_map(
                        static function ($value) {
                            return trim(
                                strtolower(
                                    preg_replace('/[^a-z0-9]+/i', '_', trim((string)$value))
                                ),
                                '_'
                            );
                        },
                        $rows[0]
                    );

                    $rowValues = array_slice(
                        array_pad($rows[1], count($headers), ''),
                        0,
                        count($headers)
                    );

                    $row = array_combine($headers, $rowValues);

                    if (is_array($row)) {
                        foreach ($aliases as $target => $keys) {
                            foreach ($keys as $key) {
                                if (isset($row[$key]) && trim((string)$row[$key]) !== '') {
                                    $parsed[$target] = trim((string)$row[$key]);
                                    break;
                                }
                            }
                        }
                    }
                }
            } finally {
                $spreadsheet->disconnectWorksheets();
            }
        }

        $message = 'File uploaded. Review the parsed fields before submitting.';

        if (
            $source === 'XLSX' &&
            !class_exists('PhpOffice\\PhpSpreadsheet\\IOFactory')
        ) {
            $message = 'File uploaded. XLSX field extraction requires PhpSpreadsheet; review and complete the fields manually.';
        }

        $token = generateId();

        $stmt = $conn->prepare(
            'INSERT INTO operation_manifest_uploads
            (id, upload_token, uploaded_by, source, original_name, file_path, parsed_data)
            VALUES (?, ?, ?, ?, ?, ?, ?)'
        );

        $stmt->execute([
            generateId(),
            $token,
            (string)$my_details->id,
            $source,
            $originalName,
            $filePath,
            json_encode($parsed, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
        ]);

        echo json_encode([
            'error' => false,
            'data' => $message,
            'code' => [
                'upload_token' => $token,
                'parsed' => $parsed,
                'original_name' => $originalName
            ]
        ]);
    } catch (Throwable $e) {
        echo json_encode([
            'error' => true,
            'data' => 'Unable to process manifest upload.',
            'code' => null
        ]);
    }