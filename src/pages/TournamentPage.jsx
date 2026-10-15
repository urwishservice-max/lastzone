import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function TournamentPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  // Active Tab: 'TOURNAMENT' | 'PROFILE' | 'ADMIN'
  const initialTab = searchParams.get('tab') === 'admin' ? 'ADMIN' : (searchParams.get('tab') === 'profile' ? 'PROFILE' : 'TOURNAMENT');
  const [activeTab, setActiveTab] = useState(initialTab);

  // Tournament Center State
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [highlightCategory, setHighlightCategory] = useState('ALL');

  // Applicants State
  const [applicants, setApplicants] = useState([]);
  const [isLoadingApplicants, setIsLoadingApplicants] = useState(false);
  const [hasFetchedApplicants, setHasFetchedApplicants] = useState(false);

  // Compound Filters: Search text, Type (SOLO/DUO/SQUAD), Status (OPEN/IN_PROGRESS/COMPLETED), Amount range
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterAmount, setFilterAmount] = useState('ALL');

  // Storage states: Both start null/empty so details ONLY display when user clicks the buttons.
  const [sessionAppData, setSessionAppData] = useState(null);
  const [hasFetchedSession, setHasFetchedSession] = useState(false);
  const [localAppData, setLocalAppData] = useState([]);
  const [hasFetchedLocal, setHasFetchedLocal] = useState(false);

  // Notification Toast
  const [toast, setToast] = useState(null);
  const notify = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // On page load / refresh:
  // 1. Clear sessionStorage item so nothing can be retrieved after refresh (truly empty volatile session).
  // 2. Hide all details until user clicks the fetch buttons.
  useEffect(() => {
    try {
      sessionStorage.removeItem('applied_tournament_session');
      sessionStorage.removeItem('active_tournament');
    } catch {}
    setSessionAppData(null);
    setHasFetchedSession(false);
    setLocalAppData([]);
    setHasFetchedLocal(false);
  }, []);

  // Profile View State (Player combat history, rank, weapon loadout)
  const profileUserId = searchParams.get('userId') || (user ? user.id : 1);
  const [profileData, setProfileData] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Admin Dashboard State
  const [adminUsers, setAdminUsers] = useState([]);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // { id, displayName, email, role }
  const [newOperative, setNewOperative] = useState({ username: '', email: '', displayName: '', role: 'ROLE_USER' });
  const [newTournament, setNewTournament] = useState({
    match_code: '',
    title: '',
    category: 'TACTICAL',
    match_type: 'SOLO',
    status: 'OPEN',
    prize_amount: 50000,
    max_players: 32,
    scheduled_time: '2026-10-25 18:00 UTC'
  });

  // Admin Web Scraper (Assignment VIII Specification) State
  const [adminScraperUrl, setAdminScraperUrl] = useState('');
  const [adminScrapeResult, setAdminScrapeResult] = useState(null);
  const [isScrapingAdmin, setIsScrapingAdmin] = useState(false);
  const [adminScrapeError, setAdminScrapeError] = useState(null);

  // Load Tournament Records (AJAX load with Retry path)
  const loadTournaments = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      let res = await fetch('/api/tournaments');
      if (!res.ok) {
        res = await fetch('/data/tournaments.json');
      }
      if (!res.ok) throw new Error('Failed to load tournament records');
      const data = await res.json();
      setMatches(data);
      if (data.length > 0 && !selectedMatch) {
        setSelectedMatch(data[0]);
      }
      notify(`Loaded ${data.length} tournament records successfully via AJAX.`, 'success');
    } catch (err) {
      console.error(err);
      setHasError(true);
      notify('Could not retrieve tournament data. Retry path activated.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedMatch]);

  // Load Player Profile Telemetry
  const loadProfile = useCallback(async (uid) => {
    setIsLoadingProfile(true);
    try {
      const res = await fetch(`/api/players/profile?id=${uid}`);
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  // Load Admin Data
  const loadAdminUsers = useCallback(async () => {
    setIsLoadingAdmin(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setAdminUsers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAdmin(false);
    }
  }, []);

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  useEffect(() => {
    if (activeTab === 'PROFILE') {
      loadProfile(profileUserId);
    } else if (activeTab === 'ADMIN') {
      loadAdminUsers();
    }
  }, [activeTab, profileUserId, loadProfile, loadAdminUsers]);

  // Fetch Applicants for selected tournament match
  const handleFetchApplicants = async (matchId) => {
    setIsLoadingApplicants(true);
    try {
      const targetId = matchId || (selectedMatch ? selectedMatch.id : 0);
      const res = await fetch(`/api/tournaments/applicants?matchId=${targetId}`);
      if (res.ok) {
        const list = await res.json();
        setApplicants(list);
        setHasFetchedApplicants(true);
        notify(`Fetched ${list.length} registered tournament applicants from database!`, 'success');
      }
    } catch {
      notify('Failed to fetch applicants.', 'error');
    } finally {
      setIsLoadingApplicants(false);
    }
  };

  // Apply for Tournament (Saves in Session Storage, Local Storage, and MySQL database)
  const handleApplyTournament = async (match) => {
    const targetMatch = match || selectedMatch;
    if (!targetMatch) return;

    const scheduledTime = targetMatch.scheduled_time || '2026-10-18 18:00 UTC';
    const appRecord = {
      matchId: targetMatch.id,
      matchCode: targetMatch.match_code,
      title: targetMatch.title,
      category: targetMatch.category,
      scheduledTime: scheduledTime,
      prizeAmount: targetMatch.prize_amount,
      applicantUser: user ? user.username : 'cadet_operative',
      appliedAt: new Date().toLocaleString()
    };

    // Check if player has already applied for this tournament in local storage
    try {
      const existing = JSON.parse(localStorage.getItem('tournament_applications_history') || '[]');
      const alreadyApplied = existing.some(item => item.matchId === targetMatch.id);
      if (alreadyApplied) {
        notify(`You have already applied for ${targetMatch.match_code}! Only one application per tournament is allowed.`, 'error');
        return;
      }
      // Store exactly 1 application record
      localStorage.setItem('tournament_applications_history', JSON.stringify([appRecord, ...existing]));
    } catch {}

    // 1. Store exactly ONE record in Session Storage (active session)
    sessionStorage.setItem('applied_tournament_session', JSON.stringify(appRecord));

    // 3. Persist to MySQL Backend
    try {
      const token = localStorage.getItem('lastzone_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const res = await fetch('/api/tournaments/apply', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          matchId: targetMatch.id,
          matchCode: targetMatch.match_code,
          scheduledTime: scheduledTime
        })
      });
      const data = await res.json();
      if (res.ok) {
        notify(`Application accepted! Stored in Session Storage, Local Storage & MySQL Database.`, 'success');
        loadTournaments();
        handleFetchApplicants(targetMatch.id);
      } else {
        notify(data.message || 'Application confirmed locally.', 'info');
      }
    } catch {
      notify('Saved to Session Storage & Local Storage.', 'info');
    }
  };

  // Handle Joining a match and starting the game
  const handleStartGame = async (match) => {
    notify(`Authenticating match clearance for [${match.match_code}]...`, 'info');
    try {
      const token = localStorage.getItem('lastzone_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      await fetch('/api/tournaments/join', {
        method: 'POST',
        headers,
        body: JSON.stringify({ matchId: match.id })
      });
    } catch {}

    sessionStorage.setItem('active_tournament', JSON.stringify(match));
    notify(`Clearance authorized! Launching Combat Sector for ${match.title}...`, 'success');
    setTimeout(() => {
      navigate('/play');
    }, 800);
  };

  // Add Fictional Tournament Item
  const handleAddFictionalItem = () => {
    const id = Date.now();
    const newCode = `TM-${Math.floor(200 + Math.random() * 800)}`;
    const newItem = {
      id,
      match_code: newCode,
      title: `DYNAMIC SECTOR CLASH #${matches.length + 1}`,
      category: highlightCategory !== 'ALL' ? highlightCategory : 'TACTICAL',
      match_type: 'SOLO',
      status: 'OPEN',
      prize_amount: Math.floor(30000 + Math.random() * 70000),
      max_players: 32,
      registered_count: 1,
      scheduled_time: '2026-10-26 19:00 UTC',
      created_at: new Date().toISOString()
    };
    setMatches([newItem, ...matches]);
    setSelectedMatch(newItem);
    notify(`Dynamic tournament record [${newCode}] injected into match center!`, 'info');
  };

  // Remove Fictional Item
  const handleRemoveItem = (id, e) => {
    e.stopPropagation();
    setMatches(matches.filter((m) => m.id !== id));
    if (selectedMatch && selectedMatch.id === id) {
      setSelectedMatch(matches.find((m) => m.id !== id) || null);
    }
    notify(`Tournament record #${id} removed from active match registry.`, 'info');
  };

  // Admin User Handlers
  const handleAdminCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOperative)
      });
      const data = await res.json();
      if (res.ok) {
        notify(data.message, 'success');
        setNewOperative({ username: '', email: '', displayName: '', role: 'ROLE_USER' });
        loadAdminUsers();
      } else {
        notify(data.message, 'error');
      }
    } catch {
      notify('Failed to commission operative.', 'error');
    }
  };

  const handleAdminUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const res = await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser)
      });
      const data = await res.json();
      if (res.ok) {
        notify(data.message, 'success');
        setEditingUser(null);
        loadAdminUsers();
      } else {
        notify(data.message, 'error');
      }
    } catch {
      notify('Failed to update operative.', 'error');
    }
  };

  const handleAdminDeleteUser = async (id, username) => {
    if (!window.confirm(`Decommission operative @${username} permanently from database?`)) return;
    try {
      const res = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (res.ok) {
        notify(data.message, 'info');
        loadAdminUsers();
      } else {
        notify(data.message, 'error');
      }
    } catch {
      notify('Error deleting operative.', 'error');
    }
  };

  // Admin Tournament Create
  const handleAdminCreateTournament = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/tournaments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTournament)
      });
      const data = await res.json();
      if (res.ok) {
        notify(data.message, 'success');
        setNewTournament({
          match_code: '',
          title: '',
          category: 'TACTICAL',
          match_type: 'SOLO',
          status: 'OPEN',
          prize_amount: 50000,
          max_players: 32,
          scheduled_time: '2026-10-25 18:00 UTC'
        });
        loadTournaments();
      }
    } catch {
      notify('Error commissioning tournament.', 'error');
    }
  };

  // Admin Tournament Delete
  const handleAdminDeleteTournament = async (id, code) => {
    if (!window.confirm(`Delete tournament ${code} from database?`)) return;
    try {
      const res = await fetch('/api/admin/tournaments/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (res.ok) {
        notify(data.message, 'info');
        loadTournaments();
      }
    } catch {
      notify('Error deleting tournament.', 'error');
    }
  };

  // Admin Web Scraper Execution (Assignment VIII)
  const handleAdminScrapeUrl = async (e) => {
    if (e) e.preventDefault();
    if (!adminScraperUrl.trim()) return;

    setIsScrapingAdmin(true);
    setAdminScrapeError(null);
    setAdminScrapeResult(null);

    try {
      const res = await fetch('/api/analyzer/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: adminScraperUrl.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminScrapeResult(data);
        notify(`Web extraction completed for ${adminScraperUrl}!`, 'success');
      } else {
        setAdminScrapeError(data.message || 'Scrape operation failed.');
        notify(data.message || 'Scrape failed.', 'error');
      }
    } catch (err) {
      setAdminScrapeError('Network error or server timeout while contacting web analyzer endpoint.');
      notify('Network error contacting web scraper.', 'error');
    } finally {
      setIsScrapingAdmin(false);
    }
  };


  // Compound Filtering logic
  const filteredMatches = matches.filter((m) => {
    if (highlightCategory !== 'ALL' && m.category !== highlightCategory) return false;
    if (filterType !== 'ALL' && m.match_type !== filterType) return false;
    if (filterStatus !== 'ALL' && m.status !== filterStatus) return false;
    if (filterAmount === 'LOW' && m.prize_amount >= 50000) return false;
    if (filterAmount === 'MID' && (m.prize_amount < 50000 || m.prize_amount > 100000)) return false;
    if (filterAmount === 'HIGH' && m.prize_amount <= 100000) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${m.match_code} ${m.title} ${m.category} ${m.match_type}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="clean-minimal-page tournament-page-wrap">
      {/* Precision Editorial Header */}
      <header className="ref-top-header lz-top-header">
        <div className="ref-top-left">
          <div className="lz-brand-block" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <span className="lz-brand-logo">LASTZONE</span>
            <span className="lz-brand-command">HIGH COMMAND</span>
          </div>
          <div className="ref-time-stamp">
            <span className="ref-time-main">02:11<span className="ref-time-sub">AM</span></span>
            <div className="ref-date-stack">
              <span className="ref-date-month">OCT 2026</span>
              <span className="ref-date-day">THU 15</span>
            </div>
            <span className="ref-weather">15° CLOUDY</span>
          </div>
        </div>

        <div className="ref-top-right lz-nav-tabs">
          <button
            className={`lz-nav-tab-btn ${activeTab === 'TOURNAMENT' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('TOURNAMENT');
              setSearchParams({});
            }}
          >
            Tournament Center
          </button>
          <button
            className={`lz-nav-tab-btn ${activeTab === 'PROFILE' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('PROFILE');
              setSearchParams({ tab: 'profile', userId: profileUserId });
            }}
          >
            Operative Profile
          </button>
          <button
            className={`lz-nav-tab-btn ${activeTab === 'ADMIN' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('ADMIN');
              setSearchParams({ tab: 'admin' });
            }}
          >
            Admin Dashboard
          </button>
          <button className="lz-nav-tab-btn" onClick={() => navigate('/weapons')}>
            Weapons Requisition
          </button>
          <button className="lz-nav-tab-btn" onClick={() => navigate('/leaderboard')}>
            Leaderboard
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="tourney-main-layout">
        {toast && (
          <div className={`network-banner-toast ${toast.type}`}>
            <span className="toast-dot" />
            <span>{toast.msg}</span>
          </div>
        )}

        {/* TAB 1: TOURNAMENT MATCH CENTER */}
        {activeTab === 'TOURNAMENT' && (
          <div className="lz-tourney-dashboard">
            {/* Page Heading Section with Red Diagonal Accent */}
            <div className="lz-page-heading-block">
              <div className="lz-heading-meta">
                <span className="lz-hud-slant" />
                <span className="lz-heading-tag">TACTICAL OPERATIONS // TOURNAMENT COMMAND</span>
              </div>
              <div className="lz-heading-row">
                <div className="lz-heading-left">
                  <h1 className="lz-page-title">MATCH REGISTRY</h1>
                  <p className="lz-page-subtitle">
                    COMPOUND FILTERING &bull; SESSION & LOCAL STORAGE &bull; ADMIN DASHBOARD & CRUD
                  </p>
                </div>
                <div className="lz-heading-actions">
                  <button
                    className="lz-action-btn lz-reload-btn"
                    onClick={loadTournaments}
                    disabled={isLoading}
                    title="Reload tournament records via AJAX"
                  >
                    ↻ AJAX RELOAD
                  </button>
                  <span className="lz-registry-counter">
                    DISPLAYING <strong>{filteredMatches.length}</strong> / {matches.length} MATCHES
                  </span>
                </div>
              </div>
              <div className="lz-heading-divider" />
            </div>

            {/* Horizontal Search & Filter Toolbar */}
            <div className="lz-filter-toolbar">
              <div className="lz-search-wrapper">
                <span className="lz-search-icon">🔍</span>
                <input
                  type="text"
                  className="lz-search-input"
                  placeholder="SEARCH MATCH CODE OR TITLE..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="lz-search-clear" onClick={() => setSearchQuery('')}>✕</button>
                )}
              </div>

              <div className="lz-category-group">
                <span className="lz-filter-label">CATEGORY:</span>
                <div className="lz-chip-row">
                  {['ALL', 'ELITE', 'TACTICAL', 'MASTERS', 'CHAMPIONSHIP'].map((cat) => (
                    <button
                      key={cat}
                      className={`lz-cat-chip ${highlightCategory === cat ? 'active' : ''}`}
                      onClick={() => setHighlightCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="lz-dropdowns-group">
                <div className="lz-select-wrap">
                  <label>TYPE</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="lz-select"
                  >
                    <option value="ALL">All Types</option>
                    <option value="SOLO">Solo Operations</option>
                    <option value="DUO">Duo Recon</option>
                    <option value="SQUAD">Squad Battle</option>
                  </select>
                </div>

                <div className="lz-select-wrap">
                  <label>STATUS</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="lz-select"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="OPEN">Open Entry</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>

                <div className="lz-select-wrap">
                  <label>BOUNTY</label>
                  <select
                    value={filterAmount}
                    onChange={(e) => setFilterAmount(e.target.value)}
                    className="lz-select"
                  >
                    <option value="ALL">Any Bounty</option>
                    <option value="LOW">&lt; 50,000 CR</option>
                    <option value="MID">50k - 100k CR</option>
                    <option value="HIGH">&gt; 100,000 CR</option>
                  </select>
                </div>
              </div>

              <div className="lz-toolbar-actions">
                <button className="lz-btn-add-item" onClick={handleAddFictionalItem}>
                  <span className="lz-plus-icon">+</span> ADD FICTIONAL ITEM
                </button>
              </div>
            </div>

            {/* Storage Telemetry: Two Compact Dedicated Panels */}
            <div className="lz-storage-grid">
              {/* SESSION STORAGE PANEL */}
              <div className="lz-storage-card session-card">
                <div className="lz-storage-header">
                  <div className="lz-sh-left">
                    <span className="lz-storage-indicator volatile" />
                    <div>
                      <h3 className="lz-storage-title">SESSION STORAGE</h3>
                      <span className="lz-storage-sub">TRANSIENT &bull; RESETS ON REFRESH</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="lz-storage-fetch-btn session"
                    onClick={() => {
                      setHasFetchedSession(true);
                      try {
                        const s = sessionStorage.getItem('applied_tournament_session');
                        if (s) {
                          const parsed = JSON.parse(s);
                          const normalized = {
                            matchId: parsed.matchId || parsed.id || 1,
                            matchCode: parsed.matchCode || parsed.match_code || 'TM-101',
                            title: parsed.title || 'SECTOR 07 CYBERNETIC CLASH',
                            category: parsed.category || 'ELITE',
                            scheduledTime: parsed.scheduledTime || parsed.scheduled_time || '2026-10-18 18:00 UTC',
                            prizeAmount: parsed.prizeAmount || parsed.prize_amount || 50000,
                            applicantUser: parsed.applicantUser || (user ? user.username : 'cadet_operative'),
                            appliedAt: parsed.appliedAt || new Date().toLocaleString()
                          };
                          setSessionAppData(normalized);
                          notify(`FETCHED SESSION STORAGE: Operative [${normalized.applicantUser}] applied for [${normalized.matchCode}]!`, 'success');
                        } else {
                          setSessionAppData(null);
                          notify('SESSION STORAGE IS EMPTY: Nothing stored (vanished after refresh).', 'info');
                        }
                      } catch (err) {
                        console.error(err);
                        setSessionAppData(null);
                        notify('Error reading Session Storage.', 'error');
                      }
                    }}
                    title="Fetch current Session Storage record"
                  >
                    ⚡ FETCH SESSION STORAGE
                  </button>
                </div>
                <div className="lz-storage-body">
                  {hasFetchedSession ? (
                    sessionAppData ? (
                      <div className="lz-storage-record session">
                        <div className="lz-record-top">
                          <span className="lz-rec-code">{sessionAppData.matchCode}</span>
                          <span className="lz-rec-user">@{sessionAppData.applicantUser}</span>
                          <span className="lz-rec-badge volatile">TRANSIENT</span>
                        </div>
                        <div className="lz-rec-details">
                          <span>{sessionAppData.title}</span> &bull; 
                          <span>CAT: {sessionAppData.category}</span> &bull; 
                          <span>⏰ {sessionAppData.scheduledTime}</span> &bull; 
                          <span className="lz-rec-bounty">{Number(sessionAppData.prizeAmount).toLocaleString()} CR</span>
                        </div>
                      </div>
                    ) : (
                      <div className="lz-storage-empty">
                        <span className="lz-empty-dash">—</span>
                        <span>Session storage is empty. Apply for a match first or it expired on refresh.</span>
                      </div>
                    )
                  ) : (
                    <div className="lz-storage-placeholder">
                      <span>Click <strong>"FETCH SESSION STORAGE"</strong> to query current volatile memory. Disappears upon page reload.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* LOCAL STORAGE PANEL */}
              <div className="lz-storage-card local-card">
                <div className="lz-storage-header">
                  <div className="lz-sh-left">
                    <span className="lz-storage-indicator persistent" />
                    <div>
                      <h3 className="lz-storage-title">LOCAL STORAGE</h3>
                      <span className="lz-storage-sub">PERSISTENT APPLICATION RECORDS</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="lz-storage-fetch-btn local"
                    onClick={() => {
                      setHasFetchedLocal(true);
                      try {
                        const l = localStorage.getItem('tournament_applications_history');
                        const list = l ? JSON.parse(l) : [];
                        setLocalAppData(list);
                        notify(`FETCHED LOCAL STORAGE: ${list.length} permanent tournament applications retrieved.`, 'success');
                      } catch {
                        setLocalAppData([]);
                        notify('Error reading Local Storage.', 'error');
                      }
                    }}
                    title="Fetch persistent Local Storage history"
                  >
                    💾 FETCH LOCAL STORAGE
                  </button>
                </div>
                <div className="lz-storage-body">
                  {hasFetchedLocal ? (
                    localAppData.length > 0 ? (
                      <div className="lz-storage-records-list">
                        {localAppData.map((app, i) => (
                          <div key={i} className="lz-storage-record local">
                            <div className="lz-record-top">
                              <span className="lz-rec-code">{app.matchCode}</span>
                              <span className="lz-rec-user">@{app.applicantUser}</span>
                              <span className="lz-rec-badge persistent">PERSISTENT</span>
                            </div>
                            <div className="lz-rec-details">
                              <span>⏰ {app.scheduledTime}</span> &bull; 
                              <span>RECORD #{i + 1}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="lz-storage-empty">
                        <span className="lz-empty-dash">—</span>
                        <span>No persistent tournament applications found in Local Storage.</span>
                      </div>
                    )
                  ) : (
                    <div className="lz-storage-placeholder">
                      <span>Click <strong>"FETCH LOCAL STORAGE"</strong> to retrieve permanent client applications. Retained across browser sessions.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Operational Workspace: Match Table (Left/Center) + Tournament Details (Right) */}
            <div className="lz-operational-workspace">
              {/* Information-Dense Match Registry Table */}
              <section className="lz-table-container">
                <div className="lz-table-header-bar">
                  <div className="lz-thb-left">
                    <span className="lz-thb-dot" />
                    <span className="lz-thb-title">TOURNAMENT REGISTRY MATRIX</span>
                  </div>
                  <span className="lz-thb-info">SELECT ROW TO INSPECT OPERATIONAL PARAMETERS</span>
                </div>

                {isLoading && (
                  <div className="lz-table-loading">
                    <div className="lz-loading-spinner" />
                    <span>FETCHING ACTIVE TOURNAMENT REGISTRY VIA AJAX...</span>
                  </div>
                )}

                {hasError && (
                  <div className="lz-table-error">
                    <span className="lz-err-icon">⚠</span>
                    <p>Failed to retrieve tournament records from endpoint.</p>
                    <button className="lz-retry-btn" onClick={loadTournaments}>
                      TRIGGER RETRY PATH
                    </button>
                  </div>
                )}

                {!isLoading && !hasError && (
                  <div className="lz-table-scroll-wrapper">
                    <table className="lz-match-table">
                      <thead>
                        <tr>
                          <th className="th-code">MATCH ID</th>
                          <th className="th-title">TITLE & INTEL</th>
                          <th className="th-cat">CATEGORY / TYPE</th>
                          <th className="th-time">SCHEDULED (UTC)</th>
                          <th className="th-bounty">BOUNTY</th>
                          <th className="th-status">STATUS</th>
                          <th className="th-action">ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMatches.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="lz-table-empty-row">
                              NO TOURNAMENT RECORDS MATCH THE CURRENT FILTERS.
                            </td>
                          </tr>
                        ) : (
                          filteredMatches.map((m) => {
                            const isSelected = selectedMatch && selectedMatch.id === m.id;
                            return (
                              <tr
                                key={m.id}
                                className={`lz-row ${isSelected ? 'selected' : ''}`}
                                onClick={() => {
                                  setSelectedMatch(m);
                                  setHasFetchedApplicants(false);
                                }}
                              >
                                <td className="td-code">
                                  <div className="lz-code-cell">
                                    <span className="lz-selected-bar" />
                                    <span className="lz-code-text">{m.match_code}</span>
                                  </div>
                                </td>
                                <td className="td-title">
                                  <div className="lz-title-cell">
                                    <span className="lz-match-name">{m.title}</span>
                                    <span className="lz-match-intel">
                                      {m.max_players ? `${m.registered_count || 0} / ${m.max_players} CADETS REGISTERED` : 'HIGH COMMAND SANCTIONED'}
                                    </span>
                                  </div>
                                </td>
                                <td className="td-cat">
                                  <span className="lz-cat-badge">{m.category}</span>
                                  <span className="lz-type-badge">{m.match_type}</span>
                                </td>
                                <td className="td-time">
                                  <span className="lz-time-text">⏰ {m.scheduled_time || '2026-10-18 18:00 UTC'}</span>
                                </td>
                                <td className="td-bounty">
                                  <span className="lz-bounty-badge">
                                    {Number(m.prize_amount).toLocaleString()} CR
                                  </span>
                                </td>
                                <td className="td-status">
                                  <span className={`lz-status-chip ${m.status.toLowerCase()}`}>
                                    <span className="lz-chip-bullet" />
                                    {m.status}
                                  </span>
                                </td>
                                <td className="td-action" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    className="lz-row-delete-btn"
                                    onClick={(e) => handleRemoveItem(m.id, e)}
                                    title={`Decommission match ${m.match_code}`}
                                  >
                                    ✕
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Dedicated Tournament Details Panel (Right Side) */}
              <aside className="lz-details-panel">
                {selectedMatch ? (
                  <div className="lz-details-card">
                    <div className="lz-dc-top">
                      <div className="lz-dc-meta">
                        <span className="lz-dc-id">{selectedMatch.match_code}</span>
                        <span className={`lz-dc-status ${selectedMatch.status.toLowerCase()}`}>
                          {selectedMatch.status}
                        </span>
                      </div>
                      <span className="lz-dc-label">OPERATIONAL BRIEFING</span>
                    </div>

                    <h2 className="lz-dc-title">{selectedMatch.title}</h2>
                    <p className="lz-dc-desc">
                      Official LastZone high-stakes competitive engagement. Operatives deploy under strict Tactical Combat Rules. Victor claims primary credit allocation.
                    </p>

                    <div className="lz-dc-divider" />

                    {/* 2-Column Metadata Grid */}
                    <div className="lz-dc-grid">
                      <div className="lz-dc-field">
                        <span className="lz-fld-label">CHAMPIONSHIP BOUNTY</span>
                        <span className="lz-fld-val red">
                          {Number(selectedMatch.prize_amount).toLocaleString()} CREDITS
                        </span>
                      </div>
                      <div className="lz-dc-field">
                        <span className="lz-fld-label">SCHEDULED START TIME</span>
                        <span className="lz-fld-val">
                          ⏰ {selectedMatch.scheduled_time || '2026-10-18 18:00 UTC'}
                        </span>
                      </div>
                      <div className="lz-dc-field">
                        <span className="lz-fld-label">CATEGORY & DISCIPLINE</span>
                        <span className="lz-fld-val">
                          {selectedMatch.category} // {selectedMatch.match_type}
                        </span>
                      </div>
                      <div className="lz-dc-field">
                        <span className="lz-fld-label">REGISTERED OPERATIVES</span>
                        <span className="lz-fld-val">
                          {selectedMatch.registered_count} / {selectedMatch.max_players} CADETS
                        </span>
                      </div>
                    </div>

                    {/* Operational Action Buttons */}
                    <div className="lz-dc-actions">
                      <button
                        className="lz-btn-primary-apply"
                        onClick={() => handleApplyTournament(selectedMatch)}
                        title="Apply and store in Session Storage, Local Storage, and MySQL"
                      >
                        APPLY FOR TOURNAMENT
                      </button>

                      <div className="lz-dc-secondary-row">
                        <button
                          className="lz-btn-secondary"
                          onClick={() => handleStartGame(selectedMatch)}
                        >
                          ▶ START GAME IN SECTOR 07
                        </button>

                        <button
                          className="lz-btn-secondary"
                          onClick={() => handleFetchApplicants(selectedMatch.id)}
                          disabled={isLoadingApplicants}
                        >
                          {isLoadingApplicants ? 'FETCHING...' : '👥 FETCH DATA (APPLIED PLAYERS)'}
                        </button>
                      </div>
                    </div>

                    {/* Applied Players List when Fetched */}
                    {hasFetchedApplicants && (
                      <div className="lz-applicants-subpanel">
                        <div className="lz-asp-header">
                          <span className="lz-asp-title">APPLIED OPERATIVES ({applicants.length})</span>
                          <span className="lz-asp-time">{selectedMatch.scheduled_time || '2026-10-18 18:00 UTC'}</span>
                        </div>
                        {applicants.length > 0 ? (
                          <div className="lz-asp-list">
                            {applicants.map((app) => (
                              <div key={app.id} className="lz-asp-item">
                                <span className="lz-asp-dot" />
                                <div className="lz-asp-info">
                                  <span className="lz-asp-name">{app.display_name || app.username}</span>
                                  <span className="lz-asp-handle">@{app.username}</span>
                                </div>
                                <span className="lz-asp-status">{app.status}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="lz-asp-empty">No operatives registered yet. Click 'APPLY FOR TOURNAMENT' to apply.</p>
                        )}
                      </div>
                    )}

                    {/* Operative Roster Quick Links */}
                    <div className="lz-roster-section">
                      <h4 className="lz-roster-title">CADET ROSTER QUICK LINKS</h4>
                      <div className="lz-roster-chips">
                        {['dharnidharan', 'ghost_recon', 'spartan_117', 'valkyrie', 'shadow_hunter', 'jdramkrish'].map((cname) => (
                          <button
                            key={cname}
                            type="button"
                            className="lz-cadet-tag"
                            onClick={() => {
                              setActiveTab('PROFILE');
                              const matchIdMap = { dharnidharan: 1, ghost_recon: 2, spartan_117: 3, valkyrie: 4, shadow_hunter: 5, jdramkrish: 9 };
                              setSearchParams({ tab: 'profile', userId: matchIdMap[cname] || 1 });
                            }}
                            title={`View profile for @${cname}`}
                          >
                            <span className="lz-cadet-dot" />
                            <span>@{cname}</span>
                            <span className="lz-cadet-arrow">↗</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="lz-empty-details-card">
                    <span className="lz-edc-icon">⚔</span>
                    <h3>NO MATCH SELECTED</h3>
                    <p>Select any tournament record from the registry matrix to inspect operational briefing.</p>
                  </div>
                )}
              </aside>
            </div>
          </div>
        )}

        {/* TAB 2: OPERATIVE PROFILE & COMBAT HISTORY */}
        {activeTab === 'PROFILE' && (
          <div className="profile-workspace">
            {isLoadingProfile && (
              <div className="tcp-loading-state">
                <div className="radar-spinner-mini" />
                <span>RETRIEVING COMBAT TELEMETRY & MySQL RUNS...</span>
              </div>
            )}

            {profileData && (
              <div className="profile-container">
                <div className="profile-identity-header">
                  <div className="pih-left">
                    <div className="pih-avatar-box">
                      <span className="pih-avatar-letter">
                        {profileData.player.username.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="pih-role-tag">{profileData.player.role}</div>
                      <h2 className="pih-display-name">{profileData.player.display_name || profileData.player.username}</h2>
                      <span className="pih-handle">CALLSIGN: @{profileData.player.username} &bull; {profileData.player.email}</span>
                    </div>
                  </div>

                  <div className="pih-right">
                    <button
                      className="ref-pill-btn"
                      style={{ background: '#111', color: '#ff3333', borderColor: '#ff3333' }}
                      onClick={() => {
                        const profileUrl = `${window.location.origin}/tournaments?tab=profile&userId=${profileUserId}`;
                        navigator.clipboard.writeText(profileUrl);
                        notify(`COPIED PROFILE LINK: ${profileUrl}`, 'success');
                      }}
                      title="Copy public operative link to clipboard for scraper"
                    >
                      🔗 COPY PROFILE LINK
                    </button>
                    <button
                      className="ref-pill-btn"
                      onClick={() => {
                        const profileUrl = `${window.location.origin}/tournaments?tab=profile&userId=${profileUserId}`;
                        navigate(`/scraper?url=${encodeURIComponent(profileUrl)}`);
                      }}
                      title="Analyze operative with the scraper tool"
                    >
                      ⚡ SCRAPE PROFILE
                    </button>
                    <button
                      className="ref-pill-btn active"
                      onClick={() => navigate('/play')}
                    >
                      ▶ START GAME RUN
                    </button>
                    <button
                      className="ref-pill-btn"
                      onClick={() => navigate('/weapons')}
                    >
                      WEAPONS ARMORY & REQUISITION
                    </button>
                  </div>
                </div>

                <div className="profile-stats-cards">
                  <div className="psc-card">
                    <span className="psc-lbl">PERSONAL BEST SCORE</span>
                    <span className="psc-val gold">
                      {Number(profileData.stats.maxScore).toLocaleString()}
                    </span>
                  </div>
                  <div className="psc-card">
                    <span className="psc-lbl">CONFIRMED HOSTILE KILLS</span>
                    <span className="psc-val">
                      {Number(profileData.stats.totalKills).toLocaleString()}
                    </span>
                  </div>
                  <div className="psc-card">
                    <span className="psc-lbl">MAX SURVIVED WAVE</span>
                    <span className="psc-val">
                      WAVE {profileData.stats.maxWave}
                    </span>
                  </div>
                  <div className="psc-card">
                    <span className="psc-lbl">TOTAL RUNS LOGGED</span>
                    <span className="psc-val">
                      {profileData.stats.totalMatches} MISSIONS
                    </span>
                  </div>
                </div>

                <div className="profile-history-grid">
                  <div className="phg-table-card">
                    <div className="phg-card-header">
                      <h3>COMBAT TELEMETRY // PAST MISSIONS</h3>
                      <span className="phg-badge">{profileData.runs.length} RUNS</span>
                    </div>

                    <div className="phg-table-wrap">
                      <table className="phg-table">
                        <thead>
                          <tr>
                            <th>RUN ID</th>
                            <th>SCORE</th>
                            <th>KILLS</th>
                            <th>WAVE</th>
                            <th>SURVIVAL</th>
                            <th>TIMESTAMP</th>
                          </tr>
                        </thead>
                        <tbody>
                          {profileData.runs.length > 0 ? (
                            profileData.runs.map((run) => (
                              <tr key={run.id}>
                                <td className="mono font-bold">#RUN-{run.id}</td>
                                <td className="mono gold font-bold">{Number(run.score).toLocaleString()}</td>
                                <td className="mono">{run.kills}</td>
                                <td className="mono">WAVE {run.wave}</td>
                                <td className="mono">{run.survival_duration ? `${run.survival_duration}s` : 'N/A'}</td>
                                <td className="mono muted">{run.completed_at || run.created_at}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="6" className="text-center muted py-4">
                                No combat debriefs logged yet for this operative. Click Start Game to commence.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="phg-table-card">
                    <div className="phg-card-header">
                      <h3>REQUISITIONED WEAPONS & CLEARANCES</h3>
                      <span className="phg-badge">{profileData.purchases.length} ITEMS</span>
                    </div>

                    <div className="phg-table-wrap">
                      <table className="phg-table">
                        <thead>
                          <tr>
                            <th>WEAPON</th>
                            <th>CLEARANCE CODE</th>
                            <th>AMOUNT</th>
                            <th>DATE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {profileData.purchases.length > 0 ? (
                            profileData.purchases.map((p, idx) => (
                              <tr key={idx}>
                                <td className="font-bold">{p.weapon_name}</td>
                                <td className="mono code-tag">{p.purchase_code}</td>
                                <td className="mono">{Number(p.amount).toLocaleString()} CR</td>
                                <td className="mono muted">{p.created_at}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="4" className="text-center muted py-4">
                                No weapon acquisitions on record. Go to Weapons Requisition to purchase with code LASTZONE.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ADMIN DASHBOARD (VANGUARD ADMIN CONTROL) */}
        {activeTab === 'ADMIN' && (
          <div className="vanguard-admin-dashboard">
            {/* Elegant Page Introduction */}
            <div className="vad-intro-block">
              <div className="vad-intro-meta">
                <span className="vad-accent-slant" />
                <span className="vad-meta-tag">COMMAND OVERRIDE // CLASSIFIED OPERATIONS</span>
              </div>

              <div className="vad-intro-row">
                <div className="vad-intro-left">
                  <h1 className="vad-page-title">VANGUARD ADMIN CONTROL</h1>
                  <p className="vad-page-subtitle">
                    COMMAND OVERRIDE &bull; OPERATIVE MANAGEMENT &bull; TOURNAMENT OPERATIONS
                  </p>
                </div>
                <div className="vad-intro-right">
                  <button
                    type="button"
                    className="vad-btn-outline-refresh"
                    onClick={loadAdminUsers}
                    disabled={isLoadingAdmin}
                    title="Reload admin user profiles and database records"
                  >
                    <span className="vad-refresh-icon">↻</span> REFRESH ADMIN DATA
                  </button>
                </div>
              </div>
              <div className="vad-heading-divider" />
            </div>

            {/* 4 Minimalist Overview Statistic Cards */}
            <div className="vad-metrics-overview">
              <div className="vad-stat-card">
                <div className="vad-stat-top">
                  <span className="vad-stat-label">TOTAL OPERATIVES</span>
                  <span className="vad-stat-dot" />
                </div>
                <span className="vad-stat-val">{adminUsers.length}</span>
                <span className="vad-stat-hint">Active combat accounts</span>
              </div>

              <div className="vad-stat-card">
                <div className="vad-stat-top">
                  <span className="vad-stat-label">TOTAL MATCHES</span>
                  <span className="vad-stat-dot red" />
                </div>
                <span className="vad-stat-val">{matches.length}</span>
                <span className="vad-stat-hint">Scheduled operational sectors</span>
              </div>

              <div className="vad-stat-card">
                <div className="vad-stat-top">
                  <span className="vad-stat-label">ACTIVE MATCHES</span>
                  <span className="vad-stat-dot" />
                </div>
                <span className="vad-stat-val">
                  {matches.filter((m) => m.status === 'OPEN' || m.status === 'IN_PROGRESS').length}
                </span>
                <span className="vad-stat-hint">Accepting operative deployment</span>
              </div>

              <div className="vad-stat-card">
                <div className="vad-stat-top">
                  <span className="vad-stat-label">TOTAL REGISTERED PLAYERS</span>
                  <span className="vad-stat-dot red" />
                </div>
                <span className="vad-stat-val">
                  {matches.reduce((acc, m) => acc + (Number(m.registered_count) || 0), 0)}
                </span>
                <span className="vad-stat-hint">Cadets deployed across brackets</span>
              </div>
            </div>

            {/* Operatives Management Panel */}
            <section className="vad-panel">
              <div className="vad-panel-header">
                <div className="vad-ph-left">
                  <span className="vad-ph-indicator" />
                  <div>
                    <h2 className="vad-panel-title">OPERATIVES MANAGEMENT</h2>
                    <span className="vad-panel-count">{adminUsers.length} TOTAL REGISTERED CADETS</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="vad-btn-commission"
                  onClick={() => {
                    const el = document.getElementById('vad-create-user-form');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <span className="vad-plus">+</span> COMMISSION NEW OPERATIVE
                </button>
              </div>

              {/* Edit Operative Dialog/Inline Form */}
              {editingUser && (
                <form className="vad-form-box vad-edit-box" onSubmit={handleAdminUpdateUser}>
                  <div className="vad-fb-header">
                    <span className="vad-fb-badge">EDITING OPERATIVE</span>
                    <h4>OPERATIVE #{editingUser.id} &bull; @{editingUser.username}</h4>
                  </div>
                  <div className="vad-fb-grid cols-3">
                    <div className="vad-input-wrap">
                      <label>DISPLAY NAME</label>
                      <input
                        type="text"
                        placeholder="Display Name"
                        value={editingUser.displayName}
                        onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })}
                        required
                        className="vad-input"
                      />
                    </div>
                    <div className="vad-input-wrap">
                      <label>EMAIL ADDRESS</label>
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={editingUser.email}
                        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                        required
                        className="vad-input"
                      />
                    </div>
                    <div className="vad-input-wrap">
                      <label>SECURITY ROLE</label>
                      <select
                        value={editingUser.role}
                        onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                        className="vad-select"
                      >
                        <option value="ROLE_USER">ROLE_USER (Standard)</option>
                        <option value="ROLE_ADMIN">ROLE_ADMIN (Command Override)</option>
                      </select>
                    </div>
                  </div>
                  <div className="vad-fb-actions">
                    <button type="submit" className="vad-btn-save">SAVE UPDATE</button>
                    <button type="button" className="vad-btn-cancel" onClick={() => setEditingUser(null)}>CANCEL</button>
                  </div>
                </form>
              )}

              {/* Create Operative Form */}
              <form id="vad-create-user-form" className="vad-form-box" onSubmit={handleAdminCreateUser}>
                <div className="vad-fb-header">
                  <span className="vad-fb-badge new">+ NEW COMMISSION</span>
                  <h4>COMMISSION NEW OPERATIVE CADET</h4>
                </div>
                <div className="vad-fb-grid cols-4">
                  <div className="vad-input-wrap">
                    <label>CALLSIGN (USERNAME)</label>
                    <input
                      type="text"
                      placeholder="e.g. ghost_recon"
                      value={newOperative.username}
                      onChange={(e) => setNewOperative({ ...newOperative, username: e.target.value })}
                      required
                      className="vad-input"
                    />
                  </div>
                  <div className="vad-input-wrap">
                    <label>TELEMETRY EMAIL</label>
                    <input
                      type="email"
                      placeholder="cadet@lastzone.io"
                      value={newOperative.email}
                      onChange={(e) => setNewOperative({ ...newOperative, email: e.target.value })}
                      required
                      className="vad-input"
                    />
                  </div>
                  <div className="vad-input-wrap">
                    <label>DISPLAY NAME</label>
                    <input
                      type="text"
                      placeholder="Ghost Recon"
                      value={newOperative.displayName}
                      onChange={(e) => setNewOperative({ ...newOperative, displayName: e.target.value })}
                      className="vad-input"
                    />
                  </div>
                  <div className="vad-input-wrap">
                    <label>ASSIGNED ROLE</label>
                    <select
                      value={newOperative.role}
                      onChange={(e) => setNewOperative({ ...newOperative, role: e.target.value })}
                      className="vad-select"
                    >
                      <option value="ROLE_USER">ROLE_USER</option>
                      <option value="ROLE_ADMIN">ROLE_ADMIN</option>
                    </select>
                  </div>
                </div>
                <div className="vad-fb-actions">
                  <button type="submit" className="vad-btn-primary-action">+ COMMISSION OPERATIVE</button>
                </div>
              </form>

              {/* Operatives Table */}
              <div className="vad-table-container">
                <table className="vad-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>ID</th>
                      <th style={{ width: '180px' }}>CALLSIGN</th>
                      <th>NAME</th>
                      <th style={{ width: '140px' }}>ROLE</th>
                      <th style={{ width: '140px', textAlign: 'right' }}>BEST SCORE</th>
                      <th style={{ width: '130px', textAlign: 'center' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="vad-empty-cell">
                          NO OPERATIVE PROFILES RETRIEVED. CLICK "REFRESH ADMIN DATA" TO QUERY MYSQL.
                        </td>
                      </tr>
                    ) : (
                      adminUsers.map((u) => (
                        <tr key={u.id} className="vad-table-row">
                          <td className="vad-cell-id">#{u.id}</td>
                          <td className="vad-cell-callsign">
                            <span className="vad-callsign-text">@{u.username}</span>
                          </td>
                          <td className="vad-cell-name">
                            <span className="vad-display-text">{u.displayName || u.username}</span>
                            <span className="vad-sub-text">{u.email}</span>
                          </td>
                          <td className="vad-cell-role">
                            <span className={`vad-role-chip ${u.role === 'ROLE_ADMIN' ? 'admin' : 'user'}`}>
                              {u.role === 'ROLE_ADMIN' ? 'ADMIN OVERRIDE' : 'CADET OPERATIVE'}
                            </span>
                          </td>
                          <td className="vad-cell-score">
                            {Number(u.bestScore || 0).toLocaleString()}
                          </td>
                          <td className="vad-cell-actions">
                            <button
                              type="button"
                              className="vad-btn-action-edit"
                              onClick={() => setEditingUser({ id: u.id, username: u.username, displayName: u.displayName, email: u.email, role: u.role })}
                            >
                              EDIT
                            </button>
                            {u.id !== 1 && (
                              <button
                                type="button"
                                className="vad-btn-action-delete"
                                onClick={() => handleAdminDeleteUser(u.id, u.username)}
                              >
                                DELETE
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Tournament Management Panel */}
            <section className="vad-panel">
              <div className="vad-panel-header">
                <div className="vad-ph-left">
                  <span className="vad-ph-indicator red" />
                  <div>
                    <h2 className="vad-panel-title">TOURNAMENT MANAGEMENT</h2>
                    <span className="vad-panel-count">{matches.length} SCHEDULED TOURNAMENT MATCHES</span>
                  </div>
                </div>
              </div>

              {/* Compact Tournament Commission Form */}
              <form className="vad-form-box" onSubmit={handleAdminCreateTournament}>
                <div className="vad-fb-header">
                  <span className="vad-fb-badge new red">+ COMMISSION SECTOR</span>
                  <h4>COMMISSION NEW TOURNAMENT MATCH</h4>
                </div>
                <div className="vad-fb-grid cols-3">
                  <div className="vad-input-wrap">
                    <label>MATCH CODE</label>
                    <input
                      type="text"
                      placeholder="e.g. TM-109"
                      value={newTournament.match_code}
                      onChange={(e) => setNewTournament({ ...newTournament, match_code: e.target.value })}
                      required
                      className="vad-input"
                    />
                  </div>
                  <div className="vad-input-wrap">
                    <label>TOURNAMENT TITLE</label>
                    <input
                      type="text"
                      placeholder="e.g. SECTOR 09 REDLINE ASSAULT"
                      value={newTournament.title}
                      onChange={(e) => setNewTournament({ ...newTournament, title: e.target.value })}
                      required
                      className="vad-input"
                    />
                  </div>
                  <div className="vad-input-wrap">
                    <label>CATEGORY</label>
                    <select
                      value={newTournament.category}
                      onChange={(e) => setNewTournament({ ...newTournament, category: e.target.value })}
                      className="vad-select"
                    >
                      <option value="TACTICAL">Tactical</option>
                      <option value="ELITE">Elite</option>
                      <option value="MASTERS">Masters</option>
                      <option value="CHAMPIONSHIP">Championship</option>
                    </select>
                  </div>
                  <div className="vad-input-wrap">
                    <label>MATCH TYPE</label>
                    <select
                      value={newTournament.match_type}
                      onChange={(e) => setNewTournament({ ...newTournament, match_type: e.target.value })}
                      className="vad-select"
                    >
                      <option value="SOLO">Solo Operations</option>
                      <option value="DUO">Duo Recon</option>
                      <option value="SQUAD">Squad Battle</option>
                    </select>
                  </div>
                  <div className="vad-input-wrap">
                    <label>BOUNTY AMOUNT (CREDITS)</label>
                    <input
                      type="number"
                      placeholder="50000"
                      value={newTournament.prize_amount}
                      onChange={(e) => setNewTournament({ ...newTournament, prize_amount: Number(e.target.value) })}
                      className="vad-input"
                    />
                  </div>
                  <div className="vad-input-wrap">
                    <label>SCHEDULED TIME (UTC)</label>
                    <input
                      type="text"
                      placeholder="2026-10-25 18:00 UTC"
                      value={newTournament.scheduled_time}
                      onChange={(e) => setNewTournament({ ...newTournament, scheduled_time: e.target.value })}
                      className="vad-input"
                    />
                  </div>
                </div>
                <div className="vad-fb-actions">
                  <button type="submit" className="vad-btn-primary-action red">+ COMMISSION MATCH</button>
                </div>
              </form>

              {/* Tournament Table */}
              <div className="vad-table-container">
                <table className="vad-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '130px' }}>CODE</th>
                      <th>TITLE</th>
                      <th style={{ width: '220px' }}>SCHEDULED TIME</th>
                      <th style={{ width: '150px', textAlign: 'right' }}>BOUNTY</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="vad-empty-cell">
                          NO ACTIVE TOURNAMENT RECORDS FOUND.
                        </td>
                      </tr>
                    ) : (
                      matches.map((m) => (
                        <tr key={m.id} className="vad-table-row">
                          <td className="vad-cell-code">
                            <span className="vad-code-pill">{m.match_code}</span>
                          </td>
                          <td className="vad-cell-tourney-title">
                            <span className="vad-tourney-name">{m.title}</span>
                            <span className="vad-tourney-tags">{m.category} &bull; {m.match_type}</span>
                          </td>
                          <td className="vad-cell-time">
                            ⏰ {m.scheduled_time || '2026-10-18 18:00 UTC'}
                          </td>
                          <td className="vad-cell-bounty">
                            {Number(m.prize_amount).toLocaleString()} CR
                          </td>
                          <td className="vad-cell-actions">
                            <button
                              type="button"
                              className="vad-btn-action-delete"
                              onClick={() => handleAdminDeleteTournament(m.id, m.match_code)}
                              title={`Decommission match ${m.match_code}`}
                            >
                              DELETE
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Assignment VIII: Competitor Games & Web Scraper Application */}
            <section className="vad-panel vad-scraper-panel">
              <div className="vad-panel-header">
                <div className="vad-ph-left">
                  <span className="vad-ph-indicator" />
                  <div>
                    <h2 className="vad-panel-title">COMPETITOR WEB SCRAPER & DOM ANALYZER</h2>
                    <span className="vad-panel-count">ASSIGNMENT VIII &bull; 15-POINT DOM EXTRACTION SPEC</span>
                  </div>
                </div>
              </div>
                <p style={{ color: '#a1a1aa', fontSize: '13px', margin: '4px 0 16px' }}>
                  Enter any competitor game URL or target webpage. The PHP script fetches the raw HTML and extracts Page Title, Meta Description & Keywords, Charset, Lang, Canonical, Favicon, Open Graph, H1-H3 Headings, Classified Hyperlinks (Internal vs External), Images, Scripts/Stylesheets, Page Size in KB, and visible text Word Count.
                </p>

                {/* Scraper Form */}
                <form className="admin-create-form" onSubmit={handleAdminScrapeUrl}>
                  <div className="acf-grid" style={{ gridTemplateColumns: '1fr auto auto' }}>
                    <input
                      type="url"
                      placeholder="Enter target website URL e.g. https://store.steampowered.com/ or https://en.wikipedia.org/wiki/Web_scraping"
                      value={adminScraperUrl}
                      onChange={(e) => setAdminScraperUrl(e.target.value)}
                      required
                      style={{ fontSize: '13px' }}
                    />
                    <button
                      type="button"
                      className="ref-pill-btn"
                      onClick={() => setAdminScraperUrl('https://en.wikipedia.org/wiki/Web_scraping')}
                      title="Quick test URL"
                    >
                      SAMPLE URL
                    </button>
                    <button
                      type="submit"
                      className="ref-pill-btn active"
                      disabled={isScrapingAdmin}
                    >
                      {isScrapingAdmin ? 'ANALYZING DOM...' : '🔍 SCRAPE WEBPAGE DETAILS'}
                    </button>
                  </div>
                </form>

                {adminScrapeError && (
                  <div className="sc-error-banner" style={{ marginTop: '14px' }}>
                    <span>⚠ {adminScrapeError}</span>
                  </div>
                )}

                {/* Extracted Details Display (Neatly Formatted Tables & Lists) */}
                {adminScrapeResult && adminScrapeResult.analysis && (
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #27272a', paddingBottom: '8px' }}>
                      <span className="mono" style={{ color: '#4ade80', fontSize: '13px', fontWeight: 'bold' }}>
                        ✓ STATUS {adminScrapeResult.httpStatus} // RAW HTML SIZE: {adminScrapeResult.analysis.pageSizeKB} KB ({adminScrapeResult.analysis.pageSizeBytes} bytes)
                      </span>
                      <span className="mono text-xs" style={{ color: '#71717a' }}>SCRAPED AT: {adminScrapeResult.scrapedAt}</span>
                    </div>

                    {/* Overview Key-Value Table */}
                    <div className="admin-table-wrap" style={{ marginBottom: '16px' }}>
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th style={{ width: '220px' }}>SPECIFICATION PARAMETER</th>
                            <th>EXTRACTED VALUE / METADATA</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="mono font-bold">PAGE TITLE (&lt;title&gt;)</td>
                            <td style={{ color: '#fbbf24', fontWeight: 600 }}>{adminScrapeResult.analysis.title || 'None found'}</td>
                          </tr>
                          <tr>
                            <td className="mono font-bold">META DESCRIPTION</td>
                            <td>{adminScrapeResult.analysis.metaDescription || '<span class="muted">[Empty or not declared]</span>'}</td>
                          </tr>
                          <tr>
                            <td className="mono font-bold">META KEYWORDS</td>
                            <td>{adminScrapeResult.analysis.metaKeywords || '<span class="muted">[Not declared]</span>'}</td>
                          </tr>
                          <tr>
                            <td className="mono font-bold">CHARACTER ENCODING / CHARSET</td>
                            <td className="mono">{adminScrapeResult.analysis.charset}</td>
                          </tr>
                          <tr>
                            <td className="mono font-bold">PAGE LANGUAGE (&lt;html lang&gt;)</td>
                            <td className="mono">{adminScrapeResult.analysis.language}</td>
                          </tr>
                          <tr>
                            <td className="mono font-bold">CANONICAL URL</td>
                            <td className="mono">{adminScrapeResult.analysis.canonicalUrl || 'None specified'}</td>
                          </tr>
                          <tr>
                            <td className="mono font-bold">FAVICON URL</td>
                            <td className="mono">{adminScrapeResult.analysis.faviconUrl || 'Default favicon'}</td>
                          </tr>
                          <tr>
                            <td className="mono font-bold">WORD COUNT (BODY TEXT)</td>
                            <td className="mono font-bold" style={{ color: '#38bdf8' }}>
                              {Number(adminScrapeResult.analysis.wordCount).toLocaleString()} words (visible text stripped of tags)
                            </td>
                          </tr>
                          <tr>
                            <td className="mono font-bold">OPEN GRAPH TAGS (SOCIAL PREVIEW)</td>
                            <td>
                              <div><strong>og:title:</strong> {adminScrapeResult.analysis.openGraph.title || 'N/A'}</div>
                              <div><strong>og:description:</strong> {adminScrapeResult.analysis.openGraph.description || 'N/A'}</div>
                              <div><strong>og:image:</strong> {adminScrapeResult.analysis.openGraph.image || 'N/A'}</div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Headings Breakdown (H1, H2, H3) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                      <div style={{ background: '#121214', border: '1px solid #27272a', padding: '12px' }}>
                        <span className="mono text-xs font-bold" style={{ color: '#e4e4e7' }}>
                          H1 HEADINGS ({adminScrapeResult.analysis.headingsCounts.h1})
                        </span>
                        <ul style={{ margin: '8px 0 0', paddingLeft: '18px', fontSize: '12px', color: '#a1a1aa' }}>
                          {adminScrapeResult.analysis.headings.h1.length > 0 ? (
                            adminScrapeResult.analysis.headings.h1.map((h, i) => <li key={i}>{h}</li>)
                          ) : (
                            <li className="muted">No H1 tags found</li>
                          )}
                        </ul>
                      </div>

                      <div style={{ background: '#121214', border: '1px solid #27272a', padding: '12px' }}>
                        <span className="mono text-xs font-bold" style={{ color: '#e4e4e7' }}>
                          H2 HEADINGS ({adminScrapeResult.analysis.headingsCounts.h2})
                        </span>
                        <ul style={{ margin: '8px 0 0', paddingLeft: '18px', fontSize: '12px', color: '#a1a1aa', maxHeight: '140px', overflowY: 'auto' }}>
                          {adminScrapeResult.analysis.headings.h2.length > 0 ? (
                            adminScrapeResult.analysis.headings.h2.map((h, i) => <li key={i}>{h}</li>)
                          ) : (
                            <li className="muted">No H2 tags found</li>
                          )}
                        </ul>
                      </div>

                      <div style={{ background: '#121214', border: '1px solid #27272a', padding: '12px' }}>
                        <span className="mono text-xs font-bold" style={{ color: '#e4e4e7' }}>
                          H3 HEADINGS ({adminScrapeResult.analysis.headingsCounts.h3})
                        </span>
                        <ul style={{ margin: '8px 0 0', paddingLeft: '18px', fontSize: '12px', color: '#a1a1aa', maxHeight: '140px', overflowY: 'auto' }}>
                          {adminScrapeResult.analysis.headings.h3.length > 0 ? (
                            adminScrapeResult.analysis.headings.h3.map((h, i) => <li key={i}>{h}</li>)
                          ) : (
                            <li className="muted">No H3 tags found</li>
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* Classified Hyperlinks: Internal vs External */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                      <div style={{ background: '#121214', border: '1px solid #27272a', padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span className="mono text-xs font-bold" style={{ color: '#34d399' }}>
                            INTERNAL LINKS ({adminScrapeResult.analysis.linksSummary.internal})
                          </span>
                          <span className="mono text-xs" style={{ color: '#71717a' }}>Same Domain</span>
                        </div>
                        <div style={{ maxHeight: '180px', overflowY: 'auto', fontSize: '11px' }}>
                          {adminScrapeResult.analysis.internalLinks.map((l, i) => (
                            <div key={i} style={{ padding: '3px 0', borderBottom: '1px solid #1f1f23', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              <span style={{ color: '#e4e4e7' }}>{l.text}</span> &rarr; <span className="mono" style={{ color: '#71717a' }}>{l.href}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ background: '#121214', border: '1px solid #27272a', padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span className="mono text-xs font-bold" style={{ color: '#f87171' }}>
                            EXTERNAL LINKS ({adminScrapeResult.analysis.linksSummary.external})
                          </span>
                          <span className="mono text-xs" style={{ color: '#71717a' }}>Outbound Domain</span>
                        </div>
                        <div style={{ maxHeight: '180px', overflowY: 'auto', fontSize: '11px' }}>
                          {adminScrapeResult.analysis.externalLinks.map((l, i) => (
                            <div key={i} style={{ padding: '3px 0', borderBottom: '1px solid #1f1f23', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              <span style={{ color: '#e4e4e7' }}>{l.text}</span> &rarr; <span className="mono" style={{ color: '#f87171' }}>{l.href}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Scripts, Stylesheets & Images References */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                      <div style={{ background: '#121214', border: '1px solid #27272a', padding: '12px' }}>
                        <span className="mono text-xs font-bold" style={{ color: '#a855f7' }}>
                          SCRIPT REFERENCES ({adminScrapeResult.analysis.scriptsCount})
                        </span>
                        <div style={{ maxHeight: '120px', overflowY: 'auto', fontSize: '11px', marginTop: '6px' }}>
                          {adminScrapeResult.analysis.scripts.map((s, i) => (
                            <div key={i} className="mono" style={{ color: '#c084fc', padding: '2px 0' }}>&bull; {s}</div>
                          ))}
                        </div>
                      </div>

                      <div style={{ background: '#121214', border: '1px solid #27272a', padding: '12px' }}>
                        <span className="mono text-xs font-bold" style={{ color: '#38bdf8' }}>
                          STYLESHEETS ({adminScrapeResult.analysis.stylesheetsCount})
                        </span>
                        <div style={{ maxHeight: '120px', overflowY: 'auto', fontSize: '11px', marginTop: '6px' }}>
                          {adminScrapeResult.analysis.stylesheets.map((c, i) => (
                            <div key={i} className="mono" style={{ color: '#7dd3fc', padding: '2px 0' }}>&bull; {c}</div>
                          ))}
                        </div>
                      </div>

                      <div style={{ background: '#121214', border: '1px solid #27272a', padding: '12px' }}>
                        <span className="mono text-xs font-bold" style={{ color: '#f59e0b' }}>
                          IMAGE SOURCES ({adminScrapeResult.analysis.imagesCount})
                        </span>
                        <div style={{ maxHeight: '120px', overflowY: 'auto', fontSize: '11px', marginTop: '6px' }}>
                          {adminScrapeResult.analysis.images.map((img, i) => (
                            <div key={i} className="mono" style={{ color: '#fcd34d', padding: '2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              &bull; {img.src}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>
          </div>
        )}
      </main>
    </div>
  );
}
