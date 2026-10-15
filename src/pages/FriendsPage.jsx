import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function FriendsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [allPlayers, setAllPlayers] = useState([]);
  const [networkData, setNetworkData] = useState({ connections: [], peerLinks: [] });
  const [draggedItem, setDraggedItem] = useState(null); // { type: 'ROSTER_PLAYER'|'NETWORK_NODE', data }
  const [isOverCanvasDropzone, setIsOverCanvasDropzone] = useState(false);
  const [isOverRosterDropzone, setIsOverRosterDropzone] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);

  const notify = (msg, type = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch all registered players and existing network links
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('lastzone_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [resAll, resNet] = await Promise.all([
        fetch('/api/friends/all', { headers }),
        fetch('/api/friends/network', { headers })
      ]);

      if (resAll.ok) {
        const players = await resAll.json();
        setAllPlayers(players);
      }

      if (resNet.ok) {
        const net = await resNet.json();
        setNetworkData(net);
      }
    } catch (err) {
      console.error('Error fetching friends network:', err);
      notify('Failed to sync network with Tactical Server', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Center Player determination
  const centerPlayer = user || {
    id: networkData.currentUserId || 9,
    displayName: 'ACTIVE OPERATIVE',
    username: 'current_user',
    role: 'VANGUARD'
  };

  const connections = networkData.connections || [];
  const peerLinks = networkData.peerLinks || [];

  // Canvas Geometry matching reference:
  // ViewBox: 840 x 620. Center at (420, 310)
  const centerX = 420;
  const centerY = 310;

  // Node Map with Organic Constellation Clusters (like the reference black sphere network)
  const nodeMap = new Map();
  nodeMap.set(Number(centerPlayer.id), {
    id: Number(centerPlayer.id),
    x: centerX,
    y: centerY,
    isCenter: true,
    radius: 20,
    displayName: centerPlayer.displayName || centerPlayer.username,
    username: centerPlayer.username
  });

  // Predefined organic constellation offsets for professional, non-circular look
  const constellationOffsets = [
    { x: -160, y: -130, r: 15 },
    { x: 170, y: -140, r: 17 },
    { x: -210, y: 30, r: 18 },
    { x: 215, y: -20, r: 14 },
    { x: -140, y: 170, r: 16 },
    { x: 70, y: 195, r: 17 },
    { x: 150, y: 110, r: 13 },
    { x: -60, y: -180, r: 14 },
    { x: 80, y: -70, r: 12 },
    { x: -80, y: 65, r: 13 },
    { x: 190, y: 160, r: 11 },
    { x: -220, y: 130, r: 12 }
  ];

  const positionedNodes = connections.map((conn, idx) => {
    const friendId = Number(conn.friendUserId || conn.friendId || conn.userId);
    const offset = constellationOffsets[idx % constellationOffsets.length];
    const x = Math.round(centerX + offset.x);
    const y = Math.round(centerY + offset.y);
    const isAccepted = conn.status === 'ACCEPTED';
    const nodeObj = {
      ...conn,
      friendId,
      x,
      y,
      radius: offset.r,
      isAccepted,
      isCenter: false
    };
    nodeMap.set(friendId, nodeObj);
    return nodeObj;
  });

  // Calculate Interconnected Mesh Lines (Peer-to-Peer between friends)
  const interPeerLines = [];
  const drawnPairs = new Set();

  peerLinks.forEach((pl) => {
    const sId = Number(pl.sourceId);
    const tId = Number(pl.targetId);
    if (sId === Number(centerPlayer.id) || tId === Number(centerPlayer.id)) return;

    const sourceNode = nodeMap.get(sId);
    const targetNode = nodeMap.get(tId);

    if (sourceNode && targetNode) {
      const pairKey = [Math.min(sId, tId), Math.max(sId, tId)].join('-');
      if (!drawnPairs.has(pairKey)) {
        drawnPairs.add(pairKey);
        interPeerLines.push({
          linkId: pl.linkId,
          x1: sourceNode.x,
          y1: sourceNode.y,
          x2: targetNode.x,
          y2: targetNode.y,
          status: pl.status,
          sourceName: sourceNode.displayName || sourceNode.username,
          targetName: targetNode.displayName || targetNode.username
        });
      }
    }
  });

  // Constellation aesthetic decorative satellite pin-dots around major nodes (matching reference image)
  const satellitePins = [];
  positionedNodes.forEach((node, i) => {
    const pinAngles = [0.4, 1.8, 3.5, 4.9];
    pinAngles.forEach((a, pinIdx) => {
      if ((i + pinIdx) % 2 === 0) {
        const d = node.radius + 18 + (pinIdx * 8);
        const px = Math.round(node.x + Math.cos(a + i) * d);
        const py = Math.round(node.y + Math.sin(a + i) * d);
        satellitePins.push({ x1: node.x, y1: node.y, px, py, isAccepted: node.isAccepted });
      }
    });
  });

  // Dragging from Roster into Canvas
  const handleRosterDragStart = (e, player) => {
    setDraggedItem({ type: 'ROSTER_PLAYER', data: player });
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'ROSTER_PLAYER', data: player }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Dragging node from Network back into Roster to remove
  const handleNodeDragStart = (e, node) => {
    setDraggedItem({ type: 'NETWORK_NODE', data: node });
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'NETWORK_NODE', data: node }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCanvasDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsOverCanvasDropzone(true);
  };

  const handleCanvasDragLeave = () => {
    setIsOverCanvasDropzone(false);
  };

  const handleCanvasDrop = async (e) => {
    e.preventDefault();
    setIsOverCanvasDropzone(false);

    let item = draggedItem;
    if (!item) {
      try {
        const raw = e.dataTransfer.getData('text/plain');
        if (raw) item = JSON.parse(raw);
      } catch {}
    }

    if (!item || item.type !== 'ROSTER_PLAYER') return;
    const player = item.data;

    // Check if already in network
    const exists = connections.some(
      (c) => c.username === player.username || c.friendId === player.id || c.userId === player.id
    );

    if (exists) {
      notify(`Operative ${player.displayName || player.username} is already present in your squad tree.`, 'info');
      setDraggedItem(null);
      return;
    }

    notify(`Transmitting network invitation packet to @${player.username}...`, 'info');

    try {
      const token = localStorage.getItem('lastzone_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers,
        body: JSON.stringify({ friendId: player.id })
      });

      const data = await res.json();
      if (res.ok) {
        notify(`Invitation dispatched to @${player.username}. Node added as PENDING (RED).`, 'success');
        loadData();
      } else {
        notify(data.message || 'Failed to dispatch network request.', 'error');
      }
    } catch {
      notify('Network communication error.', 'error');
    } finally {
      setDraggedItem(null);
    }
  };

  // Drop on Roster sidebar (Removes dragged operative from network)
  const handleRosterDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsOverRosterDropzone(true);
  };

  const handleRosterDragLeave = () => {
    setIsOverRosterDropzone(false);
  };

  const handleRosterDrop = async (e) => {
    e.preventDefault();
    setIsOverRosterDropzone(false);

    let item = draggedItem;
    if (!item) {
      try {
        const raw = e.dataTransfer.getData('text/plain');
        if (raw) item = JSON.parse(raw);
      } catch {}
    }

    if (!item || item.type !== 'NETWORK_NODE') return;
    const node = item.data;

    await handleRemoveFriend(node.friendId || node.userId, node.displayName || node.username);
    setDraggedItem(null);
  };

  // Remove / Disconnect operative from network
  const handleRemoveFriend = async (friendId, name) => {
    if (!friendId) return;
    notify(`Severing operative ${name} from tactical network...`, 'info');
    try {
      const token = localStorage.getItem('lastzone_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const res = await fetch('/api/friends/remove', {
        method: 'POST',
        headers,
        body: JSON.stringify({ friendId })
      });

      if (res.ok) {
        notify(`Operative ${name} severed from network. Returned to personnel pool.`, 'info');
        setSelectedNode(null);
        loadData();
      } else {
        const data = await res.json();
        notify(data.message || 'Failed to sever connection.', 'error');
      }
    } catch {
      notify('Error communicating with network server.', 'error');
    }
  };

  // Accept a pending invitation (turns node to BLACK in the tree)
  const handleAcceptRequest = async (friendId, username) => {
    try {
      const token = localStorage.getItem('lastzone_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const res = await fetch('/api/friends/accept', {
        method: 'POST',
        headers,
        body: JSON.stringify({ friendId })
      });

      if (res.ok) {
        notify(`Connection verified! @${username} node is now authenticated & ACTIVE (BLACK).`, 'success');
        loadData();
      }
    } catch {
      notify('Error verifying operative node.', 'error');
    }
  };

  const filteredPlayers = allPlayers.filter((p) => {
    if (p.id === centerPlayer.id) return false;
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      p.username.toLowerCase().includes(q) ||
      (p.displayName && p.displayName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="clean-minimal-page friends-page">
      {/* Precision Top Editorial Header (Matching LastZone High Command Design System) */}
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
          <button className="lz-nav-tab-btn" onClick={() => navigate('/tournaments')}>
            Tournament Center
          </button>
          <button className="lz-nav-tab-btn" onClick={() => navigate('/tournaments?tab=profile')}>
            Operative Profile
          </button>
          <button className="lz-nav-tab-btn" onClick={() => navigate('/tournaments?tab=admin')}>
            Admin Dashboard
          </button>
          <button className="lz-nav-tab-btn" onClick={() => navigate('/weapons')}>
            Weapons Requisition
          </button>
          <button className="lz-nav-tab-btn active" onClick={() => navigate('/friends')}>
            Squad Network
          </button>
          <button className="lz-nav-tab-btn" onClick={() => navigate('/leaderboard')}>
            Leaderboard
          </button>
          <button
            className="lz-action-btn lz-reload-btn"
            style={{ marginLeft: '12px' }}
            onClick={loadData}
            title="Sync Tactical Network"
          >
            ↻ SYNC
          </button>
        </div>
      </header>

      {/* Main Workspace: Left Personnel Roster + Right Pure Constellation Graph */}
      <main className="ref-workspace">
        {notification && (
          <div className={`network-banner-toast ${notification.type}`}>
            <span className="toast-dot" />
            <span>{notification.msg}</span>
          </div>
        )}

        {/* LEFT COLUMN: Registered Personnel Pool (Dropzone to sever links) */}
        <aside
          className={`ref-roster-column ${isOverRosterDropzone ? 'roster-drop-active' : ''}`}
          onDragOver={handleRosterDragOver}
          onDragLeave={handleRosterDragLeave}
          onDrop={handleRosterDrop}
        >
          <div className="ref-roster-head">
            <div className="ref-rh-titles">
              <span className="ref-meta-tag">REGISTERED OPERATIVES</span>
              <h2 className="ref-section-heading">PERSONNEL POOL</h2>
            </div>
            <span className="ref-badge-counter">{filteredPlayers.length}</span>
          </div>

          {isOverRosterDropzone && (
            <div className="ref-roster-drop-overlay">
              <span>✕ DROP HERE TO SEVER FROM NETWORK</span>
            </div>
          )}

          <div className="ref-roster-actions">
            <input
              type="text"
              placeholder="FILTER CALLSIGN..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="ref-search-input"
            />
          </div>

          <div className="ref-roster-list">
            {filteredPlayers.map((player) => {
              const inNet = connections.find(
                (c) => c.friendId === player.id || c.userId === player.id || c.username === player.username
              );
              return (
                <div
                  key={player.id}
                  className={`ref-player-row ${inNet ? 'is-linked' : ''}`}
                  draggable={!inNet}
                  onDragStart={(e) => handleRosterDragStart(e, player)}
                  title={inNet ? 'Already active in network graph' : 'Drag into graph to connect'}
                >
                  <div className="ref-pr-id">
                    <span className={`ref-pr-dot ${inNet ? (inNet.status === 'ACCEPTED' ? 'black' : 'red') : ''}`} />
                    <div>
                      <div className="ref-pr-name">{player.displayName || player.username}</div>
                      <div className="ref-pr-handle">@{player.username}</div>
                    </div>
                  </div>

                  <div className="ref-pr-stat">
                    {inNet ? (
                      <span className={`ref-chip ${inNet.status.toLowerCase()}`}>
                        {inNet.status === 'ACCEPTED' ? '● ACCEPTED' : '▲ PENDING'}
                      </span>
                    ) : (
                      <span className="ref-chip drag-hint">+ DRAG IN</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="ref-roster-footer">
            <span className="ref-hint-text">
              TIP: Drag any node from the network back onto this column to disconnect them.
            </span>
          </div>
        </aside>

        {/* RIGHT COLUMN: Minimalist Black & Red Constellation Network Graph */}
        <section className="ref-canvas-column">
          <div className="ref-canvas-top-bar">
            <div className="ref-ctb-left">
              <span className="ref-graph-title">CONSTELLATION NETWORK TOPOLOGY</span>
              <div className="ref-graph-legend">
                <span className="ref-legend-item">
                  <span className="ref-l-dot black" /> ACCEPTED (BLACK SPHERE)
                </span>
                <span className="ref-legend-item">
                  <span className="ref-l-dot red" /> PENDING (RED SPHERE)
                </span>
                <span className="ref-legend-item">
                  <span className="ref-l-dot center-black" /> CENTER COMMAND (YOU)
                </span>
              </div>
            </div>
            <div className="ref-ctb-right">
              <span className="ref-mesh-count">
                {connections.filter((c) => c.status === 'ACCEPTED').length} ACTIVE &bull; {connections.filter((c) => c.status === 'PENDING').length} PENDING
              </span>
            </div>
          </div>

          {/* SVG Drop & Render Canvas */}
          <div
            className={`ref-graph-viewport ${isOverCanvasDropzone ? 'canvas-drop-active' : ''}`}
            onDragOver={handleCanvasDragOver}
            onDragLeave={handleCanvasDragLeave}
            onDrop={handleCanvasDrop}
          >
            {isOverCanvasDropzone && (
              <div className="ref-canvas-drop-overlay">
                <div className="ref-cdo-box">
                  <span className="ref-cdo-plus">+</span>
                  <span>RELEASE TO DISPATCH INVITATION LINK</span>
                </div>
              </div>
            )}

            <svg className="ref-svg-mesh" width="840" height="620" viewBox="0 0 840 620">
              <defs>
                {/* 3D Drop Shadow matching the pure black sphere reference image */}
                <filter id="sphereShadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000000" floodOpacity="0.22" />
                </filter>
                <filter id="redSphereShadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#dc2626" floodOpacity="0.32" />
                </filter>
                <filter id="centerSphereShadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#000000" floodOpacity="0.35" />
                </filter>

                {/* Spherical Gradient Shading for 3D appearance */}
                <radialGradient id="blackSphereGrad" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#444444" />
                  <stop offset="60%" stopColor="#111111" />
                  <stop offset="100%" stopColor="#000000" />
                </radialGradient>

                <radialGradient id="redSphereGrad" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#f87171" />
                  <stop offset="60%" stopColor="#dc2626" />
                  <stop offset="100%" stopColor="#991b1b" />
                </radialGradient>

                <pattern id="lightGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                  <circle cx="60" cy="60" r="0.6" fill="#d1d5db" />
                </pattern>
              </defs>

              {/* Clean minimal background grid */}
              <rect width="100%" height="100%" fill="url(#lightGrid)" opacity="0.6" />

              {/* Satellite Pin Stems (Fine hairline rays matching reference) */}
              {satellitePins.map((pin, i) => (
                <g key={`pin-${i}`} className="ref-pin-element">
                  <line
                    x1={pin.x1}
                    y1={pin.y1}
                    x2={pin.px}
                    y2={pin.py}
                    stroke={pin.isAccepted ? '#000000' : '#dc2626'}
                    strokeWidth="0.65"
                    strokeOpacity="0.3"
                  />
                  <circle
                    cx={pin.px}
                    cy={pin.py}
                    r="2.2"
                    fill={pin.isAccepted ? '#000000' : '#dc2626'}
                    opacity="0.75"
                  />
                </g>
              ))}

              {/* INTERCONNECTED PEER MESH LINES (Between Friends) */}
              {interPeerLines.map((pl, i) => (
                <line
                  key={`peer-line-${pl.linkId || i}`}
                  x1={pl.x1}
                  y1={pl.y1}
                  x2={pl.x2}
                  y2={pl.y2}
                  stroke="#111111"
                  strokeWidth="0.9"
                  strokeOpacity="0.45"
                  strokeDasharray="2,3"
                />
              ))}

              {/* DIRECT CONNECTION LINES FROM CENTER OPERATIVE */}
              {positionedNodes.map((node) => (
                <line
                  key={`main-line-${node.linkId || node.username}`}
                  x1={centerX}
                  y1={centerY}
                  x2={node.x}
                  y2={node.y}
                  stroke={node.isAccepted ? '#111111' : '#dc2626'}
                  strokeWidth={node.isAccepted ? '1.2' : '1'}
                  strokeDasharray={node.isAccepted ? 'none' : '3,3'}
                  strokeOpacity={node.isAccepted ? '0.75' : '0.85'}
                />
              ))}

              {/* CENTER OPERATIVE NODE (COMMAND SPHERE) */}
              <g className="ref-node-center-group" transform={`translate(${centerX}, ${centerY})`}>
                <circle
                  r="24"
                  fill="url(#blackSphereGrad)"
                  filter="url(#centerSphereShadow)"
                />
                <circle
                  r="28"
                  fill="none"
                  stroke="#111111"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                  opacity="0.35"
                />
                {/* Clean minimalist typographic label */}
                <text
                  textAnchor="middle"
                  dy="42"
                  className="ref-center-callsign"
                >
                  {(centerPlayer.displayName || centerPlayer.username || 'YOU').toUpperCase()}
                </text>
                <text
                  textAnchor="middle"
                  dy="54"
                  className="ref-center-tag"
                >
                  [CENTER HUB]
                </text>
              </g>

              {/* SATELLITE OPERATIVE NODES (Pure Spheres: Black = Accepted, Red = Pending) */}
              {positionedNodes.map((node) => {
                const isSelected = selectedNode && (selectedNode.friendId === node.friendId);
                const isAccepted = node.isAccepted;
                const nodeSize = (node.radius + 10) * 2;
                return (
                  <g
                    key={`node-${node.linkId || node.username}`}
                    className={`ref-satellite-node ${isAccepted ? 'accepted' : 'pending'} ${isSelected ? 'selected' : ''}`}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => setSelectedNode(node)}
                  >
                    {/* The 3D Sphere matching reference */}
                    <circle
                      r={node.radius}
                      fill={isAccepted ? 'url(#blackSphereGrad)' : 'url(#redSphereGrad)'}
                      filter={isAccepted ? 'url(#sphereShadow)' : 'url(#redSphereShadow)'}
                    />

                    {/* Ring indicator when selected */}
                    {isSelected && (
                      <circle
                        r={node.radius + 6}
                        fill="none"
                        stroke={isAccepted ? '#111111' : '#dc2626'}
                        strokeWidth="1.5"
                      />
                    )}

                    {/* Minimal typographic callsign label below sphere */}
                    <text
                      textAnchor="middle"
                      dy={node.radius + 14}
                      className={`ref-sphere-callsign ${isAccepted ? 'black-lbl' : 'red-lbl'}`}
                    >
                      {(node.displayName || node.username).slice(0, 10).toUpperCase()}
                    </text>
                    <text
                      textAnchor="middle"
                      dy={node.radius + 24}
                      className="ref-sphere-sub"
                    >
                      {isAccepted ? '● ACCEPTED' : '▲ PENDING'}
                    </text>

                    {/* Transparent HTML5 draggable foreignObject hit-area ensuring 100% reliable drag-to-remove in Chromium & Firefox */}
                    <foreignObject
                      x={-(node.radius + 14)}
                      y={-(node.radius + 14)}
                      width={(node.radius + 14) * 2}
                      height={(node.radius + 14) * 2 + 28}
                      style={{ overflow: 'visible' }}
                    >
                      <div
                        xmlns="http://www.w3.org/1999/xhtml"
                        draggable="true"
                        onDragStart={(e) => handleNodeDragStart(e, node)}
                        style={{
                          width: '100%',
                          height: '100%',
                          cursor: 'grab',
                          borderRadius: '50%',
                          userSelect: 'none'
                        }}
                        title={`Drag ${node.displayName || node.username} back to Personnel Pool to sever/remove`}
                      />
                    </foreignObject>
                  </g>
                );
              })}
            </svg>

            {positionedNodes.length === 0 && (
              <div className="ref-empty-canvas-note">
                <span className="ref-ec-title">SQUAD CONSTELLATION VACANT</span>
                <p>Drag any cadet from the personnel pool on the left to add a sphere to the network.</p>
              </div>
            )}
          </div>

          {/* Precision Telemetry Inspection Drawer */}
          {selectedNode && (
            <div className="ref-inspector-bar">
              <div className="ref-ib-profile">
                <span className={`ref-ib-dot ${selectedNode.isAccepted ? 'black' : 'red'}`} />
                <div>
                  <h4 className="ref-ib-title">{selectedNode.displayName || selectedNode.username}</h4>
                  <span className="ref-ib-sub">@{selectedNode.username}</span>
                </div>
              </div>

              <div className="ref-ib-stats">
                <div className="ref-ib-stat-item">
                  <span className="ref-ib-lbl">STATUS</span>
                  <span className={`ref-ib-val ${selectedNode.isAccepted ? 'black' : 'red'}`}>
                    {selectedNode.isAccepted ? 'ACCEPTED (BLACK SPHERE)' : 'PENDING (RED SPHERE)'}
                  </span>
                </div>
                <div className="ref-ib-stat-item">
                  <span className="ref-ib-lbl">BEST COMBAT SCORE</span>
                  <span className="ref-ib-val">
                    {selectedNode.bestScore ? selectedNode.bestScore.toLocaleString() : '0'}
                  </span>
                </div>
              </div>

              <div className="ref-ib-actions">
                {!selectedNode.isAccepted && (
                  <button
                    className="ref-btn-black"
                    onClick={() => handleAcceptRequest(selectedNode.friendId || selectedNode.userId, selectedNode.username)}
                  >
                    ✓ ACCEPT REQUEST (TURN BLACK)
                  </button>
                )}
                <button
                  className="ref-btn-disconnect"
                  onClick={() => handleRemoveFriend(selectedNode.friendId || selectedNode.userId, selectedNode.displayName || selectedNode.username)}
                  title="Sever from network"
                >
                  ✕ SEVER LINK
                </button>
                <button className="ref-btn-subtle" onClick={() => setSelectedNode(null)}>
                  CLOSE
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

