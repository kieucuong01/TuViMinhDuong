# PayOS Smoke Evidence - 2026-05-22

Environment: legacy production smoke evidence, now mapped to `https://lasotinhhoa.vn`

Webhook expected:

```text
https://lasotinhhoa.vn/api/webhooks/payos
```

## Create Checkout

Command:

```bash
npm run smoke:payos -- create --package full-reading --app-url https://lasotinhhoa.vn
```

Result:

```text
ok: true
orderCode: 941606773117
packageKey: full-reading
amountVnd: 199000
coins: 209
userEmail: payos-smoke-941606773117@lasotinhhoa.local
paymentLinkId: c56dd5ff4b9e4fa9837f6b647273a533
PaymentOrder initial status: PENDING
```

## Pre-Payment Inspect

Command:

```bash
npm run smoke:payos -- inspect --order-code 941606773117
```

Result:

```text
status: PENDING
paidAt: null
userCoinBalance: 0
ledgerCredit.count: 0
ledgerCredit.amount: 0
checks.creditedExactCoins: true
checks.duplicateWebhookDidNotDoubleCredit: true
```

Interpretation:

- Checkout creation works against PayOS and production app URL.
- Return URL has not credited coins.
- Coin credit is still waiting for PayOS webhook, as intended.

## Pending Manual Step

Open the checkout URL from the smoke command output, complete PayOS sandbox/production payment, then run:

```bash
npm run smoke:payos -- inspect --order-code 941606773117
```

Pass criteria after payment:

```text
status: PAID
ledgerCredit.count: 1
ledgerCredit.amount: 209
checks.paid: true
checks.creditedExactCoins: true
checks.duplicateWebhookDidNotDoubleCredit: true
```
