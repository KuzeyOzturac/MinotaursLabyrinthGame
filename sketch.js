// sketch.js - p5.js port of your Minotaur's Labyrinth main.py

// --- Game constants ---
const TILE_SIZE = 24;
const MAP_LAYOUT = [
  "############################",
  "#............##............#",
  "#.####.#####.##.#####.####.#",
  "#o####.#####.##.#####.####o#",
  "#.####.#####.##.#####.####.#",
  "#..........................#",
  "#.####.##.########.##.####.#",
  "#.####.##.########.##.####.#",
  "#......##....##....##......#",
  "######.#####.##.#####.######",
  "     #.#####.##.#####.#     ",
  "     #.##..........##.#     ",
  "     #.##.###--###.##.#     ",
  "######.##.#      #.##.######",
  "G P   .   #   M  #   .     G",
  "######.##.#      #.##.######",
  "     #.##.########.##.#     ",
  "     #.##..........##.#     ",
  "     #.##.########.##.#     ",
  "######.##.########.##.######",
  "#............##............#",
  "#.####.#####.##.#####.####.#",
  "#.####.#####.##.#####.####.#",
  "#o..##................##..o#",
  "###.##.##.########.##.##.###",
  "###.##.##.########.##.##.###",
  "#......##....##....##......#",
  "#.##########.##.##########.#",
  "#.##########.##.##########.#",
  "#..........................#",
  "############################",
];

const ROWS = MAP_LAYOUT.length;
const COLS = MAP_LAYOUT[0].length;

// Width reserved for UI panel on the left
const UI_PANEL_WIDTH = 200;

// Total window size: UI panel + maze
const WIDTH = COLS * TILE_SIZE + UI_PANEL_WIDTH;
const HEIGHT = ROWS * TILE_SIZE;
const FPS = 60;

// Colors (as RGB)
// darker shade of orangish-brown (not black)
const BLACK = [60, 35, 15];
// lighter orangish-brown walls (unused as color now, but kept)
const BLUE = [190, 120, 60];
const YELLOW = [255, 255, 0];
const WHITE = [255, 255, 255];
const RED = [200, 40, 40];
const HUMAN_COLOR = [240, 220, 160]; // not used now
const GREEN = [0, 255, 0]; // bright green pellets

// Sprite sizes
const PLAYER_SIZE = TILE_SIZE * 2;   // Theseus (player) bigger than one tile
const HUMAN_SIZE = TILE_SIZE * 2;    // tributes same size as player
const MINOTAUR_SIZE = TILE_SIZE * 3; // Minotaur is a big boy

// --- Assets ---
let wallImg;
let gateLockedImg;
let gateOpenImg;
let floorImg;
let theseusImg;
let tributeImg;
let minotaurNormalImg;
let minotaurScaredImg;
let minotaurDeadImg;
let gameoverImg;
let victoryImg;

// Sounds
let minotaurEatSound = null;
let minotaurScreamSound = null;
let pelletSounds = [];
let gameStartSound = null;
let gameOverSound = null;
let victoryFanfareSound = null;
let minotaurGrowlSound = null;
let minotaurKillSwordSound = null;
let minotaurKillScreamSound = null;

// --- Game state globals ---
let walls = [];
let pellets = [];
let gates = [];
let player = null;
let minotaur = null;
let humans = [];

let score = 0;
let dead = false;
let won = false;
let minotaurAlive = true;
let minotaurFlee = false;
let gatesOpen = false;
let minotaurFleeAnnounced = false;

let fontSize = 20;

// p5.js preload: load assets
function preload() {
  // Images
  wallImg = loadImage("sprites/wall.png");
  gateLockedImg = loadImage("sprites/gate_locked.png");
  gateOpenImg = loadImage("sprites/gate_open.png");
  floorImg = loadImage("sprites/floor.png");
  theseusImg = loadImage("sprites/theseus.png");
  tributeImg = loadImage("sprites/tribute.png");
  minotaurNormalImg = loadImage("sprites/minotaur_normal.png");
  minotaurScaredImg = loadImage("sprites/minotaur_scared.png");
  minotaurDeadImg = loadImage("sprites/minotaur_dead.png");
  gameoverImg = loadImage("sprites/gameover.png");
  victoryImg = loadImage("sprites/victory.png");

  // Main sounds
  soundFormats("mp3", "wav", "ogg");
  try {
    minotaurEatSound = loadSound("sounds/game-eat-sound-83240.mp3");
  } catch (e) {}
  try {
    minotaurScreamSound = loadSound("sounds/male-death-scream-horror-352706.mp3");
  } catch (e) {}
  try {
    gameStartSound = loadSound("sounds/game-start-6104.mp3");
  } catch (e) {}
  try {
    gameOverSound = loadSound("sounds/game-over-arcade-6435.mp3");
  } catch (e) {}
  try {
    victoryFanfareSound = loadSound("sounds/brass-fanfare-with-timpani-and-winchimes-reverberated-146260.mp3");
  } catch (e) {}
  try {
    minotaurGrowlSound = loadSound("sounds/monster-growl-140377.mp3");
  } catch (e) {}
  try {
    minotaurKillSwordSound = loadSound("sounds/violent-sword-slice-2-393841.mp3");
  } catch (e) {}
  try {
    minotaurKillScreamSound = loadSound("sounds/terrifying-scream-353210.mp3");
  } catch (e) {}

  // Pellet sounds (if you want to enumerate manually, do it here)
  const pelletFiles = [
    "sounds/pellet/90s-game-ui-3-185096.mp3",
    "sounds/pellet/90s-game-ui-4-185097.mp3",
    "sounds/pellet/90s-game-ui-7-185100.mp3",
    "sounds/pellet/90s-game-ui-2-185095.mp3",
    "sounds/pellet/90s-game-ui-6-185099.mp3",
  ];
  for (let path of pelletFiles) {
    try {
      let s = loadSound(path);
      pelletSounds.push(s);
    } catch (e) {}
  }
}

// p5.js setup: initialize everything
function setup() {
  createCanvas(WIDTH, HEIGHT);
  frameRate(FPS);
  textFont("monospace");
  textSize(fontSize);
  rectMode(CORNER);

  // Scale images appropriately
  wallImg.resize(TILE_SIZE, TILE_SIZE);
  gateLockedImg.resize(TILE_SIZE, TILE_SIZE);
  gateOpenImg.resize(TILE_SIZE, TILE_SIZE);
  floorImg.resize(TILE_SIZE, TILE_SIZE);
  theseusImg.resize(PLAYER_SIZE, PLAYER_SIZE);
  tributeImg.resize(HUMAN_SIZE, HUMAN_SIZE);
  minotaurNormalImg.resize(MINOTAUR_SIZE, MINOTAUR_SIZE);
  minotaurScaredImg.resize(MINOTAUR_SIZE, MINOTAUR_SIZE);
  minotaurDeadImg.resize(MINOTAUR_SIZE, MINOTAUR_SIZE);

  // Scale gameover / victory to fit
  scaleToFit(gameoverImg, WIDTH, HEIGHT, (scaled) => (gameoverImg = scaled));
  scaleToFit(victoryImg, WIDTH, HEIGHT, (scaled) => (victoryImg = scaled));

  startGame();
}

// Helper to scale images to fit within maxW x maxH
function scaleToFit(img, maxW, maxH, applyFn) {
  if (!img) return;
  let w = img.width;
  let h = img.height;
  let scale = min(maxW / w, maxH / h, 1.0);
  let newW = int(w * scale);
  let newH = int(h * scale);
  let gfx = createGraphics(newW, newH);
  gfx.image(img, 0, 0, newW, newH);
  applyFn(gfx);
}

// Start/restart game
function startGame() {
  if (gameStartSound && !gameStartSound.isPlaying()) {
    gameStartSound.play();
  }

  const result = buildLevel();
  walls = result.walls;
  pellets = result.pellets;
  gates = result.gates;
  player = new Player(result.playerStart.tx, result.playerStart.ty);
  minotaur = new Minotaur(result.minotaurStart.tx, result.minotaurStart.ty);

  // Nine additional human tributes wandering the labyrinth
  const humanStartTiles = [
    [1, 1],
    [26, 1],
    [1, 20],
    [26, 20],
    [1, 23],
    [26, 23],
    [13, 5],
    [14, 5],
    [13, 26],
  ];
  humans = humanStartTiles.map(([tx, ty]) => new Human(tx, ty));

  score = 0;
  dead = false;
  won = false;
  minotaurAlive = true;
  minotaurFlee = false;
  gatesOpen = false;
  minotaurFleeAnnounced = false;
}

// p5.js draw: main loop
function draw() {
  background(BLACK[0], BLACK[1], BLACK[2]);

  // Keep everyone informed about gate status
  player.gatesOpen = gatesOpen;
  for (let h of humans) {
    h.gatesOpen = gatesOpen;
  }
  minotaur.gatesOpen = gatesOpen;

  if (!dead && !won) {
    // Handle input each frame
    player.handleInput();
    player.update();

    for (let h of humans) {
      h.update();
    }

    if (minotaurAlive) {
      minotaur.flee = minotaurFlee;
      if (minotaurFlee) {
        minotaur.state = "scared";
      } else {
        minotaur.state = "normal";
      }
      minotaur.update(player, humans);
    }

    // Eat pellets
    let eaten = [];
    for (let i = 0; i < pellets.length; i++) {
      let p = pellets[i];
      if (rectOverlap(player.rect, p)) {
        eaten.push(i);
        score += 10;
        if (pelletSounds.length > 0) {
          let s = random(pelletSounds);
          if (s && !s.isPlaying()) s.play();
        }
      }
    }
    // Remove eaten pellets from end to start
    eaten.sort((a, b) => b - a);
    for (let idx of eaten) {
      pellets.splice(idx, 1);
    }

    // Once all pellets are gone, minotaur starts fleeing
    if (pellets.length === 0 && minotaurAlive && !minotaurFlee) {
      minotaurFlee = true;
      if (!minotaurFleeAnnounced && minotaurGrowlSound && !minotaurGrowlSound.isPlaying()) {
        minotaurGrowlSound.play();
      }
      minotaurFleeAnnounced = true;
    }

    // Check player / minotaur interaction
    if (minotaurAlive && rectOverlap(player.rect, minotaur.rect)) {
      if (minotaurFlee) {
        // Player kills the minotaur -> gates open
        minotaurAlive = false;
        gatesOpen = true;
        minotaur.state = "dead";
        if (minotaurKillSwordSound && !minotaurKillSwordSound.isPlaying()) {
          minotaurKillSwordSound.play();
        }
        if (minotaurKillScreamSound && !minotaurKillScreamSound.isPlaying()) {
          minotaurKillScreamSound.play();
        }
      } else {
        // Normal phase: minotaur kills you
        dead = true;
        if (gameOverSound && !gameOverSound.isPlaying()) {
          gameOverSound.play();
        }
      }
    }

    // Minotaur hunts humans only while alive and not fleeing
    if (minotaurAlive && !minotaurFlee) {
      let survivors = [];
      let beforeCount = humans.length;
      for (let h of humans) {
        if (!rectOverlap(minotaur.rect, h.rect)) {
          survivors.push(h);
        }
      }
      let killed = beforeCount - survivors.length;
      if (killed > 0) {
        if (minotaurEatSound && !minotaurEatSound.isPlaying()) {
          minotaurEatSound.play();
        }
        if (minotaurScreamSound && !minotaurScreamSound.isPlaying()) {
          minotaurScreamSound.play();
        }
      }
      humans = survivors;
    }

    // Escape through an open gate = win
    if (gatesOpen) {
      for (let g of gates) {
        if (rectOverlap(player.rect, g)) {
          won = true;
          if (victoryFanfareSound && !victoryFanfareSound.isPlaying()) {
            victoryFanfareSound.play();
          }
          break;
        }
      }
    }
  }

  // Draw everything
  let survivorsCount = humans.length + (dead ? 0 : 1);
  let pelletsLeft = pellets.length;
  drawLevel(walls, pellets, gates, survivorsCount, pelletsLeft, gatesOpen);

  if (!dead) {
    player.draw();
  }
  for (let h of humans) {
    h.draw();
  }
  minotaur.draw();

  if (dead) {
    drawGameOverScreen();
  } else if (won) {
    drawWinScreen();
  }
}

// --- Keyboard handling (for R and Q) ---
function keyPressed() {
  if (key === 'r' || key === 'R') {
    startGame();
  } else if (key === 'q' || key === 'Q') {
    // Can't close tab from JS; you can stop the loop or show a message
    // Here we just stop updating the game logic
    noLoop();
  }
}

// --- Rect overlap helper ---
function rectOverlap(a, b) {
  return !(
    a.x + a.w <= b.x ||
    a.x >= b.x + b.w ||
    a.y + a.h <= b.y ||
    a.y >= b.y + b.h
  );
}

// --- Player class ---
class Player {
  constructor(tileX, tileY) {
    this.tx = int(tileX);
    this.ty = int(tileY);

    this.x = this.tx * TILE_SIZE + TILE_SIZE / 2;
    this.y = this.ty * TILE_SIZE + TILE_SIZE / 2;

    this.dir = createVector(0, 0);
    this.nextDir = createVector(0, 0);
    this.speed = 4;

    this.rect = { x: 0, y: 0, w: TILE_SIZE, h: TILE_SIZE };
    this.rect.x = this.x - TILE_SIZE / 2;
    this.rect.y = this.y - TILE_SIZE / 2;

    this.gatesOpen = false;
  }

  handleInput() {
    if (keyIsDown(LEFT_ARROW)) {
      this.nextDir = createVector(-1, 0);
    } else if (keyIsDown(RIGHT_ARROW)) {
      this.nextDir = createVector(1, 0);
    } else if (keyIsDown(UP_ARROW)) {
      this.nextDir = createVector(0, -1);
    } else if (keyIsDown(DOWN_ARROW)) {
      this.nextDir = createVector(0, 1);
    }
  }

  atTileCenter() {
    return (
      ((this.x - TILE_SIZE / 2) % TILE_SIZE === 0) &&
      ((this.y - TILE_SIZE / 2) % TILE_SIZE === 0)
    );
  }

  canMove(direction) {
    if (direction.x === 0 && direction.y === 0) return false;

    let nx = int(this.tx + direction.x);
    let ny = int(this.ty + direction.y);

    if (!(0 <= nx && nx < COLS && 0 <= ny && ny < ROWS)) return false;

    let tile = MAP_LAYOUT[ny][nx];

    if (tile === "#") return false;
    if (tile === "G" && !this.gatesOpen) return false;

    return true;
  }

  update() {
    if (this.atTileCenter()) {
      this.tx = int((this.x - TILE_SIZE / 2) / TILE_SIZE);
      this.ty = int((this.y - TILE_SIZE / 2) / TILE_SIZE);

      if (this.canMove(this.nextDir)) {
        this.dir = this.nextDir.copy();
      }

      if (!this.canMove(this.dir)) {
        this.dir = createVector(0, 0);
      }
    }

    this.x += this.dir.x * this.speed;
    this.y += this.dir.y * this.speed;

    this.rect.x = int(this.x - TILE_SIZE / 2);
    this.rect.y = int(this.y - TILE_SIZE / 2);
  }

  draw() {
    let drawX = int(this.x) + UI_PANEL_WIDTH - PLAYER_SIZE / 2;
    let drawY = int(this.y) - PLAYER_SIZE / 2;
    image(theseusImg, drawX, drawY, PLAYER_SIZE, PLAYER_SIZE);
  }
}

// --- Human class ---
class Human {
  constructor(tileX, tileY) {
    this.tx = int(tileX);
    this.ty = int(tileY);

    this.x = this.tx * TILE_SIZE + TILE_SIZE / 2;
    this.y = this.ty * TILE_SIZE + TILE_SIZE / 2;

    this.dir = createVector(0, 0);
    this.speed = 1.5;

    this.rect = { x: 0, y: 0, w: TILE_SIZE, h: TILE_SIZE };
    this.rect.x = this.x - TILE_SIZE / 2;
    this.rect.y = this.y - TILE_SIZE / 2;

    this.color = this.randomColor();
    this.gatesOpen = false;
  }

  randomColor() {
    const forbidden = [
      YELLOW.toString(),
      RED.toString(),
    ];
    while (true) {
      let r = int(random(50, 256));
      let g = int(random(50, 256));
      let b = int(random(50, 256));
      let key = [r, g, b].toString();
      if (!forbidden.includes(key)) {
        return [r, g, b];
      }
    }
  }

  atTileCenter() {
    return (
      ((this.x - TILE_SIZE / 2) % TILE_SIZE === 0) &&
      ((this.y - TILE_SIZE / 2) % TILE_SIZE === 0)
    );
  }

  canMove(direction) {
    if (direction.x === 0 && direction.y === 0) return false;

    let nx = int(this.tx + direction.x);
    let ny = int(this.ty + direction.y);

    if (!(0 <= nx && nx < COLS && 0 <= ny && ny < ROWS)) return false;

    let tile = MAP_LAYOUT[ny][nx];

    if (tile === "#") return false;
    if (tile === "G" && !this.gatesOpen) return false;

    return true;
  }

  update() {
    if (this.atTileCenter()) {
      this.tx = int((this.x - TILE_SIZE / 2) / TILE_SIZE);
      this.ty = int((this.y - TILE_SIZE / 2) / TILE_SIZE);

      let dirs = [
        createVector(1, 0),
        createVector(-1, 0),
        createVector(0, 1),
        createVector(0, -1),
      ];
      let possible = dirs.filter((d) => this.canMove(d));

      if (possible.length > 0) {
        if (this.dir.x !== 0 || this.dir.y !== 0) {
          let opposite = createVector(-this.dir.x, -this.dir.y);
          let nonReverse = possible.filter(
            (d) => !(d.x === opposite.x && d.y === opposite.y)
          );
          if (nonReverse.length > 0) {
            possible = nonReverse;
          }
        }
        this.dir = random(possible).copy();
      } else {
        this.dir = createVector(0, 0);
      }
    }

    this.x += this.dir.x * this.speed;
    this.y += this.dir.y * this.speed;
    this.rect.x = int(this.x - TILE_SIZE / 2);
    this.rect.y = int(this.y - TILE_SIZE / 2);
  }

  draw() {
    let drawX = int(this.x) + UI_PANEL_WIDTH - HUMAN_SIZE / 2;
    let drawY = int(this.y) - HUMAN_SIZE / 2;
    image(tributeImg, drawX, drawY, HUMAN_SIZE, HUMAN_SIZE);
  }
}

// --- Minotaur class ---
class Minotaur {
  constructor(tileX, tileY) {
    this.tx = int(tileX);
    this.ty = int(tileY);

    this.x = this.tx * TILE_SIZE + TILE_SIZE / 2;
    this.y = this.ty * TILE_SIZE + TILE_SIZE / 2;

    this.dir = createVector(0, 0);
    this.speed = 3;

    this.imageNormal = minotaurNormalImg;
    this.imageScared = minotaurScaredImg;
    this.imageDead = minotaurDeadImg;

    this.state = "normal";

    this.rect = {
      x: this.x - MINOTAUR_SIZE / 2,
      y: this.y - MINOTAUR_SIZE / 2,
      w: MINOTAUR_SIZE,
      h: MINOTAUR_SIZE,
    };

    this.flee = false;
    this.gatesOpen = false;
  }

  atTileCenter() {
    return (
      ((this.x - TILE_SIZE / 2) % TILE_SIZE === 0) &&
      ((this.y - TILE_SIZE / 2) % TILE_SIZE === 0)
    );
  }

  canMoveTo(nx, ny) {
    if (!(0 <= nx && nx < COLS && 0 <= ny && ny < ROWS)) return false;
    let tile = MAP_LAYOUT[ny][nx];
    if (tile === "#") return false;
    if (tile === "G" && !this.gatesOpen) return false;
    return true;
  }

  update(player, humansArr) {
    if (this.atTileCenter()) {
      this.tx = int((this.x - TILE_SIZE / 2) / TILE_SIZE);
      this.ty = int((this.y - TILE_SIZE / 2) / TILE_SIZE);

      const startX = this.tx;
      const startY = this.ty;

      let goals = new Set();

      if (this.flee) {
        // Run away: choose a tile far from the player
        let bestGoal = null;
        let bestDist = -1;
        for (let y = 0; y < ROWS; y++) {
          let row = MAP_LAYOUT[y];
          for (let x = 0; x < COLS; x++) {
            let ch = row[x];
            if (ch === "#") continue;
            let dx = x - player.tx;
            let dy = y - player.ty;
            let dist = dx * dx + dy * dy;
            if (dist > bestDist) {
              bestDist = dist;
              bestGoal = [x, y];
            }
          }
        }
        if (bestGoal === null) {
          goals.add(`${player.tx},${player.ty}`);
        } else {
          goals.add(`${bestGoal[0]},${bestGoal[1]}`);
        }
      } else {
        // Hunt nearest of player or humans
        goals.add(`${player.tx},${player.ty}`);
        for (let h of humansArr) {
          goals.add(`${h.tx},${h.ty}`);
        }
      }

      // BFS to nearest goal
      let queue = [];
      let cameFrom = {};
      let startKey = `${startX},${startY}`;
      queue.push({ x: startX, y: startY });
      cameFrom[startKey] = null;

      let directions = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ];

      let reachedKey = null;

      while (queue.length > 0) {
        let { x: cx, y: cy } = queue.shift();
        let ck = `${cx},${cy}`;

        if (goals.has(ck)) {
          reachedKey = ck;
          break;
        }

        for (let [dx, dy] of directions) {
          let nx = cx + dx;
          let ny = cy + dy;
          let nk = `${nx},${ny}`;
          if (cameFrom.hasOwnProperty(nk)) continue;
          if (!this.canMoveTo(nx, ny)) continue;
          cameFrom[nk] = ck;
          queue.push({ x: nx, y: ny });
        }
      }

      if (reachedKey !== null && reachedKey !== startKey) {
        let currentKey = reachedKey;
        let parentKey = cameFrom[currentKey];
        while (parentKey !== null && parentKey !== startKey) {
          currentKey = parentKey;
          parentKey = cameFrom[currentKey];
        }
        let parts = currentKey.split(",");
        let nextX = int(parts[0]);
        let nextY = int(parts[1]);

        let dx = nextX - startX;
        let dy = nextY - startY;
        this.dir = createVector(dx, dy);
      } else {
        this.dir = createVector(0, 0);
      }
    }

    this.x += this.dir.x * this.speed;
    this.y += this.dir.y * this.speed;

    this.rect.x = int(this.x - MINOTAUR_SIZE / 2);
    this.rect.y = int(this.y - MINOTAUR_SIZE / 2);
  }

  draw() {
    let img;
    if (this.state === "dead") {
      img = this.imageDead;
    } else if (this.flee) {
      img = this.imageScared;
    } else {
      img = this.imageNormal;
    }

    let centerX = this.rect.x + this.rect.w / 2 + UI_PANEL_WIDTH;
    let centerY = this.rect.y + this.rect.h / 2;
    image(img, centerX - MINOTAUR_SIZE / 2, centerY - MINOTAUR_SIZE / 2, MINOTAUR_SIZE, MINOTAUR_SIZE);
  }
}

// --- Build level from MAP_LAYOUT ---
function buildLevel() {
  let wallsLocal = [];
  let pelletsLocal = [];
  let gatesLocal = [];
  let playerStart = { tx: 0, ty: 0 };
  let minotaurStart = { tx: 0, ty: 0 };

  for (let rowIdx = 0; rowIdx < ROWS; rowIdx++) {
    let row = MAP_LAYOUT[rowIdx];
    for (let colIdx = 0; colIdx < COLS; colIdx++) {
      let char = row[colIdx];
      let x = colIdx * TILE_SIZE;
      let y = rowIdx * TILE_SIZE;

      if (char === "#") {
        wallsLocal.push({ x: x, y: y, w: TILE_SIZE, h: TILE_SIZE });
      } else if (char === "." || char === "o") {
        let pelletSize = int((TILE_SIZE * 3) / 8);
        let offset = int((TILE_SIZE - pelletSize) / 2);
        pelletsLocal.push({
          x: x + offset,
          y: y + offset,
          w: pelletSize,
          h: pelletSize,
        });
      } else if (char === "G") {
        gatesLocal.push({ x: x, y: y, w: TILE_SIZE, h: TILE_SIZE });
      } else if (char === "P") {
        playerStart = { tx: colIdx, ty: rowIdx };
      } else if (char === "M") {
        minotaurStart = { tx: colIdx, ty: rowIdx };
      }
    }
  }

  return {
    walls: wallsLocal,
    pellets: pelletsLocal,
    gates: gatesLocal,
    playerStart: playerStart,
    minotaurStart: minotaurStart,
  };
}

// --- Draw level + UI ---
function drawLevel(wallsArr, pelletsArr, gatesArr, survivorsCount, pelletsLeft, gatesOpenFlag) {
  // Clear UI panel on the left
  noStroke();
  fill(BLACK[0], BLACK[1], BLACK[2]);
  rect(0, 0, UI_PANEL_WIDTH, HEIGHT);

  // Draw floor tiles across the maze area (shifted right by UI_PANEL_WIDTH)
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      let x = UI_PANEL_WIDTH + col * TILE_SIZE;
      let y = row * TILE_SIZE;
      image(floorImg, x, y, TILE_SIZE, TILE_SIZE);
    }
  }

  // Draw walls
  for (let w of wallsArr) {
    image(wallImg, w.x + UI_PANEL_WIDTH, w.y, TILE_SIZE, TILE_SIZE);
  }

  // Draw gates (locked/open)
  for (let g of gatesArr) {
    let img = gatesOpenFlag ? gateOpenImg : gateLockedImg;
    image(img, g.x + UI_PANEL_WIDTH, g.y, TILE_SIZE, TILE_SIZE);
  }

  // Draw pellets as bright green circles
  fill(GREEN[0], GREEN[1], GREEN[2]);
  noStroke();
  for (let p of pelletsArr) {
    let cx = p.x + p.w / 2 + UI_PANEL_WIDTH;
    let cy = p.y + p.h / 2;
    ellipse(cx, cy, p.w, p.h);
  }

  // Separator line between UI and maze
  stroke(WHITE[0], WHITE[1], WHITE[2]);
  strokeWeight(2);
  line(UI_PANEL_WIDTH - 1, 0, UI_PANEL_WIDTH - 1, HEIGHT);
  noStroke();

  // HUD text
  fill(WHITE[0], WHITE[1], WHITE[2]);
  let hudY = 10;
  text(`Survivors: ${survivorsCount}`, 10, hudY + fontSize);
  let pelletsText;
  if (pelletsLeft > 0) {
    pelletsText = `Pellets left: ${pelletsLeft}`;
  } else if (!gatesOpenFlag) {
    pelletsText = "Slay the Minotaur!";
  } else {
    pelletsText = "Exit the Labyrinth!";
  }
  text(pelletsText, 10, hudY + fontSize * 2.5);

  // Controls
  let controlsY = hudY + 60;
  text("Controls:", 10, controlsY + fontSize);
  text("Arrow keys - move", 10, controlsY + fontSize * 2);
  text("R - restart", 10, controlsY + fontSize * 3);
  text("Q - quit", 10, controlsY + fontSize * 4);

  // Credits
  let creditsY = controlsY + 100;
  text("Kuzey Ozturac", 10, creditsY + fontSize);
  text("29 Nov 2025", 10, creditsY + fontSize * 2);
}

// --- Game over & victory overlays ---
function drawGameOverScreen() {
  // Draw the full gameover image centered over everything
  image(gameoverImg, (WIDTH - gameoverImg.width) / 2, (HEIGHT - gameoverImg.height) / 2);
}

function drawWinScreen() {
  image(victoryImg, (WIDTH - victoryImg.width) / 2, (HEIGHT - victoryImg.height) / 2);
}
