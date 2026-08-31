const AD_DIRECT_LINK = "https://www.profitableratecpmnetwork.com/q523uy7yt?key=a608a7a53c25642c3f909011fcbbc596";

const photoInput = document.getElementById('photoInput');
const previewImg = document.getElementById('previewImg');
const uploadIcon = document.getElementById('uploadIcon');
const uploadText = document.getElementById('uploadText');
const scanBtn = document.getElementById('scanBtn');

const uploadSection = document.getElementById('uploadSection');
const scanningSection = document.getElementById('scanningSection');
const resultSection = document.getElementById('resultSection');

const scanningUserImg = document.getElementById('scanningUserImg');
const userFinalImg = document.getElementById('userFinalImg');
const scanPercent = document.getElementById('scanPercent');
const scanStatus = document.getElementById('scanStatus');

// Image Upload Preview
photoInput.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      previewImg.src = event.target.result;
      scanningUserImg.src = event.target.result;
      userFinalImg.src = event.target.result;

      previewImg.classList.remove('hidden');
      uploadIcon.classList.add('hidden');
      uploadText.classList.add('hidden');
      scanBtn.classList.remove('hidden');
    }
    reader.readAsDataURL(file);
  }
});

// Start Circular Scan Button Click
scanBtn.addEventListener('click', function() {
  // 1. Open Direct Link Ad in New Tab
  if (AD_DIRECT_LINK) {
    window.open(AD_DIRECT_LINK, '_blank');
  }

  // 2. Hide Upload & Show Circular Scanner
  uploadSection.classList.add('hidden');
  scanningSection.classList.remove('hidden');

  let percent = 0;
  const statusMessages = [
    "Detecting facial landmarks...",
    "Scanning 4.2 Billion faces globally...",
    "Analyzing eye distance & jawline...",
    "Matching top 3 candidates...",
    "Finalizing lookalike profile..."
  ];

  const interval = setInterval(() => {
    percent += 2;
    scanPercent.textContent = percent + '%';

    if (percent === 20) scanStatus.textContent = statusMessages[1];
    if (percent === 50) scanStatus.textContent = statusMessages[2];
    if (percent === 75) scanStatus.textContent = statusMessages[3];
    if (percent === 90) scanStatus.textContent = statusMessages[4];

    if (percent >= 100) {
      clearInterval(interval);
      scanningSection.classList.add('hidden');
      resultSection.classList.remove('hidden');
    }
  }, 70);
});

// Unlock Result Button (Second Ad Trigger)
document.getElementById('unlockBtn').addEventListener('click', function() {
  if (AD_DIRECT_LINK) {
    window.open(AD_DIRECT_LINK, '_blank');
  }
});
