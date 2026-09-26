package com.atm.common.event;

public final class KafkaTopics {
    public static final String ATM_CREATED = "atm.created";
    public static final String ATM_UPDATED = "atm.updated";
    public static final String TRANSACTION_CREATED = "transaction.created";
    public static final String CASH_UPDATED = "cash.updated";
    public static final String REFILL_REQUESTED = "refill.requested";
    public static final String REFILL_COMPLETED = "refill.completed";
    public static final String PREDICTION_GENERATED = "prediction.generated";
    public static final String LOW_CASH_DETECTED = "low-cash.detected";
    public static final String STOCKOUT_RISK_DETECTED = "stockout-risk.detected";
    public static final String ALERT_GENERATED = "alert.generated";
    public static final String RECOMMENDATION_CREATED = "recommendation.created";

    private KafkaTopics() { }
}