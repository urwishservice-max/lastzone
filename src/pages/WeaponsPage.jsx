import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import { loadNormalizedModel } from '../utils/modelLoader.js';
import { playTacticalClick, playMuzzleFlash } from '../utils/audio.js';

export default function WeaponsPage() {
  const navigate = useNavigate();

  // Weapon catalogue matching the futuristic look with dedicated camera focus inspection parts
  const weapons = [
    {
      id: 'rifle',
      name: 'MA40 KINETIC ASSAULT RIFLE',
      tag: 'PRIMARY ARMAMENT // STANDARD ISSUE',
      modelType: 'rifle',
      caliber: '6.8 × 43mm',
      rpm: 850,
      range: '600 M',
      weight: '3.4 KG',
      capacity: 32,
      damage: 48,
      velocity: 890,
      badge: 'PROTOTYPE V-01',
      edition: 'KINETIC SERIES',
      desc: 'Highly futuristic kinetic assault rifle with integrated targeting matrix, dynamic gas-piston dampeners, and magnetic rail synchronization.',
      prevLabel: 'SPARTAN CARAPACE',
      nextLabel: 'HEAVY MACHINE GUN',
      parts: [
        { id: 'full', label: 'FULL VIEW', pos: [0, 0, 4.4], target: [0, 0, 0] },
        { id: 'optic', label: 'OPTIC SCOPE', pos: [0.05, 0.45, 1.3], target: [0, 0.12, 0] },
        { id: 'chamber', label: 'CHAMBER & MAG', pos: [0.25, -0.15, 1.4], target: [0.1, -0.12, 0] },
        { id: 'barrel', label: 'FLUTED BARREL', pos: [0.85, 0.1, 1.4], target: [0.65, 0.05, 0] }
      ]
    },
    {
      id: 'spartan',
      name: 'VANGUARD TITANIUM EXOSUIT',
      tag: 'POWERED DEFENSE // TITANIUM-A CARAPACE',
      modelType: 'spartan',
      caliber: 'EXO-ENERGY',
      rpm: 1200,
      range: 'GLOBAL',
      weight: '450 KG',
      capacity: 100,
      damage: 95,
      velocity: 36,
      badge: 'ARCHIVE 480 BC',
      edition: 'AEGIS CARAPACE',
      desc: 'Full-body powered combat carapace featuring polarized photonic gold visor, kinetic trauma dissipation, and neural reactive servos.',
      prevLabel: 'HEAVY MACHINE GUN',
      nextLabel: 'MA40 RIFLE',
      parts: [
        { id: 'full', label: 'FULL SUIT', pos: [0, 0, 4.4], target: [0, 0, 0] },
        { id: 'head', label: 'HEAD / VISOR', pos: [0, 0.72, 1.55], target: [0, 0.65, 0] },
        { id: 'chest', label: 'CHEST ARMOR', pos: [0, 0.22, 1.8], target: [0, 0.15, 0] },
        { id: 'shoe', label: 'COMBAT BOOTS', pos: [0, -0.72, 1.6], target: [0, -0.75, 0] }
      ]
    },
    {
      id: 'machinegun',
      name: 'M2 VANGUARD HEAVY SUPPRESSOR',
      tag: 'AREA DENIAL // SUSTAINED FIRE',
      modelType: 'machinegun',
      caliber: '.50 BMG (12.7mm)',
      rpm: 600,
      range: '1,800 M',
      weight: '11.0 KG',
      capacity: 100,
      damage: 110,
      velocity: 920,
      badge: 'TACTICAL SECTOR',
      edition: 'SUPPRESSION SERIES',
      desc: 'Heavy caliber recoil-operated suppression system engineered to neutralize hostile swarm vectors at choke points without thermal throttle.',
      prevLabel: 'MA40 RIFLE',
      nextLabel: 'SPARTAN CARAPACE',
      parts: [
        { id: 'full', label: 'FULL WEAPON', pos: [0, 0, 4.4], target: [0, 0, 0] },
        { id: 'muzzle', label: 'HEAVY MUZZLE', pos: [1.1, 0.15, 1.5], target: [0.95, 0, 0] },
        { id: 'drum', label: 'AMMO DRUM', pos: [-0.05, -0.22, 1.45], target: [-0.05, -0.15, 0] },
        { id: 'receiver', label: 'BREECH & STOCK', pos: [-0.65, 0.05, 1.5], target: [-0.4, 0, 0] }
      ]
    }
  ];

  const [activeIdx, setActiveIdx] = useState(0);
  const activeWeapon = weapons[activeIdx];
  const [activePartId, setActivePartId] = useState('full');

  // Interactive event simulation states
  const [currentAmmo, setCurrentAmmo] = useState(activeWeapon.capacity);
  const [isFiring, setIsFiring] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [safetyLocked, setSafetyLocked] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [inspectionAngle, setInspectionAngle] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [showEventDrawer, setShowEventDrawer] = useState(false);

  // Tournament Requisition & Purchase State
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseCode, setPurchaseCode] = useState('');
  const [purchaseFeedback, setPurchaseFeedback] = useState(null);
  const [isSubmittingPurchase, setIsSubmittingPurchase] = useState(false);
  const [purchasedWeapons, setPurchasedWeapons] = useState([]);
  const [eventLogs, setEventLogs] = useState([]);

  const logEvent = (type, detail) => {
    const entry = { id: Date.now() + Math.random(), type, detail, time: new Date().toLocaleTimeString() };
    setEventLogs((prev) => [entry, ...prev.slice(0, 19)]);
  };
  const [burstCount, setBurstCount] = useState(0);

  // JS Event Log
  const [eventLog, setEventLog] = useState([
    { id: 1, type: 'DOMContentLoaded', target: 'WINDOW', time: new Date().toLocaleTimeString(), detail: 'Futuristic Weapons Showcase initialized.' }
  ]);
  const [eventCounts, setEventCounts] = useState({
    click: 0,
    dblclick: 0,
    mousemove: 0,
    mouseenter: 0,
    mouseleave: 0,
    keydown: 0,
    keyup: 0,
    wheel: 0,
    input: 0,
    change: 0
  });

  // Helper to record JS Events
  const recordEvent = (type, targetName, detail) => {
    setEventCounts(prev => ({
      ...prev,
      [type]: (prev[type] || 0) + 1
    }));
    setEventLog(prev => [
      {
        id: Date.now() + Math.random(),
        type,
        target: targetName,
        time: new Date().toLocaleTimeString(),
        detail: detail || ''
      },
      ...prev.slice(0, 24)
    ]);
  };

  // Switch weapon
  const handleNext = () => {
    setActiveIdx((activeIdx + 1) % weapons.length);
    setActivePartId('full');
    recordEvent('click', 'NEXT NAV ARROW', 'Navigated to next armament model in carousel.');
    playTacticalClick();
  };

  const handlePrev = () => {
    setActiveIdx((activeIdx - 1 + weapons.length) % weapons.length);
    setActivePartId('full');
    recordEvent('click', 'PREV NAV ARROW', 'Navigated to previous armament model in carousel.');
    playTacticalClick();
  };

  // Reset ammo on switch
  useEffect(() => {
    setCurrentAmmo(activeWeapon.capacity);
    setIsReloading(false);
    setActivePartId('full');
  }, [activeIdx]);

  // 3D Canvas Refs
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const modelGroupRef = useRef(null);
  const controlsRef = useRef(null);

  const [isLoadingModel, setIsLoadingModel] = useState(false);

  // Initialize Three.js Scene once on mount
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 900;
    const height = container.clientHeight || 650;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.4);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      precision: 'highp',
      powerPreference: 'high-performance',
      logarithmicDepthBuffer: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    // Clear any previous canvas element
    const existingCanvas = container.querySelector('canvas');
    if (existingCanvas) existingCanvas.remove();
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- Cinematic Studio Lighting Rig ---
    const ambientLight = new THREE.AmbientLight(0xF4F4F2, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xFFFFFF, 3.0);
    keyLight.position.set(4, 6, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.bias = -0.0003;
    keyLight.shadow.normalBias = 0.03;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xE0E0DE, 1.2);
    fillLight.position.set(-4, 2, 3);
    scene.add(fillLight);

    // Dynamic Rim Light for edge definition & metal sheen
    const rimLight = new THREE.DirectionalLight(0xD7E6FF, 2.8);
    rimLight.position.set(0, 5, -5);
    scene.add(rimLight);

    // Warm specular kicker for gold visor and metallic details
    const warmKicker = new THREE.DirectionalLight(0xFFD700, 1.0);
    warmKicker.position.set(-2, 3, -2);
    scene.add(warmKicker);

    // Tactical red accent point light for futuristic highlights
    const redPointLight = new THREE.PointLight(0xD7263D, 0.8, 8, 2);
    redPointLight.position.set(0, 1.2, 1.5);
    scene.add(redPointLight);

    // --- Contact Shadow Floor ---
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const ctx = shadowCanvas.getContext('2d');
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 120);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.15)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(3.6, 3.6);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.6,
      depthWrite: false
    });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.position.y = -0.95;
    scene.add(contactShadow);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enableZoom = true;
    controls.maxDistance = 6.0;
    controls.minDistance = 1.0;
    controlsRef.current = controls;

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // Animation Render Loop (Static showcase with interactive orbit controls)
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || 900;
      const h = container.clientHeight || 650;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Smoothly move camera and controls target to inspect specific part
  const focusPart = (part) => {
    if (!cameraRef.current || !controlsRef.current) return;
    setActivePartId(part.id);
    playTacticalClick();
    recordEvent('click', `INSPECT [${part.label}]`, `Focused camera to ${part.label} position.`);

    const camera = cameraRef.current;
    const controls = controlsRef.current;

    // Smooth GSAP transition for camera position and controls target
    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(controls.target);

    gsap.to(camera.position, {
      x: part.pos[0],
      y: part.pos[1],
      z: part.pos[2],
      duration: 1.1,
      ease: 'power3.out'
    });

    gsap.to(controls.target, {
      x: part.target[0],
      y: part.target[1],
      z: part.target[2],
      duration: 1.1,
      ease: 'power3.out',
      onUpdate: () => controls.update()
    });
  };

  // Load and swap model whenever activeIdx / activeWeapon changes
  useEffect(() => {
    let isDisposed = false;
    const modelGroup = modelGroupRef.current;
    if (!modelGroup) return;

    setIsLoadingModel(true);

    const loadCurrent = async () => {
      try {
        const model = await loadNormalizedModel(activeWeapon.modelType);
        if (isDisposed) return;

        // Clear existing children smoothly
        while (modelGroup.children.length > 0) {
          modelGroup.remove(modelGroup.children[0]);
        }

        // Reset modelGroup rotation on new model
        modelGroup.rotation.set(0, 0, 0);

        modelGroup.add(model);
        model.position.set(0, 0, 0);

        // Keep model scale proportional to normalized baseScale & orient gracefully
        const base = model.userData.baseScale || 1.0;
        if (activeWeapon.modelType === 'spartan') {
          model.scale.setScalar(base * 0.95);
          model.rotation.set(0, 0, 0);
        } else if (activeWeapon.modelType === 'machinegun') {
          model.scale.setScalar(base * 0.95);
          model.rotation.set(0, 0, 0);
        } else {
          // rifle - standard heroic profile orientation
          model.scale.setScalar(base * 1.05);
          model.rotation.set(0, 0, 0);
        }

        // Reset camera to default full view for this model
        if (cameraRef.current && controlsRef.current) {
          gsap.to(cameraRef.current.position, {
            x: 0,
            y: 0,
            z: 4.4,
            duration: 0.8,
            ease: 'power2.out'
          });
          gsap.to(controlsRef.current.target, {
            x: 0,
            y: 0,
            z: 0,
            duration: 0.8,
            ease: 'power2.out',
            onUpdate: () => controlsRef.current.update()
          });
        }
      } catch (err) {
        console.error('Error loading weapon model:', err);
      } finally {
        if (!isDisposed) setIsLoadingModel(false);
      }
    };

    loadCurrent();

    return () => {
      isDisposed = true;
    };
  }, [activeIdx]);

  // --- JavaScript Event Handlers (Click, Double Click, MouseMove, Enter, Leave, Wheel, KeyDown, KeyUp, Input) ---

  // Event 1: CLICK - Test Fire Discharge
  const handleDischarge = () => {
    recordEvent('click', 'DISCHARGE TRIGGER', `Fired primary round from ${activeWeapon.name}.`);
    playTacticalClick();

    if (safetyLocked) {
      recordEvent('click', 'SAFETY LOCK', 'Denied: Safety mechanism engaged [Press S].');
      return;
    }

    if (isReloading) {
      recordEvent('click', 'BOLT LOCK', 'Denied: Chamber currently cycling.');
      return;
    }

    if (currentAmmo <= 0) {
      recordEvent('click', 'EMPTY CHAMBER', 'Dry click! Magazine exhausted. Double click or press R to reload.');
      return;
    }

    setIsFiring(true);
    playMuzzleFlash();

    if (modelGroupRef.current) {
      modelGroupRef.current.position.z -= 0.12;
      setTimeout(() => {
        if (modelGroupRef.current) modelGroupRef.current.position.z = 0;
      }, 80);
    }

    setCurrentAmmo(prev => Math.max(0, prev - 1));
    setBurstCount(prev => prev + 1);

    setTimeout(() => {
      setIsFiring(false);
    }, 120);
  };

  // Event 2: DOUBLE CLICK - Smooth 3D Camera Zoom (No model reload/flickering)
  const handleModelZoom = (e) => {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }
    
    // Toggle zoom between 2.2 and 4.4
    const newZoom = zoomLevel === 1.0 ? 1.75 : 1.0;
    setZoomLevel(newZoom);
    recordEvent('dblclick', '3D STAGE ZOOM', `Double-clicked 3D model: Zoom set to ${newZoom}x`);
    playTacticalClick();

    if (cameraRef.current && controlsRef.current) {
      const targetZ = newZoom === 1.75 ? 2.4 : 4.4;
      gsap.to(cameraRef.current.position, {
        z: targetZ,
        duration: 0.6,
        ease: 'power2.out',
        onUpdate: () => controlsRef.current.update()
      });
    }
  };

  // Event 3: MOUSE MOVE - Reticle tracking & telemetry
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    setCursorPos({ x, y });

    if (Math.random() < 0.03) {
      recordEvent('mousemove', 'CROSSHAIR RETICLE', `Aim coordinates: (${x}px, ${y}px)`);
    }

    if (modelGroupRef.current) {
      const tiltX = (x / rect.width - 0.5) * 0.35;
      const tiltY = (y / rect.height - 0.5) * 0.25;
      modelGroupRef.current.rotation.x = tiltY;
      modelGroupRef.current.rotation.y += tiltX * 0.03;
    }
  };

  // Event 4: MOUSE ENTER / LEAVE
  const handleMouseEnter = () => {
    recordEvent('mouseenter', 'FUTURISTIC HERO FRAME', 'Optical target locked. Telemetry active.');
  };

  const handleMouseLeave = () => {
    recordEvent('mouseleave', 'FUTURISTIC HERO FRAME', 'Target lock disengaged.');
  };

  // Event 5: WHEEL - Zoom Magnification
  const handleWheel = (e) => {
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    const newZoom = Math.min(Math.max(zoomLevel + delta, 0.6), 2.2);
    setZoomLevel(parseFloat(newZoom.toFixed(2)));
    recordEvent('wheel', 'MAGNIFICATION WHEEL', `Zoom adjusted to ${newZoom.toFixed(1)}X`);

    if (cameraRef.current) {
      cameraRef.current.position.z = 3.0 / newZoom;
    }
  };

  // Event 6: KEYDOWN & KEYUP
  useEffect(() => {
    const onKeyDown = (e) => {
      recordEvent('keydown', `KEY [${e.key.toUpperCase()}]`, `Key code: ${e.code}`);

      if (e.key === 'r' || e.key === 'R') {
        handleReload();
      } else if (e.key === 's' || e.key === 'S') {
        setSafetyLocked(prev => !prev);
        recordEvent('keydown', 'KEY [S]', 'Toggled safety lever switch.');
        playTacticalClick();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handleDischarge();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === '1') {
        setActiveIdx(0);
      } else if (e.key === '2') {
        setActiveIdx(1);
      } else if (e.key === '3') {
        setActiveIdx(2);
      }
    };

    const onKeyUp = (e) => {
      recordEvent('keyup', `KEY RELEASE [${e.key.toUpperCase()}]`, `Keyup ${e.code}`);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [currentAmmo, isReloading, safetyLocked, activeIdx]);

  // Event 7: INPUT - Fine Rotation Calibration
  const handleYawInput = (e) => {
    const val = parseFloat(e.target.value);
    setInspectionAngle(val);
    recordEvent('input', 'YAW SLIDER', `Rotated weapon platform to ${val}°`);

    if (modelGroupRef.current) {
      modelGroupRef.current.rotation.y = (val * Math.PI) / 180;
    }
  };

  return (
    <div className="futurist-page-wrapper">
      {/* Outer Sleek Rounded Device Frame */}
      <div className="futurist-device-frame">
        {/* Top Notch / Header Bar matching reference image */}
        <header className="futurist-notch-header">
          {/* Top Left Capsule Navigation */}
          <div className="capsule-nav-group">
            <button className="capsule-btn" onClick={() => navigate('/')}>HOME</button>
            <button className="capsule-btn" onClick={() => navigate('/#scene02')}>ABOUT</button>
            <button className="capsule-btn active" onClick={() => {}}>WEAPONS</button>
            <button className="capsule-btn" onClick={() => navigate('/leaderboard')}>SCORES</button>
          </div>

          {/* Center Brand Notch */}
          <div className="notch-brand-badge">
            <span className="brand-dot" />
            <span className="brand-text">LASTZONE // SPARTAN</span>
          </div>

          {/* Top Right Grid Icon & Event Drawer Toggle */}
          <div className="notch-actions-group">
            <button
              className="event-terminal-pill"
              onClick={() => {
                setShowEventDrawer(prev => !prev);
                recordEvent('click', 'TERMINAL DRAWER', 'Toggled Live JS Event Console.');
                playTacticalClick();
              }}
              title="View live JavaScript event logs"
            >
              <span className="pill-dot" />
              <span>JS EVENTS ({eventCounts.click + eventCounts.keydown + eventCounts.wheel})</span>
            </button>

            <button
              className="grid-menu-btn"
              onClick={() => navigate('/play')}
              title="Launch Combat Simulator"
            >
              <span className="grid-icon">⚏</span>
            </button>
          </div>
        </header>

        {/* Center Main Futuristic Showcase Body */}
        <main
          className="futurist-stage-container"
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
        >
          {/* Huge Hollow Outline Typography behind model: 'FUTURIST' */}
          <div className="giant-hollow-word" aria-hidden="true">
            FUTURIST
          </div>

          {/* Left Arrow Navigation Button */}
          <button
            className="carousel-side-nav left-nav"
            onClick={handlePrev}
            aria-label="Previous Weapon"
            title={`Previous: ${activeWeapon.prevLabel}`}
          >
            ‹
          </button>

          {/* Left Thumbnail Preview (blurred side preview like the glove in reference image) */}
          <div className="side-preview-wrapper left-preview" onClick={handlePrev}>
            <div className="preview-label">PREV ASSET</div>
            <div className="preview-name">{activeWeapon.prevLabel}</div>
          </div>

          {/* Center 3D WebGL Canvas Stage */}
          <div
            className="center-3d-stage"
            ref={mountRef}
            onClick={handleDischarge}
            onDoubleClick={handleModelZoom}
            title="Click to discharge weapon • Double-click 3D model to zoom in / out"
          >
            {/* Inspection Part Quick Focus Bar */}
            <div className="model-parts-toolbar" onClick={(e) => e.stopPropagation()}>
              <div className="toolbar-label">
                <span className="live-blink-dot" />
                <span>INSPECT ZONE</span>
              </div>
              <div className="parts-buttons-row">
                {activeWeapon.parts && activeWeapon.parts.map(part => (
                  <button
                    key={part.id}
                    className={`part-focus-btn ${activePartId === part.id ? 'active' : ''}`}
                    onClick={() => focusPart(part)}
                    title={`Focus camera on ${part.label}`}
                  >
                    {part.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subtle Armory Model Loader */}
            {isLoadingModel && (
              <div className="weapon-model-loader">
                <div className="loader-radar-spinner" />
                <span className="loader-label">SYNCHRONIZING {activeWeapon.name}...</span>
              </div>
            )}

            {/* Real-time Firing Flash */}
            {isFiring && <div className="futurist-flash-ring" />}

            {/* Smart Crosshair Reticle */}
            <div
              className="futurist-reticle"
              style={{
                left: cursorPos.x || '50%',
                top: cursorPos.y || '50%'
              }}
            >
              <div className="reticle-bracket tl" />
              <div className="reticle-bracket tr" />
              <div className="reticle-bracket bl" />
              <div className="reticle-bracket br" />
              <div className="reticle-center-dot" />
            </div>
          </div>

          {/* Right Thumbnail Preview (blurred side preview like the boot in reference image) */}
          <div className="side-preview-wrapper right-preview" onClick={handleNext}>
            <div className="preview-label">NEXT ASSET</div>
            <div className="preview-name">{activeWeapon.nextLabel}</div>
          </div>

          {/* Right Arrow Navigation Button */}
          <button
            className="carousel-side-nav right-nav"
            onClick={handleNext}
            aria-label="Next Weapon"
            title={`Next: ${activeWeapon.nextLabel}`}
          >
            ›
          </button>

          {/* Bottom Left Futuristic Headline matching reference image */}
          <div className="futurist-bottom-left">
            <h1 className="futurist-title">
              <span>FUTURISTIC</span>
              <span>COLLECTION</span>
            </h1>
            <div className="futurist-meta-row">
              <span className="spec-badge">{activeWeapon.caliber}</span>
              <span className="spec-badge">{activeWeapon.rpm} RPM</span>
              <span className="spec-badge">{activeWeapon.velocity} M/S</span>
            </div>
          </div>

          {/* Bottom Right Call-to-Action matching reference image */}
          <div className="futurist-bottom-right">
            <p className="futurist-desc-text">
              {activeWeapon.desc}
            </p>

            <div className="order-cta-row">
              <button
                className="futurist-order-btn"
                onClick={handleDischarge}
                onDoubleClick={handleModelZoom}
                onMouseEnter={() => recordEvent('mouseenter', 'DISCHARGE BUTTON', 'Hovered combat discharge trigger')}
              >
                <span className="cta-circle">
                  <span className="cta-dot" />
                </span>
                <span className="cta-text">
                  {safetyLocked ? 'SAFETY LOCKED' : isReloading ? 'RELOADING...' : `DISCHARGE (${currentAmmo}/${activeWeapon.capacity})`}
                </span>
              </button>

              {/* Tournament Requisition Purchase Button */}
              <button
                className="futurist-order-btn requisition-btn"
                onClick={() => {
                  setShowPurchaseModal(true);
                  recordEvent('click', 'REQUISITION MODAL', 'Opened Requisition Purchase Terminal');
                  playTacticalClick();
                }}
                onDoubleClick={() => {
                  setPurchaseCode('LZ-VANGUARD-99');
                  recordEvent('dblclick', 'REQUISITION SHORTCUT', 'Auto-filled clearance code via double-click');
                }}
                onMouseEnter={() => recordEvent('mouseenter', 'REQUISITION BUTTON', 'Hovered weapon acquisition control')}
                title="Double-click to auto-fill clearance code, or click to open purchase requisition"
              >
                <span className="cta-circle gold-circle">
                  <span className="cta-dot gold-dot" />
                </span>
                <span className="cta-text">
                  REQUISITION / BUY (CODE)
                </span>
              </button>
            </div>
          </div>

          {/* Requisition Purchase Form Modal (Handles submit, change, blur, input, keydown, double-click) */}
          {showPurchaseModal && (
            <div className="futurist-modal-backdrop" onClick={() => setShowPurchaseModal(false)}>
              <div
                className="futurist-modal-card"
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={() => recordEvent('mouseenter', 'PURCHASE MODAL', 'Hovered requisition terminal dialog')}
              >
                <div className="fmc-header">
                  <div className="fmc-title-group">
                    <span className="fmc-dot" />
                    <h3>TOURNAMENT WEAPON REQUISITION</h3>
                  </div>
                  <button
                    className="fmc-close"
                    onClick={() => {
                      setShowPurchaseModal(false);
                      recordEvent('click', 'CLOSE MODAL', 'Closed acquisition form');
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div className="fmc-body">
                  <p className="fmc-note">
                    Acquire <strong>{activeWeapon.name}</strong> for active deployment in Sector 07. Submit your combat clearance authorization code below.
                  </p>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      recordEvent('submit', 'PURCHASE FORM', `Form submitted with authorization code: ${purchaseCode}`);
                      setIsSubmittingPurchase(true);
                      setPurchaseFeedback(null);
                      try {
                        const token = localStorage.getItem('lastzone_token');
                        const headers = {
                          'Content-Type': 'application/json',
                          ...(token ? { Authorization: `Bearer ${token}` } : {})
                        };
                        const res = await fetch('/api/weapons/purchase', {
                          method: 'POST',
                          headers,
                          body: JSON.stringify({
                            weaponId: activeWeapon.id,
                            weaponName: activeWeapon.name,
                            purchaseCode: purchaseCode || 'LZ-ALPHA-01',
                            amount: 7500
                          })
                        });
                        const data = await res.json();
                        if (res.ok) {
                          setPurchaseFeedback({ type: 'success', msg: data.message || 'Weapon acquired and authorized!' });
                          setPurchasedWeapons(prev => [...prev, activeWeapon.id]);
                          recordEvent('ajax:success', 'DATABASE COMMIT', `Stored purchase in MySQL (ID: ${data.purchaseId})`);
                        } else {
                          setPurchaseFeedback({ type: 'error', msg: data.message || 'Requisition denied.' });
                          recordEvent('ajax:error', 'DATABASE ERROR', data.message);
                        }
                      } catch {
                        setPurchaseFeedback({ type: 'error', msg: 'Tactical server offline.' });
                      } finally {
                        setIsSubmittingPurchase(false);
                      }
                    }}
                  >
                    <div className="fmc-field">
                      <label className="fmc-label">CLEARANCE AUTHORIZATION CODE</label>
                      <input
                        type="text"
                        className="fmc-input"
                        placeholder="ENTER CODE E.G. LASTZONE"
                        value={purchaseCode}
                        onChange={(e) => {
                          setPurchaseCode(e.target.value.toUpperCase());
                          recordEvent('change', 'CODE INPUT', `Changed authorization value to ${e.target.value}`);
                        }}
                        onInput={(e) => recordEvent('input', 'CODE INPUT', `Key input received: ${e.target.value}`)}
                        onBlur={() => recordEvent('blur', 'CODE INPUT', 'Clearance input blurred')}
                        onKeyDown={(e) => recordEvent('keydown', 'CODE INPUT', `Keydown [${e.key}] in code field`)}
                        onDoubleClick={() => {
                          setPurchaseCode('LASTZONE');
                          recordEvent('dblclick', 'CODE INPUT', 'Double-clicked input to auto-fill code LASTZONE');
                        }}
                        required
                      />
                      <span className="fmc-field-hint">
                        Tip: Enter code <code>LASTZONE</code> or double-click to auto-fill.
                      </span>
                    </div>

                    <div className="fmc-specs-summary">
                      <div className="fmc-spec"><span>MODEL:</span> <strong>{activeWeapon.edition}</strong></div>
                      <div className="fmc-spec"><span>EST. VALUE:</span> <strong>7,500 CREDITS</strong></div>
                      <div className="fmc-spec"><span>CALIBER:</span> <strong>{activeWeapon.caliber}</strong></div>
                    </div>

                    {purchaseFeedback && (
                      <div className={`fmc-feedback ${purchaseFeedback.type}`}>
                        <span>{purchaseFeedback.msg}</span>
                      </div>
                    )}

                    <div className="fmc-footer">
                      <button
                        type="submit"
                        className="fmc-submit-btn"
                        disabled={isSubmittingPurchase}
                        onMouseEnter={() => recordEvent('mouseenter', 'SUBMIT BUTTON', 'Hovered form submit button')}
                      >
                        {isSubmittingPurchase ? 'AUTHENTICATING...' : 'SUBMIT REQUISITION CODE'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Corner Badges matching reference image */}
          <div className="futurist-stamp-badge">
            <span>FUTURISTIC STAMP // VANGUARD-01</span>
          </div>

          <div className="futurist-year-badge">
            <span>2026</span>
          </div>
        </main>
      </div>

      {/* Slide-in JS Event Telemetry Drawer */}
      <div className={`js-event-drawer ${showEventDrawer ? 'open' : ''}`}>
        <div className="drawer-header">
          <div className="drawer-title-group">
            <span className="drawer-dot" />
            <h3>JAVASCRIPT EVENT DISPATCHER</h3>
          </div>
          <button className="drawer-close-btn" onClick={() => setShowEventDrawer(false)}>✕</button>
        </div>

        {/* Counter Matrix */}
        <div className="drawer-metrics-grid">
          <div className="metric-chip"><span>click:</span> <strong>{eventCounts.click}</strong></div>
          <div className="metric-chip"><span>dblclick:</span> <strong>{eventCounts.dblclick}</strong></div>
          <div className="metric-chip"><span>mousemove:</span> <strong>{eventCounts.mousemove}</strong></div>
          <div className="metric-chip"><span>wheel:</span> <strong>{eventCounts.wheel}</strong></div>
          <div className="metric-chip"><span>keydown:</span> <strong>{eventCounts.keydown}</strong></div>
          <div className="metric-chip"><span>input:</span> <strong>{eventCounts.input}</strong></div>
        </div>

        <div className="drawer-hotkeys-box">
          <h4>KEYBOARD EVENTS (KEYDOWN / KEYUP)</h4>
          <p><kbd>SPACE</kbd> Fire weapon &bull; <kbd>R</kbd> Reload &bull; <kbd>S</kbd> Safety &bull; <kbd>← / →</kbd> Switch model</p>
        </div>

        {/* Log Stream */}
        <div className="drawer-log-stream">
          <div className="stream-header">
            <span>REAL-TIME TERMINAL STREAM</span>
            <button className="clear-link" onClick={() => setEventLog([])}>CLEAR</button>
          </div>
          <div className="stream-body">
            {eventLog.map(item => (
              <div key={item.id} className="stream-line">
                <span className="st-time">[{item.time}]</span>
                <span className="st-type">{item.type}</span>
                <span className="st-target">@{item.target}</span>
                <span className="st-detail">{item.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
