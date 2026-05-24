# Feature Spec: Google Sign-In for CRM

**Feature ID:** FEAT-007-google-sign-in
**Status:** Draft
**Author:** sdlc-ba
**Created:** 2026-05-22
**Last updated:** 2026-05-22

---

## 1. Problem Statement

CRM admins today can only sign in with an email and password. Creating and remembering yet another password adds friction at signup, generates avoidable password-reset support, and leaves auth on a weaker surface than delegated identity providers most admins already use.

## 2. Users & Stakeholders

- **CRM admin** — wants a one-click sign-in using their existing Google identity, without managing a separate password.

## 3. Goals

- Offer Google as an additional sign-in option for CRM admins.
- Preserve every existing email-password account and its current login flow.
- Reduce password-related friction for new CRM sign-ups.

## 5. User Stories

- **US-1:** As a new CRM admin, I want to sign up with my Google account so that I don't have to create a password.
- **US-2:** As an existing CRM admin with an email-password account, I want to start using Google sign-in for the same email so I no longer need my password.
- **US-3:** As a returning CRM admin who originally signed up with Google, I want to sign in with Google and land in my existing CRM dashboard.

## 6. Functional Requirements (FR)

| ID | Requirement | Related US |
|----|-------------|------------|
| FR-1 | The system shall display a "Continue with Google" button on the CRM auth page alongside the existing email-password form. | US-1, US-2, US-3 |
| FR-2 | The system shall authenticate the user via Google OAuth and receive at minimum the user's email, Google account ID, and `email_verified` flag. | US-1, US-2, US-3 |
| FR-3 | The system shall reject sign-in when Google reports `email_verified: false` and show a clear error. | US-1, US-2 |
| FR-4 | When the Google email matches no existing account, the system shall create a new CRM account using that email and store the Google account ID. | US-1 |
| FR-5 | When the Google email matches an existing email-password account and Google reports `email_verified: true`, the system shall link the Google account to the existing user without requiring the password. | US-2 |
| FR-6 | On successful Google sign-in, the system shall issue the same access and refresh tokens the email-password flow issues, and land the user on the CRM dashboard. | US-1, US-2, US-3 |
| FR-7 | The system shall keep the existing email-password login working unchanged for users who have not linked Google. | — |

## 7. Non-Functional Requirements (NFR)

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-1 | Security | The OAuth client secret must never be exposed to the browser. |
| NFR-2 | Security | Reject any Google identity assertion where `email_verified` is false. |
| NFR-3 | Privacy | Store only email, Google account ID, and optionally display name. Do not request profile photo, calendar, contacts, or any other scope. |

## 9. Acceptance Criteria

- [ ] AC-1: A user with no account clicks "Continue with Google", grants consent, and lands on the CRM dashboard. A new user record exists for their email.
- [ ] AC-2: A user with an existing email-password account clicks "Continue with Google" using the same email; they land on the CRM dashboard, and on the next visit can sign in with either Google or their original password.
- [ ] AC-3: A user whose Google email is not verified is shown an error and is not signed in.
- [ ] AC-4: Email-password login continues to work unchanged for accounts that never linked Google.
- [ ] All FRs above are satisfied and verifiable.

## 10. Out of Scope (deferred to future versions)

- Google sign-in for room members / buyers — target: backlog.
- Other OAuth providers (Apple, Microsoft, GitHub) — target: backlog.
- Workspace-domain allow-listing — target: backlog.
- Importing Google profile photo or display name into UI — target: backlog.
- Unlinking a Google account from an existing user — target: backlog.

## 11. Open Questions

- [ ] Should a Google-only account later be allowed to set a password as a fallback login?
- [x] What should happen if a user revokes the OAuth grant on Google's side after linking? **Resolved (2026-05-22):** No-op on our side. We do not poll Google or subscribe to RISC events. The user's existing CRM session (our own JWT) continues until normal expiry. On next sign-in, Google will re-prompt consent; granting it issues a fresh ID token and login proceeds normally. The `user.googleId` link in our DB stays intact. Explicit unlinking is a separate backlog feature (spec §10).

## 12. References

- Related features: FEAT-002 (room identity), existing CRM auth flow.
- Related ADRs: to be created — OAuth library, callback strategy, User-entity shape for `googleId`.
- Dependency: email verification for the email+password signup flow must ship before this feature reaches production, so that FR-5 cannot bind a Google account to an unverified existing record.
