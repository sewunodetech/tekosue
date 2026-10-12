# 0015 — Card history from the pot, Nudge through the api, Firebase for background push

- Status: accepted (12 Oct 2026)
- Date: 2026-10-12

## Context

Testing the Android APK on two phones on 12 Oct showed three problems:

1. **12 Card was a mock.** It listed two fixed demo shops (Konbini Shibuya, Tokyo Taxi). Konbini only opened the trip page and Tokyo Taxi opened S4, so the tab never showed what had actually been paid with the card.
2. **Nudge notified the wrong phone.** On S2 Waiting, "Nudge sotong" called the in-app `notify()`, which shows an OS notification on the *same* device. The person asking got "… nudged you"; sotong got nothing.
3. **No push while the app was closed.** The Android build had no Firebase config (`google-services.json`), so `getExpoPushTokenAsync` failed, no token reached `/api/push/subscribe`, and the api (ADR 0014) had nobody to push to. The only notifications people saw were local ones the app raised while it was open.

## Decision

- **12 Card shows "Card history"**: the pot's payments for the card's trip (live: Envio, the same `Trip.activity` as 07 Trip), newest first, each opening 11 Payment details (or S2 when it still waits for a yes). The demo shop list is removed; "Tap to pay" opens 09 Pay from pot, which already pays the demo shop address on-chain. The card uses the first trip that hasn't settled yet. The card itself stays labelled "Simulated".
- **Nudge goes through the api**: `POST /api/groups/:groupId/spends/:spendId/nudge` (signed in, member of the trip, only the spender, only while the payment is pending, 3 per minute per person per payment). The api pushes "{name} is still waiting for a yes on $X from the pot. Tap to approve." to every *other* member's registered token, linking to 10 Approval. The asking phone only shows an in-app banner ("Nudge sent"), never an OS notification.
- **Firebase for Android push**: `app.config.ts` sets `android.googleServicesFile` from the EAS file variable `GOOGLE_SERVICES_JSON`, or `./google-services.json` when present locally. The push token is requested with the EAS `projectId` explicitly.

## Consequences

- Background push needs two one-time steps outside the repo: a Firebase project for package `com.tekosue.xyz` (its `google-services.json` uploaded as the EAS `GOOGLE_SERVICES_JSON` file variable for `preview`), and its FCM V1 service-account key uploaded in EAS credentials. Then a new APK. The service-account key is never committed (`.gitignore`).
- The api must run with `FEATURE_PUSH=true` for both event pushes and nudges; with it off, nudge answers `{ sent: 0 }`.
- Tokyo Taxi no longer links to S4 from the card; S4 stays reachable from a failed payment.
