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

              {/* Storage Telemetry Banner (Session Storage + Local Storage Indicators with Fetch Buttons) */}
              <div className="storage-monitor-box">
                <div className="smb-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="smb-dot" />
                    <span>CLIENT STORAGE TELEMETRY // SESSION & LOCAL</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="ref-pill-btn"
                      style={{ fontSize: '11px', padding: '4px 10px', height: 'auto', background: '#18181b', color: '#60a5fa', borderColor: '#3b82f6' }}
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
                            // After refresh or before applying, it is completely EMPTY. Nothing will be printed!
                            setSessionAppData(null);
                            notify('SESSION STORAGE IS EMPTY: Nothing stored (vanished after refresh).', 'info');
                          }
                        } catch (err) {
                          console.error(err);
                          setSessionAppData(null);
                          notify('Error reading Session Storage.', 'error');
                        }
                      }}
                      title="Fetch current Session Storage record (Empty after page refresh)"
                    >
                      ⚡ FETCH SESSION STORAGE
                    </button>
                    <button
                      type="button"
                      className="ref-pill-btn"
                      style={{ fontSize: '11px', padding: '4px 10px', height: 'auto', background: '#18181b', color: '#34d399', borderColor: '#10b981' }}
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
                </div>
                <div className="smb-content">
                  <div className="smb-line" style={{ alignItems: 'flex-start' }}>
                    <span className="smb-label" style={{ minWidth: '190px' }}>SESSION STORAGE (VOLATILE):</span>
                    <div className="smb-val" style={{ flex: 1, color: (hasFetchedSession && sessionAppData) ? '#60a5fa' : '#71717a' }}>
                      {hasFetchedSession ? (
                        sessionAppData ? (
                          <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '8px 12px', borderRadius: '4px', marginTop: '2px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 'bold', color: '#93c5fd' }}>
                                OPERATIVE: @{sessionAppData.applicantUser} &bull; MATCH: {sessionAppData.matchCode} ({sessionAppData.title})
                              </span>
                              <span style={{ fontSize: '11px', color: '#f87171', fontWeight: 600 }}>
                                ⚠ TRANSIENT: DISAPPEARS ON REFRESH
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>
                              <span>CATEGORY: {sessionAppData.category}</span> &bull; 
                              <span style={{ marginLeft: '6px' }}>SCHEDULED: ⏰ {sessionAppData.scheduledTime}</span> &bull; 
                              <span style={{ marginLeft: '6px' }}>BOUNTY: {Number(sessionAppData.prizeAmount).toLocaleString()} CR</span>
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#f87171', fontStyle: 'italic' }}>
                            [Session storage is empty. Apply for a match first or it expired on refresh.]
                          </span>
                        )
                      ) : (
                        <span style={{ fontStyle: 'italic', color: '#71717a' }}>
                          (Details hidden until you click "⚡ FETCH SESSION STORAGE". On page refresh, it disappears.)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="smb-line" style={{ alignItems: 'flex-start', marginTop: '10px' }}>
                    <span className="smb-label" style={{ minWidth: '190px' }}>LOCAL STORAGE (ALWAYS PRESENT):</span>
                    <div className="smb-val" style={{ flex: 1, color: (hasFetchedLocal && localAppData.length > 0) ? '#34d399' : '#71717a' }}>
                      {hasFetchedLocal ? (
                        localAppData.length > 0 ? (
                          <div>
                            <div style={{ marginBottom: '6px', fontWeight: 'bold', color: '#6ee7b7' }}>
                              {localAppData.length} PERSISTENT APPLICATION RECORDS (ALWAYS PRESERVED ACROSS REFRESHES):
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {localAppData.map((app, i) => (
                                <div
                                  key={i}
                                  style={{
                                    background: '#141417',
                                    border: '1px solid #27272a',
                                    padding: '4px 8px',
                                    fontSize: '11px',
                                    borderRadius: '3px'
                                  }}
                                >
                                  <span style={{ color: '#34d399', fontWeight: 600 }}>{app.matchCode}</span> &bull; 
                                  <span style={{ color: '#e4e4e7', marginLeft: '4px' }}>@{app.applicantUser}</span> &bull; 
                                  <span style={{ color: '#a1a1aa', marginLeft: '4px' }}>⏰ {app.scheduledTime}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#f87171', fontStyle: 'italic' }}>No persistent records found in Local Storage.</span>
                        )
                      ) : (
                        <span style={{ fontStyle: 'italic', color: '#71717a' }}>
                          (Details hidden until you click "💾 FETCH LOCAL STORAGE". Always preserved across reloads.)
                        </span>
                      )}
                    </div>
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

              {/* Assignment VIII: Competitor Games & Web Scraper Application */}
              <div className="admin-card" style={{ gridColumn: '1 / -1' }}>
                <div className="ac-header">
                  <div>
                    <span className="role-pill admin" style={{ marginRight: '8px' }}>ASSIGNMENT VIII</span>
                    <h3 style={{ display: 'inline' }}>COMPETITOR WEB SCRAPER & DOM ANALYZER</h3>
                  </div>
                  <span className="ac-counter">15-POINT DOM EXTRACTION SPEC</span>
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
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
