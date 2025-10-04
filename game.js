// --- GET HTML ELEMENTS ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const levelDisplay = document.getElementById('level-display');
const fallsDisplay = document.getElementById('falls-display');
const levelCompleteMessage = document.getElementById('level-complete-message');
const winMessage = document.getElementById('win-message');
// Menu Screens
const mainMenuScreen = document.getElementById('main-menu-screen');
const levelSelectScreen = document.getElementById('level-select-screen');
const customizeScreen = document.getElementById('customize-screen');
const levelGrid = document.getElementById('level-grid');
const gameElements = document.getElementById('game-elements');
// Menu Buttons
const playButton = document.getElementById('play-button');
const customizeButton = document.getElementById('customize-button');
const levelSelectBackButton = document.getElementById('level-select-back-button');
const customizeBackButton = document.getElementById('customize-back-button');
const menuButton = document.getElementById('menu-button');
// Customization Elements
const previewCanvas = document.getElementById('previewCanvas');
const pCtx = previewCanvas.getContext('2d');
const colorOptionsContainer = document.getElementById('color-options');
const eyeOptionsContainer = document.getElementById('eye-options');
const accessoryOptionsContainer = document.getElementById('accessory-options');

//Sound Toggle
let soundEnabled = true;

// --- GAME CONSTANTS ---
const GRAVITY = 0.5;
const PLAYER_SPEED = 5;
const JUMP_FORCE = 12;
const BOUNCE_FORCE = 18;
const COYOTE_TIME_FRAMES = 5;
const JUMP_BUFFER_FRAMES = 5;
const sounds = {
    jump: new Audio("sound-jump.mp3"),
    bounce: new Audio("sound-bounce.mp3"),
    collect: new Audio("sound-collect.mp3"),
    fall: new Audio("sound-scream.mp3"),
    hazard: new Audio("sound-hazard.mp3"),
    win: new Audio("sound-win.mp3"),
    bg: new Audio("sound-bg.mp3"),
    customize: new Audio("sound-babble.mp3"),
    click: new Audio("sound-click.mp3"),
    nextLevel: new Audio("sound-next-level.mp3")
};

// --- GAME STATE VARIABLES ---
let player, platforms, goal, collectibles, backgroundParticles;
let keys = {};
let currentLevel = 0;
let falls = 0;
let isPaused = false;
let animationFrameId;

// ================================================================================= //
// ============================= CUSTOMIZATION DATA ================================ //
// ================================================================================= //
const playerCustomization = {
    color: '#d8b4fe', // Default Purple
    eyeStyle: 'normal',
    accessory: 'none'
};

const colors = [ { name: 'Purple', value: '#d8b4fe' }, { name: 'Pink', value: '#ffc8dd' }, { name: 'Blue', value: '#a2d2ff' }, { name: 'Green', value: '#a0e4b2' }, { name: 'Yellow', value: '#fdfd96' }, { name: 'Orange', value: '#ffb347' }, { name: 'Gray', value: '#d3d3d3' }, { name: 'Red', value: '#ff6961' } ];

const eyeStyles = {
    'normal': (ctx, p) => { let eyeDirectionX = p.vx * 0.5; ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(p.x - p.width/4, p.y - p.height/5, 4, 0, Math.PI * 2); ctx.arc(p.x + p.width/4, p.y - p.height/5, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(p.x - p.width/4 + eyeDirectionX, p.y - p.height/5, 2, 0, Math.PI * 2); ctx.arc(p.x + p.width/4 + eyeDirectionX, p.y - p.height/5, 2, 0, Math.PI * 2); ctx.fill(); },
    'happy': (ctx, p) => { ctx.strokeStyle = 'black'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x - p.width/4, p.y - p.height/5, 3, Math.PI, 2 * Math.PI); ctx.stroke(); ctx.beginPath(); ctx.arc(p.x + p.width/4, p.y - p.height/5, 3, Math.PI, 2 * Math.PI); ctx.stroke(); },
    'angry': (ctx, p) => { ctx.strokeStyle = 'black'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p.x - p.width/2.5, p.y - p.height/3); ctx.lineTo(p.x - p.width/6, p.y - p.height/6); ctx.stroke(); ctx.beginPath(); ctx.moveTo(p.x + p.width/2.5, p.y - p.height/3); ctx.lineTo(p.x + p.width/6, p.y - p.height/6); ctx.stroke(); },
    'sparkle': (ctx, p) => { ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(p.x - p.width/4, p.y - p.height/5, 2, 0, Math.PI * 2); ctx.arc(p.x + p.width/4, p.y - p.height/5, 2, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(p.x - p.width/4 + 1, p.y - p.height/5 - 1, 1, 0, Math.PI * 2); ctx.arc(p.x + p.width/4 + 1, p.y - p.height/5 - 1, 1, 0, Math.PI * 2); ctx.fill(); }
};

const accessories = {
    'none': (ctx, p) => {},
    'beanie': (ctx, p) => {ctx.fillStyle = '#3a3a8f'; ctx.beginPath();ctx.ellipse(p.x, p.y - p.height * 0.4, p.width / 2, p.height / 2.8, 0, 0, Math.PI, true);ctx.fill(); ctx.fillStyle = '#2c2c6d';ctx.fillRect(p.x - p.width / 2, p.y - p.height * 0.4, p.width, p.height / 8);},
    'glasses': (ctx, p) => { ctx.fillStyle = '#222'; ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x - p.width/4, p.y - p.height/5, p.width/3.5, 0, Math.PI*2); ctx.stroke(); ctx.beginPath(); ctx.arc(p.x + p.width/4, p.y - p.height/5, p.width/3.5, 0, Math.PI*2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(p.x - p.width/4 + p.width/3.5, p.y - p.height/5); ctx.lineTo(p.x + p.width/4 - p.width/3.5, p.y - p.height/5); ctx.stroke(); }
};
// ============================ END OF CUSTOMIZATION DATA =========================== //

// =============================== GAME CONTENT ==================================== //
const levelThemes = [ { body: '#483d8b', canvas: '#6a5acd' }, { body: '#433881', canvas: '#6253c0' }, { body: '#3e3277', canvas: '#5a4cb3' }, { body: '#392d6d', canvas: '#5245a6' }, { body: '#342863', canvas: '#4a3e99' }, { body: '#2f2359', canvas: '#42378c' }, { body: '#2a1e4f', canvas: '#3a307f' }, { body: '#251945', canvas: '#322972' }, { body: '#20143b', canvas: '#2a2265' }, { body: '#1b0f31', canvas: '#221b58' }, { body: '#160a27', canvas: '#1a144b' }, { body: '#11051d', canvas: '#120d3e' }];
const levelCompleteTexts = 
["hi love! nakoy secret",
"you wanna know?",
"finish the game 😛",
"wowow motivated",
"careful steps!",
"you're almost there bebe!",
"patience bebe",
"hapit na hapit na",
"hint:",
"I",
"last one love go go!"];
/**
 * --- LEVEL DATA GUIDE ---
 * Each object in the `levels` array is a new level.
 *
 * A level object has the following structure:
 * {
 *   start: { x: number, y: number }, // Player's starting position
 *   platforms: [ ... ],              // Array of platform objects
 *   collectibles: [ ... ],           // Array of collectible objects
 *   goal: { x: number, y: number, size: number, platforms?: [ ... ] } // Goal star position
 * }
 *
 * --- Platform Types ---
 * Each platform object in the `platforms` array needs x, y, width, height, and a type.
 *
 * 'normal': A standard, safe platform.
 *
 * 'hazard': A dangerous platform that resets the player on touch.
 *
 * 'bouncy': A springy platform that launches the player higher.
 *
 * 'temporary': A platform that disappears on touch and reappears after a delay.
 *   - Needs `duration`: number (how long it stays visible, in frames)
 *   - Needs `respawn`: number (how long it stays hidden, in frames)
 *
 * 'moving': A platform that moves back and forth.
 *   - Needs `moveRange`: number (how far it moves from its start position)
 *   - Needs `speed`: number (how fast it moves, smaller is slower)
 *   - For horizontal movement, needs `initialX`: number (its starting X position)
 *   - For vertical movement, needs `initialY`: number (its starting Y position) and `vertical: true`
 */
const levels = [
    // Level 1: The Basics
    {
        start: { x: 50, y: 500 },
        platforms: [
            { x: 0, y: 580, width: 200, height: 20, type: 'normal' },
            { x: 300, y: 500, width: 100, height: 20, type: 'normal' },
            { x: 500, y: 420, width: 100, height: 20, type: 'normal' },
            { x: 350, y: 320, width: 80, height: 20, type: 'hazard' },
            { x: 650, y: 350, width: 150, height: 20, type: 'normal' }
        ],
        collectibles: [
            { x: 535, y: 380, size: 15 }
        ],
        goal: { x: 740, y: 300, size: 40 }
    },

    // Level 2: Bouncy Fun
    {
        start: { x: 50, y: 200 },
        platforms: [
            { x: 0, y: 580, width: 150, height: 20, type: 'normal' },
            { x: 250, y: 460, width: 100, height: 20, type: 'bouncy' },
            { x: 500, y: 400, width: 100, height: 20, type: 'normal' },
            { x: 650, y: 300, width: 100, height: 20, type: 'normal' },
            { x: 500, y: 180, width: 80, height: 20, type: 'normal' }
        ],
        collectibles: [
            { x: 100, y: 540, size: 15 },
            { x: 540, y: 360, size: 15 }
        ],
        goal: { x: 520, y: 130, size: 40 }
    },

    // Level 3: Fading Clouds
    {
        start: { x: 720, y: 100 },
        platforms: [
            { x: 680, y: 150, width: 120, height: 20, type: 'normal' },
            { x: 450, y: 250, width: 100, height: 20, type: 'temporary', duration: 100, respawn: 120 },
            { x: 200, y: 350, width: 100, height: 20, type: 'temporary', duration: 80, respawn: 150 },
            { x: 50, y: 480, width: 120, height: 20, type: 'bouncy' },
            { x: 350, y: 580, width: 150, height: 20, type: 'normal' }
        ],
        collectibles: [
            { x: 490, y: 210, size: 15 },
            { x: 240, y: 310, size: 15 }
        ],
        goal: { x: 400, y: 530, size: 40 }
    },

    // Level 4: The Leap of Faith
    {
        start: { x: 50, y: 100 },
        platforms: [
            { x: 20, y: 150, width: 100, height: 20, type: 'normal' },
            { x: 200, y: 220, width: 70, height: 20, type: 'normal' },
            { x: 350, y: 200, width: 70, height: 20, type: 'hazard' },
            { x: 450, y: 280, width: 70, height: 20, type: 'normal' },
            { x: 250, y: 400, width: 100, height: 20, type: 'temporary', duration: 60, respawn: 180 },
            { x: 100, y: 550, width: 80, height: 20, type: 'bouncy' },
            { x: 600, y: 150, width: 150, height: 20, type: 'normal' }
        ],
        collectibles: [
            { x: 230, y: 180, size: 15 },
            { x: 480, y: 240, size: 15 }
        ],
        goal: { x: 680, y: 100, size: 40 }
    },

    // Level 5: The Climb
    {
        start: { x: 50, y: 540 },
        platforms: [
            { x: 0, y: 580, width: 150, height: 20, type: 'normal' },
            { x: 250, y: 500, width: 80, height: 20, type: 'normal' },
            { x: 400, y: 420, width: 80, height: 20, type: 'normal' },
            { x: 550, y: 340, width: 80, height: 20, type: 'normal' },
            { x: 700, y: 260, width: 80, height: 20, type: 'normal' }
        ],
        collectibles: [
            { x: 430, y: 380, size: 15 }
        ],
        goal: { x: 720, y: 200, size: 40 }
    },

    // Level 6: Bouncy Castle
    {
        start: { x: 50, y: 100 },
        platforms: [
            { x: 20, y: 150, width: 100, height: 20, type: 'normal' },
            { x: 250, y: 250, width: 100, height: 20, type: 'bouncy' },
            { x: 450, y: 250, width: 30, height: 20, type: 'hazard' },
            { x: 600, y: 350, width: 100, height: 20, type: 'bouncy' },
            { x: 0, y: 580, width: 330, height: 20, type: 'bouncy' }
        ],
        collectibles: [
            { x: 420, y: 210, size: 15 }
        ],
        goal: {
            x: 700, y: 550, size: 40,
            platforms: [{ x: 565, y: 590, width: 190, height: 20, type: 'normal' }]
        }
    },

    // Level 7: Cloud Hopping
    {
        start: { x: 700, y: 540 },
        platforms: [
            { x: 650, y: 580, width: 150, height: 20, type: 'normal' },
            { x: 500, y: 500, width: 80, height: 20, type: 'temporary', duration: 40, respawn: 100 },
            { x: 350, y: 420, width: 80, height: 20, type: 'temporary', duration: 40, respawn: 100 },
            { x: 200, y: 340, width: 80, height: 20, type: 'temporary', duration: 40, respawn: 100 },
            { x: 50, y: 260, width: 80, height: 20, type: 'normal' }
        ],
        collectibles: [
            { x: 380, y: 380, size: 15 }
        ],
        goal: { x: 70, y: 200, size: 40 }
    },

    // Level 8: The Gauntlet
    {
        start: { x: 50, y: 540 },
        platforms: [
            { x: 0, y: 580, width: 150, height: 20, type: 'normal' },
            { x: 250, y: 500, width: 80, height: 20, type: 'bouncy' },
            { x: 450, y: 350, width: 80, height: 20, type: 'temporary', duration: 90, respawn: 120 },
            { x: 600, y: 300, width: 30, height: 20, type: 'hazard' },
            { x: 700, y: 230, width: 100, height: 20, type: 'normal' }
        ],
        collectibles: [
            { x: 480, y: 310, size: 15 },
            { x: 60, y: 540, size: 15 }
        ],
        goal: { x: 730, y: 120, size: 40 }
    },

    // Level 9: Galactic Highway
    {
        start: { x: 50, y: 100 },
        platforms: [
            { x: 20, y: 150, width: 100, height: 20, type: 'normal' },
            { x: 200, y: 150, width: 100, height: 20, type: 'moving', moveRange: 150, speed: 0.004, initialX: 200 },
            { x: 550, y: 250, width: 80, height: 20, type: 'normal' },
            { x: 650, y: 350, width: 20, height: 20, type: 'hazard' },
            { x: 700, y: 350, width: 20, height: 20, type: 'hazard' },
            { x: 750, y: 350, width: 20, height: 20, type: 'hazard' },
            { x: 400, y: 450, width: 100, height: 20, type: 'bouncy' },
            { x: 100, y: 350, width: 100, height: 20, type: 'temporary', duration: 120, respawn: 100 }
        ],
        collectibles: [
            { x: 400, y: 110, size: 15 },
            { x: 130, y: 310, size: 15 }
        ],
        goal: {
            x: 10, y: 550, size: 40,
            platforms: [{ x: 0, y: 590, width: 80, height: 20, type: 'normal' }]
        }
    },

    // Level 10: Precision
    {
        start: { x: 30, y: 100 },
        platforms: [
            { x: 20, y: 150, width: 40, height: 20, type: 'normal' },
            { x: 120, y: 200, width: 40, height: 20, type: 'normal' },
            { x: 220, y: 250, width: 40, height: 20, type: 'normal' },
            { x: 320, y: 300, width: 40, height: 20, type: 'normal' },
            { x: 420, y: 350, width: 40, height: 20, type: 'normal' },
            { x: 520, y: 400, width: 40, height: 20, type: 'normal' },
            { x: 620, y: 450, width: 40, height: 20, type: 'normal' }
        ],
        collectibles: [
            { x: 330, y: 260, size: 15 },
            { x: 630, y: 410, size: 15 }
        ],
        goal: {
            x: 730, y: 550, size: 40,
            platforms: [{ x: 720, y: 590, width: 80, height: 20, type: 'normal' }]
        }
    },

    // Level 11: The Elevator
    {
        start: { x: 50, y: 540 },
        platforms: [
            { x: 0, y: 580, width: 150, height: 20, type: 'normal' },
            { x: 300, y: 450, width: 100, height: 20, type: 'bouncy'},
            { x: 470, y: 300, width: 100, height: 20, type: 'temporary', duration: 50, respawn: 150 },
            { x: 250, y: 200, width: 100, height: 20, type: 'normal' },
            { x: 540, y: 170, width: 100, height: 20, type: 'bouncy'},
            { x: 650, y: 300, width: 80, height: 20, type: 'temporary', duration: 50, respawn: 150 },
        ],
        collectibles: [
            { x: 340, y: 280, size: 15 },
            { x: 520, y: 175, size: 15 },
            { x: 650, y: 250, size: 15 }
        ],
        goal: { x: 250, y: 150, size: 40 }
    },

    // Level 12: Final Ascent
    {
        start: { x: 380, y: 550 },
        platforms: [
            { x: 350, y: 590, width: 100, height: 20, type: 'normal' },
            { x: 150, y: 550, width: 80, height: 20, type: 'bouncy' },
            { x: 50, y: 400, width: 80, height: 20, type: 'temporary', duration: 50, respawn: 150 },
            { x: 250, y: 350, width: 80, height: 20, type: 'bouncy'},
            { x: 500, y: 250, width: 80, height: 20, type: 'normal' },
            { x: 650, y: 150, width: 30, height: 20, type: 'temporary', duration: 50, respawn: 150 }
        ],
        collectibles: [
            { x: 60, y: 310, size: 15 },
            { x: 530, y: 110, size: 15 }
        ],
        goal: {
            x: 750, y: 50, size: 40,
            platforms: [{ x: 720, y: 90, width: 80, height: 20, type: 'normal' }]
        }
    }
];
// ============================= END OF GAME CONTENT =============================== //

// --- DRAWING FUNCTIONS ---
function drawPlayer(p, targetCtx = ctx) { const isPreview = targetCtx !== ctx; const center = { x: isPreview ? targetCtx.canvas.width / 2 : p.x + p.width / 2, y: isPreview ? targetCtx.canvas.height / 2 + 10 : p.y + p.height / 2 }; const size = isPreview ? { width: 60, height: 60 } : { width: p.width, height: p.height }; const playerProxy = { x: center.x, y: center.y, width: size.width, height: size.height, vx: p.vx }; targetCtx.fillStyle = p.color; targetCtx.beginPath(); targetCtx.arc(playerProxy.x, playerProxy.y, playerProxy.width / 2, 0, Math.PI * 2); targetCtx.fill(); eyeStyles[p.eyeStyle](targetCtx, playerProxy); accessories[p.accessory](targetCtx, playerProxy); }
function drawPlatform(p) { if (p.isHidden) return; ctx.globalAlpha = p.alpha || 1; ctx.fillStyle = p.color; ctx.beginPath(); ctx.roundRect(p.x, p.y, p.width, p.height, 10); ctx.fill(); ctx.globalAlpha = 1; if (p.type === 'bouncy') { ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; ctx.beginPath(); ctx.arc(p.x + p.width / 2, p.y + p.height / 2, p.width / 4, 0, Math.PI * 2); ctx.fill(); } }
function drawGoal(g) { ctx.save(); ctx.translate(g.x + g.size / 2, g.y + g.size / 2); ctx.rotate(Date.now() / 400); ctx.fillStyle = '#FFD700'; ctx.strokeStyle = '#FDB813'; ctx.lineWidth = 3; let step = Math.PI / 5; ctx.beginPath(); for (let i = 0; i < 10; i++) { const radius = i % 2 === 0 ? g.size / 2 : g.size / 4; ctx.lineTo(Math.cos(i * step - Math.PI / 2) * radius, Math.sin(i * step - Math.PI / 2) * radius); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
function drawCollectible(c) { ctx.save(); ctx.translate(c.x + c.size / 2, c.y + c.size / 2); ctx.rotate(-Date.now() / 300); ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -c.size / 2); ctx.lineTo(c.size / 2, 0); ctx.lineTo(0, c.size / 2); ctx.lineTo(-c.size / 2, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
function drawBackground() { ctx.clearRect(0, 0, canvas.width, canvas.height); backgroundParticles.forEach(p => { p.y -= p.speed; p.x += Math.sin(p.y / p.sway) * p.swaySpeed; if (p.y < -p.size) p.y = canvas.height + p.size; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); }); }

// --- GAME LIFECYCLE & UI MANAGEMENT ---
function showScreen(screen) { [mainMenuScreen, levelSelectScreen, customizeScreen, gameElements].forEach(s => s.classList.add('hidden')); screen.classList.remove('hidden'); }
function startGame(levelIndex) {
     sounds.bg.loop = true;       
    sounds.bg.currentTime = 0; 
    if (soundEnabled) sounds.bg.play(); 
    showScreen(gameElements); currentLevel = levelIndex; falls = 0; isPaused = false;  winMessage.classList.add('hidden'); loadLevel(currentLevel); if (!animationFrameId) gameLoop(); }
function initializeUI() { backgroundParticles = []; for (let i = 0; i < 50; i++) { backgroundParticles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 2 + 1, speed: Math.random() * 0.5 + 0.1, sway: Math.random() * 50 + 50, swaySpeed: Math.random() * 0.2 - 0.1, color: `rgba(230, 230, 250, ${Math.random() * 0.5 + 0.1})` }); } levelGrid.innerHTML = '';
levels.forEach((level, index) => { const button = document.createElement('button'); button.textContent = index + 1; button.className = 'level-button'; button.onclick = () =>{
        sounds.click.currentTime = 0;
        if (soundEnabled) sounds.click.play();
        startGame(index);};
        levelGrid.appendChild(button); }); colors.forEach(c => { const swatch = document.createElement('div'); swatch.className = 'color-swatch'; swatch.style.backgroundColor = c.value; swatch.dataset.color = c.value; colorOptionsContainer.appendChild(swatch); }); Object.keys(eyeStyles).forEach(key => { const button = document.createElement('button'); button.className = 'option-button'; button.textContent = key; button.dataset.eye = key; eyeOptionsContainer.appendChild(button); }); Object.keys(accessories).forEach(key => { const button = document.createElement('button'); button.className = 'option-button'; button.textContent = key; button.dataset.accessory = key; accessoryOptionsContainer.appendChild(button); }); document.querySelector('.customize-options').addEventListener('click', e => { const target = e.target; if (target.dataset.color) playerCustomization.color = target.dataset.color; if (target.dataset.eye) playerCustomization.eyeStyle = target.dataset.eye; if (target.dataset.accessory) playerCustomization.accessory = target.dataset.accessory; updateCustomizeSelection(); drawPreview(); }); updateCustomizeSelection(); drawPreview(); }
function updateCustomizeSelection() {
    sounds.customize.loop = true;     
    sounds.customize.currentTime = 0; 
    if (soundEnabled) sounds.customize.play(); 
    document.querySelectorAll('.color-swatch').forEach(el => el.classList.toggle('selected', el.dataset.color === playerCustomization.color)); document.querySelectorAll('[data-eye]').forEach(el => el.classList.toggle('selected', el.dataset.eye === playerCustomization.eyeStyle)); document.querySelectorAll('[data-accessory]').forEach(el => el.classList.toggle('selected', el.dataset.accessory === playerCustomization.accessory)); }
function drawPreview() { pCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height); const previewBlob = { ...playerCustomization, vx: 0, width: 60, height: 60 }; drawPlayer(previewBlob, pCtx); }
function loadLevel(levelIndex) { const level = levels[levelIndex]; player = { x: level.start.x, y: level.start.y, vx: 0, vy: 0, width: 30, height: 30, baseWidth: 30, baseHeight: 30, isGrounded: false, coyoteTimeCounter: 0, jumpBufferCounter: 0, landingSquashTimer: 0, ...playerCustomization }; goal = { ...level.goal }; collectibles = JSON.parse(JSON.stringify(level.collectibles)); const theme = levelThemes[levelIndex]; document.body.style.backgroundColor = theme.body; canvas.style.backgroundColor = theme.canvas; const allPlatforms = level.platforms.concat(level.goal.platforms || []); platforms = allPlatforms.map(p => { const platformColors = { normal: '#bfa7e0', hazard: '#ffafcc', bouncy: '#a0e4b2', temporary: '#f0e68c', moving: '#f6d8ac' }; return { ...p, color: platformColors[p.type], timer: 0, alpha: 1, isHidden: false, prevX: p.x, prevY: p.y }; }); updateHUD(); }
function resetPlayer() { falls++; loadLevel(currentLevel); }

// --- CORE UPDATE LOGIC ---
function handlePlayerAnimation() { const oldHeight = player.height; if (player.landingSquashTimer > 0) { player.landingSquashTimer--; const squashRatio = Math.sin((1 - player.landingSquashTimer / 15) * Math.PI); player.height = player.baseHeight - player.baseHeight * 0.3 * squashRatio; player.width = player.baseWidth + player.baseWidth * 0.4 * squashRatio; } else { player.height = player.baseHeight; player.width = player.baseWidth; } player.y += oldHeight - player.height; }
function handleInputAndJumping() { if (player.coyoteTimeCounter > 0) player.coyoteTimeCounter--; if (player.jumpBufferCounter > 0) player.jumpBufferCounter--; player.vx = 0; if (keys['ArrowLeft'] || keys['a']) player.vx = -PLAYER_SPEED; if (keys['ArrowRight'] || keys['d']) player.vx = PLAYER_SPEED; if (keys['Space'] || keys['ArrowUp'] || keys['w']) { if (player.jumpBufferCounter <= 0) player.jumpBufferCounter = JUMP_BUFFER_FRAMES; }
if (player.jumpBufferCounter > 0 && (player.isGrounded || player.coyoteTimeCounter > 0))
    { player.vy = -JUMP_FORCE; player.isGrounded = false; if (soundEnabled) sounds.bounce.play(); player.jumpBufferCounter = 0; player.coyoteTimeCounter = 0; } if (player.vy < 0 && !(keys['Space'] || keys['ArrowUp'] || keys['w'])) { player.vy += GRAVITY * 1.5; } }
function applyPhysicsAndCollisions() { player.vy += GRAVITY; player.x += player.vx; player.y += player.vy; const wasGrounded = player.isGrounded; player.isGrounded = false; platforms.forEach(p => { p.prevX = p.x; p.prevY = p.y; if (p.type === 'moving') { if (p.vertical) { p.y = p.initialY + Math.sin(Date.now() * p.speed) * p.moveRange; } else { p.x = p.initialX + Math.sin(Date.now() * p.speed) * p.moveRange; } } if (p.type === 'temporary') { if (p.timer > 0) { p.timer--; p.alpha = Math.max(0, p.timer / p.duration); if (p.timer <= 0) p.isHidden = true; } else if (p.isHidden && p.timer < -p.respawn) { p.isHidden = false; p.alpha = 1; p.timer = 0; } } if (p.isHidden) return; if (player.x < p.x + p.width && player.x + player.width > p.x && player.y < p.y + p.height && player.y + player.height > p.y) {
if (p.type === 'hazard') {
    if (soundEnabled) sounds.hazard.play();
    return resetPlayer();
}
if (player.vy >= 0 && (player.y + player.height - player.vy) <= p.y + 1) { player.y = p.y - player.height; player.vy = 0; player.isGrounded = true; if (!wasGrounded) { player.landingSquashTimer = 15; }
if (p.type === 'moving') {
    player.x += p.x - p.prevX;
    player.y += p.y - p.prevY;
} 
if (p.type === 'bouncy') {
    player.vy = -BOUNCE_FORCE;
    if (soundEnabled) sounds.jump.play();
}
if (p.type === 'temporary') {
    if (p.timer === 0) {
        p.timer = p.duration;}
    }
} } }); if (!player.isGrounded && wasGrounded) { player.coyoteTimeCounter = COYOTE_TIME_FRAMES; } 
collectibles = collectibles.filter(c => {if (
        player.x < c.x + c.size &&
        player.x + player.width > c.x &&
        player.y < c.y + c.size &&
        player.y + player.height > c.y
    ) {
        if (soundEnabled) sounds.collect.play();
        return false; // collected
    }
    return true;
});
}
function checkBoundsAndWinCondition() {
    if (player.y > canvas.height + 50) {
    sounds.fall.currentTime = 0;
    if (soundEnabled) sounds.fall.play();
    resetPlayer();
    }
    if (player.x < 0) player.x = 0; if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    if (collectibles.length === 0 && player.x < goal.x + goal.size && player.x + player.width > goal.x && player.y < goal.y + goal.size && player.y + player.height > goal.y) { 
        sounds.nextLevel.currentTime = 0;
        if (soundEnabled) sounds.nextLevel.play();
        isPaused = true; const oldLevel = currentLevel; currentLevel++; if (currentLevel >= levels.length) { 
                    sounds.bg.pause(); 
                    sounds.bg.currentTime = 0;
                    sounds.bg.loop = false; 
                    sounds.win.currentTime = 0;
                    if (soundEnabled) sounds.win.play();
            let fallText = `wiwiwi with ${falls} falls, <br> you did well!`;
    if (falls === 0) fallText = "What a flawless run!";
    if (falls === 1) fallText = "Wow! with only 1 fall!";
    winMessage.innerHTML =
    `<div style="font-size: 0.7em; opacity: 0.8;">${fallText}</div>
    <div style="font-size: 0.7em; opacity: 0.8;">I'm so proud of you lovey!</div>
    <div style="font-size: 0.5em; opacity: 0.8;"><br>Secret: I love you!💜🤗</div>
     <div style="margin-top: 15px;">
    <button id="win-play-again-button">Main Menu</button></div>`;
    document.getElementById('win-play-again-button').addEventListener('click', () => {
        sounds.click.currentTime = 0;
        if (soundEnabled) sounds.click.play();

        showScreen(mainMenuScreen)}); winMessage.classList.remove('hidden'); } else { const msgSpan = levelCompleteMessage.querySelector('span'); msgSpan.textContent = levelCompleteTexts[oldLevel]; levelCompleteMessage.classList.remove('hidden'); setTimeout(() => { levelCompleteMessage.classList.add('hidden'); loadLevel(currentLevel); isPaused = false; }, 2000); } } }
function updateHUD() { levelDisplay.textContent = currentLevel + 1; fallsDisplay.textContent = falls; }

// --- GAME LOOP ---
function gameLoop() {
    if (!isPaused) {
        handlePlayerAnimation(); handleInputAndJumping(); applyPhysicsAndCollisions(); checkBoundsAndWinCondition();
    }
    drawBackground();
    platforms.forEach(drawPlatform);
    collectibles.forEach(drawCollectible);
    drawGoal(goal);
    drawPlayer(player);
    animationFrameId = requestAnimationFrame(gameLoop);
}

// --- EVENT LISTENERS ---
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);
playButton.addEventListener('click', () => showScreen(levelSelectScreen));
customizeButton.addEventListener('click', () => showScreen(customizeScreen));
levelSelectBackButton.addEventListener('click', () => showScreen(mainMenuScreen));
customizeBackButton.addEventListener('click', () => showScreen(mainMenuScreen));
menuButton.addEventListener('click', () => { if(animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; } showScreen(mainMenuScreen); });
menuButton.addEventListener('click', () => {
    sounds.click.currentTime = 0;
    if (soundEnabled) sounds.click.play();
    sounds.bg.pause(); 
    sounds.bg.currentTime = 0;
    sounds.bg.loop = false; 
});
playButton.addEventListener('click', () => {
    sounds.click.currentTime = 0;
    if (soundEnabled) sounds.click.play();
    sounds.customize.pause(); 
    sounds.customize.currentTime = 0;
    sounds.customize.loop = false; 
});
customizeButton.addEventListener('click', () => {
    sounds.click.currentTime = 0;
    if (soundEnabled) sounds.click.play();
});
levelSelectBackButton.addEventListener('click', () => {
    sounds.click.currentTime = 0;
    if (soundEnabled) sounds.click.play();
});
customizeBackButton.addEventListener('click', () => {
    sounds.click.currentTime = 0;
    if (soundEnabled) sounds.click.play();
    sounds.customize.pause(); 
    sounds.customize.currentTime = 0;
    sounds.customize.loop = false; 
});

function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('sound-toggle');
    btn.textContent = soundEnabled ? '🔊 Sound On' : '🔇 Sound Off';

    Object.values(sounds).forEach(s => {
        s.muted = !soundEnabled; // mute/unmute instead of pausing
    });

    // Handle background music separately
    const bgMusic = document.getElementById('bg-music');
    if (soundEnabled) {
        bgMusic.loop = true;
        bgMusic.play().catch(() => {}); // start playing if not already
    } else {
        bgMusic.pause();
    }
}

// Event listener
document.getElementById('sound-toggle').addEventListener('click', toggleSound);

// --- STARTUP ---
initializeUI();
showScreen(mainMenuScreen);

document.getElementById('home-button').addEventListener('click', () => {
    window.location.href = 'index.html';
});
