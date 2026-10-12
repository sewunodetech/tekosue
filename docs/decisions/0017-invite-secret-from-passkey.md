# 0017 — Invite secret derived from the creator's passkey

- Status: accepted (12 Oct 2026)
- Date: 2026-10-12

## Context

An invite link carries a secret key whose address (`inviteKey`) is stored in `GroupVault` at `createGroup` (ADR 0005). The secret was random and saved only in the creator's device storage. After the move to the new APK (`com.tekosue.xyz`, ADR 0016) the creator's own phone had empty storage, so "Invite friends" on their own trip said "Ask the person who created this trip…". The same happened after any reinstall or phone change. The contract has no way to rotate `inviteKey`, and redeploying it a day before the deadline is not an option.

## Decision

- New trips derive the secret instead of generating it: `secret = keccak256(signMessage("Tekosue invite key … vault, chainId, endsAt, name … v1"))` with the creator's account (Mera key from the passkey; RFC 6979 signatures are deterministic, the same property the receipt keys rely on, ADR 0008). `name` and `endsAt` are stored on-chain, so the creator can rebuild it anywhere.
- "Invite friends" first reads the saved secret; if it is missing, it reads `getGroup`, and when the caller is the creator it derives the secret, checks it against the on-chain `inviteKey`, saves it and shares the link.
- Without the creator's key the secret cannot be computed, so invites stay as private as before. It is never sent to the api.

## Consequences

- Trips created before this change keep their random secret: only the app/phone that created them can share their link. The app says so instead of "Ask the person who created this trip" when the caller is the creator.
- Two trips by the same creator with the same name and the same end timestamp would share an invite key. An invite still names the trip (`groupId` is in the signed digest), so a link for one trip cannot be used to join the other unless both secrets are equal; with equal secrets a holder could join both. Accepted as an edge case.
