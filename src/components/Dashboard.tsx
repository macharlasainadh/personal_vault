import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { VaultData, VaultRecord, SubAccount, UserProfile } from '../types';
import { encryptString } from '../crypto';
import { updateFile, AuthError, getUserProfile } from '../drive';
import { requestDriveAccess } from '../auth';
import {
  Lock, Search, Plus, Key, FileText, User, Landmark, Shield,
  TerminalSquare, Copy, Trash2, Zap, Eye, EyeOff, Star,
  MoreVertical, ChevronRight, ArrowLeft, X, Home, Settings,
  LogOut, Layers, RefreshCw, Sun, Moon, Laptop,
  ShieldCheck
} from 'lucide-react';

/* -----------------------------------------------------------------------
   Props & Navigation Types
   ----------------------------------------------------------------------- */

interface DashboardProps {
  vaultData: VaultData;
  setVaultData: React.Dispatch<React.SetStateAction<VaultData | null>>;
  cryptoKey: CryptoKey;
  vaultId: string;
  isOffline: boolean;
  signal: AbortSignal;
  onLock: () => void;
  onSignOut?: () => void;
}

type NavView =
  | 'overview'
  | 'all'
  | 'password'
  | 'note'
  | 'identity'
  | 'bank'
  | 'license'
  | 'apikey'
  | 'favorites'
  | 'search'
  | 'settings';

/* -----------------------------------------------------------------------
   User Profile Avatar Component (NEVER displays the letter "S")
   ----------------------------------------------------------------------- */
function UserAvatar({
  profile,
  onClick,
  size = 32,
}: {
  profile?: UserProfile | null;
  onClick?: () => void;
  size?: number;
}) {
  const [imgError, setImgError] = useState(false);

  // Reset imgError if photoUrl changes
  useEffect(() => {
    setImgError(false);
  }, [profile?.photoUrl]);

  return (
    <button
      type="button"
      className="user-avatar-btn"
      onClick={onClick}
      style={{ width: `${size}px`, height: `${size}px` }}
      title={profile?.name ? `${profile.name} (${profile.email || ''})` : 'Google Account'}
      aria-label="Google Account"
    >
      {profile?.photoUrl && !imgError ? (
        <img
          src={profile.photoUrl}
          alt={profile.name || 'Account'}
          className="user-avatar-img"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="user-avatar-fallback" aria-hidden="true">
          <User size={Math.round(size * 0.48)} />
        </div>
      )}
    </button>
  );
}

/* -----------------------------------------------------------------------
   Smart Service Brand Icon
   ----------------------------------------------------------------------- */
function ServiceIcon({ title, type }: { title: string; type: string }) {
  const lower = title.toLowerCase();

  // GitHub
  if (lower.includes('github')) {
    return (
      <div className="item-service-icon" style={{ background: '#181E2A', color: '#F3F4F6' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
        </svg>
      </div>
    );
  }

  // Google
  if (lower.includes('google')) {
    return (
      <div className="item-service-icon" style={{ background: '#1A2130' }}>
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      </div>
    );
  }

  // Generic by Type (Neutral Modern Theme Colors)
  switch (type) {
    case 'password':
      return <div className="item-service-icon" style={{ color: 'var(--accent)' }}><Key size={18} /></div>;
    case 'note':
      return <div className="item-service-icon" style={{ color: 'var(--color-success)' }}><FileText size={18} /></div>;
    case 'identity':
      return <div className="item-service-icon" style={{ color: '#A855F7' }}><User size={18} /></div>;
    case 'bank':
      return <div className="item-service-icon" style={{ color: '#0EA5E9' }}><Landmark size={18} /></div>;
    case 'license':
      return <div className="item-service-icon" style={{ color: '#6366F1' }}><Shield size={18} /></div>;
    case 'apikey':
      return <div className="item-service-icon" style={{ color: '#F43F5E' }}><TerminalSquare size={18} /></div>;
    default:
      return <div className="item-service-icon" style={{ color: 'var(--accent)' }}><Key size={18} /></div>;
  }
}

/* -----------------------------------------------------------------------
   Format Relative Date helper (e.g. "2 hours ago", "1 day ago")
   ----------------------------------------------------------------------- */
function formatRelativeTime(isoString: string): string {
  if (!isoString) return 'Just now';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour} hours ago`;
  if (diffDay === 1) return '1 day ago';
  if (diffDay < 7) return `${diffDay} days ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} weeks ago`;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/* -----------------------------------------------------------------------
   Main Dashboard Component
   ----------------------------------------------------------------------- */
export function Dashboard({
  vaultData,
  setVaultData,
  cryptoKey,
  vaultId,
  isOffline,
  signal,
  onLock,
  onSignOut,
}: DashboardProps) {
  // Navigation & View State
  const [currentView, setCurrentView] = useState<NavView>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<'updated' | 'alphabetical' | 'favorites'>('updated');

  // Authenticated User Profile (fetched safely with existing drive.appdata token)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Theme State: 'dark' | 'light' | 'system'
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>(() => {
    try {
      return (localStorage.getItem('vault_theme') as any) || 'dark';
    } catch {
      return 'dark';
    }
  });

  // Modal / Drawer states
  const [typeSelectorOpen, setTypeSelectorOpen] = useState(false);
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [detailsRecordId, setDetailsRecordId] = useState<string | null>(null);

  // Form State
  const [editForm, setEditForm] = useState<Partial<VaultRecord>>({});
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [showFormPassword, setShowFormPassword] = useState(false);

  // Sync state
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'error' | 'auth_error'>('synced');
  const [, setSavedBadgeId] = useState<string | null>(null);

  const records = vaultData.records;

  // ── Fetch user profile once on mount ──────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    getUserProfile(signal).then((profile) => {
      if (isMounted && profile && (profile.name || profile.email || profile.photoUrl)) {
        setUserProfile(profile);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [signal]);

  // ── Apply Theme ──────────────────────────────────────────────────────
  const handleThemeChange = (newTheme: 'dark' | 'light' | 'system') => {
    setTheme(newTheme);
    try {
      localStorage.setItem('vault_theme', newTheme);
      document.documentElement.dataset.theme = newTheme;
    } catch (e) {
      console.warn('Could not save theme preference:', e);
    }
  };

  // ── Dynamic Greeting based on time of day & authenticated user ────────
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const firstName = userProfile?.name ? userProfile.name.split(' ')[0] : '';
    const nameSuffix = firstName ? `, ${firstName}` : '';
    if (hour < 12) return `Good morning${nameSuffix}`;
    if (hour < 17) return `Good afternoon${nameSuffix}`;
    return `Good evening${nameSuffix}`;
  }, [userProfile]);

  // ── Filtered & Sorted records ─────────────────────────────────────────
  const filteredRecords = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return records
      .filter((r) => {
        let matchCat = true;
        if (currentView === 'all' || currentView === 'overview' || currentView === 'search' || currentView === 'settings') {
          matchCat = true;
        } else if (currentView === 'favorites') {
          matchCat = !!r.favorite;
        } else {
          matchCat = r.type === currentView;
        }

        if (!q) return matchCat;

        const matchMain =
          r.title.toLowerCase().includes(q) ||
          (r.username && r.username.toLowerCase().includes(q)) ||
          (r.notes && r.notes.toLowerCase().includes(q)) ||
          (r.tags && r.tags.some((t) => t.toLowerCase().includes(q)));

        const matchSub = Boolean(
          r.subAccounts?.some(
            (sub) =>
              (sub.label && sub.label.toLowerCase().includes(q)) ||
              (sub.email && sub.email.toLowerCase().includes(q)) ||
              (sub.username && sub.username.toLowerCase().includes(q)) ||
              (sub.notes && sub.notes.toLowerCase().includes(q))
          )
        );

        return matchCat && (matchMain || matchSub);
      })
      .sort((a, b) => {
        if (sortMode === 'updated') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        if (sortMode === 'alphabetical') return a.title.localeCompare(b.title);
        if (sortMode === 'favorites') return (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0);
        return 0;
      });
  }, [records, currentView, searchQuery, sortMode]);

  // ── Statistics Counts ─────────────────────────────────────────────────
  const stats = useMemo(() => {
    return {
      total: records.length,
      passwords: records.filter((r) => r.type === 'password').length,
      notes: records.filter((r) => r.type === 'note').length,
      favorites: records.filter((r) => r.favorite).length,
    };
  }, [records]);

  // ── Selected Record for Details ───────────────────────────────────────
  const selectedRecord = useMemo(() => {
    return records.find((r) => r.id === detailsRecordId) || null;
  }, [records, detailsRecordId]);

  // ── Clipboard Copy (with 30s auto-clear) ──────────────────────────────
  const handleCopy = useCallback(async (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setTimeout(async () => {
        try {
          const current = await navigator.clipboard.readText();
          if (current === text) await navigator.clipboard.writeText('');
        } catch {}
      }, 30000);
    } catch {
      alert('Could not copy to clipboard. Ensure this tab has focus.');
    }
  }, []);

  // ── Password Generator ────────────────────────────────────────────────
  const generatePassword = useCallback(() => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
    const rand = new Uint8Array(24);
    window.crypto.getRandomValues(rand);
    const pass = Array.from(rand).map((b) => chars[b % chars.length]).join('');
    setEditForm((prev) => ({ ...prev, secret: pass }));
  }, []);

  // ── SubAccount helpers ────────────────────────────────────────────────
  const handleAddSubAccount = useCallback(() => {
    setEditForm((prev) => ({
      ...prev,
      subAccounts: [
        ...(prev.subAccounts || []),
        { id: crypto.randomUUID(), label: '', email: '', username: '', secret: '', notes: '' },
      ],
    }));
  }, []);

  const handleUpdateSubAccount = useCallback((index: number, updates: Partial<SubAccount>) => {
    setEditForm((prev) => {
      const list = [...(prev.subAccounts || [])];
      list[index] = { ...list[index], ...updates };
      return { ...prev, subAccounts: list };
    });
  }, []);

  const handleRemoveSubAccount = useCallback((index: number) => {
    setEditForm((prev) => {
      const list = (prev.subAccounts || []).filter((_, i) => i !== index);
      return { ...prev, subAccounts: list };
    });
  }, []);

  // ── Persistence to Google Drive ──────────────────────────────────────
  async function persistVault(updated: VaultRecord[]): Promise<VaultData> {
    const newVaultData: VaultData = {
      vaultVersion: vaultData.vaultVersion,
      updatedAt: new Date().toISOString(),
      records: updated,
    };
    const encrypted = await encryptString(JSON.stringify(newVaultData), cryptoKey);
    await updateFile(vaultId, JSON.stringify(encrypted), signal);
    return newVaultData;
  }

  // ── Save Record (Create or Update) ───────────────────────────────────
  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.title?.trim()) return;

    setSyncStatus('saving');

    try {
      let updated = [...records];
      let targetId: string;

      const cleanedSubAccounts = editForm.subAccounts
        ?.map((s) => ({
          ...s,
          label: s.label?.trim(),
          email: s.email?.trim(),
          username: s.username?.trim(),
          secret: s.secret,
          notes: s.notes?.trim(),
        }))
        .filter((s) => s.label || s.email || s.username || s.secret || s.notes);

      const recordToSave: Partial<VaultRecord> = {
        ...editForm,
        title: editForm.title.trim(),
        subAccounts: cleanedSubAccounts && cleanedSubAccounts.length > 0 ? cleanedSubAccounts : undefined,
      };

      if (recordToSave.id) {
        const idx = updated.findIndex((r) => r.id === recordToSave.id);
        updated[idx] = {
          ...updated[idx],
          ...recordToSave,
          updatedAt: new Date().toISOString(),
        } as VaultRecord;
        targetId = recordToSave.id;
      } else {
        const newRecord: VaultRecord = {
          ...recordToSave,
          id: crypto.randomUUID(),
          type: recordToSave.type || 'password',
          title: recordToSave.title || 'Untitled',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          favorite: !!recordToSave.favorite,
          tags: recordToSave.tags || [],
        } as VaultRecord;
        updated.unshift(newRecord);
        targetId = newRecord.id;
      }

      const newVaultData = await persistVault(updated);
      setVaultData(newVaultData);
      setFormDrawerOpen(false);
      setSyncStatus('synced');
      setSavedBadgeId(targetId);

      if (detailsRecordId === targetId) {
        setDetailsRecordId(targetId);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      if (err instanceof AuthError || err.name === 'AuthError') {
        setSyncStatus('auth_error');
      } else {
        setSyncStatus('error');
        alert('Failed to save record to Google Drive.');
      }
    }
  };

  // ── Toggle Favorite ──────────────────────────────────────────────────
  const handleToggleFavorite = async (recordId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = records.map((r) => (r.id === recordId ? { ...r, favorite: !r.favorite } : r));
      const newVaultData = await persistVault(updated);
      setVaultData(newVaultData);
    } catch {
      alert('Could not update favorite status.');
    }
  };

  // ── Delete Record ────────────────────────────────────────────────────
  const handleDeleteRecord = async (recordId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to delete this record? This cannot be undone.')) return;

    setSyncStatus('saving');
    try {
      const updated = records.filter((r) => r.id !== recordId);
      const newVaultData = await persistVault(updated);
      setVaultData(newVaultData);
      setSyncStatus('synced');
      setDetailsRecordId(null);
      setFormDrawerOpen(false);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setSyncStatus('error');
      alert('Failed to delete record.');
    }
  };

  // ── Reveal / Hide Secret Toggle ──────────────────────────────────────
  const toggleReveal = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRevealedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // ── Open Add with chosen type ─────────────────────────────────────────
  const startAddWith = (type: VaultRecord['type']) => {
    setTypeSelectorOpen(false);
    setEditForm({
      type,
      title: '',
      username: '',
      secret: '',
      notes: '',
      tags: [],
      favorite: false,
      subAccounts: [],
    });
    setShowFormPassword(false);
    setFormDrawerOpen(true);
  };

  // ── Open Edit for existing record ────────────────────────────────────
  const startEdit = (record: VaultRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditForm({ ...record, subAccounts: record.subAccounts ? [...record.subAccounts] : [] });
    setShowFormPassword(false);
    setFormDrawerOpen(true);
  };

  // ── Category Titles Helper ───────────────────────────────────────────
  const getCategoryTitle = () => {
    switch (currentView) {
      case 'all': return 'All Items';
      case 'password': return 'Passwords';
      case 'note': return 'Secure Notes';
      case 'identity': return 'Identities';
      case 'bank': return 'Bank Accounts';
      case 'license': return 'Software Licenses';
      case 'apikey': return 'API Keys';
      case 'favorites': return 'Favorites';
      default: return 'All Items';
    }
  };

  /* ═════════════════════════════════════════════════════════════════════
     RENDER
     ═════════════════════════════════════════════════════════════════════ */
  return (
    <div className="vault-app">

      {/* ── DESKTOP PERSISTENT SIDEBAR ─────────────────────────────────── */}
      <aside className="vault-sidebar" aria-label="Sidebar Navigation">
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo-badge">
            <Lock size={18} strokeWidth={2.4} />
          </div>
          <span className="sidebar-logo-text">Vault</span>
        </div>

        {/* Navigation items */}
        <nav className="sidebar-nav-list">
          <button
            className={`sidebar-nav-item ${currentView === 'overview' ? 'active' : ''}`}
            onClick={() => setCurrentView('overview')}
          >
            <Home size={16} />
            <span>Overview</span>
          </button>
          <button
            className={`sidebar-nav-item ${currentView === 'all' ? 'active' : ''}`}
            onClick={() => setCurrentView('all')}
          >
            <Layers size={16} />
            <span>All Items</span>
          </button>
          <button
            className={`sidebar-nav-item ${currentView === 'password' ? 'active' : ''}`}
            onClick={() => setCurrentView('password')}
          >
            <Key size={16} />
            <span>Passwords</span>
          </button>
          <button
            className={`sidebar-nav-item ${currentView === 'note' ? 'active' : ''}`}
            onClick={() => setCurrentView('note')}
          >
            <FileText size={16} />
            <span>Secure Notes</span>
          </button>
          <button
            className={`sidebar-nav-item ${currentView === 'identity' ? 'active' : ''}`}
            onClick={() => setCurrentView('identity')}
          >
            <User size={16} />
            <span>Identities</span>
          </button>
          <button
            className={`sidebar-nav-item ${currentView === 'bank' ? 'active' : ''}`}
            onClick={() => setCurrentView('bank')}
          >
            <Landmark size={16} />
            <span>Bank Accounts</span>
          </button>
          <button
            className={`sidebar-nav-item ${currentView === 'license' ? 'active' : ''}`}
            onClick={() => setCurrentView('license')}
          >
            <Shield size={16} />
            <span>Software Licenses</span>
          </button>
          <button
            className={`sidebar-nav-item ${currentView === 'apikey' ? 'active' : ''}`}
            onClick={() => setCurrentView('apikey')}
          >
            <TerminalSquare size={16} />
            <span>API Keys</span>
          </button>
          <button
            className={`sidebar-nav-item ${currentView === 'favorites' ? 'active' : ''}`}
            onClick={() => setCurrentView('favorites')}
          >
            <Star size={16} />
            <span>Favorites</span>
          </button>
          <button
            className={`sidebar-nav-item ${currentView === 'settings' ? 'active' : ''}`}
            onClick={() => setCurrentView('settings')}
          >
            <Settings size={16} />
            <span>Settings</span>
          </button>
        </nav>

        {/* Bottom Status & Lock */}
        <div className="sidebar-footer">
          <div className="sync-status-row">
            <span className={`sync-dot ${syncStatus}`} />
            <span>
              {syncStatus === 'synced' && 'Synced with Drive'}
              {syncStatus === 'saving' && 'Syncing changes…'}
              {syncStatus === 'error' && 'Sync error'}
              {syncStatus === 'auth_error' && 'Session expired'}
            </span>
          </div>

          <button
            id="btn-lock-vault-desktop"
            className="btn-lock-sidebar"
            onClick={onLock}
            title="Lock your vault"
          >
            <Lock size={14} />
            <span>Lock Vault</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ────────────────────────────────────────── */}
      <main className="vault-main-area">

        {/* Top Bar (Desktop & Tablet) */}
        <header className="vault-topbar desktop-only">
          <div className="topbar-content-grid">
            <div className="topbar-search-wrapper">
              <Search size={16} className="topbar-search-icon" />
              <input
                type="text"
                className="topbar-search-input"
                placeholder="Search by title, username, email, notes, or tag…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="topbar-search-kbd">Search</span>
            </div>

            <div className="topbar-right-controls">
              {syncStatus === 'auth_error' && (
                <button
                  className="btn-primary"
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                  onClick={() => requestDriveAccess()}
                >
                  <RefreshCw size={13} /> Re-authorize
                </button>
              )}

              {/* Theme toggle icon button */}
              <button
                type="button"
                className="btn-ghost"
                onClick={() => handleThemeChange(theme === 'dark' ? 'light' : 'dark')}
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
              </button>

              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as any)}
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  padding: '0.38rem 0.65rem',
                  width: 'auto',
                  cursor: 'pointer',
                  borderRadius: '6px',
                }}
                title="Sort items"
              >
                <option value="updated">Recently Updated</option>
                <option value="alphabetical">Alphabetical</option>
                <option value="favorites">Favorites First</option>
              </select>

              {/* Real Google Avatar (never letter 'S') */}
              <UserAvatar
                profile={userProfile}
                onClick={() => setCurrentView('settings')}
                size={34}
              />
            </div>
          </div>
        </header>

        {/* Mobile Top Bar */}
        <header className="vault-topbar mobile-only" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="sidebar-logo-badge" style={{ width: '30px', height: '30px' }}>
              <Lock size={15} strokeWidth={2.4} />
            </div>
            <span className="vault-wordmark" style={{ fontSize: '1.25rem' }}>Vault</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="sync-status-row" style={{ marginRight: '0.2rem' }}>
              <span className={`sync-dot ${syncStatus}`} />
            </div>

            {/* Quick theme switcher for mobile */}
            <button
              type="button"
              className="btn-ghost"
              onClick={() => handleThemeChange(theme === 'dark' ? 'light' : 'dark')}
              title="Toggle theme"
              style={{ padding: '0.35rem' }}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Real Google Avatar (never letter 'S') */}
            <UserAvatar
              profile={userProfile}
              onClick={() => setCurrentView('settings')}
              size={32}
            />
          </div>
        </header>

        {/* ── VIEW CONTAINER ─────────────────────────────────────────── */}
        <div className="vault-view-container">
          <div className="content-constrained-container">

          {/* ==========================================================
              VIEW 1: OVERVIEW (Home)
              ========================================================== */}
          {currentView === 'overview' && (
            <div>
              {/* Quick Search on Mobile Home */}
              <div className="mobile-only" style={{ marginBottom: '1.25rem' }}>
                <div
                  className="topbar-search-wrapper"
                  onClick={() => setCurrentView('search')}
                  style={{ cursor: 'pointer' }}
                >
                  <Search size={16} className="topbar-search-icon" />
                  <input
                    type="text"
                    className="topbar-search-input"
                    placeholder="Search your vault…"
                    readOnly
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Header Greeting & Desktop Add Action */}
              <div className="overview-header-row">
                <div>
                  <h1 className="overview-greeting">{greeting}</h1>
                  <p className="overview-subtitle">Your vault is secure and synced.</p>
                </div>
                <button
                  className="btn-primary desktop-only"
                  onClick={() => setTypeSelectorOpen(true)}
                >
                  <Plus size={16} /> Add Item
                </button>
              </div>

              {/* 4 Stat Cards */}
              <div className="stat-cards-grid">
                <div className="stat-card" onClick={() => setCurrentView('all')} style={{ cursor: 'pointer' }}>
                  <div>
                    <div className="stat-card-number">{stats.total}</div>
                    <div className="stat-card-label">Total Items</div>
                  </div>
                  <div className="stat-card-icon-box total">
                    <Layers size={18} />
                  </div>
                </div>

                <div className="stat-card" onClick={() => setCurrentView('password')} style={{ cursor: 'pointer' }}>
                  <div>
                    <div className="stat-card-number">{stats.passwords}</div>
                    <div className="stat-card-label">Passwords</div>
                  </div>
                  <div className="stat-card-icon-box passwords">
                    <Key size={18} />
                  </div>
                </div>

                <div className="stat-card" onClick={() => setCurrentView('note')} style={{ cursor: 'pointer' }}>
                  <div>
                    <div className="stat-card-number">{stats.notes}</div>
                    <div className="stat-card-label">Secure Notes</div>
                  </div>
                  <div className="stat-card-icon-box notes">
                    <FileText size={18} />
                  </div>
                </div>

                <div className="stat-card" onClick={() => setCurrentView('favorites')} style={{ cursor: 'pointer' }}>
                  <div>
                    <div className="stat-card-number">{stats.favorites}</div>
                    <div className="stat-card-label">Favorites</div>
                  </div>
                  <div className="stat-card-icon-box favorites">
                    <Star size={18} />
                  </div>
                </div>
              </div>

              {/* Recent Items Section */}
              <div className="section-header-row">
                <span className="section-title">Recent Items</span>
                <button
                  className="section-link"
                  onClick={() => setCurrentView('all')}
                >
                  View all <ChevronRight size={14} />
                </button>
              </div>

              {records.length === 0 ? (
                <div className="empty-state-box items-list-card">
                  <div className="empty-state-icon-wrap">
                    <Lock size={26} />
                  </div>
                  <div className="empty-state-title">Your vault is empty</div>
                  <p className="empty-state-text">
                    Add your first password, secure note, or bank account to protect your data.
                  </p>
                  <button className="btn-primary" onClick={() => setTypeSelectorOpen(true)}>
                    <Plus size={16} /> Add First Item
                  </button>
                </div>
              ) : (
                <div className="items-list-card">
                  {records.slice(0, 7).map((item) => (
                    <div
                      key={item.id}
                      className="item-row"
                      onClick={() => setDetailsRecordId(item.id)}
                    >
                      <ServiceIcon title={item.title} type={item.type} />
                      <div className="item-main-info">
                        <div className="item-title truncate">{item.title}</div>
                        <div className="item-subtitle truncate">{item.username || item.notes || item.type}</div>
                      </div>

                      <div className="item-meta-info">
                        <span className={`type-badge ${item.type}`}>
                          {item.type === 'apikey' ? 'API Key' : item.type === 'note' ? 'Secure Note' : item.type}
                        </span>

                        <span className="item-updated-time desktop-only">
                          {formatRelativeTime(item.updatedAt)}
                        </span>

                        <button
                          className={`star-btn ${item.favorite ? 'active' : ''}`}
                          onClick={(e) => handleToggleFavorite(item.id, e)}
                          title="Favorite"
                        >
                          <Star size={15} fill={item.favorite ? 'var(--color-warning)' : 'none'} />
                        </button>

                        <button
                          className="btn-ghost"
                          onClick={(e) => startEdit(item, e)}
                          title="Edit"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Mobile Add Item Button */}
              <button
                className="btn-primary mobile-only"
                style={{ width: '100%', marginTop: '1rem', padding: '0.75rem', fontWeight: 600 }}
                onClick={() => setTypeSelectorOpen(true)}
              >
                <Plus size={16} /> Add Item
              </button>
            </div>
          )}

          {/* ==========================================================
              VIEW 2: ALL ITEMS & CATEGORIES
              ========================================================== */}
          {currentView !== 'overview' && currentView !== 'search' && currentView !== 'settings' && (
            <div>
              {/* Header with Title, Count and Add Button */}
              <div className="view-top-header">
                <div className="view-title-wrap">
                  <h1>{getCategoryTitle()}</h1>
                  <div className="view-title-count">
                    {filteredRecords.length} {filteredRecords.length === 1 ? 'item' : 'items'}
                  </div>
                </div>

                <button className="btn-primary" onClick={() => setTypeSelectorOpen(true)}>
                  <Plus size={16} /> Add Item
                </button>
              </div>

              {/* Table List Container */}
              {filteredRecords.length === 0 ? (
                <div className="empty-state-box items-list-card">
                  <div className="empty-state-icon-wrap">
                    <Search size={26} />
                  </div>
                  <div className="empty-state-title">
                    {searchQuery ? 'No matching records' : 'Nothing here yet'}
                  </div>
                  <p className="empty-state-text">
                    {searchQuery
                      ? 'Try a different search query or clear your filter.'
                      : 'Your collection in this category is currently empty.'}
                  </p>
                  {searchQuery ? (
                    <button className="btn-secondary" onClick={() => setSearchQuery('')}>
                      Clear Search
                    </button>
                  ) : (
                    <button className="btn-primary" onClick={() => setTypeSelectorOpen(true)}>
                      <Plus size={16} /> Add Record
                    </button>
                  )}
                </div>
              ) : (
                <div className="items-list-card">
                  {/* Table Column Headers on Desktop */}
                  <div className="table-header-row desktop-only">
                    <span>Title</span>
                    <span>Username / Email</span>
                    <span>Type</span>
                    <span>Last Updated</span>
                    <span>Fav</span>
                    <span></span>
                  </div>

                  {/* List Rows */}
                  {filteredRecords.map((item) => (
                    <div
                      key={item.id}
                      className="table-data-row item-row"
                      onClick={() => setDetailsRecordId(item.id)}
                    >
                      {/* Title & Service Icon */}
                      <div className="item-main-info" style={{ minWidth: 0 }}>
                        <ServiceIcon title={item.title} type={item.type} />
                        <div>
                          <div className="item-title truncate">{item.title}</div>
                          <div className="item-subtitle mobile-only truncate">
                            {item.username || item.type}
                          </div>
                        </div>
                      </div>

                      {/* Username (Desktop) */}
                      <div className="table-cell-user desktop-only truncate">
                        {item.username || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </div>

                      {/* Type Badge */}
                      <div className="desktop-only">
                        <span className={`type-badge ${item.type}`}>
                          {item.type === 'apikey' ? 'API Key' : item.type === 'note' ? 'Secure Note' : item.type}
                        </span>
                      </div>

                      {/* Last Updated (Desktop) */}
                      <div className="table-cell-time desktop-only">
                        {formatRelativeTime(item.updatedAt)}
                      </div>

                      {/* Favorite Star */}
                      <div className="item-meta-info">
                        <span className={`type-badge ${item.type} mobile-only`}>
                          {item.type}
                        </span>
                        <button
                          className={`star-btn ${item.favorite ? 'active' : ''}`}
                          onClick={(e) => handleToggleFavorite(item.id, e)}
                          title="Favorite"
                        >
                          <Star size={15} fill={item.favorite ? 'var(--color-warning)' : 'none'} />
                        </button>
                        <button
                          className="btn-ghost"
                          onClick={(e) => startEdit(item, e)}
                          title="Actions"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==========================================================
              VIEW 3: DEDICATED SEARCH VIEW
              ========================================================== */}
          {currentView === 'search' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
                <button className="btn-ghost" onClick={() => setCurrentView('overview')}>
                  <ArrowLeft size={18} />
                </button>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Search Vault</h1>
              </div>

              <div className="input-with-icons" style={{ marginBottom: '1.25rem' }}>
                <span className="input-lead-icon"><Search size={16} /></span>
                <input
                  type="text"
                  placeholder="Search by title, username, notes, or tags…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                {searchQuery && (
                  <button className="input-trail-icon" onClick={() => setSearchQuery('')} aria-label="Clear search">
                    <X size={16} />
                  </button>
                )}
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                {filteredRecords.length} {filteredRecords.length === 1 ? 'record found' : 'records found'}
              </div>

              {filteredRecords.length === 0 ? (
                <div className="empty-state-box items-list-card">
                  <div className="empty-state-icon-wrap">
                    <Search size={24} />
                  </div>
                  <div className="empty-state-title">No records found</div>
                  <p className="empty-state-text">
                    {searchQuery
                      ? `No vault items matched "${searchQuery}". Check for typos or try searching a tag.`
                      : 'Type keywords above to search across titles, usernames, emails, and notes.'}
                  </p>
                </div>
              ) : (
                <div className="items-list-card">
                  {filteredRecords.map((item) => (
                    <div
                      key={item.id}
                      className="item-row"
                      onClick={() => setDetailsRecordId(item.id)}
                    >
                      <ServiceIcon title={item.title} type={item.type} />
                      <div className="item-main-info">
                        <div className="item-title truncate">{item.title}</div>
                        <div className="item-subtitle truncate">{item.username || item.type}</div>
                      </div>
                      <ChevronRight size={16} color="var(--text-muted)" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==========================================================
              VIEW 4: SETTINGS PAGE
              ========================================================== */}
          {currentView === 'settings' && (
            <div className="settings-container">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <button className="btn-ghost" onClick={() => setCurrentView('overview')}>
                  <ArrowLeft size={18} />
                </button>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Settings</h1>
              </div>

              {/* 1. Account Section */}
              <div className="settings-group">
                <div className="settings-group-header">Account</div>
                <div className="account-profile-card">
                  <div className="account-avatar-large">
                    {userProfile?.photoUrl ? (
                      <img
                        src={userProfile.photoUrl}
                        alt={userProfile.name || 'Account'}
                        referrerPolicy="no-referrer"
                        onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                      />
                    ) : (
                      <User size={24} color="var(--text-secondary)" />
                    )}
                  </div>
                  <div className="account-info-wrap">
                    <div className="account-name">{userProfile?.name || 'Google Account'}</div>
                    <div className="account-email">{userProfile?.email || 'Connected via Google Identity Services'}</div>
                  </div>
                </div>

                <div className="settings-row">
                  <div className="settings-row-left">
                    <div className="settings-icon-box">
                      <ShieldCheck size={16} color="var(--color-success)" />
                    </div>
                    <div>
                      <div className="settings-row-title">Drive Storage</div>
                      <div className="settings-row-subtitle">Scoped strictly to private appDataFolder</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-success)', background: 'var(--color-success-subtle)', padding: '0.2rem 0.55rem', borderRadius: '9999px' }}>
                    Connected
                  </span>
                </div>
              </div>

              {/* 2. Preferences Section */}
              <div className="settings-group">
                <div className="settings-group-header">Preferences</div>

                {/* Theme Selector */}
                <div className="settings-row">
                  <div className="settings-row-left">
                    <div className="settings-icon-box">
                      {theme === 'dark' ? <Moon size={16} /> : theme === 'light' ? <Sun size={16} /> : <Laptop size={16} />}
                    </div>
                    <div>
                      <div className="settings-row-title">Theme</div>
                      <div className="settings-row-subtitle">Choose interface appearance</div>
                    </div>
                  </div>

                  <div className="theme-selector-group">
                    <button
                      type="button"
                      className={`theme-pill-btn ${theme === 'dark' ? 'active' : ''}`}
                      onClick={() => handleThemeChange('dark')}
                    >
                      <Moon size={13} /> Dark
                    </button>
                    <button
                      type="button"
                      className={`theme-pill-btn ${theme === 'light' ? 'active' : ''}`}
                      onClick={() => handleThemeChange('light')}
                    >
                      <Sun size={13} /> Light
                    </button>
                    <button
                      type="button"
                      className={`theme-pill-btn ${theme === 'system' ? 'active' : ''}`}
                      onClick={() => handleThemeChange('system')}
                    >
                      <Laptop size={13} /> System
                    </button>
                  </div>
                </div>

                {/* Sort Order */}
                <div className="settings-row">
                  <div className="settings-row-left">
                    <div className="settings-icon-box">
                      <Layers size={16} />
                    </div>
                    <div>
                      <div className="settings-row-title">Default Sort</div>
                      <div className="settings-row-subtitle">Order records on dashboard</div>
                    </div>
                  </div>

                  <select
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value as any)}
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                      padding: '0.4rem 0.65rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="updated">Recently Updated</option>
                    <option value="alphabetical">Alphabetical</option>
                    <option value="favorites">Favorites First</option>
                  </select>
                </div>

                {/* Auto-Lock */}
                <div className="settings-row">
                  <div className="settings-row-left">
                    <div className="settings-icon-box">
                      <Lock size={16} />
                    </div>
                    <div>
                      <div className="settings-row-title">Auto-lock Timer</div>
                      <div className="settings-row-subtitle">Locks after 5 minutes of inactivity</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>5 min</span>
                </div>
              </div>

              {/* 3. Security Section */}
              <div className="settings-group">
                <div className="settings-group-header">Security</div>

                <div className="settings-row clickable" onClick={onLock}>
                  <div className="settings-row-left">
                    <div className="settings-icon-box">
                      <Lock size={16} color="var(--accent)" />
                    </div>
                    <div>
                      <div className="settings-row-title">Lock Vault Immediately</div>
                      <div className="settings-row-subtitle">Clears decrypted data and cryptographic keys</div>
                    </div>
                  </div>
                  <ChevronRight size={16} color="var(--text-muted)" />
                </div>

                <div className="settings-row">
                  <div className="settings-row-left">
                    <div className="settings-icon-box">
                      <ShieldCheck size={16} color="var(--color-success)" />
                    </div>
                    <div>
                      <div className="settings-row-title">Zero-Knowledge Architecture</div>
                      <div className="settings-row-subtitle">PBKDF2 (600k iter) + AES-256-GCM encryption</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--color-success)', fontWeight: 600 }}>Active</span>
                </div>
              </div>

              {/* 4. About Section */}
              <div className="settings-group">
                <div className="settings-group-header">About</div>

                <div className="settings-row">
                  <div className="settings-row-left">
                    <div className="settings-icon-box">
                      <Shield size={16} />
                    </div>
                    <div>
                      <div className="settings-row-title">Application</div>
                      <div className="settings-row-subtitle">Vault — Progressive Web App</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>v1.0.0</span>
                </div>

                <div className="settings-row clickable" onClick={onSignOut || onLock}>
                  <div className="settings-row-left">
                    <div className="settings-icon-box" style={{ color: 'var(--color-danger)' }}>
                      <LogOut size={16} />
                    </div>
                    <div>
                      <div className="settings-row-title" style={{ color: 'var(--color-danger)' }}>Sign Out</div>
                      <div className="settings-row-subtitle">Disconnects session and locks vault</div>
                    </div>
                  </div>
                  <ChevronRight size={16} color="var(--text-muted)" />
                </div>
              </div>
            </div>
          )}

          </div>
        </div>

        {/* ── MOBILE BOTTOM NAVIGATION BAR ───────────────────────────── */}
        <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
          <button
            className={`mobile-nav-btn ${currentView === 'overview' ? 'active' : ''}`}
            onClick={() => setCurrentView('overview')}
          >
            <Home size={19} />
            <span>Home</span>
          </button>

          <button
            className={`mobile-nav-btn ${currentView === 'search' ? 'active' : ''}`}
            onClick={() => setCurrentView('search')}
          >
            <Search size={19} />
            <span>Search</span>
          </button>

          <button
            className="mobile-nav-center-add"
            onClick={() => setTypeSelectorOpen(true)}
            title="Add Item"
            aria-label="Add Item"
          >
            <Plus size={24} strokeWidth={2.6} />
          </button>

          <button
            className={`mobile-nav-btn ${currentView === 'favorites' ? 'active' : ''}`}
            onClick={() => setCurrentView('favorites')}
          >
            <Star size={19} />
            <span>Favorites</span>
          </button>

          <button
            className={`mobile-nav-btn ${currentView === 'settings' ? 'active' : ''}`}
            onClick={() => setCurrentView('settings')}
          >
            <Settings size={19} />
            <span>Settings</span>
          </button>
        </nav>

      </main>

      {/* ==============================================================
          MODAL 1: TYPE SELECTOR (2-Column Grid)
          ============================================================== */}
      {typeSelectorOpen && (
        <div
          className="modal-overlay-centered"
          onClick={() => setTypeSelectorOpen(false)}
        >
          <div
            className="type-selector-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Add New Item"
          >
            <div className="modal-header-row">
              <div>
                <h2 className="modal-header-title">Add New Item</h2>
                <p className="modal-header-subtitle">What do you want to save?</p>
              </div>
              <button
                className="btn-ghost"
                onClick={() => setTypeSelectorOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* 2-column grid with 6 cards */}
            <div className="type-grid-2col">
              {/* 1. Password */}
              <div className="type-option-box" onClick={() => startAddWith('password')}>
                <div className="type-option-icon" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                  <Key size={20} />
                </div>
                <div className="type-option-title">Password</div>
                <div className="type-option-desc">Website, app or service credentials</div>
              </div>

              {/* 2. Secure Note */}
              <div className="type-option-box" onClick={() => startAddWith('note')}>
                <div className="type-option-icon" style={{ background: 'var(--color-success-subtle)', color: 'var(--color-success)' }}>
                  <FileText size={20} />
                </div>
                <div className="type-option-title">Secure Note</div>
                <div className="type-option-desc">Private notes and sensitive information</div>
              </div>

              {/* 3. Identity */}
              <div className="type-option-box" onClick={() => startAddWith('identity')}>
                <div className="type-option-icon" style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#A855F7' }}>
                  <User size={20} />
                </div>
                <div className="type-option-title">Identity</div>
                <div className="type-option-desc">Personal identifiers and profiles</div>
              </div>

              {/* 4. Bank Account */}
              <div className="type-option-box" onClick={() => startAddWith('bank')}>
                <div className="type-option-icon" style={{ background: 'rgba(14, 165, 233, 0.12)', color: '#0EA5E9' }}>
                  <Landmark size={20} />
                </div>
                <div className="type-option-title">Bank Account</div>
                <div className="type-option-desc">Financial account details</div>
              </div>

              {/* 5. Software License */}
              <div className="type-option-box" onClick={() => startAddWith('license')}>
                <div className="type-option-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#6366F1' }}>
                  <Shield size={20} />
                </div>
                <div className="type-option-title">Software License</div>
                <div className="type-option-desc">Product keys and activation details</div>
              </div>

              {/* 6. API Key */}
              <div className="type-option-box" onClick={() => startAddWith('apikey')}>
                <div className="type-option-icon" style={{ background: 'rgba(244, 63, 94, 0.12)', color: '#F43F5E' }}>
                  <TerminalSquare size={20} />
                </div>
                <div className="type-option-title">API Key</div>
                <div className="type-option-desc">Developer tokens and API credentials</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL 2: ADD / EDIT RECORD FORM
          ============================================================== */}
      {formDrawerOpen && (
        <div className="drawer-overlay" onClick={() => setFormDrawerOpen(false)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()} role="dialog">
            {/* Header */}
            <div className="drawer-header">
              <div className="drawer-title-row">
                <Lock size={18} color="var(--accent)" />
                <h2>{editForm.id ? 'Edit Record' : `New ${editForm.type === 'note' ? 'Secure Note' : editForm.type === 'apikey' ? 'API Key' : editForm.type || 'Password'}`}</h2>
              </div>
              <button className="btn-ghost" onClick={() => setFormDrawerOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveRecord} style={{ display: 'contents' }}>
              <div className="drawer-body">
                {/* Title */}
                <div className="form-group">
                  <label className="form-label">Service / Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GitHub, Amazon, Google…"
                    value={editForm.title || ''}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    autoFocus
                  />
                </div>

                {/* Username / Email */}
                {editForm.type !== 'note' && (
                  <div className="form-group">
                    <label className="form-label">Username / Email</label>
                    <input
                      type="text"
                      placeholder="e.g. user@example.com"
                      value={editForm.username || ''}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    />
                  </div>
                )}

                {/* Password / Secret */}
                {editForm.type !== 'note' && (
                  <div className="form-group">
                    <label className="form-label">
                      {editForm.type === 'apikey' ? 'API Key' : 'Password / Secret'}
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <div className="input-with-icons" style={{ flex: 1 }}>
                        <input
                          type={showFormPassword ? 'text' : 'password'}
                          placeholder="Enter password"
                          value={editForm.secret || ''}
                          onChange={(e) => setEditForm({ ...editForm, secret: e.target.value })}
                          className="mono"
                        />
                        <button
                          type="button"
                          className="input-trail-icon"
                          onClick={() => setShowFormPassword(!showFormPassword)}
                          title={showFormPassword ? 'Hide' : 'Reveal'}
                        >
                          {showFormPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>

                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={generatePassword}
                        style={{ whiteSpace: 'nowrap', padding: '0 0.85rem' }}
                        title="Generate Password"
                      >
                        <Zap size={14} /> Generate
                      </button>
                    </div>
                  </div>
                )}

                {/* Additional Accounts Section */}
                {editForm.type !== 'note' && (
                  <div className="form-group">
                    <label className="form-label">Additional Accounts (Optional)</label>

                    {editForm.subAccounts && editForm.subAccounts.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        {editForm.subAccounts.map((sub, sIdx) => (
                          <div key={sub.id || sIdx} className="subaccounts-box">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)' }}>
                                Account #{sIdx + 2}
                              </span>
                              <button
                                type="button"
                                className="btn-danger-ghost"
                                onClick={() => handleRemoveSubAccount(sIdx)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>

                            <input
                              type="text"
                              placeholder="Account Label (e.g. Work, Alt)"
                              value={sub.label || ''}
                              onChange={(e) => handleUpdateSubAccount(sIdx, { label: e.target.value })}
                            />

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <input
                                type="email"
                                placeholder="Email"
                                value={sub.email || ''}
                                onChange={(e) => handleUpdateSubAccount(sIdx, { email: e.target.value })}
                              />
                              <input
                                type="text"
                                placeholder="Username"
                                value={sub.username || ''}
                                onChange={(e) => handleUpdateSubAccount(sIdx, { username: e.target.value })}
                              />
                            </div>

                            <input
                              type="password"
                              placeholder="Password / Secret"
                              value={sub.secret || ''}
                              onChange={(e) => handleUpdateSubAccount(sIdx, { secret: e.target.value })}
                              className="mono"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      className="btn-add-subaccount-card"
                      onClick={handleAddSubAccount}
                    >
                      + Add Another Account
                    </button>
                  </div>
                )}

                {/* Tags */}
                <div className="form-group">
                  <label className="form-label">Tags (Optional)</label>
                  <input
                    type="text"
                    placeholder="Add tags separated by commas (e.g. Work, Personal)"
                    value={editForm.tags?.join(', ') || ''}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                      })
                    }
                  />
                </div>

                {/* Notes */}
                <div className="form-group">
                  <label className="form-label">Notes (Optional)</label>
                  <textarea
                    placeholder="Add any additional notes…"
                    value={editForm.notes || ''}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  />
                </div>

                {/* Favorite Checkbox */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={!!editForm.favorite}
                    onChange={(e) => setEditForm({ ...editForm, favorite: e.target.checked })}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  Mark as Favorite
                </label>
              </div>

              {/* Footer */}
              <div className="drawer-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setFormDrawerOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={syncStatus === 'saving' || isOffline}
                >
                  {syncStatus === 'saving' ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL 3: RECORD DETAILS VIEW
          ============================================================== */}
      {selectedRecord && (
        <div className="drawer-overlay" onClick={() => setDetailsRecordId(null)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()} role="dialog">
            {/* Header */}
            <div className="drawer-header">
              <button
                className="btn-ghost"
                onClick={() => setDetailsRecordId(null)}
                style={{ fontSize: '0.82rem', gap: '0.4rem', color: 'var(--accent)' }}
              >
                <ArrowLeft size={16} /> Back
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  className={`star-btn ${selectedRecord.favorite ? 'active' : ''}`}
                  onClick={(e) => handleToggleFavorite(selectedRecord.id, e)}
                >
                  <Star size={18} fill={selectedRecord.favorite ? 'var(--color-warning)' : 'none'} />
                </button>
                <button className="btn-ghost" onClick={() => setDetailsRecordId(null)}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="drawer-body">
              {/* Record Title Header Card */}
              <div className="details-header-card">
                <ServiceIcon title={selectedRecord.title} type={selectedRecord.type} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }} className="truncate">
                    {selectedRecord.title}
                  </h2>
                  <div style={{ marginTop: '0.35rem' }}>
                    <span className={`type-badge ${selectedRecord.type}`}>
                      {selectedRecord.type}
                    </span>
                  </div>
                </div>
              </div>

              {/* Username / Email */}
              {selectedRecord.username && (
                <div className="details-field-card">
                  <div className="details-field-label">Username / Email</div>
                  <div className="details-field-row">
                    <span className="details-field-value truncate">{selectedRecord.username}</span>
                    <button
                      className="btn-ghost"
                      onClick={() => handleCopy(selectedRecord.username!)}
                      title="Copy"
                    >
                      <Copy size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* Password */}
              {selectedRecord.secret && (
                <div className="details-field-card">
                  <div className="details-field-label">Password</div>
                  <div className="details-field-row">
                    <span className="details-field-value mono truncate">
                      {revealedIds.has(selectedRecord.id) ? selectedRecord.secret : '••••••••••••••••'}
                    </span>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button
                        className="btn-ghost"
                        onClick={() => toggleReveal(selectedRecord.id)}
                        title={revealedIds.has(selectedRecord.id) ? 'Hide' : 'Reveal'}
                      >
                        {revealedIds.has(selectedRecord.id) ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button
                        className="btn-ghost"
                        onClick={() => handleCopy(selectedRecord.secret!)}
                        title="Copy"
                      >
                        <Copy size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Accounts */}
              {selectedRecord.subAccounts && selectedRecord.subAccounts.length > 0 && (
                <div>
                  <div className="form-label" style={{ marginBottom: '0.5rem' }}>
                    Additional Accounts ({selectedRecord.subAccounts.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {selectedRecord.subAccounts.map((sub, sIdx) => {
                      const subSecretId = `${selectedRecord.id}_sub_${sub.id}`;
                      const isRevealed = revealedIds.has(subSecretId);

                      return (
                        <div key={sub.id || sIdx} className="details-field-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent)' }}>
                            <span>{sub.label || `Account #${sIdx + 2}`}</span>
                            {sub.email && <span style={{ color: 'var(--text-muted)' }}>{sub.email}</span>}
                          </div>

                          {sub.username && (
                            <div className="details-field-row" style={{ marginTop: '0.2rem' }}>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>User: {sub.username}</span>
                              <button className="btn-ghost" onClick={() => handleCopy(sub.username!)}>
                                <Copy size={13} />
                              </button>
                            </div>
                          )}

                          {sub.secret && (
                            <div className="details-field-row" style={{ marginTop: '0.2rem' }}>
                              <span className="mono truncate" style={{ fontSize: '0.8rem' }}>
                                {isRevealed ? sub.secret : '••••••••••••'}
                              </span>
                              <div style={{ display: 'flex', gap: '0.2rem' }}>
                                <button className="btn-ghost" onClick={() => toggleReveal(subSecretId)}>
                                  {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                                </button>
                                <button className="btn-ghost" onClick={() => handleCopy(sub.secret!)}>
                                  <Copy size={13} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedRecord.tags && selectedRecord.tags.length > 0 && (
                <div>
                  <div className="form-label" style={{ marginBottom: '0.4rem' }}>Tags</div>
                  <div className="tag-pills-row">
                    {selectedRecord.tags.map((tag, tIdx) => (
                      <span key={tIdx} className="tag-pill">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedRecord.notes && (
                <div className="details-field-card">
                  <div className="details-field-label">Notes</div>
                  <p style={{ fontSize: '0.85rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                    {selectedRecord.notes}
                  </p>
                </div>
              )}

              {/* Timestamps */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <div>Created: {new Date(selectedRecord.createdAt).toLocaleDateString()}</div>
                <div>Last updated: {new Date(selectedRecord.updatedAt).toLocaleDateString()}</div>
              </div>
            </div>

            {/* Actions Footer: Delete & Edit */}
            <div className="drawer-footer" style={{ justifyContent: 'space-between' }}>
              <button
                className="btn-danger-ghost"
                onClick={(e) => handleDeleteRecord(selectedRecord.id, e)}
                title="Delete"
              >
                <Trash2 size={16} /> Delete
              </button>

              <button
                className="btn-primary"
                onClick={() => {
                  const r = selectedRecord;
                  setDetailsRecordId(null);
                  startEdit(r);
                }}
              >
                Edit Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
