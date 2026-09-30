# Security Policy

## Reporting Vulnerabilities

If you discover any security issue within `mern-food-ordering-platform`, please submit your report directly to the security team.

## Security Practices & Platform Hygiene

1. **Service Account Credentials & Secrets**:
   - `service-account.json` templates must use dummy parameters (`YOUR_PROJECT_ID`, `YOUR_PRIVATE_KEY`) in repositories.
   - Real Firebase service account credentials and JWT secrets must be loaded via secure environment variables (`FIREBASE_SERVICE_ACCOUNT`, `JWT_SECRET`).

2. **Backend Express Protection**:
   - `helmet` middleware headers enforce secure HTTP headers.
   - `express-rate-limit` limits brute-force attempts on sensitive authentication and payment endpoints.
   - User passwords are securely hashed using `bcryptjs`.

3. **Payment Integrity**:
   - Order totals and payment verification calculations are computed server-side via Paytm/Razorpay SDKs.
