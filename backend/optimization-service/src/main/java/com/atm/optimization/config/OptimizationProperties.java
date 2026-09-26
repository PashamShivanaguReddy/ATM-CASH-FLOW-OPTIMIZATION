package com.atm.optimization.config;

import java.math.BigDecimal;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "optimization")
public class OptimizationProperties {
    private BigDecimal defaultSafetyReserve = BigDecimal.ZERO;
    private int refillLeadDays = 0;
    private BigDecimal mediumRefillRatio = new BigDecimal("0.25");
    private BigDecimal highRefillRatio = new BigDecimal("0.50");
    private BigDecimal criticalRefillRatio = new BigDecimal("0.75");

    public BigDecimal getDefaultSafetyReserve() { return defaultSafetyReserve; }
    public void setDefaultSafetyReserve(BigDecimal value) { defaultSafetyReserve = value; }
    public int getRefillLeadDays() { return refillLeadDays; }
    public void setRefillLeadDays(int value) { refillLeadDays = value; }
    public BigDecimal getMediumRefillRatio() { return mediumRefillRatio; }
    public void setMediumRefillRatio(BigDecimal value) { mediumRefillRatio = value; }
    public BigDecimal getHighRefillRatio() { return highRefillRatio; }
    public void setHighRefillRatio(BigDecimal value) { highRefillRatio = value; }
    public BigDecimal getCriticalRefillRatio() { return criticalRefillRatio; }
    public void setCriticalRefillRatio(BigDecimal value) { criticalRefillRatio = value; }
}
