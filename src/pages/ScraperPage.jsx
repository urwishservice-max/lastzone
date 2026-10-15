import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ScraperPage() {
  const navigate = useNavigate();
  const [targetUrl, setTargetUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const sampleLinks = [
    { label: 'Dharanidharan (Admin)', url: `${window.location.origin}/tournaments?tab=profile&userId=1` },
    { label: 'Ghost Recon (Master Chief)', url: `${window.location.origin}/tournaments?tab=profile&userId=2` },
    { label: 'Spartan 117', url: `${window.location.origin}/tournaments?tab=profile&userId=3` },
    { label: 'Sarah Connor (Valkyrie)', url: `${window.location.origin}/tournaments?tab=profile&userId=4` }
  ];

  const handleScrape = async (urlToScrape) => {
    const url = urlToScrape || targetUrl;
    if (!url.trim()) return;

    setIsScraping(true);
    setErrorMsg(null);
    setScrapeResult(null);

    try {
      const res = await fetch('/api/analyzer/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setScrapeResult(data);
      } else {
        setErrorMsg(data.message || 'Scrape operation failed.');
      }
    } catch {
      setErrorMsg('Network error communicating with analyzer endpoint.');
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div className="clean-minimal-page scraper-page-wrap">
      {/* Precision Top Header */}
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
            <span className="ref-sb-code">OPERATIVE PROFILE SCRAPER // CHAPTER 14</span>
            <p className="ref-sb-desc">
              PASTE ANY OPERATIVE PROFILE SHARE LINK TO SCRAPE COMBAT TELEMETRY, RUNS & WEAPONS
            </p>
          </div>
        </div>

        <div className="ref-top-right">
          <button className="ref-pill-btn" onClick={() => navigate('/tournaments')}>
            TOURNAMENTS
          </button>
          <button className="ref-pill-btn" onClick={() => navigate('/leaderboard')}>
            LEADERBOARD
          </button>
          <button className="ref-pill-btn active" onClick={() => navigate('/play')}>
            COMMENCE RUN
          </button>
        </div>
      </header>

      {/* Main Scraper Workspace */}
      <main className="scraper-workspace">
        <div className="scraper-card">
          <div className="sc-header">
            <span className="sc-tag">AUTOMATED METADATA SCRAPER</span>
            <h1 className="sc-title">SCRAPE OPERATIVE PROFILE BY URL</h1>
            <p className="sc-desc">
              Every cadet profile in LastZone generates an individual shareable telemetry link. Paste any operative profile link below (or click a quick link) to extract combat ratings, missions logged, confirmed kills, and equipped armaments.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="sc-sample-row">
            <span className="sc-sample-label">QUICK SAMPLE PROFILE LINKS:</span>
            <div className="sc-sample-chips">
              {sampleLinks.map((s, idx) => (
                <button
                  key={idx}
                  className="sc-sample-chip"
                  onClick={() => {
                    setTargetUrl(s.url);
                    handleScrape(s.url);
                  }}
                >
                  🔗 {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search URL Input */}
          <form
            className="sc-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleScrape();
            }}
          >
            <input
              type="url"
              className="sc-url-input"
              placeholder="PASTE PROFILE LINK E.G. http://.../tournaments?tab=profile&userId=1"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              required
            />
            <button type="submit" className="sc-scrape-btn" disabled={isScraping}>
              {isScraping ? 'SCRAPING DOM...' : '🔍 SCRAPE PLAYER DETAILS'}
            </button>
          </form>

          {errorMsg && (
            <div className="sc-error-banner">
              <span>⚠ {errorMsg}</span>
            </div>
          )}

          {/* Scraped Results Display */}
          {scrapeResult && (
            <div className="sc-result-box">
              <div className="srb-top">
                <span className="srb-tag">EXTRACTION SUCCESS // {scrapeResult.sourceType}</span>
                <span className="srb-time">{scrapeResult.scrapedAt}</span>
              </div>

              {scrapeResult.metadata && (
                <div className="srb-grid">
                  <div className="srb-profile-header">
                    <div className="srb-avatar">
                      {scrapeResult.metadata.callsign?.replace('@', '').slice(0, 2).toUpperCase() || 'OP'}
                    </div>
                    <div>
                      <h2 className="srb-name">{scrapeResult.metadata.title}</h2>
                      <span className="srb-callsign">{scrapeResult.metadata.callsign} &bull; {scrapeResult.metadata.email}</span>
                      <span className="srb-role-pill">{scrapeResult.metadata.role}</span>
                    </div>
                  </div>

                  {/* Scraped Telemetry Cards */}
                  <div className="srb-stats-row">
                    <div className="srb-stat-card">
                      <span className="srb-stat-lbl">COMBAT SCORE</span>
                      <span className="srb-stat-val gold">{Number(scrapeResult.metadata.combatScore || 0).toLocaleString()}</span>
                    </div>
                    <div className="srb-stat-card">
                      <span className="srb-stat-lbl">CONFIRMED KILLS</span>
                      <span className="srb-stat-val">{scrapeResult.metadata.confirmedKills || 0}</span>
                    </div>
                    <div className="srb-stat-card">
                      <span className="srb-stat-lbl">MAX SURVIVED WAVE</span>
                      <span className="srb-stat-val">WAVE {scrapeResult.metadata.maxWave || 0}</span>
                    </div>
                    <div className="srb-stat-card">
                      <span className="srb-stat-lbl">MISSIONS LOGGED</span>
                      <span className="srb-stat-val">{scrapeResult.metadata.missionsLogged || 0} RUNS</span>
                    </div>
                  </div>

                  {/* Equipped Weapons from Scraped Profile */}
                  <div className="srb-weapons-box">
                    <span className="srb-sec-title">SCRAPED REQUISITIONED ARMAMENTS:</span>
                    <div className="srb-weap-chips">
                      {scrapeResult.metadata.equippedWeapons && scrapeResult.metadata.equippedWeapons.length > 0 ? (
                        scrapeResult.metadata.equippedWeapons.map((w, i) => (
                          <span key={i} className="srb-weap-chip">⚔ {w}</span>
                        ))
                      ) : (
                        <span className="muted text-xs">Standard Vanguard Issue Pistol</span>
                      )}
                    </div>
                  </div>

                  {/* Raw Telemetry Summary */}
                  <div className="srb-summary-quote">
                    <p>{scrapeResult.telemetrySummary || scrapeResult.metadata.description}</p>
                    <span className="srb-url-echo">TARGET URL: {scrapeResult.url}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
