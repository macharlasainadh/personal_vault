import { useEffect, useState } from 'react';
import { initAuth, clearAccessToken } from './auth';
import { SignIn } from './components/SignIn';
import { Unlock } from './components/Unlock';
import { Dashboard } from './components/Dashboard';
import type { VaultData } from './types';

type AppState = "SIGN_IN" | "UNLOCK" | "DASHBOARD";

export default function App() {
  const [state, setState] = useState<AppState>("SIGN_IN");
  
  const [vaultData, setVaultData] = useState<VaultData | null>(null);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  
  const [, setMetadataId] = useState<string | undefined>(undefined);
  const [vaultId, setVaultId] = useState<string | undefined>(undefined);

  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [globalAbort, setGlobalAbort] = useState(new AbortController());

  useEffect(() => {
    initAuth((_token) => {
      setState("UNLOCK");
    }, (err) => {
      console.error(err);
      alert("Google Identity Services initialization or sign-in failed.");
    });
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLock = () => {
    // Abort pending requests
    globalAbort.abort();
    setGlobalAbort(new AbortController());

    // Clear decrypted state and keys from memory
    setVaultData(null);
    setCryptoKey(null);

    // Note: Do NOT wipe the Google OAuth access token on lock.
    // Locking only clears decrypted data and encryption keys so the user can unlock with master password.
    // Return to unlock
    setState("UNLOCK");
  };

  const handleSignOut = () => {
    globalAbort.abort();
    setGlobalAbort(new AbortController());
    setVaultData(null);
    setCryptoKey(null);
    clearAccessToken();
    setState("SIGN_IN");
  };

  // Implement auto-lock
  useEffect(() => {
    if (state !== "DASHBOARD") return;
    
    let timeoutId: number;
    const resetTimer = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        handleLock();
      }, 5 * 60 * 1000); // 5 minutes
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // According to requirements: Browser hidden for more than 5 minutes
        timeoutId = window.setTimeout(handleLock, 5 * 60 * 1000);
      } else {
        resetTimer();
      }
    };

    const events = ['mousemove', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    document.addEventListener('visibilitychange', handleVisibilityChange);

    resetTimer();

    return () => {
      window.clearTimeout(timeoutId);
      events.forEach(e => window.removeEventListener(e, resetTimer));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state, globalAbort]);

  return (
    <>
      {isOffline && (
        <div className="offline-banner" role="alert">
          Offline — changes will not sync until you reconnect.
        </div>
      )}
      
      {state === "SIGN_IN" && <SignIn />}
      
      {state === "UNLOCK" && (
        <Unlock 
          signal={globalAbort.signal}
          onSignOut={handleSignOut}
          onUnlocked={(key, data, mId, vId) => {
            setCryptoKey(key);
            setVaultData(data);
            setMetadataId(mId);
            setVaultId(vId);
            setState("DASHBOARD");
          }}
        />
      )}
      
      {state === "DASHBOARD" && vaultData && cryptoKey && vaultId && (
        <Dashboard 
          vaultData={vaultData}
          setVaultData={setVaultData}
          cryptoKey={cryptoKey}
          vaultId={vaultId}
          onLock={handleLock}
          onSignOut={handleSignOut}
          isOffline={isOffline}
          signal={globalAbort.signal}
        />
      )}
    </>
  );
}
