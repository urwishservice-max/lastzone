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

  // Storage states (Display current values from sessionStorage and localStorage)
  const [sessionAppData, setSessionAppData] = useState(null);
  const [localAppData, setLocalAppData] = useState([]);

  // Notification Toast
  const [toast, setToast] = useState(null);
  const notify = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Sync Storage on load
  const syncStorage = useCallback(() => {
    try {
      const s = sessionStorage.getItem('applied_tournament_session');
      setSessionAppData(s ? JSON.parse(s) : null);
      const l = localStorage.getItem('tournament_applications_history');
      setLocalAppData(l ? JSON.parse(l) : []);
    } catch {}
  }, []);

  useEffect(() => {
    syncStorage();
  }, [syncStorage]);

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

    // 1. Store in Session Storage (active session tournament application)
    sessionStorage.setItem('applied_tournament_session', JSON.stringify(appRecord));

    // 2. Store in Local Storage (persistent applications queue across browser reloads)
    try {
      const existing = JSON.parse(localStorage.getItem('tournament_applications_history') || '[]');
      const updated = [appRecord, ...existing.filter(item => item.matchId !== targetMatch.id)];
      localStorage.setItem('tournament_applications_history', JSON.stringify(updated));
    } catch {}

    syncStorage();

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
      <header className="ref-top-header">
        <div className="ref-top-left">
          <div className="ref-time-stamp">
            <span className="ref-time-main">02:11<span className="ref-time-sub">AM</span></span>
            <div className="ref-date-stack">
              <span className="ref-date-month">OCT 2026</span>
              <span className="ref-date-day">THU 15</span>
            </div>
            <span className="ref-weather">15° CLOUDY</span>
          </div>
        </div>

        <div className="ref-top-center">
          <div className="ref-status-box">
            <span className="ref-sb-code">TOURNAMENT // HIGH COMMAND</span>
            <p className="ref-sb-desc">
              COMPOUND FILTERING &bull; SESSION & LOCAL STORAGE &bull; ADMIN DASHBOARD & CRUD
            </p>
          </div>
        </div>

        <div className="ref-top-right">
          <button
            className={`ref-pill-btn ${activeTab === 'TOURNAMENT' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('TOURNAMENT');
              setSearchParams({});
            }}
          >
            TOURNAMENT CENTER
          </button>
          <button
            className={`ref-pill-btn ${activeTab === 'PROFILE' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('PROFILE');
              setSearchParams({ tab: 'profile', userId: profileUserId });
            }}
          >
            OPERATIVE PROFILE
          </button>
          <button
            className={`ref-pill-btn ${activeTab === 'ADMIN' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('ADMIN');
              setSearchParams({ tab: 'admin' });
            }}
          >
            ⚡ ADMIN DASHBOARD
          </button>
          <button className="ref-pill-btn" onClick={() => navigate('/weapons')}>
            WEAPONS REQUISITION
          </button>
          <button className="ref-pill-btn" onClick={() => navigate('/leaderboard')}>
            LEADERBOARD
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
          <div className="tourney-workspace-grid">
            {/* LEFT FILTER & ROSTER PANEL */}
            <aside className="tourney-controls-panel">
              <div className="tcp-header">
                <div>
                  <span className="tcp-tag">FIGURE 10.1 IMPLEMENTATION</span>
                  <h2 className="tcp-title">MATCH REGISTRY</h2>
                </div>
                <button
                  className="tcp-reload-btn"
                  onClick={loadTournaments}
                  disabled={isLoading}
                  title="Reload 8 records via AJAX"
                >
                  ↻ AJAX RELOAD
                </button>
              </div>

              {/* Compound Filter: Search Input */}
              <div className="tcp-search-box">
                <input
                  type="text"
                  className="ref-search-input"
                  placeholder="SEARCH MATCH CODE OR TITLE..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Category Highlight Tabs */}
              <div className="tcp-category-row">
                <span className="tcp-flt-label">CATEGORY HIGHLIGHT:</span>
                <div className="category-chips">
                  {['ALL', 'ELITE', 'TACTICAL', 'MASTERS', 'CHAMPIONSHIP'].map((cat) => (
                    <button
                      key={cat}
                      className={`cat-chip ${highlightCategory === cat ? 'active' : ''}`}
                      onClick={() => setHighlightCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Multi-Select Compound Filters */}
              <div className="tcp-dropdowns-row">
                <div className="tcp-select-group">
                  <label>MATCH TYPE</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="tcp-select"
                  >
                    <option value="ALL">All Types</option>
                    <option value="SOLO">Solo Operations</option>
                    <option value="DUO">Duo Recon</option>
                    <option value="SQUAD">Squad Battle</option>
                  </select>
                </div>

                <div className="tcp-select-group">
                  <label>STATUS</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="tcp-select"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="OPEN">Open Entry</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>

                <div className="tcp-select-group">
                  <label>BOUNTY AMOUNT</label>
                  <select
                    value={filterAmount}
                    onChange={(e) => setFilterAmount(e.target.value)}
                    className="tcp-select"
                  >
                    <option value="ALL">Any Amount</option>
                    <option value="LOW">&lt; 50,000 Credits</option>
                    <option value="MID">50k - 100k Credits</option>
                    <option value="HIGH">&gt; 100,000 Credits</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Action Buttons */}
              <div className="tcp-dynamic-actions">
                <button className="ref-pill-btn active" onClick={handleAddFictionalItem}>
                  + ADD FICTIONAL ITEM
                </button>
                <span className="tcp-matches-count">
                  SHOWING <strong>{filteredMatches.length}</strong> OF {matches.length} MATCHES
                </span>
              </div>

              {/* Storage Telemetry Banner (Session Storage + Local Storage Indicators) */}
              <div className="storage-monitor-box">
                <div className="smb-header">
                  <span className="smb-dot" />
                  <span>CLIENT STORAGE TELEMETRY</span>
                </div>
                <div className="smb-content">
                  <div className="smb-line">
                    <span className="smb-label">SESSION STORAGE:</span>
                    <span className="smb-val">
                      {sessionAppData ? `${sessionAppData.matchCode} (${sessionAppData.scheduledTime})` : 'No active session'}
                    </span>
                  </div>
                  <div className="smb-line">
                    <span className="smb-label">LOCAL STORAGE:</span>
                    <span className="smb-val">
                      {localAppData.length} saved tournament applications
                    </span>
                  </div>
                </div>
              </div>

              {/* Match List Cards */}
              <div className="tcp-records-list">
                {isLoading && (
                  <div className="tcp-loading-state">
                    <div className="radar-spinner-mini" />
                    <span>PERFORMING ASYNC AJAX FETCH...</span>
                  </div>
                )}

                {hasError && (
                  <div className="tcp-error-state">
                    <span className="error-icon">⚠</span>
                    <p>Failed to retrieve tournament records.</p>
                    <button className="ref-pill-btn active" onClick={loadTournaments}>
                      TRIGGER RETRY PATH
                    </button>
                  </div>
                )}

                {!isLoading && !hasError && filteredMatches.map((m) => {
                  const isSelected = selectedMatch && selectedMatch.id === m.id;
                  return (
                    <div
                      key={m.id}
                      data-id={m.id}
                      data-code={m.match_code}
                      data-category={m.category}
                      data-status={m.status}
                      className={`tourney-record-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedMatch(m);
                        setHasFetchedApplicants(false);
                      }}
                    >
                      <div className="trc-left">
                        <span className={`trc-status-dot ${m.status.toLowerCase()}`} />
                        <div>
                          <div className="trc-code">{m.match_code}</div>
                          <div className="trc-title">{m.title}</div>
                          <div className="trc-sub">
                            {m.category} &bull; {m.match_type} &bull; ⏰ {m.scheduled_time || '2026-10-18 18:00 UTC'}
                          </div>
                        </div>
                      </div>

                      <div className="trc-right">
                        <span className="trc-bounty">
                          {Number(m.prize_amount).toLocaleString()} CR
                        </span>
                        <button
                          className="trc-remove-btn"
                          onClick={(e) => handleRemoveItem(m.id, e)}
                          title="Remove item from match center"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>

            {/* RIGHT INSPECTION & MATCH DETAIL PANEL */}
            <section className="tourney-detail-view">
              {selectedMatch ? (
                <div className="tdv-card">
                  <div className="tdv-top-banner">
                    <span className="tdv-tag">INSPECTING RECORD // {selectedMatch.match_code}</span>
                    <span className={`tdv-status-badge ${selectedMatch.status.toLowerCase()}`}>
                      {selectedMatch.status}
                    </span>
                  </div>

                  <h1 className="tdv-match-title">{selectedMatch.title}</h1>

                  <div className="tdv-metrics-grid">
                    <div className="tdv-metric-box">
                      <span className="tmb-label">CHAMPIONSHIP BOUNTY</span>
                      <span className="tmb-val gold">
                        {Number(selectedMatch.prize_amount).toLocaleString()} CREDITS
                      </span>
                    </div>
                    <div className="tdv-metric-box">
                      <span className="tmb-label">SCHEDULED START TIME</span>
                      <span className="tmb-val">
                        ⏰ {selectedMatch.scheduled_time || '2026-10-18 18:00 UTC'}
                      </span>
                    </div>
                    <div className="tdv-metric-box">
                      <span className="tmb-label">CATEGORY & DISCIPLINE</span>
                      <span className="tmb-val">
                        {selectedMatch.category} // {selectedMatch.match_type}
                      </span>
                    </div>
                    <div className="tdv-metric-box">
                      <span className="tmb-label">REGISTERED OPERATIVES</span>
                      <span className="tmb-val">
                        {selectedMatch.registered_count} / {selectedMatch.max_players} CADETS
                      </span>
                    </div>
                  </div>

                  {/* Primary Application & Play Actions */}
                  <div className="tdv-launch-actions">
                    <button
                      className="tdv-apply-btn"
                      onClick={() => handleApplyTournament(selectedMatch)}
                      title="Apply and store in Session Storage, Local Storage and MySQL"
                    >
                      📝 APPLY FOR TOURNAMENT (SESSION & LOCAL STORAGE)
                    </button>

                    <button
                      className="tdv-play-btn"
                      onClick={() => handleStartGame(selectedMatch)}
                    >
                      ▶ START GAME IN SECTOR 07
                    </button>

                    <button
                      className="tdv-fetch-btn"
                      onClick={() => handleFetchApplicants(selectedMatch.id)}
                      disabled={isLoadingApplicants}
                    >
                      {isLoadingApplicants ? 'FETCHING APPLICANTS...' : '👥 FETCH DATA (APPLIED PLAYERS)'}
                    </button>
                  </div>

                  {/* Applied Players Section (Fetched via "FETCH DATA BUTTON") */}
                  {hasFetchedApplicants && (
                    <div className="tdv-applicants-block">
                      <div className="tab-header">
                        <span className="tab-title">APPLIED OPERATIVES FOR {selectedMatch.match_code} ({applicants.length})</span>
                        <span className="tab-time-pill">SCHEDULED: {selectedMatch.scheduled_time || '2026-10-18 18:00 UTC'}</span>
                      </div>

                      {applicants.length > 0 ? (
                        <div className="tab-cards-row">
                          {applicants.map((app) => (
                            <div key={app.id} className="applicant-item-card">
                              <span className="aic-dot" />
                              <div className="aic-info">
                                <span className="aic-name">{app.display_name || app.username}</span>
                                <span className="aic-handle">@{app.username} &bull; ⏰ {app.scheduled_time}</span>
                              </div>
                              <span className="aic-status-tag">{app.status}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="muted text-sm py-2">No operatives registered yet. Click 'APPLY FOR TOURNAMENT' to register your callsign.</p>
                      )}
                    </div>
                  )}

                  {/* Historical participating Operatives */}
                  <div className="tdv-historical-section">
                    <h3 className="tdv-hist-title">CADET ROSTER QUICK LINKS</h3>
                    <div className="tdv-roster-chips">
                      {['dharnidharan', 'ghost_recon', 'spartan_117', 'valkyrie', 'shadow_hunter', 'jdramkrish'].map((cname) => (
                        <div
                          key={cname}
                          className="cadet-chip"
                          onClick={() => {
                            setActiveTab('PROFILE');
                            const matchIdMap = { dharnidharan: 1, ghost_recon: 2, spartan_117: 3, valkyrie: 4, shadow_hunter: 5, jdramkrish: 9 };
                            setSearchParams({ tab: 'profile', userId: matchIdMap[cname] || 1 });
                          }}
                          title="View cadet history profile"
                        >
                          <span className="cadet-dot" />
                          <span className="cadet-name">@{cname}</span>
                          <span className="cadet-arrow">↗</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="tdv-empty-notice">
                  <h3>NO MATCH SELECTED</h3>
                  <p>Select any tournament record from the left registry to inspect parameters.</p>
                </div>
              )}
            </section>
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

        {/* TAB 3: ADMIN DASHBOARD (Manage Players CRUD & Tournament Management) */}
        {activeTab === 'ADMIN' && (
          <div className="admin-workspace">
            <div className="admin-header-row">
              <div>
                <span className="admin-tag">COMMAND OVERRIDE</span>
                <h1 className="admin-title">VANGUARD ADMIN CONTROL DASHBOARD</h1>
              </div>
              <button className="ref-pill-btn" onClick={loadAdminUsers} disabled={isLoadingAdmin}>
                ↻ REFRESH ADMIN DATA
              </button>
            </div>

            {/* Admin Grid: Left Operatives CRUD + Right Tournament Management */}
            <div className="admin-split-grid">
              {/* Operatives Management Panel */}
              <div className="admin-card">
                <div className="ac-header">
                  <h3>OPERATIVES MANAGEMENT (CRUD)</h3>
                  <span className="ac-counter">{adminUsers.length} OPERATIVES</span>
                </div>

                {/* Edit Operative Dialog */}
                {editingUser && (
                  <form className="admin-edit-form" onSubmit={handleAdminUpdateUser}>
                    <h4>EDIT OPERATIVE #{editingUser.id} (@{editingUser.username})</h4>
                    <div className="aef-fields">
                      <input
                        type="text"
                        placeholder="Display Name"
                        value={editingUser.displayName}
                        onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })}
                        required
                      />
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={editingUser.email}
                        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                        required
                      />
                      <select
                        value={editingUser.role}
                        onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                      >
                        <option value="ROLE_USER">ROLE_USER</option>
                        <option value="ROLE_ADMIN">ROLE_ADMIN</option>
                      </select>
                    </div>
                    <div className="aef-actions">
                      <button type="submit" className="ref-pill-btn active">SAVE UPDATE</button>
                      <button type="button" className="ref-pill-btn" onClick={() => setEditingUser(null)}>CANCEL</button>
                    </div>
                  </form>
                )}

                {/* Create Operative Form */}
                <form className="admin-create-form" onSubmit={handleAdminCreateUser}>
                  <h4>+ COMMISSION NEW OPERATIVE CADET</h4>
                  <div className="acf-row">
                    <input
                      type="text"
                      placeholder="Callsign (Username)"
                      value={newOperative.username}
                      onChange={(e) => setNewOperative({ ...newOperative, username: e.target.value })}
                      required
                    />
                    <input
                      type="email"
                      placeholder="Telemetry Email"
                      value={newOperative.email}
                      onChange={(e) => setNewOperative({ ...newOperative, email: e.target.value })}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Display Name"
                      value={newOperative.displayName}
                      onChange={(e) => setNewOperative({ ...newOperative, displayName: e.target.value })}
                    />
                    <select
                      value={newOperative.role}
                      onChange={(e) => setNewOperative({ ...newOperative, role: e.target.value })}
                    >
                      <option value="ROLE_USER">ROLE_USER</option>
                      <option value="ROLE_ADMIN">ROLE_ADMIN</option>
                    </select>
                    <button type="submit" className="ref-pill-btn active">+ CREATE</button>
                  </div>
                </form>

                {/* Operatives Table */}
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>CALLSIGN</th>
                        <th>NAME</th>
                        <th>ROLE</th>
                        <th>BEST SCORE</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminUsers.map((u) => (
                        <tr key={u.id}>
                          <td className="mono font-bold">#{u.id}</td>
                          <td className="mono font-bold">@{u.username}</td>
                          <td>{u.displayName}</td>
                          <td>
                            <span className={`role-pill ${u.role === 'ROLE_ADMIN' ? 'admin' : 'user'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="mono gold">{Number(u.bestScore).toLocaleString()}</td>
                          <td>
                            <div className="admin-action-btns">
                              <button
                                className="act-edit-btn"
                                onClick={() => setEditingUser({ id: u.id, username: u.username, displayName: u.displayName, email: u.email, role: u.role })}
                              >
                                EDIT
                              </button>
                              {u.id !== 1 && (
                                <button
                                  className="act-del-btn"
                                  onClick={() => handleAdminDeleteUser(u.id, u.username)}
                                >
                                  DELETE
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tournament Management Panel */}
              <div className="admin-card">
                <div className="ac-header">
                  <h3>TOURNAMENT MANAGEMENT (ADD & DELETE)</h3>
                  <span className="ac-counter">{matches.length} MATCHES</span>
                </div>

                {/* Create Tournament Form */}
                <form className="admin-create-form" onSubmit={handleAdminCreateTournament}>
                  <h4>+ COMMISSION NEW TOURNAMENT MATCH</h4>
                  <div className="acf-grid">
                    <input
                      type="text"
                      placeholder="Match Code (e.g. TM-109)"
                      value={newTournament.match_code}
                      onChange={(e) => setNewTournament({ ...newTournament, match_code: e.target.value })}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Match Title"
                      value={newTournament.title}
                      onChange={(e) => setNewTournament({ ...newTournament, title: e.target.value })}
                      required
                    />
                    <select
                      value={newTournament.category}
                      onChange={(e) => setNewTournament({ ...newTournament, category: e.target.value })}
                    >
                      <option value="TACTICAL">TACTICAL</option>
                      <option value="ELITE">ELITE</option>
                      <option value="MASTERS">MASTERS</option>
                      <option value="CHAMPIONSHIP">CHAMPIONSHIP</option>
                    </select>
                    <select
                      value={newTournament.match_type}
                      onChange={(e) => setNewTournament({ ...newTournament, match_type: e.target.value })}
                    >
                      <option value="SOLO">SOLO</option>
                      <option value="DUO">DUO</option>
                      <option value="SQUAD">SQUAD</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Prize Amount"
                      value={newTournament.prize_amount}
                      onChange={(e) => setNewTournament({ ...newTournament, prize_amount: Number(e.target.value) })}
                    />
                    <input
                      type="text"
                      placeholder="Scheduled Time (e.g. 2026-10-25 18:00 UTC)"
                      value={newTournament.scheduled_time}
                      onChange={(e) => setNewTournament({ ...newTournament, scheduled_time: e.target.value })}
                    />
                  </div>
                  <div className="acf-btn-row">
                    <button type="submit" className="ref-pill-btn active">+ COMMISSION MATCH</button>
                  </div>
                </form>

                {/* Tournaments List in Admin */}
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>CODE</th>
                        <th>TITLE</th>
                        <th>SCHEDULED TIME</th>
                        <th>BOUNTY</th>
                        <th>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matches.map((m) => (
                        <tr key={m.id}>
                          <td className="mono font-bold">{m.match_code}</td>
                          <td>{m.title}</td>
                          <td className="mono">⏰ {m.scheduled_time || '2026-10-18 18:00 UTC'}</td>
                          <td className="mono gold">{Number(m.prize_amount).toLocaleString()} CR</td>
                          <td>
                            <button
                              className="act-del-btn"
                              onClick={() => handleAdminDeleteTournament(m.id, m.match_code)}
                            >
                              DELETE
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
