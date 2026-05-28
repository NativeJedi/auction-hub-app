---
Feature ID: FEAT-008
Title: Email Confirmation on Registration
Status: Draft
Author: sdlc-ba
Created: 2026-05-26
---

## 1. Problem Statement

Users who register with email/password gain immediate access regardless of whether the email address is real or belongs to them. This allows fake accounts, typo-locked accounts, and makes email-based recovery unreliable.

## 2. Users & Stakeholders

- **New registrant** — wants a clear, frictionless path to confirm their email and start using the app.
- **Platform operator** — needs verified email addresses to send reliable notifications and reduce fraudulent accounts.

## 3. Goals

- Ensure every email/password account has a verified email before gaining access.
- Keep confirmation friction minimal: one-click link, valid for 24 h.

## 4. Non-Goals

- Email change / re-verification after account creation.
- Phone number verification.

## 5. User Stories

- **US-1** As a new registrant, I want to receive a confirmation email after signing up so that I can verify my address with one click.
- **US-2** As a new registrant whose token has expired, I want to request a new confirmation link so that I'm not permanently locked out.
- **US-3** As a platform operator, I want unverified accounts to be blocked from logging in so that only real email owners access the system.

## 6. Functional Requirements

| ID   | Requirement | Related US |
|------|-------------|------------|
| FR-1 | On successful registration, the system shall generate a signed email-confirmation token (TTL 24 h) and send a confirmation link to the provided email. | US-1 |
| FR-2 | The system shall block login for email/password accounts where `emailVerified = false`. | US-3 |
| FR-3 | `GET /auth/confirm-email?token=<jwt>` shall set `emailVerified = true` and redirect the user to the login page with a success notice. | US-1 |
| FR-4 | The system shall expose `POST /auth/resend-confirmation` (accepts email) that sends a new link if the account is unverified; rate-limited to 3 requests per hour per email. | US-2 |
| FR-5 | Google Sign-In accounts shall have `emailVerified = true` set at creation and bypass the confirmation flow. | US-3 |
| FR-6 | After registration, the client shall display a "check your email" screen with a resend option. | US-1, US-2 |

## 7. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Security | Confirmation token is a signed JWT; single-use invalidation not required for v1. |
| Deliverability | Email sent within 5 s of registration under normal load. |

## 8. Product Tradeoffs

- Single-use token invalidation (prevents replay after confirm) is deferred to keep v1 simple; JWT TTL provides sufficient security for now.
- No grace period — access is fully blocked until confirmation, trading slight friction for data integrity.

## 9. Acceptance Criteria

- AC-1: Registering with a new email/password triggers a confirmation email within 5 s; the user cannot log in before clicking the link.
- AC-2: Clicking the link in the email marks the account verified and allows subsequent login.
- AC-3: Attempting to log in with an unverified account returns a clear error message prompting the user to check their email.
- AC-4: Requesting a resend from the "check your email" screen delivers a new valid link; the previous link remains valid until its TTL.
- AC-5: A user who registers via Google Sign-In can log in immediately without any confirmation step.

## 10. Out of Scope

- HTML/styled email templates (plain-text email is acceptable for v1).
- Admin panel to manually verify or unverify accounts.
- Notification if a confirmation link is clicked from a different device/browser.

## 11. Open Questions

- Should expired/already-used confirmation links show a specific error page, or redirect to login with a generic "link invalid" message?
