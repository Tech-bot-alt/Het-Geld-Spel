const clientId = "Ov23liv6GxlwM7ONu1qb"; // Vul hier je eigen Client ID in
const redirectUri = "https://tech-bot-alt.github.io/Het-Geld-Spel/auth/callback"; // Of het pad dat je in de OAuth-app hebt ingesteld

function loginWithGitHub() {
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  window.location.href = githubAuthUrl;
}

// Bijvoorbeeld, aan een knop koppelen:
document.getElementById('oauth github').addEventListener('click', loginWithGitHub);
