CREATE TABLE processed_events (
    event_id VARCHAR(128) PRIMARY KEY,
    event_type VARCHAR(128) NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL
);