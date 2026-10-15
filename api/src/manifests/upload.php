<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    if (empty($_FILES['file']) || !is_array($_FILES['file'])) {
        http_response_code(422);
        echo json_encode(['error'=>true,'data'=>'Choose a manifest file to upload.','code'=>null]);
        exit;
    }
    $source = strtoupper(trim((string)($_POST['source'] ?? '')));
    $extensions = ['EDI'=>['edi','txt'],'CSV'=>['csv'],'XLSX'=>['xlsx','xls']];
    if (!isset($extensions[$source])) {
        http_response_code(422);
        echo json_encode(['error'=>true,'data'=>'Choose EDI, CSV or XLSX as the intake source.','code'=>null]);
        exit;
    }
    $originalName = basename((string)($_FILES['file']['name'] ?? 'manifest'));
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    if (!in_array($extension, $extensions[$source], true)) {
        http_response_code(422);
        echo json_encode(['error'=>true,'data'=>'The uploaded file extension does not match the selected source.','code'=>null]);
        exit;
    }
    if ((int)($_FILES['file']['size'] ?? 0) < 1 || (int)($_FILES['file']['size'] ?? 0) > 15728640) {
        http_response_code(422);
        echo json_encode(['error'=>true,'data'=>'File must be smaller than 15 MB and cannot be empty.','code'=>null]);
        exit;
    }
    try {
        $uploaded = upload_files($_FILES['file'], $extensions[$source]);
        if (!is_array($uploaded) || !empty($uploaded['error'])) {
            http_response_code(422);
            echo json_encode(['error'=>true,'data'=>is_array($uploaded) ? (string)($uploaded['data'] ?? 'Unable to upload file.') : 'Unable to upload file.','code'=>null]);
            exit;
        }
        $filePath = (string)($uploaded['data'] ?? '');
        if ($filePath === '') {
            http_response_code(500);
            echo json_encode(['error'=>true,'data'=>'Upload helper did not return a file path.','code'=>null]);
            exit;
        }
        $parsed = [];
        $fullPath = $filePath;
        if (!is_file($fullPath)) {
            $candidate = dirname(__DIR__, 2).'/'.$filePath;
            if (is_file($candidate)) $fullPath = $candidate;
        }
        if (is_file($fullPath) && in_array($source, ['CSV','EDI'], true)) {
            if ($source === 'CSV') {
                $stream = fopen($fullPath, 'r');
                if ($stream) {
                    $headers = fgetcsv($stream);
                    if (is_array($headers)) {
                        $headers = array_map(static function ($value) { return strtolower(preg_replace('/[^a-z0-9]+/i', '_', trim((string)$value))); }, $headers);
                        $first = fgetcsv($stream);
                        if (is_array($first)) {
                            $rowValues = array_slice(array_pad($first, count($headers), ''), 0, count($headers));
                            $row = array_combine($headers, $rowValues);
                            if (is_array($row)) {
                                $aliases = ['manifest_ref'=>['manifest_ref','manifest_reference','manifestref'],'bl'=>['bl','bill_of_lading','bill_of_lading_number'],'vessel'=>['vessel','vessel_name'],'shipping_line'=>['shipping_line','shippingline','carrier'],'origin_port'=>['origin_port','origin'],'eta'=>['eta','expected_arrival'],'containers'=>['containers','container_count'],'packages'=>['packages','package_count'],'gross_weight'=>['gross_weight','weight'],'consignee'=>['consignee','consignee_name']];
                                foreach ($aliases as $target=>$keys) foreach ($keys as $key) if (isset($row[$key]) && trim((string)$row[$key])!=='') { $parsed[$target] = trim((string)$row[$key]); break; }
                            }
                        }
                    }
                    fclose($stream);
                }
            } else {
                $content = file_get_contents($fullPath);
                if ($content !== false) {
                    $patterns = ['manifest_ref'=>'/(?:MANIFEST(?:_REFERENCE)?|MANIFESTREF)\s*[:=]\s*([^\r\n]+)/i','bl'=>'/(?:BILL_OF_LADING|BOL|BL)\s*[:=]\s*([^\r\n]+)/i','vessel'=>'/VESSEL(?:_NAME)?\s*[:=]\s*([^\r\n]+)/i','shipping_line'=>'/(?:SHIPPING_LINE|CARRIER)\s*[:=]\s*([^\r\n]+)/i','origin_port'=>'/ORIGIN_PORT\s*[:=]\s*([^\r\n]+)/i','eta'=>'/ETA\s*[:=]\s*([^\r\n]+)/i','containers'=>'/CONTAINERS?\s*[:=]\s*(\d+)/i','packages'=>'/PACKAGES?\s*[:=]\s*(\d+)/i','gross_weight'=>'/GROSS_WEIGHT\s*[:=]\s*([^\r\n]+)/i','consignee'=>'/CONSIGNEE\s*[:=]\s*([^\r\n]+)/i'];
                    foreach ($patterns as $key=>$pattern) if (preg_match($pattern, $content, $match)) $parsed[$key] = trim($match[1]);
                }
            }
        }
        if ($source === 'XLSX' && !class_exists('PhpOffice\\PhpSpreadsheet\\IOFactory')) {
            $message = 'File uploaded. XLSX field extraction requires PhpSpreadsheet; review and complete the fields manually.';
        } else {
            $message = 'File uploaded. Review the parsed fields before submitting.';
        }
        $token = generateId();
        $stmt = $conn->prepare('INSERT INTO operation_manifest_uploads (id,upload_token,uploaded_by,source,original_name,file_path,parsed_data) VALUES (?,?,?,?,?,?,?)');
        $stmt->execute([generateId(),$token,(string)$my_details->id,$source,$originalName,$filePath,json_encode($parsed)]);
        echo json_encode(['error'=>false,'data'=>$message,'code'=>['upload_token'=>$token,'parsed'=>$parsed,'original_name'=>$originalName]]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['error'=>true,'data'=>'Unable to process manifest upload.','code'=>null]);
    }
