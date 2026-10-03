ALTER TABLE cash_refills ADD COLUMN recommendation_id BIGINT REFERENCES optimization_recommendations(id);
CREATE UNIQUE INDEX uk_cash_refills_recommendation_id ON cash_refills(recommendation_id) WHERE recommendation_id IS NOT NULL;

CREATE TABLE prediction_evaluations (
    id BIGSERIAL PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    prediction_id BIGINT NOT NULL REFERENCES predictions(id),
    atm_id BIGINT NOT NULL REFERENCES atms(id),
    prediction_date DATE NOT NULL,
    model_version VARCHAR(64) NOT NULL,
    actual_demand NUMERIC(19,2) NOT NULL,
    predicted_demand NUMERIC(19,2) NOT NULL,
    absolute_error NUMERIC(19,2) NOT NULL,
    percentage_error NUMERIC(10,4),
    evaluated_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_prediction_evaluation_prediction_id UNIQUE(prediction_id)
);
CREATE INDEX idx_prediction_evaluations_atm_id ON prediction_evaluations(atm_id);
CREATE INDEX idx_prediction_evaluations_date ON prediction_evaluations(prediction_date);
