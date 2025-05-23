// --------- Inlogsysteem ---------
function getUsers() {
  return JSON.parse(localStorage.getItem('users') || '{}');
}

function setUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

function login() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const users = getUsers();
  if (users[username] && users[username].password === password) {
    localStorage.setItem('loggedInUser', username);
    showGame();
    playSound('cash');
  } else {
    document.getElementById('login-message').innerText = "Ongeldige inloggegevens.";
  }
}

function register() {
  const username = document.getElementById('new-username').value.trim();
  const password = document.getElementById('new-password').value;
  if (username.length < 3 || password.length < 3) {
    document.getElementById('register-message').innerText = "Gebruikersnaam en wachtwoord minimaal 3 tekens.";
    return;
  }
  const users = getUsers();
  if (users[username]) {
    document.getElementById('register-message').innerText = "Deze gebruikersnaam bestaat al.";
    return;
  }
  users[username] = { password: password, geld: 1000, gebouwen: [], income: 0 };
  setUsers(users);
  document.getElementById('register-message').innerText = "Account aangemaakt! Je kunt nu inloggen.";
}

// ---- OAUTH Placeholders ----
function oauthNotImplemented(provider) {
  alert(`Inloggen met ${provider} is nog niet geïmplementeerd in deze demo. Gebruik je gebruikersnaam en wachtwoord of voeg een backend toe voor echte OAuth.`);
}

function logout() {
  localStorage.removeItem('loggedInUser');
  location.reload();
}

function getCurrentUser() {
  const username = localStorage.getItem('loggedInUser');
  if (!username) return null;
  const users = getUsers();
  return users[username] ? { ...users[username], username } : null;
}

function saveCurrentUser(data) {
  const username = localStorage.getItem('loggedInUser');
  if (!username) return;
  const users = getUsers();
  users[username] = { ...users[username], ...data };
  setUsers(users);
}

function showGame() {
  document.getElementById('login-container').style.display = 'none';
  document.getElementById('game-container').style.display = '';
  const user = getCurrentUser();
  document.getElementById('welcome').innerText = 'Welkom, ' + user.username + '!';
  updateGeld();
  renderGebouwButtons();
  updateStats();
  if (document.getElementById('music-toggle').checked) playMusic();
}

function playSound(type) {
  if (type === 'cash') {
    const audio = document.getElementById('audio-cash');
    audio.currentTime = 0;
    audio.play();
  } else if (type === 'city') {
    const audio = document.getElementById('audio-city');
    audio.currentTime = 0;
    audio.play();
  }
}

function playMusic() {
  const music = document.getElementById('audio-music');
  music.volume = 0.5;
  music.play();
}
function stopMusic() {
  const music = document.getElementById('audio-music');
  music.pause();
  music.currentTime = 0;
}
document.getElementById('music-toggle').addEventListener('change', function() {
  if(this.checked) playMusic();
  else stopMusic();
});

// --------- Speldata ---------
const gebouwenTypes = [
  { naam: "Huis", prijs: 1000, opbrengst: 150, kleur: 0x64b5f6, sound: "cash" },
  { naam: "Winkel", prijs: 5000, opbrengst: 700, kleur: 0x43a047, sound: "cash" },
  { naam: "Kantoor", prijs: 15000, opbrengst: 2500, kleur: 0xfbc02d, sound: "cash" },
  { naam: "Fabriek", prijs: 30000, opbrengst: 6000, kleur: 0x8d6e63, sound: "city" },
  { naam: "Bank", prijs: 80000, opbrengst: 15000, kleur: 0xb71c1c, sound: "cash" },
];

let geld = 0;
let gebouwen = [];
let income = 0;

// THREE.js setup
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa0e5f7);

const camera = new THREE.PerspectiveCamera(75, 800 / 500, 0.1, 1000);
let cameraTarget = { x:0, y:4, z:10 };
camera.position.set(0, 6, 16);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(800, 500);
container.appendChild(renderer.domElement);

const lights = [
  new THREE.DirectionalLight(0xffffff, 0.8),
  new THREE.AmbientLight(0xffffff, 0.6)
];
lights[0].position.set(10, 20, 10);
lights.forEach(light => scene.add(light));

const groundGeo = new THREE.PlaneGeometry(40, 40);
const groundMat = new THREE.MeshLambertMaterial({ color: 0x388e3c });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const gebouwenMeshes = [];

function plaatsGebouw(typeIndex, pos = null) {
  const type = gebouwenTypes[typeIndex];
  // Random positie op het grid
  let x, z;
  if (pos) {
    x = pos.x;
    z = pos.z;
  } else {
    x = Math.floor(Math.random() * 30 - 15);
    z = Math.floor(Math.random() * 30 - 15);
  }

  let hoogte = 1 + typeIndex * 1.3;
  let breedte = 1.2 + typeIndex * 0.7;
  let diepte = 1.2 + typeIndex * 0.7;

  const gebouw = new THREE.Mesh(new THREE.BoxGeometry(breedte, hoogte, diepte),
    new THREE.MeshLambertMaterial({ color: type.kleur }));
  gebouw.position.set(x, hoogte / 2, z);
  scene.add(gebouw);
  gebouwenMeshes.push(gebouw);
  gebouwen.push({ type: typeIndex, x, z });
  income += type.opbrengst;
}

function koopGebouw(typeIndex) {
  const type = gebouwenTypes[typeIndex];
  if (geld >= type.prijs) {
    geld -= type.prijs;
    plaatsGebouw(typeIndex);
    updateGeld();
    updateStats();
    saveCurrentUser({ geld, gebouwen, income });

    setTimeout(() => {
      geld += type.opbrengst;
      updateGeld();
      updateStats();
      saveCurrentUser({ geld });
      playSound(type.sound);
    }, 7000 + Math.random() * 6000); // Opbrengst na 7-13 sec

    playSound(type.sound);
  } else {
    alert('Niet genoeg geld!');
  }
}

function updateGeld() {
  document.getElementById('geld').innerText = `Geld: €${geld}`;
}

function updateStats() {
  document.getElementById('buildings').innerText = `Gebouwen: ${gebouwen.length}`;
  document.getElementById('income').innerText = `Totaal inkomen: €${income}/beurt`;
}

function renderGebouwButtons() {
  const gebouwButtons = document.getElementById('gebouw-buttons');
  gebouwButtons.innerHTML = '';
  gebouwenTypes.forEach((type, index) => {
    const btn = document.createElement('button');
    btn.innerText = `${type.naam} (€${type.prijs})\n+€${type.opbrengst}`;
    btn.onclick = () => koopGebouw(index);
    gebouwButtons.appendChild(btn);
  });
}

// Geld per minuut systeem
setInterval(() => {
  if (localStorage.getItem('loggedInUser')) {
    geld += gebouwen.reduce((acc, g) => acc + gebouwenTypes[g.type].opbrengst, 0);
    updateGeld();
    updateStats();
    saveCurrentUser({ geld });
    playSound('cash');
  }
}, 15000);

// WASD of pijltjestoetsen voor camera bewegen
document.addEventListener('keydown', (e) => {
  if (document.getElementById('game-container').style.display !== "") return;
  switch (e.key.toLowerCase()) {
    case 'a':
    case 'arrowleft':
      camera.position.x -= 1;
      break;
    case 'd':
    case 'arrowright':
      camera.position.x += 1;
      break;
    case 'w':
    case 'arrowup':
      camera.position.z -= 1;
      break;
    case 's':
    case 'arrowdown':
      camera.position.z += 1;
      break;
    case 'q':
      camera.position.y += 1;
      break;
    case 'e':
      camera.position.y -= 1;
      break;
  }
  camera.lookAt(0, 0, 0);
});

// Camera reset knop
function resetCamera() {
  camera.position.set(0, 6, 16);
  camera.lookAt(0, 0, 0);
}

// Laad spelerdata bij inloggen
function loadPlayerData() {
  const user = getCurrentUser();
  if (!user) return;
  geld = user.geld || 0;
  gebouwen = user.gebouwen || [];
  income = user.income || 0;
  // Gebouwen laden in de 3D-wereld
  gebouwen.forEach(g => {
    plaatsGebouw(g.type, { x: g.x, z: g.z });
  });
  updateStats();
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// Bij starten: check login status
window.onload = () => {
  const user = getCurrentUser();
  if (user) {
    showGame();
    loadPlayerData();
  }
};
