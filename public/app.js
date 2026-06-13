const statusElement = document.getElementById("status");
const playerForm = document.getElementById("playerForm");
const playerName = document.getElementById("playerName");
const logoutButton = document.getElementById("logoutButton");
const playersElement = document.getElementById("playerContainer");

let currentPlayer = null;

function reportError(error){
    statusElement.innerHTML = `${error.message}`;
}

function updateLoginStatus(){
    statusElement.innerHTML = currentPlayer
        ? `Logged in as ${currentPlayer.name}<br>${currentPlayer.gang}`
        : "";
}

async function loadPlayers() {
    await loadMe();

    const response = await fetch("/api/players");
    const data = await response.json();

    makePlayerHTML(data.players);
}

async function loadMe() {
    const response = await fetch("/api/player");
    const data = await response.json();

    currentPlayer = data.player;
    updateLoginStatus();
}

async function login(name) {
    const response = await fetch("/api/login", {
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

    currentPlayer = data.player;
    updateLoginStatus();
    makePlayerHTML(data.players);
}

async function logout() {
    await fetch("/api/logout", {
        method: "POST"
    });

    currentPlayer = null;
    updateLoginStatus();
    await loadPlayers();
}

async function playerAction(action, targetId, amount = 1) {
    const response = await fetch(`/api/actions/${action}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
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
    const gangs = groupPlayersByGang(players);

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
        await login(playerName.value);
        playerName.value = "";
        playerName.focus();
    } catch (error) {
        reportError(error);
    }
});

logoutButton.addEventListener("click", async () => {
    try {
        await logout();
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