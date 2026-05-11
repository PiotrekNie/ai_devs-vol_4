**Draft QA comment — review before posting to Jira**

---

### 📝 QA Summary

**Task Context:** Implementation of multi-factor authentication (MFA) toggle in user settings.

**Main Changes:**
- Added a new section in User Settings to manage security preferences.
- Implemented a toggle switch to enable/disable MFA via Email.
- Updated the login flow to challenge the user for a code if MFA is active.
- Added descriptive error messages for invalid or expired MFA codes.

---

**✅ Verification List:**

**Manual Testing:**
- [ ] Navigate to Settings -> Security and verify the MFA toggle is visible.
- [ ] Enable MFA and logout. Verify that the system asks for an email code during the next login.
- [ ] Test the "Resend Code" functionality to ensure it triggers a new email.
- [ ] Verify that disabling MFA removes the extra step during login.

**Automation & Technical Notes:**
- **Selectors**: The MFA toggle can be targeted via `data-testid="mfa-toggle-switch"`.
- **API**: New endpoint `POST /api/v1/auth/mfa/verify` handles code validation.
- **Error Handling**: Invalid codes return a `422 Unprocessable Entity` with a `code_expired` or `code_invalid` reason.

---

## ❌ Avoid vs ✅ Prefer — readability contrast

The following examples use an OAuth callback feature to show the difference between a developer-facing bullet and a QA-facing one.

### ❌ Avoid (developer-facing, not readable by QA)

> - Authorization error responses from the provider are handled explicitly and are no longer treated the same as a normal post-logout redirect without a code.
> - For recoverable interaction errors (login_required, consent_required, interaction_required), the user is redirected to a full interactive sign-in flow while preserving the intended return destination.
> - For other authorization errors (including user cancellation), the user is sent back to the saved return URL with an auth_error query parameter describing the failure.

These bullets describe internal implementation decisions. A QA engineer cannot reproduce or verify them without reading the code.

### ✅ Prefer (behavior-first, QA-readable)

> - **After a failed login attempt**, if the identity provider signals that the user must sign in again or approve permissions, the app now redirects them to the normal login screen and returns them to their original destination afterwards.
> - **If the user cancels the sign-in**, or if the provider rejects the request for any other reason, the user is sent back to the page they came from and shown a clear error message.
> - **After a successful logout**, the behavior is unchanged: the user's session is cleared and they are taken to the home page.

Write for the tester who will click through the app, not for the reviewer reading the diff.
