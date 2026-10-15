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

              {/* Competitor / Public Web Page Analysis (Assignment VIII Specification) */}
              {scrapeResult.analysis && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #27272a', paddingBottom: '8px' }}>
                    <span className="mono" style={{ color: '#4ade80', fontSize: '13px', fontWeight: 'bold' }}>
                      ✓ HTTP {scrapeResult.httpStatus} // RAW HTML SIZE: {scrapeResult.analysis.pageSizeKB} KB ({scrapeResult.analysis.pageSizeBytes} bytes)
                    </span>
                    <span className="mono text-xs" style={{ color: '#71717a' }}>CHARSET: {scrapeResult.analysis.charset} &bull; LANG: {scrapeResult.analysis.language}</span>
                  </div>

                  {/* 15 Specification Points Table */}
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
                          <td style={{ color: '#fbbf24', fontWeight: 600 }}>{scrapeResult.analysis.title || 'Untitled Document'}</td>
                        </tr>
                        <tr>
                          <td className="mono font-bold">META DESCRIPTION</td>
                          <td>{scrapeResult.analysis.metaDescription || '<span class="muted">[Empty or not declared]</span>'}</td>
                        </tr>
                        <tr>
                          <td className="mono font-bold">META KEYWORDS</td>
                          <td>{scrapeResult.analysis.metaKeywords || '<span class="muted">[Not declared]</span>'}</td>
                        </tr>
                        <tr>
                          <td className="mono font-bold">BODY TEXT WORD COUNT</td>
                          <td className="mono font-bold" style={{ color: '#38bdf8' }}>
                            {Number(scrapeResult.analysis.wordCount).toLocaleString()} words (stripped HTML text)
                          </td>
                        </tr>
                        <tr>
                          <td className="mono font-bold">CANONICAL URL</td>
                          <td className="mono">{scrapeResult.analysis.canonicalUrl || 'None specified'}</td>
                        </tr>
                        <tr>
                          <td className="mono font-bold">FAVICON URL</td>
                          <td className="mono">{scrapeResult.analysis.faviconUrl || 'Default icon'}</td>
                        </tr>
                        <tr>
                          <td className="mono font-bold">OPEN GRAPH TAGS</td>
                          <td>
                            <div><strong>og:title:</strong> {scrapeResult.analysis.openGraph.title || 'N/A'}</div>
                            <div><strong>og:description:</strong> {scrapeResult.analysis.openGraph.description || 'N/A'}</div>
                            <div><strong>og:image:</strong> {scrapeResult.analysis.openGraph.image || 'N/A'}</div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Headings Breakdown */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                    <div style={{ background: '#121214', border: '1px solid #27272a', padding: '12px' }}>
                      <span className="mono text-xs font-bold" style={{ color: '#e4e4e7' }}>
                        H1 HEADINGS ({scrapeResult.analysis.headingsCounts.h1})
                      </span>
                      <ul style={{ margin: '8px 0 0', paddingLeft: '18px', fontSize: '12px', color: '#a1a1aa' }}>
                        {scrapeResult.analysis.headings.h1.length > 0 ? (
                          scrapeResult.analysis.headings.h1.map((h, i) => <li key={i}>{h}</li>)
                        ) : (
                          <li className="muted">No H1 tags found</li>
                        )}
                      </ul>
                    </div>

                    <div style={{ background: '#121214', border: '1px solid #27272a', padding: '12px' }}>
                      <span className="mono text-xs font-bold" style={{ color: '#e4e4e7' }}>
                        H2 HEADINGS ({scrapeResult.analysis.headingsCounts.h2})
                      </span>
                      <ul style={{ margin: '8px 0 0', paddingLeft: '18px', fontSize: '12px', color: '#a1a1aa', maxHeight: '140px', overflowY: 'auto' }}>
                        {scrapeResult.analysis.headings.h2.length > 0 ? (
                          scrapeResult.analysis.headings.h2.map((h, i) => <li key={i}>{h}</li>)
                        ) : (
                          <li className="muted">No H2 tags found</li>
                        )}
                      </ul>
                    </div>

                    <div style={{ background: '#121214', border: '1px solid #27272a', padding: '12px' }}>
                      <span className="mono text-xs font-bold" style={{ color: '#e4e4e7' }}>
                        H3 HEADINGS ({scrapeResult.analysis.headingsCounts.h3})
                      </span>
                      <ul style={{ margin: '8px 0 0', paddingLeft: '18px', fontSize: '12px', color: '#a1a1aa', maxHeight: '140px', overflowY: 'auto' }}>
                        {scrapeResult.analysis.headings.h3.length > 0 ? (
                          scrapeResult.analysis.headings.h3.map((h, i) => <li key={i}>{h}</li>)
                        ) : (
                          <li className="muted">No H3 tags found</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Hyperlinks Internal vs External */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                    <div style={{ background: '#121214', border: '1px solid #27272a', padding: '12px' }}>
                      <span className="mono text-xs font-bold" style={{ color: '#34d399' }}>
                        INTERNAL LINKS ({scrapeResult.analysis.linksSummary.internal})
                      </span>
                      <div style={{ maxHeight: '180px', overflowY: 'auto', fontSize: '11px', marginTop: '6px' }}>
                        {scrapeResult.analysis.internalLinks.map((l, i) => (
                          <div key={i} style={{ padding: '3px 0', borderBottom: '1px solid #1f1f23', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <span style={{ color: '#e4e4e7' }}>{l.text}</span> &rarr; <span className="mono" style={{ color: '#71717a' }}>{l.href}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ background: '#121214', border: '1px solid #27272a', padding: '12px' }}>
                      <span className="mono text-xs font-bold" style={{ color: '#f87171' }}>
                        EXTERNAL LINKS ({scrapeResult.analysis.linksSummary.external})
                      </span>
                      <div style={{ maxHeight: '180px', overflowY: 'auto', fontSize: '11px', marginTop: '6px' }}>
                        {scrapeResult.analysis.externalLinks.map((l, i) => (
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
                        SCRIPTS ({scrapeResult.analysis.scriptsCount})
                      </span>
                      <div style={{ maxHeight: '120px', overflowY: 'auto', fontSize: '11px', marginTop: '6px' }}>
                        {scrapeResult.analysis.scripts.map((s, i) => (
                          <div key={i} className="mono" style={{ color: '#c084fc', padding: '2px 0' }}>&bull; {s}</div>
                        ))}
                      </div>
                    </div>

                    <div style={{ background: '#121214', border: '1px solid #27272a', padding: '12px' }}>
                      <span className="mono text-xs font-bold" style={{ color: '#38bdf8' }}>
                        STYLESHEETS ({scrapeResult.analysis.stylesheetsCount})
                      </span>
                      <div style={{ maxHeight: '120px', overflowY: 'auto', fontSize: '11px', marginTop: '6px' }}>
                        {scrapeResult.analysis.stylesheets.map((c, i) => (
                          <div key={i} className="mono" style={{ color: '#7dd3fc', padding: '2px 0' }}>&bull; {c}</div>
                        ))}
                      </div>
                    </div>

                    <div style={{ background: '#121214', border: '1px solid #27272a', padding: '12px' }}>
                      <span className="mono text-xs font-bold" style={{ color: '#f59e0b' }}>
                        IMAGES ({scrapeResult.analysis.imagesCount})
                      </span>
                      <div style={{ maxHeight: '120px', overflowY: 'auto', fontSize: '11px', marginTop: '6px' }}>
                        {scrapeResult.analysis.images.map((img, i) => (
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
          )}
        </div>
      </main>
    </div>
  );
}
