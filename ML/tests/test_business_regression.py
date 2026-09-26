import sys
import unittest
from pathlib import Path

PROJECT_SRC = Path(__file__).resolve().parents[1] / "project" / "src"
sys.path.insert(0, str(PROJECT_SRC))

from decision_engine import ATMDecisionEngine
from route_optimizer import build_route_plan


class TestBusinessRegression(unittest.TestCase):
    def test_risk_score_and_priority_assignment(self):
        assessment = ATMDecisionEngine.calculate_risk_score(
            current_cash=4200000.0,
            cash_capacity=6000000.0,
            total_forecast=4300000.0,
            daily_forecast=[620000, 580000, 540000, 510000, 690000, 720000, 640000],
            atm_type="Airport",
            festival=True,
            weekend=True,
            salary_day=False,
            weather="Rain",
            lead_time_days=3,
            distance_to_depot_km=32.0,
            historical_stockout_frequency=0.35,
            average_daily_withdrawal=550000.0,
            previous_refill_delay_days=4,
            cash_utilisation=0.82,
            days_since_last_refill=5,
            safety_buffer=500000.0,
        )
        self.assertGreaterEqual(assessment["risk_score"], 85)
        self.assertEqual(assessment["priority"], "CRITICAL")
        self.assertGreaterEqual(assessment["confidence"], 0)
        self.assertLessEqual(assessment["confidence"], 1)

    def test_cash_survival(self):
        survival = ATMDecisionEngine.calculate_cash_survival(
            current_cash=4200000.0,
            daily_forecast=[620000, 580000, 540000, 510000, 690000, 720000, 640000],
            next_cash_van_route="2026-08-04",
            route_date_offset_days=1,
        )
        self.assertEqual(len(survival["daily_remaining_cash"]), 7)
        self.assertFalse(survival["will_last_until_route"])
        self.assertIsNotNone(survival["estimated_stockout_date"])

    def test_refill_recommendation(self):
        refill = ATMDecisionEngine.build_refill_decision(
            daily_forecast=[620000, 580000, 540000, 510000, 690000, 720000, 640000],
            current_cash=4200000.0,
            atm_capacity=6000000.0,
            safety_buffer=500000.0,
            cash_van_schedule="2026-08-04",
            lead_time_days=1,
        )
        self.assertGreater(refill["recommended_refill_amount"], 0)
        self.assertLessEqual(refill["recommended_refill_amount"], 3900000.0)
        self.assertEqual(refill["recommended_refill_date"], "2026-08-05")

    def test_explainable_reasons(self):
        reasons = ATMDecisionEngine.create_reason_list(
            atm_type="Airport",
            festival=True,
            weekend=True,
            salary_day=False,
            weather="Rain",
            lead_time_days=3,
            distance_to_depot_km=32.0,
            historical_stockout_frequency=0.35,
            cash_after_forecast=-100000.0,
            cash_capacity=6000000.0,
            safety_buffer=500000.0,
            daily_forecast=[620000, 580000, 540000, 510000, 690000, 720000, 640000],
        )
        self.assertIn("Festival approaching", reasons)
        self.assertIn("Weekend demand expected", reasons)
        self.assertIn("Airport ATM", reasons)
        self.assertIn("Cash falls below safety threshold", reasons)

    def test_route_assignment(self):
        payloads = [
            {
                "atm_id": "ATM001",
                "risk_assessment": {"priority": "CRITICAL"},
                "decision": {"recommended_refill_amount": 2500000},
            },
            {
                "atm_id": "ATM002",
                "risk_assessment": {"priority": "HIGH"},
                "decision": {"recommended_refill_amount": 1400000},
            },
        ]
        route = build_route_plan(payloads)
        self.assertEqual(route["vehicles"], 1)
        self.assertEqual(route["sequence"], 2)
        self.assertIn("route_id", route)
        self.assertIn("vehicle", route)


if __name__ == "__main__":
    unittest.main()
