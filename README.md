# Square Survivor

A fast-paced survival game where you play as a green square fighting off waves of enemies while collecting XP and upgrading your abilities.

## How to Play

### Controls
- **WASD** or **Arrow Keys** - Move your character
- **ESC** - Pause/Resume game

### Objective
Survive as long as possible while enemies spawn and attack you. Your weapons fire automatically at the nearest enemy.

## Game Features

### Weapons
- **Fireball** - Basic projectile weapon (starts equipped)
- **Missile Launcher** - Homing missiles that track enemies
- **Laser Beam** - Rapid-fire laser shots

### Enemies
- **Regular Enemies** - Various types with different stats
- **Mini Boss** - Spawns every 45 seconds (150 HP)
- **Boss** - Spawns every 2 minutes (300 HP)
- **Mega Boss** - Spawns every 5 minutes (800 HP, shoots projectiles)

### Upgrades
Level up by collecting XP orbs to choose from random upgrades:

- **Increased Damage** - 25% more weapon damage
- **Faster Shooting** - 20% reduced weapon cooldown
- **Health Boost** - +25 max health and heal 25 HP
- **Speed Boost** - 20% faster movement
- **Multi-Shot** - Fire 2 additional projectiles
- **Piercing Shots** - Projectiles pierce through enemies
- **Satellite Defense** - Orbiting satellites that damage enemies
- **Missile Launcher** - Unlock homing missiles
- **Laser Beam** - Unlock rapid-fire laser
- **XP Magnet** - Attract XP orbs from distance
- **Health Regeneration** - 1.5 HP/second healing
- **Life Steal** - Heal 5% of damage dealt

### Difficulty Scaling
- Enemy health increases by 2% per second
- Enemy damage scales up to 2x maximum
- Spawn rate increases over time

## Files

- `index.html` - Main HTML structure
- `script.js` - Game logic and mechanics
- `style.css` - Visual styling and animations

## Features

- Dynamic background with animated effects
- Particle systems for visual feedback
- Sound effects with anti-stacking system
- Responsive design
- Pause/resume functionality
- Score and time tracking
- Smooth animations and transitions

## Technical Details

- Built with HTML5 Canvas and JavaScript
- 60 FPS game loop with delta time calculations
- Procedural audio generation
- Tab focus handling to prevent timing issues
- Collision detection system
- Upgrade system with random selection

## Installation

1. Download all files to a folder
2. Open `index.html` in a web browser
3. Click "Start Game" to begin

No additional setup required - runs entirely in the browser!