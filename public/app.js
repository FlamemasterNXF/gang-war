const testElement = document.getElementById("test");
const playerForm = document.getElementById("playerForm");
const playerName = document.getElementById("playerName");
const playersElement = document.getElementById("players");

async function load() {
  const response = await fetch("/api/test");
  const test = await response.json();

  testElement.innerHTML = `${test.war}<br>${test.gwa}`;
  await loadPlayers();
}

async function loadPlayers() {
  const response = await fetch("/api/players");
  const data = await response.json();

  playersElement.innerHTML = data.players
    .map((player) => `<li>${player.name} - ${player.gang}</li>`)
    .join("");
}

async function addPlayer(name) {
  const response = await fetch("/api/players", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error);
  }

  playersElement.innerHTML = data.players
    .map((player) => `<li>${player.name} - ${player.gang}</li>`)
    .join("");
}

playerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await addPlayer(playerName.value);
    playerName.value = "";
    playerName.focus();
  } catch (error) {
    testElement.innerHTML = `Death D:<br>${error.message}`;
  }
});

load().catch((error) => {
  testElement.innerHTML = `Death D:<br>${error.message}`;
});