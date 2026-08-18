/* 
  FlowGuard AI — Capstone Prototype Application Logic
  Team NULL_TERMINATORS | KPC Cohort
  Featuring True 3D WebGL Centrifugal Pump Visualizer with Three.js
*/

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // --- STATE MANAGEMENT ---
  const state = {
    activeView: 'gis',
    activeRole: 'operator',
    selectedCompany: 'kpc',
    selectedFluid: 'ago',
    activeFault: 'bearing',
    selectedStation: 'PS7',
    selectedPumpPart: 'bearing',
    isTelemetryLive: true,
    audioMuted: false,
    syntheticTelemetry: {
      vibration: 4.82,
      temperature: 86.4,
      pressure: 48.20,
      current: 312.5,
      flowgardResidual: -1.80,
      rulHours: 142.5
    }
  };

  // Company Profiles Data
  const companies = {
    kpc: {
      name: 'Kenya Pipeline Co. (KPC Line 5)',
      pipelineLength: '1,342 km',
      currency: 'KES',
      throughput: '1,000,000 L/hr',
      stations: ['PS1 Mombasa', 'PS3 Mtito Andei', 'PS5 Sultan Hamud', 'PS6 Nairobi', 'PS7 Nakuru', 'PS9 Kisumu'],
      lossMultiplier: 1.0
    },
    taps: {
      name: 'Trans-Alaska Pipeline (TAPS)',
      pipelineLength: '1,287 km',
      currency: 'USD',
      throughput: '2,100,000 L/hr',
      stations: ['PS01 Valdez', 'PS04 Fairbanks', 'PS07 Yukon', 'PS10 Prudhoe Bay'],
      lossMultiplier: 0.0077
    },
    petrobras: {
      name: 'Petrobras Santos Basin Offshore',
      pipelineLength: '850 km',
      currency: 'BRL',
      throughput: '1,500,000 L/hr',
      stations: ['FPSO Carioca', 'P-70 Platform', 'Angra Depot'],
      lossMultiplier: 0.045
    },
    enbridge: {
      name: 'Enbridge Mainline Network',
      pipelineLength: '5,360 km',
      currency: 'USD',
      throughput: '3,200,000 L/hr',
      stations: ['Edmonton Terminal', 'Superior Station', 'Sarnia Terminal'],
      lossMultiplier: 0.0077
    }
  };

  // --- NAVIGATION TABS ---
  const navItems = document.querySelectorAll('.nav-item');
  const viewPanels = document.querySelectorAll('.view-panel');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const view = item.getAttribute('data-view');
      switchView(view);
    });
  });

  function switchView(viewName) {
    state.activeView = viewName;
    navItems.forEach(item => {
      if (item.getAttribute('data-view') === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    viewPanels.forEach(panel => {
      if (panel.id === `view-${viewName}`) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    // Refresh charts & 3D WebGL renderer when view activates
    if (viewName === 'scada' && flowgardChart) {
      flowgardChart.resize();
    } else if (viewName === 'ml' && rulChart) {
      rulChart.resize();
    } else if (viewName === '3d') {
      setTimeout(initThreeJSPumpVisualizer, 50);
    }
  }

  // --- STAKEHOLDER ROLE SWITCHER ---
  const roleBtns = document.querySelectorAll('.role-btn');
  roleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      roleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeRole = btn.getAttribute('data-role');
      applyRolePerspective(state.activeRole);
    });
  });

  function applyRolePerspective(role) {
    if (role === 'operator') switchView('scada');
    else if (role === 'engineer') switchView('3d');
    else if (role === 'datascience') switchView('ml');
    else if (role === 'executive') switchView('financial');
  }

  // --- COMPANY & FLUID SELECTORS ---
  const companySelect = document.getElementById('companySelect');
  const fluidSelect = document.getElementById('fluidSelect');

  companySelect.addEventListener('change', (e) => {
    state.selectedCompany = e.target.value;
    const comp = companies[state.selectedCompany];
    document.getElementById('kpiThroughput').innerText = comp.throughput;
  });

  fluidSelect.addEventListener('change', (e) => {
    state.selectedFluid = e.target.value;
  });

  // --- MAP NODE INTERACTION ---
  const mapNodes = document.querySelectorAll('.map-node');
  mapNodes.forEach(node => {
    node.addEventListener('click', () => {
      const station = node.getAttribute('data-station');
      state.selectedStation = station;
      document.getElementById('selectedStationTitle').innerHTML = `<i data-lucide="info"></i> Station Inspector: ${station}`;
      if (window.lucide) lucide.createIcons();
    });
  });

  document.getElementById('btnInspectPump4').addEventListener('click', () => {
    switchView('3d');
  });

  document.getElementById('btnToggleWeather').addEventListener('click', () => {
    const overlay = document.getElementById('weatherOverlay');
    overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
  });

  // --- COMPONENT DIAGNOSTICS DATA ---
  const partData = {
    bearing: {
      name: 'Inboard Roller Bearing #1',
      statusTitle: 'Diagnostic Status: Impending Bearing Outer-Race Fault',
      statusDesc: 'High thermal rise (86.4 °C) combined with 4.82 mm/s vibration velocity signature at 120 Hz BPFO frequency.',
      statusColor: 'var(--kpc-red)',
      shap1: { name: 'Bearing Temp Drift', pct: 48, val: '+0.48' },
      shap2: { name: 'Vibration RMS (120Hz)', pct: 32, val: '+0.32' },
      shap3: { name: 'Flowgard Pressure Res.', pct: 14, val: '+0.14' }
    },
    motor: {
      name: 'Electric Drive Motor Stator',
      statusTitle: 'Diagnostic Status: Nominal Operation',
      statusDesc: 'Phase current balanced at 312.5A. Stator temperature nominal at 42.1 °C.',
      statusColor: 'var(--kpc-green-light)',
      shap1: { name: 'Phase Current Imbalance', pct: 12, val: '+0.08' },
      shap2: { name: 'Thermal Load', pct: 8, val: '+0.05' },
      shap3: { name: 'Vibration Harmonic', pct: 4, val: '+0.02' }
    },
    seal: {
      name: 'Mechanical Face Seal',
      statusTitle: 'Diagnostic Status: Precursor Wear Alert',
      statusDesc: 'Slight pressure differential drop across secondary seal faces (54.0 °C).',
      statusColor: 'var(--kpc-gold)',
      shap1: { name: 'Seal Temp Gradient', pct: 28, val: '+0.22' },
      shap2: { name: 'Pressure Delta', pct: 18, val: '+0.15' },
      shap3: { name: 'Flow Velocity', pct: 8, val: '+0.06' }
    },
    impeller: {
      name: 'Enclosed Centrifugal Impeller',
      statusTitle: 'Diagnostic Status: Nominal Hydraulic Balance',
      statusDesc: 'Impeller vanes balanced with zero cavitation erosion detected.',
      statusColor: 'var(--kpc-green-light)',
      shap1: { name: 'Suction Head Delta', pct: 10, val: '+0.05' },
      shap2: { name: 'Cavitation Spectrum', pct: 6, val: '+0.03' },
      shap3: { name: 'Flow Turbulence', pct: 4, val: '+0.01' }
    }
  };

  function updateComponentDiagnosticsUI(partKey) {
    state.selectedPumpPart = partKey;
    const info = partData[partKey] || partData.bearing;
    
    document.getElementById('labelCurrent3dPart').innerText = `Selected: ${info.name}`;
    document.getElementById('partDetailTitle').innerHTML = `<i data-lucide="cpu"></i> Component Details: ${info.name}`;
    document.getElementById('partStatusText').innerText = info.statusTitle;
    document.getElementById('partStatusText').style.color = info.statusColor;
    document.getElementById('partDescText').innerText = info.statusDesc;

    document.getElementById('shapBar1').style.width = `${info.shap1.pct}%`;
    document.getElementById('shapVal1').innerText = info.shap1.val;

    document.getElementById('shapBar2').style.width = `${info.shap2.pct}%`;
    document.getElementById('shapVal2').innerText = info.shap2.val;

    document.getElementById('shapBar3').style.width = `${info.shap3.pct}%`;
    document.getElementById('shapVal3').innerText = info.shap3.val;

    if (window.lucide) lucide.createIcons();
  }

  // --- TRUE 3D THREE.JS WEBGL PUMP RENDERER ---
  let threeScene, threeCamera, threeRenderer, threeControls;
  let shaftMesh, impellerMesh, bearingMesh, sealMesh;
  let interactive3DObjects = [];
  let is3DInitialized = false;

  function initThreeJSPumpVisualizer() {
    const container = document.getElementById('container3D');
    if (!container) return;

    if (is3DInitialized) {
      if (threeRenderer && threeCamera) {
        const w = container.clientWidth || 600;
        const h = container.clientHeight || 380;
        threeCamera.aspect = w / h;
        threeCamera.updateProjectionMatrix();
        threeRenderer.setSize(w, h);
      }
      return;
    }

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 380;

    if (width === 0) {
      setTimeout(initThreeJSPumpVisualizer, 100);
      return;
    }

    // Check THREE availability
    if (typeof THREE === 'undefined') {
      console.error('Three.js library is not loaded.');
      return;
    }

    // 1. Scene & Camera Setup
    threeScene = new THREE.Scene();
    threeScene.background = new THREE.Color(0x0B1120);

    threeCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    threeCamera.position.set(12, 8, 16);

    // 2. WebGL Renderer
    threeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    threeRenderer.setSize(width, height);
    threeRenderer.setPixelRatio(window.devicePixelRatio);
    threeRenderer.shadowMap.enabled = true;
    container.innerHTML = ''; // Clear loading text
    container.appendChild(threeRenderer.domElement);

    // 3. Orbit Controls
    if (THREE.OrbitControls) {
      threeControls = new THREE.OrbitControls(threeCamera, threeRenderer.domElement);
      threeControls.enableDamping = true;
      threeControls.dampingFactor = 0.05;
      threeControls.maxPolarAngle = Math.PI / 2 + 0.1;
    }

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    threeScene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(15, 20, 15);
    dirLight.castShadow = true;
    threeScene.add(dirLight);

    const redAlertLight = new THREE.PointLight(0xD9232D, 2, 10);
    redAlertLight.position.set(2, 2, 2);
    threeScene.add(redAlertLight);

    // 5. Build 3D Centrifugal Pump Geometries
    build3DPumpComponents();

    // 6. Raycasting for Pointer Clicks
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    container.addEventListener('pointerdown', (e) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, threeCamera);
      const intersects = raycaster.intersectObjects(interactive3DObjects, true);

      if (intersects.length > 0) {
        let hit = intersects[0].object;
        while (hit.parent && !hit.userData.partKey && hit.parent !== threeScene) {
          hit = hit.parent;
        }
        if (hit.userData && hit.userData.partKey) {
          updateComponentDiagnosticsUI(hit.userData.partKey);
        }
      }
    });

    // Reset View Button
    document.getElementById('btnReset3dView')?.addEventListener('click', () => {
      threeCamera.position.set(12, 8, 16);
      if (threeControls) threeControls.target.set(0, 0, 0);
    });

    // Window Resize Handler
    window.addEventListener('resize', () => {
      if (threeRenderer && threeCamera && container) {
        const w = container.clientWidth || 600;
        const h = container.clientHeight || 380;
        threeCamera.aspect = w / h;
        threeCamera.updateProjectionMatrix();
        threeRenderer.setSize(w, h);
      }
    });

    is3DInitialized = true;

    // 7. 60fps Animation Render Loop
    let clock = new THREE.Clock();

    function animate3D() {
      requestAnimationFrame(animate3D);
      const elapsedTime = clock.getElapsedTime();

      // Spin Drive Shaft & Impeller when running
      if (shaftMesh) shaftMesh.rotation.x += 0.04;
      if (impellerMesh) impellerMesh.rotation.x += 0.04;

      // Pulse Critical Bearing Glow
      if (bearingMesh && bearingMesh.material) {
        bearingMesh.material.emissiveIntensity = 0.5 + Math.sin(elapsedTime * 4) * 0.4;
      }

      if (threeControls) threeControls.update();
      threeRenderer.render(threeScene, threeCamera);
    }

    animate3D();
  }

  function build3DPumpComponents() {
    interactive3DObjects = [];

    // --- Baseplate ---
    const baseGeo = new THREE.BoxGeometry(16, 0.6, 6);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.8 });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.set(0, -1.8, 0);
    threeScene.add(baseMesh);

    // --- 1. Electric Motor Unit ---
    const motorGroup = new THREE.Group();
    motorGroup.userData = { partKey: 'motor' };

    const motorHousingGeo = new THREE.CylinderGeometry(2.0, 2.0, 5.0, 32);
    const motorMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.6 });
    const motorHousing = new THREE.Mesh(motorHousingGeo, motorMat);
    motorHousing.rotation.z = Math.PI / 2;
    motorGroup.add(motorHousing);

    // Cooling Fins
    for (let i = -2; i <= 2; i += 0.5) {
      const finGeo = new THREE.CylinderGeometry(2.15, 2.15, 0.1, 32);
      const finMat = new THREE.MeshStandardMaterial({ color: 0x1E293B });
      const finMesh = new THREE.Mesh(finGeo, finMat);
      finMesh.rotation.z = Math.PI / 2;
      finMesh.position.x = i;
      motorGroup.add(finMesh);
    }

    motorGroup.position.set(-4.5, 0.4, 0);
    threeScene.add(motorGroup);
    interactive3DObjects.push(motorGroup, motorHousing);

    // --- 2. Stainless Steel Drive Shaft ---
    const shaftGeo = new THREE.CylinderGeometry(0.4, 0.4, 11, 32);
    const shaftMat = new THREE.MeshStandardMaterial({ color: 0xE2E8F0, metalness: 0.95, roughness: 0.1 });
    shaftMesh = new THREE.Mesh(shaftGeo, shaftMat);
    shaftMesh.rotation.z = Math.PI / 2;
    shaftMesh.position.set(0.5, 0.4, 0);
    threeScene.add(shaftMesh);

    // --- 3. Inboard Roller Bearing #1 (CRITICAL FAULT - Glowing Crimson Red) ---
    const bearingGroup = new THREE.Group();
    bearingGroup.userData = { partKey: 'bearing' };

    const bearingRingGeo = new THREE.TorusGeometry(1.2, 0.35, 16, 32);
    const bearingMat = new THREE.MeshStandardMaterial({
      color: 0xD9232D,
      emissive: 0xD9232D,
      emissiveIntensity: 0.8,
      metalness: 0.8,
      roughness: 0.2
    });
    bearingMesh = new THREE.Mesh(bearingRingGeo, bearingMat);
    bearingMesh.rotation.y = Math.PI / 2;
    bearingGroup.add(bearingMesh);

    // Ball Bearings
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      const ballGeo = new THREE.SphereGeometry(0.22, 16, 16);
      const ballMat = new THREE.MeshStandardMaterial({ color: 0xFFBBBB, metalness: 0.9 });
      const ball = new THREE.Mesh(ballGeo, ballMat);
      ball.position.set(0, Math.sin(a) * 1.2, Math.cos(a) * 1.2);
      bearingGroup.add(ball);
    }

    bearingGroup.position.set(0, 0.4, 0);
    threeScene.add(bearingGroup);
    interactive3DObjects.push(bearingGroup, bearingMesh);

    // --- 4. Mechanical Face Seal ---
    const sealGroup = new THREE.Group();
    sealGroup.userData = { partKey: 'seal' };

    const sealRingGeo = new THREE.TorusGeometry(0.9, 0.2, 16, 32);
    const sealMat = new THREE.MeshStandardMaterial({ color: 0xF59E0B, emissive: 0x92400E, metalness: 0.8 });
    sealMesh = new THREE.Mesh(sealRingGeo, sealMat);
    sealMesh.rotation.y = Math.PI / 2;
    sealGroup.add(sealMesh);

    sealGroup.position.set(2.2, 0.4, 0);
    threeScene.add(sealGroup);
    interactive3DObjects.push(sealGroup, sealMesh);

    // --- 5. Volute Casing & Enclosed Impeller ---
    const impellerGroup = new THREE.Group();
    impellerGroup.userData = { partKey: 'impeller' };

    const voluteGeo = new THREE.TorusGeometry(2.4, 1.1, 24, 36, Math.PI * 1.7);
    const voluteMat = new THREE.MeshStandardMaterial({ color: 0x008751, metalness: 0.7, roughness: 0.3 });
    const voluteMesh = new THREE.Mesh(voluteGeo, voluteMat);
    voluteMesh.rotation.y = Math.PI / 2;
    impellerGroup.add(voluteMesh);

    // Impeller Internal Vanes
    const vaneCoreGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.6, 6);
    const vaneMat = new THREE.MeshStandardMaterial({ color: 0x10B981, metalness: 0.9 });
    impellerMesh = new THREE.Mesh(vaneCoreGeo, vaneMat);
    impellerMesh.rotation.z = Math.PI / 2;
    impellerGroup.add(impellerMesh);

    impellerGroup.position.set(4.5, 0.4, 0);
    threeScene.add(impellerGroup);
    interactive3DObjects.push(impellerGroup, voluteMesh, impellerMesh);
  }

  // --- SYNTHETIC FAULT INJECTOR BUTTONS ---
  const faultBtns = document.querySelectorAll('.fault-btn');
  faultBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      faultBtns.forEach(b => b.classList.remove('active', 'btn-success'));
      btn.classList.add('active', 'btn-success');
      state.activeFault = btn.getAttribute('data-fault');
      injectFaultMode(state.activeFault);
    });
  });

  function injectFaultMode(mode) {
    if (mode === 'normal') {
      state.syntheticTelemetry.vibration = 1.15;
      state.syntheticTelemetry.temperature = 42.0;
      state.syntheticTelemetry.pressure = 50.0;
      state.syntheticTelemetry.current = 280.0;
      state.syntheticTelemetry.flowgardResidual = -0.15;
      state.syntheticTelemetry.rulHours = 840.0;
    } else if (mode === 'bearing') {
      state.syntheticTelemetry.vibration = 4.82;
      state.syntheticTelemetry.temperature = 86.4;
      state.syntheticTelemetry.pressure = 48.2;
      state.syntheticTelemetry.current = 312.5;
      state.syntheticTelemetry.flowgardResidual = -1.80;
      state.syntheticTelemetry.rulHours = 142.5;
    } else if (mode === 'cavitation') {
      state.syntheticTelemetry.vibration = 6.40;
      state.syntheticTelemetry.temperature = 65.0;
      state.syntheticTelemetry.pressure = 41.5;
      state.syntheticTelemetry.current = 340.0;
      state.syntheticTelemetry.flowgardResidual = -3.50;
      state.syntheticTelemetry.rulHours = 86.0;
    } else if (mode === 'leak') {
      state.syntheticTelemetry.vibration = 2.10;
      state.syntheticTelemetry.temperature = 48.0;
      state.syntheticTelemetry.pressure = 36.0;
      state.syntheticTelemetry.current = 295.0;
      state.syntheticTelemetry.flowgardResidual = -6.20;
      state.syntheticTelemetry.rulHours = 45.0;
    }
    updateTelemetryUI();
  }

  function updateTelemetryUI() {
    const t = state.syntheticTelemetry;
    document.getElementById('valVibration').innerText = `${t.vibration.toFixed(2)} mm/s`;
    document.getElementById('barVibration').style.width = `${Math.min(100, (t.vibration / 6) * 100)}%`;

    document.getElementById('valTemperature').innerText = `${t.temperature.toFixed(1)} °C`;
    document.getElementById('barTemperature').style.width = `${Math.min(100, (t.temperature / 100) * 100)}%`;

    document.getElementById('valPressure').innerText = `${t.pressure.toFixed(2)} bar`;
    document.getElementById('barPressure').style.width = `${Math.min(100, (t.pressure / 60) * 100)}%`;

    document.getElementById('valCurrent').innerText = `${t.current.toFixed(1)} A`;
    document.getElementById('barCurrent').style.width = `${Math.min(100, (t.current / 400) * 100)}%`;
  }

  // --- CHART.JS INITIALIZATION ---
  let flowgardChart, rulChart;

  function initCharts() {
    const ctxFlowgard = document.getElementById('flowgardChart')?.getContext('2d');
    if (ctxFlowgard) {
      flowgardChart = new Chart(ctxFlowgard, {
        type: 'line',
        data: {
          labels: ['10m ago', '8m ago', '6m ago', '4m ago', '2m ago', 'Now'],
          datasets: [
            {
              label: 'Actual Pressure (bar)',
              data: [50.1, 49.8, 49.5, 49.0, 48.6, 48.2],
              borderColor: '#10B981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              fill: false,
              tension: 0.3
            },
            {
              label: 'Simulated Baseline (bar)',
              data: [50.0, 50.0, 50.0, 50.0, 50.0, 50.0],
              borderColor: '#3B82F6',
              borderDash: [5, 5],
              fill: false
            },
            {
              label: 'Flowgard Residual ΔP (bar)',
              data: [0.1, -0.2, -0.5, -1.0, -1.4, -1.8],
              borderColor: '#D9232D',
              backgroundColor: 'rgba(217, 35, 45, 0.15)',
              fill: true,
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#94A3B8', font: { family: 'Inter' } } }
          },
          scales: {
            x: { ticks: { color: '#64748B' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#64748B' }, grid: { color: 'rgba(255,255,255,0.05)' } }
          }
        }
      });
    }

    const ctxRul = document.getElementById('rulChart')?.getContext('2d');
    if (ctxRul) {
      rulChart = new Chart(ctxRul, {
        type: 'line',
        data: {
          labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
          datasets: [
            {
              label: 'Mean RUL (Hours)',
              data: [320, 280, 240, 195, 160, 142.5, 110],
              borderColor: '#F59E0B',
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              fill: false,
              tension: 0.2
            },
            {
              label: 'Monte Carlo 95% Upper Bound',
              data: [340, 298, 258, 212, 178, 160.7, 128],
              borderColor: 'rgba(245, 158, 11, 0.4)',
              borderDash: [4, 4],
              fill: false
            },
            {
              label: 'Monte Carlo 95% Lower Bound',
              data: [300, 262, 222, 178, 142, 124.3, 92],
              borderColor: 'rgba(245, 158, 11, 0.4)',
              borderDash: [4, 4],
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#94A3B8', font: { family: 'Inter' } } }
          },
          scales: {
            x: { ticks: { color: '#64748B' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#64748B' }, grid: { color: 'rgba(255,255,255,0.05)' } }
          }
        }
      });
    }
  }

  initCharts();

  // --- MODAL DIALOG CONTROLS ---
  const modal = document.getElementById('diagnosticModal');
  const modalBody = document.getElementById('modalBody');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalCancelBtn = document.getElementById('modalCancelBtn');
  const modalConfirmBtn = document.getElementById('modalConfirmBtn');

  document.getElementById('btnGenerateWorkOrder')?.addEventListener('click', () => {
    const partInfo = partData[state.selectedPumpPart] || partData.bearing;
    modalBody.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <p><strong>Asset:</strong> PS7 Nakuru Booster Station — Pump 4 (Unit ID: KPC-P4-NK)</p>
        <p><strong>Inspected 3D Component:</strong> ${partInfo.name}</p>
        <p><strong>Diagnostic Status:</strong> ${partInfo.statusTitle}</p>
        <p><strong>Target Maintenance Window:</strong> Within 120 Hours (Before Day 5.9)</p>
        <p><strong>Required Spare Parts:</strong> SKF 22220 EK Spherical Roller Bearing + Mechanical Seal Kit</p>
        <p><strong>Estimated Labor:</strong> 4.5 Hours Maintenance Tech Crew</p>
      </div>
    `;
    modal.classList.add('active');
  });

  modalCloseBtn.addEventListener('click', () => modal.classList.remove('active'));
  modalCancelBtn.addEventListener('click', () => modal.classList.remove('active'));
  modalConfirmBtn.addEventListener('click', () => {
    alert('Work Order #WO-8921 Approved and Dispatched to KPC Field Engineers.');
    modal.classList.remove('active');
  });

  // --- ALARM SOUND & COMMAND FEED ---
  let audioCtx, osc;

  document.getElementById('btnEmergencyTrip')?.addEventListener('click', () => {
    alert('🚨 EMERGENCY PUMP TRIP SIMULATED: PS7 Nakuru Pump 4 Isolated. Flow bypass initiated.');
    if (!state.audioMuted) {
      playEmergencyTone();
    }
  });

  document.getElementById('btnTestPushAlert')?.addEventListener('click', () => {
    addAlertFeedItem('CRITICAL PRECURSOR: Vibration Spike 5.1 mm/s on PS7 Pump 4', 'Just now');
  });

  function addAlertFeedItem(title, time) {
    const list = document.getElementById('alertFeedList');
    if (!list) return;
    const item = document.createElement('div');
    item.className = 'alert-item';
    item.innerHTML = `
      <div>
        <div class="alert-title">${title}</div>
        <div class="alert-desc">Generated by Flowgard Machine Learning Real-Time Predictor.</div>
      </div>
      <div class="alert-time">${time}</div>
    `;
    list.prepend(item);
  }

  function playEmergencyTone() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.2);
    } catch (e) {
      console.log('Audio Context restricted.');
    }
  }

  document.getElementById('btnMuteAudio')?.addEventListener('click', () => {
    state.audioMuted = !state.audioMuted;
    document.getElementById('btnMuteAudio').innerHTML = state.audioMuted ? '<i data-lucide="volume-2"></i> Unmute Alarm Audio' : '<i data-lucide="volume-x"></i> Mute Alarm Audio';
    if (window.lucide) lucide.createIcons();
  });

  document.getElementById('btnResetSystem')?.addEventListener('click', () => {
    injectFaultMode('normal');
    alert('System baseline reset to Nominal Operating Conditions.');
  });
});
