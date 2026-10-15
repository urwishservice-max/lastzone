import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(isoString) {
  if (!isoString) return '--';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return '--';
  }
}

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [leaderboard, setLeaderboard] = useState([]);
  const [personalBest, setPersonalBest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Clock in clean typographic style matching reference
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const mins = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const formattedHours = hours.toString().padStart(2, '0');
      setCurrentTime(`${formattedHours}${mins}${ampm}`);

      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const mStr = months[now.getMonth()];
      const yStr = now.getFullYear();
      const dName = days[now.getDay()];
      const dNum = now.getDate();
      setCurrentDate({ monthYear: `${mStr}${yStr}`, dayWeek: `${dName}${dNum}` });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchLeaderboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const lbRes = await fetch('/api/leaderboard?limit=50');
      if (!lbRes.ok) throw new Error(`HTTP ${lbRes.status}`);
      const lbData = await lbRes.json();
      setLeaderboard(lbData);

      const token = localStorage.getItem('lastzone_token');
      if (token) {
        try {
          const pbRes = await fetch('/api/leaderboard/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (pbRes.ok && pbRes.status === 200) {
            const pbData = await pbRes.json();
            setPersonalBest(pbData);
          } else {
            setPersonalBest(null);
          }
        } catch {
          setPersonalBest(null);
        }
      }
    } catch (err) {
      setError(err.message || 'Error querying records.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboardData();
  }, [fetchLeaderboardData]);

  const filteredLeaderboard = leaderboard.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (item.username && item.username.toLowerCase().includes(q)) ||
      (item.displayName && item.displayName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="clean-minimal-page">
      {/* Top Precision Toolbar */}
      <nav className="minimal-top-bar">
        <div className="top-bar-left">
          <button className="minimal-link-btn" onClick={() => navigate('/')}>
            ← BASE
          </button>
          <span className="bar-separator">/</span>
          <span className="minimal-status-tag">RANKED TELEMETRY</span>
        </div>

        <div className="top-bar-center">
          <div className="minimal-search-pill">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="SEARCH OPERATIVE..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="minimal-search-input"
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                ×
              </button>
            )}
          </div>
        </div>

        <div className="top-bar-right">
          <button className="minimal-action-btn" onClick={() => navigate('/friends')} title="Open Squad Network Tree">
            ⎔ SQUAD NETWORK
          </button>
          <button className="minimal-action-btn" onClick={fetchLeaderboardData} disabled={isLoading}>
            {isLoading ? 'SYNCING...' : '↻ SYNC'}
          </button>
          <button className="minimal-play-btn" onClick={() => navigate('/play')}>
            ▶ PLAY
          </button>
        </div>
      </nav>

      {/* Main Content Layout */}
      <main className="minimal-layout">
        {/* Left Typographic Header inspired by reference */}
        <section className="minimal-hero-section">
          <div className="typo-clock-block">
            <div className="clock-sub-indicator">
              <span className="dot-red" />
              <span className="temp-tag">15° NORMAL</span>
            </div>
            <div className="clock-large">
              {currentTime.slice(0, 4)}
              <span className="clock-ampm">{currentTime.slice(4)}</span>
            </div>
            <div className="calendar-grid">
              <span className="cal-line">{currentDate.monthYear || 'OCT2026'}</span>
              <span className="cal-day">{currentDate.dayWeek || 'THU15'}</span>
            </div>
          </div>

          <div className="minimal-lead-text">
            <h1 className="minimal-main-title">LASTZONE LEADERBOARD</h1>
            <p className="minimal-lead-desc">
              Deterministic combat rankings recorded across all operational sessions. Evaluated on score velocity,
              eliminations, and survival endurance.
            </p>
          </div>
        </section>

        {/* Active Operative Quick Dossier Strip */}
        {isAuthenticated && personalBest && (
          <section className="minimal-dossier-card">
            <div className="dossier-head">
              <div className="dossier-name-group">
                <span className="dossier-kicker">ACTIVE OPERATIVE</span>
                <span className="dossier-callsign">{user?.displayName || user?.username}</span>
                <span className="dossier-handle">@{user?.username}</span>
              </div>
              <div className="dossier-rank-box">
                <span className="dossier-rank-label">RANK</span>
                <span className="dossier-rank-value">#{personalBest.rank}</span>
              </div>
            </div>

            <div className="dossier-metrics-row">
              <div className="metric-unit">
                <span className="m-label">SCORE</span>
                <span className="m-val highlight">{personalBest.score.toLocaleString()}</span>
              </div>
              <div className="metric-unit">
                <span className="m-label">KILLS</span>
                <span className="m-val">{personalBest.kills}</span>
              </div>
              <div className="metric-unit">
                <span className="m-label">WAVE</span>
                <span className="m-val">W{personalBest.wave}</span>
              </div>
              <div className="metric-unit">
                <span className="m-label">DURATION</span>
                <span className="m-val font-mono">{formatDuration(personalBest.survivalDuration)}</span>
              </div>
              <div className="metric-unit">
                <span className="m-label">RECORDED</span>
                <span className="m-val font-mono">{formatDate(personalBest.completedAt)}</span>
              </div>
            </div>
          </section>
        )}

        {/* Clean, Image-Free Data Table */}
        <section className="minimal-table-container">
          <div className="table-meta-bar">
            <span className="meta-count">{filteredLeaderboard.length} OPERATIVES RECORDED</span>
            <span className="meta-system">REAL-TIME MYSQL ARCHIVE</span>
          </div>

          {error && <div className="minimal-error-box">{error}</div>}

          {isLoading && filteredLeaderboard.length === 0 ? (
            <div className="minimal-loading">QUERYING ARCHIVE...</div>
          ) : filteredLeaderboard.length === 0 ? (
            <div className="minimal-empty">NO ENTRIES FOUND</div>
          ) : (
            <div className="table-scroll-wrapper">
              <table className="minimal-data-table">
                <thead>
                  <tr>
                    <th className="col-rank">RANK</th>
                    <th className="col-op">OPERATIVE</th>
                    <th className="col-num">SCORE</th>
                    <th className="col-num">KILLS</th>
                    <th className="col-num">WAVE</th>
                    <th className="col-time">TIME</th>
                    <th className="col-date">DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaderboard.map((entry) => {
                    const isSelf = user && user.username === entry.username;
                    return (
                      <tr key={`${entry.runId}-${entry.rank}`} className={isSelf ? 'row-self' : ''}>
                        <td className="col-rank">
                          <span className={`rank-tag rank-${entry.rank <= 3 ? entry.rank : 'default'}`}>
                            #{entry.rank}
                          </span>
                        </td>
                        <td className="col-op">
                          <div className="operative-cell">
                            <span className="op-title">{entry.displayName || entry.username}</span>
                            <span className="op-sub">@{entry.username}</span>
                            {isSelf && <span className="self-badge">YOU</span>}
                          </div>
                        </td>
                        <td className="col-num font-mono bold">{entry.score.toLocaleString()}</td>
                        <td className="col-num font-mono">{entry.kills}</td>
                        <td className="col-num font-mono">W{entry.wave}</td>
                        <td className="col-time font-mono">{formatDuration(entry.survivalDuration)}</td>
                        <td className="col-date font-mono">{formatDate(entry.completedAt || entry.playedAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Minimal Footer */}
        <footer className="minimal-footer">
          <span>COIMBATORE INSTITUTE OF TECHNOLOGY // 23IT721 FULL STACK DEVELOPMENT</span>
          <span>LASTZONE PLATFORM</span>
        </footer>
      </main>
    </div>
  );
}
