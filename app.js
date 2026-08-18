/* 
  FlowGuard AI — Capstone Prototype Application Logic
  Team NULL_TERMINATORS | KPC Cohort
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
      lossMultiplier: 1.0 // KES conversion rate base
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

    // Refresh charts when view activates
    if (viewName === 'scada' && flowgardChart) {
      flowgardChart.resize();
    } else if (viewName === 'ml' && rulChart) {
      rulChart.resize();
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
    console.log(`Switched to HCI Stakeholder Role: ${role}`);
    // Auto-navigate to preferred screen per persona
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
    console.log(`Updated network company context to: ${comp.name}`);
  });

  fluidSelect.addEventListener('change', (e) => {
    state.selectedFluid = e.target.value;
    console.log(`Fluid type selected: ${state.selectedFluid}`);
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

  // --- 3D PUMP PART INTERACTION ---
  const pumpParts = document.querySelectorAll('.pump-part');
  const partTitle = document.getElementById('partDetailTitle');

  const partData = {
    bearing: {
      name: 'Inboard Roller Bearing #1',
      status: 'CRITICAL WEAR (BPFO 120Hz)',
      shap: '+0.48 SHAP',
      temp: '86.4 °C',
      vib: '4.82 mm/s'
    },
    motor: {
      name: 'Electric Drive Motor Stator',
      status: 'NOMINAL (Phase Balanced)',
      shap: '+0.08 SHAP',
      temp: '42.1 °C',
      vib: '0.95 mm/s'
    },
    seal: {
      name: 'Mechanical Face Seal',
      status: 'PRECURSOR WEAR',
      shap: '+0.22 SHAP',
      temp: '54.0 °C',
      vib: '1.20 mm/s'
    },
    impeller: {
      name: 'Enclosed Centrifugal Impeller',
      status: 'NOMINAL (Balanced)',
      shap: '+0.05 SHAP',
      temp: '38.5 °C',
      vib: '1.10 mm/s'
    }
  };

  pumpParts.forEach(part => {
    part.addEventListener('click', () => {
      pumpParts.forEach(p => p.classList.remove('selected'));
      part.classList.add('selected');
      const key = part.getAttribute('data-part');
      state.selectedPumpPart = key;
      const info = partData[key];
      partTitle.innerHTML = `<i data-lucide="cpu"></i> Component Details: ${info.name}`;
      if (window.lucide) lucide.createIcons();
    });
  });

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
    // 1. Flowgard Chart
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

    // 2. RUL Confidence Chart
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

  document.getElementById('btnGenerateWorkOrder').addEventListener('click', () => {
    modalBody.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <p><strong>Asset:</strong> PS7 Nakuru Booster Station — Pump 4 (Unit ID: KPC-P4-NK)</p>
        <p><strong>Component:</strong> Inboard Deep Groove Roller Bearing #1</p>
        <p><strong>Recommended Action:</strong> Scheduled Bearing Replacement & Alignment</p>
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

  // --- WEB AUDIO API EMERGENCY ALARM SIMULATOR ---
  let audioCtx, osc;

  document.getElementById('btnEmergencyTrip').addEventListener('click', () => {
    alert('🚨 EMERGENCY PUMP TRIP SIMULATED: PS7 Nakuru Pump 4 Isolated. Flow bypass initiated.');
    if (!state.audioMuted) {
      playEmergencyTone();
    }
  });

  document.getElementById('btnTestPushAlert').addEventListener('click', () => {
    addAlertFeedItem('CRITICAL PRECURSOR: Vibration Spike 5.1 mm/s on PS7 Pump 4', 'Just now');
  });

  function addAlertFeedItem(title, time) {
    const list = document.getElementById('alertFeedList');
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
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 tone
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.2);
    } catch (e) {
      console.log('Audio Context restricted by browser policy.');
    }
  }

  document.getElementById('btnMuteAudio').addEventListener('click', () => {
    state.audioMuted = !state.audioMuted;
    document.getElementById('btnMuteAudio').innerHTML = state.audioMuted ? '<i data-lucide="volume-2"></i> Unmute Alarm Audio' : '<i data-lucide="volume-x"></i> Mute Alarm Audio';
    if (window.lucide) lucide.createIcons();
  });

  document.getElementById('btnResetSystem').addEventListener('click', () => {
    injectFaultMode('normal');
    alert('System baseline reset to Nominal Operating Conditions.');
  });
});
