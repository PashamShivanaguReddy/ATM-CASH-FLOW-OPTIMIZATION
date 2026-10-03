# Flowline Manual Role and Workflow Test Guide

Prepared: 2026-10-02  
Purpose: a synthetic, manual test plan for the four application roles.

This guide describes the checked-in frontend and backend behavior. It does not verify the live user directory, bank IDs, or the data currently in your database. Use a development/test environment and synthetic records only. The super-admin session and four existing accounts reported by the user were not available to inspect when this guide was prepared.

## Before Testing

1. Sign in as the existing super-admin; do not create a duplicate account.
2. Find the actual bank ID and use it for the three bank-scoped accounts and test ATM. Do not assume the bank ID is `1`.
3. Use unique test emails and unique ATM and transaction IDs. If the sample ATM already exists, use another suffix.
4. Set each test account's password directly in the UI. Do not put real passwords, access tokens, or refresh tokens in this file or in chat. User passwords must be 8-72 characters in the backend.
5. UI actions are the recommended role tests. The API-only examples below require an authorized Bearer token and are not buttons in the UI.

## Role Capabilities in the Current UI

| Role | Visible areas | Actions available in the current frontend |
| --- | --- | --- |
| `SUPER_ADMIN` | Overview, ATMs, Transactions, Cash inventory, Refills, Predictions, Recommendations, Alerts, Users, Reports, Settings | Can access all routed areas. Can create/update/deactivate ATMs across banks; manage users, including assigning roles; request refills, approve/reject requests, and complete approved refills; generate predictions and recommendations; approve/reject recommendations; acknowledge/resolve alerts. Reports and Settings currently open placeholder pages, not working report/configuration tools. |
| `BANK_ADMIN` | Overview, ATMs, Transactions, Cash inventory, Refills, Users, Reports | Can manage ATMs and users in their own bank, view/filter transactions, view cash inventory, and request refills. Cannot create super-admins, review refill requests, complete refills, or access Predictions, Recommendations, or Alerts in the UI. Reports is a placeholder. |
| `BANK_MANAGER` | Overview, ATMs, Transactions, Refills, Predictions, Recommendations, Alerts | Can manage ATMs in their own bank, view/filter transactions, generate predictions and recommendations, approve/reject recommendations, review/approve/reject refill requests, and acknowledge/resolve alerts. Cannot manage users, request refills, complete refills, or open Reports in the UI. |
| `ATM_OPERATOR` | Overview, ATMs, Cash inventory, Refills | Can manage ATMs in their own bank under the current UI/backend ATM rules, view cash inventory, and complete approved refills. Cannot request or approve/reject refills. The Transactions page is not available to this role in the current UI; cash transaction creation is API-only. Predictions, Recommendations, Alerts, Users, and Reports are not available in the UI. |

### Important UI and API Boundaries

- The ATMs page and forms provide ATM create, edit, view, and deactivate operations. Bank-scoped accounts are restricted to their bank. The current domain does not model an ATM-level operator assignment.
- The Transactions page is a search/filter/details screen. It does not create transactions. The backend `POST /api/transactions` endpoint can create synthetic transactions for testing.
- The Cash inventory page displays totals and denominations but has no edit control. The backend `PUT /api/atms/{atmId}/cash` endpoint updates denomination counts and recalculates ATM cash.
- The Refills page supports request, approval/rejection, and completion according to the role actions in the table.
- Predictions call the prediction service. A saved prediction triggers best-effort alert evaluation. Forecast values are produced by the configured model and are not fixed sample outputs.
- Recommendations are calculated using ATM cash, prediction/demand, and safety reserve. The UI accepts an ATM and optional recommended date; it does not promise a predetermined recommendation amount.
- Alerts are generated from conditions such as low cash, stockout risk, high demand, out-of-service status, and unusual activity. There is no ordinary alert-create form.
- Reports and Settings are currently `PlaceholderPage` screens. There is no report export or settings save workflow to test yet.
- Role restrictions in the frontend and backend are not perfectly aligned. In particular, the prediction, alert, and optimization API controllers/services do not show role-specific authorization checks in the reviewed implementation, although the gateway requires authentication and the frontend hides these areas by role. Do not use API calls to bypass the UI role matrix; treat this as an authorization gap to verify/fix separately.
- Older documentation is not always current. The Phase 3 role table and architecture documents predate some later UI and service work. The current routes/forms and service authorization code are the source of truth for this test plan.

## Synthetic Test Accounts

Use these only as suggested, non-real identities. If your four test accounts already exist, keep using them and skip account creation. Set unique passwords locally in Flowline.

| First name | Last name | Email | Role | Bank ID | Status |
| --- | --- | --- | --- | --- | --- |
| Demo | Root | `demo.superadmin@example.test` | `SUPER_ADMIN` | Blank | `ACTIVE` |
| Demo | BankAdmin | `demo.bankadmin@example.test` | `BANK_ADMIN` | Existing bank ID | `ACTIVE` |
| Demo | Manager | `demo.manager@example.test` | `BANK_MANAGER` | Same existing bank ID | `ACTIVE` |
| Demo | Operator | `demo.operator@example.test` | `ATM_OPERATOR` | Same existing bank ID | `ACTIVE` |

User creation requires first name, last name, valid email, password, role, and status. A bank administrator is automatically limited to managing users in their own bank; only a super-admin may assign the `SUPER_ADMIN` role. Do not deactivate the account currently being used to test.

## Synthetic ATM Record

Create this from **ATMs → Create ATM** as a super-admin. Replace `bankId` with the ID of an existing bank. Use a new ATM code if this one already exists.

```json
{
  "atmCode": "ATM-DEMO-2026-01",
  "bankId": 1,
  "location": "Demo Branch, Deccan Road",
  "city": "Pune",
  "state": "Maharashtra",
  "latitude": 18.5204,
  "longitude": 73.8567,
  "atmType": "STANDARD",
  "status": "ACTIVE",
  "cashCapacity": 100000.00,
  "minimumCashThreshold": 10000.00,
  "maximumCashThreshold": 90000.00,
  "currentCash": 18000.00
}
```

The application may recalculate status from current cash: zero becomes `OUT_OF_SERVICE`, cash at or below the minimum becomes `LOW_CASH`, and cash above the minimum is normally `ACTIVE`. Capacity must be positive; cash cannot exceed capacity; minimum threshold cannot exceed maximum threshold.

## API-Only Sample Data

Use `http://localhost:8080` as the API gateway base URL and send `Authorization: Bearer <access-token>` from the account you are testing. Replace `<ATM_ID>` with the numeric ID returned by ATM creation. Use Postman or an API client; remove angle-bracket placeholders before sending requests.

### 1. Set Initial Denomination Counts

The denominations below total ₹18,000, matching the ATM record. Use this for `PUT /api/atms/<ATM_ID>/cash`.

```json
{
  "denominations": [
    { "denomination": 2000, "noteCount": 5 },
    { "denomination": 500, "noteCount": 10 },
    { "denomination": 200, "noteCount": 10 },
    { "denomination": 100, "noteCount": 5 },
    { "denomination": 50, "noteCount": 10 }
  ]
}
```

Accepted denominations are `2000`, `500`, `200`, `100`, and `50`. Counts must be zero or greater, denominations cannot be duplicated, and the total must not exceed ATM capacity.

### 2. Create Two Successful Withdrawal Records

The Transactions UI is read-only, so create these via `POST /api/transactions`. The timestamps are inside the 30-day history window for the example prediction date below. If you run this after `2026-10-03`, move the transaction timestamps to dates in the preceding 30 days and set the prediction date after both transactions. Keep IDs unique if you run the test more than once.

```json
{
  "transactionId": "TXN-DEMO-20261001-0001",
  "atmId": <ATM_ID>,
  "transactionType": "WITHDRAWAL",
  "amount": 7000.00,
  "timestamp": "2026-10-01T10:00:00Z",
  "success": true,
  "cardType": "RUPAY"
}
```

```json
{
  "transactionId": "TXN-DEMO-20261002-0002",
  "atmId": <ATM_ID>,
  "transactionType": "WITHDRAWAL",
  "amount": 6000.00,
  "timestamp": "2026-10-02T05:00:00Z",
  "success": true,
  "cardType": "VISA"
}
```

Expected ATM cash after both successful withdrawals is ₹5,000, below the ₹10,000 minimum threshold. Transaction types accepted by the backend are `WITHDRAWAL`, `DEPOSIT`, `BALANCE_INQUIRY`, and `OTHER`. The current Transactions filter also displays `TRANSFER`, but that value is not in the backend enum; do not use it in test requests.

### 3. Reconcile Denominations After Transactions

Successful transactions change ATM `currentCash`, but the transaction workflow does not update denomination rows. To keep the inventory screen consistent, use `PUT /api/atms/<ATM_ID>/cash` with these counts after the withdrawals; they total ₹5,000.

```json
{
  "denominations": [
    { "denomination": 2000, "noteCount": 1 },
    { "denomination": 500, "noteCount": 4 },
    { "denomination": 200, "noteCount": 3 },
    { "denomination": 100, "noteCount": 2 },
    { "denomination": 50, "noteCount": 4 }
  ]
}
```

### 4. Generate a Prediction

In **Predictions**, choose the test ATM and a date after the sample transaction timestamps, such as `2026-10-03`. The backend derives its input features from successful withdrawals in the previous 30 days. Do not expect a particular demand amount or confidence score; those depend on the running model and data.

API equivalent: `POST /api/predictions/<ATM_ID>` with:

```json
{ "predictionDate": "2026-10-03" }
```

After prediction evaluation, expect a `LOW_CASH` alert for the ATM while its cash remains ₹5,000, unless an open alert of the same type already exists. The app deduplicates matching open alerts.

### 5. Generate a Refill Recommendation

In **Recommendations**, select the test ATM and optionally set `2026-10-03` as the recommended date. Review the generated demand, reserve, refill amount, priority, and reason; these are calculated values, not fixed expected output. Approve or reject a pending recommendation as a super-admin or bank manager.

For an API smoke test only, the optimization endpoint accepts a request such as:

```json
{
  "predictedDemand": 18000.00,
  "safetyReserve": 5000.00,
  "recommendedRefillDate": "2026-10-03"
}
```

Send it to `POST /api/optimization/atms/<ATM_ID>/recommend`. This explicit demand is a manually supplied test value; it is not a claim about the model's output.

### 6. Request, Approve, and Complete a Refill

Follow the workflow with different role accounts so the audit trail demonstrates role separation:

1. As `BANK_ADMIN` or `SUPER_ADMIN`, submit this from the Refills UI or `POST /api/refills`:

   ```json
   {
     "atmId": <ATM_ID>,
     "refillAmount": 20000.00,
     "notes": "Synthetic manual role test"
   }
   ```

2. As `BANK_MANAGER` or `SUPER_ADMIN`, approve the new `REQUESTED` refill. A bank manager may instead reject it; a rejected request cannot then be completed.
3. As `ATM_OPERATOR` or `SUPER_ADMIN`, complete an `APPROVED` refill. Expected ATM cash becomes ₹25,000, within the ₹100,000 capacity.
4. Reconcile denomination inventory after completion using the `PUT /api/atms/<ATM_ID>/cash` endpoint, since completing a refill updates ATM cash but does not add note counts. One ₹25,000 example is: 8 × ₹2,000, 10 × ₹500, 10 × ₹200, 10 × ₹100, and 20 × ₹50.

The allowed refill transitions are `REQUESTED → APPROVED`, `REQUESTED → REJECTED`, and `APPROVED → COMPLETED`. Refill requests that exceed remaining ATM capacity are rejected.

## Manual Role Test Checklist

| Sign in as | Verify these UI actions |
| --- | --- |
| `SUPER_ADMIN` | View all pages; verify existing users; create the demo ATM if needed; generate prediction/recommendation; acknowledge or resolve an alert; request and review a refill. |
| `BANK_ADMIN` | View only own-bank users/ATMs; create a non-super-admin user if needed; view transactions and cash; request a refill; confirm no review/complete controls and no Predictions/Recommendations/Alerts navigation. |
| `BANK_MANAGER` | View transactions; generate prediction/recommendation; approve or reject a pending recommendation; approve or reject a requested refill; acknowledge or resolve an alert; confirm Users is unavailable. |
| `ATM_OPERATOR` | View own-bank ATMs and denomination inventory; confirm Transactions is unavailable in the UI; complete an approved refill; confirm request/approve/reject controls are unavailable. |

For each account, verify a different bank cannot be accessed. A missing navigation item or route should not be treated as proof that every backend endpoint enforces the same role restriction; see the authorization caveat above.

## Documentation Notes

The project documentation is useful but contains historical state. `backend/PHASE_3_RESULT.md` describes an earlier role matrix; later phases added transaction, inventory, prediction, alert, optimization, and analytics behavior. `.github/docs/ARCHITECTURE.md` and `frontend/README.md` also contain statements that do not match the current checked-in frontend/user-management code. Use the current app code and this guide's explicit UI/API distinctions when manually verifying behavior.

Relevant references: [backend/README.md](backend/README.md), [frontend/README.md](frontend/README.md), [backend/PHASE_3_RESULT.md](backend/PHASE_3_RESULT.md), [backend/PHASE_4_RESULT.md](backend/PHASE_4_RESULT.md), [backend/PHASE_5_RESULT.md](backend/PHASE_5_RESULT.md), [backend/PHASE_6_RESULT.md](backend/PHASE_6_RESULT.md), [backend/PHASE_7_RESULT.md](backend/PHASE_7_RESULT.md), [backend/PHASE_8_RESULT.md](backend/PHASE_8_RESULT.md), [backend/PHASE_9_RESULT.md](backend/PHASE_9_RESULT.md), [backend/PHASE_10_RESULT.md](backend/PHASE_10_RESULT.md), [backend/PHASE_11_RESULT.md](backend/PHASE_11_RESULT.md), [backend/PHASE_12_RESULT.md](backend/PHASE_12_RESULT.md), [backend/PHASE_14_RESULT.md](backend/PHASE_14_RESULT.md), [.github/docs/ARCHITECTURE.md](.github/docs/ARCHITECTURE.md), [ML/SYSTEM_ARCHITECTURE.md](ML/SYSTEM_ARCHITECTURE.md), and [ML/project/README.md](ML/project/README.md).