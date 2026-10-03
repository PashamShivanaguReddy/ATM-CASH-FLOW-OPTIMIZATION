# Flowline User Guide

Flowline is an ATM cash-operations workspace for reviewing ATM status, transactions, cash inventory, replenishment requests, predictions, recommendations, and alerts. This guide describes the current website behavior; features marked as unavailable or placeholder are not connected to a live workflow yet.

## Getting Started

1. Open `http://localhost:5173` while the frontend and backend services are running.
2. Sign in with an account created for your environment. The site does not include public self-registration.
3. After successful sign-in, the site opens the requested page, or the dashboard if no destination was requested.
4. Use the left navigation to move between pages. On smaller screens, open it with the menu button.
5. Use **Sign out** in the top bar when finished.

A page may show an empty state when there are no matching records. A service error is different: use the page's retry control and check that the relevant backend service is running. Clear filters before concluding the system has no records.

## Page Access by Role

Navigation and route access depend on the signed-in role. An unavailable page may redirect to **Access not permitted**.

| Page | Super admin | Bank admin | Bank manager | ATM operator |
|---|---:|---:|---:|---:|
| Overview / Dashboard | Yes | Yes | Yes | Yes |
| ATMs and ATM details | Yes | Yes | Yes | Yes |
| Transactions | Yes | Yes | Yes | No |
| Cash inventory | Yes | Yes | No | Yes |
| Refills | Yes | Yes | Yes | Yes |
| Predictions | Yes | No | Yes | No |
| Recommendations | Yes | No | Yes | No |
| Alerts | Yes | No | Yes | No |
| Users | Yes | Yes | No | No |
| Reports | Yes | Yes | No | No |
| Settings | Yes | No | No | No |

Refill actions have their own permissions, described in [Refills](#refills). ATM records and user management are also limited by bank scope on the backend; a role with access to a page does not necessarily have access to every bank's records.

## Overview / Dashboard

The dashboard summarizes network activity and provides shortcuts into detailed pages.

- **Metric tiles** show total/active/low-cash/critical ATMs, total cash, today's withdrawals, predicted demand, open alerts, pending refills, and high-risk ATMs.
- **Charts** show the next seven days of demand, seven days of withdrawals and transaction volume, ATM cash levels, status distribution, and prediction-versus-actual demand.
- **Operations tables** show high-risk ATMs, recent alerts, pending recommendations, and recent transactions.
- Select an ATM or alert link in a table to open its related page.
- Use **ATM directory**, **Alert center**, or **Review all** to open the corresponding workspace.

Dashboard date ranges are chosen automatically by the page. Figures and risk levels come from backend services. Charts may be empty when there is no data for the selected period, even if older records exist.

## ATMs

### ATM directory

The directory lists ATM code, location, service status, risk, cash balance, and capacity. It displays 10 records per page.

- Search matches ATM code, location, city, or state on the currently loaded page.
- Filter by status: Active, Low cash, Maintenance, Out of service, or Inactive.
- Sort by recently added, ATM code, or cash balance.
- Use **Details** for the ATM overview or **Edit** to change its configuration.
- Use **Add ATM** to open the creation form.

### Create or edit an ATM

Provide the ATM code, bank ID, location, city, state, coordinates, type, status, capacity, cash thresholds, and current cash.

- ATM codes must be unique and no longer than 32 characters.
- Latitude must be between -90 and 90; longitude must be between -180 and 180.
- ATM types are Standard, Drive-through, and Kiosk.
- Cash capacity must be positive. Thresholds and current cash cannot be negative.
- The maximum threshold must be at least the minimum threshold.
- Keep current cash, cash capacity, thresholds, and denomination inventory consistent. Updating denomination inventory sets the ATM's current-cash total to the inventory total.
- Save opens the ATM detail page. Cancel returns to the directory or current ATM.

### ATM details

The detail page shows the ATM's status and risk, cash/capacity thresholds, location, coordinates, last refill, latest prediction, open alerts, denomination balances, and five recent transactions.

- Use **Refresh** to reload the ATM and related data.
- Use **Edit ATM** to change ATM configuration.
- Links in the alert section open the alert center.
- A missing prediction or denomination breakdown means none is recorded for that ATM; it does not mean the ATM itself is missing.

## Transactions

Transactions lists recorded activity. The default view sorts newest first and shows 20 records per page.

- Search by an exact transaction ID and select **Search**. Clear the search with the X button.
- Filter by ATM ID, transaction type, success/failure, and date range.
- Transaction types are Withdrawal, Deposit, Balance inquiry, and Other.
- Sort by newest/oldest timestamp or amount ascending/descending.
- Select **Clear filters** to restore the default view.
- Use **View** in a row to inspect the transaction ID, ATM, type, amount, result, card type, and timestamp.

Only successful withdrawal and deposit records change ATM cash. Balance inquiries and Other transactions are recorded but do not change cash. Failed transactions are recorded without applying the cash change.

This page is a transaction history and search view; it has no create-transaction form. Successful withdrawals and deposits update the ATM's cash total but do not update note counts. Reconcile denomination inventory after cash-changing activity.

## Cash Inventory

Cash Inventory is a read-only, network-level view of ATM denomination counts and amounts.

- Use **ATM scope** to view all ATMs or one ATM.
- The table aggregates note counts and amounts for denominations ₹2,000, ₹500, ₹200, ₹100, and ₹50.
- **Total ATM cash** is read from ATM records; denomination totals are displayed alongside it for reconciliation.
- If a row shows zero notes, no inventory was recorded for that denomination in the selected scope.

There is no inventory-edit form on this page. Current inventory is maintained by the cash-inventory workflow/API. Transactions and completed refills can change ATM cash without changing denomination counts; reconcile the note counts through the supported inventory operation so the totals match.

## Refills

The refill queue shows request ID, ATM, amount, status, and date. Search by refill ID or ATM ID, filter by status, and sort by newest or amount. Select **Details** to review timestamps, requester, approver, and notes.

### Request a refill

Users with the **Request refill** action (super admin or bank admin) can:

1. Select an ATM.
2. Enter a positive refill amount.
3. Optionally add notes.
4. Submit the request.

The request is rejected if the added cash would exceed ATM capacity.

### Review and complete a refill

The normal status sequence is:

`REQUESTED → APPROVED → COMPLETED`

A reviewer can instead reject a requested refill:

`REQUESTED → REJECTED`

- Super admins and bank managers can approve or reject requested refills.
- Super admins and ATM operators can complete approved refills.
- Rejected refills cannot be completed. Completed refills cannot be approved or rejected again.
- Completion adds the refill amount to ATM cash. It does not update denomination note counts; reconcile those separately as described under [Cash Inventory](#cash-inventory).
- The page offers no cancel action, even though Cancelled is included in the status filter options.

## Predictions

Predictions is available to super admins and bank managers.

1. Select an ATM.
2. Choose a prediction date.
3. Select **Generate prediction** and wait for the prediction service.
4. Review predicted demand, confidence, ATM risk, model version, and the demand chart.
5. Use **Refresh** to reload the latest prediction, forecast, and history.

The historical summary covers successful withdrawals in the recent 30-day range. Predictions are model-generated, not user-entered. The ATM code must be supported by the ML service's historical data; a newly created ATM without model history may fail prediction generation. Confidence and demand values are supplied by the model and should not be interpreted as guarantees.

## Recommendations

Recommendations is available to super admins and bank managers. It lists each recommendation's current cash, predicted demand, safety reserve, recommended refill amount/date, priority, reason, and status.

1. Select **Generate recommendation**.
2. Choose an ATM and optionally set a recommended date.
3. Select **Generate**. The optimization service calculates the amount and priority using ATM cash/capacity and available prediction data.
4. Review the reason, capacity constraints, and priority before acting.
5. For a pending recommendation, select **Approve** or **Reject** and confirm the decision.

A recommendation is a planning decision; generating or approving it does not itself create or complete a refill. Use the Refills page for the separate replenishment workflow. Only pending recommendations can be approved or rejected.

## Alerts

Alerts is available to super admins and bank managers.

- Filter the queue by Active, Acknowledged, or Resolved.
- Review alert type/message, severity, related ATM, created time, and status.
- Select an alert type/message to open its detail modal.
- Active alerts can be acknowledged. Any unresolved alert can be resolved.
- Use **Refresh** to reload the alert queue.

Alerts are generated by backend evaluation/events; this page does not provide a manual create-alert form. Acknowledging and resolving are distinct status changes.

## Users

Users is available to super admins and bank admins. Search by name/email and filter by role or status. The list is paginated and provides **Details**, **Edit**, and **Delete** actions.

### Create or edit a user

Provide first name, last name, email, optional phone, role, status, and bank ID when applicable.

- A new user needs a password of at least eight characters. When editing, leave the password blank to keep the current password.
- Roles are Super admin, Bank admin, Bank manager, and ATM operator.
- Only a super admin can assign the Super admin role.
- Bank administrators are restricted to their own bank and cannot manage super-admin accounts. They cannot grant the Super admin role.
- Status options are Active, Inactive, and Locked. Locked accounts cannot sign in.
- Deleting a user is a separate, confirmed action; it is not the same as setting the account Inactive. Do not delete or deactivate the account you are currently using.

Use **Details** to see email, role, status, phone, and bank assignment. Use **Edit user** to change supported fields.

## Reports

Reports is currently a placeholder page. It does not display live reports, export files, or generate operational summaries yet.

## Settings

Settings is currently a placeholder page available only to super admins. Workspace preferences and operational defaults are not connected to a configuration workflow yet.

## Suggested Operations Flow

1. Create or verify an ATM in **ATMs**. Confirm its bank, capacity, thresholds, and current cash.
2. Ensure the denomination inventory matches the ATM's cash total. The Cash Inventory page displays balances but does not edit them.
3. Review transaction activity in **Transactions**. The page is read-only; transactions must come from a connected transaction source or supported backend workflow.
4. Generate a prediction in **Predictions** for an ATM supported by the ML model's historical data.
5. Generate and review a recommendation in **Recommendations**. Approval records a decision; it does not create a refill.
6. Request a refill in **Refills**, then have an authorized reviewer approve or reject it. An authorized operator or super admin completes an approved refill.
7. Reconcile denomination inventory after withdrawals, deposits, or refill completion.
8. Review relevant **Alerts** and acknowledge or resolve them as appropriate.

## Sign-in Help and Current Limitations

- **Forgot password** is not implemented. The reset form is disabled; contact your organization administrator to restore access.
- If you are redirected to Sign in, authenticate in that browser profile. API credentials used elsewhere do not automatically create a browser session.
- If redirected to **Access not permitted**, the current role cannot open that page. Return to the dashboard or ask an administrator for the correct role.
- If a page reports a service error, retry after confirming the backend services are running. An empty state means the request succeeded but no records match the selected filters.
- The global search and notification icons in the top bar are visual controls only and do not currently open search/notification workflows.
- The sidebar's network-health copy and alert-count badge are static UI elements, not a live service-health check. Use page data and error messages to assess service availability.
- User accounts whose status is not Active cannot sign in; ask an administrator to restore the account status.
