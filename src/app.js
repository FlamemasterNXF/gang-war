import express from "express";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {
    addPlayer,
    attackPlayer,
    donateAp,
    healPlayer,
    listPlayers,
    revivePlayer
} from "./players.js";

const app = express();

app.use(express.json());
app.use(express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public")));

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

function action(res, fn) {
    try {
        const result = fn();

        res.json({
            ...result,
            players: listPlayers()
        });
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
}

app.post("/api/actions/attack", (req, res) => {
    action(res, () => attackPlayer(req.body.actorId, req.body.targetId));
});

app.post("/api/actions/heal", (req, res) => {
    action(res, () => healPlayer(req.body.actorId, req.body.targetId));
});

app.post("/api/actions/donate", (req, res) => {
    action(res, () => donateAp(req.body.actorId, req.body.targetId, req.body.amount));
});

app.post("/api/actions/revive", (req, res) => {
    action(res, () => revivePlayer(req.body.actorId, req.body.targetId));
});

export default app;