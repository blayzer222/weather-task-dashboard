CREATE TABLE verification_token (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    f_account_id INT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_verification_token_account
        FOREIGN KEY (f_account_id) REFERENCES account(p_account_id)
        ON DELETE CASCADE
);