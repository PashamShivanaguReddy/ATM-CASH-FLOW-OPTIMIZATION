import csv
from api import forecast_atm


def main():
    with open('test_cases.csv', newline='') as f:
        rows = list(csv.DictReader(f))

    for row in rows:
        atm_id = row['ATM_ID']
        current_cash = float(row['Current Cash'])
        capacity = float(row['Capacity'])
        expected_priority = row['Expected Priority']
        expected_refill = row['Expected Refill']

        result = forecast_atm(atm_id, current_cash=current_cash, atm_capacity=capacity)
        decision = result['decision']
        forecast = result['forecast']
        route = result['route_group']

        priority_ok = decision['priority'] == expected_priority
        refill_ok = False
        if expected_refill == '>0':
            refill_ok = decision['recommended_refill_amount'] > 0
        elif expected_refill == '0 or small':
            refill_ok = decision['recommended_refill_amount'] <= 500000
        elif expected_refill == 'Depends on forecast':
            refill_ok = decision['recommended_refill_amount'] >= 0

        print(f"\nATM: {atm_id}")
        print('Priority:', decision['priority'])
        print('Expected Priority:', expected_priority)
        print('Refill:', decision['recommended_refill_amount'])
        print('Expected Refill:', expected_refill)
        print('Route Present:', bool(route))
        print('Forecast Length:', len(forecast['daily_forecast']))

        assert len(forecast['daily_forecast']) == 7
        assert all(value >= 0 for value in forecast['daily_forecast'])
        assert abs(forecast['total_forecast'] - sum(forecast['daily_forecast'])) < 1e-3
        assert priority_ok, f"Priority mismatch: {decision['priority']} != {expected_priority}"
        assert refill_ok, f"Refill mismatch: {decision['recommended_refill_amount']} did not satisfy {expected_refill}"
        assert route, 'Route group missing'

        print('Check: PASS')


if __name__ == '__main__':
    main()
