/* =========================
   ADSTERRA DIRECT LINK CONFIG
========================= */
const AD_DIRECT_LINK = "https://www.profitableratecpmnetwork.com/q523uy7yt?key=a608a7a53c25642c3f909011fcbbc596";

const state = {
  customer: JSON.parse(localStorage.getItem("asadCustomer") || "null"),
  session: null,
  currentGame: null
};

const $ = id => document.getElementById(id);


/* =========================
   API HELPER
========================= */

async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}


/* =========================
   SAVE CUSTOMER
========================= */

function saveCustomer(customer) {
  state.customer = customer;
  localStorage.setItem("asadCustomer", JSON.stringify(customer));
  updateUI();
}


/* =========================
   UPDATE UI
========================= */

function updateUI() {
  const c = state.customer;
  const points = c?.points || 0;

  $("points").textContent = points;
  $("navPoints").textContent = points;
  $("gamesPlayed").textContent = c?.gamesPlayed || 0;
  $("bestScore").textContent = c?.bestScore || 0;
  $("discount").textContent = `${c?.discount || 0}%`;
  $("heroDiscount").textContent = `${c?.discount || 0}%`;

  if (c) {
    $("name").value = c.name || "";
    $("phone").value = c.phone || "";
  }
}


/* =========================
   REFRESH CUSTOMER
========================= */

async function refreshCustomer() {
  if (!state.customer?.id) return;

  try {
    const data = await api(`/api/customers/${state.customer.id}`);
    saveCustomer(data.customer);
  } catch {
    localStorage.removeItem("asadCustomer");
    state.customer = null;
  }
}


/* =========================
   CUSTOMER FORM
========================= */

$("profileForm").addEventListener("submit", async event => {
  event.preventDefault();
  const msg = $("profileMsg");
  msg.textContent = "Saving...";

  try {
    const data = await api("/api/customers", {
      method: "POST",
      body: JSON.stringify({
        name: $("name").value,
        phone: $("phone").value
      })
    });

    saveCustomer(data.customer);
    msg.textContent = "✓ Profile saved successfully.";
  } catch (error) {
    msg.textContent = error.message;
  }
});


/* =========================
   GAMES MAPPING
========================= */

const games = {
  "coin-rush": {
    title: "Coin Rush",
    build: buildCoinRush
  },
  "memory-master": {
    title: "Memory Master",
    build: buildMemory
  },
  reaction: {
    title: "Reaction Challenge",
    build: buildReaction
  },
  "target-hunter": {
    title: "Target Hunter",
    build: buildTarget
  },
  "number-guess": {
    title: "Number Guess",
    build: buildGuess
  },
  "survival-shooter": {
    title: "Free Fire 2D",
    build: launchFF2DOverlay
  }
};


/* =========================
   GAME CLICK & MODAL (WITH DIRECT LINK AD)
========================= */

document.querySelectorAll(".game-tile").forEach(tile => {
  tile.addEventListener("click", () => {
    openGame(tile.dataset.game);
  });
});

async function openGame(game) {
  if (!state.customer) {
    $("profileMsg").textContent = "Please save your customer profile first.";
    location.hash = "rewards";
    return;
  }

  // Game Click hote hi Direct Link Ad Naye Tab me kholein
  if (AD_DIRECT_LINK) {
    window.open(AD_DIRECT_LINK, '_blank');
  }

  try {
    const data = await api(`/api/games/${game}/start`, {
      method: "POST",
      body: JSON.stringify({
        customerId: state.customer.id
      })
    });

    state.session = data;
    state.currentGame = game;

    if (game === "survival-shooter") {
      games[game].build();
      return;
    }

    $("modalTitle").textContent = games[game].title;
    $("liveScore").textContent = "0";
    $("gameMessage").textContent = "";
    $("gameStage").innerHTML = "";
    $("gameModal").classList.add("open");
    $("gameModal").setAttribute("aria-hidden", "false");

    games[game].build();
  } catch (error) {
    alert(error.message);
  }
}

$("closeGame").addEventListener("click", closeGame);

$("gameModal").addEventListener("click", event => {
  if (event.target === $("gameModal")) {
    closeGame();
  }
});

function closeGame() {
  $("gameModal").classList.remove("open");
  $("gameModal").setAttribute("aria-hidden", "true");
  $("gameStage").innerHTML = "";
  state.session = null;
  state.currentGame = null;
}


/* =========================
   FINISH GAME API
========================= */

async function finishGame(score) {
  if (!state.session) return;

  try {
    const data = await api(`/api/games/${state.currentGame}/finish`, {
      method: "POST",
      body: JSON.stringify({
        sessionId: state.session.sessionId,
        score: score
      })
    });

    saveCustomer(data.customer);

    $("gameMessage").textContent = `🎉 +${data.earned} points added!`;
    $("liveScore").textContent = score;

    state.session = null;

    loadLeaderboard();
  } catch (error) {
    if ($("gameMessage")) $("gameMessage").textContent = error.message;
  }
}


/* =====================================================
   GAME 1 — COIN RUSH
===================================================== */

function buildCoinRush() {
  const stage = document.createElement("div");
  stage.className = "stage";
  stage.innerHTML = `
    <div class="stage-info">
      <span>Time: <b id="gTime">15</b>s</span>
      <span>Coins: <b id="gScore">0</b></span>
    </div>
  `;

  const coin = document.createElement("button");
  coin.className = "coin";
  coin.textContent = "🪙";

  stage.appendChild(coin);
  $("gameStage").appendChild(stage);

  let time = 15;
  let score = 0;
  let running = true;

  function moveCoin() {
    coin.style.left = `${Math.random() * Math.max(5, stage.clientWidth - 60)}px`;
    coin.style.top = `${50 + Math.random() * Math.max(5, stage.clientHeight - 105)}px`;
  }

  coin.onclick = () => {
    if (!running) return;
    score++;
    $("gScore").textContent = score;
    $("liveScore").textContent = score;
    moveCoin();
  };

  moveCoin();

  const timer = setInterval(() => {
    time--;
    $("gTime").textContent = time;

    if (time <= 0) {
      clearInterval(timer);
      running = false;
      coin.remove();
      finishGame(score);
    }
  }, 1000);
}


/* =====================================================
   GAME 2 — MEMORY MASTER
===================================================== */

function buildMemory() {
  const stage = document.createElement("div");
  stage.className = "stage";

  const grid = document.createElement("div");
  grid.className = "memory-grid";
  stage.appendChild(grid);
  $("gameStage").appendChild(stage);

  const symbols = ["🍎", "🍎", "🚀", "🚀", "⭐", "⭐", "🍕", "🍕"].sort(
    () => Math.random() - 0.5
  );

  let first = null;
  let second = null;
  let lock = false;
  let matches = 0;

  symbols.forEach(symbol => {
    const card = document.createElement("button");
    card.className = "memory-card";
    card.textContent = "❓";
    card.dataset.symbol = symbol;

    card.onclick = () => {
      if (lock || card === first || card.classList.contains("matched")) return;

      card.textContent = symbol;
      card.classList.add("open");

      if (!first) {
        first = card;
        return;
      }

      second = card;
      lock = true;

      if (first.dataset.symbol === second.dataset.symbol) {
        first.classList.add("matched");
        second.classList.add("matched");
        matches++;
        first = null;
        second = null;
        lock = false;

        if (matches === 4) {
          finishGame(40);
        }
      } else {
        setTimeout(() => {
          first.textContent = "❓";
          second.textContent = "❓";
          first.classList.remove("open");
          second.classList.remove("open");
          first = null;
          second = null;
          lock = false;
        }, 650);
      }
    };

    grid.appendChild(card);
  });
}


/* =====================================================
   GAME 3 — REACTION CHALLENGE
===================================================== */

function buildReaction() {
  const stage = document.createElement("div");
  stage.className = "stage";

  const pad = document.createElement("div");
  pad.className = "reaction-pad";
  pad.textContent = "WAIT...";

  stage.appendChild(pad);
  $("gameStage").appendChild(stage);

  let started = false;
  let finished = false;
  let startAt = 0;

  const delay = 1800 + Math.random() * 3000;

  const timeout = setTimeout(() => {
    started = true;
    startAt = performance.now();
    pad.classList.add("go");
    pad.textContent = "CLICK!";
  }, delay);

  pad.onclick = () => {
    if (finished) return;

    if (!started) {
      clearTimeout(timeout);
      pad.textContent = "Too early!";
      finished = true;
      setTimeout(() => {
        finishGame(0);
      }, 800);
      return;
    }

    const ms = Math.round(performance.now() - startAt);
    const score = Math.max(1, Math.min(40, Math.round(40 - ms / 30)));
    finished = true;

    pad.textContent = `${ms} ms`;
    $("liveScore").textContent = score;

    setTimeout(() => {
      finishGame(score);
    }, 700);
  };
}


/* =====================================================
   GAME 4 — TARGET HUNTER
===================================================== */

function buildTarget() {
  const stage = document.createElement("div");
  stage.className = "stage";
  stage.innerHTML = `
    <div class="stage-info">
      <span>Time: <b id="tTime">15</b>s</span>
      <span>Hits: <b id="tScore">0</b></span>
    </div>
  `;

  const target = document.createElement("button");
  target.className = "target";
  target.textContent = "🎯";

  stage.appendChild(target);
  $("gameStage").appendChild(stage);

  let time = 15;
  let hits = 0;
  let running = true;

  function moveTarget() {
    target.style.left = `${Math.random() * Math.max(5, stage.clientWidth - 65)}px`;
    target.style.top = `${55 + Math.random() * Math.max(5, stage.clientHeight - 110)}px`;
  }

  target.onclick = () => {
    if (!running) return;
    hits++;
    $("tScore").textContent = hits;
    $("liveScore").textContent = hits;
    moveTarget();
  };

  moveTarget();

  const timer = setInterval(() => {
    time--;
    $("tTime").textContent = time;

    if (time <= 0) {
      clearInterval(timer);
      running = false;
      target.remove();
      finishGame(Math.min(50, hits * 2));
    }
  }, 1000);
}


/* =====================================================
   GAME 5 — NUMBER GUESS
===================================================== */

function buildGuess() {
  const stage = document.createElement("div");
  stage.className = "stage";
  stage.innerHTML = `
    <div class="guess-form">
      <h3>Guess a number from 1 to 50</h3>
      <p id="guessHint" style="color:#9ca3af; margin:10px 0 20px;">You have 7 attempts.</p>
      <input id="guessInput" type="number" min="1" max="50" placeholder="1 - 50">
      <button id="guessBtn">GUESS</button>
    </div>
  `;

  $("gameStage").appendChild(stage);

  const secret = Math.floor(Math.random() * 50) + 1;
  let attempts = 0;
  let done = false;

  $("guessBtn").onclick = () => {
    if (done) return;

    const number = Number($("guessInput").value);

    if (!Number.isInteger(number) || number < 1 || number > 50) {
      $("guessHint").textContent = "Enter a number from 1 to 50.";
      return;
    }

    attempts++;

    if (number === secret) {
      const score = Math.max(10, 40 - (attempts - 1) * 5);
      done = true;
      $("guessHint").textContent = `🎉 Correct! Score: ${score}`;
      setTimeout(() => {
        finishGame(score);
      }, 700);
    } else if (attempts >= 7) {
      done = true;
      $("guessHint").textContent = `Game over. Number was ${secret}.`;
      setTimeout(() => {
        finishGame(0);
      }, 900);
    } else {
      $("guessHint").textContent = `${number < secret ? "Higher" : "Lower"} — ${7 - attempts} attempts left.`;
    }
  };
}


/* =====================================================
   VICTORY AUDIO SOUND EFFECT (WEB AUDIO API)
===================================================== */

function playBooyahSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25];

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);

      const startTime = ctx.currentTime + index * 0.12;
      osc.start(startTime);
      gain.gain.setValueAtTime(0.4, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
      osc.stop(startTime + 0.4);
    });
  } catch (e) {
    console.log("Audio play error", e);
  }
}


/* =====================================================
   GAME 6 — FULL SCREEN FREE FIRE 2D (2v2 ARENA ENGINE)
===================================================== */

let ff2dState = {
  mode: "2v2",
  playerEmail: "",
  loopId: null,
  spawnInterval: null,
  active: false
};

function launchFF2DOverlay() {
  const overlay = $("ff2d-overlay");
  overlay.classList.remove("hidden");

  $("ff2d-loading").classList.remove("hidden");
  $("ff2d-login").classList.add("hidden");
  $("ff2d-lobby").classList.add("hidden");
  $("ff2d-gameplay").classList.add("hidden");

  setTimeout(() => {
    $("ff2d-loading").classList.add("hidden");

    const savedEmail = localStorage.getItem("ff2d_email");
    if (savedEmail) {
      ff2dState.playerEmail = savedEmail;
      $("ff2d-email").value = savedEmail;
      $("ff2d-lobby").classList.remove("hidden");
    } else {
      $("ff2d-login").classList.remove("hidden");
    }
  }, 2500);

  const btn2v2 = $("btn2v2");
  const btn1v1 = $("btn1v1");
  if (btn2v2 && btn1v1) {
    btn2v2.onclick = () => {
      ff2dState.mode = "2v2";
      btn2v2.classList.add("active");
      btn1v1.classList.remove("active");
    };
    btn1v1.onclick = () => {
      ff2dState.mode = "1v1";
      btn1v1.classList.add("active");
      btn2v2.classList.remove("active");
    };
  }
}

function ff2dSubmitEmail() {
  const emailVal = $("ff2d-email").value.trim();
  if (!emailVal || !emailVal.includes("@")) {
    alert("Kripya valid email address enter karein!");
    return;
  }
  ff2dState.playerEmail = emailVal;
  localStorage.setItem("ff2d_email", emailVal);

  $("ff2d-login").classList.add("hidden");
  $("ff2d-lobby").classList.remove("hidden");
}

function ff2dCloseOverlay() {
  if (ff2dState.loopId) cancelAnimationFrame(ff2dState.loopId);
  if (ff2dState.spawnInterval) clearInterval(ff2dState.spawnInterval);

  ff2dState.active = false;
  $("ff2d-overlay").classList.add("hidden");
  state.session = null;
  state.currentGame = null;
}

function ff2dStartMatch() {
  $("ff2d-lobby").classList.add("hidden");
  $("ff2d-gameplay").classList.remove("hidden");

  start2v2GameplayEngine();
}

function start2v2GameplayEngine() {
  const canvas = $("ff2dCanvas");
  const ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  ff2dState.active = true;

  let player = {
    x: canvas.width * 0.2,
    y: canvas.height * 0.5,
    radius: 16,
    color: "#3b82f6",
    hp: 100,
    name: "YOU"
  };

  let teammate = {
    x: canvas.width * 0.2,
    y: canvas.height * 0.3,
    radius: 16,
    color: "#60a5fa",
    hp: 100,
    name: "Teammate (AI)"
  };

  let bullets = [];
  let enemies = [];
  let score = 0;
  let gameOver = false;

  function shootBullet(fromX, fromY, targetX, targetY, isTeammate = false) {
    const angle = Math.atan2(targetY - fromY, targetX - fromX);
    bullets.push({
      x: fromX,
      y: fromY,
      dx: Math.cos(angle) * 9,
      dy: Math.sin(angle) * 9,
      radius: 4,
      isTeammate
    });
  }

  function handleInput(e) {
    if (gameOver || !ff2dState.active) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    player.x += (clientX - player.x) * 0.15;
    player.y += (clientY - player.y) * 0.15;

    shootBullet(player.x, player.y, clientX, clientY, false);
  }

  canvas.onpointerdown = handleInput;

  const teammateShooter = setInterval(() => {
    if (gameOver || !ff2dState.active) return;
    if (enemies.length > 0) {
      let nearest = enemies[0];
      shootBullet(teammate.x, teammate.y, nearest.x, nearest.y, true);
    }
  }, 600);

  ff2dState.spawnInterval = setInterval(() => {
    if (gameOver || !ff2dState.active) return;
    enemies.push({
      x: canvas.width + 20,
      y: Math.random() * (canvas.height - 100) + 50,
      dx: - (1.5 + Math.random() * 2),
      dy: (Math.random() - 0.5) * 1.5,
      radius: 15,
      color: "#ef4444",
      hp: 30
    });
  }, 1000);

  function triggerBooyah(win = true) {
    gameOver = true;
    clearInterval(teammateShooter);
    clearInterval(ff2dState.spawnInterval);

    if (win) playBooyahSound();

    ctx.fillStyle = "rgba(6, 9, 19, 0.88)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.font = "900 36px Inter, sans-serif";

    if (win) {
      ctx.fillStyle = "#facc15";
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 15;
      ctx.fillText("🏆 BOOYAH! 2v2 VICTORY! 🏆", canvas.width / 2, canvas.height / 2 - 20);
    } else {
      ctx.fillStyle = "#ef4444";
      ctx.fillText("ELIMINATED!", canvas.width / 2, canvas.height / 2 - 20);
    }

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 20px Inter, sans-serif";
    ctx.fillText(`Final Team Score: ${score}`, canvas.width / 2, canvas.height / 2 + 30);

    setTimeout(() => {
      finishGame(score);
    }, 1500);
  }

  function renderLoop() {
    if (!ff2dState.active) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    [player, teammate].forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(p.name, p.x, p.y - 20);
    });

    bullets.forEach((b, bi) => {
      b.x += b.dx;
      b.y += b.dy;

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = b.isTeammate ? "#60a5fa" : "#facc15";
      ctx.fill();

      if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
        bullets.splice(bi, 1);
      }
    });

    enemies.forEach((e, ei) => {
      e.x += e.dx;
      e.y += e.dy;

      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fillStyle = e.color;
      ctx.fill();

      const distPlayer = Math.hypot(player.x - e.x, player.y - e.y);
      if (distPlayer < player.radius + e.radius) {
        triggerBooyah(false);
        return;
      }

      bullets.forEach((b, bi) => {
        const dist = Math.hypot(b.x - e.x, b.y - e.y);
        if (dist < b.radius + e.radius) {
          enemies.splice(ei, 1);
          bullets.splice(bi, 1);
          score += 10;

          if (score >= 120) {
            triggerBooyah(true);
          }
        }
      });
    });

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 18px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`MODE: ${ff2dState.mode} | SCORE: ${score}`, 25, 40);

    if (!gameOver) {
      ff2dState.loopId = requestAnimationFrame(renderLoop);
    }
  }

  renderLoop();
}


/* =========================
   LEADERBOARD
========================= */

async function loadLeaderboard() {
  try {
    const data = await api("/api/leaderboard");
    const list = $("leaderboardList");

    if (!data.leaderboard.length) {
      list.innerHTML = `
        <div class="leader-row">
          <div></div>
          <div>No players yet</div>
          <div></div>
          <div></div>
        </div>
      `;
      return;
    }

    list.innerHTML = data.leaderboard
      .map(
        (player, index) => `
          <div class="leader-row">
            <div class="rank">#${index + 1}</div>
            <div class="leader-name">${escapeHtml(player.name)}</div>
            <div>
              <small>Best</small><br>
              <b>${player.best_score}</b>
            </div>
            <strong>⭐ ${player.points}</strong>
          </div>
        `
      )
      .join("");
  } catch {
    /* Ignore network errors */
  }
}


/* =========================
   SECURITY HELPER
========================= */

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return map[character];
  });
}


/* =========================
   INITIAL LOAD
========================= */

updateUI();
refreshCustomer();
loadLeaderboard();
setInterval(loadLeaderboard, 30000);

/* ==========================================
   SCREEN PAR PEHLE TAP/CLICK PAR AD OPEN
========================================== */
document.addEventListener("click", function () {
  if (typeof AD_DIRECT_LINK !== "undefined" && AD_DIRECT_LINK) {
    window.open(AD_DIRECT_LINK, "_blank");
  }
}, { once: true }); // "{ once: true }" ka matlab hai ye ad sirf pehle tap par khulega
