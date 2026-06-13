import {DatabaseSync} from "node:sqlite";

export const db = new DatabaseSync("data/gang-war.sqlite");

export function initDb() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS players (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            gang TEXT NOT NULL,
            ap INTEGER NOT NULL,
            hp INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
            expires_at TEXT NOT NULL
        )
    `);
}

export function transaction(fn) {
    db.exec("BEGIN IMMEDIATE");

    try {
        const result = fn();
        db.exec("COMMIT");
        return result;
    } catch (error) {
        db.exec("ROLLBACK");
        throw error;
    }
}

initDb();