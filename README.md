# Vault — Zero-Knowledge Personal Vault

A modern, browser-only Personal Digital Vault that securely stores passwords, secure notes, identities, bank details, software licenses, and API keys.

Vault acts as a completely client-side application. It uses **Google Drive (appDataFolder)** as a dumb, encrypted storage backend. The application follows a strict **zero-knowledge architecture**, ensuring sensitive data is encrypted before leaving the browser.

## Security Model

**Vault Assumes:**
- Google Drive is honest-but-curious.
- Network traffic may be monitored.
- Google accounts may be compromised, giving an attacker access to the encrypted blobs.

**Vault Protects Against:**
- Unauthorized access to Google Drive files.
- Cloud storage compromise (the attacker only gets AES-GCM encrypted data).
- Network interception.

Sensitive vault data is encrypted before being transmitted. Only encrypted vault data is uploaded to Google Drive.

**Vault Does NOT Protect Against:**
- Malware on the user's device (e.g., keyloggers, malicious browser extensions).
- A compromised deployed frontend application (if an attacker modifies the static files).
- An attacker who knows your master password.

## Architecture

- **Frontend**: React 18, Vite, TypeScript.
- **Authentication**: Google Identity Services (GIS).
- **Storage**: Google Drive REST API v3 (strictly `appDataFolder`).
- **Cryptography**: Native Web Crypto API ONLY. No third-party crypto libraries.
  - Key Derivation: PBKDF2 with SHA-256 (600,000 iterations), random 16-byte salt.
  - Encryption: AES-256-GCM with random 12-byte IV.
- **Styling**: Plain CSS using CSS variables (no frameworks).

### Known Limitations
- Since this is a browser-based application, if the hosting server (e.g., Vercel) is compromised, malicious JavaScript could be served to intercept passwords.
- No offline support (PWA) in Version 1.

## Google Cloud Console Setup

To run this application, you must provide your own Google OAuth Client ID.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project.
3. Navigate to **APIs & Services** > **Library** and enable the **Google Drive API**.
4. Navigate to **OAuth consent screen**.
   - Choose **External** (or Internal if you have a Google Workspace).
   - Fill out the required fields.
   - Add the scope: `https://www.googleapis.com/auth/drive.appdata`.
   - Add yourself as a Test User.
5. Navigate to **Credentials**.
   - Create a new **OAuth client ID** (Web application).
   - Add Authorized JavaScript origins: `http://localhost:5173` (for local dev) and your production domain.
6. Copy the **Client ID**.

## Development

1. Clone the repository.
2. Run `npm install`.
3. Create a `.env` file in the root directory:
   ```env
   VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   ```
4. Run `npm run dev` to start the development server.

## Deployment

This application includes a `vercel.json` file pre-configured with strict security headers (CSP, Referrer-Policy, X-Content-Type-Options).

### Vercel
- Import the repository in Vercel.
- Set the `VITE_GOOGLE_CLIENT_ID` environment variable.
- Deploy.

### Netlify / GitHub Pages
- Similar steps, but you will need to translate the security headers from `vercel.json` to a `_headers` file (for Netlify) or handle headers via your web server.

## Future Improvements (Roadmap)
- Encrypted document storage
- Password generator & TOTP authenticator
- Offline PWA support
- Encrypted export/import
- Biometric unlock integration
