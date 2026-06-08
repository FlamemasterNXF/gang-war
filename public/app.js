const statusElement = document.getElementById("status");
const playerForm = document.getElementById("playerForm");
const playerName = document.getElementById("playerName");
const actorSelect = document.getElementById("actorId");
const playersElement = document.getElementById("playerContainer");

function reportError(error){
    statusElement.innerHTML = `Death D:<br>${error.message}`;
}

async function loadPlayers() {
    const response = await fetch("/api/players");
    const data = await response.json();

    makePlayerHTML(data.players);
}

async function addPlayer(name) {
    const response = await fetch("/api/players", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({name})
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error);
    }

    makePlayerHTML(data.players);
}

async function playerAction(action, targetId, amount = 1) {
    const response = await fetch(`/api/actions/${action}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            actorId: actorSelect.value,
            targetId,
            amount
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error);
    }

    makePlayerHTML(data.players);
}

function makePlayerHTML(players) {
    const selectedActorId = actorSelect.value;
    const gangs = groupPlayersByGang(players);

    actorSelect.innerHTML = players
        .map((player) => `<option value="${player.id}">${player.name}</option>`)
        .join("");

    actorSelect.value = players.some((player) => String(player.id) === selectedActorId)
        ? selectedActorId
        : String(players[0]?.id ?? "");

    playersElement.innerHTML = gangs
        .map((gang) => {
            return `
        <section class="gangRow">
          <h2>${gang.name}</h2>
          <div class="playerRow">
            ${gang.players
                .map((player) => {
                    return `
                  <div class="player">
                    <strong>${player.name}</strong><br>
                    AP: ${player.ap} | HP: ${player.hp}<br>
                    <button data-action="attack" data-target="${player.id}">Attack</button>
                    <button data-action="heal" data-target="${player.id}">Heal</button>
                    <button data-action="donate" data-target="${player.id}">Donate</button>
                    <button data-action="revive" data-target="${player.id}">Revive</button>
                  </div>
                `;
                })
                .join("")}
          </div>
        </section>
      `;
        })
        .join("");
}

function groupPlayersByGang(players) {
    const gangs = [];

    for (const player of players) {
        let gang = gangs.find((existingGang) => existingGang.name === player.gang);

        if (!gang) {
            gang = {
                name: player.gang,
                players: []
            };
            gangs.push(gang);
        }
        gang.players.push(player);
    }

    return gangs.sort((a, b) => a.name.localeCompare(b.name));
}

playerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
        await addPlayer(playerName.value);
        playerName.value = "";
        playerName.focus();
    } catch (error) {
        reportError(error);
    }
});

playersElement.addEventListener("click", async (event) => {
    const button = event.target.closest("button");

    if (!button) return;

    try {
        const amount = button.dataset.action === "donate" ? Number(prompt("AP amount?", "1")) : 1;
        await playerAction(button.dataset.action, Number(button.dataset.target), amount);
    } catch (error) {
        reportError(error);
    }
});

loadPlayers().catch((error) => {
    reportError(error);
});