import React, { useEffect, useState } from 'react';
import { getVaultFiles, downloadFile, createFile } from '../drive';
import { deriveKey, generateSalt, encryptString, decryptString } from '../crypto';
import { encodeBase64, decodeBase64 } from '../utils';
import type { VaultData, VaultMetadata } from '../types';
import { Lock, Eye, EyeOff, ShieldCheck, Cloud, ShieldAlert } from 'lucide-react';

interface UnlockProps {
  signal: AbortSignal;
  onUnlocked: (key: CryptoKey, data: VaultData, metadataId?: string, vaultId?: string) => void;
  onSignOut?: () => void;
}

/* -----------------------------------------------------------------------
   calculateStrength — Heuristic password strength meter for new vaults
   ----------------------------------------------------------------------- */
function calculateStrength(pass: string) {
  if (!pass) return null;
  let score = 0;
  if (pass.length >= 8) score++;
  if (pass.length >= 14) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^a-zA-Z0-9]/.test(pass)) score++;

  if (score <= 2) return { key: 'weak', label: 'Weak', color: '#EF4444', pct: '25%' };
  if (score === 3) return { key: 'fair', label: 'Fair', color: '#F59E0B', pct: '50%' };
  if (score === 4) return { key: 'good', label: 'Good', color: '#3B82F6', pct: '75%' };
  return { key: 'strong', label: 'Strong', color: '#22C55E', pct: '100%' };
}

/* -----------------------------------------------------------------------
   Unlock — Exact match for Reference Image 1 & Image 2 Screen 2
   ----------------------------------------------------------------------- */
export function Unlock({ signal, onUnlocked, onSignOut }: UnlockProps) {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Checking Drive…');
  const [error, setError] = useState('');
  const [isNewVault, setIsNewVault] = useState(false);
  const [metadataId, setMetadataId] = useState<string | undefined>(undefined);
  const [vaultId, setVaultId] = useState<string | undefined>(undefined);

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ── Check which vault files exist in Google Drive ────────────────────
  useEffect(() => {
    async function checkFiles() {
      try {
        setLoading(true);
        setError('');
        const files = await getVaultFiles(signal);
        setMetadataId(files.metadataId);
        setVaultId(files.vaultId);
        setIsNewVault(!(files.metadataId && files.vaultId));
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setError(err.message || 'Failed to access Google Drive.');
      } finally {
        setLoading(false);
      }
    }
    checkFiles();
  }, [signal]);

  // ── Main unlock / init handler ───────────────────────────────────────
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    setError('');
    setStatus('Unlocking vault…');

    try {
      if (isNewVault) {
        setStatus('Initializing new vault…');

        const salt = generateSalt();
        const key = await deriveKey(password, salt);

        const verifierResult = await encryptString('Vault Verification', key);
        const verifierJson = JSON.stringify(verifierResult);

        const metadata: VaultMetadata = {
          schemaVersion: 1,
          vaultVersion: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          salt: encodeBase64(salt),
          verifier: encodeBase64(new TextEncoder().encode(verifierJson)),
        };
        const mId = await createFile('metadata.json', JSON.stringify(metadata, null, 2), signal);

        const emptyVault: VaultData = {
          vaultVersion: 1,
          updatedAt: new Date().toISOString(),
          records: [],
        };
        const vaultResult = await encryptString(JSON.stringify(emptyVault), key);
        const vId = await createFile('vault.enc', JSON.stringify(vaultResult), signal);

        setPassword('');
        onUnlocked(key, emptyVault, mId, vId);

      } else {
        let mId = metadataId;
        let vId = vaultId;

        if (!mId || !vId) {
          const files = await getVaultFiles(signal);
          mId = files.metadataId;
          vId = files.vaultId;
          setMetadataId(mId);
          setVaultId(vId);
        }

        if (!mId || !vId) {
          throw new Error('Vault files could not be found in Google Drive. Please sign in again.');
        }

        setStatus('Downloading metadata…');
        const metadataContent = await downloadFile(mId, signal);
        const metadata: VaultMetadata = JSON.parse(metadataContent);

        setStatus('Deriving key…');
        const salt = decodeBase64(metadata.salt);
        const key = await deriveKey(password, salt);

        // Verify the password using the stored encrypted verifier
        try {
          const verifierJsonBytes = decodeBase64(metadata.verifier);
          const verifierJson = new TextDecoder().decode(verifierJsonBytes);
          const verifierResult = JSON.parse(verifierJson);
          const plaintext = await decryptString(verifierResult.ciphertext, verifierResult.iv, key);
          if (plaintext !== 'Vault Verification') throw new Error('Mismatch');
        } catch {
          throw new Error('Incorrect password or corrupted vault.');
        }

        setStatus('Decrypting vault…');
        const vaultEncContent = await downloadFile(vId, signal);
        const vaultResult = JSON.parse(vaultEncContent);
        const vaultPlaintext = await decryptString(vaultResult.ciphertext, vaultResult.iv, key);
        const vaultData: VaultData = JSON.parse(vaultPlaintext);

        setPassword('');
        onUnlocked(key, vaultData, mId, vId);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const strength = calculateStrength(password);

  return (
    <div className="auth-wrapper">
      <main className="auth-card" role="main">

        {/* Top Circular Badge */}
        <div className="auth-icon-circle" aria-hidden="true">
          <Lock size={30} strokeWidth={2.2} />
        </div>

        {/* Brand Wordmark & Title */}
        <h1 className="vault-wordmark" style={{ fontSize: '2.4rem', lineHeight: 1 }}>
          Vault
        </h1>
        <h2 className="auth-title">
          {isNewVault ? 'Create master password' : 'Unlock your vault'}
        </h2>

        {/* Explanatory Subtitle */}
        <p className="auth-subtitle">
          {isNewVault
            ? 'Set a master password to initialize and encrypt your new vault.'
            : 'Enter your master password to decrypt your secure data.'}
        </p>

        {/* Form Container */}
        <div style={{ width: '100%' }}>

          {/* Loading status */}
          {loading && !error && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }} role="status">
              {status}
            </p>
          )}

          {/* Error notice */}
          {error && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <p style={{ color: 'var(--color-danger)', fontSize: '0.84rem', lineHeight: '1.4' }} role="alert">
                {error}
              </p>
              {(error.includes('authorized') || error.includes('token') || error.includes('expired') || error.includes('session')) && onSignOut && (
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                  onClick={onSignOut}
                >
                  Sign in with Google again
                </button>
              )}
            </div>
          )}

          {!loading && (
            <form onSubmit={handleUnlock} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Notice for new vault */}
              {isNewVault && (
                <div style={{ background: 'var(--color-warning-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '0.85rem', fontSize: '0.78rem', color: 'var(--text-secondary)', textAlign: 'left', lineHeight: '1.5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-warning)', fontWeight: 600, marginBottom: '0.2rem' }}>
                    <ShieldAlert size={14} /> Crucial Security Notice
                  </div>
                  If you forget this master password, your vault data cannot be recovered. There is no reset.
                </div>
              )}

              {/* Password Input with lock icon and visibility toggle */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', textAlign: 'left' }}>
                <div className="input-with-icons">
                  <span className="input-lead-icon" aria-hidden="true">
                    <Lock size={16} />
                  </span>
                  <input
                    id="master-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Master password"
                    autoComplete={isNewVault ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    className="input-trail-icon"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Strength Meter (for new vault) */}
                {isNewVault && strength && (
                  <div style={{ marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      <span>Strength</span>
                      <span style={{ color: strength.color, fontWeight: 600 }}>{strength.label}</span>
                    </div>
                    <div style={{ height: '3px', width: '100%', background: 'var(--border-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: strength.pct, background: strength.color, transition: 'all 0.3s' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Primary Unlock Button */}
              <button
                id="btn-unlock"
                type="submit"
                className="btn-primary"
                style={{ width: '100%', padding: '0.75rem 1rem', fontSize: '0.925rem' }}
                disabled={loading || !password}
              >
                {isNewVault ? 'Initialize Vault' : 'Unlock'}
              </button>
            </form>
          )}

        </div>

        {/* Security Reassurance Box */}
        <div className="auth-security-box" style={{ marginTop: '1.75rem', marginBottom: 0 }}>
          <div className="auth-security-item">
            <ShieldCheck size={17} color="var(--color-success)" />
            <span>Encrypted locally in your browser</span>
          </div>
          <div className="auth-security-item">
            <Cloud size={17} color="var(--color-success)" />
            <span>Synced with Google Drive</span>
          </div>
          <div className="auth-security-item">
            <Lock size={17} color="var(--color-success)" />
            <span>Your password never leaves this device</span>
          </div>
        </div>

      </main>
    </div>
  );
}
