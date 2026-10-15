/**
 * SPARTAN: LAST LINE
 * Master 3D Scrollytelling Engine
 * Vite + Three.js + GSAP ScrollTrigger + Lenis
 */

import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { timelineConfig } from './timeline.config.js';
import { loadNormalizedModel } from './utils/modelLoader.js';
import { createTacticalWorldMap } from './utils/worldMap.js';
import { createParticleSystems } from './utils/particles.js';
import { initAudio, toggleAudio, getAudioState, playTacticalClick, playMuzzleFlash } from './utils/audio.js';
import { SceneManager } from './scenes/sceneManager.js';

gsap.registerPlugin(ScrollTrigger);

class SpartanExperience {
  constructor() {
    this.container = document.getElementById('webgl-viewport');
    this.sceneManager = new SceneManager();

    // Three.js Core
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.clock = new THREE.Clock();

    // Models & Systems
    this.spartanPivot = null;
    this.riflePivot = null;
    this.machinegunPivot = null;
    this.worldMap = null;
    this.particles = null;
    this.contactShadow = null;

    // Studio Lighting Rig
    this.ambientLight = null;
    this.keyLight = null;
    this.fillLight = null;
    this.rimLight = null;
    this.redPointLight = null;

    // State Tracking
    this.activeSceneIndex = 0;
    this.activeModel = 'spartan'; // For sandbox
    this.currentLighting = 'studioLight';
    this.isSandboxActive = false;
    this.cameraTarget = new THREE.Vector3(0, 0, 0);

    // Extreme Close-up & Macro Mode State
    this.isManualCloseUpActive = false;
    this.currentCloseUpArea = 'visor';
    this.preCloseUpCamState = null;

    // Lenis Smooth Scroll
    this.lenis = null;

    this.init();
  }

  async init() {
    this.initThree();
    this.initLighting();
    this.initContactShadow();
    this.initLenis();
    this.initCustomCursor();
    this.initHUD();
    this.initCloseUpControls();

    // Load 3D Models & Particle Systems
    await this.loadSceneAssets();

    // Build Master Scrollytelling Timeline
    this.buildMasterTimeline();

    // Wire Scene Manager Events
    this.setupSceneEvents();

    // Fade Out Preloader
    this.completePreload();

    // Master Render Loop
    this.render();
  }

  initThree() {
    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera (Fov 42 gives heroic cinematic compression)
    this.camera = new THREE.PerspectiveCamera(
      timelineConfig.global.cameraFov,
      window.innerWidth / window.innerHeight,
      timelineConfig.global.cameraNear,
      timelineConfig.global.cameraFar
    );
    this.camera.position.set(0, 0.05, 5.0);
    this.camera.lookAt(this.cameraTarget);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.container,
      alpha: true, // Transparent so CSS background (#EDEDEA / #121212) shows
      antialias: true,
      powerPreference: 'high-performance',
      precision: 'highp',
      logarithmicDepthBuffer: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. OrbitControls for Sandbox Mode
    this.controls = new OrbitControls(this.camera, document.body);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enabled = false; // Disabled by default, active in Scene 12
    this.controls.maxDistance = 7.0;
    this.controls.minDistance = 1.0;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.1;

    // Resize Handler
    window.addEventListener('resize', () => this.onResize());
  }

  initLighting() {
    const preset = timelineConfig.lightingPresets.studioLight;

    this.ambientLight = new THREE.AmbientLight(preset.ambient.color, preset.ambient.intensity);
    this.scene.add(this.ambientLight);

    // Large Key Softbox
    this.keyLight = new THREE.DirectionalLight(preset.key.color, preset.key.intensity);
    this.keyLight.position.set(...preset.key.pos);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.keyLight.shadow.bias = -0.0005;
    this.scene.add(this.keyLight);

    // Subtle Fill
    this.fillLight = new THREE.DirectionalLight(preset.fill.color, preset.fill.intensity);
    this.fillLight.position.set(...preset.fill.pos);
    this.scene.add(this.fillLight);

    // Cool Rim Light
    this.rimLight = new THREE.DirectionalLight(preset.rim.color, preset.rim.intensity);
    this.rimLight.position.set(...preset.rim.pos);
    this.scene.add(this.rimLight);

    // Stylized Red Point Light for Muzzle / Night
    this.redPointLight = new THREE.PointLight(preset.accentRed.color, 0, 10, 2);
    this.redPointLight.position.set(0, 1.5, 1.5);
    this.scene.add(this.redPointLight);
  }

  initContactShadow() {
    // Soft blurred circular shadow ground plane
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

    const texture = new THREE.CanvasTexture(shadowCanvas);
    const geo = new THREE.PlaneGeometry(3.5, 3.5);
    geo.rotateX(-Math.PI / 2);

    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.65,
      depthWrite: false
    });

    this.contactShadow = new THREE.Mesh(geo, mat);
    this.contactShadow.position.y = -0.96;
    this.scene.add(this.contactShadow);
  }

  initLenis() {
    this.lenis = new Lenis({
      lerp: 0.08,
      wheelMultiplier: 0.9,
      smoothWheel: true,
      normalizeWheel: true
    });

    this.lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      this.lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  async loadSceneAssets() {
    const counterEl = document.getElementById('preloader-counter');
    const barEl = document.getElementById('preloader-progress');

    const updateProgress = (pct) => {
      if (counterEl) counterEl.textContent = `${pct.toString().padStart(3, '0')}%`;
      if (barEl) barEl.style.width = `${pct}%`;
    };

    updateProgress(15);
    // 1. Spartan Hero Model
    this.spartanPivot = await loadNormalizedModel('spartan');
    this.spartanPivot.name = 'spartan-hero';
    this.scene.add(this.spartanPivot);
    updateProgress(45);

    // 2. Assault Rifle Model
    this.riflePivot = await loadNormalizedModel('rifle');
    this.riflePivot.name = 'rifle-weapon';
    this.riflePivot.visible = false;
    this.scene.add(this.riflePivot);
    updateProgress(70);

    // 3. Heavy Machine Gun Model
    this.machinegunPivot = await loadNormalizedModel('machinegun');
    this.machinegunPivot.name = 'heavy-machinegun';
    this.machinegunPivot.visible = false;
    this.scene.add(this.machinegunPivot);
    updateProgress(85);

    // 4. Tactical World Map Plane
    this.worldMap = createTacticalWorldMap();
    this.worldMap.visible = false;
    this.scene.add(this.worldMap);

    // 5. Particle Systems
    this.particles = createParticleSystems();
    this.scene.add(this.particles);
    updateProgress(100);
  }

  buildMasterTimeline() {
    const scenes = timelineConfig.scenes;
    const sceneElements = document.querySelectorAll('.film-scene');

    // Create ScrollTrigger for each scene
    sceneElements.forEach((el, index) => {
      const config = scenes[index];
      if (!config) return;

      ScrollTrigger.create({
        trigger: el,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => this.onSceneEnter(config, index),
        onEnterBack: () => this.onSceneEnter(config, index),
        onUpdate: (self) => this.onSceneProgress(config, index, self.progress)
      });
    });

    // Master Scroll Progress Line
    const lineFill = document.getElementById('progress-line-fill');
    ScrollTrigger.create({
      trigger: '#film-scroll-container',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        if (lineFill) {
          lineFill.style.height = `${(self.progress * 100).toFixed(1)}%`;
        }
      }
    });
  }

  onSceneEnter(config, index) {
    this.activeSceneIndex = index;
    this.sceneManager.setActiveScene(config, index);

    // Update Lighting
    this.applyLighting(config.theme === 'charcoal' ? 'nightBattle' : 'studioLight');

    // Model Visibility Management
    if (this.spartanPivot) {
      this.spartanPivot.visible = (config.spartan && config.spartan.opacity !== 0);
      if (config.spartan && config.spartan.pos) {
        gsap.to(this.spartanPivot.position, {
          x: config.spartan.pos[0],
          y: config.spartan.pos[1],
          z: config.spartan.pos[2],
          duration: 1.2,
          ease: 'power2.out'
        });
      }
      if (config.spartan && config.spartan.scale) {
        gsap.to(this.spartanPivot.scale, {
          x: config.spartan.scale,
          y: config.spartan.scale,
          z: config.spartan.scale,
          duration: 1.2,
          ease: 'power2.out'
        });
      }
    }

    if (this.riflePivot) {
      this.riflePivot.visible = !!(config.rifle && config.rifle.visible);
      if (config.rifle && config.rifle.pos) {
        gsap.to(this.riflePivot.position, {
          x: config.rifle.pos[0],
          y: config.rifle.pos[1],
          z: config.rifle.pos[2],
          duration: 1.0,
          ease: 'power2.out'
        });
      }
      if (config.rifle && config.rifle.rot) {
        gsap.to(this.riflePivot.rotation, {
          x: config.rifle.rot[0],
          y: config.rifle.rot[1],
          z: config.rifle.rot[2],
          duration: 1.0,
          ease: 'power2.out'
        });
      }
    }

    if (this.machinegunPivot) {
      this.machinegunPivot.visible = !!(config.machinegun && config.machinegun.visible);
      if (config.machinegun && config.machinegun.pos) {
        gsap.to(this.machinegunPivot.position, {
          x: config.machinegun.pos[0],
          y: config.machinegun.pos[1],
          z: config.machinegun.pos[2],
          duration: 1.0,
          ease: 'power2.out'
        });
      }
      if (config.machinegun && config.machinegun.rot) {
        gsap.to(this.machinegunPivot.rotation, {
          x: config.machinegun.rot[0],
          y: config.machinegun.rot[1],
          z: config.machinegun.rot[2],
          duration: 1.0,
          ease: 'power2.out'
        });
      }
    }

    if (this.worldMap) {
      this.worldMap.visible = !!(config.map && config.map.visible);
    }

    // Toggle OrbitControls in Sandbox (Scene 12)
    this.isSandboxActive = !!config.isSandbox;
    if (this.controls) {
      this.controls.enabled = this.isSandboxActive;
      if (this.isSandboxActive) {
        this.controls.target.copy(this.cameraTarget);
      }
    }

    // Camera Positioning Interpolation
    if (!this.isSandboxActive && !this.isManualCloseUpActive) {
      const targetCamPos = config.cameraStart ? config.cameraStart.pos : (config.camera ? config.camera.pos : [0, 0.05, 5.0]);
      const targetLook = config.cameraStart ? config.cameraStart.target : (config.camera ? config.camera.target : [0, 0, 0]);

      gsap.to(this.camera.position, {
        x: targetCamPos[0],
        y: targetCamPos[1],
        z: targetCamPos[2],
        duration: 1.4,
        ease: 'power2.out'
      });

      gsap.to(this.cameraTarget, {
        x: targetLook[0],
        y: targetLook[1],
        z: targetLook[2],
        duration: 1.4,
        ease: 'power2.out'
      });
    }

    // Muzzle Flash Pulse in Scene 08
    if (config.id === 'scene08') {
      this.triggerMuzzlePulse();
    }
  }

  onSceneProgress(config, index, progress) {
    if (this.isSandboxActive) return;

    // Continuous Scrubbing Animations for specific scenes:

    // Scene 02: Turntable rotation & dolly-in towards visor
    if (config.id === 'scene02' && this.spartanPivot) {
      this.spartanPivot.rotation.y = -Math.PI + progress * (Math.PI * 1.15);
      if (config.cameraStart && config.cameraEnd) {
        this.camera.position.x = gsap.utils.interpolate(config.cameraStart.pos[0], config.cameraEnd.pos[0], progress);
        this.camera.position.y = gsap.utils.interpolate(config.cameraStart.pos[1], config.cameraEnd.pos[1], progress);
        this.camera.position.z = gsap.utils.interpolate(config.cameraStart.pos[2], config.cameraEnd.pos[2], progress);

        if (config.cameraStart.target && config.cameraEnd.target) {
          this.cameraTarget.x = gsap.utils.interpolate(config.cameraStart.target[0], config.cameraEnd.target[0], progress);
          this.cameraTarget.y = gsap.utils.interpolate(config.cameraStart.target[1], config.cameraEnd.target[1], progress);
          this.cameraTarget.z = gsap.utils.interpolate(config.cameraStart.target[2], config.cameraEnd.target[2], progress);
        }
      }
    }

    // Scene 03: Dynamic scroll sequence with Extreme Close-Up on Helmet & Visor, then zoom out to normal
    if (config.id === 'scene03') {
      if (this.isManualCloseUpActive) return;

      const startPos = config.cameraStart ? config.cameraStart.pos : [0.0, -0.05, 4.4];
      const startTarget = config.cameraStart ? config.cameraStart.target : [0.0, -0.05, 0];
      const closeUpPos = config.cameraCloseUp ? config.cameraCloseUp.pos : [-0.14, 0.53, 1.12];
      const closeUpTarget = config.cameraCloseUp ? config.cameraCloseUp.target : [-0.20, 0.52, 0];
      const endPos = config.cameraEnd ? config.cameraEnd.pos : [-0.25, -0.05, 4.6];
      const endTarget = config.cameraEnd ? config.cameraEnd.target : [-0.25, -0.05, 0];

      if (progress <= 0.38) {
        // Phase 1: Swoop into extreme macro close-up of helmet & visor
        const t = gsap.parseEase('power2.inOut')(progress / 0.38);
        this.camera.position.x = gsap.utils.interpolate(startPos[0], closeUpPos[0], t);
        this.camera.position.y = gsap.utils.interpolate(startPos[1], closeUpPos[1], t);
        this.camera.position.z = gsap.utils.interpolate(startPos[2], closeUpPos[2], t);

        this.cameraTarget.x = gsap.utils.interpolate(startTarget[0], closeUpTarget[0], t);
        this.cameraTarget.y = gsap.utils.interpolate(startTarget[1], closeUpTarget[1], t);
        this.cameraTarget.z = gsap.utils.interpolate(startTarget[2], closeUpTarget[2], t);
      } else if (progress <= 0.62) {
        // Phase 2: Hold extreme close-up with subtle macro drift across golden visor
        const t = (progress - 0.38) / 0.24;
        const driftX = Math.sin(t * Math.PI) * 0.05;
        const driftY = Math.sin(t * Math.PI) * 0.015;
        this.camera.position.x = closeUpPos[0] + driftX;
        this.camera.position.y = closeUpPos[1] + driftY;
        this.camera.position.z = closeUpPos[2];

        this.cameraTarget.x = closeUpTarget[0];
        this.cameraTarget.y = closeUpTarget[1];
        this.cameraTarget.z = closeUpTarget[2];
      } else {
        // Phase 3: Zoom out smoothly back to normal full-view framing ready for Scene 04
        const t = gsap.parseEase('power2.inOut')((progress - 0.62) / 0.38);
        this.camera.position.x = gsap.utils.interpolate(closeUpPos[0], endPos[0], t);
        this.camera.position.y = gsap.utils.interpolate(closeUpPos[1], endPos[1], t);
        this.camera.position.z = gsap.utils.interpolate(closeUpPos[2], endPos[2], t);

        this.cameraTarget.x = gsap.utils.interpolate(closeUpTarget[0], endTarget[0], t);
        this.cameraTarget.y = gsap.utils.interpolate(closeUpTarget[1], endTarget[1], t);
        this.cameraTarget.z = gsap.utils.interpolate(closeUpTarget[2], endTarget[2], t);
      }

      if (this.spartanPivot) {
        this.spartanPivot.rotation.y = -0.35 + Math.sin(progress * Math.PI) * 0.12;
      }
    }

    // Scene 06: Tactical map bloom progress
    if (config.id === 'scene06' && this.worldMap && this.worldMap.updateBloom) {
      this.worldMap.updateBloom(progress);
    }

    // Scene 07: Rifle Spin on scroll
    if (config.id === 'scene07' && this.riflePivot) {
      this.riflePivot.rotation.y = 0.6 + progress * Math.PI * 1.5;
      this.riflePivot.rotation.z = 0.35 + Math.sin(progress * Math.PI) * 0.2;
    }

    // Scene 08: Machine gun 360 spin
    if (config.id === 'scene08' && this.machinegunPivot) {
      this.machinegunPivot.rotation.y = -0.4 + progress * Math.PI * 2.0;
    }

    // Scene 10: Camera circling Spartan in Last Stand
    if (config.id === 'scene10' && config.cameraStart && config.cameraEnd) {
      const angle = progress * Math.PI * 1.2;
      const radius = 3.8;
      this.camera.position.x = Math.sin(angle) * radius;
      this.camera.position.z = Math.cos(angle) * radius;
      this.camera.position.y = 0.05;
    }

    // Scene 13: Finale weapons slow orbit
    if (config.id === 'scene13' && this.riflePivot && this.machinegunPivot) {
      const t = Date.now() * 0.001;
      this.riflePivot.position.x = Math.cos(t) * 1.3;
      this.riflePivot.position.z = Math.sin(t) * 0.9;
      this.machinegunPivot.position.x = Math.cos(t + Math.PI) * 1.3;
      this.machinegunPivot.position.z = Math.sin(t + Math.PI) * 0.9;
    }
  }

  applyLighting(presetName) {
    const p = timelineConfig.lightingPresets[presetName] || timelineConfig.lightingPresets.studioLight;
    this.currentLighting = presetName;

    gsap.to(this.ambientLight, { intensity: p.ambient.intensity, duration: 0.8 });
    gsap.to(this.ambientLight.color, { r: ((p.ambient.color >> 16) & 255) / 255, g: ((p.ambient.color >> 8) & 255) / 255, b: (p.ambient.color & 255) / 255, duration: 0.8 });

    gsap.to(this.keyLight, { intensity: p.key.intensity, duration: 0.8 });
    gsap.to(this.keyLight.color, { r: ((p.key.color >> 16) & 255) / 255, g: ((p.key.color >> 8) & 255) / 255, b: (p.key.color & 255) / 255, duration: 0.8 });

    gsap.to(this.rimLight, { intensity: p.rim.intensity, duration: 0.8 });
    gsap.to(this.redPointLight, { intensity: p.accentRed.intensity, duration: 0.8 });
  }

  triggerMuzzlePulse() {
    playMuzzleFlash();
    if (!this.redPointLight) return;
    gsap.killTweensOf(this.redPointLight);
    this.redPointLight.intensity = 5.0;
    gsap.to(this.redPointLight, {
      intensity: 0,
      duration: 0.35,
      ease: 'power2.out'
    });
  }

  setupSceneEvents() {
    // 1. Sandbox Model Switching
    this.sceneManager.on('sandboxModelChange', (modelType) => {
      this.activeModel = modelType;
      if (this.spartanPivot) this.spartanPivot.visible = (modelType === 'spartan');
      if (this.riflePivot) {
        this.riflePivot.visible = (modelType === 'rifle');
        if (modelType === 'rifle') {
          this.riflePivot.position.set(0, 1.2, 0);
          this.riflePivot.rotation.set(0, 0, 0);
        }
      }
      if (this.machinegunPivot) {
        this.machinegunPivot.visible = (modelType === 'machinegun');
        if (modelType === 'machinegun') {
          this.machinegunPivot.position.set(0, 1.1, 0);
          this.machinegunPivot.rotation.set(0, 0, 0);
        }
      }
    });

    // 2. Sandbox Lighting Preset Switching
    this.sceneManager.on('sandboxLightChange', (lightPreset) => {
      this.applyLighting(lightPreset);
    });

    // 3. Sandbox Viewport Presets
    this.sceneManager.on('sandboxPresetChange', (preset) => {
      const presets = {
        HERO: { pos: [0, 0.1, 4.2], target: [0, 0, 0] },
        VISOR: { pos: [0, 0.65, 1.4], target: [0, 0.65, 0] },
        REAR: { pos: [0, 0.1, -4.2], target: [0, 0, 0] },
        FULL: { pos: [0, 0.0, 4.8], target: [0, 0, 0] }
      };
      const p = presets[preset] || presets.HERO;
      gsap.to(this.camera.position, {
        x: p.pos[0],
        y: p.pos[1],
        z: p.pos[2],
        duration: 1.0,
        ease: 'power2.inOut'
      });
      gsap.to(this.controls.target, {
        x: p.target[0],
        y: p.target[1],
        z: p.target[2],
        duration: 1.0,
        ease: 'power2.inOut'
      });
    });

    // 4. Finale Start Game Button Click
    this.sceneManager.on('startGameClicked', () => {
      // Camera pushes directly into Spartan gold visor + white flash
      gsap.to(this.camera.position, {
        x: 0,
        y: 0.68,
        z: 0.15,
        duration: 1.4,
        ease: 'power4.in',
        onComplete: () => {
          const flash = document.getElementById('dawn-flash');
          if (flash) {
            flash.classList.add('trigger-flash');
          }
          setTimeout(() => {
            alert('SPARTAN: LAST LINE — MISSION LAUNCHED\nRouting to /game...');
          }, 600);
        }
      });
    });
  }

  initHUD() {
    // Act Navigation Click to Jump
    const actButtons = document.querySelectorAll('.act-nav-item');
    actButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        playTacticalClick();
        const sceneIndex = parseInt(btn.getAttribute('data-scene'), 10) || 0;
        const targetScene = document.querySelectorAll('.film-scene')[sceneIndex];
        if (targetScene && this.lenis) {
          this.lenis.scrollTo(targetScene, { duration: 1.6 });
        }
      });
    });

    // Sound Toggle
    const soundBtn = document.getElementById('sound-toggle-btn');
    const soundText = document.getElementById('sound-btn-text');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        const active = toggleAudio();
        soundBtn.classList.toggle('active', active);
        if (soundText) {
          soundText.textContent = active ? 'SOUND [ON]' : 'SOUND [OFF]';
        }
      });
    }
  }

  getMacroTargetCoords(area = 'visor') {
    const sx = this.spartanPivot ? this.spartanPivot.position.x : -0.25;
    const sy = this.spartanPivot ? this.spartanPivot.position.y : 0;
    const sz = this.spartanPivot ? this.spartanPivot.position.z : 0;
    const scale = this.spartanPivot ? this.spartanPivot.scale.x : 0.82;
    const rotY = this.spartanPivot ? this.spartanPivot.rotation.y : 0;

    if (area === 'visor') {
      // Helmet & Visor local center: (0, 0.62, 0.08)
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
      // Chest Carapace local center: (0, 0.22, 0.08)
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
      // Shoulder / Side Armor local center: (0.28, 0.44, 0.0)
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

    // Default fallback to visor
    return {
      target: [sx, sy + 0.52 * scale, sz],
      pos: [sx + 0.08, sy + 0.54 * scale, sz + 1.12],
      name: 'HELMET & VISOR // OPTICAL SUBSYSTEM',
      mag: '4.8X',
      focal: '1.12 m'
    };
  }

  enterCloseUp(area = 'visor', animate = true) {
    if (this.isSandboxActive) return;

    this.isManualCloseUpActive = true;
    this.currentCloseUpArea = area;

    // Save previous camera state if not already in close-up
    if (!this.preCloseUpCamState) {
      this.preCloseUpCamState = {
        pos: this.camera.position.clone(),
        target: this.cameraTarget.clone()
      };
    }

    const coords = this.getMacroTargetCoords(area);

    // Camera animation into extreme macro close-up
    gsap.killTweensOf(this.camera.position);
    gsap.killTweensOf(this.cameraTarget);

    if (animate) {
      gsap.to(this.camera.position, {
        x: coords.pos[0],
        y: coords.pos[1],
        z: coords.pos[2],
        duration: 1.2,
        ease: 'power3.out'
      });
      gsap.to(this.cameraTarget, {
        x: coords.target[0],
        y: coords.target[1],
        z: coords.target[2],
        duration: 1.2,
        ease: 'power3.out'
      });
    } else {
      this.camera.position.set(...coords.pos);
      this.cameraTarget.set(...coords.target);
    }

    // Update UI Viewfinder & HUD
    const viewfinder = document.getElementById('macro-viewfinder');
    if (viewfinder) {
      viewfinder.classList.add('active');
      viewfinder.setAttribute('aria-hidden', 'false');
    }

    const targetNameEl = document.getElementById('viewfinder-target-name');
    if (targetNameEl) targetNameEl.textContent = coords.name;

    const magEl = document.getElementById('viewfinder-mag');
    if (magEl) magEl.textContent = coords.mag;

    const focalEl = document.getElementById('viewfinder-focal');
    if (focalEl) focalEl.textContent = coords.focal;

    // Update area chips active state
    document.querySelectorAll('.area-chip').forEach(chip => {
      const chipArea = chip.getAttribute('data-closeup');
      chip.classList.toggle('active', chipArea === area);
    });

    // Update HUD Macro button
    const macroBtnText = document.getElementById('macro-btn-text');
    const macroToggleBtn = document.getElementById('macro-toggle-btn');
    if (macroBtnText) macroBtnText.textContent = '[-] ZOOM OUT';
    if (macroToggleBtn) macroToggleBtn.classList.add('active');

    playTacticalClick();
  }

  exitCloseUp(animate = true) {
    if (!this.isManualCloseUpActive) return;
    this.isManualCloseUpActive = false;

    // Hide Viewfinder
    const viewfinder = document.getElementById('macro-viewfinder');
    if (viewfinder) {
      viewfinder.classList.remove('active');
      viewfinder.setAttribute('aria-hidden', 'true');
    }

    // Reset HUD Macro button
    const macroBtnText = document.getElementById('macro-btn-text');
    const macroToggleBtn = document.getElementById('macro-toggle-btn');
    if (macroBtnText) macroBtnText.textContent = '⌕ MACRO CLOSE-UP';
    if (macroToggleBtn) macroToggleBtn.classList.remove('active');

    // Calculate normal camera position for current active scene
    const activeConfig = timelineConfig.scenes[this.activeSceneIndex] || timelineConfig.scenes[0];
    let returnPos = [0, 0.05, 5.0];
    let returnTarget = [0, 0, 0];

    if (this.preCloseUpCamState) {
      returnPos = [this.preCloseUpCamState.pos.x, this.preCloseUpCamState.pos.y, this.preCloseUpCamState.pos.z];
      returnTarget = [this.preCloseUpCamState.target.x, this.preCloseUpCamState.target.y, this.preCloseUpCamState.target.z];
    } else if (activeConfig.camera) {
      returnPos = activeConfig.camera.pos;
      returnTarget = activeConfig.camera.target;
    } else if (activeConfig.cameraEnd) {
      returnPos = activeConfig.cameraEnd.pos;
      returnTarget = activeConfig.cameraEnd.target || [0, 0, 0];
    }

    gsap.killTweensOf(this.camera.position);
    gsap.killTweensOf(this.cameraTarget);

    if (animate) {
      gsap.to(this.camera.position, {
        x: returnPos[0],
        y: returnPos[1],
        z: returnPos[2],
        duration: 1.2,
        ease: 'power2.out'
      });
      gsap.to(this.cameraTarget, {
        x: returnTarget[0],
        y: returnTarget[1],
        z: returnTarget[2],
        duration: 1.2,
        ease: 'power2.out'
      });
    } else {
      this.camera.position.set(...returnPos);
      this.cameraTarget.set(...returnTarget);
    }

    this.preCloseUpCamState = null;
    playTacticalClick();
  }

  initCloseUpControls() {
    // 1. Interactive Callouts Click in Scene 03
    const calloutElements = document.querySelectorAll('.interactive-callout');
    calloutElements.forEach((el) => {
      const handler = (e) => {
        e.preventDefault();
        const area = el.getAttribute('data-closeup') || 'visor';
        this.enterCloseUp(area);
      };
      el.addEventListener('click', handler);
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') handler(e);
      });
    });

    // 2. HUD Top Bar Macro Toggle Button
    const macroToggleBtn = document.getElementById('macro-toggle-btn');
    if (macroToggleBtn) {
      macroToggleBtn.addEventListener('click', () => {
        if (this.isManualCloseUpActive) {
          this.exitCloseUp();
        } else {
          this.enterCloseUp(this.currentCloseUpArea || 'visor');
        }
      });
    }

    // 3. Viewfinder Exit / Zoom Out Button
    const zoomOutBtn = document.getElementById('viewfinder-zoomout-btn');
    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => this.exitCloseUp());
    }

    // 4. Viewfinder Area Switch Chips (Visor, Chest, Side)
    const areaChips = document.querySelectorAll('.area-chip');
    areaChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const area = chip.getAttribute('data-closeup');
        if (area) this.enterCloseUp(area);
      });
    });

    // 5. Escape Key to Exit Close-Up
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isManualCloseUpActive) {
        this.exitCloseUp();
      }
    });

    // 6. Lenis Scroll Velocity trigger: exit close-up gently if user scrolls
    if (this.lenis) {
      this.lenis.on('scroll', (e) => {
        if (this.isManualCloseUpActive && Math.abs(e.velocity) > 0.8) {
          this.exitCloseUp();
        }
      });
    }
  }

  initCustomCursor() {
    const cursor = document.getElementById('custom-cursor');
    if (!cursor) return;

    window.addEventListener('mousemove', (e) => {
      gsap.to(cursor, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.08,
        ease: 'power1.out'
      });
    });

    const hoverElements = document.querySelectorAll('button, a, .act-nav-item, .stat-row, .tactical-callout');
    hoverElements.forEach((el) => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
  }

  completePreload() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
      setTimeout(() => {
        preloader.classList.add('fade-out');
      }, 350);
    }
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, timelineConfig.global.dprCap));
  }

  render() {
    requestAnimationFrame(() => this.render());

    const delta = this.clock.getDelta();

    // 1. OrbitControls or Smooth LookAt
    if (this.controls && this.controls.enabled) {
      this.controls.update();
    } else {
      this.camera.lookAt(this.cameraTarget);
    }

    // Contact shadow follows Spartan
    if (this.contactShadow && this.spartanPivot) {
      this.contactShadow.position.x = this.spartanPivot.position.x;
      this.contactShadow.position.z = this.spartanPivot.position.z;
    }

    // 2. Particle Systems Update
    if (this.particles && this.particles.tick) {
      const activeConfig = timelineConfig.scenes[this.activeSceneIndex] || {};
      this.particles.tick(delta, activeConfig.id, 0.5);
    }

    // 3. Finale Orbit in Scene 13
    if (this.activeSceneIndex === 12 && this.riflePivot && this.machinegunPivot) {
      const t = Date.now() * 0.0012;
      this.riflePivot.position.x = Math.cos(t) * 1.35;
      this.riflePivot.position.z = Math.sin(t) * 0.95;
      this.riflePivot.rotation.y += delta * 0.5;

      this.machinegunPivot.position.x = Math.cos(t + Math.PI) * 1.35;
      this.machinegunPivot.position.z = Math.sin(t + Math.PI) * 0.95;
      this.machinegunPivot.rotation.y += delta * 0.5;
    }

    // 4. Render WebGL
    this.renderer.render(this.scene, this.camera);
  }
}

// Instantiate on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  new SpartanExperience();
});
