
CREATE TABLE registration_requests (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    registration_ref CHAR(36) NOT NULL,

    account_type ENUM('importer', 'agent') NOT NULL,

    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(254) NOT NULL,
    phone VARCHAR(25) NOT NULL,

    password_hash VARCHAR(255) NOT NULL,

    organisation_name VARCHAR(255) NOT NULL,
    rc_number VARCHAR(100) DEFAULT NULL,
    tin VARCHAR(100) DEFAULT NULL,

    job_title VARCHAR(150) DEFAULT NULL,

    status ENUM(
        'pending_otp',
        'verified',
        'completed',
        'expired',
        'cancelled',
        'locked'
    ) NOT NULL DEFAULT 'pending_otp',

    email_verified_at DATETIME DEFAULT NULL,
    phone_verified_at DATETIME DEFAULT NULL,

    terms_accepted BOOLEAN NOT NULL DEFAULT FALSE,
    privacy_accepted BOOLEAN NOT NULL DEFAULT FALSE,

    terms_version VARCHAR(30) DEFAULT NULL,
    privacy_version VARCHAR(30) DEFAULT NULL,

    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent VARCHAR(500) DEFAULT NULL,

    expires_at DATETIME NOT NULL,

    completed_user_id BIGINT UNSIGNED DEFAULT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_registration_ref (registration_ref),

    INDEX idx_registration_email (email),
    INDEX idx_registration_phone (phone),
    INDEX idx_registration_status (status),
    INDEX idx_registration_expiry (expires_at),

    CONSTRAINT chk_registration_terms
        CHECK (terms_accepted = TRUE AND privacy_accepted = TRUE)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;



CREATE TABLE registration_otps (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    registration_request_id BIGINT UNSIGNED NOT NULL,

    channel ENUM('email', 'sms') NOT NULL,

    destination VARCHAR(254) NOT NULL,

    otp_hash VARCHAR(255) NOT NULL,

    purpose ENUM(
        'registration_email',
        'registration_phone'
    ) NOT NULL,

    attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,

    max_attempts TINYINT UNSIGNED NOT NULL DEFAULT 5,

    resend_count SMALLINT UNSIGNED NOT NULL DEFAULT 0,

    last_sent_at DATETIME DEFAULT NULL,

    expires_at DATETIME NOT NULL,

    verified_at DATETIME DEFAULT NULL,

    revoked_at DATETIME DEFAULT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_registration_otp_request
        FOREIGN KEY (registration_request_id)
        REFERENCES registration_requests(id)
        ON DELETE CASCADE,

    INDEX idx_otp_request (registration_request_id),
    INDEX idx_otp_destination (destination),
    INDEX idx_otp_expiry (expires_at),
    INDEX idx_otp_verified (verified_at)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


CREATE TABLE organisations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    organisation_name VARCHAR(255) NOT NULL,

    rc_number VARCHAR(100) DEFAULT NULL,
    tin VARCHAR(100) DEFAULT NULL,

    organisation_type ENUM(
        'importer',
        'agent'
    ) NOT NULL,

    verification_status ENUM(
        'pending',
        'under_review',
        'verified',
        'rejected',
        'suspended'
    ) NOT NULL DEFAULT 'pending',

    verified_by BIGINT UNSIGNED DEFAULT NULL,
    verified_at DATETIME DEFAULT NULL,

    rejection_reason TEXT DEFAULT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_org_rc (rc_number),
    UNIQUE KEY uq_org_tin (tin),

    INDEX idx_org_status (verification_status),
    INDEX idx_org_name (organisation_name)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    organisation_id BIGINT UNSIGNED NOT NULL,

    full_name VARCHAR(150) NOT NULL,

    email VARCHAR(254) NOT NULL,
    phone VARCHAR(25) NOT NULL,

    password_hash VARCHAR(255) NOT NULL,

    email_verified_at DATETIME DEFAULT NULL,
    phone_verified_at DATETIME DEFAULT NULL,

    account_status ENUM(
        'pending_approval',
        'active',
        'rejected',
        'suspended',
        'locked'
    ) NOT NULL DEFAULT 'pending_approval',

    failed_login_attempts SMALLINT UNSIGNED NOT NULL DEFAULT 0,

    locked_until DATETIME DEFAULT NULL,

    last_login_at DATETIME DEFAULT NULL,

    password_changed_at DATETIME DEFAULT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_user_email (email),
    UNIQUE KEY uq_user_phone (phone),

    INDEX idx_user_organisation (organisation_id),
    INDEX idx_user_status (account_status),

    CONSTRAINT fk_user_organisation
        FOREIGN KEY (organisation_id)
        REFERENCES organisations(id)
        ON DELETE RESTRICT

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


CREATE TABLE organisation_members (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    organisation_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,

    member_role ENUM(
        'owner',
        'admin',
        'member'
    ) NOT NULL DEFAULT 'member',

    job_title VARCHAR(150) DEFAULT NULL,

    membership_status ENUM(
        'pending',
        'active',
        'revoked'
    ) NOT NULL DEFAULT 'pending',

    invited_by BIGINT UNSIGNED DEFAULT NULL,

    joined_at DATETIME DEFAULT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_org_member (organisation_id, user_id),

    INDEX idx_member_user (user_id),
    INDEX idx_member_status (membership_status),

    CONSTRAINT fk_member_organisation
        FOREIGN KEY (organisation_id)
        REFERENCES organisations(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_member_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_member_invited_by
        FOREIGN KEY (invited_by)
        REFERENCES users(id)
        ON DELETE SET NULL

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;



