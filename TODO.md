# TODO: Implement 2FA with Gmail after login

## Steps:
- [x] Update CAPSTONE_DENRO/settings.py: Add Gmail SMTP configuration
- [x] Modify DENRO/views.py: Update login_view to send 2FA code via email and redirect to verify page
- [x] Add verify_2fa view in DENRO/views.py
- [x] Update DENRO/urls.py: Add URL for verify_2fa
- [x] Create DENRO/templates/verify_2fa.html: Template for entering 2FA code
- [x] Test the implementation (Run the server and try logging in with a user who has an email)
