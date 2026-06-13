import crypto from "node:crypto";
import {db} from "./db.js";
import {getPlayer} from "./players.js";

export function createSession(playerId) {
    const id = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    db.prepare(`
        INSERT INTO sessions (id, player_id, expires_at)
        VALUES (?, ?, ?)
    `).run(id, playerId, expiresAt);

    return {
        id,
        expiresAt
    };
}

export function getPlayerBySession(sessionId) {
    if (!sessionId) return undefined;

    const session = db.prepare(`
        SELECT id, player_id, expires_at
        FROM sessions
        WHERE id = ?
    `).get(sessionId);

    if (!session) return undefined;

    if (new Date(session.expires_at).getTime() <= Date.now()) {
        deleteSession(session.id);
        return undefined;
    }

    return getPlayer(session.player_id);
}

export function deleteSession(sessionId) {
    if (!sessionId) return;

    db.prepare(`
        DELETE FROM sessions
        WHERE id = ?
    `).run(sessionId);
}

export function resetSessions() {
    db.prepare("DELETE FROM sessions").run();
}