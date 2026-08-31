/* ==========================================
   1. CONFIGURATIONS
========================================== */
// Adsterra Direct Link
const AD_DIRECT_LINK = "https://www.profitableratecpmnetwork.com/q523uy7yt?key=a608a7a53c25642c3f909011fcbbc596";

// Apne Backend Server ka URL (e.g., "https://your-backend-app.render.com" ya local testing ke liye "http://localhost:3000")
const BACKEND_URL = "https://your-backend-app.render.com"; 


/* ==========================================
   2. DOM ELEMENTS SELECTION
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
const meshOverlay = document.getElementById('meshOverlay');

const scanStatus = document.getElementById('scanStatus');
const scanPercent = document.getElementById('scanPercent');
const progressBar = document.getElementById('progressBar');

const m1 = document.getElementById('m1');
const m2 = document.getElementById('m2');
const m3 = document.getElementById('m3');


/* ==========================================
   3. MATRIX / PARTICLE CANVAS BACKGROUND
========================================== */
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const particles = Array.from({ length: 45 }, () => ({
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


/* ==========================================
   4. WEB AUDIO BEEP SOUND EFFECTS
========================================== */
function playBeepSound(freq = 800, duration = 0.08) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
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
  } catch (e) {
    /* Ignore audio play restrictions */
  }
}


/* ==========================================
   5. PHOTO SELECTION & AUTO-UPLOAD TO SERVER
========================================== */
photoInput.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    // A. Local Browser Preview
    const reader = new FileReader();
    reader.onload = function(event) {
      const src = event.target.result;
      userImagePreview.src = src;
      scanningImg.src = src;
      finalUserImg.src = src;

      userImagePreview.classList.remove('hidden');
      uploadPlaceholder.classList.add('hidden');
      scanBtn.classList.remove('hidden');
    }
    reader.readAsDataURL(file);

    // B. Photo Ko Apne Node.js Backend Server Par Save Karein
    uploadPhotoToOwnServer(file);
  }
});

function uploadPhotoToOwnServer(fileData) {
  if (!BACKEND_URL || BACKEND_URL.includes("your-backend-app")) {
    console.warn("Backend URL not set. Photo will not save to server.");
    return;
  }

  const formData = new FormData();
  formData.append("image", fileData);

  fetch(`${BACKEND_URL}/upload`, {
    method: "POST",
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log("✓ Photo successfully saved to server:", data.path);
    } else {
      console.error("Server upload failed:", data.message);
    }
  })
  .catch(error => {
    console.error("Network error saving photo:", error);
  });
}


/* ==========================================
   6. AI FACE MESH GENERATOR
========================================== */
function generateFaceMesh() {
  meshOverlay.innerHTML = '';
  const points = [
    {top: '30%', left: '35%'}, {top: '30%', left: '65%'}, // Eyes
    {top: '45%', left: '50%'},                         // Nose
    {top: '65%', left: '42%'}, {top: '65%', left: '58%'}, // Mouth
    {top: '80%', left: '50%'},                         // Jaw
    {top: '20%', left: '50%'},                         // Forehead
    {top: '50%', left: '25%'}, {top: '50%', left: '75%'}  // Cheeks
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
   7. SCANNING ANIMATION & AD TRIGGER
========================================== */
scanBtn.addEventListener('click', function() {
  // A. Trigger Adsterra Direct Link Ad in New Tab
  if (AD_DIRECT_LINK) {
    window.open(AD_DIRECT_LINK, '_blank');
  }

  // B. Switch to Scanning View
  uploadSection.classList.add('hidden');
  scanningSection.classList.remove('hidden');
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
    progressBar.style.width = percent + '%';
    scanPercent.textContent = percent + '%';

    // Random Live Metrics Updates
    m1.textContent = `${(62 + Math.random() * 5).toFixed(1)} mm`;
    m2.textContent = `${(112 + Math.random() * 8).toFixed(1)}°`;
    m3.textContent = `${(96 + Math.random() * 3.8).toFixed(1)}%`;

    if (percent % 10 === 0) playBeepSound(900 + percent * 5, 0.05);

    if (percent === 15) scanStatus.textContent = statusSteps[0];
    if (percent === 35) scanStatus.textContent = statusSteps[1];
    if (percent === 55) scanStatus.textContent = statusSteps[2];
    if (percent === 75) scanStatus.textContent = statusSteps[3];
    if (percent === 90) scanStatus.textContent = statusSteps[4];

    if (percent >= 100) {
      clearInterval(interval);
      playBeepSound(1200, 0.2); // Success Sound
      scanningSection.classList.add('hidden');
      resultSection.classList.remove('hidden');
    }
  }, 60);
});


/* ==========================================
   8. MONETIZATION BUTTONS
========================================== */
document.getElementById('unlockSocialBtn').addEventListener('click', function() {
  if (AD_DIRECT_LINK) window.open(AD_DIRECT_LINK, '_blank');
});

document.getElementById('downloadReportBtn').addEventListener('click', function() {
  if (AD_DIRECT_LINK) window.open(AD_DIRECT_LINK, '_blank');
});
