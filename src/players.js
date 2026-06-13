import {db, transaction} from "./db.js";

function nextPlayerId() {
    const row = db.prepare(`
        SELECT coalesce(max(id) + 1, 0) AS id
        FROM players
    `).get();

    return row.id;
}

function rowToPlayer(row) {
    return {
        id: row.id,
        name: row.name,
        gang: row.gang,
        ap: row.ap,
        hp: row.hp
    };
}

export function gangForName(name) {
    const firstLetter = name.trim().charAt(0).toUpperCase(); // TODO: Update this to get around non-letter chars
    return `${firstLetter} Gang`;
}

export function listPlayers() {
    return db.prepare(`
        SELECT id, name, gang, ap, hp
        FROM players
        ORDER BY gang, name
    `).all().map(rowToPlayer);
}

export function addPlayer(name) {
    const cleanName = name.trim();

    if (!cleanName) {
        throw new Error("Player name is required!");
    }

    const player = {
        id: nextPlayerId(),
        name: cleanName,
        gang: gangForName(cleanName),
        ap: 3,
        hp: 3
    };

    db.prepare(`
        INSERT INTO players (id, name, gang, ap, hp)
        VALUES (?, ?, ?, ?, ?)
    `).run(player.id, player.name, player.gang, player.ap, player.hp);

    return player;
}

export function getPlayer(id) {
    const row = db.prepare(`
        SELECT id, name, gang, ap, hp
        FROM players
        WHERE id = ?
    `).get(Number(id));

    return row ? rowToPlayer(row) : undefined;
}

export function getPlayerByName(name) {
    const row = db.prepare(`
        SELECT id, name, gang, ap, hp
        FROM players
        WHERE lower(name) = lower(?)
    `).get(name.trim());

    return row ? rowToPlayer(row) : undefined;
}

function requirePlayer(id) {
    const player = getPlayer(id);

    if (!player) {
        throw new Error("Player not found!");
    }

    return player;
}

function requireAlive(player) {
    if (player.hp <= 0) {
        throw new Error("Dead players cannot act!");
    }
}

function spendAp(player, cost) {
    if (player.ap < cost) {
        throw new Error(`This action requires ${cost} AP!`);
    }

    player.ap -= cost;
}

export function attackPlayer(actorId, targetId) {
    return transaction(() => {
        const actor = requirePlayer(actorId);
        const target = requirePlayer(targetId);

        requireAlive(actor);

        if (target.hp <= 0) {
            throw new Error("You cannot attack a dead player!");
        }

        if (actor.id === target.id) {
            throw new Error("You cannot attack yourself!");
        }

        if (actor.gang === target.gang) {
            throw new Error("You cannot attack your own gang!");
        }

        spendAp(actor, 1);
        target.hp -= 1;
        savePlayer(actor);
        savePlayer(target);

        return {
            actor: getPlayer(actor.id),
            target: getPlayer(target.id)
        };
    });
}

export function healPlayer(actorId, targetId) {
    return transaction(() => {
        const actor = requirePlayer(actorId);
        const target = requirePlayer(targetId);

        requireAlive(actor);

        if (target.hp <= 0) {
            throw new Error("Dead players must be revived!");
        }

        if (target.hp >= 3) {
            throw new Error("That player is already at full HP!");
        }

        spendAp(actor, 1);
        target.hp += 1;

        if (actor.id === target.id) {
            savePlayer({
                ...target,
                ap: actor.ap
            });
        } else {
            savePlayer(actor);
            savePlayer(target);
        }

        return {
            actor: getPlayer(actor.id),
            target: getPlayer(target.id)
        };
    });
}

export function donateAp(actorId, targetId, amount) {
    return transaction(() => {
        const actor = requirePlayer(actorId);
        const target = requirePlayer(targetId);
        const cleanAmount = Number(amount);

        requireAlive(actor);

        if (!Number.isInteger(cleanAmount) || cleanAmount < 1) {
            throw new Error("Donation amount must be a positive whole number!");
        }

        if (target.hp <= 0) {
            throw new Error("You cannot donate AP to a dead player!");
        }

        if (actor.id === target.id) {
            throw new Error("You cannot donate AP to yourself!");
        }

        if (actor.gang !== target.gang) {
            throw new Error("You can only donate AP to your own gang!");
        }

        spendAp(actor, cleanAmount);
        target.ap += cleanAmount;
        savePlayer(actor);
        savePlayer(target);

        return {
            actor: getPlayer(actor.id),
            target: getPlayer(target.id)
        };
    });
}

export function revivePlayer(actorId, targetId) {
    return transaction(() => {
        const actor = requirePlayer(actorId);
        const target = requirePlayer(targetId);

        requireAlive(actor);

        if (target.hp > 0) {
            throw new Error("That player is not dead!");
        }

        spendAp(actor, 6);
        target.hp = 1;
        savePlayer(actor);
        savePlayer(target);

        return {
            actor: getPlayer(actor.id),
            target: getPlayer(target.id)
        };
    });
}

function savePlayer(player) {
    db.prepare(`
        UPDATE players
        SET name = ?,
            gang = ?,
            ap   = ?,
            hp   = ?
        WHERE id = ?
    `).run(player.name, player.gang, player.ap, player.hp, player.id);
}

export function resetPlayers() {
    db.prepare("DELETE FROM players").run();
}