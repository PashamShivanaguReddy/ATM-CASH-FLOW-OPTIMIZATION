CREATE TABLE banks (
    id BIGSERIAL PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    bank_code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(160) NOT NULL,
    email VARCHAR(254), phone VARCHAR(32), address VARCHAR(500),
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_banks_code ON banks(bank_code);

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    bank_id BIGINT REFERENCES banks(id),
    first_name VARCHAR(100) NOT NULL, last_name VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE, phone VARCHAR(32), password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL, status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_users_bank_id ON users(bank_id);

CREATE TABLE atms (
    id BIGSERIAL PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    atm_code VARCHAR(32) NOT NULL UNIQUE,
    bank_id BIGINT NOT NULL REFERENCES banks(id),
    location VARCHAR(500) NOT NULL, city VARCHAR(100) NOT NULL, state VARCHAR(100) NOT NULL,
    latitude NUMERIC(9,6), longitude NUMERIC(9,6), atm_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL, cash_capacity NUMERIC(19,2) NOT NULL,
    minimum_cash_threshold NUMERIC(19,2) NOT NULL, maximum_cash_threshold NUMERIC(19,2) NOT NULL,
    current_cash NUMERIC(19,2) NOT NULL, last_refill_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_atms_code ON atms(atm_code);
CREATE INDEX idx_atms_bank_id ON atms(bank_id);

CREATE TABLE atm_transactions (
    id BIGSERIAL PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    transaction_id VARCHAR(64) NOT NULL UNIQUE,
    atm_id BIGINT NOT NULL REFERENCES atms(id), transaction_type VARCHAR(20) NOT NULL,
    amount NUMERIC(19,2) NOT NULL, timestamp TIMESTAMPTZ NOT NULL,
    success BOOLEAN NOT NULL, card_type VARCHAR(32),
    created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_transactions_atm_id ON atm_transactions(atm_id);
CREATE INDEX idx_transactions_timestamp ON atm_transactions(timestamp);
CREATE INDEX idx_transactions_type ON atm_transactions(transaction_type);

CREATE TABLE cash_inventory (
    id BIGSERIAL PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    atm_id BIGINT NOT NULL REFERENCES atms(id), denomination INTEGER NOT NULL,
    note_count INTEGER NOT NULL, total_amount NUMERIC(19,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_inventory_atm_denomination UNIQUE(atm_id, denomination)
);
CREATE INDEX idx_inventory_atm_id ON cash_inventory(atm_id);

CREATE TABLE cash_refills (
    id BIGSERIAL PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    atm_id BIGINT NOT NULL REFERENCES atms(id), requested_by BIGINT REFERENCES users(id), approved_by BIGINT REFERENCES users(id),
    refill_amount NUMERIC(19,2) NOT NULL, refill_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL, notes VARCHAR(1000),
    created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_refills_atm_id ON cash_refills(atm_id);

CREATE TABLE predictions (
    id BIGSERIAL PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    atm_id BIGINT NOT NULL REFERENCES atms(id), prediction_date DATE NOT NULL,
    predicted_demand NUMERIC(19,2) NOT NULL, confidence_score NUMERIC(5,4), model_version VARCHAR(64) NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_predictions_atm_id ON predictions(atm_id);
CREATE INDEX idx_predictions_date ON predictions(prediction_date);

CREATE TABLE alerts (
    id BIGSERIAL PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    atm_id BIGINT NOT NULL REFERENCES atms(id), alert_type VARCHAR(30) NOT NULL,
    severity VARCHAR(20) NOT NULL, message VARCHAR(1000) NOT NULL, status VARCHAR(20) NOT NULL,
    resolved_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_alerts_atm_id ON alerts(atm_id);
CREATE INDEX idx_alerts_status ON alerts(status);

CREATE TABLE optimization_recommendations (
    id BIGSERIAL PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    atm_id BIGINT NOT NULL REFERENCES atms(id), prediction_id BIGINT REFERENCES predictions(id),
    current_cash NUMERIC(19,2) NOT NULL, predicted_demand NUMERIC(19,2) NOT NULL,
    safety_reserve NUMERIC(19,2) NOT NULL, recommended_refill_amount NUMERIC(19,2) NOT NULL,
    recommended_refill_date DATE NOT NULL, priority VARCHAR(20) NOT NULL, reason VARCHAR(1000) NOT NULL,
    status VARCHAR(20) NOT NULL, created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_recommendations_atm_id ON optimization_recommendations(atm_id);

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id), action VARCHAR(100) NOT NULL, entity_type VARCHAR(100) NOT NULL,
    entity_id BIGINT NOT NULL, old_value TEXT, new_value TEXT, timestamp TIMESTAMPTZ NOT NULL, ip_address VARCHAR(45)
);
CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);