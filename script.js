// Game canvas and context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game state
let gameState = {
  running: false,
  paused: false,
  score: 0,
  level: 1,
  time: 0,
  gameStartTime: 0,
};

// Player object
const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  width: 20,
  height: 20,
  speed: 200,
  health: 100,
  maxHealth: 100,
  experience: 0,
  experienceToNext: 100,
};

// Game objects arrays
let enemies = [];
let projectiles = [];
let pickups = [];
let particles = [];

// Input handling
const keys = {};

// Weapon system
const weapons = {
  fireball: {
    damage: 25,
    speed: 300,
    cooldown: 800,
    lastFired: 0,
    level: 1,
  },
};

// Upgrades system
const upgrades = [
  {
    name: "Increased Damage",
    description: "Weapons deal 25% more damage",
    effect: () => {
      Object.keys(weapons).forEach((weapon) => {
        weapons[weapon].damage *= 1.25;
      });
    },
  },
  {
    name: "Faster Shooting",
    description: "Reduce weapon cooldown by 20%",
    effect: () => {
      Object.keys(weapons).forEach((weapon) => {
        weapons[weapon].cooldown *= 0.8;
      });
    },
  },
  {
    name: "Health Boost",
    description: "Increase max health by 25",
    effect: () => {
      player.maxHealth += 25;
      player.health = Math.min(player.health + 25, player.maxHealth);
    },
  },
  {
    name: "Speed Boost",
    description: "Move 20% faster",
    effect: () => {
      player.speed *= 1.2;
    },
  },
  {
    name: "Projectile Speed",
    description: "Projectiles move 30% faster",
    effect: () => {
      Object.keys(weapons).forEach((weapon) => {
        weapons[weapon].speed *= 1.3;
      });
    },
  },
];

// Event listeners
document.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
});

document.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

// Initialize game
function init() {
  gameState.running = true;
  gameState.gameStartTime = Date.now();

  // Reset player
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  player.health = player.maxHealth;
  player.experience = 0;

  // Clear arrays
  enemies = [];
  projectiles = [];
  pickups = [];
  particles = [];

  // Start game loop
  gameLoop();
}

// Main game loop
function gameLoop() {
  if (!gameState.running) return;

  const deltaTime = 1 / 60; // 60 FPS

  update(deltaTime);
  render();

  requestAnimationFrame(gameLoop);
}

// Update game logic
function update(deltaTime) {
  if (gameState.paused) return;

  // Update game time
  gameState.time = Math.floor((Date.now() - gameState.gameStartTime) / 1000);
  updateUI();

  // Update player
  updatePlayer(deltaTime);

  // Update weapons
  updateWeapons(deltaTime);

  // Update enemies
  updateEnemies(deltaTime);

  // Update projectiles
  updateProjectiles(deltaTime);

  // Update particles
  updateParticles(deltaTime);

  // Spawn enemies
  spawnEnemies(deltaTime);

  // Check collisions
  checkCollisions();

  // Check if player should level up
  checkLevelUp();
}

// Update player movement
function updatePlayer(deltaTime) {
  let dx = 0;
  let dy = 0;

  if (keys["w"] || keys["arrowup"]) dy -= 1;
  if (keys["s"] || keys["arrowdown"]) dy += 1;
  if (keys["a"] || keys["arrowleft"]) dx -= 1;
  if (keys["d"] || keys["arrowright"]) dx += 1;

  // Normalize diagonal movement
  if (dx !== 0 && dy !== 0) {
    dx *= 0.707;
    dy *= 0.707;
  }

  // Update position
  player.x += dx * player.speed * deltaTime;
  player.y += dy * player.speed * deltaTime;

  // Keep player in bounds
  player.x = Math.max(
    player.width / 2,
    Math.min(canvas.width - player.width / 2, player.x)
  );
  player.y = Math.max(
    player.height / 2,
    Math.min(canvas.height - player.height / 2, player.y)
  );
}

// Update weapons (auto-fire)
function updateWeapons(deltaTime) {
  const now = Date.now();

  if (
    enemies.length > 0 &&
    now - weapons.fireball.lastFired > weapons.fireball.cooldown
  ) {
    // Find nearest enemy
    let nearestEnemy = null;
    let nearestDistance = Infinity;

    enemies.forEach((enemy) => {
      const distance = Math.sqrt(
        Math.pow(enemy.x - player.x, 2) + Math.pow(enemy.y - player.y, 2)
      );
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestEnemy = enemy;
      }
    });

    if (nearestEnemy) {
      // Calculate direction to enemy
      const angle = Math.atan2(
        nearestEnemy.y - player.y,
        nearestEnemy.x - player.x
      );

      // Create projectile
      projectiles.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * weapons.fireball.speed,
        vy: Math.sin(angle) * weapons.fireball.speed,
        damage: weapons.fireball.damage,
        size: 6,
        life: 3,
        color: "#ff6600",
      });

      weapons.fireball.lastFired = now;
    }
  }
}

// Update enemies
function updateEnemies(deltaTime) {
  enemies.forEach((enemy, index) => {
    // Move towards player
    const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
    enemy.x += Math.cos(angle) * enemy.speed * deltaTime;
    enemy.y += Math.sin(angle) * enemy.speed * deltaTime;

    // Check if enemy reached player
    const distance = Math.sqrt(
      Math.pow(enemy.x - player.x, 2) + Math.pow(enemy.y - player.y, 2)
    );
    if (distance < enemy.size + player.width / 2) {
      // Damage player
      player.health -= enemy.damage;

      // Remove enemy
      enemies.splice(index, 1);

      // Create damage particles
      createParticles(player.x, player.y, "#ff4444", 5);

      // Check if player died
      if (player.health <= 0) {
        gameOver();
      }
    }
  });
}

// Update projectiles
function updateProjectiles(deltaTime) {
  projectiles.forEach((projectile, index) => {
    projectile.x += projectile.vx * deltaTime;
    projectile.y += projectile.vy * deltaTime;
    projectile.life -= deltaTime;

    // Remove if out of bounds or expired
    if (
      projectile.x < 0 ||
      projectile.x > canvas.width ||
      projectile.y < 0 ||
      projectile.y > canvas.height ||
      projectile.life <= 0
    ) {
      projectiles.splice(index, 1);
    }
  });
}

// Update particles
function updateParticles(deltaTime) {
  particles.forEach((particle, index) => {
    particle.x += particle.vx * deltaTime;
    particle.y += particle.vy * deltaTime;
    particle.life -= deltaTime;
    particle.alpha = particle.life / particle.maxLife;

    if (particle.life <= 0) {
      particles.splice(index, 1);
    }
  });
}

// Spawn enemies
function spawnEnemies(deltaTime) {
  // Increase spawn rate over time
  const spawnRate = Math.min(0.5 + gameState.time * 0.01, 3);

  if (Math.random() < spawnRate * deltaTime) {
    // Choose spawn side
    const side = Math.floor(Math.random() * 4);
    let x, y;

    switch (side) {
      case 0: // Top
        x = Math.random() * canvas.width;
        y = -20;
        break;
      case 1: // Right
        x = canvas.width + 20;
        y = Math.random() * canvas.height;
        break;
      case 2: // Bottom
        x = Math.random() * canvas.width;
        y = canvas.height + 20;
        break;
      case 3: // Left
        x = -20;
        y = Math.random() * canvas.height;
        break;
    }

    enemies.push({
      x: x,
      y: y,
      size: 15,
      speed: 50 + Math.random() * 30 + gameState.time * 2,
      health: 1,
      damage: 10,
      color: "#ff4444",
    });
  }
}

// Check collisions
function checkCollisions() {
  // Projectile vs Enemy collisions
  projectiles.forEach((projectile, pIndex) => {
    enemies.forEach((enemy, eIndex) => {
      const distance = Math.sqrt(
        Math.pow(projectile.x - enemy.x, 2) +
          Math.pow(projectile.y - enemy.y, 2)
      );

      if (distance < projectile.size + enemy.size) {
        // Damage enemy
        enemy.health -= projectile.damage;

        // Create hit particles
        createParticles(enemy.x, enemy.y, "#ffaa00", 3);

        // Remove projectile
        projectiles.splice(pIndex, 1);

        // Remove enemy if dead
        if (enemy.health <= 0) {
          enemies.splice(eIndex, 1);
          gameState.score += 10;
          player.experience += 15;

          // Create death particles
          createParticles(enemy.x, enemy.y, "#ff0000", 8);
        }
      }
    });
  });
}

// Create particles
function createParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 200,
      vy: (Math.random() - 0.5) * 200,
      life: 0.5 + Math.random() * 0.5,
      maxLife: 1,
      alpha: 1,
      color: color,
      size: 2 + Math.random() * 3,
    });
  }
}

// Check if player should level up
function checkLevelUp() {
  if (player.experience >= player.experienceToNext) {
    player.experience -= player.experienceToNext;
    gameState.level++;
    player.experienceToNext = Math.floor(player.experienceToNext * 1.2);

    showUpgradeMenu();
  }
}

// Show upgrade menu
function showUpgradeMenu() {
  gameState.paused = true;
  const menu = document.getElementById("upgradeMenu");
  const options = document.getElementById("upgradeOptions");

  // Clear previous options
  options.innerHTML = "";

  // Select 3 random upgrades
  const availableUpgrades = [...upgrades];
  const selectedUpgrades = [];

  for (let i = 0; i < Math.min(3, availableUpgrades.length); i++) {
    const randomIndex = Math.floor(Math.random() * availableUpgrades.length);
    selectedUpgrades.push(availableUpgrades.splice(randomIndex, 1)[0]);
  }

  // Create upgrade options
  selectedUpgrades.forEach((upgrade) => {
    const option = document.createElement("div");
    option.className = "upgrade-option";
    option.innerHTML = `
            <h3>${upgrade.name}</h3>
            <p>${upgrade.description}</p>
        `;
    option.onclick = () => selectUpgrade(upgrade);
    options.appendChild(option);
  });

  menu.classList.remove("hidden");
}

// Select upgrade
function selectUpgrade(upgrade) {
  upgrade.effect();

  const menu = document.getElementById("upgradeMenu");
  menu.classList.add("hidden");
  gameState.paused = false;
}

// Update UI
function updateUI() {
  document.getElementById("score").textContent = gameState.score;
  document.getElementById("level").textContent = gameState.level;

  const minutes = Math.floor(gameState.time / 60);
  const seconds = gameState.time % 60;
  document.getElementById("time").textContent = `${minutes}:${seconds
    .toString()
    .padStart(2, "0")}`;

  const healthPercentage = (player.health / player.maxHealth) * 100;
  document.querySelector(".health-fill").style.width = `${healthPercentage}%`;
  document.querySelector(".health-text").textContent = `${Math.max(
    0,
    Math.floor(player.health)
  )}/${player.maxHealth}`;
}

// Game over
function gameOver() {
  gameState.running = false;

  const gameOverScreen = document.getElementById("gameOver");
  document.getElementById("finalScore").textContent = gameState.score;

  const minutes = Math.floor(gameState.time / 60);
  const seconds = gameState.time % 60;
  document.getElementById("finalTime").textContent = `${minutes}:${seconds
    .toString()
    .padStart(2, "0")}`;

  gameOverScreen.classList.remove("hidden");
}

// Restart game
function restartGame() {
  // Reset game state
  gameState.score = 0;
  gameState.level = 1;
  gameState.time = 0;
  gameState.paused = false;

  // Reset player
  player.health = 100;
  player.maxHealth = 100;
  player.speed = 200;
  player.experience = 0;
  player.experienceToNext = 100;

  // Reset weapons
  weapons.fireball.damage = 25;
  weapons.fireball.speed = 300;
  weapons.fireball.cooldown = 800;

  // Hide menus
  document.getElementById("gameOver").classList.add("hidden");
  document.getElementById("upgradeMenu").classList.add("hidden");

  // Start game
  init();
}

// Render game
function render() {
  // Clear canvas
  ctx.fillStyle = "#1a1a3a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw grid pattern
  ctx.strokeStyle = "#2a2a4a";
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Draw particles
  particles.forEach((particle) => {
    ctx.save();
    ctx.globalAlpha = particle.alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Draw enemies
  enemies.forEach((enemy) => {
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
    ctx.fill();

    // Draw enemy outline
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Draw projectiles
  projectiles.forEach((projectile) => {
    ctx.fillStyle = projectile.color;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2);
    ctx.fill();

    // Add glow effect
    ctx.shadowColor = projectile.color;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  // Draw player
  ctx.fillStyle = "#4CAF50";
  ctx.fillRect(
    player.x - player.width / 2,
    player.y - player.height / 2,
    player.width,
    player.height
  );

  // Draw player outline
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.strokeRect(
    player.x - player.width / 2,
    player.y - player.height / 2,
    player.width,
    player.height
  );

  // Draw experience bar
  const expBarWidth = 300;
  const expBarHeight = 8;
  const expBarX = (canvas.width - expBarWidth) / 2;
  const expBarY = canvas.height - 30;

  ctx.fillStyle = "#333333";
  ctx.fillRect(expBarX, expBarY, expBarWidth, expBarHeight);

  const expPercentage = player.experience / player.experienceToNext;
  ctx.fillStyle = "#ffdd44";
  ctx.fillRect(expBarX, expBarY, expBarWidth * expPercentage, expBarHeight);

  ctx.strokeStyle = "#666666";
  ctx.lineWidth = 1;
  ctx.strokeRect(expBarX, expBarY, expBarWidth, expBarHeight);
}

// Start the game when page loads
window.addEventListener("load", () => {
  init();
});
