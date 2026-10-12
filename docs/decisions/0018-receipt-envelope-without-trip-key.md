# 0018 — Receipts from a phone without the trip key: per-receipt envelope

- Status: accepted (12 Oct 2026)
- Date: 2026-10-12

## Context

Receipts are encrypted with the trip key (ADR 0008). A member only gets a copy when a member who holds it opens Tekosue after the newcomer has published their public key. On 12 Oct a member who joined that morning paid and attached a receipt: the app refused with "This phone can't open this trip's receipts yet…", and nothing was recorded on-chain. Waiting for a friend to open the app is not acceptable for adding a receipt right after paying.

## Decision

- If the phone has the trip key, nothing changes.
- If it doesn't (`NoTripKeyError`), the receipt is sealed as an **envelope**: a random per-receipt AES-256 key encrypts the photo (same AAD binding to trip and payment), and that key is wrapped (X25519 + HKDF + AES-GCM, as for trip keys) for every member whose public key is registered, including the sender. Layout: `"TKSE1" ‖ count ‖ [address(20) ‖ wrap(92)]… ‖ nonce(12) ‖ ciphertext`.
- Opening checks the format: an envelope is opened with the reader's own wrap; anything else uses the trip key as before.
- The api and contract are unchanged: they only see ciphertext and its `keccak256`.

## Consequences

- Adding a receipt never waits for another member.
- A member whose public key was not registered when the envelope was made (joined later, or never opened the app) cannot open that receipt; the app says so. Trip-key receipts keep the old behaviour (unlock once the trip key is shared).
- Tests: `receipt-crypto.test.mts` (every listed member opens it, an outsider can't, it is bound to its payment).
