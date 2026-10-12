# 0016 — Finish the rename: native identity, EAS project and device keys become "tekosue"

- Status: accepted (12 Oct 2026)
- Date: 2026-10-12
- Supersedes the "kept" table in [ADR 0011](0011-rebrand-tekosue.md)

## Context

ADR 0011 renamed everything users see but kept the old spelling in native identifiers, the EAS project, device storage keys, notification sound/channel ids and the receipt-encryption labels, because changing them meant a new app install and a new EAS project. On 12 Oct the team decided to finish the rename before the submission: a new Android build is needed anyway for Firebase push (ADR 0015).

## Decision

| Was | Now | Compatibility |
| --- | --- | --- |
| Android package / iOS bundle `com.tekosoe.xyz` | `com.tekosue.xyz` | Installs as a new app. `assetlinks.json` lists **both** packages with the same certificate fingerprints, so the old APK keeps signing in until people move. The EAS keystore must be reused (see Consequences). |
| EAS slug/project `tekosoe` | `tekosue` | `extra.eas.projectId` removed from `app.json`; `eas init` creates the new project and writes the new id. |
| Device keys `tekosoe_*` | `tekosue_*` | No migration: a new package starts with empty storage anyway. Signing in with the same passkey restores the same account. |
| `tekosoe.wav`, channel `tekosoe-chime` | `tekosue.wav`, `tekosue-chime` | The api sends the new channel; the legacy-channel cleanup was dropped (nothing to clean in a fresh install). |
| Receipt labels `tekosoe/trip-key-wrap/v1`, `tekosoe/receipt/v1/…` | `tekosue/…` | New receipts and trip-key wraps use the new labels. Decryption tries the new label, then the old one, so every receipt attached before today still opens (`receipt-crypto.test.mts`). |
| Indexer name `tekosoe-indexer`, root `app.json` package, doc mentions | `tekosue` | — |

`scripts/rebrand-guard.test.mjs` now only allows "tekosoe" in history files (ADR 0011, this ADR, `docs/STATUS.md`), the two legacy encryption labels, and the old package entry in `assetlinks.json`.

## Consequences

- **Before the first build of the new project**, reuse the signing key so passkeys and App Links keep working with the fingerprints already published: download the keystore from the old project (`eas credentials` → Android → `com.tekosoe.xyz` → Keystore → Download) and upload it to the new project for `com.tekosue.xyz`. With a new keystore instead, its SHA-256 must be added to `assetlinks.json` before passkey sign-in works.
- Firebase (ADR 0015) is registered for `com.tekosue.xyz`.
- The EAS build link in the submission and on `/get-app` (`NEXT_PUBLIC_ANDROID_APK_URL`) must point at the first build of the new project. The README now links only to `/get-app`.
- The iOS AASA still uses the `TEAMID` placeholder (unchanged from ADR 0011); only the bundle id changed.
