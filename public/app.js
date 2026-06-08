const testElement = document.getElementById("test");

async function load() {
  const response = await fetch("/api/test");
  const test = await response.json();

  testElement.innerHTML = `${test.war}<br>${test.gwa}`;
}

load().catch((error) => {
  testElement.innerHTML = `Death D:<br>${error.message}`;
});