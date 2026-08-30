const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const crypto = require("crypto");
const { DatabaseSync } = require("node:sqlite");

const app = express();

const PORT = process.env.PORT || 3000;

const db = new DatabaseSync(
  path.join(__dirname, "shop.db")
);

app.disable("x-powered-by");

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

app.use(
  express.json({
    limit: "20kb"
  })
);

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: "draft-8",
  legacyHeaders: false
});

app.use("/api", apiLimiter);

/* =========================
   DATABASE
========================= */

db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    points INTEGER NOT NULL DEFAULT 0,
    games_played INTEGER NOT NULL DEFAULT 0,
    best_score INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS game_sessions (
    id TEXT PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    game TEXT NOT NULL,
    started_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(customer_id) REFERENCES customers(id)
  );

  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    game TEXT NOT NULL,
    score INTEGER NOT NULL,
    points INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(customer_id) REFERENCES customers(id)
  );

  CREATE INDEX IF NOT EXISTS idx_scores_points
  ON scores(points DESC);
`);

/* =========================
   GAMES
========================= */

const allowedGames = new Set([
  "coin-rush",
  "memory-master",
  "reaction",
  "target-hunter",
  "number-guess",
  "survival-shooter",
  "free-fire-2d"
]);

const gameRules = {
  "coin-rush": {
    minSeconds: 12,
    maxPoints: 40
  },

  "memory-master": {
    minSeconds: 8,
    maxPoints: 50
  },

  "reaction": {
    minSeconds: 3,
    maxPoints: 40
  },

  "target-hunter": {
    minSeconds: 10,
    maxPoints: 50
  },

  "number-guess": {
    minSeconds: 5,
    maxPoints: 40
  },

  "survival-shooter": {
    minSeconds: 10,
    maxPoints: 50
  },

  "free-fire-2d": {
    minSeconds: 10,
    maxPoints: 50
  }
};

/* =========================
   REWARDS
========================= */

function getDiscount(points) {

  if (points >= 1000) {
    return 20;
  }

  if (points >= 600) {
    return 15;
  }

  if (points >= 300) {
    return 10;
  }

  if (points >= 100) {
    return 5;
  }

  return 0;
}

/* =========================
   CUSTOMER VIEW
========================= */

function customerView(row) {

  if (!row) {
    return null;
  }

  const discount = getDiscount(row.points);

  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    points: row.points,
    gamesPlayed: row.games_played,
    bestScore: row.best_score,
    discount: discount,
    coupon: discount
      ? `ASAD${discount}`
      : null
  };
}

/* =========================
   INPUT CLEANING
========================= */

function cleanName(value) {

  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 60);
}

function cleanPhone(value) {

  return String(value || "")
    .replace(/\D/g, "")
    .slice(0, 10);
}

/* =========================
   GAME SESSION
========================= */

function createGameSession(customerId, game) {

  const now = Date.now();

  const sessionId = crypto.randomUUID();

  const duration =
    2 * 60 * 1000;

  db.prepare(`
    INSERT INTO game_sessions
    (
      id,
      customer_id,
      game,
      started_at,
      expires_at
    )
    VALUES (?, ?, ?, ?, ?)
  `).run(
    sessionId,
    customerId,
    game,
    now,
    now + duration
  );

  return {
    sessionId,
    startedAt: now,
    expiresAt: now + duration
  };
}

/* =========================
   HEALTH
========================= */

app.get("/api/health", (req, res) => {

  res.json({
    ok: true,
    service: "Asad Shop",
    time: new Date().toISOString()
  });

});

/* =========================
   CREATE CUSTOMER
========================= */

app.post("/api/customers", (req, res) => {

  const name = cleanName(req.body.name);

  const phone = cleanPhone(req.body.phone);

  if (
    name.length < 2 ||
    phone.length !== 10
  ) {

    return res.status(400).json({
      error:
        "Valid name and 10-digit mobile number required."
    });

  }

  const existing = db
    .prepare(
      "SELECT * FROM customers WHERE phone = ?"
    )
    .get(phone);

  if (existing) {

    db.prepare(`
      UPDATE customers
      SET
        name = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name,
      existing.id
    );

    const customer = db
      .prepare(
        "SELECT * FROM customers WHERE id = ?"
      )
      .get(existing.id);

    return res.json({
      customer: customerView(customer)
    });
  }

  const result = db.prepare(`
    INSERT INTO customers
    (
      name,
      phone
    )
    VALUES (?, ?)
  `).run(
    name,
    phone
  );

  const customer = db
    .prepare(
      "SELECT * FROM customers WHERE id = ?"
    )
    .get(
      Number(result.lastInsertRowid)
    );

  res.status(201).json({
    customer: customerView(customer)
  });

});

/* =========================
   GET CUSTOMER
========================= */

app.get(
  "/api/customers/:id",
  (req, res) => {

    const id = Number(req.params.id);

    if (
      !Number.isInteger(id) ||
      id < 1
    ) {

      return res.status(400).json({
        error: "Invalid customer ID."
      });

    }

    const customer = db
      .prepare(
        "SELECT * FROM customers WHERE id = ?"
      )
      .get(id);

    if (!customer) {

      return res.status(404).json({
        error: "Customer not found."
      });

    }

    res.json({
      customer: customerView(customer)
    });

  }
);

/* =========================
   START GAME
========================= */

app.post(
  "/api/games/:game/start",
  (req, res) => {

    const game = req.params.game;

    const customerId =
      Number(req.body.customerId);

    if (!allowedGames.has(game)) {

      return res.status(404).json({
        error: "Game not found."
      });

    }

    const customer = db
      .prepare(
        "SELECT id FROM customers WHERE id = ?"
      )
      .get(customerId);

    if (!customer) {

      return res.status(401).json({
        error:
          "Please create your customer profile first."
      });

    }

    const session =
      createGameSession(
        customerId,
        game
      );

    res.json({
      success: true,
      game,
      ...session
    });

  }
);

/* =========================
   FINISH GAME
========================= */

app.post(
  "/api/games/:game/finish",
  (req, res) => {

    const game = req.params.game;

    const sessionId =
      String(req.body.sessionId || "");

    const rawScore =
      Number(req.body.score);

    if (!allowedGames.has(game)) {

      return res.status(404).json({
        error: "Game not found."
      });

    }

    if (
      !Number.isFinite(rawScore) ||
      rawScore < 0 ||
      rawScore > 100000
    ) {

      return res.status(400).json({
        error: "Invalid score."
      });

    }

    const session = db
      .prepare(`
        SELECT *
        FROM game_sessions
        WHERE
          id = ?
          AND game = ?
      `)
      .get(
        sessionId,
        game
      );

    if (
      !session ||
      session.used
    ) {

      return res.status(400).json({
        error:
          "Invalid or already-used game session."
      });

    }

    const now = Date.now();

    if (
      now > session.expires_at
    ) {

      return res.status(400).json({
        error:
          "Game session expired."
      });

    }

    const elapsed =
      (now - session.started_at) /
      1000;

    const rule =
      gameRules[game];

    if (
      elapsed <
      rule.minSeconds
    ) {

      return res.status(400).json({
        error:
          "Game finished too quickly."
      });

    }

    const score =
      Math.min(
        Math.floor(rawScore),
        1000
      );

    let points =
      Math.min(
        Math.ceil(score / 5),
        rule.maxPoints
      );

    if (
      game === "memory-master"
    ) {

      points =
        Math.min(
          score,
          rule.maxPoints
        );

    }

    if (
      game === "reaction"
    ) {

      points =
        Math.min(
          Math.floor(score),
          rule.maxPoints
        );

    }

    if (
      game === "number-guess"
    ) {

      points =
        Math.min(
          Math.floor(score),
          rule.maxPoints
        );

    }

    db.prepare(`
      UPDATE game_sessions
      SET used = 1
      WHERE id = ?
    `).run(sessionId);

    const customer = db
      .prepare(
        "SELECT * FROM customers WHERE id = ?"
      )
      .get(session.customer_id);

    const bestScore =
      Math.max(
        customer.best_score,
        score
      );

    db.prepare(`
      UPDATE customers
      SET
        points = points + ?,
        games_played = games_played + 1,
        best_score = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      points,
      bestScore,
      customer.id
    );

    db.prepare(`
      INSERT INTO scores
      (
        customer_id,
        game,
        score,
        points
      )
      VALUES (?, ?, ?, ?)
    `).run(
      customer.id,
      game,
      score,
      points
    );

    const updated =
      db.prepare(
        "SELECT * FROM customers WHERE id = ?"
      ).get(customer.id);

    res.json({
      success: true,
      message:
        "Game completed successfully.",
      earned: points,
      customer:
        customerView(updated)
    });

  }
);

/* =========================
   LEADERBOARD
========================= */

app.get(
  "/api/leaderboard",
  (req, res) => {

    const rows = db.prepare(`
      SELECT
        name,
        best_score,
        points
      FROM customers
      ORDER BY
        points DESC,
        best_score DESC
      LIMIT 10
    `).all();

    res.json({
      leaderboard: rows
    });

  }
);

/* =========================
   STATIC WEBSITE & ROUTES
========================= */

// Direct static file serving (Root folder + Public folder dono support karega)
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, "public")));

// Direct index.html handler
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"), (err) => {
    if (err) {
      res.sendFile(path.join(__dirname, "public", "index.html"));
    }
  });
});

/* =========================
   START SERVER
========================= */

app.listen(
  PORT,
  () => {

    console.log(
      `Asad Shop running on port ${PORT}`
    );

  }
);
