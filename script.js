// Game canvas and context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game state
let gameState = {
  running: false,
  paused: false,
  inMenu: true,
  score: 0,
  level: 1,
  time: 0,
  gameStartTime: 0,
};

// Audio system
const audioSystem = {
  soundEnabled: true,
  
  init() {
    // Audio system initialized
  },
  
  playSound(soundName) {
    if (!this.soundEnabled) return;
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    switch(soundName) {
      case 'shoot':
        this.createShootSound(audioContext);
        break;
      case 'hit':
        this.createHitSound(audioContext);
        break;
      case 'destroy':
        this.createDestroySound(audioContext);
        break;
    }
  },
  
  createShootSound(ctx) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.1);
  },
  
  createHitSound(ctx) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(150, ctx.currentTime);
    oscillator.type = 'sawtooth';
    
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.2);
  },
  

  
  createDestroySound(ctx) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(300, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.4);
    oscillator.type = 'sawtooth';
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.4);
  }
};

// Player object
const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  width: 20,
  height: 20,
  speed: 250,
  health: 100,
  maxHealth: 100,
  experience: 0,
  experienceToNext: 100,
};

// Game objects arrays
let enemies = [];
let projectiles = [];
let pickups = [];
let xpOrbs = [];
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
  
  // Pause game with ESC
  if (e.key === 'Escape' && gameState.running && !gameState.inMenu) {
    if (gameState.paused) {
      resumeGame();
    } else {
      pauseGame();
    }
  }
});

document.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

// Initialize game
function init() {
  audioSystem.init();
  showMainMenu();
}

// Start game
function startGame() {
  gameState.running = true;
  gameState.inMenu = false;
  gameState.paused = false;
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
  xpOrbs = [];
  particles = [];

  // Hide main menu
  document.getElementById('mainMenu').classList.add('hidden');
  
  // Start game loop
  gameLoop();
}

// Show main menu
function showMainMenu() {
  gameState.inMenu = true;
  gameState.running = false;
  document.getElementById('mainMenu').classList.remove('hidden');
  document.getElementById('gameOver').classList.add('hidden');
  document.getElementById('pauseMenu').classList.add('hidden');
  updateAudioStatus();
}

// Pause game
function pauseGame() {
  if (!gameState.running || gameState.inMenu) return;
  gameState.paused = true;
  document.getElementById('pauseMenu').classList.remove('hidden');
  updateAudioStatus();
}

// Resume game
function resumeGame() {
  gameState.paused = false;
  document.getElementById('pauseMenu').classList.add('hidden');
}

// Quit to main menu
function quitToMenu() {
  gameState.running = false;
  gameState.paused = false;
  showMainMenu();
}

// Toggle music
function toggleMusic() {
  audioSystem.musicEnabled = !audioSystem.musicEnabled;
  updateAudioStatus();
}

// Toggle sound
function toggleSound() {
  audioSystem.soundEnabled = !audioSystem.soundEnabled;
  updateAudioStatus();
}

// Update audio status display
function updateAudioStatus() {
  const soundStatus = audioSystem.soundEnabled ? 'ON' : 'OFF';
  
  document.getElementById('soundStatus').textContent = soundStatus;
  document.getElementById('soundStatusMain').textContent = soundStatus;
}

// Main game loop
function gameLoop() {
  if (!gameState.running && !gameState.inMenu) return;

  const deltaTime = 1 / 60; // 60 FPS

  if (!gameState.inMenu) {
    update(deltaTime);
  }
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

  // Update XP orbs
  updateXPOrbs(deltaTime);

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
        trail: [],
      });

      // Play shoot sound
      audioSystem.playSound('shoot');
      
      // Create muzzle flash particles
      createMuzzleFlash(player.x, player.y);

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

      // Create screen shake
      createScreenShake();

      // Create damage particles
      createParticles(player.x, player.y, "#ff4444", 8);
      createBloodSplatter(player.x, player.y);

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
    // Add to trail
    projectile.trail.push({x: projectile.x, y: projectile.y, life: 0.2});
    if (projectile.trail.length > 5) projectile.trail.shift();
    
    // Update trail
    projectile.trail.forEach(point => point.life -= deltaTime);
    projectile.trail = projectile.trail.filter(point => point.life > 0);
    
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
    particle.rotation += particle.rotationSpeed * deltaTime;
    
    // Add gravity to some particles
    if (particle.color === '#aa0000' || particle.color === '#ff0000') {
      particle.vy += 200 * deltaTime;
    }

    if (particle.life <= 0) {
      particles.splice(index, 1);
    }
  });
}

// Spawn enemies
function spawnEnemies(deltaTime) {
  // Increase spawn rate over time
  const spawnRate = Math.min(0.5 + gameState.time * 0.015, 2.5);

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

    // Enemy types with different stats
    const enemyTypes = [
      { size: 12, speed: 80, health: 15, damage: 8, color: "#ff8844", xp: 20 }, // Fast
      { size: 15, speed: 60, health: 20, damage: 12, color: "#ff4444", xp: 25 }, // Normal
      { size: 18, speed: 40, health: 30, damage: 15, color: "#8844ff", xp: 35 }, // Tank
      { size: 14, speed: 70, health: 18, damage: 10, color: "#44ff88", xp: 30 }  // Shooter
    ];
    
    const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    
    enemies.push({
      x: x,
      y: y,
      size: type.size,
      speed: type.speed + Math.random() * 20 + gameState.time * 1.5,
      health: type.health,
      maxHealth: type.health,
      damage: type.damage,
      color: type.color,
      xp: type.xp,
      isBoss: false
    });
  }
  
  // Spawn mini-boss every 45 seconds
  if (gameState.time > 0 && gameState.time % 45 === 0 && Math.random() < 0.6) {
    spawnMiniBoss();
    console.log(`Mini-boss spawned at ${gameState.time}s!`);
  }
  
  // Spawn boss every 120 seconds
  if (gameState.time > 0 && gameState.time % 120 === 0 && Math.random() < 0.8) {
    spawnBoss();
    console.log(`Boss spawned at ${gameState.time}s!`);
  }
}

// Spawn mini-boss
function spawnMiniBoss() {
  const side = Math.floor(Math.random() * 4);
  let x, y;

  switch (side) {
    case 0: x = Math.random() * canvas.width; y = -30; break;
    case 1: x = canvas.width + 30; y = Math.random() * canvas.height; break;
    case 2: x = Math.random() * canvas.width; y = canvas.height + 30; break;
    case 3: x = -30; y = Math.random() * canvas.height; break;
  }

  enemies.push({
    x: x, y: y,
    size: 25,
    speed: 35,
    health: 80,
    maxHealth: 80,
    damage: 20,
    color: "#ff0088",
    xp: 120,
    isBoss: true,
    isMiniBoss: true
  });
}

// Spawn boss
function spawnBoss() {
  const side = Math.floor(Math.random() * 4);
  let x, y;

  switch (side) {
    case 0: x = Math.random() * canvas.width; y = -40; break;
    case 1: x = canvas.width + 40; y = Math.random() * canvas.height; break;
    case 2: x = Math.random() * canvas.width; y = canvas.height + 40; break;
    case 3: x = -40; y = Math.random() * canvas.height; break;
  }

  enemies.push({
    x: x, y: y,
    size: 35,
    speed: 25,
    health: 150,
    maxHealth: 150,
    damage: 30,
    color: "#ff0000",
    xp: 300,
    isBoss: true,
    isMiniBoss: false
  });
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

        // Play hit sound
        audioSystem.playSound('hit');
        
        // Create hit particles
        createParticles(enemy.x, enemy.y, "#ffaa00", 5);
        createImpactEffect(enemy.x, enemy.y);

        // Remove projectile
        projectiles.splice(pIndex, 1);

        // Remove enemy if dead
        if (enemy.health <= 0) {
          enemies.splice(eIndex, 1);
          gameState.score += enemy.isBoss ? (enemy.isMiniBoss ? 50 : 100) : 10;

          // Play destroy sound
          audioSystem.playSound('destroy');
          
          // Drop XP orb
          createXPOrb(enemy.x, enemy.y, enemy.xp || 15);
          
          // Create death particles and explosion
          const particleCount = enemy.isBoss ? (enemy.isMiniBoss ? 20 : 30) : 12;
          createParticles(enemy.x, enemy.y, "#ff0000", particleCount);
          createExplosion(enemy.x, enemy.y);
        }
      }
    });
  });
}

// Create particles
function createParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y + (Math.random() - 0.5) * 10,
      vx: (Math.random() - 0.5) * 300,
      vy: (Math.random() - 0.5) * 300,
      life: 0.5 + Math.random() * 1,
      maxLife: 1.5,
      alpha: 1,
      color: color,
      size: 2 + Math.random() * 4,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 10,
    });
  }
}

// Create muzzle flash
function createMuzzleFlash(x, y) {
  for (let i = 0; i < 3; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 50,
      vy: (Math.random() - 0.5) * 50,
      life: 0.1,
      maxLife: 0.1,
      alpha: 1,
      color: '#ffff00',
      size: 8 + Math.random() * 4,
      rotation: 0,
      rotationSpeed: 0,
    });
  }
}

// Create explosion effect
function createExplosion(x, y) {
  for (let i = 0; i < 15; i++) {
    const angle = (Math.PI * 2 * i) / 15;
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * (100 + Math.random() * 100),
      vy: Math.sin(angle) * (100 + Math.random() * 100),
      life: 0.8,
      maxLife: 0.8,
      alpha: 1,
      color: i % 2 === 0 ? '#ff4400' : '#ffaa00',
      size: 3 + Math.random() * 3,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 5,
    });
  }
}

// Create impact effect
function createImpactEffect(x, y) {
  for (let i = 0; i < 8; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 150,
      vy: (Math.random() - 0.5) * 150,
      life: 0.3,
      maxLife: 0.3,
      alpha: 1,
      color: '#ffffff',
      size: 1 + Math.random() * 2,
      rotation: 0,
      rotationSpeed: 0,
    });
  }
}

// Create blood splatter
function createBloodSplatter(x, y) {
  for (let i = 0; i < 6; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 200,
      vy: (Math.random() - 0.5) * 200,
      life: 1,
      maxLife: 1,
      alpha: 1,
      color: '#aa0000',
      size: 3 + Math.random() * 2,
      rotation: 0,
      rotationSpeed: 0,
    });
  }
}

// Create level up effect
function createLevelUpEffect() {
  for (let i = 0; i < 20; i++) {
    const angle = (Math.PI * 2 * i) / 20;
    particles.push({
      x: player.x,
      y: player.y,
      vx: Math.cos(angle) * 150,
      vy: Math.sin(angle) * 150,
      life: 1,
      maxLife: 1,
      alpha: 1,
      color: '#ffdd44',
      size: 4,
      rotation: 0,
      rotationSpeed: 0,
    });
  }
}

// Create screen shake effect
function createScreenShake() {
  document.body.classList.add('screen-shake');
  setTimeout(() => {
    document.body.classList.remove('screen-shake');
  }, 500);
}

// Check if player should level up
function checkLevelUp() {
  if (player.experience >= player.experienceToNext) {
    player.experience -= player.experienceToNext;
    gameState.level++;
    player.experienceToNext = Math.floor(player.experienceToNext * 1.2);

    // Level up (no sound)
    
    // Create level up effect
    createLevelUpEffect();

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
  
  // Update XP bar
  const xpPercentage = (player.experience / player.experienceToNext) * 100;
  document.querySelector(".xp-fill").style.width = `${xpPercentage}%`;
  document.querySelector(".xp-text").textContent = `${player.experience}/${player.experienceToNext}`;
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

// Background stars array
let backgroundStars = [];

// Initialize background stars
function initBackgroundStars() {
  for (let i = 0; i < 100; i++) {
    backgroundStars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.5 + 0.1,
      brightness: Math.random()
    });
  }
}

// Update background stars
function updateBackgroundStars() {
  backgroundStars.forEach(star => {
    star.brightness += (Math.random() - 0.5) * 0.02;
    star.brightness = Math.max(0.1, Math.min(1, star.brightness));
  });
}

// Render game
function render() {
  // Initialize stars if not done
  if (backgroundStars.length === 0) initBackgroundStars();
  updateBackgroundStars();
  // Clear canvas with dynamic background
  const time = Date.now() * 0.001;
  
  // Multi-layer gradient background
  const gradient1 = ctx.createRadialGradient(
    canvas.width * 0.3, canvas.height * 0.3, 0,
    canvas.width * 0.3, canvas.height * 0.3, 400
  );
  const gradient2 = ctx.createRadialGradient(
    canvas.width * 0.7, canvas.height * 0.7, 0,
    canvas.width * 0.7, canvas.height * 0.7, 400
  );
  
  // Pulsing colors
  const r1 = Math.sin(time * 0.8) * 0.15 + 0.15;
  const g1 = Math.sin(time * 0.6) * 0.1 + 0.1;
  const b1 = Math.sin(time * 1.2) * 0.2 + 0.25;
  
  const r2 = Math.sin(time * 0.7 + Math.PI) * 0.1 + 0.1;
  const g2 = Math.sin(time * 0.9 + Math.PI) * 0.15 + 0.15;
  const b2 = Math.sin(time * 0.5 + Math.PI) * 0.1 + 0.2;
  
  gradient1.addColorStop(0, `rgba(${Math.floor(r1 * 255)}, ${Math.floor(g1 * 255)}, ${Math.floor(b1 * 255)}, 0.8)`);
  gradient1.addColorStop(1, 'rgba(10, 10, 26, 0)');
  
  gradient2.addColorStop(0, `rgba(${Math.floor(r2 * 255)}, ${Math.floor(g2 * 255)}, ${Math.floor(b2 * 255)}, 0.6)`);
  gradient2.addColorStop(1, 'rgba(10, 10, 26, 0)');
  
  // Base dark background
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Apply gradients
  ctx.fillStyle = gradient1;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = gradient2;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw dynamic background elements
  
  // Floating orbs
  for (let i = 0; i < 8; i++) {
    const orbTime = time + i * 0.5;
    const x = canvas.width * 0.5 + Math.sin(orbTime * 0.3 + i) * 300;
    const y = canvas.height * 0.5 + Math.cos(orbTime * 0.4 + i) * 200;
    const size = 20 + Math.sin(orbTime * 2) * 10;
    
    ctx.save();
    ctx.globalAlpha = 0.1 + Math.sin(orbTime * 1.5) * 0.05;
    ctx.fillStyle = `hsl(${(i * 45 + time * 20) % 360}, 70%, 50%)`;
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  
  // Energy waves
  for (let i = 0; i < 3; i++) {
    const waveTime = time * 0.5 + i * 2;
    const radius = (waveTime % 4) * 200;
    
    ctx.save();
    ctx.globalAlpha = 0.15 * (1 - (waveTime % 4) / 4);
    ctx.strokeStyle = `hsl(${180 + i * 60}, 60%, 40%)`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  
  // Animated grid with hexagonal pattern
  ctx.strokeStyle = "#2a2a4a";
  ctx.lineWidth = 1;
  const gridOffset = (time * 20) % 60;
  
  for (let x = -gridOffset; x < canvas.width + 60; x += 60) {
    for (let y = -gridOffset; y < canvas.height + 60; y += 60) {
      ctx.save();
      ctx.globalAlpha = 0.2 + Math.sin((x + y + time * 50) * 0.01) * 0.1;
      ctx.translate(x, y);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const px = Math.cos(angle) * 15;
        const py = Math.sin(angle) * 15;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
  }

  // Draw twinkling stars
  backgroundStars.forEach(star => {
    ctx.save();
    ctx.globalAlpha = star.brightness * 0.8;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = star.size * 2;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
  
  // Draw particles
  particles.forEach((particle) => {
    ctx.save();
    ctx.globalAlpha = particle.alpha;
    ctx.fillStyle = particle.color;
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rotation);
    
    // Add glow effect for certain particles
    if (particle.color === '#ffdd44' || particle.color === '#ffff00') {
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 10;
    }
    
    ctx.beginPath();
    ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Draw enemies with enhanced visuals
  enemies.forEach((enemy) => {
    ctx.save();
    
    // Boss special effects
    if (enemy.isBoss) {
      ctx.shadowColor = enemy.color;
      ctx.shadowBlur = enemy.isMiniBoss ? 15 : 25;
    } else {
      ctx.shadowColor = enemy.color;
      ctx.shadowBlur = 8;
    }
    
    // Enemy body
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Enemy core
    ctx.shadowBlur = 0;
    if (enemy.isBoss) {
      ctx.fillStyle = enemy.isMiniBoss ? "#660044" : "#880000";
    } else {
      ctx.fillStyle = "#aa0000";
    }
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.size * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Enemy outline
    ctx.strokeStyle = enemy.isBoss ? "#ffff00" : "#ffffff";
    ctx.lineWidth = enemy.isBoss ? 3 : 2;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
    ctx.stroke();
    
    // Health bar for bosses and damaged enemies
    if (enemy.isBoss || enemy.health < enemy.maxHealth) {
      const barWidth = enemy.size * 2.5;
      const barHeight = 5;
      const barX = enemy.x - barWidth / 2;
      const barY = enemy.y - enemy.size - 12;
      
      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      
      ctx.fillStyle = enemy.isBoss ? '#ff0000' : '#ff4444';
      ctx.fillRect(barX, barY, barWidth * (enemy.health / enemy.maxHealth), barHeight);
    }
    
    ctx.restore();
  });

  // Draw projectiles with trails
  projectiles.forEach((projectile) => {
    // Draw trail
    projectile.trail.forEach((point, index) => {
      ctx.save();
      ctx.globalAlpha = point.life / 0.2 * 0.5;
      ctx.fillStyle = projectile.color;
      ctx.beginPath();
      ctx.arc(point.x, point.y, projectile.size * (point.life / 0.2), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    
    // Draw projectile
    ctx.save();
    ctx.fillStyle = projectile.color;
    ctx.shadowColor = projectile.color;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Draw player with enhanced visuals
  ctx.save();
  
  // Player glow effect
  ctx.shadowColor = "#4CAF50";
  ctx.shadowBlur = 15;
  
  // Player body
  ctx.fillStyle = "#4CAF50";
  ctx.fillRect(
    player.x - player.width / 2,
    player.y - player.height / 2,
    player.width,
    player.height
  );
  
  // Player core (brighter center)
  ctx.fillStyle = "#66FF66";
  ctx.fillRect(
    player.x - player.width / 4,
    player.y - player.height / 4,
    player.width / 2,
    player.height / 2
  );

  // Player outline
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.strokeRect(
    player.x - player.width / 2,
    player.y - player.height / 2,
    player.width,
    player.height
  );
  
  ctx.restore();

  // Draw XP orbs
  xpOrbs.forEach((orb) => {
    ctx.save();
    ctx.fillStyle = '#00ff00';
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw inner glow
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.size * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

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

// Create XP orb
function createXPOrb(x, y, xpValue) {
  xpOrbs.push({
    x: x + (Math.random() - 0.5) * 20,
    y: y + (Math.random() - 0.5) * 20,
    xp: xpValue,
    size: 8,
    color: '#00ff00',
    life: 30
  });
}

// Update XP orbs
function updateXPOrbs(deltaTime) {
  xpOrbs.forEach((orb, index) => {
    orb.life -= deltaTime;
    
    // Check if player collected orb
    const distance = Math.sqrt(
      Math.pow(orb.x - player.x, 2) + Math.pow(orb.y - player.y, 2)
    );
    
    if (distance < orb.size + player.width / 2) {
      player.experience += orb.xp;
      xpOrbs.splice(index, 1);
      
      // Create collection effect
      createParticles(orb.x, orb.y, '#00ff00', 3);
    }
    
    // Remove expired orbs
    if (orb.life <= 0) {
      xpOrbs.splice(index, 1);
    }
  });
}

// Prevent context menu on right click
document.addEventListener('contextmenu', e => e.preventDefault());
