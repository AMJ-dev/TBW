<?php
    $redisKey = 'trinu:integration_settings:v1';
    $settings = null;

    try {
        $cachedSettings = $redis->get($redisKey);

        if (is_string($cachedSettings) && $cachedSettings !== '') {
            $decodedSettings = json_decode($cachedSettings, true);

            if (is_array($decodedSettings)) {
                $settings = $decodedSettings;
            }
        }
    } catch (Throwable $e) {
        $settings = null;
    }

    if ($settings === null) {
        $encryptionKey = false;

        if (
            isset($INTEGRATION_ENCRYPTION_KEY) &&
            is_string($INTEGRATION_ENCRYPTION_KEY)
        ) {
            $decodedKey = base64_decode(
                $INTEGRATION_ENCRYPTION_KEY,
                true
            );

            if ($decodedKey !== false && strlen($decodedKey) === 32) {
                $encryptionKey = $decodedKey;
            } elseif (strlen($INTEGRATION_ENCRYPTION_KEY) === 32) {
                $encryptionKey = $INTEGRATION_ENCRYPTION_KEY;
            }
        }

        if (!is_string($encryptionKey) || strlen($encryptionKey) !== 32) {
            throw new RuntimeException(
                'Integration encryption key is missing or invalid.'
            );
        }

        $q = $conn->prepare("
            SELECT
                a.adapter_key,
                c.field_key,
                c.encrypted_value
            FROM integration_credentials c
            INNER JOIN integration_adapters a
                ON a.id = c.integration_id
            WHERE a.adapter_key IN ('email_provider', 'sms_provider')
        ");

        $q->execute();

        $settings = [];

        foreach ($q->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $encryptedValue = base64_decode(
                (string) $row['encrypted_value'],
                true
            );

            if ($encryptedValue === false || strlen($encryptedValue) < 29) {
                continue;
            }

            $iv = substr($encryptedValue, 0, 12);
            $tag = substr($encryptedValue, 12, 16);
            $ciphertext = substr($encryptedValue, 28);

            $value = openssl_decrypt(
                $ciphertext,
                'aes-256-gcm',
                $encryptionKey,
                OPENSSL_RAW_DATA,
                $iv,
                $tag
            );

            if ($value === false) {
                throw new RuntimeException(
                    'Could not decrypt an integration credential.'
                );
            }

            $settings[(string) $row['adapter_key']]
                    [(string) $row['field_key']] = $value;
        }

        try {
            $redis->setex(
                $redisKey,
                300,
                json_encode($settings, JSON_THROW_ON_ERROR)
            );
        } catch (Throwable $e) {
        }
    }

    $emailSettings = $settings['email_provider'] ?? [];
    $smsSettings = $settings['sms_provider'] ?? [];

    $email_host = (string) ($emailSettings['email_host'] ?? '');
    $email_port = (int) ($emailSettings['email_port'] ?? 0);
    $email_user = (string) (
        $emailSettings['email_user']
        ?? $emailSettings['sender_email']
        ?? ''
    );
    $email_password = (string) ($emailSettings['email_password'] ?? '');
    $sender_email = (string) ($emailSettings['sender_email'] ?? '');

    $sms_sender = (string) ($smsSettings['sms_sender'] ?? '');
    $sms_api_token = (string) ($smsSettings['sms_api_token'] ?? '');