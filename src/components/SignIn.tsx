import { requestDriveAccess } from '../auth';
import { Lock, Cloud, Shield } from 'lucide-react';

/* -----------------------------------------------------------------------
   Google "G" logo SVG
   ----------------------------------------------------------------------- */
function GoogleGLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
      focusable="false"
    >
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

/* -----------------------------------------------------------------------
   SignIn — Exact match for Reference Image 1 & Image 2 Screen 1
   ----------------------------------------------------------------------- */
export function SignIn() {
  return (
    <div className="auth-wrapper">
      <main className="auth-card" role="main">

        {/* Top Icon Badge */}
        <div className="auth-icon-badge" aria-hidden="true">
          <Lock size={24} strokeWidth={2.2} />
        </div>

        {/* Brand Wordmark & Title */}
        <h1 className="vault-wordmark" style={{ fontSize: '2.4rem', lineHeight: 1 }}>
          Vault
        </h1>
        <h2 className="auth-title">
          Your private vault
        </h2>

        {/* Description */}
        <p className="auth-subtitle">
          Passwords, notes and sensitive information encrypted in your browser before it reaches Google Drive.
        </p>

        {/* Security Highlights Box */}
        <div className="auth-security-box">
          <div className="auth-security-item">
            <Lock size={17} />
            <span>Client-side encryption</span>
          </div>
          <div className="auth-security-item">
            <Cloud size={17} />
            <span>Stored in your Google Drive private folder</span>
          </div>
          <div className="auth-security-item">
            <Shield size={17} />
            <span>Zero-knowledge. Only you can access your data.</span>
          </div>
        </div>

        {/* Primary Continue with Google Button */}
        <button
          id="btn-google-signin"
          className="btn-google-auth"
          onClick={() => requestDriveAccess()}
        >
          <GoogleGLogo />
          Continue with Google
        </button>

        {/* Scope & Privacy Explanation */}
        <p className="auth-footer-note">
          We only request access to your app's private storage (drive.appdata).
        </p>

        {/* Tagline */}
        <p className="auth-footer-tagline">
          A safer, more private you.
        </p>

      </main>
    </div>
  );
}
