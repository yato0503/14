import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// 静的ファイルの配信設定を追加
app.use(express.static('public'));

const db = new sqlite3.Database("./calendar.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      startTime TEXT,
      endTime TEXT,
      title TEXT,
      type TEXT
    )
  `);
});

// 全予定取得
app.get("/events", (req, res) => {
  db.all("SELECT * FROM events", (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

// 予定追加
app.post("/events", (req, res) => {
  const { date, startTime, endTime, title, type } = req.body;
  db.run(
    "INSERT INTO events (date, startTime, endTime, title, type) VALUES (?, ?, ?, ?, ?)",
    [date, startTime, endTime, title, type],
    function(err) {
      if (err) return res.status(500).json(err);
      res.json({ id: this.lastID, date, startTime, endTime, title, type });
    }
  );
});

// 予定削除
app.delete("/events/:id", (req, res) => {
  const id = Number(req.params.id);
  db.run("DELETE FROM events WHERE id = ?", [id], err => {
    if (err) return res.status(500).json(err);
    res.json({ success: true });
  });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT} - server.js:59`));