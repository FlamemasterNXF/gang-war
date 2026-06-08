import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { addPlayer, listPlayers } from "./players.js";
import { test } from "./test.js";

const app = express();

app.use(express.json());
app.use(express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public")));

app.get("/api/test", (_req, res) => {
  res.json(test());
});

app.get("/api/players", (_req, res) => {
  res.json({
    players: listPlayers()
  });
});

app.post("/api/players", (req, res) => {
  try {
    const player = addPlayer(String(req.body.name || ""));

    res.status(201).json({
      player,
      players: listPlayers()
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

export default app;