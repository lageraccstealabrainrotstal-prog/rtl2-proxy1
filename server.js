import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

app.post("/api/rtl2", async (req, res) => {
  const username = req.body.username || req.query.username;
  if (!username) return res.status(400).json({ error: "username missing" });

  const url = `https://whut.dev/api/rtl2/lookup?username=${encodeURIComponent(username)}&format=json`;

  try {
    const r = await fetch(url, { method: "POST" });
    const text = await r.text();
    res.status(r.status).type("application/json").send(text);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Proxy läuft auf Port " + port));
