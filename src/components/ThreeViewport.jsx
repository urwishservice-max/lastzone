import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { timelineConfig } from '../timeline.config.js';
import { loadNormalizedModel } from '../utils/modelLoader.js';
import { createTacticalWorldMap } from '../utils/worldMap.js';
import { createParticleSystems } from '../utils/particles.js';
import { playMuzzleFlash, startHeartbeat, stopHeartbeat } from '../utils/audio.js';
import { useExperience } from '../context/ExperienceContext';
import { useNavigate } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);


export default function ThreeViewport() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const {
    setActiveSceneIndex,
    setActiveAct,
    setActiveChapter,
    setActiveSceneName,
    setScrollProgress,
    setPreloadProgress,
    setIsPreloadDone,
    setIsDawnFlash,
    setStats,
    setStandTime,
    setIsHeartbeatActive,
    lenisInstanceRef,
    threeBridgeRef,
    setMacroTelemetry
  } = useExperience();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isDisposed = false;
    let animFrameId = null;

    // --- State variables ---
    let activeSceneIndex = 0;
    let isSandboxActive = false;
    let isManualCloseUpActive = false;
    let preCloseUpCamState = null;
    let standTimerInterval = null;
    let statsAnimated = false;

    const clock = new THREE.Clock();
    const cameraTarget = new THREE.Vector3(0, 0, 0);

    // --- 1. Three.js Core ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      timelineConfig.global.cameraFov,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0.05, 5.0);
    camera.lookAt(cameraTarget);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      precision: 'highp',
      logarithmicDepthBuffer: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // OrbitControls (for sandbox mode)
    const controls = new OrbitControls(camera, document.body);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enabled = false;
    controls.maxDistance = 7.0;
    controls.minDistance = 1.0;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;

    // --- 2. Lighting Rig ---
    const studioPreset = timelineConfig.lightingPresets.studioLight;
    const ambientLight = new THREE.AmbientLight(studioPreset.ambient.color, studioPreset.ambient.intensity);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(studioPreset.key.color, studioPreset.key.intensity);
    keyLight.position.set(...studioPreset.key.pos);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.camera.left = -4;
    keyLight.shadow.camera.right = 4;
    keyLight.shadow.camera.top = 4;
    keyLight.shadow.camera.bottom = -4;
    keyLight.shadow.bias = -0.0003;
    keyLight.shadow.normalBias = 0.03;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(studioPreset.fill.color, studioPreset.fill.intensity);
    fillLight.position.set(...studioPreset.fill.pos);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(studioPreset.rim.color, studioPreset.rim.intensity);
    rimLight.position.set(...studioPreset.rim.pos);
    scene.add(rimLight);

    const redPointLight = new THREE.PointLight(studioPreset.accentRed.color, 0, 10, 2);
    redPointLight.position.set(0, 1.5, 1.5);
    scene.add(redPointLight);

    // Apply lighting preset
    const applyLighting = (presetName) => {
      const p = timelineConfig.lightingPresets[presetName] || timelineConfig.lightingPresets.studioLight;
      gsap.to(ambientLight, { intensity: p.ambient.intensity, duration: 0.8 });
      gsap.to(ambientLight.color, {
        r: ((p.ambient.color >> 16) & 255) / 255,
        g: ((p.ambient.color >> 8) & 255) / 255,
        b: (p.ambient.color & 255) / 255,
        duration: 0.8
      });
      gsap.to(keyLight, { intensity: p.key.intensity, duration: 0.8 });
      gsap.to(keyLight.color, {
        r: ((p.key.color >> 16) & 255) / 255,
        g: ((p.key.color >> 8) & 255) / 255,
        b: (p.key.color & 255) / 255,
        duration: 0.8
      });
      gsap.to(rimLight, { intensity: p.rim.intensity, duration: 0.8 });
      gsap.to(redPointLight, { intensity: p.accentRed.intensity, duration: 0.8 });
    };

    // --- 3. Contact Shadow ---
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
    const shadowGeo = new THREE.PlaneGeometry(3.5, 3.5);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.position.y = -0.96;
    scene.add(contactShadow);

    // --- 4. Lenis Smooth Scroll ---
    const lenis = new Lenis({
      lerp: 0.08,
      wheelMultiplier: 0.9,
      smoothWheel: true,
      normalizeWheel: true
    });
    lenisInstanceRef.current = lenis;

    const onLenisScroll = (e) => {
      ScrollTrigger.update();
      if (isManualCloseUpActive && Math.abs(e.velocity) > 0.8) {
        exitCloseUp();
      }
    };
    lenis.on('scroll', onLenisScroll);

    const onGsapTicker = (time) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(onGsapTicker);
    gsap.ticker.lagSmoothing(0);

    // --- 5. Models & Assets ---
    let spartanPivot = null;
    let riflePivot = null;
    let machinegunPivot = null;
    let worldMap = null;
    let particles = null;

    const triggerMuzzlePulse = () => {
      playMuzzleFlash();
      if (!redPointLight) return;
      gsap.killTweensOf(redPointLight);
      redPointLight.intensity = 5.0;
      gsap.to(redPointLight, {
        intensity: 0,
        duration: 0.35,
        ease: 'power2.out'
      });
    };

    // Macro coordinates calculation
    const getMacroTargetCoords = (area = 'visor') => {
      const sx = spartanPivot ? spartanPivot.position.x : -0.25;
      const sy = spartanPivot ? spartanPivot.position.y : 0;
      const sz = spartanPivot ? spartanPivot.position.z : 0;
      const scale = spartanPivot ? spartanPivot.scale.x : 0.82;
      const rotY = spartanPivot ? spartanPivot.rotation.y : 0;

      if (area === 'visor') {
        const localX = 0;
        const localY = 0.62;
        const localZ = 0.08;
        const worldX = sx + (localX * Math.cos(rotY) + localZ * Math.sin(rotY)) * scale;
        const worldY = sy + localY * scale;
        const worldZ = sz + (-localX * Math.sin(rotY) + localZ * Math.cos(rotY)) * scale;
        return {
          target: [worldX, worldY, worldZ],
          pos: [worldX + 0.08, worldY + 0.02, worldZ + 1.12],
          name: 'HELMET & VISOR // OPTICAL SUBSYSTEM',
          mag: '4.8X',
          focal: '1.12 m'
        };
      } else if (area === 'chest') {
        const localX = 0;
        const localY = 0.22;
        const localZ = 0.08;
        const worldX = sx + (localX * Math.cos(rotY) + localZ * Math.sin(rotY)) * scale;
        const worldY = sy + localY * scale;
        const worldZ = sz + (-localX * Math.sin(rotY) + localZ * Math.cos(rotY)) * scale;
        return {
          target: [worldX, worldY, worldZ],
          pos: [worldX + 0.05, worldY + 0.02, worldZ + 1.22],
          name: 'CHEST CARAPACE // TITANIUM-A MATRIX',
          mag: '4.2X',
          focal: '1.22 m'
        };
      } else if (area === 'side') {
        const localX = 0.28;
        const localY = 0.44;
        const localZ = 0.0;
        const worldX = sx + (localX * Math.cos(rotY) + localZ * Math.sin(rotY)) * scale;
        const worldY = sy + localY * scale;
        const worldZ = sz + (-localX * Math.sin(rotY) + localZ * Math.cos(rotY)) * scale;
        return {
          target: [worldX, worldY, worldZ],
          pos: [worldX + 0.55, worldY + 0.03, worldZ + 1.15],
          name: 'SIDE ARMOR // KINETIC DISSIPATION',
          mag: '3.9X',
          focal: '1.15 m'
        };
      }

      return {
        target: [sx, sy + 0.52 * scale, sz],
        pos: [sx + 0.08, sy + 0.54 * scale, sz + 1.12],
        name: 'HELMET & VISOR // OPTICAL SUBSYSTEM',
        mag: '4.8X',
        focal: '1.12 m'
      };
    };

    const enterCloseUp = (area = 'visor', animate = true) => {
      if (isSandboxActive) return;
      isManualCloseUpActive = true;

      if (!preCloseUpCamState) {
        preCloseUpCamState = {
          pos: camera.position.clone(),
          target: cameraTarget.clone()
        };
      }

      const coords = getMacroTargetCoords(area);
      setMacroTelemetry({
        name: coords.name,
        mag: coords.mag,
        focal: coords.focal
      });

      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(cameraTarget);

      if (animate) {
        gsap.to(camera.position, {
          x: coords.pos[0],
          y: coords.pos[1],
          z: coords.pos[2],
          duration: 1.2,
          ease: 'power3.out'
        });
        gsap.to(cameraTarget, {
          x: coords.target[0],
          y: coords.target[1],
          z: coords.target[2],
          duration: 1.2,
          ease: 'power3.out'
        });
      } else {
        camera.position.set(...coords.pos);
        cameraTarget.set(...coords.target);
      }
    };

    const exitCloseUp = (animate = true) => {
      if (!isManualCloseUpActive) return;
      isManualCloseUpActive = false;

      const activeConfig = timelineConfig.scenes[activeSceneIndex] || timelineConfig.scenes[0];
      let returnPos = [0, 0.05, 5.0];
      let returnTarget = [0, 0, 0];

      if (preCloseUpCamState) {
        returnPos = [preCloseUpCamState.pos.x, preCloseUpCamState.pos.y, preCloseUpCamState.pos.z];
        returnTarget = [preCloseUpCamState.target.x, preCloseUpCamState.target.y, preCloseUpCamState.target.z];
      } else if (activeConfig.camera) {
        returnPos = activeConfig.camera.pos;
        returnTarget = activeConfig.camera.target;
      } else if (activeConfig.cameraEnd) {
        returnPos = activeConfig.cameraEnd.pos;
        returnTarget = activeConfig.cameraEnd.target || [0, 0, 0];
      }

      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(cameraTarget);

      if (animate) {
        gsap.to(camera.position, {
          x: returnPos[0],
          y: returnPos[1],
          z: returnPos[2],
          duration: 1.2,
          ease: 'power2.out'
        });
        gsap.to(cameraTarget, {
          x: returnTarget[0],
          y: returnTarget[1],
          z: returnTarget[2],
          duration: 1.2,
          ease: 'power2.out'
        });
      } else {
        camera.position.set(...returnPos);
        cameraTarget.set(...returnTarget);
      }

      preCloseUpCamState = null;
    };

    // Connect imperative methods to bridge
    threeBridgeRef.current = {
      enterCloseUp,
      exitCloseUp,
      setSandboxModel: (model) => {
        if (spartanPivot) spartanPivot.visible = (model === 'spartan');
        if (riflePivot) {
          riflePivot.visible = (model === 'rifle');
          if (model === 'rifle') {
            riflePivot.position.set(0, 1.2, 0);
            riflePivot.rotation.set(0, 0, 0);
          }
        }
        if (machinegunPivot) {
          machinegunPivot.visible = (model === 'machinegun');
          if (model === 'machinegun') {
            machinegunPivot.position.set(0, 1.1, 0);
            machinegunPivot.rotation.set(0, 0, 0);
          }
        }
      },
      setSandboxLight: (preset) => {
        applyLighting(preset);
      },
      setSandboxPreset: (preset) => {
        const presets = {
          HERO: { pos: [0, 0.1, 4.2], target: [0, 0, 0] },
          VISOR: { pos: [0, 0.65, 1.4], target: [0, 0.65, 0] },
          REAR: { pos: [0, 0.1, -4.2], target: [0, 0, 0] },
          FULL: { pos: [0, 0.0, 4.8], target: [0, 0, 0] }
        };
        const p = presets[preset] || presets.HERO;
        gsap.to(camera.position, {
          x: p.pos[0],
          y: p.pos[1],
          z: p.pos[2],
          duration: 1.0,
          ease: 'power2.inOut'
        });
        gsap.to(controls.target, {
          x: p.target[0],
          y: p.target[1],
          z: p.target[2],
          duration: 1.0,
          ease: 'power2.inOut'
        });
      },
      triggerStartGame: () => {
        gsap.to(camera.position, {
          x: 0,
          y: 0.68,
          z: 0.15,
          duration: 1.4,
          ease: 'power4.in',
          onComplete: () => {
            setIsDawnFlash(true);
            setTimeout(() => {
              setIsDawnFlash(false);
              navigate('/play');
            }, 600);
          }
        });
      }

    };

    // --- 6. Load Assets Async ---
    const loadAssets = async () => {
      setPreloadProgress(20);

      spartanPivot = await loadNormalizedModel('spartan');
      spartanPivot.name = 'spartan-hero';
      scene.add(spartanPivot);
      setPreloadProgress(50);

      riflePivot = await loadNormalizedModel('rifle');
      riflePivot.name = 'rifle-weapon';
      riflePivot.visible = false;
      scene.add(riflePivot);
      setPreloadProgress(75);

      machinegunPivot = await loadNormalizedModel('machinegun');
      machinegunPivot.name = 'heavy-machinegun';
      machinegunPivot.visible = false;
      scene.add(machinegunPivot);
      setPreloadProgress(90);

      worldMap = createTacticalWorldMap();
      worldMap.visible = false;
      scene.add(worldMap);

      particles = createParticleSystems();
      scene.add(particles);

      setPreloadProgress(100);
      setTimeout(() => {
        setIsPreloadDone(true);
      }, 350);

      buildScrollTriggers();
    };

    // --- 7. Master Timeline / ScrollTriggers ---
    const triggers = [];

    const buildScrollTriggers = () => {
      const scenes = timelineConfig.scenes;
      const sceneElements = document.querySelectorAll('.film-scene');

      sceneElements.forEach((el, index) => {
        const config = scenes[index];
        if (!config) return;

        // 1. Scene Controller Trigger (coordinates 3D models and lighting)
        const st = ScrollTrigger.create({
          trigger: el,
          start: 'top center',
          end: 'bottom center',
          onEnter: () => onSceneEnter(config, index),
          onEnterBack: () => onSceneEnter(config, index),
          onUpdate: (self) => onSceneProgress(config, index, self.progress)
        });
        triggers.push(st);

        // 2. Parallax Depth Scrub on Giant Background Typography
        const bgWord = el.querySelector('.giant-bg-word');
        if (bgWord) {
          const bgTween = gsap.fromTo(
            bgWord,
            { y: -70 },
            {
              y: 70,
              ease: 'none',
              scrollTrigger: {
                trigger: el,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1.2
              }
            }
          );
          if (bgTween.scrollTrigger) triggers.push(bgTween.scrollTrigger);
        }

        // 3. Cinematic Entrance Stagger & Fade-In for Editorial Elements
        const animElements = el.querySelectorAll(
          '.caption-tracked, .scene-statement, .display-title-stagger .title-line, .display-title-large, .finale-title, .red-accent-bar, .scene-body-text, .stats-panel-card, .heavy-weapon-card, .sandbox-instructions-card, .ancient-quote-block, .cinematic-photo-strip, .weapon-specs-strip, .tactical-callout, .start-game-wrapper'
        );

        if (animElements.length > 0) {
          gsap.set(animElements, { y: 35, opacity: 0 });

          const entranceTl = gsap.to(animElements, {
            y: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.08,
            ease: 'power3.out',
            paused: true
          });

          const entranceSt = ScrollTrigger.create({
            trigger: el,
            start: 'top 75%',
            end: 'bottom 25%',
            onEnter: () => entranceTl.play(),
            onEnterBack: () => entranceTl.play(),
            onLeave: () => gsap.to(animElements, { opacity: 0.25, y: -15, duration: 0.5, ease: 'power2.in' }),
            onLeaveBack: () => gsap.to(animElements, { opacity: 0, y: 35, duration: 0.5, ease: 'power2.in' })
          });
          triggers.push(entranceSt);
        }
      });

      // Master scroll progress
      const scrollContainer = document.getElementById('film-scroll-container');
      if (scrollContainer) {
        const masterSt = ScrollTrigger.create({
          trigger: scrollContainer,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          onUpdate: (self) => {
            setScrollProgress(self.progress);
          }
        });
        triggers.push(masterSt);
      }
    };

    const onSceneEnter = (config, index) => {
      activeSceneIndex = index;
      setActiveSceneIndex(index);
      setActiveAct(config.act);
      setActiveChapter(config.chapter);
      setActiveSceneName(config.name);

      // Theme
      if (config.theme === 'charcoal') {
        document.body.classList.add('theme-charcoal');
        document.body.classList.remove('theme-light');
        applyLighting('nightBattle');
      } else {
        document.body.classList.add('theme-light');
        document.body.classList.remove('theme-charcoal');
        applyLighting('studioLight');
      }

      // Stats animation (Scene 04)
      if (config.id === 'scene04' && !statsAnimated) {
        statsAnimated = true;
        const targets = { cohesion: 0, resistance: 0, velocity: 0, hardness: 0 };
        gsap.to(targets, {
          cohesion: 99.8,
          resistance: 14200,
          velocity: 36,
          hardness: 65,
          duration: 1.8,
          ease: 'power2.out',
          onUpdate: () => {
            setStats({
              cohesion: `${targets.cohesion.toFixed(1)}%`,
              resistance: `${Math.floor(targets.resistance).toLocaleString()} N`,
              velocity: `${Math.floor(targets.velocity)} m/s`,
              hardness: `${Math.floor(targets.hardness)} HRC`
            });
          }
        });
      }

      // Heartbeat & Stand timer (Scene 10)
      if (config.id === 'scene10') {
        startHeartbeat();
        setIsHeartbeatActive(true);
        document.body.classList.add('heartbeat-active');
        if (!standTimerInterval) {
          let seconds = 0;
          standTimerInterval = setInterval(() => {
            seconds += 7;
            if (seconds > 360) seconds = 360;
            const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
            const secs = (seconds % 60).toString().padStart(2, '0');
            setStandTime(`${mins}:${secs} / 06:00`);
            if (seconds >= 360) clearInterval(standTimerInterval);
          }, 120);
        }
      } else {
        stopHeartbeat();
        setIsHeartbeatActive(false);
        document.body.classList.remove('heartbeat-active');
        if (standTimerInterval) {
          clearInterval(standTimerInterval);
          standTimerInterval = null;
        }
      }

      // Dawn Flash (Scene 11)
      if (config.id === 'scene11') {
        setIsDawnFlash(true);
        setTimeout(() => setIsDawnFlash(false), 900);
      }

      // Model visibility & smooth transitions (No racing onComplete callbacks to prevent flashing/blinking)
      if (spartanPivot) {
        const isSpartanTargetVisible = Boolean(config.spartan && config.spartan.opacity !== 0);
        gsap.killTweensOf(spartanPivot.position);
        gsap.killTweensOf(spartanPivot.scale);

        if (isSpartanTargetVisible) {
          spartanPivot.visible = true;

          const targetPos = config.spartan.pos || [0, 0, 0];
          const targetScale = config.spartan.scale || 0.82;

          gsap.to(spartanPivot.position, {
            x: targetPos[0],
            y: targetPos[1],
            z: targetPos[2],
            duration: 0.8,
            ease: 'power2.out',
            overwrite: 'auto'
          });

          gsap.to(spartanPivot.scale, {
            x: targetScale,
            y: targetScale,
            z: targetScale,
            duration: 0.8,
            ease: 'power2.out',
            overwrite: 'auto'
          });
        } else {
          // Instantly toggle off visibility when scene dictates opacity 0, prevent position leap thrash
          spartanPivot.visible = false;
        }
      }

      if (riflePivot) {
        const isRifleTargetVisible = Boolean(config.rifle && config.rifle.visible);
        gsap.killTweensOf(riflePivot.position);
        gsap.killTweensOf(riflePivot.rotation);
        gsap.killTweensOf(riflePivot.scale);

        if (isRifleTargetVisible) {
          riflePivot.visible = true;

          const targetPos = config.rifle.pos || [0, 0, 0];
          const targetRot = config.rifle.rot || [0, 0, 0];
          const baseScale = riflePivot.userData.baseScale || 1.0;
          const targetScale = baseScale * (config.rifle.scale !== undefined ? config.rifle.scale : 1.0);

          gsap.to(riflePivot.position, {
            x: targetPos[0],
            y: targetPos[1],
            z: targetPos[2],
            duration: 0.8,
            ease: 'power2.out',
            overwrite: 'auto'
          });

          gsap.to(riflePivot.rotation, {
            x: targetRot[0],
            y: targetRot[1],
            z: targetRot[2],
            duration: 0.8,
            ease: 'power2.out',
            overwrite: 'auto'
          });

          gsap.to(riflePivot.scale, {
            x: targetScale,
            y: targetScale,
            z: targetScale,
            duration: 0.8,
            ease: 'power2.out',
            overwrite: 'auto'
          });
        } else {
          riflePivot.visible = false;
        }
      }

      if (machinegunPivot) {
        const isMachinegunTargetVisible = Boolean(config.machinegun && config.machinegun.visible);
        gsap.killTweensOf(machinegunPivot.position);
        gsap.killTweensOf(machinegunPivot.rotation);
        gsap.killTweensOf(machinegunPivot.scale);

        if (isMachinegunTargetVisible) {
          machinegunPivot.visible = true;

          const targetPos = config.machinegun.pos || [0, 0, 0];
          const targetRot = config.machinegun.rot || [0, 0, 0];
          const baseScale = machinegunPivot.userData.baseScale || 1.0;
          const targetScale = baseScale * (config.machinegun.scale !== undefined ? config.machinegun.scale : 1.0);

          gsap.to(machinegunPivot.position, {
            x: targetPos[0],
            y: targetPos[1],
            z: targetPos[2],
            duration: 0.8,
            ease: 'power2.out',
            overwrite: 'auto'
          });

          gsap.to(machinegunPivot.rotation, {
            x: targetRot[0],
            y: targetRot[1],
            z: targetRot[2],
            duration: 0.8,
            ease: 'power2.out',
            overwrite: 'auto'
          });

          gsap.to(machinegunPivot.scale, {
            x: targetScale,
            y: targetScale,
            z: targetScale,
            duration: 0.8,
            ease: 'power2.out',
            overwrite: 'auto'
          });
        } else {
          machinegunPivot.visible = false;
        }
      }

      if (worldMap) {
        worldMap.visible = !!(config.map && config.map.visible);
      }

      // Sandbox controls
      isSandboxActive = !!config.isSandbox;
      if (controls) {
        controls.enabled = isSandboxActive;
        if (isSandboxActive) {
          controls.target.copy(cameraTarget);
        }
      }

      // Camera positioning interpolation
      if (!isSandboxActive && !isManualCloseUpActive) {
        const targetCamPos = config.cameraStart ? config.cameraStart.pos : (config.camera ? config.camera.pos : [0, 0.05, 5.0]);
        const targetLook = config.cameraStart ? config.cameraStart.target : (config.camera ? config.camera.target : [0, 0, 0]);

        gsap.to(camera.position, {
          x: targetCamPos[0],
          y: targetCamPos[1],
          z: targetCamPos[2],
          duration: 1.4,
          ease: 'power2.out'
        });

        gsap.to(cameraTarget, {
          x: targetLook[0],
          y: targetLook[1],
          z: targetLook[2],
          duration: 1.4,
          ease: 'power2.out'
        });
      }

      // Muzzle flash in Scene 08
      if (config.id === 'scene08') {
        triggerMuzzlePulse();
      }
    };

    const onSceneProgress = (config, index, progress) => {
      if (isSandboxActive) return;

      // Scene 02: Turntable rotation & dolly-in
      if (config.id === 'scene02' && spartanPivot) {
        spartanPivot.rotation.y = -Math.PI + progress * (Math.PI * 1.15);
        if (config.cameraStart && config.cameraEnd) {
          camera.position.x = gsap.utils.interpolate(config.cameraStart.pos[0], config.cameraEnd.pos[0], progress);
          camera.position.y = gsap.utils.interpolate(config.cameraStart.pos[1], config.cameraEnd.pos[1], progress);
          camera.position.z = gsap.utils.interpolate(config.cameraStart.pos[2], config.cameraEnd.pos[2], progress);

          if (config.cameraStart.target && config.cameraEnd.target) {
            cameraTarget.x = gsap.utils.interpolate(config.cameraStart.target[0], config.cameraEnd.target[0], progress);
            cameraTarget.y = gsap.utils.interpolate(config.cameraStart.target[1], config.cameraEnd.target[1], progress);
            cameraTarget.z = gsap.utils.interpolate(config.cameraStart.target[2], config.cameraEnd.target[2], progress);
          }
        }
      }

      // Scene 03: Macro close-up scroll swoops
      if (config.id === 'scene03') {
        if (isManualCloseUpActive) return;

        const startPos = config.cameraStart ? config.cameraStart.pos : [0.0, -0.05, 4.4];
        const startTarget = config.cameraStart ? config.cameraStart.target : [0.0, -0.05, 0];
        const closeUpPos = config.cameraCloseUp ? config.cameraCloseUp.pos : [-0.14, 0.53, 1.12];
        const closeUpTarget = config.cameraCloseUp ? config.cameraCloseUp.target : [-0.20, 0.52, 0];
        const endPos = config.cameraEnd ? config.cameraEnd.pos : [-0.25, -0.05, 4.6];
        const endTarget = config.cameraEnd ? config.cameraEnd.target : [-0.25, -0.05, 0];

        if (progress <= 0.38) {
          const t = gsap.parseEase('power2.inOut')(progress / 0.38);
          camera.position.x = gsap.utils.interpolate(startPos[0], closeUpPos[0], t);
          camera.position.y = gsap.utils.interpolate(startPos[1], closeUpPos[1], t);
          camera.position.z = gsap.utils.interpolate(startPos[2], closeUpPos[2], t);

          cameraTarget.x = gsap.utils.interpolate(startTarget[0], closeUpTarget[0], t);
          cameraTarget.y = gsap.utils.interpolate(startTarget[1], closeUpTarget[1], t);
          cameraTarget.z = gsap.utils.interpolate(startTarget[2], closeUpTarget[2], t);
        } else if (progress <= 0.62) {
          const t = (progress - 0.38) / 0.24;
          const driftX = Math.sin(t * Math.PI) * 0.05;
          const driftY = Math.sin(t * Math.PI) * 0.015;
          camera.position.x = closeUpPos[0] + driftX;
          camera.position.y = closeUpPos[1] + driftY;
          camera.position.z = closeUpPos[2];

          cameraTarget.x = closeUpTarget[0];
          cameraTarget.y = closeUpTarget[1];
          cameraTarget.z = closeUpTarget[2];
        } else {
          const t = gsap.parseEase('power2.inOut')((progress - 0.62) / 0.38);
          camera.position.x = gsap.utils.interpolate(closeUpPos[0], endPos[0], t);
          camera.position.y = gsap.utils.interpolate(closeUpPos[1], endPos[1], t);
          camera.position.z = gsap.utils.interpolate(closeUpPos[2], endPos[2], t);

          cameraTarget.x = gsap.utils.interpolate(closeUpTarget[0], endTarget[0], t);
          cameraTarget.y = gsap.utils.interpolate(closeUpTarget[1], endTarget[1], t);
          cameraTarget.z = gsap.utils.interpolate(closeUpTarget[2], endTarget[2], t);
        }

        if (spartanPivot) {
          spartanPivot.rotation.y = -0.35 + Math.sin(progress * Math.PI) * 0.12;
        }
      }

      // Scene 06: Tactical Map bloom
      if (config.id === 'scene06' && worldMap && worldMap.updateBloom) {
        worldMap.updateBloom(progress);
      }

      // Scene 07: Rifle Spin
      if (config.id === 'scene07' && riflePivot) {
        riflePivot.rotation.y = 0.6 + progress * Math.PI * 1.5;
        riflePivot.rotation.z = 0.35 + Math.sin(progress * Math.PI) * 0.2;
      }

      // Scene 08: Heavy Machine Gun spin
      if (config.id === 'scene08' && machinegunPivot) {
        machinegunPivot.rotation.y = -0.4 + progress * Math.PI * 2.0;
      }

      // Scene 10: Camera circling Spartan in Last Stand
      if (config.id === 'scene10' && config.cameraStart && config.cameraEnd) {
        const angle = progress * Math.PI * 1.2;
        const radius = 3.8;
        camera.position.x = Math.sin(angle) * radius;
        camera.position.z = Math.cos(angle) * radius;
        camera.position.y = 0.05;
      }

      // Scene 13: Finale weapons slow orbit
      if (config.id === 'scene13' && riflePivot && machinegunPivot) {
        const t = Date.now() * 0.001;
        riflePivot.position.x = Math.cos(t) * 1.3;
        riflePivot.position.z = Math.sin(t) * 0.9;
        machinegunPivot.position.x = Math.cos(t + Math.PI) * 1.3;
        machinegunPivot.position.z = Math.sin(t + Math.PI) * 0.9;
      }
    };

    // --- 8. Resize Handler ---
    const onResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, timelineConfig.global.dprCap));
    };
    window.addEventListener('resize', onResize);

    // Smooth camera damping variables
    const currentCamPos = new THREE.Vector3().copy(camera.position);
    const currentCamTarget = new THREE.Vector3().copy(cameraTarget);

    // --- 9. Render Loop ---
    const render = () => {
      if (isDisposed) return;
      animFrameId = requestAnimationFrame(render);

      const delta = Math.min(clock.getDelta(), 0.1);

      if (controls && controls.enabled) {
        controls.update();
      } else {
        // Silky smooth lerp to cameraTarget to avoid camera jitter/flicker
        currentCamTarget.lerp(cameraTarget, 0.12);
        camera.lookAt(currentCamTarget);
      }

      if (contactShadow && spartanPivot) {
        contactShadow.position.x = spartanPivot.position.x;
        contactShadow.position.z = spartanPivot.position.z;
      }

      if (particles && particles.tick) {
        const activeConfig = timelineConfig.scenes[activeSceneIndex] || {};
        particles.tick(delta, activeConfig.id, 0.5);
      }

      if (activeSceneIndex === 12 && riflePivot && machinegunPivot) {
        const t = Date.now() * 0.0012;
        riflePivot.position.x = Math.cos(t) * 1.35;
        riflePivot.position.z = Math.sin(t) * 0.95;
        riflePivot.rotation.y += delta * 0.5;

        machinegunPivot.position.x = Math.cos(t + Math.PI) * 1.35;
        machinegunPivot.position.z = Math.sin(t + Math.PI) * 0.95;
        machinegunPivot.rotation.y += delta * 0.5;
      }

      renderer.render(scene, camera);
    };

    // Begin Loading & Render Loop
    loadAssets();
    render();

    // Cleanup on component unmount
    return () => {
      isDisposed = true;
      if (animFrameId) cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', onResize);

      triggers.forEach(t => t.kill());
      gsap.ticker.remove(onGsapTicker);
      lenis.destroy();

      if (standTimerInterval) clearInterval(standTimerInterval);
      stopHeartbeat();

      controls.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} id="webgl-viewport" className="webgl-viewport" />;
}
