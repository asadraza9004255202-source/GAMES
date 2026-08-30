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
    build: buildSurvivalShooter
  }
};


/* =========================
   GAME CLICK & MODAL
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

  try {
    const data = await api(`/api/games/${game}/start`, {
      method: "POST",
      body: JSON.stringify({
        customerId: state.customer.id
      })
    });

    state.session = data;
    state.currentGame = game;

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
    $("gameMessage").textContent = error.message;
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
   GAME 6 — FREE FIRE 2D (SURVIVAL SHOOTER + BOOYAH)
===================================================== */

function buildSurvivalShooter() {
  const stage = document.createElement("div");
  stage.className = "stage";
  stage.style.flexDirection = "column";
  stage.style.alignItems = "center";

  stage.innerHTML = `
    <canvas id="ffCanvas" width="320" height="260" style="background:#0f172a; border-radius:12px; border:2px solid #6366f1; cursor:crosshair; touch-action:none; max-width:100%;"></canvas>
    <p style="font-size:12px; color:#9ca3af; margin-top:8px;">Tap / Click anywhere to Aim & Shoot!</p>
  `;

  $("gameStage").appendChild(stage);

  const canvas = document.getElementById("ffCanvas");
  const ctx = canvas.getContext("2d");

  let player = { x: canvas.width / 2, y: canvas.height / 2, radius: 12, color: "#6366f1" };
  let bullets = [];
  let enemies = [];
  let score = 0;
  let gameOver = false;
  let spawnInterval = null;
  let loopId = null;

  function triggerBooyahEnd() {
    gameOver = true;
    clearInterval(spawnInterval);
    cancelAnimationFrame(loopId);

    // Play Fanfare Music Sound
    playBooyahSound();

    // Draw BOOYAH Overlay
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#f59e0b";
    ctx.font = "bold 24px sans-serif";
    ctx.textAlign = "center";
    ctx.shadowColor = "#ef4444";
    ctx.shadowBlur = 10;
    ctx.fillText("🔥 ASAD BOOYAH! 🔥", canvas.width / 2, canvas.height / 2 - 10);

    ctx.fillStyle = "#ffffff";
    ctx.font = "14px sans-serif";
    ctx.shadowBlur = 0;
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);

    setTimeout(() => {
      finishGame(score);
    }, 1200);
  }

  function shoot(e) {
    if (gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const targetX = clientX - rect.left;
    const targetY = clientY - rect.top;

    const angle = Math.atan2(targetY - player.y, targetX - player.x);
    bullets.push({
      x: player.x,
      y: player.y,
      dx: Math.cos(angle) * 7,
      dy: Math.sin(angle) * 7,
      radius: 4
    });
  }

  canvas.addEventListener("click", shoot);
  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    shoot(e);
  });

  spawnInterval = setInterval(() => {
    if (gameOver) return;
    let x, y;
    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? 0 : canvas.width;
      y = Math.random() * canvas.height;
    } else {
      x = Math.random() * canvas.width;
      y = Math.random() < 0.5 ? 0 : canvas.height;
    }
    const angle = Math.atan2(player.y - y, player.x - x);
    enemies.push({ x, y, dx: Math.cos(angle) * 1.5, dy: Math.sin(angle) * 1.5, radius: 10 });
  }, 900);

  function update() {
    if (gameOver) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Player
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();

    // Move & Draw Bullets
    bullets.forEach((b, bi) => {
      b.x += b.dx;
      b.y += b.dy;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#f59e0b";
      ctx.fill();

      if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
        bullets.splice(bi, 1);
      }
    });

    // Move & Draw Enemies
    enemies.forEach((e, ei) => {
      e.x += e.dx;
      e.y += e.dy;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#ef4444";
      ctx.fill();

      // Collision with player
      const distToPlayer = Math.hypot(player.x - e.x, player.y - e.y);
      if (distToPlayer < player.radius + e.radius) {
        triggerBooyahEnd();
        return;
      }

      // Collision with bullets
      bullets.forEach((b, bi) => {
        const dist = Math.hypot(b.x - e.x, b.y - e.y);
        if (dist < b.radius + e.radius) {
          enemies.splice(ei, 1);
          bullets.splice(bi, 1);
          score += 10;
          $("liveScore").textContent = score;

          if (score >= 100) {
            triggerBooyahEnd();
          }
        }
      });
    });

    if (!gameOver) {
      loopId = requestAnimationFrame(update);
    }
  }

  update();
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
