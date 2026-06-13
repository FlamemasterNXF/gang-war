import express from "express";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {
    addPlayer,
    attackPlayer,
    donateAp,
    getPlayerByName,
    healPlayer,
    listPlayers,
    revivePlayer
} from "./players.js";
import {createSession, deleteSession, getPlayerBySession} from "./sessions.js";

const app = express();

app.use(express.json());
app.use(express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public")));
app.use((req, _res, next) => {
    req.cookies = parseCookies(req.headers.cookie ?? "");
    req.player = getPlayerBySession(req.cookies.sessionId);
    next();
});

function parseCookies(cookieHeader) {
    const cookies = {};

    for (const part of cookieHeader.split(";")) {
        const [name, ...valueParts] = part.trim().split("=");
        if (!name) continue;

        cookies[name] = decodeURIComponent(valueParts.join("="));
    }

    return cookies;
}

function getSessionCookie(session) {
    return `sessionId=${session.id}; HttpOnly; SameSite=Lax; Path=/; Expires=${new Date(session.expiresAt).toUTCString()}`;
}

function getExpiredCookie() {
    // This feels hacky, but seems like the accepted way to do this?
    return "sessionId=; HttpOnly; SameSite=Lax; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

function requirePlayer(req, res) {
    if (req.player) return true;

    res.status(401).json({
        error: "Please log in first!"
    });

    return false;
}

app.get("/api/player", (req, res) => {
    res.json({
        player: req.player ?? null
    });
});

app.get("/api/players", (_req, res) => {
    res.json({
        players: listPlayers()
    });
});

app.post("/api/login", (req, res) => {
    try {
        const name = String(req.body.name ?? "");
        const player = getPlayerByName(name) ?? addPlayer(name);
        const session = createSession(player.id);

        res.setHeader("Set-Cookie", getSessionCookie(session));

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

app.post("/api/logout", (req, res) => {
    deleteSession(req.cookies.sessionId);
    res.setHeader("Set-Cookie", getExpiredCookie());
    res.json({
        ok: true
    });
});

function action(req, res, fn) {
    if (!requirePlayer(req, res)) return;

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
    action(req, res, () => attackPlayer(req.player.id, req.body.targetId));
});

app.post("/api/actions/heal", (req, res) => {
    action(req, res, () => healPlayer(req.player.id, req.body.targetId));
});

app.post("/api/actions/donate", (req, res) => {
    action(req, res, () => donateAp(req.player.id, req.body.targetId, req.body.amount));
});

app.post("/api/actions/revive", (req, res) => {
    action(req, res, () => revivePlayer(req.player.id, req.body.targetId));
});

export default app;